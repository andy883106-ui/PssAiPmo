/**
 * PSS AI-PMO V20.5 R5.2 - Work feedback and task workflow patch.
 * Add this file to the existing Apps Script project. It does not replace
 * Code.gs and it does not delete or rename existing database columns.
 */

const PSS_R52 = Object.freeze({
  VERSION: 'V20.5 R5.2 Work Feedback',
  HISTORY_SHEET: 'SYS_任務回報歷程',
  MAX_PROJECTS: 3000,
  MAX_TASKS: 3000,
  MAX_REPORTS: 1500
});

function r52Text_(value) {
  return clean_(value);
}

function r52SamePerson_(left, right) {
  return r52Text_(left).toLowerCase() === r52Text_(right).toLowerCase();
}

function r52TaskTarget_(taskId) {
  const sheet = getSheet_('TASKS');
  const row = readCanonical_(sheet, taskDefinitions_()).find(function(item) {
    return r52Text_(item.taskId) === r52Text_(taskId);
  });
  if (!row) throw new Error('找不到任務：' + r52Text_(taskId));
  return {sheet:sheet, row:row, task:normalizeTaskV17_(row)};
}

function r52CanEditTask_(user, task) {
  return isManager_(user) ||
    r52SamePerson_(task.owner, user.name) ||
    r52SamePerson_(task.manager, user.name);
}

function r52AssertTaskEdit_(user, task) {
  if (!r52CanEditTask_(user, task)) {
    throw new Error('只能編輯自己負責、自己派工或主管可管理的任務。');
  }
}

function r52HistorySheet_() {
  return getOrCreateSheet_(PSS_R52.HISTORY_SHEET, [
    '歷程ID','任務ID','回報ID','時間','人員','動作','原狀態','新狀態',
    '回報內容','附件連結','關聯任務ID','備註'
  ]);
}

function r52LogTask_(user, data) {
  data = data || {};
  appendObject_(r52HistorySheet_(), {
    '歷程ID':makeId_('TH'),
    '任務ID':r52Text_(data.taskId),
    '回報ID':r52Text_(data.reportId),
    '時間':new Date(),
    '人員':user.name,
    '動作':r52Text_(data.action),
    '原狀態':r52Text_(data.oldStatus),
    '新狀態':r52Text_(data.newStatus),
    '回報內容':r52Text_(data.content),
    '附件連結':r52Text_(data.attachment),
    '關聯任務ID':r52Text_(data.relatedTaskId),
    '備註':r52Text_(data.note)
  });
}

function r52ProjectSearchText_(project) {
  return [
    project.siteCode, project.projectName, project.customer, project.systemType,
    project.responsible, project.manager, project.engineer, project.engineers,
    project.status, project.address, project.area
  ].map(r52Text_).join(' ').normalize('NFKC').toLowerCase();
}

/** Always returns the current project sheet index instead of a stale browser list. */
function getProjectQuickIndexR52(payload) {
  payload = payload || {};
  requireUser_(payload.token);
  if (payload.force === true) {
    try { clearPssCacheV1922(); } catch (ignore) {}
    try { invalidateProjectIndexR42(payload.token); } catch (ignore2) {}
  }
  const rows = compactProjectIndexV203_(payload.token).slice(0, PSS_R52.MAX_PROJECTS);
  return {
    version:PSS_R52.VERSION,
    generatedAt:new Date().toISOString(),
    count:rows.length,
    projects:rows.map(function(project) {
      const item = Object.assign({}, project);
      item.label = item.label || [item.siteCode,item.projectName].filter(Boolean).join('｜');
      item._search = r52ProjectSearchText_(item);
      return item;
    })
  };
}

function r52TaskReports_(token, task) {
  const rows = listDailyReportsV17({
    token:token, startDate:'', endDate:'', keyword:'', limit:PSS_R52.MAX_REPORTS
  });
  return rows.filter(function(report) {
    if (r52Text_(report.taskId) === r52Text_(task.taskId)) return true;
    if (task.siteCode && r52Text_(report.siteCode) === r52Text_(task.siteCode)) return true;
    return task.projectName && r52Text_(report.projectName) === r52Text_(task.projectName);
  }).slice(0, 120);
}

function r52RelatedTasks_(token, user, task) {
  const rows = listTaskCardsV17({token:token, keyword:'', hideDone:false, limit:PSS_R52.MAX_TASKS});
  return rows.filter(function(item) {
    if (item.taskId === task.taskId) return false;
    const sameProject = task.siteCode
      ? r52Text_(item.siteCode) === r52Text_(task.siteCode)
      : r52Text_(item.projectName) === r52Text_(task.projectName);
    if (!sameProject) return false;
    return isManager_(user) || r52CanEditTask_(user, item);
  }).slice(0, 120);
}

function getTaskWorkspaceR52(payload) {
  payload = payload || {};
  const user = requireUser_(payload.token);
  const target = r52TaskTarget_(payload.taskId);
  if (!isManager_(user) && !r52CanEditTask_(user, target.task)) {
    throw new Error('你沒有權限開啟此任務工作區。');
  }
  const reports = r52TaskReports_(payload.token, target.task);
  const related = r52RelatedTasks_(payload.token, user, target.task);
  return {
    version:PSS_R52.VERSION,
    task:target.task,
    canEdit:r52CanEditTask_(user, target.task),
    relatedTasks:related,
    reports:reports,
    people:getPeopleV17(payload.token),
    summary:{
      reports:reports.length,
      relatedTasks:related.length,
      openRelated:related.filter(function(item){return item.status !== '已完成';}).length,
      attachments:(target.task.attachments || []).length
    }
  };
}

function r52SaveTaskFiles_(payload, user, target) {
  const files = Array.isArray(payload.files) ? payload.files : [];
  if (!files.length) return {links:[], folderUrl:'', files:[]};
  if (typeof saveWorkFilesR42_ !== 'function') {
    throw new Error('目前版本缺少附件儲存模組，請先保留檔案後通知系統管理員。');
  }
  const saved = saveWorkFilesR42_({
    files:files,
    siteCode:r52Text_(payload.siteCode) || target.task.siteCode,
    projectName:r52Text_(payload.projectName) || target.task.projectName,
    title:r52Text_(payload.content) || target.task.content,
    kind:'任務附件',
    date:dateOnly_(new Date())
  });
  if (saved.links.length) {
    const oldLinks = r52Text_(target.task.attachment);
    const merged = [oldLinks,saved.links.join('\n')].filter(Boolean).join('\n');
    writeObject_(target.sheet, target.row.__rowNumber, {
      '照片/附件上傳':merged,
      '照片/附件':merged,
      '雲端資料夾':saved.folderUrl,
      '更新時間':new Date()
    });
    if (typeof appendAttachmentRowsR42_ === 'function') {
      appendAttachmentRowsR42_([target.task.taskId], saved, user, target.task.siteCode, target.task.projectName);
    }
  }
  return saved;
}

function saveTaskWorkspaceR52(payload) {
  payload = payload || {};
  const user = requireUser_(payload.token);
  const target = r52TaskTarget_(payload.taskId);
  r52AssertTaskEdit_(user, target.task);
  const status = r52Text_(payload.status) || target.task.status || '未開始';
  if (['未開始','進行中','卡關','待確認','已完成','取消'].indexOf(status) < 0) {
    throw new Error('任務狀態不正確。');
  }
  const object = {
    '任務內容':payload.content === undefined ? target.task.content : r52Text_(payload.content),
    '任務類型':payload.taskType === undefined ? target.task.taskType : r52Text_(payload.taskType),
    '負責人':payload.owner === undefined ? target.task.owner : r52Text_(payload.owner),
    '優先級':payload.priority === undefined ? target.task.priority : r52Text_(payload.priority),
    '預計完成日':payload.dueDate === undefined ? target.task.dueDate : r52Text_(payload.dueDate),
    '狀態':status,
    '備註':payload.note === undefined ? target.task.note : r52Text_(payload.note),
    '更新時間':new Date()
  };
  if (!isManager_(user) && payload.owner !== undefined && !r52SamePerson_(payload.owner, target.task.owner)) {
    throw new Error('非主管不可變更任務負責人。');
  }
  object['完成日'] = status === '已完成' ? new Date() : '';
  writeObject_(target.sheet, target.row.__rowNumber, object);
  const saved = r52SaveTaskFiles_(payload, user, target);
  r52LogTask_(user, {
    taskId:target.task.taskId,
    action:'編輯任務', oldStatus:target.task.status, newStatus:status,
    content:r52Text_(payload.progressNote), attachment:saved.links.join('\n')
  });
  operationLog_(user, 'R5.2編輯任務', '任務派工', target.task.taskId, object, '成功');
  return {message:'任務已更新。', taskId:target.task.taskId, files:saved.files || []};
}

function completeTaskR52(payload) {
  payload = payload || {};
  payload.status = '已完成';
  const result = saveTaskWorkspaceR52(payload);
  result.message = '任務已標示完成。';
  return result;
}

function saveTaskReportR52(payload) {
  payload = payload || {};
  const user = requireUser_(payload.token);
  const target = r52TaskTarget_(payload.taskId);
  r52AssertTaskEdit_(user, target.task);
  const content = r52Text_(payload.reportContent);
  if (!content) throw new Error('請輸入本次完成／回報內容。');
  const result = saveDailyReportV17({
    token:payload.token,
    taskId:target.task.taskId,
    person:user.name,
    siteCode:target.task.siteCode,
    projectName:target.task.projectName,
    reportDate:r52Text_(payload.reportDate) || dateOnly_(new Date()),
    workType:r52Text_(payload.workType) || target.task.taskType || '任務回報',
    eventTitle:r52Text_(payload.eventTitle) || target.task.content,
    reportContent:content,
    files:Array.isArray(payload.files) ? payload.files : [],
    completeTask:payload.completeTask === true
  });
  r52LogTask_(user, {
    taskId:target.task.taskId,
    reportId:result.reportId,
    action:payload.completeTask === true ? '回報並完成任務' : '新增任務回報',
    oldStatus:target.task.status,
    newStatus:payload.completeTask === true ? '已完成' : (target.task.status === '未開始' ? '進行中' : target.task.status),
    content:content
  });
  return result;
}

function getReportWorkspaceR52(payload) {
  payload = payload || {};
  const user = requireUser_(payload.token);
  const report = getDailyReportV183(payload.token, payload.reportId);
  if (!isManager_(user) && !r52SamePerson_(report.person, user.name)) {
    throw new Error('只能編輯自己的回報。');
  }
  return {version:PSS_R52.VERSION, report:report, canEdit:true};
}

function saveReportWorkspaceR52(payload) {
  payload = payload || {};
  const user = requireUser_(payload.token);
  const before = getDailyReportV183(payload.token, payload.reportId);
  if (!isManager_(user) && !r52SamePerson_(before.person, user.name)) {
    throw new Error('只能編輯自己的回報。');
  }
  const updater = typeof updateDailyReportWithFilesR42 === 'function'
    ? updateDailyReportWithFilesR42
    : updateDailyReportV183;
  const message = updater({
    token:payload.token,
    reportId:payload.reportId,
    date:r52Text_(payload.date),
    startTime:r52Text_(payload.startTime),
    endTime:r52Text_(payload.endTime),
    crossDay:payload.crossDay === true,
    siteCode:r52Text_(payload.siteCode),
    projectName:r52Text_(payload.projectName),
    eventType:r52Text_(payload.workType),
    workType:r52Text_(payload.workType),
    location:r52Text_(payload.location),
    eventTitle:r52Text_(payload.eventTitle),
    reportContent:r52Text_(payload.reportContent),
    files:Array.isArray(payload.files) ? payload.files : []
  });
  if (payload.completeTask === true && before.taskId) {
    completeTaskR52({token:payload.token, taskId:before.taskId, progressNote:'由回報 '+before.reportId+' 標示完成'});
  }
  r52LogTask_(user, {
    taskId:before.taskId, reportId:before.reportId,
    action:'編輯工作回報', content:r52Text_(payload.reportContent)
  });
  return {message:String(message || '回報已更新。'), reportId:before.reportId};
}

function createRelatedTaskR52(payload) {
  payload = payload || {};
  const user = requireUser_(payload.token);
  const taskSheet = getSheet_('TASKS');
  ensureHeaders_(taskSheet, ['來源任務ID','關聯類型']);
  try { invalidateSheetCacheV1922_(taskSheet); } catch (ignore) {}
  const source = payload.sourceTaskId ? r52TaskTarget_(payload.sourceTaskId) : null;
  if (source) r52AssertTaskEdit_(user, source.task);
  let owners = Array.isArray(payload.owners) ? payload.owners : [payload.owner];
  owners = unique_(owners.map(r52Text_).filter(Boolean));
  if (!owners.length) owners = [user.name];
  if (!isManager_(user) && owners.some(function(owner){return !r52SamePerson_(owner, user.name);})) {
    throw new Error('非主管只能新增指派給自己的關聯任務。');
  }
  const siteCode = r52Text_(payload.siteCode) || (source ? source.task.siteCode : '');
  const projectName = r52Text_(payload.projectName) || (source ? source.task.projectName : '');
  const content = r52Text_(payload.content);
  if (!content) throw new Error('關聯任務內容必填。');
  const created = owners.map(function(owner) {
    return createOneTaskV17_({
      siteCode:siteCode,
      projectName:projectName,
      taskType:r52Text_(payload.taskType) || '後續安排',
      content:content,
      owner:owner,
      manager:user.name,
      priority:r52Text_(payload.priority) || '一般',
      dueDate:r52Text_(payload.dueDate),
      status:'未開始',
      note:['來源任務：'+(source ? source.task.taskId : ''),r52Text_(payload.note)].filter(Boolean).join('\n')
    }, user);
  });
  created.forEach(function(item) {
    const target = r52TaskTarget_(item.taskId);
    writeObject_(target.sheet, target.row.__rowNumber, {
      '來源任務ID':source ? source.task.taskId : '',
      '關聯類型':'後續派工',
      '更新時間':new Date()
    });
    r52LogTask_(user, {
      taskId:source ? source.task.taskId : '',
      relatedTaskId:item.taskId,
      action:'新增關聯任務', content:content
    });
  });
  return {message:'已建立 '+created.length+' 筆關聯任務。', tasks:created};
}

function getMyWorkInboxR52(payload) {
  payload = payload || {};
  const user = requireUser_(payload.token);
  const today = dateOnly_(new Date());
  const end = new Date();
  end.setDate(end.getDate() + 7);
  const next7 = dateOnly_(end);
  let rows = listTaskCardsV17({token:payload.token, keyword:'', hideDone:false, limit:PSS_R52.MAX_TASKS});
  if (payload.scope === 'all' && isManager_(user)) {
    // Managers may explicitly request all work. Default remains personal work.
  } else {
    rows = rows.filter(function(task){return r52SamePerson_(task.owner, user.name);});
  }
  const open = rows.filter(function(task){return task.status !== '已完成' && task.status !== '取消';});
  const receivedToday = open.filter(function(task){return task.dispatchDateKey === today;});
  const overdue = open.filter(function(task){return !!task.overdue;});
  const dueSoon = open.filter(function(task){return task.dueDate && task.dueDate >= today && task.dueDate <= next7;});
  const followUps = open.filter(function(task){return /後續|追蹤|待辦/.test([task.taskType,task.note].join(' '));});
  return {
    version:PSS_R52.VERSION,
    generatedAt:new Date().toISOString(),
    user:{name:user.name, account:user.employeeId || user.account},
    summary:{open:open.length, receivedToday:receivedToday.length, overdue:overdue.length, dueSoon:dueSoon.length, followUps:followUps.length},
    receivedToday:receivedToday.slice(0,50),
    overdue:overdue.slice(0,80),
    dueSoon:dueSoon.slice(0,80),
    followUps:followUps.slice(0,80)
  };
}

function setupPssWorkFlowR52() {
  r52HistorySheet_();
  const taskSheet = getSheet_('TASKS');
  ensureHeaders_(taskSheet, ['來源任務ID','關聯類型']);
  PropertiesService.getScriptProperties().setProperty('PSS_R52_INSTALLED', new Date().toISOString());
  return PSS_R52.VERSION + ' 初始化完成：專案快篩、我的工作、任務回報、回報編輯、附件與關聯派工已啟用。';
}

function runPssWorkFlowSelfTestR52() {
  const lines = [PSS_R52.VERSION + ' 自我檢查'];
  try {
    lines.push(getSheet_('PROJECTS') ? '✅ 專案清單' : '❌ 專案清單');
    lines.push(getSheet_('TASKS') ? '✅ 任務派工' : '❌ 任務派工');
    lines.push(getSheet_('DAILY_LOGS') ? '✅ 每日工作日誌' : '❌ 每日工作日誌');
    lines.push(r52HistorySheet_() ? '✅ 任務回報歷程' : '❌ 任務回報歷程');
    lines.push(typeof saveWorkFilesR42_ === 'function' ? '✅ 任務附件模組' : '⚠️ 任務附件模組未載入');
    lines.push(typeof compactProjectIndexV203_ === 'function' ? '✅ V20.3 專案索引' : '❌ V20.3 專案索引');
  } catch (error) {
    lines.push('❌ ' + error.message);
  }
  return lines.join('\n');
}
