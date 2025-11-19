<template>
  <div class="horizontal-ordering-container">
    <div class="ordering-instructions">
      <p class="instruction-text">
        <span class="instruction-icon">↔️</span>
        Drag the items below to put them in order from 
        <strong>{{ orderDirection === 'ascending' ? 'least to greatest' : 'greatest to least' }}</strong>
      </p>
    </div>
    
    <!-- Drop Zone -->
    <div class="ordering-drop-zone" ref="dropZone">
      <div 
        v-for="(item, index) in orderedItems" 
        :key="`ordered-${index}`"
        class="ordered-item"
        :class="{ 
          'drag-over': dragOverIndex === index,
          'dragging': draggedItem === item && draggedIndex === index
        }"
        draggable="true"
        @dragstart="handleDragStart(item, index, 'ordered')"
        @dragover.prevent="handleDragOver(index)"
        @drop="handleDrop(index)"
        @dragleave="handleDragLeave"
        @dragend="handleDragEnd"
      >
        <div class="item-content" v-html="renderLatexInText(item)"></div>
        <div class="item-number">{{ index + 1 }}</div>
        <div class="drag-handle">⋮⋮</div>
      </div>
      
      <!-- Empty slots for remaining items -->
      <div 
        v-for="n in (props.items.length - orderedItems.length)" 
        :key="`empty-${n}`"
        class="empty-slot"
        :class="{ 'drag-over': dragOverIndex === (orderedItems.length + n - 1) }"
        @dragover.prevent="handleDragOver(orderedItems.length + n - 1)"
        @drop="handleDrop(orderedItems.length + n - 1)"
        @dragleave="handleDragLeave"
      >
        <div class="empty-slot-content">
          <span class="empty-text">Drop item here</span>
          <div class="slot-number">{{ orderedItems.length + n }}</div>
        </div>
      </div>
    </div>
    
    <!-- Available Items -->
    <div class="available-items" v-if="availableItems.length > 0">
      <h4 class="available-title">Available Items:</h4>
      <div class="items-grid">
        <div 
          v-for="(item, index) in availableItems" 
          :key="`available-${index}`"
          class="available-item"
          draggable="true"
          @dragstart="handleDragStart(item, index, 'available')"
          @dragend="handleDragEnd"
        >
          <div class="item-content" v-html="renderLatexInText(item)"></div>
        </div>
      </div>
    </div>
    
    <!-- Reset Button -->
    <div class="ordering-actions">
      <button 
        @click="resetOrdering" 
        class="reset-button"
        :disabled="orderedItems.length === 0"
      >
        🔄 Reset Ordering
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { renderLatexInText } from '@/utils/latexUtils';

interface Props {
  items: string[];
  correctOrder: string[];
  orderDirection?: 'ascending' | 'descending';
  maxItems?: number;
  modelValue?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  orderDirection: 'ascending',
  maxItems: 8,
  modelValue: () => []
});

const emit = defineEmits<{
  'update:modelValue': [value: string[]];
}>();

// State
const orderedItems = ref<string[]>([]);
const availableItems = ref<string[]>([]);
const draggedItem = ref<string | null>(null);
const draggedIndex = ref<number>(-1);
const draggedSource = ref<'ordered' | 'available'>('available');
const dragOverIndex = ref<number>(-1);

// Initialize items
const initializeItems = () => {
  if (props.modelValue && props.modelValue.length > 0) {
    // Restore from model value
    orderedItems.value = [...props.modelValue];
    availableItems.value = props.items.filter(item => !props.modelValue!.includes(item));
  } else {
    // Start with all items available
    orderedItems.value = [];
    availableItems.value = [...props.items];
  }
};

// Computed
const isComplete = computed(() => orderedItems.value.length === props.items.length);

// Methods
const handleDragStart = (item: string, index: number, source: 'ordered' | 'available' = 'available') => {
  draggedItem.value = item;
  draggedIndex.value = index;
  draggedSource.value = source;
  
  // Add visual feedback
  if (source === 'ordered') {
    // Item is being dragged from ordered area
    const event = window.event as DragEvent;
    if (event && event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }
};

const handleDragEnd = () => {
  draggedItem.value = null;
  draggedIndex.value = -1;
  draggedSource.value = 'available';
  dragOverIndex.value = -1;
};

const handleDragOver = (index: number) => {
  dragOverIndex.value = index;
};

const handleDragLeave = () => {
  dragOverIndex.value = -1;
};

const handleDrop = (targetIndex: number) => {
  if (!draggedItem.value) return;
  
  // Don't do anything if dropping on the same position
  if (draggedSource.value === 'ordered' && draggedIndex.value === targetIndex) {
    handleDragEnd();
    return;
  }
  
  // Remove item from current position
  if (draggedSource.value === 'ordered' && draggedIndex.value >= 0 && draggedIndex.value < orderedItems.value.length) {
    // Moving within ordered items - remove from old position first
    orderedItems.value.splice(draggedIndex.value, 1);
    // Adjust target index if moving forward (item was removed before target)
    if (draggedIndex.value < targetIndex) {
      targetIndex--;
    }
  } else if (draggedSource.value === 'available') {
    // Moving from available items
    const availableIndex = availableItems.value.indexOf(draggedItem.value);
    if (availableIndex >= 0) {
      availableItems.value.splice(availableIndex, 1);
    }
  }
  
  // Insert item at new position
  if (targetIndex >= orderedItems.value.length) {
    // Adding to end
    orderedItems.value.push(draggedItem.value);
  } else {
    // Inserting at specific position
    orderedItems.value.splice(targetIndex, 0, draggedItem.value);
  }
  
  // Update available items
  availableItems.value = props.items.filter(item => !orderedItems.value.includes(item));
  
  // Emit update
  emit('update:modelValue', [...orderedItems.value]);
  
  // Reset drag state
  handleDragEnd();
};

const resetOrdering = () => {
  orderedItems.value = [];
  availableItems.value = [...props.items];
  emit('update:modelValue', []);
};

// Watch for prop changes
watch(() => props.items, initializeItems, { immediate: true });
watch(() => props.modelValue, initializeItems);

// Expose methods for parent component
defineExpose({
  resetOrdering,
  isComplete
});
</script>

<style scoped>
.horizontal-ordering-container {
  max-width: 100%;
  margin: 1rem 0;
}

.ordering-instructions {
  background: #f0f4ff;
  border: 2px solid #3b82f6;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  text-align: center;
}

.instruction-text {
  margin: 0;
  font-size: 1.1rem;
  color: #1e40af;
  font-weight: 500;
}

.instruction-icon {
  font-size: 1.2rem;
  margin-right: 0.5rem;
}

.ordering-drop-zone {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  min-height: 80px;
  padding: 1rem;
  background: #f8fafc;
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  transition: all 0.2s ease;
}

.ordering-drop-zone.drag-active {
  border-color: #3b82f6;
  background: #eff6ff;
}

.ordered-item {
  position: relative;
  background: white;
  border: 2px solid #10b981;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  min-width: 120px;
  cursor: move;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.ordered-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.ordered-item.drag-over {
  border-color: #3b82f6;
  background: #eff6ff;
  transform: scale(1.05);
}

.item-content {
  font-size: 1rem;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 0.5rem;
  text-align: center;
}

.item-number {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #10b981;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 2;
}

.drag-handle {
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
  color: #6b7280;
  font-size: 0.75rem;
  cursor: grab;
  user-select: none;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.ordered-item:hover .drag-handle {
  opacity: 1;
}

.ordered-item.dragging {
  opacity: 0.5;
  cursor: grabbing;
}

.ordered-item.dragging .drag-handle {
  opacity: 1;
}

.empty-slot {
  background: #f1f5f9;
  border: 2px dashed #94a3b8;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  min-width: 120px;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.empty-slot.drag-over {
  border-color: #3b82f6;
  background: #eff6ff;
  transform: scale(1.05);
}

.empty-slot-content {
  text-align: center;
  color: #64748b;
}

.empty-text {
  font-size: 0.9rem;
  font-weight: 500;
  display: block;
  margin-bottom: 0.5rem;
}

.slot-number {
  background: #94a3b8;
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: bold;
  margin: 0 auto;
}

.available-items {
  margin-bottom: 1.5rem;
}

.available-title {
  margin: 0 0 1rem 0;
  color: #374151;
  font-size: 1rem;
  font-weight: 600;
}

.items-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.available-item {
  background: #f3f4f6;
  border: 2px solid #d1d5db;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  cursor: grab;
  transition: all 0.2s ease;
  min-width: 100px;
  text-align: center;
}

.available-item:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
  transform: translateY(-1px);
}

.available-item:active {
  cursor: grabbing;
  transform: scale(0.95);
}

.ordering-actions {
  text-align: center;
}

.reset-button {
  background: #ef4444;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.reset-button:hover:not(:disabled) {
  background: #dc2626;
  transform: translateY(-1px);
}

.reset-button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  opacity: 0.6;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .ordering-drop-zone {
    flex-direction: column;
    align-items: center;
  }
  
  .ordered-item, .empty-slot {
    width: 100%;
    max-width: 200px;
  }
  
  .items-grid {
    justify-content: center;
  }
  
  .available-item {
    width: 100%;
    max-width: 150px;
  }
}

/* Drag and drop animations */
@keyframes dragPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.ordered-item.dragging {
  animation: dragPulse 0.5s infinite;
}
</style>

