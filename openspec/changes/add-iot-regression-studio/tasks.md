# Tasks

## 1. Project foundation and curated data

- [ ] 1.1 Create the FastAPI application, static dashboard structure, dependency manifest, and local start command; verify the service starts and returns the dashboard page.
- [ ] 1.2 Acquire and record the Appliances Energy Prediction Kaggle source, licence/citation, and reproducible local data-acquisition or bundled-data path; verify the curated CSV loads with `Appliances` and expected sensor/weather columns.
- [ ] 1.3 Implement curated-data preparation that derives documented time fields and excludes raw timestamp plus `rv1`/`rv2`; verify a unit test asserts the resulting predictors and target.

## 2. Shared regression analysis service

- [ ] 2.1 Implement deterministic train/calibration/test splitting, median imputation, scaling, training-only SelectKBest selection, and LinearRegression fitting; verify unit tests prove held-out rows are not used to fit preprocessing or feature selection.
- [ ] 2.2 Implement MAE, MSE, RMSE, R-squared, selected-feature coefficients, actual-versus-predicted data, and 95% calibration-residual prediction intervals; verify deterministic fixture tests assert each returned field and interval label.
- [ ] 2.3 Implement curated scenario presets and advanced selected-feature prediction validation; verify API tests cover a valid prediction and rejected missing/out-of-range input.
- [ ] 2.4 Document the split, feature-selection, and prediction-interval method in the application content; verify terminology matches the analysis service's returned metadata.

## 3. Custom CSV import and analysis API

- [ ] 3.1 Implement CSV upload parsing, schema preview, opaque in-memory analysis tokens, parsing/size limits, and user-facing import errors; verify API tests cover valid and malformed uploads.
- [ ] 3.2 Implement public direct-CSV URL retrieval with protocol, redirect, public-address, timeout, and response-size checks; verify tests reject private/reserved destinations and report inaccessible or non-CSV sources safely.
- [ ] 3.3 Implement target selection and numeric-predictor eligibility checks, including identifier-like/non-numeric exclusions and a one-predictor minimum; verify API tests cover eligible, nonnumeric-target, and no-usable-predictor cases.
- [ ] 3.4 Connect eligible custom configurations to the shared analysis service and document the numeric-only limitation; verify an end-to-end API test returns metrics, selected features, and chart-ready results for a fixture CSV.

## 4. Dashboard and curated-story presentation

- [ ] 4.1 Build the visible two-item problem selector with isolated state for Smart Home Energy Forecast and Custom CSV Regression; verify a browser test/manual check changes modes without carrying stale results across them.
- [ ] 4.2 Build the curated dashboard with dataset citation, data summary, presets, advanced prediction form, metric cards, actual-versus-predicted chart, coefficient chart, and prediction-interval display; verify it renders against the curated analysis API.
- [ ] 4.3 Add the six curated CRISP-DM sections with content tied to the implemented pipeline and deployment scenario; verify each named phase is present and navigable in the browser.
- [ ] 4.4 Apply responsive, accessible visual styling and loading/error states for prediction actions; verify keyboard navigation reaches controls and an API failure is visibly explained.

## 5. Custom-data dashboard workflow

- [ ] 5.1 Build URL and file-upload intake controls, schema preview, and target selector; verify valid fixture upload enables only eligible numeric targets.
- [ ] 5.2 Build custom-analysis result rendering with the shared metrics, charts, selected-feature explanation, and stated interval; verify a browser test/manual check completes import, configuration, analysis, and results display.
- [ ] 5.3 Surface import, target, and eligibility failures beside the relevant control without exposing server internals; verify browser tests/manual checks cover malformed CSV, inaccessible URL, nonnumeric target, and no-usable-predictor messages.
- [ ] 5.4 Add user-facing instructions with a direct public CSV example and explain why Kaggle webpage URLs may need download/upload instead; verify the documented example follows the supported import flow.

## 6. Verification and handoff

- [ ] 6.1 Add automated API/unit coverage for the curated workflow, custom import validation, shared pipeline, and scenario prediction; verify the full test suite passes with `pytest`.
- [ ] 6.2 Run the complete curated and custom fixture workflows locally, capture final metrics/source metadata for the report, and verify all four required metrics plus the prediction interval appear in each result view.
- [ ] 6.3 Update the README with setup, local run, test, data-source, and deployment instructions; verify a clean checkout can follow the documented commands to open the dashboard.
