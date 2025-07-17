import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { NodeLabel } from './NodeLabel';

// A custom shader material for the glow effect
const GlowMaterial = React.forwardRef<THREE.ShaderMaterial, { color: string; hover: boolean }>(({ color, hover }, ref) => {
  const uniforms = useMemo(() => ({
    color: { value: new THREE.Color(color) },
    hover: { value: hover ? 1.0 : 0.0 },
    time: { value: 0 },
  }), [color, hover]);

  useFrame((state) => {
    if (uniforms) {
      uniforms.time.value = state.clock.elapsedTime;
    }
  });

  return (
    <shaderMaterial
      ref={ref}
      uniforms={uniforms}
      vertexShader={`
        varying vec3 vPosition;
        void main() {
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `}
      fragmentShader={`
        uniform vec3 color;
        uniform float hover;
        uniform float time;
        varying vec3 vPosition;
        void main() {
          float pulse = sin(time * 2.0 + vPosition.x * 0.1) * 0.5 + 0.5;
          float glow = pow(0.5 - distance(gl_PointCoord, vec2(0.5)), 2.0);
          float intensity = hover > 0.5 ? 1.5 : 1.0;
          gl_FragColor = vec4(color, glow * intensity * (0.8 + pulse * 0.4));
        }
      `}
      transparent
      blending={THREE.AdditiveBlending}
      depthWrite={false}
    />
  );
});

interface NodeMeshProps {
  node: any;
  onClick: (node: any) => void;
}

export const NodeMesh: React.FC<NodeMeshProps> = ({ node, onClick }) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);

  const position = useMemo(() => new THREE.Vector3(node.x, node.y, node.z), [node.x, node.y, node.z]);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
    }
    if (glowRef.current) {
      const targetScale = hovered ? 3 : 2;
      glowRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => onClick(node)}
        scale={hovered ? 1.5 : 1}
      >
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color="#00ff88" />
      </mesh>
      <mesh ref={glowRef} scale={2}>
        <sphereGeometry args={[1.5, 16, 16]} />
        <GlowMaterial color="#00ff66" hover={hovered} />
      </mesh>
      <NodeLabel text={node.name} position={new THREE.Vector3(0, 4, 0)} hovered={hovered} />
    </group>
  );
};