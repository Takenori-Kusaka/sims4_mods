import { fnv64 } from "@s4tk/hashing";
import * as fs from "fs";
import { fileURLToPath } from "url";
import * as path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const names = [
  "Kokor_Snippet_CareerAutoTasks",
  "Kokor_Snippet_EducationAutoTasks",
  "Kokor_Buff_CareerFocused",
  "Kokor_Buff_EducationFocused",
];

let out = "";
for (const name of names) {
  const hash = fnv64(name);
  out += `${name}: FNV64 = ${hash.toString()}n (0x${hash.toString(16).toUpperCase()})\n`;
}

fs.writeFileSync(path.join(__dirname, "snippet-hashes.txt"), out);
console.error(out);
