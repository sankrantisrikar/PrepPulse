// All LLM prompts and scoring rubrics for Interview Buddy

export const SYSTEM_PROMPT = `You are an expert technical interviewer conducting a behavioral and technical interview. Your role is to:

1. Ask personalized questions based on the candidate's resume and job description
2. Cite specific projects, experiences, or requirements when asking questions
3. Provide evidence-based feedback that references their background
4. Score answers objectively using defined rubrics
5. Generate adaptive follow-ups based on answer depth

Always be professional, encouraging, and constructive. Focus on helping the candidate improve.`;

export const QUESTION_GENERATION_PROMPT = (resume, jobDescription, coveredTopics = []) => `
Generate a personalized interview question based on this candidate's background and the target role.

**Resume:**
${resume}

**Job Description:**
${jobDescription}

**Topics Already Covered:**
${coveredTopics.length > 0 ? coveredTopics.join(', ') : 'None'}

**Requirements:**
1. Ask about a NEW topic not in the covered list
2. Reference specific projects, skills, or experiences from their resume
3. Connect the question to requirements in the job description
4. Make it behavioral or situational (STAR format friendly)
5. Keep it focused and clear (1-2 sentences)

Return ONLY a JSON object with this structure:
{
  "question": "Your personalized question here",
  "topic": "Brief topic label (e.g., 'Leadership', 'System Design')",
  "resumeCitation": "Specific resume element you're referencing",
  "jdCitation": "Specific JD requirement you're addressing"
}`;

export const FOLLOW_UP_PROMPT = (question, answer, topic, depth) => `
The candidate was asked: "${question}"

Their answer: "${answer}"

Current topic: ${topic}
Current depth on this topic: ${depth}

Generate a follow-up question that:
1. Digs deeper into their answer (ask about specifics, challenges, outcomes)
2. Stays on the same topic: ${topic}
3. Is more probing than the previous question
4. Helps reveal their actual experience level

Return ONLY a JSON object:
{
  "question": "Your follow-up question",
  "topic": "${topic}"
}`;

export const SCORING_PROMPT = (question, answer, resume, jobDescription) => `
Score this interview answer using the rubrics below.

**Question:** ${question}

**Answer:** ${answer}

**Resume Context:**
${resume.substring(0, 500)}...

**Job Description Context:**
${jobDescription.substring(0, 500)}...

**Scoring Rubrics (1-10 scale):**

**Clarity (1-10):**
- 1-3: Rambling, unclear, hard to follow
- 4-6: Somewhat clear but lacks structure
- 7-8: Clear and well-organized
- 9-10: Exceptionally articulate and concise

**Depth (1-10):**
- 1-3: Surface-level, no details
- 4-6: Some details but missing key elements
- 7-8: Good depth with specific examples
- 9-10: Comprehensive with metrics and outcomes

**Relevance (1-10):**
- 1-3: Off-topic or doesn't address question
- 4-6: Partially relevant
- 7-8: Directly relevant to question
- 9-10: Perfectly aligned with question and role requirements

**Structure (1-10):**
- 1-3: No clear structure
- 4-6: Loose structure, missing STAR elements
- 7-8: Good structure (Situation, Task, Action, Result)
- 9-10: Perfect STAR format with smooth transitions

**Feedback Requirements:**
- Provide 2-3 actionable improvement bullets
- Cite specific phrases from their answer
- Reference their resume or JD when relevant
- Be constructive and specific

Return ONLY a JSON object:
{
  "scores": {
    "clarity": 7,
    "depth": 6,
    "relevance": 8,
    "structure": 7
  },
  "feedback": [
    "Specific actionable feedback point 1",
    "Specific actionable feedback point 2",
    "Specific actionable feedback point 3"
  ],
  "strengths": ["What they did well"],
  "improvements": ["What to improve"]
}`;

export const FINAL_REPORT_PROMPT = (sessionData) => `
Generate a comprehensive interview performance report.

**Session Data:**
${JSON.stringify(sessionData, null, 2)}

**Report Requirements:**

1. **Overall Performance:**
   - Calculate average scores across all rubrics
   - Identify score trends (improving/declining)
   - Overall assessment (Strong/Good/Needs Improvement)

2. **Strengths (scores >= 7):**
   - List top 3 strengths with examples from their answers
   - Cite specific questions where they excelled

3. **Weaknesses (scores < 5):**
   - List areas needing improvement
   - Provide specific examples from their answers

4. **7-Day Practice Plan:**
   - Day 1-2: Focus area with specific exercises
   - Day 3-4: Focus area with specific exercises
   - Day 5-6: Focus area with specific exercises
   - Day 7: Mock interview simulation

   Each day should have:
   - Specific skill to practice
   - 2-3 concrete exercises
   - Success criteria

Return ONLY a JSON object:
{
  "overallScore": 7.2,
  "assessment": "Good - solid foundation with room for growth",
  "scoreBreakdown": {
    "clarity": 7.5,
    "depth": 6.8,
    "relevance": 7.8,
    "structure": 6.8
  },
  "strengths": [
    {
      "area": "Communication Clarity",
      "evidence": "Consistently articulate in questions 1, 3, 5",
      "score": 8.2
    }
  ],
  "weaknesses": [
    {
      "area": "Answer Depth",
      "evidence": "Lacked specific metrics in questions 2, 4",
      "score": 4.5
    }
  ],
  "practicePlan": {
    "day1-2": {
      "focus": "Adding Quantifiable Results",
      "exercises": [
        "Review past projects and document 3 metrics per project",
        "Practice STAR stories with specific numbers"
      ],
      "successCriteria": "Every answer includes at least one metric"
    },
    "day3-4": {
      "focus": "...",
      "exercises": ["..."],
      "successCriteria": "..."
    },
    "day5-6": {
      "focus": "...",
      "exercises": ["..."],
      "successCriteria": "..."
    },
    "day7": {
      "focus": "Full Mock Interview",
      "exercises": [
        "Record yourself answering 5 questions",
        "Self-review using the rubrics"
      ],
      "successCriteria": "Average score improvement of 1+ point"
    }
  }
}`;

export const INITIAL_QUESTIONS_PROMPT = (resume, jobDescription) => `
Generate 5 diverse interview questions for this candidate.

**Resume:**
${resume}

**Job Description:**
${jobDescription}

**Requirements:**
1. Cover 5 different topics (e.g., Leadership, Technical Skills, Problem Solving, Teamwork, Conflict Resolution)
2. Each question must cite specific resume elements
3. Each question must connect to JD requirements
4. Mix behavioral and situational questions
5. Order by importance for the role

Return ONLY a JSON array:
[
  {
    "question": "Question text",
    "topic": "Topic label",
    "resumeCitation": "What you're referencing from resume",
    "jdCitation": "What you're addressing from JD"
  }
]`;
