import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const API_BASE = '/api';

// Modern gradient background component
const GradientBackground = () => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    zIndex: -1,
  }}>
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3), transparent 50%), radial-gradient(circle at 80% 80%, rgba(252, 70, 107, 0.3), transparent 50%)',
      animation: 'pulse 8s ease-in-out infinite',
    }} />
  </div>
);

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
      <GradientBackground />
      
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🎯</span>
          <span style={styles.logoText}>PrepPulse</span>
        </div>
        <nav style={styles.nav}>
          <a href="#features" style={styles.navLink}>Features</a>
          <a href="#how-it-works" style={styles.navLink}>How It Works</a>
          <a href="#pricing" style={styles.navLink}>Pricing</a>
        </nav>
      </header>

      <div style={styles.card}>
        {error && (
          <div style={styles.error}>
            ⚠️ {error}
          </div>
        )}

        {stage === 'setup' && (
          <div style={styles.setup}>
            <div style={styles.hero}>
              <h1 style={styles.heroTitle}>
                Ace Your Next Interview
              </h1>
              <p style={styles.heroSubtitle}>
                Practice with an AI interviewer that adapts to your answers, provides real-time feedback, and helps you improve with personalized coaching.
              </p>
            </div>

            <div style={styles.features}>
              <div style={styles.featureCard} className="feature-card">
                <span style={styles.featureIcon}>🎥</span>
                <h3 style={styles.featureTitle}>Talking AI Avatar</h3>
                <p style={styles.featureText}>Realistic video interviewer with lip-sync</p>
              </div>
              <div style={styles.featureCard} className="feature-card">
                <span style={styles.featureIcon}>🎤</span>
                <h3 style={styles.featureTitle}>Voice Conversation</h3>
                <p style={styles.featureText}>Natural speech-based Q&A</p>
              </div>
              <div style={styles.featureCard} className="feature-card">
                <span style={styles.featureIcon}>🧠</span>
                <h3 style={styles.featureTitle}>Adaptive Questions</h3>
                <p style={styles.featureText}>Personalized to your resume & job</p>
              </div>
              <div style={styles.featureCard} className="feature-card">
                <span style={styles.featureIcon}>📊</span>
                <h3 style={styles.featureTitle}>Real-Time Scoring</h3>
                <p style={styles.featureText}>Instant feedback on every answer</p>
              </div>
            </div>

            <div style={styles.inputSection}>
              <h2 style={styles.sectionTitle}>Start Your Practice Interview</h2>
              <textarea
                style={styles.textarea}
                placeholder="📄 Paste your resume here..."
                value={resume}
                onChange={(e) => setResume(e.target.value)}
                rows={8}
              />
              <textarea
                style={styles.textarea}
                placeholder="💼 Paste the job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={8}
              />
              <button
                style={styles.primaryButton}
                onClick={startInterview}
                disabled={isProcessing}
              >
                {isProcessing ? '🔄 Preparing Your Interview...' : '🚀 Start Interview'}
              </button>
            </div>
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
                <div key={day} style={styles.dayPlan} className="day-plan">
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
    position: 'relative',
    overflow: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 40px',
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoIcon: {
    fontSize: '32px',
  },
  logoText: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: '-0.5px',
  },
  nav: {
    display: 'flex',
    gap: '32px',
  },
  navLink: {
    color: 'white',
    textDecoration: 'none',
    fontSize: '16px',
    fontWeight: '500',
    transition: 'opacity 0.2s',
    opacity: 0.9,
  },
  card: {
    maxWidth: '1200px',
    margin: '40px auto',
    padding: '40px',
  },
  hero: {
    textAlign: 'center',
    marginBottom: '60px',
    animation: 'fadeIn 0.8s ease-out',
  },
  heroTitle: {
    fontSize: '56px',
    fontWeight: 'bold',
    color: 'white',
    marginBottom: '20px',
    lineHeight: '1.2',
    textShadow: '0 2px 20px rgba(0,0,0,0.2)',
  },
  heroSubtitle: {
    fontSize: '20px',
    color: 'rgba(255, 255, 255, 0.9)',
    maxWidth: '700px',
    margin: '0 auto',
    lineHeight: '1.6',
  },
  features: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '24px',
    marginBottom: '60px',
  },
  featureCard: {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '16px',
    padding: '32px 24px',
    textAlign: 'center',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    transition: 'transform 0.3s, box-shadow 0.3s',
    cursor: 'pointer',
  },
  featureIcon: {
    fontSize: '48px',
    display: 'block',
    marginBottom: '16px',
  },
  featureTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '8px',
  },
  featureText: {
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.5',
  },
  inputSection: {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '24px',
    padding: '48px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  },
  sectionTitle: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '32px',
    textAlign: 'center',
  },
  setup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
  },
  textarea: {
    width: '100%',
    padding: '20px',
    borderRadius: '12px',
    border: '2px solid #e0e0e0',
    fontSize: '15px',
    fontFamily: 'inherit',
    resize: 'vertical',
    marginBottom: '20px',
    transition: 'border-color 0.3s, box-shadow 0.3s',
    outline: 'none',
  },
  primaryButton: {
    width: '100%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '20px 40px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
  },
  error: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '2px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '24px',
    color: '#dc2626',
    fontSize: '15px',
    fontWeight: '500',
  },
  interview: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '24px',
    padding: '40px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  },
  questionHeader: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '8px',
  },
  badge: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '10px 24px',
    borderRadius: '24px',
    fontSize: '15px',
    fontWeight: 'bold',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
  },
  avatarContainer: {
    width: '100%',
    height: '400px',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    borderRadius: '16px',
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
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
    animation: 'pulse 2s ease-in-out infinite',
  },
  questionBox: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '28px',
    borderRadius: '16px',
    boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
  },
  question: {
    fontSize: '19px',
    lineHeight: '1.7',
    color: 'white',
    margin: 0,
  },
  feedback: {
    background: 'linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%)',
    padding: '24px',
    borderRadius: '16px',
    border: '2px solid #3b82f6',
    animation: 'slideIn 0.5s ease-out',
  },
  feedbackTitle: {
    marginBottom: '20px',
    color: '#1e40af',
    fontSize: '20px',
    fontWeight: 'bold',
  },
  scores: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    marginBottom: '20px',
  },
  scoreItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: 'white',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '500',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  scoreValue: {
    fontWeight: 'bold',
    color: '#667eea',
    fontSize: '16px',
  },
  feedbackList: {
    marginLeft: '20px',
    lineHeight: '1.8',
    color: '#1e40af',
  },
  controls: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  recordButton: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '18px',
    fontSize: '17px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
    transition: 'transform 0.2s',
  },
  stopButton: {
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '18px',
    fontSize: '17px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(239, 68, 68, 0.4)',
    animation: 'pulse 2s ease-in-out infinite',
  },
  endButton: {
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '14px',
    fontSize: '15px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
  },
  processing: {
    textAlign: 'center',
    padding: '20px',
    background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
    borderRadius: '12px',
    fontSize: '16px',
    color: '#4b5563',
    fontWeight: '500',
  },
  report: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '24px',
    padding: '48px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    animation: 'fadeIn 0.8s ease-out',
  },
  reportTitle: {
    textAlign: 'center',
    color: '#1f2937',
    fontSize: '36px',
    fontWeight: 'bold',
    marginBottom: '8px',
  },
  overallScore: {
    textAlign: 'center',
    padding: '40px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '20px',
    color: 'white',
    boxShadow: '0 12px 40px rgba(102, 126, 234, 0.4)',
  },
  bigScore: {
    fontSize: '64px',
    fontWeight: 'bold',
    margin: '20px 0',
    textShadow: '0 4px 12px rgba(0,0,0,0.2)',
  },
  scoreBreakdown: {
    padding: '32px',
    background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
    borderRadius: '16px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
  },
  section: {
    padding: '32px',
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
    border: '1px solid #e5e7eb',
  },
  strengthItem: {
    marginBottom: '20px',
    padding: '20px',
    background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
    borderRadius: '12px',
    borderLeft: '4px solid #10b981',
  },
  weaknessItem: {
    marginBottom: '20px',
    padding: '20px',
    background: 'linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)',
    borderRadius: '12px',
    borderLeft: '4px solid #f59e0b',
  },
  dayPlan: {
    marginBottom: '24px',
    padding: '24px',
    background: 'white',
    borderRadius: '12px',
    border: '2px solid #e5e7eb',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  successCriteria: {
    marginTop: '16px',
    fontStyle: 'italic',
    color: '#10b981',
    fontWeight: '500',
    fontSize: '15px',
  },
  actions: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  secondaryButton: {
    background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
    color: '#374151',
    border: '2px solid #d1d5db',
    borderRadius: '12px',
    padding: '16px 32px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
};
