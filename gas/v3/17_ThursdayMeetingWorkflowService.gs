/** Thursday meeting item editing, event-report synchronization and archived minutes output. */
function getThursdayMeetingItemV21(payload) {
  return v21Safe_('GET_THURSDAY_MEETING_ITEM', function() {
    payload=payload||{};
    var resolved=v21ResolveThursdayMeetingItem_(v21Text_(payload.id),v21Text_(payload.source));
    var meetingDate=v21Date_(payload.meetingDate)||v21Today_();
    var report=v21FindMeetingReport_(resolved.item.id,meetingDate);
    if(report)report.attachments=v21AttachmentsForEntity_('工作回報',report.id,report.attachment);
    return {meetingId:v21MeetingMasterId_(meetingDate),meetingDate:meetingDate,sourceType:resolved.sourceType,item:resolved.item,
      report:report||{id:v21MeetingReportId_(resolved.item.id,meetingDate),date:meetingDate,employee:resolved.item.assignee,supervisor:'',completed:'',followUp:'',attachment:'',attachments:[]}};
  });
}

function saveThursdayMeetingItemV21(payload) {
  return v21Safe_('SAVE_THURSDAY_MEETING_ITEM', function() {
    payload=payload||{};
    return v21WithLock_(function() {
      var id=v21Text_(payload.id),source=v21Text_(payload.source),resolved=v21ResolveThursdayMeetingItem_(id,source);
      var status=v21NormalizeStatus_(payload.status||resolved.item.status);
      if(PMO_V21.WORK_STATUSES.indexOf(status)<0)throw new Error('會議回報狀態僅能為事項、目前處理、無須追蹤或完成。');
      var now=v21Now_(),meetingDate=v21Date_(payload.meetingDate)||v21Today_(),title=v21Text_(payload.title)||resolved.item.title;
      var assignee=v21Text_(payload.assignee)||resolved.item.assignee,dueDate=v21Date_(payload.dueDate)||resolved.item.dueDate;
      var previousReport=v21FindMeetingReport_(id,meetingDate),completed=v21Text_(payload.completed)||(previousReport&&previousReport.completed)||('會議狀態更新：'+status);
      var followUp=v21Text_(payload.followUp),attachment=v21PrimaryAttachmentUrl_(payload.attachments,v21Text_(payload.attachment)||(previousReport&&previousReport.attachment)||resolved.item.attachment);
      if(!title)throw new Error('會議事項標題不得空白。');

      if(resolved.sourceType==='meeting-record') {
        v21UpsertObject_(PMO_V21.SHEETS.MEETING_RECORDS,PMO_V21.HEADERS.MEETING_RECORDS,'紀錄ID',{
          '紀錄ID':id,'專案ID':resolved.item.projectId,'專案名稱':resolved.item.projectName,'事項':title,'負責人':assignee,
          '期限':dueDate,'追蹤狀態':status,'主管決議與執行情形':v21MeetingDecisionText_(completed,followUp)
        });
      } else {
        var work=resolved.work||resolved.item;
        work.title=title;work.assignee=assignee;work.dueDate=dueDate;work.status=status;work.progress=status==='完成'?100:v21Number_(work.progress);
        work.completion=completed;work.attachment=attachment;work.updatedAt=now;
        v21UpsertObject_(PMO_V21.SHEETS.WORK,PMO_V21.HEADERS.WORK,'工作ID',v21WorkRow_(work));
      }

      var reportId=previousReport&&previousReport.id?previousReport.id:v21MeetingReportId_(id,meetingDate);
      v21UpsertObject_(PMO_V21.SHEETS.REPORTS,PMO_V21.HEADERS.REPORTS,'回報ID',{
        '回報ID':reportId,'回報日期':meetingDate,'人員':v21Text_(payload.employee)||assignee||v21User_(),'主管':v21Text_(payload.supervisor),
        '專案ID':resolved.item.projectId,'專案名稱':resolved.item.projectName,'事件標題':title,'完成回報':completed,'未完成問題':'',
        '後續事項':followUp,'附件連結':attachment,'關聯工作ID':id,'來源分頁':'V21_週四會議','來源ID':v21MeetingMasterId_(meetingDate),
        '建立時間':previousReport&&previousReport.createdAt?previousReport.createdAt:now,'更新時間':now
      });
      v21SaveAttachmentRecords_('工作回報',reportId,resolved.item.projectId,payload.attachments);
      v21Audit_('SAVE_THURSDAY_MEETING_ITEM','週四會議事項',id,'成功',JSON.stringify({meetingId:v21MeetingMasterId_(meetingDate),status:status,reportId:reportId}));
      v21ClearCache_();
      return {id:id,reportId:reportId,meetingId:v21MeetingMasterId_(meetingDate),status:status,synchronizedAt:now};
    });
  });
}

function generateThursdayMeetingRecordV21(payload) {
  return v21Safe_('GENERATE_THURSDAY_MEETING_RECORD', function() {
    payload=payload||{};
    var snapshot=v21BuildThursdaySnapshot_(v21Date_(payload.date)||v21Today_(),v21LoadWork_().concat(v21MeetingRecordsAsWork_()),v21LoadReports_());
    snapshot.meetingRecord=v21GetLatestMeetingArchive_();
    var meetingId=v21MeetingMasterId_(snapshot.thursday),folder=v21MeetingOutputFolder_(),stamp=Utilities.formatDate(new Date(),PMO_V21.TIME_ZONE,'yyyyMMdd_HHmmss');
    var baseName='PSS_'+snapshot.thursday.replace(/-/g,'')+'_週四專案會議紀錄_'+stamp,doc=DocumentApp.create(baseName),body=doc.getBody();
    body.setPageWidth(595).setPageHeight(842).setMarginTop(42).setMarginBottom(42).setMarginLeft(42).setMarginRight(42);
    body.appendParagraph('PSS 專案週四會議紀錄').setHeading(DocumentApp.ParagraphHeading.TITLE).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    body.appendParagraph('會議編號：'+meetingId+'　會議日期：'+snapshot.thursday+'　週期：'+snapshot.weekStart+'～'+snapshot.weekEnd)
      .setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    body.appendParagraph('產出時間：'+v21Now_()+'　資料來源：V21 工作事項、會議紀錄與同筆事件回報').setAlignment(DocumentApp.HorizontalAlignment.CENTER);

    var reportMap=v21LatestMeetingReportsMap_(),order=['上週追蹤','本週未完成','未來7日安排','會議新增'];
    order.forEach(function(group){
      var items=snapshot.groups[group]||[];
      body.appendParagraph(group+'（'+items.length+'）').setHeading(DocumentApp.ParagraphHeading.HEADING2);
      if(!items.length){body.appendParagraph('本分類沒有事項。');return;}
      var rows=[['專案／事項','負責人／期限','狀態','會議回報／後續／附件']];
      items.forEach(function(item){var report=reportMap[item.id]||{},attachmentText=(report.attachments||[]).map(function(attachment){return (attachment.displayName||'附件')+'：'+attachment.url;}).join('\n');rows.push([
        [item.projectName||item.projectId,item.title].filter(Boolean).join('｜'),
        [item.assignee,item.dueDate].filter(Boolean).join('／'),item.status,
        [report.completed,report.followUp?('後續：'+report.followUp):'',attachmentText||(report.attachment?('附件：'+report.attachment):'')].filter(Boolean).join('\n')||'尚未回報'
      ]);});
      v21AppendMeetingTable_(body,rows);
    });

    body.appendParagraph('會議簽名').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    body.appendParagraph('簽名表示已確認本會議紀錄、決議與後續派工內容。');
    var signRows=[['姓名','簽名','日期']];
    v21MeetingSignerNames_(snapshot).forEach(function(name){signRows.push([name,'\n\n','']);});
    v21AppendMeetingTable_(body,signRows);
    body.appendParagraph('附件與補充說明：\n\n').setHeading(DocumentApp.ParagraphHeading.HEADING3);
    doc.saveAndClose();

    var docFile=DriveApp.getFileById(doc.getId());docFile.moveTo(folder);
    var pdfFile=folder.createFile(docFile.getAs(MimeType.PDF).setName(baseName+'.pdf'));
    var exported={meetingId:meetingId,meetingDate:snapshot.thursday,documentUrl:docFile.getUrl(),pdfUrl:pdfFile.getUrl(),folderUrl:folder.getUrl(),generatedAt:v21Now_(),generatedBy:v21User_()};
    v21WithLock_(function(){v21UpsertObject_(PMO_V21.SHEETS.SETTINGS,PMO_V21.HEADERS.SETTINGS,'設定鍵',{
      '設定鍵':'LAST_THURSDAY_EXPORT','設定值':JSON.stringify(exported),'說明':'最近一次週四會議紀錄（Google 文件與 PDF）','更新時間':exported.generatedAt
    });});
    v21Audit_('GENERATE_THURSDAY_MEETING_RECORD','週四會議',meetingId,'成功',JSON.stringify({documentId:docFile.getId(),pdfId:pdfFile.getId()}));
    return exported;
  });
}

function v21ResolveThursdayMeetingItem_(id,source) {
  if(!id)throw new Error('缺少會議事項 ID。');
  var preferMeeting=source===PMO_V21.SHEETS.MEETING_RECORDS,meetingRecords=v21LoadMeetingRecords_(),meeting=null,work=null;
  meetingRecords.some(function(item){if(item.id===id){meeting=item;return true;}return false;});
  v21LoadWork_().some(function(item){if(item.id===id){work=item;return true;}return false;});
  if(preferMeeting&&meeting)return {sourceType:'meeting-record',item:v21MeetingRecordToEditable_(meeting),meetingRecord:meeting};
  if(work)return {sourceType:'work',item:work,work:work};
  if(meeting)return {sourceType:'meeting-record',item:v21MeetingRecordToEditable_(meeting),meetingRecord:meeting};
  throw new Error('找不到原始會議事項：'+id+'。請先重新偵測資料庫。');
}

function v21MeetingRecordToEditable_(item) {
  return {id:item.id,projectId:item.projectId,projectName:item.projectName,title:item.title,type:'週四會議匯入',assignee:item.assignee,
    collaborator:'',priority:'一般',startDate:item.meetingDate,dueDate:v21MeetingLastDate_(item.dueDate),status:item.trackingStatus,progress:item.trackingStatus==='完成'?100:0,
    completion:item.decision,attachment:'',sourceSheet:PMO_V21.SHEETS.MEETING_RECORDS,sourceId:item.id,createdAt:item.importedAt,updatedAt:item.importedAt,meetingDate:item.meetingDate};
}

function v21MeetingReportId_(itemId,meetingDate) {
  return 'MTRPT-'+v21Hash_(v21Text_(itemId)+'|'+v21Date_(meetingDate));
}

function v21FindMeetingReport_(itemId,meetingDate) {
  var stableId=v21MeetingReportId_(itemId,meetingDate),reports=v21LoadReports_().filter(function(report){
    return report.id===stableId||(report.relatedWorkId===itemId&&report.sourceSheet==='V21_週四會議'&&report.date===v21Date_(meetingDate));
  });
  reports.sort(function(a,b){return v21Text_(b.updatedAt||b.createdAt||b.date).localeCompare(v21Text_(a.updatedAt||a.createdAt||a.date));});
  return reports[0]||null;
}

function v21MeetingDecisionText_(completed,followUp) {
  return [v21Text_(completed),v21Text_(followUp)?('後續：'+v21Text_(followUp)):''].filter(Boolean).join('\n');
}

function v21LatestMeetingReportsMap_() {
  var map={},attachmentsByReport={};v21LoadAttachments_().filter(function(item){return item.entityType==='工作回報';}).forEach(function(item){(attachmentsByReport[item.entityId]||(attachmentsByReport[item.entityId]=[])).push(item);});v21LoadReports_().filter(function(report){return report.sourceSheet==='V21_週四會議'&&report.relatedWorkId;}).sort(function(a,b){
    return v21Text_(b.updatedAt||b.createdAt||b.date).localeCompare(v21Text_(a.updatedAt||a.createdAt||a.date));
  }).forEach(function(report){if(!map[report.relatedWorkId]){report.attachments=attachmentsByReport[report.id]||[];map[report.relatedWorkId]=report;}});return map;
}

function v21MeetingSignerNames_(snapshot) {
  var names=[],seen={};
  function add(value){v21Text_(value).split(/[、,，/／;；\s]+/).forEach(function(name){name=v21Text_(name);if(name&&!seen[name]){seen[name]=true;names.push(name);}});}
  (PMO_V21.THURSDAY_SIGNERS||[]).forEach(add);
  if(snapshot&&snapshot.meetingRecord)add(snapshot.meetingRecord.participants);
  return names.length?names:['主持人','記錄人','與會人員'];
}

function v21AppendMeetingTable_(body,rows) {
  var table=body.appendTable(rows);table.setBorderColor('#9aaab4').setBorderWidth(1);
  for(var column=0;column<table.getRow(0).getNumCells();column+=1){var cell=table.getRow(0).getCell(column);cell.setBackgroundColor('#16324f');cell.editAsText().setBold(true).setForegroundColor('#ffffff');}
  return table;
}

function v21MeetingOutputFolder_() {
  var properties=PropertiesService.getScriptProperties(),id=properties.getProperty(PMO_V21.MEETING_OUTPUT_FOLDER_PROPERTY),folder=null;
  if(id){try{folder=DriveApp.getFolderById(id);}catch(ignored){}}
  if(!folder){
    var rootId=properties.getProperty(PMO_V21.PROJECT_ROOT_PROPERTY),root=null;
    if(rootId){try{root=DriveApp.getFolderById(rootId);}catch(ignoredRoot){}}
    if(root){var existing=root.getFoldersByName('00_週四會議紀錄');folder=existing.hasNext()?existing.next():root.createFolder('00_週四會議紀錄');}
    else folder=DriveApp.createFolder('PSS_AI_PMO_週四會議紀錄');
    properties.setProperty(PMO_V21.MEETING_OUTPUT_FOLDER_PROPERTY,folder.getId());
  }
  return folder;
}

function v21GetLatestThursdayExport_() {
  var sheet=v21GetSheet_(PMO_V21.SHEETS.SETTINGS,false);if(!sheet||sheet.getLastRow()<=1)return null;
  var table=v21ReadTable_(PMO_V21.SHEETS.SETTINGS),map=v21HeaderMap_(table.headers),value='';
  table.rows.some(function(row){if(v21Text_(v21Pick_(row,map,['設定鍵']))==='LAST_THURSDAY_EXPORT'){value=v21Text_(v21Pick_(row,map,['設定值']));return true;}return false;});
  if(!value)return null;try{return JSON.parse(value);}catch(ignored){return null;}
}
