# 熱門引擎｜爆紅流量情報服務

蒐集正在快速上升的熱門議題，依真實來源證據計算熱度、增速、社會共鳴、跨來源程度、資料信心與風險。

目前公開候選版由 Cloudflare Pages Functions 透過同網域 `/api` 取得資料，並以 D1 保存主題、來源訊號、快照與提供者執行紀錄。前端不持有外部服務金鑰，也不在來源失敗時切回展示題目。

## A／B 產品線

| 版本 | Git 分支 | 定位 | 本分支是否包含 |
|---|---|---|---|
| A 版 | `internal/operator-console` | 宗億自用營運工作台，未來另行續作 | 否；由獨立分支與 Tag 保存 |
| B 版 | `product/trend-discovery-mvp` | 對外爆紅流量情報產品 | 是 |

A 版封存 Tag：`account-onboarding-mock-v0.1.0`、`internal-console-v0.1.0`。本分支不包含 A 版的帳號、授權、影音、發布或金流功能。

## 已接入與保留邊界

- GDELT全球新聞資料：已接入官方公開 DOC API，只保存標題、媒體、發布時間、原始網址、取得時間及衍生指標，不保存新聞全文。
- YouTube影音平台：伺服器提供者已完成；需由宗億本人建立官方 API 金鑰，再以 Cloudflare 加密秘密 `YOUTUBE_API_KEY` 設定。沒有金鑰時顯示「等待授權」，不建立假資料。
- Google熱門搜尋趨勢：只保留停用邊界，等待 Google 官方 API Alpha 存取資格。
- Threads社群討論：只保留可插拔介面，不申請權限、不爬取網站。
- Facebook、Instagram、TikTok：本輪不接入，亦不使用非官方爬蟲。

## 本機啟動與驗證

需求：Node.js 22 以上、npm 10 以上。

```bash
npm install
npm test
npm run typecheck
npm run lint
npm run build
npx wrangler pages dev dist
```

本機需要 D1 時，先執行 `npx wrangler d1 migrations apply trend-engine-b-review --local`。

`.dev.vars.example` 只列出秘密變數名稱。請將實際秘密放在未追蹤的 `.dev.vars` 或 Cloudflare Pages 加密秘密；不得使用 `VITE_` 前綴。

## 同網域 API

- `GET /api/trends`：回傳新鮮快取；過期時由單一鎖更新，其他請求可取得最近一次成功結果。
- `GET /api/trends/:topicId`：回傳主題與完整來源證據。
- `GET /api/sources/status`：回傳來源啟用、失敗、配額及重試狀態。
- `POST /api/admin/refresh`：以 `Authorization: Bearer …` 驗證 `REFRESH_ADMIN_TOKEN`，只供管理更新。

## 資料與安全

- `TREND_DB` 是 Cloudflare D1 綁定，不是前端環境變數。
- `YOUTUBE_API_KEY` 與 `REFRESH_ADMIN_TOKEN` 只存在 Pages Functions 執行環境。
- Production Build 掃描會拒絕展示題目、秘密變數名稱、A 版路由與A版專屬模組。
- 觀察、排除與篩選偏好仍由 Infrastructure 層封裝在目前瀏覽器，外部來源證據與快照保存在 D1。
- HTML、`robots.txt` 與安全回應標頭持續要求搜尋引擎不要建立索引；這不是登入或存取控制。

## 文件

- [架構與產品邊界](docs/ARCHITECTURE.md)
- [模組責任](docs/MODULES.md)
- [熱門來源 Provider](docs/ADAPTERS.md)
- [測試方式](docs/TESTING.md)
- [驗證結果](docs/VERIFICATION.md)
- [未來來源接入點](docs/FUTURE-INTEGRATIONS.md)
- [限制與停止點](docs/LIMITATIONS.md)
- [公開測試操作指南](docs/B_REVIEW_GUIDE.md)
- [公開測試清單](docs/B_REVIEW_CHECKLIST.md)
