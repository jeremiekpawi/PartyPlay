'use client';

import { useEffect, useState } from 'react';
import {
  AVATAR_COLORS,
  AVATAR_PRESETS,
  PLAYER_NAME_MAX_LENGTH,
  PLAYER_NAME_MIN_LENGTH,
} from '../../shared/constants';
import type { GuestProfile } from '../../shared/types';

const STORAGE_KEY = 'partyplay_guest_profile_v1';

function createSessionToken(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `pp_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

function getSSRDefaultProfile(): GuestProfile {
  return {
    sessionToken: '',
    nickname: '',
    avatarId: AVATAR_PRESETS[0].id,
    colorHex: AVATAR_COLORS[0].hex,
    lowGraphicsMode: false,
  };
}

function loadStoredProfile(): GuestProfile {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        ...getSSRDefaultProfile(),
        sessionToken: createSessionToken(),
      };
    }
    const parsed = JSON.parse(raw) as Partial<GuestProfile>;
    return {
      sessionToken:
        typeof parsed.sessionToken === 'string' && parsed.sessionToken.length >= 8
          ? parsed.sessionToken
          : createSessionToken(),
      nickname: typeof parsed.nickname === 'string' ? parsed.nickname : '',
      avatarId: AVATAR_PRESETS.some((a) => a.id === parsed.avatarId)
        ? (parsed.avatarId as string)
        : AVATAR_PRESETS[0].id,
      colorHex: AVATAR_COLORS.some((c) => c.hex === parsed.colorHex)
        ? (parsed.colorHex as string)
        : AVATAR_COLORS[0].hex,
      lowGraphicsMode: Boolean(parsed.lowGraphicsMode),
    };
  } catch {
    return {
      ...getSSRDefaultProfile(),
      sessionToken: createSessionToken(),
    };
  }
}

export function isValidNickname(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length >= PLAYER_NAME_MIN_LENGTH && trimmed.length <= PLAYER_NAME_MAX_LENGTH;
}

export function useGuestProfile() {
  const [profile, setProfile] = useState<GuestProfile>(() => getSSRDefaultProfile());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setProfile(loadStoredProfile());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // Ignore storage quota errors
    }
  }, [profile, hydrated]);

  const updateProfile = (patch: Partial<Omit<GuestProfile, 'sessionToken'>>) => {
    setProfile((prev) => ({
      ...prev,
      sessionToken: prev.sessionToken || createSessionToken(),
      ...patch,
    }));
  };

  return {
    profile,
    updateProfile,
    isNicknameValid: isValidNickname(profile.nickname),
  };
}
