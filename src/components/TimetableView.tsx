import React, { useState } from 'react';
import {
  CalendarDays,
  Printer,
  Plus,
  Clock,
  School,
  GraduationCap,
  X,
  Filter,
} from 'lucide-react';
import { TimetableSlot, SchoolClass, Teacher, Subject } from '../types/index.ts';
import { storage } from '../services/storage.ts';

interface TimetableViewProps {
  classes: SchoolClass[];
  teachers: Teacher[];
  subjects: Subject[];
}

export const TimetableView: React.FC<TimetableViewProps> = ({
  classes,
  teachers,
  subjects,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || 'cls-7a');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('all');
  const [filterMode, setFilterMode] = useState<'class' | 'teacher'>('class');

  const days: ('ច័ន្ទ' | 'អង្គារ' | 'ពុធ' | 'ព្រហស្បតិ៍' | 'សុក្រ' | 'សៅរ៍')[] = [
    'ច័ន្ទ',
    'អង្គារ',
    'ពុធ',
    'ព្រហស្បតិ៍',
    'សុក្រ',
    'សៅរ៍',
  ];

  const periods = [
    { num: 1, time: '០៧:០០ - ០៧:៥០' },
    { num: 2, time: '០៧:៥៥ - ០៨:៤៥' },
    { num: 3, time: '០៩:០០ - ០៩:៥០' },
    { num: 4, time: '០៩:៥៥ - ១០:៤៥' },
  ];

  const timetableSlots = storage.getTimetable(
    filterMode === 'class' ? selectedClassId : undefined,
    filterMode === 'teacher' && selectedTeacherId !== 'all' ? selectedTeacherId : undefined
  );

  const currentClass = classes.find((c) => c.id === selectedClassId);
  const currentTeacher = teachers.find((t) => t.id === selectedTeacherId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-blue-900" />
              <h2 className="text-xl font-bold font-moul text-slate-900">
                កាលវិភាគសិក្សាប្រចាំសប្ដាហ៍ (Weekly Timetable)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              កាលវិភាគបង្រៀន និងរៀន ពីថ្ងៃច័ន្ទ ដល់ថ្ងៃសៅរ៍ សម្រាប់សិស្ស និងគ្រូ
            </p>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 text-xs font-semibold bg-blue-900 hover:bg-blue-800 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer no-print"
          >
            <Printer className="w-4 h-4" />
            <span>បោះពុម្ពកាលវិភាគ</span>
          </button>
        </div>

        {/* Filter Switcher */}
        <div className="flex items-center gap-4 mt-5 pt-4 border-t border-slate-100 flex-wrap no-print">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setFilterMode('class')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                filterMode === 'class' ? 'bg-white text-blue-950 shadow-xs' : 'text-slate-600'
              }`}
            >
              មើលតាមថ្នាក់រៀន
            </button>
            <button
              onClick={() => setFilterMode('teacher')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                filterMode === 'teacher' ? 'bg-white text-blue-950 shadow-xs' : 'text-slate-600'
              }`}
            >
              មើលតាមគ្រូបង្រៀន
            </button>
          </div>

          {filterMode === 'class' ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">ជ្រើសរើសថ្នាក់៖</span>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5 font-bold text-slate-900 focus:outline-hidden"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.roomNumber})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">ជ្រើសរើសគ្រូ៖</span>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5 font-bold text-slate-900 focus:outline-hidden"
              >
                <option value="all">គ្រូទាំងអស់</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.subjects.join(', ')})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Timetable Weekly Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 overflow-hidden">
        <div className="mb-4 text-center">
          <h3 className="font-moul text-sm text-blue-950">
            {filterMode === 'class'
              ? `កាលវិភាគសិក្សា ${currentClass?.name || ''} · ${currentClass?.roomNumber || ''}`
              : `កាលវិភាគបង្រៀន ${currentTeacher?.name || 'គ្រូទាំងអស់'}`}
          </h3>
          <p className="text-[11px] text-slate-500">
            អនុវិទ្យាល័យទួលសំបួរ · ឆ្នាំសិក្សា ២០២៥-២០២៦ · វេនព្រឹក
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-slate-200 text-center">
            <thead>
              <tr className="bg-slate-100 text-xs font-semibold text-slate-700">
                <th className="border border-slate-200 p-2.5 w-28">ម៉ោងសិក្សា</th>
                {days.map((day) => (
                  <th key={day} className="border border-slate-200 p-2.5">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map((p) => (
                <tr key={p.num} className="hover:bg-slate-50/50">
                  <td className="border border-slate-200 p-2.5 bg-slate-50/80">
                    <div className="font-bold text-xs text-slate-800">ម៉ោងទី {p.num}</div>
                    <div className="text-[10px] text-slate-400 font-sans">{p.time}</div>
                  </td>

                  {days.map((day) => {
                    const slot = timetableSlots.find(
                      (s) => s.dayOfWeek === day && s.period === p.num
                    );

                    return (
                      <td key={day} className="border border-slate-200 p-2 h-20 align-middle">
                        {slot ? (
                          <div className="bg-blue-50/80 border border-blue-200/80 rounded-lg p-2 text-left h-full flex flex-col justify-between">
                            <div>
                              <div className="font-bold text-xs text-blue-950">
                                {slot.subjectName}
                              </div>
                              <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <GraduationCap className="w-3 h-3 text-slate-400" />
                                <span>{slot.teacherName}</span>
                              </div>
                            </div>
                            <div className="text-[9px] font-mono font-semibold text-blue-800/80 text-right">
                              {slot.room}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-300 italic">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
