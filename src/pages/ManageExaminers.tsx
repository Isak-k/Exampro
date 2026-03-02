import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Pencil, ShieldAlert, ShieldCheck, Ban, CheckCircle, Settings } from "lucide-react";
import { getExaminers, createExaminerAccount, deleteExaminer, updateExaminer, toggleExaminerStatus, isSuperAdmin } from "@/lib/firebase-admin";
import { UserProfile } from "@/integrations/firebase/types";
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';
import { useSectionPermissions } from "@/hooks/useSectionPermissions";

export default function ManageExaminers() {
  const { role, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canView, canEdit, canDelete } = useSectionPermissions();
  const [examiners, setExaminers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editingExaminer, setEditingExaminer] = useState<UserProfile | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [updating, setUpdating] = useState(false);

  // Delete confirmation
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingExaminer, setDeletingExaminer] = useState<UserProfile | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Permissions management
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [managingExaminer, setManagingExaminer] = useState<UserProfile | null>(null);
  const [permissions, setPermissions] = useState({
    dashboard: { view: true, edit: false, delete: false },
    manageExams: { view: true, edit: true, delete: true },
    allResults: { view: true, edit: false, delete: false },
    students: { view: true, edit: true, delete: true },
    analytics: { view: true, edit: false, delete: false },
    leaderboard: { view: true, edit: true, delete: false },
    examiners: { view: false, edit: false, delete: false },
    departments: { view: true, edit: true, delete: true },
  });
  const [savingPermissions, setSavingPermissions] = useState(false);

  // Form state
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");

  const isSuperAdminUser = user?.email ? isSuperAdmin(user.email) : false;

  useEffect(() => {
    // Only allow admin
    if (role !== "admin") {
      navigate("/dashboard");
      return;
    }
    
    // All admins can view examiners page (permissions control buttons within the page)
    fetchExaminers();
  }, [role, navigate]);

  const fetchExaminers = async () => {
    try {
      const data = await getExaminers();
      setExaminers(data);
    } catch (error) {
      console.error("Error fetching examiners:", error);
      toast({
        title: "Error",
        description: "Failed to fetch examiners",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createExaminerAccount(newEmail, newPassword, newName);
      toast({
        title: "Success",
        description: "Examiner account created successfully",
      });
      setCreateOpen(false);
      setNewEmail("");
      setNewPassword("");
      setNewName("");
      fetchExaminers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleEditClick = (examiner: UserProfile) => {
    setEditingExaminer(examiner);
    setEditName(examiner.fullName);
    setEditEmail(examiner.email);
    setEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExaminer) return;
    setUpdating(true);
    try {
      await updateExaminer(editingExaminer.userId, { 
        fullName: editName,
        email: editEmail 
      });
      toast({
        title: "Success",
        description: "Examiner updated successfully",
      });
      setEditOpen(false);
      fetchExaminers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update examiner",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleStatus = async (examiner: UserProfile) => {
    const newStatus = !examiner.disabled;
    try {
      await toggleExaminerStatus(examiner.userId, newStatus);
      toast({
        title: "Success",
        description: `Examiner ${newStatus ? 'disabled' : 'enabled'} successfully`,
      });
      fetchExaminers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update examiner status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (examiner: UserProfile) => {
    setDeletingExaminer(examiner);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingExaminer) return;
    setDeleting(true);
    try {
      await deleteExaminer(deletingExaminer.userId);
      toast({
        title: "Success",
        description: "Examiner deleted successfully",
      });
      setDeleteOpen(false);
      setDeletingExaminer(null);
      fetchExaminers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete examiner",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const canModifyExaminer = (examiner: UserProfile) => {
    // Super admin can modify anyone except themselves
    if (isSuperAdminUser) {
      return examiner.email !== user?.email;
    }
    // Regular admins cannot modify super admin or themselves
    return !isSuperAdmin(examiner.email) && examiner.email !== user?.email;
  };

  const handleManagePermissions = (examiner: UserProfile) => {
    setManagingExaminer(examiner);
    // Load existing permissions from examiner profile
    const existingPerms = (examiner as any).sectionPermissions || {
      dashboard: { view: true, edit: false, delete: false },
      manageExams: { view: true, edit: true, delete: true },
      allResults: { view: true, edit: false, delete: false },
      students: { view: true, edit: true, delete: true },
      analytics: { view: true, edit: false, delete: false },
      leaderboard: { view: true, edit: true, delete: false },
      examiners: { view: false, edit: false, delete: false },
      departments: { view: true, edit: true, delete: true },
    };
    setPermissions(existingPerms);
    setPermissionsOpen(true);
  };

  const handleSavePermissions = async () => {
    if (!managingExaminer) return;
    setSavingPermissions(true);
    try {
      const userRef = doc(db, 'users', managingExaminer.userId);
      await updateDoc(userRef, {
        sectionPermissions: permissions,
        updatedAt: Timestamp.now(),
      });
      toast({
        title: "Success",
        description: "Permissions updated successfully",
      });
      setPermissionsOpen(false);
      fetchExaminers();
    } catch (error) {
      console.error('Error updating permissions:', error);
      toast({
        title: "Error",
        description: "Failed to update permissions",
        variant: "destructive",
      });
    } finally {
      setSavingPermissions(false);
    }
  };

  const togglePermission = (section: string, type: 'view' | 'edit' | 'delete') => {
    setPermissions(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [type]: !prev[section as keyof typeof prev][type]
      }
    }));
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in p-4 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-cyan-500 to-teal-500 rounded-3xl p-4 sm:p-6 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold font-display mb-2">Manage Examiners</h1>
              <p className="text-cyan-50 opacity-90 text-sm sm:text-base">
                Create and manage examiner accounts
              </p>
              {isSuperAdminUser && (
                <Badge variant="outline" className="mt-3 bg-yellow-400/20 text-yellow-100 border-yellow-300/30 backdrop-blur-sm text-xs">
                  <ShieldAlert className="h-3 w-3 mr-1" />
                  Super Admin Access
                </Badge>
              )}
            </div>
            {canEdit('examiners') && (
              <Button 
                onClick={() => setCreateOpen(true)}
                className="bg-white text-cyan-600 hover:bg-cyan-50 shadow-md w-full sm:w-auto"
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Examiner
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-0 shadow-md bg-gradient-to-br from-cyan-50 to-white dark:from-cyan-950/20 dark:to-background">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Examiners</p>
                  <p className="text-3xl font-bold text-cyan-600">{examiners.length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-cyan-500/10 flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6 text-cyan-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Active</p>
                  <p className="text-3xl font-bold text-green-600">
                    {examiners.filter(e => !e.disabled).length}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-background">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Disabled</p>
                  <p className="text-3xl font-bold text-red-600">
                    {examiners.filter(e => e.disabled).length}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                  <Ban className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dialogs */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => setCreateOpen(true)}
                className="bg-white text-cyan-600 hover:bg-cyan-50 shadow-md"
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Examiner
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-cyan-900 dark:text-cyan-100">
                  Create Examiner Account
                </DialogTitle>
                <DialogDescription className="text-base">
                  Create a new examiner account with admin privileges
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                  <Input 
                    id="name" 
                    value={newName} 
                    onChange={(e) => setNewName(e.target.value)} 
                    placeholder="John Doe"
                    className="h-11 rounded-xl border-cyan-200 focus:border-cyan-400 focus:ring-cyan-400"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={newEmail} 
                    onChange={(e) => setNewEmail(e.target.value)} 
                    placeholder="examiner@example.com"
                    className="h-11 rounded-xl border-cyan-200 focus:border-cyan-400 focus:ring-cyan-400"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    minLength={6}
                    placeholder="••••••••"
                    className="h-11 rounded-xl border-cyan-200 focus:border-cyan-400 focus:ring-cyan-400"
                    required 
                  />
                  <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setCreateOpen(false)}
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={creating}
                    className="bg-cyan-500 hover:bg-cyan-600 rounded-xl"
                  >
                    {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-cyan-900 dark:text-cyan-100">
                Edit Examiner
              </DialogTitle>
              <DialogDescription className="text-base">
                Update examiner information
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-sm font-medium">Full Name</Label>
                <Input 
                  id="edit-name" 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)} 
                  className="h-11 rounded-xl border-cyan-200 focus:border-cyan-400 focus:ring-cyan-400"
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email" className="text-sm font-medium">Email</Label>
                <Input 
                  id="edit-email" 
                  type="email"
                  value={editEmail} 
                  onChange={(e) => setEditEmail(e.target.value)} 
                  className="h-11 rounded-xl border-cyan-200 focus:border-cyan-400 focus:ring-cyan-400"
                  required 
                />
                <p className="text-xs text-muted-foreground">
                  Note: Changing email here won't update Firebase Auth email
                </p>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updating}
                  className="bg-cyan-500 hover:bg-cyan-600 rounded-xl"
                >
                  {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Examiner
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-red-900 dark:text-red-100">
                Delete Examiner
              </DialogTitle>
              <DialogDescription className="text-base">
                Are you sure you want to delete this examiner? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {deletingExaminer && (
              <div className="py-4 px-4 bg-red-50 dark:bg-red-950/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-bold text-lg">
                    {deletingExaminer.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold">{deletingExaminer.fullName}</p>
                    <p className="text-sm text-muted-foreground">{deletingExaminer.email}</p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setDeleteOpen(false);
                  setDeletingExaminer(null);
                }}
                disabled={deleting}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                variant="destructive" 
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="rounded-xl bg-red-600 hover:bg-red-700"
              >
                {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete Examiner
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Manage Permissions Dialog - Only for Super Admin */}
        {isSuperAdminUser && (
          <Dialog open={permissionsOpen} onOpenChange={setPermissionsOpen}>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-cyan-900 dark:text-cyan-100">
                  Manage Permissions
                </DialogTitle>
                <DialogDescription className="text-base">
                  Control what {managingExaminer?.fullName} can do in each section
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {Object.entries({
                  dashboard: 'Dashboard',
                  manageExams: 'Manage Exams',
                  allResults: 'All Results',
                  students: 'Students',
                  analytics: 'Analytics',
                  leaderboard: 'Leaderboard Admin',
                  examiners: 'Examiners',
                  departments: 'Departments',
                }).map(([key, label]) => (
                  <div key={key} className="border rounded-xl p-4 bg-gray-50 dark:bg-gray-900/50">
                    <h3 className="font-semibold text-lg mb-3 text-cyan-900 dark:text-cyan-100">
                      {label}
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`${key}-view`}
                          checked={permissions[key as keyof typeof permissions].view}
                          onCheckedChange={() => togglePermission(key, 'view')}
                        />
                        <Label
                          htmlFor={`${key}-view`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          View
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`${key}-edit`}
                          checked={permissions[key as keyof typeof permissions].edit}
                          onCheckedChange={() => togglePermission(key, 'edit')}
                        />
                        <Label
                          htmlFor={`${key}-edit`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          Edit/Update
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`${key}-delete`}
                          checked={permissions[key as keyof typeof permissions].delete}
                          onCheckedChange={() => togglePermission(key, 'delete')}
                        />
                        <Label
                          htmlFor={`${key}-delete`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          Delete
                        </Label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setPermissionsOpen(false)}
                  disabled={savingPermissions}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  onClick={handleSavePermissions}
                  disabled={savingPermissions}
                  className="bg-cyan-500 hover:bg-cyan-600 rounded-xl"
                >
                  {savingPermissions && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Permissions
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Examiners List */}
        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-cyan-500/10 to-teal-500/10 px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-cyan-900 dark:text-cyan-100">
              Examiner Accounts ({examiners.length})
            </h2>
          </div>
          <CardContent className="p-0">
            {examiners.length > 0 ? (
              <div className="divide-y">
                {examiners.map((examiner) => {
                  const isSuper = isSuperAdmin(examiner.email);
                  const canModify = canModifyExaminer(examiner);
                  
                  return (
                    <div 
                      key={examiner.userId}
                      className="p-4 sm:p-6 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/20 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        {/* Left: User Info */}
                        <div className="flex items-center gap-3 sm:gap-4 flex-1 w-full">
                          <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-md flex-shrink-0">
                            {examiner.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-semibold text-base sm:text-lg truncate">{examiner.fullName}</h3>
                              {examiner.email === user?.email && (
                                <Badge variant="outline" className="text-xs bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400 border-cyan-300">
                                  You
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{examiner.email}</p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              {/* Status Badge */}
                              {examiner.disabled ? (
                                <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0 text-xs">
                                  <Ban className="h-3 w-3 mr-1" />
                                  Disabled
                                </Badge>
                              ) : (
                                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0 text-xs">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Active
                                </Badge>
                              )}
                              
                              {/* Role Badge */}
                              {isSuper ? (
                                <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-0 text-xs">
                                  <ShieldAlert className="h-3 w-3 mr-1" />
                                  Examiner
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="border-cyan-300 text-cyan-700 dark:border-cyan-700 dark:text-cyan-400 text-xs">
                                  <ShieldCheck className="h-3 w-3 mr-1" />
                                  Examiner
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Actions - Full width on mobile */}
                        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end sm:justify-start flex-wrap">
                          {/* Manage Permissions Button - Only for Super Admin with edit permission */}
                          {isSuperAdminUser && canModify && canEdit('examiners') && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleManagePermissions(examiner)}
                              className="h-10 px-3 rounded-full border-purple-300 hover:bg-purple-50 hover:border-purple-400 flex-shrink-0"
                              title="Manage permissions"
                            >
                              <Settings className="h-4 w-4 text-purple-600 mr-2" />
                              <span className="text-xs font-medium">Permissions</span>
                            </Button>
                          )}
                          
                          {/* Enable/Disable Toggle */}
                          {canEdit('examiners') && (
                            <div className="flex flex-col items-center gap-1">
                              <Switch
                                checked={!examiner.disabled}
                                onCheckedChange={() => handleToggleStatus(examiner)}
                                disabled={!canModify}
                                className="data-[state=checked]:bg-green-500"
                              />
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {examiner.disabled ? 'Enable' : 'Disable'}
                              </span>
                            </div>
                          )}
                          
                          {/* Edit Button */}
                          {canEdit('examiners') && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditClick(examiner)}
                              disabled={!canModify}
                              className="h-10 w-10 p-0 rounded-full border-cyan-300 hover:bg-cyan-50 hover:border-cyan-400 flex-shrink-0"
                              title={!canModify ? "Cannot modify this examiner" : "Edit examiner"}
                            >
                              <Pencil className="h-4 w-4 text-cyan-600" />
                            </Button>
                          )}
                          
                          {/* Delete Button */}
                          {canDelete('examiners') && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteClick(examiner)}
                              disabled={!canModify}
                              className="h-10 w-10 p-0 rounded-full border-red-300 hover:bg-red-50 hover:border-red-400 flex-shrink-0"
                              title={!canModify ? "Cannot delete this examiner" : "Delete examiner"}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="h-20 w-20 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="h-10 w-10 text-cyan-600" />
                </div>
                <h3 className="font-medium text-lg mb-2">No examiners found</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Get started by creating your first examiner account
                </p>
                <Button 
                  onClick={() => setCreateOpen(true)}
                  className="bg-cyan-500 hover:bg-cyan-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Examiner
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        {isSuperAdminUser && (
          <Card className="border-0 shadow-md bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-yellow-400/20 flex items-center justify-center flex-shrink-0">
                  <ShieldAlert className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-yellow-900 dark:text-yellow-400 mb-2">
                    Super Admin Privileges
                  </h3>
                  <p className="text-sm text-yellow-800 dark:text-yellow-500">
                    As a super admin, you have full control over all examiners. You can create, edit, disable, and delete any examiner account except your own.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
