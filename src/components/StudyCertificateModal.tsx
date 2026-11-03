import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Printer,
  FileCheck,
  X,
  User,
  GraduationCap,
  Calendar,
  Building,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { Student, SchoolClass } from '../types/index.ts';
import { SCHOOL_LOGO_URL } from '../utils/schoolLogo.ts';
import { safeAvatar, DEFAULT_STUDENT_AVATAR } from '../utils/avatar.ts';
import { formatKhmerDate, toKhmerNum } from '../utils/calculations.ts';

interface StudyCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  classes: SchoolClass[];
  preSelectedStudent?: Student;
}

type CertType = 'study' | 'transfer';

export const StudyCertificateModal: React.FC<StudyCertificateModalProps> = ({
  isOpen,
  onClose,
  students,
  classes,
  preSelectedStudent,
}) => {
  const [certType, setCertType] = useState<CertType>('study');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    preSelectedStudent?.id || students[0]?.id || ''
  );
  const [purpose, setPurpose] = useState<string>('យកទៅប្រើប្រាស់តាមផ្លូវការ');
  const [transferDestination, setTransferDestination] = useState<string>(
    'វិទ្យាល័យ ហ៊ុន សែន ស្ទឹងត្រង់'
  );
  const [conductRating, setConductRating] = useState<string>('ល្អប្រសើរ');
  const [academicStanding, setAcademicStanding] = useState<string>('ជាប់កម្រិតមធ្យមសិក្សាបឋមភូមិ');
  const [refNumber, setRefNumber] = useState<string>(() => `${Math.floor(100 + Math.random() * 900)}/២៦`);

  useEffect(() => {
    if (preSelectedStudent?.id) {
      setSelectedStudentId(preSelectedStudent.id);
    }
  }, [preSelectedStudent]);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-print-active');
    } else {
      document.body.classList.remove('modal-print-active');
    }
    return () => {
      document.body.classList.remove('modal-print-active');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const activeStudent = students.find((s) => s.id === selectedStudentId) || students[0];
  const activeClass = classes.find((c) => c.id === activeStudent?.classId);

  const today = new Date();
  const dayKh = toKhmerNum(today.getDate());
  const monthNamesKh = [
    'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
    'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ',
  ];
  const monthKh = monthNamesKh[today.getMonth()];
  const yearKh = toKhmerNum(today.getFullYear());

  const handlePrint = () => {
    document.body.classList.add('modal-print-active');
    setTimeout(() => {
      window.print();
    }, 50);
  };

  return createPortal(
    <div
      id="official-print-modal-overlay"
      className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-xs animate-in fade-in font-khmer print:static print:bg-white print:p-0"
    >
      <div
        id="official-print-modal-card"
        className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-100 max-h-[95vh] flex flex-col print:max-h-none print:shadow-none print:border-none print:p-0 print:max-w-none"
      >
        {/* Modal Controls Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 flex-shrink-0 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center font-bold">
              <FileCheck className="w-5 h-5 text-blue-900" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 font-moul leading-relaxed">
                លិខិតបញ្ជាក់ការសិក្សា & លិខិតផ្ទេរការសិក្សា
              </h2>
              <p className="text-xs text-slate-500">
                ទម្រង់ផ្លូវការស្ដង់ដារក្រសួងអប់រំ យុវជន និងកីឡា សម្រាប់បោះពុម្ពលើក្រដាស A4
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-900 hover:bg-blue-800 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>បោះពុម្ពលិខិត (Print A4)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Configuration Bar */}
        <div className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-3 border-b border-slate-100 no-print flex-shrink-0 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">ប្រភេទលិខិត៖</label>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setCertType('study')}
                className={`flex-1 py-1 text-center font-bold rounded-lg cursor-pointer transition-all ${
                  certType === 'study' ? 'bg-white text-blue-950 shadow-xs' : 'text-slate-600'
                }`}
              >
                លិខិតបញ្ជាក់ការសិក្សា
              </button>
              <button
                type="button"
                onClick={() => setCertType('transfer')}
                className={`flex-1 py-1 text-center font-bold rounded-lg cursor-pointer transition-all ${
                  certType === 'transfer' ? 'bg-white text-blue-950 shadow-xs' : 'text-slate-600'
                }`}
              >
                លិខិតផ្ទេរការសិក្សា
              </button>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">ជ្រើសរើសសិស្ស៖</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2 focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.khmerName} ({classes.find((c) => c.id === s.classId)?.name || 'ថ្នាក់'}) - {s.studentId}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {certType === 'study' ? 'គោលបំណងចេញលិខិត៖' : 'សាលាដែលត្រូវផ្ទេរទៅ៖'}
            </label>
            {certType === 'study' ? (
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="ឧ. យកទៅប្រើប្រាស់តាមផ្លូវការ"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
              />
            ) : (
              <input
                type="text"
                value={transferDestination}
                onChange={(e) => setTransferDestination(e.target.value)}
                placeholder="ឧ. វិទ្យាល័យ ហ៊ុន សែន ស្ទឹងត្រង់"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
              />
            )}
          </div>
        </div>

        {/* Printable A4 Certificate Preview */}
        <div
          id="official-print-sheet"
          className="flex-1 overflow-y-auto py-4 bg-slate-100 rounded-2xl flex justify-center print:bg-white print:p-0 print:overflow-visible"
        >
          <div
            className="w-[210mm] min-h-[297mm] bg-white p-12 sm:p-14 shadow-lg border border-slate-300 print:w-full print:min-h-0 print:border-none print:shadow-none print:p-2 flex flex-col justify-between text-slate-900 relative"
            style={{ boxSizing: 'border-box' }}
          >
            {/* National Motto Header */}
            <div>
              <div className="text-center space-y-1">
                <div className="font-moul text-base text-slate-900">
                  ព្រះរាជាណាចក្រកម្ពុជា
                </div>
                <div className="font-moul text-sm text-slate-900">
                  ជាតិ សាសនា ព្រះមហាក្សត្រ
                </div>
                <div className="text-sm font-serif tracking-widest text-slate-600">
                  3 3 3
                </div>
              </div>

              {/* Department & School Info */}
              <div className="flex justify-between items-start mt-6 text-xs leading-relaxed">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-800">ក្រសួងអប់រំ យុវជន និងកីឡា</div>
                  <div className="font-semibold text-slate-700">មន្ទីរអប់រំ យុវជន និងកីឡាខេត្តកំពង់ចាម</div>
                  <div className="font-semibold text-slate-700">ការិយាល័យអប់រំ យុវជន និងកីឡាស្រុកស្ទឹងត្រង់</div>
                  <div className="font-moul text-xs text-blue-950 pt-1">
                    អនុវិទ្យាល័យ ហ៊ុន សែន ទួលសំបួរ
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    លេខ: {refNumber} អ.ទ.ស
                  </div>
                </div>

                {/* 4x6 Photo Frame with Seal */}
                <div className="w-24 h-32 border-2 border-dashed border-slate-400 bg-slate-50 rounded-md flex flex-col items-center justify-center relative overflow-hidden flex-shrink-0">
                  {activeStudent?.photo ? (
                    <img
                      src={activeStudent.photo}
                      alt="Student"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] text-slate-400 font-bold">រូបថត ៤x៦</span>
                  )}
                  <div className="absolute inset-0 border border-rose-500/30 rounded-md pointer-events-none"></div>
                </div>
              </div>

              {/* Certificate Title */}
              <div className="text-center my-8">
                <h1 className="font-moul text-xl text-blue-950 leading-relaxed underline underline-offset-8 decoration-amber-500">
                  {certType === 'study' ? 'លិខិតបញ្ជាក់ការសិក្សា' : 'លិខិតផ្ទេរការសិក្សា'}
                </h1>
                <p className="text-xs text-slate-500 font-mono mt-1">
                  {certType === 'study' ? 'STUDY CERTIFICATE' : 'STUDENT TRANSFER CERTIFICATE'}
                </p>
              </div>

              {/* Main Official Content Body */}
              <div className="space-y-3.5 text-xs text-slate-800 leading-loose text-justify font-sans">
                <p className="font-bold indent-8 text-sm text-slate-900">
                  នាយកនៃអនុវិទ្យាល័យ ហ៊ុន សែន ទួលសំបួរ សូមបញ្ជាក់ថា ៖
                </p>

                <div className="pl-6 space-y-2">
                  <div className="flex items-baseline">
                    <span className="w-48 text-slate-600">- សិស្សឈ្មោះ (ជាអក្សរខ្មែរ) ៖</span>
                    <span className="font-moul text-sm text-slate-950 font-bold underline">
                      {activeStudent?.khmerName}
                    </span>
                  </div>

                  <div className="flex items-baseline">
                    <span className="w-48 text-slate-600">- អក្សរឡាតាំង (Latin) ៖</span>
                    <span className="font-mono font-bold text-slate-900">
                      {activeStudent?.latinName || '-'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-baseline">
                      <span className="w-28 text-slate-600">- ភេទ ៖</span>
                      <span className="font-bold">{activeStudent?.gender}</span>
                    </div>
                    <div className="flex items-baseline">
                      <span className="w-36 text-slate-600">- ថ្ងៃខែឆ្នាំកំណើត ៖</span>
                      <span className="font-bold font-mono">{activeStudent?.dob}</span>
                    </div>
                  </div>

                  <div className="flex items-baseline">
                    <span className="w-48 text-slate-600">- ទីកន្លែងកំណើត ៖</span>
                    <span className="font-medium text-slate-900">{activeStudent?.pob || 'ខេត្តកំពង់ចាម'}</span>
                  </div>

                  <div className="flex items-baseline">
                    <span className="w-48 text-slate-600">- ឈ្មោះឪពុក ៖</span>
                    <span className="font-semibold text-slate-900">{activeStudent?.parentName || 'ស៊ុយ សុខា'}</span>
                  </div>

                  <div className="flex items-baseline">
                    <span className="w-48 text-slate-600">- អាសយដ្ឋានបច្ចុប្បន្ន ៖</span>
                    <span className="font-medium text-slate-900">{activeStudent?.address || 'ភូមិទួលសំបួរ ឃុំទួលសំបួរ ស្រុកស្ទឹងត្រង់ ខេត្តកំពង់ចាម'}</span>
                  </div>

                  <div className="flex items-baseline">
                    <span className="w-48 text-slate-600">- អត្តលេខសិស្ស ៖</span>
                    <span className="font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
                      {activeStudent?.studentId}
                    </span>
                  </div>

                  <div className="flex items-baseline">
                    <span className="w-48 text-slate-600">
                      {certType === 'study' ? '- បច្ចុប្បន្នកំពុងរៀននៅថ្នាក់ ៖' : '- បានបញ្ចប់ការសិក្សានៅថ្នាក់ ៖'}
                    </span>
                    <span className="font-bold text-blue-950 font-moul">
                      {activeClass?.name || 'ថ្នាក់រៀន'}
                    </span>
                  </div>
                </div>

                {certType === 'study' ? (
                  <p className="indent-8 leading-relaxed pt-2">
                    ពិតជាសិស្សកំពុងសិក្សារៀនសូត្រក្នុង <strong>អនុវិទ្យាល័យ ហ៊ុន សែន ទួលសំបួរ</strong> ក្នុងឆ្នាំសិក្សា <strong>២០២៥ - ២០២៦</strong> ប្រាកដមែន។ លិខិតបញ្ជាក់នេះ ចេញជូនសាមីខ្លួនយកទៅ <strong>{purpose}</strong> ដោយស្មោះត្រង់។
                  </p>
                ) : (
                  <div className="space-y-2 pt-2">
                    <p className="indent-8 leading-relaxed">
                      បានអនុញ្ញាតឱ្យផ្ទេរការសិក្សាទៅកាន់ <strong>{transferDestination}</strong> ដោយសារមូលហេតុផ្លាស់ប្តូរទីលំនៅរបស់អាណាព្យាបាល។
                    </p>
                    <div className="grid grid-cols-2 gap-4 pl-6 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div>
                        <span className="text-slate-600">មារយាទសិស្ស ៖ </span>
                        <strong className="text-emerald-800">{conductRating}</strong>
                      </div>
                      <div>
                        <span className="text-slate-600">ស្ថានភាពសិក្សា ៖ </span>
                        <strong className="text-blue-900">{academicStanding}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Signature & Seal Block */}
            <div className="mt-12 flex justify-between items-end text-xs">
              <div className="text-center space-y-1">
                <div className="font-bold text-slate-700">បានឃើញ និងឯកភាព</div>
                <div className="text-[11px] text-slate-500">ប្រធានការិយាល័យអប់រំ យុវជន និងកីឡា</div>
                <div className="h-16"></div>
              </div>

              <div className="text-center space-y-1">
                <div className="font-medium text-slate-700">
                  ទួលសំបួរ, ថ្ងៃទី {dayKh} ខែ {monthKh} ឆ្នាំ {yearKh}
                </div>
                <div className="font-moul text-xs text-blue-950 font-bold leading-[1.9]">
                  នាយកសាលា អនុវិទ្យាល័យទួលសំបួរ
                </div>
                <div className="h-20"></div>
                <div className="font-moul text-xs text-slate-900 font-bold leading-[1.9]">
                  លាង បេន
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between no-print flex-shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            💡 លិខិតត្រូវបានរៀបចំទម្រង់ស្របតាមស្ដង់ដារក្រសួងអប់រំ អាចបោះពុម្ពបានភ្លាមៗ។
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
          >
            បិទ
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
