# Spec Delta

## Purpose

Allow users to configure and run a transparent linear-regression analysis on a suitable CSV dataset they provide.

## ADDED Requirements

### Requirement: Custom CSV intake
The system SHALL offer a custom-regression problem mode that accepts either a user-uploaded CSV file or a publicly accessible direct CSV URL.

#### Scenario: Accessible CSV URL is imported
- **WHEN** the user supplies a publicly accessible URL that returns a valid CSV dataset
- **THEN** the system loads a preview and reports the dataset's row count, column names, and inferred data types

#### Scenario: CSV upload is imported
- **WHEN** the user uploads a valid CSV file
- **THEN** the system loads the same schema preview used for URL imports

#### Scenario: Dataset cannot be imported
- **WHEN** an input is inaccessible, exceeds configured limits, is not CSV data, or cannot be parsed
- **THEN** the system does not train a model and explains the import failure

### Requirement: Regression-problem configuration
The system SHALL require the user to select a continuous numeric target column before training and SHALL display the numeric predictor columns available for analysis.

#### Scenario: Eligible target is selected
- **WHEN** the user selects a numeric target and the dataset retains at least one usable numeric predictor after target and identifier exclusions
- **THEN** the system enables model training and displays the configured target and candidate features

#### Scenario: Dataset is ineligible for the supported workflow
- **WHEN** the selected target is nonnumeric, contains insufficient usable data, or no usable numeric predictors remain
- **THEN** the system prevents training and explains the eligibility requirement

### Requirement: Custom linear-regression execution
The system SHALL run the same documented preprocessing, feature-selection, train/test evaluation, and result presentation workflow for an eligible custom dataset.

#### Scenario: Custom analysis completes
- **WHEN** the user starts analysis for an eligible configuration
- **THEN** the system presents the selected features, linear-regression evaluation metrics, and prediction results for held-out data
