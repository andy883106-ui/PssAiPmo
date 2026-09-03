/** Standard equipment-catalog import/export and seeded business quotation cases. */
function v21LegacyQuoteBaseRows_() {
  return [
    ['門禁工程','訪客設備','','訪客認證機','台',181427,4,725708,''],
    ['門禁工程','通關機','','單開翼閘(27)','台',117002,6,702012,'不鏽鋼製'],
    ['門禁工程','通關機','','雙開翼閘(27)','台',154028,0,0,'不鏽鋼製'],
    ['門禁工程','通關機','','閘機控制器','台',25918,6,155508,''],
    ['門禁工程','通關機','','QR掃瞄器','台',8146,6,48876,''],
    ['門禁工程','通關機','','身障人工進出門(含電磁鎖)','組',105154,2,210308,'暫估，需確認施作側'],
    ['門禁工程','電梯管制','','QR掃瞄器','台',8146,3,24438,'電梯用；匯入時與同名同單位設備合併'],
    ['門禁工程','電梯管制','','QRcode控制器','台',5924,3,17772,''],
    ['門禁工程','電梯管制','','電梯控制器&讀卡機','台',16291,3,48873,''],
    ['門禁工程','電梯管制','','電梯廠商管制修正','式',55539,1,55539,'暫估'],
    ['門禁工程','主機電腦','','伺服器管理主機','套',88862,1,88862,''],
    ['門禁工程','主機電腦','','訪客管理電腦','套',88862,1,88862,''],
    ['門禁工程','門禁設備','','門禁讀卡控制器','台',7390,1,7390,''],
    ['門禁工程','軟體','','雲端訪客系統管理軟體','套',51836,1,51836,''],
    ['門禁工程','軟體','','門禁管理軟體','套',51836,1,51836,''],
    ['門禁工程','門鈴對講','','單機版門鈴','台',2100,0,0,'辦公2區'],
    ['門禁工程','門鈴對講','','租戶網路對講子機','台',15551,0,0,''],
    ['門禁工程','系統整合','','門禁系統與停管設備整合費用','式',74052,1,74052,''],
    ['門禁工程','玻璃格間','','不鏽鋼框玻璃格間(現場訂製/含安裝費)','套',248500,4,994000,'一樓2處、二樓1處、三樓1處'],
    ['工程及其他','線材','','UTP CAT6 低煙無毒電腦線','米',23,6000,138000,'太平洋、鼎志、華榮或同等品'],
    ['工程及其他','線材','','UTP CAT6 非遮蔽多股絞線(電梯專用)','米',21,1275,26775,''],
    ['工程及其他','配線另料','','UTP 電腦線 配線另料','式',33323,1,0,''],
    ['工程及其他','線材','','4/C 1.25 mm2','米',23,5488,126213,'太平洋、華新麗華、大亞'],
    ['工程及其他','線材','','2.0x4','米',34,360,12240,''],
    ['工程及其他','配線另料','','PVC 絕緣銅導線 配線另料','式',11108,1,0,''],
    ['工程及其他','線材','','AWG22-4/C銅網鋁箔隔離控制電纜','米',16,330,5280,'太平洋、華新麗華、紀泰、通陽、大亞或同等品'],
    ['工程及其他','配線另料','','隔離控制電纜 配線另料另件','式',5924,1,0,''],
    ['工程及其他','配管','','直徑20mm(3/4\") x 1.8mmt','米',19,660,12540,'南亞或同等品'],
    ['工程及其他','配管','','直徑28mm(1\") x 2.7mmt','米',30,2925,87750,''],
    ['工程及其他','配管另件','','PVC 導線管 配管另件','式',18513,1,0,''],
    ['工程及其他','施工','','安裝測試','式',59242,1,0,''],
    ['工程及其他','工料','','另件另料雜項工料費','式',44431,1,0,'含管路吊架、角鐵、螺絲、五金、接線盒、油漆、標示、裝修開孔、防蝕處理等'],
    ['工程及其他','運搬','','運什費、倉儲、搬運、吊運費','式',37026,1,0,''],
    ['工程及其他','施工','','設備管線安裝、打鑿及復原施工工資','式',888624,1,0,''],
    ['工程及其他','清安','','清安費用','式',0,1,0,'']
  ];
}

function v21LegacyQuoteRows_() {
  var base=v21LegacyQuoteBaseRows_(),rows=[];
  var cases=[
    {source:'20231030_兆申產專B訪客.門鈴設備報價(合約價追加).pdf',date:'2023-10-30',owner:'兆申機電工程有限公司',site:'產專B',doorbellQty:64,doorbellAmount:134400,intercomQty:64,intercomAmount:995264,cleanPrice:33733,cleanAmount:33733,amounts:[49985,16662,8886,27770,303903,66647,55539,1332936]},
    {source:'1140627_兆申產專B訪客.門鈴設備報價追加(議價後).pdf',date:'2025-05-23',owner:'兆申機電工程有限公司',site:'產專B',doorbellQty:12,doorbellAmount:25200,intercomQty:-52,intercomAmount:-808652,cleanPrice:21836,cleanAmount:19259,amounts:[44086,14696,7837,24493,268042,58782,48985,1170435]}
  ];
  cases.forEach(function(info){
    var variableIndex=0;
    base.forEach(function(item){
      var row={group:item[0],category:item[1],code:item[2],name:item[3],unit:item[4],price:item[5],quantity:item[6],caseAmount:item[7],note:item[8],sourceFile:info.source,sourceDate:info.date,customer:info.owner,site:info.site,batch:'LEGACY-QUOTE-20260814'};
      if(row.name==='單機版門鈴'){row.quantity=info.doorbellQty;row.caseAmount=info.doorbellAmount;}
      if(row.name==='租戶網路對講子機'){row.quantity=info.intercomQty;row.caseAmount=info.intercomAmount;}
      if(row.name==='清安費用'){row.price=info.cleanPrice;row.caseAmount=info.cleanAmount;}
      if(['UTP 電腦線 配線另料','PVC 絕緣銅導線 配線另料','隔離控制電纜 配線另料另件','PVC 導線管 配管另件','安裝測試','另件另料雜項工料費','運什費、倉儲、搬運、吊運費','設備管線安裝、打鑿及復原施工工資'].indexOf(row.name)>=0){row.caseAmount=info.amounts[variableIndex];variableIndex+=1;}
      rows.push(row);
    });
  });
  return rows;
}

function v21ImportLegacyQuoteSeeds_() {
  var settingRows=v21ReadCanonicalObjects_(PMO_V21.SHEETS.SETTINGS,PMO_V21.HEADERS.SETTINGS),already=settingRows.some(function(row){return v21Text_(row['設定鍵'])==='LEGACY_QUOTE_SEEDS'&&v21Text_(row['設定值'])==='2026-08-14-V2';});
  if(already)return {skipped:true};
  var result=v21ImportQuoteCatalogRows_(v21LegacyQuoteRows_(),'內建業務報價案例');
  v21UpsertObject_(PMO_V21.SHEETS.SETTINGS,PMO_V21.HEADERS.SETTINGS,'設定鍵',{'設定鍵':'LEGACY_QUOTE_SEEDS','設定值':'2026-08-14-V2','說明':'產專B 2023/2025 報價設備與價格案例；以去重規則匯入','更新時間':v21Now_()});
  return result;
}

function importLegacyQuoteCatalogV21(payload) {
  return v21Safe_('IMPORT_LEGACY_QUOTE_CATALOG',function(){if(v21Text_(payload&&payload.confirmToken)!==PMO_V21.LEGACY_QUOTE_IMPORT_CONFIRM_TOKEN)throw new Error('缺少舊報價匯入確認碼。');return v21WithLock_(function(){return v21ImportQuoteCatalogRows_(v21LegacyQuoteRows_(),'內建業務報價案例');});});
}

function v21NormalizeQuoteImportRow_(row,index) {
  row=row||{};
  function pick(keys){for(var i=0;i<keys.length;i+=1){var value=row[keys[i]];if(value!==undefined&&value!==null&&String(value).trim()!=='')return value;}return '';}
  return {group:v21Text_(pick(['大分類','group'])),category:v21Text_(pick(['分類','category'])),code:v21Text_(pick(['品號','code','SKU'])),name:v21Text_(pick(['品名規格','品名／規格','設備名稱','name'])),unit:v21Text_(pick(['單位','unit']))||'式',cost:v21Number_(pick(['成本單價','cost'])),price:v21Number_(pick(['建議報價單價','價錢','單價','price'])),supplier:v21Text_(pick(['供應商','supplier'])),note:v21Text_(pick(['備註','note'])),sortKeyword:v21Text_(pick(['排序關鍵字','keyword'])),sourceFile:v21Text_(pick(['案例來源','來源檔案','source'])),sourceDate:v21Date_(pick(['案例日期','來源報價日','date'])),customer:v21Text_(pick(['業主','客戶','customer'])),site:v21Text_(pick(['工程地點','專案場地','site'])),quantity:v21Number_(pick(['案例數量','數量','quantity'])),casePrice:v21Number_(pick(['案例單價','casePrice']))||v21Number_(pick(['建議報價單價','價錢','單價','price'])),caseAmount:v21Number_(pick(['案例金額','金額','amount'])),batch:v21Text_(pick(['匯入批次','batch']))||('USER-'+v21Today_()),rowNumber:index+2};
}

function previewQuoteCatalogImportV21(payload) {
  return v21Safe_('PREVIEW_QUOTE_CATALOG_IMPORT',function(){var rows=(Array.isArray(payload&&payload.rows)?payload.rows:[]).slice(0,1000).map(v21NormalizeQuoteImportRow_).filter(function(row){return row.name;}),existing=v21LoadQuoteCatalogRaw_(true),keys={};existing.forEach(function(item){keys[v21QuoteDuplicateKey_(item)]=item.id;});var inputKeys={},newCount=0,updateCount=0,duplicates=0;rows.forEach(function(row){var key=v21QuoteDuplicateKey_(row);if(inputKeys[key])duplicates+=1;else inputKeys[key]=true;if(keys[key])updateCount+=1;else{newCount+=1;keys[key]='NEW';}});return {sourceRows:rows.length,uniqueRows:Object.keys(inputKeys).length,newItems:newCount,updateItems:updateCount,duplicateInputRows:duplicates,confirmToken:PMO_V21.QUOTE_CATALOG_IMPORT_CONFIRM_TOKEN};});
}

function importQuoteCatalogV21(payload) {
  return v21Safe_('IMPORT_QUOTE_CATALOG',function(){payload=payload||{};if(v21Text_(payload.confirmToken)!==PMO_V21.QUOTE_CATALOG_IMPORT_CONFIRM_TOKEN)throw new Error('缺少設備清單匯入確認碼。');var rows=(Array.isArray(payload.rows)?payload.rows:[]).slice(0,1000).map(v21NormalizeQuoteImportRow_).filter(function(row){return row.name;});if(!rows.length)throw new Error('匯入檔沒有可用設備資料。');return v21WithLock_(function(){return v21ImportQuoteCatalogRows_(rows,v21Text_(payload.sourceName)||'設備清單匯入');});});
}

function v21ImportQuoteCatalogRows_(rows,sourceLabel) {
  var raw=v21LoadQuoteCatalogRaw_(true),byKey={},now=v21Now_(),created=0,updated=0,history=0,inputSeen={};
  raw.forEach(function(item){var key=v21QuoteDuplicateKey_(item),current=byKey[key];if(!current||(current.status==='封存'&&item.status!=='封存')||v21Text_(item.updatedAt)>v21Text_(current.updatedAt))byKey[key]=item;});
  (rows||[]).forEach(function(source,index){var row=source.name?source:v21NormalizeQuoteImportRow_(source,index);if(!row.name)return;var key=v21QuoteDuplicateKey_(row),item=byKey[key],id=item?item.id:('EQ-IMP-'+v21Hash_(key)),createdAt=item&&item.createdAt?item.createdAt:now,price=row.price||row.casePrice||Number(item&&item.price||0),cost=row.cost||Number(item&&item.cost||0),group=(item&&item.group)||row.group,category=(item&&item.category)||row.category;v21UpsertObject_(PMO_V21.SHEETS.QUOTE_ITEMS,PMO_V21.HEADERS.QUOTE_ITEMS,'品項ID',{'品項ID':id,'來源品項ID':item?(item.sourceItemId||item.id):'','大分類':group,'分類':category,'品號':row.code||(item&&item.code)||'','品名規格':row.name||(item&&item.name)||'','單位':row.unit||(item&&item.unit)||'式','成本單價':cost,'建議報價單價':price,'供應商':row.supplier||(item&&item.supplier)||'','備註':row.note||(item&&item.note)||'','圖片連結':(item&&item.imageUrl)||'','狀態':'啟用','排序關鍵字':row.sortKeyword||(item&&item.sortKeyword)||v21QuoteKeyword_(row.name,row.code),'建立者':item&&item.createdBy?item.createdBy:v21User_(),'建立時間':createdAt,'更新時間':now});if(item)updated+=inputSeen[key]?0:1;else created+=1;inputSeen[key]=true;byKey[key]={id:id,sourceItemId:item?(item.sourceItemId||item.id):'',group:group,category:category,code:row.code||(item&&item.code)||'',name:row.name||(item&&item.name)||'',unit:row.unit||(item&&item.unit)||'式',cost:cost,price:price,supplier:row.supplier||(item&&item.supplier)||'',note:row.note||(item&&item.note)||'',imageUrl:(item&&item.imageUrl)||'',status:'啟用',sortKeyword:row.sortKeyword||(item&&item.sortKeyword)||'',createdBy:item&&item.createdBy?item.createdBy:v21User_(),createdAt:createdAt,updatedAt:now};if(row.sourceFile||row.sourceDate||row.casePrice||row.caseAmount){var caseId='PRICE-'+v21Hash_([id,row.sourceFile,row.sourceDate,row.casePrice||price,row.caseAmount,row.quantity,row.note,row.category].join('|'));v21UpsertObject_(PMO_V21.SHEETS.EQUIPMENT_PRICE_HISTORY,PMO_V21.HEADERS.EQUIPMENT_PRICE_HISTORY,'案例ID',{'案例ID':caseId,'品項ID':id,'來源檔案':row.sourceFile||sourceLabel,'來源報價日':row.sourceDate,'業主':row.customer,'工程地點':row.site,'品號':row.code,'品名規格':row.name,'單位':row.unit,'數量':row.quantity,'案例單價':row.casePrice||price,'案例金額':row.caseAmount,'備註':row.note,'匯入批次':row.batch||sourceLabel,'建立者':v21User_(),'建立時間':now});history+=1;}});
  v21Audit_('IMPORT_QUOTE_CATALOG','報價設備','BATCH','成功',JSON.stringify({source:sourceLabel,rows:rows.length,created:created,updated:updated,priceCases:history}));return {source:sourceLabel,sourceRows:rows.length,createdItems:created,updatedItems:updated,priceCases:history,uniqueItems:Object.keys(inputSeen).length,deduplicatedRows:rows.length-Object.keys(inputSeen).length};
}

function exportQuoteCatalogV21() {
  return v21Safe_('EXPORT_QUOTE_CATALOG',function(){var historyRows=v21ReadCanonicalObjects_(PMO_V21.SHEETS.EQUIPMENT_PRICE_HISTORY,PMO_V21.HEADERS.EQUIPMENT_PRICE_HISTORY),historyByItem={};historyRows.forEach(function(row){var id=v21Text_(row['品項ID']);if(!historyByItem[id]||v21Text_(row['來源報價日'])>v21Text_(historyByItem[id]['來源報價日']))historyByItem[id]=row;});var headers=['大分類','分類','品號','品名規格','單位','成本單價','建議報價單價','供應商','備註','排序關鍵字','案例來源','案例日期','業主','工程地點','案例數量','案例單價','案例金額'];var rows=v21LoadQuoteCatalog_(false).map(function(item){var history=historyByItem[item.id]||{};return [item.group,item.category,item.code,item.name,item.unit,item.cost,item.price,item.supplier,item.note,item.sortKeyword,v21Text_(history['來源檔案']),v21Date_(history['來源報價日']),v21Text_(history['業主']),v21Text_(history['工程地點']),v21Number_(history['數量']),v21Number_(history['案例單價']),v21Number_(history['案例金額'])];});return {filename:'PSS_報價設備主檔_'+v21Today_()+'.csv',headers:headers,rows:rows,total:rows.length};});
}
