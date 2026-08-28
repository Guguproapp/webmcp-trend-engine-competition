# 驗證結果

驗證日期：2026-08-28（Asia/Taipei）

## 工作包 002

| 項目 | 結果 | 實際證據 |
|---|---|---|
| 單元與流程測試 | PASS | Vitest：9 個測試檔、33 項測試全數通過 |
| Mock 蒐集與合併 | PASS | 22 個主題、多來源訊號；相同 `canonicalKey` 合併並保留來源 |
| 分數與門檻 | PASS | 7 項加權、競爭／風險／信心扣分、高風險、證據不足與自然事件門檻均有測試 |
| 搜尋、篩選、排序 | PASS | 瀏覽器套用 AI／科技與AI／YouTube／最低50分後為1筆；重新整理條件仍相同 |
| 更新資料 | PASS | 瀏覽器顯示「已重新彙整、評分並排序」，更新時間與 Refresh Log 更新 |
| 觀察清單 | PASS | 瀏覽器加入、重新整理保留、移出、再加入；顯示加入時與目前分數 |
| 排除清單 | PASS | 瀏覽器保存「競爭過度」、重新整理保留、取消排除、再排除 |
| 熱度證據 | PASS | 詳情頁顯示4筆來源、4列熱度變化、7項子分數及加扣分／缺漏原因 |
| 動態日期 | PASS | 畫面使用系統日期 `Intl.DateTimeFormat`；自動測試確認未硬編碼特定日期 |
| TypeScript | PASS | `npm run typecheck` exit 0 |
| Lint | PASS | `npm run lint` exit 0、0 warning |
| Production Build | PASS | Vite 8.2.2，58 modules transformed，產生 `dist` |
| 桌面 1440×900 | PASS | 精選、完整篩選、詳情、觀察、排除及 onboarding 均可操作，無水平溢出 |
| 平板 768×1024 | PASS | 上述6個主要路由逐頁 `scrollWidth = clientWidth` |
| 手機 390×844 | PASS | 底部導覽、更新按鈕與主要頁面可操作；上述6個主要路由無水平溢出 |
| 帳號開通回歸 | PASS | `/onboarding` 兩入口與安全提示存在；點擊已有帳號可到 `/onboarding/existing-accounts` |
| 敏感欄位 | PASS | 瀏覽器確認 0 個 password、0 個 one-time-code 欄位 |
| 瀏覽器 Console | PASS | 最終 error／warning 記錄 0 筆 |

截圖保存在 `evidence/work-package-002/`：桌面精選、手機精選、完整篩選、證據詳情、觀察、排除、帳號開通回歸共7張。

未執行正式熱門來源、真實帳號資料、正式 API、Supabase、正式部署或真實裝置驗證；上述 PASS 只代表本機 Mock 工作包 002。

## 工作包 001 基準

| 項目 | 結果 | 實際證據 |
|---|---|---|
| 單元與流程測試 | PASS | Vitest：4 個測試檔、14 項測試全數通過 |
| TypeScript | PASS | `npm run typecheck` exit 0 |
| Lint | PASS | `npm run lint` exit 0、0 warning |
| Production Build | PASS | Vite 8.2.2，45 modules transformed，產生 `dist` |
| npm 套件稽核 | PASS | 252 packages audited，0 vulnerabilities |
| 已有帳號流程 | PASS | 瀏覽器選擇 YouTube → 進度 → Mock OAuth → callback → 模擬連接成功 |
| 完全沒有帳號流程 | PASS | 入口先到共同資料 → 選平台 → 顯示預覽 → 需要註冊進度 |
| 進度保存 | PASS | 填寫名稱與代稱後重新整理，欄位值仍存在；授權成功後重新整理狀態仍存在 |
| Mock 狀態 | PASS | 自動測試涵蓋成功、取消、權限不足、過期、平台錯誤、state 不一致 |
| 重授權與解除 | PASS | 瀏覽器實測過期 → 重授權成功 → 解除連接 |
| 敏感欄位 | PASS | 自動測試與瀏覽器皆確認 0 個 password、0 個 one-time-code 欄位 |
| 桌面 1440×900 | PASS | 入口、進度與 Mock 授權可操作，scrollWidth = clientWidth |
| 平板 768×1024 | PASS | 入口兩卡可見，scrollWidth = clientWidth |
| 手機 390×844 | PASS | 共同資料、平台預覽、進度與 5 個 Mock 結果按鈕可操作，無水平溢出 |
| 瀏覽器 Console | PASS | 最終 error／warning 記錄 0 筆 |

未執行正式平台、真實裝置、正式資料庫或正式部署驗證；上述 PASS 僅代表本機 Mock 工作包 001。
