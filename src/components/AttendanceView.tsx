import React, { useState, useEffect } from 'react';
import {
  CalendarCheck2,
  Calendar,
  Clock,
  BookOpen,
  School,
  Save,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Send,
  Check,
  Search,
  Filter,
  QrCode,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  Student,
  SchoolClass,
  Subject,
  AttendanceStatus,
  AcademicYear,
  User,
} from '../types/index.ts';
import { storage } from '../services/storage.ts';
import {
  formatKhmerDate,
  getAttendanceStatusBadge,
  getTodayLocalStr,
  KHMER_MONTHS,
  getKhmerMonthName,
  toKhmerNum,
} from '../utils/calculations.ts';
import { safeAvatar } from '../utils/avatar.ts';
import { QrAttendanceScannerModal } from './QrAttendanceScannerModal.tsx';

interface AttendanceViewProps {
  students: Student[];
  classes: SchoolClass[];
  subjects: Subject[];
  academicYears: AcademicYear[];
  currentUser: User;
  onOpenTelegramModal: () => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  students,
  classes,
  subjects,
  academicYears,
  currentUser,
  onOpenTelegramModal,
}) => {
  const todayStr = getTodayLocalStr();

  // Filters - Default to real current date (ថ្ងៃបច្ចុប្បន្ន)
  const [selectedYearId, setSelectedYearId] = useState<string>(
    academicYears.find((y) => y.isCurrent)?.id || academicYears[0]?.id || ''
  );
  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayLocalStr());
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || 'cls-7a');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('ព្រឹក ម៉ោងទី ១ (០៧:០០ - ០៧:៥០)');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('sbj-math');

  // Derive active year & month from selectedDate (YYYY-MM-DD)
  const [activeYearStr, activeMonthStr, activeDayStr] = selectedDate.split('-');
  const isToday = selectedDate === todayStr;

  // Attendance state: map studentId -> { status, reason }
  const [attendanceState, setAttendanceState] = useState<
    Record<string, { status: AttendanceStatus; reason: string }>
  >({});

  // UI feedback
  const [isSavedRecently, setIsSavedRecently] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{
    show: boolean;
    message: string;
    unexcusedSent: number;
  }>({ show: false, message: '', unexcusedSent: 0 });
  const [isExistingSession, setIsExistingSession] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Switch month helper (preserves year and clamps day to valid days in that month)
  const handleSelectMonth = (newMonthVal: string) => {
    const yearNum = Number(activeYearStr) || new Date().getFullYear();
    const monthNum = Number(newMonthVal);
    // If selecting the current real month and year, jump to today's date
    const now = new Date();
    if (yearNum === now.getFullYear() && monthNum === now.getMonth() + 1) {
      setSelectedDate(getTodayLocalStr());
      return;
    }
    const currentDayNum = Number(activeDayStr) || 1;
    const maxDaysInMonth = new Date(yearNum, monthNum, 0).getDate();
    const safeDay = String(Math.min(currentDayNum, maxDaysInMonth)).padStart(2, '0');
    setSelectedDate(`${yearNum}-${newMonthVal}-${safeDay}`);
  };

  // Shift date by N days
  const handleShiftDate = (daysDelta: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + daysDelta);
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  };

  // Jump to current real date
  const handleJumpToToday = () => {
    setSelectedDate(getTodayLocalStr());
  };

  const handleScanMarkAttendance = (studentId: string, status: AttendanceStatus) => {
    setAttendanceState((prev) => ({
      ...prev,
      [studentId]: {
        status,
        reason: prev[studentId]?.reason || 'ស្កេនតាម QR Code / Barcode Scanner',
      },
    }));
  };

  // Period options for Cambodian secondary school
  const periodOptions = [
    'ព្រឹក ម៉ោងទី ១ (០៧:០០ - ០៧:៥០)',
    'ព្រឹក ម៉ោងទី ២ (០៧:៥៥ - ០៨:៤៥)',
    'ព្រឹក ម៉ោងទី ៣ (០៩:០០ - ០៩:៥០)',
    'ព្រឹក ម៉ោងទី ៤ (០៩:៥៥ - ១០:៤៥)',
    'រសៀល ម៉ោងទី ១ (១៣:៣០ - ១៤:២០)',
    'រសៀល ម៉ោងទី ២ (១៤:២៥ - ១៥:១៥)',
    'វត្តមានពេញមួយថ្ងៃ (Full Day)',
  ];

  // Students in selected class
  const classStudents = students.filter((s) => s.classId === selectedClassId);

  // Filtered students by search
  const displayedStudents = classStudents.filter((s) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase().trim();
    return s.khmerName.toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q);
  });

  // Get all attendance records for the selected class & selected month (YYYY-MM)
  const currentYearMonthPrefix = `${activeYearStr}-${activeMonthStr}`;
  const classMonthRecords = storage
    .getAttendanceRecords({ classId: selectedClassId })
    .filter((r) => r.date.startsWith(currentYearMonthPrefix));

  // Load existing records or default to "present"
  useEffect(() => {
    const existingSession = storage.getAttendanceSession(selectedClassId, selectedDate, selectedPeriod);
    setIsExistingSession(!!existingSession);

    const existingRecords = storage.getAttendanceRecords({
      classId: selectedClassId,
      date: selectedDate,
      sessionId: existingSession?.id,
    });

    const newState: Record<string, { status: AttendanceStatus; reason: string }> = {};

    classStudents.forEach((student) => {
      const match = existingRecords.find((r) => r.studentId === student.id);
      if (match) {
        newState[student.id] = {
          status: match.status,
          reason: match.reason || '',
        };
      } else {
        // Default to present!
        newState[student.id] = {
          status: 'present',
          reason: '',
        };
      }
    });

    setAttendanceState(newState);
    setIsSavedRecently(false);
    setAlertInfo({ show: false, message: '', unexcusedSent: 0 });
  }, [selectedClassId, selectedDate, selectedPeriod, students.length]);

  // Set single student status
  const handleSetStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendanceState((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  // Set single student reason
  const handleSetReason = (studentId: string, reason: string) => {
    setAttendanceState((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        reason,
      },
    }));
  };

  // Mark all present
  const handleMarkAllPresent = () => {
    const newState: Record<string, { status: AttendanceStatus; reason: string }> = {};
    classStudents.forEach((s) => {
      newState[s.id] = {
        status: 'present',
        reason: '',
      };
    });
    setAttendanceState(newState);
  };

  // Save attendance
  const handleSaveAttendance = () => {
    const recordsToSave = classStudents.map((student) => {
      const current = attendanceState[student.id] || { status: 'present', reason: '' };
      return {
        studentId: student.id,
        studentName: student.khmerName,
        status: current.status,
        reason: current.reason,
      };
    });

    const result = storage.saveAttendanceSession(
      selectedClassId,
      selectedDate,
      selectedPeriod,
      selectedSubjectId,
      recordsToSave,
      currentUser.id,
      currentUser.name
    );

    setIsSavedRecently(true);
    setIsExistingSession(true);

    const currentClass = classes.find((c) => c.id === selectedClassId);
    let msg = `បានរក្សាទុកវត្តមាន ${currentClass?.name || ''} សម្រាប់ ${formatKhmerDate(selectedDate)} ដោយជោគជ័យ!`;
    if (result.unexcusedAlertsSent > 0) {
      msg += ` ប្រព័ន្ធបានបញ្ជូនដំណឹង Telegram ស្វ័យប្រវត្តិចំនួន ${result.unexcusedAlertsSent} ទៅកាន់អាណាព្យាបាលសិស្សអវត្តមានឥតច្បាប់។`;
    }

    setAlertInfo({
      show: true,
      message: msg,
      unexcusedSent: result.unexcusedAlertsSent,
    });

    setTimeout(() => {
      setIsSavedRecently(false);
    }, 4000);
  };

  // Quick stats calculation for current draft
  const currentCounts = {
    present: 0,
    absentPermission: 0,
    absentNoPermission: 0,
    late: 0,
    earlyLeave: 0,
  };

  classStudents.forEach((s) => {
    const st = attendanceState[s.id]?.status || 'present';
    if (st === 'present') currentCounts.present++;
    else if (st === 'absent_permission') currentCounts.absentPermission++;
    else if (st === 'absent_no_permission') currentCounts.absentNoPermission++;
    else if (st === 'late') currentCounts.late++;
    else if (st === 'early_leave') currentCounts.earlyLeave++;
  });

  const totalClassStudents = classStudents.length || 1;
  const currentRate = Number(
    (((currentCounts.present + currentCounts.late + currentCounts.earlyLeave) / totalClassStudents) * 100).toFixed(1)
  );

  return (
    <div className="space-y-6">
      {/* Title & Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="w-2 h-2 rounded-full bg-emerald-600 -ml-4"></span>
              <span className="text-xs font-semibold text-blue-900 uppercase tracking-wider">
                អនុវិទ្យាល័យទួលសំបួរ · ប្រព័ន្ធកត់ត្រាវត្តមាន និងអវត្តមាន
              </span>
              {isToday ? (
                <span className="px-2.5 py-0.5 text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full">
                  📅 ថ្ងៃបច្ចុប្បន្ន៖ {formatKhmerDate(selectedDate)}
                </span>
              ) : (
                <span className="px-2.5 py-0.5 text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 rounded-full">
                  📅 កាលបរិច្ឆេទជ្រើសរើស៖ {formatKhmerDate(selectedDate)}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold font-moul text-slate-900 mt-1.5">
              កត់ត្រាវត្តមាន និងអវត្តមានសិស្សប្រចាំថ្ងៃ (ដើរតាមថ្ងៃបច្ចុប្បន្ន & គ្រប់ខែទាំង ១២)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              កំណត់ស្ថានភាពវត្តមាន ៥ កម្រិត ដើរតាមកាលបរិច្ឆេទបច្ចុប្បន្នស្វ័យប្រវត្តិ មើលសរុបអវត្តមានគ្រប់ខែទាំង ១២ និងផ្ញើសារ Telegram ទៅអាណាព្យាបាល
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="px-4 py-2.5 text-xs font-bold bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ring-2 ring-amber-300"
            >
              <QrCode className="w-4 h-4 text-slate-950" />
              <span>📷 ស្កេន QR Code កត់វត្តមាន</span>
            </button>

            <button
              type="button"
              onClick={handleMarkAllPresent}
              className="px-3.5 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>កំណត់ទាំងអស់ជា «មានវត្តមាន»</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAttendance}
              className="px-5 py-2.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>រក្សាទុកទិន្នន័យ (Save)</span>
            </button>
          </div>
        </div>

        {/* All 12 Months Quick Selector Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-900" />
              <span className="text-xs font-bold text-slate-800">
                ជ្រើសរើសខែទាំង ១២ (ឆ្នាំ {toKhmerNum(activeYearStr)})៖
              </span>
            </div>

            {/* Quick Day Navigation Controls */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleShiftDate(-1)}
                className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                title="ថ្ងៃមុន"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>ថ្ងៃមុន</span>
              </button>

              <button
                type="button"
                onClick={handleJumpToToday}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition-all ${
                  isToday
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-blue-900 hover:bg-blue-800 text-white shadow-xs'
                }`}
              >
                <CalendarCheck2 className="w-3.5 h-3.5" />
                <span>ថ្ងៃបច្ចុប្បន្ន ({formatKhmerDate(todayStr)})</span>
              </button>

              <button
                type="button"
                onClick={() => handleShiftDate(1)}
                className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                title="ថ្ងៃបន្ទាប់"
              >
                <span>ថ្ងៃបន្ទាប់</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1.5">
            {KHMER_MONTHS.map((m) => {
              const isSelectedMonth = activeMonthStr === m.value;
              const isCurrentRealMonth =
                todayStr.split('-')[1] === m.value && todayStr.split('-')[0] === activeYearStr;

              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => handleSelectMonth(m.value)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex flex-col items-center justify-center border ${
                    isSelectedMonth
                      ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                      : isCurrentRealMonth
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                      : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100'
                  }`}
                >
                  <span>ខែ{m.name}</span>
                  <span
                    className={`text-[9px] ${
                      isSelectedMonth ? 'text-amber-300' : 'text-slate-400'
                    }`}
                  >
                    ទី {toKhmerNum(m.number)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Existing Session Alert Notice */}
        {isExistingSession && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-700 flex-shrink-0" />
              <span>
                <strong>ចំណាំ៖</strong> ថ្នាក់នេះបានកត់ត្រាវត្តមានរួចហើយសម្រាប់កាលបរិច្ឆេទ និងម៉ោងសិក្សានេះ។ អ្នកអាចកែប្រែទិន្នន័យបាន ហើយចុច រក្សាទុក ដើម្បីធ្វើបច្ចុប្បន្នភាព។
              </span>
            </div>
          </div>
        )}

        {/* Success Alert Banner */}
        {alertInfo.show && (
          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start justify-between gap-3 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-emerald-900">{alertInfo.message}</p>
                {alertInfo.unexcusedSent > 0 && (
                  <p className="text-[11px] text-emerald-700 mt-1">
                    អ្នកអាចពិនិត្យមើលសារ Telegram ដែលបានផ្ញើទៅអាណាព្យាបាលនៅក្នុងផ្ទាំង Telegram Notifications។
                  </p>
                )}
              </div>
            </div>
            {alertInfo.unexcusedSent > 0 && (
              <button
                onClick={onOpenTelegramModal}
                className="px-3 py-1.5 bg-blue-900 text-white text-xs rounded-lg hover:bg-blue-800 flex items-center gap-1.5 cursor-pointer flex-shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>មើលសារ Telegram</span>
              </button>
            )}
          </div>
        )}

        {/* Filter Selection Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 mt-4 pt-4 border-t border-slate-100">
          {/* Academic Year */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">ឆ្នាំសិក្សា</label>
            <select
              value={selectedYearId}
              onChange={(e) => setSelectedYearId(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
            >
              {academicYears.map((ay) => (
                <option key={ay.id} value={ay.id}>
                  {ay.name} ({ay.currentSemester})
                </option>
              ))}
            </select>
          </div>

          {/* Month Dropdown (All 12 Months) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">ខែ (ទាំង ១២ ខែ)</label>
            <select
              value={activeMonthStr}
              onChange={(e) => handleSelectMonth(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-blue-950 focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
            >
              {KHMER_MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  ខែ{m.name} ({m.nameEn})
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              ថ្ងៃខែឆ្នាំកត់ត្រា {isToday && <span className="text-emerald-600">(ថ្ងៃនេះ)</span>}
            </label>
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) setSelectedDate(e.target.value);
                }}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-slate-900 focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Class Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">ថ្នាក់រៀន</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-900 focus:outline-hidden font-medium text-slate-800"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.currentStudentCount || 0} នាក់)
                </option>
              ))}
            </select>
          </div>

          {/* Period Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">ម៉ោង / វេនសិក្សា</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
            >
              {periodOptions.map((p, idx) => (
                <option key={idx} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">មុខវិជ្ជា</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
            >
              {subjects.map((sbj) => (
                <option key={sbj.id} value={sbj.id}>
                  {sbj.nameKm} ({sbj.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Live Attendance Counter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-700">
              ស្ថិតិវត្តមាន ({formatKhmerDate(selectedDate)}):
            </span>
            <span className="text-xs text-slate-500">
              សរុប {classStudents.length} នាក់ · ភាគរយវត្តមាន {currentRate}%
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-100 text-emerald-800">
              មានវត្តមាន: {currentCounts.present}
            </span>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-100 text-amber-800">
              មានច្បាប់: {currentCounts.absentPermission}
            </span>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-100 text-rose-800">
              ឥតច្បាប់: {currentCounts.absentNoPermission}
            </span>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-orange-100 text-orange-800">
              មកយឺត: {currentCounts.late}
            </span>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-purple-100 text-purple-800">
              ចេញមុន: {currentCounts.earlyLeave}
            </span>
          </div>
        </div>
      </div>

      {/* Student Attendance Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-slate-900">
              បញ្ជីឈ្មោះសិស្សក្នុងថ្នាក់ ({displayedStudents.length} នាក់)
            </h3>
            <span className="text-xs text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-full font-semibold">
              ខែ{getKhmerMonthName(activeMonthStr)} ឆ្នាំ{toKhmerNum(activeYearStr)}
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="ស្វែងរកតាមឈ្មោះ ឬអត្តលេខ..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-900"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] font-semibold text-slate-600 border-b border-slate-200">
                <th className="py-3 px-3 text-center w-12">ល.រ</th>
                <th className="py-3 px-3 w-24">អត្តលេខ</th>
                <th className="py-3 px-3">គោត្តនាម និងនាម</th>
                <th className="py-3 px-2 text-center w-14">ភេទ</th>
                <th className="py-3 px-3 text-center">
                  សរុបអវត្តមានខែ{getKhmerMonthName(activeMonthStr)}
                </th>
                <th className="py-3 px-3">ស្ថានភាពវត្តមានប្រចាំថ្ងៃ (ជ្រើសរើសមួយ)</th>
                <th className="py-3 px-3 w-56">មូលហេតុ / កំណត់សម្គាល់</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {displayedStudents.map((student, index) => {
                const current = attendanceState[student.id] || { status: 'present', reason: '' };
                const isUnexcused = current.status === 'absent_no_permission';

                // Calculate student's monthly absences in the active month
                const stuMonthRecs = classMonthRecords.filter((r) => r.studentId === student.id);
                const monthExcused = stuMonthRecs.filter((r) => r.status === 'absent_permission').length;
                const monthUnexcused = stuMonthRecs.filter((r) => r.status === 'absent_no_permission').length;
                const monthTotalAbsent = monthExcused + monthUnexcused;

                return (
                  <tr
                    key={student.id}
                    className={`hover:bg-slate-50/60 transition-colors ${
                      isUnexcused ? 'bg-rose-50/30' : ''
                    }`}
                  >
                    {/* Index */}
                    <td className="py-3 px-3 text-center text-slate-400 font-medium">{index + 1}</td>

                    {/* Student ID */}
                    <td className="py-3 px-3 font-mono font-semibold text-slate-700">
                      {student.studentId}
                    </td>

                    {/* Name & Photo */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={safeAvatar(student.photo)}
                          alt={student.khmerName}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <div className="font-semibold text-slate-900">{student.khmerName}</div>
                          <div className="text-[10px] text-slate-400 font-sans">{student.latinName}</div>
                        </div>
                      </div>
                    </td>

                    {/* Gender */}
                    <td className="py-3 px-2 text-center text-slate-600 font-medium">
                      {student.gender}
                    </td>

                    {/* Monthly Absence Summary Badge */}
                    <td className="py-3 px-3 text-center">
                      {monthTotalAbsent === 0 ? (
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                          ០ ដង
                        </span>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-[10px] font-semibold">
                          <span className="text-amber-700">ច្បាប់: {monthExcused}</span>
                          <span className="text-slate-300">|</span>
                          <span className="text-rose-700 font-bold">ឥតច្បាប់: {monthUnexcused}</span>
                        </div>
                      )}
                    </td>

                    {/* 5-State Selector Buttons */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* 1. Present */}
                        <button
                          type="button"
                          onClick={() => handleSetStatus(student.id, 'present')}
                          className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all cursor-pointer ${
                            current.status === 'present'
                              ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                              : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
                          }`}
                        >
                          មានវត្តមាន
                        </button>

                        {/* 2. Absent with permission */}
                        <button
                          type="button"
                          onClick={() => handleSetStatus(student.id, 'absent_permission')}
                          className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all cursor-pointer ${
                            current.status === 'absent_permission'
                              ? 'bg-amber-500 text-white shadow-xs font-semibold'
                              : 'bg-slate-100 text-slate-700 hover:bg-amber-50 hover:text-amber-800'
                          }`}
                        >
                          មានច្បាប់
                        </button>

                        {/* 3. Absent without permission */}
                        <button
                          type="button"
                          onClick={() => handleSetStatus(student.id, 'absent_no_permission')}
                          className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                            current.status === 'absent_no_permission'
                              ? 'bg-rose-600 text-white shadow-xs font-semibold animate-pulse'
                              : 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-800'
                          }`}
                        >
                          <span>ឥតច្បាប់</span>
                          {current.status === 'absent_no_permission' && (
                            <span className="text-[9px] bg-rose-700 px-1 rounded-sm">Alert</span>
                          )}
                        </button>

                        {/* 4. Late */}
                        <button
                          type="button"
                          onClick={() => handleSetStatus(student.id, 'late')}
                          className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all cursor-pointer ${
                            current.status === 'late'
                              ? 'bg-orange-500 text-white shadow-xs font-semibold'
                              : 'bg-slate-100 text-slate-700 hover:bg-orange-50 hover:text-orange-800'
                          }`}
                        >
                          មកយឺត
                        </button>

                        {/* 5. Early Leave */}
                        <button
                          type="button"
                          onClick={() => handleSetStatus(student.id, 'early_leave')}
                          className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all cursor-pointer ${
                            current.status === 'early_leave'
                              ? 'bg-purple-600 text-white shadow-xs font-semibold'
                              : 'bg-slate-100 text-slate-700 hover:bg-purple-50 hover:text-purple-800'
                          }`}
                        >
                          ចេញមុន
                        </button>
                      </div>
                    </td>

                    {/* Reason input */}
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        placeholder={
                          current.status === 'present'
                            ? '...'
                            : current.status === 'absent_permission'
                            ? 'បញ្ជាក់មូលហេតុឈប់...'
                            : current.status === 'absent_no_permission'
                            ? 'មូលហេតុ (នឹងផ្ញើទៅអាណាព្យាបាល)...'
                            : 'បញ្ជាក់ម៉ោងមកដល់/ចេញ...'
                        }
                        value={current.reason}
                        onChange={(e) => handleSetReason(student.id, e.target.value)}
                        className={`w-full text-xs px-2.5 py-1.5 rounded-lg border focus:outline-hidden transition-colors ${
                          isUnexcused
                            ? 'border-rose-300 bg-rose-50/50 text-rose-900 focus:ring-1 focus:ring-rose-500'
                            : 'border-slate-200 bg-white text-slate-800 focus:ring-1 focus:ring-blue-900'
                        }`}
                      />
                    </td>
                  </tr>
                );
              })}

              {displayedStudents.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                    <p className="font-semibold text-slate-700 text-sm">មិនទាន់មានសិស្សក្នុងថ្នាក់រៀននេះនៅឡើយទេ</p>
                    <p className="text-slate-400 mt-1">សូមចូលទៅកាន់ម៉ឺនុយ «គ្រប់គ្រងសិស្ស» ដើម្បីបន្ថែមសិស្សចូលក្នុងថ្នាក់នេះជាមុនសិន</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with Big Save Button */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            កត់ត្រាដោយ៖ <strong className="text-slate-800">{currentUser.name}</strong> ·{' '}
            <strong className="text-blue-950">{formatKhmerDate(selectedDate)}</strong>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveAttendance}
              className="px-6 py-2.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>រក្សាទុកវត្តមានទាំងអស់</span>
            </button>
          </div>
        </div>
      </div>

      {/* QR & Barcode Attendance Scanner Modal */}
      <QrAttendanceScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        students={students}
        classes={classes}
        selectedDate={selectedDate}
        selectedPeriod={selectedPeriod}
        onMarkAttendance={handleScanMarkAttendance}
      />
    </div>
  );
};
