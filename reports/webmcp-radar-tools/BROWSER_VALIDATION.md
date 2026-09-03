# WebMCP 雷達工具瀏覽器驗收

## Chinese UX P1｜2026-09-03 16:35–16:40

- 驗證基準：`WP-WEBMCP-CHINESE-UX-P1-2026-09-03-03`；本機重新執行 `npm run build` 後，以同一份 `dist` Production Build 驗收三尺寸。這批新 UI 尚未部署，不冒充 canonical 已上線畫面。
- 1440×900：PASS；首屏可見價值主張、六項工具用途、台灣近 24 小時前 5 名快速搜尋與主要條件，`scrollWidth=clientWidth=1440`。
- 768×1024：PASS；側欄保留可辨識文字與 active 狀態，主要搜尋條件在首屏，`scrollWidth=clientWidth=768`。
- 390×844：PASS；首屏可見價值主張、六項用途及快速搜尋，底部固定為「雷達／熱門／搜尋／更多」，觀察清單可由更多選單一鍵到達，`scrollWidth=clientWidth=390`。
- 深層網址：PASS；本機與 canonical 均直接開啟 `/radar-tools`，重新整理後仍回到六工具頁。
- 原生 WebMCP：PASS；canonical 在 Codex 內建瀏覽器發現六工具並逐一呼叫。`TW/search_rising/24h/rank/limit=5` 回傳 5 筆；中文 `topicId=TW:何妤玟` 回傳 1 筆；影音回傳誠實空資料 0 筆；來源／市場／分類為 14／16／16 筆；`limit=500` 被拒絕；管理工具不存在。
- Safari 新 UI：`NOT RUN`；本輪新 UI 未部署，不以既有 canonical 畫面冒充新介面。既有部署的 Safari 網站備援仍以本任務先前保存的乾淨 Private Window 證據 07–09 為 `PASS`；Safari 原生 WebMCP 維持 `NOT RUN`。

新證據（未覆蓋舊圖）：

- `evidence/webmcp-radar-tools/10-chinese-ux-desktop-local-20260903.png` — SHA-256 `e5c25fa818f4d96c20c00ecb326235c6f38e25144d4e6107df6f40b4120c1f08`
- `evidence/webmcp-radar-tools/11-chinese-ux-tablet-local-20260903.png` — SHA-256 `488b934c81cf3676b673ec666574745b34b4044bba36475dd9a4fa6ed38957df`
- `evidence/webmcp-radar-tools/12-chinese-ux-mobile-local-20260903.png` — SHA-256 `5230100ea5a4e35750efcf528554b86439ff1dad61340235dbc7583e4911ebc3`
- `evidence/webmcp-radar-tools/13-chinese-ux-validation-20260903.json` — SHA-256 `49b9e621e04300f91073e533c7baab3507eb823f76eb150675e0669924808d85`

## Recovery status｜2026-09-03

- 恢復工作包：`WP-WEBMCP-CLOSEOUT-RECOVERY-2026-09-03-02`。
- 唯一 Safari 執行者：`/root`；`2026-09-03T14:28:44+08:00` 第一次嘗試時系統回報 Mac 已鎖定，執行者立即停止。宗億確認 Mac 未上鎖後，於 15:43–15:45 成功建立本任務全新的 Private Window，全程只使用核准 hostname，沒有讀取或接管既有視窗。
- Safari 一般網站乾淨重驗：`PASS`；正式 `/radar-tools`、台灣／上升熱搜／24 小時／前 5 筆真實搜尋、爆款影音誠實空狀態及深層網址重新整理均通過。
- ChatGPT Codex 內建瀏覽器的原生 WebMCP、三尺寸與 Console 證據不依賴該 Safari 工作階段，維持原判定。
- Safari 原生 WebMCP 固定為 `NOT RUN`。

## Current evidence｜2026-09-03 技術與證據封關

驗證時間：2026-09-03 09:42–09:48（Asia/Taipei）

Canonical：`https://webmcp-trend-engine-competition.pages.dev/radar-tools`

既有部署快照：`https://50ed96a4.webmcp-trend-engine-competition.pages.dev/radar-tools`

應用程式基準 HEAD：`cb9fc8f529d435e6899b400d9729995489287301`

### 原生 WebMCP

- ChatGPT Codex 內建瀏覽器真正發現六個唯讀工具：PASS。
- 六個工具逐一實際呼叫：PASS。
- `search_radar_trends`：PASS；`market=TW`、`type=search_rising`、`hours=24`、`sort=rank`、`limit=5`，真實結果 `actualCount=5`。
- `get_radar_trend`：PASS；中文 `topicId` `TW:南電` 回傳 1 筆。
- `search_radar_videos`：PASS；真實空資料 `actualCount=0`，未補展示資料。
- `list_radar_sources`：PASS；14 筆，包含成功、等待憑證、失敗與停用狀態。
- `list_radar_markets`：PASS；16 筆。
- `list_radar_categories`：PASS；16 筆。
- `limit=500`：PASS；原生輸入驗證拒絕，未送出超規請求。
- 管理工具未註冊：PASS；Adapter allowlist 不含管理路徑：PASS。
- 真正熱門雷達管理 API 直接呼叫：NOT RUN；本輪明確禁止操作管理端。

### 一般網站與 Safari

- 一般網站搜尋「台灣／上升熱搜／24 小時／排名／5 筆」：PASS；顯示 5 筆真實結果。
- 爆款影音空狀態：PASS；畫面誠實顯示目前沒有符合條件的結果。
- 來源狀態：PASS；顯示 14 筆並分開成功、等待憑證、失敗與停用。
- `/radar-tools` 深層網址直接載入及重新整理：PASS；URL 不變、六工具頁面恢復。
- Console：0 error、0 warning。
- Safari 一般網站安全降級、同條件搜尋 5 筆與重新整理：PASS；2026-09-03 15:43–15:45 於全新 Private Window 重驗。
- Safari 爆款影音空狀態：PASS；顯示 0 筆與「目前沒有符合三維條件的 YouTube 資料」，沒有用假結果補滿。
- Safari 專屬 Console：NOT RUN；Safari 未啟用開發者選單，沒有變更瀏覽器設定。Codex 內建瀏覽器 Console 仍為 0 error、0 warning。
- Safari 原生 WebMCP：NOT RUN；Safari 只驗證一般網站 UI，不冒充原生工具。

### 響應式

| 尺寸 | `scrollWidth` / `clientWidth` | 水平溢出 | 最小可見控制高度 | 結果 |
|---|---:|---:|---:|---|
| 1440×900 | 1440 / 1440 | 無 | 44px | PASS |
| 768×1024 | 768 / 768 | 無 | 44px | PASS |
| 390×844 | 390 / 390 | 無 | 44px | PASS |

新證據（未覆蓋舊圖）：

- `evidence/webmcp-radar-tools/04-closeout-desktop-20260903.png` — SHA-256 `98fd26aa98c273fb8426b303446fb3c8406574cd7d8ebf0b77962155763c6f3b`
- `evidence/webmcp-radar-tools/05-closeout-tablet-20260903.png` — SHA-256 `007d72b85a8d2c58f0760e3cf687c6f586ae776064010ac47adce550c8086417`
- `evidence/webmcp-radar-tools/06-closeout-mobile-20260903.png` — SHA-256 `71d819b72cf4938c1e5b3860d62c15eb7503deaa7e5222da4b0756b6e7a4498e`
- `evidence/webmcp-radar-tools/07-safari-private-search-20260903.jpeg` — 1102×768；SHA-256 `ca9c85eb4a26d3794899cfb8335a58edf42f8a1b5f1e8bf6215d88f5c6ee4d3e`
- `evidence/webmcp-radar-tools/08-safari-private-video-empty-20260903.jpeg` — 1102×768；SHA-256 `d967d5cd96307bd0a0b95c65bc5c6ef04eab1b55833092eace79954ba22e7d0b`
- `evidence/webmcp-radar-tools/09-safari-private-deep-reload-20260903.jpeg` — 1102×768；SHA-256 `ca02975f5cf998a67d48f2aa4e21179902c617ae59cdd27a4400821c8541f052`

## 過往快照

2026-09-02 的前置環境快照仍可由 Git 歷史稽核；現行驗收文件只保留已完成真實連線後的有效結果，避免舊環境狀態被誤認為目前狀態。

## English interface deployment｜2026-09-03 20:04–20:13

- 驗證基準：`935df99b508d3235ddc3ee12e9beb09e5eddc2a4`；Branch `competition/webmcp-2026`。
- Canonical：`https://webmcp-trend-engine-competition.pages.dev/radar-tools?lang=en`。
- 部署快照：`https://dbdfe5e6.webmcp-trend-engine-competition.pages.dev/radar-tools?lang=en`。
- 英文深層網址與 reload：`PASS`；URL、`<html lang="en">` 與 `Asia Trend Radar Tools | Trend Engine` 均保持。
- 原生 WebMCP：`PASS`；Codex 內建瀏覽器發現六工具並逐一呼叫。台灣 24 小時前 5 筆為 5；中文 `TW:退休金` 詳情為 1；影音為誠實空資料 0；來源／市場／分類為 14／16／16；`limit=500` 被拒絕；無管理工具。
- Safari：英文 UI、同條件 5 筆網站搜尋、深層 reload 均 `PASS`；Safari 顯示 `WebMCP unavailable — website search still works`，原生 WebMCP 因此為 `NOT RUN`。
- 1440×900、768×1024、390×844：`PASS`；均無水平溢出，平板與手機 CTA 位於首屏。
- 截圖 SHA-256：desktop results `918c425de37bc75997e24033585f5ef8e616dc8e852fc7dd83ccf91959869add`；tablet `a7e2c7038c1a64efb7f90409554251b26ba6a6512a0d61bf0a09e79e7cca7852`；mobile `457e1f76bc4358d06ec67b0bfc601af810d9c066efd475b6d0b91e6dab846aea`；Safari `b787c67bab872c3c92ed38937526a738b1d7ae91a7be4daea49bd25d597345ee`。

## Security deployment validation｜2026-09-04 00:47–00:56

- 驗證基準：`e6d593a1bedc7c8aa739f5484ad0afffda943cd9`。
- Deployment：`1c151157-a5a3-4e39-8c11-a0155a7f7f12`；快照 `https://1c151157.webmcp-trend-engine-competition.pages.dev`。
- 中文／英文 canonical 深層網址：`PASS`，HTTP 200。
- 內建瀏覽器原生工具發現：`PASS`，六個工具均為 `readOnlyHint=true`。
- 一般網站台灣近 24 小時前 5 筆：`PASS`，顯示 5 筆真實資料。
- 敏感網址 UI：`PASS`，輸入含明確假 `access_token` 的 YouTube 網址後，欄位清空、焦點返回、指定中英文警告顯示，假值未出現在 DOM。
- Safari 新安全版：`NOT RUN`；部署後原生工具逐一呼叫亦為 `NOT RUN`。
