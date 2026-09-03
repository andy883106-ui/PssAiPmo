# 請把三版程式原始碼放到這裡

目標：由 AI **分析三版優缺點 → 統整成一套最新版**（同一試算表資料庫），再給你一支可部署測試的程式。  
你**不用自己先決定保留哪個功能**；把原始碼交出來即可。

## 目錄對應

| 資料夾 | 放什麼 |
|--------|--------|
| `gas/v1/` | 程式1（含其 Library 若可匯出） |
| `gas/v2/` | 程式2 |
| `gas/v3/` | 程式3 |
| `gas/unified/` | （勿手動改）統整版會寫在這裡 |

試算表資料庫（統整後共用）：  
`https://docs.google.com/spreadsheets/d/1Oh2pnlZwusM7E-CKMr-eYYYOToTzHtJge_2yiqEypcM/`

---

## 方法 A（最快）：從 Apps Script 編輯器複製

對「程式1、2、3」各做一次：

1. 打開該 Web App 對應的 Apps Script 專案（不是只有 /exec 網址）。
2. 左側每個檔案（`.gs`、`.html`）全選複製。
3. 在本 repo 對應資料夾新建同名檔，例如：
   - `gas/v1/Code.gs`
   - `gas/v1/Index.html`
   - `gas/v1/appsscript.json`（專案設定 → 顯示 `appsscript.json` 後複製）
4. 若有「資料庫 Library」：用瀏覽器開  
   `https://script.google.com/d/【Library腳本ID】/edit`  
   把 Library 內所有檔案放到例如 `gas/v1/library/`。

你先前提供的 Library ID：

- 程式1：`17htUtC7f1Ga56KjkVE-GG--rBfjbqZXO1uuZeJv4gqfetP7OJUJjGkPC`
- 程式2：`1IyMGvsATQCRaj9CDckPMuXBYFeX6cLuZcj1oFTKYKSq4698eGZ-VEceI`
- 程式3：`1qkgzY0QuqXw40bfTK7xhDp3LGmbsOSzFhYs7ESgcKLz-CCutdqX3SozV`

---

## 方法 B：用 clasp 匯出後貼上／推送

在你本機（已登入有權限的 Google 帳號）：

```bash
npm i -g @google/clasp
clasp login

# 每個專案的 Script ID 在：Apps Script → 專案設定 → 指令碼 ID
mkdir -p v1 && cd v1 && clasp clone "【程式1的Script ID】" && cd ..
mkdir -p v2 && cd v2 && clasp clone "【程式2的Script ID】" && cd ..
mkdir -p v3 && cd v3 && clasp clone "【程式3的Script ID】" && cd ..
```

把匯出的檔案放到本 repo 的 `gas/v1`、`gas/v2`、`gas/v3`，再回覆「程式已放好」。

---

## 方法 C：壓縮上傳

三個專案各匯出／複製成 zip，在 Cursor 對話附檔或放到  
`PSS_AI_PMO_雲端資料中心` 後把分享連結貼回來（需可下載）。

---

## 可選：你記得的優缺點（加速統整）

若方便，在下方或回覆裡用幾句話註記即可（非必須）：

| 版本 | 好用的地方 | 不好用／缺的地方 |
|------|------------|------------------|
| 程式1 |  |  |
| 程式2 |  |  |
| 程式3 |  |  |

收到原始碼後會產出：`gas/unified/` 單一 Web App + 共用同一試算表分頁結構，並給你部署測試步驟。
