import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getExam, updateExam, getQuestions, addQuestion, updateQuestion as updateQuestionDb, deleteQuestion as deleteQuestionDb, deleteExam } from "@/lib/firebase-exams";
import { getDepartments } from "@/lib/departments";
import { Department } from "@/integrations/firebase/types";
import { Timestamp } from "firebase/firestore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useSectionPermissions } from "@/hooks/useSectionPermissions";
import {
  Loader2,
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Eye,
  EyeOff,
  GripVertical,
  Users,
} from "lucide-react";

import { BulkImportQuestions } from "@/components/exam/BulkImportQuestions";

interface Question {
  questionId?: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  feedbackType: "instant" | "hidden";
  explanation?: string;
  marks: number;
  orderIndex: number;
}

interface Exam {
  examId: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  maxAttempts: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  startTime: Timestamp | null;
  endTime: Timestamp | null;
  isPublished: boolean;
  resultsPublished: boolean;
  accessPassword?: string | null;
}

const EditExam = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { canEdit, canDelete } = useSectionPermissions();
  const canEditExams = canEdit('manageExams');
  const canDeleteExams = canDelete('manageExams');

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteExamDialogOpen, setDeleteExamDialogOpen] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<number | null>(null);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        if (!id) return;
        
        const examData = await getExam(id);
        if (!examData) throw new Error("Exam not found");
        
        setExam(examData);
  
        const questionsData = await getQuestions(id);
        setQuestions(questionsData.sort((a, b) => a.orderIndex - b.orderIndex));
      } catch (error: any) {
        console.error("Error fetching exam:", error);
        toast({
          title: t("admin.exams.toasts.errorLoading"),
          description: error.message,
          variant: "destructive",
        });
        navigate("/dashboard/exams");
      } finally {
        setLoading(false);
      }
    };
  
    const fetchDepartments = async () => {
      try {
        const data = await getDepartments();
        setDepartments(data);
      } catch (error) {
        console.error("Error fetching departments:", error);
      }
    };

    if (id) {
      fetchExam();
      fetchDepartments();
    }
  }, [id, t, navigate]);

  const handleImportSuccess = async () => {
    if (!id) return;
    
    // Preserve any unsaved questions (those without IDs)
    const unsavedQuestions = questions.filter(q => !q.questionId);
    
    // Get fresh questions from DB (including the newly imported ones)
    const dbQuestions = await getQuestions(id);
    
    // Combine them and re-calculate order indices
    const allQuestions = [...dbQuestions, ...unsavedQuestions].map((q, i) => ({
      ...q,
      orderIndex: i
    }));

    setQuestions(allQuestions);
  };

  const addQuestionItem = () => {
    if (!canEditExams) {
      toast({ title: "Permission Denied", description: "You cannot edit exams.", variant: "destructive" });
      return;
    }
    setQuestions([
      ...questions,
      {
        questionText: "",
        options: ["", "", "", ""],
        correctOptionIndex: 0,
        feedbackType: "hidden",
        explanation: "",
        marks: 1,
        orderIndex: questions.length,
      },
    ]);
  };

  const updateQuestionState = (index: number, updates: Partial<Question>) => {
    if (!canEditExams) {
      toast({ title: "Permission Denied", description: "You cannot edit exams.", variant: "destructive" });
      return;
    }
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    setQuestions(newQuestions);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    if (!canEditExams) {
      toast({ title: "Permission Denied", description: "You cannot edit exams.", variant: "destructive" });
      return;
    }
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(newQuestions);
  };

  const confirmDeleteQuestion = (index: number) => {
    setQuestionToDelete(index);
    setDeleteDialogOpen(true);
  };

  const handleDeleteQuestion = async () => {
    if (!canEditExams) {
      toast({ title: "Permission Denied", description: "You cannot edit exams.", variant: "destructive" });
      return;
    }
    if (questionToDelete === null || !id) return;

    const question = questions[questionToDelete];

    if (question.questionId) {
      await deleteQuestionDb(id, question.questionId);
    }

    setQuestions(questions.filter((_, i) => i !== questionToDelete));
    setDeleteDialogOpen(false);
    setQuestionToDelete(null);

    toast({
      title: t("admin.exams.toasts.questionDeleted"),
    });
  };

  const setAllFeedbackType = (type: "instant" | "hidden") => {
    if (!canEditExams) {
      toast({ title: "Permission Denied", description: "You cannot edit exams.", variant: "destructive" });
      return;
    }
    const updatedQuestions = questions.map((q) => ({
      ...q,
      feedbackType: type,
    }));
    setQuestions(updatedQuestions);
    
    if (exam) {
      setExam({
        ...exam,
        resultsPublished: type === "instant"
      });
    }

    toast({
      title: t("admin.exams.toasts.settingsUpdated"),
      description: t("admin.exams.toasts.feedbackUpdate", { type: type === "instant" ? t("admin.exams.questions.instantFeedback") : t("admin.exams.questions.hiddenFeedback") }),
    });
  };

  const saveExam = async () => {
    if (!canEditExams) {
      toast({ title: "Permission Denied", description: "You cannot edit exams.", variant: "destructive" });
      return;
    }
    if (!exam || !id) return;

    setSaving(true);

    try {
      // Validate questions
      const invalidQuestions = questions.filter(
        (q) =>
          !q.questionText.trim() ||
          q.options.some((o) => !o.trim()) ||
          q.correctOptionIndex < 0 ||
          q.correctOptionIndex >= q.options.length
      );

      if (invalidQuestions.length > 0) {
        toast({
          title: t("admin.exams.toasts.invalidQuestions"),
          description: t("admin.exams.toasts.fillAllFields"),
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      // Update exam
      await updateExam(id, {
        title: exam.title,
        description: exam.description,
        durationMinutes: exam.durationMinutes,
        maxAttempts: exam.maxAttempts,
        shuffleQuestions: exam.shuffleQuestions,
        shuffleOptions: exam.shuffleOptions,
        startTime: exam.startTime,
        endTime: exam.endTime,
        isPublished: exam.isPublished,
        resultsPublished: exam.resultsPublished,
        accessPassword: exam.accessPassword?.trim() || null
      });

      // Update questions
      // Use Promise.all to handle async operations and map results
      const updatedQuestions = await Promise.all(questions.map(async (q, i) => {
        const questionData = {
          examId: id,
          questionText: q.questionText,
          options: q.options,
          correctOptionIndex: q.correctOptionIndex,
          feedbackType: q.feedbackType,
          explanation: q.explanation || undefined,
          marks: q.marks,
          orderIndex: i,
        };

        if (q.questionId) {
          await updateQuestionDb(id, q.questionId, questionData);
          return q;
        } else {
          const newId = await addQuestion(id, questionData);
          // Return the question with the new ID
          return { ...q, questionId: newId };
        }
      }));
      
      // Update local state with new IDs to prevent duplicates on subsequent saves
      setQuestions(updatedQuestions);

      toast({
        title: t("admin.exams.toasts.examSaved"),
      });
    } catch (error: any) {
      console.error("Error saving exam:", error);
      toast({
        title: t("admin.exams.toasts.saveFailed"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async () => {
    if (!canEditExams) {
      toast({ title: "Permission Denied", description: "You cannot edit exams.", variant: "destructive" });
      return;
    }
    if (!exam || !id) return;

    if (!exam.isPublished && questions.length === 0) {
      toast({
        title: t("admin.exams.toasts.cannotPublish"),
        description: t("admin.exams.toasts.addQuestionFirst"),
        variant: "destructive",
      });
      return;
    }

    if (!exam.isPublished) {
      // Show department selection dialog when publishing
      const currentDepts = exam.departmentIds || (exam.departmentId ? [exam.departmentId] : []);
      setSelectedDepartments(currentDepts);
      setPublishDialogOpen(true);
    } else {
      // Unpublish directly
      try {
        await updateExam(id, { isPublished: false });
        setExam({ ...exam, isPublished: false });
        toast({
          title: t("admin.exams.toasts.unpublished"),
        });
      } catch (error: any) {
        console.error("Error unpublishing exam:", error);
        toast({
          title: t("admin.exams.toasts.updateFailed"),
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

  const handlePublishConfirm = async () => {
    if (!canEditExams) {
      toast({ title: "Permission Denied", description: "You cannot edit exams.", variant: "destructive" });
      return;
    }
    if (!exam || !id) return;

    try {
      const singleDept = selectedDepartments.length === 1 ? selectedDepartments[0] : undefined;
      const updates: Partial<typeof exam> = {
        isPublished: true,
        departmentIds: selectedDepartments.length > 0 ? selectedDepartments : undefined,
        departmentId: singleDept // Keep legacy field for single-department publish (compat)
      };

      await updateExam(id, updates);
      setExam({ ...exam, ...updates });
      setPublishDialogOpen(false);
      
      const deptNames = selectedDepartments.length === 0 
        ? "all departments" 
        : departments.filter(d => selectedDepartments.includes(d.id)).map(d => d.name).join(", ");
      
      toast({
        title: t("admin.exams.toasts.published"),
        description: `Published to: ${deptNames}`,
      });
    } catch (error: any) {
      console.error("Error publishing exam:", error);
      toast({
        title: t("admin.exams.toasts.updateFailed"),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteExam = async () => {
    if (!canDeleteExams) {
      toast({ title: "Permission Denied", description: "You cannot delete exams.", variant: "destructive" });
      return;
    }
    if (!id) return;

    try {
      await deleteExam(id);
      
      toast({
        title: "Exam deleted",
        description: "The exam has been permanently deleted.",
      });
      
      navigate("/dashboard/exams");
    } catch (error: any) {
      console.error("Error deleting exam:", error);
      toast({
        title: "Failed to delete exam",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!exam) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard/exams">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-display font-bold">{t("admin.exams.form.editTitle")}</h1>
              <p className="text-muted-foreground">{exam.title}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {canDeleteExams && (
            <Button 
              variant="outline" 
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setDeleteExamDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Exam
            </Button>
            )}
            {canEditExams && (
            <Button variant="outline" onClick={togglePublish}>
              {exam.isPublished ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  {t("admin.exams.questions.unpublish")}
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  {t("admin.exams.questions.publish")}
                </>
              )}
            </Button>
            )}
            {canEditExams && (
            <Button onClick={saveExam} className="btn-primary" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("admin.exams.questions.saving")}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {t("admin.exams.questions.save")}
                </>
              )}
            </Button>
            )}
          </div>
        </div>

        {/* Exam Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("admin.exams.form.settings")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("admin.exams.form.title")}</Label>
                <Input
                  value={exam.title}
                  onChange={(e) => canEditExams && setExam({ ...exam, title: e.target.value })}
                  className="input-focus"
                  disabled={!canEditExams}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.exams.form.duration")}</Label>
                <Input
                  type="number"
                  value={exam.durationMinutes}
                  onChange={(e) =>
                    setExam({ ...exam, durationMinutes: parseInt(e.target.value) || 60 })
                  }
                  className="input-focus"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.exams.form.startTime")}</Label>
                <Input
                  type="datetime-local"
                  value={exam.startTime ? new Date(exam.startTime.toDate().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : ""}
                  onChange={(e) =>
                    setExam({
                      ...exam,
                      startTime: e.target.value ? Timestamp.fromDate(new Date(e.target.value)) : null,
                    })
                  }
                  className="input-focus"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.exams.form.endTime")}</Label>
                <Input
                  type="datetime-local"
                  value={exam.endTime ? new Date(exam.endTime.toDate().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : ""}
                  onChange={(e) =>
                    setExam({
                      ...exam,
                      endTime: e.target.value ? Timestamp.fromDate(new Date(e.target.value)) : null,
                    })
                  }
                  className="input-focus"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("admin.exams.form.description")}</Label>
              <Textarea
                value={exam.description || ""}
                onChange={(e) => setExam({ ...exam, description: e.target.value })}
                className="input-focus"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="access_password">
                {t("admin.exams.form.accessPassword")} ({t("admin.exams.form.optional")})
              </Label>
              <Input
                id="access_password"
                type="text"
                value={exam.accessPassword || ""}
                onChange={(e) => setExam({ ...exam, accessPassword: e.target.value })}
                placeholder={t("admin.exams.form.accessPasswordPlaceholder")}
                className="input-focus"
              />
              <p className="text-sm text-muted-foreground">
                {t("admin.exams.form.accessPasswordHelp")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Questions */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-display font-semibold">
              {t("admin.exams.questions.title")} ({questions.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2 mr-2 bg-muted/50 p-1.5 rounded-lg border">
                 <Label className="text-sm font-medium whitespace-nowrap mr-1">{t("admin.exams.questions.feedback")}</Label>
                 <div className="flex items-center gap-1">
                   <Button 
                     variant={questions.length > 0 && questions.every(q => q.feedbackType === 'instant') ? "default" : "outline"} 
                     size="sm" 
                     className={`h-7 px-3 text-xs ${questions.length > 0 && questions.every(q => q.feedbackType === 'instant') ? "bg-green-600 hover:bg-green-700 text-white border-green-600" : "text-muted-foreground hover:text-foreground"}`}
                     onClick={() => setAllFeedbackType("instant")}
                   >
                     {t("admin.exams.questions.on")}
                   </Button>
                   <Button 
                     variant={questions.length > 0 && questions.every(q => q.feedbackType === 'hidden') ? "default" : "outline"} 
                     size="sm" 
                     className={`h-7 px-3 text-xs ${questions.length > 0 && questions.every(q => q.feedbackType === 'hidden') ? "bg-red-600 hover:bg-red-700 text-white border-red-600" : "text-muted-foreground hover:text-foreground"}`}
                     onClick={() => setAllFeedbackType("hidden")}
                   >
                     {t("admin.exams.questions.off")}
                   </Button>
                 </div>
              </div>
              {exam && id && (
                <BulkImportQuestions
                  examId={id}
                  currentQuestionCount={questions.length}
                  onImportSuccess={handleImportSuccess}
                />
              )}
              <Button onClick={addQuestionItem} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                {t("admin.exams.questions.add")}
              </Button>
            </div>
          </div>

          {questions.length === 0 ? (
            <Card className="py-12">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">{t("admin.exams.questions.noQuestions")}</p>
                <Button onClick={addQuestionItem} className="btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  {t("admin.exams.questions.addFirst")}
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {questions.map((question, qIndex) => (
                <Card key={question.questionId || qIndex}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                        <span className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                          {qIndex + 1}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => confirmDeleteQuestion(qIndex)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>{t("admin.exams.questions.questionText")}</Label>
                      <Textarea
                        value={question.questionText}
                        onChange={(e) =>
                          updateQuestionState(qIndex, { questionText: e.target.value })
                        }
                        placeholder={t("admin.exams.questions.questionPlaceholder")}
                        className="input-focus"
                        rows={2}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>{t("admin.exams.questions.options")}</Label>
                      <RadioGroup
                        value={question.correctOptionIndex.toString()}
                        onValueChange={(v) =>
                          updateQuestionState(qIndex, { correctOptionIndex: parseInt(v) })
                        }
                      >
                        {question.options.map((option, oIndex) => (
                          <div key={oIndex} className="flex items-center gap-3">
                            <RadioGroupItem value={oIndex.toString()} id={`q${qIndex}-o${oIndex}`} />
                            <Input
                              value={option}
                              onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                              placeholder={t("admin.exams.questions.optionPlaceholder", { number: oIndex + 1 })}
                              className="input-focus flex-1"
                            />
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    <div className="space-y-3">
                      <Label>{t("admin.exams.questions.explanation")}</Label>
                      <Textarea
                        value={question.explanation || ""}
                        onChange={(e) =>
                          updateQuestionState(qIndex, { explanation: e.target.value })
                        }
                        placeholder={t("admin.exams.questions.explanationPlaceholder")}
                        className="input-focus"
                        rows={2}
                      />
                      <p className="text-xs text-muted-foreground">
                        {t("admin.exams.questions.explanationHelp")}
                      </p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t">
                      <div className="space-y-2">
                        <Label>{t("admin.exams.questions.feedbackType")}</Label>
                        <Select
                          value={question.feedbackType}
                          onValueChange={(v: "instant" | "hidden") =>
                            updateQuestionState(qIndex, { feedbackType: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="instant">{t("admin.exams.questions.instantFeedback")}</SelectItem>
                            <SelectItem value="hidden">{t("admin.exams.questions.hiddenFeedback")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{t("admin.exams.questions.marks")}</Label>
                        <Input
                          type="number"
                          min={1}
                          value={question.marks}
                          onChange={(e) =>
                            updateQuestionState(qIndex, { marks: parseInt(e.target.value) || 1 })
                          }
                          className="input-focus"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Delete Question Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("admin.exams.questions.deleteTitle")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("admin.exams.questions.deleteDesc")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("admin.exams.questions.deleteCancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteQuestion} className="bg-destructive">
                {t("admin.exams.questions.deleteConfirm")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Exam Confirmation */}
        <AlertDialog open={deleteExamDialogOpen} onOpenChange={setDeleteExamDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Exam</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>Are you sure you want to delete this exam? This action cannot be undone.</p>
                <p className="font-semibold text-destructive">
                  This will permanently delete:
                </p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>The exam "{exam.title}"</li>
                  <li>All {questions.length} questions</li>
                  <li>All student attempts and results</li>
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteExam} 
                className="bg-destructive hover:bg-destructive/90"
              >
                Delete Permanently
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Publish to Departments Dialog */}
        <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Publish Exam
              </DialogTitle>
              <DialogDescription>
                Select which departments can access this exam. Leave none selected to make it available to all departments.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Available Departments</Label>
                {departments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No departments available</p>
                ) : (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {departments.map((dept) => (
                      <div key={dept.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={dept.id}
                          checked={selectedDepartments.includes(dept.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedDepartments([...selectedDepartments, dept.id]);
                            } else {
                              setSelectedDepartments(selectedDepartments.filter(id => id !== dept.id));
                            }
                          }}
                        />
                        <Label htmlFor={dept.id} className="text-sm font-normal cursor-pointer">
                          {dept.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selectedDepartments.length === 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 dark:bg-blue-900/20 dark:border-blue-800">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>All Departments:</strong> This exam will be visible to students from all departments.
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPublishDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handlePublishConfirm} className="btn-primary">
                <Eye className="h-4 w-4 mr-2" />
                Publish Exam
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default EditExam;
