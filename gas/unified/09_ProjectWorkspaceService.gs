/** Project creation, manual status control, usage ranking, suggestions and folder browsing. */
function getSuggestionsV21() {
  return v21Safe_('GET_SUGGESTIONS', function() {
    var peopleTable = v21ReadSourceTable_(PMO_V21.SHEETS.LEGACY_PEOPLE);
    var peopleMap = v21HeaderMap_(peopleTable.headers);
    var people = [];
    var seenPeople = {};
    peopleTable.rows.forEach(function(row) {
      var enabled = v21Text_(v21Pick_(row, peopleMap, ['啟用狀態','狀態']));
      var name = v21Text_(v21Pick_(row, peopleMap, ['姓名','人員']));
      if (name && enabled !== '停用' && !seenPeople[name]) {
        seenPeople[name] = true;
        people.push({ name:name, role:v21Text_(v21Pick_(row, peopleMap, ['角色','職稱','職級'])), supervisor:v21Text_(v21Pick_(row, peopleMap, ['主管'])) });
      }
    });
    function addUsedPerson(name, role) {
      name=v21Text_(name);if(!name||seenPeople[name])return;
      seenPeople[name]=true;people.push({name:name,role:role||'曾輸入',supervisor:''});
    }
    v21LoadWork_().forEach(function(item){addUsedPerson(item.assignee,'工作負責人');addUsedPerson(item.collaborator,'工作協作人');});
    v21LoadReports_().forEach(function(item){addUsedPerson(item.employee,'回報人員');addUsedPerson(item.supervisor,'主管');});
    people.sort(function(a,b){return a.name.localeCompare(b.name,'zh-Hant');});
    var counts = {};
    v21LoadWork_().forEach(function(item) { if (item.title) counts[item.title] = (counts[item.title] || 0) + 2; });
    v21LoadReports_().forEach(function(item) { if (item.title) counts[item.title] = (counts[item.title] || 0) + 1; });
    var titles = Object.keys(counts).sort(function(a,b) { return counts[b] - counts[a] || a.localeCompare(b, 'zh-Hant'); }).slice(0, 100);
    var existingSystems={};
    v21LoadProjects_().forEach(function(item){if(item.systemType)existingSystems[item.systemType]=true;});
    V21_SYSTEM_TYPES.forEach(function(item){existingSystems[item]=true;});
    return { people:people, eventTitles:titles, projectStatuses:V21_PROJECT_STATUSES.slice(), systemTypes:Object.keys(existingSystems).sort(function(a,b){return a.localeCompare(b,'zh-Hant');}) };
  });
}

function v21LoadProjectUsage_() {
  var sheet = v21GetSheet_(PMO_V21.SHEETS.PROJECT_USAGE, false);
  if (!sheet || sheet.getLastRow() <= 1) return {};
  var table = v21ReadTable_(PMO_V21.SHEETS.PROJECT_USAGE);
  var map = v21HeaderMap_(table.headers);
  var user = v21User_();
  var result = {};
  table.rows.forEach(function(row) {
    if (v21Text_(v21Pick_(row,map,['使用者'])) !== user) return;
    var id = v21Text_(v21Pick_(row,map,['專案ID']));
    if (id) result[id] = { count:v21Number_(v21Pick_(row,map,['使用次數'])), lastUsed:v21Text_(v21Pick_(row,map,['最後使用時間'])), pinned:v21Text_(v21Pick_(row,map,['置頂'])) === '是' };
  });
  return result;
}

function recordProjectUseV21(projectId) {
  var id = v21Text_(projectId);
  if (!id) return;
  v21WithLock_(function() {
    var usage = v21LoadProjectUsage_()[id] || {count:0,lastUsed:'',pinned:false};
    v21UpsertComposite_(PMO_V21.SHEETS.PROJECT_USAGE, PMO_V21.HEADERS.PROJECT_USAGE, ['使用者','專案ID'], {
      '使用者':v21User_(),'專案ID':id,'使用次數':usage.count + 1,'最後使用時間':v21Now_(),'置頂':usage.pinned ? '是' : '否'
    });
  });
}

function toggleProjectPinV21(projectId) {
  return v21Safe_('TOGGLE_PROJECT_PIN', function() {
    var id=v21Text_(projectId), usage=v21LoadProjectUsage_()[id] || {count:0,pinned:false};
    v21WithLock_(function() {
      v21UpsertComposite_(PMO_V21.SHEETS.PROJECT_USAGE, PMO_V21.HEADERS.PROJECT_USAGE, ['使用者','專案ID'], {
        '使用者':v21User_(),'專案ID':id,'使用次數':usage.count,'最後使用時間':usage.lastUsed||v21Now_(),'置頂':usage.pinned?'否':'是'
      });
    });
    v21ClearCache_();
    return {projectId:id,pinned:!usage.pinned};
  });
}

function v21UpsertComposite_(sheetName, headers, keyHeaders, object) {
  var sheet=v21EnsureSheet_(sheetName,headers), lastRow=sheet.getLastRow(), target=lastRow+1;
  if (lastRow>1) {
    var values=sheet.getRange(2,1,lastRow-1,headers.length).getValues();
    for(var i=0;i<values.length;i+=1) {
      var matches=keyHeaders.every(function(key){return v21Text_(values[i][headers.indexOf(key)])===v21Text_(object[key]);});
      if(matches){target=i+2;break;}
    }
  }
  var row=target<=lastRow?sheet.getRange(target,1,1,headers.length).getValues()[0]:headers.map(function(){return '';});
  headers.forEach(function(header,index){if(object[header]!==undefined)row[index]=object[header];});
  sheet.getRange(target,1,1,headers.length).setValues([row]);
}

function configureV21ProjectRootFolder(folderIdOrUrl) {
  return v21Safe_('CONFIGURE_PROJECT_ROOT', function() {
    var id=v21ExtractDriveId_(folderIdOrUrl);
    if(!id)throw new Error('專案根資料夾 ID 或連結不正確。');
    if(id!==PMO_V21.DEFAULT_PROJECT_ROOT_FOLDER_ID)throw new Error('V22.4.0 專案根目錄已固定為 PSS_AI_PMO_雲端資料中心，禁止改到其他位置。');
    var folder=DriveApp.getFolderById(id);
    PropertiesService.getScriptProperties().setProperty(PMO_V21.PROJECT_ROOT_PROPERTY,id);
    return {id:id,name:folder.getName(),url:folder.getUrl()};
  });
}

function v21ProjectRoot_() {
  var properties=PropertiesService.getScriptProperties();
  var id=PMO_V21.DEFAULT_PROJECT_ROOT_FOLDER_ID;
  var root=DriveApp.getFolderById(id);
  properties.setProperty(PMO_V21.PROJECT_ROOT_PROPERTY,id);
  return root;
}

function createProjectV21(payload) {
  return v21Safe_('CREATE_PROJECT', function() {
    payload=payload||{};
    var name=v21Text_(payload.name), customer=v21Text_(payload.customer);
    if(!name)throw new Error('專案名稱不得空白。');
    var duplicate=v21LoadProjects_().some(function(item){return v21Text_(item.name).toLowerCase()===name.toLowerCase();});
    if(duplicate)throw new Error('資料庫已存在同名專案，請先搜尋確認。');
    return v21WithLock_(function() {
      var id='SITE_'+Utilities.formatDate(new Date(),PMO_V21.TIME_ZONE,'yyyyMMddHHmmss')+'_'+Utilities.getUuid().slice(0,4).toUpperCase();
      var folderName=(customer?customer+'_':'')+name+'_'+id;
      var folder=v21ProjectRoot_().createFolder(folderName.replace(/[\\/:*?"<>|]/g,'_'));
      V21_PROJECT_SUBFOLDERS.forEach(function(subfolder){folder.createFolder(subfolder);});
      var now=v21Now_();
      v21UpsertObject_(PMO_V21.SHEETS.PROJECTS,PMO_V21.HEADERS.PROJECTS,'專案ID',{
        '專案ID':id,'專案名稱':name,'客戶':customer,'系統類型':v21Text_(payload.systemType),
        '負責人':v21Text_(payload.owner),'專案狀態':v21Text_(payload.status)||'待簽約','進度':0,
        '雲端資料夾':folder.getUrl(),'圖面送審狀態':'待確認','開始日':v21Date_(payload.startDate)||v21Today_(),
        '預計完成日':v21Date_(payload.dueDate),'來源分頁':'V21_WEB','來源列':'','更新時間':now
      });
      v21Audit_('CREATE_PROJECT','專案',id,'成功',name+' '+folder.getUrl());
      v21ClearCache_();
      return {id:id,name:name,folderUrl:folder.getUrl()};
    });
  });
}

function updateProjectV21(payload) {
  return v21Safe_('UPDATE_PROJECT', function() {
    payload=payload||{};
    var id=v21Text_(payload.id), project=v21LoadProjects_().filter(function(item){return item.id===id;})[0];
    if(!project)throw new Error('找不到專案：'+id);
    var status=v21Text_(payload.status)||project.status;
    if(V21_PROJECT_STATUSES.indexOf(status)<0)throw new Error('專案狀態不在允許清單內。');
    return v21WithLock_(function() {
      v21UpsertObject_(PMO_V21.SHEETS.PROJECTS,PMO_V21.HEADERS.PROJECTS,'專案ID',{
        '專案ID':id,'專案名稱':v21Text_(payload.name)||project.name,'客戶':v21Text_(payload.customer)||project.customer,
        '系統類型':v21Text_(payload.systemType)||project.systemType,'負責人':v21Text_(payload.owner)||project.owner,
        '專案狀態':status,'進度':payload.progress===''||payload.progress===undefined?project.progress:Math.max(0,Math.min(100,v21Number_(payload.progress))),
        '雲端資料夾':v21Text_(payload.folderUrl)||project.folderUrl,'圖面送審狀態':v21Text_(payload.drawingStatus)||project.drawingStatus,
        '開始日':v21Date_(payload.startDate)||project.startDate,'預計完成日':v21Date_(payload.dueDate)||project.dueDate,
        '來源分頁':project.sourceSheet||'V21_WEB','來源列':project.sourceRow||'','更新時間':v21Now_()
      });
      v21Audit_('UPDATE_PROJECT','專案',id,'成功','狀態：'+status);
      v21ClearCache_();
      return {id:id,status:status};
    });
  });
}

function v21SuggestProjectStatus_(project, activeWork) {
  if(Number(project.progress||0)>=100)return '完成';
  if((activeWork||[]).some(function(item){return item.status==='事項';}))return '待追蹤';
  if((activeWork||[]).some(function(item){return item.status==='目前處理';}))return '進行中';
  return project.status||'待確認';
}

function listProjectFilesV21(payload) {
  return v21Safe_('LIST_PROJECT_FILES', function() {
    payload=payload||{};
    var id=v21Text_(payload.projectId), category=v21Text_(payload.category)||'all', query=v21Text_(payload.query).toLowerCase();
    var project=v21LoadProjects_().filter(function(item){return item.id===id;})[0];
    if(!project||!project.folderUrl)throw new Error('此專案尚未設定雲端資料夾。');
    var root=DriveApp.getFolderById(v21ExtractDriveId_(project.folderUrl));
    var stack=[{folder:root,path:root.getName(),depth:0}], files=[], scannedFolders=0, scannedFiles=0;
    while(stack.length&&scannedFolders<120&&scannedFiles<800) {
      var node=stack.pop(); scannedFolders+=1;
      var iterator=node.folder.getFiles();
      while(iterator.hasNext()&&scannedFiles<800) {
        var file=iterator.next(); scannedFiles+=1;
        var name=file.getName(), kind=v21FileKind_(name,file.getMimeType());
        if((category==='all'||kind===category)&&(!query||name.toLowerCase().indexOf(query)>=0)) {
          files.push({id:file.getId(),name:name,url:file.getUrl(),mimeType:file.getMimeType(),category:kind,
            modified:Utilities.formatDate(file.getLastUpdated(),PMO_V21.TIME_ZONE,'yyyy-MM-dd HH:mm:ss'),size:file.getSize(),path:node.path});
        }
      }
      if(node.depth<5) {
        var folders=node.folder.getFolders();
        while(folders.hasNext()&&stack.length<120) {var child=folders.next();stack.push({folder:child,path:node.path+'/'+child.getName(),depth:node.depth+1});}
      }
    }
    files.sort(function(a,b){return b.modified.localeCompare(a.modified);});
    return {projectId:id,category:category,query:query,files:files.slice(0,300),scannedFolders:scannedFolders,scannedFiles:scannedFiles,truncated:stack.length>0||scannedFiles>=800};
  });
}

function v21FileKind_(name,mimeType) {
  var ext=(v21Text_(name).toLowerCase().match(/\.([a-z0-9]+)$/)||[])[1]||'';
  if(/^image\//i.test(mimeType)||['jpg','jpeg','png','gif','webp','bmp','tif','tiff','heic'].indexOf(ext)>=0)return 'image';
  if(['dwg','dxf','dwf','dwt','rvt','rfa','skp'].indexOf(ext)>=0)return 'cad';
  if(/(pdf|document|spreadsheet|presentation|msword|officedocument)/i.test(mimeType)||['pdf','doc','docx','xls','xlsx','csv','ppt','pptx','txt'].indexOf(ext)>=0)return 'document';
  return 'other';
}
