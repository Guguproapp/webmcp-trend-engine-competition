# Provider／Adapter 介面

第三方平台一律由 Application Port 隔離，React 頁面不能直接呼叫 Meta、Google、TikTok、生成式 AI 或金流 API。

## 已提供介面

- `PlatformAuthorizationProvider`：授權網址、callback、刷新、撤回、狀態檢查、連接測試。
- `PlatformPublisher`：草稿、上傳、排程、狀態、重試、撤回。
- `TrendSourceProvider`：關鍵字搜尋、熱門項目、熱度與成長。
- `ContentGenerationProvider`：主題、腳本、標題、說明、Tag、CTA。
- `MediaGenerationProvider`：圖片、配音、短影音片段。
- `VideoRenderProvider`：字幕、聲音、版本轉檔、工作狀態。
- `BillingProvider`：訂閱、付款、定期通知、取消、扣款失敗。

## 已實作的 Mock Provider

`MockPlatformAuthorizationProvider` 只回傳站內網址與模擬狀態，不呼叫外部平台，不建立帳號，不產生或保存真實 Token。

Mock callback 結果：

- `success` → `authorized` 並執行模擬連接測試。
- `cancelled` → `ready_for_authorization`。
- `permission_incomplete` → `permission_incomplete`。
- `token_expired` → `token_expired`。
- `platform_error` → `connection_error`。

`MockTrendSourceProvider` 回傳明確標示為 Mock 的來源訊號，不連線、不爬蟲、不冒充即時熱門新聞。Provider 邊界已可替換為：

- Threads Keyword Search API。
- YouTube Data API。
- Google Trends。
- 新聞 RSS。
- 客戶授權帳號資料。
- 客戶指定競爭者與關鍵字。

正式 Provider 只負責取得並正規化來源訊號；合併、評分、自然事件門檻與狀態判定仍由 `TrendDiscoveryService`／Domain 處理，避免各來源產生不同標準。
