// Interview Buddy Backend Server
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import {
  callOpenRouter,
  generateSpeech,
  generateAvatarVideo,
  transcribeAudio,
  uploadToS3,
  getFromS3,
  uploadAudioToS3,
} from './services.js';
import {
  SYSTEM_PROMPT,
  INITIAL_QUESTIONS_PROMPT,
  QUESTION_GENERATION_PROMPT,
  FOLLOW_UP_PROMPT,
  SCORING_PROMPT,
  FINAL_REPORT_PROMPT,
} from './prompts.js';

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '50mb' }));

// In-memory session storage (for MVP)
const sessions = new Map();

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// POST /api/start - Initialize interview session
app.post('/api/start', async (req, res) => {
  try {
    const { resume, jobDescription } = req.body;

    if (!resume || !jobDescription) {
      return res.status(400).json({ error: 'Resume and job description required' });
    }

    const sessionId = uuidv4();
    
    console.log(`[${sessionId}] Starting new session...`);

    // Generate initial question set
    const questionsPrompt = INITIAL_QUESTIONS_PROMPT(resume, jobDescription);
    const questionSet = await callOpenRouter(questionsPrompt, SYSTEM_PROMPT, 0.8);

    if (!Array.isArray(questionSet)) {
      throw new Error('Failed to generate question set');
    }

    const firstQuestion = questionSet[0];

    // Generate speech for first question
    console.log(`[${sessionId}] Generating speech...`);
    const audioBuffer = await generateSpeech(firstQuestion.question);
    const audioUrl = await uploadAudioToS3(audioBuffer, sessionId, 0);

    // Generate avatar video (with fallback)
    console.log(`[${sessionId}] Generating avatar video...`);
    let avatarVideo = null;
    try {
      avatarVideo = await generateAvatarVideo(firstQuestion.question, audioUrl);
    } catch (error) {
      console.warn(`[${sessionId}] Avatar generation failed, using fallback`);
    }

    // Initialize session
    const session = {
      sessionId,
      resume,
      jobDescription,
      questionSet,
      currentQuestionIndex: 0,
      interactions: [],
      topicDepth: {}, // Track depth per topic
      coveredTopics: [firstQuestion.topic],
      startTime: new Date().toISOString(),
    };

    sessions.set(sessionId, session);

    // Save to S3 (async, don't wait)
    uploadToS3(`sessions/${sessionId}/session.json`, session).catch(console.error);

    res.json({
      sessionId,
      question: firstQuestion.question,
      topic: firstQuestion.topic,
      audioUrl,
      videoUrl: avatarVideo?.videoUrl || null,
      fallbackImage: avatarVideo ? null : 'https://create-images-results.d-id.com/default-presenter-image.jpg',
      questionNumber: 1,
      totalQuestions: questionSet.length,
    });

  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/answer - Submit answer and get next question
app.post('/api/answer', upload.single('audio'), async (req, res) => {
  try {
    const { sessionId } = req.body;
    const audioFile = req.file;

    if (!sessionId || !audioFile) {
      return res.status(400).json({ error: 'Session ID and audio file required' });
    }

    const session = sessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    console.log(`[${sessionId}] Processing answer...`);

    // Transcribe audio
    const transcription = await transcribeAudio(audioFile.buffer, audioFile.originalname);
    console.log(`[${sessionId}] Transcription: ${transcription.substring(0, 100)}...`);

    const currentQuestion = session.questionSet[session.currentQuestionIndex];
    const currentTopic = currentQuestion.topic;

    // Score the answer
    const scoringPrompt = SCORING_PROMPT(
      currentQuestion.question,
      transcription,
      session.resume,
      session.jobDescription
    );
    const scoring = await callOpenRouter(scoringPrompt, SYSTEM_PROMPT, 0.3);

    // Update topic depth
    session.topicDepth[currentTopic] = (session.topicDepth[currentTopic] || 0) + 1;
    const currentDepth = session.topicDepth[currentTopic];

    console.log(`[${sessionId}] Topic: ${currentTopic}, Depth: ${currentDepth}`);

    // Store interaction
    session.interactions.push({
      questionNumber: session.currentQuestionIndex + 1,
      question: currentQuestion.question,
      topic: currentTopic,
      answer: transcription,
      scores: scoring.scores,
      feedback: scoring.feedback,
      timestamp: new Date().toISOString(),
    });

    // Adaptive logic: follow-up or new topic?
    let nextQuestion;
    let isFollowUp = false;

    if (currentDepth < 5) {
      // Generate follow-up on same topic
      console.log(`[${sessionId}] Generating follow-up (depth ${currentDepth})...`);
      const followUpPrompt = FOLLOW_UP_PROMPT(
        currentQuestion.question,
        transcription,
        currentTopic,
        currentDepth
      );
      nextQuestion = await callOpenRouter(followUpPrompt, SYSTEM_PROMPT, 0.7);
      isFollowUp = true;
    } else {
      // Move to next topic
      console.log(`[${sessionId}] Moving to new topic (depth ${currentDepth} >= 5)...`);
      session.currentQuestionIndex++;

      if (session.currentQuestionIndex >= session.questionSet.length) {
        // No more questions, end session
        return res.json({
          completed: true,
          transcription,
          scores: scoring.scores,
          feedback: scoring.feedback,
          message: 'Interview complete! Click "End Interview" to see your report.',
        });
      }

      nextQuestion = session.questionSet[session.currentQuestionIndex];
      session.coveredTopics.push(nextQuestion.topic);
      session.topicDepth[nextQuestion.topic] = 0;
    }

    // Generate speech and video for next question
    const audioBuffer = await generateSpeech(nextQuestion.question);
    const audioUrl = await uploadAudioToS3(
      audioBuffer,
      sessionId,
      session.interactions.length
    );

    let avatarVideo = null;
    try {
      avatarVideo = await generateAvatarVideo(nextQuestion.question, audioUrl);
    } catch (error) {
      console.warn(`[${sessionId}] Avatar generation failed for next question`);
    }

    // Update session
    sessions.set(sessionId, session);
    uploadToS3(`sessions/${sessionId}/session.json`, session).catch(console.error);

    res.json({
      transcription,
      scores: scoring.scores,
      feedback: scoring.feedback,
      nextQuestion: nextQuestion.question,
      topic: nextQuestion.topic,
      audioUrl,
      videoUrl: avatarVideo?.videoUrl || null,
      fallbackImage: avatarVideo ? null : 'https://create-images-results.d-id.com/default-presenter-image.jpg',
      questionNumber: session.interactions.length + 1,
      isFollowUp,
      completed: false,
    });

  } catch (error) {
    console.error('Answer processing error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/end - Finalize session and generate report
app.post('/api/end', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }

    const session = sessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    console.log(`[${sessionId}] Generating final report...`);

    // Generate comprehensive report
    const reportPrompt = FINAL_REPORT_PROMPT({
      resume: session.resume.substring(0, 1000),
      jobDescription: session.jobDescription.substring(0, 1000),
      interactions: session.interactions,
      totalQuestions: session.interactions.length,
      coveredTopics: session.coveredTopics,
    });

    const report = await callOpenRouter(reportPrompt, SYSTEM_PROMPT, 0.5);

    session.endTime = new Date().toISOString();
    session.report = report;

    // Save final session to S3
    await uploadToS3(`sessions/${sessionId}/final_report.json`, {
      ...session,
      report,
    });

    res.json({
      sessionId,
      report,
      totalQuestions: session.interactions.length,
      duration: Math.round(
        (new Date(session.endTime) - new Date(session.startTime)) / 1000 / 60
      ),
    });

  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/export/:sessionId - Export session data
app.get('/api/export/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = sessions.get(sessionId);
    if (!session) {
      // Try to fetch from S3
      try {
        const s3Data = await getFromS3(`sessions/${sessionId}/final_report.json`);
        return res.json(s3Data);
      } catch {
        return res.status(404).json({ error: 'Session not found' });
      }
    }

    res.json(session);

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Interview Buddy backend running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});
