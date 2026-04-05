/**
 * 功能概述：计算终局分数，并给出当前领先者。
 * 输入输出：输入完整游戏状态；输出每位玩家终局得分。
 * 处理流程：先做收入换分，再做完整 link 计分，最后处理平分比较。
 */

import type { GameState } from "../state/gameState";

export function calculateFinalScores(game: GameState) {
  return game.players.map((player) => {
    const incomePoints =
      player.income > 0 ? Math.floor(player.income / 2) : player.income < 0 ? player.income * 2 : 0;
    const linkPoints = game.map.links.filter((link) => link.complete && link.ownerId === player.id).length;
    return {
      playerId: player.id,
      total: player.victoryPoints + incomePoints + linkPoints,
      income: player.income,
    };
  });
}

export function getWinner(game: GameState) {
  return calculateFinalScores(game).sort((left, right) => {
    if (right.total !== left.total) {
      return right.total - left.total;
    }
    return right.income - left.income;
  })[0];
}
