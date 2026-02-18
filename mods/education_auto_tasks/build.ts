/**
 * Education Auto Tasks - TypeScript Build Script
 * @s4tk パッケージを使用してModをビルド
 */

import * as fs from "fs";
import * as path from "path";
import { Package, XmlResource, StringTableResource } from "@s4tk/models";
import { fnv64 } from "@s4tk/hashing";

// ビルド設定
const CONFIG = {
  modName: "KokorEducationAutoTasks",
  creatorName: "Kokor",
  sourceDir: "./src",
  distDir: "./dist",
  deployDir: "C:\\Users\\kokor\\Documents\\Electronic Arts\\The Sims 4\\Mods",
};

/**
 * チューニングタイプごとのResource Type ID
 * 値は @s4tk/models の TuningResourceType enum から取得
 * https://github.com/sims4toolkit/models/blob/main/src/lib/enums/tuning-resources.ts
 */
const TUNING_TYPE_IDS: Record<string, number> = {
  // === Gameplay Tuning (from S4TK TuningResourceType enum) ===
  "trait": 0xCB5FDDC7,        // Trait = 3412057543
  "buff": 0x6017E896,         // Buff = 1612179606
  "interaction": 0xE882D22F,  // Interaction = 3900887599
  "super_interaction": 0xE882D22F,
  "mixer_interaction": 0xE882D22F,
  "social_mixer_interaction": 0xE882D22F,
  "immediate_interaction": 0xE882D22F,
  "picker_interaction": 0xE882D22F,
  "object_interaction": 0xE882D22F,
  "terrain_interaction": 0xE882D22F,
  "phone_interaction": 0xE882D22F,
  
  // === Loot & Actions ===
  "loot": 0x544E5B52,         // Snippet (Loot is a Snippet subtype)
  "loot_actions": 0x544E5B52, // Snippet
  "action": 0x0C772E27,       // Action = 209137191
  
  // === Objects & UI ===
  "object": 0xB61DE6B4,       // Object = 3055412916
  "snippet": 0x7DF2169C,      // Snippet = 2113017500
  "aspiration": 0x28B64675,   // Aspiration = 683034229
  "career": 0x73995C15,       // Career = 1939434475
  "career_level": 0x2C6C9E28, // CareerLevel = 745582072
  "career_track": 0x48D97953, // CareerTrack = 1221024995
  "whim": 0x749EED96,         // Whim = 1956251190
  "mood": 0xBA7F88D8,         // Mood = 3128647864
  "statistic": 0x339BC5BD,    // Statistic = 865846717
  "skill": 0x339BC5BD,        // Skill uses Statistic type
  "commodity": 0x50FD1963,    // Scommodity = 1359443523
  
  // === Situations ===
  "situation": 0xFBBF797B,    // Situation = 4223905515
  "situation_job": 0x9C07855F,// SituationJob = 2617738591
  "situation_goal": 0x598F3A97,// SituationGoal = 1502554343
  
  // === Tests & Conditions ===
  "test_set": 0x7DF2169C,     // Uses Snippet type
  "test_based_score": 0x4F739CEE, // TestBasedScore = 1332976878
  
  // === Fallback (use with caution) ===
  "tuning": 0x03B33006,       // Generic Tuning = 62078431
};

// コマンドライン引数
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const shouldDeploy = args.includes("--deploy");

/**
 * Instance IDを生成（最上位ビットを1に設定）
 */
function generateInstanceId(name: string): bigint {
  const hash = fnv64(name);
  return hash | BigInt("0x8000000000000000");
}

/**
 * ディレクトリ内のファイルを再帰的に取得
 */
function getFilesRecursively(dir: string, ext: string): string[] {
  const files: string[] = [];
  
  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getFilesRecursively(fullPath, ext));
    } else if (entry.name.endsWith(ext)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * XMLからチューニングタイプ（c属性）を抽出
 */
function extractTuningClass(xmlContent: string): string | null {
  // <I c="Trait" ...> or <I c="Buff" ...> などを検出
  const match = xmlContent.match(/<I\s+c="([^"]+)"/);
  return match ? match[1].toLowerCase() : null;
}

/**
 * XMLからInstance ID（s属性）を抽出（もし指定されていれば）
 */
function extractInstanceFromXml(xmlContent: string): bigint | null {
  // <I ... s="12345678901234567890" ...>
  const match = xmlContent.match(/\bs="(\d+)"/);
  if (match) {
    return BigInt(match[1]);
  }
  return null;
}

/**
 * XMLチューニングファイルを読み込んでPackageに追加
 */
function loadTuningFiles(pkg: Package, tuningDir: string): void {
  const xmlFiles = getFilesRecursively(tuningDir, ".xml");
  
  for (const xmlPath of xmlFiles) {
    const content = fs.readFileSync(xmlPath, "utf-8");
    const fileName = path.basename(xmlPath, ".xml");
    
    // SimDataファイルはスキップ（別途処理）
    if (fileName.endsWith(".SimData")) {
      continue;
    }
    
    // XMLからチューニングタイプを抽出
    const tuningClass = extractTuningClass(content);
    if (!tuningClass) {
      console.warn(`  [WARN] Could not detect tuning class for: ${fileName}`);
      continue;
    }
    
    // Resource Type IDを決定
    const typeId = TUNING_TYPE_IDS[tuningClass] || TUNING_TYPE_IDS["tuning"];
    
    // Instance IDを生成またはXMLから取得
    let instanceId = extractInstanceFromXml(content);
    if (!instanceId) {
      instanceId = generateInstanceId(`${CONFIG.creatorName}:${fileName}`);
    }
    // カスタムコンテンツは最上位ビットを1に
    instanceId = instanceId | BigInt("0x8000000000000000");
    
    console.log(`  [${tuningClass.toUpperCase()}] ${fileName}`);
    console.log(`      Type: 0x${typeId.toString(16)} | Instance: 0x${instanceId.toString(16)}`);
    
    const resource = new XmlResource(content);
    pkg.add(
      {
        type: typeId,
        group: 0x00000000, // Tuning always uses group 0
        instance: instanceId,
      },
      resource
    );
  }
}

/**
 * StringTableファイルを読み込んでPackageに追加
 */
function loadStringTables(pkg: Package, stringsDir: string): void {
  const stblFiles = getFilesRecursively(stringsDir, ".stbl.json");
  
  for (const stblPath of stblFiles) {
    const content = fs.readFileSync(stblPath, "utf-8");
    const data = JSON.parse(content);
    const fileName = path.basename(stblPath, ".stbl.json");
    
    // ロケールを判定
    let localeCode = 0x00; // English
    if (fileName.includes("_ja") || data.locale === "ja-JP") {
      localeCode = 0x11; // Japanese
    }
    
    const instanceId = generateInstanceId(`${CONFIG.creatorName}:${CONFIG.modName}:strings:${localeCode}`);
    
    console.log(`  [STBL] ${fileName} (locale: 0x${localeCode.toString(16)}) -> 0x${instanceId.toString(16)}`);
    
    const stbl = new StringTableResource();
    for (const entry of data.entries) {
      const keyNum = typeof entry.key === "string" 
        ? parseInt(entry.key, 16) 
        : entry.key;
      stbl.add(keyNum, entry.value);
    }
    
    pkg.add(
      {
        type: 0x220557DA, // StringTable (STBL) - BinaryResourceType.StringTable
        group: 0x80000000,
        instance: instanceId,
      },
      stbl
    );
  }
}

/**
 * メインビルド処理
 */
async function build(): Promise<void> {
  console.log("=".repeat(60));
  console.log(`Building: ${CONFIG.modName}`);
  console.log(`Mode: ${isDryRun ? "Dry Run" : shouldDeploy ? "Deploy" : "Build"}`);
  console.log("=".repeat(60));
  
  const pkg = new Package();
  
  // チューニングファイルを読み込み
  const tuningDir = path.join(CONFIG.sourceDir, "tuning");
  console.log("\nLoading Tuning files...");
  loadTuningFiles(pkg, tuningDir);
  
  // StringTableファイルを読み込み
  const stringsDir = path.join(CONFIG.sourceDir, "strings");
  console.log("\nLoading StringTable files...");
  loadStringTables(pkg, stringsDir);
  
  // ビルドサマリー
  console.log("\n" + "-".repeat(60));
  console.log(`Total resources: ${pkg.size}`);
  console.log("-".repeat(60));
  
  if (isDryRun) {
    console.log("\n[Dry Run] No files written.");
    return;
  }
  
  // distディレクトリを作成
  if (!fs.existsSync(CONFIG.distDir)) {
    fs.mkdirSync(CONFIG.distDir, { recursive: true });
  }
  
  // パッケージを書き出し
  const outputPath = path.join(CONFIG.distDir, `${CONFIG.modName}.package`);
  const buffer = pkg.getBuffer();
  fs.writeFileSync(outputPath, buffer);
  console.log(`\n✓ Written: ${outputPath}`);
  
  // デプロイ
  if (shouldDeploy) {
    const deployPath = path.join(CONFIG.deployDir, `${CONFIG.modName}.package`);
    fs.copyFileSync(outputPath, deployPath);
    console.log(`✓ Deployed: ${deployPath}`);
  }
  
  console.log("\nBuild complete!");
}

// 実行
build().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
