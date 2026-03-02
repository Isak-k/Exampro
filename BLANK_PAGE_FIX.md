# Blank Page Fix

Your dev server is running on http://localhost:8081/ but showing a blank page.

## Quick Fix Steps

### Step 1: Check Browser Console
1. Press **F12** to open DevTools
2. Click **Console** tab
3. Look for RED error messages
4. Take a screenshot and share it

### Step 2: Hard Refresh
1. Press **Ctrl + Shift + R** (Windows)
2. Or **Cmd + Shift + R** (Mac)
3. This forces browser to reload without cache

### Step 3: Clear Everything
1. Press **F12**
2. Click **Application** tab (top menu)
3. Click **Clear storage** (left sidebar)
4. Check ALL boxes
5. Click **Clear site data** button
6. Close browser completely
7. Open browser again
8. Go to http://localhost:8081/

### Step 4: Try Incognito Mode
1. Open browser in incognito/private mode:
   - Chrome: Ctrl + Shift + N
   - Edge: Ctrl + Shift + P
   - Firefox: Ctrl + Shift + P
2. Go to http://localhost:8081/
3. This bypasses all cache

### Step 5: Check Network Tab
1. Press F12
2. Click **Network** tab
3. Refresh page (F5)
4. Look for failed requests (red items)
5. Take screenshot

## Common Causes

### 1. Service Worker Caching Old Version
**Fix**: In browser console (F12 → Console), paste this:
```javascript
navigator.serviceWorker.getRegistrations().then(function(registrations) {
  for(let registration of registrations) {
    registration.unregister();
  }
  location.reload();
});
```

### 2. Browser Cache
**Fix**: Clear site data (see Step 3 above)

### 3. JavaScript Error
**Fix**: Check console for errors (see Step 1 above)

### 4. Firebase Connection Issue
**Fix**: Check if you can access Firebase Console:
https://console.firebase.google.com/

## What to Check in Console

Look for these specific errors:

### Firebase Errors
```
Firebase: Error (auth/...)
Firebase: Error (firestore/...)
```
**Fix**: Check Firebase configuration in .env file

### Module Errors
```
Failed to resolve module
Cannot find module
```
**Fix**: Run `npm install` in terminal

### Network Errors
```
Failed to fetch
Network request failed
```
**Fix**: Check internet connection

## Still Blank?

If page is still blank after all steps:

1. **Restart Dev Server**
   - Go to terminal
   - Press Ctrl + C to stop server
   - Run `npm run dev` again
   - Wait for "ready" message
   - Try http://localhost:8081/ again

2. **Check if React is Loading**
   - Open browser console (F12)
   - Type: `document.getElementById('root')`
   - Press Enter
   - If it shows `null`, React isn't mounting

3. **Reinstall Dependencies**
   ```bash
   rm -rf node_modules
   npm install
   npm run dev
   ```

## Expected Behavior

When working correctly, you should see:
- ExamPro logo
- Login/Sign up buttons
- Gradient background (cyan/teal colors)
- "Welcome to ExamPro" text

## Need Help?

Share screenshot of:
1. Browser console (F12 → Console tab)
2. Network tab (F12 → Network tab)
3. Terminal showing dev server output
