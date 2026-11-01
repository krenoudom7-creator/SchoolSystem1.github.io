import React, { useState } from 'react';
import {
  Database,
  Shield,
  Download,
  Upload,
  RotateCcw,
  Key,
  Lock,
  CheckCircle2,
  AlertTriangle,
  History,
  FileCode,
  Terminal,
  Server,
  Layers,
} from 'lucide-react';
import { storage } from '../services/storage.ts';
import { AuditLogItem } from '../types/index.ts';

interface SecurityBackupViewProps {
  auditLogs: AuditLogItem[];
  onRefresh: () => void;
}

export const SecurityBackupView: React.FC<SecurityBackupViewProps> = ({
  auditLogs,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'schema' | 'rbac' | 'backup' | 'audit'>('schema');
  const [backupJson, setBackupJson] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // The 22 database tables requested by the user
  const schemaTables = [
    { name: 'users', desc: 'គណនីអ្នកប្រើប្រាស់ (Admin, Director, Teachers, Students, Parents)', columns: 'id, username, password_hash, role_id, email, phone, avatar, status, created_at' },
    { name: 'roles', desc: 'តួនាទីអ្នកប្រើប្រាស់ (Administrator, Director, Teacher, Student, Parent)', columns: 'id, role_name, description, is_system' },
    { name: 'permissions', desc: 'សិទ្ធិប្រើប្រាស់ (read, write, delete, export, approve)', columns: 'id, role_id, module, can_read, can_write, can_delete, can_export' },
    { name: 'students', desc: 'ព័ត៌មានលម្អិតសិស្ស', columns: 'id, student_id (unique), khmer_name, latin_name, gender, dob, pob, current_address, phone, class_id, status' },
    { name: 'parents', desc: 'ព័ត៌មានអាណាព្យាបាលសិស្ស', columns: 'id, student_id (FK), parent_name, phone, relationship, occupation, address' },
    { name: 'teachers', desc: 'ព័ត៌មានគ្រូបង្រៀន', columns: 'id, teacher_id (unique), name, gender, dob, phone, email, address, homeroom_class_id, join_date, status' },
    { name: 'academic_years', desc: 'ឆ្នាំសិក្សា (២០២៥-២០២៦...)', columns: 'id, year_name, start_date, end_date, is_current' },
    { name: 'semesters', desc: 'ឆមាសសិក្សា (ឆមាសទី ១, ឆមាសទី ២)', columns: 'id, academic_year_id (FK), semester_name, start_date, end_date' },
    { name: 'education_levels', desc: 'កម្រិតអប់រំ (មត្តេយ្យ, បឋម, អនុវិទ្យាល័យ, វិទ្យាល័យ, ឧត្តម)', columns: 'id, level_code, level_name, description' },
    { name: 'grade_levels', desc: 'កម្រិតថ្នាក់ (ថ្នាក់ទី ៧, ថ្នាក់ទី ៨, ថ្នាក់ទី ៩)', columns: 'id, level_id (FK), grade_name, sequence_order' },
    { name: 'classes', desc: 'បន្ទប់ថ្នាក់រៀន (ថ្នាក់ទី ៧ ក, ៧ ខ...)', columns: 'id, class_name, grade_level_id (FK), academic_year_id (FK), homeroom_teacher_id (FK), room_no, max_capacity' },
    { name: 'enrollments', desc: 'ប្រវត្តិចុះឈ្មោះសិស្សក្នុងថ្នាក់តាមឆ្នាំ', columns: 'id, student_id (FK), class_id (FK), academic_year_id (FK), enrollment_date, status' },
    { name: 'subjects', desc: 'មុខវិជ្ជាសិក្សា (គណិត, ខ្មែរ, រូប, គីមី...)', columns: 'id, subject_code, name_km, name_en, grade_level_id, hours_per_week' },
    { name: 'curricula', desc: 'កម្មវិធីសិក្សាជាតិរបស់ក្រសួង', columns: 'id, subject_id (FK), grade_level_id (FK), syllabus_title, total_hours' },
    { name: 'teacher_assignments', desc: 'ការបែងចែកគ្រូបង្រៀនតាមមុខវិជ្ជា និងថ្នាក់', columns: 'id, teacher_id (FK), subject_id (FK), class_id (FK), academic_year_id (FK)' },
    { name: 'timetable', desc: 'កាលវិភាគសិក្សាប្រចាំសប្ដាហ៍', columns: 'id, class_id (FK), day_of_week, period_no, start_time, end_time, subject_id (FK), teacher_id (FK), room' },
    { name: 'attendance', desc: 'កំណត់ត្រាវត្តមានសិស្សម្នាក់ៗ', columns: 'id, session_id (FK), student_id (FK), class_id (FK), date, status (5 states), reason, subject_id, recorded_by' },
    { name: 'attendance_sessions', desc: 'វគ្គកត់ត្រាវត្តមានតាមថ្នាក់ និងម៉ោង', columns: 'id, class_id (FK), date, period, subject_id (FK), recorded_by, created_at (Unique constraint on class+date+period)' },
    { name: 'exams', desc: 'ការប្រឡង (ប្រចាំខែ, ឆមាស, ឆ្នាំ)', columns: 'id, title, exam_type, academic_year_id (FK), semester_id (FK), date, max_score' },
    { name: 'exam_results', desc: 'ពិន្ទុ និងចំណាត់ថ្នាក់សិស្ស', columns: 'id, exam_id (FK), student_id (FK), class_id (FK), scores (jsonb), total_score, average, rank, grade_letter, remarks' },
    { name: 'notifications', desc: 'ប្រព័ន្ធផ្ញើសារស្វ័យប្រវត្តិ Telegram & SMS', columns: 'id, type, recipient_name, recipient_phone, student_name, message, status, sent_at' },
    { name: 'audit_logs', desc: 'ប្រវត្តិសកម្មភាពសន្តិសុខប្រព័ន្ធ', columns: 'id, user_name, role, action, details, timestamp' },
  ];

  // RBAC Matrix
  const rbacMatrix = [
    { role: 'Administrator (អភិបាលប្រព័ន្ធ)', dashboard: 'ពេញលេញ', attendance: 'កត់ត្រា & កែប្រែ', students: 'គ្រប់គ្រង CRUD', teachers: 'គ្រប់គ្រង CRUD', grades: 'បញ្ចូល & បោះពុម្ព', system: 'គ្រប់គ្រងទាំងមូល' },
    { role: 'School Director (នាយកសាលា)', dashboard: 'ពេញលេញ', attendance: 'មើលរបាយការណ៍', students: 'មើល & ត្រួតពិនិត្យ', teachers: 'ត្រួតពិនិត្យការងារ', grades: 'ពិនិត្យ & អនុម័ត', system: 'មើលស្ថិតិ & Audit' },
    { role: 'Teacher (គ្រូបង្រៀន)', dashboard: 'កំណត់', attendance: 'កត់ត្រាថ្នាក់របស់ខ្លួន', students: 'មើលសិស្សក្នុងថ្នាក់', teachers: 'មើលបញ្ជីសហការី', grades: 'បញ្ចូលពិន្ទុមុខវិជ្ជា', system: 'គ្មាន' },
    { role: 'Student (សិស្ស)', dashboard: 'ផ្ទាល់ខ្លួន', attendance: 'មើលវត្តមានផ្ទាល់ខ្លួន', students: 'មើលព័ត៌មានផ្ទាល់ខ្លួន', teachers: 'មើលកាលវិភាគគ្រូ', grades: 'មើលតារាងពិន្ទុ', system: 'គ្មាន' },
    { role: 'Parent (អាណាព្យាបាល)', dashboard: 'ផ្ទាល់ខ្លួន', attendance: 'ទទួលដំណឹង & មើលវត្តមាន', students: 'មើលកូនរបស់ខ្លួន', teachers: 'ទំនាក់ទំនងគ្រូ', grades: 'មើលលទ្ធផលកូន', system: 'គ្មាន' },
  ];

  // Backup Export
  const handleDownloadBackup = () => {
    const json = storage.exportDatabaseJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Toulsambour_School_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  // Restore
  const handleImportBackup = () => {
    if (!backupJson.trim()) return;
    const ok = storage.importDatabaseJson(backupJson);
    if (ok) {
      setImportStatus('ជោគជ័យ៖ បានស្ដារទិន្នន័យពី Backup ដោយជោគជ័យ!');
      onRefresh();
    } else {
      setImportStatus('បរាជ័យ៖ ទម្រង់ JSON មិនត្រឹមត្រូវ។');
    }
  };

  // Reset to default
  const handleResetToDefault = () => {
    if (confirm('តើអ្នកពិតជាចង់កំណត់ទិន្នន័យប្រព័ន្ធឡើងវិញទៅកាន់ទិន្នន័យគំរូលំនាំដើមមែនទេ?')) {
      storage.resetToDefault();
      onRefresh();
      alert('បានកំណត់ប្រព័ន្ធឡើងវិញដោយជោគជ័យ!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-900" />
              <h2 className="text-xl font-bold font-moul text-slate-900">
                Database Architecture & សុវត្ថិភាពប្រព័ន្ធ
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              រចនាសម្ព័ន្ធ ២២ តារាង PostgreSQL/MySQL, Role-Based Access Control, និង Backup & Restore
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetToDefault}
              className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>កំណត់ទិន្នន័យឡើងវិញ (Reset Seed)</span>
            </button>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100 flex-wrap">
          <button
            onClick={() => setActiveTab('schema')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'schema'
                ? 'bg-blue-950 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            រចនាសម្ព័ន្ធ Database (២២ តារាង)
          </button>
          <button
            onClick={() => setActiveTab('rbac')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'rbac'
                ? 'bg-blue-950 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            សិទ្ធិអ្នកប្រើប្រាស់ (RBAC Matrix)
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'backup'
                ? 'bg-blue-950 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Backup & Restore (JSON)
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-blue-950 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            កំណត់ត្រាសកម្មភាព (Audit Logs)
          </button>
        </div>
      </div>

      {/* Tab 1: Database Schema Tables */}
      {activeTab === 'schema' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-slate-900">
                តារាងទិន្នន័យទាំង ២២ (Relational Database Architecture)
              </h3>
              <p className="text-[11px] text-slate-500">
                រៀបចំជាមួយ Primary Keys, Foreign Keys, Unique Indexes សម្រាប់ PostgreSQL / MySQL
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-md">
              Total: 22 Tables
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {schemaTables.map((t, idx) => (
              <div
                key={t.name}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded">
                      {idx + 1}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {t.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                    Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">{t.desc}</p>
                <div className="mt-2 text-[10px] font-mono text-slate-400 bg-white p-2 rounded border border-slate-200/60 break-all">
                  {t.columns}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: RBAC Matrix */}
      {activeTab === 'rbac' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900">
              តារាងសិទ្ធិប្រើប្រាស់តាមតួនាទី (Role-Based Access Control)
            </h3>
            <p className="text-[11px] text-slate-500">
              បែងចែកសិទ្ធិជា ៥ តួនាទី៖ Administrator, Director, Teacher, Student, Parent
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-semibold text-slate-700 border-b border-slate-200">
                  <th className="py-3 px-4">តួនាទី (Role)</th>
                  <th className="py-3 px-3">Dashboard</th>
                  <th className="py-3 px-3">វត្តមាន</th>
                  <th className="py-3 px-3">សិស្ស</th>
                  <th className="py-3 px-3">គ្រូបង្រៀន</th>
                  <th className="py-3 px-3">ពិន្ទុ</th>
                  <th className="py-3 px-3">ប្រព័ន្ធ & សុវត្ថិភាព</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rbacMatrix.map((m, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-blue-950">{m.role}</td>
                    <td className="py-3 px-3">{m.dashboard}</td>
                    <td className="py-3 px-3">{m.attendance}</td>
                    <td className="py-3 px-3">{m.students}</td>
                    <td className="py-3 px-3">{m.teachers}</td>
                    <td className="py-3 px-3">{m.grades}</td>
                    <td className="py-3 px-3 font-semibold text-slate-700">{m.system}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Backup & Restore */}
      {activeTab === 'backup' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Download className="w-5 h-5 text-blue-900" />
                <h3 className="text-sm font-bold text-slate-900">
                  ទាញយក Database Backup (JSON Export)
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                រក្សាទុកទិន្នន័យសាលារៀនទាំងមូល រួមមានសិស្ស គ្រូ ថ្នាក់រៀន វត្តមាន កាលវិភាគ ពិន្ទុ និង Audit Logs ជាឯកសារ JSON ពេញលេញ។
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={handleDownloadBackup}
                className="w-full py-2.5 text-xs font-semibold bg-blue-900 hover:bg-blue-800 text-white rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>ទាញយក Backup Database ឥឡូវនេះ</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Upload className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  ស្ដារទិន្នន័យពី Backup (Restore JSON)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                បញ្ចូលទិន្នន័យ JSON Backup ដើម្បីស្ដារប្រព័ន្ធ៖
              </p>
              <textarea
                rows={4}
                placeholder="បិទភ្ជាប់ (Paste) JSON content នៅទីនេះ..."
                value={backupJson}
                onChange={(e) => setBackupJson(e.target.value)}
                className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
              />
              {importStatus && (
                <p className="mt-2 text-xs font-semibold text-emerald-700">{importStatus}</p>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <button
                onClick={handleImportBackup}
                className="w-full py-2.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>ស្ដារទិន្នន័យ (Restore)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900">
                កំណត់ត្រាសកម្មភាព និងសុវត្ថិភាព (Audit Logs)
              </h3>
              <p className="text-[10px] text-slate-400">
                កត់ត្រារាល់ប្រតិបត្តិការបញ្ចូល កែប្រែ លុប និងកត់ត្រាវត្តមាន
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">
              {auditLogs.length} Records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-semibold text-slate-700 border-b border-slate-200">
                  <th className="py-2.5 px-3">ពេលវេលា</th>
                  <th className="py-2.5 px-3">អ្នកប្រើប្រាស់</th>
                  <th className="py-2.5 px-3">តួនាទី</th>
                  <th className="py-2.5 px-3">សកម្មភាព</th>
                  <th className="py-2.5 px-3">ព័ត៌មានលម្អិត</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString('km-KH')}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900">{log.userName}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {log.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium text-blue-900">{log.action}</td>
                    <td className="py-3 px-3 text-slate-600">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
