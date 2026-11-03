import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Printer,
  Download,
  X,
  CreditCard,
  Users,
  Check,
  CheckSquare,
  Square,
  Sparkles,
} from 'lucide-react';
import { Student, Teacher, SchoolClass } from '../types/index.ts';
import { SCHOOL_LOGO_URL } from '../utils/schoolLogo.ts';
import { safeAvatar, DEFAULT_STUDENT_AVATAR, DEFAULT_ADMIN_AVATAR } from '../utils/avatar.ts';
import { formatKhmerDate } from '../utils/calculations.ts';

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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [cardItems, setCardItems] = useState<CardItem[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'single'>('grid');

  if (!isOpen) return null;

  // Filter available items
  const availableItems: CardItem[] =
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
            type: 'student',
          }))
      : teachers.map((t) => ({
          id: t.id,
          code: t.teacherId,
          khmerName: t.name,
          latinName: t.email ? t.email.split('@')[0] : 'Teacher',
          gender: t.gender,
          dob: t.dob || '1988-01-01',
          roleOrClass: `គ្រូបង្រៀន (${t.subjects?.join(', ') || 'គរុកោសល្យ'})`,
          photo: safeAvatar(t.photo, DEFAULT_ADMIN_AVATAR),
          type: 'teacher',
        }));

  // Auto-select first 8 items when list changes
  useEffect(() => {
    setSelectedIds(availableItems.slice(0, 8).map((i) => i.id));
  }, [targetType, selectedClassId]);

  // Generate QR Codes for selected cards
  useEffect(() => {
    const selectedList = availableItems.filter((i) => selectedIds.includes(i.id));

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
            width: 140,
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
      setCardItems(itemsWithQr);
    });
  }, [selectedIds, targetType, selectedClassId]);

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
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-5xl w-full p-6 shadow-2xl border border-slate-100 max-h-[94vh] flex flex-col font-khmer">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 flex-shrink-0 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 font-moul leading-relaxed">
                បោះពុម្ពកាតសិស្ស & កាតបុគ្គលិក (ID Cards)
              </h2>
              <p className="text-xs text-slate-500">
                រចនាសម្ព័ន្ធកាតស្ដង់ដារ មានឡូហ្គោ ត្រា និង QR Code សម្រាប់ពាក់ និងស្កេនវត្តមាន
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={cardItems.length === 0}
              className="px-4 py-2 bg-blue-900 hover:bg-blue-800 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>បោះពុម្ព ({cardItems.length} កាត)</span>
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

        {/* Filter Controls Bar */}
        <div className="py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 no-print flex-shrink-0 text-xs">
          <div className="flex items-center gap-2">
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
                កាតសិស្ស
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
                កាតគ្រូបង្រៀន
              </button>
            </div>

            {targetType === 'student' && (
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-1.5 font-bold focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
              >
                <option value="all">គ្រប់ថ្នាក់ទាំងអស់</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={toggleSelectAll}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold text-slate-700 flex items-center gap-1 cursor-pointer"
            >
              {selectedIds.length === availableItems.length ? (
                <>
                  <CheckSquare className="w-3.5 h-3.5 text-blue-900" />
                  <span>ដោះការជ្រើស</span>
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5" />
                  <span>ជ្រើសទាំងអស់ ({availableItems.length})</span>
                </>
              )}
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-medium">
            បានជ្រើសរើស៖ <strong className="text-blue-900">{selectedIds.length}</strong> / {availableItems.length} នាក់
          </div>
        </div>

        {/* Card Cards Preview Grid Area */}
        <div className="flex-1 overflow-y-auto py-4 pr-1">
          {cardItems.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              សូមជ្រើសរើសសិស្ស ឬគ្រូដើម្បីបង្កើតកាត
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-items-center print-card-grid">
              {cardItems.map((item) => (
                <div
                  key={item.id}
                  className="w-[340px] h-[215px] bg-white rounded-2xl shadow-md border-2 border-slate-300 relative overflow-hidden flex flex-col justify-between print-card-item page-break-inside-avoid select-none"
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
                      <div className="text-[8px] text-slate-200 tracking-wider font-sans uppercase">
                        {item.type === 'student' ? 'Student Identity Card' : 'Staff Identity Card'}
                      </div>
                    </div>
                    <div className="text-[9px] font-mono font-bold bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded">
                      ២០២៥-២៦
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-3 flex gap-3 flex-1 items-center">
                    {/* Left: Photo Frame */}
                    <div className="flex flex-col items-center">
                      <div className="w-[78px] h-[98px] rounded-xl overflow-hidden border-2 border-amber-400 shadow-xs bg-slate-100 flex-shrink-0">
                        <img
                          src={item.photo}
                          alt={item.khmerName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="mt-1 font-mono text-[9px] font-bold text-blue-950 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                        {item.code}
                      </span>
                    </div>

                    {/* Middle: Student Details */}
                    <div className="flex-1 min-w-0 space-y-0.5 text-xs text-slate-800">
                      <div>
                        <div className="text-[9px] text-slate-400 leading-none">ឈ្មោះ / Name</div>
                        <div className="font-bold font-moul text-blue-950 text-[11px] truncate">
                          {item.khmerName}
                        </div>
                        <div className="text-[9px] font-mono text-slate-600 font-semibold truncate leading-none">
                          {item.latinName}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-1 pt-1 text-[10px]">
                        <div>
                          <span className="text-slate-400 text-[8px]">ភេទ:</span>{' '}
                          <span className="font-bold">{item.gender}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[8px]">ថ្ងៃកំណើត:</span>{' '}
                          <span className="font-mono font-bold text-[9px]">{item.dob}</span>
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

                    {/* Right: QR Code & Stamp */}
                    <div className="flex flex-col items-center justify-between h-full pt-1 flex-shrink-0">
                      {item.qrDataUrl ? (
                        <img
                          src={item.qrDataUrl}
                          alt="QR Code"
                          className="w-16 h-16 rounded-md border border-slate-200 p-0.5 bg-white shadow-2xs"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-slate-100 rounded-md animate-pulse"></div>
                      )}
                      <div className="text-center mt-1">
                        <div className="w-12 h-6 border-b border-rose-400 flex items-center justify-center">
                          <span className="text-[7px] text-rose-700 font-bold tracking-tighter">
                            [ត្រាសាលា]
                          </span>
                        </div>
                        <div className="text-[7px] text-slate-400 font-medium">នាយកសាលា</div>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Strip */}
                  <div className="bg-slate-100 border-t border-slate-200 px-3 py-1 flex items-center justify-between text-[8px] text-slate-500 font-medium">
                    <span>ឃុំទួលសំបួរ ស្រុកស្ទឹងត្រង់ ខេត្តកំពង់ចាម</span>
                    <span className="font-mono">VALID UNTIL: 07/2026</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between no-print flex-shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            💡 គន្លឹះ៖ ពេលចុចបោះពុម្ព សូមជ្រើសរើសទំហំក្រដាស <strong>A4</strong> និងកំណត់ <strong>Color (ពណ៌)</strong> ដើម្បីទទួលបានគុណភាពច្បាស់ល្អ។
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
    </div>
  );
};
