import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Clock,
  GraduationCap,
  X,
  Edit,
  Trash2,
  Check,
  Search,
  Filter,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';
import { Subject, Teacher } from '../types/index.ts';
import { storage } from '../services/storage.ts';

interface SubjectViewProps {
  subjects: Subject[];
  teachers: Teacher[];
  onRefresh: () => void;
}

export const SubjectView: React.FC<SubjectViewProps> = ({
  subjects,
  teachers,
  onRefresh,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [deletingSubject, setDeletingSubject] = useState<Subject | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string>('');

  // Add Subject Form state
  const [formData, setFormData] = useState({
    code: '',
    nameKm: '',
    nameEn: '',
    gradeLevel: 'ថ្នាក់ទី ៧',
    hoursPerWeek: 2,
    teacherName: '',
  });

  // Edit Subject Form state
  const [editFormData, setEditFormData] = useState({
    code: '',
    nameKm: '',
    nameEn: '',
    gradeLevel: 'ថ្នាក់ទី ៧',
    hoursPerWeek: 2,
    teacherName: '',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const openAddModal = () => {
    setFormData({
      code: `SUB-0${subjects.length + 1}`,
      nameKm: '',
      nameEn: '',
      gradeLevel: 'ថ្នាក់ទី ៧',
      hoursPerWeek: 2,
      teacherName: teachers[0]?.name || '',
    });
    setIsAddModalOpen(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nameKm.trim()) return;

    storage.addSubject({
      code: formData.code.trim() || `SUB-${Date.now()}`,
      nameKm: formData.nameKm.trim(),
      nameEn: formData.nameEn.trim(),
      gradeLevel: formData.gradeLevel,
      hoursPerWeek: Math.max(1, Math.min(20, Number(formData.hoursPerWeek) || 2)),
      teacherName: formData.teacherName.trim(),
    });

    setIsAddModalOpen(false);
    showToast(`បានបន្ថែមមុខវិជ្ជា «${formData.nameKm}» ដោយជោគជ័យ!`);
    onRefresh();
  };

  const openEditModal = (subject: Subject) => {
    setEditingSubject(subject);
    setEditFormData({
      code: subject.code,
      nameKm: subject.nameKm,
      nameEn: subject.nameEn,
      gradeLevel: subject.gradeLevel,
      hoursPerWeek: subject.hoursPerWeek,
      teacherName: subject.teacherName || '',
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject || !editFormData.nameKm.trim()) return;

    storage.updateSubject(editingSubject.id, {
      code: editFormData.code.trim(),
      nameKm: editFormData.nameKm.trim(),
      nameEn: editFormData.nameEn.trim(),
      gradeLevel: editFormData.gradeLevel,
      hoursPerWeek: Math.max(1, Math.min(20, Number(editFormData.hoursPerWeek) || 2)),
      teacherName: editFormData.teacherName.trim(),
    });

    setEditingSubject(null);
    showToast(`បានកែប្រែព័ត៌មានមុខវិជ្ជា «${editFormData.nameKm}» ដោយជោគជ័យ!`);
    onRefresh();
  };

  const handleDelete = () => {
    if (!deletingSubject) return;
    const name = deletingSubject.nameKm;
    storage.deleteSubject(deletingSubject.id);
    setDeletingSubject(null);
    showToast(`បានលុបមុខវិជ្ជា «${name}» រួចរាល់!`);
    onRefresh();
  };

  // Filter subjects
  const filteredSubjects = subjects.filter((s) => {
    const matchesGrade = selectedGrade === 'all' || s.gradeLevel === selectedGrade;
    const matchesSearch =
      searchQuery === '' ||
      s.nameKm.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.teacherName && s.teacherName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesGrade && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage('')}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-900" />
              <h2 className="text-xl font-bold font-moul text-slate-900">
                មុខវិជ្ជាសិក្សា (Subject & Curriculum Management)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              កម្មវិធីសិក្សាជាតិ សម្រាប់អនុវិទ្យាល័យ ហ៊ុន សែន ទួលសំបួរ · កំណត់គ្រូបង្រៀន និងម៉ោងបង្រៀន
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer w-fit"
          >
            <Plus className="w-4 h-4" />
            <span>បន្ថែមមុខវិជ្ជាថ្មី</span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-100">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ស្វែងរកតាមឈ្មោះមុខវិជ្ជា កូដ ឬឈ្មោះគ្រូ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
            />
          </div>

          <div>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:outline-hidden font-medium text-slate-800"
            >
              <option value="all">គ្រប់កម្រិតថ្នាក់ទាំងអស់ ({subjects.length})</option>
              <option value="ថ្នាក់ទី ៧">ថ្នាក់ទី ៧</option>
              <option value="ថ្នាក់ទី ៨">ថ្នាក់ទី ៨</option>
              <option value="ថ្នាក់ទី ៩">ថ្នាក់ទី ៩</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of subjects */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredSubjects.map((sbj) => (
          <div
            key={sbj.id}
            className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-blue-900/40 hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div>
              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                  {sbj.code}
                </span>
                <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                  {sbj.gradeLevel}
                </span>
              </div>

              {/* Subject Title */}
              <h3 className="text-sm font-bold text-slate-900 mt-2.5 group-hover:text-blue-900 transition-colors">
                {sbj.nameKm}
              </h3>
              <p className="text-[11px] text-slate-400 font-sans">{sbj.nameEn}</p>
            </div>

            {/* Info details */}
            <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>បន្ទុកម៉ោង:</span>
                </span>
                <span className="font-bold text-slate-900 bg-amber-50 text-amber-900 px-2 py-0.5 rounded-md border border-amber-200/50">
                  {sbj.hoursPerWeek} ម៉ោង/សប្ដាហ៍
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                  <span>គ្រូបង្រៀន:</span>
                </span>
                <span className="font-medium text-blue-950 truncate max-w-[130px]" title={sbj.teacherName}>
                  {sbj.teacherName || 'មិនទាន់ចាត់តាំង'}
                </span>
              </div>

              {/* Action Buttons: Edit Teacher & Hours, Delete Subject */}
              <div className="pt-2 flex items-center gap-1.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => openEditModal(sbj)}
                  className="flex-1 py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-lg font-semibold text-[11px] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>កែប្រែគ្រូ/ម៉ោង</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeletingSubject(sbj)}
                  className="py-1.5 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-semibold text-[11px] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  title="លុបមុខវិជ្ជា"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>លុប</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredSubjects.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-medium">រកមិនឃើញមុខវិជ្ជាដែលត្រូវគ្នានឹងការស្វែងរកទេ</p>
        </div>
      )}

      {/* Edit Subject Modal */}
      {editingSubject && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-900" />
                <h3 className="text-sm font-bold font-moul text-slate-900">
                  កែប្រែព័ត៌មានមុខវិជ្ជា
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingSubject(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  ឈ្មោះមុខវិជ្ជាជាភាសាខ្មែរ *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.nameKm}
                  onChange={(e) => setEditFormData({ ...editFormData, nameKm: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:outline-hidden font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    កូដមុខវិជ្ជា *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.code}
                    onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:outline-hidden font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    ឈ្មោះជាភាសាអង់គ្លេស
                  </label>
                  <input
                    type="text"
                    value={editFormData.nameEn}
                    onChange={(e) => setEditFormData({ ...editFormData, nameEn: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">កម្រិតថ្នាក់</label>
                  <select
                    value={editFormData.gradeLevel}
                    onChange={(e) => setEditFormData({ ...editFormData, gradeLevel: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:outline-hidden font-medium"
                  >
                    <option value="ថ្នាក់ទី ៧">ថ្នាក់ទី ៧</option>
                    <option value="ថ្នាក់ទី ៨">ថ្នាក់ទី ៨</option>
                    <option value="ថ្នាក់ទី ៩">ថ្នាក់ទី ៩</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    បន្ទុកម៉ោង (ម៉ោង/សប្ដាហ៍) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={editFormData.hoursPerWeek}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, hoursPerWeek: Number(e.target.value) })
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:outline-hidden font-bold"
                  />
                </div>
              </div>

              {/* Teacher Selector or Custom Input */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-slate-800 font-semibold">
                  គ្រូបង្រៀនទទួលបន្ទុក (ជ្រើសរើស ឬសរសេរឈ្មោះផ្ទាល់) *
                </label>

                <div className="space-y-2">
                  <select
                    value={teachers.some((t) => t.name === editFormData.teacherName) ? editFormData.teacherName : '__custom__'}
                    onChange={(e) => {
                      if (e.target.value !== '__custom__') {
                        setEditFormData({ ...editFormData, teacherName: e.target.value });
                      }
                    }}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                  >
                    <option value="__custom__">-- សរសេរឈ្មោះគ្រូបង្រៀនដោយផ្ទាល់ --</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name} ({t.subjects?.join(', ') || 'គ្រូបង្រៀន'})
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    required
                    placeholder="វាយបញ្ចូលឈ្មោះគ្រូបង្រៀន..."
                    value={editFormData.teacherName}
                    onChange={(e) => setEditFormData({ ...editFormData, teacherName: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingSubject(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>រក្សាទុកការកែប្រែ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold font-moul text-slate-900">បន្ថែមមុខវិជ្ជាថ្មី</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  ឈ្មោះមុខវិជ្ជាជាភាសាខ្មែរ *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ឧ. គណិតវិទ្យា, ភាសាខ្មែរ, ប្រវត្តិវិទ្យា..."
                  value={formData.nameKm}
                  onChange={(e) => setFormData({ ...formData, nameKm: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:outline-hidden font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    កូដមុខវិជ្ជា *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:outline-hidden font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    ឈ្មោះជាភាសាអង់គ្លេស
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mathematics"
                    value={formData.nameEn}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">កម្រិតថ្នាក់</label>
                  <select
                    value={formData.gradeLevel}
                    onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:outline-hidden font-medium"
                  >
                    <option value="ថ្នាក់ទី ៧">ថ្នាក់ទី ៧</option>
                    <option value="ថ្នាក់ទី ៨">ថ្នាក់ទី ៨</option>
                    <option value="ថ្នាក់ទី ៩">ថ្នាក់ទី ៩</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    បន្ទុកម៉ោង (ម៉ោង/សប្ដាហ៍) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={formData.hoursPerWeek}
                    onChange={(e) =>
                      setFormData({ ...formData, hoursPerWeek: Number(e.target.value) })
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:outline-hidden font-bold"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-slate-800 font-semibold">
                  គ្រូបង្រៀនទទួលបន្ទុក (ជ្រើសរើស ឬសរសេរឈ្មោះផ្ទាល់) *
                </label>

                <div className="space-y-2">
                  <select
                    value={teachers.some((t) => t.name === formData.teacherName) ? formData.teacherName : '__custom__'}
                    onChange={(e) => {
                      if (e.target.value !== '__custom__') {
                        setFormData({ ...formData, teacherName: e.target.value });
                      }
                    }}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                  >
                    <option value="__custom__">-- សរសេរឈ្មោះគ្រូបង្រៀនដោយផ្ទាល់ --</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name} ({t.subjects?.join(', ') || 'គ្រូបង្រៀន'})
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    required
                    placeholder="វាយបញ្ចូលឈ្មោះគ្រូបង្រៀន..."
                    value={formData.teacherName}
                    onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                  />
                </div>
              </div>

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
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>បន្ថែមមុខវិជ្ជា</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingSubject && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-moul text-slate-900">
                  បញ្ជាក់ការលុបមុខវិជ្ជា
                </h3>
                <p className="text-[11px] text-slate-400">សកម្មភាពនេះមិនអាចត្រឡប់ក្រោយបានទេ</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              តើលោកអ្នកពិតជាចង់លុបមុខវិជ្ជា <strong className="text-slate-900 font-bold">«{deletingSubject.nameKm} ({deletingSubject.code})»</strong> នេះមែនទេ? រាល់កាលវិភាគ និងពិន្ទុដែលពាក់ព័ន្ធនឹងមុខវិជ្ជានេះ នឹងត្រូវបានសម្អាតដោយស្វ័យប្រវត្តិ។
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingSubject(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                បោះបង់
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>យល់ព្រមលុប</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
