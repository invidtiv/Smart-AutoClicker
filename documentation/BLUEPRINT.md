# Klick'r Project Blueprint

## Introduction
This blueprint outlines the documentation and planned features for extending the Klick'r (Smart AutoClicker) application with ADB control capabilities and a companion PC preview tool.

## Components

### 1. Core Application Extensions
We are enhancing the Android application to support external automation control and better user identification of scenarios.

*   **Scenario Identification:** We will modify the UI to explicitly show the Database ID for every scenario.
    *   *Technical Detail:* [UI_CHANGES.md](UI_CHANGES.md)
*   **ADB Control:** We will add a new Intent to allow starting specific scenarios via ADB commands using their ID.
    *   *Technical Detail:* [ADB_COMMAND_PROPOSAL.md](ADB_COMMAND_PROPOSAL.md)

### 2. PC Companion Tool
A React-based web application to visualize scenario backups on a PC.

*   **Location:** `pchelper/` directory.
*   **Function:** Parses the application's backup ZIP files and provides a read-only preview of the logic, images, and settings.
*   **Specification:** [REACT_PREVIEWER_SPEC.md](REACT_PREVIEWER_SPEC.md)

### 3. Data Reference
Understanding the backup format is crucial for the PC Companion Tool.

*   **Format:** ZIP archive containing JSON models and PNG assets.
*   **Structure:** [DATA_STRUCTURES.md](DATA_STRUCTURES.md)

## Workflow
1.  **User** creates scenarios in the Android App.
2.  **App** displays IDs (`ID: Name`) for easy reference.
3.  **User** exports backup (`.zip`).
4.  **User** opens backup in **PC Companion Tool** to review/verify logic.
5.  **User** uses **ADB** to trigger the verified scenario on the device programmatically:
    `adb shell am start -a com.buzbuz.smartautoclicker.action.START_SCENARIO --el SCENARIO_ID 123`
