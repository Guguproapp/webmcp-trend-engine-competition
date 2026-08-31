# WebMCP 2026 新增工作紀錄

本檔建立時尚未開始任何WebMCP功能施工。後續每一項比賽新增功能都必須在完成後追加一筆紀錄，不得回填成比賽前既有功能。

## 紀錄格式

### YYYY-MM-DD｜功能名稱

- Commit：`待填寫完整Commit雜湊`
- 新增功能：待填寫。
- 使用的WebMCP工具：待填寫；沒有使用時明確寫「無」。
- 測試指令與結果：待填寫，使用`PASS／FAIL／NOT RUN／BLOCKED`。
- 畫面或影片證據：待填寫實際檔案或網址。
- 是否影響正式B版：必須為「否」；若發現需要正式B版修正，先停止並回報宗億。
- 備註與限制：待填寫。

---

## 已完成紀錄

### 2026-08-30｜五工具測試契約與 RED 證據

- Commit：`5d7c2d16f6a14a23062a9deb1b5e9a11bc408f3d`
- 新增功能：先建立五工具、真人確認、取消、逾時、Abort、冪等、撤銷與 Session 隔離測試契約。
- 使用的WebMCP工具：五個工具均先定義契約，尚未實作。
- 測試指令與結果：`FAIL（預期 RED）`；缺少正式實作模組，證據見`evidence/work-package-004/red/01-webmcp-contracts-red.txt`。
- 畫面或影片證據：此階段無畫面。
- 是否影響正式B版：否。
- 備註與限制：這是刻意保存的失敗基準，不可當成完成測試。

### 2026-08-30｜三個只讀 WebMCP 工具

- Commit：`e0807faf962e6d46fe92c6109a0fc4f99ccec218`
- 新增功能：原生註冊、結構化搜尋、證據信任邊界、來源狀態與安全降級。
- 使用的WebMCP工具：`search_trends`、`get_trend_evidence`、`get_source_status`。
- 測試指令與結果：`PASS`；契約測試 8/8、TypeScript、ESLint、`git diff --check`。
- 畫面或影片證據：待 Agent Workspace 實際瀏覽器證據。
- 是否影響正式B版：否。
- 備註與限制：來源不足時回傳空結果或限制，不補假資料。

### 2026-08-30｜兩個真人確認寫入工具

- Commit：`06bc09f64bbed37f7e7cb28f2c343a07d817ee3c`
- 新增功能：真人確認、取消、逾時、Abort、冪等、單筆寫入及撤銷。
- 使用的WebMCP工具：`add_trend_to_watchlist`、`exclude_trend`。
- 測試指令與結果：`PASS`；寫入安全測試 8/8、TypeScript、ESLint、`git diff --check`。
- 畫面或影片證據：待 Agent Workspace 實際瀏覽器證據。
- 是否影響正式B版：否。
- 備註與限制：沒有批次能力，也沒有代理可傳入的確認參數。

### 2026-08-30｜Agent Workspace 響應式介面

- Commit：`359a091767e37390db7f48a29054a4517c142b3f`
- 新增功能：雙語原生狀態、最近工具呼叫、三候選、證據限制、真人確認、結果與撤銷介面。
- 使用的WebMCP工具：五工具的可視化工作區。
- 測試指令與結果：`PASS`；WebMCP 專屬 19/19，當時完整回歸 187/187。
- 畫面或影片證據：RED證據見`evidence/work-package-004/red/02-agent-workspace-red.txt`；GREEN畫面將保存於同工作包證據目錄。
- 是否影響正式B版：否。
- 備註與限制：沒有建立聊天介面或第二套品牌。

### 2026-08-30｜安全、回歸與比賽文件

- Commit：完成本筆文件後以Git歷史中的`test: harden WebMCP competition boundaries`定位，完整雜湊於最終證據回填。
- 新增功能：生命週期、安全命名空間、稽核欄位、Build秘密掃描、MVP規格、工具契約、安全模型與三分鐘腳本。
- 使用的WebMCP工具：五工具共同安全邊界。
- 測試指令與結果：`PASS`；15個測試檔、193項測試，TypeScript、ESLint、Production Build及WebMCP Build掃描。
- 畫面或影片證據：待最終瀏覽器驗收。
- 是否影響正式B版：否。
- 備註與限制：`$grill-me`技能在本次環境查無，已在SECURITY_MODEL記錄等效反向稽核，不假稱已使用。
