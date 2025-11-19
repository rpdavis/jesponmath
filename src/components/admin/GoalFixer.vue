<template>
  <div class="goal-fixer">
    <div class="header">
      <h1>🔧 Fix Imported Goals</h1>
      <p>This tool will fix issues with imported goals</p>
    </div>

    <div class="info-box">
      <h3>What this tool does:</h3>
      <ul>
        <li>✅ Verify student connections (district ID → student UID)</li>
        <li>✅ Fix createdBy field (assign goals to the correct teacher)</li>
        <li>✅ Remove duplicate goals</li>
      </ul>
    </div>

    <div class="actions">
      <button @click="analyzeGoals" :disabled="loading" class="btn btn-primary">
        1️⃣ Analyze Issues
      </button>
      <button @click="fixTeacherAssignments" :disabled="loading" class="btn btn-success">
        2️⃣ Fix Teacher Assignments
      </button>
      <button @click="removeDuplicates" :disabled="loading" class="btn btn-danger">
        3️⃣ Remove Duplicates
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
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/firebase/config'
import type { Goal } from '@/types/iep'
import type { Student } from '@/types/users'

const loading = ref(false)
const loadingMessage = ref('')
const output = ref<Array<{ message: string; type: string }>>([])

const log = (message: string, type = 'normal') => {
  output.value.push({ message, type })
}

const clearOutput = () => {
  output.value = []
}

const analyzeGoals = async () => {
  clearOutput()
  loading.value = true
  loadingMessage.value = 'Analyzing goals...'
  log('🔍 Analyzing imported goals...', 'normal')
  
  try {
    // Load all data
    const [goalsSnap, studentsSnap] = await Promise.all([
      getDocs(collection(db, 'goals')),
      getDocs(collection(db, 'students'))
    ])

    const goals = goalsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal))
    const students = studentsSnap.docs.map(doc => ({ id: doc.id, uid: doc.id, ...doc.data() } as any))

    log(`\n📊 Found:`, 'normal')
    log(`  - ${goals.length} goals`, 'normal')
    log(`  - ${students.length} students`, 'normal')

    // Create student lookup by UID and by district ID
    const studentByUid = new Map<string, Student>()
    const studentByDistrictId = new Map<string, Student>()
    students.forEach(s => {
      studentByUid.set(s.uid, s)
      if (s.email) {
        const match = s.email.match(/s-(\d+)@/)
        if (match) {
          studentByDistrictId.set(match[1], s)
        }
      }
    })

    // Find teacher for each student
    const teacherMap = new Map<string, string>()
    students.forEach(s => {
      if (s.teacherUid) {
        teacherMap.set(s.uid, s.teacherUid)
      }
    })

    log(`\n🔍 Analyzing Issues:`, 'warning')

    // Check for goals with invalid student connections
    let invalidConnections = 0
    let missingTeacher = 0
    let orphanedGoals = 0

    goals.forEach(goal => {
      if (goal.assignedStudents && goal.assignedStudents.length > 0) {
        goal.assignedStudents.forEach(uid => {
          if (!studentByUid.has(uid)) {
            invalidConnections++
            log(`  ⚠️  Goal "${goal.goalTitle}" → Invalid student UID: ${uid}`, 'warning')
          } else if (!teacherMap.has(uid)) {
            missingTeacher++
          }
        })
      } else if (goal.studentUid) {
        if (!studentByUid.has(goal.studentUid)) {
          invalidConnections++
        } else if (!teacherMap.has(goal.studentUid)) {
          missingTeacher++
        }
      } else {
        orphanedGoals++
      }
    })

    // Check for duplicates (same title + same student)
    const goalSignatures = new Map<string, string[]>()
    let duplicateCount = 0
    goals.forEach(goal => {
      const studentUids = goal.assignedStudents || [goal.studentUid].filter(Boolean) as string[]
      studentUids.forEach(uid => {
        const signature = `${goal.goalTitle}|${uid}`
        if (goalSignatures.has(signature)) {
          goalSignatures.get(signature)!.push(goal.id)
          duplicateCount++
        } else {
          goalSignatures.set(signature, [goal.id])
        }
      })
    })

    log(`\n📋 Issues Found:`, invalidConnections > 0 || missingTeacher > 0 || duplicateCount > 0 ? 'error' : 'success')
    log(`  - ${invalidConnections} goals with invalid student connections`, invalidConnections > 0 ? 'error' : 'success')
    log(`  - ${missingTeacher} goals with students missing teacher assignment`, missingTeacher > 0 ? 'warning' : 'success')
    log(`  - ${orphanedGoals} goals with no students assigned`, orphanedGoals > 0 ? 'warning' : 'success')
    log(`  - ${duplicateCount} duplicate goals found`, duplicateCount > 0 ? 'error' : 'success')

    // Show duplicates
    if (duplicateCount > 0) {
      log(`\n📦 Duplicate Goals:`, 'warning')
      goalSignatures.forEach((ids, signature) => {
        if (ids.length > 1) {
          const [title, uid] = signature.split('|')
          const student = studentByUid.get(uid)
          const studentName = student ? `${student.firstName} ${student.lastName}` : 'Unknown'
          log(`  "${title}" for ${studentName}: ${ids.length} copies`, 'warning')
        }
      })
    }

    log(`\n✅ Analysis complete!`, 'success')
    
  } catch (error: any) {
    log(`\n❌ Error: ${error.message}`, 'error')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const fixTeacherAssignments = async () => {
  if (!confirm('This will update the createdBy field on all goals to the teacher UID: Ey2Po5PBmpg17XmRbXsUtnq521E2. Continue?')) {
    return
  }

  clearOutput()
  loading.value = true
  loadingMessage.value = 'Fixing teacher assignments...'
  log('🔧 Fixing teacher assignments...', 'normal')
  
  try {
    // Use the known teacher UID
    const teacherUid = 'Ey2Po5PBmpg17XmRbXsUtnq521E2'
    log(`👨‍🏫 Using teacher UID: ${teacherUid}`, 'success')

    const goalsSnap = await getDocs(collection(db, 'goals'))
    const goals = goalsSnap.docs

    log(`\n📊 Updating ${goals.length} goals...`, 'normal')

    let updated = 0
    let skipped = 0

    for (const goalDoc of goals) {
      const goal = goalDoc.data() as Goal
      
      // Skip if already has correct teacher
      if (goal.createdBy === teacherUid) {
        skipped++
        continue
      }

      // Update the goal's createdBy field
      await updateDoc(doc(db, 'goals', goalDoc.id), {
        createdBy: teacherUid
      })

      updated++
      if (updated % 10 === 0) {
        log(`  ✅ Updated ${updated} goals...`, 'success')
      }
    }

    log(`\n✅ Fixed ${updated} goals, skipped ${skipped} (already correct)`, 'success')
    log(`\n🎯 Now teachers should be able to see all goals!`, 'warning')
    
  } catch (error: any) {
    log(`\n❌ Error: ${error.message}`, 'error')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const removeDuplicates = async () => {
  if (!confirm('⚠️ This will DELETE duplicate goals, keeping only the most recent one for each student. This cannot be undone. Continue?')) {
    return
  }

  clearOutput()
  loading.value = true
  loadingMessage.value = 'Removing duplicates...'
  log('🗑️  Removing duplicate goals...', 'normal')
  
  try {
    const goalsSnap = await getDocs(collection(db, 'goals'))
    const goals = goalsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal))

    // Group by signature (title + student)
    const goalGroups = new Map<string, Goal[]>()
    
    goals.forEach(goal => {
      const studentUids = goal.assignedStudents || [goal.studentUid].filter(Boolean) as string[]
      studentUids.forEach(uid => {
        const signature = `${goal.goalTitle}|${uid}`
        if (!goalGroups.has(signature)) {
          goalGroups.set(signature, [])
        }
        goalGroups.get(signature)!.push(goal)
      })
    })

    let deleted = 0

    // For each group with duplicates, keep the newest and delete the rest
    for (const [signature, groupGoals] of goalGroups) {
      if (groupGoals.length <= 1) continue

      // Sort by createdAt (newest first)
      groupGoals.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0
        const bTime = b.createdAt?.toMillis?.() || 0
        return bTime - aTime
      })

      // Keep the first (newest), delete the rest
      const [keep, ...toDelete] = groupGoals
      
      log(`  🔍 Found ${groupGoals.length} copies of "${keep.goalTitle}"`, 'warning')
      log(`     Keeping: ${keep.id} (${new Date(keep.createdAt?.toMillis?.() || 0).toLocaleString()})`, 'success')

      for (const goal of toDelete) {
        await deleteDoc(doc(db, 'goals', goal.id))
        deleted++
        log(`     ❌ Deleted: ${goal.id}`, 'error')
      }
    }

    log(`\n✅ Removed ${deleted} duplicate goals`, 'success')
    
  } catch (error: any) {
    log(`\n❌ Error: ${error.message}`, 'error')
    console.error(error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.goal-fixer {
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
  border-left: 4px solid #4CAF50;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border-radius: 4px;
}

.info-box h3 {
  margin-top: 0;
}

.info-box ul {
  margin: 0.5rem 0;
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

.btn-danger {
  background: #f44336;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #da190b;
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

