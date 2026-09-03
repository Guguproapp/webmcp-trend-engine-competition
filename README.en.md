# Asia Trend Radar — Read-Only WebMCP Tools

Six safe WebMCP tools that turn live Asian trend signals into evidence-backed answers.

## Live demo

Open the English judging interface:

<https://webmcp-trend-engine-competition.pages.dev/radar-tools?lang=en>

Use ChatGPT's in-app browser or a compatible browser with native WebMCP support to discover and call the tools. Browsers without native WebMCP support can still use the visible read-only website search.

Watch the public 2:26 demo with English narration and English/Traditional Chinese captions:

<https://youtu.be/AzmVt_3NpQE>

## WebMCP tools

- `search_radar_trends`: search trend signals with typed market, category, time, confidence, source, and sorting inputs.
- `get_radar_trend`: retrieve one topic and its supporting source evidence.
- `search_radar_videos`: search video signals and return an honest empty result when no qualifying data exists.
- `list_radar_sources`: inspect source availability and operational status.
- `list_radar_markets`: list supported markets and their enabled state.
- `list_radar_categories`: list normalized categories.

All six tools are read-only. No management, scheduling, membership, payment, publishing, or data-mutation tools are exposed. Inputs use strict schemas; oversized requests such as `limit=500` are rejected.

## Challenge-period work

The underlying trend-discovery product, source pipeline, evidence model, filters, and original responsive interface existed before the challenge. After August 25, 2026, the challenge work added:

- the isolated WebMCP competition edition;
- native registration of six read-only Radar tools;
- strict tool schemas and safety annotations;
- a dedicated server-side read-only Radar adapter and allowlist;
- safe fallback behavior for browsers without WebMCP;
- localized Chinese topic-ID handling;
- English judge-facing UI;
- challenge-specific test, browser, deployment, and security evidence.

See [`docs/competition/webmcp-2026/PREEXISTING_WORK.md`](docs/competition/webmcp-2026/PREEXISTING_WORK.md) and [`docs/competition/webmcp-2026/NEW_WORK_LOG.md`](docs/competition/webmcp-2026/NEW_WORK_LOG.md) for the auditable boundary and dated commit record.

## Run locally

Requirements: Node.js 22 or later and npm 10 or later.

```bash
npm ci
npm test
npm run typecheck
npm run lint
npm run build
npx wrangler pages dev dist
```

The public repository contains example environment-variable names only. Supply your own authorized server-side credentials when testing integrations. Never place credentials in browser variables, source files, commits, screenshots, or issue reports.

## Verification snapshot

At the final implementation checkpoint:

- 19 test files and 235 tests passed;
- TypeScript, ESLint, production build, high-severity dependency audit, and whitespace checks passed;
- all six native WebMCP tools were discovered and invoked in a compatible in-app browser;
- Taiwan rising searches returned five live records during validation;
- a Chinese-language topic ID detail request passed;
- video search returned a successful honest empty result;
- `limit=500` was rejected;
- no management tool was registered;
- desktop, tablet, and mobile layouts passed without horizontal overflow;
- Safari website fallback passed; Safari native WebMCP was **NOT RUN** and is not claimed.

Live data can change. Empty, delayed, or stale states are reported honestly rather than replaced with sample records.

## License

Released under the [MIT License](LICENSE).
