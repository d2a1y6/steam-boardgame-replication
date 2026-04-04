# Steam 数字化实现方案

这份文档是面向交付的实现方案。目标不是先做一个“能点几下的原型”，而是直接搭出一个**可持续扩展的规则引擎 + 教学型界面**底座：玩家在电脑上完成《Steam》基础版的一整局游戏，系统在每一步里给出合法操作、非法原因、候选运输方案和关键规则解释，从而让实现过程和成品都能服务于“学会规则”。

本文档以 `docs/references/rulebook_official.pdf` 为主规范来源。`rulebook_scan.pdf`、`player_aid.pdf`、`quick_rules.doc` 和 `rule_summary.doc` 只能作为辅助参考；如果表达粒度不同，程序实现必须以官方规则书为准。

## 目标与边界

第一阶段交付的是**基础版可游玩的单页应用**。玩家应能完成开局、选行动牌、建轨、运输货物、收支结算、回合推进和终局计分；系统应实时阻止非法操作，并解释原因。这个阶段就应该能真正跑完一局，而不是只展示棋盘。

第二阶段才补标准版、更多地图、存档与更强教学功能，但第一阶段的类型设计和规则结构必须提前给标准版留接口。原因很简单：官方规则书已经把基础版和标准版写在同一套体系里，共享大部分核心逻辑，如果现在把基础版写死，后面补标准版时会直接拖垮结构。

这个项目里最重要的不是画面，而是四类能力：**有限库存的轨道板管理、分阶段的状态推进、货物运输合法性搜索、以及对玩家操作的规则解释**。所有架构设计都应围绕这四件事展开。

## 技术形式

实现形式建议采用 `Vite + TypeScript + React + SVG`。React 用来组织状态驱动的面板和棋盘，SVG 用来表达六边形地图、轨道层、高亮路径和标记层。规则引擎不依赖 UI，UI 只读取状态并派发动作。

不建议一开始上 canvas、游戏引擎或复杂拖拽。对《Steam》来说，真正的复杂度不在动画，而在建轨、分段所有权、交付路径和阶段结算。技术选型应该让你更容易调规则，而不是更容易做视觉噱头。

## 交互原则

这个项目是教学工具，不是桌游模拟器。它的交互设计必须优先回答“为什么这步能做”以及“为什么这步不能做”。因此，界面里必须长期存在规则解释区、运输方案预览区和当前阶段提示区，而不是只做一个看起来像桌游桌面的静态棋盘。

同时，它也不应该把所有细节都强加给玩家手动输入。特别是运货阶段，如果程序要求玩家在密集六边形中一段一段点完整路径，体验会非常差，也不利于学习规则；程序应当自动算出合法路径候选，再让玩家做方案层面的选择。

## 程序结构

下面的目录是针对《Steam》这款桌游量身定制的，不是任意桌游通用模板。目录图之后，每个文件都用一句话写出职责。

```text
steam-boardgame-replication/
├── docs/
│   ├── notes/
│   │   ├── 0404_Codex_Steam基础版规则详解.md
│   │   ├── 0404_Codex_Steam数字化实现方案.md
│   │   └── 0404_Codex_Steam第一部分具体实现方案.md
│   └── references/
│       ├── player_aid.pdf
│       ├── quick_rules.doc
│       ├── rule_summary.doc
│       ├── rulebook_official.pdf
│       └── rulebook_scan.pdf
├── scripts/
│   ├── git-hooks/
│   │   └── pre-commit
│   ├── check-tile-pool.ts
│   ├── export-map-data.ts
│   └── smoke-playthrough.ts
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── styles.css
│   ├── rulesets/
│   │   ├── base.ts
│   │   └── standard.ts
│   ├── data/
│   │   ├── maps/
│   │   │   ├── ne_usa_se_canada.ts
│   │   │   └── ruhr.ts
│   │   ├── tiles/
│   │   │   ├── manifest.ts
│   │   │   └── shapes.ts
│   │   └── setup/
│   │       ├── actionTiles.ts
│   │       ├── goods.ts
│   │       └── newCities.ts
│   ├── state/
│   │   ├── gameState.ts
│   │   ├── draftState.ts
│   │   ├── actionTypes.ts
│   │   └── initialState.ts
│   ├── engine/
│   │   ├── applyAction.ts
│   │   ├── createGame.ts
│   │   ├── phaseMachine.ts
│   │   ├── draftSession.ts
│   │   ├── selectors.ts
│   │   └── types.ts
│   ├── rules/
│   │   ├── auction.ts
│   │   ├── finance.ts
│   │   ├── tilePool.ts
│   │   ├── trackPlacement.ts
│   │   ├── tokenAnchors.ts
│   │   ├── trackOwnership.ts
│   │   ├── goodsDelivery.ts
│   │   ├── routeRanking.ts
│   │   ├── income.ts
│   │   └── scoring.ts
│   ├── map/
│   │   ├── hexMath.ts
│   │   ├── mapGraph.ts
│   │   ├── segmentGraph.ts
│   │   ├── linkGraph.ts
│   │   └── routeSearch.ts
│   ├── bot/
│   │   ├── Bot.ts
│   │   ├── RandomBot.ts
│   │   └── botTurn.ts
│   ├── ui/
│   │   ├── GameShell.tsx
│   │   ├── MapBoard.tsx
│   │   ├── HexLayer.tsx
│   │   ├── TrackLayer.tsx
│   │   ├── TokenLayer.tsx
│   │   ├── PhasePanel.tsx
│   │   ├── ActionTilePanel.tsx
│   │   ├── PlayerPanel.tsx
│   │   ├── GoodsSupplyPanel.tsx
│   │   ├── RuleHintPanel.tsx
│   │   ├── LogPanel.tsx
│   │   ├── RouteCandidatePanel.tsx
│   │   ├── DeliveryPreview.tsx
│   │   └── IllegalMoveNotice.tsx
│   └── utils/
│       ├── assert.ts
│       ├── ids.ts
│       └── format.ts
└── tests/
    ├── auction.test.ts
    ├── finance.test.ts
    ├── tilePool.test.ts
    ├── tokenAnchors.test.ts
    ├── trackPlacement.test.ts
    ├── goodsDelivery.test.ts
    ├── routeRanking.test.ts
    └── scoring.test.ts
```

+ `scripts/git-hooks/pre-commit`: 检查本次暂存文件总大小不超过 1 MB。
+ `scripts/check-tile-pool.ts`: 校验轨道板库存是否与官方规则书 `Tile Manifest` 一致。
+ `scripts/export-map-data.ts`: 把地图手工录入稿转成程序消费的 TypeScript 数据。
+ `scripts/smoke-playthrough.ts`: 用固定动作序列从命令行跑一段完整流程，验证主引擎不崩。
+ `src/main.tsx`: 挂载前端入口。
+ `src/App.tsx`: 组织全局状态和主页面。
+ `src/styles.css`: 提供全局布局、颜色变量和棋盘/侧栏样式。
+ `src/rulesets/base.ts`: 定义基础版回合顺序、行动费用、融资方式和回合数。
+ `src/rulesets/standard.ts`: 定义标准版的买资本、竞拍顺位、维护费和行动牌费用差异。
+ `src/data/maps/ne_usa_se_canada.ts`: 存东北美洲地图的 hex、地形、边界、城市和城镇数据。
+ `src/data/maps/ruhr.ts`: 存鲁尔地图的 hex、地形、边界、城市和城镇数据。
+ `src/data/tiles/manifest.ts`: 存官方板块配对、数量、板块类别和非地形成本。
+ `src/data/tiles/shapes.ts`: 存每种轨道板的出口集合和可视化路径定义。
+ `src/data/setup/actionTiles.ts`: 定义行动牌名称、顺位值、基础版费用和 pass 规则。
+ `src/data/setup/goods.ts`: 定义货物颜色、货物袋构成和 Goods Supply 初始化规则。
+ `src/data/setup/newCities.ts`: 定义新城市板块颜色与数量。
+ `src/state/gameState.ts`: 定义已提交局面状态树。
+ `src/state/draftState.ts`: 定义阶段内可回滚的草稿状态树。
+ `src/state/actionTypes.ts`: 定义界面和 Bot 可发出的有限动作集合。
+ `src/state/initialState.ts`: 根据规则集、地图和玩家人数创建开局状态。
+ `src/engine/applyAction.ts`: 接收一个动作并返回新状态、日志和规则提示。
+ `src/engine/createGame.ts`: 创建带有玩家、公共区和地图的完整新对局。
+ `src/engine/phaseMachine.ts`: 维护当前阶段、当前玩家、行动轮次和阶段切换。
+ `src/engine/draftSession.ts`: 管理阶段草稿、阶段提交和“回合内重置”。
+ `src/engine/selectors.ts`: 给 UI 和 Bot 提供合法动作、候选目标和状态摘要查询。
+ `src/engine/types.ts`: 定义引擎返回值、提示结构和预览数据类型。
+ `src/rules/auction.ts`: 处理基础版初始拍卖和标准版每回合拍卖规则。
+ `src/rules/finance.ts`: 处理现金、融资、找零、负收入、维护费和破产。
+ `src/rules/tilePool.ts`: 管理有限轨道库存的扣减、归还和耗尽检查。
+ `src/rules/trackPlacement.ts`: 判断建轨、改向和升级轨道是否合法以及费用是多少。
+ `src/rules/tokenAnchors.ts`: 管理玩家标记与具体轨道段的绑定和重分配。
+ `src/rules/trackOwnership.ts`: 根据锚点和 segment 图计算完整 link、未完成连接和接管逻辑。
+ `src/rules/goodsDelivery.ts`: 判断货物能否运输、必须在哪个同色城市停下以及谁得分。
+ `src/rules/routeRanking.ts`: 对合法路径做排序，产出 1 至 3 条候选运输方案。
+ `src/rules/income.ts`: 处理收入阶段的拿钱、付钱和连锁融资。
+ `src/rules/scoring.ts`: 处理终局收入换分、完整 link 计分和平局判定。
+ `src/map/hexMath.ts`: 提供六边形坐标与边索引计算。
+ `src/map/mapGraph.ts`: 把地图数据转成可供建轨检查的六边格图。
+ `src/map/segmentGraph.ts`: 把每块轨道板拆成可定位的轨道段，用于锚点与所有权判定。
+ `src/map/linkGraph.ts`: 从 segment 图聚合出完整 link 与未完成连接。
+ `src/map/routeSearch.ts`: 搜索某枚货物的所有合法运输路径。
+ `src/bot/Bot.ts`: 定义 Bot 接口与最小行为协议。
+ `src/bot/RandomBot.ts`: 实现一个只会随机选择合法动作的 Dummy AI。
+ `src/bot/botTurn.ts`: 驱动 Bot 在自己的回合里连续执行合法动作。
+ `src/ui/GameShell.tsx`: 组织整个页面布局。
+ `src/ui/MapBoard.tsx`: 承载 SVG 棋盘与所有显示层。
+ `src/ui/HexLayer.tsx`: 画地形、城市、城镇、黑边和坐标辅助信息。
+ `src/ui/TrackLayer.tsx`: 画已铺轨道、候选落点和改向/升级预览。
+ `src/ui/TokenLayer.tsx`: 画玩家标记、城市发展标记和新城市板块。
+ `src/ui/PhasePanel.tsx`: 显示当前阶段、当前行动者和可执行动作摘要。
+ `src/ui/ActionTilePanel.tsx`: 显示可选行动牌、即时费用和 pass 选项。
+ `src/ui/PlayerPanel.tsx`: 显示玩家现金、收入、胜利点、机车等级和 Bot 状态。
+ `src/ui/GoodsSupplyPanel.tsx`: 显示 Goods Supply、货物袋摘要和新城市板剩余量。
+ `src/ui/RuleHintPanel.tsx`: 显示当前规则解释和非法原因。
+ `src/ui/LogPanel.tsx`: 按时间顺序显示动作日志和关键结算。
+ `src/ui/RouteCandidatePanel.tsx`: 列出系统算出的运输候选方案并允许玩家选择。
+ `src/ui/DeliveryPreview.tsx`: 预览当前选中运输方案会带来的得分分配。
+ `src/ui/IllegalMoveNotice.tsx`: 在非法操作时弹出简短明确的说明。
+ `src/utils/assert.ts`: 做引擎内部的不变量检查。
+ `src/utils/ids.ts`: 生成和解析稳定实体 ID。
+ `src/utils/format.ts`: 格式化金额、分数、阶段名和日志文本。
+ `tests/auction.test.ts`: 验证拍卖顺位和支付规则。
+ `tests/finance.test.ts`: 验证融资、找零、负收入和破产逻辑。
+ `tests/tilePool.test.ts`: 验证轨道板库存耗尽后的非法建轨。
+ `tests/tokenAnchors.test.ts`: 验证城市化打断线路后的标记锚点重算。
+ `tests/trackPlacement.test.ts`: 验证建轨、改向、升级和黑边/城镇限制。
+ `tests/goodsDelivery.test.ts`: 验证交付路径、首个同色城市停止和借道比例限制。
+ `tests/routeRanking.test.ts`: 验证候选运输方案排序与预览输出。
+ `tests/scoring.test.ts`: 验证终局计分和平局判定。

## 核心状态设计

程序内部必须区分**已提交状态**和**阶段草稿状态**。`gameState` 表示已经正式进入游戏历史的局面；`draftState` 表示当前阶段或当前玩家尚未确认的临时操作。这样做不是多余设计，而是因为《Steam》里建轨和融资常常连续发生，玩家很可能在本阶段结束前想整体推翻重来。与其做脆弱的一步撤销，不如把“本阶段开始时的快照”和“本阶段当前草稿”作为基本机制。

因此，推荐的状态层次是：

+ `mapState`: 地图、已铺轨道、segment、link、新城市、城市发展标记。
+ `economyState`: 现金、收入、胜利点、机车等级、是否破产。
+ `turnState`: 当前回合、阶段、顺位、行动轮次、当前行动者。
+ `supplyState`: 货物袋、Goods Supply、轨道板库存、新城市板、标记库存。
+ `draftState`: 当前阶段的工作副本、操作日志和可回滚起点。

阶段推进规则应当是：进入一个允许连续编辑的阶段时，先创建草稿；玩家在草稿上操作；玩家点击“确认阶段结束”时再提交到 `gameState`。如果玩家点击“重置本阶段”，就直接丢弃草稿，恢复到阶段开始时的快照。这比一步撤销更符合《Steam》的真实决策结构。

## 所有权与线路模型

《Steam》最危险的实现坑，不是普通建轨，而是**被城市化打断后的线路所有权重构**。如果程序只存抽象的 `linkGraph`，一旦中间插入新城市，原来的长线路会被切成两段，系统很容易不知道原先玩家的所有权标记到底落在哪一边。

因此，这个项目不能只建 `mapGraph + linkGraph` 两层，还必须引入 **segmentGraph + tokenAnchor**。具体来说：

+ 每块轨道板在图里应拆成若干可定位的轨道段 `segment`。
+ 玩家的线路所有权标记不是只挂在“整条 link”上，而是绑定到某个确定的 `segmentId`。
+ `linkGraph` 是从这些 segment 聚合出来的视图，而不是唯一真相。

这样一来，当 `Urbanization` 把一个城镇升级成城市并打断原线路时，程序可以根据锚点判断玩家标记在断点哪一侧，从而把所有权重新分配到正确的半截。对于被切开的另一半，如果没有锚点继续支撑，就按规则或既定判定方案转成无主连接。这个模型会比“直接存 link 所有权”更啰嗦，但它是后续所有复杂局面的稳定基础。

## 运输路径与方案推荐

运货阶段不应要求玩家在密集六边形中一段段点完整路径。桌面上玩家用手比划路线，是因为桌面没有算法；数字版恰恰应该把算法优势用起来。

推荐流程是：

+ 玩家先点击一个货物。
+ 程序根据机车等级、已完成 link、首个同色城市停止、不得重复经过同一城市、借道比例限制等规则，搜索全部合法路径。
+ 程序再对这些路径做排序，产出 1 到 3 条候选方案，例如“自己得分最高”“机车要求最低”“对手得分最少”。
+ 玩家只需在候选方案中点选其一，系统再展示 `DeliveryPreview` 并执行。

这意味着 `routeSearch.ts` 不只做“能不能到”，而是要产出路径集合；`routeRanking.ts` 则负责把路径集合整理成适合 UI 呈现的少量候选方案。这样既保证规则正确，也保证交互不反人类。

## Dummy AI 设计

如果这个项目的目标是“帮助学习规则”，那它必须允许一个真人只控制自己的一个阵营，其余玩家由系统托管。否则用户为了测试一个规则，需要自己在 3 到 4 个身份之间来回切换，学习效率会很差。

因此，第一阶段就应该把 **Bot 接口** 加入架构，哪怕只实现一个 `RandomBot`。这个 Bot 不需要会赢，只需要会做三件事：

+ 读取当前合法动作集合。
+ 从合法动作中挑一个最简单的动作。
+ 按阶段不断行动，直到自己的本阶段结束。

有了这个最弱 Bot，真人玩家就能在热座环境里只操作自己一个颜色，剩余座位交给程序随机跑。后续如果真的需要更强 AI，也是在这个接口之上替换策略，而不是重新设计引擎。

## 界面设计

界面采用三栏结构。中间是主棋盘，负责显示地图、轨道、玩家标记和临时高亮；左侧显示公共区，包括行动牌、顺位、Goods Supply 和轨道库存；右侧显示当前玩家信息、规则提示、候选运输方案和日志。

棋盘至少应长期维持三层信息：

+ 固定地图层：地形、城市、城镇、河流、粗黑边。
+ 当前局面层：轨道、新城市、城市发展标记、玩家锚点。
+ 决策辅助层：候选落点、候选路径、非法原因、高亮方案。

此外，界面里必须有两个教学型面板：`RuleHintPanel` 和 `RouteCandidatePanel`。前者告诉玩家为什么一块轨不能放、为什么某次融资会触发找零；后者告诉玩家当前货物有哪些合法走法，以及每种走法的结果。没有这两个面板，这个项目就只是“桌游搬到电脑上”，而不是“规则学习工具”。

## 测试策略

测试不该从视觉组件开始，而应先覆盖最容易写错的规则边界。第一优先级是：融资与找零、初始顺位拍卖、有限板块库存、黑边与城镇限制、未完成连接失去所有权、升级必须保留旧线、城市化打断线路后的锚点重算、交付必须停在首个同色城市、借道比例限制，以及终局计分。

除了单测，还应保留一个 `smoke-playthrough.ts` 脚本，从 CLI 跑一段简化回合序列。这个脚本不替代测试，但它能快速检查“引擎整体还能不能从开局推进到若干回合之后”，对早期开发特别值。

## 规则书留白与程序判定方案

+ `City Growth` 或 `Urbanization` 需要从 `Goods Supply` 取一整组货物，但官方规则书没有写当所有 supply 组都已经耗尽时这两个动作还能否选择；建议允许选择并执行，只是放出的城市不再获得额外 cubes，同时在日志里标记为 `supply depleted`。
+ 官方规则书没有明确写当所有印刷城市都已经有 `City Growth marker` 时，`City Growth` 是否仍可被选择；建议允许被选择，但执行时若不存在合法目标城市，则只能走 `pass option`。
+ 破产后留下的“无主已完成 link”不会为任何人得分，但规则书没有明确它在“你使用自己 link 的数量必须不少于任何单个其他玩家”这条限制里怎么计数；建议把无主 link 当作 `owner = null` 的中立路段，允许经过，但不计入任何玩家的使用配额比较。
+ 官方规则书没有明确写无主已完成 link 之后能否被别人继续 `improve existing track`；建议允许升级，只要升级后的板块完整保留旧线走向，并满足一般的升级合法性。
+ 官方规则书没有把“新城市一落下就补全别人的未完成连接”在时间上展开成精确 spec；建议定义为新城市一经放置就立即刷新 `segmentGraph` 与 `linkGraph`，因此从那一刻起这些 link 已经是完整 link，可供后续运输阶段使用。
+ 官方规则书没有规定数字界面在存在多条合法路径时应如何自动选择；建议不自动替玩家拍板，而是由程序给出少量候选方案并由玩家选择。

## 结论

这个项目最合适的方向，不是“桌游模拟器”式的大而全，而是“规则引擎 + 教学型界面 + 最弱 Bot”的小而稳系统。只要你把有限库存、阶段草稿、segment 锚点、候选路径和 Dummy AI 这几件事一开始就放进结构里，后面的功能都会顺着长；如果把它们当成“以后再补的增强项”，后续几乎一定会返工。
