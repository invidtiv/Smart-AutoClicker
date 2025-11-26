# Changelog

All notable changes to the Klick'r Scenario Previewer (pchelper) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.1.0] - 2025-11-26

### Added
- **Condition Operator Display**: Events now show the condition operator (AND/OR) in the conditions section header, indicating whether all conditions must match (AND) or any condition can match (OR)
- **End Conditions Section**: A new dedicated section displays scenario termination conditions before the regular events list, with distinctive orange styling for easy identification
- **Two-Column Event Layout**: Events now display conditions and actions side-by-side in a responsive two-column layout:
  - Left column: Conditions (blue background)
  - Right column: Actions (green background)

### Changed
- Refactored `SmartScenarioView.tsx` to use a shared `renderEvent()` function for both end conditions and regular events
- Events that are identified as end conditions (TRIGGER_EVENT type with "stop scenario" or "end" in the name) are now filtered and displayed separately
- Improved responsive behavior: columns stack vertically on smaller screens (min-width: 300px per column)

### Fixed
- Event layout now matches the intended design from the scenario structure diagram

## [1.0.0] - Initial Release

### Features
- Drag & drop ZIP file upload
- Smart scenario visualization with:
  - Scenario metadata display
  - Events list with conditions and actions
  - Image condition preview with detection area
  - Support for all action types (Click, Swipe, Pause, Intent, Toggle Event)
  - Enabled/disabled event status indicators
- Dumb scenario visualization with action sequences
- Client-side processing using JSZip
