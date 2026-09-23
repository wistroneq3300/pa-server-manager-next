# PA Server Manager Next — 下一個視窗交接
日期：2026-09-24

## 最高優先：使用者最新決定
- Vera「32 台 Tray × 4 個 C2 節點」的呈現與檢查方式，使用者還要再想。
- **暫停這項功能，不要自動開始實作、改資料模型或改 OS Slots。**
- 本次只整理交接文件。先等待使用者的新決定或最新 FastAPI。
- 單機詳情不需要增加 DPU OS／DPU BMC 的 Ping 顯示或自動探測；這類檢查僅在 Rack Level 才有需求。
- Rack Level 實際要檢查哪些角色、何時檢查、如何呈現，尚未定案。
- 先前助理提出的四角色批次選擇、節點固定 ID、端點操作路由都是建議，不是已完成或已批准的實作規格。

## 唯一 repository 與 Git 狀態
- https://github.com/wistroneq3300/pa-server-manager-next
- **禁止修改原本的 pa-server-manager。** AGENTS／舊技能提到的原 repo 路徑與 push 指令是歷史資料，不能照搬。
- 本機：C:/Users/kobei/Documents/Codex/2026-09-24/pa-server-manager-next-repository-https
- 分支：main。
- 最新功能 commit：`2bc67a7305d0bb87e0c0575a2d2d9c2cb5b70a82`，已 push，已核對遠端一致。
- 上一個功能基準：`08f8a3e`。
- 本文件另隨文件提交保存；最新文件 commit 以 git log 為準。
- 寫本文件之前工作區乾淨。下次仍須 fetch、核對未提交修改與新遠端，不可 reset／覆蓋使用者新增內容，不可 force-push。

## GitHub 已有什麼
1. 原 main 功能、UI／GB300 3D 與工程資訊版面整合。
2. 修正保存失敗被吞掉：唯一暫存檔、flush/fsync、原子替換，API 失敗回傳 503；17 個 inventory 寫入 handler 使用鎖與失敗回滾。
3. Rack API 建立／更新驗證完整 U1–48 區間、重疊與 project；U0 保留未上架。沒有深度資料，前後面共用占用空間。
4. Rack telemetry 先算每台每分鐘平均，再跨設備加總／平均；缺值不補零、不延續。PDU／Power Shelf 分組保留。
5. 單機詳情 OS／BMC IP 旁顯示 MAC：
   - OS：ip a 精確比對 IP 所屬介面。
   - BMC：ipmitool lan print 同一 channel 的 IP／MAC 必須匹配。
   - 無法取得或有歧義顯示「未取得」，不猜測。
   - 背景收集，快取含 slot／IP；前端核對 evidence IP，避免顯示舊 IP 的 MAC。
6. 原有 Rack Level「OS Slots／獨立 OS」功能仍保留。
7. 設計預覽存放 qa/previews；不載入正式入口、不呼叫真實 API。

## GitHub 沒有什麼（務必明確說明）
- **沒有**遍歷 32 台 × 4 節點 × 4 角色的正式 Rack Ping。
- 現有 /api/rack/ping 仍使用機台層級的 OS／BMC 欄位；不是逐 slot／DPU 檢查。
- **沒有**完成 Vera C2／BF4 的新端點資料模型或操作介面。
- **沒有**實作本輪提議的新接線管理工作區。原有 legacy links／topology 仍在。
- qa/previews/vera-endpoint-workspace.html 和 rack-cabling-review.html 都只是示意；截圖與模擬狀態不可當成正式功能或設備驗收。

## Vera 使用者提供的案型（非現場探測）
- 32 台 Compute Tray。
- 每台 4 塊 C2，各有 1 個 Host OS + 1 個 Host BMC。
- 每個 C2 的 Host OS 配一張 BF4，各有 DPU OS + DPU BMC。
- 每 C2 4 IP、每 Tray 16 IP、整櫃 512 IP。
- 256 Vera CPU 是使用者描述的案型背景；不要推定 CPU 數等於 OS 或 IP 數。
- IP 是管理端點，不代表實體線材或 switch port 數。
- 公開參考：https://www.nvidia.com/en-au/data-center/products/vera-rack/
- 實際配置以使用者後續資料為準，不能用公開規格替代其設計。

## OS Slots 審查結論（尚未改造）
- 前端 static/js/product-detail.js：OS Slots 僅 Rack Level 顯示，每 slot 已有獨立 OS／BMC 配對。
- main.py 的 select-os 將 active_os 寫入共用資料，_sync_active_os 將所選 OS／BMC 複製到 machine 頂層，供既有 Terminal／電源／KVM 等使用。
- 風險：多人操作不同 slot 時，共用 active_os 可能改變彼此目標。
- 風險：新 slot 沒有 bmc_ip 時，_sync_active_os 會留下先前 BMC，可能配錯。
- 移除 slot 會重新編號；未來監控／接線需考慮固定節點 ID。
- 建議保留 slot 基礎、每 C2 掛 Host／BF4 端點，操作明確指定端點；**目前只是建議，等使用者決定。**

## 原接線需求（尚未定版）
- 人工設定兩端與線號；左側機櫃、中央圖、右側選線資訊、下方表格是概念。
- 原先需求僅 OS Ping，不新增 Switch Port 探測或 BMC Ping。
- 綠／紅／灰 = 終點 OS IP 可達／不可達／未檢查；不得稱 Link Up/Down 或線材故障。
- 點線查看資料、重新 Ping、進設備詳情是待做需求。
- 後來討論 Vera 多角色端點，不能視為已同意擴大原接線探測範圍；兩者要等使用者重新定案。

## 驗證界線
- qa/reliability_regression.py：13/13 通過；AST 擷取實際函式、mock SSH、臨時資料。不是完整 FastAPI HTTP 測試。
- qa/acceptance.cjs：fixture 23/23 通過。
- qa/engineering-ux.cjs：通過。
- qa/mac_preview.cjs：已取得／未取得 MAC、IP 不匹配回 unknown、接線示意操作及 1024/390/320px 驗證通過。
- Python AST、JS syntax 通過。
- 本輪專用 fixture 預覽曾用 127.0.0.1:8879；8769 曾讀到舊服務，不可當本輪證據。下次先核對服務來源。
- **正式 FastAPI、SSH、IPMI、KVM 與實際設備尚未驗收。**
- JSON 寫入保護仍以單一應用程式 process 為界；不保證跨 process 交易。SSH 驗證會占用寫入鎖。

## 等待最新 FastAPI
- 使用者會另行上傳最新後端；必須保留他的修改，先做三方比對再合併，不能整份覆蓋。
- Terminal 等上傳後再核對，不要現在修改埠設定。
- 區分設備 SSH port（通常 22）、IPMI port（623）與內部 bridge service port。
- 不寫入／覆蓋正式 PA_DATA_DIR；fixture、示範 IP、測試帳密不得進正式資料。
- 不部署、不 restart 原服務、不執行設備電源或測試案例操作。

## 下個視窗先讀
1. 本文件 SESSION_HANDOFF_NEXT_WINDOW_20260924.md（最新決定）
2. AGENTS.md（歷史規則；repo 範圍以本文件與使用者指示優先）
3. SESSION_HANDOFF_RELIABILITY_MAC_20260924.md（實作細節）
4. CODE_REVIEW_20260924.md（原始審查；R1–R3 已有後續修正，其他問題仍待處理）
5. SESSION_HANDOFF_ENGINEERING_MAIN_20260924.md（更早的 UI 整合）

節省上下文：不要每次讀全部歷史交接／測試庫紀錄。依問題用 rg 定位，只讀相關函式；工具輸出保留必要摘要。先確認使用者想繼續哪件事，勿自行啟動暫停中的 32 台功能。
