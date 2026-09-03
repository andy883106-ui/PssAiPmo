/** Native training hub: legacy sources are unified without using an external iframe. */
function getTrainingHubV21(payload) {
  return v21Safe_('GET_TRAINING', function() {
    payload=payload||{};
    var query=v21Text_(payload.query).toLowerCase();
    var courses=v21LoadTrainingCourses_();
    if(query)courses=courses.filter(function(course){return [course.name,course.projectName,course.system,course.equipment,course.type,course.description,course.tags].join(' ').toLowerCase().indexOf(query)>=0;});
    var categories={};courses.forEach(function(course){var key=course.system||'未分類';categories[key]=(categories[key]||0)+1;});
    return {courses:courses.slice(0,300),categories:categories,total:courses.length};
  });
}

function v21LoadTrainingCourses_() {
  var result=[],seen={},seenName={};
  var canonical=v21ReadTable_(PMO_V21.SHEETS.TRAINING),canonicalMap=v21HeaderMap_(canonical.headers);
  canonical.rows.forEach(function(row){
    var id=v21Text_(v21Pick_(row,canonicalMap,['課程ID'])),name=v21Text_(v21Pick_(row,canonicalMap,['課程名稱']));
    if(!id||!name||v21Text_(v21Pick_(row,canonicalMap,['狀態']))==='停用')return;
    var course={id:id,name:name,projectId:v21Text_(v21Pick_(row,canonicalMap,['專案ID'])),projectName:v21Text_(v21Pick_(row,canonicalMap,['專案名稱'])),
      system:v21Text_(v21Pick_(row,canonicalMap,['系統分類'])),equipment:v21Text_(v21Pick_(row,canonicalMap,['設備分類'])),type:v21Text_(v21Pick_(row,canonicalMap,['教材類型'])),
      version:v21Text_(v21Pick_(row,canonicalMap,['版本'])),mainUrl:v21Text_(v21Pick_(row,canonicalMap,['主教材連結'])),folderUrl:v21Text_(v21Pick_(row,canonicalMap,['資料夾連結'])),
      audience:v21Text_(v21Pick_(row,canonicalMap,['適用對象'])),description:v21Text_(v21Pick_(row,canonicalMap,['說明'])),icon:'📗',updatedAt:v21Text_(v21Pick_(row,canonicalMap,['更新時間'])),source:PMO_V21.SHEETS.TRAINING};
    course.createdBy=v21Text_(v21Pick_(row,canonicalMap,['建立者']));course.createdAt=v21Text_(v21Pick_(row,canonicalMap,['建立時間']));
    seen[id]=course;seenName[name.toLowerCase()]=course;result.push(course);
  });
  var management=v21ReadSourceTable_(PMO_V21.SHEETS.LEGACY_TRAINING), managementMap=v21HeaderMap_(management.headers);
  management.rows.forEach(function(row){
    var id=v21Text_(v21Pick_(row,managementMap,['教材ID'])),name=v21Text_(v21Pick_(row,managementMap,['教材名稱']));
    if(!id||!name||v21Text_(v21Pick_(row,managementMap,['狀態']))==='停用')return;
    if(seen[id]||seenName[name.toLowerCase()])return;
    var course={id:id,name:name,system:v21Text_(v21Pick_(row,managementMap,['系統分類'])),equipment:v21Text_(v21Pick_(row,managementMap,['設備分類'])),
      type:v21Text_(v21Pick_(row,managementMap,['教材類型'])),version:v21Text_(v21Pick_(row,managementMap,['版本'])),
      mainUrl:v21Text_(v21Pick_(row,managementMap,['檔案連結']))||v21Text_(v21Pick_(row,managementMap,['資料夾連結'])),
      folderUrl:v21Text_(v21Pick_(row,managementMap,['資料夾連結'])),audience:v21Text_(v21Pick_(row,managementMap,['適用對象'])),
      description:v21Text_(v21Pick_(row,managementMap,['備註'])),icon:'📘',updatedAt:v21Text_(v21Pick_(row,managementMap,['更新時間'])),source:PMO_V21.SHEETS.LEGACY_TRAINING};
    seen[id]=course;seenName[name.toLowerCase()]=course;result.push(course);
  });
  var articles=v21ReadSourceTable_(PMO_V21.SHEETS.LEGACY_TRAINING_ARTICLES), articleMap=v21HeaderMap_(articles.headers);
  articles.rows.forEach(function(row){
    var id=v21Text_(v21Pick_(row,articleMap,['教育訓練ID','訓練ID'])),name=v21Text_(v21Pick_(row,articleMap,['標題']));
    if(!id||!name||v21Text_(v21Pick_(row,articleMap,['狀態']))==='停用')return;
    var key='ARTICLE-'+id,duplicate=seenName[name.toLowerCase()];
    if(seen[key])return;
    if(duplicate){
      duplicate.description=duplicate.description||v21Text_(v21Pick_(row,articleMap,['說明','內容說明']));
      duplicate.tags=duplicate.tags||v21Text_(v21Pick_(row,articleMap,['備註']));
      duplicate.icon=duplicate.icon||v21Text_(v21Pick_(row,articleMap,['圖示']))||'📘';
      return;
    }
    var course={id:key,name:name,system:v21Text_(v21Pick_(row,articleMap,['分類'])),equipment:'',type:'內建教材',version:'',
      mainUrl:v21Text_(v21Pick_(row,articleMap,['連結'])),folderUrl:'',audience:'部門人員',
      description:v21Text_(v21Pick_(row,articleMap,['說明','內容說明'])),tags:v21Text_(v21Pick_(row,articleMap,['備註'])),
      icon:v21Text_(v21Pick_(row,articleMap,['圖示']))||'📘',updatedAt:v21Text_(v21Pick_(row,articleMap,['更新時間'])),source:PMO_V21.SHEETS.LEGACY_TRAINING_ARTICLES};
    seen[key]=course;seenName[name.toLowerCase()]=course;result.push(course);
  });
  var attachments=v21TrainingAttachments_(),quizCounts=v21TrainingCountByCourse_('TRAIN_測驗題庫','課程ID'),completionCounts=v21TrainingCountByCourse_('TRAIN_課程完成紀錄','課程ID');
  result.forEach(function(course){course.attachmentCount=(attachments[course.id]||[]).length;course.quizCount=quizCounts[course.id]||0;course.completionCount=completionCounts[course.id]||0;});
  return result.sort(function(a,b){return v21Text_(b.updatedAt).localeCompare(v21Text_(a.updatedAt))||a.name.localeCompare(b.name,'zh-Hant');});
}

function v21TrainingAttachments_() {
  var result={};
  [[v21ReadTable_(PMO_V21.SHEETS.TRAINING_ATTACHMENTS),false],[v21ReadSourceTable_(PMO_V21.SHEETS.LEGACY_TRAINING_ATTACHMENTS),true]].forEach(function(spec){
    var table=spec[0],map=v21HeaderMap_(table.headers);
    table.rows.forEach(function(row){
      if(v21Text_(v21Pick_(row,map,['狀態']))==='停用')return;
      var courseId=v21Text_(v21Pick_(row,map,['課程ID'])),url=v21Text_(v21Pick_(row,map,['連結/路徑','連結']));
      if(!courseId||!url)return;
      if(!result[courseId])result[courseId]=[];
      var id=v21Text_(v21Pick_(row,map,['附件ID']));
      if(result[courseId].some(function(item){return item.id===id&&id;}))return;
      result[courseId].push({id:id,title:v21Text_(v21Pick_(row,map,['標題']))||'附件',type:v21Text_(v21Pick_(row,map,['類型'])),url:url,mimeType:v21Text_(v21Pick_(row,map,['MimeType'])),updatedAt:v21Text_(v21Pick_(row,map,['更新時間','建立時間']))});
    });
  });
  return result;
}

function v21TrainingCountByCourse_(sheetName,keyHeader) {
  var table=v21ReadSourceTable_(sheetName),map=v21HeaderMap_(table.headers),result={};
  table.rows.forEach(function(row){var key=v21Text_(v21Pick_(row,map,[keyHeader]));if(key)result[key]=(result[key]||0)+1;});
  return result;
}

function getTrainingDetailV21(courseId) {
  return v21Safe_('GET_TRAINING_DETAIL', function() {
    var id=v21Text_(courseId),course=v21LoadTrainingCourses_().filter(function(item){return item.id===id;})[0];
    if(!course)throw new Error('找不到教育訓練教材。');
    var attachments=(v21TrainingAttachments_()[id]||[]).slice();
    var folderFiles=[];
    if(course.folderUrl) {
      try{folderFiles=v21ListFolderFiles_(DriveApp.getFolderById(v21ExtractDriveId_(course.folderUrl)),180);}catch(ignored){}
    }
    var attachedUrls={};attachments.forEach(function(item){attachedUrls[item.url]=true;});
    folderFiles=folderFiles.filter(function(item){return !attachedUrls[item.url];});
    return {course:course,attachments:attachments,folderFiles:folderFiles};
  });
}

function v21ListFolderFiles_(root,limit) {
  var stack=[{folder:root,path:root.getName(),depth:0}],files=[];
  while(stack.length&&files.length<limit) {
    var node=stack.pop(),iterator=node.folder.getFiles();
    while(iterator.hasNext()&&files.length<limit) {
      var file=iterator.next();files.push({id:file.getId(),name:file.getName(),url:file.getUrl(),mimeType:file.getMimeType(),category:v21FileKind_(file.getName(),file.getMimeType()),modified:Utilities.formatDate(file.getLastUpdated(),PMO_V21.TIME_ZONE,'yyyy-MM-dd HH:mm:ss'),path:node.path});
    }
    if(node.depth<4){var folders=node.folder.getFolders();while(folders.hasNext()){var child=folders.next();stack.push({folder:child,path:node.path+'/'+child.getName(),depth:node.depth+1});}}
  }
  return files.sort(function(a,b){return b.modified.localeCompare(a.modified);});
}

function saveTrainingCourseV21(payload) {
  return v21Safe_('SAVE_TRAINING', function(){
    payload=payload||{};var id=v21Text_(payload.id)||v21Id_('COURSE'),name=v21Text_(payload.name),projectId=v21Text_(payload.projectId),project=null;
    if(!name)throw new Error('課程名稱不得空白。');
    if(projectId){project=v21LoadProjects_().filter(function(item){return item.id===projectId;})[0];if(!project)throw new Error('關聯專案不存在。');}
    var current=v21LoadTrainingCourses_().filter(function(item){return item.id===id;})[0]||{},now=v21Now_();
    v21WithLock_(function(){v21UpsertObject_(PMO_V21.SHEETS.TRAINING,PMO_V21.HEADERS.TRAINING,'課程ID',{
      '課程ID':id,'課程名稱':name,'專案ID':projectId,'專案名稱':project?project.name:'','系統分類':v21Text_(payload.system),
      '設備分類':v21Text_(payload.equipment),'教材類型':v21Text_(payload.type)||'文件','版本':v21Text_(payload.version)||'V1',
      '主教材連結':v21Text_(payload.mainUrl),'資料夾連結':v21Text_(payload.folderUrl)||current.folderUrl||'','適用對象':v21Text_(payload.audience),
      '說明':v21Text_(payload.description),'狀態':'啟用','建立者':v21Text_(current.createdBy)||v21User_(),'建立時間':v21Text_(current.createdAt)||now,'更新時間':now
    });});
    v21Audit_('SAVE_TRAINING','教育訓練',id,'成功',name);return {id:id,name:name};
  });
}

function uploadTrainingAttachmentV21(payload) {
  return v21Safe_('UPLOAD_TRAINING_ATTACHMENT', function(){
    payload=payload||{};var courseId=v21Text_(payload.courseId),course=v21LoadTrainingCourses_().filter(function(item){return item.id===courseId;})[0];
    if(!course)throw new Error('找不到教育訓練課程。');
    var match=v21Text_(payload.dataUrl).match(/^data:([^;]+);base64,(.+)$/);if(!match)throw new Error('附件格式不正確。');
    var bytes=Utilities.base64Decode(match[2]);if(bytes.length>PMO_V21.MAX_UPLOAD_BYTES)throw new Error('單一附件不可超過 10 MB。');
    var folder=v21TrainingFolder_(course),filename=v21Text_(payload.filename).replace(/[\\/:*?"<>|]/g,'_')||('教材附件_'+new Date().getTime());
    var file=folder.createFile(Utilities.newBlob(bytes,match[1],filename)),id=v21Id_('TA'),now=v21Now_();
    v21WithLock_(function(){v21UpsertObject_(PMO_V21.SHEETS.TRAINING_ATTACHMENTS,PMO_V21.HEADERS.TRAINING_ATTACHMENTS,'附件ID',{
      '附件ID':id,'課程ID':courseId,'標題':v21Text_(payload.title)||filename,'類型':v21FileKind_(filename,match[1]),'連結':file.getUrl(),'MimeType':match[1],
      '建立者':v21User_(),'建立時間':now,'更新時間':now
    });
    if(!course.folderUrl)v21UpsertObject_(PMO_V21.SHEETS.TRAINING,PMO_V21.HEADERS.TRAINING,'課程ID',{
      '課程ID':courseId,'課程名稱':course.name,'專案ID':course.projectId||'','專案名稱':course.projectName||'','系統分類':course.system||'',
      '設備分類':course.equipment||'','教材類型':course.type||'文件','版本':course.version||'V1','主教材連結':course.mainUrl||'',
      '資料夾連結':folder.getUrl(),'適用對象':course.audience||'','說明':course.description||'','狀態':'啟用','建立者':v21User_(),'建立時間':now,'更新時間':now
    });});
    v21Audit_('UPLOAD_TRAINING_ATTACHMENT','教育訓練附件',id,'成功',courseId+' '+filename);return {id:id,url:file.getUrl(),name:filename};
  });
}

function v21TrainingFolder_(course) {
  if(course.folderUrl){var folderId=v21ExtractDriveId_(course.folderUrl);if(folderId)return DriveApp.getFolderById(folderId);}
  var parent=v21ProjectRoot_();
  if(course.projectId){var project=v21LoadProjects_().filter(function(item){return item.id===course.projectId;})[0];if(project&&project.folderUrl){parent=DriveApp.getFolderById(v21ExtractDriveId_(project.folderUrl));var standard=parent.getFoldersByName('06_教育訓練');parent=standard.hasNext()?standard.next():parent.createFolder('06_教育訓練');}}
  var safeName=(course.name+'_'+course.id).replace(/[\\/:*?"<>|]/g,'_'),matches=parent.getFoldersByName(safeName);
  return matches.hasNext()?matches.next():parent.createFolder(safeName);
}
