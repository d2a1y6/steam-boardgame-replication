/**
 * 功能概述：根据 schemaVersion 把持久化快照迁移到当前版本。
 * 输入输出：输入任意受支持的持久化快照；输出当前版本的标准快照。
 * 处理流程：先识别输入版本，再执行对应迁移函数，最终统一落到当前 schema。
 */

import type { PersistedSaveSnapshot, SaveSnapshot, SaveSnapshotV0, SaveSnapshotV1, SaveSnapshotV2 } from "../../contracts/save";
import { migrateV0ToV1 } from "./v0ToV1";
import { migrateV1ToV2 } from "./v1ToV2";

function detectSchemaVersion(snapshot: PersistedSaveSnapshot) {
  return snapshot.schemaVersion ?? 0;
}

function isV0Snapshot(snapshot: PersistedSaveSnapshot): snapshot is SaveSnapshotV0 {
  return detectSchemaVersion(snapshot) === 0;
}

function isV1Snapshot(snapshot: PersistedSaveSnapshot): snapshot is SaveSnapshotV1 {
  return detectSchemaVersion(snapshot) === 1;
}

function isV2Snapshot(snapshot: PersistedSaveSnapshot): snapshot is SaveSnapshotV2 {
  return detectSchemaVersion(snapshot) === 2;
}

export function applyMigrations(snapshot: PersistedSaveSnapshot): SaveSnapshot {
  if (isV0Snapshot(snapshot)) {
    return migrateV1ToV2(migrateV0ToV1(snapshot));
  }

  if (isV1Snapshot(snapshot)) {
    return migrateV1ToV2(snapshot);
  }

  if (isV2Snapshot(snapshot)) {
    return snapshot;
  }

  switch (detectSchemaVersion(snapshot)) {
    case 0:
    case 1:
    case 2:
      break;
    default:
      throw new Error(`不支持的存档版本：${detectSchemaVersion(snapshot)}`);
  }

  throw new Error(`不支持的存档版本：${detectSchemaVersion(snapshot)}`);
}
