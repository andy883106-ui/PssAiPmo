/** Single public API gateway and web entry point. Always returns a visible diagnostic page on boot failure. */
function doGet(event) {
  try {
    if (event && event.parameter && event.parameter.diagnostic === '1') return v21DiagnosticPage_();
    var template = HtmlService.createTemplateFromFile('Index');
    template.version = PMO_V21.VERSION;
    return template.evaluate().setTitle('PSS AI-PMO V22.5.0').addMetaTag('viewport','width=device-width, initial-scale=1');
  } catch (error) {
    return HtmlService.createHtmlOutput(v21BootErrorHtml_(error)).setTitle('PSS AI-PMO 啟動檢查')
      .addMetaTag('viewport','width=device-width, initial-scale=1');
  }
}

function v21DiagnosticPage_() {
  var checks=[],authorization='UNKNOWN',databaseId='',databaseTitle='';
  try{authorization=String(ScriptApp.getAuthorizationInfo(ScriptApp.AuthMode.FULL).getAuthorizationStatus());}catch(error){checks.push('授權檢查：'+error.message);}
  try{var db=v21Db_();databaseId=db.getId();databaseTitle=db.getName();checks.push('資料庫：可開啟');}catch(error){checks.push('資料庫：'+error.message);}
  try{HtmlService.createHtmlOutputFromFile('Index').getContent();checks.push('Index.html：存在');}catch(error){checks.push('Index.html：'+error.message);}
  try{HtmlService.createHtmlOutputFromFile('Styles').getContent();checks.push('Styles.html：存在');}catch(error){checks.push('Styles.html：'+error.message);}
  try{HtmlService.createHtmlOutputFromFile('App').getContent();checks.push('App.html：存在');}catch(error){checks.push('App.html：'+error.message);}
  var body='<h1>PSS AI-PMO V'+v21EscapeHtml_(PMO_V21.VERSION)+' 部署診斷</h1><p class="ok">doGet 已正常執行。</p>'+
    '<dl><dt>授權狀態</dt><dd>'+v21EscapeHtml_(authorization)+'</dd><dt>目標資料庫</dt><dd>'+v21EscapeHtml_([databaseTitle,databaseId].filter(Boolean).join('｜')||'無法讀取')+'</dd></dl>'+
    '<h2>檔案與連線檢查</h2><ul>'+checks.map(function(item){return '<li>'+v21EscapeHtml_(item)+'</li>';}).join('')+'</ul>'+
    '<p>若三個 HTML 檔案均存在，請回到一般網址；正式使用網址結尾應為 <b>/exec</b>，不是 <b>/dev</b>。</p>';
  return HtmlService.createHtmlOutput(v21DiagnosticShell_(body)).setTitle('PSS AI-PMO 部署診斷').addMetaTag('viewport','width=device-width, initial-scale=1');
}

function v21BootErrorHtml_(error) {
  var message=error&&error.message?error.message:String(error);
  return v21DiagnosticShell_('<h1>PSS AI-PMO 無法啟動</h1><p class="bad">伺服器已捕捉啟動錯誤，頁面不再保持空白。</p><h2>錯誤內容</h2><pre>'+v21EscapeHtml_(message)+'</pre><p>請確認 Apps Script 專案內的檔名完全是 <b>Index.html</b>、<b>Styles.html</b>、<b>App.html</b>，並重新建立正式 /exec 部署。</p>');
}

function v21DiagnosticShell_(body) {
  return '<!doctype html><html lang="zh-Hant"><head><base target="_top"><meta charset="utf-8"><style>body{font-family:system-ui,"Microsoft JhengHei",sans-serif;background:#f3f6f7;color:#183044;margin:0;padding:32px}main{max-width:820px;margin:auto;background:#fff;border:1px solid #d9e2e8;border-radius:16px;padding:26px;box-shadow:0 10px 30px rgba(22,50,79,.1)}h1{margin-top:0}.ok{color:#0f766e;font-weight:800}.bad{color:#b42318;font-weight:800}dt{font-weight:800;margin-top:10px}dd{margin-left:0;color:#607080}li{margin:7px 0}pre{white-space:pre-wrap;background:#fff1f0;border-radius:10px;padding:14px}</style></head><body><main>'+body+'</main></body></html>';
}

function v21EscapeHtml_(value) {
  return String(value===undefined||value===null?'':value).replace(/[&<>"']/g,function(char){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char];});
}

function apiV21(request) {
  request = request || {};
  var action = v21Text_(request.action);
  var payload = request.payload || {};
  var routes = {
    bootstrap: function(){ return getBootstrapV21(payload); },
    project: function(){ return getProjectDetailV21(payload.projectId); },
    suggestions: function(){ return getSuggestionsV21(); },
    createProject: function(){ return createProjectV21(payload); },
    updateProject: function(){ return updateProjectV21(payload); },
    toggleProjectPin: function(){ return toggleProjectPinV21(payload.projectId); },
    projectFiles: function(){ return listProjectFilesV21(payload); },
    attachments: function(){ return getAttachmentsV21(payload); },
    saveProjectRelation: function(){ return saveProjectRelationV21(payload); },
    removeProjectRelation: function(){ return removeProjectRelationV21(payload); },
    archiveProject: function(){ return archiveProjectV21(payload); },
    restoreProject: function(){ return restoreArchivedProjectV21(payload); },
    moveProjectFile: function(){ return moveProjectFileV21(payload); },
    saveWork: function(){ return saveWorkItemV21(payload); },
    workRelations: function(){ return getWorkRelationsV21(payload); },
    relatedSearch: function(){ return searchRelatedItemsV224(payload); },
    completeWork: function(){ return completeWorkItemV21(payload); },
    completeWorkNoTrack: function(){ return completeWorkNoTrackV224(payload); },
    deleteWork: function(){ return deleteWorkItemV224(payload); },
    workCalendar: function(){ return getWorkCalendarV224(payload); },
    saveReport: function(){ return saveReportV21(payload); },
    upload: function(){ return uploadAttachmentV21(payload); },
    training: function(){ return getTrainingHubV21(payload); },
    trainingDetail: function(){ return getTrainingDetailV21(payload.courseId); },
    saveTraining: function(){ return saveTrainingCourseV21(payload); },
    uploadTrainingAttachment: function(){ return uploadTrainingAttachmentV21(payload); },
    thursday: function(){ return getThursdayMeetingV21(); },
    refreshThursday: function(){ return refreshThursdayMeetingV21(); },
    diagnoseThursday: function(){ return diagnoseThursdayMeetingV21(); },
    importMeetingRecord20260813: function(){ return importMeetingRecord20260813V21(); },
    meetingItem: function(){ return getThursdayMeetingItemV21(payload); },
    saveMeetingItem: function(){ return saveThursdayMeetingItemV21(payload); },
    generateMeetingRecord: function(){ return generateThursdayMeetingRecordV21(payload); },
    previewDrawingProgress: function(){ return previewDrawingProgress20260814V21(); },
    importDrawingProgress: function(){ return importDrawingProgress20260814V21(payload.confirmToken); },
    quotes: function(){ return getQuoteCenterV21(payload); },
    quoteDetail: function(){ return getQuoteDetailV21(payload); },
    saveQuote: function(){ return saveQuoteDraftV21(payload); },
    generateQuoteFiles: function(){ return generateQuoteFilesV21(payload); },
    saveQuoteItem: function(){ return saveQuoteCatalogItemV21(payload); },
    archiveQuoteItem: function(){ return archiveQuoteCatalogItemV21(payload); },
    saveEquipmentImage: function(){ return saveEquipmentImageV21(payload); },
    uploadEquipmentImage: function(){ return uploadEquipmentImageV21(payload); },
    deleteEquipmentImage: function(){ return deleteEquipmentImageV21(payload); },
    setEquipmentCover: function(){ return setEquipmentCoverImageV224(payload); },
    previewQuoteCatalogImport: function(){ return previewQuoteCatalogImportV21(payload); },
    importQuoteCatalog: function(){ return importQuoteCatalogV21(payload); },
    importLegacyQuoteCatalog: function(){ return importLegacyQuoteCatalogV21(payload); },
    exportQuoteCatalog: function(){ return exportQuoteCatalogV21(); },
    deleteQuoteDraft: function(){ return deleteQuoteDraftV21(payload); },
    migrationPreview: function(){ return previewMigrationV21(); },
    health: function(){ return healthCheckV21(); }
  };
  if (!routes[action]) return v21Fail_('不允許的操作：' + action, 'ROUTE_NOT_ALLOWED');
  return routes[action]();
}
