import { ref, computed } from 'vue';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase/config';

// Global auth state
const currentUser = ref<User | null>(null);
const userProfile = ref<any>(null);
const isLoading = ref(true);

// Initialize auth listener
onAuthStateChanged(auth, async (user) => {
  currentUser.value = user;
  
  if (user) {
    try {
      // Load user profile from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        userProfile.value = userDoc.data();
      } else {
        userProfile.value = null;
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      userProfile.value = null;
    }
  } else {
    userProfile.value = null;
  }
  
  isLoading.value = false;
});

export function useAuthState() {
  const isAuthenticated = computed(() => !!currentUser.value);
  const isTeacher = computed(() => userProfile.value?.userType === 'teacher');
  const isStudent = computed(() => userProfile.value?.userType === 'student');
  const displayName = computed(() => 
    userProfile.value?.displayName || 
    currentUser.value?.displayName || 
    currentUser.value?.email || 
    'User'
  );

  return {
    currentUser: computed(() => currentUser.value),
    userProfile: computed(() => userProfile.value),
    isLoading: computed(() => isLoading.value),
    isAuthenticated,
    isTeacher,
    isStudent,
    displayName
  };
}
