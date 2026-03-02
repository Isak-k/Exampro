import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSectionPermissions } from "@/hooks/useSectionPermissions";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle, XCircle, Shield } from "lucide-react";

export default function PermissionTest() {
  const { profile } = useAuth();
  const { 
    canView, 
    canEdit, 
    canDelete, 
    getSectionPermissions,
    isSuperAdmin 
  } = useSectionPermissions();

  const sections = [
    'dashboard',
    'manageExams',
    'allResults',
    'students',
    'analytics',
    'leaderboard',
    'examiners',
    'departments',
  ] as const;

  const sectionLabels = {
    dashboard: 'Dashboard',
    manageExams: 'Manage Exams',
    allResults: 'All Results',
    students: 'Students',
    analytics: 'Analytics',
    leaderboard: 'Leaderboard Admin',
    examiners: 'Examiners',
    departments: 'Departments',
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Permission Test Page</h1>
            <p className="text-muted-foreground">
              Testing permission system for {profile?.email}
            </p>
          </div>
          {isSuperAdmin && (
            <Badge className="bg-yellow-500">
              <Shield className="h-4 w-4 mr-2" />
              Super Admin
            </Badge>
          )}
        </div>

        {/* Raw Permissions Data */}
        <Card>
          <CardHeader>
            <CardTitle>Raw Permissions Data from Firestore</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-auto text-xs">
              {JSON.stringify((profile as any)?.sectionPermissions || 'No permissions found', null, 2)}
            </pre>
          </CardContent>
        </Card>

        {/* Permission Matrix */}
        <Card>
          <CardHeader>
            <CardTitle>Permission Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Section</th>
                    <th className="text-center p-3 font-semibold">View</th>
                    <th className="text-center p-3 font-semibold">Edit</th>
                    <th className="text-center p-3 font-semibold">Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {sections.map((section) => {
                    const perms = getSectionPermissions(section);
                    return (
                      <tr key={section} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900">
                        <td className="p-3 font-medium">{sectionLabels[section]}</td>
                        <td className="p-3 text-center">
                          {perms.view ? (
                            <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600 mx-auto" />
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {perms.edit ? (
                            <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600 mx-auto" />
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {perms.delete ? (
                            <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600 mx-auto" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Function Test Results */}
        <Card>
          <CardHeader>
            <CardTitle>Hook Function Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Manage Exams:</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">canView:</span>
                    {canView('manageExams') ? (
                      <Badge className="bg-green-600">True</Badge>
                    ) : (
                      <Badge className="bg-red-600">False</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">canEdit:</span>
                    {canEdit('manageExams') ? (
                      <Badge className="bg-green-600">True</Badge>
                    ) : (
                      <Badge className="bg-red-600">False</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">canDelete:</span>
                    {canDelete('manageExams') ? (
                      <Badge className="bg-green-600">True</Badge>
                    ) : (
                      <Badge className="bg-red-600">False</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Students:</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">canView:</span>
                    {canView('students') ? (
                      <Badge className="bg-green-600">True</Badge>
                    ) : (
                      <Badge className="bg-red-600">False</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">canEdit:</span>
                    {canEdit('students') ? (
                      <Badge className="bg-green-600">True</Badge>
                    ) : (
                      <Badge className="bg-red-600">False</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">canDelete:</span>
                    {canDelete('students') ? (
                      <Badge className="bg-green-600">True</Badge>
                    ) : (
                      <Badge className="bg-red-600">False</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-blue-50 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle>Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>1. As Super Admin, go to Examiners page and modify permissions for an examiner</p>
            <p>2. Logout and login as that examiner</p>
            <p>3. Visit this page to see if permissions are loaded correctly</p>
            <p>4. Check the "Raw Permissions Data" section to see what's in Firestore</p>
            <p>5. Check the "Permission Matrix" to see computed permissions</p>
            <p>6. Go to actual pages (Manage Exams, Students) to verify buttons are hidden/shown correctly</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
