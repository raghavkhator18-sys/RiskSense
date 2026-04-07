# RiskSense — Predictive Flow Intelligence

RiskSense is an advanced, AI-augmented safety dashboard designed for real-time traffic hazard forecasting and environmental risk simulation. Built for precision and situational awareness, it integrates machine learning insights with live environmental data to provide actionable safety metrics for commuters and infrastructure managers.

![RiskSense Dashboard](frontend/dist/assets/risksense_dashboard_verified_1775421429144.png) *(Note: Add your actual screenshot path here or use generated assets)*

## 🚀 Key Features

- **Advanced RiskSense Engine**: A calibrated scoring model that dynamically adjusts for Road Type (Highway, Urban, Village), Weather, Traffic Density, and Visibility.
- **Real-time Predictive Analytics**: Uses a Random Forest Classifier (RFC) to forecast collision risk and congestion levels based on current sensor inputs.
- **Live Weather Integration**: Automatically fetches local temperature, wind speed, and visibility via the OpenWeatherMap API.
- **Dynamic Visual Simulator**: A high-fidelity UI featuring Material Design 3 principles, interactive gauges, and real-time environment summaries.
- **Non-Linear Speeding Penalty**: Implements exponential risk scaling when a vehicle exceeds the speed limit, reflecting real-world kinetic hazards.
- **Interactive Risk Map**: (Planned) Integration with Google Maps API for geographic hazard overlays.

## 🛠️ Tech Stack

- **Frontend**:
  - Vanilla JavaScript (ES6+)
  - HTML5 & CSS3 (Custom Design System)
  - Vite (Build Tool)
  - Material Design 3 & Material Icons
- **Backend**:
  - Python (Flask Framework)
  - Pandas (Data Processing)
  - Scikit-learn / Joblib (ML Model Handling)
- **External APIs**:
  - OpenWeatherMap (Weather Data)
  - Google Maps JavaScript API (Geospatial - Optional)

## 📦 Installation & Setup

### 1. Prerequisite
Ensure you have **Python 3.8+** and **Node.js 18+** installed on your system.

### 2. Backend Setup
Navigate to the root directory and install Python dependencies:
```bash
pip install flask flask-cors pandas joblib numpy
```

### 3. Frontend Setup
Navigate to the `frontend` directory and build the production assets:
```bash
cd frontend
npm install
npm run build
```

### 4. Running the Application
Return to the root directory and start the Flask server:
```bash
python app.py
```
The application will be available at `http://127.0.0.1:5000/`.

## 🧠 Risk Calculation Logic

The "RiskSense Score" is calculated using a multi-factor multiplicative formula:
- **Road Type**: Weighted for infrastructure complexity (Village > City > Highway).
- **Weather**: Multipliers for precipitation, fog, and night visibility.
- **Traffic Density**: Linear risk scaling up to 120% penalty at full congestion.
- **Speed Factor**: Exponential penalty (`Ratio^1.5`) when exceeding the speed limit by >110%.
- **Visibility**: Severe hazard multipliers for visibility scores below 30%.

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.

---
*Developed by the Raghav Khator*
