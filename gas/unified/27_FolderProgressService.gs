/**
 * V23.1: infer project progress from standard Drive subfolders + work/reports.
 * Does not overwrite 專案狀態. Suggests next tracking work only.
 */
function getFolderProgressV23(payload) {
  return v21Safe_('FOLDER_PROGRESS', function() {
    payload = payload || {};
    var id = v21Text_(payload.projectId);
    if (!id) throw new Error('缺少專案ID。');
    var project = v21LoadProjects_().filter(function(item) { return item.id === id; })[0];
    if (!project) throw new Error('找不到專案：' + id);
    var works = v21LoadWork_().filter(function(item) { return item.projectId === id && item.status !== '已刪除'; });
    var reports = v21LoadReports_().filter(function(item) { return item.projectId === id; });
    var scan = v23ScanProjectFolderSafe_(project);
    var board = v23BuildProjectProgress_(project, works, reports, scan);
    v23SaveProgressCache_(board);
    return board;
  });
}

function getProgressBoardV23(payload) {
  return v21Safe_('PROGRESS_BOARD', function() {
    payload = payload || {};
    var query = v21Text_(payload.query).toLowerCase();
    var projects = v21LoadProjects_().filter(function(item) { return item.status !== '封存' && item.status !== '取消'; });
    var works = v21LoadWork_().filter(function(item) { return item.status !== '已刪除'; });
    var reports = v21LoadReports_();
    var cache = v23LoadProgressCache_();
    var workByProject = {}, reportByProject = {};
    works.forEach(function(item) {
      if (!workByProject[item.projectId]) workByProject[item.projectId] = [];
      workByProject[item.projectId].push(item);
    });
    reports.forEach(function(item) {
      if (!reportByProject[item.projectId]) reportByProject[item.projectId] = [];
      reportByProject[item.projectId].push(item);
    });
    var cards = projects.map(function(project) {
      var scan = cache[project.id] ? { fromCache: true, scannedAt: cache[project.id].scannedAt, stages: cache[project.id].folderStages } : { fromCache: false, scannedAt: '', stages: {} };
      return v23BuildProjectProgress_(project, workByProject[project.id] || [], reportByProject[project.id] || [], scan);
    }).filter(function(card) {
      if (!query) return true;
      return [card.projectId, card.projectName, card.owner, card.currentStageLabel, card.nextAction].join(' ').toLowerCase().indexOf(query) >= 0;
    }).sort(v23ProgressBoardSort_);
    var groups = {};
    V23_PROGRESS_STAGES.forEach(function(stage) { groups[stage.id] = []; });
    groups.done = [];
    groups.nofolder = [];
    cards.forEach(function(card) {
      if (!card.hasFolder) groups.nofolder.push(card);
      else if (card.complete) groups.done.push(card);
      else groups[card.bottleneckId || 'tracking'].push(card);
    });
    return {
      generatedAt: v21Now_(),
      total: cards.length,
      missingFolder: groups.nofolder.length,
      complete: groups.done.length,
      cards: cards.slice(0, 250),
      groups: groups,
      stages: V23_PROGRESS_STAGES.map(function(stage) {
        return { id: stage.id, label: stage.label, count: (groups[stage.id] || []).length };
      })
    };
  });
}

function ensureStageTrackingWorkV23(payload) {
  return v21Safe_('ENSURE_STAGE_WORK', function() {
    payload = payload || {};
    var projectId = v21Text_(payload.projectId);
    var stageId = v21Text_(payload.stageId);
    var stage = v23StageById_(stageId);
    if (!projectId || !stage) throw new Error('請指定專案與階段。');
    var project = v21LoadProjects_().filter(function(item) { return item.id === projectId; })[0];
    if (!project) throw new Error('找不到專案：' + projectId);
    var existing = v21LoadWork_().filter(function(item) {
      return item.projectId === projectId && PMO_V21.ACTIVE_STATUSES.indexOf(item.status) >= 0 && v23WorkMatchesStage_(item, stage);
    })[0];
    if (existing) return { created: false, id: existing.id, title: existing.title };
    var title = v21Text_(payload.title) || stage.suggestTitle;
    var saved = saveWorkItemV21({
      projectId: projectId,
      title: title,
      type: '階段追蹤',
      assignee: v21Text_(payload.assignee) || project.owner,
      status: '事項',
      priority: '一般',
      dueDate: v21Date_(payload.dueDate) || v23AddDays_(v21Today_(), 7)
    });
    if (!saved.ok) throw new Error(saved.message);
    v23LogTaskHistory_('STAGE_TRACK', saved.data.id, '', projectId, stage.label + '｜' + title);
    return { created: true, id: saved.data.id, title: title, stageId: stageId };
  });
}

function refreshFolderProgressV23(payload) {
  return getFolderProgressV23(payload);
}

function v23BuildProjectProgress_(project, works, reports, scan) {
  scan = scan || { stages: {}, fromCache: false, scannedAt: '' };
  var today = v21Today_();
  var stages = V23_PROGRESS_STAGES.map(function(stage) {
    var folder = (scan.stages || {})[stage.id] || {};
    var relatedWork = (works || []).filter(function(item) { return v23WorkMatchesStage_(item, stage); });
    var active = relatedWork.filter(function(item) { return PMO_V21.ACTIVE_STATUSES.indexOf(item.status) >= 0; });
    var done = relatedWork.filter(function(item) { return item.status === '完成'; });
    var relatedReports = (reports || []).filter(function(item) { return v23TextMatchesHints_([item.title, item.completed, item.followUp].join(' '), stage.workHints); });
    var fileCount = v21Number_(folder.fileCount);
    var evidenced = fileCount > 0 || done.length > 0 || relatedReports.length > 0;
    var state = 'empty';
    if (fileCount > 0 && (done.length > 0 || relatedReports.length > 0)) state = 'evidenced';
    else if (fileCount > 0 || done.length > 0) state = 'partial';
    else if (active.length > 0) state = 'in_progress';
    return {
      id: stage.id,
      label: stage.label,
      folder: stage.folder,
      weight: stage.weight,
      fileCount: fileCount,
      folderExists: !!folder.exists,
      latestFile: folder.latestName || '',
      latestAt: folder.latestAt || '',
      folderUrl: folder.url || '',
      activeCount: active.length,
      doneCount: done.length,
      reportCount: relatedReports.length,
      state: state,
      evidenced: evidenced,
      suggestTitle: stage.suggestTitle,
      works: active.concat(done).slice(0, 6)
    };
  });
  var earned = 0, possible = 0;
  stages.forEach(function(stage) {
    possible += stage.weight;
    if (stage.state === 'evidenced') earned += stage.weight;
    else if (stage.state === 'partial') earned += stage.weight * 0.6;
    else if (stage.state === 'in_progress') earned += stage.weight * 0.3;
  });
  var score = possible ? Math.round(earned / possible * 100) : 0;
  var bottleneck = stages.filter(function(stage) { return stage.state === 'empty' || stage.state === 'in_progress'; })[0] || null;
  var nextAction = '';
  if (!project.folderUrl) nextAction = '尚未綁定雲端資料夾，請先補齊專案資料夾連結。';
  else if (bottleneck) nextAction = bottleneck.suggestTitle;
  else nextAction = '各階段已有證據，可檢視請款／結案。';
  var overdue = (works || []).filter(function(item) {
    return PMO_V21.ACTIVE_STATUSES.indexOf(item.status) >= 0 && item.dueDate && item.dueDate < today;
  });
  var dueSoon = (works || []).filter(function(item) {
    return PMO_V21.ACTIVE_STATUSES.indexOf(item.status) >= 0 && item.dueDate && item.dueDate >= today && item.dueDate <= v23AddDays_(today, 7);
  });
  var active = (works || []).filter(function(item) { return PMO_V21.ACTIVE_STATUSES.indexOf(item.status) >= 0; });
  return {
    projectId: project.id,
    projectName: project.name,
    owner: project.owner,
    status: project.status,
    recordedProgress: v21Number_(project.progress),
    folderUrl: project.folderUrl || '',
    hasFolder: !!project.folderUrl,
    drawingStatus: project.drawingStatus || '',
    score: score,
    complete: score >= 90 && overdue.length === 0,
    bottleneckId: bottleneck ? bottleneck.id : '',
    currentStageLabel: bottleneck ? bottleneck.label : '可結案檢視',
    nextAction: nextAction,
    stages: stages,
    activeWorkCount: active.length,
    overdueCount: overdue.length,
    dueSoonCount: dueSoon.length,
    fromCache: !!scan.fromCache,
    scannedAt: scan.scannedAt || ''
  };
}

function v23ScanProjectFolderSafe_(project) {
  if (!project.folderUrl) return { fromCache: false, scannedAt: v21Now_(), stages: {}, reason: 'no_folder' };
  var folderId = v21ExtractDriveId_(project.folderUrl);
  if (!folderId) return { fromCache: false, scannedAt: v21Now_(), stages: {}, reason: 'bad_url' };
  try {
    var root = DriveApp.getFolderById(folderId);
    var byName = {};
    var folders = root.getFolders();
    while (folders.hasNext()) {
      var child = folders.next();
      byName[child.getName()] = child;
    }
    var stages = {};
    V23_PROGRESS_STAGES.forEach(function(stage) {
      var folder = v23MatchStageFolder_(byName, stage);
      if (!folder) {
        stages[stage.id] = { exists: false, fileCount: 0, latestName: '', latestAt: '', url: '' };
        return;
      }
      var info = v23CountFolderFiles_(folder, 80);
      stages[stage.id] = {
        exists: true,
        fileCount: info.count,
        latestName: info.latestName,
        latestAt: info.latestAt,
        url: folder.getUrl()
      };
    });
    return { fromCache: false, scannedAt: v21Now_(), stages: stages };
  } catch (error) {
    return { fromCache: false, scannedAt: v21Now_(), stages: {}, reason: error.message };
  }
}

function v23MatchStageFolder_(byName, stage) {
  if (byName[stage.folder]) return byName[stage.folder];
  var prefix = stage.folder.slice(0, 3);
  var names = Object.keys(byName);
  for (var i = 0; i < names.length; i += 1) {
    if (names[i].indexOf(prefix) === 0) return byName[names[i]];
  }
  var keywords = stage.workHints;
  for (var k = 0; k < names.length; k += 1) {
    if (v23TextMatchesHints_(names[k], keywords)) return byName[names[k]];
  }
  return null;
}

function v23CountFolderFiles_(folder, limit) {
  var count = 0, latestName = '', latestAt = '', latestMs = 0;
  var files = folder.getFiles();
  while (files.hasNext() && count < limit) {
    var file = files.next();
    count += 1;
    var updated = file.getLastUpdated() ? file.getLastUpdated().getTime() : 0;
    if (updated >= latestMs) {
      latestMs = updated;
      latestName = file.getName();
      latestAt = Utilities.formatDate(file.getLastUpdated(), PMO_V21.TIME_ZONE, 'yyyy-MM-dd HH:mm');
    }
  }
  if (files.hasNext()) count += 1;
  return { count: count, latestName: latestName, latestAt: latestAt };
}

function v23WorkMatchesStage_(work, stage) {
  return v23TextMatchesHints_([work.title, work.type, work.completion].join(' '), stage.workHints);
}

function v23TextMatchesHints_(text, hints) {
  var blob = v21Text_(text);
  if (!blob) return false;
  return (hints || []).some(function(hint) { return blob.indexOf(hint) >= 0; });
}

function v23StageById_(id) {
  return V23_PROGRESS_STAGES.filter(function(item) { return item.id === id; })[0] || null;
}

function v23ProgressBoardSort_(a, b) {
  if (!!a.hasFolder !== !!b.hasFolder) return a.hasFolder ? 1 : -1;
  if (a.overdueCount !== b.overdueCount) return b.overdueCount - a.overdueCount;
  if (a.score !== b.score) return a.score - b.score;
  return v21Text_(a.projectName).localeCompare(v21Text_(b.projectName), 'zh-Hant');
}

function v23LoadProgressCache_() {
  var sheet = v21GetSheet_(PMO_V21.SHEETS.FOLDER_PROGRESS, false);
  if (!sheet || sheet.getLastRow() <= 1) return {};
  var table = v21ReadTable_(PMO_V21.SHEETS.FOLDER_PROGRESS);
  var map = v21HeaderMap_(table.headers);
  var result = {};
  table.rows.forEach(function(row) {
    var id = v21Text_(v21Pick_(row, map, ['專案ID']));
    if (!id) return;
    var stages = {};
    V23_PROGRESS_STAGES.forEach(function(stage) {
      stages[stage.id] = {
        exists: v21Number_(v21Pick_(row, map, [stage.label + '檔數'])) > 0 || v21Text_(v21Pick_(row, map, [stage.label + '存在'])) === '是',
        fileCount: v21Number_(v21Pick_(row, map, [stage.label + '檔數'])),
        latestName: '',
        latestAt: '',
        url: ''
      };
    });
    result[id] = { scannedAt: v21Text_(v21Pick_(row, map, ['掃描時間'])), folderStages: stages };
  });
  return result;
}

function v23SaveProgressCache_(board) {
  if (!board || !board.projectId) return;
  try {
    var object = {
      '專案ID': board.projectId,
      '專案名稱': board.projectName,
      '掃描時間': board.scannedAt || v21Now_(),
      '推估進度': board.score,
      '下一階段': board.currentStageLabel,
      '下一步': board.nextAction,
      '逾期數': board.overdueCount
    };
    (board.stages || []).forEach(function(stage) {
      object[stage.label + '檔數'] = stage.fileCount;
      object[stage.label + '存在'] = stage.folderExists ? '是' : '否';
    });
    v21UpsertObject_(PMO_V21.SHEETS.FOLDER_PROGRESS, PMO_V21.HEADERS.FOLDER_PROGRESS, '專案ID', object);
  } catch (ignored) {}
}
