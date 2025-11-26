# UI Changes: Scenario ID Display

## Objective
Display the Scenario ID alongside the name in the main scenario list to facilitate usage with the new ADB command. The format will be `ID: Name`.

## Technical Implementation

### 1. Data Model Update
Modify `ScenarioListUiState.kt` to change how the `displayName` property of `ScenarioItem` is constructed.

**Current:**
```kotlin
data class Smart(..., override val scenario: Scenario, ...) : Valid(displayName = scenario.name, ...)
```

**Proposed:**
```kotlin
data class Smart(..., override val scenario: Scenario, ...) : Valid(displayName = "${scenario.id.databaseId}: ${scenario.name}", ...)
```
*   Apply this change to both `Smart` and `Dumb` scenario data classes within `ScenarioListUiState.Item.ScenarioItem.Valid`.
*   Apply this change to `ScenarioListUiState.Item.ScenarioItem.Empty` classes as well if consistent display is desired for empty scenarios.

### 2. UI Rendering
*   The `ScenarioAdapter` and `ViewHolders` (`SmartScenarioViewHolder`, `DumbScenarioViewHolder`) already bind `displayName` to the `TextView`.
*   No changes should be required in the `ViewHolder` or XML layout files if we modify the data model source.

### 3. Search Functionality
*   Update `FilteredScenarioListUseCase` search logic.
*   Currently, it filters by `displayName`. Since `displayName` will now contain the ID, searching by ID should automatically work!
*   Verify `filterByName` function uses `displayName.contains(filter, true)`.

## Impact Analysis
*   **Scenario List:** Will show IDs for all items.
*   **Dialogs:** Verify if `displayName` is used in "Delete" or "Copy" dialogs. If so, the ID will show there too, which is acceptable/desirable for clarity.
