import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Award,
  Printer,
  X,
  CheckSquare,
  Square,
  Search,
  Settings2,
  Upload,
  RotateCcw,
  Sparkles,
  Image as ImageIcon,
  UserCheck,
} from 'lucide-react';
import { Student, SchoolClass, Exam, ExamResult } from '../types/index.ts';
import { SCHOOL_LOGO_URL } from '../utils/schoolLogo.ts';
import { CERTIFICATE_FRAME_URL } from '../utils/certificateFrame.ts';
import { safeAvatar, DEFAULT_STUDENT_AVATAR } from '../utils/avatar.ts';

const toKhmerNum = (num: number | string): string => {
  const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
  return String(num)
    .split('')
    .map((ch) => (ch >= '0' && ch <= '9' ? khmerDigits[Number(ch)] : ch))
    .join('');
};

/**
 * Formats class name like "ថ្នាក់ទី ៧ ក" -> 'ថ្នាក់ទី ៧ “ក”'
 */
const formatClassForCertificate = (rawName?: string): string => {
  if (!rawName) return 'ថ្នាក់ទី ៧ “ក”';
  const trimmed = rawName.trim();
  const match = trimmed.match(/^(ថ្នាក់ទី\s*[០-៩0-9]+)\s+([^\s"]+.*)$/);
  if (match) {
    return `${match[1]} “${match[2].replace(/[“”"]/g, '')}”`;
  }
  return trimmed;
};

export interface SchoolCertificateStandard {
  frameColorStyle: 'original_red_gold' | 'royal_gold' | 'classic_blue' | 'emerald_green';
  officeOrDepartmentName: string;
  districtOrProvince: string;
  schoolName: string;
  presenterTitle: string;
  complimentLine: string;
  certificateNumber: string;
  academicYear: string;
  blessingLine: string;
  locationAndDate: string;
  directorApprovalLine: string;
  directorTitle: string;
  directorName: string;
  showDirectorName: boolean;
  homeroomTeacherTitle: string;
  homeroomTeacherName: string;
  showHomeroomTeacherName: boolean;
  swapSignatureSides: boolean;
  showPhotoBox: boolean;
  showStudentPhotoInBox: boolean;
  useSchoolLogoAtTopCenter: boolean;
  showCenterWatermark: boolean;
  customLogoUrl: string;
}

const STORAGE_KEY = 'toulsambour_certificate_standard_v7';

const DEFAULT_STANDARD: SchoolCertificateStandard = {
  frameColorStyle: 'original_red_gold',
  officeOrDepartmentName: 'ការិយាល័យអប់រំ យុវជន និងកីឡា',
  districtOrProvince: 'ស្រុកស្ទឹងត្រង់ ខេត្តកំពង់ចាម',
  schoolName: 'អនុវិទ្យាល័យ ហ៊ុន សែន ទួលសំបួរ',
  presenterTitle: 'នាយកអនុវិទ្យាល័យ ហ៊ុន សែន ទួលសំបួរ',
  complimentLine: 'សូមគោរពសរសើរចំពោះ',
  certificateNumber: '.................................',
  academicYear: '២០២៥-២០២៦',
  blessingLine: 'សូមជូននូវពុទ្ធពរទាំងបួនប្រការគឺ អាយុ វណ្ណៈ សុខៈ ពលៈ ជានិច្ចនិរន្តរ៍។',
  locationAndDate: 'ទួលសំបួរ ថ្ងៃទី០៣ ខែវិច្ឆិកា ឆ្នាំ២០២៦',
  directorApprovalLine: 'បានឃើញ និងឯកភាព',
  directorTitle: 'នាយកសាលា',
  directorName: 'លាង បេន',
  showDirectorName: false,
  homeroomTeacherTitle: 'គ្រូបន្ទុកថ្នាក់',
  homeroomTeacherName: '',
  showHomeroomTeacherName: false,
  swapSignatureSides: false,
  showPhotoBox: true,
  showStudentPhotoInBox: false,
  useSchoolLogoAtTopCenter: false,
  showCenterWatermark: true,
  customLogoUrl: '',
};

interface HonorCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  classes: SchoolClass[];
  exams: Exam[];
  examResults: ExamResult[];
  initialClassId?: string;
  initialExamId?: string;
  initialStudentId?: string;
  precomputedResults?: Array<{
    studentId: string;
    studentCode?: string;
    studentName: string;
    totalScore: number;
    average: number;
    rank: number;
    gradeLetter: string;
    remarks?: string;
  }>;
}

export const HonorCertificateModal: React.FC<HonorCertificateModalProps> = ({
  isOpen,
  onClose,
  students,
  classes,
  exams,
  examResults,
  initialClassId,
  initialExamId,
  initialStudentId,
  precomputedResults,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(
    initialClassId || classes[0]?.id || 'cls-7a'
  );
  const [selectedExamId, setSelectedExamId] = useState<string>(
    initialExamId || exams[0]?.id || ''
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [showSettingsPanel, setShowSettingsPanel] = useState<boolean>(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [standard, setStandard] = useState<SchoolCertificateStandard>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_STANDARD, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_STANDARD;
  });

  const updateStandard = (patch: Partial<SchoolCertificateStandard>) => {
    setStandard((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleResetStandard = () => {
    setStandard(DEFAULT_STANDARD);
    localStorage.removeItem(STORAGE_KEY);
  };

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-print-active');
      if (initialClassId) setSelectedClassId(initialClassId);
      if (initialExamId) setSelectedExamId(initialExamId);
    } else {
      document.body.classList.remove('modal-print-active');
    }
    return () => {
      document.body.classList.remove('modal-print-active');
    };
  }, [isOpen, initialClassId, initialExamId]);

  const currentClass = useMemo(
    () => classes.find((c) => c.id === selectedClassId) || classes[0],
    [classes, selectedClassId]
  );

  // Build ranked student list for the selected class & exam
  const rankedList = useMemo(() => {
    const classStudents = students.filter((s) => s.classId === selectedClassId);

    if (
      precomputedResults &&
      precomputedResults.length > 0 &&
      selectedClassId === initialClassId &&
      selectedExamId === initialExamId
    ) {
      return precomputedResults
        .map((r) => {
          const stu = students.find((s) => s.id === r.studentId);
          return {
            studentId: r.studentId,
            studentCode: r.studentCode || stu?.studentId || '',
            khmerName: r.studentName || stu?.khmerName || '',
            latinName: stu?.latinName || '',
            gender: stu?.gender || 'ប្រុស',
            dob: stu?.dob || '',
            photo: safeAvatar(stu?.photo, DEFAULT_STUDENT_AVATAR),
            rank: r.rank,
            average: r.average,
            totalScore: r.totalScore,
            gradeLetter: r.gradeLetter,
            remarks: r.remarks || '',
          };
        })
        .sort((a, b) => a.rank - b.rank);
    }

    const storedForExam = examResults.filter(
      (r) => r.examId === selectedExamId && r.classId === selectedClassId
    );

    return classStudents
      .map((stu, idx) => {
        const res = storedForExam.find((r) => r.studentId === stu.id);
        return {
          studentId: stu.id,
          studentCode: stu.studentId,
          khmerName: stu.khmerName,
          latinName: stu.latinName || '',
          gender: stu.gender,
          dob: stu.dob,
          photo: safeAvatar(stu.photo, DEFAULT_STUDENT_AVATAR),
          rank: res?.rank || idx + 1,
          average: res?.average ?? 85.0,
          totalScore: res?.totalScore ?? 425,
          gradeLetter: res?.gradeLetter || 'A',
          remarks: res?.remarks || 'ល្អប្រសើរ',
        };
      })
      .sort((a, b) => a.rank - b.rank);
  }, [
    students,
    selectedClassId,
    selectedExamId,
    examResults,
    precomputedResults,
    initialClassId,
    initialExamId,
  ]);

  useEffect(() => {
    if (!isOpen) return;
    if (initialStudentId) {
      setSelectedStudentIds([initialStudentId]);
    } else if (rankedList.length > 0) {
      const topIds = rankedList
        .filter((item) => item.rank <= 5)
        .map((item) => item.studentId);
      setSelectedStudentIds(topIds.length > 0 ? topIds : [rankedList[0].studentId]);
    } else {
      setSelectedStudentIds([]);
    }
  }, [isOpen, initialStudentId, selectedClassId, rankedList.length]);

  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return rankedList;
    const q = searchQuery.toLowerCase().trim();
    return rankedList.filter(
      (item) =>
        item.khmerName.toLowerCase().includes(q) ||
        item.latinName.toLowerCase().includes(q) ||
        item.studentCode.toLowerCase().includes(q) ||
        String(item.rank) === q
    );
  }, [rankedList, searchQuery]);

  const selectedCertificates = useMemo(
    () => rankedList.filter((item) => selectedStudentIds.includes(item.studentId)),
    [rankedList, selectedStudentIds]
  );

  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectTopN = (n: number) => {
    const ids = rankedList.filter((item) => item.rank <= n).map((item) => item.studentId);
    setSelectedStudentIds(ids);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateStandard({
          customLogoUrl: reader.result,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  const activeSchoolLogo = standard.customLogoUrl || SCHOOL_LOGO_URL;
  const formattedClassName = formatClassForCertificate(currentClass?.name);

  const getFrameFilter = () => {
    switch (standard.frameColorStyle) {
      case 'royal_gold':
        return 'hue-rotate(28deg) saturate(1.5) brightness(1.02)';
      case 'classic_blue':
        return 'hue-rotate(215deg) saturate(1.4)';
      case 'emerald_green':
        return 'hue-rotate(115deg) saturate(1.2)';
      case 'original_red_gold':
      default:
        return 'none';
    }
  };

  return createPortal(
    <div
      id="official-print-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-start justify-center p-2 sm:p-4 overflow-y-auto overscroll-contain touch-pan-y"
    >
      {/* Print A4 Landscape Styles */}
      <style>
        {`
          @media print {
            @page {
              size: A4 landscape;
              margin: 0mm !important;
            }
            #official-print-sheet {
              padding: 0mm !important;
              margin: 0mm !important;
              width: 100% !important;
              max-width: none !important;
            }
            .certificate-print-page {
              zoom: 1 !important;
              width: 297mm !important;
              height: 210mm !important;
              padding: 0mm !important;
              margin: 0 auto !important;
              box-sizing: border-box !important;
              page-break-after: always !important;
              break-after: page !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              overflow: hidden !important;
              box-shadow: none !important;
            }
            .certificate-print-page:last-child {
              page-break-after: auto !important;
              break-after: auto !important;
            }
          }
        `}
      </style>

      <div
        id="official-print-modal-card"
        className="bg-slate-100 rounded-2xl sm:rounded-3xl max-w-7xl w-full shadow-xl border border-slate-200 overflow-hidden my-1 sm:my-4"
      >
        {/* Top Control Bar (Hidden on Print) */}
        <div className="bg-white border-b border-slate-200 p-3 sm:p-4 sm:px-6 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-4 no-print print:hidden">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-red-600 to-amber-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <Award className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h2 className="text-xs sm:text-lg font-bold font-moul text-slate-900">
                  ប័ណ្ណសរសើរផ្លូវការតាមគម្រូដើម ១០០% (Official Honor Certificate)
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-500">
                  បង្កប់ស៊ុមប័ណ្ណសរសើរដូចបេះបិតទៅនឹងគម្រូដើម មិនបាត់ស៊ុមពេលដាក់លើ GitHub និងព្រីនពេញក្រដាស A4 ផ្តេក
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Quick Toggle for 4x6 Photo Box */}
            <button
              type="button"
              onClick={() => updateStandard({ showPhotoBox: !standard.showPhotoBox })}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                standard.showPhotoBox
                  ? 'bg-blue-50 text-blue-900 border-blue-300'
                  : 'bg-slate-100 text-slate-600 border-slate-300'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>{standard.showPhotoBox ? 'បង្ហាញប្រអប់រូបថត ៤×៦' : 'មិនដាក់ប្រអប់រូបថត'}</span>
            </button>

            {standard.showPhotoBox && (
              <button
                type="button"
                onClick={() =>
                  updateStandard({ showStudentPhotoInBox: !standard.showStudentPhotoInBox })
                }
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                  standard.showStudentPhotoInBox
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
              >
                <span>
                  {standard.showStudentPhotoInBox ? 'រូបថតសិស្សក្នុងប្រអប់' : 'ប្រអប់ ៤×៦ ទទេ'}
                </span>
              </button>
            )}

            {/* Customize School Standard Toggle */}
            <button
              type="button"
              onClick={() => setShowSettingsPanel(!showSettingsPanel)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                showSettingsPanel
                  ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                  : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
              }`}
            >
              <Settings2 className="w-4 h-4" />
              <span>កែឈ្មោះសាលា & ទម្រង់ ({showSettingsPanel ? 'បិទ' : 'បើកកែប្រែ'})</span>
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={() => window.print()}
              disabled={selectedCertificates.length === 0}
              className="px-4 py-2 text-xs font-bold bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white rounded-xl shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>
                បោះពុម្ពប័ណ្ណសរសើរ ({toKhmerNum(selectedCertificates.length)} សន្លឹក)
              </span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* School Standard Customization Panel (Expandable, Hidden on Print) */}
        {showSettingsPanel && (
          <div className="bg-amber-50/80 border-b border-amber-200 p-4 sm:px-6 space-y-4 no-print print:hidden animate-in fade-in">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/80 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-bold font-moul text-slate-900">
                  កែសម្រួលព័ត៌មានប័ណ្ណសរសើរតាមស្តង់ដារសាលានីមួយៗ (រក្សាទុកស្វ័យប្រវត្តិ)
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() =>
                    updateStandard({
                      useSchoolLogoAtTopCenter: !standard.useSchoolLogoAtTopCenter,
                    })
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                    standard.useSchoolLogoAtTopCenter
                      ? 'bg-blue-900 text-white border-blue-900'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  {standard.useSchoolLogoAtTopCenter
                    ? 'កំពុងប្រើឡូហ្គោសាលានៅកំពូលកណ្តាល'
                    : 'កំពុងប្រើសញ្ញាណគម្រូដើមនៅកំពូលកណ្តាល'}
                </button>
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="px-3 py-1.5 bg-white hover:bg-amber-100 text-slate-800 border border-amber-300 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-900" />
                  <span>ប្តូរឡូហ្គោសាលាថ្មី</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetStandard}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>កំណត់លំនាំដើមវិញ</span>
                </button>
              </div>
            </div>

            {/* Frame Color Options */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'original_red_gold', label: '១. ពណ៌គម្រូដើមបេះបិត (ក្រហម-មាស)' },
                { id: 'royal_gold', label: '២. ពណ៌មាសឆ្អិនឆ្អៅ (Royal Gold)' },
                { id: 'classic_blue', label: '៣. ពណ៌ខៀវផ្លូវការ (Royal Blue)' },
                { id: 'emerald_green', label: '៤. ពណ៌បៃតងមរកត (Emerald)' },
              ].map((styleItem) => (
                <button
                  key={styleItem.id}
                  type="button"
                  onClick={() =>
                    updateStandard({
                      frameColorStyle: styleItem.id as SchoolCertificateStandard['frameColorStyle'],
                    })
                  }
                  className={`p-2 rounded-xl border text-xs font-bold text-left cursor-pointer transition-all ${
                    standard.frameColorStyle === styleItem.id
                      ? 'bg-white border-red-600 ring-2 ring-red-500/30 text-red-950'
                      : 'bg-white/60 border-slate-200 text-slate-700 hover:bg-white'
                  }`}
                >
                  {styleItem.label}
                </button>
              ))}
            </div>

            {/* Editable Fields matching the Certificate */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  ការិយាល័យ / មន្ទីរអប់រំ (ជួរទី១ ខាងឆ្វេង)
                </label>
                <input
                  type="text"
                  value={standard.officeOrDepartmentName}
                  onChange={(e) => updateStandard({ officeOrDepartmentName: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  ស្រុក / ខេត្ត (ជួរទី២ ខាងឆ្វេង)
                </label>
                <input
                  type="text"
                  value={standard.districtOrProvince}
                  onChange={(e) => updateStandard({ districtOrProvince: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-blue-950 mb-1">
                  ឈ្មោះសាលារៀន (ជួរទី៣ ខាងឆ្វេង)
                </label>
                <input
                  type="text"
                  value={standard.schoolName}
                  onChange={(e) =>
                    updateStandard({
                      schoolName: e.target.value,
                      presenterTitle: `នាយក${e.target.value}`,
                    })
                  }
                  className="w-full bg-white border border-blue-400 rounded-xl px-3 py-2 font-bold text-blue-950"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  ចំណងជើងអ្នកផ្តល់ប័ណ្ណ (ពណ៌ខៀវក្រោម ប័ណ្ណសរសើរ)
                </label>
                <input
                  type="text"
                  value={standard.presenterTitle}
                  onChange={(e) => updateStandard({ presenterTitle: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  លេខប័ណ្ណសរសើរ (លេខ: ...)
                </label>
                <input
                  type="text"
                  value={standard.certificateNumber}
                  onChange={(e) => updateStandard({ certificateNumber: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  ឆ្នាំសិក្សា
                </label>
                <input
                  type="text"
                  value={standard.academicYear}
                  onChange={(e) => updateStandard({ academicYear: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  ទីកន្លែង និងកាលបរិច្ឆេទ (ខាងស្តាំក្រោម)
                </label>
                <input
                  type="text"
                  value={standard.locationAndDate}
                  onChange={(e) => updateStandard({ locationAndDate: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  ហត្ថលេខាទី១៖ នាយកសាលា (ពាក្យនាំមុខ, តួនាទី & ឈ្មោះ)
                </label>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={standard.directorApprovalLine}
                    onChange={(e) => updateStandard({ directorApprovalLine: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 font-medium text-slate-900"
                    placeholder="បានឃើញ និងឯកភាព"
                  />
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={standard.directorTitle}
                      onChange={(e) => updateStandard({ directorTitle: e.target.value })}
                      className="w-28 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 font-bold text-slate-900"
                      placeholder="នាយកសាលា"
                    />
                    <input
                      type="text"
                      value={standard.directorName}
                      onChange={(e) => updateStandard({ directorName: e.target.value })}
                      className="flex-1 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 font-bold text-slate-900"
                      placeholder="ឈ្មោះនាយក"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  <label className="flex items-center gap-1 cursor-pointer text-[11px] font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={standard.showDirectorName}
                      onChange={(e) => updateStandard({ showDirectorName: e.target.checked })}
                    />
                    <UserCheck className="w-3.5 h-3.5 text-blue-800" />
                    <span>បង្ហាញឈ្មោះនាយក</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-blue-950 mb-1">
                  ហត្ថលេខាទី២៖ គ្រូបន្ទុកថ្នាក់ (តួនាទី & ឈ្មោះគ្រូបន្ទុកថ្នាក់)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={standard.homeroomTeacherTitle}
                    onChange={(e) => updateStandard({ homeroomTeacherTitle: e.target.value })}
                    className="w-28 bg-white border border-blue-300 rounded-xl px-2.5 py-2 font-bold text-blue-950"
                    placeholder="គ្រូបន្ទុកថ្នាក់"
                  />
                  <input
                    type="text"
                    value={standard.homeroomTeacherName}
                    onChange={(e) => updateStandard({ homeroomTeacherName: e.target.value })}
                    className="flex-1 bg-white border border-blue-300 rounded-xl px-2.5 py-2 font-bold text-blue-950"
                    placeholder={currentClass?.homeroomTeacherName || 'ឈ្មោះគ្រូបន្ទុកថ្នាក់'}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-1.5">
                  <label className="flex items-center gap-1 cursor-pointer text-[11px] font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={standard.showHomeroomTeacherName}
                      onChange={(e) => updateStandard({ showHomeroomTeacherName: e.target.checked })}
                    />
                    <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>បង្ហាញឈ្មោះគ្រូបន្ទុកថ្នាក់</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer text-[11px] font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={standard.swapSignatureSides}
                      onChange={(e) => updateStandard({ swapSignatureSides: e.target.checked })}
                    />
                    <span>ប្ដូរឆ្វេង ⇄ ស្ដាំ (គ្រូបន្ទុកថ្នាក់ ⇄ នាយក)</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer text-[11px] font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={standard.showCenterWatermark}
                      onChange={(e) => updateStandard({ showCenterWatermark: e.target.checked })}
                    />
                    <span>ឡូហ្គោសាលាព្រាលៗនៅកណ្តាល</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter & Student Selection Bar (Hidden on Print) */}
        <div className="bg-slate-50 border-b border-slate-200 p-2.5 sm:p-4 sm:px-6 space-y-2.5 sm:space-y-3 no-print print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Class Selector */}
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-600">ថ្នាក់៖</span>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="text-xs bg-white border border-slate-300 rounded-xl px-2.5 py-1 sm:px-3 sm:py-1.5 font-bold text-slate-900"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.roomNumber})
                    </option>
                  ))}
                </select>
              </div>

              {/* Exam Selector */}
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-600">សម័យប្រឡង៖</span>
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="text-xs bg-white border border-slate-300 rounded-xl px-2.5 py-1 sm:px-3 sm:py-1.5 font-bold text-slate-900"
                >
                  {exams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.title} ({ex.semester})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Rank Filter Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => selectTopN(1)}
                  className="px-2 py-1 sm:px-2.5 sm:py-1.5 text-[11px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-lg border border-amber-300 cursor-pointer transition-colors"
                >
                  🥇 លេខ ១
                </button>
                <button
                  type="button"
                  onClick={() => selectTopN(3)}
                  className="px-2 py-1 sm:px-2.5 sm:py-1.5 text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg border border-amber-200 cursor-pointer transition-colors"
                >
                  🏆 លេខ ១ ដល់ ៣
                </button>
                <button
                  type="button"
                  onClick={() => selectTopN(5)}
                  className="px-2 py-1 sm:px-2.5 sm:py-1.5 text-[11px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-lg border border-blue-200 cursor-pointer transition-colors"
                >
                  🎖️ លេខ ១ ដល់ ៥
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStudentIds(rankedList.map((r) => r.studentId))}
                  className="px-2 py-1 sm:px-2.5 sm:py-1.5 text-[11px] font-semibold bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 cursor-pointer transition-colors"
                >
                  ជ្រើសរើសទាំងអស់ ({rankedList.length})
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ស្វែងរកឈ្មោះសិស្ស ឬចំណាត់ថ្នាក់..."
                className="w-full pl-8 pr-3 py-1 sm:py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-900"
              />
            </div>
          </div>

          {/* Student Selector Buttons (Wrapped & scrollable so all students are easily clickable on both PC & Android) */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 max-h-28 overflow-y-auto p-1 bg-white/60 rounded-xl border border-slate-200/70">
            {filteredList.map((item) => {
              const isSelected = selectedStudentIds.includes(item.studentId);
              return (
                <button
                  key={item.studentId}
                  type="button"
                  onClick={() => toggleStudent(item.studentId)}
                  className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 sm:gap-2 shrink-0 border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-950 text-white border-blue-950 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {isSelected ? (
                    <CheckSquare className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                  <span className="font-bold text-amber-500">លេខ {toKhmerNum(item.rank)}</span>
                  <span>{item.khmerName}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Printable Certificates Container */}
        <div
          id="official-print-sheet"
          className="p-2 sm:p-8 space-y-4 sm:space-y-8 overflow-x-auto print:p-0 print:space-y-0"
        >
          {selectedCertificates.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 no-print">
              <Award className="w-12 h-12 text-amber-400 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-800">
                សូមជ្រើសរើសសិស្សយ៉ាងហោចណាស់ ១ នាក់ខាងលើ ដើម្បីបង្កើតប័ណ្ណសរសើរ
              </p>
            </div>
          ) : (
            selectedCertificates.map((cert) => {
              const effectiveHomeroomTeacherName =
                standard.homeroomTeacherName.trim() ||
                currentClass?.homeroomTeacherName ||
                '';

              return (
                <div
                  key={cert.studentId}
                  className="certificate-print-page mx-auto bg-white shadow-xl print:shadow-none relative overflow-hidden w-[1120px] h-[792px]"
                >
                  {/* 1. EXACT SELF-CONTAINED BASE64 3D GOLD KBACH CERTIFICATE FRAME (from image_9dd5030d.png) */}
                  <img
                    src={CERTIFICATE_FRAME_URL}
                    alt="Official Certificate Frame"
                    className="absolute inset-0 w-full h-full object-fill pointer-events-none"
                    style={{ filter: getFrameFilter() }}
                  />

                  {/* Optional: If user chooses to place School Logo in the top-center arch between the gold Kbach wings */}
                  {standard.useSchoolLogoAtTopCenter && (
                    <div
                      className="absolute flex items-center justify-center rounded-full"
                      style={{
                        top: '22px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '108px',
                        height: '108px',
                      }}
                    >
                      <div className="w-[100px] h-[100px] rounded-full p-1 bg-white border-2 border-amber-500 shadow-xs flex items-center justify-center overflow-hidden">
                        <img
                          src={activeSchoolLogo}
                          alt={standard.schoolName}
                          className="w-full h-full object-contain rounded-full"
                        />
                      </div>
                    </div>
                  )}

                  {/* 2. INNER CERTIFICATE CONTENT AREA (Strictly inside the dark-blue inner rectangle of image_9dd5030d.png: top 20.6%, bottom 13.0%, left 11.2%, right 11.2%) */}
                  <div
                    className="absolute overflow-hidden"
                    style={{
                      top: '20.6%',
                      bottom: '13.0%',
                      left: '11.2%',
                      right: '11.2%',
                    }}
                  >
                    {/* 3. CENTER FADED SCHOOL LOGO WATERMARK */}
                    {standard.showCenterWatermark && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <img
                          src={activeSchoolLogo}
                          alt="School Watermark"
                          className="w-[260px] h-[260px] object-contain rounded-full opacity-[0.12]"
                        />
                      </div>
                    )}

                    {/* 4. EXACT LAYOUT & TYPOGRAPHY INSIDE THE 3D ROYAL GOLD KBACH FRAME */}
                    <div className="relative z-10 w-full h-full flex flex-col justify-between px-5 py-2 text-slate-950 box-border">
                      {/* TOP ROW: Left (Office, District, School, Number — without the small left logo #1) & Right (Kingdom of Cambodia Motto) */}
                      <div className="flex items-start justify-between w-full">
                        {/* Left Column */}
                        <div className="text-left space-y-1.5 pt-1">
                          <div className="font-moul text-[13.5px] text-[#1e3a8a] leading-[1.65]">
                            {standard.officeOrDepartmentName}
                          </div>
                          <div className="font-moul text-[13.5px] text-[#1e3a8a] leading-[1.65]">
                            {standard.districtOrProvince}
                          </div>
                          <div className="font-moul text-[13.5px] text-[#1e3a8a] leading-[1.65]">
                            {standard.schoolName}
                          </div>
                          <div className="text-[13.5px] text-black leading-[1.6]">
                            <span>លេខ: </span>
                            <span className="tracking-widest text-slate-700">
                              {standard.certificateNumber}
                            </span>
                          </div>
                        </div>

                        {/* Right Column: Kingdom of Cambodia Motto (Top-Right inside the blue line, matching image_9dd5030d.png) */}
                        <div className="text-center pr-2 pt-0.5 space-y-1">
                          <div className="font-moul text-[15.5px] text-[#1e3a8a] tracking-wide leading-[1.65]">
                            ព្រះរាជាណាចក្រកម្ពុជា
                          </div>
                          <div className="font-moul text-[15.5px] text-[#1e3a8a] tracking-wide leading-[1.65]">
                            ជាតិ សាសនា ព្រះមហាក្សត្រ
                          </div>
                          <div className="text-xs font-bold text-[#1e3a8a] tracking-widest">
                            ❖ ❖ ❖
                          </div>
                        </div>
                      </div>

                      {/* CENTER HEADINGS: "ប័ណ្ណសរសើរ", "នាយកសាលា...", "សូមគោរពសរសើរចំពោះ" */}
                      <div className="text-center -mt-3 space-y-0.5">
                        <div className="inline-block">
                          <h1 className="font-moul text-[27px] text-[#d91b1b] leading-[1.45] tracking-wide">
                            ប័ណ្ណសរសើរ
                          </h1>
                          <div className="text-[10px] text-[#d91b1b] tracking-[0.25em] -mt-1.5 font-bold">
                            ...........................................
                          </div>
                        </div>

                        <div className="font-moul text-[15.5px] text-[#1d63b8] leading-[1.65]">
                          {standard.presenterTitle}
                        </div>

                        <div className="text-[15px] font-semibold text-[#1d63b8] leading-[1.55]">
                          {standard.complimentLine}
                        </div>
                      </div>

                      {/* BODY CITATION PARAGRAPH */}
                      <div className="text-center px-2 text-[15.5px] text-black leading-[2.0] font-medium">
                        <div>
                          <span>សិស្សឈ្មោះ </span>
                          <span className="font-moul text-[17px] text-[#0038a8] mx-1.5">
                            {cert.khmerName}
                          </span>
                          <span> ភេទ </span>
                          <strong className="font-bold text-black mx-1">{cert.gender}</strong>
                          <span> រៀននៅ </span>
                          <strong className="font-bold text-black mx-1">
                            {formattedClassName}
                          </strong>
                          <span> នៃ</span>
                          <strong className="font-moul text-[14.5px] text-black mx-1">
                            {standard.schoolName}
                          </strong>
                          <span> ដែល</span>
                        </div>

                        <div>
                          <span>បានយកចិត្តទុកដាក់ ខិតខំសិក្សារៀនសូត្រ ទទួលបានចំណាត់ថ្នាក់លេខ </span>
                          <span
                            className="font-moul text-[18px] mx-1.5"
                            style={{
                              color: '#d91b1b',
                            }}
                          >
                            {toKhmerNum(cert.rank)}
                          </span>
                          <span> ប្រចាំឆ្នាំសិក្សា {standard.academicYear} ។</span>
                        </div>

                        <div>{standard.blessingLine}</div>
                      </div>

                      {/* BOTTOM SECTION: Dual Signatures (School Director & Homeroom Teacher) + Optional 4x6 Photo Box in Center */}
                      <div className="w-full h-[116px] flex items-start justify-between px-4 pt-1">
                        {/* LEFT SIGNATURE BLOCK */}
                        {!standard.swapSignatureSides ? (
                          <div className="text-center min-w-[230px]">
                            <div className="text-[14.5px] text-black font-medium leading-[1.6]">
                              {standard.directorApprovalLine}
                            </div>
                            <div className="font-moul text-[15px] text-[#1e3a8a] mt-1 leading-[1.6]">
                              {standard.directorTitle}
                            </div>
                            {standard.showDirectorName && standard.directorName ? (
                              <div className="font-moul text-[14px] text-[#1e3a8a] mt-9 leading-[1.5]">
                                {standard.directorName}
                              </div>
                            ) : (
                              <div className="h-11" />
                            )}
                          </div>
                        ) : (
                          <div className="text-center min-w-[230px]">
                            <div className="text-[14.5px] text-transparent select-none leading-[1.6]">
                              .
                            </div>
                            <div className="font-moul text-[15px] text-[#1e3a8a] mt-1 leading-[1.6]">
                              {standard.homeroomTeacherTitle}
                            </div>
                            {standard.showHomeroomTeacherName && effectiveHomeroomTeacherName ? (
                              <div className="font-moul text-[14px] text-[#1e3a8a] mt-9 leading-[1.5]">
                                {effectiveHomeroomTeacherName}
                              </div>
                            ) : (
                              <div className="h-11" />
                            )}
                          </div>
                        )}

                        {/* CENTER 4x6 PHOTO BOX */}
                        <div className="flex items-center justify-center">
                          {standard.showPhotoBox ? (
                            <div className="w-[78px] h-[104px] border border-black flex flex-col items-center justify-center text-center bg-white/90 overflow-hidden shadow-2xs">
                              {standard.showStudentPhotoInBox ? (
                                <img
                                  src={cert.photo}
                                  alt={cert.khmerName}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = DEFAULT_STUDENT_AVATAR;
                                  }}
                                />
                              ) : (
                                <div className="space-y-1.5 text-[12px] text-black font-medium">
                                  <div>រូបថតថ្មី</div>
                                  <div>ទំហំ ៤×៦</div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="w-[78px]" />
                          )}
                        </div>

                        {/* RIGHT SIGNATURE BLOCK */}
                        {!standard.swapSignatureSides ? (
                          <div className="text-center min-w-[250px]">
                            <div className="text-[14.5px] text-black font-medium leading-[1.6]">
                              {standard.locationAndDate}
                            </div>
                            <div className="font-moul text-[15px] text-[#1e3a8a] mt-1 leading-[1.6]">
                              {standard.homeroomTeacherTitle}
                            </div>
                            {standard.showHomeroomTeacherName && effectiveHomeroomTeacherName ? (
                              <div className="font-moul text-[14px] text-[#1e3a8a] mt-9 leading-[1.5]">
                                {effectiveHomeroomTeacherName}
                              </div>
                            ) : (
                              <div className="h-11" />
                            )}
                          </div>
                        ) : (
                          <div className="text-center min-w-[250px]">
                            <div className="text-[14.5px] text-black font-medium leading-[1.6]">
                              {standard.locationAndDate}
                            </div>
                            <div className="font-moul text-[15px] text-[#1e3a8a] mt-1 leading-[1.6]">
                              {standard.directorTitle}
                            </div>
                            {standard.showDirectorName && standard.directorName ? (
                              <div className="font-moul text-[14px] text-[#1e3a8a] mt-9 leading-[1.5]">
                                {standard.directorName}
                              </div>
                            ) : (
                              <div className="h-11" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
