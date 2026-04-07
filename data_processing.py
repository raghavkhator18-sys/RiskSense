import pandas as pd
import joblib

df = pd.read_csv('cleaned_data.csv')

# Feature Engineering
df['Speeding_Factor'] = df['Bike_Speed'] / df['Speed_Limit']
df['Speed_Difference'] = df['Bike_Speed'] - df['Speed_Limit']
df['Speed_Condition_Index'] = df['Bike_Speed'] * df['Weather'].apply(lambda x: 2.0 if x == 'Rainy' else 1.0)
df['Speed_Density_Risk'] = df['Speeding_Factor'] * df['Traffic_Density']

df.loc[df['Speeding_Factor'] > 1.50, 'Accident_Severity'] = 'Severe Accident'
df.loc[(df['Traffic_Density'] < 3.0) & (df['Speeding_Factor'] <= 1.0) & (df['Accident_Severity'] == 'Severe Accident'), 'Accident_Severity'] = 'No Accident'
df.loc[(df['Traffic_Density'] < 3.0) & (df['Speeding_Factor'] <= 1.3) &  (df['Speeding_Factor'] > 1.0), 'Accident_Severity'] = 'Moderate Accident'
df.loc[(df['Road_Type'] == 'Highway') & (df['Speeding_Factor'] <= 1.42) & (df['Speeding_Factor'] > 1.0), 'Accident_Severity'] = 'Moderate Accident'

# Data Preprocessing
from sklearn.preprocessing import LabelEncoder
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer

##  Encode Feature variables
preprocessor = ColumnTransformer(
    transformers=[('nominal', OneHotEncoder(), ['Road_Type', 'Weather'])],
    remainder='passthrough'
)

X = df.drop('Accident_Severity', axis=1)
X_encoded_array = preprocessor.fit_transform(X)

new_column_names = preprocessor.get_feature_names_out()

X = pd.DataFrame(X_encoded_array, columns=new_column_names)
X.to_csv('features_X.csv', index=False)

## Encode Target variable
from sklearn.preprocessing import LabelEncoder

le = LabelEncoder()
y_encoded_series = le.fit_transform(df['Accident_Severity'])

y = pd.DataFrame(y_encoded_series, columns=['Accident_Severity'])
y.to_csv('target_y.csv', index=False)

mapping = dict(zip(range(len(le.classes_)), le.classes_))
print("Label Mapping:", mapping)

# Storing the preprocessor and label encoder 
joblib.dump(preprocessor, 'preprocessor.pkl')
joblib.dump(le, 'label_encoder.pkl')