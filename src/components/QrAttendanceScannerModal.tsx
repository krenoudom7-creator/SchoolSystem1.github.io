import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import {
  Camera,
  QrCode,
  X,
  CheckCircle2,
  AlertCircle,
  Volume2,
  VolumeX,
  RotateCw,
  Barcode,
  Users,
  Clock,
  Sparkles,
  Search,
} from 'lucide-react';
import { Student, SchoolClass, AttendanceStatus } from '../types/index.ts';
import { safeAvatar, DEFAULT_STUDENT_AVATAR } from '../utils/avatar.ts';
import { formatKhmerDate } from '../utils/calculations.ts';

interface QrAttendanceScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  classes: SchoolClass[];
  selectedDate: string;
  selectedPeriod: string;
  onMarkAttendance: (studentId: string, status: AttendanceStatus) => void;
}

interface ScannedRecord {
  student: Student;
  scannedAt: string;
  status: 'success' | 'duplicate';
}

export const QrAttendanceScannerModal: React.FC<QrAttendanceScannerModalProps> = ({
  isOpen,
  onClose,
  students,
  classes,
  selectedDate,
  selectedPeriod,
  onMarkAttendance,
}) => {
  const [cameraActive, setCameraActive] = useState<boolean>(true);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [manualCode, setManualCode] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [lastScanned, setLastScanned] = useState<ScannedRecord | null>(null);
  const [scannedHistory, setScannedHistory] = useState<ScannedRecord[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const isCooldownRef = useRef<boolean>(false);
  const manualInputRef = useRef<HTMLInputElement | null>(null);

  // Play audio chime via Web Audio API
  const playBeep = useCallback((type: 'success' | 'warning' | 'error') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === 'success') {
        // High dual chime (880Hz then 1760Hz)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, ctx.currentTime);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1320, ctx.currentTime + 0.08);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc1.stop(ctx.currentTime + 0.12);
        osc2.start(ctx.currentTime + 0.08);
        osc2.stop(ctx.currentTime + 0.3);
      } else if (type === 'warning') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch {
      // AudioContext not allowed before user interaction or not supported
    }
  }, [soundEnabled]);

  // Process raw scanned code from QR or Barcode
  const handleProcessCode = useCallback((rawInput: string) => {
    if (!rawInput || !rawInput.trim()) return;
    const clean = rawInput.trim();

    // Check if code is JSON payload like {"id":"STU-0701",...}
    let targetCode = clean;
    if (clean.startsWith('{') && clean.endsWith('}')) {
      try {
        const parsed = JSON.parse(clean);
        targetCode = parsed.id || parsed.studentId || clean;
      } catch {
        // use raw string
      }
    }

    // Match student by studentId, id, or khmerName
    const matched = students.find(
      (s) =>
        s.studentId.toLowerCase() === targetCode.toLowerCase() ||
        s.id.toLowerCase() === targetCode.toLowerCase() ||
        s.khmerName.toLowerCase() === targetCode.toLowerCase()
    );

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    if (!matched) {
      playBeep('error');
      setErrorMessage(`មិនស្គាល់សិស្សដែលមានកូដ "${clean}" ទេ!`);
      setTimeout(() => setErrorMessage(''), 4000);
      return;
    }

    // Check if already scanned in current session
    const isDuplicate = scannedHistory.some((h) => h.student.id === matched.id);

    // Call mark attendance
    onMarkAttendance(matched.id, 'present');

    const record: ScannedRecord = {
      student: matched,
      scannedAt: timeStr,
      status: isDuplicate ? 'duplicate' : 'success',
    };

    setLastScanned(record);
    setScannedHistory((prev) => [record, ...prev.filter((p) => p.student.id !== matched.id)]);
    setErrorMessage('');

    if (isDuplicate) {
      playBeep('warning');
    } else {
      playBeep('success');
    }
  }, [students, scannedHistory, onMarkAttendance, playBeep]);

  // Start Camera Stream
  useEffect(() => {
    if (!isOpen || !cameraActive) return;

    let localStream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setHasCameraPermission(false);
          setErrorMessage('កម្មវិធីរុករកមិនគាំទ្រការប្រើកាមេរ៉ាទេ');
          return;
        }

        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        localStream = stream;
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
          setHasCameraPermission(true);
        }
      } catch (err) {
        console.warn('Camera error:', err);
        setHasCameraPermission(false);
        setErrorMessage('មិនអាចបើកកាមេរ៉ាបានទេ សូមអនុញ្ញាត Camera Permission ឬប្រើប្រអប់ Barcode ដោយផ្ទាល់');
      }
    };

    startCamera();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen, cameraActive, facingMode]);

  // QR Scanning Loop using jsQR
  useEffect(() => {
    if (!isOpen || !cameraActive || !hasCameraPermission) return;

    const scanFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
        scanIntervalRef.current = requestAnimationFrame(scanFrame);
        return;
      }

      if (isCooldownRef.current) {
        scanIntervalRef.current = requestAnimationFrame(scanFrame);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        scanIntervalRef.current = requestAnimationFrame(scanFrame);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data && code.data.trim()) {
        isCooldownRef.current = true;
        handleProcessCode(code.data);
        // Cooldown 1.5s to prevent continuous duplicate scans
        setTimeout(() => {
          isCooldownRef.current = false;
        }, 1500);
      }

      scanIntervalRef.current = requestAnimationFrame(scanFrame);
    };

    scanIntervalRef.current = requestAnimationFrame(scanFrame);

    return () => {
      if (scanIntervalRef.current) {
        cancelAnimationFrame(scanIntervalRef.current);
      }
    };
  }, [isOpen, cameraActive, hasCameraPermission, handleProcessCode]);

  // Manual submission form
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleProcessCode(manualCode);
    setManualCode('');
    if (manualInputRef.current) {
      manualInputRef.current.focus();
    }
  };

  // Switch camera between environment and user
  const handleToggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[94vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-md">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-moul text-sm sm:text-base text-amber-300 font-bold">
                ម៉ាស៊ីនស្កេនកាតសិស្ស / QR Code កត់វត្តមាន
              </h3>
              <p className="text-xs text-slate-300">
                កាលបរិច្ឆេទ: {formatKhmerDate(selectedDate)} · {selectedPeriod}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                soundEnabled ? 'bg-white/15 text-white' : 'bg-rose-500/30 text-rose-200'
              }`}
              title={soundEnabled ? 'សំឡេងបើក' : 'សំឡេងបិទ'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Live Camera & Scanner Viewport */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            {/* Viewport Frame */}
            <div className="relative aspect-video sm:aspect-4/3 bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-800 shadow-inner flex items-center justify-center">
              {/* Video Element */}
              <video
                ref={videoRef}
                className={`w-full h-full object-cover ${!cameraActive || hasCameraPermission === false ? 'hidden' : ''}`}
                autoPlay
                muted
                playsInline
              />

              {/* Hidden Canvas for QR Extraction */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Overlay Scanner Target Reticle */}
              {cameraActive && hasCameraPermission && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-56 h-56 sm:w-64 sm:h-64 border-2 border-amber-400/80 rounded-2xl relative shadow-2xl">
                    {/* Corner Reticles */}
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-amber-400 rounded-tl-lg" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-amber-400 rounded-tr-lg" />
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-amber-400 rounded-bl-lg" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-amber-400 rounded-br-lg" />

                    {/* Animated Scanning Laser Line */}
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent absolute top-0 animate-bounce shadow-lg shadow-amber-400/50" />
                  </div>
                </div>
              )}

              {/* Camera Off or Permission Denied Message */}
              {(!cameraActive || hasCameraPermission === false) && (
                <div className="p-6 text-center text-slate-300 max-w-sm">
                  <Camera className="w-12 h-12 mx-auto text-slate-500 mb-2" />
                  <p className="text-sm font-semibold text-slate-200">
                    {hasCameraPermission === false ? 'មិនមានសិទ្ធិចូលប្រើកាមេរ៉ា' : 'កាមេរ៉ាត្រូវបានបិទ'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    លោកគ្រូអ្នកគ្រូអាចប្រើប្រាស់ឧបករណ៍ស្កេន Barcode Gun ឬវាយបញ្ចូលអត្តលេខផ្ទាល់ខាងក្រោមបាន។
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setCameraActive(true);
                      setHasCameraPermission(null);
                    }}
                    className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    ព្យាយាមភ្ជាប់កាមេរ៉ាម្តងទៀត
                  </button>
                </div>
              )}

              {/* Floating Camera Controls */}
              {cameraActive && hasCameraPermission && (
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
                  <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] text-amber-300 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    កំពុងស្កេនស្វ័យប្រវត្តិ...
                  </span>

                  <button
                    type="button"
                    onClick={handleToggleFacingMode}
                    className="px-2.5 py-1 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-lg text-[10px] text-white font-medium flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>ប្តូរកាមេរ៉ា</span>
                  </button>
                </div>
              )}
            </div>

            {/* Error Message Toast */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Manual Barcode / ID Input (Compatible with USB Barcode Scanners) */}
            <form onSubmit={handleManualSubmit} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Barcode className="w-4 h-4 text-blue-900" />
                  <span>ស្កេនដោយ Barcode Gun ឬវាយលេខសម្គាល់សិស្ស (Student ID)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">ចុច Enter ដើម្បីកត់ត្រា</span>
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    ref={manualInputRef}
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="ឧទាហរណ៍: STU-0701, STU-0805..."
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!manualCode.trim()}
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 disabled:bg-slate-300 text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors shadow-xs"
                >
                  កត់ត្រា
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Live Detection Feedback & Attendance History */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            {/* Last Scanned Student Highlight Card */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-4 shadow-md border border-slate-800">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-amber-400">លទ្ធផលស្កេនចុងក្រោយ</span>
                </div>
                {lastScanned && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      lastScanned.status === 'success'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {lastScanned.status === 'success' ? '✓ វត្តមានថ្មី' : 'ស្កេនរួចម្តងហើយ'}
                  </span>
                )}
              </div>

              {lastScanned ? (
                <div className="flex items-center gap-3.5">
                  <img
                    src={safeAvatar(lastScanned.student.photo, DEFAULT_STUDENT_AVATAR)}
                    alt={lastScanned.student.khmerName}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shadow-md flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_STUDENT_AVATAR;
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-moul text-sm text-white font-bold truncate">
                      {lastScanned.student.khmerName}
                    </h4>
                    <p className="text-xs text-slate-300 font-medium">
                      {lastScanned.student.latinName} · ភេទ {lastScanned.student.gender}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-amber-300">
                      <span className="px-1.5 py-0.5 bg-white/10 rounded-md font-mono">
                        {lastScanned.student.studentId}
                      </span>
                      <span>
                        {classes.find((c) => c.id === lastScanned.student.classId)?.name}
                      </span>
                      <span className="text-slate-400">· {lastScanned.scannedAt}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-slate-400">
                  <QrCode className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">សូមដាក់កាតសិស្ស ឬ QR Code ឲ្យចំប្រអប់កាមេរ៉ា</p>
                </div>
              )}
            </div>

            {/* Scanned History List in this session */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 flex-1 flex flex-col min-h-[220px]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-900" />
                  <h4 className="text-xs font-bold text-slate-900">
                    សិស្សដែលបានកត់វត្តមានតាម QR ({scannedHistory.length} នាក់)
                  </h4>
                </div>
                {scannedHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setScannedHistory([])}
                    className="text-[10px] text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    សម្អាតបញ្ជី
                  </button>
                )}
              </div>

              {scannedHistory.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 py-6">
                  <Clock className="w-6 h-6 mb-1.5 opacity-40" />
                  <p className="text-xs">មិនទាន់មានសិស្សស្កេននៅក្នុងវេននេះនៅឡើយទេ</p>
                </div>
              ) : (
                <div className="space-y-2 overflow-y-auto max-h-[260px] pr-1">
                  {scannedHistory.map((rec) => {
                    const studentClass = classes.find((c) => c.id === rec.student.classId);
                    return (
                      <div
                        key={`${rec.student.id}-${rec.scannedAt}`}
                        className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={safeAvatar(rec.student.photo, DEFAULT_STUDENT_AVATAR)}
                            alt={rec.student.khmerName}
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = DEFAULT_STUDENT_AVATAR;
                            }}
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate">
                              {rec.student.khmerName}
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                              <span className="font-mono">{rec.student.studentId}</span>
                              <span>·</span>
                              <span>{studentClass?.name || ''}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[10px] font-mono text-slate-400">
                            {rec.scannedAt}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            វត្តមាន
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>ទិន្នន័យវត្តមាននឹងធ្វើសមកាលកម្មជាមួយ Central Database ដោយស្វ័យប្រវត្តិ</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors shadow-xs"
          >
            រួចរាល់ (បិទផ្ទាំង)
          </button>
        </div>
      </div>
    </div>
  );
};
