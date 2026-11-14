'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { useTranslation } from '../../i18n';
import {
  AVATAR_COLORS,
  AVATAR_PRESETS,
  PLAYER_NAME_MAX_LENGTH,
} from '../../shared/constants';
import type { GuestProfile } from '../../shared/types';
import { AvatarBadge } from './AvatarBadge';

interface ProfileEditorProps {
  profile: GuestProfile;
  isNicknameValid: boolean;
  showValidationError: boolean;
  onChange: (patch: Partial<Omit<GuestProfile, 'sessionToken'>>) => void;
}

export const ProfileEditor: React.FC<ProfileEditorProps> = ({
  profile,
  isNicknameValid,
  showValidationError,
  onChange,
}) => {
  const { t } = useTranslation();

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-4">
        <AvatarBadge avatarId={profile.avatarId} colorHex={profile.colorHex} size="lg" />
        <div className="min-w-0">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">{t.profile.heading}</h2>
          <p className="mt-0.5 text-sm text-slate-600">{t.profile.subtitle}</p>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        <div>
          <label
            htmlFor="guest-nickname"
            className="block text-sm font-semibold text-slate-800"
          >
            {t.profile.nicknameLabel}
          </label>
          <input
            id="guest-nickname"
            type="text"
            value={profile.nickname}
            maxLength={PLAYER_NAME_MAX_LENGTH}
            onChange={(e) => onChange({ nickname: e.target.value })}
            placeholder={t.profile.nicknamePlaceholder}
            autoComplete="nickname"
            className={`mt-2 min-h-[44px] w-full rounded-xl border bg-slate-50 px-4 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-2 focus:outline-offset-0 ${
              showValidationError && !isNicknameValid
                ? 'border-rose-500 focus:outline-rose-500'
                : 'border-slate-300 focus:border-blue-600 focus:outline-blue-600'
            }`}
          />
          {showValidationError && !isNicknameValid && (
            <p className="mt-1.5 text-xs font-medium text-rose-600" role="alert">
              {t.profile.nicknameError}
            </p>
          )}
        </div>

        <div>
          <span className="block text-sm font-semibold text-slate-800">
            {t.profile.avatarLabel}
          </span>
          <div className="mt-2.5 grid grid-cols-3 gap-2.5 sm:grid-cols-6">
            {AVATAR_PRESETS.map((preset) => {
              const selected = profile.avatarId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onChange({ avatarId: preset.id })}
                  aria-pressed={selected}
                  className={`flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-xl border p-2 text-center transition-colors ${
                    selected
                      ? 'border-blue-600 bg-blue-50/70 text-blue-950'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <AvatarBadge avatarId={preset.id} colorHex={profile.colorHex} size="sm" />
                  <span className="text-xs font-semibold">{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span className="block text-sm font-semibold text-slate-800">
            {t.profile.colorLabel}
          </span>
          <div className="mt-2.5 flex flex-wrap items-center gap-3">
            {AVATAR_COLORS.map((color) => {
              const selected = profile.colorHex === color.hex;
              return (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => onChange({ colorHex: color.hex })}
                  aria-label={color.label}
                  aria-pressed={selected}
                  className={`flex h-11 w-11 items-center justify-center rounded-full transition-transform active:scale-95 ${
                    selected ? `ring-2 ring-offset-2 ${color.ringClass}` : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.hex }}
                >
                  {selected && <Check className="h-5 w-5 text-white" strokeWidth={2.75} />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-slate-200 pt-5">
          <label className="flex cursor-pointer items-start justify-between gap-4">
            <div>
              <span className="block text-sm font-semibold text-slate-800">
                {t.profile.ecoLabel}
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-slate-600">
                {t.profile.ecoHint}
              </span>
            </div>
            <input
              type="checkbox"
              checked={profile.lowGraphicsMode}
              onChange={(e) => onChange({ lowGraphicsMode: e.target.checked })}
              className="mt-1 h-5 w-5 shrink-0 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-600"
            />
          </label>
        </div>
      </div>
    </section>
  );
};
