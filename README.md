# 熱門引擎｜爆紅流量情報SaaS

蒐集正在快速上升的熱門議題，透過熱度、增速、社會共鳴、跨平台程度與風險進行評分及篩選。

本分支是準備對外推出的 B 版，只包含熱門蒐集、評分、搜尋、篩選、證據、觀察及排除。所有題目均為明確標示的 Mock 測試資料，不代表真實新聞或外部 API 結果。

## A／B 產品線

| 版本 | Git 分支 | 定位 | 本分支是否包含 |
|---|---|---|---|
| A 版 | `internal/operator-console` | 宗億自用營運工作台，未來另行續作 | 否；由獨立分支與 Tag 保存 |
| B 版 | `product/trend-discovery-mvp` | 對外爆紅流量情報產品 | 是 |

A 版封存 Tag：`account-onboarding-mock-v0.1.0`、`internal-console-v0.1.0`。B 版不包含 A 版的帳號、影音及發布功能。

## 啟動

需求：Node.js 22 以上、npm 10 以上。

```bash
npm install
npm run dev
```

開啟 Vite 顯示的本機網址，預設進入 `/trends`。

## B 版可驗收範圍

- `/trends`：動態日期、更新統計、22 個 Mock 主題與高潛力排序。
- `/trends/search`：完整搜尋、篩選與七種排序，重新整理後保留條件。
- `/trends/:topicId`：來源證據、熱度變化、分數拆解、加扣分與資料缺口。
- `/trends/watchlist`：加入時間、加入時分數、目前分數與升降變化。
- `/trends/excluded`：排除原因、取消排除與稽核紀錄。
- `/trends/rules`：保存與檢視篩選規則。

非 B 版路由會顯示「此功能不屬於目前產品」，不會載入其他產品線頁面。

## 驗證指令

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

`npm run build` 最後會執行公開 Build 隔離檢查；若產物包含 A 版專屬路由、頁面識別或文案，指令會失敗。

## 文件

- [架構與產品邊界](docs/ARCHITECTURE.md)
- [模組責任](docs/MODULES.md)
- [熱門來源 Provider](docs/ADAPTERS.md)
- [測試方式](docs/TESTING.md)
- [驗證結果](docs/VERIFICATION.md)
- [未來熱門來源接入點](docs/FUTURE-INTEGRATIONS.md)
- [限制與停止點](docs/LIMITATIONS.md)

## 安全邊界

- Local Storage 只由 Infrastructure Repository 封裝。
- 頁面只呼叫 `TrendDiscoveryService`，不直接讀取 Mock 資料或瀏覽器儲存。
- `.env.example` 沒有正式密鑰。
- 未連接正式來源、未建立會員、未部署。
