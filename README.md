# 🧮 Math Games MRD

A fun and educational math game platform built with Vue.js 3, TypeScript, and Firebase. Multiple games available with progressive difficulty, score tracking, and a leaderboard system.

## ✨ Features

- **Multiple Math Games**: Different types of math challenges for various skill levels
- **Interactive Number Line**: Visual learning with drag-and-drop integer operations
- **Math Problem Solver**: Progressive difficulty with addition, subtraction, multiplication, and division
- **Real-time Scoring**: Track your score, accuracy, and time across all games
- **Firebase Integration**: Save scores and user profiles with secure authentication
- **Leaderboard System**: Compete with other players globally
- **User Profiles**: Track your progress and statistics across all games
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🎮 Available Games

### 1. Math Problem Solver 🔢
- **Difficulty**: ⭐⭐⭐ (Intermediate)
- **Category**: Arithmetic
- **Description**: Solve 10 math problems with increasing difficulty. Progress through levels and track your accuracy!
- **Features**: Progressive levels, score tracking, time challenge, multiple operations
- **Age Range**: 7-14 years
- **Estimated Time**: 5 minutes

### 2. Integer Number Line 📊
- **Difficulty**: ⭐⭐ (Beginner)
- **Category**: Number Sense
- **Description**: Learn about positive and negative numbers by modeling income and debt changes on an interactive number line.
- **Features**: Interactive number line, visual learning, real-world context, drag & drop
- **Age Range**: 8-15 years
- **Estimated Time**: 8 minutes

## 🚀 Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn
- Firebase project (see setup instructions below)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd mathgamesmrd
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Firebase Setup**
   
   You'll need to get your Firebase configuration from the Firebase Console:
   
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your `mathgamesmrd` project
   - Click on the gear icon (⚙️) next to "Project Overview"
   - Select "Project settings"
   - Scroll down to "Your apps" section
   - Click the web app icon (</>)
   - Register your app with a nickname (e.g., "mathgamesmrd-vue-app")
   - Copy the configuration object

4. **Update Firebase Configuration**
   
   Edit `src/firebase/config.ts` and replace the placeholder values:
   ```typescript
   const firebaseConfig = {
     apiKey: "YOUR_ACTUAL_API_KEY",
     authDomain: "mathgamesmrd.firebaseapp.com",
     projectId: "mathgamesmrd",
     storageBucket: "mathgamesmrd.appspot.com",
     messagingSenderId: "712458807273",
     appId: "YOUR_ACTUAL_APP_ID",
     measurementId: "YOUR_MEASUREMENT_ID" // Optional
   };
   ```

5. **Firestore Rules Setup**
   
   In your Firebase Console, go to Firestore Database and update the security rules:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Allow users to read and write their own data
       match /userProfiles/{document} {
         allow read, write: if request.auth != null && request.auth.uid == resource.data.id;
       }
       
       // Allow users to read all scores and write their own
       match /gameScores/{document} {
         allow read: if true;
         allow write: if request.auth != null && request.auth.uid == request.resource.data.userId;
       }
     }
   }
   ```

6. **Run the application**
   ```bash
   npm run build
   npm run preview
   ```

## 🏗️ Project Structure

```
src/
├── components/              # Vue components
│   ├── TitleScreen.vue     # Main game selection screen
│   ├── MathGame.vue        # Math problem solver game
│   ├── Leaderboard.vue     # Global leaderboard display
│   ├── UserProfile.vue     # User profile management
│   └── games/              # Individual game components
│       └── IntegerNumberLine.vue
├── composables/            # Vue composables
│   ├── useAuth.ts          # Authentication logic
│   └── useMathGame.ts      # Math game logic and state
├── config/                 # Configuration files
│   └── games.ts            # Game definitions and metadata
├── firebase/               # Firebase configuration and services
│   ├── config.ts           # Firebase initialization
│   └── services.ts         # Firebase service functions
├── types/                  # TypeScript type definitions
│   └── game.ts             # Game-related interfaces
├── router/                 # Vue Router configuration
└── main.ts                # Application entry point
```

## 🎯 How to Play

### Getting Started
1. **Visit the Home Page**: Browse available games on the title screen
2. **Choose a Game**: Select from the available math games
3. **Start Playing**: Each game has its own unique mechanics and objectives
4. **Track Progress**: Monitor your scores, accuracy, and improvement over time

### Math Problem Solver
1. **Start the Game**: Click "Start Game" to begin
2. **Solve Problems**: Answer 10 math problems correctly
3. **Level Up**: Every 3 correct answers increases your level
4. **Earn Points**: Score points based on difficulty and accuracy
5. **Save Score**: Sign in to save your score to the leaderboard

### Integer Number Line
1. **Read the Problem**: Understand the income/debt scenario
2. **Drag the Arrow**: Use your mouse or touch to drag the arrow to the correct position
3. **Keyboard Controls**: Use arrow keys for precision, 'S' to toggle sign
4. **Submit Answer**: Click submit to check your work
5. **Learn from Feedback**: See the correct answer and understand the concept

## 🔧 Development

### Available Scripts

- `npm run build` - Build the project for production
- `npm run preview` - Preview the production build locally
- `npm run format` - Format code with Prettier
- `npm run lint` - Lint code with ESLint

### Adding New Games

The application is designed to easily accommodate new games. See [docs/ADDING_NEW_GAMES.md](docs/ADDING_NEW_GAMES.md) for detailed instructions on:

- Game configuration and metadata
- Component structure and implementation
- Firebase integration
- Best practices and examples

### Game Categories

Games are organized into categories:
- **Arithmetic**: Basic operations and calculations
- **Geometry**: Shapes, angles, and spatial reasoning
- **Algebra**: Variables, equations, and patterns
- **Number Sense**: Understanding numbers and their relationships
- **Problem Solving**: Logic and critical thinking challenges

## 🌐 Deployment

### Firebase Hosting

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Initialize Firebase Hosting**
   ```bash
   firebase init hosting
   ```

4. **Build and Deploy**
   ```bash
   npm run build
   firebase deploy
   ```

### Other Platforms

The built application can be deployed to any static hosting service:
- Netlify
- Vercel
- GitHub Pages
- AWS S3 + CloudFront

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Adding New Games

We welcome contributions of new math games! Please see [docs/ADDING_NEW_GAMES.md](docs/ADDING_NEW_GAMES.md) for detailed guidelines.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues:

1. Check the Firebase Console for any configuration errors
2. Verify your Firestore rules are properly set
3. Check the browser console for JavaScript errors
4. Ensure all environment variables are properly configured
5. Review the game-specific documentation

## 🎯 Future Enhancements

- [ ] Additional game categories (geometry, algebra, etc.)
- [ ] Multiplayer and collaborative games
- [ ] Achievement and badge system
- [ ] Advanced analytics and progress tracking
- [ ] Custom game creation tools
- [ ] Offline mode support
- [ ] Multi-language support
- [ ] Accessibility improvements
- [ ] Sound effects and animations
- [ ] Adaptive difficulty algorithms

## 📚 Educational Value

Each game is designed with specific learning objectives:

- **Math Problem Solver**: Builds computational fluency and problem-solving skills
- **Integer Number Line**: Develops understanding of positive/negative numbers and real-world applications
- **Future Games**: Will cover additional mathematical concepts and skills

---

Built with ❤️ using Vue.js 3, TypeScript, and Firebase

*Empowering students to learn math through interactive, engaging gameplay.*
