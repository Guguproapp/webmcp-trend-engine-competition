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

## 四平台影音來源

- YouTube：沿用正式API與D1快照；`/trends/video-search`只搜尋已由伺服器合法取得的快取，不讓公開使用者任意消耗外部配額。
- Facebook：`PlatformContentProvider`邊界、官方搜尋與網址匯入已完成；未取得Meta公開內容權限前回傳空集合。
- Instagram：`PlatformContentProvider`邊界、專業帳號／公開內容狀態、官方搜尋與Reels網址匯入已完成；不宣稱全平台搜尋。
- TikTok：官方搜尋、官方熱門創意中心與網址匯入已完成；目前標示官方網站輔助或使用者分享，不是全平台API。
- 網頁搜尋：`WebSearchProvider`邊界已建立但停用；目前只產生限定官方網域的搜尋入口，不抓取結果頁。

## 尚未啟用

- Google熱門搜尋趨勢：等待 [Google官方API Alpha](https://developers.google.com/search/apis/trends) 存取資格，不使用 pytrends 或網頁爬蟲。
- Threads社群討論：保留介面，等待 [Threads官方關鍵字搜尋](https://developers.facebook.com/docs/threads/keyword-search) 權限，不爬取網站。
- Facebook與Instagram正式公開內容API：等待Meta申請資料及正式審查。
- TikTok全平台自動熱門搜尋：一般商業產品目前沒有以本工作包資格啟用的正式介面。

## API Adapter

前端 `ApiTrendSourceProvider` 只呼叫同網域 `/api/trends`。來源金鑰、管理Token及D1綁定名稱都不會由API回應傳回瀏覽器。

`VideoDiscoveryService`只經由`VideoCandidateRepository`保存使用者候選。網址輸入會驗證HTTPS、官方主機、路徑與影片識別，移除可移除的追蹤參數，再以正規化網址合併重複項目；不由伺服器代抓使用者輸入網址。
