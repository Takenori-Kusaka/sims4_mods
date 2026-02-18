/**
 * Extract mood_type raw values from SimData by reading XML representation
 */
import { Package, SimDataResource } from "@s4tk/models";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modsDir = "C:\\Users\\kokor\\Documents\\Electronic Arts\\The Sims 4\\Mods";
const files = fs.readdirSync(modsDir).filter(f => f.endsWith(".package") && f.startsWith("LittleMsSam"));

let out = "";

for (const f of files) {
  try {
    const buf = fs.readFileSync(path.join(modsDir, f));
    const pkg = Package.from(buf, { recoveryMode: true });

    for (const entry of pkg.entries) {
      if (entry.key.type !== 0x545AC67A) continue;
      try {
        const r = entry.value;
        if (!(r instanceof SimDataResource)) continue;
        if (r.schema?.name !== "Buff") continue;
        // Convert to XML to see the raw values
        const xmlContent = r.toXmlDocument().toXml();
        const moodMatch = xmlContent.match(/<T name="mood_type">([^<]+)<\/T>/);
        if (moodMatch) {
          const moodVal = moodMatch[1];
          const nameMatch = xmlContent.match(/<I name="([^"]+)"/);
          const buffName = nameMatch?.[1] || "?";
          out += `${buffName}: mood_type=${moodVal} (${f})\n`;
        }
      } catch (e) {}
    }
  } catch (e) {}
}

fs.writeFileSync(path.join(__dirname, "mood-ids.txt"), out);
console.error(out || "No results found");
