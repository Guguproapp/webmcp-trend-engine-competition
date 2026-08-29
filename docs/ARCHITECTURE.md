# B 版真實熱門情報架構

## 產品線邊界

| 版本 | 分支 | 狀態 |
|---|---|---|
| A 版 | `internal/operator-console` | 封存並獨立續作 |
| B 版 | `product/trend-discovery-mvp` | 對外熱門情報產品 |

B 版不註冊或打包 A 版帳號、授權、影音、發布及金流頁面。

## 資料流與責任

```text
React Presentation
  → TrendDiscoveryService
  → ApiTrendSourceProvider
  → 同網域 Pages Functions /api
  → GDELT／YouTube Provider
  → 主題合併與 TrendScoreCalculator 1.0.0
  → D1TrendRepository（TREND_DB）

爆款影音搜尋 Presentation
  → VideoDiscoveryService
  → VideoCandidateRepository
  → LocalVideoCandidateRepository（B版專用命名空間）

地區搜尋偏好 Presentation
  → RegionalSearchPreferencesRepository
  → LocalRegionalSearchPreferencesRepository（獨立、向後相容的B版命名空間）

平台官方搜尋／合法搜尋引擎頁
  → 使用者在官方頁面選擇候選
  → 回到熱門引擎貼入網址
  → HTTPS與官方主機驗證／正規化／重複合併
```

- `domain`：`TrendTopic`、市場地區、情報類型、八平台、YouTube內容形式、來源證據、資料信心、增速基準狀態與既有評分規則。
- `application`：服務流程與可替換的 `TrendSourceProvider`、八平台內容Provider、`WebSearchProvider`、影音候選及地區搜尋偏好Repository邊界。
- `infrastructure`：前端同網域 API Adapter、瀏覽器偏好與影音候選Repository、未授權平台的空結果Provider；正式建置不匯入展示 Provider。
- `functions/_shared`：伺服器提供者、事件合併、快照評分、更新鎖及 D1 Repository。
- `presentation`：真實資料狀態、精選、搜尋、詳情、觀察、排除、來源狀態及響應式導覽。

## 快取與更新

1. 新鮮資料直接從 D1 回傳。
2. 資料過期或資料庫為空時，取得 `trend_refresh_locks` 更新鎖。
3. 鎖持有者呼叫外部來源、合併事件、建立快照並批次寫入。
4. 其他請求取得最近一次成功結果；來源失敗不切回展示題目。
5. 每個提供者的嘗試、成功、筆數、錯誤與下次重試時間寫入 `trend_provider_runs`。

## 真實增速與證據不足

第一次取得只建立基準，`growthStatus=baseline_pending` 且畫面顯示「正在建立增速基準」。第二次以相同主題識別碼的前次快照與經過時間計算速率差。單一來源、單次快照或完整度不足時，主題維持「證據不足／資料蒐集中」，不顯示虛構高潛力。

## 安全邊界

- 外部 API 金鑰只存在 Pages Functions 加密秘密，不進入 Vite。
- 公開按鈕只讀取伺服器快取；強制更新需 `REFRESH_ADMIN_TOKEN`。
- 新聞只保存索引欄位，不保存或轉載全文。
- 原始外部連結以新分頁開啟並使用 `rel="noopener noreferrer"`。
- `scripts/verify-public-build.mjs` 掃描 A 版識別、展示題目及秘密變數名稱。
- 使用者貼入網址不由伺服器抓取；只接受八平台HTTPS官方主機，避免伺服器端請求偽造與危險協定。
- Facebook、Instagram及TikTok未取得正式權限時只回傳空結果；人工資料標示未驗證且不直接加入熱點分數。
- GDELT只屬新聞佐證，不能產生搜尋熱度；雙重爆紅必須同時具有可靠搜尋訊號與可靠影音訊號。
- YouTube長影音與Shorts短影音共用平台識別碼，但比較基準依內容形式隔離。
