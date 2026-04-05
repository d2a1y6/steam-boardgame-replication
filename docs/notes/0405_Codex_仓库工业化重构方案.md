# Steam 仓库工业化重构方案

## 文档目标

本文档最初是本仓库结构重构的交付方案，目标是让后续工程实现可以直接照着执行。

当前这份文档已经进入“方案 + 实现日志”状态。前半部分保留重构前的问题分析和目标结构，便于理解这次工业化重构为什么必要；真正落地后的仓库情况以文末“实现日志”为准。

重构目标不是单纯“把目录改漂亮”，而是把当前仓库整理成一个更像专业 JavaScript / TypeScript 工程的形态，具体标准如下：

- Web 应用、规则核心、静态内容、工具脚本边界清楚
- 依赖方向单向且可由工具约束
- 核心逻辑不依赖浏览器环境
- 存档格式可版本化、可迁移
- 测试结构覆盖规则、不变量、场景回归
- 目录结构、公共导出和迁移顺序足够稳定，便于多人或多 AI 协作

---

## 当前仓库的结构和它存在的问题

这一章用于帮助后续 AI 或工程实现者快速理解当前仓库现状。

### 当前仓库结构图

```text
steam-boardgame-replication/
├── .DS_Store
├── .gitignore
├── AGENTS.md
├── README.md
├── environment.yml
├── index.html
├── package-lock.json
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.app.tsbuildinfo
├── tsconfig.node.json
├── tsconfig.node.tsbuildinfo
├── vite.config.ts
├── vitest.config.ts
├── docs/
│   ├── notes/
│   │   ├── .DS_Store
│   │   ├── 0404_Codex_Steam基础版规则详解.md
│   │   ├── 0404_Codex_Steam数字化实现方案.md
│   │   ├── 0404_Codex_Steam第一部分实现方案及日志.md
│   │   ├── 0405_Codex_Steam第二部分实现方案及日志.md
│   │   ├── 0405_Codex_Steam第三部分实现方案及日志.md
│   │   └── 0405_Codex_仓库工业化重构方案.md
│   └── references/
│       ├── .gitkeep
│       ├── player_aid.pdf
│       ├── quick_rules.doc
│       ├── rule_summary.doc
│       ├── rulebook_official.pdf
│       └── rulebook_scan.pdf
├── scripts/
│   ├── check-tile-pool.ts
│   ├── export-map-data.ts
│   ├── smoke-playthrough.ts
│   └── git-hooks/
│       └── pre-commit
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── styles.css
│   ├── bot/
│   │   ├── Bot.ts
│   │   ├── RandomBot.ts
│   │   └── botTurn.ts
│   ├── data/
│   │   ├── maps/
│   │   │   ├── ne_usa_se_canada.ts
│   │   │   └── ruhr.ts
│   │   ├── setup/
│   │   │   ├── actionTiles.ts
│   │   │   ├── goods.ts
│   │   │   └── newCities.ts
│   │   └── tiles/
│   │       ├── manifest.ts
│   │       └── shapes.ts
│   ├── engine/
│   │   ├── applyAction.ts
│   │   ├── createGame.ts
│   │   ├── draftSession.ts
│   │   ├── explanations.ts
│   │   ├── legalMoves.ts
│   │   ├── persistence.ts
│   │   ├── phaseMachine.ts
│   │   ├── previews.ts
│   │   ├── replay.ts
│   │   ├── selectors.ts
│   │   ├── types.ts
│   │   └── utils.ts
│   ├── map/
│   │   ├── hexMath.ts
│   │   ├── linkGraph.ts
│   │   ├── mapGraph.ts
│   │   ├── routeSearch.ts
│   │   ├── segmentGraph.ts
│   │   └── types.ts
│   ├── rules/
│   │   ├── auction.ts
│   │   ├── finance.ts
│   │   ├── goodsDelivery.ts
│   │   ├── income.ts
│   │   ├── routeRanking.ts
│   │   ├── scoring.ts
│   │   ├── tilePool.ts
│   │   ├── tokenAnchors.ts
│   │   ├── trackOwnership.ts
│   │   └── trackPlacement.ts
│   ├── rulesets/
│   │   ├── base.ts
│   │   └── standard.ts
│   ├── state/
│   │   ├── actionTypes.ts
│   │   ├── draftState.ts
│   │   ├── gameState.ts
│   │   └── initialState.ts
│   ├── ui/
│   │   ├── ActionHistoryPanel.tsx
│   │   ├── ActionTilePanel.tsx
│   │   ├── DeliveryCandidatePanel.tsx
│   │   ├── DeliveryPreview.tsx
│   │   ├── DeliverySourcePanel.tsx
│   │   ├── GameSetupPanel.tsx
│   │   ├── GameShell.tsx
│   │   ├── GoodsSupplyPanel.tsx
│   │   ├── IllegalMoveNotice.tsx
│   │   ├── LogPanel.tsx
│   │   ├── MapBoard.tsx
│   │   ├── PhasePanel.tsx
│   │   ├── PlayerPanel.tsx
│   │   ├── ReplayPanel.tsx
│   │   ├── RuleExplanationPanel.tsx
│   │   ├── RuleHintPanel.tsx
│   │   ├── SaveLoadPanel.tsx
│   │   ├── TilePoolPanel.tsx
│   │   ├── TrackPalettePanel.tsx
│   │   ├── TrackPlacementPanel.tsx
│   │   ├── TurnOrderPanel.tsx
│   │   ├── hexGeometry.ts
│   │   ├── jsx.d.ts
│   │   └── types.ts
│   └── utils/
│       ├── assert.ts
│       ├── format.ts
│       ├── ids.ts
│       └── playerNames.ts
└── tests/
    ├── bot.test.ts
    ├── buildDraftFlow.test.ts
    ├── deliveryWorkflow.test.ts
    ├── finance.test.ts
    ├── goodsDelivery.test.ts
    ├── humanActionSelection.test.ts
    ├── persistence.test.ts
    ├── playerNames.test.ts
    ├── replay.test.ts
    ├── routeRanking.test.ts
    ├── scoring.test.ts
    ├── specHelpers.ts
    ├── standardMode.test.ts
    ├── tilePool.test.ts
    ├── tokenAnchors.test.ts
    ├── trackPlacement.test.ts
    └── uiShell.test.tsx
```

### 当前结构的主要问题

#### 1. 一个 `src/` 下已经堆叠了多个子系统

当前 `src/` 实际上已经同时包含：

- 浏览器页面与交互
- 游戏规则核心
- 静态地图与组件数据
- 本地存档与回放
- Bot 与测试辅助逻辑

这说明当前仓库已经超过了“单一前端应用目录”最舒服的规模。

#### 2. `engine/` 混合了多类责任

`src/engine/` 里同时放了：

- 会话创建与动作执行
- 阶段草稿与阶段机
- 合法动作查询
- 解释文本与预览
- 回放
- 浏览器本地存档

这会导致依赖方向不清楚，并让 `engine/` 变成持续膨胀的兜底目录。

#### 3. `ui/` 已经有功能簇，但目录仍然平铺

当前 UI 已经自然分出：

- 建局
- 回合控制
- 棋盘与建轨
- 运货
- 玩家与公共区
- 规则解释与日志
- 存档与回放

但这些职责还没有体现在目录层次上，后续扩展会越来越难找文件。

#### 4. 类型定义和具体内容数据有耦合

例如 `MapDefinition` 当前定义在具体地图文件里。  
随着地图、规则集和存档格式继续增长，这种“类型挂在某个具体数据文件里”的做法会降低可维护性。

#### 5. 浏览器专属能力离核心逻辑过近

`persistence.ts` 依赖 `localStorage`，说明它是 Web 基础设施。  
这类能力不应和可复用的规则核心混在一起。

#### 6. 测试已经有一定覆盖，但缺少明确分层

当前 `tests/` 能覆盖主路径，但没有清楚表达：

- 哪些是纯规则测试
- 哪些是工作流测试
- 哪些是 UI 测试
- 哪些是存档 / 回放 / 不变量测试

从长期维护角度看，这会让测试目录逐渐失控。

### 当前文件清单与一句话功能说明

下面按目录列出当前仓库中的主要工程文件及其一句话职责。

#### 根目录

- `.DS_Store`：macOS 自动生成的目录元数据文件，不属于项目源码。
- `.gitignore`：定义 Git 应忽略的本地产物和依赖目录。
- `AGENTS.md`：约束 AI agent 在本仓库中的默认工作规则、文档放置规则和路径输出规则。
- `README.md`：介绍项目目标、环境、使用方式和当前主干模块。
- `environment.yml`：定义本仓库默认使用的 conda 环境和 Python / Node 基础依赖。
- `index.html`：Vite 在浏览器中挂载 React 应用的 HTML 入口页。
- `package-lock.json`：锁定当前 npm 依赖树，保证安装结果可复现。
- `package.json`：定义依赖和 `dev`、`build`、`test`、`smoke` 等 npm 脚本入口。
- `tsconfig.json`：作为 TypeScript 项目引用入口，连接 app 和 node 两套 tsconfig。
- `tsconfig.app.json`：定义浏览器源码和测试使用的 TypeScript 编译选项。
- `tsconfig.app.tsbuildinfo`：TypeScript 构建缓存文件，不属于人工维护源码。
- `tsconfig.node.json`：定义 Vite 配置、脚本和部分 Node 侧 TypeScript 文件的编译选项。
- `tsconfig.node.tsbuildinfo`：TypeScript 的 Node 侧构建缓存文件，不属于人工维护源码。
- `vite.config.ts`：配置 Vite 开发服务器和 React 插件。
- `vitest.config.ts`：配置 Vitest 测试环境和 React 测试插件。

#### `docs/notes/`

- `docs/notes/.DS_Store`：macOS 自动生成的目录元数据文件，不属于项目文档内容。
- `docs/notes/0404_Codex_Steam基础版规则详解.md`：梳理《Steam》基础版规则，作为实现前的规则理解文档。
- `docs/notes/0404_Codex_Steam数字化实现方案.md`：描述桌游规则数字化为当前项目的总体实现方案。
- `docs/notes/0404_Codex_Steam第一部分实现方案及日志.md`：记录第一阶段骨架实现的目标、结构和完成情况。
- `docs/notes/0405_Codex_Steam第二部分实现方案及日志.md`：记录第二阶段交互工作台和真人操作路径的设计与实现日志。
- `docs/notes/0405_Codex_Steam第三部分实现方案及日志.md`：记录第三阶段设置、解释、存档、回放等工作壳能力的设计与实现日志。
- `docs/notes/0405_Codex_仓库工业化重构方案.md`：定义本次仓库工业化重构的正式方案。

#### `docs/references/`

- `docs/references/.gitkeep`：用于保留空参考资料目录的占位文件。
- `docs/references/player_aid.pdf`：桌游辅助卡 PDF，供实现和核对时参考。
- `docs/references/quick_rules.doc`：规则摘要文档，供快速查阅。
- `docs/references/rule_summary.doc`：规则提炼文档，供核对和设计参考。
- `docs/references/rulebook_official.pdf`：官方规则书 PDF，是规则实现的主参考来源。
- `docs/references/rulebook_scan.pdf`：规则书扫描版 PDF，作为官方 PDF 的补充参考。

#### `scripts/`

- `scripts/check-tile-pool.ts`：检查当前 tile manifest 的库存与 id 是否满足基本一致性要求。
- `scripts/export-map-data.ts`：输出当前已登记地图的摘要，便于数据录入和核对。
- `scripts/smoke-playthrough.ts`：用最小命令行入口验证引擎能创建一局基础对局。
- `scripts/git-hooks/pre-commit`：在提交前检查暂存文件体积，避免超出仓库约定上限。

#### `src/` 顶层

- `src/App.tsx`：作为 React 应用最外层入口，把页面主壳 `GameShell` 接进应用树。
- `src/main.tsx`：把 React 应用挂载到浏览器中的 `#root` 节点。
- `src/styles.css`：提供当前页面的全局排版、色彩和基础样式。

#### `src/bot/`

- `src/bot/Bot.ts`：定义所有 Bot 实现需要遵守的统一接口。
- `src/bot/RandomBot.ts`：实现一个只会从合法动作中随机挑选的最弱 Bot。
- `src/bot/botTurn.ts`：负责在 Bot 的回合里调用 Bot 并把动作交给引擎执行。

#### `src/data/maps/`

- `src/data/maps/ne_usa_se_canada.ts`：提供东北美洲地图的当前最小可运行地图数据。
- `src/data/maps/ruhr.ts`：提供鲁尔地图的占位入口和最小元数据。

#### `src/data/setup/`

- `src/data/setup/actionTiles.ts`：定义行动牌编号、标签、顺位值和静态元数据。
- `src/data/setup/goods.ts`：定义货物颜色、货物袋组成和公共供给初始化常量。
- `src/data/setup/newCities.ts`：定义新城市板块的颜色列表和初始库存。

#### `src/data/tiles/`

- `src/data/tiles/manifest.ts`：定义轨道板的出口形状、库存数量和基础费用。
- `src/data/tiles/shapes.ts`：把 tile manifest 转成更适合展示层复用的形状索引。

#### `src/engine/`

- `src/engine/applyAction.ts`：把一条游戏动作应用到当前会话并产出新的工作态。
- `src/engine/createGame.ts`：根据玩家、地图和规则模式创建一局新的引擎会话。
- `src/engine/draftSession.ts`：管理阶段草稿的创建、提交、回滚和工作态读取。
- `src/engine/explanations.ts`：把当前阶段、预览和非法原因整理成结构化教学解释。
- `src/engine/legalMoves.ts`：把规则查询结果整理成更适合界面消费的合法动作对象集合。
- `src/engine/persistence.ts`：提供基于浏览器 `localStorage` 的本地存档读写和删除能力。
- `src/engine/phaseMachine.ts`：管理当前实现范围内的阶段推进顺序和切换逻辑。
- `src/engine/previews.ts`：为建轨和运输等交互生成预览摘要与解释文本。
- `src/engine/replay.ts`：记录轻量回放帧并支持按帧恢复会话快照。
- `src/engine/selectors.ts`：从当前会话中提取 UI、Bot 和测试常用的只读摘要。
- `src/engine/types.ts`：定义引擎会话、动作结果、阶段摘要和动作历史等共享类型。
- `src/engine/utils.ts`：提供引擎内部通用的克隆、替换等小工具函数。

#### `src/map/`

- `src/map/hexMath.ts`：封装六边形坐标和边方向相关的基础几何计算。
- `src/map/linkGraph.ts`：根据轨道段和锚点重建完整连接和 link 所有权信息。
- `src/map/mapGraph.ts`：把地图定义转成按 id 和坐标可快速查询的图索引。
- `src/map/routeSearch.ts`：在 link 图上搜索货物运输的合法路径集合。
- `src/map/segmentGraph.ts`：把已铺轨道板转换成规则层可用的轨道段集合。
- `src/map/types.ts`：集中定义地图、路径和若干共享运行时类型。

#### `src/rules/`

- `src/rules/auction.ts`：提供当前阶段用于顺位处理的基础拍卖占位逻辑。
- `src/rules/finance.ts`：处理融资、找零、收入结算和机车升级成本。
- `src/rules/goodsDelivery.ts`：搜索和筛选合法运输候选，并计算各玩家得分分配。
- `src/rules/income.ts`：封装收入阶段对单个玩家的结算逻辑。
- `src/rules/routeRanking.ts`：把合法运输候选排序成更适合展示和选择的列表。
- `src/rules/scoring.ts`：计算终局得分并提供当前领先者判断。
- `src/rules/tilePool.ts`：管理轨道板库存的查询、扣减和归还。
- `src/rules/tokenAnchors.ts`：管理玩家锚点与轨道段的绑定和失效清理。
- `src/rules/trackOwnership.ts`：根据轨道段和锚点刷新连接归属和完成状态。
- `src/rules/trackPlacement.ts`：判定建轨是否合法并计算对应费用。

#### `src/rulesets/`

- `src/rulesets/base.ts`：定义基础版的固定规则常量、费用和阶段顺序。
- `src/rulesets/standard.ts`：定义标准版相对基础版的阶段和经济规则差异。

#### `src/state/`

- `src/state/actionTypes.ts`：定义引擎、Bot 和 UI 之间交换的动作联合类型。
- `src/state/draftState.ts`：定义阶段草稿的结构，用于提交和回滚当前阶段。
- `src/state/gameState.ts`：定义游戏主状态树，是当前引擎和界面的共享真相。
- `src/state/initialState.ts`：根据玩家、地图和规则集创建完整的初始游戏状态。

#### `src/ui/`

- `src/ui/ActionHistoryPanel.tsx`：展示最近的显式动作历史，帮助玩家追溯局面演变。
- `src/ui/ActionTilePanel.tsx`：展示行动牌占用情况，并允许真人在选牌阶段选牌。
- `src/ui/DeliveryCandidatePanel.tsx`：列出当前货物源的候选运输方案并允许切换选中项。
- `src/ui/DeliveryPreview.tsx`：展示选中运输方案的路径、收益和规则解释。
- `src/ui/DeliverySourcePanel.tsx`：列出当前可运输的货物源，作为运输阶段的第一步选择。
- `src/ui/GameSetupPanel.tsx`：提供新对局设置入口，用于重开当前基础局。
- `src/ui/GameShell.tsx`：作为当前浏览器页面的主壳，串起设置、交互、解释、存档和回放。
- `src/ui/GoodsSupplyPanel.tsx`：展示公共货物供给区、货物袋摘要和新城市板剩余量。
- `src/ui/IllegalMoveNotice.tsx`：把当前提示中最像非法或阻塞原因的内容集中显示出来。
- `src/ui/LogPanel.tsx`：展示最近的动作日志和提示日志。
- `src/ui/MapBoard.tsx`：用 SVG 渲染地图、轨道、高亮 hex 和运输路径。
- `src/ui/PhasePanel.tsx`：展示当前阶段摘要并承接少量全局控制按钮。
- `src/ui/PlayerPanel.tsx`：展示玩家的现金、收入、分数、机车等级和当前行动标记。
- `src/ui/ReplayPanel.tsx`：展示最近回放帧并允许恢复到指定帧。
- `src/ui/RuleExplanationPanel.tsx`：展示结构化规则解释，而不只是单条提示文本。
- `src/ui/RuleHintPanel.tsx`：持续显示当前最重要的一条规则提示。
- `src/ui/SaveLoadPanel.tsx`：提供本地存档、载入和删除入口。
- `src/ui/TilePoolPanel.tsx`：展示轨道板库存摘要并高亮当前选中项。
- `src/ui/TrackPalettePanel.tsx`：让玩家在建轨阶段先选择要使用的轨道板。
- `src/ui/TrackPlacementPanel.tsx`：展示合法朝向和建轨预览，并负责确认落子。
- `src/ui/TurnOrderPanel.tsx`：展示当前顺位、行动者和已选行动牌。
- `src/ui/hexGeometry.ts`：提供 UI 层六边形棋盘的几何计算和视口测量。
- `src/ui/jsx.d.ts`：补充 JSX 内置元素类型定义，保证当前 TS 配置下组件文件可通过类型检查。
- `src/ui/types.ts`：定义 UI 组件共用的轻量展示类型。

#### `src/utils/`

- `src/utils/assert.ts`：提供最小断言工具，用于保护内部不变量。
- `src/utils/format.ts`：提供金额、阶段等用户可见文本的简单格式化函数。
- `src/utils/ids.ts`：提供简单稳定的业务 id 拼接工具。
- `src/utils/playerNames.ts`：提供默认玩家名字映射和批量生成逻辑。

#### `tests/`

- `tests/bot.test.ts`：验证 Bot 能在选牌阶段给出合法动作，并能驱动一步会话推进。
- `tests/buildDraftFlow.test.ts`：验证建轨阶段的草稿工作流、可选板块和可放置位置查询。
- `tests/deliveryWorkflow.test.ts`：验证货物源、候选方案、预览和执行结果能串成完整运输流程。
- `tests/finance.test.ts`：验证融资和找零规则的关键边界行为。
- `tests/goodsDelivery.test.ts`：验证没有完整连接时不会产生合法运输候选。
- `tests/humanActionSelection.test.ts`：验证真人选牌阶段会正确禁用已被占用的行动牌。
- `tests/persistence.test.ts`：验证本地存档的保存、列出、载入和删除流程。
- `tests/playerNames.test.ts`：验证默认玩家名字映射在关键边界上的输出结果。
- `tests/replay.test.ts`：验证回放帧记录与恢复会话快照的行为。
- `tests/routeRanking.test.ts`：验证运输候选排序优先级符合预期。
- `tests/scoring.test.ts`：验证终局收入换分等计分规则的基本行为。
- `tests/specHelpers.ts`：提供测试用的轻量规则合同辅助结构和函数。
- `tests/standardMode.test.ts`：验证标准版入口对局能正确创建并保留配置。
- `tests/tilePool.test.ts`：验证轨道板库存扣减到零后会阻止继续放置。
- `tests/tokenAnchors.test.ts`：验证失效轨道段对应的锚点会被清理掉。
- `tests/trackPlacement.test.ts`：验证建轨合法性校验的关键边界，如城镇格限制。
- `tests/uiShell.test.tsx`：验证页面主壳能渲染关键面板并完成基础交互。

### 当前工作区中的非源码产物

这些内容会影响当前工作区观感，但不应被视为正式工程结构：

- `.git/`
- `node_modules/`
- `dist/`
- `.DS_Store`
- `*.tsbuildinfo`

---

## 重构目标

本次重构的目标结构如下：

```text
steam-boardgame-replication/
├── AGENTS.md
├── README.md
├── package.json
├── package-lock.json
├── tsconfig.base.json
├── eslint.config.mjs
├── prettier.config.mjs
├── .editorconfig
├── .gitignore
├── .nvmrc
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── smoke.yml
├── docs/
│   ├── notes/
│   └── references/
├── apps/
│   └── web/
│       ├── package.json
│       ├── tsconfig.json
│       ├── tsconfig.node.json
│       ├── vite.config.ts
│       ├── vitest.config.ts
│       ├── index.html
│       └── src/
│           ├── app/
│           │   ├── App.tsx
│           │   ├── main.tsx
│           │   ├── providers/
│           │   │   └── GameSessionProvider.tsx
│           │   └── styles/
│           │       └── global.css
│           ├── pages/
│           │   └── game/
│           │       ├── GamePage.tsx
│           │       └── GamePage.test.tsx
│           ├── features/
│           │   ├── game-setup/
│           │   ├── session-control/
│           │   ├── board/
│           │   ├── delivery/
│           │   ├── players/
│           │   ├── logs/
│           │   ├── rule-help/
│           │   ├── save-load/
│           │   ├── replay/
│           │   └── supply/
│           ├── shared/
│           │   ├── lib/
│           │   ├── presentation/
│           │   └── types/
│           └── test/
│               ├── helpers/
│               └── mocks/
├── packages/
│   ├── game-core/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── actions/
│   │   │   ├── bots/
│   │   │   ├── contracts/
│   │   │   ├── map/
│   │   │   ├── queries/
│   │   │   ├── replay/
│   │   │   ├── rules/
│   │   │   ├── serialization/
│   │   │   │   ├── migrations/
│   │   │   │   ├── deserializeSession.ts
│   │   │   │   ├── serializeSession.ts
│   │   │   │   └── schemaVersion.ts
│   │   │   ├── state/
│   │   │   ├── utils/
│   │   │   └── index.ts
│   │   └── tests/
│   │       ├── scenarios/
│   │       ├── workflows/
│   │       └── invariants/
│   └── game-content/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── maps/
│           ├── setup/
│           ├── rulesets/
│           ├── tiles/
│           └── index.ts
├── tools/
│   ├── smoke/
│   ├── data/
│   ├── git-hooks/
│   └── python/
└── archive/
    └── legacy-layout-notes.md
```

---

## 目标结构中的职责划分

### `apps/web`

职责：

- 浏览器页面与交互
- React 组件
- presenter / view model
- 浏览器存储 repository
- 只与展示相关的几何和图形辅助

约束：

- 不重写核心规则
- 不持有跨包契约类型
- 只能通过 `@steam/game-core` 和 `@steam/game-content` 的公共入口依赖核心和内容包

### `packages/game-core`

职责：

- 桌游规则核心
- 状态模型
- 动作类型
- 阶段机
- 动作执行
- 只读查询
- 路径搜索
- Bot
- 回放模型
- 序列化与反序列化
- 跨包契约类型

约束：

- 不依赖 React
- 不依赖 DOM
- 不依赖 `window`
- 不依赖 `localStorage`
- 不依赖 CSS

### `packages/game-content`

职责：

- 地图数据
- 规则集数据
- 行动牌数据
- 货物与 tile 数据

约束：

- 只实现 `game-core` 提供的契约
- 不定义平行类型系统
- 不包含浏览器逻辑
- 不包含动作执行逻辑

### `tools`

职责：

- smoke 脚本
- 数据检查脚本
- 数据导出脚本
- git hooks
- Python 辅助环境

---

## 契约所有权规则

跨包契约只有一个 owner：`packages/game-core`。

以下类型统一定义在 `packages/game-core/src/contracts/` 或 `packages/game-core/src/state/`：

- `MapDefinition`
- `RuleSet`
- `GameAction`
- `EngineSession`
- `SaveSnapshot`
- `ReplayFrame`
- `RuleReason`

`packages/game-content` 的职责是导出满足这些契约的数据对象，而不是再定义另一套类型。

---

## 包内目录规则

### `packages/game-core/src/`

推荐采用较扁的目录结构：

- `actions/`：动作执行、阶段推进、草稿提交等写操作
- `queries/`：合法动作、只读摘要、排序与派生查询
- `rules/`：纯规则函数
- `state/`：状态树、动作类型、初始化状态
- `map/`：地图索引、轨道段、路径搜索
- `replay/`：回放帧结构与回灌逻辑
- `serialization/`：存档格式、schema version、迁移、序列化
- `bots/`：Bot 接口与实现
- `contracts/`：跨包契约类型
- `utils/`：无领域语义的通用工具

### `apps/web/src/`

推荐采用前端常见的职责分层：

- `app/`：应用入口、provider、全局样式
- `pages/`：页面级容器
- `features/`：按功能域组织组件、hooks、selectors、repository
- `shared/`：无领域语义的展示工具和共享类型
- `test/`：前端测试辅助工具

---

## 边界执行规则

目录边界必须由工具执行，而不是靠团队成员记忆。

### 1. 包公共入口

每个 package 通过 `package.json` 的 `exports` 暴露公共入口：

- `@steam/game-core`
- `@steam/game-content`

未从包入口导出的文件，默认视为内部实现。

### 2. 限制深层 import

使用 `eslint` 的 `no-restricted-imports`，禁止以下行为：

- `apps/web` 直接引用 `packages/game-core/src/**`
- `apps/web` 直接引用 `packages/game-content/src/**`

### 3. 限制依赖方向

使用 `dependency-cruiser` 限制依赖方向：

- `game-core` 禁止依赖 React、DOM、`window`、`localStorage`
- `game-content` 禁止依赖 `apps/web`
- `apps/web` 不得被 `game-core` 或 `game-content` 反向依赖

### 4. 共享目录规则

`shared/` 只能收无领域语义工具。  
凡是文件里明显包含这些业务词，默认不进入 `shared/`：

- `player`
- `map`
- `tile`
- `goods`
- `session`

---

## 存档与序列化方案

当前 `persistence.ts` 不应直接平移为另一个浏览器专属文件。  
目标方案是拆成两层：

### `packages/game-core/src/serialization/`

包含：

- `serializeSession.ts`
- `deserializeSession.ts`
- `schemaVersion.ts`
- `migrations/*`

职责：

- 定义版本化存档格式
- 序列化 / 反序列化会话
- 处理旧版本存档迁移

### `apps/web/src/features/save-load/browserSaveRepository.ts`

职责：

- 与 `localStorage` 或其他浏览器存储交互
- 调用 `game-core` 的序列化 API
- 不直接定义存档格式

这样以后无论切换到 `IndexedDB`、文件导出还是云同步，都不需要改核心格式。

---

## 解释与错误原因方案

核心不直接返回中文句子，而是返回结构化原因：

```ts
type RuleReason =
  | { code: "TRACK_OVERLAPS_CITY"; context: { hexId: string; cityId: string } }
  | { code: "TILE_POOL_EMPTY"; context: { tileId: string } };
```

然后由 Web 层 presenter 负责把这些结构化原因转成文本、图标、颜色或高亮样式。

这条规则适用于：

- 非法动作原因
- 建轨阻塞原因
- 运货候选解释
- 阶段提示

---

## 展示资产与规则资产的边界

是否放进 `game-content`，用这条规则判断：

- 会影响规则判定的，进入 `game-core` / `game-content`
- 只为 SVG、坐标投影、图形展示服务的，留在 `apps/web`

因此像 `tiles/shapes.ts` 这种文件，迁移前必须重新判定：

- 如果它是规则出口拓扑的一部分，进入内容层
- 如果它只是 UI 图形辅助，进入 Web 层

---

## 热点文件的拆分方案

### `GameShell.tsx`

目标拆分为：

- `pages/game/GamePage.tsx`
- `app/providers/GameSessionProvider.tsx`
- `features/session-control/useSessionCommands.ts`
- 各功能域的 view selector / presenter

原则：

- 页面只负责装配
- 状态提供层只负责会话上下文
- 命令逻辑收进 hook 或 command 模块
- 各面板只接收已经整理好的 view model

### `applyAction.ts`

目标拆分为：

- `actions/applyAction.ts`
- `actions/handlers/selectActionTile.ts`
- `actions/handlers/placeTrack.ts`
- `actions/handlers/deliverGoods.ts`
- `actions/handlers/upgradeLocomotive.ts`
- `actions/handlers/resolveIncome.ts`
- `actions/handlers/turnSetup.ts`
- `actions/actionSummary.ts`

原则：

- `applyAction.ts` 只做分发、公共校验、公共收尾
- 每类动作由独立 handler 负责
- 动作摘要从动作执行逻辑中拆开

### `legalMoves.ts`

目标拆分为：

- `queries/actionTileQueries.ts`
- `queries/trackQueries.ts`
- `queries/deliveryQueries.ts`
- `queries/turnOrderQueries.ts`
- `queries/index.ts`

原则：

- 查询逻辑按领域分组
- 聚合导出仍可保留统一入口

---

## 测试策略

采用混合策略，而不是强行把所有测试放到一个统一目录。

### 1. 模块级测试 colocate

适用于：

- 纯规则函数
- 纯路径搜索函数
- 小型工具函数

示例：

- `rules/finance.test.ts`
- `rules/tilePool.test.ts`
- `map/routeSearch.test.ts`

### 2. 工作流与场景测试集中放置

适用于：

- 回合完整流程
- 回放回灌
- 基础版 / 标准版差异
- 存档读写回归

建议集中到：

- `packages/game-core/tests/workflows/`
- `packages/game-core/tests/scenarios/`

### 3. 不变量测试单独维护

建议集中到：

- `packages/game-core/tests/invariants/`

至少覆盖：

- tile 库存永远不为负
- 非法动作不会污染 session
- replay 恢复出的状态等于直接执行结果
- 同 seed 下结果可重现

---

## 当前文件到目标位置的迁移映射

### 根目录与配置

- `AGENTS.md` -> 根目录保留
- `README.md` -> 根目录保留，但更新为 workspace 结构说明
- `package.json` -> 根目录改为 workspace 管理入口
- `package-lock.json` -> 根目录保留，先沿用 npm；未来如整体切到 pnpm 再统一切换
- `tsconfig.json` -> 替换为根级 `tsconfig.base.json`
- `tsconfig.app.json` -> `apps/web/tsconfig.json`
- `tsconfig.node.json` -> `apps/web/tsconfig.node.json`
- `vite.config.ts` -> `apps/web/vite.config.ts`
- `vitest.config.ts` -> `apps/web/vitest.config.ts`
- `index.html` -> `apps/web/index.html`
- `environment.yml` -> `tools/python/environment.yml`

### 文档

- `docs/notes/*` -> 保留
- `docs/references/*` -> 保留

### Web app 入口与页面

- `src/main.tsx` -> `apps/web/src/app/main.tsx`
- `src/App.tsx` -> `apps/web/src/app/App.tsx`
- `src/styles.css` -> `apps/web/src/app/styles/global.css`
- `src/ui/GameShell.tsx` -> `apps/web/src/pages/game/GamePage.tsx`

### Web app 功能组件

- `src/ui/GameSetupPanel.tsx` -> `apps/web/src/features/game-setup/GameSetupPanel.tsx`
- `src/ui/ActionTilePanel.tsx` -> `apps/web/src/features/session-control/ActionTilePanel.tsx`
- `src/ui/PhasePanel.tsx` -> `apps/web/src/features/session-control/PhasePanel.tsx`
- `src/ui/TurnOrderPanel.tsx` -> `apps/web/src/features/session-control/TurnOrderPanel.tsx`
- `src/ui/MapBoard.tsx` -> `apps/web/src/features/board/MapBoard.tsx`
- `src/ui/TrackPalettePanel.tsx` -> `apps/web/src/features/board/TrackPalettePanel.tsx`
- `src/ui/TrackPlacementPanel.tsx` -> `apps/web/src/features/board/TrackPlacementPanel.tsx`
- `src/ui/DeliverySourcePanel.tsx` -> `apps/web/src/features/delivery/DeliverySourcePanel.tsx`
- `src/ui/DeliveryCandidatePanel.tsx` -> `apps/web/src/features/delivery/DeliveryCandidatePanel.tsx`
- `src/ui/DeliveryPreview.tsx` -> `apps/web/src/features/delivery/DeliveryPreview.tsx`
- `src/ui/PlayerPanel.tsx` -> `apps/web/src/features/players/PlayerPanel.tsx`
- `src/ui/LogPanel.tsx` -> `apps/web/src/features/logs/LogPanel.tsx`
- `src/ui/ActionHistoryPanel.tsx` -> `apps/web/src/features/logs/ActionHistoryPanel.tsx`
- `src/ui/RuleHintPanel.tsx` -> `apps/web/src/features/rule-help/RuleHintPanel.tsx`
- `src/ui/RuleExplanationPanel.tsx` -> `apps/web/src/features/rule-help/RuleExplanationPanel.tsx`
- `src/ui/IllegalMoveNotice.tsx` -> `apps/web/src/features/rule-help/IllegalMoveNotice.tsx`
- `src/ui/SaveLoadPanel.tsx` -> `apps/web/src/features/save-load/SaveLoadPanel.tsx`
- `src/ui/ReplayPanel.tsx` -> `apps/web/src/features/replay/ReplayPanel.tsx`
- `src/ui/GoodsSupplyPanel.tsx` -> `apps/web/src/features/supply/GoodsSupplyPanel.tsx`
- `src/ui/TilePoolPanel.tsx` -> `apps/web/src/features/supply/TilePoolPanel.tsx`
- `src/ui/hexGeometry.ts` -> 若只用于 UI 绘制，则 `apps/web/src/features/board/hexGeometry.ts`
- `src/ui/types.ts` -> `apps/web/src/shared/presentation/viewTypes.ts`
- `src/ui/jsx.d.ts` -> `apps/web/src/shared/types/jsx.d.ts`

### 展示组织与浏览器基础设施

- `src/engine/explanations.ts` -> 拆为 `game-core` 的结构化 reason 输出 + `apps/web/src/features/rule-help/ruleExplanationPresenter.ts`
- `src/engine/previews.ts` -> 按职责拆到 `apps/web/src/features/board/` 和 `apps/web/src/features/delivery/`
- `src/engine/persistence.ts` -> 拆为 `packages/game-core/src/serialization/*` + `apps/web/src/features/save-load/browserSaveRepository.ts`
- `src/utils/format.ts` -> `apps/web/src/shared/lib/format.ts`；如仍有纯核心格式化需求则在 core 单独提供
- `src/utils/playerNames.ts` -> `apps/web/src/features/game-setup/defaultPlayerNames.ts`

### 游戏核心

- `src/engine/createGame.ts` -> `packages/game-core/src/actions/createGame.ts`
- `src/engine/draftSession.ts` -> `packages/game-core/src/actions/draftSession.ts`
- `src/engine/selectors.ts` -> 按职责拆到 `packages/game-core/src/queries/`
- `src/engine/types.ts` -> 拆到 `packages/game-core/src/contracts/` 与 `packages/game-core/src/state/`
- `src/engine/applyAction.ts` -> `packages/game-core/src/actions/applyAction.ts`
- `src/engine/phaseMachine.ts` -> `packages/game-core/src/actions/phaseMachine.ts`
- `src/engine/legalMoves.ts` -> 拆到 `packages/game-core/src/queries/`
- `src/engine/replay.ts` -> `packages/game-core/src/replay/replay.ts`
- `src/engine/utils.ts` -> `packages/game-core/src/utils/`

### 状态、规则、地图、Bot

- `src/state/actionTypes.ts` -> `packages/game-core/src/state/actionTypes.ts`
- `src/state/draftState.ts` -> `packages/game-core/src/state/draftState.ts`
- `src/state/gameState.ts` -> `packages/game-core/src/state/gameState.ts`
- `src/state/initialState.ts` -> `packages/game-core/src/state/initialState.ts`
- `src/rules/*.ts` -> `packages/game-core/src/rules/*.ts`
- `src/map/*.ts` -> `packages/game-core/src/map/*.ts`
- `src/bot/Bot.ts` -> `packages/game-core/src/bots/Bot.ts`
- `src/bot/RandomBot.ts` -> `packages/game-core/src/bots/RandomBot.ts`
- `src/bot/botTurn.ts` -> `packages/game-core/src/bots/runBotTurn.ts`

### 契约与内容

- `MapDefinition`、`RuleSet`、`EngineSession`、`GameAction`、`SaveSnapshot`、`ReplayFrame`、`RuleReason` -> 统一进入 `packages/game-core`
- `src/data/maps/ne_usa_se_canada.ts` -> `packages/game-content/src/maps/ne_usa_se_canada.ts`
- `src/data/maps/ruhr.ts` -> `packages/game-content/src/maps/ruhr.ts`
- `src/data/setup/actionTiles.ts` -> `packages/game-content/src/setup/actionTiles.ts`
- `src/data/setup/goods.ts` -> `packages/game-content/src/setup/goods.ts`
- `src/data/setup/newCities.ts` -> `packages/game-content/src/setup/newCities.ts`
- `src/data/tiles/manifest.ts` -> `packages/game-content/src/tiles/manifest.ts`
- `src/data/tiles/shapes.ts` -> 迁移前重新判断；若仅用于展示，则搬去 `apps/web`
- `src/rulesets/base.ts` -> `packages/game-content/src/rulesets/base.ts`
- `src/rulesets/standard.ts` -> `packages/game-content/src/rulesets/standard.ts`

### 共享工具

- `src/utils/assert.ts` -> `packages/game-core/src/utils/assert.ts`
- `src/utils/ids.ts` -> `packages/game-core/src/utils/ids.ts`

### 测试

- `tests/uiShell.test.tsx` -> `apps/web/src/pages/game/GamePage.test.tsx`
- `tests/persistence.test.ts` -> 拆分为 `packages/game-core/src/serialization/*.test.ts` + `apps/web/src/features/save-load/browserSaveRepository.test.ts`
- `tests/playerNames.test.ts` -> `apps/web/src/features/game-setup/defaultPlayerNames.test.ts`
- `tests/specHelpers.ts` -> `packages/game-core/tests/helpers/specHelpers.ts`
- 小型纯规则测试 -> colocate 到 `packages/game-core/src/**`
- 流程 / 场景 / 回放 / 不变量测试 -> `packages/game-core/tests/workflows`、`packages/game-core/tests/scenarios`、`packages/game-core/tests/invariants`

---

## 工程配置与新增文件

### 根级工程文件

新增：

- `tsconfig.base.json`
- `eslint.config.mjs`
- `prettier.config.mjs`
- `.editorconfig`
- `.nvmrc`

### 包级文件

新增：

- `apps/web/package.json`
- `packages/game-core/package.json`
- `packages/game-content/package.json`
- `packages/game-core/src/index.ts`
- `packages/game-content/src/index.ts`

### 自动边界约束

新增：

- `dependency-cruiser` 配置文件
- `eslint` 的 restricted imports 规则

### 序列化层

新增：

- `packages/game-core/src/serialization/serializeSession.ts`
- `packages/game-core/src/serialization/deserializeSession.ts`
- `packages/game-core/src/serialization/schemaVersion.ts`
- `packages/game-core/src/serialization/migrations/*`

### CI

新增：

- `.github/workflows/ci.yml`
- `.github/workflows/smoke.yml`

---

## 迁移原则

### 规则 1

`game-core` 拥有所有跨包契约类型。

### 规则 2

`game-content` 只实现契约，不再定义平行类型系统。

### 规则 3

`apps/web` 只通过公共包入口依赖 core / content，禁止深层 import。

### 规则 4

`game-core` 禁止触碰 React、DOM、`window`、`localStorage` 和 CSS。

### 规则 5

核心输出结构化语义，展示层输出文本。

### 规则 6

`shared/` 只允许无业务语义工具。

### 规则 7

展示型资产与规则型资产严格分开。

### 规则 8

`.DS_Store`、`dist/`、`*.tsbuildinfo` 等机器产物应从 Git 跟踪中清理掉。

---

## 推荐执行顺序

### 第一阶段：建立新边界，不改业务行为

- 建 `apps/web`
- 建 `packages/game-core`
- 建 `packages/game-content`
- 加根级配置
- 建 package 入口和 `exports`

目标：让新边界先存在。

### 第二阶段：只移动文件，不改逻辑

- 按迁移映射调整目录
- 修正 import 路径
- 保持测试和构建继续通过

目标：完成结构迁移，同时保持行为等价。

### 第三阶段：补序列化层与浏览器 repository 分层

- 新建 `serialization/`
- 让 Web repository 调用序列化 API

目标：把存档格式从浏览器存储实现中剥离出来。

### 第四阶段：拆热点文件

- `GameShell.tsx`
- `applyAction.ts`
- `legalMoves.ts`

目标：解决持续膨胀的复杂度热点。

### 第五阶段：补自动化边界约束

- `eslint` restricted imports
- `dependency-cruiser`
- CI

目标：把边界规则变成自动检查。

### 第六阶段：补测试资产

- colocate 规则测试
- 场景测试
- 不变量测试
- replay / serialization 回归

目标：让结构调整后仍有稳固回归保护。

---

## 完成标准

当以下条件全部成立时，本次重构视为完成：

- Web、core、content、tools 已物理分离
- `apps/web` 只通过公共包入口消费 core / content
- `game-core` 不依赖浏览器环境
- 存档格式已版本化并具备迁移能力
- `GameShell`、`applyAction`、`legalMoves` 已完成职责拆分
- 测试已覆盖规则、不变量、工作流和场景回归
- CI 已执行 typecheck、lint、依赖边界检查、test、build
- 机器产物已从 Git 跟踪中清理

---

## 最终结论

这次重构的核心不是“把单个 `src/` 拆成更多文件夹”，而是把当前仓库升级成一个边界清楚、导出稳定、可自动约束、可长期扩展的 TypeScript 工程。

应优先关注的不是目录命名本身，而是以下五件事：

- 顶层子系统分离
- 契约类型单一 owner
- 序列化层独立
- 热点文件职责拆分
- 边界规则自动执行

后续工程实现应以本文档为直接执行依据。

---

# 实现日志

## 实际完成结果

这次重构已经从“单一 `src/` 工程”切换成了工作区结构，而且现在的结果是可编译、可测试、可运行的。Web 页面、规则核心、静态规则内容和工具脚本已经物理分离；浏览器本地存档被放回 `apps/web`，核心层只保留版本化序列化；旧根目录的 `src/`、`tests/`、`scripts/`、`index.html`、`vite.config.ts`、`vitest.config.ts`、`tsconfig.app.json`、`tsconfig.node.json` 和旧 `environment.yml` 也都已经清掉，不再和新结构并存。根目录现在由 npm workspace 脚本和 TypeScript 项目引用负责统一调度，`tsconfig.json` 只引用 `packages/game-content`、`packages/game-core` 和 `apps/web` 三个工作区项目。

这一轮把之前未收口的关键项也补齐了。第一，`GameShell` 的职责已经真正拆开，当前页面入口是 `apps/web/src/pages/game/GamePage.tsx`，会话和回放状态被移到 `apps/web/src/app/providers/GameSessionProvider.tsx`，常用动作命令被收进 `apps/web/src/features/session-control/useSessionCommands.ts`。第二，`applyAction.ts` 和 `legalMoves.ts` 不再是单个膨胀文件：动作逻辑已经拆到 `packages/game-core/src/actions/handlers/`，合法动作查询已经拆到 `packages/game-core/src/queries/*Queries.ts`。第三，规则解释已经按边界重构：`game-core` 只输出 `RuleReason + context`，最终中文文本由 `apps/web/src/features/rule-help/presentRuleExplanation.ts` 负责格式化。第四，序列化层已经补上 `serialization/migrations/`，当前支持从无 `schemaVersion` 的旧快照迁移到当前版本。第五，目录边界已经由多层工具执行：除了 `tools/check-import-boundaries.ts`，现在还有根级 `eslint` restricted imports、`dependency-cruiser` 配置，以及在 CI 中独立运行的 `typecheck / lint / check:deps / check:boundaries / test / build`。

## 当前真实仓库结构

```text
steam-boardgame-replication/
├── .dependency-cruiser.cjs
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── smoke.yml
├── apps/
│   └── web/
│       ├── index.html
│       ├── package.json
│       ├── tsconfig.json
│       ├── tsconfig.node.json
│       ├── vite.config.ts
│       ├── vitest.config.ts
│       └── src/
│           ├── app/
│           │   ├── App.tsx
│           │   ├── main.tsx
│           │   ├── providers/GameSessionProvider.tsx
│           │   └── styles/global.css
│           ├── features/
│           │   ├── board/
│           │   ├── delivery/
│           │   ├── game-setup/
│           │   ├── logs/
│           │   ├── players/
│           │   ├── replay/
│           │   ├── rule-help/
│           │   ├── save-load/
│           │   ├── session-control/
│           │   └── supply/
│           ├── pages/game/
│           └── shared/
├── packages/
│   ├── game-content/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── maps/
│   │       ├── rulesets/
│   │       ├── setup/
│   │       └── tiles/
│   └── game-core/
│       ├── package.json
│       ├── tsconfig.json
│       ├── vitest.config.ts
│       ├── src/
│       │   ├── actions/
│       │   ├── bots/
│       │   ├── contracts/
│       │   ├── map/
│       │   ├── queries/
│       │   ├── replay/
│       │   ├── rules/
│       │   ├── serialization/
│       │   ├── state/
│       │   ├── utils/
│       │   └── index.ts
│       └── tests/
│           ├── helpers/
│           ├── invariants/
│           ├── scenarios/
│           └── workflows/
├── tools/
│   ├── check-import-boundaries.ts
│   ├── data/
│   │   ├── check-tile-pool.ts
│   │   └── export-map-data.ts
│   ├── git-hooks/
│   │   └── pre-commit
│   ├── python/
│   │   └── environment.yml
│   └── smoke/
│       └── smoke-playthrough.ts
├── docs/
│   ├── notes/
│   └── references/
├── archive/
│   └── legacy-layout-notes.md
├── package.json
├── package-lock.json
├── tsconfig.base.json
├── tsconfig.json
├── .gitignore
├── .editorconfig
├── .nvmrc
├── eslint.config.mjs
└── prettier.config.mjs
```

## 这次重构具体做了什么

- `apps/web`：把浏览器入口、页面、功能组件、共享展示类型拆开，并用 provider 托管当前对局会话。
- `packages/game-core`：把状态、动作、动作 handlers、规则、地图、查询、回放、迁移化序列化和 Bot 收成独立 package，同时通过 `src/index.ts` 暴露公共入口。
- `packages/game-content`：把地图、规则集、行动牌、货物袋和 tile manifest 提炼成静态内容包，供 core 和 web 通过 package 入口消费。
- `tools`：把 smoke、数据检查、边界检查、git hook 和 conda 环境文件收回工具目录，不再散落在根目录。
- `边界工具`：补了 `eslint.config.mjs` 和 `.dependency-cruiser.cjs`，把 restricted imports 和依赖方向规则固化成可运行检查。
- `测试`：新增 `packages/game-core/tests/invariants/`，并在 `packages/game-core/src/serialization/` 下补了 colocated migration test。
- `CI`：保留 `smoke` workflow，并让 `ci` workflow 独立执行 `typecheck`、`lint`、`check:deps`、`check:boundaries`、`test`、`build`。
- `清理`：删除旧根目录入口和机器产物，仓库不再同时维持两套结构。
- `根调度`：根 `package.json` 现在负责 workspace 脚本转发，根 `tsconfig.json` 只承担项目引用入口，不再直接承载 app / node 双配置。

## 验证结果

这次重构完成后，以下命令都已经在当前工作区重新验收通过：

- `npm run typecheck`
- `npm run lint`
- `npm run check:deps`
- `npm run check:boundaries`
- `npm test`
- `npm run build`
- `npm run smoke`
