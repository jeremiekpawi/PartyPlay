'use client';

import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  AlertCircle,
  Box,
  Check,
  Copy,
  Crown,
  LogOut,
  Play,
  RotateCcw,
  Share2,
  Users,
  Zap,
} from 'lucide-react';
import { useTranslation } from '../../i18n';
import type { GuestProfile, PublicRoomState } from '../../shared/types';
import { AvatarBadge } from '../identity/AvatarBadge';
import type { LobbySeatPlayer } from '../lobby3d/lobbyConstants';

const Lobby3DScene = dynamic(
  () => import('../lobby3d/Lobby3DScene').then((mod) => mod.Lobby3DScene),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-slate-100 text-slate-600">
        <Box className="h-8 w-8 text-blue-600" />
        <p className="text-sm font-semibold">Chargement de la salle 3D…</p>
      </div>
    ),
  }
);

interface LiveLobbyViewProps {
  room: PublicRoomState;
  selfPlayerId: string;
  profile: GuestProfile;
  isSocketConnected: boolean;
  serverNotice: string | null;
  onUpdateProfile: (patch: Partial<Omit<GuestProfile, 'sessionToken'>>) => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

export const LiveLobbyView: React.FC<LiveLobbyViewProps> = ({
  room,
  selfPlayerId,
  profile,
  isSocketConnected,
  serverNotice,
  onUpdateProfile,
  onStartGame,
  onLeaveRoom,
}) => {
  const { t } = useTranslation();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [cameraResetKey, setCameraResetKey] = useState(0);

  const isHost = room.hostPlayerId === selfPlayerId;
  const connectedCount = room.players.filter((p) => p.isConnected).length;
  const canStart = isHost && connectedCount >= room.minPlayers;

  const seatPlayers: LobbySeatPlayer[] = useMemo(
    () =>
      room.players.map((p) => ({
        id: p.id,
        nickname: p.nickname,
        avatarId: p.avatarId,
        colorHex: p.colorHex,
        isHost: p.isHost,
        isLocal: p.id === selfPlayerId,
        isConnected: p.isConnected,
      })),
    [room.players, selfPlayerId]
  );

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.code);
      setCopiedCode(true);
      window.setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // Clipboard fallback ignored if blocked
    }
  };

  const handleShareLink = async () => {
    const inviteUrl = `${window.location.origin}/?room=${room.code}`;
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: 'Rejoins ma salle PartyPlay',
          text: `Entre le code ${room.code} pour jouer sur PartyPlay !`,
          url: inviteUrl,
        });
        return;
      } catch {
        // Fall back to copying link if user cancels or share fails
      }
    }
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Ignore clipboard failures
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pt-5 pb-24 sm:px-6 md:py-8">
      {!isSocketConnected && (
        <div
          role="status"
          className="mb-4 flex items-center gap-2.5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-950"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-700" />
          <span>{t.liveLobby.connectionLost}</span>
        </div>
      )}

      {serverNotice && (
        <div
          role="alert"
          className="mb-4 flex items-center gap-2.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-950"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-blue-700" />
          <span>{serverNotice}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* 3D Lobby Stage */}
        <div className="lg:col-span-8">
          <div className="relative h-[380px] sm:h-[490px]">
            <Lobby3DScene
              players={seatPlayers}
              lowGraphicsMode={profile.lowGraphicsMode}
              cameraResetKey={cameraResetKey}
            />

            {/* Compact 3D scene toolbar at bottom center */}
            <div className="pointer-events-none absolute right-3 bottom-3 left-3 flex justify-center">
              <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateProfile({ lowGraphicsMode: !profile.lowGraphicsMode })
                  }
                  aria-pressed={profile.lowGraphicsMode}
                  className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                    profile.lowGraphicsMode
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>{t.lobby3d.ecoToggle}</span>
                </button>
                <div className="h-4 w-px bg-slate-200" />
                <button
                  type="button"
                  onClick={() => setCameraResetKey((k) => k + 1)}
                  className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>{t.lobby3d.resetCamera}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Room Controls & Participant List */}
        <aside className="flex flex-col gap-5 lg:col-span-4">
          {/* Invite Code Card */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold text-slate-500">{t.liveLobby.inviteCodeLabel}</p>
            <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="font-mono text-2xl font-bold tracking-[0.22em] text-slate-900 tabular-nums">
                {room.code}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                aria-label={t.liveLobby.copyCode}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 whitespace-nowrap"
              >
                {copiedCode ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>{t.liveLobby.copiedCode}</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>{t.liveLobby.copyCode}</span>
                  </>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={handleShareLink}
              className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100"
            >
              {copiedLink ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>{t.liveLobby.copiedLink}</span>
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4" />
                  <span>{t.liveLobby.shareLink}</span>
                </>
              )}
            </button>
          </section>

          {/* Participants List */}
          <section className="flex flex-1 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span>{t.liveLobby.participants}</span>
                </h2>
                <span className="font-mono text-xs font-semibold text-slate-600 tabular-nums">
                  {room.players.length} / {room.maxPlayers}
                </span>
              </div>

              <ul className="mt-4 divide-y divide-slate-100">
                {room.players.map((player) => (
                  <li key={player.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="flex min-w-0 items-center gap-3">
                      <AvatarBadge
                        avatarId={player.avatarId}
                        colorHex={player.colorHex}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {player.nickname}
                        </p>
                        <p className="text-xs text-slate-500">
                          {player.isHost ? t.liveLobby.hostTag : 'Joueur'}
                          {player.id === selfPlayerId ? ` · ${t.liveLobby.youTag}` : ''}
                          {!player.isConnected ? ` · ${t.liveLobby.reconnectingTag}` : ''}
                        </p>
                      </div>
                    </div>
                    {player.isHost && (
                      <Crown className="h-4 w-4 shrink-0 text-amber-500" aria-label={t.liveLobby.hostTag} />
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 space-y-2.5 border-t border-slate-200 pt-4">
              {isHost ? (
                <>
                  <button
                    type="button"
                    disabled={!canStart}
                    onClick={onStartGame}
                    className={`inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-base font-semibold transition-colors ${
                      canStart
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'cursor-not-allowed bg-slate-200 text-slate-500'
                    }`}
                  >
                    <Play className="h-4 w-4 shrink-0" />
                    <span>{t.liveLobby.startGame}</span>
                  </button>
                  {!canStart && (
                    <p className="text-center text-xs text-slate-500">
                      {t.liveLobby.needMorePlayers}
                    </p>
                  )}
                </>
              ) : (
                <p className="rounded-xl bg-slate-50 px-4 py-3 text-center text-xs font-medium text-slate-600">
                  {t.liveLobby.waitingHost}
                </p>
              )}

              <button
                type="button"
                onClick={onLeaveRoom}
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-rose-700"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                <span>{t.liveLobby.leaveRoom}</span>
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};
