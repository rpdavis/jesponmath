<template>
  <div class="assessment-home">

    
    <!-- Loading state -->
    <div v-if="authStore.isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading your dashboard...</p>
    </div>
    
    <!-- Role-specific home page content -->
    <div v-else-if="authStore.isAuthenticated && !authStore.isLoading" class="role-specific-home">
      <!-- Admin Home View -->
      <AdminDashboard v-if="authStore.isAdmin" />
      
      <!-- Teacher Home View -->
      <TeacherDashboard v-else-if="authStore.isTeacher" />
      
      <!-- Student Home View -->
      <StudentDashboard v-else-if="authStore.isStudent" />
    </div>
    
    <!-- Fallback for unauthenticated users -->
    <div v-else class="fallback-dashboard">
      <div class="hero-section">
        <div class="hero-content">
          <h1>📊 JepsonMath Assessment Tracker</h1>
          <p>Track and manage IEP goal assessments for math students</p>
        </div>
      </div>

      <div class="features-section">
        <h2>Key Features</h2>
        <div class="features-grid">
          <div class="feature-item">
            <div class="feature-icon">🎯</div>
            <h4>IEP Goal Alignment</h4>
            <p>Assessments aligned to specific IEP math goals and standards</p>
          </div>
          <div class="feature-item">
            <div class="feature-icon">📊</div>
            <h4>Progress Monitoring</h4>
            <p>Track student progress over time with detailed analytics</p>
          </div>
          <div class="feature-item">
            <div class="feature-icon">♿</div>
            <h4>Accommodations</h4>
            <p>Support for various accommodations and accessibility needs</p>
          </div>
          <div class="feature-item">
            <div class="feature-icon">👥</div>
            <h4>Role-Based Access</h4>
            <p>Separate interfaces for administrators, teachers, and students</p>
          </div>
        </div>
      </div>

      <div class="auth-prompt">
        <router-link to="/login" class="login-button">
          🔐 Sign In to Get Started
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch, nextTick } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import { usePermissions } from '@/composables/usePermissions';
import AdminDashboard from '@/components/dashboards/AdminDashboard.vue';
import TeacherDashboard from '@/components/dashboards/TeacherDashboard.vue';
import StudentDashboard from '@/components/dashboards/StudentDashboard.vue';

const authStore = useAuthStore();
const permissions = usePermissions();

// Debug role detection
const debugRoleInfo = () => {
  console.log('🏠 AssessmentHome - Debug info:');
  console.log('  - isLoading:', authStore.isLoading);
  console.log('  - isAuthenticated:', authStore.isAuthenticated);
  console.log('  - currentUser:', authStore.currentUser);
  console.log('  - userRole:', authStore.userRole);
  console.log('  - isAdmin:', permissions.isAdmin);
  console.log('  - isTeacher:', permissions.isTeacher);
  console.log('  - isStudent:', permissions.isStudent);
  permissions.debugPermissions();
};

onMounted(() => {
  debugRoleInfo();
});

// Watch for changes in authentication state
watch(() => authStore.currentUser, (newUser) => {
  if (newUser) {
    nextTick(() => {
      console.log('🔄 User changed, re-checking roles...');
      debugRoleInfo();
    });
  }
}, { deep: true });

// Watch for changes in loading state
watch(() => authStore.isLoading, (isLoading) => {
  if (!isLoading) {
    nextTick(() => {
      console.log('✅ Loading complete, checking final roles...');
      debugRoleInfo();
    });
  }
});
</script>

<style scoped>
.assessment-home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.hero-section {
  text-align: center;
  padding: 60px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  margin-bottom: 50px;
  color: white;
}

.hero-content h1 {
  font-size: 3rem;
  margin-bottom: 20px;
  font-weight: bold;
}

.hero-content p {
  font-size: 1.3rem;
  opacity: 0.9;
}

.main-actions {
  margin-bottom: 60px;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 25px;
}

.action-card {
  background: white;
  border-radius: 15px;
  padding: 30px;
  text-decoration: none;
  color: inherit;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  text-align: center;
}

.action-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.action-icon {
  font-size: 3rem;
  margin-bottom: 20px;
}

.action-card h3 {
  color: #1f2937;
  font-size: 1.3rem;
  margin-bottom: 15px;
}

.action-card p {
  color: #6b7280;
  line-height: 1.5;
}

/* Role-specific styling - using original dashboard components */
.role-specific-home {
  width: 100%;
}

/* Loading state */
.loading-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  margin: 40px auto;
  max-width: 400px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

.loading-state p {
  color: #6b7280;
  font-size: 1.1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}



.features-section {
  text-align: center;
}

.features-section h2 {
  color: #1f2937;
  font-size: 2rem;
  margin-bottom: 40px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 30px;
}

.feature-item {
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.feature-icon {
  font-size: 2.5rem;
  margin-bottom: 15px;
}

.feature-item h4 {
  color: #1f2937;
  font-size: 1.1rem;
  margin-bottom: 10px;
}

.feature-item p {
  color: #6b7280;
  line-height: 1.5;
  font-size: 0.9rem;
}

.auth-prompt {
  text-align: center;
  margin-top: 40px;
}

.login-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-decoration: none;
  padding: 15px 30px;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  transition: all 0.2s ease;
  display: inline-block;
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

@media (max-width: 768px) {
  .hero-content h1 {
    font-size: 2.2rem;
  }
  
  .hero-content p {
    font-size: 1.1rem;
  }
  
  .action-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}
</style>
