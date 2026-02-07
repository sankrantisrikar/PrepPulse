# Interview Buddy - Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Prerequisites
- Node.js 18+ installed
- API keys ready (see below)
- AWS account with S3 access

---

## Step 1: Get API Keys (15 minutes)

### OpenRouter (Required)
1. Go to https://openrouter.ai
2. Sign up → Add $5 credits
3. Copy API key: `sk-or-v1-...`

### ElevenLabs (Required)
1. Go to https://elevenlabs.io
2. Sign up (free tier available)
3. Copy API key from Profile
4. Copy voice ID: `21m00Tcm4TlvDq8ikWAM` (default)

### D-ID (Required)
1. Go to https://www.d-id.com
2. Sign up (free trial: 20 credits)
3. Copy API key from dashboard

### AWS (Required)
1. Create S3 bucket: `interview-buddy-dev`
2. Get access key + secret from IAM
3. Note your region: `us-east-1`

---

## Step 2: Install & Configure (5 minutes)

```bash
# Clone/download project
cd interview-buddy

# Install backend
cd backend
npm install

# Install frontend
cd ../frontend
npm install

# Configure environment
cd ..
cp .env.example .env
nano .env  # Paste your API keys
```

**Edit .env:**
```bash
OPENROUTER_API_KEY=sk-or-v1-YOUR_KEY
ELEVENLABS_API_KEY=YOUR_KEY
DID_API_KEY=YOUR_KEY
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=YOUR_SECRET
AWS_REGION=us-east-1
S3_BUCKET_NAME=interview-buddy-dev
```

---

## Step 3: Setup S3 (2 minutes)

```bash
# Create bucket
aws s3 mb s3://interview-buddy-dev

# Configure CORS
aws s3api put-bucket-cors \
  --bucket interview-buddy-dev \
  --cors-configuration file://cors.json
```

---

## Step 4: Start Servers (1 minute)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

---

## Step 5: Test Interview (5 minutes)

1. Open http://localhost:5173
2. Copy sample resume from `SAMPLE_DATA.md`
3. Copy sample job description from `SAMPLE_DATA.md`
4. Click "Start Interview"
5. Allow microphone access
6. Wait for avatar video (~15 seconds)
7. Click "Start Recording Answer"
8. Speak for 30-60 seconds
9. Click "Stop & Submit Answer"
10. Review feedback and scores

---

## ✅ Success Checklist

- [ ] Backend running on port 3001
- [ ] Frontend running on port 5173
- [ ] Can start interview session
- [ ] Avatar video loads (or fallback image shows)
- [ ] Can record audio answer
- [ ] Transcription works
- [ ] Scores display correctly
- [ ] Next question generates
- [ ] Can end interview
- [ ] Final report generates

---

## 🐛 Quick Troubleshooting

### "Failed to start interview"
→ Check backend logs for API errors
→ Verify OpenRouter API key has credits

### Avatar not loading
→ Wait 30 seconds (D-ID is slow)
→ Should fallback to audio + image automatically

### Microphone not working
→ Check browser permissions
→ Try Chrome/Edge (best support)

### CORS errors
→ Re-run: `aws s3api put-bucket-cors --bucket interview-buddy-dev --cors-configuration file://cors.json`

### "Session not found"
→ Backend restarted (sessions are in-memory)
→ Start new interview

---

## 📊 Cost Per Test

- OpenRouter: $0.15
- ElevenLabs TTS: $0.09
- ElevenLabs STT: $0.09
- D-ID: $0.60
- S3: $0.01
- **Total: ~$0.94**

**Tip:** Use Claude 3.5 Sonnet to reduce cost to $0.555

---

## 🎯 What to Test

1. **Question Quality:** Are questions personalized with resume citations?
2. **Scoring Accuracy:** Do scores match answer quality?
3. **Adaptive Logic:** Does it ask follow-ups on shallow answers?
4. **Avatar Quality:** Is lip sync accurate?
5. **Transcription:** Is speech-to-text accurate?
6. **Final Report:** Is the 7-day plan actionable?

---

## 📚 Next Steps

- ✅ Test with sample data
- 📖 Read `ARCHITECTURE.md` for system design
- 🔧 Customize prompts in `backend/prompts.js`
- 🎨 Customize UI in `frontend/src/App.jsx`
- 🚀 Deploy to production (see `SETUP.md`)

---

## 💡 Pro Tips

1. **Faster Testing:** Comment out D-ID calls to skip avatar generation
2. **Debug Mode:** Check browser console and backend logs
3. **Cost Savings:** Use shorter answers during testing
4. **Better Questions:** Provide detailed resume with metrics
5. **Better Scores:** Use STAR format in answers

---

## 🆘 Need Help?

1. Check `SETUP.md` for detailed troubleshooting
2. Review `ARCHITECTURE.md` for system design
3. See `SAMPLE_DATA.md` for test examples
4. Read `DELIVERABLES.md` for complete overview

---

**You're ready to go! 🎉**

Open http://localhost:5173 and start your first AI interview.
