---
created: 2026-04-22T07:29:45.695Z
title: Split roadbook tool into reusable skill
area: planning
files:
  - AGENTS.md
  - .planning/PROJECT.md
  - src/conversation/intake.controller.ts
  - src/routing/routing-orchestrator.service.ts
---

## Problem

Current implementation has been delivered as an app-style project flow, but the intended product direction is different:
this project should be packaged as a reusable skill that OpenClaw or other agents can invoke directly.

Without this split, integration cost stays high because each agent needs app-level runtime assumptions instead of a focused skill contract.

## Solution

Create a dedicated skill project path derived from the current planning/routing capabilities.

Suggested direction:
- Define a skill-facing interface (input/output schema) for route planning and roadbook generation.
- Separate app runtime concerns from core planning engine so the engine can be imported/invoked by agents.
- Prepare packaging/layout compatible with external agent ecosystems (OpenClaw and similar).
- Keep current app project as reference implementation, while the new skill project becomes the primary delivery target.
