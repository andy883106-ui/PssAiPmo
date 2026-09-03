/** V22.4.0 related-item discovery and equipment-cover controls. */
function searchRelatedItemsV224(payload) {
  return v21Safe_('SEARCH_RELATED_ITEMS', function() {
    payload=payload||{};
    var query=v21Text_(payload.query).toLowerCase().replace(/\s+/g,' ').trim();
    if(query.length<2)return {query:query,items:[]};
    var projectId=v21Text_(payload.projectId),tokens=query.split(' ').filter(function(token){return token.length>=2;}),items=[];
    function score(text){text=v21Text_(text).toLowerCase();var value=0;tokens.forEach(function(token){if(text.indexOf(token)>=0)value+=text.indexOf(token)===0?4:2;});return value;}
    v21LoadWork_().forEach(function(item){var haystack=[item.title,item.completion,item.projectName,item.projectId,item.assignee,item.type,item.status].join(' '),rank=score(haystack);if(!rank)return;if(projectId&&item.projectId===projectId)rank+=3;items.push({kind:'work',id:item.id,projectId:item.projectId,projectName:item.projectName,title:item.title,content:item.completion,status:item.status,owner:item.assignee,date:item.updatedAt||item.dueDate||item.startDate,score:rank});});
    v21LoadReports_().forEach(function(item){var haystack=[item.title,item.completed,item.followUp,item.projectName,item.projectId,item.employee].join(' '),rank=score(haystack);if(!rank)return;if(projectId&&item.projectId===projectId)rank+=3;items.push({kind:'report',id:item.id,projectId:item.projectId,projectName:item.projectName,title:item.title,content:[item.completed,item.followUp?('後續：'+item.followUp):''].filter(Boolean).join('\n'),status:'工作回報',owner:item.employee,date:item.updatedAt||item.date,relatedWorkId:item.relatedWorkId,score:rank});});
    v21LoadProjects_().filter(function(item){return item.status!=='封存';}).forEach(function(item){var haystack=[item.id,item.name,item.customer,item.systemType,item.owner,item.status].join(' '),rank=score(haystack);if(!rank)return;items.push({kind:'project',id:item.id,projectId:item.id,projectName:item.name,title:item.name,content:[item.customer,item.systemType].filter(Boolean).join('｜'),status:item.status,owner:item.owner,date:item.updatedAt,score:rank});});
    items.sort(function(a,b){return b.score-a.score||v21Text_(b.date).localeCompare(v21Text_(a.date));});
    return {query:query,items:items.slice(0,24)};
  });
}

function setEquipmentCoverImageV224(payload) {
  return v21Safe_('SET_EQUIPMENT_COVER', function() {
    payload=payload||{};
    var itemId=v21Text_(payload.itemId),imageId=v21Text_(payload.imageId),images=v21EquipmentImages_(itemId),image=images.filter(function(item){return item.id===imageId;})[0];
    if(!image)throw new Error('找不到要設定為封面的設備圖片。');
    return v21WithLock_(function(){
      var item=v21LoadQuoteCatalogRaw_(true).filter(function(row){return row.id===itemId;})[0];
      if(!item)throw new Error('找不到設備品項。');
      v21UpsertObject_(PMO_V21.SHEETS.EQUIPMENT_MEDIA,PMO_V21.HEADERS.EQUIPMENT_MEDIA,'品項ID',{'品項ID':itemId,'圖片連結':image.url,'設備說明':item.note,'更新者':v21User_(),'更新時間':v21Now_()});
      v21Audit_('SET_EQUIPMENT_COVER','設備圖片',imageId,'成功',itemId+' '+image.url);
      return {itemId:itemId,imageId:imageId,imageUrl:image.url};
    });
  });
}

function v224EquipmentDownloadUrl_(url) {
  var id=v21ExtractDriveId_(url);
  return id?'https://drive.google.com/uc?export=download&id='+encodeURIComponent(id):v21Text_(url);
}
