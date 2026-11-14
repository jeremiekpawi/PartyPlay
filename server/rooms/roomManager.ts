import crypto from 'node:crypto';
import {
  INVITE_CODE_ALPHABET,
  INVITE_CODE_LENGTH,
  RECONNECT_GRACE_MS,
  ROOM_INACTIVITY_TTL_MS,
  ROOM_MAX_PLAYERS,
  ROOM_MIN_PLAYERS,
} from '../../src/shared/constants.ts';
import type {
  PublicPlayer,
  PublicRoomState,
  RoomErrorPayload,
  RoomPhase,
} from '../../src/shared/types.ts';

export interface ServerPlayer {
  id: string;
  sessionToken: string;
  socketId: string;
  nickname: string;
  avatarId: string;
  colorHex: string;
  score: number;
  isHost: boolean;
  isConnected: boolean;
  seatIndex: number;
  disconnectTimer: ReturnType<typeof setTimeout> | null;
}

export interface ServerRoom {
  code: string;
  phase: RoomPhase;
  hostPlayerId: string;
  players: ServerPlayer[];
  createdAt: number;
  lastActivityAt: number;
  onCleanup?: () => void;
}

export interface RoomActionError {
  ok: false;
  error: RoomErrorPayload;
}

export interface RoomJoinSuccess {
  ok: true;
  room: ServerRoom;
  player: ServerPlayer;
  reconnected: boolean;
}

export class RoomManager {
  private rooms = new Map<string, ServerRoom>();
  private socketToRoom = new Map<string, { roomCode: string; playerId: string }>();
  private metrics = {
    roomsCreated: 0,
    gamesStarted: 0,
    gamesEnded: 0,
  };
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor() {
    this.cleanupInterval = setInterval(() => {
      this.sweepInactiveRooms();
    }, 60_000);
    this.cleanupInterval.unref();
  }

  private generateInviteCode(): string {
    for (let attempt = 0; attempt < 25; attempt++) {
      let code = '';
      const bytes = crypto.randomBytes(INVITE_CODE_LENGTH);
      for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
        code += INVITE_CODE_ALPHABET[bytes[i] % INVITE_CODE_ALPHABET.length];
      }
      if (!this.rooms.has(code)) {
        return code;
      }
    }
    throw new Error('Impossible de générer un code de salle unique.');
  }

  private allocateSeatIndex(room: ServerRoom): number {
    const taken = new Set(room.players.map((p) => p.seatIndex));
    for (let i = 0; i < ROOM_MAX_PLAYERS; i++) {
      if (!taken.has(i)) return i;
    }
    return room.players.length;
  }

  public toPublicState(room: ServerRoom): PublicRoomState {
    const players: PublicPlayer[] = [...room.players]
      .sort((a, b) => a.seatIndex - b.seatIndex)
      .map((p) => ({
        id: p.id,
        nickname: p.nickname,
        avatarId: p.avatarId,
        colorHex: p.colorHex,
        score: p.score,
        isHost: p.isHost,
        isConnected: p.isConnected,
        seatIndex: p.seatIndex,
      }));

    return {
      code: room.code,
      phase: room.phase,
      hostPlayerId: room.hostPlayerId,
      players,
      minPlayers: ROOM_MIN_PLAYERS,
      maxPlayers: ROOM_MAX_PLAYERS,
      round: null,
    };
  }

  public createRoom(
    socketId: string,
    identity: {
      sessionToken: string;
      nickname: string;
      avatarId: string;
      colorHex: string;
    }
  ): RoomJoinSuccess {
    // Ensure a socket cleanly leaves any previous room before creating a new one
    const prev = this.socketToRoom.get(socketId);
    if (prev) {
      this.leaveRoomImmediately(socketId);
    }

    const code = this.generateInviteCode();
    const playerId = crypto.randomUUID();
    const now = Date.now();

    const hostPlayer: ServerPlayer = {
      id: playerId,
      sessionToken: identity.sessionToken,
      socketId,
      nickname: identity.nickname,
      avatarId: identity.avatarId,
      colorHex: identity.colorHex,
      score: 0,
      isHost: true,
      isConnected: true,
      seatIndex: 0,
      disconnectTimer: null,
    };

    const room: ServerRoom = {
      code,
      phase: 'lobby',
      hostPlayerId: playerId,
      players: [hostPlayer],
      createdAt: now,
      lastActivityAt: now,
    };

    this.rooms.set(code, room);
    this.socketToRoom.set(socketId, { roomCode: code, playerId });
    this.metrics.roomsCreated += 1;

    return { ok: true, room, player: hostPlayer, reconnected: false };
  }

  public joinRoom(
    socketId: string,
    roomCode: string,
    identity: {
      sessionToken: string;
      nickname: string;
      avatarId: string;
      colorHex: string;
    }
  ): RoomJoinSuccess | RoomActionError {
    const normalizedCode = roomCode.trim().toUpperCase();
    const room = this.rooms.get(normalizedCode);
    if (!room) {
      return {
        ok: false,
        error: {
          code: 'ROOM_NOT_FOUND',
          message: 'Aucune salle trouvée avec ce code d’invitation.',
        },
      };
    }

    room.lastActivityAt = Date.now();

    // Check if this player is reconnecting with an existing sessionToken
    const existing = room.players.find((p) => p.sessionToken === identity.sessionToken);
    if (existing) {
      if (existing.disconnectTimer) {
        clearTimeout(existing.disconnectTimer);
        existing.disconnectTimer = null;
      }
      if (existing.socketId !== socketId) {
        this.socketToRoom.delete(existing.socketId);
      }
      existing.socketId = socketId;
      existing.nickname = identity.nickname;
      existing.avatarId = identity.avatarId;
      existing.colorHex = identity.colorHex;
      existing.isConnected = true;
      this.socketToRoom.set(socketId, { roomCode: room.code, playerId: existing.id });
      return { ok: true, room, player: existing, reconnected: true };
    }

    if (room.phase !== 'lobby') {
      return {
        ok: false,
        error: {
          code: 'GAME_ALREADY_STARTED',
          message: 'Une partie est déjà en cours dans cette salle.',
        },
      };
    }

    if (room.players.length >= ROOM_MAX_PLAYERS) {
      return {
        ok: false,
        error: {
          code: 'ROOM_FULL',
          message: `Cette salle est complète (${ROOM_MAX_PLAYERS} joueurs maximum).`,
        },
      };
    }

    const prev = this.socketToRoom.get(socketId);
    if (prev && prev.roomCode !== normalizedCode) {
      this.leaveRoomImmediately(socketId);
    }

    const player: ServerPlayer = {
      id: crypto.randomUUID(),
      sessionToken: identity.sessionToken,
      socketId,
      nickname: identity.nickname,
      avatarId: identity.avatarId,
      colorHex: identity.colorHex,
      score: 0,
      isHost: false,
      isConnected: true,
      seatIndex: this.allocateSeatIndex(room),
      disconnectTimer: null,
    };

    room.players.push(player);
    this.socketToRoom.set(socketId, { roomCode: room.code, playerId: player.id });
    return { ok: true, room, player, reconnected: false };
  }

  public reconnectPlayer(
    socketId: string,
    roomCode: string,
    sessionToken: string
  ): RoomJoinSuccess | RoomActionError {
    const normalizedCode = roomCode.trim().toUpperCase();
    const room = this.rooms.get(normalizedCode);
    if (!room) {
      return {
        ok: false,
        error: {
          code: 'ROOM_NOT_FOUND',
          message: 'Cette salle a expiré ou n’existe plus.',
        },
      };
    }

    const existing = room.players.find((p) => p.sessionToken === sessionToken);
    if (!existing) {
      return {
        ok: false,
        error: {
          code: 'ROOM_NOT_FOUND',
          message: 'Votre session n’est plus présente dans cette salle.',
        },
      };
    }

    if (existing.disconnectTimer) {
      clearTimeout(existing.disconnectTimer);
      existing.disconnectTimer = null;
    }
    if (existing.socketId !== socketId) {
      this.socketToRoom.delete(existing.socketId);
    }

    existing.socketId = socketId;
    existing.isConnected = true;
    room.lastActivityAt = Date.now();
    this.socketToRoom.set(socketId, { roomCode: room.code, playerId: existing.id });

    return { ok: true, room, player: existing, reconnected: true };
  }

  public getRoomAndPlayerBySocket(
    socketId: string
  ): { room: ServerRoom; player: ServerPlayer } | null {
    const link = this.socketToRoom.get(socketId);
    if (!link) return null;
    const room = this.rooms.get(link.roomCode);
    if (!room) {
      this.socketToRoom.delete(socketId);
      return null;
    }
    const player = room.players.find((p) => p.id === link.playerId);
    if (!player) {
      this.socketToRoom.delete(socketId);
      return null;
    }
    return { room, player };
  }

  public getRoom(roomCode: string): ServerRoom | undefined {
    return this.rooms.get(roomCode.trim().toUpperCase());
  }

  public leaveRoomImmediately(
    socketId: string
  ): { room: ServerRoom | null; removedPlayer: ServerPlayer | null } {
    const found = this.getRoomAndPlayerBySocket(socketId);
    if (!found) {
      this.socketToRoom.delete(socketId);
      return { room: null, removedPlayer: null };
    }

    const { room, player } = found;
    this.socketToRoom.delete(socketId);
    return this.removePlayerFromRoom(room.code, player.id);
  }

  public handleSocketDisconnect(
    socketId: string,
    onGraceExpired: (room: ServerRoom | null, removedPlayer: ServerPlayer) => void
  ): { room: ServerRoom; player: ServerPlayer } | null {
    const found = this.getRoomAndPlayerBySocket(socketId);
    if (!found) return null;

    const { room, player } = found;
    this.socketToRoom.delete(socketId);
    player.isConnected = false;
    room.lastActivityAt = Date.now();

    if (player.disconnectTimer) {
      clearTimeout(player.disconnectTimer);
    }

    player.disconnectTimer = setTimeout(() => {
      player.disconnectTimer = null;
      const result = this.removePlayerFromRoom(room.code, player.id);
      if (result.removedPlayer) {
        onGraceExpired(result.room, result.removedPlayer);
      }
    }, RECONNECT_GRACE_MS);

    return { room, player };
  }

  private removePlayerFromRoom(
    roomCode: string,
    playerId: string
  ): { room: ServerRoom | null; removedPlayer: ServerPlayer | null } {
    const room = this.rooms.get(roomCode);
    if (!room) return { room: null, removedPlayer: null };

    const index = room.players.findIndex((p) => p.id === playerId);
    if (index === -1) return { room, removedPlayer: null };

    const [removed] = room.players.splice(index, 1);
    if (removed.disconnectTimer) {
      clearTimeout(removed.disconnectTimer);
      removed.disconnectTimer = null;
    }
    this.socketToRoom.delete(removed.socketId);

    if (room.players.length === 0) {
      room.onCleanup?.();
      this.rooms.delete(roomCode);
      return { room: null, removedPlayer: removed };
    }

    if (removed.isHost) {
      const nextHost = room.players.find((p) => p.isConnected) ?? room.players[0];
      room.players.forEach((p) => {
        p.isHost = p.id === nextHost.id;
      });
      room.hostPlayerId = nextHost.id;
    }

    room.lastActivityAt = Date.now();
    return { room, removedPlayer: removed };
  }

  public recordGameStarted() {
    this.metrics.gamesStarted += 1;
  }

  public recordGameEnded() {
    this.metrics.gamesEnded += 1;
  }

  public getHealthStats() {
    return {
      activeRooms: this.rooms.size,
      roomsCreated: this.metrics.roomsCreated,
      gamesStarted: this.metrics.gamesStarted,
      gamesEnded: this.metrics.gamesEnded,
    };
  }

  private sweepInactiveRooms() {
    const cutoff = Date.now() - ROOM_INACTIVITY_TTL_MS;
    for (const [code, room] of this.rooms.entries()) {
      if (room.lastActivityAt < cutoff) {
        room.players.forEach((p) => {
          if (p.disconnectTimer) clearTimeout(p.disconnectTimer);
          this.socketToRoom.delete(p.socketId);
        });
        room.onCleanup?.();
        this.rooms.delete(code);
      }
    }
  }
}
