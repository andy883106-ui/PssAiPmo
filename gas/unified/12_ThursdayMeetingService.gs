/** Thursday meeting projection. Manual refresh rescans canonical work instead of trusting stale meeting sheets. */
function getThursdayMeetingV21() {
  return v21Safe_('GET_THURSDAY_MEETING', function() {
    var snapshot = null, snapshotWarning = '';
    try {
      snapshot = v21ReadLatestMeetingSnapshot_();
    } catch (error) {
      snapshotWarning = '既有會議快照無法讀取，已改用目前資料即時計算：' + (error && error.message ? error.message : error);
      v21Audit_('READ_THURSDAY_SNAPSHOT', '週四會議', '', '略過損壞快照', snapshotWarning);
    }
    if (snapshot) {
      snapshot=v21NormalizeMeetingSnapshot_(snapshot);
      snapshot.meetingRecord=v21GetLatestMeetingArchive_();
      snapshot.latestExport=v21GetLatestThursdayExport_();
      return snapshot;
    }
    var preview = v21BuildThursdaySnapshot_(v21Today_(), v21LoadWork_().concat(v21MeetingRecordsAsWork_()), v21LoadReports_());
    preview.persisted = false;
    preview.warning = snapshotWarning;
    preview.meetingRecord=v21GetLatestMeetingArchive_();
    preview.latestExport=v21GetLatestThursdayExport_();
    return v21NormalizeMeetingSnapshot_(preview);
  });
}

function refreshThursdayMeetingV21() {
  return v21Safe_('REFRESH_THURSDAY_MEETING', function() {
    return v21WithLock_(function() {
      var snapshot = v21BuildThursdaySnapshot_(v21Today_(), v21LoadWork_().concat(v21MeetingRecordsAsWork_()), v21LoadReports_());
      snapshot.meetingRecord=v21GetLatestMeetingArchive_();
      snapshot.latestExport=v21GetLatestThursdayExport_();
      var sheet = v21EnsureSheet_(PMO_V21.SHEETS.MEETING_SNAPSHOT, PMO_V21.HEADERS.MEETING_SNAPSHOT);
      var rows = snapshot.items.map(function(item) {
        return [snapshot.scanId,snapshot.scannedAt,snapshot.weekStart,snapshot.thursday,item.group,item.id,item.projectId,item.projectName,
          item.title,item.assignee,item.dueDate,item.status,item.source,item.dedupeKey];
      });
      if (!rows.length) rows.push([snapshot.scanId,snapshot.scannedAt,snapshot.weekStart,snapshot.thursday,'_EMPTY','','','','','','','','V21_工作事項','']);
      sheet.getRange(sheet.getLastRow()+1,1,rows.length,PMO_V21.HEADERS.MEETING_SNAPSHOT.length).setValues(rows);
      v21UpsertObject_(PMO_V21.SHEETS.SETTINGS, PMO_V21.HEADERS.SETTINGS, '設定鍵', {
        '設定鍵':'LAST_THURSDAY_SCAN','設定值':snapshot.scannedAt,
        '說明':JSON.stringify(snapshot.counts),'更新時間':snapshot.scannedAt
      });
      v21Audit_('REFRESH_THURSDAY_MEETING','週四會議',snapshot.scanId,'成功',JSON.stringify(snapshot.counts));
      snapshot.persisted = true;
      return snapshot;
    });
  });
}

function v21BuildThursdaySnapshot_(todayText, works, reports) {
  var today = v21ParseIsoDay_(todayText), day = today.getUTCDay(), mondayOffset = day === 0 ? -6 : 1-day;
  var monday = v21ShiftIsoDay_(today, mondayOffset), sunday = v21ShiftIsoDay_(monday, 6);
  var thursday = v21ShiftIsoDay_(monday, 3), futureEnd = v21ShiftIsoDay_(today, 7);
  var active = (works || []).filter(function(item){ return PMO_V21.ACTIVE_STATUSES.indexOf(item.status) >= 0 || (item.status === '完成' && v21Text_(item.updatedAt).slice(0,10) >= monday && v21Text_(item.updatedAt).slice(0,10) <= sunday); });
  var seenId = {}, seenComposite = {}, items = [];
  active.forEach(function(item) {
    var sourceKey = v21Text_(item.sourceId || item.id);
    var composite = v21Hash_([item.projectId,item.title,item.assignee].map(v21Text_).join('|').toLowerCase());
    if ((sourceKey && seenId[sourceKey]) || seenComposite[composite]) return;
    if (sourceKey) seenId[sourceKey] = true;
    seenComposite[composite] = true;
    var due = v21Date_(item.dueDate), type = v21Text_(item.type), source = v21Text_(item.sourceSheet), updated = v21Text_(item.updatedAt).slice(0,10);
    var group = item.status === '完成' ? '本週完成' : (v21Text_(item.meetingGroup)||'本週未完成');
    if (!item.meetingGroup&&/週四會議|會議新增/.test(type+' '+source)) group = '會議新增';
    else if (due && due < monday) group = '上週追蹤';
    else if (due && due > sunday && due <= futureEnd) group = '未來7日安排';
    items.push({group:group,id:item.id,projectId:item.projectId,projectName:item.projectName,title:item.title,assignee:item.assignee,
      dueDate:due,status:item.status,source:source||'V21_工作事項',dedupeKey:composite,priority:item.priority,originalStatus:v21Text_(item.originalStatus)});
  });
  var order = {'上週追蹤':0,'本週未完成':1,'本週完成':2,'未來7日安排':3,'會議新增':4};
  items.sort(function(a,b){return order[a.group]-order[b.group] || v21Text_(a.dueDate||'9999').localeCompare(v21Text_(b.dueDate||'9999')) || v21Text_(a.projectName).localeCompare(v21Text_(b.projectName),'zh-Hant');});
  var groups = {'上週追蹤':[],'本週未完成':[],'本週完成':[],'未來7日安排':[],'會議新增':[]}, counts = {};
  items.forEach(function(item){ groups[item.group].push(item); counts[item.group]=(counts[item.group]||0)+1; });
  var weeklyReports = (reports || []).filter(function(report){return report.date >= monday && report.date <= sunday;});
  var byPerson = {};
  weeklyReports.forEach(function(report){var name=report.employee||'未填人員';if(!byPerson[name])byPerson[name]=[];byPerson[name].push({date:report.date,projectName:report.projectName,title:report.title,completed:report.completed,followUp:report.followUp});});
  return {scanId:'MTG-'+Utilities.formatDate(new Date(),PMO_V21.TIME_ZONE,'yyyyMMddHHmmss')+'-'+Utilities.getUuid().slice(0,6),scannedAt:v21Now_(),weekStart:monday,
    weekEnd:sunday,thursday:thursday,futureEnd:futureEnd,items:items,groups:groups,counts:counts,byPerson:byPerson,persisted:false};
}

function v21ReadLatestMeetingSnapshot_() {
  var sheet=v21GetSheet_(PMO_V21.SHEETS.MEETING_SNAPSHOT,false);
  if(!sheet||sheet.getLastRow()<=1)return null;
  var lastColumn=sheet.getLastColumn(),headers=sheet.getRange(1,1,1,lastColumn).getValues()[0].map(v21Text_),map=v21HeaderMap_(headers);
  ['掃描ID','掃描時間','週起日','分類'].forEach(function(header){if(!map[header]||!map[header].length)throw new Error('快照分頁缺少欄位：'+header);});
  var lastRow=sheet.getLastRow(),startRow=Math.max(2,lastRow-1999),rows=sheet.getRange(startRow,1,lastRow-startRow+1,lastColumn).getValues();
  var candidates={};
  rows.forEach(function(row){
    var scan=v21Text_(v21Pick_(row,map,['掃描ID'])),weekStart=v21Date_(v21Pick_(row,map,['週起日']));
    if(!scan||!v21IsIsoDay_(weekStart))return;
    var scannedAt=v21Text_(v21Pick_(row,map,['掃描時間']));
    if(!candidates[scan])candidates[scan]={scanId:scan,scannedAt:scannedAt,weekStart:weekStart,rows:[]};
    candidates[scan].rows.push(row);
  });
  var candidateList=Object.keys(candidates).map(function(key){return candidates[key];}).sort(function(a,b){return v21Text_(b.scannedAt).localeCompare(v21Text_(a.scannedAt))||b.scanId.localeCompare(a.scanId);});
  if(!candidateList.length)return null;
  var selected=candidateList[0],latest=selected.scanId;
  var items=[],scannedAt='',weekStart='',thursday='';
  selected.rows.forEach(function(row){
    scannedAt=v21Text_(v21Pick_(row,map,['掃描時間']));weekStart=v21Date_(v21Pick_(row,map,['週起日']));thursday=v21Date_(v21Pick_(row,map,['週四日']));
    var item={group:v21Text_(v21Pick_(row,map,['分類'])),id:v21Text_(v21Pick_(row,map,['工作ID'])),projectId:v21Text_(v21Pick_(row,map,['專案ID'])),
      projectName:v21Text_(v21Pick_(row,map,['專案名稱'])),title:v21Text_(v21Pick_(row,map,['事項'])),assignee:v21Text_(v21Pick_(row,map,['負責人'])),
      dueDate:v21Date_(v21Pick_(row,map,['期限'])),status:v21Text_(v21Pick_(row,map,['狀態'])),source:v21Text_(v21Pick_(row,map,['來源'])),dedupeKey:v21Text_(v21Pick_(row,map,['去重鍵']))};
    if(item.id||item.title)items.push(item);
  });
  var mondayDate=v21ParseIsoDay_(weekStart),sunday=v21ShiftIsoDay_(mondayDate,6),reports=v21LoadReports_().filter(function(report){return report.date>=weekStart&&report.date<=sunday;}),byPerson={};
  reports.forEach(function(report){var name=report.employee||'未填人員';if(!byPerson[name])byPerson[name]=[];byPerson[name].push({date:report.date,projectName:report.projectName,title:report.title,completed:report.completed,followUp:report.followUp});});
  return v21NormalizeMeetingSnapshot_({scanId:latest,scannedAt:scannedAt,weekStart:weekStart,weekEnd:sunday,thursday:thursday||v21ShiftIsoDay_(mondayDate,3),futureEnd:v21ShiftIsoDay_(v21ParseIsoDay_(v21Today_()),7),items:items,byPerson:byPerson,persisted:true});
}

function v21ParseIsoDay_(text) {
  var normalized=v21Date_(text);
  if(!v21IsIsoDay_(normalized))throw new Error('週四會議日期格式不正確：'+v21Text_(text));
  var parts=normalized.split('-').map(Number);
  return new Date(Date.UTC(parts[0],parts[1]-1,parts[2]));
}

function v21IsIsoDay_(text) {
  var match=String(text||'').match(/^(20\d{2})-(\d{2})-(\d{2})$/);
  if(!match)return false;
  var year=Number(match[1]),month=Number(match[2]),day=Number(match[3]),date=new Date(Date.UTC(year,month-1,day));
  return date.getUTCFullYear()===year&&date.getUTCMonth()===month-1&&date.getUTCDate()===day;
}

function v21NormalizeMeetingSnapshot_(snapshot) {
  snapshot=snapshot||{};
  var order=['上週追蹤','本週未完成','本週完成','未來7日安排','會議新增'],groups={'上週追蹤':[],'本週未完成':[],'本週完成':[],'未來7日安排':[],'會議新增':[]};
  var items=Array.isArray(snapshot.items)?snapshot.items.slice():[];
  if(!items.length&&snapshot.groups){order.forEach(function(group){if(Array.isArray(snapshot.groups[group]))items=items.concat(snapshot.groups[group]);});}
  items=items.filter(function(item){return item&&typeof item==='object';}).map(function(item){
    var normalized={};Object.keys(item).forEach(function(key){normalized[key]=item[key];});
    normalized.group=groups[item.group]?item.group:'本週未完成';
    normalized.projectName=v21Text_(item.projectName);normalized.projectId=v21Text_(item.projectId);normalized.title=v21Text_(item.title);
    normalized.assignee=v21Text_(item.assignee);normalized.status=v21NormalizeStatus_(item.status);normalized.dueDate=v21Date_(item.dueDate);
    groups[normalized.group].push(normalized);return normalized;
  });
  var counts={};order.forEach(function(group){counts[group]=groups[group].length;});
  snapshot.items=items;snapshot.groups=groups;snapshot.counts=counts;snapshot.byPerson=snapshot.byPerson&&typeof snapshot.byPerson==='object'?snapshot.byPerson:{};
  snapshot.warning=v21Text_(snapshot.warning);snapshot.persisted=!!snapshot.persisted;
  return snapshot;
}

function v21ShiftIsoDay_(date,days) {
  var base=v21CoerceIsoDate_(date),shifted=new Date(base.getTime()+days*86400000);
  return Utilities.formatDate(shifted,'UTC','yyyy-MM-dd');
}

function v21CoerceIsoDate_(value) {
  if(Object.prototype.toString.call(value)==='[object Date]'&&!isNaN(value.getTime()))return value;
  return v21ParseIsoDay_(value);
}

function scheduledThursdayRefreshV21() {
  var result=refreshThursdayMeetingV21();
  if(!result.ok)throw new Error(result.message);
  return result.data.counts;
}

/** Read-only diagnosis for the Thursday meeting module. Safe to run from the editor or client. */
function diagnoseThursdayMeetingV21() {
  var result=v21Safe_('DIAGNOSE_THURSDAY_MEETING', function() {
    var checks=[],sheet=v21GetSheet_(PMO_V21.SHEETS.MEETING_SNAPSHOT,false),workCount=0,activeCount=0,reportCount=0,snapshot=null;
    if(!sheet){checks.push({name:'快照分頁',ok:false,detail:'尚未建立 '+PMO_V21.SHEETS.MEETING_SNAPSHOT+'；請執行 setupPssAiPmoV21()'});}
    else{
      var headers=sheet.getLastColumn()?sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0].map(v21Text_):[],missing=PMO_V21.HEADERS.MEETING_SNAPSHOT.filter(function(header){return headers.indexOf(header)<0;});
      checks.push({name:'快照分頁',ok:!missing.length,detail:'資料列 '+Math.max(0,sheet.getLastRow()-1)+'；'+(missing.length?'缺少欄位 '+missing.join('、'):'欄位正常')});
      try{snapshot=v21ReadLatestMeetingSnapshot_();checks.push({name:'最近快照',ok:true,detail:snapshot?'掃描 '+snapshot.scannedAt+'，有效事項 '+snapshot.items.length+' 筆':'目前尚無快照，將即時計算'});}catch(error){checks.push({name:'最近快照',ok:false,detail:error.message||String(error)});}
    }
    try{var works=v21LoadWork_();workCount=works.length;activeCount=works.filter(function(item){return PMO_V21.ACTIVE_STATUSES.indexOf(item.status)>=0;}).length;checks.push({name:'工作資料',ok:true,detail:'共 '+workCount+' 筆；事項／目前處理 '+activeCount+' 筆'});}catch(error){checks.push({name:'工作資料',ok:false,detail:error.message||String(error)});}
    try{reportCount=v21LoadReports_().length;checks.push({name:'回報資料',ok:true,detail:'共 '+reportCount+' 筆'});}catch(error){checks.push({name:'回報資料',ok:false,detail:error.message||String(error)});}
    return {healthy:checks.every(function(check){return check.ok;}),checkedAt:v21Now_(),checks:checks,workCount:workCount,activeCount:activeCount,reportCount:reportCount,snapshot:snapshot?{scanId:snapshot.scanId,scannedAt:snapshot.scannedAt,itemCount:snapshot.items.length}:null};
  });
  console.log(JSON.stringify(result));
  return result;
}
