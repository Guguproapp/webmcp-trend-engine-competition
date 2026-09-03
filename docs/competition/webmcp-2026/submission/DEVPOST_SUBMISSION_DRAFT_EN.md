# Devpost Submission Draft

## Project name

Asia Trend Radar — Read-Only WebMCP Tools

## Tagline

Six safe WebMCP tools that turn live Asian trend signals into evidence-backed answers.

## Live demo

https://webmcp-trend-engine-competition.pages.dev/radar-tools?lang=en

## Source code

https://github.com/Guguproapp/webmcp-trend-engine-competition

## Demo video

https://youtu.be/AzmVt_3NpQE

## Short description

Asia Trend Radar gives browser agents a safe, structured way to discover current trend signals across Asian markets. Its six read-only WebMCP tools can search trends and videos, inspect a topic's evidence, and list available sources, markets, and categories. When native WebMCP is unavailable, the same data remains accessible through a responsive website search.

## Inspiration

Trend research is often fragmented across dashboards, search pages, and inconsistent source formats. An agent may find a popular topic but still lack the evidence needed to explain where it came from, how fresh it is, or whether the source is healthy. Copying results between a website and an assistant also loses structured context and uncertainty.

We wanted the website itself to expose a controlled interface to an agent without creating a separate plugin or giving the agent administrative access.

## What it does

Asia Trend Radar exposes six browser-native, read-only tools:

- `search_radar_trends` searches trend signals by market, category, signal type, time window, confidence, source, and sort order.
- `get_radar_trend` retrieves one topic together with its supporting evidence.
- `search_radar_videos` searches available video signals and returns an honest empty result when no qualifying data exists.
- `list_radar_sources` reports source availability and operational status.
- `list_radar_markets` lists supported markets and their enabled state.
- `list_radar_categories` lists normalized categories.

A judge can request Taiwan's top five rising searches from the previous 24 hours, inspect a Chinese-language topic ID, review source status, and query markets, categories, and video signals. The six-tool WebMCP surface exposes no management, scheduling, membership, payment, publishing, or write operations. Oversized requests such as `limit=500` are rejected.

## Why WebMCP

A normal webpage is designed for people to read. WebMCP adds a machine-readable interaction layer that lets a compatible browser agent discover the site's capabilities, understand each input schema, and invoke the correct operation directly.

This project uses WebMCP as the core interaction layer. The agent no longer needs to scrape rendered text or guess button locations, and it does not receive unrestricted API access. People can still use the same responsive website when native WebMCP is unavailable.

## Human-agent collaboration

The agent handles structured retrieval: it selects a read-only tool, applies the requested filters, and returns topic evidence and source status. The human remains responsible for interpretation and every downstream content or publishing decision. The agent cannot modify the radar, change sources, schedule jobs, or invoke management operations.

## How it was built

The interface uses React, TypeScript, Vite, and React Router and is hosted on Cloudflare Pages with Pages Functions.

Each tool is registered through `document.modelContext.registerTool()` with a strict JSON Schema and read-only annotations. Tools that may return external material are marked as containing untrusted content.

Native WebMCP calls and visible website searches share one server-side Radar adapter. The adapter handles field normalization, sorting, cache behavior, stale-data labels, bounded retries, sanitized errors, and a fixed allowlist of read-only upstream routes. Credentials remain server-side and are never returned to the webpage or tool output.

## Safety and truthful data handling

- Every public tool is read-only.
- Strict schemas reject unknown and unsafe inputs.
- `limit=500` is rejected because the maximum is 50.
- Unsafe topic-ID formats and traversal attempts are rejected.
- External titles are treated as untrusted content.
- Missing video data produces an empty result, not fabricated records.
- Relative popularity is not described as an exact search or view count.
- Credentials and upstream error details are sanitized.
- No management operation is registered as a WebMCP tool, and the Radar adapter allowlist excludes management routes.

## Work completed during the challenge

The underlying trend product, regional discovery interface, source pipeline, scoring concepts, evidence model, filters, and original responsive interface existed before the challenge. We do not claim those foundations as new WebMCP development.

After August 25, 2026, the challenge work added the isolated competition edition, six read-only WebMCP Radar tools, strict schemas and safety annotations, a dedicated server-side read-only adapter, native discovery and invocation support, honest empty and stale states, safe browser fallback behavior, localized topic-ID handling, an English judging interface, and challenge-specific validation evidence. Dated commits and the repository's `PREEXISTING_WORK.md` and `NEW_WORK_LOG.md` document the boundary.

## Challenges

Native WebMCP support is browser-dependent, so we had to distinguish genuine tool discovery and invocation from ordinary website automation. Native calls were verified in a compatible in-app browser. Safari was tested only as a normal website fallback; Safari native WebMCP is explicitly **NOT RUN**.

Localized identifiers were another edge case. Chinese topic IDs had to survive URL encoding and route decoding without weakening validation.

The central product challenge was handling uncertainty honestly. A successful query can legitimately return zero videos. The tool preserves that result rather than filling the interface with demonstration data.

## Accomplishments

- Six native, discoverable, read-only WebMCP tools.
- Real Taiwan trend results from the production competition URL.
- Safe lookup of localized Chinese topic IDs.
- Honest video empty states with no fabricated records.
- Rejection of oversized inputs and absence of management tools.
- One shared data contract for human and agent interfaces.
- Responsive desktop, tablet, and mobile validation.
- 19 test files and 235 tests passing at the final implementation checkpoint, together with TypeScript, ESLint, production build, dependency audit, and whitespace checks.

## What we learned

A trustworthy agent interface needs strict schemas, bounded inputs, explicit read-only semantics, untrusted-content warnings, safe errors, and evidence that the browser actually discovered and invoked the tools. An honest empty answer can be more valuable than an impressive-looking fake result.

## Potential impact

Content teams, researchers, and analysts can ask an agent for narrowly defined trend candidates while retaining source status, timestamps, confidence, and uncertainty. More broadly, WebMCP can turn existing websites into controlled agent-ready interfaces without replacing their human experience or exposing administrative APIs.

## What's next

Future work could add more authorized sources, richer provenance views, and user-controlled workflows. Any write capability would remain separate and require explicit human confirmation. The competition surface intentionally remains read-only.

## Built with

WebMCP, TypeScript, React, Vite, React Router, Cloudflare Pages, Cloudflare Pages Functions, Vitest, Testing Library, ESLint

## Testing instructions

1. Open https://webmcp-trend-engine-competition.pages.dev/radar-tools?lang=en in ChatGPT's in-app browser or a compatible browser with native WebMCP support.
2. Confirm that all six read-only tools are discoverable.
3. Call `search_radar_trends` with `market=TW`, `type=search_rising`, `hours=24`, `sort=rank`, and `limit=5`.
4. Pass a returned Chinese-language `topicId` to `get_radar_trend`.
5. Call `list_radar_sources`, `list_radar_markets`, and `list_radar_categories`.
6. Call `search_radar_videos`; an empty result is valid when no qualifying video signal exists.
7. Try `limit=500` and confirm that validation rejects it.
8. Confirm that no management operation is registered as a WebMCP tool.
9. In Safari, use the visible website search only. Safari native WebMCP was not tested and is not claimed.

No login or credential is required for the public judging flow.
