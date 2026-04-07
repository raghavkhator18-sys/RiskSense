import joblib
import pandas as pd

model = joblib.load("final_rfc_model.pkl")
preprocessor = joblib.load("preprocessor.pkl") 
le = joblib.load("label_encoder.pkl")

def predict(input_data):
    df = pd.DataFrame([input_data])
    df['Speeding_Factor'] = df['Bike_Speed'] / df['Speed_Limit']
    df['Speed_Difference'] = df['Bike_Speed'] - df['Speed_Limit']
    df['Speed_Condition_Index'] = df['Bike_Speed'] * df['Weather'].apply(lambda x: 2.0 if x == 'Rainy' else 1.0)
    df['Speed_Density_Risk'] = df['Bike_Speed'] / df['Traffic_Density']
    X_transformed = preprocessor.transform(df)
    prediction_numeric = model.predict(X_transformed)[0]
    return le.inverse_transform([prediction_numeric])[0]

sample_input = {
    "Road_Type": "City Road", 
    "Weather": "Clear",
    "Time_of_Day": "Night",
    "Traffic_Density": 5.0,
    "Speed_Limit": 90.0,
    "Bike_Speed": 115.0
}

print("Prediction:", predict(sample_input))