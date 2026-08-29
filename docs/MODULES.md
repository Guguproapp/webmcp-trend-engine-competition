# B 版模組清單與責任

| 模組 | 狀態 | 責任 |
|---|---|---|
| `trend-discovery/domain` | 地區熱搜與八平台候選版 | 熱門主題、市場、情報類型、影音候選、內容形式、取得方式、網址安全、平台辨識與增速規則 |
| `trend-discovery/application` | 已實作 | 真實蒐集服務、三類來源Registry、影音候選服務、地區偏好、平台與網頁搜尋Provider邊界 |
| `trend-discovery/infrastructure` | 已實作 | 同網域熱門API、本機地區偏好與影音候選保存、未授權來源空結果Provider |
| `trend-discovery/presentation` | 已實作 | 精選、搜尋、證據、觀察、排除、來源狀態與`/trends/video-search` |
| `functions/api` | 已實作 | 同網域讀取、來源狀態與受保護管理更新 API |
| `functions/_shared` | 已實作 | GDELT／YouTube Provider、D1、鎖、合併與快照計算 |
| `shared` | 已實作 | 應用外框、四項手機導覽、B版路由邊界與共用樣式 |

測試用展示 Provider 只由測試環境匯入；Production 入口使用 `ApiTrendSourceProvider`，建置掃描會拒絕22個展示題目進入產物。

八平台影音候選沿用`trend-engine.video-candidates.v1`，新增欄位均為選填以讀取既有RC1資料；地區搜尋偏好使用獨立`trend-engine.regional-video-search.v1`命名空間。Presentation不直接操作Local Storage。未授權平台與搜尋引擎只提供空結果或官方網站輔助，不執行登入爬蟲或搜尋結果爬取。

A 版專屬模組不在 B 版工作樹；完整內容由 `internal/operator-console` 與封存 Tag 恢復。
