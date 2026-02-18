/**
 * Package TGI Reader
 * 
 * .package ファイルから TGI (Type, Group, Instance) のみを抽出する。
 * S4TK の Package.from() はリソースを自動解析しようとしてエラーになるため、
 * このユーティリティでバイナリから直接 TGI を読み取る。
 * 
 * DBPF Format Reference:
 * https://simswiki.info/wiki.php?title=Sims_4:DBPF
 */

import * as fs from "fs";

export interface ResourceKey {
  type: number;
  group: number;
  instance: bigint;
}

export interface PackageTGI {
  entries: ResourceKey[];
}

/**
 * .package ファイルから TGI 一覧を読み取る
 * @param filePath パッケージファイルのパス
 * @returns TGI 一覧
 */
export function readPackageTGI(filePath: string): PackageTGI {
  const buffer = fs.readFileSync(filePath);
  return readPackageTGIFromBuffer(buffer);
}

/**
 * バッファから TGI 一覧を読み取る
 * @param buffer パッケージファイルのバッファ
 * @returns TGI 一覧
 */
export function readPackageTGIFromBuffer(buffer: Buffer): PackageTGI {
  // DBPF Header
  const magic = buffer.toString("ascii", 0, 4);
  if (magic !== "DBPF") {
    throw new Error(`Invalid package file: expected DBPF magic, got "${magic}"`);
  }

  // Version (major.minor at offset 4-8)
  const versionMajor = buffer.readUInt32LE(4);
  const versionMinor = buffer.readUInt32LE(8);
  
  // Index Entry Count at offset 36
  const indexEntryCount = buffer.readUInt32LE(36);
  
  // Index Position at offset 64
  const indexPosition = buffer.readUInt32LE(64);
  
  const entries: ResourceKey[] = [];
  
  // Read Index Entries
  // Each entry is 32 bytes: Type(4) + Group(4) + InstanceHigh(4) + InstanceLow(4) + Position(4) + Size(4) + CompressedSize(4) + Flags(2) + CompressionType(2)
  for (let i = 0; i < indexEntryCount; i++) {
    const entryOffset = indexPosition + (i * 32);
    
    const type = buffer.readUInt32LE(entryOffset);
    const group = buffer.readUInt32LE(entryOffset + 4);
    const instanceHigh = buffer.readUInt32LE(entryOffset + 8);
    const instanceLow = buffer.readUInt32LE(entryOffset + 12);
    
    // Combine instance high and low into bigint
    const instance = (BigInt(instanceHigh) << BigInt(32)) | BigInt(instanceLow);
    
    entries.push({ type, group, instance });
  }
  
  return { entries };
}

// CLI用
if (process.argv[1]?.endsWith("package-tgi-reader.ts")) {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: ts-node package-tgi-reader.ts <package-file>");
    process.exit(1);
  }
  
  try {
    const result = readPackageTGI(filePath);
    console.log(`Package: ${filePath}`);
    console.log(`Entries: ${result.entries.length}`);
    for (let i = 0; i < result.entries.length; i++) {
      const e = result.entries[i];
      console.log(`  [${i}] Type=0x${e.type.toString(16).padStart(8, '0')} Group=0x${e.group.toString(16).padStart(8, '0')} Instance=0x${e.instance.toString(16).padStart(16, '0')}`);
    }
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}
