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

  const handleReset = () => {
    setParsedData(null);
    setSelectedScenario(null);
    setScenarioImages([]);
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <div className="header-brand">
            <img src={process.env.PUBLIC_URL + '/logo.png'} alt="Baby Sharks" className="header-logo" />
            <div>
              <div className="header-title-container">
                <img src={process.env.PUBLIC_URL + '/app-icon.png'} alt="Smart Klicker" className="app-icon" />
                <h1 className="header-title">SmartKlickerViewer</h1>
              </div>
              <p className="header-subtitle">Preview and manage Klick'r scenarios</p>
            </div>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="content-card fade-in-up">
          {!parsedData ? (
            <FileUploader onFileParsed={handleFileParsed} />
          ) : (
            <div>
              {selectedScenario ? (
                <div>
                  <button className="nav-back" onClick={handleBackToList}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                    Back to Scenario List
                  </button>
                  {selectedScenario.type === 'smart' ? (
                    <SmartScenarioView scenario={selectedScenario} images={scenarioImages} />
                  ) : (
                    <DumbScenarioView scenario={selectedScenario} />
                  )}
                </div>
              ) : (
                <ScenarioList parsedData={parsedData} onSelectScenario={handleSelectScenario} />
              )}
              <div className="action-bar">
                <div>
                  {parsedData && (
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      {parsedData.scenarios.length} scenario{parsedData.scenarios.length !== 1 ? 's' : ''} loaded
                    </span>
                  )}
                </div>
                <button className="btn btn-secondary" onClick={handleReset}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '16px', height: '16px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                  </svg>
                  Upload New File
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
