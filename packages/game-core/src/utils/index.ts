/**
 * 引擎内部工具。
 * 输入是状态对象或数组，输出是可安全继续加工的浅层结构。
 * 这里集中放克隆和集合转换，避免核心流程里重复写样板代码。
 */

export function cloneState<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

export function replaceAt<T>(items: readonly T[], index: number, next: T): T[] {
  return items.map((item, itemIndex) => (itemIndex === index ? next : item));
}

export function upsertByKey<T>(items: readonly T[], key: keyof T, value: T): T[] {
  return items.map((item) => (item[key] === value[key] ? value : item));
}

/**
 * 功能概述：创建一个轻量、可复现的伪随机数生成器。
 * 输入输出：输入一个整数 seed；输出范围在 [0, 1) 的随机函数。
 * 处理流程：使用 Mulberry32 生成器，兼顾实现简单和测试可复现。
 */
export function createSeededRandom(seed: number) {
  let current = seed >>> 0;
  return () => {
    current += 0x6d2b79f5;
    let value = Math.imul(current ^ (current >>> 15), current | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 功能概述：按给定随机函数打乱一个数组。
 * 输入输出：输入原数组和随机函数；输出一份新顺序数组。
 * 处理流程：使用 Fisher-Yates 洗牌，避免原地修改调用方数组。
 */
export function shuffleArray<T>(items: readonly T[], random: () => number): T[] {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const targetIndex = Math.floor(random() * (index + 1));
    [next[index], next[targetIndex]] = [next[targetIndex]!, next[index]!];
  }
  return next;
}
