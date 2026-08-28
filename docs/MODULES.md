# B 版模組清單與責任

| 模組 | 狀態 | 責任 |
|---|---|---|
| `trend-discovery` | 真實來源候選版 | 真實蒐集、合併、快照評分、搜尋、篩選、證據、觀察與排除 |
| `functions/api` | 已實作 | 同網域讀取、來源狀態與受保護管理更新 API |
| `functions/_shared` | 已實作 | GDELT／YouTube Provider、D1、鎖、合併與快照計算 |
| `shared` | 已實作 | 應用外框、四項手機導覽、B版路由邊界與共用樣式 |

測試用展示 Provider 只由測試環境匯入；Production 入口使用 `ApiTrendSourceProvider`，建置掃描會拒絕22個展示題目進入產物。

A 版專屬模組不在 B 版工作樹；完整內容由 `internal/operator-console` 與封存 Tag 恢復。
