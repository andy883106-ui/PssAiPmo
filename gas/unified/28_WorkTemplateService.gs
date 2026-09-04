/**
 * V23.2: standard work templates by system type + stage.
 * Pick a template when adding work, or seed missing stage tasks for a project.
 */

var V23_WORK_TEMPLATE_CATALOG = Object.freeze([
  {
    systemType: '停車場系統',
    templates: [
      { id: 'park-contract', stageId: 'contract', title: '停車場合約／訂單確認並上傳至 01_', type: '階段追蹤', days: 5 },
      { id: 'park-drawing', stageId: 'drawing', title: '停車場車道／車位配置圖送審並上傳至 02_', type: '階段追蹤', days: 7 },
      { id: 'park-track', stageId: 'tracking', title: '停車場進場協調與進度追蹤紀錄（03_）', type: '階段追蹤', days: 3 },
      { id: 'park-site', stageId: 'site', title: '停車場讀卡機／閘門安裝除錯並上傳施工照至 04_', type: '階段追蹤', days: 7 },
      { id: 'park-accept', stageId: 'accept', title: '停車場系統驗收測試並上傳驗收單至 05_', type: '階段追蹤', days: 5 },
      { id: 'park-train', stageId: 'training', title: '停車場操作教育訓練並上傳教材至 06_', type: '階段追蹤', days: 5 },
      { id: 'park-bill', stageId: 'billing', title: '停車場請款包準備並上傳至 07_', type: '階段追蹤', days: 5 }
    ]
  },
  {
    systemType: '門禁系統',
    templates: [
      { id: 'acs-contract', stageId: 'contract', title: '門禁合約／設備下單確認並上傳至 01_', type: '階段追蹤', days: 5 },
      { id: 'acs-drawing', stageId: 'drawing', title: '門禁點位／配線圖送審並上傳至 02_', type: '階段追蹤', days: 7 },
      { id: 'acs-track', stageId: 'tracking', title: '門禁時程與業主權限確認追蹤（03_）', type: '階段追蹤', days: 3 },
      { id: 'acs-site', stageId: 'site', title: '門禁控制器／讀卡機安裝除錯並上傳至 04_', type: '階段追蹤', days: 7 },
      { id: 'acs-accept', stageId: 'accept', title: '門禁權限測試驗收並上傳至 05_', type: '階段追蹤', days: 5 },
      { id: 'acs-train', stageId: 'training', title: '門禁後台操作教育訓練並上傳至 06_', type: '階段追蹤', days: 5 },
      { id: 'acs-bill', stageId: 'billing', title: '門禁請款文件準備並上傳至 07_', type: '階段追蹤', days: 5 }
    ]
  },
  {
    systemType: '訪客系統',
    templates: [
      { id: 'vis-contract', stageId: 'contract', title: '訪客系統合約／訂單確認並上傳至 01_', type: '階段追蹤', days: 5 },
      { id: 'vis-drawing', stageId: 'drawing', title: '訪客櫃檯／平板配置圖送審並上傳至 02_', type: '階段追蹤', days: 7 },
      { id: 'vis-track', stageId: 'tracking', title: '訪客流程與業主規則確認追蹤（03_）', type: '階段追蹤', days: 3 },
      { id: 'vis-site', stageId: 'site', title: '訪客機／掃碼設備安裝除錯並上傳至 04_', type: '階段追蹤', days: 7 },
      { id: 'vis-accept', stageId: 'accept', title: '訪客報到流程驗收並上傳至 05_', type: '階段追蹤', days: 5 },
      { id: 'vis-train', stageId: 'training', title: '訪客櫃檯操作教育訓練並上傳至 06_', type: '階段追蹤', days: 5 },
      { id: 'vis-bill', stageId: 'billing', title: '訪客系統請款準備並上傳至 07_', type: '階段追蹤', days: 5 }
    ]
  },
  {
    systemType: '電梯梯控系統',
    templates: [
      { id: 'elv-contract', stageId: 'contract', title: '梯控合約／電梯商協調確認並上傳至 01_', type: '階段追蹤', days: 5 },
      { id: 'elv-drawing', stageId: 'drawing', title: '梯控樓層權限／配線圖送審並上傳至 02_', type: '階段追蹤', days: 7 },
      { id: 'elv-track', stageId: 'tracking', title: '梯控進場時窗與電梯商協調追蹤（03_）', type: '階段追蹤', days: 3 },
      { id: 'elv-site', stageId: 'site', title: '梯控主機／讀卡安裝除錯並上傳至 04_', type: '階段追蹤', days: 7 },
      { id: 'elv-accept', stageId: 'accept', title: '梯控樓層權限驗收並上傳至 05_', type: '階段追蹤', days: 5 },
      { id: 'elv-train', stageId: 'training', title: '梯控管理後台教育訓練並上傳至 06_', type: '階段追蹤', days: 5 },
      { id: 'elv-bill', stageId: 'billing', title: '梯控請款文件準備並上傳至 07_', type: '階段追蹤', days: 5 }
    ]
  },
  {
    systemType: '批價機系統',
    templates: [
      { id: 'pos-contract', stageId: 'contract', title: '批價機合約／設備下單確認並上傳至 01_', type: '階段追蹤', days: 5 },
      { id: 'pos-drawing', stageId: 'drawing', title: '批價機位置／網路圖送審並上傳至 02_', type: '階段追蹤', days: 7 },
      { id: 'pos-track', stageId: 'tracking', title: '批價規則與費率確認追蹤（03_）', type: '階段追蹤', days: 3 },
      { id: 'pos-site', stageId: 'site', title: '批價機安裝連線除錯並上傳至 04_', type: '階段追蹤', days: 7 },
      { id: 'pos-accept', stageId: 'accept', title: '批價／繳費流程驗收並上傳至 05_', type: '階段追蹤', days: 5 },
      { id: 'pos-train', stageId: 'training', title: '批價機操作教育訓練並上傳至 06_', type: '階段追蹤', days: 5 },
      { id: 'pos-bill', stageId: 'billing', title: '批價機請款準備並上傳至 07_', type: '階段追蹤', days: 5 }
    ]
  },
  {
    systemType: '通用',
    templates: [
      { id: 'gen-contract', stageId: 'contract', title: '補齊合約／訂單文件並上傳至 01_', type: '階段追蹤', days: 5 },
      { id: 'gen-drawing', stageId: 'drawing', title: '圖面送審／補圖並上傳至 02_', type: '階段追蹤', days: 7 },
      { id: 'gen-track', stageId: 'tracking', title: '更新專案追蹤紀錄並上傳至 03_', type: '階段追蹤', days: 3 },
      { id: 'gen-site', stageId: 'site', title: '現場施作／除錯並上傳照片至 04_', type: '階段追蹤', days: 7 },
      { id: 'gen-accept', stageId: 'accept', title: '辦理驗收並上傳文件至 05_', type: '階段追蹤', days: 5 },
      { id: 'gen-train', stageId: 'training', title: '安排教育訓練並上傳教材至 06_', type: '階段追蹤', days: 5 },
      { id: 'gen-bill', stageId: 'billing', title: '準備請款文件並上傳至 07_', type: '階段追蹤', days: 5 }
    ]
  }
]);

function listWorkTemplatesV23(payload) {
  return v21Safe_('WORK_TEMPLATES', function() {
    payload = payload || {};
    var systemType = v21Text_(payload.systemType);
    var catalogs = V23_WORK_TEMPLATE_CATALOG.map(function(catalog) {
      return {
        systemType: catalog.systemType,
        templates: catalog.templates.map(function(item) {
          var stage = v23StageById_(item.stageId);
          return {
            id: item.id,
            stageId: item.stageId,
            stageLabel: stage ? stage.label : item.stageId,
            title: item.title,
            type: item.type,
            days: item.days
          };
        })
      };
    });
    if (systemType) {
      var matched = v23PickTemplateCatalog_(systemType);
      return {
        systemType: matched.systemType,
        requestedSystemType: systemType,
        catalogs: catalogs,
        templates: matched.templates.map(function(item) {
          var stage = v23StageById_(item.stageId);
          return {
            id: item.id,
            stageId: item.stageId,
            stageLabel: stage ? stage.label : item.stageId,
            title: item.title,
            type: item.type,
            days: item.days
          };
        })
      };
    }
    return { catalogs: catalogs, systemTypes: catalogs.map(function(item) { return item.systemType; }) };
  });
}

function applyWorkTemplateV23(payload) {
  return v21Safe_('APPLY_WORK_TEMPLATE', function() {
    payload = payload || {};
    var projectId = v21Text_(payload.projectId);
    var templateId = v21Text_(payload.templateId);
    if (!projectId || !templateId) throw new Error('請指定專案與樣板。');
    var project = v21LoadProjects_().filter(function(item) { return item.id === projectId; })[0];
    if (!project) throw new Error('找不到專案：' + projectId);
    var template = v23FindTemplateById_(templateId, project.systemType);
    if (!template) throw new Error('找不到工作樣板：' + templateId);
    var existing = v21LoadWork_().filter(function(item) {
      return item.projectId === projectId &&
        PMO_V21.ACTIVE_STATUSES.indexOf(item.status) >= 0 &&
        v23NormalizeTitle_(item.title) === v23NormalizeTitle_(template.title);
    })[0];
    if (existing) return { created: false, id: existing.id, title: existing.title, templateId: template.id };
    var saved = saveWorkItemV21({
      projectId: projectId,
      title: template.title,
      type: template.type || '階段追蹤',
      assignee: v21Text_(payload.assignee) || project.owner,
      status: '事項',
      priority: v21Text_(payload.priority) || '一般',
      dueDate: v21Date_(payload.dueDate) || v23AddDays_(v21Today_(), template.days || 7)
    });
    if (!saved.ok) throw new Error(saved.message);
    v23LogTaskHistory_('WORK_TEMPLATE', saved.data.id, '', projectId, template.id + '｜' + template.title);
    return { created: true, id: saved.data.id, title: template.title, templateId: template.id, stageId: template.stageId };
  });
}

function seedProjectWorkTemplatesV23(payload) {
  return v21Safe_('SEED_WORK_TEMPLATES', function() {
    payload = payload || {};
    var projectId = v21Text_(payload.projectId);
    if (!projectId) throw new Error('缺少專案ID。');
    var project = v21LoadProjects_().filter(function(item) { return item.id === projectId; })[0];
    if (!project) throw new Error('找不到專案：' + projectId);
    var onlyGaps = payload.onlyGaps !== false;
    var catalog = v23PickTemplateCatalog_(project.systemType);
    var works = v21LoadWork_().filter(function(item) { return item.projectId === projectId && item.status !== '已刪除'; });
    var reports = v21LoadReports_().filter(function(item) { return item.projectId === projectId; });
    var scan = onlyGaps ? v23ScanProjectFolderSafe_(project) : { stages: {} };
    var board = onlyGaps ? v23BuildProjectProgress_(project, works, reports, scan) : null;
    var created = [];
    var skipped = [];
    catalog.templates.forEach(function(template) {
      if (onlyGaps && board) {
        var stage = (board.stages || []).filter(function(item) { return item.id === template.stageId; })[0];
        if (stage && (stage.state === 'evidenced' || stage.state === 'partial')) {
          skipped.push({ templateId: template.id, reason: '階段已有證據' });
          return;
        }
      }
      var exists = works.some(function(item) {
        return PMO_V21.ACTIVE_STATUSES.indexOf(item.status) >= 0 &&
          (v23NormalizeTitle_(item.title) === v23NormalizeTitle_(template.title) ||
            v23WorkMatchesStage_(item, v23StageById_(template.stageId)));
      });
      if (exists) {
        skipped.push({ templateId: template.id, reason: '已有同階段／同標題工作' });
        return;
      }
      var saved = saveWorkItemV21({
        projectId: projectId,
        title: template.title,
        type: template.type || '階段追蹤',
        assignee: v21Text_(payload.assignee) || project.owner,
        status: '事項',
        priority: '一般',
        dueDate: v23AddDays_(v21Today_(), template.days || 7)
      });
      if (!saved.ok) {
        skipped.push({ templateId: template.id, reason: saved.message });
        return;
      }
      created.push({ id: saved.data.id, title: template.title, templateId: template.id, stageId: template.stageId });
      v23LogTaskHistory_('SEED_TEMPLATE', saved.data.id, '', projectId, template.id + '｜' + template.title);
      works.push({
        id: saved.data.id,
        projectId: projectId,
        title: template.title,
        type: template.type || '階段追蹤',
        status: '事項'
      });
    });
    return {
      projectId: projectId,
      systemType: catalog.systemType,
      createdCount: created.length,
      skippedCount: skipped.length,
      created: created,
      skipped: skipped
    };
  });
}

function v23PickTemplateCatalog_(systemType) {
  systemType = v21Text_(systemType);
  var exact = V23_WORK_TEMPLATE_CATALOG.filter(function(item) { return item.systemType === systemType; })[0];
  if (exact) return exact;
  var fuzzy = V23_WORK_TEMPLATE_CATALOG.filter(function(item) {
    return item.systemType !== '通用' && systemType && (systemType.indexOf(item.systemType.replace('系統', '')) >= 0 || item.systemType.indexOf(systemType) >= 0);
  })[0];
  if (fuzzy) return fuzzy;
  return V23_WORK_TEMPLATE_CATALOG.filter(function(item) { return item.systemType === '通用'; })[0];
}

function v23FindTemplateById_(templateId, systemType) {
  templateId = v21Text_(templateId);
  var preferred = v23PickTemplateCatalog_(systemType);
  var hit = preferred.templates.filter(function(item) { return item.id === templateId; })[0];
  if (hit) return hit;
  for (var i = 0; i < V23_WORK_TEMPLATE_CATALOG.length; i++) {
    hit = V23_WORK_TEMPLATE_CATALOG[i].templates.filter(function(item) { return item.id === templateId; })[0];
    if (hit) return hit;
  }
  return null;
}
