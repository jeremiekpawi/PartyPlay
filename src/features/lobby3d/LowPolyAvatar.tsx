'use client';

import React, { useMemo, useRef } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { LobbySeatPlayer } from './lobbyConstants';

interface LowPolyAvatarProps {
  player: LobbySeatPlayer;
  seatIndex: number;
  lowGraphicsMode: boolean;
}

export const LowPolyAvatar: React.FC<LowPolyAvatarProps> = ({
  player,
  seatIndex,
  lowGraphicsMode,
}) => {
  const rootRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);

  const phaseOffset = seatIndex * 1.15;
  const isConnected = player.isConnected !== false;

  const { primaryMat, accentMat, skinMat, eyeMat, crownMat } = useMemo(() => {
    const baseColor = new THREE.Color(isConnected ? player.colorHex : '#94A3B8');
    return {
      primaryMat: new THREE.MeshStandardMaterial({
        color: baseColor,
        roughness: 0.72,
        metalness: 0.05,
        flatShading: true,
      }),
      accentMat: new THREE.MeshStandardMaterial({
        color: '#F8FAFC',
        roughness: 0.52,
        metalness: 0.08,
        flatShading: true,
      }),
      skinMat: new THREE.MeshStandardMaterial({
        color: '#FFFFFF',
        roughness: 0.62,
        metalness: 0.04,
        flatShading: true,
      }),
      eyeMat: new THREE.MeshStandardMaterial({
        color: '#0F172A',
        roughness: 0.25,
        metalness: 0.1,
      }),
      crownMat: new THREE.MeshStandardMaterial({
        color: '#F59E0B',
        roughness: 0.28,
        metalness: 0.65,
        flatShading: true,
      }),
    };
  }, [player.colorHex, isConnected]);

  React.useEffect(() => {
    return () => {
      primaryMat.dispose();
      accentMat.dispose();
      skinMat.dispose();
      eyeMat.dispose();
      crownMat.dispose();
    };
  }, [primaryMat, accentMat, skinMat, eyeMat, crownMat]);

  useFrame((state) => {
    if (lowGraphicsMode) return;
    const t = state.clock.elapsedTime + phaseOffset;
    if (rootRef.current) {
      rootRef.current.position.y = 0.42 + Math.sin(t * 2.1) * 0.025;
    }
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 1.1) * 0.11;
      headRef.current.rotation.z = Math.cos(t * 1.4) * 0.03;
    }
    if (leftArmRef.current && rightArmRef.current) {
      leftArmRef.current.rotation.x = Math.sin(t * 2.1) * 0.08 - 0.22;
      rightArmRef.current.rotation.x = -Math.sin(t * 2.1) * 0.08 - 0.22;
    }
  });

  return (
    <group ref={rootRef} position={[0, 0.42, 0]}>
      {/* Torso */}
      <mesh position={[0, 0.28, 0]} castShadow={!lowGraphicsMode} material={primaryMat}>
        <cylinderGeometry args={[0.21, 0.27, 0.46, 6]} />
      </mesh>

      {/* Collar trim */}
      <mesh position={[0, 0.5, 0]} material={accentMat}>
        <cylinderGeometry args={[0.17, 0.22, 0.08, 6]} />
      </mesh>

      {/* Left & Right Arms */}
      <mesh
        ref={leftArmRef}
        position={[-0.27, 0.28, 0.04]}
        rotation={[-0.22, 0, 0.18]}
        castShadow={!lowGraphicsMode}
        material={primaryMat}
      >
        <capsuleGeometry args={[0.065, 0.2, 4, 6]} />
      </mesh>
      <mesh
        ref={rightArmRef}
        position={[0.27, 0.28, 0.04]}
        rotation={[-0.22, 0, -0.18]}
        castShadow={!lowGraphicsMode}
        material={primaryMat}
      >
        <capsuleGeometry args={[0.065, 0.2, 4, 6]} />
      </mesh>

      {/* Composite Head Group */}
      <group ref={headRef} position={[0, 0.72, 0]}>
        {/* Main head silhouette */}
        <mesh castShadow={!lowGraphicsMode} material={skinMat}>
          {player.avatarId === 'tiki' ? (
            <boxGeometry args={[0.38, 0.36, 0.36]} />
          ) : player.avatarId === 'nebula' ? (
            <icosahedronGeometry args={[0.23, 1]} />
          ) : (
            <dodecahedronGeometry args={[0.23, 0]} />
          )}
        </mesh>

        {/* Preset-specific headgear / crest */}
        {player.avatarId === 'kora' && (
          <mesh position={[0, 0.16, -0.02]} material={primaryMat}>
            <cylinderGeometry args={[0.21, 0.24, 0.1, 6]} />
          </mesh>
        )}
        {player.avatarId === 'zephyr' && (
          <mesh position={[0, 0.24, 0.02]} rotation={[0.2, 0, 0]} material={crownMat}>
            <coneGeometry args={[0.11, 0.22, 5]} />
          </mesh>
        )}
        {player.avatarId === 'tiki' && (
          <>
            <mesh position={[-0.14, 0.22, 0]} rotation={[0, 0, 0.25]} material={primaryMat}>
              <coneGeometry args={[0.08, 0.16, 4]} />
            </mesh>
            <mesh position={[0.14, 0.22, 0]} rotation={[0, 0, -0.25]} material={primaryMat}>
              <coneGeometry args={[0.08, 0.16, 4]} />
            </mesh>
          </>
        )}
        {player.avatarId === 'nebula' && (
          <mesh position={[0, 0.06, 0.14]} material={primaryMat}>
            <boxGeometry args={[0.36, 0.08, 0.18]} />
          </mesh>
        )}
        {player.avatarId === 'mango' && (
          <mesh position={[0, 0.25, 0]} material={crownMat}>
            <octahedronGeometry args={[0.09, 0]} />
          </mesh>
        )}
        {player.avatarId === 'baya' && (
          <mesh position={[0, 0.1, -0.04]} material={primaryMat}>
            <sphereGeometry args={[0.24, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
          </mesh>
        )}

        {/* Eyes */}
        <mesh position={[-0.08, 0.01, 0.2]} material={eyeMat}>
          <sphereGeometry args={[0.032, 8, 8]} />
        </mesh>
        <mesh position={[0.08, 0.01, 0.2]} material={eyeMat}>
          <sphereGeometry args={[0.032, 8, 8]} />
        </mesh>

        {/* Host Golden Crown */}
        {player.isHost && (
          <mesh position={[0, 0.34, 0]} material={crownMat}>
            <cylinderGeometry args={[0.11, 0.08, 0.1, 5]} />
          </mesh>
        )}

        {/* Clean DOM Nameplate (solid surface, zero backdrop-blur over WebGL) */}
        <Html position={[0, player.isHost ? 0.56 : 0.44, 0]} center distanceFactor={8}>
          <div
            className={`pointer-events-none select-none rounded-lg border px-2.5 py-1 text-center shadow-sm whitespace-nowrap ${
              player.isLocal
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-slate-200 bg-white text-slate-900'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-bold leading-none">
              {player.isHost && (
                <span className={player.isLocal ? 'text-amber-300' : 'text-amber-600'}>★</span>
              )}
              <span>{player.nickname}</span>
            </div>
            {!isConnected && (
              <div className="mt-0.5 text-[10px] font-medium text-amber-600">Reconnexion…</div>
            )}
          </div>
        </Html>
      </group>
    </group>
  );
};
