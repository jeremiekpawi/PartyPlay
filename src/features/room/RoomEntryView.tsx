'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, KeyRound, PlusCircle } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { INVITE_CODE_LENGTH } from '../../shared/constants';
import type { GuestProfile, PlayTab } from '../../shared/types';
import { AvatarBadge } from '../identity/AvatarBadge';
import { ProfileEditor } from '../identity/ProfileEditor';

interface RoomEntryViewProps {
  profile: GuestProfile;
  isNicknameValid: boolean;
  onUpdateProfile: (patch: Partial<Omit<GuestProfile, 'sessionToken'>>) => void;
  activeTab: PlayTab;
  onChangeTab: (tab: PlayTab) => void;
  initialInviteCode?: string;
  isSubmitting: boolean;
  serverError: string | null;
  onClearServerError: () => void;
  onCreateRoom: () => void;
  onJoinRoom: (roomCode: string) => void;
  onBackHome: () => void;
  onInspectLobby: () => void;
}

export const RoomEntryView: React.FC<RoomEntryViewProps> = ({
  profile,
  isNicknameValid,
  onUpdateProfile,
  activeTab,
  onChangeTab,
  initialInviteCode = '',
  isSubmitting,
  serverError,
  onClearServerError,
  onCreateRoom,
  onJoinRoom,
  onBackHome,
  onInspectLobby,
}) => {
  const { t } = useTranslation();
  const [inviteCode, setInviteCode] = useState(initialInviteCode);
  const [showProfileError, setShowProfileError] = useState(false);
  const [codeError, setCodeError] = useState(false);

  useEffect(() => {
    if (initialInviteCode) {
      setInviteCode(initialInviteCode);
    }
  }, [initialInviteCode]);

  const normalizedCode = inviteCode
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, INVITE_CODE_LENGTH);
  const isCodeValid = normalizedCode.length === INVITE_CODE_LENGTH;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClearServerError();
    if (!isNicknameValid) {
      setShowProfileError(true);
      return;
    }
    setShowProfileError(false);
    onCreateRoom();
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClearServerError();
    let hasError = false;
    if (!isNicknameValid) {
      setShowProfileError(true);
      hasError = true;
    } else {
      setShowProfileError(false);
    }
    if (!isCodeValid) {
      setCodeError(true);
      hasError = true;
    } else {
      setCodeError(false);
    }
    if (!hasError) {
      onJoinRoom(normalizedCode);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 pb-24 sm:px-6 md:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackHome}
          className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t.room.backHome}</span>
        </button>

        <button
          type="button"
          onClick={onInspectLobby}
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100 whitespace-nowrap"
        >
          {t.room.inspectLobbyButton}
        </button>
      </div>

      <div className="mt-4 grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <ProfileEditor
            profile={profile}
            isNicknameValid={isNicknameValid}
            showValidationError={showProfileError}
            onChange={(patch) => {
              onUpdateProfile(patch);
              onClearServerError();
            }}
          />
        </div>

        <div className="lg:col-span-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <div
              role="tablist"
              aria-label="Choix de salle"
              className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'create'}
                onClick={() => {
                  onChangeTab('create');
                  setCodeError(false);
                  onClearServerError();
                }}
                className={`min-h-[42px] rounded-lg px-3 py-2 text-sm font-semibold transition-colors whitespace-nowrap ${
                  activeTab === 'create'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.room.createTab}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'join'}
                onClick={() => {
                  onChangeTab('join');
                  onClearServerError();
                }}
                className={`min-h-[42px] rounded-lg px-3 py-2 text-sm font-semibold transition-colors whitespace-nowrap ${
                  activeTab === 'join'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.room.joinTab}
              </button>
            </div>

            {activeTab === 'create' ? (
              <form onSubmit={handleCreateSubmit} className="mt-6 space-y-5">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">
                    {t.room.createTitle}
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                    {t.room.createDescription}
                  </p>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <AvatarBadge avatarId={profile.avatarId} colorHex={profile.colorHex} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {profile.nickname.trim() || 'Votre pseudonyme'}
                    </p>
                    <p className="text-xs text-slate-500">
                      Hôte · 2 à 6 joueurs · {profile.lowGraphicsMode ? 'Mode éco 3D' : '3D standard'}
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                >
                  <PlusCircle className="h-5 w-5 shrink-0" />
                  <span>{isSubmitting ? t.room.connecting : t.room.createButton}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleJoinSubmit} className="mt-6 space-y-5">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">
                    {t.room.joinTitle}
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                    {t.room.joinDescription}
                  </p>
                </div>

                <div>
                  <label htmlFor="invite-code-input" className="block text-sm font-semibold text-slate-800">
                    {t.room.codeLabel}
                  </label>
                  <input
                    id="invite-code-input"
                    type="text"
                    value={normalizedCode}
                    onChange={(e) => {
                      setInviteCode(e.target.value);
                      setCodeError(false);
                      onClearServerError();
                    }}
                    placeholder={t.room.codePlaceholder}
                    maxLength={INVITE_CODE_LENGTH}
                    autoCapitalize="characters"
                    spellCheck={false}
                    className={`mt-2 min-h-[52px] w-full rounded-xl border bg-slate-50 px-4 text-center font-mono text-2xl font-semibold tracking-[0.28em] text-slate-900 uppercase placeholder:text-slate-300 focus:bg-white focus:outline-2 focus:outline-offset-0 tabular-nums ${
                      codeError
                        ? 'border-rose-500 focus:outline-rose-500'
                        : 'border-slate-300 focus:border-blue-600 focus:outline-blue-600'
                    }`}
                  />
                  {codeError && (
                    <p className="mt-1.5 text-xs font-medium text-rose-600" role="alert">
                      {t.room.codeInvalid}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-base font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-60"
                >
                  <KeyRound className="h-5 w-5 shrink-0" />
                  <span>{isSubmitting ? t.room.connecting : t.room.joinButton}</span>
                </button>
              </form>
            )}

            {serverError && (
              <div
                role="alert"
                className="mt-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-950"
              >
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                <p className="font-medium leading-relaxed">{serverError}</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
