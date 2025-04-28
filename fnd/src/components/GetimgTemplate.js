import React from 'react';
import '../styles/getimgtemp.css';

function GetimgTemplate({ selectedImage }) { // Accept selectedImage as a prop
  return (
    <div className='getimg-temp'>
      {selectedImage ? (
        <img 
          src={selectedImage} 
          alt="Selected from Construction" 
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
        />
      ) : (
        <div className="placeholder"></div> // Default placeholder when no image is provided
      )}
    </div>
  );
}

export default GetimgTemplate;