/**
 * 功能概述：作为“合法动作查询”聚合入口，统一导出按领域拆分后的只读查询模块。
 * 输入输出：不直接接收运行时输入；向外暴露行动牌、建轨、运货、顺位和库存相关查询。
 * 处理流程：把原本膨胀在单文件里的查询按领域拆开，再通过一个稳定入口重新汇总。
 */

export * from "./actionTileQueries";
export * from "./tilePoolQueries";
export * from "./trackQueries";
export * from "./deliveryQueries";
export * from "./turnQueries";
