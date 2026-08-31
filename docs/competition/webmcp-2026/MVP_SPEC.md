# WebMCP 五工具人機協作 MVP 規格

## 核准狀態

- `WORK PACKAGE APPROVED：YES`
- 核准人：陳宗億
- 核准日期：2026-08-30
- 核准範圍：3 個只讀工具，加上 2 個必須真人確認的單筆寫入工具。

## 產品目標

在既有熱門引擎 B 版能力上，新增一條三分鐘內可完整展示的 WebMCP 人機協作流程：代理搜尋至多三個候選、讀取證據與來源狀態，真人再決定是否加入觀察或排除；代理不能繞過確認，也不能批次寫入。

## 集中流程

1. 使用者指定關鍵字、地區、平台與時間範圍。
2. 代理呼叫 `search_trends`，回傳最多三個候選。
3. 使用者選定主題，代理呼叫 `get_trend_evidence` 與 `get_source_status`。
4. 工作區分開呈現正式來源、系統分數、資料不足、來源限制與外部未受信任內容。
5. 代理可呼叫 `add_trend_to_watchlist` 或 `exclude_trend`，但只會建立待確認操作。
6. 真人在網站確認後才寫入；取消、逾時、頁面離開或 Abort 都不寫入。
7. 成功後可撤銷並恢復操作前狀態。

## 本輪新增

- 原生 `document.modelContext.registerTool()` 五工具註冊與生命週期。
- Agent Workspace 代理協作工作區。
- 真人確認、取消、逾時、Abort、冪等與撤銷。
- 比賽版匿名 Session 稽核與個別瀏覽器資料隔離。
- WebMCP 信任邊界、安全掃描、回歸測試與比賽文件。

## 比賽前既有、不得冒充新增

熱門清單、地區、搜尋、分數、證據、觀察、排除、撤銷、資料來源、網址匯入與響應式 UI 都是基準版本既有能力；詳見 [PREEXISTING_WORK.md](./PREEXISTING_WORK.md)。

## 明確不做

- 第二套聊天機器人、會員、金流、自動發布、正式 Cloudflare 資源或正式 D1。
- 批次觀察、批次排除、代理自行確認、任意 URL／HTML／程式碼寫入。
- WebMCP Polyfill；不支援的瀏覽器只做安全降級。
- Push、公開 GitHub、公開部署、Devpost 或影片上傳。

## 驗收

- 五工具契約、19 項核心 WebMCP 測試及安全回歸通過。
- 既有 168 項不退步；總測試數須大於 168。
- 1440×900、768×1024、390×844 無水平溢出，控制至少 44px。
- 原生 WebMCP 只能以 ChatGPT 內建瀏覽器或支援該實驗功能的 Chrome 驗證；Safari 只驗證一般 UI 與安全降級。

## 目前官方依據

- [WebMCP Community Group Draft](https://webmachinelearning.github.io/webmcp/)
- [Chrome WebMCP Imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)
- [Chrome WebMCP tool security](https://developer.chrome.com/docs/ai/webmcp/secure-tools)

WebMCP 仍為持續演進中的介面，後續瀏覽器版本可能調整細節；本版依 2026-08-30 可查得的規格施工。
