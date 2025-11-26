# React Scenario Previewer Specification

## Objective
Create a standalone React web application (running locally on PC) to preview Smart AutoClicker scenario backup files (`.zip`).

## Key Features

### 1. File Import
*   **Drag & Drop Zone:** Allow users to drag and drop a `.zip` backup file.
*   **File Parsing:** Use a JS library (like `jszip`) to extract the contents of the uploaded file client-side.
*   **Validation:** Check for the presence of valid JSON scenario files.

### 2. Scenario List
*   Display a list of all scenarios found in the backup.
*   **Columns:** ID, Name, Type (Smart/Dumb), Event Count.
*   **Search/Filter:** Filter by name or ID.
*   **Selection:** Click a row to view details.

### 3. Detailed Preview (Visualization)
*   **Smart Scenarios:**
    *   **Metadata:** Show global settings (Quality, Randomize, etc.).
    *   **Events List:**
        *   Display each Event with its Triggers (Conditions) and Actions.
    *   **Image Conditions:**
        *   Display the reference image (extracted from ZIP) for `ON_IMAGE_DETECTED` conditions.
        *   Show detection area (coordinates) and threshold.
    *   **Actions:**
        *   List actions in execution order (Priority).
        *   Show action details (Type, Coordinates, Duration, Intent params).
*   **Dumb Scenarios:**
    *   **Action Sequence:** Simple list of clicks/swipes/pauses in order.
    *   **Looping:** Show repeat count/duration settings.

### 4. Architecture (High Level)
*   **Framework:** React (with TypeScript recommended).
*   **State Management:** React Context or Zustand to hold the loaded backup data.
*   **Styling:** Tailwind CSS or Material UI (MUI) for a clean, "application-like" look.
*   **Libraries:**
    *   `jszip`: For handling ZIP files.
    *   `lucide-react` or `react-icons`: For UI icons.

## Project Structure (Proposed)
```
pchelper/
├── public/
├── src/
│   ├── components/
│   │   ├── FileUploader.tsx
│   │   ├── ScenarioList.tsx
│   │   ├── ScenarioDetail/
│   │   │   ├── SmartScenarioView.tsx
│   │   │   ├── DumbScenarioView.tsx
│   │   │   └── ImagePreview.tsx
│   ├── utils/
│   │   ├── zipHandler.ts
│   │   └── parsers.ts
│   ├── App.tsx
│   └── main.tsx
├── package.json
└── README.md
```
