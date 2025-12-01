# Math Fluency Progressive Mastery System - Implementation Plan

## 🎯 Overview
Transform the current fluency system into a research-based, progressive mastery system with sub-level progression, paper assessments, and teacher recommendations.

---

## 📋 Implementation Stages

### **STAGE 1: Core Data Structure** ✅ (Week 1)
**Foundation - Must Complete First**

- [ ] Update TypeScript types for sub-levels
- [ ] Add sub-level progression tracking to MathFluencyProgress
- [ ] Create sub-level configuration (14 total levels)
- [ ] Update Firestore data model
- [ ] Create migration utility for existing data

**Deliverables**:
- Updated types in `src/types/mathFluency.ts`
- Sub-level configuration in `src/config/fluencySubLevels.ts`
- Data migration script

---

### **STAGE 2: Sub-Level Problem Filtering** (Week 2)
**Core Logic - Connects Everything**

- [ ] Create problem filtering by sub-level
- [ ] Update placement diagnostic to determine starting sub-level
- [ ] Modify daily practice to filter by current sub-level
- [ ] Add maintenance problem selection (20% from previous levels)
- [ ] Update proficiency calculations per sub-level

**Deliverables**:
- `src/utils/subLevelProblemFilter.ts`
- Modified placement diagnostic
- Enhanced daily practice component

---

### **STAGE 3: Paper Assessment Enhancements** (Week 3)
**Teacher Tools - High Priority**

- [ ] Add sub-level specific test generation
- [ ] Create teacher recommendation system (show who's ready for tests)
- [ ] Update paper assessment generator with sub-level options
- [ ] Set 1-minute standard for all paper tests
- [ ] Add CPM (Correct Per Minute) thresholds by grade level

**Deliverables**:
- Teacher recommendation dashboard
- Enhanced paper assessment generator
- Clear test administration protocol

---

### **STAGE 4: Score Entry & Auto-Advancement** (Week 3-4)
**Critical Path - Closes the Loop**

- [ ] Update score entry to detect sub-level assessments
- [ ] Implement auto-advancement logic (90% = pass)
- [ ] Create celebration UI (level up screen)
- [ ] Add progression service (advance to next sub-level)
- [ ] Update problem banks when sub-level completes

**Deliverables**:
- `src/services/fluencyProgressionService.ts`
- Enhanced score entry component
- Level-up celebration screen

---

### **STAGE 5: Visual Progress Tracking** (Week 4-5)
**Student Motivation - Important**

- [ ] Create sub-level progression dashboard
- [ ] Visual level map (game-style progression)
- [ ] Student progress view with current sub-level
- [ ] Teacher class overview with all students' sub-levels
- [ ] Progress badges/milestones

**Deliverables**:
- `src/components/diagnostics/FluencyLevelDashboard.vue`
- Visual progression map component
- Student progress view

---

### **STAGE 6: Interleaved Practice & Spiral Review** (Week 5-6)
**Research-Based Enhancement**

- [ ] Add weekly spiral review generator
- [ ] Modify practice algorithm: 60% current, 20% maintenance, 20% interleave
- [ ] Create monthly cumulative assessments
- [ ] Add spiral review tracking

**Deliverables**:
- Enhanced practice algorithm
- Spiral review test generator
- Cumulative assessment system

---

### **STAGE 7: Strategy Support** (Week 6-7)
**Instructional Enhancement**

- [ ] Create strategy videos/animations (optional - can be text initially)
- [ ] Add strategy hints during practice
- [ ] Tag problems with applicable strategies
- [ ] Show strategy success rates per student

**Deliverables**:
- Strategy hint system
- Strategy tracking in problem banks

---

### **STAGE 8: Teacher Analytics** (Week 7-8)
**Data-Driven Insights**

- [ ] Error pattern detection
- [ ] Class-level heat maps
- [ ] Intervention recommendations
- [ ] Predictive alerts (ready for test, stuck, inactive)

**Deliverables**:
- Teacher analytics dashboard
- Error analysis reports

---

### **STAGE 9: Parent Communication** (Week 8-9)
**Home Connection**

- [ ] Weekly progress email digest
- [ ] Parent portal (view-only)
- [ ] Optional home practice mode
- [ ] Downloadable practice worksheets

**Deliverables**:
- Parent portal component
- Email notification system

---

### **STAGE 10: Gamification & Motivation** (Week 9-10)
**Engagement Enhancement**

- [ ] Enhanced celebration animations
- [ ] Progress badges and certificates
- [ ] Optional class leaderboard
- [ ] Student goal setting
- [ ] Visual themes/avatars

**Deliverables**:
- Gamification system
- Badge/certificate generator

---

### **STAGE 11: Accommodations & Accessibility** (Week 10-11)
**Special Populations**

- [ ] IEP accommodation settings
- [ ] Extended time options
- [ ] Alternative input methods
- [ ] Modified proficiency thresholds
- [ ] Larger text/audio options

**Deliverables**:
- Accommodation settings panel
- Accessible practice modes

---

## 🎯 Current Focus: STAGE 1

### Sub-Level Structure (Simplified - 14 Total)

#### **Addition (3 levels)**
1. Addition Within 10 (36 problems)
2. Addition Within 20 (45 problems)
3. Addition Mixed Review (30 mixed problems)

#### **Subtraction (3 levels)**
4. Subtraction Within 10 (36 problems)
5. Subtraction Within 20 (90 problems)
6. Subtraction Mixed Review (30 mixed problems)

#### **Multiplication (4 levels)**
7. Multiplication Easy (×0,1,2,5,10) (29 problems)
8. Multiplication Medium (×3,4,6 + squares) (31 problems)
9. Multiplication Hard (×7,8,9,11,12) (36 problems)
10. Multiplication Mixed Review (40 mixed problems)

#### **Division (4 levels)**
11. Division Easy (÷2,5,10) (36 problems)
12. Division Medium (÷3,4,6) (36 problems)
13. Division Hard (÷7,8,9,11,12) (60 problems)
14. Division Mixed Review (40 mixed problems)

---

## ⚙️ Technical Decisions

### **Thresholds**
- **Ready for Assessment**: 85% proficiency (approaching + proficient + mastered)
- **Pass Assessment**: 90% accuracy on 1-minute paper test
- **Unlock Next Operation**: Complete all sub-levels + mixed review

### **CPM Standards** (Correct Per Minute)
- **Grades 3-5**: 40+ CPM
- **Grades 6-8**: 50+ CPM
- **Grades 9-12**: 60+ CPM

### **Practice Algorithm**
- **60%** - Current sub-level (focus on doesNotKnow, emerging, approaching)
- **20%** - Maintenance from previous sub-levels (proficient facts)
- **20%** - Preview/interleave (if appropriate)
- **Exclude** - Mastered facts (unless in maintenance pool)

### **Paper Test Protocol**
- **Duration**: 1 minute (standard across all levels)
- **Format**: PDF with answer key
- **Scoring**: Teacher entry or peer scoring with spot-check
- **Storage**: Template saved for each test instance

---

## 🚀 Getting Started

**Current Status**: Beginning Stage 1 - Core Data Structure
**Next Steps**: 
1. Update TypeScript types
2. Create sub-level configuration
3. Prepare data migration

**Estimated Timeline**: 10-11 weeks for full implementation
**Priority Order**: Stages 1-4 are critical path (Month 1)

---

## 📊 Success Metrics

### **Student Outcomes**
- Time to complete each operation
- Accuracy on paper assessments
- Practice engagement (days per week)
- Sub-level advancement rate

### **Teacher Efficiency**
- Time to generate assessments
- Time to enter scores
- Number of students ready for tests per week
- Teacher satisfaction with recommendations

### **System Performance**
- Data migration success rate
- Score entry accuracy
- Auto-advancement correctness
- Parent portal adoption rate

---

*Last Updated: 2024*

