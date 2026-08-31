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

- Commit：`14fd91af01b385a54602f6efb6c17dcbd8c76614`
- 新增功能：生命週期、安全命名空間、稽核欄位、Build秘密掃描、MVP規格、工具契約、安全模型與三分鐘腳本。
- 使用的WebMCP工具：五工具共同安全邊界。
- 測試指令與結果：`PASS`；15個測試檔、193項測試，TypeScript、ESLint、Production Build及WebMCP Build掃描。
- 畫面或影片證據：待最終瀏覽器驗收。
- 是否影響正式B版：否。
- 備註與限制：`$grill-me`技能在本次環境查無，已在SECURITY_MODEL記錄等效反向稽核，不假稱已使用。

### 2026-08-31｜原生 WebMCP 實驗瀏覽器相容性修正

- Commit：`56242f1c1971035b96f5d3523cd0f65519f9bca6`
- 新增功能：修正React StrictMode雙重掛載造成的短暫重複註冊、實驗瀏覽器未傳execute options、以及既有中文主題ID被錯誤拒絕三項真實流程問題。
- 使用的WebMCP工具：五工具共同註冊生命週期；三個只讀工具完成原生呼叫。
- 測試指令與結果：`PASS`；15個測試檔、196項測試，TypeScript、ESLint、Production Build及秘密掃描。
- 畫面或影片證據：`evidence/work-package-004/browser/`與`evidence/work-package-004/green/01-native-read-tools.json`。
- 是否影響正式B版：否。
- 備註與限制：原生搜尋回傳3個真實GDELT候選，證據與來源狀態回傳結構化結果；全部候選只有一次快照，因此誠實標示資料不足、沒有假增速。

### 2026-08-31｜本機瀏覽器、安全與響應式證據

- Commit：`b708e82efe444a24a92bcdff2d1e849a5c32a582`
- 新增功能：原生工具清單、三個只讀工具輸出、逾時／Abort零寫入、Safari安全降級、三種尺寸與安全掃描證據。
- 使用的WebMCP工具：`search_trends`、`get_trend_evidence`、`get_source_status`，以及`add_trend_to_watchlist`的待確認與逾時中止流程。
- 測試指令與結果：只讀工具`PASS`；寫入確認前零變更、逾時與Abort`PASS`；真人確認成功與成功後撤銷`BLOCKED`。
- 畫面或影片證據：`evidence/work-package-004/browser/`、`evidence/work-package-004/green/`、`evidence/work-package-004/security/`。
- 是否影響正式B版：否。
- 備註與限制：兩次開啟真人確認窗口均未收到真人按鍵，瀏覽器逾時後零寫入；不得由代理自動按確認冒充真人證據。
