import React from 'react';
import { Printer, X, Download, School, CheckCircle2 } from 'lucide-react';
import { formatKhmerDate, getAttendanceStatusBadge } from '../utils/calculations.ts';
import { SCHOOL_LOGO_URL } from '../utils/schoolLogo.ts';

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

  if (!isOpen || !data) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const khmerDateStr = formatKhmerDate(todayStr);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-8 shadow-2xl my-8 print:shadow-none print:p-0 print:my-0 print:max-w-none">
        {/* Controls: hidden during print */}
        <div className="no-print flex items-center justify-between pb-4 mb-6 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-900" />
            <h3 className="text-sm font-bold font-moul text-slate-900">
              ទម្រង់បោះពុម្ពផ្លូវការ A4 (Official Print Preview)
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-semibold bg-blue-900 text-white rounded-xl hover:bg-blue-800 flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>បោះពុម្ព (Print / Save as PDF)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Document Body (Formatted like MoEYS official papers) */}
        <div className="print-sheet font-khmer text-slate-900 text-sm leading-relaxed max-w-3xl mx-auto">
          {/* Header MoEYS with Official School Logo */}
          <div className="flex items-center justify-between text-center pb-4">
            <div className="text-left space-y-0.5">
              <div className="font-moul text-xs font-bold text-slate-900">
                ក្រសួងអប់រំ យុវជន និងកីឡា
              </div>
              <div className="text-xs text-slate-800">
                មន្ទីរអប់រំ យុវជន និងកីឡា ខេត្តកំពង់ចាម
              </div>
              <div className="text-xs text-slate-800">ការិយាល័យអប់រំ ស្រុកស្ទឹងត្រង់</div>
              <div className="font-moul text-xs text-blue-950 font-bold">
                អនុវិទ្យាល័យ ហ៊ុន សែន ទួលសំបួរ
              </div>
            </div>

            {/* Official School Seal Logo */}
            <div className="px-4">
              <div className="w-18 h-18 rounded-full p-0.5 border-2 border-amber-500 overflow-hidden mx-auto flex items-center justify-center shadow-xs">
                <img
                  src={SCHOOL_LOGO_URL}
                  alt="Logo អនុវិទ្យាល័យ ហ៊ុន សែន ទួលសំបួរ"
                  className="w-full h-full object-cover scale-[1.38] rounded-full"
                />
              </div>
            </div>

            <div className="text-center space-y-0.5">
              <div className="font-moul text-xs font-bold text-slate-900">
                ព្រះរាជាណាចក្រកម្ពុជា
              </div>
              <div className="font-moul text-xs text-slate-900">ជាតិ សាសនា ព្រះមហាក្សត្រ</div>
              <div className="text-xs text-amber-600 font-serif">❖ ❖ ❖</div>
            </div>
          </div>

          <div className="border-b-2 border-slate-900 my-2"></div>

          {/* Document Title */}
          <div className="text-center my-6">
            <h2 className="font-moul text-base sm:text-lg font-bold text-blue-950">
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
              <div className="flex justify-between text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  កាលបរិច្ឆេទ៖ <strong>{formatKhmerDate(data.date || todayStr)}</strong>
                </div>
                <div>
                  ថ្នាក់រៀន៖ <strong>{data.classId === 'all' ? 'គ្រប់ថ្នាក់' : data.classId}</strong>
                </div>
                <div>
                  ភាគរយវត្តមាន៖ <strong>{data.stats?.attendanceRate || 100}%</strong>
                </div>
              </div>

              <table className="w-full border-collapse border border-slate-300 text-xs text-left">
                <thead>
                  <tr className="bg-slate-100 font-bold">
                    <th className="border border-slate-300 p-2 text-center w-10">ល.រ</th>
                    <th className="border border-slate-300 p-2">ឈ្មោះសិស្ស</th>
                    <th className="border border-slate-300 p-2 text-center">ស្ថានភាពវត្តមាន</th>
                    <th className="border border-slate-300 p-2">មូលហេតុនៃការអវត្តមាន</th>
                  </tr>
                </thead>
                <tbody>
                  {data.records?.slice(0, 15).map((r: any, idx: number) => {
                    const badge = getAttendanceStatusBadge(r.status);
                    return (
                      <tr key={idx}>
                        <td className="border border-slate-300 p-2 text-center">{idx + 1}</td>
                        <td className="border border-slate-300 p-2 font-bold">{r.studentName}</td>
                        <td className="border border-slate-300 p-2 text-center">{badge.label}</td>
                        <td className="border border-slate-300 p-2 text-slate-600">{r.reason || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Report Type 2: Exam / Report Card */}
          {reportType === 'exam' && (
            <div className="space-y-4">
              <div className="flex justify-between text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
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
                  <tr className="bg-slate-100 font-bold">
                    <th className="border border-slate-300 p-2 text-center w-12">ចំណាត់ថ្នាក់</th>
                    <th className="border border-slate-300 p-2">ឈ្មោះសិស្ស</th>
                    <th className="border border-slate-300 p-2 text-center">ពិន្ទុសរុប</th>
                    <th className="border border-slate-300 p-2 text-center">មធ្យមភាគ</th>
                    <th className="border border-slate-300 p-2 text-center">និទ្ទេស</th>
                    <th className="border border-slate-300 p-2">ការវាយតម្លៃរបស់ក្រុមប្រឹក្សា</th>
                  </tr>
                </thead>
                <tbody>
                  {data.results?.map((res: any, idx: number) => (
                    <tr key={idx}>
                      <td className="border border-slate-300 p-2 text-center font-bold">
                        លេខ {res.rank}
                      </td>
                      <td className="border border-slate-300 p-2 font-bold">{res.studentName}</td>
                      <td className="border border-slate-300 p-2 text-center">{res.totalScore}</td>
                      <td className="border border-slate-300 p-2 text-center font-mono font-bold">
                        {res.average}
                      </td>
                      <td className="border border-slate-300 p-2 text-center font-bold">
                        {res.gradeLetter}
                      </td>
                      <td className="border border-slate-300 p-2 text-slate-700">{res.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Official Signatures Footer */}
          <div className="mt-12 pt-6 grid grid-cols-2 text-center text-xs">
            <div className="space-y-1">
              <div className="font-semibold">បានឃើញ និងពិនិត្យត្រឹមត្រូវ</div>
              <div className="font-moul text-xs font-bold text-slate-900 mt-1">
                គ្រូទទួលបន្ទុកប្រចាំថ្នាក់
              </div>
              <div className="h-20 flex items-center justify-center">
                <span className="text-[10px] text-slate-400 italic">(ហត្ថលេខា)</span>
              </div>
              <div className="font-bold text-slate-800">លោកគ្រូ ចាន់ ណារិន</div>
            </div>

            <div className="space-y-1">
              <div className="text-slate-600">
                ទួលសំបួរ, {khmerDateStr}
              </div>
              <div className="font-moul text-xs font-bold text-blue-950 mt-1">
                នាយកសាលា អនុវិទ្យាល័យទួលសំបួរ
              </div>
              <div className="h-20 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-rose-400 text-rose-500 text-[9px] flex items-center justify-center font-bold rotate-12">
                  ត្រាសាលា
                </div>
              </div>
              <div className="font-bold text-slate-900">លោកគ្រូ អ៊ុក សុផល</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
