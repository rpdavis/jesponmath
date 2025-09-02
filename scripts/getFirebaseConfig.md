# Get Complete Firebase Configuration

## 📋 **Current Configuration Status**

✅ **API Key:** `AIzaSyDcPqNOgLkPeB60t_Y0k_zkseX2Gnp2n7c` (Confirmed)  
✅ **Project ID:** `mathgamesmrd`  
✅ **Project Number:** `712458807273`  
⚠️ **App ID:** Needs to be completed  
⚠️ **OAuth2 Client ID:** Needs to be created  

## 🔧 **How to Get Missing Configuration**

### **Step 1: Get Complete App ID**

1. Go to **Firebase Console:** https://console.firebase.google.com/project/mathgamesmrd
2. Click **Project Settings** (gear icon)
3. Scroll down to **"Your apps"** section
4. Look for your web app (or create one if none exists)
5. Copy the complete **App ID** - it should look like:
   `1:712458807273:web:abcd1234efgh5678`

### **Step 2: Update Firebase Config**

Replace this line in `src/firebase/config.ts`:
```javascript
appId: "1:712458807273:web:mathgamesmrd", // Will be updated with actual App ID
```

With your actual App ID:
```javascript
appId: "1:712458807273:web:abcd1234efgh5678", // Your actual App ID
```

### **Step 3: Create OAuth2 Client ID (Required for Google Sign-In)**

1. **OAuth Consent Screen:** https://console.cloud.google.com/apis/credentials/consent?project=mathgamesmrd
   - App name: `Math Games MRD`
   - User support email: Your email
   - Authorized domains: `mathgamesmrd.web.app`
   - Scopes: email, profile, classroom.courses.readonly, classroom.rosters.readonly

2. **Create OAuth2 Client ID:** https://console.cloud.google.com/apis/credentials?project=mathgamesmrd
   - Application type: **Web application**
   - Name: `Math Games MRD Web Client`
   - Authorized JavaScript origins: `https://mathgamesmrd.web.app`
   - Authorized redirect URIs: `https://mathgamesmrd.web.app/__/auth/handler`

3. **Copy Client ID** (looks like): `712458807273-abcd1234efgh5678ijkl9012mnop3456.apps.googleusercontent.com`

4. **Update Firebase Config:**
   ```javascript
   export const GOOGLE_OAUTH_CONFIG = {
     clientId: "712458807273-abcd1234efgh5678ijkl9012mnop3456.apps.googleusercontent.com",
     // ... rest of config
   };
   
   export const OAUTH2_ENABLED = true; // Enable OAuth2
   ```

## ⚡ **Quick Commands After Updates**

```bash
# Build and deploy
npm run build
firebase deploy --only hosting

# Test the authentication
# Visit: https://mathgamesmrd.web.app/login
```

## 🎯 **What This Enables**

Once complete, users will experience:
1. **Role Selection** (Teacher/Student)
2. **Google Sign-In** popup
3. **Automatic Account Creation**
4. **Role-based Redirect** (Dashboard for teachers, Games for students)

## 🔍 **Current Status**

**Working Now:**
- ✅ Application deployed and running
- ✅ Correct API key configured
- ✅ Firebase services connected
- ✅ Fallback authentication available

**Needs OAuth2 Setup:**
- ⚠️ Google sign-in button shows setup instructions
- ⚠️ Users can use email/password fallback
- ⚠️ Registration system works

**After OAuth2 Setup:**
- 🚀 Seamless Google authentication
- 🚀 Automatic user creation
- 🚀 Google Classroom integration ready
