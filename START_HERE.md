# ExamPro - Start Here

## Quick Links

- **Permission System Not Working?** → See `DO_THIS_NOW.md`
- **Complete Permission Guide** → See `PERMISSION_SYSTEM_GUIDE.md`
- **Deployment** → See `DEPLOYMENT_READY.md`
- **Firebase Setup** → See `FIREBASE_SETUP.md`
- **API Keys** → See `API_KEY_SETUP.md`

## Common Issues

### Permission System Not Working

**Quick Fix:**
1. Stop all dev servers
2. Run: `rm -rf node_modules/.vite dist dev-dist .vite && bun pm cache rm`
3. Clear browser cache (F12 → Application → Clear storage)
4. Run: `bun run dev`
5. Test in incognito mode

See `DO_THIS_NOW.md` for detailed steps.

### Development

```bash
# Install dependencies
bun install

# Start dev server
bun run dev

# Build for production
bun run build
```

### Testing Permission System

1. Login as isak@gmail.com (super admin)
2. Go to Examiners page
3. Click "Permissions" on any examiner
4. Set permissions
5. Logout and login as that examiner
6. Verify buttons are hidden based on permissions

## Documentation

### Essential
- `DO_THIS_NOW.md` - Quick fix for permission issues
- `PERMISSION_SYSTEM_GUIDE.md` - Complete permission system guide
- `READ_THIS_FIRST.md` - Overview and quick start

### Setup & Deployment
- `FIREBASE_SETUP.md` - Firebase configuration
- `DEPLOYMENT_READY.md` - Deployment instructions
- `API_KEY_SETUP.md` - API key configuration
- `FIREBASE_FUNCTIONS_DEPLOYMENT_GUIDE.md` - Cloud Functions setup

### Features
- `SIMPLE_LEADERBOARD_GUIDE.md` - Leaderboard system
- `SUPER_ADMIN_GUIDE.md` - Super admin features
- `RBAC_PERMISSIONS_SPEC.md` - Permission specifications
- `AI_MCQ_GENERATION_GUIDE.md` - AI question generation
- `OFFLINE_SUPPORT.md` - PWA offline support

## Project Structure

```
src/
├── components/       # React components
├── pages/           # Page components
├── hooks/           # Custom hooks
├── lib/             # Utilities and Firebase
├── contexts/        # React contexts
└── integrations/    # Firebase integration

functions/           # Firebase Cloud Functions
public/             # Static assets
```

## Key Features

- Role-based access control (RBAC)
- Super admin permission management
- Exam creation and management
- Student management
- Leaderboard system
- Analytics dashboard
- Offline support (PWA)
- AI-powered MCQ generation

## Support

If you encounter issues:
1. Check the relevant guide in documentation
2. Clear browser cache and restart dev server
3. Verify Firebase configuration
4. Check browser console for errors
