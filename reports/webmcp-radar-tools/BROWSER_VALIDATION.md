# WebMCP 雷達工具瀏覽器驗收

## Recovery status｜2026-09-03

- 恢復工作包：`WP-WEBMCP-CLOSEOUT-RECOVERY-2026-09-03-02`。
- 唯一 Safari 執行者：`/root`；`2026-09-03T14:28:44+08:00` 取得租約後嘗試建立新 Private Window，但 Mac 已鎖定，系統拒絕操作。狀態為 `WAITING FOR RESOURCE`，沒有讀取或接管既有視窗。
- 下方 2026-09-03 Safari 一般網站結果保留為歷史紀錄，但目前不能作為最終乾淨封關證據；現況為 `WAITING FOR CLEAN SESSION`。
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
- Safari 一般網站安全降級、同條件搜尋 5 筆與重新整理：`HISTORICAL PASS`；等待乾淨 Private Window 重驗後才能恢復最終 `PASS`。
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

## Historical snapshot｜2026-09-02 本機驗收

以下內容保留當時的本機狀態；其中「Secret 未設定／真實資料 BLOCKED／Safari NOT RUN」已由上方 2026-09-03 current evidence 取代，不代表目前狀態。

日期：2026-09-02（台北時間）  
入口：`http://127.0.0.1:8792/radar-tools`

## 原生 WebMCP

- ChatGPT 內建瀏覽器真正發現六個唯讀工具：PASS。
- 頁面狀態顯示「6 個唯讀工具已就緒」：PASS。
- `limit=500` 原生工具呼叫遭拒：PASS。
- 嘗試呼叫未註冊的排程管理工具遭拒：PASS。
- 真實資料呼叫：2026-09-02 當時為 BLOCKED；當時尚未設定比賽版專用伺服器 Secret，且未借用原版 B 或雷達管理秘密。此限制已由 2026-09-03 current evidence 解除。

## 一般網站備援

- 搜尋表單可操作：PASS。
- 缺少Secret時顯示安全中文錯誤，不白畫面、不顯示假資料：PASS。
- 深層路由直接載入及重新整理：PASS。
- Console：0 error、0 warning。

## 響應式

| 尺寸 | 水平溢出 | 最小可見控制高度 | WebMCP狀態 | 結果 |
|---|---:|---:|---|---|
| 1440×900 | 無 | 44px | 6工具就緒 | PASS |
| 768×1024 | 無 | 44px | 6工具就緒 | PASS |
| 390×844 | 無 | 44px | 6工具就緒 | PASS |

手機底部導覽固定於畫面底部；「更多」選單完整顯示在導覽上方，未遮住選單內容。

截圖：

- `evidence/webmcp-radar-tools/01-radar-desktop.png`
- `evidence/webmcp-radar-tools/02-radar-tablet.png`
- `evidence/webmcp-radar-tools/03-radar-mobile.png`

Safari：2026-09-02 當時為 NOT RUN；沒有用一般瀏覽器自動化冒充原生 WebMCP。2026-09-03 已完成 Safari 一般 UI 安全降級驗證，Safari 原生 WebMCP 仍為 NOT RUN。
