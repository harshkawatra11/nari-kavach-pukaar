"use client";

import { useRef } from "react";
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

export function Orb({ reducedMotion, scale: baseScale = 1 }: { reducedMotion: boolean; scale?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const pinkGlowRef = useRef<THREE.Mesh>(null);
  const cyanGlowRef = useRef<THREE.Mesh>(null);
  const smoothedAmp = useRef(0);
  const lastAlarmSeen = useRef(0);
  const clock = useRef(0);

  useFrame((_state, delta) => {
    if (!groupRef.current) return;
    clock.current += delta;

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
    groupRef.current.rotation.y += delta * 0.09;

    const pinkMat = pinkGlowRef.current?.material as THREE.MeshBasicMaterial | undefined;
    const cyanMat = cyanGlowRef.current?.material as THREE.MeshBasicMaterial | undefined;
    if (pinkMat) pinkMat.opacity = 0.18 + amp * 0.22;
    if (cyanMat) cyanMat.opacity = 0.12 + amp * 0.18;

    if (orbAudio.lastAlarmAt !== lastAlarmSeen.current) {
      lastAlarmSeen.current = orbAudio.lastAlarmAt;
      gsap.fromTo(
        groupRef.current.scale,
        { x: scale * 1.35, y: scale * 1.35, z: scale * 1.35 },
        { x: scale, y: scale, z: scale, duration: 0.7, ease: "elastic.out(1, 0.55)" },
      );
      if (pinkMat) gsap.fromTo(pinkMat, { opacity: 0.9 }, { opacity: 0.18 + amp * 0.22, duration: 0.7, ease: "power2.out" });
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
      <mesh ref={pinkGlowRef} position={[0, 0.4, 0]} renderOrder={0}>
        <sphereGeometry args={[1.15, 48, 48]} />
        <meshBasicMaterial color={ORB_PALETTE.pink} transparent opacity={0.18} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Internal volume, cyan lead (lower), the second hue that makes the
          gradient read as glass rather than a flat tint. */}
      <mesh ref={cyanGlowRef} position={[0, -0.45, 0]} renderOrder={0}>
        <sphereGeometry args={[0.95, 48, 48]} />
        <meshBasicMaterial color={ORB_PALETTE.cyan} transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* The glass shell, drawn after the internal colour so it does not
          depth-occlude it. transmission is the load-bearing property:
          without it this is just a translucent ball, not refractive glass.
          Needs a real PMREM environment to have anything to refract/reflect,
          see OrbScene.tsx's <Environment preset="studio">. */}
      <mesh renderOrder={1}>
        <sphereGeometry args={shellArgs} />
        <meshPhysicalMaterial
          color="#ffffff"
          transmission={1}
          transparent
          depthWrite={false}
          roughness={0.08}
          metalness={0}
          ior={1.45}
          thickness={1.2}
          envMapIntensity={1.5}
          attenuationColor={ORB_PALETTE.tint}
          attenuationDistance={2.5}
          clearcoat={1}
          clearcoatRoughness={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Two large soft specular highlights, flattened ellipsoids rather
          than the shell's own single specular point: this is one of the
          most load-bearing details in the reference image and is easy to
          under-build. */}
      <mesh position={[-0.65, 0.65, 1.1]} scale={[0.25, 1.5, 0.15]} renderOrder={2}>
        <sphereGeometry args={[0.3, 24, 24]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.45} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh position={[0.5, -0.5, 1.0]} scale={[0.18, 0.9, 0.12]} renderOrder={2}>
        <sphereGeometry args={[0.25, 24, 24]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.32} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

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
