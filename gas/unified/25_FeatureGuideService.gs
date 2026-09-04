/** In-app feature guide, runtime health, and links to current tools / Lark. */
function getFeatureGuideV23() {
  return v21Safe_('FEATURE_GUIDE', function() {
    return {
      version: PMO_V21.VERSION,
      title: 'PSS AI-PMO 統整版功能說明',
      daily: [
        '每天先看「我的收件匣」頂部今日摘要：逾期 → 今日待回報 → 7 日內到期。',
        '「目前處理」且今天還沒回報的工作會出現在「今日待回報」，先寫進度再往下做。',
        '新增工作可選「標準工作樣板」（停車場／門禁／訪客等），標題與階段一次帶入。',
        '專案內可「套用缺件樣板」：只對雲端資料夾仍缺證據的階段建立追蹤事項。',
        '同一工作可跨多日。每天用「回報此工作」寫進度；整項做完才按「回報並完成」。'
      ],
      modules: [
        { tab: 'inbox', name: '我的收件匣', from: 'R5.2 + V23.2', text: '個人待辦、今日待回報與每日摘要，避免只在 LINE 貼文字。' },
        { tab: 'work', name: '目前工作', from: 'V22 + R5.3 + V23.2', text: '工作 CRUD、標準樣板、關聯、多附件、回報／完成分離。' },
        { tab: 'calendar', name: '工作日曆', from: 'V22.5', text: '依期限看本月工作，同日多筆以＋N 展開。' },
        { tab: 'progress', name: '進度追蹤', from: 'V23.1', text: '掃描各專案 01～07 資料夾＋工作／回報，顯示缺件與建議下一步，不自動改專案狀態。' },
        { tab: 'projects', name: '專案管理', from: 'V22 + R5.3', text: '專案主檔、關聯專案、圖檔／CAD／文件、報告設定。' },
        { tab: 'training', name: '教育訓練', from: 'R5.3 / V22', text: '教材綁專案，附件進 06_教育訓練。' },
        { tab: 'thursday', name: '週四會議', from: 'V22 + R5.3', text: '本週完成／未完成／追蹤，可產出會議紀錄。' },
        { tab: 'quotes', name: '報價設備', from: 'V22', text: '設備主檔、圖片、報價草稿與產出。' },
        { tab: 'tools', name: '工具與同步', from: 'V23', text: 'NAS 匯出包、HUB／租戶圖編輯器、Lark 對照、系統檢查。' }
      ],
      databases: {
        operational: 'https://docs.google.com/spreadsheets/d/' + PMO_V21.SOURCE_DATABASE_ID,
        progress: 'https://docs.google.com/spreadsheets/d/' + PMO_V21.PROGRESS_DATABASE_ID,
        driveRoot: 'https://drive.google.com/drive/folders/' + PMO_V21.DEFAULT_PROJECT_ROOT_FOLDER_ID,
        training: 'https://drive.google.com/drive/folders/' + PMO_V21.TRAINING_FOLDER_ID,
        lark: PMO_V21.LARK_BASE_URL
      },
      tools: {
        hub: '?tool=hub',
        tenant: '?tool=tenant',
        diagnostic: '?diagnostic=1'
      }
    };
  });
}

function getRuntimeHealthV23() {
  return v21Safe_('HEALTH_V23', function() {
    var base = healthCheckV21();
    if (!base.ok) throw new Error(base.message);
    var extra = [PMO_V21.SHEETS.DELETE_LOG, PMO_V21.SHEETS.TASK_HISTORY, PMO_V21.SHEETS.PROJECT_REPORT, PMO_V21.SHEETS.NAS_EXPORT, PMO_V21.SHEETS.FOLDER_PROGRESS];
    var db = v21Db_();
    var extraChecks = extra.map(function(name) {
      var sheet = db.getSheetByName(name);
      return { sheet: name, exists: !!sheet, rows: sheet ? Math.max(0, sheet.getLastRow() - 1) : 0 };
    });
    var progressOk = false, progressTitle = '';
    try {
      var progress = SpreadsheetApp.openById(PMO_V21.PROGRESS_DATABASE_ID);
      progressOk = true;
      progressTitle = progress.getName();
    } catch (error) {
      progressTitle = error.message;
    }
    var htmlFiles = ['Index', 'Styles', 'App', 'HubEditor', 'TenantEditor'].map(function(name) {
      try {
        HtmlService.createHtmlOutputFromFile(name).getContent();
        return { file: name + '.html', ok: true };
      } catch (error) {
        return { file: name + '.html', ok: false, message: error.message };
      }
    });
    return {
      version: PMO_V21.VERSION,
      health: base.data,
      extraSheets: extraChecks,
      progressDatabase: { id: PMO_V21.PROGRESS_DATABASE_ID, ok: progressOk, title: progressTitle },
      htmlFiles: htmlFiles,
      larkUrl: PMO_V21.LARK_BASE_URL
    };
  });
}
