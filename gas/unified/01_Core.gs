/** Core utilities. No function from V17-V20 is loaded by V21. */
function v21Db_() {
  var targetId = PropertiesService.getScriptProperties().getProperty(PMO_V21.TARGET_DATABASE_PROPERTY) || PMO_V21.SOURCE_DATABASE_ID;
  return SpreadsheetApp.openById(targetId);
}

function v21SourceDb_() {
  return SpreadsheetApp.openById(PMO_V21.SOURCE_DATABASE_ID);
}

function v21Now_() {
  return Utilities.formatDate(new Date(), PMO_V21.TIME_ZONE, 'yyyy-MM-dd HH:mm:ss');
}

function v21Today_() {
  return Utilities.formatDate(new Date(), PMO_V21.TIME_ZONE, 'yyyy-MM-dd');
}

function v21Text_(value) {
  if (value === null || value === undefined) return '';
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, PMO_V21.TIME_ZONE, 'yyyy-MM-dd HH:mm:ss');
  }
  return String(value).trim();
}

function v21Date_(value) {
  if (!value) return '';
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, PMO_V21.TIME_ZONE, 'yyyy-MM-dd');
  }
  var text = v21Text_(value).replace(/[年月]/g, '-').replace(/日/g, '').replace(/\//g, '-');
  var match = text.match(/(20\d{2})-(\d{1,2})-(\d{1,2})/);
  if (!match) return text;
  return match[1] + '-' + ('0' + match[2]).slice(-2) + '-' + ('0' + match[3]).slice(-2);
}

function v21Number_(value) {
  var number = Number(v21Text_(value).replace(/[%,$，NT＄元\s]/gi, ''));
  return isFinite(number) ? number : 0;
}

function v21Id_(prefix) {
  return prefix + '-' + Utilities.formatDate(new Date(), PMO_V21.TIME_ZONE, 'yyyyMMdd-HHmmss') + '-' + Utilities.getUuid().slice(0, 8);
}

function v21Hash_(text) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, v21Text_(text), Utilities.Charset.UTF_8);
  return bytes.map(function(b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join('').slice(0, 24);
}

function v21NormalizeStatus_(status) {
  var raw = v21Text_(status);
  return V21_STATUS_MAP[raw] || raw || '事項';
}

function v21User_() {
  return Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail() || 'unknown';
}

function v21Result_(data, message) {
  return { ok: true, version: PMO_V21.VERSION, message: message || '', data: data === undefined ? null : data };
}

function v21Fail_(message, code) {
  return { ok: false, version: PMO_V21.VERSION, code: code || 'V21_ERROR', message: message || '操作失敗' };
}

function v21Safe_(action, fn) {
  try {
    return v21Result_(fn());
  } catch (error) {
    v21Audit_(action, 'ERROR', '', '失敗', error && error.stack ? error.stack : error);
    return v21Fail_(error && error.message ? error.message : String(error));
  }
}

function v21WithLock_(fn) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw new Error('系統忙碌中，請稍後再試。');
  try {
    var result = fn();
    SpreadsheetApp.flush();
    return result;
  } finally {
    lock.releaseLock();
  }
}

function v21GetSheet_(name, required) {
  var sheet = v21Db_().getSheetByName(name);
  if (!sheet && required !== false) throw new Error('找不到分頁：' + name);
  return sheet;
}

function v21ReadTable_(sheetName, database) {
  var sheet = (database || v21Db_()).getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 1 || sheet.getLastColumn() < 1) return { headers: [], rows: [], sheet: sheet };
  var values = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues();
  return { headers: values[0].map(v21Text_), rows: values.slice(1), sheet: sheet };
}

function v21ReadSourceTable_(sheetName) {
  return v21ReadTable_(sheetName, v21SourceDb_());
}

function v21HeaderMap_(headers) {
  var map = {};
  (headers || []).forEach(function(header, index) {
    var key = v21Text_(header);
    if (!map[key]) map[key] = [];
    map[key].push(index);
  });
  return map;
}

function v21Pick_(row, headerMap, aliases, fallback) {
  for (var a = 0; a < aliases.length; a += 1) {
    var indexes = headerMap[aliases[a]] || [];
    for (var i = indexes.length - 1; i >= 0; i -= 1) {
      var value = row[indexes[i]];
      if (value !== '' && value !== null && value !== undefined) return value;
    }
  }
  return fallback === undefined ? '' : fallback;
}

function v21HasCanonicalData_(sheetName) {
  var sheet = v21GetSheet_(sheetName, false);
  return !!(sheet && sheet.getLastRow() > 1);
}

function v21EnsureSheet_(name, headers) {
  var db = v21Db_();
  var sheet = db.getSheetByName(name) || db.insertSheet(name);
  if (sheet.getLastRow() === 0) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  var existing = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), headers.length)).getValues()[0].map(v21Text_);
  if (headers.some(function(h, i) { return existing[i] !== h; })) {
    if (sheet.getLastRow() > 1) throw new Error(name + ' 欄位與 V21 規格不同，已停止，避免覆寫。');
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#16324f').setFontColor('#ffffff');
  return sheet;
}

function v21AppendObject_(sheetName, headers, object) {
  var sheet = v21EnsureSheet_(sheetName, headers);
  sheet.appendRow(headers.map(function(header) { return object[header] === undefined ? '' : object[header]; }));
}

function v21Audit_(action, type, id, result, summary) {
  try {
    var auditDb = v21Db_();
    if (auditDb.getId() === PMO_V21.SOURCE_DATABASE_ID && !auditDb.getSheetByName(PMO_V21.SHEETS.AUDIT)) return;
    v21AppendObject_(PMO_V21.SHEETS.AUDIT, PMO_V21.HEADERS.AUDIT, {
      '時間': v21Now_(), '使用者': v21User_(), '動作': action, '資料類型': type,
      '資料ID': id || '', '結果': result || '', '摘要': v21Text_(summary).slice(0, 1000)
    });
  } catch (ignored) {}
}

function v21ClearCache_() {
  CacheService.getScriptCache().removeAll(['v21:bootstrap', 'v21:projects']);
}

function v21Include_(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
