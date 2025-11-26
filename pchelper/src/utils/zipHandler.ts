
import JSZip from 'jszip';

export interface ScenarioFile {
  id: string;
  name: string;
  type: 'dumb' | 'smart';
  content: any; // Will be parsed JSON
}

export interface ImageData {
  fileName: string;
  dataUrl: string; // Base64 encoded image or raw data
  type: 'png' | 'raw';
}

export interface ParsedBackup {
  scenarios: ScenarioFile[];
  images: ImageData[];
}

export async function parseBackupZip(file: File): Promise<ParsedBackup> {
  const zip = await JSZip.loadAsync(file);
  const scenarios: ScenarioFile[] = [];
  const images: ImageData[] = [];

  for (const zipEntry of Object.values(zip.files)) {
    if (zipEntry.dir) continue;

    const fileName = zipEntry.name;

    // Check for scenario JSON files
    // Smart Scenario: "ID/ID.json"
    // We use a regex that checks if it starts with a number, follows with a slash, and then the same number.json
    const smartScenarioMatch = fileName.match(/^(\d+)\/(\1)\.json$/);
    
    // Dumb Scenario: "dumb-ID/ID.json"
    const dumbScenarioMatch = fileName.match(/^dumb-(\d+)\/(\1)\.json$/);

    if (smartScenarioMatch) {
      const id = smartScenarioMatch[1];
      const content = JSON.parse(await zipEntry.async('text'));
      scenarios.push({ id, name: content.scenario.scenario.name, type: 'smart', content });
    } else if (dumbScenarioMatch) {
      const id = dumbScenarioMatch[1];
      const content = JSON.parse(await zipEntry.async('text'));
      scenarios.push({ id, name: content.dumbScenario.scenario.name, type: 'dumb', content });
    }
    // Check for image files (PNG)
    else if (fileName.endsWith('.png')) {
      const dataUrl = await zipEntry.async('base64');
      images.push({ fileName: fileName, dataUrl: `data:image/png;base64,${dataUrl}`, type: 'png' });
    }
    // Check for legacy raw condition files
    else if (fileName.includes('/Condition_')) {
      const rawData = await zipEntry.async('base64');
      images.push({ fileName: fileName, dataUrl: rawData, type: 'raw' });
    }
  }

  return { scenarios, images };
}
