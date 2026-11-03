import React, { useState, useEffect, useCallback } from 'react';
import { storage } from './services/storage.ts';
import { User, Student, Teacher, SchoolClass, Subject, AttendanceRecord, Exam, ExamResult, AcademicYear, NotificationItem, AuditLogItem } from './types/index.ts';
import { Header } from './components/Header.tsx';
import { Sidebar, NavTab } from './components/Sidebar.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { AttendanceView } from './components/AttendanceView.tsx';
import { AttendanceReportsView } from './components/AttendanceReportsView.tsx';
import { StudentView } from './components/StudentView.tsx';
import { TeacherView } from './components/TeacherView.tsx';
import { ClassView } from './components/ClassView.tsx';
import { SubjectView } from './components/SubjectView.tsx';
import { AcademicYearView } from './components/AcademicYearView.tsx';
import { TelegramNotificationView } from './components/TelegramNotificationView.tsx';
import { SecurityBackupView } from './components/SecurityBackupView.tsx';
import { GradeExamView } from './components/GradeExamView.tsx';
import { TimetableView } from './components/TimetableView.tsx';
import { BehaviorView } from './components/BehaviorView.tsx';
import { UsersManagementView } from './components/UsersManagementView.tsx';
import { LoginModal } from './components/LoginModal.tsx';
import { LoginScreen } from './components/LoginScreen.tsx';
import { PrintReportModal } from './components/PrintReportModal.tsx';
import { BellNotificationToast, ToastData } from './components/BellNotificationToast.tsx';
import { checkAbsenceWarning } from './utils/calculations.ts';
import { SCHOOL_LOGO_URL } from './utils/schoolLogo.ts';
import { Menu, X, LayoutDashboard, CalendarCheck2, GraduationCap, FileText, MoreHorizontal } from 'lucide-react';

export default function App() {
  const [dbState, setDbState] = useState(() => storage.getDatabase());
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [attendanceTargetClassId, setAttendanceTargetClassId] = useState<string | undefined>(undefined);
  const [currentUser, setCurrentUser] = useState<User | null>(() => storage.getCurrentSession());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleOpenClassAttendance = useCallback((classId?: string) => {
    if (classId) {
      setAttendanceTargetClassId(classId);
    }
    setCurrentTab('attendance');
  }, []);

  // Floating Bell Notification Toast state
  const [activeToast, setActiveToast] = useState<ToastData | null>(null);

  const handleCloseToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  const handleTriggerToast = useCallback((toast: ToastData) => {
    setActiveToast({
      id: `toast-${Date.now()}`,
      ...toast,
    });
  }, []);

  // Print modal state
  const [printModalInfo, setPrintModalInfo] = useState<{
    isOpen: boolean;
    reportType: 'attendance' | 'exam';
    data: any;
  }>({
    isOpen: false,
    reportType: 'attendance',
    data: null,
  });

  // Subscribe to storage changes
  useEffect(() => {
    const unsubscribe = storage.subscribe(() => {
      setDbState({ ...storage.getDatabase() });
    });
    return unsubscribe;
  }, []);

  // Initial welcome bell chime notification for demo / active alert awareness
  useEffect(() => {
    const timer = setTimeout(() => {
      const unreadAlert = dbState.notifications.find((n) => n.status === 'sent');
      if (unreadAlert) {
        handleTriggerToast({
          title: unreadAlert.title,
          message: unreadAlert.message,
          type: 'warning',
          actionLabel: 'ពិនិត្យមើលវត្តមាន',
          actionTab: 'attendance',
          duration: 6500,
        });
      } else {
        handleTriggerToast({
          title: '🔔 ប្រព័ន្ធគ្រប់គ្រងសាលារៀនដំណើរការ',
          message: 'សូមស្វាគមន៍មកកាន់ អនុវិទ្យាល័យ ហ៊ុន សែន ទួលសំបួរ! ប្រព័ន្ធទិន្នន័យដំណើរការធម្មតា។',
          type: 'info',
          actionLabel: 'មើលរបាយការណ៍',
          actionTab: 'attendance_reports',
          duration: 5500,
        });
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [handleTriggerToast]);

  const handleRefresh = () => {
    setDbState({ ...storage.getDatabase() });
  };

  const handleLogout = () => {
    storage.clearSession();
    setCurrentUser(null);
  };

  // Trigger official print modal
  const handleOpenPrintReport = (type: 'attendance' | 'exam', payload: any) => {
    setPrintModalInfo({
      isOpen: true,
      reportType: type,
      data: payload,
    });
  };

  // If user is not authenticated, render full-screen login gate
  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={(authedUser) => {
          setCurrentUser(authedUser);
          handleRefresh();
        }}
      />
    );
  }

  // Count unexcused absence warnings for sidebar badge
  const unexcusedCount = dbState.students.reduce((acc, student) => {
    const studentRecs = dbState.attendanceRecords.filter((r) => r.studentId === student.id);
    const warning = checkAbsenceWarning(studentRecs, 2);
    return warning.isWarned ? acc + 1 : acc;
  }, 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-khmer text-slate-800 antialiased">
      {/* App Shell Wrapper (Hidden completely when printing report) */}
      <div className="app-shell flex-1 flex flex-col">
        {/* Top Navigation Bar */}
        <Header
          currentUser={currentUser}
          onSwitchUser={(user) => {
            storage.setSession(user);
            setCurrentUser(user);
          }}
          allUsers={dbState.users}
          notifications={dbState.notifications}
          onOpenNotifications={() => setCurrentTab('telegram')}
          onOpenTelegramModal={() => setCurrentTab('telegram')}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
          onLogout={handleLogout}
          onTriggerToast={handleTriggerToast}
        />

      {/* Mobile Menu Bar Toggle */}
      <div className="md:hidden bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between no-print sticky top-[68px] sm:top-[78px] z-20 shadow-md border-b border-amber-500/20">
        <div className="flex items-center gap-2 min-w-0">
          <img
            src={SCHOOL_LOGO_URL}
            alt="Logo"
            className="w-7 h-7 shrink-0 object-cover scale-[1.38] rounded-full bg-white p-0.5 border border-amber-400"
          />
          <span className="font-moul text-xs text-amber-400 truncate">អនុវិទ្យាល័យ ហ៊ុន សែន ទួលសំបួរ</span>
        </div>
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="px-2.5 py-1 rounded-lg bg-slate-800 border border-amber-400/30 text-amber-300 hover:text-white flex items-center gap-1.5 text-xs font-semibold cursor-pointer shrink-0"
        >
          {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          <span>ម៉ឺនុយ</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col md:flex-row min-w-0">
        {/* Sidebar Desktop */}
        <div className="hidden md:block flex-shrink-0">
          <Sidebar
            currentTab={currentTab}
            onSelectTab={(tab) => setCurrentTab(tab)}
            userRole={currentUser.role}
            unexcusedCount={unexcusedCount}
          />
        </div>

        {/* Mobile Sidebar Drawer (Scrollable on Android Touch Devices) */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
            ></div>
            <div className="relative flex-1 flex flex-col max-w-[85vw] sm:max-w-xs w-full h-full max-h-[100dvh] overflow-y-auto overscroll-contain touch-pan-y bg-slate-900 z-50 shadow-2xl">
              <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-slate-950/95 border-b border-amber-500/25 backdrop-blur-xs">
                <span className="font-moul text-xs text-amber-400">ម៉ឺនុយប្រព័ន្ធសាលារៀន</span>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-200 hover:text-white border border-slate-700 cursor-pointer flex items-center gap-1 text-xs"
                  aria-label="បិទម៉ឺនុយ"
                >
                  <X className="w-4 h-4" />
                  <span>បិទ</span>
                </button>
              </div>
              <Sidebar
                currentTab={currentTab}
                onSelectTab={(tab) => {
                  setCurrentTab(tab);
                  setIsMobileMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                userRole={currentUser.role}
                unexcusedCount={unexcusedCount}
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-28 md:pb-10 overflow-x-hidden print:p-0 print:m-0 print:max-w-none print:overflow-visible">
          {currentTab === 'dashboard' && (
            <DashboardView
              students={dbState.students}
              teachers={dbState.teachers}
              classes={dbState.classes}
              attendanceRecords={dbState.attendanceRecords}
              examResults={dbState.examResults}
              userRole={currentUser.role}
              onNavigate={(tab) => setCurrentTab(tab)}
              onOpenTelegramModal={() => setCurrentTab('telegram')}
              onTriggerToast={(toast) => setActiveToast(toast)}
              onRefresh={handleRefresh}
            />
          )}

          {currentTab === 'attendance' && (
            <AttendanceView
              students={dbState.students}
              classes={dbState.classes}
              subjects={dbState.subjects}
              academicYears={dbState.academicYears}
              attendanceRecords={dbState.attendanceRecords}
              currentUser={currentUser}
              initialClassId={attendanceTargetClassId}
              onOpenTelegramModal={() => setCurrentTab('telegram')}
            />
          )}

          {currentTab === 'attendance_reports' && (
            <AttendanceReportsView
              students={dbState.students}
              classes={dbState.classes}
              attendanceRecords={dbState.attendanceRecords}
              onPrintOfficialReport={handleOpenPrintReport}
            />
          )}

          {currentTab === 'grades' && (
            <GradeExamView
              students={dbState.students}
              classes={dbState.classes}
              subjects={dbState.subjects}
              exams={dbState.exams}
              examResults={dbState.examResults}
              onRefresh={handleRefresh}
              onPrintOfficialReport={handleOpenPrintReport}
            />
          )}

          {currentTab === 'timetable' && (
            <TimetableView
              classes={dbState.classes}
              teachers={dbState.teachers}
              subjects={dbState.subjects}
              onRefresh={handleRefresh}
            />
          )}

          {currentTab === 'students' && (
            <StudentView
              students={dbState.students}
              classes={dbState.classes}
              onRefresh={handleRefresh}
            />
          )}

          {currentTab === 'teachers' && (
            <TeacherView
              teachers={dbState.teachers}
              classes={dbState.classes}
              onRefresh={handleRefresh}
              onTakeAttendance={handleOpenClassAttendance}
            />
          )}

          {currentTab === 'classes' && (
            <ClassView
              classes={dbState.classes}
              teachers={dbState.teachers}
              students={dbState.students}
              onRefresh={handleRefresh}
              onTakeAttendance={handleOpenClassAttendance}
            />
          )}

          {currentTab === 'subjects' && (
            <SubjectView
              subjects={dbState.subjects}
              teachers={dbState.teachers}
              onRefresh={handleRefresh}
            />
          )}

          {currentTab === 'academic_year' && (
            <AcademicYearView
              academicYears={dbState.academicYears}
              classes={dbState.classes}
              students={dbState.students}
              onRefresh={handleRefresh}
            />
          )}

          {currentTab === 'behavior' && (
            <BehaviorView
              students={dbState.students}
              classes={dbState.classes}
              onRefresh={handleRefresh}
            />
          )}

          {currentTab === 'telegram' && (
            <TelegramNotificationView
              notifications={dbState.notifications}
              students={dbState.students}
              classes={dbState.classes}
              onRefresh={handleRefresh}
            />
          )}

          {currentTab === 'security_db' && (
            <SecurityBackupView
              auditLogs={dbState.auditLogs}
              onRefresh={handleRefresh}
            />
          )}

          {currentTab === 'users' && (
            <UsersManagementView
              users={dbState.users}
              currentUser={currentUser}
              onRefresh={handleRefresh}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (សម្រាប់ទូរស័ព្ទដៃ) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-1.5 py-1.5 z-30 flex items-center justify-around no-print shadow-2xl safe-area-bottom">
        <button
          onClick={() => setCurrentTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-medium transition-colors cursor-pointer ${
            currentTab === 'dashboard'
              ? 'text-amber-400 font-bold bg-slate-800/80'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 mb-0.5" />
          <span>ផ្ទាំងដើម</span>
        </button>

        <button
          onClick={() => setCurrentTab('attendance')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-medium transition-colors cursor-pointer ${
            currentTab === 'attendance'
              ? 'text-amber-400 font-bold bg-slate-800/80'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CalendarCheck2 className="w-4 h-4 mb-0.5" />
          <span>វត្តមាន</span>
        </button>

        <button
          onClick={() => setCurrentTab('students')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-medium transition-colors cursor-pointer ${
            currentTab === 'students'
              ? 'text-amber-400 font-bold bg-slate-800/80'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <GraduationCap className="w-4 h-4 mb-0.5" />
          <span>សិស្ស</span>
        </button>

        <button
          onClick={() => setCurrentTab('attendance_reports')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-medium transition-colors cursor-pointer ${
            currentTab === 'attendance_reports'
              ? 'text-amber-400 font-bold bg-slate-800/80'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4 mb-0.5" />
          <span>របាយការណ៍</span>
        </button>

        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-medium transition-colors cursor-pointer ${
            isMobileMenuOpen
              ? 'text-amber-400 font-bold bg-slate-800/80'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MoreHorizontal className="w-4 h-4 mb-0.5" />
          <span>ម៉ឺនុយ</span>
        </button>
      </nav>
      </div>

      {/* Floating Bell Notification Toast with RGB Glow */}
      <BellNotificationToast
        toast={activeToast}
        onClose={handleCloseToast}
        onNavigate={(tab) => setCurrentTab(tab as NavTab)}
      />

      {/* Official A4 Print Modal */}
      <PrintReportModal
        isOpen={printModalInfo.isOpen}
        onClose={() => setPrintModalInfo({ ...printModalInfo, isOpen: false })}
        reportType={printModalInfo.reportType}
        data={printModalInfo.data}
      />

      {/* Login Authentication Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={(authedUser) => {
          storage.setSession(authedUser);
          setCurrentUser(authedUser);
          handleRefresh();
        }}
      />
    </div>
  );
}
