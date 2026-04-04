/**
 * 功能概述：定义 Bot、引擎与未来 UI 之间交换的动作类型。
 * 输入输出：不接收运行时输入；导出一组显式联合类型供状态机消费。
 * 处理流程：把基础版第一部分会用到的动作收敛成少量稳定分支，方便测试和回放。
 */

import type { ActionTileId } from "../data/setup/actionTiles";

export type GameAction =
  | { type: "select-action-tile"; playerId: string; tileId: ActionTileId }
  | { type: "finish-build"; playerId: string }
  | {
      type: "place-track";
      playerId: string;
      hexId: string;
      tileId: string;
      rotation: number;
    }
  | { type: "deliver-goods"; playerId: string; candidateId: string }
  | { type: "upgrade-locomotive"; playerId: string }
  | { type: "pass-move"; playerId: string }
  | { type: "resolve-income"; playerId: string }
  | { type: "advance-turn-order" }
  | { type: "set-up-next-turn" };

