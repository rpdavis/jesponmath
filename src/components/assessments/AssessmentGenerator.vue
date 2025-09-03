<template>
  <div class="assessment-generator">
    <div class="generator-header">
      <h1>📄 Printable Assessment Generator</h1>
      <p>Create professional math assessments that can be printed for students</p>
    </div>

    <form @submit.prevent="generateAssessment" class="generator-form">
      <!-- Assessment Info -->
      <div class="form-section">
        <h2>📋 Assessment Information</h2>
        
        <div class="form-row">
          <div class="form-group">
            <label for="title">Assessment Title *</label>
            <input 
              id="title"
              v-model="form.title" 
              type="text" 
              required 
              class="form-input"
              placeholder="e.g., Multiplication Assessment"
            >
          </div>
          
          <div class="form-group">
            <label for="subtitle">Subtitle (optional)</label>
            <input 
              id="subtitle"
              v-model="form.subtitle" 
              type="text" 
              class="form-input"
              placeholder="e.g., Whole Numbers (up to 4 digits) × Single Digit"
            >
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="teacherName">Teacher Name</label>
            <input 
              id="teacherName"
              v-model="form.teacherName" 
              type="text" 
              class="form-input"
              placeholder="Your name"
            >
          </div>
          
          <div class="form-group">
            <label for="assessmentCount">Number of Assessments</label>
            <select v-model="form.assessmentCount" class="form-select">
              <option value="1">1 Assessment</option>
              <option value="2">2 Assessments</option>
              <option value="3">3 Assessments</option>
              <option value="4">4 Assessments</option>
              <option value="5">5 Assessments</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Problem Configuration -->
      <div class="form-section">
        <h2>🔢 Problem Configuration</h2>
        
        <div class="form-row">
          <div class="form-group">
            <label>Operations (select one or more)</label>
            <div class="operations-checkboxes">
              <label class="checkbox-option">
                <input type="checkbox" v-model="form.operations" value="multiplication">
                <span>Multiplication (×)</span>
              </label>
              <label class="checkbox-option">
                <input type="checkbox" v-model="form.operations" value="division">
                <span>Division (÷)</span>
              </label>
              <label class="checkbox-option">
                <input type="checkbox" v-model="form.operations" value="addition">
                <span>Addition (+)</span>
              </label>
              <label class="checkbox-option">
                <input type="checkbox" v-model="form.operations" value="subtraction">
                <span>Subtraction (−)</span>
              </label>
            </div>
          </div>
          
          <div class="form-group">
            <label for="numberType">Number Type</label>
            <select v-model="form.numberType" class="form-select">
              <option value="integers">Integers</option>
              <option value="negative-integers">Negative Integers</option>
              <option value="decimals">Decimals</option>
              <option value="money">Money</option>
            </select>
          </div>
        </div>

        <!-- Decimal Place Controls -->
        <div v-if="form.numberType === 'decimals'" class="decimal-config">
          <h4>Decimal Places</h4>
          <div class="form-row">
            <div class="form-group">
              <label>Minimum Decimal Places</label>
              <select v-model="form.minDecimalPlaces" class="form-select">
                <option value="1">1 decimal place</option>
                <option value="2">2 decimal places</option>
                <option value="3">3 decimal places</option>
              </select>
            </div>
            <div class="form-group">
              <label>Maximum Decimal Places</label>
              <select v-model="form.maxDecimalPlaces" class="form-select">
                <option value="1">1 decimal place</option>
                <option value="2">2 decimal places</option>
                <option value="3">3 decimal places</option>
              </select>
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="problemCount">Problems per Assessment</label>
            <select v-model="form.problemCount" class="form-select">
              <option value="4">4 Problems</option>
              <option value="5">5 Problems</option>
              <option value="8">8 Problems</option>
              <option value="10">10 Problems</option>
              <option value="12">12 Problems</option>
              <option value="15">15 Problems</option>
              <option value="20">20 Problems</option>
            </select>
          </div>
        </div>

        <!-- Number Range Configuration -->
        <div class="number-config">
          <h3>Number Ranges</h3>
          
          <div class="form-row">
            <div class="form-group">
              <label>First Number</label>
              <div class="range-inputs">
                <select v-model="form.minDigits1" class="form-select small">
                  <option value="1">1 digit</option>
                  <option value="2">2 digits</option>
                  <option value="3">3 digits</option>
                  <option value="4">4 digits</option>
                </select>
                <span>to</span>
                <select v-model="form.maxDigits1" class="form-select small">
                  <option value="1">1 digit</option>
                  <option value="2">2 digits</option>
                  <option value="3">3 digits</option>
                  <option value="4">4 digits</option>
                </select>
              </div>
            </div>
            
            <div class="form-group">
              <label>Second Number</label>
              <div class="range-inputs">
                <select v-model="form.minDigits2" class="form-select small">
                  <option value="1">1 digit</option>
                  <option value="2">2 digits</option>
                  <option value="3">3 digits</option>
                  <option value="4">4 digits</option>
                </select>
                <span>to</span>
                <select v-model="form.maxDigits2" class="form-select small">
                  <option value="1">1 digit</option>
                  <option value="2">2 digits</option>
                  <option value="3">3 digits</option>
                  <option value="4">4 digits</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Presets -->
        <div class="presets-section">
          <h3>Quick Presets</h3>
          <div class="preset-buttons">
            <button type="button" @click="applyPreset('multiplicationBasic')" class="preset-btn">
              Basic Multiplication<br>
              <small>3-4 digits × 1 digit</small>
            </button>
            <button type="button" @click="applyPreset('multiplicationAdvanced')" class="preset-btn">
              Advanced Multiplication<br>
              <small>4 digits × 2 digits</small>
            </button>
            <button type="button" @click="applyPreset('divisionBasic')" class="preset-btn">
              Basic Division<br>
              <small>2-3 digits ÷ 1 digit</small>
            </button>
            <button type="button" @click="applyPreset('mixedOperations')" class="preset-btn">
              Mixed Operations<br>
              <small>All four operations</small>
            </button>
          </div>
        </div>
      </div>

      <!-- Layout Options -->
      <div class="form-section">
        <h2>📐 Layout Options</h2>
        
        <div class="form-row">
          <div class="form-group">
            <label for="instructions">Instructions</label>
            <textarea 
              id="instructions"
              v-model="form.instructions"
              class="form-input"
              rows="2"
              placeholder="Solve each problem in the box. Show your work."
            ></textarea>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>
              <input type="checkbox" v-model="form.generateAnswerKey">
              Generate Answer Key
            </label>
          </div>
          
          <div class="form-group">
            <label>
              <input type="checkbox" v-model="form.allowZeros">
              Allow zeros in numbers
            </label>
          </div>
        </div>
      </div>

      <!-- Preview Section -->
      <div v-if="previewProblems.length > 0" class="form-section">
        <h2>👀 Problem Preview</h2>
        <div class="problem-preview">
          <div v-for="(problem, index) in previewProblems.slice(0, 4)" :key="problem.id" class="preview-problem">
            <span class="problem-number">#{{ index + 1 }}</span>
            <span class="problem-expression">{{ problem.operand1 }} {{ problem.operator }} {{ problem.operand2 }} = {{ problem.answer }}</span>
          </div>
          <div v-if="previewProblems.length > 4" class="more-problems">
            ... and {{ previewProblems.length - 4 }} more problems
          </div>
        </div>
        <button type="button" @click="generatePreview" class="preview-btn">
          🔄 Generate New Preview
        </button>
      </div>

      <!-- Generate Button -->
      <div class="form-actions">
        <button type="button" @click="generatePreview" class="preview-button">
          👀 Preview Problems
        </button>
        <button type="submit" class="generate-button" :disabled="loading">
          {{ loading ? 'Generating...' : '📄 Generate Assessment(s)' }}
        </button>
      </div>
    </form>

    <!-- Generated Files -->
    <div v-if="generatedFiles.length > 0" class="generated-files">
      <h2>📁 Generated Files</h2>
      <div class="files-list">
        <div v-for="file in generatedFiles" :key="file.name" class="file-item">
          <div class="file-info">
            <span class="file-name">{{ file.name }}</span>
            <span class="file-type">{{ file.type }}</span>
          </div>
          <div class="file-actions">
            <button @click="showPreview(file)" class="preview-file-btn">👀 Preview</button>
            <button @click="downloadFile(file)" class="download-btn">⬇️ Download</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Preview Modal -->
    <div v-if="previewFile" class="preview-modal" @click="closePreview">
      <div class="preview-content" @click.stop>
        <div class="preview-header">
          <h3>Assessment Preview</h3>
          <button @click="closePreview" class="close-btn">×</button>
        </div>
        <div class="preview-iframe-container">
          <iframe :src="previewUrl" class="preview-iframe"></iframe>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { MathProblemGenerator, type GeneratorOptions, type MathProblem } from '@/utils/mathProblemGenerator';
import { PrintableAssessmentGenerator, type PrintableAssessmentOptions } from '@/utils/printableAssessmentGenerator';

interface GeneratedFile {
  name: string;
  type: string;
  content: string;
  blob: Blob;
}

const form = reactive({
  title: 'Math Assessment',
  subtitle: 'Whole Numbers Practice',
  teacherName: 'Teacher',
  assessmentCount: 3,
  operations: ['multiplication'] as ('multiplication' | 'division' | 'addition' | 'subtraction')[],
  numberType: 'integers' as GeneratorOptions['numberType'],
  problemCount: 10,
  minDigits1: 3,
  maxDigits1: 4,
  minDigits2: 1,
  maxDigits2: 1,
  minDecimalPlaces: 1,
  maxDecimalPlaces: 2,
  allowZeros: false,
  instructions: 'Solve each problem in the box. Show your work.',
  generateAnswerKey: true
});

const loading = ref(false);
const previewProblems = ref<MathProblem[]>([]);
const generatedFiles = ref<GeneratedFile[]>([]);
const previewFileContent = ref<GeneratedFile | null>(null);
const previewUrl = ref('');

const previewFile = computed(() => previewFileContent.value);

const generatePreview = () => {
  if (form.operations.length === 0) {
    alert('Please select at least one operation');
    return;
  }
  
  const generator = new MathProblemGenerator();
  const options: GeneratorOptions = {
    operations: form.operations,
    numberType: form.numberType,
    count: Math.min(form.problemCount, 10), // Limit preview
    minDigits1: form.minDigits1,
    maxDigits1: form.maxDigits1,
    minDigits2: form.minDigits2,
    maxDigits2: form.maxDigits2,
    minDecimalPlaces: form.minDecimalPlaces,
    maxDecimalPlaces: form.maxDecimalPlaces,
    allowZeros: form.allowZeros
  };
  
  previewProblems.value = generator.generateProblems(options);
};

const applyPreset = (preset: string) => {
  switch (preset) {
    case 'multiplicationBasic':
      form.operations = ['multiplication'];
      form.numberType = 'integers';
      form.minDigits1 = 3;
      form.maxDigits1 = 4;
      form.minDigits2 = 1;
      form.maxDigits2 = 1;
      form.subtitle = 'Whole Numbers (up to 4 digits) × Single Digit';
      break;
    case 'multiplicationAdvanced':
      form.operations = ['multiplication'];
      form.numberType = 'integers';
      form.minDigits1 = 4;
      form.maxDigits1 = 4;
      form.minDigits2 = 2;
      form.maxDigits2 = 2;
      form.subtitle = '4-digit × 2-digit Multiplication';
      break;
    case 'divisionBasic':
      form.operations = ['division'];
      form.numberType = 'integers';
      form.minDigits1 = 2;
      form.maxDigits1 = 3;
      form.minDigits2 = 1;
      form.maxDigits2 = 1;
      form.subtitle = 'Division with Single-Digit Divisors';
      break;
    case 'mixedOperations':
      form.operations = ['multiplication', 'division', 'addition', 'subtraction'];
      form.numberType = 'integers';
      form.minDigits1 = 2;
      form.maxDigits1 = 4;
      form.minDigits2 = 1;
      form.maxDigits2 = 2;
      form.subtitle = 'Mixed Operations Practice';
      break;
  }
  generatePreview();
};

const generateAssessment = async () => {
  loading.value = true;
  generatedFiles.value = [];

  try {
    const generator = new MathProblemGenerator();
    const problemSets: MathProblem[][] = [];

    // Validate operations selection
    if (form.operations.length === 0) {
      alert('Please select at least one operation');
      return;
    }
    
    // Generate problem sets for each assessment
    for (let i = 0; i < form.assessmentCount; i++) {
      const options: GeneratorOptions = {
        operations: form.operations,
        numberType: form.numberType,
        count: form.problemCount,
        minDigits1: form.minDigits1,
        maxDigits1: form.maxDigits1,
        minDigits2: form.minDigits2,
        maxDigits2: form.maxDigits2,
        minDecimalPlaces: form.minDecimalPlaces,
        maxDecimalPlaces: form.maxDecimalPlaces,
        allowZeros: form.allowZeros
      };
      
      const problems = generator.generateProblems(options);
      problemSets.push(problems);
    }

    // Generate HTML files
    const baseOptions: Omit<PrintableAssessmentOptions, 'problems' | 'assessmentNumber'> = {
      title: form.title,
      subtitle: form.subtitle,
      teacherName: form.teacherName,
      instructions: form.instructions,
      numberType: form.numberType
    };

    const htmlFiles = PrintableAssessmentGenerator.generateMultipleAssessments(
      baseOptions,
      problemSets,
      1
    );

    // Create files for download
    htmlFiles.forEach((html, index) => {
      const assessmentNumber = index + 1;
      const filename = PrintableAssessmentGenerator.generateFilename(form.title, assessmentNumber);
      const blob = PrintableAssessmentGenerator.createDownloadBlob(html);
      
      generatedFiles.value.push({
        name: filename,
        type: 'Assessment',
        content: html,
        blob
      });
    });

    // Generate answer key if requested
    if (form.generateAnswerKey && problemSets.length > 0) {
      const answerKeyHtml = PrintableAssessmentGenerator.generateAnswerKey({
        ...baseOptions,
        problems: problemSets[0], // Use first assessment for answer key
        assessmentNumber: 1
      });
      
      const filename = PrintableAssessmentGenerator.generateFilename(form.title, 1, true);
      const blob = PrintableAssessmentGenerator.createDownloadBlob(answerKeyHtml);
      
      generatedFiles.value.push({
        name: filename,
        type: 'Answer Key',
        content: answerKeyHtml,
        blob
      });
    }

  } catch (error) {
    console.error('Error generating assessment:', error);
    alert('Error generating assessment. Please try again.');
  } finally {
    loading.value = false;
  }
};

const showPreview = (file: GeneratedFile) => {
  previewFileContent.value = file;
  previewUrl.value = URL.createObjectURL(file.blob);
};

const closePreview = () => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }
  previewFileContent.value = null;
  previewUrl.value = '';
};

const downloadFile = (file: GeneratedFile) => {
  const url = URL.createObjectURL(file.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Initialize with preview
generatePreview();
</script>

<style scoped>
.assessment-generator {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.generator-header {
  text-align: center;
  margin-bottom: 30px;
}

.generator-header h1 {
  color: #1f2937;
  font-size: 2rem;
  margin-bottom: 10px;
}

.generator-header p {
  color: #6b7280;
  font-size: 1.1rem;
}

.generator-form {
  background: white;
  border-radius: 15px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.form-section {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.form-section:last-child {
  border-bottom: none;
}

.form-section h2 {
  color: #1f2937;
  font-size: 1.3rem;
  margin-bottom: 20px;
}

.form-section h3 {
  color: #374151;
  font-size: 1.1rem;
  margin-bottom: 15px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-group label {
  font-weight: 500;
  color: #374151;
}

.form-input, .form-select {
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
}

.form-input:focus, .form-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.number-config {
  background: #f9fafb;
  padding: 20px;
  border-radius: 8px;
  margin: 20px 0;
}

.range-inputs {
  display: flex;
  align-items: center;
  gap: 10px;
}

.range-inputs .form-select.small {
  width: 100px;
}

.presets-section {
  margin-top: 20px;
}

.preset-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.preset-btn {
  padding: 15px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.preset-btn:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 10px rgba(59, 130, 246, 0.1);
}

.preset-btn small {
  color: #6b7280;
  display: block;
  margin-top: 5px;
}

.problem-preview {
  background: #f3f4f6;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 15px;
}

.preview-problem {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 10px;
  font-family: 'Courier New', monospace;
}

.problem-number {
  font-weight: bold;
  color: #3b82f6;
  min-width: 30px;
}

.problem-expression {
  font-size: 1.1rem;
}

.more-problems {
  color: #6b7280;
  font-style: italic;
  text-align: center;
  margin-top: 10px;
}

.preview-btn {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.form-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 30px;
}

.preview-button {
  background: #6b7280;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.preview-button:hover {
  background: #4b5563;
}

.generate-button {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.generate-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
}

.generate-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.generated-files {
  margin-top: 30px;
  background: white;
  border-radius: 15px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.generated-files h2 {
  color: #1f2937;
  margin-bottom: 20px;
}

.files-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.file-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.file-name {
  font-weight: 500;
  color: #1f2937;
}

.file-type {
  color: #6b7280;
  font-size: 0.9rem;
}

.file-actions {
  display: flex;
  gap: 10px;
}

.preview-file-btn, .download-btn {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.preview-file-btn {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.preview-file-btn:hover {
  background: #e5e7eb;
}

.download-btn {
  background: #10b981;
  color: white;
}

.download-btn:hover {
  background: #059669;
}

.preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.preview-content {
  width: 90vw;
  height: 90vh;
  background: white;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.preview-header h3 {
  margin: 0;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  padding: 5px;
  border-radius: 4px;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.preview-iframe-container {
  flex: 1;
  padding: 20px;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .preset-buttons {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .file-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
}

/* Operations Checkboxes */
.operations-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 15px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.checkbox-option {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s;
}

.checkbox-option:hover {
  background: #f3f4f6;
}

.checkbox-option input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.checkbox-option span {
  font-weight: 500;
  color: #374151;
}

.decimal-config {
  background: #f0f9ff;
  padding: 20px;
  border-radius: 8px;
  margin: 15px 0;
  border: 1px solid #bae6fd;
}

.decimal-config h4 {
  color: #1e40af;
  margin-bottom: 15px;
  font-size: 1rem;
}
</style>
