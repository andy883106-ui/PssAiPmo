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
      var sheet = v21GetSheet_(PMO_V21.SHEETS.WORK, false);
      if (!sheet || sheet.getLastRow() <= 1) throw new Error('找不到工作事項資料表。');
      var values = sheet.getDataRange().getValues();
      var headers = values[0].map(v21Text_);
      var idIndex = headers.indexOf('工作ID');
      if (idIndex < 0) throw new Error('工作事項資料表缺少工作ID欄位。');
      var rowIndex = -1, oldRow = null;
      for (var i = 1; i < values.length; i += 1) {
        if (v21Text_(values[i][idIndex]) === id) { rowIndex = i + 1; oldRow = values[i]; break; }
      }
      if (rowIndex < 0) throw new Error('工作事項不存在：' + id);

      // Remove work-to-work / work-to-project relations in both directions.
      var relSheet = v21GetSheet_(PMO_V21.SHEETS.WORK_RELATIONS, false);
      if (relSheet && relSheet.getLastRow() > 1) {
        var relHeaders = relSheet.getRange(1,1,1,relSheet.getLastColumn()).getValues()[0].map(v21Text_);
        var workIdx = relHeaders.indexOf('工作ID'), relatedIdx = relHeaders.indexOf('關聯工作ID');
        var relRows = relSheet.getRange(2,1,relSheet.getLastRow()-1,relSheet.getLastColumn()).getValues();
        for (var r = relRows.length - 1; r >= 0; r -= 1) {
          if ((workIdx >= 0 && v21Text_(relRows[r][workIdx]) === id) ||
              (relatedIdx >= 0 && v21Text_(relRows[r][relatedIdx]) === id)) relSheet.deleteRow(r + 2);
        }
      }

      // Remove attachment registry rows for this work. Drive files are intentionally
      // preserved so deletion cannot accidentally destroy shared files.
      var attSheet = v21GetSheet_(PMO_V21.SHEETS.ATTACHMENTS, false);
      if (attSheet && attSheet.getLastRow() > 1) {
        var ah = attSheet.getRange(1,1,1,attSheet.getLastColumn()).getValues()[0].map(v21Text_);
        var at = ah.indexOf('資料類型'), ai = ah.indexOf('關聯ID');
        var ar = attSheet.getRange(2,1,attSheet.getLastRow()-1,attSheet.getLastColumn()).getValues();
        for (var a = ar.length - 1; a >= 0; a -= 1) {
          if (at >= 0 && ai >= 0 && v21Text_(ar[a][at]) === '工作事項' && v21Text_(ar[a][ai]) === id) attSheet.deleteRow(a + 2);
        }
      }

      sheet.deleteRow(rowIndex);
      v21Audit_('DELETE_WORK', '工作事項', id, '成功', v21Text_(oldRow[headers.indexOf('工作標題')]) + '｜附件索引移除，Drive檔案保留');
      v21ClearCache_();
      return { id: id, deleted: true };
    });
  });
}
