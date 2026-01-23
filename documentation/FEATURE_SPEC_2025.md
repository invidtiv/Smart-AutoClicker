# 2025 Feature Specification: ADB Launch & Screenshot Action (IMPLEMENTED)

## 1. ADB Launch by Name or ID

### Objective
Expose new ADB intents to allow users to launch a scenario by its **Database ID** or its **Name**.

### Implementation Status
- [x] Intent Filter registered in `AndroidManifest.xml`.
- [x] `ScenarioActivity` updated to handle `com.buzbuz.smartautoclicker.action.START_SCENARIO`.
- [x] Helper methods added to `ScenarioViewModel` for ID/Name lookups.

### Technical Implementation

#### Android Manifest
Registered in `smartautoclicker/src/main/AndroidManifest.xml`:
```xml
<activity android:name=".scenarios.ScenarioActivity" ...>
    <intent-filter>
        <action android:name="com.buzbuz.smartautoclicker.action.START_SCENARIO" />
        <category android:name="android.intent.category.DEFAULT" />
    </intent-filter>
</activity>
```

#### ScenarioActivity Logic
The activity handles the intent in `onCreate`:
1.  **Extras:**
    *   `SCENARIO_ID` (Long): The database ID.
    *   `SCENARIO_NAME` (String): The exact name of the scenario.
2.  **Resolution:**
    *   If `SCENARIO_ID` is present, it searches for a Smart or Dumb scenario with that ID.
    *   If only `SCENARIO_NAME` is present, it searches by name.
    *   Found scenarios are automatically started (triggering permission flow if needed).

### ADB Command Examples
**By ID:**
```bash
adb shell am start -a com.buzbuz.smartautoclicker.action.START_SCENARIO --el SCENARIO_ID 1
```

**By Name:**
```bash
adb shell am start -a com.buzbuz.smartautoclicker.action.START_SCENARIO --es SCENARIO_NAME "My Script"
```

---

## 2. Screenshot Action

### Objective
Provide an action to capture the current screen and save it to the Pictures folder, with optional subdirectory selection.

### Functional Requirements (Implemented)
*   **Action Type:** "Screenshot".
*   **Behavior:** Captures the full screen.
*   **Storage:** Saves to `Pictures/SmartAutoClicker` by default.
*   **Custom Folder:** Users can specify a subfolder inside `Pictures/` (e.g., `MyScrens/`).
*   **Naming Convention:** `Screenshot_YYYYMMDD_HHmmss.png`.

### Implementation Details

#### 1. Models & Database
- Updated `Screenshot` domain model in `core:smart:domain`.
- Added `screenshot_path` column to `ActionEntity` in `core:smart:database`.
- Incremented `CLICK_DATABASE_VERSION` to **19** with AutoMigration.

#### 2. Configuration UI
- Created `dialog_config_action_screenshot.xml` for folder name input.
- Updated `ScreenshotViewModel` to manage the path state.
- Enhanced `ScreenshotDialog` for configuring the action name and save destination.

#### 3. Execution Logic
- **Primary (Android 11+):** Uses `AccessibilityService.takeScreenshot()` for high-quality, system-level capture.
- **Fallback (Android < 11):** Uses `DisplayRecorder` (MediaProjection) to acquire the latest frame if the service is already capturing tiles.
- **Saving:** Uses `MediaStore` for scoped storage compatibility, saving to `Environment.DIRECTORY_PICTURES`.

### Data Flow
`ActionTrigger` (ActionExecutor) -> `AndroidActionExecutor.takeScreenshot(path)` -> `onSuccess` callback -> `saveScreenshotToDisk` -> `MediaStore.insert`
