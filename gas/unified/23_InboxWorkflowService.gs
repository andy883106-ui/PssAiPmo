/** V23: R5.2 inbox + related dispatch + duplicate check + task history. */
function getMyWorkInboxV23(payload) {
  return v21Safe_('INBOX', function() {
    payload = payload || {};
    var today = v21Today_();
    var weekAhead = v23AddDays_(today, 7);
    var identity = v23CurrentIdentity_();
    var names = identity.names;
    var works = v21LoadWork_().filter(function(item) {
      return PMO_V21.ACTIVE_STATUSES.indexOf(item.status) >= 0 && v23IsMine_(item, names);
    });
    var reports = v21LoadReports_();
    var groups = {
      overdue: [],
      needsReportToday: [],
      dueSoon: [],
      todayAssigned: [],
      followUp: [],
      inProgress: []
    };
    works.forEach(function(item) {
      var due = v21Text_(item.dueDate);
      var created = v21Date_(item.createdAt) || v21Text_(item.startDate);
      var isFollow = item.type === '後續追蹤' || item.type === '階段追蹤' || item.status === '事項';
      item.recentReports = reports.filter(function(report) {
        return v21Text_(report.relatedWorkId) === item.id;
      }).sort(function(a, b) {
        return v21Text_(b.date).localeCompare(v21Text_(a.date));
      }).slice(0, 3);
      var reportedToday = item.recentReports.some(function(report) {
        return v21Text_(report.date) === today;
      });
      item.reportedToday = reportedToday;
      if (due && due < today) groups.overdue.push(item);
      else if (!reportedToday && item.status === '目前處理') groups.needsReportToday.push(item);
      else if (due && due <= weekAhead) groups.dueSoon.push(item);
      else if (created === today) groups.todayAssigned.push(item);
      else if (isFollow) groups.followUp.push(item);
      else groups.inProgress.push(item);
    });
    function sortDue(a, b) {
      return (a.dueDate || '9999-12-31').localeCompare(b.dueDate || '9999-12-31');
    }
    Object.keys(groups).forEach(function(key) { groups[key].sort(sortDue); });
    var processing = works.filter(function(item) { return item.status === '目前處理'; }).sort(sortDue).slice(0, 3);
    return {
      user: identity.email,
      names: names,
      today: today,
      identityMatched: names.length > 1,
      dailyBrief: {
        overdue: groups.overdue.length,
        needsReportToday: groups.needsReportToday.length,
        dueSoon: groups.dueSoon.length,
        processingTop: processing.map(function(item) {
          return { id: item.id, title: item.title, projectName: item.projectName, dueDate: item.dueDate, status: item.status };
        })
      },
      counts: {
        overdue: groups.overdue.length,
        needsReportToday: groups.needsReportToday.length,
        dueSoon: groups.dueSoon.length,
        todayAssigned: groups.todayAssigned.length,
        followUp: groups.followUp.length,
        inProgress: groups.inProgress.length,
        total: works.length
      },
      groups: groups
    };
  });
}

function createRelatedTaskV23(payload) {
  return v21Safe_('RELATED_TASK', function() {
    payload = payload || {};
    var sourceId = v21Text_(payload.sourceWorkId);
    var source = v21LoadWork_().filter(function(item) { return item.id === sourceId; })[0];
    if (!source) throw new Error('找不到來源工作，無法建立關聯任務。');
    var title = v21Text_(payload.title);
    if (!title) throw new Error('關聯任務標題不得空白。');
    var assignee = v21Text_(payload.assignee) || source.assignee;
    var identity = v23CurrentIdentity_();
    if (!v23IsSupervisor_(identity) && namesNotSelf_(assignee, identity.names)) {
      throw new Error('一般人員只能把關聯任務指派給自己。');
    }
    payload.projectId = v21Text_(payload.projectId) || source.projectId;
    payload.relatedWorkId = sourceId;
    payload.relatedProjectId = source.projectId;
    payload.relationType = v21Text_(payload.relationType) || '後續工作';
    payload.relationNote = v21Text_(payload.relationNote) || ('由 ' + source.title + ' 建立');
    payload.status = payload.status || '事項';
    var saved = saveWorkItemV21(payload);
    if (!saved.ok) throw new Error(saved.message);
    v23LogTaskHistory_('RELATED_TASK', saved.data.id, '', payload.projectId, '來源工作 ' + sourceId + ' → ' + title);
    return { id: saved.data.id, sourceWorkId: sourceId };
  });
}

function findTaskDuplicatesV23(payload) {
  return v21Safe_('DUPLICATE_WORK', function() {
    payload = payload || {};
    var queryId = v21Text_(payload.workId);
    var works = v21LoadWork_().filter(function(item) { return item.status !== '已刪除'; });
    var groups = {};
    works.forEach(function(item) {
      var key = [item.projectId, item.projectName, v23NormalizeTitle_(item.title), item.assignee].join('|').toLowerCase();
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    var duplicates = Object.keys(groups).map(function(key) {
      return groups[key];
    }).filter(function(list) { return list.length > 1; });
    if (queryId) {
      duplicates = duplicates.filter(function(list) {
        return list.some(function(item) { return item.id === queryId; });
      });
    }
    return { groups: duplicates.slice(0, 50), totalGroups: duplicates.length };
  });
}

function saveProjectReportSettingV23(payload) {
  return v21Safe_('PROJECT_REPORT_SETTING', function() {
    payload = payload || {};
    var projectId = v21Text_(payload.projectId);
    if (!projectId) throw new Error('缺少專案ID。');
    var project = v21LoadProjects_().filter(function(item) { return item.id === projectId; })[0];
    if (!project) throw new Error('找不到專案：' + projectId);
    v21WithLock_(function() {
      v21UpsertObject_(PMO_V21.SHEETS.PROJECT_REPORT, PMO_V21.HEADERS.PROJECT_REPORT, '專案ID', {
        '專案ID': projectId,
        '顯示於報告': payload.visible === false || payload.visible === '否' ? '否' : '是',
        '回報狀況': v21Text_(payload.status) || '待回報',
        '摘要': v21Text_(payload.summary),
        '下次追蹤日': v21Date_(payload.nextFollowDate),
        '更新者': v21User_(),
        '更新時間': v21Now_()
      });
    });
    return { projectId: projectId };
  });
}

function v23LogTaskHistory_(action, workId, reportId, projectId, summary) {
  try {
    v21AppendObject_(PMO_V21.SHEETS.TASK_HISTORY, PMO_V21.HEADERS.TASK_HISTORY, {
      '歷程ID': v21Id_('HIST'),
      '時間': v21Now_(),
      '使用者': v21User_(),
      '動作': action,
      '工作ID': workId || '',
      '回報ID': reportId || '',
      '專案ID': projectId || '',
      '摘要': v21Text_(summary).slice(0, 800)
    });
  } catch (ignored) {}
}

function v23CurrentIdentity_() {
  var email = v21User_();
  var local = email.indexOf('@') >= 0 ? email.split('@')[0] : email;
  var names = [email, local];
  var table = v21ReadSourceTable_(PMO_V21.SHEETS.LEGACY_PEOPLE);
  var map = v21HeaderMap_(table.headers);
  table.rows.forEach(function(row) {
    var name = v21Text_(v21Pick_(row, map, ['姓名', '人員']));
    var account = v21Text_(v21Pick_(row, map, ['Email', 'email', '帳號', 'Google帳號', '郵件', '信箱']));
    if (name && (account === email || account.toLowerCase() === email.toLowerCase() || account === local)) {
      names.push(name);
    }
  });
  return { email: email, names: uniqueTexts_(names) };
}

function v23IsMine_(work, names) {
  var blob = [work.assignee, work.collaborator].join(' ');
  return names.some(function(name) { return name && blob.indexOf(name) >= 0; });
}

function v23IsSupervisor_(identity) {
  var table = v21ReadSourceTable_(PMO_V21.SHEETS.LEGACY_PEOPLE);
  var map = v21HeaderMap_(table.headers);
  return table.rows.some(function(row) {
    var name = v21Text_(v21Pick_(row, map, ['姓名', '人員']));
    var role = v21Text_(v21Pick_(row, map, ['角色', '職稱', '職級']));
    return identity.names.indexOf(name) >= 0 && /主管|經理|組長|主任/.test(role);
  });
}

function namesNotSelf_(assignee, names) {
  assignee = v21Text_(assignee);
  if (!assignee) return false;
  return names.indexOf(assignee) < 0;
}

function uniqueTexts_(list) {
  var seen = {}, out = [];
  (list || []).forEach(function(item) {
    item = v21Text_(item);
    if (!item || seen[item]) return;
    seen[item] = true;
    out.push(item);
  });
  return out;
}

function v23NormalizeTitle_(title) {
  return v21Text_(title).replace(/\s+/g, '');
}

function v23AddDays_(isoDate, days) {
  var parts = String(isoDate || '').split('-').map(Number);
  var date = new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1);
  date.setDate(date.getDate() + days);
  return Utilities.formatDate(date, PMO_V21.TIME_ZONE, 'yyyy-MM-dd');
}
