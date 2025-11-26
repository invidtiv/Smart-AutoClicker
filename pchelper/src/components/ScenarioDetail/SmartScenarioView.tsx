import React from 'react';
import ImagePreview from './ImagePreview';
import { ImageData, ScenarioFile } from '../../utils/zipHandler';

interface SmartScenarioViewProps {
  scenario: ScenarioFile;
  images: ImageData[];
}

const SmartScenarioView: React.FC<SmartScenarioViewProps> = ({ scenario, images }) => {
  const smartScenarioContent = scenario.content;

  const findImage = (path: string) => {
    const cleanPath = path.replace(/\\/g, '/'); // Normalize slashes
    const fileName = cleanPath.split('/').pop(); // Extract filename
    if (!fileName) return undefined;

    return images.find((img: ImageData) => {
        // Check if the zip entry ends with the filename (e.g. "folder/Image.png" ends with "Image.png")
        if (img.fileName.endsWith(fileName)) return true;
        // If the condition path didn't have an extension, try matching with .png appended
        if (!fileName.toLowerCase().endsWith('.png') && img.fileName.endsWith(fileName + '.png')) return true;
        return false;
    });
  };

  // Helper function to get condition operator text
  const getConditionOperator = (operator: number): string => {
    if (operator === 1) return 'AND';
    if (operator === 2) return 'OR';
    return 'UNKNOWN';
  };

  // Filter events to separate end conditions from regular events
  const endConditionEvents = smartScenarioContent.scenario.events.filter((event: any) => {
    return event.event.type === 'TRIGGER_EVENT' &&
           (event.event.name.toLowerCase().includes('stop scenario') ||
            event.event.name.toLowerCase().includes('end'));
  });

  const regularEvents = smartScenarioContent.scenario.events.filter((event: any) => {
    return !(event.event.type === 'TRIGGER_EVENT' &&
             (event.event.name.toLowerCase().includes('stop scenario') ||
              event.event.name.toLowerCase().includes('end')));
  });

  // Render a single event (shared logic for end conditions and regular events)
  const renderEvent = (event: any, eventIndex: number, isEndCondition: boolean = false) => {
    const isEnabled = event.event.enabledOnStart !== false; // Default to true if undefined
    const operatorText = getConditionOperator(event.event.conditionOperator);

    return (
      <div key={event.event.id} id={`event-${event.event.id}`} style={{
          border: isEndCondition ? '2px solid #ff9800' : '1px solid #ddd',
          padding: '20px',
          margin: '20px 0',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          backgroundColor: isEnabled ? '#ffffff' : '#f5f5f5', // Grey background if disabled
          opacity: isEnabled ? 1 : 0.8
      }}>
        <h5 style={{ fontSize: '1.4em', marginBottom: '15px', borderBottom: '2px solid #eee', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>
              {isEndCondition ? 'End Condition: ' : `Event #${eventIndex + 1}: `}{event.event.name}
              <span style={{ fontSize: '0.7em', color: '#666', marginLeft: '10px' }}>(ID: {event.event.id}, Type: {event.event.type}, Priority: {event.event.priority})</span>
          </span>
          <span style={{
              fontSize: '0.6em',
              padding: '4px 8px',
              borderRadius: '4px',
              backgroundColor: isEnabled ? '#e8f5e9' : '#e0e0e0',
              color: isEnabled ? '#2e7d32' : '#616161',
              border: `1px solid ${isEnabled ? '#c8e6c9' : '#bdbdbd'}`
          }}>
              {isEnabled ? 'ENABLED' : 'DISABLED'}
          </span>
        </h5>

        {/* Two-column layout: Conditions (left) and Actions (right) */}
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          {/* Left Column: Conditions */}
          <div style={{
            flex: '1 1 45%',
            minWidth: '300px',
            backgroundColor: '#e3f2fd',
            padding: '15px',
            borderRadius: '8px',
            border: '1px solid #bbdefb'
          }}>
              <h6 style={{ marginTop: 0, color: '#1565c0' }}>
                Conditions ({event.conditions.length}) - {operatorText}
              </h6>
              {event.conditions.length === 0 && <p style={{ fontStyle: 'italic', color: '#777' }}>No conditions for this event.</p>}
              {event.conditions.map((condition: any, condIndex: number) => (
                <div key={condition.id} style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #bbdefb',
                    padding: '12px',
                    margin: '8px 0',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '15px'
                }}>
                  <div style={{ flexGrow: 1 }}>
                    <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#0d47a1' }}>Condition #{condIndex + 1}: {condition.name}</p>
                    <p style={{ margin: '0 0 5px 0', fontSize: '0.9em', color: '#555' }}>Type: {condition.type || 'ON_IMAGE_DETECTED (Legacy)'}</p>

                    {/* Allow ON_IMAGE_DETECTED or undefined type (legacy) if path exists */}
                    {((condition.type === 'ON_IMAGE_DETECTED' || !condition.type) && condition.path) && (
                      <div style={{ fontSize: '0.9em' }}>
                        <p style={{ margin: '2px 0' }}>
                          <span style={{ fontWeight: '600' }}>Path:</span> {condition.path}
                        </p>
                        <p style={{ margin: '2px 0' }}>
                          <span style={{ fontWeight: '600' }}>Area:</span> {condition.area ? (
                            `(${condition.area.left}, ${condition.area.top}) - (${condition.area.right}, ${condition.area.bottom})`
                          ) : (condition.areaLeft !== undefined) ? (
                            `(${condition.areaLeft}, ${condition.areaTop}) - (${condition.areaRight}, ${condition.areaBottom})`
                          ) : (
                            <span style={{ color: 'red' }}>Not defined</span>
                          )}
                        </p>
                        <p style={{ margin: '2px 0' }}>
                          <span style={{ fontWeight: '600' }}>Threshold:</span> {condition.threshold}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Image Preview on the right */}
                  {((condition.type === 'ON_IMAGE_DETECTED' || !condition.type) && condition.path) && (() => {
                    const img = findImage(condition.path);
                    if (img) {
                      let width = 0;
                      let height = 0;
                      if (condition.area) {
                          width = condition.area.right - condition.area.left;
                          height = condition.area.bottom - condition.area.top;
                      } else if (condition.areaLeft !== undefined) {
                          width = condition.areaRight - condition.areaLeft;
                          height = condition.areaBottom - condition.areaTop;
                      }
                      return (
                        <div style={{ border: '1px solid #ddd', padding: '2px', borderRadius: '4px', backgroundColor: '#fff' }}>
                            <ImagePreview
                            dataUrl={img.dataUrl}
                            type={img.type}
                            alt={condition.path}
                            displayWidth="120px"
                            displayHeight="120px"
                            pixelWidth={width}
                            pixelHeight={height}
                            />
                        </div>
                      );
                    } else {
                      return null;
                    }
                  })()}
                </div>
              ))}
          </div>

          {/* Right Column: Actions */}
          <div style={{
            flex: '1 1 45%',
            minWidth: '300px',
            backgroundColor: '#e8f5e9',
            padding: '15px',
            borderRadius: '8px',
            border: '1px solid #c8e6c9'
          }}>
              <h6 style={{ marginTop: 0, color: '#2e7d32' }}>Actions ({event.actions.length}):</h6>
              {event.actions.length === 0 && <p style={{ fontStyle: 'italic', color: '#777' }}>No actions for this event.</p>}
              {event.actions.map((actionWrapper: any, actionIndex: number) => {
                // Unwrap the action entity from the wrapper (CompleteActionEntity structure)
                const actionData = actionWrapper.action || actionWrapper;

                return (
                <div key={actionData.id || actionIndex} style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #c8e6c9',
                    padding: '12px',
                    margin: '8px 0',
                    borderRadius: '6px'
                }}>
                  <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#1b5e20' }}>Action #{actionIndex + 1}: {actionData.name}</p>
                  <p style={{ margin: '0 0 5px 0', fontSize: '0.9em', color: '#555' }}>Type: {actionData.type}</p>

                  {/* Display action-specific details based on action.type */}
                  <div style={{ fontSize: '0.9em', color: '#333' }}>
                      {actionData.type === 'CLICK' && (
                        <div>
                            <p style={{ margin: '2px 0' }}>
                                <span style={{ fontWeight: '600' }}>Mode:</span> {actionData.clickPositionType}
                            </p>
                            {actionData.clickPositionType === 'USER_SELECTED' && (
                                <p style={{ margin: '2px 0' }}>
                                    <span style={{ fontWeight: '600' }}>Position:</span> ({actionData.x}, {actionData.y})
                                </p>
                            )}
                            {actionData.clickPositionType === 'ON_DETECTED_CONDITION' && (
                                <p style={{ margin: '2px 0' }}>
                                    <span style={{ fontWeight: '600' }}>Target Condition ID:</span> {actionData.clickOnConditionId}
                                    {actionData.clickOffsetX !== undefined && actionData.clickOffsetY !== undefined && (
                                        <span> (Offset: {actionData.clickOffsetX}, {actionData.clickOffsetY})</span>
                                    )}
                                </p>
                            )}
                            <p style={{ margin: '2px 0' }}>
                                <span style={{ fontWeight: '600' }}>Duration:</span> {actionData.pressDuration} ms
                            </p>
                        </div>
                      )}

                      {actionData.type === 'SWIPE' && (
                          <div>
                            <p style={{ margin: '2px 0' }}>
                                <span style={{ fontWeight: '600' }}>From:</span> ({actionData.fromX}, {actionData.fromY})
                            </p>
                            <p style={{ margin: '2px 0' }}>
                                <span style={{ fontWeight: '600' }}>To:</span> ({actionData.toX}, {actionData.toY})
                            </p>
                            <p style={{ margin: '2px 0' }}>
                                <span style={{ fontWeight: '600' }}>Duration:</span> {actionData.swipeDuration} ms
                            </p>
                          </div>
                      )}

                      {actionData.type === 'PAUSE' && (
                          <p style={{ margin: '2px 0' }}>
                              <span style={{ fontWeight: '600' }}>Duration:</span> {actionData.pauseDuration} ms
                          </p>
                      )}

                      {actionData.type === 'INTENT' && (
                        <div>
                          <p style={{ margin: '2px 0' }}><span style={{ fontWeight: '600' }}>Package:</span> {actionData.packageName}</p>
                          <p style={{ margin: '2px 0' }}><span style={{ fontWeight: '600' }}>Class:</span> {actionData.className}</p>
                          <p style={{ margin: '2px 0' }}><span style={{ fontWeight: '600' }}>Action:</span> {actionData.intentAction || actionData.action}</p>
                          <p style={{ margin: '2px 0' }}><span style={{ fontWeight: '600' }}>Data:</span> {actionData.data}</p>
                          <p style={{ margin: '2px 0' }}><span style={{ fontWeight: '600' }}>Flags:</span> {actionData.flags}</p>
                          <p style={{ margin: '2px 0' }}><span style={{ fontWeight: '600' }}>Broadcast:</span> {actionData.isBroadcast ? 'Yes' : 'No'}</p>
                          {actionWrapper.intentExtras && actionWrapper.intentExtras.length > 0 && (
                              <div style={{ marginTop: '5px' }}>
                                  <span style={{ fontWeight: '600' }}>Extras:</span>
                                  <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                                      {actionWrapper.intentExtras.map((extra: any, i: number) => (
                                          <li key={i}>{extra.key}: {extra.value} ({extra.type})</li>
                                      ))}
                                  </ul>
                              </div>
                          )}
                        </div>
                      )}

                      {actionData.type === 'TOGGLE_EVENT' && (
                          <div>
                             <p style={{ margin: '2px 0' }}>
                               <span style={{ fontWeight: '600' }}>Target Event ID:</span> <a href={`#event-${actionData.toggleEventId}`}>{actionData.toggleEventId}</a>
                             </p>
                             <p style={{ margin: '2px 0' }}>
                               <span style={{ fontWeight: '600' }}>Action:</span> {actionData.toggleEventType || actionData.toggleAllType}
                             </p>
                          </div>
                      )}
                  </div>
                </div>
                );
              })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ textAlign: 'left' }}>
      <h3>Smart Scenario Details</h3>
      <p><strong>ID:</strong> {scenario.id}</p>
      <p><strong>Name:</strong> {smartScenarioContent.scenario.scenario.name}</p>
      <p><strong>Detection Quality:</strong> {smartScenarioContent.scenario.scenario.detectionQuality}</p>
      <p><strong>Randomize:</strong> {smartScenarioContent.scenario.scenario.randomize ? 'Yes' : 'No'}</p>
      <p><strong>Keep Screen On:</strong> {smartScenarioContent.scenario.scenario.keepScreenOn ? 'Yes' : 'No'}</p>
      <p><strong>Total Events:</strong> {smartScenarioContent.scenario.events.length}</p>

      {/* End Conditions Section */}
      {endConditionEvents.length > 0 && (
        <>
          <h4 style={{
            marginTop: '30px',
            color: '#f57c00',
            borderBottom: '2px solid #ff9800',
            paddingBottom: '5px'
          }}>
            End Conditions:
          </h4>
          {endConditionEvents.map((event: any, index: number) => renderEvent(event, index, true))}
        </>
      )}

      {/* Regular Events Section */}
      <h4 style={{ marginTop: '30px' }}>Events:</h4>
      {regularEvents.length === 0 && <p>No events defined for this scenario.</p>}
      {regularEvents.map((event: any, eventIndex: number) => renderEvent(event, eventIndex, false))}
    </div>
  );
};

export default SmartScenarioView;
