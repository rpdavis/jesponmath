<template>
  <div class="user-management">
    <div class="header">
      <h1>👥 User Management</h1>
      <p>Add, edit, and manage teacher and student accounts</p>
    </div>

    <!-- Action Bar -->
    <div class="action-bar">
      <div class="action-buttons">
        <button @click="showAddUserModal = true" class="add-button">
          <span class="button-icon">➕</span>
          Add User
        </button>
        <button @click="bulkImport" class="import-button">
          <span class="button-icon">📥</span>
          Bulk Import
        </button>
        <button @click="exportUsers" class="export-button">
          <span class="button-icon">📤</span>
          Export Users
        </button>
      </div>
      <div class="search-bar">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Search users..." 
          class="search-input"
        >
        <span class="search-icon">🔍</span>
      </div>
    </div>

    <!-- User Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">👑</div>
        <div class="stat-content">
          <div class="stat-number">{{ adminCount }}</div>
          <div class="stat-label">Admins</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">👨‍🏫</div>
        <div class="stat-content">
          <div class="stat-number">{{ teacherCount }}</div>
          <div class="stat-label">Teachers</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🎓</div>
        <div class="stat-content">
          <div class="stat-number">{{ studentCount }}</div>
          <div class="stat-label">Students</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <div class="stat-number">{{ activeCount }}</div>
          <div class="stat-label">Active</div>
        </div>
      </div>
    </div>

    <!-- Users Table -->
    <div class="users-table-container">
      <div class="table-header">
        <h2>Users ({{ filteredUsers.length }})</h2>
        <div class="table-filters">
          <select v-model="roleFilter" class="filter-select">
            <option value="">All Roles</option>
            <option value="admin">👑 Admins</option>
            <option value="teacher">👨‍🏫 Teachers</option>
            <option value="student">🎓 Students</option>
          </select>
          <select v-model="statusFilter" class="filter-select">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in paginatedUsers" :key="user.uid" class="user-row">
              <td class="user-cell">
                <div class="user-info">
                  <div class="user-avatar" :class="user.role">
                    {{ getRoleIcon(user.role) }}
                  </div>
                  <div class="user-details">
                    <strong>{{ user.displayName || 'Unnamed User' }}</strong>
                    <small v-if="user.seisId">SEIS: {{ user.seisId }}</small>
                  </div>
                </div>
              </td>
              <td>{{ user.email }}</td>
              <td>
                <span class="role-badge" :class="user.role">
                  {{ getRoleIcon(user.role) }} {{ user.role }}
                </span>
              </td>
              <td>
                <span class="status-badge" :class="user.isActive ? 'active' : 'inactive'">
                  {{ user.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>{{ formatDate(user.createdAt) }}</td>
              <td>{{ formatDate(user.lastLogin) }}</td>
              <td>
                <div class="action-buttons-cell">
                  <button @click="editUser(user)" class="edit-btn" title="Edit User">
                    ✏️
                  </button>
                  <button 
                    @click="toggleUserStatus(user)" 
                    class="status-btn" 
                    :class="user.isActive ? 'deactivate' : 'activate'"
                    :title="user.isActive ? 'Deactivate' : 'Activate'"
                  >
                    {{ user.isActive ? '🚫' : '✅' }}
                  </button>
                  <button 
                    @click="deleteUser(user)" 
                    class="delete-btn" 
                    title="Delete User"
                    :disabled="user.uid === authStore.currentUser?.uid"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Empty State -->
        <div v-if="filteredUsers.length === 0" class="empty-state">
          <div class="empty-icon">👥</div>
          <h3>No Users Found</h3>
          <p v-if="searchQuery || roleFilter || statusFilter">
            No users match your current filters.
          </p>
          <p v-else>No users in the system yet.</p>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination">
        <button 
          @click="currentPage = Math.max(1, currentPage - 1)"
          :disabled="currentPage === 1"
          class="page-btn"
        >
          ← Previous
        </button>
        <span class="page-info">
          Page {{ currentPage }} of {{ totalPages }} ({{ filteredUsers.length }} total)
        </span>
        <button 
          @click="currentPage = Math.min(totalPages, currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="page-btn"
        >
          Next →
        </button>
      </div>
    </div>

    <!-- Add/Edit User Modal -->
    <div v-if="showAddUserModal || editingUser" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ editingUser ? 'Edit User' : 'Add New User' }}</h3>
          <button @click="closeModal" class="close-btn">×</button>
        </div>
        
        <form @submit.prevent="saveUser" class="user-form">
          <div class="form-group">
            <label for="displayName">Full Name *</label>
            <input 
              id="displayName"
              v-model="userForm.displayName" 
              type="text" 
              required 
              class="form-input"
            >
          </div>

          <div class="form-group">
            <label for="email">Email Address *</label>
            <input 
              id="email"
              v-model="userForm.email" 
              type="email" 
              required 
              class="form-input"
              :disabled="!!editingUser"
            >
          </div>

          <div class="form-group">
            <label for="role">Role *</label>
            <select id="role" v-model="userForm.role" required class="form-select">
              <option value="">Select Role</option>
              <option value="admin">👑 Administrator</option>
              <option value="teacher">👨‍🏫 Teacher</option>
              <option value="student">🎓 Student</option>
            </select>
          </div>

          <div v-if="userForm.role === 'student'" class="form-group">
            <label for="seisId">SEIS ID</label>
            <input 
              id="seisId"
              v-model="userForm.seisId" 
              type="text" 
              class="form-input"
              placeholder="Student SEIS ID"
            >
          </div>

          <div v-if="!editingUser" class="form-group">
            <label for="password">Password *</label>
            <input 
              id="password"
              v-model="userForm.password" 
              type="password" 
              required 
              class="form-input"
              minlength="6"
              placeholder="Minimum 6 characters"
            >
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                v-model="userForm.isActive"
              >
              Active Account
            </label>
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeModal" class="cancel-btn">Cancel</button>
            <button type="submit" class="save-btn" :disabled="saving">
              {{ saving ? 'Saving...' : (editingUser ? 'Update User' : 'Create User') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>Loading users...</p>
    </div>

    <!-- Messages -->
    <div v-if="error" class="error-message">{{ error }}</div>
    <div v-if="success" class="success-message">{{ success }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import { usePermissions } from '@/composables/usePermissions';
import { getAllTeachers, getAllStudents } from '@/firebase/userServices';
import { ROLES, type UserRole } from '@/config/roles';
import type { AppUser } from '@/stores/authStore';

const authStore = useAuthStore();
const permissions = usePermissions();

// State
const users = ref<AppUser[]>([]);
const searchQuery = ref('');
const roleFilter = ref('');
const statusFilter = ref('');
const currentPage = ref(1);
const pageSize = 20;
const loading = ref(true);
const saving = ref(false);
const error = ref('');
const success = ref('');

// Modal state
const showAddUserModal = ref(false);
const editingUser = ref<AppUser | null>(null);

// Form data
const userForm = ref({
  displayName: '',
  email: '',
  role: '',
  seisId: '',
  password: '',
  isActive: true
});

// Computed properties
const filteredUsers = computed(() => {
  let filtered = users.value;
  
  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(user => 
      user.displayName?.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.seisId?.toLowerCase().includes(query)
    );
  }
  
  // Role filter
  if (roleFilter.value) {
    filtered = filtered.filter(user => user.role === roleFilter.value);
  }
  
  // Status filter
  if (statusFilter.value) {
    const isActive = statusFilter.value === 'active';
    filtered = filtered.filter(user => user.isActive === isActive);
  }
  
  return filtered.sort((a, b) => a.displayName?.localeCompare(b.displayName || '') || 0);
});

const totalPages = computed(() => Math.ceil(filteredUsers.value.length / pageSize));

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return filteredUsers.value.slice(start, end);
});

const adminCount = computed(() => users.value.filter(u => u.role === ROLES.ADMIN).length);
const teacherCount = computed(() => users.value.filter(u => u.role === ROLES.TEACHER).length);
const studentCount = computed(() => users.value.filter(u => u.role === ROLES.STUDENT).length);
const activeCount = computed(() => users.value.filter(u => u.isActive).length);

// Methods
const loadUsers = async () => {
  try {
    loading.value = true;
    error.value = '';
    
    console.log('Loading users from Firestore...');
    
    // Load teachers and students from their respective collections
    const [teachersData, studentsData] = await Promise.all([
      getAllTeachers(),
      getAllStudents()
    ]);
    
    // Convert to AppUser format for the table
    const teacherUsers: AppUser[] = teachersData.map(teacher => ({
      uid: teacher.uid,
      email: teacher.email,
      displayName: teacher.displayName,
      role: teacher.role,
      isActive: teacher.isActive,
      createdAt: teacher.createdAt,
      lastLogin: teacher.lastLogin,
      aeriesId: teacher.aeriesId
    }));
    
    const studentUsers: AppUser[] = studentsData.map(student => ({
      uid: student.uid,
      email: student.email,
      displayName: student.displayName,
      role: student.role,
      isActive: student.isActive,
      createdAt: student.createdAt,
      lastLogin: student.lastLogin,
      googleId: student.googleId,
      seisId: student.seisId,
      aeriesId: student.aeriesId
    }));
    
    users.value = [...teacherUsers, ...studentUsers];
    console.log(`Loaded ${users.value.length} users (${teachersData.length} teachers, ${studentsData.length} students)`);
    
  } catch (err: any) {
    console.error('Error loading users:', err);
    error.value = err.message || 'Failed to load users. Please try again.';
  } finally {
    loading.value = false;
  }
};

const saveUser = async () => {
  try {
    saving.value = true;
    error.value = '';
    
    if (editingUser.value) {
      // Update existing user
      const index = users.value.findIndex(u => u.uid === editingUser.value!.uid);
      if (index !== -1) {
        users.value[index] = {
          ...users.value[index],
          displayName: userForm.value.displayName,
          role: userForm.value.role as UserRole,
          seisId: userForm.value.seisId,
          isActive: userForm.value.isActive
        };
      }
      success.value = 'User updated successfully!';
    } else {
      // Create new user
      const newUser: AppUser = {
        uid: Date.now().toString(), // Mock UID
        email: userForm.value.email,
        displayName: userForm.value.displayName,
        role: userForm.value.role as UserRole,
        seisId: userForm.value.seisId,
        isActive: userForm.value.isActive,
        createdAt: new Date(),
        lastLogin: new Date()
      };
      
      users.value.push(newUser);
      success.value = 'User created successfully!';
    }
    
    closeModal();
    setTimeout(() => { success.value = ''; }, 3000);
    
  } catch (err: any) {
    console.error('Error saving user:', err);
    error.value = 'Failed to save user. Please try again.';
  } finally {
    saving.value = false;
  }
};

const editUser = (user: AppUser) => {
  editingUser.value = user;
  userForm.value = {
    displayName: user.displayName || '',
    email: user.email,
    role: user.role,
    seisId: user.seisId || '',
    password: '',
    isActive: user.isActive
  };
};

const deleteUser = async (user: AppUser) => {
  if (user.uid === authStore.currentUser?.uid) {
    error.value = 'You cannot delete your own account.';
    return;
  }
  
  if (confirm(`Are you sure you want to delete ${user.displayName || user.email}? This action cannot be undone.`)) {
    try {
      const index = users.value.findIndex(u => u.uid === user.uid);
      if (index !== -1) {
        users.value.splice(index, 1);
        success.value = 'User deleted successfully!';
        setTimeout(() => { success.value = ''; }, 3000);
      }
    } catch (err: any) {
      console.error('Error deleting user:', err);
      error.value = 'Failed to delete user. Please try again.';
    }
  }
};

const toggleUserStatus = async (user: AppUser) => {
  if (user.uid === authStore.currentUser?.uid) {
    error.value = 'You cannot deactivate your own account.';
    return;
  }
  
  try {
    const index = users.value.findIndex(u => u.uid === user.uid);
    if (index !== -1) {
      users.value[index].isActive = !users.value[index].isActive;
      const status = users.value[index].isActive ? 'activated' : 'deactivated';
      success.value = `User ${status} successfully!`;
      setTimeout(() => { success.value = ''; }, 3000);
    }
  } catch (err: any) {
    console.error('Error updating user status:', err);
    error.value = 'Failed to update user status.';
  }
};

const bulkImport = () => {
  // TODO: Implement bulk import functionality
  alert('Bulk import functionality will be available soon.');
};

const exportUsers = () => {
  try {
    const csvContent = [
      ['Name', 'Email', 'Role', 'SEIS ID', 'Status', 'Created', 'Last Login'].join(','),
      ...users.value.map(user => [
        user.displayName || '',
        user.email,
        user.role,
        user.seisId || '',
        user.isActive ? 'Active' : 'Inactive',
        user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '',
        user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : ''
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'users_export.csv';
    link.click();
    window.URL.revokeObjectURL(url);
    
    success.value = 'User list exported successfully!';
    setTimeout(() => { success.value = ''; }, 3000);
  } catch (err) {
    error.value = 'Failed to export user list.';
  }
};

const closeModal = () => {
  showAddUserModal.value = false;
  editingUser.value = null;
  userForm.value = {
    displayName: '',
    email: '',
    role: '',
    seisId: '',
    password: '',
    isActive: true
  };
};

const getRoleIcon = (role: UserRole) => {
  switch (role) {
    case ROLES.ADMIN: return '👑';
    case ROLES.TEACHER: return '👨‍🏫';
    case ROLES.STUDENT: return '🎓';
    default: return '👤';
  }
};

const formatDate = (date: any) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString();
};

// Load users on component mount
onMounted(() => {
  loadUsers();
});
</script>

<style scoped>
/* Similar styles to StudentManagement.vue but adapted for user management */
.user-management {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 40px;
}

.header h1 {
  color: #1f2937;
  font-size: 2.5rem;
  margin-bottom: 10px;
}

.header p {
  color: #6b7280;
  font-size: 1.1rem;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  gap: 20px;
  flex-wrap: wrap;
}

.action-buttons {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.add-button,
.import-button,
.export-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-button {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  color: white;
}

.add-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(220, 38, 38, 0.3);
}

.import-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.import-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.export-button {
  background: #f3f4f6;
  color: #374151;
  border: 2px solid #e5e7eb;
}

.export-button:hover {
  background: #e5e7eb;
}

.search-bar {
  position: relative;
  min-width: 300px;
}

.search-input {
  width: 100%;
  padding: 12px 40px 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.search-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat-card {
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 20px;
  border-left: 4px solid #dc2626;
}

.stat-icon {
  font-size: 2.5rem;
  opacity: 0.8;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: #1f2937;
}

.stat-label {
  color: #6b7280;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.users-table-container {
  background: white;
  border-radius: 15px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  flex-wrap: wrap;
  gap: 15px;
}

.table-header h2 {
  color: #1f2937;
  font-size: 1.5rem;
}

.table-filters {
  display: flex;
  gap: 10px;
}

.filter-select {
  padding: 8px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.9rem;
}

.table-wrapper {
  overflow-x: auto;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.users-table th,
.users-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.users-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.user-row:hover {
  background: #f9fafb;
}

.user-cell {
  min-width: 200px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: white;
  font-weight: bold;
}

.user-avatar.admin {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
}

.user-avatar.teacher {
  background: linear-gradient(135deg, #059669, #047857);
}

.user-avatar.student {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
}

.user-details strong {
  display: block;
  color: #1f2937;
  font-size: 0.95rem;
}

.user-details small {
  color: #6b7280;
  font-size: 0.8rem;
}

.role-badge {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
}

.role-badge.admin {
  background: #fef2f2;
  color: #dc2626;
}

.role-badge.teacher {
  background: #f0fdf4;
  color: #166534;
}

.role-badge.student {
  background: #eff6ff;
  color: #2563eb;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge.active {
  background: #dcfce7;
  color: #166534;
}

.status-badge.inactive {
  background: #fef2f2;
  color: #dc2626;
}

.action-buttons-cell {
  display: flex;
  gap: 8px;
}

.edit-btn,
.status-btn,
.delete-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-btn {
  background: #f0f4ff;
  color: #3730a3;
}

.edit-btn:hover {
  background: #e0e7ff;
}

.status-btn.activate {
  background: #f0fdf4;
  color: #166534;
}

.status-btn.activate:hover {
  background: #dcfce7;
}

.status-btn.deactivate {
  background: #fef3c7;
  color: #92400e;
}

.status-btn.deactivate:hover {
  background: #fde68a;
}

.delete-btn {
  background: #fef2f2;
  color: #dc2626;
}

.delete-btn:hover:not(:disabled) {
  background: #fee2e2;
}

.delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Modal and form styles similar to StudentManagement */
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
  padding: 20px;
}

.modal {
  background: white;
  border-radius: 15px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25px 30px 0;
  margin-bottom: 25px;
}

.modal-header h3 {
  color: #1f2937;
  font-size: 1.5rem;
  margin: 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f3f4f6;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  color: #6b7280;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.user-form {
  padding: 0 30px 30px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  color: #374151;
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.checkbox-label {
  display: flex !important;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.form-input,
.form-select {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input:disabled {
  background: #f9fafb;
  color: #6b7280;
  cursor: not-allowed;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.cancel-btn,
.save-btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn {
  background: #f3f4f6;
  color: #374151;
  border: 2px solid #e5e7eb;
}

.cancel-btn:hover {
  background: #e5e7eb;
}

.save-btn {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  color: white;
  border: none;
}

.save-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(220, 38, 38, 0.3);
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.7;
}

.empty-state h3 {
  color: #1f2937;
  font-size: 1.5rem;
  margin-bottom: 15px;
}

.empty-state p {
  color: #6b7280;
  font-size: 1.1rem;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
}

.page-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-btn:hover:not(:disabled) {
  background: #5a67d8;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #6b7280;
  font-size: 0.9rem;
}

.loading {
  text-align: center;
  padding: 60px 20px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #dc2626;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
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

@media (max-width: 768px) {
  .user-management {
    padding: 15px;
  }
  
  .action-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .action-buttons {
    justify-content: center;
  }
  
  .search-bar {
    min-width: auto;
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
  }
  
  .table-header {
    flex-direction: column;
    gap: 15px;
  }
  
  .table-filters {
    flex-direction: column;
    width: 100%;
  }
  
  .modal-actions {
    flex-direction: column;
  }
}
</style>
