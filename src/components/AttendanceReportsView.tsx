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
} from '../utils/calculations.ts';
import { safeAvatar } from '../utils/avatar.ts';

interface AttendanceReportsViewProps {
  students: Student[];
  classes: SchoolClass[];
  attendanceRecords: AttendanceRecord[];
  onPrintOfficialReport: (type: 'attendance' | 'exam', payload: any) => void;
}

type ReportType = 'daily' | 'weekly' | 'monthly' | 'student_history';

export const AttendanceReportsView: React.FC<AttendanceReportsViewProps> = ({
  students,
  classes,
  attendanceRecords,
  onPrintOfficialReport,
}) => {
  const [reportType, setReportType] = useState<ReportType>('daily');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-30');
  const [searchStudentId, setSearchStudentId] = useState<string>('');

  // Filter records based on selected report view
  let filteredRecords = [...attendanceRecords];

  if (selectedClassId !== 'all') {
    filteredRecords = filteredRecords.filter((r) => r.classId === selectedClassId);
  }

  if (reportType === 'daily') {
    filteredRecords = filteredRecords.filter((r) => r.date === selectedDate);
  } else if (reportType === 'monthly') {
    // Current month 2026-10
    filteredRecords = filteredRecords.filter((r) => r.date.startsWith('2026-10'));
  } else if (reportType === 'student_history') {
    if (searchStudentId.trim()) {
      const q = searchStudentId.toLowerCase().trim();
      const matchedStudent = students.find(
        (s) => s.studentId.toLowerCase() === q || s.khmerName.toLowerCase().includes(q)
      );
      if (matchedStudent) {
        filteredRecords = filteredRecords.filter((r) => r.studentId === matchedStudent.id);
      }
    }
  }

  // Summary statistics
  const stats = calculateAttendanceStats(filteredRecords);

  // Student ranking / summary per student for monthly view
  const studentSummaries = students
    .filter((s) => selectedClassId === 'all' || s.classId === selectedClassId)
    .map((s) => {
      const studentRecs = attendanceRecords.filter((r) => r.studentId === s.id);
      const studentStats = calculateAttendanceStats(studentRecs);
      const warning = checkAbsenceWarning(studentRecs, 2);
      const targetClass = classes.find((c) => c.id === s.classId);

      return {
        student: s,
        className: targetClass?.name || '',
        stats: studentStats,
        warning,
      };
    });

  // Export to CSV / Excel helper
  const handleExportCsv = () => {
    const headers = ['លេខសម្គាល់', 'ឈ្មោះសិស្ស', 'ថ្នាក់', 'កាលបរិច្ឆេទ', 'ស្ថានភាពវត្តមាន', 'មូលហេតុ', 'កត់ត្រាដោយ'];
    const rows = filteredRecords.map((r) => {
      const s = students.find((item) => item.id === r.studentId);
      const c = classes.find((item) => item.id === r.classId);
      const badge = getAttendanceStatusBadge(r.status);
      return [
        s?.studentId || '',
        `"${s?.khmerName || r.studentName || ''}"`,
        `"${c?.name || ''}"`,
        r.date,
        `"${badge.label}"`,
        `"${r.reason || ''}"`,
        `"${r.recordedByName || ''}"`,
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `របាយការណ៍វត្តមាន_អនុវិទ្យាល័យទួលសំបួរ_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-900" />
              <h2 className="text-xl font-bold font-moul text-slate-900">
                របាយការណ៍ និងស្ថិតិវត្តមានសិស្ស
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              ពិនិត្យមើលរបាយការណ៍ប្រចាំថ្ងៃ សប្ដាហ៍ ខែ ស្វែងរកប្រវត្តិសិស្ស និងទាញយកជា Excel/PDF
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>ទាញយក Excel (CSV)</span>
            </button>

            <button
              type="button"
              onClick={() =>
                onPrintOfficialReport('attendance', {
                  date: selectedDate,
                  classId: selectedClassId,
                  records: filteredRecords,
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
        <div className="flex items-center gap-2 mt-5 p-1 bg-slate-100 rounded-xl max-w-xl">
          <button
            type="button"
            onClick={() => setReportType('daily')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              reportType === 'daily'
                ? 'bg-white text-blue-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ប្រចាំថ្ងៃ
          </button>

          <button
            type="button"
            onClick={() => setReportType('monthly')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              reportType === 'monthly'
                ? 'bg-white text-blue-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ប្រចាំខែ (តុលា)
          </button>

          <button
            type="button"
            onClick={() => setReportType('student_history')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              reportType === 'student_history'
                ? 'bg-white text-blue-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ប្រវត្តិសិស្សម្នាក់ៗ
          </button>
        </div>

        {/* Dynamic Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">ជ្រើសរើសថ្នាក់</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
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
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">កាលបរិច្ឆេទ</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
              />
            </div>
          )}

          {reportType === 'student_history' && (
            <div className="sm:col-span-2">
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
          <div className="text-[11px] text-amber-700 font-medium">មានច្បាប់</div>
          <div className="text-xl font-bold text-amber-800 mt-1">{stats.absentPermission}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-rose-100 bg-rose-50/20 shadow-xs">
          <div className="text-[11px] text-rose-700 font-medium">ឥតច្បាប់</div>
          <div className="text-xl font-bold text-rose-800 mt-1">{stats.absentNoPermission}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-blue-100 bg-blue-50/20 shadow-xs">
          <div className="text-[11px] text-blue-900 font-medium">ភាគរយវត្តមាន</div>
          <div className="text-xl font-bold text-blue-950 mt-1">{stats.attendanceRate}%</div>
        </div>
      </div>

      {/* Tab 1 & Tab 3: Detailed Table */}
      {reportType !== 'monthly' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900">
              តារាងលម្អិតកំណត់ត្រាវត្តមាន ({filteredRecords.length} កំណត់ត្រា)
            </h3>
            <span className="text-[11px] text-slate-500">
              {reportType === 'daily' ? formatKhmerDate(selectedDate) : 'ប្រវត្តិសរុប'}
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
                      <td className="py-3 px-3 text-slate-600">{r.date}</td>
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
                      មិនមានទិន្នន័យវត្តមានត្រូវនឹងលក្ខខណ្ឌស្វែងរកនេះទេ
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
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900">
                ស្ថិតិវត្តមានសរុបប្រចាំខែតុលា តាមសិស្សម្នាក់ៗ
              </h3>
              <p className="text-[10px] text-slate-400">
                គណនាភាគរយ (%) វត្តមាន និងរំលេចសិស្សដែលមានការដាស់តឿនអវត្តមាន
              </p>
            </div>
            <span className="text-xs text-blue-900 font-semibold bg-blue-50 px-2.5 py-1 rounded-lg">
              ខែតុលា ឆ្នាំ២០២៦
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
                  <th className="py-2.5 px-3 text-center">មកយឺត</th>
                  <th className="py-2.5 px-3 text-center">ភាគរយ (%)</th>
                  <th className="py-2.5 px-3">ស្ថានភាពដាស់តឿន</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {studentSummaries.map(({ student, className, stats: stStats, warning }, idx) => {
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
                      <td className="py-3 px-3 text-center text-orange-700 font-bold">{stStats.late}</td>
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
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
