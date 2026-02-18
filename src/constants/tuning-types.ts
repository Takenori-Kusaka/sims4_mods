/**
 * Sims 4 Tuning Resource Type IDs
 * 
 * 各チューニングタイプに対応する正しい Resource Type ID を定義。
 * 参考: https://lot51.cc/tdesc (TDESC Browser)
 * 
 * これらの値は絶対に変更しないこと。間違った Type ID は MOD が
 * ゲームに認識されない原因となる。
 */

/**
 * チューニングタイプごとの Resource Type ID マッピング
 */
export const TUNING_TYPE_IDS: Readonly<Record<string, number>> = {
  // === Core Gameplay Tuning ===
  "trait": 0x339bc5bd,
  "buff": 0xcb5fddc7,
  
  // === Interactions ===
  "interaction": 0xe882d22f,
  "super_interaction": 0xe882d22f,
  "mixer_interaction": 0xe882d22f,
  "social_mixer_interaction": 0xe882d22f,
  "immediate_interaction": 0xe882d22f,
  "picker_interaction": 0xe882d22f,
  "object_interaction": 0xe882d22f,
  "terrain_interaction": 0xe882d22f,
  "phone_interaction": 0xe882d22f,
  
  // === Loot & Actions ===
  "loot": 0xb8bf1a63,
  "loot_actions": 0xb8bf1a63,
  "action": 0x0c772e27,
  
  // === Objects & UI ===
  "object": 0xb61de6b4,
  "snippet": 0x7df2169c,
  "aspiration": 0x09f53c2e,
  "career": 0x0966618e,
  "career_level": 0x018dc38a,
  "career_track": 0x0966618e,
  "whim_set": 0x0beb56e0,
  "mood": 0xa94eef44,
  "motive": 0x339bc5bd,
  "statistic": 0x339bc5bd,
  "skill": 0x339bc5bd,
  
  // === Situations ===
  "situation": 0xea5e64ab,
  "situation_job": 0x83c6aa55,
  "situation_goal": 0x5b38de7c,
  
  // === Tests & Conditions ===
  "test_set": 0x8b18ff6e,
  "test_based_score": 0x8b18ff6e,
} as const;

/**
 * 既知の Resource Type ID から人間が読める名前へのマッピング
 */
export const TYPE_ID_NAMES: Readonly<Record<number, string>> = {
  0x339bc5bd: "Trait/Statistic/Skill",
  0xcb5fddc7: "Buff",
  0xe882d22f: "Interaction",
  0xb8bf1a63: "Loot/LootActions",
  0x0c772e27: "Action",
  0xb61de6b4: "Object",
  0x7df2169c: "Snippet",
  0x09f53c2e: "Aspiration",
  0x0966618e: "Career/CareerTrack",
  0x018dc38a: "CareerLevel",
  0x0beb56e0: "WhimSet",
  0xa94eef44: "Mood",
  0xea5e64ab: "Situation",
  0x83c6aa55: "SituationJob",
  0x5b38de7c: "SituationGoal",
  0x8b18ff6e: "TestSet/TestBasedScore",
  0x545ac67a: "StringTable (STBL)",
  0x03b33006: "Generic XML Tuning (AVOID)",
} as const;

/**
 * StringTable の Resource Type ID
 */
export const STBL_TYPE_ID = 0x545ac67a;

/**
 * 汎用XML Tuning の Type ID（使用非推奨）
 * この値が使われている場合は警告を出すべき
 */
export const GENERIC_TUNING_TYPE_ID = 0x03b33006;

/**
 * チューニングタイプ名から Resource Type ID を取得
 * @param tuningClass XMLの c= 属性の値（小文字化済み）
 * @returns Resource Type ID、または未知の場合は undefined
 */
export function getTuningTypeId(tuningClass: string): number | undefined {
  return TUNING_TYPE_IDS[tuningClass.toLowerCase()];
}

/**
 * Resource Type ID が既知の値かどうかを検証
 * @param typeId 検証する Type ID
 * @returns 既知なら true
 */
export function isKnownTypeId(typeId: number): boolean {
  return typeId in TYPE_ID_NAMES;
}

/**
 * Resource Type ID の人間が読める名前を取得
 * @param typeId Type ID
 * @returns 名前、または "Unknown (0x...)"
 */
export function getTypeIdName(typeId: number): string {
  return TYPE_ID_NAMES[typeId] ?? `Unknown (0x${typeId.toString(16)})`;
}
