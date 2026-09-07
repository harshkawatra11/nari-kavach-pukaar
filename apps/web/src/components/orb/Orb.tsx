"use client";

import { useRef } from "react";
import type { RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshTransmissionMaterial } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { analyserRms, orbAudio } from "@/lib/audio/levels";

// A real glass object, not a gradient pretending to be one. Three approaches
// were tried and abandoned before this: a flat colour-ramp ShaderMaterial
// (looked painted, not glass), MeshPhysicalMaterial's built-in iridescence
// alone (only reads colour at grazing angles, flat grey head-on), and a
// hand-rolled fresnel-driven rim shader with a two-pass back/front render
// (fixed the "solid ball" problem but still read as emissive neon, not
// refractive glass, because none of these ever gave the renderer anything
// physically-based to refract). This version is the actual recipe: a
// transmissive physical shell with real IOR, thickness and clearcoat,
// sitting in a controlled PMREM light-card environment (see OrbScene.tsx)
// so it has something deliberate to refract and reflect. Colour comes from
// those studio cards, not luminous rings trapped inside the geometry.
export const ORB_PALETTE = {
  pink: "#ff6fcf",
  cyan: "#65eaff",
  tint: "#f6d9ff", // the glass shell's own attenuation tint
} as const;

export function Orb({
  reducedMotion,
  scale: baseScale = 1,
  pointer,
}: {
  reducedMotion: boolean;
  scale?: number;
  /** Normalized pointer position (-0.5..0.5 on each axis, 0 at rest), read
   *  live each frame rather than passed as re-rendering props. Drives a
   *  small real rotation of the group so the glass shell actually shows a
   *  different angle of refraction/highlight as the cursor moves - genuine
   *  parallax on the geometry itself, not a CSS tilt of the flat canvas
   *  image (which was tried first and looked like tilting a photograph). */
  pointer?: RefObject<{ x: number; y: number }>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const smoothedAmp = useRef(0);
  const lastAlarmSeen = useRef(0);
  const clock = useRef(0);
  const tilt = useRef({ x: 0, z: 0 });

  useFrame((_state, delta) => {
    if (!groupRef.current) return;
    clock.current += delta;

    if (pointer) {
      const targetX = pointer.current.y * 0.3;
      const targetZ = -pointer.current.x * 0.3;
      tilt.current.x += (targetX - tilt.current.x) * Math.min(1, delta * 5);
      tilt.current.z += (targetZ - tilt.current.z) * Math.min(1, delta * 5);
      groupRef.current.rotation.x = tilt.current.x;
      groupRef.current.rotation.z = tilt.current.z;
    }

    const analyser = orbAudio.phase === "speaking" ? orbAudio.ttsAnalyser : orbAudio.micAnalyser;
    const target = analyser ? analyserRms(analyser) : 0;
    const rate = target > smoothedAmp.current ? 0.35 : 0.08;
    smoothedAmp.current += (target - smoothedAmp.current) * rate;
    let amp = smoothedAmp.current;
    if (orbAudio.phase === "idle") {
      amp = 0.05 + Math.sin(clock.current * 0.6) * 0.02;
    }

    // Voice reactivity as a gentle uniform scale pulse, not per-vertex
    // displacement: the glass shell's transmission render is already the
    // most expensive part of this scene, and a subtle breathe reads clearly
    // enough as "alive" without adding a per-frame geometry rewrite on top
    // of it.
    const scale = (1 + amp * 0.16) * baseScale;
    groupRef.current.scale.setScalar(scale);
    // Keep the internal light rings mostly facing the viewer. Unbounded spin
    // turned them edge-on for long stretches, making the orb look like a
    // flat coin inside a bubble. A slow limited yaw preserves parallax while
    // retaining the circular voice-assistant silhouette.
    groupRef.current.rotation.y = Math.sin(clock.current * 0.24) * 0.12;

    if (orbAudio.lastAlarmAt !== lastAlarmSeen.current) {
      lastAlarmSeen.current = orbAudio.lastAlarmAt;
      gsap.fromTo(
        groupRef.current.scale,
        { x: scale * 1.35, y: scale * 1.35, z: scale * 1.35 },
        { x: scale, y: scale, z: scale, duration: 0.7, ease: "elastic.out(1, 0.55)" },
      );
    }
  });

  const shellArgs: [number, number, number] = [1.5, 96, 96];

  if (reducedMotion) {
    return (
      <mesh scale={baseScale}>
        <sphereGeometry args={shellArgs} />
        <meshStandardMaterial color={ORB_PALETTE.pink} roughness={0.25} metalness={0.1} />
      </mesh>
    );
  }

  return (
    <group ref={groupRef}>
      {/* Transmission is the load-bearing property. MeshTransmissionMaterial
          captures and bends the scene behind the shell, including separate
          front and back faces, which gives the silhouette genuine depth. */}
      <mesh renderOrder={1}>
        <sphereGeometry args={shellArgs} />
        <MeshTransmissionMaterial
          color="#fff5fd"
          transmission={1}
          roughness={0.035}
          ior={1.47}
          thickness={0.8}
          backside
          backsideThickness={0.55}
          samples={6}
          resolution={256}
          chromaticAberration={0.075}
          anisotropicBlur={0.08}
          distortion={0.055}
          distortionScale={0.55}
          temporalDistortion={0.025}
          attenuationColor="#ef9edd"
          attenuationDistance={2.8}
          envMapIntensity={1.1}
          clearcoat={1}
          clearcoatRoughness={0.025}
        />
      </mesh>

      {/* A very subtle outer glow, standing in for postprocessing bloom:
          @react-three/postprocessing's EffectComposer was tried earlier and
          dropped because it composites without preserving canvas alpha in
          this version stack, filling the whole canvas opaque. This is
          deliberately faint per the "glass should be sharp, only the light
          around it should bloom" principle. */}
      <mesh scale={1.045} renderOrder={3}>
        <sphereGeometry args={shellArgs} />
        <meshBasicMaterial color={ORB_PALETTE.pink} transparent opacity={0.025} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}
