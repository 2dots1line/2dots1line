const fetch = require('node-fetch');

async function testCosmosData() {
  try {
    console.log('🔍 Testing Cosmos data...');
    
    const response = await fetch('http://localhost:3001/api/v1/graph-projection/latest', {
      headers: {
        'Authorization': 'Bearer dev-token'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API responded with ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('✅ API Response:', {
      success: data.success,
      nodeCount: data.data?.projectionData?.nodes?.length || 0,
      edgeCount: data.data?.projectionData?.edges?.length || 0
    });
    
    // Check first node
    const firstNode = data.data?.projectionData?.nodes?.[0];
    if (firstNode) {
      console.log('🔍 First Node:', {
        id: firstNode.id,
        title: firstNode.title,
        type: firstNode.type,
        x: firstNode.x,
        y: firstNode.y,
        z: firstNode.z,
        scaledX: firstNode.x * 0.3,
        scaledY: firstNode.y * 0.3,
        scaledZ: firstNode.z * 0.3
      });
    }
    
    // Check first edge
    const firstEdge = data.data?.projectionData?.edges?.[0];
    if (firstEdge) {
      console.log('🔍 First Edge:', {
        id: firstEdge.id,
        source: firstEdge.source,
        target: firstEdge.target,
        type: firstEdge.type,
        weight: firstEdge.weight
      });
    }
    
    // Check node positions range
    const nodes = data.data?.projectionData?.nodes || [];
    if (nodes.length > 0) {
      const xValues = nodes.map(n => n.x);
      const yValues = nodes.map(n => n.y);
      const zValues = nodes.map(n => n.z);
      
      console.log('📊 Position Ranges:', {
        x: { min: Math.min(...xValues), max: Math.max(...xValues) },
        y: { min: Math.min(...yValues), max: Math.max(...yValues) },
        z: { min: Math.min(...zValues), max: Math.max(...zValues) }
      });
      
      console.log('📊 Scaled Position Ranges:', {
        x: { min: Math.min(...xValues) * 0.3, max: Math.max(...xValues) * 0.3 },
        y: { min: Math.min(...yValues) * 0.3, max: Math.max(...yValues) * 0.3 },
        z: { min: Math.min(...zValues) * 0.3, max: Math.max(...zValues) * 0.3 }
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing cosmos data:', error);
  }
}

testCosmosData(); 