import React, { useState, useEffect } from 'react';
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
  Settings,
  RefreshCw,
  Key,
  ShieldCheck,
  Zap,
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
  const currentSettings = storage.getTelegramSettings();

  const [botUsername, setBotUsername] = useState(currentSettings.botUsername || '@machin_caffee_bot');
  const [botToken, setBotToken] = useState(currentSettings.botToken || '8854828129:AAHp_oHUOkQ1u9vJiT8tFU8HtSygyaZHWyU');
  const [chatId, setChatId] = useState(currentSettings.chatId || '');
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [settingsSavedMsg, setSettingsSavedMsg] = useState(false);

  // Bot Verification State
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    status: 'idle' | 'success' | 'error';
    message: string;
    botInfo?: any;
  }>({
    status: 'idle',
    message: '',
  });

  // Recent chats from getUpdates
  const [isFetchingChats, setIsFetchingChats] = useState(false);
  const [recentChats, setRecentChats] = useState<Array<{ id: string; title: string; type: string }>>([]);

  // Test send state
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [testReason, setTestReason] = useState<string>('អវត្តមានឥតច្បាប់ ម៉ោងទី ១');
  const [customChatId, setCustomChatId] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [sendFeedback, setSendFeedback] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Auto-verify bot connection on mount
  useEffect(() => {
    handleVerifyBot(botToken);
  }, []);

  const handleVerifyBot = async (tokenToTest: string) => {
    setIsVerifying(true);
    setVerifyResult({ status: 'idle', message: '' });

    try {
      const cleanToken = tokenToTest.trim();
      const res = await fetch(`https://api.telegram.org/bot${cleanToken}/getMe`);
      const data = await res.json();
      if (data.ok && data.result) {
        setVerifyResult({
          status: 'success',
          message: `Bot ភ្ជាប់ជោគជ័យ៖ ${data.result.first_name} (@${data.result.username}) - ID: ${data.result.id}`,
          botInfo: data.result,
        });
        if (data.result.username) {
          setBotUsername(`@${data.result.username}`);
        }
      } else {
        setVerifyResult({
          status: 'error',
          message: data.description || 'Token មិនត្រឹមត្រូវ ឬមិនអាចតភ្ជាប់បានទេ',
        });
      }
    } catch (err: any) {
      setVerifyResult({
        status: 'error',
        message: err.message || 'កំហុសបណ្តាញតភ្ជាប់ Telegram API',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleFetchRecentChats = async () => {
    setIsFetchingChats(true);
    try {
      const cleanToken = botToken.trim();
      const res = await fetch(`https://api.telegram.org/bot${cleanToken}/getUpdates?offset=-10`);
      const data = await res.json();
      if (data.ok && Array.isArray(data.result)) {
        const chatsMap = new Map();
        for (const item of data.result) {
          const chat = item.message?.chat || item.channel_post?.chat || item.my_chat_member?.chat;
          if (chat && chat.id) {
            chatsMap.set(String(chat.id), {
              id: String(chat.id),
              title: chat.title || `${chat.first_name || ''} ${chat.last_name || ''}`.trim() || chat.username || 'Chat',
              type: chat.type,
            });
          }
        }
        const extracted = Array.from(chatsMap.values());
        setRecentChats(extracted);
        if (extracted.length > 0 && !chatId) {
          setChatId(extracted[0].id);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch updates:', e);
    } finally {
      setIsFetchingChats(false);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    storage.updateTelegramSettings({
      botUsername: botUsername.trim(),
      botToken: botToken.trim(),
      chatId: chatId.trim(),
      isEnabled: true,
    });
    setSettingsSavedMsg(true);
    setIsEditingSettings(false);
    handleVerifyBot(botToken.trim());
    onRefresh();
    setTimeout(() => setSettingsSavedMsg(false), 3000);
  };

  const handleSendTestAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find((s) => s.id === selectedStudentId);
    if (!student) return;

    const targetClass = classes.find((c) => c.id === student.classId);
    const className = targetClass?.name || 'ថ្នាក់រៀន';
    const targetChatId = customChatId.trim() || chatId.trim();

    const testMsg = `🔔 <b>[អនុវិទ្យាល័យ ហ៊ុន សែន ទួលសំបួរ]</b>
<b>ដំណឹងអវត្តមានសិស្ស៖</b>
សូមជម្រាបជូនលោក/លោកស្រី <b>${student.parentName}</b> (${student.parentRelationship} របស់សិស្ស <b>${student.khmerName}</b> ថ្នាក់ <b>${className}</b>) ថាកូនរបស់លោក/លោកស្រីបាន «<b>${testReason}</b>» នៅថ្ងៃនេះ។
📍 សូមមេត្តាទាក់ទងមកកាន់លេខាធិការដ្ឋានសាលា ឬគ្រូប្រចាំថ្នាក់ដើម្បីបំភ្លឺ។ សូមអរគុណ!`;

    setIsSending(true);
    setSendFeedback({ type: null, message: '' });

    try {
      const cleanToken = botToken.trim();
      let resData: any = null;

      if (targetChatId) {
        const response = await fetch(`https://api.telegram.org/bot${cleanToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: targetChatId,
            text: testMsg,
            parse_mode: 'HTML',
          }),
        });
        resData = await response.json();
      } else {
        // Local record
        resData = {
          ok: true,
          simulated: true,
        };
      }

      // Record in local notification history
      const newNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        type: 'telegram',
        recipientName: `${student.parentName} (${student.parentRelationship})`,
        recipientPhone: student.parentPhone,
        studentName: student.khmerName,
        title: `ដំណឹងអវត្តមាន - ${student.khmerName}`,
        message: testMsg.replace(/<[^>]*>/g, ''),
        status: 'sent',
        sentAt: new Date().toISOString(),
      };

      storage.addNotification(newNotif, 'Telegram Bot');
      onRefresh();

      if (resData.ok) {
        if (resData.simulated) {
          setSendFeedback({
            type: 'success',
            message: 'សារត្រូវបានកត់ត្រាទុកក្នុងប្រព័ន្ធ! (ដើម្បីបញ្ជូនចូល Telegram ផ្ទាល់ សូមបញ្ចូល Chat ID ឬផ្ញើសារ /start ទៅ @machin_caffee_bot)',
          });
        } else {
          setSendFeedback({
            type: 'success',
            message: `សារ Telegram ត្រូវបានបញ្ជូនចូល Bot ដោយជោគជ័យ! (Message ID: ${resData.result?.message_id || 'OK'})`,
          });
        }
      } else {
        setSendFeedback({
          type: 'error',
          message: `កំហុស Telegram: ${resData.description || 'សូមពិនិត្យមើល Chat ID ឬចុច Start Bot ជាមុន'}`,
        });
      }
    } catch (err: any) {
      setSendFeedback({
        type: 'error',
        message: err.message || 'កំហុសបណ្តាញ មិនអាចផ្ញើសារបានទេ',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Bot Info Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-md">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold font-moul text-slate-900 tracking-wide">
                  ប្រព័ន្ធ Telegram Bot ជូនដំណឹងវត្តមានសិស្ស
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hun Sen Toulsambour Secondary School · Telegram Bot Automation
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Telegram Link direct button */}
            <a
              href={`https://t.me/${botUsername.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs"
            >
              <Bot className="w-4 h-4 text-sky-600" />
              <span>បើក Bot Telegram ({botUsername})</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            {/* Edit / Config Toggle Button */}
            <button
              type="button"
              onClick={() => setIsEditingSettings(!isEditingSettings)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Settings className="w-4 h-4" />
              <span>{isEditingSettings ? 'បិទការកំណត់' : 'កែប្រែ Bot'}</span>
            </button>
          </div>
        </div>

        {/* Status Verification Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-600">ស្ថានភាព Bot៖</span>
            {isVerifying ? (
              <span className="flex items-center gap-1.5 text-amber-600">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>កំពុងផ្ទៀងផ្ទាត់ការតភ្ជាប់...</span>
              </span>
            ) : verifyResult.status === 'success' ? (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{verifyResult.message}</span>
              </span>
            ) : verifyResult.status === 'error' ? (
              <span className="flex items-center gap-1 text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200 text-[11px] font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{verifyResult.message}</span>
              </span>
            ) : (
              <span className="text-slate-400">មិនទាន់ផ្ទៀងផ្ទាត់</span>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleVerifyBot(botToken)}
            disabled={isVerifying}
            className="text-[11px] text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>ពិនិត្យឡើងវិញ (Refresh)</span>
          </button>
        </div>

        {/* Telegram Config Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">ឈ្មោះ Bot (Username)</span>
            <div className="text-xs font-mono font-bold text-sky-800 mt-1 flex items-center gap-1">
              <span>{botUsername}</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-sky-100 text-sky-700 rounded-sm">Active</span>
            </div>
          </div>

          <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Bot Token API</span>
            <div className="text-xs font-mono text-slate-700 truncate mt-1" title={botToken}>
              {botToken.substring(0, 15)}•••••••••••••••••••••
            </div>
          </div>

          <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">ចំនួនសារបានផ្ញើ</span>
            <div className="text-xs font-bold text-emerald-700 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{notifications.length} សារ (ជោគជ័យ)</span>
            </div>
          </div>
        </div>

        {/* Config Edit Panel (Collapsible) */}
        {isEditingSettings && (
          <div className="mt-5 p-4 bg-sky-50/50 rounded-2xl border border-sky-200 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 mb-3">
              <Key className="w-4 h-4 text-sky-700" />
              <h3 className="text-xs font-bold text-slate-900">
                កែប្រែការកំណត់ Telegram Bot Token & Chat ID
              </h3>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Bot Username (@)
                  </label>
                  <input
                    type="text"
                    value={botUsername}
                    onChange={(e) => setBotUsername(e.target.value)}
                    placeholder="@machin_caffee_bot"
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-600 focus:outline-hidden font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Bot Token (ពី @BotFather)
                  </label>
                  <input
                    type="text"
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    placeholder="8854828129:AAHp_oHUOkQ1u9vJiT8tFU8HtSygyaZHWyU"
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-600 focus:outline-hidden font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-700">
                    Default Chat ID ឬ Group ID (សម្រាប់ទទួលសារ)
                  </label>
                  <button
                    type="button"
                    onClick={handleFetchRecentChats}
                    disabled={isFetchingChats}
                    className="text-[10px] text-sky-700 hover:text-sky-900 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isFetchingChats ? 'animate-spin' : ''}`} />
                    <span>ស្វែងរក Chat ID ស្វ័យប្រវត្ត</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  placeholder="ឧទាហរណ៍៖ 123456789 ឬ -100123456789"
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-600 focus:outline-hidden font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  💡 គន្លឹះ៖ បើក Telegram ចូលទៅកាន់ <b>{botUsername}</b> រួចចុច <b>/start</b> ឬផ្ញើសារមួយ រួចចុច «ស្វែងរក Chat ID ស្វ័យប្រវត្ត» ដើម្បីចាប់យក ID។
                </p>

                {recentChats.length > 0 && (
                  <div className="mt-2 p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-700">Chat IDs ដែលបានរកឃើញថ្មីៗ៖</span>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {recentChats.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setChatId(c.id)}
                          className="px-2 py-0.5 text-[10px] bg-sky-100 hover:bg-sky-200 text-sky-900 rounded font-mono cursor-pointer"
                        >
                          {c.title} ({c.id})
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingSettings(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-lg shadow-xs cursor-pointer"
                >
                  រក្សាទុកការកំណត់
                </button>
              </div>
            </form>
          </div>
        )}

        {settingsSavedMsg && (
          <div className="mt-3 p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>ការកំណត់ Bot ត្រូវបានរក្សាទុកដោយជោគជ័យ!</span>
          </div>
        )}
      </div>

      {/* Grid: Test Alert Sender Card & History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Test Alert Sender Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
            <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">
                ផ្ញើសារសាកល្បងទៅ Telegram
              </h3>
              <p className="text-[10px] text-slate-400">តេស្តបញ្ជូនសារវត្តមានចូល Bot ពិតប្រាកដ</p>
            </div>
          </div>

          <form onSubmit={handleSendTestAlert} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ជ្រើសរើសសិស្ស
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-600 focus:outline-hidden"
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
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Chat ID គោលដៅ (បើមិនដាក់ ប្រើ Default ID)
              </label>
              <input
                type="text"
                value={customChatId}
                onChange={(e) => setCustomChatId(e.target.value)}
                placeholder={chatId || 'បញ្ចូល Chat ID របស់អ្នក...'}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-600 focus:outline-hidden font-mono"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSending}
                className="w-full py-2.5 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>{isSending ? 'កំពុងផ្ញើសារ...' : 'ផ្ញើសារទៅកាន់ Telegram'}</span>
              </button>
            </div>

            {sendFeedback.type && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                  sendFeedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {sendFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="leading-relaxed">{sendFeedback.message}</div>
              </div>
            )}
          </form>

          {/* Quick instructions box */}
          <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <div className="font-bold text-slate-800 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>របៀបទទួលសារក្នុង Telegram៖</span>
            </div>
            <p>១. ចុចចូលតំណភ្ជាប់ <a href={`https://t.me/${botUsername.replace('@', '')}`} target="_blank" rel="noreferrer" className="text-sky-700 font-bold underline">{botUsername}</a></p>
            <p>២. ចុចប៊ូតុង <b>Start</b> ក្នុង Telegram</p>
            <p>៣. ចុច «ស្វែងរក Chat ID ស្វ័យប្រវត្ត» ក្នុងផ្ទាំងកែប្រែ</p>
          </div>
        </div>

        {/* Notification History Feed */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-900" />
              <h3 className="text-xs font-bold text-slate-900">
                ប្រវត្តិសារ Telegram ដែលបានបញ្ជូន ({notifications.length})
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-sans">
              Bot: {botUsername}
            </span>
          </div>

          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-md bg-sky-100 text-sky-700">
                      <Send className="w-3 h-3" />
                    </span>
                    <span className="text-xs font-bold text-slate-900">{notif.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-sans">
                    {new Date(notif.sentAt).toLocaleString('km-KH')}
                  </span>
                </div>

                <div className="mt-2 text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200/80 leading-relaxed font-khmer whitespace-pre-line">
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
                    <span>បញ្ជូនតាម Telegram Bot</span>
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
