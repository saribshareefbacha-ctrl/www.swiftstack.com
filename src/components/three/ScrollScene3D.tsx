import React, { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { ThemeCMS } from '../../types/cms';

interface ScrollSceneProps {
  theme: ThemeCMS;
}

interface SceneInnerProps {
  theme: ThemeCMS;
  scrollRef: React.MutableRefObject<number>;
}

const FloatingPolyhedraField: React.FC<SceneInnerProps> = ({ theme, scrollRef }) => {
  const groupRef = useRef<THREE.Group>(null);
  const coreGroupRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const keyLightRef = useRef<THREE.PointLight>(null);
  const rimLightRef = useRef<THREE.PointLight>(null);

  const colorPrimary = useMemo(() => new THREE.Color(theme.primaryAccent), [theme.primaryAccent]);
  const colorSecondary = useMemo(
    () => new THREE.Color(theme.secondaryAccent),
    [theme.secondaryAccent]
  );
  const colorTertiary = useMemo(
    () => new THREE.Color(theme.tertiaryAccent),
    [theme.tertiaryAccent]
  );
  const workColorA = useMemo(() => new THREE.Color(), []);
  const workColorB = useMemo(() => new THREE.Color(), []);

  const items = useMemo(() => {
    const count = Math.max(4, Math.min(36, Math.round(theme.floatingShapeCount)));
    return Array.from({ length: count }, (_, idx) => {
      const angle = (idx / count) * Math.PI * 2;
      const radius = 3.2 + (idx % 4) * 1.45;
      const ySpread = ((idx * 7) % 13) - 6;
      const zDepth = -2.5 - (idx % 5) * 1.5;
      return {
        id: idx,
        position: [
          Math.cos(angle) * radius,
          ySpread * 0.68,
          zDepth,
        ] as [number, number, number],
        scale: 0.16 + (idx % 4) * 0.09,
        rotSpeedX: 0.18 + (idx % 5) * 0.07,
        rotSpeedY: 0.22 + (idx % 3) * 0.09,
        kind: idx % 3,
        wireframe: idx % 2 === 0,
      };
    });
  }, [theme.floatingShapeCount]);

  useFrame((state, delta) => {
    const s = scrollRef.current; // 0 .. 1 smooth scroll progress
    const morph = theme.scrollMorphIntensity;
    const t = state.clock.elapsedTime;

    // Smoothly morph scene lighting colors across scroll zones
    if (s < 0.5) {
      workColorA.copy(colorPrimary).lerp(colorSecondary, s * 2);
      workColorB.copy(colorSecondary).lerp(colorTertiary, s * 2);
    } else {
      workColorA.copy(colorSecondary).lerp(colorTertiary, (s - 0.5) * 2);
      workColorB.copy(colorTertiary).lerp(colorPrimary, (s - 0.5) * 2);
    }

    if (keyLightRef.current) {
      keyLightRef.current.color.copy(workColorA);
      keyLightRef.current.intensity = (2.2 + Math.sin(t * 1.2) * 0.35) * theme.ambientGlowIntensity;
      keyLightRef.current.position.x = Math.sin(s * Math.PI * 2) * 5;
      keyLightRef.current.position.y = 3 - s * 4;
    }

    if (rimLightRef.current) {
      rimLightRef.current.color.copy(workColorB);
      rimLightRef.current.intensity = 2.4 * theme.ambientGlowIntensity;
      rimLightRef.current.position.x = -Math.cos(s * Math.PI * 2) * 5;
    }

    if (groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        s * Math.PI * 1.35 * morph + t * 0.035,
        delta * 2.5
      );
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        s * 3.1 * morph,
        delta * 2.8
      );
    }

    if (coreGroupRef.current) {
      const targetX = Math.sin(s * Math.PI * 2) * 2.1 * morph;
      const targetY = Math.cos(s * Math.PI * 1.5) * 0.85 * morph;
      const targetScale = 1 + Math.sin(s * Math.PI) * 0.32 * morph;
      coreGroupRef.current.position.x = THREE.MathUtils.lerp(
        coreGroupRef.current.position.x,
        targetX,
        delta * 2.4
      );
      coreGroupRef.current.position.y = THREE.MathUtils.lerp(
        coreGroupRef.current.position.y,
        targetY,
        delta * 2.4
      );
      coreGroupRef.current.scale.setScalar(
        THREE.MathUtils.lerp(coreGroupRef.current.scale.x, targetScale, delta * 2.4)
      );
      coreGroupRef.current.rotation.y += delta * (0.16 + s * 0.45);
      coreGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        coreGroupRef.current.rotation.x,
        s * 1.2,
        delta * 2.2
      );
    }

    if (ring1Ref.current) {
      ring1Ref.current.rotation.z += delta * 0.22;
      ring1Ref.current.rotation.x = 1.1 + s * 1.4 * morph;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y -= delta * 0.26;
      ring2Ref.current.rotation.z = -0.7 + s * 1.6 * morph;
    }
  });

  return (
    <>
      <ambientLight intensity={0.35} />
      <pointLight ref={keyLightRef} position={[4, 3, 2]} intensity={2.2} distance={24} />
      <pointLight ref={rimLightRef} position={[-5, -2, 1]} intensity={2.2} distance={24} />

      {/* Central Scroll-Morphing Spatial Core */}
      <group ref={coreGroupRef} position={[0, 0, -6.5]}>
        <mesh>
          <icosahedronGeometry args={[1.65, 3]} />
          <MeshDistortMaterial
            color={theme.primaryAccent}
            emissive={theme.secondaryAccent}
            emissiveIntensity={0.28}
            roughness={0.2}
            metalness={0.85}
            distort={theme.meshDistortion}
            speed={2.1}
            wireframe
            transparent
            opacity={0.32}
          />
        </mesh>

        <mesh scale={0.78}>
          <sphereGeometry args={[1.25, 32, 32]} />
          <MeshDistortMaterial
            color={theme.tertiaryAccent}
            roughness={0.15}
            metalness={0.9}
            distort={theme.meshDistortion * 0.85}
            speed={1.6}
            transparent
            opacity={0.14}
          />
        </mesh>

        <mesh ref={ring1Ref}>
          <torusGeometry args={[2.55, 0.018, 16, 100]} />
          <meshBasicMaterial color={theme.primaryAccent} transparent opacity={0.35} />
        </mesh>

        <mesh ref={ring2Ref}>
          <torusGeometry args={[3.15, 0.014, 16, 100]} />
          <meshBasicMaterial color={theme.tertiaryAccent} transparent opacity={0.26} />
        </mesh>
      </group>

      {/* Floating 3D Geometric Elements */}
      <group ref={groupRef}>
        {items.map((item) => {
          const accent =
            item.id % 3 === 0
              ? theme.primaryAccent
              : item.id % 3 === 1
                ? theme.secondaryAccent
                : theme.tertiaryAccent;
          return (
            <Float
              key={item.id}
              speed={1.2 + (item.id % 3) * 0.4}
              rotationIntensity={0.8}
              floatIntensity={1.1}
              position={item.position}
            >
              <mesh scale={item.scale}>
                {theme.floatingShapesVariant === 'torus-rings' ||
                (theme.floatingShapesVariant === 'mixed-polyhedra' && item.kind === 1) ? (
                  <torusGeometry args={[1.1, 0.34, 14, 32]} />
                ) : theme.floatingShapesVariant === 'icosahedrons' || item.kind === 0 ? (
                  <icosahedronGeometry args={[1.05, 0]} />
                ) : (
                  <octahedronGeometry args={[1.05, 0]} />
                )}
                <meshStandardMaterial
                  color={accent}
                  emissive={accent}
                  emissiveIntensity={item.wireframe ? 0.45 : 0.18}
                  roughness={0.22}
                  metalness={0.82}
                  wireframe={item.wireframe}
                  transparent
                  opacity={item.wireframe ? 0.55 : 0.35}
                />
              </mesh>
            </Float>
          );
        })}
      </group>

      {/* Luminous Starfield Sparkles */}
      <Sparkles
        count={Math.max(40, Math.min(400, Math.round(theme.particleCount)))}
        scale={[18, 14, 12]}
        size={2.1}
        speed={0.35}
        opacity={0.48}
        color={theme.primaryAccent}
      />
    </>
  );
};

class SceneWebGLGuard extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

export const ScrollScene3D: React.FC<ScrollSceneProps> = ({ theme }) => {
  const scrollRef = useRef<number>(0);
  const auraTopRef = useRef<HTMLDivElement>(null);
  const auraBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateScroll = () => {
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const ratio = docHeight > 0 ? Math.min(1, Math.max(0, window.scrollY / docHeight)) : 0;
      scrollRef.current = ratio;

      if (auraTopRef.current) {
        const shiftX = Math.sin(ratio * Math.PI * 2) * 18;
        auraTopRef.current.style.transform = `translate3d(${shiftX}%, ${ratio * 12}%, 0)`;
      }
      if (auraBottomRef.current) {
        const shiftX = -Math.cos(ratio * Math.PI * 2) * 16;
        auraBottomRef.current.style.transform = `translate3d(${shiftX}%, ${-ratio * 10}%, 0)`;
      }
    };

    updateScroll();
    window.addEventListener('scroll', updateScroll, { passive: true });
    window.addEventListener('resize', updateScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', updateScroll);
      window.removeEventListener('resize', updateScroll);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden transition-colors duration-700"
      style={{ backgroundColor: theme.canvasBg }}
    >
      {/* Dynamic Scroll-Reactive Ambient Gradient Auras */}
      <div
        ref={auraTopRef}
        className="absolute -top-36 left-1/4 w-[44rem] h-[44rem] rounded-full blur-[140px] transition-opacity duration-500 will-change-transform"
        style={{
          background: `radial-gradient(circle, ${theme.primaryAccent}30 0%, ${theme.secondaryAccent}14 55%, transparent 75%)`,
          opacity: theme.ambientGlowIntensity,
        }}
      />
      <div
        ref={auraBottomRef}
        className="absolute -bottom-44 right-1/5 w-[48rem] h-[48rem] rounded-full blur-[150px] transition-opacity duration-500 will-change-transform"
        style={{
          background: `radial-gradient(circle, ${theme.tertiaryAccent}33 0%, ${theme.secondaryAccent}16 55%, transparent 75%)`,
          opacity: theme.ambientGlowIntensity,
        }}
      />

      {/* Subtle Architectural Cyber Grid Overlay */}
      <div
        className="absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage: `linear-gradient(to right, ${theme.primaryAccent} 1px, transparent 1px), linear-gradient(to bottom, ${theme.primaryAccent} 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }}
      />

      {/* Real-Time GPU WebGL Scene */}
      <SceneWebGLGuard>
        <Canvas
          dpr={[1, 1.75]}
          camera={{ position: [0, 0, 6.2], fov: 48 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        >
          <FloatingPolyhedraField theme={theme} scrollRef={scrollRef} />
        </Canvas>
      </SceneWebGLGuard>
    </div>
  );
};
