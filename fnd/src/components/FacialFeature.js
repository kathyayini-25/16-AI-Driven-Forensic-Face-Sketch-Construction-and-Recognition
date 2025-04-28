import React from 'react';
import '../styles/facialfuture.css';

function FacialFeature({ height, width, path, title }) {
  const handleClick = () => {
    alert(`Image Path: ${path}`);
  };

  return (
    <div className='facial-future'>
      {/* Downscaled image using backgroundImage */}
      <div 
        className="facial-future-card" 
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
        onClick={handleClick}
      />
      <p 
        style={{
          margin: '0px',
          padding: '0px',
          textAlign: 'center',
        }}
      >
        {title}
      </p>
    </div>
  );
}

export default FacialFeature;
