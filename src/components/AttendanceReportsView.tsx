import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowUpDown,
  User,
  CalendarCheck2,
} from 'lucide-react';
import {
  Student,
  SchoolClass,
  AttendanceRecord,
  AttendanceStatus,
} from '../types/index.ts';
import {
  calculateAttendanceStats,
  formatKhmerDate,
  getAttendanceStatusBadge,
  checkAbsenceWarning,
  getTodayLocalStr,
  KHMER_MONTHS,
  getKhmerMonthName,
  toKhmerNum,
} from '../utils/calculations.ts';
import { safeAvatar } from '../utils/avatar.ts';
import { exportAttendanceReportToExcel } from '../utils/excelExport.ts';

interface AttendanceReportsViewProps {
  students: Student[];
  classes: SchoolClass[];
  attendanceRecords: AttendanceRecord[];
  onPrintOfficialReport: (type: 'attendance' | 'exam', payload: any) => void;
}

type ReportType = 'daily' | 'monthly' | 'yearly_12months' | 'student_history';

export const AttendanceReportsView: React.FC<AttendanceReportsViewProps> = ({
  students,
  classes,
  attendanceRecords,
  onPrintOfficialReport,
}) => {
  const todayStr = getTodayLocalStr();
  const [defaultYear, defaultMonth] = todayStr.split('-');

  const [reportType, setReportType] = useState<ReportType>('monthly');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonth); // '01'..'12' or 'all'
  const [selectedYear, setSelectedYear] = useState<string>(defaultYear);
  const [searchStudentId, setSearchStudentId] = useState<string>('');

  // Filter records based on selected report view
  let filteredRecords = [...attendanceRecords];

  if (selectedClassId !== 'all') {
    filteredRecords = filteredRecords.filter((r) => r.classId === selectedClassId);
  }

  if (reportType === 'daily') {
    filteredRecords = filteredRecords.filter((r) => r.date === selectedDate);
  } else if (reportType === 'monthly') {
    if (selectedMonth === 'all') {
      filteredRecords = filteredRecords.filter((r) => r.date.startsWith(`${selectedYear}-`));
    } else {
      filteredRecords = filteredRecords.filter((r) =>
        r.date.startsWith(`${selectedYear}-${selectedMonth}`)
      );
    }
  } else if (reportType === 'yearly_12months') {
    filteredRecords = filteredRecords.filter((r) => r.date.startsWith(`${selectedYear}-`));
  } else if (reportType === 'student_history') {
    if (selectedMonth !== 'all') {
      filteredRecords = filteredRecords.filter((r) =>
        r.date.startsWith(`${selectedYear}-${selectedMonth}`)
      );
    }
    if (searchStudentId.trim()) {
      const q = searchStudentId.toLowerCase().trim();
      filteredRecords = filteredRecords.filter((r) => {
        const stu = students.find((s) => s.id === r.studentId);
        return (
          stu?.studentId.toLowerCase().includes(q) ||
          stu?.khmerName.toLowerCase().includes(q) ||
          (r.studentName && r.studentName.toLowerCase().includes(q))
        );
      });
    }
  }

  // Summary statistics for filtered records
  const stats = calculateAttendanceStats(filteredRecords);

  // Student ranking / summary per student for monthly view (filtered by selectedMonth & selectedYear!)
  const studentSummaries = students
    .filter((s) => selectedClassId === 'all' || s.classId === selectedClassId)
    .map((s) => {
      const studentRecs = attendanceRecords.filter((r) => {
        if (r.studentId !== s.id) return false;
        if (reportType === 'daily') return r.date === selectedDate;
        if (selectedMonth === 'all' || reportType === 'yearly_12months') {
          return r.date.startsWith(`${selectedYear}-`);
        }
        return r.date.startsWith(`${selectedYear}-${selectedMonth}`);
      });
      const studentStats = calculateAttendanceStats(studentRecs);
      const warning = checkAbsenceWarning(studentRecs, 2);
      const targetClass = classes.find((c) => c.id === s.classId);

      // Breakdown per month (01..12) for 12-month matrix
      const monthlyAbsences: Record<string, { excused: number; unexcused: number; total: number }> = {};
      KHMER_MONTHS.forEach((m) => {
        const mRecs = attendanceRecords.filter(
          (r) => r.studentId === s.id && r.date.startsWith(`${selectedYear}-${m.value}`)
        );
        const exc = mRecs.filter((r) => r.status === 'absent_permission').length;
        const unexc = mRecs.filter((r) => r.status === 'absent_no_permission').length;
        monthlyAbsences[m.value] = {
          excused: exc,
          unexcused: unexc,
          total: exc + unexc,
        };
      });

      return {
        student: s,
        className: targetClass?.name || '',
        stats: studentStats,
        warning,
        monthlyAbsences,
      };
    });

  const selectedClassName =
    selectedClassId === 'all'
      ? 'គ្រប់ថ្នាក់រៀនទាំងអស់'
      : classes.find((c) => c.id === selectedClassId)?.name || selectedClassId;

  const activePeriodTitle =
    reportType === 'daily'
      ? formatKhmerDate(selectedDate)
      : reportType === 'yearly_12months' || selectedMonth === 'all'
      ? `គ្រប់ខែទាំង ១២ ឆ្នាំ ${toKhmerNum(selectedYear)}`
      : `ខែ${getKhmerMonthName(selectedMonth)} ឆ្នាំ ${toKhmerNum(selectedYear)}`;

  // Export to Official Excel (.xlsx) with MoEYS header, School Logo, and Table
  const handleExportCsv = async () => {
    const detailedRecords = filteredRecords.map((r) => {
      const s = students.find((item) => item.id === r.studentId);
      const c = classes.find((item) => item.id === r.classId);
      return {
        ...r,
        studentCode: s?.studentId || '',
        studentName: s?.khmerName || r.studentName || '',
        className: c?.name || '',
      };
    });

    await exportAttendanceReportToExcel({
      reportSubType: reportType,
      periodTitle: activePeriodTitle,
      className: selectedClassName,
      attendanceRate: stats.attendanceRate ?? 100,
      selectedYear,
      studentSummaries,
      records: detailedRecords,
      filename:
        reportType === 'daily'
          ? `របាយការណ៍វត្តមាន_អនុវិទ្យាល័យទួលសំបួរ_${selectedDate}.xlsx`
          : `របាយការណ៍អវត្តមាន_${getKhmerMonthName(selectedMonth)}_${selectedYear}.xlsx`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <FileSpreadsheet className="w-5 h-5 text-blue-900" />
              <h2 className="text-xl font-bold font-moul text-slate-900">
                របាយការណ៍ និងស្ថិតិអវត្តមានសិស្ស (គ្រប់ខែទាំង ១២)
              </h2>
              <span className="px-2.5 py-0.5 text-[11px] font-bold bg-blue-50 text-blue-900 border border-blue-200 rounded-full">
                {activePeriodTitle}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              ពិនិត្យមើលរបាយការណ៍វត្តមាន និងអវត្តមានប្រចាំថ្ងៃ ប្រចាំខែទាំង ១២ តារាងសរុបប្រចាំឆ្នាំ និងបោះពុម្ពផ្លូវការ A4
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>ទាញយកជា Excel (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={() =>
                onPrintOfficialReport('attendance', {
                  reportSubType: reportType,
                  date: selectedDate,
                  month: selectedMonth,
                  year: selectedYear,
                  periodTitle: activePeriodTitle,
                  classId: selectedClassId,
                  className: selectedClassName,
                  records: filteredRecords,
                  studentSummaries,
                  stats,
                })
              }
              className="px-4 py-2 text-xs font-semibold bg-blue-900 hover:bg-blue-800 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>បោះពុម្ពផ្លូវការ A4</span>
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-wrap items-center gap-2 mt-5 p-1.5 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setReportType('daily')}
            className={`flex-1 min-w-[130px] py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              reportType === 'daily'
                ? 'bg-white text-blue-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📅 របាយការណ៍ប្រចាំថ្ងៃ
          </button>

          <button
            type="button"
            onClick={() => setReportType('monthly')}
            className={`flex-1 min-w-[150px] py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              reportType === 'monthly'
                ? 'bg-white text-blue-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📊 របាយការណ៍ប្រចាំខែ ({getKhmerMonthName(selectedMonth)})
          </button>

          <button
            type="button"
            onClick={() => setReportType('yearly_12months')}
            className={`flex-1 min-w-[160px] py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              reportType === 'yearly_12months'
                ? 'bg-white text-blue-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🗓️ តារាងសរុបទាំង ១២ ខែ
          </button>

          <button
            type="button"
            onClick={() => setReportType('student_history')}
            className={`flex-1 min-w-[140px] py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              reportType === 'student_history'
                ? 'bg-white text-blue-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            👤 ប្រវត្តិសិស្សម្នាក់ៗ
          </button>
        </div>

        {/* All 12 Months Interactive Selector Grid (shown in Monthly & Student History views) */}
        {(reportType === 'monthly' || reportType === 'student_history') && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-900" />
                ជ្រើសរើសខែណាមួយក្នុងចំណោមខែទាំង ១២៖
              </span>
              <button
                type="button"
                onClick={() => setSelectedMonth('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  selectedMonth === 'all'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                គ្រប់ខែទាំងអស់ (១២ ខែ)
              </button>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1.5">
              {KHMER_MONTHS.map((m) => {
                const isSelected = selectedMonth === m.value;
                const isCurrentRealMonth =
                  defaultMonth === m.value && defaultYear === selectedYear;

                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setSelectedMonth(m.value)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex flex-col items-center justify-center border ${
                      isSelected
                        ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                        : isCurrentRealMonth
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                        : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100'
                    }`}
                  >
                    <span>ខែ{m.name}</span>
                    <span
                      className={`text-[9px] ${
                        isSelected ? 'text-amber-300' : 'text-slate-400'
                      }`}
                    >
                      ទី {toKhmerNum(m.number)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Dynamic Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">ជ្រើសរើសថ្នាក់</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-800 focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
            >
              <option value="all">គ្រប់ថ្នាក់រៀនទាំងអស់ (All Classes)</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {reportType === 'daily' && (
            <div className="sm:col-span-2 flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  កាលបរិច្ឆេទប្រចាំថ្ងៃ
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    if (e.target.value) setSelectedDate(e.target.value);
                  }}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-slate-900 focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                />
              </div>
              <button
                type="button"
                onClick={() => setSelectedDate(getTodayLocalStr())}
                className="px-3 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer flex items-center gap-1.5"
              >
                <CalendarCheck2 className="w-3.5 h-3.5" />
                <span>ថ្ងៃបច្ចុប្បន្ន</span>
              </button>
            </div>
          )}

          {reportType !== 'daily' && (
            <>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  ជ្រើសរើសខែ (ទាំង ១២ ខែ)
                </label>
                <select
                  value={reportType === 'yearly_12months' ? 'all' : selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  disabled={reportType === 'yearly_12months'}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-blue-950 focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                >
                  <option value="all">គ្រប់ខែទាំងអស់ (១២ ខែ)</option>
                  {KHMER_MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                      ខែ{m.name} ({m.nameEn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">ឆ្នាំ</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-slate-800 focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                >
                  <option value="2024">ឆ្នាំ ២០២៤ (2024)</option>
                  <option value="2025">ឆ្នាំ ២០២៥ (2025)</option>
                  <option value="2026">ឆ្នាំ ២០២៦ (2026)</option>
                  <option value="2027">ឆ្នាំ ២០២៧ (2027)</option>
                </select>
              </div>
            </>
          )}

          {reportType === 'student_history' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                ស្វែងរកសិស្ស (ឈ្មោះ ឬអត្តលេខ)
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="ឧទាហរណ៍៖ STU-0701 ឬ វិបុល..."
                  value={searchStudentId}
                  onChange={(e) => setSearchStudentId(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">កំណត់ត្រាសរុប</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{stats.total}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/20 shadow-xs">
          <div className="text-[11px] text-emerald-700 font-medium">មានវត្តមាន</div>
          <div className="text-xl font-bold text-emerald-800 mt-1">{stats.present}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-amber-100 bg-amber-50/20 shadow-xs">
          <div className="text-[11px] text-amber-700 font-medium">អវត្តមានមានច្បាប់</div>
          <div className="text-xl font-bold text-amber-800 mt-1">{stats.absentPermission}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-rose-100 bg-rose-50/20 shadow-xs">
          <div className="text-[11px] text-rose-700 font-medium">អវត្តមានឥតច្បាប់</div>
          <div className="text-xl font-bold text-rose-800 mt-1">{stats.absentNoPermission}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-blue-100 bg-blue-50/20 shadow-xs">
          <div className="text-[11px] text-blue-900 font-medium">ភាគរយវត្តមាន</div>
          <div className="text-xl font-bold text-blue-950 mt-1">{stats.attendanceRate}%</div>
        </div>
      </div>

      {/* Tab 3: All 12 Months Matrix Table (តារាងសរុបអវត្តមានទាំង ១២ ខែ) */}
      {reportType === 'yearly_12months' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold text-slate-900">
                តារាងសរុបអវត្តមានសិស្សគ្រប់ខែទាំង ១២ (មករា ដល់ ធ្នូ ឆ្នាំ {toKhmerNum(selectedYear)})
              </h3>
              <p className="text-[10px] text-slate-400">
                បង្ហាញចំនួនអវត្តមានសរុប (មានច្បាប់ + ឥតច្បាប់) របស់សិស្សម្នាក់ៗក្នុងខែនីមួយៗពេញមួយឆ្នាំ
              </p>
            </div>
            <span className="text-xs text-blue-900 font-semibold bg-blue-50 px-2.5 py-1 rounded-lg">
              ឆ្នាំ {toKhmerNum(selectedYear)} · {selectedClassName}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[10px] font-bold text-slate-700 border-b border-slate-200">
                  <th className="py-2.5 px-2 text-center w-10">ល.រ</th>
                  <th className="py-2.5 px-2">ឈ្មោះសិស្ស</th>
                  <th className="py-2.5 px-2">ថ្នាក់</th>
                  {KHMER_MONTHS.map((m) => (
                    <th key={m.value} className="py-2.5 px-1.5 text-center">
                      {m.name}
                    </th>
                  ))}
                  <th className="py-2.5 px-2 text-center bg-amber-50/60 text-amber-900">ច្បាប់សរុប</th>
                  <th className="py-2.5 px-2 text-center bg-rose-50/60 text-rose-900">ឥតច្បាប់សរុប</th>
                  <th className="py-2.5 px-2 text-center bg-blue-50/60 text-blue-950">សរុបរួម</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {studentSummaries.map(({ student, className, stats: stStats, monthlyAbsences }, idx) => {
                  const totalYearAbsences = stStats.absentPermission + stStats.absentNoPermission;
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-2 text-center text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-2">
                        <div className="font-semibold text-slate-900">{student.khmerName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{student.studentId}</div>
                      </td>
                      <td className="py-2.5 px-2 text-slate-700 font-medium">{className}</td>
                      {KHMER_MONTHS.map((m) => {
                        const cell = monthlyAbsences[m.value] || { excused: 0, unexcused: 0, total: 0 };
                        return (
                          <td key={m.value} className="py-2.5 px-1.5 text-center">
                            {cell.total === 0 ? (
                              <span className="text-slate-300">-</span>
                            ) : (
                              <span
                                title={`មានច្បាប់: ${cell.excused}, ឥតច្បាប់: ${cell.unexcused}`}
                                className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  cell.unexcused > 0
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {cell.total}
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td className="py-2.5 px-2 text-center font-bold text-amber-700 bg-amber-50/20">
                        {stStats.absentPermission}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-rose-700 bg-rose-50/20">
                        {stStats.absentNoPermission}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-blue-950 bg-blue-50/20">
                        {totalYearAbsences}
                      </td>
                    </tr>
                  );
                })}

                {studentSummaries.length === 0 && (
                  <tr>
                    <td colSpan={18} className="py-8 text-center text-xs text-slate-400">
                      មិនទាន់មានទិន្នន័យសិស្សក្នុងថ្នាក់នេះនៅឡើយទេ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Monthly Student Summary & Warning Matrix */}
      {reportType === 'monthly' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-xs font-bold text-slate-900">
                ស្ថិតិវត្តមាន និងអវត្តមានសរុបប្រចាំ{selectedMonth === 'all' ? 'ឆ្នាំ (គ្រប់ខែទាំង ១២)' : `ខែ${getKhmerMonthName(selectedMonth)}`} តាមសិស្សម្នាក់ៗ
              </h3>
              <p className="text-[10px] text-slate-400">
                គណនាភាគរយ (%) វត្តមាន ចំនួនអវត្តមានមានច្បាប់-ឥតច្បាប់ និងរំលេចសិស្សដែលមានការដាស់តឿនអវត្តមាន
              </p>
            </div>
            <span className="text-xs text-blue-900 font-semibold bg-blue-50 px-2.5 py-1 rounded-lg">
              {activePeriodTitle}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-semibold text-slate-600 border-b border-slate-200">
                  <th className="py-2.5 px-3 text-center w-12">ល.រ</th>
                  <th className="py-2.5 px-3 w-28">អត្តលេខ</th>
                  <th className="py-2.5 px-3">ឈ្មោះសិស្ស</th>
                  <th className="py-2.5 px-3">ថ្នាក់</th>
                  <th className="py-2.5 px-3 text-center">មានវត្តមាន</th>
                  <th className="py-2.5 px-3 text-center">មានច្បាប់</th>
                  <th className="py-2.5 px-3 text-center">ឥតច្បាប់</th>
                  <th className="py-2.5 px-3 text-center">សរុបអវត្តមាន</th>
                  <th className="py-2.5 px-3 text-center">មកយឺត</th>
                  <th className="py-2.5 px-3 text-center">ភាគរយ (%)</th>
                  <th className="py-2.5 px-3">ស្ថានភាពដាស់តឿន</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {studentSummaries.map(({ student, className, stats: stStats, warning }, idx) => {
                  const totalAbsent = stStats.absentPermission + stStats.absentNoPermission;
                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-slate-50/60 ${warning.isWarned ? 'bg-rose-50/20' : ''}`}
                    >
                      <td className="py-3 px-3 text-center text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-3 font-mono font-medium text-slate-700">
                        {student.studentId}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={safeAvatar(student.photo)}
                            alt={student.khmerName}
                            className="w-7 h-7 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <div className="font-semibold text-slate-900">{student.khmerName}</div>
                            <div className="text-[10px] text-slate-400">{student.parentPhone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-medium">{className}</td>
                      <td className="py-3 px-3 text-center text-emerald-700 font-bold">
                        {stStats.present}
                      </td>
                      <td className="py-3 px-3 text-center text-amber-700 font-bold">
                        {stStats.absentPermission}
                      </td>
                      <td className="py-3 px-3 text-center text-rose-700 font-bold">
                        {stStats.absentNoPermission}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-900 font-bold">
                        {totalAbsent} ដង
                      </td>
                      <td className="py-3 px-3 text-center text-orange-700 font-bold">
                        {stStats.late}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`font-bold ${
                            stStats.attendanceRate >= 90
                              ? 'text-emerald-700'
                              : stStats.attendanceRate >= 75
                              ? 'text-amber-700'
                              : 'text-rose-700'
                          }`}
                        >
                          {stStats.attendanceRate}%
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {warning.isWarned ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            <AlertTriangle className="w-3 h-3" />
                            <span>ដាស់តឿន (ឥតច្បាប់ {warning.unexcusedCount} លើក)</span>
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                            ធម្មតា
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {studentSummaries.length === 0 && (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-xs text-slate-400">
                      មិនទាន់មានទិន្នន័យសិស្សនៅឡើយទេ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detailed Attendance Records Log (Shown in Daily, Student History, and below Monthly) */}
      {(reportType === 'daily' || reportType === 'student_history' || reportType === 'monthly') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900">
              តារាងលម្អិតកំណត់ត្រាវត្តមាន និងអវត្តមាន ({filteredRecords.length} កំណត់ត្រា)
            </h3>
            <span className="text-[11px] text-slate-500">{activePeriodTitle}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-semibold text-slate-600 border-b border-slate-200">
                  <th className="py-2.5 px-3 text-center w-12">ល.រ</th>
                  <th className="py-2.5 px-3 w-28">អត្តលេខ</th>
                  <th className="py-2.5 px-3">ឈ្មោះសិស្ស</th>
                  <th className="py-2.5 px-3">ថ្នាក់</th>
                  <th className="py-2.5 px-3">កាលបរិច្ឆេទ</th>
                  <th className="py-2.5 px-3">ស្ថានភាព</th>
                  <th className="py-2.5 px-3">មូលហេតុ</th>
                  <th className="py-2.5 px-3">កត់ត្រាដោយ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredRecords.map((r, idx) => {
                  const s = students.find((item) => item.id === r.studentId);
                  const c = classes.find((item) => item.id === r.classId);
                  const badge = getAttendanceStatusBadge(r.status);

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3 text-center text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-3 font-mono font-medium text-slate-700">
                        {s?.studentId || '—'}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={safeAvatar(s?.photo)}
                            alt={s?.khmerName || 'សិស្ស'}
                            className="w-7 h-7 rounded-full object-cover border border-slate-200"
                          />
                          <span className="font-semibold text-slate-900">
                            {s?.khmerName || r.studentName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-medium">{c?.name || '—'}</td>
                      <td className="py-3 px-3 text-slate-600">{formatKhmerDate(r.date)}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-md ${badge.bgClass}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 max-w-xs truncate">
                        {r.reason || <span className="text-slate-300">—</span>}
                      </td>
                      <td className="py-3 px-3 text-slate-500 text-[11px]">
                        {r.recordedByName || 'គ្រូបង្រៀន'}
                      </td>
                    </tr>
                  );
                })}

                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-xs text-slate-400">
                      មិនមានទិន្នន័យវត្តមានត្រូវនឹងលក្ខខណ្ឌស្វែងរកសម្រាប់ {activePeriodTitle} នេះទេ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
