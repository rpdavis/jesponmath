<template>
  <div class="role-fixer">
    <div class="header">
      <h2>🔧 Role Fixer (Debug Tool)</h2>
      <p>Fix users who have incorrect roles</p>
    </div>

    <div class="current-user-info">
      <h3>Current User Debug Info:</h3>
      <pre>{{ JSON.stringify(authStore.currentUser, null, 2) }}</pre>
    </div>

    <div class="role-fix-form">
      <h3>Fix User Role:</h3>
      <div class="form-group">
        <label>User Email:</label>
        <input v-model="emailToFix" type="email" placeholder="Enter user email" class="form-input">
      </div>
      <div class="form-group">
        <label>New Role:</label>
        <select v-model="newRole" class="form-select">
          <option value="">Select role</option>
          <option value="admin">👑 Admin</option>
          <option value="teacher">👨‍🏫 Teacher</option>
          <option value="student">🎓 Student</option>
        </select>
      </div>
      <div class="action-buttons">
        <button @click="fixUserRole" :disabled="!emailToFix || !newRole || fixing" class="fix-btn">
          {{ fixing ? 'Fixing...' : 'Fix Role' }}
        </button>
        <button @click="cleanupDuplicates" :disabled="!emailToFix || fixing" class="cleanup-btn">
          {{ fixing ? 'Cleaning...' : 'Remove Duplicates' }}
        </button>
      </div>
    </div>

    <div v-if="result" class="result">{{ result }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import { collection, query, where, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { COLLECTIONS } from '@/types/users';

const authStore = useAuthStore();

const emailToFix = ref('');
const newRole = ref('');
const fixing = ref(false);
const result = ref('');

const fixUserRole = async () => {
  try {
    fixing.value = true;
    result.value = '';
    
    console.log('🔧 Fixing role for:', emailToFix.value, 'to:', newRole.value);
    
    // Find user by email in users collection
    const usersQuery = query(
      collection(db, COLLECTIONS.USERS),
      where('email', '==', emailToFix.value)
    );
    const usersSnapshot = await getDocs(usersQuery);
    
    if (usersSnapshot.empty) {
      result.value = 'User not found in users collection';
      return;
    }
    
    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;
    
    console.log('👤 Found user:', userId, 'Current role:', userDoc.data().role);
    
    // Update role in users collection
    await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
      role: newRole.value
    });
    
    // If changing to student, ensure they exist in students collection
    if (newRole.value === 'student') {
      const studentsQuery = query(
        collection(db, COLLECTIONS.STUDENTS),
        where('email', '==', emailToFix.value)
      );
      const studentsSnapshot = await getDocs(studentsQuery);
      
      if (studentsSnapshot.empty) {
        // Create student record
        await updateDoc(doc(db, COLLECTIONS.STUDENTS, userId), {
          uid: userId,
          email: emailToFix.value,
          displayName: userDoc.data().displayName || '',
          role: 'student',
          firstName: userDoc.data().displayName?.split(' ')[0] || '',
          lastName: userDoc.data().displayName?.split(' ').slice(1).join(' ') || '',
          ssid: '',
          grade: '',
          hasIEP: false,
          has504: false,
          isActive: true,
          createdAt: userDoc.data().createdAt,
          updatedAt: new Date()
        });
        console.log('✅ Created student record');
      }
    }
    
    result.value = `✅ Successfully updated ${emailToFix.value} to ${newRole.value} role`;
    
    // If fixing current user, reload the page
    if (emailToFix.value === authStore.currentUser?.email) {
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
    
  } catch (error: any) {
    console.error('Error fixing role:', error);
    result.value = `❌ Error: ${error.message}`;
  } finally {
    fixing.value = false;
  }
};

const cleanupDuplicates = async () => {
  try {
    fixing.value = true;
    result.value = '';
    
    console.log('🧹 Cleaning up duplicate accounts for:', emailToFix.value);
    
    // Find user in both collections
    const [studentsSnapshot, teachersSnapshot] = await Promise.all([
      getDocs(query(collection(db, COLLECTIONS.STUDENTS), where('email', '==', emailToFix.value))),
      getDocs(query(collection(db, COLLECTIONS.TEACHERS), where('email', '==', emailToFix.value)))
    ]);
    
    const studentDocs = studentsSnapshot.docs;
    const teacherDocs = teachersSnapshot.docs;
    
    console.log(`Found ${studentDocs.length} student records and ${teacherDocs.length} teacher records`);
    
    if (studentDocs.length === 0 && teacherDocs.length === 0) {
      result.value = '⚠️ No records found for this email';
      return;
    }
    
    if (studentDocs.length > 0 && teacherDocs.length > 0) {
      // User exists in both collections - this is the problem!
      result.value = `🚨 DUPLICATE FOUND: User exists in both students (${studentDocs.length}) and teachers (${teacherDocs.length}) collections. `;
      
      // Ask which one to keep based on which has more data
      const studentData = studentDocs[0].data();
      const teacherData = teacherDocs[0].data();
      
      console.log('Student data:', studentData);
      console.log('Teacher data:', teacherData);
      
      // Keep the student record if it has more student-specific data
      if (studentData.ssid || studentData.seisId || studentData.hasIEP || studentData.assignedTeacher) {
        // Remove from teachers collection
        for (const teacherDoc of teacherDocs) {
          await deleteDoc(doc(db, COLLECTIONS.TEACHERS, teacherDoc.id));
        }
        
        // Update users collection to student role
        const usersSnapshot = await getDocs(query(collection(db, COLLECTIONS.USERS), where('email', '==', emailToFix.value)));
        if (!usersSnapshot.empty) {
          await updateDoc(doc(db, COLLECTIONS.USERS, usersSnapshot.docs[0].id), {
            role: 'student'
          });
        }
        
        result.value += 'Kept student record, removed teacher record, updated users role to student.';
      } else {
        // Keep teacher record
        for (const studentDoc of studentDocs) {
          await deleteDoc(doc(db, COLLECTIONS.STUDENTS, studentDoc.id));
        }
        
        // Update users collection to teacher role
        const usersSnapshot = await getDocs(query(collection(db, COLLECTIONS.USERS), where('email', '==', emailToFix.value)));
        if (!usersSnapshot.empty) {
          await updateDoc(doc(db, COLLECTIONS.USERS, usersSnapshot.docs[0].id), {
            role: 'teacher'
          });
        }
        
        result.value += 'Kept teacher record, removed student record, updated users role to teacher.';
      }
      
      result.value = '✅ ' + result.value + ' Please refresh the page.';
      
    } else {
      result.value = '✅ No duplicates found - user exists in only one collection as expected.';
    }
    
  } catch (error: any) {
    console.error('Error cleaning duplicates:', error);
    result.value = `❌ Error: ${error.message}`;
  } finally {
    fixing.value = false;
  }
};
</script>

<style scoped>
.role-fixer {
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
  background: white;
  border-radius: 15px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.header h2 {
  color: #dc2626;
  margin-bottom: 10px;
}

.current-user-info {
  background: #f9fafb;
  padding: 15px;
  border-radius: 8px;
  margin: 20px 0;
}

.current-user-info pre {
  font-size: 12px;
  overflow-x: auto;
}

.role-fix-form {
  border: 2px solid #fecaca;
  padding: 20px;
  border-radius: 10px;
  background: #fef2f2;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 5px;
}

.form-input,
.form-select {
  width: 100%;
  padding: 10px;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.fix-btn,
.cleanup-btn {
  background: #dc2626;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  flex: 1;
}

.cleanup-btn {
  background: #f59e0b;
}

.fix-btn:disabled,
.cleanup-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.result {
  margin-top: 15px;
  padding: 10px;
  border-radius: 6px;
  font-weight: 500;
  background: #f0fdf4;
  color: #166534;
}
</style>
