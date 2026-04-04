# Steam 数字化实现方案

这份文档是面向交付的实现方案，而不是讨论草稿。目标很明确：做一个**可以在电脑上游玩、并且在游玩过程中持续解释规则的《Steam》数字化版本**。这个版本首先服务于“学会规则并验证规则”，其次才服务于视觉还原，因此实现重点应放在规则引擎、状态可视化、合法操作提示和回合推进，而不是一开始就追求重动画、自由拖拽或联网。

本文档以 `docs/references/rulebook_official.pdf` 为主规范来源。`rulebook_scan.pdf`、`player_aid.pdf`、`quick_rules.doc` 和 `rule_summary.doc` 只作为辅助理解或复习资料；如果它们与官方规则书存在粒度差异，程序实现必须以官方规则书为准。

## 交付目标

第一阶段要交付的是一个**可本地运行的单页应用**。玩家可以在浏览器中完成基础版游戏的开局、选行动牌、建轨、运输货物、收支结算、回合推进和终局计分；系统能够实时阻止非法操作，并给出简洁但明确的规则解释。第二阶段在不重写核心结构的前提下，补齐标准版差异、更多地图数据、存档/读档与教学提示。也就是说，第一版不是临时 demo，而是后续可持续迭代的正式底座。

## 技术形式

实现形式建议采用 `Vite + TypeScript + React + SVG`。这里的重点不是“前端潮流”，而是这组组合足够轻、调试效率高、组件表达自然，并且很适合六边形地图、轨道叠层、高亮路径和面板式信息布局。规则状态统一保存在一个应用级 reducer 或 engine store 中，界面层只消费状态和派发动作，不直接修改业务状态。地图渲染优先用 SVG，因为它更适合六边形格、可点击区域、轨道层和标记层的分离，也更方便在开发期观察和调试。

## 开发边界

第一版只做 **Base Game** 的完整实现，但类型、规则配置和阶段机要提前给 **Standard Game** 留接口。这不是为了过度设计，而是因为官方规则书已经把标准版和基础版放在同一本书里，且它们共享大量核心规则。如果现在把基础版写死，后面补标准版时会强迫你拆引擎。

另外，程序必须严格遵守官方规则书里已经明确给出的三类“硬约束”：**有限轨道库存**、**显式费用规则**、**基础版/标准版阶段差异**。这三类都不是可选优化，而是核心规则的一部分。

## 程序组织

下面的目录不是抽象模板，而是针对《Steam》这款桌游的具体实现结构。目录图之后，每个文件都用一句话说明职责，后续实现时就按这个颗粒度落代码。

```text
steam-boardgame-replication/
├── docs/
│   ├── notes/
│   │   ├── 0404_Codex_Steam基础版规则详解.md
│   │   └── 0404_Codex_Steam数字化实现方案.md
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
│   ├── engine/
│   │   ├── applyAction.ts
│   │   ├── createGame.ts
│   │   ├── phaseMachine.ts
│   │   ├── selectors.ts
│   │   └── types.ts
│   ├── rules/
│   │   ├── auction.ts
│   │   ├── finance.ts
│   │   ├── tilePool.ts
│   │   ├── trackPlacement.ts
│   │   ├── trackOwnership.ts
│   │   ├── goodsDelivery.ts
│   │   ├── income.ts
│   │   └── scoring.ts
│   ├── map/
│   │   ├── hexMath.ts
│   │   ├── mapGraph.ts
│   │   ├── linkGraph.ts
│   │   └── routeSearch.ts
│   ├── state/
│   │   ├── gameState.ts
│   │   ├── initialState.ts
│   │   └── actionTypes.ts
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
    ├── trackPlacement.test.ts
    ├── goodsDelivery.test.ts
    └── scoring.test.ts
```

+ `scripts/git-hooks/pre-commit`: 检查本次暂存文件总大小不超过 1 MB。
+ `scripts/check-tile-pool.ts`: 校验板块库存是否与官方规则书 `Tile Manifest` 一致。
+ `scripts/export-map-data.ts`: 把手工整理的地图资料转成程序消费的 TypeScript 数据文件。
+ `scripts/smoke-playthrough.ts`: 跑一段固定动作序列，验证开局到若干回合后的主流程没有坏掉。
+ `src/main.tsx`: 挂载应用入口并注入根组件。
+ `src/App.tsx`: 组合全局状态、界面壳和主游戏页面。
+ `src/styles.css`: 提供整个应用的基础布局、颜色变量和棋盘/侧栏样式。
+ `src/rulesets/base.ts`: 定义基础版的阶段顺序、行动费用、回合数和融资规则。
+ `src/rulesets/standard.ts`: 定义标准版的买资本、竞拍顺位、维护费和行动牌费用差异。
+ `src/data/maps/ne_usa_se_canada.ts`: 存放东北美洲地图的 hex、地形、城市、城镇、黑边和初始城市数字。
+ `src/data/maps/ruhr.ts`: 存放鲁尔地图的 hex、地形、城市、城镇、黑边和初始城市数字。
+ `src/data/tiles/manifest.ts`: 存放官方轨道板块配对、库存数量、town tile 标记和非地形成本。
+ `src/data/tiles/shapes.ts`: 定义每种轨道板的出口集合、旋转规则和可视化路径形状。
+ `src/data/setup/actionTiles.ts`: 定义行动牌编号、名称、顺位值、基础版费用和可选 pass 行为。
+ `src/data/setup/goods.ts`: 定义货物颜色、货物袋构成和 Goods Supply 的初始化规则。
+ `src/data/setup/newCities.ts`: 定义新城市板块颜色与数量。
+ `src/engine/applyAction.ts`: 接收一个动作并返回新的游戏状态、日志和可能的规则提示。
+ `src/engine/createGame.ts`: 根据地图、玩家人数和模式创建完整初始局面。
+ `src/engine/phaseMachine.ts`: 管理当前阶段、当前行动者、行动轮次和回合推进。
+ `src/engine/selectors.ts`: 提供界面层读取合法动作、可点目标和当前摘要信息的只读查询。
+ `src/engine/types.ts`: 定义引擎级返回值结构，例如 action result、rule explanation 和 preview。
+ `src/rules/auction.ts`: 处理基础版初始拍卖和标准版每回合竞拍的合法性与支付规则。
+ `src/rules/finance.ts`: 处理现金、融资、找零、负收入、破产和标准版维护费相关规则。
+ `src/rules/tilePool.ts`: 处理轨道板库存扣减、归还和“该配置是否还有剩余”的判定。
+ `src/rules/trackPlacement.ts`: 判断建轨、改向和升级现有轨道是否合法以及费用是多少。
+ `src/rules/trackOwnership.ts`: 处理完整 link、未完成连接、失去所有权和无主连接接管。
+ `src/rules/goodsDelivery.ts`: 处理货物可达性、首个同色城市停止、借道限制和得分分配。
+ `src/rules/income.ts`: 处理阶段四的收支结算和收入轨效果。
+ `src/rules/scoring.ts`: 处理终局收入换分、完整 link 计分和平局判定。
+ `src/map/hexMath.ts`: 提供六边形坐标、邻接方向和边索引计算。
+ `src/map/mapGraph.ts`: 把地图数据转成可供建轨和边界检查使用的六边格图结构。
+ `src/map/linkGraph.ts`: 根据当前轨道状态构造 link、判断是否完整并记录所有权。
+ `src/map/routeSearch.ts`: 在已完成 link 图上搜索某枚货物的合法运输路径。
+ `src/state/gameState.ts`: 定义完整游戏状态树，包括 map、economy、turn 和 supply。
+ `src/state/initialState.ts`: 提供从规则集和地图数据生成初始 state 的工厂函数。
+ `src/state/actionTypes.ts`: 定义界面与引擎之间传递的有限动作集合。
+ `src/ui/GameShell.tsx`: 组织整页布局，把棋盘、面板和日志拼成最终界面。
+ `src/ui/MapBoard.tsx`: 承载 SVG 棋盘与各显示层。
+ `src/ui/HexLayer.tsx`: 画地形、城市、城镇、黑边和坐标辅助信息。
+ `src/ui/TrackLayer.tsx`: 画已铺轨道、改向预览和 link 完成状态。
+ `src/ui/TokenLayer.tsx`: 画玩家所有权标记、城市发展标记和新城市板块。
+ `src/ui/PhasePanel.tsx`: 显示当前回合、阶段、当前行动者和下一步可执行动作。
+ `src/ui/ActionTilePanel.tsx`: 显示可选行动牌、已选行动牌与其即时费用或 pass 选项。
+ `src/ui/PlayerPanel.tsx`: 显示每位玩家的现金、收入、胜利点和机车等级。
+ `src/ui/GoodsSupplyPanel.tsx`: 显示货物供应区、货物袋状态和新城市板剩余量。
+ `src/ui/RuleHintPanel.tsx`: 显示当前规则解释、非法原因和系统建议的下一步。
+ `src/ui/LogPanel.tsx`: 按时间顺序显示动作日志、支付日志和关键结算。
+ `src/ui/DeliveryPreview.tsx`: 预览一条候选运货路径会给哪些玩家带来多少分。
+ `src/ui/IllegalMoveNotice.tsx`: 在非法点击时给出简洁、明确的错误说明。
+ `src/utils/assert.ts`: 提供引擎内部的不变量检查。
+ `src/utils/ids.ts`: 提供稳定的实体 ID 生成与解析。
+ `src/utils/format.ts`: 提供金额、分数、阶段名和日志文本格式化。
+ `tests/auction.test.ts`: 验证初始拍卖和标准版竞拍规则。
+ `tests/finance.test.ts`: 验证融资、找零、负收入和破产逻辑。
+ `tests/tilePool.test.ts`: 验证板块库存扣减与耗尽后的非法建轨。
+ `tests/trackPlacement.test.ts`: 验证建轨、改向、升级与黑边/城镇限制。
+ `tests/goodsDelivery.test.ts`: 验证交付路径、首个同色城市停止和借道比例限制。
+ `tests/scoring.test.ts`: 验证终局计分和平局判定。

## 核心状态设计

程序内部的核心状态应拆成四块：`mapState`、`economyState`、`turnState`、`supplyState`。`mapState` 负责地图、轨道和 link；`economyState` 负责玩家的现金、收入、胜利点和机车等级；`turnState` 负责当前阶段、回合、行动顺序和当前待执行的阶段动作；`supplyState` 负责货物袋、Goods Supply、轨道板库存、新城市板和城市发展标记。这样拆开的好处是：地图变化、经济变化、阶段推进和公共库存变化都能被独立测试。

类型层要预留 `gameMode: "base" | "standard"`，但第一阶段默认只开放基础版界面入口。`ruleset` 数据应负责承载两种模式的回合阶段顺序、行动费用、融资方式、维护费和顺位决定方式，而不是把这些常量散落在逻辑里。

## 规则引擎设计

规则引擎必须走**有限动作驱动**。界面层不应该直接改状态，而应该发出类似 `selectActionTile`、`passOptionalAction`、`buildTrackTile`、`redirectTrack`、`improveTrack`、`placeNewCity`、`placeCityGrowth`、`upgradeLocomotive`、`deliverGoods`、`passMoveRound`、`resolveIncomePhase`、`advanceTurnOrder` 和 `startNextTurn` 这样的动作。`applyAction` 是唯一写状态入口，它负责调用纯规则函数、生成新状态、记录日志，并在必要时返回非法原因。

建轨逻辑不要写成一个笼统大函数，而应该分成四类规则：**放置新轨**、**改向未完成连接**、**升级既有轨道**、**接管无主未完成连接**。官方规则书对这四件事给的限制不同，特别是“改向不算延伸”“升级必须保留旧线”“只有特定玩家能接管无主未完成连接”，如果混成一个判断函数，后面会非常难调。

货物运输逻辑也不要偷懒自动最优化。程序应当先枚举或搜索所有合法路径，再要求玩家显式选择一条路径，然后再给出每位玩家本次获得的线路分预览。因为《Steam》里同一枚货物可能存在多条合法走法，而桌面上这一步本来就是由玩家自己声明路径的，程序不应隐式替玩家做策略决策。

## 地图与板块数据设计

地图数据需要同时支持**视觉显示**和**规则判定**。因此每张地图不只是“有一个背景图”，而应该是一组六边格数据：hex 坐标、地形类型、是否有河流、哪些边不可通过、城市或城镇信息、城市颜色、初始城市数字。除此之外，还要能从这些数据构建出一个邻接图，用于判断轨道是否能沿某边放置、是否撞到粗黑边，以及 link 是否完成。

板块数据必须按官方 `Tile Manifest` 实现为**有限库存**。每个板块应有：板块 ID、正反面配对、出口集合、是否为城镇轨道、是否为 crossing 或 passing 类型、非地形成本，以及剩余数量。只有这样，建轨阶段才能真正按官方规则阻止“库存耗尽后继续放同类板块”。

## 界面设计

界面采用三栏结构。中间是主棋盘，显示地图、轨道、玩家标记和临时高亮；左侧是全局状态和公共区，显示回合、阶段、行动顺序、行动牌、Goods Supply 和轨道库存摘要；右侧是当前玩家面板，显示现金、收入、胜利点、机车等级、当前操作说明和日志。

棋盘是整个学习体验的中心，因此要长期保持三层可视化分离。第一层是固定地图信息，例如城市、城镇、地形、河流和粗黑边；第二层是当前局面信息，例如轨道、新城市、城市发展标记和 link 所有权；第三层是决策辅助信息，例如候选落点、候选路径、本次交付预览和非法原因。这样玩家在点来点去的时候，既能操作，也能顺便学规则。

UI 还必须有一个持续可见的“规则解释区”。它不是可选装饰，而是这个项目相对桌游模拟器的核心差异：当玩家想铺一块轨却被拒绝时，系统不该只闪一个红框，而应该明确告诉他“不能放，因为你正在延伸别人的轨道”或者“不能放，因为这条轨道会撞上粗黑边”。这正是数字化版本帮助学习规则的地方。

## 交付里程碑

第一阶段交付基础版可游玩骨架：支持开局、选行动牌、建轨、免费升级机车、运输货物、结算收入、推进回合和终局计分。到这个阶段，玩家虽然还不会得到很多美术反馈，但已经能完整走完一局基础版。

第二阶段补齐教学与验证能力：加入动作日志、候选路径预览、非法操作解释、一步撤销、保存/读档和固定剧本回放。到这个阶段，项目就真正具备“边玩边学规则”的价值。

第三阶段再补标准版、更多地图和更顺手的交互。由于前面已经把 `ruleset`、tile pool 和 phase machine 设计好，这一阶段主要是在既有结构上扩展，而不是返工。

## 测试与脚本

测试优先级应该围绕最容易写错的规则边界，而不是先追求测试数量。最先覆盖的就是：融资与找零、初始顺位拍卖、有限板块库存、黑边与城镇建轨限制、未完成连接失去所有权、升级必须保留旧线、货物必须停在首个同色城市、自己用路不少于任何单个对手，以及终局计分和平局判定。

除了单测，还要保留一个 `smoke-playthrough.ts` 脚本，专门从 CLI 跑一条固定剧本。这样当你以后改 UI 时，仍然能快速确认引擎有没有把核心规则改坏。

## 规则书留白与程序判定方案

+ `City Growth` 或 `Urbanization` 需要从 `Goods Supply` 取一整组货物，但官方规则书没有写当所有 supply 组都已经耗尽时这两个动作还能否选择；建议允许选择并执行，只是放出的城市不再获得额外 cubes，同时在日志里标记为 `supply depleted`。
+ 官方规则书没有明确写当所有印刷城市都已经有 `City Growth marker` 时，`City Growth` 是否仍可被选择；建议允许被选择，但执行时若不存在合法目标城市，则只能走 `pass option`。
+ 破产后留下的“无主已完成 link”不会为任何人得分，但规则书没有明确它在“你使用自己 link 的数量必须不少于任何单个其他玩家”这条限制里怎么计数；建议把无主 link 当作 `owner = null` 的中立路段，允许经过，但不计入任何玩家的使用配额比较。
+ 官方规则书没有明确写无主已完成 link 之后能否被别人继续 `improve existing track`；建议允许升级，只要升级后的板块完整保留旧线走向，并满足一般的升级合法性。
+ 官方规则书没有把“新城市一落下就补全别人的未完成连接”在时间上展开成精确 spec；建议定义为新城市一经放置就立即刷新 link 图，因此从那一刻开始，这些 link 已经是完整 link，可供后续运输阶段使用。
+ 官方规则书没有规定数字界面在存在多条合法路径时应如何自动选择；建议不自动替玩家选路，而是让玩家显式点击完整路径，并在确认前展示本次交付会给各方带来的线路分。

## 结论

这个项目最合适的交付方向，不是“桌游模拟器”式的大而全，而是“规则引擎 + 教学型界面”的小而稳。只要规则引擎把官方规则书中已经明确的内容严格实现，把有限板块库存、阶段机和交付判定做对，再把规则书的少数留白点显式收口成程序规则，这个仓库就能产出一个真正有学习价值、并且后续可以继续扩展的《Steam》数字化版本。
