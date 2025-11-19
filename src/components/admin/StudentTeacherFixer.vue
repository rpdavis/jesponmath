<template>
  <div class="fixer">
    <div class="header">
      <h1>👥 Fix Student-Teacher Connections</h1>
      <p>Ensure all students have a teacherUid field</p>
    </div>

    <div class="info-box">
      <p>This tool will assign all students to Ryan Davis (the teacher)</p>
    </div>

    <div class="actions">
      <button @click="checkStudents" :disabled="loading" class="btn btn-primary">
        1️⃣ Check Students
      </button>
      <button @click="fixStudents" :disabled="loading" class="btn btn-success">
        2️⃣ Fix Student Connections
      </button>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>{{ loadingMessage }}</p>
    </div>

    <div v-if="output.length > 0" class="output">
      <div 
        v-for="(line, index) in output" 
        :key="index" 
        :class="['output-line', line.type]"
      >
        {{ line.message }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore'
import { db } from '@/firebase/config'

const loading = ref(false)
const loadingMessage = ref('')
const output = ref<Array<{ message: string; type: string }>>([])

const log = (message: string, type = 'normal') => {
  output.value.push({ message, type })
}

const clearOutput = () => {
  output.value = []
}

const checkStudents = async () => {
  clearOutput()
  loading.value = true
  loadingMessage.value = 'Checking students...'
  log('🔍 Checking student-teacher connections...', 'normal')
  
  try {
    const [studentsSnap, usersSnap] = await Promise.all([
      getDocs(collection(db, 'students')),
      getDocs(query(collection(db, 'users'), where('role', '==', 'teacher')))
    ])

    const students = studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    const teachers = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    log(`\n📊 Found:`, 'normal')
    log(`  - ${students.length} students`, 'normal')
    log(`  - ${teachers.length} teachers`, 'normal')

    let withTeacher = 0
    let withoutTeacher = 0

    students.forEach((s: any) => {
      if (s.teacherUid) {
        withTeacher++
      } else {
        withoutTeacher++
        log(`  ⚠️  ${s.firstName} ${s.lastName} - NO teacherUid`, 'warning')
      }
    })

    log(`\n📋 Results:`, withoutTeacher > 0 ? 'error' : 'success')
    log(`  ✅ ${withTeacher} students have teacherUid`, 'success')
    log(`  ❌ ${withoutTeacher} students missing teacherUid`, withoutTeacher > 0 ? 'error' : 'success')

    if (teachers.length > 0) {
      log(`\n👨‍🏫 Available Teachers:`, 'normal')
      teachers.forEach((t: any) => {
        log(`  - ${t.displayName || t.email} (${t.uid})`, 'normal')
      })
    }

    log(`\n✅ Check complete!`, 'success')
    
  } catch (error: any) {
    log(`\n❌ Error: ${error.message}`, 'error')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const fixStudents = async () => {
  clearOutput()
  loading.value = true
  loadingMessage.value = 'Fixing student connections...'
  log('🔧 Fixing student-teacher connections...', 'normal')
  
  try {
    // Get Ryan Davis's UID
    const usersSnap = await getDocs(query(collection(db, 'users'), where('email', '==', 'rdstaffview@gmail.com')))
    
    if (usersSnap.empty) {
      log('❌ Could not find Ryan Davis teacher account', 'error')
      loading.value = false
      return
    }

    const ryanDavis = usersSnap.docs[0]
    const teacherUid = ryanDavis.id
    
    log(`👨‍🏫 Found teacher: Ryan Davis (${teacherUid})`, 'success')

    // Get all students
    const studentsSnap = await getDocs(collection(db, 'students'))
    const students = studentsSnap.docs

    log(`\n📊 Updating ${students.length} students...`, 'normal')

    let updated = 0
    let skipped = 0

    for (const studentDoc of students) {
      const student = studentDoc.data()
      
      if (student.teacherUid === teacherUid) {
        skipped++
        continue
      }

      await updateDoc(doc(db, 'students', studentDoc.id), {
        teacherUid: teacherUid
      })

      updated++
      log(`  ✅ Updated: ${student.firstName} ${student.lastName}`, 'success')
    }

    log(`\n✅ Fixed ${updated} students, skipped ${skipped} (already correct)`, 'success')
    log(`\n🎯 Now go back and run "Fix Teacher Assignments" again!`, 'warning')
    
  } catch (error: any) {
    log(`\n❌ Error: ${error.message}`, 'error')
    console.error(error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.fixer {
  max-width: 1000px;
  margin: 2rem auto;
  padding: 2rem;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.header h1 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.info-box {
  background: #f8f9fa;
  border-left: 4px solid #2196F3;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border-radius: 4px;
}

.actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.btn {
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #2196F3;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0b7dda;
}

.btn-success {
  background: #4CAF50;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #45a049;
}

.loading {
  text-align: center;
  padding: 2rem;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4CAF50;
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

.output {
  background: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 1.5rem;
  max-height: 500px;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  white-space: pre-wrap;
}

.output-line {
  margin: 0.25rem 0;
}

.output-line.success {
  color: #4CAF50;
}

.output-line.error {
  color: #f44336;
}

.output-line.warning {
  color: #ff9800;
}

.output-line.normal {
  color: #333;
}
</style>

