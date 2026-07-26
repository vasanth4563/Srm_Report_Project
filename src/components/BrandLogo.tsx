import React from 'react';
import { Box } from '@mui/material';

interface BrandLogoProps {
  size?: number;
  variant?: 'full' | 'icon';
  animated?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 40,
  variant = 'icon',
  animated = true,
}) => {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        flexShrink: 0,
        filter: 'drop-shadow(0 4px 12px rgba(56, 189, 248, 0.35))',
        '& svg': {
          width: '100%',
          height: '100%',
        },
      }}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Main Shield & Crest Gradient */}
          <linearGradient id="srmLogoGradPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4c248b" />
            <stop offset="50%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>

          {/* Accent Gold/Crown Gradient */}
          <linearGradient id="srmLogoGradGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>

          {/* Glass Highlight Gradient */}
          <linearGradient id="srmLogoGlass" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Outer Glowing Ring */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="url(#srmLogoGradPrimary)"
          opacity="0.15"
        />

        {/* Shield Base Shape */}
        <path
          d="M50 12 C 68 12, 82 20, 82 34 C 82 62, 62 82, 50 88 C 38 82, 18 62, 18 34 C 18 20, 32 12, 50 12 Z"
          fill="url(#srmLogoGradPrimary)"
        />

        {/* Inner Glass Layer */}
        <path
          d="M50 16 C 65 16, 77 23, 77 35 C 77 59, 60 76, 50 82 C 40 76, 23 59, 23 35 C 23 23, 35 16, 50 16 Z"
          fill="url(#srmLogoGlass)"
        />

        {/* Academic Mortarboard / Pillars Emblem */}
        <g transform="translate(50, 48) scale(0.95)">
          {/* Mortarboard Cap Top */}
          <polygon
            points="0,-22 26,-11 0,0 -26,-11"
            fill="#ffffff"
          />
          <polygon
            points="0,-22 26,-11 0,0 -26,-11"
            fill="url(#srmLogoGlass)"
          />

          {/* Cap Skull Base */}
          <path
            d="M-14,-5 L-14,6 C-14,12 14,12 14,6 L14,-5 Z"
            fill="#ffffff"
            opacity="0.9"
          />

          {/* Tassel */}
          <path
            d="M20,-9 L22,6 L20,12 L18,6 Z"
            fill="url(#srmLogoGradGold)"
          />

          {/* Institutional Pillars & Book Base */}
          <path
            d="M-18,14 Q0,19 18,14 L18,17 Q0,22 -18,17 Z"
            fill="#ffffff"
          />
        </g>

        {/* Sparkle / Excellence Star */}
        <path
          d="M74 22 L76 27 L81 29 L76 31 L74 36 L72 31 L67 29 L72 27 Z"
          fill="url(#srmLogoGradGold)"
        >
          {animated && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 74 29"
              to="360 74 29"
              dur="12s"
              repeatCount="indefinite"
            />
          )}
        </path>

        {/* Top Crown Accent Dot */}
        <circle cx="50" cy="8" r="3.5" fill="url(#srmLogoGradGold)" />
      </svg>
    </Box>
  );
};

export default BrandLogo;
