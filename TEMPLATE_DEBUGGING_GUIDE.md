# 🔍 Template System Debugging Guide

**Issue**: AI does not seem to be using database templates, or templates are not saving.

---

## ✅ Step-by-Step Debugging

### **Step 1: Check if Templates are Saving to Database**

#### **Test in UI:**
1. Go to **Admin** → **Goal Template Management**
2. Click **"Create New Template"**
3. Fill in basic fields:
   - Name: "Test Template - Two Step Add/Sub"
   - Subject: Math
   - Topic: "two-step word problem"
   - Area of Need: "Math Computation"
   - Goal Title Template: "Two-Step Problems - Grade {{gradeLevel}}"
   - Goal Text Template: "Student will solve two-step word problems with {{threshold}} accuracy {{condition}}"
   - Assessment Method: Hybrid
   - **Check**: ✅ Addition, ✅ Subtraction
   - **Example Question**: "Maria had $30. She earned $15, then spent $8. How much does she have now?"
   - **Example Answer**: "$37"
4. Click **Save**
5. **Look for**: Success message "Template created successfully"

#### **Check Browser Console:**
```javascript
// Should see:
📝 Creating new template: {name: "Test Template...", ...}
✅ Template created successfully: abc123def456
```

#### **Check Firestore Database:**
1. Open Firebase Console
2. Go to **Firestore Database**
3. Look for collection: **`goalTemplates`**
4. Check if your template appears with all fields:
   - `name`
   - `subject: "math"`
   - `topic: "two-step word problem"`
   - `areaOfNeed`
   - `exampleQuestion`
   - `exampleAnswer`
   - `allowedOperations: ["addition", "subtraction"]` ← **NEW FIELD**
   - `isActive: true`
   - `createdAt: [timestamp]`

---

### **Step 2: Check if Templates are Being Retrieved**

#### **Test Retrieval:**
Open browser console and run:

```javascript
// In your browser console while on the app:
import { getActiveTemplates } from '@/firebase/templateServices'

// Get all active templates
const templates = await getActiveTemplates()
console.log(`Found ${templates.length} templates:`, templates)

// Check for your specific template
const testTemplate = templates.find(t => t.name.includes('Test Template'))
console.log('Your template:', testTemplate)
console.log('Has allowedOperations?', testTemplate?.allowedOperations)
```

**Expected Output:**
```javascript
Found 1 templates: [...]
Your template: {
  id: "abc123",
  name: "Test Template - Two Step Add/Sub",
  allowedOperations: ["addition", "subtraction"],
  ...
}
Has allowedOperations? ["addition", "subtraction"]
```

---

### **Step 3: Check Template Matching During PA Generation**

#### **Generate a PA and Watch Console:**

1. Go to **Goal Management**
2. Find or create a goal with text: **"Student will solve two-step word problems using addition and subtraction with 80% accuracy"**
3. Make sure the goal has:
   - Area of Need: "Math Computation"
   - Grade Level: 7
4. Click **"Generate Assessments"**
5. **Watch browser console** for these messages:

**What You Should See:**
```javascript
🔍 Template Matching: Found 1 active templates in database
🔍 Matching against goal: {
  goalTitle: "...",
  goalText: "Student will solve two-step word problems...",
  areaOfNeed: "Math Computation"
}
📊 Top 3 template candidates:
  1. "Test Template - Two Step Add/Sub" - Score: 35 {
    areaOfNeed: '+10 (exact match)',
    topic: '+15 (topic: "two-step word problem")',
    subject: '+5',
    exampleQuestion: '+5'
  }
✨ Found matching template: "Test Template - Two Step Add/Sub" (score: 35)
🔒 Template has operation constraints: addition, subtraction
```

**If you see:**
```javascript
📋 No templates in database, using coded templates
```
→ **Problem**: Templates not being retrieved from Firestore

**If you see:**
```javascript
📋 No matching template found (best score: 8, need ≥15). Using coded templates.
```
→ **Problem**: Template score too low (needs at least 15 points to match)

---

### **Step 4: Verify AI is Using Operation Constraints**

After generating PA, check the console for:

```javascript
✨ Using allowed operations from template: addition, subtraction

// In AI prompt building:
🔒 OPERATION CONSTRAINTS (CRITICAL):
- You MUST use ONLY these operations: addition, subtraction
```

---

## 🐛 Common Issues & Solutions

### **Issue 1: Templates Not Saving**

**Symptoms:**
- No success message after clicking Save
- Error in console: "❌ Error creating template"
- Template doesn't appear in Firestore

**Solutions:**

#### A. Check Firestore Rules
Go to Firebase Console → Firestore → Rules

Make sure you have:
```javascript
match /goalTemplates/{templateId} {
  // Allow authenticated users to read templates
  allow read: if request.auth != null;
  
  // Allow admins to create/update/delete templates
  allow create, update, delete: if request.auth != null 
    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

#### B. Check for JavaScript Errors
Open Browser Console (F12) → Look for red errors

Common issues:
- `Cannot read property 'X' of undefined` → Missing required field
- `Firestore: PERMISSION_DENIED` → User not admin or rules issue
- `Network error` → Firebase not initialized properly

#### C. Verify User is Admin
Run in console:
```javascript
// Check your user role
import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()
console.log('Current user role:', auth.currentUser?.role)
// Should be: 'admin'
```

---

### **Issue 2: Templates Not Being Found**

**Symptoms:**
- Console shows: "No templates in database"
- `getActiveTemplates()` returns empty array

**Solutions:**

#### A. Check Template `isActive` Field
Templates must have `isActive: true`

In Firestore, check your template document:
- If `isActive: false` → Click "Activate" in UI
- If `isActive` missing → Add field manually: `isActive: true`

#### B. Check COLLECTIONS Constant
File: `src/types/users.ts`

Should have:
```typescript
export const COLLECTIONS = {
  // ...
  GOAL_TEMPLATES: 'goalTemplates', // ← Must match Firestore collection name
}
```

#### C. Check Firebase Connection
```javascript
import { db } from '@/firebase/config'
console.log('Firebase connected?', db)
// Should not be undefined
```

---

### **Issue 3: Template Score Too Low (Not Matching)**

**Symptoms:**
```javascript
📋 No matching template found (best score: 8, need ≥15). Using coded templates.
```

**Scoring Breakdown:**
- Area of Need exact match: **+10 points**
- Topic match in goal text: **+15 points**
- Subject match: **+5 points**
- Grade level exact: **+3 points**
- Assessment method match: **+2 points**
- Has example question: **+5 points**
- Matching operations: **+3 per operation**

**Need at least 15 points to use template!**

**Solutions:**

#### A. Make Sure Topic is in Goal Text
If template has `topic: "two-step word problem"`, goal text must include that phrase.

**Example:**
✅ "Student will solve **two-step word problems** with..."
❌ "Student will solve multi-step math problems with..."

#### B. Match Area of Need Exactly
Template: `areaOfNeed: "Math Computation"`
Goal: `areaOfNeed: "Math Computation"` ← Must match!

Not: "Math", "Computation", "Math - Computation"

#### C. Add Example Question
Templates with example questions get **+5 bonus points**

Make sure template has:
- `exampleQuestion`: "..."
- `exampleAnswer`: "..."

---

### **Issue 4: AI Not Respecting Operation Constraints**

**Symptoms:**
- Generated questions use multiplication/division when only add/sub allowed
- No operation constraint message in console

**Solutions:**

#### A. Check Template Was Actually Used
Look for in console:
```javascript
✨ Found matching template: "..." (score: XX)
🔒 Template has operation constraints: addition, subtraction
```

If you don't see this, template wasn't used → See Issue 3

#### B. Check AI Prompt
The prompt should include:
```
🔒 OPERATION CONSTRAINTS (CRITICAL):
- You MUST use ONLY these operations: addition, subtraction
```

#### C. AI Limitations
⚠️ **Important**: AI doesn't always follow instructions perfectly!
- Gemini/OpenAI might occasionally ignore constraints
- This is a limitation of AI, not your code
- Template-based generation (non-AI) ALWAYS respects constraints

**Workaround**: Use `method: 'template'` instead of `method: 'hybrid'` in config to force template-only generation

---

## 🧪 Testing Checklist

### ✅ **Test 1: Template Saves**
- [ ] Create template in UI
- [ ] See success message
- [ ] Template appears in Firestore `goalTemplates` collection
- [ ] Has `allowedOperations` field with correct array

### ✅ **Test 2: Template Loads**
- [ ] Refresh page
- [ ] Go to Goal Template Management
- [ ] See template in list
- [ ] See operation badges: [addition] [subtraction]

### ✅ **Test 3: Template Matches**
- [ ] Create matching goal
- [ ] Generate PA
- [ ] Console shows: "Found matching template"
- [ ] Console shows score ≥ 15

### ✅ **Test 4: Operations Enforced**
- [ ] Generate PA with matched template
- [ ] Console shows: "Template has operation constraints"
- [ ] Review 5 generated questions
- [ ] Verify NO multiplication or division

---

## 📝 Quick Diagnostic Script

Run this in browser console while on your app:

```javascript
// Diagnostic Script
(async () => {
  console.log('🔍 TEMPLATE SYSTEM DIAGNOSTIC')
  console.log('================================')
  
  // 1. Check if we can import functions
  try {
    const { getActiveTemplates } = await import('@/firebase/templateServices')
    console.log('✅ Template services loaded')
    
    // 2. Try to get templates
    const templates = await getActiveTemplates()
    console.log(`✅ Found ${templates.length} active templates`)
    
    // 3. Check each template
    templates.forEach((t, i) => {
      console.log(`\nTemplate ${i + 1}:`)
      console.log(`  Name: ${t.name}`)
      console.log(`  Subject: ${t.subject}`)
      console.log(`  Topic: ${t.topic || '(none)'}`)
      console.log(`  Area of Need: ${t.areaOfNeed}`)
      console.log(`  Has Example: ${!!(t.exampleQuestion && t.exampleAnswer)}`)
      console.log(`  Operations: ${t.allowedOperations?.join(', ') || '(all allowed)'}`)
      console.log(`  Active: ${t.isActive}`)
    })
    
    // 4. Check user permissions
    const { useAuthStore } = await import('@/stores/auth')
    const auth = useAuthStore()
    console.log(`\n✅ Current user role: ${auth.currentUser?.role}`)
    
    console.log('\n================================')
    console.log('✅ DIAGNOSTIC COMPLETE')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
})()
```

**Expected Output:**
```
🔍 TEMPLATE SYSTEM DIAGNOSTIC
================================
✅ Template services loaded
✅ Found 1 active templates

Template 1:
  Name: Test Template - Two Step Add/Sub
  Subject: math
  Topic: two-step word problem
  Area of Need: Math Computation
  Has Example: true
  Operations: addition, subtraction
  Active: true

✅ Current user role: admin
================================
✅ DIAGNOSTIC COMPLETE
```

---

## 🆘 Still Not Working?

### Check These Files for Errors:

1. **src/types/iep.ts** - GoalTemplate interface has `allowedOperations?` field
2. **src/services/goalQuestionGenerator.ts** - `findMatchingTemplate()` function
3. **src/firebase/templateServices.ts** - `createTemplate()` and `getActiveTemplates()`
4. **src/components/admin/GoalTemplateManagement.vue** - Form saves `allowedOperations`

### Get More Help:

1. **Check Browser Console** - Look for errors (red text)
2. **Check Firestore Console** - Verify data structure
3. **Check Firebase Rules** - Make sure permissions allow reads/writes
4. **Try in Incognito Mode** - Rules out browser cache issues

---

## 📧 Report an Issue

If still not working, provide:

1. **Screenshot of Firestore** showing goalTemplates collection
2. **Browser console logs** when generating PA
3. **Template configuration** (name, topic, area of need, operations selected)
4. **Goal text** you're trying to match

This will help diagnose the specific issue!



