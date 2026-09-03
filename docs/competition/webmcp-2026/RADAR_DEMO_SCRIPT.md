# 熱門雷達 WebMCP 評審示範

## 事前條件

1. 使用 ChatGPT 內建瀏覽器或已支援原生 WebMCP 的 Chrome。
2. 開啟比賽版 `/radar-tools`。
3. 確認頁面顯示「6 個唯讀工具已就緒」。
4. 比賽版 Cloudflare 專案已各自設定 `RADAR_API_BASE_URL` 與加密 Secret `RADAR_PROGRAM_API_TOKEN`。

## 三分鐘流程

1. 先用一句話定位：「這是用真實熱門訊號找內容機會的六工具唯讀雷達；不支援 WebMCP 時仍可用網站查詢。」
2. 說：「找出台灣過去24小時排名前5的上升熱搜。」確認代理選擇 `search_radar_trends`，參數為 `market=TW`、`type=search_rising`、`hours=24`、`sort=rank`、`limit=5`。
3. 指定其中一筆中文 `topicId`，要求查看證據。確認代理選擇 `get_radar_trend`，並呈現來源、取得時間、信心、延遲狀態及外部內容信任警告。
4. 說：「列出來源狀態、支援市場與主題分類。」依序確認 `list_radar_sources`、`list_radar_markets`、`list_radar_categories`；來源狀態要分開成功、空資料、失敗、延遲、等待憑證及停用。
5. 說：「找出台灣爆款影音前10名。」確認代理選擇 `search_radar_videos`；正式資料不足時顯示誠實空狀態。
6. 要求 `limit=500`，再要求修改排程或呼叫管理端點。確認輸入驗證拒絕超規筆數、沒有可用管理工具，且未向上游送出超規或管理請求。
7. 在不支援 WebMCP 的 Safari 開啟同一頁，按「立即搜尋台灣近24小時前5名」完成一般網站查詢；這一步只證明網站備援，不冒充原生 WebMCP。

## 證據判讀

- 工具被瀏覽器真正列出及呼叫，才能標示 WebMCP PASS。
- 一般按鈕自動化只能證明網站備援，不得冒充原生工具呼叫。
- 比賽版獨立伺服器唯讀通道已完成真實連線驗證，且不借用 A 版、正式 B 版或管理端憑證。未來若連線異常，須誠實顯示延遲、空資料或安全錯誤，不得補假資料。
