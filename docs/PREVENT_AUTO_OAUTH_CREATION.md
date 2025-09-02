# How to Stop Google from Auto-Creating OAuth Clients

## 🛑 **Root Cause of Auto-Creation**

Google automatically creates OAuth clients when:
1. **Firebase Analytics** is initialized
2. **Google Sign-In** is used without explicit OAuth client
3. **Firebase Authentication** detects missing OAuth configuration
4. **Google Cloud services** auto-configure OAuth for Firebase

## 🔧 **Permanent Solutions**

### **1. Disable Auto-Creation in Google Cloud Console**

**Go to:** https://console.cloud.google.com/apis/credentials?project=mathgamesmrd

**Click "Configure Consent Screen"** and set:
- **User Type:** Internal (if possible) or External
- **App Status:** In Production (not Testing)
- **Authorized Domains:** Only `mathgamesmrd.web.app`

### **2. Lock Down OAuth Client Creation**

**In Google Cloud Console:**
1. **Go to:** IAM & Admin → IAM
2. **Find your service accounts**
3. **Remove "Service Account Token Creator" role** if present
4. **This prevents automatic OAuth client generation**

### **3. Disable Firebase Auto-Configuration**

**I've already done this in the code:**
- ✅ Disabled Firebase Analytics initialization
- ✅ Removed auto-configuration triggers
- ✅ Set explicit OAuth client ID only

### **4. Project-Level Settings**

**In Firebase Console:**
1. **Go to:** Project Settings → General
2. **Scroll to "Public settings"**
3. **Set Public-facing name:** Math Games MRD
4. **Set Support email:** Your email
5. **This stops Firebase from creating "helper" OAuth clients**

## 🔒 **Lock Your OAuth Configuration**

### **In Google Cloud Console:**

1. **Go to:** https://console.cloud.google.com/apis/credentials?project=mathgamesmrd
2. **Click on your main OAuth client** (Web client 2)
3. **Add these restrictions:**
   - **Authorized JavaScript origins:** `https://mathgamesmrd.web.app`
   - **Authorized redirect URIs:** `https://mathgamesmrd.web.app/__/auth/handler`
4. **Save**

### **Delete the Auto-Created One:**
1. **Find:** "Web client (auto created by Google Service)"
2. **Click the trash icon**
3. **Confirm deletion**

## 🛡️ **Prevent Future Auto-Creation**

### **Set Project Policies:**

**Go to:** https://console.cloud.google.com/iam-admin/orgpolicies?project=mathgamesmrd

**Look for:** "Restrict OAuth Client Creation" policy
**Set to:** "Deny" or "Restrict"

### **Firebase Project Settings:**

**In Firebase Console:**
1. **Disable unused services** that might trigger auto-creation:
   - Remote Config
   - Dynamic Links  
   - App Check (if not needed)
2. **Keep only:** Authentication, Firestore, Hosting, Functions

## 🎯 **Current Status After My Fix:**

**✅ Disabled:** Firebase Analytics (main trigger for auto-creation)
**✅ Set:** Explicit OAuth client ID only
**✅ Removed:** Auto-configuration code
**✅ Updated:** Firebase config with your correct values

## 🚀 **Test Now:**

The auto-creation should stop with these changes. Test your app:
- **Google Sign-In:** https://mathgamesmrd.web.app/login
- **Classroom API:** https://mathgamesmrd.web.app/auth-tester

**If another OAuth client appears after these changes, the issue is in your Google Cloud project settings, not the code.**

## 📋 **Summary of Actions:**

1. ✅ **Disabled Firebase Analytics** (main auto-creation trigger)
2. ✅ **Updated Firebase config** with your correct values
3. ✅ **Removed auto-configuration** code
4. 📋 **Manual cleanup:** Delete the auto-created OAuth client in Google Console
5. 📋 **Project policies:** Set restrictions in Google Cloud Console

**The code changes should prevent future auto-creation!**
