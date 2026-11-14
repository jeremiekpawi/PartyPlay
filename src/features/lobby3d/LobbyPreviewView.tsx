'use client';

import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { ArrowLeft, Box, Eye, EyeOff, RotateCcw, Zap } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { AVATAR_COLORS, AVATAR_PRESETS, ROOM_MAX_PLAYERS } from '../../shared/constants';
import type { GuestProfile } from '../../shared/types';
import type { LobbySeatPlayer } from './lobbyConstants';

const DynamicLobby3DScene = dynamic(
  () => import('./Lobby3DScene').then((mod) => mod.Lobby3DScene),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-slate-100 text-slate-600">
        <Box className="h-8 w-8 text-blue-600" />
        <p className="text-sm font-semibold">Chargement de la scène 3D…</p>
      </div>
    ),
  }
);

interface LobbyPreviewViewProps {
  profile: GuestProfile;
  onUpdateProfile: (patch: Partial<Omit<GuestProfile, 'sessionToken'>>) => void;
  onBack: () => void;
}

export const LobbyPreviewView: React.FC<LobbyPreviewViewProps> = ({
  profile,
  onUpdateProfile,
  onBack,
}) => {
  const { t } = useTranslation();
  const [seatCount, setSeatCount] = useState<number>(1);
  const [cameraResetKey, setCameraResetKey] = useState<number>(0);
  const [showControls, setShowControls] = useState<boolean>(true);

  const players: LobbySeatPlayer[] = useMemo(() => {
    const localPlayer: LobbySeatPlayer = {
      id: 'local',
      nickname: profile.nickname.trim() || 'Vous (Hôte)',
      avatarId: profile.avatarId,
      colorHex: profile.colorHex,
      isHost: true,
      isLocal: true,
      isConnected: true,
    };

    const previewCompanions: LobbySeatPlayer[] = AVATAR_PRESETS.filter(
      (preset) => preset.id !== profile.avatarId
    ).map((preset, idx) => ({
      id: `seat-${idx + 2}`,
      nickname: `Place ${idx + 2}`,
      avatarId: preset.id,
      colorHex: AVATAR_COLORS[(idx + 1) % AVATAR_COLORS.length].hex,
      isHost: false,
      isLocal: false,
      isConnected: true,
    }));

    return [localPlayer, ...previewCompanions].slice(0, seatCount);
  }, [profile, seatCount]);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-5 pb-24 sm:px-6 md:py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-[40px] items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t.lobby3d.backToRoom}</span>
          </button>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            {t.lobby3d.title}
          </h1>
          <p className="mt-0.5 text-sm text-slate-600">{t.lobby3d.subtitle}</p>
        </div>

        <div className="text-right text-xs font-medium text-slate-500 tabular-nums">
          <span>
            {players.length} / {ROOM_MAX_PLAYERS} places
          </span>
          <span className="mx-1.5" aria-hidden="true">
            ·
          </span>
          <span>{profile.lowGraphicsMode ? 'Mode éco actif' : 'Qualité standard'}</span>
        </div>
      </div>

      {/* Main 3D Viewport + Collapsible Bottom Dock */}
      <div className="relative mt-5 h-[440px] sm:h-[520px]">
        <DynamicLobby3DScene
          players={players}
          lowGraphicsMode={profile.lowGraphicsMode}
          cameraResetKey={cameraResetKey}
        />

        {/* Bottom Dock Toggle + Unified Solid Control Bar (zero backdrop-blur over WebGL) */}
        <div className="pointer-events-none absolute right-3 bottom-3 left-3 flex flex-col items-center">
          <button
            type="button"
            onClick={() => setShowControls((prev) => !prev)}
            className="pointer-events-auto mb-1.5 inline-flex min-h-[32px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
          >
            {showControls ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            <span>{showControls ? 'Masquer contrôles' : 'Afficher contrôles'}</span>
          </button>

          {showControls && (
            <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-md">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-600">
                  {t.lobby3d.seatsLabel} :
                </span>
                {[1, 2, 3, 4, 5, 6].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setSeatCount(count)}
                    className={`h-8 min-w-[32px] rounded-lg px-2 font-mono text-xs font-semibold tabular-nums transition-colors ${
                      seatCount === count
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>

              <div className="h-5 w-px bg-slate-200 hidden sm:block" />

              <button
                type="button"
                onClick={() =>
                  onUpdateProfile({ lowGraphicsMode: !profile.lowGraphicsMode })
                }
                aria-pressed={profile.lowGraphicsMode}
                className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  profile.lowGraphicsMode
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Zap className="h-3.5 w-3.5" />
                <span>{t.lobby3d.ecoToggle}</span>
              </button>

              <button
                type="button"
                onClick={() => setCameraResetKey((k) => k + 1)}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>{t.lobby3d.resetCamera}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-slate-500">{t.lobby3d.phaseNote}</p>
    </div>
  );
};
