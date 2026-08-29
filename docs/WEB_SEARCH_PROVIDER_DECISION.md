# 自動網頁搜尋供應商決策

查核日期：2026-08-29。本工作包不購買、不綁信用卡，也不啟用任何自動搜尋供應商；正式價格與條款在採購當日仍須重新確認。

| 方案 | 目前費用／配額 | 資料範圍 | 主要限制 | 本輪決策 |
|---|---|---|---|---|
| 使用者開啟一般搜尋頁 | 免費，無系統API配額 | 使用者可見的公開搜尋結果 | 系統不自動取得結果；使用者需貼回網址 | 已採用，風險最低 |
| Google Custom Search JSON API | 既有客戶每日100次免費，超出每千次5美元、每日上限一萬次 | 可程式取得網頁與圖片搜尋結果 | 已關閉新客戶，並預定2027-01-01停止服務 | 不採用 |
| Brave Search API | 搜尋每千次5美元，每月5美元免費額度 | 網頁、新聞、圖片、影片等獨立索引 | 即使免費方案也要求信用卡驗證；需確認保存與展示條款 | 待宗億決定，目前不開通 |
| SerpApi | 免費250次／月；付費自每月25美元、1000次起 | Google等搜尋結果的結構化資料 | 第三方搜尋結果供應商；正式使用須審查條款、司法區及資料保存權 | 待法務與成本評估，不開通 |
| Microsoft Bing Search API | 已於2025-08-11退役 | 不再提供既有Web Search API | 無法新申請，不適合作為新產品來源 | 不採用 |

官方參考：

- Google：<https://developers.google.com/custom-search/v1/overview>
- Brave：<https://brave.com/search/api/>
- SerpApi：<https://serpapi.com/pricing>
- Microsoft退役公告：<https://learn.microsoft.com/en-us/lifecycle/announcements/bing-search-api-retirement>

## 建議

公開測試期間維持「搜尋頁輔助＋安全網址匯入」。若外部測試證明自動搜尋確實提高命中率，再由宗億選擇是否評估Brave或其他有明確商業條款的供應商。任何需要信用卡或付費方案的開通都必須另行取得宗億同意。
