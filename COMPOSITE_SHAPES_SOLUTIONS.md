# Composite Shapes Diagrams - Solution Options

## Problem

You want to create assessment questions with composite geometric shapes (like this):
```latex
\begin{tikzpicture}
  % Rectangle + Triangle + Triangle
  \draw (0,0) rectangle (6.5,4);
  \draw (6.5,0) -- (9.5,0) -- (6.5,4) -- cycle;
  \draw (0,4) -- (3.25,6.5) -- (6.5,4) -- cycle;
\end{tikzpicture}
```

**Issue:** KaTeX doesn't support TikZ (LaTeX drawing package).

---

## Solution Options (Ranked by Ease of Implementation)

### ⭐ Option 1: Use External Image Links (EASIEST - Ready Now!)

**How it works:**
1. Create your TikZ diagram in an external LaTeX editor
2. Export as PNG/SVG image
3. Upload to a public URL (Firebase Storage, Imgur, etc.)
4. Embed in question text with HTML `<img>` tag

**Example Question Text:**
```html
Find the area of this composite shape:

<img src="https://your-firebase-storage.com/composite-shape-1.png" 
     alt="Composite shape diagram" 
     style="max-width: 400px; display: block; margin: 10px 0;">

The shape consists of a rectangle (6.5 × 4) and two triangles.

Calculate the total area in square units.
```

**Pros:**
- ✅ Works RIGHT NOW - no code changes needed
- ✅ HTML `<img>` tags work in questionText (rendered via `v-html`)
- ✅ High quality diagrams
- ✅ Can create with any tool (LaTeX, Desmos, GeoGebra, etc.)

**Cons:**
- ❌ External dependency (images must be hosted)
- ❌ Manual process for each question
- ❌ Images not stored with question data

**Best For:** 
- Quick assessments you need NOW
- Small number of questions (5-10)
- One-time or occasional use

**Tools to Create Diagrams:**
1. **Overleaf** (https://www.overleaf.com/) - LaTeX editor with TikZ
2. **GeoGebra** (https://www.geogebra.org/) - Interactive geometry tool
3. **Desmos Geometry** (https://www.desmos.com/geometry) - Online graphing
4. **QuickLaTeX** (https://quicklatex.com/) - LaTeX to image converter

---

### ⭐⭐ Option 2: Add `questionImage` Field (MODERATE - Quick Implementation)

**What I'd build:**
Add an optional `questionImage` URL field to the `AssessmentQuestion` interface.

**Code Changes Needed:**

1. **Update Type** (`src/types/iep.ts`):
```typescript
export interface AssessmentQuestion {
  // ... existing fields
  questionImage?: string // URL to image (diagram, chart, graph, etc.)
  imageAltText?: string // Accessibility description
  imageWidth?: string // CSS width (e.g., "400px", "50%")
  // ... rest of fields
}
```

2. **Update QuestionEditor** (`src/components/assessments/editor/QuestionEditor.vue`):
```vue
<div class="question-image-section">
  <label>Question Image (Optional)</label>
  <input 
    v-model="question.questionImage" 
    type="url"
    placeholder="https://example.com/diagram.png"
  >
  <input 
    v-model="question.imageAltText" 
    placeholder="Describe the image for accessibility"
  >
  <select v-model="question.imageWidth">
    <option value="300px">Small (300px)</option>
    <option value="400px">Medium (400px)</option>
    <option value="600px">Large (600px)</option>
    <option value="100%">Full Width</option>
  </select>
  
  <!-- Preview -->
  <div v-if="question.questionImage" class="image-preview">
    <img 
      :src="question.questionImage" 
      :alt="question.imageAltText || 'Question diagram'"
      :style="{ maxWidth: question.imageWidth || '400px' }"
    >
  </div>
</div>
```

3. **Update AssessmentTaking** (`src/components/assessments/AssessmentTaking.vue`):
```vue
<!-- In question display -->
<div v-if="currentQuestion.questionImage" class="question-image">
  <img 
    :src="currentQuestion.questionImage"
    :alt="currentQuestion.imageAltText || 'Question diagram'"
    :style="{ maxWidth: currentQuestion.imageWidth || '400px' }"
    @error="handleImageError"
  >
</div>
<div class="question-text" v-html="renderLatexInText(currentQuestion.questionText)"></div>
```

4. **Update Print Modal** - Include images in printed assessments

**Pros:**
- ✅ Clean, structured approach
- ✅ Images part of question data
- ✅ Works in editor, student view, and print
- ✅ Accessible (alt text support)
- ✅ Reusable for ALL question types

**Cons:**
- ❌ Still requires external image hosting
- ❌ ~2-3 hours of development work

**Best For:**
- Regular use of diagrams
- Multiple questions with images
- Long-term solution

**Estimated Implementation Time:** 2-3 hours

---

### ⭐⭐⭐ Option 3: Add Firebase Storage Integration (ROBUST)

**What I'd build:**
Full image upload and storage system using Firebase Storage.

**Features:**
- Upload images directly in QuestionEditor
- Auto-store in Firebase Storage
- Generate secure URLs automatically
- Image management (delete, replace)
- Thumbnail generation

**Code Changes:**

1. **Create Image Upload Component** (`src/components/assessments/editor/ImageUploader.vue`)
2. **Add Firebase Storage service** (`src/firebase/storageServices.ts`)
3. **Update QuestionEditor** with upload button
4. **Add image library/gallery** for reusing diagrams

**Pros:**
- ✅ No external hosting needed
- ✅ Integrated workflow
- ✅ Can reuse uploaded diagrams
- ✅ Automatic URL management
- ✅ Professional solution

**Cons:**
- ❌ More complex implementation (~1-2 days)
- ❌ Firebase Storage costs (minimal for images)
- ❌ Need to handle image deletion/cleanup

**Best For:**
- Production-ready solution
- Frequent diagram use
- Multiple teachers creating assessments

**Estimated Implementation Time:** 1-2 days

---

### ⭐⭐⭐⭐ Option 4: SVG Drawing Tool (ADVANCED - Future Enhancement)

**What I'd build:**
In-app SVG drawing tool for creating composite shapes directly.

**Features:**
- Visual shape builder
- Drag-and-drop shapes (rectangles, triangles, circles)
- Dimension labels
- Export to SVG
- Save as templates

**Technologies:**
- **Fabric.js** or **Konva.js** - Canvas libraries
- **D3.js** - SVG manipulation
- Custom Vue component

**Pros:**
- ✅ No external tools needed
- ✅ Consistent style across all diagrams
- ✅ Teachers can create shapes in-app
- ✅ Most professional solution

**Cons:**
- ❌ Complex development (~1-2 weeks)
- ❌ Learning curve for teachers
- ❌ Maintenance burden

**Best For:**
- Long-term investment
- High-volume diagram creation
- Platform differentiation

**Estimated Implementation Time:** 1-2 weeks

---

## My Recommendation

### For Your Immediate Need:

**Use Option 1 (External Image Links)** - You can create your assessment TODAY:

1. Go to **Overleaf** (https://www.overleaf.com/)
2. Create your TikZ diagrams
3. Export as PNG
4. Upload to Firebase Storage or Imgur
5. Use `<img>` tags in question text

**Example workflow:**
```latex
% In Overleaf
\documentclass{standalone}
\usepackage{tikz}
\begin{document}
\begin{tikzpicture}
  \draw (0,0) rectangle (6.5,4);
  \draw (6.5,0) -- (9.5,0) -- (6.5,4) -- cycle;
  \draw (0,4) -- (3.25,6.5) -- (6.5,4) -- cycle;
\end{tikzpicture}
\end{document}
```
→ Download as PNG  
→ Upload to Firebase Storage  
→ Copy URL  
→ Paste in question:

```html
<img src="https://firebasestorage.googleapis.com/.../composite-shape.png" 
     style="max-width: 400px;">
     
Calculate the area of the composite shape above.
```

### For Long-Term:

**I'd implement Option 2 (`questionImage` field)** - Best balance of:
- ⚡ Speed (2-3 hours)
- 💪 Functionality (works everywhere)
- 🔄 Reusability (all question types benefit)
- 🎯 Simplicity (easy to use and maintain)

Would you like me to:
1. **Help you with Option 1** (show how to upload images to Firebase Storage)?
2. **Implement Option 2** (add `questionImage` field to the app)?
3. **Both** (quick solution now + proper implementation for future)?

---

## Quick Firebase Storage Guide (Option 1)

If you want to use Option 1 right now:

### Upload via Firebase Console:
1. Go to Firebase Console → Storage
2. Create folder: `assessment-images/composite-shapes/`
3. Upload your PNG files
4. Click image → Copy URL
5. Paste URL in question text with `<img>` tag

### Or I can add a quick upload utility to make this easier!

Let me know which direction you'd like to go! 🎯
