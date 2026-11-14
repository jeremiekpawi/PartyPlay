import { z } from 'zod';
import {
  AVATAR_COLORS,
  AVATAR_PRESETS,
  INVITE_CODE_LENGTH,
  PLAYER_NAME_MAX_LENGTH,
  PLAYER_NAME_MIN_LENGTH,
} from './constants.ts';
import type {
  DrawStrokeSegment,
  GuessResultPayload,
  PublicPlayer,
  PublicRoomState,
  RoomErrorPayload,
  ScoreEntry,
} from './types.ts';

const VALID_AVATAR_IDS = AVATAR_PRESETS.map((a) => a.id);
const VALID_COLOR_HEXES = AVATAR_COLORS.map((c) => c.hex);

export const playerIdentitySchema = z.object({
  sessionToken: z.string().trim().min(8).max(128),
  nickname: z
    .string()
    .trim()
    .min(PLAYER_NAME_MIN_LENGTH)
    .max(PLAYER_NAME_MAX_LENGTH),
  avatarId: z
    .string()
    .refine((val) => VALID_AVATAR_IDS.includes(val), 'Avatar invalide'),
  colorHex: z
    .string()
    .refine((val) => VALID_COLOR_HEXES.includes(val), 'Couleur invalide'),
});

export const createRoomSchema = z.object({
  player: playerIdentitySchema,
});

export const joinRoomSchema = z.object({
  roomCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(new RegExp(`^[A-Z0-9]{${INVITE_CODE_LENGTH}}$`)),
  player: playerIdentitySchema,
});

export const reconnectSchema = z.object({
  roomCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(new RegExp(`^[A-Z0-9]{${INVITE_CODE_LENGTH}}$`)),
  sessionToken: z.string().trim().min(8).max(128),
});

export const roomActionSchema = z.object({
  roomCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(new RegExp(`^[A-Z0-9]{${INVITE_CODE_LENGTH}}$`)),
});

export const strokeSchema = z.object({
  roomCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(new RegExp(`^[A-Z0-9]{${INVITE_CODE_LENGTH}}$`)),
  stroke: z.object({
    x0: z.number().min(0).max(1),
    y0: z.number().min(0).max(1),
    x1: z.number().min(0).max(1),
    y1: z.number().min(0).max(1),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    size: z.number().min(1).max(32),
    tool: z.enum(['pen', 'eraser']),
  }),
});

export const guessSchema = z.object({
  roomCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(new RegExp(`^[A-Z0-9]{${INVITE_CODE_LENGTH}}$`)),
  guess: z.string().trim().min(1).max(40),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type JoinRoomInput = z.infer<typeof joinRoomSchema>;
export type ReconnectInput = z.infer<typeof reconnectSchema>;
export type RoomActionInput = z.infer<typeof roomActionSchema>;
export type StrokeInput = z.infer<typeof strokeSchema>;
export type GuessInput = z.infer<typeof guessSchema>;

export interface ClientToServerEvents {
  'room:create': (payload: CreateRoomInput) => void;
  'room:join': (payload: JoinRoomInput) => void;
  'room:leave': (payload: RoomActionInput) => void;
  'game:start': (payload: RoomActionInput) => void;
  'draw:stroke': (payload: StrokeInput) => void;
  'draw:clear': (payload: RoomActionInput) => void;
  'guess:submit': (payload: GuessInput) => void;
  'player:reconnect': (payload: ReconnectInput) => void;
}

export interface ServerToClientEvents {
  'room:created': (payload: { room: PublicRoomState; selfPlayerId: string }) => void;
  'room:joined': (payload: { room: PublicRoomState; selfPlayerId: string }) => void;
  'room:state': (payload: { room: PublicRoomState }) => void;
  'room:error': (payload: RoomErrorPayload) => void;
  'player:joined': (payload: { player: PublicPlayer }) => void;
  'player:left': (payload: { playerId: string; nickname: string }) => void;
  'game:started': (payload: { room: PublicRoomState }) => void;
  'turn:begin': (payload: {
    roundNumber: number;
    totalRounds: number;
    drawerPlayerId: string;
    drawerNickname: string;
    wordLength: number;
    wordMask: string;
    secondsRemaining: number;
    secretWord?: string;
  }) => void;
  'draw:sync': (payload: { stroke: DrawStrokeSegment }) => void;
  'draw:cleared': () => void;
  'guess:result': (payload: GuessResultPayload) => void;
  'score:update': (payload: { leaderboard: ScoreEntry[]; revealedWord?: string }) => void;
  'timer:update': (payload: { secondsRemaining: number }) => void;
  'game:end': (payload: { leaderboard: ScoreEntry[] }) => void;
}
