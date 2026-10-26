# Design

## Context

The repository currently contains only the assignment requirements and no application code.  The required behaviour is defined by the three new capability specs; see `proposal.md` for motivation.  The solution must be demonstrable as a website, make the two problem modes obvious, and make model work traceable enough for an HW02 report.

## Goals / Non-Goals

**Goals:**

- Deliver one locally runnable, full-stack application that can train and visualise linear-regression analyses.
- Keep the curated mode reproducible and immediately usable without a user upload.
- Support a safe, bounded custom-data path for public direct CSV URLs and local CSV uploads.
- Generate the data and charts needed for the CRISP-DM presentation and report.

**Non-Goals:**

- Supporting non-CSV sources, authenticated Kaggle page URLs, databases, or arbitrary web scraping.
- Automatically inferring the business target or supporting classification targets.
- Claiming causal conclusions, real-time IoT ingestion, user accounts, persisted analysis history, or production multi-user workloads.
- Optimising for non-linear models; Ridge/Lasso may be comparative extensions, but ordinary linear regression remains the required baseline.

## Decisions

### Single Python web service with a browser dashboard

Use a FastAPI service to expose JSON APIs for data import, analysis, and prediction, and serve a lightweight browser dashboard built from static HTML, CSS, and JavaScript.  Use Plotly in the browser for interactive charts.

This keeps scikit-learn computation and file/URL access on the server, avoiding browser CORS restrictions and a separate JavaScript build pipeline.  A separate React frontend was considered, but it adds build and deployment complexity without improving the assignment's core outcomes.

### Curated dataset is bundled and documented

Obtain the Appliances Energy Prediction CSV from its Kaggle source before implementation, retain its source citation in the UI/report material, and commit a lawful project copy or a reproducible acquisition instruction.  The curated path will remove the timestamp as a raw predictor, derive transparent time features, exclude the known random `rv1`/`rv2` fields, and use the remaining sensor/weather data to predict `Appliances`.

Bundling prevents a live Kaggle availability or authentication issue from breaking the demonstration.  Fetching Kaggle data every time was rejected because a Kaggle dataset webpage is not a direct, stable CSV endpoint.

### One shared analysis pipeline

Both modes use one analysis service with explicit stages:

```text
CSV -> schema checks -> eligible numeric columns -> train/calibration/test split
    -> median imputation + scaling -> SelectKBest on training data only
    -> LinearRegression -> test metrics + residual prediction interval -> chart payload
```

Use a deterministic 64/16/20 split with a fixed random seed for the curated mode.  Training data alone fits preprocessing and selects features; calibration residuals yield a documented two-sided 95% residual/conformal prediction interval; test data is reserved for MAE, MSE, RMSE, and R-squared.  `SelectKBest(f_regression)` selects `min(20, number_of_usable_features)` predictors.  Standardised coefficients and original feature names provide the feature explanation.

Using a calibration split avoids presenting a confidence interval as a prediction interval.  A statsmodels OLS interval was considered, but would make the preprocessing pipeline and custom-data behaviour more fragile.

### Guided custom-data contract and safety boundaries

After import, return only a schema preview and an opaque analysis token.  The user must choose the numeric target; the server excludes target, identifier-like fields, and nonnumeric fields, then reports candidate predictors.  Any dataset with at least one usable numeric predictor is eligible for the custom mode.  Missing numeric values are median-imputed; custom categorical encoding is intentionally not supported in the first version.

URL retrieval accepts only `http`/`https` direct CSV responses, follows a limited number of redirects, rejects private/link-local/reserved destination addresses after DNS resolution, applies a short timeout and a maximum download size, and reports a non-sensitive error.  Uploads use the same size and CSV parsing limits.  Analysis results remain in server memory and expire with the process.

The explicit target selection avoids unreliable target inference.  A browser-only importer was rejected because public CSV hosts often block cross-origin requests and it cannot safely perform full training.

### Dashboard information architecture

The landing interface has a visible two-item problem selector: **Smart Home Energy Forecast** and **Custom CSV Regression**.  The curated mode exposes its CRISP-DM story, data source, data summary, model results, three input presets, and an advanced selected-feature form.  The custom mode advances through import, schema/target configuration, analysis, and results.

The results view uses a shared component model: metric cards; actual-versus-predicted scatter with diagonal reference; observed residual/interval communication; selected-feature coefficient chart; and a plain-language method summary.  Each curated CRISP-DM phase links its displayed claim to the underlying analysis result or stated deployment scenario.

## Risks / Trade-offs

- [Kaggle dataset access or redistribution is unavailable] -> Keep a citation and reproducible acquisition note; use a verified small project copy only when licensing permits it.
- [A user supplies a very large or malicious URL] -> Enforce scheme, network-address, redirect, timeout, and byte-size limits before parsing.
- [Custom data has text/categorical predictors] -> Clearly state numeric-only v1 support and show the excluded-column reason rather than silently coercing values.
- [Linear regression fits energy consumption weakly] -> Report limitations honestly, compare feature-selected and unselected baselines if helpful, and keep the assignment-required model as the primary result.
- [Prediction interval coverage varies by data distribution] -> Label it as calibration-residual 95% prediction interval and document that it is an empirical uncertainty estimate, not a guarantee.

## Migration Plan

1. Add the service, dashboard, curated data asset/acquisition note, and test fixtures without replacing existing application behaviour.
2. Run the curated analysis once to establish a reproducible demonstration result and capture its source/version metadata.
3. Verify local startup and the full URL/upload workflows before deployment.
4. Deploy as one service.  Rollback consists of restoring the previous deployment or removing the new service because the repository has no prior runtime application or persistent data migration.
