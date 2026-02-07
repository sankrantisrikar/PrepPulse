import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const API_BASE = '/api';

export default function App() {
  const [stage, setStage] = useState('setup'); // setup, interview, report
  const [resume, setResume] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [fallbackImage, setFallbackImage] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [report, setReport] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const videoRef = useRef(null);

  // Auto-play video when URL changes
  useEffect(() => {
    if (videoUrl && videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(console.error);
    }
  }, [videoUrl]);

  // Auto-play audio fallback
  useEffect(() => {
    if (audioUrl && fallbackImage) {
      const audio = new Audio(audioUrl);
      audio.play().catch(console.error);
    }
  }, [audioUrl, fallbackImage]);

  const startInterview = async () => {
    if (!resume.trim() || !jobDescription.trim()) {
      setError('Please provide both resume and job description');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE}/start`, {
        resume,
        jobDescription,
      });

      setSessionId(response.data.sessionId);
      setCurrentQuestion(response.data.question);
      setVideoUrl(response.data.videoUrl);
      setAudioUrl(response.data.audioUrl);
      setFallbackImage(response.data.fallbackImage);
      setQuestionNumber(response.data.questionNumber);
      setStage('interview');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start interview');
    } finally {
      setIsProcessing(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
    } catch (err) {
      setError('Microphone access denied. Please enable microphone permissions.');
    }
  };

  const stopRecording = () => {
    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        resolve(audioBlob);
      };

      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    });
  };

  const submitAnswer = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const audioBlob = await stopRecording();
      
      const formData = new FormData();
      formData.append('sessionId', sessionId);
      formData.append('audio', audioBlob, 'answer.webm');

      const response = await axios.post(`${API_BASE}/answer`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setFeedback({
        transcription: response.data.transcription,
        scores: response.data.scores,
        feedback: response.data.feedback,
      });

      if (response.data.completed) {
        // Interview complete
        setTimeout(() => {
          setFeedback(null);
        }, 3000);
      } else {
        // Next question
        setTimeout(() => {
          setCurrentQuestion(response.data.nextQuestion);
          setVideoUrl(response.data.videoUrl);
          setAudioUrl(response.data.audioUrl);
          setFallbackImage(response.data.fallbackImage);
          setQuestionNumber(response.data.questionNumber);
          setFeedback(null);
        }, 5000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process answer');
      setIsRecording(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const endInterview = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE}/end`, { sessionId });
      setReport(response.data.report);
      setStage('report');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate report');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadReport = async () => {
    try {
      const response = await axios.get(`${API_BASE}/export/${sessionId}`);
      const blob = new Blob([JSON.stringify(response.data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `interview-report-${sessionId}.json`;
      a.click();
    } catch (err) {
      setError('Failed to download report');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🎯 Interview Buddy</h1>
        <p style={styles.subtitle}>AI-Powered Interview Practice with Talking Avatar</p>

        {error && (
          <div style={styles.error}>
            ⚠️ {error}
          </div>
        )}

        {stage === 'setup' && (
          <div style={styles.setup}>
            <textarea
              style={styles.textarea}
              placeholder="Paste your resume here..."
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              rows={8}
            />
            <textarea
              style={styles.textarea}
              placeholder="Paste the job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={8}
            />
            <button
              style={styles.button}
              onClick={startInterview}
              disabled={isProcessing}
            >
              {isProcessing ? '🔄 Starting Interview...' : '🚀 Start Interview'}
            </button>
          </div>
        )}

        {stage === 'interview' && (
          <div style={styles.interview}>
            <div style={styles.questionHeader}>
              <span style={styles.badge}>Question {questionNumber}</span>
            </div>

            <div style={styles.avatarContainer}>
              {videoUrl ? (
                <video
                  ref={videoRef}
                  style={styles.video}
                  src={videoUrl}
                  autoPlay
                  playsInline
                />
              ) : fallbackImage ? (
                <img
                  style={styles.fallbackImage}
                  src={fallbackImage}
                  alt="Interviewer"
                />
              ) : (
                <div style={styles.loading}>🎬 Generating avatar...</div>
              )}
            </div>

            <div style={styles.questionBox}>
              <p style={styles.question}>{currentQuestion}</p>
            </div>

            {feedback && (
              <div style={styles.feedback}>
                <h3 style={styles.feedbackTitle}>📊 Your Answer Feedback</h3>
                <div style={styles.scores}>
                  <div style={styles.scoreItem}>
                    <span>Clarity:</span>
                    <span style={styles.scoreValue}>{feedback.scores.clarity}/10</span>
                  </div>
                  <div style={styles.scoreItem}>
                    <span>Depth:</span>
                    <span style={styles.scoreValue}>{feedback.scores.depth}/10</span>
                  </div>
                  <div style={styles.scoreItem}>
                    <span>Relevance:</span>
                    <span style={styles.scoreValue}>{feedback.scores.relevance}/10</span>
                  </div>
                  <div style={styles.scoreItem}>
                    <span>Structure:</span>
                    <span style={styles.scoreValue}>{feedback.scores.structure}/10</span>
                  </div>
                </div>
                <ul style={styles.feedbackList}>
                  {feedback.feedback.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            <div style={styles.controls}>
              {!isRecording && !isProcessing && !feedback && (
                <button style={styles.recordButton} onClick={startRecording}>
                  🎤 Start Recording Answer
                </button>
              )}

              {isRecording && (
                <button style={styles.stopButton} onClick={submitAnswer}>
                  ⏹️ Stop & Submit Answer
                </button>
              )}

              {isProcessing && (
                <div style={styles.processing}>
                  🔄 Processing your answer...
                </div>
              )}

              <button
                style={styles.endButton}
                onClick={endInterview}
                disabled={isProcessing || isRecording}
              >
                🏁 End Interview
              </button>
            </div>
          </div>
        )}

        {stage === 'report' && report && (
          <div style={styles.report}>
            <h2 style={styles.reportTitle}>📈 Interview Performance Report</h2>
            
            <div style={styles.overallScore}>
              <h3>Overall Score</h3>
              <div style={styles.bigScore}>{report.overallScore}/10</div>
              <p>{report.assessment}</p>
            </div>

            <div style={styles.scoreBreakdown}>
              <h3>Score Breakdown</h3>
              <div style={styles.scores}>
                <div style={styles.scoreItem}>
                  <span>Clarity:</span>
                  <span style={styles.scoreValue}>{report.scoreBreakdown.clarity}/10</span>
                </div>
                <div style={styles.scoreItem}>
                  <span>Depth:</span>
                  <span style={styles.scoreValue}>{report.scoreBreakdown.depth}/10</span>
                </div>
                <div style={styles.scoreItem}>
                  <span>Relevance:</span>
                  <span style={styles.scoreValue}>{report.scoreBreakdown.relevance}/10</span>
                </div>
                <div style={styles.scoreItem}>
                  <span>Structure:</span>
                  <span style={styles.scoreValue}>{report.scoreBreakdown.structure}/10</span>
                </div>
              </div>
            </div>

            <div style={styles.section}>
              <h3>💪 Strengths</h3>
              {report.strengths.map((strength, idx) => (
                <div key={idx} style={styles.strengthItem}>
                  <strong>{strength.area}</strong> (Score: {strength.score}/10)
                  <p>{strength.evidence}</p>
                </div>
              ))}
            </div>

            <div style={styles.section}>
              <h3>🎯 Areas for Improvement</h3>
              {report.weaknesses.map((weakness, idx) => (
                <div key={idx} style={styles.weaknessItem}>
                  <strong>{weakness.area}</strong> (Score: {weakness.score}/10)
                  <p>{weakness.evidence}</p>
                </div>
              ))}
            </div>

            <div style={styles.section}>
              <h3>📅 7-Day Practice Plan</h3>
              {Object.entries(report.practicePlan).map(([day, plan]) => (
                <div key={day} style={styles.dayPlan}>
                  <h4>{day.replace('-', ' ').toUpperCase()}: {plan.focus}</h4>
                  <ul>
                    {plan.exercises.map((exercise, idx) => (
                      <li key={idx}>{exercise}</li>
                    ))}
                  </ul>
                  <p style={styles.successCriteria}>
                    ✅ Success: {plan.successCriteria}
                  </p>
                </div>
              ))}
            </div>

            <div style={styles.actions}>
              <button style={styles.button} onClick={downloadReport}>
                💾 Download Full Report
              </button>
              <button
                style={styles.secondaryButton}
                onClick={() => {
                  setStage('setup');
                  setSessionId(null);
                  setReport(null);
                  setResume('');
                  setJobDescription('');
                }}
              >
                🔄 Start New Interview
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    padding: '20px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    padding: '40px',
    maxWidth: '900px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '8px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: '32px',
  },
  error: {
    background: '#fee',
    border: '1px solid #fcc',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '20px',
    color: '#c33',
  },
  setup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '2px solid #ddd',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  button: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '16px 32px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  secondaryButton: {
    background: '#f0f0f0',
    color: '#333',
    border: 'none',
    borderRadius: '8px',
    padding: '16px 32px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  interview: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  questionHeader: {
    display: 'flex',
    justifyContent: 'center',
  },
  badge: {
    background: '#667eea',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  avatarContainer: {
    width: '100%',
    height: '400px',
    background: '#f5f5f5',
    borderRadius: '12px',
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  fallbackImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  loading: {
    fontSize: '18px',
    color: '#999',
  },
  questionBox: {
    background: '#f9f9f9',
    padding: '20px',
    borderRadius: '12px',
    borderLeft: '4px solid #667eea',
  },
  question: {
    fontSize: '18px',
    lineHeight: '1.6',
    color: '#333',
  },
  feedback: {
    background: '#f0f8ff',
    padding: '20px',
    borderRadius: '12px',
    border: '2px solid #667eea',
  },
  feedbackTitle: {
    marginBottom: '16px',
    color: '#667eea',
  },
  scores: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    marginBottom: '16px',
  },
  scoreItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 12px',
    background: 'white',
    borderRadius: '6px',
  },
  scoreValue: {
    fontWeight: 'bold',
    color: '#667eea',
  },
  feedbackList: {
    marginLeft: '20px',
    lineHeight: '1.8',
  },
  controls: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  recordButton: {
    background: '#22c55e',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '16px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  stopButton: {
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '16px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  endButton: {
    background: '#f59e0b',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  processing: {
    textAlign: 'center',
    padding: '16px',
    background: '#f0f0f0',
    borderRadius: '8px',
    fontSize: '16px',
  },
  report: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  reportTitle: {
    textAlign: 'center',
    color: '#667eea',
  },
  overallScore: {
    textAlign: 'center',
    padding: '24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '12px',
    color: 'white',
  },
  bigScore: {
    fontSize: '48px',
    fontWeight: 'bold',
    margin: '16px 0',
  },
  scoreBreakdown: {
    padding: '20px',
    background: '#f9f9f9',
    borderRadius: '12px',
  },
  section: {
    padding: '20px',
    background: '#f9f9f9',
    borderRadius: '12px',
  },
  strengthItem: {
    marginBottom: '16px',
    padding: '12px',
    background: '#e8f5e9',
    borderRadius: '8px',
  },
  weaknessItem: {
    marginBottom: '16px',
    padding: '12px',
    background: '#fff3e0',
    borderRadius: '8px',
  },
  dayPlan: {
    marginBottom: '20px',
    padding: '16px',
    background: 'white',
    borderRadius: '8px',
    border: '2px solid #e0e0e0',
  },
  successCriteria: {
    marginTop: '12px',
    fontStyle: 'italic',
    color: '#22c55e',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },
};
