// Google Classroom API types
export interface ClassroomCourse {
  id: string;
  name: string;
  section?: string;
  descriptionHeading?: string;
  description?: string;
  room?: string;
  ownerId: string;
  creationTime: string;
  updateTime: string;
  enrollmentCode?: string;
  courseState: 'ACTIVE' | 'ARCHIVED' | 'PROVISIONED' | 'DECLINED' | 'SUSPENDED';
  alternateLink: string;
  teacherGroupEmail?: string;
  courseGroupEmail?: string;
  teacherFolder?: {
    id: string;
    title: string;
    alternateLink: string;
  };
  guardiansEnabled: boolean;
  calendarId?: string;
}

export interface ClassroomStudent {
  courseId: string;
  userId: string;
  profile: {
    id: string;
    name: {
      givenName: string;
      familyName: string;
      fullName: string;
    };
    emailAddress: string;
    photoUrl?: string;
  };
  studentWorkFolder?: {
    id: string;
    title: string;
    alternateLink: string;
  };
}

export interface ClassroomTeacher {
  courseId: string;
  userId: string;
  profile: {
    id: string;
    name: {
      givenName: string;
      familyName: string;
      fullName: string;
    };
    emailAddress: string;
    photoUrl?: string;
  };
}

// Google Classroom service class
export class GoogleClassroomService {
  private accessToken: string | null = null;
  private baseUrl = 'https://classroom.googleapis.com/v1';

  constructor(accessToken?: string) {
    this.accessToken = accessToken || null;
  }

  // Set access token for API calls
  setAccessToken(token: string) {
    this.accessToken = token;
  }

  // Get user's access token using Firebase Auth Google provider with Classroom scopes
  async authenticate(): Promise<string> {
    try {
      // Create a classroom-specific provider with the required scopes
      const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
      const { auth } = await import('../firebase/config');
      
      console.log('🔐 Authenticating with Google for Classroom access...');
      
      // Create provider specifically for classroom access with required scopes
      const classroomProvider = new GoogleAuthProvider();
      classroomProvider.addScope('https://www.googleapis.com/auth/classroom.courses.readonly');
      classroomProvider.addScope('https://www.googleapis.com/auth/classroom.rosters.readonly');
      classroomProvider.addScope('https://www.googleapis.com/auth/classroom.profile.emails');
      
      // Force consent to ensure we get the classroom scopes
      classroomProvider.setCustomParameters({
        prompt: 'consent'
      });
      
      const result = await signInWithPopup(auth, classroomProvider);
      console.log('✅ Google Classroom authentication successful');
      
      // Get the OAuth access token for Classroom API calls
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      
      if (token) {
        console.log('✅ Classroom API access token received');
        this.accessToken = token;
        saveGoogleClassroomToken(token);
        return token;
      } else {
        console.error('❌ No access token in Google response');
        throw new Error('No access token received. Please ensure you grant permission to access Google Classroom.');
      }
      
    } catch (error: any) {
      console.error('❌ Google Classroom authentication failed:', error);
      
      // Provide helpful error messages
      if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup was blocked by your browser. Please allow popups for this site and try again.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Authentication was cancelled. Please try again and grant access to Google Classroom.');
      } else if (error.code === 'auth/unauthorized-domain') {
        throw new Error('This domain is not authorized. Please contact your administrator.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        throw new Error('Authentication cancelled. Please try again.');
      } else {
        throw new Error(`Authentication failed: ${error.message || 'Unknown error'}`);
      }
    }
  }

  // Make authenticated API request
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.accessToken) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google Classroom API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  // Get all courses the user has access to
  async getCourses(): Promise<ClassroomCourse[]> {
    try {
      const response = await this.makeRequest('/courses?courseStates=ACTIVE');
      return response.courses || [];
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
  }

  // Get students from a specific course
  async getStudents(courseId: string): Promise<ClassroomStudent[]> {
    try {
      const response = await this.makeRequest(`/courses/${courseId}/students`);
      return response.students || [];
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  }

  // Get teachers from a specific course
  async getTeachers(courseId: string): Promise<ClassroomTeacher[]> {
    try {
      const response = await this.makeRequest(`/courses/${courseId}/teachers`);
      return response.teachers || [];
    } catch (error) {
      console.error('Error fetching teachers:', error);
      throw error;
    }
  }

  // Get all students from all active courses
  async getAllStudents(): Promise<{ course: ClassroomCourse; students: ClassroomStudent[] }[]> {
    try {
      const courses = await this.getCourses();
      const results = [];

      for (const course of courses) {
        try {
          const students = await this.getStudents(course.id);
          results.push({ course, students });
        } catch (error) {
          console.warn(`Failed to fetch students for course ${course.name}:`, error);
        }
      }

      return results;
    } catch (error) {
      console.error('Error fetching all students:', error);
      throw error;
    }
  }

  // Convert Classroom student to Firebase Student format
  convertToIEPStudent(classroomStudent: ClassroomStudent, course: ClassroomCourse, grade?: string): any {
    return {
      // Required fields for Firebase Student
      email: classroomStudent.profile.emailAddress,
      firstName: classroomStudent.profile.name.givenName,
      lastName: classroomStudent.profile.name.familyName,
      grade: grade || 'Unknown',
      
      // Optional fields
      seisId: '', // Can be filled in later by admin
      aeriesId: '', // Can be filled in later by admin
      districtId: classroomStudent.profile.emailAddress.split('@')[1], // Domain as district
      schoolOfAttendance: course.name,
      caseManager: '',
      
      // Use Google Classroom metadata directly
      googleId: classroomStudent.profile.id, // Google user ID
      courseId: course.id, // Google course ID for class grouping
      courseName: course.name, // Google Classroom course name
      section: course.section || '', // Google Classroom section
      
      // IEP/504 defaults
      hasIEP: false,
      has504: false,
      eligibilityStatus: 'Active',
      
      // Additional classroom info for reference
      classroomInfo: {
        googleId: classroomStudent.profile.id,
        courseId: course.id,
        courseName: course.name,
        section: course.section,
        enrollmentCode: course.enrollmentCode,
        email: classroomStudent.profile.emailAddress,
        photoUrl: classroomStudent.profile.photoUrl,
        importedAt: new Date().toISOString()
      }
    };
  }

  // Import students from selected courses
  async importStudentsFromCourses(courseIds: string[], gradeMapping: Record<string, string> = {}): Promise<any[]> {
    try {
      const allStudents: any[] = [];
      const seenStudents = new Set<string>(); // Prevent duplicates

      for (const courseId of courseIds) {
        const course = (await this.getCourses()).find(c => c.id === courseId);
        if (!course) continue;

        const students = await this.getStudents(courseId);
        const grade = gradeMapping[courseId] || 'Unknown';

        for (const student of students) {
          const studentId = student.profile.id;
          if (seenStudents.has(studentId)) continue;

          seenStudents.add(studentId);
          const iepStudent = this.convertToIEPStudent(student, course, grade);
          allStudents.push(iepStudent);
        }
      }

      return allStudents;
    } catch (error) {
      console.error('Error importing students from courses:', error);
      throw error;
    }
  }
}

// OAuth redirect handler (to be used in a separate HTML page)
export const createOAuthRedirectHandler = () => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Google Classroom Authentication</title>
    </head>
    <body>
      <script>
        // Extract access token from URL fragment
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const error = params.get('error');

        if (accessToken) {
          // Send token to parent window
          window.opener.postMessage({
            type: 'GOOGLE_AUTH_SUCCESS',
            token: accessToken
          }, window.location.origin);
        } else if (error) {
          // Send error to parent window
          window.opener.postMessage({
            type: 'GOOGLE_AUTH_ERROR',
            error: error
          }, window.location.origin);
        }

        // Close popup
        window.close();
      </script>
    </body>
    </html>
  `;
};

// Utility function to check if user is authenticated
export const isGoogleClassroomAuthenticated = (): boolean => {
  return localStorage.getItem('google_classroom_token') !== null;
};

// Save token to localStorage
export const saveGoogleClassroomToken = (token: string): void => {
  localStorage.setItem('google_classroom_token', token);
  localStorage.setItem('google_classroom_token_time', Date.now().toString());
};

// Get token from localStorage
export const getGoogleClassroomToken = (): string | null => {
  const token = localStorage.getItem('google_classroom_token');
  const tokenTime = localStorage.getItem('google_classroom_token_time');
  
  // Check if token is expired (Google tokens typically last 1 hour)
  if (token && tokenTime) {
    const elapsed = Date.now() - parseInt(tokenTime);
    const oneHour = 60 * 60 * 1000;
    
    if (elapsed > oneHour) {
      // Token expired, clear it
      localStorage.removeItem('google_classroom_token');
      localStorage.removeItem('google_classroom_token_time');
      return null;
    }
    
    return token;
  }
  
  return null;
};

// Clear stored token
export const clearGoogleClassroomToken = (): void => {
  localStorage.removeItem('google_classroom_token');
  localStorage.removeItem('google_classroom_token_time');
};

// Create singleton instance
export const googleClassroomService = new GoogleClassroomService(getGoogleClassroomToken() || undefined);
