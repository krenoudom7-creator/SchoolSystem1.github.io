import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAttendanceStats,
  classifyGrade,
  calculateRankings,
  checkAbsenceWarning,
  formatKhmerDate,
  getAttendanceStatusBadge,
} from './calculations.ts';
import { AttendanceRecord } from '../types/index.ts';

test('calculateAttendanceStats calculates correct percentages and counts', () => {
  const records: AttendanceRecord[] = [
    { id: '1', sessionId: 's1', studentId: 'stu1', classId: 'c1', date: '2026-10-30', status: 'present', recordedBy: 'u1', createdAt: '2026-10-30' },
    { id: '2', sessionId: 's1', studentId: 'stu2', classId: 'c1', date: '2026-10-30', status: 'present', recordedBy: 'u1', createdAt: '2026-10-30' },
    { id: '3', sessionId: 's1', studentId: 'stu3', classId: 'c1', date: '2026-10-30', status: 'absent_permission', recordedBy: 'u1', createdAt: '2026-10-30' },
    { id: '4', sessionId: 's1', studentId: 'stu4', classId: 'c1', date: '2026-10-30', status: 'absent_no_permission', recordedBy: 'u1', createdAt: '2026-10-30' },
    { id: '5', sessionId: 's1', studentId: 'stu5', classId: 'c1', date: '2026-10-30', status: 'late', recordedBy: 'u1', createdAt: '2026-10-30' },
  ];

  const stats = calculateAttendanceStats(records);
  assert.equal(stats.total, 5);
  assert.equal(stats.present, 2);
  assert.equal(stats.absentPermission, 1);
  assert.equal(stats.absentNoPermission, 1);
  assert.equal(stats.late, 1);
  assert.equal(stats.earlyLeave, 0);
  // (2 present + 1 late) / 5 = 60.0%
  assert.equal(stats.attendanceRate, 60);
});

test('classifyGrade correctly determines letter and pass/fail', () => {
  const a = classifyGrade(48);
  assert.equal(a.gradeLetter, 'A');
  assert.equal(a.isPassed, true);

  const b = classifyGrade(41);
  assert.equal(b.gradeLetter, 'B');
  assert.equal(b.isPassed, true);

  const c = classifyGrade(36);
  assert.equal(c.gradeLetter, 'C');
  assert.equal(c.isPassed, true);

  const d = classifyGrade(28);
  assert.equal(d.gradeLetter, 'D');
  assert.equal(d.isPassed, true);

  const f = classifyGrade(20);
  assert.equal(f.gradeLetter, 'F');
  assert.equal(f.isPassed, false);
});

test('calculateRankings orders students by total score and computes ranks accurately', () => {
  const students = [
    { studentId: 's1', studentName: 'សុខា', scores: { math: 40, khmer: 45 } }, // total 85, avg 42.5
    { studentId: 's2', studentName: 'ចន្ថា', scores: { math: 50, khmer: 50 } }, // total 100, avg 50
    { studentId: 's3', studentName: 'វិសាល', scores: { math: 30, khmer: 35 } }, // total 65, avg 32.5
  ];

  const results = calculateRankings(students);
  assert.equal(results[0].studentId, 's2');
  assert.equal(results[0].rank, 1);
  assert.equal(results[0].gradeLetter, 'A');

  assert.equal(results[1].studentId, 's1');
  assert.equal(results[1].rank, 2);
  assert.equal(results[1].gradeLetter, 'B');

  assert.equal(results[2].studentId, 's3');
  assert.equal(results[2].rank, 3);
});

test('checkAbsenceWarning detects unexcused absences threshold', () => {
  const unexcused: AttendanceRecord[] = [
    { id: '1', sessionId: 's1', studentId: 's1', classId: 'c1', date: '2026-10-01', status: 'absent_no_permission', recordedBy: 'u1', createdAt: '2026-10-01' },
    { id: '2', sessionId: 's2', studentId: 's1', classId: 'c1', date: '2026-10-05', status: 'absent_no_permission', recordedBy: 'u1', createdAt: '2026-10-05' },
    { id: '3', sessionId: 's3', studentId: 's1', classId: 'c1', date: '2026-10-12', status: 'absent_no_permission', recordedBy: 'u1', createdAt: '2026-10-12' },
  ];

  const check = checkAbsenceWarning(unexcused, 3);
  assert.equal(check.isWarned, true);
  assert.equal(check.unexcusedCount, 3);
  assert.ok(check.warningMessage?.includes('សិស្សមានអវត្តមានឥតច្បាប់'));
});

test('getAttendanceStatusBadge returns proper Khmer label', () => {
  assert.equal(getAttendanceStatusBadge('present').label, 'មានវត្តមាន');
  assert.equal(getAttendanceStatusBadge('absent_permission').label, 'អវត្តមានមានច្បាប់');
  assert.equal(getAttendanceStatusBadge('absent_no_permission').label, 'អវត្តមានឥតច្បាប់');
  assert.equal(getAttendanceStatusBadge('late').label, 'មកយឺត');
  assert.equal(getAttendanceStatusBadge('early_leave').label, 'ចេញមុនម៉ោង');
});
