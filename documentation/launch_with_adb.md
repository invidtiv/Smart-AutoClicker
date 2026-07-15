# How to Launch a Scenario with ADB

End-to-end guide for driving **Smart AutoClicker (Klick'r)** over ADB: find the stored script, satisfy the app permissions, load the overlay, start/stop the run without touching the screen, and hand off to another app. All commands below were verified on `emulator-5558` (LD2, model SM-N9810, Android 9) with the fDroid **debug** build.

> Packages: debug install = `com.buzbuz.smartautoclicker.debug`, release install = `com.buzbuz.smartautoclicker`. Replace `-p <package>` accordingly. Every example targets a specific device with `-s emulator-5558`; drop it if only one device is attached.

---

## 0. Quick reference

| Goal | Command |
|---|---|
| List devices | `adb devices -l` |
| Find script IDs (Smart) | `adb -s emulator-5558 shell "run-as com.buzbuz.smartautoclicker.debug sqlite3 databases/click_database 'SELECT id, name FROM scenario_table;'"` |
| Enable accessibility (prereq) | see [§2](#2-one-time-permission-setup) |
| Load overlay for a scenario | `adb -s emulator-5558 shell am start -W -a com.buzbuz.smartautoclicker.action.START_SCENARIO -p com.buzbuz.smartautoclicker.debug --el SCENARIO_ID 1` |
| **Play (no tap)** | `adb -s emulator-5558 shell am broadcast -a com.buzbuz.smartautoclicker.action.PLAY_SCENARIO -p com.buzbuz.smartautoclicker.debug` |
| **Stop detection** | `adb -s emulator-5558 shell am broadcast -a com.buzbuz.smartautoclicker.action.STOP_SCENARIO -p com.buzbuz.smartautoclicker.debug` |
| Full teardown | `adb -s emulator-5558 shell am force-stop com.buzbuz.smartautoclicker.debug` |
| Stop key (device) | `adb -s emulator-5558 shell input keyevent 25` (Volume Down) |

---

## 1. Find the device and the script ID

### Pick the device

```text
adb devices -l
```

When several emulators are attached (e.g. `emulator-5554`, `emulator-5558`, `emulator-5560`), keep `-s emulator-5558` in every command.

### Find the stored scenario ID

The app has **no** `LIST_SCENARIOS` ADB command, so read the IDs directly from the app database. The debug build is debuggable, so `run-as` can reach it, and the device ships `sqlite3`.

Two databases exist:

- `click_database` → **Smart** scenarios, table `scenario_table`
- `dumb_database` → **Dumb** scenarios, table `dumb_scenario_table`

```text
# Smart scenarios
adb -s emulator-5558 shell "run-as com.buzbuz.smartautoclicker.debug sqlite3 databases/click_database 'SELECT id, name FROM scenario_table;'"

# Dumb scenarios
adb -s emulator-5558 shell "run-as com.buzbuz.smartautoclicker.debug sqlite3 databases/dumb_database 'SELECT id, name FROM dumb_scenario_table;'"
```

Example output (this device):

```text
1|CATS_4_1900x600 - Park Cars v2.5 [B5] 2 NZII
```

So the script is **ID `1`**. Quoting matters on Windows PowerShell: wrap the whole remote command in double quotes so the device shell receives the SQL as a single single-quoted argument.

---

## 2. One-time permission setup

ADB grants **no** permission bypass — the app runs its normal flow. A Smart scenario needs:

- **Accessibility service** enabled and bound (to inject gestures)
- **Draw over other apps** (overlay)
- **MediaProjection** consent (screen capture) — Smart scenarios only

On an emulator you can pre-grant these from ADB.

> ### ⚠️ Order matters
> Enabling the accessibility service and then **force-stopping the app disables it again** (Android drops an accessibility service whose process is force-killed). Always **force-stop first, then enable**, and do **not** force-stop afterwards.

```text
# 1) clean state FIRST
adb -s emulator-5558 shell am force-stop com.buzbuz.smartautoclicker.debug

# 2) enable the accessibility service, then the master flag
adb -s emulator-5558 shell settings put secure enabled_accessibility_services com.buzbuz.smartautoclicker.debug/com.buzbuz.smartautoclicker.SmartAutoClickerService
adb -s emulator-5558 shell settings put secure accessibility_enabled 1

# 3) grant overlay + screen-capture app-ops
adb -s emulator-5558 shell appops set com.buzbuz.smartautoclicker.debug SYSTEM_ALERT_WINDOW allow
adb -s emulator-5558 shell appops set com.buzbuz.smartautoclicker.debug PROJECT_MEDIA allow
```

Verify it stuck:

```text
adb -s emulator-5558 shell settings get secure enabled_accessibility_services
adb -s emulator-5558 shell settings get secure accessibility_enabled
```

Expected:

```text
com.buzbuz.smartautoclicker.debug/com.buzbuz.smartautoclicker.SmartAutoClickerService
1
```

Notes:

- If the device already runs other accessibility services, `enabled_accessibility_services` is a **colon-separated** list. Append the Smart AutoClicker component instead of overwriting, e.g. `existing/svc:com.buzbuz.smartautoclicker.debug/com.buzbuz.smartautoclicker.SmartAutoClickerService`.
- The setting **persists across app reinstalls** (same package), but a fresh install kills the process — the service rebinds on next launch.
- If you can't pre-grant from ADB, launch the scenario once and complete the **Accessibility service** and **screen recording** dialogs on screen, then re-run the load command.

---

## 3. Load the scenario (overlay only)

`START_SCENARIO` is an **activity** intent handled by `ScenarioActivity`. It loads the overlay and shows the floating menu on ▶ **Play** — it does **not** start running.

### By database ID (recommended)

```text
adb -s emulator-5558 shell am start -W -a com.buzbuz.smartautoclicker.action.START_SCENARIO -p com.buzbuz.smartautoclicker.debug --el SCENARIO_ID 1
```

### By exact name (case-sensitive, full string)

```text
adb -s emulator-5558 shell am start -W -a com.buzbuz.smartautoclicker.action.START_SCENARIO -p com.buzbuz.smartautoclicker.debug --es SCENARIO_NAME "CATS_4_1900x600 - Park Cars v2.5 [B5] 2 NZII"
```

- Extras: `--el SCENARIO_ID <long>` or `--es SCENARIO_NAME "<name>"`. At least one is required.
- If **both** are supplied, `SCENARIO_ID` wins and `SCENARIO_NAME` is ignored — even if the ID doesn't exist (no fallback). Missing/unknown selector → short **"Scenario not found"** toast.
- Expected reply: `Status: ok`, `Activity: …ScenarioActivity`.
- `ScenarioActivity` consumes the intent only in `onCreate` (no `onNewIntent`). For a repeatable cold-start, force-stop **before** loading — but remember [§2](#2-one-time-permission-setup): only force-stop while re-establishing state, not after enabling accessibility.

---

## 4. Play and stop — no screen tap

Starting the run used to require tapping ▶ on the overlay. Two **broadcasts**, handled by the running `SmartAutoClickerService`, now do it over ADB. They take **no extras** and act on whichever scenario is currently loaded.

```text
# PLAY — start detection (equivalent to pressing ▶)
adb -s emulator-5558 shell am broadcast -a com.buzbuz.smartautoclicker.action.PLAY_SCENARIO -p com.buzbuz.smartautoclicker.debug

# STOP — stop detection, overlay stays loaded (equivalent to pressing pause)
adb -s emulator-5558 shell am broadcast -a com.buzbuz.smartautoclicker.action.STOP_SCENARIO -p com.buzbuz.smartautoclicker.debug
```

- Successful delivery prints `Broadcast completed: result=0`. That confirms delivery, not state change — watch the overlay's play/pause button (▶ ↔ ⏸) to confirm.
- Send `PLAY_SCENARIO` **after** the overlay has loaded (§3). It is **idempotent**: ignored if nothing is loaded, if the engine isn't ready, or if detection is already running. Detection applies to **Smart** scenarios.
- `STOP_SCENARIO` stops detection only; it **does not close the overlay** — the scenario can be replayed with another `PLAY_SCENARIO`.

### Full teardown

`STOP_SCENARIO` is a pause, not a close. To fully unload the overlay:

```text
adb -s emulator-5558 shell input keyevent 25          # Volume Down = app kill switch
# or
adb -s emulator-5558 shell am force-stop com.buzbuz.smartautoclicker.debug
```

*(or press the ■ Stop button on the overlay.)*

---

## 5. Full end-to-end sequence

```text
# --- setup (once) ---
adb -s emulator-5558 shell am force-stop com.buzbuz.smartautoclicker.debug
adb -s emulator-5558 shell settings put secure enabled_accessibility_services com.buzbuz.smartautoclicker.debug/com.buzbuz.smartautoclicker.SmartAutoClickerService
adb -s emulator-5558 shell settings put secure accessibility_enabled 1
adb -s emulator-5558 shell appops set com.buzbuz.smartautoclicker.debug SYSTEM_ALERT_WINDOW allow
adb -s emulator-5558 shell appops set com.buzbuz.smartautoclicker.debug PROJECT_MEDIA allow

# --- run ---
adb -s emulator-5558 shell am start -W -a com.buzbuz.smartautoclicker.action.START_SCENARIO -p com.buzbuz.smartautoclicker.debug --el SCENARIO_ID 1
adb -s emulator-5558 shell am broadcast -a com.buzbuz.smartautoclicker.action.PLAY_SCENARIO -p com.buzbuz.smartautoclicker.debug

# --- stop ---
adb -s emulator-5558 shell am broadcast -a com.buzbuz.smartautoclicker.action.STOP_SCENARIO -p com.buzbuz.smartautoclicker.debug
```

---

## 6. Related app: bslauncher squad mode

The companion launcher `com.bslauncher.launcher` accepts an activity intent with `gang` / `squad` extras:

```text
adb -s emulator-5558 shell am start -W -n com.bslauncher.launcher/com.bslauncher.LauncherActivity --es gang BS8 --es squad SQUAD1
```

If bslauncher is already the top activity, the reply is `Warning: Activity not started, intent has been delivered to currently running top-most instance` with `Status: ok` — the extras reach the live instance via `onNewIntent`. The UI switches to **SQUAD MODE**; it looks for a squad folder named `<gang><squad>` (e.g. `BS8SQUAD1`) under its `TeamFiles` directory and shows "No Squad Folders Found" if absent.

---

## 7. Build & install the debug APK

Needed only when changing the app (e.g. the PLAY/STOP broadcasts).

> ### ⚠️ Requires JDK 17
> The project's Kotlin/AGP toolchain rejects newer JDKs — building on JDK 21 fails with `Unknown Kotlin JVM target: 21`. Point Gradle at a JDK 17 via `JAVA_HOME` (do **not** pass `-Dorg.gradle.java.home` with a spaced Windows path — the wrapper mis-parses it).

PowerShell:

```powershell
$env:JAVA_HOME = 'C:\Program Files\Eclipse Adoptium\jdk-17.0.16.8-hotspot'
$env:ANDROID_SERIAL = 'emulator-5558'   # picks the install target when several devices are attached
cd 'C:\Users\tiaz\Desktop\Github\Smart-AutoClicker-V242'
.\gradlew.bat :smartautoclicker:installFDroidDebug --console=plain
```

- `installFDroidDebug` → installs `com.buzbuz.smartautoclicker.debug`.
- Release APK: `.\gradlew.bat :smartautoclicker:assembleFDroidRelease` (needs the signing config).
- LDPlayer prints harmless `Failed to start Emulator console for <port>` lines during install; success shows `Installed on 1 device` and `BUILD SUCCESSFUL`.

---

## 8. Command reference

### Activity actions (`am start`)

| Action | Handler | Extras |
|---|---|---|
| `com.buzbuz.smartautoclicker.action.START_SCENARIO` | `ScenarioActivity` | `--el SCENARIO_ID <long>` and/or `--es SCENARIO_NAME "<name>"` |

### Broadcast actions (`am broadcast`)

| Action | Handler | Effect |
|---|---|---|
| `com.buzbuz.smartautoclicker.action.PLAY_SCENARIO` | `SmartAutoClickerService` | Start detection of the loaded scenario (Smart) |
| `com.buzbuz.smartautoclicker.action.STOP_SCENARIO` | `SmartAutoClickerService` | Stop detection; overlay stays loaded |

### Not implemented as ADB commands

`GET_STATUS`, `LIST_SCENARIOS`, `PAUSE_SCENARIO` (use `STOP_SCENARIO`). Do not use `am broadcast` for `START_SCENARIO` — it is an activity action only.

---

## 9. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| "Accessibility service" dialog after load | Service not bound. Run [§2](#2-one-time-permission-setup) in the right order (force-stop **first**). |
| Accessibility setting reverts to empty / `0` | You force-stopped the app **after** enabling it. Force-stop first, enable second, don't force-stop again. |
| `Scenario not found` toast | Wrong ID, or wrong exact/case-sensitive name. If both extras present, drop `SCENARIO_ID` to test by name (no fallback after an ID miss). |
| `PLAY_SCENARIO` returns `result=0` but nothing runs | Overlay not loaded yet, engine not ready, or already running. Load with `START_SCENARIO` first; the broadcast is idempotent. |
| `am` reports "more than one device/emulator" | Add `-s emulator-5558` (or the serial from `adb devices`). |
| Intent can't be resolved | Wrong package. Debug install = `…smartautoclicker.debug`, release = `…smartautoclicker`. Check with `adb -s emulator-5558 shell pm list packages | findstr smartautoclicker`. |
| Gradle: `Unknown Kotlin JVM target: 21` | Building on JDK 21. Set `JAVA_HOME` to a JDK 17 ([§7](#7-build--install-the-debug-apk)). |
| Screenshot file corrupted on Windows | Don't pipe `exec-out screencap` through PowerShell `>`. Use `shell screencap -p /sdcard/x.png` then `pull`. |

---

*Verified on emulator-5558 (SM-N9810, Android 9), `com.buzbuz.smartautoclicker.debug`, branch `codex/adb-intent-v242`. See also [`ADB_INTENTS.md`](./ADB_INTENTS.md) and [`ADB_COMMANDS.md`](./ADB_COMMANDS.md).*
