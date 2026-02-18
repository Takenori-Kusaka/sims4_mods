/**
 * Package Validator
 * 
 * ビルドされた .package ファイルの構造を検証するユーティリティ。
 * Resource Type ID、Group、Instance ID の正当性をチェックする。
 */

import { Package } from "@s4tk/models";
import { 
  TUNING_TYPE_IDS, 
  TYPE_ID_NAMES, 
  STBL_TYPE_ID, 
  GENERIC_TUNING_TYPE_ID,
  getTypeIdName 
} from "../constants/tuning-types.js";

/**
 * 検証結果
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  info: string[];
}

/**
 * リソースエントリの期待される構造
 */
export interface ExpectedResource {
  tuningClass: string;  // "trait", "buff", etc.
  fileName: string;
}

/**
 * Package の構造を検証
 * @param pkg 検証する Package
 * @param expectedResources 期待されるリソースの一覧（オプション）
 * @returns 検証結果
 */
export function validatePackage(
  pkg: Package, 
  expectedResources?: ExpectedResource[]
): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    info: [],
  };

  const validTypeIds = new Set(Object.values(TUNING_TYPE_IDS));
  validTypeIds.add(STBL_TYPE_ID);

  let index = 0;
  for (const entry of pkg.entries) {
    const key = entry.key;
    const typeHex = `0x${key.type.toString(16).padStart(8, '0')}`;
    const groupHex = `0x${key.group.toString(16).padStart(8, '0')}`;
    const instanceHex = `0x${key.instance.toString(16).padStart(16, '0')}`;

    // Type ID 検証
    if (key.type === GENERIC_TUNING_TYPE_ID) {
      result.errors.push(
        `[Entry ${index}] Generic Tuning Type ID (${typeHex}) が使用されています。` +
        `正しい Type ID (Trait=0x339bc5bd, Buff=0xcb5fddc7 等) を使用してください。`
      );
      result.valid = false;
    } else if (!validTypeIds.has(key.type) && key.type !== STBL_TYPE_ID) {
      result.warnings.push(
        `[Entry ${index}] 未知の Type ID: ${typeHex} (${getTypeIdName(key.type)})`
      );
    }

    // Tuning リソースの Group 検証（StringTable以外）
    if (key.type !== STBL_TYPE_ID && key.group !== 0x00000000) {
      result.warnings.push(
        `[Entry ${index}] Tuning リソースの Group は 0x00000000 であるべきですが、` +
        `${groupHex} が設定されています。`
      );
    }

    // Instance ID の High Bit 検証
    const highBit = BigInt(key.instance) & BigInt("0x8000000000000000");
    if (highBit === BigInt(0)) {
      result.warnings.push(
        `[Entry ${index}] Instance ID (${instanceHex}) の最上位ビットが設定されていません。` +
        `カスタムコンテンツでは最上位ビットを1にすることが推奨されます。`
      );
    }

    result.info.push(
      `[Entry ${index}] Type: ${typeHex} (${getTypeIdName(key.type)}) | ` +
      `Group: ${groupHex} | Instance: ${instanceHex}`
    );

    index++;
  }

  // 期待されるリソースとの照合
  if (expectedResources) {
    const foundTypes = new Set<number>();
    for (const entry of pkg.entries) {
      foundTypes.add(entry.key.type);
    }

    for (const expected of expectedResources) {
      const expectedTypeId = TUNING_TYPE_IDS[expected.tuningClass.toLowerCase()];
      if (expectedTypeId && !foundTypes.has(expectedTypeId)) {
        result.errors.push(
          `期待される ${expected.tuningClass} リソース (${expected.fileName}) が見つかりません。` +
          `Type ID: 0x${expectedTypeId.toString(16)}`
        );
        result.valid = false;
      }
    }
  }

  return result;
}

/**
 * 検証結果をコンソールに出力
 */
export function printValidationResult(result: ValidationResult): void {
  console.log("\n=== Package Validation Result ===\n");

  if (result.errors.length > 0) {
    console.log("❌ ERRORS:");
    for (const error of result.errors) {
      console.log(`   ${error}`);
    }
  }

  if (result.warnings.length > 0) {
    console.log("\n⚠️  WARNINGS:");
    for (const warning of result.warnings) {
      console.log(`   ${warning}`);
    }
  }

  if (result.info.length > 0) {
    console.log("\nℹ️  INFO:");
    for (const info of result.info) {
      console.log(`   ${info}`);
    }
  }

  console.log("\n" + "=".repeat(40));
  console.log(result.valid ? "✅ Validation PASSED" : "❌ Validation FAILED");
  console.log("=".repeat(40) + "\n");
}
