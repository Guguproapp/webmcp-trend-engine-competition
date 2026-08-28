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

## 本輪唯一實作

`MockPlatformAuthorizationProvider` 只回傳站內網址與模擬狀態，不呼叫外部平台，不建立帳號，不產生或保存真實 Token。

Mock callback 結果：

- `success` → `authorized` 並執行模擬連接測試。
- `cancelled` → `ready_for_authorization`。
- `permission_incomplete` → `permission_incomplete`。
- `token_expired` → `token_expired`。
- `platform_error` → `connection_error`。
