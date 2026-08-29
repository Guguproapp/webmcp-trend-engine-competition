# B版最終交接｜0.3公開測試版

## 產品定位

「熱門引擎｜爆紅流量情報服務」目前是**真實來源技術測試版**。它協助測試者從可追溯來源尋找、評分、搜尋、篩選、觀察與排除候選熱門議題；分數是系統評估，不代表一定爆紅，也不代表商業模式已成立。

## 最終架構與資料流

React介面只呼叫同網域 `/api`；Cloudflare Pages Functions向GDELT與YouTube官方介面取得資料；D1綁定 `TREND_DB` 保存主題、來源訊號、主題關聯、不同時間快照、來源執行紀錄與更新鎖。觀察、排除及篩選偏好仍由Infrastructure層封裝在目前瀏覽器。

## 真實來源

- GDELT全球新聞資料：正式啟用，保存標題、媒體、發布時間、原始網址、取得時間及衍生指標，不保存新聞全文。
- YouTube影音平台：正式啟用，金鑰只存在Cloudflare加密秘密；目前資料量仍少，只能證明串接成功。
- Google熱門搜尋趨勢：等待Google官方API資格，不使用非官方爬取。
- Threads社群討論：等待官方權限，不使用登入爬蟲。

## 評分與增速

維持熱點評分版本1.0.0及原權重。熱度使用報導密度與YouTube公開統計的標準化結果；新聞篇數不冒充觀看或互動。單一有效快照顯示「正在建立增速基準」且不可判定快速上升；兩次不同時間快照才計算增速。來源數、快照數、欄位完整度與來源狀態共同決定資料信心。

## 安全與正式網址

- 正式網址：<https://trend-engine-b-review.pages.dev/>
- 審核入口：<https://trend-engine-b-review.pages.dev/review>
- `YOUTUBE_API_KEY`、`REFRESH_ADMIN_TOKEN`不進入前端、Git、Local Storage或Build。
- 強制更新只接受伺服器端管理秘密；公開按鈕只取得快取結果。
- CSP、安全標頭、`robots.txt`與`X-Robots-Tag`阻擋索引及第三方嵌入；這些設定不等於登入保護。

## 版本、A／B分離與限制

- 最終分支：`product/trend-discovery-mvp`
- 公開測試Tag：`b-trend-v0.3.0-beta1`
- A版由`internal/operator-console`及A版Tag保存，未打包、未部署、未合併至B版。
- 目前不涵蓋各大社群平台，不含會員、金流、人工智慧影音、OAuth或發布。
- YouTube樣本仍少；尚未驗證每日命中率、付費意願及商業模式。
- 來源失敗時只保留最近一次成功資料，不會回退測試題目。

## 未來重新啟動方式

只有P0無法使用、P1資料／安全／來源中斷、外部測試重複出現高優先問題，或宗億與老孫正式決定繼續時才恢復開發。接手者先讀本文件、`ARCHITECTURE.md`、`LIMITATIONS.md`、`B_PUBLIC_TEST_PLAN.md`與`B_RELEASE_CHECKLIST.md`，再核對正式Tag、線上部署Commit、D1來源狀態與外部測試紀錄。
