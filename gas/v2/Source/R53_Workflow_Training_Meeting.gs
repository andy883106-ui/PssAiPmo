/**
 * PSS AI-PMO V20.5 R5.3
 * 工作事項刪除/附件續編、專案回報設定、每週工作監看/週四會議、教育訓練課程設定
 * 依賴：Code.gs + Work_Knowledge_R4.gs + Training_Center_R48.gs
 */
const PSS_R53 = Object.freeze({
  VERSION: 'V20.5 R5.3 Weekly Work & Training',
  DB_ID: '11ndvBcV0geEF7oJv1kX28BuC4_kAKnl37wUhL-Rx27g',
  TZ: 'Asia/Taipei',
  SHEETS: Object.freeze({
    PROJECT_REPORT: '專案報告設定',
    TRAINING_CONFIG: 'TRAIN_課程設定',
    TASK_DELETE_LOG: 'SYS_R53_刪除任務紀錄',
    MEETING_ITEMS: 'MTG_WEB_R43_會議事項',
    MEETING_MASTER: 'MTG_WEB_會議主檔'
  })
});

function r53Sheet_(name, headers) {
  const ss = getDb_();
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (headers && headers.length) ensureHeaders_(sh, headers);
  if (sh.getFrozenRows() < 1) sh.setFrozenRows(1);
  return sh;
}
function r53Text_(v) { return clean_(v); }
function r53Bool_(v, def) {
  const s = r53Text_(v).toLowerCase();
  if (!s) return def;
  if (['是','true','1','y','yes','顯示','啟用'].indexOf(s) >= 0) return true;
  if (['否','false','0','n','no','隱藏','停用'].indexOf(s) >= 0) return false;
  return def;
}
function r53DateObj_(v) {
  if (!v) return null;
  if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v.getTime())) return new Date(v.getTime());
  const s = String(v).trim();
  if (!s) return null;
  let m = s.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/);
  if (m) return new Date(Number(m[1]), Number(m[2])-1, Number(m[3]));
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}
function r53DateKey_(v) {
  const d = r53DateObj_(v);
  return d ? Utilities.formatDate(d, PSS_R53.TZ, 'yyyy-MM-dd') : '';
}
function r53DateTime_(v) {
  if (!v) return '';
  const d = r53DateObj_(v);
  return d ? Utilities.formatDate(d, PSS_R53.TZ, 'yyyy/MM/dd HH:mm') : '';
}
function r53StartOfDay_(d) { d = new Date(d.getFullYear(), d.getMonth(), d.getDate()); return d; }
function r53AddDays_(d, n) { const x = new Date(d.getTime()); x.setDate(x.getDate()+n); return x; }
function r53Week_(base) {
  const d = r53StartOfDay_(r53DateObj_(base) || new Date());
  const day = d.getDay();
  const monday = r53AddDays_(d, day === 0 ? -6 : 1-day);
  const sunday = r53AddDays_(monday, 6);
  const nextMonday = r53AddDays_(monday, 7);
  const nextSunday = r53AddDays_(monday, 13);
  const thursday = r53AddDays_(monday, 3);
  return {
    monday:monday, sunday:sunday, nextMonday:nextMonday, nextSunday:nextSunday, thursday:thursday,
    start:r53DateKey_(monday), end:r53DateKey_(sunday),
    nextStart:r53DateKey_(nextMonday), nextEnd:r53DateKey_(nextSunday),
    meetingDate:r53DateKey_(thursday), meetingId:'MTG-WEEK-'+Utilities.formatDate(thursday,PSS_R53.TZ,'yyyyMMdd')
  };
}
function r53InRange_(value, start, end) {
  const k = r53DateKey_(value);
  return !!k && k >= r53DateKey_(start) && k <= r53DateKey_(end);
}
function r53TaskDefs_() {
  return {
    taskId:['任務ID','事件ID'], siteCode:['場地代號'], projectName:['專案名稱'], taskType:['任務類型'],
    content:['任務內容'], owner:['負責人'], manager:['派工主管','派工人員','派工人'], priority:['優先級'],
    dispatchDate:['派工日期','建立時間'], dueDate:['預計完成日'], status:['狀態'], completedAt:['完成日'],
    attachment:['照片/附件上傳','照片/附件','附件連結'], note:['備註'], folderUrl:['雲端資料夾'],
    reportStatus:['回報狀態'], progress:['進度%'], completedData:['完成資料'], followUp:['後續事項'], support:['需要支援'], updatedAt:['更新時間']
  };
}
function r53TaskRows_() { return readCanonical_(getSheet_('TASKS'), r53TaskDefs_()); }
function r53TaskById_(taskId) { return r53TaskRows_().find(function(x){ return r53Text_(x.taskId) === r53Text_(taskId); }); }
function r53TaskKey_(t) {
  return [r53Text_(t.siteCode).toLowerCase(), r53Text_(t.projectName).toLowerCase(), r53Text_(t.content).replace(/\s+/g,'').toLowerCase(), r53Text_(t.owner).toLowerCase()].join('|');
}
function r53OpenStatus_(status) { const s=r53Text_(status); return ['已完成','完成','結案','已結案','取消','已取消','作廢','不執行','已刪除','無須追蹤'].indexOf(s)<0; }
function r53TaskPublic_(t) {
  const due = r53DateKey_(t.dueDate), today = r53DateKey_(new Date());
  return {
    rowNumber:t.__rowNumber, taskId:r53Text_(t.taskId), siteCode:r53Text_(t.siteCode), projectName:r53Text_(t.projectName),
    project:[r53Text_(t.siteCode),r53Text_(t.projectName)].filter(Boolean).join('｜'), taskType:r53Text_(t.taskType), content:r53Text_(t.content),
    owner:r53Text_(t.owner), manager:r53Text_(t.manager), priority:r53Text_(t.priority)||'一般', dispatchDate:r53DateKey_(t.dispatchDate),
    dueDate:due, status:r53Text_(t.status)||'未開始', completedAt:r53DateKey_(t.completedAt), attachment:r53Text_(t.attachment),
    note:r53Text_(t.note), folderUrl:r53Text_(t.folderUrl), reportStatus:r53Text_(t.reportStatus), progress:Number(t.progress||0),
    completedData:r53Text_(t.completedData), followUp:r53Text_(t.followUp), support:r53Text_(t.support), updatedAt:r53DateTime_(t.updatedAt||t.dispatchDate),
    overdue:!!(due && r53OpenStatus_(t.status) && due < today)
  };
}

function setupPssAiPmoR53() {
  r53Sheet_(PSS_R53.SHEETS.PROJECT_REPORT,['場地代號','是否顯示','回報狀況','回報摘要','下次追蹤日','最後回報人','最後回報時間','更新時間']);
  r53Sheet_(PSS_R53.SHEETS.TRAINING_CONFIG,['課程ID','課程來源','課程名稱','系統分類','設備分類','教材類型','版本','主要教材連結','資料夾連結','適用對象','說明','難度','預估分鐘','熱門','標籤','及格分數','需要完成確認','需要測驗','需要簽名','狀態','排序','更新者','更新時間']);
  r53Sheet_(PSS_R53.SHEETS.TASK_DELETE_LOG,['刪除紀錄ID','刪除時間','刪除人','任務ID','場地代號','專案名稱','任務內容','負責人','狀態','原始資料JSON']);
  const taskSheet = getSheet_('TASKS');
  ensureHeaders_(taskSheet,['任務ID','回報狀態','進度%','完成資料','附件連結','後續事項','需要支援','更新時間']);
  ensureHeaders_(r53Sheet_(PSS_R53.SHEETS.MEETING_ITEMS),['事項ID','會議ID','分類','來源類型','來源ID','場地代號','專案名稱','事項','負責人','協作人','優先級','預計完成日','狀態','完成資料','主管決議','更新人','建立時間','更新時間','排序','封存','附件路徑','回報狀況','會議決議','是否轉派工','後續任務ID']);
  return {version:PSS_R53.VERSION, taskIdRepair:repairMissingTaskIdsR53(), message:'R5.3 初始化完成。'};
}

function repairMissingTaskIdsR53() {
  const sheet = getSheet_('TASKS');
  const rows = r53TaskRows_();
  let fixed = 0;
  rows.forEach(function(row) {
    if (!r53Text_(row.taskId) && (r53Text_(row.content) || r53Text_(row.projectName))) {
      const id = 'T'+Utilities.formatDate(new Date(),PSS_R53.TZ,'yyMMddHHmmss')+String(row.__rowNumber).padStart(4,'0');
      writeObject_(sheet,row.__rowNumber,{'任務ID':id,'更新時間':new Date()}); fixed++;
    }
  });
  return fixed;
}

function getTaskEditorR53(payload) {
  payload = payload || {}; requireUser_(payload.token);
  const raw = r53TaskById_(payload.taskId); if (!raw) throw new Error('找不到任務，可能已刪除或尚未建立任務ID。');
  const task = r53TaskPublic_(raw);
  task.attachments = typeof attachmentItemsV171_ === 'function' ? attachmentItemsV171_(task.attachment) : [];
  return {version:PSS_R53.VERSION, task:task, existingAttachments:task.attachments, folderUrl:task.folderUrl};
}
function updateTaskR53(payload) {
  payload = payload || {}; requireUser_(payload.token);
  if (!r53Text_(payload.taskId)) throw new Error('任務ID不可空白。');
  if (typeof updateTaskWithFilesR42 === 'function') updateTaskWithFilesR42(payload);
  else updateTaskV17(payload);
  return {message:'任務與附件已更新；既有附件保留，不會重複覆寫。', editor:getTaskEditorR53({token:payload.token,taskId:payload.taskId})};
}
function deleteTaskR53(payload) {
  payload = payload || {}; const user = requireUser_(payload.token), sheet=getSheet_('TASKS');
  const raw = r53TaskById_(payload.taskId); if (!raw) throw new Error('找不到任務，可能已刪除。');
  const logSheet = r53Sheet_(PSS_R53.SHEETS.TASK_DELETE_LOG,['刪除紀錄ID','刪除時間','刪除人','任務ID','場地代號','專案名稱','任務內容','負責人','狀態','原始資料JSON']);
  appendObject_(logSheet,{
    '刪除紀錄ID':makeId_('TD'),'刪除時間':new Date(),'刪除人':user.name||user.account,'任務ID':r53Text_(raw.taskId),
    '場地代號':r53Text_(raw.siteCode),'專案名稱':r53Text_(raw.projectName),'任務內容':r53Text_(raw.content),'負責人':r53Text_(raw.owner),'狀態':r53Text_(raw.status),
    '原始資料JSON':JSON.stringify(raw.__row||[])
  });
  sheet.deleteRow(raw.__rowNumber); invalidateSheetCacheV1922_(sheet);
  try { operationLog_(user,'刪除任務(R5.3留存刪除紀錄)','任務派工',payload.taskId,{reason:r53Text_(payload.reason)||'使用者刪除'},'成功'); } catch(ignore) {}
  return {message:'任務已刪除，刪除前內容已保存於 SYS_R53_刪除任務紀錄。', taskId:payload.taskId};
}
function findTaskDuplicatesR53(payload) {
  payload=payload||{}; requireUser_(payload.token);
  const onlyOpen = payload.onlyOpen !== false, groups={};
  r53TaskRows_().forEach(function(t){
    if (!r53Text_(t.taskId) || !r53Text_(t.content)) return;
    if (onlyOpen && !r53OpenStatus_(t.status)) return;
    const key=r53TaskKey_(t); (groups[key]||(groups[key]=[])).push(r53TaskPublic_(t));
  });
  const duplicates=Object.keys(groups).map(function(k){return groups[k];}).filter(function(g){return g.length>1;})
    .sort(function(a,b){return b.length-a.length;});
  return {groups:duplicates,count:duplicates.length,items:duplicates.reduce(function(n,g){return n+g.length;},0)};
}

function r53ProjectReportRows_() {
  return readCanonical_(r53Sheet_(PSS_R53.SHEETS.PROJECT_REPORT),{siteCode:['場地代號'],visible:['是否顯示'],status:['回報狀況'],summary:['回報摘要'],nextDate:['下次追蹤日'],reporter:['最後回報人'],reportedAt:['最後回報時間'],updatedAt:['更新時間']});
}
function getProjectReportSettingR53(payload) {
  payload=payload||{}; requireUser_(payload.token);
  const code=r53Text_(payload.siteCode), row=r53ProjectReportRows_().find(function(x){return r53Text_(x.siteCode)===code;});
  return row?{siteCode:code,visible:r53Bool_(row.visible,true),reportStatus:r53Text_(row.status),summary:r53Text_(row.summary),nextFollowDate:r53DateKey_(row.nextDate),reporter:r53Text_(row.reporter),reportedAt:r53DateTime_(row.reportedAt),updatedAt:r53DateTime_(row.updatedAt)}:{siteCode:code,visible:true,reportStatus:'未設定',summary:'',nextFollowDate:'',reporter:'',reportedAt:'',updatedAt:''};
}
function saveProjectReportSettingR53(payload) {
  payload=payload||{}; const user=requireUser_(payload.token), code=r53Text_(payload.siteCode); if(!code)throw new Error('場地代號不可空白。');
  const sheet=r53Sheet_(PSS_R53.SHEETS.PROJECT_REPORT,['場地代號','是否顯示','回報狀況','回報摘要','下次追蹤日','最後回報人','最後回報時間','更新時間']);
  const row=r53ProjectReportRows_().find(function(x){return r53Text_(x.siteCode)===code;});
  const obj={'場地代號':code,'是否顯示':payload.visible===false?'否':'是','回報狀況':r53Text_(payload.reportStatus)||'未設定','回報摘要':r53Text_(payload.summary),'下次追蹤日':r53Text_(payload.nextFollowDate),'最後回報人':user.name||user.account,'最後回報時間':new Date(),'更新時間':new Date()};
  if(row)writeObject_(sheet,row.__rowNumber,obj);else appendObject_(sheet,obj);
  return {message:'專案報告顯示與回報狀況已儲存。',setting:getProjectReportSettingR53({token:payload.token,siteCode:code})};
}

function r53MeetingDefs_(){return {itemId:['事項ID'],meetingId:['會議ID'],category:['分類'],sourceType:['來源類型'],sourceId:['來源ID'],siteCode:['場地代號'],projectName:['專案名稱'],item:['事項'],owner:['負責人'],collaborators:['協作人'],priority:['優先級'],dueDate:['預計完成日'],status:['狀態'],completion:['完成資料'],decision:['主管決議','會議決議'],updatedBy:['更新人'],createdAt:['建立時間'],updatedAt:['更新時間'],sort:['排序'],archived:['封存'],attachment:['附件路徑'],report:['回報狀況'],meetingDecision:['會議決議'],converted:['是否轉派工'],followTaskId:['後續任務ID']};}
function r53MeetingItems_(meetingId){return readCanonical_(r53Sheet_(PSS_R53.SHEETS.MEETING_ITEMS),r53MeetingDefs_()).filter(function(x){return r53Text_(x.meetingId)===r53Text_(meetingId)&&!r53Bool_(x.archived,false);});}
function r53MeetingItemPublic_(x){return {rowNumber:x.__rowNumber,itemId:r53Text_(x.itemId),meetingId:r53Text_(x.meetingId),category:r53Text_(x.category),sourceType:r53Text_(x.sourceType),sourceId:r53Text_(x.sourceId),siteCode:r53Text_(x.siteCode),projectName:r53Text_(x.projectName),item:r53Text_(x.item),owner:r53Text_(x.owner),collaborators:r53Text_(x.collaborators),priority:r53Text_(x.priority),dueDate:r53DateKey_(x.dueDate),status:r53Text_(x.status)||'未開始',completion:r53Text_(x.completion),report:r53Text_(x.report),decision:r53Text_(x.meetingDecision||x.decision),attachment:r53Text_(x.attachment),followTaskId:r53Text_(x.followTaskId),updatedAt:r53DateTime_(x.updatedAt||x.createdAt)};}
function r53ReportsByTask_(start,end){
  const rows=listDailyReportsV17({token:arguments.length>2?arguments[2]:'',keyword:'',startDate:r53DateKey_(start),endDate:r53DateKey_(end),limit:3000});
  const map={}; rows.forEach(function(r){const id=r53Text_(r.taskId||r.relatedTaskId);if(id)(map[id]||(map[id]=[])).push(r);}); return map;
}
function getWeeklyMeetingWorkspaceR53(payload) {
  payload=payload||{}; const user=requireUser_(payload.token), w=r53Week_(payload.baseDate);
  const all=r53TaskRows_().map(r53TaskPublic_), open=all.filter(function(t){return r53OpenStatus_(t.status);});
  const reports=listDailyReportsV17({token:payload.token,keyword:'',startDate:w.start,endDate:w.end,limit:3000});
  const reportTaskIds={}; reports.forEach(function(r){if(r53Text_(r.taskId))reportTaskIds[r53Text_(r.taskId)]=true;});
  const current=open.filter(function(t){
    return t.overdue || r53InRange_(t.dispatchDate,w.monday,w.sunday) || r53InRange_(t.dueDate,w.monday,w.sunday) || reportTaskIds[t.taskId] || /進行中|卡關|待確認|需追蹤|延誤|逾期/.test(t.status);
  });
  const next=open.filter(function(t){return r53InRange_(t.dueDate,w.nextMonday,w.nextSunday)||r53InRange_(t.dispatchDate,w.nextMonday,w.nextSunday);});
  const watch=open.slice().sort(function(a,b){return (b.overdue?1:0)-(a.overdue?1:0)||(a.dueDate||'9999').localeCompare(b.dueDate||'9999');});
  const people={};
  current.forEach(function(t){const k=t.owner||'未指派';if(!people[k])people[k]={name:k,tasks:[],reports:[]};people[k].tasks.push(t);});
  reports.forEach(function(r){const k=r53Text_(r.person)||'未指派';if(!people[k])people[k]={name:k,tasks:[],reports:[]};people[k].reports.push(r);});
  const selected=r53MeetingItems_(w.meetingId).map(r53MeetingItemPublic_);
  const projects=listProjectSelectionV182(payload.token,'').map(function(p){return {siteCode:p.siteCode,projectName:p.projectName,label:p.label||[p.siteCode,p.projectName].join('｜')};});
  return {version:PSS_R53.VERSION,generatedAt:r53DateTime_(new Date()),user:user,week:{start:w.start,end:w.end,nextStart:w.nextStart,nextEnd:w.nextEnd,meetingDate:w.meetingDate,meetingId:w.meetingId},summary:{current:current.length,next:next.length,watch:watch.length,reports:reports.length,selected:selected.length},currentWeek:current,nextWeek:next,watchlist:watch,people:Object.keys(people).sort().map(function(k){return people[k];}),reports:reports,selectedItems:selected,projects:projects};
}
function saveWeeklyMeetingSelectionR53(payload) {
  payload=payload||{}; const user=requireUser_(payload.token), w=r53Week_(payload.baseDate), sheet=r53Sheet_(PSS_R53.SHEETS.MEETING_ITEMS), task=r53TaskById_(payload.taskId);
  if(!task)throw new Error('找不到要加入會議的工作事項。');
  const exists=r53MeetingItems_(w.meetingId).find(function(x){return r53Text_(x.sourceId)===r53Text_(task.taskId);});
  if(exists)return {message:'此工作已在本週會議清單，不重複新增。',item:r53MeetingItemPublic_(exists)};
  const itemId=makeId_('MI');
  appendObject_(sheet,{'事項ID':itemId,'會議ID':w.meetingId,'分類':r53Text_(payload.category)||'本週工作事項','來源類型':'任務派工','來源ID':r53Text_(task.taskId),'場地代號':r53Text_(task.siteCode),'專案名稱':r53Text_(task.projectName),'事項':r53Text_(task.content),'負責人':r53Text_(task.owner),'優先級':r53Text_(task.priority),'預計完成日':r53Text_(task.dueDate),'狀態':r53Text_(task.status)||'未開始','完成資料':r53Text_(task.completedData),'更新人':user.name||user.account,'建立時間':new Date(),'更新時間':new Date(),'排序':new Date().getTime(),'封存':'否','附件路徑':r53Text_(task.attachment),'回報狀況':r53Text_(task.note)});
  return {message:'已加入本週會議清單。',itemId:itemId};
}
function saveMeetingWorkItemR53(payload) {
  payload=payload||{}; const user=requireUser_(payload.token), w=r53Week_(payload.baseDate), sheet=r53Sheet_(PSS_R53.SHEETS.MEETING_ITEMS), itemId=r53Text_(payload.itemId)||makeId_('MI');
  let target=r53MeetingItems_(w.meetingId).find(function(x){return r53Text_(x.itemId)===itemId;});
  const obj={'事項ID':itemId,'會議ID':w.meetingId,'分類':r53Text_(payload.category)||'會議交代事項','來源類型':r53Text_(payload.sourceType)||'手動新增','來源ID':r53Text_(payload.sourceId),'場地代號':r53Text_(payload.siteCode),'專案名稱':r53Text_(payload.projectName),'事項':r53Text_(payload.item),'負責人':r53Text_(payload.owner)||user.name,'協作人':r53Text_(payload.collaborators),'優先級':r53Text_(payload.priority)||'一般','預計完成日':r53Text_(payload.dueDate),'狀態':r53Text_(payload.status)||'未開始','完成資料':r53Text_(payload.completion),'回報狀況':r53Text_(payload.report),'會議決議':r53Text_(payload.decision),'附件路徑':r53Text_(payload.attachment),'更新人':user.name||user.account,'更新時間':new Date(),'封存':'否'};
  if(target)writeObject_(sheet,target.__rowNumber,obj);else{obj['建立時間']=new Date();obj['排序']=new Date().getTime();appendObject_(sheet,obj);}
  return {message:'會議工作事項已儲存。',itemId:itemId};
}
function deleteMeetingWorkItemR53(payload) {
  payload=payload||{}; const user=requireUser_(payload.token), w=r53Week_(payload.baseDate), sheet=r53Sheet_(PSS_R53.SHEETS.MEETING_ITEMS), target=r53MeetingItems_(w.meetingId).find(function(x){return r53Text_(x.itemId)===r53Text_(payload.itemId);});
  if(!target)throw new Error('找不到會議事項。');
  writeObject_(sheet,target.__rowNumber,{'封存':'是','更新人':user.name||user.account,'更新時間':new Date()}); return {message:'會議事項已移除。'};
}
function reportMeetingWorkItemR53(payload) {
  payload=payload||{}; const user=requireUser_(payload.token), w=r53Week_(payload.baseDate), sheet=r53Sheet_(PSS_R53.SHEETS.MEETING_ITEMS), target=r53MeetingItems_(w.meetingId).find(function(x){return r53Text_(x.itemId)===r53Text_(payload.itemId);});
  if(!target)throw new Error('找不到會議事項。');
  const report=r53Text_(payload.report); if(!report)throw new Error('請填寫回報狀況。');
  const status=r53Text_(payload.status)||r53Text_(target.status)||'進行中'; let followTaskId='';
  if(r53Text_(target.sourceId) && r53TaskById_(target.sourceId)){
    saveDailyReportV17({token:payload.token,taskId:r53Text_(target.sourceId),person:user.name,eventTitle:r53Text_(target.item),reportContent:report,tomorrowPlan:r53Text_(payload.nextAction),completeTask:payload.completeTask===true,status:'已回報'});
  }
  if(payload.continueNextWeek===true){
    const due=r53Text_(payload.nextDueDate)||w.nextEnd;
    const created=createTasksMultiOwnerV17({token:payload.token,siteCode:r53Text_(target.siteCode),projectName:r53Text_(target.projectName),taskType:'會議下週追蹤',content:r53Text_(payload.nextAction)||r53Text_(target.item),owners:[r53Text_(target.owner)||user.name],priority:r53Text_(target.priority)||'一般',dueDate:due,note:'由 '+w.meetingId+' 會議事項 '+r53Text_(target.itemId)+' 建立'});
    if(created&&created.tasks&&created.tasks[0])followTaskId=created.tasks[0].taskId;
  }
  writeObject_(sheet,target.__rowNumber,{'回報狀況':report,'狀態':status,'完成資料':r53Text_(payload.completion),'會議決議':r53Text_(payload.decision),'後續任務ID':followTaskId||r53Text_(target.followTaskId),'是否轉派工':followTaskId?'是':r53Text_(target.converted),'更新人':user.name||user.account,'更新時間':new Date()});
  return {message:'回報已同步到會議事項'+(r53Text_(target.sourceId)?'與工作回報':'')+(followTaskId?'，並建立下週追蹤任務':''),followTaskId:followTaskId};
}
function generateWeeklyMeetingMinutesR53(payload) {
  payload=payload||{}; const user=requireUser_(payload.token), data=getWeeklyMeetingWorkspaceR53({token:payload.token,baseDate:payload.baseDate}), items=data.selectedItems;
  const title='PSS '+data.week.meetingDate+' 專案週會紀錄';
  const doc=DocumentApp.create(title), body=doc.getBody(); body.appendParagraph(title).setHeading(DocumentApp.ParagraphHeading.TITLE);
  body.appendParagraph('週期：'+data.week.start+' ～ '+data.week.end+'｜產出：'+r53DateTime_(new Date())+'｜整理：'+(user.name||user.account));
  function section(name, rows){body.appendParagraph(name).setHeading(DocumentApp.ParagraphHeading.HEADING1);if(!rows.length){body.appendParagraph('無');return;}rows.forEach(function(x,i){body.appendParagraph((i+1)+'. '+[x.siteCode,x.projectName].filter(Boolean).join('｜')+'｜'+x.item);body.appendParagraph('負責：'+(x.owner||'')+'｜狀態：'+(x.status||'')+'｜期限：'+(x.dueDate||''));if(x.report)body.appendParagraph('回報：'+x.report);if(x.decision)body.appendParagraph('會議決議：'+x.decision);if(x.followTaskId)body.appendParagraph('後續任務：'+x.followTaskId);});}
  section('本週會議追蹤事項',items.filter(function(x){return x.category!=='下一週安排';}));
  section('下一週安排',items.filter(function(x){return x.category==='下一週安排'||x.followTaskId;}));
  body.appendParagraph('本週人員回報摘要').setHeading(DocumentApp.ParagraphHeading.HEADING1);
  data.people.forEach(function(p){body.appendParagraph(p.name+'：工作 '+p.tasks.length+' 項／本週回報 '+p.reports.length+' 筆');});
  doc.saveAndClose(); const file=DriveApp.getFileById(doc.getId());
  return {message:'會議紀錄已產出。',documentId:doc.getId(),url:file.getUrl(),title:title};
}

function r53TrainingConfigRows_(){return readCanonical_(r53Sheet_(PSS_R53.SHEETS.TRAINING_CONFIG),{courseId:['課程ID'],system:['系統分類'],title:['課程名稱'],description:['課程說明','說明'],audience:['適用對象'],passScore:['及格分數'],confirm:['需要完成確認'],exam:['需要測驗'],signature:['需要簽名'],status:['狀態'],order:['排序'],mainUrl:['主要教材連結'],folderUrl:['教材資料夾連結','資料夾連結'],updatedBy:['更新者'],updatedAt:['更新時間']});}
function r53TrainingConfigMap_(){const m={};r53TrainingConfigRows_().forEach(function(x){if(r53Text_(x.courseId))m[r53Text_(x.courseId)]=x;});return m;}
function r53OverlayCourse_(course, cfg){
  if(!cfg)return course; const c=Object.assign({},course);
  if(r53Text_(cfg.system))c.systemCategory=r53Text_(cfg.system); if(r53Text_(cfg.title))c.title=r53Text_(cfg.title); if(r53Text_(cfg.description))c.description=r53Text_(cfg.description); if(r53Text_(cfg.audience))c.audience=r53Text_(cfg.audience);
  if(r53Text_(cfg.passScore))c.passScore=Number(cfg.passScore)||c.passScore; if(r53Text_(cfg.status))c.status=r53Text_(cfg.status); if(r53Text_(cfg.order))c.order=Number(cfg.order)||c.order;
  if(r53Text_(cfg.mainUrl))c.fileUrl=r53Text_(cfg.mainUrl); if(r53Text_(cfg.folderUrl))c.folderUrl=r53Text_(cfg.folderUrl); return c;
}
function getTrainingCenterR53(payload){
  payload=payload||{}; const base=getTrainingCenterR48(payload), cfg=r53TrainingConfigMap_();
  base.version=PSS_R53.VERSION; base.courses=(base.courses||[]).map(function(c){const x=r53OverlayCourse_(c,cfg[c.id]);x.searchText=[x.id,x.title,x.description,x.systemCategory,x.deviceCategory,x.kind,x.materialType,x.audience,(x.tags||[]).join(' ')].join(' ').toLowerCase();return x;}).filter(function(c){const x=cfg[c.id];return !x||!/^停用$/.test(r53Text_(x.status));});
  const systems={};base.courses.forEach(function(c){const s=c.systemCategory||'其他';if(!systems[s])systems[s]={name:s,count:0};systems[s].count++;});base.systems=Object.keys(systems).sort(function(a,b){return a.localeCompare(b,'zh-Hant');}).map(function(k){return systems[k];});
  return base;
}
function getTrainingCourseR53(payload){
  payload=payload||{}; const d=getTrainingCourseR48(payload), cfg=r53TrainingConfigMap_()[r53Text_(payload.courseId)]; d.version=PSS_R53.VERSION; d.course=r53OverlayCourse_(d.course,cfg);
  d.courseConfig=cfg?{systemCategory:r53Text_(cfg.system),title:r53Text_(cfg.title),description:r53Text_(cfg.description),audience:r53Text_(cfg.audience),passScore:Number(cfg.passScore||d.course.passScore||70),requireConfirm:r53Text_(cfg.confirm)||'是',requireExam:r53Text_(cfg.exam)||'自動',requireSignature:r53Text_(cfg.signature)||'是',status:r53Text_(cfg.status)||'啟用',order:Number(cfg.order||0),mainUrl:r53Text_(cfg.mainUrl),folderUrl:r53Text_(cfg.folderUrl)}:{systemCategory:d.course.systemCategory,title:d.course.title,description:d.course.description,audience:d.course.audience,passScore:d.course.passScore||70,requireConfirm:'是',requireExam:'自動',requireSignature:'是',status:'啟用',order:d.course.order||0,mainUrl:d.course.fileUrl||'',folderUrl:d.course.folderUrl||''};
  if(d.courseConfig.requireExam==='否')d.requirements.exam=false; if(d.courseConfig.requireExam==='是')d.requirements.exam=true;
  return d;
}
function saveTrainingCourseR53(payload){
  payload=payload||{}; const user=requireUser_(payload.token), id=r53Text_(payload.courseId);if(!id)throw new Error('課程ID不可空白。');
  const sheet=r53Sheet_(PSS_R53.SHEETS.TRAINING_CONFIG,['課程ID','課程來源','課程名稱','系統分類','設備分類','教材類型','版本','主要教材連結','資料夾連結','適用對象','說明','難度','預估分鐘','熱門','標籤','及格分數','需要完成確認','需要測驗','需要簽名','狀態','排序','更新者','更新時間']);
  const target=r53TrainingConfigRows_().find(function(x){return r53Text_(x.courseId)===id;});
  const obj={'課程ID':id,'系統分類':r53Text_(payload.systemCategory),'課程名稱':r53Text_(payload.title),'說明':r53Text_(payload.description),'適用對象':r53Text_(payload.audience),'及格分數':Number(payload.passScore||70),'需要完成確認':r53Text_(payload.requireConfirm)||'是','需要測驗':r53Text_(payload.requireExam)||'自動','需要簽名':r53Text_(payload.requireSignature)||'是','狀態':r53Text_(payload.status)||'啟用','排序':Number(payload.order||0),'主要教材連結':r53Text_(payload.mainUrl),'資料夾連結':r53Text_(payload.folderUrl),'更新者':user.name||user.account,'更新時間':new Date()};
  if(target)writeObject_(sheet,target.__rowNumber,obj);else appendObject_(sheet,obj); return {message:'課程設定已儲存。',courseId:id};
}
