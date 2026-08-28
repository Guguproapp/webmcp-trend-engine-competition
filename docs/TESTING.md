# B 版測試與 Mock 操作

## 自動測試

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

測試涵蓋蒐集、相同主題合併、集中權重、扣分、高風險、證據不足、自然事件門檻、搜尋、篩選、排序、保存、觀察、排除、詳情、公開路由及產品線隔離。

## 路由邊界

下列 B 版路由必須正常：

- `/trends`
- `/trends/search`
- `/trends/:topicId`
- `/trends/watchlist`
- `/trends/excluded`
- `/trends/rules`
- `/review`

任何非 B 版路徑都必須顯示「此功能不屬於目前產品」，不能載入其他產品線畫面。

## Build 隔離

`npm run build` 會在 Vite Build 後執行 `scripts/verify-public-build.mjs`。檢查失敗時代表公開產物仍含其他產品線路由、模組識別或文案，不得交付。

同一檢查也驗證 Production 輸出包含 `_redirects`、`robots.txt` 與 `_headers`，並核對 SPA fallback、noindex 與主要安全標頭。

## 審核重設測試

- `ReviewResetService` 只能刪除 `trend-engine.*` namespace。
- 不相關 Local Storage key 必須保留。
- 重設後必須恢復 22 個 Mock 主題、61 筆來源訊號及 6 種來源。
- 觀察、排除及目前篩選條件必須回到初始狀態。

## 響應式驗收

- 桌面：1440 × 900。
- 平板：768 × 1024。
- 手機：390 × 844。

使用正式 `pages.dev` 網址逐頁檢查審核入口、精選、搜尋、詳情、觀察、排除、規則與路由邊界，確認深層網址重新整理正常、沒有水平溢出、主要操作可用、Console 沒有錯誤或警告。
