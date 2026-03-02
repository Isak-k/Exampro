import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getStudentAttempts } from "@/lib/firebase-attempts";
import { getExam } from "@/lib/firebase-exams";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Loader2, Trophy, Clock, CheckCircle, XCircle, Eye } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";

interface Result {
  id: string;
  examId: string;
  totalScore: number | null;
  maxScore: number | null;
  submittedAt: string | null;
  timeSpentSeconds: number | null;
  exam: {
    title: string;
    resultsPublished: boolean;
  };
}

const StudentResults = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchResults();
    }
  }, [user]);

  const fetchResults = async () => {
    if (!user) return;

    try {
      console.log('📊 Fetching student results for user:', user.uid);
      const attempts = await getStudentAttempts(user.uid);
      console.log(`✓ Found ${attempts.length} attempts:`, attempts);
      
      // Load archived results for deleted exams
      console.log('📦 Fetching archived results...');
      const archivedSnap = await getDocs(query(collection(db, "archivedResults"), where("studentId", "==", user.uid)));
      const archived = archivedSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      console.log(`✓ Found ${archived.length} archived results`);
      
      const submittedAttempts = attempts.filter(a => a.isSubmitted);
      console.log(`✓ ${submittedAttempts.length} submitted attempts`);

      const liveResults = await Promise.all(submittedAttempts.map(async (attempt) => {
        try {
          const exam = await getExam(attempt.examId);
          return {
            id: attempt.attemptId,
            examId: attempt.examId,
            totalScore: attempt.totalScore,
            maxScore: attempt.maxScore,
            submittedAt: attempt.submittedAt?.toDate().toISOString() || null,
            timeSpentSeconds: attempt.timeSpentSeconds,
            exam: {
              title: exam?.title || 'Unknown Exam',
              resultsPublished: exam?.resultsPublished || false
            }
          };
        } catch (examError) {
          console.warn(`⚠ Could not fetch exam ${attempt.examId}:`, examError);
          // Return result with cached attempt data even if exam fetch fails
          return {
            id: attempt.attemptId,
            examId: attempt.examId,
            totalScore: attempt.totalScore,
            maxScore: attempt.maxScore,
            submittedAt: attempt.submittedAt?.toDate().toISOString() || null,
            timeSpentSeconds: attempt.timeSpentSeconds,
            exam: {
              title: attempt.examTitle || 'Unknown Exam',
              resultsPublished: true // Show results if we have the attempt data
            }
          };
        }
      }));
      
      const archivedResults = archived.map((ar) => ({
        id: ar.attemptId || ar.id,
        examId: ar.examId,
        totalScore: ar.totalScore ?? null,
        maxScore: ar.maxScore ?? null,
        submittedAt: ar.submittedAt?.toDate?.()?.toISOString?.() || null,
        timeSpentSeconds: ar.timeSpentSeconds ?? null,
        exam: {
          title: ar.examTitle || "Deleted Exam",
          resultsPublished: true
        }
      })) as Result[];

      // Sort by submittedAt desc
      const resultsData = [...liveResults, ...archivedResults];
      resultsData.sort((a, b) => {
        const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
        const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
        return dateB - dateA;
      });

      console.log(`✓ Loaded ${resultsData.length} total results`);
      setResults(resultsData);
    } catch (error: any) {
      console.error("❌ Error fetching results:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      // Don't clear results on error - keep showing cached data
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number | null) => {
    if (!seconds) return "-";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-success";
    if (percentage >= 60) return "text-warning";
    return "text-destructive";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold">
            {t("student.results.title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("student.results.subtitle")}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-4">
            {results.map((result) => {
              const percentage = result.maxScore
                ? Math.round((result.totalScore! / result.maxScore) * 100)
                : 0;
              const isPassed = percentage >= 50;
              const isPublished = result.exam.resultsPublished;

              return (
                <Card key={result.id} className="card-interactive">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg font-display">
                        {result.exam.title}
                      </CardTitle>
                      {isPublished ? (
                        <Badge
                          variant="outline"
                          className={isPassed ? "badge-success" : "badge-danger"}
                        >
                          {isPassed ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {t("student.results.status.passed")}
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              {t("student.results.status.failed")}
                            </>
                          )}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="badge-warning">
                          {t("student.results.status.pending")}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isPublished ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Trophy className={`h-5 w-5 ${getScoreColor(percentage)}`} />
                            <span className={`text-2xl font-bold ${getScoreColor(percentage)}`}>
                              {percentage}%
                            </span>
                          </div>
                          <span className="text-muted-foreground">
                            {result.totalScore} / {result.maxScore} {t("student.results.marks")}
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {t("student.results.time", { time: formatTime(result.timeSpentSeconds) })}
                          </div>
                          {result.submittedAt && (
                            <span>
                              {t("student.results.submitted", { date: format(new Date(result.submittedAt), "MMM d, yyyy h:mm a") })}
                            </span>
                          )}
                        </div>
                        <div className="pt-4 flex justify-end">
                          <Button asChild variant="outline" size="sm">
                            <Link to={`/dashboard/results/${result.id}/review`}>
                              <Eye className="h-4 w-4 mr-2" />
                              {t("student.results.review")}
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        {t("student.results.pendingMessage")}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-muted/50 rounded-xl">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">{t("student.results.empty.title")}</h3>
            <p className="text-muted-foreground text-sm">
              {t("student.results.empty.description")}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentResults;
