import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
  deleteField,
  getDocFromCache,
  getDocsFromCache
} from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';
import { Exam, Question } from '@/integrations/firebase/types';

export async function createExam(examData: Omit<Exam, 'examId' | 'createdAt' | 'updatedAt'>) {
  const base = { ...examData };
  const sanitized: Record<string, any> = {};
  Object.entries(base).forEach(([k, v]) => {
    if (v !== undefined) sanitized[k] = v;
  });
  const exam = { ...sanitized, createdAt: Timestamp.now(), updatedAt: Timestamp.now() };
  
  const docRef = await addDoc(collection(db, 'exams'), exam);
  
  // Update the document with its own ID as examId
  await updateDoc(docRef, {
    examId: docRef.id
  });
  
  return docRef.id;
}

export async function getExam(examId: string): Promise<Exam | null> {
  const docRef = doc(db, 'exams', examId);
  
  try {
    // Try regular fetch (uses cache automatically with offline persistence)
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        examId: data.examId || docSnap.id,
        ...data
      } as Exam;
    }
  } catch (error) {
    console.warn(`Error fetching exam ${examId}, trying cache:`, error);
    try {
      // Fallback to cache-only
      const cachedSnap = await getDocFromCache(docRef);
      if (cachedSnap.exists()) {
        const data = cachedSnap.data();
        return {
          examId: data.examId || cachedSnap.id,
          ...data
        } as Exam;
      }
    } catch (cacheError) {
      console.error('Cache fetch failed:', cacheError);
    }
  }
  
  return null;
}

export async function updateExam(examId: string, updates: Partial<Exam>) {
  const docRef = doc(db, 'exams', examId);
  const payload: Record<string, any> = {};
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      payload[key] = value;
    } else {
      if (key === 'departmentId' || key === 'departmentIds') {
        payload[key] = deleteField();
      }
    }
  });
  payload.updatedAt = Timestamp.now();
  await updateDoc(docRef, payload);
}

/**
 * Delete an exam and ALL of its related data:
 * - questions subcollection
 * - blockedStudents subcollection
 * - examAttempts where examId == examId
 *   - answers subcollection under each attempt
 * - finally, the exam document itself
 *
 * Uses batched deletes in chunks to respect Firestore limits.
 */
export async function deleteExam(examId: string) {
  // Helper to batch delete document snapshots in chunks of 500
  const batchDeleteDocs = async (snapshots: Array<{ ref: any }>) => {
    const CHUNK = 450; // keep headroom
    for (let i = 0; i < snapshots.length; i += CHUNK) {
      const slice = snapshots.slice(i, i + CHUNK);
      const batch = writeBatch(db);
      slice.forEach((s) => batch.delete(s.ref));
      await batch.commit();
    }
  };

  // 1) Delete questions
  const questionsSnap = await getDocs(collection(db, 'exams', examId, 'questions'));
  if (!questionsSnap.empty) {
    await batchDeleteDocs(questionsSnap.docs as any);
  }

  // 2) Delete blocked students
  const blockedSnap = await getDocs(collection(db, 'exams', examId, 'blockedStudents'));
  if (!blockedSnap.empty) {
    await batchDeleteDocs(blockedSnap.docs as any);
  }

  // 3) Archive submitted attempts, then delete attempts and their answers
  const attemptsSnap = await getDocs(query(collection(db, 'examAttempts'), where('examId', '==', examId)));
  if (!attemptsSnap.empty) {
    for (const attempt of attemptsSnap.docs) {
      const aData: any = attempt.data();
      // Archive submitted attempts for All Results/My Results history
      if (aData.isSubmitted) {
        await addDoc(collection(db, 'archivedResults'), {
          attemptId: attempt.id,
          examId,
          examTitle: aData.examTitle || null,
          studentId: aData.studentId,
          studentName: aData.studentName || null,
          studentEmail: aData.studentEmail || null,
          totalScore: aData.totalScore ?? null,
          maxScore: aData.maxScore ?? null,
          timeSpentSeconds: aData.timeSpentSeconds ?? null,
          submittedAt: aData.submittedAt || Timestamp.now(),
          deletedAt: Timestamp.now()
        });
      }
      const answersSnap = await getDocs(collection(db, 'examAttempts', attempt.id, 'answers'));
      if (!answersSnap.empty) {
        await batchDeleteDocs(answersSnap.docs as any);
      }
    }
    await batchDeleteDocs(attemptsSnap.docs as any);
  }

  // 4) Delete the exam document itself
  const examRef = doc(db, 'exams', examId);
  await deleteDoc(examRef);
}

export async function getExamsByCreator(userId: string): Promise<Exam[]> {
  const q = query(
    collection(db, 'exams'),
    where('createdBy', '==', userId)
    // orderBy('createdAt', 'desc') // Removed to avoid composite index requirement
  );
  
  const querySnapshot = await getDocs(q);
  const exams = querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      examId: data.examId || doc.id, // Use examId from data, fallback to doc.id
      ...data
    } as Exam;
  });

  // Client-side sort
  return exams.sort((a, b) => {
    const timeA = a.createdAt?.seconds || 0;
    const timeB = b.createdAt?.seconds || 0;
    return timeB - timeA;
  });
}

export async function getAllExams(): Promise<Exam[]> {
  const q = query(
    collection(db, 'exams'),
    orderBy('createdAt', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      examId: data.examId || doc.id, // Use examId from data, fallback to doc.id
      ...data
    } as Exam;
  });
}

export async function getPublishedExams(studentDepartmentId?: string): Promise<Exam[]> {
  const q = query(
    collection(db, 'exams'),
    where('isPublished', '==', true)
  );
  
  try {
    // Try regular fetch (uses cache automatically)
    const querySnapshot = await getDocs(q);
    let exams = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        examId: data.examId || doc.id,
        ...data
      } as Exam;
    });

    // Filter by department
    exams = exams.filter(exam => {
      if (!exam.departmentId && (!exam.departmentIds || exam.departmentIds.length === 0)) {
        return true;
      }
      if (exam.departmentId && studentDepartmentId && exam.departmentId === studentDepartmentId) {
        return true;
      }
      if (exam.departmentIds && exam.departmentIds.length > 0 && studentDepartmentId) {
        return exam.departmentIds.includes(studentDepartmentId);
      }
      return false;
    });

    // Client-side sort
    return exams.sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });
  } catch (error) {
    console.warn('Error fetching published exams, trying cache:', error);
    try {
      // Fallback to cache-only
      const cachedSnapshot = await getDocsFromCache(q);
      let exams = cachedSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          examId: data.examId || doc.id,
          ...data
        } as Exam;
      });

      exams = exams.filter(exam => {
        if (!exam.departmentId && (!exam.departmentIds || exam.departmentIds.length === 0)) {
          return true;
        }
        if (exam.departmentId && studentDepartmentId && exam.departmentId === studentDepartmentId) {
          return true;
        }
        if (exam.departmentIds && exam.departmentIds.length > 0 && studentDepartmentId) {
          return exam.departmentIds.includes(studentDepartmentId);
        }
        return false;
      });

      return exams.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
    } catch (cacheError) {
      console.error('Cache fetch failed:', cacheError);
      return [];
    }
  }
}

// Question management
export async function addQuestion(examId: string, questionData: Omit<Question, 'questionId' | 'createdAt'>) {
  const question = {
    ...questionData,
    createdAt: Timestamp.now()
  };
  
  const docRef = await addDoc(collection(db, 'exams', examId, 'questions'), question);
  
  // Update exam's question count and total marks
  await updateExamStats(examId);
  
  return docRef.id;
}

export async function getQuestions(examId: string): Promise<Question[]> {
  const q = query(
    collection(db, 'exams', examId, 'questions'),
    orderBy('orderIndex', 'asc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    questionId: doc.id,
    ...doc.data()
  })) as Question[];
}

export async function updateQuestion(examId: string, questionId: string, updates: Partial<Question>) {
  const docRef = doc(db, 'exams', examId, 'questions', questionId);
  await updateDoc(docRef, updates);
  
  // Update exam stats if marks changed
  if (updates.marks !== undefined) {
    await updateExamStats(examId);
  }
}

export async function deleteQuestion(examId: string, questionId: string) {
  const docRef = doc(db, 'exams', examId, 'questions', questionId);
  await deleteDoc(docRef);
  
  // Update exam's question count and total marks
  await updateExamStats(examId);
}

export async function saveQuestionsBatch(examId: string, questions: Omit<Question, 'questionId' | 'createdAt'>[]) {
  const batch = writeBatch(db);
  
  questions.forEach(questionData => {
    // Create a reference with an auto-generated ID in the questions subcollection
    const newDocRef = doc(collection(db, 'exams', examId, 'questions'));
    
    batch.set(newDocRef, {
      ...questionData,
      createdAt: Timestamp.now()
    });
  });

  await batch.commit();
  
  // Update exam stats
  await updateExamStats(examId);
}

// Helper function to update exam statistics
async function updateExamStats(examId: string) {
  const questions = await getQuestions(examId);
  const questionCount = questions.length;
  // Handle cases where marks might be undefined or invalid
  const totalMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);
  
  await updateExam(examId, { questionCount, totalMarks });
}

// Student blocking
export async function blockStudent(examId: string, studentId: string, reason?: string) {
  const docRef = doc(db, 'exams', examId, 'blockedStudents', studentId);
  await updateDoc(docRef, {
    studentId,
    examId,
    reason: reason || null,
    blockedAt: Timestamp.now()
  });
}

export async function unblockStudent(examId: string, studentId: string) {
  const docRef = doc(db, 'exams', examId, 'blockedStudents', studentId);
  await deleteDoc(docRef);
}

export async function isStudentBlocked(examId: string, studentId: string): Promise<boolean> {
  const docRef = doc(db, 'exams', examId, 'blockedStudents', studentId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists();
}
