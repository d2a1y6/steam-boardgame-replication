/**
 * 功能概述：提供引擎内部使用的最小断言工具。
 * 输入输出：输入条件与消息；条件不满足时抛错。
 * 处理流程：集中处理内部不变量失败。
 */

export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}
