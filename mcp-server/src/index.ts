#!/usr/bin/env node
/**
 * Peptide Command MCP Server — stdio transport for Hermes Agent
 * Env: PEPTIDE_API_URL, MCP_API_KEY
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const API_URL = process.env.PEPTIDE_API_URL ?? "http://localhost:3000";
const API_KEY = process.env.MCP_API_KEY ?? "";

async function apiFetch(path: string, init?: RequestInit) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (API_KEY) headers["Authorization"] = `Bearer ${API_KEY}`;

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? `API ${res.status}: ${path}`);
  return body;
}

const TOOLS = [
  {
    name: "get_supply_chain",
    description: "Fetch full supply chain state",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "update_path_node",
    description: "Update a path node",
    inputSchema: {
      type: "object",
      properties: {
        nodeId: { type: "string" },
        updates: { type: "object" },
      },
      required: ["nodeId", "updates"],
    },
  },
  {
    name: "get_inbox",
    description: "List agent inbox submissions",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "submit_inbox",
    description: "Submit team input to Agent Inbox",
    inputSchema: {
      type: "object",
      properties: {
        author: { type: "string" },
        content: { type: "string" },
      },
      required: ["author", "content"],
    },
  },
  {
    name: "confirm_inbox_submission",
    description: "Confirm pending submission and commit changes",
    inputSchema: {
      type: "object",
      properties: {
        submissionId: { type: "string" },
        actor: { type: "string" },
      },
      required: ["submissionId"],
    },
  },
  {
    name: "trigger_regulatory_scan",
    description: "Run Regulatory Scout scan and create alerts",
    inputSchema: {
      type: "object",
      properties: { source: { type: "string" } },
    },
  },
  {
    name: "seed_database",
    description: "Reset database to seed data",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "health_check",
    description: "Check API health",
    inputSchema: { type: "object", properties: {} },
  },
] as const;

const server = new Server(
  { name: "peptide-command", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema,
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const a = (args ?? {}) as Record<string, unknown>;

  try {
    let result: unknown;

    switch (name) {
      case "get_supply_chain":
        result = await apiFetch("/api/supply-chain");
        break;
      case "update_path_node":
        result = await apiFetch(`/api/supply-chain/nodes/${a.nodeId}`, {
          method: "PATCH",
          body: JSON.stringify(a.updates),
        });
        break;
      case "get_inbox":
        result = await apiFetch("/api/inbox");
        break;
      case "submit_inbox":
        result = await apiFetch("/api/inbox", {
          method: "POST",
          body: JSON.stringify({ author: a.author, content: a.content }),
        });
        break;
      case "confirm_inbox_submission":
        result = await apiFetch(`/api/inbox/${a.submissionId}/confirm`, {
          method: "POST",
          body: JSON.stringify({ actor: a.actor ?? "hermes-agent" }),
        });
        break;
      case "trigger_regulatory_scan":
        result = await apiFetch("/api/cron/regulatory-scan", {
          method: "POST",
          body: JSON.stringify({ source: a.source ?? "scheduled_scout" }),
        });
        break;
      case "seed_database":
        result = await apiFetch("/api/supply-chain/seed", { method: "POST" });
        break;
      case "health_check":
        result = await apiFetch("/api/health");
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: "text",
          text: err instanceof Error ? err.message : "Tool execution failed",
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
