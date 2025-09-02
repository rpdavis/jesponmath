<template>
  <div class="simple-auth">
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h1>📊 JepsonMath Assessments</h1>
          <p>Sign in to manage IEP assessments and track student progress</p>
        </div>

        <!-- Sign In Form -->
        <div v-if="!user" class="auth-form">
          <form @submit.prevent="signIn" class="sign-in-form">
            <h2>{{ isSignUp ? 'Create Account' : 'Sign In' }}</h2>
            
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
              <small v-if="isSignUp" class="form-help">Password must be at least 6 characters</small>
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
              <label for="userType">Account Type</label>
              <select id="userType" v-model="userType" required class="form-select">
                <option value="">Select account type</option>
                <option value="teacher">Teacher</option>
                <option value="student">Student</option>
              </select>
            </div>
            
            <button type="submit" class="auth-button" :disabled="loading">
              {{ loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In') }}
            </button>
          </form>

          <div class="auth-toggle">
            <p>
              {{ isSignUp ? 'Already have an account?' : "Don't have an account?" }}
              <button @click="toggleMode" class="toggle-button">
                {{ isSignUp ? 'Sign In' : 'Create Account' }}
              </button>
            </p>
          </div>

          <!-- Quick Demo Access -->
          <div class="demo-access">
            <hr>
            <p>For testing purposes:</p>
            <button @click="demoSignIn" class="demo-button" :disabled="loading">
              🚀 Demo Access (No Password Required)
            </button>
          </div>
        </div>

        <!-- Signed In State -->
        <div v-else class="signed-in">
          <div class="user-info">
            <div class="user-avatar">👤</div>
            <div class="user-details">
              <h3>Welcome, {{ user.displayName || user.email }}!</h3>
              <p>{{ userProfile?.userType || 'User' }} Account</p>
            </div>
          </div>
          
          <div class="auth-actions">
            <router-link to="/" class="continue-button">
              Continue to App →
            </router-link>
            <button @click="signOut" class="sign-out-button">
              Sign Out
            </button>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <!-- Success Message -->
        <div v-if="success" class="success-message">
          {{ success }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase/config';

const router = useRouter();

// Reactive state
const email = ref('');
const password = ref('');
const displayName = ref('');
const userType = ref('');
const isSignUp = ref(false);
const loading = ref(false);
const error = ref('');
const success = ref('');
const user = ref<any>(null);
const userProfile = ref<any>(null);

// Methods
const signIn = async () => {
  try {
    loading.value = true;
    error.value = '';
    success.value = '';

    let userCredential;

    if (isSignUp.value) {
      // Create new account
      userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value);
      
      // Update profile
      await updateProfile(userCredential.user, {
        displayName: displayName.value
      });

      // Create user profile in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: email.value,
        displayName: displayName.value,
        userType: userType.value,
        createdAt: new Date(),
        isActive: true
      });

      success.value = 'Account created successfully!';
    } else {
      // Sign in existing user
      userCredential = await signInWithEmailAndPassword(auth, email.value, password.value);
      success.value = 'Signed in successfully!';
    }

    // Redirect after short delay
    setTimeout(() => {
      router.push('/');
    }, 1500);

  } catch (err: any) {
    console.error('Authentication error:', err);
    
    // Handle specific error codes
    switch (err.code) {
      case 'auth/user-not-found':
        error.value = 'No account found with this email address.';
        break;
      case 'auth/wrong-password':
        error.value = 'Incorrect password.';
        break;
      case 'auth/email-already-in-use':
        error.value = 'An account with this email already exists.';
        break;
      case 'auth/weak-password':
        error.value = 'Password should be at least 6 characters.';
        break;
      case 'auth/invalid-email':
        error.value = 'Please enter a valid email address.';
        break;
      default:
        error.value = 'Authentication failed. Please try again.';
    }
  } finally {
    loading.value = false;
  }
};

const demoSignIn = async () => {
  try {
    loading.value = true;
    error.value = '';
    
    // Sign in anonymously for demo purposes
    const userCredential = await signInAnonymously(auth);
    
    // Create a demo user profile
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email: 'demo@jepsonmath.com',
      displayName: 'Demo User',
      userType: 'teacher',
      createdAt: new Date(),
      isActive: true,
      isDemo: true
    });

    success.value = 'Demo access granted!';
    
    setTimeout(() => {
      router.push('/');
    }, 1500);

  } catch (err: any) {
    console.error('Demo sign in error:', err);
    error.value = 'Demo access failed. Please try again.';
  } finally {
    loading.value = false;
  }
};

const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    success.value = 'Signed out successfully!';
    user.value = null;
    userProfile.value = null;
  } catch (err) {
    console.error('Sign out error:', err);
    error.value = 'Failed to sign out.';
  }
};

const toggleMode = () => {
  isSignUp.value = !isSignUp.value;
  error.value = '';
  success.value = '';
};

const loadUserProfile = async (userId: string) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      userProfile.value = userDoc.data();
    }
  } catch (err) {
    console.error('Error loading user profile:', err);
  }
};

// Listen for auth state changes
onMounted(() => {
  onAuthStateChanged(auth, async (currentUser) => {
    user.value = currentUser;
    if (currentUser) {
      await loadUserProfile(currentUser.uid);
    } else {
      userProfile.value = null;
    }
  });
});
</script>

<style scoped>
.simple-auth {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.auth-container {
  width: 100%;
  max-width: 500px;
}

.auth-card {
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.auth-header {
  text-align: center;
  margin-bottom: 40px;
}

.auth-header h1 {
  color: #1f2937;
  font-size: 2rem;
  margin-bottom: 15px;
}

.auth-header p {
  color: #6b7280;
  line-height: 1.6;
}

.auth-form {
  margin-bottom: 30px;
}

.sign-in-form h2 {
  color: #1f2937;
  font-size: 1.5rem;
  margin-bottom: 25px;
  text-align: center;
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

.form-input,
.form-select {
  width: 100%;
  padding: 15px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
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

.form-help {
  color: #6b7280;
  font-size: 0.8rem;
  margin-top: 5px;
  display: block;
}

.auth-button {
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
  margin-top: 10px;
}

.auth-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.auth-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-toggle {
  text-align: center;
  margin: 30px 0;
  padding: 20px 0;
  border-top: 1px solid #e5e7eb;
}

.auth-toggle p {
  color: #6b7280;
  margin: 0;
}

.toggle-button {
  background: none;
  border: none;
  color: #667eea;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  margin-left: 5px;
}

.toggle-button:hover {
  color: #5a67d8;
}

.demo-access {
  text-align: center;
  margin-top: 20px;
}

.demo-access hr {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 20px 0;
}

.demo-access p {
  color: #6b7280;
  font-size: 0.9rem;
  margin-bottom: 15px;
}

.demo-button {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.demo-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
}

.demo-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.signed-in {
  text-align: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  padding: 20px;
  background: #f9fafb;
  border-radius: 15px;
}

.user-avatar {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: white;
}

.user-details {
  text-align: left;
  flex: 1;
}

.user-details h3 {
  color: #1f2937;
  font-size: 1.3rem;
  margin: 0 0 5px 0;
}

.user-details p {
  color: #6b7280;
  margin: 0;
  text-transform: capitalize;
}

.auth-actions {
  display: flex;
  gap: 15px;
  flex-direction: column;
}

.continue-button {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  text-decoration: none;
  padding: 15px 30px;
  border-radius: 10px;
  font-weight: 600;
  transition: all 0.2s ease;
  display: inline-block;
}

.continue-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
}

.sign-out-button {
  background: #f3f4f6;
  color: #374151;
  border: 2px solid #e5e7eb;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sign-out-button:hover {
  background: #e5e7eb;
}

.error-message {
  background: #fef2f2;
  color: #dc2626;
  border: 2px solid #fecaca;
  border-radius: 10px;
  padding: 15px;
  margin-top: 20px;
  text-align: center;
  font-weight: 500;
}

.success-message {
  background: #f0fdf4;
  color: #166534;
  border: 2px solid #bbf7d0;
  border-radius: 10px;
  padding: 15px;
  margin-top: 20px;
  text-align: center;
  font-weight: 500;
}

@media (max-width: 768px) {
  .simple-auth {
    padding: 15px;
  }
  
  .auth-card {
    padding: 30px 20px;
  }
  
  .auth-header h1 {
    font-size: 1.7rem;
  }
  
  .user-info {
    flex-direction: column;
    text-align: center;
  }
  
  .user-details {
    text-align: center;
  }
}
</style>
