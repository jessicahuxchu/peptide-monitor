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

在 Supabase Dashboard → **SQL Editor**，**按顺序**运行 `supabase/migrations/` 下全部脚本（当前到 `012_remove_seed_alerts.sql`）：

```
001_initial.sql
002_extended_modules.sql
003_social_posts.sql
004_product_intro.sql
005_social_scan_jobs.sql
006_social_post_classification.sql
007_sku_opportunities_nullable_prices.sql
008_agent_chat_sessions.sql
009_social_post_engagement_refresh.sql
010_alert_assignment.sql
011_platform_users_and_review_category.sql
012_remove_seed_alerts.sql
```

早期脚本会建核心表；后续脚本覆盖产品介绍、社媒扫描、告警指派、平台用户等。`012` 会清理早期种子通知数据。

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

# Reddit (optional OAuth fallback)
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
REDDIT_USER_AGENT=PeptideMonitor/0.1 by your_reddit_username

# Apify (recommended — Reddit via trudax/reddit-scraper-lite)
APIFY_API_TOKEN=
APIFY_REDDIT_ACTOR=trudax/reddit-scraper-lite
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
| `social_posts` | Reddit 原始帖（内部页 `/social-posts`，不进主导航） |
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

## 7b. Test Reddit heat scan (daily, via Apify)

1. 注册 [Apify](https://apify.com/)，在 [Integrations](https://console.apify.com/account/integrations) 复制 **API Token**  
2. 填入 `web/.env.local` 的 `APIFY_API_TOKEN`（使用 Actor：`trudax/reddit-scraper-lite`）  
3. 在 Supabase SQL Editor 运行 `003_social_posts.sql`（若尚未运行）  
4. 触发扫描：

```bash
cd web
npm run reddit-heat-scan
```

或通过 API：

```bash
curl -X POST http://localhost:3000/api/cron/reddit-heat-scan \
  -H "Authorization: Bearer YOUR_MCP_API_KEY"
```

- Apify 抓取原始帖 → 写入 `social_posts`  
- 内部核对：`/zh/social-posts`（不进导航）  
- 过门槛热度 → `intelligence_signals`（`source=social`）→ `/intelligence`  

## 7c. Vercel 每日自动扫描（Cron）

Apify 抓取通常需要 **5–20 分钟**，超过 Vercel 单次函数时限，因此拆成两阶段：

| 时间 (UTC) | 北京时间 | 路径 | 作用 |
|---|---|---|---|
| 02:00 | 10:00 | `?phase=start` | 启动 Apify，立即返回 |
| 03:00 | 11:00 | `?phase=complete` | 检查结果并写入数据库 |

配置见 `web/vercel.json`。还需在 Supabase 运行 `005_social_scan_jobs.sql` 与 `006_social_post_classification.sql`（AI 分类字段）。

在 Vercel → **Settings → Environment Variables** 确保已配置：

| 变量 | 说明 |
|------|------|
| `APIFY_API_TOKEN` | Apify 抓取 Reddit |
| `CRON_SECRET` | Vercel Cron 鉴权（长随机字符串） |
| `SUPABASE_SERVICE_ROLE_KEY` 等 | 写库所需 |

手动测试（应 **几秒内** 返回，不会卡住）：

```bash
# 启动 Apify
curl "https://YOUR_DOMAIN/api/cron/reddit-heat-scan?phase=start" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# 约 1 小时后收尾入库
curl "https://YOUR_DOMAIN/api/cron/reddit-heat-scan?phase=complete" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

本地完整同步扫描（会等 Apify 跑完，较慢）：

```bash
cd web && npm run reddit-heat-scan
```

> Apify 按量计费（lite 版约 $0.004/结果）。每日扫描约 4 个 URL（MVP 范围），通常每次几十条结果。

## API Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/dashboard` | — | 战略首页聚合数据 |
| GET | `/api/supply-chain` | — | 供应链全量（自动 seed） |
| GET | `/api/regulatory` | — | 监管矩阵 |
| GET | `/api/alerts` | — | 提醒列表 |
| GET | `/api/risk` | — | 风险信号 |
| GET | `/api/intelligence` | — | 情报 + SKU 机会 |
| GET | `/api/social-posts` | — | Reddit 原始帖（内部） |
| GET/POST | `/api/cron/reddit-heat-scan` | MCP_API_KEY 或 CRON_SECRET | 每日 Reddit 热度扫描（Vercel Cron） |
| GET | `/api/finance` | — | 销售记录 |
| GET | `/api/product-monitor` | — | 产品监控全量 |
| GET | `/api/relations` | — | 供应商 + 客户需求 |
| GET/POST | `/api/inbox` | — | Agent 收件箱 |
| POST | `/api/platform/seed` | MCP key | 全量重置 seed |
| POST | `/api/supply-chain/seed` | MCP key | 仅供应链 seed |
| POST | `/api/cron/regulatory-scan` | MCP key | 监管扫描 |

## Offline fallback

未配置 `.env.local` 时，应用回退到代码内 seed 数据（与接入 Supabase 前行为一致）。
