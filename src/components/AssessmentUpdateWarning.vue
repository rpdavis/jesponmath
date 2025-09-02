<template>
  <div class="warning-modal-overlay" @click="$emit('cancel')">
    <div class="warning-modal" @click.stop>
      <div class="modal-header">
        <span class="warning-icon">⚠️</span>
        <h3>Update Assessment with Existing Results</h3>
      </div>
      
      <div class="modal-content">
        <div class="warning-message">
          <p><strong>{{ resultCount }} student{{ resultCount !== 1 ? 's have' : ' has' }} already taken this assessment:</strong></p>
          <ul class="student-list">
            <li v-for="email in studentEmails" :key="email">{{ email }}</li>
          </ul>
        </div>

        <div class="impact-explanation">
          <h4>What will happen when you update:</h4>
          <ul class="impact-list">
            <li>✅ <strong>All existing results will be re-graded</strong> with your updated answer key</li>
            <li>🔄 <strong>Scores may change</strong> if you fixed incorrect answers or changed point values</li>
            <li>📊 <strong>Gradebook will update automatically</strong> to reflect new scores</li>
            <li>📝 <strong>Changes will be logged</strong> so you can see what was updated</li>
            <li>🎯 <strong>Students who were wrong but now correct</strong> will get their points back</li>
          </ul>
        </div>

        <div class="example-scenarios">
          <h4>Example scenarios:</h4>
          <div class="scenario">
            <span class="scenario-icon">✏️</span>
            <div>
              <strong>You fix a typo in the answer key:</strong><br>
              Students who answered correctly (but were marked wrong) will now get full points
            </div>
          </div>
          <div class="scenario">
            <span class="scenario-icon">➕</span>
            <div>
              <strong>You add an acceptable answer:</strong><br>
              Students who gave that answer will now be marked correct
            </div>
          </div>
          <div class="scenario">
            <span class="scenario-icon">🔢</span>
            <div>
              <strong>You change point values:</strong><br>
              All student scores will recalculate with new point values
            </div>
          </div>
        </div>

        <div class="backup-notice">
          <span class="backup-icon">💾</span>
          <p><strong>Don't worry:</strong> Original results are backed up. If something goes wrong, contact your administrator to restore them.</p>
        </div>
      </div>

      <div class="modal-actions">
        <button @click="$emit('cancel')" class="cancel-btn">
          ❌ Cancel - Don't Update
        </button>
        <button @click="$emit('proceed')" class="proceed-btn">
          ✅ Update & Re-grade Results
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  resultCount: number;
  studentEmails: string[];
}

interface Emits {
  (e: 'proceed'): void;
  (e: 'cancel'): void;
}

defineProps<Props>();
defineEmits<Emits>();
</script>

<style scoped>
.warning-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.warning-modal {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px;
  border-bottom: 2px solid #fbbf24;
  background: #fef3c7;
}

.warning-icon {
  font-size: 1.5rem;
}

.modal-header h3 {
  color: #92400e;
  margin: 0;
  font-size: 1.2rem;
}

.modal-content {
  padding: 24px;
}

.warning-message {
  background: #fef2f2;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #fecaca;
  margin-bottom: 20px;
}

.warning-message p {
  color: #991b1b;
  margin-bottom: 10px;
}

.student-list {
  color: #7f1d1d;
  margin: 0;
  padding-left: 20px;
}

.impact-explanation {
  margin-bottom: 20px;
}

.impact-explanation h4 {
  color: #1f2937;
  margin-bottom: 10px;
  font-size: 1rem;
}

.impact-list {
  color: #374151;
  padding-left: 20px;
}

.impact-list li {
  margin-bottom: 8px;
  line-height: 1.4;
}

.example-scenarios {
  margin-bottom: 20px;
}

.example-scenarios h4 {
  color: #1f2937;
  margin-bottom: 12px;
  font-size: 1rem;
}

.scenario {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  padding: 12px;
  background: #f0f9ff;
  border-radius: 6px;
  border: 1px solid #bae6fd;
}

.scenario-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.scenario div {
  color: #1e40af;
  font-size: 0.9rem;
  line-height: 1.4;
}

.backup-notice {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  background: #ecfdf5;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #bbf7d0;
}

.backup-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.backup-notice p {
  color: #065f46;
  margin: 0;
  font-size: 0.9rem;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 20px 24px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.cancel-btn, .proceed-btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.cancel-btn {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.cancel-btn:hover {
  background: #e5e7eb;
}

.proceed-btn {
  background: #dc2626;
  color: white;
}

.proceed-btn:hover {
  background: #b91c1c;
}
</style>
