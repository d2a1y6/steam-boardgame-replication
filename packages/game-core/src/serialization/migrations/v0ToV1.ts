/**
 * 功能概述：把没有正式 schemaVersion 的旧快照提升为 v1 快照。
 * 输入输出：输入 v0 结构；输出带 v1 版本号的标准快照。
 * 处理流程：保留会话与回放内容，只补齐当前 schemaVersion。
 */

import type { SaveSnapshotV0, SaveSnapshotV1 } from "../../contracts/save";
import { cloneState } from "../../utils";

export function migrateV0ToV1(snapshot: SaveSnapshotV0): SaveSnapshotV1 {
  return {
    schemaVersion: 1,
    session: cloneState(snapshot.session),
    replayFrames: cloneState(snapshot.replayFrames),
  };
}
