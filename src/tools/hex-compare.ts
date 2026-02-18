/**
 * DBPFバイナリヘッダーとインデックスの詳細比較
 * 既知の動作するmod（LittleMsSam）と自分のパッケージを比較
 */
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function hexDump(buf: Buffer, offset: number, length: number): string {
  const slice = buf.slice(offset, offset + length);
  const hex = slice.toString("hex").match(/.{1,2}/g)?.join(" ") || "";
  return hex;
}

function readUInt32LE(buf: Buffer, offset: number): number {
  return buf.readUInt32LE(offset);
}

function analyzeDBPF(filePath: string, label: string) {
  if (!fs.existsSync(filePath)) {
    console.log(`[${label}] NOT FOUND: ${filePath}`);
    return;
  }
  const buf = fs.readFileSync(filePath);
  console.log(`\n${"=".repeat(60)}`);
  console.log(`[${label}] ${path.basename(filePath)} (${buf.length} bytes)`);
  console.log(`${"=".repeat(60)}`);

  // DBPF Header (96 bytes)
  console.log(`Magic:           ${buf.slice(0, 4).toString("ascii")}`);
  console.log(`Major Version:   ${readUInt32LE(buf, 4)}`);
  console.log(`Minor Version:   ${readUInt32LE(buf, 8)}`);
  console.log(`Unknown1:        0x${readUInt32LE(buf, 12).toString(16)}`);
  console.log(`Unknown2:        0x${readUInt32LE(buf, 16).toString(16)}`);
  console.log(`Unknown3:        0x${readUInt32LE(buf, 20).toString(16)}`);
  console.log(`Date Created:    ${readUInt32LE(buf, 24)}`);
  console.log(`Date Modified:   ${readUInt32LE(buf, 28)}`);
  console.log(`Index Type:      ${readUInt32LE(buf, 32)}`);
  console.log(`Index Count:     ${readUInt32LE(buf, 36)}`);
  console.log(`Index Offset:    0x${readUInt32LE(buf, 40).toString(16)} (${readUInt32LE(buf, 40)})`);
  console.log(`Index Size:      ${readUInt32LE(buf, 44)}`);
  console.log(`Hole Count:      ${readUInt32LE(buf, 48)}`);
  console.log(`Hole Offset:     ${readUInt32LE(buf, 52)}`);
  console.log(`Hole Size:       ${readUInt32LE(buf, 56)}`);
  console.log(`Index Minor:     ${readUInt32LE(buf, 60)}`);

  // Hex dump of first 96 bytes (header)
  console.log(`\nHeader hex (0-95):`);
  for (let i = 0; i < 96; i += 16) {
    const end = Math.min(i + 16, 96);
    console.log(`  ${i.toString(16).padStart(4, "0")}: ${hexDump(buf, i, end - i)}`);
  }

  // Index entries
  const indexOffset = readUInt32LE(buf, 40);
  const indexCount = readUInt32LE(buf, 36);
  console.log(`\nIndex (first 3 entries):`);

  // Read index flags
  let pos = indexOffset;
  if (pos < buf.length) {
    const flags = readUInt32LE(buf, pos);
    console.log(`  Index flags: 0x${flags.toString(16).padStart(8, "0")}`);
    pos += 4;

    // Parse flags to determine which fields are constant
    const typeConst = (flags & 0x01) !== 0;
    const groupConst = (flags & 0x02) !== 0;
    const instanceHiConst = (flags & 0x04) !== 0;

    let constType = 0, constGroup = 0, constInstanceHi = 0;
    if (typeConst) { constType = readUInt32LE(buf, pos); pos += 4; console.log(`  Const Type: 0x${constType.toString(16).padStart(8, "0")}`); }
    if (groupConst) { constGroup = readUInt32LE(buf, pos); pos += 4; console.log(`  Const Group: 0x${constGroup.toString(16).padStart(8, "0")}`); }
    if (instanceHiConst) { constInstanceHi = readUInt32LE(buf, pos); pos += 4; console.log(`  Const InstanceHi: 0x${constInstanceHi.toString(16).padStart(8, "0")}`); }

    const entriesToShow = Math.min(indexCount, 5);
    for (let i = 0; i < entriesToShow; i++) {
      const entryType = typeConst ? constType : readUInt32LE(buf, pos);
      if (!typeConst) pos += 4;
      const entryGroup = groupConst ? constGroup : readUInt32LE(buf, pos);
      if (!groupConst) pos += 4;

      let instanceHi = instanceHiConst ? constInstanceHi : readUInt32LE(buf, pos);
      if (!instanceHiConst) pos += 4;
      const instanceLo = readUInt32LE(buf, pos); pos += 4;

      const offset = readUInt32LE(buf, pos); pos += 4;
      const fileSize = readUInt32LE(buf, pos); pos += 4;
      const memSize = readUInt32LE(buf, pos); pos += 4;
      const compressed = readUInt32LE(buf, pos); pos += 2; // uint16

      // Actually compressed is 2 bytes, let me re-read
      // The entry format after TGI is: offset(4), fileSize(4)|compressedFlag(4), memSize(4), compressed(2)
      // Let me just show hex of the entry area
      console.log(`  Entry ${i}: Type=0x${entryType.toString(16).padStart(8, "0")} Group=0x${entryGroup.toString(16).padStart(8, "0")} Instance=0x${instanceHi.toString(16).padStart(8, "0")}${instanceLo.toString(16).padStart(8, "0")}`);
    }
  }
}

// Our S4TK build
analyzeDBPF(
  path.join(__dirname, "dist", "KokorCareerAutoTasks.package"),
  "S4TK Build"
);

// Sims 4 Studio
analyzeDBPF(
  path.join(__dirname, "..", "..", "docs", "reference", "empty.package"),
  "Sims4Studio"
);

// Known working mod for comparison
const modsDir = "C:\\Users\\kokor\\Documents\\Electronic Arts\\The Sims 4\\Mods";
const workingMod = path.join(modsDir, "NoCensor.package");
analyzeDBPF(workingMod, "NoCensor (working)");

// Another known working mod
const littleMsSam = path.join(modsDir, "LittleMsSam_AutoRepair.package");
analyzeDBPF(littleMsSam, "LittleMsSam (working)");
