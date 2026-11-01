import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase.ts';
import {
  Student,
  Teacher,
  SchoolClass,
  AttendanceRecord,
  ExamResult,
  User,
} from '../types/index.ts';

type SyncCallback = {
  onStudentsChange?: (students: Student[]) => void;
  onTeachersChange?: (teachers: Teacher[]) => void;
  onClassesChange?: (classes: SchoolClass[]) => void;
  onAttendanceChange?: (records: AttendanceRecord[]) => void;
  onExamResultsChange?: (results: ExamResult[]) => void;
  onUsersChange?: (users: User[]) => void;
};

let unsubscribers: Unsubscribe[] = [];

/**
 * Start Real-Time Firestore Synchronization
 */
export function startFirestoreSync(callbacks: SyncCallback): () => void {
  // Clear any existing subscriptions
  stopFirestoreSync();

  try {
    // 1. Sync Students Collection
    const studentsUnsub = onSnapshot(
      collection(db, 'students'),
      (snapshot) => {
        const remoteStudents: Student[] = [];
        snapshot.forEach((docSnap) => {
          remoteStudents.push(docSnap.data() as Student);
        });
        callbacks.onStudentsChange?.(remoteStudents);
      },
      (error) => {
        console.warn('Students sync warning (continuing with local cache):', error.message);
      }
    );
    unsubscribers.push(studentsUnsub);

    // 2. Sync Teachers Collection
    const teachersUnsub = onSnapshot(
      collection(db, 'teachers'),
      (snapshot) => {
        const remoteTeachers: Teacher[] = [];
        snapshot.forEach((docSnap) => {
          remoteTeachers.push(docSnap.data() as Teacher);
        });
        callbacks.onTeachersChange?.(remoteTeachers);
      },
      (error) => {
        console.warn('Teachers sync warning (continuing with local cache):', error.message);
      }
    );
    unsubscribers.push(teachersUnsub);

    // 3. Sync Classes Collection
    const classesUnsub = onSnapshot(
      collection(db, 'classes'),
      (snapshot) => {
        const remoteClasses: SchoolClass[] = [];
        snapshot.forEach((docSnap) => {
          remoteClasses.push(docSnap.data() as SchoolClass);
        });
        callbacks.onClassesChange?.(remoteClasses);
      },
      (error) => {
        console.warn('Classes sync warning (continuing with local cache):', error.message);
      }
    );
    unsubscribers.push(classesUnsub);

    // 4. Sync Attendance Records
    const attendanceUnsub = onSnapshot(
      collection(db, 'attendanceRecords'),
      (snapshot) => {
        const records: AttendanceRecord[] = [];
        snapshot.forEach((docSnap) => {
          records.push(docSnap.data() as AttendanceRecord);
        });
        callbacks.onAttendanceChange?.(records);
      },
      (error) => {
        console.warn('Attendance sync warning (continuing with local cache):', error.message);
      }
    );
    unsubscribers.push(attendanceUnsub);

    // 5. Sync Exam Results
    const examResultsUnsub = onSnapshot(
      collection(db, 'examResults'),
      (snapshot) => {
        const results: ExamResult[] = [];
        snapshot.forEach((docSnap) => {
          results.push(docSnap.data() as ExamResult);
        });
        callbacks.onExamResultsChange?.(results);
      },
      (error) => {
        console.warn('Exam results sync warning (continuing with local cache):', error.message);
      }
    );
    unsubscribers.push(examResultsUnsub);

    // 6. Sync Users
    const usersUnsub = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const users: User[] = [];
        snapshot.forEach((docSnap) => {
          users.push(docSnap.data() as User);
        });
        if (users.length > 0) {
          callbacks.onUsersChange?.(users);
        }
      },
      (error) => {
        console.warn('Users sync warning (continuing with local cache):', error.message);
      }
    );
    unsubscribers.push(usersUnsub);
  } catch (err) {
    console.warn('Failed to initiate real-time Firestore listeners:', err);
  }

  return stopFirestoreSync;
}

export function stopFirestoreSync(): void {
  unsubscribers.forEach((unsub) => {
    try {
      unsub();
    } catch {
      // ignore
    }
  });
  unsubscribers = [];
}

/**
 * Firestore Mutations with Standard Error Handling
 */
export async function syncStudentToCloud(student: Student): Promise<void> {
  const path = `students/${student.id}`;
  try {
    await setDoc(doc(db, 'students', student.id), student);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removeStudentFromCloud(studentId: string): Promise<void> {
  const path = `students/${studentId}`;
  try {
    await deleteDoc(doc(db, 'students', studentId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function syncTeacherToCloud(teacher: Teacher): Promise<void> {
  const path = `teachers/${teacher.id}`;
  try {
    await setDoc(doc(db, 'teachers', teacher.id), teacher);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removeTeacherFromCloud(teacherId: string): Promise<void> {
  const path = `teachers/${teacherId}`;
  try {
    await deleteDoc(doc(db, 'teachers', teacherId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function syncClassToCloud(cls: SchoolClass): Promise<void> {
  const path = `classes/${cls.id}`;
  try {
    await setDoc(doc(db, 'classes', cls.id), cls);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removeClassFromCloud(classId: string): Promise<void> {
  const path = `classes/${classId}`;
  try {
    await deleteDoc(doc(db, 'classes', classId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function syncAttendanceRecordToCloud(record: AttendanceRecord): Promise<void> {
  const path = `attendanceRecords/${record.id}`;
  try {
    await setDoc(doc(db, 'attendanceRecords', record.id), record);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncExamResultToCloud(result: ExamResult): Promise<void> {
  const path = `examResults/${result.id}`;
  try {
    await setDoc(doc(db, 'examResults', result.id), result);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncUserToCloud(user: User): Promise<void> {
  const path = `users/${user.id}`;
  try {
    await setDoc(doc(db, 'users', user.id), user);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
