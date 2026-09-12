# 復原：之前製作的「陳小均」專案

目標專案：**陳小均助理**（`chen-xiaojun-assistant`，別名 pika-log）

- 線上仍在運行：https://andy88310620260906.vercel.app/
- 本目錄 = 目前能自動找回的設定、API、與編譯版站台匯出

## 怎麼用

1. **可運行復原版**：到 repo 根目錄 `chen-xiaojun-assistant/`（`npm install && npm run dev`）
2. 本目錄保留靜態匯出、bundle 分析與藍圖對照
3. 瀏覽編譯版 UI：`chen-xiaojun-assistant/site-export/live/index.html`
4. 若要 bit-identical 原始碼：Vercel `andy88310620260906` → Deployments → **Source**，或私人 `andy883106/pika-log`

## 已復原

- 設定：`package.json`、`tsconfig.json`、`eslint.config.mjs`、`components.json`
- API：`src/app/api/xiaojun/route.ts`
- 編譯站台：`site-export/live/`
- 清單：`RECOVERY_MANIFEST.md`
- RoleDesk 重建藍圖：`ROLEDESK_BLUEPRINT.md`（21 個 `callCloud` actions、身分模型、本機資料結構）

詳見 `chen-xiaojun-assistant/RECOVERY_MANIFEST.md`。
