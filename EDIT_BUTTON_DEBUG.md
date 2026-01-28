# Edit Button Debug Guide

## Current Implementation

### 1. Click Edit Button
**File**: `src/components/management/modals/TemplatePreviewModal.vue` (line 206-213)

```typescript
const openTemplateEditor = (templateId: string) => {
  // Navigate using Vue Router and open in new tab
  const routeData = router.resolve({
    path: '/admin/templates',
    query: { edit: templateId }
  })
  window.open(routeData.href, '_blank')
}
```

**What happens**: Opens new tab with URL like `https://yourapp.com/admin/templates?edit=abc123`

### 2. New Tab Opens
**Route**: `/admin/templates` 
**Guard**: `adminGuard` (admin only)
**Component**: `GoalTemplateManagement.vue`

### 3. onMounted Hook Runs
**File**: `src/components/admin/GoalTemplateManagement.vue` (line 1326-1350)

```typescript
onMounted(async () => {
  await loadTemplates()
  await loadRubrics()
  await loadGoals()
  
  // Check if we should open a specific template for editing
  const editTemplateId = route.query.edit as string | undefined
  if (editTemplateId) {
    console.log('📝 Opening template for editing from URL:', editTemplateId)
    try {
      const template = await getTemplate(editTemplateId)
      if (template) {
        editTemplate(template)  // <-- Opens edit modal
        router.replace({ query: {} })
      } else {
        console.warn('Template not found:', editTemplateId)
        alert('Template not found or you do not have access to it.')
      }
    } catch (error) {
      console.error('Error loading template from URL:', error)
      alert('Failed to load template for editing.')
    }
  }
})
```

## Debugging Steps

### Step 1: Check Browser Console
When you click Edit and the new tab opens, open Browser DevTools Console and look for:
- `📝 Opening template for editing from URL: [templateId]`
- If you see this, the query param is being detected
- If not, the URL might be wrong

### Step 2: Check the URL
In the new tab, look at the address bar:
- Should be: `/admin/templates?edit=abc123xyz`
- If it's just `/admin/templates` without `?edit=...`, the button is not passing the ID correctly
- If it redirects to `/` (dashboard), you don't have admin access

### Step 3: Check User Role
In console on ANY page, type:
```javascript
JSON.parse(localStorage.getItem('auth-store')).currentUser.role
```
Should return: `"admin"`
If it returns `"teacher"`, you can't access `/admin/templates`

### Step 4: Check if Modal Opens
After the console log `📝 Opening template...`:
- Edit modal should appear with form fields populated
- If you see the template management page but NO modal, the `editTemplate()` function is not working

## Common Issues

### Issue A: Redirects to Dashboard
**Symptom**: New tab opens but goes to `/` instead of `/admin/templates`
**Cause**: User is not an admin (adminGuard failing)
**Fix**: Log in as admin user

### Issue B: Shows Template Page but No Modal
**Symptom**: See template list but no edit modal
**Cause**: 
1. Query param not in URL
2. `getTemplate()` failed to find template
3. `editTemplate()` function not working

**Debug**: Check console for error messages

### Issue C: URL Has No Query Parameter
**Symptom**: URL is `/admin/templates` without `?edit=...`
**Cause**: `router.resolve()` not working or templateId is undefined
**Debug**: 
1. Check if clicking Edit logs the templateId in console
2. Add `console.log('Template ID:', templateId)` in `openTemplateEditor()`

## Manual Test

1. Go to Manage Goals (PA)
2. Find a goal with assigned templates
3. Click "Generate Assessment"
4. Review Templates modal opens
5. Open Browser DevTools Console (F12)
6. Click "✏️ Edit" button on any template
7. Watch console for logs
8. New tab should open with edit modal

## If Still Not Working

Add this debugging to `openTemplateEditor()`:

```typescript
const openTemplateEditor = (templateId: string) => {
  console.log('🔧 DEBUG: Opening editor for template:', templateId)
  const routeData = router.resolve({
    path: '/admin/templates',
    query: { edit: templateId }
  })
  console.log('🔧 DEBUG: Resolved URL:', routeData.href)
  console.log('🔧 DEBUG: Full route:', routeData)
  window.open(routeData.href, '_blank')
}
```

Check console for these logs BEFORE new tab opens.
