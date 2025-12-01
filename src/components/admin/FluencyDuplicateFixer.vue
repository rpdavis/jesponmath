<template>
  <div class="duplicate-fixer">
    <div class="header">
      <h1>🔧 Fix Duplicate Fluency Problems</h1>
      <p>Remove duplicate problems from student practice banks</p>
    </div>

    <div class="info-card">
      <h3>⚠️ What This Fixes</h3>
      <p>
        Students who started fluency practice before the deduplication update may have 
        duplicate problems in their banks, causing the same problems to appear repeatedly.
      </p>
      <p>
        This tool scans all student progress and removes duplicates.
      </p>
    </div>

    <!-- Status Display -->
    <div v-if="scanning" class="scanning">
      <div class="spinner"></div>
      <p>Scanning fluency progress documents...</p>
      <p class="count">Checked: {{ studentsChecked }} / {{ totalStudents }}</p>
    </div>

    <div v-if="fixing" class="fixing">
      <div class="spinner"></div>
      <p>Fixing duplicate problems...</p>
      <p class="count">Fixed: {{ studentsFixed }} documents</p>
    </div>

    <!-- Results -->
    <div v-if="results.length > 0 && !scanning && !fixing" class="results">
      <h3>🔍 Scan Results</h3>
      <p class="summary">
        Found {{ studentsWithDuplicates }} students with duplicate problems
        ({{ totalDuplicatesFound }} duplicates total)
      </p>

      <div class="results-list">
        <div v-for="result in results" :key="result.docId" class="result-item">
          <div class="result-header">
            <strong>{{ result.studentName || result.studentUid }}</strong>
            <span class="operation-badge">{{ result.operation }}</span>
          </div>
          <div class="duplicates-info">
            <div v-for="(count, bank) in result.duplicates" :key="bank" class="bank-info">
              <span class="bank-name">{{ bank }}:</span>
              <span class="duplicate-count">{{ count }} duplicates</span>
            </div>
          </div>
        </div>
      </div>

      <div class="actions">
        <button @click="fixAllDuplicates" class="fix-btn" :disabled="fixing">
          🔧 Fix All Duplicates ({{ totalDuplicatesFound }} total)
        </button>
      </div>
    </div>

    <!-- Success Message -->
    <div v-if="fixed && !fixing" class="success">
      <h2>✅ Cleanup Complete!</h2>
      <div class="success-stats">
        <div class="stat">
          <span class="stat-number">{{ studentsFixed }}</span>
          <span class="stat-label">Students Fixed</span>
        </div>
        <div class="stat">
          <span class="stat-number">{{ totalDuplicatesRemoved }}</span>
          <span class="stat-label">Duplicates Removed</span>
        </div>
      </div>
      <p class="success-message">
        Students should now see unique problems in their practice sessions!
      </p>
      <button @click="reset" class="reset-btn">Scan Again</button>
    </div>

    <!-- Error Display -->
    <div v-if="error" class="error">
      <h3>❌ Error</h3>
      <p>{{ error }}</p>
      <button @click="reset">Try Again</button>
    </div>

    <!-- Action Buttons -->
    <div v-if="!scanning && !fixing && !fixed && results.length === 0" class="start-actions">
      <button @click="scanForDuplicates" class="scan-btn">
        🔍 Scan for Duplicate Problems
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { ProblemProgress } from '@/types/mathFluency';

// State
const scanning = ref(false);
const fixing = ref(false);
const fixed = ref(false);
const error = ref('');
const studentsChecked = ref(0);
const totalStudents = ref(0);
const studentsFixed = ref(0);
const totalDuplicatesFound = ref(0);
const totalDuplicatesRemoved = ref(0);

interface ScanResult {
  docId: string;
  studentUid: string;
  studentName?: string;
  operation: string;
  duplicates: { [bank: string]: number };
  totalDuplicates: number;
}

const results = ref<ScanResult[]>([]);

const studentsWithDuplicates = computed(() => results.value.length);

// Functions
async function scanForDuplicates() {
  try {
    scanning.value = true;
    error.value = '';
    results.value = [];
    studentsChecked.value = 0;
    totalDuplicatesFound.value = 0;

    // Get all fluency progress documents
    const progressSnapshot = await getDocs(collection(db, 'mathFluencyProgress'));
    totalStudents.value = progressSnapshot.size;

    console.log(`🔍 Scanning ${progressSnapshot.size} progress documents...`);

    for (const progressDoc of progressSnapshot.docs) {
      const data = progressDoc.data();
      studentsChecked.value++;

      const duplicateInfo: { [bank: string]: number } = {};
      let totalDupsInDoc = 0;

      // Check each problem bank
      const banks = ['doesNotKnow', 'emerging', 'approaching', 'proficient', 'mastered'];

      for (const bank of banks) {
        if (!data.problemBanks?.[bank]) continue;

        const problems = data.problemBanks[bank];
        const problemIds = problems.map((p: any) => p.problemId);
        const uniqueIds = new Set(problemIds);
        const duplicates = problemIds.length - uniqueIds.size;

        if (duplicates > 0) {
          duplicateInfo[bank] = duplicates;
          totalDupsInDoc += duplicates;
        }
      }

      if (totalDupsInDoc > 0) {
        results.value.push({
          docId: progressDoc.id,
          studentUid: data.studentUid,
          studentName: data.studentName,
          operation: data.operation,
          duplicates: duplicateInfo,
          totalDuplicates: totalDupsInDoc
        });

        totalDuplicatesFound.value += totalDupsInDoc;
      }
    }

    console.log(`✅ Scan complete: Found ${results.value.length} students with duplicates`);
  } catch (err: any) {
    console.error('❌ Error scanning:', err);
    error.value = err.message || 'Failed to scan for duplicates';
  } finally {
    scanning.value = false;
  }
}

async function fixAllDuplicates() {
  try {
    fixing.value = true;
    error.value = '';
    studentsFixed.value = 0;
    totalDuplicatesRemoved.value = 0;

    console.log(`🔧 Fixing duplicates in ${results.value.length} documents...`);

    for (const result of results.value) {
      // Get the document
      const progressDoc = await getDocs(
        collection(db, 'mathFluencyProgress')
      ).then(snapshot => snapshot.docs.find(d => d.id === result.docId));

      if (!progressDoc) {
        console.warn(`Document not found: ${result.docId}`);
        continue;
      }

      const data = progressDoc.data();
      const updates: any = {};
      let hasUpdates = false;

      // Deduplicate each bank
      const banks = ['doesNotKnow', 'emerging', 'approaching', 'proficient', 'mastered'];

      for (const bank of banks) {
        if (!data.problemBanks?.[bank]) continue;

        const problems = data.problemBanks[bank];
        const originalCount = problems.length;

        // Deduplicate by problemId
        const seen = new Set<string>();
        const unique: ProblemProgress[] = [];

        for (const problem of problems) {
          if (!seen.has(problem.problemId)) {
            seen.add(problem.problemId);
            unique.push(problem);
          }
        }

        const duplicatesRemoved = originalCount - unique.length;

        if (duplicatesRemoved > 0) {
          updates[`problemBanks.${bank}`] = unique;
          hasUpdates = true;
          totalDuplicatesRemoved.value += duplicatesRemoved;
          
          console.log(`  ${bank}: ${originalCount} → ${unique.length} (removed ${duplicatesRemoved})`);
        }
      }

      // Update Firestore
      if (hasUpdates) {
        const docRef = doc(db, 'mathFluencyProgress', progressDoc.id);
        await updateDoc(docRef, updates);
        studentsFixed.value++;
        console.log(`✅ Fixed ${result.studentUid} - ${result.operation}`);
      }
    }

    console.log(`🎉 Fixed ${studentsFixed.value} students, removed ${totalDuplicatesRemoved.value} duplicates`);
    fixed.value = true;
  } catch (err: any) {
    console.error('❌ Error fixing duplicates:', err);
    error.value = err.message || 'Failed to fix duplicates';
  } finally {
    fixing.value = false;
  }
}

function reset() {
  scanning.value = false;
  fixing.value = false;
  fixed.value = false;
  error.value = '';
  results.value = [];
  studentsChecked.value = 0;
  totalStudents.value = 0;
  studentsFixed.value = 0;
  totalDuplicatesFound.value = 0;
  totalDuplicatesRemoved.value = 0;
}
</script>

<style scoped>
.duplicate-fixer {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.header h1 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.header p {
  color: #7f8c8d;
  font-size: 1.1rem;
}

.info-card {
  background: #fff3cd;
  border: 2px solid #ffc107;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.info-card h3 {
  color: #f57c00;
  margin: 0 0 1rem 0;
}

.info-card p {
  color: #666;
  margin: 0.5rem 0;
  line-height: 1.6;
}

.scanning,
.fixing {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.count {
  font-size: 1.1rem;
  color: #666;
  font-weight: 600;
}

.results {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.results h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.summary {
  background: #e3f2fd;
  padding: 1rem;
  border-radius: 8px;
  color: #1565c0;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

.results-list {
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 1.5rem;
}

.result-item {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  border-left: 4px solid #ff9800;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.result-header strong {
  color: #2c3e50;
  font-size: 1.05rem;
}

.operation-badge {
  background: #2196f3;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.duplicates-info {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.bank-info {
  font-size: 0.9rem;
  color: #666;
}

.bank-name {
  font-weight: 600;
  color: #555;
}

.duplicate-count {
  color: #d32f2f;
  font-weight: 700;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.fix-btn {
  background: linear-gradient(135deg, #ff9800, #f57c00);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.fix-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 152, 0, 0.3);
}

.fix-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.success {
  background: white;
  border-radius: 12px;
  padding: 3rem;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.success h2 {
  color: #4caf50;
  margin-bottom: 2rem;
}

.success-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin: 2rem 0;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.stat {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.stat-number {
  font-size: 3rem;
  font-weight: bold;
  color: #4caf50;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.success-message {
  font-size: 1.1rem;
  color: #666;
  margin: 1.5rem 0;
}

.error {
  background: #ffebee;
  border: 2px solid #f44336;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
}

.error h3 {
  color: #d32f2f;
  margin-bottom: 1rem;
}

.error p {
  color: #666;
  margin-bottom: 1.5rem;
}

.start-actions {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}

.scan-btn {
  background: linear-gradient(135deg, #2196f3, #1976d2);
  color: white;
  border: none;
  padding: 1.25rem 2.5rem;
  border-radius: 8px;
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.scan-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(33, 150, 243, 0.3);
}

.reset-btn {
  background: #6c757d;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.reset-btn:hover {
  background: #5a6268;
}
</style>

