/**
 * 功能概述：作为最小 smoke 入口，验证工程依赖和引擎主入口能被加载。
 * 输入输出：读取创建游戏入口；输出简单的局面摘要。
 * 处理流程：创建一个基础版对局，读取 committed 状态，再打印地图名、玩家数与当前阶段。
 */

import { createGame } from "../src/engine/createGame";

const session = createGame({
  playerNames: ["Ada", "Babbage", "Curie"],
  mapId: "ne-usa-se-canada",
  mode: "base",
});
const game = session.committed;

console.log(`地图: ${game.map.definition.name}`);
console.log(`玩家数: ${game.players.length}`);
console.log(`当前阶段: ${game.turn.phase}`);
