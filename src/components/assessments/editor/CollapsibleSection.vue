<template>
  <div class="collapsible-section" :class="{ expanded: isExpanded }">
    <div class="section-header" @click="toggleExpanded">
      <div class="section-title">
        <span class="section-icon">{{ icon }}</span>
        <h3>{{ title }}</h3>
        <span v-if="badge" class="section-badge">{{ badge }}</span>
      </div>
      <div class="section-controls">
        <span v-if="subtitle && !isExpanded" class="section-subtitle">{{ subtitle }}</span>
        <button type="button" class="toggle-button">
          {{ isExpanded ? '▼' : '▶' }}
        </button>
      </div>
    </div>

    <Transition name="slide-down">
      <div v-if="isExpanded" class="section-content">
        <slot></slot>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  title: string
  icon?: string
  badge?: string
  subtitle?: string
  defaultExpanded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  icon: '📋',
  defaultExpanded: false
})

const isExpanded = ref(props.defaultExpanded)

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}
</script>

<style scoped>
.collapsible-section {
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  transition: all 0.2s;
}

.collapsible-section.expanded {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background: #f9fafb;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid #e5e7eb;
}

.section-header:hover {
  background: #f3f4f6;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.section-icon {
  font-size: 1.25rem;
}

.section-title h3 {
  margin: 0;
  font-size: 1.125rem;
  color: #1f2937;
  font-weight: 600;
}

.section-badge {
  padding: 0.25rem 0.625rem;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.section-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.section-subtitle {
  color: #6b7280;
  font-size: 0.875rem;
  font-style: italic;
}

.toggle-button {
  background: none;
  border: none;
  color: #6b7280;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.25rem;
  transition: color 0.2s;
}

.toggle-button:hover {
  color: #374151;
}

.section-content {
  padding: 1.5rem 1.25rem;
}

/* Slide down animation */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.slide-down-enter-from,
.slide-down-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.slide-down-enter-to,
.slide-down-leave-from {
  max-height: 2000px;
  opacity: 1;
}
</style>
