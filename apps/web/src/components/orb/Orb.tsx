"use client";

/* eslint-disable react-hooks/immutability --
 * react-three-fiber's canonical pattern, documented in r3f's own docs, is to
 * mutate refs and shader uniforms directly inside useFrame every frame:
 * calling setState there would trigger a React re-render at 60fps, which is
 * the actual bug this rule exists to prevent in ordinary components. The
 * eslint-config-next 16 React Compiler rules do not yet have an exemption
 * for Canvas-scoped imperative code, so this is a deliberate, scoped
 * exception for that ecosystem-level gap, not a suppressed real warning.
 */

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { orbFragmentShader, orbVertexShader } from "./orbShader";
import { analyserRms, orbAudio } from "@/lib/audio/levels";

// The shader's colour palette, as sRGB hex. See orbShader.ts for why colour
// is a spatial gradient across the surface rather than a temporal or purely
// physical (iridescence) effect: two other approaches were tried against the
// reference image and both failed for angle- or content-dependent reasons
// documented there.
export const ORB_PALETTE = {
  rose: "#E5399E", // --magenta
  plum: "#5C1A4B", // --plum
  gold: "#E8B33C", // --gold
  lilac: "#C9A6DA", // a lighter tint of --plum-tint, for a third simultaneous hue
} as const;

const PHASE_TILT: Record<string, number> = {
  // Rotates which hue leads by nudging rotation.y directly, since the colour
  // ramp is anchored to fixed object-space directions; spinning the mesh is
  // what sweeps a different hue toward the camera per phase.
  idle: 0,
  listening: -0.6,
  thinking: 1.4,
  speaking: 2.6,
};

export function Orb({ reducedMotion }: { reducedMotion: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const smoothedAmp = useRef(0);
  const lastAlarmSeen = useRef(0);
  const shockTween = useRef<gsap.core.Timeline | null>(null);
  const baseRotation = useRef({ value: 0 });

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAmplitude: { value: 0 },
      uShock: { value: 0 },
      uColorRose: { value: new THREE.Color(ORB_PALETTE.rose) },
      uColorPlum: { value: new THREE.Color(ORB_PALETTE.plum) },
      uColorGold: { value: new THREE.Color(ORB_PALETTE.gold) },
      uColorLilac: { value: new THREE.Color(ORB_PALETTE.lilac) },
    }),
    [],
  );

  useEffect(() => {
    let raf: number;
    let lastPhase = orbAudio.phase;
    const poll = () => {
      if (orbAudio.phase !== lastPhase) {
        lastPhase = orbAudio.phase;
        gsap.to(baseRotation.current, { value: PHASE_TILT[lastPhase] ?? 0, duration: 1.2, ease: "power3.out" });
      }
      raf = requestAnimationFrame(poll);
    };
    raf = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(raf);
  }, []);

  useFrame((_state, delta) => {
    if (!materialRef.current || !meshRef.current) return;
    uniforms.uTime.value += delta;

    const analyser = orbAudio.phase === "speaking" ? orbAudio.ttsAnalyser : orbAudio.micAnalyser;
    const target = analyser ? analyserRms(analyser) : 0;
    const rate = target > smoothedAmp.current ? 0.35 : 0.08;
    smoothedAmp.current += (target - smoothedAmp.current) * rate;
    uniforms.uAmplitude.value = smoothedAmp.current;

    if (orbAudio.phase === "idle") {
      uniforms.uAmplitude.value = 0.04 + Math.sin(uniforms.uTime.value * 0.6) * 0.015;
    }

    if (orbAudio.lastAlarmAt !== lastAlarmSeen.current) {
      lastAlarmSeen.current = orbAudio.lastAlarmAt;
      shockTween.current?.kill();
      uniforms.uShock.value = 0;
      shockTween.current = gsap
        .timeline()
        .to(uniforms.uShock, { value: 1, duration: 0.12, ease: "power4.out" })
        .to(uniforms.uShock, { value: 0, duration: 0.78, ease: "power2.out" });
    }

    meshRef.current.rotation.y = baseRotation.current.value + uniforms.uTime.value * 0.045;
    meshRef.current.rotation.x = Math.sin(uniforms.uTime.value * 0.15) * 0.08;
  });

  if (reducedMotion) {
    return (
      <mesh>
        <sphereGeometry args={[1.4, 48, 48]} />
        <meshStandardMaterial color={ORB_PALETTE.rose} roughness={0.25} metalness={0.15} />
      </mesh>
    );
  }

  return (
    <mesh ref={meshRef}>
      {/* detail 5 = 10,242 vertices: smooth enough that the noise displacement
          reads as fluid glass rather than faceted geometry, cheap enough for
          a GPU vertex shader at 60fps. */}
      <icosahedronGeometry args={[1.4, 5]} />
      {/* toneMapped=false: the renderer's ACES filmic tone mapping (set in
          OrbScene for the physically-lit ContactShadows/Environment) applies
          to every material by default, including a raw ShaderMaterial, and
          would desaturate these hand-tuned colours through its filmic
          curve. This material owns its own output exposure directly in
          orbFragmentShader instead. */}
      {/* side: DoubleSide + depthWrite: false: with only front faces
          rendered, a transparent sphere just blends its lit hemisphere over
          the background, which reads as a solid ball with soft edges, not
          glass. Rendering back faces too, without writing depth, lets the
          far interior surface show through the near one. */}
      <shaderMaterial
        ref={materialRef}
        vertexShader={orbVertexShader}
        fragmentShader={orbFragmentShader}
        uniforms={uniforms}
        transparent
        toneMapped={false}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
