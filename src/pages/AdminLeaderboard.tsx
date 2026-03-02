import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  RefreshCw, 
  Calculator, 
  Trash2, 
  Activity, 
  Database,
  TrendingUp,
  Users,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock
} from "lucide-react";
import {
  adminRefreshLeaderboardCache,
  adminRecalculateRankings,
  adminResetLeaderboard,
  adminGetLeaderboardStatus
} from "@/lib/firebase-leaderboard";
import { getDepartments } from "@/lib/departments";
import { Department } from "@/integrations/firebase/types";
import { useSectionPermissions } from "@/hooks/useSectionPermissions";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { isSuperAdmin } from "@/lib/firebase-admin";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface LeaderboardStatus {
  totalDepartments: number;
  totalStudents: number;
  totalExamAttempts: number;
  cache: {
    total: number;
    valid: number;
    expired: number;
    totalCachedStudents: number;
  };
  cacheDetails: Array<{
    departmentId: string;
    totalStudents: number;
    lastUpdated: any;
    expiresAt: any;
    isExpired: boolean;
  }>;
}

const AdminLeaderboard = () => {
  const { toast } = useToast();
  const { role, user } = useAuth();
  const navigate = useNavigate();
  const { canView, canEdit, canDelete } = useSectionPermissions();
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [status, setStatus] = useState<LeaderboardStatus | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [recalculateDialogOpen, setRecalculateDialogOpen] = useState(false);

  const isSuperAdminUser = user?.email ? isSuperAdmin(user.email) : false;

  useEffect(() => {
    // Only allow admin
    if (role !== "admin") {
      navigate("/dashboard");
      return;
    }
    
    // All admins can view leaderboard admin page (permissions control buttons within the page)
    loadStatus();
    loadDepartments();
  }, [role, navigate]);

  const loadStatus = async () => {
    try {
      setStatusLoading(true);
      const result = await adminGetLeaderboardStatus();
      if (result.success) {
        setStatus(result.status);
      }
    } catch (error) {
      console.error("Error loading leaderboard status:", error);
      toast({
        title: "Error",
        description: "Failed to load leaderboard status",
        variant: "destructive",
      });
    } finally {
      setStatusLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const data = await getDepartments();
      setDepartments(data);
    } catch (error) {
      console.error("Error loading departments:", error);
    }
  };

  const handleRefreshCache = async (departmentId?: string) => {
    try {
      setLoading(true);
      const result = await adminRefreshLeaderboardCache(departmentId);
      
      toast({
        title: "Success",
        description: result.message,
      });

      // Reload status
      await loadStatus();
    } catch (error) {
      console.error("Error refreshing cache:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to refresh cache",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculateRankings = async () => {
    try {
      setLoading(true);
      setRecalculateDialogOpen(false);
      
      const result = await adminRecalculateRankings();
      
      toast({
        title: "Success",
        description: result.message,
      });

      // Reload status
      await loadStatus();
    } catch (error) {
      console.error("Error recalculating rankings:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to recalculate rankings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetLeaderboard = async () => {
    if (!selectedDepartment) {
      toast({
        title: "Error",
        description: "Please select a department",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      setResetDialogOpen(false);
      
      const result = await adminResetLeaderboard(selectedDepartment);
      
      toast({
        title: "Success",
        description: result.message,
      });

      // Clear selection and reload status
      setSelectedDepartment("");
      await loadStatus();
    } catch (error) {
      console.error("Error resetting leaderboard:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reset leaderboard",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "N/A";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return "Invalid date";
    }
  };

  const getDepartmentName = (departmentId: string) => {
    const dept = departments.find(d => d.id === departmentId);
    return dept?.name || departmentId;
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Leaderboard Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage leaderboard cache, rankings, and system maintenance
            </p>
          </div>
          <Button
            onClick={loadStatus}
            disabled={statusLoading}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${statusLoading ? 'animate-spin' : ''}`} />
            Refresh Status
          </Button>
        </div>

        {/* System Status Overview */}
        {status && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Departments</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{status.totalDepartments}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{status.totalStudents}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Exam Attempts</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{status.totalExamAttempts}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cache Status</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {status.cache.valid}/{status.cache.total}
                </div>
                <p className="text-xs text-muted-foreground">
                  Valid caches
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Management Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Management Actions</CardTitle>
            <CardDescription>
              Perform maintenance operations on the leaderboard system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Refresh Cache
                </h3>
                <p className="text-sm text-muted-foreground">
                  Manually refresh leaderboard cache for all departments or a specific department
                </p>
                {canEdit('leaderboard') && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleRefreshCache()}
                      disabled={loading}
                      className="flex-1"
                    >
                      {loading ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Refresh All
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Recalculate Rankings
                </h3>
                <p className="text-sm text-muted-foreground">
                  Force complete recalculation of all rankings across all departments
                </p>
                {canEdit('leaderboard') && (
                  <Button
                    onClick={() => setRecalculateDialogOpen(true)}
                    disabled={loading}
                    variant="secondary"
                    className="w-full"
                  >
                    <Calculator className="h-4 w-4 mr-2" />
                    Recalculate All
                  </Button>
                )}
              </div>
            </div>

            {canDelete('leaderboard') && (
              <div className="space-y-2 pt-4 border-t">
                <h3 className="font-semibold flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Reset Department Leaderboard
                </h3>
              <p className="text-sm text-muted-foreground">
                Clear cache for a specific department (use for maintenance)
              </p>
              <div className="flex gap-2">
                <Select
                  value={selectedDepartment}
                  onValueChange={setSelectedDepartment}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => setResetDialogOpen(true)}
                  disabled={loading || !selectedDepartment}
                  variant="destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cache Details */}
        {status && status.cacheDetails.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Cache Details by Department</CardTitle>
              <CardDescription>
                View cache status for each department
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {status.cacheDetails.map((cache) => (
                  <div
                    key={cache.departmentId}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">
                          {getDepartmentName(cache.departmentId)}
                        </h4>
                        <Badge variant={cache.isExpired ? "destructive" : "default"}>
                          {cache.isExpired ? (
                            <>
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Expired
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Valid
                            </>
                          )}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Users className="h-3 w-3" />
                          {cache.totalStudents} students
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          Updated: {formatTimestamp(cache.lastUpdated)}
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-3 w-3" />
                          Expires: {formatTimestamp(cache.expiresAt)}
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleRefreshCache(cache.departmentId)}
                      disabled={loading}
                      variant="outline"
                      size="sm"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Refresh
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Confirmation Dialogs */}
        <AlertDialog open={recalculateDialogOpen} onOpenChange={setRecalculateDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Recalculate All Rankings?</AlertDialogTitle>
              <AlertDialogDescription>
                This will force a complete recalculation of all leaderboard rankings
                across all departments. This operation may take some time.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleRecalculateRankings}>
                Recalculate
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset Department Leaderboard?</AlertDialogTitle>
              <AlertDialogDescription>
                This will clear the cache for {getDepartmentName(selectedDepartment)}.
                The leaderboard will be recalculated on the next request.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleResetLeaderboard} className="bg-destructive text-destructive-foreground">
                Reset
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminLeaderboard;
