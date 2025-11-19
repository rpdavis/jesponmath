<template>
  <div class="goal-importer">
    <div class="header">
      <h2>📊 Import Goals from CSV</h2>
      <p>Import goals for 27 students (139 goals total, including 3 consolidated goals)</p>
    </div>

    <div v-if="!importing && !importComplete" class="upload-section">
      <div class="info-box">
        <h3>📋 Required Files:</h3>
        <ul>
          <li><strong>Goals_Import_Ready.csv</strong> - Main goals file with all 139 goals</li>
          <li><strong>Goals_Consolidated_Summary.csv</strong> - Summary of 3 consolidated goals</li>
        </ul>
      </div>

      <div class="file-inputs">
        <div class="file-input-group">
          <label>
            <strong>Goals Import Ready CSV:</strong>
            <input 
              type="file" 
              accept=".csv" 
              @change="handleMainFileUpload"
              :disabled="importing"
            >
          </label>
          <span v-if="mainFile" class="file-name">✅ {{ mainFile.name }}</span>
        </div>

        <div class="file-input-group">
          <label>
            <strong>Consolidated Goals CSV:</strong>
            <input 
              type="file" 
              accept=".csv" 
              @change="handleConsolidatedFileUpload"
              :disabled="importing"
            >
          </label>
          <span v-if="consolidatedFile" class="file-name">✅ {{ consolidatedFile.name }}</span>
        </div>
      </div>

      <button 
        @click="startImport" 
        :disabled="!canImport || importing"
        class="btn-import"
      >
        {{ importing ? 'Importing...' : 'Start Import' }}
      </button>
    </div>

    <div v-if="importing" class="progress-section">
      <h3>⏳ Importing Goals...</h3>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
      </div>
      <p>{{ progressMessage }}</p>
      <div class="stats">
        <div>Created: {{ stats.created }}</div>
        <div>Skipped: {{ stats.skipped }}</div>
        <div>Errors: {{ stats.errors }}</div>
      </div>
    </div>

    <div v-if="importComplete" class="results-section">
      <h3>✅ Import Complete!</h3>
      
      <div class="summary">
        <h4>📊 Summary:</h4>
        <ul>
          <li><strong>Consolidated Goals:</strong> {{ results.consolidatedGoals }} created</li>
          <li><strong>Individual Goals:</strong> {{ results.individualGoals }} created</li>
          <li><strong>Total Goals:</strong> {{ results.totalGoals }} created</li>
          <li><strong>Skipped:</strong> {{ results.skipped }} (students not found)</li>
        </ul>
      </div>

      <div v-if="results.studentsNotFound.length > 0" class="warnings">
        <h4>⚠️ Students Not Found ({{ results.studentsNotFound.length }}):</h4>
        <ul>
          <li v-for="student in results.studentsNotFound" :key="student">{{ student }}</li>
        </ul>
      </div>

      <div v-if="results.errors.length > 0" class="errors">
        <h4>❌ Errors:</h4>
        <ul>
          <li v-for="(error, i) in results.errors" :key="i">{{ error }}</li>
        </ul>
      </div>

      <button @click="reset" class="btn-reset">Import Another File</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { createGoal } from '@/firebase/goalServices'
import { getAllStudents } from '@/firebase/userServices'
import type { Student } from '@/types/users'

const authStore = useAuthStore()

const mainFile = ref<File | null>(null)
const consolidatedFile = ref<File | null>(null)
const importing = ref(false)
const importComplete = ref(false)
const progressMessage = ref('')
const progressPercent = ref(0)

const stats = ref({
  created: 0,
  skipped: 0,
  errors: 0
})

const results = ref({
  consolidatedGoals: 0,
  individualGoals: 0,
  totalGoals: 0,
  skipped: 0,
  studentsNotFound: [] as string[],
  errors: [] as string[]
})

const canImport = computed(() => mainFile.value && consolidatedFile.value)

const handleMainFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    mainFile.value = target.files[0]
  }
}

const handleConsolidatedFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    consolidatedFile.value = target.files[0]
  }
}

const parseCSV = (text: string): any[] => {
  const rows: string[][] = []
  const lines = text.split('\n')
  let currentRow: string[] = []
  let currentField = ''
  let inQuotes = false
  let i = 0
  
  // Process character by character to handle multi-line fields
  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx]
    
    for (let charIdx = 0; charIdx < line.length; charIdx++) {
      const char = line[charIdx]
      
      if (char === '"') {
        if (inQuotes && line[charIdx + 1] === '"') {
          // Escaped quote
          currentField += '"'
          charIdx++
        } else {
          // Toggle quote state
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        currentRow.push(currentField.trim())
        currentField = ''
      } else {
        currentField += char
      }
    }
    
    // If we're not in quotes, this line is complete
    if (!inQuotes) {
      currentRow.push(currentField.trim())
      rows.push(currentRow)
      currentRow = []
      currentField = ''
    } else {
      // Continue field on next line (preserve the newline)
      currentField += '\n'
    }
  }
  
  // Handle last row if needed
  if (currentRow.length > 0 || currentField) {
    currentRow.push(currentField.trim())
    rows.push(currentRow)
  }
  
  // Convert to objects
  const headers = rows[0].map(h => h.trim())
  const data: any[] = []
  
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].length === 0 || rows[i].every(cell => !cell)) continue
    
    const row: any = {}
    headers.forEach((header, index) => {
      row[header] = rows[i][index] || ''
    })
    data.push(row)
  }
  
  return data
}

// Helper function to find student using multiple strategies
const findStudent = (
  firstName: string,
  lastName: string,
  districtId: string,
  studentByName: Map<string, Student>,
  studentByEmail: Map<string, Student>,
  studentByDistrictId: Map<string, Student>
): Student | null => {
  // Strategy 1: Try district ID first (most reliable)
  if (districtId && studentByDistrictId.has(districtId)) {
    return studentByDistrictId.get(districtId)!
  }
  
  // Strategy 2: Try constructed email (s-DISTRICTID@vacavilleusd.org)
  if (districtId) {
    const constructedEmail = `s-${districtId}@vacavilleusd.org`
    if (studentByEmail.has(constructedEmail)) {
      return studentByEmail.get(constructedEmail)!
    }
  }
  
  // Strategy 3: Try name match (less reliable due to spelling variations)
  const nameKey = `${firstName.toLowerCase()}|${lastName.toLowerCase()}`
  if (studentByName.has(nameKey)) {
    return studentByName.get(nameKey)!
  }
  
  return null
}

const startImport = async () => {
  if (!mainFile.value || !consolidatedFile.value) return
  
  importing.value = true
  stats.value = { created: 0, skipped: 0, errors: 0 }
  progressPercent.value = 0
  progressMessage.value = 'Loading students from database...'
  
  try {
    // Load all students
    const allStudents = await getAllStudents()
    const studentByName = new Map<string, Student>()
    const studentByEmail = new Map<string, Student>()
    const studentByDistrictId = new Map<string, Student>()
    
    allStudents.forEach(student => {
      // Map by name
      const nameKey = `${student.firstName?.toLowerCase()}|${student.lastName?.toLowerCase()}`
      studentByName.set(nameKey, student)
      
      // Map by email (lowercase)
      if (student.email) {
        studentByEmail.set(student.email.toLowerCase(), student)
      }
      
      // Map by district ID extracted from email (s-XXXXXXX@vacavilleusd.org)
      if (student.email) {
        const emailMatch = student.email.match(/s-(\d+)@/)
        if (emailMatch) {
          const districtId = emailMatch[1]
          studentByDistrictId.set(districtId, student)
        }
      }
    })
    
    progressMessage.value = `Found ${allStudents.length} students in database (${studentByDistrictId.size} with district IDs)`
    progressPercent.value = 10
    
    // Read consolidated goals file
    const consolidatedText = await consolidatedFile.value.text()
    const consolidatedData = parseCSV(consolidatedText)
    
    progressMessage.value = 'Creating consolidated goals...'
    progressPercent.value = 20
    
    // Import consolidated goals
    for (const row of consolidatedData) {
      try {
        const studentNames = row.student_names.split(';').map((s: string) => s.trim())
        const districtIds = row.district_ids ? row.district_ids.split(';').map((s: string) => s.trim()) : []
        const studentUids: string[] = []
        const notFound: string[] = []
        
        for (let i = 0; i < studentNames.length; i++) {
          const name = studentNames[i]
          const parts = name.toLowerCase().split(' ')
          const firstName = parts[0]
          const lastName = parts.slice(1).join(' ')
          const districtId = districtIds[i] || ''
          
          const student = findStudent(firstName, lastName, districtId, studentByName, studentByEmail, studentByDistrictId)
          
          if (student) {
            studentUids.push(student.uid)
          } else {
            notFound.push(name)
          }
        }
        
        if (studentUids.length > 0) {
          await createGoal({
            goalTitle: row.goal_title,
            assignedStudents: studentUids,
            areaOfNeed: row.area_of_need,
            baseline: row.representative_baseline,
            goalText: row.representative_goal_text,
            assignedAssessments: [],
            isActive: true,
            isMet: false,
            isArchived: false,
            createdBy: authStore.currentUser!.uid
          })
          
          stats.value.created++
          results.value.consolidatedGoals++
        }
        
        notFound.forEach(name => {
          if (!results.value.studentsNotFound.includes(name)) {
            results.value.studentsNotFound.push(name)
          }
        })
      } catch (error: any) {
        console.error('Error creating consolidated goal:', error)
        stats.value.errors++
        results.value.errors.push(`Consolidated goal error: ${error.message}`)
      }
    }
    
    progressPercent.value = 40
    progressMessage.value = 'Creating individual goals...'
    
    // Read main goals file
    const mainText = await mainFile.value.text()
    const mainData = parseCSV(mainText)
    
    const totalIndividual = mainData.filter((r: any) => r.is_consolidated === 'No').length
    let processed = 0
    
    // Import individual goals
    for (const row of mainData) {
      if (row.is_consolidated === 'Yes') {
        stats.value.skipped++
        continue
      }
      
      const firstName = row.student_first_name?.trim() || ''
      const lastName = row.student_last_name?.trim() || ''
      const districtId = row.district_id?.trim() || ''
      
      const student = findStudent(firstName, lastName, districtId, studentByName, studentByEmail, studentByDistrictId)
      
      if (!student) {
        const studentName = `${row.student_first_name} ${row.student_last_name}`
        if (!results.value.studentsNotFound.includes(studentName)) {
          results.value.studentsNotFound.push(studentName)
        }
        stats.value.skipped++
        continue
      }
      
      try {
        
        await createGoal({
          goalTitle: row.goal_title,
          assignedStudents: [student.uid],
          areaOfNeed: row.area_of_need,
          baseline: row.baseline,
          goalText: row.goal_text,
          assignedAssessments: [],
          isActive: true,
          isMet: false,
          isArchived: false,
          createdBy: authStore.currentUser!.uid
        })
        
        stats.value.created++
        results.value.individualGoals++
        processed++
        
        // Update progress
        progressPercent.value = 40 + (processed / totalIndividual) * 55
        progressMessage.value = `Creating individual goals... ${processed}/${totalIndividual}`
      } catch (error: any) {
        console.error('Error creating goal:', error)
        stats.value.errors++
        results.value.errors.push(`Error for ${row.student_first_name} ${row.student_last_name}: ${error.message}`)
      }
    }
    
    progressPercent.value = 100
    progressMessage.value = 'Import complete!'
    
    results.value.totalGoals = results.value.consolidatedGoals + results.value.individualGoals
    results.value.skipped = stats.value.skipped
    
    importComplete.value = true
  } catch (error: any) {
    console.error('Import error:', error)
    alert(`Import failed: ${error.message}`)
  } finally {
    importing.value = false
  }
}

const reset = () => {
  mainFile.value = null
  consolidatedFile.value = null
  importing.value = false
  importComplete.value = false
  stats.value = { created: 0, skipped: 0, errors: 0 }
  results.value = {
    consolidatedGoals: 0,
    individualGoals: 0,
    totalGoals: 0,
    skipped: 0,
    studentsNotFound: [],
    errors: []
  }
}
</script>

<style scoped>
.goal-importer {
  max-width: 900px;
  margin: 2rem auto;
  padding: 2rem;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.header h2 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.info-box {
  background: #f8f9fa;
  border-left: 4px solid #4CAF50;
  padding: 1rem;
  margin-bottom: 2rem;
}

.info-box h3 {
  margin-top: 0;
}

.info-box ul {
  margin: 0.5rem 0;
}

.file-inputs {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.file-input-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.file-input-group input[type="file"] {
  display: block;
  width: 100%;
  padding: 0.5rem;
  border: 2px solid #ddd;
  border-radius: 4px;
  margin-top: 0.5rem;
}

.file-name {
  display: inline-block;
  margin-top: 0.5rem;
  color: #4CAF50;
  font-weight: 500;
}

.btn-import,
.btn-reset {
  width: 100%;
  padding: 1rem;
  font-size: 1.1rem;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-import {
  background: #4CAF50;
  color: white;
}

.btn-import:hover:not(:disabled) {
  background: #45a049;
}

.btn-import:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-reset {
  background: #2196F3;
  color: white;
  margin-top: 1rem;
}

.btn-reset:hover {
  background: #0b7dda;
}

.progress-section {
  text-align: center;
}

.progress-bar {
  width: 100%;
  height: 30px;
  background: #f0f0f0;
  border-radius: 15px;
  overflow: hidden;
  margin: 1rem 0;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  transition: width 0.3s;
}

.stats {
  display: flex;
  justify-content: space-around;
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.stats div {
  font-size: 1.1rem;
  font-weight: 500;
}

.results-section {
  animation: fadeIn 0.5s;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.summary {
  background: #e8f5e9;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.summary h4 {
  margin-top: 0;
  color: #2e7d32;
}

.warnings {
  background: #fff3e0;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.warnings h4 {
  margin-top: 0;
  color: #ef6c00;
}

.warnings ul {
  max-height: 200px;
  overflow-y: auto;
}

.errors {
  background: #ffebee;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.errors h4 {
  margin-top: 0;
  color: #c62828;
}
</style>

