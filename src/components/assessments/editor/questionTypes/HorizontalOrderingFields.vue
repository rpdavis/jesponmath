<template>
  <div class="horizontal-ordering-config">
    <div class="form-group">
      <label>Ordering Items *</label>
      <p class="help-text">Add 2-8 items that students will drag to order horizontally</p>

      <div class="ordering-items-list">
        <div
          v-for="(item, itemIndex) in question.orderingItems || []"
          :key="itemIndex"
          class="ordering-item"
        >
          <span class="item-number">{{ itemIndex + 1 }}.</span>
          <LaTeXEditor
            v-model="question.orderingItems![itemIndex]"
            :rows="2"
            :show-preview="false"
            placeholder="e.g., $\frac{1}{2}$, $0.75$, $\frac{2}{3}$"
            class="ordering-editor"
            @update:modelValue="updateCorrectOrder"
          />
          <button
            type="button"
            @click="removeItem(itemIndex)"
            class="remove-btn"
            :disabled="(question.orderingItems || []).length <= 2"
          >×</button>
        </div>
      </div>

      <button
        type="button"
        @click="addItem"
        class="add-btn"
        :disabled="(question.orderingItems || []).length >= 8"
      >+ Add Ordering Item</button>
    </div>

    <div class="form-group">
      <label>Order Direction *</label>
      <select
        v-model="question.orderDirection"
        class="form-select"
        @change="updateCorrectOrder"
      >
        <option value="ascending">Ascending (least to greatest)</option>
        <option value="descending">Descending (greatest to least)</option>
        <option value="manual">Manual (set order manually)</option>
      </select>
    </div>

    <!-- Manual Order Configuration -->
    <div v-if="question.orderDirection === 'manual'" class="form-group">
      <label>Correct Order *</label>
      <p class="help-text">Select the correct sequence manually using the dropdowns below</p>

      <div class="correct-order-list">
        <div
          v-for="(item, orderIndex) in correctOrderArray"
          :key="orderIndex"
          class="correct-order-item"
        >
          <span class="order-number">{{ orderIndex + 1 }}.</span>
          <select
            v-model="question.correctHorizontalOrder![orderIndex]"
            class="form-select"
            @change="ensureCorrectOrderLength"
          >
            <option value="">Select item</option>
            <option
              v-for="orderingItem in (question.orderingItems || []).filter(i => i.trim())"
              :key="orderingItem"
              :value="orderingItem"
            >{{ orderingItem }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Auto-calculated Order Display -->
    <div v-else class="form-group">
      <label>Correct Order (Auto-calculated)</label>
      <p class="help-text">
        The correct order is automatically calculated based on {{ question.orderDirection || 'ascending' }} order.
      </p>

      <div v-if="question.correctHorizontalOrder && question.correctHorizontalOrder.length > 0" class="correct-order-display">
        <div
          v-for="(item, orderIndex) in question.correctHorizontalOrder"
          :key="orderIndex"
          class="correct-order-item-display"
        >
          <span class="order-number">{{ orderIndex + 1 }}.</span>
          <span class="order-value">{{ item }}</span>
        </div>
      </div>
      <div v-else class="help-text" style="color: #6b7280; font-style: italic;">
        Add ordering items above to see the auto-calculated order
      </div>
    </div>

    <!-- Summary -->
    <div class="ordering-summary">
      <strong>Items to Order:</strong> {{ (question.orderingItems || []).length }} item(s)
      <br>
      <strong>Correct Order Set:</strong>
      <span v-if="(question.correctHorizontalOrder || []).length === 0" class="no-correct">
        ⚠️ No correct order set
      </span>
      <span v-else class="correct-count">
        ✓ {{ (question.correctHorizontalOrder || []).length }} position(s)
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import LaTeXEditor from '@/components/LaTeXEditor.vue'
import type { AssessmentQuestion } from '@/types/iep'

interface Props {
  question: AssessmentQuestion
}

const props = defineProps<Props>()

// Initialize fields if not present
if (!props.question.orderingItems) {
  props.question.orderingItems = []
}
if (!props.question.correctHorizontalOrder) {
  props.question.correctHorizontalOrder = []
}
if (!props.question.orderDirection) {
  props.question.orderDirection = 'ascending'
}

const correctOrderArray = computed(() => {
  const length = props.question.orderingItems?.length || 0
  return Array(length).fill('')
})

const addItem = () => {
  if (!props.question.orderingItems) {
    props.question.orderingItems = []
  }
  if (props.question.orderingItems.length < 8) {
    props.question.orderingItems.push('')
    updateCorrectOrder()
  }
}

const removeItem = (index: number) => {
  if (props.question.orderingItems && props.question.orderingItems.length > 2) {
    props.question.orderingItems.splice(index, 1)
    updateCorrectOrder()
  }
}

const ensureCorrectOrderLength = () => {
  if (!props.question.correctHorizontalOrder || !props.question.orderingItems) return

  const targetLength = props.question.orderingItems.length
  if (props.question.correctHorizontalOrder.length !== targetLength) {
    props.question.correctHorizontalOrder = Array(targetLength).fill('')
  }
}

const updateCorrectOrder = () => {
  if (!props.question.orderingItems || props.question.orderingItems.length === 0) {
    props.question.correctHorizontalOrder = []
    return
  }

  const direction = props.question.orderDirection || 'ascending'

  if (direction === 'manual') {
    // Ensure correct array length for manual mode
    ensureCorrectOrderLength()
    return
  }

  // Auto-calculate for ascending/descending
  const filledItems = props.question.orderingItems.filter(item => item.trim())

  if (filledItems.length === 0) {
    props.question.correctHorizontalOrder = []
    return
  }

  // Sort the items using sophisticated number extraction
  const sortedItems = [...filledItems].sort((a, b) => {
    // Extract numeric values, handling LaTeX formatting and absolute value notation
    const extractNumber = (str: string): number => {
      // Remove LaTeX dollar formatting ($, $$)
      let cleaned = str.replace(/^\$+\$*|\$+$/g, '').trim()

      // Handle absolute value notation: |x|, -|x|, |-x|
      // Pattern matches: |number|, -|number|, |-number|
      // Examples:
      //   |-5| = |innerValue| = |(-5)| = 5
      //   -|20| = -|innerValue| = -|20| = -20
      //   -|-3| = -|innerValue| = -|(-3)| = -3
      //   |5| = |innerValue| = |5| = 5
      const absValuePattern = /^(-?)\|(-?\d+(?:\.\d+)?)\|$/
      const match = cleaned.match(absValuePattern)

      if (match) {
        // Found absolute value notation
        const outerSign = match[1] // '-' or '' (for -|x| or |x|)
        const innerValue = parseFloat(match[2]) // The number inside the bars

        if (!isNaN(innerValue)) {
          // Calculate: outerSign + |innerValue|
          // |-5|: outerSign='', innerValue=-5, absValue=5, return 5
          // -|20|: outerSign='-', innerValue=20, absValue=20, return -20
          // -|-3|: outerSign='-', innerValue=-3, absValue=3, return -3
          // |5|: outerSign='', innerValue=5, absValue=5, return 5
          const absValue = Math.abs(innerValue)
          const result = outerSign === '-' ? -absValue : absValue
          console.log(`🔢 Absolute value calculation: "${str}" -> cleaned: "${cleaned}" -> ${outerSign ? outerSign : '+'}|${innerValue}| = ${result}`)
          return result
        }
      }

      // Try to parse as regular number (handles cases like -5, 0.75, etc.)
      const num = parseFloat(cleaned)
      if (!isNaN(num)) {
        console.log(`🔢 Regular number: "${str}" -> cleaned: "${cleaned}" -> ${num}`)
      }
      return isNaN(num) ? Infinity : num
    }

    const numA = extractNumber(a)
    const numB = extractNumber(b)

    if (numA !== Infinity && numB !== Infinity) {
      return direction === 'ascending' ? numA - numB : numB - numA
    }

    // Fallback to string comparison
    return direction === 'ascending'
      ? a.localeCompare(b)
      : b.localeCompare(a)
  })

  props.question.correctHorizontalOrder = sortedItems

  // Sync correctHorizontalOrder to correctAnswer for consistency
  // correctAnswer is the primary field (like all other question types)
  if (Array.isArray(props.question.correctHorizontalOrder) && props.question.correctHorizontalOrder.length > 0) {
    // Convert array to space-separated string (matches database format)
    props.question.correctAnswer = props.question.correctHorizontalOrder.join(' ') as any
    console.log('✅ Synced correctHorizontalOrder to correctAnswer:', {
      correctHorizontalOrder: props.question.correctHorizontalOrder,
      correctAnswer: props.question.correctAnswer
    })
  } else {
    // If no correct order set, clear correctAnswer
    props.question.correctAnswer = '' as any
  }

  console.log('✅ Updated correct horizontal order:', {
    direction,
    items: filledItems,
    correctOrder: props.question.correctHorizontalOrder
  })
}

// Watch for changes that need order recalculation
watch(
  () => [props.question.orderingItems, props.question.orderDirection],
  () => {
    updateCorrectOrder()
  },
  { deep: true }
)

// Initial calculation
updateCorrectOrder()
</script>

<style scoped>
.horizontal-ordering-config {
  margin-top: 1rem;
}

.help-text {
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
}

.ordering-items-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.ordering-item {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.item-number {
  font-weight: 600;
  color: #6b7280;
  min-width: 30px;
}

.ordering-editor {
  flex: 1;
}

.correct-order-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.correct-order-item {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.order-number {
  font-weight: 600;
  color: #3b82f6;
  min-width: 30px;
}

.correct-order-display {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.correct-order-item-display {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #d1d5db;
}

.order-value {
  font-weight: 500;
  color: #1f2937;
}

.ordering-summary {
  margin-top: 1rem;
  padding: 1rem;
  background: #eff6ff;
  border-left: 3px solid #3b82f6;
  border-radius: 4px;
  font-size: 0.875rem;
}

.no-correct {
  color: #dc2626;
  font-weight: 500;
}

.correct-count {
  color: #059669;
  font-weight: 500;
}

.remove-btn,
.add-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.remove-btn {
  background: #fef2f2;
  color: #dc2626;
  width: 36px;
}

.add-btn {
  background: #f3f4f6;
}

.remove-btn:hover:not(:disabled) {
  background: #fee2e2;
}

.add-btn:hover:not(:disabled) {
  background: #e5e7eb;
}

.remove-btn:disabled,
.add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-select {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9375rem;
}
</style>
