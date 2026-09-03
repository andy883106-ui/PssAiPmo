# R5.2 驗證報告

驗證日期：2026-08-13（Asia/Taipei）

- Apps Script 後端語法：通過。
- HTML 內嵌 JavaScript 語法：通過。
- 與 V20.4 基礎 `Code.gs + V204_Upgrade.gs` 合併語法：通過。
- 與 R4.9 擴充後端合併語法：通過。
- 已確認 R5.2 不寫入已刪除的 `batchStatus_*` 前端欄位。
- Windows PowerShell 安裝器：純 ASCII，避免中文編碼破壞引號與大括號。
- 安裝策略：先 clone 正式 HEAD、建立本機 ZIP 備份，再修復及注入；不使用較舊主程式覆蓋正式版。
- 線上只讀檢核發現並納入修復：`projectCellHtmlV18()` 第 61 行 URL 正規表示式被截斷，造成 `Invalid regular expression: missing /`。
- 資料庫永久刪除：無。

正式上線後仍需執行：

```javascript
setupPssWorkFlowR52()
runPssWorkFlowSelfTestR52()
```

並依 README 的 10 項驗收清單完成一筆測試任務、回報、附件與關聯派工。
