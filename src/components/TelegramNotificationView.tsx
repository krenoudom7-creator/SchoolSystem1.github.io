import React, { useState } from 'react';
import {
  Send,
  Bell,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Phone,
  MessageSquare,
  Bot,
  User,
  ExternalLink,
} from 'lucide-react';
import { NotificationItem, Student, SchoolClass } from '../types/index.ts';
import { storage } from '../services/storage.ts';

interface TelegramNotificationViewProps {
  notifications: NotificationItem[];
  students: Student[];
  classes: SchoolClass[];
  onRefresh: () => void;
}

export const TelegramNotificationView: React.FC<TelegramNotificationViewProps> = ({
  notifications,
  students,
  classes,
  onRefresh,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [testReason, setTestReason] = useState<string>('អវត្តមានឥតច្បាប់ម៉ោងទី ១');
  const [isSentSuccess, setIsSentSuccess] = useState(false);

  const db = storage.getDatabase();
  const botSettings = db.telegramSettings;

  const handleSendTestAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find((s) => s.id === selectedStudentId);
    if (!student) return;

    const targetClass = classes.find((c) => c.id === student.classId);
    const className = targetClass?.name || 'ថ្នាក់រៀន';

    const testMsg = `🔔 [អនុវិទ្យាល័យទួលសំបួរ - Telegram Bot] ដំណឹងអវត្តមាន៖ សូមជម្រាបជូនលោក/លោកស្រី ${student.parentName} (${student.parentRelationship} សិស្ស ${student.khmerName} ${className}) ថាកូនរបស់លោក/លោកស្រីបាន «${testReason}» នៅថ្ងៃនេះ ៣០ តុលា ២០២៦។ សូមមេត្តាទាក់ទងមកកាន់គ្រូប្រចាំថ្នាក់ដើម្បីបំភ្លឺ។`;

    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      type: 'telegram',
      recipientName: `${student.parentName} (${student.parentRelationship})`,
      recipientPhone: student.parentPhone,
      studentName: student.khmerName,
      title: `ដំណឹងអវត្តមាន - ${student.khmerName}`,
      message: testMsg,
      status: 'sent',
      sentAt: new Date().toISOString(),
    };

    db.notifications.unshift(newNotif);
    storage.logAudit(
      'ប្រព័ន្ធ Telegram',
      'teacher',
      'ផ្ញើសារ Telegram ទៅអាណាព្យាបាល',
      `បានផ្ញើសារទៅកាន់ ${student.parentPhone} (អាណាព្យាបាលសិស្ស ${student.khmerName})`
    );

    // Call Backend API proxy to dispatch telegram notification
    fetch('/api/telegram/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        botToken: botSettings.botToken,
        chatId: botSettings.chatId,
        message: testMsg,
      }),
    }).catch((err) => console.warn('Telegram API proxy notice:', err));

    setIsSentSuccess(true);
    onRefresh();
    setTimeout(() => setIsSentSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center shadow-xs">
                <Send className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-bold font-moul text-slate-900">
                ប្រព័ន្ធផ្ញើសារស្វ័យប្រវត្តិ Telegram Bot & Notifications
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              ជូនដំណឹងភ្លាមៗទៅកាន់អាណាព្យាបាលនៅពេលសិស្សអវត្តមានឥតច្បាប់ ឬមកយឺត
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Bot ដំណើរការធម្មតា (Online)</span>
            </span>
          </div>
        </div>

        {/* Telegram Config Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">ឈ្មោះ Bot</span>
            <div className="text-xs font-mono font-bold text-blue-950 mt-0.5">
              @ToulsambourSchoolAlert_bot
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Bot Token API</span>
            <div className="text-xs font-mono text-slate-600 truncate mt-0.5">
              6744553829:AAFtG_SchoolToulsambourBot_Simulated
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">ចំនួនសារបានបញ្ជូន</span>
            <div className="text-xs font-bold text-emerald-700 mt-0.5">
              {notifications.length} សារ (ជោគជ័យ ១០០%)
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Test Form & Sent History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Test Alert Sender Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
            <Bot className="w-4 h-4 text-sky-600" />
            <h3 className="text-xs font-bold text-slate-900">
              សាកល្បងផ្ញើសារជូនដំណឹង Telegram
            </h3>
          </div>

          <form onSubmit={handleSendTestAlert} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ជ្រើសរើសសិស្ស
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
              >
                {students.map((s) => {
                  const c = classes.find((item) => item.id === s.classId);
                  return (
                    <option key={s.id} value={s.id}>
                      {s.khmerName} ({c?.name}) - អាណាព្យាបាល: {s.parentName}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                មូលហេតុ / ស្ថានភាព
              </label>
              <input
                type="text"
                value={testReason}
                onChange={(e) => setTestReason(e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>ផ្ញើសារ Telegram ទៅអាណាព្យាបាល</span>
              </button>
            </div>

            {isSentSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>សារត្រូវបានបញ្ជូនទៅកាន់អាណាព្យាបាលដោយជោគជ័យ!</span>
              </div>
            )}
          </form>
        </div>

        {/* Notification History Feed */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-900" />
              <h3 className="text-xs font-bold text-slate-900">
                ប្រវត្តិសារ Telegram ដែលបានបញ្ជូនរួច ({notifications.length})
              </h3>
            </div>
            <span className="text-[10px] text-slate-400">ផ្ញើដោយស្វ័យប្រវត្តិតាម Realtime</span>
          </div>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-sky-100 text-sky-700">
                      <Send className="w-3 h-3" />
                    </span>
                    <span className="text-xs font-bold text-slate-900">{notif.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-sans">
                    {new Date(notif.sentAt).toLocaleString('km-KH')}
                  </span>
                </div>

                <div className="mt-2 text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200/80 leading-relaxed font-khmer">
                  {notif.message}
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">អ្នកទទួល៖</span>
                    <strong className="text-slate-800">{notif.recipientName}</strong>
                    <span>({notif.recipientPhone})</span>
                  </div>

                  <span className="flex items-center gap-1 text-emerald-700 font-semibold text-[10px]">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>បានបញ្ជូនជោគជ័យ</span>
                  </span>
                </div>
              </div>
            ))}

            {notifications.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400">
                មិនទាន់មានប្រវត្តិសារជូនដំណឹងនៅឡើយទេ
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
