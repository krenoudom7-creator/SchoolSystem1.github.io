import React, { useState } from 'react';
import {
  GraduationCap,
  UserPlus,
  Search,
  Edit,
  Trash2,
  Eye,
  Phone,
  Mail,
  Calendar,
  BookOpen,
  MapPin,
  X,
  School,
} from 'lucide-react';
import { Teacher, SchoolClass, Gender, TeacherStatus } from '../types/index.ts';
import { storage } from '../services/storage.ts';
import { ImageUploader } from './ImageUploader.tsx';
import { safeAvatar, DEFAULT_TEACHER_AVATAR } from '../utils/avatar.ts';

interface TeacherViewProps {
  teachers: Teacher[];
  classes: SchoolClass[];
  onRefresh: () => void;
}

export const TeacherView: React.FC<TeacherViewProps> = ({
  teachers,
  classes,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [viewingTeacher, setViewingTeacher] = useState<Teacher | null>(null);

  const [formData, setFormData] = useState({
    teacherId: '',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    name: '',
    gender: 'ប្រុស' as Gender,
    dob: '1988-01-01',
    phone: '012 000 000',
    email: 'teacher@toulsambour.edu.kh',
    address: 'ស្រុកស្ទឹងត្រង់ ខេត្តកំពង់ចាម',
    subjects: ['គណិតវិទ្យា'],
    assignedClassId: 'cls-7a',
    joinDate: '2018-10-01',
    status: 'កំពុងបង្រៀន' as TeacherStatus,
    degree: 'បរិញ្ញាបត្រអប់រំ (NIE)',
  });

  const handleOpenAdd = () => {
    const nextNum = teachers.length + 1;
    setFormData({
      teacherId: `TCH-00${nextNum}`,
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      name: '',
      gender: 'ប្រុស',
      dob: '1988-05-10',
      phone: '012 333 444',
      email: `teacher${nextNum}@toulsambour.edu.kh`,
      address: 'ស្រុកស្ទឹងត្រង់ ខេត្តកំពង់ចាម',
      subjects: ['គណិតវិទ្យា'],
      assignedClassId: classes[0]?.id || 'cls-7a',
      joinDate: '2020-10-01',
      status: 'កំពុងបង្រៀន',
      degree: 'បរិញ្ញាបត្រអប់រំ',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (t: Teacher) => {
    setEditingTeacher(t);
    setFormData({
      teacherId: t.teacherId,
      photo: t.photo,
      name: t.name,
      gender: t.gender,
      dob: t.dob,
      phone: t.phone,
      email: t.email,
      address: t.address,
      subjects: t.subjects,
      assignedClassId: t.assignedClassId || '',
      joinDate: t.joinDate,
      status: t.status,
      degree: t.degree,
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.teacherId.trim()) return;

    if (editingTeacher) {
      storage.updateTeacher(editingTeacher.id, formData);
      setEditingTeacher(null);
    } else {
      storage.addTeacher(formData);
      setIsAddModalOpen(false);
    }
    onRefresh();
  };

  const handleDelete = (id: string) => {
    if (confirm('តើអ្នកពិតជាចង់លុបគ្រូបង្រៀននេះមែនទេ?')) {
      storage.deleteTeacher(id);
      onRefresh();
    }
  };

  const filtered = teachers.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      t.name.toLowerCase().includes(q) ||
      t.teacherId.toLowerCase().includes(q) ||
      t.subjects.some((s) => s.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-blue-900" />
              <h2 className="text-xl font-bold font-moul text-slate-900">
                ការគ្រប់គ្រងគ្រូបង្រៀន (Teacher Management)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              បញ្ជីគ្រូបង្រៀន មុខវិជ្ជាទទួលខុសត្រូវ ថ្នាក់ប្រចាំថ្នាក់ និងប្រវត្តិការងារ
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>បន្ថែមគ្រូថ្មី</span>
          </button>
        </div>

        {/* Search */}
        <div className="mt-4 pt-4 border-t border-slate-100 max-w-md">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="ស្វែងរកតាមឈ្មោះគ្រូ អត្តលេខ ឬមុខវិជ្ជា..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Teachers Grid or Empty State */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center shadow-xs">
          <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-800">មិនទាន់មានទិន្នន័យគ្រូបង្រៀននៅឡើយទេ</h4>
          <p className="text-xs text-slate-400 mt-1 mb-4">អ្នកអាចចាប់ផ្ដើមបង្កើត ឬបញ្ចូលព័ត៌មានលោកគ្រូ-អ្នកគ្រូថ្មីបានដោយចុចប៊ូតុងខាងក្រោម</p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-semibold text-xs inline-flex items-center gap-2 cursor-pointer shadow-sm transition-colors"
          >
            <UserPlus className="w-4 h-4 text-amber-400" />
            <span>បន្ថែមគ្រូបង្រៀនថ្មីដំបូង</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((t) => {
          const homeroom = classes.find((c) => c.id === t.assignedClassId);

          return (
            <div
              key={t.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-blue-900/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={safeAvatar(t.photo, DEFAULT_TEACHER_AVATAR)}
                      alt={t.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-slate-100 shadow-xs"
                    />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{t.name}</h3>
                      <div className="text-[10px] font-mono text-slate-400">{t.teacherId}</div>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800">
                        {t.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(t)}
                      className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-slate-50 cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-blue-900 flex-shrink-0" />
                    <span className="font-semibold text-slate-800">
                      {t.subjects.join(', ')}
                    </span>
                  </div>

                  {homeroom && (
                    <div className="flex items-center gap-2">
                      <School className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                      <span>
                        គ្រូប្រចាំថ្នាក់៖ <strong>{homeroom.name}</strong>
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="font-mono">{t.phone}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>ចូលបម្រើការងារ: {t.joinDate}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex justify-between items-center">
                <span>{t.degree}</span>
                <button
                  onClick={() => setViewingTeacher(t)}
                  className="text-blue-900 font-semibold hover:underline cursor-pointer"
                >
                  មើលលម្អិត
                </button>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {(isAddModalOpen || editingTeacher) && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold font-moul text-slate-900">
                {editingTeacher ? 'កែប្រែព័ត៌មានគ្រូ' : 'បន្ថែមគ្រូបង្រៀនថ្មី'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingTeacher(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 mt-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">អត្តលេខគ្រូ *</label>
                <input
                  type="text"
                  required
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden font-mono"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <ImageUploader
                  currentImage={formData.photo}
                  onImageChange={(img) => setFormData({ ...formData, photo: img })}
                  label="រូបថតគ្រូបង្រៀន (ផ្ទុកឡើងពីរូបថតក្នុងម៉ាស៊ីន ឬជ្រើសរូបគំរូ)"
                  type="teacher"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">ឈ្មោះគ្រូ *</label>
                <input
                  type="text"
                  required
                  placeholder="ឧទាហរណ៍៖ ចាន់ ណារិន"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">ភេទ</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                  >
                    <option value="ប្រុស">ប្រុស</option>
                    <option value="ស្រី">ស្រី</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">លេខទូរស័ព្ទ</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  មុខវិជ្ជាបង្រៀន (ក្បៀសបំបែក)
                </label>
                <input
                  type="text"
                  value={formData.subjects.join(', ')}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      subjects: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">ថ្នាក់ទទួលខុសត្រូវ (ប្រចាំថ្នាក់)</label>
                <select
                  value={formData.assignedClassId}
                  onChange={(e) => setFormData({ ...formData, assignedClassId: e.target.value })}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                >
                  <option value="">គ្មាន (បង្រៀនមុខវិជ្ជាទូទៅ)</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingTeacher(null);
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-xs cursor-pointer"
                >
                  {editingTeacher ? 'កែប្រែ' : 'រក្សាទុក'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Teacher Details Modal */}
      {viewingTeacher && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-blue-900">ប្រវត្តិរូបគ្រូបង្រៀន</span>
              <button
                onClick={() => setViewingTeacher(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 text-center">
              <img
                src={safeAvatar(viewingTeacher.photo, DEFAULT_TEACHER_AVATAR)}
                alt={viewingTeacher.name}
                className="w-20 h-20 rounded-full object-cover mx-auto border-2 border-blue-900"
              />
              <h3 className="text-base font-bold text-slate-900 mt-2">{viewingTeacher.name}</h3>
              <p className="text-xs text-slate-500 font-mono">{viewingTeacher.teacherId}</p>
            </div>
            <div className="mt-4 space-y-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-400">មុខវិជ្ជា៖</span>
                <span className="font-semibold text-blue-950">{viewingTeacher.subjects.join(', ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ទូរស័ព្ទ៖</span>
                <span className="font-mono">{viewingTeacher.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">អ៊ីមែល៖</span>
                <span>{viewingTeacher.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">សញ្ញាបត្រ៖</span>
                <span>{viewingTeacher.degree}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">អាសយដ្ឋាន៖</span>
                <span className="text-right">{viewingTeacher.address}</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewingTeacher(null)}
                className="px-4 py-2 text-xs font-semibold bg-blue-900 text-white rounded-xl hover:bg-blue-800 cursor-pointer"
              >
                បិទ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
