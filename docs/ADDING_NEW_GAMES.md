# Adding New Games to Math Games MRD

This guide explains how to add new games to the Math Games MRD application.

## Overview

The application is structured to easily accommodate new games. Each game follows a consistent pattern and integrates with the existing infrastructure.

## Game Structure

### 1. Game Configuration

Add your game to `src/config/games.ts`:

```typescript
{
  id: 'your-game-id',
  title: 'Your Game Title',
  description: 'Description of what the game teaches and how it works.',
  icon: '🎮', // Choose an appropriate emoji
  difficulty: 2, // 1-5 scale
  features: ['Feature 1', 'Feature 2', 'Feature 3'],
  route: '/your-game-route',
  category: 'arithmetic', // Choose from: arithmetic, geometry, algebra, number-sense, problem-solving
  minAge: 8,
  maxAge: 15,
  estimatedTime: 10, // in minutes
  tags: ['tag1', 'tag2', 'tag3']
}
```

### 2. Game Component

Create your game component in `src/components/games/YourGame.vue`:

```vue
<template>
  <div class="your-game">
    <!-- Your game UI here -->
  </div>
</template>

<script setup lang="ts">
// Your game logic here
</script>

<style scoped>
/* Your game styles here */
</style>
```

### 3. Router Configuration

Add the route in `src/router/index.ts`:

```typescript
{
  path: '/your-game-route',
  name: 'your-game',
  component: () => import('@/components/games/YourGame.vue')
}
```

## Game Integration Points

### Firebase Integration

If your game needs to save scores or user progress:

1. **Update Firestore Rules**: Ensure your game's data collections are properly secured
2. **Use Existing Services**: Leverage the existing Firebase services in `src/firebase/services.ts`
3. **Score Format**: Follow the `GameScore` interface structure

### Authentication

Games can access user authentication state through the `useAuth` composable:

```typescript
import { useAuth } from '@/composables/useAuth';

const { user, userProfile } = useAuth();
```

### State Management

For complex game state, consider creating a dedicated composable:

```typescript
// src/composables/useYourGame.ts
export function useYourGame() {
  // Game state and logic
  return {
    // Expose game functions and state
  };
}
```

## Best Practices

### 1. Responsive Design
- Ensure your game works on both desktop and mobile devices
- Use CSS Grid/Flexbox for layouts
- Test on various screen sizes

### 2. Accessibility
- Include proper ARIA labels
- Support keyboard navigation
- Provide clear visual feedback
- Use semantic HTML elements

### 3. Performance
- Optimize rendering for smooth gameplay
- Use Vue's reactivity efficiently
- Implement proper cleanup in `onUnmounted`

### 4. Error Handling
- Handle edge cases gracefully
- Provide user-friendly error messages
- Log errors for debugging

## Example: Simple Quiz Game

Here's a complete example of a simple quiz game:

### 1. Game Configuration (`src/config/games.ts`)

```typescript
{
  id: 'math-quiz',
  title: 'Math Quiz',
  description: 'Test your math knowledge with timed quizzes.',
  icon: '🧠',
  difficulty: 2,
  features: ['Timed Quizzes', 'Multiple Choice', 'Score Tracking'],
  route: '/math-quiz',
  category: 'arithmetic',
  minAge: 7,
  maxAge: 12,
  estimatedTime: 5,
  tags: ['quiz', 'timed', 'multiple-choice']
}
```

### 2. Game Component (`src/components/games/MathQuiz.vue`)

```vue
<template>
  <div class="math-quiz">
    <div class="quiz-header">
      <h2>Math Quiz</h2>
      <div class="timer">Time: {{ timeLeft }}s</div>
      <div class="score">Score: {{ score }}</div>
    </div>
    
    <div v-if="currentQuestion" class="question-container">
      <h3>{{ currentQuestion.question }}</h3>
      <div class="options">
        <button
          v-for="option in currentQuestion.options"
          :key="option"
          @click="selectAnswer(option)"
          class="option-button"
        >
          {{ option }}
        </button>
      </div>
    </div>
    
    <div v-else class="quiz-complete">
      <h3>Quiz Complete!</h3>
      <p>Final Score: {{ score }}</p>
      <button @click="restartQuiz">Play Again</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const questions = ref([
  { question: 'What is 5 + 3?', answer: 8, options: [6, 7, 8, 9] },
  { question: 'What is 10 - 4?', answer: 6, options: [4, 5, 6, 7] },
  // Add more questions...
]);

const currentQuestionIndex = ref(0);
const score = ref(0);
const timeLeft = ref(30);
const currentQuestion = ref(questions.value[0]);

let timer: number;

const selectAnswer = (selectedAnswer: number) => {
  if (selectedAnswer === currentQuestion.value.answer) {
    score.value += 10;
  }
  
  currentQuestionIndex.value++;
  if (currentQuestionIndex.value < questions.value.length) {
    currentQuestion.value = questions.value[currentQuestionIndex.value];
  } else {
    currentQuestion.value = null;
  }
};

const restartQuiz = () => {
  currentQuestionIndex.value = 0;
  score.value = 0;
  timeLeft.value = 30;
  currentQuestion.value = questions.value[0];
};

onMounted(() => {
  timer = setInterval(() => {
    timeLeft.value--;
    if (timeLeft.value <= 0) {
      currentQuestion.value = null;
      clearInterval(timer);
    }
  }, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
.math-quiz {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.quiz-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 15px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
}

.question-container {
  background: white;
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-top: 20px;
}

.option-button {
  padding: 15px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.option-button:hover {
  border-color: #667eea;
  transform: translateY(-2px);
}

.quiz-complete {
  background: white;
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
}
</style>
```

### 3. Router Update (`src/router/index.ts`)

```typescript
{
  path: '/math-quiz',
  name: 'math-quiz',
  component: () => import('@/components/games/MathQuiz.vue')
}
```

## Testing Your Game

1. **Development Testing**: Use `npm run build` and `npm run preview` to test
2. **Cross-browser Testing**: Test on Chrome, Firefox, Safari, and Edge
3. **Mobile Testing**: Test on various mobile devices and screen sizes
4. **Performance Testing**: Use browser dev tools to check for performance issues

## Deployment

After adding your game:

1. Test thoroughly in development
2. Update the README.md with game information
3. Commit and push your changes
4. Deploy to production using `npm run build` and `firebase deploy`

## Support

If you encounter issues while adding a game:

1. Check the existing game implementations for reference
2. Review the Vue.js and Firebase documentation
3. Check the browser console for errors
4. Ensure all imports and dependencies are correct

## Future Enhancements

Consider these features for your games:

- **Multiplayer Support**: Real-time collaboration
- **Achievement System**: Badges and rewards
- **Progress Tracking**: Detailed analytics
- **Customization**: User preferences and themes
- **Offline Mode**: Service worker implementation
- **Localization**: Multiple language support
