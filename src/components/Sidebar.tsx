import React from 'react';
import {
  LayoutDashboard,
  CalendarCheck2,
  FileSpreadsheet,
  Users,
  GraduationCap,
  School,
  BookOpen,
  CalendarDays,
  Award,
  CalendarRange,
  Send,
  Database,
  ChevronRight,
  Shield,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { UserRole } from '../types/index.ts';
import { SCHOOL_LOGO_URL } from '../utils/schoolLogo.ts';

export type NavTab =
  | 'dashboard'
  | 'attendance'
  | 'attendance_reports'
  | 'grades'
  | 'timetable'
  | 'students'
  | 'teachers'
  | 'classes'
  | 'subjects'
  | 'academic_year'
  | 'telegram'
  | 'security_db'
  | 'users';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  userRole: UserRole;
  unexcusedCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  userRole,
  unexcusedCount,
}) => {
  interface NavItem {
    id: NavTab;
    label: string;
    sublabel: string;
    icon: React.ElementType;
    badge?: number | string;
    badgeColor?: string;
    allowedRoles: UserRole[];
    isHighlighted?: boolean;
  }

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'ផ្ទាំងគ្រប់គ្រង',
      sublabel: 'Dashboard Overview',
      icon: LayoutDashboard,
      allowedRoles: ['admin', 'director', 'teacher', 'student', 'parent'],
    },
    {
      id: 'attendance',
      label: 'កត់ត្រាវត្តមាន',
      sublabel: 'Daily Attendance',
      icon: CalendarCheck2,
      isHighlighted: true,
      allowedRoles: ['admin', 'director', 'teacher'],
    },
    {
      id: 'attendance_reports',
      label: 'របាយការណ៍វត្តមាន',
      sublabel: 'Attendance Reports & Stats',
      icon: FileSpreadsheet,
      badge: unexcusedCount > 0 ? `${unexcusedCount} ឥតច្បាប់` : undefined,
      badgeColor: 'bg-rose-100 text-rose-700',
      allowedRoles: ['admin', 'director', 'teacher', 'student', 'parent'],
    },
    {
      id: 'grades',
      label: 'ពិន្ទុ និងការប្រឡង',
      sublabel: 'Grades, Rankings & Cards',
      icon: Award,
      allowedRoles: ['admin', 'director', 'teacher', 'student', 'parent'],
    },
    {
      id: 'timetable',
      label: 'កាលវិភាគសិក្សា',
      sublabel: 'Weekly Class Timetable',
      icon: CalendarDays,
      allowedRoles: ['admin', 'director', 'teacher', 'student', 'parent'],
    },
    {
      id: 'students',
      label: 'គ្រប់គ្រងសិស្ស',
      sublabel: 'Student Directory',
      icon: Users,
      allowedRoles: ['admin', 'director', 'teacher'],
    },
    {
      id: 'teachers',
      label: 'គ្រប់គ្រងគ្រូបង្រៀន',
      sublabel: 'Teacher Staff Directory',
      icon: GraduationCap,
      allowedRoles: ['admin', 'director'],
    },
    {
      id: 'classes',
      label: 'ថ្នាក់ និងបន្ទប់រៀន',
      sublabel: 'Classes & Grade Levels',
      icon: School,
      allowedRoles: ['admin', 'director', 'teacher'],
    },
    {
      id: 'subjects',
      label: 'មុខវិជ្ជាសិក្សា',
      sublabel: 'Curriculum & Subjects',
      icon: BookOpen,
      allowedRoles: ['admin', 'director', 'teacher'],
    },
    {
      id: 'academic_year',
      label: 'ឆ្នាំសិក្សា',
      sublabel: 'Academic Years & Terms',
      icon: CalendarRange,
      allowedRoles: ['admin', 'director'],
    },
    {
      id: 'telegram',
      label: 'Telegram & ជូនដំណឹង',
      sublabel: 'Telegram Bot & SMS Alerts',
      icon: Send,
      allowedRoles: ['admin', 'director', 'teacher'],
    },
    {
      id: 'security_db',
      label: 'Database & សុវត្ថិភាព',
      sublabel: 'Schema, RBAC & Backup',
      icon: Database,
      allowedRoles: ['admin', 'director'],
    },
    {
      id: 'users',
      label: 'គ្រប់គ្រង Admin & Users',
      sublabel: 'Admin Accounts & Passwords',
      icon: ShieldCheck,
      allowedRoles: ['admin', 'director'],
    },
  ];

  // In Single Unified System Mode: All modules are fully unlocked for all staff!
  const visibleItems = navItems;

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex-shrink-0 flex flex-col justify-between border-r border-slate-800 no-print min-h-[calc(100vh-4rem)]">
      <div className="p-3">
        {/* School Logo Brand Card */}
        <div className="mb-3 p-3 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700/60 shadow-xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-full p-0.5 bg-white border-2 border-amber-400 shadow-sm flex items-center justify-center flex-shrink-0 overflow-hidden">
            <img
              src={SCHOOL_LOGO_URL}
              alt="Logo អនុវិទ្យាល័យ ហ៊ុន សែន ទួលសំបួរ"
              className="w-full h-full object-cover scale-[1.38] rounded-full"
            />
          </div>
          <div className="min-w-0">
            <div className="font-moul text-xs text-amber-400 font-bold truncate">
              អនុវិទ្យាល័យ ហ៊ុន សែន
            </div>
            <div className="text-[10px] text-slate-300 font-medium truncate">
              ទួលសំបួរ · ស្ទឹងត្រង់
            </div>
          </div>
        </div>

        {/* Navigation Category Label */}
        <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          ម៉ឺនុយចម្បង (Navigation)
        </div>

        {/* Links */}
        <nav className="space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`w-full group flex items-center justify-between px-3 py-2.5 text-xs rounded-xl font-medium transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-amber-400 text-slate-950 font-semibold shadow-sm'
                    : item.isHighlighted
                    ? 'bg-blue-900/60 text-blue-100 hover:bg-blue-800/80 border border-blue-700/50'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 ${
                      isActive
                        ? 'text-slate-950'
                        : item.isHighlighted
                        ? 'text-amber-400'
                        : 'text-slate-400 group-hover:text-amber-400'
                    }`}
                  />
                  <div className="truncate">
                    <div className="truncate">{item.label}</div>
                    <div
                      className={`text-[10px] truncate ${
                        isActive ? 'text-slate-800 font-normal' : 'text-slate-400'
                      }`}
                    >
                      {item.sublabel}
                    </div>
                  </div>
                </div>

                {item.badge && (
                  <span
                    className={`px-1.5 py-0.5 text-[9px] font-bold rounded-md flex-shrink-0 ${
                      isActive ? 'bg-slate-900 text-amber-300' : item.badgeColor || 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* School Footer info */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="text-[11px] font-semibold text-slate-300">ប្រព័ន្ធដំណើរការធម្មតា</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            កំណែទម្រង់ ២.៥ · អនុវិទ្យាល័យទួលសំបួរ
          </div>
        </div>
      </div>
    </aside>
  );
};
