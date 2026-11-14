import type { Server as SocketIOServer } from 'socket.io';
import {
  ROOM_MIN_PLAYERS,
  ROUND_DURATION_SECONDS,
  ROUND_TRANSITION_SECONDS,
} from '../../src/shared/constants.ts';
import type { ClientToServerEvents, ServerToClientEvents } from '../../src/shared/events.ts';
import type {
  DrawStrokeSegment,
  RoundPublicInfo,
  ScoreEntry,
} from '../../src/shared/types.ts';
import type { RoomManager, ServerRoom } from '../rooms/roomManager.ts';
import {
  FRENCH_WORDS,
  buildWordMask,
  normalizeWordForCompare,
} from './wordBank.fr.ts';

const MAX_STORED_STROKES_PER_TURN = 4000;

interface ActiveTurnState {
  roundNumber: number;
  totalRounds: number;
  drawerOrder: string[];
  turnIndex: number;
  drawerPlayerId: string;
  secretWord: string;
  wordMask: string;
  secondsRemaining: number;
  guessedPlayerIds: Set<string>;
  usedWords: Set<string>;
  strokes: DrawStrokeSegment[];
  isTransitioning: boolean;
  tickTimer: ReturnType<typeof setInterval> | null;
  transitionTimer: ReturnType<typeof setTimeout> | null;
}

export class DrawGuessEngine {
  private games = new Map<string, ActiveTurnState>();
  private io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>;
  private roomManager: RoomManager;

  constructor(
    io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>,
    roomManager: RoomManager
  ) {
    this.io = io;
    this.roomManager = roomManager;
  }

  public startGame(room: ServerRoom): { ok: true } | { ok: false; message: string } {
    const connectedPlayers = room.players.filter((p) => p.isConnected);
    if (connectedPlayers.length < ROOM_MIN_PLAYERS) {
      return {
        ok: false,
        message: `Il faut au moins ${ROOM_MIN_PLAYERS} joueurs connectés pour démarrer.`,
      };
    }

    if (room.phase === 'playing') {
      return { ok: false, message: 'Une partie est déjà en cours.' };
    }

    this.cleanupRoomGame(room.code);

    room.phase = 'playing';
    room.lastActivityAt = Date.now();
    room.players.forEach((p) => {
      p.score = 0;
    });

    const drawerOrder = [...connectedPlayers]
      .sort((a, b) => a.seatIndex - b.seatIndex)
      .map((p) => p.id);

    room.onCleanup = () => this.cleanupRoomGame(room.code);
    this.roomManager.recordGameStarted();

    const publicState = this.roomManager.toPublicState(room);
    this.io.to(room.code).emit('game:started', { room: publicState });

    this.beginTurn(room, drawerOrder, 0, new Set<string>());
    return { ok: true };
  }

  private pickRandomWord(usedWords: Set<string>): string {
    const candidates = FRENCH_WORDS.filter((w) => !usedWords.has(w));
    const pool = candidates.length > 0 ? candidates : FRENCH_WORDS;
    const index = Math.floor(Math.random() * pool.length);
    const chosen = pool[index];
    usedWords.add(chosen);
    return chosen;
  }

  private beginTurn(
    room: ServerRoom,
    drawerOrder: string[],
    turnIndex: number,
    usedWords: Set<string>
  ) {
    if (turnIndex >= drawerOrder.length) {
      this.finishGame(room);
      return;
    }

    const drawerPlayer = room.players.find(
      (p) => p.id === drawerOrder[turnIndex] && p.isConnected
    );
    if (!drawerPlayer) {
      this.beginTurn(room, drawerOrder, turnIndex + 1, usedWords);
      return;
    }

    const secretWord = this.pickRandomWord(usedWords);
    const wordMask = buildWordMask(secretWord);
    const roundNumber = turnIndex + 1;
    const totalRounds = drawerOrder.length;

    const state: ActiveTurnState = {
      roundNumber,
      totalRounds,
      drawerOrder,
      turnIndex,
      drawerPlayerId: drawerPlayer.id,
      secretWord,
      wordMask,
      secondsRemaining: ROUND_DURATION_SECONDS,
      guessedPlayerIds: new Set<string>(),
      usedWords,
      strokes: [],
      isTransitioning: false,
      tickTimer: null,
      transitionTimer: null,
    };

    this.games.set(room.code, state);

    this.io.to(room.code).emit('draw:cleared');
    this.emitRoomStateWithRound(room, state);

    const basePayload = {
      roundNumber,
      totalRounds,
      drawerPlayerId: drawerPlayer.id,
      drawerNickname: drawerPlayer.nickname,
      wordLength: secretWord.length,
      wordMask,
      secondsRemaining: ROUND_DURATION_SECONDS,
    };

    // Broadcast masked turn info to guessers, and secretWord ONLY to the drawer
    for (const player of room.players) {
      if (!player.isConnected) continue;
      if (player.id === drawerPlayer.id) {
        this.io.to(player.socketId).emit('turn:begin', {
          ...basePayload,
          secretWord,
        });
      } else {
        this.io.to(player.socketId).emit('turn:begin', basePayload);
      }
    }

    state.tickTimer = setInterval(() => {
      if (state.isTransitioning) return;
      state.secondsRemaining -= 1;
      this.io.to(room.code).emit('timer:update', {
        secondsRemaining: Math.max(0, state.secondsRemaining),
      });

      if (state.secondsRemaining <= 0) {
        this.concludeTurn(room, state, usedWords);
      }
    }, 1000);
  }

  public handleStroke(
    room: ServerRoom,
    playerId: string,
    socketId: string,
    stroke: DrawStrokeSegment
  ) {
    const state = this.games.get(room.code);
    if (!state || state.isTransitioning) return;
    if (state.drawerPlayerId !== playerId) return;

    room.lastActivityAt = Date.now();
    if (state.strokes.length < MAX_STORED_STROKES_PER_TURN) {
      state.strokes.push(stroke);
    }

    this.io.to(room.code).except(socketId).emit('draw:sync', { stroke });
  }

  public handleClear(room: ServerRoom, playerId: string) {
    const state = this.games.get(room.code);
    if (!state || state.isTransitioning) return;
    if (state.drawerPlayerId !== playerId) return;

    room.lastActivityAt = Date.now();
    state.strokes = [];
    this.io.to(room.code).emit('draw:cleared');
  }

  public handleGuess(
    room: ServerRoom,
    playerId: string,
    rawGuess: string
  ) {
    const state = this.games.get(room.code);
    if (!state || state.isTransitioning) return;

    const player = room.players.find((p) => p.id === playerId);
    if (!player) return;

    // Drawer cannot guess and already-guessed players cannot score twice
    if (player.id === state.drawerPlayerId || state.guessedPlayerIds.has(player.id)) {
      return;
    }

    room.lastActivityAt = Date.now();
    const normalizedGuess = normalizeWordForCompare(rawGuess);
    const normalizedSecret = normalizeWordForCompare(state.secretWord);

    if (!normalizedGuess) return;

    if (normalizedGuess === normalizedSecret) {
      state.guessedPlayerIds.add(player.id);

      const speedRatio = Math.max(0, state.secondsRemaining) / ROUND_DURATION_SECONDS;
      const guesserPoints = 100 + Math.round(speedRatio * 150);
      const drawerBonus = 50;

      player.score += guesserPoints;
      const drawer = room.players.find((p) => p.id === state.drawerPlayerId);
      if (drawer) {
        drawer.score += drawerBonus;
      }

      this.io.to(room.code).emit('guess:result', {
        playerId: player.id,
        nickname: player.nickname,
        correct: true,
        pointsAwarded: guesserPoints,
      });

      this.io.to(room.code).emit('score:update', {
        leaderboard: this.buildLeaderboard(room),
      });
      this.emitRoomStateWithRound(room, state);

      // Check if all connected guessers have found the word
      const connectedGuessers = room.players.filter(
        (p) => p.isConnected && p.id !== state.drawerPlayerId
      );
      const allFound =
        connectedGuessers.length > 0 &&
        connectedGuessers.every((p) => state.guessedPlayerIds.has(p.id));

      if (allFound) {
        this.concludeTurn(room, state, state.usedWords);
      }
      return;
    }

    // Prevent leaking secret word substring in public guesses
    const safePreview = normalizedGuess.includes(normalizedSecret)
      ? 'Presque…'
      : rawGuess.trim().slice(0, 40);

    this.io.to(room.code).emit('guess:result', {
      playerId: player.id,
      nickname: player.nickname,
      correct: false,
      guessPreview: safePreview,
    });
  }

  public syncPlayerOnReconnect(room: ServerRoom, playerId: string, socketId: string) {
    const state = this.games.get(room.code);
    if (!state) return;

    const drawer = room.players.find((p) => p.id === state.drawerPlayerId);
    const isDrawer = playerId === state.drawerPlayerId;

    this.io.to(socketId).emit('turn:begin', {
      roundNumber: state.roundNumber,
      totalRounds: state.totalRounds,
      drawerPlayerId: state.drawerPlayerId,
      drawerNickname: drawer?.nickname ?? 'Dessinateur',
      wordLength: state.secretWord.length,
      wordMask: state.wordMask,
      secondsRemaining: Math.max(0, state.secondsRemaining),
      ...(isDrawer ? { secretWord: state.secretWord } : {}),
    });

    for (const stroke of state.strokes) {
      this.io.to(socketId).emit('draw:sync', { stroke });
    }
  }

  public handlePlayerRemoved(room: ServerRoom, removedPlayerId: string) {
    const state = this.games.get(room.code);
    if (!state || room.phase !== 'playing') return;

    const connectedPlayers = room.players.filter((p) => p.isConnected);
    if (connectedPlayers.length < ROOM_MIN_PLAYERS) {
      this.finishGame(room);
      return;
    }

    if (state.drawerPlayerId === removedPlayerId && !state.isTransitioning) {
      this.concludeTurn(room, state, state.usedWords);
    }
  }

  private concludeTurn(
    room: ServerRoom,
    state: ActiveTurnState,
    usedWords: Set<string>
  ) {
    if (state.isTransitioning) return;
    state.isTransitioning = true;

    if (state.tickTimer) {
      clearInterval(state.tickTimer);
      state.tickTimer = null;
    }

    this.io.to(room.code).emit('score:update', {
      leaderboard: this.buildLeaderboard(room),
      revealedWord: state.secretWord,
    });

    state.transitionTimer = setTimeout(() => {
      state.transitionTimer = null;
      if (!this.roomManager.getRoom(room.code)) return;

      const connectedCount = room.players.filter((p) => p.isConnected).length;
      if (connectedCount < ROOM_MIN_PLAYERS) {
        this.finishGame(room);
        return;
      }

      this.beginTurn(room, state.drawerOrder, state.turnIndex + 1, usedWords);
    }, ROUND_TRANSITION_SECONDS * 1000);
  }

  private finishGame(room: ServerRoom) {
    this.cleanupRoomGame(room.code);
    room.phase = 'ended';
    room.lastActivityAt = Date.now();
    this.roomManager.recordGameEnded();

    const leaderboard = this.buildLeaderboard(room);
    this.io.to(room.code).emit('room:state', {
      room: this.roomManager.toPublicState(room),
    });
    this.io.to(room.code).emit('game:end', { leaderboard });
  }

  private emitRoomStateWithRound(room: ServerRoom, state: ActiveTurnState) {
    const publicState = this.roomManager.toPublicState(room);
    const drawer = room.players.find((p) => p.id === state.drawerPlayerId);
    const round: RoundPublicInfo = {
      roundNumber: state.roundNumber,
      totalRounds: state.totalRounds,
      drawerPlayerId: state.drawerPlayerId,
      drawerNickname: drawer?.nickname ?? 'Dessinateur',
      wordLength: state.secretWord.length,
      wordMask: state.wordMask,
      secondsRemaining: Math.max(0, state.secondsRemaining),
    };

    publicState.round = round;
    publicState.players = publicState.players.map((p) => ({
      ...p,
      hasGuessedCurrentRound: state.guessedPlayerIds.has(p.id),
    }));

    this.io.to(room.code).emit('room:state', { room: publicState });
  }

  private buildLeaderboard(room: ServerRoom): ScoreEntry[] {
    return [...room.players]
      .sort((a, b) => b.score - a.score || a.seatIndex - b.seatIndex)
      .map((p, idx) => ({
        playerId: p.id,
        nickname: p.nickname,
        avatarId: p.avatarId,
        colorHex: p.colorHex,
        score: p.score,
        rank: idx + 1,
      }));
  }

  public cleanupRoomGame(roomCode: string) {
    const state = this.games.get(roomCode);
    if (!state) return;
    if (state.tickTimer) clearInterval(state.tickTimer);
    if (state.transitionTimer) clearTimeout(state.transitionTimer);
    this.games.delete(roomCode);
  }
}
