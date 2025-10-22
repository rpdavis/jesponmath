// Aeries Grade Export Service
// Exports assessment results from JepsonMath to Aeries SIS format

import type { AssessmentResult } from '@/types/iep';
import type { Student, Teacher } from '@/types/users';
import { getAssessmentResults, getAssessmentResultsByStudent } from '@/firebase/iepServices';
import { getStudentsByTeacher } from '@/firebase/userServices';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';

export interface AeriesGradeRecord {
  studentId: string; // Aeries student ID
  assignmentName: string;
  score: number;
  totalPoints: number;
  percentage: number;
  dateCompleted: string; // YYYY-MM-DD format
  category: string; // e.g., "Assessment", "Quiz", "Test"
  comments?: string;
}

export interface AeriesExportData {
  courseId: string;
  courseName: string;
  teacherId: string;
  grades: AeriesGradeRecord[];
  exportDate: string;
  totalRecords: number;
}

export interface ExportOptions {
  format: 'csv' | 'json' | 'xml';
  dateRange?: {
    start: Date;
    end: Date;
  };
  includeRetakes?: boolean;
  gradeCategory?: string;
}

/**
 * Export assessment results for a specific teacher to Aeries format
 */
export async function exportTeacherGradesToAeries(
  teacherId: string,
  options: ExportOptions = { format: 'csv' }
): Promise<AeriesExportData> {
  try {
    console.log('🔄 Starting Aeries grade export for teacher:', teacherId);
    
    // Get teacher's students
    const students = await getStudentsByTeacher(teacherId);
    console.log(`👥 Found ${students.length} students`);
    
    // Get teacher info for course details
    const teacherDoc = await getDoc(doc(db, 'teachers', teacherId));
    const teacherData = teacherDoc.data() as Teacher;
    
    // Get all assessment results for these students
    const allGrades: AeriesGradeRecord[] = [];
    let studentsWithoutAeriesId = 0;
    let totalStudentResults = 0;
    
    for (const student of students) {
      if (!student.aeriesId) {
        studentsWithoutAeriesId++;
        console.warn(`⚠️ Student ${student.firstName} ${student.lastName} missing Aeries ID - using email as fallback`);
        // Don't skip - we'll use email as fallback
      }
      
      // Get student's assessment results
      const studentResults = await getStudentAssessmentResults(student.uid);
      totalStudentResults += studentResults.length;
      console.log(`📊 Student ${student.firstName} ${student.lastName} has ${studentResults.length} results`);
      
      // Filter by date range if specified
      const filteredResults = options.dateRange 
        ? studentResults.filter(result => {
            const completedDate = result.completedAt?.toDate();
            return completedDate >= options.dateRange!.start && 
                   completedDate <= options.dateRange!.end;
          })
        : studentResults;
      
      // Filter retakes if needed
      const finalResults = options.includeRetakes 
        ? filteredResults 
        : filteredResults.filter(result => !result.isRetake);
      
      // Convert to Aeries format
      for (const result of finalResults) {
        const assessment = await getAssessmentDetails(result.assessmentId);
        
        const gradeRecord: AeriesGradeRecord = {
          studentId: student.aeriesId || student.email || `${student.firstName}_${student.lastName}`,
          assignmentName: assessment?.title || `Assessment ${result.assessmentId.slice(-6)}`,
          score: result.score,
          totalPoints: result.totalPoints,
          percentage: result.percentage,
          dateCompleted: formatDateForAeries(result.completedAt?.toDate()),
          category: options.gradeCategory || 'Assessment',
          comments: result.feedback || undefined
        };
        
        allGrades.push(gradeRecord);
      }
    }
    
    const exportData: AeriesExportData = {
      courseId: teacherData.aeriesId || teacherId,
      courseName: `${teacherData.firstName} ${teacherData.lastName} - Math`,
      teacherId: teacherData.aeriesId || teacherId,
      grades: allGrades,
      exportDate: new Date().toISOString().split('T')[0],
      totalRecords: allGrades.length
    };
    
    console.log(`✅ Export complete: ${allGrades.length} grade records`);
    console.log(`📊 Export summary: ${students.length} total students, ${studentsWithoutAeriesId} without Aeries ID, ${totalStudentResults} total results found`);
    return exportData;
    
  } catch (error) {
    console.error('❌ Error exporting grades to Aeries:', error);
    throw error;
  }
}

/**
 * Export grades by class period
 */
export async function exportGradesByPeriod(
  teacherId: string,
  period: string,
  options: ExportOptions = { format: 'csv' }
): Promise<AeriesExportData> {
  try {
    console.log(`🔄 Exporting grades for period ${period}`);
    
    // Get students for specific period
    const allStudents = await getStudentsByTeacher(teacherId);
    const periodStudents = allStudents.filter(student => student.period === period);
    
    console.log(`👥 Found ${periodStudents.length} students in period ${period}`);
    
    // Use the main export function but with filtered students
    const tempTeacherId = `${teacherId}_period_${period}`;
    
    // Create temporary export for this period
    const exportData = await exportTeacherGradesToAeries(teacherId, options);
    
    // Filter grades to only include students from this period
    const periodGrades = exportData.grades.filter(grade => 
      periodStudents.some(student => student.aeriesId === grade.studentId)
    );
    
    return {
      ...exportData,
      courseId: `${exportData.courseId}_P${period}`,
      courseName: `${exportData.courseName} - Period ${period}`,
      grades: periodGrades,
      totalRecords: periodGrades.length
    };
    
  } catch (error) {
    console.error('❌ Error exporting period grades:', error);
    throw error;
  }
}

/**
 * Convert export data to CSV format for Aeries import
 */
export function convertToAeriesCSV(exportData: AeriesExportData): string {
  const headers = [
    'Student_ID',
    'Assignment_Name', 
    'Score',
    'Total_Points',
    'Percentage',
    'Date_Completed',
    'Category',
    'Comments'
  ];
  
  const rows = exportData.grades.map(grade => [
    grade.studentId,
    `"${grade.assignmentName}"`, // Wrap in quotes for CSV safety
    grade.score.toString(),
    grade.totalPoints.toString(),
    grade.percentage.toString(),
    grade.dateCompleted,
    grade.category,
    grade.comments ? `"${grade.comments}"` : ''
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  return csvContent;
}

/**
 * Convert export data to Aeries XML format
 */
export function convertToAeriesXML(exportData: AeriesExportData): string {
  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
  const rootOpen = `<AeriesGradeExport courseId="${exportData.courseId}" exportDate="${exportData.exportDate}">`;
  const rootClose = '</AeriesGradeExport>';
  
  const gradesXML = exportData.grades.map(grade => `
    <Grade>
      <StudentID>${grade.studentId}</StudentID>
      <AssignmentName><![CDATA[${grade.assignmentName}]]></AssignmentName>
      <Score>${grade.score}</Score>
      <TotalPoints>${grade.totalPoints}</TotalPoints>
      <Percentage>${grade.percentage}</Percentage>
      <DateCompleted>${grade.dateCompleted}</DateCompleted>
      <Category>${grade.category}</Category>
      ${grade.comments ? `<Comments><![CDATA[${grade.comments}]]></Comments>` : ''}
    </Grade>
  `).join('');
  
  return `${xmlHeader}\n${rootOpen}${gradesXML}\n${rootClose}`;
}

/**
 * Generate downloadable file for export
 */
export function downloadAeriesExport(
  exportData: AeriesExportData,
  format: 'csv' | 'json' | 'xml' = 'csv'
): void {
  let content: string;
  let filename: string;
  let mimeType: string;
  
  const timestamp = new Date().toISOString().split('T')[0];
  const courseId = exportData.courseId.replace(/[^a-zA-Z0-9]/g, '_');
  
  switch (format) {
    case 'csv':
      content = convertToAeriesCSV(exportData);
      filename = `aeries_grades_${courseId}_${timestamp}.csv`;
      mimeType = 'text/csv';
      break;
    case 'xml':
      content = convertToAeriesXML(exportData);
      filename = `aeries_grades_${courseId}_${timestamp}.xml`;
      mimeType = 'application/xml';
      break;
    case 'json':
    default:
      content = JSON.stringify(exportData, null, 2);
      filename = `aeries_grades_${courseId}_${timestamp}.json`;
      mimeType = 'application/json';
      break;
  }
  
  // Create and trigger download
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  console.log(`📁 Downloaded: ${filename} (${exportData.totalRecords} records)`);
}

// Helper functions
async function getStudentAssessmentResults(studentUid: string): Promise<AssessmentResult[]> {
  try {
    console.log(`🔍 Getting results for student: ${studentUid}`);
    return await getAssessmentResultsByStudent(studentUid);
  } catch (error) {
    console.error('Error getting student results:', error);
    return [];
  }
}

async function getAssessmentDetails(assessmentId: string) {
  try {
    const assessmentDoc = await getDoc(doc(db, 'assessments', assessmentId));
    return assessmentDoc.exists() ? assessmentDoc.data() : null;
  } catch (error) {
    console.error('Error getting assessment details:', error);
    return null;
  }
}

function formatDateForAeries(date: Date | undefined): string {
  if (!date) return new Date().toISOString().split('T')[0];
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
}

// Export validation
export function validateAeriesExport(exportData: AeriesExportData): string[] {
  const errors: string[] = [];
  
  if (!exportData.courseId) errors.push('Course ID is required');
  if (!exportData.teacherId) errors.push('Teacher ID is required');
  if (exportData.grades.length === 0) errors.push('No grades to export');
  
  // Validate each grade record
  exportData.grades.forEach((grade, index) => {
    if (!grade.studentId) errors.push(`Grade ${index + 1}: Student ID is required`);
    if (!grade.assignmentName) errors.push(`Grade ${index + 1}: Assignment name is required`);
    if (grade.score < 0) errors.push(`Grade ${index + 1}: Score cannot be negative`);
    if (grade.totalPoints <= 0) errors.push(`Grade ${index + 1}: Total points must be positive`);
  });
  
  return errors;
}
