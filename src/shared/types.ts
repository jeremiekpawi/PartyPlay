export type LocaleCode = 'fr';

export interface GuestProfile {
  sessionToken: string;
  nickname: string;
  avatarId: string;
  colorHex: string;
  lowGraphicsMode: boolean;
}

export type AppRoute = 'home' | 'play' | 'lobby-preview' | 'room';
export type PlayTab = 'create' | 'join';

export type RoomPhase = 'lobby' | 'playing' | 'ended';

export interface PublicPlayer {
  id: string;
  nickname: string;
  avatarId: string;
  colorHex: string;
  score: number;
  isHost: boolean;
  isConnected: boolean;
  seatIndex: number;
  hasGuessedCurrentRound?: boolean;
}

export interface DrawStrokeSegment {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  color: string;
  size: number;
  tool: 'pen' | 'eraser';
}

export interface RoundPublicInfo {
  roundNumber: number;
  totalRounds: number;
  drawerPlayerId: string;
  drawerNickname: string;
  wordLength: number;
  wordMask: string;
  secondsRemaining: number;
}

export interface PublicRoomState {
  code: string;
  phase: RoomPhase;
  hostPlayerId: string;
  players: PublicPlayer[];
  minPlayers: number;
  maxPlayers: number;
  round: RoundPublicInfo | null;
}

export interface RoomErrorPayload {
  code:
    | 'ROOM_NOT_FOUND'
    | 'ROOM_FULL'
    | 'GAME_ALREADY_STARTED'
    | 'INVALID_PAYLOAD'
    | 'NOT_HOST'
    | 'NOT_ENOUGH_PLAYERS'
    | 'RATE_LIMITED'
    | 'FORBIDDEN'
    | 'GAME_NOT_READY';
  message: string;
}

export interface GuessResultPayload {
  playerId: string;
  nickname: string;
  correct: boolean;
  pointsAwarded?: number;
  guessPreview?: string;
}

export interface ScoreEntry {
  playerId: string;
  nickname: string;
  avatarId: string;
  colorHex: string;
  score: number;
  rank: number;
}
