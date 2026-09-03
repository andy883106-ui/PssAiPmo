/** Header-driven repositories for both legacy and V21 canonical sheets. */
function v21LoadProjects_() {
  if (v21HasCanonicalData_(PMO_V21.SHEETS.PROJECTS)) return v21LoadCanonicalProjects_();
  return v21LoadLegacyProjects_();
}

function v21LoadLegacyProjects_() {
  var table = v21ReadSourceTable_(PMO_V21.SHEETS.LEGACY_PROJECTS);
  var map = v21HeaderMap_(table.headers);
  var byId = {};
  table.rows.forEach(function(row, index) {
    var id = v21Text_(v21Pick_(row, map, ['場地代號','專案ID','案號']));
    var name = v21Text_(v21Pick_(row, map, ['專案名稱']));
    if (!id && !name) return;
    id = id || 'LEGACY-' + v21Hash_(name);
    var rawStatus = v21Text_(v21Pick_(row, map, ['狀態','專案狀態','簽約狀態','合約狀況','啟用狀況']));
    var folder = v21Text_(v21Pick_(row, map, ['雲端資料夾','Drive資料夾連結']));
    if (/^https?:\/\//i.test(rawStatus)) {
      folder = folder || rawStatus;
      rawStatus = '待確認';
    }
    var project = {
      id: id, name: name || id,
      customer: v21Text_(v21Pick_(row, map, ['客戶'])),
      systemType: v21Text_(v21Pick_(row, map, ['系統類型'])),
      owner: v21Text_(v21Pick_(row, map, ['PM','專案工程師','工程師','負責人員','專案業務/主管'])),
      status: rawStatus || '待確認',
      progress: v21Number_(v21Pick_(row, map, ['進度%','進度'])),
      folderUrl: folder,
      drawingStatus: v21Text_(v21Pick_(row, map, ['圖面送審狀態','圖面狀態'])),
      startDate: v21Date_(v21Pick_(row, map, ['開始日'])),
      dueDate: v21Date_(v21Pick_(row, map, ['預計完成日'])),
      sourceSheet: PMO_V21.SHEETS.LEGACY_PROJECTS,
      sourceRow: index + 2,
      updatedAt: v21Text_(v21Pick_(row, map, ['更新時間','最後同步時間','建立時間']))
    };
    byId[id] = v21MergeProject_(byId[id], project);
  });
  return Object.keys(byId).map(function(id) { return byId[id]; });
}

function v21MergeProject_(oldValue, newValue) {
  if (!oldValue) return newValue;
  Object.keys(newValue).forEach(function(key) {
    if ((oldValue[key] === '' || oldValue[key] === null || oldValue[key] === undefined) && newValue[key] !== '') oldValue[key] = newValue[key];
  });
  if (newValue.progress > oldValue.progress) oldValue.progress = newValue.progress;
  return oldValue;
}

function v21LoadCanonicalProjects_() {
  var table = v21ReadTable_(PMO_V21.SHEETS.PROJECTS);
  var map = v21HeaderMap_(table.headers);
  return table.rows.map(function(row, index) {
    return {
      id: v21Text_(v21Pick_(row, map, ['專案ID'])), name: v21Text_(v21Pick_(row, map, ['專案名稱'])),
      customer: v21Text_(v21Pick_(row, map, ['客戶'])), systemType: v21Text_(v21Pick_(row, map, ['系統類型'])),
      owner: v21Text_(v21Pick_(row, map, ['負責人'])), status: v21Text_(v21Pick_(row, map, ['專案狀態'])),
      progress: v21Number_(v21Pick_(row, map, ['進度'])), folderUrl: v21Text_(v21Pick_(row, map, ['雲端資料夾'])),
      drawingStatus: v21Text_(v21Pick_(row, map, ['圖面送審狀態'])), startDate: v21Date_(v21Pick_(row, map, ['開始日'])),
      dueDate: v21Date_(v21Pick_(row, map, ['預計完成日'])), sourceSheet: v21Text_(v21Pick_(row, map, ['來源分頁'])),
      sourceRow: v21Number_(v21Pick_(row, map, ['來源列'], index + 2)), updatedAt: v21Text_(v21Pick_(row, map, ['更新時間']))
    };
  }).filter(function(project) { return project.id || project.name; });
}

function v21LoadWork_() {
  if (v21HasCanonicalData_(PMO_V21.SHEETS.WORK)) return v21LoadCanonicalWork_();
  return v21LoadLegacyTasks_().concat(v21LoadLegacyFollowups_());
}

function v21LoadLegacyTasks_() {
  var table = v21ReadSourceTable_(PMO_V21.SHEETS.LEGACY_TASKS);
  var map = v21HeaderMap_(table.headers);
  return table.rows.map(function(row, index) {
    var projectId = v21Text_(v21Pick_(row, map, ['場地代號','專案ID']));
    var name = v21Text_(v21Pick_(row, map, ['專案名稱']));
    var title = v21Text_(v21Pick_(row, map, ['任務內容','工作事項','事件說明']));
    var sourceId = v21Text_(v21Pick_(row, map, ['任務ID','事件ID','派工ID']));
    if (!projectId && !name && !title) return null;
    return {
      id: sourceId || 'LT-' + v21Hash_([projectId, name, title, index + 2].join('|')),
      projectId: projectId, projectName: name, title: title || name,
      type: v21Text_(v21Pick_(row, map, ['任務類型','工作類型'])),
      assignee: v21Text_(v21Pick_(row, map, ['負責人'])), collaborator: v21Text_(v21Pick_(row, map, ['協作人'])),
      priority: v21Text_(v21Pick_(row, map, ['優先級','優先度'])), startDate: v21Date_(v21Pick_(row, map, ['開始日','派工日期'])),
      dueDate: v21Date_(v21Pick_(row, map, ['預計完成日'])), status: v21NormalizeStatus_(v21Pick_(row, map, ['狀態','回報狀態'])),
      progress: v21Number_(v21Pick_(row, map, ['進度%','完成率'])), completion: v21Text_(v21Pick_(row, map, ['完成資料','完成內容'])),
      attachment: v21Text_(v21Pick_(row, map, ['附件連結','照片/附件','照片/附件上傳','照片'])),
      sourceSheet: PMO_V21.SHEETS.LEGACY_TASKS, sourceId: sourceId || String(index + 2),
      createdAt: v21Text_(v21Pick_(row, map, ['建立時間','派工日期'])), updatedAt: v21Text_(v21Pick_(row, map, ['更新時間','最後同步時間']))
    };
  }).filter(Boolean);
}

function v21LoadLegacyFollowups_() {
  var table = v21ReadSourceTable_(PMO_V21.SHEETS.LEGACY_FOLLOWUPS);
  var map = v21HeaderMap_(table.headers);
  return table.rows.map(function(row, index) {
    var sourceId = v21Text_(v21Pick_(row, map, ['後續ID','任務ID']));
    var title = v21Text_(v21Pick_(row, map, ['後續事項','工作事項']));
    if (!sourceId && !title) return null;
    return {
      id: sourceId || 'FU-' + v21Hash_(title + '|' + (index + 2)), projectId: v21Text_(v21Pick_(row, map, ['場地代號','專案ID'])),
      projectName: v21Text_(v21Pick_(row, map, ['專案名稱'])), title: title, type: '後續追蹤',
      assignee: v21Text_(v21Pick_(row, map, ['負責人'])), collaborator: v21Text_(v21Pick_(row, map, ['協作人'])),
      priority: v21Text_(v21Pick_(row, map, ['優先級','優先度'])), startDate: v21Date_(v21Pick_(row, map, ['開始日','來源日期'])),
      dueDate: v21Date_(v21Pick_(row, map, ['預計完成日'])), status: v21NormalizeStatus_(v21Pick_(row, map, ['狀態'])),
      progress: 0, completion: v21Text_(v21Pick_(row, map, ['備註'])), attachment: v21Text_(v21Pick_(row, map, ['附件連結'])),
      sourceSheet: PMO_V21.SHEETS.LEGACY_FOLLOWUPS, sourceId: sourceId || String(index + 2),
      createdAt: v21Text_(v21Pick_(row, map, ['建立時間'])), updatedAt: v21Text_(v21Pick_(row, map, ['更新時間']))
    };
  }).filter(Boolean);
}

function v21LoadCanonicalWork_() {
  var table = v21ReadTable_(PMO_V21.SHEETS.WORK);
  var map = v21HeaderMap_(table.headers);
  return table.rows.map(function(row) {
    return {
      id: v21Text_(v21Pick_(row, map, ['工作ID'])), projectId: v21Text_(v21Pick_(row, map, ['專案ID'])),
      projectName: v21Text_(v21Pick_(row, map, ['專案名稱'])), title: v21Text_(v21Pick_(row, map, ['工作標題'])),
      type: v21Text_(v21Pick_(row, map, ['工作類型'])), assignee: v21Text_(v21Pick_(row, map, ['負責人'])),
      collaborator: v21Text_(v21Pick_(row, map, ['協作人'])), priority: v21Text_(v21Pick_(row, map, ['優先級'])),
      startDate: v21Date_(v21Pick_(row, map, ['開始日'])), dueDate: v21Date_(v21Pick_(row, map, ['預計完成日'])),
      status: v21NormalizeStatus_(v21Pick_(row, map, ['狀態'])), progress: v21Number_(v21Pick_(row, map, ['進度'])),
      completion: v21Text_(v21Pick_(row, map, ['完成內容'])), attachment: v21Text_(v21Pick_(row, map, ['附件連結'])),
      sourceSheet: v21Text_(v21Pick_(row, map, ['來源分頁'])), sourceId: v21Text_(v21Pick_(row, map, ['來源ID'])),
      createdAt: v21Text_(v21Pick_(row, map, ['建立時間'])), updatedAt: v21Text_(v21Pick_(row, map, ['更新時間']))
    };
  }).filter(function(item) { return item.id && item.title; });
}

function v21LoadReports_() {
  if (v21HasCanonicalData_(PMO_V21.SHEETS.REPORTS)) return v21LoadCanonicalReports_();
  var table = v21ReadSourceTable_(PMO_V21.SHEETS.LEGACY_REPORTS);
  var map = v21HeaderMap_(table.headers);
  return table.rows.map(function(row, index) {
    var sourceId = v21Text_(v21Pick_(row, map, ['回報ID','事件ID']));
    var completed = v21Text_(v21Pick_(row, map, ['本次完成','回報事項','今日完成事項','完成資料']));
    var title = v21Text_(v21Pick_(row, map, ['事件說明','事件標題']));
    if (!sourceId && !completed && !title) return null;
    return {
      id: sourceId || 'LR-' + v21Hash_([index + 2, completed].join('|')),
      date: v21Date_(v21Pick_(row, map, ['回報日期','日期'])), employee: v21Text_(v21Pick_(row, map, ['人員'])),
      supervisor: v21Text_(v21Pick_(row, map, ['主管'])), projectId: v21Text_(v21Pick_(row, map, ['場地代號','專案ID'])),
      projectName: v21Text_(v21Pick_(row, map, ['專案名稱'])), title: title || completed.slice(0, 60), completed: completed,
      issue: v21Text_(v21Pick_(row, map, ['未完成/問題','遇到問題'])), followUp: v21Text_(v21Pick_(row, map, ['後續事項','明日計畫'])),
      attachment: v21Text_(v21Pick_(row, map, ['附件連結','施工照片連結','完成資料'])), relatedWorkId: v21Text_(v21Pick_(row, map, ['關聯任務ID','任務ID'])),
      sourceSheet: PMO_V21.SHEETS.LEGACY_REPORTS, sourceId: sourceId || String(index + 2),
      createdAt: v21Text_(v21Pick_(row, map, ['建立時間'])), updatedAt: v21Text_(v21Pick_(row, map, ['更新時間']))
    };
  }).filter(Boolean);
}

function v21LoadCanonicalReports_() {
  var table = v21ReadTable_(PMO_V21.SHEETS.REPORTS);
  var map = v21HeaderMap_(table.headers);
  return table.rows.map(function(row) {
    return {
      id: v21Text_(v21Pick_(row, map, ['回報ID'])), date: v21Date_(v21Pick_(row, map, ['回報日期'])),
      employee: v21Text_(v21Pick_(row, map, ['人員'])), supervisor: v21Text_(v21Pick_(row, map, ['主管'])),
      projectId: v21Text_(v21Pick_(row, map, ['專案ID'])), projectName: v21Text_(v21Pick_(row, map, ['專案名稱'])),
      title: v21Text_(v21Pick_(row, map, ['事件標題'])), completed: v21Text_(v21Pick_(row, map, ['完成回報'])),
      issue: v21Text_(v21Pick_(row, map, ['未完成問題'])), followUp: v21Text_(v21Pick_(row, map, ['後續事項'])),
      attachment: v21Text_(v21Pick_(row, map, ['附件連結'])), relatedWorkId: v21Text_(v21Pick_(row, map, ['關聯工作ID'])),
      sourceSheet: v21Text_(v21Pick_(row, map, ['來源分頁'])), sourceId: v21Text_(v21Pick_(row, map, ['來源ID'])),
      createdAt: v21Text_(v21Pick_(row, map, ['建立時間'])), updatedAt: v21Text_(v21Pick_(row, map, ['更新時間']))
    };
  }).filter(function(report) { return report.id; });
}

function v21LoadBaseHistory_() {
  if (v21HasCanonicalData_(PMO_V21.SHEETS.HISTORY)) {
    var canonical = v21ReadTable_(PMO_V21.SHEETS.HISTORY);
    var canonicalMap = v21HeaderMap_(canonical.headers);
    return canonical.rows.map(function(row) {
      var content = v21Text_(v21Pick_(row, canonicalMap, ['內容']));
      return { id:v21Text_(v21Pick_(row,canonicalMap,['歷程ID'])),occurredAt:v21Text_(v21Pick_(row,canonicalMap,['發生時間'])),
        projectId:v21Text_(v21Pick_(row,canonicalMap,['專案ID'])),projectName:v21Text_(v21Pick_(row,canonicalMap,['專案名稱'])),
        type:v21Text_(v21Pick_(row,canonicalMap,['類型'])),sourceSheet:v21Text_(v21Pick_(row,canonicalMap,['來源分頁'])),
        sourceId:v21Text_(v21Pick_(row,canonicalMap,['來源ID'])),title:v21Text_(v21Pick_(row,canonicalMap,['標題'])),content:content,
        owner:v21Text_(v21Pick_(row,canonicalMap,['負責人'])),status:v21Text_(v21Pick_(row,canonicalMap,['狀態'])),
        link:v21Text_(v21Pick_(row,canonicalMap,['連結'])),hash:v21Text_(v21Pick_(row,canonicalMap,['內容雜湊']))||v21Hash_(content) };
    }).filter(function(item){return item.id;});
  }
  var table = v21ReadSourceTable_(PMO_V21.SHEETS.LEGACY_HISTORY);
  var map = v21HeaderMap_(table.headers);
  return table.rows.map(function(row, index) {
    var id = v21Text_(v21Pick_(row, map, ['歷程ID']));
    var content = v21Text_(v21Pick_(row, map, ['內容']));
    if (!id && !content) return null;
    return {
      id: id || 'LH-' + v21Hash_(content + '|' + index), occurredAt: v21Text_(v21Pick_(row, map, ['時間','發生時間'])),
      projectId: v21Text_(v21Pick_(row, map, ['場地代號','專案ID'])), projectName: v21Text_(v21Pick_(row, map, ['專案名稱'])),
      type: v21Text_(v21Pick_(row, map, ['類型'])), sourceSheet: PMO_V21.SHEETS.LEGACY_HISTORY,
      sourceId: v21Text_(v21Pick_(row, map, ['來源ID'])), title: v21Text_(v21Pick_(row, map, ['標題'])), content: content,
      owner: v21Text_(v21Pick_(row, map, ['負責人'])), status: v21Text_(v21Pick_(row, map, ['狀態'])),
      link: v21Text_(v21Pick_(row, map, ['連結'])), hash: v21Hash_(content)
    };
  }).filter(Boolean);
}

function v21UnifiedHistory_(works, reports) {
  var items = v21LoadBaseHistory_();
  (reports || []).forEach(function(report) {
    var content = [report.completed, report.issue ? '問題：' + report.issue : '', report.followUp ? '後續：' + report.followUp : ''].filter(Boolean).join('\n');
    items.push({ id: 'RH-' + report.id, occurredAt: report.date || report.updatedAt, projectId: report.projectId, projectName: report.projectName,
      type: '工作回報', sourceSheet: report.sourceSheet, sourceId: report.sourceId, title: report.title || '工作回報', content: content,
      owner: report.employee, status: report.followUp ? '待追蹤' : '已回報', link: report.attachment, hash: v21Hash_(content) });
  });
  (works || []).forEach(function(work) {
    items.push({ id: 'WH-' + work.id, occurredAt: work.updatedAt || work.createdAt || work.startDate, projectId: work.projectId, projectName: work.projectName,
      type: '工作事項', sourceSheet: work.sourceSheet, sourceId: work.sourceId, title: work.title,
      content: work.completion || work.title, owner: work.assignee, status: work.status, link: work.attachment, hash: v21Hash_(work.title + '|' + work.status + '|' + work.completion) });
  });
  var seen = {};
  return items.filter(function(item) {
    var key = [item.projectId, item.type, item.sourceSheet, item.sourceId, item.hash].join('|');
    if (seen[key]) return false;
    seen[key] = true;
    return true;
  }).sort(function(a, b) { return v21Text_(b.occurredAt).localeCompare(v21Text_(a.occurredAt)); });
}

function v21LoadCanonicalDrawingMap_() {
  return v21BuildCanonicalDrawingMap_(v21LoadCanonicalDrawings_());
}

function v21LoadCanonicalDrawings_() {
  if (!v21HasCanonicalData_(PMO_V21.SHEETS.DRAWINGS)) return [];
  var table = v21ReadTable_(PMO_V21.SHEETS.DRAWINGS);
  var map = v21HeaderMap_(table.headers);
  return table.rows.map(function(row) {
    return {
      id:v21Text_(v21Pick_(row,map,['圖面ID'])), projectId:v21Text_(v21Pick_(row,map,['專案ID'])),
      projectName:v21Text_(v21Pick_(row,map,['專案名稱'])), title:v21Text_(v21Pick_(row,map,['圖面標題'])),
      status:v21Text_(v21Pick_(row,map,['送審狀態']))||'待確認', submittedAt:v21Date_(v21Pick_(row,map,['送審日期'])),
      review:v21Text_(v21Pick_(row,map,['審查結果']))||'V21 圖面主檔', version:v21Text_(v21Pick_(row,map,['版次'])),
      attachment:v21Text_(v21Pick_(row,map,['附件連結'])), sourceSheet:v21Text_(v21Pick_(row,map,['來源分頁']))||PMO_V21.SHEETS.DRAWINGS,
      sourceId:v21Text_(v21Pick_(row,map,['來源ID'])), updatedAt:v21Text_(v21Pick_(row,map,['更新時間']))
    };
  }).filter(function(item) { return item.id && item.projectId; });
}

function v21BuildCanonicalDrawingMap_(drawings) {
  var result = {};
  (drawings || []).forEach(function(drawing) {
    var projectId = drawing.projectId;
    if (!projectId) return;
    var candidate = { status:drawing.status, source:drawing.sourceSheet, title:drawing.title,
      date:drawing.submittedAt || drawing.updatedAt, updatedAt:drawing.updatedAt, attachment:drawing.attachment,
      confidence:drawing.review, priority:drawing.sourceSheet==='繪圖申請進度表'?3:(drawing.status==='完成'?2:(drawing.submittedAt?1:0)) };
    if (!result[projectId] || candidate.priority > result[projectId].priority || (candidate.priority === result[projectId].priority && candidate.date > result[projectId].date)) result[projectId] = candidate;
  });
  return result;
}

function v21LoadAnnouncements_() {
  var table = v21ReadSourceTable_(PMO_V21.SHEETS.LEGACY_ANNOUNCEMENTS);
  var map = v21HeaderMap_(table.headers);
  var today = v21Today_();
  return table.rows.map(function(row) {
    return { id:v21Text_(v21Pick_(row,map,['公告ID'])),category:v21Text_(v21Pick_(row,map,['分類'])),
      title:v21Text_(v21Pick_(row,map,['標題'])),content:v21Text_(v21Pick_(row,map,['內容'])),
      startDate:v21Date_(v21Pick_(row,map,['開始日'])),endDate:v21Date_(v21Pick_(row,map,['結束日'])),
      pinned:v21Text_(v21Pick_(row,map,['置頂']))==='是',status:v21Text_(v21Pick_(row,map,['狀態'])) };
  }).filter(function(item){
    return item.id && item.status === '啟用' && (!item.startDate || item.startDate <= today) && (!item.endDate || item.endDate >= today);
  }).sort(function(a,b){ return Number(b.pinned)-Number(a.pinned) || v21Text_(b.startDate).localeCompare(v21Text_(a.startDate)); }).slice(0,10);
}

function v21DrawingState_(project, works, reports, histories, canonicalDrawingMap) {
  if (canonicalDrawingMap && canonicalDrawingMap[project.id]) return canonicalDrawingMap[project.id];
  if (project.drawingStatus) return { status: project.drawingStatus, source: PMO_V21.SHEETS.PROJECTS, title: '', date: project.updatedAt, confidence: '明確欄位' };
  var candidates = [];
  (works || []).forEach(function(item) {
    if (item.projectId === project.id && V21_DRAWING_PATTERN.test([item.title, item.type, item.completion].join(' '))) {
      candidates.push({ text: [item.title, item.completion, item.status].join(' '), status: item.status, title: item.title, date: item.updatedAt || item.dueDate, source: item.sourceSheet });
    }
  });
  (reports || []).forEach(function(item) {
    if (item.projectId === project.id && V21_DRAWING_PATTERN.test([item.title, item.completed, item.followUp].join(' '))) {
      candidates.push({ text: [item.title, item.completed, item.followUp].join(' '), status: '', title: item.title, date: item.date, source: item.sourceSheet });
    }
  });
  (histories || []).forEach(function(item) {
    if (item.projectId === project.id && V21_DRAWING_PATTERN.test([item.title, item.content].join(' '))) {
      candidates.push({ text: [item.title, item.content, item.status].join(' '), status: item.status, title: item.title, date: item.occurredAt, source: item.sourceSheet });
    }
  });
  candidates.sort(function(a, b) { return v21Text_(b.date).localeCompare(v21Text_(a.date)); });
  if (!candidates.length) return { status: '待確認', source: '無圖面紀錄', title: '', date: '', confidence: '缺資料' };
  var latest = candidates[0];
  var text = latest.text;
  var status = '待確認';
  if (/(退件|補正|修正|缺失)/.test(text)) status = '修正中';
  else if (/(核准|通過|審核完成|審查完成)/.test(text)) status = '已核准';
  else if (/(送審|待審|審查中)/.test(text)) status = '送審中';
  else if (/(完成|已完成)/.test(text)) status = '圖面完成（審查未確認）';
  else if (latest.status === '目前處理' || latest.status === '事項' || latest.status === '進行中' || latest.status === '待追蹤') status = '圖面處理中';
  return { status: status, source: latest.source, title: latest.title, date: latest.date, confidence: '由最新紀錄推導' };
}
