import React, { useState } from 'react';
import {
  Bell,
  GraduationCap,
  Calendar,
  UserCheck,
  ChevronDown,
  ShieldCheck,
  AlertTriangle,
  School,
  ExternalLink,
  Key,
  Lock,
  LogOut,
} from 'lucide-react';
import { User, UserRole, NotificationItem } from '../types/index.ts';
import { formatKhmerDate } from '../utils/calculations.ts';
import { safeAvatar, DEFAULT_ADMIN_AVATAR, SCHOOL_LOGO_URL } from '../utils/avatar.ts';

interface HeaderProps {
  currentUser: User;
  onSwitchUser: (user: User) => void;
  allUsers: User[];
  notifications: NotificationItem[];
  onOpenNotifications: () => void;
  onOpenTelegramModal: () => void;
  onOpenLoginModal: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onSwitchUser,
  allUsers,
  notifications,
  onOpenNotifications,
  onOpenTelegramModal,
  onOpenLoginModal,
  onLogout,
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const khmerDateStr = formatKhmerDate(todayStr);

  const roleLabels: Record<UserRole, { label: string; badgeColor: string }> = {
    admin: { label: 'អភិបាលប្រព័ន្ធ (Admin)', badgeColor: 'bg-rose-100 text-rose-800' },
    director: { label: 'នាយកសាលា (Director)', badgeColor: 'bg-amber-100 text-amber-900' },
    teacher: { label: 'គ្រូបង្រៀន (Teacher)', badgeColor: 'bg-blue-100 text-blue-900' },
    student: { label: 'សិស្ស (Student)', badgeColor: 'bg-emerald-100 text-emerald-900' },
    parent: { label: 'អាណាព្យាបាល (Parent)', badgeColor: 'bg-purple-100 text-purple-900' },
  };

  const unreadAlerts = notifications.filter((n) => n.status === 'sent');

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Subtitle */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full p-0.5 bg-white border-2 border-amber-400 shadow-md flex items-center justify-center flex-shrink-0 overflow-hidden">
              <img
                src={SCHOOL_LOGO_URL}
                alt="Logo អនុវិទ្យាល័យ ហ៊ុន សែន ទួលសំបួរ"
                className="w-full h-full object-cover scale-[1.38] rounded-full"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-moul text-base text-blue-950 tracking-wide font-bold">
                  អនុវិទ្យាល័យ ហ៊ុន សែន ទួលសំបួរ
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 rounded-sm">
                  ឆ្នាំសិក្សា ២០២៥-២០២៦
                </span>
                <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Cloud Database Online
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Hun Sen Toulsambour Secondary School · ឃុំទួលសំបួរ ស្រុកស្ទឹងត្រង់
              </p>
            </div>
          </div>

          {/* Right Actions: Date, Notification Bell, User Switcher */}
          <div className="flex items-center space-x-3">
            {/* Date Display */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100/80 px-3 py-1.5 rounded-lg border border-slate-200/60">
              <Calendar className="w-3.5 h-3.5 text-blue-800" />
              <span className="font-medium">{khmerDateStr}</span>
            </div>

            {/* Telegram Notification Center */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                aria-label="ការជូនដំណឹង"
                className="relative p-2 text-slate-600 hover:text-blue-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <Bell className="w-5 h-5" />
                {unreadAlerts.length > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white shadow-xs">
                    {unreadAlerts.length}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-900">
                      <Bell className="w-4 h-4 text-blue-900" />
                      <span>ការជូនដំណឹងប្រព័ន្ធ & Telegram ({notifications.length})</span>
                    </div>
                    <button
                      onClick={() => {
                        setShowNotifMenu(false);
                        onOpenTelegramModal();
                      }}
                      className="text-[11px] text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>គ្រប់គ្រង Bot</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.slice(0, 5).map((n) => (
                      <div key={n.id} className="p-3 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-semibold text-rose-700 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {n.title}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(n.sentAt).toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">{n.message}</p>
                        <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                          <span>ទៅកាន់: {n.recipientName}</span>
                          <span>·</span>
                          <span className="text-emerald-600 font-medium">ផ្ញើរួច (Telegram)</span>
                        </div>
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <div className="p-4 text-center text-xs text-slate-400">មិនមានសារជូនដំណឹងថ្មីទេ</div>
                    )}
                  </div>
                  <div className="p-2 border-t border-slate-100 text-center">
                    <button
                      onClick={() => {
                        setShowNotifMenu(false);
                        onOpenNotifications();
                      }}
                      className="text-xs text-blue-800 font-medium hover:underline w-full py-1 cursor-pointer"
                    >
                      មើលប្រវត្តិសារទាំងអស់
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Logout button */}
            <button
              type="button"
              onClick={onLogout}
              title="ចាកចេញពីប្រព័ន្ធ (Logout)"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ចាកចេញ (Logout)</span>
            </button>

            {/* Role & User Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-200 hover:border-blue-900/40 hover:bg-slate-50 transition-all cursor-pointer"
              >
                <img
                  src={safeAvatar(currentUser.avatar, DEFAULT_ADMIN_AVATAR)}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover border border-slate-200"
                />
                <div className="text-left hidden md:block">
                  <div className="text-xs font-semibold text-slate-900 leading-tight">{currentUser.name}</div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    {roleLabels[currentUser.role]?.label.split(' ')[0]}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
              </button>

              {/* Role switch dropdown */}
              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in">
                  <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      ប្ដូរតួនាទីសាកល្បង
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowRoleMenu(false);
                        onOpenLoginModal();
                      }}
                      className="text-[11px] text-blue-800 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Lock className="w-3 h-3" />
                      <span>ផ្ទៀងផ្ទាត់ Password</span>
                    </button>
                  </div>
                  <div className="py-1">
                    {allUsers.map((u) => {
                      const isSelected = u.id === currentUser.id;
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            onSwitchUser(u);
                            setShowRoleMenu(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                            isSelected ? 'bg-blue-50/70 text-blue-950 font-semibold' : 'text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <img src={safeAvatar(u.avatar, DEFAULT_ADMIN_AVATAR)} alt={u.name} className="w-6 h-6 rounded-full object-cover" />
                            <div>
                              <div>{u.name}</div>
                              <div className="text-[10px] text-slate-400">{roleLabels[u.role]?.label}</div>
                            </div>
                          </div>
                          {isSelected && <span className="text-blue-800 font-bold">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                  <div className="p-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setShowRoleMenu(false);
                        onLogout();
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-50 rounded-lg flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>ចាកចេញពីគណនី (Logout)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
