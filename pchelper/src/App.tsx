import React, { useState } from 'react';
import './App.css';
import FileUploader from './components/FileUploader';
import ScenarioList from './components/ScenarioList';
import SmartScenarioView from './components/ScenarioDetail/SmartScenarioView';
import DumbScenarioView from './components/ScenarioDetail/DumbScenarioView';
import { ParsedBackup, ImageData, ScenarioFile } from './utils/zipHandler';

function App() {
  const [parsedData, setParsedData] = useState<ParsedBackup | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioFile | null>(null);
  const [scenarioImages, setScenarioImages] = useState<ImageData[]>([]);

  const handleFileParsed = (data: ParsedBackup) => {
    setParsedData(data);
    setSelectedScenario(null);
  };

  const handleSelectScenario = (scenario: ScenarioFile, images: ImageData[]) => {
    setSelectedScenario(scenario);
    setScenarioImages(images);
  };

  const handleBackToList = () => {
    setSelectedScenario(null);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Klick'r Scenario Previewer</h1>
      </header>
      <main style={{ padding: '20px 40px' }}>
        {!parsedData ? (
          <FileUploader onFileParsed={handleFileParsed} />
        ) : (
          <div>
            {selectedScenario ? (
              <div>
                <button onClick={handleBackToList}>Back to List</button>
                {selectedScenario.type === 'smart' ? (
                  <SmartScenarioView scenario={selectedScenario} images={scenarioImages} />
                ) : (
                  <DumbScenarioView scenario={selectedScenario} />
                )}
              </div>
            ) : (
              <ScenarioList parsedData={parsedData} onSelectScenario={handleSelectScenario} />
            )}
            <button onClick={() => setParsedData(null)} style={{ marginTop: '20px' }}>Upload New File</button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
