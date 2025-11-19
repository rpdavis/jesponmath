"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateWithGemini = exports.cleanupDuplicateUsers = exports.beforeUserSignedInHandler = exports.beforeUserCreatedHandler = exports.batchCreateStudents = exports.syncGoogleClassroom = exports.updateUser = exports.createUser = void 0;
const v2_1 = require("firebase-functions/v2");
// Set global options
(0, v2_1.setGlobalOptions)({
    maxInstances: 10,
    region: 'us-west1'
});
// Export all functions
var userManagement_1 = require("./userManagement");
Object.defineProperty(exports, "createUser", { enumerable: true, get: function () { return userManagement_1.createUser; } });
Object.defineProperty(exports, "updateUser", { enumerable: true, get: function () { return userManagement_1.updateUser; } });
Object.defineProperty(exports, "syncGoogleClassroom", { enumerable: true, get: function () { return userManagement_1.syncGoogleClassroom; } });
Object.defineProperty(exports, "batchCreateStudents", { enumerable: true, get: function () { return userManagement_1.batchCreateStudents; } });
Object.defineProperty(exports, "beforeUserCreatedHandler", { enumerable: true, get: function () { return userManagement_1.beforeUserCreatedHandler; } });
Object.defineProperty(exports, "beforeUserSignedInHandler", { enumerable: true, get: function () { return userManagement_1.beforeUserSignedInHandler; } });
Object.defineProperty(exports, "cleanupDuplicateUsers", { enumerable: true, get: function () { return userManagement_1.cleanupDuplicateUsers; } });
var geminiProxy_1 = require("./geminiProxy");
Object.defineProperty(exports, "generateWithGemini", { enumerable: true, get: function () { return geminiProxy_1.generateWithGemini; } });
//# sourceMappingURL=index.js.map