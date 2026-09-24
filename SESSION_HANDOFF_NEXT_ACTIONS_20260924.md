HISTORICAL REFERENCE: Current continuation state is PROJECT_STATUS.md. Read AGENTS.md first. Do not execute old TODOs or service commands merely because they appear below.

PUBLICATION FOLLOW-UP 2026-09-24: User authorized commit/push after SSH port review. Current inventory OS SSH ports are 22; web BMC Terminal maps IPMI 623 to SSH 22. Explicit custom SSH ports remain supported; Terminal bridge service ports unchanged. This revision is prepared for publication; confirm origin/main for the final commit. No deployment performed.

LATEST 2026-09-24: Non-server management IP/SSH and R1-R4 are now implemented locally on 7a23ae6; not committed/pushed/deployed. Read SESSION_HANDOFF_EQUIPMENT_IP_R1_R4_20260924.md. Older pending-status statements below are historical; U7 remains deferred.

# PA Server Manager Next — 下一個對話視窗交接

本檔為 2026-09-24 本次對話最後狀態。若舊交接檔提到尚未提交、Git 無寫入權限、CDU 安裝方式完全鎖定，以本檔為準。

## 專案與版本

- 唯一工作 repo：https://github.com/wistroneq3300/pa-server-manager-next
- 本機：`C:\Users\kobei\Documents\Codex\2026-09-24\pa-server-manager-next-https-github`
- 分支：`main`。
- 已 commit 並 push 的功能版本：`7a23ae62fd9c076a453d519aa40e5423bc1a98aa`。
- Commit：`Fix rack placement reliability and CDU installation switching`。
- 本次交接前以 `git ls-remote origin refs/heads/main` 確認遠端仍為上述 SHA。
- 已保留使用者的 `dcd3f4f` 提交（新增 `data.json`、`prod-data/data.json`）；功能提交 rebase 在其後，沒有覆蓋這些資料。
- 寫本交接前 working tree 乾淨；這次只新增／更新交接文件，不代表又有新功能提交。交接文件的提交狀態以接手時 `git status` 為準。
- 使用者已切換 Full access，本機 fetch／commit／push 實際成功。不要再把先前 `.git/index.lock` Permission denied 當成目前阻塞。
- repo 曾改為公開；使用者說上傳的是測試資料。不要在回覆或交接複製帳密內容。

## 先讀什麼

1. 本檔。
2. `AGENTS.md` 與 `.agents/skills/pa-manager/SKILL.md`，注意它们含原專案的歷史環境；本次只操作 Next。
3. `SESSION_HANDOFF_PROJECT_REVIEW_20260924.md`：第一輪修正、第二輪重現證據、測試限制。
4. 需要 3D／液冷背景才讀 `SESSION_HANDOFF_CDU_COOLING_20260924.md`。

先核對工作區修改、fetch、比較 main，不要覆蓋其他視窗或使用者新增內容。

## 已完成且已推送

### L11 規格與機櫃放置

- 類型、U 高度在 L11 建立時確定。Rack「＋加入既有 L11」只選設備及 U 槽，顯示正確類型／高度且不能修改。
- 移動表單也只改位置；移出機櫃保留 L11 元件與規格。
- 新增 `PATCH /api/machines/{name}/placement`，只接受 `rack_u`、`expected_project`，由後端用已存高度判斷範圍與衝突；專案已變更時拒絕舊表單。
- 通用 PATCH 不能覆寫既有 L11 類型、高度及安裝方式。
- L10／L11 切換保留已有類型、高度；升級不再擅自設成 1U 並猜一個 U 槽。

### CDU 急件（優先於舊文件的完全鎖定規則）

- 使用者要求外置 CDU 可以改成櫃內；已補「CDU 安裝設定」入口（Rack inspector／清單）。
- 專用 `PATCH /api/machines/{name}/cdu-installation` 支援外置／櫃內切換，保留同筆元件 ID、管理 IP 等資料。
- 外置不用問幾 U，放機櫃正面右側，與 rack 共用 3D 移動。
- 外置改櫃內時選高度，固定佔 U1 到所選高度；底部已佔用則拒絕並提示，不能自動刪除擋板或其他設備。
- 已是櫃內時，同安裝方式的高度仍固定；每櫃只能一套 CDU。
- CDU 管理 IP 顯示優先用 `bmc_ip`，舊資料退回 `os_ip`。
- 目前主機櫃最大 48U，有大高度／48U 邊界驗證。
- 液冷管路與紅藍水流為示意，不是即時流量。TC1288 只是外觀參考，不限制設備型號。

### 第一輪 Review

- B1–B14、U1–U6／U8 已實作；細目見 project review handoff。
- 包含 active OS 配對、IP 修改同步／快取、資料載入失敗保護、Telemetry membership、非同步舊結果隔離、KVM 清理、操作進度／重試及放置預覽等。
- 新檔 `static/js/operations-ux.js`、`static/css/operations-ux.css` 已由 index 載入。
- 已 push 不等於已部署：沒有重啟使用者的 FastAPI 或正式服務，不能宣稱使用中的網站已更新。

## 第二輪待修改清單（只完成 Review，尚未實作）

使用者最近兩次要求列表格，接著要求寫交接檔；尚未對以下 R1–R4 另行下達實作指令。下一視窗先回報理解，依使用者指示安排，勿因舊交接而誤認已完成。

| 編號 | 優先度 | 問題與證據 | 建議修法／驗收 |
| --- | --- | --- | --- |
| R1 | 高 | `main.py edit_machine` 通用 BMC PATCH 只改頂層欄位，未同步 active OS 的 BMC。隔離實測頂層新 IP、active slot 仍舊 IP；`_sync_active_os` 可能寫回舊目標。專用 change-IP endpoint 已修，通用 PATCH 尚未修。 | 共用 active-slot-aware 更新路徑並失效相關快取；改 BMC 後切換再切回 OS，配對資料仍正確。 |
| R2 | 中 | 被動元件降 L10 後留下 `level=system, passive=True`；前端 `isRackItem` 仍回 true，後端 Rack membership 卻要求 level=rack。已用實際 handler＋隔離資料重現。 | 被動非 Server 元件隱藏／禁止降 L10，API 同樣拒絕；避免前後端分類分歧。 |
| R3 | 中 | Rack 清單以 `os_ip` 是否存在決定 Terminal／電源按鈕，CDU 有 OS IP 時仍顯示通用操作，與 CDU 詳情不一致；Chrome fixture 重現。 | 統一元件能力判定，查核詳情、清單、批次入口；保留真正支援的功能。U7 暫緩範圍不可順手開發。 |
| R4 | 中 | 舊資料沒 `mgx_type` 時，前端 substring 與後端 startswith 名稱規則不同；如 `rack-cdu-01` 可能 UI=CDU、後端=Server。 | 統一分類規則／正規化；保留明確類型，含糊資料需明示待確認。不要直接批次覆寫正式或使用者上傳資料；自動遷移政策尚未確認。 |

以上是隔離重現／程式證據，不是已證實的正式環境事故。不要把這四項說成已修好。

## 明確暫緩與邊界

- U7 先不改：Rack Reboot、AUX 與部分拓樸入口流程。
- 32 台 × 4 節點架構仍在使用者思考中，不實作。
- 單機詳情不要新增 DPU OS／DPU BMC Ping。
- 不改原 `pa-server-manager`、Terminal 埠、正式資料或正式服務。
- 使用者曾說 FastAPI 已上傳；截至本輪遠端差異只確認新增兩份 inventory，不能宣稱已收到／整合另一個 FastAPI 新版。後續先查 Git diff，保留使用者後端修改。

## 驗證結果與限制

- `python -m unittest discover -s qa -p '*regression.py'`：41 項通過。
- `node qa/operations_regression.cjs`：通過（非同步、placement payload、批次、KVM 等離線回歸）。
- 修改 JS 語法、Python AST、`git diff --check` 通過。
- Chrome 曾驗證 5U 擋板移動表單固定類型／高度；完整瀏覽器移出再加入曾被控制逾時中斷，不宣稱全流程 Chrome 測完。
- CDU 轉換的衝突、身分保留、過期專案、存檔失敗回滾已由隔離後端測試覆蓋；尚未真機端到端測試。
- 未執行實體設備電源操作，未重啟服務。先前 standalone Playwright 曾遭 EPERM；Full access 恢復後尚未重跑完整瀏覽器 suite。
- `serve.py --port 8891` 是隔離示意預覽，是否仍在跑需查；8769 可能是舊工作區，不能用來判定最新版本。

## 本機工具

- PowerShell。
- Python：`C:/Users/kobei/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe`
- Node：`C:/Users/kobei/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe`
- 此環境 Git 網路命令曾需要：`git --exec-path='C:/Users/kobei/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/git/mingw64/bin' fetch origin main`（push 同理）。
- repo-local Git 作者已沿用歷史提交者設定；不要修改全域設定。

## 可貼到下一個視窗

請接手 PA Server Manager Next：
https://github.com/wistroneq3300/pa-server-manager-next

先核對本機修改並 fetch，讀 `SESSION_HANDOFF_NEXT_ACTIONS_20260924.md`、`AGENTS.md`、`SESSION_HANDOFF_PROJECT_REVIEW_20260924.md`。
本輪功能已推到 main：`7a23ae6`，包含 L11 固定規格、CDU 外置／櫃內切換與第一輪 Review 修正；41 項後端測試通過。R1–R4 是新一輪待修清單，先確認理解再依我指示處理。U7、32 台 × 4 節點及 DPU Ping 暫不動；保留我的後端修改，不動原 repo、Terminal 埠和正式資料。
