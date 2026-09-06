"use client";

import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment } from "@react-three/drei";
import * as THREE from "three";
import { Orb } from "./Orb";

/** The R3F canvas. DPR capped at 1.75. A real MeshPhysicalMaterial glass
 *  shell (see Orb.tsx) needs an actual PMREM environment to refract and
 *  reflect, which is what makes it read as glass rather than a flat tinted
 *  sphere; "studio" is drei's softest built-in preset, closer to the soft
 *  even lighting a physical glass render actually wants than an outdoor HDRI.
 *  Postprocessing bloom was tried via @react-three/postprocessing and
 *  dropped: EffectComposer in this version stack composites its final pass
 *  without preserving destination alpha, which reliably filled the whole
 *  canvas as an opaque square and hid the AuroraField behind it (verified by
 *  toggling the composer on and off). The soft glow around the orb comes
 *  from a CSS blur behind the canvas instead (see OrbStage.tsx). */
export function OrbScene({ reducedMotion, orbScale = 1 }: { reducedMotion: boolean; orbScale?: number }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 3.6], fov: 32 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.1,
      }}
      style={{ position: "absolute", inset: 0, background: "transparent" }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 2]} intensity={0.9} />
      <directionalLight position={[-3, -1, 2]} intensity={0.4} color="#7C4FE0" />
      <Orb reducedMotion={reducedMotion} scale={orbScale} />
      {!reducedMotion && (
        <>
          {/* The reflection: a soft contact shadow beneath the orb, matching
              the glossy-sphere-over-a-plane look from the reference image. */}
          {/* scale kept small and close (far=1.2): a wide shadow-catcher
              plane (scale 6 was tried first) extended far enough into the
              perspective frustum that its own quad edge became visible as a
              dark wedge clipping the canvas corners. */}
          <ContactShadows position={[0, -1.9, 0]} opacity={0.25} scale={3.2} blur={2.8} far={1.2} color="#ff6fcf" />
          {/* background={false}: without it drei renders the HDRI itself as
              the scene background, filling the whole canvas as an opaque
              square. This should only ever contribute lighting/reflections
              and refraction content for the glass shell's transmission. */}
          <Environment preset="studio" environmentIntensity={1} background={false} />
        </>
      )}
    </Canvas>
  );
}
