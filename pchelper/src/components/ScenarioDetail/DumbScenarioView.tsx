import React from 'react';
import { ScenarioFile } from '../../utils/zipHandler';

interface DumbScenarioViewProps {
  scenario: ScenarioFile;
}

const DumbScenarioView: React.FC<DumbScenarioViewProps> = ({ scenario }) => {
  const dumbScenarioContent = scenario.content;

  return (
    <div style={{ textAlign: 'left' }}>
      <h3>Dumb Scenario Details</h3>
      <p><strong>ID:</strong> {scenario.id}</p>
      <p><strong>Name:</strong> {dumbScenarioContent.dumbScenario.scenario.name}</p>
      <p><strong>Repeat Count:</strong> {dumbScenarioContent.dumbScenario.scenario.isRepeatInfinite ? 'Infinite' : dumbScenarioContent.dumbScenario.scenario.repeatCount}</p>
      <p><strong>Max Duration (min):</strong> {dumbScenarioContent.dumbScenario.scenario.isDurationInfinite ? 'Infinite' : dumbScenarioContent.dumbScenario.scenario.maxDurationMin}</p>
      <p><strong>Randomize:</strong> {dumbScenarioContent.dumbScenario.scenario.randomize ? 'Yes' : 'No'}</p>
      <p><strong>Total Actions:</strong> {dumbScenarioContent.dumbScenario.dumbActions.length}</p>

      <h4>Actions:</h4>
      {dumbScenarioContent.dumbScenario.dumbActions.length === 0 && <p>No actions defined for this scenario.</p>}
      {dumbScenarioContent.dumbActions.map((action: any, index: number) => (
        <div key={action.id} style={{ border: '1px dotted #ccc', padding: '8px', margin: '5px 0' }}>
          <p><strong>Action #{index + 1}:</strong> {action.name} (Type: {action.type})</p>
          {action.type === 'DumbClick' && <p>Position: ({action.position.x}, {action.position.y}), Duration: {action.pressDurationMs}ms, Repeat: {action.isRepeatInfinite ? 'Infinite' : action.repeatCount}, Delay: {action.repeatDelayMs}ms</p>}
          {action.type === 'DumbSwipe' && <p>From: ({action.fromPosition.x}, {action.fromPosition.y}), To: ({action.toPosition.x}, {action.toPosition.y}), Duration: {action.swipeDurationMs}ms, Repeat: {action.isRepeatInfinite ? 'Infinite' : action.repeatCount}, Delay: {action.repeatDelayMs}ms</p>}
          {action.type === 'DumbPause' && <p>Duration: {action.pauseDurationMs}ms</p>}
        </div>
      ))}
    </div>
  );
};

export default DumbScenarioView;
