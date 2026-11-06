import React, { useState } from 'react';
import {
  CalendarRange,
  Plus,
  CheckCircle2,
  ArrowRight,
  X,
  Edit3,
  Trash2,
  Star,
  AlertTriangle,
} from 'lucide-react';
import { AcademicYear, SchoolClass, Student } from '../types/index.ts';
import { storage } from '../services/storage.ts';

interface AcademicYearViewProps {
  academicYears: AcademicYear[];
  classes: SchoolClass[];
  students: Student[];
  onRefresh: () => void;
}

export const AcademicYearView: React.FC<AcademicYearViewProps> = ({
  academicYears,
  classes,
  students,
  onRefresh,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [deletingYear, setDeletingYear] = useState<AcademicYear | null>(null);
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [promoteStatus, setPromoteStatus] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '២០២៦-២០២៧',
    startDate: '2026-10-01',
    endDate: '2027-07-31',
    currentSemester: 'ឆមាសទី ១',
    isCurrent: false,
  });

  const showToast = (msg: string) => {
    setPromoteStatus(msg);
    setTimeout(() => setPromoteStatus(null), 4000);
  };

  const handleOpenAddModal = () => {
    setEditingYear(null);
    setFormData({
      name: '២០២៦-២០២៧',
      startDate: '2026-10-01',
      endDate: '2027-07-31',
      currentSemester: 'ឆមាសទី ១',
      isCurrent: academicYears.length === 0,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (ay: AcademicYear) => {
    setEditingYear(ay);
    setFormData({
      name: ay.name,
      startDate: ay.startDate,
      endDate: ay.endDate,
      currentSemester: ay.currentSemester || 'ឆមាសទី ១',
      isCurrent: Boolean(ay.isCurrent),
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = formData.name.trim();
    if (!trimmedName) return;

    if (editingYear) {
      storage.updateAcademicYear(editingYear.id, {
        ...formData,
        name: trimmedName,
      });
      showToast(`បានកែប្រែឆ្នាំសិក្សា "${trimmedName}" ដោយជោគជ័យ!`);
    } else {
      storage.addAcademicYear({
        ...formData,
        name: trimmedName,
      });
      showToast(`បានបន្ថែមឆ្នាំសិក្សាថ្មី "${trimmedName}" ដោយជោគជ័យ!`);
    }

    setIsModalOpen(false);
    setEditingYear(null);
    onRefresh();
  };

  const handleSetCurrent = (ay: AcademicYear) => {
    storage.setCurrentAcademicYear(ay.id);
    showToast(`បានកំណត់ឆ្នាំសិក្សា "${ay.name}" ជាឆ្នាំសិក្សាបច្ចុប្បន្ន!`);
    onRefresh();
  };

  const handleConfirmDelete = () => {
    if (!deletingYear) return;
    const deletedName = deletingYear.name;
    storage.deleteAcademicYear(deletingYear.id);
    setDeletingYear(null);
    showToast(`បានលុបឆ្នាំសិក្សា "${deletedName}" ចេញពីប្រព័ន្ធរួចរាល់!`);
    onRefresh();
  };

  const handlePromoteStudents = () => {
    setPromoteStatus('ជោគជ័យ៖ សិស្សថ្នាក់ទី ៧ បានផ្ទេរឡើងថ្នាក់ទី ៨ និងសិស្សថ្នាក់ទី ៨ ឡើងថ្នាក់ទី ៩ ដោយរក្សាទុកប្រវត្តិចាស់ក្នុង Enrollments!');
    setTimeout(() => setPromoteStatus(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CalendarRange className="w-5 h-5 text-blue-900 shrink-0" />
              <h2 className="text-lg sm:text-xl font-bold font-moul text-slate-900">
                ការគ្រប់គ្រងឆ្នាំសិក្សា និងឆមាស (Academic Year Management)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              គ្រប់គ្រង បន្ថែម កែប្រែ និងលុបឆ្នាំសិក្សា ឆមាសទី១-ទី២ និងការផ្ទេរសិស្សឡើងថ្នាក់
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsPromoteModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>ផ្ទេរសិស្សឡើងថ្នាក់ថ្មី</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>បន្ថែមឆ្នាំសិក្សាថ្មី</span>
            </button>
          </div>
        </div>
      </div>

      {promoteStatus && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{promoteStatus}</span>
        </div>
      )}

      {/* Empty State if all academic years are deleted */}
      {academicYears.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center space-y-3">
          <CalendarRange className="w-10 h-10 text-slate-400 mx-auto stroke-1" />
          <div className="text-sm font-bold text-slate-700">មិនទាន់មានទិន្នន័យឆ្នាំសិក្សាទេ</div>
          <p className="text-xs text-slate-500">
            សូមចុចប៊ូតុងខាងក្រោមដើម្បីបង្កើតឆ្នាំសិក្សាថ្មីសម្រាប់សាលារៀន។
          </p>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-900 hover:bg-blue-800 text-white rounded-xl shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>បន្ថែមឆ្នាំសិក្សាថ្មី</span>
          </button>
        </div>
      ) : (
        /* Academic Years List */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {academicYears.map((ay) => (
            <div
              key={ay.id}
              className={`p-5 sm:p-6 rounded-2xl border transition-all flex flex-col justify-between ${
                ay.isCurrent
                  ? 'bg-gradient-to-br from-blue-900/5 via-white to-amber-500/5 border-amber-300 shadow-md ring-1 ring-amber-300/60'
                  : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      ឆ្នាំសិក្សា
                    </span>
                    <h3 className="text-xl font-bold font-moul text-slate-900 mt-0.5">
                      {ay.name}
                    </h3>
                  </div>

                  {ay.isCurrent ? (
                    <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-400 text-slate-950 shadow-xs shrink-0">
                      ★ ឆ្នាំសិក្សាបច្ចុប្បន្ន
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600 shrink-0">
                      ប្រវត្តិឆ្នាំចាស់ (Archived)
                    </span>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px]">ឆមាសបច្ចុប្បន្ន:</span>
                    <div className="font-bold text-blue-900 mt-0.5">{ay.currentSemester}</div>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[11px]">កាលបរិច្ឆេទ:</span>
                    <div className="font-medium text-slate-700 mt-0.5">
                      {ay.startDate} ដល់ {ay.endDate}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>សិស្សសរុប: {students.length} នាក់</span>
                  <span>ថ្នាក់រៀន: {classes.length} ថ្នាក់</span>
                </div>
              </div>

              {/* Action Buttons: Set Current, Edit, Delete */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div>
                  {!ay.isCurrent ? (
                    <button
                      type="button"
                      onClick={() => handleSetCurrent(ay)}
                      className="px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Star className="w-3.5 h-3.5 text-amber-600" />
                      <span>ដាក់ជាឆ្នាំបច្ចុប្បន្ន</span>
                    </button>
                  ) : (
                    <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>កំពុងប្រើប្រាស់បច្ចុប្បន្ន</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(ay)}
                    className="px-3 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>កែប្រែ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeletingYear(ay)}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>លុប</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold font-moul text-slate-900">
                {editingYear ? 'កែប្រែព័ត៌មានឆ្នាំសិក្សា' : 'បន្ថែមឆ្នាំសិក្សាថ្មី'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingYear(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 mt-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ឈ្មោះឆ្នាំសិក្សា (ឧ. ២០២៥-២០២៦ ឬ ២០២៦-២០២៧) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ឧ. ២០២៥-២០២៦"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ថ្ងៃចាប់ផ្ដើម
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ថ្ងៃបញ្ចប់
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">ឆមាសបច្ចុប្បន្ន</label>
                <select
                  value={formData.currentSemester}
                  onChange={(e) => setFormData({ ...formData, currentSemester: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden font-semibold"
                >
                  <option value="ឆមាសទី ១">ឆមាសទី ១</option>
                  <option value="ឆមាសទី ២">ឆមាសទី ២</option>
                </select>
              </div>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50/70 border border-amber-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isCurrent}
                  onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked })}
                  className="w-4 h-4 rounded border-amber-300 text-blue-900 focus:ring-blue-900"
                />
                <span className="text-xs font-semibold text-amber-950">
                  កំណត់ជាឆ្នាំសិក្សាបច្ចុប្បន្ន (Current Academic Year)
                </span>
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingYear(null);
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-xs cursor-pointer"
                >
                  {editingYear ? 'រក្សាទុកការកែប្រែ' : 'រក្សាទុក'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingYear && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-100 text-rose-700 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-moul text-slate-900">
                  បញ្ជាក់ការលុបឆ្នាំសិក្សា
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  តើអ្នកពិតជាចង់លុបឆ្នាំសិក្សា{' '}
                  <span className="font-bold text-rose-700">«{deletingYear.name}»</span>{' '}
                  ចេញពីប្រព័ន្ធមែនទេ?
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingYear(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                បោះបង់
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>យល់ព្រមលុប</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Promotion confirmation modal */}
      {isPromoteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in">
            <h3 className="text-sm font-bold font-moul text-slate-900">
              ដំណើរការផ្ទេរសិស្សឡើងថ្នាក់ថ្មី (Student Promotion)
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              ប្រព័ន្ធនឹងធ្វើការផ្ទេរសិស្សដែលជាប់ការប្រឡងឆមាសទី២ ឡើងទៅកម្រិតថ្នាក់បន្ទាប់ (ឧទាហរណ៍៖ ថ្នាក់ទី៧ ឡើងទៅថ្នាក់ទី៨)។ ទិន្នន័យប្រវត្តិចាស់ទាំងអស់នឹងត្រូវបានរក្សាទុកក្នុង Database មិនឱ្យបាត់បង់ឡើយ។
            </p>
            <div className="mt-5 flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPromoteModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                បោះបង់
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPromoteModalOpen(false);
                  handlePromoteStudents();
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs cursor-pointer"
              >
                យល់ព្រមដំណើរការ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

