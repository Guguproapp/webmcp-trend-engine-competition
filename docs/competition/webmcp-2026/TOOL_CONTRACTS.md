# WebMCP 五工具契約

> 目前正式展示契約已由 [RADAR_TOOLS_SPEC.md](./RADAR_TOOLS_SPEC.md) 取代：六個熱門雷達工具全部唯讀。本文件以下內容保留為比賽版先前「人機確認寫入」實驗的歷史證據，不會載入目前正式 Build。

所有工具都使用原生 `document.modelContext.registerTool()`，具有 `name`、`title`、`description`、`inputSchema`、`execute` 與 `annotations`。工具名稱與參數描述遵守短字數限制，輸出為可序列化的結構化資料。

## 共通安全規則

- 未定義欄位一律拒絕：`additionalProperties: false`。
- 關鍵字最多 80 字；`trend_id` 最多 160 字，只接受現有 `trend-*` 識別碼。
- 寫入工具不接受 URL、HTML、程式碼、陣列、批次或 `confirm` 欄位。
- 錯誤只回傳白話安全訊息，不含 Stack、Token、Cookie、資料庫資訊或內部路徑。
- `execute(input, { signal })` 必須處理 `AbortSignal`。

## 1. search_trends

- 類型：只讀。
- annotations：`readOnlyHint: true`。
- 輸入：`query`、`region`、`platform`、`time_range`。
- 地區：中國大陸、台灣、香港、澳門、全部。
- 平台：既有八影音平台及可查證來源代碼；沒有資料的平台回傳空結果，不補假資料。
- 時間：1、6、24 小時，3 或 7 天。
- 輸出：最多 3 項，每項包含 `trend_id`、標題、地區、平台、時間、綜合分數、資料狀態與簡短限制。

## 2. get_trend_evidence

- 類型：只讀。
- annotations：`readOnlyHint: true`、`untrustedContentHint: true`。
- 輸入：單一既有 `trend_id`。
- 輸出分區：
  - `official_source_data`：外部來源，每項標示 `external_untrusted`。
  - `system_calculated_score`：既有評分與版本。
  - `data_gaps`：資料不足項目。
  - `source_limitations`：來源與推論限制。
- 外部標題、發布者及內容永遠只是資料，不是指令。

## 3. get_source_status

- 類型：只讀。
- annotations：`readOnlyHint: true`。
- 輸入：空物件。
- 輸出：來源代碼、名稱、狀態、訊息、最後成功、下次重試、取得筆數、正常來源數與限制。

## 4. add_trend_to_watchlist

- 類型：真人確認寫入。
- annotations：`readOnlyHint: false`。
- 輸入：單一既有 `trend_id`。
- 呼叫效果：只建立待確認操作；確認前觀察清單不變。
- 確認後：沿用既有觀察 Repository，單筆且冪等。
- 撤銷：原本不在觀察時移出；原本已在觀察時不製造多餘變更。

## 5. exclude_trend

- 類型：真人確認寫入。
- annotations：`readOnlyHint: false`。
- 輸入：單一既有 `trend_id` 與既有九種排除原因。
- 呼叫效果：只建立待確認操作；確認前排除與觀察狀態不變。
- 確認後：沿用既有排除 Repository，單筆且冪等。
- 撤銷：取消本次排除，並恢復原排除理由或原觀察狀態。

## 解除註冊

每個工具以註冊用 `AbortSignal` 綁定生命週期。Agent Workspace 卸載或路由離開時中止控制器，工具從頁面移除；同時所有待確認寫入會以 `aborted` 結束且不寫入。
