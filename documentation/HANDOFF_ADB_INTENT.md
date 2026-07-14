# Handoff: ADB Intent Launch Feature

**Status:** Implemented for the 2.4.2 port  
**Primary Author:** Kevin Buzeau (per file headers)  
**Related Spec:** [2025 Feature Specification](./FEATURE_SPEC_2025.md)  
**User-Facing Docs:** [ADB Command Guide](./ADB_COMMANDS.md)

## 1. What Changed

Smart AutoClicker 2.4.2 can launch a stored Smart or Dumb scenario through an explicit activity intent. A caller can select a scenario by database ID or exact name.

### Implemented contract

- Intent action: `com.buzbuz.smartautoclicker.action.START_SCENARIO`
- Supported extras:
  - `SCENARIO_ID` (`Long`) — database ID of the scenario.
  - `SCENARIO_NAME` (`String`) — exact scenario name.
- Resolution order:
  1. Presence of `SCENARIO_ID` selects ID lookup, including when its supplied value is `-1`.
  2. ID lookup searches the Smart repository and then the Dumb repository.
  3. Only when `SCENARIO_ID` is absent can `SCENARIO_NAME` select exact-name lookup, again Smart before Dumb.
  4. When both extras are supplied, ID takes precedence. A failed ID lookup never falls back to the name.
- A successful lookup enters the existing scenario start and permission flow.
- A missing selector or failed lookup shows the short `Scenario not found` toast. It requests neither a new start nor a stop, so any already-running service/scenario state is left unchanged.

### Permission and consent categories

ADB grants no bypass. The existing flow still enforces or requests the following:

- Draw over other apps (`SYSTEM_ALERT_WINDOW`) is mandatory Android **special app access**, granted in system settings; it is not a runtime permission dialog.
- The `SmartAutoClickerService` accessibility service must be enabled and bound. This is an Android accessibility setting, not a runtime permission.
- Smart scenarios require interactive **MediaProjection consent** for screen capture. This is session/start consent, not a manifest runtime permission. Dumb scenarios do not require it.
- `POST_NOTIFICATIONS` is an optional dangerous runtime permission on supported Android versions (Android 13+). Denial does not make the scenario permission flow mandatory-fail.
- `FOREGROUND_SERVICE` is a normal manifest/install-time permission, not a user-granted runtime permission. The app declares it and the 2.4.2 code checks it before loading a scenario on Android P+. The manifest also declares `FOREGROUND_SERVICE_MEDIA_PROJECTION` for media-projection foreground-service use on newer Android versions.

## 2. Files Touched

| File | Change |
|---|---|
| `smartautoclicker/src/main/AndroidManifest.xml` | Registers the `START_SCENARIO` intent filter on exported `ScenarioActivity`. |
| `smartautoclicker/src/main/java/com/buzbuz/smartautoclicker/activity/ScenarioActivity.kt` | Handles the action in `onCreate`, resolves an ID or name, and delegates to `startScenario`. |
| `smartautoclicker/src/main/java/com/buzbuz/smartautoclicker/activity/ScenarioViewModel.kt` | Adds `getSmartScenarioById`, `getSmartScenarioByName`, `getDumbScenarioById`, and `getDumbScenarioByName`. |
| `smartautoclicker/src/main/res/values/strings.xml` | Adds `toast_scenario_not_found`. |
| `documentation/FEATURE_SPEC_2025.md` | Defines the implemented 2.4.2 scope and future exclusions. |
| `documentation/ADB_COMMANDS.md` | Provides the user-facing command and emulator guide. |

## 3. Entry Point Detail

`ScenarioActivity.onCreate` detects `ACTION_START_SCENARIO`, delegates to `handleStartScenarioIntent`, and returns before the ordinary launcher path calls `ScenarioViewModel.stopScenario`.

The selector decision is presence-based:

```kotlin
val hasScenarioId = startIntent.hasExtra(EXTRA_SCENARIO_ID)
val scenarioId = startIntent.getLongExtra(EXTRA_SCENARIO_ID, -1L)
val scenarioName = startIntent.getStringExtra(EXTRA_SCENARIO_NAME)

if (!hasScenarioId && scenarioName == null) {
    showScenarioNotFoundToast()
    return
}

val item = if (hasScenarioId) {
    // Resolve scenarioId as Smart, then Dumb. Do not inspect scenarioName.
} else {
    // Resolve scenarioName as Smart, then Dumb.
}
```

Consequences worth preserving during maintenance:

- `--el SCENARIO_ID -1` still selects ID lookup because the extra is present.
- Supplying both extras never enables a name fallback.
- The early `onCreate` return prevents the ADB path from stopping a scenario before resolving the request.
- Not-found handling only shows a toast. It does not establish that the service is idle and does not alter a scenario that was already running.
- After a match, `startScenario` uses the normal mandatory-permission flow; Smart matches subsequently open the MediaProjection consent flow.

## 4. How to Test

### 4.1 Build and install the F-Droid debug variant

From the repository root:

```text
./gradlew :smartautoclicker:installFDroidDebug
```

This variant installs as `com.buzbuz.smartautoclicker.debug`. On Windows, `gradlew.bat` can be used in place of `./gradlew`.

### 4.2 ADB commands

Replace the serial below if `adb devices` reports a different LDPlayer endpoint.

Launch by database ID:

```text
adb -s emulator-5560 shell am start -W -a com.buzbuz.smartautoclicker.action.START_SCENARIO -p com.buzbuz.smartautoclicker.debug --el SCENARIO_ID 42
```

Launch by exact name:

```text
adb -s emulator-5560 shell am start -W -a com.buzbuz.smartautoclicker.action.START_SCENARIO -p com.buzbuz.smartautoclicker.debug --es SCENARIO_NAME "My Scenario"
```

Verify presence-based ID precedence, including the `-1` value:

```text
adb -s emulator-5560 shell am start -W -a com.buzbuz.smartautoclicker.action.START_SCENARIO -p com.buzbuz.smartautoclicker.debug --el SCENARIO_ID -1 --es SCENARIO_NAME "A Valid Scenario Name"
```

The last command must show `Scenario not found` unless ID `-1` exists; it must not start the supplied name.

### 4.3 Manual QA checklist

- [ ] The installed F-Droid debug launcher uses the intended red-background icon.
- [ ] Draw-over-other-apps special access is granted.
- [ ] The app accessibility service is enabled and bound.
- [ ] A Smart scenario opens MediaProjection consent and starts after approval.
- [ ] A Dumb scenario starts without MediaProjection consent.
- [ ] An invalid ID shows `Scenario not found` and does not issue a stop.
- [ ] An invalid name shows `Scenario not found` and does not issue a stop.
- [ ] With both extras, the ID is used and the name is ignored, even for ID `-1` or another missing ID.
- [ ] A not-found request made while a scenario is already running leaves that service state unchanged.
- [ ] Repeated cold-start testing uses the F-Droid debug package and the selected LDPlayer serial.

## 5. Edge Cases and Constraints

1. **Name matching is exact.** Matching is case-sensitive and uses the complete stored name; there is no partial or fuzzy search.
2. **Duplicate names are ambiguous.** The first matching item emitted by the selected repository wins. Prefer database IDs for dependable automation.
3. **Permissions are not bypassed.** An activity launch from ADB still routes through the same special-access, accessibility, optional-notification, foreground-service, and Smart MediaProjection checks used by manual launch.
4. **Cold start is the reliable path.** The intent is consumed in `ScenarioActivity.onCreate`. There is no `onNewIntent` override, so an intent delivered to an existing activity instance is not explicitly handled as a new request.
5. **UI wrapper coupling exists.** Lookup results are wrapped in `ScenarioListUiState.Item.Empty.Smart` or `ScenarioListUiState.Item.Empty.Dumb` before entering `startScenario`; revisit this integration if the list UI model changes.
6. **ADB receives no scenario result.** `am start -W` reports activity launch behavior, not lookup or scenario-start success.
7. **Not found does not mean idle.** The ADB handler does no new start/stop work after a failed lookup, and an existing service/scenario can remain active.

## 6. Follow-Up and Watch-Outs

- **Intent delivery:** Add a deliberate launch mode plus `onNewIntent` handling if repeated commands must work while `ScenarioActivity` already exists.
- **Duplicate names:** Keep the ambiguity documented or define an explicit conflict response.
- **Tests:** Add unit/instrumentation coverage for selector presence, supplied ID `-1`, both-extra precedence, missing selectors, lookup order, and preservation of existing service state after not-found.
- **Localization:** Translate `toast_scenario_not_found` when additional locales are maintained.
- **Future stop support:** Define `com.buzbuz.smartautoclicker.action.STOP_SCENARIO` as a separate future action with its own handler and authorization policy. Do not overload or reinterpret `START_SCENARIO` to stop automation.

## 7. Proposed ADB Command Surface (Not Implemented)

Everything in this section is a future design proposal. Smart AutoClicker 2.4.2 does **not** register these broadcast actions or a command receiver, and none of the commands below work in the completed port. The only implemented ADB surface is the `am start` activity command documented in Section 4 and in the [ADB Command Guide](./ADB_COMMANDS.md).

### 7.1 Proposed future broadcast actions

| Future action | Proposed purpose | 2.4.2 status |
|---|---|---|
| `com.buzbuz.smartautoclicker.action.GET_STATUS` | Return service/scenario state. | Not implemented |
| `com.buzbuz.smartautoclicker.action.LIST_SCENARIOS` | Return Smart and Dumb IDs and names. | Not implemented |
| Broadcast form of `com.buzbuz.smartautoclicker.action.START_SCENARIO` | Offer parity with a receiver-based API. | Not implemented; activity form only |
| `com.buzbuz.smartautoclicker.action.PAUSE_SCENARIO` | Pause the current scenario. | Not implemented |
| `com.buzbuz.smartautoclicker.action.STOP_SCENARIO` | Stop the current scenario as a distinct action. | Not implemented |

### 7.2 Proposed status command (not implemented)

```text
adb -s emulator-5560 shell am broadcast -a com.buzbuz.smartautoclicker.action.GET_STATUS -p com.buzbuz.smartautoclicker.debug
```

A future response could distinguish idle, running Smart, running Dumb, and paused states and include scenario identity where available. The current `SmartAutoClickerService.ILocalService` exposes start and stop operations but no public status query. `LocalService` has private lifecycle/engine state; a future implementation needs an intentional, thread-safe status API rather than references to nonexistent providers or public fields.

### 7.3 Proposed list command (not implemented)

```text
adb -s emulator-5560 shell am broadcast -a com.buzbuz.smartautoclicker.action.LIST_SCENARIOS -p com.buzbuz.smartautoclicker.debug
```

A future implementation could consume `Repository.scenarios` and `DumbRepository.dumbScenarios`, map them to stable DTOs, and avoid exposing internal domain objects. It must also define output transport, ordering, duplicate-name behavior, and access control.

### 7.4 Proposed start, pause, and stop broadcasts (not implemented)

Future broadcast form of start:

```text
adb -s emulator-5560 shell am broadcast -a com.buzbuz.smartautoclicker.action.START_SCENARIO -p com.buzbuz.smartautoclicker.debug --el SCENARIO_ID 42
```

Future pause action:

```text
adb -s emulator-5560 shell am broadcast -a com.buzbuz.smartautoclicker.action.PAUSE_SCENARIO -p com.buzbuz.smartautoclicker.debug
```

Future, separate stop action:

```text
adb -s emulator-5560 shell am broadcast -a com.buzbuz.smartautoclicker.action.STOP_SCENARIO -p com.buzbuz.smartautoclicker.debug
```

The current `SmartAutoClickerService.ILocalService` has `startSmartScenario`, `startDumbScenario`, and `stop`, but no pause operation. `LocalService.stop` owns the existing cleanup path. A future receiver must call a deliberately exposed service API, define pause semantics for both engines, and keep stop separate from the implemented start action. It must not reach into the private `dumbEngine`, `detectionRepository`, or overlay state.

### 7.5 Suggested future receiver design (not implemented)

1. Add an exported receiver only if external callers are required; otherwise keep it non-exported and use an internal interface.
2. Register only the future actions that have complete implementations and tests.
3. Add explicit service APIs for status, pause, and stop instead of accessing `LocalService` internals. The existing callback entry point is `SmartAutoClickerService.getLocalService`.
4. Define a stable response mechanism for status/list, such as ordered-broadcast result data or a documented log line.
5. Keep scenario start routed through `ScenarioActivity` when interactive permission or MediaProjection consent may be required.
6. Test authorization, background-launch restrictions, missing service state, malformed extras, and every navigation/permission path.

### 7.6 Security considerations for a future receiver

- An exported receiver without an `android:permission` restriction can be targeted by other installed apps; no `BROADCAST_STICKY` permission is required to send an ordinary broadcast to it.
- `android.permission.BROADCAST_STICKY` concerns sticky broadcasts and does not protect an exported automation receiver.
- If only ADB shell control is intended, design and verify an authorization mechanism appropriate to supported Android versions. A custom signature-level permission restricts callers to apps signed with the same certificate and therefore may also exclude shell unless a separate, tested shell path is provided.
- Status and list responses can expose scenario metadata and should receive the same threat-model attention as mutating commands.
- Any receiver-triggered start must preserve the normal overlay, accessibility, foreground-service, optional-notification, and MediaProjection requirements.

## 8. Related Code References

References use paths and symbols rather than brittle line numbers:

- `smartautoclicker/src/main/java/com/buzbuz/smartautoclicker/activity/ScenarioActivity.kt`
  - `ACTION_START_SCENARIO`, `EXTRA_SCENARIO_ID`, `EXTRA_SCENARIO_NAME`
  - `onCreate`, `handleStartScenarioIntent`, `showScenarioNotFoundToast`, `startScenario`
- `smartautoclicker/src/main/java/com/buzbuz/smartautoclicker/activity/ScenarioViewModel.kt`
  - `getSmartScenarioById`, `getSmartScenarioByName`, `getDumbScenarioById`, `getDumbScenarioByName`
  - `loadSmartScenario`, `loadDumbScenario`, `stopScenario`
- `smartautoclicker/src/main/AndroidManifest.xml`
  - `ScenarioActivity` declaration and `START_SCENARIO` intent filter
  - `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PROJECTION`, `SYSTEM_ALERT_WINDOW`, and `POST_NOTIFICATIONS` declarations
- `smartautoclicker/src/main/java/com/buzbuz/smartautoclicker/activity/permissions/Permission.kt`
  - `Permission.Special.Accessibility`, `Permission.Special.Overlay`, and optional `Permission.Dangerous.Notification`
- `smartautoclicker/src/main/java/com/buzbuz/smartautoclicker/SmartAutoClickerService.kt`
  - `ILocalService`, `getLocalService`, `isServiceStarted`
- `smartautoclicker/src/main/java/com/buzbuz/smartautoclicker/LocalService.kt`
  - `startSmartScenario`, `startDumbScenario`, `stop`, `release`
- `smartautoclicker/src/main/res/values/strings.xml`
  - `toast_scenario_not_found`
