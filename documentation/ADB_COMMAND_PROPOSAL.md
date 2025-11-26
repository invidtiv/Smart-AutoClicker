# ADB Command Proposal

## Objective
Enable launching a specific scenario (Smart or Dumb) via an ADB command using its database ID.

## Technical Implementation

### 1. Android Manifest
Register a new Intent Filter in `AndroidManifest.xml` for `ScenarioActivity`.

*   **Action:** `com.buzbuz.smartautoclicker.action.START_SCENARIO`
*   **Category:** `android.intent.category.DEFAULT`

```xml
<activity android:name=".scenarios.ScenarioActivity" ...>
    <intent-filter>
        <action android:name="com.buzbuz.smartautoclicker.action.START_SCENARIO" />
        <category android:name="android.intent.category.DEFAULT" />
    </intent-filter>
</activity>
```

### 2. ScenarioActivity Logic
Modify `ScenarioActivity.onCreate` and/or `onNewIntent` to handle the incoming intent.

*   **Intent Extra:** `SCENARIO_ID` (Long) - The database ID of the scenario to launch.
*   **Logic:**
    1.  Check if the intent action matches `com.buzbuz.smartautoclicker.action.START_SCENARIO`.
    2.  Extract `SCENARIO_ID` from extras.
    3.  Query the `ScenarioListViewModel` (or repository directly) to find the scenario by ID.
        *   Check both Smart and Dumb repositories.
    4.  If found, trigger the existing start logic (`startScenario(item)`).
    5.  If the app needs permissions (Media Projection, Accessibility), the existing flow in `ScenarioActivity` should handle it naturally, provided we hook into `startScenario` correctly.

### 3. ADB Command Example
```bash
adb shell am start -a com.buzbuz.smartautoclicker.action.START_SCENARIO --el SCENARIO_ID <id>
```
*   `--el` denotes a Long extra.

## Flow Diagram
`ADB Command` -> `ScenarioActivity (onCreate/onNewIntent)` -> `Extract ID` -> `Find Scenario` -> `Trigger Permissions/Start Logic`
