import React from 'react';
import { Box } from '@mui/material';

interface BrandLogoProps {
  size?: number;
  variant?: 'full' | 'icon';
  animated?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 36,
  variant = 'icon',
}) => {
  if (variant === 'full') {
    return (
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1.2,
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <svg
          width={size * 1.05}
          height={size}
          viewBox="0 0 110 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Top Triangle Crest */}
          <polygon points="55,8 75,26 35,26" fill="#2b3990" />
          {/* Main Chevron Wings */}
          <path d="M55 24 L95 58 L80 58 L55 36 L30 58 L15 58 Z" fill="#2b3990" />
          <path d="M55 42 L95 76 L80 76 L55 54 L30 76 L15 76 Z" fill="#2b3990" />
          {/* Red Dot */}
          <circle cx="55" cy="46" r="10" fill="#d32f2f" />
          {/* SRM Text */}
          <text x="55" y="96" textAnchor="middle" fill="#d32f2f" fontSize="22" fontWeight="900" fontFamily="Arial, sans-serif" letterSpacing="1">
            SRM
          </text>
        </svg>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ color: '#1e295d', fontWeight: 900, fontSize: Math.max(11, size * 0.35), lineHeight: 1, letterSpacing: '0.02em', fontFamily: 'Arial, sans-serif' }}>
            SRM GROUP
          </Box>
          <Box sx={{ color: '#1e295d', fontWeight: 900, fontSize: Math.max(9.5, size * 0.3), lineHeight: 1.1, letterSpacing: '0.02em', fontFamily: 'Arial, sans-serif', mt: 0.1 }}>
            OF INSTITUTIONS
          </Box>
          <Box sx={{ bgcolor: '#1e295d', color: '#ffffff', fontWeight: 800, fontSize: Math.max(8, size * 0.22), px: 0.6, py: 0.15, borderRadius: '2px', textAlign: 'center', letterSpacing: '0.14em', mt: 0.3, textTransform: 'uppercase' }}>
            RAMAPURAM
          </Box>
        </Box>
      </Box>
    );
  }

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
        filter: 'drop-shadow(0 2px 6px rgba(43, 57, 144, 0.2))',
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 110 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Top Triangle Crest */}
        <polygon points="55,8 75,26 35,26" fill="#2b3990" />
        {/* Main Chevron Wings */}
        <path d="M55 24 L95 58 L80 58 L55 36 L30 58 L15 58 Z" fill="#2b3990" />
        <path d="M55 42 L95 76 L80 76 L55 54 L30 76 L15 76 Z" fill="#2b3990" />
        {/* Red Dot */}
        <circle cx="55" cy="46" r="10" fill="#d32f2f" />
        {/* SRM Text */}
        <text x="55" y="96" textAnchor="middle" fill="#d32f2f" fontSize="22" fontWeight="900" fontFamily="Arial, sans-serif" letterSpacing="1">
          SRM
        </text>
      </svg>
    </Box>
  );
};

export default BrandLogo;
