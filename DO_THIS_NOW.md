# Fix Permission System - Do This Now

## The Problem
Permission system not working or showing old version.

## The Fix (5 Minutes)

### Step 1: Stop Everything
Close all terminal windows running dev servers.

### Step 2: Clean Cache
```bash
rm -rf node_modules/.vite dist dev-dist .vite
bun pm cache rm
```

### Step 3: Clear Browser
1. Press F12 (DevTools)
2. Application tab
3. Clear storage (left sidebar)
4. Check ALL boxes
5. Click "Clear site data"
6. Close browser

### Step 4: Start Fresh
```bash
bun run dev
```

Note the port (usually 5173).

### Step 5: Test
1. Open browser in **incognito mode**
2. Go to http://localhost:5173
3. Login as isak@gmail.com
4. Go to Examiners page
5. You should see "Permissions" button

## Verify It's Working

Press F12 → Console tab. You should see:
```
=== useSectionPermissions Debug ===
User email: isak@gmail.com
Is Super Admin: true
```

If you see this, it's working! ✅

## Test Permissions

1. Click "Permissions" on any examiner
2. Uncheck "students" → "Edit"
3. Save
4. Logout
5. Login as that examiner
6. Go to Students page
7. Edit buttons should be hidden

## Still Not Working?

### Check 1: Running old code?
```bash
git pull origin main
bun install
bun run dev
```

### Check 2: Service worker caching?
In browser console:
```javascript
navigator.serviceWorker.getRegistrations().then(r => 
  r.forEach(reg => reg.unregister())
);
```

Then close browser and try again.

### Check 3: Firestore missing data?
1. Go to Firebase Console
2. Firestore Database → users
3. Find your user document
4. Check if "sectionPermissions" field exists

## Important

- Run only ONE dev server
- Test in incognito mode
- Logout after changing permissions
- Use port 5173 (not 8080/8081)

## Documentation

See `PERMISSION_SYSTEM_GUIDE.md` for complete guide.
