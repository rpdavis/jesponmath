// CSV Migration Utility for JepsonMath Assessment System
// Imports historical grade data from CSV files into the assessment system

import { collection, addDoc, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { COLLECTIONS } from '@/types/users';
import type { Student, Assessment, AssessmentResult } from '@/types/iep';
import type { Teacher } from '@/types/users';

export interface CSVRow {
  [key: string]: string;
}

export interface StudentScore {
  studentName: string;
  studentEmail: string;
  assessmentName: string;
  score: number;
  totalPoints: number;
  percentage: number;
  period: string;
  date: string;
}

export interface MigrationResult {
  success: boolean;
  message: string;
  importedCount: number;
  errors: string[];
}

// Parse CSV content into structured data - handles both comma-separated and tab-separated matrix format
export function parseCSV(csvContent: string): CSVRow[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 1) {
    throw new Error('CSV file must have at least one data row');
  }

  // Detect format: if first line has tabs and ~25+ columns, it's matrix format
  const firstLine = lines[0];
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const isMatrixFormat = tabCount > 20; // Matrix format has ~25 tab-separated columns

  if (isMatrixFormat) {
    console.log('🔍 Detected matrix format (tab-separated)');
    return parseMatrixFormat(lines);
  } else {
    console.log('🔍 Detected standard CSV format (comma-separated)');
    return parseStandardCSV(lines);
  }
}

// Parse standard CSV format (comma-separated with headers)
function parseStandardCSV(lines: string[]): CSVRow[] {
  if (lines.length < 2) {
    throw new Error('Standard CSV must have at least a header row and one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    if (values.length !== headers.length) {
      console.warn(`Row ${i + 1} has ${values.length} columns, expected ${headers.length}`);
      continue;
    }

    const row: CSVRow = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }

  return rows;
}

// Parse matrix format (tab-separated: LastName FirstName + 24 scores for C1-C4)
function parseMatrixFormat(lines: string[]): CSVRow[] {
  const rows: CSVRow[] = [];
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    const parts = line.split('\t').map(p => p.trim());
    if (parts.length < 27) { // LastName + FirstName + Email + 24 scores
      console.warn('Skipping matrix line with insufficient data:', line);
      continue;
    }
    
    const lastName = parts[0];
    const firstName = parts[1];
    const email = parts[2];
    const studentName = `${firstName} ${lastName}`;
    const scores = parts.slice(3); // All score data (skip first 3: lastName, firstName, email)
    
    // Convert matrix format to multiple rows (one per assessment)
    const assessmentNames = ['ESA C1', 'ESA C2', 'ESA C3', 'ESA C4'];
    
    for (let i = 0; i < 4; i++) {
      const startIdx = i * 6;
      const assessmentScores: string[] = [];
      let hasValidData = true;
      
      // Extract 6 scores for this assessment
      for (let j = 0; j < 6; j++) {
        const scoreStr = scores[startIdx + j];
        if (scoreStr === '-' || scoreStr === '' || scoreStr.includes('-')) {
          hasValidData = false;
          break;
        }
        assessmentScores.push(scoreStr);
      }
      
      // Only create row if we have all 6 valid scores
      if (hasValidData && assessmentScores.length === 6) {
        const row: CSVRow = {
          'Student Name': studentName,
          'Student Email': email,
          'Assessment': assessmentNames[i],
          'Q1': assessmentScores[0],
          'Q2': assessmentScores[1],
          'Q3': assessmentScores[2],
          'Q4': assessmentScores[3],
          'Q5': assessmentScores[4],
          'Q6': assessmentScores[5]
        };
        rows.push(row);
      }
    }
  }
  
  console.log(`📊 Converted matrix format to ${rows.length} assessment rows`);
  return rows;
}

// Map CSV data to students
export async function mapCSVToStudents(csvRows: CSVRow[]): Promise<any[]> {
  const students: any[] = [];
  const seenEmails = new Set<string>();

  for (const row of csvRows) {
    let email = row['Student Email'] || row['Email'] || row['email'];
    const name = row['Student Name'] || row['Name'] || row['name'];
    
    // For matrix format, we might need to look up email by name
    if (!email && name) {
      console.log(`🔍 Looking up email for student: ${name}`);
      const existingStudentQuery = query(
        collection(db, COLLECTIONS.STUDENTS),
        where('displayName', '==', name)
      );
      const existingStudentSnapshot = await getDocs(existingStudentQuery);
      
      if (!existingStudentSnapshot.empty) {
        const studentData = existingStudentSnapshot.docs[0].data();
        email = studentData.email;
        console.log(`✅ Found email for ${name}: ${email}`);
      } else {
        console.warn(`❌ Could not find email for student: ${name}`);
        continue;
      }
    }
    
    if (!email || !name || seenEmails.has(email)) {
      continue;
    }

    seenEmails.add(email);

    // Check if student already exists
    const existingStudentQuery = query(
      collection(db, COLLECTIONS.STUDENTS),
      where('email', '==', email)
    );
    const existingStudentSnapshot = await getDocs(existingStudentQuery);
    
    if (!existingStudentSnapshot.empty) {
      console.log(`Student ${email} already exists, skipping creation`);
      continue;
    }

    const student = {
      email,
      displayName: name,
      role: 'student',
      isActive: true,
      createdAt: new Date(),
      lastLogin: null,
      firstName: name.split(' ')[0] || '',
      lastName: name.split(' ').slice(1).join(' ') || '',
      grade: row['Grade'] || row['grade'] || '',
      hasIEP: false,
      has504: false,
      assignedAssessments: [],
      completedAssessments: [],
      currentGoals: [],
      accommodations: []
    };

    students.push(student);
  }

  return students;
}

// Map CSV data to assessments
export async function mapCSVToAssessments(csvRows: CSVRow[]): Promise<any[]> {
  const assessments: any[] = [];
  const seenNames = new Set<string>();

  for (const row of csvRows) {
    const assessmentName = row['Assessment'] || row['Test'] || row['Quiz'] || row['Assignment'];
    
    if (!assessmentName || seenNames.has(assessmentName)) {
      continue;
    }

    seenNames.add(assessmentName);

    // Check if assessment already exists
    const existingAssessmentQuery = query(
      collection(db, COLLECTIONS.ASSESSMENTS),
      where('title', '==', assessmentName)
    );
    const existingAssessmentSnapshot = await getDocs(existingAssessmentQuery);
    
    if (!existingAssessmentSnapshot.empty) {
      console.log(`Assessment ${assessmentName} already exists, skipping creation`);
      continue;
    }

    // Create 6 questions for each assessment
    const questions = [];
    for (let i = 1; i <= 6; i++) {
      questions.push({
        id: `q${i}`,
        type: 'multiple-choice',
        question: `Question ${i} for ${assessmentName}`,
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 'A',
        points: 1,
        standard: `Standard-${assessmentName}-Q${i}`,
        explanation: `Explanation for question ${i}`
      });
    }

    const assessment = {
      title: assessmentName,
      description: `Imported assessment: ${assessmentName}`,
      createdBy: 'system', // Will be updated with actual admin ID
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      questions: questions,
      totalPoints: 6, // 6 questions, 1 point each
      allowRetake: false,
      showCorrectAnswers: true,
      assignDate: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    };

    assessments.push(assessment);
  }

  return assessments;
}

// Generate assessment results from CSV data with detailed question responses
export async function generateAssessmentResults(
  csvRows: CSVRow[],
  students: any[],
  assessments: any[]
): Promise<any[]> {
  const results: any[] = [];
  console.log(`🔍 Processing ${csvRows.length} CSV rows for result generation...`);

  for (const row of csvRows) {
    const email = row['Student Email'] || row['Email'] || row['email'];
    const assessmentName = row['Assessment'] || row['Test'] || row['Quiz'] || row['Assignment'];

    if (!email || !assessmentName) {
      console.log(`⚠️ Skipping row - missing email (${email}) or assessment (${assessmentName})`);
      continue;
    }

    console.log(`🔍 Looking up student: ${email} and assessment: ${assessmentName}`);

    // Get existing student and assessment from database
    const existingStudentQuery = query(
      collection(db, COLLECTIONS.STUDENTS),
      where('email', '==', email)
    );
    const existingStudentSnapshot = await getDocs(existingStudentQuery);
    
    const existingAssessmentQuery = query(
      collection(db, COLLECTIONS.ASSESSMENTS),
      where('title', '==', assessmentName)
    );
    const existingAssessmentSnapshot = await getDocs(existingAssessmentQuery);

    if (existingStudentSnapshot.empty || existingAssessmentSnapshot.empty) {
      console.warn(`❌ Could not find student ${email} or assessment ${assessmentName}`);
      continue;
    }

    console.log(`✅ Found student and assessment for ${email} - ${assessmentName}`);

    const studentDoc = existingStudentSnapshot.docs[0];
    const assessmentDoc = existingAssessmentSnapshot.docs[0];
    const studentUid = studentDoc.data().uid || studentDoc.id; // Use student's UID field
    const assessmentId = assessmentDoc.id;
    const assessmentData = assessmentDoc.data();

    console.log(`🔍 Assessment data:`, { title: assessmentData.title, id: assessmentId, questionsCount: assessmentData.questions?.length });

    // Extract individual question scores (Q1-Q6) using REAL question IDs
    const responses = [];
    let totalScore = 0;
    const totalQuestions = 6;

    for (let i = 1; i <= totalQuestions; i++) {
      const questionScore = parseFloat(row[`Q${i}`] || '0');
      totalScore += questionScore;
      
      // Get the real question ID and standard from the assessment
      const question = assessmentData.questions?.[i - 1]; // Questions are 0-indexed
      const questionId = question?.id || `q_fallback_${i}`;
      const questionStandard = question?.standard || '';
      
      console.log(`🔍 Q${i}: score=${questionScore}, questionId=${questionId}, standard=${questionStandard}`);
      
      responses.push({
        isCorrect: questionScore > 0,
        pointsEarned: questionScore,
        questionId: questionId, // Use REAL question ID from assessment
        studentAnswer: questionScore.toString() // Store as string like app does
      });
    }

    const percentage = (totalScore / totalQuestions) * 100;

    const result = {
      // Core fields (match exact order from your example)
      accommodationsUsed: [],
      assessmentId: assessmentId,
      attemptNumber: 1,
      completedAt: new Date(), // Will be converted to timestamp by Firestore
      feedback: "",
      goalId: "",
      gradedBy: "csv-import",
      isRetake: false,
      migratedAt: new Date(),
      migratedBy: "matrix-csv-import", 
      migrationReason: "Historical data import from matrix CSV format",
      percentage: Math.round(percentage),
      previousAttempts: [],
      responses: responses,
      score: totalScore,
      studentUid: studentUid,
      timeSpent: Math.round(totalQuestions * 30 / 60), // Convert to minutes like app
      totalPoints: totalQuestions,
      uploadedFiles: []
    };

    results.push(result);
  }

  return results;
}

// Main migration function
export async function runCSVImport(csvContent: string): Promise<MigrationResult> {
  try {
    console.log('🔄 Starting CSV import...');
    
    // Parse CSV
    const csvRows = parseCSV(csvContent);
    console.log(`📊 Parsed ${csvRows.length} rows from CSV`);

    // Map to students and assessments
    const students = await mapCSVToStudents(csvRows);
    const assessments = await mapCSVToAssessments(csvRows);
    
    console.log(`👥 Found ${students.length} students`);
    console.log(`📝 Found ${assessments.length} assessments`);

    // Create students in database
    const createdStudents: any[] = [];
    for (const student of students) {
      try {
        const docRef = await addDoc(collection(db, COLLECTIONS.STUDENTS), student);
        student.uid = docRef.id;
        createdStudents.push(student);
        console.log(`✅ Created student: ${student.email}`);
      } catch (error) {
        console.error(`❌ Failed to create student ${student.email}:`, error);
      }
    }

    // Create assessments in database
    const createdAssessments: any[] = [];
    for (const assessment of assessments) {
      try {
        const docRef = await addDoc(collection(db, COLLECTIONS.ASSESSMENTS), assessment);
        assessment.id = docRef.id;
        createdAssessments.push(assessment);
        console.log(`✅ Created assessment: ${assessment.title}`);
      } catch (error) {
        console.error(`❌ Failed to create assessment ${assessment.title}:`, error);
      }
    }

    // Generate and create assessment results (use all students and assessments, not just newly created ones)
    console.log(`🔍 Starting result generation for ${csvRows.length} CSV rows...`);
    const results = await generateAssessmentResults(csvRows, [], []);
    console.log(`📊 Generated ${results.length} assessment results`);
    let importedCount = 0;

    for (const result of results) {
      try {
        await addDoc(collection(db, COLLECTIONS.ASSESSMENT_RESULTS), result);
        importedCount++;
        console.log(`✅ Created result: ${result.studentUid} - ${result.assessmentId}`);
      } catch (error) {
        console.error(`❌ Failed to create result:`, error);
      }
    }

    console.log(`🎉 CSV import completed! Imported ${importedCount} results`);

    return {
      success: true,
      message: `Successfully imported ${importedCount} assessment results from ${csvRows.length} CSV rows`,
      importedCount,
      errors: []
    };

  } catch (error) {
    console.error('❌ CSV import failed:', error);
    return {
      success: false,
      message: `CSV import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      importedCount: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

