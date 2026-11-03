import React, { useState, useRef } from 'react';
import {
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  X,
  FileText,
  UserPlus,
  RefreshCw,
} from 'lucide-react';
import { SchoolClass, Student, Gender } from '../types/index.ts';
import { storage } from '../services/storage.ts';

interface StudentImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: SchoolClass[];
  existingStudents: Student[];
  onImportSuccess: (count: number) => void;
}

interface ParsedStudentRow {
  studentId: string;
  khmerName: string;
  latinName: string;
  gender: Gender;
  dob: string;
  pob: string;
  address: string;
  phone: string;
  parentName: string;
  parentPhone: string;
  parentRelationship: string;
  classId: string;
  className?: string;
  status: 'valid' | 'duplicate_id' | 'missing_name';
  errorMsg?: string;
}

export const StudentImportModal: React.FC<StudentImportModalProps> = ({
  isOpen,
  onClose,
  classes,
  existingStudents,
  onImportSuccess,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [useFileClass, setUseFileClass] = useState<boolean>(true);
  const [rawText, setRawText] = useState<string>('');
  const [isPastingText, setIsPastingText] = useState<boolean>(false);
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [importSummary, setImportSummary] = useState<{ total: number; valid: number; invalid: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Download Sample CSV template
  const handleDownloadTemplate = () => {
    const headers = [
      'អត្តលេខ',
      'ឈ្មោះខ្មែរ',
      'ឈ្មោះឡាតាំង',
      'ភេទ',
      'ថ្ងៃខែឆ្នាំកំណើត(YYYY-MM-DD)',
      'ទីកន្លែងកំណើត',
      'អាសយដ្ឋានបច្ចុប្បន្ន',
      'លេខទូរស័ព្ទ',
      'ឈ្មោះអាណាព្យាបាល',
      'លេខទូរស័ព្ទអាណាព្យាបាល',
      'ទំនាក់ទំនង',
      'ថ្នាក់រៀន',
    ];

    const sampleRows = [
      ['STU-0701', 'ស៊ុយ ចាន់ដារ៉ា', 'Suy Chandara', 'ប្រុស', '2012-05-14', 'កំពង់ចាម', 'ភូមិទួលសំបួរ ឃុំទួលសំបួរ', '097 555 1234', 'ស៊ុយ សុខា', '012 333 444', 'ឪពុក', 'ថ្នាក់ទី ៧ក'],
      ['STU-0702', 'កែវ សោភា', 'Keo Sorphea', 'ស្រី', '2012-08-20', 'កំពង់ចាម', 'ភូមិព្រែកបារាំង ស្ទឹងត្រង់', '097 666 2345', 'កែវ វិបុល', '015 888 999', 'ឪពុក', 'ថ្នាក់ទី ៧ក'],
      ['STU-0801', 'ហេង ពិសិដ្ឋ', 'Heng Piseth', 'ប្រុស', '2011-03-12', 'កំពង់ចាម', 'ភូមិទួលសំបួរ', '097 777 3456', 'ហេង សុផល', '016 777 888', 'ឪពុក', 'ថ្នាក់ទី ៨ក'],
    ];

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...sampleRows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'គំរូនាំចូលសិស្ស_អនុវិទ្យាល័យទួលសំបួរ.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper to parse CSV or Tab-separated text
  const parseContent = (content: string) => {
    const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      setParsedRows([]);
      setImportSummary(null);
      return;
    }

    // Determine delimiter: comma or tab
    const firstLine = lines[0];
    const delimiter = firstLine.includes('\t') ? '\t' : ',';

    // Check if first line is a header
    const hasHeader =
      firstLine.includes('ឈ្មោះ') ||
      firstLine.includes('អត្តលេខ') ||
      firstLine.includes('name') ||
      firstLine.includes('id');

    const dataLines = hasHeader ? lines.slice(1) : lines;

    const existingIdSet = new Set(existingStudents.map((s) => s.studentId.toLowerCase().trim()));

    const parsed: ParsedStudentRow[] = dataLines.map((line, idx) => {
      // Handle CSV quoted strings
      const regex = delimiter === ','
        ? /(?:\"([^\"]*(?:\"\"[^\"]*)*)\")|([^\",]+)/g
        : /(?:\"([^\"]*(?:\"\"[^\"]*)*)\")|([^\t]+)/g;

      const cells: string[] = [];
      let match;
      while ((match = regex.exec(line)) !== null) {
        cells.push((match[1] || match[2] || '').trim().replace(/\"\"/g, '"'));
      }

      // Fallback simple split if regex misses
      const row = cells.length >= 2 ? cells : line.split(delimiter).map((c) => c.trim().replace(/^"|"$/g, ''));

      const studentId = row[0] || `STU-${Date.now().toString().slice(-4)}${idx + 1}`;
      const khmerName = row[1] || '';
      const latinName = row[2] || '';
      const genderRaw = (row[3] || 'ប្រុស').trim();
      const gender: Gender = genderRaw.includes('ស្រី') || genderRaw.toLowerCase().includes('f') ? 'ស្រី' : 'ប្រុស';
      const dob = row[4] || '2012-01-01';
      const pob = row[5] || 'កំពង់ចាម';
      const address = row[6] || 'ឃុំទួលសំបួរ ស្រុកស្ទឹងត្រង់';
      const phone = row[7] || '';
      const parentName = row[8] || '';
      const parentPhone = row[9] || '';
      const parentRelationship = row[10] || 'អាណាព្យាបាល';
      const classNameInFile = row[11] || '';

      // Determine class
      let targetClassId = selectedClassId;
      if (useFileClass && classNameInFile) {
        const matched = classes.find(
          (c) =>
            c.name.toLowerCase().includes(classNameInFile.toLowerCase()) ||
            classNameInFile.toLowerCase().includes(c.name.toLowerCase())
        );
        if (matched) targetClassId = matched.id;
      }

      // Validate
      let status: 'valid' | 'duplicate_id' | 'missing_name' = 'valid';
      let errorMsg = '';

      if (!khmerName.trim()) {
        status = 'missing_name';
        errorMsg = 'ខ្វះឈ្មោះខ្មែរ';
      } else if (existingIdSet.has(studentId.toLowerCase().trim())) {
        status = 'duplicate_id';
        errorMsg = `អត្តលេខ ${studentId} មានរួចហើយ`;
      }

      return {
        studentId,
        khmerName,
        latinName,
        gender,
        dob,
        pob,
        address,
        phone,
        parentName,
        parentPhone,
        parentRelationship,
        classId: targetClassId,
        className: classes.find((c) => c.id === targetClassId)?.name || 'ថ្នាក់រៀន',
        status,
        errorMsg,
      };
    });

    setParsedRows(parsed);
    setImportSummary({
      total: parsed.length,
      valid: parsed.filter((r) => r.status === 'valid').length,
      invalid: parsed.filter((r) => r.status !== 'valid').length,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRawText(text);
      parseContent(text);
    };
    reader.readAsText(file);
  };

  const handleApplyPastedText = () => {
    parseContent(rawText);
  };

  const handleExecuteImport = () => {
    const validRows = parsedRows.filter((r) => r.status === 'valid');
    if (validRows.length === 0) {
      alert('មិនមានទិន្នន័យសិស្សត្រឹមត្រូវសម្រាប់នាំចូលទេ!');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      const formatted = validRows.map((r) => ({
        studentId: r.studentId,
        photo: r.gender === 'ស្រី'
          ? 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150'
          : 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
        khmerName: r.khmerName,
        latinName: r.latinName,
        gender: r.gender,
        dob: r.dob,
        pob: r.pob,
        address: r.address,
        phone: r.phone,
        parentName: r.parentName,
        parentPhone: r.parentPhone,
        parentRelationship: r.parentRelationship,
        classId: r.classId,
        status: 'កំពុងសិក្សា' as const,
        enrollmentYear: '២០២៥-២០២៦',
      }));

      storage.bulkAddStudents(formatted);
      setIsProcessing(false);
      onImportSuccess(validRows.length);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col font-khmer">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 font-moul leading-relaxed">
                នាំចូលសិស្សពី Excel / CSV (Bulk Import)
              </h2>
              <p className="text-xs text-slate-500">
                បញ្ចូលបញ្ជីឈ្មោះសិស្សរាប់រយនាក់ក្នុងពេលតែមួយចុច ដោយសុវត្ថិភាព
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Action Row: Download Template & Target Class */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                ជំហានទី ១៖ ទាញយកទម្រង់គំរូ Excel / CSV
              </label>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="w-full py-2 px-3 text-xs font-bold bg-white hover:bg-emerald-50 text-emerald-800 border-2 border-emerald-300 rounded-xl transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>ទាញយកគំរូ CSV (Sample Template)</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                ជំហានទី ២៖ កំណត់ថ្នាក់រៀនគោលដៅ
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="flex-1 text-xs bg-white border border-slate-300 rounded-xl p-2 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.roomNumber})
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useFileClass}
                    onChange={(e) => setUseFileClass(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>តាមឈ្មោះថ្នាក់ក្នុង File</span>
                </label>
              </div>
            </div>
          </div>

          {/* Upload Box or Paste Text */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                ជំហានទី ៣៖ ជ្រើសរើសឯកសារ ឬចម្លងដាក់ (Paste Text)
              </label>
              <button
                type="button"
                onClick={() => setIsPastingText(!isPastingText)}
                className="text-[11px] font-bold text-blue-800 hover:underline cursor-pointer"
              >
                {isPastingText ? '← ជ្រើសរើស Upload File' : 'ឬ ចម្លងទិន្នន័យដាក់ផ្ទាល់ (Paste)'}
              </button>
            </div>

            {!isPastingText ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/80 rounded-2xl p-6 text-center transition-all cursor-pointer group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv, .txt, .tsv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold text-slate-800">
                  ចុចទីនេះដើម្បីជ្រើសរើសឯកសារ CSV ឬទាញទម្លាក់ចូល
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  គាំទ្រឯកសារ .CSV ឬ .TXT (សរសេរជាភាសាខ្មែរ Unicode ត្រឹមត្រូវ)
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <textarea
                  rows={4}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`ចម្លង (Copy) បញ្ជីសិស្សពី Excel រួចដាក់ចូលទីនេះ (Ctrl+V)...`}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                ></textarea>
                <button
                  type="button"
                  onClick={handleApplyPastedText}
                  className="px-4 py-1.5 text-xs font-bold bg-blue-900 text-white rounded-lg hover:bg-blue-800 cursor-pointer"
                >
                  ពិនិត្យទិន្នន័យដែលបាន Paste
                </button>
              </div>
            )}
          </div>

          {/* Import Summary Badge */}
          {importSummary && (
            <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center gap-3">
                <span className="text-slate-700">សរុប៖ <strong>{importSummary.total} នាក់</strong></span>
                <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                  ត្រឹមត្រូវ៖ <strong>{importSummary.valid} នាក់</strong>
                </span>
                {importSummary.invalid > 0 && (
                  <span className="text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                    មានបញ្ហា៖ <strong>{importSummary.invalid} នាក់</strong>
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setParsedRows([]);
                  setImportSummary(null);
                  setRawText('');
                }}
                className="text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                សម្អាតឡើងវិញ
              </button>
            </div>
          )}

          {/* Preview Table */}
          {parsedRows.length > 0 && (
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="max-h-56 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 text-[11px] font-bold text-slate-700 sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-2.5 text-center w-10">ល.រ</th>
                      <th className="py-2 px-2.5">អត្តលេខ</th>
                      <th className="py-2 px-2.5">ឈ្មោះខ្មែរ</th>
                      <th className="py-2 px-2.5">ឡាតាំង</th>
                      <th className="py-2 px-2.5">ភេទ</th>
                      <th className="py-2 px-2.5">ថ្ងៃខែឆ្នាំកំណើត</th>
                      <th className="py-2 px-2.5">ថ្នាក់រៀន</th>
                      <th className="py-2 px-2.5 text-center">ស្ថានភាព</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((row, idx) => (
                      <tr
                        key={idx}
                        className={row.status === 'valid' ? 'hover:bg-slate-50' : 'bg-rose-50/60'}
                      >
                        <td className="py-2 px-2.5 text-center text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-2.5 font-mono font-bold text-slate-900">
                          {row.studentId}
                        </td>
                        <td className="py-2 px-2.5 font-bold text-slate-900">
                          {row.khmerName}
                        </td>
                        <td className="py-2 px-2.5 text-slate-600 font-mono text-[11px]">
                          {row.latinName || '-'}
                        </td>
                        <td className="py-2 px-2.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              row.gender === 'ស្រី'
                                ? 'bg-pink-100 text-pink-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {row.gender}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 font-mono text-[11px] text-slate-600">
                          {row.dob}
                        </td>
                        <td className="py-2 px-2.5 font-bold text-blue-900">
                          {row.className}
                        </td>
                        <td className="py-2 px-2.5 text-center">
                          {row.status === 'valid' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>ត្រឹមត្រូវ</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded font-bold">
                              <AlertCircle className="w-3 h-3 text-rose-600" />
                              <span>{row.errorMsg}</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3.5 border-t border-slate-100 flex-shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            ទិន្នន័យនឹងធ្វើសមកាលកម្មទៅកាន់ Central Cloud Database ភ្លាមៗ
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
            >
              បោះបង់
            </button>
            <button
              type="button"
              disabled={isProcessing || !parsedRows.some((r) => r.status === 'valid')}
              onClick={handleExecuteImport}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 disabled:pointer-events-none rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>កំពុងនាំចូលទិន្នន័យ...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>
                    នាំចូលសិស្ស ({parsedRows.filter((r) => r.status === 'valid').length} នាក់)
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
