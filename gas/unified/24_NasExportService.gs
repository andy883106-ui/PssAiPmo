/** Manual NAS pack: CSV + manifest in Drive. Copy to company NAS when on intranet. */
function exportNasPackV23(payload) {
  return v21Safe_('NAS_EXPORT', function() {
    payload = payload || {};
    var stamp = Utilities.formatDate(new Date(), PMO_V21.TIME_ZONE, 'yyyy-MM-dd_HHmm');
    var day = v21Today_();
    var root = v21ProjectRoot_();
    var exportRoot = v23EnsureChildFolder_(root, PMO_V21.NAS_EXPORT_FOLDER_NAME);
    var packParent = v23EnsureChildFolder_(exportRoot, PMO_V21.NAS_EXPORT_PACK_NAME);
    var pack = v23EnsureChildFolder_(packParent, day + '_' + stamp);
    var sheets = [
      PMO_V21.SHEETS.PROJECTS, PMO_V21.SHEETS.WORK, PMO_V21.SHEETS.REPORTS,
      PMO_V21.SHEETS.HISTORY, PMO_V21.SHEETS.DRAWINGS, PMO_V21.SHEETS.ATTACHMENTS,
      PMO_V21.SHEETS.PROJECT_RELATIONS, PMO_V21.SHEETS.WORK_RELATIONS,
      PMO_V21.SHEETS.TRAINING, PMO_V21.SHEETS.MEETING_RECORDS, PMO_V21.SHEETS.MEETING_SNAPSHOT,
      PMO_V21.SHEETS.TASK_HISTORY, PMO_V21.SHEETS.DELETE_LOG, PMO_V21.SHEETS.PROJECT_REPORT
    ];
    var files = [];
    sheets.forEach(function(name) {
      var table = v21ReadTable_(name);
      if (!table.headers.length) return;
      var csv = v23ToCsv_(table.headers, table.rows);
      var file = pack.createFile(name + '.csv', csv, MimeType.CSV);
      files.push({ name: file.getName(), url: file.getUrl(), rows: table.rows.length });
    });
    var readme = [
      'PSS AI-PMO V' + PMO_V21.VERSION + ' NAS 待同步包',
      '匯出時間：' + v21Now_(),
      '執行者：' + v21User_(),
      '來源試算表：https://docs.google.com/spreadsheets/d/' + PMO_V21.SOURCE_DATABASE_ID,
      '目標試算表：https://docs.google.com/spreadsheets/d/' + v21Db_().getId(),
      '部門專案管理：https://docs.google.com/spreadsheets/d/' + PMO_V21.PROGRESS_DATABASE_ID,
      '雲端根目錄：https://drive.google.com/drive/folders/' + PMO_V21.DEFAULT_PROJECT_ROOT_FOLDER_ID,
      '教育訓練：https://drive.google.com/drive/folders/' + PMO_V21.TRAINING_FOLDER_ID,
      'Lark 對照（外部，非寫入）：' + PMO_V21.LARK_BASE_URL,
      '',
      '同步方式（公司網路）：',
      '1. 用 Google Drive 桌面版或瀏覽器下載本資料夾。',
      '2. 以 rclone / FreeFileSync 單向複製到 NAS，例如 \\\\NAS\\部門\\PSS_AI_PMO\\' + day + '\\',
      '3. 不要把 NAS 當主編輯來源，避免雙寫。',
      '',
      '本包檔案：'
    ].concat(files.map(function(file) { return '- ' + file.name + '（' + file.rows + ' 列）'; })).join('\n');
    pack.createFile('README_同步說明.txt', readme, MimeType.PLAIN_TEXT);
    var manifest = {
      version: PMO_V21.VERSION,
      exportedAt: v21Now_(),
      user: v21User_(),
      files: files,
      sourceDatabaseId: PMO_V21.SOURCE_DATABASE_ID,
      targetDatabaseId: v21Db_().getId(),
      progressDatabaseId: PMO_V21.PROGRESS_DATABASE_ID
    };
    pack.createFile('manifest.json', JSON.stringify(manifest, null, 2), MimeType.PLAIN_TEXT);
    if (payload.includeProgressSnapshot !== false) {
      try { v23WriteProgressSnapshot_(); } catch (ignored) {}
    }
    var folderUrl = pack.getUrl();
    v21AppendObject_(PMO_V21.SHEETS.NAS_EXPORT, PMO_V21.HEADERS.NAS_EXPORT, {
      '匯出ID': v21Id_('NAS'),
      '匯出時間': v21Now_(),
      '執行者': v21User_(),
      '資料夾連結': folderUrl,
      '檔案數': files.length,
      '摘要': files.map(function(file) { return file.name; }).join(', ').slice(0, 800)
    });
    v21Audit_('NAS_EXPORT', 'NAS匯出', pack.getId(), '成功', folderUrl);
    return { folderUrl: folderUrl, folderId: pack.getId(), fileCount: files.length, files: files, readme: 'README_同步說明.txt' };
  });
}

function v23WriteProgressSnapshot_() {
  var db = SpreadsheetApp.openById(PMO_V21.PROGRESS_DATABASE_ID);
  var name = 'V23_PMO彙總';
  var sheet = db.getSheetByName(name) || db.insertSheet(name);
  var projects = v21LoadProjects_().filter(function(item) { return item.status !== '封存'; });
  var works = v21LoadWork_().filter(function(item) { return PMO_V21.ACTIVE_STATUSES.indexOf(item.status) >= 0; });
  var headers = ['更新時間', '專案ID', '專案名稱', '狀態', '負責人', '進行中工作', '待追蹤', '雲端資料夾'];
  var rows = projects.map(function(project) {
    var active = works.filter(function(item) { return item.projectId === project.id; });
    return [v21Now_(), project.id, project.name, project.status, project.owner,
      active.filter(function(item) { return item.status === '目前處理'; }).length,
      active.filter(function(item) { return item.status === '事項'; }).length,
      project.folderUrl];
  });
  sheet.clear();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
  if (rows.length) sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  sheet.setFrozenRows(1);
}

function v23EnsureChildFolder_(parent, name) {
  var folders = parent.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : parent.createFolder(name);
}

function v23ToCsv_(headers, rows) {
  function cell(value) {
    var text = v21Text_(value).replace(/"/g, '""');
    if (/[",\n]/.test(text)) return '"' + text + '"';
    return text;
  }
  var lines = [headers.map(cell).join(',')];
  rows.forEach(function(row) {
    lines.push(headers.map(function(_header, index) { return cell(row[index]); }).join(','));
  });
  return lines.join('\n');
}
