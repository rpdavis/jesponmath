# Google Classroom Integration Setup

To enable Google Classroom import functionality in JepsonMath Assessment System, you need to configure Google OAuth2 credentials.

## Prerequisites

- Access to Google Cloud Console for the `jepsonmath` project
- Project admin permissions
- Google Workspace or Google for Education account

## Setup Steps

### 1. Enable Google Classroom API

1. Go to [Google Cloud Console](https://console.cloud.google.com/project/jepsonmath)
2. Navigate to **APIs & Services** > **Library**
3. Search for "Google Classroom API"
4. Click **Enable**

### 2. Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** user type (unless using Google Workspace)
3. Fill in required information:
   - **App name**: JepsonMath Assessment System
   - **User support email**: casemanagevue@gmail.com
   - **App domain**: jepsonmath.web.app
   - **Developer contact**: casemanagevue@gmail.com
4. Add scopes:
   - `https://www.googleapis.com/auth/classroom.courses.readonly`
   - `https://www.googleapis.com/auth/classroom.rosters.readonly`
   - `https://www.googleapis.com/auth/classroom.profile.emails`
5. Add test users (teachers who will use the import feature)

### 3. Create OAuth2 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **+ Create Credentials** > **OAuth 2.0 Client IDs**
3. Choose **Web application**
4. Configure:
   - **Name**: JepsonMath Classroom Integration
   - **Authorized JavaScript origins**: 
     - `https://jepsonmath.web.app`
     - `http://localhost:5173` (for development)
   - **Authorized redirect URIs**:
     - `https://jepsonmath.web.app/oauth/callback`
     - `http://localhost:5173/oauth/callback`

### 4. Update Application Configuration

1. Copy the **Client ID** from the credentials page
2. Update `/src/firebase/config.ts`:

```typescript
// Google OAuth2 Configuration for Classroom integration
export const GOOGLE_OAUTH_CONFIG = {
  clientId: "277621705197-YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com", // Replace with real client ID
  scopes: [
    'email',
    'profile',
    'https://www.googleapis.com/auth/classroom.courses.readonly',
    'https://www.googleapis.com/auth/classroom.rosters.readonly',
    'https://www.googleapis.com/auth/classroom.profile.emails'
  ]
};
```

3. Update `/src/services/googleClassroom.ts`:
   - Uncomment the OAuth implementation
   - Replace `277621705197-REAL_OAUTH_CLIENT_ID.apps.googleusercontent.com` with your actual client ID

### 5. Test the Integration

1. Deploy the updated application
2. Sign in as a teacher
3. Go to **My Students** > **Import from Google Classroom**
4. Test the OAuth flow

## Security Considerations

- **Scopes**: Only request minimum necessary permissions
- **Domain Verification**: Verify domain ownership in Google Cloud Console
- **User Consent**: Users must consent to classroom access
- **Data Handling**: Student data should be handled according to FERPA guidelines

## Troubleshooting

### Common Issues:

1. **404 Error**: Check that OAuth client ID is correct
2. **Redirect URI Mismatch**: Ensure redirect URIs match exactly
3. **Scope Errors**: Verify all required scopes are enabled
4. **API Not Enabled**: Ensure Google Classroom API is enabled

### Error Messages:

- `invalid_client`: OAuth client ID is incorrect
- `redirect_uri_mismatch`: Redirect URI not authorized
- `access_denied`: User denied permission or scope not granted
- `invalid_scope`: Requested scope not available

## Production Checklist

- [ ] Google Classroom API enabled
- [ ] OAuth consent screen configured
- [ ] OAuth2 credentials created
- [ ] Client ID updated in application
- [ ] Redirect URIs configured
- [ ] Test users added (if using external consent)
- [ ] Domain verification completed
- [ ] FERPA compliance reviewed

## Current Status

🔧 **Setup Required**: Google OAuth2 credentials need to be configured before Google Classroom import will work.

The application is ready for Google Classroom integration once OAuth2 is properly configured.
