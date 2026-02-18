/**
 * .packageファイルの中身を検証するスクリプト
 * 使用法: npx ts-node inspect-package.ts
 */
import { Package, StringTableResource, XmlResource, RawResource } from "@s4tk/models";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PACKAGE_PATH = path.join(__dirname, "dist", "KokorCareerAutoTasks.package");

if (!fs.existsSync(PACKAGE_PATH)) {
  console.error("Package file not found:", PACKAGE_PATH);
  process.exit(1);
}

const RESOURCE_TYPES: Record<number, string> = {
  0xCB5FDDC7: "Tuning (Trait)",
  0x6017E896: "Tuning (Buff)",
  0xE882D22F: "Tuning (Interaction)",
  0x03B33006: "Tuning (Generic)",
  0x545AC67A: "SimData",
  0x220557DA: "StringTable (STBL)",
};

const buffer = fs.readFileSync(PACKAGE_PATH);
const pkg = Package.from(buffer, { recoveryMode: true });

console.log("=== Package Contents ===");
console.log("File:", PACKAGE_PATH);
console.log("Total entries:", pkg.size);
console.log("");

pkg.entries.forEach((entry, index) => {
  const key = entry.key;
  const typeHex = key.type.toString(16).toUpperCase().padStart(8, "0");
  const groupHex = key.group.toString(16).toUpperCase().padStart(8, "0");
  const instanceHex = key.instance.toString(16).toUpperCase().padStart(16, "0");
  const typeName = RESOURCE_TYPES[key.type] || `Unknown (0x${typeHex})`;

  console.log(`--- Entry ${index + 1}: ${typeName} ---`);
  console.log(`  TGI: ${typeHex}-${groupHex}-${instanceHex}`);

  try {
    const resource = entry.value;

    // Tuning XML
    if (key.type === 0xCB5FDDC7 || key.type === 0x6017E896 ||
        key.type === 0xE882D22F || key.type === 0x03B33006) {
      if (resource instanceof XmlResource) {
        const content = resource.content;
        const nameMatch = content.match(/\bn="([^"]+)"/);
        const classMatch = content.match(/\bc="([^"]+)"/);
        const sMatch = content.match(/\bs="([^"]+)"/);
        console.log(`  Class: ${classMatch?.[1] || "?"}`);
        console.log(`  Name:  ${nameMatch?.[1] || "?"}`);
        console.log(`  s=:    ${sMatch?.[1] || "?"}`);

        // Check critical fields
        const hasDisplayName = content.includes('n="display_name"');
        const hasTraitName = content.includes('n="trait_name"');
        const hasTraitPersonality = content.includes("TraitPersonality");
        const hasPersonality = content.includes(">Personality<");
        console.log(`  display_name field: ${hasDisplayName ? "YES" : "NO"}`);
        if (hasTraitName) console.log(`  !! trait_name field found (WRONG): YES`);
        if (classMatch?.[1] === "Trait") {
          console.log(`  TraitPersonality tag: ${hasTraitPersonality ? "YES" : "NO"}`);
          if (hasPersonality && !hasTraitPersonality) console.log(`  !! "Personality" tag (WRONG): YES`);
        }
      }
    }

    // SimData
    if (key.type === 0x545AC67A) {
      const buf = resource instanceof RawResource ? resource.buffer : null;
      console.log(`  Size: ${buf ? buf.byteLength : "?"} bytes`);
      console.log(`  Group: 0x${groupHex} ${key.group === 0x005FDD0C ? "(Trait)" : key.group === 0x0017E8F6 ? "(Buff)" : "(Unknown)"}`);
    }

    // StringTable
    if (key.type === 0x220557DA) {
      if (resource instanceof StringTableResource) {
        console.log(`  Entries: ${resource.size}`);
        resource.entries.forEach((stblEntry) => {
          const keyHex = "0x" + stblEntry.key.toString(16).toUpperCase().padStart(8, "0");
          console.log(`    ${keyHex}: "${stblEntry.value}"`);
        });
      }
    }
  } catch (e: any) {
    console.log(`  Error reading: ${e.message}`);
  }
  console.log("");
});
