/**
 * Autonomy MOD - Build Script Unit Tests
 * Covers both Event Autonomy and Aspiration Autonomy features.
 */

import { expect } from "chai";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { Package, XmlResource } from "@s4tk/models";
import { fnv64 } from "@s4tk/hashing";

// ESM support: __dirname alternative
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Project paths
const PROJECT_ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(PROJECT_ROOT, "src");
const DIST_DIR = path.join(PROJECT_ROOT, "dist");

/**
 * Correct Resource Type IDs
 * Values from S4TK TuningResourceType enum
 */
const CORRECT_TYPE_IDS = {
  TRAIT: 0xCB5FDDC7,
  BUFF: 0x6017E896,
  INTERACTION: 0xE882D22F,
  SNIPPET: 0x7DF2169C,
  STBL: 0x220557DA,
  SIMDATA: 0x545AC67A,
  GENERIC_TUNING: 0x03B33006,
  STATISTIC: 0x339BC5BD,
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

describe("Autonomy MOD", () => {

  describe("Source Files", () => {

    it("should have tuning directory", () => {
      const tuningDir = path.join(SRC_DIR, "tuning");
      expect(fs.existsSync(tuningDir)).to.be.true;
    });

    it("should have strings directory", () => {
      const stringsDir = path.join(SRC_DIR, "strings");
      expect(fs.existsSync(stringsDir)).to.be.true;
    });

    it("should have event buff XML file", () => {
      const buffFile = path.join(SRC_DIR, "tuning", "buffs", "Kokor_Buff_EventAutonomy.xml");
      expect(fs.existsSync(buffFile)).to.be.true;
    });

    it("should have event buff SimData XML file", () => {
      const simDataFile = path.join(SRC_DIR, "tuning", "buffs", "Kokor_Buff_EventAutonomy.SimData.xml");
      expect(fs.existsSync(simDataFile)).to.be.true;
    });

    it("should have aspiration buff XML file", () => {
      const buffFile = path.join(SRC_DIR, "tuning", "buffs", "Kokor_Buff_AspirationAutonomy.xml");
      expect(fs.existsSync(buffFile)).to.be.true;
    });

    it("should have aspiration buff SimData XML file", () => {
      const simDataFile = path.join(SRC_DIR, "tuning", "buffs", "Kokor_Buff_AspirationAutonomy.SimData.xml");
      expect(fs.existsSync(simDataFile)).to.be.true;
    });

    it("should have event snippet XML file", () => {
      const snippetFile = path.join(SRC_DIR, "tuning", "snippets", "Kokor_Snippet_EventAutonomy.xml");
      expect(fs.existsSync(snippetFile)).to.be.true;
    });

    it("should have aspiration snippet XML file", () => {
      const snippetFile = path.join(SRC_DIR, "tuning", "snippets", "Kokor_Snippet_AspirationAutonomy.xml");
      expect(fs.existsSync(snippetFile)).to.be.true;
    });

    it("should have English strings file", () => {
      const stringsFile = path.join(SRC_DIR, "strings", "strings.stbl.json");
      expect(fs.existsSync(stringsFile)).to.be.true;
    });

    it("should have Japanese strings file", () => {
      const stringsFile = path.join(SRC_DIR, "strings", "strings_ja.stbl.json");
      expect(fs.existsSync(stringsFile)).to.be.true;
    });

    it("should have Python event script files", () => {
      const initFile = path.join(SRC_DIR, "scripts", "kokor_event_autonomy", "__init__.py");
      const mainFile = path.join(SRC_DIR, "scripts", "kokor_event_autonomy", "event_autonomy.py");
      expect(fs.existsSync(initFile)).to.be.true;
      expect(fs.existsSync(mainFile)).to.be.true;
    });

    it("should have Python aspiration script file", () => {
      const aspirationFile = path.join(SRC_DIR, "scripts", "kokor_event_autonomy", "aspiration_autonomy.py");
      expect(fs.existsSync(aspirationFile)).to.be.true;
    });

    it("__init__.py should import both modules", () => {
      const initFile = path.join(SRC_DIR, "scripts", "kokor_event_autonomy", "__init__.py");
      const content = fs.readFileSync(initFile, "utf-8");
      expect(content).to.include("event_autonomy");
      expect(content).to.include("aspiration_autonomy");
    });
  });

  describe("XML Validation", () => {

    it("should parse buff XML without errors", () => {
      const buffFile = path.join(SRC_DIR, "tuning", "buffs", "Kokor_Buff_EventAutonomy.xml");
      const content = fs.readFileSync(buffFile, "utf-8");

      expect(() => new XmlResource(content)).to.not.throw();
    });

    it("should parse snippet XML without errors", () => {
      const snippetFile = path.join(SRC_DIR, "tuning", "snippets", "Kokor_Snippet_EventAutonomy.xml");
      const content = fs.readFileSync(snippetFile, "utf-8");

      expect(() => new XmlResource(content)).to.not.throw();
    });

    it("buff XML should have correct root element", () => {
      const buffFile = path.join(SRC_DIR, "tuning", "buffs", "Kokor_Buff_EventAutonomy.xml");
      const content = fs.readFileSync(buffFile, "utf-8");
      const resource = new XmlResource(content);

      expect(resource.content).to.include('<I c="Buff"');
      expect(resource.content).to.include('n="Kokor_Buff_EventAutonomy"');
    });

    it("snippet XML should have correct root element", () => {
      const snippetFile = path.join(SRC_DIR, "tuning", "snippets", "Kokor_Snippet_EventAutonomy.xml");
      const content = fs.readFileSync(snippetFile, "utf-8");
      const resource = new XmlResource(content);

      expect(resource.content).to.include('<I c="XmlInjector"');
      expect(resource.content).to.include('n="Kokor_Snippet_EventAutonomy"');
    });

    it("buff should reference all age traits in snippet", () => {
      const snippetFile = path.join(SRC_DIR, "tuning", "snippets", "Kokor_Snippet_EventAutonomy.xml");
      const content = fs.readFileSync(snippetFile, "utf-8");

      // All age trait IDs should be present
      const ageTraitIds = [170699, 34316, 34317, 34318, 34319, 34320];
      for (const traitId of ageTraitIds) {
        expect(content).to.include(traitId.toString(),
          `Missing age trait ID: ${traitId}`);
      }
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

      const enKeys = Object.keys(enData.entries).sort();
      const jaKeys = Object.keys(jaData.entries).sort();

      expect(enKeys).to.deep.equal(jaKeys);
    });

    it("strings should not be empty", () => {
      const enFile = path.join(SRC_DIR, "strings", "strings.stbl.json");
      const enData = JSON.parse(fs.readFileSync(enFile, "utf-8"));

      for (const [key, value] of Object.entries(enData.entries)) {
        expect(value).to.be.a("string");
        expect((value as string).length).to.be.greaterThan(0);
      }
    });
  });

  describe("Instance ID Validation", () => {

    it("should generate consistent FNV64 hash for buff name", () => {
      const buffName = "Kokor_Buff_EventAutonomy";
      const hash = fnv64(buffName);
      // Verified: 11868051101054154796n
      expect(hash.toString()).to.equal("11868051101054154796");
    });

    it("should generate consistent FNV64 hash for snippet name", () => {
      const snippetName = "Kokor_Snippet_EventAutonomy";
      const hash = fnv64(snippetName);
      // Verified: 12040554743680280784n
      expect(hash.toString()).to.equal("12040554743680280784");
    });

    it("buff XML s attribute should match FNV64 hash", () => {
      const buffFile = path.join(SRC_DIR, "tuning", "buffs", "Kokor_Buff_EventAutonomy.xml");
      const content = fs.readFileSync(buffFile, "utf-8");

      const sMatch = content.match(/\bs="(\d+)"/);
      expect(sMatch).to.not.be.null;

      const sValue = BigInt(sMatch![1]);
      const expectedHash = fnv64("Kokor_Buff_EventAutonomy");
      expect(sValue).to.equal(expectedHash);
    });

    it("snippet XML s attribute should match FNV64 hash", () => {
      const snippetFile = path.join(SRC_DIR, "tuning", "snippets", "Kokor_Snippet_EventAutonomy.xml");
      const content = fs.readFileSync(snippetFile, "utf-8");

      const sMatch = content.match(/\bs="(\d+)"/);
      expect(sMatch).to.not.be.null;

      const sValue = BigInt(sMatch![1]);
      const expectedHash = fnv64("Kokor_Snippet_EventAutonomy");
      expect(sValue).to.equal(expectedHash);
    });

    it("snippet should reference correct buff instance ID", () => {
      const snippetFile = path.join(SRC_DIR, "tuning", "snippets", "Kokor_Snippet_EventAutonomy.xml");
      const content = fs.readFileSync(snippetFile, "utf-8");

      const buffHash = fnv64("Kokor_Buff_EventAutonomy").toString();
      expect(content).to.include(buffHash,
        "Snippet should reference the buff's FNV64 hash as buff_type");
    });

    it("should set high bit correctly for custom content", () => {
      const hash = fnv64("Kokor:TestResource");
      const withHighBit = hash | BigInt("0x8000000000000000");

      expect(withHighBit & BigInt("0x8000000000000000")).to.equal(BigInt("0x8000000000000000"));
    });
  });

  describe("SimData Validation", () => {

    it("SimData should exist alongside buff tuning", () => {
      const simDataFile = path.join(SRC_DIR, "tuning", "buffs", "Kokor_Buff_EventAutonomy.SimData.xml");
      expect(fs.existsSync(simDataFile)).to.be.true;
    });

    it("SimData should use correct Buff schema hash", () => {
      const simDataFile = path.join(SRC_DIR, "tuning", "buffs", "Kokor_Buff_EventAutonomy.SimData.xml");
      const content = fs.readFileSync(simDataFile, "utf-8");

      expect(content).to.include('schema_hash="0x0D045687"',
        "SimData should use verified Buff schema hash");
    });

    it("SimData instance name should match tuning name", () => {
      const simDataFile = path.join(SRC_DIR, "tuning", "buffs", "Kokor_Buff_EventAutonomy.SimData.xml");
      const content = fs.readFileSync(simDataFile, "utf-8");

      expect(content).to.include('name="Kokor_Buff_EventAutonomy"');
    });

    it("SimData should have correct number of columns (9 for Buff)", () => {
      const simDataFile = path.join(SRC_DIR, "tuning", "buffs", "Kokor_Buff_EventAutonomy.SimData.xml");
      const content = fs.readFileSync(simDataFile, "utf-8");

      const columnMatches = content.match(/<Column /g);
      expect(columnMatches).to.not.be.null;
      expect(columnMatches!.length).to.equal(9);
    });

    it("SimData string keys should match buff tuning string keys", () => {
      const buffFile = path.join(SRC_DIR, "tuning", "buffs", "Kokor_Buff_EventAutonomy.xml");
      const simDataFile = path.join(SRC_DIR, "tuning", "buffs", "Kokor_Buff_EventAutonomy.SimData.xml");

      const buffContent = fs.readFileSync(buffFile, "utf-8");
      const simDataContent = fs.readFileSync(simDataFile, "utf-8");

      // Extract buff_name and buff_description keys from tuning
      const buffNameMatch = buffContent.match(/<T n="buff_name">([^<]+)<\/T>/);
      const buffDescMatch = buffContent.match(/<T n="buff_description">([^<]+)<\/T>/);

      expect(buffNameMatch).to.not.be.null;
      expect(buffDescMatch).to.not.be.null;

      // SimData should contain the same keys
      expect(simDataContent).to.include(buffNameMatch![1]);
      expect(simDataContent).to.include(buffDescMatch![1]);
    });
  });

  describe("Python Script Validation", () => {

    it("should not use Python 3.8+ walrus operator", () => {
      const pyFile = path.join(SRC_DIR, "scripts", "kokor_event_autonomy", "event_autonomy.py");
      const content = fs.readFileSync(pyFile, "utf-8");

      // Check for := (walrus operator, Python 3.8+)
      expect(content).to.not.match(/:=\s/,
        "Python 3.8+ walrus operator (:=) is not supported in Sims 4 (Python 3.7)");
    });

    it("should not use match statement (Python 3.10+)", () => {
      const pyFile = path.join(SRC_DIR, "scripts", "kokor_event_autonomy", "event_autonomy.py");
      const content = fs.readFileSync(pyFile, "utf-8");

      // Check for match/case statements
      expect(content).to.not.match(/^\s*match\s+\w+\s*:/m,
        "Python 3.10+ match statement is not supported in Sims 4 (Python 3.7)");
    });

    it("should have zone injection pattern", () => {
      const pyFile = path.join(SRC_DIR, "scripts", "kokor_event_autonomy", "event_autonomy.py");
      const content = fs.readFileSync(pyFile, "utf-8");

      expect(content).to.include("zone.Zone.on_loading_screen_animation_finished");
      expect(content).to.include("_inject()");
    });

    it("should have alarm setup pattern", () => {
      const pyFile = path.join(SRC_DIR, "scripts", "kokor_event_autonomy", "event_autonomy.py");
      const content = fs.readFileSync(pyFile, "utf-8");

      expect(content).to.include("alarms.add_alarm");
      expect(content).to.include("create_time_span");
    });

    it("should have event detection functions", () => {
      const pyFile = path.join(SRC_DIR, "scripts", "kokor_event_autonomy", "event_autonomy.py");
      const content = fs.readFileSync(pyFile, "utf-8");

      expect(content).to.include("_get_holiday_tradition_keywords");
      expect(content).to.include("_get_active_situation_keywords");
      expect(content).to.include("_collect_all_event_keywords");
    });

    it("should have commodity boost function", () => {
      const pyFile = path.join(SRC_DIR, "scripts", "kokor_event_autonomy", "event_autonomy.py");
      const content = fs.readFileSync(pyFile, "utf-8");

      expect(content).to.include("_boost_commodity");
      expect(content).to.include("COMMODITY_IDS");
    });
  });

  // ===== Aspiration Autonomy Tests =====

  describe("Aspiration XML Validation", () => {

    it("should parse aspiration buff XML without errors", () => {
      const buffFile = path.join(SRC_DIR, "tuning", "buffs", "Kokor_Buff_AspirationAutonomy.xml");
      const content = fs.readFileSync(buffFile, "utf-8");

      expect(() => new XmlResource(content)).to.not.throw();
    });

    it("should parse aspiration snippet XML without errors", () => {
      const snippetFile = path.join(SRC_DIR, "tuning", "snippets", "Kokor_Snippet_AspirationAutonomy.xml");
      const content = fs.readFileSync(snippetFile, "utf-8");

      expect(() => new XmlResource(content)).to.not.throw();
    });

    it("aspiration buff XML should have correct root element", () => {
      const buffFile = path.join(SRC_DIR, "tuning", "buffs", "Kokor_Buff_AspirationAutonomy.xml");
      const content = fs.readFileSync(buffFile, "utf-8");
      const resource = new XmlResource(content);

      expect(resource.content).to.include('<I c="Buff"');
      expect(resource.content).to.include('n="Kokor_Buff_AspirationAutonomy"');
    });

    it("aspiration snippet XML should have correct root element", () => {
      const snippetFile = path.join(SRC_DIR, "tuning", "snippets", "Kokor_Snippet_AspirationAutonomy.xml");
      const content = fs.readFileSync(snippetFile, "utf-8");
      const resource = new XmlResource(content);

      expect(resource.content).to.include('<I c="XmlInjector"');
      expect(resource.content).to.include('n="Kokor_Snippet_AspirationAutonomy"');
    });

    it("aspiration snippet should reference all age traits", () => {
      const snippetFile = path.join(SRC_DIR, "tuning", "snippets", "Kokor_Snippet_AspirationAutonomy.xml");
      const content = fs.readFileSync(snippetFile, "utf-8");

      const ageTraitIds = [170699, 34316, 34317, 34318, 34319, 34320];
      for (const traitId of ageTraitIds) {
        expect(content).to.include(traitId.toString(),
          `Missing age trait ID: ${traitId}`);
      }
    });
  });

  describe("Aspiration Instance ID Validation", () => {

    it("should generate consistent FNV64 hash for aspiration buff name", () => {
      const buffName = "Kokor_Buff_AspirationAutonomy";
      const hash = fnv64(buffName);
      expect(hash.toString()).to.equal("4823729553343165992");
    });

    it("should generate consistent FNV64 hash for aspiration snippet name", () => {
      const snippetName = "Kokor_Snippet_AspirationAutonomy";
      const hash = fnv64(snippetName);
      expect(hash.toString()).to.equal("9581053876121646196");
    });

    it("aspiration buff XML s attribute should match FNV64 hash", () => {
      const buffFile = path.join(SRC_DIR, "tuning", "buffs", "Kokor_Buff_AspirationAutonomy.xml");
      const content = fs.readFileSync(buffFile, "utf-8");

      const sMatch = content.match(/\bs="(\d+)"/);
      expect(sMatch).to.not.be.null;

      const sValue = BigInt(sMatch![1]);
      const expectedHash = fnv64("Kokor_Buff_AspirationAutonomy");
      expect(sValue).to.equal(expectedHash);
    });

    it("aspiration snippet XML s attribute should match FNV64 hash", () => {
      const snippetFile = path.join(SRC_DIR, "tuning", "snippets", "Kokor_Snippet_AspirationAutonomy.xml");
      const content = fs.readFileSync(snippetFile, "utf-8");

      const sMatch = content.match(/\bs="(\d+)"/);
      expect(sMatch).to.not.be.null;

      const sValue = BigInt(sMatch![1]);
      const expectedHash = fnv64("Kokor_Snippet_AspirationAutonomy");
      expect(sValue).to.equal(expectedHash);
    });

    it("aspiration snippet should reference correct buff instance ID", () => {
      const snippetFile = path.join(SRC_DIR, "tuning", "snippets", "Kokor_Snippet_AspirationAutonomy.xml");
      const content = fs.readFileSync(snippetFile, "utf-8");

      const buffHash = fnv64("Kokor_Buff_AspirationAutonomy").toString();
      expect(content).to.include(buffHash,
        "Aspiration snippet should reference the buff's FNV64 hash as buff_type");
    });
  });

  describe("Aspiration SimData Validation", () => {

    it("SimData should exist alongside aspiration buff tuning", () => {
      const simDataFile = path.join(SRC_DIR, "tuning", "buffs", "Kokor_Buff_AspirationAutonomy.SimData.xml");
      expect(fs.existsSync(simDataFile)).to.be.true;
    });

    it("aspiration SimData should use correct Buff schema hash", () => {
      const simDataFile = path.join(SRC_DIR, "tuning", "buffs", "Kokor_Buff_AspirationAutonomy.SimData.xml");
      const content = fs.readFileSync(simDataFile, "utf-8");

      expect(content).to.include('schema_hash="0x0D045687"',
        "SimData should use verified Buff schema hash");
    });

    it("aspiration SimData instance name should match tuning name", () => {
      const simDataFile = path.join(SRC_DIR, "tuning", "buffs", "Kokor_Buff_AspirationAutonomy.SimData.xml");
      const content = fs.readFileSync(simDataFile, "utf-8");

      expect(content).to.include('name="Kokor_Buff_AspirationAutonomy"');
    });

    it("aspiration SimData should have correct number of columns (9 for Buff)", () => {
      const simDataFile = path.join(SRC_DIR, "tuning", "buffs", "Kokor_Buff_AspirationAutonomy.SimData.xml");
      const content = fs.readFileSync(simDataFile, "utf-8");

      const columnMatches = content.match(/<Column /g);
      expect(columnMatches).to.not.be.null;
      expect(columnMatches!.length).to.equal(9);
    });

    it("aspiration SimData string keys should match buff tuning string keys", () => {
      const buffFile = path.join(SRC_DIR, "tuning", "buffs", "Kokor_Buff_AspirationAutonomy.xml");
      const simDataFile = path.join(SRC_DIR, "tuning", "buffs", "Kokor_Buff_AspirationAutonomy.SimData.xml");

      const buffContent = fs.readFileSync(buffFile, "utf-8");
      const simDataContent = fs.readFileSync(simDataFile, "utf-8");

      const buffNameMatch = buffContent.match(/<T n="buff_name">([^<]+)<\/T>/);
      const buffDescMatch = buffContent.match(/<T n="buff_description">([^<]+)<\/T>/);

      expect(buffNameMatch).to.not.be.null;
      expect(buffDescMatch).to.not.be.null;

      expect(simDataContent).to.include(buffNameMatch![1]);
      expect(simDataContent).to.include(buffDescMatch![1]);
    });
  });

  describe("Aspiration Python Script Validation", () => {

    it("should not use Python 3.8+ walrus operator", () => {
      const pyFile = path.join(SRC_DIR, "scripts", "kokor_event_autonomy", "aspiration_autonomy.py");
      const content = fs.readFileSync(pyFile, "utf-8");

      expect(content).to.not.match(/:=\s/,
        "Python 3.8+ walrus operator (:=) is not supported in Sims 4 (Python 3.7)");
    });

    it("should not use match statement (Python 3.10+)", () => {
      const pyFile = path.join(SRC_DIR, "scripts", "kokor_event_autonomy", "aspiration_autonomy.py");
      const content = fs.readFileSync(pyFile, "utf-8");

      expect(content).to.not.match(/^\s*match\s+\w+\s*:/m,
        "Python 3.10+ match statement is not supported in Sims 4 (Python 3.7)");
    });

    it("should have zone injection pattern", () => {
      const pyFile = path.join(SRC_DIR, "scripts", "kokor_event_autonomy", "aspiration_autonomy.py");
      const content = fs.readFileSync(pyFile, "utf-8");

      expect(content).to.include("zone.Zone.on_loading_screen_animation_finished");
      expect(content).to.include("_inject()");
    });

    it("should have alarm setup pattern", () => {
      const pyFile = path.join(SRC_DIR, "scripts", "kokor_event_autonomy", "aspiration_autonomy.py");
      const content = fs.readFileSync(pyFile, "utf-8");

      expect(content).to.include("alarms.add_alarm");
      expect(content).to.include("create_time_span");
    });

    it("should have aspiration detection function", () => {
      const pyFile = path.join(SRC_DIR, "scripts", "kokor_event_autonomy", "aspiration_autonomy.py");
      const content = fs.readFileSync(pyFile, "utf-8");

      expect(content).to.include("_get_aspiration_keywords");
      expect(content).to.include("aspiration_tracker");
    });

    it("should have aspiration keyword map", () => {
      const pyFile = path.join(SRC_DIR, "scripts", "kokor_event_autonomy", "aspiration_autonomy.py");
      const content = fs.readFileSync(pyFile, "utf-8");

      expect(content).to.include("ASPIRATION_KEYWORD_MAP");
      expect(content).to.include("COMMODITY_IDS");
    });

    it("should have whim/want detection", () => {
      const pyFile = path.join(SRC_DIR, "scripts", "kokor_event_autonomy", "aspiration_autonomy.py");
      const content = fs.readFileSync(pyFile, "utf-8");

      expect(content).to.include("whim");
    });
  });

  describe("String Keys Consistency", () => {

    it("should have 4 string entries (2 event + 2 aspiration)", () => {
      const enFile = path.join(SRC_DIR, "strings", "strings.stbl.json");
      const enData = JSON.parse(fs.readFileSync(enFile, "utf-8"));

      expect(Object.keys(enData.entries).length).to.equal(4);
    });

    it("aspiration buff should reference string keys present in STBL", () => {
      const buffFile = path.join(SRC_DIR, "tuning", "buffs", "Kokor_Buff_AspirationAutonomy.xml");
      const buffContent = fs.readFileSync(buffFile, "utf-8");

      const enFile = path.join(SRC_DIR, "strings", "strings.stbl.json");
      const enData = JSON.parse(fs.readFileSync(enFile, "utf-8"));
      const stblKeys = Object.keys(enData.entries);

      const buffNameMatch = buffContent.match(/<T n="buff_name">([^<]+)<\/T>/);
      const buffDescMatch = buffContent.match(/<T n="buff_description">([^<]+)<\/T>/);

      expect(buffNameMatch).to.not.be.null;
      expect(buffDescMatch).to.not.be.null;

      expect(stblKeys).to.include(buffNameMatch![1]);
      expect(stblKeys).to.include(buffDescMatch![1]);
    });
  });

  describe("Built Package", () => {

    before(function() {
      const packagePath = path.join(DIST_DIR, "KokorEventAutonomy.package");
      if (!fs.existsSync(packagePath)) {
        this.skip();
      }
    });

    it("should exist after build", () => {
      const packagePath = path.join(DIST_DIR, "KokorEventAutonomy.package");
      expect(fs.existsSync(packagePath)).to.be.true;
    });

    it("should be a valid DBPF package file", () => {
      const packagePath = path.join(DIST_DIR, "KokorEventAutonomy.package");
      expect(() => readPackageTGI(packagePath)).to.not.throw();
    });
  });

  /**
   * Resource Type ID Validation (CRITICAL)
   */
  describe("Resource Type ID Validation (CRITICAL)", () => {

    let entries: ResourceKey[];

    before(function() {
      const packagePath = path.join(DIST_DIR, "KokorEventAutonomy.package");
      if (!fs.existsSync(packagePath)) {
        this.skip();
      }
      entries = readPackageTGI(packagePath);
    });

    it("should NOT use generic tuning type ID (0x03b33006)", () => {
      for (const entry of entries) {
        const typeHex = `0x${entry.type.toString(16)}`;
        expect(
          entry.type,
          `Generic Tuning Type ID detected! Entry has type ${typeHex}. ` +
          `Use specific type IDs: Buff=0x6017E896, Snippet=0x7DF2169C`
        ).to.not.equal(CORRECT_TYPE_IDS.GENERIC_TUNING);
      }
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

    it("Tuning resources (non-SimData) should have Group = 0x00000000", () => {
      for (const entry of entries) {
        // Skip StringTable and SimData (SimData uses type-specific group hash)
        if (entry.type !== CORRECT_TYPE_IDS.STBL && entry.type !== CORRECT_TYPE_IDS.SIMDATA) {
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

    it("Tuning Instance IDs should have high bit set", () => {
      for (const entry of entries) {
        // Skip StringTable (instanceBase from STBL JSON may not have high bit)
        if (entry.type === CORRECT_TYPE_IDS.STBL) continue;
        const highBit = entry.instance & BigInt("0x8000000000000000");
        expect(
          highBit,
          `Instance ${entry.instance.toString(16)} does not have high bit set`
        ).to.equal(BigInt("0x8000000000000000"));
      }
    });
  });
});
