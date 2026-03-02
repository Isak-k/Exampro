import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getAllExamResults, ResultWithDetails } from "@/lib/firebase-admin";
import { db } from "@/integrations/firebase/client";
import { collection, getDocs } from "firebase/firestore";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  Search,
  Users,
  TrendingUp,
  Award,
  FileText,
  Eye,
  Download,
} from "lucide-react";
import { formatTimeSpent, exportAllResultsToCSV, exportAllResultsToPDF, ExamResultData } from "@/lib/export-utils";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

interface ExamOption {
  id: string;
  title: string;
}

const ITEMS_PER_PAGE = 10;

const AdminAllResults = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [results, setResults] = useState<ResultWithDetails[]>([]);
  const [filteredResults, setFilteredResults] = useState<ResultWithDetails[]>([]);
  const [exams, setExams] = useState<ExamOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExam, setSelectedExam] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchAllResults();
  }, []);

  useEffect(() => {
    filterResults();
  }, [results, searchQuery, selectedExam]);

  const fetchAllResults = async () => {
    try {
      console.log("Fetching all exam results...");
      const data = await getAllExamResults();
      console.log("Results fetched:", data.length);
      setResults(data);

      // Fetch exams for filter dropdown
      console.log("Fetching exams for filter...");
      const examsRef = collection(db, "exams");
      const examsSnapshot = await getDocs(examsRef);
      const examsList = examsSnapshot.docs.map(doc => ({ 
        id: doc.data().examId, 
        title: doc.data().title 
      }));
      console.log("Exams fetched:", examsList.length);
      setExams(examsList);
    } catch (error: any) {
      console.error("Error fetching results:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      toast({
        title: "Error",
        description: error.message || "Failed to load exam results.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterResults = () => {
    let filtered = [...results];

    // Filter by exam
    if (selectedExam !== "all") {
      filtered = filtered.filter((r) => r.examId === selectedExam);
    }

    // Filter by search query (student name or email)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.studentName.toLowerCase().includes(query) ||
          r.studentEmail.toLowerCase().includes(query) ||
          r.examTitle.toLowerCase().includes(query)
      );
    }

    setFilteredResults(filtered);
    setCurrentPage(1);
  };

  const getScoreBadge = (percentage: number) => {
    if (percentage >= 80) return "badge-success";
    if (percentage >= 60) return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    if (percentage >= 40) return "badge-warning";
    return "badge-danger";
  };

  const handleExport = (format: "csv" | "pdf") => {
    if (filteredResults.length === 0) {
      toast({
        title: "No results to export",
        description: "There are no results matching your current filters.",
        variant: "destructive",
      });
      return;
    }

    const exportData: ExamResultData[] = filteredResults.map((r) => ({
      studentName: r.studentName,
      studentEmail: r.studentEmail,
      examTitle: r.examTitle,
      score: r.totalScore || 0,
      maxScore: r.maxScore || 0,
      percentage: r.maxScore ? Math.round(((r.totalScore || 0) / r.maxScore) * 100) : 0,
      submittedAt: r.submittedAt ? r.submittedAt.toDate().toLocaleDateString() : "N/A",
      timeSpent: formatTimeSpent(r.timeSpentSeconds || 0),
    }));

    const filename = `all-results-${new Date().toISOString().split("T")[0]}`;

    if (format === "csv") {
      exportAllResultsToCSV(exportData, filename);
    } else {
      exportAllResultsToPDF(exportData, filename);
    }

    toast({
      title: "Export successful",
      description: `Results exported as ${format.toUpperCase()}`,
    });
  };

  // Pagination
  const totalPages = Math.ceil(filteredResults.length / ITEMS_PER_PAGE);
  const paginatedResults = filteredResults.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Summary stats
  const totalAttempts = filteredResults.length;
  const avgScore = filteredResults.length
    ? Math.round(
        filteredResults.reduce((sum, r) => {
          const pct = r.maxScore ? ((r.totalScore || 0) / r.maxScore) * 100 : 0;
          return sum + pct;
        }, 0) / filteredResults.length
      )
    : 0;
  const passCount = filteredResults.filter((r) => {
    const pct = r.maxScore ? ((r.totalScore || 0) / r.maxScore) * 100 : 0;
    return pct >= 60;
  }).length;
  const passRate = totalAttempts ? Math.round((passCount / totalAttempts) * 100) : 0;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold">{t("admin.results.title")}</h1>
            <p className="text-muted-foreground mt-1">
              {t("admin.results.subtitle")}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <Download className="h-4 w-4 mr-2" />
                {t("admin.results.export.button")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport("csv")}>
                {t("admin.results.export.csv")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("pdf")}>
                {t("admin.results.export.pdf")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Summary Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("admin.results.stats.totalAttempts")}</p>
                  <p className="text-2xl font-bold">{totalAttempts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("admin.results.stats.avgScore")}</p>
                  <p className="text-2xl font-bold">{avgScore}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Award className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("admin.results.stats.passRate")}</p>
                  <p className="text-2xl font-bold">{passRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("admin.results.stats.examsWithResults")}</p>
                  <p className="text-2xl font-bold">{exams.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("admin.results.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedExam} onValueChange={setSelectedExam}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder={t("admin.results.filterExam")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("admin.results.allExams")}</SelectItem>
                  {exams.map((exam) => (
                    <SelectItem key={exam.id} value={exam.id}>
                      {exam.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.results.table.title")} ({filteredResults.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {paginatedResults.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("admin.results.table.student")}</TableHead>
                        <TableHead>{t("admin.results.table.email")}</TableHead>
                        <TableHead>{t("admin.results.table.exam")}</TableHead>
                        <TableHead className="text-center">{t("admin.results.table.score")}</TableHead>
                        <TableHead className="text-center">{t("admin.results.table.percentage")}</TableHead>
                        <TableHead>{t("admin.results.table.submitted")}</TableHead>
                        <TableHead>{t("admin.results.table.timeSpent")}</TableHead>
                        <TableHead className="text-center">{t("admin.results.table.status")}</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedResults.map((result) => {
                        const percentage = result.maxScore
                          ? Math.round(((result.totalScore || 0) / result.maxScore) * 100)
                          : 0;

                        return (
                          <TableRow key={result.id}>
                            <TableCell className="font-medium">
                              {result.studentName}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {result.studentEmail}
                            </TableCell>
                            <TableCell>
                              {result.examTitle}
                            </TableCell>
                            <TableCell className="text-center">
                              {result.totalScore || 0}/{result.maxScore || 0}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className={getScoreBadge(percentage)}>
                                {percentage}%
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {result.submittedAt
                                ? result.submittedAt.toDate().toLocaleDateString()
                                : "N/A"}
                            </TableCell>
                            <TableCell>
                              {formatTimeSpent(result.timeSpentSeconds || 0)}
                            </TableCell>
                            <TableCell className="text-center">
                              {result.resultsPublished ? (
                                <Badge variant="outline" className="badge-success">
                                  {t("admin.results.status.published")}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground">
                                  {t("admin.results.status.hidden")}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" asChild>
                                <Link to={`/dashboard/exams/${result.examId}/results`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-4">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum: number;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                onClick={() => setCurrentPage(pageNum)}
                                isActive={currentPage === pageNum}
                                className="cursor-pointer"
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">{t("admin.results.empty.title")}</h3>
                <p className="text-muted-foreground text-sm">
                  {searchQuery || selectedExam !== "all"
                    ? t("admin.results.empty.filter")
                    : t("admin.results.empty.description")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminAllResults;
