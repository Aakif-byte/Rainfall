import pickle
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS # Used to allow the React front-end to connect

# --- Initialization ---
app = Flask(__name__)
# Enable CORS for all routes (important for front-end development)
CORS(app) 

# --- Load Model and Features ---
MODEL_FILE = 'model_rainfall.pkl'

try:
    with open(MODEL_FILE, 'rb') as f:
        # model_data contains {"model": RandomForestClassifier, "features": [...] }
        model_data = pickle.load(f)
    
    model = model_data['model']
    feature_names = model_data['features']
    print("Model loaded successfully.")

except FileNotFoundError:
    print(f"ERROR: Model file '{MODEL_FILE}' not found. Ensure it is in the same directory.")
    model = None
    feature_names = []
except Exception as e:
    print(f"ERROR loading model: {e}")
    model = None
    feature_names = []


# --- API Endpoint for Prediction ---
@app.route('/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({"error": "Model failed to load on server."}), 500

    try:
        # Get data posted as JSON
        data = request.get_json()
        
        # --- 1. Prepare Data for Prediction ---
        # The React app will send a dictionary like:
        # {"MinTemp": 15.0, "MaxTemp": 25.5, "Humidity9am": 65, ...}
        
        # Create a dictionary to hold the feature values, initializing with 0 or NaN 
        # for safety if a feature is missing.
        input_data_dict = {feature: data.get(feature, 0) for feature in feature_names}
        
        # Convert the dictionary into a DataFrame in the exact order the model expects
        input_df = pd.DataFrame([input_data_dict], columns=feature_names)
        
        # --- 2. Make Prediction ---
        # Assuming your model predicts a class (e.g., 0 for No Rain, 1 for Rain)
        prediction_class = model.predict(input_df)[0] 
        
        # Get prediction probabilities if your model supports it (useful for front-end display)
        # Assuming class 1 is "Rain" and class 0 is "No Rain"
        prediction_proba = model.predict_proba(input_df)[0]
        rain_probability = prediction_proba[1] * 100 # Probability of class 1 (Rain)
        
        # --- 3. Format Response ---
        result = {
            "prediction": int(prediction_class), # Convert numpy int to standard Python int
            "will_rain": "Yes" if prediction_class == 1 else "No",
            "probability_of_rain": f"{rain_probability:.2f}%"
        }

        return jsonify(result)

    except Exception as e:
        app.logger.error(f"Prediction error: {e}")
        return jsonify({"error": "An error occurred during prediction.", "details": str(e)}), 400

# --- Run the App ---
if __name__ == '__main__':
    # Flask will run on http://127.0.0.1:5000/
    app.run(debug=True)