"use client";

import { useRef } from "react";
import type { RefObject } from "react";
import { useFrame } from "@react-three/fiber";
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
// MeshPhysicalMaterial shell with real transmission, IOR and clearcoat,
// sitting in a proper PMREM studio environment (see OrbScene.tsx) so it has
// something to refract and reflect, plus separate additive-blended internal
// spheres for the pink/cyan volumetric colour and the white specular
// highlights, layered as genuinely separate objects rather than baked into
// one shader.
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
  const pinkGlowRef = useRef<THREE.Mesh>(null);
  const cyanGlowRef = useRef<THREE.Mesh>(null);
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

    const pinkMat = pinkGlowRef.current?.material as THREE.MeshBasicMaterial | undefined;
    const cyanMat = cyanGlowRef.current?.material as THREE.MeshBasicMaterial | undefined;
    if (pinkMat) pinkMat.opacity = 0.48 + amp * 0.24;
    if (cyanMat) cyanMat.opacity = 0.36 + amp * 0.2;

    if (orbAudio.lastAlarmAt !== lastAlarmSeen.current) {
      lastAlarmSeen.current = orbAudio.lastAlarmAt;
      gsap.fromTo(
        groupRef.current.scale,
        { x: scale * 1.35, y: scale * 1.35, z: scale * 1.35 },
        { x: scale, y: scale, z: scale, duration: 0.7, ease: "elastic.out(1, 0.55)" },
      );
      if (pinkMat) gsap.fromTo(pinkMat, { opacity: 0.95 }, { opacity: 0.48 + amp * 0.24, duration: 0.7, ease: "power2.out" });
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
      {/* Explicit renderOrder throughout, not left to three.js's default
          transparent-object distance sort: the glow spheres are nested
          geometrically INSIDE the shell's radius, and the shell's transmission
          material writes depth by default, which was silently occluding them
          entirely (they never showed up despite being correctly coloured and
          positioned). Depth is off for every layer here and order is
          explicit: glow first, shell second, highlights last. */}

      {/* Internal volume, pink lead (upper). Additive + depthWrite false so
          it reads as coloured light inside the glass, not a solid fill. */}
      <mesh ref={pinkGlowRef} rotation={[0.08, 0.12, -0.08]} scale={[1, 0.94, 1]} renderOrder={0}>
        <torusGeometry args={[1.03, 0.13, 32, 160]} />
        <meshBasicMaterial color={ORB_PALETTE.pink} transparent opacity={0.42} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>

      {/* Internal volume, cyan lead (lower), the second hue that makes the
          gradient read as glass rather than a flat tint. */}
      <mesh ref={cyanGlowRef} rotation={[-0.06, -0.1, 0.1]} scale={[0.91, 0.97, 0.91]} renderOrder={0}>
        <torusGeometry args={[1.03, 0.07, 28, 160]} />
        <meshBasicMaterial color={ORB_PALETTE.cyan} transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>

      {/* The glass shell, drawn after the internal colour so it does not
          depth-occlude it. transmission is the load-bearing property:
          without it this is just a translucent ball, not refractive glass.
          Needs a real PMREM environment to have anything to refract/reflect,
          see OrbScene.tsx's <Environment preset="studio">. */}
      <mesh renderOrder={1}>
        <sphereGeometry args={shellArgs} />
        <meshPhysicalMaterial
          color="#21051f"
          transparent
          opacity={0.32}
          depthWrite={false}
          transmission={0.62}
          roughness={0.1}
          metalness={0}
          ior={1.48}
          thickness={0.7}
          attenuationColor="#35002f"
          attenuationDistance={1.1}
          envMapIntensity={0.4}
          clearcoat={1}
          clearcoatRoughness={0.04}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Two large soft specular highlights, flattened ellipsoids rather
          than the shell's own single specular point: this is one of the
          most load-bearing details in the reference image and is easy to
          under-build. */}
      {/* A very subtle outer glow, standing in for postprocessing bloom:
          @react-three/postprocessing's EffectComposer was tried earlier and
          dropped because it composites without preserving canvas alpha in
          this version stack, filling the whole canvas opaque. This is
          deliberately faint per the "glass should be sharp, only the light
          around it should bloom" principle. */}
      <mesh scale={1.12} renderOrder={3}>
        <sphereGeometry args={shellArgs} />
        <meshBasicMaterial color={ORB_PALETTE.pink} transparent opacity={0.05} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}
