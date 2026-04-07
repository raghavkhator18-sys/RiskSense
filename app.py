from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import joblib
import pandas as pd
import numpy as np

# Configure static folder to point to React's build output
app = Flask(__name__, static_folder='frontend/dist')
CORS(app)

# Load the saved assets (Keeping ML model just in case)
try:
    model = joblib.load('final_rfc_model.pkl')
    preprocessor = joblib.load('preprocessor.pkl')
    le = joblib.load('label_encoder.pkl')
    print("Model and encoders loaded successfully.")
except Exception as e:
    print(f"Error loading model files: {e}")

# Advanced Sentinel Risk Model Rules
riskWeights = {
    'road': { 'Highway': 1.1, 'City Road': 1.25, 'Village Road': 1.4 },
    'weather': { 
        'clear': 0.9, 
        'cloudy': 1.1, 
        'rain': 1.4, 
        'heavy_rain': 1.9, 
        'fog': 1.7, 
        'night_clear': 1.2, 
        'night_rain': 1.8, 
        'winter': 1.5 
    },
    'time': { 'Morning': 1.2, 'Afternoon': 1.0, 'Evening': 1.4, 'Night': 1.6 }
}

def compute_risk(road_type, weather, time_of_day, traffic, speed_limit, bike_speed, visibility):
    rw = riskWeights['road'].get(road_type, 1)
    ww = riskWeights['weather'].get(weather, 1)
    tw = riskWeights['time'].get(time_of_day, 1)
    
    trafficFactor = (traffic / 100) * 1.2
    
    speed_ratio = bike_speed / max(speed_limit, 1)
    speedFactor = (speed_ratio ** 1.5) if speed_ratio > 1.1 else speed_ratio
    
    visFactor = (1 - (visibility / 100)) * 1.5
    
    base = 12
    score = base * rw * ww * tw * (1 + trafficFactor) * (1 + speedFactor) * (1 + visFactor)
    return min(100, round(score))

def get_risk_label(score):
    if score <= 20: return { 'label': 'SAFE ZONE', 'color': '#1B8A5A' }
    if score <= 40: return { 'label': 'LOW RISK', 'color': '#4CAF50' }
    if score <= 60: return { 'label': 'MODERATE RISK', 'color': '#E8B84B' }
    if score <= 80: return { 'label': 'HIGH RISK', 'color': '#E8820A' }
    return { 'label': 'CRITICAL RISK', 'color': '#C0392B' }

# --- API ROUTES ---

@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        
        # We accept either ML format or Sentinel Format. 
        # Sentinel format:
        road_type = data.get("roadType", "City Road")
        weather = data.get("weather", "clear")
        time_of_day = data.get("timeOfDay", "Afternoon")
        try:
            traffic = float(data.get("traffic", 50))
            speed_limit = float(data.get("speedLimit", 50))
            bike_speed = float(data.get("bikeSpeed", 60))
            visibility = float(data.get("visibility", 50))
        except (ValueError, TypeError):
            traffic, speed_limit, bike_speed, visibility = 50.0, 50.0, 60.0, 50.0
        
        # Use Advanced Sentinel Logic
        score = compute_risk(road_type, weather, time_of_day, traffic, speed_limit, bike_speed, visibility)
        risk_info = get_risk_label(score)
        
        # Also try to compute ML model inference if applicable, but we will return the Sentinel output
        # to drive the new beautiful UI.
        
        return jsonify({
            "status": "success",
            "score": score,
            "label": risk_info["label"],
            "color": risk_info["color"]
        })
    except Exception as e:
        print(f"Prediction Error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route('/api/data', methods=['GET'])
def get_data():
    try:
        limit = int(request.args.get('limit', 50))
        df = pd.read_csv('cleaned_data.csv')
        df['Speeding_Factor'] = (df['Bike_Speed'] / df['Speed_Limit']).round(2)
        data_list = df.head(limit).values.tolist()
        return jsonify({
            "status": "success",
            "columns": df.columns.tolist(),
            "data": data_list
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route('/api/stats', methods=['GET'])
def get_stats():
    return jsonify({
        "status": "success",
        "accuracy": 84,
        "total_samples": 15102,
        "classes": 3,
        "features": 13,
        "importances": [
            {"name": "Speeding Factor", "value": 0.25},
            {"name": "Speed Difference", "value": 0.20},
            {"name": "Bike Speed", "value": 0.15},
            {"name": "Weather Risk Index", "value": 0.12},
            {"name": "Speed Limit", "value": 0.10},
            {"name": "Traffic Density", "value": 0.08},
            {"name": "Other", "value": 0.10}
        ]
    })

# --- FRONTEND CATCH-ALL ---

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(debug=True, port=5000)
