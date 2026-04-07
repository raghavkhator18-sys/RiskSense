import pandas as pd
import joblib
import matplotlib.pyplot as plt 
from sklearn.metrics import classification_report,accuracy_score, confusion_matrix, ConfusionMatrixDisplay

X_test = pd.read_csv('X_test.csv')
y_test = pd.read_csv('y_test.csv')

# Load the saved assets
model = joblib.load('final_rfc_model.pkl')
le = joblib.load('label_encoder.pkl')

# Run predictions
y_pred = model.predict(X_test)

# Accuracy Score
print(f"Accuracy Score: {accuracy_score(y_test, y_pred):.2f}")

# Classification Report
print("--- FINAL MODEL PERFORMANCE ---")
print(classification_report(y_test, y_pred, target_names=le.classes_))

# Confusion Matrix
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay
import matplotlib.pyplot as plt

cm = confusion_matrix(y_test, y_pred)

fig, ax = plt.subplots(figsize=(8, 6))

disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=le.classes_)
disp.plot(cmap=plt.cm.Blues, ax=ax) 

ax.set_title("Confusion Matrix: Accident Severity")
plt.show()