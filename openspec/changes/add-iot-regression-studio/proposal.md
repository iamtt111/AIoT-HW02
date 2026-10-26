# Proposal

## Why

The HW02 deliverable needs to demonstrate a complete, explainable multiple-linear-regression workflow rather than only submitting a notebook.  An interactive smart-home energy application makes the analysis relevant to AIoT while the custom-data mode satisfies the assignment's bonus requirement for user-provided datasets.

## What Changes

- Add a web-based **IoT Regression Studio** centred on the Appliances Energy Prediction dataset and its `Appliances` energy-use target.
- Add a guided custom regression mode that accepts a public direct CSV URL or a CSV upload, then lets the user select a continuous target column.
- Add reproducible preprocessing, feature selection, baseline linear-regression training, evaluation, prediction-interval visualisation, and downloadable/visible analysis outcomes for both modes.
- Add a CRISP-DM-oriented presentation that explains the business problem, data, preparation, modelling, evaluation, and deployment use case.
- Add clear validation and error states for unsupported, inaccessible, malformed, or unsuitable custom datasets.

## Capabilities

### New Capabilities

- `energy-regression-workflow`: Provide the curated smart-home energy analysis flow, model comparison, and scenario prediction experience.
- `custom-csv-regression`: Import and validate user-provided CSV data, configure an eligible regression problem, and run the same analysis pipeline.
- `regression-insights-presentation`: Present CRISP-DM evidence, metrics, diagnostic charts, prediction intervals, and model interpretation in the web experience.

### Modified Capabilities

- None.

## Impact

- New full-stack web application code, bundled curated dataset/model artifacts, and automated tests.
- Python data-science dependencies for CSV handling, preprocessing, linear regression, feature selection, metrics, and interval estimation.
- A browser interface for the two selectable problem modes; public URL ingestion requires a server-side fetch path and input-safety limits.
