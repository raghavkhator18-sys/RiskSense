import sys
import os

from app import compute_risk, riskWeights

scenarios = [
    # Baseline comparison (Clear, Afternoon, 50% traffic, Speed Limit = Bike Speed, 100% vis)
    {"name": "Highway Baseline", "params": ["Highway", "clear", "Afternoon", 50.0, 80.0, 80.0, 100.0]},
    {"name": "City Baseline", "params": ["City Road", "clear", "Afternoon", 50.0, 50.0, 50.0, 100.0]},
    {"name": "Village Baseline", "params": ["Village Road", "clear", "Afternoon", 50.0, 30.0, 30.0, 100.0]},

    # Extreme hazard (Night, Rain, 100% traffic, speeding 40% over limit, 20% vis)
    {"name": "Highway Extreme", "params": ["Highway", "night_rain", "Night", 100.0, 80.0, 112.0, 20.0]},
    {"name": "City Extreme", "params": ["City Road", "night_rain", "Night", 100.0, 50.0, 70.0, 20.0]},
    {"name": "Village Extreme", "params": ["Village Road", "night_rain", "Night", 100.0, 30.0, 42.0, 20.0]},
    
    # Speeding heavily but clear (Clear, Afternoon, 20% traffic, speeding 60% over limit, 100% vis)
    {"name": "Highway Speeding", "params": ["Highway", "clear", "Afternoon", 20.0, 80.0, 128.0, 100.0]},
    {"name": "City Speeding", "params": ["City Road", "clear", "Afternoon", 20.0, 50.0, 80.0, 100.0]},
    {"name": "Village Speeding", "params": ["Village Road", "clear", "Afternoon", 20.0, 30.0, 48.0, 100.0]},
]

print("-" * 100)
print(f"{'Scenario':<65} | {'Score':<5} | {'Label':<10}")
print("-" * 100)
for s in scenarios:
    score = compute_risk(*s["params"])
    if score >= 80: label = "CRITICAL"
    elif score >= 60: label = "HIGH"
    elif score >= 40: label = "MODERATE"
    elif score >= 20: label = "LOW"
    else: label = "SAFE"
    print(f"{s['name']:<65} | {score:<5} | {label:<10}")
print("-" * 100)
