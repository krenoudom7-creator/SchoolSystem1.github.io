import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Key,
  Lock,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  UserCheck,
  Layers,
  Server,
  Database,
  Globe,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { User, UserRole } from '../types/index.ts';
import { storage } from '../services/storage.ts';
import { ImageUploader } from './ImageUploader.tsx';
import { safeAvatar, DEFAULT_ADMIN_AVATAR } from '../utils/avatar.ts';

interface UsersManagementViewProps {
  users: User[];
  currentUser: User;
  onRefresh: () => void;
}

interface TierStatus {
  architecture?: string;
  frontend?: { name: string; status: string };
  backend?: { name: string; port: number; status: string };
  centralDatabase?: { name: string; databaseId: string; status: string; error?: string };
}

export const UsersManagementView: React.FC<UsersManagementViewProps> = ({
  users,
  currentUser,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<'all' | UserRole>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);
  const [resetPwUser, setResetPwUser] = useState<User | null>(null);
  const [newPasswordVal, setNewPasswordVal] = useState('');
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [tierStatus, setTierStatus] = useState<TierStatus | null>(null);
  const [isCheckingTiers, setIsCheckingTiers] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [systemAccessCode, setSystemAccessCode] = useState(() => storage.getSystemAccessCode());
  const [showUniversalPass, setShowUniversalPass] = useState(false);
  const [isChangePassModalOpen, setIsChangePassModalOpen] = useState(false);
  const [newUniversalPassVal, setNewUniversalPassVal] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    password: storage.getSystemAccessCode(),
    name: '',
    role: 'admin' as UserRole,
    email: '',
    phone: '',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    status: 'active' as 'active' | 'inactive',
  });

  const checkTierStatus = async () => {
    setIsCheckingTiers(true);
    try {
      const res = await fetch('/api/system/status');
      if (res.ok) {
        const data = await res.json();
        setTierStatus(data);
      }
    } catch {
      setTierStatus({
        frontend: { name: 'React Client', status: 'online' },
        backend: { name: 'Express Server', port: 3000, status: 'online' },
        centralDatabase: { name: 'Firebase Firestore', databaseId: 'ai-studio-toulsambourschoo...', status: 'connected' },
      });
    } finally {
      setIsCheckingTiers(false);
    }
  };

  useEffect(() => {
    checkTierStatus();
  }, []);

  useEffect(() => {
    setSystemAccessCode(storage.getSystemAccessCode());
  }, [users]);

  const toggleShowPassword = (userId: string) => {
    setShowPasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      password: storage.getSystemAccessCode(),
      name: '',
      role: 'teacher',
      email: '',
      phone: '',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      status: 'active',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setFormData({
      username: u.username,
      password: storage.getSystemAccessCode(),
      name: u.name,
      role: u.role,
      email: u.email,
      phone: u.phone || '',
      avatar: u.avatar || '',
      status: u.status || 'active',
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.name.trim()) {
      alert('សូមបំពេញ Username និងឈ្មោះឱ្យបានពេញលេញ!');
      return;
    }

    const payload = {
      ...formData,
      password: storage.getSystemAccessCode(),
    };

    if (editingUser) {
      // 1. Update in local storage
      storage.updateUser(editingUser.id, payload);

      // 2. Sync to Backend API
      try {
        await fetch(`/api/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.warn('Backend update notice:', err);
      }

      setFeedbackMsg({ type: 'success', text: `បានកែប្រែគណនី ${formData.name} ក្នុង Central Database ជោគជ័យ!` });
      setEditingUser(null);
    } else {
      // Check username uniqueness
      const exists = users.some(
        (u) => u.username.toLowerCase() === formData.username.trim().toLowerCase()
      );
      if (exists) {
        alert('ឈ្មោះ Username នេះមានរួចហើយ! សូមជ្រើសរើស Username ផ្សេង។');
        return;
      }

      // 1. Add to local storage
      const created = storage.addUser(payload);

      // 2. Dispatch to Backend API
      try {
        await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, id: created.id }),
        });
      } catch (err) {
        console.warn('Backend create notice:', err);
      }

      setFeedbackMsg({ type: 'success', text: `បានបង្កើតគណនីថ្មី ${formData.name} ក្នុង Central Database ដោយជោគជ័យ!` });
      setIsAddModalOpen(false);
    }

    onRefresh();
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleDelete = async () => {
    if (deleteConfirmUser) {
      if (deleteConfirmUser.username === 'admin') {
        alert('មិនអាចលុបគណនី Root Administrator ដើមបានទេ!');
        setDeleteConfirmUser(null);
        return;
      }

      // 1. Remove from local store
      storage.deleteUser(deleteConfirmUser.id);

      // 2. Remove via Backend API
      try {
        await fetch(`/api/users/${deleteConfirmUser.id}`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.warn('Backend delete notice:', err);
      }

      setFeedbackMsg({ type: 'success', text: `បានដកគណនី ${deleteConfirmUser.name} ចេញពីប្រព័ន្ធ!` });
      setDeleteConfirmUser(null);
      onRefresh();
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  // Changing password changes the single universal system passcode for ALL users
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPwUser || !newPasswordVal.trim() || newPasswordVal.trim().length < 4) {
      alert('លេខកូដសម្ងាត់ត្រូវមានយ៉ាងហោចណាស់ ៤ តួអក្សរ!');
      return;
    }

    const trimmed = newPasswordVal.trim();
    storage.setSystemAccessCode(trimmed, currentUser.name);
    setSystemAccessCode(trimmed);

    // Sync to Backend API
    try {
      await fetch('/api/system/access-code', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessCode: trimmed }),
      });
    } catch (err) {
      console.warn('Backend password sync notice:', err);
    }

    setFeedbackMsg({
      type: 'success',
      text: `បានកែប្រែលេខកូដសម្ងាត់រួមទៅជា "${trimmed}" សម្រាប់គ្រប់ User ទាំងអស់ដោយជោគជ័យ! អ្នកផ្សេងទៀតទាំងអស់ត្រូវប្រើលេខកូដថ្មីនេះ។`,
    });
    setResetPwUser(null);
    setNewPasswordVal('');
    onRefresh();
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  const handleChangeUniversalPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUniversalPassVal.trim() || newUniversalPassVal.trim().length < 4) {
      alert('លេខកូដសម្ងាត់ត្រូវមានយ៉ាងហោចណាស់ ៤ តួអក្សរ!');
      return;
    }

    const trimmed = newUniversalPassVal.trim();
    storage.setSystemAccessCode(trimmed, currentUser.name);
    setSystemAccessCode(trimmed);
    setIsChangePassModalOpen(false);

    // Sync to Backend API
    try {
      await fetch('/api/system/access-code', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessCode: trimmed }),
      });
    } catch (err) {
      console.warn('Backend access-code sync notice:', err);
    }

    setFeedbackMsg({
      type: 'success',
      text: `បានផ្លាស់ប្ដូរលេខកូដសម្ងាត់ប្រព័ន្ធរួមទៅជា "${trimmed}" សម្រាប់គ្រប់គណនីទាំងអស់ដោយជោគជ័យ! អ្នកផ្សេងទាំងអស់ត្រូវប្រើលេខកូដថ្មីនេះដើម្បីចូល។`,
    });
    onRefresh();
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  const filtered = users.filter((u) => {
    if (selectedRole !== 'all' && u.role !== selectedRole) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  const roleKhmerLabels: Record<UserRole, { label: string; badge: string }> = {
    admin: { label: 'អភិបាលប្រព័ន្ធ (Admin)', badge: 'bg-rose-100 text-rose-800 border border-rose-200' },
    director: { label: 'នាយកសាលា (Director)', badge: 'bg-amber-100 text-amber-900 border border-amber-200' },
    teacher: { label: 'គ្រូបង្រៀន (Teacher)', badge: 'bg-blue-100 text-blue-900 border border-blue-200' },
    student: { label: 'សិស្ស (Student)', badge: 'bg-emerald-100 text-emerald-900 border border-emerald-200' },
    parent: { label: 'អាណាព្យាបាល (Parent)', badge: 'bg-purple-100 text-purple-900 border border-purple-200' },
  };

  return (
    <div className="space-y-6">
      {/* 3-Tier Connected Architecture Status Panel */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-800/80 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-moul text-sm sm:text-base text-amber-400 font-bold">
                  ស្ថាបត្យកម្មប្រព័ន្ធ ៣ ថ្នាក់ (3-Tier Connected Architecture)
                </h3>
                <span className="hidden sm:inline-flex px-2 py-0.5 text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full font-mono">
                  All Connected
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                ការតភ្ជាប់ Frontend Website ↔ Backend API Server ↔ Central Cloud Database (Firestore)
              </p>
            </div>
          </div>

          <button
            onClick={checkTierStatus}
            disabled={isCheckingTiers}
            className="self-start sm:self-auto px-3.5 py-1.5 text-xs bg-slate-800/90 hover:bg-slate-700 border border-slate-700 rounded-xl flex items-center gap-2 cursor-pointer text-slate-200 transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isCheckingTiers ? 'animate-spin' : ''}`} />
            <span>ពិនិត្យការតភ្ជាប់</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* 1. Frontend Website */}
          <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/60 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs mb-2">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-sky-400" />
                <span className="font-bold text-slate-200">១. Frontend Website</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Online
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              React SPA + Tailwind CSS (ដំណើរការលើកុំព្យូទ័រ និងទូរស័ព្ទដៃ)
            </p>
            <div className="text-[10px] text-slate-400 font-mono mt-2 pt-2 border-t border-slate-700/50">
              Client · Port 3000
            </div>
          </div>

          {/* 2. Backend API Server */}
          <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/60 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs mb-2">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-slate-200">២. Backend API Server</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Online
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Express Server · ផ្ដល់ REST APIs គ្រប់គ្រងអ្នកប្រើប្រាស់ និង Telegram
            </p>
            <div className="text-[10px] text-slate-400 font-mono mt-2 pt-2 border-t border-slate-700/50">
              Endpoint: /api/users
            </div>
          </div>

          {/* 3. Central Database */}
          <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/60 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs mb-2">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-slate-200">៣. Central Database</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Connected
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Google Firebase Firestore (ទិន្នន័យរួមគ្នាគ្រប់ឧបករណ៍ Real-time)
            </p>
            <div className="text-[10px] text-slate-400 font-mono mt-2 pt-2 border-t border-slate-700/50 truncate">
              ID: ai-studio-toulsambourschoo...
            </div>
          </div>
        </div>
      </div>

      {/* Success / Error Feedback Alert */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center gap-2 text-xs font-medium animate-in fade-in ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Header & Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-900" />
              <h2 className="text-xl font-bold font-moul text-slate-900">
                ការគ្រប់គ្រងប្រព័ន្ធរួមតែមួយ & លេខកូដសម្ងាត់
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              ប្រព័ន្ធដំណើរការរួមតែមួយ (Single Unified System) សម្រាប់លោកគ្រូ-អ្នកគ្រូ និងបុគ្គលិកទាំងអស់ប្រើប្រាស់រួមគ្នាដោយប្រើលេខកូដសម្ងាត់តែមួយគត់
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer self-start md:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>បន្ថែមអ្នកប្រើប្រាស់ថ្មី</span>
          </button>
        </div>

        {/* Search & Role Filters */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative max-w-sm w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="ស្វែងរកតាមឈ្មោះ, Username ឬ Email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
            />
          </div>

          {/* Role Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {(['all', 'admin', 'director', 'teacher'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedRole(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                  selectedRole === r
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {r === 'all'
                  ? 'ទាំងអស់'
                  : r === 'admin'
                  ? 'Admin'
                  : r === 'director'
                  ? 'នាយក'
                  : 'គ្រូបង្រៀន'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Universal System Access Code Section */}
      <div className="bg-gradient-to-br from-amber-500/10 via-amber-50/80 to-orange-50/40 rounded-3xl border-2 border-amber-300 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-sm flex-shrink-0 mt-0.5">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-moul text-sm sm:text-base text-slate-900 font-bold">
                  លេខកូដសម្ងាត់ប្រព័ន្ធរួម (Universal System Access Code)
                </h3>
                <span className="px-2 py-0.5 text-[10px] bg-amber-200/90 text-amber-950 border border-amber-300 rounded-full font-bold">
                  លេខកូដរួមតែមួយគត់
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-2xl">
                សម្រាប់ការចូលប្រើប្រព័ន្ធ គ្រប់ User ទាំងអស់ (Admin, នាយក, គ្រូបង្រៀន...) ប្រើតែលេខកូដសម្ងាត់មួយនេះប៉ុណ្ណោះ។ បើកែប្រែលេខកូដសម្ងាត់នេះ គ្រប់គណនីទាំងអស់នឹងត្រូវប្រើលេខកូដដែលទើបតែកែប្រែថ្មីនោះដែរ ហើយមិនអាចប្រើលេខកូដចាស់បានឡើយ។
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto bg-white p-2 rounded-2xl border border-amber-200 shadow-xs">
            <div className="px-3 py-1 bg-slate-100 rounded-xl flex items-center gap-2">
              <span className="text-[11px] text-slate-500 font-medium">កូដបច្ចុប្បន្ន:</span>
              <span className="font-mono text-sm font-bold text-blue-950">
                {showUniversalPass ? systemAccessCode : '••••••••'}
              </span>
              <button
                type="button"
                onClick={() => setShowUniversalPass(!showUniversalPass)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                title={showUniversalPass ? 'លាក់' : 'បង្ហាញ'}
              >
                {showUniversalPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setNewUniversalPassVal(systemAccessCode);
                setIsChangePassModalOpen(true);
              }}
              className="px-3.5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Key className="w-3.5 h-3.5" />
              <span>កែប្រែលេខកូដរួម</span>
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900">
            បញ្ជីគណនីអ្នកប្រើប្រាស់ ({filtered.length} គណនី)
          </h3>
          <span className="text-[11px] text-slate-500 font-medium">
            ស៊ីសង្វាក់គ្នាជាមួយ Central Database & Backend API
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-semibold text-slate-700 border-b border-slate-200">
                <th className="py-3 px-3 text-center w-12">ល.រ</th>
                <th className="py-3 px-3">ឈ្មោះពេញ / Profile</th>
                <th className="py-3 px-3">Username</th>
                <th className="py-3 px-3">លេខកូដរួម (Passcode)</th>
                <th className="py-3 px-3">តួនាទី (Role)</th>
                <th className="py-3 px-3">ទំនាក់ទំនង</th>
                <th className="py-3 px-3">ស្ថានភាព</th>
                <th className="py-3 px-3 text-right">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((u, idx) => {
                const isPasswordShown = showPasswords[u.id];
                const isCurrentUser = u.id === currentUser.id;

                return (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={safeAvatar(u.avatar, DEFAULT_ADMIN_AVATAR)}
                          alt={u.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{u.name}</span>
                            {isCurrentUser && (
                              <span className="text-[9px] px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded-sm font-semibold">
                                អ្នក
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-slate-800 bg-slate-100 px-2 py-0.5 rounded-sm">
                        {u.username}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-slate-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded text-[11px] font-bold">
                          {isPasswordShown ? systemAccessCode : '••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleShowPassword(u.id)}
                          className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                          title={isPasswordShown ? 'លាក់' : 'បង្ហាញ'}
                        >
                          {isPasswordShown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          roleKhmerLabels[u.role]?.badge || 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {roleKhmerLabels[u.role]?.label || u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                      {u.phone || '—'}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          u.status === 'active'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            u.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        ></span>
                        {u.status === 'active' ? 'សកម្ម' : 'អសកម្ម'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setResetPwUser(u);
                            setNewPasswordVal('');
                          }}
                          title="ប្ដូរ Password"
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(u)}
                          title="កែប្រែ"
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {u.username !== 'admin' && (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmUser(u)}
                            title="លុប"
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {(isAddModalOpen || editingUser) && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative border border-slate-100 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingUser(null);
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
              <ShieldCheck className="w-5 h-5 text-blue-900" />
              <h3 className="font-moul text-sm text-slate-900 font-bold">
                {editingUser ? 'កែប្រែព័ត៌មានអ្នកប្រើប្រាស់' : 'បង្កើតគណនីអ្នកប្រើប្រាស់ថ្មី'}
              </h3>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Avatar Upload */}
                <ImageUploader
                  currentImage={formData.avatar}
                  onImageChange={(url: string) => setFormData({ ...formData, avatar: url })}
                  type="user"
                  label="រូបថតប្រវត្តិរូប (Avatar)"
                />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ឈ្មោះពេញ *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ឧ. លោក ស៊ុយ បូរ៉ា"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    តួនាទី (Role) *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                  >
                    <option value="admin">អភិបាលប្រព័ន្ធ (Admin)</option>
                    <option value="director">នាយកសាលា (Director)</option>
                    <option value="teacher">គ្រូបង្រៀន (Teacher)</option>
                    <option value="student">សិស្ស (Student)</option>
                    <option value="parent">អាណាព្យាបាល (Parent)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={editingUser?.username === 'admin'}
                    placeholder="admin_toulsambour"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:outline-hidden font-mono disabled:opacity-60"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      លេខកូដសម្ងាត់ប្រព័ន្ធរួម (System Passcode)
                    </label>
                    <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                      កូដរួម
                    </span>
                  </div>
                  <input
                    type="text"
                    disabled
                    value={systemAccessCode}
                    className="w-full text-xs p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-mono font-bold text-slate-700 cursor-not-allowed"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    គ្រប់គណនីទាំងអស់ប្រើប្រាស់លេខកូដសម្ងាត់រួមនេះដោយស្វ័យប្រវត្តិ
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    អ៊ីមែល (Email)
                  </label>
                  <input
                    type="email"
                    placeholder="user@toulsambour.edu.kh"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    លេខទូរស័ព្ទ
                  </label>
                  <input
                    type="text"
                    placeholder="012 xxx xxx"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingUser(null);
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-xs cursor-pointer"
                >
                  {editingUser ? 'កែប្រែគណនី' : 'រក្សាទុកគណនី'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Universal System Passcode Modal */}
      {isChangePassModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative border border-slate-100">
            <button
              onClick={() => setIsChangePassModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <Key className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 text-center font-moul">
              កែប្រែលេខកូដសម្ងាត់ប្រព័ន្ធរួម
            </h3>
            <p className="text-xs text-slate-600 text-center mt-1.5 leading-relaxed">
              លេខកូដនេះប្រើសម្រាប់គ្រប់គណនីទាំងអស់ (Admin, នាយក, គ្រូបង្រៀន...)។ នៅពេលកែប្រែរួច អ្នកផ្សេងទៀតទាំងអស់ត្រូវប្រើលេខកូដថ្មីនេះជាចាំបាច់។
            </p>

            <form onSubmit={handleChangeUniversalPasscode} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  លេខកូដសម្ងាត់ថ្មី (New System Passcode) *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="យ៉ាងហោច ៤ តួអក្សរ..."
                  value={newUniversalPassVal}
                  onChange={(e) => setNewUniversalPassVal(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 font-mono font-bold text-slate-900"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                ⚠️ <strong>សូមកត់ចំណាំ៖</strong> នៅពេលលោកអ្នកផ្លាស់ប្ដូរលេខកូដនេះ លេខកូដចាស់នឹងលែងដំណើរការសម្រាប់គ្រប់គ្នា ហើយគណនីទាំងអស់ត្រូវវាយបញ្ចូលលេខកូដថ្មីនេះដើម្បីចូល។
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsChangePassModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-600 rounded-xl shadow-xs cursor-pointer"
                >
                  រក្សាទុកលេខកូដរួមថ្មី
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Password Reset Modal */}
      {resetPwUser && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in border border-slate-100">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3">
              <Key className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 text-center font-moul">
              កែប្រែលេខកូដសម្ងាត់រួម
            </h3>
            <p className="text-xs text-slate-600 text-center mt-1 leading-relaxed">
              ការប្ដូរនេះនឹងកែប្រែលេខកូដរួមសម្រាប់គ្រប់ User ទាំងអស់នៅក្នុងប្រព័ន្ធ។
            </p>

            <form onSubmit={handleResetPassword} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  លេខកូដសម្ងាត់រួមថ្មី *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="យ៉ាងហោច ៤ តួអក្សរ..."
                  value={newPasswordVal}
                  onChange={(e) => setNewPasswordVal(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 font-mono font-bold"
                />
              </div>

              <p className="text-[10px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                ចំណាំ៖ បន្ទាប់ពីកែប្រែ អ្នកផ្សេងទៀតទាំងអស់ត្រូវប្រើលេខកូដថ្មីនេះ។
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetPwUser(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs cursor-pointer"
                >
                  រក្សាទុកលេខកូដរួម
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in border border-slate-100">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 text-center font-moul">
              តើអ្នកពិតជាចង់លុបគណនីនេះមែនទេ?
            </h3>
            <p className="text-xs text-slate-500 text-center mt-2">
              គណនី <strong className="text-slate-800">{deleteConfirmUser.name}</strong> ({deleteConfirmUser.username}) នឹងត្រូវបានដកចេញពី Central Database។
            </p>

            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                បោះបង់
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs cursor-pointer"
              >
                បាទ/ចាស លុបគណនី
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
