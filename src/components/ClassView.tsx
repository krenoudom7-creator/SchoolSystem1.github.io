import React, { useState } from 'react';
import {
  School,
  Plus,
  Users,
  GraduationCap,
  MapPin,
  X,
  Layers,
  Trash2,
  AlertCircle,
  Edit,
  Check,
} from 'lucide-react';
import { SchoolClass, Teacher, EducationLevelType } from '../types/index.ts';
import { storage } from '../services/storage.ts';
import { safeAvatar, DEFAULT_TEACHER_AVATAR } from '../utils/avatar.ts';

interface ClassViewProps {
  classes: SchoolClass[];
  teachers: Teacher[];
  onRefresh: () => void;
}

export const ClassView: React.FC<ClassViewProps> = ({
  classes,
  teachers,
  onRefresh,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  const [deleteConfirmClass, setDeleteConfirmClass] = useState<SchoolClass | null>(null);
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('all');

  // Teacher input mode: 'select' (ជ្រើសរើសពីបញ្ជី) or 'custom' (សរសេរឈ្មោះដោយផ្ទាល់)
  const [teacherInputMode, setTeacherInputMode] = useState<'select' | 'custom'>('select');

  const [formData, setFormData] = useState({
    name: 'ថ្នាក់ទី ៧ គ',
    gradeLevel: 'ថ្នាក់ទី ៧',
    educationLevel: 'secondary' as EducationLevelType,
    academicYearId: 'ay-2025-2026',
    homeroomTeacherId: teachers[0]?.id || '',
    homeroomTeacherName: teachers[0]?.name || '',
    roomNumber: 'បន្ទប់ ១០៣',
    maxCapacity: 40,
  });

  const educationLevels: { type: EducationLevelType; label: string; desc: string }[] = [
    { type: 'kindergarten', label: 'កម្រិតមត្តេយ្យ', desc: 'មត្តេយ្យសិក្សា' },
    { type: 'primary', label: 'កម្រិតបឋមសិក្សា', desc: 'ថ្នាក់ទី ១ ដល់ទី ៦' },
    { type: 'secondary', label: 'កម្រិតអនុវិទ្យាល័យ', desc: 'ថ្នាក់ទី ៧ ដល់ទី ៩ (អនុវិទ្យាល័យទួលសំបួរ)' },
    { type: 'high_school', label: 'កម្រិតវិទ្យាល័យ', desc: 'ថ្នាក់ទី ១០ ដល់ទី ១២' },
    { type: 'university', label: 'កម្រិតឧត្តមសិក្សា', desc: 'ឆ្នាំទី ១ ដល់ទី ៤' },
  ];

  const handleOpenAdd = () => {
    setEditingClass(null);
    setTeacherInputMode('select');
    setFormData({
      name: 'ថ្នាក់ទី ៧ គ',
      gradeLevel: 'ថ្នាក់ទី ៧',
      educationLevel: 'secondary',
      academicYearId: 'ay-2025-2026',
      homeroomTeacherId: teachers[0]?.id || '',
      homeroomTeacherName: teachers[0]?.name || '',
      roomNumber: 'បន្ទប់ ១០៣',
      maxCapacity: 40,
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (cls: SchoolClass) => {
    setEditingClass(cls);
    const hasTeacherInList = teachers.some((t) => t.id === cls.homeroomTeacherId);
    setTeacherInputMode(hasTeacherInList ? 'select' : 'custom');
    setFormData({
      name: cls.name,
      gradeLevel: cls.gradeLevel,
      educationLevel: cls.educationLevel,
      academicYearId: cls.academicYearId,
      homeroomTeacherId: cls.homeroomTeacherId || '',
      homeroomTeacherName: cls.homeroomTeacherName || '',
      roomNumber: cls.roomNumber,
      maxCapacity: cls.maxCapacity,
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    let finalTeacherName = formData.homeroomTeacherName.trim();
    let finalTeacherId = formData.homeroomTeacherId;

    if (teacherInputMode === 'select') {
      const matchTeacher = teachers.find((t) => t.id === formData.homeroomTeacherId);
      if (matchTeacher) {
        finalTeacherName = matchTeacher.name;
        finalTeacherId = matchTeacher.id;
      }
    } else {
      // Custom typed name
      finalTeacherId = '';
    }

    if (editingClass) {
      storage.updateClass(editingClass.id, {
        name: formData.name,
        gradeLevel: formData.gradeLevel,
        educationLevel: formData.educationLevel,
        roomNumber: formData.roomNumber,
        maxCapacity: formData.maxCapacity,
        homeroomTeacherId: finalTeacherId,
        homeroomTeacherName: finalTeacherName,
      });
      setEditingClass(null);
    } else {
      storage.addClass({
        ...formData,
        homeroomTeacherId: finalTeacherId,
        homeroomTeacherName: finalTeacherName,
      });
      setIsAddModalOpen(false);
    }

    onRefresh();
  };

  const handleDeleteClass = () => {
    if (deleteConfirmClass) {
      storage.deleteClass(deleteConfirmClass.id);
      setDeleteConfirmClass(null);
      onRefresh();
    }
  };

  const filteredClasses = classes.filter(
    (c) => selectedLevelFilter === 'all' || c.educationLevel === selectedLevelFilter
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <School className="w-5 h-5 text-blue-900" />
              <h2 className="text-xl font-bold font-moul text-slate-900">
                ការគ្រប់គ្រងថ្នាក់រៀន និងកម្រិតអប់រំ
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              គាំទ្រកម្រិតមត្តេយ្យ បឋមសិក្សា អនុវិទ្យាល័យ វិទ្យាល័យ និងឧត្តមសិក្សា (អាចបន្ថែម កែប្រែ និងលុបថ្នាក់រៀនបាន)
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>បង្កើតថ្នាក់រៀនថ្មី</span>
          </button>
        </div>

        {/* Level Filters */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100 flex-wrap">
          <button
            onClick={() => setSelectedLevelFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              selectedLevelFilter === 'all'
                ? 'bg-blue-950 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            គ្រប់កម្រិតទាំងអស់ ({classes.length})
          </button>
          {educationLevels.map((lvl) => (
            <button
              key={lvl.type}
              onClick={() => setSelectedLevelFilter(lvl.type)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                selectedLevelFilter === lvl.type
                  ? 'bg-blue-950 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {lvl.label}
            </button>
          ))}
        </div>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClasses.map((cls) => {
          const homeroom = teachers.find((t) => t.id === cls.homeroomTeacherId);
          const studentCount = cls.currentStudentCount || 0;
          const capacityPercent = Math.min(100, Math.round((studentCount / cls.maxCapacity) * 100));
          const teacherDisplayName = cls.homeroomTeacherName || homeroom?.name || 'មិនទាន់ចាត់តាំង';

          return (
            <div
              key={cls.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-blue-900/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-sm">
                      {cls.gradeLevel} · អនុវិទ្យាល័យ
                    </span>
                    <h3 className="text-base font-bold font-moul text-slate-900 mt-1.5">{cls.name}</h3>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md">
                      {cls.roomNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(cls)}
                      title="កែប្រែថ្នាក់រៀន"
                      className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmClass(cls)}
                      title="លុបថ្នាក់រៀន"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Homeroom teacher */}
                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                  <img
                    src={safeAvatar(homeroom?.photo, DEFAULT_TEACHER_AVATAR)}
                    alt={teacherDisplayName}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <div className="text-[10px] text-slate-400">គ្រូទទួលបន្ទុកប្រចាំថ្នាក់</div>
                    <div className="text-xs font-bold text-slate-900">
                      {teacherDisplayName}
                    </div>
                  </div>
                </div>
              </div>

              {/* Student Capacity Progress */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex justify-between text-xs text-slate-600 mb-1.5 font-medium">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>ចំនួនសិស្សបច្ចុប្បន្ន</span>
                  </span>
                  <span className="font-bold text-blue-950">
                    {studentCount} / {cls.maxCapacity} នាក់ ({capacityPercent}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    style={{ width: `${capacityPercent}%` }}
                    className="bg-gradient-to-r from-blue-900 to-amber-500 h-full rounded-full transition-all"
                  ></div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredClasses.length === 0 && (
          <div className="col-span-full p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
            មិនមានថ្នាក់រៀននៅក្នុងកម្រិតនេះទេ
          </div>
        )}
      </div>

      {/* Add / Edit Class Modal */}
      {(isAddModalOpen || editingClass) && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold font-moul text-slate-900">
                {editingClass ? `កែប្រែថ្នាក់រៀន៖ ${editingClass.name}` : 'បង្កើតថ្នាក់រៀនថ្មី'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingClass(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ឈ្មោះថ្នាក់ (ឧ. ថ្នាក់ទី ៧ គ) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ឧទាហរណ៍៖ ថ្នាក់ទី ៧ គ"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">កម្រិតអប់រំ</label>
                <select
                  value={formData.educationLevel}
                  onChange={(e) =>
                    setFormData({ ...formData, educationLevel: e.target.value as EducationLevelType })
                  }
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                >
                  {educationLevels.map((lvl) => (
                    <option key={lvl.type} value={lvl.type}>
                      {lvl.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">លេខបន្ទប់</label>
                  <input
                    type="text"
                    required
                    placeholder="ឧ. បន្ទប់ ១០៣"
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    សមត្ថភាពផ្ទុកអតិបរមា
                  </label>
                  <input
                    type="number"
                    value={formData.maxCapacity}
                    onChange={(e) => setFormData({ ...formData, maxCapacity: Number(e.target.value) })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Homeroom Teacher Selection / Custom Typing (Requested feature!) */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-800">
                    គ្រូទទួលបន្ទុកប្រចាំថ្នាក់
                  </label>
                  {/* Segmented control: Select vs Type */}
                  <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setTeacherInputMode('select')}
                      className={`px-2 py-1 text-[10px] font-semibold rounded-md transition-colors cursor-pointer ${
                        teacherInputMode === 'select'
                          ? 'bg-white text-blue-950 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      ជ្រើសរើសពីបញ្ជី
                    </button>
                    <button
                      type="button"
                      onClick={() => setTeacherInputMode('custom')}
                      className={`px-2 py-1 text-[10px] font-semibold rounded-md transition-colors cursor-pointer ${
                        teacherInputMode === 'custom'
                          ? 'bg-white text-blue-950 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      សរសេរឈ្មោះដោយផ្ទាល់
                    </button>
                  </div>
                </div>

                {teacherInputMode === 'select' ? (
                  <div>
                    <select
                      value={formData.homeroomTeacherId}
                      onChange={(e) => {
                        const selTeacher = teachers.find((t) => t.id === e.target.value);
                        setFormData({
                          ...formData,
                          homeroomTeacherId: e.target.value,
                          homeroomTeacherName: selTeacher ? selTeacher.name : '',
                        });
                      }}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden font-medium text-slate-800"
                    >
                      <option value="">-- ជ្រើសរើសគ្រូបង្រៀនពីបញ្ជី --</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.subjects.join(', ')})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1">
                      ជ្រើសរើសគ្រូដែលបានចុះឈ្មោះក្នុងប្រព័ន្ធរួចរាល់
                    </p>
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="វាយបញ្ចូលឈ្មោះគ្រូទទួលបន្ទុក (ឧ. លោកគ្រូ សុខ វិបុល)..."
                      value={formData.homeroomTeacherName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          homeroomTeacherName: e.target.value,
                        })
                      }
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden font-medium text-slate-800"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      អ្នកអាចសរសេរឈ្មោះគ្រូដោយផ្ទាល់ដោយមិនចាំបាច់មានក្នុងបញ្ជីគ្រូស្រាប់
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingClass(null);
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-xs cursor-pointer"
                >
                  {editingClass ? 'កែប្រែថ្នាក់' : 'បង្កើតថ្នាក់'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Requested feature!) */}
      {deleteConfirmClass && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 text-center font-moul">
              តើអ្នកពិតជាចង់លុបថ្នាក់រៀននេះមែនទេ?
            </h3>
            <p className="text-xs text-slate-500 text-center mt-2 leading-relaxed">
              ថ្នាក់រៀន <strong className="text-slate-900 font-bold">{deleteConfirmClass.name}</strong> ({deleteConfirmClass.roomNumber}) ដែលមានសិស្សចំនួន {deleteConfirmClass.currentStudentCount || 0} នាក់ នឹងត្រូវលុបចេញពីប្រព័ន្ធ។
            </p>

            <div className="mt-5 flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmClass(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                បោះបង់
              </button>
              <button
                type="button"
                onClick={handleDeleteClass}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs cursor-pointer"
              >
                បាទ/ចាស លុបថ្នាក់នេះ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
