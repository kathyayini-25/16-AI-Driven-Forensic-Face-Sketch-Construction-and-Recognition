import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ClipLoader from 'react-spinners/ClipLoader';
import '../styles/retrieve.css';

// Dynamically import sample images for fallback
const importAll = (r) => r.keys().map(r);
const sampleImages = importAll(require.context('../assets/sample', false, /\.jpg$/));

function Retrieval({ digitalImage, actualImage }) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [combinedResults, setCombinedResults] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [error, setError] = useState(null);
  const [response_1, setResponse_1] = useState([]); // For digital image details
  const [response_2, setResponse_2] = useState([]); // For actual image details

  // Convert base64 to File
  const base64ToFile = async (base64String, fileName) => {
    try {
      const response = await fetch(base64String);
      const blob = await response.blob();
      return new File([blob], fileName, { type: blob.type });
    } catch (err) {
      throw new Error(`Failed to convert base64 to File: ${err.message}`);
    }
  };

  // Send independent requests for digitalImage and actualImage to /find_similar/
  useEffect(() => {
    const fetchResults = async () => {
      if (!digitalImage || !actualImage) {
        setError('Both digital and actual images are required.');
        console.log('Error: Both digital and actual images are required.');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Request 1: Digital Image
        const digitalFormData = new FormData();
        let digitalImageFile = digitalImage;

        if (typeof digitalImage === 'string' && digitalImage.startsWith('data:image')) {
          digitalImageFile = await base64ToFile(digitalImage, 'digital-image.jpg');
        } else if (typeof digitalImage === 'string') {
          const response = await fetch(digitalImage);
          const blob = await response.blob();
          digitalImageFile = new File([blob], 'digital-image.jpg', { type: blob.type });
        } else if (!(digitalImage instanceof File)) {
          throw new Error('Invalid digitalImage format');
        }

        digitalFormData.append('file', digitalImageFile);

        const digitalResponse = await axios.post('http://localhost:5004/find_similar/', digitalFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        }).catch(() => ({ data: [] }));

        let digitalResults = [];
        if (digitalResponse?.data?.length > 0) {
          const ids = digitalResponse.data.map((arr) => arr[0]);
          console.log("Digital IDs:", ids);
          const response_1 = await axios.post('http://localhost:8000/image/fetch-details', ids);
          console.log("Digital Details Response:", response_1.data);
          setResponse_1(response_1.data.result || []);

          digitalResults = digitalResponse.data.map(([imageId, similarity]) => ({
            id: imageId,
            similarity: parseFloat(similarity),
            url: sampleImages[Math.floor(Math.random() * sampleImages.length)], // Fallback image
            offense: 'N/A',
            mittimus: 'N/A',
            source: 'digital',
          }));
          console.log('Digital Image Results:', digitalResults);
        } else {
          console.log('Digital Image Results: No matches found');
        }

        // Request 2: Actual Image
        const actualFormData = new FormData();
        let actualImageFile = actualImage;

        if (typeof actualImage === 'string' && actualImage.startsWith('data:image')) {
          actualImageFile = await base64ToFile(actualImage, 'actual-image.jpg');
        } else if (typeof actualImage === 'string') {
          const response = await fetch(actualImage);
          const blob = await response.blob();
          actualImageFile = new File([blob], 'actual-image.jpg', { type: blob.type });
        } else if (!(actualImage instanceof File)) {
          throw new Error('Invalid actualImage format');
        }

        actualFormData.append('file', actualImageFile);

        const actualResponse = await axios.post('http://localhost:5004/find_similar/', actualFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        }).catch(() => ({ data: [] }));

        let actualResults = [];
        if (actualResponse?.data?.length > 0) {
          const ids = actualResponse.data.map((arr) => arr[0]);
          console.log("Actual IDs:", ids);
          const response_2 = await axios.post('http://localhost:8000/image/fetch-details', ids);
          console.log("Actual Details Response:", response_2.data);
          setResponse_2(response_2.data.result || []);

          actualResults = actualResponse.data.map(([imageId, similarity]) => ({
            id: imageId,
            similarity: parseFloat(similarity),
            url: sampleImages[Math.floor(Math.random() * sampleImages.length)], // Fallback image
            offense: 'N/A',
            mittimus: 'N/A',
            source: 'actual',
          }));
          console.log('Actual Sketch Results:', actualResults);
        } else {
          console.log('Actual Sketch Results: No matches found');
        }

        // Combine, sort, and select top 5 results
        const combined = [...digitalResults, ...actualResults]
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, 5);
        setCombinedResults(combined);
        console.log('Combined Top 5 Results:', combined);

        // Set error if no results
        if (combined.length === 0) {
          setError('No matches found for either image.');
          console.log('Combined Results: No matches found');
        }
      } catch (error) {
        const errorMessage =
          error.response?.data?.detail || error.message || 'Failed to retrieve images.';
        setError(errorMessage);
        setCombinedResults([]);
        console.log('Error:', errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [digitalImage, actualImage]);

  // Simulate loading animation
  useEffect(() => {
    let interval;
    if (isLoading) {
      interval = setInterval(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % sampleImages.length);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Toggle image details
  const handleInfoClick = (index) => {
    setSelectedImage(selectedImage === `combined-${index}` ? null : `combined-${index}`);
  };

  // Render image results for combined results
  const renderResults = (results) => (
    results.length > 0 && (
      <div className="results-display mb-12">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Top Matched Images</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {results.map((image, index) => {
            const result = image.source === 'digital'
              ? response_1.find((res) => res.id === image.id)
              : response_2.find((res) => res.id === image.id);

            return (
              <div key={index} className="result-card bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="image-wrapper relative">
                  <img
                    src={image?.url !== 'N/A' ? image.url : sampleImages[index % sampleImages.length]}
                    alt={`Result ${index + 1}`}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <button
                    className="info-btn absolute top-3 right-3 bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-blue-700 transition"
                    onClick={() => handleInfoClick(index)}
                  >
                    i
                  </button>
                </div>
                {selectedImage === `combined-${index}` && (
                  <div className="details-box mt-4 bg-gray-50 p-5 rounded-lg border border-gray-200">
                    <div className="text-left space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-500">ID:</span>
                        <p className="text-base font-semibold text-gray-800">{result?.id || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Similarity Score:</span>
                        <p className="text-base text-gray-700">
                          {image.similarity ? `${(image.similarity * 100).toFixed(2)}%` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Source:</span>
                        <p className="text-base text-gray-700">{image.source === 'digital' ? 'Digital Image' : 'Actual Sketch'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Offense:</span>
                        <p className="text-base text-red-600 font-medium">{result?.offense || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Mittimus:</span>
                        <p className="text-base text-gray-700">{result?.mittimus || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Class:</span>
                        <p className="text-base text-gray-700">{result?.class || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Count:</span>
                        <p className="text-base text-gray-700">{result?.count || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Custody Date:</span>
                        <p className="text-base text-gray-700">{result?.custody_date || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Sentence:</span>
                        <p className="text-base text-gray-700">{result?.sentence || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">County:</span>
                        <p className="text-base text-gray-700">{result?.county || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Sentence Discharged:</span>
                        <p className="text-base text-gray-700">{result?.sentence_discharged || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Mark:</span>
                        <p className="text-base text-gray-700">{result?.mark || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    )
  );

  return (
    <div className="retrieval-container max-w-7xl mx-auto px-4 py-12">
      {error && (
        <div className="notfound-res mb-12 bg-red-50 p-6 rounded-lg text-center">
          <h2 className="text-2xl font-bold text-red-700 mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="loading-container flex flex-col items-center justify-center py-12">
          <div className="getimg-card generating mb-4">
            <img
              src={sampleImages[currentImageIndex]}
              alt="Loading"
              className="w-64 h-64 object-cover rounded-lg shadow-md"
            />
          </div>
          <p className="text-gray-600 flex items-center gap-2">
            Loading Results...
            <ClipLoader
              size={24}
              color="#1e40af"
              loading={isLoading}
              speedMultiplier={1.5}
              aria-label="Loading Spinner"
              data-testid="loader"
            />
          </p>
        </div>
      ) : (
        <>
          {renderResults(combinedResults)}
          {combinedResults.length === 0 && !error && (
            <div className="notfound-res bg-gray-50 p-6 rounded-lg text-center">
              <h2 className="text-2xl font-bold text-gray-700 mb-2">No Similar Images Found</h2>
              <p className="text-gray-600">No results found</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Retrieval;