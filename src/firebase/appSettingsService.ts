// App Settings Service
// Manages system-wide settings stored in Firestore

import { 
  collection, 
  doc, 
  getDoc,
  setDoc,
  getDocs,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './config';
import type { AcademicYear, PeriodType } from '@/types/academicPeriods';

// Collection name for app settings
const SETTINGS_COLLECTION = 'appSettings';

// Setting types
export interface AppSetting {
  id: string;                    // Setting identifier
  type: 'academicPeriods' | 'gradebook' | 'system';
  value: any;                   // Setting value
  createdBy: string;            // User who created setting
  updatedBy: string;            // User who last updated setting
  createdAt: any;               // Creation timestamp
  updatedAt: any;               // Update timestamp
  isActive: boolean;            // Whether setting is active
  description?: string;         // Optional description
}

// Academic Period Setting
export interface AcademicPeriodSetting extends AppSetting {
  type: 'academicPeriods';
  value: {
    academicYear: string;       // e.g., "2024-2025"
    periodType: PeriodType;     // quarters|semesters|trimesters
    periods: {
      id: string;               // e.g., "q1"
      name: string;             // e.g., "Quarter 1"
      shortName: string;        // e.g., "Q1"
      startDate: string;        // ISO date string
      endDate: string;          // ISO date string
    }[];
  };
}

// ==================== ACADEMIC PERIOD SETTINGS ====================

/**
 * Save academic period configuration
 */
export async function saveAcademicPeriodSettings(
  academicYear: AcademicYear,
  updatedBy: string
): Promise<void> {
  try {
    console.log('💾 Saving academic period settings to Firestore...');
    
    const settingData: AcademicPeriodSetting = {
      id: 'academicPeriods',
      type: 'academicPeriods',
      value: {
        academicYear: academicYear.year,
        periodType: academicYear.periodType,
        periods: academicYear.periods.map(period => ({
          id: period.id,
          name: period.name,
          shortName: period.shortName,
          startDate: period.startDate.toISOString(),
          endDate: period.endDate.toISOString()
        }))
      },
      createdBy: updatedBy,
      updatedBy: updatedBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: true,
      description: `Academic period configuration for ${academicYear.year} using ${academicYear.periodType}`
    };
    
    // Use document ID 'academicPeriods' for easy retrieval
    await setDoc(doc(db, SETTINGS_COLLECTION, 'academicPeriods'), settingData);
    
    console.log('✅ Academic period settings saved successfully');
    
  } catch (error) {
    console.error('❌ Error saving academic period settings:', error);
    throw error;
  }
}

/**
 * Load academic period configuration
 */
export async function loadAcademicPeriodSettings(): Promise<AcademicYear | null> {
  try {
    console.log('📖 Loading academic period settings from Firestore...');
    
    const settingDoc = await getDoc(doc(db, SETTINGS_COLLECTION, 'academicPeriods'));
    
    if (!settingDoc.exists()) {
      console.log('📝 No academic period settings found in Firestore');
      return null;
    }
    
    const settingData = settingDoc.data() as AcademicPeriodSetting;
    
    if (!settingData.isActive) {
      console.log('⚠️ Academic period settings exist but are inactive');
      return null;
    }
    
    // Convert back to AcademicYear format
    const academicYear: AcademicYear = {
      year: settingData.value.academicYear,
      startDate: new Date(settingData.value.periods[0].startDate),
      endDate: new Date(settingData.value.periods[settingData.value.periods.length - 1].endDate),
      periodType: settingData.value.periodType,
      periods: settingData.value.periods.map(period => {
        const startDate = new Date(period.startDate);
        const endDate = new Date(period.endDate);
        const now = new Date();
        
        return {
          id: period.id,
          name: period.name,
          shortName: period.shortName,
          startDate,
          endDate,
          isActive: now >= startDate && now <= endDate,
          isFuture: now < startDate,
          isPast: now > endDate
        };
      })
    };
    
    console.log(`✅ Loaded academic period settings: ${academicYear.periodType} for ${academicYear.year}`);
    console.log('📅 Periods:', academicYear.periods.map(p => `${p.name}: ${p.startDate.toLocaleDateString()} - ${p.endDate.toLocaleDateString()}`));
    
    return academicYear;
    
  } catch (error) {
    console.error('❌ Error loading academic period settings:', error);
    throw error;
  }
}

// ==================== GENERAL SETTINGS ====================

/**
 * Save any app setting
 */
export async function saveSetting(setting: AppSetting): Promise<void> {
  try {
    await setDoc(doc(db, SETTINGS_COLLECTION, setting.id), {
      ...setting,
      updatedAt: serverTimestamp()
    });
    
    console.log(`✅ Setting '${setting.id}' saved successfully`);
    
  } catch (error) {
    console.error(`❌ Error saving setting '${setting.id}':`, error);
    throw error;
  }
}

/**
 * Load a specific setting
 */
export async function loadSetting(settingId: string): Promise<AppSetting | null> {
  try {
    const settingDoc = await getDoc(doc(db, SETTINGS_COLLECTION, settingId));
    
    if (!settingDoc.exists()) {
      return null;
    }
    
    return settingDoc.data() as AppSetting;
    
  } catch (error) {
    console.error(`❌ Error loading setting '${settingId}':`, error);
    throw error;
  }
}

/**
 * Get all settings of a specific type
 */
export async function getSettingsByType(type: AppSetting['type']): Promise<AppSetting[]> {
  try {
    const q = query(
      collection(db, SETTINGS_COLLECTION),
      where('type', '==', type),
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as AppSetting);
    
  } catch (error) {
    console.error(`❌ Error getting settings by type '${type}':`, error);
    throw error;
  }
}
