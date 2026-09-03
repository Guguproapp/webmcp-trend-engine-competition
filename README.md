# 熱門引擎｜爆紅流量情報服務

蒐集正在快速上升的熱門議題，依真實來源證據計算熱度、增速、社會共鳴、跨來源程度、資料信心與風險。

> 本程式庫是獨立的 WebMCP 2026 比賽版，不是正式 B 版工作目錄。比賽新增功能只在 `competition/webmcp-2026` 的後續分支開發，不回寫 A 版或正式 B 版。目前比賽展示入口為 `/radar-tools`，提供六個可由原生 WebMCP 發現的唯讀熱門雷達工具，以及不支援 WebMCP 時仍可使用的一般網站搜尋。

目前介面以正式產品使用情境呈現。Cloudflare Pages Functions透過同網域`/api`取得GDELT與YouTube資料，並以D1保存主題、來源訊號、快照與提供者執行紀錄。搜尋介面將市場地區、情報類型與來源平台分成三個獨立維度；未取得正式權限的平台只提供官方網站輔助或使用者分享入口，不回傳假資料。

正式中性網址：<https://trend-engine-app.pages.dev/>。舊版交付網址`trend-engine-b-review.pages.dev`保留，不刪除或覆蓋。

## A／B 產品線

| 版本 | Git 分支 | 定位 | 本分支是否包含 |
|---|---|---|---|
| A 版 | `internal/operator-console` | 宗億自用營運工作台，未來另行續作 | 否；由獨立分支與 Tag 保存 |
| B 版 | `product/trend-discovery-mvp` | 對外爆紅流量情報產品 | 是 |

A 版封存 Tag：`account-onboarding-mock-v0.1.0`、`internal-console-v0.1.0`。本分支不包含 A 版的帳號、授權、影音、發布或金流功能。

## 已接入與保留邊界

- GDELT全球新聞資料：已接入官方公開 DOC API，只保存標題、媒體、發布時間、原始網址、取得時間及衍生指標，不保存新聞全文。
- YouTube影音平台：正式啟用，官方API金鑰只存在Cloudflare加密秘密`YOUTUBE_API_KEY`；目前資料量仍少，只能證明技術串接成功，不能代表熱門議題覆蓋率足夠。
- Google熱門搜尋趨勢：只保留停用邊界，等待 Google 官方 API Alpha 存取資格。
- Threads社群討論：只保留可插拔介面，不申請權限、不爬取網站。
- Facebook社群平台：正式Provider邊界與Meta權限狀態已建立；尚未送審時只提供官方搜尋與公開網址匯入，不回傳假資料。
- Instagram圖文與短影音平台：正式Provider邊界與專業帳號／公開內容權限狀態已建立；尚未取得權限時只提供官方搜尋與公開網址匯入。
- TikTok短影音平台：提供官方搜尋、官方熱門創意中心與公開影片網址匯入；不是全平台自動API搜尋。
- 抖音、快手、小紅書及B站：固定列入中國大陸與跨地區候選平台；本輪只提供官方網站輔助、合法限定網域搜尋與使用者分享網址，沒有官方權限時不產生平台統計。
- 合法搜尋引擎輔助：只產生限定官方網域的搜尋連結，不爬取結果頁，也未購買付費服務。

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

熱門雷達正式連線使用比賽版自己的伺服器端加密 Secret；canonical 部署已於 2026-09-03 重新驗證可取得真實資料。本輪沒有讀取或逐值比對實際 Secret；專案規則禁止把實際值放入程式庫、瀏覽器或證據檔。其他或本機環境若未設定必要伺服器憑證，仍會安全失敗且不使用展示資料，也不得借用正式 B 版或熱門雷達管理者憑證。

本機需要 D1 時，先執行 `npx wrangler d1 migrations apply trend-engine-b-review --local`。

`.dev.vars.example` 只列出秘密變數名稱。請將實際秘密放在未追蹤的 `.dev.vars` 或 Cloudflare Pages 加密秘密；不得使用 `VITE_` 前綴。

## 同網域 API

- `GET /api/trends`：回傳新鮮快取；過期時由單一鎖更新，其他請求可取得最近一次成功結果。
- `GET /api/trends/:topicId`：回傳主題與完整來源證據。
- `GET /api/sources/status`：回傳來源啟用、失敗、配額及重試狀態。
- `POST /api/admin/refresh`：以 `Authorization: Bearer …` 驗證 `REFRESH_ADMIN_TOKEN`，只供管理更新。

公開首頁為`/`，使用說明為`/guide`，舊`/review`會導向產品首頁。`/trends/video-search`可依中國大陸、台灣、香港、澳門或全部地區，搭配六種情報類型與八個影音平台搜尋。YouTube可再分長影音與Shorts短影音，兩者分開建立比較基準；網址候選只保存在瀏覽器的B版命名空間，沒有搜尋量、官方平台數據或第二次快照時，不會判定為熱搜上升、雙重爆紅或真實增速。

`/trends/:topicId/create` 是比賽版獨立的影音創作交接節點。它僅把使用者方向與已選主題整理成前三秒鉤子、旁白、分鏡、通用文字／圖片轉影片指令與人工查證提醒；全部由本機規則產生，不會呼叫付費人工智慧服務、不會生成影音，也不會把來源標題當成已查證事實。

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
- [B版最終交接](docs/B_FINAL_HANDOFF.md)
- [公開測試計畫](docs/B_PUBLIC_TEST_PLAN.md)
- [封存清單](docs/B_RELEASE_CHECKLIST.md)
- [地區、熱搜與八平台來源矩陣](docs/REGIONAL_SOURCE_MATRIX.md)
- [四平台RC1來源矩陣（歷史文件）](docs/FOUR_PLATFORM_SOURCE_MATRIX.md)
- [Meta申請準備](docs/META_APPLICATION_CHECKLIST.md)
- [TikTok輔助來源政策](docs/TIKTOK_ASSISTED_SOURCE_POLICY.md)
- [合法網頁搜尋供應商決策](docs/WEB_SEARCH_PROVIDER_DECISION.md)
