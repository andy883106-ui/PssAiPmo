/** Work-to-work and work-to-project relations for the work editor. */
function v21LoadWorkRelations_() {
  var sheet = v21GetSheet_(PMO_V21.SHEETS.WORK_RELATIONS, false);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var table = v21ReadTable_(PMO_V21.SHEETS.WORK_RELATIONS);
  var map = v21HeaderMap_(table.headers);
  return table.rows.map(function(row) {
    var id = v21Text_(v21Pick_(row, map, ['關聯ID']));
    if (!id) return null;
    return {
      id: id,
      workId: v21Text_(v21Pick_(row, map, ['工作ID'])),
      relatedWorkId: v21Text_(v21Pick_(row, map, ['關聯工作ID'])),
      relatedProjectId: v21Text_(v21Pick_(row, map, ['關聯專案ID'])),
      type: v21Text_(v21Pick_(row, map, ['關聯類型'])),
      note: v21Text_(v21Pick_(row, map, ['說明'])),
      createdBy: v21Text_(v21Pick_(row, map, ['建立者'])),
      createdAt: v21Text_(v21Pick_(row, map, ['建立時間'])),
      updatedAt: v21Text_(v21Pick_(row, map, ['更新時間']))
    };
  }).filter(Boolean);
}

function v21WorkRelationsFor_(workId) {
  var works = v21LoadWork_(), projects = v21LoadProjects_(), workById = {}, projectById = {};
  works.forEach(function(item) { workById[item.id] = item; });
  projects.forEach(function(item) { projectById[item.id] = item; });
  return v21LoadWorkRelations_().filter(function(item) { return item.workId === workId; }).map(function(item) {
    var work = workById[item.relatedWorkId] || {}, project = projectById[item.relatedProjectId] || {};
    return {
      id: item.id,
      type: item.type,
      note: item.note,
      relatedWorkId: item.relatedWorkId,
      relatedWorkTitle: work.title || '',
      relatedWorkProjectId: work.projectId || '',
      relatedWorkProjectName: work.projectName || '',
      relatedProjectId: item.relatedProjectId,
      relatedProjectName: project.name || ''
    };
  });
}

function v21AttachWorkRelations_(items) {
  var works = v21LoadWork_(), projects = v21LoadProjects_(), workById = {}, projectById = {}, relationMap = {};
  works.forEach(function(item) { workById[item.id] = item; });
  projects.forEach(function(item) { projectById[item.id] = item; });
  v21LoadWorkRelations_().forEach(function(item) {
    var work = workById[item.relatedWorkId] || {}, project = projectById[item.relatedProjectId] || {};
    if (!relationMap[item.workId]) relationMap[item.workId] = [];
    relationMap[item.workId].push({
      id:item.id, type:item.type, note:item.note,
      relatedWorkId:item.relatedWorkId, relatedWorkTitle:work.title || '',
      relatedWorkProjectId:work.projectId || '', relatedWorkProjectName:work.projectName || '',
      relatedProjectId:item.relatedProjectId, relatedProjectName:project.name || ''
    });
  });
  (items || []).forEach(function(item) { item.relations = relationMap[item.id] || []; });
  return items;
}

function v21SaveWorkRelations_(workId, primaryProjectId, payload) {
  var sheet = v21EnsureSheet_(PMO_V21.SHEETS.WORK_RELATIONS, PMO_V21.HEADERS.WORK_RELATIONS);
  var relatedWorkId = v21Text_(payload.relatedWorkId);
  var relatedProjectId = v21Text_(payload.relatedProjectId);
  var relationType = v21Text_(payload.relationType) || '相關工作／場地';
  var note = v21Text_(payload.relationNote);
  var works = v21LoadWork_(), projects = v21LoadProjects_(), workById = {}, projectById = {};
  works.forEach(function(item) { workById[item.id] = item; });
  projects.forEach(function(item) { projectById[item.id] = item; });
  if (relatedWorkId) {
    if (relatedWorkId === workId) throw new Error('工作事項不可關聯自己。');
    if (!workById[relatedWorkId]) throw new Error('選擇的關聯工作事項不存在。');
  }
  if (relatedProjectId) {
    if (!projectById[relatedProjectId]) throw new Error('選擇的關聯專案場地不存在。');
    if (relatedProjectId === primaryProjectId) throw new Error('關聯專案場地不可與目前工作所屬專案相同。');
  }
  var idIndex = PMO_V21.HEADERS.WORK_RELATIONS.indexOf('工作ID');
  if (sheet.getLastRow() > 1) {
    var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, PMO_V21.HEADERS.WORK_RELATIONS.length).getValues();
    for (var i = rows.length - 1; i >= 0; i -= 1) {
      if (v21Text_(rows[i][idIndex]) === workId) sheet.deleteRow(i + 2);
    }
  }
  if (!relatedWorkId && !relatedProjectId) return [];
  var now = v21Now_(), relationId = 'WREL-' + v21Hash_([workId, relatedWorkId, relatedProjectId].join('|'));
  v21UpsertObject_(PMO_V21.SHEETS.WORK_RELATIONS, PMO_V21.HEADERS.WORK_RELATIONS, '關聯ID', {
    '關聯ID': relationId,
    '工作ID': workId,
    '關聯工作ID': relatedWorkId,
    '關聯專案ID': relatedProjectId,
    '關聯類型': relationType,
    '說明': note,
    '建立者': v21User_(),
    '建立時間': now,
    '更新時間': now
  });
  return [{id:relationId,relatedWorkId:relatedWorkId,relatedProjectId:relatedProjectId,type:relationType,note:note}];
}

function getWorkRelationsV21(payload) {
  return v21Safe_('GET_WORK_RELATIONS', function() {
    return v21WorkRelationsFor_(v21Text_(payload && payload.workId));
  });
}
