/**
 * 功能概述：生成稳定的简单业务 id。
 * 输入输出：输入前缀与序号；输出拼接后的稳定 id。
 * 处理流程：避免在业务层散落拼接规则。
 */

export function makeId(prefix: string, index: number) {
  return `${prefix}-${index}`;
}
