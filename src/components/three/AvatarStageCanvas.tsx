import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, OrbitControls } from '@react-three/drei';
import { AvatarConfig } from '../../types/cms';
import { SpeechFrameState } from '../../utils/speechEngine';
import { AvatarModel } from './AvatarModel';

interface WebGLBoundaryState {
  hasError: boolean;
}

class WebGLErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  WebGLBoundaryState
> {
  state: WebGLBoundaryState = { hasError: false };
  static getDerivedStateFromError(): WebGLBoundaryState {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('3D Stage WebGL fallback engaged:', error, info);
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

interface AvatarStageCanvasProps {
  config: AvatarConfig;
  speechState: SpeechFrameState;
  primaryAccent?: string;
  secondaryAccent?: string;
  cameraZ?: number;
  cameraY?: number;
  enableZoom?: boolean;
  canvasId?: string;
}

export const AvatarStageCanvas: React.FC<AvatarStageCanvasProps> = ({
  config,
  speechState,
  primaryAccent = '#06b6d4',
  secondaryAccent = '#3b82f6',
  cameraZ = 3.55,
  cameraY = 0.32,
  enableZoom = false,
  canvasId,
}) => {
  return (
    <WebGLErrorBoundary
      fallback={
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
          <img
            src="./images/scan-sample-sarib.jpg"
            alt="Muhammad Sarib Randhawa"
            className="w-48 h-48 rounded-full object-cover border-2 border-cyan-400/50 shadow-2xl mb-4"
          />
          <p className="text-sm text-slate-300 font-medium">
            Muhammad Sarib Randhawa · Interactive Studio Portrait
          </p>
        </div>
      }
    >
      <Canvas
        id={canvasId}
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, cameraY, cameraZ], fov: 39 }}
        gl={{
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: true,
          powerPreference: 'high-performance',
        }}
      >
        <ambientLight intensity={0.85} />
        {/* Warm Studio Key Light */}
        <directionalLight
          position={[2.8, 3.8, 4.2]}
          intensity={1.75}
          color="#fff7ed"
          castShadow
        />
        {/* Glowing Cyan Left Rim Light */}
        <spotLight
          position={[-3.4, 2.6, -1.6]}
          intensity={2.9}
          angle={0.65}
          penumbra={0.8}
          color={primaryAccent}
        />
        {/* Vibrant Blue/Indigo Right Rim Light */}
        <pointLight position={[3.2, 1.4, -1.8]} intensity={2.3} color={secondaryAccent} />
        {/* Subtle Front Fill Light for Clear Facial Readability */}
        <pointLight position={[0, 1.1, 3.0]} intensity={0.65} color="#e0f2fe" />

        <AvatarModel
          config={config}
          speechState={speechState}
          primaryAccent={primaryAccent}
          secondaryAccent={secondaryAccent}
        />

        <ContactShadows
          position={[0, -1.42, 0]}
          opacity={0.55}
          scale={4.5}
          blur={2.2}
          far={3}
        />

        <OrbitControls
          enablePan={false}
          enableZoom={enableZoom}
          minDistance={2.5}
          maxDistance={5.0}
          minPolarAngle={Math.PI / 2.65}
          maxPolarAngle={Math.PI / 1.88}
          minAzimuthAngle={-Math.PI / 2.6}
          maxAzimuthAngle={Math.PI / 2.6}
          target={[0, 0.06, 0]}
          dampingFactor={0.08}
          enableDamping
        />
      </Canvas>
    </WebGLErrorBoundary>
  );
};
