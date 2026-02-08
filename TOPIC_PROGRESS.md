# Topic-Based Progress Indicator
**Date:** February 8, 2026
**Status:** ✅ Implemented

---

## 🎯 Implementation: Option A - Topic-Based Progress

### Visual Design

```
┌─────────────────────────────────────────┐
│  [Topic 3 of 5]  [Follow-up 2]         │
│                                         │
│  ○ ● ● ○ ○                             │
│  (completed, active, pending dots)      │
│                                         │
│  📌 System Design & Architecture        │
└─────────────────────────────────────────┘
```

### Features

1. **Topic Counter**
   - Shows "Topic X of Y" where Y = total initial questions (10)
   - Updates when moving to new topic

2. **Follow-up Indicator**
   - Orange badge appears when asking follow-up questions
   - Shows "Follow-up 1", "Follow-up 2", etc.
   - Disappears when moving to new topic

3. **Visual Progress Dots**
   - Gray dots: Pending topics
   - Green dots: Completed topics
   - Blue dot (larger): Current active topic
   - Smooth animations on transitions

4. **Topic Name Display**
   - Shows current topic being discussed
   - Updates with each question

### State Management

**New State Variables:**
```javascript
const [currentTopic, setCurrentTopic] = useState('');
const [topicNumber, setTopicNumber] = useState(0);
const [totalTopics, setTotalTopics] = useState(0);
const [isFollowUp, setIsFollowUp] = useState(false);
const [followUpDepth, setFollowUpDepth] = useState(0);
```

**Logic:**
- On interview start: Set topic 1, total topics = 10
- On new question:
  - If follow-up: Increment followUpDepth
  - If new topic: Increment topicNumber, reset followUpDepth

### Styling

**Colors:**
- Background: Light blue gradient (#f0f8ff → #e8f4ff)
- Border: Blue (#667eea)
- Topic badge: Blue (#667eea)
- Follow-up badge: Orange (#f59e0b)
- Completed dots: Green (#22c55e)
- Active dot: Blue (#667eea) with glow
- Pending dots: Gray (#e0e0e0)

**Animations:**
- Dots scale up when active (1.3x)
- Dots scale slightly when completed (1.1x)
- Active dot has pulsing glow effect
- Smooth transitions (0.3s ease)

---

## 📊 How It Works

### Example Flow:

**Question 1 (Initial):**
```
Topic 1 of 10
● ○ ○ ○ ○ ○ ○ ○ ○ ○
📌 JavaScript Fundamentals
```

**Question 2 (Follow-up):**
```
Topic 1 of 10  [Follow-up 1]
● ○ ○ ○ ○ ○ ○ ○ ○ ○
📌 JavaScript Fundamentals
```

**Question 3 (Follow-up):**
```
Topic 1 of 10  [Follow-up 2]
● ○ ○ ○ ○ ○ ○ ○ ○ ○
📌 JavaScript Fundamentals
```

**Question 4 (New Topic):**
```
Topic 2 of 10
✓ ● ○ ○ ○ ○ ○ ○ ○ ○
📌 React & Component Design
```

---

## ✅ Benefits

1. **Honest Progress**
   - Shows actual topic progress, not arbitrary question count
   - Users understand they're diving deep into topics

2. **Clear Context**
   - Follow-up badge indicates depth exploration
   - Topic name shows what's being discussed

3. **Visual Feedback**
   - Dots provide quick visual reference
   - Color coding shows status at a glance

4. **No Confusion**
   - Doesn't promise specific question count
   - Adapts to dynamic follow-ups naturally

---

## 🔄 Backend Integration

**Required from Backend:**
- `response.data.topic` - Current topic name
- `response.data.isFollowUp` - Boolean flag
- `response.data.totalQuestions` - Initial question count (10)

**Already Available:**
- ✅ `topic` field exists in backend responses
- ✅ `isFollowUp` logic exists in backend
- ✅ Works with current API structure

---

## 📱 Responsive Design

**Desktop:**
- Full width progress bar
- Dots clearly visible
- Badges side-by-side

**Mobile:**
- Stacks vertically if needed
- Smaller dots (12px instead of 16px)
- Maintains readability

---

## 🎨 Visual Hierarchy

1. **Primary:** Topic counter badge (blue, bold)
2. **Secondary:** Follow-up badge (orange, smaller)
3. **Tertiary:** Progress dots (visual reference)
4. **Context:** Topic name (subtle, informative)

---

## 🚀 Future Enhancements

Possible additions:
- [ ] Estimated time per topic
- [ ] Topic difficulty indicator
- [ ] Expandable topic history
- [ ] Topic completion percentage

---

**Live at:** https://34.220.81.64

**Next:** Round selection feature (Technical/HR/Behavioral)
