import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { neo4jService } from '../services/neo4j.service';
import './StarView.css';

// Custom shader material for glowing particles
const GlowMaterial = React.forwardRef(({ color = '#00ff66', time = 0, hover = false }, ref) => {
  const materialRef = useRef();
  
  const vertexShader = `
    varying vec2 vUv;
    varying vec3 vPosition;
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float time;
    uniform vec3 color;
    uniform float hover;
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
      vec2 center = vec2(0.5, 0.5);
      float dist = distance(vUv, center);
      
      // Create pulsing glow effect
      float pulse = sin(time * 2.0 + vPosition.x * 0.01 + vPosition.z * 0.01) * 0.5 + 0.5;
      float glow = 1.0 - smoothstep(0.0, 0.5, dist);
      
      // Enhance glow on hover
      float intensity = hover > 0.5 ? 1.5 : 1.0;
      glow = pow(glow, 2.0) * intensity;
      
      // Add pulsing effect
      glow *= (0.8 + pulse * 0.4);
      
      gl_FragColor = vec4(color, glow);
    }
  `;

  const uniforms = useMemo(() => ({
    time: { value: time },
    color: { value: new THREE.Color(color) },
    hover: { value: hover ? 1.0 : 0.0 }
  }), [color, time, hover]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
      materialRef.current.uniforms.hover.value = hover ? 1.0 : 0.0;
    }
  });

  return (
    <shaderMaterial
      ref={materialRef}
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
      uniforms={uniforms}
      transparent
      blending={THREE.AdditiveBlending}
      depthWrite={false}
    />
  );
});

// Individual paper node component
const PaperNode = ({ position, name, index, onStarClick }) => {
  const meshRef = useRef();
  const glowRef = useRef();
  const textRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  useFrame((state) => {
    if (meshRef.current) {
      // Gentle rotation
      meshRef.current.rotation.y += 0.005;
      
      // Subtle floating motion
      const time = state.clock.elapsedTime;
      meshRef.current.position.y = position[1] + Math.sin(time + index) * 0.5;
    }
    
    if (glowRef.current) {
      // Scale glow based on hover state
      const targetScale = hovered ? 3 : 2;
      glowRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
    
    if (textRef.current && state.camera) {
      // Scale text based on distance to camera for readability
      const distance = state.camera.position.distanceTo(new THREE.Vector3(...position));
      const scale = Math.max(0.1, Math.min(2, distance * 0.01));
      textRef.current.scale.setScalar(scale);
      
      // Make text face camera
      textRef.current.lookAt(state.camera.position);
    }
  });

  // Truncate long names for better display
  const displayName = name && name.length > 30 ? name.substring(0, 30) + '...' : name || 'Unknown';

  const handleClick = (event) => {
    event.stopPropagation();
    onStarClick(position);
  };

  return (
    <group position={position}>
      {/* Main star */}
      <mesh 
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={handleClick}
        scale={hovered ? 1.5 : 1}
      >
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color="#00ff88" />
      </mesh>
      
      {/* Glow effect */}
      <mesh ref={glowRef} scale={2}>
        <sphereGeometry args={[1.5, 8, 8]} />
        <GlowMaterial color="#00ff66" hover={hovered} />
      </mesh>
      
      {/* Text label - always visible with distance-based scaling */}
      <Text
        ref={textRef}
        position={[0, 4, 0]}
        fontSize={3}
        color={hovered ? "#00ffff" : "#00ffcc"}
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.2}
        outlineColor="#000000"
        maxWidth={20}
        textAlign="center"
      >
        {displayName}
      </Text>
    </group>
  );
};

// Background starfield component
const BackgroundStars = () => {
  const pointsRef = useRef();
  
  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(3000 * 3);
    const colors = new Float32Array(3000 * 3);
    
    for (let i = 0; i < 3000; i++) {
      // Distribute in a large sphere
      const radius = 2000 + Math.random() * 3000;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      
      // Subtle color variation
      const brightness = 0.5 + Math.random() * 0.5;
      colors[i * 3] = brightness * 0.8;
      colors[i * 3 + 1] = brightness;
      colors[i * 3 + 2] = brightness * 0.9;
    }
    
    return [positions, colors];
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.0002;
      pointsRef.current.rotation.x += 0.0001;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={1.5}
        sizeAttenuation={false}
        vertexColors
        transparent
        opacity={0.6}
      />
    </points>
  );
};

// Camera controller for optional forward movement
const CameraController = ({ autoFlight, speed = 2, orbitTarget }) => {
  const { camera } = useThree();
  const forwardSpeed = useRef(speed);
  const [keys, setKeys] = useState({ w: false, a: false, s: false, d: false, shift: false, space: false });
  
  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();
      if (['w', 'a', 's', 'd'].includes(key) || event.key === ' ' || event.shiftKey) {
        setKeys(prev => ({ 
          ...prev, 
          [key]: true,
          space: event.key === ' ' ? true : prev.space,
          shift: event.shiftKey
        }));
      }
    };

    const handleKeyUp = (event) => {
      const key = event.key.toLowerCase();
      if (['w', 'a', 's', 'd'].includes(key) || event.key === ' ') {
        setKeys(prev => ({ 
          ...prev, 
          [key]: false,
          space: event.key === ' ' ? false : prev.space,
          shift: event.shiftKey
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  useFrame((state) => {
    const moveSpeed = keys.shift ? 10 : 5; // Faster with shift
    
    // Manual controls override auto-flight
    const hasManualInput = keys.w || keys.a || keys.s || keys.d || keys.space;
    
    // Only apply camera controls if we're doing manual movement or auto-flight
    // Don't interfere with OrbitControls when just looking around
    if (hasManualInput) {
      const target = new THREE.Vector3(...orbitTarget);
      
      // W/S: Always zoom toward/away from orbit target (not camera direction)
      if (keys.w || keys.s) {
        const toTarget = new THREE.Vector3().subVectors(target, camera.position).normalize();
        if (keys.w) camera.position.addScaledVector(toTarget, moveSpeed); // Zoom in toward target
        if (keys.s) camera.position.addScaledVector(toTarget, -moveSpeed); // Zoom out from target
      }
      
      // A/D: Strafe left/right relative to camera orientation
      if (keys.a || keys.d) {
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        const right = new THREE.Vector3();
        right.crossVectors(direction, camera.up).normalize();
        
        if (keys.a) camera.position.addScaledVector(right, -moveSpeed);
        if (keys.d) camera.position.addScaledVector(right, moveSpeed);
      }
      
      // Space: Move up in world coordinates
      if (keys.space) camera.position.y += moveSpeed;
    } else if (autoFlight) {
      // Auto-flight only when no manual input and auto-flight is enabled
      camera.position.z -= forwardSpeed.current;
      
      // Very subtle sway for auto-flight
      const time = state.clock.elapsedTime;
      camera.position.x += Math.sin(time * 0.1) * 0.02;
      camera.position.y += Math.cos(time * 0.15) * 0.01;
    }
    // Otherwise, let OrbitControls handle everything
  });

  return null;
};

// Main 3D scene component
const StarScene = ({ papers }) => {
  const [autoFlight, setAutoFlight] = useState(false); // Start with manual control
  const [orbitTarget, setOrbitTarget] = useState([0, 0, 0]);
  const controlsRef = useRef();

  const paperPositions = useMemo(() => {
    return papers.map((name, index) => {
      // Create a more natural clustering distribution
      const angle = (index / papers.length) * Math.PI * 2 * 5;
      const radius = 50 + Math.pow(Math.random(), 0.8) * 300;
      const height = (Math.random() - 0.5) * 200;
      const scatter = (Math.random() - 0.5) * 100;
      
      return [
        Math.cos(angle) * radius + scatter,
        height,
        Math.sin(angle) * radius + (Math.random() - 0.5) * 500 + index * 10 // Spread along Z-axis
      ];
    });
  }, [papers]);

  // Handle star clicks to set new orbit target
  const handleStarClick = (position) => {
    setOrbitTarget(position);
    if (controlsRef.current) {
      controlsRef.current.target.set(...position);
    }
  };

  // Handle toggle controls
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'f' || event.key === 'F') {
        setAutoFlight(prev => !prev);
      }
      if (event.key === 'r' || event.key === 'R') {
        // Reset orbit target to origin
        setOrbitTarget([0, 0, 0]);
        if (controlsRef.current) {
          controlsRef.current.target.set(0, 0, 0);
        }
      }
    };

    // Handle manual zoom with wheel when OrbitControls gets stuck
    const handleWheel = (event) => {
      if (controlsRef.current && event.ctrlKey) {
        // Manual zoom override when Ctrl is held
        event.preventDefault();
        const camera = controlsRef.current.object;
        const target = controlsRef.current.target;
        const direction = new THREE.Vector3().subVectors(camera.position, target).normalize();
        
        const zoomAmount = event.deltaY * 0.01;
        camera.position.addScaledVector(direction, zoomAmount);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);

  return (
    <>
      {/* Camera with improved settings */}
      <PerspectiveCamera 
        makeDefault 
        position={[0, 20, 300]} 
        fov={60} 
        near={0.000001}
        far={1000000}
      />
      <CameraController autoFlight={autoFlight} speed={2} orbitTarget={orbitTarget} />
      
      {/* Improved OrbitControls - No distance limits for infinite zoom */}
      <OrbitControls 
        ref={controlsRef}
        enableDamping 
        dampingFactor={0.05}
        enableRotate={true}
        enablePan={true}
        enableZoom={true}
        zoomSpeed={3.0}
        rotateSpeed={0.5}
        panSpeed={0.8}
        target={orbitTarget}
      />
      
      {/* Background stars */}
      <BackgroundStars />
      
      {/* Paper nodes */}
      {papers.map((name, index) => (
        <PaperNode
          key={index}
          position={paperPositions[index]}
          name={name}
          index={index}
          onStarClick={handleStarClick}
        />
      ))}
      
      {/* Ambient lighting */}
      <ambientLight intensity={0.2} />
    </>
  );
};

// Main StarView component
const StarView = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [papers, setPapers] = useState([]);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Checking connection...');

  // Function to check if we need to fetch new data
  const shouldFetchNewData = () => {
    if (!lastFetchTime) return true;
    const hoursSinceLastFetch = (Date.now() - lastFetchTime) / (1000 * 60 * 60);
    return hoursSinceLastFetch >= 24;
  };

  // Fetch data from Neo4j
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!shouldFetchNewData()) {
          console.log('Using cached data from:', new Date(lastFetchTime).toLocaleString());
          setLoading(false);
          return;
        }

        setConnectionStatus('Connecting to Neo4j...');
        const isConnected = await neo4jService.verifyConnection();
        if (!isConnected) {
          throw new Error('Failed to connect to Neo4j database');
        }
        setConnectionStatus('Connected to Neo4j. Loading papers...');
        
        const neo4jData = await neo4jService.getAllPapers();
        const names = neo4jData.map(paper => paper.name).filter(name => name && typeof name === 'string');
        
        setPapers(names);
        setLastFetchTime(Date.now());
        setLoading(false);
        
        if (names.length === 0) {
          setError('No papers found in the database');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    fetchData();
  }, [lastFetchTime]);

  if (loading) {
    return (
      <div className="loading">
        <div>{connectionStatus}</div>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <h3>Connection Error</h3>
        <p>{error}</p>
        <div className="error-details">
          <p>Please check:</p>
          <ul>
            <li>Is Neo4j running on your machine?</li>
            <li>Is the connection URI correct? (bolt://localhost:7687)</li>
            <li>Are the credentials correct? (neo4j/ssss8888)</li>
            <li>Is port 7687 accessible?</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="star-view">
      <Canvas
        style={{ 
          width: '100vw', 
          height: '100vh', 
          background: '#000' 
        }}
        gl={{ 
          antialias: true,
          alpha: false,
          powerPreference: "high-performance" 
        }}
        camera={{ position: [0, 0, 300], fov: 60 }}
      >
        <StarScene papers={papers} />
      </Canvas>
      
      <div className="info-panel">
        <h2>Stellar Observatory</h2>
        <p>Total papers: {papers.length}</p>
        <p className="connection-status">
          Connected to Neo4j
          {lastFetchTime && (
            <span> (Last updated: {new Date(lastFetchTime).toLocaleString()})</span>
          )}
        </p>
        <div className="controls-info">
          <p><strong>Navigation:</strong></p>
          <p>• Mouse: Look around</p>
          <p>• Scroll: Infinite zoom</p>
          <p>• Click star: Set orbit target</p>
          <p>• WASD: Move around</p>
          <p>• Space: Move up</p>
          <p>• Shift: Move faster</p>
          <p>• F: Toggle auto-flight</p>
          <p>• R: Reset orbit center</p>
        </div>
      </div>
    </div>
  );
};

export default StarView;