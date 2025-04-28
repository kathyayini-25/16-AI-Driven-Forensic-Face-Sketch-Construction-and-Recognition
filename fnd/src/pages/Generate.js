import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import '../styles/generate.css';
import GetimgTemplate from '../components/GetimgTemplate';
import Retrieval from './Retrieval';

function Generate({ selectedImage }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [finalImage, setFinalImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showRetrieval, setShowRetrieval] = useState(false);
  const [error, setError] = useState(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);
  const retrievalRef = useRef(null);

  // Convert File to base64 URL for GetimgTemplate
  useEffect(() => {
    if (selectedImage instanceof File) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImageUrl(event.target.result);
      };
      reader.readAsDataURL(selectedImage);
    } else {
      setSelectedImageUrl(null);
    }
  }, [selectedImage]);

  const handleAIGenerate = async () => {
    console.log('selectedImage:', selectedImage, 'isFile:', selectedImage instanceof File);
    if (!selectedImage) {
      setError('Please select an image to generate.');
      return;
    }

    if (!(selectedImage instanceof File)) {
      setError('Selected image is not a valid file. Please upload a valid image.');
      return;
    }

    if (!selectedImage.type.startsWith('image/')) {
      setError('Selected file is not an image. Please upload a valid image (e.g., JPG, PNG).');
      return;
    }

    setIsGenerating(true);
    setFinalImage(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('digitalImage', selectedImage);

      console.log('Sending FormData:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      const response = await axios.post('http://localhost:5003/image/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log('API Response:', response.data);
      if (response?.data?.result?.generatedImage) {
        setFinalImage(response.data.result.generatedImage);
        // console.log('finalImage set:', response.data.result.generatedImage);
      } else {
        throw new Error('No generated image in response');
      }
    } catch (err) {
      console.error('API Error:', err);
      const errorMessage = err.response?.data?.detail || err.message;
      setError(`Failed to generate image: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFindMatch = () => {
    if (!selectedImage || !finalImage) {
      setError('Both digital and generated images are required to find matches.');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setShowRetrieval(true);
      if (retrievalRef.current) {
        retrievalRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 3000);
  };

  return (
    <div>
      <h2>AI Image Generation</h2>
      {error && <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
      <div className="generate-container">
        <div className="generate-actual-img">
          <GetimgTemplate selectedImage={selectedImageUrl} />
        </div>

        <div className="generate-output-img">
          <div className={`getimg-card ${isGenerating ? 'generating' : ''}`}>
            {isGenerating ? (
              <div className="loading">Generating...</div>
            ) : finalImage ? (
              <img src={finalImage} alt="Generated" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            ) : (
              <div>No generated image yet. Click "AI Generate" to create one.</div>
            )}
          </div>
        </div>
      </div>
      <div className="button-container">
        <button
          className="ai-generate-btn"
          onClick={handleAIGenerate}
          disabled={isGenerating || isLoading}
        >
          {isGenerating ? 'Generating...' : 'AI Generate'}
        </button>
        <button
          className="find-btn"
          onClick={handleFindMatch}
          disabled={isLoading || !selectedImage || !finalImage}
        >
          {isLoading ? <span className="loader"></span> : 'Find Match'}
        </button>
      </div>
      {showRetrieval && (
        <div ref={retrievalRef}>
          <Retrieval digitalImage={selectedImage} actualImage={finalImage} />
        </div>
      )}
    </div>
  );
}

export default Generate;