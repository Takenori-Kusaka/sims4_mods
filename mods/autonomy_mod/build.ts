/**
 * Event Autonomy - TypeScript Build Script
 * @s4tk packages to build the Mod
 */

import * as fs from "fs";
import * as path from "path";
import { Package, XmlResource, StringTableResource } from "@s4tk/models";
import { fnv64 } from "@s4tk/hashing";

// Build configuration
const CONFIG = {
  modName: "KokorEventAutonomy",
  creatorName: "Kokor",
  sourceDir: "./src",
  distDir: "./dist",
  deployDir: "C:\\Users\\kokor\\Documents\\Electronic Arts\\The Sims 4\\Mods",
};

/**
 * Tuning type Resource Type IDs
 * Values from @s4tk/models TuningResourceType enum
 */
const TUNING_TYPE_IDS: Record<string, number> = {
  "trait": 0xCB5FDDC7,
  "buff": 0x6017E896,
  "interaction": 0xE882D22F,
  "snippet": 0x7DF2169C,
  "loot": 0x544E5B52,
  "tuning": 0x03B33006,
};

// Command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const shouldDeploy = args.includes("--deploy");

/**
 * Generate Instance ID (set high bit to 1)
 */
function generateInstanceId(name: string): bigint {
  const hash = fnv64(name);
  return hash | BigInt("0x8000000000000000");
}

/**
 * Recursively get files with a specific extension
 */
function getFilesRecursively(dir: string, ext: string): string[] {
  const files: string[] = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getFilesRecursively(fullPath, ext));
    } else if (entry.name.endsWith(ext)) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Extract tuning class (c attribute) from XML content
 */
function extractTuningClass(xmlContent: string): string | null {
  const match = xmlContent.match(/<I\s+c="([^"]+)"/);
  return match ? match[1].toLowerCase() : null;
}

/**
 * Extract Instance ID (s attribute) from XML content
 */
function extractInstanceFromXml(xmlContent: string): bigint | null {
  const match = xmlContent.match(/\bs="(\d+)"/);
  if (match) {
    return BigInt(match[1]);
  }
  return null;
}

/**
 * Load tuning XML files into the Package
 */
function loadTuningFiles(pkg: Package, tuningDir: string): void {
  const xmlFiles = getFilesRecursively(tuningDir, ".xml");

  for (const xmlPath of xmlFiles) {
    const content = fs.readFileSync(xmlPath, "utf-8");
    const fileName = path.basename(xmlPath, ".xml");

    // Skip SimData files (handled separately by S4TK)
    if (fileName.endsWith(".SimData")) {
      continue;
    }

    const tuningClass = extractTuningClass(content);
    if (!tuningClass) {
      console.warn(`  [WARN] Could not detect tuning class for: ${fileName}`);
      continue;
    }

    const typeId = TUNING_TYPE_IDS[tuningClass] || TUNING_TYPE_IDS["tuning"];

    let instanceId = extractInstanceFromXml(content);
    if (!instanceId) {
      instanceId = generateInstanceId(`${CONFIG.creatorName}:${fileName}`);
    }
    instanceId = instanceId | BigInt("0x8000000000000000");

    console.log(`  [${tuningClass.toUpperCase()}] ${fileName}`);
    console.log(`      Type: 0x${typeId.toString(16)} | Instance: 0x${instanceId.toString(16)}`);

    const resource = new XmlResource(content);
    pkg.add(
      {
        type: typeId,
        group: 0x00000000,
        instance: instanceId,
      },
      resource
    );
  }
}

/**
 * Load StringTable files into the Package
 */
function loadStringTables(pkg: Package, stringsDir: string): void {
  const stblFiles = getFilesRecursively(stringsDir, ".stbl.json");

  for (const stblPath of stblFiles) {
    const content = fs.readFileSync(stblPath, "utf-8");
    const data = JSON.parse(content);
    const fileName = path.basename(stblPath, ".stbl.json");

    let localeCode = 0x00; // English
    if (fileName.includes("_ja") || data.locale === "ja-JP") {
      localeCode = 0x11; // Japanese
    }

    const instanceId = generateInstanceId(`${CONFIG.creatorName}:${CONFIG.modName}:strings:${localeCode}`);

    console.log(`  [STBL] ${fileName} (locale: 0x${localeCode.toString(16)}) -> 0x${instanceId.toString(16)}`);

    const stbl = new StringTableResource();
    for (const [key, value] of Object.entries(data.entries)) {
      const keyNum = typeof key === "string"
        ? parseInt(key, 16)
        : key as number;
      stbl.add(keyNum, value as string);
    }

    pkg.add(
      {
        type: 0x220557DA, // StringTable
        group: 0x80000000,
        instance: instanceId,
      },
      stbl
    );
  }
}

/**
 * Main build function
 */
async function build(): Promise<void> {
  console.log("=".repeat(60));
  console.log(`Building: ${CONFIG.modName}`);
  console.log(`Mode: ${isDryRun ? "Dry Run" : shouldDeploy ? "Deploy" : "Build"}`);
  console.log("=".repeat(60));

  const pkg = new Package();

  // Load tuning files
  const tuningDir = path.join(CONFIG.sourceDir, "tuning");
  console.log("\nLoading Tuning files...");
  loadTuningFiles(pkg, tuningDir);

  // Load StringTable files
  const stringsDir = path.join(CONFIG.sourceDir, "strings");
  console.log("\nLoading StringTable files...");
  loadStringTables(pkg, stringsDir);

  // Build summary
  console.log("\n" + "-".repeat(60));
  console.log(`Total resources: ${pkg.size}`);
  console.log("-".repeat(60));

  if (isDryRun) {
    console.log("\n[Dry Run] No files written.");
    return;
  }

  // Create dist directory
  if (!fs.existsSync(CONFIG.distDir)) {
    fs.mkdirSync(CONFIG.distDir, { recursive: true });
  }

  // Write package
  const outputPath = path.join(CONFIG.distDir, `${CONFIG.modName}.package`);
  const buffer = pkg.getBuffer();
  fs.writeFileSync(outputPath, buffer);
  console.log(`\nWritten: ${outputPath}`);

  // Deploy
  if (shouldDeploy) {
    const deployPath = path.join(CONFIG.deployDir, `${CONFIG.modName}.package`);
    fs.copyFileSync(outputPath, deployPath);
    console.log(`Deployed: ${deployPath}`);
  }

  console.log("\nBuild complete!");
}

// Execute
build().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
