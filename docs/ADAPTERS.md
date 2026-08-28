# B 版 Trend Provider／Adapter

React 頁面不得直接呼叫外部熱門來源。所有來源訊號必須通過 `TrendSourceProvider` 正規化，再由 `TrendDiscoveryService` 合併與評分。

## 目前實作

`MockTrendSourceProvider` 回傳明確標示為 Mock 的來源訊號，不連線、不爬蟲、不冒充即時熱門新聞。

## 預留來源

- Threads Keyword Search API。
- YouTube Data API。
- Google Trends。
- 新聞 RSS。
- 客戶授權資料來源。
- 客戶指定競爭者與關鍵字。

正式 Provider 只負責取得與正規化來源訊號；合併、評分、自然事件門檻、高風險及證據不足判定仍由 Application／Domain 統一處理。

本輪不實作任何正式來源。
