# ADB Intent Declarations

Smart AutoClicker 2.4.2 exposes the following ADB-facing intent contract.

## Available Activity Actions

| Purpose | ADB command type | Action | Handler |
|---|---|---|---|
| Start a stored Smart or Dumb scenario | `am start` | `com.buzbuz.smartautoclicker.action.START_SCENARIO` | `ScenarioActivity` |

## Available Broadcast Actions

These control the scenario that `START_SCENARIO` has already loaded into the running `SmartAutoClickerService`. They are handled by a receiver registered by the service while it is running, so they only take effect after the overlay has been loaded.

| Purpose | ADB command type | Action | Handler |
|---|---|---|---|
| Play (start detection of) the loaded scenario | `am broadcast` | `com.buzbuz.smartautoclicker.action.PLAY_SCENARIO` | `SmartAutoClickerService` |
| Stop detection of the loaded scenario (overlay stays) | `am broadcast` | `com.buzbuz.smartautoclicker.action.STOP_SCENARIO` | `SmartAutoClickerService` |

## Two-step flow

`START_SCENARIO` only loads the overlay; it does not press play. Starting the automation without touching the screen is a separate broadcast:

```text
# 1) load the overlay for scenario id 1
adb -s <serial> shell am start -W -a com.buzbuz.smartautoclicker.action.START_SCENARIO -p com.buzbuz.smartautoclicker.debug --el SCENARIO_ID 1

# 2) press play (start detection) — no screen tap
adb -s <serial> shell am broadcast -a com.buzbuz.smartautoclicker.action.PLAY_SCENARIO -p com.buzbuz.smartautoclicker.debug

# stop detection again (overlay stays loaded, can be replayed)
adb -s <serial> shell am broadcast -a com.buzbuz.smartautoclicker.action.STOP_SCENARIO -p com.buzbuz.smartautoclicker.debug
```

`PLAY_SCENARIO` and `STOP_SCENARIO` take no extras. They act on whichever scenario is currently loaded. `PLAY_SCENARIO` is ignored if no scenario is loaded, if the detection engine is not ready yet, or if detection is already running (it is safe to send repeatedly). Detection currently applies to Smart scenarios. `STOP_SCENARIO` stops the detection but leaves the overlay loaded — it does not close the overlay; use the overlay stop button, `Volume Down`, or `am force-stop` for a full teardown.

## `START_SCENARIO`

```text
com.buzbuz.smartautoclicker.action.START_SCENARIO
```

This action starts a stored scenario through the normal app permission and consent flow. It is registered as an activity intent filter, not as a broadcast receiver action.

### Extras

| Extra | Type | ADB option | Meaning |
|---|---|---|---|
| `SCENARIO_ID` | Long | `--el SCENARIO_ID <id>` | Database ID of the Smart or Dumb scenario to start. |
| `SCENARIO_NAME` | String | `--es SCENARIO_NAME "<name>"` | Exact, case-sensitive scenario name to start. |

At least one selector extra is required. If both are provided, `SCENARIO_ID` takes precedence and `SCENARIO_NAME` is ignored, even when the ID is not found.

### Packages

| Variant | Package |
|---|---|
| Release | `com.buzbuz.smartautoclicker` |
| Debug | `com.buzbuz.smartautoclicker.debug` |

### Examples

Start by ID on a debug install:

```text
adb shell am start -W -a com.buzbuz.smartautoclicker.action.START_SCENARIO -p com.buzbuz.smartautoclicker.debug --el SCENARIO_ID 42
```

Start by exact name on a debug install:

```text
adb shell am start -W -a com.buzbuz.smartautoclicker.action.START_SCENARIO -p com.buzbuz.smartautoclicker.debug --es SCENARIO_NAME "My Scenario"
```

Add `-s <device-serial>` after `adb` when more than one device or emulator is connected.

## Not Available As ADB Intents

The app does not expose ADB intents or broadcasts for status or listing scenarios. These action names are documented only as future proposals and are not registered handlers:

| Action | Status |
|---|---|
| `com.buzbuz.smartautoclicker.action.GET_STATUS` | Not available |
| `com.buzbuz.smartautoclicker.action.LIST_SCENARIOS` | Not available |
| `com.buzbuz.smartautoclicker.action.PAUSE_SCENARIO` | Not available — use `STOP_SCENARIO` (stops detection, overlay stays) |

See [ADB_COMMANDS.md](./ADB_COMMANDS.md) for copyable operational commands and troubleshooting details.
