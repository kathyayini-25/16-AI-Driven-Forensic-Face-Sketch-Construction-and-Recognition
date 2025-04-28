import React from 'react';
import '../styles/futurecard.css';

function FeatureCard({ height, width, path, onClick }) {
  return (
    <div 
      className="future-card" 
      style={{
        height: `${height}px`, 
        width: `${width}px`, 
        backgroundImage: `url(${path})`,
        backgroundSize: 'contain', // Ensures the entire image is visible
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        cursor: 'pointer',
        border: '1px solid #ccc', // Optional: adds a border for clarity
      }}
      onClick={() => onClick(path)}  // Call the onClick handler passed as a prop
    >
    </div>
  );
}

export default FeatureCard;
