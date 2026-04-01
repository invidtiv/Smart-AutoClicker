# ADB Command Guide

## Objective
Enable remote control of scenarios via ADB commands. You can launch a specific scenario by its database ID or its name.

## ADB Launch Commands

To launch a scenario, use the following intent:
`com.buzbuz.smartautoclicker.action.START_SCENARIO`

If you have multiple app variants installed, add `-p <PACKAGE>` to target the correct one.
Example for the debug FDroid build:

```bash
adb shell am start -a com.buzbuz.smartautoclicker.action.START_SCENARIO -p com.buzbuz.smartautoclicker.debug --el SCENARIO_ID <ID>
```

### 1. Launch by Database ID
Use the `--el` flag to pass the scenario ID as a Long.

```bash
adb shell am start -a com.buzbuz.smartautoclicker.action.START_SCENARIO --el SCENARIO_ID <ID>
```

### 2. Launch by Name
Use the `--es` flag to pass the scenario name as a String.

```bash
adb shell am start -a com.buzbuz.smartautoclicker.action.START_SCENARIO --es SCENARIO_NAME "<NAME>"
```

## Technical Details

### Intent Action
`com.buzbuz.smartautoclicker.action.START_SCENARIO`

### Intent Extras
*   `SCENARIO_ID` (Long): The database ID of the scenario.
*   `SCENARIO_NAME` (String): The exact name of the scenario.

### Behavior
1.  If `SCENARIO_ID` is provided, the application searches for a Smart or Dumb scenario with that database ID.
2.  If `SCENARIO_ID` is not provided and `SCENARIO_NAME` is provided, the application searches for a Smart or Dumb scenario with that exact name.
3.  If both extras are provided, `SCENARIO_ID` takes precedence. The app does not fall back to `SCENARIO_NAME` after a failed ID lookup.
4.  Both Smart and Dumb scenarios are supported.
5.  If the scenario is found, it is launched automatically.
6.  Mandatory permissions are still required:
    - Overlay permission
    - Accessibility service permission
    - Media Projection permission for Smart scenarios
7.  If required permissions are missing, the application guides the user through the normal permission flow.

## Support
For more details on automation, check the [2025 Feature Specification](./FEATURE_SPEC_2025.md).
