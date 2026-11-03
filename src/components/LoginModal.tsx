import React, { useState } from 'react';
import {
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  X,
  CheckCircle2,
  AlertCircle,
  LogIn,
} from 'lucide-react';
import { storage } from '../services/storage.ts';
import { User } from '../types/index.ts';
import { SCHOOL_LOGO_URL } from '../utils/schoolLogo.ts';
import { safeAvatar, DEFAULT_ADMIN_AVATAR } from '../utils/avatar.ts';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

interface RememberedUser {
  username: string;
  name: string;
  role?: string;
  avatar?: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Quick fill is ONLY available if a user has previously logged in on this browser
  const [rememberedUser, setRememberedUser] = useState<RememberedUser | null>(() => {
    try {
      const saved = localStorage.getItem('toulsambour_remembered_login');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!password.trim()) {
      setErrorMessage('សូមបញ្ចូលលេខកូដសម្ងាត់រួម (Passcode) របស់សាលា!');
      return;
    }

    const targetUser = username.trim() || 'admin';
    const authenticatedUser = storage.authenticate(targetUser, password.trim());
    if (authenticatedUser) {
      setSuccessMessage(`សូមស្វាគមន៍ ${authenticatedUser.name}!`);

      // Store in remembered login
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

      setTimeout(() => {
        onLoginSuccess(authenticatedUser);
        onClose();
        setSuccessMessage('');
        setUsername('');
        setPassword('');
      }, 600);
    } else {
      setErrorMessage(
        'ឈ្មោះគណនី (Username) ឬលេខកូដសម្ងាត់មិនត្រឹមត្រូវទេ! (ចំណាំ៖ គ្រប់ User ទាំងអស់ប្រើលេខកូដសម្ងាត់រួមតែមួយប៉ុណ្ណោះ)'
      );
    }
  };

  const handleQuickFill = (remembered: RememberedUser) => {
    setUsername(remembered.username);
    setErrorMessage('');
    const pwInput = document.getElementById('modal-password-input');
    if (pwInput) pwInput.focus();
  };

  const handleClearRemembered = () => {
    localStorage.removeItem('toulsambour_remembered_login');
    setRememberedUser(null);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative border border-slate-100">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* School Logo & Title */}
        <div className="text-center pb-5 border-b border-slate-100">
          <div className="w-24 h-24 mx-auto mb-3 p-0.5 rounded-full bg-white shadow-lg border-2 border-amber-400 flex items-center justify-center overflow-hidden">
            <img
              src={SCHOOL_LOGO_URL}
              alt="Logo អនុវិទ្យាល័យ ហ៊ុន សែន ទួលសំបួរ"
              className="w-full h-full object-cover scale-[1.38] rounded-full"
            />
          </div>
          <h2 className="font-moul text-base text-blue-950 font-bold">
            អនុវិទ្យាល័យ ហ៊ុន សែន ទួលសំបួរ
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            ចូលប្រើប្រព័ន្ធគ្រប់គ្រងសាលារៀន (Portal Login)
          </p>
        </div>

        {/* Error / Success Alerts */}
        {errorMessage && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              ឈ្មោះគណនី (Username)
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin ឬ ឈ្មោះគណនី..."
                className="w-full text-xs pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-900 focus:outline-hidden transition-all text-slate-900"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                លេខកូដសម្ងាត់ប្រព័ន្ធ (System Passcode)
              </label>
              <span className="text-[10px] text-blue-900 font-medium">
                លេខកូដរួមតែមួយគត់
              </span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="modal-password-input"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="បញ្ចូលលេខកូដសម្ងាត់រួម..."
                className="w-full text-xs pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-900 focus:outline-hidden transition-all text-slate-900 font-mono"
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

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <LogIn className="w-4 h-4 text-amber-400" />
            <span>ចូលប្រព័ន្ធ (Sign In)</span>
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
    </div>
  );
};
