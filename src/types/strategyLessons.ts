// Strategy Lesson Types
// Defines structure for mini-lessons that teach math strategies

export type LessonId = 'making-5' | 'making-10' | 'decomposing-ten-frames';

export type PracticeType = 
  | 'missing-number'      // Fill in: 4 + _ = 5
  | 'scaffolded'          // Step-by-step guided
  | 'drag-drop'           // Interactive ten frames
  | 'standard';           // Regular timed problems

export interface StrategyLesson {
  id: LessonId;
  title: string;
  operation: 'addition' | 'subtraction' | 'multiplication' | 'division';
  
  // When to trigger this lesson
  requiredAfterSession?: number;  // e.g., 1 for Making 5, 6 for Making 10
  prerequisites: LessonId[];      // Other lessons that must be completed first
  
  // Lesson content
  overview: {
    what: string;          // What is this strategy?
    why: string;           // Why is it important?
    when: string;          // When to use it?
    examples: string[];    // Example problems
    memoryTricks: string[]; // Mnemonics to remember
  };
  
  // Video instruction
  video: {
    provider: 'khan' | 'youtube';
    url: string;
    title: string;
    startTime?: number;     // Optional start timestamp (seconds)
    duration: number;       // Estimated watch time (seconds)
  };
  
  // Practice problems
  practice: {
    type: PracticeType;
    problems: LessonProblem[];
    successCriteria: {
      minCorrect: number;      // e.g., 8 out of 10
      minPercentage: number;   // e.g., 80%
    };
  };
  
  // Completion
  completionMessage: string;
  nextSteps: string;
}

export interface LessonProblem {
  id: string;
  problemText: string;         // "4 + _ = 5" or "8 + 7 = ?"
  problemType: PracticeType;
  num1: number;
  num2: number;
  operation: 'addition' | 'subtraction' | 'multiplication' | 'division';
  correctAnswer: string;
  
  // For scaffolded problems (multi-step)
  scaffolding?: {
    steps: ScaffoldStep[];
  };
  
  // For drag-drop (ten frames)
  visualAid?: {
    type: 'ten-frame' | 'number-line' | 'hands';
    interactive: boolean;
  };
  
  // Feedback
  hints?: string[];              // Progressive hints if struggling
  feedbackCorrect: string;
  feedbackIncorrect: string;
  strategy: string;              // Strategy explanation
}

export interface ScaffoldStep {
  stepNumber: number;
  question: string;              // "How many do we need to make 10?"
  correctAnswer: string;
  hint?: string;
  explanation?: string;          // Shown after correct answer
}

export interface LessonProgress {
  lessonId: LessonId;
  studentUid: string;
  startedAt: any;               // Timestamp
  completedAt?: any;            // Timestamp
  
  // Progress tracking
  overviewViewed: boolean;
  videoWatched: boolean;
  practiceStarted: boolean;
  practiceCompleted: boolean;
  
  // Practice results
  problemsAttempted: number;
  problemsCorrect: number;
  accuracy: number;
  passedCriteria: boolean;
  
  // Attempts (for retry tracking)
  attempts: number;
  lastAttemptAt?: any;
}





