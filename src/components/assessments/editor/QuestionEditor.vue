<template>
  <div class="question-item" :class="{ expanded }">
    <div class="question-header" @click="emit('toggle-expand')">
      <div class="question-title">
        <h3>Question {{ index + 1 }}</h3>
        <span v-if="question.questionText" class="question-preview">{{ getQuestionPreview() }}</span>
        <span v-else class="no-content">No question text</span>
      </div>
      <div class="question-meta">
        <span class="question-type-badge">{{ getQuestionTypeName() }}</span>
        <span class="question-points">{{ question.points || 0 }} pts</span>
        <span class="expand-icon">{{ expanded ? '▼' : '▶' }}</span>
      </div>
    </div>

    <div v-if="expanded" class="question-content">
      <div class="question-actions-bar">
        <button
          type="button"
          @click.stop="emit('move-up')"
          :disabled="index === 0"
          class="action-button"
          title="Move Up"
        >
          ↑ Move Up
        </button>
        <button
          type="button"
          @click.stop="emit('move-down')"
          :disabled="index === totalQuestions - 1"
          class="action-button"
          title="Move Down"
        >
          ↓ Move Down
        </button>
        <button
          type="button"
          @click.stop="emit('duplicate')"
          class="action-button"
          title="Duplicate"
        >
          📋 Duplicate
        </button>
        <button
          type="button"
          @click.stop="confirmDelete"
          class="action-button delete-button"
          title="Delete Question"
        >
          🗑️ Delete
        </button>
      </div>

      <!-- Question Text -->
      <div class="form-group">
        <label>Question Text *</label>
        <LaTeXEditor
          v-model="question.questionText"
          :rows="3"
          placeholder="Enter the question... Use $...$ for inline math or $$...$$ for display math (e.g., What is $x^2 + 5x - 6$?)"
        />
      </div>

      <!-- Standards Selection -->
      <div class="form-group">
        <div class="accordion-header" @click.stop="toggleStandards">
          <label>📏 Standards for this Question</label>
          <div class="accordion-toggle">
            <span v-if="question.standard" class="current-standard">
              {{ getStandardDisplayName(question.standard) }}
            </span>
            <span v-else class="no-standard">No standard selected</span>
            <span class="accordion-icon" :class="{ expanded: showStandards }">
              {{ showStandards ? '▼' : '▶' }}
            </span>
          </div>
        </div>

        <div v-if="showStandards" class="accordion-content">
          <StandardSelector
            :modelValue="getStandardSelectionValue()"
            :grade="gradeLevel.toString()"
            @update:modelValue="handleStandardSelection"
          />
        </div>
      </div>

      <!-- Question Type and Points -->
      <div class="form-row">
        <div class="form-group">
          <label>Question Type *</label>
          <select v-model="question.questionType" required class="form-select" @change="onQuestionTypeChange">
            <option value="">Select Type</option>
            <option value="multiple-choice">Multiple Choice</option>
            <option value="true-false">True/False</option>
            <option value="short-answer">Short Answer</option>
            <option value="fill-blank">Fill in the Blank</option>
            <option value="essay">Essay</option>
            <option value="fraction">Fraction</option>
            <option value="matching">Matching</option>
            <option value="rank-order">Rank Order</option>
            <option value="checkbox">Multiple Select (Checkboxes)</option>
            <option value="horizontal-ordering">Horizontal Ordering</option>
          </select>
        </div>

        <div class="form-group">
          <label>Points *</label>
          <input
            v-model.number="question.points"
            type="number"
            required
            class="form-input"
            min="1"
            max="100"
          >
        </div>
      </div>

      <!-- Composite Question Toggle -->
      <div class="form-group composite-toggle">
        <label class="checkbox-label">
          <input 
            type="checkbox" 
            v-model="isCompositeQuestion"
            @change="onCompositeToggle"
          />
          <span class="checkbox-text">
            🔗 Multi-part question (link multiple sub-questions together)
          </span>
        </label>
        <p v-if="isCompositeQuestion" class="help-text">
          Create sub-questions (Part A, Part B, etc.) that are graded together as one question.
        </p>
      </div>

      <!-- Sub-Questions Editor (if composite) -->
      <div v-if="isCompositeQuestion" class="sub-questions-section">
        <div class="sub-questions-header">
          <h4>Sub-Questions</h4>
          <div class="scoring-mode-selector">
            <label>Scoring Mode:</label>
            <select v-model="question.subQuestionScoringMode" class="form-select">
              <option value="all-or-nothing">All-or-Nothing (all parts must be correct)</option>
              <option value="proportional">Proportional (partial credit allowed)</option>
            </select>
          </div>
        </div>

        <div class="sub-questions-list">
          <div 
            v-for="(subQ, subIndex) in question.subQuestions" 
            :key="subQ.id"
            class="sub-question-item"
          >
            <div class="sub-question-header">
              <span class="sub-question-label">{{ subQ.partLabel }}</span>
              <button 
                type="button" 
                @click="removeSubQuestion(subIndex)"
                class="remove-sub-btn"
                title="Remove this part"
              >
                ✕
              </button>
            </div>

            <div class="sub-question-content">
              <div class="form-group">
                <label>Question Text *</label>
                <LaTeXEditor
                  v-model="subQ.questionText"
                  :rows="2"
                  placeholder="Enter sub-question text..."
                />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Type *</label>
                  <select v-model="subQ.questionType" required class="form-select">
                    <option value="multiple-choice">Multiple Choice</option>
                    <option value="true-false">True/False</option>
                    <option value="short-answer">Short Answer</option>
                    <option value="fraction">Fraction</option>
                  </select>
                </div>

                <div class="form-group">
                  <label>Point Weight (0-1) *</label>
                  <input
                    v-model.number="subQ.pointWeight"
                    type="number"
                    required
                    class="form-input"
                    min="0"
                    max="1"
                    step="0.1"
                  >
                </div>
              </div>

              <!-- Sub-question type-specific fields -->
              <component
                :is="getSubQuestionTypeComponent(subQ.questionType)"
                v-if="subQ.questionType"
                :question="subQ"
              />

              <div class="form-group">
                <label>Explanation (optional)</label>
                <textarea
                  v-model="subQ.explanation"
                  class="form-textarea"
                  rows="1"
                  placeholder="Explanation for this part..."
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        <button type="button" @click="addSubQuestion" class="add-sub-question-btn">
          + Add Part {{ getNextPartLabel() }}
        </button>

        <div v-if="getTotalWeights() !== 1" class="weight-warning">
          ⚠️ Warning: Point weights should add up to 1.0 (currently {{ getTotalWeights().toFixed(2) }})
        </div>
      </div>

      <!-- Dynamic Question Type Fields (only show if NOT composite) -->
      <component
        :is="getQuestionTypeComponent()"
        v-if="question.questionType && !isCompositeQuestion"
        :question="question"
      />

      <!-- Explanation and Hints -->
      <div class="form-group">
        <label>Explanation (optional)</label>
        <textarea
          v-model="question.explanation"
          class="form-textarea"
          rows="2"
          placeholder="Explanation to show students after they submit..."
        ></textarea>
      </div>

      <div class="form-group">
        <label>Hints (optional)</label>
        <div class="hints-list">
          <input
            v-for="(hint, hintIndex) in question.hints || []"
            :key="hintIndex"
            v-model="question.hints![hintIndex]"
            type="text"
            class="form-input hint-input"
            placeholder="Enter a hint..."
          >
        </div>
        <button type="button" @click="addHint" class="add-hint-button">
          + Add Hint
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import LaTeXEditor from '@/components/LaTeXEditor.vue';
import StandardSelector from '@/components/StandardSelector.vue';
import MultipleChoiceFields from './questionTypes/MultipleChoiceFields.vue'
import TrueFalseFields from './questionTypes/TrueFalseFields.vue'
import ShortAnswerFields from './questionTypes/ShortAnswerFields.vue'
import FractionFields from './questionTypes/FractionFields.vue'
import MatchingFields from './questionTypes/MatchingFields.vue'
import RankOrderFields from './questionTypes/RankOrderFields.vue'
import CheckboxFields from './questionTypes/CheckboxFields.vue'
import HorizontalOrderingFields from './questionTypes/HorizontalOrderingFields.vue'
import FillBlankFields from './questionTypes/FillBlankFields.vue'
import type { AssessmentQuestion, AssessmentSubQuestion } from '@/types/iep';
import type { CustomStandard } from '@/types/standards';
import { getAllCustomStandards } from '@/firebase/standardsServices';
import { getCCSSByCode } from '@/data/ccssStandards';

interface Props {
  question: AssessmentQuestion;
  index: number;
  totalQuestions: number;
  gradeLevel: number;
  expanded: boolean;
}

interface Emits {
  (e: 'move-up'): void;
  (e: 'move-down'): void;
  (e: 'delete'): void;
  (e: 'duplicate'): void;
  (e: 'toggle-expand'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const showStandards = ref(false);
const customStandards = ref<CustomStandard[]>([]);
const isCompositeQuestion = ref(false);

// Load custom standards on mount
onMounted(async () => {
  try {
    customStandards.value = await getAllCustomStandards();
  } catch (error) {
    console.error('Error loading custom standards:', error);
  }
  
  // Check if question already has sub-questions
  if (props.question.subQuestions && props.question.subQuestions.length > 0) {
    isCompositeQuestion.value = true;
  }
});

// Get standard display name from ID/code
const getStandardDisplayName = (standardCode: string): string => {
  if (!standardCode) return 'No standard';

  // Handle custom standards (format: "CUSTOM:code" or just "code" for custom)
  if (standardCode.startsWith('CUSTOM:')) {
    const code = standardCode.replace('CUSTOM:', '');
    const customStd = customStandards.value.find(s => s.code === code);
    return customStd?.name || code;
  }

  // Check if it's a custom standard code (without CUSTOM: prefix)
  const customStd = customStandards.value.find(s => s.code === standardCode);
  if (customStd) {
    return customStd.name;
  }

  // Check if it's a CCSS standard
  const ccssStd = getCCSSByCode(standardCode);
  if (ccssStd) {
    return ccssStd.title || ccssStd.code;
  }

  // Fallback: return the code as-is
  return standardCode;
};

// Convert stored standard code to StandardSelector format
const getStandardSelectionValue = () => {
  if (!props.question.standard) return null;
  
  const code = props.question.standard;
  
  // Check if it's a custom standard
  if (code.startsWith('CUSTOM:')) {
    const cleanCode = code.replace('CUSTOM:', '');
    const customStd = customStandards.value.find(s => s.code === cleanCode);
    if (customStd) {
      return {
        type: 'custom' as const,
        standardId: customStd.id,
        standard: customStd
      };
    }
  } else {
    // Check if it's a custom standard code (without prefix)
    const customStd = customStandards.value.find(s => s.code === code);
    if (customStd) {
      return {
        type: 'custom' as const,
        standardId: customStd.id,
        standard: customStd
      };
    }
    
    // Check if it's a CCSS standard
    const ccssStd = getCCSSByCode(code);
    if (ccssStd) {
      return {
        type: 'ccss' as const,
        standardId: ccssStd.code,
        standard: ccssStd
      };
    }
  }
  
  return null;
};

// Handle standard selection from StandardSelector
const handleStandardSelection = (val: any) => {
  if (!val) {
    props.question.standard = '';
    return;
  }
  
  if (val.type === 'custom') {
    // Store custom standard with CUSTOM: prefix
    props.question.standard = `CUSTOM:${val.standard.code}`;
  } else {
    // Store CCSS standard code
    props.question.standard = val.standard.code;
  }
};

const getQuestionPreview = () => {
  const text = props.question.questionText || '';
  // Remove LaTeX syntax for preview
  const plainText = text.replace(/\$\$.*?\$\$/g, '[math]').replace(/\$.*?\$/g, '[math]');
  return plainText.length > 60 ? plainText.substring(0, 60) + '...' : plainText;
};

const getQuestionTypeName = () => {
  const typeMap: Record<string, string> = {
    'multiple-choice': 'Multiple Choice',
    'true-false': 'True/False',
    'short-answer': 'Short Answer',
    'fill-blank': 'Fill in Blank',
    'essay': 'Essay',
    'fraction': 'Fraction',
    'matching': 'Matching',
    'rank-order': 'Rank Order',
    'checkbox': 'Multiple Select',
    'horizontal-ordering': 'Horizontal Ordering'
  };
  return typeMap[props.question.questionType || ''] || 'Unknown';
};

const getQuestionTypeComponent = () => {
  const componentMap: Record<string, any> = {
    'multiple-choice': MultipleChoiceFields,
    'true-false': TrueFalseFields,
    'short-answer': ShortAnswerFields,
    'essay': ShortAnswerFields, // Essay uses same fields as short answer
    'fraction': FractionFields,
    'matching': MatchingFields,
    'rank-order': RankOrderFields,
    'checkbox': CheckboxFields,
    'horizontal-ordering': HorizontalOrderingFields,
    'fill-blank': FillBlankFields,
  };
  return componentMap[props.question.questionType || ''] || null;
};

const toggleStandards = () => {
  showStandards.value = !showStandards.value;
};

const onQuestionTypeChange = () => {
  // Initialize question type specific fields
  switch (props.question.questionType) {
    case 'multiple-choice':
      props.question.options = props.question.options || ['', '', '', '']
      props.question.correctAnswer = ''
      break
    case 'true-false':
      props.question.correctAnswer = 'true'
      break
    case 'checkbox':
      props.question.options = props.question.options || ['', '', '', '']
      props.question.correctAnswers = props.question.correctAnswers || []
      break
    case 'matching':
      props.question.matchingPairs = props.question.matchingPairs || [
        { left: '', right: '' },
        { left: '', right: '' }
      ]
      break
    case 'rank-order':
      props.question.itemsToRank = props.question.itemsToRank || ['', '', '']
      props.question.orderType = 'ascending'
      break
    case 'fraction':
      props.question.correctFractionAnswers = props.question.correctFractionAnswers || ['']
      break
    case 'horizontal-ordering':
      props.question.orderingItems = props.question.orderingItems || []
      props.question.correctHorizontalOrder = props.question.correctHorizontalOrder || []
      props.question.orderDirection = props.question.orderDirection || 'ascending'
      console.log('📋 Initialized horizontal ordering:', props.question)
      break
    case 'fill-blank':
      props.question.blankFormat = props.question.blankFormat || ''
      props.question.correctAnswer = props.question.correctAnswer || ''
      props.question.acceptableAnswers = props.question.acceptableAnswers || []
      break
    case 'short-answer':
    case 'essay':
      props.question.correctAnswer = props.question.correctAnswer || ''
      props.question.acceptableAnswers = props.question.acceptableAnswers || []
      break
  }

  console.log('✅ Question type initialized:', props.question.questionType, props.question)
};

const addHint = () => {
  if (!props.question.hints) {
    props.question.hints = [];
  }
  props.question.hints.push('');
};

// Composite question functions
const onCompositeToggle = () => {
  if (isCompositeQuestion.value) {
    // Initialize sub-questions array and scoring mode
    if (!props.question.subQuestions) {
      props.question.subQuestions = [];
    }
    if (!props.question.subQuestionScoringMode) {
      props.question.subQuestionScoringMode = 'all-or-nothing';
    }
    // Add initial sub-question if empty
    if (props.question.subQuestions.length === 0) {
      addSubQuestion();
      addSubQuestion(); // Start with 2 parts
    }
  } else {
    // Clear sub-questions when toggled off
    if (confirm('Remove all sub-questions and convert back to a regular question?')) {
      props.question.subQuestions = undefined;
      props.question.subQuestionScoringMode = undefined;
    } else {
      isCompositeQuestion.value = true; // Keep it toggled on
    }
  }
};

const generateSubQuestionId = () => {
  return `${props.question.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const addSubQuestion = () => {
  if (!props.question.subQuestions) {
    props.question.subQuestions = [];
  }
  
  const partLabel = getNextPartLabel();
  const newSubQ: AssessmentSubQuestion = {
    id: generateSubQuestionId(),
    partLabel,
    questionText: '',
    questionType: 'short-answer',
    correctAnswer: '',
    pointWeight: 0.5,
    explanation: ''
  };
  
  props.question.subQuestions.push(newSubQ);
};

const removeSubQuestion = (index: number) => {
  if (props.question.subQuestions && confirm(`Remove ${props.question.subQuestions[index].partLabel}?`)) {
    props.question.subQuestions.splice(index, 1);
  }
};

const getNextPartLabel = () => {
  if (!props.question.subQuestions || props.question.subQuestions.length === 0) {
    return 'Part A';
  }
  const nextLetter = String.fromCharCode(65 + props.question.subQuestions.length); // A=65
  return `Part ${nextLetter}`;
};

const getTotalWeights = () => {
  if (!props.question.subQuestions) return 0;
  return props.question.subQuestions.reduce((sum, subQ) => sum + (subQ.pointWeight || 0), 0);
};

const getSubQuestionTypeComponent = (type: string) => {
  const componentMap: Record<string, any> = {
    'multiple-choice': MultipleChoiceFields,
    'true-false': TrueFalseFields,
    'short-answer': ShortAnswerFields,
    'fraction': FractionFields,
  };
  return componentMap[type] || null;
};

const confirmDelete = () => {
  if (confirm(`Delete Question ${props.index + 1}?`)) {
    emit('delete');
  }
};
</script>

<style scoped>
.question-item {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s;
}

.question-item.expanded {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: #f9fafb;
  cursor: pointer;
  transition: background 0.2s;
}

.question-header:hover {
  background: #f3f4f6;
}

.question-title {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.question-title h3 {
  margin: 0;
  font-size: 1.125rem;
  color: #1f2937;
}

.question-preview {
  color: #6b7280;
  font-size: 0.875rem;
  font-style: italic;
}

.no-content {
  color: #9ca3af;
  font-size: 0.875rem;
  font-style: italic;
}

.question-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.question-type-badge {
  padding: 0.25rem 0.75rem;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.question-points {
  padding: 0.25rem 0.75rem;
  background: #d1fae5;
  color: #065f46;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.expand-icon {
  color: #6b7280;
  font-size: 0.875rem;
}

.question-content {
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.question-actions-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.action-button {
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.action-button:hover:not(:disabled) {
  background: #e5e7eb;
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.delete-button {
  margin-left: auto;
  background: #fef2f2;
  border-color: #fecaca;
  color: #dc2626;
}

.delete-button:hover {
  background: #fee2e2;
  border-color: #fca5a5;
}

.accordion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.accordion-header:hover {
  background: #f3f4f6;
}

.accordion-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.current-standard {
  padding: 0.25rem 0.5rem;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.no-standard {
  color: #9ca3af;
  font-size: 0.875rem;
  font-style: italic;
}

.accordion-icon {
  color: #6b7280;
  font-size: 0.75rem;
  transition: transform 0.2s;
}

.accordion-icon.expanded {
  transform: rotate(90deg);
}

.accordion-content {
  margin-top: 0.5rem;
  padding: 1rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.hints-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.add-hint-button {
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
}

.add-hint-button:hover {
  background: #e5e7eb;
}

/* Composite Question Styles */
.composite-toggle {
  background: #f0f9ff;
  border: 2px solid #bae6fd;
  border-radius: 8px;
  padding: 1rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 500;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.checkbox-text {
  color: #0c4a6e;
}

.help-text {
  margin: 0.5rem 0 0 0;
  color: #64748b;
  font-size: 0.875rem;
  line-height: 1.4;
}

.sub-questions-section {
  background: #f8fafc;
  border: 2px solid #cbd5e1;
  border-radius: 8px;
  padding: 1.5rem;
  margin-top: 1rem;
}

.sub-questions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #cbd5e1;
}

.sub-questions-header h4 {
  margin: 0;
  color: #1e293b;
  font-size: 1.125rem;
}

.scoring-mode-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.scoring-mode-selector label {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 500;
  color: #475569;
}

.scoring-mode-selector select {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

.sub-questions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.sub-question-item {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.sub-question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
}

.sub-question-label {
  font-weight: 600;
  color: #334155;
  font-size: 0.9375rem;
}

.remove-sub-btn {
  padding: 0.25rem 0.5rem;
  background: #fee2e2;
  border: 1px solid #fca5a5;
  border-radius: 4px;
  color: #dc2626;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s;
}

.remove-sub-btn:hover {
  background: #fecaca;
}

.sub-question-content {
  padding: 1rem;
}

.add-sub-question-btn {
  width: 100%;
  padding: 0.75rem;
  margin-top: 1rem;
  background: white;
  border: 2px dashed #94a3b8;
  border-radius: 6px;
  color: #475569;
  cursor: pointer;
  font-size: 0.9375rem;
  font-weight: 500;
  transition: all 0.2s;
}

.add-sub-question-btn:hover {
  background: #f1f5f9;
  border-color: #64748b;
  color: #334155;
}

.weight-warning {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #fef3c7;
  border: 1px solid #fbbf24;
  border-radius: 6px;
  color: #92400e;
  font-size: 0.875rem;
  font-weight: 500;
}
</style>
