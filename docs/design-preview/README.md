# Wistron UI 設計預覽

目前設計提案的首頁名稱為「系統架構總覽」，涵蓋 GPU 與非 GPU 設備／專案。
本目錄保留使用者已看過的提案：Wistron 藍綠方向、深淺主題、完整異常清單、
一致的 Ping 圖例、主要操作層級，以及既有 3D 設備材質。

## 啟動

需要 Python 3.9 以上，不需安裝第三方 Python 套件。在 repository 根目錄執行：

```text
python docs/design-preview/server.py --port 8886
```

在 Chrome 開啟 http://127.0.0.1:8886/ 。若該埠已使用，可指定另一個 `--port`。
結束預覽時在啟動的終端機按 Ctrl+C。程式僅監聽 loopback。

## Review 基準

- `proposal.js` / `proposal.css` 是目前設計提案，`server.py` 注入同一 checkout 的原有前端。
- 預設顯示「設計提案」；頁首可以切換「原版」、首頁／Rack 及深淺色主題。
- 評估目前 UX/UI 時必須檢查這份提案；只讀 `static/` 會看到原有實作。
- 「原版」仍包含比較工具列及示範資料，並不是正式環境的畫面或資料。
- 架構、API、Telemetry、Terminal/KVM 等正式功能仍以 repository 的實作為準。
- 原型採用 `static/js/preview-fixtures.js` 的合成資料；伺服器不提供正式 API 或
  WebSocket 轉送。這個頁面不能驗證真實設備、權限或硬體操作。
- 發現問題時，請分清「提案仍存在的問題」、「原版已被提案改善的問題」與
  「尚未正式整合的工作」，不要將改善提案寫成已上線功能。

設計原則與既有抽查結果見 [設計方向](../design-direction.md)；
[原始設計評估](../design-review.md) 是針對 `0bb60acc` 的歷史基準。
這次將預覽納入 Git 不代表正式套用提案或部署。
