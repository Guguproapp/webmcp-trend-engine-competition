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

## Chinese UX P1｜2026-09-03

| 情境 | 結果 |
|---|---|
| 1440×900 新中文首屏 | PASS：六項用途、快速搜尋與主要條件可見，無水平溢出 |
| 768×1024 平板導覽 | PASS：保留文字標籤與 active 狀態，無水平溢出 |
| 390×844 手機首屏 | PASS：快速搜尋可見；四格含雷達，觀察清單在更多選單，無水平溢出 |
| canonical 原生工具重驗 | PASS：六工具均可發現及呼叫，真實資料與空資料結果維持一致 |
| Safari 新 UI | NOT RUN：新 UI 未部署；既有部署的網站備援 PASS 只引用乾淨 Private Window 證據 07–09，不冒充新 UI 或原生 WebMCP |

2026-09-02 的前置環境結果保留於 Git 歷史；現行文件只列目前有效狀態。

## English deployment｜2026-09-03

| 情境 | 結果 |
|---|---|
| `/radar-tools?lang=en` 與深層刷新 | PASS：完整英文網頁殼層，`lang=en` 與英文 title 保持 |
| 台灣／上升熱搜／24 小時／前 5 筆 | PASS：原生工具與英文一般 UI 均取得真實 5 筆 |
| 中文 `topicId` 詳情 | PASS：`TW:退休金` 回傳 1 筆 |
| sources／markets／categories | PASS：14／16／16 |
| videos 無資料 | PASS：`actualCount=0`，未補展示資料 |
| `limit=500` | PASS：原生輸入驗證拒絕 |
| 管理端 | PASS：沒有暴露管理工具；管理 API 直接呼叫維持 NOT RUN |
| Safari 英文一般 UI 與網站搜尋 | PASS：真實 5 筆與 reload 通過 |
| Safari 原生 WebMCP | NOT RUN：Safari 明確顯示不支援，不冒充 PASS |

## Post-submission security deployment｜2026-09-04

| 情境 | 結果 |
|---|---|
| Production 部署 | PASS：Deployment `1c151157-a5a3-4e39-8c11-a0155a7f7f12`，Source `e6d593a` |
| 中英文深層網址 | PASS：canonical 與部署快照均 HTTP 200 |
| 原生 WebMCP 發現 | PASS：正式站發現六個唯讀工具；逐一原生呼叫本輪 NOT RUN |
| 台灣 24 小時前 5 筆 | PASS：一般網站與 API 均回傳 5 筆真實資料 |
| 中文 topicId | PASS：找到中文識別碼並完成詳情 round-trip |
| sources／markets／categories | PASS：14／16／16 |
| videos 無資料 | PASS：0 筆誠實空資料 |
| `limit=500` | PASS：HTTP 400、`invalid_query` |
| 敏感網址 | PASS：正式站拒絕、清空、回焦並顯示指定中英文警告 |
| 管理端 | PASS：無管理工具；相似網址只回 SPA HTML，不是管理 API |
| 高信心秘密掃描 | NOT FOUND：正式 API 回應 0 命中 |
| Safari 新安全版 | NOT RUN |

## Secure GDELT closeout deployment｜2026-09-04

| 情境 | 結果 |
|---|---|
| Production 部署 | PASS：Deployment `a121ff49-4889-4eed-8bcf-5bc79d616c43`，Source `71f028c` |
| GDELT HTTPS-only | PASS：明文 HTTP endpoint 與 fallback 完全移除 |
| GDELT HTTPS 失敗 | PASS：不新增證據／快照；有安全舊資料為 delayed，否則 failed 空狀態 |
| 完整回歸 | PASS：21 個測試檔、317 項測試 |
| 地區保存疲勞測試 | PASS：同一案例連續 50 次，50/50 |
| 正式網站／API 疲勞測試 | PASS：10 輪、120/120 次，最慢約 461ms |
| 原生 WebMCP | PASS：六工具發現並逐一唯讀呼叫 |
| 台灣／中文 topicId／清單／影音 | PASS：5 筆／`TW:50萬日圓`／14、16、16／0 筆誠實空狀態 |
| 三尺寸與控制高度 | PASS：1440×900、768×1024、390×844 零水平溢出；主要控制最低 44px |
| Console | PASS：中英文 0 error、0 warning |
| 套件與秘密掃描 | PASS：0 vulnerabilities；282 signatures、125 attestations；未發現秘密值 |
| Safari 本次新部署 | NOT RUN：不以內建瀏覽器結果冒充 Safari |
