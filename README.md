# steam-boardgame-replication

这个仓库用于数字化复现桌游《Steam》，目标是通过实现、测试和游玩来学习规则，而不是优先追求与实体版完全一致的视觉还原。当前版本已经有第一部分骨架：它是一个跑在本地浏览器 URL 里的单页程序，前端用 React 渲染演示界面，规则状态保存在内存里的引擎会话中，由 `src/engine/`、`src/rules/`、`src/map/` 驱动。

## 项目架构

程序是一个本地开发用的浏览器应用。启动后，Vite 会在本机启动一个开发服务器，终端会打印地址，通常是 `http://localhost:5173`；浏览器入口是 [src/main.tsx](/Users/day/Desktop/书架/大三下/其他/steam-boardgame-replication/src/main.tsx)，页面主壳是 [src/ui/GameShell.tsx](/Users/day/Desktop/书架/大三下/其他/steam-boardgame-replication/src/ui/GameShell.tsx)，规则会话入口是 [src/engine/createGame.ts](/Users/day/Desktop/书架/大三下/其他/steam-boardgame-replication/src/engine/createGame.ts)。

当前这个版本还不是“完整可手玩”的数字桌游，而是一个最小可推进的规则学习壳。现在主要是用它来观察阶段推进、草稿提交/重置、Bot 自动行动、地图状态变化和日志输出。

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

这会运行 `tests/` 里的规则与状态测试，用来确认融资、建轨、运货、计分和 Bot 基础行为没有被改坏。

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

1. 连续点“自动执行一步”，观察玩家依次选行动牌，右侧阶段标签和日志同步变化。
2. 进入建轨阶段后，继续点“自动执行一步”或“自动执行十步”，观察地图上的轨道数量、玩家现金、收入和日志是否变化。
3. 在出现草稿时，点“提交草稿”或“重置阶段”，验证建轨阶段确实跑在草稿层而不是直接写正式状态。
4. 切换回终端再跑一次 `npm test` 和 `npm run smoke`，确认浏览器演示和命令行校验都没断。

优先看三处：页面上方的当前阶段、右侧玩家面板里的经济状态、底部日志。

## 仓库主干

需要优先理解的业务入口有三处：`src/main.tsx`、`src/ui/GameShell.tsx`、`src/engine/createGame.ts`。

```text
steam-boardgame-replication/
├── docs/          # 规则资料、设计文档、实现日志
├── scripts/       # smoke 脚本、数据检查、git hook
├── src/           # 程序源码；浏览器入口、规则引擎、地图、Bot、UI 都在这里
├── tests/         # 第一部分核心测试
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
