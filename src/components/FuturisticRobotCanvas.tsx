import React, { useEffect, useRef } from 'react';
import { ThemeMode } from '../types/cms';

interface FuturisticRobotCanvasProps {
  themeMode: ThemeMode;
  primaryHex: string;
  secondaryHex: string;
  accentHex: string;
  robotDensity?: number;
  rippleIntensity?: number;
}

interface EnergyRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  speed: number;
  color: string;
}

interface SparkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

interface NanoRobot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  scale: number;
  phase: number;
  armPhase: number;
}

interface NeuralNode {
  rx: number; // normalized 0..1
  ry: number; // normalized 0..1
  vx: number;
  vy: number;
  radius: number;
  pulse: number;
}

export function triggerSignatureFingerTouch() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('swiftstack:trigger-touch'));
  }
}

export const FuturisticRobotCanvas: React.FC<FuturisticRobotCanvasProps> = ({
  themeMode,
  primaryHex,
  secondaryHex,
  accentHex,
  robotDensity = 9,
  rippleIntensity = 1.0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let scrollY = window.scrollY;
    const pointer = { x: width * 0.65, y: height * 0.36, active: false };

    const isGlassLight = themeMode === 'glass';

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    // Initialize Glowing Neural Circuit Nodes
    const nodeCount = 46;
    const nodes: NeuralNode[] = Array.from({ length: nodeCount }, (_, i) => ({
      rx: ((i * 0.6180339) % 1) * 0.92 + 0.04,
      ry: (((i * 0.381966) + i / nodeCount) % 1) * 0.92 + 0.04,
      vx: (Math.random() - 0.5) * 0.00022,
      vy: (Math.random() - 0.5) * 0.00022,
      radius: 1.8 + (i % 3) * 0.85,
      pulse: 0,
    }));

    // Initialize Autonomous Futuristic Micro-Robots
    const count = Math.max(4, Math.min(16, Math.round(robotDensity)));
    const robots: NanoRobot[] = Array.from({ length: count }, (_, idx) => {
      const speed = 0.28 + (idx % 4) * 0.12;
      const dir = (idx / count) * Math.PI * 2;
      return {
        x: ((idx + 0.5) / count) * width,
        y: (((idx * 0.73) % 1) * 0.85 + 0.08) * height,
        vx: Math.cos(dir) * speed,
        vy: Math.sin(dir) * speed,
        angle: dir,
        scale: 0.72 + (idx % 3) * 0.16,
        phase: idx * 1.4,
        armPhase: idx * 0.9,
      };
    });

    const ripples: EnergyRipple[] = [];
    const sparks: SparkParticle[] = [];

    let touchCycleStart = performance.now() - 5200; // First touch happens ~1.3s after page load!
    const CYCLE_DURATION_MS = 6600;
    let lastTouchFiredCycle = -1;

    const getFocalNexus = () => {
      const parallax = Math.min(height * 0.18, scrollY * 0.1);
      const nx = width >= 1024 ? width * 0.73 : width * 0.52;
      const ny = Math.max(height * 0.22, height * 0.37 - parallax * 0.35);
      return { nx, ny };
    };

    const spawnTouchRipples = (x: number, y: number, strength = 1) => {
      const maxR = Math.min(width, height) * 0.44 * rippleIntensity;
      const palette = isGlassLight
        ? [primaryHex, '#06b6d4', secondaryHex]
        : ['#22d3ee', primaryHex, secondaryHex];

      palette.forEach((col, i) => {
        ripples.push({
          x,
          y,
          radius: 4 + i * 11,
          maxRadius: maxR * (1 - i * 0.16),
          alpha: (isGlassLight ? 0.52 : 0.68) * strength,
          speed: 2.35 - i * 0.36,
          color: col,
        });
      });

      // Harmonic micro-sparks radiating gracefully from contact point
      for (let s = 0; s < 16; s++) {
        const ang = (s / 16) * Math.PI * 2 + Math.random() * 0.25;
        const spd = 0.9 + Math.random() * 1.9;
        sparks.push({
          x,
          y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          life: 0,
          maxLife: 42 + Math.random() * 24,
          size: 1.4 + Math.random() * 1.6,
        });
      }
    };

    const onTriggerTouch = () => {
      // Jump smoothly right to the exact finger-touch moment
      touchCycleStart = performance.now() - CYCLE_DURATION_MS * 0.5;
      lastTouchFiredCycle = -999;
      const { nx, ny } = getFocalNexus();
      spawnTouchRipples(nx, ny, 1.15);
    };

    const onScroll = () => {
      scrollY = window.scrollY;
    };

    const onMouseMove = (e: MouseEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
    };

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('swiftstack:trigger-touch', onTriggerTouch);

    // Draw Sleek Articulated 6-Axis Peripheral Robotic Arm
    const drawRoboticArm = (
      baseX: number,
      baseY: number,
      targetX: number,
      targetY: number,
      flip: number,
      t: number,
      strokeCol: string,
      jointCol: string
    ) => {
      const L1 = Math.min(width, height) * 0.15;
      const L2 = Math.min(width, height) * 0.13;

      const dx = targetX - baseX;
      const dy = targetY - baseY;
      const dist = Math.min(L1 + L2 - 8, Math.max(30, Math.hypot(dx, dy)));
      const baseAngle = Math.atan2(dy, dx);

      const cosElbow = Math.min(
        1,
        Math.max(-1, (L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist))
      );
      const shoulderOffset = Math.acos(cosElbow) * flip;
      const a1 = baseAngle + shoulderOffset;

      const elbowX = baseX + Math.cos(a1) * L1;
      const elbowY = baseY + Math.sin(a1) * L1;
      const a2 = Math.atan2(targetY - elbowY, targetX - elbowX);
      const wristX = elbowX + Math.cos(a2) * L2;
      const wristY = elbowY + Math.sin(a2) * L2;

      ctx.save();
      // Base mount pedestal
      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(baseX, baseY, 10, 0, Math.PI * 2);
      ctx.stroke();

      // Upper arm dual structural struts
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(baseX, baseY);
      ctx.lineTo(elbowX, elbowY);
      ctx.stroke();

      // Forearm precision link
      ctx.lineWidth = 2.3;
      ctx.beginPath();
      ctx.moveTo(elbowX, elbowY);
      ctx.lineTo(wristX, wristY);
      ctx.stroke();

      // Articulated precision micro-pincers
      const pinch = 0.22 + Math.sin(t * 2.4) * 0.09;
      ctx.lineWidth = 1.6;
      [-1, 1].forEach((side) => {
        const ga = a2 + side * pinch;
        ctx.beginPath();
        ctx.moveTo(wristX, wristY);
        ctx.lineTo(wristX + Math.cos(ga) * 15, wristY + Math.sin(ga) * 15);
        ctx.stroke();
      });

      // Glowing servo joints
      [
        { x: baseX, y: baseY, r: 4 },
        { x: elbowX, y: elbowY, r: 4.5 },
        { x: wristX, y: wristY, r: 3.5 },
      ].forEach((j) => {
        ctx.fillStyle = jointCol;
        ctx.beginPath();
        ctx.arc(j.x, j.y, j.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Delicate scanning beam to target waypoint
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = jointCol;
      ctx.globalAlpha = isGlassLight ? 0.26 : 0.34;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(wristX + Math.cos(a2) * 15, wristY + Math.sin(a2) * 15);
      ctx.lineTo(targetX, targetY);
      ctx.stroke();
      ctx.restore();
    };

    // Draw Sleek Microscopic Autonomous Robot Drone
    const drawNanoRobot = (bot: NanoRobot, strokeCol: string, eyeCol: string) => {
      ctx.save();
      ctx.translate(bot.x, bot.y);
      ctx.rotate(bot.angle);
      ctx.scale(bot.scale, bot.scale);

      // Soft ion propulsion tail
      const tailGrad = ctx.createLinearGradient(-22, 0, -6, 0);
      tailGrad.addColorStop(0, 'rgba(6, 182, 212, 0)');
      tailGrad.addColorStop(1, isGlassLight ? 'rgba(2, 132, 199, 0.28)' : 'rgba(34, 211, 238, 0.36)');
      ctx.strokeStyle = tailGrad;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-22, 0);
      ctx.lineTo(-7, 0);
      ctx.stroke();

      // Rounded futuristic chassis
      ctx.strokeStyle = strokeCol;
      ctx.fillStyle = isGlassLight ? 'rgba(255, 255, 255, 0.75)' : 'rgba(15, 23, 42, 0.78)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-8, -6, 16, 12, 5);
      ctx.fill();
      ctx.stroke();

      // Micro-manipulator arms
      const wave = Math.sin(bot.armPhase) * 2.5;
      ctx.lineWidth = 1.15;
      ctx.beginPath();
      ctx.moveTo(5, -5);
      ctx.lineTo(13, -7 + wave * 0.4);
      ctx.moveTo(5, 5);
      ctx.lineTo(13, 7 - wave * 0.4);
      ctx.stroke();

      // Dual glowing optical sensors
      ctx.fillStyle = eyeCol;
      ctx.beginPath();
      ctx.arc(4, -2.4, 1.5, 0, Math.PI * 2);
      ctx.arc(4, 2.4, 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    // =========================================================================
    // ICONIC FOCAL INTERACTION: GRACEFUL HUMAN HAND INDEX <-> ROBOTIC HAND INDEX
    // =========================================================================
    const drawHumanHandIndex = (tipX: number, tipY: number, scale: number, glowAlpha: number) => {
      ctx.save();
      ctx.translate(tipX, tipY);
      ctx.rotate(-0.14);
      ctx.scale(scale, scale);

      const strokeMain = isGlassLight
        ? `rgba(15, 23, 42, ${0.28 + glowAlpha * 0.22})`
        : `rgba(226, 232, 240, ${0.34 + glowAlpha * 0.26})`;
      const rimGlow = isGlassLight
        ? `rgba(2, 132, 199, ${0.32 + glowAlpha * 0.35})`
        : `rgba(103, 232, 249, ${0.42 + glowAlpha * 0.38})`;

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Organic Human Index Finger + Dorsal Hand + Thumb + Wrist Contour (tip is strictly at 0,0!)
      const traceHumanContour = () => {
        ctx.beginPath();
        // Start upper wrist -> back of hand -> extended index upper edge -> fingertip (0,0)
        ctx.moveTo(-195, -24);
        ctx.bezierCurveTo(-150, -26, -112, -32, -78, -22);
        ctx.bezierCurveTo(-52, -16, -24, -9, -3, -3.5);
        // Rounded human index fingertip pad touching (0, 0)
        ctx.bezierCurveTo(1.2, -1.2, 1.2, 2.8, -4, 5.2);
        // Underside of extended index finger (3 subtle phalanx curves)
        ctx.bezierCurveTo(-22, 8.5, -45, 9.5, -66, 11);
        // Softly curled middle & ring finger silhouettes beneath palm
        ctx.bezierCurveTo(-54, 17, -56, 26, -72, 26);
        ctx.bezierCurveTo(-63, 32, -68, 39, -84, 37);
        // Graceful relaxed thumb contour & lower palm to lower wrist
        ctx.bezierCurveTo(-68, 44, -56, 52, -66, 56);
        ctx.bezierCurveTo(-84, 57, -106, 42, -132, 30);
        ctx.bezierCurveTo(-156, 22, -178, 20, -198, 20);
      };

      // Luminous dermal rim glow
      ctx.strokeStyle = rimGlow;
      ctx.lineWidth = 4.2;
      ctx.globalAlpha = 0.45;
      traceHumanContour();
      ctx.stroke();

      // Crisp primary anatomical contour
      ctx.globalAlpha = 1;
      ctx.strokeStyle = strokeMain;
      ctx.lineWidth = 1.85;
      traceHumanContour();
      ctx.stroke();

      // Subtle fingertip bio-energy node
      ctx.fillStyle = isGlassLight ? '#0284c7' : '#67e8f9';
      ctx.globalAlpha = 0.55 + glowAlpha * 0.45;
      ctx.beginPath();
      ctx.arc(-2, 0.8, 2.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const drawRoboticHandIndex = (tipX: number, tipY: number, scale: number, glowAlpha: number) => {
      ctx.save();
      ctx.translate(tipX, tipY);
      ctx.rotate(0.14);
      ctx.scale(scale, scale);

      const mechStroke = isGlassLight
        ? `rgba(2, 132, 199, ${0.38 + glowAlpha * 0.28})`
        : `rgba(34, 211, 238, ${0.44 + glowAlpha * 0.34})`;
      const chassisFill = isGlassLight
        ? 'rgba(255, 255, 255, 0.55)'
        : 'rgba(15, 23, 42, 0.62)';

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = mechStroke;
      ctx.fillStyle = chassisFill;
      ctx.lineWidth = 1.75;

      // Precision 3-segment cybernetic index phalanges extending from palm to exact tip (0,0)
      const joints = [
        { x: 0, y: 0 }, // Distal fingertip sensor
        { x: 24, y: -1.5 }, // DIP micro-servo
        { x: 50, y: -3.5 }, // PIP servo
        { x: 80, y: -6 }, // MCP knuckle joint
      ];

      // Segmented index finger plates
      for (let i = 0; i < joints.length - 1; i++) {
        const a = joints[i];
        const b = joints[i + 1];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y - (2.4 + i * 1.1));
        ctx.lineTo(b.x, b.y - (3.4 + i * 1.2));
        ctx.lineTo(b.x, b.y + (3.6 + i * 1.2));
        ctx.lineTo(a.x, a.y + (2.4 + i * 1.1));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Sleek angular cybernetic chassis / metacarpal housing + forearm struts
      ctx.beginPath();
      ctx.moveTo(80, -14);
      ctx.lineTo(132, -22);
      ctx.lineTo(202, -18);
      ctx.moveTo(80, 8);
      ctx.lineTo(106, 26);
      ctx.lineTo(140, 26);
      ctx.lineTo(202, 20);
      ctx.stroke();

      // Folded secondary robotic finger actuators + thumb piston
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(78, 8);
      ctx.lineTo(60, 17);
      ctx.lineTo(74, 24);
      ctx.moveTo(86, 16);
      ctx.lineTo(68, 26);
      ctx.lineTo(82, 33);
      // Opposing cybernetic thumb strut
      ctx.moveTo(108, 24);
      ctx.lineTo(76, 44);
      ctx.lineTo(60, 40);
      ctx.stroke();

      // Internal hydraulic/optical telemetry bus line along forearm
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(82, -2);
      ctx.lineTo(196, 1);
      ctx.stroke();
      ctx.setLineDash([]);

      // Glowing cyan optical joints at every knuckle & wrist node
      const servoPoints = [
        ...joints,
        { x: 132, y: -2 },
        { x: 76, y: 44 },
      ];
      servoPoints.forEach((pt, idx) => {
        ctx.fillStyle = idx === 0 ? accentHex : primaryHex;
        ctx.globalAlpha = idx === 0 ? 0.8 + glowAlpha * 0.2 : 0.65;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, idx === 0 ? 2.9 : 2.3, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
    };

    const render = (now: number) => {
      const t = now * 0.001;
      ctx.clearRect(0, 0, width, height);

      const lineBaseCol = isGlassLight
        ? 'rgba(2, 132, 199, 0.14)'
        : themeMode === 'cyber'
          ? 'rgba(0, 245, 212, 0.16)'
          : 'rgba(34, 211, 238, 0.14)';

      const robotStroke = isGlassLight
        ? 'rgba(15, 23, 42, 0.34)'
        : themeMode === 'cyber'
          ? 'rgba(0, 245, 212, 0.42)'
          : 'rgba(148, 163, 184, 0.36)';

      const { nx, ny } = getFocalNexus();

      // 1. Update & Draw Glowing Neural Circuit Network
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.rx += n.vx;
        n.ry += n.vy;
        if (n.rx < 0.02 || n.rx > 0.98) n.vx *= -1;
        if (n.ry < 0.02 || n.ry > 0.98) n.vy *= -1;
        n.pulse = Math.max(0, n.pulse - 0.022);
      }

      const maxLinkDist = Math.min(width, height) * 0.19;
      for (let i = 0; i < nodes.length; i++) {
        const ax = nodes[i].rx * width;
        const ay = nodes[i].ry * height;

        for (let j = i + 1; j < nodes.length; j++) {
          const bx = nodes[j].rx * width;
          const by = nodes[j].ry * height;
          const d = Math.hypot(ax - bx, ay - by);
          if (d < maxLinkDist) {
            const boost = (nodes[i].pulse + nodes[j].pulse) * 0.35;
            const alpha = (1 - d / maxLinkDist) * (isGlassLight ? 0.16 : 0.2) + boost;
            ctx.strokeStyle = isGlassLight
              ? `rgba(2, 132, 199, ${Math.min(0.48, alpha)})`
              : `rgba(34, 211, 238, ${Math.min(0.55, alpha)})`;
            ctx.lineWidth = 1 + boost;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.stroke();
          }
        }

        // Cursor interactive node filament
        if (pointer.active) {
          const pd = Math.hypot(ax - pointer.x, ay - pointer.y);
          if (pd < maxLinkDist * 1.1) {
            ctx.strokeStyle = isGlassLight
              ? `rgba(79, 70, 229, ${(1 - pd / (maxLinkDist * 1.1)) * 0.22})`
              : `rgba(34, 211, 238, ${(1 - pd / (maxLinkDist * 1.1)) * 0.28})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(pointer.x, pointer.y);
            ctx.stroke();
          }
        }

        ctx.fillStyle = isGlassLight
          ? `rgba(2, 132, 199, ${0.32 + nodes[i].pulse * 0.55})`
          : `rgba(103, 232, 249, ${0.38 + nodes[i].pulse * 0.55})`;
        ctx.beginPath();
        ctx.arc(ax, ay, nodes[i].radius + nodes[i].pulse * 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Peripheral Articulated 6-Axis Robotic Arms
      if (width >= 768) {
        drawRoboticArm(
          26,
          height * 0.78,
          width * 0.14 + Math.sin(t * 0.7) * 38,
          height * 0.62 + Math.cos(t * 0.9) * 32,
          -1,
          t,
          lineBaseCol.replace('0.14', '0.3'),
          primaryHex
        );
        drawRoboticArm(
          width - 26,
          height * 0.82,
          width * 0.86 + Math.cos(t * 0.65) * 38,
          height * 0.66 + Math.sin(t * 0.85) * 32,
          1,
          t + 1.5,
          lineBaseCol.replace('0.14', '0.3'),
          accentHex
        );
      }

      // 3. Autonomous Microscopic Futuristic Robots
      for (const bot of robots) {
        bot.phase += 0.015;
        bot.armPhase += 0.08;
        const steer = Math.sin(bot.phase) * 0.012;
        const spd = Math.hypot(bot.vx, bot.vy);
        const curAng = Math.atan2(bot.vy, bot.vx) + steer;
        bot.vx = Math.cos(curAng) * spd;
        bot.vy = Math.sin(curAng) * spd;
        bot.x += bot.vx;
        bot.y += bot.vy;
        bot.angle = curAng;

        if (bot.x < -30) bot.x = width + 30;
        if (bot.x > width + 30) bot.x = -30;
        if (bot.y < -30) bot.y = height + 30;
        if (bot.y > height + 30) bot.y = -30;

        drawNanoRobot(bot, robotStroke, primaryHex);
      }

      // 4. Focal Point Interaction: Human Index Finger <-> Robotic Index Finger + Touch Energy Ripple
      const elapsed = now - touchCycleStart;
      const cycleIndex = Math.floor(elapsed / CYCLE_DURATION_MS);
      const progress = (elapsed % CYCLE_DURATION_MS) / CYCLE_DURATION_MS; // 0..1, touch happens cleanly at progress = 0.50

      // Smooth cosine approach curve: max separation ~44px at 0.0/1.0 -> 0.0px kiss at progress = 0.50
      const approachWave = 0.5 + 0.5 * Math.cos(progress * Math.PI * 2); // 1 -> 0 at 0.5 -> 1
      const separation = Math.pow(approachWave, 1.35) * 44;
      const proximityGlow = Math.max(0, 1 - separation / 26);

      if (progress >= 0.495 && progress <= 0.54 && lastTouchFiredCycle !== cycleIndex) {
        lastTouchFiredCycle = cycleIndex;
        spawnTouchRipples(nx, ny, 1.0);
      }

      const handScale = width < 640 ? 0.68 : width < 1024 ? 0.85 : 1.02;
      const humanTipX = nx - separation * 0.5;
      const humanTipY = ny + separation * 0.06;
      const robotTipX = nx + separation * 0.5;
      const robotTipY = ny - separation * 0.06;

      drawHumanHandIndex(humanTipX, humanTipY, handScale, proximityGlow);
      drawRoboticHandIndex(robotTipX, robotTipY, handScale, proximityGlow);

      // Delicate bio-digital plasma arc bridging the two fingertips as they approach (< 24px)
      if (separation < 26) {
        ctx.save();
        ctx.strokeStyle = isGlassLight ? primaryHex : '#67e8f9';
        ctx.globalAlpha = proximityGlow * 0.72;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(humanTipX, humanTipY);
        const midX = (humanTipX + robotTipX) * 0.5;
        const midY = (humanTipY + robotTipY) * 0.5 + Math.sin(t * 26) * 2.5;
        ctx.quadraticCurveTo(midX, midY, robotTipX, robotTipY);
        ctx.stroke();

        // Soft glowing contact halo right at nexus
        const glowGrad = ctx.createRadialGradient(nx, ny, 0, nx, ny, 34);
        glowGrad.addColorStop(
          0,
          isGlassLight
            ? `rgba(6, 182, 212, ${0.42 * proximityGlow})`
            : `rgba(103, 232, 249, ${0.58 * proximityGlow})`
        );
        glowGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(nx, ny, 34, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 5. Render Expanding Digital Energy Ripples & Excite Nearby Neural Nodes
      for (let r = ripples.length - 1; r >= 0; r--) {
        const rp = ripples[r];
        rp.radius += rp.speed;
        const lifeRatio = rp.radius / rp.maxRadius;
        const curAlpha = rp.alpha * Math.max(0, 1 - lifeRatio);

        // Excite neural nodes along ripple wavefront
        for (const n of nodes) {
          const nd = Math.hypot(n.rx * width - rp.x, n.ry * height - rp.y);
          if (Math.abs(nd - rp.radius) < 16) {
            n.pulse = Math.max(n.pulse, (1 - lifeRatio) * 0.9);
          }
        }

        if (lifeRatio >= 1 || curAlpha <= 0.005) {
          ripples.splice(r, 1);
          continue;
        }

        ctx.save();
        ctx.strokeStyle = rp.color;
        ctx.globalAlpha = curAlpha;
        ctx.lineWidth = Math.max(1.1, 2.4 * (1 - lifeRatio * 0.6));
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 6. Render Micro-Sparks from Finger Touch
      for (let s = sparks.length - 1; s >= 0; s--) {
        const sp = sparks[s];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.vx *= 0.97;
        sp.vy *= 0.97;
        sp.life += 1;
        if (sp.life >= sp.maxLife) {
          sparks.splice(s, 1);
          continue;
        }
        const a = (1 - sp.life / sp.maxLife) * (isGlassLight ? 0.55 : 0.75);
        ctx.fillStyle = isGlassLight ? primaryHex : '#67e8f9';
        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      animId = window.requestAnimationFrame(render);
    };

    animId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('swiftstack:trigger-touch', onTriggerTouch);
    };
  }, [themeMode, primaryHex, secondaryHex, accentHex, robotDensity, rippleIntensity]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  );
};
