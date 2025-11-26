import React, { useState } from 'react';
import { ParsedBackup, ScenarioFile, ImageData } from '../utils/zipHandler';

interface ScenarioListProps {
  parsedData: ParsedBackup;
  onSelectScenario: (scenario: ScenarioFile, images: ImageData[]) => void;
}

const ScenarioList: React.FC<ScenarioListProps> = ({ parsedData, onSelectScenario }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredScenarios = parsedData.scenarios.filter(scenario =>
    scenario.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    scenario.id.toString().includes(searchTerm)
  );

  return (
    <div>
      <h2>Available Scenarios</h2>
      <input
        type="text"
        placeholder="Search by ID or Name"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ marginBottom: '10px', padding: '8px', width: '100%', boxSizing: 'border-box' }}
      />
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f2f2f2' }}>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>ID</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Name</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Type</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Event Count</th>
          </tr>
        </thead>
        <tbody>
          {filteredScenarios.map(scenario => (
            <tr
              key={scenario.id}
              onClick={() => onSelectScenario(scenario, parsedData.images)}
              style={{
                cursor: 'pointer',
                backgroundColor: '#ffffff',
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
            >
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{scenario.id}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{scenario.name}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{scenario.type}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                {scenario.type === 'smart' ? scenario.content.scenario.eventCount : scenario.content.dumbScenario.dumbActions.length}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ScenarioList;
