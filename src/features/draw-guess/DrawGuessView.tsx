'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Clock, LogOut, RotateCcw, Send, Trophy } from 'lucide-react';
import { useTranslation } from '../../i18n';
import type {
  DrawStrokeSegment,
  GuessResultPayload,
  PublicRoomState,
  ScoreEntry,
} from '../../shared/types';
import { AvatarBadge } from '../identity/AvatarBadge';
import { DrawingCanvas, type DrawingCanvasHandle } from './DrawingCanvas';

export interface TurnDisplayState {
  roundNumber: number;
  totalRounds: number;
  drawerPlayerId: string;
  drawerNickname: string;
  wordLength: number;
  wordMask: string;
  secondsRemaining: number;
  secretWord?: string;
}

interface DrawGuessViewProps {
  room: PublicRoomState;
  selfPlayerId: string;
  turn: TurnDisplayState | null;
  secondsRemaining: number;
  revealedWord: string | null;
  guesses: GuessResultPayload[];
  leaderboard: ScoreEntry[];
  canvasRef: React.RefObject<DrawingCanvasHandle | null>;
  onEmitStroke: (stroke: DrawStrokeSegment) => void;
  onEmitClear: () => void;
  onSubmitGuess: (guess: string) => void;
  onPlayAgain: () => void;
  onLeaveRoom: () => void;
}

export const DrawGuessView: React.FC<DrawGuessViewProps> = ({
  room,
  selfPlayerId,
  turn,
  secondsRemaining,
  revealedWord,
  guesses,
  leaderboard,
  canvasRef,
  onEmitStroke,
  onEmitClear,
  onSubmitGuess,
  onPlayAgain,
  onLeaveRoom,
}) => {
  const { t } = useTranslation();
  const [guessInput, setGuessInput] = useState('');
  const feedEndRef = useRef<HTMLDivElement>(null);

  const isHost = room.hostPlayerId === selfPlayerId;
  const isDrawer = turn?.drawerPlayerId === selfPlayerId;
  const selfPlayer = room.players.find((p) => p.id === selfPlayerId);
  const hasGuessed = Boolean(selfPlayer?.hasGuessedCurrentRound);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [guesses.length]);

  const handleGuessFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = guessInput.trim();
    if (!trimmed || isDrawer || hasGuessed) return;
    onSubmitGuess(trimmed);
    setGuessInput('');
  };

  if (room.phase === 'ended') {
    const finalScores: ScoreEntry[] =
      leaderboard.length > 0
        ? leaderboard
        : [...room.players]
            .sort((a, b) => b.score - a.score)
            .map((p, idx) => ({
              playerId: p.id,
              nickname: p.nickname,
              avatarId: p.avatarId,
              colorHex: p.colorHex,
              score: p.score,
              rank: idx + 1,
            }));

    return (
      <div className="mx-auto max-w-3xl px-4 pt-8 pb-24 sm:px-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="flex items-center gap-3 text-amber-600">
            <Trophy className="h-7 w-7 shrink-0" />
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              {t.drawGuess.finalHeading}
            </h1>
          </div>
          <p className="mt-2 text-sm text-slate-600">{t.drawGuess.finalSubtitle}</p>

          <ol className="mt-6 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50/70">
            {finalScores.map((entry) => (
              <li
                key={entry.playerId}
                className="flex items-center justify-between gap-4 px-4 py-3.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-bold tabular-nums ${
                      entry.rank === 1
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    #{entry.rank}
                  </span>
                  <AvatarBadge
                    avatarId={entry.avatarId}
                    colorHex={entry.colorHex}
                    size="sm"
                  />
                  <span className="truncate text-base font-bold text-slate-900">
                    {entry.nickname}
                    {entry.playerId === selfPlayerId ? ' (Vous)' : ''}
                  </span>
                </div>
                <span className="font-mono text-base font-bold text-blue-700 tabular-nums whitespace-nowrap">
                  {entry.score} pts
                </span>
              </li>
            ))}
          </ol>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {isHost ? (
              <button
                type="button"
                onClick={onPlayAgain}
                className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-700"
              >
                <RotateCcw className="h-4 w-4 shrink-0" />
                <span>{t.drawGuess.playAgain}</span>
              </button>
            ) : (
              <div className="flex flex-1 items-center justify-center rounded-xl bg-slate-100 px-4 py-3 text-center text-sm font-medium text-slate-600">
                {t.drawGuess.waitingHostReplay}
              </div>
            )}

            <button
              type="button"
              onClick={onLeaveRoom}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>{t.drawGuess.leaveGame}</span>
            </button>
          </div>
        </section>
      </div>
    );
  }

  const sortedPlayers = [...room.players].sort(
    (a, b) => b.score - a.score || a.seatIndex - b.seatIndex
  );

  return (
    <div className="mx-auto max-w-6xl px-4 pt-4 pb-24 sm:px-6 md:py-6">
      {/* Top Game Status Strip */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold text-slate-600 tabular-nums">
            {t.drawGuess.roundLabel} {turn?.roundNumber ?? 1}/{turn?.totalRounds ?? room.players.length}
          </span>
          <span className="text-slate-300" aria-hidden="true">
            ·
          </span>
          <div className="text-sm font-semibold text-slate-900">
            {isDrawer && turn?.secretWord ? (
              <span>
                {t.drawGuess.wordToDraw} :{' '}
                <strong className="font-display text-base text-blue-700 uppercase">
                  {turn.secretWord}
                </strong>
              </span>
            ) : (
              <span>
                {t.drawGuess.drawingBy} <strong>{turn?.drawerNickname ?? '…'}</strong>
                {turn && (
                  <span className="ml-2 font-mono text-sm tracking-widest text-slate-700 tabular-nums">
                    {turn.wordMask} ({turn.wordLength} {t.drawGuess.lettersCount})
                  </span>
                )}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-mono text-sm font-bold tabular-nums ${
              secondsRemaining <= 15
                ? 'bg-amber-100 text-amber-900'
                : 'bg-slate-100 text-slate-900'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>{secondsRemaining}s</span>
          </div>

          <button
            type="button"
            onClick={onLeaveRoom}
            aria-label={t.drawGuess.leaveGame}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t.drawGuess.leaveGame}</span>
          </button>
        </div>
      </div>

      {/* Round Transition Reveal Banner */}
      {revealedWord && (
        <div
          role="status"
          className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 text-emerald-950"
        >
          <p className="text-sm font-semibold sm:text-base">
            {t.drawGuess.revealedWordPrefix} :{' '}
            <strong className="font-display uppercase text-emerald-800">{revealedWord}</strong>
          </p>
          <span className="text-xs font-medium text-emerald-800">
            {t.drawGuess.nextRoundSoon}
          </span>
        </div>
      )}

      {/* Main Play Workspace */}
      <div className="grid gap-5 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <DrawingCanvas
            ref={canvasRef}
            canDraw={Boolean(isDrawer && !revealedWord)}
            onEmitStroke={onEmitStroke}
            onEmitClear={onEmitClear}
          />
          {isDrawer && !revealedWord && (
            <p className="mt-2 text-xs text-slate-500">{t.drawGuess.drawerHint}</p>
          )}
        </div>

        <aside className="flex flex-col gap-4 lg:col-span-4">
          {/* Live Scores */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-bold text-slate-900">{t.drawGuess.scoresHeading}</h2>
            <ul className="mt-2.5 divide-y divide-slate-100">
              {sortedPlayers.map((player) => {
                const drawingNow = turn?.drawerPlayerId === player.id;
                return (
                  <li
                    key={player.id}
                    className="flex items-center justify-between gap-2 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <AvatarBadge
                        avatarId={player.avatarId}
                        colorHex={player.colorHex}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {player.nickname}
                          {player.id === selfPlayerId ? ' (Vous)' : ''}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {drawingNow
                            ? 'Dessine'
                            : player.hasGuessedCurrentRound
                              ? 'Trouvé'
                              : 'En jeu'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {player.hasGuessedCurrentRound && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      )}
                      <span className="font-mono text-sm font-bold text-slate-800 tabular-nums">
                        {player.score}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Guess Feed & Submission */}
          <section className="flex flex-1 flex-col rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-bold text-slate-900">{t.drawGuess.guessesHeading}</h2>

            <div className="mt-2.5 h-52 flex-1 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-2">
              {guesses.length === 0 ? (
                <p className="text-xs text-slate-400">
                  Aucune proposition pour le moment.
                </p>
              ) : (
                guesses.map((g, idx) => (
                  <div
                    key={`${g.playerId}-${idx}`}
                    className={`rounded-lg px-2.5 py-1.5 text-xs ${
                      g.correct
                        ? 'bg-emerald-100 font-semibold text-emerald-950'
                        : 'bg-white text-slate-700'
                    }`}
                  >
                    {g.correct ? (
                      <span>
                        <strong>{g.nickname}</strong> {t.drawGuess.foundWordBanner}{' '}
                        <span className="font-mono tabular-nums">+{g.pointsAwarded} pts</span>
                      </span>
                    ) : (
                      <span>
                        <strong className="text-slate-900">{g.nickname} :</strong>{' '}
                        {g.guessPreview}
                      </span>
                    )}
                  </div>
                ))
              )}
              <div ref={feedEndRef} />
            </div>

            {!isDrawer && (
              <form onSubmit={handleGuessFormSubmit} className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={guessInput}
                  disabled={hasGuessed || Boolean(revealedWord)}
                  onChange={(e) => setGuessInput(e.target.value)}
                  maxLength={40}
                  placeholder={
                    hasGuessed ? t.drawGuess.alreadyGuessed : t.drawGuess.guessPlaceholder
                  }
                  className="min-h-[44px] flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-2 focus:outline-blue-600 disabled:bg-slate-100 disabled:text-slate-500"
                />
                <button
                  type="submit"
                  disabled={hasGuessed || Boolean(revealedWord) || !guessInput.trim()}
                  aria-label={t.drawGuess.guessSubmit}
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
};
