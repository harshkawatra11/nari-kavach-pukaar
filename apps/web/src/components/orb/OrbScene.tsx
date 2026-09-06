"use client";

import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment } from "@react-three/drei";
import * as THREE from "three";
import { Orb } from "./Orb";

/** The R3F canvas. DPR capped at 1.75. Bloom/chromatic aberration were tried
 *  via @react-three/postprocessing and dropped: EffectComposer in this
 *  version stack composites its final pass without preserving destination
 *  alpha, which reliably filled the whole canvas as an opaque square and
 *  hid the AuroraField behind it (verified by toggling the composer on and
 *  off). The glassy/bloom read comes from the shader's own fresnel and
 *  specular terms plus a CSS glow behind the canvas (see OrbStage.tsx)
 *  instead, which is cheaper and does not fight canvas transparency at all. */
export function OrbScene({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 4.2], fov: 40 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
      style={{ position: "absolute", inset: 0, background: "transparent" }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 4, 2]} intensity={0.7} />
      <directionalLight position={[-3, -1, 2]} intensity={0.3} color="#5C1A4B" />
      <Orb reducedMotion={reducedMotion} />
      {!reducedMotion && (
        <>
          {/* The reflection: a soft contact shadow beneath the orb, matching
              the glossy-sphere-over-a-plane look from the reference image. */}
          <ContactShadows position={[0, -1.7, 0]} opacity={0.3} scale={6} blur={2.6} far={2.2} color="#5c1a4b" />
          {/* background={false}: without it drei renders the HDRI itself as
              the scene background, filling the whole canvas as an opaque
              square. This should only ever contribute lighting/reflections. */}
          <Environment preset="city" environmentIntensity={0.35} background={false} />
        </>
      )}
    </Canvas>
  );
}
