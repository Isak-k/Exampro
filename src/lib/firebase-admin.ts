import { db, firebaseConfig } from "@/integrations/firebase/client";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit, 
  Timestamp,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc
} from "firebase/firestore";
import { UserProfile, Exam, ExamAttempt } from "@/integrations/firebase/types";
import { initializeApp, deleteApp, getApp, getApps } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut, setPersistence, inMemoryPersistence } from "firebase/auth";

export interface StudentWithStats extends UserProfile {
  examsCompleted: number;
  averageScore: number;
}

// Helper function to parse dates from Firestore
function parseDate(date: any): Date | null {
  if (!date) return null;
  if (typeof date.toDate === 'function') {
    return date.toDate();
  }
  if (date instanceof Date) {
    return date;
  }
  if (typeof date === 'string' || typeof date === 'number') {
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

export async function createStudent(data: { email: string; password: string; fullName: string; departmentId: string }) {
  let secondaryApp;
  try {
    // Initialize a secondary app to create user without logging out the admin
    const appName = "secondary";
    const existingApps = getApps();
    secondaryApp = existingApps.find(app => app.name === appName) || initializeApp(firebaseConfig, appName);
    
    const secondaryAuth = getAuth(secondaryApp);
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, data.email, data.password);
    const user = userCredential.user;

    // Create user document in Firestore using the main app's db (as admin)
    const userRef = doc(db, "users", user.uid);
    const userData: UserProfile = {
      userId: user.uid,
      email: data.email,
      fullName: data.fullName,
      role: "student",
      departmentId: data.departmentId,
      avatarUrl: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    await setDoc(userRef, userData);

    // Clean up
    await signOut(secondaryAuth);
    return user.uid;
  } catch (error) {
    console.error("Error creating student:", error);
    throw error;
  } finally {
    if (secondaryApp) {
      // We don't necessarily need to delete the app every time, but it's cleaner
      // However, deleteApp is async and might cause issues if called too quickly
      // Let's just leave it or handle it carefully. 
      // For this implementation, deleting it ensures fresh state.
      try {
        await deleteApp(secondaryApp);
      } catch (e) {
        console.warn("Error deleting secondary app:", e);
      }
    }
  }
}

export async function getAllStudents(): Promise<StudentWithStats[]> {
  try {
    // Get all students
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("role", "==", "student"));
    const snapshot = await getDocs(q);
    
    const students: UserProfile[] = [];
    snapshot.forEach((doc) => {
      students.push(doc.data() as UserProfile);
    });

    // Get stats for each student
    const studentsWithStats = await Promise.all(
      students.map(async (student) => {
        const attemptsRef = collection(db, "examAttempts");
        const attemptsQuery = query(
          attemptsRef, 
          where("studentId", "==", student.userId),
          where("isSubmitted", "==", true)
        );
        const attemptsSnapshot = await getDocs(attemptsQuery);
        
        const attempts = attemptsSnapshot.docs.map(doc => doc.data() as ExamAttempt);
        
        const examsCompleted = attempts.length;
        const totalScore = attempts.reduce((sum, a) => sum + (a.totalScore || 0), 0);
        const maxScore = attempts.reduce((sum, a) => sum + (a.maxScore || 0), 0);
        const averageScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

        return {
          ...student,
          examsCompleted,
          averageScore
        };
      })
    );

    return studentsWithStats;
  } catch (error) {
    console.error("Error getting all students:", error);
    throw error;
  }
}

export interface DashboardStats {
  totalExams: number;
  totalStudents: number;
  activeExams: number;
  completedAttempts: number;
}

export async function getAdminDashboardStats(): Promise<DashboardStats> {
  try {
    // Get exams count
    const examsRef = collection(db, "exams");
    const examsSnapshot = await getDocs(examsRef);
    const exams = examsSnapshot.docs.map(doc => doc.data() as Exam);
    
    // Get students count
    const usersRef = collection(db, "users");
    const studentsQuery = query(usersRef, where("role", "==", "student"));
    const studentsSnapshot = await getDocs(studentsQuery);
    
    // Get attempts count
    const attemptsRef = collection(db, "examAttempts");
    const attemptsQuery = query(attemptsRef, where("isSubmitted", "==", true));
    const attemptsSnapshot = await getDocs(attemptsQuery);
    
    // Calculate active exams
    const now = new Date();
    const activeExams = exams.filter(e => {
      try {
        const startTime = e.startTime && typeof e.startTime.toDate === 'function' ? e.startTime.toDate() : null;
        const endTime = e.endTime && typeof e.endTime.toDate === 'function' ? e.endTime.toDate() : null;
        
        return e.isPublished &&
          (!startTime || startTime <= now) &&
          (!endTime || endTime >= now);
      } catch (err) {
        console.warn("Error checking active exam status:", err);
        return false;
      }
    }).length;

    return {
      totalExams: exams.length,
      totalStudents: studentsSnapshot.size,
      activeExams,
      completedAttempts: attemptsSnapshot.size
    };
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    throw error;
  }
}

export interface AdminAnalyticsData {
  stats: DashboardStats & { averageScore: number };
  examStats: {
    name: string;
    attempts: number;
    avgScore: number;
  }[];
  scoreDistribution: { name: string; value: number }[];
}

export async function getAdminAnalytics(): Promise<AdminAnalyticsData> {
  try {
    const dashboardStats = await getAdminDashboardStats();
    
    // Get all submitted attempts for score analysis
    const attemptsRef = collection(db, "examAttempts");
    const attemptsQuery = query(attemptsRef, where("isSubmitted", "==", true));
    const attemptsSnapshot = await getDocs(attemptsQuery);
    const attempts = attemptsSnapshot.docs.map(doc => doc.data() as ExamAttempt);
    
    // Calculate global average score
    const totalScore = attempts.reduce((sum, a) => sum + (a.totalScore || 0), 0);
    const maxScore = attempts.reduce((sum, a) => sum + (a.maxScore || 0), 0);
    const averageScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    
    // Get exams for per-exam stats
    const examsRef = collection(db, "exams");
    const examsSnapshot = await getDocs(examsRef);
    const exams = examsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam));
    
    // Calculate per-exam stats
    const examStats = exams.slice(0, 6).map(exam => {
      const examAttempts = attempts.filter(a => a.examId === exam.examId);
      const examTotalScore = examAttempts.reduce((sum, a) => sum + (a.totalScore || 0), 0);
      const examMaxScore = examAttempts.reduce((sum, a) => sum + (a.maxScore || 0), 0);
      const examAvg = examMaxScore > 0 ? Math.round((examTotalScore / examMaxScore) * 100) : 0;
      
      return {
        name: exam.title.length > 15 ? exam.title.slice(0, 15) + "..." : exam.title,
        attempts: examAttempts.length,
        avgScore: examAvg
      };
    }).filter(e => e.attempts > 0);
    
    // Calculate score distribution
    const distribution = { excellent: 0, good: 0, average: 0, poor: 0 };
    attempts.forEach((a) => {
      if (!a.maxScore || !a.totalScore) return;
      const pct = (a.totalScore / a.maxScore) * 100;
      if (pct >= 80) distribution.excellent++;
      else if (pct >= 60) distribution.good++;
      else if (pct >= 40) distribution.average++;
      else distribution.poor++;
    });

    const scoreDistribution = [
      { name: "Excellent (80%+)", value: distribution.excellent },
      { name: "Good (60-79%)", value: distribution.good },
      { name: "Average (40-59%)", value: distribution.average },
      { name: "Poor (<40%)", value: distribution.poor },
    ].filter((d) => d.value > 0);

    return {
      stats: { ...dashboardStats, averageScore },
      examStats,
      scoreDistribution
    };
  } catch (error) {
    console.error("Error getting analytics:", error);
    throw error;
  }
}

export interface ResultWithDetails extends ExamAttempt {
  studentName: string;
  studentEmail: string;
  examTitle: string;
  resultsPublished: boolean;
}

export async function getAllExamResults(): Promise<ResultWithDetails[]> {
  try {
    // Get all submitted attempts
    const attemptsRef = collection(db, "examAttempts");
    const attemptsQuery = query(
      attemptsRef, 
      where("isSubmitted", "==", true)
      // Removed orderBy to avoid composite index requirement
    );
    const attemptsSnapshot = await getDocs(attemptsQuery);
    const attempts = attemptsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ExamAttempt & { id: string }));

    // Get archived results (from deleted exams)
    const archivedSnap = await getDocs(collection(db, "archivedResults"));
    const archived = archivedSnap.docs.map(d => ({
      id: d.id,
      ...d.data()
    })) as any[];

    // Get all exams to map titles and published status
    const examsRef = collection(db, "exams");
    const examsSnapshot = await getDocs(examsRef);
    const examsMap = new Map(examsSnapshot.docs.map(doc => {
      const data = doc.data() as Exam;
      return [data.examId, data];
    }));

    // Map attempts to results with details
    const liveResults: ResultWithDetails[] = attempts.map(attempt => {
      const exam = examsMap.get(attempt.examId);
      return {
        ...attempt,
        studentName: attempt.studentName || "Unknown",
        studentEmail: attempt.studentEmail || "N/A",
        examTitle: attempt.examTitle || exam?.title || "Unknown Exam",
        resultsPublished: exam?.resultsPublished || false
      };
    });
    
    // Map archived results (treat as published for viewing)
    const archivedResults: ResultWithDetails[] = archived.map(ar => ({
      ...(ar as any),
      id: ar.attemptId || ar.id,
      studentName: ar.studentName || "Unknown",
      studentEmail: ar.studentEmail || "N/A",
      examTitle: ar.examTitle || "Deleted Exam",
      resultsPublished: true
    }));

    // Client-side sort by submittedAt (descending)
    const results = [...liveResults, ...archivedResults];
    results.sort((a, b) => {
      const timeA = a.submittedAt?.seconds || 0;
      const timeB = b.submittedAt?.seconds || 0;
      return timeB - timeA;
    });

    return results;
  } catch (error) {
    console.error("Error getting all results:", error);
    throw error;
  }
}

export interface AdminDashboardData {
  stats: DashboardStats;
  recentExams: (Exam & { attemptCount: number })[];
  errors?: {
    exams?: string;
    students?: string;
    attempts?: string;
  };
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const stats: DashboardStats = {
    totalExams: 0,
    totalStudents: 0,
    activeExams: 0,
    completedAttempts: 0
  };
  
  const errors: AdminDashboardData['errors'] = {};
  let allExams: Exam[] = [];

  // 1. Fetch all exams
  try {
    const examsRef = collection(db, "exams");
    const examsSnapshot = await getDocs(examsRef);
    allExams = examsSnapshot.docs.map(doc => ({ ...doc.data() } as Exam));
    stats.totalExams = allExams.length;

    // Calculate active exams
    const now = new Date();
    stats.activeExams = allExams.filter(e => {
      try {
        let startTime: Date | null = null;
        let endTime: Date | null = null;

        if (e.startTime) {
          if (typeof (e.startTime as any).toDate === 'function') {
            startTime = (e.startTime as any).toDate();
          } else {
            startTime = new Date(e.startTime as any);
          }
        }

        if (e.endTime) {
          if (typeof (e.endTime as any).toDate === 'function') {
            endTime = (e.endTime as any).toDate();
          } else {
            endTime = new Date(e.endTime as any);
          }
        }
        
        // Invalid dates (NaN) should be treated as null (or handled)
        if (startTime && isNaN(startTime.getTime())) startTime = null;
        if (endTime && isNaN(endTime.getTime())) endTime = null;

        return e.isPublished &&
          (!startTime || startTime <= now) &&
          (!endTime || endTime >= now);
      } catch (err) {
        return false;
      }
    }).length;

  } catch (error: any) {
    console.error("Error fetching exams:", error);
    errors.exams = error.message || "Failed to fetch exams";
  }
  
  // 2. Fetch students count
  try {
    const usersRef = collection(db, "users");
    const studentsQuery = query(usersRef, where("role", "==", "student"));
    const studentsSnapshot = await getDocs(studentsQuery);
    stats.totalStudents = studentsSnapshot.size;
  } catch (error: any) {
    console.error("Error fetching students:", error);
    errors.students = error.message || "Failed to fetch students";
  }
  
  // 3. Fetch attempts count
    try {
      const attemptsRef = collection(db, "examAttempts");
      const attemptsQuery = query(attemptsRef, where("isSubmitted", "==", true));
      const attemptsSnapshot = await getDocs(attemptsQuery);
      console.log(`[AdminDashboard] Fetched ${attemptsSnapshot.size} attempts`);
      stats.completedAttempts = attemptsSnapshot.size;
    } catch (error: any) {
    console.error("Error fetching attempts:", error);
    errors.attempts = error.message || "Failed to fetch attempts";
  }
  
  // 5. Sort exams in memory for "recent exams"
  let recentExams: (Exam & { attemptCount: number })[] = [];
  try {
    if (allExams.length > 0) {
      const sortedExams = [...allExams].sort((a, b) => {
        const dateA = parseDate(a.createdAt);
        const dateB = parseDate(b.createdAt);
        
        const timeA = dateA ? dateA.getTime() : 0;
        const timeB = dateB ? dateB.getTime() : 0;

        return timeB - timeA;
      }).slice(0, 4);

      recentExams = await Promise.all(sortedExams.map(async (exam) => {
        try {
          const attemptsRef = collection(db, "examAttempts");
          const attemptsQuery = query(attemptsRef, where("examId", "==", exam.examId));
          const attemptsSnapshot = await getDocs(attemptsQuery);
          return {
            ...exam,
            attemptCount: attemptsSnapshot.size
          };
        } catch (e) {
          return { ...exam, attemptCount: 0 };
        }
      }));
    }
  } catch (error) {
    console.error("Error processing recent exams:", error);
  }
  
  return {
    stats,
    recentExams,
    errors
  };
}

// Examiner Management

export async function createExaminerAccount(email: string, password: string, name: string) {
  // Use a secondary app instance to avoid logging out the current admin
  // Check if app already exists to avoid duplicate app error
  let secondaryApp;
  try {
    secondaryApp = getApp("SecondaryApp");
  } catch (e) {
    secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
  }
  
  const secondaryAuth = getAuth(secondaryApp);
  await setPersistence(secondaryAuth, inMemoryPersistence);

  try {
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const user = userCredential.user;

    // Create user profile in Firestore (using main app's db instance)
    const userProfile = {
      userId: user.uid,
      email: user.email!,
      fullName: name,
      avatarUrl: null,
      role: 'admin', // Examiner
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    await setDoc(doc(db, 'users', user.uid), userProfile);
    
    // Sign out the secondary user so it doesn't persist
    await signOut(secondaryAuth);
    
    return user.uid;
  } catch (error) {
    console.error("Error creating examiner:", error);
    throw error;
  } finally {
     // Ideally we should delete the app, but it's async and might be tricky in some envs.
     // However, keeping it around is fine if we reuse it.
     // await deleteApp(secondaryApp); 
  }
}

export async function getExaminers(): Promise<UserProfile[]> {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("role", "==", "admin"));
    const snapshot = await getDocs(q);
    
    const examiners: UserProfile[] = [];
    snapshot.forEach((doc) => {
      examiners.push(doc.data() as UserProfile);
    });
    
    return examiners;
  } catch (error) {
    console.error("Error getting examiners:", error);
    throw error;
  }
}

export async function updateExaminer(userId: string, updates: Partial<UserProfile>) {
  try {
    const docRef = doc(db, "users", userId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error("Error updating examiner:", error);
    throw error;
  }
}

export async function toggleExaminerStatus(userId: string, disabled: boolean) {
  try {
    const docRef = doc(db, "users", userId);
    await updateDoc(docRef, {
      disabled,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error("Error toggling examiner status:", error);
    throw error;
  }
}

export async function deleteExaminer(userId: string) {
  try {
    // Only delete the Firestore doc. We can't delete Auth user without Admin SDK.
    // Deleting the doc prevents login/access because AuthContext checks for profile.
    await deleteDoc(doc(db, "users", userId));
  } catch (error) {
    console.error("Error deleting examiner:", error);
    throw error;
  }
}

// Check if user is super admin
export function isSuperAdmin(email: string): boolean {
  return email === "isak@gmail.com";
}
// Student Management Functions

export async function toggleStudentStatus(userId: string) {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error("Student not found");
    }

    const currentStatus = userDoc.data().disabled || false;
    await updateDoc(userRef, {
      disabled: !currentStatus,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error("Error toggling student status:", error);
    throw error;
  }
}

export async function deleteStudent(userId: string) {
  try {
    // Delete user profile from Firestore
    await deleteDoc(doc(db, "users", userId));

    // Note: We can't delete the Firebase Auth user without Admin SDK
    // But deleting the Firestore profile prevents login/access
  } catch (error) {
    console.error("Error deleting student:", error);
    throw error;
  }
}
