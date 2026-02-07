# Interview Buddy - Production Deployment Checklist

## Pre-Deployment Checklist

### ✅ Development Complete
- [ ] All features tested locally
- [ ] No console errors in browser
- [ ] No errors in backend logs
- [ ] All API endpoints working
- [ ] Sample interview completed successfully
- [ ] Code reviewed and approved
- [ ] Documentation complete

### ✅ API Keys & Credentials
- [ ] OpenRouter production API key obtained
- [ ] ElevenLabs production API key obtained
- [ ] D-ID production API key obtained
- [ ] OpenAI production API key obtained
- [ ] AWS production credentials created
- [ ] All keys tested and working
- [ ] Keys stored securely (not in code)

### ✅ AWS Setup
- [ ] Production S3 bucket created
- [ ] S3 bucket CORS configured
- [ ] IAM user with S3 permissions created
- [ ] EC2 instance launched (or ECS configured)
- [ ] Security groups configured
- [ ] CloudWatch logging enabled
- [ ] Budget alerts configured

---

## Backend Deployment (AWS EC2)

### Step 1: Launch EC2 Instance
```bash
# Instance specifications
- AMI: Amazon Linux 2023
- Instance type: t3.small (2 vCPU, 2GB RAM)
- Storage: 20GB gp3
- Security group: Allow ports 22 (SSH), 3001 (API), 443 (HTTPS)
```

- [ ] EC2 instance launched
- [ ] Elastic IP assigned (optional but recommended)
- [ ] SSH key pair downloaded and secured
- [ ] Can SSH into instance

### Step 2: Install Dependencies
```bash
# SSH into instance
ssh -i your-key.pem ec2-user@your-instance-ip

# Update system
sudo yum update -y

# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Verify installation
node --version  # Should be 18.x
npm --version

# Install PM2 globally
sudo npm install -g pm2
```

- [ ] Node.js 18+ installed
- [ ] npm working
- [ ] PM2 installed globally

### Step 3: Deploy Application
```bash
# Create app directory
mkdir -p ~/interview-buddy
cd ~/interview-buddy

# Upload files (from local machine)
scp -i your-key.pem -r backend/ ec2-user@your-instance-ip:~/interview-buddy/

# Back on EC2 instance
cd ~/interview-buddy/backend
npm install --production
```

- [ ] Backend files uploaded
- [ ] Dependencies installed (production only)
- [ ] No errors during npm install

### Step 4: Configure Environment
```bash
# Create .env file
nano .env
```

Paste production values:
```bash
OPENROUTER_API_KEY=sk-or-v1-prod-key
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
ELEVENLABS_API_KEY=prod-key
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
DID_API_KEY=prod-key
OPENAI_API_KEY=sk-prod-key
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=prod-secret
AWS_REGION=us-east-1
S3_BUCKET_NAME=interview-buddy-prod
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
```

- [ ] .env file created
- [ ] All production keys added
- [ ] FRONTEND_URL set to production domain
- [ ] NODE_ENV=production

### Step 5: Start Application
```bash
# Start with PM2
pm2 start server.js --name interview-buddy

# Save PM2 configuration
pm2 save

# Setup auto-restart on reboot
pm2 startup
# Copy and run the command it outputs

# Check status
pm2 status
pm2 logs interview-buddy
```

- [ ] Application started with PM2
- [ ] No errors in logs
- [ ] PM2 configured to auto-restart
- [ ] Can access http://instance-ip:3001/api/health

### Step 6: Configure Nginx (Optional but Recommended)
```bash
# Install Nginx
sudo yum install -y nginx

# Configure Nginx
sudo nano /etc/nginx/nginx.conf
```

Add to server block:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Test configuration
sudo nginx -t
```

- [ ] Nginx installed
- [ ] Configuration updated
- [ ] Nginx started and enabled
- [ ] Can access http://your-domain.com/api/health

### Step 7: Setup SSL (Let's Encrypt)
```bash
# Install certbot
sudo yum install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

- [ ] SSL certificate obtained
- [ ] HTTPS working
- [ ] Auto-renewal configured
- [ ] Can access https://your-domain.com/api/health

---

## Frontend Deployment (S3 + CloudFront)

### Step 1: Build Production Bundle
```bash
# On local machine
cd frontend

# Update API endpoint if needed
# (Vite will use FRONTEND_URL from backend)

# Build
npm run build

# Verify build
ls -la dist/
```

- [ ] Production build created
- [ ] dist/ folder contains index.html and assets
- [ ] No build errors

### Step 2: Create S3 Bucket for Hosting
```bash
# Create bucket
aws s3 mb s3://interview-buddy-app --region us-east-1

# Enable static website hosting
aws s3 website s3://interview-buddy-app \
  --index-document index.html \
  --error-document index.html

# Set bucket policy for public read
aws s3api put-bucket-policy \
  --bucket interview-buddy-app \
  --policy '{
    "Version": "2012-10-17",
    "Statement": [{
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::interview-buddy-app/*"
    }]
  }'
```

- [ ] S3 bucket created
- [ ] Static hosting enabled
- [ ] Bucket policy set for public read

### Step 3: Upload Files
```bash
# Upload build files
aws s3 sync dist/ s3://interview-buddy-app/ \
  --delete \
  --cache-control "public, max-age=31536000" \
  --exclude "index.html"

# Upload index.html separately (no cache)
aws s3 cp dist/index.html s3://interview-buddy-app/ \
  --cache-control "no-cache"

# Verify upload
aws s3 ls s3://interview-buddy-app/
```

- [ ] All files uploaded
- [ ] Cache headers set correctly
- [ ] Can access http://interview-buddy-app.s3-website-us-east-1.amazonaws.com

### Step 4: Create CloudFront Distribution
```bash
# Create distribution (via AWS Console or CLI)
aws cloudfront create-distribution \
  --origin-domain-name interview-buddy-app.s3.amazonaws.com \
  --default-root-object index.html
```

Or via AWS Console:
1. Go to CloudFront → Create Distribution
2. Origin domain: interview-buddy-app.s3.amazonaws.com
3. Origin access: Public
4. Default root object: index.html
5. Custom error responses: 404 → /index.html (for SPA routing)
6. Alternate domain names: your-domain.com
7. SSL certificate: Request or import certificate

- [ ] CloudFront distribution created
- [ ] Distribution deployed (status: Enabled)
- [ ] Custom domain configured (optional)
- [ ] SSL certificate attached
- [ ] Can access https://d123456.cloudfront.net

### Step 5: Configure Custom Domain (Optional)
```bash
# In Route 53 or your DNS provider
# Create A record (Alias) pointing to CloudFront distribution
```

- [ ] DNS A record created
- [ ] Points to CloudFront distribution
- [ ] Can access https://your-domain.com
- [ ] SSL working on custom domain

### Step 6: Update Backend CORS
```bash
# SSH to EC2 instance
nano ~/interview-buddy/backend/.env

# Update FRONTEND_URL
FRONTEND_URL=https://your-domain.com

# Restart backend
pm2 restart interview-buddy
```

- [ ] Backend CORS updated
- [ ] Backend restarted
- [ ] Frontend can call backend APIs

---

## Post-Deployment Testing

### Smoke Tests
- [ ] Open production URL
- [ ] Paste sample resume + JD
- [ ] Start interview
- [ ] Verify avatar loads
- [ ] Record answer
- [ ] Verify transcription works
- [ ] Verify scoring works
- [ ] Complete interview
- [ ] Verify report generates
- [ ] Download report JSON

### Cross-Browser Testing
- [ ] Chrome (desktop)
- [ ] Firefox (desktop)
- [ ] Safari (desktop)
- [ ] Edge (desktop)
- [ ] Chrome (mobile)
- [ ] Safari (mobile)

### Performance Testing
- [ ] Page load time <3 seconds
- [ ] API response times acceptable
- [ ] Avatar generation <30 seconds
- [ ] No memory leaks (check PM2 logs)
- [ ] No console errors

### Security Testing
- [ ] HTTPS working
- [ ] API keys not exposed in frontend
- [ ] CORS configured correctly
- [ ] No sensitive data in logs
- [ ] S3 bucket not publicly writable

---

## Monitoring Setup

### CloudWatch Alarms
```bash
# Create alarm for high CPU
aws cloudwatch put-metric-alarm \
  --alarm-name interview-buddy-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

- [ ] CPU alarm created
- [ ] Memory alarm created (if using CloudWatch agent)
- [ ] Disk space alarm created
- [ ] SNS topic for notifications created
- [ ] Email notifications configured

### Application Monitoring
```bash
# Install CloudWatch agent on EC2
sudo yum install -y amazon-cloudwatch-agent

# Configure log streaming
sudo nano /opt/aws/amazon-cloudwatch-agent/etc/config.json
```

- [ ] CloudWatch agent installed
- [ ] Application logs streaming to CloudWatch
- [ ] PM2 logs accessible in CloudWatch
- [ ] Error logs monitored

### Cost Monitoring
```bash
# Create budget alert
aws budgets create-budget \
  --account-id YOUR_ACCOUNT_ID \
  --budget file://budget.json
```

budget.json:
```json
{
  "BudgetName": "InterviewBuddyMonthly",
  "BudgetLimit": {
    "Amount": "100",
    "Unit": "USD"
  },
  "TimeUnit": "MONTHLY",
  "BudgetType": "COST"
}
```

- [ ] Budget alert created
- [ ] Threshold set appropriately
- [ ] Email notifications configured
- [ ] Cost dashboard bookmarked

---

## Backup & Recovery

### Automated Backups
```bash
# Create S3 lifecycle policy for session backups
aws s3api put-bucket-lifecycle-configuration \
  --bucket interview-buddy-prod \
  --lifecycle-configuration file://lifecycle.json
```

lifecycle.json:
```json
{
  "Rules": [{
    "Id": "ArchiveOldSessions",
    "Status": "Enabled",
    "Transitions": [{
      "Days": 30,
      "StorageClass": "GLACIER"
    }],
    "Expiration": {
      "Days": 365
    }
  }]
}
```

- [ ] S3 lifecycle policy configured
- [ ] Old sessions archived to Glacier
- [ ] Expiration policy set
- [ ] Backup tested (can restore session)

### EC2 Snapshots
```bash
# Create AMI of EC2 instance
aws ec2 create-image \
  --instance-id i-1234567890abcdef0 \
  --name "interview-buddy-backup-$(date +%Y%m%d)" \
  --description "Interview Buddy production backup"
```

- [ ] AMI created
- [ ] Snapshot tested (can launch from AMI)
- [ ] Automated snapshot schedule configured
- [ ] Old snapshots cleaned up

---

## Rollback Plan

### If Backend Deployment Fails
```bash
# SSH to EC2
pm2 stop interview-buddy
pm2 delete interview-buddy

# Restore previous version
cd ~/interview-buddy/backend
git checkout previous-tag  # or restore from backup

npm install --production
pm2 start server.js --name interview-buddy
```

### If Frontend Deployment Fails
```bash
# Restore previous S3 version
aws s3 sync s3://interview-buddy-app-backup/ s3://interview-buddy-app/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E123456 \
  --paths "/*"
```

- [ ] Rollback procedure documented
- [ ] Rollback tested in staging
- [ ] Previous version backed up
- [ ] Team knows rollback process

---

## Go-Live Checklist

### Final Checks
- [ ] All tests passing
- [ ] No critical bugs
- [ ] Performance acceptable
- [ ] Security reviewed
- [ ] Documentation updated
- [ ] Team trained
- [ ] Support plan in place

### Communication
- [ ] Stakeholders notified
- [ ] Launch announcement prepared
- [ ] Support channels ready
- [ ] Monitoring dashboard shared

### Launch
- [ ] DNS switched to production
- [ ] Monitoring active
- [ ] Team on standby
- [ ] First production interview completed successfully

---

## Post-Launch Monitoring (First 24 Hours)

### Hour 1
- [ ] Check error rates
- [ ] Monitor API response times
- [ ] Verify no 500 errors
- [ ] Check CloudWatch logs

### Hour 6
- [ ] Review cost dashboard
- [ ] Check API usage
- [ ] Monitor user sessions
- [ ] Review feedback

### Hour 24
- [ ] Full system health check
- [ ] Review all metrics
- [ ] Document any issues
- [ ] Plan improvements

---

## Maintenance Schedule

### Daily
- [ ] Check error logs
- [ ] Monitor costs
- [ ] Review API usage

### Weekly
- [ ] Review performance metrics
- [ ] Check for security updates
- [ ] Backup verification
- [ ] Cost optimization review

### Monthly
- [ ] Update dependencies
- [ ] Review and optimize prompts
- [ ] Analyze user feedback
- [ ] Capacity planning

### Quarterly
- [ ] Security audit
- [ ] Performance optimization
- [ ] Cost analysis
- [ ] Feature planning

---

## Emergency Contacts

### Service Providers
- **AWS Support:** https://console.aws.amazon.com/support
- **OpenRouter:** support@openrouter.ai
- **ElevenLabs:** support@elevenlabs.io
- **D-ID:** support@d-id.com
- **OpenAI:** https://help.openai.com

### Internal Team
- **DevOps Lead:** [Name] - [Email] - [Phone]
- **Backend Lead:** [Name] - [Email] - [Phone]
- **Frontend Lead:** [Name] - [Email] - [Phone]
- **Product Manager:** [Name] - [Email] - [Phone]

---

## Success Criteria

### Technical
- [ ] 99.9% uptime
- [ ] <3s page load time
- [ ] <1% error rate
- [ ] <$1.50 cost per interview

### Business
- [ ] 100 interviews in first week
- [ ] >80% completion rate
- [ ] >4/5 user satisfaction
- [ ] <5 min time to first interview

---

**Deployment Complete! 🚀**

Monitor closely for the first 24 hours and be ready to rollback if needed.
