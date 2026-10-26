# Spec Delta

## Purpose

Present regression evidence and CRISP-DM documentation in a form that supports both assignment assessment and user understanding.

## ADDED Requirements

### Requirement: Two-problem navigation
The system SHALL provide a visible selector for the curated smart-home energy problem and the custom CSV regression problem.

#### Scenario: User changes problem mode
- **WHEN** the user selects a different problem from the selector
- **THEN** the interface displays the inputs, instructions, and analysis state for that problem without misrepresenting results from the other problem

### Requirement: CRISP-DM presentation
The system SHALL present Business Understanding, Data Understanding, Data Preparation, Modeling, Evaluation, and Deployment content for the curated smart-home energy analysis.

#### Scenario: User reviews the methodology
- **WHEN** the user opens the methodology content
- **THEN** all six CRISP-DM phases are available with content specific to the smart-home energy problem

### Requirement: Model-evaluation evidence
The system SHALL present MAE, MSE, RMSE, and R-squared for each completed analysis, along with an actual-versus-predicted visualisation and a stated prediction interval.

#### Scenario: Completed analysis is viewed
- **WHEN** curated or custom analysis results are available
- **THEN** the system shows the evaluation metrics, actual-versus-predicted chart, and prediction interval in the results view

### Requirement: Feature-selection explanation
The system SHALL identify the feature-selection method and expose the selected predictors and their model relationship for each completed analysis.

#### Scenario: User reviews model interpretation
- **WHEN** the user opens the feature-explanation view
- **THEN** the system shows the selected predictors and an interpretable indication of their contribution to the linear model
