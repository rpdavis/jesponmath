# LaTeX/TikZ Solutions for Composite Shapes

## Can We Use TikZ Directly?

### Unfortunately, No - Here's Why:

**Browser Limitations:**
- ❌ **KaTeX** - Only math expressions, no TikZ/graphics
- ❌ **MathJax** - Has limited TikZ support, but very slow and buggy
- ❌ **Pure LaTeX** - Requires full LaTeX engine (can't run in browser)

**TikZ needs:**
- LaTeX compiler (pdflatex, xelatex)
- TikZ package and dependencies
- Server-side processing

---

## LaTeX-Based Solutions (That Actually Work)

### ⭐ Option 1: QuickLaTeX API (Auto-Render TikZ to Images)

**How it works:**
Instead of uploading images, use a LaTeX-to-image API that converts TikZ code on-the-fly.

**Example - Teacher writes this:**
```latex
\begin{tikzpicture}
  \draw (0,0) rectangle (6.5,4);
  \draw (6.5,0) -- (9.5,0) -- (6.5,4) -- cycle;
  \draw (0,4) -- (3.25,6.5) -- (6.5,4) -- cycle;
\end{tikzpicture}
```

**System automatically converts to:**
```html
<img src="https://quicklatex.com/cache3/...xyz.png" alt="Composite shape">
```

**Implementation:**

```typescript
// src/utils/tikzRenderer.ts
import katex from 'katex'

/**
 * Detect TikZ code in question text and convert to images
 */
export function renderTikZInText(text: string): string {
  // Regex to find TikZ environments
  const tikzRegex = /\\begin\{tikzpicture\}([\s\S]*?)\\end\{tikzpicture\}/g
  
  let result = text
  let match
  
  while ((match = tikzRegex.exec(text)) !== null) {
    const tikzCode = match[0]
    const imageUrl = convertTikZToImage(tikzCode)
    
    // Replace TikZ code with image
    result = result.replace(
      tikzCode, 
      `<img src="${imageUrl}" alt="Geometric diagram" style="max-width: 400px; display: block; margin: 10px auto;">`
    )
  }
  
  // Then render regular LaTeX math with KaTeX
  return renderLatexInText(result)
}

/**
 * Convert TikZ code to image URL using QuickLaTeX API
 */
function convertTikZToImage(tikzCode: string): string {
  // Build LaTeX document
  const latexDoc = `
\\documentclass[border=2pt]{standalone}
\\usepackage{tikz}
\\begin{document}
${tikzCode}
\\end{document}
  `.trim()
  
  // Encode for URL
  const encoded = encodeURIComponent(latexDoc)
  
  // QuickLaTeX API endpoint
  return `https://quicklatex.com/latex3.f?formula=${encoded}&fsize=20px&fcolor=000000&mode=0&out=1&errors=1`
}
```

**Update latexUtils.ts:**
```typescript
import { renderTikZInText } from './tikzRenderer'

export function renderLatexInText(text: string): string {
  // First, handle any TikZ diagrams
  text = renderTikZInText(text)
  
  // Then handle regular math with KaTeX
  // ... existing KaTeX rendering logic
}
```

**Pros:**
- ✅ Teachers write pure LaTeX/TikZ
- ✅ Automatic conversion (no manual uploads)
- ✅ Works in editor, student view, print
- ✅ No external dependencies/hosting needed
- ✅ Scales to any number of diagrams

**Cons:**
- ⚠️ Depends on external API (QuickLaTeX)
- ⚠️ Network delay for first load (cached after)
- ⚠️ API rate limits (usually generous for free tier)

**Estimated Implementation:** 2-4 hours

---

### ⭐⭐ Option 2: Server-Side LaTeX Rendering (Cloud Function)

**How it works:**
Create a Firebase Cloud Function that compiles LaTeX/TikZ to SVG/PNG.

**Flow:**
1. Teacher writes TikZ in editor
2. On save, send to Cloud Function
3. Function runs LaTeX compiler → generates image
4. Upload to Firebase Storage
5. Return URL and store with question

**Implementation:**

```typescript
// functions/src/index.ts
import * as functions from 'firebase-functions'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs'
import * as path from 'path'

const execAsync = promisify(exec)

export const renderTikz = functions.https.onCall(async (data, context) => {
  const { tikzCode } = data
  
  // Create temporary LaTeX file
  const tempDir = '/tmp'
  const filename = `diagram_${Date.now()}`
  const texFile = path.join(tempDir, `${filename}.tex`)
  
  const latexDoc = `
\\documentclass[border=2pt]{standalone}
\\usepackage{tikz}
\\begin{document}
${tikzCode}
\\end{document}
  `
  
  fs.writeFileSync(texFile, latexDoc)
  
  try {
    // Compile LaTeX to PDF
    await execAsync(`pdflatex -output-directory=${tempDir} ${texFile}`)
    
    // Convert PDF to PNG
    const pdfFile = path.join(tempDir, `${filename}.pdf`)
    const pngFile = path.join(tempDir, `${filename}.png`)
    await execAsync(`convert -density 300 ${pdfFile} -quality 90 ${pngFile}`)
    
    // Upload to Firebase Storage
    const bucket = admin.storage().bucket()
    const destination = `tikz-diagrams/${filename}.png`
    await bucket.upload(pngFile, { destination })
    
    // Get public URL
    const file = bucket.file(destination)
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: '03-01-2500', // Far future
    })
    
    // Cleanup
    fs.unlinkSync(texFile)
    fs.unlinkSync(pdfFile)
    fs.unlinkSync(pngFile)
    
    return { success: true, imageUrl: url }
  } catch (error) {
    console.error('LaTeX compilation error:', error)
    throw new functions.https.HttpsError('internal', 'Failed to compile LaTeX')
  }
})
```

**Frontend Integration:**

```typescript
// src/services/tikzCompiler.ts
import { functions } from '@/firebase/config'
import { httpsCallable } from 'firebase/functions'

export async function compileTikZ(tikzCode: string): Promise<string> {
  const renderTikz = httpsCallable(functions, 'renderTikz')
  const result = await renderTikz({ tikzCode })
  
  if (result.data.success) {
    return result.data.imageUrl
  }
  throw new Error('Failed to compile TikZ')
}
```

**QuestionEditor Enhancement:**

```vue
<template>
  <!-- Add TikZ editor tab -->
  <div v-if="showTikzEditor" class="tikz-editor">
    <label>TikZ Diagram Code</label>
    <textarea 
      v-model="tikzCode" 
      placeholder="Enter TikZ code..."
      rows="10"
    ></textarea>
    
    <button @click="compileTikZ" :disabled="compiling">
      {{ compiling ? 'Compiling...' : 'Compile & Preview' }}
    </button>
    
    <div v-if="compiledImageUrl" class="preview">
      <img :src="compiledImageUrl" alt="TikZ diagram preview">
    </div>
    
    <button @click="insertTikZ" :disabled="!compiledImageUrl">
      Insert into Question
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { compileTikZ as compileCode } from '@/services/tikzCompiler'

const tikzCode = ref('')
const compiledImageUrl = ref('')
const compiling = ref(false)

async function compileTikZ() {
  compiling.value = true
  try {
    compiledImageUrl.value = await compileCode(tikzCode.value)
  } catch (error) {
    alert('Failed to compile TikZ code. Check syntax.')
  } finally {
    compiling.value = false
  }
}

function insertTikZ() {
  // Insert <img> tag into question text
  const imgTag = `<img src="${compiledImageUrl.value}" alt="Composite shape" style="max-width: 400px;">`
  // ... insert at cursor or append to question
}
</script>
```

**Pros:**
- ✅ Full LaTeX/TikZ support
- ✅ Images stored in your Firebase
- ✅ No external API dependency
- ✅ Complete control over rendering
- ✅ Can reuse compiled images

**Cons:**
- ❌ Complex setup (LaTeX on Cloud Functions)
- ❌ Cloud Function execution costs
- ❌ Need LaTeX/ImageMagick on server
- ❌ Compilation takes 2-5 seconds

**Estimated Implementation:** 1-2 days

**Requirements:**
- Docker container with LaTeX installed
- Or use pre-built LaTeX image
- Firebase Blaze plan (for external API calls)

---

### ⭐⭐⭐ Option 3: Hybrid - TikZ with QuickLaTeX Caching

**Best of both worlds:**

1. **First time:** Use QuickLaTeX API to generate image
2. **Then:** Cache the image URL in question data
3. **Future loads:** Use cached URL (no API call)

**Implementation:**

```typescript
// src/utils/tikzRenderer.ts
interface TikzCache {
  [code: string]: string // Map TikZ code to cached image URL
}

const tikzCache: TikzCache = {}

export async function renderTikZWithCache(text: string): Promise<string> {
  const tikzRegex = /\\begin\{tikzpicture\}([\s\S]*?)\\end\{tikzpicture\}/g
  let result = text
  const matches = [...text.matchAll(tikzRegex)]
  
  for (const match of matches) {
    const tikzCode = match[0]
    
    // Check cache first
    if (tikzCache[tikzCode]) {
      result = result.replace(tikzCode, createImageTag(tikzCache[tikzCode]))
      continue
    }
    
    // Compile with QuickLaTeX
    const imageUrl = await fetchQuickLaTeXImage(tikzCode)
    
    // Cache it
    tikzCache[tikzCode] = imageUrl
    
    // Replace in text
    result = result.replace(tikzCode, createImageTag(imageUrl))
  }
  
  return result
}

async function fetchQuickLaTeXImage(tikzCode: string): Promise<string> {
  const response = await fetch('https://quicklatex.com/latex3.f', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      formula: `\\begin{document}${tikzCode}\\end{document}`,
      fsize: '20px',
      fcolor: '000000',
      mode: '0',
      out: '1',
      preamble: '\\usepackage{tikz}'
    })
  })
  
  const data = await response.text()
  // Parse QuickLaTeX response to get image URL
  const urlMatch = data.match(/https?:\/\/[^\s]+\.png/)
  
  if (urlMatch) {
    return urlMatch[0]
  }
  
  throw new Error('Failed to generate TikZ image')
}

function createImageTag(url: string): string {
  return `<img src="${url}" alt="Geometric diagram" style="max-width: 400px; display: block; margin: 10px auto;">`
}
```

**Store in Question Data:**

```typescript
export interface AssessmentQuestion {
  // ... existing fields
  tikzDiagrams?: {
    code: string
    imageUrl: string
  }[] // Cache compiled TikZ diagrams
}
```

**Pros:**
- ✅ Pure LaTeX workflow
- ✅ Automatic caching
- ✅ Fast after first load
- ✅ No manual image creation
- ✅ Fallback to API if cache misses

**Cons:**
- ⚠️ Initial load requires API call
- ⚠️ External API dependency

**Estimated Implementation:** 3-4 hours

---

## My Recommendation for LaTeX/TikZ

### **Option 3: Hybrid Approach** (QuickLaTeX + Caching)

**Why:**
- ⚡ **Fast to implement** (3-4 hours vs 1-2 days)
- 💰 **Free** (no Cloud Function costs)
- 📝 **Pure LaTeX** (teachers write TikZ directly)
- 🚀 **Fast** (cached after first load)
- 🔒 **Reliable** (cached URLs stored in Firestore)

**Teacher Workflow:**
```markdown
1. Write question in editor
2. Paste TikZ code directly:

Find the area:

\begin{tikzpicture}
  \draw (0,0) rectangle (6.5,4);
  \draw (6.5,0) -- (9.5,0) -- (6.5,4) -- cycle;
\end{tikzpicture}

3. Click "Preview" → System compiles via QuickLaTeX
4. Save → Image URL cached in question data
5. Students see rendered diagram (no compilation delay)
```

**Would you like me to implement this?**

I can build the hybrid TikZ renderer that:
- ✅ Detects `\begin{tikzpicture}` in question text
- ✅ Compiles to image via QuickLaTeX
- ✅ Caches the result
- ✅ Shows in editor preview
- ✅ Displays for students
- ✅ Prints correctly

**Implementation time:** ~3-4 hours

Let me know! 🎯
