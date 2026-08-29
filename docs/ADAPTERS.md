# 真實熱門來源 Provider／Adapter

公開頁面只能透過 `TrendSourceProvider → TrendDiscoveryService → Repository → Presentation` 取得資料，不直接呼叫外部平台。

## GDELT全球新聞資料

- 官方資料說明：<https://www.gdeltproject.org/data.html>
- 介面：官方 DOC API `artlist` JSON。
- 查詢：最近24小時、台灣來源、依日期排序。
- 保存：標題、媒體網域、原始網址、發布與取得時間；不保存全文。
- 指標：報導筆數只用於新聞密度，不冒充觀看、按讚或留言。
- 目前官方 HTTPS 憑證若驗證失敗，伺服器會嘗試同一官方主機的 HTTP 公開索引並將來源標為降級；此為已知傳輸風險，不隱藏。

## YouTube影音平台

- 官方入門：<https://developers.google.com/youtube/v3/getting-started>
- 搜尋介面：<https://developers.google.com/youtube/v3/docs/search/list>
- `search.list`：`regionCode=TW`、`relevanceLanguage=zh-Hant`、`type=video`、最近24小時。
- `videos.list`：批次取得官方觀看、按讚與留言統計。
- 最多三組查詢、每組10筆，結果寫入快照後才計算真實增速。
- 金鑰只讀取 `YOUTUBE_API_KEY` 加密秘密；沒有金鑰、超過配額及暫時失敗都有獨立狀態。

## 尚未啟用

- Google熱門搜尋趨勢：等待 [Google官方API Alpha](https://developers.google.com/search/apis/trends) 存取資格，不使用 pytrends 或網頁爬蟲。
- Threads社群討論：保留介面，等待 [Threads官方關鍵字搜尋](https://developers.facebook.com/docs/threads/keyword-search) 權限，不爬取網站。
- Facebook、Instagram、TikTok：本輪不接入。

## API Adapter

前端 `ApiTrendSourceProvider` 只呼叫同網域 `/api/trends`。來源金鑰、管理Token及D1綁定名稱都不會由API回應傳回瀏覽器。
