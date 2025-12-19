<template>
  <div class="form-section">
    <h2>📎 File Upload Settings</h2>

    <div class="form-group">
      <label class="checkbox-label">
        <input
          type="checkbox"
          v-model="assessment.allowFileUpload"
          @change="emit('file-upload-toggle')"
        >
        Allow students to upload files/photos
      </label>
      <small class="form-help">Students can upload pictures of their work, documents, or other files</small>
    </div>

    <div v-if="assessment.allowFileUpload" class="file-upload-options">
      <div class="form-group">
        <label class="checkbox-label">
          <input
            type="checkbox"
            v-model="assessment.requireFileUpload"
          >
          Require file upload (mandatory)
        </label>
        <small class="form-help">Students must upload a file to complete the assessment</small>
      </div>

      <!-- Multi-page photo options -->
      <div class="form-group">
        <label class="checkbox-label">
          <input
            type="checkbox"
            v-model="assessment.requireMultiplePages"
            @change="onMultiplePageToggle"
          >
          Require multiple pages/photos
        </label>
        <small class="form-help">Students must capture multiple pages (great for multi-step work)</small>
      </div>

      <div v-if="assessment.requireMultiplePages" class="multi-page-options">
        <div class="form-group">
          <label for="requiredPageCount">Number of Required Pages</label>
          <select
            id="requiredPageCount"
            v-model="assessment.requiredPageCount"
            class="form-select"
          >
            <option v-for="n in 10" :key="n" :value="n">{{ n }} page{{ n > 1 ? 's' : '' }}</option>
          </select>
          <small class="form-help">How many pages students must capture</small>
        </div>

        <div class="form-group">
          <label class="checkbox-label">
            <input
              type="checkbox"
              v-model="assessment.allowExtraPages"
            >
            Allow students to add extra pages beyond required
          </label>
          <small class="form-help">Students can capture additional pages if needed</small>
        </div>

        <div class="form-group">
          <label>Page Labels (optional)</label>
          <div class="page-labels">
            <div v-for="(label, index) in pageLabelsArray" :key="index" class="page-label-input">
              <span class="page-number">Page {{ index + 1 }}:</span>
              <input
                type="text"
                v-model="pageLabelsArray[index]"
                @input="updatePageLabels"
                class="form-input"
                :placeholder="`Page ${index + 1}`"
              >
            </div>
          </div>
          <small class="form-help">Custom labels for each page (e.g., "Problem 1", "Work Page", "Answer Sheet")</small>
        </div>
      </div>

      <div class="form-group">
        <label for="fileUploadInstructions">File Upload Instructions</label>
        <textarea
          id="fileUploadInstructions"
          v-model="assessment.fileUploadInstructions"
          class="form-textarea"
          rows="3"
          :placeholder="getFileUploadPlaceholder()"
        ></textarea>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="maxFileSize">Max File Size (MB)</label>
          <input
            id="maxFileSize"
            v-model.number="assessment.maxFileSize"
            type="number"
            class="form-input"
            min="1"
            max="50"
            placeholder="10"
          >
          <small class="form-help">Maximum file size in megabytes (1-50 MB)</small>
        </div>

        <div class="form-group">
          <label>Allowed File Types</label>
          <div class="file-types-selection">
            <label
              v-for="fileType in availableFileTypes"
              :key="fileType.value"
              class="checkbox-label"
            >
              <input
                type="checkbox"
                :value="fileType.value"
                v-model="assessment.allowedFileTypes"
              >
              {{ fileType.label }}
            </label>
          </div>
          <small class="form-help">Select which file types students can upload</small>
        </div>

        <div class="form-group">
          <label for="photoOrientation">Photo Orientation</label>
          <select
            id="photoOrientation"
            v-model="assessment.photoOrientation"
            class="form-select"
          >
            <option value="portrait">📱 Portrait (Vertical)</option>
            <option value="landscape">📱 Landscape (Horizontal)</option>
          </select>
          <small class="form-help">Default orientation for camera capture</small>
        </div>
      </div>

      <!-- File Upload Preview -->
      <div class="upload-preview">
        <h4>📱 Student Upload Interface Preview</h4>
        <div class="preview-card">
          <div class="preview-header">
            <span class="preview-icon">📎</span>
            <span>Upload Your Work</span>
            <span v-if="assessment.requireFileUpload" class="required-badge">Required</span>
          </div>
          <div class="preview-content">
            <p>{{ assessment.fileUploadInstructions || 'Upload a file or take a photo of your work' }}</p>
            <div class="preview-buttons">
              <button type="button" class="preview-btn">📷 Take Photo</button>
              <button type="button" class="preview-btn">📁 Choose File</button>
            </div>
            <div class="preview-info">
              <small>
                Max size: {{ assessment.maxFileSize || 10 }}MB |
                Types: {{ (assessment.allowedFileTypes || []).join(', ') || 'All types' }}
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { AssessmentFormData } from '@/composables/assessment/useAssessmentForm';

interface Props {
  assessment: AssessmentFormData;
}

interface Emits {
  (e: 'file-upload-toggle'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const availableFileTypes = [
  { value: 'jpg', label: 'JPG Images' },
  { value: 'jpeg', label: 'JPEG Images' },
  { value: 'png', label: 'PNG Images' },
  { value: 'pdf', label: 'PDF Documents' },
  { value: 'doc', label: 'Word Documents' },
  { value: 'docx', label: 'Word Documents (DOCX)' }
];

const pageLabelsArray = ref<string[]>([]);

// Initialize page labels
watch(() => props.assessment.requiredPageCount, (newCount) => {
  if (newCount) {
    pageLabelsArray.value = Array(newCount).fill('').map((_, i) =>
      props.assessment.pageLabels?.[i] || ''
    );
  }
}, { immediate: true });

const onMultiplePageToggle = () => {
  if (props.assessment.requireMultiplePages && !props.assessment.requiredPageCount) {
    props.assessment.requiredPageCount = 2;
  }
};

const updatePageLabels = () => {
  props.assessment.pageLabels = [...pageLabelsArray.value];
};

const getFileUploadPlaceholder = () => {
  if (props.assessment.requireMultiplePages) {
    return `Take ${props.assessment.requiredPageCount || 2} photos of your work...`;
  }
  return 'Take a photo or upload a file showing your work...';
};
</script>

<style scoped>
.page-labels {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.page-label-input {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.page-number {
  min-width: 80px;
  font-weight: 500;
}
</style>
