# 本機瀏覽器驗收

日期：2026-09-02（台北時間）  
入口：`http://127.0.0.1:8792/radar-tools`

## 原生 WebMCP

- ChatGPT 內建瀏覽器真正發現六個唯讀工具：PASS。
- 頁面狀態顯示「6 個唯讀工具已就緒」：PASS。
- `limit=500` 原生工具呼叫遭拒：PASS。
- 嘗試呼叫未註冊的排程管理工具遭拒：PASS。
- 真實資料呼叫：BLOCKED；比賽版 Pages 尚未設定專用 `RADAR_PROGRAM_API_TOKEN`，未借用原版 B 或雷達管理秘密。

## 一般網站備援

- 搜尋表單可操作：PASS。
- 缺少Secret時顯示安全中文錯誤，不白畫面、不顯示假資料：PASS。
- 深層路由直接載入及重新整理：PASS。
- Console：0 error、0 warning。

## 響應式

| 尺寸 | 水平溢出 | 最小可見控制高度 | WebMCP狀態 | 結果 |
|---|---:|---:|---|---|
| 1440×900 | 無 | 44px | 6工具就緒 | PASS |
| 768×1024 | 無 | 44px | 6工具就緒 | PASS |
| 390×844 | 無 | 44px | 6工具就緒 | PASS |

手機底部導覽固定於畫面底部；「更多」選單完整顯示在導覽上方，未遮住選單內容。

截圖：

- `evidence/webmcp-radar-tools/01-radar-desktop.png`
- `evidence/webmcp-radar-tools/02-radar-tablet.png`
- `evidence/webmcp-radar-tools/03-radar-mobile.png`

Safari：NOT RUN。本輪沒有用一般瀏覽器自動化冒充原生 WebMCP；Safari只應驗證一般UI安全降級。
