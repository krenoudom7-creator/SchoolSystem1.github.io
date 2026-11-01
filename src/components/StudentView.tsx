import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Download,
  Phone,
  Calendar,
  MapPin,
  X,
  Check,
  AlertCircle,
  GraduationCap,
} from 'lucide-react';
import { Student, SchoolClass, Gender, StudentStatus } from '../types/index.ts';
import { storage } from '../services/storage.ts';
import { ImageUploader } from './ImageUploader.tsx';
import { safeAvatar, DEFAULT_STUDENT_AVATAR } from '../utils/avatar.ts';

interface StudentViewProps {
  students: Student[];
  classes: SchoolClass[];
  onRefresh: () => void;
}

export const StudentView: React.FC<StudentViewProps> = ({
  students,
  classes,
  onRefresh,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [deleteConfirmStudent, setDeleteConfirmStudent] = useState<Student | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    studentId: '',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    khmerName: '',
    latinName: '',
    gender: 'ប្រុស' as Gender,
    dob: '2013-01-01',
    pob: 'ស្រុកស្ទឹងត្រង់ ខេត្តកំពង់ចាម',
    address: 'ភូមិទួលសំបួរ ស្រុកស្ទឹងត្រង់',
    phone: '097 123 456',
    parentName: '',
    parentPhone: '012 345 678',
    parentRelationship: 'ឪពុក',
    classId: classes[0]?.id || 'cls-7a',
    status: 'កំពុងសិក្សា' as StudentStatus,
    enrollmentYear: '២០២៥',
  });

  // Open add modal
  const handleOpenAdd = () => {
    const nextNum = students.length + 1;
    const padded = nextNum < 10 ? `0${nextNum}` : `${nextNum}`;
    setFormData({
      studentId: `STU-07${padded}`,
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      khmerName: '',
      latinName: '',
      gender: 'ប្រុស',
      dob: '2013-05-15',
      pob: 'ស្រុកស្ទឹងត្រង់ ខេត្តកំពង់ចាម',
      address: 'ភូមិទួលសំបួរ ស្រុកស្ទឹងត្រង់ ខេត្តកំពង់ចាម',
      phone: '097 000 111',
      parentName: '',
      parentPhone: '012 000 111',
      parentRelationship: 'ឪពុក',
      classId: classes[0]?.id || 'cls-7a',
      status: 'កំពុងសិក្សា',
      enrollmentYear: '២០២៥',
    });
    setIsAddModalOpen(true);
  };

  // Open edit modal
  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      studentId: student.studentId,
      photo: student.photo,
      khmerName: student.khmerName,
      latinName: student.latinName,
      gender: student.gender,
      dob: student.dob,
      pob: student.pob,
      address: student.address,
      phone: student.phone,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      parentRelationship: student.parentRelationship,
      classId: student.classId,
      status: student.status,
      enrollmentYear: student.enrollmentYear,
    });
  };

  // Save add/edit
  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.khmerName.trim() || !formData.studentId.trim()) return;

    if (editingStudent) {
      storage.updateStudent(editingStudent.id, formData);
      setEditingStudent(null);
    } else {
      storage.addStudent(formData);
      setIsAddModalOpen(false);
    }
    onRefresh();
  };

  // Confirm delete
  const handleDelete = () => {
    if (deleteConfirmStudent) {
      storage.deleteStudent(deleteConfirmStudent.id);
      setDeleteConfirmStudent(null);
      onRefresh();
    }
  };

  // Filter students
  const filteredStudents = storage.getStudents(selectedClassId, searchQuery);

  // Export students to CSV
  const handleExportCsv = () => {
    const headers = ['លេខសម្គាល់', 'ឈ្មោះខ្មែរ', 'ឈ្មោះឡាតាំង', 'ភេទ', 'ថ្ងៃខែឆ្នាំកំណើត', 'ថ្នាក់', 'អាណាព្យាបាល', 'លេខទូរស័ព្ទ', 'អាសយដ្ឋាន', 'ស្ថានភាព'];
    const rows = filteredStudents.map((s) => {
      const c = classes.find((item) => item.id === s.classId);
      return [
        s.studentId,
        `"${s.khmerName}"`,
        `"${s.latinName}"`,
        s.gender,
        s.dob,
        `"${c?.name || ''}"`,
        `"${s.parentName} (${s.parentRelationship})"`,
        s.parentPhone,
        `"${s.address}"`,
        s.status,
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `បញ្ជីឈ្មោះសិស្ស_អនុវិទ្យាល័យទួលសំបួរ.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-900" />
              <h2 className="text-xl font-bold font-moul text-slate-900">
                ការគ្រប់គ្រងព័ត៌មានសិស្ស (Student Management)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              គ្រប់គ្រងប្រវត្តិរូបសិស្ស អាណាព្យាបាល ថ្នាក់រៀន និងស្ថានភាពសិក្សា
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>ទាញយកបញ្ជី (CSV)</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>បន្ថែមសិស្សថ្មី</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              ចម្រាញ់តាមថ្នាក់រៀន
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
            >
              <option value="all">គ្រប់ថ្នាក់រៀនទាំងអស់ ({students.length} នាក់)</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({students.filter((s) => s.classId === c.id).length} នាក់)
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              ស្វែងរកសិស្ស (ឈ្មោះ, អត្តលេខ, ឬទូរស័ព្ទ)
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="វាយបញ្ចូលឈ្មោះ គោត្តនាម ឬលេខកូដសិស្ស..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900">
            បញ្ជីសិស្សសរុប ({filteredStudents.length} នាក់)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] font-semibold text-slate-600 border-b border-slate-200">
                <th className="py-2.5 px-3 text-center w-12">ល.រ</th>
                <th className="py-2.5 px-3 w-28">អត្តលេខ</th>
                <th className="py-2.5 px-3">គោត្តនាម និងនាម</th>
                <th className="py-2.5 px-2 text-center w-16">ភេទ</th>
                <th className="py-2.5 px-3">ថ្ងៃកំណើត</th>
                <th className="py-2.5 px-3">ថ្នាក់រៀន</th>
                <th className="py-2.5 px-3">អាណាព្យាបាល</th>
                <th className="py-2.5 px-3">លេខទូរស័ព្ទ</th>
                <th className="py-2.5 px-3">ស្ថានភាព</th>
                <th className="py-2.5 px-3 text-right">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredStudents.map((student, idx) => {
                const targetClass = classes.find((c) => c.id === student.classId);

                return (
                  <tr key={student.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-700">
                      {student.studentId}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={safeAvatar(student.photo)}
                          alt={student.khmerName}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <div className="font-bold text-slate-900">{student.khmerName}</div>
                          <div className="text-[10px] text-slate-400">{student.latinName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center text-slate-600 font-medium">
                      {student.gender}
                    </td>
                    <td className="py-3 px-3 text-slate-600">{student.dob}</td>
                    <td className="py-3 px-3 font-medium text-blue-900">{targetClass?.name}</td>
                    <td className="py-3 px-3">
                      <div className="text-slate-800 font-medium">{student.parentName}</div>
                      <div className="text-[10px] text-slate-400">({student.parentRelationship})</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{student.parentPhone}</td>
                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                        {student.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewingStudent(student)}
                          title="មើលព័ត៌មានលម្អិត"
                          className="p-1.5 text-slate-500 hover:text-blue-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(student)}
                          title="កែប្រែ"
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmStudent(student)}
                          title="លុប"
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-xs text-slate-400">
                    <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600 text-sm">មិនទាន់មានទិន្នន័យសិស្សនៅឡើយទេ</p>
                    <p className="text-slate-400 mt-1 mb-3">អ្នកអាចចាប់ផ្ដើមបញ្ចូលទិន្នន័យសិស្សថ្មីបានដោយចុចប៊ូតុងខាងក្រោម</p>
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(true)}
                      className="px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                      <span>បញ្ចូលសិស្សថ្មីដំបូង</span>
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {(isAddModalOpen || editingStudent) && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-sm font-bold font-moul text-slate-900">
                {editingStudent ? 'កែប្រែព័ត៌មានសិស្ស' : 'បន្ថែមសិស្សថ្មី'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingStudent(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    អត្តលេខសិស្ស (Student ID) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden font-mono"
                  />
                </div>

                <div className="sm:col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <ImageUploader
                    currentImage={formData.photo}
                    onImageChange={(img) => setFormData({ ...formData, photo: img })}
                    label="រូបថតសិស្ស (ផ្ទុកឡើងពីរូបថតក្នុងម៉ាស៊ីន ឬជ្រើសរូបគំរូ)"
                    type="student"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    គោត្តនាម និងនាម (Khmer Name) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ឧទាហរណ៍៖ សុខ វិបុល"
                    value={formData.khmerName}
                    onChange={(e) => setFormData({ ...formData, khmerName: e.target.value })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ឈ្មោះជាអក្សរឡាតាំង (Latin Name)
                  </label>
                  <input
                    type="text"
                    placeholder="Sok Vibol"
                    value={formData.latinName}
                    onChange={(e) => setFormData({ ...formData, latinName: e.target.value })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">ភេទ</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                  >
                    <option value="ប្រុស">ប្រុស (Male)</option>
                    <option value="ស្រី">ស្រី (Female)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ថ្ងៃខែឆ្នាំកំណើត
                  </label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">ថ្នាក់រៀន</label>
                  <select
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">ស្ថានភាពសិក្សា</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as StudentStatus })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                  >
                    <option value="កំពុងសិក្សា">កំពុងសិក្សា</option>
                    <option value="ផ្អាកការសិក្សា">ផ្អាកការសិក្សា</option>
                    <option value="បោះបង់">បោះបង់</option>
                    <option value="បញ្ចប់ការសិក្សា">បញ្ចប់ការសិក្សា</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ឈ្មោះអាណាព្យាបាល
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ឈ្មោះឪពុក ឬម្ដាយ..."
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    លេខទូរស័ព្ទអាណាព្យាបាល (សម្រាប់ទទួល Telegram/SMS)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  អាសយដ្ឋានបច្ចុប្បន្ន
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingStudent(null);
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-xs cursor-pointer"
                >
                  {editingStudent ? 'កែប្រែព័ត៌មាន' : 'រក្សាទុកសិស្ស'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Student Profile Card Modal */}
      {viewingStudent && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-blue-900">
                កាតព័ត៌មានសិស្ស · អនុវិទ្យាល័យទួលសំបួរ
              </span>
              <button
                onClick={() => setViewingStudent(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 flex flex-col items-center text-center">
              <img
                src={safeAvatar(viewingStudent.photo)}
                alt={viewingStudent.khmerName}
                className="w-24 h-24 rounded-full object-cover border-4 border-amber-300 shadow-md"
              />
              <h3 className="text-lg font-bold font-moul text-slate-900 mt-3">
                {viewingStudent.khmerName}
              </h3>
              <p className="text-xs text-slate-400">{viewingStudent.latinName}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {viewingStudent.studentId}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {viewingStudent.status}
                </span>
              </div>
            </div>

            <div className="mt-5 space-y-2.5 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-400">ថ្នាក់រៀន:</span>
                <span className="font-semibold text-blue-950">
                  {classes.find((c) => c.id === viewingStudent.classId)?.name}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-400">ភេទ / ថ្ងៃកំណើត:</span>
                <span className="font-medium">
                  {viewingStudent.gender} · {viewingStudent.dob}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-400">ទីកន្លែងកំណើត:</span>
                <span className="font-medium">{viewingStudent.pob}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-400">អាសយដ្ឋានបច្ចុប្បន្ន:</span>
                <span className="font-medium">{viewingStudent.address}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-400">អាណាព្យាបាល:</span>
                <span className="font-medium text-slate-900">
                  {viewingStudent.parentName} ({viewingStudent.parentRelationship})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">លេខទូរស័ព្ទអាណាព្យាបាល:</span>
                <span className="font-mono font-bold text-blue-900">{viewingStudent.parentPhone}</span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewingStudent(null)}
                className="px-4 py-2 text-xs font-semibold bg-blue-900 text-white rounded-xl hover:bg-blue-800 cursor-pointer"
              >
                បិទផ្ទាំង
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmStudent && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 text-center">
              តើអ្នកប្រាកដជាចង់លុបសិស្សនេះមែនទេ?
            </h3>
            <p className="text-xs text-slate-500 text-center mt-1">
              សិស្សឈ្មោះ <strong className="text-slate-800">{deleteConfirmStudent.khmerName}</strong> ({deleteConfirmStudent.studentId}) នឹងត្រូវលុបចេញពីប្រព័ន្ធ។
            </p>

            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmStudent(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                បោះបង់
              </button>
              <button
                type="button"
                onClick={handleDelete}
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
