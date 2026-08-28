# B 版架構與產品邊界

本分支採模組化單體，並只組合「爆紅流量情報服務」需要的熱門領域。

## A／B 版本

| 版本 | 分支 | 狀態 |
|---|---|---|
| A 版 | `internal/operator-console` | 固定在封存基準，未來另行續作 |
| B 版 | `product/trend-discovery-mvp` | 對外熱門情報產品，目前分支 |

B 版不包含 A 版帳號、影音及發布功能；Git 分支與 Tag 是 A 版的恢復依據。

## 依賴方向

```text
presentation → application → domain
                    ↑
             infrastructure
```

- `domain`：主題、分類、狀態、分數與自然事件門檻。
- `application`：蒐集、合併、評分、清單流程及 Port。
- `infrastructure`：Local Storage Repository 與 Mock Provider。
- `presentation`：審核入口、精選、搜尋、詳情、觀察、排除、規則與邊界頁。
- `tests`：領域、保存、流程、路由與產品隔離。

## 熱門資料流

```text
MockTrendSourceProvider
  → TrendDiscoveryService（合併、評分、狀態判定）
  → TrendTopic／Watchlist／Exclusion／FilterRule／RefreshLog／Audit Repository
  → React Presentation
```

頁面不直接存取 Local Storage。正式資料來源或資料庫上線時，只替換 Infrastructure 實作，不改寫 Domain 與 Presentation。

## 審核資料重設

```text
ReviewPage
  → ReviewResetService
  → TrendReviewResetRepository（只刪除 trend-discovery namespace）
  → TrendDiscoveryService.refresh（重建 22 題／61 訊號）
```

重設流程不使用 `localStorage.clear()`，也不直接由 Presentation 操作瀏覽器儲存。

## Cloudflare Pages 邊界

- 只上傳 Vite 的 `dist` 靜態產物，不上傳原始碼或 A 版。
- `public/_redirects` 提供 React Router 深層路由 fallback。
- `public/_headers` 提供 noindex 與安全回應標頭。
- `public/robots.txt` 阻擋搜尋引擎爬取；這不是登入或 Access 控制。
- `/` 導向 `/review`，非 B 版路由一律顯示產品邊界頁。

## Build 隔離

- `App.tsx` 只註冊 `/review` 與 `/trends` 路由。
- 其他路徑由 `ProductBoundaryPage` 處理，不渲染其他產品線畫面。
- A 版專屬原始碼模組已從 B 版工作樹移除。
- `scripts/verify-public-build.mjs` 在每次 Production Build 後掃描產物；發現 A 版專屬路由、識別或文案即失敗。
