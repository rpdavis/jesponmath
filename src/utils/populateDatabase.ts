import { 
  createStudent, 
  createGoal,
  createAssessment 
} from '@/firebase/iepServices';
import { FILTERED_STUDENTS } from '@/utils/csvAnalyzer';
import { MATH_ASSESSMENT_BANK } from '@/data/assessmentBank';
import { 
  extractGradeFromStandard,
  type Student,
  type Goal 
} from '@/types/iep';

// Function to populate students and goals
export async function populateStudentsAndGoals() {
  const results = {
    studentsCreated: 0,
    goalsCreated: 0,
    errors: [] as string[]
  };

  for (const studentData of FILTERED_STUDENTS) {
    try {
      // Create student document
      const student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'> = {
        email: `${studentData.firstName.toLowerCase()}.${studentData.lastName.toLowerCase()}@student.school.edu`,
        seisId: studentData.seisId,
        districtId: '', // Not provided in CSV
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        birthdate: '', // Not provided for these students
        grade: studentData.grade,
        schoolOfAttendance: 'Willis Jepson Middle',
        districtOfService: 'Vacaville Unified',
        caseManager: studentData.caseManager,
        serviceProviders: [studentData.caseManager], // Can be expanded
        iepDate: '', // Would need to be extracted from CSV
        eligibilityStatus: 'Eligible',
        goalIds: [] // Will be populated after creating goals
      };

      const studentId = await createStudent(student);
      results.studentsCreated++;

      // Create goals for this student
      const goalIds: string[] = [];
      
      for (const goalData of studentData.goals) {
        const goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'> = {
          studentUid: 'system-generated', // Will be updated when real students are imported
          category: 'SA',
          areaOfNeed: goalData.areaOfNeed,
          goalNumber: goalData.goalNumber,
          baseline: goalData.baseline,
          goalText: goalData.goal,
          standard: goalData.standard,
          gradeLevel: extractGradeFromStandard(goalData.standard),
          startDate: new Date().toISOString().split('T')[0], // Today's date
          endDate: '', // Would need to be extracted from goal text
          personResponsible: studentData.caseManager,
          objectives: [],
          progressReports: [],
          currentProgress: goalData.baseline,
          isActive: true,
          isMet: false
        };

        const goalId = await createGoal(goal);
        goalIds.push(goalId);
        results.goalsCreated++;
      }

      // Update student with goal IDs (in a real implementation)
      // await updateStudentGoals(studentId, goalIds);

    } catch (error) {
      const errorMsg = `Error processing student ${studentData.firstName} ${studentData.lastName}: ${error}`;
      console.error(errorMsg);
      results.errors.push(errorMsg);
    }
  }

  return results;
}

// Function to populate assessment bank
export async function populateAssessmentBank() {
  const results = {
    assessmentsCreated: 0,
    errors: [] as string[]
  };

  for (const assessmentData of MATH_ASSESSMENT_BANK) {
    try {
      await createAssessment(assessmentData);
      results.assessmentsCreated++;
    } catch (error) {
      const errorMsg = `Error creating assessment ${assessmentData.title}: ${error}`;
      console.error(errorMsg);
      results.errors.push(errorMsg);
    }
  }

  return results;
}

// Summary of students and their math goals
export const STUDENT_GOAL_SUMMARY = {
  totalStudents: FILTERED_STUDENTS.length,
  studentsWithMathGoals: FILTERED_STUDENTS.filter(s => s.goals.length > 0).length,
  totalMathGoals: FILTERED_STUDENTS.reduce((sum, student) => sum + student.goals.length, 0),
  caseManagers: [...new Set(FILTERED_STUDENTS.map(s => s.caseManager))],
  standardsCovered: [...new Set(FILTERED_STUDENTS.flatMap(s => s.goals.map(g => g.standard)))],
  goalTypes: [...new Set(FILTERED_STUDENTS.flatMap(s => s.goals.map(g => g.areaOfNeed)))]
};

// Students by case manager
export const STUDENTS_BY_CASE_MANAGER = {
  'Ryan Davis': FILTERED_STUDENTS.filter(s => s.caseManager === 'Ryan Davis'),
  'Tony Delgado': FILTERED_STUDENTS.filter(s => s.caseManager === 'Tony Delgado'),
  'Jonathan Davis': FILTERED_STUDENTS.filter(s => s.caseManager === 'Jonathan Davis')
};

console.log('Student Goal Summary:', STUDENT_GOAL_SUMMARY);
console.log('Students by Case Manager:', STUDENTS_BY_CASE_MANAGER);
