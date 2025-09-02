<template>
  <div class="rich-text-answer-input">
    <!-- Toolbar -->
    <div class="toolbar">
      <button 
        type="button"
        @click="insertFraction"
        class="toolbar-btn fraction-btn"
        title="Insert Fraction"
      >
        <span class="fraction-icon">
          <span class="fraction-demo">
            <span class="num">a</span>
            <span class="line">―</span>
            <span class="den">b</span>
          </span>
        </span>
        Insert Fraction
      </button>
      
      <button 
        type="button"
        @click="insertSuperscript"
        class="toolbar-btn"
        title="Superscript (x²)"
      >
        x²
      </button>
      
      <button 
        type="button"
        @click="insertSubscript"
        class="toolbar-btn"
        title="Subscript (x₁)"
      >
        x₁
      </button>
    </div>

    <!-- Rich Text Content Area -->
    <div 
      ref="editorRef"
      contenteditable="true"
      @input="handleInput"
      @keydown="handleKeydown"
      @click="handleClick"
      class="rich-editor"
      :placeholder="placeholder"
    ></div>

    <!-- Fraction Modal -->
    <div v-if="showFractionModal" class="fraction-modal-overlay" @click="closeFractionModal">
      <div class="fraction-modal" @click.stop>
        <div class="modal-header">
          <h3>Insert Fraction</h3>
          <button type="button" @click="closeFractionModal" class="close-btn">×</button>
        </div>
        
        <div class="fraction-builder">
          <div class="fraction-preview">
            <div class="fraction-display">
              <input 
                ref="numeratorInput"
                v-model="fractionNumerator"
                type="text"
                placeholder="numerator"
                class="fraction-input numerator"
                @keydown.enter="insertFractionAndClose"
              />
              <div class="fraction-line"></div>
              <input 
                v-model="fractionDenominator"
                type="text"
                placeholder="denominator"
                class="fraction-input denominator"
                @keydown.enter="insertFractionAndClose"
              />
            </div>
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="closeFractionModal" class="cancel-btn">Cancel</button>
            <button type="button" @click="insertFractionAndClose" class="insert-btn">Insert</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue';

interface Props {
  modelValue?: string;
  placeholder?: string;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Enter your answer...'
});

const emit = defineEmits<Emits>();

// Refs
const editorRef = ref<HTMLElement>();
const numeratorInput = ref<HTMLInputElement>();

// State
const showFractionModal = ref(false);
const fractionNumerator = ref('');
const fractionDenominator = ref('');
let currentSelection: Range | null = null;

// Initialize content
onMounted(() => {
  if (editorRef.value && props.modelValue) {
    editorRef.value.innerHTML = props.modelValue;
  }
});

// Handle input changes
const handleInput = () => {
  if (editorRef.value) {
    emit('update:modelValue', editorRef.value.innerHTML);
  }
};

// Handle keydown for special behaviors
const handleKeydown = (event: KeyboardEvent) => {
  // Allow normal typing and editing
  if (event.key === 'Enter' && !event.shiftKey) {
    // Insert line break
    event.preventDefault();
    document.execCommand('insertHTML', false, '<br>');
  }
};

// Handle click to maintain cursor position
const handleClick = () => {
  saveSelection();
};

// Save current selection/cursor position
const saveSelection = () => {
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    currentSelection = selection.getRangeAt(0).cloneRange();
  }
};

// Restore selection/cursor position
const restoreSelection = () => {
  if (currentSelection) {
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(currentSelection);
    }
  }
};

// Insert fraction
const insertFraction = () => {
  saveSelection();
  fractionNumerator.value = '';
  fractionDenominator.value = '';
  showFractionModal.value = true;
  
  nextTick(() => {
    numeratorInput.value?.focus();
  });
};

// Insert fraction and close modal
const insertFractionAndClose = () => {
  if (!fractionNumerator.value && !fractionDenominator.value) {
    closeFractionModal();
    return;
  }

  const fractionHtml = `
    <span class="inline-fraction" contenteditable="false">
      <span class="fraction-container">
        <span class="fraction-num">${fractionNumerator.value || '□'}</span>
        <span class="fraction-bar">―</span>
        <span class="fraction-den">${fractionDenominator.value || '□'}</span>
      </span>
    </span>
  `;

  insertHtmlAtCursor(fractionHtml);
  closeFractionModal();
};

// Close fraction modal
const closeFractionModal = () => {
  showFractionModal.value = false;
  fractionNumerator.value = '';
  fractionDenominator.value = '';
  
  // Restore focus to editor
  nextTick(() => {
    editorRef.value?.focus();
    restoreSelection();
  });
};

// Insert superscript
const insertSuperscript = () => {
  saveSelection();
  const text = prompt('Enter superscript text:');
  if (text) {
    insertHtmlAtCursor(`<sup>${text}</sup>`);
  }
};

// Insert subscript
const insertSubscript = () => {
  saveSelection();
  const text = prompt('Enter subscript text:');
  if (text) {
    insertHtmlAtCursor(`<sub>${text}</sub>`);
  }
};

// Insert HTML at cursor position
const insertHtmlAtCursor = (html: string) => {
  if (editorRef.value) {
    editorRef.value.focus();
    
    if (currentSelection) {
      restoreSelection();
    }
    
    // Insert the HTML
    document.execCommand('insertHTML', false, html);
    
    // Add a space after for easier typing
    document.execCommand('insertHTML', false, '&nbsp;');
    
    handleInput(); // Update model value
  }
};
</script>

<style scoped>
.rich-text-answer-input {
  width: 100%;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.toolbar {
  display: flex;
  gap: 8px;
  padding: 10px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  flex-wrap: wrap;
}

.toolbar-btn {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.toolbar-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.fraction-btn {
  font-weight: 500;
}

.fraction-icon {
  display: inline-block;
}

.fraction-demo {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  line-height: 1;
  font-size: 0.8rem;
}

.fraction-demo .num {
  margin-bottom: 1px;
}

.fraction-demo .line {
  margin: 0;
  font-weight: bold;
}

.fraction-demo .den {
  margin-top: 1px;
}

.rich-editor {
  min-height: 100px;
  padding: 15px;
  font-size: 16px;
  line-height: 1.5;
  outline: none;
  background: white;
}

.rich-editor:empty:before {
  content: attr(placeholder);
  color: #9ca3af;
  font-style: italic;
}

.rich-editor:focus {
  background: #fefefe;
}

/* Inline fraction styles */
.rich-editor :deep(.inline-fraction) {
  display: inline-block;
  margin: 0 2px;
  vertical-align: middle;
  background: #f0f9ff;
  padding: 2px 4px;
  border-radius: 4px;
  border: 1px solid #bae6fd;
}

.rich-editor :deep(.fraction-container) {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  line-height: 1;
  font-size: 0.9rem;
}

.rich-editor :deep(.fraction-num) {
  padding-bottom: 1px;
  min-width: 12px;
  text-align: center;
}

.rich-editor :deep(.fraction-bar) {
  border-top: 1px solid #374151;
  width: 100%;
  min-width: 20px;
  margin: 1px 0;
  font-size: 0;
}

.rich-editor :deep(.fraction-den) {
  padding-top: 1px;
  min-width: 12px;
  text-align: center;
}

/* Modal styles */
.fraction-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.fraction-modal {
  background: white;
  border-radius: 12px;
  padding: 0;
  min-width: 300px;
  max-width: 400px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 20px 10px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.fraction-builder {
  padding: 20px;
}

.fraction-preview {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.fraction-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #f8fafc;
  padding: 20px;
  border-radius: 8px;
  border: 2px solid #e2e8f0;
}

.fraction-input {
  width: 80px;
  padding: 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  text-align: center;
  font-size: 16px;
  background: white;
}

.fraction-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.fraction-line {
  width: 90px;
  height: 2px;
  background: #374151;
  margin: 6px 0;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.cancel-btn, .insert-btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: white;
  border: 1px solid #d1d5db;
  color: #374151;
}

.cancel-btn:hover {
  background: #f9fafb;
}

.insert-btn {
  background: #3b82f6;
  border: 1px solid #3b82f6;
  color: white;
}

.insert-btn:hover {
  background: #2563eb;
}
</style>
