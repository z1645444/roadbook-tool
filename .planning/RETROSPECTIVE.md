# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — milestone

**Shipped:** 2026-04-27
**Phases:** 5 | **Plans:** 10 | **Sessions:** 1

### What Was Built
- 输入契约、假设模板、POI 策略与理由模板体系化落地。
- 路线规则与高德 URI 构造契约（含 L0/L1..Ln）形成可复用标准。
- 输出协议、模板、schema、example、checklist 完成闭环，支持自动化验收。

### What Worked
- docs-first + schema-first 流程降低了跨 phase 漂移。
- 每个计划都绑定可执行验收命令，减少主观判断。

### What Was Inefficient
- `gsd-sdk` 与 workflow 文档存在命令不一致，增加了排障成本。
- 某些验收表达与字段命名发生冲突，出现一次额外修正。

### Patterns Established
- 先契约、后示例、再清单的三件套交付模式。
- 通过 `SUMMARY + VERIFICATION + milestone archive` 构建可追溯闭环。

### Key Lessons
1. 里程碑收尾前应先统一 SDK 与 workflow 命令口径，避免临场分叉。
2. 验收规则要避免与必填字段字面冲突，必要时在计划阶段提前静态检查。

### Cost Observations
- Model mix: 0% opus, 100% sonnet, 0% haiku
- Sessions: 1
- Notable: phase 工件标准化后，里程碑归档可在一次会话内完成。

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | 1 | 5 | 建立 docs/schema/checklist 的标准交付流 |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | checklist-level | 100% v1 requirements mapped | 0 |

### Top Lessons (Verified Across Milestones)

1. 先契约后实现能显著降低跨阶段返工。
2. 统一验收命令可提升回归稳定性。
