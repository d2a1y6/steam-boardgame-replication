/**
 * 功能概述：把 v1 快照迁移到 v2 快照。
 * 输入输出：输入 v1 结构；输出带 v2 版本号的标准快照。
 * 处理流程：当前两版存档字段兼容，因此只提升版本号并返回深拷贝。
 */

import type { SaveSnapshot, SaveSnapshotV1 } from "../../contracts/save";
import { cloneState } from "../../utils";

export function migrateV1ToV2(snapshot: SaveSnapshotV1): SaveSnapshot {
  return {
    schemaVersion: 2,
    session: cloneState(snapshot.session),
    replayFrames: cloneState(snapshot.replayFrames),
  };
}
