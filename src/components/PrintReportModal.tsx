import React from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, Download } from 'lucide-react';
import { formatKhmerDate, getAttendanceStatusBadge, getTodayLocalStr } from '../utils/calculations.ts';
import { SCHOOL_LOGO_URL } from '../utils/schoolLogo.ts';
import {
  exportAttendanceReportToExcel,
  exportExamReportToExcel,
} from '../utils/excelExport.ts';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: 'attendance' | 'exam';
  data: any;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  reportType,
  data,
}) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Manage print state on body so only the official document prints
  React.useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-print-active');
    } else {
      document.body.classList.remove('modal-print-active');
    }
    return () => {
      document.body.classList.remove('modal-print-active');
    };
  }, [isOpen]);

  if (!isOpen || !data) return null;

  const todayStr = getTodayLocalStr();
  const khmerDateStr = formatKhmerDate(todayStr);

  const handlePrint = () => {
    document.body.classList.add('modal-print-active');
    setTimeout(() => {
      window.print();
    }, 50);
  };

  const handleDownloadExcel = async () => {
    if (reportType === 'attendance') {
      await exportAttendanceReportToExcel({
        reportSubType: data.reportSubType || 'monthly',
        periodTitle: data.periodTitle || formatKhmerDate(data.date || todayStr),
        className: data.className || (data.classId === 'all' ? 'គ្រប់ថ្នាក់រៀនទាំងអស់' : data.classId),
        attendanceRate: data.stats?.attendanceRate ?? 100,
        selectedYear: data.year || '2026',
        studentSummaries: data.studentSummaries || [],
        records: data.records || [],
      });
    } else {
      await exportExamReportToExcel({
        examTitle: data.exam?.title || 'ការប្រឡងប្រចាំខែ',
        className: data.classInfo?.name || 'ថ្នាក់ទី ៧ ក',
        roomNumber: data.classInfo?.roomNumber || '១០១',
        results: data.results || [],
      });
    }
  };

  return createPortal(
    <div
      id="official-print-modal-overlay"
      className="fixed inset-0 bg-slate-900/70 z-50 flex items-start justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static"
    >
      <div
        id="official-print-modal-card"
        className="bg-white rounded-2xl max-w-4xl w-full p-8 shadow-2xl my-4 sm:my-8 print:shadow-none print:p-0 print:my-0 print:max-w-none"
      >
        {/* Controls: hidden during print */}
        <div className="no-print flex items-center justify-between pb-4 mb-6 border-b border-slate-200 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-900" />
            <h3 className="text-sm font-bold font-moul text-slate-900">
              ទម្រង់បោះពុម្ពផ្លូវការ A4 (Official Print Preview)
            </h3>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleDownloadExcel}
              className="px-4 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>ទាញយកជា Excel (.xlsx)</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-semibold bg-blue-900 text-white rounded-xl hover:bg-blue-800 flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>បោះពុម្ព (Print / Save as PDF)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Document Body (Formatted like MoEYS official A4 papers) */}
        <div
          id="official-print-sheet"
          className="print-sheet font-khmer text-slate-900 text-sm leading-relaxed w-full max-w-[210mm] mx-auto bg-white sm:p-6 print:max-w-none box-border"
        >
          {/* Header MoEYS with Official School Logo - 3-Column Grid for Exact Center Logo */}
          <div className="grid grid-cols-3 items-center pb-4 gap-2">
            {/* Left Column: MoEYS & School Name */}
            <div className="text-left space-y-1">
              <div className="font-moul text-xs font-bold text-slate-900 leading-[1.9]">
                ក្រសួងអប់រំ យុវជន និងកីឡា
              </div>
              <div className="text-xs text-slate-800 leading-relaxed">
                មន្ទីរអប់រំ យុវជន និងកីឡា ខេត្តកំពង់ចាម
              </div>
              <div className="text-xs text-slate-800 leading-relaxed">
                ការិយាល័យអប់រំ ស្រុកស្ទឹងត្រង់
              </div>
              <div className="font-moul text-xs text-blue-950 font-bold leading-[1.9]">
                អនុវិទ្យាល័យ ហ៊ុន សែន ទួលសំបួរ
              </div>
            </div>

            {/* Center Column: Official School Seal Logo (Exact 1:1 Circle, Centered on Paper) */}
            <div className="flex items-center justify-center">
              <div className="w-20 h-20 aspect-square shrink-0 rounded-full p-0.5 bg-white border-2 border-amber-500 overflow-hidden flex items-center justify-center shadow-xs">
                <img
                  src={SCHOOL_LOGO_URL}
                  alt="Logo អនុវិទ្យាល័យ ហ៊ុន សែន ទួលសំបួរ"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
            </div>

            {/* Right Column: Kingdom of Cambodia Motto */}
            <div className="text-center space-y-1 flex flex-col items-center justify-center">
              <div className="font-moul text-xs font-bold text-slate-900 leading-[1.9]">
                ព្រះរាជាណាចក្រកម្ពុជា
              </div>
              <div className="font-moul text-xs text-slate-900 leading-[1.9]">
                ជាតិ សាសនា ព្រះមហាក្សត្រ
              </div>
              <div className="text-xs text-amber-600 font-serif tracking-widest">❖ ❖ ❖</div>
            </div>
          </div>

          <div className="border-b-2 border-slate-900 my-2"></div>

          {/* Document Title */}
          <div className="text-center my-5">
            <h2 className="font-moul text-base sm:text-lg font-bold text-blue-950 leading-[2]">
              {reportType === 'attendance'
                ? 'របាយការណ៍វត្តមាន និងអវត្តមានសិស្ស'
                : 'ព្រឹត្តិបត្រពិន្ទុ និងចំណាត់ថ្នាក់សិស្សផ្លូវការ'}
            </h2>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              ឆ្នាំសិក្សា ២០២៥-២០២៦ · ឆមាសទី ១
            </p>
          </div>

          {/* Report Type 1: Attendance Sheet */}
          {reportType === 'attendance' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-200">
                <div>
                  រយៈពេល/កាលបរិច្ឆេទ៖{' '}
                  <strong>{data.periodTitle || formatKhmerDate(data.date || todayStr)}</strong>
                </div>
                <div>
                  ថ្នាក់រៀន៖{' '}
                  <strong>
                    {data.className || (data.classId === 'all' ? 'គ្រប់ថ្នាក់' : data.classId)}
                  </strong>
                </div>
                <div>
                  ភាគរយវត្តមាន៖ <strong>{data.stats?.attendanceRate ?? 100}%</strong>
                </div>
              </div>

              {(data.reportSubType === 'monthly' || data.reportSubType === 'yearly_12months') &&
              Array.isArray(data.studentSummaries) ? (
                <table className="w-full border-collapse border border-slate-300 text-xs text-left">
                  <thead>
                    <tr className="bg-slate-100 font-bold text-slate-900">
                      <th className="border border-slate-300 py-2 px-2 text-center w-10 whitespace-nowrap">
                        ល.រ
                      </th>
                      <th className="border border-slate-300 py-2 px-2.5 w-24 whitespace-nowrap">
                        អត្តលេខ
                      </th>
                      <th className="border border-slate-300 py-2 px-2.5 whitespace-nowrap">
                        ឈ្មោះសិស្ស
                      </th>
                      <th className="border border-slate-300 py-2 px-2 text-center whitespace-nowrap">
                        ថ្នាក់
                      </th>
                      <th className="border border-slate-300 py-2 px-2 text-center whitespace-nowrap">
                        មានវត្តមាន
                      </th>
                      <th className="border border-slate-300 py-2 px-2 text-center whitespace-nowrap">
                        មានច្បាប់
                      </th>
                      <th className="border border-slate-300 py-2 px-2 text-center whitespace-nowrap">
                        ឥតច្បាប់
                      </th>
                      <th className="border border-slate-300 py-2 px-2 text-center whitespace-nowrap">
                        ភាគរយ (%)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.studentSummaries.map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td className="border border-slate-300 py-2 px-2 text-center">{idx + 1}</td>
                        <td className="border border-slate-300 py-2 px-2.5 font-mono">
                          {item.student?.studentId}
                        </td>
                        <td className="border border-slate-300 py-2 px-2.5 font-bold">
                          {item.student?.khmerName}
                        </td>
                        <td className="border border-slate-300 py-2 px-2 text-center">
                          {item.className}
                        </td>
                        <td className="border border-slate-300 py-2 px-2 text-center">
                          {item.stats?.present ?? 0}
                        </td>
                        <td className="border border-slate-300 py-2 px-2 text-center">
                          {item.stats?.absentPermission ?? 0}
                        </td>
                        <td className="border border-slate-300 py-2 px-2 text-center font-bold">
                          {item.stats?.absentNoPermission ?? 0}
                        </td>
                        <td className="border border-slate-300 py-2 px-2 text-center font-bold">
                          {item.stats?.attendanceRate ?? 100}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full border-collapse border border-slate-300 text-xs text-left">
                  <thead>
                    <tr className="bg-slate-100 font-bold text-slate-900">
                      <th className="border border-slate-300 py-2 px-2 text-center w-10 whitespace-nowrap">
                        ល.រ
                      </th>
                      <th className="border border-slate-300 py-2 px-2.5 whitespace-nowrap">
                        ឈ្មោះសិស្ស
                      </th>
                      <th className="border border-slate-300 py-2 px-2 text-center whitespace-nowrap">
                        កាលបរិច្ឆេទ
                      </th>
                      <th className="border border-slate-300 py-2 px-2 text-center whitespace-nowrap">
                        ស្ថានភាពវត្តមាន
                      </th>
                      <th className="border border-slate-300 py-2 px-2.5 whitespace-nowrap">
                        មូលហេតុនៃការអវត្តមាន
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.records?.map((r: any, idx: number) => {
                      const badge = getAttendanceStatusBadge(r.status);
                      return (
                        <tr key={idx}>
                          <td className="border border-slate-300 py-2 px-2 text-center">
                            {idx + 1}
                          </td>
                          <td className="border border-slate-300 py-2 px-2.5 font-bold">
                            {r.studentName}
                          </td>
                          <td className="border border-slate-300 py-2 px-2 text-center">{r.date}</td>
                          <td className="border border-slate-300 py-2 px-2 text-center">
                            {badge.label}
                          </td>
                          <td className="border border-slate-300 py-2 px-2.5 text-slate-600">
                            {r.reason || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Report Type 2: Exam / Report Card */}
          {reportType === 'exam' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-200">
                <div>
                  សម័យប្រឡង៖ <strong>{data.exam?.title || 'ការប្រឡងប្រចាំខែ'}</strong>
                </div>
                <div>
                  ថ្នាក់រៀន៖ <strong>{data.classInfo?.name || 'ថ្នាក់ទី ៧ ក'}</strong>
                </div>
                <div>
                  បន្ទប់៖ <strong>{data.classInfo?.roomNumber || '១០១'}</strong>
                </div>
              </div>

              <table className="w-full border-collapse border border-slate-300 text-xs text-left">
                <thead>
                  <tr className="bg-slate-100 font-bold text-slate-900">
                    <th className="border border-slate-300 py-2.5 px-2.5 text-center w-22 whitespace-nowrap">
                      ចំណាត់ថ្នាក់
                    </th>
                    <th className="border border-slate-300 py-2.5 px-2.5 w-24 whitespace-nowrap">
                      អត្តលេខ
                    </th>
                    <th className="border border-slate-300 py-2.5 px-3 whitespace-nowrap">
                      ឈ្មោះសិស្ស
                    </th>
                    <th className="border border-slate-300 py-2.5 px-2.5 text-center w-22 whitespace-nowrap">
                      ពិន្ទុសរុប
                    </th>
                    <th className="border border-slate-300 py-2.5 px-2.5 text-center w-22 whitespace-nowrap">
                      មធ្យមភាគ
                    </th>
                    <th className="border border-slate-300 py-2.5 px-2 text-center w-18 whitespace-nowrap">
                      និទ្ទេស
                    </th>
                    <th className="border border-slate-300 py-2.5 px-3 whitespace-nowrap">
                      ការវាយតម្លៃរបស់ក្រុមប្រឹក្សា
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.results && data.results.length > 0 ? (
                    data.results.map((res: any, idx: number) => (
                      <tr key={idx}>
                        <td className="border border-slate-300 py-2 px-2.5 text-center font-bold whitespace-nowrap">
                          លេខ {res.rank}
                        </td>
                        <td className="border border-slate-300 py-2 px-2.5 font-mono text-slate-700 whitespace-nowrap">
                          {res.studentCode || res.studentId || '—'}
                        </td>
                        <td className="border border-slate-300 py-2 px-3 font-bold">
                          {res.studentName}
                        </td>
                        <td className="border border-slate-300 py-2 px-2.5 text-center font-mono">
                          {res.totalScore}
                        </td>
                        <td className="border border-slate-300 py-2 px-2.5 text-center font-mono font-bold">
                          {res.average}
                        </td>
                        <td className="border border-slate-300 py-2 px-2 text-center font-bold">
                          {res.gradeLetter}
                        </td>
                        <td className="border border-slate-300 py-2 px-3 text-slate-700">
                          {res.remarks}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className="border border-slate-300 py-6 text-center text-slate-400"
                      >
                        មិនទាន់មានទិន្នន័យសិស្សក្នុងថ្នាក់នេះនៅឡើយទេ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Official Signatures Footer */}
          <div className="signature-block mt-10 pt-4 grid grid-cols-2 text-center text-xs">
            <div className="space-y-1">
              <div className="font-semibold">បានឃើញ និងពិនិត្យត្រឹមត្រូវ</div>
              <div className="font-moul text-xs font-bold text-slate-900 mt-1 leading-[1.9]">
                គ្រូទទួលបន្ទុកប្រចាំថ្នាក់
              </div>
              <div className="h-20"></div>
            </div>

            <div className="space-y-1">
              <div className="text-slate-600">ទួលសំបួរ, {khmerDateStr}</div>
              <div className="font-moul text-xs font-bold text-blue-950 mt-1 leading-[1.9]">
                នាយកសាលា អនុវិទ្យាល័យទួលសំបួរ
              </div>
              <div className="h-20"></div>
              <div className="font-moul text-xs font-bold text-slate-900 leading-[1.9]">
                លាង បេន
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
