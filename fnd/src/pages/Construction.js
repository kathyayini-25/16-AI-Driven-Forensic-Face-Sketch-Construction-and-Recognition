import React, { useState, useRef } from "react";
import html2canvas from "html2canvas";
import "../styles/construction.css";
import FeatureCard from "../components/FeatureCard";
import Generate from "./Generate";
import { useNavigate } from 'react-router-dom';

const importAll = (r) => r.keys().map(r);

const headImages = importAll(require.context("../assets/head", false, /\.(png|jpe?g|svg)$/));
const eyesImages = importAll(require.context("../assets/eyes", false, /\.(png|jpe?g|svg)$/));
const noseImages = importAll(require.context("../assets/nose", false, /\.(png|jpe?g|svg)$/));
const eyebrowsImages = importAll(require.context("../assets/eyebrows", false, /\.(png|jpe?g|svg)$/));
const lipsImages = importAll(require.context("../assets/lips", false, /\.(png|jpe?g|svg)$/));
const mustachImages = importAll(require.context("../assets/mustach", false, /\.(png|jpe?g|svg)$/));
const hairImages = importAll(require.context("../assets/hair", false, /\.(png|jpe?g|svg)$/));
const moreImages = importAll(require.context("../assets/more", false, /\.(png|jpe?g|svg)$/));

// Import demo images
const alexImage = require("../assets/Alex.png");
const bobImage = require("../assets/Bob.png");

const featureImages = {
  head: headImages,
  eyes: eyesImages,
  nose: noseImages,
  eyebrows: eyebrowsImages,
  lips: lipsImages,
  mustach: mustachImages,
  hair: hairImages,
  more: moreImages,
};

const DEFAULT_POSITIONS = {
  head: { x: 0, y: 0, rotation: 0, scale: 1, zIndex: 0 },
  eyes: { x: 100, y: 120, rotation: 0, scale: 1, zIndex: 2 },
  nose: { x: 160, y: 200, rotation: 0, scale: 1, zIndex: 3 },
  eyebrows: { x: 100, y: 80, rotation: 0, scale: 1, zIndex: 1 },
  lips: { x: 140, y: 280, rotation: 0, scale: 1, zIndex: 5 },
  mustach: { x: 140, y: 260, rotation: 0, scale: 1, zIndex: 4 },
  hair: { x: 0, y: -40, rotation: 0, scale: 1, zIndex: 6 },
  more: { x: 0, y: 0, rotation: 0, scale: 1, zIndex: 7 },
};

function Construction() {
  const retrievalRef = useRef(null);
  const [feature, setFeature] = useState("head");
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [demoImage, setDemoImage] = useState(null);
  const [showDemoPopup, setShowDemoPopup] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState("");
  const [currentSelections, setCurrentSelections] = useState({
    head: null,
    eyes: null,
    nose: null,
    eyebrows: null,
    lips: null,
    mustach: null,
    hair: null,
    more: null,
  });
  const [imagePositions, setImagePositions] = useState(DEFAULT_POSITIONS);
  const [dragging, setDragging] = useState(null);
  const [rotating, setRotating] = useState(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [startAngle, setStartAngle] = useState(0);
  const [fileName, setFileName] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [showRetrievePopup, setShowRetrievePopup] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const navigate = useNavigate();

  const handleClick = (item) => {
    setFeature(item);
    setSelectedFeature(item);
    setDemoImage(null);
  };

  const handleImageClick = (img, featureKey = feature) => {
    setCurrentSelections((prevSelections) => ({
      ...prevSelections,
      [featureKey]: img,
    }));
  };

  const handleFeatureSelect = (key) => {
    setSelectedFeature(key);
    setFeature(key);
  };

  const handleMouseDown = (e, imgKey, isRotation = false) => {
    e.stopPropagation();
    handleFeatureSelect(imgKey);
    if (isRotation) {
      setRotating(imgKey);
      const rect = e.target.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      setStartAngle(
        Math.atan2(e.clientY - centerY, e.clientX - centerX) -
          (imagePositions[imgKey].rotation * Math.PI) / 180
      );
    } else {
      setDragging(imgKey);
      setOffset({
        x: e.clientX - imagePositions[imgKey].x,
        y: e.clientY - imagePositions[imgKey].y,
      });
    }
  };

  const handleMouseMove = (e) => {
    if (dragging) {
      const newPosition = {
        x: e.clientX - offset.x,
        y: e.clientY - offset.y,
      };
      setImagePositions((prevPositions) => ({
        ...prevPositions,
        [dragging]: {
          ...prevPositions[dragging],
          x: newPosition.x,
          y: newPosition.y,
        },
      }));
    } else if (rotating) {
      const rect = e.target.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      const rotation = (angle - startAngle) * (180 / Math.PI);
      setImagePositions((prevPositions) => ({
        ...prevPositions,
        [rotating]: {
          ...prevPositions[rotating],
          rotation: rotation,
        },
      }));
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
    setRotating(null);
  };

  const handleScale = (increase) => {
    if (!selectedFeature) return;
    setImagePositions((prevPositions) => ({
      ...prevPositions,
      [selectedFeature]: {
        ...prevPositions[selectedFeature],
        scale: Math.max(
          0.5,
          Math.min(2, prevPositions[selectedFeature].scale + (increase ? 0.1 : -0.1))
        ),
      },
    }));
  };

  const handleZIndexChange = (e) => {
    if (!selectedFeature) return;
    setImagePositions((prevPositions) => ({
      ...prevPositions,
      [selectedFeature]: {
        ...prevPositions[selectedFeature],
        zIndex: parseInt(e.target.value),
      },
    }));
  };

  const handleDeselect = (e) => {
    if (e.target.className === "image-construction") {
      setSelectedFeature(null);
    }
  };

  const handleSaveClick = () => {
    setShowPopup(true);
  };

  const handleSaveImage = () => {
    if (!fileName) return;
    const imageContainer = document.querySelector(".image-construction");
    html2canvas(imageContainer).then((canvas) => {
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `${fileName}.png`;
      link.click();
    });
    setShowPopup(false);
    setFileName("");
  };

  const handleReset = () => {
    setCurrentSelections({
      head: null,
      eyes: null,
      nose: null,
      eyebrows: null,
      lips: null,
      mustach: null,
      hair: null,
      more: null,
    });
    setImagePositions(DEFAULT_POSITIONS);
    setSelectedFeature(null);
    setDemoImage(null);
    setShowDemoPopup(false);
    setFeature("head");
    setSelectedDemo("");
    setSelectedImage(null);
  };

  const handleDemoLoad = (demoName) => {
    const image = demoName === "alex" ? alexImage : bobImage;
    setDemoImage(image);
    setShowDemoPopup(true);
  };

  const handleRetrieve = () => {
    setShowRetrievePopup(true);
  };

  const captureConstructionImage = () => {
    const imageContainer = document.querySelector(".image-construction");
    html2canvas(imageContainer).then((canvas) => {
      canvas.toBlob((blob) => {
        const file = new File([blob], "constructed_image.png", { type: "image/png" });
        setSelectedImage(file);
        setShowRetrievePopup(false);
        scrollToGenerate();
      }, "image/png");
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setShowRetrievePopup(false);
      scrollToGenerate();
    }
  };

  const scrollToGenerate = () => {
    if (retrievalRef.current) {
      retrievalRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <div className="construction-main">
        {/* <button className=" bg-blue-500 my-2 py-1.5 px-5 text-white rounded-lg shadow-sm hover:bg-blue-600" onClick={() => navigate('/upload')}>
          Upload Image
        </button> */}
        <h2>Face Construction ...</h2>
        <div className="construction-body">
          <div className="construction-top-menu">
            {Object.keys(featureImages).map((key) => (
              <div key={key} className="feature-menu-item">
                <div
                  className={`facial-feature-item ${
                    selectedFeature === key ? "selected" : ""
                  }`}
                  onClick={() => handleClick(key)}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </div>
                {selectedFeature === key && (
                  <div className="feature-dropdown">
                    <select
                      value={imagePositions[key].zIndex}
                      onChange={handleZIndexChange}
                    >
                      {[0, 1, 2, 3, 4, 5, 6, 7].map((z) => (
                        <option key={z} value={z}>
                          {z}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ))}
            <div className="feature-menu-item">
              <div className="facial-feature-item">Demo</div>
              <div className="feature-dropdown">
                <select
                  value={selectedDemo}
                  onChange={(e) => {
                    setSelectedDemo(e.target.value);
                    if (e.target.value) {
                      handleDemoLoad(e.target.value);
                    }
                  }}
                >
                  <option value="">Select Demo</option>
                  <option value="alex">Alex</option>
                  <option value="bob">Bob</option>
                </select>
              </div>
            </div>
          </div>

          <div className="construction-bottom-section">
            <div className="construction-left-section">
              <div
                className="image-construction"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onClick={handleDeselect}
                style={{
                  position: "relative",
                  width: "600px",
                  height: "800px",
                  border: "1px solid #ccc",
                  overflow: "hidden",
                  backgroundColor: "#f0f0f0",
                }}
              >
                {Object.keys(currentSelections).map((key) =>
                  currentSelections[key] ? (
                    <div
                      key={key}
                      className={`feature-container ${
                        selectedFeature === key ? "selected" : ""
                      }`}
                      style={{
                        position: "absolute",
                        left: `${imagePositions[key].x}px`,
                        top: `${imagePositions[key].y}px`,
                        transform: `rotate(${imagePositions[key].rotation}deg) scale(${imagePositions[key].scale})`,
                        zIndex: imagePositions[key].zIndex,
                      }}
                    >
                      <img
                        src={currentSelections[key]}
                        alt={key}
                        style={{
                          cursor: "pointer",
                          maxWidth: "100%",
                          userSelect: "none",
                        }}
                        onMouseDown={(e) => handleMouseDown(e, key)}
                      />
                      {selectedFeature === key && (
                        <>
                          <div
                            className="rotation-handle"
                            onMouseDown={(e) => handleMouseDown(e, key, true)}
                            style={{
                              position: "absolute",
                              width: "10px",
                              height: "10px",
                              background: "blue",
                              borderRadius: "50%",
                              top: "-15px",
                              left: "50%",
                              transform: "translateX(-50%)",
                              cursor: "pointer",
                            }}
                          />
                          <div
                            className="scale-plus"
                            onClick={() => handleScale(true)}
                            style={{
                              position: "absolute",
                              right: "-15px",
                              top: "50%",
                              transform: "translateY(-50%)",
                              cursor: "pointer",
                              background: "green",
                              width: "10px",
                              height: "10px",
                              borderRadius: "50%",
                              color: "white",
                              textAlign: "center",
                              lineHeight: "10px",
                            }}
                          >
                            +
                          </div>
                          <div
                            className="scale-minus"
                            onClick={() => handleScale(false)}
                            style={{
                              position: "absolute",
                              left: "-15px",
                              top: "50%",
                              transform: "translateY(-50%)",
                              cursor: "pointer",
                              background: "red",
                              width: "10px",
                              height: "10px",
                              borderRadius: "50%",
                              color: "white",
                              textAlign: "center",
                              lineHeight: "10px",
                            }}
                          >
                            -
                          </div>
                        </>
                      )}
                    </div>
                  ) : null
                )}
              </div>
            </div>

            <div className="construction-right-section">
              <div className="construction-controls">
                <div
                  className="construction-control-btn"
                  onClick={handleSaveClick}
                >
                  Save
                </div>
                <div
                  className="construction-control-btn"
                  onClick={handleReset}
                >
                  Reset
                </div>
                <div
                  className="construction-control-btn"
                  onClick={handleRetrieve}
                >
                  Retrieve
                </div>
              </div>

              <div className="construction-suggestion-title">
                Suggestions for {feature} features
              </div>

              <div className="construction-suggestions">
                {featureImages[feature].map((img, index) => (
                  <FeatureCard
                    key={index}
                    height="100"
                    width="100"
                    path={img}
                    onClick={() => handleImageClick(img)}
                  />
                ))}
              </div>

              <div className="construction-suggestion-title">AI Suggestions</div>

              <div className="construction-suggestions">
                {(() => {
                  const allFeatures = Object.keys(featureImages);
                  const unusedFeatures = allFeatures.filter(
                    (key) => !currentSelections[key]
                  );
                  const featuresToShow = [
                    ...unusedFeatures,
                    ...allFeatures.filter((key) => currentSelections[key]),
                  ].slice(0, 10);
                  const shuffledFeatures = featuresToShow.sort(
                    () => Math.random() - 0.5
                  );

                  return shuffledFeatures.map((key) => {
                    const images = featureImages[key];
                    const randomImage =
                      images[Math.floor(Math.random() * images.length)];
                    return (
                      <FeatureCard
                        key={key}
                        height="100"
                        width="100"
                        path={randomImage}
                        onClick={() => handleImageClick(randomImage, key)}
                      />
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </div>

        {showPopup && (
          <div className="save-popup">
            <div className="popup-content">
              <h3>Enter File Name</h3>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="File name"
              />
              <button onClick={handleSaveImage}>Save Image</button>
              <button onClick={() => setShowPopup(false)}>Cancel</button>
            </div>
          </div>
        )}

        {showDemoPopup && (
          <div className="demo-popup">
            <div className="popup-content">
              <img
                src={demoImage}
                alt="Demo"
                style={{ maxWidth: "100%", maxHeight: "80vh" }}
              />
              <button onClick={() => setShowDemoPopup(false)}>Close</button>
            </div>
          </div>
        )}

        {showRetrievePopup && (
          <div className="retrieve-popup">
            <div className="popup-content">
              <h3>Choose Image Source</h3>
              <button onClick={captureConstructionImage}>
                Use Current Construction
              </button>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
              <button onClick={() => setShowRetrievePopup(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div ref={retrievalRef}>
        <Generate selectedImage={selectedImage} />
      </div>
    </>
  );
}

export default Construction;