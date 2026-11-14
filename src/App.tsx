'use client';

import { useEffect, useRef, useState } from 'react';
import { OfflineIndicator } from './components/PWAControls';
import { TopBar } from './components/TopBar';
import type { DrawingCanvasHandle } from './features/draw-guess/DrawingCanvas';
import {
  DrawGuessView,
  type TurnDisplayState,
} from './features/draw-guess/DrawGuessView';
import { HomeView } from './features/home/HomeView';
import { useGuestProfile } from './features/identity/useGuestProfile';
import { LobbyPreviewView } from './features/lobby3d/LobbyPreviewView';
import { LiveLobbyView } from './features/room/LiveLobbyView';
import { RoomEntryView } from './features/room/RoomEntryView';
import { I18nProvider } from './i18n';
import {
  clearActiveRoomCode,
  ensureSocketConnected,
  getSocket,
  getSocketUrl,
  readActiveRoomCode,
  saveActiveRoomCode,
} from './services/socket';
import { INVITE_CODE_LENGTH } from './shared/constants';
import type {
  AppRoute,
  DrawStrokeSegment,
  GuessResultPayload,
  PlayTab,
  PublicRoomState,
  ScoreEntry,
} from './shared/types';

function readInitialInviteCode(): string {
  if (typeof window === 'undefined') return '';
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('room') ?? '';
    return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, INVITE_CODE_LENGTH);
  } catch {
    return '';
  }
}

type PendingRoomAction =
  | { type: 'create' }
  | { type: 'join'; roomCode: string }
  | null;

export default function App() {
  const [initialInviteCode, setInitialInviteCode] = useState<string>('');
  const [route, setRoute] = useState<AppRoute>('home');
  const [playTab, setPlayTab] = useState<PlayTab>('create');
  const { profile, updateProfile, isNicknameValid } = useGuestProfile();

  const [roomState, setRoomState] = useState<PublicRoomState | null>(null);
  const [selfPlayerId, setSelfPlayerId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [roomNotice, setRoomNotice] = useState<string | null>(null);

  // Draw & Guess game state
  const [turn, setTurn] = useState<TurnDisplayState | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [revealedWord, setRevealedWord] = useState<string | null>(null);
  const [guesses, setGuesses] = useState<GuessResultPayload[]>([]);
  const [leaderboard, setLeaderboard] = useState<ScoreEntry[]>([]);
  const canvasRef = useRef<DrawingCanvasHandle | null>(null);

  const profileRef = useRef(profile);
  profileRef.current = profile;

  const activeRoomRef = useRef(roomState);
  activeRoomRef.current = roomState;

  const pendingActionRef = useRef<PendingRoomAction>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
        // Ignore service worker registration errors in restricted previews
      });
    }
  }, []);

  useEffect(() => {
    const codeFromUrl = readInitialInviteCode();
    if (codeFromUrl) {
      setInitialInviteCode(codeFromUrl);
      setPlayTab('join');
      setRoute('play');
    }

    const socket = getSocket();

    const dispatchPendingAction = () => {
      const action = pendingActionRef.current;
      if (!action) return false;
      pendingActionRef.current = null;
      const currentProfile = profileRef.current;
      const playerPayload = {
        sessionToken: currentProfile.sessionToken,
        nickname: currentProfile.nickname.trim(),
        avatarId: currentProfile.avatarId,
        colorHex: currentProfile.colorHex,
      };
      if (action.type === 'create') {
        socket.emit('room:create', { player: playerPayload });
      } else {
        socket.emit('room:join', {
          roomCode: action.roomCode,
          player: playerPayload,
        });
      }
      return true;
    };

    const onConnect = () => {
      setIsSocketConnected(true);
      const handledPending = dispatchPendingAction();
      if (!handledPending) {
        const pendingRoomCode = activeRoomRef.current?.code || readActiveRoomCode();
        if (pendingRoomCode) {
          socket.emit('player:reconnect', {
            roomCode: pendingRoomCode,
            sessionToken: profileRef.current.sessionToken,
          });
        }
      }
    };

    const onDisconnect = () => {
      setIsSocketConnected(false);
      setIsSubmitting(false);
    };

    const onConnectError = () => {
      setIsSocketConnected(false);
      setIsSubmitting(false);
      pendingActionRef.current = null;
      const customSocketUrl = getSocketUrl();
      const message = customSocketUrl
        ? 'Impossible de joindre le serveur multijoueur. Vérifiez votre connexion ou réessayez dans quelques secondes.'
        : 'Serveur temps réel indisponible sur cet hébergement. Configurez NEXT_PUBLIC_SOCKET_URL pour connecter le backend Socket.IO.';
      if (activeRoomRef.current) {
        setRoomNotice(message);
      } else {
        setServerError(message);
      }
    };

    const onRoomCreated = ({ room, selfPlayerId: playerId }: { room: PublicRoomState; selfPlayerId: string }) => {
      setIsSubmitting(false);
      setServerError(null);
      setRoomNotice(null);
      setRoomState(room);
      setSelfPlayerId(playerId);
      saveActiveRoomCode(room.code);
      setRoute('room');
    };

    const onRoomJoined = ({ room, selfPlayerId: playerId }: { room: PublicRoomState; selfPlayerId: string }) => {
      setIsSubmitting(false);
      setServerError(null);
      setRoomNotice(null);
      setRoomState(room);
      setSelfPlayerId(playerId);
      saveActiveRoomCode(room.code);
      setRoute('room');
    };

    const onRoomState = ({ room }: { room: PublicRoomState }) => {
      setRoomState(room);
    };

    const onGameStarted = ({ room }: { room: PublicRoomState }) => {
      setRoomState(room);
      setGuesses([]);
      setRevealedWord(null);
      setLeaderboard([]);
      setRoomNotice(null);
    };

    const onTurnBegin = (payload: TurnDisplayState) => {
      setTurn(payload);
      setSecondsRemaining(payload.secondsRemaining);
      setRevealedWord(null);
      setGuesses([]);
      canvasRef.current?.clear();
    };

    const onDrawSync = ({ stroke }: { stroke: DrawStrokeSegment }) => {
      canvasRef.current?.applyRemoteStroke(stroke);
    };

    const onDrawCleared = () => {
      canvasRef.current?.clear();
    };

    const onGuessResult = (result: GuessResultPayload) => {
      setGuesses((prev) => [...prev.slice(-60), result]);
    };

    const onScoreUpdate = (payload: { leaderboard: ScoreEntry[]; revealedWord?: string }) => {
      setLeaderboard(payload.leaderboard);
      if (payload.revealedWord) {
        setRevealedWord(payload.revealedWord);
      }
    };

    const onTimerUpdate = ({ secondsRemaining: sec }: { secondsRemaining: number }) => {
      setSecondsRemaining(sec);
    };

    const onGameEnd = ({ leaderboard: finalBoard }: { leaderboard: ScoreEntry[] }) => {
      setLeaderboard(finalBoard);
      setRevealedWord(null);
    };

    const onRoomError = (err: { code: string; message: string }) => {
      setIsSubmitting(false);
      pendingActionRef.current = null;
      if (activeRoomRef.current) {
        if (err.code === 'ROOM_NOT_FOUND') {
          clearActiveRoomCode();
          setRoomState(null);
          setSelfPlayerId('');
          setTurn(null);
          setRoute('play');
          setServerError(err.message);
        } else {
          setRoomNotice(err.message);
        }
      } else {
        clearActiveRoomCode();
        setServerError(err.message);
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('room:created', onRoomCreated);
    socket.on('room:joined', onRoomJoined);
    socket.on('room:state', onRoomState);
    socket.on('game:started', onGameStarted);
    socket.on('turn:begin', onTurnBegin);
    socket.on('draw:sync', onDrawSync);
    socket.on('draw:cleared', onDrawCleared);
    socket.on('guess:result', onGuessResult);
    socket.on('score:update', onScoreUpdate);
    socket.on('timer:update', onTimerUpdate);
    socket.on('game:end', onGameEnd);
    socket.on('room:error', onRoomError);

    if (readActiveRoomCode() && !codeFromUrl) {
      ensureSocketConnected();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('room:created', onRoomCreated);
      socket.off('room:joined', onRoomJoined);
      socket.off('room:state', onRoomState);
      socket.off('game:started', onGameStarted);
      socket.off('turn:begin', onTurnBegin);
      socket.off('draw:sync', onDrawSync);
      socket.off('draw:cleared', onDrawCleared);
      socket.off('guess:result', onGuessResult);
      socket.off('score:update', onScoreUpdate);
      socket.off('timer:update', onTimerUpdate);
      socket.off('game:end', onGameEnd);
      socket.off('room:error', onRoomError);
    };
  }, []);

  const handleCreateRoom = () => {
    setServerError(null);
    setIsSubmitting(true);
    const socket = ensureSocketConnected();
    if (socket.connected) {
      socket.emit('room:create', {
        player: {
          sessionToken: profile.sessionToken,
          nickname: profile.nickname.trim(),
          avatarId: profile.avatarId,
          colorHex: profile.colorHex,
        },
      });
    } else {
      pendingActionRef.current = { type: 'create' };
    }
  };

  const handleJoinRoom = (roomCode: string) => {
    setServerError(null);
    setIsSubmitting(true);
    const socket = ensureSocketConnected();
    if (socket.connected) {
      socket.emit('room:join', {
        roomCode,
        player: {
          sessionToken: profile.sessionToken,
          nickname: profile.nickname.trim(),
          avatarId: profile.avatarId,
          colorHex: profile.colorHex,
        },
      });
    } else {
      pendingActionRef.current = { type: 'join', roomCode };
    }
  };

  const handleLeaveRoom = () => {
    if (roomState) {
      getSocket().emit('room:leave', { roomCode: roomState.code });
    }
    clearActiveRoomCode();
    pendingActionRef.current = null;
    setRoomState(null);
    setSelfPlayerId('');
    setTurn(null);
    setGuesses([]);
    setLeaderboard([]);
    setRevealedWord(null);
    setRoomNotice(null);
    setRoute('play');
  };

  const handleStartGame = () => {
    if (!roomState) return;
    setRoomNotice(null);
    getSocket().emit('game:start', { roomCode: roomState.code });
  };

  const handleEmitStroke = (stroke: DrawStrokeSegment) => {
    if (!roomState) return;
    getSocket().emit('draw:stroke', { roomCode: roomState.code, stroke });
  };

  const handleEmitClear = () => {
    if (!roomState) return;
    getSocket().emit('draw:clear', { roomCode: roomState.code });
  };

  const handleSubmitGuess = (guess: string) => {
    if (!roomState) return;
    getSocket().emit('guess:submit', { roomCode: roomState.code, guess });
  };

  const handleNavigateHome = (sectionId?: string) => {
    setRoute('home');
    if (sectionId) {
      requestAnimationFrame(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNavigatePlay = (tab: PlayTab) => {
    if (roomState) {
      setRoute('room');
      return;
    }
    setPlayTab(tab);
    setRoute('play');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <I18nProvider>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <TopBar
          route={route}
          playTab={playTab}
          onNavigateHome={handleNavigateHome}
          onNavigatePlay={handleNavigatePlay}
        />

        <main>
          {route === 'home' && <HomeView onStartPlay={handleNavigatePlay} />}

          {route === 'play' && (
            <RoomEntryView
              profile={profile}
              isNicknameValid={isNicknameValid}
              onUpdateProfile={updateProfile}
              activeTab={playTab}
              onChangeTab={setPlayTab}
              initialInviteCode={initialInviteCode}
              isSubmitting={isSubmitting}
              serverError={serverError}
              onClearServerError={() => setServerError(null)}
              onCreateRoom={handleCreateRoom}
              onJoinRoom={handleJoinRoom}
              onBackHome={() => handleNavigateHome('top')}
              onInspectLobby={() => setRoute('lobby-preview')}
            />
          )}

          {route === 'lobby-preview' && (
            <LobbyPreviewView
              profile={profile}
              onUpdateProfile={updateProfile}
              onBack={() => setRoute('play')}
            />
          )}

          {route === 'room' && roomState && roomState.phase === 'lobby' && (
            <LiveLobbyView
              room={roomState}
              selfPlayerId={selfPlayerId}
              profile={profile}
              isSocketConnected={isSocketConnected}
              serverNotice={roomNotice}
              onUpdateProfile={updateProfile}
              onStartGame={handleStartGame}
              onLeaveRoom={handleLeaveRoom}
            />
          )}

          {route === 'room' && roomState && roomState.phase !== 'lobby' && (
            <DrawGuessView
              room={roomState}
              selfPlayerId={selfPlayerId}
              turn={turn}
              secondsRemaining={secondsRemaining}
              revealedWord={revealedWord}
              guesses={guesses}
              leaderboard={leaderboard}
              canvasRef={canvasRef}
              onEmitStroke={handleEmitStroke}
              onEmitClear={handleEmitClear}
              onSubmitGuess={handleSubmitGuess}
              onPlayAgain={handleStartGame}
              onLeaveRoom={handleLeaveRoom}
            />
          )}
        </main>

        <OfflineIndicator />
      </div>
    </I18nProvider>
  );
}
