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
 * to match the official Cambodian school certificate style.
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
  frameColorStyle: 'classic_blue' | 'royal_gold' | 'crimson_red' | 'emerald_green';
  departmentName: string;
  provinceOrDistrict: string;
  schoolName: string;
  presenterTitle: string;
  certificateNumber: string;
  academicYear: string;
  achievementText: string;
  locationAndDate: string;
  directorTitle: string;
  directorName: string;
  showDirectorName: boolean;
  showStudentPhotoInBox: boolean;
  customLogoUrl: string;
}

const STORAGE_KEY = 'toulsambour_certificate_standard_v3';

const DEFAULT_STANDARD: SchoolCertificateStandard = {
  frameColorStyle: 'classic_blue',
  departmentName: 'មន្ទីរអប់រំ យុវជន និងកីឡា',
  provinceOrDistrict: 'ខេត្តកំពង់ចាម',
  schoolName: 'អនុវិទ្យាល័យ ហ៊ុន សែន ទួលសំបួរ',
  presenterTitle: 'នាយក អនុវិទ្យាល័យ ហ៊ុន សែន ទួលសំបួរ',
  certificateNumber: '..........................',
  academicYear: '២០២៥ - ២០២៦',
  achievementText: 'ដែលបានទទួលលទ្ធផលល្អ ក្នុងការសិក្សា ហើយត្រូវបានជាប់ចំណាត់ថ្នាក់លេខ',
  locationAndDate: 'ទួលសំបួរ ថ្ងៃទី០៣ ខែវិច្ឆិកា ឆ្នាំ២០២៦',
  directorTitle: 'នាយក',
  directorName: 'លាង បេន',
  showDirectorName: false,
  showStudentPhotoInBox: false,
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

  // CSS filter for the traditional Khmer floral border image if user wants alternate school colors
  const getFrameFilter = () => {
    switch (standard.frameColorStyle) {
      case 'royal_gold':
        return 'hue-rotate(175deg) saturate(1.6) brightness(0.95)';
      case 'crimson_red':
        return 'hue-rotate(130deg) saturate(1.4)';
      case 'emerald_green':
        return 'hue-rotate(270deg) saturate(1.2)';
      case 'classic_blue':
      default:
        return 'none';
    }
  };

  const formattedClassName = formatClassForCertificate(currentClass?.name);

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
        className="bg-slate-100 rounded-3xl max-w-7xl w-full shadow-2xl border border-slate-200 overflow-hidden my-2 sm:my-4"
      >
        {/* Top Control Bar (Hidden on Print) */}
        <div className="bg-white border-b border-slate-200 p-4 sm:px-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 no-print print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-800 to-blue-950 text-amber-300 flex items-center justify-center shadow-sm shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-moul text-slate-900">
                ប័ណ្ណសរសើរផ្លូវការតាមគម្រូស្តង់ដារសាលា (Official Honor Certificate)
              </h2>
              <p className="text-xs text-slate-500">
                ប្រើប្រាស់ឡូហ្គោសាលាផ្លូវការ និងតម្រឹមប្រអប់រូបថត ៤×៦ ព្រមទាំងកន្លែងហត្ថលេខាឱ្យសមាមាត្រក្នុងស៊ុមក្បាច់ភ្ញីទេស
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Toggle for 4x6 Photo Box */}
            <button
              type="button"
              onClick={() =>
                updateStandard({ showStudentPhotoInBox: !standard.showStudentPhotoInBox })
              }
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                standard.showStudentPhotoInBox
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>
                {standard.showStudentPhotoInBox
                  ? 'កំពុងបង្ហាញរូបថតសិស្សក្នុងប្រអប់ ៤×៦'
                  : 'ប្រអប់ ៤×៦ ទទេ (សម្រាប់បិទរូបថតផ្ទាល់)'}
              </span>
            </button>

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
                  onClick={() => logoInputRef.current?.click()}
                  className="px-3 py-1.5 bg-white hover:bg-amber-100 text-slate-800 border border-amber-300 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-900" />
                  <span>ប្តូរឡូហ្គោសាលាថ្មី (សម្រាប់សាលាផ្សេង)</span>
                </button>
                {standard.customLogoUrl && (
                  <button
                    type="button"
                    onClick={() => updateStandard({ customLogoUrl: '' })}
                    className="px-2.5 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    ប្រើឡូហ្គោសាលាដើមវិញ
                  </button>
                )}
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
                { id: 'classic_blue', label: '១. ក្បាច់ភ្ញីទេសពណ៌ខៀវ (គម្រូដើម)' },
                { id: 'royal_gold', label: '២. ក្បាច់ភ្ញីទេសពណ៌មាស' },
                { id: 'crimson_red', label: '៣. ក្បាច់ភ្ញីទេសពណ៌ក្រហម' },
                { id: 'emerald_green', label: '៤. ក្បាច់ភ្ញីទេសពណ៌បៃតង' },
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
                      ? 'bg-white border-blue-800 ring-2 ring-blue-500/30 text-blue-950'
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
                  មន្ទីរអប់រំ (ជួរទី១ ខាងឆ្វេង)
                </label>
                <input
                  type="text"
                  value={standard.departmentName}
                  onChange={(e) => updateStandard({ departmentName: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  ខេត្ត / ស្រុក (ជួរទី២ ខាងឆ្វេង)
                </label>
                <input
                  type="text"
                  value={standard.provinceOrDistrict}
                  onChange={(e) => updateStandard({ provinceOrDistrict: e.target.value })}
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
                      presenterTitle: `នាយក ${e.target.value}`,
                    })
                  }
                  className="w-full bg-white border border-blue-400 rounded-xl px-3 py-2 font-bold text-blue-950"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  ចំណងជើងអ្នកផ្តល់ប័ណ្ណ (ក្រោមពាក្យ ប័ណ្ណសរសើរ)
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
                  លេខប័ណ្ណសរសើរ (លេខ ៖ ...)
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
                  តួនាទី និងឈ្មោះនាយកសាលា
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={standard.directorTitle}
                    onChange={(e) => updateStandard({ directorTitle: e.target.value })}
                    className="w-24 bg-white border border-slate-300 rounded-xl px-2.5 py-2 font-bold text-slate-900"
                    placeholder="នាយក"
                  />
                  <input
                    type="text"
                    value={standard.directorName}
                    onChange={(e) => updateStandard({ directorName: e.target.value })}
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-2.5 py-2 font-bold text-slate-900"
                    placeholder="ឈ្មោះនាយក"
                  />
                </div>
                <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer text-[11px] font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={standard.showDirectorName}
                    onChange={(e) => updateStandard({ showDirectorName: e.target.checked })}
                  />
                  <UserCheck className="w-3.5 h-3.5 text-blue-800" />
                  <span>បង្ហាញឈ្មោះនាយកខាងក្រោមហត្ថលេខា</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Filter & Student Selection Bar (Hidden on Print) */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 sm:px-6 space-y-3 no-print print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Class Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-600">ថ្នាក់៖</span>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="text-xs bg-white border border-slate-300 rounded-xl px-3 py-1.5 font-bold text-slate-900"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.roomNumber})
                    </option>
                  ))}
                </select>
              </div>

              {/* Exam Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-600">សម័យប្រឡង៖</span>
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="text-xs bg-white border border-slate-300 rounded-xl px-3 py-1.5 font-bold text-slate-900"
                >
                  {exams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.title} ({ex.semester})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Rank Filter Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => selectTopN(1)}
                  className="px-2.5 py-1.5 text-[11px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-lg border border-amber-300 cursor-pointer transition-colors"
                >
                  🥇 លេខ ១
                </button>
                <button
                  type="button"
                  onClick={() => selectTopN(3)}
                  className="px-2.5 py-1.5 text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg border border-amber-200 cursor-pointer transition-colors"
                >
                  🏆 លេខ ១ ដល់ ៣
                </button>
                <button
                  type="button"
                  onClick={() => selectTopN(5)}
                  className="px-2.5 py-1.5 text-[11px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-lg border border-blue-200 cursor-pointer transition-colors"
                >
                  🎖️ លេខ ១ ដល់ ៥
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStudentIds(rankedList.map((r) => r.studentId))}
                  className="px-2.5 py-1.5 text-[11px] font-semibold bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 cursor-pointer transition-colors"
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
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-900"
              />
            </div>
          </div>

          {/* Student Selector Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {filteredList.map((item) => {
              const isSelected = selectedStudentIds.includes(item.studentId);
              return (
                <button
                  key={item.studentId}
                  type="button"
                  onClick={() => toggleStudent(item.studentId)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0 border transition-all cursor-pointer ${
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
          className="p-4 sm:p-8 space-y-8 overflow-x-auto print:p-0 print:space-y-0"
        >
          {selectedCertificates.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 no-print">
              <Award className="w-12 h-12 text-amber-400 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-800">
                សូមជ្រើសរើសសិស្សយ៉ាងហោចណាស់ ១ នាក់ខាងលើ ដើម្បីបង្កើតប័ណ្ណសរសើរ
              </p>
            </div>
          ) : (
            selectedCertificates.map((cert) => (
              <div
                key={cert.studentId}
                className="certificate-print-page mx-auto bg-white shadow-xl print:shadow-none relative overflow-hidden w-[1080px] h-[763px] select-none"
              >
                {/* 1. AUTHENTIC KHMER FLORAL BORDER FRAME FROM SAMPLE IMAGE */}
                <img
                  src="/assets/aistudio/image_a13de6ed.png"
                  alt="Khmer Certificate Frame"
                  className="absolute inset-0 w-full h-full object-fill pointer-events-none"
                  style={{ filter: getFrameFilter() }}
                />

                {/* 2. SURGICAL WHITE INNER CANVAS (Strictly inside the inner blue frame line: top 18.2% to bottom 12.2%) */}
                <div
                  className="absolute bg-white overflow-hidden"
                  style={{
                    top: '18.2%',
                    bottom: '12.2%',
                    left: '15.65%',
                    right: '15.25%',
                  }}
                >
                  {/* 3. CENTER FADED SCHOOL LOGO WATERMARK (Uses our School Logo instead of Ministry Logo) */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <img
                      src={activeSchoolLogo}
                      alt="School Watermark"
                      className="w-[290px] h-[290px] object-contain rounded-full opacity-[0.15]"
                    />
                  </div>

                  {/* 4. CERTIFICATE CONTENT LAYER (Strictly budgeted to 530px inner height so nothing touches the frame) */}
                  <div className="relative z-10 w-full h-full flex flex-col justify-between px-6 pt-1 pb-3 text-slate-950 box-border">
                    {/* TOP SECTION: Kingdom Motto (Center), School Info (Left), School Logo (Right) */}
                    <div className="relative w-full">
                      {/* Center Top: Kingdom of Cambodia */}
                      <div className="text-center space-y-0.5">
                        <div className="font-moul text-[15px] text-black tracking-wide leading-[1.6]">
                          ព្រះរាជាណាចក្រកម្ពុជា
                        </div>
                        <div className="font-moul text-[14px] text-black tracking-wide leading-[1.6]">
                          ជាតិ សាសនា ព្រះមហាក្សត្រ
                        </div>
                        {/* Ornamental Divider under Motto */}
                        <div className="flex items-center justify-center pt-0.5">
                          <svg
                            width="110"
                            height="12"
                            viewBox="0 0 120 14"
                            className="text-black fill-current"
                          >
                            <path
                              d="M4 7 Q14 2, 24 7 T44 7 L52 7 M68 7 L76 7 Q86 2, 96 7 T116 7"
                              stroke="currentColor"
                              strokeWidth="1.6"
                              fill="none"
                            />
                            <polygon points="60,1 65,7 60,13 55,7" fill="currentColor" />
                            <circle cx="49" cy="7" r="2" fill="currentColor" />
                            <circle cx="71" cy="7" r="2" fill="currentColor" />
                          </svg>
                        </div>
                      </div>

                      {/* Left Top: Department, Province/District, School Name, Number & Right Top: School Logo */}
                      <div className="flex items-start justify-between -mt-2">
                        <div className="text-left space-y-1">
                          <div className="font-moul text-[12.5px] text-black leading-[1.65]">
                            {standard.departmentName}
                          </div>
                          <div className="font-moul text-[12.5px] text-black leading-[1.65]">
                            {standard.provinceOrDistrict}
                          </div>
                          <div className="font-moul text-[12.5px] text-black leading-[1.65]">
                            {standard.schoolName}
                          </div>
                          <div className="text-[12.5px] text-black leading-[1.65]">
                            <span className="font-moul">លេខ ៖ </span>
                            <span className="font-serif tracking-widest">
                              {standard.certificateNumber}
                            </span>
                          </div>
                        </div>

                        {/* Right Top: Official School Logo */}
                        <div className="pr-3 -mt-1">
                          <div className="w-[88px] h-[88px] rounded-full p-1 bg-white border-2 border-amber-500 shadow-2xs flex items-center justify-center overflow-hidden">
                            <img
                              src={activeSchoolLogo}
                              alt={standard.schoolName}
                              className="w-full h-full object-contain rounded-full"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* MIDDLE SECTION: Main Red "ប័ណ្ណសរសើរ" Heading, Presenter Title, and 2-Line Citation Text */}
                    <div className="text-center -mt-3">
                      {/* Large Red 3D Outlined Khmer Moul Title */}
                      <h1
                        className="font-moul text-[40px] leading-[1.45] tracking-normal select-none"
                        style={{
                          color: '#d90000',
                          WebkitTextStroke: '1.4px #111111',
                          textShadow: '2px 2.5px 0px rgba(0, 0, 0, 0.85)',
                        }}
                      >
                        ប័ណ្ណសរសើរ
                      </h1>

                      {/* Presenter Line: នាយក អនុវិទ្យាល័យ ... */}
                      <div className="font-moul text-[17px] text-black mt-0.5 leading-[1.65]">
                        {standard.presenterTitle}
                      </div>

                      {/* 2-Line Citation Paragraph cleanly formatted so it never wraps onto a 3rd line */}
                      <div className="mt-2 text-left px-3 text-[15.5px] text-black leading-[2.0] font-medium">
                        <div className="indent-10 whitespace-nowrap overflow-hidden text-ellipsis">
                          <span>សូមសរសើរសិស្សឈ្មោះ </span>
                          <span className="font-moul text-[17.5px] text-[#0033a0] mx-1.5">
                            {cert.khmerName}
                          </span>
                          <span> ភេទ{cert.gender} ជាសិស្សរៀននៅ </span>
                          <strong className="font-bold text-black mx-0.5">
                            {formattedClassName}
                          </strong>
                          <span> ដែលបានទទួលលទ្ធផលល្អ</span>
                        </div>
                        <div className="whitespace-nowrap">
                          <span>ក្នុងការសិក្សា ហើយត្រូវបានជាប់ចំណាត់ថ្នាក់លេខ </span>
                          <span
                            className="font-moul text-[18.5px] mx-1.5"
                            style={{
                              color: '#e00000',
                              WebkitTextStroke: '0.7px #111111',
                            }}
                          >
                            {toKhmerNum(cert.rank)}
                          </span>
                          <span> ក្នុងឆ្នាំសិក្សា {standard.academicYear} ។</span>
                        </div>
                      </div>
                    </div>

                    {/* BOTTOM SECTION: Centered 4x6 Photo Frame & Bottom-Right Date + Director Signature Space */}
                    <div className="relative w-full h-[126px] flex items-start justify-center">
                      {/* Center 4x6 Photo Box (រូបថតថ្មី ទំហំ ៤×៦) — Fits 100% inside the white area above the blue frame */}
                      <div className="w-[88px] h-[118px] border-[1.5px] border-black flex flex-col items-center justify-center text-center bg-white/70 overflow-hidden shadow-2xs">
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
                          <div className="space-y-2.5 text-[13px] text-black font-semibold">
                            <div>រូបថតថ្មី</div>
                            <div>ទំហំ ៤×៦</div>
                          </div>
                        )}
                      </div>

                      {/* Bottom Right: Location/Date, Director Title, and Clean Signature Space inside the frame */}
                      <div className="absolute right-4 top-0 text-center min-w-[240px]">
                        <div className="text-[14.5px] text-black font-medium leading-[1.6]">
                          {standard.locationAndDate}
                        </div>
                        <div className="font-moul text-[15px] text-black mt-1.5 leading-[1.6]">
                          {standard.directorTitle}
                        </div>
                        {standard.showDirectorName ? (
                          <div className="font-moul text-[13.5px] text-black mt-11 leading-[1.6]">
                            {standard.directorName}
                          </div>
                        ) : (
                          <div className="h-14" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
