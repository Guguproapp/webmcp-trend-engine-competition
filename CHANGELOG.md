# Changelog

## 0.2.0-rc2 - 2026-08-29

- 首頁改為高潛力前 5 名，支援展開 22 題及動態白話摘要。
- 熱門卡片加入分數環、克制排名及既有時間序列趨勢線，降低第一層資訊密度。
- 搜尋改為基本／進階篩選，顯示啟用條件數、結果數與條件摘要。
- 強化觀察、排除、空狀態 CTA、即時撤銷、鍵盤焦點、文字對比及 reduced-motion。
- 統一 RC2 品牌配色並移除公開畫面的工程術語，保留 A／B 產品隔離。

## 0.2.0-rc1 - 2026-08-28

- 新增 `/review` 審核入口、B 版 RC1 說明、操作步驟與全站 Mock 標示。
- 新增 `ReviewResetService`，只重設 B 版熱門情報 namespace 並恢復 22 題／61 訊號。
- 加入 Cloudflare Pages SPA fallback、搜尋引擎阻擋與安全回應標頭。
- 加入審核指南、審核清單、部署產物檢查與正式網址驗收證據。
- 以 Cloudflare Pages Direct Upload 提供免費 `pages.dev` 公開審核網址。

## 0.2.1 - 2026-08-28

- 建立 A 版永久分支 `internal/operator-console` 與封存 Tag `internal-console-v0.1.0`。
- 建立 B 版正式開發分支 `product/trend-discovery-mvp`。
- 從 B 版移除 A 版專屬路由、頁面、服務、模組入口與公開品牌文案。
- 新增非 B 版路由邊界頁及公開 Build 隔離檢查。
- 保留工作包 002 的熱門蒐集、評分、搜尋、篩選、證據、觀察及排除功能。

## 0.2.0 - 2026-08-28

- 完成 `trend-discovery` Mock 流程與 22 個測試主題。
- 完成搜尋、篩選、七種排序、來源證據、觀察及排除。

## 0.1.0 - 2026-08-28

- A 版原始基準；內容已由 `internal/operator-console` 及兩個封存 Tag 保存。
