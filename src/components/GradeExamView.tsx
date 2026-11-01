import React, { useState, useEffect } from 'react';
import {
  Award,
  Printer,
  Download,
  Save,
  Plus,
  Search,
  CheckCircle2,
  FileText,
  User,
  GraduationCap,
  Sliders,
  Trash2,
  X,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import {
  Exam,
  ExamResult,
  Student,
  SchoolClass,
  Subject,
} from '../types/index.ts';
import { storage } from '../services/storage.ts';
import { calculateRankings } from '../utils/calculations.ts';
import { safeAvatar } from '../utils/avatar.ts';

interface GradeExamViewProps {
  students: Student[];
  classes: SchoolClass[];
  subjects: Subject[];
  exams: Exam[];
  examResults: ExamResult[];
  onRefresh: () => void;
  onPrintOfficialReport: (type: 'attendance' | 'exam', payload: any) => void;
}

export const GradeExamView: React.FC<GradeExamViewProps> = ({
  students,
  classes,
  subjects,
  exams,
  examResults,
  onRefresh,
  onPrintOfficialReport,
}) => {
  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || '');
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || 'cls-7a');
  const [activeTab, setActiveTab] = useState<'ranking' | 'input'>('ranking');
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Modals for Subject Management within Exam
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [subjectToRemove, setSubjectToRemove] = useState<Subject | null>(null);
  const [quickNewSubjectName, setQuickNewSubjectName] = useState('');

  // Max score configuration state
  const [isConfiguringMaxScore, setIsConfiguringMaxScore] = useState(false);
  const [maxScoreInput, setMaxScoreInput] = useState<number>(50);

  // Active exam and class
  const currentExam = exams.find((e) => e.id === selectedExamId) || exams[0];
  const currentClass = classes.find((c) => c.id === selectedClassId) || classes[0];
  const classStudents = students.filter((s) => s.classId === selectedClassId);

  // Configured max score for the current exam (capped at 150 max)
  const currentMaxScore = Math.min(
    150,
    Math.max(1, currentExam?.maxScorePerSubject || 50)
  );

  // Determine active subjects for this exam
  const examSubjectIds = currentExam?.subjectIds && currentExam.subjectIds.length > 0
    ? currentExam.subjectIds
    : subjects.slice(0, 6).map((s) => s.id);

  const examSubjects = examSubjectIds
    .map((id) => subjects.find((s) => s.id === id))
    .filter((s): s is Subject => s !== undefined);

  // Subjects not yet in this exam (available to add)
  const availableSubjectsToAdd = subjects.filter(
    (s) => !examSubjectIds.includes(s.id)
  );

  // Grade input state: studentId -> scores map
  const [draftScores, setDraftScores] = useState<Record<string, Record<string, number>>>({});

  // Sync draftScores whenever exam, class, or examResults change
  useEffect(() => {
    const newMap: Record<string, Record<string, number>> = {};
    classStudents.forEach((student) => {
      const match = examResults.find(
        (r) => r.examId === selectedExamId && r.studentId === student.id
      );
      if (match) {
        newMap[student.id] = { ...match.scores };
      } else {
        // Default template scores if none exist
        const defaultScores: Record<string, number> = {};
        examSubjects.forEach((sbj) => {
          defaultScores[sbj.id] = Math.round(currentMaxScore * 0.7);
        });
        newMap[student.id] = defaultScores;
      }
    });
    setDraftScores(newMap);
    setMaxScoreInput(currentMaxScore);
  }, [selectedExamId, selectedClassId, examResults.length, examSubjectIds.join(',')]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Handle score change with strict validation against currentMaxScore (capped <= 150)
  const handleScoreChange = (studentId: string, subjectId: string, value: number) => {
    const num = isNaN(value) ? 0 : value;
    const valid = Math.max(0, Math.min(currentMaxScore, Math.min(150, num)));
    setDraftScores((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [subjectId]: valid,
      },
    }));
  };

  // Pre-set max score change handler (ensures <= 150)
  const handleSaveMaxScore = (val: number) => {
    const capped = Math.max(1, Math.min(150, val));
    storage.setExamMaxScore(selectedExamId, capped);
    setMaxScoreInput(capped);
    setIsConfiguringMaxScore(false);
    showToast(`បានកំណត់ពិន្ទុអតិបរមា ${capped} ពិន្ទុ (ត្រឹម ១៥០) ដោយជោគជ័យ!`);
    onRefresh();
  };

  // Save scores & recalculate rankings automatically
  const handleSaveScores = () => {
    const rawData = classStudents.map((s) => ({
      studentId: s.id,
      studentName: s.khmerName,
      scores: draftScores[s.id] || {},
    }));

    const calculated = calculateRankings(rawData, currentMaxScore).map((item) => ({
      ...item,
      studentName: item.studentName || '',
    }));

    storage.saveExamResults(selectedExamId, selectedClassId, calculated);
    setIsSavedSuccess(true);
    showToast('បានរក្សាទុកពិន្ទុ និងគណនាចំណាត់ថ្នាក់ឡើងវិញដោយជោគជ័យ!');
    onRefresh();
    setTimeout(() => setIsSavedSuccess(false), 3000);
  };

  // Add an existing subject to this exam
  const handleAddSubjectToExam = (subjectId: string) => {
    storage.addSubjectToExam(selectedExamId, subjectId);
    setIsAddSubjectModalOpen(false);
    const addedSub = subjects.find((s) => s.id === subjectId);
    showToast(`បានបន្ថែមមុខវិជ្ជា «${addedSub?.nameKm || ''}» ក្នុងការប្រឡង!`);
    onRefresh();
  };

  // Create a brand new subject and add to exam immediately
  const handleCreateAndAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNewSubjectName.trim()) return;

    const newSub = storage.addSubject({
      code: `SUB-0${subjects.length + 1}`,
      nameKm: quickNewSubjectName.trim(),
      nameEn: quickNewSubjectName.trim(),
      gradeLevel: currentClass?.gradeLevel || 'ថ្នាក់ទី ៧',
      hoursPerWeek: 2,
      teacherName: 'គ្រូបង្រៀន',
    });

    storage.addSubjectToExam(selectedExamId, newSub.id);
    setQuickNewSubjectName('');
    setIsAddSubjectModalOpen(false);
    showToast(`បានបង្កើត និងបន្ថែមមុខវិជ្ជា «${newSub.nameKm}» ដោយជោគជ័យ!`);
    onRefresh();
  };

  // Confirm remove subject from exam
  const handleRemoveSubjectFromExam = () => {
    if (!subjectToRemove) return;
    const name = subjectToRemove.nameKm;
    storage.removeSubjectFromExam(selectedExamId, subjectToRemove.id);
    setSubjectToRemove(null);
    showToast(`បានដកមុខវិជ្ជា «${name}» ចេញពីការប្រឡងនេះរួចរាល់!`);
    onRefresh();
  };

  const currentResults = storage.getExamResults(selectedExamId, selectedClassId);
  const totalMaxPossibleScore = examSubjects.length * currentMaxScore;

  // Export to CSV
  const handleExportCsv = () => {
    const headers = ['ចំណាត់ថ្នាក់', 'អត្តលេខ', 'ឈ្មោះសិស្ស', 'ពិន្ទុសរុប', 'មធ្យមភាគ', 'និទ្ទេស', 'ការវាយតម្លៃ'];
    const rows = currentResults.map((r) => {
      const s = students.find((item) => item.id === r.studentId);
      return [
        `"លេខ ${r.rank}"`,
        s?.studentId || '',
        `"${r.studentName || s?.khmerName}"`,
        r.totalScore,
        r.average,
        r.gradeLetter,
        `"${r.remarks}"`,
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `តារាងចំណាត់ថ្នាក់ពិន្ទុ_${currentExam?.title || ''}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage('')}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <h2 className="text-xl font-bold font-moul text-slate-900">
                ការគ្រប់គ្រងពិន្ទុ និងការប្រឡង (Exams & Grades)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              គណនាពិន្ទុសរុប មធ្យមភាគ ចំណាត់ថ្នាក់សិស្ស កំណត់ពិន្ទុពេញ និងបោះពុម្ពព្រឹត្តិបត្រ A4
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>ទាញយក Excel (CSV)</span>
            </button>

            <button
              type="button"
              onClick={() =>
                onPrintOfficialReport('exam', {
                  exam: currentExam,
                  classInfo: currentClass,
                  results: currentResults,
                })
              }
              className="px-4 py-2 text-xs font-semibold bg-blue-900 hover:bg-blue-800 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>ព្រឹត្តិបត្រពិន្ទុ A4</span>
            </button>
          </div>
        </div>

        {/* Filters, Max Score Pre-config & Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              សម័យប្រឡង
            </label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-900 focus:outline-hidden font-medium text-slate-900"
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title} ({ex.semester})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">ថ្នាក់រៀន</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-900 focus:outline-hidden font-medium text-slate-900"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.roomNumber})
                </option>
              ))}
            </select>
          </div>

          {/* Pre-set Max Score Configuration Widget */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span>ពិន្ទុពេញកំណត់ទុកជាមុន</span>
              <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                ត្រឹម ១៥០ ចុះក្រោម
              </span>
            </label>
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <input
                  type="number"
                  min={1}
                  max={150}
                  value={maxScoreInput}
                  onChange={(e) => setMaxScoreInput(Number(e.target.value))}
                  className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl p-2 text-center text-blue-950 focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">
                  /មុខ
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleSaveMaxScore(maxScoreInput)}
                className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex-shrink-0"
                title="រក្សាទុកការកំណត់ពិន្ទុពេញ"
              >
                កំណត់
              </button>
            </div>
            {/* Quick Presets */}
            <div className="flex items-center gap-1 mt-1 text-[10px]">
              <span className="text-slate-400">រហ័ស:</span>
              {[50, 100, 150].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleSaveMaxScore(preset)}
                  className={`px-1.5 py-0.5 rounded cursor-pointer font-mono font-bold transition-colors ${
                    currentMaxScore === preset
                      ? 'bg-blue-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* View Tab Selector */}
          <div className="flex items-end">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-full">
              <button
                type="button"
                onClick={() => setActiveTab('ranking')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'ranking' ? 'bg-white text-blue-950 shadow-xs' : 'text-slate-600'
                }`}
              >
                តារាងចំណាត់ថ្នាក់
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('input')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'input' ? 'bg-white text-blue-950 shadow-xs' : 'text-slate-600'
                }`}
              >
                បញ្ចូលពិន្ទុតាមមុខវិជ្ជា
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab 1: Ranking Table */}
      {activeTab === 'ranking' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900">
                តារាងចំណាត់ថ្នាក់សិស្ស · {currentExam?.title} ({currentClass?.name})
              </h3>
              <p className="text-[10px] text-slate-400">
                គណនាលើ {examSubjects.length} មុខវិជ្ជា (ពិន្ទុពេញក្នុងមួយមុខវិជ្ជា: {currentMaxScore} ពិន្ទុ | ពិន្ទុសរុបពេញ: {totalMaxPossibleScore})
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                សិស្សសរុប: {currentResults.length} នាក់
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('input')}
                className="px-3 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
              >
                + កែសម្រួល/បញ្ចូលពិន្ទុ
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-semibold text-slate-600 border-b border-slate-200">
                  <th className="py-2.5 px-3 text-center w-20">ចំណាត់ថ្នាក់</th>
                  <th className="py-2.5 px-3 w-28">អត្តលេខ</th>
                  <th className="py-2.5 px-3">ឈ្មោះសិស្ស</th>
                  <th className="py-2.5 px-3 text-center">ពិន្ទុសរុប ({totalMaxPossibleScore})</th>
                  <th className="py-2.5 px-3 text-center">មធ្យមភាគ ({currentMaxScore})</th>
                  <th className="py-2.5 px-3 text-center">និទ្ទេស</th>
                  <th className="py-2.5 px-3">ការវាយតម្លៃ</th>
                  <th className="py-2.5 px-3 text-right">ព្រឹត្តិបត្រពិន្ទុ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {currentResults.map((res) => {
                  const s = students.find((item) => item.id === res.studentId);
                  const isTop3 = res.rank <= 3;

                  return (
                    <tr
                      key={res.id}
                      className={`hover:bg-slate-50/60 ${
                        isTop3 ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            res.rank === 1
                              ? 'bg-amber-400 text-slate-950 shadow-xs'
                              : res.rank === 2
                              ? 'bg-slate-200 text-slate-800'
                              : res.rank === 3
                              ? 'bg-amber-100 text-amber-900'
                              : 'text-slate-500 font-mono'
                          }`}
                        >
                          {res.rank === 1
                            ? '🥇 លេខ ១'
                            : res.rank === 2
                            ? '🥈 លេខ ២'
                            : res.rank === 3
                            ? '🥉 លេខ ៣'
                            : `លេខ ${res.rank}`}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono font-medium text-slate-700">
                        {s?.studentId || '—'}
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={safeAvatar(s?.photo)}
                            alt={res.studentName}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <div className="font-bold text-slate-900">{res.studentName}</div>
                            <div className="text-[10px] text-slate-400">{s?.latinName}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center font-bold text-slate-800 font-mono">
                        {res.totalScore}
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-bold text-blue-950 text-sm">
                        {res.average}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md font-bold text-xs ${
                            res.gradeLetter === 'A'
                              ? 'bg-emerald-100 text-emerald-800'
                              : res.gradeLetter === 'B'
                              ? 'bg-blue-100 text-blue-800'
                              : res.gradeLetter === 'C'
                              ? 'bg-amber-100 text-amber-800'
                              : res.gradeLetter === 'D'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {res.gradeLetter}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-slate-700 font-medium">{res.remarks}</td>

                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            onPrintOfficialReport('exam', {
                              exam: currentExam,
                              classInfo: currentClass,
                              results: [res],
                              student: s,
                            })
                          }
                          className="px-2.5 py-1 text-[11px] font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                        >
                          ព្រឹត្តិបត្របុគ្គល
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {currentResults.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-xs text-slate-400">
                      មិនទាន់មានពិន្ទុសម្រាប់ថ្នាក់នេះនៅឡើយទេ សូមចុច «បញ្ចូលពិន្ទុតាមមុខវិជ្ជា»
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Score Input Matrix with Dynamic Add/Remove Subjects */}
      {activeTab === 'input' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Header Controls for Tab 2 */}
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-900">
                  បញ្ចូលពិន្ទុតាមមុខវិជ្ជា · {currentExam?.title} ({currentClass?.name})
                </h3>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-200">
                  ពិន្ទុពេញកំណត់ត្រឹម: {currentMaxScore} / ១៥០
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                លោកអ្នកអាចបន្ថែម ឬដកមុខវិជ្ជាក្នុងការប្រឡងនេះបានយ៉ាងងាយស្រួល · ពិន្ទុនឹងត្រូវបានរក្សាទុកជាអចិន្ត្រៃយ៍
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Button to Add Subject to Exam */}
              <button
                type="button"
                onClick={() => setIsAddSubjectModalOpen(true)}
                className="px-3.5 py-2 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-xl border border-blue-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-blue-700" />
                <span>បន្ថែមមុខវិជ្ជាក្នុងការប្រឡង</span>
              </button>

              {/* Save Button */}
              <button
                type="button"
                onClick={handleSaveScores}
                className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>រក្សាទុកពិន្ទុ និងគណនាចំណាត់ថ្នាក់</span>
              </button>
            </div>
          </div>

          {/* Score Input Matrix Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/90 text-[11px] font-semibold text-slate-700 border-b border-slate-200">
                  <th className="py-2.5 px-3 text-center w-12 sticky left-0 bg-slate-100 z-10">ល.រ</th>
                  <th className="py-2.5 px-3 w-24 sticky left-12 bg-slate-100 z-10">អត្តលេខ</th>
                  <th className="py-2.5 px-3 min-w-[140px] sticky left-36 bg-slate-100 z-10">ឈ្មោះសិស្ស</th>
                  
                  {/* Dynamic Subject Column Headers with Delete / Remove button */}
                  {examSubjects.map((sbj) => (
                    <th key={sbj.id} className="py-2.5 px-2 text-center min-w-[100px] border-l border-slate-200">
                      <div className="flex flex-col items-center gap-0.5">
                        <div className="flex items-center gap-1 justify-center w-full">
                          <span className="font-bold text-slate-900 truncate max-w-[100px]" title={sbj.nameKm}>
                            {sbj.nameKm}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSubjectToRemove(sbj)}
                            title={`ដកមុខវិជ្ជា «${sbj.nameKm}» ចេញពីការប្រឡងនេះ`}
                            className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-[9px] text-amber-700 font-mono font-bold bg-amber-50 px-1 rounded border border-amber-200/60">
                          (ពេញ: {currentMaxScore})
                        </span>
                      </div>
                    </th>
                  ))}

                  {/* Add Subject Header Button Column */}
                  <th className="py-2 px-2 text-center w-24 border-l border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsAddSubjectModalOpen(true)}
                      className="text-[10px] text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md font-semibold flex items-center justify-center gap-1 w-full cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>ថែមមុខវិជ្ជា</span>
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {classStudents.map((student, idx) => {
                  const studentScores = draftScores[student.id] || {};

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono sticky left-0 bg-white">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-700 sticky left-12 bg-white">
                        {student.studentId}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 sticky left-36 bg-white">
                        {student.khmerName}
                      </td>

                      {/* Dynamic Score Inputs */}
                      {examSubjects.map((sbj) => {
                        const val = studentScores[sbj.id] ?? 0;
                        const isOverMax = val > currentMaxScore || val > 150;

                        return (
                          <td key={sbj.id} className="py-2 px-2 text-center border-l border-slate-100">
                            <input
                              type="number"
                              min={0}
                              max={currentMaxScore}
                              value={val}
                              onChange={(e) =>
                                handleScoreChange(student.id, sbj.id, parseFloat(e.target.value))
                              }
                              className={`w-16 text-center text-xs font-mono font-bold p-1 rounded-lg border transition-all focus:outline-hidden ${
                                isOverMax
                                  ? 'bg-rose-50 border-rose-400 text-rose-700 focus:ring-2 focus:ring-rose-500'
                                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-900'
                              }`}
                            />
                          </td>
                        );
                      })}

                      <td className="border-l border-slate-100"></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
            <div>
              💡 <strong>ចំណាំ៖</strong> ពិន្ទុដែលបញ្ចូលមិនអាចលើសពីពិន្ទុអតិបរមា <strong>{currentMaxScore}</strong> (ត្រឹម ១៥០ ចុះក្រោម) បានឡើយ។
            </div>
            <button
              type="button"
              onClick={handleSaveScores}
              className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer w-full sm:w-fit justify-center"
            >
              <Save className="w-4 h-4" />
              <span>រក្សាទុកពិន្ទុ និងគណនាចំណាត់ថ្នាក់</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal: Add Subject to this Exam */}
      {isAddSubjectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-900" />
                <h3 className="text-sm font-bold font-moul text-slate-900">
                  បន្ថែមមុខវិជ្ជាក្នុងការប្រឡង
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddSubjectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mt-4 text-xs">
              {/* Option 1: Choose from existing curriculum subjects */}
              <div>
                <label className="block text-slate-700 font-semibold mb-2">
                  ជ្រើសរើសមុខវិជ្ជាពីកម្មវិធីសិក្សា៖
                </label>
                {availableSubjectsToAdd.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2 bg-slate-50">
                    {availableSubjectsToAdd.map((sbj) => (
                      <div
                        key={sbj.id}
                        onClick={() => handleAddSubjectToExam(sbj.id)}
                        className="p-2.5 bg-white hover:bg-blue-50 rounded-lg border border-slate-200 hover:border-blue-300 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{sbj.nameKm}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {sbj.code} · {sbj.gradeLevel} · {sbj.teacherName || 'គ្រូបង្រៀន'}
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-blue-900 bg-blue-50 px-2 py-1 rounded-md">
                          + បន្ថែម
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 text-amber-800 rounded-xl text-center text-xs">
                    គ្រប់មុខវិជ្ជានៅក្នុងកម្មវិធីសិក្សា ត្រូវបានបន្ថែមរួចរាល់ហើយ
                  </div>
                )}
              </div>

              {/* Option 2: Quick add a custom subject name */}
              <div className="pt-3 border-t border-slate-100">
                <label className="block text-slate-700 font-semibold mb-1">
                  ឬ បង្កើតមុខវិជ្ជាថ្មីភ្លាមៗ៖
                </label>
                <form onSubmit={handleCreateAndAddSubject} className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="វាយឈ្មោះមុខវិជ្ជាថ្មី..."
                    value={quickNewSubjectName}
                    onChange={(e) => setQuickNewSubjectName(e.target.value)}
                    className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:outline-hidden font-bold"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors cursor-pointer flex-shrink-0"
                  >
                    បង្កើត & ថែម
                  </button>
                </form>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddSubjectModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  បិទ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Remove Subject from Exam */}
      {subjectToRemove && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-moul text-slate-900">
                  ដកមុខវិជ្ជាចេញពីការប្រឡង
                </h3>
                <p className="text-[11px] text-slate-400">{currentExam?.title}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              តើអ្នកពិតជាចង់ដកមុខវិជ្ជា <strong className="text-slate-900 font-bold">«{subjectToRemove.nameKm}»</strong> ចេញពីការប្រឡងនេះមែនទេ? ពិន្ទុដែលបានបញ្ចូលសម្រាប់មុខវិជ្ជានេះក្នុងការប្រឡងនេះ នឹងត្រូវសម្អាតចេញពីតារាង។
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSubjectToRemove(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                បោះបង់
              </button>
              <button
                type="button"
                onClick={handleRemoveSubjectFromExam}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                <span>យល់ព្រមដក</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
