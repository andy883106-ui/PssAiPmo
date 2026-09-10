# 陳小均助理（復原版）

可運行的 Next.js 復原專案，依線上站 https://andy88310620260906.vercel.app/ 與先前從 Vercel Source 貼回的設定重建。

## 已復原

- 身分閘門（訪客／員工）
- 陳小均對話、快捷選項、本機工作紀錄（`pika-work-logs-v1`）
- 公告列、角色動畫、語音唸讀／語音輸入（瀏覽器支援時）
- `/api/xiaojun` GAS 代理（環境變數或總網設定）
- 線上站公開資源（圖示、動畫 webp、manifest）

## 尚未取得的原始碼

完整原始 `RoleDesk` / PMO 派工／圖面／Sheets 同步等，仍在：

1. Vercel → `andy88310620260906` → Deployments → Source
2. 私人 GitHub `andy883106/pika-log`（需正確帳號）

本目錄是**功能對齊的復原版**，不是 bit-identical 原始 repo。

## 本機執行

```bash
cd chen-xiaojun-assistant
npm install
npm run dev
```

開啟 http://localhost:43147

可選環境變數（`.env.local`）：

```
XIAOJUN_GAS_URL=https://script.google.com/macros/s/.../exec
XIAOJUN_GAS_SECRET=your-secret
```

## 與 recovery/ 的關係

`../recovery/chen-xiaojun-assistant/` 保留線上站靜態匯出、bundle 分析與復原清單，供對照。
