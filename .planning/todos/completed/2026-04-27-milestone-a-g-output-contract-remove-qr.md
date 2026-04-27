---
created: 2026-04-27T07:20:28.726Z
title: 下个 milestone 调整 A-G 并移除二维码
area: planning
files:
  - .planning/ROADMAP.md:77
  - .planning/REQUIREMENTS.md:35
  - .planning/PROJECT.md:30
  - AGENTS.md:10
---

## Problem

当前存在多处实质冲突：
1) 既有约束要求 A-G 固定结构，而项目文档又出现“不再强制 A-G”表述；
2) Phase 5 与 OUT-02/03/04 仍要求二维码相关输出，但当前决策希望在下一 milestone 取消二维码相关所有信息；
3) 输出协议需要稳定对齐为 human-readable 主输出，避免下游 agent 在不同文档口径之间漂移。

## Solution

在下一 milestone 做一次契约重置与最小影响迁移：
- 将输出协议收敛为：路线摘要、地址、预计花费时间、其他说明（取消二维码相关全部字段）；
- 同步更新 ROADMAP/REQUIREMENTS/PROJECT/AGENTS 的冲突条目，确保单一真相；
- 评估 A-G 是否保留为兼容渲染层（仅兼容，不作为主契约）。
