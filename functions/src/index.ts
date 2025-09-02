import { setGlobalOptions } from 'firebase-functions/v2';

// Set global options
setGlobalOptions({
  maxInstances: 10,
  region: 'us-west1'
});

// Export all functions
export { 
  createUser, 
  updateUser, 
  syncGoogleClassroom, 
  batchCreateStudents,
  beforeUserCreatedHandler,
  beforeUserSignedInHandler,
  cleanupDuplicateUsers
} from './userManagement';
