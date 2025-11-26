# Klick'r Scenario Previewer (pchelper)

A standalone React web application for previewing Smart AutoClicker (Klick'r) scenario backup files (`.zip`).

## Features

### File Import
- **Drag & Drop Zone**: Drag and drop a `.zip` backup file to load it
- **Client-side Processing**: Uses JSZip to extract and parse contents entirely in the browser
- **Validation**: Automatically detects and validates Smart and Dumb scenario JSON files

### Scenario List
- Displays all scenarios found in the backup file
- Shows ID, Name, Type (Smart/Dumb), and Event Count
- Click a scenario to view detailed information

### Smart Scenario Preview
- **Metadata Display**: Shows global settings (Detection Quality, Randomize, Keep Screen On)
- **End Conditions Section**: Displays scenario termination conditions (shown before regular events with orange styling)
- **Two-Column Event Layout**:
  - **Left Column**: Conditions with AND/OR operator indicator
  - **Right Column**: Actions in execution order
- **Condition Operator Display**: Shows whether conditions use AND (all must match) or OR (any must match)
- **Image Conditions**: Displays reference images for `ON_IMAGE_DETECTED` conditions with detection area and threshold
- **Action Details**: Shows action-specific information (coordinates, duration, intent params, etc.)
- **Event Status**: Visual indication of enabled/disabled events

### Dumb Scenario Preview
- **Action Sequence**: Simple list of clicks/swipes/pauses in order
- **Looping Settings**: Shows repeat count and duration settings

## Getting Started

### Prerequisites
- Node.js (v14 or higher recommended)
- npm or yarn

### Installation

```bash
cd pchelper
npm install
```

### Running the Application

```bash
npm start
```

Opens [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
```

Builds the app for production to the `build` folder.

## Project Structure

```
pchelper/
├── public/
├── src/
│   ├── components/
│   │   ├── FileUploader.tsx        # Drag & drop file upload
│   │   ├── ScenarioList.tsx        # List of scenarios in backup
│   │   └── ScenarioDetail/
│   │       ├── SmartScenarioView.tsx   # Smart scenario visualization
│   │       ├── DumbScenarioView.tsx    # Dumb scenario visualization
│   │       └── ImagePreview.tsx        # Condition image display
│   ├── utils/
│   │   └── zipHandler.ts           # ZIP file parsing utilities
│   ├── App.tsx                     # Main application component
│   └── index.tsx                   # Application entry point
├── package.json
├── CHANGELOG.md
└── README.md
```

## Supported Backup Formats

### Smart Scenario Structure
- JSON files matching pattern: `{ID}/{ID}.json`
- Contains scenario metadata, events, conditions, and actions
- Image assets stored as PNG files

### Dumb Scenario Structure
- JSON files matching pattern: `dumb-{ID}/{ID}.json`
- Contains simple action sequences (clicks, swipes, pauses)

## Technologies Used

- **React** with TypeScript
- **JSZip** for ZIP file handling
- **Create React App** as build toolchain

## Related Documentation

- [Data Structures](../documentation/DATA_STRUCTURES.md) - Backup file format specification
- [React Previewer Spec](../documentation/REACT_PREVIEWER_SPEC.md) - Original design specification

## License

This project is part of Smart AutoClicker II.
