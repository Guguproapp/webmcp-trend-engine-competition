# 未來整合接入點

## Supabase

將既有 Local Repository 分別改成 Supabase 實作；工作包 001 包含：

- `BrandProfileRepository` → `brand_profiles`。
- `OnboardingProgressRepository` → `onboarding_progress`。
- `PlatformConnectionRepository` → `platform_connections`，只保存無敏感資訊的摘要。
- `AuditLogRepository` → append-only `audit_logs`。

在組合根 `src/app/services.ts` 改注入實作即可；Presentation 與 Domain 不變。正式 Token 應放在受 Row Level Security 與伺服器金鑰保護的獨立加密資料表，瀏覽器不可讀取。

工作包 002 可替換為：

- `TrendTopicRepository` → `trend_topics` 與 `trend_source_items`。
- `TrendWatchlistRepository` → `trend_watchlist_entries`。
- `TrendExclusionRepository` → `trend_exclusions`。
- `TrendFilterRuleRepository` → `trend_filter_rules`。
- `TrendRefreshLogRepository` → `trend_refresh_logs`。

正式來源 Provider 必須在後端執行、保留來源時間與信心，不可由頁面直接呼叫。Threads、YouTube、Google Trends、RSS 與客戶授權來源分別實作 `TrendSourceProvider`，再由 `TrendDiscoveryService` 統一合併與評分。

## Google／YouTube

新增伺服器端 `GooglePlatformAuthorizationProvider`，由後端建立 state 與 RFC 7636 S256 PKCE，callback 驗證 redirect URI、state、授權碼與必要 scope。頻道存在與發布能力須分開驗證。

## Meta／Facebook／Instagram

新增 `MetaPlatformAuthorizationProvider`，在後端處理短期／長期 Token 交換。Instagram 專業帳號、Facebook 粉絲專頁連結及必要權限需逐項檢查，不能只以 OAuth 成功判定可發布。

## TikTok

新增 `TikTokPlatformAuthorizationProvider`，遵循正式 Login Kit／Content Posting API 規範。應分開顯示帳號已授權、應用程式已獲平台審核、實際可發布三個狀態。

所有正式 Provider 需在伺服器執行並新增 callback 重放防護、Token 加密、刷新鎖、撤回同步與不可竄改的稽核紀錄。
