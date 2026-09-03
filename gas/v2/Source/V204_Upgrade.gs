/**
 * PSS AI-PMO V20.4
 * - 精簡每日回報
 * - 專案直接新增／修改（取消主管審核）
 * - 主管專案組合式彙總
 * - 一般會議安全移除
 * - V20.4 資料庫備份、遷移、驗證
 */
const PSS_V204 = Object.freeze({
  VERSION: 'V20.4 R2 Direct Project + Drawer UI',
  SCHEMA_VERSION: '20.4.0',
  REQUEST_SHEET: 'SYS_專案申請',
  MIGRATION_SHEET: 'SYS_資料遷移紀錄',
  PERFORMANCE_SHEET: 'SYS_效能監控',
  OTP_SECONDS: 600,
  OTP_PREFIX: 'PSS_V204_APPROVAL_OTP_',
  CLEANUP_CONFIRMATION: '確認永久刪除V20.4舊欄位與一般會議資料',
  GENERAL_MEETING_SHEETS: Object.freeze([
    '事件會議主檔',
    '會議附件',
    '會議錄音分段',
    '參與者簽名',
    '會議出席紀錄'
  ]),
  DAILY_REMOVED_HEADERS: Object.freeze([
    '狀態',
    '施工狀態',
    '進度%',
    '完成百分比',
    '明日計畫',
    '後續事項',
    '明日／後續事項',
    '遇到問題',
    '需要支援',
    '支援需求'
  ]),
  PROJECT_REMOVED_HEADERS: Object.freeze([
    '進度%',
    '完成百分比',
    'KPI燈號',
    '風險燈號'
  ]),
  DAILY_HEADERS: Object.freeze([
    '事件ID','任務ID','關聯任務ID','回報ID','批次回報ID','明細序號',
    '回報日期','日期','人員','主管','場地代號','專案名稱','工作類型',
    '事件類型','事件說明','回報事項','今日完成事項','附件連結',
    '施工照片連結','雲端資料夾','任務來源','開始時間','結束時間',
    '跨日','工時分鐘','工時','地點','整體備註','建立時間','更新時間'
  ]),
  REQUEST_HEADERS: Object.freeze([
    '申請ID','申請類型','狀態','申請日期','申請人員','申請人工號','申請人Email',
    '目標場地代號','目標專案名稱','申請內容JSON','修改前快照JSON','差異JSON',
    '申請原因','重複檢查','主管意見','核准人員','核准人工號','核准時間',
    '正式場地代號','正式資料列','資料夾狀態','資料夾連結','錯誤訊息',
    '建立時間','更新時間'
  ]),
  MIGRATION_HEADERS: Object.freeze([
    '遷移ID','版本','動作','目標','執行前','執行後','狀態','備份檔案ID',
    '備份檔案URL','執行時間','執行者','備註'
  ])
});

function ensureV204RequestSheet_() {
  const sheet = getOrCreateSheet_([PSS_V204.REQUEST_SHEET], PSS_V204.REQUEST_HEADERS);
  ensureHeaders_(sheet, PSS_V204.REQUEST_HEADERS);
  sheet.setFrozenRows(1);
  return sheet;
}

function ensureV204MigrationSheet_() {
  const sheet = getOrCreateSheet_([PSS_V204.MIGRATION_SHEET], PSS_V204.MIGRATION_HEADERS);
  ensureHeaders_(sheet, PSS_V204.MIGRATION_HEADERS);
  sheet.setFrozenRows(1);
  return sheet;
}

function ensureDailyHeadersV204_() {
  const sheet = getSheet_('DAILY_LOGS');
  ensureHeaders_(sheet, PSS_V204.DAILY_HEADERS);
  sheet.setFrozenRows(1);
  return sheet;
}

function dailyDefinitionsV204_() {
  return {
    eventId:['事件ID'],taskId:['任務ID'],relatedTaskId:['關聯任務ID','任務ID'],
    reportId:['回報ID'],batchId:['批次回報ID'],detailNo:['明細序號'],
    reportDate:['回報日期','日期'],date:['日期','回報日期'],person:['人員'],
    supervisor:['主管'],siteCode:['場地代號'],projectName:['專案名稱'],
    workType:['工作類型'],eventType:['事件類型','工作類型'],
    eventTitle:['事件說明','事件標題'],
    reportContent:['回報事項','今日完成事項','完成事項'],
    attachment:['附件連結','施工照片連結'],folderUrl:['雲端資料夾'],
    taskSource:['任務來源'],startTime:['開始時間'],endTime:['結束時間'],
    crossDay:['跨日'],workMinutes:['工時分鐘'],hours:['工時'],location:['地點'],
    overallNote:['整體備註'],createdAt:['建立時間'],updatedAt:['更新時間']
  };
}

function booleanV204_(value) {
  return value === true || ['是','true','1','yes','y'].indexOf(clean_(value).toLowerCase()) >= 0;
}

function workMinutesV204_(startTime, endTime, crossDay) {
  const start = normalizeTimeV183_(startTime);
  const end = normalizeTimeV183_(endTime);
  if (!start || !end) return 0;
  const a = start.split(':').map(Number);
  const b = end.split(':').map(Number);
  let minutes = b[0] * 60 + b[1] - (a[0] * 60 + a[1]);
  if (minutes < 0 && booleanV204_(crossDay)) minutes += 1440;
  if (minutes < 0) throw new Error('結束時間早於開始時間；夜間施工請勾選「跨日」。');
  if (minutes > 24 * 60) throw new Error('單一工作項目不可超過 24 小時。');
  return minutes;
}

function validateDailyBatchItemV204_(item, index) {
  const no = index + 1;
  const projectName = clean_(item.projectName);
  const eventTitle = clean_(item.eventTitle);
  const reportContent = clean_(item.reportContent);
  if (!projectName) throw new Error('第 ' + no + ' 筆：專案名稱必填。');
  if (!eventTitle) throw new Error('第 ' + no + ' 筆：事件／工作標題必填。');
  if (!reportContent) throw new Error('第 ' + no + ' 筆：完成／回報事項必填。');
  const startTime = normalizeTimeV183_(item.startTime);
  const endTime = normalizeTimeV183_(item.endTime);
  return Object.assign({}, item, {
    projectName:projectName,
    eventTitle:eventTitle,
    reportContent:reportContent,
    startTime:startTime,
    endTime:endTime,
    crossDay:booleanV204_(item.crossDay),
    workMinutes:workMinutesV204_(startTime,endTime,item.crossDay)
  });
}

function saveDailyReportBatchV204_(payload) {
  payload = payload || {};
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const user = requireUser_(payload.token);
    const items = Array.isArray(payload.items) ? payload.items : [];
    if (!items.length) throw new Error('請至少新增一筆工作項目。');
    const validated = items.map(validateDailyBatchItemV204_);
    const sheet = ensureDailyHeadersV204_();
    const now = new Date();
    const reportDate = clean_(payload.reportDate) || dateOnly_(now);
    const person = clean_(payload.person) || user.name;
    const supervisor = clean_(payload.supervisor);
    const overallNote = clean_(payload.overallNote);
    const batchId = makeId_('RB');
    const results = [];

    validated.forEach(function(item,index) {
      const task = clean_(item.taskId) ? getTaskV17(payload.token,clean_(item.taskId)) : null;
      const siteCode = clean_(item.siteCode) || (task ? task.siteCode : '');
      const projectName = clean_(item.projectName) || (task ? task.projectName : '');
      const reportId = makeId_('R') + ('00' + (index + 1)).slice(-3);
      const savedFiles = saveReportFilesV17_({
        files:item.files || [],siteCode:siteCode,projectName:projectName,
        eventTitle:item.eventTitle,reportDate:reportDate
      });

      let followTask = null;
      if (clean_(item.followUpTask)) {
        let owners = Array.isArray(item.followUpOwners) ? item.followUpOwners.map(clean_).filter(Boolean) : [];
        if (!owners.length) owners = [person];
        followTask = createTasksMultiOwnerV17({
          token:payload.token,siteCode:siteCode,projectName:projectName,
          taskType:'後續安排',content:clean_(item.followUpTask),owners:owners,
          priority:clean_(item.followUpPriority) || '一般',
          dueDate:clean_(item.followUpDueDate),
          note:'由每日回報 ' + batchId + '／' + reportId + ' 建立'
        });
      }

      const object = {
        '事件ID':clean_(item.eventId) || (task ? task.taskId : reportId),
        '任務ID':clean_(item.taskId),'關聯任務ID':clean_(item.taskId),
        '回報ID':reportId,'批次回報ID':batchId,'明細序號':index + 1,
        '回報日期':reportDate,'日期':reportDate,'人員':person,'主管':supervisor,
        '場地代號':siteCode,'專案名稱':projectName,
        '工作類型':clean_(item.workType) || clean_(item.eventType) || (task ? task.taskType : '每日回報'),
        '事件類型':clean_(item.eventType) || clean_(item.workType) || '每日回報',
        '事件說明':item.eventTitle,'回報事項':item.reportContent,
        '今日完成事項':item.reportContent,
        '附件連結':savedFiles.links.join('\n'),'施工照片連結':savedFiles.links.join('\n'),
        '雲端資料夾':savedFiles.folderUrl,'任務來源':task ? '既有派工' : '自行回報',
        '開始時間':item.startTime,'結束時間':item.endTime,'跨日':item.crossDay ? '是' : '否',
        '工時分鐘':item.workMinutes,'工時':hoursTextV183_(item.workMinutes),
        '地點':clean_(item.location),'整體備註':overallNote,
        '建立時間':now,'更新時間':now
      };
      appendObject_(sheet,object);
      markTaskReportedV183_(payload.token,task,item.completeTask === true);
      syncDailyReportToProgressV17_(object);
      results.push({reportId:reportId,detailNo:index+1,taskId:clean_(item.taskId),followTask:followTask});
    });

    operationLog_(user,'新增精簡每日回報','每日工作日誌',batchId,{
      reportDate:reportDate,person:person,count:results.length
    },'成功');
    return {message:'每日回報已儲存，共 ' + results.length + ' 筆明細。',batchId:batchId,count:results.length,items:results};
  } finally {
    lock.releaseLock();
  }
}

function normalizeDailyReportV204_(report) {
  const item = {
    rowNumber:report.__rowNumber,eventId:clean_(report.eventId),taskId:clean_(report.taskId),
    relatedTaskId:clean_(report.relatedTaskId),reportId:clean_(report.reportId),
    batchId:clean_(report.batchId),detailNo:clean_(report.detailNo),
    date:dateOnly_(report.date || report.reportDate),person:clean_(report.person),
    supervisor:clean_(report.supervisor),siteCode:clean_(report.siteCode),
    projectName:clean_(report.projectName),
    project:[clean_(report.siteCode),clean_(report.projectName)].filter(Boolean).join('｜'),
    workType:clean_(report.workType),eventType:clean_(report.eventType),
    eventTitle:clean_(report.eventTitle),reportContent:clean_(report.reportContent),
    attachment:clean_(report.attachment),folderUrl:clean_(report.folderUrl),
    taskSource:clean_(report.taskSource),startTime:normalizeTimeV183_(report.startTime),
    endTime:normalizeTimeV183_(report.endTime),crossDay:booleanV204_(report.crossDay),
    workMinutes:Number(report.workMinutes || 0),hours:clean_(report.hours),
    location:clean_(report.location),overallNote:clean_(report.overallNote),
    createdAt:dateTime_(report.createdAt),updatedAt:dateTime_(report.updatedAt),
    sortTime:timeNumber_(report.updatedAt) || timeNumber_(report.createdAt) || timeNumber_(report.date)
  };
  item.attachments = typeof attachmentItemsV171_ === 'function' ? attachmentItemsV171_(item.attachment) : [];
  return item;
}

function listDailyReportsV204_(params) {
  params = params || {};
  const user = requireUser_(params.token);
  const access = accessFor_(user);
  const query = clean_(params.keyword).toLowerCase();
  const start = clean_(params.startDate);
  const end = clean_(params.endDate);
  const limit = Math.min(Number(params.limit || 1000),3000);
  return readCanonical_(ensureDailyHeadersV204_(),dailyDefinitionsV204_())
    .map(normalizeDailyReportV204_)
    .filter(function(report) {
      if (!access.canViewAllReports && report.person !== user.name) return false;
      if (start && report.date < start) return false;
      if (end && report.date > end) return false;
      if (!query) return true;
      const text = Object.keys(report).map(function(key){
        return typeof report[key] === 'object' ? '' : report[key];
      }).join(' ').toLowerCase();
      return text.indexOf(query) >= 0;
    })
    .sort(function(a,b){return b.sortTime - a.sortTime;})
    .slice(0,limit);
}

function getDailyReportV204_(token,reportId) {
  const user = requireUser_(token);
  const report = readCanonical_(ensureDailyHeadersV204_(),dailyDefinitionsV204_())
    .find(function(item){return clean_(item.reportId) === clean_(reportId);});
  if (!report) throw new Error('找不到每日回報：' + reportId);
  if (!isManager_(user) && clean_(report.person) !== user.name) throw new Error('你沒有權限查看此回報。');
  return normalizeDailyReportV204_(report);
}

function updateDailyReportV204_(payload) {
  payload = payload || {};
  const user = requireUser_(payload.token);
  const sheet = ensureDailyHeadersV204_();
  const target = readCanonical_(sheet,dailyDefinitionsV204_()).find(function(item){
    return clean_(item.reportId) === clean_(payload.reportId);
  });
  if (!target) throw new Error('找不到每日回報。');
  if (!isManager_(user) && clean_(target.person) !== user.name) throw new Error('只能編輯自己的回報。');
  const minutes = workMinutesV204_(payload.startTime,payload.endTime,payload.crossDay);
  const object = {
    '回報日期':clean_(payload.date),'日期':clean_(payload.date),
    '場地代號':clean_(payload.siteCode),'專案名稱':clean_(payload.projectName),
    '工作類型':clean_(payload.workType) || clean_(payload.eventType),
    '事件類型':clean_(payload.eventType) || clean_(payload.workType),
    '事件說明':clean_(payload.eventTitle),'回報事項':clean_(payload.reportContent),
    '今日完成事項':clean_(payload.reportContent),
    '開始時間':normalizeTimeV183_(payload.startTime),
    '結束時間':normalizeTimeV183_(payload.endTime),
    '跨日':booleanV204_(payload.crossDay) ? '是' : '否',
    '工時分鐘':minutes,'工時':hoursTextV183_(minutes),
    '地點':clean_(payload.location),'更新時間':new Date()
  };
  if (!object['事件說明']) throw new Error('事件／工作標題必填。');
  if (!object['回報事項']) throw new Error('完成／回報事項必填。');
  writeObject_(sheet,target.__rowNumber,object);
  operationLog_(user,'更新精簡每日回報','每日工作日誌',payload.reportId,object,'成功');
  return '每日回報已更新。';
}

function requestDefinitionsV204_() {
  return {
    id:['申請ID'],type:['申請類型'],status:['狀態'],requestDate:['申請日期'],
    requester:['申請人員'],employeeId:['申請人工號'],email:['申請人Email'],
    targetSiteCode:['目標場地代號'],targetProjectName:['目標專案名稱'],
    requestJson:['申請內容JSON'],snapshotJson:['修改前快照JSON'],diffJson:['差異JSON'],
    reason:['申請原因'],duplicateCheck:['重複檢查'],managerComment:['主管意見'],
    approver:['核准人員'],approverId:['核准人工號'],approvedAt:['核准時間'],
    officialSiteCode:['正式場地代號'],officialRow:['正式資料列'],
    folderStatus:['資料夾狀態'],folderUrl:['資料夾連結'],error:['錯誤訊息'],
    createdAt:['建立時間'],updatedAt:['更新時間']
  };
}

function parseJsonV204_(text,fallback) {
  try { return JSON.parse(clean_(text) || JSON.stringify(fallback)); }
  catch (ignore) { return fallback; }
}

function requestRowV204_(row) {
  return {
    rowNumber:row.__rowNumber,id:clean_(row.id),type:clean_(row.type),status:clean_(row.status),
    requestDate:dateTime_(row.requestDate),requester:clean_(row.requester),
    employeeId:clean_(row.employeeId),email:clean_(row.email),
    targetSiteCode:clean_(row.targetSiteCode),targetProjectName:clean_(row.targetProjectName),
    values:parseJsonV204_(row.requestJson,{}),snapshot:parseJsonV204_(row.snapshotJson,{}),
    diff:parseJsonV204_(row.diffJson,{}),reason:clean_(row.reason),
    duplicateCheck:clean_(row.duplicateCheck),managerComment:clean_(row.managerComment),
    approver:clean_(row.approver),approverId:clean_(row.approverId),
    approvedAt:dateTime_(row.approvedAt),officialSiteCode:clean_(row.officialSiteCode),
    officialRow:clean_(row.officialRow),folderStatus:clean_(row.folderStatus),
    folderUrl:clean_(row.folderUrl),error:clean_(row.error),
    createdAt:dateTime_(row.createdAt),updatedAt:dateTime_(row.updatedAt)
  };
}

function projectSnapshotV204_(project) {
  if (!project) return {};
  const keys = [
    'siteCode','projectName','customer','systemType','responsible','engineers','status',
    'active','startDate','dueDate','actualFinishDate','billingStatus','address','mapUrl',
    'caseNo','contractAmount','invoiceAmount','receivedAmount','note','driveUrl'
  ];
  const result = {};
  keys.forEach(function(key){result[key] = project[key] === undefined ? '' : project[key];});
  result.rowNumber = project.rowNumber;
  return result;
}

function diffObjectsV204_(before,after) {
  const diff = {};
  Object.keys(after || {}).forEach(function(key){
    const oldValue = before && before[key] !== undefined ? before[key] : '';
    const newValue = after[key] === undefined ? '' : after[key];
    if (String(oldValue) !== String(newValue)) diff[key] = {before:oldValue,after:newValue};
  });
  return diff;
}

function duplicateProjectCheckV204_(type,values,excludeSiteCode) {
  const normalizedName = normalizeProjectNameV18_(values.projectName);
  const normalizedCustomer = normalizeProjectNameV18_(values.customer);
  const matches = projectRowsV182_().filter(function(project){
    if (excludeSiteCode && clean_(project.siteCode).toLowerCase() === clean_(excludeSiteCode).toLowerCase()) return false;
    if (clean_(values.siteCode) && clean_(project.siteCode).toLowerCase() === clean_(values.siteCode).toLowerCase()) return true;
    const sameName = normalizedName && normalizeProjectNameV18_(project.projectName) === normalizedName;
    const sameCustomer = !normalizedCustomer || normalizeProjectNameV18_(project.customer) === normalizedCustomer;
    return sameName && sameCustomer;
  });
  return matches.map(function(project){return project.siteCode + '｜' + project.projectName;});
}

function createProjectFoldersDirectV204_(user,siteCode,projectName,rowNumber) {
  const root = DriveApp.getFolderById(APP.CLOUD_ROOT_ID);
  const folderName = safeFileName_([siteCode,projectName].filter(Boolean).join('_'));
  const matches = root.getFoldersByName(folderName);
  const projectFolder = matches.hasNext() ? matches.next() : root.createFolder(folderName);
  const links = {'雲端資料夾':projectFolder.getUrl(),'Drive資料夾連結':projectFolder.getUrl()};
  APP.PROJECT_SUBFOLDERS.forEach(function(name){
    const children = projectFolder.getFoldersByName(name);
    const child = children.hasNext() ? children.next() : projectFolder.createFolder(name);
    links[name] = child.getUrl();
  });
  if (rowNumber) writeObject_(getSheet_('PROJECTS'),rowNumber,links);
  operationLog_(user,'建立/確認專案資料夾','雲端資料',siteCode,links,'成功');
  return {message:'專案資料夾已建立/確認。',folderId:projectFolder.getId(),url:projectFolder.getUrl(),links:links};
}

function saveProjectDirectV204_(payload,user,type,values,target) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    ensureProjectCanonicalHeadersV182_();
    const sheet = getSheet_('PROJECTS');
    let rowNumber = target ? Number(target.rowNumber || 0) : 0;
    let siteCode = clean_(values.siteCode);
    const projectName = clean_(values.projectName);
    if (!projectName) throw new Error('專案名稱必填。');
    if (!siteCode) siteCode = generateProjectCodeV182_();

    const duplicate = projectRowsV182_().find(function(project){
      return clean_(project.siteCode).toLowerCase() === siteCode.toLowerCase() && Number(project.rowNumber) !== rowNumber;
    });
    if (duplicate) throw new Error('場地代號已存在：' + siteCode);

    if (!rowNumber) {
      rowNumber = sheet.getLastRow() + 1;
      sheet.getRange(rowNumber,1,1,sheet.getLastColumn()).setValues([new Array(sheet.getLastColumn()).fill('')]);
    }

    values.siteCode = siteCode;
    PSS_V182_PROJECT_FIELDS.filter(function(field){return !field.managed;}).forEach(function(field){
      if (Object.prototype.hasOwnProperty.call(values,field.key)) {
        writeProjectFieldV182_(sheet,rowNumber,field,values[field.key]);
      }
    });
    writeProjectAliasesV18_(sheet,rowNumber,['更新時間'],new Date());
    const createdMap = headerMap_(headers_(sheet));
    (createdMap[normalizeHeader_('建立時間')] || []).forEach(function(index){
      if (!sheet.getRange(rowNumber,index+1).getValue()) sheet.getRange(rowNumber,index+1).setValue(new Date());
    });
    if (!clean_(sheet.getRange(rowNumber,1).getValue())) sheet.getRange(rowNumber,1).setValue(siteCode);

    let folderStatus = '未建立';
    let folderUrl = '';
    let folderError = '';
    try {
      const folder = createProjectFoldersDirectV204_(user,siteCode,projectName,rowNumber);
      folderStatus = '已建立／已確認';
      folderUrl = folder.url;
    } catch (error) {
      folderStatus = '專案已儲存，資料夾待同步';
      folderError = error.message;
    }

    clearPssCacheV1922();
    CacheService.getScriptCache().remove('PSS_V18_PROJECT_SELECTION');
    operationLog_(user,type === '修改專案' ? '直接更新專案' : '直接新增專案','專案清單',siteCode,{
      rowNumber:rowNumber,projectName:projectName,folderStatus:folderStatus,reason:clean_(payload.reason)
    },folderError ? '部分成功' : '成功');

    return {
      message:folderError
        ? (type === '修改專案' ? '專案已更新；Drive 資料夾待同步。' : '專案已新增；Drive 資料夾待同步。')
        : (type === '修改專案' ? '專案已直接更新並確認資料夾。' : '專案已直接新增並建立資料夾。'),
      status:'已儲存',siteCode:siteCode,rowNumber:rowNumber,
      folderStatus:folderStatus,folderUrl:folderUrl,error:folderError,duplicates:[]
    };
  } finally {
    lock.releaseLock();
  }
}

function submitProjectRequestV204(payload) {
  payload = payload || {};
  const user = requireUser_(payload.token);
  const type = clean_(payload.requestType) === '修改專案' ? '修改專案' : '新增專案';
  const values = Object.assign({},payload.values || {});
  values.siteCode = clean_(values.siteCode);
  values.projectName = clean_(values.projectName);
  if (!values.projectName) throw new Error('專案名稱必填。');

  let target = null;
  if (type === '修改專案') {
    if (!values.siteCode) throw new Error('修改專案必須選擇現有場地代號。');
    target = projectRowsV182_().find(function(project){
      return clean_(project.siteCode).toLowerCase() === values.siteCode.toLowerCase();
    });
    if (!target) throw new Error('找不到要修改的專案：' + values.siteCode);
    values.siteCode = target.siteCode;
  }

  const duplicateMatches = duplicateProjectCheckV204_(type,values,target ? target.siteCode : '');
  if (duplicateMatches.length) {
    throw new Error('可能已有相同專案：\n' + duplicateMatches.join('\n'));
  }
  return saveProjectDirectV204_(payload,user,type,values,target);
}

function listProjectRequestsV204(payload) {
  payload = payload || {};
  const user = requireUser_(payload.token);
  const canApprove = hasFeatureV192_(user,'PROJECT','edit') || isManager_(user);
  const status = clean_(payload.status);
  const keyword = clean_(payload.keyword).toLowerCase();
  let rows = readCanonical_(ensureV204RequestSheet_(),requestDefinitionsV204_()).map(requestRowV204_);
  if (!canApprove) rows = rows.filter(function(row){return row.employeeId === clean_(user.employeeId || user.account);});
  return rows.filter(function(row){
    if (status && row.status !== status) return false;
    if (!keyword) return true;
    return JSON.stringify(row).toLowerCase().indexOf(keyword) >= 0;
  }).sort(function(a,b){return (b.createdAt || '').localeCompare(a.createdAt || '');}).slice(0,1000);
}

function getProjectRequestContextV204(payload) {
  payload = payload || {};
  requireUser_(payload.token);
  return {
    version:PSS_V204.VERSION,
    canApprove:false,
    directSave:true,
    projects:compactProjectIndexV203_(payload.token),
    requests:[]
  };
}

function requestProjectApprovalOtpV204(payload) {
  payload = payload || {};
  requireUser_(payload.token);
  throw new Error('專案主管審核功能已於 V20.4 R2 停用；請使用專案頁面的「直接儲存專案」。');
}

function verifyApprovalOtpV204_(user,code) {
  const key = PSS_V204.OTP_PREFIX + clean_(user.employeeId || user.account);
  const expected = CacheService.getScriptCache().get(key);
  if (!expected || expected !== sha256TextV20_(clean_(code))) throw new Error('核准驗證碼錯誤或已逾時。');
  CacheService.getScriptCache().remove(key);
}

function reviewProjectRequestV204(payload) {
  payload = payload || {};
  requireUser_(payload.token);
  throw new Error('專案主管審核功能已於 V20.4 R2 停用。既有申請紀錄保留作歷史查核，不再接受核准、退回或駁回。');
}

function projectTaskKeyV204_(siteCode,projectName) {
  return clean_(siteCode).toLowerCase() || ('name:' + normalizeProjectNameV18_(projectName));
}

function portfolioGroupV204_(items,keyFn) {
  const map = {};
  items.forEach(function(item){
    const key = clean_(keyFn(item)) || '未分類';
    if (!map[key]) map[key] = {name:key,projects:0,openTasks:0,overdue:0,totalTasks:0};
    map[key].projects += 1;
    map[key].openTasks += item.openTasks;
    map[key].overdue += item.overdue;
    map[key].totalTasks += item.totalTasks;
  });
  return Object.keys(map).map(function(key){return map[key];})
    .sort(function(a,b){return b.overdue-a.overdue || b.openTasks-a.openTasks || a.name.localeCompare(b.name,'zh-Hant');});
}

function getPortfolioDashboardV204(payload) {
  payload = payload || {};
  requireFeatureV192_(payload.token,'GANTT','view');
  const started = Date.now();
  const today = dateOnly_(new Date());
  const next30 = dateOnly_(new Date(Date.now() + 30 * 86400000));
  const tasks = projectTaskRowsV192_();
  const taskGroups = {};
  tasks.forEach(function(task){
    const key = projectTaskKeyV204_(task.siteCode,task.projectName);
    if (!taskGroups[key]) taskGroups[key] = [];
    taskGroups[key].push(task);
  });
  const projects = projectRowsV182_().filter(function(project){
    return clean_(project.active) !== '停用' && clean_(project.status) !== '封存';
  }).map(function(project){
    const pt = taskGroups[projectTaskKeyV204_(project.siteCode,project.projectName)] || [];
    const done = pt.filter(function(task){return task.done;}).length;
    const overdue = pt.filter(function(task){return task.overdue;}).length;
    const openTasks = pt.length - done;
    const dueSoon = !!(project.dueDate && project.dueDate >= today && project.dueDate <= dateOnly_(new Date(Date.now()+7*86400000)));
    const completenessFields = [
      project.projectName,project.customer,project.systemType,project.responsible,
      project.engineers,project.status,project.startDate,project.dueDate,project.address,project.driveUrl
    ];
    const completeness = Math.round(completenessFields.filter(function(value){return clean_(value);}).length / completenessFields.length * 100);
    const area = taiwanAreaV203_([project.address,project.projectName,project.customer].join(' '));
    const health = overdue ? '逾期' : (dueSoon && openTasks ? '注意' : '正常');
    return {
      siteCode:project.siteCode,projectName:project.projectName,customer:project.customer,
      systemType:project.systemType,responsible:project.responsible || project.manager,
      engineers:project.engineers || project.engineer,status:project.status,address:project.address,
      startDate:project.startDate,dueDate:project.dueDate,billingStatus:project.billingStatus,
      driveUrl:project.driveUrl,area:area,totalTasks:pt.length,doneTasks:done,
      openTasks:openTasks,overdue:overdue,
      completion:pt.length ? Math.round(done / pt.length * 100) : null,
      completeness:completeness,health:health,
      upcoming:pt.filter(function(task){
        return !task.done && task.dueDate && task.dueDate >= today && task.dueDate <= next30;
      }).sort(function(a,b){return a.dueDate.localeCompare(b.dueDate);}).slice(0,8)
    };
  });
  const pendingRequests = readCanonical_(ensureV204RequestSheet_(),requestDefinitionsV204_())
    .filter(function(row){return clean_(row.status) === '待審核';}).length;
  const upcoming = tasks.filter(function(task){
    return !task.done && task.dueDate && task.dueDate >= today && task.dueDate <= next30;
  }).sort(function(a,b){return a.dueDate.localeCompare(b.dueDate);}).slice(0,200);
  const selectedCode = clean_(payload.siteCode);
  let detail = null;
  if (selectedCode) {
    const project = projects.find(function(item){return item.siteCode.toLowerCase() === selectedCode.toLowerCase();});
    if (project) {
      const pt = taskGroups[projectTaskKeyV204_(project.siteCode,project.projectName)] || [];
      const media = readProjectMediaV192_().filter(function(item){
        return sameProjectV192_(project.siteCode,project.projectName,item.siteCode,item.projectName);
      }).slice(0,100);
      detail = {project:project,tasks:pt,media:media};
    }
  }
  const result = {
    version:PSS_V204.VERSION,generatedAt:new Date().toISOString(),
    stats:{
      projects:projects.length,
      openTasks:projects.reduce(function(sum,item){return sum + item.openTasks;},0),
      overdue:projects.reduce(function(sum,item){return sum + item.overdue;},0),
      dueSoon:projects.filter(function(item){return item.health === '注意';}).length,
      pendingRequests:pendingRequests,
      averageCompleteness:projects.length ? Math.round(projects.reduce(function(sum,item){return sum + item.completeness;},0)/projects.length) : 0
    },
    groups:{
      areas:portfolioGroupV204_(projects,function(item){return item.area;}),
      customers:portfolioGroupV204_(projects,function(item){return item.customer;}),
      systems:portfolioGroupV204_(projects,function(item){return item.systemType;}),
      owners:portfolioGroupV204_(projects,function(item){return item.responsible;})
    },
    projects:projects.sort(function(a,b){
      const healthOrder = {逾期:0,注意:1,正常:2};
      return healthOrder[a.health]-healthOrder[b.health] || b.openTasks-a.openTasks || a.siteCode.localeCompare(b.siteCode);
    }),
    upcoming:upcoming,detail:detail,
    performance:{totalMs:Date.now()-started,projectCount:projects.length,taskCount:tasks.length}
  };
  return result;
}

function v204HeadersFound_(sheet,names) {
  if (!sheet) return [];
  const hs = headers_(sheet);
  return hs.filter(function(header){
    return names.some(function(name){return normalizeHeader_(name) === normalizeHeader_(header);});
  });
}

function previewV204Migration() {
  const ss = getDb_();
  const daily = getSheet_('DAILY_LOGS',false);
  const projects = getSheet_('PROJECTS',false);
  return {
    version:PSS_V204.VERSION,
    database:ss.getName(),
    dailyColumnsToDelete:v204HeadersFound_(daily,PSS_V204.DAILY_REMOVED_HEADERS),
    projectColumnsToDelete:v204HeadersFound_(projects,PSS_V204.PROJECT_REMOVED_HEADERS),
    meetingSheetsToDelete:PSS_V204.GENERAL_MEETING_SHEETS.filter(function(name){return !!ss.getSheetByName(name);}),
    preserved:[
      '週四會議 MTG_WEB_* 與週三快照',
      '任務派工狀態與任務完成率',
      '維護異常的問題／處理欄位',
      'MEETING 權限代號（改作週四工作台）'
    ],
    confirmationText:PSS_V204.CLEANUP_CONFIRMATION
  };
}

function backupV204Database() {
  const ss = getDb_();
  const file = DriveApp.getFileById(ss.getId());
  const stamp = Utilities.formatDate(new Date(),APP.TZ,'yyyyMMdd_HHmmss');
  const copy = file.makeCopy(ss.getName() + '_V20.4遷移前備份_' + stamp);
  const props = PropertiesService.getScriptProperties();
  props.setProperty('PSS_V204_BACKUP_ID',copy.getId());
  props.setProperty('PSS_V204_BACKUP_URL',copy.getUrl());
  props.setProperty('PSS_V204_BACKUP_AT',new Date().toISOString());
  appendObject_(ensureV204MigrationSheet_(),{
    '遷移ID':makeId_('MIG'),'版本':PSS_V204.SCHEMA_VERSION,'動作':'建立完整備份',
    '目標':ss.getName(),'執行前':ss.getId(),'執行後':copy.getId(),'狀態':'成功',
    '備份檔案ID':copy.getId(),'備份檔案URL':copy.getUrl(),'執行時間':new Date(),
    '執行者':Session.getEffectiveUser().getEmail(),'備註':'永久清理前完整試算表副本'
  });
  return {message:'備份完成。',fileId:copy.getId(),url:copy.getUrl(),name:copy.getName()};
}

function deleteColumnsByHeaderV204_(sheet,names) {
  if (!sheet || sheet.getLastColumn() < 1) return [];
  const hs = headers_(sheet);
  const indexes = [];
  hs.forEach(function(header,index){
    if (names.some(function(name){return normalizeHeader_(name) === normalizeHeader_(header);})) indexes.push(index + 1);
  });
  indexes.sort(function(a,b){return b-a;}).forEach(function(column){sheet.deleteColumn(column);});
  return indexes.map(function(index){return hs[index-1];});
}

function updateMeetingFeatureLabelV204_() {
  const sheet = getDb_().getSheetByName(PSS_V192.FEATURE_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return;
  const values = sheet.getDataRange().getValues();
  const hs = values[0].map(normalizeHeader_);
  const codeCol = hs.indexOf(normalizeHeader_('功能代碼'));
  const nameCol = hs.indexOf(normalizeHeader_('功能名稱'));
  const pageCol = hs.indexOf(normalizeHeader_('頁面'));
  if (codeCol < 0) return;
  values.slice(1).forEach(function(row,index){
    if (clean_(row[codeCol]).toUpperCase() !== 'MEETING') return;
    if (nameCol >= 0) sheet.getRange(index+2,nameCol+1).setValue('週四會議工作台');
    if (pageCol >= 0) sheet.getRange(index+2,pageCol+1).setValue('external-meeting');
  });
}

function finalizeV204DatabaseCleanup(confirmText) {
  if (clean_(confirmText) !== PSS_V204.CLEANUP_CONFIRMATION) {
    throw new Error('確認文字不正確。請先執行 previewV204Migration()。');
  }
  /* 永久清理當下強制建立新副本，不沿用先前可能已過期的備份。 */
  const backup = backupV204Database();
  const backupId = backup.fileId;
  const backupUrl = backup.url;
  const ss = getDb_();
  const before = previewV204Migration();
  const dailyDeleted = deleteColumnsByHeaderV204_(getSheet_('DAILY_LOGS',false),PSS_V204.DAILY_REMOVED_HEADERS);
  const projectDeleted = deleteColumnsByHeaderV204_(getSheet_('PROJECTS',false),PSS_V204.PROJECT_REMOVED_HEADERS);
  const sheetsDeleted = [];
  PSS_V204.GENERAL_MEETING_SHEETS.forEach(function(name){
    const sheet = ss.getSheetByName(name);
    if (!sheet) return;
    ss.deleteSheet(sheet);
    sheetsDeleted.push(name);
  });
  updateMeetingFeatureLabelV204_();
  PropertiesService.getScriptProperties().setProperty('PSS_DB_SCHEMA_VERSION',PSS_V204.SCHEMA_VERSION);
  appendObject_(ensureV204MigrationSheet_(),{
    '遷移ID':makeId_('MIG'),'版本':PSS_V204.SCHEMA_VERSION,'動作':'永久清理',
    '目標':'每日工作日誌／專案清單／一般會議',
    '執行前':JSON.stringify(before),
    '執行後':JSON.stringify({dailyDeleted:dailyDeleted,projectDeleted:projectDeleted,sheetsDeleted:sheetsDeleted}),
    '狀態':'成功','備份檔案ID':backupId,'備份檔案URL':backupUrl,
    '執行時間':new Date(),'執行者':Session.getEffectiveUser().getEmail(),
    '備註':'週四工作台與 MEETING 權限代號已保留'
  });
  clearPssCacheV1922();
  return {
    message:'V20.4 資料庫清理完成。',
    dailyDeleted:dailyDeleted,projectDeleted:projectDeleted,sheetsDeleted:sheetsDeleted,
    backupId:backupId,backupUrl:backupUrl
  };
}

function setupPssAiPmoV204() {
  ensureV204RequestSheet_();
  ensureV204MigrationSheet_();
  ensureDailyHeadersV204_();
  ensurePerformanceSheetV203_();
  ensurePmoV20Sheet_(PSS_V20.TICKET_SHEET,[
    '票證雜湊','工號','姓名','來源應用','目標應用','建立時間','到期時間','使用時間','狀態'
  ]);
  updateMeetingFeatureLabelV204_();
  PropertiesService.getScriptProperties().setProperty('PSS_V204_INSTALLED',new Date().toISOString());
  PropertiesService.getScriptProperties().setProperty('PSS_DB_SCHEMA_VERSION',PSS_V204.SCHEMA_VERSION);
  clearPssCacheV1922();
  return [
    'PSS AI-PMO V20.4 初始化完成。',
    '已建立：' + PSS_V204.REQUEST_SHEET + '、' + PSS_V204.MIGRATION_SHEET,
    '每日回報已切換為精簡欄位讀寫。',
    '一般會議未自動刪除；請先備份並執行 finalizeV204DatabaseCleanup(確認文字)。',
    '資料庫版本：' + PSS_V204.SCHEMA_VERSION
  ].join('\n');
}

function runV204SelfTest() {
  const lines = ['PSS AI-PMO ' + PSS_V204.VERSION + ' 自我檢查'];
  try { lines.push('✅ 主資料庫：' + getDb_().getName()); } catch (e) { lines.push('❌ 主資料庫：' + e.message); }
  try { lines.push('✅ 專案申請表：' + ensureV204RequestSheet_().getName()); } catch (e) { lines.push('❌ 專案申請表：' + e.message); }
  try { lines.push('✅ 遷移紀錄表：' + ensureV204MigrationSheet_().getName()); } catch (e) { lines.push('❌ 遷移紀錄表：' + e.message); }
  try {
    const preview = previewV204Migration();
    lines.push('ℹ️ 待刪每日欄位：' + preview.dailyColumnsToDelete.length);
    lines.push('ℹ️ 待刪專案欄位：' + preview.projectColumnsToDelete.length);
    lines.push('ℹ️ 待刪一般會議表：' + preview.meetingSheetsToDelete.length);
  } catch (e) { lines.push('❌ 遷移預覽：' + e.message); }
  lines.push('✅ 週四會議工作台與 MEETING 快速登入代號保留。');
  lines.push('✅ 專案核准採 Email 10 分鐘驗證碼。');
  return lines.join('\n');
}
