/**
 * 功能概述：封装收入阶段对单个玩家的处理。
 * 输入输出：输入玩家；输出已完成本阶段结算的新玩家状态。
 * 处理流程：若收入为正则拿钱，若收入为负则按融资规则支付。
 */

import type { GameMode } from "../contracts/domain";
import type { PlayerState } from "../state/gameState";
import { resolveIncome as settleIncome } from "./finance";

export function resolvePlayerIncome(player: PlayerState, mode: GameMode) {
  return settleIncome(player, mode);
}
