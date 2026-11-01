import { AttendanceRecord, AttendanceStatus, ExamResult } from '../types/index.ts';

export interface AttendanceStats {
  total: number;
  present: number;
  absentPermission: number;
  absentNoPermission: number;
  late: number;
  earlyLeave: number;
  attendanceRate: number; // percentage (0 - 100)
}

/**
 * Calculates attendance metrics given an array of attendance records
 */
export function calculateAttendanceStats(records: AttendanceRecord[]): AttendanceStats {
  const total = records.length;
  if (total === 0) {
    return {
      total: 0,
      present: 0,
      absentPermission: 0,
      absentNoPermission: 0,
      late: 0,
      earlyLeave: 0,
      attendanceRate: 100,
    };
  }

  let present = 0;
  let absentPermission = 0;
  let absentNoPermission = 0;
  let late = 0;
  let earlyLeave = 0;

  for (const r of records) {
    switch (r.status) {
      case 'present':
        present++;
        break;
      case 'absent_permission':
        absentPermission++;
        break;
      case 'absent_no_permission':
        absentNoPermission++;
        break;
      case 'late':
        late++;
        break;
      case 'early_leave':
        earlyLeave++;
        break;
    }
  }

  // Attendance rate considers present, late, earlyLeave as attending; unexcused absence is 0, excused is counted with partial/separate weighting
  // Standard Cambodian secondary education formula: (Present + Late + EarlyLeave) / Total * 100
  const attendedCount = present + late + earlyLeave;
  const attendanceRate = Number(((attendedCount / total) * 100).toFixed(1));

  return {
    total,
    present,
    absentPermission,
    absentNoPermission,
    late,
    earlyLeave,
    attendanceRate,
  };
}

/**
 * Classifies a Cambodian secondary school grade average into Ministry standard label
 */
export function classifyGrade(
  average: number,
  maxScore: number = 50
): { labelKm: string; gradeLetter: string; isPassed: boolean } {
  const effectiveMax = maxScore > 0 ? maxScore : 50;
  const ratio = average / effectiveMax;

  if (ratio >= 0.90) {
    return { labelKm: 'ល្អប្រសើរ (និទ្ទេស A)', gradeLetter: 'A', isPassed: true };
  } else if (ratio >= 0.80) {
    return { labelKm: 'ល្អណាស់ (និទ្ទេស B)', gradeLetter: 'B', isPassed: true };
  } else if (ratio >= 0.70) {
    return { labelKm: 'ល្អ (និទ្ទេស C)', gradeLetter: 'C', isPassed: true };
  } else if (ratio >= 0.50) {
    return { labelKm: 'មធ្យម (និទ្ទេស D)', gradeLetter: 'D', isPassed: true };
  } else {
    return { labelKm: 'ខ្សោយ (ធ្លាក់)', gradeLetter: 'F', isPassed: false };
  }
}

/**
 * Calculates total scores, averages, ranks, and grade classifications for students
 */
export function calculateRankings(
  records: Array<{
    studentId: string;
    studentName?: string;
    scores: Record<string, number>;
  }>,
  maxScorePerSubject: number = 50
): Array<{
  studentId: string;
  studentName?: string;
  scores: Record<string, number>;
  totalScore: number;
  average: number;
  rank: number;
  gradeLetter: string;
  remarks: string;
}> {
  const processed = records.map((item) => {
    const scoreValues = Object.values(item.scores);
    const count = scoreValues.length > 0 ? scoreValues.length : 1;
    const totalScore = Number(scoreValues.reduce((acc, curr) => acc + (Number(curr) || 0), 0).toFixed(2));
    const average = Number((totalScore / count).toFixed(2));
    const classification = classifyGrade(average, maxScorePerSubject);

    return {
      studentId: item.studentId,
      studentName: item.studentName,
      scores: item.scores,
      totalScore,
      average,
      rank: 0,
      gradeLetter: classification.gradeLetter,
      remarks: classification.labelKm,
    };
  });

  // Sort descending by total score
  processed.sort((a, b) => b.totalScore - a.totalScore);

  // Assign ranks
  let currentRank = 1;
  for (let i = 0; i < processed.length; i++) {
    if (i > 0 && processed[i].totalScore < processed[i - 1].totalScore) {
      currentRank = i + 1;
    }
    processed[i].rank = currentRank;
  }

  return processed;
}

/**
 * Detects if a student has exceeded the warning threshold of unexcused absences
 * Standard Toulsambour secondary school policy: >= 3 unexcused absences triggers warning
 */
export function checkAbsenceWarning(studentRecords: AttendanceRecord[], threshold = 3): {
  isWarned: boolean;
  unexcusedCount: number;
  totalAbsences: number;
  warningMessage?: string;
} {
  let unexcusedCount = 0;
  let totalAbsences = 0;

  for (const record of studentRecords) {
    if (record.status === 'absent_no_permission') {
      unexcusedCount++;
      totalAbsences++;
    } else if (record.status === 'absent_permission') {
      totalAbsences++;
    }
  }

  const isWarned = unexcusedCount >= threshold;
  const warningMessage = isWarned
    ? `សិស្សមានអវត្តមានឥតច្បាប់ចំនួន ${unexcusedCount} លើក (លើសកម្រិតកំណត់ ${threshold} លើក)។ ត្រូវជូនដំណឹងបន្ទាន់ដល់អាណាព្យាបាល!`
    : undefined;

  return {
    isWarned,
    unexcusedCount,
    totalAbsences,
    warningMessage,
  };
}

/**
 * Formats a Khmer date string e.g. ថ្ងៃសុក្រ ទី៣០ ខែតុលា ឆ្នាំ២០២៦
 */
export function formatKhmerDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const khmerDays = ['អាទិត្យ', 'ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'];
    const khmerMonths = [
      'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
      'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'
    ];
    const khmerNumbers = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];

    const toKhmerNumber = (num: number): string => {
      return num.toString().split('').map(d => khmerNumbers[parseInt(d, 10)] ?? d).join('');
    };

    const dayName = khmerDays[date.getDay()];
    const day = toKhmerNumber(date.getDate());
    const month = khmerMonths[date.getMonth()];
    const year = toKhmerNumber(date.getFullYear());

    return `ថ្ងៃ${dayName} ទី${day} ខែ${month} ឆ្នាំ${year}`;
  } catch {
    return dateString;
  }
}

/**
 * Converts status code to Cambodian display label and color theme
 */
export function getAttendanceStatusBadge(status: AttendanceStatus): {
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
} {
  switch (status) {
    case 'present':
      return {
        label: 'មានវត្តមាន',
        bgClass: 'bg-emerald-50 text-emerald-800',
        textClass: 'text-emerald-700',
        borderClass: 'border-emerald-200',
      };
    case 'absent_permission':
      return {
        label: 'អវត្តមានមានច្បាប់',
        bgClass: 'bg-amber-50 text-amber-800',
        textClass: 'text-amber-700',
        borderClass: 'border-amber-200',
      };
    case 'absent_no_permission':
      return {
        label: 'អវត្តមានឥតច្បាប់',
        bgClass: 'bg-rose-50 text-rose-800',
        textClass: 'text-rose-700',
        borderClass: 'border-rose-200',
      };
    case 'late':
      return {
        label: 'មកយឺត',
        bgClass: 'bg-orange-50 text-orange-800',
        textClass: 'text-orange-700',
        borderClass: 'border-orange-200',
      };
    case 'early_leave':
      return {
        label: 'ចេញមុនម៉ោង',
        bgClass: 'bg-purple-50 text-purple-800',
        textClass: 'text-purple-700',
        borderClass: 'border-purple-200',
      };
  }
}
