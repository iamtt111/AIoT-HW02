# Spec Delta

## Purpose

Provide a curated smart-home energy regression experience that turns IoT sensor data into an explainable household-energy forecast.

## ADDED Requirements

### Requirement: Curated smart-home energy analysis
The system SHALL provide a selectable smart-home energy problem based on the Appliances Energy Prediction dataset, using `Appliances` energy use as its continuous prediction target and a documented set of sensor, weather, and derived time features.

#### Scenario: User opens the curated problem
- **WHEN** the user selects the smart-home energy problem
- **THEN** the system presents its objective, dataset source, target, feature groups, and available analysis results

### Requirement: Reproducible regression workflow
The system SHALL analyse the curated dataset with a reproducible train/test split, preprocessing, feature-selection step, and a linear-regression baseline.

#### Scenario: User reviews the curated model
- **WHEN** the curated analysis is displayed
- **THEN** the system identifies the held-out evaluation approach, selected features, and the linear-regression result

### Requirement: Energy-use scenario prediction
The system SHALL let the user obtain an appliance-energy estimate from a supported scenario or a valid set of exposed input values.

#### Scenario: Valid scenario prediction
- **WHEN** the user chooses a preset or submits valid energy-input values
- **THEN** the system displays the predicted appliance energy use and its prediction interval

#### Scenario: Invalid scenario input
- **WHEN** required scenario values are absent or outside documented accepted ranges
- **THEN** the system prevents prediction and identifies the invalid input
