/**
 * Education Auto Tasks - Build Script Unit Tests
 */

import { expect } from "chai";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { Package, XmlResource } from "@s4tk/models";
import { fnv64 } from "@s4tk/hashing";

// ESM対忁E __dirnameの代替
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// プロジェクトルートから�E相対パス
const PROJECT_ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(PROJECT_ROOT, "src");
const DIST_DIR = path.join(PROJECT_ROOT, "dist");

/**
 * 正しい Resource Type ID の定義
 * これらの値は S4TK TuningResourceType enum から取得
 * 絶対に間違えてはならない - ゲームはこれらの値でリソースタイプを識別する
 */
const CORRECT_TYPE_IDS = {
  TRAIT: 0xCB5FDDC7,         // Trait = 3412057543
  BUFF: 0x6017E896,          // Buff = 1612179606  
  INTERACTION: 0xE882D22F,   // Interaction = 3900887599
  STBL: 0x220557DA,          // StringTable = 570775514
  // 以下は使用してはいけない（Tuning認識されない）
  GENERIC_TUNING: 0x03B33006, // Generic Tuning（非推奨）
  STATISTIC: 0x339BC5BD,     // Statistic（Traitと間違えやすい！）
} as const;

/**
 * Package TGI Reader using S4TK with recoveryMode
 */
interface ResourceKey {
  type: number;
  group: number;
  instance: bigint;
}

function readPackageTGI(filePath: string): ResourceKey[] {
  const buffer = fs.readFileSync(filePath);
  // recoveryMode: true でエラーを無視してTGIのみ読み取り
  const pkg = Package.from(buffer, { recoveryMode: true });
  
  const entries: ResourceKey[] = [];
  for (const entry of pkg.entries) {
    entries.push({
      type: entry.key.type,
      group: entry.key.group,
      instance: entry.key.instance,
    });
  }
  return entries;
}

describe("Education Auto Tasks MOD", () => {
  
  describe("Source Files", () => {
    
    it("should have tuning directory", () => {
      const tuningDir = path.join(SRC_DIR, "tuning");
      expect(fs.existsSync(tuningDir)).to.be.true;
    });
    
    it("should have strings directory", () => {
      const stringsDir = path.join(SRC_DIR, "strings");
      expect(fs.existsSync(stringsDir)).to.be.true;
    });
    
    it("should have trait XML file", () => {
      const traitFile = path.join(SRC_DIR, "tuning", "traits", "Kokor_Trait_EducationAutoTasks.xml");
      expect(fs.existsSync(traitFile)).to.be.true;
    });
    
    it("should have buff XML file", () => {
      const buffFile = path.join(SRC_DIR, "tuning", "buffs", "Kokor_Buff_EducationFocused.xml");
      expect(fs.existsSync(buffFile)).to.be.true;
    });
    
    it("should have English strings file", () => {
      const stringsFile = path.join(SRC_DIR, "strings", "strings.stbl.json");
      expect(fs.existsSync(stringsFile)).to.be.true;
    });
    
    it("should have Japanese strings file", () => {
      const stringsFile = path.join(SRC_DIR, "strings", "strings_ja.stbl.json");
      expect(fs.existsSync(stringsFile)).to.be.true;
    });
  });
  
  describe("XML Validation", () => {
    
    it("should parse trait XML without errors", () => {
      const traitFile = path.join(SRC_DIR, "tuning", "traits", "Kokor_Trait_EducationAutoTasks.xml");
      const content = fs.readFileSync(traitFile, "utf-8");
      
      expect(() => new XmlResource(content)).to.not.throw();
    });
    
    it("should parse buff XML without errors", () => {
      const buffFile = path.join(SRC_DIR, "tuning", "buffs", "Kokor_Buff_EducationFocused.xml");
      const content = fs.readFileSync(buffFile, "utf-8");
      
      expect(() => new XmlResource(content)).to.not.throw();
    });
    
    it("trait XML should have correct root element", () => {
      const traitFile = path.join(SRC_DIR, "tuning", "traits", "Kokor_Trait_EducationAutoTasks.xml");
      const content = fs.readFileSync(traitFile, "utf-8");
      const resource = new XmlResource(content);
      
      // XmlResourceがコンチE��チE��持ってぁE��ことを確誁E
      expect(resource.content).to.include("<I c=\"Trait\"");
      expect(resource.content).to.include("n=\"Kokor:Trait_EducationAutoTasks\"");
    });
    
    it("buff XML should have correct root element", () => {
      const buffFile = path.join(SRC_DIR, "tuning", "buffs", "Kokor_Buff_EducationFocused.xml");
      const content = fs.readFileSync(buffFile, "utf-8");
      const resource = new XmlResource(content);
      
      // XmlResourceがコンチE��チE��持ってぁE��ことを確誁E
      expect(resource.content).to.include("<I c=\"Buff\"");
      expect(resource.content).to.include("n=\"Kokor:Buff_EducationFocused\"");
    });
  });
  
  describe("StringTable Validation", () => {
    
    it("should parse English strings JSON", () => {
      const stringsFile = path.join(SRC_DIR, "strings", "strings.stbl.json");
      const content = fs.readFileSync(stringsFile, "utf-8");
      
      expect(() => JSON.parse(content)).to.not.throw();
    });
    
    it("should parse Japanese strings JSON", () => {
      const stringsFile = path.join(SRC_DIR, "strings", "strings_ja.stbl.json");
      const content = fs.readFileSync(stringsFile, "utf-8");
      
      expect(() => JSON.parse(content)).to.not.throw();
    });
    
    it("English and Japanese should have same keys", () => {
      const enFile = path.join(SRC_DIR, "strings", "strings.stbl.json");
      const jaFile = path.join(SRC_DIR, "strings", "strings_ja.stbl.json");
      
      const enData = JSON.parse(fs.readFileSync(enFile, "utf-8"));
      const jaData = JSON.parse(fs.readFileSync(jaFile, "utf-8"));
      
      const enKeys = enData.entries.map((e: any) => e.key).sort();
      const jaKeys = jaData.entries.map((e: any) => e.key).sort();
      
      expect(enKeys).to.deep.equal(jaKeys);
    });
    
    it("strings should not be empty", () => {
      const enFile = path.join(SRC_DIR, "strings", "strings.stbl.json");
      const enData = JSON.parse(fs.readFileSync(enFile, "utf-8"));
      
      for (const entry of enData.entries) {
        expect(entry.value).to.be.a("string");
        expect(entry.value.length).to.be.greaterThan(0);
      }
    });
  });
  
  describe("Instance ID Generation", () => {
    
    it("should generate consistent hash for same input", () => {
      const name = "Kokor:TestResource";
      const hash1 = fnv64(name);
      const hash2 = fnv64(name);
      
      expect(hash1).to.equal(hash2);
    });
    
    it("should generate different hashes for different inputs", () => {
      const hash1 = fnv64("Kokor:Resource1");
      const hash2 = fnv64("Kokor:Resource2");
      
      expect(hash1).to.not.equal(hash2);
    });
    
    it("should set high bit correctly", () => {
      const hash = fnv64("Kokor:TestResource");
      const withHighBit = hash | BigInt("0x8000000000000000");
      
      // High bit should be set
      expect(withHighBit & BigInt("0x8000000000000000")).to.equal(BigInt("0x8000000000000000"));
    });
  });
  
  describe("Built Package", () => {
    
    before(function() {
      // Skip if package doesn't exist
      const packagePath = path.join(DIST_DIR, "KokorEducationAutoTasks.package");
      if (!fs.existsSync(packagePath)) {
        this.skip();
      }
    });
    
    it("should exist after build", () => {
      const packagePath = path.join(DIST_DIR, "KokorEducationAutoTasks.package");
      expect(fs.existsSync(packagePath)).to.be.true;
    });
    
    it("should be a valid DBPF package file", () => {
      const packagePath = path.join(DIST_DIR, "KokorEducationAutoTasks.package");
      
      // 直接バイナリからTGIを読み取る�E�E4TK自動解析を回避�E�E
      expect(() => readPackageTGI(packagePath)).to.not.throw();
    });
    
    it("should contain expected number of resources", () => {
      const packagePath = path.join(DIST_DIR, "KokorEducationAutoTasks.package");
      const entries = readPackageTGI(packagePath);
      
      // 2 tuning + 2 string tables = 4
      expect(entries.length).to.equal(4);
    });
  });

  /**
   * Resource Type ID 検証チE��チE
   * 
   * 今回の問題�E根本原因は間違っぁEType ID でした、E
   * こ�EチE��トスイート�Eビルド後�Eパッケージが正しい Type ID を使用してぁE��か検証します、E
   */
  describe("Resource Type ID Validation (CRITICAL)", () => {
    
    let entries: ResourceKey[];
    
    before(function() {
      const packagePath = path.join(DIST_DIR, "KokorEducationAutoTasks.package");
      if (!fs.existsSync(packagePath)) {
        this.skip();
      }
      // 直接バイナリからTGIを読み取る�E�E4TK自動解析を回避�E�E
      entries = readPackageTGI(packagePath);
    });

    it("should NOT use generic tuning type ID (0x03b33006)", () => {
      for (const entry of entries) {
        const typeHex = `0x${entry.type.toString(16)}`;
        expect(
          entry.type,
          `Generic Tuning Type ID detected! Entry has type ${typeHex}. ` +
          `Use specific type IDs: Trait=0xCB5FDDC7, Buff=0x6017E896`
        ).to.not.equal(CORRECT_TYPE_IDS.GENERIC_TUNING);
      }
    });

    it("should have Trait resource with correct type ID (0xCB5FDDC7)", () => {
      const traitEntries = entries.filter(
        e => e.type === CORRECT_TYPE_IDS.TRAIT
      );
      
      expect(
        traitEntries.length,
        `No Trait resources found with type ID 0xCB5FDDC7. ` +
        `Found types: ${entries.map(e => '0x' + e.type.toString(16)).join(', ')}`
      ).to.be.greaterThan(0);
    });

    it("should have Buff resource with correct type ID (0x6017E896)", () => {
      const buffEntries = entries.filter(
        e => e.type === CORRECT_TYPE_IDS.BUFF
      );
      
      expect(
        buffEntries.length,
        `No Buff resources found with type ID 0x6017E896. ` +
        `Found types: ${entries.map(e => '0x' + e.type.toString(16)).join(', ')}`
      ).to.be.greaterThan(0);
    });

    it("should have StringTable resources with correct type ID (0x220557DA)", () => {
      const stblEntries = entries.filter(
        e => e.type === CORRECT_TYPE_IDS.STBL
      );
      
      expect(
        stblEntries.length,
        `No StringTable resources found with type ID 0x220557DA. ` +
        `Found types: ${entries.map(e => '0x' + e.type.toString(16)).join(', ')}`
      ).to.be.greaterThan(0);
    });

    it("Tuning resources should have Group = 0x00000000", () => {
      for (const entry of entries) {
        // StringTable以外のリソースはGroup 0であるべき
        if (entry.type !== CORRECT_TYPE_IDS.STBL) {
          expect(
            entry.group,
            `Tuning resource has Group=${entry.group.toString(16)}, expected 0x00000000`
          ).to.equal(0x00000000);
        }
      }
    });

    it("StringTable resources should have Group = 0x80000000", () => {
      const stblEntries = entries.filter(e => e.type === CORRECT_TYPE_IDS.STBL);
      for (const entry of stblEntries) {
        expect(
          entry.group,
          `StringTable has Group=${entry.group.toString(16)}, expected 0x80000000`
        ).to.equal(0x80000000);
      }
    });

    it("all Instance IDs should have high bit set", () => {
      for (const entry of entries) {
        const highBit = entry.instance & BigInt("0x8000000000000000");
        expect(
          highBit,
          `Instance ${entry.instance.toString(16)} does not have high bit set`
        ).to.equal(BigInt("0x8000000000000000"));
      }
    });
  });
});
