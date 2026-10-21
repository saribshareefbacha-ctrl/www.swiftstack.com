import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ThemeMode } from '../../types/cms';

interface ScrollScene3DProps {
  themeMode: ThemeMode;
  primaryHex: string;
  secondaryHex: string;
  accentHex: string;
  particleDensity: number;
  scrollSpeed: number;
  wireframeOpacity: number;
}

export const ScrollScene3D: React.FC<ScrollScene3DProps> = ({
  themeMode,
  primaryHex,
  secondaryHex,
  accentHex,
  particleDensity,
  scrollSpeed,
  wireframeOpacity,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      52,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 0.4, 10);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const isLight = themeMode === 'light';
    const isCyber = themeMode === 'cyber';

    const primaryColor = new THREE.Color(
      isCyber ? '#00f5d4' : isLight ? '#0284c7' : primaryHex || '#06b6d4'
    );
    const secondaryColor = new THREE.Color(
      isCyber ? '#f72585' : isLight ? '#4f46e5' : secondaryHex || '#6366f1'
    );
    const accentColor = new THREE.Color(
      isCyber ? '#7209b7' : isLight ? '#0ea5e9' : accentHex || '#22d3ee'
    );

    const count = Math.max(80, Math.min(280, particleDensity || 150));
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 26;
      positions[i3 + 1] = (Math.random() - 0.5) * 20;
      positions[i3 + 2] = -Math.random() * 24 + 2;

      const mix = Math.random();
      const chosen =
        mix < 0.45 ? primaryColor : mix < 0.8 ? secondaryColor : accentColor;
      colors[i3] = chosen.r;
      colors[i3 + 1] = chosen.g;
      colors[i3 + 2] = chosen.b;
    }

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: isLight ? 0.065 : 0.058,
      vertexColors: true,
      transparent: true,
      opacity: isLight ? 0.34 : isCyber ? 0.82 : 0.62,
      blending: isLight ? THREE.NormalBlending : THREE.AdditiveBlending,
    });

    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);

    const archGroup = new THREE.Group();
    archGroup.position.set(0, -3.6, -6);

    const gridGeo = new THREE.PlaneGeometry(34, 24, 24, 16);
    gridGeo.rotateX(-Math.PI * 0.44);
    const gridMat = new THREE.MeshBasicMaterial({
      color: primaryColor,
      wireframe: true,
      transparent: true,
      opacity: isLight
        ? 0.06
        : isCyber
          ? 0.16
          : Math.max(0.03, Math.min(0.2, (wireframeOpacity || 0.18) * 0.45)),
    });
    const gridMesh = new THREE.Mesh(gridGeo, gridMat);
    archGroup.add(gridMesh);
    scene.add(archGroup);

    let scrollProgress = 0;
    const handleScroll = () => {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      scrollProgress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    handleScroll();

    const clock = new THREE.Clock();
    let frameId = 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const speed = scrollSpeed || 1;

      starField.rotation.y = elapsed * 0.015 * speed;
      starField.position.y = scrollProgress * 2.2;
      archGroup.position.z = -6 + Math.sin(scrollProgress * Math.PI) * 1.6;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      starGeometry.dispose();
      starMaterial.dispose();
      gridGeo.dispose();
      gridMat.dispose();
      renderer.dispose();
    };
  }, [themeMode, primaryHex, secondaryHex, accentHex, particleDensity, scrollSpeed, wireframeOpacity]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    />
  );
};
