'use client';

import React from 'react';

interface AvatarBadgeProps {
  avatarId: string;
  colorHex: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-10 w-10 rounded-xl',
  md: 'h-12 w-12 rounded-xl',
  lg: 'h-16 w-16 rounded-2xl',
};

export const AvatarBadge: React.FC<AvatarBadgeProps> = ({
  avatarId,
  colorHex,
  size = 'md',
}) => {
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden shadow-xs ${SIZE_CLASSES[size]}`}
      style={{ backgroundColor: colorHex }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 64 64" className="h-full w-full">
        {/* Low-poly geometric shoulders */}
        <polygon points="10,64 20,44 44,44 54,64" fill="rgba(255,255,255,0.28)" />
        {/* Head shape variations per preset */}
        {avatarId === 'kora' && (
          <>
            <polygon points="32,12 48,22 46,40 32,46 18,40 16,22" fill="#FFFFFF" />
            <polygon points="16,22 32,12 48,22 32,20" fill="#F1F5F9" />
          </>
        )}
        {avatarId === 'zephyr' && (
          <>
            <polygon points="32,10 50,24 44,44 20,44 14,24" fill="#FFFFFF" />
            <polygon points="22,14 32,6 42,14" fill="#FDE68A" />
          </>
        )}
        {avatarId === 'tiki' && (
          <>
            <rect x="17" y="14" width="30" height="30" rx="8" fill="#FFFFFF" />
            <polygon points="17,22 25,10 31,18" fill="#FDE68A" />
            <polygon points="47,22 39,10 33,18" fill="#FDE68A" />
          </>
        )}
        {avatarId === 'nebula' && (
          <>
            <circle cx="32" cy="29" r="15" fill="#FFFFFF" />
            <polygon points="14,28 32,10 50,28 32,18" fill="rgba(15,23,42,0.14)" />
          </>
        )}
        {avatarId === 'mango' && (
          <>
            <polygon points="20,14 44,14 49,30 40,45 24,45 15,30" fill="#FFFFFF" />
            <circle cx="32" cy="12" r="5" fill="#FDE68A" />
          </>
        )}
        {avatarId === 'baya' && (
          <>
            <polygon points="32,11 47,19 47,38 32,46 17,38 17,19" fill="#FFFFFF" />
            <polygon points="17,19 32,11 47,19 42,24 22,24" fill="rgba(15,23,42,0.12)" />
          </>
        )}
        {/* Crisp cartoon eyes */}
        <circle cx="26" cy="30" r="2.6" fill="#0F172A" />
        <circle cx="38" cy="30" r="2.6" fill="#0F172A" />
        <path
          d="M27 37 Q32 41 37 37"
          stroke="#0F172A"
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  );
};
