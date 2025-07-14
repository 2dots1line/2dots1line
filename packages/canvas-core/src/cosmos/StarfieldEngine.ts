/**
 * StarfieldEngine - Advanced starfield generation and management
 * V11.0 - Canvas Core Extension Phase 3.4
 */

import * as THREE from 'three';

export interface StarfieldConfig {
  starCount: number;
  fieldRadius: number;
  minStarSize: number;
  maxStarSize: number;
  colorVariation: boolean;
  animationSpeed: number;
  density: 'low' | 'medium' | 'high' | 'ultra';
  distribution: 'uniform' | 'spiral' | 'clustered';
  nebulae: boolean;
  pulsing: boolean;
}

export interface StarData {
  position: THREE.Vector3;
  color: THREE.Color;
  size: number;
  brightness: number;
  pulsePhase: number;
  pulseSpeed: number;
  type: 'star' | 'nebula' | 'pulsar';
}

export class StarfieldEngine {
  private config: StarfieldConfig;
  private stars: StarData[] = [];
  private geometry: THREE.BufferGeometry | null = null;
  private material: THREE.PointsMaterial | null = null;
  private points: THREE.Points | null = null;
  private time: number = 0;
  
  // Performance optimization
  private needsUpdate: boolean = false;
  private lastUpdateTime: number = 0;
  private updateInterval: number = 16; // ~60fps
  
  constructor(config: Partial<StarfieldConfig> = {}) {
    this.config = {
      starCount: 3000,
      fieldRadius: 2000,
      minStarSize: 0.5,
      maxStarSize: 2.0,
      colorVariation: true,
      animationSpeed: 0.001,
      density: 'medium',
      distribution: 'uniform',
      nebulae: true,
      pulsing: true,
      ...config,
    };
    
    this.initialize();
  }
  
  private initialize(): void {
    this.generateStars();
    this.createGeometry();
    this.createMaterial();
    this.createPoints();
  }
  
  private generateStars(): void {
    const { starCount, fieldRadius, distribution, colorVariation, nebulae } = this.config;
    
    this.stars = [];
    
    for (let i = 0; i < starCount; i++) {
      const star: StarData = {
        position: this.generatePosition(distribution, fieldRadius, i),
        color: this.generateColor(colorVariation, i),
        size: this.generateSize(i),
        brightness: this.generateBrightness(i),
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.5 + Math.random() * 1.5,
        type: this.generateType(nebulae, i),
      };
      
      this.stars.push(star);
    }
  }
  
  private generatePosition(distribution: string, radius: number, index: number): THREE.Vector3 {
    switch (distribution) {
      case 'spiral':
        return this.generateSpiralPosition(radius, index);
      case 'clustered':
        return this.generateClusteredPosition(radius, index);
      default:
        return this.generateUniformPosition(radius);
    }
  }
  
  private generateUniformPosition(radius: number): THREE.Vector3 {
    // Generate uniform distribution in sphere
    const r = radius * Math.cbrt(Math.random());
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    
    return new THREE.Vector3(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    );
  }
  
  private generateSpiralPosition(radius: number, index: number): THREE.Vector3 {
    const totalStars = this.config.starCount;
    const spiralArms = 2;
    const armIndex = index % spiralArms;
    const positionInArm = index / totalStars;
    
    const r = radius * Math.sqrt(positionInArm);
    const theta = (armIndex * Math.PI * 2 / spiralArms) + (positionInArm * Math.PI * 4);
    const height = (Math.random() - 0.5) * radius * 0.1;
    
    return new THREE.Vector3(
      r * Math.cos(theta),
      height,
      r * Math.sin(theta)
    );
  }
  
  private generateClusteredPosition(radius: number, index: number): THREE.Vector3 {
    const clusterCount = 5;
    const clusterRadius = radius * 0.3;
    const clusterIndex = Math.floor(index / (this.config.starCount / clusterCount));
    
    // Generate cluster center
    const clusterCenter = this.generateUniformPosition(radius * 0.7);
    
    // Generate position within cluster
    const localPosition = this.generateUniformPosition(clusterRadius);
    
    return clusterCenter.clone().add(localPosition);
  }
  
  private generateColor(colorVariation: boolean, index: number): THREE.Color {
    if (!colorVariation) {
      return new THREE.Color(0.8, 0.9, 1.0);
    }
    
    const rand = Math.random();
    
    if (rand < 0.3) {
      // Blue-white giants
      return new THREE.Color(0.7 + Math.random() * 0.3, 0.8 + Math.random() * 0.2, 1.0);
    } else if (rand < 0.6) {
      // Yellow-white (like our sun)
      return new THREE.Color(1.0, 0.9 + Math.random() * 0.1, 0.7 + Math.random() * 0.3);
    } else if (rand < 0.8) {
      // Red dwarfs
      return new THREE.Color(1.0, 0.4 + Math.random() * 0.4, 0.2 + Math.random() * 0.3);
    } else {
      // Rare colored stars
      return new THREE.Color(
        0.5 + Math.random() * 0.5,
        0.5 + Math.random() * 0.5,
        0.5 + Math.random() * 0.5
      );
    }
  }
  
  private generateSize(index: number): number {
    const { minStarSize, maxStarSize } = this.config;
    
    // Power distribution for more realistic size variation
    const random = Math.random();
    const power = Math.pow(random, 2); // Favor smaller stars
    
    return minStarSize + (maxStarSize - minStarSize) * power;
  }
  
  private generateBrightness(index: number): number {
    // Magnitude-based brightness distribution
    const magnitude = Math.random() * 6; // 0-6 magnitude scale
    return Math.pow(2.512, -magnitude); // Convert magnitude to brightness
  }
  
  private generateType(nebulae: boolean, index: number): 'star' | 'nebula' | 'pulsar' {
    const rand = Math.random();
    
    if (nebulae && rand < 0.02) {
      return 'nebula';
    } else if (rand < 0.01) {
      return 'pulsar';
    } else {
      return 'star';
    }
  }
  
  private createGeometry(): void {
    const positions = new Float32Array(this.stars.length * 3);
    const colors = new Float32Array(this.stars.length * 3);
    const sizes = new Float32Array(this.stars.length);
    
    for (let i = 0; i < this.stars.length; i++) {
      const star = this.stars[i];
      
      // Positions
      positions[i * 3] = star.position.x;
      positions[i * 3 + 1] = star.position.y;
      positions[i * 3 + 2] = star.position.z;
      
      // Colors
      colors[i * 3] = star.color.r;
      colors[i * 3 + 1] = star.color.g;
      colors[i * 3 + 2] = star.color.b;
      
      // Sizes
      sizes[i] = star.size;
    }
    
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  }
  
  private createMaterial(): void {
    this.material = new THREE.PointsMaterial({
      size: 2,
      sizeAttenuation: false,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
  }
  
  private createPoints(): void {
    if (this.geometry && this.material) {
      this.points = new THREE.Points(this.geometry, this.material);
    }
  }
  
  public update(deltaTime: number): void {
    this.time += deltaTime;
    
    // Throttle updates for performance
    if (this.time - this.lastUpdateTime < this.updateInterval) {
      return;
    }
    
    this.lastUpdateTime = this.time;
    
    if (!this.config.pulsing || !this.geometry) return;
    
    // Update pulsing stars
    const colors = this.geometry.getAttribute('color') as THREE.BufferAttribute;
    const sizes = this.geometry.getAttribute('size') as THREE.BufferAttribute;
    
    for (let i = 0; i < this.stars.length; i++) {
      const star = this.stars[i];
      
      if (star.type === 'pulsar' || (star.type === 'star' && Math.random() < 0.1)) {
        // Pulse effect
        const pulse = Math.sin(this.time * star.pulseSpeed + star.pulsePhase) * 0.5 + 0.5;
        const brightness = star.brightness * (0.5 + pulse * 0.5);
        
        // Update color brightness
        colors.setXYZ(i, star.color.r * brightness, star.color.g * brightness, star.color.b * brightness);
        
        // Update size for pulsars
        if (star.type === 'pulsar') {
          sizes.setX(i, star.size * (0.8 + pulse * 0.4));
        }
      }
    }
    
    colors.needsUpdate = true;
    sizes.needsUpdate = true;
  }
  
  public getPoints(): THREE.Points | null {
    return this.points;
  }
  
  public regenerate(newConfig?: Partial<StarfieldConfig>): void {
    if (newConfig) {
      this.config = { ...this.config, ...newConfig };
    }
    
    this.dispose();
    this.initialize();
  }
  
  public setConfig(config: Partial<StarfieldConfig>): void {
    const shouldRegenerate = (
      config.starCount !== this.config.starCount ||
      config.fieldRadius !== this.config.fieldRadius ||
      config.distribution !== this.config.distribution ||
      config.density !== this.config.density
    );
    
    this.config = { ...this.config, ...config };
    
    if (shouldRegenerate) {
      this.regenerate();
    }
  }
  
  public dispose(): void {
    if (this.geometry) {
      this.geometry.dispose();
      this.geometry = null;
    }
    
    if (this.material) {
      this.material.dispose();
      this.material = null;
    }
    
    this.stars = [];
    this.points = null;
  }
  
  // Utility methods
  public getStarCount(): number {
    return this.stars.length;
  }
  
  public getConfig(): StarfieldConfig {
    return { ...this.config };
  }
  
  public getStarData(): StarData[] {
    return [...this.stars];
  }
  
  public getStarAt(index: number): StarData | null {
    return this.stars[index] || null;
  }
  
  public findNearbyStars(position: THREE.Vector3, radius: number): StarData[] {
    return this.stars.filter(star => 
      star.position.distanceTo(position) <= radius
    );
  }
  
  public getBoundingBox(): THREE.Box3 {
    const box = new THREE.Box3();
    
    for (const star of this.stars) {
      box.expandByPoint(star.position);
    }
    
    return box;
  }
} 