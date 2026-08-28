# B 版後續正式來源接入點

- YouTube：宗億本人建立 Google Cloud 專案、啟用 YouTube Data API v3、建立受限金鑰，再由 Cloudflare後台新增加密秘密 `YOUTUBE_API_KEY`。金鑰不得貼到對話、Git或前端。
- Google熱門搜尋趨勢：取得官方 API Alpha 資格後才實作停用邊界；不得以 pytrends 或未授權端點代替。
- Threads：取得官方關鍵字搜尋權杖與必要權限後實作；不得登入爬蟲。
- 其他社群：只接受官方API及合法授權來源。

未來若加入多人偏好、會員或管理後台，應另建伺服器端 Repository；本輪的觀察、排除及篩選偏好仍只保存在目前瀏覽器。
