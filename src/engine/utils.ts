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
