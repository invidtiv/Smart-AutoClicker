const fs = require('fs');
const JSZip = require('jszip');
const path = require('path');

async function analyzeBackup(filePath) {
  try {
    const data = fs.readFileSync(filePath);
    const zip = await JSZip.loadAsync(data);

    console.log(`Analyzing: ${filePath}`);

    for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
      if (zipEntry.dir) continue;
      
      // Check for scenario JSON files
      // Matches "123/123.json" (Smart) or "dumb-123/123.json" (Dumb)
      // We'll just look for ANY json file to be safe and inspect it.
      if (zipEntry.name.endsWith('.json')) {
        console.log(`\n--- Found JSON: ${zipEntry.name} ---`);
        const contentStr = await zipEntry.async('text');
        try {
            const content = JSON.parse(contentStr);
            
            // Check if it's a smart scenario
            if (content.scenario && content.scenario.events) {
                console.log("Type: Smart Scenario");
                content.scenario.events.forEach((evtWrapper, evtIdx) => {
                    // Events might be wrapped in an object like { event: {...}, conditions: [...], actions: [...] }
                    // The structure in DATA_STRUCTURES.md was: events: [ { event:..., conditions:..., actions:... } ]
                    
                    const conditions = evtWrapper.conditions || [];
                    if (conditions.length > 0) {
                        console.log(`  Event #${evtIdx} (${evtWrapper.event.name}): ${conditions.length} conditions`);
                        conditions.forEach((cond, condIdx) => {
                            if (cond.type === 'ON_IMAGE_DETECTED' || cond.type === undefined) { // Sometimes type is omitted in older versions?
                                console.log(`    Condition #${condIdx} (Name: ${cond.name}, Type: ${cond.type})`);
                                console.log(`      Path: ${cond.path}`);
                                console.log(`      Area:`, cond.area); // This is what we want to check
                                
                                // If area is missing, check other fields that might contain it
                                if (!cond.area) {
                                    console.log("      [!] 'area' is MISSING. Dumping full condition object:");
                                    console.log(JSON.stringify(cond, null, 2));
                                }
                            }
                        });
                    }

                    const actions = evtWrapper.actions || [];
                    if (actions.length > 0) {
                        console.log(`  Event #${evtIdx} actions: ${actions.length}`);
                        // Dump the first action to verify structure
                        if (actions.length > 0) {
                             console.log("    [DEBUG] First Action Structure:");
                             console.log(JSON.stringify(actions[0], null, 2));
                        }
                    }
                });
            } else if (content.dumbScenario) {
                console.log("Type: Dumb Scenario");
            } else {
                console.log("Unknown JSON structure");
            }

        } catch (e) {
            console.error(`Failed to parse JSON: ${e.message}`);
        }
      }
    }
  } catch (err) {
    console.error('Error reading file:', err);
  }
}

// Run the analysis
// Adjust path to where the zip file is relative to pchelper folder (where we run node)
// pchelper is at root/pchelper. documentation is at root/documentation.
// So path is ../documentation/SmartAutoClicker-BackupGF_tigs_wreset_8.zip
const backupPath = path.join(__dirname, '../documentation/SmartAutoClicker-BackupGF_tigs_wreset_8.zip');
analyzeBackup(backupPath);
