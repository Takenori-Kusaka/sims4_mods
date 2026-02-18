/**
 * 動作する既知のMODの中身を検査
 */
import { Package, StringTableResource, XmlResource, RawResource, SimDataResource } from "@s4tk/models";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modsDir = "C:\\Users\\kokor\\Documents\\Electronic Arts\\The Sims 4\\Mods";

function inspectMod(filePath: string) {
  if (!fs.existsSync(filePath)) {
    console.log(`NOT FOUND: ${filePath}`);
    return;
  }

  const buf = fs.readFileSync(filePath);
  const pkg = Package.from(buf, { recoveryMode: true });

  console.log(`\n=== ${path.basename(filePath)} (${buf.length} bytes, ${pkg.size} entries) ===`);

  pkg.entries.forEach((entry, index) => {
    const key = entry.key;
    const typeHex = key.type.toString(16).toUpperCase().padStart(8, "0");
    const groupHex = key.group.toString(16).toUpperCase().padStart(8, "0");
    const instanceHex = key.instance.toString(16).toUpperCase().padStart(16, "0");

    let typeName = `0x${typeHex}`;
    if (key.type === 0x545AC67A) typeName = "SimData";
    else if (key.type === 0x220557DA) typeName = "STBL";
    else if (key.type === 0xCB5FDDC7) typeName = "Tuning:Trait";
    else if (key.type === 0x6017E896) typeName = "Tuning:Buff";
    else if (key.type === 0xE882D22F) typeName = "Tuning:Interaction";
    else if (key.type === 0x03B33006) typeName = "Tuning:Generic";
    else if (key.type === 0x7DF2169C) typeName = "Tuning:Snippet";

    console.log(`  [${index}] ${typeName} ${typeHex}-${groupHex}-${instanceHex}`);

    try {
      const resource = entry.value;
      if (resource instanceof XmlResource) {
        const content = resource.content;
        const nameMatch = content.match(/\bn="([^"]+)"/);
        const classMatch = content.match(/\bc="([^"]+)"/);
        const sMatch = content.match(/\bs="([^"]+)"/);
        if (classMatch) console.log(`       c="${classMatch[1]}" n="${nameMatch?.[1]}" s="${sMatch?.[1]}"`);
        // Show first 200 chars
        console.log(`       XML: ${content.substring(0, 200).replace(/\n/g, " ")}...`);
      }
      if (resource instanceof SimDataResource) {
        console.log(`       SimData: schema="${resource.schema?.name}" hash=0x${resource.schema?.hash?.toString(16).toUpperCase().padStart(8, "0")}`);
      }
    } catch (e: any) {
      console.log(`       Error: ${e.message}`);
    }
  });
}

// Inspect LittleMsSam mod (known working, should contain tuning+simdata)
inspectMod(path.join(modsDir, "LittleMsSam_AutoRepair.package"));

// Also check one with traits if possible
const files = fs.readdirSync(modsDir).filter(f => f.endsWith(".package"));
// Look for a mod that might contain trait tuning
for (const f of files) {
  const fPath = path.join(modsDir, f);
  try {
    const buf = fs.readFileSync(fPath);
    const pkg = Package.from(buf, { recoveryMode: true });
    let hasTrait = false;
    for (const entry of pkg.entries) {
      if (entry.key.type === 0xCB5FDDC7) { // Trait tuning type
        hasTrait = true;
        break;
      }
    }
    if (hasTrait && f !== "KokorCareerAutoTasks.package") {
      console.log(`\n*** FOUND MOD WITH TRAIT TUNING: ${f} ***`);
      inspectMod(fPath);
      break;
    }
  } catch (e) {
    // skip
  }
}
