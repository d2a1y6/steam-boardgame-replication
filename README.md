# steam-boardgame-replication

这个仓库用于在电脑上复现桌游《Steam》的基础流程，目标是借由实现和游玩来学习规则，而不是优先追求和原作完全一致的视觉还原。当前仓库还处在偏文档和基础设施阶段，先把规则来源、说明文档和提交约束整理清楚，后续再逐步补 `src/` 里的实际实现。

## 仓库结构

```text
steam-boardgame-replication/
├── AGENTS.md
├── README.md
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
│   └── git-hooks/
│       └── pre-commit
└── src/
```

`docs/references/` 用来放外部参考资料和速查资料；`docs/notes/` 用来放基于参考资料整理出的工作文档和学习文档；`scripts/git-hooks/` 放仓库级 Git hook；`src/` 预留给后续游戏逻辑、数据结构和界面实现。当前应以官方规则书 `docs/references/rulebook_official.pdf` 为主文本来源，`docs/references/rulebook_scan.pdf` 作为带 OCR 的扫描参考，其他 `player_aid`、`quick_rules` 和 `rule_summary` 只作为辅助速查，不作为最终 spec。考虑到当前仓库启用了“单次提交总体积不超过 1 MB”的限制，像官方规则书和扫描版规则书这类大文件默认只作为本地参考，不进入 Git 历史。

## 当前已补充内容

仓库已经新增一份偏叙述式的基础版规则文档和一份数字化实现方案文档，适合在编码前先建立对游戏流程、资源关系、实现边界和规则留白的整体理解。与此同时，仓库还增加了一个 `pre-commit` hook，用来限制“本次提交中被暂存文件的总大小”不超过 1 MB（1,000,000 bytes），避免一开始就把大体积资源直接塞进版本历史。

如果你在本地继续开发，建议优先把 `src/` 拆成规则状态、地图/轨道表示、行动解析和回合流程四个层面，而不是先做界面细节。其实我不用这么麻烦地设计工作流程。对这个项目来说，更高效的方式是先把“可验证的规则状态机”做对，再逐步叠加交互和表现；规则整理、目录补齐、提交约束这类基础工作我已经直接替你落下来了。
