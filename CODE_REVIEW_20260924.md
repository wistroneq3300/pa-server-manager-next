> 2026-09-24 local follow-up: R1-R3 and MAC changes are documented in SESSION_HANDOFF_RELIABILITY_MAC_20260924.md. The user authorized publishing this increment to Next main; it is not deployed; the review below records the earlier baseline. Cabling is a layout preview only.

# PA Server Manager Next — 整合版程式審查

日期：2026-09-24。範圍只限 `wistroneq3300/pa-server-manager-next`。

## 結論

本次將既有 `main` 功能歷史與 `astra-cinematic-ui` 的 UI／3D 歷史整合，並新增工程資訊版面改善。未替換框架、未新增執行期依賴、未修改 API contract、未改寫測試庫內容。

**程式整合完成不等於真實設備驗收完成。** 瀏覽器驗收使用 `serve.py` 的 fixture；正式入口是 FastAPI 提供的 `static/index.html`，不注入 fixture。下列既有後端問題仍待修正，不能以漂亮的畫面或通過前端驗收掩蓋。

## 審查範圍與證據

- 第一方主要路徑：`main.py` 的機台／機櫃更新、持久化、感測、診斷、Terminal/KVM、Telemetry；`telemetry_core.py` 的採集及聚合；`terminal_bridge/server.js`；SP-X broker 的認證介面、session、secret store；前端路由、資訊呈現、圖表、機櫃、測試庫、KVM 與本次增量。
- 這是跨模組程式審查與 fixture 回歸，不是第三方依賴逐行稽核、滲透測試或全設備相容性認證。未重新判定 3,112 個測試案例，未執行案例指令。
- 可重現證據：`python qa/review_reproductions.py`。以 AST 擷取三個現有函式並注入假的儲存／採樣來源；不啟動服務、不接設備、不寫正式資料。輸出確認目前缺陷，**不是缺陷已修復的綠燈測試**。
- 截圖與機器可讀結果在 `qa/artifacts/`。

## 尚未修正：按優先順序

### R1 · P1 — 整櫃總和重複累加同分鐘的採樣

- 位置：`telemetry_core.py:get_rack_series`（約 811–916 行，`all_pts` 與 `agg`）。
- 證據：單台 PDU 一分鐘 4 筆 100 W，被回傳為 400 W。採樣頻率改變會改變「功率總和」；不是正常能量積分。
- 影響：GPU 功耗、電力、電流、流量與流量速率等 sum 指標可能被高估；avg 也會讓採樣較密的設備權重更大。
- 建議：先定義每台每分鐘代表值與缺值規則，再跨設備聚合。瞬時功率用 latest／mean 必須明訂；能量另以時間積分及 Wh 表示。另防止上游 PDU 與下游 Power Shelf 重複計量。
- 狀態：離線重現確認，未改動後端聚合語意。

### R2 · P1 — 正式 Rack API 沒有完整的占用驗證

- 位置：`main.py:edit_machine`（約 600 行）、`add_rack_passive` 路徑。
- 證據：更新 `rack_u=2, rack_size=4` 回傳成功，底部會落在 U-1；兩欄只各自限界，沒有整體範圍／重疊檢查。
- 影響：前端有驗證仍擋不住直接 API、多使用者同時放置，或匯入的錯誤配置。
- 建議：對候選資料先檢查 1–48U、底部、前後面占用規則與重疊，全部通過再原子提交；未放置保留 `rack_u=0`。拒絕時不能先改掉 project 等其他欄位。
- 狀態：離線重現確認。前端 3D 可以提示異常，但不等於後端已保護。

### R3 · P1 — 寫入失敗被吞掉，呼叫端仍可能回傳成功

- 位置：`main.py:_save_data`（約 92 行）。
- 證據：模擬磁碟寫入 PermissionError，函式只 print 後正常返回。
- 影響：畫面顯示已保存，但重新啟動資料消失。固定 `.tmp` 路徑與共用記憶體狀態也有並行寫入風險（並行部分為靜態判讀，未做壓測）。
- 建議：鎖定 read/modify/write 交易、使用唯一暫存檔、錯誤回傳給 API；寫入成功前不要向使用者承諾持久化。多人使用可再評估 SQLite 交易儲存。

### R4 · P1（部署）— Terminal bridge 預設連接埠不一致

- 位置：`main.py:TERM_BRIDGE_PORT` 約 2153 行預設 **7001**；`terminal_bridge/server.js` 約 14 行預設 **6968**。
- 影響：乾淨部署若沒設定共同環境值，前端看得到 Terminal，但 FastAPI 代理會找錯服務。
- 建議：部署時兩個服務明確設定相同 `TERM_BRIDGE_PORT`；再統一程式預設與文件。未擅自改既有服務設定。

### R5 · P1（部署條件）— 必須確認管理操作的存取邊界

- 位置：主 FastAPI 管理路由與 `terminal_bridge/server.js` 的 WebSocketServer；bridge 預設 `0.0.0.0`，未在該連線路徑看到身分／Origin 驗證。
- 影響取決於實際網路與反向代理設定：若直接可達，可用機台名稱進入讀取伺服器端帳密的連線路徑。部門內使用也應避免未授權整櫃操作。
- 建議：bridge 僅供內部代理存取、外層登入與 HTTPS、操作權限與稽核。CORS 不是身分驗證。未在這輪變更公司網路或登入流程。
- 區分：SP-X broker 有 fail-closed `NoAuthPortal`／RBAC／launch binding，不能把它說成完全沒有保護；`EnvOperatorPortal` 是部署 bootstrap，不能等同每位使用者登入。

### R6 · P2 — 非 Server Rack 採集尚有 stub，成員口徑不一致

- 位置：`telemetry_core.py:collect_rack` 約 719 行回傳空資料；`get_rack_series` 成員條件沒有 `rack_u > 0`，而 `main.py:rack_telemetry` 有此條件。
- 影響：接上 FastAPI 不會自動產生 Switch／CDU／PDU 全套即時數據；有歷史資料的未上架元件可能仍進入聚合。
- 建議：依設備實際協議實作 collector，清楚標示不支援／未知／過期；統一聚合成員與畫面定義。不得以 fixture 的漂亮曲線充當正式支援證據。

### R7 · P2 — 重開同步 KVM 的連線生命週期需要補強

- 位置：`static/js/kvm_broadcast.js:openKvmBroadcast` 約 444 行，在新開啟時直接清空 `K.rfbMap`；disconnect／清 timer 在 `closeKvmBroadcast`。
- 影響：未先關閉就重開、切專案，舊連線／poll 可能失去管理；非同步偵測返回也缺少 session generation guard。
- 建議：統一 dispose，開啟與關閉遞增 generation，舊回應不得重建畫面；以 RFB stub 增加重入／快速切換測試。
- 狀態：靜態確認風險，尚未以真實 noVNC 長時間重現。本輪只修正連線文案，不宣稱解決生命週期。

### R8 · P2 — Secret store 的「60 秒 TTL」其實按呼叫次數刷新

- 位置：`spx_kvm_broker/secret_store.py:_reload_if_needed` 約 90 行。
- 證據：使用 `_refresh_counter > 30`，不是時間戳；低流量情況密碼輪替不會在 60 秒內生效。
- 另 `_decrypt_payload` 建立 `delete=False` 的空暫存檔，沒有移除（約 65 行）。
- 建議：monotonic 時間 TTL／檔案版本檢查，移除無用途的 tempfile；以 mock 測試輪替與清理，不輸出秘密。

## 本輪已修正／改善

1. 感測告警原本 `critical || warning || no-reading` 只顯示第一組，現在同時呈現各組。
2. Sensor AI 用錯 `getElementById` 參數（帶 `#`），且回應可能寫到已切換的機台。修正 ID 並核對當前機台／頁面。
3. 同步 KVM 不再把「協議相容」說成連線成功，也移除不存在的自動重連承諾；連線數依實際 RFB 狀態更新。
4. OS／BMC 各自計算連線比例；未知不當離線，無該 IP 與 Blanking Panel 不納入分母。連線狀態不冒稱硬體健康。
5. Hardware 改為摘要導覽與完整 CPU／DIMM／SSD／GPU／NIC 表格，未知與空清單分開；PCI 紀錄不冒稱實體 Port 數。
6. Sensors 讀值、單位、狀態分欄，新增查找，AI 與原始資訊分區。
7. L10 加入緊湊密度與狀態篩選；Rack 清單顯示完整 U 區間，移出操作不再叫刪除。
8. 測試庫採雙欄檢視，指令／風險／證據可閱讀；零選取時停用產生指令。保留原始 code 群組選取與 YES／PARTIAL／NO 判定，不自動執行。
9. 圖表補數值摘要；聚焦、Modal、數值變化使用克制的一次性提示，支援 reduced motion。未對表格做 3D 傾斜。
10. 正式 FastAPI 模式的主要環境標籤不再固定寫 fixture preview。

## 驗證結果

| 驗證 | 結果／界線 |
|---|---|
| `node qa/acceptance.cjs` | 23／23 組通過；fixture 工作流程、13 canvas、6 類／3,112 案例、deep link、fallback、瀏覽器錯誤與外連檢查 |
| `node qa/engineering-ux.cjs` | 新版硬體／感測／案例 inspector／狀態篩選、純函式與 reduced-motion 通過 |
| `node qa/equipment-workspace.cjs` | 50 台 L10／3 個 L11、混合 U、9 種元件、1440／1600／1920 深淺色通過 |
| `node qa/gb300-rack.cjs` | 幾何、尺寸、各設備外觀、相機／選取／fallback 回歸通過 |
| Python AST | main、telemetry、8 個 broker 模組，10 個語法檢查通過 |
| GPU parser | 6 個無外部設備的 NVIDIA／AMD 解析測試通過（直接呼叫測試函式） |
| `python qa/review_reproductions.py` | R1、R2、R3 離線重現確認 |
| 完整 `pytest tests` | **未完成：本機 Python 沒有 pytest**；不可宣稱整套 broker tests 通過 |
| 正式 FastAPI／SSH／IPMI／KVM | 未連接實際部門設備，未驗收；未執行開關機與測試案例 |

## 下一輪最值得投入的項目

優先做 R1–R4 的可靠性修正及部署 smoke test，再做更多特效。

- 硬體：API 補 DIMM 實體 slot、NIC port/link speed、SSD serial/health、GPU PCI 對應，再加入位置圖與匯出；現在資料不足，不假裝畫出實際插槽。
- Telemetry：真實 last-collected／stale 門檻、缺資料空洞、單位、告警門檻、事件時間線；比更多發光更有操作價值。
- 大量操作：預覽受影響設備、分批進度、逐台成功／失敗、取消與重試；整櫃關機應有明確影響範圍。
- Rack：編輯 ghost placement、衝突預覽、未保存提示與復原；3D／平面圖共用選取。拓樸可加類型篩選與選取路徑聚焦，但只有取得連線／流量證據才動畫化「流動」。
- 設計系統：逐步收斂多層 renderer wrapper、硬編碼顏色與 emoji 圖示，建立可驗證的共用 tokens／按鈕狀態／字體尺度。
- 可及性：全站鍵盤、Modal focus trap／返回焦點、螢幕閱讀器 live status 與真實對比測試；目前只覆蓋部分焦點與對比。
- 維護：CI 跑固定 fixture、Python mock tests、API contract tests；正式設備與帳密永遠不放測試截圖／Git。

以上後續項目並非本輪已完成，也沒有新增假的排程、看板或測試執行引擎。
