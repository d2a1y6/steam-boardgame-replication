/**
 * 功能概述：提供仓库统一使用的默认玩家名字映射。
 * 输入输出：输入一个从 0 开始的索引或数量；输出稳定的玩家名字。
 * 处理流程：先使用 26 个基础名字，再按 26 个前缀与基础名字配对，最后进入无限的 You Win 序列。
 */

export const BASE_PLAYER_NAMES = [
  "Alice",
  "Bob",
  "Carol",
  "Dave",
  "Eve",
  "Francis",
  "Grace",
  "Hans",
  "Isabella",
  "Jason",
  "Kate",
  "Louis",
  "Margaret",
  "Nathan",
  "Olivia",
  "Paul",
  "Queen",
  "Richard",
  "Susan",
  "Thomas",
  "Uma",
  "Vivian",
  "Winnie",
  "Xander",
  "Yasmine",
  "Zach",
] as const;

export const PLAYER_NAME_PREFIXES = [
  "Angry",
  "Baby",
  "Crazy",
  "Diligent",
  "Excited",
  "Fat",
  "Greedy",
  "Hungry",
  "Interesting",
  "Jolly",
  "Kind",
  "Little",
  "Magic",
  "Naïve",
  "Old",
  "Powerful",
  "Quite",
  "Rich",
  "Superman",
  "THU",
  "Undefined",
  "Valuable",
  "Wifeless",
  "Xiangbuchulai",
  "Young",
  "Zombie",
] as const;

const BASE_NAME_COUNT = BASE_PLAYER_NAMES.length;
const PREFIXED_NAME_COUNT = PLAYER_NAME_PREFIXES.length * BASE_NAME_COUNT;
const FIRST_YOU_WIN_NUMBER = 702;

/**
 * 功能：根据 0 开始的索引返回一个默认玩家名字。
 * 参数：`index` 是名字编号，从 0 开始。
 * 返回：基础名字、前缀配对名字，或无限延展的 You Win 名字。
 * 逻辑：按用户约定的顺序映射，并保留第一个兜底名字为 `You Win 702`。
 */
export function getDefaultPlayerName(index: number): string {
  if (!Number.isInteger(index) || index < 0) {
    throw new Error("player name index must be a non-negative integer");
  }

  if (index < BASE_NAME_COUNT) {
    return BASE_PLAYER_NAMES[index]!;
  }

  const prefixedIndex = index - BASE_NAME_COUNT;
  if (prefixedIndex < PREFIXED_NAME_COUNT) {
    const prefix = PLAYER_NAME_PREFIXES[Math.floor(prefixedIndex / BASE_NAME_COUNT)]!;
    const baseName = BASE_PLAYER_NAMES[prefixedIndex % BASE_NAME_COUNT]!;
    return `${prefix} ${baseName}`;
  }

  return `You Win ${FIRST_YOU_WIN_NUMBER + (prefixedIndex - PREFIXED_NAME_COUNT)}`;
}

/**
 * 功能：生成前若干个默认玩家名字。
 * 参数：`count` 是需要的名字数量，`offset` 是起始索引。
 * 返回：长度固定、顺序稳定的名字数组。
 * 逻辑：复用单个索引映射，适合初始化新对局的玩家列表。
 */
export function buildDefaultPlayerNames(count: number, offset = 0): string[] {
  if (!Number.isInteger(count) || count < 0) {
    throw new Error("player name count must be a non-negative integer");
  }

  return Array.from({ length: count }, (_, index) => getDefaultPlayerName(offset + index));
}
