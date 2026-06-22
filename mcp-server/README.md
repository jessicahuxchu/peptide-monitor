# Peptide Command MCP Server

MCP (Model Context Protocol) server exposing Peptide Command API tools for **Hermes Agent**.

## Tools

| Tool | Description |
|------|-------------|
| `get_supply_chain` | Read paths, nodes, edges, documents |
| `update_path_node` | Patch a path node |
| `get_inbox` | List inbox submissions |
| `submit_inbox` | Parse & queue team input |
| `confirm_inbox_submission` | Commit proposed DB changes |
| `trigger_regulatory_scan` | Run Regulatory Scout cron |
| `seed_database` | Reset to AU seed data |
| `health_check` | API + Supabase status |

## Setup

```bash
cd mcp-server
npm install
npm run dev
```

## Environment

```bash
PEPTIDE_API_URL=http://localhost:3000
MCP_API_KEY=your-shared-secret   # same as web/.env.local
```

## Hermes Agent config

Add to Hermes MCP servers (`~/.hermes/config.yaml` or project config):

```yaml
mcp_servers:
  peptide-command:
    command: node
    args:
      - /path/to/Peptide Monitor/mcp-server/dist/index.js
    env:
      PEPTIDE_API_URL: http://localhost:3000
      MCP_API_KEY: your-shared-secret
```

## Regulatory Scout cron (Hermes)

```yaml
cron:
  - name: daily-reg-scan
    schedule: "0 8 * * *"   # 08:00 daily
    profile: regulatory-scout
    prompt: |
      Use trigger_regulatory_scan tool to scan AU regulatory matrix.
      Summarize findings and log any P0/P1 alerts created.
```

Profile `regulatory-scout` should have access to the `peptide-command` MCP server.

## Architecture

```
Hermes Agent (regulatory-scout profile)
        │ MCP stdio
        ▼
Peptide Command MCP Server
        │ HTTP + Bearer token
        ▼
Next.js API (/api/cron/regulatory-scan, /api/inbox, …)
        │ service role
        ▼
Supabase PostgreSQL
```
