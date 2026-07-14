# Google News 信源设计（舆论情报）

**日期：** 2026-07-14  
**状态：** 已确认，进入实现 / 试跑

## 目标

在现有 Reddit 舆论情报之外，增加 Google News 搜索，覆盖 peptide 及细分品类新闻、法规变化，以及生产/研发相关报道。信号独立写入 `intelligence_signals.source = news_legal`。

## 决策摘要

| 项 | 选择 |
|---|---|
| Actor | `crawlerbros/google-news-scraper`（env: `APIFY_GOOGLE_NEWS_ACTOR`） |
| 接入 | 独立 `news_legal` 管道，不并入 Reddit heat |
| 市场 | 英文 + 澳大利亚侧重（AU/TGA query） |
| 抓取深度 | 标题 + 摘要 + 链接（`extractFullText: false`） |
| 晋升 | 规则：监管关键词立即晋升；非监管同产品 7 日 ≥ 3 条汇总晋升 |
| 存储 | `social_posts.platform = google_news` |

## 数据流

```
Cron start → Apify Google News
Cron complete → normalize → match products / peptide generic
→ upsert social_posts → rule promote → intelligence_signals (news_legal)
```

Job id 前缀：`news-scan-{runId}`，与 Reddit `scan-{runId}` 隔离。

## Queries（MVP）

总类、品类、AU/监管、生产研发（见 `GOOGLE_NEWS_QUERIES`）。

## 不做

- engagement refresh  
- 混入 Reddit heat / sku_opportunities 社群热度  
- 全文抽取（MVP）
