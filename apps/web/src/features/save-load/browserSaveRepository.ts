/**
 * 功能概述：提供本地浏览器里的存档、载入和删除能力。
 * 输入输出：输入会话、回放帧与标签；输出存档列表或单个存档内容。
 * 处理流程：先解析可用的存储适配器，再通过 core 的序列化 API 生成版本化快照并持久化。
 */

import { deserializeSession, serializeSession, type EngineSession, type ReplayFrame, type SaveSnapshot } from "@steam/game-core";

const STORAGE_KEY = "steam-boardgame-replication:saves:v1";
const memoryStorage = new Map<string, string>();

export interface SavedGameEntry {
  id: string;
  label: string;
  savedAt: string;
  mapName: string;
  mode: string;
  round: number;
  phase: string;
  players: string[];
}

export interface SavedGameRecord extends SavedGameEntry {
  session: EngineSession;
  replayFrames: ReplayFrame[];
}

interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear?(): void;
}

function createMemoryStorageAdapter(): StorageAdapter {
  return {
    getItem(key) {
      return memoryStorage.get(key) ?? null;
    },
    setItem(key, value) {
      memoryStorage.set(key, value);
    },
    removeItem(key) {
      memoryStorage.delete(key);
    },
    clear() {
      memoryStorage.clear();
    },
  };
}

function resolveStorage(): StorageAdapter {
  if (typeof window === "undefined") {
    return createMemoryStorageAdapter();
  }

  const candidate = (window as { localStorage?: Partial<StorageAdapter> }).localStorage;
  if (
    candidate
    && typeof candidate.getItem === "function"
    && typeof candidate.setItem === "function"
    && typeof candidate.removeItem === "function"
  ) {
    return candidate as StorageAdapter;
  }

  return createMemoryStorageAdapter();
}

function readAllRecords(): SavedGameRecord[] {
  const storage = resolveStorage();
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return (JSON.parse(raw) as Array<SavedGameEntry & { snapshot: SaveSnapshot }>)
      .map(({ snapshot, ...entry }) => {
        const restored = deserializeSession(snapshot);
        return {
          ...entry,
          session: restored.session,
          replayFrames: [...restored.replayFrames],
        };
      });
  } catch {
    return [];
  }
}

function writeAllRecords(records: SavedGameRecord[]) {
  const storage = resolveStorage();
  storage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      records.map(({ session, replayFrames, ...entry }) => ({
        ...entry,
        snapshot: serializeSession(session, replayFrames),
      })),
    ),
  );
}

/**
 * 功能：列出当前所有本地存档的摘要。
 * 参数：无。
 * 返回：按时间倒序排列的存档信息。
 * 逻辑：只返回摘要，真正的会话数据在加载时再取。
 */
export function listSavedGames(): SavedGameEntry[] {
  return readAllRecords()
    .sort((left, right) => right.savedAt.localeCompare(left.savedAt))
    .map(({ session: _session, replayFrames: _replayFrames, ...entry }) => entry);
}

/**
 * 功能：保存当前对局。
 * 参数：`session` 是当前会话，`replayFrames` 是当前回放时间线，`label` 是存档名。
 * 返回：新生成的存档摘要。
 * 逻辑：每次保存都写入一条完整记录，而不是覆盖旧存档。
 */
export function saveGame(session: EngineSession, replayFrames: ReplayFrame[], label: string): SavedGameEntry {
  const game = session.draft?.working ?? session.committed;
  const record: SavedGameRecord = {
    id: `save-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label,
    savedAt: new Date().toISOString(),
    mapName: game.map.definition.name,
    mode: game.mode,
    round: game.turn.round,
    phase: game.turn.phase,
    players: game.players.map((player) => player.name),
    session,
    replayFrames: [...replayFrames],
  };

  writeAllRecords([record, ...readAllRecords()]);
  const { session: _session, replayFrames: _replayFrames, ...entry } = record;
  return entry;
}

/**
 * 功能：读取指定存档的完整内容。
 * 参数：`id` 是存档 id。
 * 返回：存档全文，若找不到则返回 null。
 * 逻辑：加载后返回深拷贝，避免界面直接改坏本地持久化数据。
 */
export function loadSavedGame(id: string): SavedGameRecord | null {
  const record = readAllRecords().find((item) => item.id === id);
  if (!record) {
    return null;
  }

  const restored = deserializeSession(serializeSession(record.session, record.replayFrames));
  return {
    ...record,
    session: restored.session,
    replayFrames: [...restored.replayFrames],
  };
}

/**
 * 功能：删除一个本地存档。
 * 参数：`id` 是目标存档 id。
 * 返回：删除后的剩余存档摘要。
 * 逻辑：直接重写存档列表，并返回新的摘要集合方便界面刷新。
 */
export function deleteSavedGame(id: string): SavedGameEntry[] {
  writeAllRecords(readAllRecords().filter((item) => item.id !== id));
  return listSavedGames();
}

/**
 * 功能：清空当前存档仓库。
 * 参数：无。
 * 返回：无。
 * 逻辑：测试与调试通过同一套兼容存储适配器清空状态，而不是直接触碰宿主的 localStorage。
 */
export function clearSavedGamesStorage() {
  const storage = resolveStorage();
  if (typeof storage.clear === "function") {
    storage.clear();
    return;
  }
  storage.removeItem(STORAGE_KEY);
}
