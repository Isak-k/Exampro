import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OfflineIndicator } from "@/components/ui/offline-indicator";
import { InstallPrompt } from "@/components/ui/install-prompt";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { PermissionsProvider } from "@/contexts/PermissionsContext";
import { ThemeProvider } from "@/hooks/use-theme";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { GraduationCap } from "lucide-react";
import "./lib/i18n";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import About from "./pages/About";
import Dashboard from "./pages/Dashboard";
import AdminExams from "./pages/AdminExams";
import CreateExam from "./pages/CreateExam";
import EditExam from "./pages/EditExam";
import ExamResults from "./pages/ExamResults";
import AdminStudents from "./pages/AdminStudents";
import AdminFeedback from "./pages/AdminFeedback";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminLeaderboardSimple from "./pages/AdminLeaderboardSimple";
import AdminAllResults from "./pages/AdminAllResults";
import StudentExams from "./pages/StudentExams";
import StudentResults from "./pages/StudentResults";
import StudentMessages from "./pages/StudentMessages";
import ReviewExam from "./pages/ReviewExam";
import TakeExam from "./pages/TakeExam";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import FirebaseTest from "./pages/FirebaseTest";
import FirebaseDiagnostic from "./pages/FirebaseDiagnostic";
import AdminSetup from "./pages/AdminSetup";
import ManageExaminers from "./pages/ManageExaminers";
import ManageDepartments from "./pages/ManageDepartments";
import MigrateExams from "./pages/MigrateExams";
import ExamDiagnostic from "./pages/ExamDiagnostic";
import SuperAdmin from "./pages/SuperAdmin";
import PermissionTest from "./pages/PermissionTest";

const queryClient = new QueryClient();

function AppRoutes() {
  const { loading } = useAuth();

  // Show loading screen while auth initializes
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-teal-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center space-y-6 animate-fade-in">
          <div className="relative">
            <div className="h-20 w-20 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-2xl shadow-cyan-500/30 animate-pulse">
              <GraduationCap className="h-10 w-10 text-white" />
            </div>
            <div className="absolute inset-0 h-20 w-20 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 blur-xl opacity-50 animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
              ExamPro
            </h2>
            <p className="text-sm text-muted-foreground mt-2">Loading your experience...</p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="h-2 w-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="h-2 w-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="h-2 w-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/about" element={<About />} />
        <Route path="/firebase-test" element={<FirebaseTest />} />
        <Route path="/firebase-diagnostic" element={<FirebaseDiagnostic />} />
        <Route path="/admin-setup" element={<AdminSetup />} />
        <Route path="/exam-diagnostic" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <ExamDiagnostic />
          </ProtectedRoute>
        } />
        <Route path="/migrate-exams" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <MigrateExams />
          </ProtectedRoute>
        } />
        
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          
        {/* Admin Routes - Restricted to Admins; fine-grained via permissions where needed */}
        <Route path="/dashboard/admin/exams" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminExams />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/exams/new" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <CreateExam />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/exams/:id/edit" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <EditExam />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/exams/:examId/results" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <ExamResults />
          </ProtectedRoute>
        } />
        
        {/* Only true admins can manage students and system-wide analytics */}
        <Route path="/dashboard/students" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminStudents />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/feedback" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminFeedback />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/examiners" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <ManageExaminers />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/departments" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <ManageDepartments />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/all-results" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminAllResults />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/analytics" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminAnalytics />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/leaderboard-admin" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLeaderboardSimple />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/super-admin" element={
          <ProtectedRoute allowedRoles={["admin"]} requireSuperAdmin>
            <SuperAdmin />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/permission-test" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <PermissionTest />
          </ProtectedRoute>
        } />
        
        {/* Student Routes */}
        <Route path="/dashboard/exams" element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentExams />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/results" element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentResults />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/messages" element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentMessages />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/results/:attemptId/review" element={
          <ProtectedRoute allowedRoles={["student"]}>
            <ReviewExam />
          </ProtectedRoute>
        } />
        <Route path="/exam/:id" element={
          <ProtectedRoute allowedRoles={["student"]}>
            <TakeExam />
          </ProtectedRoute>
        } />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <PermissionsProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <OfflineIndicator />
            <InstallPrompt />
            <AppRoutes />
          </TooltipProvider>
        </PermissionsProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
