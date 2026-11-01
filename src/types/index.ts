/**
 * Toulsambour Secondary School Management System Types
 * ប្រព័ន្ធគ្រប់គ្រងសាលារៀន អនុវិទ្យាល័យទួលសំបួរ
 */

export type UserRole = 'admin' | 'director' | 'teacher' | 'student' | 'parent';

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: UserRole;
  email: string;
  phone?: string;
  avatar?: string;
  status?: 'active' | 'inactive';
  associatedId?: string; // teacherId, studentId, or parentId
  createdAt?: string;
}

export type Gender = 'ប្រុស' | 'ស្រី';

export type StudentStatus = 'កំពុងសិក្សា' | 'ផ្អាកការសិក្សា' | 'បោះបង់' | 'បញ្ចប់ការសិក្សា';

export interface Student {
  id: string;
  studentId: string; // e.g., 'STU-0701'
  photo: string;
  khmerName: string;
  latinName: string;
  gender: Gender;
  dob: string; // YYYY-MM-DD
  pob: string; // Place of birth
  address: string; // Current address
  phone: string;
  parentName: string;
  parentPhone: string;
  parentRelationship: string; // ឪពុក, ម្ដាយ, អាណាព្យាបាល
  classId: string;
  status: StudentStatus;
  enrollmentYear: string;
}

export type TeacherStatus = 'កំពុងបង្រៀន' | 'សម្រាកព្យាបាល' | 'ផ្ទេរចេញ' | 'ចូលនិវត្តន៍';

export interface Teacher {
  id: string;
  teacherId: string; // e.g., 'TCH-001'
  photo: string;
  name: string;
  gender: Gender;
  dob: string;
  phone: string;
  email: string;
  address: string;
  subjects: string[]; // Subject IDs or names
  assignedClassId?: string; // Homeroom class
  joinDate: string;
  status: TeacherStatus;
  degree: string;
}

export type EducationLevelType = 'kindergarten' | 'primary' | 'secondary' | 'high_school' | 'university';

export interface EducationLevel {
  id: string;
  nameKm: string;
  nameEn: string;
  type: EducationLevelType;
  gradeLevels: string[]; // e.g. ['ថ្នាក់ទី៧', 'ថ្នាក់ទី៨', 'ថ្នាក់ទី៩']
}

export interface SchoolClass {
  id: string;
  name: string; // e.g., 'ថ្នាក់ទី ៧ ក'
  gradeLevel: string; // 'ថ្នាក់ទី ៧'
  educationLevel: EducationLevelType;
  academicYearId: string;
  homeroomTeacherId?: string;
  homeroomTeacherName?: string;
  roomNumber: string;
  maxCapacity: number;
  currentStudentCount?: number;
}

export interface Subject {
  id: string;
  code: string; // e.g., 'KHM-07'
  nameKm: string;
  nameEn: string;
  gradeLevel: string;
  hoursPerWeek: number;
  teacherId?: string;
  teacherName?: string;
}

export type AttendanceStatus = 
  | 'present'               // មានវត្តមាន
  | 'absent_permission'     // អវត្តមានមានច្បាប់
  | 'absent_no_permission'  // អវត្តមានឥតច្បាប់
  | 'late'                  // មកយឺត
  | 'early_leave';          // ចេញមុនម៉ោង

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  studentName?: string;
  classId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  reason?: string;
  subjectId?: string;
  recordedBy: string;
  recordedByName?: string;
  createdAt: string;
}

export interface AttendanceSession {
  id: string;
  classId: string;
  date: string;
  period: string; // 'ព្រឹក ម៉ោងទី ១', 'ព្រឹក ម៉ោងទី ២', 'ពេញមួយថ្ងៃ'
  subjectId?: string;
  recordedBy: string;
  createdAt: string;
}

export interface TimetableSlot {
  id: string;
  classId: string;
  dayOfWeek: 'ច័ន្ទ' | 'អង្គារ' | 'ពុធ' | 'ព្រហស្បតិ៍' | 'សុក្រ' | 'សៅរ៍';
  period: number; // 1 to 6
  startTime: string; // e.g. '07:00'
  endTime: string;   // e.g. '07:50'
  subjectId: string;
  subjectName?: string;
  teacherId: string;
  teacherName?: string;
  room: string;
}

export type ExamType = 'monthly' | 'semester' | 'annual';

export interface Exam {
  id: string;
  title: string; // e.g. 'ការប្រឡងប្រចាំខែ តុលា', 'ការប្រឡងឆមាសទី ១'
  type: ExamType;
  academicYearId: string;
  semester: string; // 'ឆមាសទី ១' or 'ឆមាសទី ២'
  month?: string;
  date: string;
  maxScorePerSubject: number;
  subjectIds?: string[];
}

export interface ExamResult {
  id: string;
  examId: string;
  studentId: string;
  studentName?: string;
  classId: string;
  scores: Record<string, number>; // subjectId -> score
  totalScore: number;
  average: number;
  rank: number;
  gradeLetter: string; // 'ល្អប្រសើរ (A)', 'ល្អណាស់ (B)', 'ល្អ (C)', 'មធ្យម (D)', 'ខ្សោយ (F)'
  remarks?: string;
}

export interface AcademicYear {
  id: string;
  name: string; // e.g. '២០២៥-២០២៦'
  startDate: string;
  endDate: string;
  currentSemester: string; // 'ឆមាសទី ១' or 'ឆមាសទី ២'
  isCurrent: boolean;
}

export interface NotificationItem {
  id: string;
  type: 'telegram' | 'sms' | 'system';
  recipientName: string;
  recipientPhone: string;
  studentName: string;
  title: string;
  message: string;
  status: 'sent' | 'pending' | 'failed';
  sentAt: string;
}

export interface AuditLogItem {
  id: string;
  userName: string;
  role: string;
  action: string;
  details: string;
  timestamp: string;
}
