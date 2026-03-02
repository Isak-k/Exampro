import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { usePermissions } from "@/contexts/PermissionsContext";
import type { PermissionKey } from "@/types/permissions";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ("admin" | "student")[];
  requireAnyPermissions?: PermissionKey[];
  requireAllPermissions?: PermissionKey[];
  requireSuperAdmin?: boolean;
}

export function ProtectedRoute({ children, allowedRoles, requireAnyPermissions, requireAllPermissions, requireSuperAdmin }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();
  const { hasAnyPermission, hasAllPermissions, isSuperAdmin } = usePermissions();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/auth", { replace: true });
        return;
      }

      if (allowedRoles && role && !allowedRoles.includes(role)) {
        navigate("/dashboard", { replace: true });
        return;
      }

      // Super admin gate
      if (requireSuperAdmin && !isSuperAdmin) {
        navigate("/dashboard", { replace: true });
        return;
      }

      // Permission gates (admins only unless super admin)
      if ((requireAnyPermissions && requireAnyPermissions.length > 0) || (requireAllPermissions && requireAllPermissions.length > 0)) {
        // Students never pass permission checks
        if (role !== "admin") {
          navigate("/dashboard", { replace: true });
          return;
        }
        // Super admin bypass
        if (!isSuperAdmin) {
          if (requireAllPermissions && !hasAllPermissions(requireAllPermissions)) {
            navigate("/dashboard", { replace: true });
            return;
          }
          if (requireAnyPermissions && !hasAnyPermission(requireAnyPermissions)) {
            navigate("/dashboard", { replace: true });
            return;
          }
        }
      }
    }
  }, [user, role, loading, allowedRoles, requireAnyPermissions, requireAllPermissions, requireSuperAdmin, navigate, hasAnyPermission, hasAllPermissions, isSuperAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return null;
  }

  if (requireSuperAdmin && !isSuperAdmin) {
    return null;
  }

  // Permission checks for render path as well
  if ((requireAnyPermissions && requireAnyPermissions.length > 0) || (requireAllPermissions && requireAllPermissions.length > 0)) {
    if (role !== "admin") return null;
    if (!isSuperAdmin) {
      if (requireAllPermissions && !hasAllPermissions(requireAllPermissions)) return null;
      if (requireAnyPermissions && !hasAnyPermission(requireAnyPermissions)) return null;
    }
  }

  return <>{children}</>;
}
