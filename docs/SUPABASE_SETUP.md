# Supabase + Backend Setup

## 你需要提供什么？

**不需要把 Supabase 账号密码给我。** 你只需要：

1. 在 [supabase.com](https://supabase.com) 自己注册并创建一个 Project
2. 从 Project Settings → API 复制三个值，填到本地 `web/.env.local`
3. 在 Supabase SQL Editor 里运行 migration 脚本（见下方）

我（或 Agent/Cron）无法代你登录 Supabase 控制台；凭证只保存在你的本机 `.env.local`，不要提交到 Git。

---

## 1. Create Supabase project

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. 记下 Project 名称，等待数据库初始化完成
3. 打开 **Project Settings → API**，复制：
   - **Project URL**
   - **anon public key**
   - **service_role key**（仅服务端使用，保密）

## 2. Run migrations

在 Supabase Dashboard → **SQL Editor**，**按顺序**运行：

```
supabase/migrations/001_initial.sql
supabase/migrations/002_extended_modules.sql
```

`002` 会新增：产品监控、市场情报、财务、供需匹配、Dashboard 配置等表。

## 3. Configure environment

```bash
cp web/.env.example web/.env.local
```

填入（示例）：

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
MCP_API_KEY=your-long-random-secret
```

## 4. Start & auto-seed

```bash
cd web
npm install
npm run dev
```

首次访问任意页面（如 `/supply-chain` 或 `/product-monitor`）时，若数据库为空，会**自动导入全部演示数据**。

手动全量重置 seed：

```bash
curl -X POST http://localhost:3000/api/platform/seed \
  -H "Authorization: Bearer YOUR_MCP_API_KEY"
```

## 5. 在 Supabase 后台查看数据

登录 Supabase → **Table Editor**，可看到全部表，例如：

| 表名 | 内容 |
|------|------|
| `supply_chain_paths` / `path_nodes` / `path_edges` | 供应链 |
| `documents` | 文件资质 |
| `regulatory_entries` | 监管矩阵 |
| `alerts` / `risk_signals` | 提醒与风险 |
| `entities` | CRM 实体 |
| `product_monitor_records` | SKU 监控（221 条） |
| `intelligence_signals` / `sku_opportunities` | 市场情报 |
| `sales_records` | 财务销售 |
| `supplier_profiles` / `customer_demands` | 供需匹配 |
| `agent_submissions` | Agent 收件箱 |
| `platform_config` | 首页 Dashboard 小部件 |

## 6. MCP Server (Hermes)

```bash
cd mcp-server
npm install
npm run build
PEPTIDE_API_URL=http://localhost:3000 MCP_API_KEY=your-key npm run dev
```

## 7. Test regulatory scan

```bash
curl -X POST http://localhost:3000/api/cron/regulatory-scan \
  -H "Authorization: Bearer YOUR_MCP_API_KEY"
```

## API Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/dashboard` | — | 战略首页聚合数据 |
| GET | `/api/supply-chain` | — | 供应链全量（自动 seed） |
| GET | `/api/regulatory` | — | 监管矩阵 |
| GET | `/api/alerts` | — | 提醒列表 |
| GET | `/api/risk` | — | 风险信号 |
| GET | `/api/intelligence` | — | 情报 + SKU 机会 |
| GET | `/api/finance` | — | 销售记录 |
| GET | `/api/product-monitor` | — | 产品监控全量 |
| GET | `/api/relations` | — | 供应商 + 客户需求 |
| GET/POST | `/api/inbox` | — | Agent 收件箱 |
| POST | `/api/platform/seed` | MCP key | 全量重置 seed |
| POST | `/api/supply-chain/seed` | MCP key | 仅供应链 seed |
| POST | `/api/cron/regulatory-scan` | MCP key | 监管扫描 |

## Offline fallback

未配置 `.env.local` 时，应用回退到代码内 seed 数据（与接入 Supabase 前行为一致）。
