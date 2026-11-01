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
  syncExamResultToCloud,
  syncUserToCloud,
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
  telegramSettings: {
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
    name: 'លោក ស៊ុយ បូរ៉ា (Admin)',
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

const INITIAL_TEACHERS: Teacher[] = [];

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

const INITIAL_TIMETABLE: TimetableSlot[] = [];

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

class StorageService {
  private db: SchoolDatabase;
  private listeners: Array<() => void> = [];

  constructor() {
    this.db = this.loadDatabase();
    this.initCloudSync();
  }

  private initCloudSync(): void {
    if (typeof window === 'undefined') return;
    try {
      startFirestoreSync({
        onStudentsChange: (remote) => {
          if (remote && Array.isArray(remote)) {
            this.db.students = remote;
            this.saveLocalOnly(this.db);
          }
        },
        onTeachersChange: (remote) => {
          if (remote && Array.isArray(remote)) {
            this.db.teachers = remote;
            this.saveLocalOnly(this.db);
          }
        },
        onClassesChange: (remote) => {
          if (remote && Array.isArray(remote)) {
            this.db.classes = remote;
            this.saveLocalOnly(this.db);
          }
        },
        onAttendanceChange: (remote) => {
          if (remote && Array.isArray(remote)) {
            this.db.attendanceRecords = remote;
            this.saveLocalOnly(this.db);
          }
        },
        onExamResultsChange: (remote) => {
          if (remote && Array.isArray(remote)) {
            this.db.examResults = remote;
            this.saveLocalOnly(this.db);
          }
        },
        onUsersChange: (remote) => {
          if (remote && remote.length > 0) {
            const admin = this.db.users.find((u) => u.username === 'admin');
            const merged = [...remote];
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
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(DB_KEY, JSON.stringify(data));
      }
      this.db = data;
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
      telegramSettings: {
        botToken: '6744553829:AAFtG_SchoolToulsambourBot_Simulated',
        chatId: '-10023456789',
        isEnabled: true,
      },
    };

    this.saveDatabase(initialDb);
    return initialDb;
  }

  private saveDatabase(data: SchoolDatabase): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(DB_KEY, JSON.stringify(data));
      }
      this.db = data;
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

    // update class count
    const targetClass = this.db.classes.find((c) => c.id === newStudent.classId);
    if (targetClass) {
      targetClass.currentStudentCount = (targetClass.currentStudentCount || 0) + 1;
    }

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

    // update class count
    const targetClass = this.db.classes.find((c) => c.id === student.classId);
    if (targetClass && targetClass.currentStudentCount && targetClass.currentStudentCount > 0) {
      targetClass.currentStudentCount--;
    }

    this.logAudit(actorName, 'admin', 'លុបសិស្ស', `លុបសិស្ស ${student.khmerName} (${student.studentId})`);
    this.saveDatabase(this.db);
    removeStudentFromCloud(student.id).catch((e) => console.warn('Cloud sync delete error:', e));
    return true;
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
    let slots = this.db.timetable;
    if (classId && classId !== 'all') {
      slots = slots.filter((t) => t.classId === classId);
    }
    if (teacherId && teacherId !== 'all') {
      slots = slots.filter((t) => t.teacherId === teacherId);
    }
    return slots;
  }

  public addTimetableSlot(slot: Omit<TimetableSlot, 'id'>): TimetableSlot {
    const newSlot: TimetableSlot = {
      ...slot,
      id: `tt-${Date.now()}`,
    };
    this.db.timetable.push(newSlot);
    this.saveDatabase(this.db);
    return newSlot;
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
    return this.db.attendanceSessions.find(
      (s) => s.classId === classId && s.date === date && s.period === period
    );
  }

  /**
   * Save a complete attendance session for a class, preventing duplicates
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
    // 1. Find or create session
    let session = this.getAttendanceSession(classId, date, period);
    const isNew = !session;

    if (!session) {
      session = {
        id: `sess-${Date.now()}`,
        classId,
        date,
        period,
        subjectId,
        recordedBy,
        createdAt: new Date().toISOString(),
      };
      this.db.attendanceSessions.push(session);
    }

    // 2. Clear old records for this session to prevent duplicates
    this.db.attendanceRecords = this.db.attendanceRecords.filter(
      (r) => r.sessionId !== session!.id
    );

    let unexcusedCount = 0;
    const targetClass = this.db.classes.find((c) => c.id === classId);
    const className = targetClass ? targetClass.name : 'ថ្នាក់រៀន';

    // 3. Save records
    for (const item of records) {
      const recId = `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const rec: AttendanceRecord = {
        id: recId,
        sessionId: session.id,
        studentId: item.studentId,
        studentName: item.studentName,
        classId,
        date,
        status: item.status,
        reason: item.reason,
        subjectId,
        recordedBy,
        recordedByName,
        createdAt: new Date().toISOString(),
      };
      this.db.attendanceRecords.push(rec);

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
      const examRes: ExamResult = {
        id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
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

  public setExamMaxScore(examId: string, maxScore: number, actorName = 'Admin'): boolean {
    const exam = this.db.exams.find((e) => e.id === examId);
    if (!exam) return false;
    // Cap at 150 as requested by user
    const cappedScore = Math.max(1, Math.min(150, maxScore));
    exam.maxScorePerSubject = cappedScore;
    this.logAudit(actorName, 'admin', 'កំណត់ពិន្ទុអតិបរមា', `កំណត់ពិន្ទុពេញ ${cappedScore} សម្រាប់ ${exam.title}`);
    this.saveDatabase(this.db);
    return true;
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
      order: this.db.banners.length + 1,
      ...slideData,
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
    if (typeof window !== 'undefined' && window.fetch) {
      fetch('/api/system/access-code', {
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

    const user = this.db.users.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase()
    );
    if (user && user.status !== 'inactive') {
      this.logAudit(user.name, user.role, 'ចូលប្រើប្រព័ន្ធ', `ចូលប្រើប្រព័ន្ធដោយជោគជ័យ (Login)`);
      return user;
    }
    return null;
  }

  public getCurrentSession(): User | null {
    if (typeof window === 'undefined') return null;
    try {
      const sessionStr = sessionStorage.getItem('toulsambour_auth_session');
      if (!sessionStr) return null;
      const parsed = JSON.parse(sessionStr);
      // Verify user still exists in DB and is active
      const liveUser = this.db.users.find((u) => u.id === parsed.id && u.status !== 'inactive');
      return liveUser || null;
    } catch {
      return null;
    }
  }

  public setSession(user: User): void {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem('toulsambour_auth_session', JSON.stringify(user));
    } catch (e) {
      console.error('Failed to set session:', e);
    }
  }

  public clearSession(): void {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.removeItem('toulsambour_auth_session');
    } catch (e) {
      console.error('Failed to clear session:', e);
    }
  }
}

export const storage = new StorageService();

