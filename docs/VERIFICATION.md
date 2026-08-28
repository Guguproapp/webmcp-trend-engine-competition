# 工作包003真實熱門來源候選版驗證結果

驗證日期：2026-08-29（Asia/Taipei）

## 自動檢查

| 項目 | 結果 | 實際結果 |
| --- | --- | --- |
| `npm install` | PASS | 稽核283個套件、0個漏洞 |
| `npm test` | PASS | 8個測試檔、90個測試全數通過 |
| `npm run typecheck` | PASS | TypeScript前端與Pages Functions型別檢查無錯誤 |
| `npm run lint` | PASS | ESLint 0 error、0 warning |
| `npm run build` | PASS | 45個模組；HTML 0.89 kB、CSS 28.23 kB、JavaScript 284.58 kB |
| 公開Build掃描 | PASS | 不含22個展示題目、秘密變數名稱、A版路由或A版模組 |

## 真實資料與D1

- GDELT取得98筆官方新聞索引，正規化後保存36筆來源訊號、30個候選主題。
- D1 `TREND_DB` 位於APAC，資料庫196 kB；30個主題、36筆訊號、36筆關聯、90筆快照、6筆來源執行紀錄、0個殘留更新鎖。
- 第一次快照顯示建立增速基準；後續真實快照均標示 `measured`。本次來源數未變，因此30個主題的真實增速為0%，不是推估值。
- YouTube提供者已完成但沒有 `YOUTUBE_API_KEY`，正式狀態為等待授權、0筆；沒有回退展示資料。
- GDELT官方HTTPS憑證在取得時異常，伺服器使用同一官方主機HTTP公開索引並顯示降級提示。

## 正式網址驗收

- 正式入口：<https://trend-engine-b-review.pages.dev/review>
- 八個B版路由可直接開啟及重新整理，三個A版路由只顯示產品邊界頁。
- 桌面1440×900第一張卡頂端466px；平板768×1024及手機390×844水平溢出均為0。
- 手機導覽固定4項；更多選單焦點進入／Escape關閉回焦通過。
- 搜尋、來源／時間／排序篩選、觀察加入／移出、排除原因停用／啟用、排除／撤銷／取消排除均實際通過。
- Console 0 error、0 warning；正式來源CNA與自由財經原始連結均回應HTTP 200。
- 50次正式網址抽查：50/50 HTTP 200，min 0.098s、p50 0.145s、p95 1.802s、max 2.205s、平均0.485s。
- CSP、Permissions-Policy、Referrer-Policy、nosniff、DENY、X-Robots-Tag及`robots.txt Disallow: /`均生效。

證據目錄：`evidence/work-package-003/`。

---

# B 版 RC2 驗證結果

驗證日期：2026-08-29（Asia/Taipei）

## RC2 自動檢查

| 項目 | 結果 | 實際結果 |
| --- | --- | --- |
| `npm install` | PASS | 稽核 282 個套件、0 個漏洞 |
| `npm test` | PASS | 7 個測試檔、57 個測試全數通過 |
| `npm run typecheck` | PASS | TypeScript 專案檢查無錯誤 |
| `npm run lint` | PASS | ESLint 0 error、0 warning |
| `npm run build` | PASS | Vite Production Build 成功，共轉換 44 個模組 |
| 公開 Build 隔離掃描 | PASS | 6 個產物檔未包含 A 版內容或公開工程術語；SPA fallback、robots、安全 headers 及 reduced-motion 均存在 |
| `git diff --check` | PASS | 無空白或 Patch 格式錯誤 |

Production Build 產物：HTML 0.89 kB、CSS 23.93 kB、JavaScript 286.03 kB（壓縮前）。

## RC2 正式網址驗收

- Cloudflare Pages 專案：`trend-engine-b-review`。
- 正式入口：<https://trend-engine-b-review.pages.dev/review>。
- 本輪部署預覽：<https://41e2de57.trend-engine-b-review.pages.dev>。
- 方案／付款：免費用量顯示 0 / 100,000 requests；部署未要求信用卡或付費。
- 桌面 1440×900、平板 768×1024、手機 390×844，各 11 路由直接開啟並重新整理，共 33 組全數 PASS。
- 正式網址 Console：0 error、0 warning、0 未捕捉例外；所有路由 0px 水平溢出。
- 正式網址互動：5→22→5、基本／進階篩選、觀察加入／移出、排除原因停用／啟用、排除／撤銷、空狀態 CTA 全數 PASS。
- Safari 正式網址實測：重設恢復 22 題／61 訊號、加入／移出觀察、排除／撤銷均 PASS。
- 文字對比掃描：4 個主要頁面 0 項低於 WCAG AA 門檻；鍵盤焦點為 3px 實線亮藍焦點環。
- 正式回應：HTTP 200；CSP、Permissions-Policy、Referrer-Policy、nosniff、DENY 與 X-Robots-Tag 均生效；`robots.txt` 為全站 `Disallow: /`。

RC2 證據目錄：`evidence/work-package-002d/`，包含 14 張正式網址／Cloudflare 截圖及 8 份文字稽核證據。

---

# 工作包 002C 驗證結果

驗證日期：2026-08-28（Asia/Taipei）

## 自動檢查

| 項目 | 結果 | 實際結果 |
| --- | --- | --- |
| `npm install` | PASS | 相依套件已是最新，稽核 282 個套件、0 個漏洞 |
| `npm test` | PASS | 7 個測試檔、41 個測試全數通過 |
| `npm run typecheck` | PASS | TypeScript 專案檢查無錯誤 |
| `npm run lint` | PASS | ESLint 0 error、0 warning |
| `npm run build` | PASS | Vite Production Build 成功，共轉換 43 個模組 |
| 公開 Build 隔離掃描 | PASS | 掃描 6 個產物檔，未找到 A 版內容；SPA fallback、robots 與安全 headers 均存在 |
| `git diff --check` | PASS | 無空白或 Patch 格式錯誤 |

Production Build 產物：HTML 0.89 kB、CSS 18.91 kB、JavaScript 279.49 kB（壓縮前）。

## Cloudflare Pages 正式網址

- 專案：`trend-engine-b-review`
- 主網址：<https://trend-engine-b-review.pages.dev/>
- 審核入口：<https://trend-engine-b-review.pages.dev/review>
- 部署方式：Cloudflare Pages Direct Upload，只上傳 `dist`。
- 方案／付款：帳戶顯示免費用量 0 / 100,000 requests；流程未要求信用卡或付費。
- Production 分支：`product/trend-discovery-mvp`。

正式 `/review` 回應為 HTTP 200，實際包含 CSP、Permissions-Policy、Referrer-Policy、`X-Content-Type-Options: nosniff`、`X-Frame-Options: DENY` 與 `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet`。`robots.txt` 可讀取且為全站 `Disallow: /`。

## 全新瀏覽器驗收

使用正式 `pages.dev` 網址與全新瀏覽器分頁重新驗收，沒有沿用本機或工作包 002B 的畫面證據。

- 桌面 1440 × 900、平板 768 × 1024、手機 390 × 844：11 個路由各自直接開啟並重新整理，共 33 組全數 PASS、無水平溢出。
- `/` 正確導向 `/review`；審核入口、精選、搜尋、詳情、觀察、排除、規則及三個產品邊界路由均顯示全站 Mock 標示。
- A 版路由 `/onboarding`、`/oauth/mock/callback`、`/settings/connections`：全數顯示「此功能不屬於目前產品」，未渲染 A 版畫面。
- 實際操作：重設 22 題／61 訊號、搜尋 `AI`、YouTube、最近 24 小時、最低 50 分、排除高風險、依增長最快排序，得到 1 筆；重新整理後條件保留。
- 實際操作：加入／移出觀察、以「風險太高」排除、取消排除、儲存篩選規則皆有畫面與保存狀態變化。
- Console：33 組路由驗收後，error、warning 與未捕捉例外合計 0。

## 畫面證據

驗收證據目錄：`evidence/work-package-002c/`。

- `01-review-desktop.png` ～ `11-cloudflare-deployment.png`
- `12-live-response-headers.txt`
- `13-live-robots.txt`
- `14-console-check.txt`
- `15-live-route-check.txt`

所有產品畫面證據皆來自正式 `pages.dev`；第 11 張為 Cloudflare 後台的 Pages 專案部署證據。
