import pandas as pd

df = pd.read_csv('MotorBike_Accident.csv')
print(df.head())

print("\n",df.info(),"\n")

print("\n",df.isnull().sum(),"\n")

df.dropna(inplace=True)

print("\n",df.info(),"\n")

df_cleaned = df[['Road_Type','Weather','Traffic_Density','Speed_Limit','Bike_Speed','Accident_Severity']]
print(df_cleaned.head())

df_cleaned.to_csv('cleaned_data.csv', index=False)
