# 架構說明

本專案採「模組化單體」：目前是一個可部署單位，但程式依商業領域切成模組，每個模組再分成 domain、application、infrastructure、presentation、tests。

## 依賴方向

```text
presentation → application → domain
                    ↑
             infrastructure
```

- `domain`：型別、狀態與商業規則，不依賴 React 或瀏覽器儲存。
- `application`：使用案例、Repository 與 Provider 介面。
- `infrastructure`：Local Storage、Session Storage 與 Mock Provider 實作。
- `presentation`：React 頁面、表單與畫面狀態。
- `tests`：領域、Repository、流程與安全檢查。

頁面不可直接存取 Local Storage；它只呼叫 Repository 或 Application Service。正式資料庫上線時可替換 Infrastructure 實作，不需重寫頁面。

## 帳號開通資料流（工作包 001）

1. 使用者在 onboarding 頁選擇帳號現況。
2. Presentation 呼叫 `OnboardingProgressRepository` 保存選擇。
3. `PlatformConnectionService` 統一改變連接狀態並寫入 Audit Log。
4. `MockPlatformAuthorizationProvider` 建立站內模擬授權網址。
5. Callback 驗證 `state`，回傳模擬結果並執行模擬連接測試。
6. Repository 將品牌、進度、連接與稽核分開保存。

## 熱門蒐集資料流（工作包 002）

```text
MockTrendSourceProvider
  → TrendDiscoveryService（合併、評分、狀態判定）
  → TrendTopicRepository／Watchlist／Exclusion／FilterRule／RefreshLog
  → React Presentation
```

1. `TrendSourceProvider` 回傳來源訊號；本輪唯一實作是 `MockTrendSourceProvider`。
2. `TrendDiscoveryService` 依 `canonicalKey` 合併相同主題，再交由 `TrendScoreCalculator` 計算。
3. 分數權重與自然事件、高風險、證據不足規則只存在 Domain，不寫在 UI。
4. 搜尋、篩選、排序、觀察、排除與重新整理保存都經由 Application Service 與 Repository。
5. Local Storage 只由 Infrastructure 實作讀寫，未來換成 Supabase 時不需改頁面。
6. 排除、取消排除、加入與移出觀察會寫入既有 Audit Log。

## 安全預留

- `PlatformAuthorizationProvider` 要求授權 URL、callback、刷新、撤回、檢查與測試連接能力。
- callback 輸入包含 `state` 與 `expectedState`。
- 授權起始流程建立 PKCE verifier/challenge 預留欄位。本輪是明確標示的 Mock；正式接入必須在伺服器端使用 RFC 7636 S256。
- 未來正式 Token 必須在伺服器加密保存，前端只能取得無敏感資訊的連接摘要。
- 授權、撤回與狀態改變都透過 Service 留下稽核紀錄。
