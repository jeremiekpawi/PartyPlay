'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { OrbitControls } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { Box } from 'lucide-react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { detectSoftwareWebGL, type LobbySeatPlayer } from './lobbyConstants';
import { LobbyRoomMesh } from './LobbyRoomMesh';

interface Lobby3DSceneProps {
  players: LobbySeatPlayer[];
  lowGraphicsMode: boolean;
  cameraResetKey?: number;
}

const StudioEnvironmentAndFog: React.FC = () => {
  const { gl, scene } = useThree();

  useEffect(() => {
    const pmremGenerator = new THREE.PMREMGenerator(gl);
    const envTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envTarget.texture;
    scene.background = new THREE.Color('#F1F5F9');
    scene.fog = new THREE.Fog('#F1F5F9', 9, 19);
    pmremGenerator.dispose();

    return () => {
      scene.environment = null;
      envTarget.dispose();
    };
  }, [gl, scene]);

  return null;
};

export const Lobby3DScene: React.FC<Lobby3DSceneProps> = ({
  players,
  lowGraphicsMode,
  cameraResetKey = 0,
}) => {
  const isSoftwareGl = useMemo(() => detectSoftwareWebGL(), []);
  const [contextLost, setContextLost] = useState(false);

  const reducedQuality = lowGraphicsMode || isSoftwareGl;

  if (contextLost) {
    return (
      <div className="flex h-full min-h-[340px] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-slate-100 p-6 text-center">
        <Box className="h-10 w-10 text-blue-600" />
        <p className="text-base font-bold text-slate-900">Rendu 3D temporairement indisponible</p>
        <p className="max-w-sm text-sm text-slate-600">
          Le contexte WebGL a été suspendu par l’appareil. Activez le mode graphique réduit ou
          rechargez la vue.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-[360px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
      <Canvas
        key={cameraResetKey}
        shadows={!reducedQuality}
        dpr={reducedQuality ? [1, 1] : [1, 1.5]}
        camera={{ position: [0, 3.6, 5.8], fov: 44, near: 0.1, far: 40 }}
        gl={{
          antialias: !reducedQuality,
          powerPreference: reducedQuality ? 'low-power' : 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
        }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          const canvasEl = gl.domElement;
          canvasEl.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            setContextLost(true);
          });
          canvasEl.addEventListener('webglcontextrestored', () => {
            setContextLost(false);
          });
        }}
      >
        <StudioEnvironmentAndFog />

        {/* Warm Key Light + Cool Hemisphere Fill (<= 2 dynamic lights) */}
        <hemisphereLight args={['#EFF6FF', '#E2E8F0', 0.85]} />
        <directionalLight
          position={[4.5, 7, 5]}
          intensity={1.35}
          color="#FFF7ED"
          castShadow={!reducedQuality}
          shadow-mapSize-width={512}
          shadow-mapSize-height={512}
          shadow-camera-near={1}
          shadow-camera-far={20}
          shadow-camera-left={-5}
          shadow-camera-right={5}
          shadow-camera-top={5}
          shadow-camera-bottom={-5}
          shadow-bias={-0.0005}
        />

        <LobbyRoomMesh players={players} lowGraphicsMode={reducedQuality} />

        <OrbitControls
          target={[0, 0.75, -0.5]}
          enablePan={false}
          enableDamping={!isSoftwareGl}
          dampingFactor={0.08}
          minDistance={4.0}
          maxDistance={8.4}
          minPolarAngle={0.48}
          maxPolarAngle={1.22}
          minAzimuthAngle={-0.85}
          maxAzimuthAngle={0.85}
        />
      </Canvas>
    </div>
  );
};
