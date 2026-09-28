# Repository review 延續狀態

更新：2026-09-28。本檔追蹤進度；[完整 review](repository-review-2026-09-28.md) 保留原始分析、Impact/Risk/Effort 與程式碼證據。

## 基準與目前範圍

- Review 基準：`9f3ac044f4aed0fcccc906e712dd4defd4e77657`。接續時先檢查目前 HEAD／工作目錄。
- 12 個面向已分析。2026-09-28 使用者授權開始修正、回歸測試及推送；第一批處理 F01，其餘列維持原狀。
- 最新設計在 `docs/design-preview/`，首頁「系統架構總覽」；保留 Wistron 藍綠、深淺主題、GPU／非 GPU 範圍與 3D 材質。
- 設計提案已推送，正式 UI 尚未套入。完整 review 作歷史基準隨 F01 修正納入版本管理；發布狀態見 PROJECT_STATUS.md。
- 接續先讀 AGENTS.md、PROJECT_STATUS.md、本檔，再依需求讀報告的 F-ID／面向，無需重做全部審查。

## 改善佇列

「待處理」表示未實作，不代表全部問題都經實機重現。完整驗收條件及工時在原報告排序表。

| 順序 | Finding | 主題 | 狀態／證據 |
|---|---|---|---|
| 1 | F01 | target／stored secret 綁定 | 已修正，待本批推送；main.py、terminal_bridge/server.js、static/js/app.js。Terminal target/user/port/slot 綁定；probe-bmc 拒絕新目標借用密碼；change-os-ip 改用明確輸入帳密。Python 88 項、Terminal handler 與 Chrome fixture 回歸通過；未驗實機，F02 授權與 F03b 身份 enrollment 仍待處理。 |
| 2 | F02 | API／bridge auth 與設備授權 | 待處理；外部 proxy/SSO 未驗證 |
| 3 | F03 | Git／inventory 憑證分離 | 待處理；現役有效性未驗證 |
| 4 | F04、F05 | 告警誤解除、LLM 在 DB 交易內 | 待處理；隔離重現 |
| 5 | F06 | Terminal URL／SSH cleanup | 待處理；隔離重現 |
| 6 | F07、F07b、F07c | Broker expiry/cap/async、KVM logout | 待處理；部分隔離重現，未驗實機 |
| 7 | F08、F09 | L10/L11 mutation、link identity | 待處理；隔離重現 |
| 8 | F10 | Test variant／AI advice | 待處理；原始碼與資料統計 |
| 9 | F03b | SSH／BMC identity enrollment | 待處理；需分批驗相容性 |
| 10 | F11、F15 | inventory 鎖、探測併發 | 待處理；未做容量 benchmark |
| 11 | F18、F19 | 新提案互動／語意、表單 labels | 待處理；完整清單搜尋保留已在 Chrome 重現 |
| 12 | F14 | Rack Ping 保留場景／視角 | 待處理；原始碼路徑確認 |
| 13 | F16、F17 | 建置版本、測試環境／CI | 待處理 |
| 14 | F12、F13 | 模組化、domain model | 待處理；需漸進遷移 |
| 15 | F15b | Static cache／按需載入 | 待處理；未量測收益 |
| 16 | 功能方向 | Collectors、operation jobs、證據追蹤 | 構想；未選定實作範圍 |

## 已有驗證與限制

- 81 項隔離 Python regression、Node operations/equipment regression 通過；這是當時結果，不是未來修改的驗證。
- Terminal 重現不開 socket；broker／告警使用記憶體 SQLite。沒有操作正式設備或資料庫。
- 新 proposal 首頁深／淺、Rack 已視覺檢查；搜尋無結果後「查看完整清單」仍為 0 台已重現。
- 新版已改善完整異常 queue、Ping 字詞、部分功能字級與窄版 CSS，不應再列為提案缺少的改善。
- 未完成：pytest suite（當時缺套件）、完整 ASGI/security integration、proxy/SSO/firewall、實機 KVM/Telemetry、全站可及性與容量測試。
- 原視覺 critique 的 28/40 屬於 `0bb60acc`，不是新版提案的分數。

## 後續維護

更新受影響的列，記錄實際 commit／檔案、測試與限制；區分設計、程式、fixture、實機、推送與部署。
同步更新 PROJECT_STATUS.md。没有新證據就維持待處理；舊對話的 push／部署要求不是永久授權。
