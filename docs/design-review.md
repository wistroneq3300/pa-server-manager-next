Method: dual-agent（A：/root/design_review · B：/root/technical_review）

> 2026-09-26 後續設計決定：使用者目前僅要設計與網頁原型預覽，尚未授權正式實作。已確認的配色層級、Ping 色彩與圖例、深淺色對比、低優先資訊降彩度、3D 材質保留，以及首頁／Rack 增強方向，請讀 [設計方向](design-direction.md)。以下保留原始評估，不代表問題已修正。

**有值得優化的地方，但不需要整套重做。** 現有機櫃 3D、石墨色與金屬材質符合工程管理工具的定位；最有價值的下一步，是改善資訊判讀、搜尋與表單操作。

本次檢查版本 `0bb60acc`，使用隔離示範資料檢查首頁、System 清單／新增表單、設備詳情及 Rack。以下是設計評估，未修改 UI、推送或部署。

**優先改善的 5 項**

1. **P1｜新增設備表單：看得到標籤，輔助工具卻讀不到。**\
   OS／BMC 欄位旁的 label 沒有與輸入欄位關聯，密碼欄位在無障礙樹中缺少名稱，顯示密碼按鈕只有眼睛圖示。補上 `for/id`、必填狀態與「顯示 OS 密碼／BMC 密碼」名稱。既有對話框焦點管理可以保留。\
   依據：[index.html:96](https://github.com/wistroneq3300/pa-server-manager-next/blob/0bb60accd2687fc9c2cd87e90fcb6c146ab9a959/static/index.html#L96)、[密碼欄位:138](https://github.com/wistroneq3300/pa-server-manager-next/blob/0bb60accd2687fc9c2cd87e90fcb6c146ab9a959/static/index.html#L138)。對應：`harden`。

2. **P2｜窄螢幕搜尋列被擠壓，專案按鈕變成直排。**\
   實測窄視窗中，搜尋輸入框僅約 36px 寬；搜尋應獨占一行，專案按鈕禁止縮小並保留完整文字，超出時整列橫向滑動。這會直接改善手機或放大畫面後的操作。\
   依據：[workspace-ux.css:71](https://github.com/wistroneq3300/pa-server-manager-next/blob/0bb60accd2687fc9c2cd87e90fcb6c146ab9a959/static/css/workspace-ux.css#L71)。注意：工具要求 390px，但實際 CSS 視窗回報 295px，因此確認的是窄視窗問題，不能宣稱已驗證標準 390px 手機。對應：`adapt`。

3. **P2｜同一種 Ping 結果，被寫成不同程度的「正常」。**\
   首頁主摘要已清楚說明 Ping 不代表硬體健康，但專案卡仍有「運作正常」，篩選器則使用「OS 離線／BMC 離線」。建議統一為「Ping 可達／Ping 未回應／尚未觀測」，並將電源、認證及健康狀態分開呈現。\
   依據：[projectCard](https://github.com/wistroneq3300/pa-server-manager-next/blob/0bb60accd2687fc9c2cd87e90fcb6c146ab9a959/static/js/product.js#L16)、[狀態篩選器](https://github.com/wistroneq3300/pa-server-manager-next/blob/0bb60accd2687fc9c2cd87e90fcb6c146ab9a959/static/js/engineering-ux.js#L89)。對應：`clarify`。

4. **P2｜首頁異常摘要只顯示前 4 台，缺少「查看全部」。**\
   總數會顯示全部異常，但清單使用 `attention.slice(0,4)`。超過 4 台時，使用者無法直接從摘要進入完整異常清單。建議讓異常數字可點擊，並加入「查看全部 N 台」，沿用同一個 OS／BMC 未回應條件。\
   依據：[workspace-ux.js:76–83](https://github.com/wistroneq3300/pa-server-manager-next/blob/0bb60accd2687fc9c2cd87e90fcb6c146ab9a959/static/js/workspace-ux.js#L76)。這是原始碼確認的缺口；示範資料只有 3 台異常，未實測大量異常情境。對應：`distill`。

5. **P2｜部分真正用來判讀狀態的文字只有 10px。**\
   實際設備清單的部分 Ping／層級標籤及導覽副標偏小。建議將操作與狀態文字統一至 12–13px，設備名稱與 IP 維持清楚主次；裝飾性小字可另外處理。不要為放大文字而把整個工程表格變成巨型卡片。\
   依據：[product.css](https://github.com/wistroneq3300/pa-server-manager-next/blob/0bb60accd2687fc9c2cd87e90fcb6c146ab9a959/static/css/product.css)、瀏覽器實際字級。對應：`typeset`。

**值得保留的設計**

- 首頁先呈現異常與最近設備，3D 展示可以收合，已符合日常工程工作。
- 機櫃模型、設備分類與 U 位有實際意義，也有平面配置及鍵盤選擇替代操作。
- 操作確認包含具體目標，訊息區分「指令已接受」與「完成」；搜尋式使用手冊也很完整。

**設計健康度：28/40，基礎良好，適合局部修正。** 這是本次啟發式評估，並非完整無障礙認證。

| 面向 | 分數 / 4 | 主要判斷 |
|---|---:|---|
| 系統狀態可見性 | 3 | 摘要清楚，部分狀態用語仍不一致 |
| 符合使用者認知 | 3 | U 位與 OS／BMC 模型明確 |
| 使用者控制 | 3 | 可返回、取消、收合及重設 |
| 一致性 | 2 | 狀態名稱與表單標籤需要統一 |
| 錯誤預防 | 3 | 已有目標確認、能力與位置檢查 |
| 辨識而非記憶 | 2 | 欄位名稱與多重入口仍增加負擔 |
| 操作效率 | 3 | 有搜尋、篩選與批次，但缺完整異常入口 |
| 視覺與資訊精簡 | 3 | 風格一致，窄畫面的工具區偏擠 |
| 錯誤恢復 | 3 | 有錯誤與下一步提示，真實設備失敗流程未測 |
| 說明與協助 | 3 | 有可搜尋的 26 章手冊 |

資訊負擔主要來自 System 頁同時呈現專案切換、工具列、篩選和每列操作。建議優先突出「搜尋、異常、目前目標」，把低頻配置放進次要選單。首次進入的狀態摘要令人安心；診斷時混用的狀態名稱與窄畫面控制項，則會打斷操作。

對熟練工程師 Alex，最有幫助的是完整異常清單；對依賴輔助工具的 Sam，表單欄位名稱應最先修正。較小的視覺調整包括：縮減短視窗側欄的品牌留白、統一中英文標題層級，以及檢視 Rack 附近重複的拓樸入口。

**自動掃描有 21 筆提示，不等於 21 個已確認缺陷。** 其中 14 筆 warning、7 筆 advisory；規則計數為 low-contrast 3、undersized-ui-text 3、tiny-text 3、gpt-thin-border-wide-shadow 5、ai-color-palette 1、side-tab 3、dark-glow 1、repeating-stripes-gradient 1、codex-grid-background 1，位置均僅標為 static/index.html:0。兩筆對比警告未辨識按鈕漸層背景，屬抽查確認的誤判；另一筆未證實。部分微小文字來自已隱藏的舊頁面元素。配色、陰影及條紋提示也不能直接當成缺陷，應保留有工程意義的材質與狀態標示。

設計決策值得聚焦兩件事：首頁的異常數字能否直接變成待處理工作清單？每一個「正常／已連線」字樣能否對應到明確的觀測依據？
