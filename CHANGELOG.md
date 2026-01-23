# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.5.0-beta01] - 2026-01-23

### Added
- **ADB Scenario Launch**: New ability to launch scenarios via ADB commands.
    - Launch by Database ID: `adb shell am start -a com.buzbuz.smartautoclicker.action.START_SCENARIO --el SCENARIO_ID <ID>`
    - Launch by Name: `adb shell am start -a com.buzbuz.smartautoclicker.action.START_SCENARIO --es SCENARIO_NAME "<NAME>"`
- **Screenshot Action**: Added a new action type to take screenshots during scenario execution.
    - Screenshots are saved to the `Pictures/` folder.
    - Support for custom subfolders inside `Pictures/`.
    - Automatic timestamp-based naming: `Screenshot_YYYYMMDD_HHmmss.png`.
- **System Actions**: Integrated system actions (Back, Home, Recent Apps) into scenario execution.
- **Enhanced Debug Reports**:
    - Timeline view now includes event states and counter values tracking.
    - Improved layout for debug counter states.

### Changed
- **Multi-module Refactoring**: Ongoing improvements to the core processing and domain modules for better performance and maintainability.
- **Dependency Updates**: Updated various Android and Hilt dependencies to the latest versions.
- **Android SDK**: Updated target SDK to 36.

### Fixed
- **Merge Conflicts & Regressions**: Resolved issues arising from synchronized upstream changes, ensuring stability of new features.
- **Unit Tests**: Fixed compilation issues in unit tests.
- **UI Polish**: Simplified debug counter state layout and translated new debugging features.

---
*For historical changes, please refer to the Git commit history.*
