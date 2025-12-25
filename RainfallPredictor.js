import React, { useState } from 'react';
import './RainfallPredictor.css'; // Create this CSS file for styling

// Replace these with the actual feature names from your model_rainfall.pkl!
const REQUIRED_FEATURES = [
    'pressure', 
    'dewpoint', 
    'humidity', 
    'cloud', 
    'sunshine',
    'winddirection', 
    'windspeed'
    // ... add all other features your model expects
]; 

function RainfallPredictor() {
    // State to hold the user inputs (e.g., { MinTemp: 15.0, MaxTemp: 25.5, ... })
    const [formData, setFormData] = useState({});
    
    // State to hold the API response
    const [predictionResult, setPredictionResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Handles changes to input fields
    const handleChange = (e) => {
        const { name, value } = e.target;
        // Convert to float for numerical inputs
        setFormData(prevData => ({
            ...prevData,
            [name]: parseFloat(value) || 0, // Default to 0 if conversion fails
        }));
    };

    // Handles the form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setPredictionResult(null);

        // Ensure all required features are in the form data before sending
        const payload = REQUIRED_FEATURES.reduce((acc, feature) => {
            acc[feature] = formData[feature] || 0; // Send 0 if feature wasn't touched
            return acc;
        }, {});

        try {
            const response = await fetch('http://127.0.0.1:5000/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                // Handle HTTP errors (e.g., 400, 500)
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP Error: ${response.status}`);
            }

            const data = await response.json();
            setPredictionResult(data);

        } catch (err) {
            console.error("Prediction failed:", err);
            setError(err.message || "Could not connect to the prediction server.");
        } finally {
            setIsLoading(false);
        }
    };

    // Helper function to render all input fields
    const renderInputs = () => {
        return REQUIRED_FEATURES.map(feature => (
            <div className="input-group" key={feature}>
                <label htmlFor={feature}>{feature}:</label>
                <input
                    type="number"
                    id={feature}
                    name={feature}
                    step="any"
                    required
                    onChange={handleChange}
                    value={formData[feature] || ''}
                    placeholder={`Enter ${feature} value`}
                />
            </div>
        ));
    };

    // 🛑 START OF METER RENDERING FUNCTION 🛑
    const renderProbabilityMeter = (probabilityString) => {
        // 1. Extract the numeric value (e.g., "62.20%" -> 62.2)
        const probability = parseFloat(probabilityString.replace('%', ''));
        
        // 2. Map the probability (0-100) to a rotation angle (0-180 degrees)
        const rotationAngle = (probability / 100) * 180;

        return (
            <div className="meter-wrapper">
                <div className="meter-container">
                    {/* Meter Background (The static semi-circle) */}
                    <div className="meter-circle"></div>
                    
                    {/* Meter Fill (The moving color fill) */}
                    <div 
                        className="meter-fill" 
                        style={{ transform: `rotate(${rotationAngle}deg)` }}
                    ></div>
                    
                    {/* Meter Needle (The actual pointer) */}
                    <div 
                        className="meter-needle" 
                        style={{ transform: `rotate(${rotationAngle}deg)` }}
                    ></div>
                    
                    {/* Center Cutout and Value Display */}
                    <div className="meter-center">
                        <div className="meter-value">
                            {probabilityString}
                        </div>
                    </div>
                </div>
            </div>
        );
    };
    // 🛑 END OF METER RENDERING FUNCTION 🛑

    return (
        <div className="video-background-container"> 
            
            {/* 2. The Video Element (with public path /bgvideo.mp4) */}
            <video autoPlay loop muted className="background-video">
                <source src="/bgvideo.mp4" type="video/mp4" /> 
                Your browser does not support the video tag.
            </video>

            {/* 3. The Actual Content Container */}
            <div className="predictor-content-wrapper">
                
                <h1>💧 Rainfall Prediction</h1>
                
                <form onSubmit={handleSubmit}>
                    <div className="input-grid">
                        {renderInputs()}
                    </div>
                    <button type="submit" disabled={isLoading}>
                        {isLoading ? (
                            <div className="rain-loader-container">
                                <div className="rain-loader-drop"></div>
                                <div className="rain-loader-shadow"></div>
                            </div>
                        ) : (
                            'Get Prediction'
                        )}
                    </button>
                </form>

                {error && (
                    <div className="result-box error-box">
                        <h3>Prediction Error:</h3>
                        <p>{error}</p>
                    </div>
                )}

                {predictionResult && (
                    <div className={`result-box animate ${predictionResult.will_rain === 'Yes' ? 'rain-bg' : 'no-rain-bg'}`}>
                        <h2>Prediction Result:</h2>
                        <p>Will it rain tomorrow? 
                           <span className="prediction-text"> {predictionResult.will_rain}</span>
                        </p>
                        
                        {/* 🛑 METER INTEGRATION: Removed old probability text and added the meter 🛑 */}
                        {renderProbabilityMeter(predictionResult.probability_of_rain)}
                        {/* 🛑 END OF METER INTEGRATION 🛑 */}

                    </div>
                )}
            </div> {/* Closing predictor-content-wrapper */}
        </div> // Closing video-background-container
    );
}

export default RainfallPredictor;