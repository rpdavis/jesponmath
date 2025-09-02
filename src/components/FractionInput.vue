<template>
  <div class="fraction-input">
    <div class="fraction-display">
      <input
        v-model.number="numerator"
        type="number"
        class="fraction-field numerator"
        placeholder="0"
        @input="updateFraction"
      />
      <div class="fraction-line"></div>
      <input
        v-model.number="denominator"
        type="number"
        class="fraction-field denominator"
        placeholder="1"
        min="1"
        @input="updateFraction"
      />
    </div>
    <div class="fraction-controls">
      <button type="button" @click="clearFraction" class="clear-btn">Clear</button>
      <button type="button" @click="simplifyFraction" class="simplify-btn">Simplify</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

export interface FractionValue {
  numerator: number;
  denominator: number;
}

interface Props {
  modelValue?: FractionValue | null;
  placeholder?: string;
  disabled?: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: FractionValue | null): void;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  placeholder: '',
  disabled: false
});

const emit = defineEmits<Emits>();

const numerator = ref<number>(props.modelValue?.numerator || 0);
const denominator = ref<number>(props.modelValue?.denominator || 1);

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    numerator.value = newValue.numerator;
    denominator.value = newValue.denominator;
  } else {
    numerator.value = 0;
    denominator.value = 1;
  }
}, { deep: true });

const updateFraction = () => {
  if (denominator.value === 0) {
    denominator.value = 1; // Prevent division by zero
  }
  
  const fractionValue: FractionValue = {
    numerator: numerator.value || 0,
    denominator: denominator.value || 1
  };
  
  emit('update:modelValue', fractionValue);
};

const clearFraction = () => {
  numerator.value = 0;
  denominator.value = 1;
  emit('update:modelValue', null);
};

const gcd = (a: number, b: number): number => {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a;
};

const simplifyFraction = () => {
  if (numerator.value === 0) {
    denominator.value = 1;
    updateFraction();
    return;
  }
  
  const divisor = gcd(numerator.value, denominator.value);
  numerator.value = numerator.value / divisor;
  denominator.value = denominator.value / divisor;
  
  // Handle negative denominators
  if (denominator.value < 0) {
    numerator.value = -numerator.value;
    denominator.value = -denominator.value;
  }
  
  updateFraction();
};
</script>

<style scoped>
.fraction-input {
  display: inline-block;
  text-align: center;
}

.fraction-display {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  min-width: 80px;
  margin-bottom: 8px;
}

.fraction-field {
  width: 60px;
  padding: 4px 8px;
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

.numerator {
  margin-bottom: 2px;
}

.fraction-line {
  width: 70px;
  height: 2px;
  background: #374151;
  margin: 2px 0;
}

.denominator {
  margin-top: 2px;
}

.fraction-controls {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.clear-btn, .simplify-btn {
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-btn:hover {
  background: #fef2f2;
  border-color: #ef4444;
  color: #dc2626;
}

.simplify-btn:hover {
  background: #f0f9ff;
  border-color: #3b82f6;
  color: #2563eb;
}

.fraction-input:disabled .fraction-field {
  background: #f9fafb;
  color: #6b7280;
  cursor: not-allowed;
}

.fraction-input:disabled .clear-btn,
.fraction-input:disabled .simplify-btn {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
