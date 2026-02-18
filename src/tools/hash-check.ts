import { fnv32, fnv64 } from "@s4tk/hashing";
import * as fs from "fs";
import { fileURLToPath } from "url";
import * as path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const traits = [
  "Kokor_Trait_CareerAutoTasks",
  "Kokor_Trait_EducationAutoTasks",
];

const others = [
  "Kokor_Buff_CareerFocused",
  "Kokor_Buff_EducationFocused",
];

let out = "=== Trait (FNV32) ===\n";
for (const name of traits) {
  const h = fnv32(name);
  out += `${name}\n  s="${h}" (0x${(h >>> 0).toString(16).toUpperCase()})\n\n`;
}

out += "=== Buff/Other (FNV64) ===\n";
for (const name of others) {
  const h = fnv64(name);
  out += `${name}\n  s="${h.toString()}" (0x${h.toString(16).toUpperCase()})\n\n`;
}

fs.writeFileSync(path.join(__dirname, "hash-check.txt"), out);
console.error("DONE");
