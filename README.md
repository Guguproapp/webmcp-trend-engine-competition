# 熱門引擎｜AI 影音發布助手

目前包含兩個可獨立驗收的 Mock 工作包：

- 工作包 001：模組化專案骨架與「首次使用｜帳號開通管家」。
- 工作包 002：「爆紅熱門精選」蒐集、合併、評分、搜尋、篩選、觀察與排除。

所有熱門題目與授權狀態均為測試資料，不代表真實新聞、正式平台連接或外部 API 結果。

## 啟動

需求：Node.js 22 以上、npm 10 以上。

```bash
npm install
npm run dev
```

開啟 Vite 顯示的本機網址，預設進入 `/trends`。

## 工作包 002 可驗收範圍

- `/trends`：動態日期、更新統計、22 個 Mock 主題與高潛力排序。
- `/trends/search`：完整搜尋、篩選與七種排序，重新整理後保留條件。
- `/trends/:topicId`：逐一呈現來源證據、熱度變化、分數拆解、加扣分與資料缺口。
- `/trends/watchlist`：保存加入時間、加入時分數、目前分數與升降變化。
- `/trends/excluded`：保存排除原因、可取消排除，並留下稽核紀錄。
- `/trends/rules`：保存與套用篩選規則。
- 「更新資料」會重新執行 Mock 蒐集、相同主題合併、評分與排序。

## 工作包 001 保留範圍

- 「我已有部分帳號」：為 YouTube、Instagram、Facebook、TikTok 分別選擇已有、希望開通或略過。
- 「我完全沒有帳號」：先選平台，再填一次共同品牌資料，查看各平台資料預覽。
- 註冊引導：只提供官方註冊網址；收信、驗證碼、雙重驗證與條款都由使用者本人在官方頁面完成。
- Mock OAuth：可模擬成功、取消、權限不足、Token 過期及平台錯誤。
- 平台連接管理：可模擬過期、重新授權、解除連接，並查看稽核紀錄。
- 帳號開通管家原始路由、Mock OAuth、連接管理與稽核紀錄完整保留。

畫面中的授權狀態全部是 Mock，不是正式平台連接。

## 指令

```bash
npm run test
npm run typecheck
npm run lint
npm run build
```

## 文件

- [架構與資料流](docs/ARCHITECTURE.md)
- [模組責任](docs/MODULES.md)
- [Provider／Adapter 介面](docs/ADAPTERS.md)
- [測試與 Mock 操作](docs/TESTING.md)
- [本輪驗證結果](docs/VERIFICATION.md)
- [Supabase 與正式 OAuth 接入點](docs/FUTURE-INTEGRATIONS.md)
- [本輪限制](docs/LIMITATIONS.md)

## 安全邊界

- 不提供平台密碼或驗證碼欄位。
- 不把正式 Token 存進 Local Storage；本輪根本不產生真實 Token。
- Mock OAuth 交易以 Session Storage 暫存 `state`，並預留 PKCE challenge 欄位。
- Local Storage 僅由 Infrastructure Repository 封裝使用。
- 熱門資料頁只呼叫 `TrendDiscoveryService` 與 Repository，不直接讀取 Mock JSON 或 Local Storage。
- `.env.example` 只有變數名稱與假值，沒有正式密鑰。
- 未部署、未串正式 API、未建立第三方帳號。
