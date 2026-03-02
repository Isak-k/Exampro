# Quick Start Guide

## If Permission System Not Working

### The Problem
Multiple dev servers running or browser cache issues.

### The Fix (5 minutes)

1. **Stop all terminals**

2. **Clean cache**
   ```bash
   rm -rf node_modules/.vite dist dev-dist .vite
   bun pm cache rm
   ```

3. **Clear browser** (F12 → Application → Clear storage → Clear all)

4. **Start dev server**
   ```bash
   bun run dev
   ```

5. **Test in incognito mode** at http://localhost:5173

## How Permission System Works

See `PERMISSION_SYSTEM_GUIDE.md` for complete documentation.

### Quick Summary
- Super admin (isak@gmail.com) has full access
- Regular admins can access all pages
- Permissions control buttons within pages, not page access
- Set permissions via Examiners page → Permissions button

## Verification

Console should show:
```
=== useSectionPermissions Debug ===
User email: isak@gmail.com
Is Super Admin: true
```

If not, clear browser cache and restart dev server.

## Common Issues

**"Failed to fetch examiners"** → Run `git pull origin main && bun install`

**Buttons still visible** → Clear browser cache, test in incognito

**No Permissions button** → Login as isak@gmail.com

## Documentation

- `PERMISSION_SYSTEM_GUIDE.md` - Complete permission system guide
- `DEPLOYMENT_READY.md` - Deployment instructions
- `FIREBASE_SETUP.md` - Firebase configuration
- `API_KEY_SETUP.md` - API key setup
