# 陳小均助理 — 從線上站匯出

來源：https://andy88310620260906.vercel.app/

## 重要說明

這不是原始 TypeScript / Next.js 專案原始碼。
原始 repo（名稱線索：`chen-xiaojun-assistant`）目前不在本機 GitHub 可見清單，
也無法從 Vercel 未登入狀態拉回 source。

本 ZIP 包含：

- `site/`：線上站可公開下載的 HTML / CSS / JS / 圖示 / 動畫圖
- `beautified/app.bundle.beautified.js`：主前端 bundle 美化後版本（仍為編譯結果，變數名已壓縮）
- `assets/chen-xiaojun-animated.webp`：角色動畫圖

本地預覽（僅靜態）：

```bash
cd site && python3 -m http.server 8080
```

要拿真正可維護的原始碼，請到：

1. Vercel Dashboard → 專案 `andy88310620260906` → Settings → Git 看連結的 repo
2. 或打開當初部署「陳小均助理」的那個 Cursor Agent 對話下載檔案
