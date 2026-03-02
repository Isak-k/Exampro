import { Timestamp } from 'firebase/firestore';
import { UserPermissions } from '@/types/permissions';

export type AppRole = 'superadmin' | 'admin' | 'student';

export interface UserProfile {
  userId: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: AppRole;
  departmentId?: string; // Optional for admin, required for student ideally
  disabled?: boolean; // If true, user cannot login
  permissions?: UserPermissions; // Permissions for admin/superadmin roles
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Department {
  id: string;
  name: string;
  createdAt: Timestamp;
}

export interface Exam {
  examId: string;
  title: string;
  description: string | null;
  departmentId?: string; // Legacy single department support
  departmentIds?: string[]; // New multiple departments support
  createdBy: string;
  durationMinutes: number;
  maxAttempts: number;
  isPublished: boolean;
  resultsPublished: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  startTime: Timestamp | null;
  endTime: Timestamp | null;
  questionCount: number;
  totalMarks: number;
  accessPassword?: string | null; // Optional password/PIN to access exam
  createdAt: Timestamp;
  updatedAt: Timestamp;
}


export interface Question {
  questionId: string;
  examId: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  marks: number;
  orderIndex: number;
  feedbackType: 'instant' | 'hidden';
  explanation?: string;
  createdAt: Timestamp;
}

export interface ExamAttempt {
  id?: string; // Firestore document ID
  attemptId: string;
  examId: string;
  studentId: string;
  startedAt: Timestamp;
  submittedAt: Timestamp | null;
  isSubmitted: boolean;
  timeSpentSeconds: number | null;
  totalScore: number | null;
  maxScore: number | null;
  examTitle: string;
  studentName: string;
  studentEmail: string;
  createdAt: Timestamp;
}

export interface Answer {
  questionId: string;
  attemptId: string;
  selectedOptionIndex: number | null;
  isCorrect: boolean | null;
  timeSpentSeconds: number | null;
  answeredAt: Timestamp | null;
}

// Leaderboard Types

export interface LeaderboardEntry {
  studentId: string;
  studentName: string;
  departmentId: string;
  totalPoints: number;
  averageScore: number;
  examCount: number;
  rankPosition: number;
}

export interface DepartmentRanking {
  departmentId: string;
  departmentName: string;
  totalDepartmentScore: number;
  averageScore: number;
  activeStudentCount: number;
  rankPosition: number;
}

export interface StudentStats {
  studentId: string;
  totalPoints: number;
  averageScore: number;
  examCount: number;
  departmentId: string;
  lastExamDate: Timestamp | null;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  totalStudents: number;
  lastUpdated: Timestamp;
  departmentId: string;
  hasMore?: boolean; // Indicates if there are more entries to load
  nextCursor?: number; // Next page cursor (rank position)
}

export interface DepartmentLeaderboardResponse {
  rankings: DepartmentRanking[];
  totalDepartments: number;
  lastUpdated: Timestamp;
}

export interface RankingCalculation {
  studentId: string;
  totalPoints: number;
  averageScore: number;
  examCount: number;
}

// Leaderboard Error Types

export type LeaderboardErrorCode = 
  | 'INVALID_DEPARTMENT'
  | 'MISSING_REQUIRED_FIELD'
  | 'INVALID_EXAM_DATA'
  | 'UNAUTHORIZED_ACCESS'
  | 'CALCULATION_ERROR'
  | 'CACHE_ERROR';

export interface LeaderboardError {
  code: LeaderboardErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

// Validation Schemas (Type Guards)

export function isValidLeaderboardEntry(entry: unknown): entry is LeaderboardEntry {
  if (typeof entry !== 'object' || entry === null) return false;
  const e = entry as Record<string, unknown>;
  return (
    typeof e.studentId === 'string' &&
    typeof e.studentName === 'string' &&
    typeof e.departmentId === 'string' &&
    typeof e.totalPoints === 'number' &&
    typeof e.averageScore === 'number' &&
    typeof e.examCount === 'number' &&
    typeof e.rankPosition === 'number'
  );
}

export function isValidDepartmentRanking(ranking: unknown): ranking is DepartmentRanking {
  if (typeof ranking !== 'object' || ranking === null) return false;
  const r = ranking as Record<string, unknown>;
  return (
    typeof r.departmentId === 'string' &&
    typeof r.departmentName === 'string' &&
    typeof r.totalDepartmentScore === 'number' &&
    typeof r.averageScore === 'number' &&
    typeof r.activeStudentCount === 'number' &&
    typeof r.rankPosition === 'number'
  );
}

export function isValidStudentStats(stats: unknown): stats is StudentStats {
  if (typeof stats !== 'object' || stats === null) return false;
  const s = stats as Record<string, unknown>;
  return (
    typeof s.studentId === 'string' &&
    typeof s.totalPoints === 'number' &&
    typeof s.averageScore === 'number' &&
    typeof s.examCount === 'number' &&
    typeof s.departmentId === 'string' &&
    (s.lastExamDate === null || s.lastExamDate instanceof Timestamp)
  );
}

export function isValidRankingCalculation(calc: unknown): calc is RankingCalculation {
  if (typeof calc !== 'object' || calc === null) return false;
  const c = calc as Record<string, unknown>;
  return (
    typeof c.studentId === 'string' &&
    typeof c.totalPoints === 'number' &&
    typeof c.averageScore === 'number' &&
    typeof c.examCount === 'number'
  );
}
