# Round-Type Selection Feature
**Date:** February 8, 2026
**Status:** ✅ Implemented

---

## 🎯 Feature Overview

Added interview round selection with company research for HR and Behavioral rounds.

### New Flow:
```
Setup (Resume + JD)
    ↓
Round Selection (NEW)
    ↓
Interview (Tailored Questions)
    ↓
Report
```

---

## 🎨 Round Types

### 1. 💻 Technical Round
**Focus:**
- Coding and algorithms
- System design and architecture
- Technical problem-solving
- Technology stack and tools
- Code optimization
- Technical fundamentals

**No company research needed**

### 2. 👔 HR Round
**Focus:**
- Culture fit and company values
- Career goals and aspirations
- Salary expectations
- Work-life balance
- Why this company/role
- Long-term career plans

**✅ Includes company research:**
- Company culture and values
- Interview process and style
- What they look for in candidates
- Known HR interview patterns

### 3. 🎭 Behavioral Round
**Focus:**
- Leadership examples (STAR method)
- Conflict resolution
- Team collaboration
- Problem-solving stories
- Handling pressure
- Learning from failures

**✅ Includes company research:**
- Company culture and values
- Interview style
- Behavioral patterns
- Values alignment

### 4. 🎯 Mixed Round
**Focus:**
- 40% Technical questions
- 30% Behavioral questions
- 30% HR/Culture fit questions

**Comprehensive practice**

---

## 🔍 Company Research Feature

### How It Works:

**For HR & Behavioral Rounds:**
1. Backend extracts company name from job description
2. LLM generates company research summary:
   - Company culture and values
   - Interview process and style
   - What they look for in candidates
   - Known interview patterns
3. Research is used to generate company-specific questions

**Example Research Output:**
```
"Amazon is known for its Leadership Principles-based interviews,
focusing heavily on customer obsession and ownership. They use
behavioral questions with the STAR method and expect specific
examples. The culture values data-driven decision making and
high standards."
```

### Questions Generated:
- **Without research:** "Tell me about a time you showed leadership"
- **With research:** "Amazon values 'Ownership' - tell me about a time you took ownership of a project beyond your role"

---

## 🎨 UI Design

### Round Selection Cards:
```
┌─────────────────────────────────────┐
│  💻 Technical Round                 │
│  Coding, algorithms, system design  │
│  • Data structures                  │
│  • System architecture              │
│  • Code optimization                │
│  • Technical concepts               │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  👔 HR Round                        │
│  Culture fit, values, career goals  │
│  • Company culture & values         │
│  • Career aspirations               │
│  • Salary expectations              │
│  • Work-life balance                │
│  [🔍 Includes company research]     │
└─────────────────────────────────────┘
```

**Visual States:**
- Default: Gray border, light background
- Selected: Blue border, blue background, scaled up
- Hover: Lift animation

---

## 🔧 Technical Implementation

### Frontend Changes:

**New State:**
```javascript
const [roundType, setRoundType] = useState(''); // technical, hr, behavioral, mixed
```

**New Stage:**
```javascript
const [stage, setStage] = useState('setup'); 
// Now: setup → round-selection → interview → report
```

**API Call:**
```javascript
axios.post('/api/start', { 
  resume, 
  jobDescription,
  roundType  // NEW
});
```

### Backend Changes:

**Updated `/api/start` endpoint:**
```javascript
const { resume, jobDescription, roundType } = req.body;

// For HR/Behavioral, research company
let companyInfo = '';
if (roundType === 'hr' || roundType === 'behavioral') {
  companyInfo = await callOpenRouter(companyResearchPrompt, ...);
}

// Generate questions with round type and company info
const questionsPrompt = INITIAL_QUESTIONS_PROMPT(
  resume, 
  jobDescription, 
  roundType, 
  companyInfo
);
```

**Session Storage:**
```javascript
const session = {
  ...
  roundType,      // NEW
  companyInfo,    // NEW
  ...
};
```

### Prompt Engineering:

**Updated `INITIAL_QUESTIONS_PROMPT`:**
```javascript
export const INITIAL_QUESTIONS_PROMPT = (
  resume, 
  jobDescription, 
  roundType = 'mixed', 
  companyInfo = ''
) => {
  // Different instructions per round type
  const roundInstructions = {
    technical: "Focus on coding, algorithms...",
    hr: "Focus on culture fit... ${companyInfo}",
    behavioral: "Focus on STAR method... ${companyInfo}",
    mixed: "40% technical, 30% behavioral, 30% HR"
  };
  
  return `Generate 10 ${roundType} questions...
  ${roundInstructions[roundType]}
  ${companyInfo ? `Company Context: ${companyInfo}` : ''}`;
};
```

---

## 📊 Question Distribution

### Technical Round:
- 100% technical questions
- Focus on skills from resume
- Match JD technical requirements

### HR Round:
- 100% HR/culture questions
- Company-specific context
- Values and fit assessment

### Behavioral Round:
- 100% STAR-method questions
- Company culture alignment
- Past experience examples

### Mixed Round:
- 4 technical questions (40%)
- 3 behavioral questions (30%)
- 3 HR questions (30%)

---

## 🎯 Benefits

### For Users:
✅ Targeted practice for specific interview types
✅ Company-specific preparation (HR/Behavioral)
✅ Realistic interview simulation
✅ Better preparation efficiency

### For Quality:
✅ More relevant questions
✅ Context-aware questioning
✅ Company culture alignment
✅ Professional interview experience

---

## 🔄 User Flow Example

**Step 1: Setup**
- Upload resume
- Upload job description
- Click "Continue to Round Selection →"

**Step 2: Round Selection**
- See 4 round type cards
- Click desired round (e.g., HR Round)
- Card highlights with blue border
- See "🔍 Includes company research" badge
- Click "Start Interview →"

**Step 3: Interview**
- Backend researches company (for HR/Behavioral)
- Generates 10 company-specific questions
- Conducts interview with tailored questions

**Step 4: Report**
- Same as before
- Report reflects round type focus

---

## 🚀 Future Enhancements

Possible additions:
- [ ] Show company research summary to user
- [ ] Allow multiple round types in one session
- [ ] Save round type preference
- [ ] Round-specific scoring rubrics
- [ ] Company-specific feedback

---

## 📝 Files Modified

### Frontend:
- `/home/ec2-user/PrepPulse/frontend/src/App.jsx`
  - Added `roundType` state
  - Added round-selection stage
  - Added round selection UI
  - Added round card styles

### Backend:
- `/home/ec2-user/PrepPulse/backend/server.js`
  - Updated `/api/start` to accept `roundType`
  - Added company research logic
  - Store roundType in session

- `/home/ec2-user/PrepPulse/backend/prompts.js`
  - Updated `INITIAL_QUESTIONS_PROMPT` signature
  - Added round-specific instructions
  - Added company context integration

---

## ✅ Testing Checklist

- [x] Technical round generates technical questions
- [x] HR round triggers company research
- [x] Behavioral round triggers company research
- [x] Mixed round generates balanced questions
- [x] Round selection UI works
- [x] Back button returns to setup
- [x] Can't start without selecting round
- [x] Selected card highlights properly

---

**Live at:** https://34.220.81.64

**Status:** Ready for testing! 🎉
