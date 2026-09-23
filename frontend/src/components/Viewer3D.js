"use client";

import React, { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Grid, Html } from "@react-three/drei";
import ModelRenderer from "./ModelRenderer";

const BG_COLORS = {
  slate: "#1e2538",
  neutral: "#334155",
  light: "#e2e8f0",
  dark: "#0d111a",
};

function LoadingIndicator() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-black/80 backdrop-blur-md border border-cyan-500/30 text-white shadow-2xl">
        <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-cyan-300">Loading 3D Model...</span>
      </div>
    </Html>
  );
}

function LightingEnvironment({ preset = "studio", isLight = false }) {
  if (preset === "cyberpunk") {
    return (
      <>
        <ambientLight intensity={1.0} color="#0f172a" />
        <hemisphereLight skyColor="#00f2fe" groundColor="#ec4899" intensity={1.4} />
        <directionalLight position={[5, 7, 5]} intensity={3.5} color="#00f2fe" castShadow />
        <directionalLight position={[-5, 4, -4]} intensity={3.0} color="#ec4899" />
        <directionalLight position={[0, -3, 3]} intensity={1.5} color="#8b5cf6" />
        <pointLight position={[0, 2, 0]} intensity={2.0} color="#00f2fe" distance={8} />
      </>
    );
  }

  if (preset === "sunset") {
    return (
      <>
        <ambientLight intensity={0.9} color="#451a03" />
        <hemisphereLight skyColor="#fed7aa" groundColor="#1e293b" intensity={1.4} />
        <directionalLight position={[6, 5, 4]} intensity={3.8} color="#f59e0b" castShadow />
        <directionalLight position={[-5, 3, -3]} intensity={1.8} color="#60a5fa" />
        <directionalLight position={[0, -2, 3]} intensity={1.2} color="#fbbf24" />
      </>
    );
  }

  // Default: Studio high-visibility 4-point lighting
  return (
    <>
      <ambientLight intensity={1.4} color="#ffffff" />
      <hemisphereLight
        skyColor="#ffffff"
        groundColor={isLight ? "#94a3b8" : "#334155"}
        intensity={1.6}
      />
      {/* Key Light */}
      <directionalLight
        position={[5, 8, 5]}
        intensity={3.0}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0001}
      />
      {/* Fill Light */}
      <directionalLight
        position={[-6, 4, -4]}
        intensity={2.2}
        color={isLight ? "#cbd5e1" : "#93c5fd"}
      />
      {/* Rim / Backlight for sharp model outline */}
      <directionalLight position={[0, 6, -6]} intensity={2.6} color="#ffffff" />
      {/* Front Bounce */}
      <directionalLight position={[0, -2, 4]} intensity={1.4} color="#ffffff" />
    </>
  );
}

export default function Viewer3D({
  modelUrl,
  shadingMode = "pbr",
  lightingPreset = "studio",
  viewportBg = "slate",
  materialSettings,
  autoRotate = false,
  showGrid = true,
  showShadows = true,
}) {
  const activeBgHex = BG_COLORS[viewportBg] || BG_COLORS.slate;
  const isLight = viewportBg === "light";

  return (
    <div
      className="relative w-full h-full min-h-[480px] rounded-xl overflow-hidden select-none transition-colors duration-300"
      style={{ backgroundColor: activeBgHex }}
    >
      <Canvas
        shadows
        camera={{ position: [0, 1.4, 3.6], fov: 45 }}
        gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
      >
        {/* Set Three.js scene background color & subtle depth fog */}
        <color attach="background" args={[activeBgHex]} />
        <fog attach="fog" args={[activeBgHex, 8, 26]} />

        <LightingEnvironment preset={lightingPreset} isLight={isLight} />

        <Suspense fallback={<LoadingIndicator />}>
          <ModelRenderer
            modelUrl={modelUrl}
            shadingMode={shadingMode}
            materialSettings={materialSettings}
            autoRotate={autoRotate}
          />
        </Suspense>

        {showShadows && (
          <ContactShadows
            position={[0, -0.01, 0]}
            opacity={isLight ? 0.45 : 0.65}
            scale={6}
            blur={1.5}
            far={3}
            color={isLight ? "#475569" : "#000000"}
          />
        )}

        {showGrid && (
          <Grid
            position={[0, -0.02, 0]}
            args={[12, 12]}
            cellSize={0.25}
            cellThickness={0.8}
            cellColor={isLight ? "#94a3b8" : "#2d3748"}
            sectionSize={1.0}
            sectionThickness={1.4}
            sectionColor={isLight ? "#64748b" : "#4a5568"}
            fadeDistance={9}
            fadeStrength={1.5}
          />
        )}

        <OrbitControls
          makeDefault
          target={[0, 0.35, 0]}
          enableDamping
          dampingFactor={0.06}
          minDistance={0.8}
          maxDistance={8.0}
          maxPolarAngle={Math.PI / 2 + 0.1}
        />
      </Canvas>
    </div>
  );
}
