import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface NodeLabelProps {
  text: string;
  position: THREE.Vector3;
  hovered: boolean;
}

export const NodeLabel: React.FC<NodeLabelProps> = ({ text, position, hovered }) => {
  const textRef = useRef<any>();

  useFrame(({ camera }) => {
    if (textRef.current) {
      const distance = camera.position.distanceTo(position);
      const scale = Math.max(0.1, Math.min(2, distance * 0.01));
      textRef.current.scale.setScalar(scale);
      textRef.current.lookAt(camera.position);
    }
  });

  const displayName = text && text.length > 30 ? text.substring(0, 30) + '...' : text || 'Unknown';

  return (
    <Text
      ref={textRef}
      position={position}
      fontSize={3}
      color={hovered ? '#00ffff' : '#00ffcc'}
      anchorX="center"
      anchorY="bottom"
      outlineWidth={0.2}
      outlineColor="#000000"
      maxWidth={20}
      textAlign="center"
    >
      {displayName}
    </Text>
  );
};