import React, { useState } from 'react';
import {
  CalendarDays,
  Printer,
  Plus,
  Clock,
  School,
  GraduationCap,
  X,
  Filter,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  User,
  BookOpen,
  Sparkles,
  MapPin,
  Calendar,
} from 'lucide-react';
import { TimetableSlot, SchoolClass, Teacher, Subject } from '../types/index.ts';
import { storage } from '../services/storage.ts';
import { safeAvatar, DEFAULT_TEACHER_AVATAR } from '../utils/avatar.ts';
import { toKhmerNum } from '../utils/calculations.ts';
import { SCHOOL_LOGO_URL } from '../utils/schoolLogo.ts';

interface TimetableViewProps {
  classes: SchoolClass[];
  teachers: Teacher[];
  subjects: Subject[];
  onRefresh?: () => void;
}

type DayOfWeek = 'ច័ន្ទ' | 'អង្គារ' | 'ពុធ' | 'ព្រហស្បតិ៍' | 'សុក្រ' | 'សៅរ៍';

export const TimetableView: React.FC<TimetableViewProps> = ({
  classes,
  teachers,
  subjects,
  onRefresh,
}) => {
  const [filterMode, setFilterMode] = useState<'teacher' | 'class'>('teacher');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    teachers[0]?.id || ''
  );
  const [selectedClassId, setSelectedClassId] = useState<string>(
    classes[0]?.id || 'cls-7a'
  );

  // Modal State for adding/editing slot
  const [isSlotModalOpen, setIsSlotModalOpen] = useState<boolean>(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [deleteConfirmSlot, setDeleteConfirmSlot] = useState<TimetableSlot | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');

  // Form State
  const [formTeacherId, setFormTeacherId] = useState<string>(teachers[0]?.id || '');
  const [formClassId, setFormClassId] = useState<string>(classes[0]?.id || '');
  const [formSubjectId, setFormSubjectId] = useState<string>(subjects[0]?.id || '');
  const [formDayOfWeek, setFormDayOfWeek] = useState<DayOfWeek>('ច័ន្ទ');
  const [formPeriod, setFormPeriod] = useState<number>(1);
  const [formRoom, setFormRoom] = useState<string>('បន្ទប់ ១០១');
  const [conflictWarning, setConflictWarning] = useState<string>('');

  const days: DayOfWeek[] = ['ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'];

  const periods = [
    { num: 1, time: '០៧:០០ - ០៧:៥០', defaultStart: '07:00', defaultEnd: '07:50' },
    { num: 2, time: '០៧:៥៥ - ០៨:៤៥', defaultStart: '07:55', defaultEnd: '08:45' },
    { num: 3, time: '០៩:០០ - ០៩:៥០', defaultStart: '09:00', defaultEnd: '09:50' },
    { num: 4, time: '០៩:៥៥ - ១០:៤៥', defaultStart: '09:55', defaultEnd: '10:45' },
    { num: 5, time: '១៣:៣០ - ១៤:២០', defaultStart: '13:30', defaultEnd: '14:20' },
    { num: 6, time: '១៤:២៥ - ១៥:១៥', defaultStart: '14:25', defaultEnd: '15:15' },
  ];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Current active teacher and class
  const activeTeacher = teachers.find((t) => t.id === selectedTeacherId) || teachers[0];
  const activeClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  // Retrieve filtered slots
  const allSlots = storage.getTimetable();
  const currentSlots = storage.getTimetable(
    filterMode === 'class' ? selectedClassId : undefined,
    filterMode === 'teacher' && selectedTeacherId ? selectedTeacherId : undefined
  );

  // Calculate total weekly hours for current view
  const weeklyHours = currentSlots.length;

  // Open modal to add new slot (can prefill day and period)
  const handleOpenAddSlot = (day?: DayOfWeek, period?: number) => {
    setEditingSlotId(null);
    setFormDayOfWeek(day || 'ច័ន្ទ');
    setFormPeriod(period || 1);

    if (filterMode === 'teacher' && activeTeacher) {
      setFormTeacherId(activeTeacher.id);
      // Auto-pick first subject matching teacher's specialty
      const matchedSubject = subjects.find((s) =>
        activeTeacher.subjects.some((subName) => s.nameKm.includes(subName) || subName.includes(s.nameKm))
      );
      setFormSubjectId(matchedSubject?.id || subjects[0]?.id || '');
      setFormClassId(selectedClassId || classes[0]?.id || '');
      const cls = classes.find((c) => c.id === selectedClassId) || classes[0];
      setFormRoom(cls?.roomNumber || 'បន្ទប់ ១០១');
    } else {
      setFormClassId(selectedClassId || classes[0]?.id || '');
      const cls = classes.find((c) => c.id === selectedClassId) || classes[0];
      setFormRoom(cls?.roomNumber || 'បន្ទប់ ១០១');
      setFormTeacherId(teachers[0]?.id || '');
      setFormSubjectId(subjects[0]?.id || '');
    }

    setConflictWarning('');
    setIsSlotModalOpen(true);
  };

  // Open modal to edit existing slot
  const handleOpenEditSlot = (slot: TimetableSlot) => {
    setEditingSlotId(slot.id);
    setFormTeacherId(slot.teacherId);
    setFormClassId(slot.classId);
    setFormSubjectId(slot.subjectId);
    setFormDayOfWeek(slot.dayOfWeek);
    setFormPeriod(slot.period);
    setFormRoom(slot.room);
    setConflictWarning('');
    setIsSlotModalOpen(true);
  };

  // Check conflicts in real-time as user changes teacher, day, or period
  const handleTeacherOrTimeChange = (tId: string, day: DayOfWeek, p: number) => {
    const conflict = storage.checkTimetableConflict(tId, day, p, editingSlotId || undefined);
    if (conflict.hasConflict) {
      setConflictWarning(conflict.message || 'មានការជាន់ម៉ោងបង្រៀនរបស់គ្រូ!');
    } else {
      setConflictWarning('');
    }
  };

  // Save slot
  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedTeacher = teachers.find((t) => t.id === formTeacherId);
    const selectedSubj = subjects.find((s) => s.id === formSubjectId);
    const selectedCls = classes.find((c) => c.id === formClassId);
    const periodObj = periods.find((p) => p.num === formPeriod) || periods[0];

    const slotPayload = {
      id: editingSlotId || undefined,
      classId: formClassId,
      dayOfWeek: formDayOfWeek,
      period: formPeriod,
      startTime: periodObj.defaultStart,
      endTime: periodObj.defaultEnd,
      subjectId: formSubjectId,
      subjectName: selectedSubj?.nameKm || 'មុខវិជ្ជា',
      teacherId: formTeacherId,
      teacherName: selectedTeacher?.name || 'គ្រូបង្រៀន',
      room: formRoom || selectedCls?.roomNumber || 'បន្ទប់ ១០១',
    };

    storage.saveTimetableSlot(slotPayload);
    setIsSlotModalOpen(false);
    showToast(
      editingSlotId
        ? `បានកែប្រែកាលវិភាគមុខវិជ្ជា «${slotPayload.subjectName}» ដោយជោគជ័យ!`
        : `បានបន្ថែមកាលវិភាគបង្រៀនមុខវិជ្ជា «${slotPayload.subjectName}» សម្រាប់ ${slotPayload.teacherName} ដោយជោគជ័យ!`
    );
    if (onRefresh) onRefresh();
  };

  // Delete slot
  const handleDeleteSlot = () => {
    if (deleteConfirmSlot) {
      storage.deleteTimetableSlot(deleteConfirmSlot.id);
      setDeleteConfirmSlot(null);
      showToast('បានលុបម៉ោងបង្រៀនចេញពីកាលវិភាគដោយជោគជ័យ!');
      if (onRefresh) onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-emerald-700 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header & Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs no-print print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-blue-900" />
              <h2 className="text-xl font-bold font-moul text-slate-900">
                ការគ្រប់គ្រងកាលវិភាគសិក្សា & ការបង្រៀន (Timetable Management)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              លោកគ្រូអ្នកគ្រូអាចកំណត់ បង្កើត និងកែប្រែកាលវិភាគបង្រៀនផ្ទាល់ខ្លួនសម្រាប់គ្រូម្នាក់ៗ ឬតាមថ្នាក់រៀន
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 no-print">
            <button
              type="button"
              onClick={() => handleOpenAddSlot()}
              className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-100" />
              <span>បន្ថែមកាលវិភាគថ្មី</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 text-xs font-semibold bg-blue-900 hover:bg-blue-800 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>បោះពុម្ពកាលវិភាគ</span>
            </button>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-5 pt-4 border-t border-slate-100 no-print">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit">
            <button
              type="button"
              onClick={() => setFilterMode('teacher')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                filterMode === 'teacher'
                  ? 'bg-white text-blue-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-blue-900" />
              <span>កាលវិភាគតាមគ្រូបង្រៀនម្នាក់ៗ</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('class')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                filterMode === 'class'
                  ? 'bg-white text-blue-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <School className="w-4 h-4 text-blue-900" />
              <span>កាលវិភាគតាមថ្នាក់រៀន</span>
            </button>
          </div>

          {/* Quick Selection Dropdowns */}
          {filterMode === 'teacher' ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">ជ្រើសរើសគ្រូបង្រៀន៖</span>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.subjects.join(', ')})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">ជ្រើសរើសថ្នាក់រៀន៖</span>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.roomNumber})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Individual Teacher Profile Banner (when in Teacher Mode) */}
      {filterMode === 'teacher' && activeTeacher && (
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 no-print print:hidden">
          <div className="flex items-center gap-4">
            <img
              src={safeAvatar(activeTeacher.photo, DEFAULT_TEACHER_AVATAR)}
              alt={activeTeacher.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shadow-md flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = DEFAULT_TEACHER_AVATAR;
              }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-moul text-base text-amber-300 font-bold">
                  {activeTeacher.name}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950">
                  {activeTeacher.teacherId}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 flex items-center gap-2">
                <span>មុខវិជ្ជាទទួលបន្ទុក៖ <strong>{activeTeacher.subjects.join(', ')}</strong></span>
                {activeTeacher.assignedClassId && (
                  <>
                    <span>·</span>
                    <span>គ្រូប្រចាំថ្នាក់៖ <strong>{classes.find((c) => c.id === activeTeacher.assignedClassId)?.name}</strong></span>
                  </>
                )}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {activeTeacher.degree} · ទូរស័ព្ទ៖ {activeTeacher.phone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 self-start md:self-auto">
            <Clock className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
              <div className="text-[10px] text-slate-300 uppercase tracking-wider">បន្ទុកបង្រៀនសរុប</div>
              <div className="text-sm font-bold text-white">
                {toKhmerNum(weeklyHours)} ម៉ោង / សប្ដាហ៍
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Class Banner (when in Class Mode) */}
      {filterMode === 'class' && activeClass && (
        <div className="bg-gradient-to-r from-slate-900 to-blue-900 text-white rounded-2xl p-4 shadow-sm border border-slate-800 flex items-center justify-between no-print print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-moul text-sm text-amber-300">
                {activeClass.name}
              </h3>
              <p className="text-xs text-slate-300">
                បន្ទប់សិក្សា៖ {activeClass.roomNumber} · កម្រិត៖ {activeClass.gradeLevel}
              </p>
            </div>
          </div>

          <div className="text-xs bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
            សរុបម៉ោងរៀន៖ <strong className="text-amber-400">{toKhmerNum(weeklyHours)} ម៉ោង/សប្ដាហ៍</strong>
          </div>
        </div>
      )}

      {/* Timetable Interactive Weekly Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 overflow-hidden print:border-none print:shadow-none print:p-0 print:rounded-none print:overflow-visible">
        {/* Printable Official Header (Shown during print) */}
        <div className="hidden print:block pb-3 border-b-2 border-slate-900 mb-3">
          <div className="grid grid-cols-3 items-center gap-2">
            <div className="text-left space-y-0.5">
              <div className="font-moul text-[11px] text-slate-900 font-bold leading-[1.8]">
                ក្រសួងអប់រំ យុវជន និងកីឡា
              </div>
              <div className="text-[11px] text-slate-800">
                មន្ទីរអប់រំ យុវជន និងកីឡា ខេត្តកំពង់ចាម
              </div>
              <div className="text-[11px] text-slate-800">
                ការិយាល័យអប់រំ ស្រុកស្ទឹងត្រង់
              </div>
              <div className="font-moul text-[11px] text-blue-950 font-bold leading-[1.8]">
                អនុវិទ្យាល័យ ហ៊ុន សែន ទួលសំបួរ
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="w-16 h-16 aspect-square shrink-0 rounded-full p-0.5 bg-white border-2 border-amber-500 overflow-hidden flex items-center justify-center">
                <img
                  src={SCHOOL_LOGO_URL}
                  alt="Logo អនុវិទ្យាល័យ ហ៊ុន សែន ទួលសំបួរ"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
            </div>

            <div className="text-center space-y-0.5 flex flex-col items-center justify-center">
              <div className="font-moul text-[11px] text-slate-900 font-bold leading-[1.8]">
                ព្រះរាជាណាចក្រកម្ពុជា
              </div>
              <div className="font-moul text-[11px] text-slate-900 font-bold leading-[1.8]">
                ជាតិ សាសនា ព្រះមហាក្សត្រ
              </div>
              <div className="text-xs text-amber-600 font-serif tracking-widest">❖ ❖ ❖</div>
            </div>
          </div>

          <div className="text-center mt-2">
            <h2 className="font-moul text-sm font-bold text-slate-900 leading-[1.9]">
              {filterMode === 'teacher'
                ? `កាលវិភាគបង្រៀនប្រចាំសប្ដាហ៍របស់៖ ${activeTeacher?.name || ''}`
                : `កាលវិភាគសិក្សាប្រចាំសប្ដាហ៍របស់៖ ${activeClass?.name || ''}`}
            </h2>
            <p className="text-[11px] text-slate-700 mt-0.5 font-medium">
              ឆ្នាំសិក្សា ២០២៥-២០២៦ · បន្ទុកម៉ោងបង្រៀនសរុប {toKhmerNum(weeklyHours)} ម៉ោង/សប្ដាហ៍
            </p>
          </div>
        </div>

        {/* Timetable Grid Table */}
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full border-collapse border border-slate-200 print:border-slate-800 text-center print:table-fixed">
            <thead>
              <tr className="bg-slate-100 text-xs font-bold text-slate-800">
                <th className="border border-slate-200 print:border-slate-800 p-3 print:p-1.5 w-32 print:w-[13%] bg-slate-200/70 print:bg-slate-100">
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-900 print:hidden" />
                    <span className="print:text-[10px]">ម៉ោងសិក្សា</span>
                  </div>
                </th>
                {days.map((day) => (
                  <th
                    key={day}
                    className="border border-slate-200 print:border-slate-800 p-3 print:p-1.5 min-w-[140px] print:min-w-0 print:w-[14.5%] print:bg-slate-100"
                  >
                    <div className="text-blue-950 font-bold print:text-[11px]">{day}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map((p) => (
                <tr key={p.num} className="hover:bg-slate-50/50">
                  {/* Period Time Header */}
                  <td className="border border-slate-200 print:border-slate-800 p-2.5 print:p-1.5 bg-slate-50/80 print:bg-slate-50">
                    <div className="font-bold text-xs print:text-[10px] text-slate-900">
                      ម៉ោងទី {toKhmerNum(p.num)}
                    </div>
                    <div className="text-[10px] print:text-[9px] text-slate-500 print:text-slate-700 font-sans mt-0.5">
                      {p.time}
                    </div>
                  </td>

                  {/* Days columns */}
                  {days.map((day) => {
                    const slot = currentSlots.find(
                      (s) => s.dayOfWeek === day && s.period === p.num
                    );

                    const targetClass = slot ? classes.find((c) => c.id === slot.classId) : null;

                    return (
                      <td
                        key={day}
                        className="border border-slate-200 print:border-slate-800 p-2 print:p-1 h-24 print:h-auto align-top relative group transition-colors hover:bg-blue-50/30"
                      >
                        {slot ? (
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50/70 print:bg-none print:bg-white border border-blue-200 print:border-slate-300 rounded-xl print:rounded-md p-2.5 print:p-1 text-left h-full flex flex-col justify-between shadow-2xs print:shadow-none group/card relative">
                            <div>
                              <div className="font-bold text-xs print:text-[10px] text-blue-950 leading-tight">
                                {slot.subjectName}
                              </div>

                              {/* In teacher mode: show class name; in class mode: show teacher name */}
                              {filterMode === 'teacher' ? (
                                <div className="text-[10px] print:text-[9px] text-slate-600 print:text-slate-800 font-medium flex items-center gap-1 mt-1 print:mt-0.5">
                                  <School className="w-3 h-3 text-slate-500 flex-shrink-0 print:hidden" />
                                  <span className="truncate font-semibold">{targetClass?.name || 'ថ្នាក់រៀន'}</span>
                                </div>
                              ) : (
                                <div className="text-[10px] print:text-[9px] text-slate-600 print:text-slate-800 font-medium flex items-center gap-1 mt-1 print:mt-0.5">
                                  <GraduationCap className="w-3 h-3 text-slate-500 flex-shrink-0 print:hidden" />
                                  <span className="truncate font-semibold">{slot.teacherName}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between text-[9px] print:text-[8.5px] text-slate-500 print:text-slate-700 pt-1 print:pt-0.5 border-t border-blue-100/80 print:border-slate-200 mt-1 print:mt-0.5">
                              <span className="flex items-center gap-0.5 font-sans">
                                <MapPin className="w-2.5 h-2.5 text-blue-700 print:hidden" />
                                {slot.room}
                              </span>

                              {/* Hover Edit & Delete Actions (hidden on print) */}
                              <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity no-print print:hidden">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditSlot(slot)}
                                  title="កែប្រែ"
                                  className="p-1 text-slate-500 hover:text-blue-900 hover:bg-white rounded-md cursor-pointer transition-colors"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmSlot(slot)}
                                  title="លុបម៉ោងនេះ"
                                  className="p-1 text-slate-500 hover:text-rose-600 hover:bg-white rounded-md cursor-pointer transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => handleOpenAddSlot(day, p.num)}
                              className="w-full h-full min-h-[60px] rounded-xl border border-dashed border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 text-slate-300 hover:text-emerald-700 text-[11px] font-semibold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer no-print print:hidden group/empty"
                            >
                              <Plus className="w-3.5 h-3.5 group-hover/empty:scale-125 transition-transform" />
                              <span className="text-[9px]">បន្ថែម</span>
                            </button>
                            <span className="hidden print:inline text-slate-300 italic text-xs">—</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Official Signatures for Printing */}
        <div className="hidden print:grid grid-cols-2 text-center pt-5 mt-4 text-xs text-slate-900 signature-block">
          <div className="space-y-1">
            <div className="font-semibold text-slate-800">បានឃើញ និងអនុម័ត</div>
            <div className="font-moul text-xs font-bold text-blue-950 mt-1 leading-[1.8]">
              នាយកសាលា អនុវិទ្យាល័យទួលសំបួរ
            </div>
            <div className="h-14" />
            <div className="font-moul text-xs font-bold text-slate-900 leading-[1.8]">
              លាង បេន
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-slate-700">
              ទួលសំបួរ, ថ្ងៃ................... ខែ............. ឆ្នាំ ២០២៦
            </div>
            <div className="font-moul text-xs font-bold text-slate-900 mt-1 leading-[1.8]">
              {filterMode === 'teacher' ? 'ហត្ថលេខាគ្រូបង្រៀន' : 'ហត្ថលេខាគ្រូប្រចាំថ្នាក់'}
            </div>
            <div className="h-14" />
            <div className="font-bold text-slate-900">
              {filterMode === 'teacher' ? activeTeacher?.name : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Timetable Slot Modal */}
      {isSlotModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 my-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-moul text-sm text-slate-900 font-bold">
                    {editingSlotId ? 'កែប្រែកាលវិភាគបង្រៀន' : 'បង្កើតកាលវិភាគបង្រៀនថ្មី'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    កំណត់ម៉ោងបង្រៀន គ្រូទទួលបន្ទុក និងថ្នាក់រៀន
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSlotModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="space-y-4 mt-5">
              {/* Conflict Alert Warning */}
              {conflictWarning && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>{conflictWarning}</span>
                </div>
              )}

              {/* Teacher Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  គ្រូបង្រៀន (Teacher) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formTeacherId}
                  onChange={(e) => {
                    const newId = e.target.value;
                    setFormTeacherId(newId);
                    handleTeacherOrTimeChange(newId, formDayOfWeek, formPeriod);
                  }}
                  required
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.teacherId}) - {t.subjects.join(', ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  មុខវិជ្ជា (Subject) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formSubjectId}
                  onChange={(e) => setFormSubjectId(e.target.value)}
                  required
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nameKm} ({s.nameEn})
                    </option>
                  ))}
                </select>
              </div>

              {/* Class & Room Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    ថ្នាក់រៀន (Class) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formClassId}
                    onChange={(e) => {
                      const newClsId = e.target.value;
                      setFormClassId(newClsId);
                      const target = classes.find((c) => c.id === newClsId);
                      if (target) setFormRoom(target.roomNumber);
                    }}
                    required
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.roomNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    បន្ទប់រៀន / ទីតាំង (Room)
                  </label>
                  <input
                    type="text"
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    placeholder="ឧ. បន្ទប់ ១០១, បន្ទប់កុំព្យូទ័រ..."
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Day & Period Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    ថ្ងៃនៃសប្ដាហ៍ (Day) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formDayOfWeek}
                    onChange={(e) => {
                      const newDay = e.target.value as DayOfWeek;
                      setFormDayOfWeek(newDay);
                      handleTeacherOrTimeChange(formTeacherId, newDay, formPeriod);
                    }}
                    required
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                  >
                    {days.map((d) => (
                      <option key={d} value={d}>
                        ថ្ងៃ {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    ម៉ោងសិក្សា (Period) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formPeriod}
                    onChange={(e) => {
                      const newP = parseInt(e.target.value, 10);
                      setFormPeriod(newP);
                      handleTeacherOrTimeChange(formTeacherId, formDayOfWeek, newP);
                    }}
                    required
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                  >
                    {periods.map((p) => (
                      <option key={p.num} value={p.num}>
                        ម៉ោងទី {toKhmerNum(p.num)} ({p.time})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSlotModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-xs cursor-pointer transition-colors"
                >
                  {editingSlotId ? 'រក្សាទុកការកែប្រែ' : 'បង្កើតកាលវិភាគ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Slot Confirmation Modal */}
      {deleteConfirmSlot && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 text-center">
              តើអ្នកប្រាកដជាចង់លុបម៉ោងនេះមែនទេ?
            </h3>
            <p className="text-xs text-slate-500 text-center mt-1">
              ម៉ោងបង្រៀនមុខវិជ្ជា <strong className="text-slate-800">{deleteConfirmSlot.subjectName}</strong> ថ្ងៃ{deleteConfirmSlot.dayOfWeek} ម៉ោងទី {toKhmerNum(deleteConfirmSlot.period)} នឹងត្រូវលុបចេញពីកាលវិភាគ។
            </p>

            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmSlot(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                បោះបង់
              </button>
              <button
                type="button"
                onClick={handleDeleteSlot}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs cursor-pointer"
              >
                បាទ/ចាស លុប
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
