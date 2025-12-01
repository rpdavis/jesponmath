// Strategy Lesson Service
// Tracks lesson completion and determines when to show lessons

import { 
  collection, 
  doc, 
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { LessonProgress, LessonId } from '@/types/strategyLessons';
import { getNextRequiredLesson } from '@/config/strategyLessons';

const COLLECTION = 'strategyLessonProgress';

/**
 * Check if student has completed a specific lesson
 */
export async function hasCompletedLesson(
  studentUid: string,
  lessonId: LessonId
): Promise<boolean> {
  try {
    const docRef = doc(db, COLLECTION, `${studentUid}_${lessonId}`);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return false;
    
    const data = docSnap.data() as LessonProgress;
    return data.completedAt !== undefined && data.completedAt !== null;
  } catch (error) {
    console.error('Error checking lesson completion:', error);
    return false;
  }
}

/**
 * Get all completed lesson IDs for a student
 */
export async function getCompletedLessonIds(studentUid: string): Promise<LessonId[]> {
  try {
    // Get all lesson progress for this student
    const q = query(
      collection(db, COLLECTION),
      where('studentUid', '==', studentUid)
    );
    
    const snapshot = await getDocs(q);
    
    // Filter to only completed lessons (filter in JavaScript to avoid index requirement)
    const completed = snapshot.docs
      .map(doc => doc.data() as LessonProgress)
      .filter(lesson => lesson.completedAt !== undefined && lesson.completedAt !== null)
      .map(lesson => lesson.lessonId);
    
    console.log(`📚 Student completed lessons:`, completed);
    
    return completed;
  } catch (error) {
    console.error('Error getting completed lessons:', error);
    return [];
  }
}

/**
 * Check if a lesson should be shown before the next practice session
 * Returns lessonId if a lesson should be shown, null otherwise
 */
export async function checkForRequiredLesson(
  studentUid: string,
  sessionNumber: number
): Promise<LessonId | null> {
  try {
    const completedLessonIds = await getCompletedLessonIds(studentUid);
    const nextLesson = getNextRequiredLesson(sessionNumber, completedLessonIds as string[]);
    
    if (nextLesson) {
      console.log(`📚 Lesson required before session ${sessionNumber}: ${nextLesson.title}`);
      return nextLesson.id;
    }
    
    return null;
  } catch (error) {
    console.error('Error checking for required lesson:', error);
    return null;
  }
}

/**
 * Start a lesson (track progress)
 */
export async function startLesson(
  studentUid: string,
  lessonId: LessonId
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION, `${studentUid}_${lessonId}`);
    
    const progress: Partial<LessonProgress> = {
      lessonId,
      studentUid,
      startedAt: serverTimestamp(),
      overviewViewed: true,
      videoWatched: false,
      practiceStarted: false,
      practiceCompleted: false,
      problemsAttempted: 0,
      problemsCorrect: 0,
      accuracy: 0,
      passedCriteria: false,
      attempts: 1
    };
    
    await setDoc(docRef, progress, { merge: true });
    console.log('📚 Started lesson:', lessonId);
  } catch (error) {
    console.error('Error starting lesson:', error);
    throw error;
  }
}

/**
 * Mark video as watched
 */
export async function markVideoWatched(
  studentUid: string,
  lessonId: LessonId
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION, `${studentUid}_${lessonId}`);
    await setDoc(docRef, {
      videoWatched: true
    }, { merge: true });
  } catch (error) {
    console.error('Error marking video watched:', error);
  }
}

/**
 * Complete lesson with practice results
 */
export async function completeLesson(
  studentUid: string,
  lessonId: LessonId,
  practiceResults: {
    attempted: number;
    correct: number;
    passed: boolean;
  }
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION, `${studentUid}_${lessonId}`);
    
    const accuracy = practiceResults.attempted > 0 
      ? (practiceResults.correct / practiceResults.attempted) * 100 
      : 0;
    
    await setDoc(docRef, {
      practiceStarted: true,
      practiceCompleted: true,
      problemsAttempted: practiceResults.attempted,
      problemsCorrect: practiceResults.correct,
      accuracy,
      passedCriteria: practiceResults.passed,
      completedAt: serverTimestamp(),
      lastAttemptAt: serverTimestamp()
    }, { merge: true });
    
    console.log(`✅ Lesson completed: ${lessonId} (${Math.round(accuracy)}% accuracy)`);
  } catch (error) {
    console.error('Error completing lesson:', error);
    throw error;
  }
}

/**
 * Get lesson progress for a student
 */
export async function getLessonProgress(
  studentUid: string,
  lessonId: LessonId
): Promise<LessonProgress | null> {
  try {
    const docRef = doc(db, COLLECTION, `${studentUid}_${lessonId}`);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    return docSnap.data() as LessonProgress;
  } catch (error) {
    console.error('Error getting lesson progress:', error);
    return null;
  }
}

