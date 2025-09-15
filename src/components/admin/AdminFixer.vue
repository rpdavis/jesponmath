<template>
  <div class="admin-fixer">
    <div class="header">
      <h1>🔧 Admin Utilities</h1>
      <p>Manual fixes for system issues</p>
    </div>

    <div class="fix-section">
      <h2>Fix Admin Role Conflict</h2>
      <p>Fixes the issue where admin user gets created as student during sign-in</p>
      
      <div class="user-input">
        <label for="userUid">User UID:</label>
        <input 
          id="userUid"
          v-model="userUid" 
          type="text" 
          placeholder="Enter user UID (default: OQXA6hoMeLXGvQmvTff7H1zbieh2)"
          class="uid-input"
        >
      </div>
      
      <button 
        @click="fixAdminRole" 
        :disabled="isFixing"
        class="fix-button"
      >
        <span v-if="isFixing">🔄 Fixing...</span>
        <span v-else>🔧 Fix Admin Role</span>
      </button>
    </div>

    <!-- Results Display -->
    <div v-if="result" class="result" :class="result.type">
      <h3>{{ result.type === 'success' ? '✅ Success' : '❌ Error' }}</h3>
      <p>{{ result.message }}</p>
      <pre v-if="result.details">{{ result.details }}</pre>
    </div>

    <!-- Console Output -->
    <div v-if="consoleOutput.length > 0" class="console-output">
      <h3>📋 Console Output:</h3>
      <div class="console-lines">
        <div v-for="(line, index) in consoleOutput" :key="index" class="console-line">
          {{ line }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { fixAdminUserRoleConflict } from '@/firebase/manualFixes';

const userUid = ref('OQXA6hoMeLXGvQmvTff7H1zbieh2');
const isFixing = ref(false);
const result = ref<{type: 'success' | 'error', message: string, details?: string} | null>(null);
const consoleOutput = ref<string[]>([]);

// Override console.log to capture output
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

const captureConsoleOutput = (enable: boolean) => {
  if (enable) {
    console.log = (...args) => {
      consoleOutput.value.push(args.join(' '));
      originalConsoleLog(...args);
    };
    console.error = (...args) => {
      consoleOutput.value.push('ERROR: ' + args.join(' '));
      originalConsoleError(...args);
    };
  } else {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  }
};

const fixAdminRole = async () => {
  if (!userUid.value.trim()) {
    result.value = {
      type: 'error',
      message: 'Please enter a user UID'
    };
    return;
  }

  isFixing.value = true;
  result.value = null;
  consoleOutput.value = [];
  
  // Capture console output
  captureConsoleOutput(true);
  
  try {
    console.log('🚀 Starting admin role fix for:', userUid.value);
    
    await fixAdminUserRoleConflict(userUid.value);
    
    result.value = {
      type: 'success',
      message: `Admin role conflict fixed successfully for user ${userUid.value}. You can now sign in with the correct admin permissions.`
    };
  } catch (error: any) {
    result.value = {
      type: 'error',
      message: 'Failed to fix admin role conflict',
      details: error.message || String(error)
    };
  } finally {
    isFixing.value = false;
    captureConsoleOutput(false);
  }
};
</script>

<style scoped>
.admin-fixer {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h1 {
  color: #1f2937;
  font-size: 2rem;
  margin-bottom: 10px;
}

.header p {
  color: #6b7280;
  font-size: 1.1rem;
}

.fix-section {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.fix-section h2 {
  color: #1f2937;
  font-size: 1.3rem;
  margin-bottom: 10px;
}

.fix-section p {
  color: #6b7280;
  margin-bottom: 20px;
  line-height: 1.5;
}

.user-input {
  margin-bottom: 20px;
}

.user-input label {
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.uid-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  transition: border-color 0.2s ease;
}

.uid-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.fix-button {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.fix-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
}

.fix-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.result {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.result.success {
  border-left: 4px solid #10b981;
}

.result.error {
  border-left: 4px solid #ef4444;
}

.result h3 {
  margin: 0 0 10px 0;
  font-size: 1.1rem;
}

.result.success h3 {
  color: #059669;
}

.result.error h3 {
  color: #dc2626;
}

.result p {
  margin: 0 0 10px 0;
  color: #374151;
  line-height: 1.5;
}

.result pre {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px;
  font-size: 0.85rem;
  color: #dc2626;
  white-space: pre-wrap;
  margin: 0;
}

.console-output {
  background: #1f2937;
  border-radius: 12px;
  padding: 20px;
  color: #f9fafb;
}

.console-output h3 {
  color: #f9fafb;
  margin: 0 0 15px 0;
  font-size: 1.1rem;
}

.console-lines {
  max-height: 300px;
  overflow-y: auto;
}

.console-line {
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  line-height: 1.4;
  padding: 2px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.console-line:last-child {
  border-bottom: none;
}
</style>
