<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { usePermissions } from '@/composables/usePermissions';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const permissions = usePermissions();

// Menu state and refs
const menuOpen = ref(false);
const navMenuRef = ref<HTMLElement | null>(null);

// No game routes in assessment app
const isGameRoute = computed(() => false);

// Function to go back to home
const goHome = () => {
  router.push('/');
};

// Show navbar only for authenticated users and non-login routes
const showNavbar = computed(() => {
  return authStore.isAuthenticated && route.path !== '/login';
});

// Menu functions
const toggleMenu = () => {
  menuOpen.value = !menuOpen.value;
};

const closeMenu = () => {
  menuOpen.value = false;
};

const handleLogout = async () => {
  await authStore.logout();
  router.push('/login');
};

// Click outside to close menu
const handleClickOutside = (event: MouseEvent) => {
  if (navMenuRef.value && !navMenuRef.value.contains(event.target as Node)) {
    closeMenu();
  }
};

// Set up event listeners
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <div id="app">
    <!-- Role-based Navigation -->
    <nav v-if="showNavbar" class="navbar">
      <div class="nav-container">
        <div class="nav-brand">
          <img src="/src/assets/jepson-logo.png" alt="Jepson Logo" class="brand-icon">
          <span class="brand-text">JepsonMath</span>
          <span v-if="authStore.currentUser" class="user-role-badge" :class="authStore.userRole">
            {{ permissions.getRoleIcon(authStore.userRole!) }} {{ authStore.userRole }}
          </span>
        </div>
        
        <div class="nav-user-info">
          <span class="user-name">{{ authStore.displayName }}</span>
          <div class="nav-menu" ref="navMenuRef">
            <button @click="toggleMenu" class="menu-button">
              <span class="menu-icon">☰</span>
              Menu
            </button>
            <div v-if="menuOpen" class="nav-dropdown">

              
              <!-- Role-based navigation items -->
              <template v-if="Array.isArray(permissions.navigationItems) && permissions.navigationItems.length > 0">
                <router-link 
                  v-for="item in permissions.navigationItems" 
                  :key="item.path"
                  :to="item.path" 
                  class="nav-link" 
                  @click="closeMenu"
                >
                  {{ item.icon }} {{ item.label }}
                </router-link>
              </template>
              
              <!-- Fallback if no navigation items -->
              <template v-else>
                <router-link to="/" class="nav-link" @click="closeMenu">
                  🏠 Dashboard
                </router-link>
                
                <!-- Math Fluency Links (Teacher) -->
                <template v-if="authStore.isTeacher">
                  <div class="nav-section-header">Math Fluency</div>
                  <router-link to="/fluency/dashboard" class="nav-link highlighted" @click="closeMenu">
                    📊 Fluency Dashboard
                  </router-link>
                  <router-link to="/fluency/initial-diagnostic" class="nav-link" @click="closeMenu">
                    🔢 Initial Diagnostic
                  </router-link>
                  <router-link to="/fluency/paper-assessment" class="nav-link" @click="closeMenu">
                    📄 Generate Probes
                  </router-link>
                  <router-link to="/fluency/score-entry" class="nav-link" @click="closeMenu">
                    📝 Enter Scores
                  </router-link>
                  <div class="nav-divider"></div>
                </template>
                
                <router-link v-if="authStore.isTeacher" to="/assessment/create" class="nav-link" @click="closeMenu">
                  ➕ Create Assessment
                </router-link>
                <router-link v-if="authStore.isTeacher" to="/students" class="nav-link" @click="closeMenu">
                  🎓 My Students
                </router-link>
                <router-link v-if="authStore.isTeacher" to="/manage-assessments" class="nav-link" @click="closeMenu">
                  📋 Manage Assessments
                </router-link>
                <router-link v-if="authStore.isTeacher" to="/gradebook" class="nav-link" @click="closeMenu">
                  📊 Gradebook
                </router-link>
                <router-link v-if="authStore.isTeacher" to="/assessments" class="nav-link" @click="closeMenu">
                  📝 My Assessments
                </router-link>
                <router-link v-if="authStore.isTeacher" to="/progress" class="nav-link" @click="closeMenu">
                  📈 Student Progress
                </router-link>
                <router-link v-if="authStore.isTeacher" to="/admin/aeries-export" class="nav-link" @click="closeMenu">
                  📤 Export to Aeries
                </router-link>
                <router-link v-if="authStore.isTeacher" to="/admin/standard-assessment-export" class="nav-link" @click="closeMenu">
                  📊 Export Standard Assessments
                </router-link>
                
                <!-- Math Fluency Links (Student) -->
                <template v-if="authStore.isStudent">
                  <div class="nav-section-header">Math Fluency</div>
                  <router-link to="/fluency/daily-practice" class="nav-link highlighted" @click="closeMenu">
                    🔢 Daily Practice
                  </router-link>
                  <router-link to="/fluency/my-progress" class="nav-link highlighted" @click="closeMenu">
                    📊 My Progress
                  </router-link>
                  <div class="nav-divider"></div>
                </template>
                
                <router-link v-if="authStore.isStudent" to="/assessments" class="nav-link" @click="closeMenu">
                  📝 My Assessments
                </router-link>
                <router-link v-if="authStore.isStudent" to="/my-results" class="nav-link" @click="closeMenu">
                  📊 My Results
                </router-link>
                <router-link v-if="authStore.isAdmin" to="/admin/users" class="nav-link" @click="closeMenu">
                  👥 Manage Users
                </router-link>
                <router-link v-if="authStore.isAdmin" to="/admin/teachers" class="nav-link" @click="closeMenu">
                  👨‍🏫 Manage Teachers
                </router-link>
                <router-link v-if="authStore.isAdmin" to="/students" class="nav-link" @click="closeMenu">
                  🎓 Manage Students
                </router-link>
                <router-link v-if="authStore.isAdmin" to="/manage-assessments" class="nav-link" @click="closeMenu">
                  📋 All Assessments
                </router-link>
              </template>
              
              <!-- Always show logout -->
              <div class="nav-divider"></div>
              <button @click="handleLogout" class="nav-link logout-link">
                🚪 Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- No game navigation needed -->

    <!-- Main content area -->
    <main :class="{ 'main-content': !isGameRoute, 'game-content': isGameRoute }">
      <router-view />
    </main>
  </div>
</template>

<style>
/* Global reset */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* App container */
#app {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

.navbar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 70px;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: bold;
  color: #1f2937;
}

.brand-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.brand-text {
  font-size: 20px;
}

.user-role-badge {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.user-role-badge.admin {
  background: #fef2f2;
  color: #dc2626;
}

.user-role-badge.teacher {
  background: #f0fdf4;
  color: #166534;
}

.user-role-badge.student {
  background: #eff6ff;
  color: #2563eb;
}

.nav-user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-name {
  color: #374151;
  font-weight: 500;
  font-size: 14px;
}

.nav-menu {
  position: relative;
}

.menu-button {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #667eea;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.menu-button:hover {
  background: #5a67d8;
  transform: translateY(-1px);
}

.menu-icon {
  font-size: 1.2rem;
}

.nav-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 200px;
  padding: 8px;
  margin-top: 8px;
}

.nav-link {
  display: block;
  text-decoration: none;
  color: #374151;
  font-weight: 500;
  padding: 12px 16px;
  border-radius: 8px;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.nav-link:hover {
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
}

.nav-link.router-link-active {
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
}

.nav-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 8px 0;
}

.nav-section-header {
  padding: 8px 16px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #9ca3af;
  letter-spacing: 0.05em;
  margin-top: 8px;
}

.nav-link.highlighted {
  background: #ecfdf5;
  border-left: 3px solid #10b981;
  font-weight: 600;
}

.nav-link.highlighted:hover {
  background: #d1fae5;
}

.logout-link {
  background: none !important;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  color: #dc2626 !important;
}

.logout-link:hover {
  background: rgba(220, 38, 38, 0.1) !important;
}

.main-content {
  flex: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  box-sizing: border-box;
}

.game-content {
  flex: 1;
  width: 100%;
  min-height: calc(100vh - 60px);
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
}

.game-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  padding: 10px 20px;
}

.back-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 25px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.back-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

@media (max-width: 768px) {
  .nav-container {
    padding: 0 15px;
  }
  
  .nav-brand {
    font-size: 20px;
  }
  
  .nav-links {
    gap: 10px;
  }
  
  .nav-link {
    padding: 8px 10px;
    font-size: 14px;
  }
  
  .main-content {
    padding: 20px 15px;
  }
}

@media (max-width: 640px) {
  .nav-links {
    display: none;
  }
  
  .nav-container {
    justify-content: center;
  }
}
</style>
