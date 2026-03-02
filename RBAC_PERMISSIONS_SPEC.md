# Role-Based Access Control (RBAC) System Specification

## Overview
Create a comprehensive permission system where Super Admin (isak@gmail.com) can control what each examiner/admin can do in the system.

## User Roles

### 1. Super Admin (isak@gmail.com)
- Full access to everything
- Can manage all examiners/admins
- Can grant/revoke permissions
- Cannot be restricted

### 2. Admin/Examiner
- Permissions controlled by Super Admin
- Can have different permission sets
- Access restricted based on granted permissions

### 3. Student
- No admin access
- Can only take exams and view results

## Permissions to Control

### Dashboard & Navigation
- ✅ **View Dashboard** - Can see dashboard page
- ✅ **View Analytics** - Can see analytics page

### Exam Management
- ✅ **Create Exams** - Can create new exams
- ✅ **Edit Own Exams** - Can edit exams they created
- ✅ **Edit All Exams** - Can edit any exam
- ✅ **Delete Own Exams** - Can delete exams they created
- ✅ **Delete All Exams** - Can delete any exam
- ✅ **Publish Exams** - Can publish/unpublish exams
- ✅ **View All Exams** - Can see all exams (Manage Exams page)

### Student Management
- ✅ **View Students** - Can see students list
- ✅ **Add Students** - Can create new students
- ✅ **Edit Students** - Can modify student details
- ✅ **Delete Students** - Can remove students
- ✅ **Manage Departments** - Can assign students to departments

### Results & Grading
- ✅ **View All Results** - Can see all exam results
- ✅ **View Own Results** - Can see results for their exams only
- ✅ **Export Results** - Can download/export results

### Leaderboard
- ✅ **View Leaderboard** - Can access leaderboard
- ✅ **Manage Leaderboard** - Can refresh/reset leaderboard cache

### Examiner Management (Super Admin Only)
- ✅ **View Examiners** - Can see list of examiners
- ✅ **Add Examiners** - Can create new examiner accounts
- ✅ **Edit Examiner Permissions** - Can modify permissions
- ✅ **Delete Examiners** - Can remove examiner accounts
- ✅ **Enable/Disable Examiners** - Can activate/deactivate accounts

## Database Structure

### User Document (Firestore)
```typescript
{
  uid: string;
  email: string;
  fullName: string;
  role: 'superadmin' | 'admin' | 'student';
  departmentId?: string;
  isActive: boolean;
  permissions?: {
    // Dashboard
    viewDashboard: boolean;
    viewAnalytics: boolean;
    
    // Exams
    createExams: boolean;
    editOwnExams: boolean;
    editAllExams: boolean;
    deleteOwnExams: boolean;
    deleteAllExams: boolean;
    publishExams: boolean;
    viewAllExams: boolean;
    
    // Students
    viewStudents: boolean;
    addStudents: boolean;
    editStudents: boolean;
    deleteStudents: boolean;
    manageDepartments: boolean;
    
    // Results
    viewAllResults: boolean;
    viewOwnResults: boolean;
    exportResults: boolean;
    
    // Leaderboard
    viewLeaderboard: boolean;
    manageLeaderboard: boolean;
    
    // Examiners (Super Admin only)
    viewExaminers: boolean;
    addExaminers: boolean;
    editExaminerPermissions: boolean;
    deleteExaminers: boolean;
    enableDisableExaminers: boolean;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## UI Components

### 1. Super Admin Page (New)
**Route:** `/dashboard/super-admin`
**Access:** Only isak@gmail.com

**Features:**
- List all examiners/admins
- Search and filter examiners
- View examiner details
- Edit permissions for each examiner
- Enable/Disable examiner accounts
- Delete examiner accounts
- Create new examiner accounts

**Layout:**
```
┌─────────────────────────────────────────┐
│  Super Admin - Examiner Management      │
├─────────────────────────────────────────┤
│  [Search] [Filter] [+ Add Examiner]     │
├─────────────────────────────────────────┤
│  Examiner List:                          │
│  ┌───────────────────────────────────┐  │
│  │ Name: John Doe                     │  │
│  │ Email: john@example.com            │  │
│  │ Status: Active                     │  │
│  │ Department: IT                     │  │
│  │ [Edit Permissions] [Disable] [Del]│  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ Name: Jane Smith                   │  │
│  │ Email: jane@example.com            │  │
│  │ Status: Disabled                   │  │
│  │ Department: CS                     │  │
│  │ [Edit Permissions] [Enable] [Del] │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### 2. Edit Permissions Dialog
**Triggered by:** Click "Edit Permissions" button

**Layout:**
```
┌─────────────────────────────────────────┐
│  Edit Permissions - John Doe            │
├─────────────────────────────────────────┤
│  Dashboard & Navigation                  │
│  ☑ View Dashboard                        │
│  ☑ View Analytics                        │
│                                          │
│  Exam Management                         │
│  ☑ Create Exams                          │
│  ☑ Edit Own Exams                        │
│  ☐ Edit All Exams                        │
│  ☑ Delete Own Exams                      │
│  ☐ Delete All Exams                      │
│  ☑ Publish Exams                         │
│  ☑ View All Exams                        │
│                                          │
│  Student Management                      │
│  ☑ View Students                         │
│  ☐ Add Students                          │
│  ☐ Edit Students                         │
│  ☐ Delete Students                       │
│  ☐ Manage Departments                    │
│                                          │
│  Results & Grading                       │
│  ☑ View Own Results                      │
│  ☐ View All Results                      │
│  ☑ Export Results                        │
│                                          │
│  Leaderboard                             │
│  ☑ View Leaderboard                      │
│  ☐ Manage Leaderboard                    │
│                                          │
│  [Cancel] [Save Permissions]             │
└─────────────────────────────────────────┘
```

### 3. Sidebar Navigation (Modified)
**Behavior:** Show/hide menu items based on permissions

```typescript
// Example: Only show if user has permission
{hasPermission('viewDashboard') && <MenuItem>Dashboard</MenuItem>}
{hasPermission('viewAllExams') && <MenuItem>Manage Exams</MenuItem>}
{hasPermission('viewStudents') && <MenuItem>Students</MenuItem>}
{hasPermission('viewAnalytics') && <MenuItem>Analytics</MenuItem>}
{hasPermission('viewLeaderboard') && <MenuItem>Leaderboard</MenuItem>}
{isSuperAdmin() && <MenuItem>Super Admin</MenuItem>}
```

## Implementation Steps

### Phase 1: Database & Types
1. Create permissions type definitions
2. Add permissions field to user documents
3. Set isak@gmail.com as superadmin in Firestore
4. Create default permission sets

### Phase 2: Permission System
1. Create permission checking utilities
2. Create permission context/hooks
3. Add permission checks to routes
4. Add permission checks to components

### Phase 3: Super Admin UI
1. Create Super Admin page
2. Create examiner list component
3. Create edit permissions dialog
4. Create add examiner form
5. Add enable/disable functionality

### Phase 4: Enforce Permissions
1. Update sidebar to respect permissions
2. Add permission checks to all pages
3. Add permission checks to API calls
4. Update Firestore rules

### Phase 5: Testing
1. Test as Super Admin
2. Test as restricted admin
3. Test permission changes
4. Test edge cases

## Default Permission Sets

### Full Access Admin
```typescript
{
  viewDashboard: true,
  viewAnalytics: true,
  createExams: true,
  editOwnExams: true,
  editAllExams: true,
  deleteOwnExams: true,
  deleteAllExams: true,
  publishExams: true,
  viewAllExams: true,
  viewStudents: true,
  addStudents: true,
  editStudents: true,
  deleteStudents: true,
  manageDepartments: true,
  viewAllResults: true,
  viewOwnResults: true,
  exportResults: true,
  viewLeaderboard: true,
  manageLeaderboard: true,
  // Examiner management: false (Super Admin only)
}
```

### Limited Admin (Exam Creator Only)
```typescript
{
  viewDashboard: true,
  viewAnalytics: false,
  createExams: true,
  editOwnExams: true,
  editAllExams: false,
  deleteOwnExams: true,
  deleteAllExams: false,
  publishExams: true,
  viewAllExams: true,
  viewStudents: true,
  addStudents: false,
  editStudents: false,
  deleteStudents: false,
  manageDepartments: false,
  viewAllResults: false,
  viewOwnResults: true,
  exportResults: true,
  viewLeaderboard: true,
  manageLeaderboard: false,
}
```

### Read-Only Admin (Viewer)
```typescript
{
  viewDashboard: true,
  viewAnalytics: true,
  createExams: false,
  editOwnExams: false,
  editAllExams: false,
  deleteOwnExams: false,
  deleteAllExams: false,
  publishExams: false,
  viewAllExams: true,
  viewStudents: true,
  addStudents: false,
  editStudents: false,
  deleteStudents: false,
  manageDepartments: false,
  viewAllResults: true,
  viewOwnResults: true,
  exportResults: true,
  viewLeaderboard: true,
  manageLeaderboard: false,
}
```

## Security Considerations

1. **Firestore Rules:** Update to check permissions
2. **Client-Side:** Hide UI elements user can't access
3. **Server-Side:** Validate permissions in Firebase Functions
4. **Super Admin Protection:** isak@gmail.com cannot be restricted
5. **Audit Log:** Track permission changes

## Estimated Implementation Time

- Phase 1: 1 hour
- Phase 2: 2 hours
- Phase 3: 3 hours
- Phase 4: 2 hours
- Phase 5: 1 hour

**Total: ~9 hours of development**

## Questions Before Implementation

1. Should examiners be able to see other examiners?
2. Should there be permission templates/presets?
3. Should permission changes be logged?
4. Should examiners get email notifications when permissions change?
5. Should there be a "Copy permissions from another examiner" feature?

---

**Ready to implement?** This is a comprehensive system. Would you like me to:
1. Start implementing now (will take multiple steps)
2. Simplify the spec first
3. Implement in phases (start with Phase 1)
