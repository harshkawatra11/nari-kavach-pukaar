"use client";

import { useMemo, useRef } from "react";
import type { RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshTransmissionMaterial } from "@react-three/drei";
import * as THREE from "three";
import { analyserRms, orbAudio } from "@/lib/audio/levels";
import { createOrbGeometry } from "./orb-geometry";

export function Orb({ reducedMotion, pointer }: { reducedMotion: boolean; pointer?: RefObject<{ x: number; y: number }> }) {
  const group = useRef<THREE.Group>(null);
  const volume = useRef<THREE.Mesh>(null);
  const volumeMaterial = useRef<THREE.ShaderMaterial>(null);
  const amplitude = useRef(0);
  const elapsed = useRef(0);
  const geometry = useMemo(() => createOrbGeometry(reducedMotion), [reducedMotion]);

  useFrame((_state, delta) => {
    if (!group.current) return;
    elapsed.current += delta;
    const analyser = orbAudio.phase === "speaking" ? orbAudio.ttsAnalyser : orbAudio.micAnalyser;
    const measured = analyser ? Math.min(1, analyserRms(analyser) * 3.2) : 0;
    const target = orbAudio.phase === "idle" ? 0.025 : measured;
    const smoothing = 1 - Math.exp(-delta * (target > amplitude.current ? 11 : 4.5));
    amplitude.current += (target - amplitude.current) * smoothing;
    const amp = amplitude.current;
    const px = pointer?.current.x ?? 0;
    const py = pointer?.current.y ?? 0;
    group.current.rotation.x += ((py * 0.18 + Math.sin(elapsed.current * 0.32) * 0.025) - group.current.rotation.x) * Math.min(1, delta * 4);
    group.current.rotation.y += ((-px * 0.24 + Math.sin(elapsed.current * 0.21) * 0.08) - group.current.rotation.y) * Math.min(1, delta * 4);
    group.current.rotation.z = Math.sin(elapsed.current * 0.27) * 0.018;
    group.current.scale.setScalar(1 + amp * 0.026);
    if (volume.current) volume.current.scale.setScalar(1 + amp * 0.035);
    if (volumeMaterial.current) {
      volumeMaterial.current.uniforms.uTime.value = elapsed.current;
      volumeMaterial.current.uniforms.uAmplitude.value = amp;
    }
  });

  return (
    <group ref={group}>
      <mesh geometry={geometry} renderOrder={2}>
        <MeshTransmissionMaterial color="#fffaff" transmission={1} roughness={0.06} ior={1.48} thickness={1.05} backside backsideThickness={0.42} samples={reducedMotion ? 2 : 6} resolution={reducedMotion ? 128 : 256} chromaticAberration={0.035} anisotropicBlur={0.08} distortion={0.025} distortionScale={0.22} temporalDistortion={reducedMotion ? 0 : 0.012} attenuationColor="#f3b8df" attenuationDistance={2.6} envMapIntensity={1.3} clearcoat={1} clearcoatRoughness={0.04} />
      </mesh>
      <mesh ref={volume} scale={0.78} renderOrder={0}>
        <sphereGeometry args={[1, 64, 64]} />
        <shaderMaterial
          ref={volumeMaterial}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={{ uTime: { value: 0 }, uAmplitude: { value: 0 } }}
          vertexShader={`varying vec3 vNormal; varying vec3 vPosition; varying vec3 vView; void main(){ vNormal=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.0); vPosition=position; vView=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`}
          fragmentShader={`uniform float uTime; uniform float uAmplitude; varying vec3 vNormal; varying vec3 vPosition; varying vec3 vView; void main(){ float drift=sin(vPosition.x*2.4+uTime*.32)*.07; float blend=smoothstep(-.62,.62,vPosition.y+drift); vec3 cyan=vec3(.18,.72,1.0); vec3 pink=vec3(1.0,.18,.64); vec3 col=mix(cyan,pink,blend); float fresnel=pow(1.0-max(dot(normalize(vNormal),normalize(vView)),0.0),2.4); float core=.13+uAmplitude*.1; float alpha=core*(.72+fresnel*.6); gl_FragColor=vec4(col*(.72+fresnel*.5),alpha); }`}
        />
      </mesh>
      <mesh position={[-0.48, 0.45, 0.78]} scale={[0.11, 0.42, 0.07]} rotation={[0.2, 0.25, -0.45]} renderOrder={3}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.48} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh position={[0.42, -0.54, 0.7]} scale={[0.22, 0.08, 0.06]} rotation={[0, 0, 0.2]} renderOrder={3}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.46} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}
