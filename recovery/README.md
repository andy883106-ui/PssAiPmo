# 復原：之前製作的「陳小均」專案

目標專案：**陳小均助理**（`chen-xiaojun-assistant`，別名 pika-log）

- 線上仍在運行：https://andy88310620260906.vercel.app/
- 本目錄 = 目前能自動找回的設定、API、與編譯版站台匯出

## 怎麼用

1. 下載 artifact：`chen-xiaojun-assistant-recovery.zip`
2. 解壓後看 `chen-xiaojun-assistant/`
3. 瀏覽編譯版 UI：開啟 `chen-xiaojun-assistant/site-export/live/index.html`（或用本機靜態伺服器）
4. 完整可編譯原始碼仍缺時：到 Vercel 專案 `andy88310620260906` → Deployments → **Source** 整包下載，覆蓋此目錄

## 已復原

- 設定：`package.json`、`tsconfig.json`、`eslint.config.mjs`、`components.json`
- API：`src/app/api/xiaojun/route.ts`
- 編譯站台：`site-export/live/`
- 清單：`RECOVERY_MANIFEST.md`

詳見 `chen-xiaojun-assistant/RECOVERY_MANIFEST.md`。
