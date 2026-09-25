import React from 'react';

interface LimbandoLogoProps {
  className?: string;
  size?: number;
}

export const LimbandoLogo: React.FC<LimbandoLogoProps> = ({ className = '', size = 80 }) => {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-sm select-none"
      >
        <defs>
          <linearGradient id="shieldBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0B3C2B" />
            <stop offset="100%" stopColor="#06261A" />
          </linearGradient>

          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="50%" stopColor="#EAB308" />
            <stop offset="100%" stopColor="#CA8A04" />
          </linearGradient>

          <linearGradient id="goldDark" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#EAB308" />
            <stop offset="100%" stopColor="#A16207" />
          </linearGradient>
        </defs>

        {/* Outer Laurel Wreath - Left Branch */}
        <g stroke="url(#goldGradient)" strokeWidth="1.8" fill="#15803D" strokeLinecap="round">
          {/* Stem left */}
          <path d="M 60 102 C 38 100 24 82 24 58 C 24 44 32 30 40 22" fill="none" stroke="url(#goldDark)" strokeWidth="2" />
          {/* Leaves left */}
          <path d="M 28 88 C 20 84 18 76 24 73 C 28 72 32 78 28 88 Z" fill="#166534" stroke="url(#goldGradient)" strokeWidth="1" />
          <path d="M 23 75 C 16 70 14 62 20 59 C 24 58 27 64 23 75 Z" fill="#15803D" stroke="url(#goldGradient)" strokeWidth="1" />
          <path d="M 21 61 C 15 54 16 46 22 43 C 26 42 28 50 21 61 Z" fill="#166534" stroke="url(#goldGradient)" strokeWidth="1" />
          <path d="M 24 47 C 18 40 21 32 27 30 C 31 30 32 37 24 47 Z" fill="#15803D" stroke="url(#goldGradient)" strokeWidth="1" />
          <path d="M 31 35 C 26 28 30 21 36 20 C 40 20 40 27 31 35 Z" fill="#166534" stroke="url(#goldGradient)" strokeWidth="1" />
          <path d="M 40 25 C 37 19 44 14 49 16 C 52 17 50 24 40 25 Z" fill="#15803D" stroke="url(#goldGradient)" strokeWidth="1" />
        </g>

        {/* Outer Laurel Wreath - Right Branch */}
        <g stroke="url(#goldGradient)" strokeWidth="1.8" fill="#15803D" strokeLinecap="round">
          {/* Stem right */}
          <path d="M 60 102 C 82 100 96 82 96 58 C 96 44 88 30 80 22" fill="none" stroke="url(#goldDark)" strokeWidth="2" />
          {/* Leaves right */}
          <path d="M 92 88 C 100 84 102 76 96 73 C 92 72 88 78 92 88 Z" fill="#166534" stroke="url(#goldGradient)" strokeWidth="1" />
          <path d="M 97 75 C 104 70 106 62 100 59 C 96 58 93 64 97 75 Z" fill="#15803D" stroke="url(#goldGradient)" strokeWidth="1" />
          <path d="M 99 61 C 105 54 104 46 98 43 C 94 42 92 50 99 61 Z" fill="#166534" stroke="url(#goldGradient)" strokeWidth="1" />
          <path d="M 96 47 C 102 40 99 32 93 30 C 89 30 88 37 96 47 Z" fill="#15803D" stroke="url(#goldGradient)" strokeWidth="1" />
          <path d="M 89 35 C 94 28 90 21 84 20 C 80 20 80 27 89 35 Z" fill="#166534" stroke="url(#goldGradient)" strokeWidth="1" />
          <path d="M 80 25 C 83 19 76 14 71 16 C 68 17 70 24 80 25 Z" fill="#15803D" stroke="url(#goldGradient)" strokeWidth="1" />
        </g>

        {/* Bottom Ribbon / Tie */}
        <path d="M 52 100 Q 60 106 68 100 Q 64 108 52 100 Z" fill="url(#goldGradient)" stroke="#854D0E" strokeWidth="1" />
        <circle cx="60" cy="101" r="2.5" fill="#FEF08A" stroke="#CA8A04" strokeWidth="1" />

        {/* Shield Outer Gold Rim */}
        <path
          d="M 60 20 Q 82 20 82 35 C 82 66 72 86 60 94 C 48 86 38 66 38 35 Q 38 20 60 20 Z"
          fill="url(#goldGradient)"
          stroke="#854D0E"
          strokeWidth="1.5"
        />

        {/* Shield Inner Dark Body */}
        <path
          d="M 60 23 Q 79 23 79 36 C 79 64 70 82 60 90 C 50 82 41 64 41 36 Q 41 23 60 23 Z"
          fill="url(#shieldBg)"
          stroke="url(#goldGradient)"
          strokeWidth="1.5"
        />

        {/* Small Golden Star at top of shield */}
        <path
          d="M 60 28 L 61.2 31.5 L 64.8 31.5 L 61.8 33.6 L 63 37 L 60 34.8 L 57 37 L 58.2 33.6 L 55.2 31.5 L 58.8 31.5 Z"
          fill="url(#goldGradient)"
          stroke="#713F12"
          strokeWidth="0.5"
        />

        {/* Open Book in the Center of Shield */}
        <g transform="translate(0, 4)">
          {/* Book Pages Base Shadow */}
          <path
            d="M 60 52 C 54 48 48 48 44 50 L 44 68 C 48 66 54 66 60 70 C 66 66 72 66 76 68 L 76 50 C 72 48 66 48 60 52 Z"
            fill="#CBD5E1"
          />

          {/* Left Page (White / Ivory) */}
          <path
            d="M 60 50 C 55 46 49 46 45 48 L 45 66 C 49 64 55 64 60 68 Z"
            fill="#FFFFFF"
            stroke="#94A3B8"
            strokeWidth="0.8"
          />
          {/* Right Page (White / Ivory) */}
          <path
            d="M 60 50 C 65 46 71 46 75 48 L 75 66 C 71 64 65 64 60 68 Z"
            fill="#F8FAFC"
            stroke="#94A3B8"
            strokeWidth="0.8"
          />

          {/* Spine / Book Center */}
          <line x1="60" y1="50" x2="60" y2="68" stroke="#CA8A04" strokeWidth="1.5" />

          {/* Text lines on Left Page */}
          <line x1="48" y1="53" x2="56" y2="52" stroke="#94A3B8" strokeWidth="1" strokeLinecap="round" />
          <line x1="48" y1="57" x2="56" y2="56" stroke="#94A3B8" strokeWidth="1" strokeLinecap="round" />
          <line x1="48" y1="61" x2="54" y2="60" stroke="#94A3B8" strokeWidth="1" strokeLinecap="round" />

          {/* Text lines on Right Page */}
          <line x1="64" y1="52" x2="72" y2="53" stroke="#94A3B8" strokeWidth="1" strokeLinecap="round" />
          <line x1="64" y1="56" x2="72" y2="57" stroke="#94A3B8" strokeWidth="1" strokeLinecap="round" />
          <line x1="66" y1="60" x2="72" y2="61" stroke="#94A3B8" strokeWidth="1" strokeLinecap="round" />

          {/* Gold Bookmark Ribbon hanging down */}
          <path d="M 60 68 L 60 76 L 62 74 L 64 76 L 64 68 Z" fill="url(#goldGradient)" stroke="#854D0E" strokeWidth="0.5" />
        </g>
      </svg>
    </div>
  );
};
