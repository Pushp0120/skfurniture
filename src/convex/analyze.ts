"use node";

import { v } from "convex/values";
import { vly } from "../lib/vly-integrations";
import { internal } from "./_generated/api";
import { action } from "./_generated/server";

// Model used for the brand analysis. `gpt-5` is the AI gateway's default model.
const MODEL = "gpt-5";

const SYSTEM_PROMPT = `You are a senior brand strategist at a top creative agency. You audit Instagram accounts and produce sharp, specific, evidence-based brand analyses for paying clients.

Rules:
- Base every claim on the actual profile data provided (bio, captions, category, follower/post counts, imagery, colours). Reference specifics where possible.
- Never give generic advice. No filler, no hedging.
- If some data is missing, work with what is visible and stay concrete. Do not invent facts.
- Reply with a SINGLE valid JSON object and nothing else. No markdown, no code fences, no commentary.`;

interface ReportColour {
  name: string;
  hex: string;
  role?: string;
}

interface ParsedReport {
  brandName?: string;
  handle?: string;
  brandPersonality?: string;
  targetAudience?: string;
  coreOffer?: string;
  brandColours?: ReportColour[];
  contentStyle?: string;
  websiteGoal?: string;
  keyMessage?: string;
  evidence?: string;
}

/** Pull a username out of a profile URL, @handle, or bare handle. */
function parseUsername(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const urlMatch = trimmed.match(/instagram\.com\/([^/?#\s]+)/i);
  let candidate = urlMatch
    ? urlMatch[1]
    : trimmed.replace(/^@/, "").split(/[/?#\s]/)[0];
  candidate = (candidate ?? "").trim();

  const reserved = new Set([
    "p",
    "reel",
    "reels",
    "stories",
    "explore",
    "tv",
    "accounts",
  ]);
  if (!candidate || reserved.has(candidate.toLowerCase())) return null;
  if (!/^[A-Za-z0-9._]{1,40}$/.test(candidate)) return null;

  return candidate;
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function extractMeta(html: string): string {
  const parts: string[] = [];
  const ogTitle = html.match(
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i,
  )?.[1];
  const ogDesc = html.match(
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i,
  )?.[1];
  const metaDesc = html.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i,
  )?.[1];

  if (ogTitle) parts.push(`Title: ${ogTitle}`);
  if (ogDesc) parts.push(`Description: ${ogDesc}`);
  if (metaDesc && metaDesc !== ogDesc) parts.push(`Meta: ${metaDesc}`);
  return parts.join("\n");
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  ms = 12000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchDirect(username: string): Promise<string> {
  const res = await fetchWithTimeout(`https://www.instagram.com/${username}/`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  if (!res.ok) throw new Error(`Instagram returned ${res.status}`);
  return await res.text();
}

async function fetchViaReader(username: string): Promise<string> {
  const res = await fetchWithTimeout(
    `https://r.jina.ai/https://www.instagram.com/${username}/`,
    { headers: { Accept: "text/plain" } },
  );
  if (!res.ok) throw new Error(`Reader returned ${res.status}`);
  return (await res.text()).trim();
}

async function fetchViaScraperApi(
  username: string,
  key: string,
): Promise<string> {
  const target = encodeURIComponent(`https://www.instagram.com/${username}/`);
  const res = await fetchWithTimeout(
    `https://api.scraperapi.com/?api_key=${key}&url=${target}&render=true`,
    {},
    20000,
  );
  if (!res.ok) throw new Error(`ScraperAPI returned ${res.status}`);
  return await res.text();
}

/** Best-effort collection of whatever public data we can read for a profile. */
async function gatherProfileData(username: string): Promise<string> {
  const parts: string[] = [];

  const scraperKey = process.env.SCRAPERAPI_KEY;
  if (scraperKey) {
    try {
      const html = await fetchViaScraperApi(username, scraperKey);
      const meta = extractMeta(html);
      if (meta) parts.push(meta);
      const text = htmlToText(html);
      if (text) parts.push(`Page text: ${text.slice(0, 1500)}`);
    } catch {
      // fall through to the next strategy
    }
  }

  if (parts.join("").length < 40) {
    try {
      const html = await fetchDirect(username);
      const meta = extractMeta(html);
      if (meta) parts.push(meta);
      const text = htmlToText(html);
      if (text) parts.push(`Page text: ${text.slice(0, 1500)}`);
    } catch {
      // fall through to the next strategy
    }
  }

  if (parts.join("").length < 40) {
    try {
      const reader = await fetchViaReader(username);
      if (reader) parts.push(reader.slice(0, 4000));
    } catch {
      // give up on scraping; the analysis still runs from the handle/notes
    }
  }

  return parts.join("\n").trim().slice(0, 6000);
}

function buildPrompt(args: {
  username: string;
  profileUrl: string;
  scraped: string;
  userContext?: string;
}): string {
  const data = args.scraped
    ? args.scraped
    : "(No public data could be scraped — rely on the handle and any strategist notes below. Be explicit and conservative rather than inventing facts.)";
  const notes = args.userContext?.trim()
    ? `\n\n--- NOTES FROM THE STRATEGIST ---\n${args.userContext.trim()}`
    : "";

  return `Analyse this Instagram profile and return a brand report.

INSTAGRAM URL: ${args.profileUrl}
HANDLE: @${args.username}

--- PROFILE DATA ---
${data}${notes}
-------------------

Answer all 7 questions, being specific to THIS profile:
1. BRAND PERSONALITY — the overall tone and feel (e.g. bold, minimal, warm, professional, playful).
2. TARGET AUDIENCE — who they are talking to: age, profession, pain points, what they want.
3. CORE OFFER — the main product or service this person or business is selling.
4. BRAND COLOURS — dominant colours in their feed, with hex codes.
5. CONTENT STYLE — formal or casual, and the kind of language they use.
6. WEBSITE GOAL — what their website should primarily do (generate leads, sell a product, build credibility, book consultations, etc.).
7. KEY MESSAGE — one headline that could go on their website homepage, speaking directly to their audience.

Return ONLY this JSON (no markdown):
{
  "brandName": "the business name as shown on the profile",
  "handle": "@${args.username}",
  "brandPersonality": "...",
  "targetAudience": "...",
  "coreOffer": "...",
  "brandColours": [{"name": "colour name", "hex": "#RRGGBB", "role": "primary|secondary|accent|background"}],
  "contentStyle": "...",
  "websiteGoal": "...",
  "keyMessage": "...",
  "evidence": "1-3 short points naming the specific things you saw that drove this analysis"
}`;
}

function normalizeColours(value: unknown): ReportColour[] {
  if (!Array.isArray(value)) return [];
  const out: ReportColour[] = [];

  for (const item of value) {
    if (typeof item === "string") {
      const hex = item.match(/#[0-9a-fA-F]{3,8}/)?.[0];
      if (hex) {
        out.push({ name: item.replace(hex, "").trim() || "Colour", hex });
      }
    } else if (item && typeof item === "object") {
      const obj = item as Record<string, unknown>;
      const name =
        typeof obj.name === "string" && obj.name.trim()
          ? obj.name.trim()
          : typeof obj.role === "string" && obj.role.trim()
            ? obj.role.trim()
            : "Colour";
      let hex = typeof obj.hex === "string" ? obj.hex.trim() : "";
      if (!hex.startsWith("#")) {
        const found = hex.match(/[0-9a-fA-F]{6}/);
        hex = found ? `#${found[0]}` : "";
      }
      if (hex) {
        out.push({
          name,
          hex,
          role: typeof obj.role === "string" ? obj.role : undefined,
        });
      }
    }
  }

  return out.slice(0, 8);
}

function parseReport(content: string): ParsedReport | null {
  const cleaned = content.replace(/```json/gi, "```").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;

  let raw: unknown;
  try {
    raw = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
  if (!raw || typeof raw !== "object") return null;

  const obj = raw as Record<string, unknown>;
  const str = (key: string): string | undefined => {
    const value = obj[key];
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
  };

  const colours = normalizeColours(obj.brandColours);

  return {
    brandName: str("brandName"),
    handle: str("handle"),
    brandPersonality: str("brandPersonality"),
    targetAudience: str("targetAudience"),
    coreOffer: str("coreOffer"),
    brandColours: colours.length ? colours : undefined,
    contentStyle: str("contentStyle"),
    websiteGoal: str("websiteGoal"),
    keyMessage: str("keyMessage"),
    evidence: str("evidence"),
  };
}

export const analyze = action({
  args: {
    analysisId: v.id("analyses"),
    url: v.string(),
    userContext: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      await ctx.runMutation(internal.analyses.markError, {
        id: args.analysisId,
        error: "Your session expired. Please sign out and sign in again.",
      });
      return;
    }

    const doc = await ctx.runQuery(internal.analyses.getInternal, {
      id: args.analysisId,
    });
    if (!doc) {
      return;
    }
    if (doc.userId !== identity.subject) {
      await ctx.runMutation(internal.analyses.markError, {
        id: args.analysisId,
        error: "You don't have access to this analysis.",
      });
      return;
    }

    const username = parseUsername(args.url);
    if (!username) {
      await ctx.runMutation(internal.analyses.markError, {
        id: args.analysisId,
        error:
          "That doesn't look like a valid Instagram profile link. Try something like instagram.com/username.",
      });
      return;
    }

    let scraped = "";
    try {
      scraped = await gatherProfileData(username);
    } catch {
      // analysis continues without scraped data
    }

    const profileUrl = `https://www.instagram.com/${username}/`;

    let report: ParsedReport | null = null;
    try {
      const result = await vly.ai.completion({
        model: MODEL,
        maxTokens: 2000,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: buildPrompt({
              username,
              profileUrl,
              scraped,
              userContext: args.userContext,
            }),
          },
        ],
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || "The AI service did not respond.");
      }

      const content = result.data.choices?.[0]?.message?.content ?? "";
      report = parseReport(content);
      if (!report) {
        throw new Error(
          "The analyser could not structure its response. Please try again.",
        );
      }
    } catch (err) {
      await ctx.runMutation(internal.analyses.markError, {
        id: args.analysisId,
        error:
          err instanceof Error
            ? err.message
            : "Something went wrong during the analysis.",
      });
      return;
    }

    await ctx.runMutation(internal.analyses.markComplete, {
      id: args.analysisId,
      username,
      scrapedText: scraped ? scraped.slice(0, 4000) : undefined,
      report,
    });
  },
});
