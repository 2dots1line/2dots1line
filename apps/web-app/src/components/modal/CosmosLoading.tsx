import React from 'react';

const CosmosLoading: React.FC = () => {
  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        color: 'white',
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: '20px',
        borderRadius: '8px',
        textAlign: 'center',
        zIndex: 20,
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          margin: '20px auto',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      ></div>
      <p>Loading Cosmos...</p>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default CosmosLoading;