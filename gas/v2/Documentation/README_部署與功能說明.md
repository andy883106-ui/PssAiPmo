# PSS AI-PMO V20.5 R5.3｜完整更新程式

## 版本定位
本版以現有 R5.x 主程式為基礎，整合工作事項、專案回報、每週工作／週四會議、教育訓練與功能說明。`Index.html` 已是完整合併版，不需再手動貼 Patch。

## 主要功能

### 1. 工作事項
- 表格直接顯示：詳情、回報、編輯、進行、刪除。
- 「檢查重複工作」依 **場地代號＋專案名稱＋工作內容＋負責人** 分組。
- 刪除前會把原始資料寫入 `SYS_R53_刪除任務紀錄`。
- 編輯時先顯示既有附件；新檔只追加，不覆蓋舊附件。

### 2. 專案／關聯詳情
- 關聯詳情可查看工作、回報、檔案／路徑與推薦教材。
- 專案表新增「回報狀況」「新增回報」操作。
- 可設定專案報告是否顯示、回報狀況、摘要及下次追蹤日。

### 3. 每週工作／週四會議
- 主程式左側「每週工作／週四會議」開啟內建工作台。
- 每天都可重新檢視：本週工作、人員回報摘要、下週安排、會議追蹤、未完成監看。
- 主管自行選入需要開會的事項，也可手動新增並關聯專案。
- 會中可：儲存回報、完成並回報、本週完成＋建立下週追蹤。
- 會後可再編輯，最後產出 Google Doc 會議紀錄。
- 「電子簽名／歷史」保留原外部 Meeting 程式入口。

### 4. 教育訓練中心
- 第一層：選系統。
- 第二層：顯示該系統課程。
- 第三層：教材內容、附件、完成確認、測驗、學員簽名。
- 主管可編輯課程／手冊設定、教材附件與測驗題庫。
- 完成確認、測驗結果、簽名紀錄仍使用既有 TRAIN 資料表。

### 5. 程式內功能說明
- 登入後右上方新增 `？ 功能說明`。
- 可按 F1 開啟。
- 說明視窗內可直接跳到工作事項、週會、教育訓練。
- 「系統檢查」會確認 R5.3 核心 API 與重要資料表。

## 安裝檔案
將 `Source` 內所有檔案放入同一個 Apps Script 專案：

1. `Code.gs`
2. `V204_Upgrade.gs`
3. `R47_Workflow.gs`
4. `Work_Knowledge_R4.gs`
5. `Training_Center_R48.gs`
6. `R53_Workflow_Training_Meeting.gs`
7. `R53_Feature_Guide.gs`
8. `R53_Installer.gs`
9. `Index.html`
10. `appsscript.json`

> 不要再同時放 `R52_Workflow_Training_Meeting.gs`，避免舊版 R5.2 與 R5.3 同時維護造成混淆。

## 初次更新
1. 在 Apps Script 編輯器建立／取代上述檔案。
2. 執行 `installPssAiPmoR53()` 一次並授權。
3. 執行 `validatePssAiPmoR53()`。
4. 必須確認 `ok: true`、`missingFunctions: []`、`missingSheets: []`。
5. 開啟「部署 → 管理部署作業 → 編輯現有部署 → 建立新版本 → 部署」。
6. 這樣原本的 `/exec` 網址才會維持不變並切換到 R5.3。

## 現行 Web App
使用者提供的部署 URL：
`https://script.google.com/macros/s/AKfycbwt5A_MQbZ91dkr8pRkG84CfoYc1EHAu-YmMBEtAWAsr2gVOETDyR_aEWf6jeTgwEEE/exec`

提供的是部署 ID，不是 Apps Script Script ID；此壓縮包不會自行發布到該網址。必須在實際 Apps Script 專案建立新版本。
