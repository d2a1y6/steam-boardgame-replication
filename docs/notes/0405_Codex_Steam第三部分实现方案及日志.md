# Steam 第三部分实现方案及日志

第三部分不再是“继续扩一层原型”，而是要作为当前总设计的**收口阶段**。如果按现在仓库的状态来看，这一阶段完全可以把 [0404_Codex_Steam数字化实现方案.md](/Users/day/Desktop/书架/大三下/其他/steam-boardgame-replication/docs/notes/0404_Codex_Steam数字化实现方案.md) 里仍未落地的主要目标补齐，让项目从“基础版原型”推进到“当前设计范围内的完整交付版”。这里的“完整”并不意味着要覆盖未来所有可能的扩展，例如联机、复杂 AI、多人在线大厅或视觉特效；它指的是把当前文档已经明确承诺的内容真正做完，包括完整基础版、标准版差异、更多地图、存档回放、教学提示闭环和更扎实的验证体系。

因此，第三部分的目标可以明确写成一句话：**完成当前《Steam 数字化实现方案》里仍未实现的所有核心设计，让仓库进入一个可长期维护、可完整演示、可真正用于学规则的版本。**

## 为什么第三部分可以承担“最终收口”

第一部分已经把状态树、阶段机、草稿层、最弱 Bot 和基础规则闭环立住。第二部分已经把真人选牌、建轨工作台、候选运货方案、公共信息面板和页面主路径接起来。现在剩下的工作虽然仍然不少，但它们不再是“没有地基时的大块不确定性”，而是一些边界相对清楚的完工项：把基础版规则补齐、把标准版接进既有结构、把地图和板块数据补全、把教学信息从“提示文本”升级成“规则解释系统”、把局面保存和回放接到现有状态机上。换句话说，第三部分已经不需要重新定义架构了，而是站在现有架构上做完整性和可交付性收尾。

这也是为什么我判断第三阶段可以完成目前有的所有设计。当前总设计里最大的高风险架构问题，例如 segment 锚点、阶段草稿、候选路径、最弱 Bot 和本地浏览器架构，都已经在前两部分得到了验证。第三部分更像是一个系统化完工阶段，而不是又一次方向探索。

## 第三部分的总目标

第三部分结束时，项目应当达到以下整体状态。第一，基础版可以完整地从开局打到终局，不再依赖“这里先简化一下”的主流程缺口。第二，标准版作为可切换规则集真正可用，而不只是保留了 `rulesets/standard.ts` 的空接口。第三，至少东北美洲和 Ruhr 两张地图应当以可玩数据形式完整存在，并能被 UI 正常加载。第四，页面中的规则解释要从“静态说明”升级成与当前动作、当前候选方案和非法原因绑定的解释系统。第五，用户应能保存当前对局、重新载入，并查看关键阶段或整局的回放摘要。第六，测试和脚本体系应当足够稳，让后续继续扩展不会频繁把已有功能打断。

如果第三部分达不到这个状态，就说明它还没有真正完成当前总设计，只是把第二部分继续做大了一点。

## 第三部分的核心任务块

第三部分建议拆成六个任务块。这六块共同覆盖当前总设计里仍未完工的部分，而且顺序上可以直接转化为实际开发路线。

### 任务块一：补齐基础版剩余主规则与边角规则

第二部分虽然已经让真人可操作，但基础版规则仍然没有完全补齐。第三部分首先要把基础版补到“正常完整对局不再依赖人为脑补”的程度。这里包括但不限于：`City Growth` 与 `Urbanization` 的完整执行流程；新城市板放置、供给消耗和即时图重建；升级已有轨道与保留既有走向的严格校验；更完整的货运得分结算与收入选择逻辑；终局收入换分与 tie-break；破产与无主已完成连接的明确程序判定；以及官方规则书里所有已经明确写出的基础版成本与阶段行为。

这一块完成后，基础版应当能够完整打完，而且不再把“部分动作先跳过”“这个效果暂时只存在日志里”当成正常状态。

### 任务块二：把标准版真正接进现有结构

标准版不是“以后再考虑的附加包”，而是当前总设计文档已经提前留了接口的目标范围。第三部分应当把它真正接上。这一块至少应包含：标准版的顺位拍卖流程、行动牌费用差异、维护费、资本或资金相关差异、标准版下的收入与支出结算、以及与基础版共享规则的复用层。实现上不建议复制一份“标准版专用引擎”，而是把 `ruleset` 真正变成行为开关，让 `phaseMachine`、`finance`、`auction`、`income` 和 UI 公共区都能根据当前模式切换口径。

第三部分结束时，用户应当能在创建对局时明确选择 `base` 或 `standard`，并在 UI 和规则行为上看到真正的差别。

### 任务块三：补全地图、板块与静态数据

现在的东北美洲地图仍然是最小数据集，Ruhr 虽然已有文件，但还远不是“完整可玩地图”的状态。第三部分需要把地图数据补到真正可用的程度，包括全部六边格、城市/城镇、地形、河流、粗黑边、初始货物与需求、以及必要的显示标签。轨道板数据也要从“第一部分够用”升级到“完整 manifest”，至少让板块库存、轨道形状、升级兼容性和 town tile 的校验都站在完整数据上。

这一块可以搭配 `scripts/export-map-data.ts` 和 `scripts/check-tile-pool.ts` 继续扩成更实用的数据核对脚本，例如“检查地图是否有孤立 hex”“检查 blocked edges 是否双向一致”“检查 tile exits 是否存在非法重叠”。这会显著降低后续规则 bug 的来源。

### 任务块四：把教学提示升级成规则解释系统

当前页面已经有 `RuleHintPanel`、`DeliveryPreview` 和 `IllegalMoveNotice`，但它们仍然更像“即时说明文案”，还不是系统化的教学模块。第三部分应当把这一层收成一个明确的规则解释系统：每一种阶段、每一种动作、每一种非法原因、每一种候选运输方案，都应当能产出结构化解释。比如建轨预览不只写“费用 4”，而要同时说明费用由哪些地形项构成；运货候选不只列目的地，而要说明为何可达、为何必须停在这里、各玩家为何按这个比例得分；非法动作不只说“不能放”，而要指出是哪条规则阻止了它。

实现上建议新增一个独立的 `src/rules/explanations.ts` 或 `src/engine/explanations.ts`，集中负责把引擎判定结果转成短解释，而不是继续让每个组件自己拼字符串。这样第三部分结束时，整个系统才真正符合“教学型界面”的定位。

### 任务块五：加入存档、载入与回放

当前对局一旦刷新页面就会丢失，日志也只适合看最近一步。第三部分应当把局面持久化与回放纳入正式范围。这个项目最合适的做法，不是复杂后端，而是本地存档：把 `EngineSession` 或一串动作历史序列序列化到 `localStorage` 或本地 JSON 文件中。至少应支持：保存当前对局、列出最近若干存档、重新载入指定存档、导出一局对局摘要、按回合或阶段回看关键日志。

如果进一步收敛到现有架构，最稳的方案是把“动作历史 + 少量快照”作为回放底层，而不是在日志里硬凑。因为规则引擎本来就是动作驱动的，这一层复用价值最高。

### 任务块六：把验证体系补到可长期维护

第三部分完成时，测试不应只覆盖“正常路径能走通”，还要开始覆盖那些真的会在后续维护中被改坏的地方。除了继续保留当前单测与集成测试，建议新增三类测试。第一类是**完整对局脚本测试**，用固定动作序列或半固定 Bot 跑完整局，验证终局一定能到达。第二类是**规则边界测试**，针对官方规则书里最容易出错的点，例如首个同色城市停止、升级保留既有走向、城市化打断线路后的重建、无主 link 借道和收入/VP 融资边界。第三类是**模式差异测试**，专门验证同一局面在 base 和 standard 下行为不同且符合预期。

同时，`smoke-playthrough.ts` 也应当升级成真正能推进若干回合甚至完整局的脚本，而不只是打印地图名和当前阶段。

## 第三部分的建议目录增量

第三部分不需要推翻仓库主干，但建议在现有结构上补出以下几类文件或模块：

```text
src/
├── engine/
│   ├── explanations.ts
│   ├── persistence.ts
│   └── replay.ts
├── rules/
│   ├── urbanization.ts
│   ├── cityGrowth.ts
│   ├── upgradeTrack.ts
│   └── standardEconomy.ts
├── ui/
│   ├── SaveLoadPanel.tsx
│   ├── ReplayPanel.tsx
│   ├── RuleExplanationPanel.tsx
│   ├── GameSetupPanel.tsx
│   └── MapPickerPanel.tsx
└── tests/
    ├── baseFullGame.test.ts
    ├── standardMode.test.ts
    ├── urbanization.test.ts
    ├── cityGrowth.test.ts
    ├── replay.test.ts
    └── persistence.test.ts
```

+ `src/engine/explanations.ts`: 把规则判定结果统一转成短解释和非法原因。
+ `src/engine/persistence.ts`: 负责保存、载入和列出本地存档。
+ `src/engine/replay.ts`: 负责按动作历史回放对局或生成阶段摘要。
+ `src/rules/urbanization.ts`: 处理城市化流程、新城市板与供给消耗。
+ `src/rules/cityGrowth.ts`: 处理城市发展标记、补货和相关限制。
+ `src/rules/upgradeTrack.ts`: 处理升级既有轨道与保留走向的校验。
+ `src/rules/standardEconomy.ts`: 收拢标准版资金和维护费差异。
+ `src/ui/SaveLoadPanel.tsx`: 提供本地存档与载入入口。
+ `src/ui/ReplayPanel.tsx`: 提供阶段/回合级回放查看入口。
+ `src/ui/RuleExplanationPanel.tsx`: 专门展示当前动作、候选方案和非法原因的结构化说明。
+ `src/ui/GameSetupPanel.tsx`: 允许创建 base/standard、选择玩家数与起始名字。
+ `src/ui/MapPickerPanel.tsx`: 在多地图可用后负责选择当前地图。
+ `tests/baseFullGame.test.ts`: 用固定动作或固定 Bot 跑完整基础版对局。
+ `tests/standardMode.test.ts`: 验证标准版与基础版的规则差异。
+ `tests/urbanization.test.ts`: 验证城市化、补全连接与供给处理。
+ `tests/cityGrowth.test.ts`: 验证城市发展补货与边界条件。
+ `tests/replay.test.ts`: 验证动作历史回放与关键状态恢复。
+ `tests/persistence.test.ts`: 验证本地存档、载入与序列化一致性。

## 第三部分的实现顺序

第三部分建议按下面顺序推进，这样可以先补规则真空，再补持久化与体验层。

### 1. 先补基础版规则缺口

先把 `City Growth`、`Urbanization`、升级轨道、完整终局、破产处理和基础版边角规则补齐。因为如果基础版本身还不闭合，后面去做标准版或存档，回头仍然会返工。

### 2. 再接标准版

基础版一旦闭合，就立即把标准版接上。原因是 `ruleset` 行为开关早就存在，拖得越久越容易让基础版代码重新写死。

### 3. 接着补完整地图与静态数据

规则口径稳定后，再把地图和 tile 数据补全。这样地图一旦出问题，更容易判断是数据录入错了还是规则引擎错了。

### 4. 然后做规则解释系统

规则与数据都比较稳以后，再把解释系统统一起来。否则解释层会频繁追着底层改动返工。

### 5. 再做存档与回放

当动作和状态结构已经稳定，再接持久化与回放最合适。此时动作历史已经足够可靠，序列化格式也更容易定下来。

### 6. 最后做完整对局测试与交付收口

最后统一补完整对局测试、标准版差异测试、数据校验脚本和 README / 文档收口，把仓库整理成当前总设计的正式完成版。

## 第三部分完成标准

第三部分完成时，至少要满足下面这些标准：

+ 用户可以创建基础版或标准版对局，并在两种模式下都完整打到终局。
+ 当前设计范围内的地图与静态数据已经补齐到可玩状态。
+ 规则解释面板会跟着当前动作、候选方案和非法原因实时变化，而不只是显示静态提示。
+ 用户可以保存、载入当前对局，并查看关键回放摘要。
+ `npm test`、`npm run build` 和 `npm run smoke` 都继续通过，且 `smoke` 至少能推进一个更完整的示意流程。
+ 文档中的当前总设计不再停留在“未来规划”，而与仓库真实状态基本一致。

## 结论

第三部分完全可以承担“完成当前总设计”的目标，而且现在正是适合这样收口的时候。前两部分已经把最高风险的架构部分验证过了，第三部分要做的，是把剩余的规则、数据、教学解释、标准版差异和持久化整合进现有结构，让仓库真正达到 [0404_Codex_Steam数字化实现方案.md](/Users/day/Desktop/书架/大三下/其他/steam-boardgame-replication/docs/notes/0404_Codex_Steam数字化实现方案.md) 所描述的完成状态。

---

# Steam第三部分实现日志

第三部分目前已经从“计划中的收口阶段”推进到了一个更像“工作台版本”的状态，但它还没有把 [0404_Codex_Steam数字化实现方案.md](/Users/day/Desktop/书架/大三下/其他/steam-boardgame-replication/docs/notes/0404_Codex_Steam数字化实现方案.md) 里承诺的内容全部做完。真实落地的重点，是把第二部分的基础版原型继续整理成一个更适合长期使用和调试的本地应用：现在你可以在浏览器里创建新对局、调整默认玩家数和名字偏移、获得结构化规则解释、把当前局面保存到本地、重新载入本地存档，并沿着回放时间线恢复到先前的某一帧。相比第二部分，这些功能不是规则新花样，而是让整个项目开始具备“真正可长期使用”的工作壳特征。

第三部分这轮新增的核心结构主要集中在 `engine/`、`ui/` 和 `utils/` 三块。`src/engine/explanations.ts` 把原本散在 `GameShell` 里的阶段提示和候选说明收成了统一的结构化解释入口；`src/engine/persistence.ts` 负责本地存档的保存、列出、载入和删除；`src/engine/replay.ts` 则把当前会话记录成回放帧，并允许从指定帧恢复会话快照。与此同时，`src/ui/GameSetupPanel.tsx`、`src/ui/SaveLoadPanel.tsx`、`src/ui/ReplayPanel.tsx` 和 `src/ui/RuleExplanationPanel.tsx` 把这些第三部分新增能力接到了主页面上；`src/utils/playerNames.ts` 则把默认玩家名字映射从零散常量，升级成了独立、可测试、可无限延展的命名规则模块。

下面这张结构图反映的是第三部分完成后**相对第二部分新增或显著增强的关键文件**。

```text
src/
├── engine/
│   ├── explanations.ts
│   ├── persistence.ts
│   └── replay.ts
├── ui/
│   ├── GameSetupPanel.tsx
│   ├── GameShell.tsx
│   ├── ReplayPanel.tsx
│   ├── RuleExplanationPanel.tsx
│   └── SaveLoadPanel.tsx
├── utils/
│   └── playerNames.ts
└── tests/
    ├── persistence.test.ts
    ├── playerNames.test.ts
    └── replay.test.ts
```

当前主页面 [src/ui/GameShell.tsx](/Users/day/Desktop/书架/大三下/其他/steam-boardgame-replication/src/ui/GameShell.tsx) 也已经从“第二部分的操作壳”进一步变成了“第三部分的工作壳”。页面左侧仍然是地图，中间仍然是当前阶段和操作工作台，但右侧信息区现在已经加入本地存档和回放时间线；同时，页面上方不再只是直接进入一局固定的 3 人局，而是先通过 `GameSetupPanel` 提供一个最小的新对局设置入口。虽然这一轮还没有把标准版和第二张地图真正做成可玩切换项，但它已经把这些后续扩展应该挂在哪里的问题解决掉了。

规则解释这条线也已经比第二部分收得更清楚。原先的提示文本主要靠 `notice` 和阶段条件分支在页面里现场拼接；现在解释逻辑已经集中到 [explanations.ts](/Users/day/Desktop/书架/大三下/其他/steam-boardgame-replication/src/engine/explanations.ts) 里，界面只负责消费 `title / body / detail` 三段结构。建轨预览、运输候选和阶段级提示都开始有一个统一出口，这意味着后续如果要把解释系统继续做深，已经不需要再把字符串散着写在各个组件里。

存档和回放这条线目前也已经具备最小闭环。通过 [persistence.ts](/Users/day/Desktop/书架/大三下/其他/steam-boardgame-replication/src/engine/persistence.ts)，页面可以把当前 `EngineSession` 和回放帧序列一起写入 `localStorage`；通过 [replay.ts](/Users/day/Desktop/书架/大三下/其他/steam-boardgame-replication/src/engine/replay.ts)，每次有效状态推进后都可以追加一帧回放记录，并在界面中恢复到最近若干帧中的任意一帧。这还不是“完整对局回放播放器”，但已经足够支撑第三部分里最核心的工作流：复现一个局面、保存下来、再加载回来、或者退回到前面的某一步继续试。

默认玩家名字也已经彻底摆脱硬编码了。现在 [playerNames.ts](/Users/day/Desktop/书架/大三下/其他/steam-boardgame-replication/src/utils/playerNames.ts) 会先按 `Alice -> Zach` 输出 26 个基础名字，再按 `Angry Alice -> Zombie Zach` 输出 26 组前缀配对名，之后再进入 `You Win 702`、`You Win 703` 这种无限延展序列。这个模块已经接进当前主壳，所以默认 3 人局现在使用 `Alice / Bob / Carol`，而不是旧的 `Ada / Babbage / Curie`。

测试层也同步补上了第三部分对应的验证。[replay.test.ts](/Users/day/Desktop/书架/大三下/其他/steam-boardgame-replication/tests/replay.test.ts) 会验证回放帧的生成和恢复；[persistence.test.ts](/Users/day/Desktop/书架/大三下/其他/steam-boardgame-replication/tests/persistence.test.ts) 会验证本地存档的保存、列出、载入和删除；[playerNames.test.ts](/Users/day/Desktop/书架/大三下/其他/steam-boardgame-replication/tests/playerNames.test.ts) 会锁定名字映射的关键边界。到这一步为止，仓库当前已经可以通过 `npm test`、`npm run build` 和 `npm run smoke`。

如果用一句话概括第三部分当前的真实实现状态，那就是：**项目已经开始具备“设置、解释、存档、回放”这些工作壳能力，但它还没有完成第三部分原方案中那些更重的收口目标，例如完整基础版规则闭合、标准版真正接入、Ruhr 地图补全和完整对局级回放。**这意味着第三部分已经起步，而且方向正确，但还没有到“总设计完全收完”的终点。
