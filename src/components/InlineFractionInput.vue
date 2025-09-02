<template>
  <div class="inline-fraction-input">
    <div class="input-mode-toggle">
      <button 
        type="button"
        @click="toggleInputMode"
        class="mode-toggle-btn"
        :class="{ active: isVerticalMode }"
      >
        <span v-if="isVerticalMode">📝 Text Mode</span>
        <span v-else>🔢 Fraction Mode</span>
      </button>
    </div>

    <!-- Text Input Mode -->
    <div v-if="!isVerticalMode" class="text-input-mode">
      <textarea 
        v-model="textValue"
        @input="updateFromText"
        :placeholder="placeholder"
        rows="3"
        class="text-input"
      ></textarea>
      <p class="help-text">💡 Type your answer normally (e.g., 2x/4, 1/2 + 3/4, etc.)</p>
    </div>

    <!-- Vertical Fraction Mode -->
    <div v-else class="fraction-input-mode">
      <div class="fraction-builder">
        <div class="expression-parts">
          <!-- Before fraction part -->
          <div class="expression-part">
            <label>Before fraction:</label>
            <input 
              v-model="beforeFraction"
              @input="updateFromParts"
              type="text"
              placeholder="e.g., 2 +"
              class="part-input"
            />
          </div>

          <!-- Main fraction -->
          <div class="fraction-container">
            <div class="fraction-display">
              <input
                v-model="numerator"
                @input="updateFromParts"
                type="text"
                class="fraction-field numerator"
                placeholder="numerator"
              />
              <div class="fraction-line"></div>
              <input
                v-model="denominator"
                @input="updateFromParts"
                type="text"
                class="fraction-field denominator"
                placeholder="denominator"
              />
            </div>
          </div>

          <!-- After fraction part -->
          <div class="expression-part">
            <label>After fraction:</label>
            <input 
              v-model="afterFraction"
              @input="updateFromParts"
              type="text"
              placeholder="e.g., + 3"
              class="part-input"
            />
          </div>
        </div>

        <!-- Preview of complete expression -->
        <div class="expression-preview">
          <strong>Expression: </strong>
          <span class="preview-text">{{ previewExpression }}</span>
        </div>

        <div class="fraction-controls">
          <button type="button" @click="clearAll" class="clear-btn">Clear All</button>
          <button type="button" @click="addFraction" class="add-fraction-btn">+ Add Another Fraction</button>
        </div>
      </div>

      <p class="help-text">
        💡 Use the fraction builder for complex expressions. You can include variables (x, y) and operations (+, -, ×, ÷)
      </p>
    </div>

    <!-- Multiple fractions support -->
    <div v-if="isVerticalMode && additionalFractions.length > 0" class="additional-fractions">
      <div 
        v-for="(fraction, index) in additionalFractions" 
        :key="index"
        class="additional-fraction"
      >
        <div class="fraction-header">
          <span>Fraction {{ index + 2 }}:</span>
          <button 
            type="button" 
            @click="removeFraction(index)"
            class="remove-fraction-btn"
          >×</button>
        </div>
        
        <div class="fraction-parts">
          <input 
            v-model="fraction.before"
            @input="updateFromParts"
            type="text"
            placeholder="before"
            class="part-input small"
          />
          
          <div class="small-fraction">
            <input
              v-model="fraction.numerator"
              @input="updateFromParts"
              type="text"
              class="fraction-field-small numerator"
              placeholder="num"
            />
            <div class="fraction-line-small"></div>
            <input
              v-model="fraction.denominator"
              @input="updateFromParts"
              type="text"
              class="fraction-field-small denominator"
              placeholder="den"
            />
          </div>
          
          <input 
            v-model="fraction.after"
            @input="updateFromParts"
            type="text"
            placeholder="after"
            class="part-input small"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

interface Props {
  modelValue?: string;
  placeholder?: string;
  disabled?: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Enter your answer...',
  disabled: false
});

const emit = defineEmits<Emits>();

// State
const isVerticalMode = ref(false);
const textValue = ref(props.modelValue || '');

// Fraction parts
const beforeFraction = ref('');
const numerator = ref('');
const denominator = ref('');
const afterFraction = ref('');

// Additional fractions for complex expressions
const additionalFractions = ref<Array<{
  before: string;
  numerator: string;
  denominator: string;
  after: string;
}>>([]);

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  textValue.value = newValue || '';
  parseExistingExpression(newValue || '');
});

// Computed preview of the complete expression
const previewExpression = computed(() => {
  let expression = '';
  
  if (beforeFraction.value) {
    expression += beforeFraction.value + ' ';
  }
  
  if (numerator.value || denominator.value) {
    expression += `(${numerator.value || '?'})/(${denominator.value || '?'})`;
  }
  
  if (afterFraction.value) {
    expression += ' ' + afterFraction.value;
  }
  
  // Add additional fractions
  additionalFractions.value.forEach(fraction => {
    if (fraction.before) expression += ' ' + fraction.before;
    if (fraction.numerator || fraction.denominator) {
      expression += ` (${fraction.numerator || '?'})/(${fraction.denominator || '?'})`;
    }
    if (fraction.after) expression += ' ' + fraction.after;
  });
  
  return expression.trim() || 'Your expression will appear here...';
});

// Methods
const toggleInputMode = () => {
  isVerticalMode.value = !isVerticalMode.value;
  
  if (isVerticalMode.value) {
    // Switching to fraction mode - try to parse existing text
    parseExistingExpression(textValue.value);
  } else {
    // Switching to text mode - use the preview expression
    textValue.value = previewExpression.value.replace(/\(\?\)/g, '');
    updateFromText();
  }
};

const updateFromText = () => {
  emit('update:modelValue', textValue.value);
};

const updateFromParts = () => {
  const expression = previewExpression.value.replace(/\(\?\)/g, '').replace(/\(\)/g, '');
  textValue.value = expression;
  emit('update:modelValue', expression);
};

const parseExistingExpression = (expression: string) => {
  // Simple parsing - look for fraction patterns like a/b
  const fractionPattern = /([^\/]*?)\/([^\/\s]*)/g;
  const matches = [...expression.matchAll(fractionPattern)];
  
  if (matches.length > 0) {
    const firstMatch = matches[0];
    const beforeMatch = expression.substring(0, firstMatch.index || 0).trim();
    const afterMatch = expression.substring((firstMatch.index || 0) + firstMatch[0].length).trim();
    
    beforeFraction.value = beforeMatch;
    numerator.value = firstMatch[1].trim();
    denominator.value = firstMatch[2].trim();
    afterFraction.value = afterMatch;
    
    // Handle additional fractions
    if (matches.length > 1) {
      additionalFractions.value = matches.slice(1).map(match => ({
        before: '',
        numerator: match[1].trim(),
        denominator: match[2].trim(),
        after: ''
      }));
    }
  }
};

const clearAll = () => {
  beforeFraction.value = '';
  numerator.value = '';
  denominator.value = '';
  afterFraction.value = '';
  additionalFractions.value = [];
  textValue.value = '';
  emit('update:modelValue', '');
};

const addFraction = () => {
  additionalFractions.value.push({
    before: '',
    numerator: '',
    denominator: '',
    after: ''
  });
};

const removeFraction = (index: number) => {
  additionalFractions.value.splice(index, 1);
  updateFromParts();
};
</script>

<style scoped>
.inline-fraction-input {
  width: 100%;
}

.input-mode-toggle {
  margin-bottom: 15px;
  text-align: center;
}

.mode-toggle-btn {
  padding: 8px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.mode-toggle-btn:hover {
  border-color: #3b82f6;
  background: #f0f9ff;
}

.mode-toggle-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.text-input-mode .text-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 16px;
  resize: vertical;
  min-height: 80px;
}

.text-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.fraction-input-mode {
  background: #f8fafc;
  padding: 20px;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
}

.fraction-builder {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.expression-parts {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
  justify-content: center;
}

.expression-part {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.expression-part label {
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: 500;
}

.part-input {
  padding: 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  width: 100px;
  text-align: center;
}

.part-input.small {
  width: 60px;
  padding: 4px;
  font-size: 0.9rem;
}

.fraction-container {
  display: flex;
  align-items: center;
}

.fraction-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 100px;
}

.fraction-field {
  width: 80px;
  padding: 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  text-align: center;
  font-size: 16px;
  background: white;
}

.fraction-field:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.fraction-line {
  width: 90px;
  height: 2px;
  background: #374151;
  margin: 4px 0;
}

.expression-preview {
  background: white;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  text-align: center;
}

.preview-text {
  font-family: 'Courier New', monospace;
  color: #1f2937;
  font-size: 1.1rem;
}

.fraction-controls {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.clear-btn, .add-fraction-btn {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.clear-btn:hover {
  background: #fef2f2;
  border-color: #ef4444;
  color: #dc2626;
}

.add-fraction-btn:hover {
  background: #f0f9ff;
  border-color: #3b82f6;
  color: #2563eb;
}

.additional-fractions {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #d1d5db;
}

.additional-fraction {
  background: white;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
  border: 1px solid #e5e7eb;
}

.fraction-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.fraction-header span {
  font-weight: 500;
  color: #374151;
}

.remove-fraction-btn {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
  border-radius: 4px;
  width: 24px;
  height: 24px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-fraction-btn:hover {
  background: #fee2e2;
}

.fraction-parts {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}

.small-fraction {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.fraction-field-small {
  width: 50px;
  padding: 4px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  text-align: center;
  font-size: 14px;
  background: white;
}

.fraction-line-small {
  width: 55px;
  height: 1px;
  background: #374151;
  margin: 2px 0;
}

.help-text {
  font-size: 0.9rem;
  color: #6b7280;
  font-style: italic;
  margin-top: 10px;
  text-align: center;
}
</style>
