import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import {
  Printer,
  X,
  CreditCard,
  CheckSquare,
  Square,
  Search,
  UserCheck,
  FlipHorizontal,
} from 'lucide-react';
import { Student, Teacher, SchoolClass } from '../types/index.ts';
import { SCHOOL_LOGO_URL } from '../utils/schoolLogo.ts';
import { safeAvatar, DEFAULT_STUDENT_AVATAR, DEFAULT_ADMIN_AVATAR } from '../utils/avatar.ts';

interface IdCardGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  teachers: Teacher[];
  classes: SchoolClass[];
}

interface CardItem {
  id: string;
  code: string;
  khmerName: string;
  latinName: string;
  gender: string;
  dob: string;
  roleOrClass: string;
  photo: string;
  parentPhone?: string;
  address?: string;
  type: 'student' | 'teacher';
  qrDataUrl?: string;
}

export const IdCardGeneratorModal: React.FC<IdCardGeneratorModalProps> = ({
  isOpen,
  onClose,
  students,
  teachers,
  classes,
}) => {
  const [targetType, setTargetType] = useState<'student' | 'teacher'>('student');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [cardItems, setCardItems] = useState<CardItem[]>([]);
  const [showBackSide, setShowBackSide] = useState<boolean>(false);

  // Manage body print class so only the ID cards print on A4 paper
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

  // Filter available items
  const availableItems: CardItem[] = useMemo(() => {
    const baseList: CardItem[] =
      targetType === 'student'
        ? students
            .filter((s) => selectedClassId === 'all' || s.classId === selectedClassId)
            .map((s) => ({
              id: s.id,
              code: s.studentId,
              khmerName: s.khmerName,
              latinName: s.latinName || 'Student',
              gender: s.gender,
              dob: s.dob,
              roleOrClass: classes.find((c) => c.id === s.classId)?.name || 'ថ្នាក់រៀន',
              photo: safeAvatar(s.photo, DEFAULT_STUDENT_AVATAR),
              parentPhone: s.parentPhone,
              address: s.address,
              type: 'student' as const,
            }))
        : teachers.map((t) => ({
            id: t.id,
            code: t.teacherId,
            khmerName: t.name,
            latinName: t.email ? t.email.split('@')[0].toUpperCase() : 'TEACHER',
            gender: t.gender,
            dob: t.dob || '1988-01-01',
            roleOrClass: `គ្រូបង្រៀន (${t.subjects?.join(', ') || 'គរុកោសល្យ'})`,
            photo: safeAvatar(t.photo, DEFAULT_ADMIN_AVATAR),
            parentPhone: t.phone,
            type: 'teacher' as const,
          }));

    if (!searchQuery.trim()) return baseList;
    const q = searchQuery.toLowerCase().trim();
    return baseList.filter(
      (item) =>
        item.khmerName.toLowerCase().includes(q) ||
        item.latinName.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.roleOrClass.toLowerCase().includes(q)
    );
  }, [targetType, selectedClassId, searchQuery, students, teachers, classes]);

  // Auto-select items when modal opens or filter changes
  useEffect(() => {
    if (!isOpen) return;
    setSelectedIds(availableItems.slice(0, 10).map((i) => i.id));
  }, [isOpen, targetType, selectedClassId]);

  // Generate QR Codes for selected cards
  useEffect(() => {
    if (!isOpen) return;
    const selectedList = availableItems.filter((i) => selectedIds.includes(i.id));

    let isCancelled = false;
    Promise.all(
      selectedList.map(async (item) => {
        try {
          const qrPayload = JSON.stringify({
            school: 'Toulsambour',
            code: item.code,
            name: item.khmerName,
            type: item.type,
          });
          const qrDataUrl = await QRCode.toDataURL(qrPayload, {
            width: 150,
            margin: 1,
            color: {
              dark: '#0f172a',
              light: '#ffffff',
            },
          });
          return { ...item, qrDataUrl };
        } catch {
          return item;
        }
      })
    ).then((itemsWithQr) => {
      if (!isCancelled) {
        setCardItems(itemsWithQr);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [isOpen, selectedIds, availableItems]);

  const toggleSelectAll = () => {
    if (selectedIds.length === availableItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(availableItems.map((i) => i.id));
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handlePrint = () => {
    document.body.classList.add('modal-print-active');
    setTimeout(() => {
      window.print();
    }, 50);
  };

  if (!isOpen) return null;

  return (
    <div
      id="official-print-modal-overlay"
      className="fixed inset-0 bg-slate-900/75 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-xs animate-in fade-in print:static print:bg-white print:p-0"
    >
      <div
        id="official-print-modal-card"
        className="bg-white rounded-3xl max-w-6xl w-full p-5 sm:p-6 shadow-2xl border border-slate-100 max-h-[94vh] flex flex-col font-khmer print:max-h-none print:shadow-none print:border-none print:p-0 print:max-w-none"
      >
        {/* Modal Header (Hidden when printing) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-100 flex-shrink-0 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 font-moul leading-relaxed">
                បោះពុម្ពកាតសិស្ស & កាតបុគ្គលិក (ID Cards)
              </h2>
              <p className="text-xs text-slate-500">
                រចនាសម្ព័ន្ធកាតស្ដង់ដារ មានឡូហ្គោ ត្រា និង QR Code សម្រាប់ពាក់ និងស្កេនវត្តមាន (បោះពុម្ពលើក្រដាស A4)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowBackSide(!showBackSide)}
              className={`px-3 py-2 font-bold text-xs rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                showBackSide
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <FlipHorizontal className="w-4 h-4 text-amber-600" />
              <span>{showBackSide ? 'រួមបញ្ចូលផ្នែកខាងក្រោយកាត' : 'តែផ្នែកខាងមុខកាត'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={cardItems.length === 0}
              className="px-4 py-2 bg-blue-900 hover:bg-blue-800 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>បោះពុម្ព A4 ({cardItems.length} កាត)</span>
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

        {/* Filter & Student Selection Controls Bar (Hidden when printing) */}
        <div className="py-3 space-y-2.5 border-b border-slate-100 no-print flex-shrink-0 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setTargetType('student')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    targetType === 'student'
                      ? 'bg-white text-blue-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  កាតសិស្ស ({students.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('teacher')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    targetType === 'teacher'
                      ? 'bg-white text-blue-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  កាតគ្រូបង្រៀន ({teachers.length})
                </button>
              </div>

              {targetType === 'student' && (
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                >
                  <option value="all">គ្រប់ថ្នាក់ទាំងអស់</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}

              {/* Search box */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ស្វែងរកឈ្មោះ ឬអត្តលេខ..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:outline-hidden w-48"
                />
              </div>

              <button
                type="button"
                onClick={toggleSelectAll}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold text-slate-700 flex items-center gap-1 cursor-pointer"
              >
                {selectedIds.length === availableItems.length && availableItems.length > 0 ? (
                  <>
                    <CheckSquare className="w-3.5 h-3.5 text-blue-900" />
                    <span>ដោះការជ្រើសទាំងអស់</span>
                  </>
                ) : (
                  <>
                    <Square className="w-3.5 h-3.5" />
                    <span>ជ្រើសទាំងអស់ ({availableItems.length})</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-[11px] text-slate-600 font-semibold bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
              បានជ្រើសរើសបោះពុម្ព៖ <strong className="text-blue-900">{selectedIds.length}</strong> / {availableItems.length} នាក់
            </div>
          </div>

          {/* Quick selectable chips for individual students/teachers */}
          {availableItems.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 max-h-16">
              {availableItems.map((person) => {
                const isChecked = selectedIds.includes(person.id);
                return (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => toggleSelectItem(person.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1.5 flex-shrink-0 border transition-all cursor-pointer ${
                      isChecked
                        ? 'bg-blue-900 text-white border-blue-900 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <UserCheck className={`w-3 h-3 ${isChecked ? 'text-amber-300' : 'text-slate-400'}`} />
                    <span>{person.khmerName}</span>
                    <span className={`font-english text-[10px] ${isChecked ? 'text-blue-200' : 'text-slate-400'}`}>
                      ({person.code})
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Printable ID Cards Area */}
        <div
          id="official-print-sheet"
          className="flex-1 overflow-y-auto py-4 pr-1 print:overflow-visible print:py-0"
        >
          {cardItems.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs no-print">
              សូមជ្រើសរើសសិស្ស ឬគ្រូយ៉ាងហោចណាស់ម្នាក់ដើម្បីបង្កើត និងបោះពុម្ពកាត
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 justify-items-center print-card-grid">
              {cardItems.map((item) => (
                <React.Fragment key={item.id}>
                  {/* FRONT OF ID CARD */}
                  <div
                    className="w-[340px] h-[215px] bg-white rounded-2xl shadow-md border-2 border-slate-300 relative overflow-hidden flex flex-col justify-between print-card-item select-none"
                    style={{
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                    }}
                  >
                    {/* Decorative Header Band */}
                    <div className="bg-gradient-to-r from-blue-950 via-indigo-900 to-blue-900 text-white px-3 py-1.5 flex items-center gap-2 border-b-2 border-amber-400">
                      <img
                        src={SCHOOL_LOGO_URL}
                        alt="Logo"
                        className="w-8 h-8 rounded-full bg-white p-0.5 object-cover scale-[1.38] flex-shrink-0 border border-amber-400 shadow-xs"
                      />
                      <div className="min-w-0 flex-1 leading-tight">
                        <div className="font-moul text-[10px] text-amber-300 font-bold truncate">
                          អនុវិទ្យាល័យ ហ៊ុន សែន ទួលសំបួរ
                        </div>
                        <div className="text-[8px] text-slate-200 tracking-wider font-english uppercase font-bold">
                          {item.type === 'student' ? 'STUDENT IDENTITY CARD' : 'STAFF IDENTITY CARD'}
                        </div>
                      </div>
                      <div className="text-[9px] font-bold bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded">
                        ២០២៥-២៦
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="px-3 py-2 flex gap-2.5 flex-1 items-center">
                      {/* Left: Photo Frame */}
                      <div className="flex flex-col items-center">
                        <div className="w-[74px] h-[94px] rounded-xl overflow-hidden border-2 border-amber-400 shadow-xs bg-slate-100 flex-shrink-0">
                          <img
                            src={item.photo}
                            alt={item.khmerName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="mt-1 font-english text-[9px] font-bold text-blue-950 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                          ID: {item.code}
                        </span>
                      </div>

                      {/* Middle: Student Details */}
                      <div className="flex-1 min-w-0 space-y-0.5 text-xs text-slate-800">
                        <div>
                          <div className="text-[8px] text-slate-400 leading-none">គោត្តនាម-នាម / Full Name</div>
                          <div className="font-bold font-moul text-blue-950 text-[11px] truncate mt-0.5">
                            {item.khmerName}
                          </div>
                          <div className="text-[10px] font-english text-slate-700 font-bold uppercase truncate leading-tight">
                            {item.latinName}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-1 pt-0.5 text-[10px]">
                          <div>
                            <span className="text-slate-400 text-[8px]">ភេទ:</span>{' '}
                            <span className="font-bold">{item.gender}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[8px]">ថ្ងៃកំណើត:</span>{' '}
                            <span className="font-english font-bold text-[9px]">{item.dob}</span>
                          </div>
                        </div>

                        <div className="pt-0.5">
                          <span className="text-slate-400 text-[8px]">
                            {item.type === 'student' ? 'ថ្នាក់រៀន:' : 'មុខងារ:'}
                          </span>{' '}
                          <span className="font-bold text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] border border-amber-200">
                            {item.roleOrClass}
                          </span>
                        </div>
                      </div>

                      {/* Right: QR Code & Official Stamp */}
                      <div className="flex flex-col items-center justify-between h-full py-0.5 flex-shrink-0">
                        {item.qrDataUrl ? (
                          <img
                            src={item.qrDataUrl}
                            alt="QR Code"
                            className="w-16 h-16 rounded-md border border-slate-200 p-0.5 bg-white shadow-2xs"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-slate-100 rounded-md animate-pulse"></div>
                        )}
                        <div className="text-center">
                          <div className="w-14 h-5 border-b border-rose-400 flex items-center justify-center">
                            <span className="text-[7px] text-rose-700 font-bold tracking-tighter">
                              [ត្រា និងហត្ថលេខា]
                            </span>
                          </div>
                          <div className="text-[7px] text-slate-500 font-bold mt-0.5">នាយកសាលា</div>
                        </div>
                      </div>
                    </div>

                    {/* Card Bottom Strip */}
                    <div className="bg-slate-100 border-t border-slate-200 px-3 py-1 flex items-center justify-between text-[8px] text-slate-600 font-semibold">
                      <span>ឃុំទួលសំបួរ ស្រុកស្ទឹងត្រង់ ខេត្តកំពង់ចាម</span>
                      <span className="font-english font-bold">VALID: 2025-2026</span>
                    </div>
                  </div>

                  {/* OPTIONAL BACK SIDE OF ID CARD */}
                  {showBackSide && (
                    <div
                      className="w-[340px] h-[215px] bg-white rounded-2xl shadow-md border-2 border-slate-300 relative overflow-hidden flex flex-col justify-between print-card-item select-none"
                      style={{
                        background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                      }}
                    >
                      <div className="bg-blue-950 text-amber-300 px-3 py-1.5 text-center font-moul text-[9px] border-b-2 border-amber-400">
                        បទបញ្ជាផ្ទៃក្នុង និងព័ត៌មានទំនាក់ទំនងបន្ទាន់
                      </div>

                      <div className="px-3.5 py-2 flex-1 flex flex-col justify-between text-[9px] text-slate-700">
                        <ul className="list-disc pl-3.5 space-y-0.5 leading-snug">
                          <li>ត្រូវពាក់បណ្ណសម្គាល់ខ្លួននេះជារៀងរាល់ថ្ងៃពេលមកសាលារៀន។</li>
                          <li>បណ្ណនេះប្រើសម្រាប់ស្កេន QR Code កត់ត្រាវត្តមានប្រចាំថ្ងៃ។</li>
                          <li>ហាមប្រគល់បណ្ណនេះឱ្យអ្នកដទៃប្រើប្រាស់ជំនួសជាដាច់ខាត។</li>
                        </ul>

                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 space-y-0.5 text-[9px]">
                          <div>
                            <span className="text-slate-400">លេខទូរស័ព្ទអាណាព្យាបាល/ទំនាក់ទំនង៖ </span>
                            <strong className="font-english text-blue-950">
                              {item.parentPhone || '012 345 678'}
                            </strong>
                          </div>
                          <div className="truncate">
                            <span className="text-slate-400">អាសយដ្ឋាន៖ </span>
                            <strong className="text-slate-800">
                              {item.address || 'ឃុំទួលសំបួរ ស្រុកស្ទឹងត្រង់ ខេត្តកំពង់ចាម'}
                            </strong>
                          </div>
                        </div>

                        <div className="text-center text-[8px] text-slate-500 italic">
                          ប្រសិនបើរើសបានបណ្ណនេះ សូមមេត្តាយកមកប្រគល់ជូនការិយាល័យ អនុវិទ្យាល័យ ហ៊ុន សែន ទួលសំបួរ។
                        </div>
                      </div>

                      <div className="bg-blue-950 text-white px-3 py-1 flex items-center justify-between text-[8px]">
                        <span>អនុវិទ្យាល័យ ហ៊ុន សែន ទួលសំបួរ</span>
                        <span className="font-english text-amber-300 font-bold">ID: {item.code}</span>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer (Hidden when printing) */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between no-print flex-shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            💡 គន្លឹះ៖ ពេលចុច <strong>បោះពុម្ព A4</strong> ប្រព័ន្ធនឹងលាក់ផ្ទាំងកម្មវិធីទាំងអស់ ហើយរៀបកាតជា ២ ជួរឈរលើក្រដាស A4 ដោយស្វ័យប្រវត្តិ។
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
          >
            បិទផ្ទាំង
          </button>
        </div>
      </div>
    </div>
  );
};
