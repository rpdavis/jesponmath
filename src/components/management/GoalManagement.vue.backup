<template>
  <div class="goal-management">
    <div class="header-section">
      <h1>🎯 Goal Management</h1>
      <p class="subtitle">Manage IEP goals and connect assessments for progress tracking</p>
      
      <div class="action-buttons">
        <button @click="showCreateGoalModal = true" class="btn btn-primary">
          <span class="icon">➕</span>
          Create New Goal
        </button>
        <button @click="showCreateAssessmentModal = true" class="btn btn-secondary">
          <span class="icon">📝</span>
          Create Progress Assessment
        </button>
      </div>
    </div>

    <!-- Filters and Search -->
    <div class="filters-section">
      <div class="filter-group">
        <label for="studentFilter">Student:</label>
        <select id="studentFilter" v-model="selectedStudentUid" @change="filterGoals" class="form-select">
          <option value="">All Students</option>
          <option v-for="student in students" :key="student.uid" :value="student.uid">
            {{ student.firstName }} {{ student.lastName }}
          </option>
        </select>
      </div>
      
      <div class="filter-group">
        <label for="statusFilter">Status:</label>
        <select id="statusFilter" v-model="selectedStatus" @change="filterGoals" class="form-select">
          <option value="">All Goals</option>
          <option value="active">Active Goals</option>
          <option value="met">Goals Met</option>
          <option value="archived">Archived Goals</option>
        </select>
      </div>
      
      <div class="filter-group">
        <label for="subjectFilter">Subject Area:</label>
        <select id="subjectFilter" v-model="selectedSubject" @change="filterGoals" class="form-select">
          <option value="">All Subjects</option>
          <option value="math">Math</option>
          <option value="ela">ELA</option>
          <option value="other">Other</option>
        </select>
      </div>
      
      <div class="filter-group">
        <label for="searchQuery">Search:</label>
        <input 
          id="searchQuery"
          v-model="searchQuery" 
          @input="filterGoals"
          type="text" 
          placeholder="Search goals..."
          class="form-input"
        >
      </div>
    </div>

    <!-- Goals List -->
    <div class="goals-section">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Loading goals...</p>
      </div>
      
      <div v-else-if="filteredGoals.length === 0" class="empty-state">
        <div class="empty-icon">🎯</div>
        <h3>No Goals Found</h3>
        <p>{{ selectedStudentUid ? 'This student has no goals yet.' : 'No goals match your current filters.' }}</p>
        <button @click="showCreateGoalModal = true" class="btn btn-primary">
          Create First Goal
        </button>
      </div>
      
      <div v-else class="goals-grid">
        <div v-for="goal in filteredGoals" :key="goal.id" class="goal-card">
          <div class="goal-header">
            <h3>{{ goal.goalTitle }}</h3>
            <div class="goal-status">
              <span v-if="goal.isMet" class="status-badge met">✅ Met</span>
              <span v-else-if="goal.isArchived" class="status-badge archived">📦 Archived</span>
              <span v-else-if="goal.isActive" class="status-badge active">🟢 Active</span>
              <span v-else class="status-badge inactive">⏸️ Inactive</span>
            </div>
          </div>
          
          <div class="goal-details">
            <div class="detail-row">
              <strong>Students:</strong> 
              <span v-if="goal.assignedStudents?.length">
                {{ goal.assignedStudents.map(uid => getStudentName(uid)).join(', ') }}
              </span>
              <span v-else-if="goal.studentUid">
                {{ getStudentName(goal.studentUid) }}
              </span>
              <span v-else class="no-students-assigned">
                No students assigned
              </span>
            </div>
            <div class="detail-row">
              <strong>Area of Need:</strong> 
              <span>{{ goal.areaOfNeed }}</span>
            </div>
            <div class="detail-row">
              <strong>Baseline:</strong> 
              <span>{{ goal.baseline }}</span>
            </div>
            <div class="detail-row">
              <strong>Goal:</strong> 
              <span>{{ goal.goalText }}</span>
            </div>
          </div>
          
          <!-- Assigned Assessments -->
          <div class="assessments-section">
            <h4>📊 Assigned Assessments ({{ goal.assignedAssessments?.length || 0 }})</h4>
            <div v-if="goal.assignedAssessments?.length" class="assessment-list">
              <div v-for="assessmentId in goal.assignedAssessments" :key="assessmentId" class="assessment-item-expanded">
                <div class="assessment-header-row">
                  <span class="assessment-title">{{ getAssessmentTitle(assessmentId) }}</span>
                  <button 
                    @click="removeAssessmentFromGoal(goal.id, assessmentId)"
                    class="btn btn-xs btn-danger"
                    title="Remove assessment from goal"
                  >
                    ❌
                  </button>
                </div>
                
                <!-- Student Assignment Status -->
                <div v-if="goal.assignedStudents?.length" class="student-assignment-status">
                  <div v-for="studentUid in goal.assignedStudents" :key="studentUid" class="student-assignment-row">
                    <span class="student-name-small">{{ getStudentName(studentUid) }}</span>
                    <span v-if="isAssessmentAssignedToStudent(assessmentId, studentUid)" class="status-assigned">
                      ✅ Assigned
                    </span>
                    <button 
                      v-else
                      @click="assignAssessmentToStudent(assessmentId, studentUid, goal.id)"
                      class="btn btn-xs btn-primary"
                      title="Assign to student"
                    >
                      📝 Assign to Student
                    </button>
                  </div>
                </div>
                <div v-else-if="goal.studentUid" class="student-assignment-status">
                  <div class="student-assignment-row">
                    <span class="student-name-small">{{ getStudentName(goal.studentUid) }}</span>
                    <span v-if="isAssessmentAssignedToStudent(assessmentId, goal.studentUid)" class="status-assigned">
                      ✅ Assigned
                    </span>
                    <button 
                      v-else
                      @click="assignAssessmentToStudent(assessmentId, goal.studentUid, goal.id)"
                      class="btn btn-xs btn-primary"
                      title="Assign to student"
                    >
                      📝 Assign to Student
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="no-assessments">
              <p>No assessments assigned yet</p>
            </div>
            
            <div class="assessment-actions">
              <select 
                v-model="selectedAssessmentForGoal[goal.id]" 
                class="form-select form-select-sm"
                @change="assignAssessmentToGoal(goal.id, selectedAssessmentForGoal[goal.id])"
              >
                <option value="">Assign existing assessment...</option>
                <option v-for="assessment in availableAssessments" :key="assessment.id" :value="assessment.id">
                  {{ assessment.title }} ({{ assessment.category }})
                </option>
              </select>
              <button 
                @click="createAssessmentForGoal(goal.id)"
                class="btn btn-sm btn-secondary"
                title="Create new assessment for this goal"
              >
                ➕ New
              </button>
              <button 
                @click="generateAssessmentsForGoal(goal.id)"
                class="btn btn-sm btn-info"
                title="Generate 3 AI assessments for this goal"
              >
                🤖 Generate Assessments
              </button>
              <button 
                v-if="goal.assignedAssessments?.length > 0"
                @click="assignAllAssessmentsToAllStudents(goal)"
                class="btn btn-sm btn-success"
                title="Assign all assessments to all students in this goal"
              >
                📤 Assign All to Students
              </button>
            </div>
          </div>
          
          <!-- Goal Actions -->
          <div class="goal-actions">
            <button @click="editGoal(goal)" class="btn btn-sm btn-primary">
              ✏️ Edit
            </button>
            
            <button 
              v-if="goal.isActive && !goal.isMet"
              @click="markGoalAsMet(goal.id)"
              class="btn btn-sm btn-success"
            >
              ✅ Mark Met
            </button>
            
            <button 
              v-if="goal.isActive && !goal.isArchived"
              @click="archiveGoal(goal.id)"
              class="btn btn-sm btn-warning"
            >
              📦 Archive
            </button>
            
            <button 
              v-if="!goal.isActive || goal.isArchived"
              @click="reactivateGoal(goal.id)"
              class="btn btn-sm btn-info"
            >
              🔄 Reactivate
            </button>
            
            <button 
              @click="deleteGoal(goal.id)"
              class="btn btn-sm btn-danger"
              :disabled="goal.assignedAssessments?.length > 0"
              :title="goal.assignedAssessments?.length > 0 ? 'Remove all assessments first' : 'Delete goal'"
            >
              🗑️ Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Goal Modal -->
    <div v-if="showCreateGoalModal || showEditGoalModal" class="modal-overlay" @click="closeModals">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ showEditGoalModal ? 'Edit Goal' : 'Create New Goal' }}</h2>
          <button @click="closeModals" class="btn-close">✕</button>
        </div>
        
        <form @submit.prevent="saveGoal" class="goal-form">
          <div class="form-group">
            <label for="goalTitle">Goal Title *</label>
            <input 
              id="goalTitle"
              v-model="goalForm.goalTitle" 
              type="text" 
              required 
              class="form-input"
              placeholder="e.g., Fraction Operations Mastery"
            >
          </div>
          
          <div class="form-group full-width">
            <label for="studentSearch">Assign Students (Optional)</label>
            <div class="student-selector">
              <input
                id="studentSearch"
                v-model="studentSearchQuery"
                type="text"
                class="form-input"
                placeholder="Search students by name..."
                @focus="showStudentDropdown = true"
              >
              
              <div v-if="showStudentDropdown" class="student-dropdown">
                <div class="dropdown-header">
                  <span>{{ filteredStudents.length }} students found</span>
                  <button type="button" @click="showStudentDropdown = false" class="btn-close-dropdown">✕</button>
                </div>
                
                <div v-if="filteredStudents.length === 0" class="no-students">
                  No students found
                </div>
                
                <div v-else class="student-list">
                  <label 
                    v-for="student in filteredStudents" 
                    :key="student.uid"
                    class="student-item"
                  >
                    <input
                      type="checkbox"
                      :value="student.uid"
                      v-model="goalForm.assignedStudents"
                      @change="updateStudentSelection"
                    >
                    <span class="student-info">
                      <strong>{{ student.firstName }} {{ student.lastName }}</strong>
                      <small v-if="student.period">Period {{ student.period }}</small>
                      <small v-if="student.grade">Grade {{ student.grade }}</small>
                    </span>
                  </label>
                </div>
              </div>
              
              <!-- Selected Students Display -->
              <div v-if="goalForm.assignedStudents.length > 0" class="selected-students">
                <h4>Selected Students ({{ goalForm.assignedStudents.length }})</h4>
                <div class="selected-student-tags">
                  <div 
                    v-for="studentUid in goalForm.assignedStudents" 
                    :key="studentUid"
                    class="student-tag"
                  >
                    <span>{{ getStudentName(studentUid) }}</span>
                    <button 
                      type="button"
                      @click="removeStudent(studentUid)"
                      class="btn-remove-student"
                      title="Remove student"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
              
              <small class="form-help">
                Select one or more students for this goal. You can leave this empty and assign students later.
              </small>
            </div>
          </div>
          
          <div class="form-row">
            
            <div class="form-group">
              <label for="areaOfNeed">Area of Need *</label>
              <input 
                id="areaOfNeed"
                v-model="goalForm.areaOfNeed" 
                type="text" 
                required 
                class="form-input"
                placeholder="e.g., Math Computation, Reading Comprehension"
              >
            </div>
          </div>
          
          <div class="form-group">
            <label for="baseline">Baseline *</label>
            <textarea 
              id="baseline"
              v-model="goalForm.baseline" 
              required 
              class="form-textarea"
              rows="3"
              placeholder="Describe the student's current performance level..."
            ></textarea>
          </div>
          
          <div class="form-group">
            <label for="goalText">Goal Statement *</label>
            <textarea 
              id="goalText"
              v-model="goalForm.goalText" 
              required 
              class="form-textarea"
              rows="4"
              placeholder="Write the specific, measurable goal statement..."
            ></textarea>
          </div>
          
          <div class="form-group">
            <label for="startDate">Start Date (Optional)</label>
            <input 
              id="startDate"
              v-model="goalForm.startDate" 
              type="date" 
              class="form-input"
            >
            <small class="form-help">IEP dates are tracked individually per student</small>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="personResponsible">Person Responsible</label>
              <input 
                id="personResponsible"
                v-model="goalForm.personResponsible" 
                type="text" 
                class="form-input"
                placeholder="e.g., Special Education Teacher"
              >
            </div>
            
            <div class="form-group">
              <label for="gradeLevel">Grade Level</label>
              <select id="gradeLevel" v-model="goalForm.gradeLevel" class="form-select">
                <option value="">Select Grade</option>
                <option v-for="grade in [6, 7, 8, 9, 10, 11, 12]" :key="grade" :value="grade">
                  Grade {{ grade }}
                </option>
              </select>
            </div>
          </div>
          
          <div class="form-group">
            <label for="standard">Related Standard</label>
            <input 
              id="standard"
              v-model="goalForm.standard" 
              type="text" 
              class="form-input"
              placeholder="e.g., 7.EE.4a, CCSS.MATH.CONTENT.7.NS.A.1"
            >
          </div>
          
          <div class="form-group">
            <label for="purposeOfGoal">Purpose of Goal</label>
            <textarea 
              id="purposeOfGoal"
              v-model="goalForm.purposeOfGoal" 
              class="form-textarea"
              rows="2"
              placeholder="Explain why this goal is important for the student..."
            ></textarea>
          </div>
          
          <div class="form-actions">
            <button type="button" @click="closeModals" class="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? 'Saving...' : (showEditGoalModal ? 'Update Goal' : 'Create Goal') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Assessment Preview Modal -->
    <div v-if="showAssessmentPreview" class="modal fade show" style="display: block;" @click.self="showAssessmentPreview = false">
      <div class="modal-dialog modal-xl modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Preview Generated Assessments</h5>
            <button type="button" class="btn-close" @click="showAssessmentPreview = false"></button>
          </div>
          <div class="modal-body">
            <div v-if="loading" class="text-center">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              <p>Loading assessments...</p>
            </div>
            <div v-if="previewAssessments.length > 0">
              <div 
                v-for="(assessment, assessmentIndex) in previewAssessments" 
                :key="assessmentIndex"
                class="assessment-preview-card"
              >
                <div class="preview-card-header">
                  <h6>{{ assessment.title }}</h6>
                  <span class="points-badge">{{ assessment.totalPoints }} points</span>
                </div>
                
                <div class="preview-description">
                  <p>{{ assessment.description }}</p>
                </div>
                
                <div class="questions-preview">
                  <h6>Questions ({{ assessment.questions.length }})</h6>
                  <div 
                    v-for="(question, qIndex) in assessment.questions" 
                    :key="question.id"
                    class="question-preview-item"
                  >
                    <div class="question-number">Q{{ qIndex + 1 }}</div>
                    <div class="question-content-preview">
                      <div class="question-text-preview">
                        <strong>Question:</strong>
                        <textarea 
                          v-model="question.questionText" 
                          class="editable-textarea"
                          rows="3"
                          placeholder="Enter question text..."
                        ></textarea>
                      </div>
                      <div class="answer-preview">
                        <strong>Correct Answer:</strong>
                        <input 
                          v-model="question.correctAnswer" 
                          type="text" 
                          class="editable-input"
                          placeholder="Enter correct answer..."
                        />
                      </div>
                      <div class="alternative-answers-preview">
                        <strong>Alternative Answers (comma-separated):</strong>
                        <input 
                          v-model="question.acceptableAnswersString" 
                          type="text" 
                          class="editable-input"
                          placeholder="e.g., 6, -6, x=6"
                          @blur="updateAlternativeAnswers(assessment, qIndex)"
                        />
                        <small class="help-text">Students can answer with any of these formats</small>
                      </div>
                      <div v-if="question.explanation" class="explanation-preview">
                        <strong>Explanation:</strong>
                        <textarea 
                          v-model="question.explanation" 
                          class="editable-textarea"
                          rows="2"
                          placeholder="Enter explanation..."
                        ></textarea>
                      </div>
                      <div class="question-meta-preview">
                        <span class="meta-tag">Points: {{ question.points }}</span>
                        <span class="meta-tag" :class="{ 'requires-photo': question.requiresPhoto }">
                          {{ question.requiresPhoto ? '📷 Requires Photo' : '✏️ Text Answer' }}
                        </span>
                        <span v-if="question._source === 'fallback'" class="meta-tag warning" title="AI generation failed, template used">
                          ⚠️ AI Failed
                        </span>
                        <span v-else-if="question._source === 'ai' || question._source === 'ai-with-template-reference'" class="meta-tag success">
                          ✨ AI Generated
                        </span>
                        <span v-else-if="question._source === 'template'" class="meta-tag info">
                          📋 Template
                        </span>
                        <button 
                          @click="regenerateRemainingQuestions(assessmentIndex, qIndex)" 
                          class="btn btn-sm btn-secondary regenerate-btn"
                          title="Regenerate remaining questions based on this edited question"
                          :disabled="saving"
                        >
                          🔄 Regenerate Others
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showAssessmentPreview = false">Close</button>
            <button type="button" class="btn btn-primary" @click="handleApproval" :disabled="!previewGoal">
              Approve & Create Assessments
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Proofread Single Question Modal -->
    <template v-if="showSingleQuestionPreview">
      <div class="modal-backdrop fade show" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); z-index: 1040;" @click="showSingleQuestionPreview = false"></div>
      <div class="modal fade show" style="display: block; z-index: 1055; position: fixed; top: 0; left: 0; width: 100%; height: 100%; overflow-x: hidden; overflow-y: auto;" @click.self="showSingleQuestionPreview = false">
        <div class="modal-dialog modal-xl" style="position: relative; width: auto; margin: 1.75rem auto; max-width: 1200px;">
          <div class="modal-content" style="border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
          <div class="modal-header" style="padding: 1.25rem 1.5rem; border-bottom: 2px solid #e9ecef; background-color: #f8f9fa; border-radius: 8px 8px 0 0;">
            <h5 class="modal-title" style="margin: 0; font-size: 1.25rem; font-weight: 600; color: #2c3e50;">📝 Proofread Question</h5>
            <button type="button" class="btn-close" @click="showSingleQuestionPreview = false" style="font-size: 1.5rem; opacity: 0.6;">&times;</button>
          </div>
          <div class="modal-body" style="padding: 1.5rem;">
            <div v-if="isGenerating" class="text-center" style="padding: 2rem;">
              <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
                <span class="visually-hidden">Loading...</span>
              </div>
              <p style="margin-top: 1rem; color: #6c757d;">Generating preview question...</p>
            </div>
            <div v-if="singlePreviewQuestion && !isGenerating">
              <div class="proofread-question-container">
                <div class="proofread-header">
                  <h5 style="margin: 0; color: #2c3e50; font-weight: 600;">📝 Preview Question</h5>
                  <div class="source-badges">
                    <span v-if="singlePreviewQuestion._source === 'fallback'" class="source-badge warning" title="AI generation failed, fell back to template.">⚠️ AI Failed</span>
                    <span v-else-if="singlePreviewQuestion._source?.startsWith('ai')" class="source-badge success">✨ AI Generated</span>
                    <span v-else-if="singlePreviewQuestion._source === 'template'" class="source-badge info">📋 Template</span>
                  </div>
                </div>
                
                <div class="proofread-form">
                  <div class="form-field">
                    <label class="form-label">Question Text:</label>
                    <textarea 
                      v-model="singlePreviewQuestion.questionText" 
                      class="proofread-textarea"
                      rows="4"
                      placeholder="Enter the question text..."
                    ></textarea>
                  </div>
                  
                  <div class="form-row-proofread">
                    <div class="form-field">
                      <label class="form-label">Correct Answer:</label>
                      <input 
                        type="text" 
                        v-model="singlePreviewQuestion.correctAnswer" 
                        class="proofread-input"
                        placeholder="e.g., 42"
                      />
                    </div>
                    <div class="form-field">
                      <label class="form-label">Alternative Answers:</label>
                      <input 
                        type="text" 
                        v-model="singlePreviewQuestion.acceptableAnswersString" 
                        class="proofread-input"
                        placeholder="e.g., 42, -42, x=42"
                      />
                      <small class="form-hint">Comma-separated list of acceptable answer formats</small>
                    </div>
                  </div>
                  
                  <div v-if="singlePreviewQuestion.explanation" class="form-field">
                    <label class="form-label">Explanation (optional):</label>
                    <textarea 
                      v-model="singlePreviewQuestion.explanation" 
                      class="proofread-textarea"
                      rows="2"
                      placeholder="Optional explanation..."
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer" style="padding: 1rem 1.5rem; border-top: 1px solid #dee2e6; display: flex; justify-content: space-between; align-items: center;">
            <button
              type="button"
              class="proofread-btn regenerate-btn"
              @click="generateProofreadQuestion(currentGoalForGeneration!)"
              :disabled="isGenerating"
            >
              <span v-if="isGenerating" class="spinner-border spinner-border-sm" role="status" aria-hidden="true" style="margin-right: 0.5rem;"></span>
              🔄 Regenerate Question
            </button>
            <div style="display: flex; gap: 0.75rem;">
              <button type="button" class="proofread-btn cancel-btn" @click="showSingleQuestionPreview = false">Cancel</button>
              <button type="button" class="proofread-btn approve-btn" @click="handleApproval" :disabled="!singlePreviewQuestion">
                ✅ Approve & Create Assessments
              </button>
            </div>
          </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Confirmation Preview Modal -->
    <template v-if="showConfirmationPreview">
      <div class="modal-backdrop fade show" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); z-index: 1040;" @click="cancelConfirmationPreview"></div>
      <div class="modal fade show" style="display: block; z-index: 1055; position: fixed; top: 0; left: 0; width: 100%; height: 100%; overflow-x: hidden; overflow-y: auto;" @click.self="cancelConfirmationPreview">
        <div class="modal-dialog modal-xl" style="position: relative; width: auto; margin: 1.75rem auto; max-width: 1400px;">
          <div class="modal-content" style="border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
            <div class="modal-header" style="padding: 1.25rem 1.5rem; border-bottom: 2px solid #e9ecef; background-color: #f8f9fa; border-radius: 8px 8px 0 0;">
              <h5 class="modal-title" style="margin: 0; font-size: 1.25rem; font-weight: 600; color: #2c3e50;">✅ Confirm Generated Assessments</h5>
              <button type="button" class="btn-close" @click="cancelConfirmationPreview" style="font-size: 1.5rem; opacity: 0.6;">&times;</button>
            </div>
            <div class="modal-body" style="padding: 1.5rem; max-height: 70vh; overflow-y: auto;">
              <div class="confirmation-info" style="background: #e7f3ff; border-left: 4px solid #007bff; padding: 1rem; margin-bottom: 1.5rem; border-radius: 4px;">
                <p style="margin: 0; color: #004085; font-weight: 500;">
                  📋 Review the generated assessments below. Click "Create Assessments" to save them, or "Cancel" to go back.
                </p>
              </div>
              
              <div v-for="(assessment, assessmentIndex) in generatedAssessmentsForPreview" :key="assessmentIndex" class="assessment-confirmation-card" style="margin-bottom: 2rem; border: 1px solid #dee2e6; border-radius: 8px; overflow: hidden;">
                <div class="assessment-confirmation-header" style="background: #f8f9fa; padding: 1rem 1.25rem; border-bottom: 1px solid #dee2e6;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h6 style="margin: 0; font-size: 1.1rem; font-weight: 600; color: #2c3e50;">{{ assessment.title }}</h6>
                    <span style="background: #007bff; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.875rem; font-weight: 500;">{{ assessment.totalPoints }} points</span>
                  </div>
                  <p style="margin: 0.5rem 0 0 0; color: #6c757d; font-size: 0.9rem;">{{ assessment.description }}</p>
                </div>
                
                <div class="assessment-confirmation-questions" style="padding: 1.25rem;">
                  <h6 style="margin: 0 0 1rem 0; font-size: 0.95rem; font-weight: 600; color: #495057;">Questions ({{ assessment.questions.length }})</h6>
                  <div v-for="(question, qIndex) in assessment.questions" :key="qIndex" class="question-confirmation-item" style="background: white; border: 1px solid #e9ecef; border-radius: 6px; padding: 1rem; margin-bottom: 0.75rem;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
                      <span style="font-weight: 600; color: #007bff; font-size: 0.9rem;">Question {{ qIndex + 1 }}</span>
                      <div class="question-meta-confirmation">
                        <span v-if="question._source === 'fallback'" class="source-badge warning" style="font-size: 0.75rem;">⚠️ AI Failed</span>
                        <span v-else-if="question._source?.startsWith('ai')" class="source-badge success" style="font-size: 0.75rem;">✨ AI</span>
                        <span v-else-if="question._source === 'template'" class="source-badge info" style="font-size: 0.75rem;">📋 Template</span>
                      </div>
                    </div>
                    <div style="margin-bottom: 0.5rem;">
                      <strong style="color: #495057; font-size: 0.9rem;">Q:</strong>
                      <p style="margin: 0.25rem 0 0 0; color: #212529; line-height: 1.5;">{{ question.questionText }}</p>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 0.75rem;">
                      <div>
                        <strong style="color: #495057; font-size: 0.85rem;">Correct Answer:</strong>
                        <p style="margin: 0.25rem 0 0 0; color: #28a745; font-weight: 500;">{{ question.correctAnswer }}</p>
                      </div>
                      <div v-if="question.acceptableAnswers && question.acceptableAnswers.length > 0">
                        <strong style="color: #495057; font-size: 0.85rem;">Alternatives:</strong>
                        <p style="margin: 0.25rem 0 0 0; color: #6c757d; font-size: 0.9rem;">{{ question.acceptableAnswers.join(', ') }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer" style="padding: 1rem 1.5rem; border-top: 1px solid #dee2e6; display: flex; justify-content: flex-end; gap: 0.75rem;">
              <button type="button" class="proofread-btn cancel-btn" @click="cancelConfirmationPreview">Cancel</button>
              <button type="button" class="proofread-btn approve-btn" @click="confirmAndCreateAssessments" :disabled="isGeneratingRemaining">
                <span v-if="isGeneratingRemaining" class="spinner-border spinner-border-sm" role="status" aria-hidden="true" style="margin-right: 0.5rem;"></span>
                ✅ Create Assessments
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-if="loading || isGeneratingRemaining" class="loading-overlay">
      <div class="spinner-border text-light" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2 text-light">{{ isGeneratingRemaining ? 'Generating assessments...' : 'Loading...' }}</p>
    </div>

    <!-- Create Assessment Modal -->
    <div v-if="showCreateAssessmentModal" class="modal-overlay" @click="closeModals">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Create Progress Assessment</h2>
          <button @click="closeModals" class="btn-close">✕</button>
        </div>
        
        <form @submit.prevent="createProgressAssessment" class="assessment-form">
          <div class="form-group">
            <label for="assessmentTitle">Assessment Title *</label>
            <input 
              id="assessmentTitle"
              v-model="assessmentForm.title" 
              type="text" 
              required 
              class="form-input"
              placeholder="e.g., Fraction Operations Progress Check"
            >
          </div>
          
          <div class="form-group">
            <label for="assessmentDescription">Description</label>
            <textarea 
              id="assessmentDescription"
              v-model="assessmentForm.description" 
              class="form-textarea"
              rows="3"
              placeholder="Describe what this assessment measures..."
            ></textarea>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="assessmentGrade">Grade Level (Optional)</label>
              <select id="assessmentGrade" v-model="assessmentForm.gradeLevel" class="form-select">
                <option value="">Select Grade</option>
                <option v-for="grade in [6, 7, 8, 9, 10, 11, 12]" :key="grade" :value="grade">
                  Grade {{ grade }}
                </option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="connectToGoal">Connect to Goal</label>
              <select id="connectToGoal" v-model="assessmentForm.goalId" class="form-select">
                <option value="">Select Goal (Optional)</option>
              <option v-for="goal in activeGoals" :key="goal.id" :value="goal.id">
                {{ goal.goalTitle }} - {{ goal.assignedStudents?.length > 0 ? goal.assignedStudents.map(uid => getStudentName(uid)).join(', ') : (goal.studentUid ? getStudentName(goal.studentUid) : 'No students') }}
              </option>
              </select>
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" @click="closeModals" class="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? 'Creating...' : 'Create & Edit Assessment' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { 
  createGoal, 
  updateGoal, 
  deleteGoal as deleteGoalService,
  getAllGoals,
  getGoalsByTeacher,
  archiveGoal as archiveGoalService,
  markGoalAsMet as markGoalAsMetService,
  reactivateGoal as reactivateGoalService,
  assignAssessmentToGoal as assignAssessmentService,
  removeAssessmentFromGoal as removeAssessmentService
} from '@/firebase/goalServices'
import { getAllStudents, getStudentsByTeacher } from '@/firebase/userServices'
import { getAllAssessments, getAssessmentsByTeacher, createAssessment } from '@/firebase/iepServices'
import { assignAssessmentToStudent as assignToStudent, getStudentAssignments, getAssignmentsForStudents } from '@/firebase/assignmentServices'
import { generateQuestionForGoal } from '@/services/goalQuestionGenerator'
import type { Goal, Assessment, AssessmentQuestion } from '@/types/iep'
import type { Student } from '@/types/users'

// Extended question type for preview (includes editing fields)
interface PreviewQuestion extends AssessmentQuestion {
  acceptableAnswersString?: string
  _source?: 'template' | 'ai' | 'ai-with-template-reference' | 'fallback'
  _aiError?: string
}

const router = useRouter()
const authStore = useAuthStore()

// Data
const goals = ref<Goal[]>([])
const students = ref<Student[]>([])
const assessments = ref<Assessment[]>([])
const studentAssignments = ref<Record<string, string[]>>({}) // studentUid -> assessmentIds[]
const loading = ref(true)
const saving = ref(false)

// Filters
const selectedStudentUid = ref('')
const selectedStatus = ref('')
const selectedSubject = ref('')
const searchQuery = ref('')

// Modals
const showCreateGoalModal = ref(false)
const showEditGoalModal = ref(false)
const showCreateAssessmentModal = ref(false)
const editingGoal = ref<Goal | null>(null)

// Forms
const goalForm = reactive({
  goalTitle: '',
  assignedStudents: [] as string[],
  areaOfNeed: '',
  baseline: '',
  goalText: '',
  startDate: '',
  personResponsible: '',
  gradeLevel: undefined as number | undefined,
  standard: '',
  purposeOfGoal: '',
  assignedAssessments: [] as string[]
})

// UI state for student selector
const studentSearchQuery = ref('')
const showStudentDropdown = ref(false)

const assessmentForm = reactive({
  title: '',
  description: '',
  gradeLevel: undefined as number | undefined,
  goalId: ''
})

// Assessment assignment tracking
const selectedAssessmentForGoal = ref<Record<string, string>>({})

// Helper function to determine subject area from goal
const getSubjectArea = (goal: Goal): 'math' | 'ela' | 'other' => {
  const areaLower = goal.areaOfNeed.toLowerCase()
  const titleLower = goal.goalTitle.toLowerCase()
  const textLower = goal.goalText.toLowerCase()
  
  // Math keywords
  const mathKeywords = ['math', 'multiplication', 'division', 'addition', 'subtraction', 'fraction', 'decimal', 'equation', 'algebra', 'geometry', 'number', 'calculation', 'computation']
  if (mathKeywords.some(keyword => areaLower.includes(keyword) || titleLower.includes(keyword) || textLower.includes(keyword))) {
    return 'math'
  }
  
  // ELA keywords
  const elaKeywords = ['reading', 'writing', 'comprehension', 'vocabulary', 'grammar', 'spelling', 'decoding', 'fluency', 'phonics', 'essay', 'paragraph', 'text', 'literacy', 'language']
  if (elaKeywords.some(keyword => areaLower.includes(keyword) || titleLower.includes(keyword) || textLower.includes(keyword))) {
    return 'ela'
  }
  
  return 'other'
}

// Computed
const filteredGoals = computed(() => {
  let filtered = goals.value

  // Filter by student
  if (selectedStudentUid.value) {
    filtered = filtered.filter(goal => 
      goal.assignedStudents?.includes(selectedStudentUid.value) || 
      goal.studentUid === selectedStudentUid.value
    )
  }

  // Filter by status
  if (selectedStatus.value) {
    switch (selectedStatus.value) {
      case 'active':
        filtered = filtered.filter(goal => goal.isActive && !goal.isMet && !goal.isArchived)
        break
      case 'met':
        filtered = filtered.filter(goal => goal.isMet)
        break
      case 'archived':
        filtered = filtered.filter(goal => goal.isArchived)
        break
    }
  }

  // Filter by subject area
  if (selectedSubject.value) {
    filtered = filtered.filter(goal => getSubjectArea(goal) === selectedSubject.value)
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(goal => {
      const studentNames = goal.assignedStudents?.length
        ? goal.assignedStudents.map(uid => getStudentName(uid)).join(' ').toLowerCase()
        : (goal.studentUid ? getStudentName(goal.studentUid).toLowerCase() : '')
      
      return goal.goalTitle.toLowerCase().includes(query) ||
        goal.areaOfNeed.toLowerCase().includes(query) ||
        goal.goalText.toLowerCase().includes(query) ||
        studentNames.includes(query)
    })
  }

  return filtered
})

const activeGoals = computed(() => 
  goals.value.filter(goal => goal.isActive && !goal.isMet && !goal.isArchived)
)

const availableAssessments = computed(() => 
  assessments.value.filter(assessment => assessment.category === 'PA')
)

const filteredStudents = computed(() => {
  if (!studentSearchQuery.value) {
    return students.value
  }
  
  const query = studentSearchQuery.value.toLowerCase()
  return students.value.filter(student => 
    `${student.firstName} ${student.lastName}`.toLowerCase().includes(query) ||
    student.email?.toLowerCase().includes(query) ||
    student.seisId?.toLowerCase().includes(query)
  )
})

// Methods
const loadData = async () => {
  try {
    loading.value = true
    
    // Load based on user role
    if (authStore.isAdmin) {
      const [goalsData, studentsData, assessmentsData] = await Promise.all([
        getAllGoals(),
        getAllStudents(),
        getAllAssessments()
      ])
      goals.value = goalsData
      students.value = studentsData
      assessments.value = assessmentsData
    } else {
      // Teachers see only their goals and students
      const [goalsData, studentsData, assessmentsData] = await Promise.all([
        getGoalsByTeacher(authStore.currentUser!.uid),
        getStudentsByTeacher(authStore.currentUser!.uid),
        getAssessmentsByTeacher(authStore.currentUser!.uid) // Filter by teacher
      ])
      goals.value = goalsData
      students.value = studentsData
      assessments.value = assessmentsData
    }
    
    // Load student assignments efficiently (bulk query)
    await loadStudentAssignments()
  } catch (error) {
    console.error('Error loading data:', error)
  } finally {
    loading.value = false
  }
}

const loadStudentAssignments = async () => {
  try {
    if (students.value.length === 0) {
      studentAssignments.value = {}
      return
    }
    
    // Use bulk query instead of N+1 queries
    const studentUids = students.value.map(s => s.uid)
    const teacherUid = authStore.isAdmin ? undefined : authStore.currentUser!.uid
    
    const assignmentsByStudent = await getAssignmentsForStudents(studentUids, teacherUid)
    
    // Convert to the format expected by the component (just assessment IDs)
    const assignments: Record<string, string[]> = {}
    for (const studentUid in assignmentsByStudent) {
      assignments[studentUid] = assignmentsByStudent[studentUid].map(a => a.assessmentId)
    }
    
    studentAssignments.value = assignments
  } catch (error) {
    console.error('Error loading student assignments:', error)
    // Fallback to empty assignments if bulk query fails
    studentAssignments.value = {}
  }
}

const isAssessmentAssignedToStudent = (assessmentId: string, studentUid: string): boolean => {
  return studentAssignments.value[studentUid]?.includes(assessmentId) || false
}

const filterGoals = () => {
  // Triggers computed property update
}

const getStudentName = (studentUid: string) => {
  const student = students.value.find(s => s.uid === studentUid)
  return student ? `${student.firstName} ${student.lastName}` : 'Unknown Student'
}

const updateStudentSelection = () => {
  // This is called when checkboxes change - just to trigger reactivity
}

const removeStudent = (studentUid: string) => {
  const index = goalForm.assignedStudents.indexOf(studentUid)
  if (index > -1) {
    goalForm.assignedStudents.splice(index, 1)
  }
}

const getAssessmentTitle = (assessmentId: string) => {
  const assessment = assessments.value.find(a => a.id === assessmentId)
  return assessment ? assessment.title : 'Unknown Assessment'
}

const formatDate = (dateString: string) => {
  if (!dateString) return 'Not set'
  return new Date(dateString).toLocaleDateString()
}

// Goal CRUD operations
const resetGoalForm = () => {
  Object.assign(goalForm, {
    goalTitle: '',
    assignedStudents: [],
    areaOfNeed: '',
    baseline: '',
    goalText: '',
    startDate: '',
    personResponsible: '',
    gradeLevel: undefined,
    standard: '',
    purposeOfGoal: '',
    assignedAssessments: []
  })
  studentSearchQuery.value = ''
  showStudentDropdown.value = false
}

const editGoal = (goal: Goal) => {
  editingGoal.value = goal
  Object.assign(goalForm, {
    goalTitle: goal.goalTitle,
    assignedStudents: goal.assignedStudents || (goal.studentUid ? [goal.studentUid] : []),
    areaOfNeed: goal.areaOfNeed,
    baseline: goal.baseline,
    goalText: goal.goalText,
    startDate: goal.startDate || '',
    personResponsible: goal.personResponsible || '',
    gradeLevel: goal.gradeLevel || undefined,
    standard: goal.standard || '',
    purposeOfGoal: goal.purposeOfGoal || '',
    assignedAssessments: goal.assignedAssessments || []
  })
  studentSearchQuery.value = ''
  showStudentDropdown.value = false
  showEditGoalModal.value = true
}

const saveGoal = async () => {
  try {
    saving.value = true
    
    const goalData = {
      goalTitle: goalForm.goalTitle,
      assignedStudents: goalForm.assignedStudents,
      areaOfNeed: goalForm.areaOfNeed,
      baseline: goalForm.baseline,
      goalText: goalForm.goalText,
      startDate: goalForm.startDate,
      personResponsible: goalForm.personResponsible,
      gradeLevel: goalForm.gradeLevel,
      standard: goalForm.standard,
      purposeOfGoal: goalForm.purposeOfGoal,
      assignedAssessments: goalForm.assignedAssessments,
      isActive: true,
      isMet: false,
      isArchived: false,
      createdBy: authStore.currentUser!.uid
    }
    
    if (showEditGoalModal.value && editingGoal.value) {
      await updateGoal(editingGoal.value.id, goalData)
    } else {
      await createGoal(goalData)
    }
    
    await loadData()
    closeModals()
  } catch (error) {
    console.error('Error saving goal:', error)
    alert('Error saving goal. Please try again.')
  } finally {
    saving.value = false
  }
}

const markGoalAsMet = async (goalId: string) => {
  if (confirm('Mark this goal as met? This will deactivate the goal.')) {
    try {
      await markGoalAsMetService(goalId)
      await loadData()
    } catch (error) {
      console.error('Error marking goal as met:', error)
      alert('Error updating goal. Please try again.')
    }
  }
}

const archiveGoal = async (goalId: string) => {
  if (confirm('Archive this goal? This will deactivate the goal but keep it for records.')) {
    try {
      await archiveGoalService(goalId)
      await loadData()
    } catch (error) {
      console.error('Error archiving goal:', error)
      alert('Error archiving goal. Please try again.')
    }
  }
}

const reactivateGoal = async (goalId: string) => {
  if (confirm('Reactivate this goal? This will make it active again.')) {
    try {
      await reactivateGoalService(goalId)
      await loadData()
    } catch (error) {
      console.error('Error reactivating goal:', error)
      alert('Error reactivating goal. Please try again.')
    }
  }
}

const deleteGoal = async (goalId: string) => {
  if (confirm('Delete this goal permanently? This action cannot be undone.')) {
    try {
      await deleteGoalService(goalId)
      await loadData()
    } catch (error) {
      console.error('Error deleting goal:', error)
      alert('Error deleting goal. Please try again.')
    }
  }
}

// Assessment-Goal connections
const assignAssessmentToGoal = async (goalId: string, assessmentId: string) => {
  if (!assessmentId) return
  
  try {
    await assignAssessmentService(goalId, assessmentId)
    
    // Update local state without reloading
    const goal = goals.value.find(g => g.id === goalId)
    if (goal) {
      if (!goal.assignedAssessments) {
        goal.assignedAssessments = []
      }
      if (!goal.assignedAssessments.includes(assessmentId)) {
        goal.assignedAssessments.push(assessmentId)
      }
    }
    
    selectedAssessmentForGoal.value[goalId] = ''
    alert('✅ Assessment assigned to goal successfully')
  } catch (error) {
    console.error('Error assigning assessment to goal:', error)
    alert('Error assigning assessment. Please try again.')
  }
}

const removeAssessmentFromGoal = async (goalId: string, assessmentId: string) => {
  if (confirm('Remove this assessment from the goal? This will also remove it from all students assigned to this goal.')) {
    try {
      await removeAssessmentService(goalId, assessmentId)
      
      // Update local state without reloading
      const goal = goals.value.find(g => g.id === goalId)
      if (goal && goal.assignedAssessments) {
        goal.assignedAssessments = goal.assignedAssessments.filter(id => id !== assessmentId)
      }
      
      // Remove from student assignments local state
      const goalStudents = goal?.assignedStudents || []
      const goalStudentUid = goal?.studentUid
      const allStudentUids = [...goalStudents]
      if (goalStudentUid && !allStudentUids.includes(goalStudentUid)) {
        allStudentUids.push(goalStudentUid)
      }
      
      // Remove assessment from each student's assignment list
      allStudentUids.forEach(studentUid => {
        if (studentAssignments.value[studentUid]) {
          studentAssignments.value[studentUid] = studentAssignments.value[studentUid].filter(
            id => id !== assessmentId
          )
        }
      })
      
      alert('✅ Assessment removed from goal and all student assignments successfully')
    } catch (error) {
      console.error('Error removing assessment from goal:', error)
      alert('Error removing assessment. Please try again.')
    }
  }
}

const createAssessmentForGoal = (goalId: string) => {
  const goal = goals.value.find(g => g.id === goalId)
  if (goal) {
    assessmentForm.goalId = goalId
    assessmentForm.title = `${goal.goalTitle} - Progress Assessment`
    assessmentForm.gradeLevel = goal.gradeLevel ?? undefined
    showCreateAssessmentModal.value = true
  }
}

const assignAssessmentToStudent = async (assessmentId: string, studentUid: string, goalId: string) => {
  try {
    await assignToStudent(assessmentId, studentUid, authStore.currentUser!.uid)
    
    // Update local state
    if (!studentAssignments.value[studentUid]) {
      studentAssignments.value[studentUid] = []
    }
    if (!studentAssignments.value[studentUid].includes(assessmentId)) {
      studentAssignments.value[studentUid].push(assessmentId)
    }
    
    alert(`Assessment assigned to ${getStudentName(studentUid)} successfully!`)
  } catch (error) {
    console.error('Error assigning assessment to student:', error)
    alert('Error assigning assessment. Please try again.')
  }
}

const assignAllAssessmentsToAllStudents = async (goal: Goal) => {
  if (!goal.assignedAssessments?.length) {
    alert('No assessments to assign.')
    return
  }
  
  const studentList = goal.assignedStudents?.length 
    ? goal.assignedStudents 
    : (goal.studentUid ? [goal.studentUid] : [])
  
  if (!studentList.length) {
    alert('No students assigned to this goal.')
    return
  }
  
  const assessmentCount = goal.assignedAssessments.length
  const studentCount = studentList.length
  const totalAssignments = assessmentCount * studentCount
  
  if (!confirm(`Assign all ${assessmentCount} assessment(s) to all ${studentCount} student(s)?\n\nThis will create ${totalAssignments} total assignment(s).`)) {
    return
  }
  
  try {
    saving.value = true
    let successCount = 0
    let skipCount = 0
    
    for (const assessmentId of goal.assignedAssessments) {
      for (const studentUid of studentList) {
        // Skip if already assigned
        if (studentAssignments.value[studentUid]?.includes(assessmentId)) {
          skipCount++
          continue
        }
        
        await assignToStudent(assessmentId, studentUid, authStore.currentUser!.uid)
        
        // Update local state
        if (!studentAssignments.value[studentUid]) {
          studentAssignments.value[studentUid] = []
        }
        studentAssignments.value[studentUid].push(assessmentId)
        successCount++
      }
    }
    
    alert(`✅ Successfully assigned ${successCount} assessment(s)!\n${skipCount > 0 ? `⏭️ Skipped ${skipCount} (already assigned)` : ''}`)
  } catch (error) {
    console.error('Error bulk assigning assessments:', error)
    alert('Error assigning assessments. Some may have been assigned successfully.')
  } finally {
    saving.value = false
  }
}

// Preview state
const showAssessmentPreview = ref(false)
const previewAssessments = ref<Array<{
  title: string
  description: string
  questions: PreviewQuestion[]
  totalPoints: number
}>>([])

const showSingleQuestionPreview = ref(false)
const singlePreviewQuestion = ref<PreviewQuestion | null>(null)
const isGeneratingRemaining = ref(false)
const isGenerating = ref(false)
const currentGoalForGeneration = ref<Goal | null>(null)
const previewGoal = ref<Goal | null>(null)
const generationMethod = ref<'template' | 'ai-gemini' | 'hybrid'>('hybrid')
const geminiApiKey = ref('')
const showConfirmationPreview = ref(false)
const generatedAssessmentsForPreview = ref<Array<{
  title: string
  description: string
  questions: PreviewQuestion[]
  totalPoints: number
}>>([])

const isTeacher = computed(() => authStore.currentUser?.role === 'teacher')
const isAdmin = computed(() => authStore.currentUser?.role === 'admin')

const generateAssessmentsForGoal = async (goalId: string) => {
  console.log('generateAssessmentsForGoal called with goalId:', goalId)
  const goal = goals.value.find(g => g.id === goalId)
  if (!goal) {
    console.error('Goal not found:', goalId)
    alert('Goal not found. Please refresh the page and try again.')
    return
  }
  
  console.log('Found goal:', goal.goalTitle)
  try {
    isGenerating.value = true
    currentGoalForGeneration.value = goal
    console.log('Calling generateProofreadQuestion...')
    await generateProofreadQuestion(goal)
    console.log('generateProofreadQuestion completed')
  } catch (error) {
    console.error('Error generating proofread question:', error)
    alert(`Failed to generate a preview question: ${error instanceof Error ? error.message : 'Unknown error'}`)
  } finally {
    isGenerating.value = false
  }
}

const confirmCreateAssessments = async (assessmentsToCreate?: Array<{
  title: string
  description: string
  questions: PreviewQuestion[]
  totalPoints: number
}>) => {
  const assessments = assessmentsToCreate || previewAssessments.value
  const goal = currentGoalForGeneration.value || previewGoal.value
  if (!assessments || assessments.length === 0 || !goal) return
  
  try {
    saving.value = true
    const createdAssessments: string[] = []
    
    for (const preview of assessments) {
            // Clean up questions: remove preview-only fields and ensure acceptableAnswers is set
            const cleanedQuestions = preview.questions.map((q: PreviewQuestion): AssessmentQuestion => {
              // Update alternative answers from string if needed
              let acceptableAnswers = q.acceptableAnswers || []
              if (q.acceptableAnswersString) {
                acceptableAnswers = q.acceptableAnswersString
                  .split(',')
                  .map((a: string) => a.trim())
                  .filter((a: string) => a.length > 0)
              }
              
              // Log question type before saving
              console.log(`💾 Saving question with type: ${q.questionType}`, {
                questionId: q.id,
                questionType: q.questionType,
                questionPreview: q.questionText.substring(0, 100) + '...'
              })
              
              // Remove preview-only fields
              const { acceptableAnswersString, _source, _aiError, ...cleanQuestion } = q
              return {
                ...cleanQuestion,
                acceptableAnswers
              }
            })
      
      const assessmentData = {
        title: preview.title,
        description: preview.description,
        gradeLevel: goal.gradeLevel ?? 7,
        category: 'PA' as const,
        goalId: goal.id,
        createdBy: authStore.currentUser!.uid,
        questions: cleanedQuestions,
        totalPoints: preview.totalPoints,
        instructions: 'Answer each question to the best of your ability. Show your work for all math problems.',
        accommodations: [],
        allowFileUpload: true,
        requireFileUpload: true,
        fileUploadInstructions: 'Upload photos of your work for all questions that require it. Make sure your work is clear and legible.',
        allowRetakes: false,
        maxRetakes: 0,
        retakeMode: 'separate' as const,
        retakeInstructions: ''
      }
      
      const assessmentId = await createAssessment(assessmentData)
      await assignAssessmentService(goal.id, assessmentId)
      createdAssessments.push(assessmentId)
    }
    
    showAssessmentPreview.value = false
    previewAssessments.value = []
    previewGoal.value = null
    
    alert(`✅ Successfully created ${createdAssessments.length} assessments with 5 questions each!\n\nEach assessment has:\n• 5 questions with answers\n• 5 points total (1 point per question)\n\nYou can now assign them to students or edit the questions.`)
    await loadData()
  } catch (error) {
    console.error('Error creating assessments:', error)
    alert('Error creating assessments. Please try again.')
  } finally {
    saving.value = false
  }
}

const cancelPreview = () => {
  showAssessmentPreview.value = false
  previewAssessments.value = []
  previewGoal.value = null
}

// Update alternative answers from comma-separated string
const updateAlternativeAnswers = (assessment: { questions: PreviewQuestion[] }, qIndex: number) => {
  const question = assessment.questions[qIndex]
  if (question.acceptableAnswersString) {
    question.acceptableAnswers = question.acceptableAnswersString
      .split(',')
      .map((a: string) => a.trim())
      .filter((a: string) => a.length > 0)
  } else {
    question.acceptableAnswers = []
  }
}

// Regenerate remaining questions based on edited question
const regenerateRemainingQuestions = async (assessmentIndex: number, editedQuestionIndex: number) => {
  const assessment = previewAssessments.value[assessmentIndex]
  const editedQuestion = assessment.questions[editedQuestionIndex]
  
  if (!previewGoal.value) return
  
  try {
    saving.value = true
    
    // Use the edited question as a reference for generating the remaining questions
    const remainingIndices = assessment.questions
      .map((_, i) => i)
      .filter(i => i !== editedQuestionIndex)
    
    for (const qIndex of remainingIndices) {
      const questionData = await generateQuestionForGoal(
        previewGoal.value,
        qIndex + 1,
        { 
          method: 'hybrid',
          referenceQuestion: {
            question: editedQuestion.questionText,
            answer: editedQuestion.correctAnswer,
            explanation: editedQuestion.explanation,
            alternativeAnswers: editedQuestion.acceptableAnswers || []
          }
        } as any
      )
      
      // Update the question but keep any manual edits
      assessment.questions[qIndex] = {
        ...assessment.questions[qIndex],
        questionText: questionData.question,
        correctAnswer: questionData.answer,
        acceptableAnswers: questionData.alternativeAnswers || [],
        acceptableAnswersString: (questionData.alternativeAnswers || []).join(', '),
        explanation: questionData.explanation || assessment.questions[qIndex].explanation,
        _source: questionData.source,
        _aiError: questionData.aiError
      } as PreviewQuestion
    }
    
    alert('✅ Remaining questions regenerated based on your edits!')
  } catch (error) {
    console.error('Error regenerating questions:', error)
    alert('Error regenerating questions. Please try again.')
  } finally {
    saving.value = false
  }
}

const generateAssessmentDescription = (goal: Goal, subject: 'math' | 'ela' | 'other'): string => {
  // Generate a clean, concise description without accuracy metrics or trial counts
  const goalText = goal.goalText.toLowerCase()
  const areaOfNeed = goal.areaOfNeed
  
  if (subject === 'math') {
    if (goalText.includes('evaluate') && (goalText.includes('expression') || goalText.includes('input value'))) {
      return 'This assessment measures the ability to evaluate algebraic expressions by substituting values for variables.'
    } else if (goalText.includes('solve') && goalText.includes('equation')) {
      if (goalText.includes('multi-step')) {
        return 'This assessment measures the ability to solve multi-step linear equations.'
      } else if (goalText.includes('two-step')) {
        return 'This assessment measures the ability to solve two-step linear equations.'
      }
      return 'This assessment measures the ability to solve linear equations.'
    } else if (goalText.includes('fraction')) {
      return 'This assessment measures fraction skills including operations, comparisons, and problem-solving.'
    } else if (goalText.includes('multiplication') || goalText.includes('division')) {
      return 'This assessment measures multiplication and division skills with multi-digit numbers.'
    } else if (goalText.includes('addition') || goalText.includes('subtraction')) {
      return 'This assessment measures addition and subtraction skills, including regrouping.'
    } else if (goalText.includes('word problem')) {
      return 'This assessment measures the ability to solve mathematical word problems.'
    }
    return `This assessment measures skills in ${areaOfNeed}.`
  } else if (subject === 'ela') {
    if (goalText.includes('reading comprehension') || goalText.includes('main idea')) {
      return 'This assessment measures reading comprehension and the ability to identify main ideas and supporting details.'
    } else if (goalText.includes('inference')) {
      return 'This assessment measures the ability to make inferences from text using evidence.'
    } else if (goalText.includes('writing') || goalText.includes('paragraph')) {
      return 'This assessment measures writing skills, including paragraph structure and organization.'
    } else if (goalText.includes('vocabulary')) {
      return 'This assessment measures vocabulary knowledge and word usage.'
    }
    return `This assessment measures skills in ${areaOfNeed}.`
  }
  
  return `This assessment measures progress toward the IEP goal in ${areaOfNeed}.`
}

// Generate questions for goal using the new service
// Helper function to detect if a question should use algebra tiles
const detectQuestionType = (questionText: string): 'short-answer' | 'algebra-tiles' => {
  const text = questionText.toLowerCase()
  // Check for algebra tiles keywords (more comprehensive matching)
  const algebraTilePatterns = [
    'algebra tile',
    'algebra tiles',
    'use the algebra tile',
    'use algebra tile',
    'use algebra tiles',
    'draw on the image',
    'shown in the image',
    'shown in image',
    'evaluate.*algebra tile',
    'evaluate.*using.*tile'
  ]
  
  // Check if any pattern matches
  for (const pattern of algebraTilePatterns) {
    if (text.includes(pattern) || new RegExp(pattern).test(text)) {
      console.log(`🔍 Detected algebra tiles question based on pattern: "${pattern}"`)
      return 'algebra-tiles'
    }
  }
  
  return 'short-answer'
}

const generateQuestionsForGoal = async (goal: Goal, approvedQuestion: PreviewQuestion) => {
  const numberOfQuestions = 5
  const assessments: { title: string; description: string; questions: PreviewQuestion[], totalPoints: number }[] = []

  for (let i = 1; i <= 3; i++) {
    const questions: PreviewQuestion[] = []
    
    // Use the approved question as the first question of the first assessment
    if (i === 1) {
      questions.push({
        ...approvedQuestion,
        id: 'q1' // Ensure it has the correct ID for first question
      })
      // Generate remaining questions
      for (let j = 2; j <= numberOfQuestions; j++) {
        const questionData = await generateQuestionForGoal(goal, j, {
          method: generationMethod.value,
          geminiApiKey: geminiApiKey.value
        })
        const altAnswers = questionData.alternativeAnswers || []
        const questionType = detectQuestionType(questionData.question)
        console.log(`📝 Assessment 1, Question ${j} - Type: ${questionType}`, {
          questionPreview: questionData.question.substring(0, 100) + '...',
          questionType
        })
        questions.push({
          id: `q${j}`,
          questionText: questionData.question,
          questionType: questionType,
          points: 1,
          correctAnswer: questionData.answer,
          acceptableAnswers: altAnswers,
          acceptableAnswersString: altAnswers.join(', '),
          _source: questionData.source,
          _aiError: questionData.aiError
        } as PreviewQuestion)
      }
    } else {
      // Generate questions for other assessments
      for (let j = 1; j <= numberOfQuestions; j++) {
        const questionData = await generateQuestionForGoal(goal, j, {
          method: generationMethod.value,
          geminiApiKey: geminiApiKey.value
        })
        const altAnswers = questionData.alternativeAnswers || []
        const questionType = detectQuestionType(questionData.question)
        console.log(`📝 Assessment ${i}, Question ${j} - Type: ${questionType}`, {
          questionPreview: questionData.question.substring(0, 100) + '...',
          questionType
        })
        questions.push({
          id: `q${j}`,
          questionText: questionData.question,
          questionType: questionType,
          points: 1,
          correctAnswer: questionData.answer,
          acceptableAnswers: altAnswers,
          acceptableAnswersString: altAnswers.join(', '),
          _source: questionData.source,
          _aiError: questionData.aiError
        } as PreviewQuestion)
      }
    }

    assessments.push({
      title: `${goal.goalTitle} - Check #${i}`,
      description: generateAssessmentDescription(goal, getSubjectArea(goal)),
      questions: questions,
      totalPoints: questions.reduce((sum, q) => sum + q.points, 0)
    })
  }

  return assessments
}

const generateProofreadQuestion = async (goal: Goal) => {
  console.log('generateProofreadQuestion called for goal:', goal.goalTitle)
  isGenerating.value = true
  singlePreviewQuestion.value = null
  
  try {
    console.log('Calling generateQuestionForGoal with method:', generationMethod.value)
    const questionData = await generateQuestionForGoal(goal, 1, {
      method: generationMethod.value,
      geminiApiKey: geminiApiKey.value
    }) // Generate only 1 question
    
    console.log('Question data received:', questionData)
    const altAnswers = questionData.alternativeAnswers || []
    const questionType = detectQuestionType(questionData.question)
    console.log(`🔍 Proofread Question Detection - Type: ${questionType}`, {
      questionPreview: questionData.question.substring(0, 150) + '...',
      questionType,
      detectedPattern: questionData.question.toLowerCase().includes('algebra tile') ? 'algebra tile found' : 'no match'
    })
    singlePreviewQuestion.value = {
      id: `q1`, // Temporary ID for preview
      questionText: questionData.question,
      questionType: questionType,
      points: 1, // Defaulting to 1 point
      correctAnswer: questionData.answer,
      acceptableAnswers: altAnswers,
      acceptableAnswersString: altAnswers.join(', '),
      _source: questionData.source,
      _aiError: questionData.aiError
    } as PreviewQuestion
    
    console.log('Setting showSingleQuestionPreview to true')
    showSingleQuestionPreview.value = true
    console.log('Modal should now be visible')
  } catch (error) {
    console.error('Failed to generate single question', error)
    alert(error instanceof Error ? error.message : 'An unknown error occurred.')
  } finally {
    isGenerating.value = false
  }
}

const handleApproval = async () => {
  if (!currentGoalForGeneration.value || !singlePreviewQuestion.value) return
  
  // Generate the assessments and show preview for confirmation
  showSingleQuestionPreview.value = false
  isGeneratingRemaining.value = true
  
  try {
    const generatedAssessments = await generateQuestionsForGoal(currentGoalForGeneration.value, singlePreviewQuestion.value)
    generatedAssessmentsForPreview.value = generatedAssessments
    isGeneratingRemaining.value = false
    showConfirmationPreview.value = true
  } catch (error) {
    console.error('Error generating assessments:', error)
    alert('Failed to generate assessments.')
    isGeneratingRemaining.value = false
  }
}

const confirmAndCreateAssessments = async () => {
  if (!generatedAssessmentsForPreview.value || generatedAssessmentsForPreview.value.length === 0) return
  
  try {
    isGeneratingRemaining.value = true
    await confirmCreateAssessments(generatedAssessmentsForPreview.value)
    showConfirmationPreview.value = false
    generatedAssessmentsForPreview.value = []
    currentGoalForGeneration.value = null
    alert('Successfully created assessments!')
  } catch (error) {
    console.error('Error creating assessments:', error)
    alert('Failed to create assessments.')
  } finally {
    isGeneratingRemaining.value = false
  }
}

const cancelConfirmationPreview = () => {
  showConfirmationPreview.value = false
  generatedAssessmentsForPreview.value = []
  currentGoalForGeneration.value = null
}

const createProgressAssessment = async () => {
  try {
    saving.value = true
    
    const assessmentData = {
      title: assessmentForm.title,
      description: assessmentForm.description || '',
      gradeLevel: assessmentForm.gradeLevel ?? 7,
      category: 'PA' as const,
      goalId: assessmentForm.goalId || '',
      createdBy: authStore.currentUser!.uid,
      questions: [],
      totalPoints: 0,
      instructions: 'Complete all questions to the best of your ability.',
      accommodations: []
    }
    
    const assessmentId = await createAssessment(assessmentData)
    
    // If connected to a goal, assign it
    if (assessmentForm.goalId) {
      await assignAssessmentService(assessmentForm.goalId, assessmentId)
    }
    
    // Navigate to assessment editor
    router.push(`/assessment/edit/${assessmentId}`)
  } catch (error) {
    console.error('Error creating assessment:', error)
    alert('Error creating assessment. Please try again.')
  } finally {
    saving.value = false
  }
}

const closeModals = () => {
  showCreateGoalModal.value = false
  showEditGoalModal.value = false
  showCreateAssessmentModal.value = false
  editingGoal.value = null
  resetGoalForm()
  Object.assign(assessmentForm, {
    title: '',
    description: '',
    gradeLevel: undefined,
    goalId: ''
  })
}

// Lifecycle
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.goal-management {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.header-section {
  text-align: center;
  margin-bottom: 2rem;
}

.header-section h1 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #7f8c8d;
  margin-bottom: 1.5rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.filters-section {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 200px;
}

.filter-group label {
  font-weight: 600;
  color: #495057;
  font-size: 0.875rem;
}

.goals-section {
  min-height: 400px;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #6c757d;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e9ecef;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #6c757d;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.goals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
  gap: 1.5rem;
}

.goal-card {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.goal-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;
}

.goal-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.25rem;
  line-height: 1.3;
}

.goal-status {
  flex-shrink: 0;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
}

.status-badge.active {
  background: #d4edda;
  color: #155724;
}

.status-badge.met {
  background: #d1ecf1;
  color: #0c5460;
}

.status-badge.archived {
  background: #fff3cd;
  color: #856404;
}

.status-badge.inactive {
  background: #f8d7da;
  color: #721c24;
}

.goal-details {
  margin-bottom: 1.5rem;
}

.detail-row {
  display: flex;
  margin-bottom: 0.5rem;
  gap: 0.5rem;
}

.detail-row strong {
  min-width: 100px;
  color: #495057;
  font-size: 0.875rem;
}

.detail-row span {
  flex: 1;
  color: #6c757d;
  font-size: 0.875rem;
}

.no-students-assigned {
  color: #6c757d;
  font-style: italic;
}

/* Student Selector Styles */
.student-selector {
  position: relative;
}

.student-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  max-height: 400px;
  overflow-y: auto;
  z-index: 1000;
  margin-top: 0.25rem;
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #dee2e6;
  background: #f8f9fa;
  font-weight: 600;
  color: #495057;
  font-size: 0.875rem;
}

.btn-close-dropdown {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #6c757d;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.btn-close-dropdown:hover {
  background: #e9ecef;
  color: #495057;
}

.no-students {
  padding: 2rem;
  text-align: center;
  color: #6c757d;
  font-style: italic;
}

.student-list {
  padding: 0.5rem 0;
}

.student-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background 0.2s;
  gap: 0.75rem;
}

.student-item:hover {
  background: #f8f9fa;
}

.student-item input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  flex-shrink: 0;
}

.student-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  flex: 1;
}

.student-info strong {
  color: #2c3e50;
  font-size: 0.9rem;
}

.student-info small {
  color: #6c757d;
  font-size: 0.75rem;
  margin-right: 0.5rem;
}

.selected-students {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
}

.selected-students h4 {
  margin: 0 0 0.75rem 0;
  color: #495057;
  font-size: 0.9rem;
}

.selected-student-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.student-tag {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 20px;
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  color: #495057;
}

.student-tag span {
  font-weight: 500;
}

.btn-remove-student {
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
  padding: 0;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 0.875rem;
  line-height: 1;
}

.btn-remove-student:hover {
  background: #dc3545;
  color: white;
}

.full-width {
  grid-column: 1 / -1;
}

.assessments-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.assessments-section h4 {
  margin: 0 0 1rem 0;
  color: #495057;
  font-size: 1rem;
}

.assessment-list {
  margin-bottom: 1rem;
}

.assessment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: white;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.assessment-item-expanded {
  padding: 1rem;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  margin-bottom: 1rem;
}

.assessment-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e9ecef;
}

.assessment-title {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
}

.student-assignment-status {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.student-assignment-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.student-name-small {
  font-size: 0.85rem;
  color: #495057;
  font-weight: 500;
}

.status-assigned {
  font-size: 0.75rem;
  color: #28a745;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  background: #d4edda;
  border-radius: 4px;
}

.btn-xs {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.no-assessments {
  text-align: center;
  color: #6c757d;
  font-style: italic;
  margin-bottom: 1rem;
}

.assessment-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.assessment-actions .form-select {
  flex: 1;
}

.goal-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
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
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #dee2e6;
}

.modal-header h2 {
  margin: 0;
  color: #2c3e50;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6c757d;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.btn-close:hover {
  background: #f8f9fa;
  color: #495057;
}

.goal-form,
.assessment-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #495057;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-select-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #dee2e6;
}

/* Button Styles */
.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
  transform: translateY(-1px);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #545b62;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #1e7e34;
}

.btn-warning {
  background: #ffc107;
  color: #212529;
}

.btn-warning:hover:not(:disabled) {
  background: #e0a800;
}

.btn-info {
  background: #17a2b8;
  color: white;
}

.btn-info:hover:not(:disabled) {
  background: #117a8b;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.icon {
  font-size: 1.1em;
}

/* Preview Modal Styles */
.preview-modal {
  max-width: 900px;
  max-height: 95vh;
}

.preview-content {
  padding: 1.5rem;
  overflow-y: auto;
  max-height: calc(95vh - 120px);
}

.preview-info {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.preview-info p {
  margin: 0.5rem 0;
}

.preview-note {
  background: #e7f3ff;
  padding: 0.75rem;
  border-radius: 6px;
  border-left: 4px solid #007bff;
  margin-top: 1rem;
}

.assessments-preview {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.assessment-preview-card {
  border: 2px solid #e9ecef;
  border-radius: 8px;
  padding: 1.5rem;
  background: #fff;
}

.preview-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #e9ecef;
}

.preview-card-header h3 {
  margin: 0;
  color: #2c3e50;
}

.points-badge {
  background: #007bff;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.875rem;
}

.preview-description {
  margin-bottom: 1rem;
  color: #6c757d;
}

.questions-preview {
  margin-top: 1rem;
}

.questions-preview h4 {
  margin-bottom: 1rem;
  color: #495057;
}

.question-preview-item {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
}

.question-number {
  background: #007bff;
  color: white;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
}

.question-content-preview {
  flex: 1;
}

.question-text-preview,
.answer-preview,
.explanation-preview {
  margin-bottom: 0.75rem;
}

.question-text-preview strong,
.answer-preview strong,
.explanation-preview strong {
  display: block;
  margin-bottom: 0.25rem;
  color: #495057;
}

.question-text-preview pre,
.answer-preview pre,
.explanation-preview pre {
  background: white;
  padding: 0.75rem;
  border-radius: 4px;
  border: 1px solid #dee2e6;
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
  font-family: inherit;
  font-size: 0.9rem;
  line-height: 1.5;
}

.question-meta-preview {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.meta-tag {
  background: #e9ecef;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #495057;
  margin-right: 4px;
  display: inline-block;
}

.meta-tag.requires-photo {
  background: #fff3cd;
  color: #856404;
}

.meta-tag.warning {
  background: #fff3cd;
  color: #856404;
}

.meta-tag.success {
  background: #d4edda;
  color: #155724;
}

.meta-tag.info {
  background: #d1ecf1;
  color: #0c5460;
}

.editable-textarea,
.editable-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
  font-size: 0.9rem;
  margin-top: 4px;
}

.editable-textarea {
  resize: vertical;
  min-height: 60px;
}

.editable-input {
  height: 36px;
}

.editable-textarea:focus,
.editable-input:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
}

.alternative-answers-preview {
  margin-top: 12px;
}

.alternative-answers-preview .help-text {
  display: block;
  margin-top: 4px;
  color: #666;
  font-size: 0.85rem;
}

.regenerate-btn {
  margin-left: 8px;
  padding: 4px 8px;
  font-size: 0.85rem;
}

.question-meta-preview {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
}

.preview-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 2px solid #e9ecef;
}

/* Responsive Design */
@media (max-width: 768px) {
  .goal-management {
    padding: 1rem;
  }
  
  .goals-grid {
    grid-template-columns: 1fr;
  }
  
  .filters-section {
    flex-direction: column;
  }
  
  .filter-group {
    min-width: auto;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .preview-modal {
    max-width: 95vw;
  }
  
  .goal-actions {
    justify-content: center;
  }
  
  .assessment-actions {
    flex-direction: column;
  }
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1060; /* Higher than modal */
}

.editable-input,
.editable-textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
  font-size: 0.9rem;
  margin-top: 4px;
}

.editable-textarea {
  resize: vertical;
  min-height: 60px;
}

.editable-input {
  height: 36px;
}

.editable-textarea:focus,
.editable-input:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
}

.alternative-answers-preview {
  margin-top: 12px;
}

.alternative-answers-preview .help-text {
  display: block;
  margin-top: 4px;
  color: #666;
  font-size: 0.85rem;
}

.regenerate-btn {
  margin-left: 8px;
  padding: 4px 8px;
  font-size: 0.85rem;
}

.question-meta-preview {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
}

.preview-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 2px solid #e9ecef;
}

/* Proofread Modal Styles */
.proofread-question-container {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid #e9ecef;
}

.proofread-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #dee2e6;
}

.source-badges {
  display: flex;
  gap: 0.5rem;
}

.source-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
  white-space: nowrap;
}

.source-badge.warning {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffc107;
}

.source-badge.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #28a745;
}

.source-badge.info {
  background-color: #d1ecf1;
  color: #0c5460;
  border: 1px solid #17a2b8;
}

.proofread-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-field {
  display: flex;
  flex-direction: column;
}

.form-label {
  font-weight: 600;
  color: #495057;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.proofread-input,
.proofread-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #dee2e6;
  border-radius: 6px;
  font-size: 1rem;
  font-family: inherit;
  transition: all 0.2s ease;
  background-color: white;
}

.proofread-textarea {
  resize: vertical;
  min-height: 100px;
  line-height: 1.5;
}

.proofread-input:focus,
.proofread-textarea:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.proofread-input::placeholder,
.proofread-textarea::placeholder {
  color: #adb5bd;
}

.form-row-proofread {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-hint {
  display: block;
  margin-top: 0.375rem;
  color: #6c757d;
  font-size: 0.875rem;
  font-style: italic;
}

.proofread-btn {
  padding: 0.625rem 1.25rem;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.95rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.proofread-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.regenerate-btn {
  background-color: #6c757d;
  color: white;
}

.regenerate-btn:hover:not(:disabled) {
  background-color: #5a6268;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.cancel-btn {
  background-color: #6c757d;
  color: white;
}

.cancel-btn:hover {
  background-color: #5a6268;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.approve-btn {
  background-color: #28a745;
  color: white;
  font-weight: 600;
}

.approve-btn:hover:not(:disabled) {
  background-color: #218838;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(40, 167, 69, 0.3);
}

.approve-btn:disabled {
  background-color: #c6c6c6;
  color: #6c757d;
}

@media (max-width: 768px) {
  .form-row-proofread {
    grid-template-columns: 1fr;
  }
  
  .proofread-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .modal-footer {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .modal-footer > div {
    width: 100%;
    flex-direction: column;
  }
  
  .proofread-btn {
    width: 100%;
  }
}
</style>

