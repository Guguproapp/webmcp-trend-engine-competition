# WebMCP 雷達評審情境

## Recovery status｜2026-09-03

Safari 一般網站已於 2026-09-03 15:43–15:45 在本任務全新的 Private Window 完成乾淨重驗；原生 WebMCP 與非 Safari 證據不受影響。Safari 原生 WebMCP 與 Safari 專屬開發者 Console 均為 `NOT RUN`。

## Current evidence｜2026-09-03

| 情境 | 原生 WebMCP／契約結果 | 真實資料結果 |
|---|---|---|
| 台灣 24 小時前 5 名上升熱搜 | PASS：`search_radar_trends` 已實際呼叫 | PASS：`actualCount=5`，外部標題視為未受信任內容 |
| 中文 `topicId` 詳情 | PASS：`get_radar_trend` 已實際呼叫 | PASS：`TW:南電` 回傳 1 筆 |
| 列出來源狀態 | PASS：`list_radar_sources` 已實際呼叫 | PASS：14 筆，可區分成功、等待憑證、失敗與停用 |
| 列出市場與分類 | PASS：兩個工具均已實際呼叫 | PASS：市場 16 筆、分類 16 筆 |
| 台灣爆款影音前 10 名 | PASS：`search_radar_videos` 已實際呼叫 | PASS：真實空資料 `actualCount=0`，未補假影片 |
| `limit=500` | PASS：原生輸入與 client/server 契約拒絕 | PASS：未向上游送出超規請求 |
| 修改排程或管理工具 | PASS：沒有註冊管理工具，Adapter allowlist 不含管理路徑 | 真正管理 API 直接呼叫：NOT RUN（本輪禁止操作管理端） |
| 日本增長最快最多 10 筆 | NOT RUN：非本輪必做情境 | NOT RUN |

一般網站備援：PASS；canonical `/radar-tools` 同條件取得 5 筆真實結果。Safari 全新 Private Window 同條件搜尋、影音誠實空狀態及 `/radar-tools` 重新整理均為 PASS；Safari 原生 WebMCP 為 NOT RUN。

## Historical snapshot｜2026-09-02

以下表格保留當時尚未設定專用 Secret 的狀態；目前正式狀態以上方 2026-09-03 current evidence 為準。

| 情境 | 自動契約結果 | 真實原生 WebMCP 結果 |
|---|---|---|
| 台灣24小時前5名上升熱搜 | PASS：參數與limit已測試 | 2026-09-02 當時 BLOCKED；已由 2026-09-03 current evidence 取代 |
| 日本增長最快最多10筆 | PASS：來源、時間、信心欄位已測試 | 2026-09-02 當時 BLOCKED；已由 2026-09-03 current evidence 取代 |
| 列出失敗、延遲、等待憑證 | PASS：三種狀態可區分 | 2026-09-02 當時 BLOCKED；已由 2026-09-03 current evidence 取代 |
| 台灣爆款影音前10名 | PASS：無資料回傳誠實空陣列 | 2026-09-02 當時 BLOCKED；未產生假影片，已由 current evidence 取代 |
| `limit=500` | PASS：客戶端與伺服器端皆拒絕 | PASS：原生WebMCP實際拒絕，未向上游送出 |
| 修改排程或管理端點 | PASS：不存在管理工具，代理端點白名單不含管理設定 | PASS：原生工具快照不存在管理工具，呼叫遭拒 |

歷史備援驗證：`document.modelContext` 不存在時仍可操作；2026-09-02 本機缺少專用 Secret 時顯示安全錯誤，不白畫面、不載入展示資料。正式資料的目前結果以上方 2026-09-03 current evidence 為準。
