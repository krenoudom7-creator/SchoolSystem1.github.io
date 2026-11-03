import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  SlidersHorizontal,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Sparkles,
  Check,
  X,
  CalendarCheck2,
  FileSpreadsheet,
  Image as ImageIcon,
  RotateCcw,
  Video,
  Upload,
  Volume2,
  VolumeX,
  Maximize2,
  Film,
  Layout,
} from 'lucide-react';
import { BannerSlide } from '../types/index.ts';
import { storage } from '../services/storage.ts';
import { KhmerFourCorners } from './KhmerOrnament.tsx';

interface HeroBannerCarouselProps {
  banners: BannerSlide[];
  onNavigate: (tab: string) => void;
  isAdmin: boolean;
  onBannersChange?: () => void;
}

const GRADIENT_PRESETS = [
  { label: 'ខៀវទឹកប៊ិច (Classic Blue)', value: 'from-blue-950 via-indigo-950 to-slate-900' },
  { label: 'ស្វាយរាជវង្ស (Royal Purple)', value: 'from-purple-950 via-indigo-950 to-blue-950' },
  { label: 'បៃតងត្បូងមរកត (Emerald Tech)', value: 'from-slate-950 via-blue-950 to-emerald-950' },
  { label: 'ក្រហមស្វាយរាត្រី (Sunset Crimson)', value: 'from-rose-950 via-slate-900 to-indigo-950' },
  { label: 'ខ្មៅមាសប្រណីត (Obsidian Gold)', value: 'from-slate-950 via-amber-950/70 to-slate-900' },
];

const SAMPLE_VIDEO_PRESETS = [
  {
    label: 'សកម្មភាពសិក្សាក្នុងថ្នាក់រៀន (Classroom Learning)',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-students-working-in-a-classroom-4747-large.mp4',
  },
  {
    label: 'បណ្ណាល័យ និងការស្រាវជ្រាវ (School Library)',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-reading-a-book-in-a-library-4726-large.mp4',
  },
  {
    label: 'បច្ចេកវិទ្យាអប់រំឌីជីថល (Digital Campus)',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-working-on-a-computer-4926-large.mp4',
  },
  {
    label: 'ធម្មជាតិ និងបរិយាកាសសាលា (Campus Nature)',
    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
  },
];

// Helper to extract YouTube Video ID from various YouTube URL formats
function extractYouTubeId(url?: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const regExp =
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i;
  const match = trimmed.match(regExp);
  return match && match[1] ? match[1] : null;
}

// Lightweight IndexedDB helper for persisting uploaded local video files without overflowing localStorage
const IDB_NAME = 'toulsambour_media_db';
const IDB_STORE = 'banner_videos';

function openMediaDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const req = window.indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveVideoBlobToIdb(key: string, file: Blob): Promise<string> {
  const db = await openMediaDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    store.put(file, key);
    tx.oncomplete = () => {
      db.close();
      resolve(`idb://${key}`);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

async function loadVideoBlobFromIdb(key: string): Promise<Blob | null> {
  try {
    const db = await openMediaDb();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(key);
      req.onsuccess = () => {
        db.close();
        resolve((req.result as Blob) || null);
      };
      req.onerror = () => {
        db.close();
        resolve(null);
      };
    });
  } catch {
    return null;
  }
}

export const HeroBannerCarousel: React.FC<HeroBannerCarouselProps> = ({
  banners,
  onNavigate,
  isAdmin,
  onBannersChange,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [slideInterval, setSlideInterval] = useState(6000); // 6s default
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Video playback & sound states
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [fullscreenVideoSlide, setFullscreenVideoSlide] = useState<BannerSlide | null>(null);
  const [resolvedIdbUrls, setResolvedIdbUrls] = useState<Record<string, string>>({});
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const videoFileInputRef = useRef<HTMLInputElement | null>(null);

  // Editable banners state for the manager modal
  const [editList, setEditList] = useState<BannerSlide[]>([]);
  const [editingSlide, setEditingSlide] = useState<BannerSlide | null>(null);

  const activeSlides = banners.filter((b) => b.isActive).sort((a, b) => a.order - b.order);
  const totalSlides = activeSlides.length > 0 ? activeSlides.length : 1;

  const currentSlide = activeSlides[currentIdx] || banners[0] || {
    id: 'fallback',
    badge: 'អនុវិទ្យាល័យទួលសំបួរ',
    location: 'ឃុំទួលសំបួរ ស្រុកស្ទឹងត្រង់',
    title: 'ផ្ទាំងគ្រប់គ្រងទូទៅរបស់សាលារៀន',
    subtitle: 'ប្រព័ន្ធគ្រប់គ្រងទិន្នន័យអប់រំ និងវត្តមានសិស្សឌីជីថល',
    gradient: 'from-blue-950 via-indigo-900 to-blue-900',
    isActive: true,
    order: 1,
  };

  const currentSlideHasVideo = Boolean(
    currentSlide.videoUrl &&
      currentSlide.videoUrl.trim() !== '' &&
      (currentSlide.mediaType === 'video' || !currentSlide.mediaType)
  );

  // Resolve any idb:// video URLs in banners or editList into object URLs
  useEffect(() => {
    let isMounted = true;
    const allSlides = [...banners, ...editList, ...(editingSlide ? [editingSlide] : [])];
    allSlides.forEach(async (slide) => {
      if (slide.videoUrl && slide.videoUrl.startsWith('idb://')) {
        const key = slide.videoUrl.replace('idb://', '');
        if (!resolvedIdbUrls[slide.videoUrl]) {
          const blob = await loadVideoBlobFromIdb(key);
          if (blob && isMounted) {
            const objUrl = URL.createObjectURL(blob);
            setResolvedIdbUrls((prev) => ({ ...prev, [slide.videoUrl!]: objUrl }));
          }
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, [banners, editList, editingSlide]);

  // Sync mute state when slide changes if slide defines isVideoMuted
  useEffect(() => {
    if (typeof currentSlide.isVideoMuted === 'boolean') {
      setIsMuted(currentSlide.isVideoMuted);
    }
  }, [currentSlide.id]);

  // Auto-play timer (gives longer time or pauses if a video slide is active and playing)
  useEffect(() => {
    if (!isAutoPlay || isHovered || activeSlides.length <= 1 || fullscreenVideoSlide) return;

    // Give video slides more time (15s) so users can enjoy the video before rotating
    const effectiveInterval = currentSlideHasVideo ? Math.max(slideInterval, 15000) : slideInterval;

    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % activeSlides.length);
    }, effectiveInterval);

    return () => clearInterval(timer);
  }, [isAutoPlay, isHovered, activeSlides.length, slideInterval, currentSlideHasVideo, fullscreenVideoSlide]);

  // Keep index within bounds if slide count changes
  useEffect(() => {
    if (currentIdx >= activeSlides.length && activeSlides.length > 0) {
      setCurrentIdx(0);
    }
  }, [activeSlides.length, currentIdx]);

  const getPlayableVideoUrl = (rawUrl?: string): string => {
    if (!rawUrl) return '';
    if (rawUrl.startsWith('idb://')) {
      return resolvedIdbUrls[rawUrl] || '';
    }
    return rawUrl;
  };

  const handleNext = () => {
    if (activeSlides.length <= 1) return;
    setCurrentIdx((prev) => (prev + 1) % activeSlides.length);
  };

  const handlePrev = () => {
    if (activeSlides.length <= 1) return;
    setCurrentIdx((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
  };

  const openEditor = (startInVideoMode = false) => {
    const all = storage.getAllBanners();
    const clonedList = all.map((b) => ({ ...b }));
    setEditList(clonedList);
    const targetSlide =
      clonedList.find((b) => b.id === currentSlide.id) || clonedList[0] || null;
    if (targetSlide && startInVideoMode) {
      const updatedTarget: BannerSlide = {
        ...targetSlide,
        mediaType: 'video',
        videoUrl:
          targetSlide.videoUrl ||
          SAMPLE_VIDEO_PRESETS[0].url,
        videoLayout: targetSlide.videoLayout || 'split',
        videoOpacity: targetSlide.videoOpacity ?? 55,
      };
      setEditingSlide(updatedTarget);
      setEditList(clonedList.map((s) => (s.id === updatedTarget.id ? updatedTarget : s)));
    } else {
      setEditingSlide(targetSlide ? { ...targetSlide } : null);
    }
    setIsEditorOpen(true);
  };

  const handleSaveEditor = () => {
    storage.saveBanners(editList);
    setIsEditorOpen(false);
    if (onBannersChange) onBannersChange();
  };

  const handleAddNewSlide = (asVideo = false) => {
    const newSlide: BannerSlide = {
      id: `banner-${Date.now()}`,
      badge: asVideo ? 'វីដេអូសកម្មភាពសាលា' : 'សេចក្ដីជូនដំណឹងថ្មី',
      location: 'អនុវិទ្យាល័យ ហ៊ុន សែន ទួលសំបួរ',
      title: asVideo ? 'វីដេអូបង្ហាញពីសកម្មភាពសិក្សា និងសាលារៀន' : 'ចំណងជើងផ្ទាំង Banner ថ្មី',
      subtitle: asVideo
        ? 'ទស្សនាវីដេអូសកម្មភាពសិក្សា ការអប់រំឌីជីថល និងបរិយាកាសសាលារៀនរបស់យើង...'
        : 'បញ្ចូលការពណ៌នាលម្អិតអំពីកម្មវិធី ឬព័ត៌មានសិក្សា...',
      imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200&auto=format&fit=crop&q=80',
      videoUrl: asVideo ? SAMPLE_VIDEO_PRESETS[0].url : '',
      mediaType: asVideo ? 'video' : 'image',
      videoLayout: 'split',
      videoOpacity: 55,
      isVideoMuted: true,
      gradient: 'from-blue-950 via-indigo-950 to-slate-900',
      primaryButtonText: 'ពិនិត្យមើលឥឡូវនេះ',
      primaryButtonAction: 'attendance',
      secondaryButtonText: 'ព័ត៌មានបន្ថែម',
      secondaryButtonAction: 'students',
      isActive: true,
      order: editList.length + 1,
    };
    const updated = [...editList, newSlide];
    setEditList(updated);
    setEditingSlide(newSlide);
  };

  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingSlide) return;

    if (!file.type.startsWith('video/')) {
      alert('សូមជ្រើសរើសឯកសារប្រភេទវីដេអូ (MP4, WebM, MOV)!');
      return;
    }

    // Warn if video exceeds 50MB
    if (file.size > 50 * 1024 * 1024) {
      alert('ទំហំវីដេអូធំពេក (លើសពី 50MB)។ សូមជ្រើសរើសវីដេអូក្រោម 50MB ឬប្រើតំណភ្ជាប់ YouTube / MP4 Link។');
      return;
    }

    setIsUploadingVideo(true);
    try {
      const idbKey = `banner_vid_${editingSlide.id}_${Date.now()}`;
      const idbUri = await saveVideoBlobToIdb(idbKey, file);
      const objectUrl = URL.createObjectURL(file);
      setResolvedIdbUrls((prev) => ({ ...prev, [idbUri]: objectUrl }));

      const updated: BannerSlide = {
        ...editingSlide,
        mediaType: 'video',
        videoUrl: idbUri,
        videoLayout: editingSlide.videoLayout || 'split',
        videoOpacity: editingSlide.videoOpacity ?? 60,
      };
      setEditingSlide(updated);
      setEditList((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    } catch (err) {
      console.error('Failed to store video in IndexedDB:', err);
      alert('មិនអាចរក្សាទុកវីដេអូបានទេ។ សូមសាកល្បងម្ដងទៀត។');
    } finally {
      setIsUploadingVideo(false);
      if (videoFileInputRef.current) {
        videoFileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteSlide = (id: string) => {
    if (editList.length <= 1) {
      alert('ត្រូវរក្សាទុកផ្ទាំង Banner យ៉ាងហោចណាស់ ១!');
      return;
    }
    const updated = editList.filter((b) => b.id !== id);
    setEditList(updated);
    if (editingSlide?.id === id) {
      setEditingSlide(updated[0] ? { ...updated[0] } : null);
    }
  };

  const handleMoveSlide = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= editList.length) return;
    const cloned = [...editList];
    const temp = cloned[index];
    cloned[index] = cloned[targetIdx];
    cloned[targetIdx] = temp;
    cloned.forEach((item, idx) => {
      item.order = idx + 1;
    });
    setEditList(cloned);
  };

  const handleResetDefaults = () => {
    if (confirm('តើអ្នកពិតជាចង់កំណត់ផ្ទាំង Banner ទាំងអស់ទៅសភាពដើមវិញមែនទេ?')) {
      localStorage.removeItem('toulsambour_school_db_v4');
      window.location.reload();
    }
  };

  const currentYouTubeId = extractYouTubeId(currentSlide.videoUrl);
  const currentPlayableVideoUrl = getPlayableVideoUrl(currentSlide.videoUrl);
  const currentVideoLayout = currentSlide.videoLayout || 'split';
  const currentVideoOpacity = (currentSlide.videoOpacity ?? 50) / 100;

  return (
    <div className="relative">
      {/* Dynamic Animated RGB Flow Border Wrapper */}
      <div className="rgb-glow-border">
        {/* Banner Inner Card */}
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`relative rounded-3xl overflow-hidden text-white bg-gradient-to-r ${currentSlide.gradient} shadow-2xl transition-all duration-700 min-h-[245px] sm:min-h-[265px] flex flex-col justify-between border border-amber-400/35`}
        >
          {/* Traditional Golden Khmer Kbach 4-Corner Ornaments */}
          <KhmerFourCorners size={44} variant="gold" />

          {/* Background Media Layer (Full Background Video OR Background Image) */}
          {currentSlideHasVideo && currentVideoLayout === 'background' ? (
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
              {currentYouTubeId ? (
                <iframe
                  key={`yt-bg-${currentSlide.id}-${isMuted}`}
                  src={`https://www.youtube.com/embed/${currentYouTubeId}?autoplay=1&mute=${
                    isMuted ? 1 : 0
                  }&loop=1&playlist=${currentYouTubeId}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1`}
                  title={currentSlide.title}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  style={{ opacity: currentVideoOpacity }}
                  className="w-full h-full object-cover scale-125 pointer-events-none border-0"
                />
              ) : currentPlayableVideoUrl ? (
                <video
                  key={`vid-bg-${currentSlide.id}-${currentPlayableVideoUrl}`}
                  src={currentPlayableVideoUrl}
                  autoPlay
                  loop
                  playsInline
                  muted={isMuted}
                  style={{ opacity: currentVideoOpacity }}
                  className="w-full h-full object-cover transition-opacity duration-700"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-slate-950/30"></div>
            </div>
          ) : (
            currentSlide.imageUrl && (
              <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <img
                  src={currentSlide.imageUrl}
                  alt="Banner Background"
                  className="w-full h-full object-cover opacity-20 scale-105 transition-all duration-1000 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80"></div>
                <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-radial from-amber-400/10 via-transparent to-transparent"></div>
              </div>
            )
          )}

          {/* Ambient Lighting Gradients */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* Top Bar inside Banner: Slide Badge, Controls & Quick Video/Edit */}
          <div className="relative z-10 p-5 sm:p-6 pb-0 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full shadow-xs backdrop-blur-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{currentSlide.badge}</span>
              </span>
              {currentSlideHasVideo && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-rose-500/30 text-rose-200 border border-rose-400/40 rounded-full backdrop-blur-xs">
                  <Film className="w-3 h-3 text-rose-300 animate-pulse" />
                  <span>វីដេអូ (Video)</span>
                </span>
              )}
              {currentSlide.location && (
                <span className="text-xs text-blue-200/90 font-medium hidden sm:inline">
                  · {currentSlide.location}
                </span>
              )}
            </div>

            {/* Banner Control Widgets */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Video Sound Mute/Unmute & Fullscreen Controls when slide has video */}
              {currentSlideHasVideo && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsMuted(!isMuted)}
                    title={isMuted ? 'បើកសំឡេងវីដេអូ (Unmute)' : 'បិទសំឡេងវីដេអូ (Mute)'}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border transition-all flex items-center gap-1 cursor-pointer backdrop-blur-xs ${
                      !isMuted
                        ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400/40'
                        : 'bg-black/35 hover:bg-black/55 text-white border-white/15'
                    }`}
                  >
                    {isMuted ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5 text-amber-300" />
                        <span className="hidden md:inline">បើកសំឡេង</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-emerald-300" />
                        <span className="hidden md:inline">សំឡេងបើក</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setFullscreenVideoSlide(currentSlide)}
                    title="មើលវីដេអូពេញអេក្រង់ (Fullscreen Video)"
                    className="p-1.5 bg-black/35 hover:bg-black/55 text-white rounded-full border border-white/15 transition-colors cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-amber-300" />
                  </button>
                </>
              )}

              {/* Slide Counter [1 / 3] */}
              <span className="text-[11px] font-mono font-bold bg-black/40 text-slate-200 px-2.5 py-1 rounded-full border border-white/10 backdrop-blur-xs">
                {currentIdx + 1} / {totalSlides}
              </span>

              {/* Auto-Play Toggle */}
              <button
                type="button"
                onClick={() => setIsAutoPlay(!isAutoPlay)}
                title={isAutoPlay ? 'ផ្អាកការវិលស្វ័យប្រវត្តិ (Pause)' : 'ដំណើរការវិលស្វ័យប្រវត្តិ (Play)'}
                className="p-1.5 bg-black/30 hover:bg-black/50 text-white rounded-full border border-white/10 transition-colors cursor-pointer"
              >
                {isAutoPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>

              {/* Admin Quick Add Video & Customize Banner Buttons */}
              {isAdmin && (
                <>
                  <button
                    type="button"
                    onClick={() => openEditor(true)}
                    className="px-3 py-1 text-xs font-semibold bg-amber-400/20 hover:bg-amber-400/35 text-amber-200 rounded-full border border-amber-400/40 transition-all flex items-center gap-1.5 backdrop-blur-xs cursor-pointer shadow-xs"
                    title="ដាក់ ឬកែប្រែវីដេអូនៅលើផ្ទាំង Banner"
                  >
                    <Video className="w-3.5 h-3.5 text-amber-300" />
                    <span className="hidden sm:inline">ដាក់វីដេអូ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditor(false)}
                    className="px-3 py-1 text-xs font-semibold bg-white/15 hover:bg-white/25 text-white rounded-full border border-white/20 transition-all flex items-center gap-1.5 backdrop-blur-xs cursor-pointer shadow-xs"
                    title="កែសម្រួលផ្ទាំង Banner វិលដោយខ្លួនឯង"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-amber-300" />
                    <span className="hidden sm:inline">កែប្រែ Banner</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Main Slide Content (Supports Split Featured Video Player on Right OR Full Width) */}
          <div
            className={`relative z-10 p-5 sm:p-6 my-auto ${
              currentSlideHasVideo && currentVideoLayout === 'split'
                ? 'grid grid-cols-1 lg:grid-cols-12 gap-5 items-center'
                : ''
            }`}
          >
            <div
              className={
                currentSlideHasVideo && currentVideoLayout === 'split' ? 'lg:col-span-7' : ''
              }
            >
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold font-moul text-white tracking-wide leading-relaxed drop-shadow-md animate-in fade-in slide-in-from-bottom-2 duration-500">
                {currentSlide.title}
              </h2>
              <p className="text-xs sm:text-sm text-blue-100/90 mt-1.5 max-w-2xl leading-relaxed line-clamp-2 sm:line-clamp-none animate-in fade-in slide-in-from-bottom-3 duration-700">
                {currentSlide.subtitle}
              </p>

              {/* Slide Action Buttons */}
              <div className="mt-4 flex items-center gap-2.5 flex-wrap">
                {currentSlide.primaryButtonText && currentSlide.primaryButtonAction && (
                  <button
                    type="button"
                    onClick={() => onNavigate(currentSlide.primaryButtonAction!)}
                    className="px-4 py-2 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-blue-950 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
                  >
                    <CalendarCheck2 className="w-4 h-4 text-blue-950" />
                    <span>{currentSlide.primaryButtonText}</span>
                  </button>
                )}

                {currentSlide.secondaryButtonText && currentSlide.secondaryButtonAction && (
                  <button
                    type="button"
                    onClick={() => onNavigate(currentSlide.secondaryButtonAction!)}
                    className="px-3.5 py-2 text-xs font-semibold bg-white/15 hover:bg-white/25 text-white rounded-xl border border-white/25 transition-all flex items-center gap-2 cursor-pointer backdrop-blur-xs"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-amber-300" />
                    <span>{currentSlide.secondaryButtonText}</span>
                  </button>
                )}

                {currentSlideHasVideo && (
                  <button
                    type="button"
                    onClick={() => setFullscreenVideoSlide(currentSlide)}
                    className="px-3.5 py-2 text-xs font-semibold bg-rose-500/25 hover:bg-rose-500/40 text-amber-200 rounded-xl border border-amber-400/35 transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-xs"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-amber-300" />
                    <span>ទស្សនាវីដេអូពេញ</span>
                  </button>
                )}
              </div>
            </div>

            {/* Right-Side Featured Video Player (when videoLayout === 'split') */}
            {currentSlideHasVideo && currentVideoLayout === 'split' && (
              <div className="lg:col-span-5">
                <div className="relative rounded-2xl overflow-hidden border-2 border-amber-400/50 shadow-2xl bg-slate-950/90 aspect-video group">
                  {currentYouTubeId ? (
                    <iframe
                      key={`yt-split-${currentSlide.id}-${isMuted}`}
                      src={`https://www.youtube.com/embed/${currentYouTubeId}?autoplay=1&mute=${
                        isMuted ? 1 : 0
                      }&loop=1&playlist=${currentYouTubeId}&rel=0&modestbranding=1&playsinline=1`}
                      title={currentSlide.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full border-0"
                    />
                  ) : currentPlayableVideoUrl ? (
                    <video
                      key={`vid-split-${currentSlide.id}-${currentPlayableVideoUrl}`}
                      src={currentPlayableVideoUrl}
                      autoPlay
                      loop
                      playsInline
                      muted={isMuted}
                      controls
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                      កំពុងផ្ទុកវីដេអូ...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Bar: Indicators & Left/Right Arrows */}
          <div className="relative z-10 px-5 sm:px-6 pb-4 pt-0 flex items-center justify-between">
            {/* Carousel Dot Indicators */}
            <div className="flex items-center gap-1.5">
              {activeSlides.map((slide, idx) => {
                const isVid = Boolean(
                  slide.videoUrl && (slide.mediaType === 'video' || !slide.mediaType)
                );
                return (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      currentIdx === idx
                        ? 'w-7 bg-amber-400 shadow-xs'
                        : isVid
                        ? 'w-2.5 bg-rose-400/70 hover:bg-rose-300'
                        : 'w-2 bg-white/30 hover:bg-white/60'
                    }`}
                    title={`ស្លាយ ${idx + 1}${isVid ? ' (វីដេអូ)' : ''}`}
                  />
                );
              })}
            </div>

            {/* Left and Right Arrows */}
            {activeSlides.length > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/25 text-white border border-white/20 transition-all cursor-pointer backdrop-blur-xs"
                  title="ស្លាយមុន"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/25 text-white border border-white/20 transition-all cursor-pointer backdrop-blur-xs"
                  title="ស្លាយបន្ទាប់"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================
          FULLSCREEN VIDEO LIGHTBOX MODAL
         ======================================================== */}
      {fullscreenVideoSlide && (
        <div
          className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in"
          onClick={() => setFullscreenVideoSlide(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-slate-900 rounded-3xl overflow-hidden border border-amber-400/40 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-gradient-to-r from-blue-950 to-indigo-950 border-b border-white/10 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-moul text-sm text-white">{fullscreenVideoSlide.title}</h3>
                  <p className="text-xs text-blue-200">{fullscreenVideoSlide.subtitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFullscreenVideoSlide(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video bg-black">
              {extractYouTubeId(fullscreenVideoSlide.videoUrl) ? (
                <iframe
                  src={`https://www.youtube.com/embed/${extractYouTubeId(
                    fullscreenVideoSlide.videoUrl
                  )}?autoplay=1&rel=0`}
                  title={fullscreenVideoSlide.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              ) : (
                <video
                  src={getPlayableVideoUrl(fullscreenVideoSlide.videoUrl)}
                  autoPlay
                  controls
                  playsInline
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          BANNER CUSTOMIZATION MODAL (កែប្រែផ្ទាំង Banner និងដាក់វីដេអូ)
         ======================================================== */}
      {isEditorOpen && (
        <div className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-3 sm:p-5 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden font-khmer">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-400 text-slate-950 font-bold">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-moul text-sm sm:text-base font-bold text-white">
                    គ្រប់គ្រងផ្ទាំង Banner វិល (រូបភាព & វីដេអូ)
                  </h3>
                  <p className="text-xs text-blue-200 mt-0.5">
                    អាចដាក់វីដេអូ (MP4, WebM, YouTube ឬបង្ហោះពីឧបករណ៍) រូបភាព អក្សរ និងពណ៌នៃ Banner ដោយខ្លួនឯង
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left Column: Slide List */}
              <div className="md:col-span-5 space-y-3 border-r border-slate-100 pr-0 md:pr-4">
                <div className="flex items-center justify-between gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-slate-700">
                    បញ្ជីស្លាយ Banner ({editList.length})
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAddNewSlide(true)}
                      className="px-2.5 py-1 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>ថែមវីដេអូ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddNewSlide(false)}
                      className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>ថែមស្លាយ</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {editList.map((slide, idx) => {
                    const isSelected = editingSlide?.id === slide.id;
                    const isVid = Boolean(
                      slide.videoUrl && (slide.mediaType === 'video' || !slide.mediaType)
                    );
                    return (
                      <div
                        key={slide.id}
                        onClick={() => setEditingSlide({ ...slide })}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'border-blue-900 bg-blue-50/70 shadow-xs'
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-200">
                              #{idx + 1}
                            </span>
                            {isVid ? (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 border border-rose-200 inline-flex items-center gap-0.5">
                                <Film className="w-2.5 h-2.5" />
                                <span>វីដេអូ</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                                រូបភាព
                              </span>
                            )}
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {slide.title}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">
                            {slide.subtitle}
                          </p>
                        </div>

                        {/* Reorder & Action buttons */}
                        <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveSlide(idx, 'up')}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                            title="ឡើងលើ"
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === editList.length - 1}
                            onClick={() => handleMoveSlide(idx, 'down')}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                            title="ចុះក្រោម"
                          >
                            <MoveDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSlide(slide.id)}
                            className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                            title="លុបស្លាយ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Slide Interval Speed Setting */}
                <div className="pt-3 border-t border-slate-100">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    ល្បឿនវិលស្វ័យប្រវត្តិ (Rotation Speed)
                  </label>
                  <select
                    value={slideInterval}
                    onChange={(e) => setSlideInterval(Number(e.target.value))}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value={3000}>៣ វិនាទី (លឿន)</option>
                    <option value={6000}>៦ វិនាទី (ស្ដង់ដារ - ណែនាំ)</option>
                    <option value={10000}>១០ វិនាទី (ល្មម)</option>
                    <option value={15000}>១៥ វិនាទី (សម្រាប់មើលវីដេអូ)</option>
                  </select>
                </div>
              </div>

              {/* Right Column: Slide Editor Form */}
              <div className="md:col-span-7 space-y-4">
                {editingSlide ? (
                  <>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-blue-900" />
                        <span>កែប្រែព័ត៌មានស្លាយដែលបានជ្រើស</span>
                      </span>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                        <input
                          type="checkbox"
                          checked={editingSlide.isActive}
                          onChange={(e) => {
                            const updated = { ...editingSlide, isActive: e.target.checked };
                            setEditingSlide(updated);
                            setEditList(editList.map((s) => (s.id === updated.id ? updated : s)));
                          }}
                          className="rounded text-blue-900"
                        />
                        <span>បើកដំណើរការ (Active)</span>
                      </label>
                    </div>

                    {/* Media Type Selector: Image vs Video */}
                    <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200/80 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                          <Film className="w-4 h-4 text-blue-800" />
                          <span>ជ្រើសរើសប្រភេទមេឌៀលើ Banner (Media Type)</span>
                        </span>
                        <div className="inline-flex rounded-xl bg-white p-1 border border-slate-200 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => {
                              const updated: BannerSlide = {
                                ...editingSlide,
                                mediaType: 'image',
                              };
                              setEditingSlide(updated);
                              setEditList(editList.map((s) => (s.id === updated.id ? updated : s)));
                            }}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition-all ${
                              editingSlide.mediaType !== 'video' && !editingSlide.videoUrl
                                ? 'bg-blue-900 text-white shadow-xs'
                                : editingSlide.mediaType === 'image'
                                ? 'bg-blue-900 text-white shadow-xs'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>រូបភាព (Image)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const updated: BannerSlide = {
                                ...editingSlide,
                                mediaType: 'video',
                                videoUrl:
                                  editingSlide.videoUrl || SAMPLE_VIDEO_PRESETS[0].url,
                                videoLayout: editingSlide.videoLayout || 'split',
                                videoOpacity: editingSlide.videoOpacity ?? 55,
                              };
                              setEditingSlide(updated);
                              setEditList(editList.map((s) => (s.id === updated.id ? updated : s)));
                            }}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition-all ${
                              editingSlide.mediaType === 'video' ||
                              (editingSlide.videoUrl && editingSlide.mediaType !== 'image')
                                ? 'bg-amber-500 text-slate-950 shadow-xs'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>វីដេអូ (Video)</span>
                          </button>
                        </div>
                      </div>

                      {/* VIDEO SETTINGS PANEL */}
                      {(editingSlide.mediaType === 'video' ||
                        (editingSlide.videoUrl && editingSlide.mediaType !== 'image')) && (
                        <div className="space-y-3 pt-2 border-t border-blue-200/60">
                          {/* Video URL Input + Upload File Button */}
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                            <div className="sm:col-span-8">
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                តំណភ្ជាប់វីដេអូ (MP4 / WebM / YouTube Link) *
                              </label>
                              <input
                                type="text"
                                value={
                                  editingSlide.videoUrl?.startsWith('idb://')
                                    ? 'វីដេអូបានបង្ហោះពីឧបករណ៍ (Uploaded Local Video)'
                                    : editingSlide.videoUrl || ''
                                }
                                onChange={(e) => {
                                  const updated: BannerSlide = {
                                    ...editingSlide,
                                    mediaType: 'video',
                                    videoUrl: e.target.value,
                                  };
                                  setEditingSlide(updated);
                                  setEditList(
                                    editList.map((s) => (s.id === updated.id ? updated : s))
                                  );
                                }}
                                placeholder="https://.../video.mp4 ឬ https://www.youtube.com/watch?v=..."
                                className="w-full text-xs p-2 bg-white border border-slate-300 rounded-xl font-mono text-[11px]"
                              />
                            </div>

                            <div className="sm:col-span-4">
                              <input
                                ref={videoFileInputRef}
                                type="file"
                                accept="video/mp4,video/webm,video/ogg,video/quicktime,video/*"
                                onChange={handleVideoFileUpload}
                                className="hidden"
                              />
                              <button
                                type="button"
                                disabled={isUploadingVideo}
                                onClick={() => videoFileInputRef.current?.click()}
                                className="w-full py-2 px-3 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                              >
                                <Upload className="w-3.5 h-3.5 text-amber-300" />
                                <span>
                                  {isUploadingVideo ? 'កំពុងបង្ហោះ...' : 'បង្ហោះវីដេអូពីឧបករណ៍'}
                                </span>
                              </button>
                            </div>
                          </div>

                          {/* Sample Videos Preset Selector */}
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              ឬជ្រើសរើសវីដេអូគំរូសាលារៀន (ចុចជ្រើសរើសភ្លាមៗ)៖
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                              {SAMPLE_VIDEO_PRESETS.map((sample, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => {
                                    const updated: BannerSlide = {
                                      ...editingSlide,
                                      mediaType: 'video',
                                      videoUrl: sample.url,
                                    };
                                    setEditingSlide(updated);
                                    setEditList(
                                      editList.map((s) => (s.id === updated.id ? updated : s))
                                    );
                                  }}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                                    editingSlide.videoUrl === sample.url
                                      ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-2xs'
                                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  🎬 {sample.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Video Layout Mode & Opacity / Sound Settings */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                                <Layout className="w-3.5 h-3.5 text-blue-900" />
                                <span>ទម្រង់បង្ហាញវីដេអូ (Video Layout)</span>
                              </label>
                              <select
                                value={editingSlide.videoLayout || 'split'}
                                onChange={(e) => {
                                  const updated: BannerSlide = {
                                    ...editingSlide,
                                    videoLayout: e.target.value as 'background' | 'split',
                                  };
                                  setEditingSlide(updated);
                                  setEditList(
                                    editList.map((s) => (s.id === updated.id ? updated : s))
                                  );
                                }}
                                className="w-full text-xs p-2 bg-white border border-slate-300 rounded-xl"
                              >
                                <option value="split">
                                  ប្រអប់វីដេអូនៅផ្នែកខាងស្ដាំ (Split Video Player)
                                </option>
                                <option value="background">
                                  វីដេអូផ្ទៃខាងក្រោយពេញ Banner (Full Background Video)
                                </option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                កម្រិតភាពច្បាស់ផ្ទៃក្រោយ ({editingSlide.videoOpacity ?? 55}%)
                              </label>
                              <input
                                type="range"
                                min={20}
                                max={100}
                                step={5}
                                value={editingSlide.videoOpacity ?? 55}
                                onChange={(e) => {
                                  const updated: BannerSlide = {
                                    ...editingSlide,
                                    videoOpacity: Number(e.target.value),
                                  };
                                  setEditingSlide(updated);
                                  setEditList(
                                    editList.map((s) => (s.id === updated.id ? updated : s))
                                  );
                                }}
                                className="w-full accent-blue-900 cursor-pointer"
                              />
                            </div>
                          </div>

                          {/* Live Video Preview inside Modal */}
                          {editingSlide.videoUrl && (
                            <div className="rounded-2xl overflow-hidden border border-slate-300 bg-slate-950 aspect-video max-h-44 mx-auto relative">
                              {extractYouTubeId(editingSlide.videoUrl) ? (
                                <iframe
                                  src={`https://www.youtube.com/embed/${extractYouTubeId(
                                    editingSlide.videoUrl
                                  )}?autoplay=0&rel=0`}
                                  title="Video Preview"
                                  className="w-full h-full border-0"
                                  allowFullScreen
                                />
                              ) : getPlayableVideoUrl(editingSlide.videoUrl) ? (
                                <video
                                  key={getPlayableVideoUrl(editingSlide.videoUrl)}
                                  src={getPlayableVideoUrl(editingSlide.videoUrl)}
                                  controls
                                  muted
                                  playsInline
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                                  សូមបញ្ចូលតំណភ្ជាប់វីដេអូត្រឹមត្រូវ...
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          ស្លាកសញ្ញា (Badge) *
                        </label>
                        <input
                          type="text"
                          value={editingSlide.badge}
                          onChange={(e) => {
                            const updated = { ...editingSlide, badge: e.target.value };
                            setEditingSlide(updated);
                            setEditList(editList.map((s) => (s.id === updated.id ? updated : s)));
                          }}
                          placeholder="ឧ. អនុវិទ្យាល័យទួលសំបួរ"
                          className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          ទីតាំង / អត្ថបទរង (Location)
                        </label>
                        <input
                          type="text"
                          value={editingSlide.location || ''}
                          onChange={(e) => {
                            const updated = { ...editingSlide, location: e.target.value };
                            setEditingSlide(updated);
                            setEditList(editList.map((s) => (s.id === updated.id ? updated : s)));
                          }}
                          placeholder="ឃុំទួលសំបួរ ស្រុកស្ទឹងត្រង់"
                          className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        ចំណងជើងធំ (Banner Title) *
                      </label>
                      <input
                        type="text"
                        value={editingSlide.title}
                        onChange={(e) => {
                          const updated = { ...editingSlide, title: e.target.value };
                          setEditingSlide(updated);
                          setEditList(editList.map((s) => (s.id === updated.id ? updated : s)));
                        }}
                        placeholder="ឧ. ផ្ទាំងគ្រប់គ្រងទូទៅរបស់សាលារៀន"
                        className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        ការពណ៌នាលម្អិត (Subtitle / Description) *
                      </label>
                      <textarea
                        rows={2}
                        value={editingSlide.subtitle}
                        onChange={(e) => {
                          const updated = { ...editingSlide, subtitle: e.target.value };
                          setEditingSlide(updated);
                          setEditList(editList.map((s) => (s.id === updated.id ? updated : s)));
                        }}
                        placeholder="ព័ត៌មានលម្អិតអំពីស្លាយ..."
                        className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900"
                      />
                    </div>

                    {/* Image URL & Gradient Theme */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                          <ImageIcon className="w-3.5 h-3.5 text-blue-900" />
                          <span>តំណភ្ជាប់រូបភាពផ្ទៃក្រោយ (Image URL)</span>
                        </label>
                        <input
                          type="text"
                          value={editingSlide.imageUrl || ''}
                          onChange={(e) => {
                            const updated = { ...editingSlide, imageUrl: e.target.value };
                            setEditingSlide(updated);
                            setEditList(editList.map((s) => (s.id === updated.id ? updated : s)));
                          }}
                          placeholder="https://images.unsplash.com/..."
                          className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          ពណ៌ផ្ទៃ Gradient Theme
                        </label>
                        <select
                          value={editingSlide.gradient}
                          onChange={(e) => {
                            const updated = { ...editingSlide, gradient: e.target.value };
                            setEditingSlide(updated);
                            setEditList(editList.map((s) => (s.id === updated.id ? updated : s)));
                          }}
                          className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl"
                        >
                          {GRADIENT_PRESETS.map((p) => (
                            <option key={p.value} value={p.value}>
                              {p.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Buttons Customization */}
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <div className="text-xs font-bold text-slate-800">
                        ប៊ូតុងសកម្មភាពលើ Banner (Action Buttons)
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            ប៊ូតុងទី ១ (អត្ថបទ)
                          </label>
                          <input
                            type="text"
                            value={editingSlide.primaryButtonText || ''}
                            onChange={(e) => {
                              const updated = { ...editingSlide, primaryButtonText: e.target.value };
                              setEditingSlide(updated);
                              setEditList(editList.map((s) => (s.id === updated.id ? updated : s)));
                            }}
                            placeholder="កត់ត្រាវត្តមាន"
                            className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            ប៊ូតុងទី ១ (ទំព័រគោលដៅ)
                          </label>
                          <select
                            value={editingSlide.primaryButtonAction || 'attendance'}
                            onChange={(e) => {
                              const updated = { ...editingSlide, primaryButtonAction: e.target.value };
                              setEditingSlide(updated);
                              setEditList(editList.map((s) => (s.id === updated.id ? updated : s)));
                            }}
                            className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded-lg"
                          >
                            <option value="attendance">កត់ត្រាវត្តមាន (Attendance)</option>
                            <option value="attendance_reports">របាយការណ៍វត្តមាន (Reports)</option>
                            <option value="exams">ពិន្ទុ & ប្រឡង (Exams)</option>
                            <option value="timetable">កាលវិភាគសិក្សា (Timetable)</option>
                            <option value="students">បញ្ជីសិស្ស (Students)</option>
                            <option value="teachers">គ្រូបង្រៀន (Teachers)</option>
                            <option value="telegram">Telegram Bot (Alerts)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            ប៊ូតុងទី ២ (អត្ថបទ)
                          </label>
                          <input
                            type="text"
                            value={editingSlide.secondaryButtonText || ''}
                            onChange={(e) => {
                              const updated = { ...editingSlide, secondaryButtonText: e.target.value };
                              setEditingSlide(updated);
                              setEditList(editList.map((s) => (s.id === updated.id ? updated : s)));
                            }}
                            placeholder="របាយការណ៍"
                            className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            ប៊ូតុងទី ២ (ទំព័រគោលដៅ)
                          </label>
                          <select
                            value={editingSlide.secondaryButtonAction || 'attendance_reports'}
                            onChange={(e) => {
                              const updated = { ...editingSlide, secondaryButtonAction: e.target.value };
                              setEditingSlide(updated);
                              setEditList(editList.map((s) => (s.id === updated.id ? updated : s)));
                            }}
                            className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded-lg"
                          >
                            <option value="attendance_reports">របាយការណ៍វត្តមាន (Reports)</option>
                            <option value="attendance">កត់ត្រាវត្តមាន (Attendance)</option>
                            <option value="exams">ពិន្ទុ & ប្រឡង (Exams)</option>
                            <option value="timetable">កាលវិភាគសិក្សា (Timetable)</option>
                            <option value="students">បញ្ជីសិស្ស (Students)</option>
                            <option value="teachers">គ្រូបង្រៀន (Teachers)</option>
                            <option value="telegram">Telegram Bot (Alerts)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
                    <SlidersHorizontal className="w-8 h-8 text-slate-300 mb-2" />
                    <span>សូមជ្រើសរើសស្លាយខាងឆ្វេងដើម្បីកែប្រែ</span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-3 py-2 text-xs font-medium text-slate-500 hover:text-rose-600 flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>កំណត់ទម្រង់ដើម</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditor}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>រក្សាទុក Banner</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

