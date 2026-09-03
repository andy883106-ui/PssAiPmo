/** Explicit, repeatable migration. Source sheets are never modified. */
function setupPssAiPmoV21() {
  return v21Safe_('SETUP_V21', function() {
    return v21WithLock_(function() {
      v21EnsureSheet_(PMO_V21.SHEETS.PROJECTS, PMO_V21.HEADERS.PROJECTS);
      v21EnsureSheet_(PMO_V21.SHEETS.WORK, PMO_V21.HEADERS.WORK);
      v21EnsureSheet_(PMO_V21.SHEETS.REPORTS, PMO_V21.HEADERS.REPORTS);
      v21EnsureSheet_(PMO_V21.SHEETS.HISTORY, PMO_V21.HEADERS.HISTORY);
      v21EnsureSheet_(PMO_V21.SHEETS.DRAWINGS, PMO_V21.HEADERS.DRAWINGS);
      v21EnsureSheet_(PMO_V21.SHEETS.PROJECT_USAGE, PMO_V21.HEADERS.PROJECT_USAGE);
      v21EnsureSheet_(PMO_V21.SHEETS.ATTACHMENTS, PMO_V21.HEADERS.ATTACHMENTS);
      v21EnsureSheet_(PMO_V21.SHEETS.PROJECT_RELATIONS, PMO_V21.HEADERS.PROJECT_RELATIONS);
      v21EnsureSheet_(PMO_V21.SHEETS.WORK_RELATIONS, PMO_V21.HEADERS.WORK_RELATIONS);
      v21EnsureSheet_(PMO_V21.SHEETS.TRAINING, PMO_V21.HEADERS.TRAINING);
      v21EnsureSheet_(PMO_V21.SHEETS.TRAINING_ATTACHMENTS, PMO_V21.HEADERS.TRAINING_ATTACHMENTS);
      v21EnsureSheet_(PMO_V21.SHEETS.MEETING_RECORDS, PMO_V21.HEADERS.MEETING_RECORDS);
      v21EnsureSheet_(PMO_V21.SHEETS.MEETING_SNAPSHOT, PMO_V21.HEADERS.MEETING_SNAPSHOT);
      v21EnsureSheet_(PMO_V21.SHEETS.EQUIPMENT_MEDIA, PMO_V21.HEADERS.EQUIPMENT_MEDIA);
      v21EnsureSheet_(PMO_V21.SHEETS.QUOTE_ITEMS, PMO_V21.HEADERS.QUOTE_ITEMS);
      v21EnsureSheet_(PMO_V21.SHEETS.QUOTE_MASTER, PMO_V21.HEADERS.QUOTE_MASTER);
      v21EnsureSheet_(PMO_V21.SHEETS.QUOTE_LINES, PMO_V21.HEADERS.QUOTE_LINES);
      v21EnsureSheet_(PMO_V21.SHEETS.QUOTE_FILES, PMO_V21.HEADERS.QUOTE_FILES);
      v21EnsureSheet_(PMO_V21.SHEETS.EQUIPMENT_PRICE_HISTORY, PMO_V21.HEADERS.EQUIPMENT_PRICE_HISTORY);
      v21EnsureSheet_(PMO_V21.SHEETS.AUDIT, PMO_V21.HEADERS.AUDIT);
      v21EnsureSheet_(PMO_V21.SHEETS.SETTINGS, PMO_V21.HEADERS.SETTINGS);
      v21EnsureSheet_(PMO_V21.SHEETS.DELETE_LOG, PMO_V21.HEADERS.DELETE_LOG);
      v21EnsureSheet_(PMO_V21.SHEETS.TASK_HISTORY, PMO_V21.HEADERS.TASK_HISTORY);
      v21EnsureSheet_(PMO_V21.SHEETS.PROJECT_REPORT, PMO_V21.HEADERS.PROJECT_REPORT);
      v21EnsureSheet_(PMO_V21.SHEETS.NAS_EXPORT, PMO_V21.HEADERS.NAS_EXPORT);
      v21UpsertObject_(PMO_V21.SHEETS.SETTINGS, PMO_V21.HEADERS.SETTINGS, '設定鍵', {
        '設定鍵': 'VERSION', '設定值': PMO_V21.VERSION, '說明': '目前 V21 資料結構版本', '更新時間': v21Now_()
      });
      var projectRoot=v21ProjectRoot_();
      v21UpsertObject_(PMO_V21.SHEETS.SETTINGS, PMO_V21.HEADERS.SETTINGS, '設定鍵', {
        '設定鍵':'PROJECT_ROOT_FOLDER_ID','設定值':projectRoot.getId(),'說明':'所有新增專案資料夾的固定根目錄：'+projectRoot.getName(),'更新時間':v21Now_()
      });
      v21ImportLegacyQuoteSeeds_();
      return healthCheckV21().data;
    });
  });
}

function previewMigrationV21() {
  return v21Safe_('PREVIEW_MIGRATION', function() {
    var projects = v21LoadLegacyProjectsForMigration_();
    var works = v21LoadLegacyTasks_().concat(v21LoadLegacyFollowups_());
    var reports = v21LoadLegacyReportsForMigration_();
    var history = v21UnifiedHistory_(works, reports);
    return {
      sourceDatabase: PMO_V21.SOURCE_DATABASE_ID, targetDatabase: v21Db_().getId(), sourceSheetsAreReadOnly: true,
      projects: projects.length, zeroProgress: projects.filter(function(p){ return p.progress === 0; }).length,
      zeroMissingFolder: projects.filter(function(p){ return p.progress === 0 && !p.folderUrl; }).length,
      workItems: works.length, activeWorkItems: works.filter(function(w){ return PMO_V21.ACTIVE_STATUSES.indexOf(w.status) >= 0; }).length,
      reports: reports.length, unifiedHistory: history.length,
      drawingRecords: projects.length,
      confirmToken: PMO_V21.MIGRATION_CONFIRM_TOKEN,
      note: '執行後只新增或更新 V21_ 分頁，不修改舊分頁。'
    };
  });
}

function migrateLegacyDataV21(confirmToken) {
  if (confirmToken !== PMO_V21.MIGRATION_CONFIRM_TOKEN) return v21Fail_('確認碼不正確，未執行遷移。', 'CONFIRM_REQUIRED');
  return v21Safe_('MIGRATE_V21', function() {
    return v21WithLock_(function() {
      v21EnsureSheet_(PMO_V21.SHEETS.PROJECTS, PMO_V21.HEADERS.PROJECTS);
      v21EnsureSheet_(PMO_V21.SHEETS.WORK, PMO_V21.HEADERS.WORK);
      v21EnsureSheet_(PMO_V21.SHEETS.REPORTS, PMO_V21.HEADERS.REPORTS);
      v21EnsureSheet_(PMO_V21.SHEETS.HISTORY, PMO_V21.HEADERS.HISTORY);
      v21EnsureSheet_(PMO_V21.SHEETS.DRAWINGS, PMO_V21.HEADERS.DRAWINGS);
      v21EnsureSheet_(PMO_V21.SHEETS.PROJECT_USAGE, PMO_V21.HEADERS.PROJECT_USAGE);
      v21EnsureSheet_(PMO_V21.SHEETS.ATTACHMENTS, PMO_V21.HEADERS.ATTACHMENTS);
      v21EnsureSheet_(PMO_V21.SHEETS.PROJECT_RELATIONS, PMO_V21.HEADERS.PROJECT_RELATIONS);
      v21EnsureSheet_(PMO_V21.SHEETS.WORK_RELATIONS, PMO_V21.HEADERS.WORK_RELATIONS);
      v21EnsureSheet_(PMO_V21.SHEETS.TRAINING, PMO_V21.HEADERS.TRAINING);
      v21EnsureSheet_(PMO_V21.SHEETS.TRAINING_ATTACHMENTS, PMO_V21.HEADERS.TRAINING_ATTACHMENTS);
      v21EnsureSheet_(PMO_V21.SHEETS.MEETING_RECORDS, PMO_V21.HEADERS.MEETING_RECORDS);
      v21EnsureSheet_(PMO_V21.SHEETS.MEETING_SNAPSHOT, PMO_V21.HEADERS.MEETING_SNAPSHOT);
      v21EnsureSheet_(PMO_V21.SHEETS.EQUIPMENT_MEDIA, PMO_V21.HEADERS.EQUIPMENT_MEDIA);
      v21EnsureSheet_(PMO_V21.SHEETS.QUOTE_ITEMS, PMO_V21.HEADERS.QUOTE_ITEMS);
      v21EnsureSheet_(PMO_V21.SHEETS.QUOTE_MASTER, PMO_V21.HEADERS.QUOTE_MASTER);
      v21EnsureSheet_(PMO_V21.SHEETS.QUOTE_LINES, PMO_V21.HEADERS.QUOTE_LINES);
      v21EnsureSheet_(PMO_V21.SHEETS.QUOTE_FILES, PMO_V21.HEADERS.QUOTE_FILES);
      v21EnsureSheet_(PMO_V21.SHEETS.EQUIPMENT_PRICE_HISTORY, PMO_V21.HEADERS.EQUIPMENT_PRICE_HISTORY);
      v21EnsureSheet_(PMO_V21.SHEETS.AUDIT, PMO_V21.HEADERS.AUDIT);
      v21EnsureSheet_(PMO_V21.SHEETS.SETTINGS, PMO_V21.HEADERS.SETTINGS);
      var projects = v21LoadLegacyProjectsForMigration_();
      var works = v21LoadLegacyTasks_().concat(v21LoadLegacyFollowups_());
      var reports = v21LoadLegacyReportsForMigration_();
      var history = v21UnifiedHistory_(works, reports);
      var drawings = projects.map(function(project) {
        var state = v21DrawingState_(project, works, reports, history);
        return { id: 'DRAW-' + v21Hash_(project.id), projectId: project.id, projectName: project.name, title: state.title,
          status: state.status, submittedAt: state.date, review: state.confidence, version: '', attachment: '',
          sourceSheet: state.source, sourceId: '', updatedAt: v21Now_() };
      });
      v21BulkUpsert_(PMO_V21.SHEETS.PROJECTS, PMO_V21.HEADERS.PROJECTS, '專案ID', projects.map(v21ProjectRow_));
      v21BulkUpsert_(PMO_V21.SHEETS.WORK, PMO_V21.HEADERS.WORK, '工作ID', works.map(v21WorkRow_));
      v21BulkUpsert_(PMO_V21.SHEETS.REPORTS, PMO_V21.HEADERS.REPORTS, '回報ID', reports.map(v21ReportRow_));
      v21BulkUpsert_(PMO_V21.SHEETS.HISTORY, PMO_V21.HEADERS.HISTORY, '歷程ID', history.map(v21HistoryRow_));
      v21BulkUpsert_(PMO_V21.SHEETS.DRAWINGS, PMO_V21.HEADERS.DRAWINGS, '圖面ID', drawings.map(v21DrawingRow_));
      v21ClearCache_();
      v21Audit_('MIGRATE_V21', '資料遷移', 'V21', '成功', JSON.stringify({projects:projects.length,works:works.length,reports:reports.length,history:history.length}));
      return { projects: projects.length, workItems: works.length, reports: reports.length, history: history.length, drawings: drawings.length };
    });
  });
}

function runConfirmedMigrationV21() {
  return migrateLegacyDataV21(PMO_V21.MIGRATION_CONFIRM_TOKEN);
}

function v21LoadLegacyProjectsForMigration_() {
  return v21LoadLegacyProjects_();
}

function v21LoadLegacyReportsForMigration_() {
  var table = v21ReadSourceTable_(PMO_V21.SHEETS.LEGACY_REPORTS);
  var hasCanonical = v21HasCanonicalData_(PMO_V21.SHEETS.REPORTS);
  if (!hasCanonical) return v21LoadReports_();
  return v21LoadReportsFromTable_(table);
}

function v21LoadReportsFromTable_(table) {
  var map = v21HeaderMap_(table.headers);
  return table.rows.map(function(row, index) {
    var sourceId = v21Text_(v21Pick_(row, map, ['回報ID','事件ID']));
    var completed = v21Text_(v21Pick_(row, map, ['本次完成','回報事項','今日完成事項','完成資料']));
    if (!sourceId && !completed) return null;
    return { id: sourceId || 'LR-' + v21Hash_(index + '|' + completed), date: v21Date_(v21Pick_(row,map,['回報日期','日期'])),
      employee:v21Text_(v21Pick_(row,map,['人員'])),supervisor:v21Text_(v21Pick_(row,map,['主管'])),projectId:v21Text_(v21Pick_(row,map,['場地代號'])),
      projectName:v21Text_(v21Pick_(row,map,['專案名稱'])),title:v21Text_(v21Pick_(row,map,['事件說明','事件標題']))||completed.slice(0,60),completed:completed,
      issue:v21Text_(v21Pick_(row,map,['未完成/問題','遇到問題'])),followUp:v21Text_(v21Pick_(row,map,['後續事項','明日計畫'])),
      attachment:v21Text_(v21Pick_(row,map,['附件連結','施工照片連結'])),relatedWorkId:v21Text_(v21Pick_(row,map,['關聯任務ID','任務ID'])),
      sourceSheet:PMO_V21.SHEETS.LEGACY_REPORTS,sourceId:sourceId||String(index+2),createdAt:v21Text_(v21Pick_(row,map,['建立時間'])),updatedAt:v21Text_(v21Pick_(row,map,['更新時間'])) };
  }).filter(Boolean);
}

function v21ProjectRow_(p){ return {'專案ID':p.id,'專案名稱':p.name,'客戶':p.customer,'系統類型':p.systemType,'負責人':p.owner,'專案狀態':p.status,'進度':p.progress,'雲端資料夾':p.folderUrl,'圖面送審狀態':p.drawingStatus,'開始日':p.startDate,'預計完成日':p.dueDate,'來源分頁':p.sourceSheet,'來源列':p.sourceRow,'更新時間':p.updatedAt||v21Now_()}; }
function v21WorkRow_(w){ return {'工作ID':w.id,'專案ID':w.projectId,'專案名稱':w.projectName,'工作標題':w.title,'工作類型':w.type,'負責人':w.assignee,'協作人':w.collaborator,'優先級':w.priority,'開始日':w.startDate,'預計完成日':w.dueDate,'狀態':w.status,'進度':w.progress,'完成內容':w.completion,'附件連結':w.attachment,'來源分頁':w.sourceSheet,'來源ID':w.sourceId,'建立時間':w.createdAt,'更新時間':w.updatedAt||v21Now_()}; }
function v21ReportRow_(r){ return {'回報ID':r.id,'回報日期':r.date,'人員':r.employee,'主管':r.supervisor,'專案ID':r.projectId,'專案名稱':r.projectName,'事件標題':r.title,'完成回報':r.completed,'未完成問題':r.issue,'後續事項':r.followUp,'附件連結':r.attachment,'關聯工作ID':r.relatedWorkId,'來源分頁':r.sourceSheet,'來源ID':r.sourceId,'建立時間':r.createdAt,'更新時間':r.updatedAt||v21Now_()}; }
function v21HistoryRow_(h){ return {'歷程ID':h.id,'發生時間':h.occurredAt,'專案ID':h.projectId,'專案名稱':h.projectName,'類型':h.type,'來源分頁':h.sourceSheet,'來源ID':h.sourceId,'標題':h.title,'內容':h.content,'負責人':h.owner,'狀態':h.status,'連結':h.link,'內容雜湊':h.hash}; }
function v21DrawingRow_(d){ return {'圖面ID':d.id,'專案ID':d.projectId,'專案名稱':d.projectName,'圖面標題':d.title,'送審狀態':d.status,'送審日期':d.submittedAt,'審查結果':d.review,'版次':d.version,'附件連結':d.attachment,'來源分頁':d.sourceSheet,'來源ID':d.sourceId,'更新時間':d.updatedAt}; }

function v21BulkUpsert_(sheetName, headers, keyHeader, objects) {
  var sheet = v21EnsureSheet_(sheetName, headers);
  var existing = sheet.getLastRow() > 1 ? sheet.getRange(2,1,sheet.getLastRow()-1,headers.length).getValues() : [];
  var keyIndex = headers.indexOf(keyHeader);
  var byKey = {};
  existing.forEach(function(row){ var key=v21Text_(row[keyIndex]); if(key) byKey[key]=row; });
  objects.forEach(function(object){
    var key=v21Text_(object[keyHeader]); if(!key)return;
    var row=byKey[key]||headers.map(function(){return '';});
    headers.forEach(function(header,index){ if(object[header]!==undefined) row[index]=object[header]; });
    byKey[key]=row;
  });
  var rows=Object.keys(byKey).map(function(key){return byKey[key];});
  if (sheet.getLastRow()>1) sheet.getRange(2,1,sheet.getLastRow()-1,headers.length).clearContent();
  if (rows.length) sheet.getRange(2,1,rows.length,headers.length).setValues(rows);
}

function healthCheckV21() {
  var checks = [];
  var db = v21Db_();
  [PMO_V21.SHEETS.PROJECTS,PMO_V21.SHEETS.WORK,PMO_V21.SHEETS.REPORTS,PMO_V21.SHEETS.HISTORY,PMO_V21.SHEETS.DRAWINGS,PMO_V21.SHEETS.PROJECT_USAGE,PMO_V21.SHEETS.ATTACHMENTS,PMO_V21.SHEETS.PROJECT_RELATIONS,PMO_V21.SHEETS.WORK_RELATIONS,PMO_V21.SHEETS.TRAINING,PMO_V21.SHEETS.TRAINING_ATTACHMENTS,PMO_V21.SHEETS.MEETING_RECORDS,PMO_V21.SHEETS.MEETING_SNAPSHOT,PMO_V21.SHEETS.EQUIPMENT_MEDIA,PMO_V21.SHEETS.QUOTE_ITEMS,PMO_V21.SHEETS.QUOTE_MASTER,PMO_V21.SHEETS.QUOTE_LINES,PMO_V21.SHEETS.QUOTE_FILES,PMO_V21.SHEETS.EQUIPMENT_PRICE_HISTORY,PMO_V21.SHEETS.AUDIT,PMO_V21.SHEETS.SETTINGS,PMO_V21.SHEETS.DELETE_LOG,PMO_V21.SHEETS.TASK_HISTORY,PMO_V21.SHEETS.PROJECT_REPORT,PMO_V21.SHEETS.NAS_EXPORT].forEach(function(name){
    var sheet=db.getSheetByName(name);
    checks.push({sheet:name,exists:!!sheet,rows:sheet?Math.max(0,sheet.getLastRow()-1):0});
  });
  var source=v21SourceDb_();
  var sourceCore=[PMO_V21.SHEETS.LEGACY_PROJECTS,PMO_V21.SHEETS.LEGACY_TASKS,PMO_V21.SHEETS.LEGACY_REPORTS].map(function(name){return {sheet:name,exists:!!source.getSheetByName(name)};});
  return v21Result_({version:PMO_V21.VERSION,sourceDatabaseId:PMO_V21.SOURCE_DATABASE_ID,targetDatabaseId:db.getId(),isolatedDatabase:db.getId()!==PMO_V21.SOURCE_DATABASE_ID,timeZone:db.getSpreadsheetTimeZone(),checks:checks,sourceCore:sourceCore});
}

function createV21TargetDatabase() {
  return v21Safe_('CREATE_TARGET_DATABASE', function() {
    var file = SpreadsheetApp.create('PSS_AI_PMO_V21_資料庫');
    file.setSpreadsheetTimeZone(PMO_V21.TIME_ZONE);
    PropertiesService.getScriptProperties().setProperty(PMO_V21.TARGET_DATABASE_PROPERTY, file.getId());
    file.getSheets()[0].setName(PMO_V21.SHEETS.SETTINGS);
    var setup = setupPssAiPmoV21();
    if (!setup.ok) throw new Error(setup.message);
    return {id:file.getId(),url:file.getUrl(),title:file.getName()};
  });
}

function configureV21TargetDatabase(targetSpreadsheetId) {
  return v21Safe_('CONFIGURE_TARGET_DATABASE', function() {
    var id = v21Text_(targetSpreadsheetId);
    if (!id) throw new Error('請提供 V21 目標試算表 ID。');
    var file = SpreadsheetApp.openById(id);
    PropertiesService.getScriptProperties().setProperty(PMO_V21.TARGET_DATABASE_PROPERTY, id);
    return {id:id,url:file.getUrl(),title:file.getName()};
  });
}
