import { UserPermissions, PermissionKey } from '@/types/permissions';

/**
 * Check if a user has a specific permission
 */
export function checkPermission(
  permissions: UserPermissions | undefined,
  permission: PermissionKey
): boolean {
  if (!permissions) return false;
  return permissions[permission] === true;
}

/**
 * Check if a user has any of the specified permissions
 */
export function checkAnyPermission(
  permissions: UserPermissions | undefined,
  permissionKeys: PermissionKey[]
): boolean {
  if (!permissions) return false;
  return permissionKeys.some(key => permissions[key] === true);
}

/**
 * Check if a user has all of the specified permissions
 */
export function checkAllPermissions(
  permissions: UserPermissions | undefined,
  permissionKeys: PermissionKey[]
): boolean {
  if (!permissions) return false;
  return permissionKeys.every(key => permissions[key] === true);
}
