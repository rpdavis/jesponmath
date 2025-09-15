#!/usr/bin/env node

/**
 * Firestore Backup Script
 * Creates a JSON backup of all Firestore collections
 * Usage: node scripts/backup-firestore.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Firebase config - using the same config as your app
const firebaseConfig = {
  apiKey: "AIzaSyBaXtdJaLGT4VVQNL7J6Ek6kqhcEhJcXXX", // Replace with your actual config
  authDomain: "jepsonmath.firebaseapp.com",
  projectId: "jepsonmath",
  storageBucket: "jepsonmath.firebasestorage.app",
  messagingSenderId: "277621705197",
  appId: "your-app-id" // Replace with your actual app ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Collections to backup
const COLLECTIONS = [
  'users',
  'teachers', 
  'students',
  'assessments',
  'assessmentResults',
  'iepGoals',
  'classrooms'
];

async function backupCollection(collectionName) {
  console.log(`📦 Backing up collection: ${collectionName}`);
  
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    const documents = [];
    
    querySnapshot.forEach((doc) => {
      documents.push({
        id: doc.id,
        data: doc.data()
      });
    });
    
    console.log(`✅ Found ${documents.length} documents in ${collectionName}`);
    return documents;
  } catch (error) {
    console.error(`❌ Error backing up ${collectionName}:`, error);
    return [];
  }
}

async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = `backups/json-backup-${timestamp}`;
  
  // Create backup directory
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  console.log(`🚀 Starting Firestore backup to ${backupDir}`);
  
  const backupData = {
    timestamp: new Date().toISOString(),
    collections: {}
  };
  
  // Backup each collection
  for (const collectionName of COLLECTIONS) {
    const documents = await backupCollection(collectionName);
    backupData.collections[collectionName] = documents;
    
    // Save individual collection file
    const collectionFile = path.join(backupDir, `${collectionName}.json`);
    fs.writeFileSync(collectionFile, JSON.stringify(documents, null, 2));
  }
  
  // Save complete backup file
  const completeBackupFile = path.join(backupDir, 'complete-backup.json');
  fs.writeFileSync(completeBackupFile, JSON.stringify(backupData, null, 2));
  
  // Create backup summary
  const summary = {
    timestamp: backupData.timestamp,
    totalCollections: COLLECTIONS.length,
    collections: Object.keys(backupData.collections).map(name => ({
      name,
      documentCount: backupData.collections[name].length
    })),
    backupLocation: backupDir
  };
  
  const summaryFile = path.join(backupDir, 'backup-summary.json');
  fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
  
  console.log(`\n✅ Backup completed successfully!`);
  console.log(`📁 Location: ${backupDir}`);
  console.log(`📊 Summary:`, summary);
  
  return summary;
}

// Run the backup
createBackup().catch(console.error);
