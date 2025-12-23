<template>
  <div class="rich-text-answer-input">
    <!-- Simple Text Input Area -->
    <textarea
      v-model="inputValue"
      @input="handleInput"
      class="text-editor"
      :class="{ 'compact': compact }"
      :placeholder="placeholder"
      :rows="compact ? 1 : 3"
    ></textarea>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  modelValue?: string;
  placeholder?: string;
  compact?: boolean; // New prop for compact mode (used with prefix/suffix)
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Enter your answer...',
  compact: false
});

const emit = defineEmits<Emits>();

// Use a computed property for v-model with automatic trimming
const inputValue = computed({
  get: () => props.modelValue || '',
  set: (value: string) => {
    // Clean the input: remove HTML entities and trim whitespace
    const cleanedValue = value
      .replace(/&nbsp;/g, ' ')  // Replace &nbsp; with regular spaces
      .replace(/<[^>]*>/g, '')  // Remove any HTML tags
      .trim();                  // Trim leading/trailing spaces
    
    emit('update:modelValue', cleanedValue);
  }
});

// Handle input changes (for any additional processing)
const handleInput = () => {
  // Input is handled automatically by v-model with cleaning
};

</script>

<style scoped>
.rich-text-answer-input {
  width: 100%;
}

.text-editor {
  width: 100%;
  min-height: 100px;
  padding: 15px;
  font-size: 16px;
  line-height: 1.5;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  outline: none;
  background: white;
  resize: vertical;
  font-family: inherit;
}

/* Compact mode for use with prefix/suffix */
.text-editor.compact {
  min-height: 48px;
  max-height: 48px;
  padding: 12px 15px;
  resize: none;
  overflow: hidden;
  line-height: 1.4;
}

.text-editor:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  background: #fefefe;
}

.text-editor::placeholder {
  color: #9ca3af;
  font-style: italic;
}


</style>


