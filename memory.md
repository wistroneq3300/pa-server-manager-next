# PA Server Manager — 多 OS + BMC 架構 memory

> 這個檔案記錄「一台物理 server = 多個獨立節點（1 OS + 1 配對 BMC）」的架構與任務狀態。
> 最後更新：2026-09-22

## 背景需求
- Wistron PA Server Manager（port 7000，uvicorn 執行中，supervisor 自動重啟）
- 專案：Naboo 架構，**1 台物理 server = 4 個獨立節點**，每個節點 = 1 OS + 1 配對 BMC
- L11 rack 共 33 台 naboo（naboo-01 ~ naboo-33）+ 1 台 naboo-app-1
- 另一案子：L10 也有一台系統含多個 OS（需求未定，等細節）

## 資料模型（已實作）
```
machine = {
  name, os_ip, os_user, os_pass, os_port,        # 機台層級（= active OS 同步過來的）
  bmc_ip, bmc_user, bmc_pass, bmc_port,          # 機台層級（= active OS 的配對 BMC 同步過來的）
  active_os: 1,
  os: [                                           # 多 OS 機台才有此陣列
    { slot:1, ip, user, pass, port, label, bmc_ip, bmc_user, bmc_pass },
    { slot:2, ip, user, pass, port, label, bmc_ip, bmc_user, bmc_pass },
    ...
  ]
}
```
- **BMC port 一律寫死 623**（IPMI 標準），UI 不顯示、資料不存
- **1:1 綁定**：選定 OS_n → 終端連 OS_n、電源/KVM 走 BMC_n
- **OS IP 全域唯一**（不能與其他任何機台重複）
- **OS 1 = 主節點**，不可移除
- **單 OS 機台**（49 台，無 `os` 陣列）完全不受影響：`_sync_active_os` 遇 `len<=1` 直接 return

## 關鍵機制（零侵入）
`_sync_active_os(m)` 在 active OS 同步時，把該 slot 的 `bmc_ip/bmc_user/bmc_pass` 也同步到機台層級 `m["bmc_ip"]`。
既有的 IPMI/電源/KVM 函式（`ssh_ipmi`、`_ipmi_cmd`、`power` 端點）**完全沒動**，照舊讀 `m["bmc_ip"]`，只是值跟著 active_os 變。
已驗證：切到 OS2 → 機台 bmc_ip 自動變該 slot 的 BMC IP。

## 已改檔案
### main.py
- `AddOs`/`UpdateOs` model：加 `bmc_ip/bmc_user/bmc_pass`
- `_norm_os_entry`：回傳含 bmc_ip/bmc_user/bmc_pass
- `_mask_os_list`：bmc_pass 遮成 `****`
- `machine_add_os`：主 OS 補建時帶入機台層級 BMC；新 OS 帶 body 的 BMC
- `machine_update_os`：支援 BMC 欄位更新（留空=不更動）
- `_sync_active_os`：active OS 同步時連 BMC 一起同步（`if cur.get("bmc_ip")` 才覆蓋）
- `edit_machine` (PATCH /api/machines/{name})：支援 bmc_ip/bmc_user/bmc_pass/bmc_port（回傳用 `_bmc_safe` 遮蔽密碼）

### static/js/product-detail.js
- OS Slots 分頁每行：標籤 / OS IP / OS 帳號 / OS 密碼 / Port / **BMC IP / BMC 帳號 / BMC 密碼** / OS 狀態 / 操作（11 欄，可橫向捲動）
- `pdOsAdd` / `pdOsSave` / `pdOsDelete` / `pdSelectOs` 都處理 BMC 欄位
- 移除舊的 `pdBmcSave`（機框級 BMC 區塊已廢棄）

### static/css/product-detail.css
- `.pd-os-table-wrap`（overflow-x auto）
- `.pd-os-table th` position sticky
- 移除舊 `.pd-bmc-section` 樣式

## naboo-01 示範資料（已填，部分佔位）
| Slot | OS IP | BMC IP |
|---|---|---|
| 1 | 10.10.10.1 | 10.35.228.145（真實，用户給的）|
| 2 | 10.20.1.2（佔位）| 10.35.228.146（佔位）|
| 3 | 10.20.1.3（佔位）| 10.35.228.147（佔位）|
| 4 | 10.20.1.4（佔位）| 10.35.228.148（佔位）|
BMC user 都是 admin，密碼全空（要用户填真實的）

## 待辦（用戶已提出，未做完）
### ~~A. OS Slots 分頁 UI 改善~~ ✅ 已完成（2026-09-21）
1. ✅ **字體加深**：`.pd-os-slot-num` color:#f1f5f9 font-size:15px；`.pd-os-table td` color:#e2e8f0；`.pd-os-table .pd-os-input` color:#f8fafc font-weight:600
2. ✅ **OS 標籤自動抓 hostname**：後端 `POST /api/machines/{name}/os/{slot}/probe` 用該 slot OS 帳密 SSH 抓 hostname；前端標籤欄位旁「🔄 抓」按鈕
3. ✅ **BMC IP 自動抓**：同一個 probe 端點，用該 slot OS 跑 `ipmitool lan print` 抓 BMC IP；前端 BMC IP 欄位旁「🔄 抓」按鈕
   - **BMC 帳號/密碼：手動打**（不自動抓，用戶確認）
   - probe 回傳 {ok, hostname, bmc_ip, ipmitool_ok, error}；缺帳密回 ok:false + 提示
   - 前端 `pdOsProbe(name, slot, kind, btn)`：抓完自動填入 label + bmc_ip 欄位

### ~~A2. OS Slots 白色介面修圖（2026-09-22）~~ ✅
- **白色介面字色模糊**：表格 td/輸入框/slot 數字/表頭改用主題變數 `var(--p-text)`/`var(--p-muted)`（白介面=深色、黑介面=淺色），不再寫死淺色
- **抓取鈕被 OS IP 蓋住**：標籤格、BMC IP 格改用 `table-layout:fixed` + `.pd-os-probe-cell`(flex)，輸入框 `min-width:0` 收縮、按鈕 `flex-shrink:0`，不再溢出被右欄覆蓋
- **標題對齊**：`.pd-os-manage` padding 20px，讓 title/eyebrow 左緣對齊卡框
- **OS Port 欄拿掉**（用戶要求）：表格、表頭、add-row 都移除 port（OS 固定 22）；`pdOsSave` 保留 port 預設 22 送後端（q('port') 回 undefined → 22）；BMC IP 欄隨之變寬（10 欄等寬）
- **新增鈕合成一個**：只留「＋ 新增節點」（`pdOsAddAndProbe`），按下即新增＋自動抓 hostname 填標籤、抓 BMC IP；原「＋ 新增」與「🔄 新增並抓取」移除
- **新增欄位反灰**：「新增節點」列的 標籤、BMC IP 設 `disabled`（`.pd-os-add-auto` 灰底虛框），提示「自動抓」，新增後由 probe 填入
- **欄寬調整**：表格加 `<colgroup>` — OS IP / BMC IP 各 178px（一樣寬）、OS 帳號 / OS 密碼 / BMC 帳號 / BMC 密碼 128px（短）、Slot 60、狀態 78、操作 150，標籤彈性
- **新增鈕「沒反應」修**：`product-detail.js` 原本在 index.html 沒加 `?v=` 破快取 → 瀏覽器可能載到舊 JS 缺 `pdOsAddAndProbe`，已加 `?v=` 破快取；`pdOsAddAndProbe` 新增成功先 alert 讓用戶看到反饋，抓完再 `setView('machine')` 重繪（之後改為中央 toast）
- **既有節點改唯讀**（用戶要求 2026-09-22）：獨立 OS 管理表內所有既有節點欄位設 `readonly`（`.pd-os-ro`），輸入只能來自「新增節點」列；要改就是「移除」再重新「新增節點」。移除每列的「🔄 抓」按鈕與「儲存」按鈕（只剩「移除」/「主 OS」），`pdOsSave`/`pdOsProbe` 變成死碼仍留著
- **移除節點 bug 修 + 即時顯示**（用戶回報 2026-09-22）：渲染時 `b = {...m, ...(d.machine)}`，`d.machine` 來自 `machineDetailCache`（stale，沒在 remove/add 後失效）會**覆蓋** `machines[name]` 的最新 `os`，導致刪除節點 2 後畫面重繪顯示舊資料、看似節點 1 也消失。修法：改 `b = {...m, ...(d.machine), ...{ os:m.os, active_os, os_ip, os_user, os_pass, os_port, bmc_ip, bmc_user, bmc_alive }}` 讓 machines 陣列最新值覆寫。加上 `confirm()` 確認再刪（用戶要問），刪完 `setView('machine')` **不需重新整理即看到**。後端 delete 端點確認：slot==1 會 raise 400 保護主 OS，刪節點後重新編號不影響節點 1。
- **節點 1 沒資料顯示**（用戶回報 2026-09-22）：單 OS 機台（`os` 陣列空）主 OS 資料在頂層欄位 `os_ip/os_user/os_pass/bmc_*`，原本「獨立 OS 管理」只顯示空佔位。修法：`osList` 在空陣列但有 `b.os_ip` 時，用頂層欄位合成一筆節點 1（slot:1），讓主 OS 永遠顯示為節點 1；小心不破壞 `multiOs`（合成後 length=1，下拉仍不顯示）。alive 用 `b.os_alive` 頂層值（單節點時）。cache-buster `?v=20260922i`
- **新增失敗殘留 OS、slot 一直跳**（用戶回報 2026-09-22）：原本 `pdOsAddAndProbe` 先 `pdOsAdd`（POST /os 立即新增 node）再 probe；若 probe 抓 hostname/BMC IP 失敗，該 slot 已建立殘留，重試又變下一個 slot（os2→os3…）。修法：改**先 probe 後新增** — 先用 `/api/machines/probe-bmc`（帶 os_ip/os_user/os_pass）驗證 SSH 抓 hostname+BMC IP，成功後才 `pdOsAdd`（帶上 label=hostname、bmc_ip）；失敗則不建 node、slot 不推進，重試仍是同 slot。`pdOsAdd` 加 `opts` 參數可帶預探測值。cache-buster `?v=20260922l`
- **新增/移除「即時顯示」根治 + 主 OS 標籤回歸 OS1**（用戶回報 2026-09-22）：先前用 `machineLoadDetail(name,true)`（refresh=1）重繪，但該呼叫後端要 6.5 秒才完成→使用者覺得沒更新。改為「本地更新 + 立即重繪」：更新 `m.os` 後，patch `machineDetailCache[name].machine.os`（**有 guard**），再 `if (state.view==='machine') setView('machine')`（render 已強制 `b.os=m.os`），瞬間重繪不需刷新。**重要**：renderer 用 bare `_activeMachine`（lexical `let`，非 `window._activeMachine`）找 machine；`window._activeMachine` 是 undefined，不能用它判斷。重繪 guard 只用 `state.view==='machine'`（按鈕只在當前機台面板內，name 必為顯示中機台）。另加：後端已無該 slot（stale 前端資料）時 DELETE 回「不存在」→ 視為已移除，本地過濾掉該 slot 重繪，不報錯。已用 headless Chrome CDP 驗證：本地改 os + setView 後立刻更新表格。主 OS 標籤：render 對 slot1 若 label 為空/「OS 1」則顯示機台名稱（hostname）；後端遷移單 OS 時硬編 "OS 1"。cache-buster `?v=20260922r`
- **「獨立 OS」功能只給 L11 機櫃，L10 系統移除**（用戶要求 2026-09-22）：machine 詳情頁「獨立 OS / osslots」分頁只對 `level==='rack'`（L11）機台顯示；L10（system level）機台不顯示該分頁，也不顯示「ACTIVE OS」下拉（`osDropdown` 改 `rack && multiOs`）。實作：renderer 用 `const viewTabs = rack ? tabs : tabs.filter(t=>t[0]!=='osslots')`（**不 mutate 全域 `tabs`**，避免渲染 L10 後把 L11 的 osslots 永久移除），nav/panels 用 `viewTabs.map`；`selected` 若為被過濾掉的 tab 則退回 'overview'。已用 headless Chrome CDP 驗證：EQ3300-AIAgent（L10）無 osslots、naboo-01（L11）有 osslots。cache-buster `?v=20260922s`
- **欄寬（輸入框）最終設定**：Slot 60、標籤 125(欄198，含🔄抓47+間距)、OS IP **160**、OS 帳號 70(欄90)、OS 密碼 124(欄124)、BMC IP **160**（與 OS IP 等寬，因資料列無 🔄 按鈕）、BMC 帳號 70(欄90)、BMC 密碼 100(欄120)、OS 狀態 74(欄74)、操作 128(欄128)；cache-buster `?v=20260922s`

### 切換 OS → 整套配置換（2026-09-22）
**症狀**：多 OS 機框（EQ3300-AIAgent 測試用，L11 Test，slot1 OS1=EQ3300/10.35.228.144、slot2 boba-pa-1/10.35.229.70）切換 ACTIVE OS 後，硬體/感測器/連線 IP 都還是舊 OS 的。
**真正根因（關鍵 bug）**：`pdSelectOs` 用 `window._activeMachine` 判斷是否要重繪/重抓。但 **`_activeMachine` 是 app.js 頂層 `let`（全域 lexical，非 `window` 屬性）→ `window._activeMachine` 永遠 `undefined` → 判斷永遠 false → 切換後根本不會重繪/重抓配置**。這是 memory 記過的坑又踩一次。
**第二根因**：後端 `detail`/`sensors` 的 cache key 是機台 `name`（不分 slot），前一個 OS 抓的硬體/感測器會被下一個 OS 用（串台），不 refresh 就回舊值。
**修法**：
1. **前端**（product-detail.js）：所有 `window._activeMachine` → `_activeMachine`（共 4 處：line 245/252/256/376）。`pdSelectOs` 切換成功後，若正顯示該機台 → ①先 `setView('machine')` 立即重繪連線資訊；②`delete machineDetailCache[name]` + `await machineLoadDetail(name, true)` 重抓 os_info/hw+BMC fw/power；③`sensorAiDone.delete(name)`/`delete sensorAiResult[name]` + `await machineLoadSensors(name, true)` 重抓新 BMC sdr；④`setView('machine')`。
2. **前端 dispLabel**（product-detail.js `dispLabel(e)`）：ACTIVE OS 下拉選項與連線區 slot tag 顯示 hostname——slot1 label 若為佔位「OS 1」則用機台名（=主 OS hostname）。osDropdown option 與 connection tag 都用 `dispLabel`（原 osRows 已有同邏輯，現統一）。cache-buster `?v=20260922x`。
3. **後端**（main.py `machine_select_os`，line ~899）：切換時清掉該機台所有 OS/BMC/感測器 cache（`_os_info_cache/_os_info_time/_os_hw_cache/_os_hw_time/_bmc_fw_cache/_bmc_pwr_cache/_bmc_pending` + `_sensors_cache/_sensors_time/_sensors_pending`），確保下一次 detail/sensors 用「新選定 OS」重抓，不串台。
**驗證**（headless Chrome）：切到 slot2 → 連線區立即 .70/.130、cache 更新、硬體 2 秒內從 AMD EPYC 9575F(2sock/7GPU) 換成 boba 的 AMD EPYC 9335(1sock/0GPU)；切回 slot1 復原。下拉顯示「EQ3300-AIAgent · 10.35.228.144」與「boba-pa-1 · 10.35.229.70」。
**教訓**：判斷「目前顯示的機台」一律用 bare `_activeMachine`（lexical let），絕不用 `window._activeMachine`。

### 節點級廣播終端（2026-09-22）— 一台多節點可各自/全框廣播
**需求**：Naboo 機框 1 台=多節點（每節點 1 OS）。原「廣播終端」以「機台」為單位（target=機台名，只播到主 OS / active_os），多節點根本選不到。
**改動**（target 統一改為 `name#slot`）：
1. **前端 app.js** `rackBroadcastDialog`：多 OS 機框（`m.os` 長度>1）展開成每顆節點各自勾選，加「☑ 整框全選 / ☐ 整框全不選」按鈕 `bcSetMachineAll(root,on)`；單 OS 給 `name#0`。helper：`bcNodes(m)`（產節點清單）、`bcRootLabel(key)`（顯示名）、`bcNodeIp(key)`（節點 IP）、`bcId(key)`（`#`→`_` 當 DOM id）、`bcQuote(s)`（app.js 沒有 product-detail 的 format `quote`，自定，勿用 `quote()`）。
2. **前端 openBroadcast**：`bcState.terms/stat/order/active`、送出的 `{type:sendOne,name}`/`{type:broadcast}`/後端 `{type:out,name}` 一律用 `name#slot` key；DOM id（bc-tab/bc-pane/bc-box/lamp/bc-ack）用 `bcId(key)`；顯示名用 `bcRootLabel`、IP 用 `bcNodeIp`。**所有 bc DOM id 拼接必須過 `bcId()`**（`#` 不能當 id）。
3. **node bridge terminal_bridge/server.js `handleBroadcast`**：解析 target `name#slot`——slot<=0 或 osSlots 長度<=1 → `CREDS[name].os`（主 OS）；slot N >=1 → `CREDS[name].osSlots[N-1]`。純 `name` 向後相容（systemBroadcastDialog 單 OS 照舊）。改後需重啟 7001 bridge（`TERM_BRIDGE_PORT=7001 PA_DATA_DIR=.../prod-data node server.js`）。
4. cache-buster：`app.js?v=20260922bc`（product-detail 維持 `?v=20260922x`）。
**驗證**：node bridge 對 `EQ3300-AIAgent#1`(.144,OS1) 與 `#2`(boba-pa-1,.70) join 成功，`echo+hostname` 廣播同時送達各自回覆（#1→EQ3300-AIAgent、#2→boba-pa-1）；後端 `/ws/rack-broadcast` proxy 通路；UI 選單 naboo-01 展開成 4 節點、EQ3300-AIAgent 展開成 2 節點、整框全選只勾該框不影響其他。

### ~~B. 新增系統（add machine）加強~~ ✅ 已完成（2026-09-21）
4. ✅ **BMC 驗證規則**（`add_machine` line ~411）：BMC IP 帳密填入後 →
   - ping BMC IP
   - `ssh_login_ok` 用 BMC 帳密登入
   - 在 BMC 內跑 `ipmitool lan print`，parse "IP Address" 行，**若 BMC 回報 IP ≠ 填入 IP → 擋下**（400）
   - BMC 內無 ipmitool/取不到 IP → 不阻擋（帳密已驗證可登入）

### C. 其他（待用戶輸入）
5. **其他 32 台 Naboo** 加 4 OS + 4 BMC：等用戶給 IP 規畫表，可用 API 批次加
   - `POST /api/machines/{name}/os`  body: {ip, user, pass, label, bmc_ip, bmc_user, bmc_pass}
6. **L10 多 OS 案子**：等用戶需求細節（OS 數量、IP 規畫、是否 1:1 BMC）

## KVM / Terminal「沒功能」根因修復（2026-09-22）
**症狀**：用戶回報 KVM 跟 Terminal 都沒功能。
**排查結論**：前端按鈕/function 完全正常（L10/L11 都渲染、`openTermDialog`/`openKvmSolo` 都是全域 function、無 JS error）。真正根因是 **`prod-data/data.json` 裡 EQ3300-AIAgent 的 `os_pass`/`bmc_pass` 被覆寫成遮罩值 `****`** → SSH（Terminal）與 IPMI（KVM）都用 `****` 認證 → 全失敗 → 看起來「沒功能」。

**修復**：
1. **還原真實帳密**：從權威備份 `/srv/pa-manager-prod/data/data.json`（同樣 os_ip 10.35.228.144）取回 `os_pass='password'`、`bmc_pass='0penBmc'`，寫回 `prod-data/data.json`（先備份 `data.json.bak.before-kvmfix`）。
   - 驗證：`sshpass -p password ssh root@10.35.228.144 hostname` → `EQ3300-AIAgent` ✅；`sshpass -p 0penBmc ssh root@10.35.228.145 hostname` → BMC ✅
2. **重啟 app**：`main.py` guards 生效 + `_load_data()` 重新讀進修正後資料。terminal bridge 每連線前 `loadCreds()` 從檔重讀，**不需重啟 bridge**。
3. **根因防護**（`main.py` 加 `_is_masked(v)`：`isinstance(v,str) and "**" in v`）不再讓 `****` 被當真實密碼寫回：
   - `edit_machine`(PATCH /api/machines/{name})：`bmc_pass` 若含 `**` 就不覆寫
   - `machine_add_os`(POST /os)：新節點 `pass`/`bmc_pass` 含 `**` → 視為空；主 OS 補建時若頂層 `os_pass`/`bmc_pass` 是遮罩 → 不帶入（給 `""`）
   - `machine_update_os`(PATCH /os/{slot})：`pass_`/`bmc_pass` 含 `**` → 不覆寫
   - 原因：前端從 API 拿到的密碼是 `****`，若把整個 machine 物件原封不動送回後端儲存，就會把 `****` 當成新密碼寫回、蓋掉真實密碼。

**環境差異（雙 app / 雙 bridge 陷阱）**：
- port **7000** = 主 app（PA_DATA_DIR=`.../prod-data`，TERM_BRIDGE_PORT=`7001`）→ 它連的 node bridge 是 `.../pa-server-manager-next/terminal_bridge/server.js` on 7001
- port **6969** = 舊 app（PA_DATA_DIR=`/srv/pa-manager-prod/data`）→ 連 `/root/sheng/manager/pa_manager/terminal_bridge` on 6968
- 改資料前先認清要改哪個 app 的資料檔；權威密碼在 `/srv/pa-manager-prod/data/data.json`

## BMC Terminal「沒顯示」第二根因：port 623（IPMI）當 SSH port（2026-09-22）
**症狀**：修復遮罩帳密後，OS terminal 好了，但 **BMC terminal 仍失敗、沒顯示東西**。
**根因**：bridge 對 BMC terminal 嘗試連 `10.35.228.145:623`（錯誤 → `connect ECONNREFUSED ...:623`）。因為 `prod-data/data.json` 的 `bmc_port=623`（IPMI port），前端 `app.js` 三處都用 `m.bmc_port || 623` 當 BMC terminal 的 **SSH port**，而 SSH 應該走 22。
- `bmc_port` 欄位語意是 **IPMI/電源管理**（623），被 terminal 誤當 **SSH port** 用 → 衝突。
- 權威備份 `/srv/.../data.json` 的 `bmc_port=22`（BMC SSH 在 22），`prod-data` 被寫成 623 是錯的。
- `_start_terminal`（main.py line 2085，paramiko 舊版）也是 `machine.get("bmc_port", 623)`，但 **terminal 實際走 `_proxy_ws` → node bridge**，paramiko 版本沒被 route 用（line 2224 `/ws/terminal/{name}/{kind}` 是 proxy）。

**修復（static/js/app.js 三處）**：BMC terminal 的 SSH port 改為 `(m.bmc_port && m.bmc_port !== 623) ? m.bmc_port : 22`（若 bmc_port 是 IPMI 預設 623 → 退回 22）。**不動** `bmc_port=623`（電源/IPMI 繼續用 623）。改完要更新 index.html 的 `app.js?v=` cache-buster，否則瀏覽器載舊 JS。
- 改動點：`openTermDialog` 的 bmcCreds（~3889）、openTermAt 的 bmc creds（~3897）、openTerm（~3952）
- cache-buster：`app.js?v=20260922t`

## KVM 驗證（2026-09-22）
- 後端 `/ws/kvm/EQ3300-AIAgent` 實測**成功**：回 `RFB 003.008\n`（RFB/VNC 握手手勢）——BMC 帳密還原後 `_connect_kvm` 已能登入並連 `/kvm/0`。
- KVM 走 `wss://{bmc_ip}/kvm` 或 `/kvm/0`（BMC 的 HTTPS web KVM，非 port 623），靠 `_detect_bmc` 判 SP-X/OneTree/OpenBMC + 登入拿 token。

## 單台 KVM 視窗 UI（kvm_solo.html，2026-09-22）
- 移除標題列右邊的「– 縮小」與「✕ 關閉」兩個 HTML 按鈕（使用者要求：單台 KVM 不要關閉/縮小；右上角「- X」控制不要）。
- 也移除對應的 `btn-min` JS listener。`.kvm-btn`/`.spacer` CSS 與 drag handler 的 `.kvm-btn` check 為無害 dead code，保留。
- **favicon 花圖**：加 `<link rel="icon" href="data:,">`，消除瀏覽器分頁 tab 上的「花花」預設圖示。

## 單台 KVM 斷線修復（2026-09-22）
**症狀**：廣播 KVM 正常，但**單台 KVM（kvm_solo.html）斷線**、一直顯示「連線中斷，嘗試重新連線...」。
**根因**：`kvm_solo.html` 建 RFB 時用 `wsProtocols: ["binary"]`（請求 subprotocol）與 `clipViewport: true`；後端 `kvm_proxy` 不回應 subprotocol → noVNC 握手後斷線。**廣播 KVM（kvm_broadcast.js）用 `wsProtocols: []` 正常**。
**修復**：`kvm_solo.html` 的 RFB 改 `wsProtocols: []`（對齊廣播）、`clipViewport: false`。headless Chrome 實測載入 `kvm_solo.html?m=EQ3300-AIAgent` 3 秒內「已連線」、overlay 隱藏 ✅。
後端 `/ws/kvm/{name}` 對無 subprotocol / `["binary"]` 兩種都回 `RFB 003.008\n` 握手，本身沒問題。

## 「右上角花花圖案」調查（2026-09-22，未定案）
**使用者回報**：單台 KVM 右上角有「花花、彩色放射狀/萬花筒」圖案，要求拿掉；加了 favicon `data:,` 後仍說「沒消失」。
**調查（headless Chrome + CDP）**：
- kvm_solo.html 載入成功、KVM「已連線」、overlay 隱藏。
- **canvas 硬數據**：1920x1200；dense 取樣 23040 點中 **dark 22253（96.5%）**、colorful 僅 38（0.16%），多數時像 `6_10_13`（極低亮度）→ KVM 畫面實為**近乎全黑（無桌面訊號）**。
- **DOM 檢查**：`document.querySelectorAll('*')` 所有元素背景都是深色（`rgb(11,14,19)` / `rgb(20,26,35)` / `rgb(40,40,40)`），**唯一的彩色是綠色狀態點 `rgb(161,204,86)`（`.dot.on`，標題列左側小圓點）**。DOM 內無任何彩色鮮豔元素。
- 教訓：**vision 對深色 KVM 小截圖有嚴重誤判**——把 96.5% 黑的 canvas 說成「80% 彩色鮮豔、紫藍綠黃粉」。要判斷畫面內容，以 canvas getImageData 硬數據為準，不要信 vision 描述。
**結論（推論）**：「花花圖案」不是 kvm_solo.html 的網頁元素、也不是 KVM 畫面內容（畫面是黑的）。最可能是**瀏覽器視窗層級**的東西——`openKvmSolo` 用 `window.open('', 'KVM_solo', 'width=1200,height=800,...')` 開出的視窗，若 kvm_solo.html 未正確填滿視窗，會露出 **Chrome 新分頁（New Tab）的彩色波浪背景**；vision 評「最接近 Chrome 新分頁的新版彩色背景」。
**待使用者確認**：單台 KVM 視窗是否真的是「彩色新分頁背景」而非深色 KVM 畫面？若是，可能是 kvm_solo.html 在真實瀏覽器載入失敗/視窗沒導向，或使用者仍在看舊視窗。下次可直接請使用者提供「視窗網址列 URL」與「瀏覽器主控台錯誤」來定位。

## 本次新增 API
| 用途 | Method | Endpoint |
|---|---|---|
| 抓 slot 的 hostname + BMC IP | POST | /api/machines/{name}/os/{slot}/probe |

## API 速查
| 用途 | Method | Endpoint |
|---|---|---|
| 列機台 | GET | /api/machines |
| 單機台 | GET | /api/machine/{name} |
| 新增機台 | POST | /api/machines |
| 編輯機台(含BMC) | PATCH | /api/machines/{name} |
| 探測 hostname+BMC IP | POST | /api/machines/probe-bmc |
| 新增 OS slot | POST | /api/machines/{name}/os |
| 更新 OS slot | PATCH | /api/machines/{name}/os/{slot} |
| 移除 OS slot | DELETE | /api/machines/{name}/os/{slot} |
| 選定 active OS | POST | /api/machines/{name}/select-os |

## 環境
- 目錄：/root/sheng/manager/pa-server-manager-next
- 執行：`TERM_BRIDGE_PORT=7001 PA_DATA_DIR=.../prod-data python3.12 -m uvicorn main:app --host 0.0.0.0 --port 7000`
- 重啟：`pkill -9 -f "uvicorn main:app"` 後再起
- 資料：prod-data/data.json
- 驗證 JS：`node --check static/js/product-detail.js`
- 驗證 Python：`python3 -c "import ast; ast.parse(open('main.py').read())"`
