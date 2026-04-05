/**
 * 功能概述：定义 Bot、引擎与未来 UI 之间交换的动作类型。
 * 输入输出：不接收运行时输入；导出一组显式联合类型供状态机消费。
 * 处理流程：把基础版第一部分会用到的动作收敛成少量稳定分支，方便测试和回放。
 */

import type { ActionTileId } from "../contracts/domain";

export type GameAction =
  | {
      type: "select-action-tile";
      playerId: string;
      tileId: ActionTileId;
      usePassOption?: boolean;
    }
  | {
      type: "perform-city-growth";
      playerId: string;
      cityHexId: string;
      supplyGroupId: string;
    }
  | {
      type: "perform-urbanization";
      playerId: string;
      townHexId: string;
      newCityColor: string;
      supplyGroupId: string;
    }
  | { type: "finish-build"; playerId: string }
  | {
      type: "place-track";
      playerId: string;
      hexId: string;
      tileId: string;
      rotation: number;
    }
  | { type: "deliver-goods"; playerId: string; candidateId: string }
  | {
      type: "choose-track-points-destination";
      playerId: string;
      destination: "income" | "victory-points";
    }
  | { type: "upgrade-locomotive"; playerId: string }
  | { type: "pass-move"; playerId: string }
  | { type: "buy-capital"; playerId: string; steps: number }
  | { type: "place-auction-bid"; playerId: string; bid: number }
  | { type: "pass-auction"; playerId: string }
  | { type: "resolve-income"; playerId: string }
  | { type: "advance-turn-order" }
  | { type: "set-up-next-turn" };
