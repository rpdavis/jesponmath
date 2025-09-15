<template>
  <span ref="mathElement" class="latex-math"></span>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import katex from 'katex'
import 'katex/dist/katex.min.css'

interface Props {
  expression: string
  displayMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  displayMode: false
})

const mathElement = ref<HTMLElement>()

const renderMath = () => {
  if (mathElement.value && props.expression) {
    try {
      katex.render(props.expression, mathElement.value, {
        displayMode: props.displayMode,
        throwOnError: false,
        strict: false
      })
    } catch (error) {
      console.warn('KaTeX render error:', error)
      mathElement.value.textContent = props.expression
    }
  }
}

onMounted(renderMath)
watch(() => props.expression, renderMath)
watch(() => props.displayMode, renderMath)
</script>

<style scoped>
.latex-math {
  display: inline-block;
}
</style>







