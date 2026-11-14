'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { SEAT_LAYOUT, type LobbySeatPlayer } from './lobbyConstants';
import { LowPolyAvatar } from './LowPolyAvatar';

interface LobbyRoomMeshProps {
  players: LobbySeatPlayer[];
  lowGraphicsMode: boolean;
}

export const LobbyRoomMesh: React.FC<LobbyRoomMeshProps> = ({
  players,
  lowGraphicsMode,
}) => {
  const materials = useMemo(() => {
    return {
      floor: new THREE.MeshStandardMaterial({ color: '#E8DFD1', roughness: 0.85, metalness: 0.02 }),
      wall: new THREE.MeshStandardMaterial({ color: '#F8FAFC', roughness: 0.92, metalness: 0.0 }),
      wallTrim: new THREE.MeshStandardMaterial({ color: '#CBD5E1', roughness: 0.75, metalness: 0.05 }),
      rugOuter: new THREE.MeshStandardMaterial({ color: '#2563EB', roughness: 0.9, metalness: 0.0 }),
      rugInner: new THREE.MeshStandardMaterial({ color: '#F59E0B', roughness: 0.9, metalness: 0.0 }),
      wood: new THREE.MeshStandardMaterial({ color: '#B48458', roughness: 0.65, metalness: 0.05 }),
      ceramic: new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.25, metalness: 0.1 }),
      plant: new THREE.MeshStandardMaterial({ color: '#059669', roughness: 0.72, metalness: 0.02, flatShading: true }),
      emptyCushion: new THREE.MeshStandardMaterial({ color: '#CBD5E1', roughness: 0.84, metalness: 0.02, flatShading: true }),
      windowSky: new THREE.MeshBasicMaterial({ color: '#DBEAFE' }),
      lampShade: new THREE.MeshStandardMaterial({
        color: '#F59E0B',
        emissive: '#F59E0B',
        emissiveIntensity: 0.22,
        roughness: 0.6,
      }),
      artCoral: new THREE.MeshStandardMaterial({ color: '#E11D48', roughness: 0.7, flatShading: true }),
      artCobalt: new THREE.MeshStandardMaterial({ color: '#1D4ED8', roughness: 0.7, flatShading: true }),
    };
  }, []);

  React.useEffect(() => {
    return () => {
      Object.values(materials).forEach((m) => m.dispose());
    };
  }, [materials]);

  return (
    <group>
      {/* Floor (y = 0) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow={!lowGraphicsMode}
        material={materials.floor}
      >
        <planeGeometry args={[11, 9.5]} />
      </mesh>

      {/* Back & Side Walls */}
      <mesh position={[0, 2.2, -3.7]} receiveShadow={!lowGraphicsMode} material={materials.wall}>
        <boxGeometry args={[11, 4.4, 0.2]} />
      </mesh>
      <mesh position={[-5.4, 2.2, 0]} material={materials.wall}>
        <boxGeometry args={[0.2, 4.4, 9.5]} />
      </mesh>
      <mesh position={[5.4, 2.2, 0]} material={materials.wall}>
        <boxGeometry args={[0.2, 4.4, 9.5]} />
      </mesh>

      {/* Baseboard trim */}
      <mesh position={[0, 0.1, -3.58]} material={materials.wallTrim}>
        <boxGeometry args={[10.8, 0.2, 0.06]} />
      </mesh>

      {/* Sunny Window on Left Wall */}
      <group position={[-5.26, 2.1, -0.8]}>
        <mesh material={materials.wood}>
          <boxGeometry args={[0.08, 2.3, 2.4]} />
        </mesh>
        <mesh position={[0.03, 0, 0]} material={materials.windowSky}>
          <boxGeometry args={[0.04, 2.0, 2.1]} />
        </mesh>
        <mesh position={[0.05, 0, 0]} material={materials.wood}>
          <boxGeometry args={[0.04, 2.0, 0.07]} />
        </mesh>
      </group>

      {/* Framed Geometric Wall Art */}
      <group position={[0, 2.35, -3.56]}>
        <mesh material={materials.wood}>
          <boxGeometry args={[2.1, 1.25, 0.08]} />
        </mesh>
        <mesh position={[-0.45, 0.15, 0.05]} material={materials.artCobalt}>
          <octahedronGeometry args={[0.32, 0]} />
        </mesh>
        <mesh position={[0.4, -0.1, 0.05]} material={materials.artCoral}>
          <dodecahedronGeometry args={[0.3, 0]} />
        </mesh>
        <mesh position={[0.02, 0.18, 0.05]} material={materials.rugInner}>
          <tetrahedronGeometry args={[0.24, 0]} />
        </mesh>
      </group>

      {/* Standing Tripod Floor Lamp (Back Right) */}
      <group position={[3.6, 0, -2.55]}>
        <mesh position={[0, 1.05, 0]} material={materials.wood}>
          <cylinderGeometry args={[0.035, 0.055, 2.1, 6]} />
        </mesh>
        <mesh position={[0, 0.04, 0]} material={materials.wood}>
          <cylinderGeometry args={[0.32, 0.36, 0.08, 6]} />
        </mesh>
        <mesh position={[0, 2.08, 0]} material={materials.lampShade}>
          <cylinderGeometry args={[0.22, 0.36, 0.42, 7]} />
        </mesh>
      </group>

      {/* Layered Geometric Rug (offset >= 0.02 to prevent Z-fighting) */}
      <mesh
        position={[0, 0.02, -0.35]}
        receiveShadow={!lowGraphicsMode}
        material={materials.rugOuter}
      >
        <cylinderGeometry args={[2.35, 2.35, 0.03, 24]} />
      </mesh>
      <mesh position={[0, 0.04, -0.35]} material={materials.rugInner}>
        <cylinderGeometry args={[1.55, 1.55, 0.02, 24]} />
      </mesh>

      {/* Central Hexagonal Party Table */}
      <group position={[0, 0, -0.35]}>
        <mesh position={[0, 0.44, 0]} castShadow={!lowGraphicsMode} receiveShadow={!lowGraphicsMode} material={materials.wood}>
          <cylinderGeometry args={[0.92, 0.86, 0.1, 6]} />
        </mesh>
        <mesh position={[0, 0.22, 0]} castShadow={!lowGraphicsMode} material={materials.wood}>
          <cylinderGeometry args={[0.24, 0.36, 0.42, 6]} />
        </mesh>

        {/* Centerpiece Ceramic Pot + Low-Poly Succulent */}
        <mesh position={[0, 0.56, 0]} material={materials.ceramic}>
          <cylinderGeometry args={[0.16, 0.12, 0.16, 7]} />
        </mesh>
        <mesh position={[0, 0.72, 0]} material={materials.plant}>
          <dodecahedronGeometry args={[0.14, 0]} />
        </mesh>

        {/* Mini Drawing Pad Prop on Table */}
        <mesh position={[0.36, 0.51, 0.2]} rotation={[0, -0.35, 0]} material={materials.artCobalt}>
          <boxGeometry args={[0.32, 0.04, 0.24]} />
        </mesh>
        <mesh position={[0.36, 0.535, 0.2]} rotation={[0, -0.35, 0]} material={materials.ceramic}>
          <boxGeometry args={[0.24, 0.02, 0.18]} />
        </mesh>
      </group>

      {/* 6 Lounge Seats + Seated Avatars */}
      {SEAT_LAYOUT.map((seat) => {
        const occupant = players[seat.index];
        return (
          <group
            key={seat.index}
            position={seat.position}
            rotation={[0, seat.rotationY, 0]}
          >
            {/* Seat Base & Cushion */}
            <mesh position={[0, 0.12, 0]} castShadow={!lowGraphicsMode} material={materials.wood}>
              <cylinderGeometry args={[0.42, 0.38, 0.24, 8]} />
            </mesh>
            <mesh
              position={[0, 0.29, 0]}
              castShadow={!lowGraphicsMode}
              receiveShadow={!lowGraphicsMode}
              material={occupant ? materials.ceramic : materials.emptyCushion}
            >
              <cylinderGeometry args={[0.44, 0.44, 0.14, 8]} />
            </mesh>
            {/* Low-poly backrest */}
            <mesh position={[0, 0.52, -0.36]} castShadow={!lowGraphicsMode} material={materials.wallTrim}>
              <boxGeometry args={[0.62, 0.38, 0.14]} />
            </mesh>

            {occupant && (
              <LowPolyAvatar
                player={occupant}
                seatIndex={seat.index}
                lowGraphicsMode={lowGraphicsMode}
              />
            )}
          </group>
        );
      })}
    </group>
  );
};
