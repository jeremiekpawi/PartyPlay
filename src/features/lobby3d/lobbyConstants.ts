export interface LobbySeatPlayer {
  id: string;
  nickname: string;
  avatarId: string;
  colorHex: string;
  isHost: boolean;
  isLocal?: boolean;
  isConnected?: boolean;
}

export interface SeatTransform {
  index: number;
  position: [number, number, number];
  rotationY: number;
}

/**
 * 6 seats arranged in a welcoming arc facing the central hexagonal table,
 * leaving the front camera corridor unobstructed.
 */
export const SEAT_LAYOUT: readonly SeatTransform[] = [
  { index: 0, position: [-2.35, 0, 0.95], rotationY: Math.PI * 0.62 },
  { index: 1, position: [-1.75, 0, -1.25], rotationY: Math.PI * 0.28 },
  { index: 2, position: [-0.6, 0, -2.15], rotationY: Math.PI * 0.08 },
  { index: 3, position: [0.6, 0, -2.15], rotationY: -Math.PI * 0.08 },
  { index: 4, position: [1.75, 0, -1.25], rotationY: -Math.PI * 0.28 },
  { index: 5, position: [2.35, 0, 0.95], rotationY: -Math.PI * 0.62 },
] as const;

export function detectSoftwareWebGL(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
}
