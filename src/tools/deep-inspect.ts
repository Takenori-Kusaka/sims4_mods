/**
 * パッケージの詳細検査 - チューニングXML生データとSimDataバイナリを検証
 */
import { Package, StringTableResource, XmlResource, RawResource, SimDataResource } from "@s4tk/models";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function inspectPackage(pkgPath: string, label: string) {
  if (!fs.existsSync(pkgPath)) {
    console.error(`[${label}] File not found: ${pkgPath}`);
    return;
  }

  const stat = fs.statSync(pkgPath);
  console.log(`\n${"=".repeat(70)}`);
  console.log(`[${label}] ${pkgPath}`);
  console.log(`File size: ${stat.size} bytes`);
  console.log(`${"=".repeat(70)}`);

  const buffer = fs.readFileSync(pkgPath);

  // Check DBPF header
  const header = buffer.slice(0, 4).toString("ascii");
  console.log(`DBPF Header: "${header}" (expected: "DBPF")`);
  if (header !== "DBPF") {
    console.error("!! INVALID PACKAGE FILE - not DBPF format");
    return;
  }

  const pkg = Package.from(buffer, { recoveryMode: true });
  console.log(`Total entries: ${pkg.size}\n`);

  pkg.entries.forEach((entry, index) => {
    const key = entry.key;
    const typeHex = key.type.toString(16).toUpperCase().padStart(8, "0");
    const groupHex = key.group.toString(16).toUpperCase().padStart(8, "0");
    const instanceHex = key.instance.toString(16).toUpperCase().padStart(16, "0");

    // Identify resource type
    let typeName = "Unknown";
    if (key.type === 0x545AC67A) typeName = "SimData";
    else if (key.type === 0x220557DA) typeName = "StringTable";
    else if (key.type === 0xCB5FDDC7) typeName = "Tuning:Trait";
    else if (key.type === 0x6017E896) typeName = "Tuning:Buff";
    else typeName = `Type:0x${typeHex}`;

    console.log(`--- Entry ${index + 1}: ${typeName} ---`);
    console.log(`  Key: ${typeHex}-${groupHex}-${instanceHex}`);

    try {
      const resource = entry.value;

      // Tuning - dump raw XML
      if (key.type !== 0x545AC67A && key.type !== 0x220557DA) {
        if (resource instanceof XmlResource) {
          console.log(`  --- RAW XML START ---`);
          console.log(resource.content);
          console.log(`  --- RAW XML END ---`);
        } else if (resource instanceof RawResource) {
          const text = resource.buffer.toString("utf-8");
          if (text.startsWith("<?xml") || text.startsWith("<I ") || text.startsWith("<M ")) {
            console.log(`  --- RAW XML (from RawResource) START ---`);
            console.log(text);
            console.log(`  --- RAW XML END ---`);
          } else {
            console.log(`  Binary data: ${resource.buffer.byteLength} bytes`);
            console.log(`  First 64 bytes (hex): ${resource.buffer.slice(0, 64).toString("hex")}`);
          }
        }
      }

      // SimData - check format
      if (key.type === 0x545AC67A) {
        if (resource instanceof SimDataResource) {
          console.log(`  SimData instance name: ${resource.instance?.name || "?"}`);
          console.log(`  SimData schema name: ${resource.schema?.name || "?"}`);
          console.log(`  SimData schema hash: 0x${resource.schema?.hash?.toString(16).toUpperCase().padStart(8, "0") || "?"}`);
        } else if (resource instanceof RawResource) {
          const buf = resource.buffer;
          console.log(`  Binary SimData: ${buf.byteLength} bytes`);
          console.log(`  First 32 bytes (hex): ${buf.slice(0, 32).toString("hex")}`);
          // Check SimData header: should start with "DATA"
          const dataHeader = buf.slice(0, 4).toString("ascii");
          console.log(`  SimData header: "${dataHeader}" (expected: "DATA")`);
        }
      }

      // StringTable
      if (key.type === 0x220557DA) {
        if (resource instanceof StringTableResource) {
          console.log(`  Locale hint from instance: 0x${((Number(key.instance >> 56n)) & 0xFF).toString(16).toUpperCase().padStart(2, "0")}`);
          console.log(`  Entries: ${resource.size}`);
          resource.entries.forEach((e) => {
            console.log(`    0x${e.key.toString(16).toUpperCase().padStart(8, "0")}: "${e.value}"`);
          });
        }
      }
    } catch (e: any) {
      console.log(`  ERROR: ${e.message}`);
    }
    console.log("");
  });
}

// Inspect both packages
const s4tkPkg = path.join(__dirname, "dist", "KokorCareerAutoTasks.package");
const s4sPkg = path.join(__dirname, "..", "..", "docs", "reference", "empty.package");

inspectPackage(s4tkPkg, "S4TK Build");
inspectPackage(s4sPkg, "Sims4Studio");
