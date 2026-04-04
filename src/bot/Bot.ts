/**
 * 功能概述：定义 Dummy AI 的统一接口。
 * 输入输出：输入当前游戏状态；输出一个可执行动作或空值。
 * 处理流程：由具体 Bot 实现“读取合法动作 -> 选择动作”的策略。
 */

import type { GameAction } from "../state/actionTypes";
import type { GameState } from "../state/gameState";

export interface Bot {
  getMove(game: GameState, playerId: string): GameAction | null;
}
