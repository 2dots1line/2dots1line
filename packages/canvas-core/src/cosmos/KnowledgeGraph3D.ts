/**
 * KnowledgeGraph3D - Advanced 3D knowledge graph layout and management
 * V11.0 - Canvas Core Extension Phase 3.4
 */

import * as THREE from 'three';

export interface GraphNode {
  id: string;
  label: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  force: THREE.Vector3;
  mass: number;
  size: number;
  color: THREE.Color;
  fixed: boolean;
  type: string;
  connections: string[];
  metadata: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  weight: number;
  length: number;
  color: THREE.Color;
  type: string;
  visible: boolean;
  animated: boolean;
}

export interface GraphLayout {
  type: 'force' | 'hierarchical' | 'circular' | 'grid' | 'spiral';
  parameters: {
    repulsion: number;
    attraction: number;
    damping: number;
    centerForce: number;
    nodeSpacing: number;
    edgeLength: number;
    iterations: number;
    convergenceThreshold: number;
  };
}

export interface GraphVisualization {
  nodeGeometry: THREE.BufferGeometry;
  edgeGeometry: THREE.BufferGeometry;
  nodesMesh: THREE.Points;
  edgesMesh: THREE.LineSegments;
  showLabels: boolean;
  showEdges: boolean;
  animateNodes: boolean;
  animateEdges: boolean;
}

// (A) Node type color map
const NODE_TYPE_COLORS: { [key: string]: number } = {
  Concept: 0x00bfff,         // blue
  MemoryUnit: 0xffb300,      // orange
  DerivedArtifact: 0x8e44ad, // purple
  Community: 0xe74c3c,       // red
  default: 0xcccccc          // gray
};

export class KnowledgeGraph3D {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: Map<string, GraphEdge> = new Map();
  private layout: GraphLayout;
  private visualization: GraphVisualization | null = null;
  private isSimulating: boolean = false;
  private simulationStep: number = 0;
  private boundingBox: THREE.Box3 = new THREE.Box3();
  
  // Performance optimization
  private needsLayoutUpdate: boolean = false;
  private needsVisualizationUpdate: boolean = false;
  private lastUpdateTime: number = 0;
  private updateInterval: number = 16; // ~60fps
  
  constructor(layout: Partial<GraphLayout> = {}) {
    this.layout = {
      type: 'force',
      parameters: {
        repulsion: 100,
        attraction: 0.1,
        damping: 0.9,
        centerForce: 0.01,
        nodeSpacing: 50,
        edgeLength: 100,
        iterations: 1000,
        convergenceThreshold: 0.1,
      },
      ...layout,
    };
    
    this.initialize();
  }
  
  private initialize(): void {
    this.boundingBox = new THREE.Box3(
      new THREE.Vector3(-1000, -1000, -1000),
      new THREE.Vector3(1000, 1000, 1000)
    );
  }
  
  public addNode(nodeData: Partial<GraphNode> & { id: string }): void {
    // (B) Determine node type
    const nodeType = (nodeData.type || nodeData.metadata?.type || 'default') as string;
    // (C) Assign color based on type
    const nodeColor = new THREE.Color(NODE_TYPE_COLORS[nodeType] || NODE_TYPE_COLORS.default);
    const node: GraphNode = {
      label: nodeData.id,
      position: nodeData.position || new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      force: new THREE.Vector3(),
      mass: 1,
      size: 1,
      color: nodeColor,
      fixed: false,
      type: nodeType,
      connections: [],
      metadata: {},
      ...nodeData,
    };
    this.nodes.set(node.id, node);
    this.needsLayoutUpdate = true;
    this.needsVisualizationUpdate = true;
  }
  
  public addEdge(edgeData: Partial<GraphEdge> & { id: string; source: string; target: string }): void {
    const edge: GraphEdge = {
      weight: 1,
      length: this.layout.parameters.edgeLength,
      color: new THREE.Color(0x00ffff),
      type: 'default',
      visible: true,
      animated: false,
      ...edgeData,
    };
    
    this.edges.set(edge.id, edge);
    
    // Update node connections
    const sourceNode = this.nodes.get(edge.source);
    const targetNode = this.nodes.get(edge.target);
    
    if (sourceNode && !sourceNode.connections.includes(edge.target)) {
      sourceNode.connections.push(edge.target);
    }
    
    if (targetNode && !targetNode.connections.includes(edge.source)) {
      targetNode.connections.push(edge.source);
    }
    
    this.needsLayoutUpdate = true;
    this.needsVisualizationUpdate = true;
  }
  
  public removeNode(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (!node) return;
    
    // Remove all edges connected to this node
    const edgesToRemove: string[] = [];
    for (const [edgeId, edge] of this.edges) {
      if (edge.source === nodeId || edge.target === nodeId) {
        edgesToRemove.push(edgeId);
      }
    }
    
    edgesToRemove.forEach(edgeId => this.removeEdge(edgeId));
    
    this.nodes.delete(nodeId);
    this.needsLayoutUpdate = true;
    this.needsVisualizationUpdate = true;
  }
  
  public removeEdge(edgeId: string): void {
    const edge = this.edges.get(edgeId);
    if (!edge) return;
    
    // Update node connections
    const sourceNode = this.nodes.get(edge.source);
    const targetNode = this.nodes.get(edge.target);
    
    if (sourceNode) {
      sourceNode.connections = sourceNode.connections.filter(id => id !== edge.target);
    }
    
    if (targetNode) {
      targetNode.connections = targetNode.connections.filter(id => id !== edge.source);
    }
    
    this.edges.delete(edgeId);
    this.needsLayoutUpdate = true;
    this.needsVisualizationUpdate = true;
  }
  
  public setLayout(layout: Partial<GraphLayout>): void {
    this.layout = { ...this.layout, ...layout };
    this.needsLayoutUpdate = true;
  }
  
  public startSimulation(): void {
    this.isSimulating = true;
    this.simulationStep = 0;
    this.needsLayoutUpdate = true;
  }
  
  public stopSimulation(): void {
    this.isSimulating = false;
  }
  
  public update(): void {
    const now = Date.now();
    
    // Throttle updates for performance
    if (now - this.lastUpdateTime < this.updateInterval) {
      return;
    }
    
    this.lastUpdateTime = now;
    
    // REMOVE/DISABLE: Do not update layout, always use backend positions
    // if (this.isSimulating && this.needsLayoutUpdate) {
    //   this.updateLayout();
    // }
    
    if (this.needsVisualizationUpdate) {
      this.updateVisualization();
    }
  }
  
  // REMOVE/DISABLE: All layout update methods (updateLayout, updateForceLayout, updateHierarchicalLayout, updateCircularLayout, updateGridLayout, updateSpiralLayout)
  
  private calculateHierarchicalLevels(): Map<number, string[]> {
    const levels = new Map<number, string[]>();
    const visited = new Set<string>();
    
    // Find root nodes (nodes with no incoming edges)
    const rootNodes = Array.from(this.nodes.keys()).filter(nodeId => {
      return !Array.from(this.edges.values()).some(edge => edge.target === nodeId);
    });
    
    // If no root nodes, pick the first node
    if (rootNodes.length === 0 && this.nodes.size > 0) {
      rootNodes.push(Array.from(this.nodes.keys())[0]);
    }
    
    // Breadth-first traversal to assign levels
    let currentLevel = 0;
    let currentNodes = rootNodes;
    
    while (currentNodes.length > 0) {
      levels.set(currentLevel, [...currentNodes]);
      
      const nextNodes: string[] = [];
      
      for (const nodeId of currentNodes) {
        visited.add(nodeId);
        
        const node = this.nodes.get(nodeId);
        if (!node) continue;
        
        // Find connected nodes
        for (const connectedId of node.connections) {
          if (!visited.has(connectedId) && !nextNodes.includes(connectedId)) {
            nextNodes.push(connectedId);
          }
        }
      }
      
      currentNodes = nextNodes;
      currentLevel++;
    }
    
    return levels;
  }
  
  private updateVisualization(): void {
    // This would typically update the Three.js geometries and materials
    // Implementation depends on the specific rendering approach
    this.needsVisualizationUpdate = false;
  }
  
  public getVisualization(): GraphVisualization | null {
    return this.visualization;
  }
  
  public getNode(nodeId: string): GraphNode | undefined {
    return this.nodes.get(nodeId);
  }
  
  public getEdge(edgeId: string): GraphEdge | undefined {
    return this.edges.get(edgeId);
  }
  
  public getAllNodes(): GraphNode[] {
    return Array.from(this.nodes.values());
  }
  
  public getAllEdges(): GraphEdge[] {
    return Array.from(this.edges.values());
  }
  
  public getConnectedNodes(nodeId: string): GraphNode[] {
    const node = this.nodes.get(nodeId);
    if (!node) return [];
    
    return node.connections
      .map(id => this.nodes.get(id))
      .filter(node => node !== undefined) as GraphNode[];
  }
  
  public findPath(startId: string, endId: string): string[] {
    // Simple BFS pathfinding
    const queue = [startId];
    const visited = new Set<string>();
    const parent = new Map<string, string>();
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (current === endId) {
        // Reconstruct path
        const path: string[] = [];
        let node: string | undefined = endId;
        
        while (node !== undefined) {
          path.unshift(node);
          node = parent.get(node);
        }
        
        return path;
      }
      
      visited.add(current);
      
      const currentNode = this.nodes.get(current);
      if (!currentNode) continue;
      
      for (const neighborId of currentNode.connections) {
        if (!visited.has(neighborId)) {
          queue.push(neighborId);
          parent.set(neighborId, current);
        }
      }
    }
    
    return []; // No path found
  }
  
  public getStatistics(): {
    nodeCount: number;
    edgeCount: number;
    averageConnections: number;
    maxConnections: number;
    minConnections: number;
    simulationStep: number;
    isSimulating: boolean;
  } {
    const nodeArray = Array.from(this.nodes.values());
    const connections = nodeArray.map(node => node.connections.length);
    
    return {
      nodeCount: this.nodes.size,
      edgeCount: this.edges.size,
      averageConnections: connections.reduce((sum, count) => sum + count, 0) / connections.length || 0,
      maxConnections: Math.max(...connections, 0),
      minConnections: Math.min(...connections, Infinity) || 0,
      simulationStep: this.simulationStep,
      isSimulating: this.isSimulating,
    };
  }
  
  public clear(): void {
    this.nodes.clear();
    this.edges.clear();
    this.isSimulating = false;
    this.simulationStep = 0;
    this.needsLayoutUpdate = false;
    this.needsVisualizationUpdate = false;
  }
  
  public dispose(): void {
    this.clear();
    
    if (this.visualization) {
      this.visualization.nodeGeometry?.dispose();
      this.visualization.edgeGeometry?.dispose();
      this.visualization = null;
    }
  }
} 