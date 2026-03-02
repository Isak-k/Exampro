// Permission types for Role-Based Access Control (RBAC)

export interface UserPermissions {
  // Dashboard & Navigation
  viewDashboard: boolean;
  viewAnalytics: boolean;
  
  // Exam Management
  createExams: boolean;
  editOwnExams: boolean;
  editAllExams: boolean;
  deleteOwnExams: boolean;
  deleteAllExams: boolean;
  publishExams: boolean;
  viewAllExams: boolean;
  
  // Student Management
  viewStudents: boolean;
  addStudents: boolean;
  editStudents: boolean;
  deleteStudents: boolean;
  manageDepartments: boolean;
  
  // Results & Grading
  viewAllResults: boolean;
  viewOwnResults: boolean;
  exportResults: boolean;
  
  // Leaderboard
  viewLeaderboard: boolean;
  manageLeaderboard: boolean;
  
  // Examiner Management (Super Admin only)
  viewExaminers: boolean;
  addExaminers: boolean;
  editExaminerPermissions: boolean;
  deleteExaminers: boolean;
  enableDisableExaminers: boolean;
}

export type PermissionKey = keyof UserPermissions;

export const DEFAULT_PERMISSIONS: UserPermissions = {
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
  viewExaminers: false,
  addExaminers: false,
  editExaminerPermissions: false,
  deleteExaminers: false,
  enableDisableExaminers: false,
};

export const FULL_ADMIN_PERMISSIONS: UserPermissions = {
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
  viewExaminers: false, // Only super admin
  addExaminers: false,
  editExaminerPermissions: false,
  deleteExaminers: false,
  enableDisableExaminers: false,
};

export const SUPER_ADMIN_PERMISSIONS: UserPermissions = {
  ...FULL_ADMIN_PERMISSIONS,
  viewExaminers: true,
  addExaminers: true,
  editExaminerPermissions: true,
  deleteExaminers: true,
  enableDisableExaminers: true,
};

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  viewDashboard: 'View Dashboard',
  viewAnalytics: 'View Analytics',
  createExams: 'Create Exams',
  editOwnExams: 'Edit Own Exams',
  editAllExams: 'Edit All Exams',
  deleteOwnExams: 'Delete Own Exams',
  deleteAllExams: 'Delete All Exams',
  publishExams: 'Publish/Unpublish Exams',
  viewAllExams: 'View All Exams',
  viewStudents: 'View Students',
  addStudents: 'Add Students',
  editStudents: 'Edit Students',
  deleteStudents: 'Delete Students',
  manageDepartments: 'Manage Departments',
  viewAllResults: 'View All Results',
  viewOwnResults: 'View Own Results',
  exportResults: 'Export Results',
  viewLeaderboard: 'View Leaderboard',
  manageLeaderboard: 'Manage Leaderboard',
  viewExaminers: 'View Examiners',
  addExaminers: 'Add Examiners',
  editExaminerPermissions: 'Edit Examiner Permissions',
  deleteExaminers: 'Delete Examiners',
  enableDisableExaminers: 'Enable/Disable Examiners',
};

export const PERMISSION_GROUPS = {
  'Dashboard & Navigation': ['viewDashboard', 'viewAnalytics'] as PermissionKey[],
  'Exam Management': [
    'createExams',
    'editOwnExams',
    'editAllExams',
    'deleteOwnExams',
    'deleteAllExams',
    'publishExams',
    'viewAllExams',
  ] as PermissionKey[],
  'Student Management': [
    'viewStudents',
    'addStudents',
    'editStudents',
    'deleteStudents',
    'manageDepartments',
  ] as PermissionKey[],
  'Results & Grading': [
    'viewAllResults',
    'viewOwnResults',
    'exportResults',
  ] as PermissionKey[],
  'Leaderboard': ['viewLeaderboard', 'manageLeaderboard'] as PermissionKey[],
  'Examiner Management': [
    'viewExaminers',
    'addExaminers',
    'editExaminerPermissions',
    'deleteExaminers',
    'enableDisableExaminers',
  ] as PermissionKey[],
};

// Super Admin email - hardcoded for security
export const SUPER_ADMIN_EMAIL = 'isak@gmail.com';
