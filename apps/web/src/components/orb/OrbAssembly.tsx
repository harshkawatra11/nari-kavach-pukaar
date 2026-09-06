"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { motion } from "framer-motion";
import * as THREE from "three";
import gsap from "gsap";

type FragmentSeed = {
  start: THREE.Vector3;
  end: THREE.Vector3;
  rotation: THREE.Euler;
  color: string;
  delay: number;
};

function seeded(index: number, salt: number) {
  return ((Math.sin(index * 91.73 + salt * 37.17) + 1) / 2);
}

function Assembly({ onComplete }: { onComplete: () => void }) {
  const group = useRef<THREE.Group>(null);
  const progress = useRef({ value: 0 });
  const finished = useRef(false);
  const seeds = useMemo<FragmentSeed[]>(() => {
    return Array.from({ length: 24 }, (_, index) => {
      const angle = (index / 24) * Math.PI * 2;
      const latitude = ((index % 4) - 1.5) * 0.48;
      const radius = Math.sqrt(Math.max(0.1, 1 - latitude * latitude));
      const end = new THREE.Vector3(Math.cos(angle) * radius, latitude, Math.sin(angle) * radius).multiplyScalar(1.22);
      const start = new THREE.Vector3(
        (seeded(index, 1) - 0.5) * 10,
        (seeded(index, 2) - 0.5) * 6,
        (seeded(index, 3) - 0.5) * 5 - 1,
      );
      return {
        start,
        end,
        rotation: new THREE.Euler(seeded(index, 4) * Math.PI, seeded(index, 5) * Math.PI, seeded(index, 6) * Math.PI),
        color: index % 3 === 0 ? "#65eaff" : index % 2 === 0 ? "#f6d9ff" : "#ff6fcf",
        delay: seeded(index, 7) * 0.22,
      };
    });
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(progress.current, {
        value: 1,
        duration: 1.85,
        delay: 0.15,
        ease: "power3.inOut",
        onComplete: () => {
          if (!finished.current) {
            finished.current = true;
            onComplete();
          }
        },
      });
    });
    const fallback = window.setTimeout(() => {
      if (!finished.current) {
        finished.current = true;
        onComplete();
      }
    }, 3000);
    return () => {
      window.clearTimeout(fallback);
      ctx.revert();
    };
  }, [onComplete]);

  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.09;
    group.current.children.forEach((child, index) => {
      const seed = seeds[index];
      const local = THREE.MathUtils.clamp((progress.current.value - seed.delay) / (1 - seed.delay), 0, 1);
      const eased = 1 - Math.pow(1 - local, 4);
      child.position.lerpVectors(seed.start, seed.end, eased);
      child.rotation.x = THREE.MathUtils.lerp(seed.rotation.x, seed.end.y * 0.3, eased);
      child.rotation.y = THREE.MathUtils.lerp(seed.rotation.y, Math.atan2(seed.end.x, seed.end.z), eased);
      child.rotation.z = THREE.MathUtils.lerp(seed.rotation.z, 0, eased);
      const material = (child as THREE.Mesh).material as THREE.MeshPhysicalMaterial;
      material.opacity = THREE.MathUtils.lerp(0.05, local > 0.86 ? 0.12 : 0.48, eased);
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2.2 + index) * 0.025 * (1 - eased);
      child.scale.setScalar(pulse);
    });
  });

  return (
    <group ref={group}>
      {seeds.map((seed, index) => (
        <mesh key={index} position={seed.start} rotation={seed.rotation}>
          <sphereGeometry args={[1.23, 16, 8, (index % 6) * (Math.PI / 3), Math.PI / 3.6, Math.floor(index / 6) * (Math.PI / 4), Math.PI / 4.5]} />
          <meshPhysicalMaterial
            color={seed.color}
            transparent
            opacity={0.05}
            transmission={0.72}
            roughness={0.16}
            metalness={0}
            ior={1.4}
            thickness={0.45}
            clearcoat={1}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

export function OrbAssembly({ onComplete, onSkip }: { onComplete: () => void; onSkip: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-ground"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
      aria-label="Pukaar is assembling"
    >
      <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 5.1], fov: 42 }} gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}>
        <ambientLight intensity={0.55} />
        <directionalLight position={[3, 4, 3]} intensity={1.2} />
        <directionalLight position={[-3, -2, 2]} intensity={0.45} color="#65eaff" />
        <Assembly onComplete={onComplete} />
        <Environment preset="studio" background={false} />
      </Canvas>
      <button
        type="button"
        onClick={onSkip}
        className="absolute bottom-7 right-7 rounded-[var(--radius-sm)] border border-hairline bg-surface-1/80 px-3 py-2 text-[length:var(--text-xs)] text-ink-faint backdrop-blur-md transition-colors hover:text-ink focus-visible:text-ink"
      >
        Skip animation
      </button>
    </motion.div>
  );
}
