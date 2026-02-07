# Interview Buddy - API Examples & Testing

## Complete API Request/Response Examples

---

## 1. Start Interview Session

### Request
```bash
curl -X POST http://localhost:3001/api/start \
  -H "Content-Type: application/json" \
  -d '{
    "resume": "John Doe\nSenior Software Engineer\n\nEXPERIENCE\nTechCorp Inc. | 2021-Present\n- Led development of real-time platform\n- Reduced API latency by 60%\n\nSKILLS\nReact, Node.js, AWS, Docker",
    "jobDescription": "Senior Full-Stack Engineer\n\nRESPONSIBILITIES\n- Build scalable backend services\n- Mentor junior engineers\n- Optimize performance\n\nREQUIREMENTS\n- 5+ years experience\n- React and Node.js\n- AWS experience"
  }'
```

### Response (Success)
```json
{
  "sessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "question": "You mentioned leading development of a real-time platform at TechCorp that serves 500K+ daily active users. Can you walk me through a specific technical challenge you faced with scaling this platform and how you approached solving it?",
  "topic": "System Design",
  "audioUrl": "https://interview-buddy-dev.s3.us-east-1.amazonaws.com/sessions/a1b2c3d4.../audio_q0.mp3",
  "videoUrl": "https://clips.d-id.com/abc123/video.mp4",
  "fallbackImage": null,
  "questionNumber": 1,
  "totalQuestions": 5
}
```

### Response (Avatar Fallback)
```json
{
  "sessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "question": "You mentioned leading development of a real-time platform...",
  "topic": "System Design",
  "audioUrl": "https://interview-buddy-dev.s3.us-east-1.amazonaws.com/sessions/a1b2c3d4.../audio_q0.mp3",
  "videoUrl": null,
  "fallbackImage": "https://create-images-results.d-id.com/default-presenter-image.jpg",
  "questionNumber": 1,
  "totalQuestions": 5
}
```

### Response (Error)
```json
{
  "error": "Resume and job description required"
}
```

---

## 2. Submit Answer

### Request (using curl with file)
```bash
curl -X POST http://localhost:3001/api/answer \
  -F "sessionId=a1b2c3d4-e5f6-7890-abcd-ef1234567890" \
  -F "audio=@answer.webm"
```

### Request (JavaScript/Fetch)
```javascript
const formData = new FormData();
formData.append('sessionId', sessionId);
formData.append('audio', audioBlob, 'answer.webm');

const response = await fetch('/api/answer', {
  method: 'POST',
  body: formData,
});

const data = await response.json();
```

### Response (Follow-up Question)
```json
{
  "transcription": "At TechCorp, we faced a major scaling challenge when our user base grew from 100K to 500K in just three months. The main issue was database connection pooling - we were hitting max connections during peak hours. I led the effort to implement a Redis caching layer and optimize our database queries. We also moved to a microservices architecture using Docker and Kubernetes. This reduced our API response time from 800ms to 200ms and eliminated the connection issues.",
  "scores": {
    "clarity": 8,
    "depth": 7,
    "relevance": 9,
    "structure": 8
  },
  "feedback": [
    "Excellent use of specific metrics (100K to 500K users, 800ms to 200ms)",
    "Good technical depth mentioning Redis, Docker, and Kubernetes",
    "Consider elaborating on the decision-making process for choosing Redis over other solutions"
  ],
  "nextQuestion": "You mentioned implementing a Redis caching layer. Can you walk me through the specific caching strategy you chose - what did you cache, what was your invalidation strategy, and how did you handle cache consistency?",
  "topic": "System Design",
  "audioUrl": "https://interview-buddy-dev.s3.us-east-1.amazonaws.com/sessions/a1b2c3d4.../audio_q1.mp3",
  "videoUrl": "https://clips.d-id.com/def456/video.mp4",
  "fallbackImage": null,
  "questionNumber": 2,
  "isFollowUp": true,
  "completed": false
}
```

### Response (New Topic)
```json
{
  "transcription": "For our caching strategy, we implemented a multi-layered approach. We cached API responses with a 5-minute TTL, database query results with a 15-minute TTL, and user session data with a 24-hour TTL. For invalidation, we used a combination of time-based expiration and event-driven invalidation - whenever data was updated, we'd publish an event that would clear related cache keys. For consistency, we implemented a write-through cache pattern where writes would update both the database and cache atomically. We also added cache warming for frequently accessed data during deployment. This approach reduced our database load by 70% and improved response times significantly.",
  "scores": {
    "clarity": 9,
    "depth": 9,
    "relevance": 10,
    "structure": 9
  },
  "feedback": [
    "Outstanding technical depth with specific TTL values and patterns",
    "Excellent structure covering strategy, invalidation, and consistency",
    "Great use of metrics (70% database load reduction)"
  ],
  "nextQuestion": "The job description mentions mentoring junior engineers. Can you share a specific example of how you've mentored someone on your team? What was the situation, and what was the outcome?",
  "topic": "Leadership",
  "audioUrl": "https://interview-buddy-dev.s3.us-east-1.amazonaws.com/sessions/a1b2c3d4.../audio_q2.mp3",
  "videoUrl": "https://clips.d-id.com/ghi789/video.mp4",
  "fallbackImage": null,
  "questionNumber": 3,
  "isFollowUp": false,
  "completed": false
}
```

### Response (Interview Complete)
```json
{
  "transcription": "I mentored a junior engineer named Sarah who was struggling with React performance optimization...",
  "scores": {
    "clarity": 8,
    "depth": 7,
    "relevance": 8,
    "structure": 8
  },
  "feedback": [
    "Good specific example with clear outcome",
    "Consider adding more details about your mentoring approach",
    "Strong demonstration of leadership skills"
  ],
  "completed": true,
  "message": "Interview complete! Click 'End Interview' to see your report."
}
```

### Response (Error)
```json
{
  "error": "Session not found"
}
```

---

## 3. End Interview & Get Report

### Request
```bash
curl -X POST http://localhost:3001/api/end \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }'
```

### Response
```json
{
  "sessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "report": {
    "overallScore": 8.1,
    "assessment": "Strong - excellent technical depth with room for minor improvements",
    "scoreBreakdown": {
      "clarity": 8.3,
      "depth": 7.8,
      "relevance": 8.5,
      "structure": 7.9
    },
    "strengths": [
      {
        "area": "Technical Communication",
        "evidence": "Consistently provided specific metrics and technical details across all answers, particularly in system design questions",
        "score": 8.7
      },
      {
        "area": "Problem-Solving Approach",
        "evidence": "Demonstrated systematic thinking in scaling challenges, clearly explaining problem identification, solution design, and results",
        "score": 8.5
      },
      {
        "area": "Relevance to Role",
        "evidence": "All answers directly addressed job requirements with concrete examples from relevant experience",
        "score": 8.5
      }
    ],
    "weaknesses": [
      {
        "area": "Answer Structure",
        "evidence": "Some answers lacked clear STAR format, particularly in behavioral questions about mentorship",
        "score": 6.8
      },
      {
        "area": "Quantifiable Outcomes",
        "evidence": "While technical answers had metrics, leadership examples could benefit from more measurable results",
        "score": 7.2
      }
    ],
    "practicePlan": {
      "day1-2": {
        "focus": "Perfecting STAR Format",
        "exercises": [
          "Write out 5 past experiences using strict STAR format (Situation, Task, Action, Result)",
          "Practice recording yourself answering behavioral questions, ensuring each section is clearly delineated",
          "Review recordings and identify where you skip or rush through sections"
        ],
        "successCriteria": "Every answer has a clear 4-part structure with smooth transitions between sections"
      },
      "day3-4": {
        "focus": "Adding Quantifiable Results to Leadership Stories",
        "exercises": [
          "Review past mentorship experiences and document 3 specific metrics per story (time saved, skills gained, project outcomes)",
          "Practice answering: 'How did you measure the success of your mentorship?'",
          "Prepare 3 leadership stories with before/after metrics"
        ],
        "successCriteria": "Every leadership answer includes at least 2 quantifiable outcomes"
      },
      "day5-6": {
        "focus": "Balancing Technical Depth with Conciseness",
        "exercises": [
          "Practice explaining complex technical concepts in 60 seconds or less",
          "Record answers and trim to essential information without losing key details",
          "Get feedback from a peer on clarity vs. completeness trade-offs"
        ],
        "successCriteria": "Can explain technical solutions in 90 seconds while maintaining depth"
      },
      "day7": {
        "focus": "Full Mock Interview Simulation",
        "exercises": [
          "Complete a full 30-minute mock interview with 5 questions",
          "Record yourself and self-review using the 4 rubrics",
          "Identify your top 2 improvement areas and practice those specific question types"
        ],
        "successCriteria": "Average score improvement of 1+ point across all rubrics compared to this session"
      }
    }
  },
  "totalQuestions": 8,
  "duration": 25
}
```

---

## 4. Export Session Data

### Request
```bash
curl http://localhost:3001/api/export/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

### Response
```json
{
  "sessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "resume": "John Doe\nSenior Software Engineer...",
  "jobDescription": "Senior Full-Stack Engineer...",
  "questionSet": [
    {
      "question": "You mentioned leading development...",
      "topic": "System Design",
      "resumeCitation": "Led development of real-time platform",
      "jdCitation": "Build scalable backend services"
    }
  ],
  "currentQuestionIndex": 5,
  "interactions": [
    {
      "questionNumber": 1,
      "question": "You mentioned leading development...",
      "topic": "System Design",
      "answer": "At TechCorp, we faced a major scaling challenge...",
      "scores": {
        "clarity": 8,
        "depth": 7,
        "relevance": 9,
        "structure": 8
      },
      "feedback": [
        "Excellent use of specific metrics",
        "Good technical depth",
        "Consider elaborating on decision-making process"
      ],
      "timestamp": "2024-02-07T10:15:30.000Z"
    }
  ],
  "topicDepth": {
    "System Design": 5,
    "Leadership": 3
  },
  "coveredTopics": ["System Design", "Leadership", "Problem Solving"],
  "startTime": "2024-02-07T10:00:00.000Z",
  "endTime": "2024-02-07T10:25:00.000Z",
  "report": {
    "overallScore": 8.1,
    "assessment": "Strong - excellent technical depth...",
    "scoreBreakdown": { "clarity": 8.3, "depth": 7.8, "relevance": 8.5, "structure": 7.9 },
    "strengths": [...],
    "weaknesses": [...],
    "practicePlan": {...}
  }
}
```

---

## Testing Scenarios

### Scenario 1: Happy Path
1. Start interview with resume + JD
2. Answer 5 questions (mix of follow-ups and new topics)
3. End interview and get report
4. Export session data

### Scenario 2: Avatar Fallback
1. Start interview (D-ID fails or times out)
2. Verify fallbackImage is returned
3. Verify audio still plays
4. Continue interview normally

### Scenario 3: Short Answers (Trigger Follow-ups)
1. Start interview
2. Give brief, surface-level answer (20-30 words)
3. Verify isFollowUp: true in response
4. Verify same topic continues
5. Give detailed answer (100+ words)
6. Verify topic switches after depth >= 5

### Scenario 4: Error Handling
1. Try to start without resume → 400 error
2. Try to answer with invalid sessionId → 404 error
3. Try to end non-existent session → 404 error
4. Verify graceful error messages

### Scenario 5: Session Persistence
1. Start interview
2. Answer 2 questions
3. Check S3 for session backup
4. Restart backend server
5. Try to continue session (should fail - in-memory)
6. Export from S3 should still work

---

## Performance Benchmarks

### Expected Response Times

| Endpoint | Operation | Expected Time |
|----------|-----------|---------------|
| POST /api/start | Generate questions + avatar | 15-30 seconds |
| POST /api/answer | Transcribe + score + next Q | 10-20 seconds |
| POST /api/end | Generate report | 5-10 seconds |
| GET /api/export | Fetch from S3 | <1 second |

### Bottlenecks

1. **D-ID video generation:** 10-30 seconds (slowest)
2. **Whisper transcription:** 2-5 seconds per minute of audio
3. **OpenRouter LLM:** 2-5 seconds per request
4. **ElevenLabs TTS:** 1-3 seconds per question

### Optimization Tips

1. **Parallel processing:** Generate audio and video simultaneously
2. **Caching:** Cache common questions and avatars
3. **Shorter videos:** Use 10-second videos instead of 20-second
4. **Faster model:** Use Claude 3.5 Haiku for non-critical prompts

---

## Error Codes

| Status | Error | Cause | Solution |
|--------|-------|-------|----------|
| 400 | "Resume and job description required" | Missing input | Provide both fields |
| 404 | "Session not found" | Invalid sessionId | Start new session |
| 500 | "Failed to generate response from LLM" | OpenRouter error | Check API key and credits |
| 500 | "Failed to generate speech" | ElevenLabs error | Check API key and quota |
| 500 | "Failed to transcribe audio" | Whisper error | Check audio format and API key |
| 500 | "Failed to upload to S3" | AWS error | Check credentials and bucket |

---

## Rate Limits

### External Services

| Service | Rate Limit | Notes |
|---------|------------|-------|
| OpenRouter | Varies by model | Check dashboard |
| ElevenLabs TTS | 10 req/sec (free tier) | Upgrade for higher limits |
| ElevenLabs STT | 10 req/sec (free tier) | Same as TTS |
| D-ID | 10 concurrent videos | Queue additional requests |
| AWS S3 | 3,500 PUT/sec | No practical limit for MVP |

### Recommended Backend Rate Limiting

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: 'Too many requests, please try again later'
});

app.use('/api/', limiter);
```

---

## Monitoring Queries

### Check Session Count
```javascript
console.log(`Active sessions: ${sessions.size}`);
```

### Check S3 Storage
```bash
aws s3 ls s3://interview-buddy-dev/sessions/ --recursive --summarize
```

### Check API Costs
- OpenRouter: https://openrouter.ai/activity
- ElevenLabs: https://elevenlabs.io/usage
- D-ID: https://studio.d-id.com/account
- OpenAI: https://platform.openai.com/usage

---

## Testing Checklist

- [ ] Start interview with valid resume + JD
- [ ] Start interview with missing resume (expect 400)
- [ ] Start interview with missing JD (expect 400)
- [ ] Verify avatar video loads
- [ ] Verify fallback works when D-ID fails
- [ ] Record and submit answer
- [ ] Verify transcription accuracy
- [ ] Verify scores are reasonable (1-10)
- [ ] Verify feedback is actionable
- [ ] Test follow-up logic (shallow answer)
- [ ] Test topic switching (detailed answer)
- [ ] Complete full interview (5+ questions)
- [ ] End interview and get report
- [ ] Verify report has all sections
- [ ] Export session data
- [ ] Verify S3 backup exists
- [ ] Test with invalid sessionId (expect 404)
- [ ] Test on multiple browsers
- [ ] Test microphone permissions
- [ ] Test with different audio lengths

---

**Ready to test? Start with SAMPLE_DATA.md for test inputs!**
