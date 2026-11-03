import React from 'react';
import {
  Users,
  GraduationCap,
  School,
  CheckCircle2,
  XCircle,
  Clock,
  Percent,
  TrendingUp,
  AlertTriangle,
  Send,
  CalendarCheck2,
  UserPlus,
  CalendarDays,
  Award,
  ChevronRight,
  BookOpen,
  FileSpreadsheet,
  Sparkles,
  CreditCard,
} from 'lucide-react';
import {
  Student,
  Teacher,
  SchoolClass,
  AttendanceRecord,
  ExamResult,
  UserRole,
} from '../types/index.ts';
import { calculateAttendanceStats, checkAbsenceWarning, getTodayLocalStr } from '../utils/calculations.ts';
import { safeAvatar } from '../utils/avatar.ts';
import { NavTab } from './Sidebar.tsx';
import { HeroBannerCarousel } from './HeroBannerCarousel.tsx';
import { storage } from '../services/storage.ts';
import { KhmerCornerOrnament } from './KhmerOrnament.tsx';

interface DashboardViewProps {
  students: Student[];
  teachers: Teacher[];
  classes: SchoolClass[];
  attendanceRecords: AttendanceRecord[];
  examResults: ExamResult[];
  userRole: UserRole;
  onNavigate: (tab: NavTab) => void;
  onOpenTelegramModal: () => void;
  onTriggerToast?: (toast: any) => void;
  onRefresh?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  students,
  teachers,
  classes,
  attendanceRecords,
  examResults,
  userRole,
  onNavigate,
  onOpenTelegramModal,
  onTriggerToast,
  onRefresh,
}) => {
  // Today's date filter (follows current real date)
  const todayStr = getTodayLocalStr();
  const todayRecords = attendanceRecords.filter((r) => r.date === todayStr);
  const todayStats = calculateAttendanceStats(todayRecords);

  // Warning students with >= 2 unexcused absences
  const studentsWithWarnings = students
    .map((student) => {
      const studentRecs = attendanceRecords.filter((r) => r.studentId === student.id);
      const warningInfo = checkAbsenceWarning(studentRecs, 2);
      return {
        student,
        warningInfo,
      };
    })
    .filter((item) => item.warningInfo.isWarned);

  // Top performing students from exam results
  const topStudents = [...examResults]
    .sort((a, b) => b.average - a.average)
    .slice(0, 4);

  // Weekly attendance simulation data
  const weeklyTrend = [
    { day: 'ច័ន្ទ', rate: 96.5, present: 96, absent: 4 },
    { day: 'អង្គារ', rate: 94.2, present: 94, absent: 6 },
    { day: 'ពុធ', rate: 97.0, present: 97, absent: 3 },
    { day: 'ព្រហស្បតិ៍', rate: 92.5, present: 92, absent: 8 },
    { day: 'សុក្រ (ថ្ងៃនេះ)', rate: todayStats.attendanceRate, present: todayStats.present, absent: todayStats.absentNoPermission + todayStats.absentPermission },
  ];

  return (
    <div className="space-y-6">
      {/* Dynamic Animated Carousel Banner with Customization and RGB Glow */}
      <HeroBannerCarousel
        banners={storage.getBanners()}
        onNavigate={(tab) => onNavigate(tab as any)}
        isAdmin={userRole === 'admin' || userRole === 'director'}
        onBannersChange={() => {
          if (onRefresh) onRefresh();
          if (onTriggerToast) {
            onTriggerToast({
              title: 'ផ្ទាំង Banner ត្រូវបានកែប្រែ',
              message: 'ការកំណត់ផ្ទាំងបដាផ្សាយត្រូវបានរក្សាទុកជោគជ័យ!',
              type: 'success',
            });
          }
        }}
      />

      {/* KPI Cards Grid with Traditional Khmer Kbach Accents */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="khmer-kbach-card bg-white p-4 rounded-2xl hover:border-amber-500/70 transition-all relative overflow-hidden">
          <KhmerCornerOrnament position="top-left" size={26} variant="gold" className="opacity-65" />
          <KhmerCornerOrnament position="bottom-right" size={26} variant="gold" className="opacity-65" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-semibold text-slate-600">សិស្សសរុប</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-800 border border-blue-200/60 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2 relative z-10">
            <span className="text-2xl font-bold text-blue-950">{students.length}</span>
            <span className="text-xs text-slate-500">នាក់</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-amber-100 pt-2 relative z-10">
            <span>ស្រី {students.filter((s) => s.gender === 'ស្រី').length} នាក់</span>
            <span className="text-emerald-600 font-semibold">១០០% ចូលរៀន</span>
          </div>
        </div>

        {/* Total Teachers */}
        <div className="khmer-kbach-card bg-white p-4 rounded-2xl hover:border-amber-500/70 transition-all relative overflow-hidden">
          <KhmerCornerOrnament position="top-left" size={26} variant="gold" className="opacity-65" />
          <KhmerCornerOrnament position="bottom-right" size={26} variant="gold" className="opacity-65" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-semibold text-slate-600">គ្រូបង្រៀនសរុប</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200/60 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2 relative z-10">
            <span className="text-2xl font-bold text-blue-950">{teachers.length}</span>
            <span className="text-xs text-slate-500">រូប</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-amber-100 pt-2 relative z-10">
            <span>ស្រី {teachers.filter((t) => t.gender === 'ស្រី').length} រូប</span>
            <span className="text-blue-800 font-semibold">ពេញម៉ោង</span>
          </div>
        </div>

        {/* Classes */}
        <div className="khmer-kbach-card bg-white p-4 rounded-2xl hover:border-amber-500/70 transition-all relative overflow-hidden">
          <KhmerCornerOrnament position="top-left" size={26} variant="gold" className="opacity-65" />
          <KhmerCornerOrnament position="bottom-right" size={26} variant="gold" className="opacity-65" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-semibold text-slate-600">ថ្នាក់រៀនសរុប</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/60 flex items-center justify-center">
              <School className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2 relative z-10">
            <span className="text-2xl font-bold text-blue-950">{classes.length}</span>
            <span className="text-xs text-slate-500">ថ្នាក់</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-amber-100 pt-2 relative z-10">
            <span>ថ្នាក់ទី ៧, ៨ និង ៩</span>
            <span className="text-amber-800 font-semibold">កម្រិតអនុវិទ្យាល័យ</span>
          </div>
        </div>

        {/* Attendance Rate */}
        <div className="khmer-kbach-card bg-white p-4 rounded-2xl hover:border-amber-500/70 transition-all relative overflow-hidden">
          <KhmerCornerOrnament position="top-left" size={26} variant="gold" className="opacity-65" />
          <KhmerCornerOrnament position="bottom-right" size={26} variant="gold" className="opacity-65" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-semibold text-slate-600">ភាគរយវត្តមានថ្ងៃនេះ</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/60 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2 relative z-10">
            <span className="text-2xl font-bold text-blue-950">{todayStats.attendanceRate}%</span>
            <span className="text-xs text-emerald-600 font-semibold">ខ្ពស់</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-amber-100 pt-2 relative z-10">
            <span>វត្តមាន {todayStats.present} នាក់</span>
            <span>មកយឺត {todayStats.late} នាក់</span>
          </div>
        </div>
      </div>

      {/* Attendance Detail Strip Today */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <h3 className="text-sm font-semibold text-slate-900">
              សង្ខេបវត្តមានសិស្សថ្ងៃនេះ (ថ្ងៃទី ៣០ តុលា ២០២៦)
            </h3>
          </div>
          <button
            onClick={() => onNavigate('attendance_reports')}
            className="text-xs text-blue-800 hover:text-blue-950 font-medium flex items-center gap-1 cursor-pointer"
          >
            <span>មើលរបាយការណ៍លម្អិត</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100">
            <div className="text-[11px] font-medium text-emerald-800 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>មានវត្តមាន</span>
            </div>
            <div className="text-xl font-bold text-emerald-700 mt-1">{todayStats.present}</div>
          </div>

          <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-100">
            <div className="text-[11px] font-medium text-amber-800">
              <span>អវត្តមានមានច្បាប់</span>
            </div>
            <div className="text-xl font-bold text-amber-700 mt-1">{todayStats.absentPermission}</div>
          </div>

          <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-100">
            <div className="text-[11px] font-medium text-rose-800 flex items-center justify-center gap-1">
              <XCircle className="w-3.5 h-3.5" />
              <span>អវត្តមានឥតច្បាប់</span>
            </div>
            <div className="text-xl font-bold text-rose-700 mt-1">{todayStats.absentNoPermission}</div>
          </div>

          <div className="bg-orange-50/70 p-3 rounded-xl border border-orange-100">
            <div className="text-[11px] font-medium text-orange-800 flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>មកយឺត</span>
            </div>
            <div className="text-xl font-bold text-orange-700 mt-1">{todayStats.late}</div>
          </div>

          <div className="bg-purple-50/70 p-3 rounded-xl border border-purple-100">
            <div className="text-[11px] font-medium text-purple-800">
              <span>ចេញមុនម៉ោង</span>
            </div>
            <div className="text-xl font-bold text-purple-700 mt-1">{todayStats.earlyLeave}</div>
          </div>
        </div>
      </div>

      {/* Main Charts & Side Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                ក្រាហ្វស្ថិតិវត្តមានប្រចាំសប្ដាហ៍ (Weekly Attendance Statistics)
              </h3>
              <p className="text-[11px] text-slate-500">ភាគរយសិស្សមានវត្តមានតាមថ្ងៃនីមួយៗ</p>
            </div>
            <span className="text-xs font-semibold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
              មធ្យមភាគសប្ដាហ៍: 95.8%
            </span>
          </div>

          {/* SVG Custom Bar & Trend Chart */}
          <div className="h-56 w-full flex items-end justify-between gap-4 pt-6 pb-2 px-2 border-b border-slate-100">
            {weeklyTrend.map((item, idx) => {
              const heightPercent = Math.max(20, Math.min(100, item.rate));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <div className="text-[11px] font-bold text-slate-700 mb-1.5 group-hover:text-blue-900 transition-colors">
                    {item.rate}%
                  </div>
                  <div className="w-full max-w-[52px] bg-slate-100 rounded-t-lg h-full flex items-end overflow-hidden">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-lg transition-all duration-500 ${
                        idx === 4
                          ? 'bg-gradient-to-t from-blue-900 to-amber-500'
                          : 'bg-gradient-to-t from-blue-900/80 to-blue-700'
                      }`}
                    ></div>
                  </div>
                  <div className="text-xs font-medium text-slate-600 mt-2 text-center truncate max-w-full">
                    {item.day}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-blue-900"></span>
                <span>វត្តមានធម្មតា</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-amber-500"></span>
                <span>ថ្ងៃនេះ</span>
              </div>
            </div>
            <span className="text-[11px] text-slate-400">គោលដៅសាលា: &gt; ៩៥%</span>
          </div>
        </div>

        {/* Absence Warning Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-rose-900">
                    សិស្សត្រូវដាស់តឿនអវត្តមាន
                  </h3>
                  <span className="text-[10px] text-slate-400">លើសពី ២ លើក</span>
                </div>
              </div>
              <span className="px-2 py-0.5 text-xs font-bold bg-rose-100 text-rose-800 rounded-full">
                {studentsWithWarnings.length} នាក់
              </span>
            </div>

            <div className="space-y-3">
              {studentsWithWarnings.map(({ student, warningInfo }) => {
                const targetClass = classes.find((c) => c.id === student.classId);
                return (
                  <div
                    key={student.id}
                    className="p-3 rounded-xl bg-rose-50/50 border border-rose-100 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={safeAvatar(student.photo)}
                        alt={student.khmerName}
                        className="w-9 h-9 rounded-full object-cover border border-rose-200"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {student.khmerName}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {targetClass?.name} · ឥតច្បាប់ {warningInfo.unexcusedCount} លើក
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={onOpenTelegramModal}
                      title="ផ្ញើសារដាស់តឿនតាម Telegram"
                      className="p-1.5 bg-blue-900 text-white hover:bg-blue-800 rounded-lg text-xs flex items-center gap-1 flex-shrink-0 cursor-pointer shadow-xs"
                    >
                      <Send className="w-3 h-3" />
                      <span className="hidden sm:inline text-[10px]">ផ្ញើសារ</span>
                    </button>
                  </div>
                );
              })}

              {studentsWithWarnings.length === 0 && (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                  មិនមានសិស្សដែលមានអវត្តមានលើសកម្រិតទេ
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={onOpenTelegramModal}
              className="w-full py-2 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>មើលប្រព័ន្ធស្វ័យប្រវត្តិ Telegram Bot</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions & Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions Shortcuts */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">
            ផ្លូវកាត់មុខងាររហ័ស (Quick Actions)
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => onNavigate('attendance')}
              className="p-3 text-left bg-slate-50 hover:bg-blue-50/70 border border-slate-200 rounded-xl transition-all cursor-pointer group"
            >
              <CalendarCheck2 className="w-5 h-5 text-blue-900 group-hover:scale-110 transition-transform mb-1.5" />
              <div className="text-xs font-semibold text-slate-900">កត់ត្រាវត្តមាន</div>
              <div className="text-[10px] text-slate-500">ប្រចាំថ្ងៃ និងតាមម៉ោង</div>
            </button>

            <button
              onClick={() => onNavigate('students')}
              className="p-3 text-left bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 rounded-xl transition-all cursor-pointer group"
            >
              <UserPlus className="w-5 h-5 text-emerald-700 group-hover:scale-110 transition-transform mb-1.5" />
              <div className="text-xs font-semibold text-slate-900">បញ្ចូលសិស្សថ្មី</div>
              <div className="text-[10px] text-slate-500">ព័ត៌មាន និងអាណាព្យាបាល</div>
            </button>

            <button
              onClick={() => onNavigate('classes')}
              className="p-3 text-left bg-slate-50 hover:bg-indigo-50/70 border border-slate-200 rounded-xl transition-all cursor-pointer group"
            >
              <School className="w-5 h-5 text-indigo-700 group-hover:scale-110 transition-transform mb-1.5" />
              <div className="text-xs font-semibold text-slate-900">ថ្នាក់រៀន</div>
              <div className="text-[10px] text-slate-500">កម្រិត និងបន្ទប់សិក្សា</div>
            </button>

            <button
              onClick={() => onNavigate('attendance_reports')}
              className="p-3 text-left bg-slate-50 hover:bg-amber-50/70 border border-slate-200 rounded-xl transition-all cursor-pointer group"
            >
              <FileSpreadsheet className="w-5 h-5 text-amber-700 group-hover:scale-110 transition-transform mb-1.5" />
              <div className="text-xs font-semibold text-slate-900">របាយការណ៍វត្តមាន</div>
              <div className="text-[10px] text-slate-500">ស្ថិតិ និងទិន្នន័យផ្លូវការ</div>
            </button>

            <button
              onClick={() => onNavigate('behavior')}
              className="p-3 text-left bg-slate-50 hover:bg-rose-50/70 border border-slate-200 rounded-xl transition-all cursor-pointer group"
            >
              <Sparkles className="w-5 h-5 text-rose-600 group-hover:scale-110 transition-transform mb-1.5" />
              <div className="text-xs font-semibold text-slate-900">វិន័យ & លើកទឹកចិត្ត</div>
              <div className="text-[10px] text-slate-500">កត់ត្រាវិន័យ សិស្សគំរូ</div>
            </button>

            <button
              onClick={() => onNavigate('students')}
              className="p-3 text-left bg-slate-50 hover:bg-purple-50/70 border border-slate-200 rounded-xl transition-all cursor-pointer group"
            >
              <CreditCard className="w-5 h-5 text-purple-600 group-hover:scale-110 transition-transform mb-1.5" />
              <div className="text-xs font-semibold text-slate-900">កាត & ស្កេន QR</div>
              <div className="text-[10px] text-slate-500">បោះពុម្ពកាត និងនាំចូល</div>
            </button>
          </div>
        </div>

        {/* Top Performing Students */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                សិស្សឆ្នើមប្រចាំខែតុលា (Top Ranking Students)
              </h3>
              <p className="text-[11px] text-slate-500">លទ្ធផលពិន្ទុ និងចំណាត់ថ្នាក់ខ្ពស់ជាងគេ</p>
            </div>
            <button
              onClick={() => onNavigate('grades')}
              className="text-xs text-blue-800 hover:text-blue-950 font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>មើលតារាងចំណាត់ថ្នាក់ពេញលេញ</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {topStudents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {topStudents.map((res, idx) => {
                const student = students.find((s) => s.id === res.studentId);
                const targetClass = classes.find((c) => c.id === res.classId);
                const rankMedals = ['🥇 លេខ ១', '🥈 លេខ ២', '🥉 លេខ ៣', '🏅 លេខ ៤'];

                return (
                  <div
                    key={res.id}
                    className="p-3 bg-slate-50/70 hover:bg-slate-100/60 rounded-xl border border-slate-200/80 flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={safeAvatar(student?.photo)}
                          alt={res.studentName}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        />
                        <span className="absolute -bottom-1 -right-1 text-[10px] font-bold px-1 rounded-sm bg-amber-400 text-slate-950">
                          {idx + 1}
                        </span>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{res.studentName}</div>
                        <div className="text-[10px] text-slate-500">
                          {targetClass?.name} · {student?.studentId}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-blue-950">{res.average} ពិន្ទុ</div>
                      <div className="text-[10px] text-emerald-700 font-semibold">{rankMedals[idx]}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <Award className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-medium text-slate-600">មិនទាន់មានលទ្ធផលប្រឡងនៅឡើយទេ</p>
              <p className="text-[11px] text-slate-400 mt-0.5">លទ្ធផលសិស្សឆ្នើមនឹងបង្ហាញនៅទីនេះពេលមានការបញ្ចូលពិន្ទុ</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
