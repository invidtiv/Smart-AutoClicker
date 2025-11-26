# 2025 Feature Specification: ADB Launch & Screenshot Action

## 1. ADB Launch by Name or ID

### Objective
Extend the existing (planned) ADB control capabilities to allow users to launch a scenario not just by its Database ID, but also by its **Name**.

### Technical Implementation

#### Android Manifest
Ensure the Intent Filter is registered (as per `ADB_COMMAND_PROPOSAL.md`).

```xml
<activity android:name=".scenarios.ScenarioActivity" ...>
    <intent-filter>
        <action android:name="com.buzbuz.smartautoclicker.action.START_SCENARIO" />
        <category android:name="android.intent.category.DEFAULT" />
    </intent-filter>
</activity>
```

#### ScenarioActivity Logic
Update `ScenarioActivity` (in `onCreate` / `onNewIntent`) to handle the intent extras.

1.  **Extras:**
    *   `SCENARIO_ID` (Long): The database ID.
    *   `SCENARIO_NAME` (String): The exact name of the scenario.

2.  **Resolution Logic:**
    *   **Priority:** If `SCENARIO_ID` is provided, use it (O(1) lookup).
    *   **Fallback:** If `SCENARIO_ID` is missing, check `SCENARIO_NAME`.
    *   **Search:** Query the repository for a scenario matching the name.
        *   *Note:* Scenario names might not be unique.
        *   *Decision:* Launch the **first** match found, or log an error if multiple found (simpler to just launch first for now).
    *   **Not Found:** Display a Toast/Log error if no scenario matches.

#### ADB Command Examples
**By ID:**
```bash
adb shell am start -a com.buzbuz.smartautoclicker.action.START_SCENARIO --el SCENARIO_ID 42
```

**By Name:**
```bash
adb shell am start -a com.buzbuz.smartautoclicker.action.START_SCENARIO --es SCENARIO_NAME "My Farming Script"
```

---

## 2. Screenshot Action

### Objective
Add a new action type that captures the current device screen and saves it to the local storage.

### Functional Requirements
*   **Action Type:** "Screenshot" (added to the list alongside Click, Swipe, Wait, etc.).
*   **Behavior:** When executed, takes a full-screen capture.
*   **Storage:** Saves the image to the device's standard **Pictures** directory (or a specific `SmartAutoClicker` subdirectory).
*   **Naming Convention:** `Screenshot_YYYYMMDD_HHmmss.png` (Timestamp-based).

### Technical Implementation

#### 1. Domain Model
*   Modify `com.buzbuz.smartautoclicker.core.domain.model.action.Action` sealed class.
*   Add `data class Screenshot(...) : Action`.
*   Update `ActionEntity` (Database definitions) to support the new type (Room migration might be required if strict relations exist, or just a new `type` enum/string).

#### 2. UI
*   Update the "Add Action" dialog/bottom sheet to include "Screenshot".
*   (Optional) No configuration needed for this action initially (simple trigger).

#### 3. Execution Logic
*   Update `ActionExecutor` (likely `AndroidActionExecutorImpl.kt` or `GestureExecutor.kt`).
*   **Mechanism:**
    *   If `MediaProjection` is already active (used for Image Detection), reuse it to capture a frame.
    *   If not, might need `UiAutomation` (requires Accessibility Service) or request `MediaProjection` permission if not already granted. *Note: The app likely already has Accessibility enabled for clicking.*
    *   **AccessibilityService** has `takeScreenshot()` API (Android 11+). For older versions, might need MediaProjection.
    *   *Constraint:* If supporting < Android 11, `MediaProjection` is the way. The app likely uses `MediaProjection` for the "Smart" detection features.

#### 4. File Saving
*   Use `MediaStore` API (for scoped storage compatibility on Android 10+) or standard File API for legacy.
*   Ensure `WRITE_EXTERNAL_STORAGE` permission is handled if targeting older Android versions (though Scoped Storage is preferred).

### Data Flow
`ActionTrigger` -> `ActionExecutor` -> `Take Screenshot` -> `Save to Disk` -> `Resume Next Action`
