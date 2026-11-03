import React, { useState } from 'react';
import {
  Award,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Trash2,
  Calendar,
  Send,
  User,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldAlert,
  ThumbsUp,
  X,
  Printer,
} from 'lucide-react';
import { Student, SchoolClass, StudentBehaviorRecord, BehaviorType } from '../types/index.ts';
import { storage } from '../services/storage.ts';
import { sendTelegramAlert } from '../services/telegram.ts';
import { safeAvatar, DEFAULT_STUDENT_AVATAR } from '../utils/avatar.ts';
import { formatKhmerDate } from '../utils/calculations.ts';

interface BehaviorViewProps {
  students: Student[];
  classes: SchoolClass[];
  onRefresh: () => void;
}

export const BehaviorView: React.FC<BehaviorViewProps> = ({
  students,
  classes,
  onRefresh,
}) => {
  const [behaviorRecords, setBehaviorRecords] = useState<StudentBehaviorRecord[]>(() =>
    storage.getBehaviorRecords()
  );
  const [selectedType, setSelectedType] = useState<'all' | BehaviorType>('all');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');

  // Form State
  const [formStudentId, setFormStudentId] = useState<string>(students[0]?.id || '');
  const [formType, setFormType] = useState<BehaviorType>('merit');
  const [formCategory, setFormCategory] = useState<string>('សិស្សគំរូ & សិក្សាពូកែ');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formPoints, setFormPoints] = useState<number>(5);
  const [formActionTaken, setFormActionTaken] = useState<string>('ផ្ដល់ប័ណ្ណសរសើរ');
  const [formSendTelegram, setFormSendTelegram] = useState<boolean>(true);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleOpenAddModal = (type: BehaviorType = 'merit') => {
    setFormType(type);
    setFormCategory(type === 'merit' ? 'សិស្សគំរូ & សិក្សាពូកែ' : 'មកយឺតញឹកញាប់');
    setFormPoints(type === 'merit' ? 5 : -5);
    setFormActionTaken(type === 'merit' ? 'ផ្ដល់ប័ណ្ណសរសើរ' : 'ដាស់តឿនផ្ទាល់មាត់');
    setFormTitle('');
    setFormDescription('');
    setIsAddModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find((s) => s.id === formStudentId);
    if (!student) return;

    const studentClass = classes.find((c) => c.id === student.classId);

    const record = storage.addBehaviorRecord({
      studentId: student.id,
      studentName: student.khmerName,
      classId: student.classId,
      className: studentClass?.name || 'ថ្នាក់រៀន',
      type: formType,
      category: formCategory,
      title: formTitle.trim(),
      description: formDescription.trim(),
      points: formPoints,
      actionTaken: formActionTaken,
      recordedBy: 'រដ្ឋបាលសាលារួម',
      date: new Date().toISOString().split('T')[0],
      telegramSent: formSendTelegram,
    });

    // Send Telegram alert if checked
    if (formSendTelegram) {
      const typeKh = formType === 'merit' ? '⭐ ការលើកទឹកចិត្ត/សរសើរ' : '⚠️ កំណត់ត្រាវិន័យ/ដាស់តឿន';
      const msg = `📢 ${typeKh}\n\nសិស្សឈ្មោះ៖ ${student.khmerName} (${student.studentId})\nថ្នាក់៖ ${studentClass?.name || '-'}\nប្រធានបទ៖ ${formTitle}\nវិធានការ/កិត្តិយស៖ ${formActionTaken}\n\nអនុវិទ្យាល័យ ហ៊ុន សែន ទួលសំបួរ`;
      sendTelegramAlert(msg).catch(() => {});
    }

    setBehaviorRecords(storage.getBehaviorRecords());
    setIsAddModalOpen(false);
    showToast(
      formType === 'merit'
        ? `បានកត់ត្រាការលើកទឹកចិត្តសម្រាប់សិស្ស «${student.khmerName}» ដោយជោគជ័យ!`
        : `បានកត់ត្រាវិន័យសម្រាប់សិស្ស «${student.khmerName}» ដោយជោគជ័យ!`
    );
    onRefresh();
  };

  const handleDelete = (id: string) => {
    storage.deleteBehaviorRecord(id);
    setBehaviorRecords(storage.getBehaviorRecords());
    setDeleteConfirmId(null);
    showToast('បានលុបកំណត់ត្រាដោយជោគជ័យ!');
    onRefresh();
  };

  // Filtered records
  const filtered = behaviorRecords.filter((r) => {
    if (selectedType !== 'all' && r.type !== selectedType) return false;
    if (selectedClassId !== 'all' && r.classId !== selectedClassId) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      r.studentName.toLowerCase().includes(q) ||
      r.title.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q)
    );
  });

  const totalMerits = behaviorRecords.filter((r) => r.type === 'merit').length;
  const totalDisciplines = behaviorRecords.filter((r) => r.type === 'discipline').length;

  return (
    <div className="space-y-6 font-khmer">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-3 border border-emerald-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-white border border-emerald-200 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              ការលើកទឹកចិត្តសរុប (Merits)
            </div>
            <div className="text-2xl font-bold font-moul text-emerald-950 mt-1">
              {totalMerits} <span className="text-xs font-sans font-medium text-slate-500">លើក</span>
            </div>
            <div className="text-[10px] text-emerald-700 mt-0.5">
              សិស្សល្អ សិស្សគំរូ និងជួយសង្គម
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xl">
            ⭐
          </div>
        </div>

        <div className="bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-white border border-rose-200 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
              កំណត់ត្រាវិន័យ (Discipline)
            </div>
            <div className="text-2xl font-bold font-moul text-rose-950 mt-1">
              {totalDisciplines} <span className="text-xs font-sans font-medium text-slate-500">លើក</span>
            </div>
            <div className="text-[10px] text-rose-700 mt-0.5">
              ការដាស់តឿន និងកិច្ចសន្យាអប់រំ
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-xl">
            ⚠️
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-white border border-blue-200 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">
              ស្ថានភាពវិន័យសរុប
            </div>
            <div className="text-xl font-bold text-blue-950 mt-1">
              ល្អប្រសើរ ៩៨%
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              សិស្សអនុវត្តតាមបទបញ្ជាផ្ទៃក្នុងសាលា
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center font-bold text-xl">
            🏫
          </div>
        </div>
      </div>

      {/* Main Header & Actions Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg sm:text-xl font-bold font-moul text-slate-900">
                កត់ត្រាវិន័យ & ការលើកទឹកចិត្តសិស្ស
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              តាមដានការវិវត្តមារយាទ កិត្តិយស និងកិច្ចសន្យាអប់រំសិស្ស ព្រមទាំងជូនដំណឹងតាម Telegram
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleOpenAddModal('merit')}
              className="px-3.5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ThumbsUp className="w-4 h-4" />
              <span>+ លើកទឹកចិត្ត (Merit)</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenAddModal('discipline')}
              className="px-3.5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>+ កត់ត្រាវិន័យ (Discipline)</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Type selector pills */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setSelectedType('all')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedType === 'all' ? 'bg-white text-blue-950 shadow-xs' : 'text-slate-600'
                }`}
              >
                ទាំងអស់ ({behaviorRecords.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedType('merit')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedType === 'merit' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
                }`}
              >
                ⭐ លើកទឹកចិត្ត ({totalMerits})
              </button>
              <button
                type="button"
                onClick={() => setSelectedType('discipline')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedType === 'discipline' ? 'bg-white text-rose-800 shadow-xs' : 'text-slate-600'
                }`}
              >
                ⚠️ វិន័យ ({totalDisciplines})
              </button>
            </div>

            {/* Class filter */}
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
            >
              <option value="all">គ្រប់ថ្នាក់ទាំងអស់</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="ស្វែងរកតាមឈ្មោះ ឬប្រធានបទ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:outline-hidden font-medium"
            />
          </div>
        </div>
      </div>

      {/* Behavior Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900">
            បញ្ជីកំណត់ត្រាវិន័យ & ការលើកទឹកចិត្ត ({filtered.length} កំណត់ត្រា)
          </h3>
          <span className="text-[11px] text-slate-500 font-medium">
            ទិន្នន័យ Sync ទៅ Central Cloud Database
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            មិនទាន់មានកំណត់ត្រាស្របតាមការស្វែងរកនៅឡើយទេ
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-semibold text-slate-700 border-b border-slate-200">
                  <th className="py-3 px-3 text-center w-12">ល.រ</th>
                  <th className="py-3 px-3">កាលបរិច្ឆេទ</th>
                  <th className="py-3 px-3">សិស្ស / ថ្នាក់</th>
                  <th className="py-3 px-3">ប្រភេទ</th>
                  <th className="py-3 px-3">ប្រធានបទ & ការពិពណ៌នា</th>
                  <th className="py-3 px-3">ពិន្ទុ</th>
                  <th className="py-3 px-3">វិធានការ/កិត្តិយស</th>
                  <th className="py-3 px-3 text-right">សកម្មភាព</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r, idx) => {
                  const student = students.find((s) => s.id === r.studentId);
                  const isMerit = r.type === 'merit';

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600 text-[11px]">
                        {r.date}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={safeAvatar(student?.photo, DEFAULT_STUDENT_AVATAR)}
                            alt={r.studentName}
                            className="w-7 h-7 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <div className="font-bold text-slate-900">{r.studentName}</div>
                            <div className="text-[10px] text-blue-900 font-semibold">{r.className}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            isMerit
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          {isMerit ? '⭐ លើកទឹកចិត្ត' : '⚠️ វិន័យ'}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">{r.category}</div>
                      </td>
                      <td className="py-3 px-3 max-w-xs">
                        <div className="font-bold text-slate-900 truncate">{r.title}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">{r.description}</div>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold">
                        <span
                          className={
                            r.points > 0 ? 'text-emerald-600' : 'text-rose-600'
                          }
                        >
                          {r.points > 0 ? `+${r.points}` : r.points}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          {r.actionTaken || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(r.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="លុបកំណត់ត្រានេះ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add Behavior Record */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold ${
                    formType === 'merit' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {formType === 'merit' ? '⭐' : '⚠️'}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold font-moul text-slate-900">
                    {formType === 'merit' ? 'កត់ត្រាការលើកទឹកចិត្តសិស្ស' : 'កត់ត្រាវិន័យ & ការដាស់តឿន'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    ព័ត៌មាននឹងត្រូវរក្សាទុកក្នុងប្រវត្តិសិស្ស និងផ្ញើ Telegram
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">ជ្រើសរើសសិស្ស៖</label>
                <select
                  value={formStudentId}
                  onChange={(e) => setFormStudentId(e.target.value)}
                  className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.khmerName} ({classes.find((c) => c.id === s.classId)?.name || 'ថ្នាក់'}) - {s.studentId}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ប្រភេទសកម្មភាព៖</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                  >
                    {formType === 'merit' ? (
                      <>
                        <option value="សិស្សគំរូ & សិក្សាពូកែ">សិស្សគំរូ & សិក្សាពូកែ</option>
                        <option value="ជួយកិច្ចការសាលា & សង្គម">ជួយកិច្ចការសាលា & សង្គម</option>
                        <option value="អនាម័យ & សណ្ដាប់ធ្នាប់ល្អ">អនាម័យ & សណ្ដាប់ធ្នាប់ល្អ</option>
                        <option value="វិន័យ & វត្តមានល្អឥតខ្ចោះ">វិន័យ & វត្តមានល្អឥតខ្ចោះ</option>
                        <option value="កីឡា & សិល្បៈឆ្នើម">កីឡា & សិល្បៈឆ្នើម</option>
                      </>
                    ) : (
                      <>
                        <option value="មកយឺតញឹកញាប់">មកយឺតញឹកញាប់</option>
                        <option value="អវត្តមានឥតច្បាប់">អវត្តមានឥតច្បាប់</option>
                        <option value="មិនយកចិត្តទុកដាក់រៀន">មិនយកចិត្តទុកដាក់រៀន</option>
                        <option value="បំពានបទបញ្ជាផ្ទៃក្នុង">បំពានបទបញ្ជាផ្ទៃក្នុង</option>
                        <option value="បង្កជម្លោះក្នុងសាលា">បង្កជម្លោះក្នុងសាលា</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">ពិន្ទុមារយាទ៖</label>
                  <input
                    type="number"
                    value={formPoints}
                    onChange={(e) => setFormPoints(Number(e.target.value))}
                    className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl p-2 focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ចំណងជើងសង្ខេប៖</label>
                <input
                  type="text"
                  required
                  placeholder="ឧ. ជួយបង្រៀនមិត្ត ឬ មកយឺតលើសពី ៣ លើក..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ការពិពណ៌នាលម្អិត៖</label>
                <textarea
                  rows={2}
                  required
                  placeholder="ពិពណ៌នាអំពីទង្វើ ឬហេតុផល..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                ></textarea>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">វិធានការ / កិត្តិយសដែលបានផ្ដល់៖</label>
                <input
                  type="text"
                  value={formActionTaken}
                  onChange={(e) => setFormActionTaken(e.target.value)}
                  placeholder="ឧ. ផ្ដល់ប័ណ្ណសរសើរ / ធ្វើកិច្ចសន្យាអប់រំ / ដាស់តឿនផ្ទាល់មាត់"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                />
              </div>

              {/* Telegram Checkbox */}
              <label className="flex items-center gap-2 p-2 bg-blue-50/60 border border-blue-200 rounded-xl text-blue-950 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={formSendTelegram}
                  onChange={(e) => setFormSendTelegram(e.target.checked)}
                  className="rounded text-blue-900 focus:ring-blue-900"
                />
                <span className="flex items-center gap-1.5 text-xs">
                  <Send className="w-3.5 h-3.5 text-blue-800" />
                  <span>ផ្ញើសារជូនដំណឹងភ្លាមៗទៅ Telegram អាណាព្យាបាល & គ្រូ</span>
                </span>
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-colors cursor-pointer ${
                    formType === 'merit' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  រក្សាទុកកំណត់ត្រា
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-xs">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-moul text-slate-900">លុបកំណត់ត្រា</h3>
                <p className="text-[11px] text-slate-400">តើអ្នកពិតជាចង់លុបមែនទេ?</p>
              </div>
            </div>
            <p className="text-slate-600 mb-4">
              កំណត់ត្រានេះនឹងត្រូវដកចេញពីប្រព័ន្ធ និងប្រវត្តិមារយាទរបស់សិស្ស។
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                បោះបង់
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer"
              >
                យល់ព្រមលុប
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
