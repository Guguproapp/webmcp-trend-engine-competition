# B 版真實熱門情報測試

```bash
npm install
npm test
npm run typecheck
npm run lint
npm run build
```

測試包含既有評分、搜尋、篩選、觀察與排除，以及 GDELT／YouTube轉換、來源失敗、YouTube缺少金鑰與配額、重複訊號、事件合併、第一次與第二次快照、跨來源、證據不足、D1結構、前端秘密隔離、Production展示資料隔離、手機四項導覽及「更多」選單無障礙。

`npm run build` 會檢查 `_redirects`、`robots.txt`、`_headers`、A版識別、展示題目、秘密變數名稱與必要中文介面。任一項失敗不得部署。

正式驗收需以 `pages.dev` 深層網址逐頁開啟及重新整理，檢查桌面1440×900、平板768×1024、手機390×844、水平溢出、Console、來源原始連結、來源失敗提示及安全標頭。
