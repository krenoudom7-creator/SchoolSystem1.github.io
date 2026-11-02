import React, { Component, ErrorInfo, ReactNode } from 'react';
import { SCHOOL_LOGO_URL } from '../utils/schoolLogo.ts';
import { RotateCcw, AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in application:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetCache = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn('Could not clear storage:', e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 font-khmer">
          <div className="bg-slate-800/95 border border-slate-700 rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl">
            <div className="w-20 h-20 mx-auto mb-4 p-0.5 rounded-full bg-white shadow-lg border-2 border-amber-400 flex items-center justify-center overflow-hidden">
              <img
                src={SCHOOL_LOGO_URL}
                alt="Logo អនុវិទ្យាល័យ ហ៊ុន សែន ទួលសំបួរ"
                className="w-full h-full object-cover scale-[1.38] rounded-full"
              />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs rounded-full font-bold mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>ការស្តារប្រព័ន្ធឡើងវិញ</span>
            </div>

            <h2 className="text-lg font-bold text-slate-100 mb-2">
              សូមស្វាគមន៍មកកាន់ អនុវិទ្យាល័យ ហ៊ុន សែន ទួលសំបួរ
            </h2>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              ប្រព័ន្ធកំពុងដំណើរការឡើងវិញ។ សូមចុចប៊ូតុងខាងក្រោមដើម្បីផ្ទុកទំព័រកម្មវិធីឡើងវិញ។
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={this.handleReload}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <RefreshCw className="w-4 h-4" />
                <span>ផ្ទុកឡើងវិញ (Reload)</span>
              </button>
              <button
                type="button"
                onClick={this.handleResetCache}
                className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>សម្អាត Cache & ចាប់ផ្តើមឡើងវិញ</span>
              </button>
            </div>

            {this.state.error && (
              <div className="mt-6 p-3 bg-slate-950/60 rounded-xl text-left border border-slate-700/50">
                <div className="text-[10px] text-slate-500 font-mono break-all line-clamp-3">
                  {this.state.error.message}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
