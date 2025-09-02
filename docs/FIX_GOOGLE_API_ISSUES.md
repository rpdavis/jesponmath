# Fix Google API Issues - Step by Step

## 🚨 **Root Cause Identified**

The Google Classroom API issue is caused by **incorrect Firebase App ID**. The error shows:

```
App [1:712458807273:web:mathgamesmrd] not found
```

This means your Firebase configuration has the wrong App ID.

## 🔧 **Step 1: Get Correct Firebase App ID**

### **Go to Firebase Console:**
1. **Visit:** https://console.firebase.google.com/project/mathgamesmrd/settings/general
2. **Scroll down** to "Your apps" section
3. **Look for your web app** (or create one if none exists)

### **If you see a web app:**
- **Copy the App ID** - it should look like: `1:712458807273:web:abcd1234efgh5678`
- **This is what you need to replace in the config**

### **If you DON'T see a web app:**
1. **Click "Add app"** 
2. **Select Web (</> icon)**
3. **App nickname:** `mathgamesmrd-web-app`
4. **Check "Also set up Firebase Hosting"**
5. **Click "Register app"**
6. **Copy the complete configuration** that Firebase shows you

## 🔧 **Step 2: Update Firebase Configuration**

Once you have the correct App ID, tell me what it is and I'll update the configuration immediately.

**Current (INCORRECT):** `1:712458807273:web:mathgamesmrd`  
**Needed:** `1:712458807273:web:ACTUAL_APP_ID`

## 🔧 **Step 3: OAuth Consent Screen Check**

The Google Classroom API is enabled, but you may need to configure the OAuth consent screen properly:

### **Check OAuth Consent Screen:**
**URL:** https://console.cloud.google.com/apis/credentials/consent?project=mathgamesmrd

**Required Settings:**
```
App name: Math Games MRD
User support email: [Your email]
Authorized domains: mathgamesmrd.web.app
App domain: mathgamesmrd.web.app
```

**Required Scopes:**
```
https://www.googleapis.com/auth/userinfo.email
https://www.googleapis.com/auth/userinfo.profile
https://www.googleapis.com/auth/classroom.courses.readonly
https://www.googleapis.com/auth/classroom.rosters.readonly
```

### **Publishing Status:**
- **Internal:** For school district domain only
- **External:** For any Google account (requires verification for production)

## 🔧 **Step 4: Test Users (For External Apps)**

If your OAuth app is "External", you need to add test users:

1. **Go to:** OAuth consent screen → Test users
2. **Add your email** and any other teacher emails
3. **Save**

## 🎯 **What's Working vs What's Not**

### **✅ Working:**
- Google Classroom API is enabled ✅
- OAuth2 Client ID is configured ✅
- API key has correct restrictions ✅
- Website authorization is correct ✅

### **❌ Not Working:**
- Firebase App ID is incorrect ❌
- This causes Firebase Installations API to fail ❌
- This prevents proper Google OAuth2 initialization ❌

## 🚀 **Quick Fix Process**

### **Step 1:** Get your correct Firebase App ID from the console
### **Step 2:** Tell me the App ID 
### **Step 3:** I'll update the configuration and deploy
### **Step 4:** Test Google Classroom API again

## 🔍 **Enhanced Diagnostic Tool**

I've created a comprehensive diagnostic tool at:
**https://mathgamesmrd.web.app/google-diagnostics**

This tool will:
- ✅ Test OAuth2 configuration step by step
- ✅ Identify specific Google API issues
- ✅ Provide detailed error messages
- ✅ Guide you through the exact fix needed

## 📋 **Current Status**

**API Configuration:** ✅ Correct  
**OAuth2 Client ID:** ✅ Configured  
**Google Classroom API:** ✅ Enabled  
**Firebase App ID:** ❌ **NEEDS FIXING** ← This is the main issue  
**OAuth Consent Screen:** ⚠️ May need verification  

## 🎯 **Next Steps**

1. **Get correct Firebase App ID** from Firebase Console
2. **Share it with me** so I can update the configuration  
3. **Test the Google Classroom API** again
4. **If still issues, check OAuth consent screen** configuration

The Google Classroom API is properly enabled - we just need to fix the Firebase App ID to make everything work correctly! 🎉

---

**Firebase Console:** https://console.firebase.google.com/project/mathgamesmrd/settings/general  
**Google Cloud Console:** https://console.cloud.google.com/apis/credentials?project=mathgamesmrd
