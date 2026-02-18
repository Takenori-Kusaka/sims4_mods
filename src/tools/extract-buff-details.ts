/**
 * 動作しているMODからBuff XMLの詳細構造を抽出
 * autonomy_modifier, _static_commodities, game_effect_modifier の使い方を確認
 */
import { Package, XmlResource, SimDataResource } from "@s4tk/models";
import * as fs from "fs";
import { fileURLToPath } from "url";
import * as path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const modsDir = "C:\\Users\\kokor\\Documents\\Electronic Arts\\The Sims 4\\Mods";

let out = "";
function log(s: string) { out += s + "\n"; }

// Search all mods for Buff tuning that contains autonomy_modifier or static_commodit
const files = fs.readdirSync(modsDir).filter(f => f.endsWith(".package"));

for (const f of files) {
  try {
    const buf = fs.readFileSync(path.join(modsDir, f));
    const pkg = Package.from(buf, { recoveryMode: true });

    for (const entry of pkg.entries) {
      if (entry.key.type !== 0x6017E896) continue; // Buff tuning only

      try {
        const r = entry.value;
        if (!(r instanceof XmlResource)) continue;
        const content = r.content;

        if (content.includes("autonomy_modifier") || content.includes("static_commodit") || content.includes("game_effect_modifier")) {
          log(`=== ${f} ===`);
          log(`Buff XML (full):`);
          log(content.substring(0, 2000));
          if (content.length > 2000) log("... (truncated)");
          log("");
        }
      } catch (e) {}
    }
  } catch (e) {}
}

// Also look for StaticCommodity tuning type (0x339BC5BD is Statistic)
log("=== Looking for StaticCommodity/Statistic tuning ===");
for (const f of files.slice(0, 10)) {
  try {
    const buf = fs.readFileSync(path.join(modsDir, f));
    const pkg = Package.from(buf, { recoveryMode: true });

    for (const entry of pkg.entries) {
      if (entry.key.type !== 0x339BC5BD) continue; // Statistic type

      try {
        const r = entry.value;
        if (!(r instanceof XmlResource)) continue;
        const content = r.content;
        if (content.includes("StaticCommodity")) {
          log(`--- ${f} - StaticCommodity ---`);
          log(content.substring(0, 1500));
          log("");
        }
      } catch (e) {}
    }
  } catch (e) {}
}

// Also look at LittleMsSam AutoEmployee trait to see how buffs are referenced
log("=== LittleMsSam Trait -> Buff reference ===");
try {
  const buf = fs.readFileSync(path.join(modsDir, "LittleMsSam_AutoEmployee.package"));
  const pkg = Package.from(buf, { recoveryMode: true });

  for (const entry of pkg.entries) {
    if (entry.key.type !== 0xCB5FDDC7) continue;
    try {
      const r = entry.value;
      if (!(r instanceof XmlResource)) continue;
      if (r.content.includes("buffs")) {
        log(r.content.substring(0, 1000));
        log("");
        break;
      }
    } catch (e) {}
  }
} catch (e) {}

fs.writeFileSync(path.join(__dirname, "buff-details.txt"), out);
console.error("DONE: wrote buff-details.txt (" + out.length + " chars)");
