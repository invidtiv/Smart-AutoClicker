# 2025 ADB Intent Feature Specification

This specification describes the ADB control surface included in Smart AutoClicker 2.4.2. For copyable commands, see the [ADB command guide](./ADB_COMMANDS.md). Implementation context is recorded in the [ADB intent handoff](./HANDOFF_ADB_INTENT.md).

## Scope and status

Only launching a stored scenario by database ID or exact name is implemented in 2.4.2. The implemented command starts an exported activity; it is not a broadcast command and it does not return scenario status to ADB.

| Capability | Intent action | 2.4.2 status |
|---|---|---|
| Start by database ID | `com.buzbuz.smartautoclicker.action.START_SCENARIO` with `SCENARIO_ID` | Implemented |
| Start by exact name | `com.buzbuz.smartautoclicker.action.START_SCENARIO` with `SCENARIO_NAME` | Implemented |
| Read current status | `com.buzbuz.smartautoclicker.action.GET_STATUS` broadcast | Not implemented; future proposal |
| List stored scenarios | `com.buzbuz.smartautoclicker.action.LIST_SCENARIOS` broadcast | Not implemented; future proposal |
| Pause the current scenario | `com.buzbuz.smartautoclicker.action.PAUSE_SCENARIO` broadcast | Not implemented; future proposal |
| Stop the current scenario | `com.buzbuz.smartautoclicker.action.STOP_SCENARIO` broadcast | Not implemented; future proposal |

A broadcast form of `START_SCENARIO` is also not implemented. On the project LD2 emulator, use `adb -s emulator-5560 shell am start`, not `adb -s emulator-5560 shell am broadcast`.

## Implemented command contract

The activity accepts this action and these extras:

| Field | Value | Android type | Required |
|---|---|---|---|
| Action | `com.buzbuz.smartautoclicker.action.START_SCENARIO` | String | Yes |
| Extra | `SCENARIO_ID` | Long (`am` option `--el`) | One selector is required |
| Extra | `SCENARIO_NAME` | String (`am` option `--es`) | One selector is required |

Resolution behavior is:

1. If the intent contains `SCENARIO_ID`, look for a Smart scenario with that ID and then a Dumb scenario with that ID.
2. Otherwise, if `SCENARIO_NAME` is present, look for an exact, case-sensitive Smart scenario name and then an exact, case-sensitive Dumb scenario name.
3. If both extras are present, ID wins. A missing ID match does not fall back to the supplied name.
4. If neither selector is present, or no stored scenario matches, show the short `Scenario not found` toast and do not start a scenario.

Duplicate exact names are ambiguous: the first scenario returned by the repository is used. Automation should prefer a database ID when it is known.

## Launch and permission behavior

The intent is handled by `ScenarioActivity` during `onCreate`. After a scenario is resolved, launch proceeds through the same permission flow as a manual start:

- Draw-over-other-apps permission and the Smart AutoClicker accessibility service are mandatory.
- Notification permission is requested where applicable but is optional.
- A Smart scenario requires interactive MediaProjection consent for screen capture.
- A Dumb scenario does not require MediaProjection consent.
- The app declares and checks the foreground-service permission required by supported Android versions.

ADB does not bypass these Android permission screens. The command may therefore open settings or a consent dialog instead of immediately starting automation.

## Operational constraints

- Cold start is the reliable path. There is no `onNewIntent` handler, so a command sent while `ScenarioActivity` is already alive might not be consumed as a new request. Force-stop the selected package before repeatable automation runs.
- `am start` reports whether Android launched the activity, not whether the scenario was found or successfully started.
- There is no ordered-broadcast result, JSON response, or stable logcat response in 2.4.2.
- Scenario IDs come from the app database. Because `LIST_SCENARIOS` is not implemented, 2.4.2 offers no ADB command for discovering them.

## Acceptance criteria

The implemented feature is complete when all of the following hold:

- A valid Smart or Dumb scenario starts when selected by database ID.
- A valid Smart or Dumb scenario starts when selected by exact name.
- ID is resolved before name, with no name fallback after an ID miss.
- Missing and unknown selectors show `Scenario not found`.
- Existing overlay, accessibility, foreground-service, and MediaProjection requirements remain enforced.
- Release package `com.buzbuz.smartautoclicker` and debug package `com.buzbuz.smartautoclicker.debug` can receive the activity action when the corresponding variant is installed.

The proposed status, list, pause, and stop broadcasts are explicitly outside the implemented 2.4.2 scope.
