# PA Server Manager Next — UI／UX 與可靠性檢視
日期：2026-09-24；基準：132a896（main）。
Historical baseline review. Implemented changes and validation: [comparison](UI_UX_COMPARISON.md).

## 判斷
目前已有明確的工程產品視覺：深色配色、設備模型、Rack 檢視與獨立設備工作區值得保留。主要落差在跨頁一致性、資訊優先順序與操作回饋。建議先改善可靠性與工作效率，再增加裝飾。
以下區分「可重現問題」「程式碼風險」「設計建議」，不把主觀偏好當成 bug。

## 範圍與證據
- 瀏覽首頁、L10 專案列表、Rack 3D／48U 配置／清單／Telemetry、單機五個分頁、任務分類與指派、Terminal、KVM，以及空白／載入／失敗狀態。
- 桌面驗收包含 1440／1600／1920；額外檢查 390／320px。深淺色與 reduced-motion 有既有測試覆蓋。
- Python 隔離 regression：49/49 通過。
- operations_regression.cjs、equipment_regression.cjs、engineering-ux.cjs 通過。
- acceptance.cjs：21/23 組通過。兩項失敗為舊 selector 與舊 API 預期，詳見下文；失敗後未執行到的組內步驟不能算通過。
- ui-audit.json 與 audit-*.png 為新增瀏覽器證據。此資料夾其餘圖片／acceptance.json 為本輪重新產生的驗收證據。
- 使用 serve.py 的合成 fixture；未啟動正式 main.py、連接真實硬體或修改庫存。這不是線上端到端或全面資安稽核。

## 優先修正

### B1 高：手機版共用導覽沒有覆蓋全部頁面（已重現）
390px 寬度下，首頁實際文件寬 544px、專案頁 533px、伺服器詳情 497px。320px 也相同。固定側欄占去約 198px，文字與主要內容被擠到右邊；詳情操作目標甚至逐字換行。Rack 頁則正常。
來源：static/css/equipment-workspace.css:147 起的窄螢幕規則僅涵蓋 Rack 與 CDU 詳情。
建議：將 compact navigation 提升成全站共用版型；伺服器、Switch 等詳情一併覆蓋。表格只允許自身橫向捲動，不能撐破整頁。
驗收：320／390／768px，各主要路由 document.scrollWidth <= viewport；IP、主要操作與返回入口可見。
證據：audit-projects-fleet_l-390.png、audit-machine-host_a-320.png、ui-audit.json。

### B2 高：KVM 斷線提示與實際行為不一致（已確認程式問題）
static/kvm_solo.html:82 呼叫 rfb.connect()，但內附 noVNC 的公開 prototype.connect 是 undefined。例外被空 catch 吞掉，畫面持續聲稱嘗試重新連線。
建議：重新建立 RFB instance，清理上一個 instance／timer；顯示重試次數、失敗原因、手動重試及停止重試。正常斷線與意外斷線分開處理。
驗收：模擬斷線後確實建立新的連線嘗試；關閉頁面停止重試；失敗不能永久停在誤導性的進行中狀態。
限制：確認的是 API 使用錯誤，未做真實 KVM 連線驗證。上一輪樣式 QA 使用 mock，沒有驗證 noVNC 重連契約。

### B3 中：瀏覽器上一頁無法返回列表（已重現）
從新分頁進入 projects/fleet_l → 點主機 → 詳情，history.length 維持 2；按 Back 回到 about:blank。
static/js/app.js:2163 使用 history.replaceState 覆蓋列表歷史。
建議：使用者主動跨頁以 pushState 記錄；初始正規化才 replaceState；Back／Forward 正確恢復路由與列表篩選／捲動。
驗收：列表 → 詳情 → Back 返回原列表位置，Forward 返回同一設備。

### B4 中：KVM 初始縮放設定可能未生效（程式碼風險）
kvm_solo.html 將 scaleViewport:true 放進 RFB constructor options，但內附 rfb.js:291 預設 _scaleViewport=false，constructor 沒讀該 option。直到 window resize 才用 setter 啟用。廣播版 kvm_broadcast.js:185 有明確設定 setter。
建議：建立 instance 後立即設定 rfb.scaleViewport=true；用大於 popup 的 framebuffer 驗證首次顯示及滑鼠座標。
限制：本輪未用真實 framebuffer 證實裁切，不能說線上一定已發生。

### B5 低：一般指派任務視窗不支援 Esc 關閉（已重現）
指派任務分類視窗按 Escape 仍開啟。workspace-cinematic.js 已有 dialog role、焦點圈限與還原，這些不應重寫或誤報缺失。
建議：一般無執行中工作的 modal 統一 Esc；忙碌／有未儲存內容時給明確處理。Terminal／KVM 要保留遠端按鍵語意，不應全站一刀切攔截。
驗收：關閉後回到觸發按鈕；執行中狀態不意外取消。

## 讓介面更專業的設計建議

### U1 首頁改以工程狀態作為第一屏
目前 900–1000px 高桌面的第一屏幾乎全是 System → Rack 展示。漂亮，但工程師要再往下找工作。
建議第一屏放專案／設備數、異常與未知數、執行中任務、最近操作入口。保留 3D 區域，提供收合或展示模式。
驗收：進頁即能回答「哪裡有異常、我要處理什麼、如何開始」。

### U2 建立一致的文字與圖示層級
Rack 工具列混用 emoji、文字與 SVG；單機頁則偏細線圖示。英文眉題與中英雙標在許多區塊重複，視覺層級分散。
建議主要操作用一致 SVG；中文為主，Terminal／KVM／Telemetry 等熟悉名詞保留；減少非必要英文字標。
一般閱讀文字建議 13–14px，輔助資訊 11–12px；這是設計目標，不是本輪宣稱的法規門檻。目前列表有 53 個可見 button/label/small 小於 11px，需逐項辨別裝飾與必要資訊。

### U3 Rack 操作分組，降低高影響操作的視覺競爭
新增拓樸、模擬拓樸、整櫃開關機、Reboot、AUX、廣播終端並列，缺少工作流程層級。
建議分成「檢視／配置」「連線／診斷」「電源操作」。整櫃 power 操作保留明確目標摘要、影響數與進度。已延後的 Reboot／AUX 功能不在本輪實作。
驗收：最常用操作容易找到；高影響操作不和一般切換同等突出。

### U4 統一成功、失敗與進行中回饋
現有程式仍有多處原生 alert／confirm 與客製 modal 混用。需逐一核對目前可達路徑，不能只憑靜態搜尋宣稱每處都會出現。
建議低影響成功用 toast；表單錯誤留在欄位附近；長工作用可回看的結果面板；高影響操作用一致確認視窗。
回饋應包含操作目標、動作、結果和下一步。避免「已送出」被理解成「設備已完成」。

### U5 單機 Overview 聚焦當前狀態
Overview 已有 OS／BMC 狀態，但標頭、connection card、側欄有重複資訊；硬體插圖占去第一屏的相當面積。
建議標頭固定機名／專案／目前 OS／資料新鮮度；主區顯示異常、任務與核心指標，硬體圖可縮小。右側保留 Terminal／KVM／測試入口。
保留目前 Ping 與 SSH／BMC 認證的區分，不要將 Ping 成功改成全面「健康」。

### U6 專案列表改善密度與導覽延續
桌面列表結構清楚，但每個專案都重複表頭與操作；大型清單會很長。既有 compact density 和離線 filter 應保留。
建議篩選列固定、結果數清楚；記住密度、展開狀態、搜尋與返回位置。大量設備情境再評估分頁或虛擬化，不能以目前 48 台 fixture 推斷千台效能。
每列「移至專案」常駐下拉可考慮收進管理選單，讓狀態和連線更突出。

### U7 Telemetry 優先回答異常與資料新鮮度
13 張圖已能顯示，但資訊量大；截圖的即時數值如 CPU 45.6／48.2 沒有直接把單位寫在數字旁。
建議統一數值與單位（%、°C、W、L/min），加資料時間、無資料／過期狀態；提供異常優先與常用指標。若資料來源未提供門檻或時間，不得自行捏造。
AI 分析與原始資料維持區隔，說清楚分析依據和時間。

### U8 測試任務流程再補明確的步驟與完成回饋
分類、數量及測項詳情已有基礎。建議做成「選分類 → 選測項 → 檢查目標／設定 → 提交／產生 → 查看結果」的清楚流程。
保留已選測項摘要，區分自動／部分／人工項目；大型清單搜尋時不要丟失選擇。是否提供最近使用／常用模板，需按實際工作需求決定。

### U9 模型與營運畫面共用狀態
保留 CDU 動態燈條與設備模型，因為這是產品辨識度。模型旁應同步名稱、位置、選取狀態、資料來源；動畫不可暗示未接入的即時流量。
目前 reduced-motion、WebGL fallback 與多項 scene 清理有既有測試，不需要為了專業感全部重做。

## 測試與維護落差
1. acceptance.cjs:148 還找「換位/類型」，目前 app.js:1177/1249 是「機櫃位置」。這是測試 selector 過時；該組後續放置流程本次沒完成。
2. acceptance.cjs:187 仍預期修改 L11 rack_size 得到 409，但目前不可變規格合約先回 400。應把規格禁止與位置衝突拆開測，不能只是把 assertion 改到綠燈。
3. 多層 render wrapper 與 CSS 疊加使共用樣式容易只覆蓋部分設備；mobile 只修 Rack/CDU 就是實例。先集中共用導航、按鈕、badge、modal 和 spacing tokens，再逐步清理，避免大改全部前端。
4. 既有 theme-contract 的 CSS 最後載入順序假設先前已有失敗；本輪沒有重跑，不能列成本輪新發現。
5. 主題切成 light 後 reload 仍為 light，本輪通過；不列 bug。一般 modal 的 Tab 焦點沒有逃逸，本輪通過。

## 建議執行順序
第一批：B1 手機共用版型、B2 KVM 重連、B3 歷史導航、B4 初始縮放，同步補對應有意義的 regression。
第二批：U2 字級／圖示／按鈕規則、B5 一般 modal 鍵盤行為、U3/U4 操作分组與結果回饋。
第三批：U1 首頁資訊架構、U5 單機摘要、U6 大型列表工作流程、U7 遙測、U8 任務流程。
每批提供桌面深淺色與窄螢幕前後比較，再做後續視覺調整。本輪僅完成 review，以上改善尚未實作。
