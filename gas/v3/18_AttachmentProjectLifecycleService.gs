/** Multi-attachment registry, project relations, safe archive and verified Drive file moves. */
function getAttachmentsV21(payload) {
  return v21Safe_('GET_ATTACHMENTS',function(){payload=payload||{};return v21AttachmentsForEntity_(v21Text_(payload.entityType),v21Text_(payload.entityId),v21Text_(payload.legacyUrl));});
}

function v21LoadAttachments_() {
  var sheet=v21GetSheet_(PMO_V21.SHEETS.ATTACHMENTS,false);if(!sheet||sheet.getLastRow()<=1)return [];
  var table=v21ReadTable_(PMO_V21.SHEETS.ATTACHMENTS),map=v21HeaderMap_(table.headers);
  return table.rows.map(function(row){var id=v21Text_(v21Pick_(row,map,['附件ID'])),url=v21Text_(v21Pick_(row,map,['連結']));if(!id||!url)return null;return {
    id:id,entityType:v21Text_(v21Pick_(row,map,['資料類型'])),entityId:v21Text_(v21Pick_(row,map,['關聯ID'])),projectId:v21Text_(v21Pick_(row,map,['專案ID'])),
    displayName:v21Text_(v21Pick_(row,map,['顯示名稱'])),url:url,originalName:v21Text_(v21Pick_(row,map,['原始檔名'])),mimeType:v21Text_(v21Pick_(row,map,['MimeType'])),
    createdBy:v21Text_(v21Pick_(row,map,['建立者'])),createdAt:v21Text_(v21Pick_(row,map,['建立時間'])),updatedAt:v21Text_(v21Pick_(row,map,['更新時間']))};}).filter(Boolean);
}

function v21AttachmentsForEntity_(entityType,entityId,legacyUrl) {
  return v21AttachmentsFromList_(v21LoadAttachments_(),entityType,entityId,legacyUrl);
}

function v21AttachmentsFromList_(registry,entityType,entityId,legacyUrl) {
  var items=(registry||[]).filter(function(item){return item.entityType===entityType&&item.entityId===entityId;});
  var legacy=v21Text_(legacyUrl);if(legacy&&!items.some(function(item){return item.url===legacy;}))items.unshift({id:'LEGACY-'+v21Hash_(entityType+'|'+entityId+'|'+legacy),entityType:entityType,entityId:entityId,displayName:'原附件',url:legacy,originalName:'',mimeType:'',legacy:true});
  return items.sort(function(a,b){return v21Text_(a.createdAt).localeCompare(v21Text_(b.createdAt));});
}

function v21SaveAttachmentRecords_(entityType,entityId,projectId,attachments) {
  if(!Array.isArray(attachments))return [];
  var now=v21Now_(),saved=[],kept={};
  (Array.isArray(attachments)?attachments:[]).slice(0,40).forEach(function(item){item=item||{};var url=v21Text_(item.url);if(!/^https:\/\//i.test(url))return;
    var id='ATT-'+v21Hash_(entityType+'|'+entityId+'|'+url),display=v21Text_(item.displayName)||v21Text_(item.originalName)||'附件';
    v21UpsertObject_(PMO_V21.SHEETS.ATTACHMENTS,PMO_V21.HEADERS.ATTACHMENTS,'附件ID',{
      '附件ID':id,'資料類型':entityType,'關聯ID':entityId,'專案ID':projectId,'顯示名稱':display,'連結':url,'原始檔名':v21Text_(item.originalName),
      'MimeType':v21Text_(item.mimeType),'建立者':v21Text_(item.createdBy)||v21User_(),'建立時間':v21Text_(item.createdAt)||now,'更新時間':now
    });kept[id]=true;saved.push({id:id,displayName:display,url:url,originalName:v21Text_(item.originalName),mimeType:v21Text_(item.mimeType)});
  });v21RemoveUnlistedAttachmentRows_(entityType,entityId,kept);return saved;
}

function v21RemoveUnlistedAttachmentRows_(entityType,entityId,kept) {var sheet=v21GetSheet_(PMO_V21.SHEETS.ATTACHMENTS,false);if(!sheet||sheet.getLastRow()<=1)return;var headers=sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0].map(v21Text_),typeIndex=headers.indexOf('資料類型'),entityIndex=headers.indexOf('關聯ID'),idIndex=headers.indexOf('附件ID');if(typeIndex<0||entityIndex<0||idIndex<0)return;var rows=sheet.getRange(2,1,sheet.getLastRow()-1,sheet.getLastColumn()).getValues();for(var i=rows.length-1;i>=0;i-=1)if(v21Text_(rows[i][typeIndex])===entityType&&v21Text_(rows[i][entityIndex])===entityId&&!kept[v21Text_(rows[i][idIndex])])sheet.deleteRow(i+2);}

function v21PrimaryAttachmentUrl_(attachments,fallback) {
  var items=Array.isArray(attachments)?attachments:[];for(var i=0;i<items.length;i+=1){var url=v21Text_(items[i]&&items[i].url);if(/^https:\/\//i.test(url))return url;}return v21Text_(fallback);
}

function v21LoadProjectRelations_() {
  var sheet=v21GetSheet_(PMO_V21.SHEETS.PROJECT_RELATIONS,false);if(!sheet||sheet.getLastRow()<=1)return [];
  var table=v21ReadTable_(PMO_V21.SHEETS.PROJECT_RELATIONS),map=v21HeaderMap_(table.headers);
  return table.rows.map(function(row){var id=v21Text_(v21Pick_(row,map,['關聯ID']));if(!id)return null;return {id:id,primaryProjectId:v21Text_(v21Pick_(row,map,['主專案ID'])),relatedProjectId:v21Text_(v21Pick_(row,map,['關聯專案ID'])),type:v21Text_(v21Pick_(row,map,['關聯類型'])),note:v21Text_(v21Pick_(row,map,['說明'])),createdBy:v21Text_(v21Pick_(row,map,['建立者'])),createdAt:v21Text_(v21Pick_(row,map,['建立時間'])),updatedAt:v21Text_(v21Pick_(row,map,['更新時間']))};}).filter(Boolean);
}

function v21RelationsForProject_(projectId) {
  var projects=v21LoadProjects_(),byId={};projects.forEach(function(project){byId[project.id]=project;});
  return v21LoadProjectRelations_().filter(function(item){return item.primaryProjectId===projectId||item.relatedProjectId===projectId;}).map(function(item){var otherId=item.primaryProjectId===projectId?item.relatedProjectId:item.primaryProjectId,project=byId[otherId]||{};return {id:item.id,type:item.type,note:item.note,projectId:otherId,projectName:project.name||otherId,customer:project.customer||'',systemType:project.systemType||'',owner:project.owner||'',status:project.status||'',folderUrl:project.folderUrl||''};});
}

function saveProjectRelationV21(payload) {
  return v21Safe_('SAVE_PROJECT_RELATION',function(){payload=payload||{};return v21WithLock_(function(){var primary=v21Text_(payload.primaryProjectId),related=v21Text_(payload.relatedProjectId),type=v21Text_(payload.type)||'相關專案',projects=v21LoadProjects_(),ids={};projects.forEach(function(project){ids[project.id]=true;});
    if(!ids[primary]||!ids[related])throw new Error('請選擇兩個有效專案。');if(primary===related)throw new Error('專案不可關聯自己。');
    var pair=[primary,related].sort(),id='REL-'+v21Hash_(pair.join('|')+'|'+type),now=v21Now_();v21UpsertObject_(PMO_V21.SHEETS.PROJECT_RELATIONS,PMO_V21.HEADERS.PROJECT_RELATIONS,'關聯ID',{
      '關聯ID':id,'主專案ID':primary,'關聯專案ID':related,'關聯類型':type,'說明':v21Text_(payload.note),'建立者':v21User_(),'建立時間':now,'更新時間':now});
    v21Audit_('SAVE_PROJECT_RELATION','專案關聯',id,'成功',primary+' ↔ '+related+' '+type);return {id:id,relations:v21RelationsForProject_(primary)};});});
}

function removeProjectRelationV21(payload) {
  return v21Safe_('REMOVE_PROJECT_RELATION',function(){payload=payload||{};return v21WithLock_(function(){var id=v21Text_(payload.id);if(!id)throw new Error('缺少關聯 ID。');v21DeleteRowByKey_(PMO_V21.SHEETS.PROJECT_RELATIONS,'關聯ID',id);v21Audit_('REMOVE_PROJECT_RELATION','專案關聯',id,'成功','僅解除關聯，不刪除專案或檔案');return {id:id};});});
}

function archiveProjectV21(payload) {
  return v21Safe_('ARCHIVE_PROJECT',function(){payload=payload||{};return v21WithLock_(function(){var id=v21Text_(payload.projectId),confirmId=v21Text_(payload.confirmProjectId),project=v21LoadProjects_().filter(function(item){return item.id===id;})[0];
    if(!project)throw new Error('找不到專案：'+id);if(confirmId!==id)throw new Error('確認用場地代號不一致，未封存專案。');
    var archivedFolderUrl=project.folderUrl;if(project.folderUrl){var root=v21ProjectRoot_(),archives=v21FindOrCreateChildFolder_(root,PMO_V21.PROJECT_ARCHIVE_FOLDER_NAME),folder=DriveApp.getFolderById(v21ExtractDriveId_(project.folderUrl));folder.moveTo(archives);archivedFolderUrl=folder.getUrl();}
    v21UpsertObject_(PMO_V21.SHEETS.PROJECTS,PMO_V21.HEADERS.PROJECTS,'專案ID',{'專案ID':id,'專案狀態':'封存','雲端資料夾':archivedFolderUrl,'更新時間':v21Now_()});
    v21Audit_('ARCHIVE_PROJECT','專案',id,'成功','資料保留；資料夾移至 '+PMO_V21.PROJECT_ARCHIVE_FOLDER_NAME);v21ClearCache_();return {id:id,status:'封存',folderUrl:archivedFolderUrl,recoverable:true};});});
}

function restoreArchivedProjectV21(payload) {
  return v21Safe_('RESTORE_PROJECT',function(){payload=payload||{};return v21WithLock_(function(){var id=v21Text_(payload.projectId),project=v21LoadProjects_().filter(function(item){return item.id===id;})[0];if(!project)throw new Error('找不到專案：'+id);
    if(project.folderUrl)DriveApp.getFolderById(v21ExtractDriveId_(project.folderUrl)).moveTo(v21ProjectRoot_());
    v21UpsertObject_(PMO_V21.SHEETS.PROJECTS,PMO_V21.HEADERS.PROJECTS,'專案ID',{'專案ID':id,'專案狀態':v21Text_(payload.status)||'待追蹤','更新時間':v21Now_()});v21ClearCache_();return {id:id,status:v21Text_(payload.status)||'待追蹤'};});});
}

function moveProjectFileV21(payload) {
  return v21Safe_('MOVE_PROJECT_FILE',function(){payload=payload||{};var sourceId=v21Text_(payload.sourceProjectId),targetId=v21Text_(payload.targetProjectId),fileId=v21Text_(payload.fileId),subfolder=v21Text_(payload.targetSubfolder)||'08_其他文件';
    var allowed=['專案根目錄'].concat(V21_PROJECT_SUBFOLDERS);if(allowed.indexOf(subfolder)<0)throw new Error('目標資料夾不在允許清單內。');
    var projects=v21LoadProjects_(),source=projects.filter(function(item){return item.id===sourceId;})[0],target=projects.filter(function(item){return item.id===targetId;})[0];if(!source||!target)throw new Error('來源或目標專案不存在。');if(target.status==='封存')throw new Error('不可把檔案搬入已封存專案。');if(!source.folderUrl||!target.folderUrl)throw new Error('來源或目標專案尚未設定雲端資料夾。');
    var file=DriveApp.getFileById(fileId),sourceRootId=v21ExtractDriveId_(source.folderUrl);if(!v21FileBelongsToFolderTree_(file,sourceRootId))throw new Error('檔案不在來源專案資料夾內，已停止搬移。');
    var targetRoot=DriveApp.getFolderById(v21ExtractDriveId_(target.folderUrl)),targetFolder=subfolder==='專案根目錄'?targetRoot:v21FindOrCreateChildFolder_(targetRoot,subfolder);file.moveTo(targetFolder);
    v21Audit_('MOVE_PROJECT_FILE','專案檔案',fileId,'成功',sourceId+' → '+targetId+'/'+subfolder+' '+file.getName());return {fileId:fileId,name:file.getName(),url:file.getUrl(),sourceProjectId:sourceId,targetProjectId:targetId,targetSubfolder:subfolder};});
}

function v21FileBelongsToFolderTree_(file,rootId) {
  var queue=[],seen={},parents=file.getParents();while(parents.hasNext())queue.push({folder:parents.next(),depth:0});
  while(queue.length){var node=queue.shift(),id=node.folder.getId();if(id===rootId)return true;if(seen[id]||node.depth>=8)continue;seen[id]=true;var upper=node.folder.getParents();while(upper.hasNext())queue.push({folder:upper.next(),depth:node.depth+1});}return false;
}

function v21FindOrCreateChildFolder_(parent,name) {var folders=parent.getFoldersByName(name);return folders.hasNext()?folders.next():parent.createFolder(name);}

function v21DeleteRowByKey_(sheetName,keyHeader,key) {var sheet=v21GetSheet_(sheetName,false);if(!sheet||sheet.getLastRow()<=1)return false;var headers=sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0].map(v21Text_),index=headers.indexOf(keyHeader);if(index<0)throw new Error('找不到主鍵欄位：'+keyHeader);var values=sheet.getRange(2,index+1,sheet.getLastRow()-1,1).getValues();for(var i=values.length-1;i>=0;i-=1)if(v21Text_(values[i][0])===key){sheet.deleteRow(i+2);return true;}return false;}
