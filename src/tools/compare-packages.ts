import { Package, XmlResource, SimDataResource } from "@s4tk/models";
import { fnv32, fnv64 } from "@s4tk/hashing";
import * as fs from "fs";
import { fileURLToPath } from "url";
import * as path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let out = "";
function log(s: string) { out += s + "\n"; }

const name = "Kokor_Trait_CareerAutoTasks";
const hash32 = fnv32(name);
const hash64 = fnv64(name);
log("=== FNV Hash Verification ===");
log("Name: " + name);
log("FNV32: " + hash32 + " (0x" + (hash32 >>> 0).toString(16).toUpperCase() + ")");
log("FNV64: " + hash64.toString() + " (0x" + hash64.toString(16).toUpperCase() + ")");
log("s attribute: 2413475841 (0x" + (2413475841 >>> 0).toString(16).toUpperCase() + ")");
log("");

const modsDir = "C:\\Users\\kokor\\Documents\\Electronic Arts\\The Sims 4\\Mods";

// Our package
const ourBuf = fs.readFileSync(path.join(__dirname, "dist", "KokorCareerAutoTasks.package"));
const ourPkg = Package.from(ourBuf, { recoveryMode: true });
log("=== Our Package (" + ourPkg.size + " entries) ===");
for (const entry of ourPkg.entries) {
  const t = "0x" + entry.key.type.toString(16).toUpperCase().padStart(8, "0");
  const g = "0x" + entry.key.group.toString(16).toUpperCase().padStart(8, "0");
  const i = "0x" + entry.key.instance.toString(16).toUpperCase().padStart(16, "0");
  try {
    const r = entry.value;
    if (r instanceof XmlResource && entry.key.type === 0xCB5FDDC7) {
      log("Trait Tuning TGI: " + t + "-" + g + "-" + i);
      log("XML:");
      log(r.content.substring(0, 600));
      log("");
    }
    if (r instanceof SimDataResource && r.schema?.name === "Trait") {
      log("Trait SimData TGI: " + t + "-" + g + "-" + i);
      log("Schema hash=0x" + (r.schema?.hash?.toString(16).toUpperCase().padStart(8, "0")));
      log("Columns: " + r.schema?.columns?.length);
      if (r.schema?.columns) {
        for (const col of r.schema.columns) {
          log("  " + col.name + ": " + col.type);
        }
      }
      log("");
    }
  } catch (e: any) {
    log("Error: " + e.message);
  }
}

// LittleMsSam
const lmsBuf = fs.readFileSync(path.join(modsDir, "LittleMsSam_AutoEmployee.package"));
const lmsPkg = Package.from(lmsBuf, { recoveryMode: true });
log("=== LittleMsSam First Trait ===");
for (const entry of lmsPkg.entries) {
  if (entry.key.type === 0xCB5FDDC7) {
    const t = "0x" + entry.key.type.toString(16).toUpperCase().padStart(8, "0");
    const g = "0x" + entry.key.group.toString(16).toUpperCase().padStart(8, "0");
    const i = "0x" + entry.key.instance.toString(16).toUpperCase().padStart(16, "0");
    try {
      const r = entry.value;
      if (r instanceof XmlResource) {
        log("Trait Tuning TGI: " + t + "-" + g + "-" + i);
        log("XML:");
        log(r.content.substring(0, 600));
      }
    } catch (e) {}
    break;
  }
}
log("");
for (const entry of lmsPkg.entries) {
  if (entry.key.type === 0x545AC67A) {
    try {
      const r = entry.value;
      if (r instanceof SimDataResource && r.schema?.name === "Trait") {
        const i2 = "0x" + entry.key.instance.toString(16).toUpperCase().padStart(16, "0");
        log("Trait SimData Instance: " + i2);
        log("Schema hash=0x" + (r.schema?.hash?.toString(16).toUpperCase().padStart(8, "0")));
        log("Columns: " + r.schema?.columns?.length);
        if (r.schema?.columns) {
          for (const col of r.schema.columns) {
            log("  " + col.name + ": " + col.type);
          }
        }
        break;
      }
    } catch (e) {}
  }
}

fs.writeFileSync(path.join(__dirname, "compare-output.txt"), out);
console.error("DONE: wrote compare-output.txt");
