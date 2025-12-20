# How to Access the Acceleration Simulator

## Quick Access

### Option 1: Direct URL
Once logged in as a teacher, navigate to:
```
https://yourdomain.com/fluency/acceleration-simulator
```

### Option 2: Add Link to Math Fluency Dashboard

**File to Modify**: `src/components/diagnostics/MathFluencyTeacherView.vue`

**Add this button/card**:
```vue
<!-- In the teacher dashboard quick actions section -->
<div class="simulator-card card-purple">
  <h3>🧪 Acceleration Simulator</h3>
  <p>Test placement logic with different diagnostic scores</p>
  <button @click="$router.push('/fluency/acceleration-simulator')">
    Open Simulator
  </button>
</div>
```

### Option 3: Add to Main Navigation

**File to Modify**: Your main navigation component (usually `src/components/Navigation.vue` or similar)

**Add this link**:
```vue
<router-link 
  v-if="userRole === 'teacher'" 
  to="/fluency/acceleration-simulator"
  class="nav-link"
>
  🧪 Acceleration Simulator
</router-link>
```

---

## Usage Guide

### Step 1: Open the Simulator
- Navigate to `/fluency/acceleration-simulator`
- You'll see two sliders: Addition and Subtraction

### Step 2: Adjust Proficiency
- Move sliders to test different diagnostic scores
- Or click preset buttons:
  - **High Performer**: 97%/96% (tests cross-operation skip)
  - **Moderate**: 87%/84% (tests level skip)
  - **Struggling**: 62%/58% (tests standard placement)

### Step 3: Review Results
- **Left Panel**: Input controls
- **Right Panel**: Three result sections
  1. Single operation placement (how each operation is handled)
  2. Cross-operation analysis (final recommendation)
  3. Expected progression timeline

### Step 4: Check Console Logs
- Open DevTools (F12)
- Go to Console tab
- See detailed placement decision logs with:
  - Proficiency percentages
  - Levels skipped
  - Time estimates
  - Decision rationale

### Step 5: Export Data
- Click "Export to CSV" to save simulation history
- Use for documentation or reporting

---

## Testing Scenarios

### Test 1: High Performer (Should Skip to Multiplication)
```
Addition: 97%
Subtraction: 96%

Expected Result:
- Skip Addition (all levels)
- Skip Subtraction (all levels)
- Start at Multiplication Level 8
- Save ~3 hours (~18 sessions)
```

### Test 2: Strong Addition, Weak Subtraction
```
Addition: 95%
Subtraction: 75%

Expected Result:
- Skip Addition (all levels)
- Start at Subtraction Level 1
- Save ~1 hour (~6 sessions)
```

### Test 3: Moderate Performer
```
Addition: 87%
Subtraction: 84%

Expected Result:
- Skip Addition Level 1, start at Level 2
- Skip Subtraction Level 1, start at Level 2
- Save ~40 minutes (~4 sessions)
```

### Test 4: Standard Student
```
Addition: 75%
Subtraction: 70%

Expected Result:
- Start at Addition Level 1
- Start at Subtraction Level 1
- No skip, normal progression
```

---

## Console Commands

### Get Summary Statistics
```javascript
// In browser console
import { getSummaryStats } from '@/utils/accelerationLogger'
getSummaryStats()
```

### Export All Logs
```javascript
import { exportPlacementsToCSV, downloadCSV } from '@/utils/accelerationLogger'

const csv = exportPlacementsToCSV()
downloadCSV(csv, 'placements.csv')
```

### View Recent Placements
```javascript
import { getRecentPlacements } from '@/utils/accelerationLogger'
getRecentPlacements(10) // Last 10 placements
```

### Clear Logs
```javascript
import { clearLogs } from '@/utils/accelerationLogger'
clearLogs()
```

---

## Troubleshooting

### "Page Not Found" Error
- Check you're logged in as a teacher (not student)
- Verify route is added to router: `/fluency/acceleration-simulator`
- Check browser console for errors

### Console Logs Not Showing
- Open DevTools BEFORE running simulation
- Check console filter is set to "All levels" or "Verbose"
- Try `console.clear()` then re-run simulation

### Sliders Not Working
- Check browser supports input range elements
- Try a different browser (Chrome/Firefox recommended)
- Refresh the page

---

## Next Steps

After testing the simulator:
1. Verify all scenarios produce expected results
2. Export data and review placement decisions
3. Test edge cases (0%, 50%, 100% proficiency)
4. Share results with team for validation
5. Deploy to production when ready

---

*Last Updated: 2025-01-XX*








