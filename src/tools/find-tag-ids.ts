/**
 * EAの既存トレイトからTraitGroup tagの数値IDを抽出
 */
import { Package, XmlResource, SimDataResource } from "@s4tk/models";
import * as fs from "fs";
import { fileURLToPath } from "url";
import * as path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read from game files - look for traits with different TraitGroup tags
const modsDir = "C:\\Users\\kokor\\Documents\\Electronic Arts\\The Sims 4\\Mods";
const files = fs.readdirSync(modsDir).filter(f => f.endsWith(".package"));

let out = "";
const seenGroups = new Set<string>();

for (const f of files) {
  try {
    const buf = fs.readFileSync(path.join(modsDir, f));
    const pkg = Package.from(buf, { recoveryMode: true });

    for (const entry of pkg.entries) {
      if (entry.key.type !== 0xCB5FDDC7) continue;
      try {
        const r = entry.value;
        if (!(r instanceof XmlResource)) continue;
        const content = r.content;
        const tagMatch = content.match(/TraitGroup_(\w+)/g);
        if (tagMatch) {
          for (const tag of tagMatch) {
            if (!seenGroups.has(tag)) {
              seenGroups.add(tag);
              const nameMatch = content.match(/\bn="([^"]+)"/);
              out += `${tag} found in ${f} (${nameMatch?.[1] || "?"})\n`;
            }
          }
        }
      } catch (e) {}
    }

    // Also check SimData for tag numeric values
    for (const entry of pkg.entries) {
      if (entry.key.type !== 0x545AC67A) continue;
      try {
        const r = entry.value;
        if (!(r instanceof SimDataResource)) continue;
        if (r.schema?.name !== "Trait") continue;
        // Get the instance data tags
        const inst = r.instance;
        if (inst?.row) {
          const tags = (inst.row as any).tags;
          if (tags && Array.isArray(tags)) {
            const name = inst.name;
            out += `SimData ${name}: tags = [${tags.join(", ")}]\n`;
          }
        }
      } catch (e) {}
    }
  } catch (e) {}
}

fs.writeFileSync(path.join(__dirname, "tag-ids.txt"), out);
console.error("DONE");
