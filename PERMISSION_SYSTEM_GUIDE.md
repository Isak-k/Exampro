# Permission System Guide

## Quick Fix (If Not Working)

### Problem
Permission system not working or showing old version.

### Solution (5 minutes)

1. **Stop all dev servers** - Close all terminals

2. **Clean cache**
   ```bash
   rm -rf node_modules/.vite dist dev-dist .vite
   bun pm cache rm
   ```

3. **Clear browser**
   - Press F12 → Application tab → Clear storage
   - Check ALL boxes → Click "Clear site data"
   - Close browser completely

4. **Start fresh**
   ```bash
   bun run dev
   ```

5. **Test in incognito mode**
   - Open browser in incognito/private mode
   - Go to http://localhost:5173 (or port shown)
   - Login as isak@gmail.com
   - Go to Examiners page
   - You should see "Permissions" button

## How It Works

### Super Admin (isak@gmail.com)
- Has full access to everything
- Can manage other admins' permissions
- Cannot be restricted
- Sees "Permissions" button on Examiners page

### Regular Admins
- Can access ALL pages (sidebar shows all items)
- Permissions control BUTTONS within pages, not page access
- Can be restricted by super admin
- Default: can view all, but cannot edit/delete without permission

### Setting Permissions

1. Login as super admin (isak@gmail.com)
2. Go to Examiners page
3. Click "Permissions" button on any examiner
4. Check/uncheck permissions:
   - **View**: Can see the page and data
   - **Edit**: Can modify/update items
   - **Delete**: Can delete items
5. Click "Save Permissions"
6. Permissions saved to Firestore `users/[userId]/sectionPermissions`

### Testing Permissions

1. Set restrictions on an examiner (e.g., uncheck "students" → "Edit")
2. Logout
3. Login as that examiner
4. Go to Students page
5. Edit buttons should be hidden
6. Page is still accessible, data still visible

## Sections

- **Dashboard**: Main dashboard page
- **Manage Exams**: Create, edit, delete exams
- **All Results**: View all exam results
- **Students**: Manage student accounts
- **Analytics**: View analytics and reports
- **Leaderboard**: Manage leaderboard settings
- **Examiners**: Manage examiner accounts (super admin only)
- **Departments**: Manage departments

## Permission Structure

Stored in Firestore at `users/[userId]/sectionPermissions`:

```json
{
  "dashboard": { "view": true, "edit": false, "delete": false },
  "manageExams": { "view": true, "edit": true, "delete": true },
  "allResults": { "view": true, "edit": false, "delete": false },
  "students": { "view": true, "edit": true, "delete": true },
  "analytics": { "view": true, "edit": false, "delete": false },
  "leaderboard": { "view": true, "edit": true, "delete": false },
  "examiners": { "view": false, "edit": false, "delete": false },
  "departments": { "view": true, "edit": true, "delete": true }
}
```

## Verification

Open browser console (F12) and look for:
```
=== useSectionPermissions Debug ===
User email: isak@gmail.com
Is Super Admin: true
Profile sectionPermissions: {...}
===================================
```

If you don't see this, you're running old code or browser cache is not cleared.

## Common Issues

### Issue: "Failed to fetch examiners"
**Fix**: Pull latest code
```bash
git pull origin main
bun install
bun run dev
```

### Issue: All buttons visible even with restrictions
**Fix**: Clear browser cache and test in incognito mode

### Issue: No "Permissions" button
**Fix**: Make sure you're logged in as isak@gmail.com (super admin)

### Issue: Changes not saving
**Fix**: Check Firestore console to verify data is being saved

## Important Notes

- Only run ONE dev server at a time
- Always test in incognito mode after changes
- Logout and login after changing permissions
- Permissions only affect buttons, not page access
- All admins can see all pages in sidebar
- Super admin cannot be restricted

## Files Reference

- `src/hooks/useSectionPermissions.ts` - Permission hook
- `src/pages/ManageExaminers.tsx` - Permission management UI
- `src/lib/firebase-admin.ts` - Super admin check
- `src/lib/auth.ts` - Load permissions from Firestore
