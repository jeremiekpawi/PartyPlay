import type { Server as HttpServer } from 'node:http';
import { Server as SocketIOServer, type Socket } from 'socket.io';
import {
  ROOM_CREATE_COOLDOWN_MS,
  SOCKET_MAX_EVENTS_PER_WINDOW,
  SOCKET_RATE_LIMIT_WINDOW_MS,
} from '../src/shared/constants.ts';
import {
  createRoomSchema,
  guessSchema,
  joinRoomSchema,
  reconnectSchema,
  roomActionSchema,
  strokeSchema,
  type ClientToServerEvents,
  type ServerToClientEvents,
} from '../src/shared/events.ts';
import { DrawGuessEngine } from './games/drawGuess.ts';
import { RoomManager } from './rooms/roomManager.ts';

interface SocketRateState {
  windowStart: number;
  count: number;
  lastRoomCreatedAt: number;
}

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

function resolveCorsOrigin(): boolean | string[] {
  const raw = process.env.ALLOWED_ORIGIN?.trim();
  if (!raw || raw === '*') {
    return true;
  }
  const origins = raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  return origins.length > 0 ? origins : true;
}

export function attachMultiplayerServer(httpServer: HttpServer) {
  const roomManager = new RoomManager();
  const rateLimits = new Map<string, SocketRateState>();

  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    pingInterval: 10_000,
    pingTimeout: 20_000,
    maxHttpBufferSize: 1e5,
    cors: {
      origin: resolveCorsOrigin(),
      credentials: true,
    },
  });

  const drawGuessEngine = new DrawGuessEngine(io, roomManager);

  function checkRateLimit(
    socket: TypedSocket,
    maxEvents = SOCKET_MAX_EVENTS_PER_WINDOW
  ): boolean {
    const now = Date.now();
    const state = rateLimits.get(socket.id) ?? {
      windowStart: now,
      count: 0,
      lastRoomCreatedAt: 0,
    };

    if (now - state.windowStart > SOCKET_RATE_LIMIT_WINDOW_MS) {
      state.windowStart = now;
      state.count = 0;
    }

    state.count += 1;
    rateLimits.set(socket.id, state);

    if (state.count > maxEvents) {
      socket.emit('room:error', {
        code: 'RATE_LIMITED',
        message: 'Trop de requêtes envoyées. Patientez quelques instants.',
      });
      return false;
    }
    return true;
  }

  io.on('connection', (socket) => {
    socket.on('room:create', (rawPayload) => {
      if (!checkRateLimit(socket)) return;

      const parsed = createRoomSchema.safeParse(rawPayload);
      if (!parsed.success) {
        socket.emit('room:error', {
          code: 'INVALID_PAYLOAD',
          message: 'Profil joueur invalide. Vérifiez votre pseudonyme.',
        });
        return;
      }

      const now = Date.now();
      const rateState = rateLimits.get(socket.id);
      if (rateState && now - rateState.lastRoomCreatedAt < ROOM_CREATE_COOLDOWN_MS) {
        socket.emit('room:error', {
          code: 'RATE_LIMITED',
          message: 'Veuillez patienter quelques secondes avant de créer une autre salle.',
        });
        return;
      }

      const result = roomManager.createRoom(socket.id, parsed.data.player);
      if (rateState) {
        rateState.lastRoomCreatedAt = now;
      }

      socket.join(result.room.code);
      socket.emit('room:created', {
        room: roomManager.toPublicState(result.room),
        selfPlayerId: result.player.id,
      });
    });

    socket.on('room:join', (rawPayload) => {
      if (!checkRateLimit(socket)) return;

      const parsed = joinRoomSchema.safeParse(rawPayload);
      if (!parsed.success) {
        socket.emit('room:error', {
          code: 'INVALID_PAYLOAD',
          message: 'Code d’invitation ou profil invalide.',
        });
        return;
      }

      const result = roomManager.joinRoom(
        socket.id,
        parsed.data.roomCode,
        parsed.data.player
      );

      if (!result.ok && 'error' in result) {
        socket.emit('room:error', result.error);
        return;
      }
      if (!result.ok) return;

      socket.join(result.room.code);
      const publicState = roomManager.toPublicState(result.room);

      socket.emit('room:joined', {
        room: publicState,
        selfPlayerId: result.player.id,
      });

      if (result.reconnected && result.room.phase === 'playing') {
        drawGuessEngine.syncPlayerOnReconnect(
          result.room,
          result.player.id,
          socket.id
        );
      }

      if (!result.reconnected) {
        const publicPlayer = publicState.players.find((p) => p.id === result.player.id);
        if (publicPlayer) {
          socket.to(result.room.code).emit('player:joined', { player: publicPlayer });
        }
      }

      io.to(result.room.code).emit('room:state', { room: publicState });
    });

    socket.on('player:reconnect', (rawPayload) => {
      if (!checkRateLimit(socket)) return;

      const parsed = reconnectSchema.safeParse(rawPayload);
      if (!parsed.success) {
        socket.emit('room:error', {
          code: 'INVALID_PAYLOAD',
          message: 'Impossible de restaurer la session.',
        });
        return;
      }

      const result = roomManager.reconnectPlayer(
        socket.id,
        parsed.data.roomCode,
        parsed.data.sessionToken
      );

      if (!result.ok && 'error' in result) {
        socket.emit('room:error', result.error);
        return;
      }
      if (!result.ok) return;

      socket.join(result.room.code);
      const publicState = roomManager.toPublicState(result.room);

      socket.emit('room:joined', {
        room: publicState,
        selfPlayerId: result.player.id,
      });

      if (result.room.phase === 'playing') {
        drawGuessEngine.syncPlayerOnReconnect(
          result.room,
          result.player.id,
          socket.id
        );
      }

      io.to(result.room.code).emit('room:state', { room: publicState });
    });

    socket.on('room:leave', (rawPayload) => {
      if (!checkRateLimit(socket)) return;

      const parsed = roomActionSchema.safeParse(rawPayload);
      if (!parsed.success) return;

      const current = roomManager.getRoomAndPlayerBySocket(socket.id);
      if (!current || current.room.code !== parsed.data.roomCode) return;

      socket.leave(current.room.code);
      const { room, removedPlayer } = roomManager.leaveRoomImmediately(socket.id);

      if (room && removedPlayer) {
        io.to(room.code).emit('player:left', {
          playerId: removedPlayer.id,
          nickname: removedPlayer.nickname,
        });
        io.to(room.code).emit('room:state', {
          room: roomManager.toPublicState(room),
        });
        drawGuessEngine.handlePlayerRemoved(room, removedPlayer.id);
      }
    });

    socket.on('game:start', (rawPayload) => {
      if (!checkRateLimit(socket)) return;

      const parsed = roomActionSchema.safeParse(rawPayload);
      if (!parsed.success) {
        socket.emit('room:error', {
          code: 'INVALID_PAYLOAD',
          message: 'Requête de démarrage invalide.',
        });
        return;
      }

      const current = roomManager.getRoomAndPlayerBySocket(socket.id);
      if (!current || current.room.code !== parsed.data.roomCode) {
        socket.emit('room:error', {
          code: 'ROOM_NOT_FOUND',
          message: 'Vous n’êtes pas connecté à cette salle.',
        });
        return;
      }

      if (!current.player.isHost) {
        socket.emit('room:error', {
          code: 'NOT_HOST',
          message: 'Seul l’hôte peut démarrer la partie.',
        });
        return;
      }

      const startResult = drawGuessEngine.startGame(current.room);
      if (!startResult.ok && 'message' in startResult) {
        socket.emit('room:error', {
          code: 'NOT_ENOUGH_PLAYERS',
          message: startResult.message,
        });
      }
    });

    socket.on('draw:stroke', (rawPayload) => {
      if (!checkRateLimit(socket, SOCKET_MAX_EVENTS_PER_WINDOW * 3)) return;

      const parsed = strokeSchema.safeParse(rawPayload);
      if (!parsed.success) return;

      const current = roomManager.getRoomAndPlayerBySocket(socket.id);
      if (!current || current.room.code !== parsed.data.roomCode) return;

      drawGuessEngine.handleStroke(
        current.room,
        current.player.id,
        socket.id,
        parsed.data.stroke
      );
    });

    socket.on('draw:clear', (rawPayload) => {
      if (!checkRateLimit(socket)) return;

      const parsed = roomActionSchema.safeParse(rawPayload);
      if (!parsed.success) return;

      const current = roomManager.getRoomAndPlayerBySocket(socket.id);
      if (!current || current.room.code !== parsed.data.roomCode) return;

      drawGuessEngine.handleClear(current.room, current.player.id);
    });

    socket.on('guess:submit', (rawPayload) => {
      if (!checkRateLimit(socket)) return;

      const parsed = guessSchema.safeParse(rawPayload);
      if (!parsed.success) return;

      const current = roomManager.getRoomAndPlayerBySocket(socket.id);
      if (!current || current.room.code !== parsed.data.roomCode) return;

      drawGuessEngine.handleGuess(
        current.room,
        current.player.id,
        parsed.data.guess
      );
    });

    socket.on('disconnect', () => {
      rateLimits.delete(socket.id);
      const disconnected = roomManager.handleSocketDisconnect(
        socket.id,
        (updatedRoom, removedPlayer) => {
          if (updatedRoom) {
            io.to(updatedRoom.code).emit('player:left', {
              playerId: removedPlayer.id,
              nickname: removedPlayer.nickname,
            });
            io.to(updatedRoom.code).emit('room:state', {
              room: roomManager.toPublicState(updatedRoom),
            });
            drawGuessEngine.handlePlayerRemoved(updatedRoom, removedPlayer.id);
          }
        }
      );

      if (disconnected) {
        io.to(disconnected.room.code).emit('room:state', {
          room: roomManager.toPublicState(disconnected.room),
        });
      }
    });
  });

  return { io, roomManager };
}
