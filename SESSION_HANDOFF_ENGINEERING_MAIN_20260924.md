# Next main 整合交接 — 2026-09-24

## 工作範圍

使用者授權整合並 push 到 `wistroneq3300/pa-server-manager-next/main`。原本 `pa-server-manager` 不在範圍。

- 起點遠端 main：`93bcc09ac90c0c6d9242b7433b8130a70920712c`。
- UI 起點：`03c9b5e596440e582fc74b720e5381c34c623ef9`，已包含上述 main 的祖先歷史。
- 工作分支：`integration/engineering-ux-20260924`，從 origin/main 建立後 fast-forward 到 UI 起點；沒有 force-push 或以檔案覆蓋取代合併。
- 本輪主實作：`static/js/engineering-ux.js`、`static/css/engineering-ux.css`；app.js 僅修感測顯示與非同步機台核對，KVM 僅修狀態文案／計數，index 更新資源引用。
- 原 main 的多 OS、廣播終端、IP 修改、後端流程保留。既有 GB300 首頁插入／機櫃幾何保留，正式配置仍資料驅動。
- 新增執行期依賴：無。測試庫資料與工作簿：未修改。

## 必讀

`CODE_REVIEW_20260924.md`：已修項目、8 個尚待處理問題、重現與驗證界線。
`qa/artifacts/engineering-ux.json`、`acceptance.json`、`equipment-workspace.json`、`gb300-rack.json`（若套件輸出檔名不同以 qa 腳本為準）及工程版面截圖。

## 明天導入 FastAPI

1. 從 Next 的 main 取得整合版本；若部署 checkout 有未提交改動，先 commit／備份再合併，不要硬 reset。
2. 備份正式 `PA_DATA_DIR`（data.json、telemetry.db、tests.json 與配置），不要用 repository sample data 或 fixture 覆蓋。
3. FastAPI 使用 repo 的 `static/index.html` 與完整 static 目錄。`serve.py` 是隔離預覽，不是正式部署方式；不要將 `preview-fixtures.js` 注入正式入口。
4. 主服務與 Terminal bridge 使用相同 `PA_DATA_DIR`，並明確設定相同 `TERM_BRIDGE_PORT`（目前兩邊程式預設值不同）。沿用既有服務／反向代理部署方式，不另起衝突實例。
5. 先只讀驗證專案、單機、硬體、Sensors、Telemetry，再用可控測試設備驗證 Terminal／KVM。開關機／Broadcast 等另選維護窗口確認，不能拿 fixture 驗收取代。
6. Rack 非 Server collector 仍有 stub、統計與 U 驗證問題見報告；不得承諾「一接就全功能正常」。

## 後續工作

先處理功率聚合、API 占用驗證、可靠持久化與部署埠一致性；再做資料新鮮度、批次操作結果、拓樸聚焦與硬體實體位置視覺。
本機完整 pytest 因未安裝 pytest 未跑；GPU 純解析 6 項及 10 模組 AST 通過。只做 fixture／mock 測試，未碰真實設備。
