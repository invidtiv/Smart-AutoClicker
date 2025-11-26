# Data Structures & Backup Format

## Overview
The application uses a ZIP archive format for backing up and sharing scenarios. This archive contains JSON files defining the scenarios and any associated image assets (for "Smart" scenarios).

## Backup File Format (ZIP)
The backup file (`.zip`) structure is organized as follows:

*   **Root Level:**
    *   **Dumb Scenarios:** JSON files named matching `dumb-scenario-<ID>-.*\.json`.
    *   **Smart Scenarios:** JSON files named matching `smart-scenario-<ID>-.*\.json`.
    *   **Image Assets:** PNG files for image conditions, typically named with a timestamp or ID.

### JSON Structure

#### Smart Scenario (`ScenarioBackup`)
Root JSON object:
```json
{
  "version": "Integer (Database Version)",
  "screenWidth": "Integer",
  "screenHeight": "Integer",
  "scenario": {
    "scenario": {
      "id": { "databaseId": "Long", "tempId": "Long?" },
      "name": "String",
      "detectionQuality": "Integer",
      "randomize": "Boolean",
      "keepScreenOn": "Boolean",
      "eventCount": "Integer",
      "stats": { ... }
    },
    "events": [
      {
        "event": {
            "id": { ... },
            "scenarioId": { ... },
            "name": "String",
            "priority": "Integer",
            "type": "Enum (IMAGE_EVENT, TRIGGER_EVENT, etc.)",
            "onEventAction": "Enum"
        },
        "conditions": [
            {
                "id": { ... },
                "eventId": { ... },
                "name": "String",
                "type": "Enum (ON_IMAGE_DETECTED, etc.)",
                "path": "String (Path to PNG inside ZIP)",
                "area": { "left": "Int", "top": "Int", "right": "Int", "bottom": "Int" },
                "threshold": "Int",
                "minMatches": "Int"
            }
        ],
        "actions": [
            {
                "id": { ... },
                "eventId": { ... },
                "name": "String",
                "type": "Enum (CLICK, SWIPE, PAUSE, INTENT)",
                "priority": "Int",
                ... (Action specific fields like x, y, duration)
            }
        ]
      }
    ]
  }
}
```

#### Dumb Scenario (`DumbScenarioBackup`)
Root JSON object:
```json
{
  "version": "Integer",
  "screenWidth": "Integer",
  "screenHeight": "Integer",
  "dumbScenario": {
    "scenario": {
        "id": { "databaseId": "Long", "tempId": "Long?" },
        "name": "String",
        "repeatCount": "Int",
        "isRepeatInfinite": "Boolean",
        "maxDurationMin": "Int",
        "isDurationInfinite": "Boolean",
        "randomize": "Boolean",
        "stats": { ... }
    },
    "dumbActions": [
        {
            "type": "String (DumbClick, DumbSwipe, DumbPause)",
            "id": { ... },
            "scenarioId": { ... },
            "name": "String",
            "priority": "Int",
            "repeatCount": "Int",
            "isRepeatInfinite": "Boolean",
            "repeatDelayMs": "Long",
            "position": { "x": "Int", "y": "Int" },
            "pressDurationMs": "Long"
            ... (Swipe specific fields)
        }
    ]
  }
}
```

## Database Identifiers
The application uses a custom `Identifier` class wrapping a `Long` database ID.
*   `databaseId`: The persistent ID from the Room database.
*   `tempId`: Used for unsaved objects (not relevant for backup files).
