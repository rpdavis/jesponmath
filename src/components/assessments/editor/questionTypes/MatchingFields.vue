<template>
  <div class="matching-config">
    <div class="form-group">
      <label>Matching Pairs *</label>
      <p class="help-text">Create pairs of items that students need to match</p>

      <div class="matching-pairs-list">
        <div
          v-for="(pair, pairIndex) in question.matchingPairs || []"
          :key="pairIndex"
          class="matching-pair-item"
        >
          <LaTeXEditor
            v-model="question.matchingPairs![pairIndex].left"
            :rows="2"
            :show-preview="false"
            placeholder="Left item (e.g., $\frac{1}{2}$)"
            class="pair-editor"
          />
          <span class="pair-connector">↔</span>
          <LaTeXEditor
            v-model="question.matchingPairs![pairIndex].right"
            :rows="2"
            :show-preview="false"
            placeholder="Right item (e.g., $0.5$)"
            class="pair-editor"
          />
          <button
            type="button"
            @click="removePair(pairIndex)"
            class="remove-btn"
          >×</button>
        </div>
      </div>

      <button
        type="button"
        @click="addPair"
        class="add-btn"
      >+ Add Matching Pair</button>
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

const addPair = () => {
  if (!props.question.matchingPairs) {
    props.question.matchingPairs = [];
  }
  props.question.matchingPairs.push({ left: '', right: '' });
};

const removePair = (index: number) => {
  if (props.question.matchingPairs) {
    props.question.matchingPairs.splice(index, 1);
  }
};
</script>

<style scoped>
.matching-config {
  margin-top: 1rem;
}

.help-text {
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
}

.matching-pairs-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.matching-pair-item {
  display: grid;
  grid-template-columns: 1fr auto 1fr auto;
  gap: 0.5rem;
  align-items: center;
}

.pair-editor {
  min-width: 0;
}

.pair-connector {
  font-size: 1.25rem;
  color: #6b7280;
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
