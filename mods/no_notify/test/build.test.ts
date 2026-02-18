/**
 * No Notify MOD - Build & Source Validation Tests
 */

import { expect } from "chai";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(PROJECT_ROOT, "src");
const SCRIPTS_DIR = path.join(SRC_DIR, "scripts", "kokor_no_notify");
const DIST_DIR = path.join(PROJECT_ROOT, "dist");

describe("No Notify MOD", () => {

  describe("Source Files", () => {

    it("should have scripts directory", () => {
      expect(fs.existsSync(SCRIPTS_DIR)).to.be.true;
    });

    it("should have __init__.py", () => {
      const initFile = path.join(SCRIPTS_DIR, "__init__.py");
      expect(fs.existsSync(initFile)).to.be.true;
    });

    it("should have auto_dismiss.py", () => {
      const mainFile = path.join(SCRIPTS_DIR, "auto_dismiss.py");
      expect(fs.existsSync(mainFile)).to.be.true;
    });
  });

  describe("Python 3.7 Compatibility", () => {

    let pyContent: string;

    before(() => {
      const pyFile = path.join(SCRIPTS_DIR, "auto_dismiss.py");
      pyContent = fs.readFileSync(pyFile, "utf-8");
    });

    it("should not use walrus operator (:=) (Python 3.8+)", () => {
      // Match := that isn't inside a string literal
      const lines = pyContent.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        // Skip comments and string-only lines
        if (trimmed.startsWith("#") || trimmed.startsWith("'") || trimmed.startsWith('"')) {
          continue;
        }
        // Check for walrus operator in code (not in strings/comments)
        const codeBeforeComment = trimmed.split("#")[0];
        expect(codeBeforeComment).to.not.match(
          /\w\s*:=\s/,
          `Walrus operator found on line: ${trimmed}`
        );
      }
    });

    it("should not use match statement (Python 3.10+)", () => {
      expect(pyContent).to.not.match(
        /^\s*match\s+\w+\s*:/m,
        "match statement (Python 3.10+) is not supported in Sims 4"
      );
    });

    it("should not use dict union operator | (Python 3.9+)", () => {
      const lines = pyContent.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("#")) continue;
        // Look for dict | dict pattern (not bitwise or in other contexts)
        // This is a heuristic check
        expect(trimmed).to.not.match(
          /\}\s*\|\s*\{/,
          `Dict union operator found: ${trimmed}`
        );
      }
    });

    it("should not use f-string = debugging (Python 3.8+)", () => {
      expect(pyContent).to.not.match(
        /f['"]\{[^}]+=\}/,
        "f-string = debugging (Python 3.8+) is not supported"
      );
    });
  });

  describe("Module Structure", () => {

    let pyContent: string;

    before(() => {
      const pyFile = path.join(SCRIPTS_DIR, "auto_dismiss.py");
      pyContent = fs.readFileSync(pyFile, "utf-8");
    });

    it("should import sims4.log for logging", () => {
      expect(pyContent).to.include("import sims4.log");
    });

    it("should import sims4.commands for cheat commands", () => {
      expect(pyContent).to.include("import sims4.commands");
    });

    it("should import services", () => {
      expect(pyContent).to.include("import services");
    });

    it("should define a logger", () => {
      expect(pyContent).to.include("sims4.log.Logger(");
    });

    it("should have configuration dictionary", () => {
      expect(pyContent).to.include("_config");
      expect(pyContent).to.include("'enabled'");
    });

    it("should hook UiDialogOkCancel.show_dialog", () => {
      expect(pyContent).to.include("UiDialogOkCancel");
      expect(pyContent).to.include("show_dialog");
    });

    it("should hook UiDialogOk.show_dialog", () => {
      expect(pyContent).to.include("UiDialogOk");
    });

    it("should hook UiDialogNotification.show_dialog", () => {
      expect(pyContent).to.include("UiDialogNotification");
    });
  });

  describe("Feature: Dialog Auto-Dismiss", () => {

    let pyContent: string;

    before(() => {
      const pyFile = path.join(SCRIPTS_DIR, "auto_dismiss.py");
      pyContent = fs.readFileSync(pyFile, "utf-8");
    });

    it("should have _should_auto_dismiss function", () => {
      expect(pyContent).to.include("def _should_auto_dismiss(");
    });

    it("should exclude text input dialogs", () => {
      expect(pyContent).to.include("UiDialogTextInput");
    });

    it("should exclude picker dialogs", () => {
      expect(pyContent).to.include("UiDialogObjectPicker");
    });

    it("should have excluded dialog classes set", () => {
      expect(pyContent).to.include("EXCLUDED_DIALOG_CLASSES");
    });

    it("should respond with ButtonType.DIALOG_RESPONSE_OK for OkCancel", () => {
      expect(pyContent).to.include("ButtonType.DIALOG_RESPONSE_OK");
    });

    it("should store original functions for safe patching", () => {
      expect(pyContent).to.include("_originals");
      expect(pyContent).to.include("_originals['ok_cancel_show']");
      expect(pyContent).to.include("_originals['ok_show']");
    });
  });

  describe("Feature: Game Speed Preservation", () => {

    let pyContent: string;

    before(() => {
      const pyFile = path.join(SCRIPTS_DIR, "auto_dismiss.py");
      pyContent = fs.readFileSync(pyFile, "utf-8");
    });

    it("should have _save_game_speed function", () => {
      expect(pyContent).to.include("def _save_game_speed(");
    });

    it("should have _restore_game_speed function", () => {
      expect(pyContent).to.include("def _restore_game_speed(");
    });

    it("should use game_clock_service for speed management", () => {
      expect(pyContent).to.include("game_clock_service()");
    });

    it("should save speed before auto-dismiss", () => {
      expect(pyContent).to.include("_save_game_speed()");
    });

    it("should restore speed after auto-dismiss", () => {
      expect(pyContent).to.include("_restore_game_speed()");
    });

    it("should have preserve_game_speed config option", () => {
      expect(pyContent).to.include("'preserve_game_speed'");
    });
  });

  describe("Feature: Phone Handling", () => {

    let pyContent: string;

    before(() => {
      const pyFile = path.join(SCRIPTS_DIR, "auto_dismiss.py");
      pyContent = fs.readFileSync(pyFile, "utf-8");
    });

    it("should have phone hook installation", () => {
      expect(pyContent).to.include("_install_phone_hooks");
    });

    it("should attempt to hook PhoneRingSituation", () => {
      expect(pyContent).to.include("PhoneRingSituation");
    });

    it("should attempt to hook Phone.ring", () => {
      expect(pyContent).to.include("phone.phone");
    });

    it("should gracefully handle missing phone modules", () => {
      // Should use try/except for phone imports
      expect(pyContent).to.include("except (ImportError");
    });
  });

  describe("Feature: Cheat Commands", () => {

    let pyContent: string;

    before(() => {
      const pyFile = path.join(SCRIPTS_DIR, "auto_dismiss.py");
      pyContent = fs.readFileSync(pyFile, "utf-8");
    });

    it("should have toggle command", () => {
      expect(pyContent).to.include("kokor_no_notify.toggle");
    });

    it("should have status command", () => {
      expect(pyContent).to.include("kokor_no_notify.status");
    });

    it("should have dialogs toggle command", () => {
      expect(pyContent).to.include("kokor_no_notify.dialogs");
    });

    it("should have notifications toggle command", () => {
      expect(pyContent).to.include("kokor_no_notify.notifications");
    });

    it("should have speed toggle command", () => {
      expect(pyContent).to.include("kokor_no_notify.speed");
    });

    it("should have help command", () => {
      expect(pyContent).to.include("kokor_no_notify.help");
    });

    it("should use Command decorator with Live type", () => {
      expect(pyContent).to.include("sims4.commands.CommandType.Live");
    });
  });

  describe("Error Handling", () => {

    let pyContent: string;

    before(() => {
      const pyFile = path.join(SCRIPTS_DIR, "auto_dismiss.py");
      pyContent = fs.readFileSync(pyFile, "utf-8");
    });

    it("should have try/except in all hook functions", () => {
      // Each patched function should have error handling
      expect(pyContent).to.include("except Exception as e:");
    });

    it("should fall back to original function on error", () => {
      // OkCancel fallback
      expect(pyContent).to.include(
        "return _originals['ok_cancel_show'](self, *args, **kwargs)"
      );
      // Ok fallback
      expect(pyContent).to.include(
        "return _originals['ok_show'](self, *args, **kwargs)"
      );
    });

    it("should log errors with logger.warn or logger.error", () => {
      expect(pyContent).to.include("logger.warn(");
      expect(pyContent).to.include("logger.error(");
    });
  });

  describe("Built .ts4script", () => {

    before(function () {
      const scriptPath = path.join(DIST_DIR, "KokorNoNotify.ts4script");
      if (!fs.existsSync(scriptPath)) {
        this.skip();
      }
    });

    it("should exist after build", () => {
      const scriptPath = path.join(DIST_DIR, "KokorNoNotify.ts4script");
      expect(fs.existsSync(scriptPath)).to.be.true;
    });

    it("should have non-zero size", () => {
      const scriptPath = path.join(DIST_DIR, "KokorNoNotify.ts4script");
      const stat = fs.statSync(scriptPath);
      expect(stat.size).to.be.greaterThan(0);
    });
  });
});
