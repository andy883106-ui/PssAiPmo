/** Project search, active-work projection and zero-progress display policy. */
function getBootstrapV21(options) {
  return v21Safe_('BOOTSTRAP', function() {
    options = options || {};
    var query = v21Text_(options.query).toLowerCase();
    var projects = v21LoadProjects_().filter(function(project){return project.status!=='封存';});
    var works = v21LoadWork_();
    var reports = v21LoadReports_();
    var histories = v21UnifiedHistory_(works, reports);
    var canonicalDrawings = v21LoadCanonicalDrawingMap_();
    var usage = v21LoadProjectUsage_();
    var active = works.filter(function(item) { return PMO_V21.ACTIVE_STATUSES.indexOf(item.status) >= 0 && projects.some(function(project){return project.id===item.projectId;}); });
    var attachmentRegistry=v21LoadAttachments_();
    active.forEach(function(item){item.attachments=v21AttachmentsFromList_(attachmentRegistry,'工作事項',item.id,item.attachment);});
    v21AttachWorkRelations_(active);
    var drawingByProject = {};
    projects.forEach(function(project) { drawingByProject[project.id] = v21DrawingState_(project, works, reports, histories, canonicalDrawings); });
    var filtered = projects.filter(function(project) {
      if (!query) return true;
      return [project.id, project.name, project.customer, project.owner, project.status].join(' ').toLowerCase().indexOf(query) >= 0;
    });
    var cards = filtered.map(function(project) {
      var zero = Number(project.progress || 0) === 0;
      var projectUsage=usage[project.id]||{count:0,lastUsed:'',pinned:false};
      var base = { id: project.id, name: project.name, progress: project.progress, minimal: zero,
        folderUrl: project.folderUrl || '', drawing: drawingByProject[project.id], customer:project.customer,
        systemType:project.systemType, owner:project.owner, status:project.status, startDate:project.startDate,
        dueDate:project.dueDate, usageCount:projectUsage.count, lastUsed:projectUsage.lastUsed, pinned:projectUsage.pinned };
      if (zero) return base;
      base.activeWorkCount = active.filter(function(item) { return item.projectId === project.id; }).length;
      return base;
    }).sort(v21ProjectSort_);
    return {
      generatedAt: v21Now_(), user: v21User_(), query: query, projects: cards,
      activeWork: active.sort(v21WorkSort_).slice(0, 250),
      announcements: v21LoadAnnouncements_(),
      summary: {
        projects: projects.length,
        zeroProgress: projects.filter(function(p) { return Number(p.progress || 0) === 0; }).length,
        zeroMissingFolder: projects.filter(function(p) { return Number(p.progress || 0) === 0 && !p.folderUrl; }).length,
        inProgress: active.filter(function(w) { return w.status === '目前處理'; }).length,
        followUp: active.filter(function(w) { return w.status === '事項'; }).length
      }
    };
  });
}

function v21ProjectSort_(a, b) {
  if(a.pinned!==b.pinned)return a.pinned?-1:1;
  if(a.lastUsed!==b.lastUsed)return v21Text_(b.lastUsed).localeCompare(v21Text_(a.lastUsed));
  if(a.usageCount!==b.usageCount)return Number(b.usageCount||0)-Number(a.usageCount||0);
  return v21Text_(a.name).localeCompare(v21Text_(b.name), 'zh-Hant');
}

function v21WorkSort_(a, b) {
  var sa = a.status === '事項' ? 0 : 1;
  var sb = b.status === '事項' ? 0 : 1;
  if (sa !== sb) return sa - sb;
  return (a.dueDate || '9999-12-31').localeCompare(b.dueDate || '9999-12-31');
}

function getProjectDetailV21(projectId) {
  return v21Safe_('GET_PROJECT', function() {
    var id = v21Text_(projectId);
    var project = v21LoadProjects_().filter(function(item) { return item.id === id; })[0];
    if (!project) throw new Error('找不到專案：' + id);
    var works = v21LoadWork_();
    var reports = v21LoadReports_();
    var histories = v21UnifiedHistory_(works, reports);
    var drawingRecords = v21LoadCanonicalDrawings_();
    var drawing = v21DrawingState_(project, works, reports, histories, v21BuildCanonicalDrawingMap_(drawingRecords));
    var projectWork=works.filter(function(item){return item.projectId===id;}).sort(function(a,b){return v21Text_(b.updatedAt||b.createdAt||b.startDate).localeCompare(v21Text_(a.updatedAt||a.createdAt||a.startDate));});
    var activeWork=projectWork.filter(function(item) { return PMO_V21.ACTIVE_STATUSES.indexOf(item.status) >= 0; }).sort(v21WorkSort_);
    var attachmentRegistry=v21LoadAttachments_();
    projectWork.forEach(function(item){item.attachments=v21AttachmentsFromList_(attachmentRegistry,'工作事項',item.id,item.attachment);});
    v21AttachWorkRelations_(projectWork);
    var projectReports=reports.filter(function(item) { return item.projectId === id; }).sort(function(a,b) { return v21Text_(b.updatedAt||b.date).localeCompare(v21Text_(a.updatedAt||a.date)); }).slice(0, 80);
    projectReports.forEach(function(item){item.attachments=v21AttachmentsFromList_(attachmentRegistry,'工作回報',item.id,item.attachment);});
    try{recordProjectUseV21(id);}catch(ignored){}
    return {
      project: project, minimal: Number(project.progress || 0) === 0, drawing: drawing,
      drawings: drawingRecords.filter(function(item) { return item.projectId === id && (item.title || item.submittedAt || item.attachment); }).sort(function(a,b) { return v21Text_(b.submittedAt || b.updatedAt).localeCompare(v21Text_(a.submittedAt || a.updatedAt)); }).slice(0, 80),
      suggestedStatus:v21SuggestProjectStatus_(project,activeWork), activeWork:activeWork, allWork:projectWork.slice(0,100),
      reports:projectReports, relations:v21RelationsForProject_(id),
      history: histories.filter(function(item) { return item.projectId === id; }).slice(0, 60)
    };
  });
}
