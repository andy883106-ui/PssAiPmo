/** Editable work items and streamlined reporting. Writes only to V21 sheets. */
function saveWorkItemV21(payload) {
  return v21Safe_('SAVE_WORK', function() {
    payload = payload || {};
    return v21WithLock_(function() {
      if (!v21HasCanonicalData_(PMO_V21.SHEETS.PROJECTS)) throw new Error('請先執行 V21 資料遷移，再新增或編輯工作事項。');
      var projectId = v21Text_(payload.projectId);
      var project = v21LoadProjects_().filter(function(item) { return item.id === projectId; })[0];
      if (!project) throw new Error('請先選擇有效專案。');
      var title = v21Text_(payload.title);
      if (!title) throw new Error('工作標題不得空白。');
      var id = v21Text_(payload.id) || v21Id_('WORK');
      var now = v21Now_();
      var attachment=v21PrimaryAttachmentUrl_(payload.attachments,payload.attachment);
      var status = v21NormalizeStatus_(payload.status || '事項');
      if (PMO_V21.WORK_STATUSES.indexOf(status) < 0) throw new Error('工作狀態僅能為事項、目前處理、無須追蹤或完成。');
      v21UpsertObject_(PMO_V21.SHEETS.WORK, PMO_V21.HEADERS.WORK, '工作ID', {
        '工作ID': id, '專案ID': project.id, '專案名稱': project.name, '工作標題': title,
        '工作類型': v21Text_(payload.type) || '一般工作', '負責人': v21Text_(payload.assignee),
        '協作人': v21Text_(payload.collaborator), '優先級': v21Text_(payload.priority) || '一般',
        '開始日': v21Date_(payload.startDate) || v21Today_(), '預計完成日': v21Date_(payload.dueDate),
        '狀態': status, '進度': status === '完成' ? 100 : v21Number_(payload.progress),
        '完成內容': v21Text_(payload.completion), '附件連結': attachment,
        '來源分頁': 'V21_WEB', '來源ID': id, '建立時間': v21Text_(payload.createdAt) || now, '更新時間': now
      });
      v21SaveAttachmentRecords_('工作事項',id,project.id,payload.attachments);
      v21SaveWorkRelations_(id, project.id, payload);
      v21Audit_('SAVE_WORK', '工作事項', id, '成功', project.id + ' ' + title);
      v21ClearCache_();
      return { id: id, status: status };
    });
  });
}

function completeWorkItemV21(payload) {
  payload = payload || {};
  payload.status = '完成';
  payload.progress = 100;
  if (!v21Text_(payload.completion)) return v21Fail_('完成任務前請填寫完成內容。', 'VALIDATION');
  return saveWorkItemV21(payload);
}

function completeWorkNoTrackV224(payload) {
  payload = payload || {};
  payload.status = '完成';
  payload.progress = 100;
  if (!v21Text_(payload.completion)) payload.completion = '工作項目已完成（不追蹤）。';
  return saveWorkItemV21(payload);
}

function saveReportV21(payload) {
  return v21Safe_('SAVE_REPORT', function() {
    payload = payload || {};
    return v21WithLock_(function() {
      if (!v21HasCanonicalData_(PMO_V21.SHEETS.PROJECTS)) throw new Error('請先執行 V21 資料遷移，再新增回報。');
      var projectId = v21Text_(payload.projectId);
      var project = v21LoadProjects_().filter(function(item) { return item.id === projectId; })[0];
      if (!project) throw new Error('請先選擇有效專案。');
      var title = v21Text_(payload.title);
      var completed = v21Text_(payload.completed);
      if (!title) throw new Error('事件標題不得空白。');
      if (!completed) throw new Error('完成／回報事項不得空白。');
      var id = v21Text_(payload.id) || (v21Text_(payload.requestId) ? 'REPORT-' + v21Hash_(payload.requestId) : v21Id_('REPORT'));
      var now = v21Now_();
      var attachment = v21PrimaryAttachmentUrl_(payload.attachments,payload.attachment);
      v21UpsertObject_(PMO_V21.SHEETS.REPORTS, PMO_V21.HEADERS.REPORTS, '回報ID', {
        '回報ID': id, '回報日期': v21Date_(payload.date) || v21Today_(), '人員': v21Text_(payload.employee) || v21User_(),
        '主管': v21Text_(payload.supervisor), '專案ID': project.id, '專案名稱': project.name,
        '事件標題': title, '完成回報': completed, '未完成問題': '',
        '後續事項': v21Text_(payload.followUp), '附件連結': attachment,
        '關聯工作ID': v21Text_(payload.relatedWorkId), '來源分頁': 'V21_WEB', '來源ID': id,
        '建立時間': v21Text_(payload.createdAt) || now, '更新時間': now
      });
      v21SaveAttachmentRecords_('工作回報',id,project.id,payload.attachments);
      if (payload.completeWork && v21Text_(payload.relatedWorkId)) {
        var related = v21LoadWork_().filter(function(item){ return item.id === v21Text_(payload.relatedWorkId); })[0];
        if (!related || related.projectId !== project.id) throw new Error('關聯工作不屬於所選專案。');
        v21PatchWorkStatus_(payload.relatedWorkId, '完成', completed, attachment);
      }
      var followUpId = '';
      if (v21Text_(payload.followUp) && payload.createFollowUp !== false) {
        followUpId = 'WORK-FU-' + v21Hash_(id);
        v21UpsertObject_(PMO_V21.SHEETS.WORK, PMO_V21.HEADERS.WORK, '工作ID', {
          '工作ID': followUpId, '專案ID': project.id, '專案名稱': project.name,
          '工作標題': v21Text_(payload.followUp), '工作類型': '後續追蹤',
          '負責人': v21Text_(payload.followUpAssignee) || v21Text_(payload.employee), '協作人': '',
          '優先級': v21Text_(payload.followUpPriority) || '一般', '開始日': v21Today_(),
          '預計完成日': v21Date_(payload.followUpDueDate), '狀態': '事項', '進度': 0,
          '完成內容': '', '附件連結': attachment, '來源分頁': PMO_V21.SHEETS.REPORTS,
          '來源ID': id, '建立時間': now, '更新時間': now
        });
      }
      v21Audit_('SAVE_REPORT', '回報紀錄', id, '成功', project.id + ' ' + title);
      v21ClearCache_();
      return { id: id, followUpWorkId: followUpId };
    });
  });
}

function v21PatchWorkStatus_(id, status, completion, attachment) {
  var sheet = v21EnsureSheet_(PMO_V21.SHEETS.WORK, PMO_V21.HEADERS.WORK);
  var values = sheet.getDataRange().getValues();
  var map = v21HeaderMap_(values[0]);
  var idCol = map['工作ID'][0];
  var rowIndex = -1;
  for (var i = 1; i < values.length; i += 1) if (v21Text_(values[i][idCol]) === id) { rowIndex = i; break; }
  if (rowIndex < 0) throw new Error('V21 工作事項不存在，請先完成資料遷移：' + id);
  values[rowIndex][map['狀態'][0]] = status;
  values[rowIndex][map['進度'][0]] = status === '完成' ? 100 : values[rowIndex][map['進度'][0]];
  values[rowIndex][map['完成內容'][0]] = completion;
  if (attachment) values[rowIndex][map['附件連結'][0]] = attachment;
  values[rowIndex][map['更新時間'][0]] = v21Now_();
  sheet.getRange(rowIndex + 1, 1, 1, values[0].length).setValues([values[rowIndex]]);
}

function uploadAttachmentV21(payload) {
  return v21Safe_('UPLOAD_ATTACHMENT', function() {
    payload = payload || {};
    var dataUrl = v21Text_(payload.dataUrl);
    var match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) throw new Error('附件格式不正確。');
    var bytes = Utilities.base64Decode(match[2]);
    if (bytes.length > PMO_V21.MAX_UPLOAD_BYTES) throw new Error('單一附件不可超過 10 MB。');
    var project = v21LoadProjects_().filter(function(item) { return item.id === v21Text_(payload.projectId); })[0];
    if (!project || !project.folderUrl) throw new Error('此專案尚未設定雲端資料夾，請先補齊路徑。');
    var folderId = v21ExtractDriveId_(project.folderUrl);
    if (!folderId) throw new Error('雲端資料夾連結格式不正確。');
    var filename = v21Text_(payload.filename).replace(/[\\/:*?"<>|]/g, '_') || ('附件_' + new Date().getTime());
    var file = DriveApp.getFolderById(folderId).createFile(Utilities.newBlob(bytes, match[1], filename));
    v21Audit_('UPLOAD_ATTACHMENT', '附件', file.getId(), '成功', project.id + ' ' + filename);
    return { url:file.getUrl(), name:file.getName(), originalName:v21Text_(payload.filename)||file.getName(), id:file.getId(), mimeType:file.getMimeType() };
  });
}

function v21ExtractDriveId_(url) {
  var match = v21Text_(url).match(/[-\w]{20,}/);
  return match ? match[0] : '';
}

function v21UpsertObject_(sheetName, headers, keyHeader, object) {
  var sheet = v21EnsureSheet_(sheetName, headers);
  var keyIndex = headers.indexOf(keyHeader);
  if (keyIndex < 0) throw new Error('找不到主鍵欄位：' + keyHeader);
  var key = v21Text_(object[keyHeader]);
  if (!key) throw new Error(keyHeader + ' 不得空白。');
  var lastRow = sheet.getLastRow();
  var targetRow = lastRow + 1;
  if (lastRow > 1) {
    var keys = sheet.getRange(2, keyIndex + 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < keys.length; i += 1) if (v21Text_(keys[i][0]) === key) { targetRow = i + 2; break; }
  }
  var current = targetRow <= lastRow ? sheet.getRange(targetRow, 1, 1, headers.length).getValues()[0] : headers.map(function() { return ''; });
  headers.forEach(function(header, index) { if (object[header] !== undefined) current[index] = object[header]; });
  sheet.getRange(targetRow, 1, 1, headers.length).setValues([current]);
}
