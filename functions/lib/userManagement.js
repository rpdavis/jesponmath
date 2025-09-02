"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchCreateStudents = exports.syncGoogleClassroom = exports.updateUser = exports.createUser = void 0;
const https_1 = require("firebase-functions/v2/https");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
// Initialize Firebase Admin
(0, app_1.initializeApp)();
const auth = (0, auth_1.getAuth)();
const db = (0, firestore_1.getFirestore)();
// Create user with proper authentication
exports.createUser = (0, https_1.onCall)(async (request) => {
    var _a;
    const { auth: authContext, data } = request;
    // Verify the caller is authenticated and authorized
    if (!authContext) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    // Get the calling user's data to check permissions
    const callerDoc = await db.collection('users').doc(authContext.uid).get();
    const callerData = callerDoc.data();
    if (!callerData || callerData.userType !== 'teacher') {
        throw new https_1.HttpsError('permission-denied', 'Only teachers can create user accounts');
    }
    // Check if teacher has admin permissions
    const hasAdminPermission = (_a = callerData.permissions) === null || _a === void 0 ? void 0 : _a.some((p) => p.resource === 'students' && p.actions.includes('admin'));
    if (!hasAdminPermission && callerData.role !== 'administrator') {
        throw new https_1.HttpsError('permission-denied', 'Insufficient permissions to create users');
    }
    const { email, password, userType, firstName, lastName, additionalData } = data;
    try {
        // Create Firebase Auth user
        const userRecord = await auth.createUser({
            email,
            password: password || generateRandomPassword(),
            displayName: `${firstName} ${lastName}`,
            emailVerified: false
        });
        // Create user document in Firestore
        const userData = Object.assign({ firebaseUid: userRecord.uid, email,
            userType,
            firstName,
            lastName, isActive: true, createdAt: new Date(), updatedAt: new Date(), lastLogin: null }, additionalData);
        await db.collection('users').doc(userRecord.uid).set(userData);
        return {
            success: true,
            uid: userRecord.uid,
            message: `${userType} account created successfully`
        };
    }
    catch (error) {
        console.error('Error creating user:', error);
        throw new https_1.HttpsError('internal', `Failed to create ${userType} account`);
    }
});
// Update user data
exports.updateUser = (0, https_1.onCall)(async (request) => {
    const { auth: authContext, data } = request;
    if (!authContext) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { uid, updates } = data;
    try {
        // Update Firestore document
        await db.collection('users').doc(uid).update(Object.assign(Object.assign({}, updates), { updatedAt: new Date() }));
        // Update Firebase Auth if email or displayName changed
        if (updates.email || updates.firstName || updates.lastName) {
            const authUpdates = {};
            if (updates.email)
                authUpdates.email = updates.email;
            if (updates.firstName || updates.lastName) {
                authUpdates.displayName = `${updates.firstName || ''} ${updates.lastName || ''}`.trim();
            }
            if (Object.keys(authUpdates).length > 0) {
                await auth.updateUser(uid, authUpdates);
            }
        }
        return { success: true, message: 'User updated successfully' };
    }
    catch (error) {
        console.error('Error updating user:', error);
        throw new https_1.HttpsError('internal', 'Failed to update user');
    }
});
// Sync users from Google Classroom (server-side for security)
exports.syncGoogleClassroom = (0, https_1.onCall)(async (request) => {
    var _a, _b, _c, _d;
    const { auth: authContext, data } = request;
    if (!authContext) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    // Verify caller is a teacher
    const callerDoc = await db.collection('users').doc(authContext.uid).get();
    const callerData = callerDoc.data();
    if (!callerData || callerData.userType !== 'teacher') {
        throw new https_1.HttpsError('permission-denied', 'Only teachers can sync Google Classroom data');
    }
    const { accessToken } = data;
    try {
        // Fetch courses from Google Classroom API
        const coursesResponse = await fetch('https://classroom.googleapis.com/v1/courses', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        if (!coursesResponse.ok) {
            throw new Error('Failed to fetch Google Classroom courses');
        }
        const coursesData = await coursesResponse.json();
        const courses = coursesData.courses || [];
        let studentsCreated = 0;
        let studentsUpdated = 0;
        const errors = [];
        // Process each course
        for (const course of courses) {
            try {
                // Fetch students for this course
                const studentsResponse = await fetch(`https://classroom.googleapis.com/v1/courses/${course.id}/students`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (!studentsResponse.ok)
                    continue;
                const studentsData = await studentsResponse.json();
                const students = studentsData.students || [];
                // Process each student
                for (const student of students) {
                    try {
                        const profile = student.profile;
                        if (!(profile === null || profile === void 0 ? void 0 : profile.emailAddress))
                            continue;
                        // Check if student already exists
                        const existingUserQuery = await db
                            .collection('users')
                            .where('email', '==', profile.emailAddress)
                            .where('userType', '==', 'student')
                            .get();
                        const studentData = {
                            email: profile.emailAddress,
                            studentEmail: profile.emailAddress,
                            firstName: ((_a = profile.name) === null || _a === void 0 ? void 0 : _a.givenName) || '',
                            lastName: ((_b = profile.name) === null || _b === void 0 ? void 0 : _b.familyName) || '',
                            userType: 'student',
                            grade: extractGradeFromCourse(course.name) || '07',
                            schoolSite: 'Willis Jepson Middle',
                            isIEPStudent: false,
                            teacherId: authContext.uid,
                            googleClassroomId: student.userId,
                            enrolledClasses: [course.id],
                            isActive: true,
                            updatedAt: new Date()
                        };
                        if (existingUserQuery.empty) {
                            // Create new student
                            const newStudentData = Object.assign(Object.assign({}, studentData), { firebaseUid: '', createdAt: new Date(), lastLogin: null });
                            await db.collection('users').add(newStudentData);
                            studentsCreated++;
                        }
                        else {
                            // Update existing student
                            const existingStudent = existingUserQuery.docs[0];
                            await existingStudent.ref.update(studentData);
                            studentsUpdated++;
                        }
                    }
                    catch (studentError) {
                        errors.push(`Error processing student ${(_d = (_c = student.profile) === null || _c === void 0 ? void 0 : _c.name) === null || _d === void 0 ? void 0 : _d.fullName}: ${studentError}`);
                    }
                }
            }
            catch (courseError) {
                errors.push(`Error processing course ${course.name}: ${courseError}`);
            }
        }
        return {
            success: true,
            coursesProcessed: courses.length,
            studentsCreated,
            studentsUpdated,
            errors
        };
    }
    catch (error) {
        console.error('Error syncing Google Classroom:', error);
        throw new https_1.HttpsError('internal', 'Failed to sync Google Classroom data');
    }
});
// Utility functions
function generateRandomPassword() {
    return Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
}
function extractGradeFromCourse(courseName) {
    const gradeMatch = courseName.match(/grade?\s*(\d+)|(\d+)(?:st|nd|rd|th)?\s*grade/i);
    if (gradeMatch) {
        const grade = gradeMatch[1] || gradeMatch[2];
        return grade.padStart(2, '0');
    }
    return null;
}
// Batch create students from CSV
exports.batchCreateStudents = (0, https_1.onCall)(async (request) => {
    const { auth: authContext, data } = request;
    if (!authContext) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    // Verify caller is authorized
    const callerDoc = await db.collection('users').doc(authContext.uid).get();
    const callerData = callerDoc.data();
    if (!callerData || callerData.userType !== 'teacher') {
        throw new https_1.HttpsError('permission-denied', 'Only teachers can batch create students');
    }
    const { students } = data;
    try {
        const results = {
            created: 0,
            updated: 0,
            errors: []
        };
        for (const studentData of students) {
            try {
                // Check if student already exists
                const existingQuery = await db
                    .collection('users')
                    .where('studentId', '==', studentData.studentId)
                    .where('userType', '==', 'student')
                    .get();
                if (existingQuery.empty) {
                    // Create new student
                    await db.collection('users').add(Object.assign(Object.assign({}, studentData), { userType: 'student', firebaseUid: '', isActive: true, createdAt: new Date(), updatedAt: new Date(), lastLogin: null, teacherId: authContext.uid }));
                    results.created++;
                }
                else {
                    // Update existing student
                    const existingStudent = existingQuery.docs[0];
                    await existingStudent.ref.update(Object.assign(Object.assign({}, studentData), { updatedAt: new Date() }));
                    results.updated++;
                }
            }
            catch (error) {
                results.errors.push(`Error processing ${studentData.firstName} ${studentData.lastName}: ${error}`);
            }
        }
        return results;
    }
    catch (error) {
        console.error('Error batch creating students:', error);
        throw new https_1.HttpsError('internal', 'Failed to batch create students');
    }
});
//# sourceMappingURL=userManagement.js.map