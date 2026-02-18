/**
 * 動作しているMODからSimDataスキーマ（カラム定義）を抽出
 */
import { Package, SimDataResource } from "@s4tk/models";
import * as fs from "fs";
import { fileURLToPath } from "url";
import * as path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const modsDir = "C:\\Users\\kokor\\Documents\\Electronic Arts\\The Sims 4\\Mods";

const modPath = path.join(modsDir, "LittleMsSam_AutoEmployee.package");
const buf = fs.readFileSync(modPath);
const pkg = Package.from(buf, { recoveryMode: true });

console.log("=== Extracting Trait SimData Schema from working mod ===\n");

let traitSchemaFound = false;
let buffSchemaFound = false;

for (const entry of pkg.entries) {
  if (entry.key.type !== 0x545AC67A) continue; // SimData only

  try {
    const resource = entry.value;
    if (!(resource instanceof SimDataResource)) continue;

    const schemaName = resource.schema?.name;
    const schemaHash = resource.schema?.hash;

    if (schemaName === "Trait" && !traitSchemaFound) {
      traitSchemaFound = true;
      console.log(`--- Trait SimData Schema ---`);
      console.log(`  Schema name: ${schemaName}`);
      console.log(`  Schema hash: 0x${schemaHash?.toString(16).toUpperCase().padStart(8, "0")}`);
      console.log(`  Columns:`);

      if (resource.schema?.columns) {
        for (const col of resource.schema.columns) {
          const flagsHex = "0x" + (col.flags?.toString(16).toUpperCase().padStart(8, "0") || "00000000");
          console.log(`    <Column name="${col.name}" type="${col.type}" flags="${flagsHex}" />`);
        }
      }

      // Also dump instance data
      if (resource.instance) {
        console.log(`\n  Instance name: ${resource.instance.name}`);
        console.log(`  Instance row data:`);
        if (resource.instance.row) {
          for (const [key, val] of Object.entries(resource.instance.row)) {
            console.log(`    ${key} = ${JSON.stringify(val)}`);
          }
        }
      }
      console.log("");
    }

    if (schemaName === "Buff" && !buffSchemaFound) {
      buffSchemaFound = true;
      console.log(`--- Buff SimData Schema ---`);
      console.log(`  Schema name: ${schemaName}`);
      console.log(`  Schema hash: 0x${schemaHash?.toString(16).toUpperCase().padStart(8, "0")}`);
      console.log(`  Columns:`);

      if (resource.schema?.columns) {
        for (const col of resource.schema.columns) {
          const flagsHex = "0x" + (col.flags?.toString(16).toUpperCase().padStart(8, "0") || "00000000");
          console.log(`    <Column name="${col.name}" type="${col.type}" flags="${flagsHex}" />`);
        }
      }
      console.log("");
    }
  } catch (e: any) {
    // Skip errors
  }
}

if (!traitSchemaFound) console.log("Trait SimData schema NOT found in this mod");
if (!buffSchemaFound) console.log("Buff SimData schema NOT found in this mod (checking other mods...)");

// Try to find Buff schema from AutoRepair
if (!buffSchemaFound) {
  const arPath = path.join(modsDir, "LittleMsSam_AutoRepair.package");
  const arBuf = fs.readFileSync(arPath);
  const arPkg = Package.from(arBuf, { recoveryMode: true });
  for (const entry of arPkg.entries) {
    if (entry.key.type !== 0x545AC67A) continue;
    try {
      const resource = entry.value;
      if (!(resource instanceof SimDataResource)) continue;
      if (resource.schema?.name === "Buff") {
        console.log(`--- Buff SimData Schema (from AutoRepair) ---`);
        console.log(`  Schema hash: 0x${resource.schema?.hash?.toString(16).toUpperCase().padStart(8, "0")}`);
        console.log(`  Columns:`);
        if (resource.schema?.columns) {
          for (const col of resource.schema.columns) {
            const flagsHex = "0x" + (col.flags?.toString(16).toUpperCase().padStart(8, "0") || "00000000");
            console.log(`    <Column name="${col.name}" type="${col.type}" flags="${flagsHex}" />`);
          }
        }
        break;
      }
    } catch (e) {}
  }
}
