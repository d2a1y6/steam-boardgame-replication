/**
 * 功能概述：从版本化快照恢复会话与回放。
 * 输入输出：输入持久化快照；输出可继续运行的会话与回放帧。
 * 处理流程：先应用迁移链路，再校验当前 schema，最后返回深拷贝避免直接改写持久化对象。
 */

import type { PersistedSaveSnapshot, SaveSnapshot } from "../contracts/save";
import { cloneState } from "../utils";
import { SAVE_SCHEMA_VERSION } from "./schemaVersion";
import { applyMigrations } from "./migrations/applyMigrations";

export function deserializeSession(snapshot: PersistedSaveSnapshot): SaveSnapshot {
  const migrated = applyMigrations(snapshot);
  if (migrated.schemaVersion !== SAVE_SCHEMA_VERSION) {
    throw new Error(`迁移后的存档版本不受支持：${migrated.schemaVersion}`);
  }

  return cloneState(migrated);
}
