<template>
  <div class="algebra-tiles-container">
    <!-- Toolbar for selecting tiles -->
    <div class="tiles-toolbar">
      <div class="toolbar-section">
        <h6>Positive Tiles</h6>
        <div class="tile-buttons">
          <button 
            class="tile-btn unit-tile positive" 
            :class="{ active: selectedTile === 'unit-positive' }"
            @click="selectTile('unit-positive')"
            title="Unit Tile (+1)"
          >
            <div class="tile-preview unit"></div>
            <span>+1</span>
          </button>
          <button 
            class="tile-btn x-tile positive" 
            :class="{ active: selectedTile === 'x-positive' }"
            @click="selectTile('x-positive')"
            title="X Tile (+x)"
          >
            <div class="tile-preview x"></div>
            <span>+x</span>
          </button>
          <button 
            class="tile-btn x2-tile positive" 
            :class="{ active: selectedTile === 'x2-positive' }"
            @click="selectTile('x2-positive')"
            title="X² Tile (+x²)"
          >
            <div class="tile-preview x2"></div>
            <span>+x²</span>
          </button>
        </div>
      </div>
      
      <div class="toolbar-section">
        <h6>Negative Tiles</h6>
        <div class="tile-buttons">
          <button 
            class="tile-btn unit-tile negative" 
            :class="{ active: selectedTile === 'unit-negative' }"
            @click="selectTile('unit-negative')"
            title="Unit Tile (-1)"
          >
            <div class="tile-preview unit negative"></div>
            <span>-1</span>
          </button>
          <button 
            class="tile-btn x-tile negative" 
            :class="{ active: selectedTile === 'x-negative' }"
            @click="selectTile('x-negative')"
            title="X Tile (-x)"
          >
            <div class="tile-preview x negative"></div>
            <span>-x</span>
          </button>
          <button 
            class="tile-btn x2-tile negative" 
            :class="{ active: selectedTile === 'x2-negative' }"
            @click="selectTile('x2-negative')"
            title="X² Tile (-x²)"
          >
            <div class="tile-preview x2 negative"></div>
            <span>-x²</span>
          </button>
        </div>
      </div>
      
      <div class="toolbar-section">
        <button class="action-btn clear-btn" @click="clearAll" title="Clear All">
          🗑️ Clear All
        </button>
        <button class="action-btn erase-btn" @click="selectTile(null)" :class="{ active: selectedTile === null }" title="Erase">
          🧹 Erase
        </button>
      </div>
    </div>

    <!-- Canvas for algebra tiles -->
    <div class="tiles-canvas-container">
      <div class="canvas-header">
        <h5>Algebra Tiles Workspace</h5>
        <div class="expression-display">
          <span v-if="computedExpression">{{ computedExpression }}</span>
          <span v-else class="placeholder">Place tiles to build expression</span>
        </div>
      </div>
      
      <div 
        ref="canvasRef"
        class="tiles-canvas"
        @click="placeTile"
        @mousemove="handleMouseMove"
        @mouseleave="hoveredCell = null"
      >
        <!-- Grid background -->
        <div class="grid-background">
          <div 
            v-for="row in gridRows" 
            :key="`row-${row}`"
            class="grid-row"
          >
            <div 
              v-for="col in gridCols" 
              :key="`cell-${row}-${col}`"
              class="grid-cell"
              :class="{ 
                hovered: hoveredCell?.row === row && hoveredCell?.col === col,
                occupied: getTileAt(row, col)
              }"
              :data-row="row"
              :data-col="col"
            ></div>
          </div>
        </div>
        
        <!-- Placed tiles -->
        <div 
          v-for="(tile, index) in placedTiles" 
          :key="index"
          class="placed-tile"
          :class="[`tile-${tile.type}`, tile.sign]"
          :style="{
            left: `${(tile.col - 1) * cellSize}px`,
            top: `${(tile.row - 1) * cellSize}px`,
            width: `${getTileWidth(tile.type)}px`,
            height: `${getTileHeight(tile.type)}px`
          }"
          @click.stop="removeTile(index)"
          @mousedown.stop="startDrag(index, $event)"
        >
          <div class="tile-content">
            <span v-if="tile.type === 'unit'">{{ tile.sign === 'positive' ? '1' : '-1' }}</span>
            <span v-else-if="tile.type === 'x'">{{ tile.sign === 'positive' ? 'x' : '-x' }}</span>
            <span v-else-if="tile.type === 'x2'">{{ tile.sign === 'positive' ? 'x²' : '-x²' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Expression evaluation area -->
    <div v-if="showEvaluation" class="evaluation-area">
      <h6>Evaluate Expression</h6>
      <div class="evaluation-input">
        <label>When x = </label>
        <input 
          type="number" 
          v-model.number="xValue" 
          @input="calculateResult"
          class="x-input"
          placeholder="Enter x value"
        />
        <span v-if="result !== null" class="result-display">
          = {{ result }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Tile {
  type: 'unit' | 'x' | 'x2'
  sign: 'positive' | 'negative'
  row: number
  col: number
}

const props = defineProps<{
  modelValue?: string // Expression string representation
  showEvaluation?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const canvasRef = ref<HTMLElement>()
const selectedTile = ref<string | null>(null)
const placedTiles = ref<Tile[]>([])
const hoveredCell = ref<{ row: number; col: number } | null>(null)
const xValue = ref<number | null>(null)
const result = ref<number | null>(null)
const draggingTile = ref<number | null>(null)
const dragOffset = ref<{ x: number; y: number } | null>(null)

const cellSize = 40
const gridRows = 10
const gridCols = 15

const computedExpression = computed(() => {
  if (placedTiles.value.length === 0) return ''
  
  // Group tiles by type and sign
  const groups: Record<string, number> = {}
  
  placedTiles.value.forEach(tile => {
    const key = `${tile.type}-${tile.sign}`
    groups[key] = (groups[key] || 0) + 1
  })
  
  const terms: string[] = []
  
  // Add x² terms
  if (groups['x2-positive']) {
    terms.push(groups['x2-positive'] === 1 ? 'x²' : `${groups['x2-positive']}x²`)
  }
  if (groups['x2-negative']) {
    terms.push(groups['x2-negative'] === 1 ? '-x²' : `-${groups['x2-negative']}x²`)
  }
  
  // Add x terms
  if (groups['x-positive']) {
    terms.push(groups['x-positive'] === 1 ? 'x' : `${groups['x-positive']}x`)
  }
  if (groups['x-negative']) {
    terms.push(groups['x-negative'] === 1 ? '-x' : `-${groups['x-negative']}x`)
  }
  
  // Add unit terms
  if (groups['unit-positive']) {
    terms.push(groups['unit-positive'] === 1 ? '1' : `${groups['unit-positive']}`)
  }
  if (groups['unit-negative']) {
    terms.push(groups['unit-negative'] === 1 ? '-1' : `-${groups['unit-negative']}`)
  }
  
  const expression = terms.join(' + ').replace(/ \+ -/g, ' - ')
  emit('update:modelValue', expression)
  return expression || ''
})

function selectTile(tileType: string | null) {
  selectedTile.value = tileType
}

function getTileWidth(type: 'unit' | 'x' | 'x2'): number {
  switch (type) {
    case 'unit': return cellSize
    case 'x': return cellSize * 2
    case 'x2': return cellSize * 2
    default: return cellSize
  }
}

function getTileHeight(type: 'unit' | 'x' | 'x2'): number {
  switch (type) {
    case 'unit': return cellSize
    case 'x': return cellSize
    case 'x2': return cellSize * 2
    default: return cellSize
  }
}

function getTileAt(row: number, col: number): Tile | undefined {
  return placedTiles.value.find(tile => {
    const tileWidth = Math.ceil(getTileWidth(tile.type) / cellSize)
    const tileHeight = Math.ceil(getTileHeight(tile.type) / cellSize)
    return row >= tile.row && 
           row < tile.row + tileHeight &&
           col >= tile.col && 
           col < tile.col + tileWidth
  })
}

function placeTile(event: MouseEvent) {
  if (!selectedTile.value || !canvasRef.value) return
  
  const rect = canvasRef.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  
  const col = Math.floor(x / cellSize) + 1
  const row = Math.floor(y / cellSize) + 1
  
  if (col < 1 || col > gridCols || row < 1 || row > gridRows) return
  
  // Check if cell is already occupied
  if (getTileAt(row, col)) {
    return
  }
  
  // Parse tile type
  const [type, sign] = selectedTile.value.split('-') as [string, string]
  
  const tile: Tile = {
    type: type.replace('unit', 'unit').replace('x2', 'x2').replace('x', 'x') as 'unit' | 'x' | 'x2',
    sign: sign as 'positive' | 'negative',
    row,
    col
  }
  
  placedTiles.value.push(tile)
}

function removeTile(index: number) {
  placedTiles.value.splice(index, 1)
}

function clearAll() {
  placedTiles.value = []
  result.value = null
}

function handleMouseMove(event: MouseEvent) {
  if (!canvasRef.value) return
  
  const rect = canvasRef.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  
  const col = Math.floor(x / cellSize) + 1
  const row = Math.floor(y / cellSize) + 1
  
  if (col >= 1 && col <= gridCols && row >= 1 && row <= gridRows) {
    hoveredCell.value = { row, col }
  } else {
    hoveredCell.value = null
  }
}

function startDrag(index: number, event: MouseEvent) {
  draggingTile.value = index
  const tile = placedTiles.value[index]
  const rect = canvasRef.value!.getBoundingClientRect()
  dragOffset.value = {
    x: event.clientX - rect.left - (tile.col - 1) * cellSize,
    y: event.clientY - rect.top - (tile.row - 1) * cellSize
  }
}

function calculateResult() {
  if (xValue.value === null || !computedExpression.value) {
    result.value = null
    return
  }
  
  // Parse and evaluate the expression
  const expression = computedExpression.value
  const x = xValue.value
  
  try {
    // Parse the expression terms
    let total = 0
    
    // Match terms like: "x²", "2x²", "-x²", "-2x²", "x", "2x", "-x", "-2x", "1", "2", "-1", "-2"
    const terms = expression.split(/\s*[+\-]\s*/).filter(t => t.trim())
    
    // Handle the first term (might not have a sign)
    const firstTerm = expression.trim().split(/\s*[+\-]\s*/)[0]
    if (firstTerm) {
      total += evaluateTerm(firstTerm, x)
    }
    
    // Handle remaining terms with their signs
    const remainingExpression = expression.replace(/^[^+\-]+/, '')
    const termMatches = remainingExpression.match(/([+\-])\s*([^+\-]+)/g) || []
    
    termMatches.forEach(match => {
      const sign = match.trim().startsWith('-') ? -1 : 1
      const term = match.replace(/^[+\-]\s*/, '').trim()
      total += sign * evaluateTerm(term, x)
    })
    
    result.value = total
  } catch (e) {
    console.error('Error evaluating expression:', e)
    result.value = null
  }
}

function evaluateTerm(term: string, x: number): number {
  term = term.trim()
  
  // Handle x² terms
  if (term.includes('x²')) {
    const coeff = term.replace('x²', '').trim()
    const coefficient = coeff === '' || coeff === '+' ? 1 : coeff === '-' ? -1 : parseFloat(coeff)
    return coefficient * x * x
  }
  
  // Handle x terms
  if (term.includes('x') && !term.includes('x²')) {
    const coeff = term.replace('x', '').trim()
    const coefficient = coeff === '' || coeff === '+' ? 1 : coeff === '-' ? -1 : parseFloat(coeff)
    return coefficient * x
  }
  
  // Handle constant terms
  const constant = parseFloat(term)
  return isNaN(constant) ? 0 : constant
}

onMounted(() => {
  const handleMouseUp = () => {
    draggingTile.value = null
    dragOffset.value = null
  }
  
  const handleMouseMoveDrag = (event: MouseEvent) => {
    if (draggingTile.value === null || !dragOffset.value || !canvasRef.value) return
    
    const rect = canvasRef.value.getBoundingClientRect()
    const x = event.clientX - rect.left - dragOffset.value.x
    const y = event.clientY - rect.top - dragOffset.value.y
    
    const col = Math.max(1, Math.min(gridCols, Math.floor(x / cellSize) + 1))
    const row = Math.max(1, Math.min(gridRows, Math.floor(y / cellSize) + 1))
    
    const tile = placedTiles.value[draggingTile.value]
    tile.col = col
    tile.row = row
  }
  
  document.addEventListener('mouseup', handleMouseUp)
  document.addEventListener('mousemove', handleMouseMoveDrag)
  
  onUnmounted(() => {
    document.removeEventListener('mouseup', handleMouseUp)
    document.removeEventListener('mousemove', handleMouseMoveDrag)
  })
})
</script>

<style scoped>
.algebra-tiles-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.tiles-toolbar {
  display: flex;
  gap: 1.5rem;
  padding: 1rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #dee2e6;
  flex-wrap: wrap;
}

.toolbar-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.toolbar-section h6 {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #495057;
}

.tile-buttons {
  display: flex;
  gap: 0.5rem;
}

.tile-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem;
  border: 2px solid #dee2e6;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 60px;
}

.tile-btn:hover {
  border-color: #007bff;
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0, 123, 255, 0.2);
}

.tile-btn.active {
  border-color: #007bff;
  background: #e7f3ff;
}

.tile-preview {
  width: 30px;
  height: 30px;
  border: 2px solid #333;
  background: #4CAF50;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: bold;
  color: white;
}

.tile-preview.unit {
  width: 30px;
  height: 30px;
}

.tile-preview.x {
  width: 60px;
  height: 30px;
}

.tile-preview.x2 {
  width: 60px;
  height: 60px;
}

.tile-preview.negative {
  background: #f44336;
  border-style: dashed;
}

.tile-btn span {
  font-size: 0.75rem;
  font-weight: 500;
  color: #495057;
}

.action-btn {
  padding: 0.5rem 1rem;
  border: 2px solid #dee2e6;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.action-btn:hover {
  border-color: #dc3545;
  background: #fff5f5;
}

.action-btn.active {
  border-color: #dc3545;
  background: #ffe0e0;
}

.tiles-canvas-container {
  background: white;
  border-radius: 6px;
  border: 1px solid #dee2e6;
  padding: 1rem;
}

.canvas-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.canvas-header h5 {
  margin: 0;
  font-size: 1.1rem;
  color: #2c3e50;
}

.expression-display {
  padding: 0.5rem 1rem;
  background: #e7f3ff;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 1rem;
  font-weight: 500;
  color: #004085;
  min-width: 200px;
  text-align: center;
}

.expression-display .placeholder {
  color: #6c757d;
  font-style: italic;
}

.tiles-canvas {
  position: relative;
  width: 100%;
  height: 400px;
  border: 2px solid #333;
  background: #fff;
  overflow: hidden;
  cursor: crosshair;
}

.grid-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.grid-row {
  display: flex;
}

.grid-cell {
  width: 40px;
  height: 40px;
  border: 1px solid #e0e0e0;
  box-sizing: border-box;
}

.grid-cell.hovered {
  background: rgba(0, 123, 255, 0.1);
  border-color: #007bff;
}

.placed-tile {
  position: absolute;
  border: 2px solid #333;
  cursor: move;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.1s;
  z-index: 10;
}

.placed-tile:hover {
  transform: scale(1.05);
  z-index: 20;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.placed-tile.positive {
  background: #4CAF50;
  color: white;
}

.placed-tile.negative {
  background: #f44336;
  color: white;
  border-style: dashed;
}

.tile-content {
  font-weight: bold;
  font-size: 0.875rem;
  text-align: center;
}

.evaluation-area {
  padding: 1rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #dee2e6;
}

.evaluation-area h6 {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  color: #495057;
}

.evaluation-input {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.evaluation-input label {
  font-weight: 500;
  color: #495057;
}

.x-input {
  padding: 0.5rem;
  border: 2px solid #dee2e6;
  border-radius: 4px;
  width: 100px;
  font-size: 1rem;
}

.x-input:focus {
  outline: none;
  border-color: #007bff;
}

.result-display {
  font-weight: 600;
  color: #28a745;
  font-size: 1.1rem;
}
</style>

