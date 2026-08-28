# B 版未來整合接入點

## 正式熱門來源

Threads、YouTube、Google Trends、RSS與客戶授權來源應分別實作 `TrendSourceProvider`，再由 `TrendDiscoveryService` 統一合併與評分。正式來源必須在伺服器執行、遵守官方條款並保留來源時間、信心與錯誤紀錄。

## 未來資料庫

- `TrendTopicRepository` → `trend_topics` 與 `trend_source_items`。
- `TrendWatchlistRepository` → `trend_watchlist_entries`。
- `TrendExclusionRepository` → `trend_exclusions`。
- `TrendFilterRuleRepository` → `trend_filter_rules`。
- `TrendRefreshLogRepository` → `trend_refresh_logs`。
- `TrendAuditPort` → append-only `trend_audit_logs`。

在 `src/app/services.ts` 替換 Infrastructure 注入即可；Presentation與Domain不變。

以上僅為接入點說明，本輪不實作正式來源或資料庫。
