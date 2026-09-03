/**
 * PSS AI-PMO V22.5.0 - 工作日曆與工作項目刪除/完成不追蹤
 * Calendar uses V21_工作事項 as the canonical source.
 */
function getWorkCalendarV224(payload) {
  return v21Safe_('WORK_CALENDAR', function() {
    payload = payload || {};
    var month = v21Text_(payload.month);
    if (!/^\d{4}-\d{2}$/.test(month)) month = Utilities.formatDate(new Date(), PMO_V21.TIME_ZONE, 'yyyy-MM');
    var parts = month.split('-').map(Number);
    var year = parts[0], mon = parts[1];
    if (mon < 1 || mon > 12) throw new Error('日曆月份格式錯誤。');

    var first = new Date(year, mon - 1, 1);
    var last = new Date(year, mon, 0);
    var firstDow = first.getDay(); // Sunday = 0
    var gridStart = new Date(year, mon - 1, 1 - firstDow);
    var gridEnd = new Date(year, mon - 1, 1 - firstDow + 41);

    function key(d) {
      return Utilities.formatDate(d, PMO_V21.TIME_ZONE, 'yyyy-MM-dd');
    }

    var startKey = key(gridStart), endKey = key(gridEnd);
    var works = v21LoadWork_().filter(function(w) {
      if (PMO_V21.ACTIVE_STATUSES.indexOf(w.status) < 0) return false;
      var date = v21Text_(w.dueDate) || v21Text_(w.startDate);
      return date && date >= startKey && date <= endKey;
    });

    var projects = v21LoadProjects_(), projectMap = {};
    projects.forEach(function(p) { projectMap[p.id] = p; });

    var attachmentRegistry = v21LoadAttachments_();
    works.forEach(function(w) {
      w.attachments = v21AttachmentsFromList_(attachmentRegistry, '工作事項', w.id, w.attachment);
      w.calendarDate = v21Text_(w.dueDate) || v21Text_(w.startDate);
      w.projectName = w.projectName || (projectMap[w.projectId] && projectMap[w.projectId].name) || w.projectId;
    });
    works.sort(function(a,b) {
      var d = v21Text_(a.calendarDate).localeCompare(v21Text_(b.calendarDate));
      return d || v21WorkSort_(a,b);
    });

    var days = [];
    for (var i = 0; i < 42; i += 1) {
      var d = new Date(gridStart.getTime());
      d.setDate(gridStart.getDate() + i);
      var k = key(d);
      days.push({
        date: k,
        day: Number(Utilities.formatDate(d, PMO_V21.TIME_ZONE, 'd')),
        inMonth: k.slice(0,7) === month,
        works: works.filter(function(w){ return w.calendarDate === k; })
      });
    }
    return {
      month: month,
      year: year,
      monthName: year + '年' + mon + '月',
      today: Utilities.formatDate(new Date(), PMO_V21.TIME_ZONE, 'yyyy-MM-dd'),
      days: days,
      activeCount: works.length
    };
  });
}

function deleteWorkItemV224(payload) {
  return v21Safe_('DELETE_WORK', function() {
    payload = payload || {};
    var id = v21Text_(payload.id);
    if (!id) throw new Error('缺少工作ID。');
    return v21WithLock_(function() {
      var works = v21LoadWork_();
      var work = works.filter(function(item) { return item.id === id; })[0];
      if (!work) throw new Error('工作事項不存在：' + id);
      if (work.status === '已刪除') return { id: id, deleted: true, soft: true };
      v21UpsertObject_(PMO_V21.SHEETS.DELETE_LOG, PMO_V21.HEADERS.DELETE_LOG, '紀錄ID', {
        '紀錄ID': v21Id_('DEL'),
        '工作ID': work.id,
        '專案ID': work.projectId,
        '專案名稱': work.projectName,
        '工作標題': work.title,
        '工作類型': work.type,
        '負責人': work.assignee,
        '狀態': work.status,
        '開始日': work.startDate,
        '預計完成日': work.dueDate,
        '完成內容': work.completion,
        '附件連結': work.attachment,
        '來源JSON': JSON.stringify(work).slice(0, 40000),
        '刪除人員': v21User_(),
        '刪除時間': v21Now_(),
        '刪除原因': v21Text_(payload.reason) || '使用者刪除',
        '已復原': '否'
      });
      v21PatchWorkStatus_(id, '已刪除', work.completion || '', work.attachment || '');
      v23LogTaskHistory_('DELETE_WORK', id, '', work.projectId, work.title);
      v21Audit_('DELETE_WORK', '工作事項', id, '成功', '軟刪除｜' + work.title);
      v21ClearCache_();
      return { id: id, deleted: true, soft: true };
    });
  });
}

function restoreWorkItemV23(payload) {
  return v21Safe_('RESTORE_WORK', function() {
    payload = payload || {};
    var id = v21Text_(payload.id);
    if (!id) throw new Error('缺少工作ID。');
    return v21WithLock_(function() {
      var work = v21LoadWork_().filter(function(item) { return item.id === id; })[0];
      if (!work) throw new Error('工作事項不存在：' + id);
      v21PatchWorkStatus_(id, '事項', work.completion || '', work.attachment || '');
      var logSheet = v21GetSheet_(PMO_V21.SHEETS.DELETE_LOG, false);
      if (logSheet && logSheet.getLastRow() > 1) {
        var values = logSheet.getDataRange().getValues();
        var map = v21HeaderMap_(values[0].map(v21Text_));
        for (var i = values.length - 1; i >= 1; i -= 1) {
          if (v21Text_(values[i][map['工作ID'][0]]) === id && v21Text_(values[i][map['已復原'][0]]) !== '是') {
            values[i][map['已復原'][0]] = '是';
            logSheet.getRange(i + 1, 1, 1, values[0].length).setValues([values[i]]);
            break;
          }
        }
      }
      v23LogTaskHistory_('RESTORE_WORK', id, '', work.projectId, work.title);
      v21ClearCache_();
      return { id: id, restored: true };
    });
  });
}
