import { hasAuContext, hasRegulatoryKeyword } from "@/lib/social/matcher";
import type { NormalizedSocialPost } from "@/lib/social/types";

export type ClassificationProvider = "agent" | "rules";

export interface SocialPostClassification {
  postId: string;
  hasRegulatory: boolean;
  auContext: boolean;
  reason: string | null;
  classifiedBy: ClassificationProvider;
  confidence?: number;
}

export interface ClassifySocialPostsResult {
  classifications: SocialPostClassification[];
  provider: ClassificationProvider;
}

const BATCH_SIZE = 8;
const BODY_SNIPPET_CHARS = 1200;

const SYSTEM_PROMPT = `You classify Reddit posts about peptides for a supply-chain intelligence platform.

For each post, decide:
- hasRegulatory: true ONLY if the post's main topic is real regulatory/compliance/enforcement risk — e.g. FDA/TGA actions, bans, seizures, customs holds, scheduling changes, prescription requirements, enforcement raids, illegal sales allegations, or active legal compliance strategy.
- hasRegulatory: false for dosing questions, injury/recovery anecdotes, stack protocols, side effects, vendor reviews, and educational/science explainers — even if they mention legality in passing.
- hasRegulatory: false for boilerplate vendor/educational footers such as "for research use only", "not FDA approved", "not evaluated by the FDA", or "not intended to diagnose/treat" when those phrases appear only as disclaimers and are NOT the focus of the discussion.
- auContext: true if Australia-specific (TGA, Aussie locations, AU market).
- reason: one short sentence in Chinese explaining why hasRegulatory is true. Must be null when hasRegulatory is false.
- confidence: 0.0–1.0

Respond with JSON only:
{"posts":[{"id":"...","hasRegulatory":false,"auContext":false,"reason":null,"confidence":0.85}]}`;

type ClassifierPostInput = Pick<
  NormalizedSocialPost,
  "id" | "title" | "body" | "subreddit" | "products"
>;

function truncateBody(body: string): string {
  if (body.length <= BODY_SNIPPET_CHARS) return body;
  return `${body.slice(0, BODY_SNIPPET_CHARS)}…`;
}

function buildBatchPayload(posts: ClassifierPostInput[]): string {
  const items = posts.map((p) => ({
    id: p.id,
    subreddit: p.subreddit,
    products: p.products,
    title: p.title,
    body: truncateBody(p.body),
  }));
  return JSON.stringify(items, null, 2);
}

function classifyWithRules(post: ClassifierPostInput): SocialPostClassification {
  const text = `${post.title}\n${post.body}\n${post.subreddit}`;
  const hasRegulatory = hasRegulatoryKeyword(text);
  const auContext = hasAuContext(text);

  return {
    postId: post.id,
    hasRegulatory,
    auContext,
    reason: hasRegulatory
      ? "规则匹配：正文含监管/执法相关关键词"
      : null,
    classifiedBy: "rules",
  };
}

function extractJsonObject(raw: string): unknown {
  const trimmed = raw.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fence?.[1]?.trim() ?? trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object in model response");
  return JSON.parse(candidate.slice(start, end + 1));
}

function parseAgentBatch(
  posts: ClassifierPostInput[],
  raw: string,
): SocialPostClassification[] {
  const parsed = extractJsonObject(raw) as {
    posts?: Array<{
      id?: string;
      hasRegulatory?: boolean;
      auContext?: boolean;
      reason?: string | null;
      confidence?: number;
    }>;
  };

  const byId = new Map(
    (parsed.posts ?? []).map((item) => [item.id ?? "", item]),
  );

  return posts.map((post) => {
    const item = byId.get(post.id);
    if (!item) return classifyWithRules(post);

    return {
      postId: post.id,
      hasRegulatory: Boolean(item.hasRegulatory),
      auContext: Boolean(item.auContext),
      reason:
        item.reason?.trim() ||
        (item.hasRegulatory ? "AI 判定为监管相关" : null),
      classifiedBy: "agent" as const,
      confidence:
        typeof item.confidence === "number" ? item.confidence : undefined,
    };
  });
}

async function classifyBatchWithAgent(
  posts: ClassifierPostInput[],
): Promise<SocialPostClassification[] | null> {
  const gateway =
    process.env.HERMES_GATEWAY_URL ??
    process.env.OPENAI_BASE_URL ??
    (process.env.DASHSCOPE_API_KEY
      ? "https://dashscope.aliyuncs.com/compatible-mode/v1"
      : undefined);

  const apiKey =
    process.env.HERMES_API_KEY ??
    process.env.DASHSCOPE_API_KEY ??
    process.env.OPENAI_API_KEY;

  const model =
    process.env.HERMES_MODEL ?? process.env.QWEN_MODEL ?? "qwen-plus";

  if (!gateway || !apiKey) return null;

  try {
    const res = await fetch(`${gateway.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Classify these posts:\n${buildBatchPayload(posts)}`,
          },
        ],
      }),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) return null;

    return parseAgentBatch(posts, content);
  } catch {
    return null;
  }
}

/**
 * Classify social posts for regulatory / AU relevance.
 * Uses Hermes/Qwen gateway when configured; falls back to improved keyword rules.
 */
export async function classifySocialPosts(
  posts: ClassifierPostInput[],
): Promise<ClassifySocialPostsResult> {
  if (posts.length === 0) {
    return { classifications: [], provider: "rules" };
  }

  const classifications: SocialPostClassification[] = [];
  let usedAgent = false;

  for (let i = 0; i < posts.length; i += BATCH_SIZE) {
    const batch = posts.slice(i, i + BATCH_SIZE);
    const agentResult = await classifyBatchWithAgent(batch);

    if (agentResult) {
      classifications.push(...agentResult);
      usedAgent = true;
    } else {
      classifications.push(...batch.map(classifyWithRules));
    }
  }

  return {
    classifications,
    provider: usedAgent ? "agent" : "rules",
  };
}
