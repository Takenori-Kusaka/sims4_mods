/**
 * Extract XmlInjector snippet tuning from installed mods
 * Search ALL tuning types for xml_injector references
 */
import { Package, XmlResource } from "@s4tk/models";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modsDir = "C:\\Users\\kokor\\Documents\\Electronic Arts\\The Sims 4\\Mods";
const files = fs.readdirSync(modsDir).filter(f => f.endsWith(".package"));

let out = "";
let snippetCount = 0;

for (const f of files) {
  try {
    const buf = fs.readFileSync(path.join(modsDir, f));
    const pkg = Package.from(buf, { recoveryMode: true });

    for (const entry of pkg.entries) {
      try {
        const r = entry.value;
        if (!(r instanceof XmlResource)) continue;
        const content = r.content;
        if (content.includes("xml_injector") || content.includes("XmlInjector") || content.includes("add_buff")) {
          snippetCount++;
          const typeHex = "0x" + entry.key.type.toString(16).toUpperCase().padStart(8, "0");
          out += `\n========== ${f} (Type: ${typeHex}, Instance: ${entry.key.instance}) ==========\n`;
          out += content.substring(0, 4000) + "\n";
          if (content.length > 4000) out += `... (truncated, total ${content.length} chars)\n`;
        }
      } catch (e) {}
    }
  } catch (e) {}
}

out = `Found ${snippetCount} XmlInjector/add_buff entries across all types\n` + out;
fs.writeFileSync(path.join(__dirname, "extract-xmlinjector-results.txt"), out);
console.error(`Done. Found ${snippetCount} entries.`);
