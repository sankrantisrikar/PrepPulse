# Interview Buddy - Complete Setup Guide

## Prerequisites

### Required Software
- Node.js 18+ ([download](https://nodejs.org/))
- npm or yarn
- AWS CLI ([install guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html))

### Required API Keys

#### 1. OpenRouter (LLM)
1. Visit https://openrouter.ai
2. Sign up and add credits ($5 minimum)
3. Go to Keys → Create new key
4. Copy your key: `sk-or-v1-...`

**Recommended model:** `anthropic/claude-3.5-sonnet` (best quality/price)

#### 2. ElevenLabs (Text-to-Speech)
1. Visit https://elevenlabs.io
2. Sign up (free tier: 10k chars/month)
3. Go to Profile → API Keys
4. Copy your key
5. Go to Voices → Copy a voice ID (default: `21m00Tcm4TlvDq8ikWAM`)

#### 3. D-ID (Avatar Video)
1. Visit https://www.d-id.com
2. Sign up (free trial: 20 credits)
3. Go to API → Get API Key
4. Copy your key (Basic auth format)

**Note:** Each video costs ~1 credit. Free trial = ~20 videos.

#### 4. AWS (S3 Storage)
1. Create AWS account
2. Create IAM user with S3 permissions
3. Generate access key + secret
4. Note your preferred region (e.g., `us-east-1`)

## Step-by-Step Setup

### 1. Clone/Download Project
```bash
# If you have the ZIP
unzip interview-buddy.zip
cd interview-buddy

# Or if using git
git clone <repo-url>
cd interview-buddy
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

Expected packages:
- express
- cors
- dotenv
- axios
- uuid
- @aws-sdk/client-s3
- multer
- form-data

### 3. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

Expected packages:
- react
- react-dom
- axios
- vite
- @vitejs/plugin-react

### 4. Configure Environment Variables
```bash
cd ..
cp .env.example .env
```

Edit `.env` with your API keys:
```bash
# OpenRouter
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet

# ElevenLabs
ELEVENLABS_API_KEY=your-elevenlabs-key
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM

# D-ID
DID_API_KEY=your-did-key-here

# AWS
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=interview-buddy-dev

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 5. Create S3 Bucket
```bash
# Create bucket
aws s3 mb s3://interview-buddy-dev --region us-east-1

# Configure CORS
aws s3api put-bucket-cors \
  --bucket interview-buddy-dev \
  --cors-configuration file://cors.json

# Verify CORS
aws s3api get-bucket-cors --bucket interview-buddy-dev
```

### 6. Test API Keys

#### Test OpenRouter
```bash
curl https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer $OPENROUTER_API_KEY"
```

#### Test ElevenLabs
```bash
curl https://api.elevenlabs.io/v1/voices \
  -H "xi-api-key: $ELEVENLABS_API_KEY"
```

#### Test D-ID
```bash
curl https://api.d-id.com/talks \
  -H "Authorization: Basic $DID_API_KEY"
```

### 7. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

Expected output:
```
🚀 Interview Buddy backend running on port 3001
📝 Environment: development
🔗 Frontend URL: http://localhost:5173
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Expected output:
```
VITE v5.0.8  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 8. Test the Application

1. Open http://localhost:5173
2. Paste sample resume (see SAMPLE_DATA.md)
3. Paste sample job description
4. Click "Start Interview"
5. Allow microphone access when prompted
6. Wait for avatar video to load (~15 seconds)
7. Click "Start Recording Answer"
8. Speak your answer (30-60 seconds)
9. Click "Stop & Submit Answer"
10. Review feedback and next question

## Troubleshooting

### Backend won't start
```bash
# Check Node version
node --version  # Should be 18+

# Check if port 3001 is in use
lsof -i :3001
kill -9 <PID>

# Check environment variables
cat .env | grep API_KEY
```

### Frontend won't start
```bash
# Check Node version
node --version

# Clear cache
rm -rf node_modules package-lock.json
npm install

# Check if port 5173 is in use
lsof -i :5173
```

### "Failed to start interview" error
- Check backend logs for API errors
- Verify OpenRouter API key is valid
- Check OpenRouter account has credits

### Avatar video not loading
- D-ID videos take 10-30 seconds to generate
- Check D-ID account has credits
- Fallback to audio + static image should work automatically

### Microphone not working
- Check browser permissions (chrome://settings/content/microphone)
- Try different browser (Chrome/Edge recommended)
- Check system microphone settings

### "Failed to transcribe audio" error
- Verify ElevenLabs API key is valid
- Check audio format is webm (default for Chrome)
- Try recording shorter answer (<2 minutes)
- ElevenLabs STT supports multiple audio formats

### CORS errors in browser console
```bash
# Re-apply CORS configuration
aws s3api put-bucket-cors \
  --bucket interview-buddy-dev \
  --cors-configuration file://cors.json
```

### S3 upload errors
- Verify AWS credentials are correct
- Check IAM user has S3 PutObject permission
- Verify bucket name matches .env

## Production Deployment

### Backend (AWS EC2)

1. **Launch EC2 instance**
   - AMI: Amazon Linux 2023
   - Instance type: t3.small (2GB RAM)
   - Security group: Allow port 3001

2. **Install Node.js**
```bash
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

3. **Deploy application**
```bash
# Upload files
scp -r backend/ ec2-user@<ip>:~/

# SSH to instance
ssh ec2-user@<ip>

# Install dependencies
cd backend
npm install --production

# Create .env file
nano .env  # Paste production values

# Install PM2
sudo npm install -g pm2

# Start application
pm2 start server.js --name interview-buddy
pm2 save
pm2 startup
```

4. **Configure reverse proxy (optional)**
```bash
sudo yum install -y nginx

# Edit /etc/nginx/nginx.conf
# Add proxy_pass to http://localhost:3001

sudo systemctl start nginx
sudo systemctl enable nginx
```

### Frontend (S3 + CloudFront)

1. **Build production bundle**
```bash
cd frontend
npm run build
```

2. **Create S3 bucket for hosting**
```bash
aws s3 mb s3://interview-buddy-app
aws s3 website s3://interview-buddy-app \
  --index-document index.html
```

3. **Upload files**
```bash
aws s3 sync dist/ s3://interview-buddy-app/ \
  --acl public-read
```

4. **Create CloudFront distribution**
```bash
aws cloudfront create-distribution \
  --origin-domain-name interview-buddy-app.s3.amazonaws.com \
  --default-root-object index.html
```

5. **Update backend CORS**
```bash
# In backend .env
FRONTEND_URL=https://d123456.cloudfront.net
```

## Cost Monitoring

### Set up AWS Budget Alert
```bash
aws budgets create-budget \
  --account-id <your-account-id> \
  --budget file://budget.json
```

### Monitor API Usage
- OpenRouter: https://openrouter.ai/activity
- ElevenLabs: https://elevenlabs.io/usage
- D-ID: https://studio.d-id.com/account
- OpenAI: https://platform.openai.com/usage

### Expected Monthly Costs (100 interviews)
- OpenRouter: $15
- ElevenLabs: $9
- D-ID: $60
- OpenAI Whisper: $18
- AWS: $5
- **Total: ~$107/month**

## Development Tips

### Hot Reload
Both servers support hot reload:
- Backend: `--watch` flag (Node 18+)
- Frontend: Vite HMR

### Debug Mode
```bash
# Backend verbose logging
DEBUG=* npm run dev

# Frontend React DevTools
# Install browser extension
```

### Test with Mock Data
```javascript
// In server.js, add mock mode
if (process.env.MOCK_MODE === 'true') {
  // Return mock responses
}
```

### Skip Avatar Generation (faster testing)
```javascript
// In services.js
export async function generateAvatarVideo() {
  return null; // Always use fallback
}
```

## Next Steps

1. ✅ Complete setup
2. ✅ Test with sample data
3. 📝 Customize prompts in `backend/prompts.js`
4. 🎨 Customize UI in `frontend/src/App.jsx`
5. 🚀 Deploy to production
6. 📊 Monitor usage and costs
7. 🔄 Iterate based on user feedback

## Support

For issues:
1. Check troubleshooting section above
2. Review backend logs: `tail -f backend/logs/app.log`
3. Check browser console for frontend errors
4. Verify all API keys are valid and have credits

## License
MIT
