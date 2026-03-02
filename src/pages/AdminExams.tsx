import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getAllExams, getExamsByCreator, deleteExam } from "@/lib/firebase-exams";
import { getExamAttempts } from "@/lib/firebase-attempts";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ExamCard } from "@/components/exam/ExamCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, FileText, Search } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ExamWithStats {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  start_time: string | null;
  end_time: string | null;
  is_published: boolean;
  question_count: number;
  attempt_count: number;
}

const AdminExams = () => {
  const { role, user } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [exams, setExams] = useState<ExamWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState<ExamWithStats | null>(null);

  const fetchExams = useCallback(async () => {
    try {
      if (!user) return; // Wait for user

      let examsData;
      if (role === 'admin') {
        examsData = await getAllExams();
      } else {
        // If not admin, show exams created by this user
        examsData = await getExamsByCreator(user.uid);
      }

      const examsWithStats = await Promise.all(
        examsData.map(async (exam) => {
          let attempts = [];
          try {
            attempts = await getExamAttempts(exam.examId);
          } catch (err) {
            console.error(`Failed to fetch attempts for exam ${exam.examId}`, err);
          }

          return {
            id: exam.examId,
            title: exam.title,
            description: exam.description,
            duration_minutes: exam.durationMinutes,
            start_time: exam.startTime?.toDate().toISOString() || null,
            end_time: exam.endTime?.toDate().toISOString() || null,
            is_published: exam.isPublished,
            question_count: exam.questionCount,
            attempt_count: attempts.length,
          };
        })
      );

      setExams(examsWithStats);
    } catch (error) {
      console.error("Error fetching exams:", error);
    } finally {
      setLoading(false);
    }
  }, [role, user]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const filteredExams = exams.filter((exam) => {
    // Filter by tab
    if (tab === "published" && !exam.is_published) return false;
    if (tab === "draft" && exam.is_published) return false;
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const titleMatch = exam.title.toLowerCase().includes(query);
      const descriptionMatch = exam.description?.toLowerCase().includes(query);
      
      return titleMatch || descriptionMatch;
    }
    
    return true;
  });

  const handleDeleteClick = (examId: string) => {
    const exam = exams.find(e => e.id === examId);
    if (exam) {
      setExamToDelete(exam);
      setDeleteDialogOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!examToDelete) return;

    try {
      await deleteExam(examToDelete.id);
      
      toast({
        title: "Exam deleted",
        description: `"${examToDelete.title}" has been permanently deleted.`,
      });
      
      // Refresh the exam list
      fetchExams();
      setDeleteDialogOpen(false);
      setExamToDelete(null);
    } catch (error: any) {
      console.error("Error deleting exam:", error);
      toast({
        title: "Failed to delete exam",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Removed the role check block that returned null
  
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold">
              {role === 'admin' ? t("admin.exams.title") : t("admin.exams.titleMy")}
            </h1>
            <p className="text-muted-foreground mt-1">
              {role === 'admin' ? t("admin.exams.subtitle") : t("admin.exams.subtitleMy")}
            </p>
          </div>
          <Button asChild className="btn-primary w-full sm:w-auto">
            <Link to="/dashboard/exams/new">
              <Plus className="h-4 w-4 mr-2" />
              {t("admin.exams.create")}
            </Link>
          </Button>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">{t("admin.exams.tabs.all")} ({exams.length})</TabsTrigger>
              <TabsTrigger value="published">
                {t("admin.exams.tabs.published")} ({exams.filter((e) => e.is_published).length})
              </TabsTrigger>
              <TabsTrigger value="draft">
                {t("admin.exams.tabs.drafts")} ({exams.filter((e) => !e.is_published).length})
              </TabsTrigger>
            </TabsList>
            
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search exams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <TabsContent value={tab} className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredExams.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredExams.map((exam) => (
                  <ExamCard 
                    key={exam.id} 
                    exam={exam} 
                    isAdmin 
                    onDelete={handleDeleteClick}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-muted/50 rounded-xl">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">{t("admin.exams.empty.title")}</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {tab === "all"
                    ? t("admin.exams.empty.description")
                    : `${t("admin.exams.empty.title")} (${tab})`}
                </p>
                {tab === "all" && (
                  <Button asChild className="btn-primary">
                    <Link to="/dashboard/exams/new">
                      <Plus className="h-4 w-4 mr-2" />
                      {t("admin.exams.empty.action")}
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exam</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              {examToDelete && (
                <>
                  <p>Are you sure you want to delete "{examToDelete.title}"?</p>
                  <p className="font-semibold text-destructive">
                    This will permanently delete:
                  </p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>The exam and all its questions</li>
                    <li>All student attempts ({examToDelete.attempt_count} attempts)</li>
                    <li>All results and analytics data</li>
                  </ul>
                  <p className="text-sm font-semibold">This action cannot be undone.</p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm} 
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default AdminExams;
