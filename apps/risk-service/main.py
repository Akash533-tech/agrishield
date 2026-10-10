"""Deterministic, explainable demo risk scoring. Not an actuarial model."""
from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(title="AgroShield Risk Service", version="0.1.0")

class RiskInput(BaseModel):
    rainfall_percent_of_normal: float = Field(ge=0, le=300)
    peak_temperature_c: float = Field(ge=-20, le=65)
    drought_index: float = Field(ge=0, le=100)
    verified_water_practice: bool = False

@app.get("/health")
def health(): return {"ok": True, "model": "deterministic-demo-v1"}

@app.post("/score")
def score(v: RiskInput):
    rainfall = min(45, abs(100-v.rainfall_percent_of_normal)*0.32)
    heat = min(30, max(0, v.peak_temperature_c-30)*2.2)
    drought = v.drought_index*0.25
    base = min(100, round(rainfall+heat+drought, 2))
    # Transparent, capped demo incentive; eco signal is not treated as weather prediction.
    incentive = min(5.0, base*0.05) if v.verified_water_practice else 0.0
    return {"hazard_score": base, "pricing_score": round(base-incentive, 2), "demo_discount_points": incentive,
            "explanation": {"rainfall": rainfall, "heat": heat, "drought": drought},
            "limitations": ["Not actuarially calibrated", "Not a forecast", "Verified practice discount capped at 5 points"]}
