# WebMCP 2026 比賽版上游基準

## 正式B版來源

- 正式來源目錄：`/Users/chenzongyi/Documents/Codex/2026-08-28/codex-ai-saas-001-ai-saas/ai-trend-video-saas`
- 正式來源分支：`feature/regional-search-video-sources`
- 複製時來源HEAD：`04a34351d46c0571bc480dcda1ef83799eeb1b11`
- 複製日期與時間：`2026-08-30 12:28:04 CST（Asia/Taipei）`
- `package.json`版本：`0.4.0-rc2`
- 正式產品基準Tag：`b-trend-v0.4.0-production-trial`
- 正式B版公開網址：<https://trend-engine-app.pages.dev/>
- 舊版交付網址：<https://trend-engine-b-review.pages.dev/>（保留，未覆寫）
- 複製前正式來源工作目錄：乾淨，沒有未提交修改。

## 複製方式

使用本機Git完整複本並明確禁止硬連結：

```text
git clone --no-hardlinks <正式B版來源目錄> <WebMCP比賽版目錄>
```

複製後建立獨立分支`competition/webmcp-2026`，並移除原始`origin`。比賽版擁有自己的實體`.git`目錄，不是Git Worktree，也不共用Git物件硬連結或工作目錄。

## 複製時既有Tag

- `account-onboarding-mock-v0.1.0`
- `b-trend-review-v0.2.0-rc1`
- `b-trend-review-v0.2.0-rc2`
- `b-trend-review-v0.2.0-rc3`
- `b-trend-review-v0.3.0-rc1`
- `b-trend-review-v0.3.0-rc2`
- `b-trend-review-v0.4.0-rc1`
- `b-trend-review-v0.4.0-rc2`
- `b-trend-review-v0.5.0-rc1`
- `b-trend-v0.3.0-beta1`
- `b-trend-v0.4.0-production-trial`
- `internal-console-v0.1.0`

## 比賽基準

- 比賽工作分支：`competition/webmcp-2026`
- 比賽基準Annotated Tag：`webmcp-competition-baseline-2026-08-30`
- Tag說明：`AI Trend Engine B baseline before WebMCP competition extension`
- 中文意義：AI熱門議題引擎B版加入WebMCP比賽功能前的固定基準。

本基準只完成隔離、證據、品質及完整性驗證，不包含任何WebMCP新增功能。
