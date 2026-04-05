/**
 * 功能概述：把当前会话与回放帧打包成可持久化的版本化快照。
 * 输入输出：输入引擎会话与回放数组；输出结构化存档快照。
 * 处理流程：写入 schema version，再深拷贝会话与回放，避免调用方共享引用。
 */

import type { ReplayFrame } from "../replay/replay";
import type { SaveSnapshot } from "../contracts/save";
import type { EngineSession } from "../contracts/engine";
import { cloneState } from "../utils";
import { SAVE_SCHEMA_VERSION } from "./schemaVersion";

export function serializeSession(session: EngineSession, replayFrames: readonly ReplayFrame[]): SaveSnapshot {
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    session: cloneState(session),
    replayFrames: cloneState(replayFrames),
  };
}
