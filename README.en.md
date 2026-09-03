# Asia Trend Radar Read-Only WebMCP Tools

This is the isolated WebMCP 2026 competition edition. Six read-only tools turn live Asian trend signals into evidence-backed answers. Browsers without native WebMCP support can still use the visible website search on the same page.

## Public links

- English: <https://webmcp-trend-engine-competition.pages.dev/radar-tools?lang=en>
- Traditional Chinese: <https://webmcp-trend-engine-competition.pages.dev/radar-tools>
- Devpost: <https://devpost.com/software/asia-trend-radar-read-only-webmcp-tools>
- GitHub: <https://github.com/Guguproapp/webmcp-trend-engine-competition>
- Demo video: <https://youtu.be/AzmVt_3NpQE>

## Six read-only WebMCP tools

- `search_radar_trends`: search trend signals with typed market, category, time, confidence, source, and sorting inputs.
- `get_radar_trend`: retrieve one topic and its supporting source evidence.
- `search_radar_videos`: search video signals and return an honest empty result when no qualifying data exists.
- `list_radar_sources`: inspect source availability and health.
- `list_radar_markets`: list supported markets and their enabled state.
- `list_radar_categories`: list normalized categories.

All six tools are read-only. They provide no data mutation, account login, token access, scheduling, membership, payment, publishing, or management operation. Strict schemas reject extra fields and oversized requests such as `limit=500`; no administration endpoint is registered as a WebMCP tool.

## Live sources and limitations

- The competition edition uses its own server-side read-only Radar channel. Credentials remain in Cloudflare encrypted Secrets and are never exposed to the frontend or tool responses.
- GDELT news is retrieved over HTTPS only. The service stores metadata and public evidence URLs, never article bodies. An HTTPS failure never falls back to HTTP and never creates new GDELT evidence or snapshots. The product shows the last securely acquired data as delayed when available, otherwise an honest failed empty state.
- YouTube uses an authorized server-side API only. Limited coverage is never presented as complete market coverage.
- Google Trends, Threads, Meta, and other platforms remain disabled until appropriate official access exists. Official-site assistance is not described as a full-platform automated API.
- News volume is not presented as search volume, views, likes, or comments. A real growth rate requires a second reliable snapshot.
- Live data changes. Empty, delayed, stale, and failed states are reported honestly rather than replaced with mock records.

## Run locally

Requirements: Node.js 22 or later and npm 10 or later.

```bash
npm ci
npm test
npm run typecheck
npm run lint
npm run build
npm audit --audit-level=high
npm audit signatures
git diff --check
npx wrangler pages dev dist
```

The public repository contains example environment-variable names only. Authorized credentials belong in Cloudflare Pages encrypted Secrets or untracked local configuration, never browser variables, source files, commits, screenshots, or issues.

## Security and data boundary

- `TREND_DB` is a Cloudflare D1 binding, not a frontend environment variable.
- The production build scans for secret names, demo records, out-of-scope routes, and modules.
- External URLs must be public HTTPS links without credentials, fragments, sensitive query parameters, or private access grants.
- Public read-only endpoints reject unsupported methods; unauthorized management requests fail without reflecting credentials.
- HTML, `robots.txt`, and response headers request no indexing. Noindex is not authentication or access control.

## Challenge work and product isolation

The underlying trend-discovery product, source pipeline, evidence model, filters, and responsive interface predated the challenge. Challenge-period work added the isolated checkout, six native tool registrations, strict schemas, a read-only Radar adapter, safe browser fallback, Chinese topic-ID handling, the English judging interface, and competition-specific evidence.

This repository does not write back to product A, original product B, or any other Radar project. It contains none of those products' login, membership, payment, media generation, platform publishing, administration, or credentials. See [PREEXISTING_WORK.md](docs/competition/webmcp-2026/PREEXISTING_WORK.md) and [NEW_WORK_LOG.md](docs/competition/webmcp-2026/NEW_WORK_LOG.md) for the auditable boundary.

## Verification evidence

- 21 test files and 317 tests pass.
- TypeScript, ESLint, production build, high-severity dependency audit, package signatures, and `git diff --check` pass.
- All six tools were discovered and invoked in a compatible in-app browser. Safari validated the normal website fallback only; native Safari WebMCP is not claimed.
- Competition evidence covers five Taiwan records over 24 hours, a Chinese topic ID, sources/markets/categories, an honest empty video result, oversized-limit rejection, and the absence of management tools.

Evidence:

- [Tool specification](docs/competition/webmcp-2026/RADAR_TOOLS_SPEC.md)
- [Tool contracts](docs/competition/webmcp-2026/TOOL_CONTRACTS.md)
- [Security model](docs/competition/webmcp-2026/SECURITY_MODEL.md)
- [Browser validation](reports/webmcp-radar-tools/BROWSER_VALIDATION.md)
- [Test evidence](reports/webmcp-radar-tools/GREEN_TEST_EVIDENCE.txt)

## License

Released under the [MIT License](LICENSE).
