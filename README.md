# steam-boardgame-replication

这个仓库用于数字化复现桌游《Steam》，目标是通过实现、测试和实际操作来学习规则，而不是优先追求与实体版完全一致的视觉还原。

当前版本是一套跑在本地浏览器 URL 上的 TypeScript workspace。根目录的 `npm` 脚本负责调度整个工作区；`apps/web` 提供本地页面，`packages/game-core` 提供纯规则引擎，`packages/game-content` 提供地图、规则集和静态组件数据，`tools` 放命令行脚本、边界检查、git hook 和环境说明。

当前这版已经支持基础版东北美洲地图的学习壳。默认由 `Alice` 作为真人玩家，`Bob` 和 `Carol` 由 Bot 托管；你可以在浏览器里手动选行动牌、建轨、选货物源和运输候选方案，同时查看规则解释、动作历史、回放和本地存档。

## 项目架构

- `apps/web`：本地浏览器单页应用，`npm run dev` 后会在 `http://localhost:5173` 一类地址启动。
- `packages/game-core`：不依赖浏览器环境的规则核心，负责状态、动作 handlers、查询、路径搜索、回放和带迁移链路的序列化。
- `packages/game-content`：地图、行动牌、货物袋、tile manifest、规则集这类静态规则内容。
- `tools`：工作区辅助脚本，包括 smoke、边界检查、依赖方向检查补充、地图导出、tile pool 检查、git hook 和 conda 环境文件。
- `docs`：规则详解、总体设计、阶段实现日志和仓库重构文档。

真正的程序入口现在是：

- `apps/web/src/app/main.tsx`
- `apps/web/src/app/providers/GameSessionProvider.tsx`
- `apps/web/src/pages/game/GamePage.tsx`
- `packages/game-core/src/index.ts`
- `packages/game-content/src/index.ts`

## 环境

默认环境是 `steam`，环境文件在 `tools/python/environment.yml`。第一次进入仓库时执行：

```bash
conda env create -f tools/python/environment.yml
conda activate steam
npm install
```

之后默认都在这个环境里运行：

```bash
conda activate steam
```

## 如何使用

`npm` 是这个工作区的统一命令入口；你在仓库根目录执行一次命令，根脚本会把它转发给相应的 app、package 或 tools 脚本。

开发模式：

```bash
npm run dev
```

这会启动 `apps/web` 的本地开发服务器，终端通常会打印 `http://localhost:5173` 一类地址；打开后就能进入当前版本的学习壳。

运行测试：

```bash
npm test
```

这会依次运行 `packages/game-core` 的规则、工作流、不变量和迁移测试，以及 `apps/web` 的页面与本地存档测试。

类型检查：

```bash
npm run typecheck
```

这会用工作区项目引用执行独立的 TypeScript 检查，先于构建暴露跨包类型问题。

Lint 检查：

```bash
npm run lint
```

这会运行 `eslint` 的目录边界规则，检查 `apps/web` 是否越过包入口，以及 `game-core` / `game-content` 是否出现不允许的导入。

依赖方向检查：

```bash
npm run check:deps
```

这会运行 `dependency-cruiser`，验证 `web -> core/content`、`core -> web`、`content -> web`、`core -> react` 这些依赖方向约束。

检查边界：

```bash
npm run check:boundaries
```

这会用本地脚本补充检查 `apps/web` 是否越过 package 入口深层 import，以及 `packages/game-core` 是否误用了浏览器 API。

检查构建：

```bash
npm run build
```

这会依次对 `game-content`、`game-core`、`web` 做 TypeScript 构建检查，并最终打出浏览器版本。

命令行 smoke 检查：

```bash
npm run smoke
```

这会运行一个最小命令行对局流程，快速确认“创建一局并读取基础状态”这条主路径仍然可用。

## 当前版本怎么测

先运行 `npm run dev`，再打开终端里给出的本地 URL。

建议按这个顺序测试当前版本：

1. 在“新对局”面板里重开一局默认三人局。
2. 在行动牌面板中为 `Alice` 选一张行动牌；若当前行动者是 Bot，就先点“推进到我的回合”。
3. 进入建轨阶段后，先选轨道板，再点地图高亮 hex，最后在建轨工作台里选朝向并确认；如果想回到本阶段起点，可以重置草稿。
4. 进入货运阶段后，先选货物源，再选候选方案，并观察运输预览、动作历史和规则解释是否一致。
5. 任意时刻都可以保存对局，再从存档列表载入；也可以从回放时间线恢复到较早帧。

优先观察五块信息：页面顶部的当前阶段、地图中的高亮 hex 与路径、中间列的当前工作台、右侧的公共信息与规则解释，以及“动作历史 / 日志”。

## 仓库主干

```text
steam-boardgame-replication/
├── apps/
│   └── web/                  # 本地浏览器应用
├── packages/
│   ├── game-core/            # 规则引擎、状态、回放、迁移化序列化
│   └── game-content/         # 地图、规则集、静态规则数据
├── tools/                    # smoke、边界检查、数据脚本、hook、环境文件
├── docs/                     # 规则资料、设计方案、实现日志
├── package.json              # 工作区脚本入口
├── tsconfig.json             # 工作区 TypeScript 项目引用入口
└── .github/workflows/        # CI 和 smoke workflow
```

规则主来源是 `docs/references/rulebook_official.pdf`。当前最值得先读的文档是：

- `docs/notes/0404_Codex_Steam基础版规则详解.md`
- `docs/notes/0404_Codex_Steam数字化实现方案.md`
- `docs/notes/0404_Codex_Steam第一部分实现方案及日志.md`
- `docs/notes/0405_Codex_Steam第二部分实现方案及日志.md`
- `docs/notes/0405_Codex_Steam第三部分实现方案及日志.md`
- `docs/notes/0405_Codex_仓库工业化重构方案.md`
