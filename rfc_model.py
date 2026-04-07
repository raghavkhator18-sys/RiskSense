import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier

X = pd.read_csv('features_X.csv')
y = pd.read_csv('target_y.csv')

X_train, X_test, y_train, y_test =  train_test_split(X, y, test_size=0.2, random_state=42)

rf_model = RandomForestClassifier(n_estimators=300, max_depth=15, min_samples_leaf=5, 
                                random_state=42, class_weight={0: 1.0, 1: 1.0, 2: 1.6 })
rf_model.fit(X_train, y_train)

X_test.to_csv('X_test.csv', index=False)
y_test.to_csv('y_test.csv', index=False)
joblib.dump(rf_model, 'final_rfc_model.pkl')