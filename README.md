# PssAiPmo

部門 PMO：整合 Google Apps Script 專案管理／日報／記錄，並對齊雲端與 NAS 備份。

## 目前狀態

三版測試程式待匯入後，由 AI 分析統整為單一最新版（共用同一試算表）。

請先依 [`gas/PROVIDE_HERE.md`](gas/PROVIDE_HERE.md) 提供程式1–3原始碼。

## 開發環境

本 repo 以 Node.js 工具鏈支援 Google Apps Script（GAS）開發：

- **安裝依賴**：`npm install`
- **驗證 GAS 原始碼**：`npm run lint`（ESLint，已內建 GAS 全域服務如 `SpreadsheetApp`、`Logger` 等；`gas/` 尚無原始碼時會安靜通過）
- **部署／匯入**：`npx clasp <command>`（需先 `npx clasp login` 以 Google 帳號授權）

> 註：GAS 執行於 Google 伺服器，`clasp` 的登入與部署需要互動式 Google OAuth 授權，無法於自動化環境中完成。
