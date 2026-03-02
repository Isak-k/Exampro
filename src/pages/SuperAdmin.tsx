import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '@/contexts/PermissionsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  Search, 
  UserPlus, 
  Edit, 
  Trash2, 
  Power,
  PowerOff 
} from 'lucide-react';
import { Home } from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc,
  deleteDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';
import { UserProfile } from '@/integrations/firebase/types';
import { 
  UserPermissions, 
  PERMISSION_GROUPS, 
  PERMISSION_LABELS,
  PermissionKey,
  DEFAULT_PERMISSIONS 
} from '@/types/permissions';

export default function SuperAdmin() {
  const navigate = useNavigate();
  const { isSuperAdmin } = usePermissions();
  const { toast } = useToast();
  const [examiners, setExaminers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editPermissions, setEditPermissions] = useState<UserPermissions | null>(null);

  // Redirect if not super admin
  useEffect(() => {
    if (!isSuperAdmin) {
      toast({
        title: 'Access Denied',
        description: 'Only Super Admin can access this page',
        variant: 'destructive',
      });
      navigate('/dashboard');
    }
  }, [isSuperAdmin, navigate, toast]);

  // Load examiners
  useEffect(() => {
    loadExaminers();
  }, []);

  const loadExaminers = async () => {
    try {
      setLoading(true);
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', 'admin'));
      const snapshot = await getDocs(q);
      
      const examinersList = snapshot.docs.map(doc => ({
        ...doc.data(),
        userId: doc.id,
      })) as UserProfile[];
      
      setExaminers(examinersList);
    } catch (error) {
      console.error('Error loading examiners:', error);
      toast({
        title: 'Error',
        description: 'Failed to load examiners',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditPermissions = (user: UserProfile) => {
    setEditingUser(user);
    setEditPermissions((user.permissions as UserPermissions) || DEFAULT_PERMISSIONS);
  };

  const handleSavePermissions = async () => {
    if (!editingUser || !editPermissions) return;

    try {
      // Map granular permissions → sectionPermissions (for button visibility)
      const p = editPermissions;
      const sectionPermissions = {
        dashboard:   { view: p.viewDashboard === true, edit: false, delete: false },
        manageExams: { 
          view:  (p.viewAllExams || p.createExams || p.editOwnExams || p.editAllExams || p.deleteOwnExams || p.deleteAllExams || p.publishExams) === true,
          edit:  (p.createExams || p.editOwnExams || p.editAllExams || p.publishExams) === true,
          delete:(p.deleteOwnExams || p.deleteAllExams) === true
        },
        allResults:  { 
          view:  (p.viewAllResults || p.viewOwnResults) === true,
          edit:  false,
          delete:false
        },
        students:    { 
          view:  p.viewStudents === true,
          edit:  (p.addStudents || p.editStudents || p.manageDepartments) === true,
          delete:(p.deleteStudents) === true
        },
        analytics:   { view: p.viewAnalytics === true, edit: false, delete: false },
        leaderboard: { 
          view:  (p.viewLeaderboard || p.manageLeaderboard) === true,
          edit:  p.manageLeaderboard === true,
          delete:p.manageLeaderboard === true
        },
        examiners:   { 
          view:  p.viewExaminers === true,
          edit:  (p.editExaminerPermissions || p.enableDisableExaminers) === true,
          delete:p.deleteExaminers === true
        },
        departments: { 
          view:  true,
          edit:  p.manageDepartments === true,
          delete:p.manageDepartments === true
        },
      };

      const userRef = doc(db, 'users', editingUser.userId);
      await updateDoc(userRef, {
        permissions: editPermissions,
        sectionPermissions,
        updatedAt: Timestamp.now(),
      });

      toast({
        title: 'Success',
        description: 'Permissions updated successfully',
      });

      setEditingUser(null);
      setEditPermissions(null);
      loadExaminers();
    } catch (error) {
      console.error('Error updating permissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to update permissions',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (user: UserProfile) => {
    try {
      const userRef = doc(db, 'users', user.userId);
      await updateDoc(userRef, {
        disabled: !user.disabled,
        updatedAt: Timestamp.now(),
      });

      toast({
        title: 'Success',
        description: `Examiner ${user.disabled ? 'enabled' : 'disabled'} successfully`,
      });

      loadExaminers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user status',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteExaminer = async (user: UserProfile) => {
    if (!confirm(`Are you sure you want to delete ${user.fullName}?`)) return;

    try {
      const userRef = doc(db, 'users', user.userId);
      await deleteDoc(userRef);

      toast({
        title: 'Success',
        description: 'Examiner deleted successfully',
      });

      loadExaminers();
    } catch (error) {
      console.error('Error deleting examiner:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete examiner',
        variant: 'destructive',
      });
    }
  };

  const togglePermission = (key: PermissionKey) => {
    if (!editPermissions) return;
    setEditPermissions({
      ...editPermissions,
      [key]: !editPermissions[key],
    });
  };

  const filteredExaminers = examiners.filter(examiner =>
    examiner.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    examiner.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isSuperAdmin) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Super Admin</h1>
            <p className="text-muted-foreground">Manage examiner permissions</p>
          </div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search examiners..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          <Home className="h-4 w-4 mr-2" />
          Back Home
        </Button>
        <Button onClick={() => navigate('/dashboard/examiners')}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Examiner
        </Button>
      </div>

      {/* Examiners List */}
      <div className="grid gap-4">
        {loading ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Loading examiners...
            </CardContent>
          </Card>
        ) : filteredExaminers.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No examiners found
            </CardContent>
          </Card>
        ) : (
          filteredExaminers.map((examiner) => (
            <Card key={examiner.userId}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{examiner.fullName}</h3>
                      <Badge variant={examiner.disabled ? 'destructive' : 'default'}>
                        {examiner.disabled ? 'Disabled' : 'Active'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{examiner.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditPermissions(examiner)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Permissions
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(examiner)}
                    >
                      {examiner.disabled ? (
                        <Power className="h-4 w-4" />
                      ) : (
                        <PowerOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteExaminer(examiner)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Permissions Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Edit Permissions - {editingUser?.fullName}
            </DialogTitle>
          </DialogHeader>

          {editPermissions && (
            <div className="space-y-6">
              {Object.entries(PERMISSION_GROUPS).map(([groupName, permissions]) => (
                <div key={groupName} className="space-y-3">
                  <h3 className="font-semibold text-sm">{groupName}</h3>
                  <div className="space-y-2 pl-4">
                    {permissions.map((permKey) => (
                      <div key={permKey} className="flex items-center space-x-2">
                        <Checkbox
                          id={permKey}
                          checked={editPermissions[permKey]}
                          onCheckedChange={() => togglePermission(permKey)}
                        />
                        <Label
                          htmlFor={permKey}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {PERMISSION_LABELS[permKey]}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleSavePermissions}>
              Save Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
