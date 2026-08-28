# 熱門引擎｜爆紅流量情報服務

蒐集正在快速上升的熱門議題，透過熱度、增速、社會共鳴、跨平台程度與風險進行評分及篩選。

本分支是準備對外測試的公開測試版，只包含熱門蒐集、評分、搜尋、篩選、證據、觀察及排除。所有題目均為明確標示的展示資料，不代表真實新聞或外部資料來源結果。

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

開啟 Vite 顯示的本機網址，預設進入 `/review`。

## 公開測試版第二次測試候選版

- 審核網址：<https://trend-engine-b-review.pages.dev/review>
- 部署平台：Cloudflare Pages Direct Upload（免費方案）。
- 公開方式：知道網址即可開啟，不需要登入。
- 收錄限制：HTML、`robots.txt` 與回應標頭均要求搜尋引擎不要建立索引；此限制不是存取控制，網址仍可由取得連結的人開啟。
- 資料聲明：全站均顯示「展示審核資料｜非即時熱門情報」。

審核前可在 `/review` 按「重設審核資料」，只會清除公開測試版熱門情報使用的瀏覽器本機保存空間，再恢復 22 個展示題目與 61 筆來源訊號。

## B 版可驗收範圍

- `/trends`：動態日期與摘要、高潛力前 5 名、22 題展開、分數環與既有時間序列趨勢線。
- `/trends/search`：基本／進階搜尋篩選、有效條件摘要與七種排序，重新整理後保留條件。
- `/trends/:topicId`：來源證據、熱度變化、分數拆解、加扣分與資料缺口。
- `/trends/watchlist`：加入時間、加入時分數、目前分數與升降變化。
- `/trends/excluded`：排除原因、即時撤銷、取消排除與操作紀錄。
- `/trends/rules`：保存與檢視篩選規則。
- `/review`：第二次測試候選版範圍、展示資料聲明、審核步驟與資料重設入口。

非 B 版路由會顯示「此功能不屬於目前產品」，不會載入其他產品線頁面。

## 驗證指令

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

`npm run build` 最後會執行公開 Build 隔離檢查；若產物包含 A 版專屬路由、頁面識別、公開工程術語或必要部署檔案缺漏，指令會失敗。

## 文件

- [架構與產品邊界](docs/ARCHITECTURE.md)
- [模組責任](docs/MODULES.md)
- [熱門來源 Provider](docs/ADAPTERS.md)
- [測試方式](docs/TESTING.md)
- [驗證結果](docs/VERIFICATION.md)
- [未來熱門來源接入點](docs/FUTURE-INTEGRATIONS.md)
- [限制與停止點](docs/LIMITATIONS.md)
- [B 版審核操作指南](docs/B_REVIEW_GUIDE.md)
- [B 版審核清單](docs/B_REVIEW_CHECKLIST.md)

## 安全邊界

- Local Storage 只由 Infrastructure Repository 封裝。
- 頁面只呼叫 `TrendDiscoveryService`，不直接讀取 Mock 資料或瀏覽器儲存。
- `.env.example` 沒有正式密鑰。
- 未連接正式來源或會員；公開網址只部署 B 版靜態 `dist` 產物。
