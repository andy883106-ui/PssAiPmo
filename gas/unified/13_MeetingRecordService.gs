/** Imported meeting minutes and idempotent one-time seed for the 2026-08-13 project meeting. */
function importMeetingRecord20260813V21() {
  return v21Safe_('IMPORT_MEETING_RECORD_20260813', function() {
    return v21WithLock_(function() {
      var source=v21MeetingRecord20260813Data_(),projects=v21LoadProjects_(),existing=v21LoadMeetingRecords_(),existingIds={},matched=0;
      existing.forEach(function(item){existingIds[item.id]=true;});
      var importedAt=v21Now_(),rows=source.map(function(item){
        var projectId=v21ResolveMeetingProjectId_(item.projectName,projects);if(projectId)matched+=1;
        return {'紀錄ID':item.id,'會議日期':'2026-08-13','會議時間':'09:30','主持人':'陳彥均','參與人員':'簡宏義、黃侯諴、陳彥均、張亭媛',
          '分類':item.section,'序號':item.number,'專案ID':projectId,'專案名稱':item.projectName,'事項':item.title,'負責人':item.assignee,
          '期限':item.dueDate,'原始狀態':item.originalStatus,'追蹤狀態':v21MeetingRecordTrackingStatus_(item.originalStatus),
          '主管決議與執行情形':item.decision,'來源檔案':'PSS 2026_08_13 專案會議會報－會議紀錄 V2.docx','來源版本':'V2','匯入時間':importedAt};
      });
      v21BulkUpsert_(PMO_V21.SHEETS.MEETING_RECORDS,PMO_V21.HEADERS.MEETING_RECORDS,'紀錄ID',rows);
      var inserted=rows.filter(function(row){return !existingIds[row['紀錄ID']];}).length,updated=rows.length-inserted;
      v21Audit_('IMPORT_MEETING_RECORD_20260813','週四會議','2026-08-13','成功',JSON.stringify({total:rows.length,inserted:inserted,updated:updated,matchedProjects:matched}));
      return {meetingDate:'2026-08-13',total:rows.length,inserted:inserted,updated:updated,matchedProjects:matched,archive:v21GetLatestMeetingArchive_()};
    });
  });
}

function v21LoadMeetingRecords_() {
  var sheet=v21GetSheet_(PMO_V21.SHEETS.MEETING_RECORDS,false);
  if(!sheet||sheet.getLastRow()<=1)return [];
  var table=v21ReadTable_(PMO_V21.SHEETS.MEETING_RECORDS),map=v21HeaderMap_(table.headers);
  return table.rows.map(function(row){
    var id=v21Text_(v21Pick_(row,map,['紀錄ID']));if(!id)return null;
    return {id:id,meetingDate:v21Date_(v21Pick_(row,map,['會議日期'])),meetingTime:v21Text_(v21Pick_(row,map,['會議時間'])),
      host:v21Text_(v21Pick_(row,map,['主持人'])),participants:v21Text_(v21Pick_(row,map,['參與人員'])),section:v21Text_(v21Pick_(row,map,['分類'])),
      number:v21Number_(v21Pick_(row,map,['序號'])),projectId:v21Text_(v21Pick_(row,map,['專案ID'])),projectName:v21Text_(v21Pick_(row,map,['專案名稱'])),
      title:v21Text_(v21Pick_(row,map,['事項'])),assignee:v21Text_(v21Pick_(row,map,['負責人'])),dueDate:v21Text_(v21Pick_(row,map,['期限'])),
      originalStatus:v21Text_(v21Pick_(row,map,['原始狀態'])),trackingStatus:v21NormalizeStatus_(v21Pick_(row,map,['追蹤狀態'])),
      decision:v21Text_(v21Pick_(row,map,['主管決議與執行情形'])),sourceFile:v21Text_(v21Pick_(row,map,['來源檔案'])),
      sourceVersion:v21Text_(v21Pick_(row,map,['來源版本'])),importedAt:v21Text_(v21Pick_(row,map,['匯入時間']))};
  }).filter(Boolean);
}

function v21MeetingRecordsAsWork_() {
  return v21LoadMeetingRecords_().filter(function(item){return PMO_V21.ACTIVE_STATUSES.indexOf(item.trackingStatus)>=0;}).map(function(item){
    return {id:item.id,projectId:item.projectId,projectName:item.projectName,title:item.title,type:'週四會議匯入',assignee:item.assignee,
      collaborator:'',priority:'一般',startDate:item.meetingDate,dueDate:v21MeetingLastDate_(item.dueDate),status:item.trackingStatus,progress:0,
      completion:item.decision,attachment:'',sourceSheet:PMO_V21.SHEETS.MEETING_RECORDS,sourceId:item.id,createdAt:item.importedAt,updatedAt:item.importedAt,
      meetingGroup:v21MeetingRecordGroup_(item.section),originalStatus:item.originalStatus};
  });
}

function v21GetLatestMeetingArchive_() {
  var records=v21LoadMeetingRecords_();if(!records.length)return null;
  var latest=records.reduce(function(value,item){return item.meetingDate>value?item.meetingDate:value;},''),selected=records.filter(function(item){return item.meetingDate===latest;});
  var order={'上週追蹤':0,'本週派工':1,'下週安排':2,'會議交代':3},sections={'上週追蹤':[],'本週派工':[],'下週安排':[],'會議交代':[]};
  selected.sort(function(a,b){return (order[a.section]||0)-(order[b.section]||0)||a.number-b.number;});
  selected.forEach(function(item){if(!sections[item.section])sections[item.section]=[];sections[item.section].push(item);});
  var first=selected[0]||{};
  return {meetingId:v21MeetingMasterId_(latest),meetingDate:latest,meetingTime:first.meetingTime,host:first.host,participants:first.participants,total:selected.length,sourceFile:first.sourceFile,
    sourceVersion:first.sourceVersion,importedAt:first.importedAt,sections:sections,counts:Object.keys(sections).reduce(function(result,key){result[key]=sections[key].length;return result;},{})};
}

function v21MeetingMasterId_(meetingDate) {
  return 'MTG-' + v21Date_(meetingDate).replace(/-/g,'');
}

function v21MeetingRecordTrackingStatus_(status) {
  var text=v21Text_(status);
  if(text==='取消'||text==='已取消'||text==='無須追蹤')return '無須追蹤';
  if(/已完成|完成$/.test(text)&&!/進行中/.test(text))return '完成';
  if(/進行中|處理中/.test(text))return '目前處理';
  return '事項';
}

function v21MeetingRecordGroup_(section) {
  return {'上週追蹤':'上週追蹤','本週派工':'本週未完成','下週安排':'未來7日安排','會議交代':'會議新增'}[v21Text_(section)]||'會議新增';
}

function v21MeetingLastDate_(value) {
  var matches=String(value||'').match(/20\d{2}[\/-]\d{1,2}[\/-]\d{1,2}/g)||[];
  return matches.length?v21Date_(matches[matches.length-1]):'';
}

function v21ResolveMeetingProjectId_(projectName,projects) {
  var raw=v21Text_(projectName);if(!raw||/^(一般|部門週報|一般管理)/.test(raw))return '';
  var aliases={'大晟停車場':'大晟','內湖國泰醫院':'內湖國泰醫院','國泰中壢石頭段大樓':'石頭段','國泰中壢石頭段':'石頭段',
    '新竹國泰醫院':'新竹國泰醫院','國泰台南大豐段':'大豐段','國泰土城沛坡':'沛坡','中友百貨':'中友','彰化中友百貨':'中友',
    '國泰北大產研中心':'北大','國泰臺北大學建國校區產業研發中心':'北大','大巨蛋SOGO':'SOGO','城市車旅機器人':'城市車旅',
    '竑穗機器人':'竑穗','國泰小檜溪':'小檜溪','國泰信義（微風）置地':'微風','國泰錦中段':'錦中段','新竹普生':'普生',
    '亞大附醫霧峰':'亞大','國泰松仁':'松仁','國泰信義經貿':'信義經貿','國泰產專B':'產專B','國泰產專B大樓':'產專B','LALAPO':'LALAPO'};
  var key=aliases[raw]||raw,normalized=v21MeetingKeyText_(key),exact='',partial=[];
  (projects||[]).forEach(function(project){var name=v21MeetingKeyText_(project.name),id=v21Text_(project.id);if(!id||!name)return;if(name===normalized)exact=id;else if(name.indexOf(normalized)>=0||normalized.indexOf(name)>=0)partial.push(id);});
  return exact||(partial.length===1?partial[0]:'');
}

function v21MeetingKeyText_(value) {
  return v21Text_(value).toLowerCase().replace(/臺/g,'台').replace(/[【】\[\]（）()_\-\s]/g,'');
}

function v21MeetingRecord20260813Data_() {
  var rows=[
    ['TRACK',1,'大晟停車場','電腦啟用日與停管資料','業務/陳彥均','2026-08-13','卡關','確認缺件期限、啟用條件及是否暫緩上線。業務已多次追蹤，業主仍在上線申請停車證資料，業務回覆待補。（已整合原第1、2項重複紀錄）'],
    ['TRACK',2,'內湖國泰醫院','慢連箋繳費機1台','陳彥均/林佑安','2026-08-13','已完成','確認交貨、安裝及功能測試。業務已帶 RD 測試驗測完成。'],
    ['TRACK',3,'一般管理_PARKING 模具','繪圖教育訓練課程圖面及歸檔','簡宏義','2026-08-13','已完成','確認繪圖教育訓練課程圖面及資料已提交，並回報雲端／公司 NAS 歸檔位置。'],
    ['TRACK',4,'國泰中壢石頭段大樓','石頭段交付與圖面檢視','簡宏義','2026-08-13','已完成','原預計 8/11 交付已完成，阿諴交付與宏義要圖檢視。'],
    ['TRACK',5,'新竹國泰醫院','復健療程繳費機1台','陳彥均/林佑安','2026-08-13','已完成','確認交貨、安裝及功能測試。已完成後續業務處理。'],
    ['TRACK',6,'國泰台南大豐段','圖面交付確認','簡宏義','2026-08-13','已完成','確認圖面已正式交付副總，並完成雲端／NAS 歸檔。'],
    ['TRACK',7,'國泰土城沛坡','SC-LC光纖跳線與HUB連結','黃侯諴/廠商','未指定','待採購料件安裝','追蹤 SC-LC×4 到貨，完成光轉、HUB 連結與連線測試。黃侯諴 8/13 回報，廠商請料紀錄待補。'],
    ['TRACK',8,'中友百貨','彰化中友百貨圖面交付','簡宏義','2026-08-13','已完成','已交付副總圖面。（與本週派工重複項合併歸檔）'],
    ['TRACK',9,'國泰北大產研中心','安全島電源與繳費機新位置','業務/水電/陳彥均/黃侯諴','未指定','已完成','業務完成新位置電源／網路補報價與簽呈。原合約位置管線已配置定位；停管出入口設備結線及設定均已完成。'],
    ['TRACK',10,'國泰北大產研中心','門禁與停管施工範圍','黃侯諴/業務/營造/台建','未指定','待確認','確認門框開孔、電鎖安裝、通關機施工及繳費機生產排程日期。黃侯諴 8/13 回報。'],
    ['TRACK',11,'大巨蛋SOGO','車位資料路徑測試','黃侯諴/業務','未指定','待外部回覆','指定外部窗口及複測期限。8/10 測試回報。'],
    ['TRACK',12,'城市車旅機器人','請款進度與預計入帳日','業務','2026-08-13','請款進行中','確認請款文件、送件日及預計入帳日。待業務回覆。'],
    ['TRACK',13,'竑穗機器人','請款進度與驗收','業務','2026-08-13','請款進行中','確認驗收、請款文件及預計入帳日。待業務回覆進行中；陽明目前預計 11 月開場，國美目前未提供時間。'],
    ['TRACK',14,'國泰土城沛坡','機器人暫緩使用正式處理','業務/陳彥均','2026-08-13','待業主確認','確認追機器人暫緩使用書面紀錄。已取得業主暫緩通知，現場設備暫不學習並定期充電巡檢。（已整合原第4、16、24項）'],
    ['TRACK',15,'國泰小檜溪','追加工程、報價、施工、驗收及請款範圍','業務/陳彥均','2026-08-13','待業務確認','建立追加清單、報價日、施工日及請款日。業務回覆待補。'],
    ['TRACK',16,'國泰中壢石頭段','8～9月工作、會議日期、備貨／訂單、預算及水電責任','業務/陳彥均/張友山','2026-08-13','已完成','確認四組專代、預算差異、水電界面、報價與訂單期限。請阿諴與宏義拿圖確認實際配置是否不一樣。'],
    ['TRACK',17,'國泰信義（微風）置地','專案階段、合約／會勘／設計狀態與啟動日','業務/PM','2026-08-13','待簽訂合約與開專案啟動會議','指定業務與 PM；確認首次專案會議、圖面／報價／現場需求清單。待業務回覆，業主未回覆。'],
    ['TRACK',18,'國泰錦中段','圖面水電報價事項處理','業務/PM/簡宏義','2026-08-13','進行中','圖面已提交阿諴。待業務簽呈，水電報價回簽。'],
    ['TRACK',19,'新竹普生','驗收日期、缺失清單與驗收文件','業務/PM','2026-08-13','已驗收請款進行中','鎖定驗收日及缺失改善期限。業務回覆待補。'],
    ['TRACK',20,'亞大附醫霧峰','2台批價機與CCTV立柱','陳彥均/台中工程師','未指定','已完成','排定新品重裝、測試與驗收日；關閉重複待處理任務。8/6 交貨、安裝、網路與程式啟動正常已完成。'],
    ['TRACK',21,'國泰土城沛坡','6F自動門介面','黃侯諴/自動門廠商','未指定','進行中','完成送訊號測試並歸檔介面與責任分工紀錄。黃侯諴 8/13 回報。'],
    ['TRACK',22,'國泰松仁','專案階段、合約／會勘／設計狀態、8～9月工作面、預計啟動日','業務/PM','2026-08-13','待簽訂合約與開專案啟動會議','指定業務與 PM；確認首次專案會議、圖面／報價／現場需求清單。業務回覆待補，業主未回覆。'],
    ['TRACK',23,'國泰信義經貿','正式啟用日、啟用前測試及請款條件','業務/PM','2026-08-13','已完成','鎖定啟用日、測試清單及請款文件期限。預計 9 月初安排設備啟用前測試。'],
    ['TRACK',24,'一般','通關機軸承設定資料','黃侯諴','未指定','已完成','製作操作設定說明資料。已完成給副總。'],
    ['TRACK',25,'LALAPO','停車場掃地機器人預計9月底完成','黃侯諴','未指定','進行中','9 月確認業主訂單及設備出貨安排。目前待業務通知。'],
    ['CURRENT',1,'部門週報','週報填寫與歸檔','簡宏義／黃侯諴','2026-08-13','已完成','簡宏義、黃侯諴補齊本週回報狀況；張亭媛取消本項追蹤。提醒：宏義圖面繪製完需同步資料到公司 NAS 資料夾。'],
    ['CURRENT',2,'中友百貨','停管與管線圖面','簡宏義/陳彥均','2026-08-13','已完成','同步完成狀態並補審圖結果。任務 8/10 已完成，圖面已交付副總。（整合上週第10項與本週第2項）'],
    ['CURRENT',5,'國泰產專B','玻璃帷幕通關機','陳彥均/業務','2026-08-13','取消','取得書面回覆並確認安裝或暫存方式。缺業主書面回覆。'],
    ['CURRENT',6,'國泰產專B','話機安裝','黃侯諴/台建','2026-08-13','進行中','完成話機安裝、通訊測試並留存照片。設備載運回覆。下週繼續追蹤。'],
    ['CURRENT',7,'國泰臺北大學建國校區產業研發中心','施工進場','黃侯諴','2026-08-13','已完成','由會議事項 MI-0a658c70-f66 延續。'],
    ['CURRENT',8,'國泰產專B大樓','3F門禁完工補拍與電梯網路後續追蹤','黃侯諴','2026-08-13','已完成','8/7 限高架及立招線路完成；8/12 北側／南側通關機完成點驗；8/12 已通報月半鋼鐵取消玻璃帷幕施作。'],
    ['NEXT',1,'國泰產專B大樓','設備載運與簽收','黃侯諴','2026-08-17','未開始','8/17 依未出設備明細安排設備載運並核對現場簽收。'],
    ['NEXT',2,'國泰小檜溪','對講機網路線延伸','黃侯諴','2026-08-18','進行中','8/18 完成線路延伸、通訊測試及照片回報。已確認 8/18 09:00-12:00 施工時段。'],
    ['NEXT',3,'國泰北大產研中心','施工自檢表填寫與驗收','黃侯諴/業務','2026-08-14 / 2026-08-21','進行中','業務完成表單修改後提供最新版；8/14 黃侯諴填寫自檢表交業務，8/21 完成驗收。（已整合原下一週第3、6項重複紀錄）'],
    ['NEXT',4,'國泰北大產研中心','監視器與設備採購進度追蹤','陳彥均','2026-08-28','進行中','追蹤請購、設備到貨與出貨時間安排。8/7 IP 回報。（已整合原本週第8項與下一週第4項）'],
    ['NEXT',5,'國泰產專B','設定進場查驗','黃侯諴/台建/相關單位','2026-08-17','已排程','8/17 完成設定、功能測試與查驗，回填結果、照片及缺失清單。黃侯諴 8/13 回報。'],
    ['NEXT',6,'國泰中壢石頭段大樓','報價單進度確認','陳彥均','2026-08-19','未開始','對業主報價的報價單進度確認是否找安仔還是外包。由會議事項 MI-624e6569-0de 延續。'],
    ['NEXT',7,'城市車旅機器人','巡查與再教育訓練','業務/財務','2026-08-20','未開始','請款進度正在進行，交代特助 8/13 後請阿諴安排時間各場巡查、再教育訓練一次。']
  ];
  var sections={TRACK:'上週追蹤',CURRENT:'本週派工',NEXT:'下週安排',HANDOFF:'會議交代'};
  return rows.map(function(row){return {id:'MR-20260813-'+row[0]+'-'+('0'+row[1]).slice(-2),section:sections[row[0]],number:row[1],projectName:row[2],title:row[3],assignee:row[4],dueDate:row[5],originalStatus:row[6],decision:row[7]};});
}
