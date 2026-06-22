# Peptide Command Web

多肽跨境供应链情报与决策系统 — 前端应用。

## 启动

```bash
cd web
npm install
npm run dev
```

浏览器访问：

- 英文：http://localhost:3000/en
- 中文：http://localhost:3000/zh

## 页面

| 路径 | 模块 |
|------|------|
| `/` | 战略首页（KPI + 地图缩略 + 风险 + 监管摘要） |
| `/supply-chain` | 供应链地图（具名节点、路径切换、节点编辑） |
| `/regulatory` | 监管矩阵 |
| `/documents` | 文件与资质追踪 |
| `/intelligence` | 市场情报 / SKU 排行 |
| `/product-monitor` | 产品监控 / SKU Monitor（平台覆盖 · 三档备货） |
| `/relations` | 供应商与客户 CRM |
| `/risk` | 风险瞭望塔 |
| `/alerts` | 提醒与行动中心 |
| `/inbox` | Agent 收件箱 |

## 技术栈

- Next.js 16 + TypeScript + Tailwind CSS 4
- next-intl（中/英切换，整站单一语言）
- 种子数据：`src/lib/supply-chain/seed-data.ts`
- 供应链本地持久化：`localStorage`（`useSupplyChainStore`）

## 数据说明

- **Supabase（推荐）**：配置 `web/.env.local` 后，全部模块从 PostgreSQL 读写；详见 [docs/SUPABASE_SETUP.md](../docs/SUPABASE_SETUP.md)
- **离线演示**：未配置 Supabase 时，回退到 `src/lib/**/seed-data.ts` 本地数据
- 首次连库会自动 seed；也可 `POST /api/platform/seed` 手动重置
