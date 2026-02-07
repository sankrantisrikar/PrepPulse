# Interview Buddy MVP

AI-powered interview practice platform with talking avatar, voice conversation, and adaptive questioning.

## Features
- 🎥 Talking AI avatar (D-ID video + lip sync)
- 🎤 Voice-based Q&A (Whisper STT + ElevenLabs TTS)
- 📄 Resume + Job Description aware questions
- 🧠 Adaptive follow-ups (depth tracking per topic)
- 📊 Real-time scoring (Clarity, Depth, Relevance, Structure)
- 📈 Final report with 7-day practice plan

## Tech Stack
- **Backend:** Node.js + Express
- **Frontend:** React + Vite
- **LLM:** OpenRouter (GPT-4/Claude)
- **TTS:** ElevenLabs
- **STT:** ElevenLabs
- **Avatar:** D-ID
- **Storage:** AWS S3

## Prerequisites
- Node.js 18+
- AWS account (S3 bucket)
- API keys: OpenRouter, ElevenLabs, D-ID

## Setup

### 1. Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and fill in your API keys:

```bash
cp .env.example .env
```

Required variables:
- `OPENROUTER_API_KEY` - Get from https://openrouter.ai
- `ELEVENLABS_API_KEY` - Get from https://elevenlabs.io (used for both TTS and STT)
- `DID_API_KEY` - Get from https://www.d-id.com
- `AWS_ACCESS_KEY_ID` - AWS credentials
- `AWS_SECRET_ACCESS_KEY` - AWS credentials
- `AWS_REGION` - e.g., us-east-1
- `S3_BUCKET_NAME` - Your S3 bucket name

### 3. Create S3 Bucket
```bash
aws s3 mb s3://your-interview-buddy-bucket
aws s3api put-bucket-cors --bucket your-interview-buddy-bucket --cors-configuration file://cors.json
```

### 4. Run Development Servers

**Backend (port 3001):**
```bash
cd backend
npm run dev
```

**Frontend (port 5173):**
```bash
cd frontend
npm run dev
```

Open http://localhost:5173

## API Endpoints

### POST /api/start
Start new interview session
```json
{
  "resume": "text content",
  "jobDescription": "text content"
}
```

### POST /api/answer
Submit answer and get next question
```json
{
  "sessionId": "uuid",
  "audioBlob": "base64 audio data"
}
```

### POST /api/end
End session and get final report
```json
{
  "sessionId": "uuid"
}
```

### GET /api/export/:sessionId
Download session report as JSON

## Cost Estimate (per 30-min interview)

| Service | Usage | Cost |
|---------|-------|------|
| OpenRouter (GPT-4) | ~15k tokens | $0.15 |
| ElevenLabs TTS | ~3k characters | $0.09 |
| ElevenLabs STT | ~30 min audio | $0.09 |
| D-ID | ~10 videos (20s each) | $0.60 |
| AWS S3 | Storage + transfer | $0.01 |
| **Total** | | **~$0.94** |

## Production Deployment

### Backend (AWS EC2 or ECS)
```bash
cd backend
npm install --production
NODE_ENV=production node server.js
```

### Frontend (S3 + CloudFront)
```bash
cd frontend
npm run build
aws s3 sync dist/ s3://your-bucket/
```

## Architecture Notes

- **No database:** Sessions stored in-memory with S3 backup
- **Graceful fallback:** If D-ID fails, shows static image + audio
- **Adaptive logic:** Tracks topic depth, switches at depth 6
- **Evidence-based:** Cites resume/JD in questions and feedback

## Troubleshooting

**D-ID video generation slow?**
- Videos take 10-30s to generate
- UI shows loading state
- Falls back to audio + static image on timeout

**Transcription errors?**
- Check audio format (webm/mp3/wav)
- Ensure microphone permissions granted
- Verify ElevenLabs API key is valid

**CORS issues?**
- Ensure S3 bucket has CORS configured
- Check backend CORS middleware settings

## License
MIT
