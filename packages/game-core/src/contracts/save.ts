/**
 * 功能概述：定义版本化存档结构，供序列化层和浏览器存档仓库共用。
 * 输入输出：不接收运行时输入；导出带 schemaVersion 的快照类型。
 * 处理流程：把会话与回放帧打包成稳定快照，并为未来迁移预留版本号。
 */

import type { ReplayFrame } from "../replay/replay";
import type { EngineSession } from "./engine";

export interface SaveSnapshotV0 {
  readonly schemaVersion?: 0;
  readonly session: EngineSession;
  readonly replayFrames: readonly ReplayFrame[];
}

export interface SaveSnapshotV1 {
  readonly schemaVersion: 1;
  readonly session: EngineSession;
  readonly replayFrames: readonly ReplayFrame[];
}

export interface SaveSnapshotV2 {
  readonly schemaVersion: 2;
  readonly session: EngineSession;
  readonly replayFrames: readonly ReplayFrame[];
}

export type SaveSnapshot = SaveSnapshotV2;

export type PersistedSaveSnapshot = SaveSnapshotV0 | SaveSnapshotV1 | SaveSnapshotV2;
