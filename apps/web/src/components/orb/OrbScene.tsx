"use client";

import type { RefObject } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { Orb } from "./Orb";
import { ORB_CAMERA } from "./orb-scene-config";

/** The R3F canvas. DPR capped at 1.75. A real MeshPhysicalMaterial glass
 *  shell (see Orb.tsx) needs an actual PMREM environment to refract and
 *  reflect. Hand-placed Lightformers create the long, curved pink, cyan and
 *  white reflections seen in a controlled product-photography studio.
 *  Postprocessing bloom was tried via @react-three/postprocessing and
 *  dropped: EffectComposer in this version stack composites its final pass
 *  without preserving destination alpha, which reliably filled the whole
 *  canvas as an opaque square and hid the AuroraField behind it (verified by
 *  toggling the composer on and off). The soft glow around the orb comes
 *  from a CSS blur behind the canvas instead (see OrbStage.tsx). */
export function OrbScene({
  reducedMotion,
  pointer,
  onReady,
}: {
  reducedMotion: boolean;
  pointer?: RefObject<{ x: number; y: number }>;
  onReady?: () => void;
}) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, ORB_CAMERA.distance], fov: ORB_CAMERA.fov }}
      onCreated={() => onReady?.()}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.1,
      }}
      style={{ position: "absolute", inset: 0, background: "transparent" }}
    >
      <ambientLight intensity={0.22} />
      <Orb reducedMotion={reducedMotion} pointer={pointer} />
      {!reducedMotion && (
        <>
          {/* The reflection: a soft contact shadow beneath the orb, matching
              the glossy-sphere-over-a-plane look from the reference image. */}
          {/* scale kept small and close (far=1.2): a wide shadow-catcher
              plane (scale 6 was tried first) extended far enough into the
              perspective frustum that its own quad edge became visible as a
              dark wedge clipping the canvas corners. */}
          <ContactShadows position={[0, -1.14, 0]} opacity={0.2} scale={2.3} blur={2.8} far={0.7} color="#ff6fcf" />
          {/* background={false}: without it drei renders the HDRI itself as
              the scene background, filling the whole canvas as an opaque
              square. This should only ever contribute lighting/reflections
              and refraction content for the glass shell's transmission. */}
          <Environment resolution={256} background={false} environmentIntensity={1}>
            <Lightformer form="rect" intensity={4.5} color="#ffffff" position={[-3.2, 2.1, 3]} rotation={[0, 0.45, 0.18]} scale={[1.1, 3.8, 1]} />
            <Lightformer form="rect" intensity={2.8} color="#ff9add" position={[3.4, 0.9, 2]} rotation={[0, -0.65, -0.12]} scale={[0.7, 2.8, 1]} />
            <Lightformer form="rect" intensity={2.4} color="#88ecff" position={[-1.8, -3, 1.5]} rotation={[0.35, 0.15, 0]} scale={[2.4, 0.55, 1]} />
            <Lightformer form="ring" intensity={1.25} color="#b987ff" position={[0, 0, -4]} scale={5} />
          </Environment>
        </>
      )}
    </Canvas>
  );
}
