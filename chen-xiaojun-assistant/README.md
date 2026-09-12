# 陳小均助理 V3

可運行的 Next.js 專案（訪客對話 + 員工工作台 + 管理者總網）。

線上參考站：https://andy88310620260906.vercel.app/

## V3 更新內容

- **管理者總網**：功能選單（進度、流程、搜尋、回報、對話、交代、人員、切換身分、雲端…）
- **員工工作台**：今日交代、工作回報、預排事項
- **訪客對話**：沿用小均對話／本機紀錄／語音
- **身分切換**：管理者可暫時變成訪客或員工驗收流程
- 版本號 `3.0.0`

## 本機執行

```bash
cd chen-xiaojun-assistant
npm install
npm run dev
```

開啟 http://localhost:43147

可選 `.env.local`：

```
XIAOJUN_GAS_URL=https://script.google.com/macros/s/.../exec
XIAOJUN_GAS_SECRET=your-secret
```

管理者請用預設管理員 Gmail（`andy883106@gmail.com`，可在本機 localStorage `jun-admin-email-v1` 變更）登入進入總網。

## 說明

完整原始 RoleDesk／PMO 雲端模組仍建議以 Vercel Source 或私有 `pika-log` 覆寫補強；本 V3 為可運行升級版，總網部分模組先提供本機骨架，接上 GAS 後可擴充。
