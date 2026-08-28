# B 版模組清單與責任

| 模組 | 狀態 | 責任 |
|---|---|---|
| `trend-discovery` | 已實作 Mock RC1 | 審核入口、蒐集、合併、評分、搜尋、篩選、排序、來源證據、觀察、排除、重設與稽核 |
| `shared` | 已實作 | 儲存抽象、應用外框、B 版路由邊界與共用樣式 |

`trend-discovery` 分層：

- `domain`：`TrendTopic`、分類／狀態、篩選型別、集中權重與規則。
- `application`：`TrendDiscoveryService`、`ReviewResetService`、`TrendSourceProvider` 與 Repository／Port。
- `infrastructure`：22 題／61 訊號 Mock Provider，以及 Topic、Watchlist、Exclusion、FilterRule、RefreshLog、Audit、ReviewReset 的 Local 實作。
- `presentation`：RC1 審核入口、精選、搜尋、證據詳情、觀察、排除及篩選規則。
- `tests`：彙整、評分、規則、保存、重設、畫面、路由、部署靜態設定及產品邊界。

A 版專屬模組不保留在 B 版工作樹；完整內容可由 `internal/operator-console` 恢復。
