"use strict";
// Cloud Functions for JepsonMath User Management
// Includes original functions + OAuth merging handlers
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupDuplicateUsers = exports.batchCreateStudents = exports.syncGoogleClassroom = exports.beforeUserSignedInHandler = exports.beforeUserCreatedHandler = exports.updateUser = exports.createUser = void 0;
const https_1 = require("firebase-functions/v2/https");
const identity_1 = require("firebase-functions/v2/identity");
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("firebase-admin/auth");
const app_1 = require("firebase-admin/app");
// Initialize Firebase Admin
(0, app_1.initializeApp)();
const auth = (0, auth_1.getAuth)();
const db = (0, firestore_1.getFirestore)();
// Helper function to generate random password
function generateRandomPassword() {
    return Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
}
// Helper function to extract grade from course name
function extractGradeFromCourse(courseName) {
    const gradeMatch = courseName.match(/\b(\d{1,2})\b/);
    return gradeMatch ? gradeMatch[1].padStart(2, '0') : '07';
}
// ORIGINAL FUNCTIONS (restored)
// Create user with proper authentication
exports.createUser = (0, https_1.onCall)(async (request) => {
    const { auth: authContext, data } = request;
    // Verify the caller is authenticated and authorized
    if (!authContext) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    // Get the calling user's data to check permissions
    const callerDoc = await db.collection('users').doc(authContext.uid).get();
    const callerData = callerDoc.data();
    if (!callerData) {
        throw new https_1.HttpsError('permission-denied', 'User data not found');
    }
    // Allow both teachers and admins to create student accounts
    const isTeacher = callerData.role === 'teacher';
    const isAdmin = callerData.role === 'admin';
    if (!isTeacher && !isAdmin) {
        throw new https_1.HttpsError('permission-denied', 'Only teachers and admins can create student accounts');
    }
    // Teachers can only create student accounts, admins can create any type
    if (isTeacher && data.userType !== 'student') {
        throw new https_1.HttpsError('permission-denied', 'Teachers can only create student accounts');
    }
    const { email, password, userType, firstName, lastName, additionalData } = data;
    try {
        let userRecord;
        let uid;
        // Check if user already exists in Firebase Auth
        try {
            userRecord = await auth.getUserByEmail(email);
            console.log('📌 Firebase Auth user already exists:', userRecord.uid);
            uid = userRecord.uid;
        }
        catch (getUserError) {
            // User doesn't exist, create new one
            if (getUserError.code === 'auth/user-not-found') {
                console.log('➕ Creating new Firebase Auth user...');
                userRecord = await auth.createUser({
                    email,
                    password: password || generateRandomPassword(),
                    displayName: `${firstName} ${lastName}`,
                    emailVerified: false
                });
                uid = userRecord.uid;
                console.log('✅ Created Firebase Auth user:', uid);
            }
            else {
                throw getUserError;
            }
        }
        // Create base user document in users collection
        const baseUserData = {
            uid,
            email,
            displayName: `${firstName} ${lastName}`,
            role: (additionalData === null || additionalData === void 0 ? void 0 : additionalData.role) || userType,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        await db.collection('users').doc(uid).set(baseUserData);
        console.log('✅ Created users collection document');
        // If creating a student, also create students collection document
        if (userType === 'student') {
            const studentData = Object.assign({ uid,
                email, displayName: `${firstName} ${lastName}`, firstName,
                lastName, role: 'student', isActive: true, createdAt: new Date(), updatedAt: new Date() }, additionalData);
            await db.collection('students').doc(uid).set(studentData);
            console.log('✅ Created students collection document');
        }
        return {
            success: true,
            uid,
            message: `${userType} account created successfully`
        };
    }
    catch (error) {
        console.error('❌ Error creating user:', error);
        throw new https_1.HttpsError('internal', `Failed to create ${userType} account: ${error}`);
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
// NEW: OAuth merging handlers
// Before user is created in Firebase Auth - check for existing records
exports.beforeUserCreatedHandler = (0, identity_1.beforeUserCreated)(async (event) => {
    console.log('🔄 beforeUserCreated triggered for:', event.data.email);
    const { email } = event.data;
    if (!email) {
        console.log('⚠️ No email provided, allowing creation');
        return;
    }
    try {
        // Check if this email exists in students collection
        const studentsSnapshot = await db.collection('students')
            .where('email', '==', email)
            .get();
        if (!studentsSnapshot.empty) {
            console.log('📧 Found existing student with email, will merge on sign-in');
            return; // Allow creation, will merge in beforeUserSignedIn
        }
        // Check if this email exists in teachers collection
        const teachersSnapshot = await db.collection('teachers')
            .where('email', '==', email)
            .get();
        if (!teachersSnapshot.empty) {
            console.log('📧 Found existing teacher with email, will merge on sign-in');
            return; // Allow creation, will merge in beforeUserSignedIn
        }
        console.log('✅ New user email, allowing creation');
    }
    catch (error) {
        console.error('❌ Error in beforeUserCreated:', error);
        // Allow creation to continue on error
    }
});
// Before user signs in - merge with existing records AND enforce authorization
exports.beforeUserSignedInHandler = (0, identity_1.beforeUserSignedIn)(async (event) => {
    console.log('🔄 beforeUserSignedIn triggered for:', event.data.email);
    const { email, uid } = event.data;
    if (!email) {
        console.log('⚠️ No email provided, allowing sign-in');
        return;
    }
    try {
        // SECURITY: Check if this email exists in students collection
        const studentsSnapshot = await db.collection('students')
            .where('email', '==', email)
            .get();
        // SECURITY: Check if this email exists in teachers collection
        const teachersSnapshot = await db.collection('teachers')
            .where('email', '==', email)
            .get();
        // SECURITY ENFORCEMENT: Block sign-in if email is not pre-authorized
        if (studentsSnapshot.empty && teachersSnapshot.empty) {
            console.log('🚫 BLOCKING unauthorized email sign-in attempt:', email);
            throw new Error('Access denied. Your email address is not authorized for this system. Please contact your teacher or administrator to be added.');
        }
        console.log('✅ Email is authorized:', email);
        // Continue with merge logic for authorized users
        if (!studentsSnapshot.empty) {
            const existingStudentDoc = studentsSnapshot.docs[0];
            const existingStudentData = existingStudentDoc.data();
            // If the document ID is different from the Firebase Auth UID, we need to merge
            if (existingStudentDoc.id !== uid) {
                console.log('🔄 Merging existing student record with Firebase Auth UID...');
                // Create new document with Firebase Auth UID - preserve ALL existing data
                const mergedStudentData = Object.assign(Object.assign({}, existingStudentData), { uid: uid, lastLogin: new Date(), 
                    // Ensure Google Classroom metadata is preserved
                    googleId: existingStudentData.googleId, courseId: existingStudentData.courseId, courseName: existingStudentData.courseName, section: existingStudentData.section, className: existingStudentData.className, period: existingStudentData.period, 
                    // Preserve all other metadata
                    accommodations: existingStudentData.accommodations || [], assignedAssessments: existingStudentData.assignedAssessments || [], completedAssessments: existingStudentData.completedAssessments || [], currentGoals: existingStudentData.currentGoals || [] });
                console.log('🔍 Merging student data:', {
                    uid: uid,
                    email: existingStudentData.email,
                    googleId: existingStudentData.googleId,
                    courseId: existingStudentData.courseId,
                    courseName: existingStudentData.courseName,
                    section: existingStudentData.section
                });
                // Create new record with correct UID
                await db.collection('students').doc(uid).set(mergedStudentData);
                // Delete old record
                await existingStudentDoc.ref.delete();
                console.log('✅ Student record merged successfully');
            }
            else {
                console.log('✅ Student record already has correct UID');
            }
            // Ensure user record exists
            const userRecord = {
                uid: uid,
                email: email,
                displayName: existingStudentData.displayName || `${existingStudentData.firstName} ${existingStudentData.lastName}`,
                role: 'student',
                isActive: true,
                createdAt: existingStudentData.createdAt || new Date(),
                lastLogin: new Date()
            };
            await db.collection('users').doc(uid).set(userRecord, { merge: true });
            console.log('✅ User record created/updated');
            return;
        }
        // Process teacher/admin (already checked authorization above)
        if (!teachersSnapshot.empty) {
            const existingTeacherDoc = teachersSnapshot.docs[0];
            const existingTeacherData = existingTeacherDoc.data();
            // If the document ID is different from the Firebase Auth UID, we need to merge
            if (existingTeacherDoc.id !== uid) {
                console.log('🔄 Merging existing teacher record with Firebase Auth UID...');
                // Create new document with Firebase Auth UID
                const mergedTeacherData = Object.assign(Object.assign({}, existingTeacherData), { uid: uid, lastLogin: new Date() });
                // Create new record with correct UID
                await db.collection('teachers').doc(uid).set(mergedTeacherData);
                // Delete old record
                await existingTeacherDoc.ref.delete();
                console.log('✅ Teacher record merged successfully');
            }
            else {
                console.log('✅ Teacher record already has correct UID');
            }
            // Ensure user record exists (preserve actual role: teacher or admin)
            const userRecord = {
                uid: uid,
                email: email,
                displayName: existingTeacherData.displayName || `${existingTeacherData.firstName} ${existingTeacherData.lastName}`,
                role: existingTeacherData.role || 'teacher',
                isActive: true,
                createdAt: existingTeacherData.createdAt || new Date(),
                lastLogin: new Date()
            };
            await db.collection('users').doc(uid).set(userRecord, { merge: true });
            console.log('✅ User record created/updated');
            return;
        }
        // This should never happen due to authorization check above
        console.error('❌ CRITICAL: User passed authorization check but no data found!');
    }
    catch (error) {
        console.error('❌ Error in beforeUserSignedIn:', error);
        // If this is an authorization error, re-throw it to block sign-in
        if (error.message && error.message.includes('Access denied')) {
            throw error; // Block the sign-in
        }
        // For other errors, allow sign-in to continue (prevents breaking auth for technical issues)
        console.warn('⚠️ Non-authorization error, allowing sign-in to continue');
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
                            .collection('students')
                            .where('email', '==', profile.emailAddress)
                            .get();
                        const studentData = {
                            email: profile.emailAddress,
                            firstName: ((_a = profile.name) === null || _a === void 0 ? void 0 : _a.givenName) || '',
                            lastName: ((_b = profile.name) === null || _b === void 0 ? void 0 : _b.familyName) || '',
                            grade: extractGradeFromCourse(course.name) || '07',
                            googleId: profile.id,
                            courseId: course.id,
                            courseName: course.name,
                            section: course.section || '',
                            role: 'student',
                            isActive: true,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        };
                        if (existingUserQuery.empty) {
                            // Create new student - will be merged when they sign in
                            await db.collection('students').add(studentData);
                            studentsCreated++;
                        }
                        else {
                            // Update existing student
                            const existingDoc = existingUserQuery.docs[0];
                            await existingDoc.ref.update(Object.assign(Object.assign({}, studentData), { updatedAt: new Date() }));
                            studentsUpdated++;
                        }
                    }
                    catch (studentError) {
                        console.error('Error processing student:', studentError);
                        errors.push(`${((_d = (_c = student.profile) === null || _c === void 0 ? void 0 : _c.name) === null || _d === void 0 ? void 0 : _d.givenName) || 'Unknown'}: ${studentError.message}`);
                    }
                }
            }
            catch (courseError) {
                console.error('Error processing course:', courseError);
                errors.push(`Course ${course.name}: ${courseError.message}`);
            }
        }
        return {
            success: true,
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
// Batch create students
exports.batchCreateStudents = (0, https_1.onCall)(async (request) => {
    const { auth: authContext, data } = request;
    if (!authContext) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { students } = data;
    try {
        const results = [];
        for (const studentData of students) {
            try {
                // Create Firebase Auth user
                const userRecord = await auth.createUser({
                    email: studentData.email,
                    password: generateRandomPassword(),
                    displayName: `${studentData.firstName} ${studentData.lastName}`,
                    emailVerified: false
                });
                // Create Firestore document
                const userData = Object.assign({ firebaseUid: userRecord.uid, email: studentData.email, userType: 'student', firstName: studentData.firstName, lastName: studentData.lastName, isActive: true, createdAt: new Date(), updatedAt: new Date() }, studentData);
                await db.collection('users').doc(userRecord.uid).set(userData);
                results.push({
                    success: true,
                    uid: userRecord.uid,
                    email: studentData.email
                });
            }
            catch (error) {
                results.push({
                    success: false,
                    email: studentData.email,
                    error: error.message
                });
            }
        }
        return { results };
    }
    catch (error) {
        console.error('Error batch creating students:', error);
        throw new https_1.HttpsError('internal', 'Failed to batch create students');
    }
});
// Manual function to clean up duplicate users
exports.cleanupDuplicateUsers = (0, https_1.onCall)(async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be authenticated');
    }
    // Check if user is admin
    const userDoc = await db.collection('users').doc(request.auth.uid).get();
    if (!userDoc.exists || ((_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
        throw new https_1.HttpsError('permission-denied', 'Must be admin');
    }
    try {
        const duplicates = [];
        // Find duplicate students by email
        const studentsSnapshot = await db.collection('students').get();
        const studentsByEmail = new Map();
        studentsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.email) {
                if (!studentsByEmail.has(data.email)) {
                    studentsByEmail.set(data.email, []);
                }
                studentsByEmail.get(data.email).push({ id: doc.id, data });
            }
        });
        // Process duplicates
        for (const [email, records] of studentsByEmail.entries()) {
            if (records.length > 1) {
                console.log(`🔍 Found ${records.length} duplicate students for email: ${email}`);
                // Keep the record with the most complete data (has googleId)
                const recordToKeep = records.find((r) => r.data.googleId) || records[0];
                const recordsToDelete = records.filter((r) => r.id !== recordToKeep.id);
                // Delete duplicates
                for (const record of recordsToDelete) {
                    await db.collection('students').doc(record.id).delete();
                    console.log(`🗑️ Deleted duplicate student record: ${record.id}`);
                }
                duplicates.push({
                    email,
                    kept: recordToKeep.id,
                    deleted: recordsToDelete.map((r) => r.id)
                });
            }
        }
        return {
            success: true,
            duplicatesFound: duplicates.length,
            duplicates: duplicates
        };
    }
    catch (error) {
        console.error('❌ Error cleaning up duplicates:', error);
        throw new https_1.HttpsError('internal', 'Failed to cleanup duplicates');
    }
});
//# sourceMappingURL=userManagement.js.map