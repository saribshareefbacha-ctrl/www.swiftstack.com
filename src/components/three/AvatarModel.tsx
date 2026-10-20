import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { AvatarConfig } from '../../types/cms';
import { SpeechFrameState } from '../../utils/speechEngine';

interface AvatarModelProps {
  config: AvatarConfig;
  speechState: SpeechFrameState;
  primaryAccent?: string;
  secondaryAccent?: string;
}

export const AvatarModel: React.FC<AvatarModelProps> = ({
  config,
  speechState,
  primaryAccent = '#06b6d4',
  secondaryAccent = '#3b82f6',
}) => {
  const rootRef = useRef<THREE.Group>(null);
  const headGroupRef = useRef<THREE.Group>(null);
  const jawGroupRef = useRef<THREE.Group>(null);
  const mouthCavityRef = useRef<THREE.Mesh>(null);
  const teethRef = useRef<THREE.Group>(null);
  const upperLipRef = useRef<THREE.Mesh>(null);
  const lowerLipRef = useRef<THREE.Mesh>(null);
  const leftEyelidRef = useRef<THREE.Mesh>(null);
  const rightEyelidRef = useRef<THREE.Mesh>(null);
  const leftBrowRef = useRef<THREE.Group>(null);
  const rightBrowRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const rightForearmRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const auraGroupRef = useRef<THREE.Group>(null);

  const skinColor = useMemo(() => new THREE.Color(config.skinTone), [config.skinTone]);
  const blushColor = useMemo(
    () => new THREE.Color(config.skinTone).lerp(new THREE.Color('#e06d65'), 0.26),
    [config.skinTone]
  );
  const lipColor = useMemo(
    () => new THREE.Color(config.skinTone).lerp(new THREE.Color('#9a4444'), 0.45),
    [config.skinTone]
  );

  // Curly locks around crown & back/temples (strictly above forehead y >= 0.28 in front)
  const curlyLocks = useMemo(() => {
    const locks: Array<{ pos: [number, number, number]; scale: number }> = [];
    for (let i = 0; i < 28; i++) {
      const phi = (i / 28) * Math.PI * 2;
      const ring = i % 3;
      const rad = ring === 0 ? 0.16 : ring === 1 ? 0.3 : 0.41;
      const isFront = Math.sin(phi) > 0.25;
      const y = ring === 0 ? 0.5 : ring === 1 ? 0.44 : isFront ? 0.37 : 0.26;
      locks.push({
        pos: [-Math.cos(phi) * rad, y, Math.sin(phi) * rad * (isFront ? 0.86 : 1)],
        scale: 0.105 + (i % 3) * 0.016,
      });
    }
    return locks;
  }, []);

  // Textured short quiff hair volume matching Muhammad Sarib Randhawa's signature hairstyle
  const quiffStrands = useMemo(
    () => [
      {
        pos: [0, 0.47, 0.25] as [number, number, number],
        rot: [-0.34, 0.06, -0.08] as [number, number, number],
        scale: [0.16, 0.125, 0.23] as [number, number, number],
      },
      {
        pos: [-0.14, 0.455, 0.22] as [number, number, number],
        rot: [-0.3, 0.24, 0.15] as [number, number, number],
        scale: [0.145, 0.11, 0.21] as [number, number, number],
      },
      {
        pos: [0.145, 0.475, 0.22] as [number, number, number],
        rot: [-0.4, -0.22, -0.18] as [number, number, number],
        scale: [0.155, 0.13, 0.22] as [number, number, number],
      },
      {
        pos: [-0.255, 0.4, 0.14] as [number, number, number],
        rot: [-0.18, 0.4, 0.3] as [number, number, number],
        scale: [0.12, 0.1, 0.19] as [number, number, number],
      },
      {
        pos: [0.255, 0.415, 0.14] as [number, number, number],
        rot: [-0.22, -0.36, -0.26] as [number, number, number],
        scale: [0.125, 0.105, 0.19] as [number, number, number],
      },
      {
        pos: [0.02, 0.505, 0.04] as [number, number, number],
        rot: [-0.1, 0.12, -0.08] as [number, number, number],
        scale: [0.23, 0.115, 0.26] as [number, number, number],
      },
      {
        pos: [-0.13, 0.485, -0.06] as [number, number, number],
        rot: [0.05, 0.25, 0.12] as [number, number, number],
        scale: [0.19, 0.105, 0.24] as [number, number, number],
      },
      {
        pos: [0.13, 0.49, -0.05] as [number, number, number],
        rot: [0.04, -0.22, -0.14] as [number, number, number],
        scale: [0.19, 0.11, 0.24] as [number, number, number],
      },
    ],
    []
  );

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const pointerX = state.pointer.x;
    const pointerY = state.pointer.y;

    if (rootRef.current) {
      rootRef.current.position.y = -0.66 + Math.sin(t * 1.8) * 0.022;
      rootRef.current.rotation.y = THREE.MathUtils.lerp(
        rootRef.current.rotation.y,
        pointerX * 0.16,
        delta * 3.2
      );
    }

    if (headGroupRef.current) {
      const speechNodY = speechState.isSpeaking ? Math.sin(t * 5.4) * 0.045 : 0;
      const speechTiltZ = speechState.isSpeaking ? Math.cos(t * 3.1) * 0.032 : 0;
      const targetRotY = pointerX * 0.26 + (speechState.isSpeaking ? Math.sin(t * 2.1) * 0.08 : 0);
      const targetRotX = -pointerY * 0.15 + speechNodY;
      headGroupRef.current.rotation.y = THREE.MathUtils.lerp(
        headGroupRef.current.rotation.y,
        targetRotY,
        delta * 4.5
      );
      headGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        headGroupRef.current.rotation.x,
        targetRotX,
        delta * 4.5
      );
      headGroupRef.current.rotation.z = THREE.MathUtils.lerp(
        headGroupRef.current.rotation.z,
        speechTiltZ,
        delta * 4
      );
    }

    // Natural Eyelid Blink Cycle (0.001 when open so eyes are 100% unoccluded; 1.02 when blinking)
    const blinkCycle = t % 3.7;
    const isBlinking = blinkCycle > 3.53 && blinkCycle < 3.68;
    if (leftEyelidRef.current && rightEyelidRef.current) {
      const nextVis = isBlinking ? 1 : 0;
      leftEyelidRef.current.visible = nextVis > 0.5;
      rightEyelidRef.current.visible = nextVis > 0.5;
    }

    // Dynamic Eyebrow Expression
    const baseBrowY = 0.188 + config.eyebrowArch * 0.055;
    const speechBrowBoost = speechState.isSpeaking
      ? 0.018 * Math.max(0, Math.sin(t * 6.5)) + speechState.mouthOpen * 0.015
      : 0;
    const exprTilt =
      config.expression === 'focused-architect'
        ? -0.13
        : config.expression === 'friendly-grin'
          ? 0.11
          : config.expression === 'visionary'
            ? 0.15
            : 0.05;

    if (leftBrowRef.current && rightBrowRef.current) {
      leftBrowRef.current.position.y = THREE.MathUtils.lerp(
        leftBrowRef.current.position.y,
        baseBrowY + speechBrowBoost,
        delta * 8
      );
      rightBrowRef.current.position.y = leftBrowRef.current.position.y;
      leftBrowRef.current.rotation.z = exprTilt;
      rightBrowRef.current.rotation.z = -exprTilt;
    }

    // Lip-Sync + Jaw + Coupled Beard Choreography
    const restingSmileOpen =
      config.expression === 'friendly-grin'
        ? 0.34
        : config.expression === 'confident-smile'
          ? 0.22
          : 0.05;
    const openAmount = speechState.isSpeaking ? speechState.mouthOpen : restingSmileOpen;
    const wideAmount = speechState.isSpeaking
      ? 1 + speechState.mouthWide * 0.32
      : config.expression === 'focused-architect'
        ? 0.92
        : 1.16;

    if (jawGroupRef.current) {
      jawGroupRef.current.position.y = THREE.MathUtils.lerp(
        jawGroupRef.current.position.y,
        -openAmount * 0.048,
        delta * 18
      );
      jawGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        jawGroupRef.current.rotation.x,
        openAmount * 0.09,
        delta * 18
      );
    }

    if (mouthCavityRef.current) {
      mouthCavityRef.current.scale.set(
        wideAmount,
        Math.max(0.22, 0.26 + openAmount * 1.15),
        1
      );
    }

    if (teethRef.current) {
      teethRef.current.scale.x = wideAmount;
    }

    if (upperLipRef.current) {
      upperLipRef.current.scale.x = wideAmount;
    }

    if (lowerLipRef.current) {
      lowerLipRef.current.scale.x = wideAmount * 0.96;
      lowerLipRef.current.position.y = -0.172 - openAmount * 0.042;
    }

    // Expressive Right & Left Arm Gestures
    if (rightArmRef.current && rightForearmRef.current) {
      let targetArmZ = -0.18;
      let targetArmX = 0.06 + Math.sin(t * 1.8) * 0.025;
      let targetForearmX = -0.18;
      let targetForearmZ = 0.08;

      if (speechState.isSpeaking) {
        if (speechState.gesturePhase === 'wave') {
          targetArmZ = -2.15 + Math.sin(t * 9.5) * 0.24;
          targetArmX = -0.35;
          targetForearmX = -0.45;
          targetForearmZ = Math.sin(t * 9.5) * 0.32;
        } else if (speechState.gesturePhase === 'self') {
          targetArmZ = -0.52;
          targetArmX = -0.78;
          targetForearmX = -1.25;
          targetForearmZ = 0.58;
        } else {
          targetArmZ = -0.62 + Math.sin(t * 3.8) * 0.14;
          targetArmX = -0.58;
          targetForearmX = -0.82 + Math.cos(t * 4.2) * 0.16;
          targetForearmZ = -0.18;
        }
      }

      rightArmRef.current.rotation.z = THREE.MathUtils.lerp(
        rightArmRef.current.rotation.z,
        targetArmZ,
        delta * 6.5
      );
      rightArmRef.current.rotation.x = THREE.MathUtils.lerp(
        rightArmRef.current.rotation.x,
        targetArmX,
        delta * 6.5
      );
      rightForearmRef.current.rotation.x = THREE.MathUtils.lerp(
        rightForearmRef.current.rotation.x,
        targetForearmX,
        delta * 7.5
      );
      rightForearmRef.current.rotation.z = THREE.MathUtils.lerp(
        rightForearmRef.current.rotation.z,
        targetForearmZ,
        delta * 7.5
      );
    }

    if (leftArmRef.current) {
      const targetLeftX = speechState.isSpeaking
        ? -0.22 + Math.sin(t * 3.2) * 0.1
        : 0.06 + Math.cos(t * 1.8) * 0.025;
      leftArmRef.current.rotation.x = THREE.MathUtils.lerp(
        leftArmRef.current.rotation.x,
        targetLeftX,
        delta * 5
      );
    }

    if (auraGroupRef.current) {
      auraGroupRef.current.rotation.y += delta * (speechState.isSpeaking ? 0.95 : 0.32);
    }
  });

  const isSleevedLong =
    config.outfitStyle === 'executive-blazer' || config.outfitStyle === 'cyber-hoodie';

  return (
    <group ref={rootRef} position={[0, -0.66, 0]}>
      {/* ============================================================
          LEVITATING STUDIO STAGE PEDESTAL
      ============================================================ */}
      <group position={[0, -0.78, 0]}>
        <mesh receiveShadow position={[0, 0, 0]}>
          <cylinderGeometry args={[0.92, 1.02, 0.09, 48]} />
          <meshStandardMaterial color="#0b1222" roughness={0.22} metalness={0.85} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.048, 0]}>
          <ringGeometry args={[0.84, 0.9, 64]} />
          <meshBasicMaterial color={primaryAccent} side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.049, 0]}>
          <ringGeometry args={[0.58, 0.605, 64]} />
          <meshBasicMaterial
            color={secondaryAccent}
            transparent
            opacity={0.65}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* Optional Floating 3D Holographic Orbital Rings (Cleanly framing body without crossing face) */}
      {config.holoAura && (
        <group ref={auraGroupRef} position={[0, 0.15, -0.08]}>
          <mesh rotation={[Math.PI / 2.22, 0.12, 0]}>
            <torusGeometry args={[1.08, 0.011, 16, 84]} />
            <meshBasicMaterial color={primaryAccent} transparent opacity={0.45} />
          </mesh>
          <mesh rotation={[Math.PI / 2.05, -0.16, 0.2]}>
            <torusGeometry args={[1.24, 0.008, 16, 84]} />
            <meshBasicMaterial color={secondaryAccent} transparent opacity={0.32} />
          </mesh>
          {[0, 1, 2].map((i) => {
            const ang = (i / 3) * Math.PI * 2;
            return (
              <mesh
                key={i}
                position={[Math.cos(ang) * 1.12, Math.sin(ang * 2) * 0.14, Math.sin(ang) * 1.12]}
              >
                <octahedronGeometry args={[0.052, 0]} />
                <meshStandardMaterial
                  color={primaryAccent}
                  emissive={primaryAccent}
                  emissiveIntensity={0.8}
                  metalness={0.7}
                  roughness={0.15}
                />
              </mesh>
            );
          })}
        </group>
      )}

      {/* ============================================================
          DARK TAILORED TROUSERS, PELVIS, BELT & MODERN SNEAKERS
      ============================================================ */}
      <group position={[0, 0.08, 0]}>
        <RoundedBox args={[0.62, 0.28, 0.36]} radius={0.09} smoothness={4} position={[0, 0.08, 0]}>
          <meshStandardMaterial color={config.pantsColor} roughness={0.72} metalness={0.08} />
        </RoundedBox>

        <RoundedBox args={[0.64, 0.065, 0.375]} radius={0.02} smoothness={3} position={[0, 0.2, 0]}>
          <meshStandardMaterial color="#090d16" roughness={0.4} metalness={0.3} />
        </RoundedBox>
        <RoundedBox
          args={[0.11, 0.078, 0.04]}
          radius={0.014}
          smoothness={3}
          position={[0, 0.2, 0.19]}
        >
          <meshStandardMaterial color="#cbd5e1" roughness={0.2} metalness={0.9} />
        </RoundedBox>

        {[-0.165, 0.165].map((xPos, idx) => (
          <group key={idx} position={[xPos, -0.02, 0]}>
            <mesh position={[0, -0.34, 0]} castShadow>
              <capsuleGeometry args={[0.125, 0.56, 12, 20]} />
              <meshStandardMaterial color={config.pantsColor} roughness={0.72} metalness={0.08} />
            </mesh>
            <mesh position={[0, -0.64, 0]}>
              <cylinderGeometry args={[0.132, 0.132, 0.055, 24]} />
              <meshStandardMaterial color={config.pantsColor} roughness={0.68} />
            </mesh>
            <group position={[0, -0.71, 0.055]}>
              <RoundedBox args={[0.21, 0.11, 0.34]} radius={0.045} smoothness={4}>
                <meshStandardMaterial color="#1e293b" roughness={0.45} metalness={0.15} />
              </RoundedBox>
              <RoundedBox
                args={[0.222, 0.042, 0.356]}
                radius={0.016}
                smoothness={4}
                position={[0, -0.042, 0]}
              >
                <meshStandardMaterial color="#f8fafc" roughness={0.35} />
              </RoundedBox>
              <RoundedBox
                args={[0.215, 0.018, 0.14]}
                radius={0.007}
                smoothness={2}
                position={[0, 0.01, 0.02]}
              >
                <meshStandardMaterial color={config.shirtTrimColor2} roughness={0.4} />
              </RoundedBox>
            </group>
          </group>
        ))}
      </group>

      {/* ============================================================
          TORSO & SIGNATURE OUTFIT SYSTEM
      ============================================================ */}
      <group position={[0, 0.62, 0]}>
        <RoundedBox args={[0.7, 0.72, 0.4]} radius={0.15} smoothness={5} castShadow>
          <meshStandardMaterial
            color={config.shirtPrimaryColor}
            roughness={0.58}
            metalness={0.04}
          />
        </RoundedBox>

        {/* Neck & Clean Collar Opening Skin Base */}
        <mesh position={[0, 0.43, 0.01]} castShadow>
          <cylinderGeometry args={[0.135, 0.152, 0.24, 24]} />
          <meshStandardMaterial color={skinColor} roughness={0.54} />
        </mesh>
        <mesh position={[0, 0.365, 0.085]}>
          <cylinderGeometry args={[0.095, 0.075, 0.08, 18]} />
          <meshStandardMaterial color={skinColor} roughness={0.54} />
        </mesh>

        {/* OUTFIT 1: SIGNATURE WHITE COLLARED POLO W/ RED & BLUE TRIMS */}
        {config.outfitStyle === 'white-polo' && (
          <group>
            {/* Left Folded Polo Collar Wing + Red & Blue Edge Stripes */}
            <group position={[-0.13, 0.348, 0.118]} rotation={[0.34, 0.24, -0.4]}>
              <RoundedBox args={[0.175, 0.082, 0.15]} radius={0.016} smoothness={3}>
                <meshStandardMaterial color={config.shirtPrimaryColor} roughness={0.5} />
              </RoundedBox>
              <RoundedBox
                args={[0.179, 0.014, 0.154]}
                radius={0.004}
                smoothness={2}
                position={[0, -0.022, 0.004]}
              >
                <meshStandardMaterial color={config.shirtTrimColor1} roughness={0.4} />
              </RoundedBox>
              <RoundedBox
                args={[0.179, 0.014, 0.154]}
                radius={0.004}
                smoothness={2}
                position={[0, -0.037, 0.004]}
              >
                <meshStandardMaterial color={config.shirtTrimColor2} roughness={0.4} />
              </RoundedBox>
            </group>

            {/* Right Folded Polo Collar Wing + Red & Blue Edge Stripes */}
            <group position={[0.13, 0.348, 0.118]} rotation={[0.34, -0.24, 0.4]}>
              <RoundedBox args={[0.175, 0.082, 0.15]} radius={0.016} smoothness={3}>
                <meshStandardMaterial color={config.shirtPrimaryColor} roughness={0.5} />
              </RoundedBox>
              <RoundedBox
                args={[0.179, 0.014, 0.154]}
                radius={0.004}
                smoothness={2}
                position={[0, -0.022, 0.004]}
              >
                <meshStandardMaterial color={config.shirtTrimColor1} roughness={0.4} />
              </RoundedBox>
              <RoundedBox
                args={[0.179, 0.014, 0.154]}
                radius={0.004}
                smoothness={2}
                position={[0, -0.037, 0.004]}
              >
                <meshStandardMaterial color={config.shirtTrimColor2} roughness={0.4} />
              </RoundedBox>
            </group>

            {/* Horizontal Back Collar Band in XZ Plane around Neck */}
            <mesh position={[0, 0.372, 0.005]} rotation={[Math.PI / 2, 0, Math.PI * 0.88]}>
              <torusGeometry args={[0.16, 0.03, 12, 28, Math.PI * 1.24]} />
              <meshStandardMaterial color={config.shirtPrimaryColor} roughness={0.5} />
            </mesh>

            {/* Center Polo Button Placket + 3 Pearl Buttons + Piping */}
            <RoundedBox
              args={[0.078, 0.24, 0.03]}
              radius={0.01}
              smoothness={3}
              position={[0, 0.18, 0.198]}
            >
              <meshStandardMaterial color={config.shirtPrimaryColor} roughness={0.48} />
            </RoundedBox>
            <RoundedBox
              args={[0.01, 0.235, 0.032]}
              radius={0.004}
              smoothness={2}
              position={[-0.04, 0.18, 0.199]}
            >
              <meshStandardMaterial color={config.shirtTrimColor2} roughness={0.4} />
            </RoundedBox>
            <RoundedBox
              args={[0.01, 0.235, 0.032]}
              radius={0.004}
              smoothness={2}
              position={[0.04, 0.18, 0.199]}
            >
              <meshStandardMaterial color={config.shirtTrimColor1} roughness={0.4} />
            </RoundedBox>
            {[0.24, 0.18, 0.12].map((by, idx) => (
              <mesh key={idx} position={[0, by, 0.215]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.013, 0.013, 0.01, 16]} />
                <meshStandardMaterial color="#e2e8f0" metalness={0.35} roughness={0.25} />
              </mesh>
            ))}

            {/* Embroidered Left Chest SwiftStack (SS) Crest */}
            <group position={[0.175, 0.17, 0.196]}>
              <mesh rotation={[0, 0, Math.PI / 4]}>
                <boxGeometry args={[0.068, 0.068, 0.016]} />
                <meshStandardMaterial
                  color="#0f172a"
                  emissive={primaryAccent}
                  emissiveIntensity={0.35}
                  metalness={0.6}
                  roughness={0.25}
                />
              </mesh>
              <mesh position={[0, 0, 0.01]}>
                <torusGeometry args={[0.022, 0.005, 8, 24]} />
                <meshBasicMaterial color={primaryAccent} />
              </mesh>
            </group>
          </group>
        )}

        {/* OUTFIT 2: EXECUTIVE BLAZER */}
        {config.outfitStyle === 'executive-blazer' && (
          <group>
            <RoundedBox
              args={[0.24, 0.52, 0.04]}
              radius={0.016}
              smoothness={3}
              position={[0, 0.08, 0.186]}
            >
              <meshStandardMaterial color="#f8fafc" roughness={0.45} />
            </RoundedBox>
            <RoundedBox
              args={[0.12, 0.46, 0.045]}
              radius={0.018}
              smoothness={3}
              position={[-0.12, 0.1, 0.198]}
              rotation={[0, 0, -0.22]}
            >
              <meshStandardMaterial color={config.shirtPrimaryColor} roughness={0.42} />
            </RoundedBox>
            <RoundedBox
              args={[0.12, 0.46, 0.045]}
              radius={0.018}
              smoothness={3}
              position={[0.12, 0.1, 0.198]}
              rotation={[0, 0, 0.22]}
            >
              <meshStandardMaterial color={config.shirtPrimaryColor} roughness={0.42} />
            </RoundedBox>
            <RoundedBox
              args={[0.09, 0.04, 0.02]}
              radius={0.008}
              smoothness={2}
              position={[0.19, 0.16, 0.2]}
            >
              <meshStandardMaterial color={config.shirtTrimColor1} roughness={0.35} />
            </RoundedBox>
          </group>
        )}

        {/* OUTFIT 3: CYBER TECH HOODIE */}
        {config.outfitStyle === 'cyber-hoodie' && (
          <group>
            {/* Horizontal Hood Collar around Shoulders/Neck */}
            <mesh position={[0, 0.34, 0]} rotation={[Math.PI / 2 + 0.18, 0, 0]}>
              <torusGeometry args={[0.21, 0.062, 14, 32]} />
              <meshStandardMaterial color={config.shirtPrimaryColor} roughness={0.62} />
            </mesh>
            {[-0.075, 0.075].map((dx, idx) => (
              <mesh key={idx} position={[dx, 0.2, 0.205]}>
                <capsuleGeometry args={[0.009, 0.18, 6, 12]} />
                <meshStandardMaterial
                  color={config.shirtTrimColor1}
                  emissive={config.shirtTrimColor1}
                  emissiveIntensity={0.65}
                />
              </mesh>
            ))}
            <RoundedBox
              args={[0.42, 0.2, 0.04]}
              radius={0.016}
              smoothness={3}
              position={[0, -0.15, 0.192]}
            >
              <meshStandardMaterial color={config.shirtPrimaryColor} roughness={0.5} />
            </RoundedBox>
          </group>
        )}

        {/* OUTFIT 4 & 5: HENLEY / WAISTCOAT */}
        {(config.outfitStyle === 'henley-casual' || config.outfitStyle === 'waistcoat-modern') && (
          <group>
            <RoundedBox
              args={[0.068, 0.28, 0.03]}
              radius={0.012}
              smoothness={3}
              position={[0, 0.16, 0.198]}
            >
              <meshStandardMaterial color={config.shirtTrimColor2} roughness={0.45} />
            </RoundedBox>
            {[0.24, 0.17, 0.1].map((by, idx) => (
              <mesh key={idx} position={[0, by, 0.216]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.013, 0.013, 0.01, 14]} />
                <meshStandardMaterial color="#f8fafc" />
              </mesh>
            ))}
          </group>
        )}

        {/* RIGHT ARTICULATED ARM */}
        <group ref={rightArmRef} position={[-0.42, 0.26, 0]}>
          <mesh position={[0, -0.1, 0]} castShadow>
            <capsuleGeometry args={[0.112, 0.16, 10, 18]} />
            <meshStandardMaterial
              color={
                config.outfitStyle === 'waistcoat-modern' ? '#f8fafc' : config.shirtPrimaryColor
              }
              roughness={0.55}
            />
          </mesh>
          {config.outfitStyle === 'white-polo' && (
            <group position={[0, -0.195, 0]}>
              <mesh>
                <cylinderGeometry args={[0.115, 0.115, 0.018, 24]} />
                <meshStandardMaterial color={config.shirtTrimColor1} roughness={0.4} />
              </mesh>
              <mesh position={[0, -0.02, 0]}>
                <cylinderGeometry args={[0.115, 0.115, 0.018, 24]} />
                <meshStandardMaterial color={config.shirtTrimColor2} roughness={0.4} />
              </mesh>
            </group>
          )}
          <mesh position={[0, -0.22, 0]} castShadow>
            <capsuleGeometry args={[0.088, 0.18, 10, 18]} />
            <meshStandardMaterial
              color={isSleevedLong ? config.shirtPrimaryColor : skinColor}
              roughness={0.54}
            />
          </mesh>
          <group ref={rightForearmRef} position={[0, -0.33, 0]}>
            <mesh position={[0, -0.14, 0]} castShadow>
              <capsuleGeometry args={[0.08, 0.2, 10, 18]} />
              <meshStandardMaterial
                color={isSleevedLong ? config.shirtPrimaryColor : skinColor}
                roughness={0.54}
              />
            </mesh>
            <group position={[0, -0.3, 0]}>
              <RoundedBox args={[0.11, 0.13, 0.075]} radius={0.034} smoothness={4}>
                <meshStandardMaterial color={skinColor} roughness={0.52} />
              </RoundedBox>
              <mesh position={[0.062, 0.015, 0.02]} rotation={[0, 0, -0.45]}>
                <capsuleGeometry args={[0.022, 0.045, 8, 12]} />
                <meshStandardMaterial color={skinColor} roughness={0.52} />
              </mesh>
            </group>
          </group>
        </group>

        {/* LEFT ARTICULATED ARM + SMART CHRONOGRAPH WATCH */}
        <group ref={leftArmRef} position={[0.42, 0.26, 0]} rotation={[0.06, 0, 0.18]}>
          <mesh position={[0, -0.1, 0]} castShadow>
            <capsuleGeometry args={[0.112, 0.16, 10, 18]} />
            <meshStandardMaterial
              color={
                config.outfitStyle === 'waistcoat-modern' ? '#f8fafc' : config.shirtPrimaryColor
              }
              roughness={0.55}
            />
          </mesh>
          {config.outfitStyle === 'white-polo' && (
            <group position={[0, -0.195, 0]}>
              <mesh>
                <cylinderGeometry args={[0.115, 0.115, 0.018, 24]} />
                <meshStandardMaterial color={config.shirtTrimColor1} roughness={0.4} />
              </mesh>
              <mesh position={[0, -0.02, 0]}>
                <cylinderGeometry args={[0.115, 0.115, 0.018, 24]} />
                <meshStandardMaterial color={config.shirtTrimColor2} roughness={0.4} />
              </mesh>
            </group>
          )}
          <mesh position={[0, -0.22, 0]} castShadow>
            <capsuleGeometry args={[0.088, 0.18, 10, 18]} />
            <meshStandardMaterial
              color={isSleevedLong ? config.shirtPrimaryColor : skinColor}
              roughness={0.54}
            />
          </mesh>
          <group position={[0, -0.33, 0]} rotation={[-0.22, 0, -0.08]}>
            <mesh position={[0, -0.14, 0]} castShadow>
              <capsuleGeometry args={[0.08, 0.2, 10, 18]} />
              <meshStandardMaterial
                color={isSleevedLong ? config.shirtPrimaryColor : skinColor}
                roughness={0.54}
              />
            </mesh>
            {config.watch && (
              <group position={[0, -0.235, 0]}>
                <mesh>
                  <cylinderGeometry args={[0.086, 0.086, 0.036, 24]} />
                  <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.3} />
                </mesh>
                <RoundedBox
                  args={[0.068, 0.068, 0.022]}
                  radius={0.01}
                  smoothness={3}
                  position={[0, 0, 0.082]}
                >
                  <meshStandardMaterial
                    color="#020617"
                    emissive={primaryAccent}
                    emissiveIntensity={0.45}
                    metalness={0.85}
                    roughness={0.15}
                  />
                </RoundedBox>
              </group>
            )}
            <group position={[0, -0.3, 0]}>
              <RoundedBox args={[0.11, 0.13, 0.075]} radius={0.034} smoothness={4}>
                <meshStandardMaterial color={skinColor} roughness={0.52} />
              </RoundedBox>
              <mesh position={[-0.062, 0.015, 0.02]} rotation={[0, 0, 0.45]}>
                <capsuleGeometry args={[0.022, 0.045, 8, 12]} />
                <meshStandardMaterial color={skinColor} roughness={0.52} />
              </mesh>
            </group>
          </group>
        </group>

        {/* ============================================================
            3D BITMOJI-STYLE HEAD, HAIR, BEARD & FACIAL RIG
        ============================================================ */}
        <group ref={headGroupRef} position={[0, 0.82, 0.02]}>
          {/* Smooth Stylized Head Mesh */}
          <mesh castShadow scale={[0.93, 1.04, 0.94]}>
            <sphereGeometry args={[0.45, 42, 42]} />
            <meshStandardMaterial color={skinColor} roughness={0.52} metalness={0.02} />
          </mesh>

          {/* Subtle Warm Cheek Blush */}
          {[-0.22, 0.22].map((cx, idx) => (
            <mesh key={idx} position={[cx, -0.04, 0.378]} scale={[1.05, 0.7, 0.35]}>
              <sphereGeometry args={[0.072, 16, 16]} />
              <meshStandardMaterial
                color={blushColor}
                transparent
                opacity={0.34}
                roughness={0.7}
              />
            </mesh>
          ))}

          {/* Left & Right Sculpted Ears */}
          {[-0.415, 0.415].map((ex, idx) => (
            <group
              key={idx}
              position={[ex, 0.01, -0.02]}
              rotation={[0, idx === 0 ? -0.18 : 0.18, 0]}
            >
              <mesh scale={[0.45, 0.88, 0.62]}>
                <sphereGeometry args={[0.115, 20, 20]} />
                <meshStandardMaterial color={skinColor} roughness={0.54} />
              </mesh>
              <mesh position={[idx === 0 ? -0.015 : 0.015, 0, 0.015]} scale={[0.3, 0.55, 0.4]}>
                <sphereGeometry args={[0.085, 14, 14]} />
                <meshStandardMaterial color={blushColor} roughness={0.65} />
              </mesh>
            </group>
          ))}

          {/* Sculpted Stylized Nose */}
          <group position={[0, -0.012, 0.422]}>
            <mesh position={[0, 0.04, -0.01]} rotation={[-0.22, 0, 0]}>
              <capsuleGeometry args={[0.036, 0.075, 10, 16]} />
              <meshStandardMaterial color={skinColor} roughness={0.5} />
            </mesh>
            <mesh position={[0, -0.022, 0.02]} scale={[1.12, 0.9, 1.0]}>
              <sphereGeometry args={[0.052, 20, 20]} />
              <meshStandardMaterial color={skinColor} roughness={0.48} />
            </mesh>
            {[-0.034, 0.034].map((nx, idx) => (
              <mesh key={idx} position={[nx, -0.032, 0.004]}>
                <sphereGeometry args={[0.026, 14, 14]} />
                <meshStandardMaterial color={skinColor} roughness={0.52} />
              </mesh>
            ))}
          </group>

          {/* Expressive Layered Eyes (Unoccluded Sclera + Iris + Pupil + Dual Catchlights + Blink Lids) */}
          {[-0.148, 0.148].map((eyeX, idx) => (
            <group key={idx} position={[eyeX, 0.068, 0.378]}>
              <mesh scale={[1.05, 0.96, 0.52]}>
                <sphereGeometry args={[0.072, 24, 24]} />
                <meshStandardMaterial color="#ffffff" roughness={0.22} />
              </mesh>
              <mesh position={[0, 0, 0.034]} scale={[1, 1, 0.25]}>
                <sphereGeometry args={[0.043, 24, 24]} />
                <meshStandardMaterial color={config.eyeColor} roughness={0.25} />
              </mesh>
              <mesh position={[0, 0, 0.043]} scale={[1, 1, 0.2]}>
                <sphereGeometry args={[0.022, 20, 20]} />
                <meshBasicMaterial color="#09090b" />
              </mesh>
              <mesh position={[0.016, 0.017, 0.049]}>
                <sphereGeometry args={[0.011, 12, 12]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
              <mesh position={[-0.014, -0.014, 0.048]}>
                <sphereGeometry args={[0.0055, 10, 10]} />
                <meshBasicMaterial color="#e0f2fe" />
              </mesh>
              {/* Subtle Upper Lash Line */}
              <mesh position={[0, 0.006, 0.032]} rotation={[0, 0, Math.PI * 0.12]}>
                <torusGeometry args={[0.068, 0.0065, 8, 22, Math.PI * 0.76]} />
                <meshStandardMaterial color={config.hairColor} roughness={0.7} />
              </mesh>
              {/* Full Blinking Eyelid (visible strictly during natural blink frames) */}
              <mesh
                ref={idx === 0 ? leftEyelidRef : rightEyelidRef}
                visible={false}
                scale={[1.08, 1.0, 0.58]}
              >
                <sphereGeometry args={[0.074, 20, 16]} />
                <meshStandardMaterial color={skinColor} roughness={0.5} />
              </mesh>
            </group>
          ))}

          {/* Sculpted Tapered Eyebrows */}
          <group ref={leftBrowRef} position={[-0.152, 0.19, 0.39]} rotation={[0.1, 0.14, 0.05]}>
            <RoundedBox args={[0.145, 0.032, 0.035]} radius={0.014} smoothness={4}>
              <meshStandardMaterial color={config.hairColor} roughness={0.75} />
            </RoundedBox>
          </group>
          <group ref={rightBrowRef} position={[0.152, 0.19, 0.39]} rotation={[0.1, -0.14, -0.05]}>
            <RoundedBox args={[0.145, 0.032, 0.035]} radius={0.014} smoothness={4}>
              <meshStandardMaterial color={config.hairColor} roughness={0.75} />
            </RoundedBox>
          </group>

          {/* Expressive Smiling / Speaking Mouth, Gleaming White Teeth & Lips */}
          <mesh ref={upperLipRef} position={[0, -0.125, 0.422]} rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.013, 0.128, 8, 16]} />
            <meshStandardMaterial color={lipColor} roughness={0.42} />
          </mesh>

          <mesh ref={mouthCavityRef} position={[0, -0.152, 0.412]} scale={[1.18, 0.46, 0.22]}>
            <sphereGeometry args={[0.072, 20, 16]} />
            <meshBasicMaterial color="#2b0c13" />
          </mesh>

          <group ref={teethRef} position={[0, -0.141, 0.426]}>
            <RoundedBox args={[0.128, 0.026, 0.016]} radius={0.006} smoothness={3}>
              <meshStandardMaterial color="#ffffff" roughness={0.14} />
            </RoundedBox>
          </group>

          <mesh position={[0, -0.165, 0.418]} scale={[1.0, 0.38, 0.24]}>
            <sphereGeometry args={[0.036, 14, 12]} />
            <meshStandardMaterial color="#d96b78" roughness={0.5} />
          </mesh>

          <mesh ref={lowerLipRef} position={[0, -0.172, 0.422]} rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.015, 0.115, 8, 16]} />
            <meshStandardMaterial color={lipColor} roughness={0.38} />
          </mesh>

          {/* ============================================================
              5 SCULPTED 3D BEARD STYLES (HORIZONTAL GROOMED MUSTACHE + FULL CHIN!)
          ============================================================ */}
          {config.beardStyle !== 'clean-shaven' && (
            <group>
              {/* Sculpted Horizontal Groomed Mustache Arching Cleanly Above Upper Lip */}
              <group position={[0, -0.102, 0.426]}>
                <mesh
                  position={[-0.048, -0.004, -0.004]}
                  rotation={[0, -0.16, Math.PI / 2 - 0.2]}
                  scale={[1, 1, 0.78]}
                >
                  <capsuleGeometry args={[0.02, 0.078, 8, 14]} />
                  <meshStandardMaterial
                    color={config.beardColor}
                    roughness={0.82}
                    transparent={config.beardStyle === 'heavy-stubble'}
                    opacity={config.beardStyle === 'heavy-stubble' ? 0.52 : 1}
                  />
                </mesh>
                <mesh
                  position={[0.048, -0.004, -0.004]}
                  rotation={[0, 0.16, -(Math.PI / 2 - 0.2)]}
                  scale={[1, 1, 0.78]}
                >
                  <capsuleGeometry args={[0.02, 0.078, 8, 14]} />
                  <meshStandardMaterial
                    color={config.beardColor}
                    roughness={0.82}
                    transparent={config.beardStyle === 'heavy-stubble'}
                    opacity={config.beardStyle === 'heavy-stubble' ? 0.52 : 1}
                  />
                </mesh>
              </group>

              {/* Coupled Lower Jaw & Chin Beard Rig (Starts strictly BELOW lower lip y <= -0.195!) */}
              <group ref={jawGroupRef}>
                {(config.beardStyle === 'full-groomed' ||
                  config.beardStyle === 'royal-boxed' ||
                  config.beardStyle === 'heavy-stubble') && (
                  <>
                    {/* Lower Jawline Cup starting at theta = 0.64π (y = -0.198, strictly under mouth!) */}
                    <mesh
                      position={[0, -0.015, 0.008]}
                      scale={
                        config.beardStyle === 'royal-boxed'
                          ? [0.955, 1.03, 0.975]
                          : [0.945, 1.02, 0.965]
                      }
                    >
                      <sphereGeometry
                        args={[0.456, 32, 24, 0, Math.PI * 2, Math.PI * 0.64, Math.PI * 0.36]}
                      />
                      <meshStandardMaterial
                        color={config.beardColor}
                        roughness={0.84}
                        transparent={config.beardStyle === 'heavy-stubble'}
                        opacity={config.beardStyle === 'heavy-stubble' ? 0.42 : 1}
                      />
                    </mesh>

                    {/* Diagonal Cheek & Mandible Beard Straps Connecting Sideburns -> Chin */}
                    {[-1, 1].map((side) => (
                      <group key={side}>
                        {/* Temple Sideburn */}
                        <mesh
                          position={[side * 0.392, -0.01, 0.12]}
                          rotation={[0.26, side * 0.34, -side * 0.12]}
                        >
                          <capsuleGeometry args={[0.044, 0.21, 8, 14]} />
                          <meshStandardMaterial
                            color={config.beardColor}
                            roughness={0.84}
                            transparent={config.beardStyle === 'heavy-stubble'}
                            opacity={config.beardStyle === 'heavy-stubble' ? 0.45 : 1}
                          />
                        </mesh>

                        {/* Cheek-to-Chin Jaw Strap framing outside of smile */}
                        <mesh
                          position={[side * 0.245, -0.175, 0.295]}
                          rotation={[0.48, side * 0.62, -side * 0.68]}
                        >
                          <capsuleGeometry args={[0.058, 0.22, 8, 14]} />
                          <meshStandardMaterial
                            color={config.beardColor}
                            roughness={0.84}
                            transparent={config.beardStyle === 'heavy-stubble'}
                            opacity={config.beardStyle === 'heavy-stubble' ? 0.45 : 1}
                          />
                        </mesh>

                        {/* Mustache-to-Beard Smile Corner Connector (Seamless connection) */}
                        <mesh
                          position={[side * 0.092, -0.152, 0.402]}
                          rotation={[0.16, side * 0.22, -side * 0.28]}
                        >
                          <capsuleGeometry args={[0.024, 0.082, 8, 12]} />
                          <meshStandardMaterial
                            color={config.beardColor}
                            roughness={0.84}
                            transparent={config.beardStyle === 'heavy-stubble'}
                            opacity={config.beardStyle === 'heavy-stubble' ? 0.45 : 1}
                          />
                        </mesh>
                      </group>
                    ))}

                    {/* Sculpted Chin Volume UNDER Lower Lip */}
                    {config.beardStyle !== 'heavy-stubble' && (
                      <mesh
                        position={[0, -0.295, 0.26]}
                        rotation={[0.22, 0, 0]}
                        scale={
                          config.beardStyle === 'royal-boxed'
                            ? [1.18, 0.82, 0.98]
                            : [1.12, 0.8, 0.94]
                        }
                      >
                        <sphereGeometry args={[0.145, 24, 20]} />
                        <meshStandardMaterial color={config.beardColor} roughness={0.84} />
                      </mesh>
                    )}
                  </>
                )}

                {/* Soul Patch right beneath lower lip */}
                <mesh position={[0, -0.205, 0.398]}>
                  <capsuleGeometry args={[0.02, 0.03, 8, 12]} />
                  <meshStandardMaterial color={config.beardColor} roughness={0.82} />
                </mesh>

                {config.beardStyle === 'goatee-trim' && (
                  <mesh position={[0, -0.285, 0.295]} scale={[0.92, 0.8, 0.85]}>
                    <sphereGeometry args={[0.13, 20, 18]} />
                    <meshStandardMaterial color={config.beardColor} roughness={0.82} />
                  </mesh>
                )}
              </group>
            </group>
          )}
          {config.beardStyle === 'clean-shaven' && <group ref={jawGroupRef} />}

          {/* ============================================================
              5 SCULPTED 3D HAIRSTYLES (BACK/SIDES ON -Z, FOREHEAD OPEN!)
          ============================================================ */}
          <group>
            {/* Back & Side Cranial Hair Cap strictly around -Z (phi = 0.92π .. 2.08π) */}
            <mesh position={[0, 0.04, -0.015]} scale={[0.96, 1.05, 0.97]}>
              <sphereGeometry
                args={[0.458, 36, 28, Math.PI * 0.92, Math.PI * 1.16, 0, Math.PI * 0.66]}
              />
              <meshStandardMaterial color={config.hairColor} roughness={0.78} />
            </mesh>
            {/* Top Crown Hair Cap strictly above forehead (theta = 0 .. 0.31π -> y >= 0.29) */}
            <mesh position={[0, 0.055, -0.01]} scale={[0.965, 1.02, 0.965]}>
              <sphereGeometry args={[0.458, 36, 24, 0, Math.PI * 2, 0, Math.PI * 0.31]} />
              <meshStandardMaterial color={config.hairColor} roughness={0.78} />
            </mesh>
            {/* Clean Faded Side Temples */}
            {[-0.398, 0.398].map((tx, idx) => (
              <mesh
                key={idx}
                position={[tx, 0.15, 0.12]}
                rotation={[0.2, idx === 0 ? -0.3 : 0.3, 0]}
              >
                <capsuleGeometry args={[0.048, 0.17, 8, 14]} />
                <meshStandardMaterial color={config.hairColor} roughness={0.78} />
              </mesh>
            ))}

            {/* 1. MODERN TEXTURED SHORT QUIFF (Default Muhammad Sarib Randhawa Look) */}
            {config.hairStyle === 'modern-quiff' && (
              <group>
                {quiffStrands.map((strand, i) => (
                  <mesh
                    key={i}
                    position={strand.pos}
                    rotation={strand.rot}
                    scale={strand.scale}
                    castShadow
                  >
                    <sphereGeometry args={[1, 18, 16]} />
                    <meshStandardMaterial color={config.hairColor} roughness={0.72} />
                  </mesh>
                ))}
              </group>
            )}

            {/* 2. SLICK SIDE POMPADOUR */}
            {config.hairStyle === 'slick-side' && (
              <group>
                <mesh
                  position={[0.06, 0.46, 0.15]}
                  rotation={[-0.24, -0.18, -0.22]}
                  scale={[0.34, 0.13, 0.28]}
                >
                  <sphereGeometry args={[1, 24, 20]} />
                  <meshStandardMaterial color={config.hairColor} roughness={0.55} />
                </mesh>
                <mesh
                  position={[-0.14, 0.43, 0.13]}
                  rotation={[-0.18, 0.25, 0.18]}
                  scale={[0.22, 0.1, 0.24]}
                >
                  <sphereGeometry args={[1, 20, 18]} />
                  <meshStandardMaterial color={config.hairColor} roughness={0.55} />
                </mesh>
              </group>
            )}

            {/* 3. CURLY TEXTURED CROP */}
            {config.hairStyle === 'curly-crop' && (
              <group>
                {curlyLocks.map((lock, idx) => (
                  <mesh key={idx} position={lock.pos} scale={lock.scale}>
                    <sphereGeometry args={[1, 12, 12]} />
                    <meshStandardMaterial color={config.hairColor} roughness={0.85} />
                  </mesh>
                ))}
              </group>
            )}

            {/* 4. WAVY FLOW */}
            {config.hairStyle === 'wavy-flow' && (
              <group>
                <mesh
                  position={[0, 0.47, 0.13]}
                  rotation={[-0.2, 0, -0.1]}
                  scale={[0.38, 0.14, 0.32]}
                >
                  <sphereGeometry args={[1, 22, 20]} />
                  <meshStandardMaterial color={config.hairColor} roughness={0.68} />
                </mesh>
                {[-0.41, 0.41].map((wx, idx) => (
                  <mesh key={idx} position={[wx, 0.02, 0.02]} scale={[0.09, 0.26, 0.22]}>
                    <sphereGeometry args={[1, 16, 16]} />
                    <meshStandardMaterial color={config.hairColor} roughness={0.72} />
                  </mesh>
                ))}
              </group>
            )}
          </group>

          {/* ============================================================
              HOLLOW OPTICAL FRAMES + TRANSLUCENT LENSES + HEADSET
          ============================================================ */}
          {config.glasses !== 'none' && (
            <group position={[0, 0.072, 0.432]}>
              {/* Bridge */}
              <RoundedBox args={[0.072, 0.018, 0.02]} radius={0.006} smoothness={2}>
                <meshStandardMaterial
                  color={config.glasses === 'aviator' ? '#eab308' : '#0f172a'}
                  metalness={0.8}
                  roughness={0.2}
                />
              </RoundedBox>
              {[-0.15, 0.15].map((gx, idx) => {
                const frameColor =
                  config.glasses === 'cyber-shades'
                    ? primaryAccent
                    : config.glasses === 'aviator'
                      ? '#facc15'
                      : '#1e293b';
                return (
                  <group key={idx} position={[gx, 0, 0]}>
                    {config.glasses === 'round-studio' || config.glasses === 'aviator' ? (
                      <mesh>
                        <torusGeometry args={[0.092, 0.011, 12, 32]} />
                        <meshStandardMaterial
                          color={frameColor}
                          metalness={0.88}
                          roughness={0.18}
                        />
                      </mesh>
                    ) : (
                      /* Hollow 4-Bar Architect Rim so eyes shine clearly behind lens! */
                      <group>
                        <RoundedBox
                          args={[0.205, 0.018, 0.022]}
                          radius={0.006}
                          smoothness={2}
                          position={[0, 0.068, 0]}
                        >
                          <meshStandardMaterial
                            color={frameColor}
                            metalness={0.65}
                            roughness={0.22}
                          />
                        </RoundedBox>
                        <RoundedBox
                          args={[0.195, 0.014, 0.022]}
                          radius={0.005}
                          smoothness={2}
                          position={[0, -0.068, 0]}
                        >
                          <meshStandardMaterial
                            color={frameColor}
                            metalness={0.65}
                            roughness={0.22}
                          />
                        </RoundedBox>
                        <RoundedBox
                          args={[0.016, 0.145, 0.022]}
                          radius={0.005}
                          smoothness={2}
                          position={[-0.096, 0, 0]}
                        >
                          <meshStandardMaterial
                            color={frameColor}
                            metalness={0.65}
                            roughness={0.22}
                          />
                        </RoundedBox>
                        <RoundedBox
                          args={[0.016, 0.145, 0.022]}
                          radius={0.005}
                          smoothness={2}
                          position={[0.096, 0, 0]}
                        >
                          <meshStandardMaterial
                            color={frameColor}
                            metalness={0.65}
                            roughness={0.22}
                          />
                        </RoundedBox>
                      </group>
                    )}

                    {/* Translucent Optical Lens */}
                    <mesh position={[0, 0, 0.003]} scale={[0.98, 0.8, 0.08]}>
                      <sphereGeometry args={[0.088, 20, 16]} />
                      <meshPhysicalMaterial
                        color={
                          config.glasses === 'cyber-shades'
                            ? '#020617'
                            : config.glasses === 'aviator'
                              ? '#0f172a'
                              : '#bae6fd'
                        }
                        transparent
                        opacity={
                          config.glasses === 'cyber-shades'
                            ? 0.9
                            : config.glasses === 'aviator'
                              ? 0.65
                              : 0.18
                        }
                        roughness={0.08}
                        metalness={0.2}
                      />
                    </mesh>

                    {/* Temple Arm */}
                    <RoundedBox
                      args={[0.014, 0.016, 0.36]}
                      radius={0.005}
                      smoothness={2}
                      position={[idx === 0 ? -0.102 : 0.102, 0.01, -0.18]}
                    >
                      <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.25} />
                    </RoundedBox>
                  </group>
                );
              })}
            </group>
          )}

          {/* Optional Studio Wireless Headset */}
          {config.headset && (
            <group>
              <mesh position={[0, 0.12, 0]}>
                <torusGeometry args={[0.47, 0.022, 12, 36, Math.PI]} />
                <meshStandardMaterial color="#0f172a" metalness={0.75} roughness={0.25} />
              </mesh>
              {[-0.455, 0.455].map((hx, idx) => (
                <group key={idx} position={[hx, 0.01, -0.01]}>
                  <mesh rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.105, 0.105, 0.065, 24]} />
                    <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.25} />
                  </mesh>
                  <mesh
                    position={[idx === 0 ? -0.034 : 0.034, 0, 0]}
                    rotation={[0, Math.PI / 2, 0]}
                  >
                    <torusGeometry args={[0.075, 0.008, 10, 28]} />
                    <meshBasicMaterial color={primaryAccent} />
                  </mesh>
                </group>
              ))}
            </group>
          )}
        </group>
      </group>
    </group>
  );
};
