import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, X, Check, Sparkles } from 'lucide-react';
import { safeAvatar } from '../utils/avatar.ts';

interface ImageUploaderProps {
  currentImage: string;
  onImageChange: (dataUrlOrUrl: string) => void;
  label?: string;
  type?: 'student' | 'teacher' | 'user';
}

const PRESET_STUDENT_AVATARS = [
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
];

const PRESET_TEACHER_AVATARS = [
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
];

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  currentImage,
  onImageChange,
  label = 'រូបថតផ្ទាល់ខ្លួន',
  type = 'student',
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [isUrlMode, setIsUrlMode] = useState(false);
  const [urlInput, setUrlInput] = useState(currentImage || '');

  const presets = type === 'teacher' ? PRESET_TEACHER_AVATARS : PRESET_STUDENT_AVATARS;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('ទំហំរូបភាពធំពេក! សូមជ្រើសរើសរូបភាពក្រោម 10MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          // Compress avatar to max 400x400 to keep Firestore payload lightweight and fast
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxDimension = 400;
            let width = img.width;
            let height = img.height;
            if (width > height) {
              if (width > maxDimension) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
              }
            } else {
              if (height > maxDimension) {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
              onImageChange(compressedDataUrl);
            } else {
              onImageChange(result);
            }
          };
          img.onerror = () => {
            onImageChange(result);
          };
          img.src = result;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      onImageChange(urlInput.trim());
      setIsUrlMode(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-slate-700">{label}</label>

      <div className="flex items-center gap-3">
        {/* Preview circle */}
        <div className="relative group">
          <img
            src={safeAvatar(currentImage || presets[0])}
            alt="Preview"
            className="w-16 h-16 rounded-full object-cover border-2 border-blue-900/30 shadow-xs"
          />
          {currentImage && (
            <button
              type="button"
              onClick={() => onImageChange('')}
              title="លុបរូបភាព"
              className="absolute -top-1 -right-1 p-0.5 bg-rose-600 text-white rounded-full hover:bg-rose-700 cursor-pointer shadow-xs"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Direct File Upload button */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 text-xs font-medium bg-blue-900 text-white hover:bg-blue-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>ជ្រើសរើសរូបពីម៉ាស៊ីន (Upload)</span>
            </button>

            {/* Presets button */}
            <button
              type="button"
              onClick={() => setShowPresets(!showPresets)}
              className="px-2.5 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>រូបគំរូ</span>
            </button>

            {/* URL toggle */}
            <button
              type="button"
              onClick={() => setIsUrlMode(!isUrlMode)}
              className="text-[11px] text-blue-800 hover:underline cursor-pointer"
            >
              {isUrlMode ? 'បិទ URL' : 'ប្រើតំណភ្ជាប់ (URL)'}
            </button>
          </div>

          <p className="text-[10px] text-slate-400">
            គាំទ្ររូបភាព JPG, PNG, WebP (អាចផ្ទុកពីរូបថតទូរស័ព្ទ ឬកាមេរ៉ា)
          </p>
        </div>
      </div>

      {/* Preset selection grid */}
      {showPresets && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 animate-in fade-in">
          <div className="text-[11px] font-semibold text-slate-600">
            ជ្រើសរើសរូបតំណាងគំរូ (Avatar Presets)៖
          </div>
          <div className="grid grid-cols-6 gap-2">
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onImageChange(p);
                  setShowPresets(false);
                }}
                className={`relative rounded-full overflow-hidden border-2 transition-all p-0.5 cursor-pointer hover:scale-105 ${
                  currentImage === p ? 'border-amber-500 ring-2 ring-amber-300' : 'border-slate-200'
                }`}
              >
                <img src={p} alt={`Preset ${idx}`} className="w-9 h-9 rounded-full object-cover" />
                {currentImage === p && (
                  <div className="absolute inset-0 bg-amber-500/30 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Direct URL input */}
      {isUrlMode && (
        <div className="flex items-center gap-2 pt-1 animate-in fade-in">
          <input
            type="url"
            placeholder="បិទភ្ជាប់ (Paste) តំណភ្ជាប់រូបភាព HTTPS..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="flex-1 text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-900"
          />
          <button
            type="button"
            onClick={handleApplyUrl}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-800 text-white rounded-lg hover:bg-slate-900 cursor-pointer"
          >
            យល់ព្រម
          </button>
        </div>
      )}
    </div>
  );
};
