import React, { useEffect, useState } from 'react';
import { Bell, X, AlertTriangle, CheckCircle, Info, ExternalLink } from 'lucide-react';
import { playBellChime } from '../utils/audio.ts';

export interface ToastData {
  id?: string;
  title: string;
  message: string;
  type?: 'system' | 'telegram' | 'warning' | 'attendance' | 'info' | 'success' | 'alert';
  actionLabel?: string;
  actionTab?: string;
  duration?: number; // ms, default 6000
}

interface BellNotificationToastProps {
  toast: ToastData | null;
  onClose: () => void;
  onNavigate?: (tab: string) => void;
}

export const BellNotificationToast: React.FC<BellNotificationToastProps> = ({
  toast,
  onClose,
  onNavigate,
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!toast) return;

    // Play synthesized bell chime sound
    playBellChime();

    const duration = toast.duration || 6000;
    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;

    setProgress(100);

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(progressTimer);
          return 0;
        }
        return prev - step;
      });
    }, intervalTime);

    const closeTimer = setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(closeTimer);
    };
    // Only re-run when toast reference changes (new notification arrives)
  }, [toast]);

  if (!toast) return null;

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-[9999] max-w-sm w-full animate-in slide-in-from-top-4 duration-300 pointer-events-auto font-khmer shadow-2xl">
      {/* RGB Flow Outer Glow Wrapper */}
      <div className="rgb-glow-border p-0.5 shadow-2xl">
        <div className="bg-slate-950/95 backdrop-blur-md rounded-2xl p-4 text-white border border-white/10 relative overflow-hidden">
          {/* Top Row: Bell, Title, Close Button */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              {/* Ringing Bell Icon with RGB aura */}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-bold shadow-lg flex-shrink-0 animate-pulse">
                <Bell className="w-5 h-5 animate-bell-ring text-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase tracking-wide">
                    សារលោតជូនដំណឹង (Alert)
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-white mt-1 leading-snug line-clamp-1">
                  {toast.title}
                </h4>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer flex-shrink-0"
              title="បិទសារ"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Message Body */}
          <p className="text-xs text-slate-300 mt-2.5 leading-relaxed line-clamp-2 pl-0.5">
            {toast.message}
          </p>

          {/* Footer Action */}
          <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">ទើបតែមកដល់ឥឡូវនេះ</span>
            {onNavigate && (
              <button
                type="button"
                onClick={() => {
                  onNavigate(toast.actionTab || 'telegram');
                  onClose();
                }}
                className="text-amber-300 hover:text-amber-200 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>{toast.actionLabel || 'មើលលម្អិត'}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Auto-Dismiss Timer Progress Line */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-amber-400 via-rose-500 to-purple-500 transition-all duration-75"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
