import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  query, 
  orderBy, 
  limit,
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  signInAnonymously, 
  signOut, 
  onAuthStateChanged,
  type User 
} from 'firebase/auth';
import { db, auth } from './config';

// Types for your math game
export interface GameScore {
  id?: string;
  userId: string;
  score: number;
  level: number;
  timeSpent: number;
  problemsSolved: number;
  accuracy: number;
  timestamp: any;
}

export interface UserProfile {
  id: string;
  displayName?: string;
  totalScore: number;
  gamesPlayed: number;
  bestScore: number;
  averageAccuracy: number;
  lastPlayed: any;
}

// Authentication services
export const signInAnonymouslyUser = async () => {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error) {
    console.error('Error signing in anonymously:', error);
    throw error;
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Game score services
export const saveGameScore = async (scoreData: Omit<GameScore, 'id' | 'timestamp'>) => {
  try {
    const docRef = await addDoc(collection(db, 'gameScores'), {
      ...scoreData,
      timestamp: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving game score:', error);
    throw error;
  }
};

export const getUserScores = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'gameScores'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as GameScore[];
  } catch (error) {
    console.error('Error getting user scores:', error);
    throw error;
  }
};

export const getTopScores = async (limitCount: number = 10) => {
  try {
    const q = query(
      collection(db, 'gameScores'),
      orderBy('score', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as GameScore[];
  } catch (error) {
    console.error('Error getting top scores:', error);
    throw error;
  }
};

// User profile services
export const createUserProfile = async (userId: string, displayName?: string) => {
  try {
    const userProfile: Omit<UserProfile, 'id'> = {
      displayName,
      totalScore: 0,
      gamesPlayed: 0,
      bestScore: 0,
      averageAccuracy: 0,
      lastPlayed: serverTimestamp()
    };
    
    await addDoc(collection(db, 'userProfiles'), {
      id: userId,
      ...userProfile
    });
    
    return { id: userId, ...userProfile };
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const getUserProfile = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'userProfiles'),
      where('id', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as UserProfile;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
  try {
    const q = query(
      collection(db, 'userProfiles'),
      where('id', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('User profile not found');
    }
    
    const docRef = doc(db, 'userProfiles', querySnapshot.docs[0].id);
    await updateDoc(docRef, {
      ...updates,
      lastPlayed: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};
