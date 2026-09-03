/** Preview and create a clean V2.0 spreadsheet without deleting or changing the previous database. */
function previewCleanV20DatabaseV21() {
  var result=v21Safe_('PREVIEW_CLEAN_V20_DATABASE',function(){
    var data=v21SelectCleanDatabaseData_();
    return v21CleanDatabaseSummary_(data);
  });
  console.log(JSON.stringify(result));
  return result;
}

function runCreateCleanV20DatabaseV21() {
  var result=createCleanV20DatabaseV21(PMO_V21.CLEAN_DATABASE_CONFIRM_TOKEN);
  console.log(JSON.stringify(result));
  return result;
}

function createCleanV20DatabaseV21(confirmToken) {
  if(confirmToken!==PMO_V21.CLEAN_DATABASE_CONFIRM_TOKEN)return v21Fail_('確認碼不正確，未建立新資料庫。','CONFIRM_REQUIRED');
  return v21Safe_('CREATE_CLEAN_V20_DATABASE',function(){
    return v21WithLock_(function(){
      var properties=PropertiesService.getScriptProperties(),existingId=properties.getProperty(PMO_V21.CLEAN_DATABASE_ID_PROPERTY);
      if(existingId){
        try{var existing=SpreadsheetApp.openById(existingId);return {created:false,id:existingId,url:existing.getUrl(),title:existing.getName(),message:'已建立過精簡資料庫；未重複建立。'};}catch(ignored){}
      }
      var previous=v21Db_(),previousId=previous.getId(),data=v21SelectCleanDatabaseData_(),summary=v21CleanDatabaseSummary_(data);
      var name='PSS_AI_PMO_V2.0_精簡資料庫_'+v21Today_().replace(/-/g,''),file=SpreadsheetApp.create(name);
      file.setSpreadsheetTimeZone(PMO_V21.TIME_ZONE);file.getSheets()[0].setName(PMO_V21.SHEETS.SETTINGS);
      v21WriteCleanDatabase_(file,data,previousId,summary);
      SpreadsheetApp.flush();
      v21Audit_('CREATE_CLEAN_V20_DATABASE','資料庫',file.getId(),'成功',JSON.stringify(summary));
      properties.setProperty(PMO_V21.CLEAN_DATABASE_ID_PROPERTY,file.getId());
      properties.setProperty(PMO_V21.TARGET_DATABASE_PROPERTY,file.getId());
      return {created:true,id:file.getId(),url:file.getUrl(),title:file.getName(),previousDatabaseId:previousId,previousDatabaseUntouched:true,summary:summary};
    });
  });
}

function v21SelectCleanDatabaseData_() {
  var projects=v21LoadProjects_(),allWork=v21LoadWork_(),activeWork=allWork.filter(function(item){return PMO_V21.ACTIVE_STATUSES.indexOf(item.status)>=0;});
  var activeIds={},activeNames={};activeWork.forEach(function(item){if(item.projectId)activeIds[item.projectId]=true;if(item.projectName)activeNames[v21MeetingKeyText_(item.projectName)]=true;});
  var keptProjects=projects.filter(function(project){var closed=/完成|結案|取消|作廢/.test(v21Text_(project.status));return !!activeIds[project.id]||!closed;});
  var keptIds={},keptNames={};keptProjects.forEach(function(project){if(project.id)keptIds[project.id]=true;if(project.name)keptNames[v21MeetingKeyText_(project.name)]=true;});
  activeWork.forEach(function(item){if(item.projectId&&!keptIds[item.projectId]){keptProjects.push({id:item.projectId,name:item.projectName||item.projectId,customer:'',systemType:'',owner:item.assignee,status:'待追蹤',progress:0,folderUrl:'',drawingStatus:'',startDate:item.startDate,dueDate:item.dueDate,sourceSheet:item.sourceSheet,sourceRow:'',updatedAt:item.updatedAt});keptIds[item.projectId]=true;if(item.projectName)keptNames[v21MeetingKeyText_(item.projectName)]=true;}});
  var reports=v21LoadReports_(),reportCutoff=v21IsoDaysAgo_(v21Today_(),180),recentReports=reports.filter(function(item){return item.date>=reportCutoff&&v21BelongsToKeptProject_(item,keptIds,keptNames);});
  var history=v21UnifiedHistory_(allWork,reports).filter(function(item){return v21BelongsToKeptProject_(item,keptIds,keptNames);});
  var drawingMap=v21LoadCanonicalDrawingMap_(),drawings=keptProjects.map(function(project){var state=v21DrawingState_(project,allWork,reports,history,drawingMap);return {id:'DRAW-'+v21Hash_(project.id),projectId:project.id,projectName:project.name,title:state.title,status:state.status,submittedAt:state.date,review:state.confidence,version:'',attachment:'',sourceSheet:state.source,sourceId:'',updatedAt:state.date||v21Now_()};});
  var usage=v21ReadCanonicalObjects_(PMO_V21.SHEETS.PROJECT_USAGE,PMO_V21.HEADERS.PROJECT_USAGE).filter(function(row){return !!keptIds[v21Text_(row['專案ID'])];});
  var training=v21ReadCanonicalObjects_(PMO_V21.SHEETS.TRAINING,PMO_V21.HEADERS.TRAINING).filter(function(row){return !/停用|刪除|取消|作廢/.test(v21Text_(row['狀態']));}),courseIds={};
  training.forEach(function(row){courseIds[v21Text_(row['課程ID'])]=true;});
  var trainingAttachments=v21ReadCanonicalObjects_(PMO_V21.SHEETS.TRAINING_ATTACHMENTS,PMO_V21.HEADERS.TRAINING_ATTACHMENTS).filter(function(row){return !!courseIds[v21Text_(row['課程ID'])];});
  var meetingRecords=v21ReadCanonicalObjects_(PMO_V21.SHEETS.MEETING_RECORDS,PMO_V21.HEADERS.MEETING_RECORDS);
  var equipmentMedia=v21ReadCanonicalObjects_(PMO_V21.SHEETS.EQUIPMENT_MEDIA,PMO_V21.HEADERS.EQUIPMENT_MEDIA);
  var quoteItems=v21ReadCanonicalObjects_(PMO_V21.SHEETS.QUOTE_ITEMS,PMO_V21.HEADERS.QUOTE_ITEMS);
  var quoteMaster=v21ReadCanonicalObjects_(PMO_V21.SHEETS.QUOTE_MASTER,PMO_V21.HEADERS.QUOTE_MASTER).filter(function(row){return !/取消|作廢|已刪除/.test(v21Text_(row['狀態']));}),quoteIds={};
  quoteMaster.forEach(function(row){quoteIds[v21Text_(row['報價ID'])]=true;});
  var quoteLines=v21ReadCanonicalObjects_(PMO_V21.SHEETS.QUOTE_LINES,PMO_V21.HEADERS.QUOTE_LINES).filter(function(row){return !!quoteIds[v21Text_(row['報價ID'])];});
  var quoteFiles=v21ReadCanonicalObjects_(PMO_V21.SHEETS.QUOTE_FILES,PMO_V21.HEADERS.QUOTE_FILES).filter(function(row){return !!quoteIds[v21Text_(row['報價ID'])];});
  var attachments=v21ReadCanonicalObjects_(PMO_V21.SHEETS.ATTACHMENTS,PMO_V21.HEADERS.ATTACHMENTS).filter(function(row){var projectId=v21Text_(row['專案ID']);return !projectId||!!keptIds[projectId];});
  var projectRelations=v21ReadCanonicalObjects_(PMO_V21.SHEETS.PROJECT_RELATIONS,PMO_V21.HEADERS.PROJECT_RELATIONS).filter(function(row){return !!keptIds[v21Text_(row['主專案ID'])]&&!!keptIds[v21Text_(row['關聯專案ID'])];});
  var activeWorkIds={};activeWork.forEach(function(item){activeWorkIds[item.id]=true;});
  var workRelations=v21ReadCanonicalObjects_(PMO_V21.SHEETS.WORK_RELATIONS,PMO_V21.HEADERS.WORK_RELATIONS).filter(function(row){return !!activeWorkIds[v21Text_(row['工作ID'])];});
  var equipmentPriceHistory=v21ReadCanonicalObjects_(PMO_V21.SHEETS.EQUIPMENT_PRICE_HISTORY,PMO_V21.HEADERS.EQUIPMENT_PRICE_HISTORY);
  return {sourceDatabaseId:v21Db_().getId(),projects:keptProjects,activeWork:activeWork,recentReports:recentReports,history:history,drawings:drawings,usage:usage,
    training:training,trainingAttachments:trainingAttachments,meetingRecords:meetingRecords,equipmentMedia:equipmentMedia,quoteItems:quoteItems,quoteMaster:quoteMaster,quoteLines:quoteLines,quoteFiles:quoteFiles,
    attachments:attachments,projectRelations:projectRelations,workRelations:workRelations,equipmentPriceHistory:equipmentPriceHistory,
    sourceCounts:{projects:projects.length,work:allWork.length,reports:reports.length},reportCutoff:reportCutoff};
}

function v21CleanDatabaseSummary_(data) {
  return {sourceDatabaseId:data.sourceDatabaseId,rules:{projects:'排除已完成／結案／取消／作廢，若仍有進行中或待追蹤工作則保留',work:'只保留進行中與待追蹤',reports:'只保留最近180日且屬於保留專案',history:'保留專案的完整歷程',meetingSnapshots:'不搬移，於新資料庫重新產生'},
    source:data.sourceCounts,kept:{projects:data.projects.length,activeWork:data.activeWork.length,recentReports:data.recentReports.length,history:data.history.length,drawings:data.drawings.length,
      attachments:data.attachments.length,projectRelations:data.projectRelations.length,workRelations:data.workRelations.length,training:data.training.length,trainingAttachments:data.trainingAttachments.length,meetingRecords:data.meetingRecords.length,equipmentMedia:data.equipmentMedia.length,quoteItems:data.quoteItems.length,equipmentPriceHistory:data.equipmentPriceHistory.length,quotes:data.quoteMaster.length,quoteLines:data.quoteLines.length,quoteFiles:data.quoteFiles.length},reportCutoff:data.reportCutoff};
}

function v21WriteCleanDatabase_(database,data,previousDatabaseId,summary) {
  var datasets={};
  datasets[PMO_V21.SHEETS.PROJECTS]=data.projects.map(v21ProjectRow_);
  datasets[PMO_V21.SHEETS.WORK]=data.activeWork.map(v21WorkRow_);
  datasets[PMO_V21.SHEETS.REPORTS]=data.recentReports.map(v21ReportRow_);
  datasets[PMO_V21.SHEETS.HISTORY]=data.history.map(v21HistoryRow_);
  datasets[PMO_V21.SHEETS.DRAWINGS]=data.drawings.map(v21DrawingRow_);
  datasets[PMO_V21.SHEETS.ATTACHMENTS]=data.attachments;datasets[PMO_V21.SHEETS.PROJECT_RELATIONS]=data.projectRelations;datasets[PMO_V21.SHEETS.WORK_RELATIONS]=data.workRelations;
  datasets[PMO_V21.SHEETS.PROJECT_USAGE]=data.usage;datasets[PMO_V21.SHEETS.TRAINING]=data.training;datasets[PMO_V21.SHEETS.TRAINING_ATTACHMENTS]=data.trainingAttachments;
  datasets[PMO_V21.SHEETS.MEETING_RECORDS]=data.meetingRecords;datasets[PMO_V21.SHEETS.MEETING_SNAPSHOT]=[];datasets[PMO_V21.SHEETS.EQUIPMENT_MEDIA]=data.equipmentMedia;
  datasets[PMO_V21.SHEETS.QUOTE_ITEMS]=data.quoteItems;datasets[PMO_V21.SHEETS.QUOTE_MASTER]=data.quoteMaster;datasets[PMO_V21.SHEETS.QUOTE_LINES]=data.quoteLines;datasets[PMO_V21.SHEETS.QUOTE_FILES]=data.quoteFiles;datasets[PMO_V21.SHEETS.EQUIPMENT_PRICE_HISTORY]=data.equipmentPriceHistory;datasets[PMO_V21.SHEETS.AUDIT]=[];
  datasets[PMO_V21.SHEETS.SETTINGS]=[{'設定鍵':'VERSION','設定值':PMO_V21.VERSION,'說明':'V2.0 精簡資料庫','更新時間':v21Now_()},
    {'設定鍵':'PREVIOUS_DATABASE_ID','設定值':previousDatabaseId,'說明':'舊資料庫保留，未刪除或覆寫','更新時間':v21Now_()},
    {'設定鍵':'CLEAN_DATABASE_RULES','設定值':JSON.stringify(summary.kept),'說明':'建立時保留資料筆數','更新時間':v21Now_()}];
  Object.keys(PMO_V21.SHEETS).forEach(function(key){var name=PMO_V21.SHEETS[key],headers=PMO_V21.HEADERS[key];if(!headers||/^LEGACY_/.test(key))return;v21WriteObjectsToDatabase_(database,name,headers,datasets[name]||[]);});
}

function v21WriteObjectsToDatabase_(database,name,headers,objects) {
  var sheet=database.getSheetByName(name)||database.insertSheet(name);sheet.clear();
  sheet.getRange(1,1,1,headers.length).setValues([headers]).setFontWeight('bold').setBackground('#16324f').setFontColor('#ffffff');sheet.setFrozenRows(1);
  if(objects.length)sheet.getRange(2,1,objects.length,headers.length).setValues(objects.map(function(object){return headers.map(function(header){return object[header]===undefined?'':object[header];});}));
}

function v21ReadCanonicalObjects_(sheetName,headers) {
  var sheet=v21GetSheet_(sheetName,false);if(!sheet||sheet.getLastRow()<=1)return [];
  var table=v21ReadTable_(sheetName),map=v21HeaderMap_(table.headers);
  return table.rows.map(function(row){var object={},hasValue=false;headers.forEach(function(header){var value=v21Pick_(row,map,[header]);object[header]=value;if(v21Text_(value))hasValue=true;});return hasValue?object:null;}).filter(Boolean);
}

function v21BelongsToKeptProject_(item,keptIds,keptNames) {
  return !!(item&&((item.projectId&&keptIds[item.projectId])||(item.projectName&&keptNames[v21MeetingKeyText_(item.projectName)])));
}

function v21IsoDaysAgo_(todayText,days) {
  var date=v21ParseIsoDay_(todayText),shifted=new Date(date.getTime()-Number(days||0)*86400000);
  return Utilities.formatDate(shifted,'UTC','yyyy-MM-dd');
}
