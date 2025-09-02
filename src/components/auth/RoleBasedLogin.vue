<template>
  <div class="role-based-login">
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h1>📊 JepsonMath Assessments</h1>
          <p>IEP Math Assessment Tracking System</p>
        </div>

        <!-- Loading State -->
        <div v-if="authStore.isLoading" class="loading-section">
          <div class="loading-spinner"></div>
          <p>Initializing authentication...</p>
        </div>

        <!-- Login Form -->
        <div v-else class="login-form">
          <!-- Tab Selection -->
          <div class="login-tabs">
            <button 
              @click="activeTab = 'google'" 
              :class="{ active: activeTab === 'google' }"
              class="tab-button"
            >
              <span class="tab-icon">🔐</span>
              Google Sign-In
            </button>
            <button 
              @click="activeTab = 'email'" 
              :class="{ active: activeTab === 'email' }"
              class="tab-button"
            >
              <span class="tab-icon">✉️</span>
              Email & Password
            </button>
          </div>

          <!-- Google Sign-In Tab -->
          <div v-if="activeTab === 'google'" class="tab-content">
            <div class="google-signin-section">
              <div class="signin-info">
                <h3>Sign in with Google</h3>
                <p>Use your Google account to access the assessment system</p>
                <ul class="role-info">
                  <li><span class="role-badge admin">👑 Admin</span> - Full system management</li>
                  <li><span class="role-badge teacher">👨‍🏫 Teacher</span> - Create assessments, manage students</li>
                  <li><span class="role-badge student">🎓 Student</span> - Take assessments, view progress</li>
                </ul>
              </div>
              
              <button 
                @click="handleGoogleLogin" 
                class="google-signin-button"
                :disabled="isLoading"
              >
                <span class="google-icon">🔑</span>
                {{ isLoading ? 'Signing in...' : 'Sign in with Google' }}
              </button>
            </div>
          </div>

          <!-- Email & Password Tab -->
          <div v-if="activeTab === 'email'" class="tab-content">
            <form @submit.prevent="handleEmailAuth" class="email-form">
              <div class="form-mode-toggle">
                <button 
                  type="button"
                  @click="isSignUp = false" 
                  :class="{ active: !isSignUp }"
                  class="mode-button"
                >
                  Sign In
                </button>
                <button 
                  type="button"
                  @click="isSignUp = true" 
                  :class="{ active: isSignUp }"
                  class="mode-button"
                >
                  Sign Up
                </button>
              </div>

              <div class="form-fields">
                <div class="form-group">
                  <label for="email">Email Address</label>
                  <input 
                    id="email"
                    v-model="email"
                    type="email"
                    required
                    class="form-input"
                    placeholder="Enter your email"
                  >
                </div>

                <div class="form-group">
                  <label for="password">Password</label>
                  <input 
                    id="password"
                    v-model="password"
                    type="password"
                    required
                    class="form-input"
                    placeholder="Enter your password"
                    :minlength="isSignUp ? 6 : 1"
                  >
                  <small v-if="isSignUp" class="form-help">
                    Password must be at least 6 characters
                  </small>
                </div>

                <div v-if="isSignUp" class="form-group">
                  <label for="displayName">Full Name</label>
                  <input 
                    id="displayName"
                    v-model="displayName"
                    type="text"
                    required
                    class="form-input"
                    placeholder="Enter your full name"
                  >
                </div>

                <div v-if="isSignUp" class="form-group">
                  <label for="role">Account Type</label>
                  <select id="role" v-model="selectedRole" required class="form-select">
                    <option value="">Select account type</option>
                    <option value="teacher">👨‍🏫 Teacher</option>
                    <option value="student">🎓 Student</option>
                  </select>
                  <small class="form-help">
                    Admin accounts must be created by existing administrators
                  </small>
                </div>
              </div>

              <button 
                type="submit" 
                class="email-auth-button"
                :disabled="isLoading || (isSignUp && !selectedRole)"
              >
                {{ isLoading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In') }}
              </button>
            </form>
          </div>

          <!-- Demo Access -->
          <div class="demo-section">
            <hr class="divider">
            <div class="demo-info">
              <h4>Demo Access</h4>
              <p>Try the system without creating an account</p>
            </div>
            <button 
              @click="handleDemoLogin" 
              class="demo-button"
              :disabled="isLoading"
            >
              <span class="demo-icon">🚀</span>
              Demo Access (Teacher View)
            </button>
          </div>
        </div>

        <!-- Messages -->
        <div v-if="authStore.error" class="error-message">
          <span class="message-icon">⚠️</span>
          {{ authStore.error }}
        </div>

        <div v-if="authStore.success" class="success-message">
          <span class="message-icon">✅</span>
          {{ authStore.success }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { ROLES } from '@/config/roles';

const router = useRouter();
const authStore = useAuthStore();

// Form state
const activeTab = ref<'google' | 'email'>('google');
const isSignUp = ref(false);
const isLoading = ref(false);
const email = ref('');
const password = ref('');
const displayName = ref('');
const selectedRole = ref('');

// Auto-redirect if already authenticated
const checkAuthAndRedirect = () => {
  if (authStore.isAuthenticated && authStore.currentUser?.role) {
    console.log('🔄 Already authenticated, redirecting to home');
    router.push('/');
  }
};

// Google login handler
const handleGoogleLogin = async () => {
  isLoading.value = true;
  authStore.clearMessages();
  
  try {
    const success = await authStore.loginWithGoogle();
    if (success) {
      setTimeout(() => {
        router.push('/');
      }, 1500);
    }
  } catch (error) {
    console.error('Google login error:', error);
  } finally {
    isLoading.value = false;
  }
};

// Email authentication handler
const handleEmailAuth = async () => {
  isLoading.value = true;
  authStore.clearMessages();
  
  try {
    let success = false;
    
    if (isSignUp.value) {
      success = await authStore.registerWithEmail(
        email.value,
        password.value,
        displayName.value,
        selectedRole.value as any
      );
    } else {
      success = await authStore.loginWithEmail(email.value, password.value);
    }
    
    if (success) {
      setTimeout(() => {
        router.push('/');
      }, 1500);
    }
  } catch (error) {
    console.error('Email auth error:', error);
  } finally {
    isLoading.value = false;
  }
};

// Demo login handler
const handleDemoLogin = async () => {
  isLoading.value = true;
  authStore.clearMessages();
  
  try {
    const success = await authStore.loginDemo();
    if (success) {
      setTimeout(() => {
        router.push('/');
      }, 1500);
    }
  } catch (error) {
    console.error('Demo login error:', error);
  } finally {
    isLoading.value = false;
  }
};

// Clear messages when component unmounts
onMounted(() => {
  authStore.clearMessages();
  
  // Check if already authenticated
  if (!authStore.isLoading) {
    checkAuthAndRedirect();
  }
});

onUnmounted(() => {
  authStore.clearMessages();
});
</script>

<style scoped>
.role-based-login {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-container {
  width: 100%;
  max-width: 600px;
}

.login-card {
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.login-header h1 {
  color: #1f2937;
  font-size: 2.2rem;
  margin-bottom: 10px;
}

.login-header p {
  color: #6b7280;
  font-size: 1.1rem;
}

.loading-section {
  text-align: center;
  padding: 60px 20px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.login-tabs {
  display: flex;
  background: #f3f4f6;
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 30px;
}

.tab-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  color: #6b7280;
}

.tab-button.active {
  background: white;
  color: #1f2937;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tab-button:hover:not(.active) {
  color: #374151;
}

.tab-content {
  margin-bottom: 30px;
}

.google-signin-section {
  text-align: center;
}

.signin-info h3 {
  color: #1f2937;
  font-size: 1.3rem;
  margin-bottom: 10px;
}

.signin-info p {
  color: #6b7280;
  margin-bottom: 20px;
}

.role-info {
  list-style: none;
  padding: 0;
  margin: 0 0 30px 0;
  text-align: left;
  display: inline-block;
}

.role-info li {
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.role-badge {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  min-width: 80px;
  text-align: center;
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

.google-signin-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  background: linear-gradient(135deg, #4285f4 0%, #34a853 100%);
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.google-signin-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(66, 133, 244, 0.3);
}

.google-signin-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-mode-toggle {
  display: flex;
  background: #f3f4f6;
  border-radius: 8px;
  padding: 2px;
  margin-bottom: 25px;
}

.mode-button {
  flex: 1;
  padding: 8px 16px;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  color: #6b7280;
}

.mode-button.active {
  background: white;
  color: #1f2937;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 25px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  color: #374151;
  font-weight: 600;
  font-size: 0.9rem;
}

.form-input,
.form-select {
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-help {
  color: #6b7280;
  font-size: 0.8rem;
  font-style: italic;
}

.email-auth-button {
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 15px;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.email-auth-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.email-auth-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.demo-section {
  text-align: center;
  margin-top: 30px;
}

.divider {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 30px 0 20px 0;
}

.demo-info h4 {
  color: #1f2937;
  font-size: 1.1rem;
  margin-bottom: 5px;
}

.demo-info p {
  color: #6b7280;
  font-size: 0.9rem;
  margin-bottom: 15px;
}

.demo-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin: 0 auto;
}

.demo-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
}

.demo-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message,
.success-message {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px;
  border-radius: 10px;
  margin-top: 20px;
  font-weight: 500;
}

.error-message {
  background: #fef2f2;
  color: #dc2626;
  border: 2px solid #fecaca;
}

.success-message {
  background: #f0fdf4;
  color: #166534;
  border: 2px solid #bbf7d0;
}

@media (max-width: 768px) {
  .role-based-login {
    padding: 15px;
  }
  
  .login-card {
    padding: 30px 20px;
  }
  
  .login-header h1 {
    font-size: 1.8rem;
  }
  
  .login-tabs {
    flex-direction: column;
    gap: 2px;
  }
  
  .role-info {
    text-align: center;
  }
}
</style>
