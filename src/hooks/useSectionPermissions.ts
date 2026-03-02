import { useAuth } from '@/contexts/AuthContext';
import { isSuperAdmin } from '@/lib/firebase-admin';

export type SectionName = 
  | 'dashboard' 
  | 'manageExams' 
  | 'allResults' 
  | 'students' 
  | 'analytics' 
  | 'leaderboard' 
  | 'examiners' 
  | 'departments';

export type PermissionType = 'view' | 'edit' | 'delete';

interface SectionPermission {
  view: boolean;
  edit: boolean;
  delete: boolean;
}

const DEFAULT_PERMISSIONS: Record<SectionName, SectionPermission> = {
  // Deny-by-default for edits/deletes; allow viewing pages
  dashboard:   { view: true, edit: false, delete: false },
  manageExams: { view: true, edit: false, delete: false },
  allResults:  { view: true, edit: false, delete: false },
  students:    { view: true, edit: false, delete: false },
  analytics:   { view: true, edit: false, delete: false },
  leaderboard: { view: true, edit: false, delete: false },
  examiners:   { view: true, edit: false, delete: false },
  departments: { view: true, edit: false, delete: false },
};

export function useSectionPermissions() {
  const { profile, user } = useAuth();

  // Check if user is super admin
  const isSuper = user?.email ? isSuperAdmin(user.email) : false;

  // Get section permissions from profile
  const sectionPermissions = (profile as any)?.sectionPermissions || DEFAULT_PERMISSIONS;

  // Debug logging
  console.log('=== useSectionPermissions Debug ===');
  console.log('User email:', user?.email);
  console.log('Is Super Admin:', isSuper);
  console.log('Profile sectionPermissions:', (profile as any)?.sectionPermissions);
  console.log('Using permissions:', sectionPermissions);
  console.log('===================================');

  /**
   * Check if user has permission for a specific section and action
   */
  const hasPermission = (section: SectionName, type: PermissionType): boolean => {
    // Super admin has all permissions
    if (isSuper) return true;

    // Get permissions for this section
    const permissions = sectionPermissions[section] || DEFAULT_PERMISSIONS[section];
    
    // Debug log
    console.log(`Permission check: ${section}.${type} =`, permissions[type], 'for user:', profile?.email);
    
    return permissions[type] === true;
  };

  /**
   * Check if user can view a section
   */
  const canView = (section: SectionName): boolean => {
    return hasPermission(section, 'view');
  };

  /**
   * Check if user can edit in a section
   */
  const canEdit = (section: SectionName): boolean => {
    return hasPermission(section, 'edit');
  };

  /**
   * Check if user can delete in a section
   */
  const canDelete = (section: SectionName): boolean => {
    return hasPermission(section, 'delete');
  };

  /**
   * Get all permissions for a section
   */
  const getSectionPermissions = (section: SectionName): SectionPermission => {
    if (isSuper) {
      return { view: true, edit: true, delete: true };
    }
    return sectionPermissions[section] || DEFAULT_PERMISSIONS[section];
  };

  return {
    hasPermission,
    canView,
    canEdit,
    canDelete,
    getSectionPermissions,
    isSuperAdmin: isSuper,
  };
}
