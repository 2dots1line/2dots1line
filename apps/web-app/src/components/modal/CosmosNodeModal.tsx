import React from 'react';

interface CosmosNodeModalProps {
  node: any;
  onClose: () => void;
}

const CosmosNodeModal: React.FC<CosmosNodeModalProps> = ({ node, onClose }) => {
  if (!node) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '20px',
        borderRadius: '8px',
        zIndex: 100,
        minWidth: '300px',
        maxWidth: '80vw',
      }}
    >
      <button onClick={onClose} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>
        &times;
      </button>
      <h2 style={{ marginTop: 0 }}>{node.name || 'Node Details'}</h2>
      <pre>{JSON.stringify(node, null, 2)}</pre>
    </div>
  );
};

export default CosmosNodeModal;