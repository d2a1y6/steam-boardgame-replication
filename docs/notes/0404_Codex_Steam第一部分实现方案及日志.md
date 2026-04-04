# Steam 第一部分实现方案及日志

这部分只回答一个问题：**现在该从哪里开始写，才能最快搭出可运行骨架，并且尽早得到最基础、最有价值的测试反馈。**结论是，不要先写 UI 细节，也不要先录完整地图和完整规则，而是先搭出“一个最小但正确的基础版回合骨架”，让它能在命令行和浏览器里同时推进。

## 第一部分的交付目标

第一部分结束时，仓库里应当已经具备以下能力：可以创建一局基础版三人游戏；可以在内存中表示地图、玩家、资金、行动牌和轨道库存；可以推进到“选行动牌 -> 建轨 -> 运输/升级 -> 收支结算”的最小闭环；可以通过 4 到 6 个核心测试验证融资、建轨合法性、未完成连接、最基础交付和终局计分没有跑偏；可以让一个 Dummy AI 自动执行合法动作，避免你必须手动扮演所有玩家。

这意味着第一部分不是“写几份类型定义”，而是要交出一个**能动起来的最小系统**。

## 为什么从这里开始

如果一开始就做完整地图、完整界面或复杂教学提示，你会很快陷入“画面出来了，但规则引擎还站不住”的状态。对于《Steam》来说，真正决定后续一切是否顺利的，不是地图是否漂亮，而是以下五个基础是否先立住：

+ 有限动作驱动的引擎入口。
+ 已提交状态 / 阶段草稿状态的双层结构。
+ 轨道段和玩家标记锚点的底层模型。
+ 最小合法路径搜索。
+ 能自动走子的最弱 Bot。

只要这五个东西先搭起来，之后再加地图、UI、日志和候选方案都能顺着长；反过来则很容易返工。

## 第一批文件

第一部分建议只先落下面这些文件，其他文件全部后推：

```text
src/
├── main.tsx
├── App.tsx
├── styles.css
├── rulesets/base.ts
├── data/maps/ne_usa_se_canada.ts
├── data/tiles/manifest.ts
├── data/setup/actionTiles.ts
├── data/setup/goods.ts
├── data/setup/newCities.ts
├── state/gameState.ts
├── state/draftState.ts
├── state/actionTypes.ts
├── state/initialState.ts
├── engine/createGame.ts
├── engine/phaseMachine.ts
├── engine/draftSession.ts
├── engine/applyAction.ts
├── engine/selectors.ts
├── rules/finance.ts
├── rules/tilePool.ts
├── rules/trackPlacement.ts
├── rules/tokenAnchors.ts
├── rules/trackOwnership.ts
├── rules/goodsDelivery.ts
├── map/hexMath.ts
├── map/mapGraph.ts
├── map/segmentGraph.ts
├── map/linkGraph.ts
├── map/routeSearch.ts
├── bot/Bot.ts
├── bot/RandomBot.ts
├── bot/botTurn.ts
├── ui/GameShell.tsx
├── ui/MapBoard.tsx
├── ui/PhasePanel.tsx
├── ui/PlayerPanel.tsx
├── ui/RuleHintPanel.tsx
└── ui/LogPanel.tsx

tests/
├── finance.test.ts
├── tilePool.test.ts
├── trackPlacement.test.ts
├── tokenAnchors.test.ts
└── goodsDelivery.test.ts
```

## 第一部分实现顺序

### 1. 先定义状态和动作，不写界面逻辑

先写 `gameState.ts`、`draftState.ts`、`actionTypes.ts` 和 `initialState.ts`。这里的目标不是把所有字段都写满，而是先让程序能表示一局游戏最核心的真相：玩家列表、现金/收入/胜利点/机车、当前回合与阶段、Goods Supply、tile pool、地图 hex、已铺轨道、segment、link 和 token anchor。

完成这一层后，你应该已经能在测试里创建一个完全静态的新游戏对象。

### 2. 立刻搭 `phaseMachine` 和 `draftSession`

不要先写规则细节，而要先把“进入阶段 -> 创建草稿 -> 执行动作 -> 提交阶段 / 重置阶段”这条结构搭好。这样后面建轨和融资的连锁操作都能跑在草稿里，而不是污染正式状态。

第一部分里就应该支持“重置当前阶段”，不做一步撤销。这个功能不是锦上添花，而是后续建轨和融资调试的基础工具。

### 3. 再写最小地图与最小板块库存

录入东北美洲地图时，不需要一开始把整张地图所有美术属性都录全，但必须先把**六边格邻接、城市、城镇、黑边和初始城市数字**这几项录对。与此同时，把 `Tile Manifest` 里第一批会用到的轨道板类型和数量录入 `manifest.ts`。

这里最关键的是：地图数据和板块库存必须尽早从“硬编码示例”升级成“数据文件”，否则测试永远会建立在假模型上。

### 4. 实现最基础的规则函数

第一批规则函数只做五件事：融资与找零、扣减轨道库存、放置轨道合法性、根据 segment 重建 link、判断一条货物能否沿现有完整 link 合法运输。不要急着把所有边角规则一次写满，先保证这五件事闭环。

这时 `goodsDelivery.ts` 只要支持“找到所有合法路径中的最基础集合”，还不必做候选方案排序；排序逻辑可以放到下一部分。

### 5. 接入 Dummy AI

一旦 `selectors.ts` 已经能给出合法动作集合，就立刻接上 `RandomBot`。它只需要从当前合法动作里挑一个最简单的动作，然后一直推进到自己的本阶段结束。

这样你在第一部分里就可以用“1 真人 + 2 Bot”的方式测试整局骨架，而不需要手动切三个人。

### 6. 最后才做最薄的一层 UI

第一部分的 UI 不需要完整棋盘操作。最小版本只要能做到：显示当前阶段、显示玩家经济状态、显示简化地图/轨道状态、显示日志、显示当前规则提示。建轨和运货甚至可以先通过按钮或简化控件驱动，不必一开始就上复杂点击交互。

也就是说，第一部分要的是“能看懂系统正在发生什么”，而不是“操作已经非常顺手”。

## 第一部分测试清单

第一部分必须先写测试，再继续扩 UI。最低要求是下面五组：

+ `finance.test.ts`: 验证现金不足时的融资、最小 5 元倍数筹资、找零和 -10 收入后的 VP 融资。
+ `tilePool.test.ts`: 验证轨道板库存正常扣减，以及耗尽后不能继续使用同类板块。
+ `trackPlacement.test.ts`: 验证从城市出发建轨、不能接他人轨道、不能撞粗黑边、城镇格只能用城镇轨道。
+ `tokenAnchors.test.ts`: 验证玩家标记绑定到具体轨道段后，线路被切断时仍能正确重建所有权。
+ `goodsDelivery.test.ts`: 验证首个同色城市停止、不得重复进城、必须至少用自己的一段 link、自己使用量不少于任何单个对手。

只要这五组测试先绿，后面的 UI 和教学提示才有意义。

## 第一部分完成标准

第一部分完成时，你应该已经能做到这件事：启动应用，创建一局基础版游戏，一个真人玩家和若干 Dummy AI 轮流行动，系统能推进若干个阶段并把状态变化显示出来；同时，命令行测试和 `smoke-playthrough.ts` 都能跑通。

如果还没达到这个标准，就不要往下加复杂 UI、路径候选推荐或完整地图录入。因为那时候你缺的不是表现层，而是骨架本身。

## 结论

第一部分的正确起点不是“先做界面”，也不是“先把所有规则写完”，而是：**先搭状态、阶段草稿、最小地图、最小规则闭环、Dummy AI 和五组核心测试。**只要这一步做对，后续候选运输方案、教学提示、标准版扩展和更顺手的界面都会变成顺势扩张，而不是返工。

---

# Steam第一部分实现日志

第一部分已经从“计划”进入“已落地的最小骨架”阶段。真实仓库与最初设想最大的差异不在于程序被写乱了，而在于它已经从“文档里的结构图”变成了一个真正的 Vite + React + TypeScript 工程，所以根目录必须存在 `package.json`、`tsconfig*.json`、`vite.config.ts`、`vitest.config.ts`、`index.html` 和 `environment.yml` 这类工程配置。它们看起来分散，但这是这类前端项目的常规布局；真正的业务入口仍然集中在 `src/main.tsx`、`src/ui/GameShell.tsx` 和 `src/engine/createGame.ts`。

下面这张结构图反映的是**当前真实仓库**，已经排除了 `node_modules/`、`dist/`、`.DS_Store`、`*.js`、`*.d.ts`、`*.tsbuildinfo` 这类生成物，只保留需要维护的源码、文档和配置。

```text
steam-boardgame-replication/
├── .gitignore
├── AGENTS.md
├── README.md
├── environment.yml
├── index.html
├── package-lock.json
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── vitest.config.ts
├── docs/
│   ├── notes/
│   │   ├── 0404_Codex_Steam基础版规则详解.md
│   │   ├── 0404_Codex_Steam数字化实现方案.md
│   │   └── 0404_Codex_Steam第一部分实现方案及日志.md
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
│   │   ├── phaseMachine.ts
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
│   │   ├── GameShell.tsx
│   │   ├── LogPanel.tsx
│   │   ├── MapBoard.tsx
│   │   ├── PhasePanel.tsx
│   │   ├── PlayerPanel.tsx
│   │   ├── RuleHintPanel.tsx
│   │   ├── hexGeometry.ts
│   │   └── types.ts
│   └── utils/
│       ├── assert.ts
│       ├── format.ts
│       └── ids.ts
└── tests/
    ├── bot.test.ts
    ├── finance.test.ts
    ├── goodsDelivery.test.ts
    ├── routeRanking.test.ts
    ├── scoring.test.ts
    ├── specHelpers.ts
    ├── tilePool.test.ts
    ├── tokenAnchors.test.ts
    └── trackPlacement.test.ts
```

现在这份实现并不是把最初方案逐字照抄出来，而是沿着“先让最小系统能动起来”的原则，把仓库切成了五层。`data/` 负责静态资料，包括地图、行动牌、货物和轨道板库存；`state/` 负责把玩家、地图运行态、供给、阶段和日志组织成统一状态树；`engine/` 负责创建游戏、维护阶段草稿、推进阶段和应用动作；`rules/` 与 `map/` 负责建轨、融资、运输、所有权、路径搜索和图结构重建；`ui/` 和 `bot/` 则分别承接最薄的可视化壳和最弱的随机 Bot。这个切法和最初文档的抽象方向是一致的，但现在已经不再是“占位文件很多的草稿结构”，而是一套能直接启动、推进和观察状态变化的最小工程骨架。

第一部分真正已经实现出来的核心闭环是这样的：`createGame.ts` 基于 `initialState.ts` 创建一局基础版状态，`phaseMachine.ts` 管理“选行动牌 -> 建轨 -> 两轮运输/升级 -> 收入 -> 顺位 -> 下一回合”的最小阶段推进，`draftSession.ts` 把建轨阶段放进可提交、可重置的草稿层，`applyAction.ts` 统一接住动作并调用规则函数修改状态。规则层并没有追求“一次写完所有边角”，而是优先实现了第一部分要求最关键的五类能力：融资与找零、有限 tile pool、建轨合法性、由 segment 重建 link、在完整连接上寻找最基础的运货方案。与此同时，`RandomBot.ts` 通过当前合法动作集合自动挑选一步动作，`botTurn.ts` 把 Bot 接到引擎入口，`GameShell.tsx` 再把地图、阶段信息、玩家状态、规则提示和日志拼成一层能直接启动的浏览器壳，而且现在这个壳已经能通过“自动执行一步 / 自动执行十步 / 提交草稿 / 重置阶段”四个按钮直观看到状态推进。

测试层的组织方式也已经从“文档设想”变成了更接近实际开发的样子。除了计划里最早钉死的 `finance`、`tilePool`、`trackPlacement`、`tokenAnchors`、`goodsDelivery` 五组测试，现在还补了 `routeRanking`、`scoring` 和 `bot` 三组，把路径候选排序、终局计分和 Dummy AI 基础行为也锁住了。配套的 `smoke-playthrough.ts` 用于验证“创建一局并输出最小摘要”的命令行入口，`check-tile-pool.ts` 用于检查板块库存清单，`export-map-data.ts` 则用于在地图数据扩充前先输出摘要做人工核对。

如果用一句话概括当前仓库的实现状态，那就是：**第一部分的目标已经从“先写方案”推进到了“规则引擎、最薄 UI、最弱 Bot、基础测试和工程配置都已落地，但地图、UI 交互和更完整规则还远未完成”的阶段。**这也是为什么现在的真实目录比最初计划更像一个已经起跑的前端工程，而不再只是一个设计草图。
