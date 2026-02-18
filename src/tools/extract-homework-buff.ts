/**
 * Extract full buff XML from LittleMsSam_BetterAutonomousHomework.package
 * Focus on affordance_modifier structure
 */
import { Package, XmlResource, SimDataResource } from "@s4tk/models";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modsDir = "C:\\Users\\kokor\\Documents\\Electronic Arts\\The Sims 4\\Mods";
const targetFile = "LittleMsSam_BetterAutonomousHomework.package";

let out = "";

try {
  const buf = fs.readFileSync(path.join(modsDir, targetFile));
  const pkg = Package.from(buf, { recoveryMode: true });

  out += `=== ${targetFile} (${pkg.entries.length} entries) ===\n\n`;

  for (const entry of pkg.entries) {
    const typeHex = "0x" + entry.key.type.toString(16).toUpperCase().padStart(8, "0");
    const groupHex = "0x" + entry.key.group.toString(16).toUpperCase().padStart(8, "0");
    out += `--- Entry: Type=${typeHex} Group=${groupHex} Instance=${entry.key.instance} ---\n`;

    try {
      const r = entry.value;
      if (r instanceof XmlResource) {
        out += `[XML Tuning]\n${r.content}\n\n`;
      } else if (r instanceof SimDataResource) {
        const xmlContent = r.toXmlDocument().toXml();
        out += `[SimData]\n${xmlContent}\n\n`;
      } else {
        out += `[Binary: ${(r as any).buffer?.length || "?"} bytes]\n\n`;
      }
    } catch (e: any) {
      out += `[Error reading: ${e.message}]\n\n`;
    }
  }
} catch (e: any) {
  out += `Error: ${e.message}\n`;
}

fs.writeFileSync(path.join(__dirname, "extract-homework-buff-results.txt"), out);
console.error("Done");
