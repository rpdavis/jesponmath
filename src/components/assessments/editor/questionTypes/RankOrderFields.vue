<template>
  <div class="rank-order-config">
    <div class="form-group">
      <label>Items to Rank *</label>
      <p class="help-text">Add items that students need to put in the correct order</p>

      <div class="form-row">
        <div class="form-group">
          <label>Order Type</label>
          <select v-model="question.orderType" class="form-select">
            <option value="ascending">Ascending (smallest to largest)</option>
            <option value="descending">Descending (largest to smallest)</option>
            <option value="custom">Custom Order</option>
          </select>
        </div>
      </div>

      <div class="rank-items-list">
        <div
          v-for="(item, itemIndex) in question.itemsToRank || []"
          :key="itemIndex"
          class="rank-item"
        >
          <span class="item-number">{{ itemIndex + 1 }}.</span>
          <LaTeXEditor
            v-model="question.itemsToRank![itemIndex]"
            :rows="2"
            :show-preview="false"
            placeholder="e.g., $\frac{3}{4}$, $0.75$, $\frac{2}{3}$"
            class="rank-editor"
          />
          <button
            type="button"
            @click="removeItem(itemIndex)"
            class="remove-btn"
          >×</button>
        </div>
      </div>

      <button
        type="button"
        @click="addItem"
        class="add-btn"
      >+ Add Item to Rank</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import LaTeXEditor from '@/components/LaTeXEditor.vue';
import type { AssessmentQuestion } from '@/types/iep';

interface Props {
  question: AssessmentQuestion;
}

const props = defineProps<Props>();

const addItem = () => {
  if (!props.question.itemsToRank) {
    props.question.itemsToRank = [];
  }
  props.question.itemsToRank.push('');
};

const removeItem = (index: number) => {
  if (props.question.itemsToRank && props.question.itemsToRank.length > 2) {
    props.question.itemsToRank.splice(index, 1);
  }
};
</script>

<style scoped>
.rank-order-config {
  margin-top: 1rem;
}

.help-text {
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
}

.rank-items-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.rank-item {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.item-number {
  font-weight: 600;
  color: #6b7280;
  min-width: 30px;
}

.rank-editor {
  flex: 1;
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

.remove-btn:hover {
  background: #fee2e2;
}

.add-btn:hover {
  background: #e5e7eb;
}
</style>
