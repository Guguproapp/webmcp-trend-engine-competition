# 熱門雷達唯讀工具規格

## 目的

本規格只適用於獨立的「熱門引擎 WebMCP 比賽版」。目前正式展示面為六個唯讀熱門雷達工具，不提供觀察、排除、排程、來源設定或任何管理寫入。

穩定上游契約：`https://asia-trend-radar.gugupro-app.workers.dev/api/v1`

比賽版只透過自己的 Pages Functions 代理讀取上游。`RADAR_PROGRAM_API_TOKEN` 只能存在比賽版伺服器 Secret；瀏覽器、Local Storage、Session Storage、WebMCP 輸出、正式 Build 與證據檔均不得包含其值。

## 工具

| 工具 | 唯讀 | 上游端點 | 用途 |
|---|---:|---|---|
| `search_radar_trends` | 是 | `GET /trends` | 依市場、分類、類型、時間、信心、來源與排序查詢主題 |
| `get_radar_trend` | 是 | `GET /trends/:topicId` | 取得單一主題及來源證據 |
| `search_radar_videos` | 是 | `GET /videos` | 查詢爆款影音；無資料時回傳空陣列 |
| `list_radar_sources` | 是 | `GET /sources` | 列出成功、空資料、失敗、延遲、等待憑證與停用 |
| `list_radar_markets` | 是 | `GET /markets` | 列出市場及啟用狀態 |
| `list_radar_categories` | 是 | `GET /categories` | 列出統一分類 |

所有工具均使用 `document.modelContext.registerTool()`、`readOnlyHint=true` 與嚴格 JSON Schema。含外部內容的工具另標示 `untrustedContentHint=true`。

## 共用資料路徑

```text
WebMCP tool ─┐
             ├─ HttpRadarBrowserGateway ─ /api/radar/* ─ RadarAdapter ─ Asia Trend Radar API
網站搜尋 ────┘
```

欄位轉換、延遲判斷、快取、錯誤清理與排序條件只由伺服器端 `RadarAdapter` 負責。網站端只顯示同一回應，不另造資料。

## 快取與失敗

- `/trends`、`/videos`、單筆主題：5 分鐘。
- `/sources`：1 分鐘。
- `/markets`、`/categories`：24 小時。
- 429 最多重試兩次。
- 5xx 或網路逾時可顯示最近成功快取，並標示「目前顯示最近一次成功資料」及原始取得時間。
- 沒有成功快取時回傳誠實錯誤或空狀態，不使用展示資料。
- 401／403 只回傳清理後的憑證設定訊息，不回傳上游錯誤堆疊。

## 來源語意

- Google Trending RSS：上升搜尋。
- YouTube：官方熱門影片與公開統計；無資料不補假資料。
- NAVER：韓國候選詞驗證，不是完整熱門榜。
- Yahoo! JAPAN 購物：購物關鍵字，不是日本全網熱搜。
- Daum：文件量交叉驗證，不是搜尋量。
- GDELT：新聞佐證。
- Hatena：公開收藏關注。
- Wikimedia：公開閱讀關注。
- 中國大陸停用來源：等待合法來源。

相對熱度只能稱為相對值，不得稱為原始搜尋次數或觀看數。`growth=null` 必須顯示「正在建立增速基準」。
