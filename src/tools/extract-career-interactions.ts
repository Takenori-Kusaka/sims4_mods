/**
 * Extract career daily task related interaction IDs from BASE GAME packages
 */
import { Package, XmlResource } from "@s4tk/models";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Search base game data folders
const gameDirs = [
  "C:\\Program Files\\EA\\The Sims 4\\Data\\Simulation\\Gameplay",
  "C:\\Program Files (x86)\\EA\\The Sims 4\\Data\\Simulation\\Gameplay",
  "C:\\Program Files\\EA\\The Sims 4\\Delta\\Simulation\\Gameplay",
];

// Also check EP/GP/SP folders
const basePath = "E:\\SteamLibrary\\steamapps\\common\\The Sims 4";

let allPackages: string[] = [];

// Find all .package files recursively
function findPackages(dir: string): string[] {
  const result: string[] = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        result.push(...findPackages(full));
      } else if (e.name.endsWith(".package")) {
        result.push(full);
      }
    }
  } catch (e) {}
  return result;
}

// Find game packages
if (fs.existsSync(basePath)) {
  allPackages = findPackages(basePath);
  console.error(`Found ${allPackages.length} game .package files`);
} else {
  console.error(`Game not found at ${basePath}`);
  // Try Steam
  const steamPath = "E:\\SteamLibrary\\steamapps\\common\\The Sims 4";
  if (fs.existsSync(steamPath)) {
    allPackages = findPackages(steamPath);
    console.error(`Found ${allPackages.length} game .package files (Steam)`);
  }
}

// Keywords for career daily tasks
const keywords = [
  "termpaper", "term_paper", "presentation", "academic",
  "writearticle", "write_article", "writebook", "write_book",
  "writesong", "write_song", "writenovel", "write_novel",
  "writeessay", "write_essay", "writemusic", "write_music",
  "research_debate", "researchanddebate", "research_and_debate",
  "practicemusic", "practicespeech", "practicelaw", "practice_speech",
  "workout", "work_out", "exercise",
  "homework", "schoolproject", "school_project",
  "attend_class", "attendclass", "goToSchool", "gotoschool",
  "dailytask", "daily_task",
  "career_daily", "careerdaily",
];

let out = "";
const seen = new Set<string>();
let processedCount = 0;

for (const f of allPackages) {
  processedCount++;
  if (processedCount % 10 === 0) {
    console.error(`Processing ${processedCount}/${allPackages.length}...`);
  }
  try {
    const buf = fs.readFileSync(f);
    const pkg = Package.from(buf, { recoveryMode: true });

    for (const entry of pkg.entries) {
      const type = entry.key.type;
      // SuperInteraction, ImmediateSuperInteraction, or general tuning
      if (type !== 0xE882D22F && type !== 0xCB5FDDC7) continue;

      try {
        const r = entry.value;
        if (!(r instanceof XmlResource)) continue;
        const content = r.content;

        const nameMatch = content.match(/\bn="([^"]+)"/);
        if (!nameMatch) continue;
        const name = nameMatch[1];
        const nameLower = name.toLowerCase();

        for (const kw of keywords) {
          if (nameLower.includes(kw)) {
            const key = `${entry.key.instance}:${name}`;
            if (!seen.has(key)) {
              seen.add(key);
              const classMatch = content.match(/\bc="([^"]+)"/);
              const cls = classMatch?.[1] || "?";
              out += `${name} (${cls}) ID=${entry.key.instance} [${path.basename(f)}]\n`;
            }
            break;
          }
        }
      } catch (e) {}
    }
  } catch (e) {}
}

out = `Found ${seen.size} career/education interactions from ${allPackages.length} game packages\n\n` + out;
fs.writeFileSync(path.join(__dirname, "career-interactions.txt"), out);
console.error(`\nDone. Found ${seen.size} entries from ${allPackages.length} packages.`);
