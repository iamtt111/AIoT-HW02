from __future__ import annotations

import io, uuid
from pathlib import Path
from typing import Any

import pandas as pd
import httpx
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from sklearn.feature_selection import SelectKBest, f_regression
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

ROOT = Path(__file__).parent
DATA = ROOT / "KAG_energydata_complete.csv"
app = FastAPI(title="IoT Regression Studio")
app.mount("/static", StaticFiles(directory="static"), name="static")
STORE: dict[str, pd.DataFrame] = {}
MAX_CSV_BYTES = 25 * 1024 * 1024

def numeric_columns(df: pd.DataFrame, target: str | None = None) -> list[str]:
    cols = [c for c in df.select_dtypes(include="number").columns if c != target]
    return [c for c in cols if c.lower() not in {"id", "index"} and not c.lower().endswith("_id")]

def preview(df: pd.DataFrame) -> dict[str, Any]:
    return {"rows": len(df), "columns": [{"name": c, "dtype": str(df[c].dtype), "missing": int(df[c].isna().sum())} for c in df.columns], "numeric_columns": numeric_columns(df)}

def parse_csv(raw: bytes) -> pd.DataFrame:
    if len(raw) > MAX_CSV_BYTES:
        raise HTTPException(400, "CSV exceeds the 25 MB limit.")
    try:
        return pd.read_csv(io.BytesIO(raw))
    except Exception as exc:
        raise HTTPException(400, "The file could not be parsed as CSV.") from exc

def analyse(df: pd.DataFrame, target: str) -> dict[str, Any]:
    if target not in df or not pd.api.types.is_numeric_dtype(df[target]):
        raise HTTPException(400, "Select a numeric continuous target column.")
    features = numeric_columns(df, target)
    if not features: raise HTTPException(400, "No usable numeric predictors remain.")
    data = df[features + [target]].dropna(subset=[target])
    if len(data) < 15: raise HTTPException(400, "At least 15 rows with a target value are required.")
    x_train, x_hold, y_train, y_hold = train_test_split(data[features], data[target], test_size=.36, random_state=42)
    x_cal, x_test, y_cal, y_test = train_test_split(x_hold, y_hold, test_size=20/36, random_state=42)
    k = min(20, len(features)); pipe = Pipeline([("impute", SimpleImputer(strategy="median")), ("scale", StandardScaler()), ("select", SelectKBest(f_regression, k=k)), ("model", LinearRegression())])
    pipe.fit(x_train, y_train); cal = pipe.predict(x_cal); pred = pipe.predict(x_test)
    interval = float(pd.Series(y_cal.to_numpy() - cal).abs().quantile(.95))
    selected = [f for f, ok in zip(features, pipe.named_steps["select"].get_support()) if ok]
    coefs = pipe.named_steps["model"].coef_.tolist()
    return {"target": target, "rows": len(data), "features": selected, "coefficients": dict(zip(selected, coefs)), "metrics": {"mae": round(mean_absolute_error(y_test,pred),3), "mse": round(mean_squared_error(y_test,pred),3), "rmse": round(mean_squared_error(y_test,pred)**.5,3), "r2": round(r2_score(y_test,pred),3)}, "prediction_interval": {"level": "95% calibration-residual prediction interval", "plus_minus": round(interval,3)}, "actual": y_test.tolist()[:300], "predicted": pred.tolist()[:300]}

def curated_prediction(scenario: str) -> dict[str, Any]:
    raw = pd.read_csv(DATA)
    raw["hour"] = pd.to_datetime(raw["date"]).dt.hour
    df = raw.drop(columns=["date", "rv1", "rv2"])
    features = numeric_columns(df, "Appliances")
    pipe = Pipeline([("impute", SimpleImputer(strategy="median")), ("scale", StandardScaler()), ("select", SelectKBest(f_regression, k=min(20, len(features)))), ("model", LinearRegression())])
    pipe.fit(df[features], df["Appliances"])
    if scenario == "morning": subset = raw[raw["hour"].between(6, 9)]; label = "舒適早晨"
    elif scenario == "afternoon": subset = raw[raw["hour"].between(13, 17)]; label = "炎熱午後"
    elif scenario == "night": subset = raw[(raw["hour"].between(20, 23)) & (raw["RH_out"] >= raw["RH_out"].quantile(.6))]; label = "潮濕夜晚"
    else: raise HTTPException(400, "Unknown scenario.")
    row = subset[features].median(numeric_only=True).to_frame().T
    estimate = float(pipe.predict(row)[0]); interval = analyse(df, "Appliances")["prediction_interval"]["plus_minus"]
    return {"scenario": label, "prediction": round(estimate, 1), "plus_minus": interval}

@app.get("/")
def home():
    html = (ROOT / "static" / "index.html").read_text(encoding="utf-8")
    enhancements = (ROOT / "static" / "blob-upload.js").read_text(encoding="utf-8")
    return HTMLResponse(html.replace("</body>", f"<script>{enhancements}</script></body>"), headers={"Cache-Control": "no-store"})

@app.get("/api/curated")
def curated():
    df = pd.read_csv(DATA)
    out = preview(df)
    out["source"] = "Kaggle Appliances Energy Prediction (loveall/appliances-energy-prediction)"
    out["source_url"] = "https://www.kaggle.com/datasets/loveall/appliances-energy-prediction"
    out["target"] = "Appliances"
    out["target_unit"] = "Wh"
    out["time_range"] = {"start": str(df["date"].min()), "end": str(df["date"].max()), "frequency": "10 minutes"}
    out["usable_features"] = len(numeric_columns(df.drop(columns=["date", "rv1", "rv2"]), "Appliances"))
    out["missing_cells"] = int(df.isna().sum().sum())
    out["analysis"] = analyse(df.drop(columns=["date", "rv1", "rv2"]), "Appliances")
    return out

@app.get("/api/curated/scenario/{scenario}")
def scenario(scenario: str):
    return curated_prediction(scenario)

@app.post("/api/import")
async def import_csv(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".csv"): raise HTTPException(400, "Please upload a CSV file.")
    raw = await file.read()
    df = parse_csv(raw)
    token = uuid.uuid4().hex; STORE[token] = df; return {"token": token, **preview(df)}

@app.post("/api/analyse/{token}")
def custom(token: str, payload: dict):
    if token not in STORE: raise HTTPException(404, "Dataset session expired. Import the CSV again.")
    return analyse(STORE[token], payload.get("target", ""))

@app.post("/api/analyse-blob")
def analyse_blob(payload: dict):
    url = payload.get("blob_url", "")
    if not isinstance(url, str) or not url.startswith("https://") or ".blob.vercel-storage.com/" not in url:
        raise HTTPException(400, "A valid Vercel Blob URL is required.")
    try:
        response = httpx.get(url, timeout=30, follow_redirects=False)
        response.raise_for_status()
    except httpx.HTTPError as exc:
        raise HTTPException(400, "The uploaded Blob could not be retrieved.") from exc
    return analyse(parse_csv(response.content), payload.get("target", ""))

@app.post("/api/preview-blob")
def preview_blob(payload: dict):
    url = payload.get("blob_url", "")
    if not isinstance(url, str) or not url.startswith("https://") or ".blob.vercel-storage.com/" not in url:
        raise HTTPException(400, "A valid Vercel Blob URL is required.")
    try:
        response = httpx.get(url, timeout=30, follow_redirects=False)
        response.raise_for_status()
    except httpx.HTTPError as exc:
        raise HTTPException(400, "The uploaded Blob could not be retrieved.") from exc
    return preview(parse_csv(response.content))
