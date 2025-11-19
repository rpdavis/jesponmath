# Google API Setup for Math Games MRD

This guide walks you through setting up Google OAuth2 and Google Classroom API integration.

## 🔧 Required APIs

### Enable APIs in Google Cloud Console

Visit [Google Cloud Console API Library](https://console.cloud.google.com/apis/library?project=jepsonmath) and enable:

1. **Google Classroom API** ✅ (You mentioned this is done)
   - API ID: `classroom.googleapis.com`
   - Required for: Importing student rosters

2. **Google Sheets API** ✅ (Required for Standard Assessment export sync)
   - API ID: `sheets.googleapis.com`
   - Required for: Syncing Standard Assessment data to Google Sheets

3. **Google People API**
   - API ID: `people.googleapis.com` 
   - Required for: User profile information

4. **Admin SDK API** (Optional but recommended)
   - API ID: `admin.googleapis.com`
   - Required for: Advanced user management

## 🔐 OAuth2 Configuration

### 1. Configure OAuth Consent Screen

Go to: [OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent?project=jepsonmath)

**App Information:**
- App name: `Math Games MRD`
- User support email: `your-email@vacavilleusd.org`
- App logo: (Optional - upload your app logo)

**App Domain:**
- Application home page: `https://mathgamesmrd.web.app`
- Application privacy policy URL: `https://mathgamesmrd.web.app/privacy`
- Application terms of service URL: `https://mathgamesmrd.web.app/terms`

**Authorized Domains:**
```
mathgamesmrd.web.app
vacavilleusd.org
```

**Scopes:**
Add these OAuth scopes:
```
https://www.googleapis.com/auth/userinfo.email
https://www.googleapis.com/auth/userinfo.profile
https://www.googleapis.com/auth/classroom.courses.readonly
https://www.googleapis.com/auth/classroom.rosters.readonly
https://www.googleapis.com/auth/classroom.profile.emails
https://www.googleapis.com/auth/spreadsheets
```

### 2. Create OAuth2 Credentials

Go to: [Credentials](https://console.cloud.google.com/apis/credentials?project=jepsonmath)

1. Click **+ CREATE CREDENTIALS** → **OAuth 2.0 Client ID**
2. Application type: **Web application**
3. Name: `Math Games MRD Web Client`

**Authorized JavaScript origins:**
```
https://mathgamesmrd.web.app
http://localhost:4173
http://localhost:5173
```

**Authorized redirect URIs:**
```
https://mathgamesmrd.web.app/__/auth/handler
http://localhost:4173/__/auth/handler
http://localhost:5173/__/auth/handler
```

### 3. Update Firebase Config

After creating OAuth2 credentials, you'll get a **Client ID**. Update your Firebase config:

```typescript
// In src/firebase/config.ts, add this after the firebaseConfig:
export const GOOGLE_OAUTH_CONFIG = {
  clientId: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
  scopes: [
    'email',
    'profile', 
    'https://www.googleapis.com/auth/classroom.courses.readonly',
    'https://www.googleapis.com/auth/classroom.rosters.readonly'
  ]
};
```

## 🏫 Google Workspace for Education Setup

### For School Districts Using Google Workspace:

1. **Admin Console Configuration**
   - Go to [Google Admin Console](https://admin.google.com)
   - Navigate to **Security** → **API Controls** → **App Access Control**
   - Add `mathgamesmrd.web.app` to trusted apps

2. **Domain-wide Delegation** (Optional for advanced features)
   - Enable if you want server-side access to all classroom data
   - Create a service account in Google Cloud Console
   - Enable domain-wide delegation for the service account

3. **User Email Domains**
   Configure these email patterns in your app:
   
   **Teachers:**
   - `@vacavilleusd.org`
   - `@staff.vacavilleusd.org`
   
   **Students:**
   - `@students.vacavilleusd.org`
   - `@student.vacavilleusd.org`

## 📚 Google Classroom Integration Options

### Option 1: OAuth2 + Manual Import (Recommended)
✅ **Pros:** 
- Simple setup
- Teacher controls what data is imported
- No special admin permissions needed

❌ **Cons:** 
- Manual process for each teacher
- Limited to courses teacher has access to

### Option 2: Google Classroom API + Service Account
✅ **Pros:**
- Automatic roster synchronization
- Can access all school data (with proper permissions)
- Batch operations

❌ **Cons:**
- Requires Google Workspace admin setup
- More complex permission management
- Requires service account setup

### Option 3: CSV Upload + Manual Entry
✅ **Pros:**
- No API dependencies
- Works with any student information system
- Full control over data

❌ **Cons:**
- Manual process
- No automatic updates
- More prone to data entry errors

## 🔧 Implementation Status

### ✅ Completed:
- Cloud Functions deployed
- OAuth2 authentication setup
- Firebase configuration updated
- Firestore rules configured
- User management system created

### 🔲 Next Steps:
1. **Get OAuth2 Client ID** from Google Cloud Console
2. **Update Firebase config** with the Client ID
3. **Enable Google Classroom API** (if not already done)
4. **Test authentication flow**
5. **Configure OAuth consent screen**

## 🧪 Testing

### Test OAuth2 Login:
1. Visit: `https://mathgamesmrd.web.app/login`
2. Click "Teacher Login" → "Sign in with Google Workspace"
3. Should redirect to Google OAuth consent screen
4. After approval, should redirect back to your app

### Test Google Classroom Import:
1. Login as a teacher
2. Navigate to IEP Manager
3. Look for Google Classroom sync option
4. Should display your courses and allow student import

## 🆘 Troubleshooting

### Common Issues:

1. **"Access blocked" error**
   - Check OAuth consent screen configuration
   - Verify authorized domains are correct

2. **"API not enabled" error**
   - Enable Google Classroom API in Cloud Console
   - Wait 5-10 minutes for propagation

3. **"Invalid redirect URI" error**
   - Check authorized redirect URIs in OAuth2 credentials
   - Ensure exact match including protocol (https/http)

4. **"Insufficient permissions" error**
   - Check Google Workspace admin settings
   - Verify app is approved for your domain

## 📞 Support

If you encounter issues:
1. Check the browser console for detailed error messages
2. Verify all APIs are enabled in Google Cloud Console
3. Test with a simple OAuth2 flow first before adding Classroom API calls
4. Contact your Google Workspace admin if domain restrictions are blocking access

---

**Your Project Details:**
- Project ID: `jepsonmath` (lowercase)
- Project Number: `277621705197`
- Auth Domain: `jepsonmath.firebaseapp.com`
- Hosting URL: Check your Firebase Hosting settings
- Functions Region: `us-west1`
