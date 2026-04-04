/**
 * 功能概述：提供第一阶段最小格式化函数。
 * 输入输出：输入金额、阶段或分数；输出界面可读文本。
 * 处理流程：统一常见文案格式。
 */

export function formatMoney(amount: number) {
  return `$${amount}`;
}

export function formatPhase(phase: string) {
  return phase;
}
