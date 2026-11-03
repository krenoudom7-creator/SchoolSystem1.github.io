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
import { formatKhmerDate, getTodayLocalStr } from '../utils/calculations.ts';
import { safeAvatar, DEFAULT_ADMIN_AVATAR, SCHOOL_LOGO_URL } from '../utils/avatar.ts';
import { storage } from '../services/storage.ts';
import { KhmerBorderStrip, KhmerCornerOrnament } from './KhmerOrnament.tsx';

interface HeaderProps {
  currentUser: User;
  onSwitchUser: (user: User) => void;
  allUsers: User[];
  notifications: NotificationItem[];
  onOpenNotifications: () => void;
  onOpenTelegramModal: () => void;
  onOpenLoginModal: () => void;
  onLogout: () => void;
  onTriggerToast?: (toast: { title: string; message: string; type?: 'info' | 'warning' | 'alert' | 'success'; actionLabel?: string; actionTab?: any }) => void;
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
  onTriggerToast,
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [isEditingPasscode, setIsEditingPasscode] = useState(false);
  const [newPasscodeInput, setNewPasscodeInput] = useState('');
  const [passcodeSavedMsg, setPasscodeSavedMsg] = useState('');

  const currentSharedCode = storage.getSystemAccessCode();

  const handleSaveInlinePasscode = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPasscodeInput.trim();
    if (trimmed.length < 4) return;
    storage.setSystemAccessCode(trimmed, currentUser.name);
    setIsEditingPasscode(false);
    setNewPasscodeInput('');
    setPasscodeSavedMsg(`បានធ្វើបច្ចុប្បន្នភាពលេខកូដរួម "${trimmed}" ទៅគ្រប់ឧបករណ៍!`);
    setTimeout(() => setPasscodeSavedMsg(''), 3500);
  };

  const todayStr = getTodayLocalStr();
  const khmerDateStr = formatKhmerDate(todayStr);

  const roleLabels: Record<UserRole, { label: string; badgeColor: string }> = {
    admin: { label: 'អភិបាលប្រព័ន្ធ (Admin)', badgeColor: 'bg-rose-100 text-rose-800' },
    director: { label: 'នាយកសាលា (Director)', badgeColor: 'bg-amber-100 text-amber-900' },
    teacher: { label: 'គ្រូបង្រៀន (Teacher)', badgeColor: 'bg-blue-100 text-blue-900' },
    student: { label: 'សិស្ស (Student)', badgeColor: 'bg-emerald-100 text-emerald-900' },
    parent: { label: 'អាណាព្យាបាល (Parent)', badgeColor: 'bg-purple-100 text-purple-900' },
  };

  const unreadAlerts = notifications.filter((n) => n.status === 'sent');

  const handleTestBellAlert = () => {
    if (onTriggerToast) {
      onTriggerToast({
        title: '🔔 ការជូនដំណឹងសាលារៀន (កណ្តឹងរោទ៍)',
        message: 'សួស្តី! នេះជាការសាកល្បងសារលោតកណ្ដឹងរោទ៍ និងភ្លើង RGB ក្នុងប្រព័ន្ធគ្រប់គ្រងសាលារៀន។',
        type: 'warning',
        actionLabel: 'ពិនិត្យមើលវត្តមាន',
        actionTab: 'attendance',
      });
    }
  };

  return (
    <header className="bg-gradient-to-r from-white via-amber-50/35 to-white sticky top-0 z-30 shadow-sm no-print relative">
      {/* Subtle Khmer Corner Ornaments on Top Header */}
      <KhmerCornerOrnament position="top-left" size={32} variant="gold" className="opacity-70 hidden sm:block" />
      <KhmerCornerOrnament position="top-right" size={32} variant="gold" className="opacity-70 hidden sm:block" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-[78px] py-2.5 gap-3">
          {/* Brand & Subtitle */}
          <div className="flex items-center space-x-3.5 min-w-0">
            <div className="w-13 h-13 aspect-square shrink-0 rounded-full p-0.5 bg-white border-2 border-amber-400 ring-2 ring-amber-200/70 shadow-md flex items-center justify-center flex-shrink-0 overflow-hidden relative">
              <img
                src={SCHOOL_LOGO_URL}
                alt="Logo អនុវិទ្យាល័យ ហ៊ុន សែន ទួលសំបួរ"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <div className="min-w-0 py-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-moul text-sm sm:text-base text-blue-950 tracking-wide font-bold leading-[2] py-0.5">
                  អនុវិទ្យាល័យ ហ៊ុន សែន ទួលសំបួរ
                </h1>
                <span className="hidden sm:inline-block px-2.5 py-0.5 text-[11px] font-semibold bg-amber-100/90 text-amber-900 border border-amber-300 rounded-md leading-relaxed">
                  ❖ ឆ្នាំសិក្សា ២០២៥-២០២៦
                </span>
                {/* RGB Glow Online Pill */}
                <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold text-slate-800 bg-white border border-emerald-400 rounded-full shadow-xs rgb-glow-pill leading-relaxed">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 -ml-2.5"></span>
                  <span>Cloud Database Live</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-600 font-medium leading-relaxed mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span className="text-amber-700 font-semibold">ព្រះរាជាណាចក្រកម្ពុជា · ជាតិ សាសនា ព្រះមហាក្សត្រ</span>
                <span className="text-slate-300">|</span>
                <span>ឃុំទួលសំបួរ ស្រុកស្ទឹងត្រង់ ខេត្តកំពង់ចាម</span>
              </p>
            </div>
          </div>

          {/* Right Actions: Date, Notification Bell, User Switcher */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Date Display */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100/80 px-3 py-1.5 rounded-lg border border-slate-200/60">
              <Calendar className="w-3.5 h-3.5 text-blue-800" />
              <span className="font-medium">{khmerDateStr}</span>
            </div>

            {/* Test Bell Trigger Button (Visible on medium+ screens for instant demonstration) */}
            <button
              type="button"
              onClick={handleTestBellAlert}
              title="សាកល្បងសារលោតកណ្ដឹង"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 text-amber-900 border border-amber-300 hover:border-amber-400 rounded-lg shadow-2xs hover:shadow-xs transition-all cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5 text-amber-600 animate-bell-ring" />
              <span>សាកល្បងកណ្ដឹង</span>
            </button>

            {/* Telegram Notification Center */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                aria-label="ការជូនដំណឹង"
                className={`relative p-2 rounded-xl transition-all cursor-pointer ${
                  unreadAlerts.length > 0
                    ? 'text-amber-900 bg-amber-50 ring-2 ring-amber-400/50 shadow-md animate-pulse'
                    : 'text-slate-600 hover:text-blue-900 hover:bg-slate-100'
                }`}
              >
                <Bell
                  className={`w-5 h-5 ${
                    unreadAlerts.length > 0 ? 'text-amber-600 animate-bell-ring' : ''
                  }`}
                />
                {unreadAlerts.length > 0 ? (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs border-2 border-white animate-bounce">
                    {unreadAlerts.length}
                  </span>
                ) : (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 rounded-t-xl">
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                      <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                        <Bell className="w-4 h-4 animate-bell-ring" />
                      </div>
                      <div>
                        <div>ការជូនដំណឹងប្រព័ន្ធ & Telegram</div>
                        <div className="text-[10px] text-slate-500 font-normal">
                          {unreadAlerts.length} សារមិនទាន់អាន · សរុប {notifications.length}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowNotifMenu(false);
                        onOpenTelegramModal();
                      }}
                      className="text-[11px] text-blue-700 hover:text-blue-900 font-medium hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>គ្រប់គ្រង Bot</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Quick Bell Test Bar */}
                  <div className="px-3 py-2 bg-gradient-to-r from-amber-50 via-rose-50 to-indigo-50 border-b border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-700 font-medium">🔔 សាកល្បងសារកណ្ដឹងរោទ៍:</span>
                    <button
                      type="button"
                      onClick={() => {
                        handleTestBellAlert();
                        setShowNotifMenu(false);
                      }}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-md shadow-xs transition-colors cursor-pointer"
                    >
                      បន្លឺកណ្ដឹងឥឡូវនេះ
                    </button>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.slice(0, 5).map((n) => (
                      <div key={n.id} className="p-3 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-semibold text-rose-700 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
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
                      <div className="p-6 text-center text-xs text-slate-400">
                        <Bell className="w-8 h-8 text-slate-300 mx-auto mb-1 stroke-1" />
                        មិនទាន់មានសារជូនដំណឹងថ្មីទេ
                      </div>
                    )}
                  </div>
                  <div className="p-2 border-t border-slate-100 text-center bg-slate-50/50">
                    <button
                      onClick={() => {
                        setShowNotifMenu(false);
                        onOpenNotifications();
                      }}
                      className="text-xs text-blue-800 font-bold hover:underline w-full py-1 cursor-pointer"
                    >
                      មើលប្រវត្តិសារទាំងអស់ ({notifications.length})
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

            {/* Single Unified System Account Badge & Info */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-2 p-1.5 rounded-xl border border-amber-300/80 bg-gradient-to-r from-amber-50/60 to-blue-50/60 hover:border-amber-400 hover:shadow-xs transition-all cursor-pointer"
                title="ព័ត៌មានប្រព័ន្ធរួមតែមួយ"
              >
                <img
                  src={safeAvatar(currentUser.avatar, DEFAULT_ADMIN_AVATAR)}
                  alt="គណនីរដ្ឋបាលរួម"
                  className="w-8 h-8 rounded-full object-cover border-2 border-amber-400 shadow-2xs"
                />
                <div className="text-left hidden md:block">
                  <div className="text-xs font-bold text-blue-950 leading-tight">
                    រដ្ឋបាលសាលារួម
                  </div>
                  <div className="text-[10px] text-amber-800 font-semibold flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>ប្រព័ន្ធរួមតែមួយ (Admin)</span>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-amber-700 ml-0.5" />
              </button>

              {/* Single Unified System Information Dropdown */}
              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-base flex-shrink-0 border border-amber-200">
                      🏫
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 leading-tight">
                        គណនីរដ្ឋបាលសាលារួម
                      </div>
                      <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>ដំណើរការប្រព័ន្ធរួមតែមួយ (Unified)</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-2.5 mb-3 text-xs text-amber-900 leading-relaxed">
                    <div className="font-bold flex items-center gap-1 text-amber-950 mb-1">
                      <Key className="w-3.5 h-3.5 text-amber-600" />
                      <span>លេខកូដសម្ងាត់រួមរបស់សាលា៖</span>
                    </div>
                    <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-amber-300 font-mono font-bold text-sm text-blue-950">
                      <span>{currentSharedCode}</span>
                      <span className="text-[10px] font-sans font-medium text-slate-400">ប្រើរួមគ្នាទាំងអស់</span>
                    </div>
                    {passcodeSavedMsg && (
                      <div className="mt-1.5 px-2 py-1 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-bold">
                        ✓ {passcodeSavedMsg}
                      </div>
                    )}
                    <p className="text-[10px] text-amber-800 mt-1.5">
                      គ្រប់លោកគ្រូ-អ្នកគ្រូ និងបុគ្គលិកទាំងអស់ប្រើប្រព័ន្ធរួមគ្នាតែមួយ ដោយប្រើលេខកូដនេះ និងមានសិទ្ធិពេញលេញដូចគ្នា។
                    </p>
                  </div>

                  {isEditingPasscode && (
                    <form onSubmit={handleSaveInlinePasscode} className="mb-3 p-2.5 bg-slate-50 border border-blue-200 rounded-xl space-y-2">
                      <label className="block text-[11px] font-bold text-blue-950">
                        បញ្ចូលលេខកូដសម្ងាត់រួមថ្មី (យ៉ាងតិច ៤ តួអក្សរ)៖
                      </label>
                      <input
                        type="text"
                        value={newPasscodeInput}
                        onChange={(e) => setNewPasscodeInput(e.target.value)}
                        placeholder={currentSharedCode}
                        className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-900 text-slate-900"
                        autoFocus
                      />
                      <div className="flex items-center gap-1.5">
                        <button
                          type="submit"
                          disabled={newPasscodeInput.trim().length < 4}
                          className="flex-1 py-1.5 px-2.5 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          រក្សាទុករួមគ្នា
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingPasscode(false);
                            setNewPasscodeInput('');
                          }}
                          className="py-1.5 px-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          បោះបង់
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingPasscode(!isEditingPasscode);
                        if (!isEditingPasscode) {
                          setNewPasscodeInput(currentSharedCode);
                        }
                      }}
                      className="w-full text-left px-3 py-2 text-xs bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-xl flex items-center gap-2 font-medium transition-colors cursor-pointer border border-slate-200"
                    >
                      <Lock className="w-3.5 h-3.5 text-blue-800" />
                      <span>ផ្ទៀងផ្ទាត់ / កែប្រែលេខកូដសម្ងាត់</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowRoleMenu(false);
                        onLogout();
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-rose-700 hover:bg-rose-50 rounded-xl flex items-center gap-2 font-medium transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>ចាកចេញពីប្រព័ន្ធ (Logout)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <KhmerBorderStrip position="bottom" />
    </header>
  );
};
