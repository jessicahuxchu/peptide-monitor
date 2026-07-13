import "server-only";

import {
  fetchAlerts,
  fetchFinanceData,
  fetchIntelligenceData,
  fetchProductMonitorData,
  fetchRegulatoryEntries,
  fetchRelationsData,
  fetchRiskSignals,
  fetchSocialPosts,
} from "@/lib/db/queries";
import { fetchSupplyChainState } from "@/lib/db/supply-chain";
import { salesRecords } from "@/lib/finance/seed-data";
import { intelligenceSignals } from "@/lib/intelligence/seed-data";
import { productMonitorRecords } from "@/lib/product-monitor/seed-data";
import { enrichRecordScores } from "@/lib/product-monitor/scoring";
import { productIntros } from "@/lib/product-monitor/product-intros";
import { computeProductHeat } from "@/lib/social/heat-aggregator";
import type { NormalizedSocialPost } from "@/lib/social/types";
import type { SocialPost } from "@/lib/social/types";
import {
  alerts,
  regulatoryEntries,
  riskSignals,
  skuOpportunities,
  supplyChainState,
} from "@/lib/supply-chain/seed-data";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export type AgentDataDomain =
  | "intelligence"
  | "social_heat"
  | "product_monitor"
  | "supply_chain"
  | "finance"
  | "relations"
  | "risk"
  | "regulatory";

export interface AgentDataQuery {
  domain: AgentDataDomain;
  product?: string;
  limit?: number;
}

function toNormalizedPost(post: SocialPost): NormalizedSocialPost {
  return {
    id: post.id,
    platform: "reddit",
    externalId: post.externalId,
    subreddit: post.subreddit ?? "",
    title: post.title,
    body: post.body,
    score: post.score,
    numComments: post.numComments,
    author: post.author,
    permalink: post.permalink,
    url: post.url,
    postedAt: post.postedAt,
    products: post.products,
    hasRegulatory: post.hasRegulatory,
    engagement: post.engagement,
    auContext: post.auContext ?? false,
    regulatoryReason: post.regulatoryReason,
    classifiedBy: post.classifiedBy,
  };
}

function trimText(value: string, max = 160): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

export async function queryAgentPlatformData(
  query: AgentDataQuery,
): Promise<{ source: "database" | "seed"; data: unknown }> {
  const limit = query.limit ?? 10;
  const usingDb = isSupabaseConfigured();

  try {
    switch (query.domain) {
      case "intelligence": {
        if (usingDb) {
          const { signals, skuOpportunities: skus } = await fetchIntelligenceData();
          const filtered = query.product
            ? signals.filter((s) =>
                s.products.some((p) =>
                  p.toLowerCase().includes(query.product!.toLowerCase()),
                ),
              )
            : signals;

          const socialSignals = filtered
            .filter((s) => s.source === "social")
            .sort((a, b) => (b.heatImpact ?? 0) - (a.heatImpact ?? 0))
            .slice(0, limit);

          const topByHeat = [...filtered]
            .sort((a, b) => (b.heatImpact ?? 0) - (a.heatImpact ?? 0))
            .slice(0, limit);

          return {
            source: "database",
            data: {
              summary:
                "舆论情报来自 Supabase intelligence_signals 与 sku_opportunities（含 Reddit 热度聚合）。",
              topByHeat: topByHeat.map((s) => ({
                id: s.id,
                title: s.title,
                summary: trimText(s.summary),
                date: s.date,
                products: s.products,
                source: s.source,
                dimension: s.dimension,
                heatImpact: s.heatImpact,
                regulatoryImpact: s.regulatoryImpact,
                trend: s.trend,
                directionLabel: s.directionLabel,
              })),
              socialSignals: socialSignals.map((s) => ({
                id: s.id,
                title: s.title,
                products: s.products,
                heatImpact: s.heatImpact,
                trend: s.trend,
                date: s.date,
              })),
              skuOpportunities: skus.slice(0, limit).map((s) => ({
                id: s.id,
                product: s.product,
                opportunityScore: s.opportunityScore,
                demandScore: s.demandScore,
                trend: s.trend,
              })),
            },
          };
        }

        const seedSignals = query.product
          ? intelligenceSignals.filter((s) =>
              s.products.some((p) =>
                p.toLowerCase().includes(query.product!.toLowerCase()),
              ),
            )
          : intelligenceSignals;

        return {
          source: "seed",
          data: {
            summary: "离线 seed 数据（未连接 Supabase）。",
            topByHeat: [...seedSignals]
              .sort((a, b) => (b.heatImpact ?? 0) - (a.heatImpact ?? 0))
              .slice(0, limit),
            skuOpportunities: skuOpportunities.slice(0, limit),
          },
        };
      }

      case "social_heat": {
        if (usingDb) {
          const { posts } = await fetchSocialPosts({ limit: 500 });
          const normalized = posts.map(toNormalizedPost);
          let heat = computeProductHeat(normalized)
            .sort((a, b) => b.heatImpact - a.heatImpact)
            .slice(0, limit);

          if (query.product) {
            const needle = query.product.toLowerCase();
            heat = heat.filter((h) => h.product.toLowerCase().includes(needle));
          }

          return {
            source: "database",
            data: {
              summary:
                "社交热度由 social_posts 表中的 Reddit 帖子聚合计算（24h/7d 提及、互动、heatImpact）。",
              postCount: posts.length,
              rankings: heat.map((h) => ({
                product: h.product,
                heatImpact: h.heatImpact,
                trend: h.trend,
                mentions24h: h.mentions24h,
                mentions7d: h.mentions7d,
                engagement24h: h.engagement24h,
                liftRatio: Number(h.liftRatio.toFixed(2)),
                hasRegulatory: h.hasRegulatory,
                topPostTitle: h.topPost?.title ?? null,
              })),
            },
          };
        }

        return {
          source: "seed",
          data: {
            summary: "未连接数据库，无 social_posts 实时热度。请配置 Supabase 并运行 Reddit heat scan。",
            rankings: [],
          },
        };
      }

      case "product_monitor": {
        if (usingDb) {
          const { records } = await fetchProductMonitorData();
          let rows = records;
          if (query.product) {
            const needle = query.product.toLowerCase();
            rows = rows.filter(
              (r) =>
                r.id.toLowerCase().includes(needle) ||
                r.product.toLowerCase().includes(needle),
            );
          }
          return {
            source: "database",
            data: {
              summary: "产品监控来自 product_monitor_records。",
              products: rows.slice(0, limit).map((r) => ({
                id: r.id,
                name: r.product,
                compositeScore: r.compositeScore,
                tier: r.tier,
                platformCoverage: r.platformCoverage,
                auRegulatoryRisk: r.auRegulatoryRisk,
                stockMode: r.supplyMetrics.stockMode,
              })),
            },
          };
        }

        const seedRecords = productMonitorRecords.map((r) =>
          enrichRecordScores({
            ...r,
            productIntro: r.productIntro ?? productIntros[r.id],
          }),
        );
        return {
          source: "seed",
          data: {
            summary: "离线 seed 产品监控数据。",
            products: seedRecords.slice(0, limit).map((r) => ({
              id: r.id,
              name: r.product,
              compositeScore: r.compositeScore,
              tier: r.tier,
            })),
          },
        };
      }

      case "supply_chain": {
        const state = usingDb ? await fetchSupplyChainState() : supplyChainState;
        return {
          source: usingDb ? "database" : "seed",
          data: {
            summary: "供应链路径、节点与文件状态。",
            paths: state.paths.map((p) => ({
              id: p.id,
              market: p.market,
              pathType: p.pathType,
            })),
            nodes: state.nodes.slice(0, limit).map((n) => ({
              id: n.id,
              displayName: n.displayName,
              pathId: n.pathId,
              documentCompletion: n.documentCompletion,
              riskLevel: n.riskLevel,
              status: n.status,
            })),
            documentGaps: state.documents
              .filter((d) => d.status === "missing" || d.status === "expired")
              .slice(0, limit)
              .map((d) => ({
                id: d.id,
                docType: d.docType,
                linkedProduct: d.linkedProduct,
                status: d.status,
              })),
          },
        };
      }

      case "finance": {
        const { records } = usingDb
          ? await fetchFinanceData()
          : { records: salesRecords };
        const byProduct = new Map<string, number>();
        for (const r of records) {
          byProduct.set(r.product, (byProduct.get(r.product) ?? 0) + r.revenue);
        }
        const ranked = [...byProduct.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, limit)
          .map(([product, revenue]) => ({ product, revenue, currency: "AUD" }));

        return {
          source: usingDb ? "database" : "seed",
          data: {
            summary: "财务销售记录汇总（AUD）。",
            topProductsByRevenue: ranked,
            recentRecords: records.slice(-limit).map((r) => ({
              date: r.date,
              product: r.product,
              region: r.region,
              revenue: r.revenue,
              currency: r.currency,
            })),
          },
        };
      }

      case "relations": {
        if (usingDb) {
          const { suppliers, demands } = await fetchRelationsData();
          return {
            source: "database",
            data: {
              summary: "供应商与客户需求匹配数据。",
              suppliers: suppliers.slice(0, limit).map((s) => ({
                name: s.name,
                country: s.country,
                products: s.products,
                region: s.region,
              })),
              demands: demands.slice(0, limit).map((d) => ({
                name: d.name,
                region: d.region,
                product: d.product,
                status: d.status,
              })),
            },
          };
        }
        return {
          source: "seed",
          data: {
            summary: "关系数据需连接 Supabase。",
            suppliers: [],
            demands: [],
          },
        };
      }

      case "risk": {
        const signals = usingDb ? await fetchRiskSignals() : riskSignals;
        const alertItems = usingDb ? await fetchAlerts() : alerts;
        return {
          source: usingDb ? "database" : "seed",
          data: {
            summary: "风险信号与警报。",
            riskSignals: signals.slice(0, limit),
            alerts: alertItems.slice(0, limit).map((a) => ({
              id: a.id,
              priority: a.priority,
              titleKey: a.titleKey,
              status: a.status,
              source: a.source,
            })),
          },
        };
      }

      case "regulatory": {
        const entries = usingDb ? await fetchRegulatoryEntries() : regulatoryEntries;
        let rows = entries;
        if (query.product) {
          const needle = query.product.toLowerCase();
          rows = rows.filter((e) => e.product.toLowerCase().includes(needle));
        }
        return {
          source: usingDb ? "database" : "seed",
          data: {
            summary: "AU 合规矩阵（联邦 + 州 overlay）。",
            entries: rows.slice(0, limit).map((e) => ({
              product: e.product,
              region: e.region,
              market: e.market,
              classification: e.classification,
              riskLevel: e.riskLevel,
            })),
          },
        };
      }

      default:
        return { source: usingDb ? "database" : "seed", data: { error: "Unknown domain" } };
    }
  } catch (err) {
    return {
      source: usingDb ? "database" : "seed",
      data: {
        error: err instanceof Error ? err.message : "Query failed",
        domain: query.domain,
      },
    };
  }
}

export function isPlatformDataQuery(text: string): boolean {
  return /舆论|情报|热度|heat|social|reddit|产品监控|机会分|供应链|财务|营收|销售|风险|合规|监管|供应商|询盘|报价|sku|bpc|tb-500|ghk|semaglutide|tesamorelin|哪个产品|最高|排名|top/i.test(
    text,
  );
}

export function inferDataDomains(text: string): AgentDataDomain[] {
  const domains = new Set<AgentDataDomain>();
  const q = text.toLowerCase();

  if (/舆论|情报|热度|heat|social|reddit|哪个产品|最高|排名|top|机会分/.test(q)) {
    domains.add("intelligence");
    domains.add("social_heat");
  }
  if (/产品监控|viability|综合评判|composite|备货|上架/.test(q)) {
    domains.add("product_monitor");
  }
  if (/供应链|节点|文件|path|供应/.test(q)) {
    domains.add("supply_chain");
  }
  if (/财务|营收|销售|revenue/.test(q)) {
    domains.add("finance");
  }
  if (/供应商|客户|关系|询盘|报价/.test(q)) {
    domains.add("relations");
  }
  if (/风险|alert|警报/.test(q)) {
    domains.add("risk");
  }
  if (/合规|监管|tga|矩阵|regulatory/.test(q)) {
    domains.add("regulatory");
  }

  if (domains.size === 0 && isPlatformDataQuery(text)) {
    domains.add("intelligence");
  }

  return [...domains];
}
