<template>
  <div class="assessment-editor">
    <div class="editor-header">
      <div class="header-content">
        <h1>{{ isEditing ? '✏️ Edit Assessment' : '📝 Create Assessment' }}</h1>
        <p>{{ isEditing ? 'Modify assessment details and questions' : 'Create a new assessment for your students' }}</p>
      </div>
      <div class="header-actions">
        <button @click="goBack" class="back-button">
          ← Back to Home
        </button>
      </div>
    </div>

    <form @submit.prevent="saveAssessment" class="assessment-form">
      <!-- Basic Information -->
      <div class="form-section">
        <h2>📋 Basic Information</h2>
        
        <div class="form-row">
          <div class="form-group">
            <label for="title">Assessment Title *</label>
            <input 
              id="title"
              v-model="assessment.title" 
              type="text" 
              required 
              class="form-input"
              placeholder="e.g., Fractions and Decimals Assessment"
            >
          </div>
          
          <div class="form-group full-width">
            <label>Overall Standard (optional)</label>
            <StandardSelector 
              v-model="selectedStandard"
              :grade="assessment.gradeLevel.toString()"
              @update:modelValue="updateAssessmentStandard"
            />
            <small class="form-help">You can set different standards for individual questions instead</small>
          </div>
        </div>

        <div class="form-group">
          <label for="description">Description *</label>
          <textarea 
            id="description"
            v-model="assessment.description" 
            required 
            class="form-textarea"
            rows="3"
            placeholder="Brief description of what this assessment covers..."
          ></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="gradeLevel">Grade Level *</label>
            <select id="gradeLevel" v-model="assessment.gradeLevel" required class="form-select">
              <option value="">Select Grade</option>
              <option v-for="grade in [6, 7, 8, 9, 10, 11, 12]" :key="grade" :value="grade">
                Grade {{ grade }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="category">Category *</label>
            <select id="category" v-model="assessment.category" required class="form-select" @change="onCategoryChange">
              <option value="">Select Category</option>
              <option value="HW">Home Work (HW)</option>
              <option value="Assign">Assignment (Assign)</option>
              <option value="ESA">Essential Standard (ESA)</option>
              <option value="SA">Standard Assessment (SA)</option>
              <option value="PA">Progress Assessment (PA)</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="timeLimit">Time Limit</label>
            <div class="time-limit-controls">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  v-model="noTimeLimit"
                  @change="toggleTimeLimit"
                >
                No time limit
              </label>
              <input 
                v-if="!noTimeLimit"
                id="timeLimit"
                v-model.number="assessment.timeLimit" 
                type="number" 
                class="form-input"
                min="1"
                max="180"
                placeholder="30"
              >
              <span v-if="!noTimeLimit" class="time-unit">minutes</span>
            </div>
          </div>
        </div>

        <!-- Goal Connection (for Progress Assessments) -->
        <div v-if="assessment.category === 'PA'" class="form-section goal-connection">
          <h3>🎯 Goal Connection</h3>
          <p class="section-description">Connect this progress assessment to an IEP goal for tracking student progress.</p>
          
          <div class="form-group">
            <label for="goalSelect">Connect to Goal</label>
            <select id="goalSelect" v-model="assessment.goalId" class="form-select">
              <option value="">No goal connection (standalone assessment)</option>
              <option v-for="goal in availableGoals" :key="goal.id" :value="goal.id">
                {{ goal.goalTitle }} - {{ goal.assignedStudents?.length > 0 ? goal.assignedStudents.map(uid => getStudentName(uid)).join(', ') : (goal.studentUid ? getStudentName(goal.studentUid) : 'No students') }} ({{ goal.areaOfNeed }})
              </option>
            </select>
            <small class="form-help">
              Progress assessments can be connected to IEP goals for automatic progress tracking.
              <router-link to="/goals" target="_blank">Manage Goals →</router-link>
            </small>
          </div>
          
          <div v-if="assessment.goalId" class="connected-goal-info">
            <div class="goal-card">
              <h4>📋 Connected Goal Details</h4>
              <div v-if="selectedGoalDetails" class="goal-details">
                <div class="detail-row">
                  <strong>Students:</strong> 
                  <span v-if="selectedGoalDetails.assignedStudents?.length">
                    {{ selectedGoalDetails.assignedStudents.map(uid => getStudentName(uid)).join(', ') }}
                  </span>
                  <span v-else-if="selectedGoalDetails.studentUid">
                    {{ getStudentName(selectedGoalDetails.studentUid) }}
                  </span>
                  <span v-else>
                    No students assigned
                  </span>
                </div>
                <div class="detail-row">
                  <strong>Area of Need:</strong> {{ selectedGoalDetails.areaOfNeed }}
                </div>
                <div class="detail-row">
                  <strong>Baseline:</strong> {{ selectedGoalDetails.baseline }}
                </div>
                <div class="detail-row">
                  <strong>Goal:</strong> {{ selectedGoalDetails.goalText }}
                </div>
                <div class="detail-row">
                  <strong>IEP Date:</strong> {{ formatDate(selectedGoalDetails.iepDate) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Assignment Dates -->
        <div class="form-row">
          <div class="form-group">
            <label for="assignDate">Assign Date</label>
            <input 
              id="assignDate"
              v-model="assignDateInput" 
              type="datetime-local" 
              class="form-input"
              @change="updateAssignDate"
            >
            <small class="form-help">When this assessment will be assigned to students</small>
          </div>
          
          <div class="form-group">
            <label for="dueDate">Due Date</label>
            <input 
              id="dueDate"
              v-model="dueDateInput" 
              type="datetime-local" 
              class="form-input"
              @change="updateDueDate"
            >
            <small class="form-help">When students should complete this assessment</small>
          </div>
        </div>

        <div class="form-group">
          <label for="instructions">Instructions for Students</label>
          <textarea 
            id="instructions"
            v-model="assessment.instructions" 
            class="form-textarea"
            rows="4"
            placeholder="Instructions that students will see before starting the assessment..."
          ></textarea>
        </div>
      </div>

      <!-- File Upload Settings -->
      <div class="form-section">
        <h2>📎 File Upload Settings</h2>
        
        <div class="form-group">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              v-model="assessment.allowFileUpload"
              @change="onFileUploadToggle"
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
              <small class="form-help">Default orientation for camera capture (students can still rotate if needed)</small>
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

      <!-- Retake Settings -->
      <div class="form-section">
        <h2>🔄 Retake Settings</h2>
        
        <div class="form-group">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              v-model="assessment.allowRetakes"
            >
            Allow students to retake this assessment
          </label>
        </div>

        <div v-if="assessment.allowRetakes" class="retake-options">
          <div class="form-row">
            <div class="form-group">
              <label for="maxRetakes">Maximum Retakes</label>
              <select id="maxRetakes" v-model="assessment.maxRetakes" class="form-select">
                <option :value="0">Unlimited</option>
                <option :value="1">1 retake</option>
                <option :value="2">2 retakes</option>
                <option :value="3">3 retakes</option>
                <option :value="5">5 retakes</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="retakeMode">Retake Mode</label>
              <select id="retakeMode" v-model="assessment.retakeMode" class="form-select">
                <option value="separate">Separate Attempts - Each retake creates new result</option>
                <option value="combined">Combined Attempts - All attempts in one result</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="retakeInstructions">Retake Instructions</label>
            <textarea 
              id="retakeInstructions"
              v-model="assessment.retakeInstructions"
              class="form-textarea"
              rows="2"
              placeholder="Instructions for students about retaking this assessment..."
            ></textarea>
          </div>

          <!-- Retake Preview -->
          <div class="retake-preview">
            <h4>🔄 Student Retake Interface Preview</h4>
            <div class="preview-card">
              <div class="preview-header">
                <span class="preview-icon">🔄</span>
                <span>Retake Available</span>
                <span class="retake-badge">{{ assessment.maxRetakes === 0 ? 'Unlimited' : `${assessment.maxRetakes} max` }}</span>
              </div>
              <div class="preview-content">
                <p>{{ assessment.retakeInstructions || 'You may retake this assessment to improve your score.' }}</p>
                <div class="preview-buttons">
                  <button type="button" class="preview-btn primary">🔄 Start Retake</button>
                  <button type="button" class="preview-btn">📊 View Previous Attempts</button>
                </div>
                <div class="preview-info">
                  <small>
                    Mode: {{ assessment.retakeMode === 'separate' ? 'Each attempt tracked separately' : 'All attempts combined in one result' }}
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Student Assignment -->
      <div class="form-section">
        <h2>👥 Student Assignment</h2>
        
        <div class="form-group">
          <label>Assign to Students</label>
          <div class="students-assignment">
            <!-- Loading state -->
            <div v-if="loadingStudents" class="students-loading">
              <div class="loading-spinner-small"></div>
              <span>Loading students...</span>
            </div>
            
            <!-- Assignment Mode Selection -->
            <div v-else-if="availableStudents.length > 0" class="assignment-modes">
              <div class="assignment-mode-selector">
                <label class="mode-option">
                  <input type="radio" v-model="assignmentMode" value="template" name="assignmentMode">
                  <span>📋 Create Template (No Students)</span>
                </label>
                <label class="mode-option">
                  <input type="radio" v-model="assignmentMode" value="all" name="assignmentMode">
                  <span>👥 Assign to All My Students</span>
                </label>
                <label class="mode-option">
                  <input type="radio" v-model="assignmentMode" value="class" name="assignmentMode">
                  <span>🏫 Assign by Class/Period</span>
                </label>
                <label class="mode-option">
                  <input type="radio" v-model="assignmentMode" value="individual" name="assignmentMode">
                  <span>👤 Select Individual Students</span>
                </label>
              </div>

              <!-- Quarter/Period Selection -->
              <div class="quarter-selection">
                <h4>📅 Academic Quarter</h4>
                <div class="form-group">
                  <label class="form-label">
                    Which quarter is this assessment for?
                    <span class="help-text">Controls when students can see this assessment</span>
                  </label>
                  <select v-model="selectedQuarter" class="form-select">
                    <option value="auto">🔄 Auto-Detect (Current Quarter)</option>
                    <option value="all">📚 All Year (No Quarter Restriction)</option>
                    <option value="q1">Q1 - Quarter 1 (Aug-Oct)</option>
                    <option value="q2">Q2 - Quarter 2 (Nov-Jan)</option>
                    <option value="q3">Q3 - Quarter 3 (Feb-Apr)</option>
                    <option value="q4">Q4 - Quarter 4 (May-Jul)</option>
                  </select>
                  <small class="form-help">
                    <strong>Quarterly:</strong> Students see only in specific quarter (ESAs, regular assignments)<br>
                    <strong>All Year:</strong> Students see anytime (diagnostics, tutoring, benchmarks)<br>
                    <strong>Auto-Detect:</strong> Uses current quarter automatically
                  </small>
                </div>
              </div>

              <!-- Class Selection (when mode is 'class') -->
              <div v-if="assignmentMode === 'class'" class="class-selection">
                <h4>Select Classes/Periods</h4>
                <div class="class-checkboxes">
                  <label 
                    v-for="classGroup in uniqueClasses" 
                    :key="classGroup.key"
                    class="class-checkbox"
                  >
                    <input 
                      type="checkbox" 
                      :value="classGroup.key"
                      v-model="selectedClasses"
                      @change="updateStudentsByClass"
                    >
                    <span>{{ classGroup.label }} ({{ classGroup.count }} students)</span>
                  </label>
                </div>
              </div>

              <!-- Individual Student Selection (when mode is 'individual') -->
              <div v-if="assignmentMode === 'individual'" class="individual-selection">
                <h4>Select Students</h4>
                <div class="student-search">
                  <input 
                    v-model="studentSearchQuery" 
                    type="text" 
                    placeholder="Search students..." 
                    class="form-input"
                  >
                </div>
                <div class="student-checkboxes">
                  <label 
                    v-for="student in filteredStudents" 
                    :key="student.uid"
                    class="student-checkbox"
                  >
                    <input 
                      type="checkbox" 
                      :value="student.uid"
                      v-model="selectedStudents"
                    >
                    <span>{{ student.firstName }} {{ student.lastName }}</span>
                    <small>{{ getStudentClassName(student) }} - {{ getStudentPeriod(student) || 'No period' }}</small>
                  </label>
                </div>
              </div>
            </div>
            
            <!-- No students state -->
            <div v-else class="no-students-available">
              <p>{{ permissions.isAdmin ? 'No students in the system yet.' : 'No students assigned to you yet.' }}</p>
              <small class="form-help">
                {{ permissions.isAdmin ? 'Add students first, then create assessments.' : 'Contact your administrator to assign students to you.' }}
              </small>
            </div>
            
            <div class="assignment-summary">
              <strong>{{ getSelectedStudentsCount() }} student(s) will receive this assessment</strong>
              <small class="form-help">{{ getAssignmentSummaryText() }}</small>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label>Accommodations</label>
          <div class="accommodations-grid">
            <label 
              v-for="accommodation in availableAccommodations" 
              :key="accommodation"
              class="accommodation-checkbox"
            >
              <input 
                type="checkbox" 
                :value="accommodation"
                v-model="assessment.accommodations"
              >
              <span>{{ accommodation }}</span>
            </label>
          </div>
          <div class="custom-accommodation">
            <input 
              v-model="customAccommodation"
              type="text"
              class="form-input"
              placeholder="Add custom accommodation..."
              @keyup.enter="addCustomAccommodation"
            >
            <button 
              type="button"
              @click="addCustomAccommodation"
              class="add-button"
              :disabled="!customAccommodation.trim()"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <!-- Questions Section -->
      <div class="form-section">
        <div class="section-header">
          <h2>❓ Questions ({{ assessment.questions.length }})</h2>
          <button type="button" @click="addQuestion" class="add-question-button">
            + Add Question
          </button>
        </div>

        <div class="questions-list">
          <div 
            v-for="(question, index) in assessment.questions" 
            :key="question.id"
            class="question-item"
          >
            <div class="question-header">
              <h3>Question {{ index + 1 }}</h3>
              <div class="question-actions">
                <button 
                  type="button" 
                  @click="moveQuestion(index, -1)"
                  :disabled="index === 0"
                  class="move-button"
                  title="Move Up"
                >
                  ↑
                </button>
                <button 
                  type="button" 
                  @click="moveQuestion(index, 1)"
                  :disabled="index === assessment.questions.length - 1"
                  class="move-button"
                  title="Move Down"
                >
                  ↓
                </button>
                <button 
                  type="button" 
                  @click="removeQuestion(index)"
                  class="remove-button"
                  title="Remove Question"
                >
                  ×
                </button>
              </div>
            </div>

            <div class="question-content">
              <div class="form-group">
                <label>Question Text *</label>
                <LaTeXEditor 
                  v-model="question.questionText" 
                  :rows="3"
                  placeholder="Enter the question... Use $...$ for inline math or $$...$$ for display math (e.g., What is $x^2 + 5x - 6$?)"
                />
              </div>

              <!-- Question Standards (Accordion) -->
              <div class="form-group">
                <div class="accordion-header" @click="toggleQuestionStandardsAccordion(question.id)">
                  <label>📏 Standards for this Question</label>
                  <div class="accordion-toggle">
                    <span 
                      class="current-standard" 
                      v-if="question.standard"
                      :class="{ 
                        'custom-standard': question.standard.startsWith('CUSTOM:'),
                        'ccss-standard': !question.standard.startsWith('CUSTOM:')
                      }"
                    >
                      {{ getStandardDisplayName(question.standard) }}
                    </span>
                    <span class="no-standard" v-else>No standard selected</span>
                    <span class="accordion-icon" :class="{ expanded: expandedStandards[question.id] }">
                      {{ expandedStandards[question.id] ? '▼' : '▶' }}
                    </span>
                  </div>
                </div>
                
                <div v-if="expandedStandards[question.id]" class="accordion-content">
                  <StandardSelector 
                    :modelValue="getQuestionStandardSelection(question)"
                    :grade="assessment.gradeLevel.toString()"
                    @update:modelValue="updateQuestionStandard(question, $event)"
                  />
                  
                  <div class="standards-help">
                    <small>💡 <strong>Tip:</strong> This question will count toward the selected standard in gradebook and progress tracking.</small>
                  </div>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Question Type *</label>
                  <select v-model="question.questionType" required class="form-select">
                    <option value="">Select Type</option>
                    <option value="multiple-choice">Multiple Choice</option>
                    <option value="true-false">True/False</option>
                    <option value="short-answer">Short Answer</option>
                    <option value="essay">Essay</option>
                    <option value="number">Number</option>
                    <option value="fraction">Fraction</option>
                    <option value="matching">Matching</option>
                    <option value="rank-order">Rank Order</option>
                    <option value="checkbox">Multiple Select (Checkboxes)</option>
                    <option value="horizontal-ordering">Horizontal Ordering</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label>Points *</label>
                  <input 
                    v-model.number="question.points" 
                    type="number" 
                    required 
                    class="form-input"
                    min="1"
                    max="100"
                  >
                </div>
              </div>

              <!-- Multiple Choice Options -->
              <div v-if="question.questionType === 'multiple-choice'" class="options-section">
                <label>Answer Options</label>
                <div class="options-list">
                  <div 
                    v-for="(option, optionIndex) in question.options" 
                    :key="optionIndex"
                    class="option-item"
                  >
                    <LaTeXEditor 
                      v-model="question.options![optionIndex]"
                      :rows="2"
                      :show-preview="false"
                      placeholder="Enter option... Use $...$ for math (e.g., $\frac{1}{2}$)"
                      class="option-latex-editor"
                    />
                    <label class="correct-checkbox">
                      <input 
                        type="radio"
                        :name="`correct-${question.id}`"
                        :value="optionIndex.toString()"
                        v-model="question.correctAnswer"
                      >
                      Correct
                    </label>
                    <button 
                      type="button"
                      @click="removeOption(question, optionIndex)"
                      class="remove-option-button"
                      :disabled="question.options && question.options.length <= 2"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <button 
                  type="button"
                  @click="addOption(question)"
                  class="add-option-button"
                  :disabled="question.options && question.options.length >= 6"
                >
                  + Add Option
                </button>
              </div>

              <!-- True/False -->
              <div v-if="question.questionType === 'true-false'" class="true-false-section">
                <label>Correct Answer</label>
                <div class="radio-group">
                  <label class="radio-option">
                    <input type="radio" value="true" v-model="question.correctAnswer">
                    True
                  </label>
                  <label class="radio-option">
                    <input type="radio" value="false" v-model="question.correctAnswer">
                    False
                  </label>
                </div>
              </div>

              <!-- Fraction Configuration -->
              <div v-if="question.questionType === 'fraction'" class="fraction-config">
                <div class="form-group">
                  <label>Correct Fraction Answers *</label>
                  <p class="help-text">Add all acceptable equivalent answers (e.g., 1/2, 2/4, 0.5)</p>
                  
                  <div class="fraction-answers-list">
                    <div 
                      v-for="(answer, answerIndex) in question.correctFractionAnswers || []" 
                      :key="answerIndex"
                      class="fraction-answer-item"
                    >
                      <input 
                        v-model="question.correctFractionAnswers![answerIndex]"
                        type="text"
                        placeholder="e.g., 3/4 or 0.75 or 3"
                        class="form-input"
                      />
                      <button 
                        type="button"
                        @click="removeFractionAnswer(index, answerIndex)"
                        class="remove-btn"
                      >×</button>
                    </div>
                  </div>
                  
                  <button 
                    type="button"
                    @click="addFractionAnswer(index)"
                    class="add-btn"
                  >+ Add Equivalent Answer</button>
                </div>
              </div>

              <!-- Matching Configuration -->
              <div v-if="question.questionType === 'matching'" class="matching-config">
                <div class="form-group">
                  <label>Matching Pairs *</label>
                  <p class="help-text">Create pairs of items that students need to match</p>
                  
                  <div class="matching-pairs-list">
                    <div 
                      v-for="(pair, pairIndex) in question.matchingPairs || []" 
                      :key="pairIndex"
                      class="matching-pair-item"
                    >
                      <div class="pair-inputs">
                        <LaTeXEditor 
                          v-model="question.matchingPairs![pairIndex].left"
                          :rows="2"
                          :show-preview="false"
                          placeholder="Left item (e.g., $\frac{1}{2}$)"
                          class="pair-latex-editor"
                        />
                        <span class="pair-connector">↔</span>
                        <LaTeXEditor 
                          v-model="question.matchingPairs![pairIndex].right"
                          :rows="2"
                          :show-preview="false"
                          placeholder="Right item (e.g., $0.5$)"
                          class="pair-latex-editor"
                        />
                        <button 
                          type="button"
                          @click="removeMatchingPair(index, pairIndex)"
                          class="remove-btn"
                        >×</button>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    type="button"
                    @click="addMatchingPair(index)"
                    class="add-btn"
                  >+ Add Matching Pair</button>
                </div>
              </div>

              <!-- Rank Order Configuration -->
              <div v-if="question.questionType === 'rank-order'" class="rank-order-config">
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
                        class="rank-latex-editor"
                      />
                      <button 
                        type="button"
                        @click="removeRankItem(index, itemIndex)"
                        class="remove-btn"
                      >×</button>
                    </div>
                  </div>
                  
                  <button 
                    type="button"
                    @click="addRankItem(index)"
                    class="add-btn"
                  >+ Add Item to Rank</button>
                  
                  <div class="form-group" style="margin-top: 20px;">
                    <label>Correct Order *</label>
                    <p class="help-text">
                      {{ question.orderType === 'ascending' ? 'Items will be automatically sorted from smallest to largest' :
                         question.orderType === 'descending' ? 'Items will be automatically sorted from largest to smallest' :
                         'Drag items above to set the correct order, or enter the correct sequence manually' }}
                    </p>
                    <div v-if="question.orderType === 'custom'" class="correct-order-list">
                      <div 
                        v-for="(item, orderIndex) in question.correctOrder || []" 
                        :key="orderIndex"
                        class="correct-order-item"
                      >
                        <span class="order-number">{{ orderIndex + 1 }}.</span>
                        <select v-model="question.correctOrder![orderIndex]" class="form-select">
                          <option value="">Select item</option>
                          <option 
                            v-for="rankItem in question.itemsToRank || []" 
                            :key="rankItem"
                            :value="rankItem"
                          >{{ rankItem }}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Checkbox Configuration -->
              <div v-if="question.questionType === 'checkbox'" class="checkbox-config">
                <div class="form-group">
                  <label>Answer Options *</label>
                  <p class="help-text">Add options and check all that should be correct answers</p>
                  
                  <div class="checkbox-options-list">
                    <div 
                      v-for="(option, optionIndex) in question.options || []" 
                      :key="optionIndex"
                      class="checkbox-option-item"
                    >
                      <div class="option-row">
                        <input 
                          type="checkbox"
                          :checked="isCorrectCheckboxAnswer(question, optionIndex)"
                          @change="toggleCorrectCheckboxAnswer(index, optionIndex)"
                          class="correct-checkbox"
                        />
                        <LaTeXEditor 
                          v-model="question.options![optionIndex]"
                          :rows="2"
                          :show-preview="false"
                          placeholder="Enter option... Use $...$ for math (e.g., $\frac{1}{2}$)"
                          class="option-latex-editor"
                        />
                        <button 
                          type="button"
                          @click="removeOption(question, optionIndex)"
                          class="remove-btn"
                        >×</button>
                      </div>
                      <small class="option-help">
                        ✓ Check if this option is correct
                      </small>
                    </div>
                  </div>
                  
                  <button 
                    type="button"
                    @click="addOption(question)"
                    class="add-btn"
                  >+ Add Option</button>
                  
                  <div class="correct-answers-summary">
                    <strong>Correct Answers Selected:</strong>
                    <span v-if="getCorrectCheckboxAnswers(question).length === 0" class="no-correct">
                      ⚠️ No correct answers selected
                    </span>
                    <span v-else class="correct-count">
                      {{ getCorrectCheckboxAnswers(question).length }} option(s)
                    </span>
                  </div>
                </div>
              </div>

              <!-- Horizontal Ordering Configuration -->
              <div v-if="question.questionType === 'horizontal-ordering'" class="horizontal-ordering-config">
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
                        class="ordering-latex-editor"
                        @update:modelValue="updateCorrectHorizontalOrder(question)"
                      />
                      <button 
                        type="button"
                        @click="removeOrderingItem(index, itemIndex)"
                        class="remove-btn"
                      >×</button>
                    </div>
                  </div>
                  
                  <button 
                    type="button"
                    @click="addOrderingItem(index)"
                    class="add-btn"
                    :disabled="(question.orderingItems || []).length >= 8"
                  >+ Add Ordering Item</button>
                  
                  <div class="form-group" style="margin-top: 20px;">
                    <label>Order Direction *</label>
                    <select v-model="question.orderDirection" class="form-select">
                      <option value="ascending">Ascending (least to greatest)</option>
                      <option value="descending">Descending (greatest to least)</option>
                    </select>
                  </div>
                  
                  <div class="form-group">
                    <label>Correct Order *</label>
                    <p class="help-text">
                      Drag items above to set the correct order, or select the correct sequence manually
                    </p>
                    <div class="correct-order-list">
                      <div 
                        v-for="(item, orderIndex) in getCorrectOrderArray(question)" 
                        :key="orderIndex"
                        class="correct-order-item"
                      >
                        <span class="order-number">{{ orderIndex + 1 }}.</span>
                        <select v-model="question.correctHorizontalOrder![orderIndex]" class="form-select" @change="ensureCorrectOrderLength(question)">
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
                  
                  <div class="ordering-summary">
                    <strong>Items to Order:</strong> {{ (question.orderingItems || []).length }} item(s)
                    <br>
                    <strong>Correct Order Set:</strong> 
                    <span v-if="(question.correctHorizontalOrder || []).length === 0" class="no-correct">
                      ⚠️ No correct order set
                    </span>
                    <span v-else class="correct-count">
                      {{ (question.correctHorizontalOrder || []).length }} position(s)
                    </span>
                  </div>
                </div>
              </div>

              <!-- Short Answer/Essay/Number -->
              <div v-if="['short-answer', 'essay', 'number'].includes(question.questionType)" class="answer-section">
                <div class="form-group">
                  <label>Primary Correct Answer *</label>
                  <textarea 
                    v-model="question.correctAnswer"
                    class="form-textarea"
                    :rows="question.questionType === 'essay' ? 4 : 2"
                    placeholder="Enter the main correct answer..."
                  ></textarea>
                </div>

                <div v-if="question.questionType === 'short-answer' || question.questionType === 'multiple-choice'" class="form-group">
                  <label>Additional Acceptable Answers</label>
                  <div class="acceptable-answers">
                    <div 
                      v-for="(answer, answerIndex) in question.acceptableAnswers" 
                      :key="answerIndex"
                      class="acceptable-answer-item"
                    >
                      <input 
                        v-model="question.acceptableAnswers![answerIndex]"
                        type="text"
                        class="form-input"
                        :placeholder="question.questionType === 'multiple-choice' ? 'Alternative answer text or option index...' : 'Alternative correct answer...'"
                      >
                      <button 
                        type="button"
                        @click="removeAcceptableAnswer(question, answerIndex)"
                        class="remove-answer-button"
                      >
                        ×
                      </button>
                    </div>
                    <button 
                      type="button"
                      @click="addAcceptableAnswer(question)"
                      class="add-answer-button"
                    >
                      + Add Alternative Answer
                    </button>
                  </div>
                  <small class="form-help">
                    <span v-if="question.questionType === 'multiple-choice'">
                      Students can select any of these alternative answers to get full credit (enter option text or index number)
                    </span>
                    <span v-else>
                      Students can provide any of these answers to get full credit
                    </span>
                  </small>
                </div>
                
                <!-- Equivalent Fractions Option -->
                <div v-if="question.questionType === 'short-answer'" class="form-group">
                  <label class="checkbox-label">
                    <input 
                      type="checkbox" 
                      v-model="question.acceptEquivalentFractions"
                      class="form-checkbox"
                    >
                    <span class="checkbox-text">
                      🔢 Accept equivalent fractions (e.g., 1/2 = 2/4 = 3/6)
                    </span>
                  </label>
                  <small class="form-help">
                    When enabled, students get credit for any equivalent fraction, even if not simplified
                  </small>
                </div>
              </div>

              <div class="form-group">
                <label>Explanation (optional)</label>
                <textarea 
                  v-model="question.explanation"
                  class="form-textarea"
                  rows="2"
                  placeholder="Explanation to show students after they answer..."
                ></textarea>
              </div>
            </div>
          </div>

          <div v-if="assessment.questions.length === 0" class="no-questions">
            <p>No questions added yet. Click "Add Question" to get started.</p>
          </div>
        </div>
      </div>

      <!-- Assessment Summary -->
      <div class="form-section">
        <h2>📊 Assessment Summary</h2>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="summary-label">Total Questions:</span>
            <span class="summary-value">{{ assessment.questions.length }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Total Points:</span>
            <span class="summary-value">{{ totalPoints }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Time Limit:</span>
            <span class="summary-value">{{ assessment.timeLimit ? `${assessment.timeLimit} min` : 'No limit' }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Accommodations:</span>
            <span class="summary-value">{{ assessment.accommodations.length }}</span>
          </div>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button type="button" @click="goBack" class="cancel-button">
          Cancel
        </button>
        <button type="button" @click="previewAssessment" class="preview-button" :disabled="!canPreview">
          👁️ Preview
        </button>
        <button type="button" @click="printAssessment" class="print-button" :disabled="!isEditing || !canPreview">
          🖨️ Print
        </button>
        <button type="submit" class="save-button" :disabled="saving || !isValid">
          {{ saving ? 'Saving...' : (isEditing ? 'Update Assessment' : 'Create Assessment') }}
        </button>
      </div>
    </form>

    <!-- Error/Success Messages -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
    
    <div v-if="success" class="success-message">
      {{ success }}
    </div>

    <!-- Update Warning Dialog -->
    <AssessmentUpdateWarning
      v-if="showUpdateWarning"
      :result-count="existingResultsInfo.resultCount"
      :student-emails="existingResultsInfo.studentEmails"
      @proceed="proceedWithUpdate"
      @cancel="cancelUpdate"
    />

    <!-- Migration Progress Overlay -->
    <div v-if="migrationInProgress" class="migration-overlay">
      <div class="migration-modal">
        <div class="migration-spinner"></div>
        <h3>Updating Assessment & Re-grading Results...</h3>
        <p>Please wait while we update student scores with the new answer key.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { usePermissions } from '@/composables/usePermissions';
import { createAssessment, getAssessment, getAssessmentByGoalId, updateAssessment, assignAssessmentToStudent, unassignAssessmentFromStudent, getCurrentlyAssignedStudents, regradeAssessmentResults } from '@/firebase/iepServices';
import { getAutoDetectedAcademicPeriod } from '@/firebase/assignmentServices';
import { serverTimestamp } from 'firebase/firestore';
import { getAllStudents, getStudentsByTeacher } from '@/firebase/userServices';
import { getAllGoals, getGoalsByTeacher, getGoal, assignAssessmentToGoal } from '@/firebase/goalServices';
import { hasExistingResults, migrateAssessmentResults, type MigrationResult } from '@/firebase/assessmentMigrationService';
import type { Assessment, AssessmentQuestion, Goal } from '@/types/iep';
import { parseStandards, formatStandardsForDisplay } from '@/utils/standardsUtils';
import { getStudentClassName, getStudentPeriod } from '@/utils/studentGroupingUtils';
import type { Student as FirebaseStudent } from '@/types/users';
import AssessmentUpdateWarning from '@/components/AssessmentUpdateWarning.vue';
import LaTeXEditor from '@/components/LaTeXEditor.vue';
import StandardSelector from '@/components/StandardSelector.vue';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const permissions = usePermissions();

const isEditing = computed(() => !!route.params.id);
const assessmentId = route.params.id as string;

// Form state
const saving = ref(false);
const error = ref('');
const success = ref('');

// Update warning state
const showUpdateWarning = ref(false);
const existingResultsInfo = ref<{resultCount: number; studentEmails: string[]}>({resultCount: 0, studentEmails: []});
const migrationInProgress = ref(false);
const customAccommodation = ref('');
const selectedStudents = ref<string[]>([]);
const loadingStudents = ref(true);

// Assignment mode and filtering
const assignmentMode = ref('template');
const selectedQuarter = ref('auto'); // Quarter selection: 'auto', 'q1', 'q2', 'q3', 'q4'
const selectedClasses = ref<string[]>([]);
const studentSearchQuery = ref('');

// Available options - load from database
const availableStudents = ref<FirebaseStudent[]>([]);
const availableGoals = ref<Goal[]>([]);
const availableAccommodations = ref([
  'Extended time (1.5x)',
  'Extended time (2x)', 
  'Read aloud',
  'Large print',
  'Separate testing location',
  'Frequent breaks',
  'Use of calculator',
  'Simplified language',
  'Visual supports',
  'Assistive technology'
]);

const availableFileTypes = ref([
  { value: 'jpg,jpeg,png', label: '📷 Images (JPG, PNG)' },
  { value: 'pdf', label: '📄 PDF Documents' },
  { value: 'doc,docx', label: '📝 Word Documents' },
  { value: 'txt', label: '📃 Text Files' },
  { value: 'mp4,mov', label: '🎥 Videos (MP4, MOV)' },
  { value: '*', label: '📁 All File Types' }
]);

// Standard selection state
const selectedStandard = ref<{
  type: 'custom' | 'ccss';
  standardId: string;
  standard: any;
} | null>(null);

// Question standards accordion state
const expandedStandards = ref<Record<string, boolean>>({});

// Assessment data
const assessment = ref<Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'>>({
  goalId: '',
  createdBy: authStore.currentUser?.uid || '', // Required field
  title: '',
  description: '',
  standard: '', // Now optional
  gradeLevel: 7,
  category: 'SA',
  questions: [],
  totalPoints: 0,
  timeLimit: 30,
  instructions: 'Read each question carefully and select the best answer. You may use scratch paper if needed.',
  accommodations: [],
  // File upload settings
  allowFileUpload: false,
  requireFileUpload: false,
  fileUploadInstructions: 'Take a clear photo of your work showing all calculations and steps.',
  maxFileSize: 10,
  allowedFileTypes: ['jpg,jpeg,png', 'pdf'],
  photoOrientation: 'portrait',
  
  // Multi-page photo settings
  requireMultiplePages: false,
  requiredPageCount: 2,
  pageLabels: [],
  allowExtraPages: true,
  
  // Retake settings
  allowRetakes: false,
  maxRetakes: 1,
  retakeMode: 'separate',
  retakeInstructions: 'You may retake this assessment to improve your score.',
  
  // Assignment dates
  assignDate: null,
  dueDate: null
});

// Time limit controls
const noTimeLimit = ref(false);

const toggleTimeLimit = () => {
  if (noTimeLimit.value) {
    assessment.value.timeLimit = 0; // 0 means no time limit
  } else {
    assessment.value.timeLimit = 30; // Default to 30 minutes
  }
};

// Date input controls
const assignDateInput = ref('');
const dueDateInput = ref('');

// Convert dates to/from ISO string format for datetime-local inputs
const updateAssignDate = () => {
  if (assignDateInput.value) {
    assessment.value.assignDate = new Date(assignDateInput.value);
  } else {
    assessment.value.assignDate = null;
  }
};

const updateDueDate = () => {
  if (dueDateInput.value) {
    assessment.value.dueDate = new Date(dueDateInput.value);
  } else {
    assessment.value.dueDate = null;
  }
};

// Computed properties
const totalPoints = computed(() => {
  return assessment.value.questions.reduce((sum, q) => sum + (q.points || 0), 0);
});

const selectedGoalDetails = computed(() => {
  if (!assessment.value.goalId) return null;
  return availableGoals.value.find(goal => goal.id === assessment.value.goalId);
});

const isValid = computed(() => {
  return assessment.value.title.trim() && 
         assessment.value.description.trim() && 
         assessment.value.gradeLevel &&
         assessment.value.category &&
         assessment.value.questions.length > 0 &&
         assessment.value.questions.every(q => 
           q.questionText.trim() && 
           q.questionType && 
           q.points > 0 &&
           (q.questionType !== 'multiple-choice' || (q.options && q.options.length >= 2 && q.correctAnswer)) &&
         (q.questionType !== 'fraction' || (q.correctFractionAnswers && q.correctFractionAnswers.length > 0))
         );
});

const canPreview = computed(() => {
  return assessment.value.questions.length > 0;
});

// Assignment-related computed properties
const uniqueClasses = computed(() => {
  const classGroups = new Map<string, { label: string; count: number; students: FirebaseStudent[] }>();
  
  availableStudents.value.forEach(student => {
    const className = getStudentClassName(student);
    const period = getStudentPeriod(student) || 'No Period';
    const key = `${className}|${period}`;
    const label = `${className} - ${period}`;
    
    if (!classGroups.has(key)) {
      classGroups.set(key, { label, count: 0, students: [] });
    }
    
    const group = classGroups.get(key)!;
    group.count++;
    group.students.push(student);
  });
  
  return Array.from(classGroups.entries()).map(([key, group]) => ({
    key,
    label: group.label,
    count: group.count,
    students: group.students
  }));
});

const filteredStudents = computed(() => {
  if (!studentSearchQuery.value) return availableStudents.value;
  
  const query = studentSearchQuery.value.toLowerCase();
  return availableStudents.value.filter(student => 
    student.firstName.toLowerCase().includes(query) ||
    student.lastName.toLowerCase().includes(query) ||
    student.email.toLowerCase().includes(query) ||
    (student.courseName || '').toLowerCase().includes(query)
  );
});

// Methods
const getSelectedStudentsCount = (): number => {
  switch (assignmentMode.value) {
    case 'template':
      return 0;
    case 'all':
      return availableStudents.value.length;
    case 'class':
      return selectedClasses.value.reduce((count, classKey) => {
        const classGroup = uniqueClasses.value.find(c => c.key === classKey);
        return count + (classGroup?.count || 0);
      }, 0);
    case 'individual':
      return selectedStudents.value.length;
    default:
      return 0;
  }
};

const getAssignmentSummaryText = (): string => {
  switch (assignmentMode.value) {
    case 'template':
      return 'Template assessment - no students assigned';
    case 'all':
      return 'All your students will receive this assessment';
    case 'class':
      return selectedClasses.value.length > 0 ? 
        `Students in ${selectedClasses.value.length} selected class(es)` : 
        'Select classes to assign to';
    case 'individual':
      return selectedStudents.value.length > 0 ? 
        'Individually selected students' : 
        'Search and select students';
    default:
      return '';
  }
};

const updateStudentsByClass = () => {
  // Update selectedStudents based on selected classes
  const studentsInSelectedClasses: string[] = [];
  
  selectedClasses.value.forEach(classKey => {
    const classGroup = uniqueClasses.value.find(c => c.key === classKey);
    if (classGroup) {
      classGroup.students.forEach(student => {
        if (!studentsInSelectedClasses.includes(student.uid)) {
          studentsInSelectedClasses.push(student.uid);
        }
      });
    }
  });
  
  selectedStudents.value = studentsInSelectedClasses;
};

// Watch assignment mode changes to update selected students
watch(assignmentMode, (newMode) => {
  switch (newMode) {
    case 'template':
      selectedStudents.value = [];
      selectedClasses.value = [];
      break;
    case 'all':
      selectedStudents.value = availableStudents.value.map(s => s.uid);
      selectedClasses.value = [];
      break;
    case 'class':
      selectedStudents.value = [];
      selectedClasses.value = [];
      break;
    case 'individual':
      selectedClasses.value = [];
      // Keep existing individual selections
      break;
  }
});

// Methods
const generateQuestionId = () => {
  return 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

const addQuestion = () => {
  const newQuestion: AssessmentQuestion = {
    id: generateQuestionId(),
    questionText: '',
    questionType: 'multiple-choice',
    standard: '',
    standards: [],
    options: ['', ''],
    correctAnswer: '',
    acceptableAnswers: [],
    correctFractionAnswers: [],
    // Initialize matching fields
    matchingPairs: [],
    leftItems: [],
    rightItems: [],
    correctMatches: {},
    // Initialize rank-order fields
    itemsToRank: [],
    correctOrder: [],
    orderType: 'ascending',
    // Initialize checkbox fields
    correctAnswers: [],
    points: 1,
    explanation: ''
  };
  
  assessment.value.questions.push(newQuestion);
};

const removeQuestion = (index: number) => {
  if (confirm('Are you sure you want to remove this question?')) {
    assessment.value.questions.splice(index, 1);
  }
};

const moveQuestion = (index: number, direction: number) => {
  const newIndex = index + direction;
  if (newIndex >= 0 && newIndex < assessment.value.questions.length) {
    const questions = [...assessment.value.questions];
    [questions[index], questions[newIndex]] = [questions[newIndex], questions[index]];
    assessment.value.questions = questions;
  }
};

const addOption = (question: AssessmentQuestion) => {
  if (!question.options) question.options = [];
  question.options.push('');
};

const removeOption = (question: AssessmentQuestion, optionIndex: number) => {
  if (question.options && question.options.length > 2) {
    question.options.splice(optionIndex, 1);
    // Reset correct answer if it was the removed option
    const currentAnswer = parseInt(question.correctAnswer as string);
    if (currentAnswer === optionIndex) {
      question.correctAnswer = '';
    } else if (currentAnswer > optionIndex) {
      question.correctAnswer = (currentAnswer - 1).toString();
    }
  }
};

const addAcceptableAnswer = (question: AssessmentQuestion) => {
  if (!question.acceptableAnswers) question.acceptableAnswers = [];
  question.acceptableAnswers.push('');
};

const removeAcceptableAnswer = (question: AssessmentQuestion, answerIndex: number) => {
  if (question.acceptableAnswers && question.acceptableAnswers.length > 0) {
    question.acceptableAnswers.splice(answerIndex, 1);
  }
};

const addFractionAnswer = (questionIndex: number) => {
  const question = assessment.value!.questions[questionIndex];
  if (!question.correctFractionAnswers) {
    question.correctFractionAnswers = [];
  }
  question.correctFractionAnswers.push('');
};

const removeFractionAnswer = (questionIndex: number, answerIndex: number) => {
  const question = assessment.value!.questions[questionIndex];
  if (question.correctFractionAnswers) {
    question.correctFractionAnswers.splice(answerIndex, 1);
  }
};

// Matching question methods
const addMatchingPair = (questionIndex: number) => {
  const question = assessment.value!.questions[questionIndex];
  if (!question.matchingPairs) {
    question.matchingPairs = [];
  }
  question.matchingPairs.push({ left: '', right: '' });
  updateMatchingItems(question);
};

const removeMatchingPair = (questionIndex: number, pairIndex: number) => {
  const question = assessment.value!.questions[questionIndex];
  if (question.matchingPairs) {
    question.matchingPairs.splice(pairIndex, 1);
    updateMatchingItems(question);
  }
};

const updateMatchingItems = (question: AssessmentQuestion) => {
  if (question.matchingPairs) {
    question.leftItems = question.matchingPairs.map(pair => pair.left).filter(item => item.trim());
    question.rightItems = question.matchingPairs.map(pair => pair.right).filter(item => item.trim());
    question.correctMatches = {};
    question.matchingPairs.forEach(pair => {
      if (pair.left.trim() && pair.right.trim()) {
        question.correctMatches![pair.left] = pair.right;
      }
    });
  }
};

// Rank order question methods
const addRankItem = (questionIndex: number) => {
  const question = assessment.value!.questions[questionIndex];
  if (!question.itemsToRank) {
    question.itemsToRank = [];
  }
  question.itemsToRank.push('');
  updateCorrectOrder(question);
};

const removeRankItem = (questionIndex: number, itemIndex: number) => {
  const question = assessment.value!.questions[questionIndex];
  if (question.itemsToRank) {
    const removedItem = question.itemsToRank[itemIndex];
    question.itemsToRank.splice(itemIndex, 1);
    
    // Remove from correct order if it exists
    if (question.correctOrder) {
      const orderIndex = question.correctOrder.indexOf(removedItem);
      if (orderIndex > -1) {
        question.correctOrder.splice(orderIndex, 1);
      }
    }
    updateCorrectOrder(question);
  }
};

const updateCorrectOrder = (question: AssessmentQuestion) => {
  if (!question.itemsToRank) return;
  
  if (question.orderType === 'ascending' || question.orderType === 'descending') {
    // Auto-sort for ascending/descending
    const sortedItems = [...question.itemsToRank].filter(item => item.trim());
    
    // Try to sort numerically if possible
    sortedItems.sort((a, b) => {
      const numA = parseFloat(a);
      const numB = parseFloat(b);
      
      if (!isNaN(numA) && !isNaN(numB)) {
        return question.orderType === 'ascending' ? numA - numB : numB - numA;
      }
      
      // Fallback to string comparison
      return question.orderType === 'ascending' ? a.localeCompare(b) : b.localeCompare(a);
    });
    
    question.correctOrder = sortedItems;
  } else if (question.orderType === 'custom') {
    // Initialize correct order array for custom ordering
    if (!question.correctOrder) {
      question.correctOrder = [...question.itemsToRank].filter(item => item.trim());
    } else {
      // Ensure correct order has same length as items to rank
      const filteredItems = question.itemsToRank.filter(item => item.trim());
      question.correctOrder = question.correctOrder.filter(item => filteredItems.includes(item));
      
      // Add any new items that aren't in correct order yet
      filteredItems.forEach(item => {
        if (!question.correctOrder!.includes(item)) {
          question.correctOrder!.push(item);
        }
      });
    }
  }
};

// Checkbox question methods
const isCorrectCheckboxAnswer = (question: AssessmentQuestion, optionIndex: number): boolean => {
  if (!question.correctAnswers) return false;
  return question.correctAnswers.includes(optionIndex.toString());
};

const toggleCorrectCheckboxAnswer = (questionIndex: number, optionIndex: number) => {
  const question = assessment.value!.questions[questionIndex];
  if (!question.correctAnswers) {
    question.correctAnswers = [];
  }
  
  const optionIndexStr = optionIndex.toString();
  const currentIndex = question.correctAnswers.indexOf(optionIndexStr);
  
  if (currentIndex > -1) {
    // Remove from correct answers
    question.correctAnswers.splice(currentIndex, 1);
  } else {
    // Add to correct answers
    question.correctAnswers.push(optionIndexStr);
  }
};

const getCorrectCheckboxAnswers = (question: AssessmentQuestion): string[] => {
  return question.correctAnswers || [];
};

// Horizontal ordering question methods
const addOrderingItem = (questionIndex: number) => {
  const question = assessment.value!.questions[questionIndex];
  if (!question.orderingItems) {
    question.orderingItems = [];
  }
  if (question.orderingItems.length < 8) {
    question.orderingItems.push('');
    updateCorrectHorizontalOrder(question);
  }
};

const removeOrderingItem = (questionIndex: number, itemIndex: number) => {
  const question = assessment.value!.questions[questionIndex];
  if (question.orderingItems) {
    question.orderingItems.splice(itemIndex, 1);
    updateCorrectHorizontalOrder(question);
  }
};

const getCorrectOrderArray = (question: AssessmentQuestion): string[] => {
  if (!question.orderingItems) return [];
  
  // Use ALL ordering items (including empty ones) to determine the number of dropdowns
  // This ensures we always show the correct number of dropdowns matching the number of items
  const totalItems = question.orderingItems.length;
  
  // Ensure correctHorizontalOrder exists and has the right length
  if (!question.correctHorizontalOrder) {
    // Initialize with empty strings to match the length
    question.correctHorizontalOrder = new Array(totalItems).fill('');
  } else {
    // Ensure length matches the total number of ordering items exactly
    if (question.correctHorizontalOrder.length !== totalItems) {
      // If we need more items, pad with empty strings
      if (question.correctHorizontalOrder.length < totalItems) {
        const needed = totalItems - question.correctHorizontalOrder.length;
        question.correctHorizontalOrder.push(...new Array(needed).fill(''));
      } else {
        // If we have too many, trim to match - but preserve existing values
        const existingValues = [...question.correctHorizontalOrder];
        question.correctHorizontalOrder = existingValues.slice(0, totalItems);
      }
    }
  }
  
  // Final safety check - ensure we return exactly the right length
  if (question.correctHorizontalOrder.length !== totalItems) {
    console.warn('getCorrectOrderArray: Length mismatch, fixing:', {
      expected: totalItems,
      actual: question.correctHorizontalOrder.length
    });
    // Force correct length
    const existingValues = [...question.correctHorizontalOrder];
    question.correctHorizontalOrder = new Array(totalItems).fill('').map((_, index) => {
      return existingValues[index] || '';
    });
  }
  
  return question.correctHorizontalOrder;
};

const ensureCorrectOrderLength = (question: AssessmentQuestion) => {
  updateCorrectHorizontalOrder(question);
};

const updateCorrectHorizontalOrder = (question: AssessmentQuestion) => {
  if (!question.orderingItems) return;
  
  // Ensure correctHorizontalOrder has the same length as orderingItems
  // This ensures we always have the right number of dropdowns
  const totalItems = question.orderingItems.length;
  
  if (!question.correctHorizontalOrder) {
    // Initialize with empty strings to match the length
    question.correctHorizontalOrder = new Array(totalItems).fill('');
  } else {
    // First, ensure the array length matches exactly
    if (question.correctHorizontalOrder.length !== totalItems) {
      if (question.correctHorizontalOrder.length < totalItems) {
        // Add empty strings for new items
        const needed = totalItems - question.correctHorizontalOrder.length;
        question.correctHorizontalOrder.push(...new Array(needed).fill(''));
      } else {
        // Trim if items were removed - but preserve existing values
        question.correctHorizontalOrder = question.correctHorizontalOrder.slice(0, totalItems);
      }
    }
    
    // Clean up: only clear entries that reference items that no longer exist in orderingItems
    // Check against ALL items in orderingItems (including empty ones for position matching)
    if (question.orderingItems) {
      question.correctHorizontalOrder = question.correctHorizontalOrder.map((orderItem, index) => {
        // If this position has a value, check if it still exists in orderingItems
        if (orderItem && orderItem.trim()) {
          // Check if this value still exists in orderingItems at any position
          const stillExists = question.orderingItems!.some(item => item === orderItem);
          if (!stillExists) {
            // Value no longer exists, clear it
            return '';
          }
        }
        // Keep the existing value (even if empty)
        return orderItem;
      });
    }
  }
  
  // Final safety check: ensure length is exactly correct
  if (question.correctHorizontalOrder.length !== totalItems) {
    console.warn('Correct order length mismatch, fixing:', {
      expected: totalItems,
      actual: question.correctHorizontalOrder.length,
      orderingItems: question.orderingItems || []
    });
    // Force rebuild to correct length
    const existingValues = [...question.correctHorizontalOrder];
    question.correctHorizontalOrder = new Array(totalItems).fill('').map((_, index) => {
      return existingValues[index] || '';
    });
  }
};

const updateQuestionStandards = (question: AssessmentQuestion) => {
  // Parse the standards string and update the standards array
  question.standards = parseStandards(question.standard);
};

// Warning dialog handlers
const proceedWithUpdate = async () => {
  showUpdateWarning.value = false;
  migrationInProgress.value = true;
  
  try {
    // Perform the save first
    await performSave();
    
    // Then migrate existing results
    if (isEditing.value) {
      console.log('🔄 Starting result migration...');
      const migrationResult = await migrateAssessmentResults(
        assessmentId, 
        {
          ...assessment.value,
          id: assessmentId,
          createdAt: new Date(),
          updatedAt: new Date()
        }, 
        authStore.currentUser?.email || 'Unknown'
      );
      
      // Show migration results
      if (migrationResult.updatedResults > 0) {
        const changes = migrationResult.scoreChanges;
        let changesSummary = `✅ Migration completed!\n\n`;
        changesSummary += `📊 ${migrationResult.updatedResults} student results updated\n\n`;
        
        changes.forEach(change => {
          changesSummary += `👤 ${change.studentUid}:\n`;
          changesSummary += `   Score: ${change.oldScore} → ${change.newScore} (${change.oldPercentage}% → ${change.newPercentage}%)\n`;
          if (change.questionsChanged.length > 0) {
            changesSummary += `   Questions changed: ${change.questionsChanged.length}\n`;
          }
          changesSummary += `\n`;
        });
        
        alert(changesSummary);
        success.value = `Assessment updated and ${migrationResult.updatedResults} student results re-graded!`;
      } else {
        success.value = 'Assessment updated! No student scores were affected.';
      }
    }
  } catch (err: any) {
    console.error('Error during update and migration:', err);
    error.value = 'Failed to update assessment and migrate results: ' + err.message;
  } finally {
    migrationInProgress.value = false;
  }
};

const cancelUpdate = () => {
  showUpdateWarning.value = false;
  existingResultsInfo.value = {resultCount: 0, studentEmails: []};
};

const addCustomAccommodation = () => {
  const accommodation = customAccommodation.value.trim();
  if (accommodation && !assessment.value.accommodations.includes(accommodation)) {
    assessment.value.accommodations.push(accommodation);
    customAccommodation.value = '';
  }
};

const onFileUploadToggle = () => {
  if (!assessment.value.allowFileUpload) {
    // If disabling file upload, also disable require
    assessment.value.requireFileUpload = false;
    assessment.value.requireMultiplePages = false;
  }
};

// Multi-page photo management
const pageLabelsArray = ref<string[]>([]);

const onMultiplePageToggle = () => {
  if (!assessment.value.requireMultiplePages) {
    // If disabling multiple pages, clear settings
    assessment.value.requiredPageCount = 2;
    assessment.value.pageLabels = [];
    assessment.value.allowExtraPages = true;
    pageLabelsArray.value = [];
  } else {
    // Initialize page labels array
    initializePageLabels();
  }
};

const initializePageLabels = () => {
  const count = assessment.value.requiredPageCount || 2;
  pageLabelsArray.value = Array(count).fill('').map((_, index) => 
    assessment.value.pageLabels?.[index] || ''
  );
};

const updatePageLabels = () => {
  assessment.value.pageLabels = pageLabelsArray.value.filter(label => label.trim() !== '');
};

const getFileUploadPlaceholder = () => {
  if (assessment.value.requireMultiplePages) {
    const count = assessment.value.requiredPageCount || 2;
    return `Instructions for capturing ${count} pages (e.g., 'Take clear photos of each page of your work. Page 1: Problem setup, Page 2: Solution steps')`;
  }
  return 'Instructions for students about what files to upload (e.g., \'Take a clear photo of your work showing all calculations\')';
};

// Watch for page count changes
watch(() => assessment.value.requiredPageCount, (newCount: number | undefined) => {
  if (assessment.value.requireMultiplePages && newCount) {
    initializePageLabels();
  }
});

// Standard selection handler
const updateAssessmentStandard = (standardSelection: any) => {
  if (standardSelection) {
    // Update assessment standard based on selection type
    if (standardSelection.type === 'custom') {
      assessment.value.standard = `CUSTOM:${standardSelection.standard.code}`;
    } else {
      assessment.value.standard = standardSelection.standard.code;
    }
  } else {
    assessment.value.standard = '';
  }
};

// Question standards accordion methods
const toggleQuestionStandardsAccordion = (questionId: string) => {
  expandedStandards.value[questionId] = !expandedStandards.value[questionId];
};

const getQuestionStandardSelection = (question: AssessmentQuestion) => {
  if (!question.standard) return null;
  
  // For now, return null to avoid type issues
  // The StandardSelector will handle the initial state
  return null;
};

const updateQuestionStandard = (question: AssessmentQuestion, standardSelection: any) => {
  if (standardSelection) {
    // Update question standard based on selection type
    if (standardSelection.type === 'custom') {
      question.standard = `CUSTOM:${standardSelection.standard.code}`;
    } else {
      question.standard = standardSelection.standard.code;
    }
  } else {
    question.standard = '';
  }
  
  // Update the standards array for compatibility
  updateQuestionStandards(question);
};

const getStandardDisplayName = (standardCode: string): string => {
  if (!standardCode) return 'No standard';
  
  if (standardCode.startsWith('CUSTOM:')) {
    return standardCode.replace('CUSTOM:', ''); // Just the code, no "(Custom)"
  } else {
    return standardCode; // Just the CCSS code, no "(CCSS)"
  }
};

const loadAssessment = async () => {
  if (!isEditing.value) return;
  
  try {
    // Try to load by document ID first
    let data = await getAssessment(assessmentId);
    
    // If not found by document ID, try by goalId (for template assessments)
    if (!data) {
      data = await getAssessmentByGoalId(assessmentId);
    }
    
    if (data) {
      // Copy all fields except id, createdAt, updatedAt
      const { id, createdAt, updatedAt, ...assessmentData } = data;
      assessment.value = assessmentData;
      
      // Initialize date inputs for editing
      if (data.assignDate) {
        assignDateInput.value = new Date(data.assignDate.seconds * 1000).toISOString().slice(0, 16);
      }
      if (data.dueDate) {
        dueDateInput.value = new Date(data.dueDate.seconds * 1000).toISOString().slice(0, 16);
      }
      
      // Initialize quarter dropdown with existing value
      if (data.academicPeriod) {
        selectedQuarter.value = data.academicPeriod;
        console.log(`📅 Loaded existing academicPeriod: ${data.academicPeriod}`);
      } else {
        selectedQuarter.value = 'auto'; // Default for old assessments
        console.log('📅 No academicPeriod found, defaulting to auto-detect');
      }
      
      // Set selected students based on current assignments (new approach)
      try {
        const currentlyAssigned = await getCurrentlyAssignedStudents(assessmentId);
        const assignedUids = currentlyAssigned.map(s => s.studentUid);
        selectedStudents.value = assignedUids;
        
        // Set assignment mode based on selection
        if (assignedUids.length === 0) {
          assignmentMode.value = 'template';
        } else if (assignedUids.length === availableStudents.value.length) {
          assignmentMode.value = 'all';
        } else {
          assignmentMode.value = 'individual';
        }
        
        console.log(`📝 Pre-selected ${assignedUids.length} students for editing assessment`);
      } catch (error) {
        console.error('Error loading assigned students:', error);
        assignmentMode.value = 'template';
        selectedStudents.value = [];
      }
      
      // Ensure all questions have the new fields for compatibility
      assessment.value.questions = assessment.value.questions.map(q => ({
        ...q,
        standard: q.standard || '',
        acceptableAnswers: q.acceptableAnswers || []
      }));
      
      console.log('Loaded assessment with questions:', assessment.value.questions.length);
    } else {
      error.value = 'Assessment not found in database.';
    }
  } catch (err) {
    console.error('Error loading assessment:', err);
    error.value = 'Failed to load assessment for editing.';
  }
};

const saveAssessment = async () => {
  if (!isValid.value) return;
  
  // Check for existing results if editing
  if (isEditing.value) {
    try {
      const resultsInfo = await hasExistingResults(assessmentId);
      if (resultsInfo.hasResults) {
        // Show warning dialog
        existingResultsInfo.value = {
          resultCount: resultsInfo.resultCount,
          studentEmails: resultsInfo.studentEmails
        };
        showUpdateWarning.value = true;
        return; // Stop here - user needs to confirm
      }
    } catch (err) {
      console.warn('Could not check existing results:', err);
      // Continue with normal save if check fails
    }
  }

  // Proceed with save
  await performSave();
};

const performSave = async () => {
  saving.value = true;
  error.value = '';
  success.value = '';
  
  let savedAssessmentId = assessmentId; // For editing mode
  
  try {
    // Update total points
    assessment.value.totalPoints = totalPoints.value;
    
    if (selectedStudents.value.length > 0) {
      // Debug logging
      console.log('🔍 Save with students - isEditing:', isEditing.value, 'selectedStudents:', selectedStudents.value.length, 'assessmentId:', assessmentId);
      
      if (isEditing.value) {
        // EDITING MODE: Update the assessment template and manage student assignments
        console.log('✏️ EDITING MODE: Updating assessment template');
        
        // First, update the assessment template (without student-specific fields)
        const assessmentData = {
          ...assessment.value,
          createdBy: authStore.currentUser?.uid,
          updatedAt: serverTimestamp(),
          // Set academic period on the assessment
          academicPeriod: selectedQuarter.value === 'auto' 
            ? getAutoDetectedAcademicPeriod() 
            : selectedQuarter.value === 'all'
            ? 'all'
            : selectedQuarter.value
        };
        
        // Remove any student-specific fields from template
        delete (assessmentData as any).studentSeisId;
        delete (assessmentData as any).studentUid;
        
        await updateAssessment(assessmentId, assessmentData);
        
        // Then, manage student assignments
        // Get currently assigned students for this assessment
        const currentlyAssigned = await getCurrentlyAssignedStudents(assessmentId);
        const currentlyAssignedUids = currentlyAssigned.map(s => s.studentUid);
        
        // Students to add (in selectedStudents but not currently assigned)
        const studentsToAdd = selectedStudents.value.filter(uid => !currentlyAssignedUids.includes(uid));
        
        // Students to remove (currently assigned but not in selectedStudents)
        const studentsToRemove = currentlyAssignedUids.filter(uid => !selectedStudents.value.includes(uid));
        
        // Add new assignments
        for (const studentUid of studentsToAdd) {
          await assignAssessmentToStudent(assessmentId, studentUid, authStore.currentUser?.uid || 'system');
        }
        
        // Remove old assignments
        for (const studentUid of studentsToRemove) {
          await unassignAssessmentFromStudent(assessmentId, studentUid);
        }
        
        // Regrade all existing results with the updated assessment (e.g., new acceptable answers)
        let regradedCount = 0;
        try {
          regradedCount = await regradeAssessmentResults(assessmentId, assessment.value as Assessment);
          if (regradedCount > 0) {
            console.log(`✅ Regraded ${regradedCount} assessment result(s) with updated questions`);
          }
        } catch (regradeError) {
          console.warn('⚠️ Could not regrade existing results:', regradeError);
          // Don't fail the whole operation if regrading fails
        }
        
        // Set success message
        if (regradedCount > 0) {
          success.value = `Assessment updated and assigned to ${selectedStudents.value.length} students! ${regradedCount} existing result(s) were regraded with updated questions.`;
        } else {
          success.value = `Assessment updated and assigned to ${selectedStudents.value.length} students!`;
        }
      } else {
        // CREATION MODE: Create one assessment template and assign to students
        console.log('➕ CREATION MODE: Creating assessment template');
        
        // Create the assessment template (without student-specific fields)
        const assessmentData = {
          ...assessment.value,
          createdBy: authStore.currentUser?.uid || 'system',
          // Set academic period on the assessment
          academicPeriod: selectedQuarter.value === 'auto' 
            ? getAutoDetectedAcademicPeriod() 
            : selectedQuarter.value === 'all'
            ? 'all'
            : selectedQuarter.value
        };
        
        console.log(`📅 Saving assessment with academicPeriod: ${assessmentData.academicPeriod}`);
        
        // Ensure no student-specific fields in template
        delete (assessmentData as any).studentSeisId;
        delete (assessmentData as any).studentUid;
        
        const newAssessmentId = await createAssessment(assessmentData);
        savedAssessmentId = newAssessmentId; // Update for goal connection
        console.log('✅ Created assessment template:', newAssessmentId);
        
        // Assign to selected students
        // Note: Quarter is now stored on the assessment itself, not individual assignments
        for (const studentUid of selectedStudents.value) {
          await assignAssessmentToStudent(
            newAssessmentId, 
            studentUid, 
            authStore.currentUser?.uid || 'system'
          );
          console.log('✅ Assigned to student:', studentUid);
        }
        
        if (selectedStudents.value.length === 1) {
          success.value = 'Assessment created and assigned successfully!';
        } else {
          success.value = `Assessment created and assigned to ${selectedStudents.value.length} students!`;
        }
      }
    } else {
      // Create template assessment (no student assigned)
      const templateData = {
        ...assessment.value,
        createdBy: authStore.currentUser?.uid || 'system',
        // Set academic period on the assessment
        academicPeriod: selectedQuarter.value === 'auto' 
          ? getAutoDetectedAcademicPeriod() 
          : selectedQuarter.value === 'all'
          ? 'all'
          : selectedQuarter.value
      };
      
      console.log(`📅 Saving template assessment with academicPeriod: ${templateData.academicPeriod}`);
      
      if (isEditing.value) {
        await updateAssessment(assessmentId, templateData);
        
        // Regrade all existing results with the updated assessment (e.g., new acceptable answers)
        try {
          const regradedCount = await regradeAssessmentResults(assessmentId, assessment.value as Assessment);
          if (regradedCount > 0) {
            console.log(`✅ Regraded ${regradedCount} assessment result(s) with updated questions`);
            success.value = `Assessment template updated successfully! ${regradedCount} existing result(s) were regraded.`;
          } else {
            success.value = 'Assessment template updated successfully!';
          }
        } catch (regradeError) {
          console.warn('⚠️ Could not regrade existing results:', regradeError);
          success.value = 'Assessment template updated successfully!';
          // Don't fail the whole operation if regrading fails
        }
      } else {
        const newId = await createAssessment(templateData);
        savedAssessmentId = newId; // Update for goal connection
        success.value = 'Assessment template created successfully!';
      }
    }
    
    // Handle goal connection for Progress Assessments
    if (assessment.value.category === 'PA' && assessment.value.goalId) {
      try {
        await assignAssessmentToGoal(assessment.value.goalId, savedAssessmentId);
        console.log('✅ Connected assessment to goal:', assessment.value.goalId);
      } catch (err) {
        console.error('Error connecting assessment to goal:', err);
        // Don't fail the whole operation for goal connection issues
      }
    }
    
    // Redirect after short delay
    setTimeout(() => {
      router.push('/');
    }, 2000);
    
  } catch (err) {
    console.error('Error saving assessment:', err);
    error.value = 'Failed to save assessment. Please try again.';
  } finally {
    saving.value = false;
  }
};

const previewAssessment = () => {
  // Open preview in new tab/modal
  console.log('Preview assessment:', assessment.value);
  alert(`Assessment Preview: ${assessment.value.title}

Questions: ${assessment.value.questions.length}
Total Points: ${totalPoints.value}
Time Limit: ${assessment.value.timeLimit || 'No limit'} minutes

This would open a preview showing how students will see the assessment.`);
};

const printAssessment = () => {
  // Create a print-friendly window
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to print the assessment.');
    return;
  }

  const printContent = generatePrintHTML();
  printWindow.document.write(printContent);
  printWindow.document.close();
  
  // Wait for content to load, then trigger print
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
};

const generatePrintHTML = (): string => {
  const questions = assessment.value.questions;
  const halfPoint = Math.ceil(questions.length / 2);
  const page1Questions = questions.slice(0, halfPoint);
  const page2Questions = questions.slice(halfPoint);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${assessment.value.title} - Print</title>
  <style>
    @media print {
      @page {
        size: letter;
        margin: 0.5in;
      }
      
      body {
        margin: 0;
        padding: 0;
      }
      
      .page {
        page-break-after: always;
        page-break-inside: avoid;
      }
      
      .page:last-child {
        page-break-after: auto;
      }
      
      .question {
        page-break-inside: avoid;
      }
    }
    
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.4;
      color: #000;
    }
    
    .page {
      width: 100%;
      min-height: 10in;
      box-sizing: border-box;
    }
    
    .header {
      text-align: center;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    
    .header h1 {
      margin: 0 0 5px 0;
      font-size: 18pt;
      font-weight: bold;
    }
    
    .header .info {
      font-size: 10pt;
      margin: 5px 0;
    }
    
    .student-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
      font-size: 11pt;
    }
    
    .student-info .field {
      flex: 1;
      border-bottom: 1px solid #000;
      margin-right: 20px;
    }
    
    .student-info .field:last-child {
      margin-right: 0;
    }
    
    .question {
      margin-bottom: 20px;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: #f9f9f9;
    }
    
    .question-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      font-weight: bold;
    }
    
    .question-number {
      font-size: 13pt;
    }
    
    .question-points {
      font-size: 10pt;
      color: #666;
    }
    
    .question-text {
      margin-bottom: 12px;
      font-size: 11pt;
      line-height: 1.6;
    }
    
    .answer-space {
      border: 1px solid #000;
      min-height: 80px;
      padding: 10px;
      background: white;
      margin-top: 10px;
    }
    
    .answer-space.large {
      min-height: 120px;
    }
    
    .options {
      margin: 10px 0;
    }
    
    .option {
      margin: 8px 0;
      padding: 5px 0;
      font-size: 11pt;
    }
    
    .option-label {
      display: inline-block;
      width: 30px;
      font-weight: bold;
    }
    
    .instructions {
      background: #e8f4f8;
      border: 1px solid #b8d4e0;
      padding: 12px;
      margin-bottom: 20px;
      border-radius: 4px;
      font-size: 10pt;
    }
    
    .footer {
      margin-top: 30px;
      text-align: center;
      font-size: 10pt;
      color: #666;
      border-top: 1px solid #ccc;
      padding-top: 10px;
    }
    
    .standard-tag {
      display: inline-block;
      background: #e0e0e0;
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 9pt;
      margin-top: 5px;
    }
  </style>
</head>
<body>
  <!-- Page 1 -->
  <div class="page">
    <div class="header">
      <h1>${assessment.value.title}</h1>
      <div class="info">Grade ${assessment.value.gradeLevel} • ${assessment.value.category || 'Assessment'}</div>
      ${assessment.value.timeLimit ? `<div class="info">Time Limit: ${assessment.value.timeLimit} minutes</div>` : ''}
    </div>
    
    <div class="student-info">
      <div class="field">Name: _______________________</div>
      <div class="field">Date: _______________________</div>
      <div class="field">Score: ______ / ${totalPoints.value}</div>
    </div>
    
    ${assessment.value.instructions ? `
    <div class="instructions">
      <strong>Instructions:</strong> ${assessment.value.instructions}
    </div>
    ` : ''}
    
    ${page1Questions.map((q, index) => `
      <div class="question">
        <div class="question-header">
          <span class="question-number">${index + 1}.</span>
          <span class="question-points">(${q.points} ${q.points === 1 ? 'point' : 'points'})</span>
        </div>
        <div class="question-text">${q.questionText}</div>
        ${q.standard ? `<div class="standard-tag">Standard: ${q.standard}</div>` : ''}
        ${q.questionType === 'multiple-choice' && q.options ? `
          <div class="options">
            ${q.options.map((opt, i) => `
              <div class="option">
                <span class="option-label">${String.fromCharCode(65 + i)})</span> ${opt}
              </div>
            `).join('')}
          </div>
        ` : ''}
        ${q.questionType === 'short-answer' || q.questionType === 'essay' ? `
          <div class="answer-space ${q.questionType === 'essay' ? 'large' : ''}"></div>
        ` : ''}
        ${q.explanation ? `<div style="margin-top: 8px; font-size: 10pt; color: #666;"><em>Note: ${q.explanation}</em></div>` : ''}
      </div>
    `).join('')}
    
    ${page2Questions.length === 0 ? `<div class="footer">Total: ${assessment.value.questions.length} Questions • ${totalPoints.value} Points</div>` : ''}
  </div>
  
  ${page2Questions.length > 0 ? `
  <!-- Page 2 -->
  <div class="page">
    <div class="header">
      <h1>${assessment.value.title} (continued)</h1>
    </div>
    
    ${page2Questions.map((q, index) => `
      <div class="question">
        <div class="question-header">
          <span class="question-number">${halfPoint + index + 1}.</span>
          <span class="question-points">(${q.points} ${q.points === 1 ? 'point' : 'points'})</span>
        </div>
        <div class="question-text">${q.questionText}</div>
        ${q.standard ? `<div class="standard-tag">Standard: ${q.standard}</div>` : ''}
        ${q.questionType === 'multiple-choice' && q.options ? `
          <div class="options">
            ${q.options.map((opt, i) => `
              <div class="option">
                <span class="option-label">${String.fromCharCode(65 + i)})</span> ${opt}
              </div>
            `).join('')}
          </div>
        ` : ''}
        ${q.questionType === 'short-answer' || q.questionType === 'essay' ? `
          <div class="answer-space ${q.questionType === 'essay' ? 'large' : ''}"></div>
        ` : ''}
        ${q.explanation ? `<div style="margin-top: 8px; font-size: 10pt; color: #666;"><em>Note: ${q.explanation}</em></div>` : ''}
      </div>
    `).join('')}
    
    <div class="footer">Total: ${assessment.value.questions.length} Questions • ${totalPoints.value} Points</div>
  </div>
  ` : ''}
</body>
</html>
  `.trim();
};

const goBack = () => {
  if (confirm('Are you sure? Any unsaved changes will be lost.')) {
    router.push('/');
  }
};

// Load students from database
const loadStudents = async () => {
  try {
    loadingStudents.value = true;
    
    if (permissions.isAdmin) {
      // Admins can assign assessments to any student
      console.log('Loading all students for assessment assignment...');
      availableStudents.value = await getAllStudents();
    } else if (permissions.isTeacher && authStore.currentUser?.uid) {
      // Teachers can only assign assessments to their assigned students
      console.log('Loading teacher assigned students for assessment assignment...');
      availableStudents.value = await getStudentsByTeacher(authStore.currentUser.uid);
    } else {
      availableStudents.value = [];
    }
    
    console.log(`Loaded ${availableStudents.value.length} students for assessment assignment`);
    
  } catch (err: any) {
    console.error('Error loading students for assessment:', err);
    error.value = 'Failed to load students. Assessments can still be created as templates.';
  } finally {
    loadingStudents.value = false;
  }
};

// Load goals from database
const loadGoals = async () => {
  try {
    if (permissions.isAdmin) {
      // Admins can see all goals
      availableGoals.value = await getAllGoals();
    } else if (permissions.isTeacher && authStore.currentUser?.uid) {
      // Teachers can see goals they created
      availableGoals.value = await getGoalsByTeacher(authStore.currentUser.uid);
    } else {
      availableGoals.value = [];
    }
    
    console.log(`Loaded ${availableGoals.value.length} goals for assessment connection`);
    
  } catch (err: any) {
    console.error('Error loading goals for assessment:', err);
  }
};

// Helper methods for goal functionality
const getStudentName = (studentUid: string) => {
  const student = availableStudents.value.find(s => s.uid === studentUid);
  return student ? `${student.firstName} ${student.lastName}` : 'Unknown Student';
};

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return 'Not set';
  return new Date(dateString).toLocaleDateString();
};

const onCategoryChange = () => {
  // Load goals when Progress Assessment is selected
  if (assessment.value.category === 'PA' && availableGoals.value.length === 0) {
    loadGoals();
  }
};

// Watch for assessment changes to initialize noTimeLimit
watch(() => assessment.value.timeLimit, (newTimeLimit) => {
  noTimeLimit.value = newTimeLimit === 0;
}, { immediate: true });

// Load assessment if editing and load students
onMounted(() => {
  loadAssessment();
  loadStudents();
});
</script>

<style scoped>
.assessment-editor {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e5e7eb;
}

.header-content h1 {
  color: #1f2937;
  font-size: 2.5rem;
  margin-bottom: 10px;
}

.header-content p {
  color: #6b7280;
  font-size: 1.1rem;
}

.back-button {
  background: #f3f4f6;
  color: #374151;
  border: 2px solid #e5e7eb;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-button:hover {
  background: #e5e7eb;
}

.assessment-form {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.form-section {
  background: white;
  border-radius: 15px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.form-section h2 {
  color: #1f2937;
  font-size: 1.5rem;
  margin-bottom: 25px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.add-question-button {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-question-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.3);
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  color: #374151;
  font-weight: 600;
  font-size: 0.9rem;
}

.form-input,
.form-select,
.form-textarea {
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.form-help {
  color: #6b7280;
  font-size: 0.8rem;
  font-style: italic;
}

.checkbox-label {
  display: flex !important;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: normal !important;
  font-size: 0.9rem;
  margin-bottom: 8px;
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.file-upload-options {
  margin-left: 20px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 10px;
  border-left: 4px solid #667eea;
}

.multi-page-options {
  margin-left: 20px;
  padding: 15px;
  background: #f0f4ff;
  border-radius: 8px;
  border-left: 3px solid #10b981;
  margin-top: 10px;
}

.page-labels {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.page-label-input {
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-number {
  min-width: 70px;
  font-weight: 500;
  color: #374151;
  font-size: 0.9rem;
}

.file-types-selection {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px;
  margin-top: 10px;
}

.upload-preview,
.retake-preview {
  margin-top: 20px;
  padding: 15px;
  background: #f0f4ff;
  border-radius: 10px;
  border: 2px dashed #c7d2fe;
}

.retake-preview {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.upload-preview h4 {
  color: #1f2937;
  font-size: 1rem;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-card {
  background: white;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e5e7eb;
}

.preview-icon {
  font-size: 1.2rem;
}

.required-badge {
  background: #fef2f2;
  color: #dc2626;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 500;
  text-transform: uppercase;
}

.retake-badge {
  background: #f0fdf4;
  color: #166534;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 500;
}

.preview-content p {
  color: #374151;
  margin-bottom: 15px;
  font-size: 0.9rem;
}

.preview-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.preview-btn {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: default;
  opacity: 0.7;
}

.preview-info {
  color: #6b7280;
  font-size: 0.7rem;
  text-align: center;
}

.accommodations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 12px;
  margin-bottom: 15px;
}

.accommodation-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.accommodation-checkbox:hover {
  background: #f9fafb;
}

.students-assignment {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.student-checkboxes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 10px;
  max-height: 200px;
  overflow-y: auto;
  padding: 15px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
}

.student-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.student-checkbox:hover {
  background: #f3f4f6;
}

.students-loading {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px;
  justify-content: center;
  color: #6b7280;
}

.loading-spinner-small {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f4f6;
  border-top: 2px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.no-students-available {
  padding: 20px;
  text-align: center;
  background: #f9fafb;
  border-radius: 8px;
  border: 2px dashed #e5e7eb;
}

.no-students-available p {
  color: #6b7280;
  margin: 0 0 8px 0;
}

.assignment-summary {
  padding: 10px 15px;
  background: #f0f4ff;
  border-radius: 8px;
  text-align: center;
  margin-top: 15px;
}

.custom-accommodation {
  display: flex;
  gap: 10px;
  align-items: center;
}

.add-button {
  background: #10b981;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.add-button:hover:not(:disabled) {
  background: #059669;
}

.add-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.question-item {
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 25px;
  background: #fafafa;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.question-header h3 {
  color: #1f2937;
  font-size: 1.2rem;
  margin: 0;
}

.question-actions {
  display: flex;
  gap: 8px;
}

.move-button,
.remove-button {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.move-button {
  background: #f3f4f6;
  color: #374151;
}

.move-button:hover:not(:disabled) {
  background: #e5e7eb;
}

.move-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.remove-button {
  background: #fef2f2;
  color: #dc2626;
}

.remove-button:hover {
  background: #fee2e2;
}

/* Question Standards Accordion */
.accordion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.accordion-header:hover {
  background: #e9ecef;
  border-color: #667eea;
}

.accordion-header label {
  font-weight: 600;
  color: #495057;
  margin: 0;
}

.accordion-toggle {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.current-standard {
  padding: 0.25rem 0.75rem;
  color: white;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.current-standard.custom-standard {
  background: #667eea; /* Blue for custom standards */
}

.current-standard.ccss-standard {
  background: #28a745; /* Green for CCSS standards */
}

.no-standard {
  padding: 0.25rem 0.75rem;
  background: #e9ecef;
  color: #6c757d;
  border-radius: 12px;
  font-size: 0.85rem;
  font-style: italic;
}

.accordion-icon {
  font-size: 0.9rem;
  color: #667eea;
  font-weight: bold;
  transition: transform 0.3s ease;
}

.accordion-icon.expanded {
  transform: rotate(90deg);
}

.accordion-content {
  margin-top: 0.75rem;
  padding: 1rem;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  border-top: none;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}

.standards-help {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #e3f2fd;
  border: 1px solid #bbdefb;
  border-radius: 4px;
}

.standards-help small {
  color: #1976d2;
  font-weight: 500;
}

/* Checkbox styling */
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.75rem;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.checkbox-label:hover {
  background: #e9ecef;
  border-color: #667eea;
}

.form-checkbox {
  width: 18px;
  height: 18px;
  accent-color: #667eea;
  cursor: pointer;
}

.checkbox-text {
  font-weight: 500;
  color: #495057;
  user-select: none;
}

.question-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.options-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.option-item .form-input {
  flex: 1;
}

.correct-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  font-size: 0.9rem;
  color: #374151;
}

.remove-option-button {
  width: 28px;
  height: 28px;
  background: #fef2f2;
  color: #dc2626;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.remove-option-button:hover:not(:disabled) {
  background: #fee2e2;
}

.remove-option-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.add-option-button {
  background: #f0f4ff;
  color: #3730a3;
  border: 2px solid #c7d2fe;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  align-self: flex-start;
}

.add-option-button:hover:not(:disabled) {
  background: #e0e7ff;
}

.add-option-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.acceptable-answers {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.acceptable-answer-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.acceptable-answer-item .form-input {
  flex: 1;
}

.remove-answer-button,
.add-answer-button {
  background: #f3f4f6;
  color: #374151;
  border: 2px solid #e5e7eb;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.remove-answer-button {
  width: 28px;
  height: 28px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fef2f2;
  color: #dc2626;
  border-color: #fecaca;
}

.remove-answer-button:hover {
  background: #fee2e2;
}

.add-answer-button {
  align-self: flex-start;
  background: #f0f4ff;
  color: #3730a3;
  border-color: #c7d2fe;
}

.add-answer-button:hover {
  background: #e0e7ff;
}

.true-false-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.radio-group {
  display: flex;
  gap: 20px;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.answer-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.no-questions {
  text-align: center;
  padding: 40px 20px;
  color: #6b7280;
  font-style: italic;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #f8fafc;
  border-radius: 8px;
  border-left: 4px solid #10b981;
}

.summary-label {
  color: #6b7280;
  font-weight: 500;
}

.summary-value {
  color: #1f2937;
  font-weight: bold;
  font-size: 1.1rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  padding: 20px 0;
  border-top: 2px solid #e5e7eb;
}

.cancel-button,
.preview-button,
.print-button,
.save-button {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.cancel-button {
  background: #f3f4f6;
  color: #374151;
  border: 2px solid #e5e7eb;
}

.cancel-button:hover {
  background: #e5e7eb;
}

.preview-button {
  background: #fef3c7;
  color: #92400e;
  border: 2px solid #f59e0b;
}

.preview-button:hover:not(:disabled) {
  background: #fde68a;
}

.preview-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.print-button {
  background: #dbeafe;
  color: #1e40af;
  border: 2px solid #3b82f6;
}

.print-button:hover:not(:disabled) {
  background: #bfdbfe;
}

.print-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.save-button {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  min-width: 150px;
}

.save-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
}

.save-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  background: #fef2f2;
  color: #dc2626;
  border: 2px solid #fecaca;
  border-radius: 10px;
  padding: 15px;
  margin-top: 20px;
  text-align: center;
}

.success-message {
  background: #f0fdf4;
  color: #166534;
  border: 2px solid #bbf7d0;
  border-radius: 10px;
  padding: 15px;
  margin-top: 20px;
  text-align: center;
}

/* Goal Connection Styles */
.goal-connection {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1.5rem;
  margin: 1rem 0;
}

.goal-connection h3 {
  margin: 0 0 0.5rem 0;
  color: #495057;
  font-size: 1.1rem;
}

.section-description {
  color: #6c757d;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.connected-goal-info {
  margin-top: 1rem;
}

.goal-card {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 1rem;
}

.goal-card h4 {
  margin: 0 0 1rem 0;
  color: #495057;
  font-size: 1rem;
}

.goal-details {
  font-size: 0.875rem;
}

.detail-row {
  display: flex;
  margin-bottom: 0.5rem;
  gap: 0.5rem;
}

.detail-row strong {
  min-width: 100px;
  color: #495057;
}

.detail-row span {
  flex: 1;
  color: #6c757d;
}

@media (max-width: 768px) {
  .assessment-editor {
    padding: 15px;
  }
  
  .editor-header {
    flex-direction: column;
    gap: 20px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .accommodations-grid {
    grid-template-columns: 1fr;
  }
  
  .summary-grid {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .option-item {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .question-actions {
    flex-wrap: wrap;
  }
}

.fraction-config, .matching-config, .rank-order-config, .checkbox-config {
  background: #f8fafc;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.fraction-answers-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 15px;
}

.fraction-answer-item {
  display: flex;
  gap: 10px;
  align-items: center;
}

.fraction-answer-item input {
  flex: 1;
}

.migration-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.migration-modal {
  background: white;
  padding: 40px;
  border-radius: 12px;
  text-align: center;
  max-width: 400px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.migration-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.migration-modal h3 {
  color: #1f2937;
  margin-bottom: 10px;
}

.migration-modal p {
  color: #6b7280;
  margin: 0;
}

.standards-preview {
  margin-top: 10px;
  padding: 12px;
  background: #f0f9ff;
  border-radius: 6px;
  border: 1px solid #bae6fd;
}

.standards-label {
  font-weight: 500;
  color: #0369a1;
  font-size: 0.9rem;
  display: block;
  margin-bottom: 8px;
}

.standards-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.standard-tag {
  background: #0ea5e9;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

/* Matching question styles */
.matching-pairs-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.matching-pair-item {
  background: white;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.pair-inputs {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pair-input {
  flex: 1;
}

.pair-connector {
  font-size: 1.2rem;
  color: #64748b;
  font-weight: bold;
}

/* Rank order question styles */
.rank-items-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rank-item {
  display: flex;
  align-items: center;
  gap: 10px;
  background: white;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.item-number {
  background: #0ea5e9;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: bold;
  flex-shrink: 0;
}

.rank-input {
  flex: 1;
}

.correct-order-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
}

.correct-order-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.order-number {
  background: #10b981;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: bold;
  flex-shrink: 0;
}

/* Checkbox question styles */
.checkbox-options-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.checkbox-option-item {
  background: white;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.option-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.correct-checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.option-input {
  flex: 1;
}

.option-help {
  color: #6b7280;
  font-size: 0.85rem;
  margin-top: 5px;
  display: block;
}

.correct-answers-summary {
  margin-top: 20px;
  padding: 15px;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.correct-answers-summary strong {
  color: #374151;
  margin-right: 10px;
}

.no-correct {
  color: #dc2626;
  font-weight: 500;
}

.correct-count {
  color: #059669;
  font-weight: 500;
}

.time-limit-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.time-limit-controls .checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.time-limit-controls .form-input {
  width: 100px;
}

.time-unit {
  color: #6b7280;
  font-size: 0.9rem;
  margin-left: 8px;
}

/* LaTeX Editor Styles for Answer Options */
.option-latex-editor {
  flex: 1;
  border-radius: 6px;
}

.pair-latex-editor {
  flex: 1;
  max-width: 300px;
  border-radius: 6px;
}

.rank-latex-editor {
  flex: 1;
  border-radius: 6px;
}

/* Adjust option item layout for LaTeX editors */
.option-item {
  align-items: flex-start;
  gap: 15px;
}

.pair-inputs {
  align-items: flex-start;
}

/* Assignment Mode Styles */
.assignment-modes {
  background: #f9fafb;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.assignment-mode-selector {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

/* Quarter Selection Styles */
.quarter-selection {
  background: #f0f9ff;
  padding: 20px;
  border-radius: 8px;
  border: 2px solid #3b82f6;
  margin: 20px 0;
}

.quarter-selection h4 {
  color: #1e40af;
  margin: 0 0 15px 0;
  font-size: 1.1rem;
}

.quarter-selection .form-label {
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.quarter-selection .help-text {
  display: block;
  font-size: 0.85rem;
  color: #6b7280;
  font-weight: normal;
  margin-top: 4px;
}

.quarter-selection .form-select {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #cbd5e1;
  border-radius: 6px;
  font-size: 1rem;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s;
}

.quarter-selection .form-select:hover {
  border-color: #3b82f6;
}

.quarter-selection .form-select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.quarter-selection .form-help {
  display: block;
  margin-top: 10px;
  padding: 10px;
  background: #dbeafe;
  border-radius: 4px;
  font-size: 0.85rem;
  color: #1e40af;
  line-height: 1.5;
}

.mode-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-option:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.mode-option:has(input:checked) {
  border-color: #10b981;
  background: #f0fdf4;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.1);
}

.mode-option input[type="radio"] {
  width: 18px;
  height: 18px;
}

.mode-option span {
  font-weight: 500;
  color: #374151;
}

.class-selection, .individual-selection {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  margin-top: 15px;
}

.class-selection h4, .individual-selection h4 {
  color: #1f2937;
  margin-bottom: 15px;
  font-size: 1rem;
}

.class-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.class-checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: #f9fafb;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.class-checkbox:hover {
  background: #f3f4f6;
}

.class-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
}

.student-search {
  margin-bottom: 15px;
}

.student-search .form-input {
  width: 100%;
}

.student-checkboxes {
  max-height: 300px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.student-checkbox {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
  background: #f9fafb;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.student-checkbox:hover {
  background: #f3f4f6;
}

.student-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  margin-right: 10px;
}

.assignment-summary {
  background: #e0f2fe;
  padding: 15px;
  border-radius: 6px;
  margin-top: 15px;
  border: 1px solid #0891b2;
}

.assignment-summary strong {
  color: #0c4a6e;
  display: block;
  margin-bottom: 5px;
}

.assignment-summary .form-help {
  color: #0369a1;
  margin: 0;
}
</style>
