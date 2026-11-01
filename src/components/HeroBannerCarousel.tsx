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
  GraduationCap,
  Calendar,
  Users,
  Send,
  School,
  Image as ImageIcon,
  RotateCcw,
} from 'lucide-react';
import { BannerSlide } from '../types/index.ts';
import { storage } from '../services/storage.ts';

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

export const HeroBannerCarousel: React.FC<HeroBannerCarouselProps> = ({
  banners,
  onNavigate,
  isAdmin,
  onBannersChange,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [slideInterval, setSlideInterval] = useState(5000); // 5s default
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Editable banners state for the manager modal
  const [editList, setEditList] = useState<BannerSlide[]>([]);
  const [editingSlide, setEditingSlide] = useState<BannerSlide | null>(null);

  const activeSlides = banners.filter((b) => b.isActive).sort((a, b) => a.order - b.order);
  const totalSlides = activeSlides.length > 0 ? activeSlides.length : 1;

  // Auto-play timer
  useEffect(() => {
    if (!isAutoPlay || isHovered || activeSlides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % activeSlides.length);
    }, slideInterval);

    return () => clearInterval(timer);
  }, [isAutoPlay, isHovered, activeSlides.length, slideInterval]);

  // Keep index within bounds if slide count changes
  useEffect(() => {
    if (currentIdx >= activeSlides.length && activeSlides.length > 0) {
      setCurrentIdx(0);
    }
  }, [activeSlides.length, currentIdx]);

  const handleNext = () => {
    if (activeSlides.length <= 1) return;
    setCurrentIdx((prev) => (prev + 1) % activeSlides.length);
  };

  const handlePrev = () => {
    if (activeSlides.length <= 1) return;
    setCurrentIdx((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
  };

  const openEditor = () => {
    const all = storage.getAllBanners();
    setEditList([...all]);
    setEditingSlide(all[0] ? { ...all[0] } : null);
    setIsEditorOpen(true);
  };

  const handleSaveEditor = () => {
    storage.saveBanners(editList);
    setIsEditorOpen(false);
    if (onBannersChange) onBannersChange();
  };

  const handleAddNewSlide = () => {
    const newSlide: BannerSlide = {
      id: `banner-${Date.now()}`,
      badge: 'សេចក្ដីជូនដំណឹងថ្មី',
      location: 'អនុវិទ្យាល័យ ហ៊ុន សែន ទួលសំបួរ',
      title: 'ចំណងជើងផ្ទាំង Banner ថ្មី',
      subtitle: 'បញ្ចូលការពណ៌នាលម្អិតអំពីកម្មវិធី ឬព័ត៌មានសិក្សា...',
      imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200&auto=format&fit=crop&q=80',
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
    // update orders
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

  return (
    <div className="relative">
      {/* Dynamic Animated RGB Flow Border Wrapper */}
      <div className="rgb-glow-border">
        {/* Banner Inner Card */}
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`relative rounded-3xl overflow-hidden text-white bg-gradient-to-r ${currentSlide.gradient} shadow-2xl transition-all duration-700 min-h-[220px] sm:min-h-[240px] flex flex-col justify-between`}
        >
          {/* Background School Photography / Texture with Gradient Overlay */}
          {currentSlide.imageUrl && (
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
              <img
                src={currentSlide.imageUrl}
                alt="Banner Background"
                className="w-full h-full object-cover opacity-20 scale-105 transition-all duration-1000 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80"></div>
              <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-radial from-amber-400/10 via-transparent to-transparent"></div>
            </div>
          )}

          {/* Ambient Lighting Gradients */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* Top Bar inside Banner: Slide Badge, Controls & Quick Edit */}
          <div className="relative z-10 p-5 sm:p-6 pb-0 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full shadow-xs backdrop-blur-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{currentSlide.badge}</span>
              </span>
              {currentSlide.location && (
                <span className="text-xs text-blue-200/90 font-medium hidden sm:inline">
                  · {currentSlide.location}
                </span>
              )}
            </div>

            {/* Banner Control Widgets */}
            <div className="flex items-center gap-2">
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

              {/* Admin Customize Banner Button */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={openEditor}
                  className="px-3 py-1 text-xs font-semibold bg-white/15 hover:bg-white/25 text-white rounded-full border border-white/20 transition-all flex items-center gap-1.5 backdrop-blur-xs cursor-pointer shadow-xs"
                  title="កែសម្រួលផ្ទាំង Banner វិលដោយខ្លួនឯង"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-300" />
                  <span className="hidden sm:inline">កែប្រែ Banner</span>
                </button>
              )}
            </div>
          </div>

          {/* Main Slide Content */}
          <div className="relative z-10 p-5 sm:p-6 my-auto">
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
            </div>
          </div>

          {/* Bottom Bar: Indicators & Left/Right Arrows */}
          <div className="relative z-10 px-5 sm:px-6 pb-4 pt-0 flex items-center justify-between">
            {/* Carousel Dot Indicators */}
            <div className="flex items-center gap-1.5">
              {activeSlides.map((slide, idx) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setCurrentIdx(idx)}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    currentIdx === idx
                      ? 'w-7 bg-amber-400 shadow-xs'
                      : 'w-2 bg-white/30 hover:bg-white/60'
                  }`}
                  title={`ស្លាយ ${idx + 1}`}
                />
              ))}
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
          BANNER CUSTOMIZATION MODAL (កែប្រែផ្ទាំង Banner ដោយខ្លួនឯង)
         ======================================================== */}
      {isEditorOpen && (
        <div className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-3 sm:p-5 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden font-khmer">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-400 text-slate-950 font-bold">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-moul text-sm sm:text-base font-bold text-white">
                    គ្រប់គ្រង និងកែប្រែផ្ទាំង Banner វិល
                  </h3>
                  <p className="text-xs text-blue-200 mt-0.5">
                    កំណត់ស្លាយថ្មី កែប្រែរូបភាព អក្សរ ពណ៌ និងល្បឿនវិលនៃ Banner ដោយខ្លួនឯង
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
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    បញ្ជីស្លាយ Banner ({editList.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddNewSlide}
                    className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>ថែមស្លាយថ្មី</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {editList.map((slide, idx) => {
                    const isSelected = editingSlide?.id === slide.id;
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
                    <option value={5000}>៥ វិនាទី (ស្ដង់ដារ - ណែនាំ)</option>
                    <option value={7000}>៧ វិនាទី (ល្មម)</option>
                    <option value={10000}>១០ វិនាទី (យឺត)</option>
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
