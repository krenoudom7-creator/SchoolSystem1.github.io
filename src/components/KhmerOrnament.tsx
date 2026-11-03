import React from 'react';

/**
 * ក្បាច់ជ្រុងខ្មែរ (Traditional Khmer Corner Kbach Flourish)
 * Places an authentic Cambodian golden corner ornament inside relative containers.
 */
export const KhmerCornerOrnament: React.FC<{
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
  size?: number;
  variant?: 'gold' | 'royal' | 'subtle';
}> = ({ position, className = '', size = 44, variant = 'gold' }) => {
  const posClasses = {
    'top-left': 'top-1.5 left-1.5 rotate-0',
    'top-right': 'top-1.5 right-1.5 rotate-90',
    'bottom-right': 'bottom-1.5 right-1.5 rotate-180',
    'bottom-left': 'bottom-1.5 left-1.5 -rotate-90',
  }[position];

  const colorStroke =
    variant === 'gold'
      ? '#f59e0b'
      : variant === 'royal'
      ? '#1e3a8a'
      : '#d97706';

  const colorFill =
    variant === 'gold'
      ? '#fbbf24'
      : variant === 'royal'
      ? '#b45309'
      : '#f59e0b';

  return (
    <div
      className={`pointer-events-none select-none absolute z-10 ${posClasses} ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full opacity-85"
      >
        {/* Outer L-frame with Kbach lotus tip */}
        <path
          d="M4 56V14C4 8.477 8.477 4 14 4H56"
          stroke={colorStroke}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M9 48V16C9 12.134 12.134 9 16 9H48"
          stroke={colorStroke}
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeDasharray="2 2"
        />
        {/* Corner Lotus / Phnhey Tes Motif (ក្បាច់ភ្ញីទេសជ្រុង) */}
        <path
          d="M6 6C14 6 20 12 22 22C12 20 6 14 6 6Z"
          fill={colorFill}
          fillOpacity="0.28"
          stroke={colorStroke}
          strokeWidth="1.6"
        />
        <path
          d="M14 14C21 14 27 18 30 26C22 25 16 20 14 14Z"
          fill={colorFill}
          fillOpacity="0.2"
          stroke={colorStroke}
          strokeWidth="1.3"
        />
        {/* Flame curls along top & left arms */}
        <path
          d="M24 4C27 8 32 10 38 9C34 6 29 4 24 4Z"
          fill={colorFill}
          fillOpacity="0.35"
        />
        <path
          d="M4 24C8 27 10 32 9 38C6 34 4 29 4 24Z"
          fill={colorFill}
          fillOpacity="0.35"
        />
        {/* Diamond jewel at corner apex */}
        <polygon
          points="8,4 12,8 8,12 4,8"
          fill={colorFill}
          stroke={colorStroke}
          strokeWidth="1"
        />
        <circle cx="19" cy="19" r="2" fill={colorFill} />
        <circle cx="44" cy="4" r="1.8" fill={colorFill} />
        <circle cx="4" cy="44" r="1.8" fill={colorFill} />
      </svg>
    </div>
  );
};

/**
 * ក្បាច់ជ្រុងទាំង ៤ (All 4 Khmer Corners Wrapper)
 */
export const KhmerFourCorners: React.FC<{
  size?: number;
  variant?: 'gold' | 'royal' | 'subtle';
  className?: string;
}> = ({ size = 40, variant = 'gold', className = '' }) => (
  <>
    <KhmerCornerOrnament position="top-left" size={size} variant={variant} className={className} />
    <KhmerCornerOrnament position="top-right" size={size} variant={variant} className={className} />
    <KhmerCornerOrnament position="bottom-left" size={size} variant={variant} className={className} />
    <KhmerCornerOrnament position="bottom-right" size={size} variant={variant} className={className} />
  </>
);

/**
 * ក្បាច់ខណ្ឌចែកខ្មែរ (Traditional Khmer Ornamental Divider - ក្បាច់ត្របកឈូក និងពេជ្រ)
 */
export const KhmerDivider: React.FC<{
  className?: string;
  variant?: 'gold' | 'dark' | 'light';
  width?: string;
}> = ({ className = '', variant = 'gold', width = 'w-48 sm:w-64' }) => {
  const strokeColor =
    variant === 'gold'
      ? '#d97706'
      : variant === 'light'
      ? '#fbbf24'
      : '#1e3a8a';
  const fillColor =
    variant === 'gold'
      ? '#f59e0b'
      : variant === 'light'
      ? '#fde68a'
      : '#d97706';

  return (
    <div className={`flex items-center justify-center select-none pointer-events-none ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 260 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${width} h-5`}
      >
        {/* Left tapering line */}
        <path
          d="M4 12H96"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M24 9H92"
          stroke={strokeColor}
          strokeWidth="0.75"
          strokeOpacity="0.6"
        />
        {/* Right tapering line */}
        <path
          d="M164 12H256"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M168 9H236"
          stroke={strokeColor}
          strokeWidth="0.75"
          strokeOpacity="0.6"
        />
        {/* Left lotus curl */}
        <path
          d="M96 12C102 6 108 6 114 12C108 18 102 18 96 12Z"
          fill={fillColor}
          fillOpacity="0.3"
          stroke={strokeColor}
          strokeWidth="1.3"
        />
        {/* Right lotus curl */}
        <path
          d="M146 12C152 6 158 6 164 12C158 18 152 18 146 12Z"
          fill={fillColor}
          fillOpacity="0.3"
          stroke={strokeColor}
          strokeWidth="1.3"
        />
        {/* Center Angkor Lotus / Diamond (ក្បាច់ផ្កាឈូកកណ្តាល) */}
        <polygon
          points="130,2 139,12 130,22 121,12"
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth="1.5"
        />
        <polygon
          points="130,6 135,12 130,18 125,12"
          fill="#ffffff"
          fillOpacity="0.7"
        />
        {/* Side mini diamonds */}
        <polygon points="116,8 120,12 116,16 112,12" fill={fillColor} />
        <polygon points="144,8 148,12 144,16 140,12" fill={fillColor} />
        <circle cx="88" cy="12" r="2" fill={fillColor} />
        <circle cx="172" cy="12" r="2" fill={fillColor} />
      </svg>
    </div>
  );
};

/**
 * ខ្សែបន្ទាត់ក្បាច់ខ្មែរ (Horizontal Repeating Khmer Kbach Border Strip)
 */
export const KhmerBorderStrip: React.FC<{
  className?: string;
  position?: 'top' | 'bottom';
}> = ({ className = '', position = 'bottom' }) => {
  return (
    <div
      className={`w-full h-2 overflow-hidden select-none pointer-events-none ${
        position === 'top' ? 'border-b border-amber-400/40' : 'border-t border-amber-400/40'
      } bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 relative ${className}`}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 opacity-45"
        style={{
          backgroundImage: `radial-gradient(circle at 6px 4px, #78350f 1.5px, transparent 2px), radial-gradient(circle at 18px 4px, #ffffff 1.2px, transparent 2px)`,
          backgroundSize: '24px 8px',
        }}
      />
    </div>
  );
};
