import React from 'react';

interface CosmosErrorProps {
  message: string;
}

const CosmosError: React.FC<CosmosErrorProps> = ({ message }) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        color: '#ff4444',
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: '20px',
        borderRadius: '8px',
        textAlign: 'center',
        maxWidth: '80%',
        zIndex: 20,
      }}
    >
      <h3 style={{ margin: '0 0 15px 0', color: '#ff4444' }}>Error</h3>
      <p>{message}</p>
    </div>
  );
};

export default CosmosError;