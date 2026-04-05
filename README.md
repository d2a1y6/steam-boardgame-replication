# steam-boardgame-replication

这个仓库用于数字化复现桌游《Steam》，目标是通过实现、测试和游玩来学习规则，而不是优先追求与实体版完全一致的视觉还原。当前版本已经进入第二部分：它是一个跑在本地浏览器 URL 里的单页程序，前端用 React 渲染基础版原型，规则状态保存在内存里的引擎会话中，由 `src/engine/`、`src/rules/`、`src/map/` 驱动。

## 项目架构

程序是一个本地开发用的浏览器应用。启动后，Vite 会在本机启动一个开发服务器，终端会打印地址，通常是 `http://localhost:5173`；浏览器入口是 [src/main.tsx](/Users/day/Desktop/书架/大三下/其他/steam-boardgame-replication/src/main.tsx)，页面主壳是 [src/ui/GameShell.tsx](/Users/day/Desktop/书架/大三下/其他/steam-boardgame-replication/src/ui/GameShell.tsx)，规则会话入口是 [src/engine/createGame.ts](/Users/day/Desktop/书架/大三下/其他/steam-boardgame-replication/src/engine/createGame.ts)。

当前这个版本已经支持“1 真人 + 2 Bot”的基础版原型。默认由 `Alice` 作为真人玩家，`Bob` 和 `Carol` 由 Bot 托管；你可以手动选行动牌、建轨、选货物源和运输候选方案，同时用公共信息面板观察顺位、轨道库存、Goods Supply、玩家状态和日志。

## 环境

默认环境是 `steam`，它是 `Anaconda` 环境，并由根目录的 [environment.yml](/Users/day/Desktop/书架/大三下/其他/steam-boardgame-replication/environment.yml) 描述。进入仓库后，默认使用：

```bash
conda activate steam
```

如果是第一次进入这个仓库，先执行：

```bash
conda env create -f environment.yml
conda activate steam
npm install
```

## 常用命令

`npm` 是 Node.js 的包管理器，这个仓库用它来安装前端依赖，并把常用动作封装成 `npm run xxx` 命令。它被用作这个前端工程的启动器和脚本入口。

开发模式：

```bash
npm run dev
```

这会启动本地开发服务器，并把当前版本的演示页面挂到浏览器地址上，适合边改边看。

运行测试：

```bash
npm test
```

这会运行 `tests/` 里的规则、工作流和页面壳测试，用来确认融资、建轨、运货、计分、Bot 和第二部分的人类主路径没有被改坏。

检查构建：

```bash
npm run build
```

这会执行 TypeScript 类型检查并生成生产构建，用来确认当前代码至少能完整打包。

命令行 smoke 检查：

```bash
npm run smoke
```

这会跑一个最小命令行演示流程，快速确认“创建一局并推进若干步”这条主路径还活着。

## 如何测试当前版本

先运行 `npm run dev`，打开终端打印出的本地 URL。

可以按这个顺序测：

1. 先用 `Alice` 手动选择一张行动牌；如果轮到 Bot，就点“推进到我的回合”。
2. 进入建轨阶段后，先选轨道板，再点地图上的高亮 hex，然后在建轨工作台里选朝向并确认；需要时可以重置当前阶段。
3. 进入货运阶段后，先选货物源，再选候选方案，并查看运输预览；如果没有合适方案，可以升级机车或跳过本轮。
4. 切换回终端再跑一次 `npm test`、`npm run build` 和 `npm run smoke`，确认浏览器原型和命令行校验都没断。

优先看四处：页面上方的当前阶段、中间地图上的高亮与选中状态、右侧控制区的工作台、最右列的公共信息和日志。

## 仓库主干

需要优先理解的业务入口有三处：`src/main.tsx`、`src/ui/GameShell.tsx`、`src/engine/createGame.ts`。

```text
steam-boardgame-replication/
├── docs/          # 规则资料、设计文档、实现日志
├── scripts/       # smoke 脚本、数据检查、git hook
├── src/           # 程序源码；浏览器入口、规则引擎、地图、Bot、UI 都在这里
├── tests/         # 规则测试与第二部分主路径测试
├── environment.yml
├── package.json   # npm 脚本入口
├── index.html     # 浏览器挂载页
├── vite.config.ts # 本地开发服务器和构建配置
└── README.md
```

规则主来源是 [docs/references/rulebook_official.pdf](/Users/day/Desktop/书架/大三下/其他/steam-boardgame-replication/docs/references/rulebook_official.pdf)。当前最值得先读的文档是：

- [docs/notes/0404_Codex_Steam基础版规则详解.md](/Users/day/Desktop/书架/大三下/其他/steam-boardgame-replication/docs/notes/0404_Codex_Steam基础版规则详解.md)
- [docs/notes/0404_Codex_Steam数字化实现方案.md](/Users/day/Desktop/书架/大三下/其他/steam-boardgame-replication/docs/notes/0404_Codex_Steam数字化实现方案.md)
- [docs/notes/0404_Codex_Steam第一部分实现方案及日志.md](/Users/day/Desktop/书架/大三下/其他/steam-boardgame-replication/docs/notes/0404_Codex_Steam第一部分实现方案及日志.md)
- [docs/notes/0405_Codex_Steam第二部分实现方案及日志.md](/Users/day/Desktop/书架/大三下/其他/steam-boardgame-replication/docs/notes/0405_Codex_Steam第二部分实现方案及日志.md)
- [docs/notes/0405_Codex_Steam第三部分实现方案.md](/Users/day/Desktop/书架/大三下/其他/steam-boardgame-replication/docs/notes/0405_Codex_Steam第三部分实现方案.md)
