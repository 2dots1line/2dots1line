import React from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { StarfieldBackground } from './StarfieldBackground';
import { CameraController } from './CameraController';
import { NodeMesh } from './NodeMesh';
import { EdgeMesh } from './EdgeMesh';
import * as THREE from 'three';

// TODO: Define proper types for graph data
interface GraphData {
  nodes: any[];
  links: any[];
}

interface Graph3DProps {
  graphData: GraphData;
  onNodeClick: (node: any) => void;
}

export const Graph3D: React.FC<Graph3DProps> = ({ graphData, onNodeClick }) => {
  return (
    <Canvas
      style={{
        width: '100vw',
        height: '100vh',
        background: '#000',
      }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      }}
    >
      <PerspectiveCamera makeDefault position={[0, 20, 300]} fov={60} near={0.1} far={10000} />
      <StarfieldBackground />
      <CameraController />
      <ambientLight intensity={0.2} />
      
      {/* Render nodes */}
      {graphData.nodes.map((node) => (
        <NodeMesh key={node.id} node={node} onClick={onNodeClick} />
      ))}

      {/* Render edges */}
      {graphData.links.map((link, index) => {
        const sourceNode = graphData.nodes.find((n) => n.id === link.source);
        const targetNode = graphData.nodes.find((n) => n.id === link.target);
        if (!sourceNode || !targetNode) return null;
        const points = [
          new THREE.Vector3(sourceNode.x, sourceNode.y, sourceNode.z),
          new THREE.Vector3(targetNode.x, targetNode.y, targetNode.z),
        ];
        return <EdgeMesh key={index} points={points} />;
      })}
    </Canvas>
  );
};