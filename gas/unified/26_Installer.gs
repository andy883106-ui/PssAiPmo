/** First-run installer for the unified V23 app on one spreadsheet. */
function installPssAiPmoV23() {
  return v21Safe_('INSTALL_V23', function() {
    return v21WithLock_(function() {
      var props = PropertiesService.getScriptProperties();
      if (!props.getProperty(PMO_V21.TARGET_DATABASE_PROPERTY)) {
        props.setProperty(PMO_V21.TARGET_DATABASE_PROPERTY, PMO_V21.SOURCE_DATABASE_ID);
      }
      var setup = setupPssAiPmoV21();
      if (!setup.ok) throw new Error(setup.message);
      v21EnsureSheet_(PMO_V21.SHEETS.DELETE_LOG, PMO_V21.HEADERS.DELETE_LOG);
      v21EnsureSheet_(PMO_V21.SHEETS.TASK_HISTORY, PMO_V21.HEADERS.TASK_HISTORY);
      v21EnsureSheet_(PMO_V21.SHEETS.PROJECT_REPORT, PMO_V21.HEADERS.PROJECT_REPORT);
      v21EnsureSheet_(PMO_V21.SHEETS.NAS_EXPORT, PMO_V21.HEADERS.NAS_EXPORT);
      v21EnsureSheet_(PMO_V21.SHEETS.FOLDER_PROGRESS, PMO_V21.HEADERS.FOLDER_PROGRESS);
      v21UpsertObject_(PMO_V21.SHEETS.SETTINGS, PMO_V21.HEADERS.SETTINGS, '設定鍵', {
        '設定鍵': 'VERSION', '設定值': PMO_V21.VERSION, '說明': 'PSS AI-PMO 統整版', '更新時間': v21Now_()
      });
      v21UpsertObject_(PMO_V21.SHEETS.SETTINGS, PMO_V21.HEADERS.SETTINGS, '設定鍵', {
        '設定鍵': 'PROGRESS_DATABASE_ID', '設定值': PMO_V21.PROGRESS_DATABASE_ID,
        '說明': '部門專案管理試算表', '更新時間': v21Now_()
      });
      v21UpsertObject_(PMO_V21.SHEETS.SETTINGS, PMO_V21.HEADERS.SETTINGS, '設定鍵', {
        '設定鍵': 'LARK_BASE_URL', '設定值': PMO_V21.LARK_BASE_URL,
        '說明': 'Lark 對照（不自動寫入）', '更新時間': v21Now_()
      });
      var health = getRuntimeHealthV23();
      return {
        version: PMO_V21.VERSION,
        targetDatabaseId: v21Db_().getId(),
        sourceDatabaseId: PMO_V21.SOURCE_DATABASE_ID,
        progressDatabaseId: PMO_V21.PROGRESS_DATABASE_ID,
        health: health.data,
        next: '若 V21_ 分頁仍為空，再執行 runConfirmedMigrationV21() 從舊表匯入。然後部署 Web App。'
      };
    });
  });
}

function validatePssAiPmoV23() {
  return getRuntimeHealthV23();
}
