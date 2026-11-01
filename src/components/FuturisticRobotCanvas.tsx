import React, { useEffect, useRef } from 'react';
import { ThemeMode } from '../types/cms';

interface FuturisticRobotCanvasProps {
  themeMode: ThemeMode;
  primaryHex: string;
  secondaryHex: string;
  accentHex: string;
  paused?: boolean;
}

interface ShockwaveRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  speed: number;
  thickness: number;
  hueHex: string;
}

interface EnergyMote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  warm: boolean;
}

interface AmbientDrone {
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale: number;
  phase: number;
}

/**
 * Pre-renders a soft radial glow texture ONCE onto an offscreen canvas so the main
 * animation loop blits with GPU `drawImage` and NEVER runs expensive per-frame `ctx.shadowBlur`!
 */
function createGlowSprite(innerColor: string, midColor: string, size = 128): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const g = c.getContext('2d');
  if (g) {
    const half = size / 2;
    const grad = g.createRadialGradient(half, half, 0, half, half, half);
    grad.addColorStop(0, innerColor);
    grad.addColorStop(0.32, midColor);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
  }
  return c;
}

/**
 * Draws a 3D shaded tapered capsule limb segment with realistic cylindrical lighting
 * (subsurface dermal gradient for human segments OR brushed titanium-chrome for robotic segments).
 */
function drawShadedCapsule(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  r1: number,
  x2: number,
  y2: number,
  r2: number,
  stops: [number, string][]
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const midX = (x1 + x2) * 0.5;
  const midY = (y1 + y2) * 0.5;
  const maxR = Math.max(r1, r2);

  const grad = ctx.createLinearGradient(
    midX + nx * maxR,
    midY + ny * maxR,
    midX - nx * maxR,
    midY - ny * maxR
  );
  for (const [offset, color] of stops) {
    grad.addColorStop(offset, color);
  }

  const angle = Math.atan2(dy, dx);
  ctx.save();
  ctx.beginPath();
  ctx.arc(x1, y1, r1, angle + Math.PI / 2, angle - Math.PI / 2, false);
  ctx.arc(x2, y2, r2, angle - Math.PI / 2, angle + Math.PI / 2, false);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();
}

export const FuturisticRobotCanvas: React.FC<FuturisticRobotCanvasProps> = ({
  themeMode,
  primaryHex,
  secondaryHex,
  accentHex,
  paused = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (paused) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    const isMobileHardware = Math.min(window.screen?.width || width, width) < 768;
    // Cap DPR strictly to keep mobile GPU cool and silky smooth
    const dpr = Math.min(window.devicePixelRatio || 1, isMobileHardware ? 1.35 : 1.75);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    // Pre-baked GPU glow sprites (ZERO shadowBlur in render loop!)
    const cyanGlowSprite = createGlowSprite(
      'rgba(224, 249, 255, 0.95)',
      'rgba(56, 189, 248, 0.42)',
      160
    );
    const violetGlowSprite = createGlowSprite(
      'rgba(224, 231, 255, 0.75)',
      'rgba(99, 102, 241, 0.34)',
      160
    );
    const warmSkinGlowSprite = createGlowSprite(
      'rgba(255, 237, 213, 0.72)',
      'rgba(251, 146, 60, 0.18)',
      128
    );

    const shockwaves: ShockwaveRing[] = [];
    const motes: EnergyMote[] = [];

    const droneCount = isMobileHardware ? 4 : 7;
    const drones: AmbientDrone[] = Array.from({ length: droneCount }, (_, i) => ({
      x: ((i + 0.5) / droneCount) * width,
      y: height * (0.14 + ((i * 37) % 68) / 100),
      vx: (i % 2 === 0 ? 1 : -1) * (0.18 + (i % 3) * 0.07),
      vy: (i % 2 === 0 ? -1 : 1) * (0.1 + (i % 2) * 0.06),
      scale: 0.72 + (i % 3) * 0.18,
      phase: i * 1.3,
    }));

    const emitTouchShockwave = (x: number, y: number, intensity = 1) => {
      if (shockwaves.length > 10) shockwaves.splice(0, shockwaves.length - 10);
      shockwaves.push(
        {
          x,
          y,
          radius: 6,
          maxRadius: Math.min(width, height) * 0.36 * intensity,
          alpha: 0.78,
          speed: 3.1,
          thickness: 2.6,
          hueHex: primaryHex || '#06b6d4',
        },
        {
          x,
          y,
          radius: 2,
          maxRadius: Math.min(width, height) * 0.24 * intensity,
          alpha: 0.58,
          speed: 2.0,
          thickness: 1.5,
          hueHex: secondaryHex || '#6366f1',
        }
      );

      const sparkBurst = isMobileHardware ? 8 : 16;
      for (let i = 0; i < sparkBurst; i++) {
        if (motes.length > 60) break;
        const ang = (Math.PI * 2 * i) / sparkBurst + (Math.random() - 0.5) * 0.35;
        const spd = 0.8 + Math.random() * 2.4;
        motes.push({
          x,
          y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          life: 0,
          maxLife: 42 + Math.random() * 28,
          size: 1.4 + Math.random() * 2.1,
          warm: i % 3 === 0,
        });
      }
    };

    const handlePointerDown = (ev: PointerEvent) => {
      emitTouchShockwave(ev.clientX, ev.clientY, 0.85);
    };

    let tabHidden = document.hidden;
    const handleVisibility = () => {
      tabHidden = document.hidden;
    };

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    document.addEventListener('visibilitychange', handleVisibility, { passive: true });

    const isLight = themeMode === 'light';
    const isCyber = themeMode === 'cyber';

    // Realistic Subsurface Human Skin Cylinder Gradient Stops
    const humanSkinStops: [number, string][] = isLight
      ? [
          [0.0, 'rgba(255, 224, 198, 0.62)'],
          [0.24, 'rgba(241, 184, 148, 0.68)'],
          [0.62, 'rgba(196, 129, 95, 0.66)'],
          [0.88, 'rgba(128, 74, 52, 0.60)'],
          [1.0, 'rgba(56, 189, 248, 0.35)'],
        ]
      : [
          [0.0, 'rgba(125, 211, 252, 0.42)'], // Cool cyan rim light from nexus!
          [0.14, 'rgba(255, 226, 202, 0.62)'], // Warm key-light dermal ridge
          [0.48, 'rgba(222, 158, 122, 0.58)'], // Natural warm flesh tone
          [0.82, 'rgba(134, 77, 54, 0.56)'], // Deep subsurface shadow
          [1.0, 'rgba(52, 26, 19, 0.62)'], // Core ambient occlusion
        ];

    const humanBackFingerStops: [number, string][] = [
      [0.0, 'rgba(214, 152, 118, 0.36)'],
      [0.55, 'rgba(132, 76, 54, 0.40)'],
      [1.0, 'rgba(46, 24, 18, 0.46)'],
    ];

    // Brushed Titanium-Chrome Cylindrical Metallic Gradient Stops
    const chromeArmorStops: [number, string][] = isLight
      ? [
          [0.0, 'rgba(15, 23, 42, 0.45)'],
          [0.25, 'rgba(248, 250, 252, 0.85)'],
          [0.45, 'rgba(148, 163, 184, 0.72)'],
          [0.78, 'rgba(30, 41, 59, 0.62)'],
          [1.0, 'rgba(56, 189, 248, 0.50)'],
        ]
      : [
          [0.0, 'rgba(56, 189, 248, 0.52)'], // Glowing cyan rim bounce
          [0.18, 'rgba(248, 250, 252, 0.72)'], // Bright chrome specular ridge
          [0.36, 'rgba(148, 163, 184, 0.56)'], // Brushed titanium midtone
          [0.68, 'rgba(30, 41, 59, 0.66)'], // Gunmetal core
          [1.0, 'rgba(7, 11, 22, 0.76)'], // Deep metallic shadow
        ];

    const carbonChassisStops: [number, string][] = [
      [0.0, 'rgba(71, 85, 105, 0.60)'],
      [0.45, 'rgba(15, 23, 42, 0.72)'],
      [1.0, 'rgba(2, 6, 23, 0.80)'],
    ];

    let rafId = 0;
    let lastFrameMs = 0;
    const targetIntervalMs = isMobileHardware ? 28 : 16; // Cool 35fps on mobile, 60fps desktop
    let hasTriggeredCycleTouch = false;

    const renderFrame = (nowMs: number) => {
      rafId = window.requestAnimationFrame(renderFrame);
      if (tabHidden) return;
      if (nowMs - lastFrameMs < targetIntervalMs) return;
      lastFrameMs = nowMs;

      const t = nowMs * 0.001;
      ctx.clearRect(0, 0, width, height);

      // Focal Point where Photorealistic Human Index Finger & Robotic Index Finger Meet
      const nexusX = width * 0.52;
      const nexusY = height * 0.46;
      const scaleUnit = Math.max(0.56, Math.min(1.08, Math.min(width, height) / 900));

      // Smooth 6.4s breath cycle: approach -> luminous fingertip touch -> gentle recoil
      const cycle = (t % 6.4) / 6.4;
      // Peak touch happens cleanly around cycle = 0.5
      const proximity = Math.pow(Math.sin(cycle * Math.PI), 1.6); // 0 -> 1 -> 0
      const separation = (1 - proximity) * (46 * scaleUnit);

      if (proximity > 0.965 && !hasTriggeredCycleTouch) {
        hasTriggeredCycleTouch = true;
        emitTouchShockwave(nexusX, nexusY, 1.05);
      } else if (proximity < 0.75) {
        hasTriggeredCycleTouch = false;
      }

      // 1. Subtle Ambient Studio Backlight behind Focal Nexus
      const ambientSize = (260 + proximity * 140) * scaleUnit;
      ctx.globalAlpha = isLight ? 0.35 : 0.48;
      ctx.drawImage(
        violetGlowSprite,
        nexusX - ambientSize * 0.5,
        nexusY - ambientSize * 0.5,
        ambientSize,
        ambientSize
      );
      ctx.globalAlpha = 1;

      // 2. Depth-of-Field Micro-Robotic Orbital Drones & Soft Neural Links
      for (let i = 0; i < drones.length; i++) {
        const d = drones[i];
        d.x += d.vx;
        d.y += d.vy + Math.sin(t * 0.9 + d.phase) * 0.12;
        if (d.x < -40) d.x = width + 40;
        if (d.x > width + 40) d.x = -40;
        if (d.y < 30) d.vy = Math.abs(d.vy);
        if (d.y > height - 30) d.vy = -Math.abs(d.vy);

        // Soft optical telemetry connection between nearby drones
        for (let j = i + 1; j < drones.length; j++) {
          const d2 = drones[j];
          const dist = Math.hypot(d2.x - d.x, d2.y - d.y);
          if (dist < 260) {
            ctx.strokeStyle = isCyber
              ? `rgba(0, 245, 212, ${(1 - dist / 260) * 0.12})`
              : `rgba(56, 189, 248, ${(1 - dist / 260) * 0.11})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(d.x, d.y);
            ctx.lineTo(d2.x, d2.y);
            ctx.stroke();
          }
        }

        // Photorealistic shaded brushed-metal drone pod
        const r = 11 * d.scale * scaleUnit;
        drawShadedCapsule(
          ctx,
          d.x - r * 0.8,
          d.y,
          r * 0.72,
          d.x + r * 0.8,
          d.y,
          r * 0.72,
          chromeArmorStops
        );
        ctx.drawImage(cyanGlowSprite, d.x - r * 1.4, d.y - r * 1.4, r * 2.8, r * 2.8);
      }

      // =========================================================================
      // 3. PHOTOREALISTIC VOLUMETRIC HUMAN HAND & EXTENDED INDEX FINGER (LEFT)
      // =========================================================================
      const hTipX = nexusX - separation;
      const hTipY = nexusY + Math.sin(t * 1.4) * 2.2;

      // Anatomical joint chain backwards from Human Index Fingertip -> DIP -> PIP -> MCP -> Wrist -> Forearm
      const hDipX = hTipX - 24 * scaleUnit;
      const hDipY = hTipY - 3 * scaleUnit;
      const hPipX = hDipX - 30 * scaleUnit;
      const hPipY = hDipY - 6 * scaleUnit;
      const hMcpX = hPipX - 38 * scaleUnit;
      const hMcpY = hPipY - 7 * scaleUnit;
      const hWristX = hMcpX - 96 * scaleUnit;
      const hWristY = hMcpY + 24 * scaleUnit;
      const hForearmX = hWristX - 185 * scaleUnit;
      const hForearmY = hWristY + 62 * scaleUnit;

      // Subtle warm dermal glow around human hand
      ctx.globalAlpha = 0.34;
      ctx.drawImage(
        warmSkinGlowSprite,
        hMcpX - 90 * scaleUnit,
        hMcpY - 75 * scaleUnit,
        210 * scaleUnit,
        170 * scaleUnit
      );
      ctx.globalAlpha = 1;

      // Background curled middle, ring & little fingers (volumetric depth layer)
      for (let f = 0; f < 3; f++) {
        const offY = (f + 1) * 14 * scaleUnit;
        const baseKx = hMcpX - f * 7 * scaleUnit;
        const baseKy = hMcpY + offY;
        const midFx = baseKx + 34 * scaleUnit;
        const midFy = baseKy + 14 * scaleUnit;
        const curlX = midFx - 8 * scaleUnit;
        const curlY = midFy + 22 * scaleUnit;

        drawShadedCapsule(
          ctx,
          baseKx,
          baseKy,
          10.5 * scaleUnit,
          midFx,
          midFy,
          8.5 * scaleUnit,
          humanBackFingerStops
        );
        drawShadedCapsule(
          ctx,
          midFx,
          midFy,
          8.2 * scaleUnit,
          curlX,
          curlY,
          6.8 * scaleUnit,
          humanBackFingerStops
        );
      }

      // Natural Shaded Forearm -> Wrist -> Palm Volume
      drawShadedCapsule(
        ctx,
        hForearmX,
        hForearmY,
        42 * scaleUnit,
        hWristX,
        hWristY,
        30 * scaleUnit,
        humanSkinStops
      );
      drawShadedCapsule(
        ctx,
        hWristX,
        hWristY,
        31 * scaleUnit,
        hMcpX - 6 * scaleUnit,
        hMcpY + 18 * scaleUnit,
        28 * scaleUnit,
        humanSkinStops
      );

      // Natural Thumb Curve beneath Palm
      const hThumbMidX = hMcpX - 24 * scaleUnit;
      const hThumbMidY = hMcpY + 42 * scaleUnit;
      const hThumbTipX = hMcpX + 18 * scaleUnit;
      const hThumbTipY = hMcpY + 49 * scaleUnit;
      drawShadedCapsule(
        ctx,
        hWristX + 34 * scaleUnit,
        hWristY + 14 * scaleUnit,
        15 * scaleUnit,
        hThumbMidX,
        hThumbMidY,
        11.5 * scaleUnit,
        humanSkinStops
      );
      drawShadedCapsule(
        ctx,
        hThumbMidX,
        hThumbMidY,
        11 * scaleUnit,
        hThumbTipX,
        hThumbTipY,
        8.5 * scaleUnit,
        humanSkinStops
      );

      // Extended Photorealistic Human Index Finger (3 shaded phalanges + glossy fingernail)
      drawShadedCapsule(
        ctx,
        hMcpX,
        hMcpY,
        12.5 * scaleUnit,
        hPipX,
        hPipY,
        10.4 * scaleUnit,
        humanSkinStops
      );
      drawShadedCapsule(
        ctx,
        hPipX,
        hPipY,
        10.2 * scaleUnit,
        hDipX,
        hDipY,
        8.6 * scaleUnit,
        humanSkinStops
      );
      drawShadedCapsule(
        ctx,
        hDipX,
        hDipY,
        8.5 * scaleUnit,
        hTipX - 4 * scaleUnit,
        hTipY,
        7.0 * scaleUnit,
        humanSkinStops
      );

      // Realistic glossy fingernail highlight on upper tip of human index finger
      ctx.save();
      ctx.fillStyle = 'rgba(255, 244, 236, 0.45)';
      ctx.beginPath();
      ctx.ellipse(
        hTipX - 6.5 * scaleUnit,
        hTipY - 3.6 * scaleUnit,
        5.5 * scaleUnit,
        2.2 * scaleUnit,
        0.14,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.restore();

      // =========================================================================
      // 4. PHOTOREALISTIC TITANIUM-CHROME ROBOTIC HAND & INDEX FINGER (RIGHT)
      // =========================================================================
      const rTipX = nexusX + separation;
      const rTipY = nexusY - Math.sin(t * 1.4) * 2.2;

      const rDipX = rTipX + 25 * scaleUnit;
      const rDipY = rTipY + 2 * scaleUnit;
      const rPipX = rDipX + 32 * scaleUnit;
      const rPipY = rDipY + 6 * scaleUnit;
      const rMcpX = rPipX + 40 * scaleUnit;
      const rMcpY = rPipY + 8 * scaleUnit;
      const rWristX = rMcpX + 102 * scaleUnit;
      const rWristY = rMcpY + 24 * scaleUnit;
      const rForearmX = rWristX + 195 * scaleUnit;
      const rForearmY = rWristY + 66 * scaleUnit;

      // Carbon-fiber inner chassis core
      drawShadedCapsule(
        ctx,
        rForearmX,
        rForearmY,
        44 * scaleUnit,
        rWristX,
        rWristY,
        28 * scaleUnit,
        carbonChassisStops
      );

      // Sculpted Brushed Titanium-Chrome Forearm Plates + Hydraulic Pistons
      drawShadedCapsule(
        ctx,
        rForearmX - 18 * scaleUnit,
        rForearmY - 12 * scaleUnit,
        36 * scaleUnit,
        rWristX + 12 * scaleUnit,
        rWristY - 6 * scaleUnit,
        24 * scaleUnit,
        chromeArmorStops
      );
      // Secondary lower titanium piston strut
      drawShadedCapsule(
        ctx,
        rForearmX - 30 * scaleUnit,
        rForearmY + 20 * scaleUnit,
        9 * scaleUnit,
        rWristX + 8 * scaleUnit,
        rWristY + 14 * scaleUnit,
        7 * scaleUnit,
        chromeArmorStops
      );

      // Curled Robotic Secondary Fingers in Background Depth
      for (let f = 0; f < 3; f++) {
        const offY = (f + 1) * 14.5 * scaleUnit;
        const kX = rMcpX + f * 7 * scaleUnit;
        const kY = rMcpY + offY;
        const mX = kX - 35 * scaleUnit;
        const mY = kY + 13 * scaleUnit;
        const cX = mX + 9 * scaleUnit;
        const cY = mY + 22 * scaleUnit;

        drawShadedCapsule(
          ctx,
          kX,
          kY,
          10 * scaleUnit,
          mX,
          mY,
          8 * scaleUnit,
          carbonChassisStops
        );
        drawShadedCapsule(
          ctx,
          mX,
          mY,
          7.8 * scaleUnit,
          cX,
          cY,
          6.2 * scaleUnit,
          chromeArmorStops
        );
      }

      // Robotic Palm Metacarpo-Chassis
      drawShadedCapsule(
        ctx,
        rWristX,
        rWristY,
        29 * scaleUnit,
        rMcpX + 6 * scaleUnit,
        rMcpY + 18 * scaleUnit,
        26 * scaleUnit,
        chromeArmorStops
      );

      // Opposing Cybernetic Thumb
      const rThumbMidX = rMcpX + 22 * scaleUnit;
      const rThumbMidY = rMcpY + 43 * scaleUnit;
      const rThumbTipX = rMcpX - 20 * scaleUnit;
      const rThumbTipY = rMcpY + 49 * scaleUnit;
      drawShadedCapsule(
        ctx,
        rWristX - 30 * scaleUnit,
        rWristY + 15 * scaleUnit,
        14 * scaleUnit,
        rThumbMidX,
        rThumbMidY,
        10.5 * scaleUnit,
        carbonChassisStops
      );
      drawShadedCapsule(
        ctx,
        rThumbMidX,
        rThumbMidY,
        10.5 * scaleUnit,
        rThumbTipX,
        rThumbTipY,
        7.8 * scaleUnit,
        chromeArmorStops
      );

      // Extended Precision Titanium-Chrome Robotic Index Finger
      drawShadedCapsule(
        ctx,
        rMcpX,
        rMcpY,
        12.2 * scaleUnit,
        rPipX,
        rPipY,
        9.8 * scaleUnit,
        chromeArmorStops
      );
      drawShadedCapsule(
        ctx,
        rPipX,
        rPipY,
        9.4 * scaleUnit,
        rDipX,
        rDipY,
        8.0 * scaleUnit,
        carbonChassisStops
      );
      drawShadedCapsule(
        ctx,
        rDipX,
        rDipY,
        8.0 * scaleUnit,
        rTipX + 4 * scaleUnit,
        rTipY,
        6.4 * scaleUnit,
        chromeArmorStops
      );

      // Glowing Optical Servo Joints along Robotic Hand & Finger (GPU sprite blits!)
      const servoJoints: [number, number, number][] = [
        [rWristX, rWristY, 26 * scaleUnit],
        [rMcpX, rMcpY, 20 * scaleUnit],
        [rPipX, rPipY, 15 * scaleUnit],
        [rDipX, rDipY, 12 * scaleUnit],
        [rTipX + 3 * scaleUnit, rTipY, 16 * scaleUnit],
      ];
      for (const [jx, jy, jSize] of servoJoints) {
        ctx.drawImage(cyanGlowSprite, jx - jSize, jy - jSize, jSize * 2, jSize * 2);
        ctx.fillStyle = '#e0f2fe';
        ctx.beginPath();
        ctx.arc(jx, jy, Math.max(1.8, jSize * 0.14), 0, Math.PI * 2);
        ctx.fill();
      }

      // =========================================================================
      // 5. FOCAL NEXUS PLASMA FILAMENT & TRANSLUCENT DIGITAL SHOCKWAVES
      // =========================================================================
      const midTouchX = (hTipX + rTipX) * 0.5;
      const midTouchY = (hTipY + rTipY) * 0.5;

      // Luminous energy bridge between fingertips as they converge
      if (proximity > 0.35) {
        const bridgeAlpha = (proximity - 0.35) / 0.65;
        ctx.strokeStyle = `rgba(186, 230, 253, ${bridgeAlpha * 0.85})`;
        ctx.lineWidth = (1.5 + bridgeAlpha * 2.5) * scaleUnit;
        ctx.beginPath();
        ctx.moveTo(hTipX, hTipY);
        ctx.quadraticCurveTo(
          midTouchX,
          midTouchY + Math.sin(t * 14) * 3 * (1 - proximity),
          rTipX,
          rTipY
        );
        ctx.stroke();

        const coreSize = (42 + bridgeAlpha * 88) * scaleUnit;
        ctx.globalAlpha = bridgeAlpha * 0.9;
        ctx.drawImage(
          cyanGlowSprite,
          midTouchX - coreSize * 0.5,
          midTouchY - coreSize * 0.5,
          coreSize,
          coreSize
        );
        ctx.globalAlpha = 1;
      }

      // Render Expanding Translucent Glass Digital Shockwaves
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i];
        sw.radius += sw.speed;
        const progress = sw.radius / sw.maxRadius;
        sw.alpha = Math.max(0, (1 - progress) * 0.72);

        if (sw.radius >= sw.maxRadius || sw.alpha <= 0.01) {
          shockwaves.splice(i, 1);
          continue;
        }

        ctx.save();
        // Outer crisp refractive rim
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = sw.hueHex || accentHex || '#38bdf8';
        ctx.globalAlpha = sw.alpha;
        ctx.lineWidth = sw.thickness * (1 - progress * 0.55);
        ctx.stroke();

        // Inner translucent glass halo band
        if (sw.radius > 10) {
          ctx.beginPath();
          ctx.arc(sw.x, sw.y, sw.radius * 0.92, 0, Math.PI * 2);
          ctx.strokeStyle = '#ffffff';
          ctx.globalAlpha = sw.alpha * 0.32;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        ctx.restore();
      }

      // Render Floating Micro-Energy Embers
      for (let i = motes.length - 1; i >= 0; i--) {
        const m = motes[i];
        m.life += 1;
        m.x += m.vx;
        m.y += m.vy;
        m.vx *= 0.97;
        m.vy *= 0.97;

        if (m.life >= m.maxLife) {
          motes.splice(i, 1);
          continue;
        }

        const fade = 1 - m.life / m.maxLife;
        ctx.globalAlpha = fade * 0.85;
        ctx.fillStyle = m.warm ? '#fed7aa' : '#7dd3fc';
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.size * fade, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    rafId = window.requestAnimationFrame(renderFrame);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [themeMode, primaryHex, secondaryHex, accentHex, paused]);

  if (paused) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[1] block"
      style={{
        transform: 'translate3d(0, 0, 0)',
        willChange: 'transform',
      }}
    />
  );
};
