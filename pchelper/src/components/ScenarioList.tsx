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

  const getEventCount = (scenario: ScenarioFile) => {
    if (scenario.type === 'smart') {
      return scenario.content.scenario.eventCount;
    }
    return scenario.content.dumbScenario.dumbActions.length;
  };

  const getTypeBadgeStyle = (type: string) => {
    if (type === 'smart') {
      return {
        backgroundColor: 'rgba(96, 165, 250, 0.15)',
        color: 'var(--primary)',
        border: '1px solid rgba(96, 165, 250, 0.3)',
      };
    }
    return {
      backgroundColor: 'rgba(168, 85, 247, 0.15)',
      color: 'var(--secondary)',
      border: '1px solid rgba(168, 85, 247, 0.3)',
    };
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: '0.5rem',
        }}>
          Available Scenarios
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Select a scenario to view its details
        </p>
      </div>

      {/* Search Input */}
      <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          style={{
            position: 'absolute',
            left: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '18px',
            height: '18px',
            color: 'var(--text-muted)',
          }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search by ID or Name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '0.875rem 1rem 0.875rem 3rem',
            backgroundColor: 'var(--bg-dark)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            outline: 'none',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--primary)';
            e.target.style.boxShadow = '0 0 0 3px rgba(96, 165, 250, 0.1)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--border-color)';
            e.target.style.boxShadow = 'none';
          }}
        />
      </div>

      {/* Table */}
      <div style={{
        overflowX: 'auto',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.875rem',
        }}>
          <thead>
            <tr style={{ backgroundColor: 'rgba(31, 41, 55, 0.8)' }}>
              <th style={{
                padding: '0.875rem 1rem',
                textAlign: 'left',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                borderBottom: '1px solid var(--border-color)',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>ID</th>
              <th style={{
                padding: '0.875rem 1rem',
                textAlign: 'left',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                borderBottom: '1px solid var(--border-color)',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>Name</th>
              <th style={{
                padding: '0.875rem 1rem',
                textAlign: 'left',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                borderBottom: '1px solid var(--border-color)',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>Type</th>
              <th style={{
                padding: '0.875rem 1rem',
                textAlign: 'right',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                borderBottom: '1px solid var(--border-color)',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>Events</th>
            </tr>
          </thead>
          <tbody>
            {filteredScenarios.length === 0 ? (
              <tr>
                <td colSpan={4} style={{
                  padding: '3rem 1rem',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                }}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    style={{ width: '48px', height: '48px', margin: '0 auto 1rem', opacity: 0.5 }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                    />
                  </svg>
                  <p style={{ margin: 0 }}>No scenarios found matching "{searchTerm}"</p>
                </td>
              </tr>
            ) : (
              filteredScenarios.map((scenario, index) => (
                <tr
                  key={scenario.id}
                  onClick={() => onSelectScenario(scenario, parsedData.images)}
                  style={{
                    cursor: 'pointer',
                    backgroundColor: 'transparent',
                    transition: 'background-color 0.15s ease',
                    borderBottom: index !== filteredScenarios.length - 1 ? '1px solid var(--border-color)' : 'none',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(96, 165, 250, 0.05)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <td style={{
                    padding: '1rem',
                    color: 'var(--text-muted)',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.8125rem',
                  }}>
                    #{scenario.id}
                  </td>
                  <td style={{
                    padding: '1rem',
                    color: 'var(--text-primary)',
                    fontWeight: 500,
                  }}>
                    {scenario.name}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      textTransform: 'capitalize',
                      ...getTypeBadgeStyle(scenario.type),
                    }}>
                      {scenario.type}
                    </span>
                  </td>
                  <td style={{
                    padding: '1rem',
                    textAlign: 'right',
                    color: 'var(--text-secondary)',
                  }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                    }}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        style={{ width: '14px', height: '14px' }}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"
                        />
                      </svg>
                      {getEventCount(scenario)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Results count */}
      {searchTerm && filteredScenarios.length > 0 && (
        <p style={{
          marginTop: '1rem',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
        }}>
          Showing {filteredScenarios.length} of {parsedData.scenarios.length} scenarios
        </p>
      )}
    </div>
  );
};

export default ScenarioList;
