import {
  Student,
  Teacher,
  SchoolClass,
  Subject,
  AttendanceRecord,
  AttendanceSession,
  TimetableSlot,
  Exam,
  ExamResult,
  AcademicYear,
  User,
  NotificationItem,
  AuditLogItem,
  AttendanceStatus,
  BannerSlide,
  StudentBehaviorRecord,
} from '../types/index.ts';
import {
  startFirestoreSync,
  syncStudentToCloud,
  removeStudentFromCloud,
  syncTeacherToCloud,
  removeTeacherFromCloud,
  syncClassToCloud,
  removeClassFromCloud,
  syncAttendanceRecordToCloud,
  removeAttendanceRecordFromCloud,
  syncExamResultToCloud,
  syncUserToCloud,
  toSafeFirestoreId,
} from './firebaseSync.ts';

const DB_KEY = 'toulsambour_school_db_v4';

export interface SchoolDatabase {
  systemAccessCode: string; // The single universal login passcode for all users
  users: User[];
  students: Student[];
  teachers: Teacher[];
  classes: SchoolClass[];
  subjects: Subject[];
  timetable: TimetableSlot[];
  attendanceSessions: AttendanceSession[];
  attendanceRecords: AttendanceRecord[];
  exams: Exam[];
  examResults: ExamResult[];
  academicYears: AcademicYear[];
  notifications: NotificationItem[];
  auditLogs: AuditLogItem[];
  banners: BannerSlide[];
  behaviorRecords: StudentBehaviorRecord[];
  telegramSettings: {
    botUsername: string;
    botToken: string;
    chatId: string;
    isEnabled: boolean;
  };
}

const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin',
    username: 'admin',
    password: 'admin123',
    name: 'រដ្ឋបាលសាលារួម (លោក ស៊ុយ បូរ៉ា)',
    role: 'admin',
    email: 'admin@toulsambour.edu.kh',
    phone: '012 888 999',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    createdAt: '2025-10-01',
  },
];

const INITIAL_ACADEMIC_YEARS: AcademicYear[] = [
  {
    id: 'ay-2025-2026',
    name: '២០២៥-២០២៦',
    startDate: '2025-10-01',
    endDate: '2026-07-31',
    currentSemester: 'ឆមាសទី ១',
    isCurrent: true,
  },
  {
    id: 'ay-2024-2025',
    name: '២០២៤-២០២៥',
    startDate: '2024-10-01',
    endDate: '2025-07-31',
    currentSemester: 'ឆមាសទី ២',
    isCurrent: false,
  },
];

const INITIAL_CLASSES: SchoolClass[] = [
  {
    id: 'cls-7a',
    name: 'ថ្នាក់ទី ៧ ក',
    gradeLevel: 'ថ្នាក់ទី ៧',
    educationLevel: 'secondary',
    academicYearId: 'ay-2025-2026',
    roomNumber: 'បន្ទប់ ១០១',
    maxCapacity: 40,
    currentStudentCount: 0,
  },
  {
    id: 'cls-7b',
    name: 'ថ្នាក់ទី ៧ ខ',
    gradeLevel: 'ថ្នាក់ទី ៧',
    educationLevel: 'secondary',
    academicYearId: 'ay-2025-2026',
    roomNumber: 'បន្ទប់ ១០២',
    maxCapacity: 40,
    currentStudentCount: 0,
  },
  {
    id: 'cls-8a',
    name: 'ថ្នាក់ទី ៨ ក',
    gradeLevel: 'ថ្នាក់ទី ៨',
    educationLevel: 'secondary',
    academicYearId: 'ay-2025-2026',
    roomNumber: 'បន្ទប់ ២០១',
    maxCapacity: 40,
    currentStudentCount: 0,
  },
  {
    id: 'cls-9a',
    name: 'ថ្នាក់ទី ៩ ក',
    gradeLevel: 'ថ្នាក់ទី ៩',
    educationLevel: 'secondary',
    academicYearId: 'ay-2025-2026',
    roomNumber: 'បន្ទប់ ៣០១',
    maxCapacity: 40,
    currentStudentCount: 0,
  },
];

const INITIAL_TEACHERS: Teacher[] = [
  {
    id: 'tch-1',
    teacherId: 'TCH-001',
    name: 'កែវ សុខា',
    gender: 'ស្រី',
    dob: '1985-04-12',
    phone: '012 345 671',
    email: 'keo.sokha@toulsambour.edu.kh',
    address: 'ភូមិទួលសំបួរ ឃុំទួលសំបួរ ស្រុកស្ទឹងត្រង់',
    subjects: ['ភាសាខ្មែរ', 'ប្រវត្តិវិទ្យា', 'ពលរដ្ឋវិទ្យា'],
    assignedClassId: 'cls-7a',
    joinDate: '2015-10-01',
    status: 'កំពុងបង្រៀន',
    degree: 'បរិញ្ញាបត្រអក្សរសាស្ត្រខ្មែរ (NIE)',
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
  },
  {
    id: 'tch-2',
    teacherId: 'TCH-002',
    name: 'ចាន់ ណារិន',
    gender: 'ប្រុស',
    dob: '1982-08-20',
    phone: '097 555 123',
    email: 'chan.narin@toulsambour.edu.kh',
    address: 'ស្រុកស្ទឹងត្រង់ ខេត្តកំពង់ចាម',
    subjects: ['គណិតវិទ្យា', 'រូបវិទ្យា'],
    assignedClassId: 'cls-7b',
    joinDate: '2012-10-01',
    status: 'កំពុងបង្រៀន',
    degree: 'បរិញ្ញាបត្រគណិតវិទ្យា (NIE)',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
  },
  {
    id: 'tch-3',
    teacherId: 'TCH-003',
    name: 'សេង វិបុល',
    gender: 'ប្រុស',
    dob: '1989-11-15',
    phone: '088 777 888',
    email: 'seng.vibul@toulsambour.edu.kh',
    address: 'ស្រុកស្ទឹងត្រង់ ខេត្តកំពង់ចាម',
    subjects: ['គីមីវិទ្យា', 'ជីវវិទ្យា', 'ផែនដីវិទ្យា'],
    assignedClassId: 'cls-8a',
    joinDate: '2018-10-01',
    status: 'កំពុងបង្រៀន',
    degree: 'បរិញ្ញាបត្រវិទ្យាសាស្ត្រ (NIE)',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
  },
  {
    id: 'tch-4',
    teacherId: 'TCH-004',
    name: 'ប៊ុន ថុល',
    gender: 'ប្រុស',
    dob: '1990-03-25',
    phone: '010 999 000',
    email: 'bun.thol@toulsambour.edu.kh',
    address: 'ស្រុកស្ទឹងត្រង់ ខេត្តកំពង់ចាម',
    subjects: ['ភាសាអង់គ្លេស', 'បច្ចេកវិទ្យា/ICT'],
    assignedClassId: 'cls-9a',
    joinDate: '2019-10-01',
    status: 'កំពុងបង្រៀន',
    degree: 'បរិញ្ញាបត្រភាសាអង់គ្លេស (RUPP)',
    photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
  },
];

const INITIAL_SUBJECTS: Subject[] = [
  { id: 'sbj-khmer', code: 'KHM-07', nameKm: 'ភាសាខ្មែរ', nameEn: 'Khmer Language', gradeLevel: 'ថ្នាក់ទី ៧', hoursPerWeek: 6, teacherName: 'កែវ សុខា' },
  { id: 'sbj-math', code: 'MTH-07', nameKm: 'គណិតវិទ្យា', nameEn: 'Mathematics', gradeLevel: 'ថ្នាក់ទី ៧', hoursPerWeek: 6, teacherName: 'ចាន់ ណារិន' },
  { id: 'sbj-physics', code: 'PHY-07', nameKm: 'រូបវិទ្យា', nameEn: 'Physics', gradeLevel: 'ថ្នាក់ទី ៧', hoursPerWeek: 3, teacherName: 'ចាន់ ណារិន' },
  { id: 'sbj-chem', code: 'CHM-07', nameKm: 'គីមីវិទ្យា', nameEn: 'Chemistry', gradeLevel: 'ថ្នាក់ទី ៧', hoursPerWeek: 2, teacherName: 'សេង វិបុល' },
  { id: 'sbj-bio', code: 'BIO-07', nameKm: 'ជីវវិទ្យា', nameEn: 'Biology', gradeLevel: 'ថ្នាក់ទី ៧', hoursPerWeek: 3, teacherName: 'សេង វិបុល' },
  { id: 'sbj-earth', code: 'EAR-07', nameKm: 'ផែនដីវិទ្យា', nameEn: 'Earth Science', gradeLevel: 'ថ្នាក់ទី ៧', hoursPerWeek: 2, teacherName: 'សេង វិបុល' },
  { id: 'sbj-history', code: 'HIS-07', nameKm: 'ប្រវត្តិវិទ្យា', nameEn: 'History', gradeLevel: 'ថ្នាក់ទី ៧', hoursPerWeek: 2, teacherName: 'កែវ សុខា' },
  { id: 'sbj-geo', code: 'GEO-07', nameKm: 'ភូមិវិទ្យា', nameEn: 'Geography', gradeLevel: 'ថ្នាក់ទី ៧', hoursPerWeek: 2, teacherName: 'កែវ សុខា' },
  { id: 'sbj-civics', code: 'CIV-07', nameKm: 'ពលរដ្ឋវិទ្យា', nameEn: 'Civics & Morals', gradeLevel: 'ថ្នាក់ទី ៧', hoursPerWeek: 2, teacherName: 'កែវ សុខា' },
  { id: 'sbj-eng', code: 'ENG-07', nameKm: 'ភាសាអង់គ្លេស', nameEn: 'English Language', gradeLevel: 'ថ្នាក់ទី ៧', hoursPerWeek: 4, teacherName: 'ប៊ុន ថុល' },
  { id: 'sbj-ict', code: 'ICT-07', nameKm: 'បច្ចេកវិទ្យា/ICT', nameEn: 'Information Tech', gradeLevel: 'ថ្នាក់ទី ៧', hoursPerWeek: 2, teacherName: 'ប៊ុន ថុល' },
  { id: 'sbj-pe', code: 'PE-07', nameKm: 'អប់រំកាយ និងកីឡា', nameEn: 'Physical Education', gradeLevel: 'ថ្នាក់ទី ៧', hoursPerWeek: 2, teacherName: 'ចាន់ ណារិន' },
];

const INITIAL_STUDENTS: Student[] = [];

const INITIAL_ATTENDANCE_SESSIONS: AttendanceSession[] = [];

const INITIAL_ATTENDANCE_RECORDS: AttendanceRecord[] = [];

const INITIAL_TIMETABLE: TimetableSlot[] = [
  // ថ្នាក់ទី ៧ ក (cls-7a)
  { id: 'tt-1', classId: 'cls-7a', dayOfWeek: 'ច័ន្ទ', period: 1, startTime: '07:00', endTime: '07:50', subjectId: 'sbj-math', subjectName: 'គណិតវិទ្យា', teacherId: 'tch-2', teacherName: 'ចាន់ ណារិន', room: 'បន្ទប់ ១០១' },
  { id: 'tt-2', classId: 'cls-7a', dayOfWeek: 'ច័ន្ទ', period: 2, startTime: '07:55', endTime: '08:45', subjectId: 'sbj-khmer', subjectName: 'ភាសាខ្មែរ', teacherId: 'tch-1', teacherName: 'កែវ សុខា', room: 'បន្ទប់ ១០១' },
  { id: 'tt-3', classId: 'cls-7a', dayOfWeek: 'ច័ន្ទ', period: 3, startTime: '09:00', endTime: '09:50', subjectId: 'sbj-physics', subjectName: 'រូបវិទ្យា', teacherId: 'tch-2', teacherName: 'ចាន់ ណារិន', room: 'បន្ទប់ ១០១' },
  { id: 'tt-4', classId: 'cls-7a', dayOfWeek: 'ច័ន្ទ', period: 4, startTime: '09:55', endTime: '10:45', subjectId: 'sbj-eng', subjectName: 'ភាសាអង់គ្លេស', teacherId: 'tch-4', teacherName: 'ប៊ុន ថុល', room: 'បន្ទប់ ១០១' },

  { id: 'tt-5', classId: 'cls-7a', dayOfWeek: 'អង្គារ', period: 1, startTime: '07:00', endTime: '07:50', subjectId: 'sbj-khmer', subjectName: 'ភាសាខ្មែរ', teacherId: 'tch-1', teacherName: 'កែវ សុខា', room: 'បន្ទប់ ១០១' },
  { id: 'tt-6', classId: 'cls-7a', dayOfWeek: 'អង្គារ', period: 2, startTime: '07:55', endTime: '08:45', subjectId: 'sbj-chem', subjectName: 'គីមីវិទ្យា', teacherId: 'tch-3', teacherName: 'សេង វិបុល', room: 'បន្ទប់ ១០១' },
  { id: 'tt-7', classId: 'cls-7a', dayOfWeek: 'អង្គារ', period: 3, startTime: '09:00', endTime: '09:50', subjectId: 'sbj-bio', subjectName: 'ជីវវិទ្យា', teacherId: 'tch-3', teacherName: 'សេង វិបុល', room: 'បន្ទប់ ១០១' },
  { id: 'tt-8', classId: 'cls-7a', dayOfWeek: 'អង្គារ', period: 4, startTime: '09:55', endTime: '10:45', subjectId: 'sbj-history', subjectName: 'ប្រវត្តិវិទ្យា', teacherId: 'tch-1', teacherName: 'កែវ សុខា', room: 'បន្ទប់ ១០១' },

  { id: 'tt-9', classId: 'cls-7a', dayOfWeek: 'ពុធ', period: 1, startTime: '07:00', endTime: '07:50', subjectId: 'sbj-math', subjectName: 'គណិតវិទ្យា', teacherId: 'tch-2', teacherName: 'ចាន់ ណារិន', room: 'បន្ទប់ ១០១' },
  { id: 'tt-10', classId: 'cls-7a', dayOfWeek: 'ពុធ', period: 2, startTime: '07:55', endTime: '08:45', subjectId: 'sbj-earth', subjectName: 'ផែនដីវិទ្យា', teacherId: 'tch-3', teacherName: 'សេង វិបុល', room: 'បន្ទប់ ១០១' },
  { id: 'tt-11', classId: 'cls-7a', dayOfWeek: 'ពុធ', period: 3, startTime: '09:00', endTime: '09:50', subjectId: 'sbj-eng', subjectName: 'ភាសាអង់គ្លេស', teacherId: 'tch-4', teacherName: 'ប៊ុន ថុល', room: 'បន្ទប់ ១០១' },
  { id: 'tt-12', classId: 'cls-7a', dayOfWeek: 'ពុធ', period: 4, startTime: '09:55', endTime: '10:45', subjectId: 'sbj-ict', subjectName: 'បច្ចេកវិទ្យា/ICT', teacherId: 'tch-4', teacherName: 'ប៊ុន ថុល', room: 'បន្ទប់កុំព្យូទ័រ' },

  { id: 'tt-13', classId: 'cls-7a', dayOfWeek: 'ព្រហស្បតិ៍', period: 1, startTime: '07:00', endTime: '07:50', subjectId: 'sbj-khmer', subjectName: 'ភាសាខ្មែរ', teacherId: 'tch-1', teacherName: 'កែវ សុខា', room: 'បន្ទប់ ១០១' },
  { id: 'tt-14', classId: 'cls-7a', dayOfWeek: 'ព្រហស្បតិ៍', period: 2, startTime: '07:55', endTime: '08:45', subjectId: 'sbj-math', subjectName: 'គណិតវិទ្យា', teacherId: 'tch-2', teacherName: 'ចាន់ ណារិន', room: 'បន្ទប់ ១០១' },
  { id: 'tt-15', classId: 'cls-7a', dayOfWeek: 'ព្រហស្បតិ៍', period: 3, startTime: '09:00', endTime: '09:50', subjectId: 'sbj-geo', subjectName: 'ភូមិវិទ្យា', teacherId: 'tch-1', teacherName: 'កែវ សុខា', room: 'បន្ទប់ ១០១' },
  { id: 'tt-16', classId: 'cls-7a', dayOfWeek: 'ព្រហស្បតិ៍', period: 4, startTime: '09:55', endTime: '10:45', subjectId: 'sbj-civics', subjectName: 'ពលរដ្ឋវិទ្យា', teacherId: 'tch-1', teacherName: 'កែវ សុខា', room: 'បន្ទប់ ១០១' },

  { id: 'tt-17', classId: 'cls-7a', dayOfWeek: 'សុក្រ', period: 1, startTime: '07:00', endTime: '07:50', subjectId: 'sbj-physics', subjectName: 'រូបវិទ្យា', teacherId: 'tch-2', teacherName: 'ចាន់ ណារិន', room: 'បន្ទប់ ១០១' },
  { id: 'tt-18', classId: 'cls-7a', dayOfWeek: 'សុក្រ', period: 2, startTime: '07:55', endTime: '08:45', subjectId: 'sbj-bio', subjectName: 'ជីវវិទ្យា', teacherId: 'tch-3', teacherName: 'សេង វិបុល', room: 'បន្ទប់ ១០១' },
  { id: 'tt-19', classId: 'cls-7a', dayOfWeek: 'សុក្រ', period: 3, startTime: '09:00', endTime: '09:50', subjectId: 'sbj-khmer', subjectName: 'ភាសាខ្មែរ', teacherId: 'tch-1', teacherName: 'កែវ សុខា', room: 'បន្ទប់ ១០១' },
  { id: 'tt-20', classId: 'cls-7a', dayOfWeek: 'សុក្រ', period: 4, startTime: '09:55', endTime: '10:45', subjectId: 'sbj-eng', subjectName: 'ភាសាអង់គ្លេស', teacherId: 'tch-4', teacherName: 'ប៊ុន ថុល', room: 'បន្ទប់ ១០១' },

  { id: 'tt-21', classId: 'cls-7a', dayOfWeek: 'សៅរ៍', period: 1, startTime: '07:00', endTime: '07:50', subjectId: 'sbj-math', subjectName: 'គណិតវិទ្យា', teacherId: 'tch-2', teacherName: 'ចាន់ ណារិន', room: 'បន្ទប់ ១០១' },
  { id: 'tt-22', classId: 'cls-7a', dayOfWeek: 'សៅរ៍', period: 2, startTime: '07:55', endTime: '08:45', subjectId: 'sbj-pe', subjectName: 'អប់រំកាយ និងកីឡា', teacherId: 'tch-2', teacherName: 'ចាន់ ណារិន', room: 'ទីលានកីឡា' },
  { id: 'tt-23', classId: 'cls-7a', dayOfWeek: 'សៅរ៍', period: 3, startTime: '09:00', endTime: '09:50', subjectId: 'sbj-khmer', subjectName: 'ភាសាខ្មែរ', teacherId: 'tch-1', teacherName: 'កែវ សុខា', room: 'បន្ទប់ ១០១' },
];

const INITIAL_EXAMS: Exam[] = [
  {
    id: 'ex-oct-2026',
    title: 'ការប្រឡងប្រចាំខែ តុលា',
    type: 'monthly',
    academicYearId: 'ay-2025-2026',
    semester: 'ឆមាសទី ១',
    month: 'តុលា',
    date: '2026-10-25',
    maxScorePerSubject: 50,
    subjectIds: ['sbj-khmer', 'sbj-math', 'sbj-physics', 'sbj-chem', 'sbj-bio', 'sbj-eng'],
  },
];

const INITIAL_EXAM_RESULTS: ExamResult[] = [];

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    type: 'system',
    recipientName: 'លោក ស៊ុយ បូរ៉ា (Admin)',
    recipientPhone: '012 888 999',
    studentName: 'ទូទៅ',
    title: 'ស្វាគមន៍មកកាន់ប្រព័ន្ធគ្រប់គ្រងសាលា',
    message: 'ប្រព័ន្ធគ្រប់គ្រងសាលារៀន អនុវិទ្យាល័យ ហ៊ុន សែន ទួលសំបួរ ដំណើរការប្រក្រតី ២៤/៧។',
    status: 'sent',
    sentAt: '2026-10-31T08:00:00Z',
  },
  {
    id: 'notif-2',
    type: 'telegram',
    recipientName: 'លោកគ្រូ-អ្នកគ្រូទាំងអស់',
    recipientPhone: 'Bot Channel',
    studentName: 'ទូទៅ',
    title: 'កាលបរិច្ឆេទប្រឡងឆមាសទី ១',
    message: 'សូមលោកគ្រូ-អ្នកគ្រូរៀបចំបញ្ចូលពិន្ទុ និងវត្តមានសិស្សឱ្យបានទាន់ពេលវេលា។',
    status: 'sent',
    sentAt: '2026-10-30T10:30:00Z',
  },
];

const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'log-1',
    userName: 'ប្រព័ន្ធ',
    role: 'admin',
    action: 'ចាប់ផ្ដើមប្រព័ន្ធ',
    details: 'ប្រព័ន្ធគ្រប់គ្រងសាលាត្រូវបានកំណត់ឡើងវិញ ត្រៀមទទួលការបញ្ចូលទិន្នន័យជាក់ស្ដែង',
    timestamp: '2026-10-31T08:00:00Z',
  },
];

const INITIAL_BANNERS: BannerSlide[] = [
  {
    id: 'banner-1',
    badge: 'អនុវិទ្យាល័យទួលសំបួរ',
    location: 'ឃុំទួលសំបួរ ស្រុកស្ទឹងត្រង់ ខេត្តកំពង់ចាម',
    title: 'ផ្ទាំងគ្រប់គ្រងទូទៅរបស់សាលារៀន',
    subtitle: 'ប្រព័ន្ធគ្រប់គ្រងទិន្នន័យអប់រំ វត្តមានសិស្ស និងលទ្ធផលប្រឡងឌីជីថល ឆ្នាំសិក្សា ២០២៥-២០២៦',
    imageUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&auto=format&fit=crop&q=80',
    gradient: 'from-blue-950 via-indigo-950 to-slate-900',
    primaryButtonText: 'កត់ត្រាវត្តមានឥឡូវនេះ',
    primaryButtonAction: 'attendance',
    secondaryButtonText: 'របាយការណ៍វត្តមាន',
    secondaryButtonAction: 'attendance_reports',
    isActive: true,
    order: 1,
  },
  {
    id: 'banner-2',
    badge: 'ការប្រឡង & ពិន្ទុសិស្ស',
    location: 'បន្ទប់ប្រឡង និងការិយាល័យសិក្សា',
    title: 'បញ្ចូលពិន្ទុ និងចំណាត់ថ្នាក់សិស្សឆមាស',
    subtitle: 'ប្រព័ន្ធគណនាពិន្ទុ មធ្យមភាគ និងចំណាត់ថ្នាក់សិស្សដោយស្វ័យប្រវត្តិតាមស្ដង់ដារក្រសួងអប់រំ',
    imageUrl: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=1200&auto=format&fit=crop&q=80',
    gradient: 'from-purple-950 via-indigo-950 to-blue-950',
    primaryButtonText: 'បញ្ចូលពិន្ទុប្រឡង',
    primaryButtonAction: 'exams',
    secondaryButtonText: 'កាលវិភាគសិក្សា',
    secondaryButtonAction: 'timetable',
    isActive: true,
    order: 2,
  },
  {
    id: 'banner-3',
    badge: 'Telegram Bot & ជូនដំណឹង',
    location: 'ប្រព័ន្ធស្វ័យប្រវត្តិកម្ម ២៤/៧',
    title: 'ភ្ជាប់ទំនាក់ទំនងជាមួយអាណាព្យាបាលសិស្ស',
    subtitle: 'ផ្ញើសារជូនដំណឹងអវត្តមានសិស្ស និងដំណឹងបន្ទាន់សាលារៀនទៅកាន់ Telegram ភ្លាមៗ',
    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&auto=format&fit=crop&q=80',
    gradient: 'from-slate-950 via-blue-950 to-emerald-950',
    primaryButtonText: 'ផ្ញើសារជូនដំណឹង',
    primaryButtonAction: 'telegram',
    secondaryButtonText: 'បញ្ជីឈ្មោះសិស្ស',
    secondaryButtonAction: 'students',
    isActive: true,
    order: 3,
  },
];

const INITIAL_BEHAVIOR_RECORDS: StudentBehaviorRecord[] = [
  {
    id: 'beh-1',
    studentId: 'stu-1',
    studentName: 'ស៊ុយ ចាន់ដារ៉ា',
    classId: 'cls-7a',
    className: 'ថ្នាក់ទី ៧ក',
    type: 'merit',
    category: 'សិស្សគំរូ & សិក្សាពូកែ',
    title: 'ទទួលបានចំណាត់ថ្នាក់លេខ ១ ប្រចាំខែ',
    description: 'ខិតខំរៀនសូត្រ យកចិត្តទុកដាក់ស្ដាប់ការពន្យល់របស់លោកគ្រូ-អ្នកគ្រូ និងជួយបង្រៀនមិត្តរួមថ្នាក់។',
    points: 10,
    actionTaken: 'ផ្ដល់ប័ណ្ណសរសើរនៅមុខទង់ជាតិ',
    recordedBy: 'លោក ស៊ុយ បូរ៉ា (Admin)',
    date: '2026-10-25',
    telegramSent: true,
  },
  {
    id: 'beh-2',
    studentId: 'stu-2',
    studentName: 'កែវ សោភា',
    classId: 'cls-7a',
    className: 'ថ្នាក់ទី ៧ក',
    type: 'merit',
    category: 'ជួយកិច្ចការសាលា & សង្គម',
    title: 'ចូលរួមសកម្មភាពអនាម័យ និងដាំកូនឈើក្នុងបរិវេណសាលា',
    description: 'បានជួយរៀបចំសណ្ដាប់ធ្នាប់ និងអនាម័យក្នុងថ្នាក់រៀនបានយ៉ាងល្អស្អាត។',
    points: 5,
    actionTaken: 'លើកទឹកចិត្តជាសាធារណៈ',
    recordedBy: 'លោកគ្រូ សុខ វិសាល',
    date: '2026-10-28',
    telegramSent: true,
  },
];

class StorageService {
  private db: SchoolDatabase;
  private listeners: Array<() => void> = [];

  constructor() {
    this.db = this.loadDatabase();
    this.reconcileClassesAndStudents(true);
    this.initCloudSync();
  }

  private reconcileClassesAndStudents(syncRepairsToCloud = false): void {
    if (!this.db.classes || !this.db.students) return;

    // 1. Merge duplicate classes that have the exact same normalized name (e.g. two "ថ្នាក់ទី ៧ គ" classes)
    const nameMap = new Map<string, SchoolClass>();
    const duplicateClasses: Array<{ dup: SchoolClass; primary: SchoolClass }> = [];
    const deduplicatedClasses: SchoolClass[] = [];

    for (const cls of this.db.classes) {
      const normName = (cls.name || '').trim().replace(/\s+/g, ' ');
      const existing = nameMap.get(normName);
      if (!existing) {
        nameMap.set(normName, cls);
        deduplicatedClasses.push(cls);
      } else {
        duplicateClasses.push({ dup: cls, primary: existing });
      }
    }

    if (duplicateClasses.length > 0) {
      this.db.classes = deduplicatedClasses;
      for (const { dup, primary } of duplicateClasses) {
        // Reassign students from duplicate class to primary class
        this.db.students.forEach((s) => {
          if (s.classId === dup.id) {
            s.classId = primary.id;
            syncStudentToCloud(s).catch(() => {});
          }
        });
        // Reassign attendance, sessions, exam results, timetable, behavior
        this.db.attendanceRecords?.forEach((r) => {
          if (r.classId === dup.id) r.classId = primary.id;
        });
        this.db.attendanceSessions?.forEach((sess) => {
          if (sess.classId === dup.id) sess.classId = primary.id;
        });
        this.db.examResults?.forEach((er) => {
          if (er.classId === dup.id) er.classId = primary.id;
        });
        this.db.timetable?.forEach((tt) => {
          if (tt.classId === dup.id) tt.classId = primary.id;
        });
        this.db.behaviorRecords?.forEach((br) => {
          if (br.classId === dup.id) br.classId = primary.id;
        });
        removeClassFromCloud(dup.id).catch(() => {});
      }
    }

    // 2. Repair any orphaned student.classId so no entered student is ever hidden
    if (this.db.classes.length > 0) {
      const validClassIds = new Set(this.db.classes.map((c) => c.id));
      const fallbackClass = this.db.classes[0];
      this.db.students.forEach((s) => {
        if (!s.classId || !validClassIds.has(s.classId)) {
          s.classId = fallbackClass.id;
          if (syncRepairsToCloud) {
            syncStudentToCloud(s).catch(() => {});
          }
        }
      });
    }

    // 3. Always compute live currentStudentCount from actual students array
    this.db.classes.forEach((c) => {
      const realCount = this.db.students.filter((s) => s.classId === c.id).length;
      if (c.currentStudentCount !== realCount) {
        c.currentStudentCount = realCount;
        if (syncRepairsToCloud) {
          syncClassToCloud(c).catch(() => {});
        }
      }
    });

    // 4. Reconcile attendanceRecords with canonical student IDs & class IDs, and reconstruct missing attendanceSessions
    if (this.db.attendanceRecords && this.db.attendanceRecords.length > 0) {
      if (!this.db.attendanceSessions) {
        this.db.attendanceSessions = [];
      }
      const existingSessionIds = new Set(this.db.attendanceSessions.map((s) => s.id));

      this.db.attendanceRecords.forEach((rec) => {
        // Match student by id, studentId, or khmerName so cross-account records always link to the student
        const matchedStudent = this.db.students.find(
          (s) =>
            s.id === rec.studentId ||
            s.studentId === rec.studentId ||
            (rec.studentName && s.khmerName.trim() === rec.studentName.trim())
        );
        if (matchedStudent) {
          if (rec.studentId !== matchedStudent.id || rec.classId !== matchedStudent.classId) {
            rec.studentId = matchedStudent.id;
            rec.classId = matchedStudent.classId;
            rec.studentName = matchedStudent.khmerName;
            if (syncRepairsToCloud) {
              syncAttendanceRecordToCloud(rec).catch(() => {});
            }
          }
        }

        // Reconstruct session if this record came from another User/device via Cloud Sync
        if (rec.sessionId && !existingSessionIds.has(rec.sessionId)) {
          existingSessionIds.add(rec.sessionId);
          this.db.attendanceSessions.push({
            id: rec.sessionId,
            classId: rec.classId,
            date: rec.date,
            period: this.inferPeriodFromSessionId(rec.sessionId),
            subjectId: rec.subjectId || 'sbj-math',
            recordedBy: rec.recordedBy || 'admin',
            createdAt: rec.createdAt || new Date().toISOString(),
          });
        }
      });
    }
  }

  private getPeriodSlug(period: string): string {
    const p = (period || '').trim();
    if (p.includes('ព្រឹក') && p.includes('១')) return 'am1';
    if (p.includes('ព្រឹក') && p.includes('២')) return 'am2';
    if (p.includes('ព្រឹក') && p.includes('៣')) return 'am3';
    if (p.includes('ព្រឹក') && p.includes('៤')) return 'am4';
    if (p.includes('រសៀល') && p.includes('១')) return 'pm1';
    if (p.includes('រសៀល') && p.includes('២')) return 'pm2';
    if (p.includes('ពេញមួយថ្ងៃ') || p.toLowerCase().includes('full')) return 'fullday';
    return 'am1';
  }

  private inferPeriodFromSessionId(sessionId: string): string {
    if (sessionId.endsWith('-am1')) return 'ព្រឹក ម៉ោងទី ១ (០៧:០០ - ០៧:៥០)';
    if (sessionId.endsWith('-am2')) return 'ព្រឹក ម៉ោងទី ២ (០៧:៥៥ - ០៨:៤៥)';
    if (sessionId.endsWith('-am3')) return 'ព្រឹក ម៉ោងទី ៣ (០៩:០០ - ០៩:៥០)';
    if (sessionId.endsWith('-am4')) return 'ព្រឹក ម៉ោងទី ៤ (០៩:៥៥ - ១០:៤៥)';
    if (sessionId.endsWith('-pm1')) return 'រសៀល ម៉ោងទី ១ (១៣:៣០ - ១៤:២០)';
    if (sessionId.endsWith('-pm2')) return 'រសៀល ម៉ោងទី ២ (១៤:២៥ - ១៥:១៥)';
    if (sessionId.endsWith('-fullday')) return 'វត្តមានពេញមួយថ្ងៃ (Full Day)';
    return 'ព្រឹក ម៉ោងទី ១ (០៧:០០ - ០៧:៥០)';
  }

  private pushSharedStateToServer(): void {
    if (typeof window === 'undefined' || !('fetch' in window)) return;
    window
      .fetch('/api/sync/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendanceRecords: this.db.attendanceRecords,
          attendanceSessions: this.db.attendanceSessions,
          students: this.db.students,
          classes: this.db.classes,
          teachers: this.db.teachers,
          examResults: this.db.examResults,
          users: this.db.users,
        }),
      })
      .catch(() => {});
  }

  private pullSharedStateFromServer(): void {
    if (typeof window === 'undefined' || !('fetch' in window)) return;
    window
      .fetch('/api/sync/state')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data || !data.state) return;
        const st = data.state;
        let changed = false;

        if (Array.isArray(st.attendanceRecords) && st.attendanceRecords.length > 0) {
          const map = new Map<string, AttendanceRecord>();
          this.db.attendanceRecords.forEach((r) => map.set(r.id, r));
          let addedOrUpdated = false;
          st.attendanceRecords.forEach((r: AttendanceRecord) => {
            const existing = map.get(r.id);
            if (!existing || existing.status !== r.status || existing.reason !== r.reason) {
              map.set(r.id, r);
              addedOrUpdated = true;
            }
          });
          if (addedOrUpdated) {
            this.db.attendanceRecords = Array.from(map.values());
            changed = true;
          }
        }

        if (Array.isArray(st.attendanceSessions) && st.attendanceSessions.length > 0) {
          const sessMap = new Map<string, AttendanceSession>();
          this.db.attendanceSessions.forEach((s) => sessMap.set(s.id, s));
          st.attendanceSessions.forEach((s: AttendanceSession) => {
            if (!sessMap.has(s.id)) {
              sessMap.set(s.id, s);
              changed = true;
            }
          });
          this.db.attendanceSessions = Array.from(sessMap.values());
        }

        if (changed) {
          this.saveLocalOnly(this.db);
        }
      })
      .catch(() => {});
  }

  private initCloudSync(): void {
    if (typeof window === 'undefined') return;

    // 1. Push any already-entered local attendance records & students to Firestore and Central Server on boot
    setTimeout(() => {
      this.db.attendanceRecords?.forEach((rec) => {
        syncAttendanceRecordToCloud(rec).catch(() => {});
      });
      this.db.students?.forEach((stu) => {
        syncStudentToCloud(stu).catch(() => {});
      });
      this.db.classes?.forEach((cls) => {
        syncClassToCloud(cls).catch(() => {});
      });
      this.pushSharedStateToServer();
      this.pullSharedStateFromServer();
    }, 300);

    // 2. Listen to cross-tab localStorage updates and periodic central server sync
    window.addEventListener('storage', (event) => {
      if (event.key === DB_KEY && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue);
          if (parsed && parsed.attendanceRecords) {
            this.db = parsed;
            this.reconcileClassesAndStudents(false);
            this.notifyListeners();
          }
        } catch {
          // ignore
        }
      }
    });

    setInterval(() => {
      this.pullSharedStateFromServer();
    }, 4000);

    // 3. Real-time Firestore listeners with non-destructive merge
    try {
      startFirestoreSync({
        onStudentsChange: (remote) => {
          if (remote && Array.isArray(remote) && remote.length > 0) {
            const map = new Map<string, Student>();
            this.db.students.forEach((s) => map.set(s.id, s));
            remote.forEach((s) => map.set(s.id, s));
            this.db.students = Array.from(map.values());
            this.reconcileClassesAndStudents(false);
            this.saveLocalOnly(this.db);
          }
        },
        onTeachersChange: (remote) => {
          if (remote && Array.isArray(remote) && remote.length > 0) {
            const map = new Map<string, Teacher>();
            this.db.teachers.forEach((t) => map.set(t.id, t));
            remote.forEach((t) => map.set(t.id, t));
            this.db.teachers = Array.from(map.values());
            this.saveLocalOnly(this.db);
          }
        },
        onClassesChange: (remote) => {
          if (remote && Array.isArray(remote) && remote.length > 0) {
            const map = new Map<string, SchoolClass>();
            this.db.classes.forEach((c) => map.set(c.id, c));
            remote.forEach((c) => map.set(c.id, c));
            this.db.classes = Array.from(map.values());
            this.reconcileClassesAndStudents(true);
            this.saveLocalOnly(this.db);
          }
        },
        onAttendanceChange: (remote) => {
          if (remote && Array.isArray(remote)) {
            const remoteIds = new Set(remote.map((r) => r.id));
            // Push any local attendance records that aren't in Firestore yet
            this.db.attendanceRecords.forEach((localRec) => {
              const safeId = toSafeFirestoreId(localRec.id, 'att');
              if (!remoteIds.has(localRec.id) && !remoteIds.has(safeId)) {
                syncAttendanceRecordToCloud(localRec).catch(() => {});
              }
            });

            // Merge remote + local attendance records (remote wins on matching ID/student+date+session)
            const mergedMap = new Map<string, AttendanceRecord>();
            this.db.attendanceRecords.forEach((r) => {
              const key = `${r.classId}_${r.date}_${r.sessionId}_${r.studentId}`;
              mergedMap.set(key, r);
            });
            remote.forEach((r) => {
              const key = `${r.classId}_${r.date}_${r.sessionId}_${r.studentId}`;
              mergedMap.set(key, r);
            });

            this.db.attendanceRecords = Array.from(mergedMap.values());
            this.reconcileClassesAndStudents(false);
            this.saveLocalOnly(this.db);
          }
        },
        onExamResultsChange: (remote) => {
          if (remote && Array.isArray(remote) && remote.length > 0) {
            const map = new Map<string, ExamResult>();
            this.db.examResults.forEach((r) => map.set(r.id, r));
            remote.forEach((r) => map.set(r.id, r));
            this.db.examResults = Array.from(map.values());
            this.saveLocalOnly(this.db);
          }
        },
        onUsersChange: (remote) => {
          if (remote && remote.length > 0) {
            const admin = this.db.users.find((u) => u.username === 'admin');
            const map = new Map<string, User>();
            this.db.users.forEach((u) => map.set(u.id, u));
            remote.forEach((u) => map.set(u.id, u));
            const merged = Array.from(map.values());
            if (admin && !merged.some((u) => u.username === 'admin')) {
              merged.unshift(admin);
            }
            this.db.users = merged;
            this.saveLocalOnly(this.db);
          }
        },
      });
    } catch (e) {
      console.warn('Could not initialize cloud sync:', e);
    }
  }

  private saveLocalOnly(data: SchoolDatabase): void {
    try {
      this.db = data;
      this.reconcileClassesAndStudents(false);
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(DB_KEY, JSON.stringify(this.db));
      }
      this.notifyListeners();
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }

  private loadDatabase(): SchoolDatabase {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(DB_KEY);
        if (stored) {
          const parsed: SchoolDatabase = JSON.parse(stored);
          const accessCode = parsed.systemAccessCode || 'admin123';
          parsed.systemAccessCode = accessCode;
          if (parsed.users) {
            parsed.users = parsed.users.map((u) => ({
              ...u,
              password: accessCode, // Every user shares this exact code
              status: u.status || 'active',
            }));
          }
          parsed.banners = parsed.banners && parsed.banners.length > 0 ? parsed.banners : INITIAL_BANNERS;
          parsed.behaviorRecords = parsed.behaviorRecords && parsed.behaviorRecords.length > 0
            ? parsed.behaviorRecords
            : INITIAL_BEHAVIOR_RECORDS;
          parsed.teachers = parsed.teachers && parsed.teachers.length > 0 ? parsed.teachers : INITIAL_TEACHERS;
          parsed.timetable = parsed.timetable && parsed.timetable.length > 0 ? parsed.timetable : INITIAL_TIMETABLE;
          if (!parsed.telegramSettings || parsed.telegramSettings.botToken?.includes('Simulated') || !parsed.telegramSettings.botUsername) {
            parsed.telegramSettings = {
              botUsername: '@machin_caffee_bot',
              botToken: '8854828129:AAHp_oHUOkQ1u9vJiT8tFU8HtSygyaZHWyU',
              chatId: parsed.telegramSettings?.chatId || '',
              isEnabled: true,
            };
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored DB, resetting to defaults', e);
    }

    const initialDb: SchoolDatabase = {
      systemAccessCode: 'admin123',
      users: INITIAL_USERS,
      students: INITIAL_STUDENTS,
      teachers: INITIAL_TEACHERS,
      classes: INITIAL_CLASSES,
      subjects: INITIAL_SUBJECTS,
      timetable: INITIAL_TIMETABLE,
      attendanceSessions: INITIAL_ATTENDANCE_SESSIONS,
      attendanceRecords: INITIAL_ATTENDANCE_RECORDS,
      exams: INITIAL_EXAMS,
      examResults: INITIAL_EXAM_RESULTS,
      academicYears: INITIAL_ACADEMIC_YEARS,
      notifications: INITIAL_NOTIFICATIONS,
      auditLogs: INITIAL_AUDIT_LOGS,
      banners: INITIAL_BANNERS,
      behaviorRecords: INITIAL_BEHAVIOR_RECORDS,
      telegramSettings: {
        botUsername: '@machin_caffee_bot',
        botToken: '8854828129:AAHp_oHUOkQ1u9vJiT8tFU8HtSygyaZHWyU',
        chatId: '',
        isEnabled: true,
      },
    };

    this.saveDatabase(initialDb);
    return initialDb;
  }

  private saveDatabase(data: SchoolDatabase): void {
    try {
      this.db = data;
      this.reconcileClassesAndStudents(true);
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(DB_KEY, JSON.stringify(this.db));
      }
      this.pushSharedStateToServer();
      this.notifyListeners();
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  // Database snapshot
  public getDatabase(): SchoolDatabase {
    return this.db;
  }

  // Reset to initial seed
  public resetToDefault(): void {
    localStorage.removeItem(DB_KEY);
    this.db = this.loadDatabase();
    this.logAudit('ប្រព័ន្ធ', 'admin', 'កំណត់ទិន្នន័យឡើងវិញ', 'កំណត់ប្រព័ន្ធទៅទិន្នន័យគំរូលំនាំដើម');
    this.notifyListeners();
  }

  // Backup & Restore
  public exportDatabaseJson(): string {
    return JSON.stringify(this.db, null, 2);
  }

  public importDatabaseJson(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.students && parsed.classes && parsed.attendanceRecords) {
        this.saveDatabase(parsed);
        this.logAudit('ប្រព័ន្ធ', 'admin', 'ស្ដារទិន្នន័យ', 'បានស្ដារ Backup ទិន្នន័យដោយជោគជ័យ');
        return true;
      }
      return false;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  }

  // Audit Log
  public logAudit(userName: string, role: string, action: string, details: string): void {
    const logItem: AuditLogItem = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userName,
      role,
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    this.db.auditLogs.unshift(logItem);
    if (this.db.auditLogs.length > 200) {
      this.db.auditLogs.pop();
    }
    this.saveDatabase(this.db);
  }

  // Students
  public getStudents(classId?: string, query?: string): Student[] {
    let list = this.db.students;
    if (classId && classId !== 'all') {
      list = list.filter((s) => s.classId === classId);
    }
    if (query && query.trim() !== '') {
      const q = query.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.khmerName.toLowerCase().includes(q) ||
          s.latinName.toLowerCase().includes(q) ||
          s.studentId.toLowerCase().includes(q) ||
          s.parentName.toLowerCase().includes(q) ||
          s.parentPhone.includes(q)
      );
    }
    return list;
  }

  public getStudentById(id: string): Student | undefined {
    return this.db.students.find((s) => s.id === id || s.studentId === id);
  }

  public addStudent(studentData: Omit<Student, 'id'>, actorName = 'Admin'): Student {
    const newStudent: Student = {
      ...studentData,
      id: `stu-${Date.now()}`,
    };
    this.db.students.push(newStudent);

    this.logAudit(actorName, 'admin', 'បន្ថែមសិស្សថ្មី', `បន្ថែមសិស្ស ${newStudent.khmerName} (${newStudent.studentId})`);
    this.saveDatabase(this.db);
    syncStudentToCloud(newStudent).catch((e) => console.warn('Cloud sync student error:', e));
    return newStudent;
  }

  public updateStudent(id: string, updates: Partial<Student>, actorName = 'Admin'): boolean {
    const index = this.db.students.findIndex((s) => s.id === id || s.studentId === id);
    if (index === -1) return false;

    this.db.students[index] = { ...this.db.students[index], ...updates };
    this.logAudit(actorName, 'admin', 'កែប្រែព័ត៌មានសិស្ស', `កែប្រែព័ត៌មានសិស្ស ${this.db.students[index].khmerName}`);
    this.saveDatabase(this.db);
    syncStudentToCloud(this.db.students[index]).catch((e) => console.warn('Cloud sync student error:', e));
    return true;
  }

  public deleteStudent(id: string, actorName = 'Admin'): boolean {
    const student = this.db.students.find((s) => s.id === id || s.studentId === id);
    if (!student) return false;

    this.db.students = this.db.students.filter((s) => s.id !== id && s.studentId !== id);

    this.logAudit(actorName, 'admin', 'លុបសិស្ស', `លុបសិស្ស ${student.khmerName} (${student.studentId})`);
    this.saveDatabase(this.db);
    removeStudentFromCloud(student.id).catch((e) => console.warn('Cloud sync delete error:', e));
    return true;
  }

  public bulkDeleteStudents(ids: string[], actorName = 'Admin'): number {
    if (!this.db.students || ids.length === 0) return 0;
    const idsSet = new Set(ids);
    const toDelete = this.db.students.filter((s) => idsSet.has(s.id) || idsSet.has(s.studentId));
    if (toDelete.length === 0) return 0;

    this.db.students = this.db.students.filter((s) => !idsSet.has(s.id) && !idsSet.has(s.studentId));

    this.logAudit(
      actorName,
      'admin',
      'លុបសិស្សជាបណ្តុំ',
      `បានលុបសិស្សចំនួន ${toDelete.length} នាក់ចេញពីប្រព័ន្ធ`
    );
    this.saveDatabase(this.db);

    toDelete.forEach((s) => {
      removeStudentFromCloud(s.id).catch((e) => console.warn('Cloud sync bulk delete error:', e));
    });

    return toDelete.length;
  }

  // Teachers
  public getTeachers(): Teacher[] {
    return this.db.teachers;
  }

  public addTeacher(teacherData: Omit<Teacher, 'id'>, actorName = 'Admin'): Teacher {
    const newTeacher: Teacher = {
      ...teacherData,
      id: `tch-${Date.now()}`,
    };
    this.db.teachers.push(newTeacher);
    this.logAudit(actorName, 'admin', 'បន្ថែមគ្រូបង្រៀន', `បន្ថែមគ្រូ ${newTeacher.name} (${newTeacher.teacherId})`);
    this.saveDatabase(this.db);
    syncTeacherToCloud(newTeacher).catch((e) => console.warn('Cloud sync teacher error:', e));
    return newTeacher;
  }

  public updateTeacher(id: string, updates: Partial<Teacher>, actorName = 'Admin'): boolean {
    const index = this.db.teachers.findIndex((t) => t.id === id || t.teacherId === id);
    if (index === -1) return false;

    this.db.teachers[index] = { ...this.db.teachers[index], ...updates };
    this.logAudit(actorName, 'admin', 'កែប្រែព័ត៌មានគ្រូ', `កែប្រែព័ត៌មានគ្រូ ${this.db.teachers[index].name}`);
    this.saveDatabase(this.db);
    syncTeacherToCloud(this.db.teachers[index]).catch((e) => console.warn('Cloud sync teacher error:', e));
    return true;
  }

  public deleteTeacher(id: string, actorName = 'Admin'): boolean {
    const teacher = this.db.teachers.find((t) => t.id === id || t.teacherId === id);
    if (!teacher) return false;

    this.db.teachers = this.db.teachers.filter((t) => t.id !== id && t.teacherId !== id);
    this.logAudit(actorName, 'admin', 'លុបគ្រូបង្រៀន', `លុបគ្រូ ${teacher.name}`);
    this.saveDatabase(this.db);
    removeTeacherFromCloud(teacher.id).catch((e) => console.warn('Cloud sync delete teacher error:', e));
    return true;
  }

  // Classes
  public getClasses(): SchoolClass[] {
    return this.db.classes;
  }

  public addClass(classData: Omit<SchoolClass, 'id'>, actorName = 'Admin'): SchoolClass {
    const normName = (classData.name || '').trim().replace(/\s+/g, ' ');
    const existing = this.db.classes.find(
      (c) => (c.name || '').trim().replace(/\s+/g, ' ') === normName
    );
    if (existing) {
      // Update existing class instead of creating a duplicate with the same name
      this.updateClass(existing.id, classData, actorName);
      return existing;
    }

    const newClass: SchoolClass = {
      ...classData,
      id: `cls-${Date.now()}`,
      currentStudentCount: 0,
    };
    this.db.classes.push(newClass);
    this.logAudit(actorName, 'admin', 'បន្ថែមថ្នាក់រៀន', `បង្កើតថ្នាក់ ${newClass.name}`);
    this.saveDatabase(this.db);
    syncClassToCloud(newClass).catch((e) => console.warn('Cloud sync class error:', e));
    return newClass;
  }

  public updateClass(id: string, updates: Partial<SchoolClass>, actorName = 'Admin'): boolean {
    const index = this.db.classes.findIndex((c) => c.id === id);
    if (index === -1) return false;

    this.db.classes[index] = { ...this.db.classes[index], ...updates };
    this.logAudit(actorName, 'admin', 'កែប្រែថ្នាក់រៀន', `កែប្រែថ្នាក់ ${this.db.classes[index].name}`);
    this.saveDatabase(this.db);
    syncClassToCloud(this.db.classes[index]).catch((e) => console.warn('Cloud sync class error:', e));
    return true;
  }

  public deleteClass(id: string, actorName = 'Admin'): boolean {
    const targetClass = this.db.classes.find((c) => c.id === id);
    if (!targetClass) return false;

    this.db.classes = this.db.classes.filter((c) => c.id !== id);
    // Reassign any students in the deleted class to the first remaining class
    if (this.db.classes.length > 0) {
      const fallbackId = this.db.classes[0].id;
      this.db.students.forEach((s) => {
        if (s.classId === id) {
          s.classId = fallbackId;
          syncStudentToCloud(s).catch(() => {});
        }
      });
    }
    this.logAudit(actorName, 'admin', 'លុបថ្នាក់រៀន', `លុបថ្នាក់ ${targetClass.name}`);
    this.saveDatabase(this.db);
    removeClassFromCloud(id).catch((e) => console.warn('Cloud sync delete class error:', e));
    return true;
  }

  // Subjects
  public getSubjects(): Subject[] {
    return this.db.subjects;
  }

  public addSubject(subjectData: Omit<Subject, 'id'>, actorName = 'Admin'): Subject {
    const newSubject: Subject = {
      ...subjectData,
      id: `sbj-${Date.now()}`,
    };
    this.db.subjects.push(newSubject);
    this.logAudit(actorName, 'admin', 'បន្ថែមមុខវិជ្ជា', `បន្ថែមមុខវិជ្ជា ${newSubject.nameKm}`);
    this.saveDatabase(this.db);
    return newSubject;
  }

  public updateSubject(id: string, updates: Partial<Subject>, actorName = 'Admin'): boolean {
    const index = this.db.subjects.findIndex((s) => s.id === id);
    if (index === -1) return false;

    this.db.subjects[index] = { ...this.db.subjects[index], ...updates };
    this.logAudit(actorName, 'admin', 'កែប្រែមុខវិជ្ជា', `កែប្រែព័ត៌មានមុខវិជ្ជា ${this.db.subjects[index].nameKm}`);
    this.saveDatabase(this.db);
    return true;
  }

  public deleteSubject(id: string, actorName = 'Admin'): boolean {
    const subject = this.db.subjects.find((s) => s.id === id);
    if (!subject) return false;

    this.db.subjects = this.db.subjects.filter((s) => s.id !== id);
    
    // Clean up subject reference from exams
    this.db.exams.forEach((ex) => {
      if (ex.subjectIds) {
        ex.subjectIds = ex.subjectIds.filter((sid) => sid !== id);
      }
    });

    // Clean up scores for this subject
    this.db.examResults.forEach((r) => {
      if (r.scores && r.scores[id] !== undefined) {
        delete r.scores[id];
      }
    });

    // Clean up timetable slots for this subject
    this.db.timetable = this.db.timetable.filter((t) => t.subjectId !== id);

    this.logAudit(actorName, 'admin', 'លុបមុខវិជ្ជា', `លុបមុខវិជ្ជា ${subject.nameKm}`);
    this.saveDatabase(this.db);
    return true;
  }

  // Timetable
  public getTimetable(classId?: string, teacherId?: string): TimetableSlot[] {
    if (!this.db.timetable) {
      this.db.timetable = [];
    }
    let slots = this.db.timetable;
    if (classId && classId !== 'all') {
      slots = slots.filter((t) => t.classId === classId);
    }
    if (teacherId && teacherId !== 'all') {
      slots = slots.filter((t) => t.teacherId === teacherId);
    }
    return slots;
  }

  public checkTimetableConflict(
    teacherId: string,
    dayOfWeek: string,
    period: number,
    excludeId?: string
  ): { hasConflict: boolean; conflictingSlot?: TimetableSlot; message?: string } {
    if (!this.db.timetable || !teacherId) return { hasConflict: false };
    const conflict = this.db.timetable.find(
      (t) =>
        t.teacherId === teacherId &&
        t.dayOfWeek === dayOfWeek &&
        t.period === period &&
        t.id !== excludeId
    );

    if (conflict) {
      const cls = this.db.classes.find((c) => c.id === conflict.classId);
      return {
        hasConflict: true,
        conflictingSlot: conflict,
        message: `លោកគ្រូ/អ្នកគ្រូមានម៉ោងបង្រៀនរួចហើយនៅថ្ងៃ${dayOfWeek} ម៉ោងទី ${period} នៅ ${cls?.name || 'ថ្នាក់ផ្សេង'} (${conflict.subjectName || ''})`,
      };
    }
    return { hasConflict: false };
  }

  public addTimetableSlot(slot: Omit<TimetableSlot, 'id'>, actorName = 'Admin'): TimetableSlot {
    const newSlot: TimetableSlot = {
      ...slot,
      id: `tt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    if (!this.db.timetable) {
      this.db.timetable = [];
    }
    this.db.timetable.push(newSlot);
    this.logAudit(
      actorName,
      'admin',
      'បន្ថែមកាលវិភាគ',
      `បន្ថែមកាលវិភាគ ${newSlot.subjectName || ''} ថ្ងៃ${newSlot.dayOfWeek} ម៉ោងទី ${newSlot.period} (គ្រូ៖ ${newSlot.teacherName || ''})`
    );
    this.saveDatabase(this.db);
    return newSlot;
  }

  public updateTimetableSlot(
    id: string,
    updates: Partial<TimetableSlot>,
    actorName = 'Admin'
  ): boolean {
    if (!this.db.timetable) return false;
    const index = this.db.timetable.findIndex((t) => t.id === id);
    if (index === -1) return false;
    this.db.timetable[index] = { ...this.db.timetable[index], ...updates };
    this.logAudit(
      actorName,
      'admin',
      'កែប្រែកាលវិភាគ',
      `កែប្រែកាលវិភាគ ${this.db.timetable[index].subjectName || ''} ថ្ងៃ${this.db.timetable[index].dayOfWeek} ម៉ោងទី ${this.db.timetable[index].period}`
    );
    this.saveDatabase(this.db);
    return true;
  }

  public deleteTimetableSlot(id: string, actorName = 'Admin'): boolean {
    if (!this.db.timetable) return false;
    const slot = this.db.timetable.find((t) => t.id === id);
    if (!slot) return false;
    this.db.timetable = this.db.timetable.filter((t) => t.id !== id);
    this.logAudit(
      actorName,
      'admin',
      'លុបកាលវិភាគ',
      `លុបម៉ោងបង្រៀន ${slot.subjectName || ''} ថ្ងៃ${slot.dayOfWeek} ម៉ោងទី ${slot.period}`
    );
    this.saveDatabase(this.db);
    return true;
  }

  public saveTimetableSlot(
    slotData: Omit<TimetableSlot, 'id'> & { id?: string },
    actorName = 'Admin'
  ): TimetableSlot {
    if (!this.db.timetable) this.db.timetable = [];

    if (slotData.id) {
      const idx = this.db.timetable.findIndex((t) => t.id === slotData.id);
      if (idx !== -1) {
        this.db.timetable[idx] = {
          ...this.db.timetable[idx],
          ...slotData,
          id: slotData.id,
        };
        this.saveDatabase(this.db);
        return this.db.timetable[idx];
      }
    }

    // Replace if exact slot exists for that class, day, and period
    const existingIndex = this.db.timetable.findIndex(
      (t) =>
        t.classId === slotData.classId &&
        t.dayOfWeek === slotData.dayOfWeek &&
        t.period === slotData.period
    );

    if (existingIndex !== -1) {
      const updated: TimetableSlot = {
        ...this.db.timetable[existingIndex],
        ...slotData,
        id: this.db.timetable[existingIndex].id,
      };
      this.db.timetable[existingIndex] = updated;
      this.saveDatabase(this.db);
      return updated;
    }

    return this.addTimetableSlot(slotData, actorName);
  }

  // Attendance
  public getAttendanceRecords(filters?: {
    classId?: string;
    studentId?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
    sessionId?: string;
  }): AttendanceRecord[] {
    let records = this.db.attendanceRecords;

    if (filters?.classId && filters.classId !== 'all') {
      records = records.filter((r) => r.classId === filters.classId);
    }
    if (filters?.studentId) {
      records = records.filter((r) => r.studentId === filters.studentId);
    }
    if (filters?.date) {
      records = records.filter((r) => r.date === filters.date);
    }
    if (filters?.sessionId) {
      records = records.filter((r) => r.sessionId === filters.sessionId);
    }
    if (filters?.startDate && filters?.endDate) {
      records = records.filter((r) => r.date >= filters.startDate! && r.date <= filters.endDate!);
    }

    return records;
  }

  public getAttendanceSession(classId: string, date: string, period: string): AttendanceSession | undefined {
    const periodSlug = this.getPeriodSlug(period);
    const deterministicId = toSafeFirestoreId(`sess-${classId}-${date}-${periodSlug}`, 'sess');
    return this.db.attendanceSessions.find(
      (s) =>
        s.id === deterministicId ||
        (s.classId === classId && s.date === date && s.period === period)
    );
  }

  /**
   * Save a complete attendance session for a class, preventing duplicates,
   * syncing every record to Firestore + Central Server for all Users,
   * and automatically queuing Telegram notifications for unexcused absences!
   */
  public saveAttendanceSession(
    classId: string,
    date: string,
    period: string,
    subjectId: string | undefined,
    records: Array<{
      studentId: string;
      studentName: string;
      status: AttendanceStatus;
      reason?: string;
    }>,
    recordedBy: string,
    recordedByName: string
  ): { sessionId: string; unexcusedAlertsSent: number } {
    const periodSlug = this.getPeriodSlug(period);
    const deterministicSessionId = toSafeFirestoreId(`sess-${classId}-${date}-${periodSlug}`, 'sess');

    // 1. Find or create session
    let session = this.getAttendanceSession(classId, date, period);
    const isNew = !session;

    if (!session) {
      session = {
        id: deterministicSessionId,
        classId,
        date,
        period,
        subjectId: subjectId || 'sbj-math',
        recordedBy,
        createdAt: new Date().toISOString(),
      };
      this.db.attendanceSessions.push(session);
    }

    // 2. Clear old records for this session (or same class+date+student in this session) to prevent duplicates
    const oldRecordsToRemove = this.db.attendanceRecords.filter(
      (r) => r.sessionId === session!.id || r.sessionId === deterministicSessionId
    );
    this.db.attendanceRecords = this.db.attendanceRecords.filter(
      (r) => r.sessionId !== session!.id && r.sessionId !== deterministicSessionId
    );

    let unexcusedCount = 0;
    const targetClass = this.db.classes.find((c) => c.id === classId);
    const className = targetClass ? targetClass.name : 'ថ្នាក់រៀន';
    const newRecordIds = new Set<string>();

    // 3. Save records and immediately sync to Cloud Database for all Users
    for (const item of records) {
      const recId = toSafeFirestoreId(
        `att-${classId}-${date}-${periodSlug}-${item.studentId}`,
        'att'
      );
      newRecordIds.add(recId);
      const rec: AttendanceRecord = {
        id: recId,
        sessionId: session.id,
        studentId: item.studentId,
        studentName: item.studentName,
        classId,
        date,
        status: item.status,
        reason: item.reason || '',
        subjectId: subjectId || 'sbj-math',
        recordedBy,
        recordedByName,
        createdAt: new Date().toISOString(),
      };
      this.db.attendanceRecords.push(rec);

      // Sync to Firestore Cloud so ALL Users see this attendance immediately
      syncAttendanceRecordToCloud(rec).catch((e) =>
        console.warn('Cloud sync attendance error:', e)
      );

      // 4. If absent without permission, trigger notification alert to parent!
      if (item.status === 'absent_no_permission') {
        unexcusedCount++;
        const student = this.db.students.find((s) => s.id === item.studentId);
        if (student) {
          const telegramMessage = `🔔 [អនុវិទ្យាល័យទួលសំបួរ] ដំណឹងអវត្តមាន៖ សូមជម្រាបជូនលោក/លោកស្រី ${student.parentName} (${student.parentRelationship} របស់សិស្ស ${student.khmerName} ${className}) ថាកូនរបស់លោក/លោកស្រីបាន «អវត្តមានឥតច្បាប់» នៅថ្ងៃទី ${date} ក្នុងម៉ោង ${period}។ សូមមេត្តាទាក់ទងមកកាន់គ្រូប្រចាំថ្នាក់ ${recordedByName} តាមលេខទូរស័ព្ទដើម្បីបំភ្លឺ។ សូមអរគុណ!`;

          const notif: NotificationItem = {
            id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            type: 'telegram',
            recipientName: `${student.parentName} (${student.parentRelationship})`,
            recipientPhone: student.parentPhone,
            studentName: student.khmerName,
            title: `អវត្តមានឥតច្បាប់ - ${student.khmerName}`,
            message: telegramMessage,
            status: 'sent',
            sentAt: new Date().toISOString(),
          };
          this.db.notifications.unshift(notif);
        }
      }
    }

    // Remove any obsolete record IDs from Firestore if they had old random IDs
    oldRecordsToRemove.forEach((oldRec) => {
      if (!newRecordIds.has(oldRec.id)) {
        removeAttendanceRecordFromCloud(oldRec.id).catch(() => {});
      }
    });

    const actionText = isNew ? 'កត់ត្រាវត្តមានថ្មី' : 'កែប្រែទិន្នន័យវត្តមាន';
    this.logAudit(
      recordedByName,
      'teacher',
      actionText,
      `បានរក្សាទុកវត្តមាន ${className} ថ្ងៃ ${date} ចំនួនសិស្ស ${records.length} នាក់ (អវត្តមានឥតច្បាប់: ${unexcusedCount})`
    );

    this.saveDatabase(this.db);
    return { sessionId: session.id, unexcusedAlertsSent: unexcusedCount };
  }

  // Exams & Grading
  public getExams(): Exam[] {
    return this.db.exams;
  }

  public addExam(examData: Omit<Exam, 'id'>, actorName = 'Admin'): Exam {
    const newExam: Exam = {
      ...examData,
      id: `ex-${Date.now()}`,
    };
    this.db.exams.push(newExam);
    this.logAudit(actorName, 'admin', 'បង្កើតការប្រឡង', `បង្កើត ${newExam.title}`);
    this.saveDatabase(this.db);
    return newExam;
  }

  public getExamResults(examId: string, classId?: string): ExamResult[] {
    let results = this.db.examResults.filter((r) => r.examId === examId);
    if (classId && classId !== 'all') {
      results = results.filter((r) => r.classId === classId);
    }
    return results;
  }

  public saveExamResults(
    examId: string,
    classId: string,
    results: Array<{
      studentId: string;
      studentName: string;
      scores: Record<string, number>;
      totalScore: number;
      average: number;
      rank: number;
      gradeLetter: string;
      remarks: string;
    }>,
    actorName = 'Teacher'
  ): void {
    // Remove existing results for this exam & class
    this.db.examResults = this.db.examResults.filter(
      (r) => !(r.examId === examId && r.classId === classId)
    );

    for (const item of results) {
      const resId = toSafeFirestoreId(`res-${examId}-${classId}-${item.studentId}`, 'res');
      const examRes: ExamResult = {
        id: resId,
        examId,
        studentId: item.studentId,
        studentName: item.studentName,
        classId,
        scores: item.scores,
        totalScore: item.totalScore,
        average: item.average,
        rank: item.rank,
        gradeLetter: item.gradeLetter,
        remarks: item.remarks,
      };
      this.db.examResults.push(examRes);
      syncExamResultToCloud(examRes).catch((e) => console.warn('Cloud sync examResult error:', e));
    }

    const exam = this.db.exams.find((e) => e.id === examId);
    const targetClass = this.db.classes.find((c) => c.id === classId);
    this.logAudit(
      actorName,
      'teacher',
      'បញ្ចូលពិន្ទុប្រឡង',
      `បានរក្សាទុកពិន្ទុ ${exam?.title || ''} សម្រាប់ ${targetClass?.name || ''} ចំនួន ${results.length} នាក់`
    );

    this.saveDatabase(this.db);
  }

  public updateExam(id: string, updates: Partial<Exam>, actorName = 'Admin'): boolean {
    const index = this.db.exams.findIndex((e) => e.id === id);
    if (index === -1) return false;

    this.db.exams[index] = { ...this.db.exams[index], ...updates };
    this.logAudit(actorName, 'admin', 'កែប្រែសម័យប្រឡង', `កែប្រែព័ត៌មានសម័យប្រឡង ${this.db.exams[index].title}`);
    this.saveDatabase(this.db);
    return true;
  }

  public addSubjectToExam(examId: string, subjectId: string, actorName = 'Admin'): boolean {
    const exam = this.db.exams.find((e) => e.id === examId);
    if (!exam) return false;
    if (!exam.subjectIds) {
      exam.subjectIds = this.db.subjects.slice(0, 6).map((s) => s.id);
    }
    if (!exam.subjectIds.includes(subjectId)) {
      exam.subjectIds.push(subjectId);
      const subject = this.db.subjects.find((s) => s.id === subjectId);
      this.logAudit(actorName, 'admin', 'បន្ថែមមុខវិជ្ជាក្នុងការប្រឡង', `បន្ថែម ${subject?.nameKm || subjectId} ទៅ ${exam.title}`);
      this.saveDatabase(this.db);
    }
    return true;
  }

  public removeSubjectFromExam(examId: string, subjectId: string, actorName = 'Admin'): boolean {
    const exam = this.db.exams.find((e) => e.id === examId);
    if (!exam) return false;
    if (!exam.subjectIds) {
      exam.subjectIds = this.db.subjects.slice(0, 6).map((s) => s.id);
    }
    exam.subjectIds = exam.subjectIds.filter((sid) => sid !== subjectId);
    // Also remove from exam results scores
    this.db.examResults.forEach((r) => {
      if (r.examId === examId && r.scores && r.scores[subjectId] !== undefined) {
        delete r.scores[subjectId];
      }
    });
    const subject = this.db.subjects.find((s) => s.id === subjectId);
    this.logAudit(actorName, 'admin', 'ដកមុខវិជ្ជាចេញពីការប្រឡង', `ដក ${subject?.nameKm || subjectId} ចេញពី ${exam.title}`);
    this.saveDatabase(this.db);
    return true;
  }

  public setExamMaxScore(
    examId: string,
    maxScore: number,
    subjectId?: string,
    actorName = 'Admin'
  ): boolean {
    const exam = this.db.exams.find((e) => e.id === examId);
    if (!exam) return false;
    // Cap at 150 as requested by user
    const cappedScore = Math.max(1, Math.min(150, maxScore));

    if (subjectId && subjectId !== 'all') {
      if (!exam.subjectMaxScores) {
        exam.subjectMaxScores = {};
      }
      exam.subjectMaxScores[subjectId] = cappedScore;
      const subject = this.db.subjects.find((s) => s.id === subjectId);
      this.logAudit(
        actorName,
        'admin',
        'កំណត់ពិន្ទុពេញតាមមុខវិជ្ជា',
        `កំណត់ពិន្ទុពេញ ${cappedScore} សម្រាប់មុខវិជ្ជា ${subject?.nameKm || subjectId} ក្នុង ${exam.title}`
      );
    } else {
      exam.maxScorePerSubject = cappedScore;
      // If setting for all, also update all individual subjects in this exam
      if (!exam.subjectMaxScores) {
        exam.subjectMaxScores = {};
      }
      const activeIds = exam.subjectIds || this.db.subjects.slice(0, 6).map((s) => s.id);
      activeIds.forEach((sid) => {
        exam.subjectMaxScores![sid] = cappedScore;
      });
      this.logAudit(
        actorName,
        'admin',
        'កំណត់ពិន្ទុអតិបរមារួម',
        `កំណត់ពិន្ទុពេញ ${cappedScore} សម្រាប់គ្រប់មុខវិជ្ជាក្នុង ${exam.title}`
      );
    }

    this.saveDatabase(this.db);
    return true;
  }

  public setExamSubjectMaxScore(
    examId: string,
    subjectId: string,
    maxScore: number,
    actorName = 'Admin'
  ): boolean {
    return this.setExamMaxScore(examId, maxScore, subjectId, actorName);
  }

  public getExamSubjectMaxScore(exam: Exam, subjectId: string): number {
    if (exam.subjectMaxScores && exam.subjectMaxScores[subjectId] !== undefined) {
      return Math.min(150, Math.max(1, exam.subjectMaxScores[subjectId]));
    }
    return Math.min(150, Math.max(1, exam.maxScorePerSubject || 50));
  }

  // Academic Years
  public getAcademicYears(): AcademicYear[] {
    return this.db.academicYears;
  }

  public addAcademicYear(data: Omit<AcademicYear, 'id'>, actorName = 'Admin'): AcademicYear {
    if (data.isCurrent) {
      this.db.academicYears.forEach((ay) => (ay.isCurrent = false));
    }
    const newAy: AcademicYear = {
      ...data,
      id: `ay-${Date.now()}`,
    };
    this.db.academicYears.push(newAy);
    this.logAudit(actorName, 'admin', 'បង្កើតឆ្នាំសិក្សា', `បង្កើតឆ្នាំសិក្សា ${newAy.name}`);
    this.saveDatabase(this.db);
    return newAy;
  }

  // Notifications & Bell Alerts
  public getNotifications(): NotificationItem[] {
    return this.db.notifications;
  }

  public addNotification(
    data: Omit<NotificationItem, 'id' | 'sentAt'>,
    actorName = 'System'
  ): NotificationItem {
    const newNotif: NotificationItem = {
      ...data,
      id: `notif-${Date.now()}`,
      sentAt: new Date().toISOString(),
    };
    if (!this.db.notifications) this.db.notifications = [];
    this.db.notifications.unshift(newNotif);
    this.logAudit(actorName, 'system', 'បង្កើតសារជូនដំណឹង', `សារជូនដំណឹងថ្មី៖ ${newNotif.title}`);
    this.saveDatabase(this.db);
    return newNotif;
  }

  public markAllNotificationsAsRead(): void {
    if (!this.db.notifications) return;
    this.db.notifications = this.db.notifications.map((n) => ({
      ...n,
      status: 'read',
    }));
    this.saveDatabase(this.db);
  }

  public clearNotifications(): void {
    this.db.notifications = [];
    this.saveDatabase(this.db);
  }

  // Telegram Bot Settings Management
  public getTelegramSettings() {
    if (!this.db.telegramSettings || this.db.telegramSettings.botToken?.includes('Simulated') || !this.db.telegramSettings.botUsername) {
      this.db.telegramSettings = {
        botUsername: '@machin_caffee_bot',
        botToken: '8854828129:AAHp_oHUOkQ1u9vJiT8tFU8HtSygyaZHWyU',
        chatId: this.db.telegramSettings?.chatId || '',
        isEnabled: true,
      };
      this.saveDatabase(this.db);
    }
    return this.db.telegramSettings;
  }

  public updateTelegramSettings(settings: Partial<SchoolDatabase['telegramSettings']>, actorName = 'Admin'): boolean {
    this.db.telegramSettings = {
      ...this.getTelegramSettings(),
      ...settings,
    };
    this.logAudit(
      actorName,
      'admin',
      'កែប្រែការកំណត់ Telegram Bot',
      `បានកែប្រែ Bot: ${this.db.telegramSettings.botUsername || ''} (Token: ${this.db.telegramSettings.botToken ? 'កំណត់រួច' : 'ទទេ'})`
    );
    this.saveDatabase(this.db);
    return true;
  }

  // Dynamic & Customizable Auto-Rotating Banners
  public getBanners(): BannerSlide[] {
    if (!this.db.banners || this.db.banners.length === 0) {
      this.db.banners = INITIAL_BANNERS;
      this.saveDatabase(this.db);
    }
    return this.db.banners.filter((b) => b.isActive).sort((a, b) => a.order - b.order);
  }

  public getAllBanners(): BannerSlide[] {
    if (!this.db.banners || this.db.banners.length === 0) {
      this.db.banners = INITIAL_BANNERS;
      this.saveDatabase(this.db);
    }
    return this.db.banners.sort((a, b) => a.order - b.order);
  }

  public saveBanners(banners: BannerSlide[], actorName = 'Admin'): void {
    this.db.banners = banners;
    this.logAudit(actorName, 'admin', 'កែសម្រួលផ្ទាំង Banner', `បានកែសម្រួលផ្ទាំង Banner វិល`);
    this.saveDatabase(this.db);
  }

  public addBanner(slideData: Omit<BannerSlide, 'id'>, actorName = 'Admin'): BannerSlide {
    if (!this.db.banners) this.db.banners = [];
    const newSlide: BannerSlide = {
      ...slideData,
      order: slideData.order ?? (this.db.banners.length + 1),
      id: `banner-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    this.db.banners.push(newSlide);
    this.logAudit(actorName, 'admin', 'បន្ថែមផ្ទាំង Banner ថ្មី', `បន្ថែមផ្ទាំង Banner៖ ${newSlide.title}`);
    this.saveDatabase(this.db);
    return newSlide;
  }

  public updateBanner(id: string, updates: Partial<BannerSlide>, actorName = 'Admin'): boolean {
    if (!this.db.banners) return false;
    const index = this.db.banners.findIndex((b) => b.id === id);
    if (index === -1) return false;
    this.db.banners[index] = { ...this.db.banners[index], ...updates };
    this.logAudit(actorName, 'admin', 'កែប្រែផ្ទាំង Banner', `កែប្រែផ្ទាំង Banner៖ ${this.db.banners[index].title}`);
    this.saveDatabase(this.db);
    return true;
  }

  public deleteBanner(id: string, actorName = 'Admin'): boolean {
    if (!this.db.banners) return false;
    const banner = this.db.banners.find((b) => b.id === id);
    if (!banner) return false;
    this.db.banners = this.db.banners.filter((b) => b.id !== id);
    this.logAudit(actorName, 'admin', 'លុបផ្ទាំង Banner', `លុបផ្ទាំង Banner៖ ${banner.title}`);
    this.saveDatabase(this.db);
    return true;
  }

  // Users
  public getSystemAccessCode(): string {
    return this.db.systemAccessCode || 'admin123';
  }

  public setSystemAccessCode(newCode: string, actorName = 'Admin'): boolean {
    const trimmed = newCode.trim();
    if (trimmed.length < 4) return false;
    this.db.systemAccessCode = trimmed;
    // Every user must use this single code
    this.db.users.forEach((u) => {
      u.password = trimmed;
    });
    this.logAudit(
      actorName,
      'admin',
      'កែប្រែលេខកូដសម្ងាត់ប្រព័ន្ធរួម',
      `បានកំណត់លេខកូដសម្ងាត់រួមថ្មីសម្រាប់គ្រប់គណនីទាំងអស់`
    );
    this.saveDatabase(this.db);
    // Sync to backend server API
    if (typeof window !== 'undefined' && 'fetch' in window) {
      window.fetch('/api/system/access-code', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessCode: trimmed }),
      }).catch((e) => console.warn('Could not sync access-code to backend:', e));
    }
    return true;
  }

  public getUsers(): User[] {
    return this.db.users;
  }

  public addUser(userData: Omit<User, 'id'>, actorName = 'Admin'): User {
    const newUser: User = {
      ...userData,
      password: this.getSystemAccessCode(), // All users share the single universal system code
      id: `usr-${Date.now()}`,
      status: userData.status || 'active',
      createdAt: new Date().toISOString().split('T')[0],
    };
    this.db.users.push(newUser);
    this.logAudit(actorName, 'admin', 'បន្ថែមអ្នកប្រើប្រាស់/Admin', `បន្ថែមគណនី ${newUser.name} (${newUser.username})`);
    this.saveDatabase(this.db);
    syncUserToCloud(newUser).catch((e) => console.warn('Cloud sync user error:', e));
    return newUser;
  }

  public updateUser(id: string, updates: Partial<User>, actorName = 'Admin'): boolean {
    const index = this.db.users.findIndex((u) => u.id === id);
    if (index === -1) return false;

    // If password is changed for any user, it changes the single shared system access code for all users!
    if (updates.password && updates.password.trim() !== this.getSystemAccessCode()) {
      this.setSystemAccessCode(updates.password.trim(), actorName);
    }

    this.db.users[index] = { ...this.db.users[index], ...updates, password: this.getSystemAccessCode() };
    this.logAudit(actorName, 'admin', 'កែប្រែគណនីអ្នកប្រើប្រាស់', `កែប្រែគណនី ${this.db.users[index].name}`);
    this.saveDatabase(this.db);
    syncUserToCloud(this.db.users[index]).catch((e) => console.warn('Cloud sync user error:', e));
    return true;
  }

  public deleteUser(id: string, actorName = 'Admin'): boolean {
    const user = this.db.users.find((u) => u.id === id);
    if (!user) return false;
    if (user.username === 'admin') return false; // Prevent deleting root admin

    this.db.users = this.db.users.filter((u) => u.id !== id);
    this.logAudit(actorName, 'admin', 'លុបគណនីអ្នកប្រើប្រាស់', `លុបគណនី ${user.name} (${user.username})`);
    this.saveDatabase(this.db);
    return true;
  }

  public authenticate(username: string, password: string): User | null {
    const universalCode = this.getSystemAccessCode();
    // Validate single universal passcode: ONLY the current system access code is accepted!
    if (password.trim() !== universalCode) {
      return null;
    }

    const trimmedUser = (username || '').trim().toLowerCase();
    const primaryAdmin = this.db.users.find((u) => u.username === 'admin') || this.db.users[0] || INITIAL_USERS[0];

    // If username is empty or 'admin', immediately authenticate into unified school administration
    if (!trimmedUser || trimmedUser === 'admin') {
      this.logAudit(primaryAdmin.name, 'admin', 'ចូលប្រើប្រព័ន្ធរួម', 'ចូលប្រើប្រព័ន្ធរួមដោយជោគជ័យ (Unified System Access)');
      return primaryAdmin;
    }

    // Otherwise find the specified user
    const user = this.db.users.find(
      (u) => u.username.toLowerCase() === trimmedUser
    );
    if (user && user.status !== 'inactive') {
      this.logAudit(user.name, user.role, 'ចូលប្រើប្រព័ន្ធរួម', `ចូលប្រើប្រព័ន្ធរួមដោយជោគជ័យ (${user.name})`);
      return user;
    }
    return null;
  }

  public getCurrentSession(): User | null {
    if (typeof window === 'undefined') return null;
    try {
      // 1. Check if user explicitly logged out
      const hasExplicitlyLoggedOut = window.localStorage?.getItem('toulsambour_logged_out') === 'true';
      if (hasExplicitlyLoggedOut) {
        return null;
      }

      // 2. Check saved session in localStorage or sessionStorage
      const sessionStr = window.localStorage?.getItem('toulsambour_auth_session') ||
                         window.sessionStorage?.getItem('toulsambour_auth_session');
      if (sessionStr) {
        const parsed = JSON.parse(sessionStr);
        const liveUser = this.db.users.find((u) => u.id === parsed.id && u.status !== 'inactive');
        if (liveUser) return liveUser;
      }

      // 3. Default to active Admin account if not logged out (guarantees preview opens directly into the app)
      const defaultAdmin = this.db.users.find((u) => u.username === 'admin') || this.db.users[0];
      return defaultAdmin || null;
    } catch {
      return this.db.users[0] || null;
    }
  }

  public setSession(user: User): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage?.removeItem('toulsambour_logged_out');
      window.localStorage?.setItem('toulsambour_auth_session', JSON.stringify(user));
      window.sessionStorage?.setItem('toulsambour_auth_session', JSON.stringify(user));
    } catch (e) {
      console.warn('Failed to set session:', e);
    }
  }

  public clearSession(): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage?.setItem('toulsambour_logged_out', 'true');
      window.localStorage?.removeItem('toulsambour_auth_session');
      window.sessionStorage?.removeItem('toulsambour_auth_session');
    } catch (e) {
      console.warn('Failed to clear session:', e);
    }
  }

  // Behavior & Merits Management
  public getBehaviorRecords(): StudentBehaviorRecord[] {
    return this.db.behaviorRecords || [];
  }

  public addBehaviorRecord(record: Omit<StudentBehaviorRecord, 'id'>, actorName = 'Admin'): StudentBehaviorRecord {
    const newRecord: StudentBehaviorRecord = {
      ...record,
      id: `beh-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    if (!this.db.behaviorRecords) this.db.behaviorRecords = [];
    this.db.behaviorRecords.unshift(newRecord);
    this.logAudit(actorName, 'admin', 'កត់ត្រាវិន័យ/លើកទឹកចិត្ត', `${record.type === 'merit' ? 'លើកទឹកចិត្ត' : 'វិន័យ'} សិស្ស ${record.studentName}: ${record.title}`);
    this.saveDatabase(this.db);
    return newRecord;
  }

  public updateBehaviorRecord(id: string, updates: Partial<StudentBehaviorRecord>, actorName = 'Admin'): boolean {
    if (!this.db.behaviorRecords) return false;
    const idx = this.db.behaviorRecords.findIndex((b) => b.id === id);
    if (idx === -1) return false;
    this.db.behaviorRecords[idx] = { ...this.db.behaviorRecords[idx], ...updates };
    this.logAudit(actorName, 'admin', 'កែប្រែកំណត់ត្រាវិន័យ', `កែប្រែកំណត់ត្រារបស់សិស្ស ${this.db.behaviorRecords[idx].studentName}`);
    this.saveDatabase(this.db);
    return true;
  }

  public deleteBehaviorRecord(id: string, actorName = 'Admin'): boolean {
    if (!this.db.behaviorRecords) return false;
    const rec = this.db.behaviorRecords.find((b) => b.id === id);
    if (!rec) return false;
    this.db.behaviorRecords = this.db.behaviorRecords.filter((b) => b.id !== id);
    this.logAudit(actorName, 'admin', 'លុបកំណត់ត្រាវិន័យ', `លុបកំណត់ត្រារបស់សិស្ស ${rec.studentName}`);
    this.saveDatabase(this.db);
    return true;
  }

  // Bulk Student Import
  public bulkAddStudents(studentsList: Array<Omit<Student, 'id'>>, actorName = 'Admin'): Student[] {
    const added: Student[] = [];
    studentsList.forEach((s, idx) => {
      const studentId = s.studentId?.trim() || `STU-${Date.now().toString().slice(-4)}${idx + 1}`;
      const newStudent: Student = {
        ...s,
        id: `stu-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
        studentId,
        photo: s.photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150',
      };
      this.db.students.push(newStudent);
      added.push(newStudent);
      syncStudentToCloud(newStudent).catch(() => {});
    });

    this.logAudit(actorName, 'admin', 'នាំចូលសិស្សជាក្រុម (Excel Import)', `បាននាំចូលសិស្សចំនួន ${added.length} នាក់ដោយជោគជ័យ`);
    this.saveDatabase(this.db);
    return added;
  }
}

export const storage = new StorageService();

