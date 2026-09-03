/** Safe, idempotent import of the 2026-08-14 drawing-progress workbook snapshot. */
function previewDrawingProgress20260814V21() {
  return v21Safe_('PREVIEW_DRAWING_PROGRESS_20260814', function() {
    return v21BuildDrawingImportPlan_(v21LoadProjects_(), v21DrawingProgressSource20260814_());
  });
}

function importDrawingProgress20260814V21(confirmToken) {
  if (confirmToken !== PMO_V21.DRAWING_IMPORT_CONFIRM_TOKEN) {
    return v21Fail_('確認碼不正確，未匯入繪圖申請進度。', 'CONFIRM_REQUIRED');
  }
  return v21Safe_('IMPORT_DRAWING_PROGRESS_20260814', function() {
    return v21WithLock_(function() {
      if (!v21HasCanonicalData_(PMO_V21.SHEETS.PROJECTS)) {
        throw new Error('目前資料庫尚無 V21_專案主檔資料；請先完成 V21 資料遷移或建立 V2.0 精簡資料庫。');
      }
      var plan = v21BuildDrawingImportPlan_(v21LoadProjects_(), v21DrawingProgressSource20260814_());
      if (!plan.ready) throw new Error(plan.blocker || '繪圖資料尚未通過匯入檢查。');
      var now = v21Now_();
      var drawingRows = plan.records.map(function(record) {
        return v21DrawingRow_({
          id: 'DRAW-REQ-20260814-' + record.sourceRow + '-' + v21Hash_(record.projectId).slice(0, 10),
          projectId: record.projectId,
          projectName: record.projectName,
          title: record.drawingName || (record.projectName + '送審圖面'),
          status: '完成',
          submittedAt: record.submittedDate,
          review: record.drawingUrl ? '已送審；圖面連結已建置' : '已送審；來源未附超連結',
          version: '',
          attachment: record.drawingUrl,
          sourceSheet: '繪圖申請進度表',
          sourceId: '繪圖申請進度表!' + record.sourceRow,
          updatedAt: now
        });
      });
      var projectsById = {};
      plan.records.forEach(function(record) {
        projectsById[record.projectId] = {
          '專案ID': record.projectId,
          '圖面送審狀態': '完成',
          '更新時間': now
        };
      });
      v21BulkUpsert_(PMO_V21.SHEETS.DRAWINGS, PMO_V21.HEADERS.DRAWINGS, '圖面ID', drawingRows);
      v21BulkUpsert_(PMO_V21.SHEETS.PROJECTS, PMO_V21.HEADERS.PROJECTS, '專案ID', Object.keys(projectsById).map(function(id) { return projectsById[id]; }));
      v21ClearCache_();
      var summary = {
        sourceRows: plan.sourceRows,
        importedDrawingRows: drawingRows.length,
        completedProjects: Object.keys(projectsById).length,
        linkedDrawingRows: plan.linkedRecords,
        missingLinkRows: plan.missingLinkRecords,
        unmatchedRows: plan.unmatchedRows,
        ambiguousRows: plan.ambiguousRows,
        skippedRows: plan.unmatchedRows + plan.ambiguousRows,
        targetDatabaseId: v21Db_().getId(),
        importedAt: now
      };
      v21Audit_('IMPORT_DRAWING_PROGRESS_20260814', '圖面狀態', '繪圖申請進度表', '成功', JSON.stringify(summary));
      return summary;
    });
  });
}

function runImportDrawingProgress20260814V21() {
  return importDrawingProgress20260814V21(PMO_V21.DRAWING_IMPORT_CONFIRM_TOKEN);
}

function v21BuildDrawingImportPlan_(projects, sourceRows) {
  projects = (projects || []).filter(function(project) { return project && project.id && project.name; });
  sourceRows = (sourceRows || []).filter(function(row) { return row && v21Date_(row.d); });
  var index = v21BuildDrawingProjectIndex_(projects);
  var records = [], matchedProjectIds = {}, unmatched = [], ambiguous = [];
  sourceRows.forEach(function(row) {
    var match = v21MatchDrawingProjects_(row.p, index);
    if (!match.projects.length) {
      var item = { sourceRow:row.r, sourceProject:v21Text_(row.p), drawingName:v21Text_(row.n), candidates:match.candidates || [] };
      if (match.ambiguous) ambiguous.push(item); else unmatched.push(item);
      return;
    }
    match.projects.forEach(function(project) {
      matchedProjectIds[project.id] = true;
      records.push({
        sourceRow: Number(row.r) || 0,
        sourceProject: v21Text_(row.p),
        projectId: project.id,
        projectName: project.name,
        submittedDate: v21Date_(row.d),
        drawingName: v21Text_(row.n),
        drawingUrl: /^https:\/\//i.test(v21Text_(row.u)) ? v21Text_(row.u) : '',
        applicant: v21Text_(row.a),
        drawer: v21Text_(row.w),
        matchMode: match.mode
      });
    });
  });
  var linkedRecords = records.filter(function(record) { return !!record.drawingUrl; }).length;
  return {
    ready: projects.length > 0 && records.length > 0,
    blocker: !projects.length ? '目前資料庫沒有可供比對的專案。' : (!records.length ? '沒有任何送審圖面能唯一對應目前專案。' : ''),
    sourceSheet: '繪圖申請進度表',
    sourceRows: sourceRows.length,
    sourceProjects: v21UniqueText_(sourceRows.map(function(row) { return row.p; })).length,
    databaseProjects: projects.length,
    matchedRows: v21UniqueText_(records.map(function(record) { return String(record.sourceRow); })).length,
    matchedProjects: Object.keys(matchedProjectIds).length,
    recordsToWrite: records.length,
    linkedRecords: linkedRecords,
    missingLinkRecords: records.length - linkedRecords,
    unmatchedRows: unmatched.length,
    ambiguousRows: ambiguous.length,
    unmatchedItems: unmatched,
    ambiguousItems: ambiguous,
    unmatchedExamples: unmatched.slice(0, 20),
    ambiguousExamples: ambiguous.slice(0, 20),
    records: records
  };
}

function v21BuildDrawingProjectIndex_(projects) {
  return (projects || []).map(function(project) {
    return { project:project, keys:v21DrawingNameKeys_(project.name) };
  });
}

function v21MatchDrawingProjects_(sourceName, index) {
  var source = v21Text_(sourceName);
  if (!source) return { projects:[], candidates:[], ambiguous:false, mode:'empty' };
  var aliasResult = v21MatchDrawingAliases_(source, index);
  if (aliasResult.used) return aliasResult;
  var fragments = source.split(/[\/／,，、]+/).map(function(fragment) {
    return v21Text_(fragment).replace(/\n20\d{2}[\s\S]*$/, '').replace(/\b20\d{2}[\/-]\d{1,2}[\/-]\d{1,2}[\s\S]*$/, '');
  }).filter(function(fragment) {
    return fragment && !v21IsGenericDrawingProject_(fragment);
  });
  if (!fragments.length && !v21IsGenericDrawingProject_(source)) fragments = [source];
  var matches = {}, ambiguousCandidates = {};
  fragments.forEach(function(fragment) {
    var sourceKeys = v21DrawingNameKeys_(fragment);
    var exact = v21FindDrawingProjects_(sourceKeys, index, true, 2);
    var candidates = exact.length ? exact : v21FindDrawingProjects_(sourceKeys, index, false);
    if (candidates.length === 1) matches[candidates[0].id] = candidates[0];
    else if (candidates.length > 1) candidates.forEach(function(project) { ambiguousCandidates[project.id] = project; });
  });
  var projects = Object.keys(matches).map(function(id) { return matches[id]; });
  var candidates = Object.keys(ambiguousCandidates).map(function(id) { return ambiguousCandidates[id]; });
  if (candidates.length) return { projects:[], candidates:candidates.map(v21DrawingProjectSummary_), ambiguous:true, mode:'ambiguous-name' };
  return { projects:projects, candidates:[], ambiguous:false, mode:projects.length > 1 ? 'multi-name' : (projects.length ? 'name' : 'unmatched') };
}

function v21MatchDrawingAliases_(source, index) {
  var normalized = v21NormalizeDrawingName_(source);
  var rules = [
    { source:/國泰松江/, targets:['松江'] },
    { source:/國泰信義充電/, targets:['國泰信義經貿大樓'], exact:true },
    { source:/土城沛坡|土城沛波|^土城$/, targets:['土城沛坡'] },
    { source:/國泰沛坡大樓/, targets:['國泰土城沛坡大樓'], exact:true },
    { source:/信義經貿/, targets:['信義經貿'] },
    { source:/小檜溪/, targets:['小檜溪'] },
    { source:/環宇|寰宇/, targets:['國泰環宇大樓'], exact:true },
    { source:/翡麗琚|翡麗居/, targets:['翡麗居'], exact:true },
    { source:/桃園蘆竹錦中段|桃園錦中段|^錦中段$/, targets:['國泰桃園蘆竹錦中段大樓'], exact:true },
    { source:/石頭段/, targets:['石頭段'] },
    { source:/高雄四維財經/, targets:['國泰高雄四維財經大樓'], exact:true },
    { source:/北區郵政物流/, targets:['北區郵政物流中心'], exact:true },
    { source:/大巨蛋/, targets:['大巨蛋'], exact:true },
    { source:/國壽襄陽大樓/, targets:['國壽襄陽大樓'], exact:true },
    { source:/台南大豐段/, targets:['國泰台南大豐段'], exact:true },
    { source:/^聯發科高鐵大樓$/, targets:['聯發科竹北高鐵大樓'], exact:true },
    { source:/寶豐隆/, targets:['寶豐隆'] }
  ];
  var matchedRules = rules.filter(function(rule) { return rule.source.test(normalized); });
  if (!matchedRules.length) return { used:false, projects:[], candidates:[], ambiguous:false, mode:'' };
  var projects = {}, ambiguous = {};
  matchedRules.forEach(function(rule) {
    var candidates = {};
    rule.targets.forEach(function(target) {
      var targetKeys=rule.exact?[v21NormalizeDrawingName_(target)]:v21DrawingNameKeys_(target);
      v21FindDrawingProjects_(targetKeys, index, !!rule.exact, 2).forEach(function(project) { candidates[project.id] = project; });
    });
    var list = Object.keys(candidates).map(function(id) { return candidates[id]; });
    if (list.length === 1) projects[list[0].id] = list[0];
    else if (list.length > 1) list.forEach(function(project) { ambiguous[project.id] = project; });
  });
  var ambiguousList = Object.keys(ambiguous).map(function(id) { return ambiguous[id]; });
  if (ambiguousList.length) return { used:true, projects:[], candidates:ambiguousList.map(v21DrawingProjectSummary_), ambiguous:true, mode:'ambiguous-alias' };
  return { used:true, projects:Object.keys(projects).map(function(id) { return projects[id]; }), candidates:[], ambiguous:false, mode:'alias' };
}

function v21FindDrawingProjects_(sourceKeys, index, exactOnly, minimumLength) {
  minimumLength = minimumLength || 3;
  return (index || []).filter(function(entry) {
    return sourceKeys.some(function(sourceKey) {
      if (!sourceKey || sourceKey.length < minimumLength) return false;
      return entry.keys.some(function(projectKey) {
        if (!projectKey || projectKey.length < minimumLength) return false;
        if (sourceKey === projectKey) return true;
        if (exactOnly || v21IsWeakDrawingKey_(sourceKey) || v21IsWeakDrawingKey_(projectKey)) return false;
        return sourceKey.indexOf(projectKey) >= 0 || projectKey.indexOf(sourceKey) >= 0;
      });
    });
  }).map(function(entry) { return entry.project; });
}

function v21DrawingNameKeys_(value) {
  var key = v21NormalizeDrawingName_(value);
  if (!key) return [];
  var keys = [key];
  keys.push(key.replace(/^(國泰人壽|國泰|國壽)/, ''));
  var snapshots = keys.slice();
  snapshots.forEach(function(item) {
    keys.push(item.replace(/(大樓|專案追蹤|專案|停車場|案圖面|圖面)$/, ''));
  });
  return v21UniqueText_(keys.filter(function(item) { return item.length >= 2; }));
}

function v21NormalizeDrawingName_(value) {
  return v21Text_(value).toLowerCase()
    .replace(/臺/g, '台').replace(/沛波/g, '沛坡').replace(/翡麗琚/g, '翡麗居')
    .replace(/[（）()【】\[\]{}]/g, '').replace(/[\s\u3000\-–—_.,，、:：;；\/\\]+/g, '');
}

function v21IsGenericDrawingProject_(value) {
  var text = v21NormalizeDrawingName_(value);
  return !text || /^(充電樁|停車管理系統架構圖|停管設備|繪製|pss柵欄機尺寸)/.test(text);
}

function v21IsWeakDrawingKey_(value) {
  return /^(大樓|中心|金融中心|購物中心|物流中心|醫院|停車場|廣場|專案|國泰|國壽|置地)$/.test(v21NormalizeDrawingName_(value));
}

function v21DrawingProjectSummary_(project) {
  return { id:project.id, name:project.name };
}

function v21UniqueText_(values) {
  var seen = {};
  return (values || []).map(v21Text_).filter(function(value) {
    if (!value || seen[value]) return false;
    seen[value] = true;
    return true;
  });
}
