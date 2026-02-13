<template>
  <div class="goal-template-management">
    <div class="page-header">
      <h1>📋 Goal Template Management</h1>
      <p>Create and manage goal templates to quickly generate IEP goals</p>
    </div>

    <!-- Controls -->
    <div class="controls-section">
      <button @click="showCreateModal = true" class="btn btn-primary">
        <span class="icon">➕</span>
        Create New Template
      </button>
      <button @click="showDraftGeneratorModal = true" class="btn btn-success">
        <span class="icon">🤖</span>
        Generate Draft from Goal
      </button>
      <div class="filters">
        <select v-model="filterSubject" class="filter-select">
          <option value="">All Subjects</option>
          <option value="math">Math</option>
          <option value="ela">ELA</option>
          <option value="other">Other</option>
        </select>
        <select v-model="filterActive" class="filter-select">
          <option value="">All Templates</option>
          <option value="true">Active Only</option>
          <option value="false">Inactive Only</option>
        </select>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search templates..."
          class="search-input"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading templates...</p>
    </div>

    <!-- Templates List -->
    <div v-else-if="filteredTemplates.length === 0" class="empty-state">
      <div class="empty-icon">📋</div>
      <h3>No Templates Found</h3>
      <p>{{ searchQuery || filterSubject ? 'No templates match your filters.' : 'Create your first template to get started.' }}</p>
      <button @click="showCreateModal = true" class="btn btn-primary">Create First Template</button>
    </div>

    <div v-else class="templates-grid">
      <div
        v-for="template in filteredTemplates"
        :key="template.id"
        class="template-card"
        :class="{ inactive: !template.isActive }"
      >
        <div class="template-header">
          <div class="template-title-section">
            <h3>{{ template.name }}</h3>
            <div class="template-badges">
              <span class="badge badge-subject" :class="`badge-${template.subject}`">
                {{ template.subject.toUpperCase() }}
              </span>
              <span v-if="template.topic" class="badge badge-topic">
                {{ template.topic }}
              </span>
              <span class="badge" :class="`badge-assessment-${template.assessmentMethod}`">
                {{ template.assessmentMethod === 'app' ? '📱 App' : template.assessmentMethod === 'paper' ? '📄 Paper' : '🔄 Hybrid' }}
              </span>
              <span v-if="!template.isActive" class="badge badge-inactive">
                Inactive
              </span>
            </div>
          </div>
          <div class="template-actions">
            <button @click="generateGoalFromTemplate(template)" class="btn-icon" title="Generate Goal from Template">
              🎯
            </button>
            <button @click="editTemplate(template)" class="btn-icon" title="Edit">
              ✏️
            </button>
            <button @click="createFromTemplate(template)" class="btn-icon" title="Save as New Template">
              📄
            </button>
            <button
              @click="toggleTemplateActive(template)"
              class="btn-icon"
              :title="template.isActive ? 'Deactivate' : 'Activate'"
            >
              {{ template.isActive ? '👁️' : '👁️‍🗨️' }}
            </button>
            <button @click="handleDeleteTemplate(template)" class="btn-icon btn-danger" title="Delete">
              🗑️
            </button>
          </div>
        </div>

        <div class="template-content">
          <div class="template-field">
            <strong>Area of Need:</strong>
            <span>{{ template.areaOfNeed }}</span>
          </div>
          <div v-if="template.description" class="template-field description-field">
            <strong>Description:</strong>
            <div class="description-content">{{ template.description }}</div>
          </div>
          <div class="template-field">
            <strong>Goal Title Template:</strong>
            <code class="template-code">{{ template.goalTitleTemplate }}</code>
          </div>
          <div class="template-field">
            <strong>Goal Text Template:</strong>
            <code class="template-code">{{ truncateText(template.goalTextTemplate, 150) }}</code>
          </div>
          <div v-if="template.defaultGradeLevel" class="template-field">
            <strong>Default Grade Level:</strong>
            <span>{{ template.defaultGradeLevel }}</span>
          </div>
          <div v-if="template.defaultStandard" class="template-field">
            <strong>Default Standard:</strong>
            <span>{{ template.defaultStandard }}</span>
          </div>
          <div v-if="template.defaultThreshold" class="template-field">
            <strong>Default Threshold:</strong>
            <span>{{ template.defaultThreshold }}</span>
          </div>
          <div v-if="template.allowedOperations && template.allowedOperations.length > 0" class="template-field">
            <strong>🔒 Allowed Operations:</strong>
            <span class="operations-badges">
              <span v-for="op in template.allowedOperations" :key="op" class="operation-badge">{{ op }}</span>
            </span>
          </div>
          <div v-if="template.questionCategory" class="template-field">
            <strong>📝 Question Category:</strong>
            <span class="category-badge">
              {{ template.questionCategory === 'computation' ? '🧮 Computation' :
                 template.questionCategory === 'word-problem' ? '📖 Word Problem' :
                 template.questionCategory === 'conceptual' ? '🧠 Conceptual' :
                 template.questionCategory === 'application' ? '🎯 Application' : template.questionCategory }}
            </span>
          </div>
          <div class="template-field">
            <strong>🔗 Linked Goals:</strong>
            <div v-if="getLinkedGoals(template.id).length > 0" class="linked-goals-list">
              <div v-for="goal in getLinkedGoals(template.id)" :key="goal.id" class="linked-goal-item">
                <span class="goal-title">{{ goal.goalTitle }}</span>
                <span class="goal-student">{{ getGoalStudents(goal) }}</span>
              </div>
            </div>
            <span v-else class="no-linked-goals">No goals currently using this template</span>
          </div>
          <div v-if="template.exampleQuestion" class="template-field example-question-preview">
            <strong>⭐ Example Question:</strong>
            <div class="example-question-content">
              <div><strong>Question:</strong> {{ template.exampleQuestion }}</div>
              <div v-if="template.exampleAnswer"><strong>Answer:</strong> {{ template.exampleAnswer }}</div>
              <div v-if="template.exampleAlternativeAnswers"><strong>Alternative Answers:</strong> {{ template.exampleAlternativeAnswers }}</div>
              <div v-if="template.exampleExplanation"><strong>Explanation:</strong> {{ template.exampleExplanation }}</div>
            </div>
          </div>
        </div>

        <div class="template-footer">
          <div class="template-usage-summary">
            <div
              v-if="getLinkedGoals(template.id).length > 0"
              class="usage-stat goals-stat"
              :title="getLinkedGoals(template.id).map(g => `• ${g.goalTitle} (${getGoalStudents(g)})`).join('\n')"
            >
              <span class="usage-count">{{ getLinkedGoals(template.id).length }}</span>
              <span class="usage-label">Goal{{ getLinkedGoals(template.id).length !== 1 ? 's' : '' }}</span>
            </div>
            <div
              v-if="getTemplateStudentCount(template.id) > 0"
              class="usage-stat students-stat"
              :title="getTemplateStudentNames(template.id)"
            >
              <span class="usage-count">{{ getTemplateStudentCount(template.id) }}</span>
              <span class="usage-label">Student{{ getTemplateStudentCount(template.id) !== 1 ? 's' : '' }}</span>
            </div>
            <span v-if="getLinkedGoals(template.id).length === 0 && getTemplateStudentCount(template.id) === 0" class="no-usage">
              Not currently in use
            </span>
          </div>
          <div class="template-meta">
            <span v-if="template.usageCount !== undefined">
              Used {{ template.usageCount }} time{{ template.usageCount !== 1 ? 's' : '' }}
            </span>
            <span v-if="template.createdAt">
              Created {{ formatDate(template.createdAt) }}
            </span>
          </div>
          <button @click="previewTemplate(template)" class="btn btn-secondary btn-sm">
            👁️ Preview
          </button>
        </div>
      </div>
    </div>

    <!-- AI Draft Generator Modal -->
    <div v-if="showDraftGeneratorModal" class="modal-overlay" @click="closeDraftGenerator">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>🤖 Generate Template Draft from Goal</h2>
          <button @click="closeDraftGenerator" class="btn-close">✕</button>
        </div>

        <div class="modal-body">
          <p class="info-text">
            Paste your IEP goal text below, and AI will analyze it to generate a structured template with example questions, number ranges, and variation instructions.
          </p>

          <form @submit.prevent="generateDraft" class="draft-generator-form">
            <div class="form-group">
              <label>Goal Title (optional)</label>
              <input
                v-model="draftInput.goalTitle"
                type="text"
                placeholder="e.g., One-step word problem involving a percentage"
              />
            </div>

            <div class="form-group">
              <label>Area of Need (optional)</label>
              <input
                v-model="draftInput.areaOfNeed"
                type="text"
                placeholder="e.g., Math - Percentage"
              />
            </div>

            <div class="form-group">
              <label>Goal Text *</label>
              <textarea
                v-model="draftInput.goalText"
                required
                rows="6"
                placeholder="Paste the full IEP goal text here...

Example: 'Given five one-step word problems involving a percentage read aloud, Mikah will use a percent calculation strategy to identify the correct part, whole, or percent and state or write the correct answer with 80% accuracy, on 2 out of 3 progress monitoring assessments.'"
              ></textarea>
            </div>

            <div v-if="draftGenerating" class="generating-status">
              <div class="spinner"></div>
              <p>AI is analyzing the goal and generating a template draft...</p>
              <small>This may take 10-20 seconds</small>
            </div>

            <div v-if="draftError" class="error-message">
              ❌ {{ draftError }}
            </div>

            <div class="modal-actions">
              <button type="button" @click="closeDraftGenerator" class="btn btn-secondary" :disabled="draftGenerating">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary" :disabled="!draftInput.goalText || draftGenerating">
                {{ draftGenerating ? 'Generating...' : '🤖 Generate Draft' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Generate Goal from Template Modal -->
    <div v-if="showGenerateGoalModal && selectedTemplateForGoal" class="modal-overlay" @click="closeGenerateGoal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>🎯 Generate Goal from Template</h2>
          <button @click="closeGenerateGoal" class="btn-close">✕</button>
        </div>

        <div class="modal-body">
          <p class="info-text">
            Fill in the variables to generate a goal from the "{{ selectedTemplateForGoal.name }}" template.
          </p>

          <form @submit.prevent="confirmGenerateGoal" class="generate-goal-form">
            <!-- Variable Inputs (dynamically generated from template) -->
            <div v-if="goalVariables.length > 0" class="form-section">
              <h3>Goal Variables</h3>
              <div v-for="variable in goalVariables" :key="variable" class="form-group">
                <label>
                  {{ formatVariableName(variable) }}
                  <span v-if="variable === 'gradeLevel'" class="required-indicator">*</span>
                </label>
                <input
                  v-model="goalGenerationData.variables[variable]"
                  type="text"
                  :placeholder="getVariablePlaceholder(variable)"
                  :required="variable === 'gradeLevel'"
                  :class="{ 'field-error': goalGenerationError && variable === 'gradeLevel' && !goalGenerationData.variables[variable] }"
                />
                <small v-if="variable === 'gradeLevel'" class="field-help">
                  Required field - enter a grade level (e.g., 7, 8, 9)
                </small>
              </div>
            </div>

            <!-- Assign to Teacher (Admins only) -->
            <div v-if="authStore.isAdmin" class="form-section">
              <h3>Assign to Teacher *</h3>
              <div class="form-group">
                <label for="teacherSelect">Select Teacher</label>
                <select 
                  id="teacherSelect"
                  v-model="goalGenerationData.selectedTeacher"
                  required
                  class="form-select"
                >
                  <option value="">Select a teacher...</option>
                  <option 
                    v-for="teacher in availableTeachers" 
                    :key="teacher.uid" 
                    :value="teacher.uid"
                  >
                    {{ teacher.displayName || `${teacher.firstName} ${teacher.lastName}` }} ({{ teacher.email }})
                  </option>
                </select>
                <small class="field-help">
                  Required - The teacher who will manage this goal
                </small>
              </div>
            </div>

            <!-- Optional: Assign Students -->
            <div class="form-section">
              <h3>Assign Students (Optional)</h3>
              <div class="form-group">
                <div class="student-selector-header">
                  <label>Select Students</label>
                  <div class="student-selector-actions">
                    <button
                      type="button"
                      @click="selectAllStudents"
                      class="btn-link"
                      :disabled="availableStudents.length === 0"
                    >
                      Select All
                    </button>
                    <span class="separator">|</span>
                    <button
                      type="button"
                      @click="clearAllStudents"
                      class="btn-link"
                      :disabled="goalGenerationData.selectedStudents.length === 0"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                <div class="student-selection-list">
                  <div v-if="loadingStudents" class="loading-students">
                    <div class="spinner-small"></div>
                    <span>Loading students...</span>
                  </div>
                  <div v-else-if="availableStudents.length === 0" class="no-students">
                    No students available
                  </div>
                  <div v-else>
                    <div
                      v-for="student in availableStudents"
                      :key="student.uid"
                      class="student-option"
                    >
                      <label :for="`student-${student.uid}`" class="student-label">
                        <input
                          :id="`student-${student.uid}`"
                          type="checkbox"
                          :value="student.uid"
                          :checked="goalGenerationData.selectedStudents.includes(student.uid)"
                          @change="toggleStudentSelection(student.uid)"
                        />
                        <span>{{ student.displayName || student.firstName + ' ' + student.lastName }}</span>
                      </label>
                    </div>
                  </div>
                </div>
                <div v-if="goalGenerationData.selectedStudents.length > 0" class="selected-count">
                  {{ goalGenerationData.selectedStudents.length }} student(s) selected
                </div>
              </div>
            </div>

            <div v-if="goalGenerationError" class="error-message">
              ❌ {{ goalGenerationError }}
            </div>

            <div class="modal-actions">
              <button type="button" @click="closeGenerateGoal" class="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary" :disabled="generatingGoal">
                {{ generatingGoal ? 'Creating Goal...' : '✅ Create Goal' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showCreateModal || showEditModal" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ showEditModal ? 'Edit Template' : 'Create New Template' }}</h2>
          <button @click="handleCloseModal" class="btn-close" title="Close">✕</button>
        </div>

        <form @submit.prevent="saveTemplate" class="template-form">
          <div class="form-group">
            <label>Template Name *</label>
            <input
              v-model="formData.name"
              type="text"
              required
              placeholder="e.g., Two-Step Word Problems - Math"
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
                placeholder="e.g., two-step word problem, fraction, reading comprehension"
              />
            </div>
          </div>

          <div class="form-group">
            <label>Area of Need *</label>
            <input
              v-model="formData.areaOfNeed"
              type="text"
              required
              placeholder="e.g., Math Computation, Reading Comprehension"
            />
          </div>

          <div class="form-group">
            <label>Goal Title Template *</label>
            <input
              v-model="formData.goalTitleTemplate"
              type="text"
              required
              placeholder="e.g., {{topic}} - Grade {{gradeLevel}}"
            />
            <small class="form-hint" v-text="'Use {{variableName}} for variables (e.g., {{topic}}, {{gradeLevel}}, {{threshold}})'">
            </small>
          </div>

          <div class="form-group">
            <label>Goal Text Template *</label>
            <textarea
              v-model="formData.goalTextTemplate"
              required
              rows="4"
              placeholder="e.g., Given a {topic}, the student will solve {threshold} correctly {condition}"
            ></textarea>
            <small class="form-hint" v-text="'Use {{variableName}} for variables'">
            </small>
          </div>

          <div class="form-group">
            <label>Baseline Template (optional)</label>
            <textarea
              v-model="formData.baselineTemplate"
              rows="2"
              placeholder="e.g., Student currently solves {topic} with {threshold} accuracy"
            ></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Default Grade Level</label>
              <input
                v-model.number="formData.defaultGradeLevel"
                type="number"
                min="1"
                max="12"
                placeholder="7"
              />
            </div>

            <div class="form-group">
              <label>Default Standard</label>
              <input
                v-model="formData.defaultStandard"
                type="text"
                placeholder="e.g., 7.EE.4a"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Default Threshold</label>
              <input
                v-model="formData.defaultThreshold"
                type="text"
                placeholder="e.g., 80% or 4 out of 5"
              />
            </div>

            <div class="form-group">
              <label>Default Condition</label>
              <input
                v-model="formData.defaultCondition"
                type="text"
                placeholder="e.g., in 3 out of 4 trials"
              />
            </div>
          </div>

          <div class="form-group">
            <label>Assessment Method *</label>
            <select v-model="formData.assessmentMethod" required>
              <option value="app">App (Automated/Digital Assessment)</option>
              <option value="paper">Paper (Manual Assessment/Grading)</option>
              <option value="hybrid">Hybrid (Combination of App and Paper)</option>
            </select>
            <small class="form-hint">
              <strong>App:</strong> Can be assessed through automated question generation<br>
              <strong>Paper:</strong> Requires manual assessment, rubrics, or teacher observation<br>
              <strong>Hybrid:</strong> Combines digital questions with paper components
            </small>
          </div>

          <div v-if="formData.subject === 'math'" class="form-group">
            <label>🔒 Allowed Operations (Math Only) - Optional</label>
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  value="addition"
                  v-model="formData.allowedOperations"
                />
                <span>Addition</span>
              </label>
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  value="subtraction"
                  v-model="formData.allowedOperations"
                />
                <span>Subtraction</span>
              </label>
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  value="multiplication"
                  v-model="formData.allowedOperations"
                />
                <span>Multiplication</span>
              </label>
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  value="division"
                  v-model="formData.allowedOperations"
                />
                <span>Division</span>
              </label>
            </div>
            <small class="form-hint">
              🔒 Restrict which operations can be used in generated questions.
            </small>
          </div>

          <div class="form-group">
            <label>📝 Question Category (Recommended)</label>
            <select v-model="formData.questionCategory">
              <option value="">Auto-detect from goal text</option>
              <option value="computation">🧮 Computation - Direct calculations (stacked format)</option>
              <option value="word-problem">📖 Word Problem - Real-world scenarios with context</option>
              <option value="conceptual">🧠 Conceptual - Understanding and explanation</option>
              <option value="application">🎯 Application - Apply skills in context</option>
            </select>
            <small class="form-hint">
              <strong>⚠️ IMPORTANT:</strong> This setting overrides auto-detection and ensures the AI creates the correct question type.
              <br><br>
              <strong>Computation:</strong> For goals about "operations", "calculate", "compute". Creates direct problems like "143 + 23" in stacked format.
              <br>
              <strong>Word Problem:</strong> For goals with "word problem", "real-world", or "scenario". Creates story-based problems.
            </small>
          </div>

          <div v-if="formData.assessmentMethod === 'paper' || formData.assessmentMethod === 'hybrid'" class="form-group">
            <label>Rubric (optional)</label>
            <select v-model="formData.rubricId">
              <option value="">No rubric (create one later)</option>
              <option v-for="rubric in availableRubrics" :key="rubric.id" :value="rubric.id">
                {{ rubric.name }} ({{ rubric.totalPoints }} points)
              </option>
            </select>
            <small class="form-hint">
              Select a rubric for scoring paper-based assessments.
              <a href="#" @click.prevent="showRubricModal = true" class="link">Create new rubric</a>
            </small>
          </div>

          <div class="form-group">
            <label>Description (optional)</label>
            <textarea
              v-model="formData.description"
              rows="2"
              placeholder="Template description and usage notes..."
            ></textarea>
          </div>

          <!-- EXAMPLE QUESTION SECTION - MOST IMPORTANT -->
          <div class="example-question-section">
            <h6 class="section-title">⭐ Example Question (Most Important)</h6>
            <p class="section-description">This example question will be used to generate accurate similar questions. This is the most important part of the template!</p>

            <div class="form-group">
              <label>Example Question Text *</label>
              <textarea
                v-model="formData.exampleQuestion"
                required
                rows="4"
                class="form-control example-field"
                placeholder="Enter the example question text..."
              ></textarea>
            </div>

            <div class="form-group">
              <label>Example Correct Answer *</label>
              <input
                v-model="formData.exampleAnswer"
                type="text"
                required
                class="form-control example-field"
                placeholder="Enter the correct answer..."
              />
            </div>

            <div class="form-group">
              <label>Example Alternative Answers (comma-separated)</label>
              <input
                v-model="formData.exampleAlternativeAnswers"
                type="text"
                class="form-control"
                placeholder="e.g., 5, 5 minutes, 5 min"
              />
              <small class="form-text">Other acceptable answer formats</small>
            </div>

            <div class="form-group">
              <label>Example Explanation (Optional)</label>
              <textarea
                v-model="formData.exampleExplanation"
                rows="3"
                class="form-control"
                placeholder="Enter explanation for the example question..."
              ></textarea>
            </div>

            <div class="form-group">
              <label>🎥 Khan Academy Video URL (Optional)</label>
              <input
                v-model="formData.khanAcademyVideoUrl"
                type="url"
                class="form-control"
                placeholder="https://www.khanacademy.org/math/..."
              />
              <small class="form-text">
                Add a Khan Academy video link to help students learn this concept
              </small>
            </div>
          </div>

          <!-- PROBLEM STRUCTURE SECTION - NEW -->
          <div class="problem-structure-section">
            <h6 class="section-title">🎯 Problem Structure (For AI Generation)</h6>
            <p class="section-description">Define how AI should vary questions while keeping the same structure. This prevents AI from changing the problem type.</p>

            <div class="form-row">
              <div class="form-group" v-if="formData.questionCategory !== 'computation'">
                <label>Number of Steps</label>
                <select v-model.number="formData.problemStructure.numberOfSteps">
                  <option :value="undefined">Not specified</option>
                  <option :value="1">1 Step</option>
                  <option :value="2">2 Steps</option>
                  <option :value="3">3 Steps</option>
                  <option :value="4">4 Steps</option>
                </select>
                <small class="form-hint">For word problems: how many steps to solve?</small>
              </div>
              <div v-else class="form-group">
                <small class="form-hint" style="color: #666; font-style: italic;">
                  ℹ️ Computation problems are single-step direct calculations. No multi-step needed.
                </small>
              </div>
            </div>

            <div class="form-group">
              <label>Question Types (comma-separated)</label>
              <input
                v-model="formData.problemStructure.questionTypesText"
                type="text"
                placeholder="e.g., find-percent, find-part, find-whole"
              />
              <small class="form-hint">
                Variations within this problem type. Examples:
                <br>• Percentage: "find-percent", "find-part", "find-whole"
                <br>• Word problems: "find-missing-amount", "increase", "decrease", "compare"
              </small>
            </div>

            <div class="form-group">
              <label>Context Types (comma-separated)</label>
              <input
                v-model="formData.problemStructure.contextTypesText"
                type="text"
                placeholder="e.g., quiz, basketball, pizza, homework"
              />
              <small class="form-hint">
                Real-world contexts for variety. Examples:
                <br>• Percentage: "quiz", "basketball", "pizza", "homework", "spelling"
                <br>• Money: "skateboard", "tablet", "concert", "game"
              </small>
            </div>

            <div class="number-ranges-group">
              <label>Number Ranges for Each Question</label>
              <small class="form-hint">Specify different number ranges for questions 1-5 to ensure variety.</small>

              <div class="form-group">
                <label>Question 1</label>
                <input
                  v-model="formData.problemStructure.numberRanges.question1"
                  type="text"
                  placeholder="e.g., 15/20 (75%) or $45-$55, saved $10-$18"
                />
              </div>

              <div class="form-group">
                <label>Question 2</label>
                <input
                  v-model="formData.problemStructure.numberRanges.question2"
                  type="text"
                  placeholder="e.g., 18/24 (75%) or $70-$90, saved $30-$42"
                />
              </div>

              <div class="form-group">
                <label>Question 3</label>
                <input
                  v-model="formData.problemStructure.numberRanges.question3"
                  type="text"
                  placeholder="e.g., 22/25 (88%) or $35-$48, saved $12-$20"
                />
              </div>

              <div class="form-group">
                <label>Question 4</label>
                <input
                  v-model="formData.problemStructure.numberRanges.question4"
                  type="text"
                  placeholder="e.g., 12/15 (80%) or $95-$120, saved $48-$65"
                />
              </div>

              <div class="form-group">
                <label>Question 5</label>
                <input
                  v-model="formData.problemStructure.numberRanges.question5"
                  type="text"
                  placeholder="e.g., 27/30 (90%) or $55-$75, saved $20-$32"
                />
              </div>
            </div>

            <div class="form-group">
              <label>Forbidden Patterns (comma-separated)</label>
              <input
                v-model="formData.problemStructure.forbiddenPatternsText"
                type="text"
                placeholder="e.g., 8/10, 9/10, $25 saved, $65 cost"
              />
              <small class="form-hint">
                Number patterns that are too common or repetitive. AI will avoid these.
                <br>Example: "8/10, 9/10" (too common for percentages), "$25, $65" (overused amounts)
              </small>
            </div>

            <div class="form-group">
              <label>Custom AI Instructions</label>
              <textarea
                v-model="formData.customAIPrompt"
                rows="4"
                placeholder="Optional: Add custom instructions for how AI should vary this question type...

Example: 'Keep the X out of Y structure. Always ask What percent?. Vary the context but never change to a money problem.'"
              ></textarea>
              <small class="form-hint">
                Freeform instructions to guide AI. Use this for specific requirements not covered above.
              </small>
            </div>
          </div>

          <!-- NEW: Template Questions Editor -->
          <div class="form-section">
            <h3 class="section-title">📝 Template Questions (NEW System)</h3>
            <p class="section-description">
              Define template questions that will be used to generate assessments.
              The AI will create variations of these questions for each Progress Assessment.
            </p>

            <div class="form-group">
              <label>Number of Questions (1-20)</label>
              <input
                v-model.number="formData.numberOfQuestions"
                type="number"
                min="1"
                max="20"
                placeholder="5"
                class="form-input"
                style="max-width: 150px;"
              />
              <small class="form-hint">Default is 5. Specify how many questions this template should have.</small>
            </div>

            <TemplateQuestionEditor
              v-model="formData.templateQuestions"
              :number-of-questions="formData.numberOfQuestions || 5"
              :goal-text="formData.goalTextTemplate"
              :goal-title="formData.name"
              :area-of-need="formData.areaOfNeed"
              :grade-level="formData.defaultGradeLevel"
              :standard="formData.defaultStandard"
              :question-category="formData.questionCategory"
              :example-question="formData.exampleQuestion"
              :example-answer="formData.exampleAnswer"
              :example-explanation="formData.exampleExplanation"
              :custom-a-i-prompt="formData.customAIPrompt"
              :allowed-operations="formData.allowedOperations"
              :problem-structure="formData.problemStructure"
            />
          </div>

          <div class="form-group">
            <label>Example Goal (optional)</label>
            <textarea
              v-model="formData.exampleGoal"
              rows="2"
              placeholder="Example of a goal created from this template..."
            ></textarea>
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
            <button type="button" @click="handleCloseModal" class="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? 'Saving...' : (showEditModal ? 'Update Template' : 'Create Template') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Preview Modal -->
    <div v-if="showPreviewModal && previewTemplateData" class="modal-overlay" @click="showPreviewModal = false">
      <div class="modal-content modal-preview" @click.stop>
        <div class="modal-header">
          <h2>Template Preview</h2>
          <button @click="showPreviewModal = false" class="btn-close">✕</button>
        </div>

        <div class="preview-content">
          <div class="preview-section">
            <h3>Template: {{ previewTemplateData.name }}</h3>
            <div class="preview-field">
              <strong>Subject:</strong> {{ previewTemplateData.subject }}
            </div>
            <div v-if="previewTemplateData.topic" class="preview-field">
              <strong>Topic:</strong> {{ previewTemplateData.topic }}
            </div>
            <div v-if="previewTemplateData.exampleQuestion" class="preview-field example-question-preview">
              <strong>⭐ Example Question:</strong>
              <div class="example-question-content">
                <div><strong>Question:</strong> {{ previewTemplateData.exampleQuestion }}</div>
                <div v-if="previewTemplateData.exampleAnswer"><strong>Answer:</strong> {{ previewTemplateData.exampleAnswer }}</div>
                <div v-if="previewTemplateData.exampleAlternativeAnswers"><strong>Alternative Answers:</strong> {{ previewTemplateData.exampleAlternativeAnswers }}</div>
                <div v-if="previewTemplateData.exampleExplanation"><strong>Explanation:</strong> {{ previewTemplateData.exampleExplanation }}</div>
              </div>
            </div>
          </div>

          <div class="preview-section">
            <h3>Generated Goal</h3>
            <div class="preview-field">
              <strong>Area of Need:</strong>
              <span>{{ previewTemplateData.areaOfNeed }}</span>
            </div>
            <div class="preview-field">
              <strong>Goal Title:</strong>
              <span>{{ previewGoal.goalTitle }}</span>
            </div>
            <div class="preview-field">
              <strong>Goal Text:</strong>
              <span>{{ previewGoal.goalText }}</span>
            </div>
            <div v-if="previewGoal.baseline" class="preview-field">
              <strong>Baseline:</strong>
              <span>{{ previewGoal.baseline }}</span>
            </div>
            <div v-if="previewGoal.gradeLevel" class="preview-field">
              <strong>Grade Level:</strong>
              <span>{{ previewGoal.gradeLevel }}</span>
            </div>
            <div v-if="previewGoal.standard" class="preview-field">
              <strong>Standard:</strong>
              <span>{{ previewGoal.standard }}</span>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button @click="createFromPreview" class="btn btn-secondary">
            📄 Save as New Template
          </button>
          <button @click="showPreviewModal = false" class="btn btn-primary">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import {
  getAllTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate as deleteTemplateService,
  activateTemplate,
  deactivateTemplate,
  generateGoalFromTemplate as generateGoalFromTemplateService,
  getTemplate,
} from '@/firebase/templateServices'
import { getActiveRubrics } from '@/firebase/rubricServices'
import { getAllGoals, createGoal } from '@/firebase/goalServices'
import { generateTemplateDraft } from '@/services/templateDraftGenerator'
import TemplateQuestionEditor from './TemplateQuestionEditor.vue'
import type { GoalTemplate, Rubric, Goal, TemplateQuestion } from '@/types/iep'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

// State
const loading = ref(false)
const saving = ref(false)
const templates = ref<GoalTemplate[]>([])
const goals = ref<Goal[]>([])
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showPreviewModal = ref(false)
const showRubricModal = ref(false)
const showDraftGeneratorModal = ref(false)
const editingTemplate = ref<GoalTemplate | null>(null)
const previewTemplateData = ref<GoalTemplate | null>(null)
const availableRubrics = ref<Rubric[]>([])
const hasUnsavedChanges = ref(false) // Track unsaved changes

const initialFormData = ref<typeof formData.value | null>(null) // Store initial form state

// Draft Generator State
const draftGenerating = ref(false)
const draftError = ref('')
const draftInput = ref({
  goalTitle: '',
  goalText: '',
  areaOfNeed: '',
})

// Generate Goal from Template State
const showGenerateGoalModal = ref(false)
const selectedTemplateForGoal = ref<GoalTemplate | null>(null)
const generatingGoal = ref(false)
const goalGenerationError = ref('')
const availableStudents = ref<any[]>([])
const availableTeachers = ref<any[]>([])
const loadingStudents = ref(false)
const goalGenerationData = ref({
  variables: {} as Record<string, string>,
  selectedStudents: [] as string[],
  selectedTeacher: '', // For admin to assign goal to a teacher
})

// Filters
const filterSubject = ref('')
const filterActive = ref('')
const searchQuery = ref('')

// Form data
const formData = ref({
  name: '',
  subject: 'math' as 'math' | 'ela' | 'other',
  topic: '',
  areaOfNeed: '',
  goalTitleTemplate: '',
  goalTextTemplate: '',
  baselineTemplate: '',
  assessmentMethod: 'app' as 'app' | 'paper' | 'hybrid',
  rubricId: '',
  defaultGradeLevel: undefined as number | undefined,
  defaultStandard: '',
  defaultThreshold: '',
  defaultCondition: '',
  description: '',
  exampleGoal: '',
  // Example question fields - MOST IMPORTANT
  exampleQuestion: '',
  exampleAnswer: '',
  exampleAlternativeAnswers: '',
  exampleExplanation: '',
  khanAcademyVideoUrl: '',
  // NEW: Template questions (5 questions that define this template)
  templateQuestions: [] as TemplateQuestion[],
  numberOfQuestions: 5, // Default to 5 questions
  // Operation constraints for math
  allowedOperations: [] as ('addition' | 'subtraction' | 'multiplication' | 'division')[],
  // Question category override (NEW)
  questionCategory: '' as '' | 'computation' | 'word-problem' | 'conceptual' | 'application',
  // Problem structure fields (NEW)
  problemStructure: {
    numberOfSteps: undefined as 1 | 2 | 3 | 4 | undefined,
    questionTypesText: '', // Comma-separated, will be converted to array
    contextTypesText: '', // Comma-separated, will be converted to array
    numberRanges: {
      question1: '',
      question2: '',
      question3: '',
      question4: '',
      question5: '',
    },
    forbiddenPatternsText: '', // Comma-separated, will be converted to array
  },
  customAIPrompt: '',
  isActive: true,
})

// Computed
const filteredTemplates = computed(() => {
  let filtered = [...templates.value]

  if (filterSubject.value) {
    filtered = filtered.filter(t => t.subject === filterSubject.value)
  }

  if (filterActive.value !== '') {
    const isActive = filterActive.value === 'true'
    filtered = filtered.filter(t => t.isActive === isActive)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      t =>
        t.name.toLowerCase().includes(query) ||
        t.areaOfNeed.toLowerCase().includes(query) ||
        (t.topic && t.topic.toLowerCase().includes(query)) ||
        (t.description && t.description.toLowerCase().includes(query))
    )
  }

  return filtered
})

// Extract variables from template for goal generation
const goalVariables = computed(() => {
  if (!selectedTemplateForGoal.value) return []

  const variables = new Set<string>()
  const extractVariables = (text: string) => {
    const matches = text.match(/\{\{(\w+)\}\}/g)
    if (matches) {
      matches.forEach(match => {
        const varName = match.replace(/\{\{|\}\}/g, '')
        variables.add(varName)
      })
    }
  }

  extractVariables(selectedTemplateForGoal.value.goalTitleTemplate || '')
  extractVariables(selectedTemplateForGoal.value.goalTextTemplate || '')

  return Array.from(variables)
})

const previewGoal = computed(() => {
  if (!previewTemplateData.value) {
    return {
      goalTitle: '',
      goalText: '',
      areaOfNeed: '',
      baseline: '',
      gradeLevel: undefined,
      standard: '',
    }
  }

  return generateGoalFromTemplateService(previewTemplateData.value, {
    topic: previewTemplateData.value.topic || 'word problem',
    threshold: previewTemplateData.value.defaultThreshold || '80%',
    condition: previewTemplateData.value.defaultCondition || 'in 3 out of 4 trials',
    gradeLevel: previewTemplateData.value.defaultGradeLevel || 7,
    standard: previewTemplateData.value.defaultStandard || '',
  })
})

// Methods
const loadTemplates = async () => {
  try {
    loading.value = true
    templates.value = await getAllTemplates()
  } catch (error) {
    console.error('Error loading templates:', error)
    alert('Failed to load templates. Please try again.')
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  formData.value = {
    name: '',
    subject: 'math',
    topic: '',
    areaOfNeed: '',
    goalTitleTemplate: '',
    goalTextTemplate: '',
    baselineTemplate: '',
    assessmentMethod: 'app',
    rubricId: '',
    defaultGradeLevel: undefined,
    defaultStandard: '',
    defaultThreshold: '',
    defaultCondition: '',
    description: '',
    exampleGoal: '',
    exampleQuestion: '',
    exampleAnswer: '',
    exampleAlternativeAnswers: '',
  exampleExplanation: '',
  khanAcademyVideoUrl: '',
  templateQuestions: [] as TemplateQuestion[],
  numberOfQuestions: 5,
  allowedOperations: [],
  questionCategory: '',
  problemStructure: {
      numberOfSteps: undefined,
      questionTypesText: '',
      contextTypesText: '',
      numberRanges: {
        question1: '',
        question2: '',
        question3: '',
        question4: '',
        question5: '',
      },
      forbiddenPatternsText: '',
    },
    customAIPrompt: '',
    isActive: true,
  }
  editingTemplate.value = null
}

const loadRubrics = async () => {
  try {
    availableRubrics.value = await getActiveRubrics()
  } catch (error) {
    console.error('Error loading rubrics:', error)
  }
}

const editTemplate = (template: GoalTemplate) => {
  editingTemplate.value = template

  // Helper to convert array to comma-separated string
  const arrayToText = (arr?: string[]) => (arr || []).join(', ')

  formData.value = {
    name: template.name,
    subject: template.subject,
    topic: template.topic || '',
    areaOfNeed: template.areaOfNeed,
    goalTitleTemplate: template.goalTitleTemplate,
    goalTextTemplate: template.goalTextTemplate,
    assessmentMethod: template.assessmentMethod || 'app',
    rubricId: template.rubricId || '',
    baselineTemplate: template.baselineTemplate || '',
    defaultGradeLevel: template.defaultGradeLevel,
    defaultStandard: template.defaultStandard || '',
    defaultThreshold: template.defaultThreshold || '',
    defaultCondition: template.defaultCondition || '',
    description: template.description || '',
    exampleGoal: template.exampleGoal || '',
    exampleQuestion: template.exampleQuestion || '',
    exampleAnswer: template.exampleAnswer || '',
    exampleAlternativeAnswers: template.exampleAlternativeAnswers || '',
    exampleExplanation: template.exampleExplanation || '',
    khanAcademyVideoUrl: template.khanAcademyVideoUrl || '',
    templateQuestions: template.templateQuestions || [],
    numberOfQuestions: template.numberOfQuestions || 5,
    allowedOperations: template.allowedOperations || [],
    problemStructure: {
      numberOfSteps: template.problemStructure?.numberOfSteps,
      questionTypesText: arrayToText(template.problemStructure?.questionTypes),
      contextTypesText: arrayToText(template.problemStructure?.contextTypes),
      numberRanges: {
        question1: template.problemStructure?.numberRanges?.question1 || '',
        question2: template.problemStructure?.numberRanges?.question2 || '',
        question3: template.problemStructure?.numberRanges?.question3 || '',
        question4: template.problemStructure?.numberRanges?.question4 || '',
        question5: template.problemStructure?.numberRanges?.question5 || '',
      },
      forbiddenPatternsText: arrayToText(template.problemStructure?.forbiddenPatterns),
    },
    customAIPrompt: template.customAIPrompt || '',
    questionCategory: template.questionCategory || '', // NEW: Load question category
    isActive: template.isActive,
  }
  showEditModal.value = true
}

const saveTemplate = async () => {
  try {
    saving.value = true

    // Helper to convert comma-separated text to array
    const textToArray = (text: string) =>
      text
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s)

    // Build template data, only including fields that have values (not empty strings for optional fields)
    const templateData: Partial<GoalTemplate> & { name: string; subject: string; areaOfNeed: string; goalTitleTemplate: string; goalTextTemplate: string; assessmentMethod: string; isActive: boolean; createdBy: string } = {
      name: formData.value.name,
      subject: formData.value.subject,
      areaOfNeed: formData.value.areaOfNeed,
      goalTitleTemplate: formData.value.goalTitleTemplate,
      goalTextTemplate: formData.value.goalTextTemplate,
      assessmentMethod: formData.value.assessmentMethod,
      isActive: formData.value.isActive,
      createdBy: authStore.currentUser?.uid || '',
    }

    // Add optional fields only if they have values
    if (formData.value.topic) templateData.topic = formData.value.topic
    if (formData.value.baselineTemplate) templateData.baselineTemplate = formData.value.baselineTemplate
    if (formData.value.rubricId) templateData.rubricId = formData.value.rubricId
    if (formData.value.defaultGradeLevel !== undefined)
      templateData.defaultGradeLevel = formData.value.defaultGradeLevel
    if (formData.value.defaultStandard) templateData.defaultStandard = formData.value.defaultStandard
    if (formData.value.defaultThreshold) templateData.defaultThreshold = formData.value.defaultThreshold
    if (formData.value.defaultCondition) templateData.defaultCondition = formData.value.defaultCondition
    if (formData.value.description) templateData.description = formData.value.description
    if (formData.value.exampleGoal) templateData.exampleGoal = formData.value.exampleGoal
    if (formData.value.exampleQuestion) templateData.exampleQuestion = formData.value.exampleQuestion
    if (formData.value.exampleAnswer) templateData.exampleAnswer = formData.value.exampleAnswer
    if (formData.value.exampleAlternativeAnswers)
      templateData.exampleAlternativeAnswers = formData.value.exampleAlternativeAnswers
    if (formData.value.exampleExplanation)
      templateData.exampleExplanation = formData.value.exampleExplanation
    if (formData.value.khanAcademyVideoUrl)
      templateData.khanAcademyVideoUrl = formData.value.khanAcademyVideoUrl
    if (formData.value.allowedOperations && formData.value.allowedOperations.length > 0)
      templateData.allowedOperations = formData.value.allowedOperations

    // Add template questions if provided
    if (formData.value.templateQuestions && formData.value.templateQuestions.length > 0) {
      // Clean up helper fields before saving
      templateData.templateQuestions = formData.value.templateQuestions.map(q => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { acceptableAnswersString, optionsString, ...cleanQuestion } = q as TemplateQuestion & { acceptableAnswersString?: string; optionsString?: string }
        return cleanQuestion
      })
      // Save the number of questions
      templateData.numberOfQuestions = formData.value.numberOfQuestions || formData.value.templateQuestions.length
    }

    // Add question category if specified
    if (formData.value.questionCategory) templateData.questionCategory = formData.value.questionCategory

    // Add problem structure if any fields are filled
    const ps = formData.value.problemStructure
    // For computation problems, ignore numberOfSteps (they're always single-step)
    const shouldIncludeSteps = formData.value.questionCategory !== 'computation' && ps.numberOfSteps
    if (
      shouldIncludeSteps ||
      ps.questionTypesText ||
      ps.contextTypesText ||
      ps.numberRanges.question1 ||
      ps.forbiddenPatternsText
    ) {
      templateData.problemStructure = {
        ...(shouldIncludeSteps && { numberOfSteps: ps.numberOfSteps }),
        ...(ps.questionTypesText && { questionTypes: textToArray(ps.questionTypesText) }),
        ...(ps.contextTypesText && { contextTypes: textToArray(ps.contextTypesText) }),
        numberRanges: {
          ...(ps.numberRanges.question1 && { question1: ps.numberRanges.question1 }),
          ...(ps.numberRanges.question2 && { question2: ps.numberRanges.question2 }),
          ...(ps.numberRanges.question3 && { question3: ps.numberRanges.question3 }),
          ...(ps.numberRanges.question4 && { question4: ps.numberRanges.question4 }),
          ...(ps.numberRanges.question5 && { question5: ps.numberRanges.question5 }),
        },
        ...(ps.forbiddenPatternsText && { forbiddenPatterns: textToArray(ps.forbiddenPatternsText) }),
      }
    }

    // Add custom AI prompt
    if (formData.value.customAIPrompt) templateData.customAIPrompt = formData.value.customAIPrompt

    if (showEditModal.value && editingTemplate.value) {
      await updateTemplate(editingTemplate.value.id, templateData)
    } else {
      await createTemplate(templateData)
    }

    await loadTemplates()
    hasUnsavedChanges.value = false // Reset flag after successful save
    closeModals()
  } catch (error) {
    console.error('Error saving template:', error)
    alert('Failed to save template. Please try again.')
  } finally {
    saving.value = false
  }
}

const handleDeleteTemplate = async (template: GoalTemplate) => {
  if (!confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
    return
  }

  try {
    await deleteTemplateService(template.id)
    await loadTemplates()
  } catch (error) {
    console.error('Error deleting template:', error)
    alert('Failed to delete template. Please try again.')
  }
}

const toggleTemplateActive = async (template: GoalTemplate) => {
  try {
    if (template.isActive) {
      await deactivateTemplate(template.id)
    } else {
      await activateTemplate(template.id)
    }
    await loadTemplates()
  } catch (error) {
    console.error('Error toggling template:', error)
    alert('Failed to update template. Please try again.')
  }
}

const previewTemplate = (template: GoalTemplate) => {
  previewTemplateData.value = template
  showPreviewModal.value = true
}

const createFromPreview = () => {
  if (!previewTemplateData.value) return
  const t = previewTemplateData.value
  createFromTemplate(t)
  showPreviewModal.value = false
}

const createFromTemplate = (t: GoalTemplate) => {
  // Helper to convert array to comma-separated string
  const arrayToText = (arr?: string[]) => (arr || []).join(', ')

  formData.value = {
    name: `Copy of ${t.name}`,
    subject: t.subject,
    topic: t.topic || '',
    areaOfNeed: t.areaOfNeed,
    goalTitleTemplate: t.goalTitleTemplate,
    goalTextTemplate: t.goalTextTemplate,
    baselineTemplate: t.baselineTemplate || '',
    assessmentMethod: t.assessmentMethod,
    rubricId: t.rubricId || '',
    defaultGradeLevel: t.defaultGradeLevel,
    defaultStandard: t.defaultStandard || '',
    defaultThreshold: t.defaultThreshold || '',
    defaultCondition: t.defaultCondition || '',
    description: t.description || '',
    exampleGoal: t.exampleGoal || '',
    exampleQuestion: t.exampleQuestion || '',
    exampleAnswer: t.exampleAnswer || '',
    exampleAlternativeAnswers: t.exampleAlternativeAnswers || '',
    exampleExplanation: t.exampleExplanation || '',
    khanAcademyVideoUrl: t.khanAcademyVideoUrl || '',
    templateQuestions: t.templateQuestions ? [...t.templateQuestions] : [],
    numberOfQuestions: t.numberOfQuestions || 5,
    allowedOperations: t.allowedOperations || [],
    questionCategory: t.questionCategory || '', // NEW: Include question category
    problemStructure: {
      numberOfSteps: t.problemStructure?.numberOfSteps,
      questionTypesText: arrayToText(t.problemStructure?.questionTypes),
      contextTypesText: arrayToText(t.problemStructure?.contextTypes),
      numberRanges: {
        question1: t.problemStructure?.numberRanges?.question1 || '',
        question2: t.problemStructure?.numberRanges?.question2 || '',
        question3: t.problemStructure?.numberRanges?.question3 || '',
        question4: t.problemStructure?.numberRanges?.question4 || '',
        question5: t.problemStructure?.numberRanges?.question5 || '',
      },
      forbiddenPatternsText: arrayToText(t.problemStructure?.forbiddenPatterns),
    },
    customAIPrompt: t.customAIPrompt || '',
    isActive: true,
  }
  showCreateModal.value = true
}

const closeModals = () => {
  showCreateModal.value = false
  showEditModal.value = false
  showPreviewModal.value = false
  resetForm()
  hasUnsavedChanges.value = false
  initialFormData.value = null
}

// Handle close with unsaved changes check
const handleCloseModal = () => {
  if (hasUnsavedChanges.value) {
    const confirmed = confirm(
      '⚠️ You have unsaved changes!\n\nAre you sure you want to close without saving? All changes will be lost.'
    )
    if (!confirmed) {
      return // Don't close
    }
  }
  closeModals()
}

// Handle overlay click (clicking outside modal)
const handleOverlayClick = (event: MouseEvent) => {
  // Only close if clicking directly on overlay, not on modal content
  if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
    handleCloseModal()
  }
}

// Track form data changes
watch(
  formData,
  (newValue) => {
    if (initialFormData.value) {
      // Check if form has changed from initial state
      hasUnsavedChanges.value = JSON.stringify(newValue) !== JSON.stringify(initialFormData.value)
    }
  },
  { deep: true }
)

// Watch for modal opening to capture initial state
watch([showCreateModal, showEditModal], ([createOpen, editOpen]) => {
  if (createOpen || editOpen) {
    // Capture initial state when modal opens
    initialFormData.value = JSON.parse(JSON.stringify(formData.value))
    hasUnsavedChanges.value = false
    loadRubrics()
  }
})
const closeDraftGenerator = () => {
  showDraftGeneratorModal.value = false
  draftInput.value = {
    goalTitle: '',
    goalText: '',
    areaOfNeed: '',
  }
  draftError.value = ''
}

const generateDraft = async () => {
  try {
    draftGenerating.value = true
    draftError.value = ''

    console.log('🤖 Generating template draft from goal...')

    const draft = await generateTemplateDraft(
      draftInput.value.goalText,
      draftInput.value.goalTitle,
      draftInput.value.areaOfNeed,
    )

    console.log('✅ Draft generated successfully:', draft)

    // Helper to convert array to text
    const arrayToText = (arr?: string[]) => (arr || []).join(', ')

    // Populate form with draft data
    formData.value = {
      name: draft.name,
      subject: draft.subject,
      topic: draft.topic,
      areaOfNeed: draftInput.value.areaOfNeed || draft.topic,
      goalTitleTemplate: '{{topic}} - Grade {{gradeLevel}}',
      goalTextTemplate: draftInput.value.goalText,
      baselineTemplate: '',
      assessmentMethod: 'app',
      rubricId: '',
      defaultGradeLevel: undefined,
      defaultStandard: '',
      defaultThreshold: '',
      defaultCondition: '',
      description: draft.description,
      exampleGoal: '',
      exampleQuestion: draft.exampleQuestion,
      exampleAnswer: draft.exampleAnswer,
      exampleAlternativeAnswers: '',
      exampleExplanation: draft.exampleExplanation || '',
      khanAcademyVideoUrl: '',
      templateQuestions: [],
      numberOfQuestions: 5,
      allowedOperations: draft.allowedOperations || [],
      questionCategory: draft.questionCategory || '', // NEW: Include question category from draft
      problemStructure: {
        numberOfSteps: draft.problemStructure.numberOfSteps,
        questionTypesText: arrayToText(draft.problemStructure.questionTypes),
        contextTypesText: arrayToText(draft.problemStructure.contextTypes),
        numberRanges: {
          question1: draft.problemStructure.numberRanges?.question1 || '',
          question2: draft.problemStructure.numberRanges?.question2 || '',
          question3: draft.problemStructure.numberRanges?.question3 || '',
          question4: draft.problemStructure.numberRanges?.question4 || '',
          question5: draft.problemStructure.numberRanges?.question5 || '',
        },
        forbiddenPatternsText: arrayToText(draft.problemStructure.forbiddenPatterns),
      },
      customAIPrompt: draft.customAIPrompt || '',
      isActive: true,
    }

    // Close draft modal and open create modal
    closeDraftGenerator()
    showCreateModal.value = true

    // Show success message
    alert('✅ Template draft generated!\n\n📝 Review and edit the fields below, then click "Save Template" when ready.\n\n💡 Tip: For goals assessing multiple skills (decimals, fractions, integers), you can edit the number ranges, question types, and allowed operations to customize the template.')

    alert('✅ Template draft generated! Review and edit the fields, then save.')
  } catch (error) {
    console.error('❌ Draft generation failed:', error)
    draftError.value = error instanceof Error ? error.message : 'Failed to generate draft. Please try again.'
  } finally {
    draftGenerating.value = false
  }
}

// Generate Goal from Template Functions
const generateGoalFromTemplate = async (template: GoalTemplate) => {
  selectedTemplateForGoal.value = template
  goalGenerationData.value = {
    variables: {},
    selectedStudents: [],
    selectedTeacher: authStore.isAdmin ? '' : authStore.currentUser?.uid || '', // Default to current user if teacher
  }

  // Pre-fill variables with defaults if they exist
  if (template.defaultGradeLevel) {
    goalGenerationData.value.variables.gradeLevel = template.defaultGradeLevel.toString()
  }
  if (template.defaultStandard) {
    goalGenerationData.value.variables.standard = template.defaultStandard
  }
  if (template.defaultThreshold) {
    goalGenerationData.value.variables.threshold = template.defaultThreshold
  }
  if (template.defaultCondition) {
    goalGenerationData.value.variables.condition = template.defaultCondition
  }
  if (template.topic) {
    goalGenerationData.value.variables.topic = template.topic
  }

  // Load teachers (for admins only)
  if (authStore.isAdmin) {
    try {
      const { getAllTeachers } = await import('@/firebase/userServices')
      const allTeachers = await getAllTeachers()
      availableTeachers.value = allTeachers.filter(t => t.isActive)
    } catch (error) {
      console.error('Error loading teachers:', error)
    }
  }

  // Load students
  loadingStudents.value = true
  try {
    const { getAllStudents } = await import('@/firebase/userServices')
    const allStudents = await getAllStudents()
    availableStudents.value = allStudents.filter(s => s.isActive)
  } catch (error) {
    console.error('Error loading students:', error)
  } finally {
    loadingStudents.value = false
  }

  goalGenerationError.value = ''
  showGenerateGoalModal.value = true
}

const closeGenerateGoal = () => {
  showGenerateGoalModal.value = false
  selectedTemplateForGoal.value = null
  goalGenerationData.value = {
    variables: {},
    selectedStudents: [],
    selectedTeacher: '',
  }
  goalGenerationError.value = ''
}

const toggleStudentSelection = (studentId: string) => {
  const index = goalGenerationData.value.selectedStudents.indexOf(studentId)
  if (index > -1) {
    goalGenerationData.value.selectedStudents.splice(index, 1)
  } else {
    goalGenerationData.value.selectedStudents.push(studentId)
  }
}

const selectAllStudents = () => {
  goalGenerationData.value.selectedStudents = availableStudents.value.map(s => s.uid)
}

const clearAllStudents = () => {
  goalGenerationData.value.selectedStudents = []
}

const formatVariableName = (variable: string): string => {
  // Convert camelCase to Title Case with spaces
  return variable
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
}

const getVariablePlaceholder = (variable: string): string => {
  const placeholders: Record<string, string> = {
    gradeLevel: 'e.g., 7',
    topic: 'e.g., fractions',
    threshold: 'e.g., 80%',
    condition: 'e.g., on 4 out of 5 trials',
    standard: 'e.g., 7.NS.A.1',
    date: 'e.g., 05/05/2026',
  }
  return placeholders[variable] || `Enter ${formatVariableName(variable).toLowerCase()}`
}

const confirmGenerateGoal = async () => {
  if (!selectedTemplateForGoal.value) return

  // Validate required fields
  goalGenerationError.value = ''

  // Check if gradeLevel is required and missing
  const gradeLevelValue = goalGenerationData.value.variables.gradeLevel || selectedTemplateForGoal.value.defaultGradeLevel
  if (!gradeLevelValue) {
    goalGenerationError.value = '⚠️ Grade Level is required. Please enter a grade level to create the goal.'
    return
  }

  // Check if teacher is selected (for admins)
  if (authStore.isAdmin && !goalGenerationData.value.selectedTeacher) {
    goalGenerationError.value = '⚠️ Teacher assignment is required. Please select a teacher to assign this goal to.'
    return
  }

  try {
    generatingGoal.value = true
    goalGenerationError.value = ''

    // Replace variables in templates
    let goalTitle = selectedTemplateForGoal.value.goalTitleTemplate
    let goalText = selectedTemplateForGoal.value.goalTextTemplate
    let baseline = selectedTemplateForGoal.value.baselineTemplate || ''

    Object.entries(goalGenerationData.value.variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      goalTitle = goalTitle.replace(regex, value)
      goalText = goalText.replace(regex, value)
      baseline = baseline.replace(regex, value)
    })

    // Create goal
    const goalData = {
      goalTitle,
      goalText,
      areaOfNeed: selectedTemplateForGoal.value.areaOfNeed,
      baseline,
      gradeLevel: goalGenerationData.value.variables.gradeLevel
        ? parseInt(goalGenerationData.value.variables.gradeLevel)
        : selectedTemplateForGoal.value.defaultGradeLevel,
      standard: goalGenerationData.value.variables.standard || selectedTemplateForGoal.value.defaultStandard || '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: goalGenerationData.value.variables.date || '',
      assignedStudents: goalGenerationData.value.selectedStudents,
      preferredTemplateIds: [selectedTemplateForGoal.value.id], // Auto-assign template to goal
      teacherUid: goalGenerationData.value.selectedTeacher || authStore.currentUser?.uid || '', // Use selected teacher or current user
      isActive: true,
      createdBy: authStore.currentUser?.uid || '',
      assignedAssessments: [],
      isMet: false,
      isArchived: false,
    }

    await createGoal(goalData)

    // Reload templates and goals
    await loadTemplates()
    await loadGoals()

    // Close modal
    const templateName = selectedTemplateForGoal.value?.name || 'Unknown Template'
    const studentCount = goalGenerationData.value.selectedStudents.length
    closeGenerateGoal()

    // Show success message with option to navigate
    const message = `✅ Goal created successfully!\n\n${studentCount > 0 ? `📌 Assigned to ${studentCount} student(s)\n` : ''}🎯 Template "${templateName}" automatically assigned to this goal\n\nWould you like to view the goal in Goal Management?`

    if (confirm(message)) {
      // Navigate to Goal Management (force refresh if already there)
      const currentPath = router.currentRoute.value.path
      if (currentPath === '/goals') {
        // Already on goals page, reload the page
        window.location.href = '/goals'
      } else {
        // Navigate to goals page
        router.push('/goals')
      }
    }
  } catch (error) {
    console.error('Error creating goal:', error)
    goalGenerationError.value = error instanceof Error ? error.message : 'Failed to create goal'
  } finally {
    generatingGoal.value = false
  }
}

const truncateText = (text: string, maxLength: number): string => {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

const formatDate = (timestamp: { toDate?: () => Date } | Date | string | null | undefined): string => {
  if (!timestamp) return 'Unknown'

  let date: Date
  if (timestamp instanceof Date) {
    date = timestamp
  } else if (typeof timestamp === 'string') {
    date = new Date(timestamp)
  } else if (typeof timestamp === 'object' && 'toDate' in timestamp && timestamp.toDate) {
    date = timestamp.toDate()
  } else {
    return 'Unknown'
  }

  return date.toLocaleDateString()
}

// Get goals that have this template assigned
const getLinkedGoals = (templateId: string): Goal[] => {
  return goals.value.filter(goal =>
    goal.preferredTemplateIds && goal.preferredTemplateIds.includes(templateId)
  )
}

// Get student names for a goal
const getGoalStudents = (goal: Goal): string => {
  if (goal.assignedStudents && goal.assignedStudents.length > 0) {
    return `${goal.assignedStudents.length} student(s)`
  } else if (goal.studentUid) {
    return '1 student'
  }
  return 'No students'
}

// Get total unique student count for a template
const getTemplateStudentCount = (templateId: string): number => {
  const linkedGoals = getLinkedGoals(templateId)
  const uniqueStudents = new Set<string>()

  linkedGoals.forEach(goal => {
    if (goal.assignedStudents && goal.assignedStudents.length > 0) {
      goal.assignedStudents.forEach(studentUid => uniqueStudents.add(studentUid))
    } else if (goal.studentUid) {
      uniqueStudents.add(goal.studentUid)
    }
  })

  return uniqueStudents.size
}

// Get student names for template tooltip
const getTemplateStudentNames = (templateId: string): string => {
  const linkedGoals = getLinkedGoals(templateId)
  const studentGoalsMap = new Map<string, string[]>()

  linkedGoals.forEach(goal => {
    const students = goal.assignedStudents || (goal.studentUid ? [goal.studentUid] : [])
    students.forEach(studentUid => {
      if (!studentGoalsMap.has(studentUid)) {
        studentGoalsMap.set(studentUid, [])
      }
      studentGoalsMap.get(studentUid)?.push(goal.goalTitle)
    })
  })

  // Format as list with student name and their goals
  const lines: string[] = []
  studentGoalsMap.forEach((goalTitles, studentUid) => {
    // Try to get student name (would need to load students, for now use UID)
    lines.push(`• Student ${studentUid.slice(0, 8)}... (${goalTitles.length} goal${goalTitles.length !== 1 ? 's' : ''})`)
  })

  return lines.join('\n') || 'No students'
}

// Load goals
const loadGoals = async () => {
  try {
    goals.value = await getAllGoals()
  } catch (error) {
    console.error('Error loading goals:', error)
  }
}

// Clear numberOfSteps when questionCategory is set to computation
watch(() => formData.value.questionCategory, (newCategory) => {
  if (newCategory === 'computation') {
    formData.value.problemStructure.numberOfSteps = undefined
  }
})

onMounted(async () => {
  console.log('🔧 DEBUG TEMPLATE MANAGEMENT MOUNTED')
  console.log('🔧 Current route:', route)
  console.log('🔧 Query params:', route.query)
  console.log('🔧 Edit param:', route.query.edit)

  await loadTemplates()
  await loadRubrics()
  await loadGoals()

  // Check if we should open a specific template for editing
  const editTemplateId = route.query.edit as string | undefined
  if (editTemplateId) {
    console.log('📝 Opening template for editing from URL:', editTemplateId)
    try {
      const template = await getTemplate(editTemplateId)
      console.log('🔧 Template loaded:', template)
      if (template) {
        console.log('✅ Calling editTemplate()...')
        editTemplate(template)
        // Clear the query parameter from URL without reloading
        router.replace({ query: {} })
      } else {
        console.warn('❌ Template not found:', editTemplateId)
        alert('Template not found or you do not have access to it.')
      }
    } catch (error) {
      console.error('❌ Error loading template from URL:', error)
      alert('Failed to load template for editing.')
    }
  } else {
    console.log('ℹ️ No edit param in URL')
  }
})
</script>

<style scoped>
.goal-template-management {
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
  font-size: 1rem;
}

.controls-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.filters {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.filter-select,
.search-input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.search-input {
  min-width: 200px;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

.template-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s;
}

.template-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.template-card.inactive {
  opacity: 0.7;
  background: #f9f9f9;
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.template-title-section h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
}

.template-badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.badge {
  padding: 0.25rem 0.5rem;
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

.badge-inactive {
  background: #ffebee;
  color: #c62828;
}

.badge-assessment-app {
  background: #e8f5e9;
  color: #2e7d32;
}

.badge-assessment-paper {
  background: #fff3e0;
  color: #e65100;
}

.badge-assessment-hybrid {
  background: #f3e5f5;
  color: #6a1b9a;
}

.template-actions {
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
  opacity: 1;
  color: #c62828;
}

.template-content {
  margin-bottom: 1rem;
}

.template-field {
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}

.template-field strong {
  display: block;
  margin-bottom: 0.25rem;
  color: #555;
}

.template-code {
  display: block;
  background: #f5f5f5;
  padding: 0.5rem;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  word-break: break-word;
}

.example-text {
  font-style: italic;
  color: #666;
}

.linked-goals-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.linked-goal-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  font-size: 0.85rem;
}

.goal-title {
  flex: 1;
  font-weight: 500;
  color: #2c3e50;
}

.goal-student {
  font-size: 0.75rem;
  color: #6c757d;
  padding: 0.125rem 0.5rem;
  background: #e9ecef;
  border-radius: 12px;
}

.no-linked-goals {
  color: #6c757d;
  font-style: italic;
  font-size: 0.85rem;
}

.template-footer {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.template-usage-summary {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.usage-stat {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: help;
  transition: all 0.2s;
}

.usage-stat:hover {
  background: #edf2f7;
  border-color: #cbd5e0;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.goals-stat {
  border-left: 3px solid #3b82f6;
}

.students-stat {
  border-left: 3px solid #10b981;
}

.usage-count {
  font-weight: 700;
  font-size: 1.125rem;
  color: #1f2937;
}

.usage-label {
  color: #6b7280;
  font-weight: 500;
}

.no-usage {
  font-size: 0.875rem;
  color: #9ca3af;
  font-style: italic;
}

.template-meta {
  font-size: 0.85rem;
  color: #666;
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
}

.btn-sm {
  padding: 0.4rem 0.8rem;
  font-size: 0.85rem;
}

/* Modal Styles */
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
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.modal-preview {
  max-width: 800px;
}

.modal-body {
  padding: 1.5rem;
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

.template-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.required-indicator {
  color: #e53e3e;
  font-weight: bold;
  margin-left: 0.25rem;
}

.field-help {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: #666;
}

.field-error {
  border-color: #e53e3e !important;
  background-color: #fff5f5;
}

.error-message {
  background: #fee;
  border: 1px solid #e53e3e;
  border-radius: 6px;
  padding: 1rem;
  margin: 1rem 0;
  color: #c53030;
  font-weight: 500;
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
  line-height: 1.4;
}

.form-hint .link {
  color: #007bff;
  text-decoration: underline;
  cursor: pointer;
}

.form-hint .link:hover {
  color: #0056b3;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

/* Example Question Section Styles */
.example-question-section {
  background: #fff3cd;
  border: 2px solid #ffc107;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.section-title {
  margin: 0 0 0.5rem 0;
  font-weight: 700;
  color: #856404;
  font-size: 1rem;
}

.section-description {
  margin: 0 0 1rem 0;
  color: #856404;
  font-size: 0.875rem;
  font-style: italic;
}

.example-field {
  border: 2px solid #ffc107;
  background: #fff;
}

.example-field:focus {
  border-color: #ff9800;
  box-shadow: 0 0 0 3px rgba(255, 193, 7, 0.25);
}

.example-question-preview {
  background: #fff3cd !important;
  border: 2px solid #ffc107 !important;
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin: 10px 0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: normal;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.checkbox-label span {
  user-select: none;
}

.operations-badges {
  display: inline-flex;
  gap: 6px;
  flex-wrap: wrap;
}

.operation-badge {
  display: inline-block;
  background: #e3f2fd;
  color: #1976d2;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.85em;
  font-weight: 500;
  border: 1px solid #90caf9;
}

.example-question-content {
  margin-top: 0.5rem;
}

.example-question-content > div {
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  background: #fff;
  border-radius: 4px;
}

.description-field {
  background: #f8f9fa;
  padding: 0.75rem;
  border-radius: 4px;
  border-left: 3px solid #007bff;
}

.description-content {
  white-space: pre-wrap;
  word-wrap: break-word;
  color: #495057;
  line-height: 1.5;
}

/* Preview Styles */
.preview-content {
  padding: 1.5rem;
}

.preview-section {
  margin-bottom: 2rem;
}

.preview-section h3 {
  margin-bottom: 1rem;
  color: #333;
}

.preview-field {
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #f9f9f9;
  border-radius: 4px;
}

.preview-field strong {
  display: block;
  margin-bottom: 0.25rem;
  color: #555;
}

/* Button Styles */
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

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.icon {
  font-size: 1rem;
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

/* Generate Goal Modal Styles */
.generate-goal-form .form-section {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #eee;
}

.generate-goal-form .form-section:last-of-type {
  border-bottom: none;
}

.generate-goal-form h3 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
}

.student-selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.student-selector-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.btn-link {
  background: none;
  border: none;
  color: #1976d2;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  text-decoration: none;
  transition: color 0.2s;
}

.btn-link:hover:not(:disabled) {
  color: #1565c0;
  text-decoration: underline;
}

.btn-link:disabled {
  color: #999;
  cursor: not-allowed;
}

.separator {
  color: #ddd;
  font-size: 0.875rem;
}

.student-selection-list {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0.5rem;
  min-height: 200px;
}

.selected-count {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #1976d2;
  font-weight: 500;
}

.loading-students {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  color: #666;
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #1976d2;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.no-students {
  padding: 1rem;
  text-align: center;
  color: #999;
  font-style: italic;
}

.student-option {
  padding: 0.5rem;
  border-radius: 4px;
  transition: background 0.2s;
}

.student-option:hover {
  background: #f8f9fa;
}

.student-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  width: 100%;
  padding: 0.25rem;
}

.student-option input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  flex-shrink: 0;
}

.student-label span {
  flex: 1;
  user-select: none;
}

.student-option span {
  flex: 1;
  font-size: 0.9rem;
}
</style>










