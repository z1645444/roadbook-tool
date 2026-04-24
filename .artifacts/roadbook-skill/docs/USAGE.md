# Roadbook Skill Usage

## Runtime Requirements

- Node.js 20+
- `AMAP_API_KEY` environment variable

## Start Skill Server

```bash
pnpm skill:server
```

The server speaks line-delimited JSON-RPC 2.0 over stdio.

## Basic RPC Sequence

1. send `initialize`
2. send `skill.describe`
3. send `skill.invoke`
4. optional `shutdown` / `exit`

## Quick Manual Test

```bash
cat skill/roadbook-skill/examples/initialize.request.json | pnpm skill:server
```

```bash
cat skill/roadbook-skill/examples/invoke.request.json | pnpm skill:server
```

