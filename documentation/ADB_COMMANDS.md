# ADB Command Guide

## Objective
Enable remote control of scenarios via ADB commands. You can launch a specific scenario by its database ID or its name.

## ADB Launch Commands

To launch a scenario, use the following intent:
`com.buzbuz.smartautoclicker.action.START_SCENARIO`

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
1.  The application will first try to find the scenario by the provided `SCENARIO_ID`.
2.  If not found (or if ID is not provided), it will search for a scenario with the exact `SCENARIO_NAME`.
3.  Both Smart and Dumb scenarios are supported.
4.  If the scenario is found, it will be launched automatically.
5.  If any mandatory permissions (Media Projection, Accessibility) are missing, the application will guide the user through the standard permission flow.

## Support
For more details on automation, check the [2025 Feature Specification](./FEATURE_SPEC_2025.md).
