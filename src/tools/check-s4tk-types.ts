/**
 * S4TK が認識している Resource Type ID を調査
 */
import { BinaryResourceType, TuningResourceType } from "@s4tk/models/enums/index.js";

console.log("=== BinaryResourceType (S4TK が SimData として扱うもの) ===");
for (const [key, value] of Object.entries(BinaryResourceType)) {
  if (typeof value === "number") {
    console.log(`  ${key}: 0x${value.toString(16)}`);
  }
}

console.log("\n=== TuningResourceType (S4TK が Tuning XML として扱うもの) ===");
for (const [key, value] of Object.entries(TuningResourceType)) {
  if (typeof value === "number") {
    console.log(`  ${key}: 0x${value.toString(16)}`);
  }
}

// 問題の Type ID を確認
const TRAIT_TYPE = 0x339bc5bd;
const BUFF_TYPE = 0xcb5fddc7;

console.log("\n=== 問題の Type ID の確認 ===");
console.log(`Trait (0x339bc5bd): BinaryResourceType? ${Object.values(BinaryResourceType).includes(TRAIT_TYPE)}`);
console.log(`Buff (0xcb5fddc7): BinaryResourceType? ${Object.values(BinaryResourceType).includes(BUFF_TYPE)}`);
console.log(`Trait (0x339bc5bd): TuningResourceType? ${Object.values(TuningResourceType).includes(TRAIT_TYPE)}`);
console.log(`Buff (0xcb5fddc7): TuningResourceType? ${Object.values(TuningResourceType).includes(BUFF_TYPE)}`);
