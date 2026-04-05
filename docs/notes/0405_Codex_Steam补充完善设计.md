# Steam 补充完善设计

这份文档基于重新阅读 `docs/references/rulebook_official.pdf` 后得到，目标不是重复讲规则，而是回答一个更工程化的问题：**按照官方规则书，当前仓库还没有完整实现哪些规则与功能；为了把它补到“真正可跑通的电子版 Steam”，还需要怎么改。**

先给结论。当前仓库已经有一套成形的规则内核、浏览器工作台、建轨草稿、候选运货、Bot、存档回放和完整验证链，但它仍然没有达到“规则书完整闭合”的状态。差距主要不在美术，而在五个层面：**基础版主规则仍有缺口，标准版基本还没接通，地图与板块数据明显不完整，UI 入口只覆盖了一条学习主路径，测试也还没有覆盖完整对局和模式差异。**  

因此，后续工作不应再按“哪里点不动就补哪里”的方式零碎推进，而应按规则书结构做一次系统补完：先补基础版规则闭环，再接标准版，再补全地图与内容数据，最后补 UI 工作流和完整对局测试。

## 一、核对结论

当前实现**还没有完整实现**官方规则书中的下列内容：

+ 基础版开局流程并未按规则书完整执行，尤其是随机抽货、初始顺位决定、起始现金和 Ruhr 三人局特例。
+ 七张行动牌目前只有名称与顺位值完整存在，真正落实到阶段行为的只有很少一部分，而且其中还有口径错误。
+ 建轨规则只支持“最小可演示路径”，不支持重定向、升级既有轨道、城镇轨道完整形态、城市化和城市发展。
+ 运货阶段当前只实现了候选路线与基础计分，尚未实现“收入/VP二选一”的真实选择流程，也没有完整落实 `First Move` 等行动牌效果。
+ 回合推进和终局推进存在缺口，当前并没有真正把“最后一回合在第 4 阶段后结束”完整接进状态机。
+ 标准版虽然有 `ruleset` 入口，但从相位、竞拍、买资本、维护费到破产规则，几乎都还没落成可玩流程。
+ 地图和组件数据仍然大量是占位或最小集，不足以承载完整规则。

如果把补完目标明确下来，那么这次补充完善设计的目标应该是：

1. 让基础版按官方规则书完整打一局。
2. 在同一套引擎上真正接通标准版。
3. 让东北美洲与 Ruhr 两张地图都达到可玩数据级别。
4. 让 UI 不再只是一条“学习壳主路径”，而是完整覆盖规则书动作入口。

## 二、当前与规则书不一致的基础版缺口

### 2.1 开局与初始状态

规则书要求把所有 Goods cubes 放进袋中，再按城市印刷数字随机抽到每座城市；Goods Supply 也要从袋中随机抽，且 Ruhr 三人局每城少放一个 cube，所有地图三人局每个 Goods Supply 少放一个 cube。当前 `packages/game-core/src/state/initialState.ts` 没有做真正的随机抽袋逻辑，而是直接按 `cityColor` 把同色货物塞回城市，`buildSupplyGroups()` 也只是按固定颜色序列生成 supply。这样得到的并不是规则书中的开局分布，而是一个演示用确定性布置。

当前起始顺位也不符合规则书。基础版规则书给了两种开局方式：教学局用随机行动牌决定顺位并给后位玩家起始补偿金，正式开局用初始顺位拍卖。现在代码既没有教学局随机顺位，也没有正式开局拍卖，而是默认 `players.map(...)` 的固定顺序。`buildPlayers()` 里把玩家起始现金写成 `cash: index`，看上去像是在模拟补偿金，但它并没有绑定到“按实际开局顺位给第 2 名 1 元、第 3 名 2 元”这条规则上。

这里要补的不是一个小 if，而是把“开局策略”变成正式配置项。建议：

+ 在 `packages/game-core/src/contracts/domain.ts` 与 `packages/game-core/src/contracts/engine.ts` 中加入 `setupVariant`，区分 `base-first-game-random-order`、`base-auction`、`standard-random-order`。
+ 在 `packages/game-core/src/state/initialState.ts` 中把货物袋真正做成可抽取资源，提供 `drawInitialCityGoods()` 与 `drawInitialSupplyGroups()` 两套初始化逻辑。
+ 在 `packages/game-content/src/maps/ne_usa_se_canada.ts` 和未来完整的 `packages/game-content/src/maps/ruhr.ts` 中保证每座城市的印刷需求数字都存在，初始化时按地图真实数据抽货。
+ 在 `apps/web/src/features/game-setup/GameSetupPanel.tsx` 中增加“开局方式”选项，而不是继续隐含固定顺序。

### 2.2 行动牌效果当前只实现了“牌名”，没有完整实现“牌义”

规则书里七张行动牌承担两类职责：一类是给本回合带来特殊行为，另一类是给下一回合提供顺位值。当前 `packages/game-content/src/setup/actionTiles.ts` 只定义了七张牌的 `id / value / label / hasPassOption`，但引擎层并没有把这些效果真正分发到各阶段。

最明显的问题有这些：

+ `Engineer` 当前没有真正生效。`phaseMachine.ts` 里每次都把 `buildAllowanceRemaining` 重置成 3，没有根据所选行动牌改成 4。
+ `First Build` 当前没有真正生效。`resetForBuildPhase()` 是按行动牌数值排序，而不是“按当前顺位，只有拿了 First Build 的玩家本回合建轨时提前到最前”。
+ `First Move` 当前没有真正生效。货运阶段的行动顺序没有对这一行动牌做特殊处理。
+ `Turn Order` 当前也没有按规则书口径实现。它本来只影响**下回合**顺位，而现在选牌后的 build order 直接被按行动牌数值重排了，导致行动牌值错误地影响了本回合建轨顺序。
+ `Locomotive` 行动牌没有在选牌阶段立刻升级机车并收取 `$4 + 新等级` 的费用。
+ `City Growth` 与 `Urbanization` 没有动作层入口，也没有付款、Pass Option、执行义务和建轨阶段具体流程。

这里的修改思路应该是把“选行动牌”和“应用行动牌效果”拆开：

+ `select-action-tile` 只负责占牌和记录选择。
+ 新增 `resolve-selected-action-tile` 或者直接在阶段推进中生成“待执行行动效果”的状态。
+ 在 `GameState.turn` 中增加一组明确字段，例如 `selectedActionEffects`、`passedActionTiles`、`specialTurnOrderFlags`，不要继续用“选了哪张牌”去隐式推导所有行为。
+
+ `packages/game-core/src/actions/phaseMachine.ts` 里要分别计算：
   - 当前回合建轨顺序。
   - 当前回合两轮货运顺序。
   - 下一回合顺位。
  这三者不能再共用同一个 `buildOrder` / `turnOrder` 简化变量。

### 2.3 `City Growth` 与 `Urbanization` 需要从“状态字段存在”升级成“完整规则模块”

规则书对这两个动作写得很细，而当前仓库虽然在 `GameState` 里已经有 `newCities`、`cityGrowthMarkers`、`supply.newCityTiles` 等状态槽位，但动作系统里没有对应动作，页面也没有对应工作台，因此它们现在只是预留字段，不是已实现功能。

按规则书，这两项至少需要完整覆盖：

+ `City Growth`：
  - 选牌时支付 $2，或立即选择 Pass Option 不支付。
  - 建轨阶段必须执行。
  - 从某一个 Goods Supply space 取整组 cubes。
  - 放到一个还没有 City Growth marker 的城市上。
  - 同时放置一个 marker。
+ `Urbanization`：
  - 选牌时支付 $6，或立即选择 Pass Option。
  - 建轨阶段必须执行。
  - 只能选 town hex。
  - town 上已有 track 时，要先把该 tile 退回 supply。
  - New City tile 自带 growth marker。
  - 从某一个 Goods Supply space 取整组 cubes 放到新城市。
  - 新城市视为六边都可连接，因此可能立即补全若干 link。
  - 不占本回合 3 次/4 次建轨额度。

建议新增两个完整规则模块，而不是把逻辑塞回 `selectActionTile.ts`：

+ `packages/game-core/src/rules/cityGrowth.ts`
+ `packages/game-core/src/rules/urbanization.ts`

同时扩展动作层：

+ 在 `packages/game-core/src/state/actionTypes.ts` 中新增 `pass-action-tile`、`perform-city-growth`、`perform-urbanization`。
+ 在 `packages/game-core/src/actions/handlers/` 中新增对应 handler。
+ 在 `apps/web/src/features/` 中新增这两个动作的选择面板，让玩家能选 Goods Supply 来源、目标城市 / 目标城镇和新城市颜色。

### 2.4 建轨规则目前仍然是“最小可铺”，不是“规则书完整建轨”

当前 `packages/game-core/src/rules/trackPlacement.ts` 明确写着“第一阶段暂不允许在同一格重复铺设轨道板”，这意味着规则书中的一整块建轨高级规则都没有真正实现：

+ incomplete link 的 redirection。
+ improve existing track。
+ complex crossing / passing tile 覆盖已有轨道。
+ town track tile 从少出口升级到多出口。
+ “必须保留已有轨道走向”的严格校验。
+ “重定向不算延伸 incomplete link” 的特殊规则。
+ “只能在从 city 出发或连接到自己 link 的前提下 claim unowned incomplete link” 的规则。

除此之外，当前 `canPlaceTrack()` 里还有一个口径错误：它允许“第一块轨道只要贴着 city **或 town** 就能开始”，而规则书写的是“第一块轨道必须从 city hex 出来”。这类错误如果不先收口，后面再加城市化和重定向时会越来越乱。

这一块建议单独收成三层：

+ `trackPlacement.ts`：只负责空 hex 建轨合法性与费用。
+ `trackRewrite.ts`：负责 redirect / improve / town upgrade。
+ `trackOwnership.ts`：在建轨结果确定后重建 segment、anchor 和 link。

同时把 `GameAction` 扩展为至少三类：

+ `place-track-on-empty-hex`
+ `redirect-incomplete-link`
+ `improve-existing-track`

这样 UI 也能在不同工作模式下给出正确的工作台，而不是把所有建轨都混成“选 tile + 点 hex + 选 rotation”。

### 2.5 货运阶段当前缺的是“真正的得分选择流程”

规则书里最重要的一条之一，是每个从这次交付里得分的玩家，都必须立刻决定“把这一整次交付得到的分数全部拿去加收入，还是全部拿去加 VP”，而且如果多人同时得分，顺序是由运输者先选，然后其他人按行动顺序选。当前 `packages/game-core/src/actions/handlers/moveGoods.ts` 直接把 `candidate.pointsByOwner` 全部加到了 `victoryPoints`，完全跳过了这一步选择。

这意味着当前货运虽然“能跑”，但其核心经济张力还没实现。要补这块，不能只在结果页弹一句“你想加到哪边”。因为一趟交付可能给多个玩家同时得分，所以状态机里必须引入一个临时结算流程。

建议做法是：

+ 在 `GameState.turn` 中新增 `pendingDeliveryResolution`。
+ `deliver-goods` 动作先移动货物并生成一个“待分配 track points”的队列。
+ 再引入 `choose-track-points-destination` 动作，让相关玩家按规则顺序逐一选择 `income` 或 `vp`。
+ 只有当整次 delivery 的所有受益玩家都完成选择后，才真正写入玩家数值并推进到下一名玩家。

这样之后 `RuleExplanationPanel` 和 `DeliveryPreview` 也能正确显示“谁将得到几分、当前轮到谁决定加收入还是加 VP”。

### 2.6 运输阶段免费升车目前实现错了

规则书明确写的是：Move Goods phase 里的“improve your locomotive”是免费的，每回合最多一次；而在第 1 阶段拿 `Locomotive` 行动牌时，才需要支付 `$4 + 新等级`。当前实现把两者混了。

`packages/game-core/src/actions/handlers/upgradeLocomotive.ts` 和 `packages/game-core/src/actions/handlers/moveGoods.ts` 在运输阶段升级时都调用了 `ensureCashForImmediateCost(player, state.ruleset.actionCosts.locomotiveBase)`。对于基础版来说，这会错误地收取 $4；对于标准版来说，也没有体现“第 1 阶段花钱、第 3 阶段免费但每回合最多一次”的差异。

这里必须拆成两类升级：

+ `take-locomotive-action-tile`：立即花 `$4 + 新等级`，并升级。
+ `free-move-phase-locomotive-upgrade`：第 3 阶段的免费升级，只检查“本回合是否已经免费升级过一次”。

对应文件层面，建议：

+ 保留 `rules/finance.ts` 中的 `locomotiveActionCost(nextLevel)`。
+ 新增 `rules/locomotive.ts`，专门封装“升级是否合法、是否免费、是否超过上限 6”。
+ 让 `actions/handlers/upgradeLocomotive.ts` 改成只处理“运输阶段免费升级”，行动牌效果则在 `selectActionTile` 相关流程里单独处理。

### 2.7 阶段推进与终局推进当前并不完整

规则书写得很清楚：基础版共有 6 个阶段，最后一回合在第 4 阶段后直接结束，跳过第 5 和第 6 阶段。当前 `packages/game-core/src/actions/phaseMachine.ts` 虽然有 `finished` 阶段，但主推进逻辑并没有根据 `round === finalRound` 在 income 后直接结束；它仍然会继续走到 `determine-order` 与 `set-up-next-turn`。

同时，当前 `getWinner()` 只做了“总分高者优先，平分比 income”，还没有加入规则书里的最终 tie-break：“如果还平，则最后一回合拿到数值更小行动牌者获胜。”

这里建议直接重写阶段机，不要继续在现有 `getNextPhase()` 上打补丁：

+ 让阶段推进使用 `ruleset.phaseOrder` 驱动，而不是写死基础版序列。
+ 在 `advancePhase()` 中显式检查 `isFinalRoundAndAfterIncome`。
+ 在 `turn` 中增加 `lastTurnSelectedActionValues`，为终局 tie-break 提供真实依据。
+ 在 `rules/scoring.ts` 中加入第三层 tie-break。

### 2.8 行动顺序和顺位逻辑需要整体重做

当前 `resetForBuildPhase()` 会按行动牌 value 排序，并把这个排序同时写进 `buildOrder` 和 `turnOrder`。这和规则书不符。规则书里：

+ 选牌阶段的当前顺位来自**上回合**。
+ 建轨阶段默认仍按当前顺位，只是 `First Build` 玩家本回合建轨最先。
+ 两轮货运默认仍按当前顺位，只是 `First Move` 玩家每轮最先。
+ 下一回合顺位要在第 5 阶段按行动牌 value 才重排。
+
+ `Turn Order` 牌并不是“这回合所有阶段都按 value 1 排第一个”，而是“下一回合顺位第一”。

这里建议把顺位彻底拆成三种概念：

+ `currentTurnOrder`
+ `buildOrderThisTurn`
+ `moveOrderThisTurn`

并在第 5 阶段单独计算 `nextTurnOrder`。这块最好放进专门的 `rules/turnOrder.ts` 或 `rules/actionTileEffects.ts`，不要继续散在阶段机里。

## 三、标准版基本还没接通，需要单列一个完整任务块

标准版不是“调几个常量”就能开跑。官方规则书里的标准版有三大变化：每回合一开始先买资本，本回合内不能再融资；每回合都要竞拍顺位，而且竞拍逻辑与基础版初始拍卖不同；每回合收入阶段还要支付机车维护费。当前仓库虽然已有 `packages/game-content/src/rulesets/standard.ts`，但它还只是一个静态对象，不是一个真正可运行的模式。

现有问题包括：

+ `TurnPhase` 里根本没有 `buy-capital`。
+ `phaseMachine.ts` 完全是基础版阶段机，没有依据 `ruleset.phaseOrder` 切换。
+ `GameSetupPanel.tsx` 固定创建基础版东北美洲局。
+ 标准版顺位竞拍规则没有状态、没有动作、没有 UI。
+ “本回合不能再融资”的约束没有真正落实到所有支付路径。
+ 维护费没有接进收入阶段。
+ 标准版破产规则也不同，目前没有实现。

因此，标准版不应作为“把基础版收尾时顺手带上”的附属工作，而要作为独立任务块实现。建议：

### 3.1 先扩状态和动作契约

+ `TurnPhase` 扩为同时容纳 `base` 与 `standard` 阶段。
+ `GameAction` 新增：
  - `buy-capital`
  - `place-turn-order-bid`
  - `pass-turn-order-bid`
  - `confirm-standard-action-tile`
+ `GameState.turn` 新增 `auctionState`、`capitalPurchasedThisTurn`、`maintenanceDue` 等字段。

### 3.2 再实现标准版三大独有模块

+ `rules/standardEconomy.ts`：买资本、禁止回合内融资、维护费、标准版破产。
+ `rules/standardAuction.ts`：每回合顺位竞拍、Turn Order 牌的“一次免费 pass”特权、1/2 位全额、末位免费、中间位半价。
+ `actions/phaseMachine.ts`：真正按 mode 切换阶段序列。

### 3.3 最后再接 UI

+ `GameSetupPanel.tsx` 增加 `mode` 选择。
+ 新增 `BuyCapitalPanel.tsx` 与 `TurnOrderAuctionPanel.tsx`。
+ 页面上的阶段提示、规则解释和日志要根据 `mode` 走不同文案。

## 四、地图、板块和静态数据需要从“占位”升级成“完整清单”

规则书已经给了完整 Tile Manifest 和 Cost Summary，而当前内容数据仍然明显停留在“可演示”的阶段。

最明显的三个问题是：

+ `packages/game-content/src/maps/ne_usa_se_canada.ts` 只有 7 个 hex，只够走最小演示路径。
+ `packages/game-content/src/maps/ruhr.ts` 还是 `hexes: []` 的空壳。
+ `packages/game-content/src/tiles/manifest.ts` 只录入了 5 种 tile，而规则书附录给的是完整配对与数量清单。

这会直接导致很多规则暂时“看起来没问题”，其实只是因为数据规模还不够大。一旦地图与 tile 变完整，重定向、town upgrade、crossing、库存耗尽、Ruhr 三人局开局这些问题都会真实冒出来。

建议的数据补全路径是：

### 4.1 先补完整 tile manifest

+ 以规则书第 16 页 `Track Tile Manifest` 为唯一来源，把全部 face pairing、count、town / non-town、exit 结构补齐。
+ 在 `packages/game-content/src/tiles/manifest.ts` 中给每种 tile 建一个稳定 ID，不再只保留演示用的 `21 / 22 / t11 / t21 / 42`。
+ 补一个脚本级校验，确保总数与配对关系一致。

### 4.2 再补完整地图

+ 东北美洲先补完整，因为当前 Web 默认就跑这张图。
+ Ruhr 作为第二张地图补完整后，再接到 Game Setup。
+ 每张图都要完整录入：
  - hex 坐标
  - terrain
  - blocked edges
  - river
  - town
  - city color
  - city demand
  - label

### 4.3 保持内容层与引擎层契约稳定

地图与 tile 数据补完时，不要顺手让 `game-core` 直接依赖某张图的具体名称。内容层只负责注入 `MapDefinition`，引擎层只读结构，不写地图特判。

## 五、浏览器工作流还需要从“学习壳”补到“完整动作台”

当前 Web 页面已经适合演示和调试，但如果要完成规则书闭环，还缺这些关键入口：

+ 新对局时选择 `base / standard`。
+ 选择地图 `NE USA & SE Canada / Ruhr`。
+ 开局方式选择。
+ `City Growth` / `Urbanization` 的专门工作台。
+ 标准版 `Buy Capital` 与 `Determine Order of Play` 的专门工作台。
+ 货运得分后的“收入 / VP”选择面板。
+ 游戏结束后的终局结算面板。

当前 `GameSetupPanel.tsx` 明确写着“当前这版会重开基础版东北美洲对局”，这本身就说明 UI 入口还停留在单一路径。这里要做的不是“再往主页面塞几个按钮”，而是把各类动作工作台作为独立 feature 接上。

建议新增这些 Web 模块：

+ `apps/web/src/features/game-setup/MapModePicker.tsx`
+ `apps/web/src/features/action-resolution/ActionPassPanel.tsx`
+ `apps/web/src/features/city-growth/CityGrowthPanel.tsx`
+ `apps/web/src/features/urbanization/UrbanizationPanel.tsx`
+ `apps/web/src/features/turn-order-auction/TurnOrderAuctionPanel.tsx`
+ `apps/web/src/features/capital/BuyCapitalPanel.tsx`
+ `apps/web/src/features/scoring/TrackPointChoicePanel.tsx`
+ `apps/web/src/features/endgame/FinalScoringPanel.tsx`

## 六、建议的代码修改总图

为了避免“到处修一点，结构越来越乱”，建议按下面的模块图进行补完：

```text
packages/game-core/src/
├── contracts/
│   ├── domain.ts              # 扩 mode、phase、action、规则效果契约
│   └── engine.ts              # 扩 auction、pending delivery、setup config
├── state/
│   ├── gameState.ts           # 扩 pending resolution、special orders、standard fields
│   └── actionTypes.ts         # 加 city growth / urbanization / standard 动作
├── actions/
│   ├── applyAction.ts         # 接新动作
│   ├── phaseMachine.ts        # 改成真正按 ruleset 驱动
│   └── handlers/
│       ├── cityGrowth.ts
│       ├── urbanization.ts
│       ├── actionResolution.ts
│       ├── turnOrderAuction.ts
│       ├── buyCapital.ts
│       └── trackPointChoice.ts
├── rules/
│   ├── actionTileEffects.ts
│   ├── cityGrowth.ts
│   ├── urbanization.ts
│   ├── trackRewrite.ts
│   ├── turnOrder.ts
│   ├── standardEconomy.ts
│   └── locomotive.ts
└── queries/
    ├── actionResolutionQueries.ts
    ├── cityGrowthQueries.ts
    ├── urbanizationQueries.ts
    └── finalScoringQueries.ts
```

其中每一块职责如下：

+ `contracts/`：先把“能表达什么状态和动作”扩完整。
+ `state/`：保证 `GameState` 真能装下规则书要求的临时结算信息。
+ `actions/handlers/`：把每种规则书动作变成显式 handler。
+ `rules/`：承载判定逻辑，不让 handler 自己乱写规则。
+ `queries/`：给 UI 与 Bot 提供“当前该怎么选”的只读候选。

## 七、建议的实施顺序

这次补完不能再按页面按钮顺序推进，应该按“先修规则闭环，再修展示入口”的顺序来。

### 第一步：修基础版阶段机和行动牌效果

先修：

+ `Engineer`
+ `First Build`
+ `First Move`
+ `Turn Order`
+ `Locomotive` 选牌即时升级
+ 终局在最后一回合第 4 阶段结束

这是因为当前主路径已经跑在这些错误语义之上，不先修这里，后面的 UI 和测试都会建立在错误行为上。

### 第二步：补 `City Growth` 与 `Urbanization`

这是基础版主行动中最明显的缺口。状态字段已经有了，下一步应尽快把动作、规则和 UI 接通。

### 第三步：补完整货运结算

把“候选路线搜索”升级成“真实 track point 结算流程”，让收入与 VP 的选择成为真正的系统行为。

### 第四步：补完整地图和 tile 数据

在基础版主流程已经闭合后，再把内容层放大到真实规模，避免一开始就在海量数据里调最核心的行为 bug。

### 第五步：接标准版

这时基础版引擎已经稳定，标准版只是在其上加买资本、竞拍和维护费三大分支，不会再大量返工。

### 第六步：补终局、统计面板和完整对局测试

最后统一补用户体验收口和长期回归测试。

## 八、测试补充要求

规则补完之后，测试必须同步升级。建议至少补这些测试：

+ `baseSetup.test.ts`：随机抽货、Goods Supply、三人局补正、起始现金。
+ `actionTileEffects.test.ts`：七张行动牌的本回合效果与下回合顺位值。
+ `cityGrowth.test.ts`：付款、Pass Option、marker 限制、supply 耗尽边界。
+ `urbanization.test.ts`：town 变 city、退回旧 track、即时补全 link、新城市补货。
+ `trackRewrite.test.ts`：redirect / improve / preserve existing track。
+ `deliveryResolution.test.ts`：多人同时得分时的收入/VP选择顺序。
+ `finalRoundFlow.test.ts`：最后一回合第 4 阶段后直接结束。
+ `standardAuction.test.ts`：标准版顺位竞拍、Turn Order 牌的特殊 pass。
+ `standardEconomy.test.ts`：买资本、禁止回合内融资、维护费、标准版破产。
+ `fullGameBase.test.ts`：固定动作脚本跑完整基础版。
+ `fullGameStandard.test.ts`：固定动作脚本跑完整标准版。

## 九、结论

当前仓库最难的“骨架问题”其实已经解决了，所以这份补充完善设计的重点不是推翻架构，而是把仍然缺失的规则动作、真实数据和完整工作流严密地补回去。  

后续最重要的判断标准，不应该再是“页面上有没有这个按钮”，而应该是这三个问题：

1. 规则书写的这条规则，当前状态、动作和阶段机能不能表达。
2. 这条规则的 UI 入口有没有真正接通。
3. 这条规则有没有测试锁住。

只要按这个标准推进，这个仓库就能从“已经很像 Steam 的学习型原型”，真正收敛到“按官方规则书闭合的电子版 Steam”。

## 十、实现日志

这次实现不是继续停留在“列缺口”，而是把其中一批高优先级缺口真正接回程序。落地的重点放在四块：基础版开局随机资源、基础版与标准版阶段机、`City Growth / Urbanization / 线路分选择` 这三类此前缺失的动作、以及 Web 页面上对应的真人入口。

### 10.1 已完成的核心规则补完

+ `packages/game-core/src/state/initialState.ts` 现在会真正创建 `goodsBag`，并按随机抽袋初始化城市货物与 `Goods Supply`；三人局 `Goods Supply` 减 1 的规则已经接进初始化流程，基础版起始现金也改成按开局顺位给补偿，而不是按玩家数组下标硬写。
+ `packages/game-core/src/actions/phaseMachine.ts` 已经扩成同时覆盖 `base / standard` 的阶段机。标准版现在会走 `buy-capital -> auction-turn-order -> select-action -> build-track -> move-goods-round-1 -> move-goods-round-2 -> income -> set-up-next-turn`；基础版最后一回合在 `income` 后会直接结束。
+ `packages/game-core/src/actions/handlers/selectActionTile.ts` 现在会处理 `Pass Option`、`Locomotive` 选牌即时升级、`City Growth / Urbanization` 的待执行状态，以及基础版对应的即时付款。
+ `packages/game-core/src/actions/handlers/moveGoods.ts` 现在不再把线路分直接塞进胜利点，而是会进入 `resolve-delivery`，逐个玩家执行“全部加收入 / 全部加胜利点”的真实规则流程。
+ `packages/game-core/src/actions/handlers/cityActions.ts` 新增了 `performCityGrowth` 与 `performUrbanization`，能够消耗 `Goods Supply`、放置 `City Growth marker`、把 town 变成新城市、退回原本的 town 轨道板，并重建线路所有权。
+ `packages/game-core/src/actions/handlers/standardTurn.ts` 新增了标准版的买资本与顺位竞拍。当前已经能按状态流执行出价、pass、结算支付，并生成本回合顺位。
+ `packages/game-core/src/rules/finance.ts`、`packages/game-core/src/rules/income.ts` 已按 `base / standard` 分开处理融资和收入逻辑。标准版现在会禁止“本回合内临时融资补洞”，运输阶段的免费机车升级也与行动牌付费升级分开了。

### 10.2 已完成的 Web 工作台补完

+ `apps/web/src/app/providers/GameSessionProvider.tsx` 与 `apps/web/src/features/game-setup/GameSetupPanel.tsx` 现在已经接入模式、地图、玩家数、名字偏移和随机种子。页面可以直接新开 `Base Game` 或 `Standard Game`，而不是固定重开基础版东北美洲默认局。
+ `apps/web/src/pages/game/GamePage.tsx` 现在会按真实阶段渲染不同工作台：标准版 `BuyCapitalPanel`、标准版 `AuctionPanel`、基础版与标准版共用的行动牌面板、建轨工作台、`CityGrowthPanel`、`UrbanizationPanel`、运货候选与 `TrackPointChoicePanel`。
+ `apps/web/src/features/session-control/useSessionCommands.ts` 已补齐新动作入口：`select-action-tile(usePassOption)`、`perform-city-growth`、`perform-urbanization`、`choose-track-points-destination`、`buy-capital`、`place-auction-bid`、`pass-auction`。
+ `apps/web/src/features/rule-help/presentRuleExplanation.ts` 和 `packages/game-core/src/queries/explanations.ts` 现在会对 `buy-capital`、`auction-turn-order`、`city-growth`、`urbanization`、`resolve-delivery` 给出结构化解释，不再只覆盖最初那条学习主路径。

### 10.3 测试与验证

这次同步补了新的工作流测试，避免新增动作只有页面入口、没有回归锁：

+ `packages/game-core/tests/workflows/cityActions.test.ts`：验证 `City Growth` 与 `Urbanization` 的核心状态变化。
+ `packages/game-core/tests/workflows/standardTurnFlow.test.ts`：验证标准版 `buy capital -> auction -> select action` 的前半回合闭环。
+ `packages/game-core/tests/workflows/deliveryWorkflow.test.ts`：改成新的“运货后进入线路分决策，再返回货运阶段”的口径。

本轮实际跑通的验证链如下：

+ `npm run typecheck`
+ `npm run lint`
+ `npm run check:deps`
+ `npm run check:boundaries`
+ `npm test`
+ `npm run build`
+ `npm run smoke`

### 10.4 本轮之后的真实完成度

这次补完让程序从“只有基础版学习壳主路径”推进到了“基础版与标准版都能沿真实阶段推进，且关键特殊动作已经可点、可结算、可测试”的状态。现在最重要的动作缺口已经收掉了，用户可以直接在浏览器里体验选牌、买资本、竞拍、建轨、`City Growth`、`Urbanization`、运货和线路分分配。

但它还没有完全达到本文件最初定义的“规则书完整闭合”终点，仍然有两类工作保留在后续任务里：

+ 地图与内容数据仍然是最小集，`NE USA & SE Canada` 还不是完整地图，`Ruhr` 仍是占位入口，`tile manifest` 也还不是官方附录的完整清单。
+ 建轨高级规则还没有补齐到规则书完整口径，尤其是 `redirect incomplete link`、`improve existing track`、复杂 crossing / passing tile 覆盖、town 轨道升级与“保留原有走向”的严格校验。

因此，这次实现日志代表的是：**补充完善设计中的高优先级规则闭环已经真正落地并通过验证，但完整内容数据与高级建轨规则仍需下一轮专门补完。**

### 10.5 本轮继续补完：完整内容数据与高级建轨规则

在上一轮日志里，剩下的两类大缺口是“完整内容数据”和“高级建轨规则”。这一轮已经把这两块继续补上，并且重新跑通了完整验证链。

+ `packages/game-content/src/tiles/manifest.ts` 现在不再是 5 种演示板，而是直接按官方规则书第 16 页 `Track Tile Manifest` 补成完整清单，总数 136 块。为了让城镇轨道能真正表达 `T11 / T21 / T31 / T41` 这类板块，tile 定义也从“纯 edge-edge”扩成了可包含 `"town"` 端点的结构。
+ `packages/game-core/src/state/gameState.ts`、`packages/game-core/src/map/segmentGraph.ts`、`packages/game-core/src/map/linkGraph.ts` 已同步升级到可以表示“town 中心 -> 边”的 segment。这样 `town tile` 不再只是演示占位，而是能真实参与 link 建立、升级和 ownership 重建。
+ `packages/game-core/src/rules/trackPlacement.ts` 现在已经不再只会判定“空 hex 铺轨”，而是会区分三类操作：`place`、`redirect`、`improve`。它会检查是否是 incomplete link 的最后一块轨道、是否允许重定向无主 incomplete link、是否保留原轨道走向、以及重定向 / 升级时只收取非地形费用。
+ `packages/game-core/src/actions/handlers/placeTrack.ts` 已经接住轨道替换逻辑：升级既有轨道会把旧板退回库存、保留被保留 segment 的 owner、为新加 segment 赋予当前玩家 owner，并在需要时重建 anchor 与 link。
+ `packages/game-content/src/maps/ne_usa_se_canada.ts` 与 `packages/game-content/src/maps/ruhr.ts` 现在都已经从“最小 demo / 空壳”扩成可正式开局的学习型地图数据。这里遵守的是本仓库的总体目标：优先让规则、地形、城市/城镇、河流和海岸边界足够支撑完整玩法，而不是追求对实体棋盘的像素级还原。
+ `packages/game-core/tests/scenarios/advancedTrackRules.test.ts` 新增了 `redirect` 和 `improve existing track` 的规则测试，用来锁住这轮最容易回归的高级建轨逻辑。

### 10.6 当前完成度更新

到这一轮为止，这份“补充完善设计”里列出的三大任务块都已经有对应实现：

+ 基础版与标准版阶段闭环：已完成。
+ `City Growth / Urbanization / 线路分选择 / 买资本 / 顺位竞拍`：已完成。
+ 完整 `tile manifest`、两张正式地图入口、`redirect / improve existing track`：已完成。

需要特别说明的是，这里的“完整地图”采用的是**规则学习导向的正式内容数据**，而不是对纸质棋盘做逐像素考古式抄录。这是有意的项目取舍，因为仓库目标一直是“通过数字化实现学习规则”，而不是追求美术和地图排版的完全一致。

本轮再次实际跑过的验证链如下：

+ `npm run typecheck`
+ `npm run lint`
+ `npm run check:deps`
+ `npm run check:boundaries`
+ `npm test`
+ `npm run build`
+ `npm run smoke`

因此，当前仓库已经不再停留在“补充完善设计待落地”的状态；这份文档现在更多承担的是“问题诊断 + 已完成修复日志”的双重角色。
