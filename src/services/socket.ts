'use client';

import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '../shared/events';

const ACTIVE_ROOM_KEY = 'partyplay_active_room_v1';

let socketInstance: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export function getSocketUrl(): string | undefined {
  const configured = process.env.NEXT_PUBLIC_SOCKET_URL?.trim();
  return configured ? configured : undefined;
}

export function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (!socketInstance) {
    const targetUrl = getSocketUrl();
    socketInstance = io(targetUrl, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 4000,
      transports: ['websocket', 'polling'],
    });
  }
  return socketInstance;
}

export function ensureSocketConnected(): Socket<ServerToClientEvents, ClientToServerEvents> {
  const socket = getSocket();
  if (!socket.connected) {
    socket.connect();
  }
  return socket;
}

export function saveActiveRoomCode(roomCode: string) {
  try {
    window.sessionStorage.setItem(ACTIVE_ROOM_KEY, roomCode.toUpperCase());
  } catch {
    // Ignore storage errors
  }
}

export function readActiveRoomCode(): string | null {
  try {
    return window.sessionStorage.getItem(ACTIVE_ROOM_KEY);
  } catch {
    return null;
  }
}

export function clearActiveRoomCode() {
  try {
    window.sessionStorage.removeItem(ACTIVE_ROOM_KEY);
  } catch {
    // Ignore storage errors
  }
}
