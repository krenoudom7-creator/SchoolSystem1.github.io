import React, { useState, useEffect } from 'react';
import {
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  LogIn,
  KeyRound,
  RotateCcw,
  X,
  Sparkles,
} from 'lucide-react';
import { storage } from '../services/storage.ts';
import { User } from '../types/index.ts';
import { SCHOOL_LOGO_URL } from '../utils/schoolLogo.ts';
import { safeAvatar, DEFAULT_ADMIN_AVATAR } from '../utils/avatar.ts';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

interface RememberedUser {
  username: string;
  name: string;
  role?: string;
  avatar?: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Quick fill is ONLY available if a user has previously logged in on this browser
  const [rememberedUser, setRememberedUser] = useState<RememberedUser | null>(() => {
    try {
      const saved = localStorage.getItem('toulsambour_remembered_login');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim() || !password.trim()) {
      setErrorMessage('សូមបញ្ចូលឈ្មោះគណនី (Username) និងលេខកូដសម្ងាត់ (Passcode)!');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const authenticatedUser = storage.authenticate(username.trim(), password.trim());
      if (authenticatedUser) {
        setSuccessMessage(`សូមស្វាគមន៍ ${authenticatedUser.name}! កំពុងផ្ទៀងផ្ទាត់ចូលប្រព័ន្ធ...`);
        // Save to remembered login for future quick fill
        try {
          const toRemember: RememberedUser = {
            username: authenticatedUser.username,
            name: authenticatedUser.name,
            role: authenticatedUser.role,
            avatar: authenticatedUser.avatar,
          };
          localStorage.setItem('toulsambour_remembered_login', JSON.stringify(toRemember));
          setRememberedUser(toRemember);
        } catch (e) {
          console.warn('Could not save remembered login:', e);
        }

        storage.setSession(authenticatedUser);
        setTimeout(() => {
          onLoginSuccess(authenticatedUser);
        }, 600);
      } else {
        setIsLoading(false);
        setErrorMessage(
          'ឈ្មោះគណនី ឬលេខកូដសម្ងាត់មិនត្រឹមត្រូវទេ! (ចំណាំ៖ គ្រប់ User ទាំងអស់ប្រើលេខកូដសម្ងាត់រួមតែមួយប៉ុណ្ណោះ)'
        );
      }
    }, 350);
  };

  const handleQuickFill = (remembered: RememberedUser) => {
    setUsername(remembered.username);
    setErrorMessage('');
    const pwInput = document.getElementById('login-password-input');
    if (pwInput) pwInput.focus();
  };

  const handleClearRemembered = () => {
    localStorage.removeItem('toulsambour_remembered_login');
    setRememberedUser(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 font-khmer relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-blue-600/20 to-amber-500/10 blur-3xl pointer-events-none rounded-full"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-500/5 blur-3xl pointer-events-none rounded-full"></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Main Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8">
          {/* Logo & School Header */}
          <div className="text-center pb-5 border-b border-slate-100">
            <div className="w-24 h-24 mx-auto mb-3.5 p-0.5 rounded-full bg-white shadow-xl border-2 border-amber-400 flex items-center justify-center overflow-hidden">
              <img
                src={SCHOOL_LOGO_URL}
                alt="Logo អនុវិទ្យាល័យ ហ៊ុន សែន ទួលសំបួរ"
                className="w-full h-full object-cover scale-[1.38] rounded-full"
              />
            </div>
            <div className="inline-block px-2.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-900 border border-amber-200 rounded-full mb-1.5">
              ឆ្នាំសិក្សា ២០២៥ - ២០២៦
            </div>
            <h1 className="font-moul text-base sm:text-lg text-blue-950 font-bold leading-relaxed">
              អនុវិទ្យាល័យ ហ៊ុន សែន ទួលសំបួរ
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Toulsambour Secondary School Management System
            </p>
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-lg text-[11px] font-semibold text-slate-700">
              <KeyRound className="w-3.5 h-3.5 text-blue-900" />
              <span>ផ្ទាំងចូលប្រើប្រព័ន្ធរដ្ឋបាលសាលា (Portal Login)</span>
            </div>
          </div>

          {/* Feedback messages */}
          {errorMessage && (
            <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span className="font-medium">{successMessage}</span>
            </div>
          )}

            {/* Single Unified System Banner */}
            <div className="mt-3 p-3 bg-amber-50/90 border border-amber-300/80 rounded-2xl text-xs text-amber-950 leading-relaxed">
              <div className="font-bold flex items-center gap-1.5 text-blue-950 mb-1">
                <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>ប្រព័ន្ធដំណើរការរួមតែមួយ (Single Unified System)</span>
              </div>
              <p className="text-[11px] text-amber-900">
                លោកគ្រូ-អ្នកគ្រូ និងបុគ្គលិកទាំងអស់ប្រើប្រាស់ប្រព័ន្ធរួមគ្នាតែមួយ ដោយប្រើលេខកូដសម្ងាត់រួមតែមួយគត់ និងមានសិទ្ធិពេញលេញដូចគ្នាទាំងអស់។
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    លេខកូដសម្ងាត់ប្រព័ន្ធរួម (System Passcode)
                  </label>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    លេខកូដរួមតែមួយគត់
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    id="login-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="បញ្ចូលលេខកូដសម្ងាត់រួម (ឧ. admin123)..."
                    className="w-full text-xs pl-10 pr-10 py-2.5 bg-slate-50 border-2 border-amber-300 focus:border-amber-500 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden transition-all text-slate-900 font-mono font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  ឈ្មោះគណនី (ស្រេចចិត្ត / Optional)
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin ឬ ឈ្មោះលោកអ្នក (ស្រេចចិត្ត)..."
                    className="w-full text-xs pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-900 focus:outline-hidden transition-all text-slate-700"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 hover:from-blue-800 hover:to-indigo-800 text-white text-xs font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-75"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <LogIn className="w-4 h-4 text-amber-400" />
                )}
                <span>ចូលប្រើប្រព័ន្ធរួម (Enter Unified System)</span>
              </button>

              {/* Instant 1-Click Quick Entry Button */}
              <button
                type="button"
                onClick={() => {
                  const code = storage.getSystemAccessCode();
                  setPassword(code);
                  setUsername('admin');
                  setIsLoading(true);
                  setTimeout(() => {
                    const authed = storage.authenticate('admin', code);
                    if (authed) {
                      storage.setSession(authed);
                      onLoginSuccess(authed);
                    }
                  }, 200);
                }}
                className="w-full py-2 px-3 bg-amber-100 hover:bg-amber-200 text-amber-950 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-amber-300 shadow-2xs"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                <span>ចូលប្រើរហ័ស (លេខកូដរួម៖ {storage.getSystemAccessCode()})</span>
              </button>
            </form>

          {/* Quick Fill / Remembered Account - ONLY VISIBLE IF PREVIOUSLY LOGGED IN */}
          {rememberedUser && (
            <div className="mt-5 pt-4 border-t border-slate-100 animate-in fade-in">
              <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={safeAvatar(rememberedUser.avatar, DEFAULT_ADMIN_AVATAR)}
                    alt={rememberedUser.name}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-500 font-medium">គណនីធ្លាប់ចូលប្រើចុងក្រោយ</div>
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {rememberedUser.name} <span className="font-mono text-slate-500 font-normal">(@{rememberedUser.username})</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleQuickFill(rememberedUser)}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-blue-900 hover:bg-blue-800 text-white rounded-lg transition-colors cursor-pointer shadow-xs"
                  >
                    បំពេញរហ័ស
                  </button>
                  <button
                    type="button"
                    onClick={handleClearRemembered}
                    title="សម្អាតគណនីចាស់"
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* School location footer badge */}
        <div className="text-center mt-5 text-slate-400 text-xs">
          <p className="font-medium text-slate-300">
            អនុវិទ្យាល័យ ហ៊ុន សែន ទួលសំបួរ · ស្រុកស្ទឹងត្រង់ ខេត្តកំពង់ចាម
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            ប្រព័ន្ធគ្រប់គ្រងទិន្នន័យអប់រំ និងវត្តមានសិស្សតាមបច្ចេកវិទ្យាឌីជីថល
          </p>
        </div>
      </div>
    </div>
  );
};
