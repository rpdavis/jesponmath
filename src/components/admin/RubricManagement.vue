<template>
  <div class="rubric-management">
    <div class="page-header">
      <h1>📊 Rubric Management</h1>
      <p>Create and manage customizable rubrics for paper-based assessments</p>
    </div>

    <!-- Controls -->
    <div class="controls-section">
      <button @click="showCreateModal = true" class="btn btn-primary">
        <span class="icon">➕</span>
        Create New Rubric
      </button>
      <div class="filters">
        <select v-model="filterSubject" class="filter-select">
          <option value="">All Subjects</option>
          <option value="math">Math</option>
          <option value="ela">ELA</option>
          <option value="other">Other</option>
        </select>
        <select v-model="filterActive" class="filter-select">
          <option value="">All Rubrics</option>
          <option value="true">Active Only</option>
          <option value="false">Inactive Only</option>
        </select>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search rubrics..."
          class="search-input"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading rubrics...</p>
    </div>

    <!-- Rubrics List -->
    <div v-else-if="filteredRubrics.length === 0" class="empty-state">
      <div class="empty-icon">📊</div>
      <h3>No Rubrics Found</h3>
      <p>{{ searchQuery || filterSubject ? 'No rubrics match your filters.' : 'Create your first rubric to get started.' }}</p>
      <button @click="showCreateModal = true" class="btn btn-primary">Create First Rubric</button>
    </div>

    <div v-else class="rubrics-grid">
      <div
        v-for="rubric in filteredRubrics"
        :key="rubric.id"
        class="rubric-card"
        :class="{ inactive: !rubric.isActive }"
      >
        <div class="rubric-header">
          <div class="rubric-title-section">
            <h3>{{ rubric.name }}</h3>
            <div class="rubric-badges">
              <span class="badge badge-subject" :class="`badge-${rubric.subject}`">
                {{ rubric.subject.toUpperCase() }}
              </span>
              <span v-if="rubric.topic" class="badge badge-topic">
                {{ rubric.topic }}
              </span>
              <span class="badge badge-points">
                {{ rubric.totalPoints }} points
              </span>
              <span v-if="!rubric.isActive" class="badge badge-inactive">
                Inactive
              </span>
            </div>
          </div>
          <div class="rubric-actions">
            <button @click="editRubric(rubric)" class="btn-icon" title="Edit">
              ✏️
            </button>
            <button
              @click="toggleRubricActive(rubric)"
              class="btn-icon"
              :title="rubric.isActive ? 'Deactivate' : 'Activate'"
            >
              {{ rubric.isActive ? '👁️' : '👁️‍🗨️' }}
            </button>
            <button @click="handleDeleteRubric(rubric)" class="btn-icon btn-danger" title="Delete">
              🗑️
            </button>
          </div>
        </div>

        <div class="rubric-content">
          <div v-if="rubric.description" class="rubric-field">
            <strong>Description:</strong>
            <span>{{ rubric.description }}</span>
          </div>
          <div class="rubric-field">
            <strong>Criteria ({{ rubric.criteria.length }}):</strong>
            <ul class="criteria-list">
              <li v-for="criterion in rubric.criteria" :key="criterion.id">
                <strong>{{ criterion.name }}</strong> ({{ criterion.maxPoints }} points)
                <span v-if="criterion.description"> - {{ criterion.description }}</span>
              </li>
            </ul>
          </div>
          <div v-if="rubric.passingScore" class="rubric-field">
            <strong>Passing Score:</strong>
            <span>{{ rubric.passingScore }} / {{ rubric.totalPoints }}</span>
          </div>
        </div>

        <div class="rubric-footer">
          <div class="rubric-meta">
            <span v-if="rubric.usageCount !== undefined">
              Used {{ rubric.usageCount }} time{{ rubric.usageCount !== 1 ? 's' : '' }}
            </span>
            <span v-if="rubric.createdAt">
              Created {{ formatDate(rubric.createdAt) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showCreateModal || showEditModal" class="modal-overlay" @click="closeModals">
      <div class="modal-content modal-large" @click.stop>
        <div class="modal-header">
          <h2>{{ showEditModal ? 'Edit Rubric' : 'Create New Rubric' }}</h2>
          <button @click="closeModals" class="btn-close">✕</button>
        </div>

        <form @submit.prevent="saveRubric" class="rubric-form">
          <div class="form-group">
            <label>Rubric Name *</label>
            <input
              v-model="formData.name"
              type="text"
              required
              placeholder="e.g., Writing Paragraph Rubric"
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Subject *</label>
              <select v-model="formData.subject" required>
                <option value="math">Math</option>
                <option value="ela">ELA</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div class="form-group">
              <label>Topic (optional)</label>
              <input
                v-model="formData.topic"
                type="text"
                placeholder="e.g., paragraph writing, essay writing"
              />
            </div>
          </div>

          <div class="form-group">
            <label>Description (optional)</label>
            <textarea
              v-model="formData.description"
              rows="2"
              placeholder="Describe what this rubric is used for..."
            ></textarea>
          </div>

          <div class="form-group">
            <label>Passing Score (optional)</label>
            <input
              v-model.number="formData.passingScore"
              type="number"
              min="0"
              :max="formData.totalPoints"
              placeholder="Minimum score to pass"
            />
          </div>

          <!-- Criteria Section -->
          <div class="form-group">
            <div class="criteria-header">
              <label>Criteria *</label>
              <button type="button" @click="addCriterion" class="btn btn-secondary btn-sm">
                ➕ Add Criterion
              </button>
            </div>
            <div v-if="formData.criteria.length === 0" class="empty-criteria">
              <p>No criteria added yet. Click "Add Criterion" to create one.</p>
            </div>
            <div v-else class="criteria-container">
              <div
                v-for="(criterion, index) in formData.criteria"
                :key="criterion.id"
                class="criterion-item"
              >
                <div class="criterion-header">
                  <h4>Criterion {{ index + 1 }}</h4>
                  <button
                    type="button"
                    @click="removeCriterion(index)"
                    class="btn-icon btn-danger"
                    title="Remove"
                  >
                    🗑️
                  </button>
                </div>
                <div class="form-group">
                  <label>Criterion Name *</label>
                  <input
                    v-model="criterion.name"
                    type="text"
                    required
                    placeholder="e.g., Ideas, Organization, Language/Mechanics"
                  />
                </div>
                <div class="form-group">
                  <label>Description (optional)</label>
                  <input
                    v-model="criterion.description"
                    type="text"
                    placeholder="What does this criterion measure?"
                  />
                </div>
                <div class="form-group">
                  <label>Maximum Points *</label>
                  <input
                    v-model.number="criterion.maxPoints"
                    type="number"
                    min="1"
                    required
                    placeholder="e.g., 4"
                  />
                </div>
                <div class="form-group">
                  <label>Performance Levels *</label>
                  <button
                    type="button"
                    @click="showLevelsModal(criterion)"
                    class="btn btn-secondary btn-sm"
                  >
                    Manage Levels ({{ criterion.levels.length }})
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>
              <input
                v-model="formData.isActive"
                type="checkbox"
              />
              Active (available for use)
            </label>
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeModals" class="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" :disabled="saving || !isFormValid">
              {{ saving ? 'Saving...' : (showEditModal ? 'Update Rubric' : 'Create Rubric') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Levels Modal -->
    <div v-if="showLevelsModalOpen && editingCriterion" class="modal-overlay" @click="closeLevelsModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Performance Levels for "{{ editingCriterion.name }}"</h2>
          <button @click="closeLevelsModal" class="btn-close">✕</button>
        </div>

        <div class="levels-content">
          <div class="form-group">
            <button type="button" @click="addLevel" class="btn btn-secondary btn-sm">
              ➕ Add Level
            </button>
          </div>
          <div v-if="editingCriterion.levels.length === 0" class="empty-levels">
            <p>No levels added yet. Click "Add Level" to create one.</p>
          </div>
          <div v-else class="levels-list">
            <div
              v-for="(level, index) in editingCriterion.levels"
              :key="level.id"
              class="level-item"
            >
              <div class="level-header">
                <span class="level-number">Level {{ index + 1 }}</span>
                <button
                  type="button"
                  @click="removeLevel(index)"
                  class="btn-icon btn-danger"
                  title="Remove"
                >
                  🗑️
                </button>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Level Name *</label>
                  <input
                    v-model="level.name"
                    type="text"
                    required
                    placeholder="e.g., Proficient, Developing, Emerging"
                  />
                </div>
                <div class="form-group">
                  <label>Points *</label>
                  <input
                    v-model.number="level.points"
                    type="number"
                    min="0"
                    :max="editingCriterion.maxPoints"
                    required
                    placeholder="0"
                  />
                </div>
                <div class="form-group">
                  <label>Order *</label>
                  <input
                    v-model.number="level.order"
                    type="number"
                    min="0"
                    required
                    placeholder="0"
                  />
                  <small class="form-hint">Higher number = better performance</small>
                </div>
              </div>
              <div class="form-group">
                <label>Description *</label>
                <textarea
                  v-model="level.description"
                  required
                  rows="2"
                  placeholder="Describe performance at this level..."
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button @click="closeLevelsModal" class="btn btn-primary">
            Done
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import {
  getAllRubrics,
  createRubric,
  updateRubric,
  deleteRubric as deleteRubricService,
  activateRubric,
  deactivateRubric,
} from '@/firebase/rubricServices'
import type { Rubric, RubricCriterion, RubricLevel } from '@/types/iep'

const authStore = useAuthStore()

// State
const loading = ref(false)
const saving = ref(false)
const rubrics = ref<Rubric[]>([])
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showLevelsModalOpen = ref(false)
const editingRubric = ref<Rubric | null>(null)
const editingCriterion = ref<RubricCriterion | null>(null)

// Filters
const filterSubject = ref('')
const filterActive = ref('')
const searchQuery = ref('')

// Form data
const formData = ref<{
  name: string
  subject: 'math' | 'ela' | 'other'
  topic: string
  description: string
  criteria: Array<RubricCriterion & { id: string }>
  totalPoints: number
  passingScore?: number
  isActive: boolean
}>({
  name: '',
  subject: 'ela',
  topic: '',
  description: '',
  criteria: [],
  totalPoints: 0,
  passingScore: undefined,
  isActive: true,
})

// Computed
const filteredRubrics = computed(() => {
  let filtered = [...rubrics.value]

  if (filterSubject.value) {
    filtered = filtered.filter(r => r.subject === filterSubject.value)
  }

  if (filterActive.value !== '') {
    const isActive = filterActive.value === 'true'
    filtered = filtered.filter(r => r.isActive === isActive)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      r =>
        r.name.toLowerCase().includes(query) ||
        (r.description && r.description.toLowerCase().includes(query)) ||
        (r.topic && r.topic.toLowerCase().includes(query))
    )
  }

  return filtered
})

const isFormValid = computed(() => {
  return (
    formData.value.name.trim() !== '' &&
    formData.value.criteria.length > 0 &&
    formData.value.criteria.every(c =>
      c.name.trim() !== '' &&
      c.maxPoints > 0 &&
      c.levels.length > 0 &&
      c.levels.every(l =>
        l.name.trim() !== '' &&
        l.description.trim() !== '' &&
        l.points >= 0 &&
        l.points <= c.maxPoints
      )
    )
  )
})

// Watch totalPoints
const updateTotalPoints = () => {
  formData.value.totalPoints = formData.value.criteria.reduce(
    (sum, c) => sum + c.maxPoints,
    0
  )
}

// Methods
const loadRubrics = async () => {
  try {
    loading.value = true
    rubrics.value = await getAllRubrics()
  } catch (error) {
    console.error('Error loading rubrics:', error)
    alert('Failed to load rubrics. Please try again.')
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  formData.value = {
    name: '',
    subject: 'ela',
    topic: '',
    description: '',
    criteria: [],
    totalPoints: 0,
    passingScore: undefined,
    isActive: true,
  }
  editingRubric.value = null
}

const addCriterion = () => {
  const newCriterion: RubricCriterion & { id: string } = {
    id: `criterion-${Date.now()}`,
    name: '',
    description: '',
    maxPoints: 4,
    levels: [],
  }
  formData.value.criteria.push(newCriterion)
  updateTotalPoints()
}

const removeCriterion = (index: number) => {
  formData.value.criteria.splice(index, 1)
  updateTotalPoints()
}

const showLevelsModal = (criterion: RubricCriterion & { id: string }) => {
  editingCriterion.value = criterion
  showLevelsModalOpen.value = true
}

const closeLevelsModal = () => {
  editingCriterion.value = null
  showLevelsModalOpen.value = false
}

const addLevel = () => {
  if (!editingCriterion.value) return
  const newLevel: RubricLevel & { id: string } = {
    id: `level-${Date.now()}`,
    name: '',
    points: 0,
    description: '',
    order: editingCriterion.value.levels.length,
  }
  editingCriterion.value.levels.push(newLevel)
}

const removeLevel = (index: number) => {
  if (!editingCriterion.value) return
  editingCriterion.value.levels.splice(index, 1)
}

const editRubric = (rubric: Rubric) => {
  editingRubric.value = rubric
  formData.value = {
    name: rubric.name,
    subject: rubric.subject,
    topic: rubric.topic || '',
    description: rubric.description || '',
    criteria: rubric.criteria.map(c => ({
      ...c,
      id: c.id,
    })),
    totalPoints: rubric.totalPoints,
    passingScore: rubric.passingScore,
    isActive: rubric.isActive,
  }
  showEditModal.value = true
}

const saveRubric = async () => {
  try {
    saving.value = true

    // Validate criteria and levels
    for (const criterion of formData.value.criteria) {
      if (criterion.levels.length === 0) {
        alert(`Criterion "${criterion.name}" must have at least one performance level.`)
        return
      }
      // Sort levels by order
      criterion.levels.sort((a, b) => a.order - b.order)
    }

    updateTotalPoints()

    const rubricData: Omit<Rubric, 'id' | 'createdAt' | 'updatedAt'> = {
      name: formData.value.name,
      subject: formData.value.subject,
      topic: formData.value.topic || undefined,
      description: formData.value.description || undefined,
      criteria: formData.value.criteria.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description || undefined,
        maxPoints: c.maxPoints,
        levels: c.levels.map(l => ({
          id: l.id,
          name: l.name,
          points: l.points,
          description: l.description,
          order: l.order,
        })),
      })),
      totalPoints: formData.value.totalPoints,
      passingScore: formData.value.passingScore,
      isActive: formData.value.isActive,
      createdBy: authStore.currentUser?.uid || '',
    }

    if (showEditModal.value && editingRubric.value) {
      await updateRubric(editingRubric.value.id, rubricData)
    } else {
      await createRubric(rubricData)
    }

    await loadRubrics()
    closeModals()
  } catch (error) {
    console.error('Error saving rubric:', error)
    alert('Failed to save rubric. Please try again.')
  } finally {
    saving.value = false
  }
}

const handleDeleteRubric = async (rubric: Rubric) => {
  if (!confirm(`Are you sure you want to delete the rubric "${rubric.name}"?`)) {
    return
  }

  try {
    await deleteRubricService(rubric.id)
    await loadRubrics()
  } catch (error) {
    console.error('Error deleting rubric:', error)
    alert('Failed to delete rubric. Please try again.')
  }
}

const toggleRubricActive = async (rubric: Rubric) => {
  try {
    if (rubric.isActive) {
      await deactivateRubric(rubric.id)
    } else {
      await activateRubric(rubric.id)
    }
    await loadRubrics()
  } catch (error) {
    console.error('Error toggling rubric:', error)
    alert('Failed to update rubric. Please try again.')
  }
}

const closeModals = () => {
  showCreateModal.value = false
  showEditModal.value = false
  resetForm()
}

const formatDate = (timestamp: any): string => {
  if (!timestamp) return 'Unknown'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString()
}

// Lifecycle
onMounted(() => {
  loadRubrics()
})
</script>

<style scoped>
/* Reuse styles from GoalTemplateManagement */
.rubric-management {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.page-header p {
  color: #666;
  font-size: 1.1rem;
}

.controls-section {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  align-items: center;
}

.filters {
  display: flex;
  gap: 1rem;
  flex: 1;
}

.filter-select,
.search-input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.search-input {
  flex: 1;
  min-width: 200px;
}

.rubrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

.rubric-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s;
}

.rubric-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.rubric-card.inactive {
  opacity: 0.7;
}

.rubric-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.rubric-title-section h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
}

.rubric-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-subject {
  background: #e3f2fd;
  color: #1976d2;
}

.badge-math {
  background: #fff3e0;
  color: #f57c00;
}

.badge-ela {
  background: #e8f5e9;
  color: #388e3c;
}

.badge-other {
  background: #f3e5f5;
  color: #7b1fa2;
}

.badge-topic {
  background: #f5f5f5;
  color: #666;
}

.badge-points {
  background: #e1bee7;
  color: #6a1b9a;
}

.badge-inactive {
  background: #ffebee;
  color: #c62828;
}

.rubric-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.btn-icon:hover {
  opacity: 1;
}

.btn-icon.btn-danger:hover {
  color: #c62828;
}

.rubric-content {
  margin-bottom: 1rem;
}

.rubric-field {
  margin-bottom: 1rem;
}

.rubric-field strong {
  display: block;
  margin-bottom: 0.25rem;
  color: #555;
}

.criteria-list {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.criteria-list li {
  margin-bottom: 0.25rem;
}

.rubric-footer {
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.rubric-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  color: #666;
}

.modal-overlay {
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
  padding: 2rem;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.modal-large {
  max-width: 900px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  color: #000;
}

.rubric-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  font-family: inherit;
}

.form-group textarea {
  resize: vertical;
}

.form-hint {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.85rem;
  color: #666;
}

.criteria-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.criteria-header label {
  margin-bottom: 0;
}

.empty-criteria,
.empty-levels {
  padding: 2rem;
  text-align: center;
  color: #999;
  background: #f9f9f9;
  border-radius: 4px;
}

.criteria-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.criterion-item {
  padding: 1.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #f9f9f9;
}

.criterion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.criterion-header h4 {
  margin: 0;
  font-size: 1.1rem;
}

.levels-content {
  padding: 1.5rem;
}

.levels-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.level-item {
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #f9f9f9;
}

.level-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.level-number {
  font-weight: 600;
  color: #555;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #eee;
}

.btn {
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: #1976d2;
  color: white;
}

.btn-primary:hover {
  background: #1565c0;
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn-sm {
  padding: 0.4rem 0.8rem;
  font-size: 0.85rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 3rem;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #1976d2;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>





