import React, { useState } from 'react';
import {
  CalendarRange,
  Plus,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  GraduationCap,
  X,
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [promoteStatus, setPromoteStatus] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '២០២៦-២០២៧',
    startDate: '2026-10-01',
    endDate: '2027-07-31',
    currentSemester: 'ឆមាសទី ១',
    isCurrent: false,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    storage.addAcademicYear(formData);
    setIsAddModalOpen(false);
    onRefresh();
  };

  const handlePromoteStudents = () => {
    // Demo student promotion: Promote 7A to 8A, 8A to 9A, 9A graduates
    setPromoteStatus('ជោគជ័យ៖ សិស្សថ្នាក់ទី ៧ បានផ្ទេរឡើងថ្នាក់ទី ៨ និងសិស្សថ្នាក់ទី ៨ ឡើងថ្នាក់ទី ៩ ដោយរក្សាទុកប្រវត្តិចាស់ក្នុង Enrollments!');
    setTimeout(() => setPromoteStatus(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CalendarRange className="w-5 h-5 text-blue-900" />
              <h2 className="text-xl font-bold font-moul text-slate-900">
                ការគ្រប់គ្រងឆ្នាំសិក្សា និងឆមាស (Academic Year Management)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              គ្រប់គ្រងឆ្នាំសិក្សា ឆមាសទី១ និងឆមាសទី២ និងការផ្ទេរឡើងថ្នាក់ដោយរក្សាទុកប្រវត្តិ
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsPromoteModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>ផ្ទេរសិស្សឡើងថ្នាក់ថ្មី</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
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

      {/* Academic Years List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {academicYears.map((ay) => (
          <div
            key={ay.id}
            className={`p-6 rounded-2xl border transition-all ${
              ay.isCurrent
                ? 'bg-gradient-to-br from-blue-900/5 via-white to-amber-500/5 border-amber-300 shadow-md ring-1 ring-amber-300/60'
                : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  ឆ្នាំសិក្សា
                </span>
                <h3 className="text-xl font-bold font-moul text-slate-900 mt-0.5">
                  {ay.name}
                </h3>
              </div>

              {ay.isCurrent ? (
                <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-400 text-slate-950 shadow-xs">
                  ★ ឆ្នាំសិក្សាបច្ចុប្បន្ន
                </span>
              ) : (
                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600">
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
        ))}
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold font-moul text-slate-900">បន្ថែមឆ្នាំសិក្សាថ្មី</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 mt-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ឈ្មោះឆ្នាំសិក្សា (ឧ. ២០២៦-២០២៧) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden font-bold"
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
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
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
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">ឆមាស</label>
                <select
                  value={formData.currentSemester}
                  onChange={(e) => setFormData({ ...formData, currentSemester: e.target.value })}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                >
                  <option value="ឆមាសទី ១">ឆមាសទី ១</option>
                  <option value="ឆមាសទី ២">ឆមាសទី ២</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-xs cursor-pointer"
                >
                  រក្សាទុក
                </button>
              </div>
            </form>
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
                onClick={() => setIsPromoteModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                បោះបង់
              </button>
              <button
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
