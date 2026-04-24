# Phase 1: 输入契约与缺失处理 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-24T10:09:49Z
**Phase:** 01-input-contract-missing-assumptions
**Areas discussed:** 输入解析契约, 缺失信息与默认假设, 地点消歧与多城市处理, 输出前置结构

---

## 输入解析契约

| Option | Description | Selected |
|--------|-------------|----------|
| A | 仅自然语言输入 | |
| B | 仅结构化输入 | |
| C | 双通道：自然语言 + 结构化字段（推荐） | ✓ |

**User's choice:** C
**Notes:** 双通道输入用于兼容不同 agent 传参场景。

| Option | Description | Selected |
|--------|-------------|----------|
| A | 文本优先（name/address/city），坐标可选（推荐） | ✓ |
| B | 坐标必填 | |
| C | 仅文本，不接收坐标 | |

**User's choice:** A
**Notes:** 不强制坐标，降低输入门槛。

| Option | Description | Selected |
|--------|-------------|----------|
| A | 最多 5 个（推荐） | |
| B | 最多 3 个 | |
| C | 不设上限 | ✓ |

**User's choice:** C
**Notes:** 不设上限，但后续阶段需定义工程性保护（分批/截断策略）。

| Option | Description | Selected |
|--------|-------------|----------|
| A | 显式字段优先，自然语言补充（推荐） | ✓ |
| B | 自然语言优先 | |
| C | 冲突即报错并停止输出 | |

**User's choice:** A
**Notes:** 冲突不阻断，采用字段优先并保留说明。

---

## 缺失信息与默认假设

| Option | Description | Selected |
|--------|-------------|----------|
| A | 起点/终点缺失必须声明；其余可自动假设（推荐） | ✓ |
| B | 任一字段缺失都必须声明 | |
| C | 只在无法生成链接时才声明 | |

**User's choice:** A

| Option | Description | Selected |
|--------|-------------|----------|
| A | 骑行 | ✓ |
| B | 步行 | |
| C | 按场景推断 | |

**User's choice:** A

| Option | Description | Selected |
|--------|-------------|----------|
| A | 不做硬约束，仅提示“未限制时长”（推荐） | ✓ |
| B | 默认半日游 | |
| C | 默认 2 小时上限 | |

**User's choice:** A

| Option | Description | Selected |
|--------|-------------|----------|
| A | 自动降级为仅输出地址，并在兜底说明注明（推荐） | ✓ |
| B | 停止并报错 | |
| C | 输出占位二维码文本 | |

**User's choice:** A

---

## 地点消歧与多城市处理

| Option | Description | Selected |
|--------|-------------|----------|
| A | 显式城市 > 文本城市 > 默认城市（推荐） | ✓ |
| B | 地点文本优先 | |
| C | 一律要求用户提供城市 | |

**User's choice:** A

| Option | Description | Selected |
|--------|-------------|----------|
| A | 同城优先 + 语义/偏好排序 + 保留候选并声明（推荐） | ✓ |
| B | 直接取最热门 | |
| C | 同名即报错停止 | |

**User's choice:** A

| Option | Description | Selected |
|--------|-------------|----------|
| A | 允许跨城并提示时长不确定（推荐） | ✓ |
| B | 强制单城 | |
| C | 自动拆多条单城路线 | |

**User's choice:** A

| Option | Description | Selected |
|--------|-------------|----------|
| A | 坐标为准并声明冲突（推荐） | ✓ |
| B | 文本为准 | |
| C | 冲突即报错停止 | |

**User's choice:** A

---

## 输出前置结构

| Option | Description | Selected |
|--------|-------------|----------|
| A | 固定解析对象字段顺序（推荐） | ✓ |
| B | 不固定顺序 | |
| C | 仅保证字段存在 | |

**User's choice:** A

| Option | Description | Selected |
|--------|-------------|----------|
| A | 假设逐条编号（推荐） | ✓ |
| B | 合并自然语言段落 | |
| C | 仅高风险假设 | |

**User's choice:** A

| Option | Description | Selected |
|--------|-------------|----------|
| A | 输出 candidates[]（推荐） | ✓ |
| B | 仅最终选中项 | |
| C | 交由后续阶段 | |

**User's choice:** A

| Option | Description | Selected |
|--------|-------------|----------|
| A | 双视图（推荐：结构化块 + 简述块） | ✓ |
| B | 仅结构化 | |
| C | 仅自然语言 | |

**User's choice:** A（补充修正：Q4 应优先自然语言输出）
**Notes:** 最终决策为“自然语言优先 + 结构化补充”。

## the agent's Discretion

- 解析字段命名与结构化键风格。
- 候选评分细则与排序阈值。
- 假设声明模板文案。

## Deferred Ideas

- None.
