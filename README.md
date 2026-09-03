# Asia Trend Radar Read-Only WebMCP Tools

[English documentation](README.en.md)

這是獨立的 WebMCP 2026 比賽版，讓評審以六個唯讀工具搜尋亞洲熱門訊號、查看原始來源證據與資料可用狀態。未支援原生 WebMCP 的瀏覽器仍可使用同一頁面的一般網站搜尋。

## 公開入口

- 英文正式版：<https://webmcp-trend-engine-competition.pages.dev/radar-tools?lang=en>
- 中文正式版：<https://webmcp-trend-engine-competition.pages.dev/radar-tools>
- Devpost：<https://devpost.com/software/asia-trend-radar-read-only-webmcp-tools>
- GitHub：<https://github.com/Guguproapp/webmcp-trend-engine-competition>
- 展示影片：<https://youtu.be/AzmVt_3NpQE>

## 六個唯讀 WebMCP 工具

- `search_radar_trends`：依市場、分類、時間、信心、來源與排序搜尋熱門訊號。
- `get_radar_trend`：取得單一主題及其來源證據。
- `search_radar_videos`：搜尋影音訊號；沒有合格資料時回傳誠實空結果。
- `list_radar_sources`：查看來源可用性與健康狀態。
- `list_radar_markets`：列出支援市場及啟用狀態。
- `list_radar_categories`：列出標準化分類。

六個工具全部唯讀，不提供資料修改、帳號登入、Token 存取、排程、會員、付款、發布或管理操作。輸入採嚴格 Schema，拒絕額外欄位及 `limit=500` 等超規請求；管理端點不會註冊成 WebMCP 工具。

## 真實來源與限制

- 熱門雷達由比賽版自己的伺服器端唯讀通道取得真實資料；憑證只存在 Cloudflare 加密 Secret，前端與工具回應不會取得或顯示。
- GDELT 全球新聞資料只經 HTTPS 取得，只保存標題、媒體、發布時間、公開原始網址、取得時間及衍生指標，不保存全文。HTTPS 失敗時不降級到 HTTP、不新增證據或快照；有最近安全資料時標示延遲，否則回傳誠實失敗空狀態。
- YouTube 只使用正式伺服器端 API；資料量不足時不冒充完整熱門覆蓋率。
- Google Trends、Threads、Meta 與其他平台只有在取得正式資格或權限時才會啟用；目前的官方網站輔助入口不等於全平台自動 API。
- 新聞篇數不會冒充搜尋量、觀看數、按讚數或留言數；沒有第二次可靠快照時不顯示真實增速。
- 即時資料可能變動；空資料、延遲、過期與來源失敗都會如實顯示，不以 Mock 或展示資料填補。

## 本機啟動與驗證

需求：Node.js 22 以上、npm 10 以上。

```bash
npm ci
npm test
npm run typecheck
npm run lint
npm run build
npm audit --audit-level=high
npm audit signatures
git diff --check
npx wrangler pages dev dist
```

公開 Repository 只包含環境變數名稱範例。正式憑證必須存放在 Cloudflare Pages 加密 Secret 或未追蹤的本機設定，不得放入前端變數、原始碼、Commit、截圖或 Issue。

## 安全與資料邊界

- `TREND_DB` 是 Cloudflare D1 綁定，不是前端環境變數。
- Production Build 會掃描秘密名稱、展示題目、範圍外路由與模組。
- 外部網址必須是沒有帳密、Fragment、敏感 Query 或私人存取權限的公開 HTTPS 網址。
- 公開唯讀端點收到非允許方法會拒絕；未授權管理請求會拒絕，錯誤內容不回顯憑證。
- HTML、`robots.txt` 與安全回應標頭要求搜尋引擎不要索引；noindex 不是登入或存取控制。

## 比賽工作與產品隔離

基礎熱門探索產品、來源管線、證據模型、篩選及響應式介面在比賽前已存在。比賽期間新增獨立 checkout、六工具原生註冊、嚴格 Schema、唯讀 Radar Adapter、安全降級、中文 topic ID、英文評審介面及比賽專用驗證證據。

本 Repository 不回寫 A 版、原版 B 或其他熱門雷達專案，也不包含其他產品的登入、會員、金流、影音生成、平台發布或管理憑證。詳細邊界見 [PREEXISTING_WORK.md](docs/competition/webmcp-2026/PREEXISTING_WORK.md) 與 [NEW_WORK_LOG.md](docs/competition/webmcp-2026/NEW_WORK_LOG.md)。

## 驗證證據

- 21 個測試檔、317 項測試通過。
- TypeScript、ESLint、Production Build、高風險相依套件稽核、套件簽章及 `git diff --check` 通過。
- 六工具已在相容的內建瀏覽器完成發現與唯讀呼叫；Safari 只驗證一般網站備援，不宣稱原生 WebMCP。
- 台灣 24 小時前 5 筆、中文 topic ID、來源／市場／分類、影音誠實空狀態、超規 limit 與管理工具未暴露均有比賽證據。

詳細文件：

- [工具規格](docs/competition/webmcp-2026/RADAR_TOOLS_SPEC.md)
- [工具契約](docs/competition/webmcp-2026/TOOL_CONTRACTS.md)
- [安全模型](docs/competition/webmcp-2026/SECURITY_MODEL.md)
- [瀏覽器驗證](reports/webmcp-radar-tools/BROWSER_VALIDATION.md)
- [測試證據](reports/webmcp-radar-tools/GREEN_TEST_EVIDENCE.txt)

## License

[MIT License](LICENSE)
