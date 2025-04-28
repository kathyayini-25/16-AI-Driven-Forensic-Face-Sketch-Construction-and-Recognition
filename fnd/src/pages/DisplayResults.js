import { useState } from 'react';
import '../styles/resultsdisplay.css'
import GetimgTemplate from '../components/GetimgTemplate';


function ResultsDisplay() {
  // State to track the current item index (starts at 0)
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Total number of items (5 in your case)
  const totalItems = 5;

  // Handler for "Next" button
  const handleNext = () => {
    if (currentIndex < totalItems - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Handler for "Prev" button
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <>
      <h2>Matches Found</h2>
      <div className="display-results">
        {/* Display only the current item */}
        <div className="res-box" key={currentIndex}>
          <GetimgTemplate />
          <div className="res-details"><h1>{currentIndex}</h1></div>
        </div>
        
        {/* Navigation buttons */}
        <div className="prevnext-btn">
          <button 
            className="dir-btn" 
            onClick={handlePrev} 
            disabled={currentIndex === 0} // Disable if at first item
          >
            Prev
          </button>
          <button 
            className="dir-btn" 
            onClick={handleNext} 
            disabled={currentIndex === totalItems - 1} // Disable if at last item
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}


export default ResultsDisplay;