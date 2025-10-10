import React from 'react';

interface QuestInfoPanelProps {
  nodeCount: number;
  edgeCount: number;
}

const QuestInfoPanel: React.FC<QuestInfoPanelProps> = ({ nodeCount, edgeCount }) => {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        color: 'white',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: '15px',
        borderRadius: '8px',
        zIndex: 10,
      }}
    >
      <h2 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>Cosmos View</h2>
      <p style={{ margin: '0', fontSize: '14px' }}>Nodes: {nodeCount}</p>
      <p style={{ margin: '0', fontSize: '14px' }}>Edges: {edgeCount}</p>
    </div>
  );
};

export default QuestInfoPanel;
