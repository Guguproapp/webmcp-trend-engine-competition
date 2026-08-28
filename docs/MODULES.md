# 模組清單與責任

| 模組 | 本輪狀態 | 責任 |
|---|---|---|
| `account-onboarding` | 已實作 | 兩種首次設定流程、平台選擇、開通進度 |
| `brand-profile` | 已實作 | 共用品牌資料、驗證、完成率、自動保存、平台預覽 |
| `platform-connections` | 已實作 Mock | 統一狀態、模擬授權、連接測試、重授權、解除、稽核 |
| `trend-discovery` | 僅介面 | 搜尋關鍵字、熱門項目、熱度與成長 |
| `content-planning` | 僅介面 | 主題、腳本、標題、說明、Tag、CTA |
| `media-generation` | 僅介面 | 圖片、配音、短影音片段生成 |
| `media-rendering` | 僅介面 | 字幕、聲音、長度與比例版本、轉檔狀態 |
| `publishing` | 僅介面 | 草稿、上傳、排程、狀態、重試、撤回 |
| `analytics` | 尚未建立程式 | 成效分析留待後續工作包，避免空骨架 |
| `billing` | 僅介面 | 訂閱、付款查詢、定期通知、取消、失敗處理 |
| `shared` | 已實作 | 平台 Registry、共用型別、Storage Adapter、共用 UI |

平台定義只存在 `src/shared/domain/platform.ts` 的 `PLATFORM_REGISTRY`，頁面不得各自硬編碼清單。
