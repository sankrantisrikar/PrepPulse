# Interview Buddy - System Architecture

## Overview
Interview Buddy is a production-ready MVP that provides AI-powered interview practice with a talking avatar, voice-based Q&A, adaptive questioning, and comprehensive performance reports.

## Technology Stack

### Backend
- **Runtime:** Node.js 18+ with ES modules
- **Framework:** Express.js
- **Architecture:** Single-server monolith (9 files total)

### Frontend
- **Framework:** React 18 with Vite
- **Styling:** Inline styles (no CSS dependencies)
- **Audio:** Web Audio API + MediaRecorder

### External Services
1. **OpenRouter** (LLM) - Question generation, scoring, report generation
2. **ElevenLabs** (TTS) - Natural voice synthesis
3. **D-ID** (Avatar) - Video generation with lip sync
4. **OpenAI Whisper** (STT) - Audio transcription
5. **AWS S3** (Storage) - Session data and audio files

## System Flow

```
┌─────────────┐
│   User      │
│  Browser    │
└──────┬──────┘
       │
       │ 1. Upload Resume + JD
       ▼
┌─────────────────────────────────────────┐
│         Express Backend                 │
│  ┌───────────────────────────────────┐  │
│  │  /api/start                       │  │
│  │  - Parse resume/JD                │  │
│  │  - Generate 5 questions (OpenRouter)│
│  │  - Create first question audio    │  │
│  │  - Generate avatar video (D-ID)   │  │
│  │  - Return session + first Q       │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  /api/answer                      │  │
│  │  - Transcribe audio (Whisper)     │  │
│  │  - Score answer (OpenRouter)      │  │
│  │  - Check depth: <5 = follow-up    │  │
│  │  -              >=5 = new topic   │  │
│  │  - Generate next Q + avatar       │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  /api/end                         │  │
│  │  - Generate final report          │  │
│  │  - Calculate scores               │  │
│  │  - Create 7-day practice plan     │  │
│  │  - Save to S3                     │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
       │
       │ Store sessions
       ▼
┌─────────────┐
│   AWS S3    │
│  sessions/  │
│  {id}/      │
└─────────────┘
```

## Data Flow

### 1. Session Initialization
```
User Input → OpenRouter (question generation) → ElevenLabs (TTS) → D-ID (avatar) → User
```

### 2. Answer Processing
```
User Audio → ElevenLabs STT → OpenRouter (scoring) → Adaptive Logic → Next Question
```

### 3. Adaptive Logic
```
if (topicDepth < 5):
    Generate follow-up on same topic
else:
    Move to next topic from question set
```

## File Structure

```
interview-buddy/
├── README.md                    # Setup and usage guide
├── .env.example                 # Environment variables template
├── cors.json                    # S3 CORS configuration
├── ARCHITECTURE.md              # This file
│
├── backend/
│   ├── package.json             # Dependencies
│   ├── server.js                # Express server + all endpoints
│   ├── services.js              # External API integrations
│   └── prompts.js               # LLM prompts + scoring rubrics
│
└── frontend/
    ├── package.json             # Dependencies
    ├── vite.config.js           # Vite configuration
    ├── index.html               # HTML entry point
    └── src/
        ├── index.jsx            # React entry
        └── App.jsx              # Main interview UI
```

## API Endpoints

### POST /api/start
**Purpose:** Initialize interview session

**Request:**
```json
{
  "resume": "string",
  "jobDescription": "string"
}
```

**Response:**
```json
{
  "sessionId": "uuid",
  "question": "string",
  "topic": "string",
  "audioUrl": "string",
  "videoUrl": "string | null",
  "fallbackImage": "string | null",
  "questionNumber": 1,
  "totalQuestions": 5
}
```

### POST /api/answer
**Purpose:** Submit answer and get next question

**Request:** FormData
- `sessionId`: string
- `audio`: File (webm/mp3)

**Response:**
```json
{
  "transcription": "string",
  "scores": {
    "clarity": 7,
    "depth": 6,
    "relevance": 8,
    "structure": 7
  },
  "feedback": ["string", "string", "string"],
  "nextQuestion": "string",
  "topic": "string",
  "audioUrl": "string",
  "videoUrl": "string | null",
  "questionNumber": 2,
  "isFollowUp": false,
  "completed": false
}
```

### POST /api/end
**Purpose:** Finalize session and generate report

**Request:**
```json
{
  "sessionId": "uuid"
}
```

**Response:**
```json
{
  "sessionId": "uuid",
  "report": {
    "overallScore": 7.2,
    "assessment": "string",
    "scoreBreakdown": {...},
    "strengths": [...],
    "weaknesses": [...],
    "practicePlan": {...}
  },
  "totalQuestions": 8,
  "duration": 25
}
```

### GET /api/export/:sessionId
**Purpose:** Download session data as JSON

**Response:** Full session object with all interactions

## Scoring Rubrics

Each answer is scored on 4 dimensions (1-10 scale):

### Clarity (1-10)
- 1-3: Rambling, unclear
- 4-6: Somewhat clear
- 7-8: Clear and organized
- 9-10: Exceptionally articulate

### Depth (1-10)
- 1-3: Surface-level
- 4-6: Some details
- 7-8: Good depth with examples
- 9-10: Comprehensive with metrics

### Relevance (1-10)
- 1-3: Off-topic
- 4-6: Partially relevant
- 7-8: Directly relevant
- 9-10: Perfectly aligned

### Structure (1-10)
- 1-3: No structure
- 4-6: Loose structure
- 7-8: Good STAR format
- 9-10: Perfect STAR format

## Adaptive Questioning Logic

```javascript
// Track depth per topic
topicDepth[currentTopic]++

if (topicDepth[currentTopic] < 5) {
  // Generate follow-up question
  // Dig deeper into their answer
  // Ask about specifics, challenges, outcomes
} else {
  // Move to next topic
  // Select from pre-generated question set
  // Avoid covered topics
}
```

## Graceful Fallbacks

### Avatar Video Failure
```
D-ID API timeout/error → Show static image + play ElevenLabs audio
```

### ElevenLabs STT Failure
```
ElevenLabs API error → Return error to user, allow re-recording
```

### OpenRouter Failure
```
LLM timeout → Retry once, then return generic error
```

## Cost Analysis (per 30-min interview)

| Service | Usage | Unit Cost | Total |
|---------|-------|-----------|-------|
| OpenRouter (GPT-4) | ~15,000 tokens | $0.01/1K | $0.15 |
| ElevenLabs TTS | ~3,000 chars | $0.03/1K | $0.09 |
| ElevenLabs STT | 30 min audio | $0.003/min | $0.09 |
| D-ID | 10 videos × 20s | $0.06/video | $0.60 |
| AWS S3 | 5MB storage + transfer | $0.023/GB | $0.01 |
| **Total** | | | **$0.94** |

### Cost Optimization Strategies
1. Use Claude 3.5 Sonnet instead of GPT-4 ($0.003/1K vs $0.01/1K)
2. Cache avatar videos for common questions
3. Use shorter avatar videos (10s vs 20s)
4. Batch S3 uploads

**Optimized cost:** ~$0.555 per interview

## Production Deployment

### Backend (AWS EC2 / ECS)
```bash
# Install dependencies
npm install --production

# Set environment variables
export NODE_ENV=production
export PORT=3001

# Run with PM2
pm2 start server.js --name interview-buddy
```

### Frontend (S3 + CloudFront)
```bash
# Build production bundle
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket/

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id XXX --paths "/*"
```

### Environment Variables (Production)
```bash
OPENROUTER_API_KEY=sk-or-xxx
ELEVENLABS_API_KEY=xxx
DID_API_KEY=xxx
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=xxx
AWS_REGION=us-east-1
S3_BUCKET_NAME=interview-buddy-prod
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
```

## Security Considerations

1. **API Keys:** Store in environment variables, never commit
2. **CORS:** Restrict to specific frontend domain in production
3. **Rate Limiting:** Add express-rate-limit for API endpoints
4. **Input Validation:** Sanitize resume/JD inputs
5. **S3 Bucket:** Private bucket with signed URLs
6. **Session IDs:** Use UUIDs, no sequential IDs

## Monitoring & Logging

### Key Metrics
- Session start rate
- Session completion rate
- Average session duration
- API error rates (per service)
- Average scores per rubric

### Logging Strategy
```javascript
console.log(`[${sessionId}] Event: ${event}`)
```

### Recommended Tools
- CloudWatch Logs (AWS)
- Sentry (error tracking)
- DataDog (APM)

## Future Enhancements (Post-MVP)

1. **Database:** PostgreSQL for persistent storage
2. **Authentication:** User accounts with session history
3. **Video Recording:** Record user video for body language analysis
4. **Real-time Feedback:** Show scores during answer
5. **Custom Question Sets:** Industry-specific templates
6. **Multi-language:** Support non-English interviews
7. **Mobile App:** React Native version
8. **Analytics Dashboard:** Track progress over time

## Troubleshooting

### D-ID videos not generating
- Check API key validity
- Verify account credits
- Fallback to audio + static image works automatically

### Transcription errors
- Ensure audio format is webm/mp3/wav
- Check microphone permissions in browser
- Verify ElevenLabs API key is valid
- ElevenLabs STT supports multiple formats

### CORS errors
- Run `aws s3api put-bucket-cors` with cors.json
- Check backend CORS middleware allows frontend URL

### High latency
- D-ID videos take 10-30s to generate (expected)
- Consider pre-generating common questions
- Use CloudFront CDN for S3 assets

## License
MIT
