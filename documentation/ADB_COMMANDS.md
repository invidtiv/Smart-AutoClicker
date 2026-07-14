# ADB Command Guide for Smart AutoClicker 2.4.2

Smart AutoClicker 2.4.2 can start a stored Smart or Dumb scenario through an activity intent. It cannot list scenarios, report status, pause, or stop through ADB. See the [feature specification](./FEATURE_SPEC_2025.md) for the exact supported scope and the [implementation handoff](./HANDOFF_ADB_INTENT.md) for engineering details.

## Command contract

- Action: `com.buzbuz.smartautoclicker.action.START_SCENARIO`
- ID selector: `SCENARIO_ID`, an Android Long; pass it with `--el`
- Name selector: `SCENARIO_NAME`, an Android String; pass it with `--es`
- Release package: `com.buzbuz.smartautoclicker`
- Debug package: `com.buzbuz.smartautoclicker.debug`

The examples are single-line commands so they can be pasted into Windows Command Prompt, PowerShell, Bash, or another POSIX shell. Replace sample IDs and names with values stored in your app.

## Select the LD2 emulator

The LD2 example in this project uses ADB serial `emulator-5560`:

```text
adb -s emulator-5560 get-state
```

The expected response is `device`. Keep `-s emulator-5560` in every command when more than one device or emulator is connected.

## Build and install an F-Droid variant

From the repository root, use the command for your host platform.

Windows PowerShell or Command Prompt, debug:

```text
.\gradlew.bat :smartautoclicker:installFDroidDebug
```

POSIX shell, debug:

```text
./gradlew :smartautoclicker:installFDroidDebug
```

Windows PowerShell or Command Prompt, release APK:

```text
.\gradlew.bat :smartautoclicker:assembleFDroidRelease
```

POSIX shell, release APK:

```text
./gradlew :smartautoclicker:assembleFDroidRelease
```

The F-Droid debug variant installs as `com.buzbuz.smartautoclicker.debug`. An F-Droid release APK uses `com.buzbuz.smartautoclicker`; building or installing release may require the signing configuration used by the project.

## Start a scenario on LD2

### F-Droid debug package

By database ID:

```text
adb -s emulator-5560 shell am start -W -a com.buzbuz.smartautoclicker.action.START_SCENARIO -p com.buzbuz.smartautoclicker.debug --el SCENARIO_ID 42
```

By exact name:

```text
adb -s emulator-5560 shell am start -W -a com.buzbuz.smartautoclicker.action.START_SCENARIO -p com.buzbuz.smartautoclicker.debug --es SCENARIO_NAME "My Scenario"
```

### F-Droid release package

By database ID:

```text
adb -s emulator-5560 shell am start -W -a com.buzbuz.smartautoclicker.action.START_SCENARIO -p com.buzbuz.smartautoclicker --el SCENARIO_ID 42
```

By exact name:

```text
adb -s emulator-5560 shell am start -W -a com.buzbuz.smartautoclicker.action.START_SCENARIO -p com.buzbuz.smartautoclicker --es SCENARIO_NAME "My Scenario"
```

Name matching is full-string, exact, and case-sensitive. If duplicate scenario names exist, the first repository match wins; prefer IDs for dependable automation.

## Selector precedence

If both selectors are supplied, the presence of `SCENARIO_ID` selects ID lookup. `SCENARIO_NAME` is ignored even when the ID does not exist:

```text
adb -s emulator-5560 shell am start -W -a com.buzbuz.smartautoclicker.action.START_SCENARIO -p com.buzbuz.smartautoclicker.debug --el SCENARIO_ID 999999 --es SCENARIO_NAME "A Valid Scenario Name"
```

This command shows `Scenario not found` when ID `999999` is absent. It does not fall back to the otherwise valid name.

## Reliable cold-start sequence

The command is consumed in `ScenarioActivity.onCreate`; the activity has no `onNewIntent` implementation. For repeatable test runs, stop the installed package before sending the start command.

Debug package example:

```text
adb -s emulator-5560 shell am force-stop com.buzbuz.smartautoclicker.debug
adb -s emulator-5560 shell am start -W -a com.buzbuz.smartautoclicker.action.START_SCENARIO -p com.buzbuz.smartautoclicker.debug --es SCENARIO_NAME "My Scenario"
```

Release package example:

```text
adb -s emulator-5560 shell am force-stop com.buzbuz.smartautoclicker
adb -s emulator-5560 shell am start -W -a com.buzbuz.smartautoclicker.action.START_SCENARIO -p com.buzbuz.smartautoclicker --es SCENARIO_NAME "My Scenario"
```

## Permission and UI expectations

ADB starts the normal app flow and grants no special bypass:

- Draw-over-other-apps permission must be enabled.
- The Smart AutoClicker accessibility service must be enabled and bound.
- Smart scenarios open the Android MediaProjection consent dialog; approve it on the emulator.
- Dumb scenarios do not need MediaProjection consent.
- Notification permission can be requested on supported Android versions but is optional.
- Foreground-service permission is declared by the app and checked before scenario loading.

If a mandatory permission is missing, the app may open a permission explanation or Android settings. Complete it, then issue the cold-start sequence again if the original request did not continue.

## Invalid-case checks

Unknown ID:

```text
adb -s emulator-5560 shell am start -W -a com.buzbuz.smartautoclicker.action.START_SCENARIO -p com.buzbuz.smartautoclicker.debug --el SCENARIO_ID 999999
```

Unknown exact name:

```text
adb -s emulator-5560 shell am start -W -a com.buzbuz.smartautoclicker.action.START_SCENARIO -p com.buzbuz.smartautoclicker.debug --es SCENARIO_NAME "This Scenario Does Not Exist"
```

Missing selector:

```text
adb -s emulator-5560 shell am start -W -a com.buzbuz.smartautoclicker.action.START_SCENARIO -p com.buzbuz.smartautoclicker.debug
```

Each reaches the activity. The app shows the short `Scenario not found` toast and requests no new start or stop; any already-running service/scenario state remains unchanged. ADB does not receive a scenario-level failure result.

## Unsupported broadcast commands

Do not use `am broadcast` for this feature. The following proposed actions have no receiver in 2.4.2 and are not implemented:

- `com.buzbuz.smartautoclicker.action.GET_STATUS`
- `com.buzbuz.smartautoclicker.action.LIST_SCENARIOS`
- `com.buzbuz.smartautoclicker.action.PAUSE_SCENARIO`
- `com.buzbuz.smartautoclicker.action.STOP_SCENARIO`

`START_SCENARIO` is implemented only through `am start` and `ScenarioActivity`, not as a broadcast.

## Troubleshooting

**ADB reports more than one device or emulator.** Include `-s emulator-5560`, or replace it with the intended serial shown by `adb devices`.

**LD2 is absent or offline.** Confirm that LD2 is running with ADB enabled, restart its ADB integration if needed, and check that `adb devices` lists `emulator-5560` as `device`.

**Android cannot resolve the activity intent.** Confirm which package is installed:

```text
adb -s emulator-5560 shell pm list packages smartautoclicker
```

Use `com.buzbuz.smartautoclicker.debug` for an F-Droid debug install and `com.buzbuz.smartautoclicker` for release. Also check spelling and capitalization of the action.

**`Scenario not found` appears.** Confirm the database ID or the exact, case-sensitive full name. If both extras are present, remove `SCENARIO_ID` to test by name because there is no fallback after an ID miss.

**The activity opens but the scenario does not start.** Complete overlay and accessibility setup. For a Smart scenario, approve MediaProjection consent. Then repeat the cold-start sequence.

**A second command appears to do nothing.** `ScenarioActivity` only handles this action during `onCreate`. Force-stop the correct package and resend the command.

**`am start -W` reports success but automation is idle.** The wait result covers activity launch only. Observe the emulator for permission UI or the `Scenario not found` toast; 2.4.2 does not return scenario success to ADB.
