export const ROOM_MIN_PLAYERS = 2;
export const ROOM_MAX_PLAYERS = 6;
export const INVITE_CODE_LENGTH = 6;
export const INVITE_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export const PLAYER_NAME_MIN_LENGTH = 2;
export const PLAYER_NAME_MAX_LENGTH = 16;

export const RECONNECT_GRACE_MS = 45_000;
export const ROOM_INACTIVITY_TTL_MS = 30 * 60_000;
export const ROOM_CREATE_COOLDOWN_MS = 4_000;
export const SOCKET_RATE_LIMIT_WINDOW_MS = 5_000;
export const SOCKET_MAX_EVENTS_PER_WINDOW = 80;

export const ROUND_DURATION_SECONDS = 75;
export const ROUND_TRANSITION_SECONDS = 5;

export const DRAW_PALETTE = [
  '#0F172A',
  '#2563EB',
  '#E11D48',
  '#059669',
  '#D97706',
  '#7C3AED',
  '#0D9488',
  '#FFFFFF',
] as const;

export interface AvatarPreset {
  id: string;
  label: string;
  roleHint: string;
}

export const AVATAR_PRESETS: readonly AvatarPreset[] = [
  { id: 'kora', label: 'Kora', roleHint: 'Stratège calme' },
  { id: 'zephyr', label: 'Zéphyr', roleHint: 'Trait rapide' },
  { id: 'tiki', label: 'Tiki', roleHint: 'Esprit malin' },
  { id: 'nebula', label: 'Nébula', roleHint: 'Créatif pur' },
  { id: 'mango', label: 'Mango', roleHint: 'Énergie vive' },
  { id: 'baya', label: 'Baya', roleHint: 'Œil vif' },
] as const;

export interface AvatarColorOption {
  id: string;
  label: string;
  hex: string;
  ringClass: string;
}

export const AVATAR_COLORS: readonly AvatarColorOption[] = [
  { id: 'cobalt', label: 'Cobalt', hex: '#2563EB', ringClass: 'ring-blue-600' },
  { id: 'marigold', label: 'Ambre', hex: '#D97706', ringClass: 'ring-amber-600' },
  { id: 'emerald', label: 'Émeraude', hex: '#059669', ringClass: 'ring-emerald-600' },
  { id: 'coral', label: 'Corail', hex: '#E11D48', ringClass: 'ring-rose-600' },
  { id: 'violet', label: 'Prune', hex: '#7C3AED', ringClass: 'ring-violet-600' },
  { id: 'teal', label: 'Turquoise', hex: '#0D9488', ringClass: 'ring-teal-600' },
] as const;
