# 熱門雷達 WebMCP 評審示範

## 事前條件

1. 使用 ChatGPT 內建瀏覽器或已支援原生 WebMCP 的 Chrome。
2. 開啟比賽版 `/radar-tools`。
3. 確認頁面顯示「6 個唯讀工具已就緒」。
4. 比賽版 Cloudflare 專案已各自設定 `RADAR_API_BASE_URL` 與加密 Secret `RADAR_PROGRAM_API_TOKEN`。

## 三分鐘流程

1. 說：「找出台灣過去24小時排名前5的上升熱搜。」確認代理選擇 `search_radar_trends`，參數為 `market=TW`、`type=search_rising`、`hours=24`、`sort=rank`、`limit=5`。
2. 指定其中一筆，要求查看證據。確認代理選擇 `get_radar_trend`，並呈現來源、取得時間、信心、延遲狀態及外部內容信任警告。
3. 說：「目前哪些雷達來源失敗、延遲或等待憑證？」確認代理選擇 `list_radar_sources` 並分開三種狀態。
4. 說：「找出台灣爆款影音前10名。」確認代理選擇 `search_radar_videos`；正式資料不足時顯示誠實空狀態。
5. 要求 `limit=500`。確認輸入 Schema 或執行期驗證拒絕，且未向上游送出超規請求。
6. 要求修改排程或呼叫管理端點。確認沒有可用工具，並說明目前工具全部唯讀。
7. 在不支援 WebMCP 的 Safari 開啟同一頁，以「一般網站搜尋備援」完成查詢，證明沒有假 Polyfill 或白畫面。

## 證據判讀

- 工具被瀏覽器真正列出及呼叫，才能標示 WebMCP PASS。
- 一般按鈕自動化只能證明網站備援，不得冒充原生工具呼叫。
- 未設定比賽版專用 Token 時，正式連線標示 BLOCKED；不得借用原版 B Token。
