# Check Your Progress Data

## Open Console (F12) and run these commands:

### Check total practice days:
```javascript
import { getFluencyProgress } from '@/services/mathFluencyServices'
const progress = await getFluencyProgress('3b5iRWb0vSQgINTxPeVr0bloth13', 'addition')
console.log('Progress:', {
  totalPracticeDays: progress.totalPracticeDays,
  currentSubLevel: progress.currentSubLevel,
  proficiency: progress.proficiencyPercentage,
  lastPracticeDate: progress.lastPracticeDate
})
```

### Check completed sessions:
```javascript
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/firebase/config'

const q = query(
  collection(db, 'mathFluencyPracticeSessions'),
  where('studentUid', '==', '3b5iRWb0vSQgINTxPeVr0bloth13')
)
const snapshot = await getDocs(q)
console.log('Sessions in database:', snapshot.size)
snapshot.docs.forEach(doc => {
  console.log(doc.data())
})
```

Send me the output!




