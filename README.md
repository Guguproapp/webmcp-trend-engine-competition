# 熱門引擎｜AI 影音發布助手

工作包 001 的交付內容：模組化專案骨架，以及「首次使用｜帳號開通管家」Mock 版。

## 啟動

需求：Node.js 22 以上、npm 10 以上。

```bash
npm install
npm run dev
```

開啟 Vite 顯示的本機網址，預設進入 `/onboarding`。

## 可驗收範圍

- 「我已有部分帳號」：為 YouTube、Instagram、Facebook、TikTok 分別選擇已有、希望開通或略過。
- 「我完全沒有帳號」：先選平台，再填一次共同品牌資料，查看各平台資料預覽。
- 註冊引導：只提供官方註冊網址；收信、驗證碼、雙重驗證與條款都由使用者本人在官方頁面完成。
- Mock OAuth：可模擬成功、取消、權限不足、Token 過期及平台錯誤。
- 平台連接管理：可模擬過期、重新授權、解除連接，並查看稽核紀錄。
- 主控台：只顯示後續模組「尚未開放」空狀態。

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
- `.env.example` 只有變數名稱與假值，沒有正式密鑰。
- 未部署、未串正式 API、未建立第三方帳號。
