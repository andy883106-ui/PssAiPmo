# 復原封存／遺失專案

## 陳小均助理（chen-xiaojun-assistant / pika-log）

此目錄為從先前對話貼文與線上站台（https://andy88310620260906.vercel.app/）復原的內容。

### 已復原
- 專案設定：`package.json`、`tsconfig.json`、`eslint.config.mjs`、`components.json`
- API：`src/app/api/xiaojun/route.ts`、`src/app/api/gas/route.ts`
- 線上站編譯匯出：`site-export/live/`（可離線開啟 `index.html` 瀏覽 UI）
- 元件／字串線索：`COMPONENT_NAMES.txt`、`BUNDLE_STRINGS_AND_SYMBOLS.md`

### 仍缺（完整原始碼）
- `src/app/page.tsx`、`layout.tsx`、components、`src/lib`、`public/` 原始資產
- 請從 Vercel Deployments → Source，或私有 repo `pika-log` 下載完整 ZIP 後覆蓋此目錄

詳見 `chen-xiaojun-assistant/RECOVERY_MANIFEST.md`。
