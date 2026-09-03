/**
 * PSS AI-PMO V17 Enterprise
 * 以 2026/06/30 穩定版核心重建，對應目前 PSS_AI_PMO_專案管理平台試算表。
 */
const APP = Object.freeze({
  VERSION: 'V20.5 R5.0 Lark Workspace',
  TZ: 'Asia/Taipei',
  DB_ID: '11ndvBcV0geEF7oJv1kX28BuC4_kAKnl37wUhL-Rx27g',
  PROGRESS_DB_ID: '1Oh2pnlZwusM7E-CKMr-eYYYOToTzHtJge_2yiqEypcM',
  CLOUD_ROOT_ID: '16X3LA9YCYPUaNr5ClIcDk9uFqsI3girF',
  BUSINESS_ROOT_ID: '13_xc_b76zEFaabOcjOqedMYY_AGoxZkX',
  SESSION_PREFIX: 'PSS_V17_SESSION_',
  SESSION_SECONDS: 43200,
  LOGIN_FAIL_LIMIT: 5,
  LOCK_MINUTES: 15,
  PROJECT_CACHE_SECONDS: 600,

  SHEETS: Object.freeze({
    ACCOUNTS: ['人員帳號', '帳號管理'],
    PEOPLE: ['人員資料', '人員清單'],
    PROJECTS: ['專案清單'],
    TASKS: ['任務派工'],
    DAILY_LOGS: ['每日工作日誌'],
    EVENT_REPORTS: ['事件回報'],
    ANNOUNCEMENTS: ['公告欄', '公佈欄'],
    DOCUMENTS: ['常用文件檔案', '常用文件'],
    TRAINING: ['教育訓練管理', '教育訓練'],
    TRAINING_CATEGORIES: ['教育訓練分類'],
    OP_LOG: ['操作紀錄'],
    DRAWINGS: ['圖面管理'],
    CLOUD_INDEX: ['雲端索引'],
    KPI: ['KPI統計', 'KPI統'],
    DASHBOARD: ['Dashboard'],
    DATABASE_CONFIG: ['資料庫設定'],
    DRIVE_CONFIG: ['雲端設定'],
    NOTIFY_CONFIG: ['通知設定'],
    NOTIFY_LOG: ['通知紀錄'],
    DATA_DICTIONARY: ['資料字典'],
    ASSETS: ['設備主檔'],
    SERVICES: ['服務主檔'],
    CONFIG_ITEMS: ['設定主檔'],
    CONFIG_HISTORY: ['設定異動紀錄'],
    DEPLOYMENTS: ['部署紀錄'],
    MAINTENANCE: ['維護異常'],
    QUOTE_ITEMS: ['報價品項主檔'],
    QUOTE_CATEGORIES: ['報價分類'],
    QUOTE_HISTORY: ['報價歷史價格'],
    QUOTE_SETTINGS: ['報價系統設定'],
    QUOTE_LOGS: ['報價同步紀錄'],
    QUOTE_MASTER: ['報價單主檔'],
    QUOTE_LINES: ['報價單明細'],
    FIELD_AUDIT: ['欄位使用稽核']
  }),

  PROJECT_SUBFOLDERS: Object.freeze([
    '01_合約訂單銷貨驗收文件',
    '02_圖面資料',
    '03_專案追蹤記錄',
    '04_施工照片',
    '05_驗收文件',
    '06_教育訓練',
    '07_請款文件'
  ])
});

const FIELD_ALIASES = Object.freeze({
  '使用者ID': ['使用者ID', '帳號ID', '人員ID'],
  '權限等級': ['權限等級', '權限'],
  '最後登入時間': ['最後登入時間', '最後登入'],
  '派工人員': ['派工人員', '派工主管'],
  'PM': ['PM', '負責PM'],
  '雲端資料夾': ['雲端資料夾', '雲端總資料夾', 'Drive資料夾連結'],
  '附件連結': ['附件連結', '照片/附件', '照片/附件上傳', '施工照片連結'],
  '任務ID': ['任務ID', '事件ID'],
  '回報事項': ['回報事項', '今日完成事項', '完成事項'],
  '明日計畫': ['明日計畫', '後續事項'],
  '教材ID': ['教材ID', '教育訓練ID', '訓練ID'],
  '教材名稱': ['教材名稱', '標題'],
  '系統分類': ['系統分類', '分類', '主項目'],
  '設備分類': ['設備分類', '次項目'],
  '教材說明': ['教材說明', '說明', '內容說明', '備註'],
  '檔案連結': ['檔案連結', '附件連結', '連結'],
  '資料夾連結': ['資料夾連結', '連結'],
  '文件名稱': ['文件名稱', '名稱'],
  '路徑': ['路徑', '網址', '連結']
});

const ROLE_MANAGER = Object.freeze(['PM', '課長', '副理', '主管', '經理', '系統管理員']);
const PERMISSION_MANAGER = Object.freeze(['主管', '管理員', '系統管理員']);
/* R4.3 cleanup: removed shadowed legacy function getDb_. */

/* R4.3 cleanup: removed shadowed legacy function getProgressDb_. */

function normalizeHeader_(value) {
  return String(value === null || value === undefined ? '' : value)
    .replace(/\s+/g, '')
    .replace(/[（）()]/g, '')
    .toLowerCase()
    .trim();
}

function clean_(value) {
  return String(value === null || value === undefined ? '' : value).trim();
}

function candidates_(keyOrNames) {
  if (Array.isArray(keyOrNames)) return keyOrNames;
  return APP.SHEETS[keyOrNames] || [keyOrNames];
}

/* R4.3 cleanup: removed shadowed legacy function getSheet_. */

function getOrCreateSheet_(keyOrNames, headers) {
  const ss = getDb_();
  let sh = getSheet_(keyOrNames, false);
  if (!sh) sh = ss.insertSheet(candidates_(keyOrNames)[0]);
  ensureHeaders_(sh, headers || []);
  return sh;
}

function ensureHeaders_(sheet, headers) {
  if (!headers || !headers.length) return;
  /* 舊資料表多為 26 欄；V19.2 會議主檔超過 26 欄，寫入前先安全擴充。 */
  function ensureColumnCapacity_(required) {
    const max = sheet.getMaxColumns();
    if (required > max) sheet.insertColumnsAfter(max, required - max);
  }
  if (sheet.getLastRow() === 0 || sheet.getLastColumn() === 0) {
    ensureColumnCapacity_(headers.length);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    return;
  }
  const current = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn()))
    .getValues()[0].map(clean_);
  if (current.join('') === '') {
    ensureColumnCapacity_(headers.length);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  } else {
    const missing = headers.filter(function(header) {
      return !current.some(function(x) { return normalizeHeader_(x) === normalizeHeader_(header); });
    });
    if (missing.length) {
      const start = sheet.getLastColumn() + 1;
      ensureColumnCapacity_(start + missing.length - 1);
      sheet.getRange(1, start, 1, missing.length).setValues([missing]);
    }
  }
  sheet.setFrozenRows(1);
}

/* R4.3 cleanup: removed shadowed legacy function headers_. */

/* R4.3 cleanup: removed shadowed legacy function headerMap_. */

function fieldNames_(canonical) {
  return unique_([canonical].concat(FIELD_ALIASES[canonical] || []));
}

function fieldIndexes_(map, canonicalOrNames) {
  const names = Array.isArray(canonicalOrNames) ? canonicalOrNames : fieldNames_(canonicalOrNames);
  let indexes = [];
  names.forEach(function(name) {
    indexes = indexes.concat(map[normalizeHeader_(name)] || []);
  });
  return unique_(indexes).sort(function(a, b) { return a - b; });
}

function readField_(row, map, canonicalOrNames) {
  const indexes = fieldIndexes_(map, canonicalOrNames);
  for (let i = indexes.length - 1; i >= 0; i--) {
    const value = row[indexes[i]];
    if (clean_(value) !== '') return value;
  }
  return indexes.length ? row[indexes[indexes.length - 1]] : '';
}

function objectValueForHeader_(object, header) {
  if (Object.prototype.hasOwnProperty.call(object, header)) return object[header];
  const normalized = normalizeHeader_(header);
  const keys = Object.keys(object);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (normalizeHeader_(key) === normalized) return object[key];
    const aliases = fieldNames_(key);
    if (aliases.some(function(alias) { return normalizeHeader_(alias) === normalized; })) {
      return object[key];
    }
  }
  return undefined;
}

/* R4.3 cleanup: removed shadowed legacy function appendObject_. */

/* R4.3 cleanup: removed shadowed legacy function writeObject_. */

/* R4.3 cleanup: removed shadowed legacy function writeField_. */

/* R4.3 cleanup: removed shadowed legacy function readCanonical_. */

function unique_(items) {
  const seen = {};
  return items.filter(function(item) {
    const key = String(item);
    if (seen[key]) return false;
    seen[key] = true;
    return true;
  });
}

function makeId_(prefix) {
  return prefix + Utilities.formatDate(new Date(), APP.TZ, 'yyMMddHHmmssSSS');
}

function randomToken_(length) {
  return Utilities.getUuid().replace(/-/g, '') +
    Utilities.getUuid().replace(/-/g, '').substring(0, Math.max(0, (length || 48) - 32));
}

function digestHex_(text) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(text),
    Utilities.Charset.UTF_8
  );
  return bytes.map(function(value) {
    const unsigned = value < 0 ? value + 256 : value;
    return ('0' + unsigned.toString(16)).slice(-2);
  }).join('');
}

function newPasswordRecord_(password) {
  const salt = randomToken_(24).substring(0, 24);
  return 'v17$' + salt + '$' + digestHex_(salt + ':' + String(password));
}

function legacyHash_(password) {
  return digestHex_(String(password));
}

function verifyPassword_(stored, password) {
  const value = clean_(stored);
  const plain = String(password || '');
  if (!value || !plain) return { ok: false, migrate: false };
  if (value.indexOf('v17$') === 0) {
    const parts = value.split('$');
    if (parts.length !== 3) return { ok: false, migrate: false };
    return { ok: parts[2] === digestHex_(parts[1] + ':' + plain), migrate: false };
  }
  if (value === plain) return { ok: true, migrate: true };
  if (value === legacyHash_(plain)) return { ok: true, migrate: true };
  return { ok: false, migrate: false };
}

function dateOnly_(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return clean_(value);
  return Utilities.formatDate(date, APP.TZ, 'yyyy-MM-dd');
}

function dateTime_(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return clean_(value);
  return Utilities.formatDate(date, APP.TZ, 'yyyy/MM/dd HH:mm');
}

function timeNumber_(value) {
  if (!value) return 0;
  const date = value instanceof Date ? value : new Date(value);
  return isNaN(date.getTime()) ? 0 : date.getTime();
}

function parseProjectText_(text) {
  const parts = clean_(text).replace('｜', '|').split('|');
  return { siteCode: clean_(parts[0]), projectName: clean_(parts.slice(1).join('|')) };
}

function safeFileName_(name) {
  return clean_(name).replace(/[\\/:*?"<>|]/g, '_').substring(0, 150);
}

function extractDriveId_(value) {
  const match = String(value || '').match(/[-\w]{25,}/);
  return match ? match[0] : '';
}

function isManager_(user) {
  if (!user) return false;
  return ROLE_MANAGER.indexOf(clean_(user.role)) >= 0 ||
    PERMISSION_MANAGER.indexOf(clean_(user.permission)) >= 0;
}

/* R4.4 cleanup: removed shadowed legacy function accessFor_. */

/* R4.4 cleanup: removed shadowed legacy function putSession_. */

/* R4.4 cleanup: removed shadowed legacy function getSession_. */

/* R4.4 cleanup: removed shadowed legacy function removeSession_. */

/* R4.4 cleanup: removed shadowed legacy function requireUser_. */

function requireManager_(token) {
  const user = requireUser_(token);
  if (!isManager_(user)) throw new Error('權限不足：此功能限 PM、課長、副理、主管或管理員。');
  return user;
}

function operationLog_(user, action, module, targetId, content, result) {
  try {
    const sheet = getSheet_('OP_LOG', false);
    if (!sheet) return;
    appendObject_(sheet, {
      '時間': new Date(), '使用者': user ? user.name : '', '帳號': user ? user.account : '',
      '姓名': user ? user.name : '', '角色': user ? user.role : '', '動作': action,
      '功能': action, '模組': module, '分頁': module, '目標ID': targetId || '',
      '紀錄ID': makeId_('LOG'), '內容': typeof content === 'string' ? content : JSON.stringify(content || {}),
      '結果': result || '成功', '資料庫': 'PSS_AI_PMO_專案管理平台', '資料庫ID': APP.DB_ID,
      'IP/來源': 'Web App'
    });
  } catch (ignore) {}
}

function clearDataKeepHeader_(sheet) {
  if (sheet.getLastRow() > 1) sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
}
/* R4.4 cleanup: removed shadowed legacy function setupPssAiPmoV17Enterprise. */

function seedDefaultAdminIfNeeded_(sheet) {
  const users = readCanonical_(sheet, {id:['使用者ID','帳號ID'],account:['帳號'],name:['姓名'],role:['角色'],permission:['權限等級','權限'],status:['狀態']});
  const activeManager = users.find(function(user) { return clean_(user.status) === '啟用' && (ROLE_MANAGER.indexOf(clean_(user.role)) >= 0 || PERMISSION_MANAGER.indexOf(clean_(user.permission)) >= 0); });
  if (activeManager) return;
  appendObject_(sheet, {'使用者ID':makeId_('U'),'帳號':'admin','姓名':'系統主管','Email':'','角色':'主管','權限等級':'管理員','狀態':'啟用','密碼雜湊':newPasswordRecord_('admin123'),'建立時間':new Date(),'最後密碼變更時間':new Date(),'登入失敗次數':0,'備註':'系統建立；首次登入後請立即修改密碼'});
}

function resetDefaultAdminV17() {
  const sheet = getSheet_('ACCOUNTS');
  const users = readCanonical_(sheet, {id:['使用者ID','帳號ID'],account:['帳號'],name:['姓名']});
  const admin = users.find(function(user) { return clean_(user.account).toLowerCase() === 'admin'; });
  const object = {'使用者ID':admin?clean_(admin.id):makeId_('U'),'帳號':'admin','姓名':admin?(clean_(admin.name)||'系統主管'):'系統主管','角色':'主管','權限等級':'管理員','狀態':'啟用','密碼雜湊':newPasswordRecord_('admin123'),'最後密碼變更時間':new Date(),'登入失敗次數':0,'鎖定至':'','備註':'管理員密碼已重設；請登入後修改'};
  if (admin) writeObject_(sheet, admin.__rowNumber, object); else appendObject_(sheet, Object.assign({'建立時間':new Date()}, object));
  return '管理員已重設：admin / admin123';
}

function seedBaseConfigurationsV17_() {
  const dbSheet = getSheet_('DATABASE_CONFIG');
  const dbRows = readCanonical_(dbSheet,{id:['資料庫ID']});
  if (!dbRows.some(function(row){return clean_(row.id)==='DB_MAIN';})) appendObject_(dbSheet, {'資料庫ID':'DB_MAIN','資料庫名稱':'PSS_AI_PMO_專案管理平台','試算表URL':'https://docs.google.com/spreadsheets/d/'+APP.DB_ID+'/edit','類型':'主資料庫','啟用狀態':'啟用','排序':1,'建立時間':new Date(),'更新時間':new Date()});
  if (!dbRows.some(function(row){return clean_(row.id)==='DB_PROGRESS';})) appendObject_(dbSheet, {'資料庫ID':'DB_PROGRESS','資料庫名稱':'專案進度/常用連結','試算表URL':'https://docs.google.com/spreadsheets/d/'+APP.PROGRESS_DB_ID+'/edit','類型':'進度資料庫','啟用狀態':'啟用','排序':2,'建立時間':new Date(),'更新時間':new Date()});
  const driveSheet = getSheet_('DRIVE_CONFIG');
  const driveRows = readCanonical_(driveSheet,{id:['雲端ID']});
  [['DRV_ROOT','業務部GOOGLE資料夾',APP.BUSINESS_ROOT_ID,'根目錄',1],['DRV_CLOUD','PSS_AI_PMO_雲端資料中心',APP.CLOUD_ROOT_ID,'專案雲端',2]].forEach(function(item){if(!driveRows.some(function(row){return clean_(row.id)===item[0];}))appendObject_(driveSheet,{'雲端ID':item[0],'名稱':item[1],'FolderID':item[2],'FolderURL':'https://drive.google.com/drive/folders/'+item[2],'類型':item[3],'啟用狀態':'啟用','排序':item[4],'建立時間':new Date(),'更新時間':new Date()});});
  const notifySheet = getSheet_('NOTIFY_CONFIG');
  if (notifySheet.getLastRow() <= 1) [['NT_TASK_NEW','新任務通知','任務新增','站內,Email','負責人','你有新任務：{{任務內容}}\n專案：{{專案名稱}}\n期限：{{預計完成日}}'],['NT_NOTICE_NEW','公告通知','公告新增','站內','全部啟用人員','新公告：{{標題}}\n{{內容}}'],['NT_TRAINING_NEW','新教材通知','教材新增','站內','全部啟用人員','新教材：{{教材名稱}}\n{{系統分類}} / {{設備分類}}']].forEach(function(item){appendObject_(notifySheet,{'通知ID':item[0],'通知名稱':item[1],'觸發事件':item[2],'通知方式':item[3],'收件人類型':item[4],'收件人':'','訊息模板':item[5],'啟用狀態':'啟用','建立時間':new Date(),'更新時間':new Date()});});
}

/* R4.4 cleanup: removed shadowed legacy function onOpen. */
/* R4.4 cleanup: removed shadowed legacy function loginV17. */
/* R4.4 cleanup: removed shadowed legacy function logoutV17. */
/* R4.4 cleanup: removed shadowed legacy function getCurrentUserV17. */
/* R4.4 cleanup: removed shadowed legacy function registerAccountV17. */
/* R4.4 cleanup: removed shadowed legacy function listUsersV17. */
/* R4.4 cleanup: removed shadowed legacy function saveUserV17. */
/* R4.4 cleanup: removed shadowed legacy function deleteUserV17. */
/* R4.4 cleanup: removed shadowed legacy function getPeopleV17. */
/* R4.4 cleanup: removed shadowed legacy function getDashboardV17. */
function listAnnouncementsV17(token){requireUser_(token);const today=dateOnly_(new Date());return readCanonical_(getSheet_('ANNOUNCEMENTS'),{id:['公告ID'],category:['分類'],title:['標題'],content:['內容'],startDate:['開始日'],endDate:['結束日'],pinned:['置頂'],status:['狀態'],creator:['建立者','發布人'],createdAt:['建立時間'],updatedAt:['更新時間']}).filter(function(i){const s=dateOnly_(i.startDate),e=dateOnly_(i.endDate);return clean_(i.status)!=='停用'&&(!s||s<=today)&&(!e||e>=today);}).map(function(i){return{id:clean_(i.id),category:clean_(i.category),title:clean_(i.title),content:clean_(i.content),startDate:dateOnly_(i.startDate),endDate:dateOnly_(i.endDate),pinned:clean_(i.pinned),status:clean_(i.status),creator:clean_(i.creator),createdAt:dateTime_(i.createdAt),updatedAt:dateTime_(i.updatedAt)};}).sort(function(a,b){const p=(b.pinned==='是'?1:0)-(a.pinned==='是'?1:0);return p!==0?p:String(b.updatedAt||b.createdAt).localeCompare(String(a.updatedAt||a.createdAt));});}
function saveAnnouncementV17(payload){payload=payload||{};const user=requireManager_(payload.token),sheet=getSheet_('ANNOUNCEMENTS'),rows=readCanonical_(sheet,{id:['公告ID'],createdAt:['建立時間'],creator:['建立者','發布人']}),id=clean_(payload.id)||makeId_('N'),target=rows.find(function(r){return clean_(r.id)===id;}),object={'公告ID':id,'分類':clean_(payload.category)||'一般','標題':clean_(payload.title),'內容':clean_(payload.content),'開始日':clean_(payload.startDate)||new Date(),'結束日':clean_(payload.endDate),'置頂':payload.pinned===true||payload.pinned==='是'?'是':'否','狀態':clean_(payload.status)||'啟用','建立者':target?target.creator:user.name,'發布人':user.name,'建立時間':target?target.createdAt:new Date(),'更新時間':new Date()};if(!object['標題'])throw new Error('公告標題必填。');if(target)writeObject_(sheet,target.__rowNumber,object);else appendObject_(sheet,object);operationLog_(user,target?'更新公告':'新增公告','公告欄',id,object,'成功');triggerNotificationsV17_('公告新增',object,user);return target?'公告已更新。':'公告已新增。';}
function deleteAnnouncementV17(payload){payload=payload||{};const user=requireManager_(payload.token),sheet=getSheet_('ANNOUNCEMENTS'),target=readCanonical_(sheet,{id:['公告ID']}).find(function(r){return clean_(r.id)===clean_(payload.id);});if(!target)throw new Error('找不到公告。');sheet.deleteRow(target.__rowNumber);operationLog_(user,'刪除公告','公告欄',payload.id,'','成功');return'公告已刪除。';}
function listDocumentsV17(token){requireUser_(token);return readCanonical_(getSheet_('DOCUMENTS'),{id:['文件ID'],category:['分類'],name:['文件名稱'],description:['說明'],url:['路徑'],permission:['權限'],order:['排序'],status:['狀態'],creator:['建立者'],createdAt:['建立時間'],updatedAt:['更新時間'],note:['備註']}).filter(function(i){return clean_(i.status)!=='停用'&&clean_(i.name);}).map(function(i){return{id:clean_(i.id),category:clean_(i.category),name:clean_(i.name),description:clean_(i.description),url:clean_(i.url),permission:clean_(i.permission),order:Number(i.order||999),status:clean_(i.status),creator:clean_(i.creator),createdAt:dateTime_(i.createdAt),updatedAt:dateTime_(i.updatedAt),note:clean_(i.note)};}).sort(function(a,b){return a.order-b.order||a.name.localeCompare(b.name,'zh-Hant');});}
function saveDocumentV17(payload){payload=payload||{};const user=requireManager_(payload.token),sheet=getSheet_('DOCUMENTS'),rows=readCanonical_(sheet,{id:['文件ID'],createdAt:['建立時間'],creator:['建立者']}),id=clean_(payload.id)||makeId_('D'),target=rows.find(function(r){return clean_(r.id)===id;}),object={'文件ID':id,'分類':clean_(payload.category)||'一般','文件名稱':clean_(payload.name),'說明':clean_(payload.description),'路徑':clean_(payload.url),'權限':clean_(payload.permission)||'全部','排序':Number(payload.order||999),'狀態':clean_(payload.status)||'啟用','建立者':target?target.creator:user.name,'建立時間':target?target.createdAt:new Date(),'更新時間':new Date(),'備註':clean_(payload.note)};if(!object['文件名稱']||!object['路徑'])throw new Error('文件名稱與路徑必填。');if(target)writeObject_(sheet,target.__rowNumber,object);else appendObject_(sheet,object);operationLog_(user,target?'更新文件':'新增文件','常用文件檔案',id,object,'成功');return target?'文件已更新。':'文件已新增。';}
function deleteDocumentV17(payload){payload=payload||{};const user=requireManager_(payload.token),sheet=getSheet_('DOCUMENTS'),target=readCanonical_(sheet,{id:['文件ID']}).find(function(r){return clean_(r.id)===clean_(payload.id);});if(!target)throw new Error('找不到文件。');sheet.deleteRow(target.__rowNumber);operationLog_(user,'刪除文件','常用文件檔案',payload.id,'','成功');return'文件已刪除。';}
function projectDefinitions_(){return{siteCode:['場地代號'],projectName:['專案名稱'],customer:['客戶'],systemType:['系統類型'],pm:['PM','負責PM'],engineers:['工程師'],status:['狀態'],progress:['進度%'],risk:['KPI燈號','風險燈號'],driveUrl:['雲端資料夾','雲端總資料夾','Drive資料夾連結'],active:['啟用狀態'],startDate:['開始日'],dueDate:['預計完成日'],billing:['請款狀態'],note:['備註'],updatedAt:['更新時間']};}
/* R4.4 cleanup: removed shadowed legacy function listProjectsV17. */
function readProjectsFromSheetV17_(){return readCanonical_(getSheet_('PROJECTS'),projectDefinitions_()).filter(function(p){return clean_(p.siteCode)||clean_(p.projectName);}).map(function(p){return{source:'資料庫',rowNumber:p.__rowNumber,siteCode:clean_(p.siteCode),projectName:clean_(p.projectName),customer:clean_(p.customer),systemType:clean_(p.systemType),pm:clean_(p.pm),engineers:clean_(p.engineers),status:clean_(p.status),progress:clean_(p.progress),risk:clean_(p.risk),driveUrl:clean_(p.driveUrl),active:clean_(p.active),startDate:dateOnly_(p.startDate),dueDate:dateOnly_(p.dueDate),billing:clean_(p.billing),note:clean_(p.note),updatedAt:dateTime_(p.updatedAt)};});}
function readProjectsFromDriveV17_(){const projects=[];try{const root=DriveApp.getFolderById(APP.CLOUD_ROOT_ID),folders=root.getFolders();while(folders.hasNext()&&projects.length<1000){const f=folders.next(),p=parseProjectFolderNameV17_(f.getName());projects.push({source:'雲端',siteCode:p.siteCode,projectName:p.projectName,customer:'',systemType:'',pm:'',engineers:'',status:'雲端資料夾',progress:'',risk:'',driveUrl:f.getUrl(),active:'啟用',startDate:'',dueDate:'',billing:'',note:''});}}catch(ignore){}return projects;}
function parseProjectFolderNameV17_(name){const value=clean_(name),patterns=[/^([A-Za-z]+_[A-Za-z0-9_]+)[_\-\s｜|]+(.+)$/, /^(SITE_\d+)[_\-\s｜|]+(.+)$/, /^(P_?\d+)[_\-\s｜|]+(.+)$/];for(let i=0;i<patterns.length;i++){const m=value.match(patterns[i]);if(m)return{siteCode:clean_(m[1]),projectName:clean_(m[2])};}return{siteCode:'',projectName:value};}
function saveProjectV17(payload){payload=payload||{};const user=requireManager_(payload.token),sheet=getSheet_('PROJECTS'),projects=readCanonical_(sheet,projectDefinitions_()),siteCode=clean_(payload.siteCode)||makeProjectCodeV17_(),target=projects.find(function(p){return clean_(p.siteCode)===siteCode;}),object={'場地代號':siteCode,'專案名稱':clean_(payload.projectName),'客戶':clean_(payload.customer),'系統類型':clean_(payload.systemType),'PM':clean_(payload.pm),'負責PM':clean_(payload.pm),'工程師':clean_(payload.engineers),'狀態':clean_(payload.status)||'進行中','進度%':clean_(payload.progress),'KPI燈號':clean_(payload.risk)||'綠燈','風險燈號':clean_(payload.risk)||'綠燈','雲端資料夾':clean_(payload.driveUrl),'Drive資料夾連結':clean_(payload.driveUrl),'啟用狀態':clean_(payload.active)||'啟用','開始日':clean_(payload.startDate),'預計完成日':clean_(payload.dueDate),'請款狀態':clean_(payload.billing),'備註':clean_(payload.note),'更新時間':new Date()};if(!object['專案名稱'])throw new Error('專案名稱必填。');if(target)writeObject_(sheet,target.__rowNumber,object);else appendObject_(sheet,Object.assign({'建立時間':new Date()},object));CacheService.getScriptCache().remove('PSS_V17_PROJECTS');operationLog_(user,target?'更新專案':'新增專案','專案清單',siteCode,object,'成功');return{message:target?'專案已更新。':'專案已新增。',siteCode:siteCode};}
function makeProjectCodeV17_(){const existing={};readProjectsFromSheetV17_().forEach(function(p){existing[p.siteCode]=true;});let code;do{code='SITE_'+Math.floor(100000+Math.random()*900000);}while(existing[code]);return code;}
function createProjectFoldersV17(payload){payload=payload||{};const user=requireManager_(payload.token),siteCode=clean_(payload.siteCode),projectName=clean_(payload.projectName);if(!siteCode&&!projectName)throw new Error('場地代號或專案名稱至少填一項。');const root=DriveApp.getFolderById(extractDriveId_(payload.parentFolderId)||APP.CLOUD_ROOT_ID),folderName=safeFileName_([siteCode,projectName].filter(Boolean).join('_')),matches=root.getFoldersByName(folderName),projectFolder=matches.hasNext()?matches.next():root.createFolder(folderName),links={'雲端資料夾':projectFolder.getUrl(),'Drive資料夾連結':projectFolder.getUrl()};APP.PROJECT_SUBFOLDERS.forEach(function(name){const children=projectFolder.getFoldersByName(name),child=children.hasNext()?children.next():projectFolder.createFolder(name);links[name]=child.getUrl();});const sheet=getSheet_('PROJECTS'),target=readCanonical_(sheet,projectDefinitions_()).find(function(p){return clean_(p.siteCode)===siteCode;});if(target)writeObject_(sheet,target.__rowNumber,links);CacheService.getScriptCache().remove('PSS_V17_PROJECTS');operationLog_(user,'建立/確認專案資料夾','雲端資料',siteCode,links,'成功');return{message:'專案資料夾已建立/確認。',folderId:projectFolder.getId(),url:projectFolder.getUrl(),links:links};}
function taskDefinitions_(){return{taskId:['任務ID','事件ID'],batchId:['派工批次ID'],dispatchDate:['派工日期'],siteCode:['場地代號'],projectName:['專案名稱'],taskType:['任務類型'],content:['任務內容'],manager:['派工人員','派工主管'],owner:['負責人'],priority:['優先級'],dueDate:['預計完成日'],status:['狀態'],finishDate:['完成日'],hours:['工時'],attachment:['照片/附件上傳','照片/附件','照片'],note:['備註'],startTime:['開始時間'],endTime:['結束時間'],calendarId:['Calendar事件ID'],calendarUrl:['Calendar連結'],notifyPeople:['通知人員'],folderUrl:['雲端資料夾'],reportStatus:['回報狀態'],updatedAt:['更新時間']};}
function createTasksMultiOwnerV17(payload){payload=payload||{};const user=requireManager_(payload.token);let owners=payload.owners;if(!Array.isArray(owners))owners=String(payload.owner||'').split(/[,，、;\n]/);owners=unique_(owners.map(clean_).filter(Boolean));if(!owners.length)throw new Error('請至少選擇一位負責人。');const batchId=makeId_('BATCH'),results=owners.map(function(owner){return createOneTaskV17_(Object.assign({},payload,{owner:owner,batchId:batchId,manager:clean_(payload.manager)||user.name}),user);});operationLog_(user,'新增複選派工','任務派工',batchId,{owners:owners,content:payload.content,projectName:payload.projectName},'成功');return{message:'已建立 '+results.length+' 筆獨立任務。',batchId:batchId,tasks:results};}
function createOneTaskV17_(payload,user){const parsed=parseProjectText_(payload.projectText||payload.project||''),siteCode=clean_(payload.siteCode)||parsed.siteCode,projectName=clean_(payload.projectName)||parsed.projectName,content=clean_(payload.content),owner=clean_(payload.owner);if(!content)throw new Error('任務內容必填。');if(!owner)throw new Error('負責人必填。');const now=new Date(),taskId=makeId_('T');let calendar={id:'',url:''};if(payload.createCalendar===true&&payload.dueDate)calendar=createTaskCalendarEventV17_({taskId:taskId,content:content,projectName:projectName,owner:owner,dueDate:payload.dueDate,startTime:payload.startTime,endTime:payload.endTime});const object={'任務ID':taskId,'事件ID':taskId,'派工批次ID':clean_(payload.batchId),'派工日期':payload.dispatchDate||now,'場地代號':siteCode,'專案名稱':projectName,'任務類型':clean_(payload.taskType)||'一般派工','任務內容':content,'派工人員':clean_(payload.manager)||user.name,'派工主管':clean_(payload.manager)||user.name,'負責人':owner,'優先級':clean_(payload.priority)||'一般','預計完成日':clean_(payload.dueDate),'狀態':clean_(payload.status)||'未開始','完成日':'','工時':'','照片/附件上傳':clean_(payload.attachment),'照片/附件':clean_(payload.attachment),'備註':clean_(payload.note),'開始時間':clean_(payload.startTime),'結束時間':clean_(payload.endTime),'Calendar事件ID':calendar.id,'Calendar連結':calendar.url,'通知人員':clean_(payload.notifyPeople),'雲端資料夾':clean_(payload.folderUrl),'回報狀態':'未回報','更新時間':now};appendObject_(getSheet_('TASKS'),object);triggerNotificationsV17_('任務新增',object,user);return{taskId:taskId,owner:owner};}
function createTaskCalendarEventV17_(data){try{const cal=CalendarApp.getDefaultCalendar(),title='['+data.taskId+'] '+data.projectName+'｜'+data.content,date=new Date(data.dueDate+'T00:00:00');let event;if(data.startTime&&data.endTime)event=cal.createEvent(title,new Date(data.dueDate+'T'+data.startTime),new Date(data.dueDate+'T'+data.endTime),{description:'負責人：'+data.owner});else event=cal.createAllDayEvent(title,date,{description:'負責人：'+data.owner});return{id:event.getId(),url:'https://calendar.google.com/calendar/u/0/r/search?q='+encodeURIComponent(data.taskId)};}catch(error){return{id:'',url:''};}}
/* R4.4 cleanup: removed shadowed legacy function listTaskCardsV17. */
function normalizeTaskV17_(t){return{rowNumber:t.__rowNumber,taskId:clean_(t.taskId),batchId:clean_(t.batchId),dispatchDate:dateTime_(t.dispatchDate),dispatchDateKey:dateOnly_(t.dispatchDate),siteCode:clean_(t.siteCode),projectName:clean_(t.projectName),project:[clean_(t.siteCode),clean_(t.projectName)].filter(Boolean).join('｜'),taskType:clean_(t.taskType),content:clean_(t.content),manager:clean_(t.manager),owner:clean_(t.owner),priority:clean_(t.priority),dueDate:dateOnly_(t.dueDate),status:clean_(t.status),finishDate:dateOnly_(t.finishDate),hours:clean_(t.hours),attachment:clean_(t.attachment),note:clean_(t.note),startTime:dateTime_(t.startTime),endTime:dateTime_(t.endTime),calendarId:clean_(t.calendarId),calendarUrl:clean_(t.calendarUrl),notifyPeople:clean_(t.notifyPeople),folderUrl:clean_(t.folderUrl),reportStatus:clean_(t.reportStatus),updatedAt:dateTime_(t.updatedAt),sortTime:timeNumber_(t.updatedAt)||timeNumber_(t.dispatchDate)||timeNumber_(t.dueDate)};}
function getTaskV17(token,taskId){const user=requireUser_(token),task=readCanonical_(getSheet_('TASKS'),taskDefinitions_()).map(normalizeTaskV17_).find(function(t){return t.taskId===clean_(taskId);});if(!task)throw new Error('找不到任務。');if(!isManager_(user)&&task.owner!==user.name&&task.manager!==user.name)throw new Error('你沒有權限查看此任務。');return task;}
function updateTaskV17(payload){payload=payload||{};const user=requireUser_(payload.token),sheet=getSheet_('TASKS'),target=readCanonical_(sheet,taskDefinitions_()).find(function(t){return clean_(t.taskId)===clean_(payload.taskId);});if(!target)throw new Error('找不到任務。');const manager=isManager_(user);if(!manager&&clean_(target.owner)!==user.name&&clean_(target.manager)!==user.name)throw new Error('你沒有權限更新此任務。');const object={'更新時間':new Date()};if(payload.status!==undefined){const allowed=manager?['未開始','進行中','已完成','取消']:['進行中','已完成'];if(allowed.indexOf(clean_(payload.status))<0)throw new Error('不允許的任務狀態。');object['狀態']=clean_(payload.status);if(object['狀態']==='已完成')object['完成日']=new Date();}if(manager){const mapping={'任務內容':'content','負責人':'owner','優先級':'priority','預計完成日':'dueDate','備註':'note','任務類型':'taskType','場地代號':'siteCode','專案名稱':'projectName','通知人員':'notifyPeople','雲端資料夾':'folderUrl'};Object.keys(mapping).forEach(function(field){const key=mapping[field];if(payload[key]!==undefined)object[field]=clean_(payload[key]);});}writeObject_(sheet,target.__rowNumber,object);operationLog_(user,'更新任務','任務派工',payload.taskId,object,'成功');return'任務已更新。';}
function deleteTaskV17(payload){payload=payload||{};const user=requireManager_(payload.token),sheet=getSheet_('TASKS'),target=readCanonical_(sheet,taskDefinitions_()).find(function(t){return clean_(t.taskId)===clean_(payload.taskId);});if(!target)throw new Error('找不到任務。');sheet.deleteRow(target.__rowNumber);operationLog_(user,'刪除任務','任務派工',payload.taskId,'','成功');return'任務已刪除。';}
/* R4.4 cleanup: removed shadowed legacy function dailyDefinitions_. */
function saveDailyReportV17(payload){payload=payload||{};const user=requireUser_(payload.token),eventTitle=clean_(payload.eventTitle),reportContent=clean_(payload.reportContent);if(!eventTitle)throw new Error('事件標題必填。');if(!reportContent)throw new Error('完成/回報事項必填。');const task=payload.taskId?getTaskV17(payload.token,payload.taskId):null,siteCode=clean_(payload.siteCode)||(task?task.siteCode:''),projectName=clean_(payload.projectName)||(task?task.projectName:''),person=clean_(payload.person)||user.name,now=new Date(),reportId=makeId_('R'),savedFiles=saveReportFilesV17_({files:payload.files||[],siteCode:siteCode,projectName:projectName,eventTitle:eventTitle,reportDate:clean_(payload.reportDate)||dateOnly_(now)});let followTask=null;if(clean_(payload.followUpTask)){const owners=Array.isArray(payload.followUpOwners)&&payload.followUpOwners.length?payload.followUpOwners:[person];followTask=createTasksMultiOwnerV17({token:payload.token,siteCode:siteCode,projectName:projectName,taskType:'後續安排',content:clean_(payload.followUpTask),owners:owners,priority:clean_(payload.followUpPriority)||'一般',dueDate:clean_(payload.followUpDueDate),note:'由每日回報 '+reportId+' 自動建立'});}const object={'事件ID':clean_(payload.eventId)||(task?task.taskId:reportId),'任務ID':clean_(payload.taskId),'回報ID':reportId,'回報日期':clean_(payload.reportDate)||now,'日期':clean_(payload.reportDate)||now,'人員':person,'場地代號':siteCode,'專案名稱':projectName,'工作類型':clean_(payload.workType)||(task?task.taskType:'工作回報'),'事件說明':eventTitle,'回報事項':reportContent,'今日完成事項':reportContent,'明日計畫':clean_(payload.tomorrowPlan),'後續事項':clean_(payload.tomorrowPlan),'附件連結':savedFiles.links.join('\n'),'施工照片連結':savedFiles.links.join('\n'),'雲端資料夾':savedFiles.folderUrl,'狀態':clean_(payload.status)||'已回報','任務來源':task?'既有派工':'自行回報','建立時間':now,'更新時間':now,'遇到問題':'','需要支援':'','支援需求':'','進度%':'','工時':''};appendObject_(getSheet_('DAILY_LOGS'),object);if(task){const taskSheet=getSheet_('TASKS'),target=readCanonical_(taskSheet,taskDefinitions_()).find(function(i){return clean_(i.taskId)===task.taskId;});if(target)writeObject_(taskSheet,target.__rowNumber,{'回報狀態':'已回報','更新時間':new Date()});if(payload.completeTask===true)updateTaskV17({token:payload.token,taskId:task.taskId,status:'已完成'});else if(task.status==='未開始')updateTaskV17({token:payload.token,taskId:task.taskId,status:'進行中'});}syncDailyReportToProgressV17_(object);operationLog_(user,'新增工作回報','每日工作日誌',reportId,object,'成功');return{message:'工作回報已儲存。',reportId:reportId,followTask:followTask,files:savedFiles};}
function saveReportFilesV17_(data){const result={links:[],folderUrl:''};if(!data.files||!data.files.length)return result;try{const projectFolder=findOrCreateProjectFolderV17_(data.siteCode,data.projectName),trackingFolder=findOrCreateChildFolderV17_(projectFolder,'03_專案追蹤記錄'),eventFolder=findOrCreateChildFolderV17_(trackingFolder,safeFileName_(data.reportDate+'_'+data.eventTitle));data.files.forEach(function(fileData,index){const base64=String(fileData.base64||'').split(',').pop();if(!base64)return;const originalName=clean_(fileData.fileName||fileData.name)||('附件_'+(index+1)),fileName=safeFileName_(data.eventTitle+'_'+originalName),blob=Utilities.newBlob(Utilities.base64Decode(base64),clean_(fileData.mimeType)||'application/octet-stream',fileName),file=eventFolder.createFile(blob);result.links.push(file.getUrl());});result.folderUrl=eventFolder.getUrl();}catch(error){throw new Error('附件儲存失敗：'+error.message);}return result;}
function findOrCreateProjectFolderV17_(siteCode,projectName){const root=DriveApp.getFolderById(APP.CLOUD_ROOT_ID),names=unique_([[siteCode,projectName].filter(Boolean).join('_'),[siteCode,projectName].filter(Boolean).join('｜'),siteCode,projectName].filter(Boolean));for(let i=0;i<names.length;i++){const matches=root.getFoldersByName(names[i]);if(matches.hasNext())return matches.next();}return root.createFolder(safeFileName_([siteCode,projectName].filter(Boolean).join('_')||'未分類'));}
function findOrCreateChildFolderV17_(parent,name){const matches=parent.getFoldersByName(name);return matches.hasNext()?matches.next():parent.createFolder(name);}
/* R4.4 cleanup: removed shadowed legacy function listDailyReportsV17. */
function syncDailyReportToProgressV17_(report){try{const ss=getProgressDb_();let summary=ss.getSheetByName('跨專案數據總表');if(!summary){summary=ss.insertSheet('跨專案數據總表');summary.getRange(1,1,1,6).setValues([['日期與時間表','工作事項描述','負責人員','目前進度狀態','備註與後續追蹤','外部連動註記']]);}summary.appendRow([dateOnly_(report['日期']),['專案：'+[report['場地代號'],report['專案名稱']].filter(Boolean).join('｜'),'事件：'+report['事件說明'],'回報：'+report['回報事項']].join('\n'),report['人員'],report['狀態'],report['明日計畫'],'V17 自動同步 '+dateTime_(new Date())]);}catch(ignore){}}
function seedTrainingCategoriesFromMaterialsV17_(){const categorySheet=getSheet_('TRAINING_CATEGORIES'),materials=listTrainingMaterialsRawV17_(),existing=readCanonical_(categorySheet,{id:['分類ID'],name:['分類名稱'],parentId:['父分類ID'],level:['層級']}),keyMap={};existing.forEach(function(c){keyMap[clean_(c.level)+'|'+clean_(c.parentId)+'|'+clean_(c.name)]=true;});const systemIds={};materials.forEach(function(m){const system=clean_(m.systemCategory)||'未分類';if(!systemIds[system]){const row=existing.find(function(c){return Number(c.level)===1&&clean_(c.name)===system;}),id=row?clean_(row.id):makeId_('CAT');systemIds[system]=id;const key='1||'+system;if(!keyMap[key]){appendObject_(categorySheet,{'分類ID':id,'分類名稱':system,'父分類ID':'','層級':1,'排序':999,'狀態':'啟用','建立時間':new Date(),'更新時間':new Date()});keyMap[key]=true;}}const device=clean_(m.deviceCategory)||'一般',deviceKey='2|'+systemIds[system]+'|'+device;if(!keyMap[deviceKey]){appendObject_(categorySheet,{'分類ID':makeId_('CAT'),'分類名稱':device,'父分類ID':systemIds[system],'層級':2,'排序':999,'狀態':'啟用','建立時間':new Date(),'更新時間':new Date()});keyMap[deviceKey]=true;}});}
function listTrainingMaterialsRawV17_(){return readCanonical_(getSheet_('TRAINING'),{id:['教材ID','教育訓練ID','訓練ID'],systemCategory:['系統分類','分類'],deviceCategory:['設備分類'],materialType:['教材類型'],title:['教材名稱','標題'],version:['版本'],fileUrl:['檔案連結','附件連結'],folderUrl:['資料夾連結','連結'],owner:['負責人','建立者'],audience:['適用對象'],status:['狀態'],createdAt:['建立時間'],updatedAt:['更新時間'],note:['備註','說明','內容說明'],order:['排序']});}
function listTrainingTreeV17(token){const user=requireUser_(token),access=accessFor_(user);seedTrainingCategoriesFromMaterialsV17_();const categories=readCanonical_(getSheet_('TRAINING_CATEGORIES'),{id:['分類ID'],name:['分類名稱'],parentId:['父分類ID'],level:['層級'],order:['排序'],status:['狀態']}).filter(function(c){return clean_(c.status)!=='停用';}).map(function(c){return{id:clean_(c.id),name:clean_(c.name),parentId:clean_(c.parentId),level:Number(c.level||1),order:Number(c.order||999)};}),materials=listTrainingMaterialsRawV17_().filter(function(m){return clean_(m.status)!=='停用'&&clean_(m.title);}).map(function(m){return{rowNumber:m.__rowNumber,id:clean_(m.id),systemCategory:clean_(m.systemCategory)||'未分類',deviceCategory:clean_(m.deviceCategory)||'一般',materialType:clean_(m.materialType)||'文件',title:clean_(m.title),version:clean_(m.version),fileUrl:clean_(m.fileUrl),folderUrl:clean_(m.folderUrl),owner:clean_(m.owner),audience:clean_(m.audience),status:clean_(m.status),note:clean_(m.note),order:Number(m.order||999),updatedAt:dateTime_(m.updatedAt)};}),systems=categories.filter(function(c){return c.level===1;}).sort(function(a,b){return a.order-b.order||a.name.localeCompare(b.name,'zh-Hant');}),tree=systems.map(function(system){const devices=categories.filter(function(c){return c.level===2&&c.parentId===system.id;}).sort(function(a,b){return a.order-b.order||a.name.localeCompare(b.name,'zh-Hant');});return{id:system.id,name:system.name,order:system.order,children:devices.map(function(device){return{id:device.id,name:device.name,parentId:system.id,order:device.order,materials:materials.filter(function(m){return m.systemCategory===system.name&&m.deviceCategory===device.name;}).sort(function(a,b){return a.order-b.order||a.title.localeCompare(b.title,'zh-Hant');})};})};});materials.forEach(function(m){let system=tree.find(function(x){return x.name===m.systemCategory;});if(!system){system={id:'virtual_'+m.systemCategory,name:m.systemCategory,order:999,children:[]};tree.push(system);}let device=system.children.find(function(x){return x.name===m.deviceCategory;});if(!device){device={id:'virtual_'+m.deviceCategory,name:m.deviceCategory,parentId:system.id,order:999,materials:[]};system.children.push(device);}if(!device.materials.some(function(x){return x.id===m.id;}))device.materials.push(m);});return{tree:tree,categories:categories,access:access};}
function saveTrainingCategoryV17(payload){payload=payload||{};const user=requireManager_(payload.token),sheet=getSheet_('TRAINING_CATEGORIES'),categories=readCanonical_(sheet,{id:['分類ID'],createdAt:['建立時間']}),id=clean_(payload.id)||makeId_('CAT'),target=categories.find(function(c){return clean_(c.id)===id;}),object={'分類ID':id,'分類名稱':clean_(payload.name),'父分類ID':clean_(payload.parentId),'層級':Number(payload.level||(payload.parentId?2:1)),'排序':Number(payload.order||999),'狀態':clean_(payload.status)||'啟用','建立時間':target?target.createdAt:new Date(),'更新時間':new Date()};if(!object['分類名稱'])throw new Error('分類名稱必填。');if(target)writeObject_(sheet,target.__rowNumber,object);else appendObject_(sheet,object);operationLog_(user,target?'更新訓練分類':'新增訓練分類','教育訓練',id,object,'成功');return target?'分類已更新。':'分類已新增。';}
function deleteTrainingCategoryV17(payload){payload=payload||{};const user=requireManager_(payload.token),sheet=getSheet_('TRAINING_CATEGORIES'),categories=readCanonical_(sheet,{id:['分類ID'],parentId:['父分類ID'],name:['分類名稱'],level:['層級']}),target=categories.find(function(c){return clean_(c.id)===clean_(payload.id);});if(!target)throw new Error('找不到分類。');if(categories.some(function(c){return clean_(c.parentId)===clean_(payload.id);}))throw new Error('此主項目仍有次項目，請先移動或刪除次項目。');const materials=listTrainingMaterialsRawV17_(),used=materials.some(function(m){return Number(target.level)===1?clean_(m.systemCategory)===clean_(target.name):clean_(m.deviceCategory)===clean_(target.name);});if(used)throw new Error('此分類仍有教材，請先移動教材。');sheet.deleteRow(target.__rowNumber);operationLog_(user,'刪除訓練分類','教育訓練',payload.id,'','成功');return'分類已刪除。';}
function saveTrainingMaterialV17(payload){payload=payload||{};const user=requireManager_(payload.token),sheet=getSheet_('TRAINING'),materials=listTrainingMaterialsRawV17_(),id=clean_(payload.id)||makeId_('TRN'),target=materials.find(function(m){return clean_(m.id)===id;}),object={'教材ID':id,'教育訓練ID':id,'訓練ID':id,'系統分類':clean_(payload.systemCategory)||'未分類','分類':clean_(payload.systemCategory)||'未分類','設備分類':clean_(payload.deviceCategory)||'一般','教材類型':clean_(payload.materialType)||'文件','教材名稱':clean_(payload.title),'標題':clean_(payload.title),'版本':clean_(payload.version)||'V1','檔案連結':clean_(payload.fileUrl),'附件連結':clean_(payload.fileUrl),'資料夾連結':clean_(payload.folderUrl),'連結':clean_(payload.folderUrl)||clean_(payload.fileUrl),'負責人':clean_(payload.owner)||user.name,'適用對象':clean_(payload.audience)||'部門人員','狀態':clean_(payload.status)||'啟用','建立時間':target?target.createdAt:new Date(),'更新時間':new Date(),'備註':clean_(payload.note),'說明':clean_(payload.note),'內容說明':clean_(payload.note),'排序':Number(payload.order||999)};if(!object['教材名稱'])throw new Error('教材名稱必填。');if(target)writeObject_(sheet,target.__rowNumber,object);else appendObject_(sheet,object);seedTrainingCategoriesFromMaterialsV17_();operationLog_(user,target?'更新教材':'新增教材','教育訓練',id,object,'成功');triggerNotificationsV17_('教材新增',object,user);return target?'教材已更新。':'教材已新增。';}
function moveTrainingMaterialV17(payload){payload=payload||{};const user=requireManager_(payload.token),sheet=getSheet_('TRAINING'),target=listTrainingMaterialsRawV17_().find(function(m){return clean_(m.id)===clean_(payload.id);});if(!target)throw new Error('找不到教材。');const object={'更新時間':new Date()};if(payload.systemCategory!==undefined){object['系統分類']=clean_(payload.systemCategory);object['分類']=clean_(payload.systemCategory);}if(payload.deviceCategory!==undefined)object['設備分類']=clean_(payload.deviceCategory);if(payload.order!==undefined)object['排序']=Number(payload.order||999);writeObject_(sheet,target.__rowNumber,object);seedTrainingCategoriesFromMaterialsV17_();operationLog_(user,'移動/排序教材','教育訓練',payload.id,object,'成功');return'教材位置與順序已更新。';}
function deleteTrainingMaterialV17(payload){payload=payload||{};const user=requireManager_(payload.token),sheet=getSheet_('TRAINING'),target=listTrainingMaterialsRawV17_().find(function(m){return clean_(m.id)===clean_(payload.id);});if(!target)throw new Error('找不到教材。');writeObject_(sheet,target.__rowNumber,{'狀態':'停用','更新時間':new Date()});operationLog_(user,'停用教材','教育訓練',payload.id,'','成功');return'教材已停用。';}
function listDriveConfigurationsV17(token){requireUser_(token);return readCanonical_(getSheet_('DRIVE_CONFIG'),{id:['雲端ID'],name:['名稱'],folderId:['FolderID'],url:['FolderURL'],type:['類型'],status:['啟用狀態'],order:['排序'],note:['備註']}).filter(function(i){return clean_(i.status)!=='停用';}).map(function(i){return{id:clean_(i.id),name:clean_(i.name),folderId:clean_(i.folderId),url:clean_(i.url),type:clean_(i.type),status:clean_(i.status),order:Number(i.order||999),note:clean_(i.note)};}).sort(function(a,b){return a.order-b.order;});}
function listDriveFolderV17(payload){payload=payload||{};requireUser_(payload.token);const folder=DriveApp.getFolderById(extractDriveId_(payload.folderId)||APP.CLOUD_ROOT_ID),limit=Math.min(Number(payload.limit||500),1500),items=[],folders=folder.getFolders();while(folders.hasNext()&&items.length<limit){const child=folders.next();items.push({type:'folder',name:child.getName(),id:child.getId(),url:child.getUrl(),mimeType:'application/vnd.google-apps.folder',updatedAt:'',size:'',parent:folder.getName()});}const files=folder.getFiles();while(files.hasNext()&&items.length<limit){const file=files.next();items.push({type:'file',name:file.getName(),id:file.getId(),url:file.getUrl(),mimeType:file.getMimeType(),updatedAt:dateTime_(file.getLastUpdated()),size:file.getSize(),parent:folder.getName()});}return{folder:{id:folder.getId(),name:folder.getName(),url:folder.getUrl()},items:items};}
function searchDriveV17(payload){payload=payload||{};requireUser_(payload.token);const query=clean_(payload.keyword);if(!query)return listDriveFolderV17({token:payload.token,folderId:APP.CLOUD_ROOT_ID,limit:payload.limit});const limit=Math.min(Number(payload.limit||300),1000),items=[];try{const folders=DriveApp.searchFolders('title contains "'+query.replace(/"/g,'\\"')+'" and trashed = false');while(folders.hasNext()&&items.length<limit){const f=folders.next();items.push({type:'folder',name:f.getName(),id:f.getId(),url:f.getUrl(),mimeType:'folder',updatedAt:'',size:'',parent:''});}}catch(ignore){}try{const files=DriveApp.searchFiles('title contains "'+query.replace(/"/g,'\\"')+'" and trashed = false');while(files.hasNext()&&items.length<limit){const f=files.next();items.push({type:'file',name:f.getName(),id:f.getId(),url:f.getUrl(),mimeType:f.getMimeType(),updatedAt:dateTime_(f.getLastUpdated()),size:f.getSize(),parent:''});}}catch(ignore){}return{folder:{id:'',name:'搜尋：'+query,url:''},items:items};}
function listDrawingsV17(payload){payload=payload||{};requireUser_(payload.token);const query=clean_(payload.keyword).toLowerCase();return readCanonical_(getSheet_('DRAWINGS'),{id:['圖面ID'],syncAt:['同步時間'],siteCode:['場地代號'],projectName:['專案名稱'],folderType:['資料夾類型'],name:['檔名'],url:['檔案連結'],fileType:['檔案類型'],updatedAt:['更新時間'],size:['檔案大小'],sourceFolder:['來源資料夾'],note:['備註']}).map(function(i){return{id:clean_(i.id),syncAt:dateTime_(i.syncAt),siteCode:clean_(i.siteCode),projectName:clean_(i.projectName),folderType:clean_(i.folderType),name:clean_(i.name),url:clean_(i.url),fileType:clean_(i.fileType),updatedAt:dateTime_(i.updatedAt),size:clean_(i.size),sourceFolder:clean_(i.sourceFolder),note:clean_(i.note)};}).filter(function(i){return!query||Object.keys(i).map(function(k){return i[k];}).join(' ').toLowerCase().indexOf(query)>=0;}).slice(0,1000);}
function syncCloudIndexV17(token){const user=requireManager_(token),indexSheet=getSheet_('CLOUD_INDEX');clearDataKeepHeader_(indexSheet);const root=DriveApp.getFolderById(APP.CLOUD_ROOT_ID);let count=0;function scan(folder,path,depth){if(depth>4||count>=2000)return;const folders=folder.getFolders();while(folders.hasNext()&&count<2000){const child=folders.next(),parsed=parseProjectFolderNameV17_(path.split('/')[0]);appendObject_(indexSheet,{'索引ID':makeId_('IDX'),'同步時間':new Date(),'場地代號':parsed.siteCode,'專案名稱':parsed.projectName,'類型':'資料夾','名稱':child.getName(),'連結':child.getUrl(),'MimeType':'folder','父層資料夾':folder.getName(),'路徑':path+'/'+child.getName()});count++;scan(child,path+'/'+child.getName(),depth+1);}const files=folder.getFiles();while(files.hasNext()&&count<2000){const file=files.next(),parsed=parseProjectFolderNameV17_(path.split('/')[0]);appendObject_(indexSheet,{'索引ID':makeId_('IDX'),'同步時間':new Date(),'場地代號':parsed.siteCode,'專案名稱':parsed.projectName,'類型':'檔案','名稱':file.getName(),'連結':file.getUrl(),'MimeType':file.getMimeType(),'更新時間':file.getLastUpdated(),'大小':file.getSize(),'父層資料夾':folder.getName(),'路徑':path+'/'+file.getName()});count++;}}const folders=root.getFolders();while(folders.hasNext()&&count<2000){const project=folders.next();scan(project,project.getName(),1);}operationLog_(user,'同步雲端索引','雲端索引','',{count:count},'成功');return'雲端索引同步完成，共 '+count+' 筆。';}
function renderTemplateV17_(template,data){return String(template||'').replace(/\{\{([^}]+)\}\}/g,function(match,key){return data[clean_(key)]===undefined?'':data[clean_(key)];});}
function activeUsersV17_(){return readCanonical_(getSheet_('ACCOUNTS'),{account:['帳號'],name:['姓名'],email:['Email'],role:['角色'],permission:['權限等級','權限'],status:['狀態']}).filter(function(u){return clean_(u.status)==='啟用';}).map(function(u){return{account:clean_(u.account),name:clean_(u.name),email:clean_(u.email),role:clean_(u.role),permission:clean_(u.permission)};});}
function triggerNotificationsV17_(eventName,data,actor){try{readCanonical_(getSheet_('NOTIFY_CONFIG'),{id:['通知ID'],name:['通知名稱'],event:['觸發事件'],methods:['通知方式'],recipientType:['收件人類型'],recipients:['收件人'],template:['訊息模板'],status:['啟用狀態']}).filter(function(c){return clean_(c.status)==='啟用'&&clean_(c.event)===eventName;}).forEach(function(c){sendNotificationConfigV17_(c,data||{},actor||{});});}catch(ignore){}}
function sendNotificationConfigV17_(config,data,actor){const users=activeUsersV17_();let recipients=[];const type=clean_(config.recipientType);if(type==='全部啟用人員')recipients=users;else if(type==='主管')recipients=users.filter(isManager_);else if(type==='負責人'){const owner=clean_(data['負責人']||data.owner||data['人員']);recipients=users.filter(function(u){return u.name===owner||u.account===owner;});}else if(type==='操作者')recipients=[actor];else{const requested=String(config.recipients||'').split(/[,，、;\n]/).map(clean_).filter(Boolean);recipients=requested.map(function(v){return users.find(function(u){return u.name===v||u.account===v||u.email===v;})||{name:v,email:v.indexOf('@')>=0?v:''};});}const title=clean_(config.name)||clean_(config.event),content=renderTemplateV17_(config.template,Object.assign({},data,{'操作者':actor.name||'','觸發事件':config.event})),methods=String(config.methods||'站內').split(/[,，、]/).map(clean_).filter(Boolean);methods.forEach(function(method){recipients.forEach(function(r){let status='成功',errorMessage='';try{if(method==='Email'&&r.email)MailApp.sendEmail(r.email,title,content);}catch(error){status='失敗';errorMessage=error.message;}appendObject_(getSheet_('NOTIFY_LOG'),{'時間':new Date(),'通知ID':config.id,'觸發事件':config.event,'通知方式':method,'收件人':r.email||r.name,'標題':title,'內容':content,'狀態':status,'錯誤訊息':errorMessage});});});}
function runTaskDueReminderV17(){const today=dateOnly_(new Date()),tomorrow=dateOnly_(new Date(Date.now()+86400000)),systemActor={name:'系統排程',account:'system',role:'系統管理員',permission:'管理員'};readCanonical_(getSheet_('TASKS'),taskDefinitions_()).map(normalizeTaskV17_).filter(function(t){return t.status!=='已完成'&&(t.dueDate===today||t.dueDate===tomorrow);}).forEach(function(t){triggerNotificationsV17_('任務即將到期',{'任務內容':t.content,'專案名稱':t.projectName,'預計完成日':t.dueDate,'負責人':t.owner},systemActor);});return'到期提醒執行完成。';}
function installTriggersV17(){ScriptApp.getProjectTriggers().forEach(function(t){if(t.getHandlerFunction()==='runTaskDueReminderV17')ScriptApp.deleteTrigger(t);});ScriptApp.newTrigger('runTaskDueReminderV17').timeBased().everyDays(1).atHour(8).create();return'已安裝每日 08:00 任務到期提醒。';}
function listOperationLogsV17(payload){payload=payload||{};requireManager_(payload.token);const query=clean_(payload.keyword).toLowerCase(),limit=Math.min(Number(payload.limit||500),2000);return readCanonical_(getSheet_('OP_LOG'),{time:['時間'],account:['帳號'],name:['姓名','使用者'],role:['角色'],action:['動作','功能'],module:['模組','分頁'],targetId:['目標ID','紀錄ID'],content:['內容'],result:['結果']}).map(function(l){return{time:dateTime_(l.time),account:clean_(l.account),name:clean_(l.name),role:clean_(l.role),action:clean_(l.action),module:clean_(l.module),targetId:clean_(l.targetId),content:clean_(l.content),result:clean_(l.result),sortTime:timeNumber_(l.time)};}).filter(function(l){return!query||Object.keys(l).map(function(k){return l[k];}).join(' ').toLowerCase().indexOf(query)>=0;}).sort(function(a,b){return b.sortTime-a.sortTime;}).slice(0,limit);}
/* R4.3 cleanup: removed shadowed legacy function healthCheckV17. */
function getSystemOverviewV17(token){requireManager_(token);return getDb_().getSheets().map(function(s){return{name:s.getName(),rows:s.getLastRow(),columns:s.getLastColumn(),headers:headers_(s)};});}
function getSheetDataV17(payload){payload=payload||{};requireManager_(payload.token);const sheet=getDb_().getSheetByName(clean_(payload.sheetName));if(!sheet)throw new Error('找不到分頁。');const values=sheet.getDataRange().getDisplayValues();if(!values.length)return{headers:[],rows:[],total:0};const query=clean_(payload.keyword).toLowerCase();let rows=values.slice(1).map(function(r,i){return{rowNumber:i+2,values:r};});if(query)rows=rows.filter(function(r){return r.values.join(' ').toLowerCase().indexOf(query)>=0;});return{headers:values[0],rows:rows.slice(0,Math.min(Number(payload.limit||1000),2000)),total:rows.length};}
function rebuildDataDictionaryV17_(){const dictionary=getSheet_('DATA_DICTIONARY');clearDataKeepHeader_(dictionary);const ss=getDb_();ss.getSheets().forEach(function(s){headers_(s).forEach(function(h,i){if(!h)return;appendObject_(dictionary,{'資料庫ID':'DB_MAIN','資料庫名稱':ss.getName(),'分頁名稱':s.getName(),'欄位序':i+1,'欄位名稱':h,'資料列數':Math.max(0,s.getLastRow()-1),'最後同步時間':new Date()});});});return'資料字典重建完成。';}
function rebuildDataDictionaryV17(){return rebuildDataDictionaryV17_();}
function exportCsvV17(payload){payload=payload||{};requireUser_(payload.token);let headers,rows,filename;if(payload.type==='tasks'){const data=listTaskCardsV17({token:payload.token,keyword:payload.keyword||'',hideDone:false,limit:3000});headers=['任務ID','派工日期','場地代號','專案名稱','任務類型','任務內容','派工人員','負責人','優先級','預計完成日','狀態','完成日','備註','附件','更新時間'];rows=data.map(function(t){return[t.taskId,t.dispatchDate,t.siteCode,t.projectName,t.taskType,t.content,t.manager,t.owner,t.priority,t.dueDate,t.displayStatus,t.finishDate,t.note,t.attachment,t.updatedAt];});filename='任務清單_'+dateOnly_(new Date())+'.csv';}else{const data=listDailyReportsV17({token:payload.token,keyword:payload.keyword||'',startDate:payload.startDate||'',endDate:payload.endDate||'',limit:3000});headers=['日期','人員','場地代號','專案名稱','工作類型','事件標題','完成/回報事項','明日計畫','任務ID','狀態','附件'];rows=data.map(function(r){return[r.date,r.person,r.siteCode,r.projectName,r.workType,r.eventTitle,r.reportContent,r.tomorrowPlan,r.taskId,r.status,r.attachment];});filename='每日工作日誌_'+dateOnly_(new Date())+'.csv';}function csvCell(v){return'"'+String(v===undefined?'':v).replace(/"/g,'""')+'"';}const csv=[headers].concat(rows).map(function(r){return r.map(csvCell).join(',');}).join('\r\n');return{filename:filename,content:'\ufeff'+csv};}
/* R4.4 cleanup: removed shadowed legacy function doGet. */
function setupPssAiPmoV165(){return setupPssAiPmoV17Enterprise();}
function setupPssAiPmoV166(){return setupPssAiPmoV17Enterprise();}
function setupPssAiPmoV168(){return setupPssAiPmoV17Enterprise();}
function loginV166(p){return loginV17(p);}function loginV167(p){return loginV17(p);}function loginV168(p){return loginV17(p);}
function registerAccountV166(p){return registerAccountV17(p);}function registerAccountV167(p){return registerAccountV17(p);}function registerAccountV168(p){return registerAccountV17(p);}
function getCurrentUserV166(t){return getCurrentUserV17(t);}function getCurrentUserV167(t){return getCurrentUserV17(t);}function getCurrentUserV168(t){return getCurrentUserV17(t);}
function logoutV166(t){return logoutV17(t);}function logoutV167(t){return logoutV17(t);}function logoutV168(t){return logoutV17(t);}
function getPeople(){const s=getSheet_('ACCOUNTS');return readCanonical_(s,{name:['姓名'],status:['狀態']}).filter(function(p){return clean_(p.status)==='啟用'&&clean_(p.name);}).map(function(p){return clean_(p.name);});}


/* ============================================================
 * V17.1 Quick Filter / Attachment Preview / Account List Fix
 * 單一 Code.gs 安裝版：APP 僅宣告一次。
 * ============================================================ */

function findAccountSheetV171_() {
  const ss = getDb_();
  const preferred = ['人員帳號','帳號管理','使用者帳號','帳號資料'];
  let candidates = [];

  ss.getSheets().forEach(function(sh) {
    if (sh.getLastColumn() < 1) return;
    const hs = headers_(sh).map(normalizeHeader_);
    const score =
      (hs.indexOf(normalizeHeader_('帳號')) >= 0 ? 4 : 0) +
      (hs.indexOf(normalizeHeader_('姓名')) >= 0 ? 2 : 0) +
      (hs.indexOf(normalizeHeader_('狀態')) >= 0 ? 1 : 0) +
      (hs.indexOf(normalizeHeader_('密碼雜湊')) >= 0 ? 4 : 0) +
      (preferred.indexOf(sh.getName()) >= 0 ? 2 : 0) +
      (sh.getLastRow() > 1 ? 2 : 0);
    if (score >= 7) candidates.push({sheet:sh,score:score,rows:sh.getLastRow()});
  });

  candidates.sort(function(a,b) {
    return b.score - a.score || b.rows - a.rows;
  });

  if (candidates.length) return candidates[0].sheet;

  const sh = getOrCreateSheet_('ACCOUNTS', [
    '使用者ID','帳號','姓名','Email','角色','權限等級','狀態','密碼雜湊',
    '建立時間','最後登入時間','最後密碼變更時間','登入失敗次數','鎖定至','備註'
  ]);
  return sh;
}

function accountDefinitionsV171_() {
  return {
    id:['使用者ID','帳號ID','人員ID'],
    account:['帳號','使用者帳號'],
    name:['姓名','人員'],
    email:['Email','電子郵件'],
    role:['角色','職稱'],
    permission:['權限等級','權限'],
    status:['狀態','啟用狀態'],
    password:['密碼雜湊','密碼'],
    createdAt:['建立時間'],
    lastLogin:['最後登入時間','最後登入'],
    note:['備註'],
    failCount:['登入失敗次數'],
    lockedUntil:['鎖定至']
  };
}

/* R4.4 cleanup: removed shadowed legacy function loginV17. */

/* R4.4 cleanup: removed shadowed legacy function listUsersV17. */

/* R4.4 cleanup: removed shadowed legacy function registerAccountV17. */

/* R4.4 cleanup: removed shadowed legacy function saveUserV17. */

/* R4.4 cleanup: removed shadowed legacy function deleteUserV17. */

function getPeopleV17(token) {
  requireUser_(token);
  const people = {};
  const accountSheet=findAccountSheetV171_();
  readCanonical_(accountSheet,accountDefinitionsV171_()).forEach(function(p){
    if(clean_(p.status)==='啟用'&&clean_(p.name)) {
      people[clean_(p.name)]={name:clean_(p.name),role:clean_(p.role),email:clean_(p.email)};
    }
  });

  getDb_().getSheets().forEach(function(sh){
    if(sh===accountSheet||sh.getLastColumn()<1)return;
    const hs=headers_(sh).map(normalizeHeader_);
    if(hs.indexOf(normalizeHeader_('姓名'))<0&&hs.indexOf(normalizeHeader_('人員'))<0)return;
    readCanonical_(sh,{
      name:['姓名','人員','員工姓名','填寫人'],
      role:['角色','職稱','職級'],
      email:['Email','電子郵件'],
      status:['啟用狀態','狀態','在職狀態']
    }).forEach(function(p){
      const name=clean_(p.name),status=clean_(p.status);
      if(name&&['','啟用','在職','正常'].indexOf(status)>=0) {
        people[name]=Object.assign(people[name]||{name:name},{
          role:clean_(p.role)||(people[name]&&people[name].role)||'',
          email:clean_(p.email)||(people[name]&&people[name].email)||''
        });
      }
    });
  });
  return Object.keys(people).sort().map(function(name){return people[name];});
}

function syncPeopleToAccountsV171(payload) {
  payload=payload||{};
  const actor=requireManager_(payload.token);
  const accountSheet=findAccountSheetV171_();
  const current=readCanonical_(accountSheet,accountDefinitionsV171_());
  const existingNames={};
  current.forEach(function(u){if(clean_(u.name))existingNames[clean_(u.name)]=true;});

  let added=0;
  getDb_().getSheets().forEach(function(sh){
    if(sh===accountSheet||sh.getLastColumn()<1)return;
    const hs=headers_(sh).map(normalizeHeader_);
    if(hs.indexOf(normalizeHeader_('姓名'))<0&&hs.indexOf(normalizeHeader_('人員'))<0)return;
    readCanonical_(sh,{name:['姓名','人員','員工姓名'],email:['Email'],role:['角色','職稱'],status:['啟用狀態','狀態']})
      .forEach(function(p){
        const name=clean_(p.name);
        if(!name||existingNames[name])return;
        appendObject_(accountSheet,{
          '使用者ID':makeId_('U'),'帳號':'','姓名':name,'Email':clean_(p.email),
          '角色':clean_(p.role)||'工程師','權限等級':'一般','狀態':'待審核',
          '密碼雜湊':'','建立時間':new Date(),
          '備註':'由人員資料同步；請主管補帳號與密碼'
        });
        existingNames[name]=true;added++;
      });
  });
  operationLog_(actor,'同步人員至帳號','帳號管理','',{'added':added},'成功');
  return '已新增 ' + added + ' 筆待補帳號資料。';
}

function distinctColumnValuesV171_(sheet, names, limit) {
  if(!sheet)return[];
  const values=sheet.getDataRange().getValues();
  if(values.length<=1)return[];
  const map=headerMap_(values[0].map(clean_));
  const indexes=fieldIndexes_(map,names);
  const result=[];
  values.slice(1).forEach(function(row){
    indexes.forEach(function(idx){
      String(row[idx]||'').split(/[,，、;\n]/).map(clean_).filter(Boolean).forEach(function(v){result.push(v);});
    });
  });
  return unique_(result).sort().slice(0,limit||500);
}

function getQuickFilterDataV171(token) {
  requireUser_(token);
  const projects=listProjectsV17(token,'');
  const people=getPeopleV17(token);
  const taskSheet=getSheet_('TASKS',false);
  const projectSheet=getSheet_('PROJECTS',false);
  const trainingSheet=getSheet_('TRAINING',false);
  const documentSheet=getSheet_('DOCUMENTS',false);
  const folders=[];
  try{
    const root=DriveApp.getFolderById(APP.CLOUD_ROOT_ID),it=root.getFolders();
    while(it.hasNext()&&folders.length<500){
      const f=it.next();folders.push({name:f.getName(),id:f.getId(),url:f.getUrl()});
    }
  }catch(ignore){}

  return {
    projects:projects.map(function(p){return{siteCode:p.siteCode,projectName:p.projectName,label:p.label,customer:p.customer,systemType:p.systemType,pm:p.pm,driveUrl:p.driveUrl};}),
    people:people,
    driveFolders:folders,
    taskTypes:distinctColumnValuesV171_(taskSheet,['任務類型'],300),
    priorities:unique_(['一般','高','低'].concat(distinctColumnValuesV171_(taskSheet,['優先級'],50))),
    taskStatuses:unique_(['未開始','進行中','已完成','取消'].concat(distinctColumnValuesV171_(taskSheet,['狀態'],50))),
    customers:distinctColumnValuesV171_(projectSheet,['客戶'],300),
    systemTypes:distinctColumnValuesV171_(projectSheet,['系統類型'],300),
    pms:unique_(people.map(function(p){return p.name;}).concat(distinctColumnValuesV171_(projectSheet,['PM','負責PM'],300))),
    engineers:unique_(people.map(function(p){return p.name;}).concat(distinctColumnValuesV171_(projectSheet,['工程師'],300))),
    projectStatuses:unique_(['規劃中','進行中','已完成','暫停'].concat(distinctColumnValuesV171_(projectSheet,['狀態'],100))),
    documentCategories:distinctColumnValuesV171_(documentSheet,['分類'],200),
    trainingSystems:distinctColumnValuesV171_(trainingSheet,['系統分類','分類'],200),
    trainingDevices:distinctColumnValuesV171_(trainingSheet,['設備分類'],300),
    trainingTypes:unique_(['資料夾','PDF','影片','SOP','文件','簡報'].concat(distinctColumnValuesV171_(trainingSheet,['教材類型'],100)))
  };
}

function driveFileIdFromUrlV171_(url) {
  const value=clean_(url);
  let m=value.match(/\/d\/([-\w]{20,})/);
  if(m)return m[1];
  m=value.match(/[?&]id=([-\w]{20,})/);
  return m?m[1]:'';
}

function attachmentItemsV171_(text) {
  const urls=String(text||'').split(/[\n,，;]+/).map(clean_).filter(function(v){return /^https?:\/\//.test(v);});
  return unique_(urls).map(function(url){
    const id=driveFileIdFromUrlV171_(url);
    const lower=url.toLowerCase();
    let type='file',icon='📎',thumbnail='';
    if(/\.(jpg|jpeg|png|gif|webp)(\?|$)/.test(lower)||id){
      type='image';icon='🖼️';
      if(id)thumbnail='https://drive.google.com/thumbnail?id='+id+'&sz=w160';
    } else if(/\.pdf(\?|$)/.test(lower)){type='pdf';icon='📄';}
    else if(/\.(xlsx|xls|csv)(\?|$)/.test(lower)){type='sheet';icon='📊';}
    else if(/\.(docx|doc)(\?|$)/.test(lower)){type='doc';icon='📝';}
    else if(/\.(pptx|ppt)(\?|$)/.test(lower)){type='slide';icon='📽️';}
    return {url:url,id:id,type:type,icon:icon,thumbnail:thumbnail,name:'附件'};
  });
}

function listTaskCardsV17(params) {
  params=params||{};
  const user=requireUser_(params.token),access=accessFor_(user);
  const query=clean_(params.keyword).toLowerCase(),hideDone=params.hideDone!==false;
  const limit=Math.min(Number(params.limit||1000),3000),today=dateOnly_(new Date());
  return readCanonical_(getSheet_('TASKS'),taskDefinitions_())
    .filter(function(t){return clean_(t.taskId);})
    .map(normalizeTaskV17_)
    .filter(function(t){
      if(!access.canViewAllTasks&&t.owner!==user.name&&t.manager!==user.name)return false;
      if(hideDone&&t.status==='已完成')return false;
      return !query||Object.keys(t).map(function(k){return t[k];}).join(' ').toLowerCase().indexOf(query)>=0;
    }).map(function(t){
      t.overdue=t.status!=='已完成'&&t.dueDate&&t.dueDate<today;
      t.displayStatus=t.overdue?'延誤':(t.status||'未開始');
      t.attachments=attachmentItemsV171_(t.attachment);
      return t;
    }).sort(function(a,b){return b.sortTime-a.sortTime;}).slice(0,limit);
}

/* R4.3 cleanup: removed shadowed legacy function listDailyReportsV17. */

/* ============================================================
 * PSS AI-PMO V18.0 專案管理與登出修正版
 * - 專案選擇只顯示「專案清單」內有場地代號的資料
 * - Drive 無場地代號資料夾不再重複出現在專案選擇
 * - 專案管理依「專案清單」第一列欄位動態顯示與編輯
 * - 新增專案、資料夾建立、缺漏檢查、Drive 綁定
 * - 登出後立即返回登入頁
 * ============================================================ */

function setupPssAiPmoV18() {
  const accountSheet = findAccountSheetV171_();
  ensureHeaders_(accountSheet, [
    '使用者ID','帳號','姓名','Email','角色','權限等級','狀態','密碼雜湊',
    '建立時間','最後登入時間','最後密碼變更時間','登入失敗次數','鎖定至','備註'
  ]);

  const projectSheet = getSheet_('PROJECTS', false) || getOrCreateSheet_('PROJECTS', [
    '場地代號','專案名稱','客戶','系統類型','負責人員','狀態','KPI燈號',
    'Drive資料夾連結','備註','建立時間','更新時間'
  ]);
  projectSheet.setFrozenRows(1);

  getOrCreateSheet_('TASKS', [
    '任務ID','派工批次ID','派工日期','場地代號','專案名稱','任務類型','任務內容',
    '派工人員','負責人','優先級','預計完成日','狀態','完成日','備註','更新時間'
  ]);
  getOrCreateSheet_('DAILY_LOGS', [
    '事件ID','任務ID','回報ID','回報日期','日期','人員','場地代號','專案名稱',
    '工作類型','事件說明','回報事項','明日計畫','附件連結','雲端資料夾','狀態','建立時間','更新時間'
  ]);
  getOrCreateSheet_('OP_LOG', [
    '時間','使用者','帳號','姓名','角色','動作','模組','目標ID','內容','結果'
  ]);
  getOrCreateSheet_('DATABASE_CONFIG', [
    '資料庫ID','資料庫名稱','試算表URL','類型','啟用狀態','排序','備註','建立時間','更新時間'
  ]);
  getOrCreateSheet_('DRIVE_CONFIG', [
    '雲端ID','名稱','FolderID','FolderURL','類型','啟用狀態','排序','備註','建立時間','更新時間'
  ]);
  getOrCreateSheet_('NOTIFY_CONFIG', [
    '通知ID','通知名稱','觸發事件','通知方式','收件人類型','收件人','訊息模板','啟用狀態','備註','建立時間','更新時間'
  ]);
  getOrCreateSheet_('NOTIFY_LOG', [
    '時間','通知ID','觸發事件','通知方式','收件人','標題','內容','狀態','錯誤訊息'
  ]);
  getOrCreateSheet_('DATA_DICTIONARY', [
    '資料庫ID','資料庫名稱','分頁名稱','欄位序','欄位名稱','資料列數','最後同步時間'
  ]);

  seedDefaultAdminIfNeeded_(accountSheet);
  seedBaseConfigurationsV17_();
  PropertiesService.getScriptProperties().setProperty('PSS_V18_INSTALLED', new Date().toISOString());
  CacheService.getScriptCache().remove('PSS_V17_PROJECTS');
  CacheService.getScriptCache().remove('PSS_V18_PROJECT_SELECTION');
  return 'PSS AI-PMO V18.0 初始化完成。專案清單欄位保持原試算表格式。';
}

/* 舊選單仍指向此函式時，改走 V18 安全初始化。 */
/* R4.3 cleanup: removed shadowed legacy function setupPssAiPmoV17Enterprise. */

/* R4.3 cleanup: removed shadowed legacy function onOpen. */

/* R4.3 cleanup: removed shadowed legacy function doGet. */

function healthCheckV18() {
  const lines = ['PSS AI-PMO V18.0 健康檢查'];
  try {
    const projectSheet = getSheet_('PROJECTS');
    const schema = getProjectSchemaV18_();
    lines.push('✅ 專案清單：' + projectSheet.getName() + '，' + Math.max(0, projectSheet.getLastRow() - 1) + ' 筆');
    lines.push('✅ 專案欄位：' + schema.length + ' 個非空白欄位');
  } catch (error) {
    lines.push('❌ 專案清單：' + error.message);
  }
  try {
    const accountSheet = findAccountSheetV171_();
    lines.push('✅ 帳號資料：' + accountSheet.getName() + '，' + Math.max(0, accountSheet.getLastRow() - 1) + ' 筆');
  } catch (error) {
    lines.push('❌ 帳號資料：' + error.message);
  }
  try {
    const root = DriveApp.getFolderById(APP.CLOUD_ROOT_ID);
    lines.push('✅ 專案雲端：' + root.getName());
  } catch (error) {
    lines.push('❌ 專案雲端：' + error.message);
  }
  return lines.join('\n');
}

function normalizeProjectNameV18_(value) {
  return clean_(value)
    .toLowerCase()
    .replace(/[\s\-＿_｜|,，.。()（）\/\\]/g, '')
    .replace(/股份有限公司|有限公司|大樓|新建工程/g, '');
}

function projectHeaderTypeV18_(header) {
  const name = clean_(header);
  if (/備註|說明|內容/.test(name)) return 'textarea';
  if (/連結|網址|資料夾/.test(name)) return 'url';
  if (/建立時間|更新時間/.test(name)) return 'datetime';
  if (/日期|開始日|完成日|預計完成日/.test(name)) return 'date';
  if (/金額|進度%|數量/.test(name)) return 'number';
  return 'text';
}

function projectManagedColumnV18_(header) {
  return /資料夾|Drive資料夾連結|雲端資料夾/.test(clean_(header));
}

function getProjectSchemaV18_() {
  const sheet = getSheet_('PROJECTS');
  const rawHeaders = headers_(sheet);
  const totalByName = {};
  rawHeaders.forEach(function(header) {
    if (!clean_(header)) return;
    const key = normalizeHeader_(header);
    totalByName[key] = (totalByName[key] || 0) + 1;
  });
  const seen = {};
  const values = sheet.getDataRange().getValues();

  return rawHeaders.map(function(header, index) {
    if (!clean_(header)) return null;
    const normalized = normalizeHeader_(header);
    seen[normalized] = (seen[normalized] || 0) + 1;
    const title = totalByName[normalized] > 1
      ? clean_(header) + '（' + seen[normalized] + '）'
      : clean_(header);
    const options = [];
    if (!projectManagedColumnV18_(header) && projectHeaderTypeV18_(header) === 'text') {
      for (let r = 1; r < values.length && options.length < 80; r++) {
        const value = clean_(values[r][index]);
        if (value && options.indexOf(value) < 0 && value.length < 100) options.push(value);
      }
    }
    return {
      key: 'c' + index,
      index: index,
      header: clean_(header),
      title: title,
      type: projectHeaderTypeV18_(header),
      managed: projectManagedColumnV18_(header),
      editable: !/建立時間|更新時間/.test(clean_(header)),
      options: options.sort()
    };
  }).filter(Boolean);
}

function getProjectSchemaV18(token) {
  requireUser_(token);
  return getProjectSchemaV18_();
}

function firstProjectFieldV18_(row, headerMap, names) {
  for (let i = 0; i < names.length; i++) {
    const indexes = headerMap[normalizeHeader_(names[i])] || [];
    for (let j = indexes.length - 1; j >= 0; j--) {
      const value = row[indexes[j]];
      if (clean_(value) !== '') return value;
    }
  }
  return '';
}

function formatProjectCellV18_(value, type) {
  if (value === null || value === undefined || value === '') return '';
  if (value instanceof Date) {
    return type === 'datetime' ? dateTime_(value) : dateOnly_(value);
  }
  return clean_(value);
}

function projectRowsRawV18_() {
  const sheet = getSheet_('PROJECTS');
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  const rawHeaders = values[0].map(clean_);
  const map = headerMap_(rawHeaders);
  const schema = getProjectSchemaV18_();
  const siteIndexes = map[normalizeHeader_('場地代號')] || [];
  const nameIndexes = map[normalizeHeader_('專案名稱')] || [];

  return values.slice(1).map(function(row, offset) {
    const siteCode = clean_(siteIndexes.length ? row[siteIndexes[0]] : '');
    const projectName = clean_(nameIndexes.length ? row[nameIndexes[0]] : '');
    if (!siteCode && !projectName) return null;
    const cells = {};
    const editValues = {};
    schema.forEach(function(column) {
      cells[column.key] = formatProjectCellV18_(row[column.index], column.type);
      editValues[column.key] = formatProjectCellV18_(row[column.index], column.type);
    });
    const driveUrl = clean_(firstProjectFieldV18_(row, map, [
      'Drive資料夾連結','雲端資料夾','雲端總資料夾'
    ]));
    return {
      rowNumber: offset + 2,
      siteCode: siteCode,
      projectName: projectName,
      label: [siteCode, projectName].filter(Boolean).join('｜'),
      customer: clean_(firstProjectFieldV18_(row, map, ['客戶'])),
      systemType: clean_(firstProjectFieldV18_(row, map, ['系統類型'])),
      responsible: clean_(firstProjectFieldV18_(row, map, ['負責人員','PM','負責PM'])),
      engineers: clean_(firstProjectFieldV18_(row, map, ['專案工程師','工程師'])),
      status: clean_(firstProjectFieldV18_(row, map, ['狀態'])),
      progress: clean_(firstProjectFieldV18_(row, map, ['進度%'])),
      risk: clean_(firstProjectFieldV18_(row, map, ['KPI燈號','風險燈號'])),
      billing: clean_(firstProjectFieldV18_(row, map, ['請款狀況','請款狀態'])),
      address: clean_(firstProjectFieldV18_(row, map, ['地址'])),
      driveUrl: driveUrl,
      note: clean_(firstProjectFieldV18_(row, map, ['備註'])),
      cells: cells,
      editValues: editValues,
      searchText: row.map(function(v) { return clean_(v); }).join(' ').toLowerCase()
    };
  }).filter(Boolean);
}

function listProjectRowsV18(payload) {
  payload = payload || {};
  requireUser_(payload.token);
  const query = clean_(payload.keyword).toLowerCase();
  const rows = projectRowsRawV18_().filter(function(project) {
    return !query || project.searchText.indexOf(query) >= 0;
  });
  return {
    schema: getProjectSchemaV18_(),
    rows: rows.slice(0, Math.min(Number(payload.limit || 1000), 3000)),
    total: rows.length
  };
}

function readDriveProjectFoldersV18_() {
  const folders = [];
  try {
    const root = DriveApp.getFolderById(APP.CLOUD_ROOT_ID);
    const iterator = root.getFolders();
    while (iterator.hasNext() && folders.length < 1500) {
      const folder = iterator.next();
      const parsed = parseProjectFolderNameV17_(folder.getName());
      folders.push({
        id: folder.getId(),
        name: folder.getName(),
        url: folder.getUrl(),
        siteCode: clean_(parsed.siteCode),
        projectName: clean_(parsed.projectName),
        normalizedName: normalizeProjectNameV18_(parsed.projectName || folder.getName())
      });
    }
  } catch (ignore) {}
  return folders;
}

function mergeProjectDriveUrlV18_(project, folders) {
  if (project.driveUrl) return project.driveUrl;
  const siteCode = clean_(project.siteCode).toLowerCase();
  const normalizedName = normalizeProjectNameV18_(project.projectName);
  const match = folders.find(function(folder) {
    if (siteCode && folder.siteCode && folder.siteCode.toLowerCase() === siteCode) return true;
    return normalizedName && folder.normalizedName === normalizedName;
  });
  return match ? match.url : '';
}

function listProjectSelectionV18(token, keyword) {
  requireUser_(token);
  const query = clean_(keyword).toLowerCase();
  const folders = readDriveProjectFoldersV18_();
  const byCode = {};

  projectRowsRawV18_().forEach(function(project) {
    if (!project.siteCode || !project.projectName) return;
    const key = project.siteCode.toLowerCase();
    const item = {
      rowNumber: project.rowNumber,
      siteCode: project.siteCode,
      projectName: project.projectName,
      label: project.siteCode + '｜' + project.projectName,
      customer: project.customer,
      systemType: project.systemType,
      pm: project.responsible,
      responsible: project.responsible,
      engineers: project.engineers,
      status: project.status,
      progress: project.progress,
      risk: project.risk,
      billing: project.billing,
      driveUrl: mergeProjectDriveUrlV18_(project, folders),
      note: project.note,
      source: '專案清單'
    };
    if (!byCode[key] || project.rowNumber > byCode[key].rowNumber) byCode[key] = item;
  });

  return Object.keys(byCode).map(function(key) { return byCode[key]; })
    .filter(function(project) {
      if (['停用','封存'].indexOf(project.status) >= 0) return false;
      return !query || Object.keys(project).map(function(k) { return project[k]; }).join(' ').toLowerCase().indexOf(query) >= 0;
    })
    .sort(function(a, b) { return a.label.localeCompare(b.label, 'zh-Hant'); });
}

/* 覆蓋舊函式：Dashboard 與快篩都只使用專案清單，Drive 只補連結，不再新增無代號選項。 */
/* R4.3 cleanup: removed shadowed legacy function listProjectsV17. */

function parseProjectInputValueV18_(value, type) {
  const text = clean_(value);
  if (!text) return '';
  if (type === 'number') {
    const number = Number(text.replace(/,/g, ''));
    return isNaN(number) ? text : number;
  }
  if (type === 'date') {
    const date = new Date(text + (text.length === 10 ? 'T00:00:00' : ''));
    return isNaN(date.getTime()) ? text : date;
  }
  if (type === 'datetime') {
    const date = new Date(text);
    return isNaN(date.getTime()) ? text : date;
  }
  return text;
}

function generateProjectCodeV18_() {
  const existing = {};
  projectRowsRawV18_().forEach(function(project) { existing[project.siteCode] = true; });
  let code;
  do {
    code = 'SITE_' + Math.floor(100000 + Math.random() * 900000);
  } while (existing[code]);
  return code;
}

function saveProjectRowV18(payload) {
  payload = payload || {};
  const user = requireManager_(payload.token);
  const sheet = getSheet_('PROJECTS');
  const schema = getProjectSchemaV18_();
  const values = payload.values || {};
  let rowNumber = Number(payload.rowNumber || 0);

  const siteColumn = schema.find(function(column) { return normalizeHeader_(column.header) === normalizeHeader_('場地代號'); });
  const nameColumn = schema.find(function(column) { return normalizeHeader_(column.header) === normalizeHeader_('專案名稱'); });
  if (!siteColumn || !nameColumn) throw new Error('專案清單缺少「場地代號」或「專案名稱」欄位。');

  let siteCode = clean_(values[siteColumn.key]);
  const projectName = clean_(values[nameColumn.key]);
  if (!projectName) throw new Error('專案名稱必填。');
  if (!siteCode) siteCode = generateProjectCodeV18_();

  const duplicate = projectRowsRawV18_().find(function(project) {
    return project.siteCode.toLowerCase() === siteCode.toLowerCase() && project.rowNumber !== rowNumber;
  });
  if (duplicate) throw new Error('場地代號已存在：' + siteCode);

  if (!rowNumber) {
    rowNumber = Math.max(sheet.getLastRow() + 1, 2);
    sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).setValues([
      new Array(sheet.getLastColumn()).fill('')
    ]);
  }
  if (rowNumber < 2 || rowNumber > sheet.getLastRow()) throw new Error('專案資料列不存在。');

  values[siteColumn.key] = siteCode;
  schema.forEach(function(column) {
    if (!column.editable || column.managed) return;
    if (!Object.prototype.hasOwnProperty.call(values, column.key)) return;
    sheet.getRange(rowNumber, column.index + 1).setValue(
      parseProjectInputValueV18_(values[column.key], column.type)
    );
  });

  const headerMap = headerMap_(headers_(sheet));
  ['建立時間'].forEach(function(header) {
    const indexes = headerMap[normalizeHeader_(header)] || [];
    indexes.forEach(function(index) {
      if (!sheet.getRange(rowNumber, index + 1).getValue()) sheet.getRange(rowNumber, index + 1).setValue(new Date());
    });
  });
  ['更新時間'].forEach(function(header) {
    const indexes = headerMap[normalizeHeader_(header)] || [];
    indexes.forEach(function(index) { sheet.getRange(rowNumber, index + 1).setValue(new Date()); });
  });

  CacheService.getScriptCache().remove('PSS_V17_PROJECTS');
  CacheService.getScriptCache().remove('PSS_V18_PROJECT_SELECTION');
  operationLog_(user, payload.rowNumber ? '更新專案' : '新增專案', '專案清單', siteCode, {
    projectName: projectName,
    rowNumber: rowNumber
  }, '成功');
  return { message: payload.rowNumber ? '專案已更新。' : '專案已新增。', rowNumber: rowNumber, siteCode: siteCode };
}

function writeProjectAliasesV18_(sheet, rowNumber, aliases, value) {
  const map = headerMap_(headers_(sheet));
  const written = {};
  aliases.forEach(function(alias) {
    const indexes = map[normalizeHeader_(alias)] || [];
    indexes.forEach(function(index) {
      if (written[index]) return;
      sheet.getRange(rowNumber, index + 1).setValue(value);
      written[index] = true;
    });
  });
}

function findProjectByCodeV18_(siteCode) {
  const code = clean_(siteCode).toLowerCase();
  return projectRowsRawV18_().find(function(project) {
    return project.siteCode.toLowerCase() === code;
  });
}

function resolveProjectRootFolderV18_(project, createIfMissing) {
  const root = DriveApp.getFolderById(APP.CLOUD_ROOT_ID);
  if (project.driveUrl) {
    const id = extractDriveId_(project.driveUrl);
    if (id) {
      try { return DriveApp.getFolderById(id); } catch (ignore) {}
    }
  }

  const folders = root.getFolders();
  const normalizedName = normalizeProjectNameV18_(project.projectName);
  while (folders.hasNext()) {
    const folder = folders.next();
    const parsed = parseProjectFolderNameV17_(folder.getName());
    if (parsed.siteCode && parsed.siteCode.toLowerCase() === project.siteCode.toLowerCase()) return folder;
    if (normalizeProjectNameV18_(parsed.projectName || folder.getName()) === normalizedName) return folder;
  }

  if (!createIfMissing) return null;
  return root.createFolder(safeFileName_(project.siteCode + '_' + project.projectName));
}

function projectFolderPlanV18_() {
  return [
    {name:'01_合約訂單銷貨驗收文件',headers:['01_合約訂單銷貨驗收文件']},
    {name:'02_圖面資料',headers:['02_圖面資料']},
    {name:'03_專案追蹤記錄',headers:['03_專案追蹤記錄']},
    {name:'04_施工照片',headers:['04_施工照片','施工照片資料夾']},
    {name:'05_驗收文件',headers:['05_驗收文件','驗收文件資料夾']},
    {name:'06_竣工圖',headers:['06_竣工圖','竣工圖資料夾']},
    {name:'07_教育訓練',headers:['07_教育訓練','06_教育訓練','教育訓練資料夾']},
    {name:'08_請款文件',headers:['08_請款文件','07_請款文件','請款文件資料夾']}
  ];
}

function ensureProjectFoldersV18(payload) {
  payload = payload || {};
  const user = requireManager_(payload.token);
  const project = findProjectByCodeV18_(payload.siteCode);
  if (!project) throw new Error('找不到場地代號：' + clean_(payload.siteCode));
  const rootFolder = resolveProjectRootFolderV18_(project, true);
  const sheet = getSheet_('PROJECTS');
  writeProjectAliasesV18_(sheet, project.rowNumber, ['Drive資料夾連結','雲端資料夾','雲端總資料夾'], rootFolder.getUrl());

  const folders = [];
  projectFolderPlanV18_().forEach(function(item) {
    const iterator = rootFolder.getFoldersByName(item.name);
    const existed = iterator.hasNext();
    const child = existed ? iterator.next() : rootFolder.createFolder(item.name);
    writeProjectAliasesV18_(sheet, project.rowNumber, item.headers, child.getUrl());
    folders.push({name:item.name,id:child.getId(),url:child.getUrl(),created:!existed});
  });
  writeProjectAliasesV18_(sheet, project.rowNumber, ['更新時間'], new Date());
  CacheService.getScriptCache().remove('PSS_V17_PROJECTS');
  operationLog_(user, '建立/檢查專案資料夾', '專案清單', project.siteCode, {
    root: rootFolder.getUrl(), folders: folders
  }, '成功');
  return {
    message:'專案資料夾已建立或補齊。',
    siteCode:project.siteCode,
    projectName:project.projectName,
    root:{id:rootFolder.getId(),name:rootFolder.getName(),url:rootFolder.getUrl()},
    folders:folders
  };
}

function countFolderImmediateV18_(folder) {
  let files = 0, folders = 0;
  const fileIterator = folder.getFiles();
  while (fileIterator.hasNext() && files < 10000) { fileIterator.next(); files++; }
  const folderIterator = folder.getFolders();
  while (folderIterator.hasNext() && folders < 10000) { folderIterator.next(); folders++; }
  return {files:files,folders:folders};
}

function getProjectFolderStatusV18(token, siteCode) {
  requireUser_(token);
  const project = findProjectByCodeV18_(siteCode);
  if (!project) throw new Error('找不到場地代號：' + clean_(siteCode));
  const rootFolder = resolveProjectRootFolderV18_(project, false);
  if (!rootFolder) {
    return {project:project,exists:false,root:null,folders:projectFolderPlanV18_().map(function(item){return{name:item.name,exists:false,files:0,folders:0,url:''};})};
  }
  const result = [];
  projectFolderPlanV18_().forEach(function(item) {
    const iterator = rootFolder.getFoldersByName(item.name);
    if (!iterator.hasNext()) {
      result.push({name:item.name,exists:false,files:0,folders:0,url:''});
      return;
    }
    const child = iterator.next();
    const count = countFolderImmediateV18_(child);
    result.push({name:item.name,exists:true,files:count.files,folders:count.folders,url:child.getUrl()});
  });
  return {
    project:project,
    exists:true,
    root:{id:rootFolder.getId(),name:rootFolder.getName(),url:rootFolder.getUrl()},
    folders:result
  };
}

function listUnboundDriveFoldersV18(payload) {
  payload = payload || {};
  requireManager_(payload.token);
  const query = clean_(payload.keyword).toLowerCase();
  const projects = projectRowsRawV18_();
  const projectCodes = {};
  const projectNames = {};
  projects.forEach(function(project) {
    if (project.siteCode) projectCodes[project.siteCode.toLowerCase()] = true;
    if (project.projectName) projectNames[normalizeProjectNameV18_(project.projectName)] = true;
  });

  return readDriveProjectFoldersV18_().filter(function(folder) {
    const boundByCode = folder.siteCode && projectCodes[folder.siteCode.toLowerCase()];
    const boundByName = folder.normalizedName && projectNames[folder.normalizedName];
    if (boundByCode || boundByName) return false;
    return !query || (folder.name + ' ' + folder.siteCode + ' ' + folder.projectName).toLowerCase().indexOf(query) >= 0;
  }).sort(function(a,b){return a.name.localeCompare(b.name,'zh-Hant');});
}

function bindDriveFolderV18(payload) {
  payload = payload || {};
  const user = requireManager_(payload.token);
  const project = findProjectByCodeV18_(payload.siteCode);
  if (!project) throw new Error('找不到場地代號：' + clean_(payload.siteCode));
  const folder = DriveApp.getFolderById(clean_(payload.folderId));
  const sheet = getSheet_('PROJECTS');
  writeProjectAliasesV18_(sheet, project.rowNumber, ['Drive資料夾連結','雲端資料夾','雲端總資料夾'], folder.getUrl());
  writeProjectAliasesV18_(sheet, project.rowNumber, ['更新時間'], new Date());
  CacheService.getScriptCache().remove('PSS_V17_PROJECTS');
  operationLog_(user, '綁定專案資料夾', '專案清單', project.siteCode, {folder:folder.getUrl()}, '成功');
  return '已將「' + folder.getName() + '」綁定至 ' + project.siteCode + '｜' + project.projectName;
}

function archiveProjectV18(payload) {
  payload = payload || {};
  const user = requireManager_(payload.token);
  const project = findProjectByCodeV18_(payload.siteCode);
  if (!project) throw new Error('找不到專案。');
  const sheet = getSheet_('PROJECTS');
  writeProjectAliasesV18_(sheet, project.rowNumber, ['狀態'], '封存');
  writeProjectAliasesV18_(sheet, project.rowNumber, ['啟用狀態'], '停用');
  writeProjectAliasesV18_(sheet, project.rowNumber, ['更新時間'], new Date());
  CacheService.getScriptCache().remove('PSS_V17_PROJECTS');
  operationLog_(user, '封存專案', '專案清單', project.siteCode, '', '成功');
  return '專案已封存，不會再出現在派工與回報的專案選擇。';
}


/* =====================================================================
 * PSS AI-PMO V18.2
 * 專案清單雙區塊相容、完整 CRUD、V16.5 MAX 雲端介面、專案歷程甘特
 * ===================================================================== */

var PSS_V182_PROJECT_FIELDS = [
  {key:'siteCode',label:'場地代號',aliases:['場地代號'],type:'text',required:true},
  {key:'projectName',label:'專案名稱',aliases:['專案名稱'],type:'text',required:true},
  {key:'customer',label:'客戶',aliases:['客戶'],type:'text'},
  {key:'systemType',label:'系統類型',aliases:['系統類型'],type:'text'},
  {key:'responsible',label:'專案業務／主管',aliases:['專案業務/主管','負責人員','負責PM','PM'],type:'text'},
  {key:'engineers',label:'專案工程師',aliases:['專案工程師','工程師'],type:'text'},
  {key:'status',label:'簽約／專案狀態',aliases:['簽約狀態','合約狀況','狀態'],type:'text'},
  {key:'progress',label:'進度%',aliases:['進度%'],type:'number'},
  {key:'risk',label:'KPI燈號',aliases:['KPI燈號','風險燈號'],type:'text'},
  {key:'startDate',label:'開始日',aliases:['開始日'],type:'date'},
  {key:'dueDate',label:'預計完成日',aliases:['預計完成日'],type:'date'},
  {key:'actualFinishDate',label:'實際完成日',aliases:['實際完成日'],type:'date'},
  {key:'billingStatus',label:'請款狀況',aliases:['請款狀況','請款狀態'],type:'text'},
  {key:'active',label:'啟用狀況',aliases:['啟用狀況','啟用狀態'],type:'text'},
  {key:'address',label:'地址',aliases:['地址'],type:'text'},
  {key:'mapUrl',label:'MAP',aliases:['MAP','GoogleMap連結'],type:'url'},
  {key:'caseNo',label:'案號',aliases:['案號'],type:'text'},
  {key:'contractAmount',label:'合約金額',aliases:['合約金額'],type:'number'},
  {key:'invoiceAmount',label:'請款金額',aliases:['請款金額'],type:'number'},
  {key:'receivedAmount',label:'收款金額',aliases:['收款金額'],type:'number'},
  {key:'note',label:'備註',aliases:['備註'],type:'textarea'},
  {key:'driveUrl',label:'專案根資料夾',aliases:['Drive資料夾連結','雲端資料夾','雲端總資料夾'],type:'url',managed:true},
  {key:'contractFolderUrl',label:'01_合約訂單銷貨驗收文件',aliases:['01_合約訂單銷貨驗收文件'],type:'url',managed:true},
  {key:'drawingFolderUrl',label:'02_圖面資料',aliases:['02_圖面資料'],type:'url',managed:true},
  {key:'trackingFolderUrl',label:'03_專案追蹤記錄',aliases:['03_專案追蹤記錄'],type:'url',managed:true},
  {key:'photoFolderUrl',label:'04_施工照片',aliases:['04_施工照片','施工照片資料夾'],type:'url',managed:true},
  {key:'acceptanceFolderUrl',label:'05_驗收文件',aliases:['05_驗收文件','驗收文件資料夾'],type:'url',managed:true},
  {key:'asbuiltFolderUrl',label:'06_竣工圖',aliases:['06_竣工圖','竣工圖資料夾'],type:'url',managed:true},
  {key:'trainingFolderUrl',label:'06／07_教育訓練',aliases:['07_教育訓練','06_教育訓練','教育訓練資料夾'],type:'url',managed:true},
  {key:'billingFolderUrl',label:'07／08_請款文件',aliases:['08_請款文件','07_請款文件','請款文件資料夾'],type:'url',managed:true}
];

var PSS_V182_LEGACY_COLUMNS = {
  siteCode:[0,19,39],
  projectName:[1,20,40],
  customer:[2,41],
  systemType:[3,42],
  responsible:[4,43],
  status:[6,44],
  progress:[45],
  risk:[7,46],
  startDate:[47],
  dueDate:[48],
  billingStatus:[10,12,49],
  active:[11,14,17,26,50],
  address:[27,51],
  mapUrl:[28,52],
  driveUrl:[15,20,53],
  contractFolderUrl:[16,54],
  drawingFolderUrl:[17,55],
  trackingFolderUrl:[18,56],
  photoFolderUrl:[29,57],
  acceptanceFolderUrl:[30],
  asbuiltFolderUrl:[31],
  trainingFolderUrl:[13,31],
  billingFolderUrl:[32],
  caseNo:[21],
  engineers:[22],
  actualFinishDate:[23],
  contractAmount:[24],
  invoiceAmount:[25],
  receivedAmount:[26],
  note:[16]
};


/* V18.2 actual-sheet helpers */
function getEventAttachmentSheetV182_(createIfMissing) {
  const ss = getDb_();
  let sheet = ss.getSheetByName('事件附件') || ss.getSheetByName('EVENT_ATTACHMENTS');
  if (!sheet && createIfMissing !== false) {
    sheet = ss.insertSheet('事件附件');
    ensureHeaders_(sheet, [
      '附件ID','回報ID','上傳時間','人員','場地代號','專案名稱',
      '檔名','檔案連結','檔案類型','備註','資料夾'
    ]);
  }
  return sheet;
}

function getProjectHistorySheetV182_() {
  const ss = getDb_();
  let sheet = ss.getSheetByName('專案歷程') || ss.getSheetByName('PROJECT_HISTORY');
  if (!sheet) {
    sheet = ss.insertSheet('專案歷程');
    ensureHeaders_(sheet, [
      '歷程ID','時間','場地代號','專案名稱','類型','來源ID','標題','內容',
      '負責人','狀態','開始日','結束日','連結','建立者','備註'
    ]);
  }
  return sheet;
}

function setupPssAiPmoV182() {
  setupPssAiPmoV18();
  ensureProjectCanonicalHeadersV182_();
  getProjectHistorySheetV182_();
  getEventAttachmentSheetV182_(true);
  return 'PSS AI-PMO V18.2 初始化完成。';
}

function projectFieldSpecV182_(key) {
  return PSS_V182_PROJECT_FIELDS.find(function(item) { return item.key === key; });
}

function valueValidForProjectFieldV182_(value, field) {
  if (value === null || value === undefined || value === '') return false;
  const text = clean_(value);
  if (!text) return false;
  if (field.type === 'url') return /^https?:\/\//i.test(text);
  if (field.type === 'date') {
    if (value instanceof Date) return !isNaN(value.getTime());
    if (typeof value === 'number') return value > 30000 && value < 80000;
    const date = new Date(text);
    return !isNaN(date.getTime()) && !/請款|啟用|停用|綠燈|黃燈|紅燈/.test(text);
  }
  if (field.type === 'number') {
    return text !== '' && !isNaN(Number(text.replace(/,/g,'').replace('%','')));
  }
  if (field.key === 'billingStatus') return /請款|收款|已收|未收|開票/.test(text);
  if (field.key === 'active') return /啟用|停用|關閉|封存/.test(text);
  if (field.key === 'risk') return /綠燈|黃燈|紅燈|正常|注意|風險/.test(text);
  if (field.key === 'note' && /^https?:\/\//i.test(text)) return false;
  return true;
}

function formatProjectValueV182_(value, field) {
  if (value === null || value === undefined || value === '') return '';
  if (field.type === 'date') return dateOnly_(value);
  if (field.type === 'number') return clean_(value);
  return clean_(value);
}

function projectHeaderIndexesV182_(headers, aliases) {
  const out = [];
  aliases.forEach(function(alias) {
    headers.forEach(function(header, index) {
      if (normalizeHeader_(header) === normalizeHeader_(alias)) out.push(index);
    });
  });
  return unique_(out).sort(function(a,b){return a-b;});
}

function projectValueFromRowV182_(row, headers, field) {
  const indexes = projectHeaderIndexesV182_(headers, field.aliases);
  for (let i = indexes.length - 1; i >= 0; i--) {
    const value = row[indexes[i]];
    if (valueValidForProjectFieldV182_(value, field)) return formatProjectValueV182_(value, field);
  }
  const legacy = PSS_V182_LEGACY_COLUMNS[field.key] || [];
  for (let i = legacy.length - 1; i >= 0; i--) {
    const index = legacy[i];
    if (index < row.length && valueValidForProjectFieldV182_(row[index], field)) {
      return formatProjectValueV182_(row[index], field);
    }
  }
  return '';
}

/* R4.3 cleanup: removed shadowed legacy function projectRowsV182_. */

function listProjectSelectionV182(token, keyword) {
  requireUser_(token);
  const query = clean_(keyword).toLowerCase();
  return projectRowsV182_().filter(function(project) {
    if (!project.siteCode || !project.projectName) return false;
    if (/停用|封存/.test(project.active) || /封存/.test(project.status)) return false;
    return !query || project.searchText.indexOf(query) >= 0;
  }).map(function(project) {
    return {
      rowNumber:project.rowNumber,siteCode:project.siteCode,projectName:project.projectName,
      label:project.label,customer:project.customer,systemType:project.systemType,
      responsible:project.responsible,engineers:project.engineers,status:project.status,
      progress:project.progress,risk:project.risk,billingStatus:project.billingStatus,
      active:project.active,address:project.address,mapUrl:project.mapUrl,
      driveUrl:project.driveUrl,note:project.note
    };
  });
}

function listProjectsV17(token, keyword) {
  return listProjectSelectionV182(token, keyword);
}

function listProjectRowsV182(payload) {
  payload = payload || {};
  requireUser_(payload.token);
  const query = clean_(payload.keyword).toLowerCase();
  const rows = projectRowsV182_().filter(function(project) {
    return !query || project.searchText.indexOf(query) >= 0;
  });
  return {rows:rows.slice(0,Math.min(Number(payload.limit||1000),3000)),total:rows.length};
}

function getProjectV182(token, siteCode) {
  requireUser_(token);
  const code = clean_(siteCode).toLowerCase();
  const project = projectRowsV182_().find(function(item){return item.siteCode.toLowerCase()===code;});
  if (!project) throw new Error('找不到專案：' + siteCode);
  return project;
}

function ensureProjectCanonicalHeadersV182_() {
  const sheet = getSheet_('PROJECTS');
  const required = [
    '場地代號','專案名稱','客戶','系統類型','專案業務/主管','專案工程師',
    '簽約狀態','進度%','KPI燈號','開始日','預計完成日','實際完成日',
    '請款狀況','啟用狀況','地址','MAP','案號','合約金額','請款金額',
    '收款金額','備註','Drive資料夾連結','01_合約訂單銷貨驗收文件',
    '02_圖面資料','03_專案追蹤記錄','04_施工照片','05_驗收文件',
    '06_竣工圖','07_教育訓練','08_請款文件','更新時間'
  ];
  const headers = headers_(sheet);
  required.forEach(function(header) {
    if (!headers.some(function(existing){return normalizeHeader_(existing)===normalizeHeader_(header);})) {
      sheet.getRange(1,sheet.getLastColumn()+1).setValue(header);
      headers.push(header);
    }
  });
  sheet.setFrozenRows(1);
}

function writeProjectFieldV182_(sheet, rowNumber, field, value) {
  const headers = headers_(sheet);
  let indexes = projectHeaderIndexesV182_(headers, field.aliases);
  const canonicalHeader = {
    responsible:'專案業務/主管',status:'簽約狀態',active:'啟用狀況',
    mapUrl:'MAP',driveUrl:'Drive資料夾連結',photoFolderUrl:'04_施工照片',
    acceptanceFolderUrl:'05_驗收文件',asbuiltFolderUrl:'06_竣工圖',
    trainingFolderUrl:'07_教育訓練',billingFolderUrl:'08_請款文件'
  }[field.key] || field.aliases[0];

  if (!indexes.length) {
    sheet.getRange(1,sheet.getLastColumn()+1).setValue(canonicalHeader);
    indexes = [sheet.getLastColumn()-1];
  }
  const parsed = field.type === 'number'
    ? (clean_(value)==='' ? '' : Number(String(value).replace(/,/g,'')))
    : field.type === 'date'
      ? (clean_(value)==='' ? '' : new Date(clean_(value)+'T00:00:00'))
      : clean_(value);

  indexes.forEach(function(index) {
    sheet.getRange(rowNumber,index+1).setValue(parsed);
  });
}

function generateProjectCodeV182_() {
  const existing = {};
  projectRowsV182_().forEach(function(project){existing[project.siteCode]=true;});
  let code;
  do { code='SITE_'+Math.floor(100000+Math.random()*900000); } while(existing[code]);
  return code;
}

function saveProjectV182(payload) {
  payload = payload || {};
  const user = requireManager_(payload.token);
  ensureProjectCanonicalHeadersV182_();
  const sheet = getSheet_('PROJECTS');
  const values = payload.values || {};
  let rowNumber = Number(payload.rowNumber||0);
  let siteCode = clean_(values.siteCode);
  const projectName = clean_(values.projectName);
  if (!projectName) throw new Error('專案名稱必填。');
  if (!siteCode) siteCode = generateProjectCodeV182_();

  const duplicate = projectRowsV182_().find(function(project) {
    return project.siteCode.toLowerCase()===siteCode.toLowerCase() && project.rowNumber!==rowNumber;
  });
  if (duplicate) throw new Error('場地代號已存在：'+siteCode);

  if (!rowNumber) {
    rowNumber = sheet.getLastRow()+1;
    sheet.getRange(rowNumber,1,1,sheet.getLastColumn()).setValues([new Array(sheet.getLastColumn()).fill('')]);
  }

  values.siteCode = siteCode;
  PSS_V182_PROJECT_FIELDS.filter(function(field){return !field.managed;}).forEach(function(field) {
    if (Object.prototype.hasOwnProperty.call(values,field.key)) {
      writeProjectFieldV182_(sheet,rowNumber,field,values[field.key]);
    }
  });
  writeProjectAliasesV18_(sheet,rowNumber,['更新時間'],new Date());
  if (!clean_(sheet.getRange(rowNumber,1).getValue())) sheet.getRange(rowNumber,1).setValue(siteCode);

  CacheService.getScriptCache().remove('PSS_V17_PROJECTS');
  operationLog_(user,payload.rowNumber?'更新專案':'新增專案','專案清單',siteCode,{rowNumber:rowNumber,projectName:projectName},'成功');
  return {message:payload.rowNumber?'專案已更新。':'專案已新增。',rowNumber:rowNumber,siteCode:siteCode};
}

function archiveProjectV182(payload) {
  payload = payload || {};
  const user = requireManager_(payload.token);
  const project = getProjectV182(payload.token,payload.siteCode);
  const sheet = getSheet_('PROJECTS');
  writeProjectFieldV182_(sheet,project.rowNumber,projectFieldSpecV182_('status'),'封存');
  writeProjectFieldV182_(sheet,project.rowNumber,projectFieldSpecV182_('active'),'停用');
  operationLog_(user,'封存專案','專案清單',project.siteCode,'','成功');
  return '專案已封存。';
}

function deleteProjectV182(payload) {
  payload = payload || {};
  const user = requireManager_(payload.token);
  const project = getProjectV182(payload.token,payload.siteCode);
  if (payload.deleteFolder === true && project.driveUrl) {
    const id = extractDriveId_(project.driveUrl);
    if (id) {
      try { DriveApp.getFolderById(id).setTrashed(true); } catch(ignore) {}
    }
  }
  getSheet_('PROJECTS').deleteRow(project.rowNumber);
  operationLog_(user,'刪除專案','專案清單',project.siteCode,{deleteFolder:payload.deleteFolder===true},'成功');
  return payload.deleteFolder===true?'專案及根資料夾已移至垃圾桶。':'專案資料列已刪除。';
}

function projectFolderPlanV182_() {
  return [
    {key:'contractFolderUrl',name:'01_合約訂單銷貨驗收文件',alternates:['01_合約訂單銷貨驗收文件']},
    {key:'drawingFolderUrl',name:'02_圖面資料',alternates:['02_圖面資料']},
    {key:'trackingFolderUrl',name:'03_專案追蹤記錄',alternates:['03_專案追蹤記錄']},
    {key:'photoFolderUrl',name:'04_施工照片',alternates:['04_施工照片']},
    {key:'acceptanceFolderUrl',name:'05_驗收文件',alternates:['05_驗收文件']},
    {key:'asbuiltFolderUrl',name:'06_竣工圖',alternates:['06_竣工圖']},
    {key:'trainingFolderUrl',name:'07_教育訓練',alternates:['07_教育訓練','06_教育訓練']},
    {key:'billingFolderUrl',name:'08_請款文件',alternates:['08_請款文件','07_請款文件']}
  ];
}

function resolveProjectRootV182_(project, createIfMissing) {
  if (project.driveUrl) {
    const id = extractDriveId_(project.driveUrl);
    if (id) try { return DriveApp.getFolderById(id); } catch(ignore) {}
  }
  const root = DriveApp.getFolderById(APP.CLOUD_ROOT_ID);
  const iterator = root.getFolders();
  const normalizedName = normalizeProjectNameV18_(project.projectName);
  while(iterator.hasNext()) {
    const folder = iterator.next();
    const parsed = parseProjectFolderNameV17_(folder.getName());
    if (parsed.siteCode && parsed.siteCode.toLowerCase()===project.siteCode.toLowerCase()) return folder;
    if (normalizeProjectNameV18_(parsed.projectName||folder.getName())===normalizedName) return folder;
  }
  if (!createIfMissing) return null;
  return root.createFolder(safeFileName_(project.siteCode+'_'+project.projectName));
}

function findChildByNamesV182_(parent,names) {
  for (let i=0;i<names.length;i++) {
    const iterator=parent.getFoldersByName(names[i]);
    if (iterator.hasNext()) return iterator.next();
  }
  return null;
}

function syncProjectFolderLinksV182(payload) {
  payload = payload || {};
  const user = requireManager_(payload.token);
  const project = getProjectV182(payload.token,payload.siteCode);
  const root = resolveProjectRootV182_(project,false);
  if (!root) throw new Error('尚未找到專案根資料夾。');
  const sheet = getSheet_('PROJECTS');
  writeProjectFieldV182_(sheet,project.rowNumber,projectFieldSpecV182_('driveUrl'),root.getUrl());
  const result=[];
  projectFolderPlanV182_().forEach(function(plan) {
    const folder=findChildByNamesV182_(root,plan.alternates);
    if (folder) {
      writeProjectFieldV182_(sheet,project.rowNumber,projectFieldSpecV182_(plan.key),folder.getUrl());
      result.push({key:plan.key,name:folder.getName(),url:folder.getUrl(),exists:true});
    } else result.push({key:plan.key,name:plan.name,url:'',exists:false});
  });
  operationLog_(user,'同步專案資料夾連結','專案清單',project.siteCode,result,'成功');
  return {message:'資料夾連結已同步回專案清單。',root:{name:root.getName(),url:root.getUrl(),id:root.getId()},folders:result};
}

function ensureProjectFoldersV182(payload) {
  payload = payload || {};
  const user = requireManager_(payload.token);
  const project = getProjectV182(payload.token,payload.siteCode);
  const root = resolveProjectRootV182_(project,true);
  const sheet = getSheet_('PROJECTS');
  writeProjectFieldV182_(sheet,project.rowNumber,projectFieldSpecV182_('driveUrl'),root.getUrl());
  const result=[];
  projectFolderPlanV182_().forEach(function(plan) {
    let folder=findChildByNamesV182_(root,plan.alternates);
    const created=!folder;
    if (!folder) folder=root.createFolder(plan.name);
    writeProjectFieldV182_(sheet,project.rowNumber,projectFieldSpecV182_(plan.key),folder.getUrl());
    result.push({key:plan.key,name:folder.getName(),url:folder.getUrl(),id:folder.getId(),created:created,exists:true});
  });
  operationLog_(user,'建立/補齊專案資料夾','專案清單',project.siteCode,result,'成功');
  return {message:'專案資料夾已建立或補齊。',root:{name:root.getName(),url:root.getUrl(),id:root.getId()},folders:result};
}

function trashProjectFolderV182(payload) {
  payload = payload || {};
  const user = requireManager_(payload.token);
  const project = getProjectV182(payload.token,payload.siteCode);
  const root = resolveProjectRootV182_(project,false);
  if (!root) throw new Error('找不到專案根資料夾。');
  root.setTrashed(true);
  const sheet=getSheet_('PROJECTS');
  ['driveUrl','contractFolderUrl','drawingFolderUrl','trackingFolderUrl','photoFolderUrl',
   'acceptanceFolderUrl','asbuiltFolderUrl','trainingFolderUrl','billingFolderUrl']
    .forEach(function(key){writeProjectFieldV182_(sheet,project.rowNumber,projectFieldSpecV182_(key),'');});
  operationLog_(user,'刪除專案資料夾','專案清單',project.siteCode,{folder:root.getName()},'成功');
  return '專案根資料夾已移至 Google Drive 垃圾桶。';
}

function countFolderV182_(folder) {
  let files=0,folders=0;
  const fi=folder.getFiles(); while(fi.hasNext()&&files<10000){fi.next();files++;}
  const fo=folder.getFolders(); while(fo.hasNext()&&folders<10000){fo.next();folders++;}
  return {files:files,folders:folders};
}

function getProjectFolderStatusV182(token,siteCode) {
  const project=getProjectV182(token,siteCode);
  const root=resolveProjectRootV182_(project,false);
  if (!root) return {project:project,root:null,folders:projectFolderPlanV182_().map(function(p){return{name:p.name,exists:false,files:0,folders:0,url:''};})};
  return {
    project:project,
    root:{id:root.getId(),name:root.getName(),url:root.getUrl()},
    folders:projectFolderPlanV182_().map(function(plan) {
      const folder=findChildByNamesV182_(root,plan.alternates);
      if (!folder) return {name:plan.name,exists:false,files:0,folders:0,url:''};
      const count=countFolderV182_(folder);
      return {name:folder.getName(),exists:true,files:count.files,folders:count.folders,url:folder.getUrl()};
    })
  };
}

function scanFolderItemsV182_(folder,context,depth,maxDepth,items,limit) {
  if (depth>maxDepth||items.length>=limit) return;
  const folders=folder.getFolders();
  while(folders.hasNext()&&items.length<limit) {
    const child=folders.next();
    const path=context.path+'/'+child.getName();
    items.push({type:'資料夾',siteCode:context.siteCode,projectName:context.projectName,
      folderType:context.folderType,name:child.getName(),url:child.getUrl(),mimeType:'folder',
      updated:'',size:'',parentUrl:folder.getUrl(),path:path});
    scanFolderItemsV182_(child,{siteCode:context.siteCode,projectName:context.projectName,folderType:context.folderType,path:path},depth+1,maxDepth,items,limit);
  }
  const files=folder.getFiles();
  while(files.hasNext()&&items.length<limit) {
    const file=files.next();
    items.push({type:'檔案',siteCode:context.siteCode,projectName:context.projectName,
      folderType:context.folderType,name:file.getName(),url:file.getUrl(),mimeType:file.getMimeType(),
      updated:dateTime_(file.getLastUpdated()),updatedDate:dateOnly_(file.getLastUpdated()),
      size:file.getSize(),parentUrl:folder.getUrl(),path:context.path+'/'+file.getName()});
  }
}

function listProjectCloudItemsV182(payload) {
  payload=payload||{};
  requireUser_(payload.token);
  const project=getProjectV182(payload.token,payload.siteCode);
  const root=resolveProjectRootV182_(project,false);
  if (!root) return [];
  const folderType=clean_(payload.folderType)||'專案根目錄';
  let target=root;
  if (folderType!=='專案根目錄') {
    const plan=projectFolderPlanV182_().find(function(p){return p.name===folderType||p.alternates.indexOf(folderType)>=0;});
    target=plan?findChildByNamesV182_(root,plan.alternates):findChildByNamesV182_(root,[folderType]);
    if (!target) return [];
  }
  const items=[];
  scanFolderItemsV182_(target,{siteCode:project.siteCode,projectName:project.projectName,
    folderType:folderType,path:project.siteCode+'｜'+project.projectName+'/'+folderType},0,
    Number(payload.maxDepth||4),items,Math.min(Number(payload.limit||1000),3000));
  const keyword=clean_(payload.keyword).toLowerCase();
  return items.filter(function(item){
    return !keyword || (item.name+' '+item.path+' '+item.mimeType).toLowerCase().indexOf(keyword)>=0;
  }).sort(function(a,b){return String(b.updated).localeCompare(String(a.updated))||a.name.localeCompare(b.name,'zh-Hant');});
}

function uploadProjectFilesV182(payload) {
  payload=payload||{};
  const user=requireUser_(payload.token);
  const project=getProjectV182(payload.token,payload.siteCode);
  const root=resolveProjectRootV182_(project,true);
  const folderType=clean_(payload.folderType)||'03_專案追蹤記錄';
  const plan=projectFolderPlanV182_().find(function(p){return p.name===folderType||p.alternates.indexOf(folderType)>=0;});
  let target=folderType==='專案根目錄'?root:
    (plan?findChildByNamesV182_(root,plan.alternates):findChildByNamesV182_(root,[folderType]));
  if (!target) target=root.createFolder(plan?plan.name:folderType);
  const attachmentSheet=getEventAttachmentSheetV182_(true);
  const links=[];
  (payload.files||[]).forEach(function(fileData,index) {
    const base64=String(fileData.base64||'').split(',').pop();
    if (!base64) return;
    const file=target.createFile(Utilities.newBlob(
      Utilities.base64Decode(base64),clean_(fileData.mimeType)||'application/octet-stream',
      safeFileName_(fileData.fileName||fileData.name||('附件_'+(index+1)))
    ));
    links.push({name:file.getName(),url:file.getUrl(),mimeType:file.getMimeType()});
    appendObject_(attachmentSheet,{'附件ID':makeId_('A'),'回報ID':clean_(payload.eventId),
      '上傳時間':new Date(),'人員':user.name,'場地代號':project.siteCode,'專案名稱':project.projectName,
      '檔名':file.getName(),'檔案連結':file.getUrl(),'檔案類型':file.getMimeType(),
      '備註':target.getUrl(),'資料夾':folderType});
  });
  operationLog_(user,'上傳專案檔案','雲端/圖面',project.siteCode,{folderType:folderType,count:links.length},'成功');
  return {message:'已上傳 '+links.length+' 個檔案。',folderUrl:target.getUrl(),files:links};
}

function syncCloudIndexV182(token) {
  const user=requireManager_(token);
  const sheet=getSheet_('CLOUD_INDEX');
  clearDataKeepHeader_(sheet);
  const rows=[];
  projectRowsV182_().forEach(function(project) {
    const root=resolveProjectRootV182_(project,false);
    if (!root||rows.length>=5000) return;
    const items=[];
    scanFolderItemsV182_(root,{siteCode:project.siteCode,projectName:project.projectName,
      folderType:'專案根目錄',path:project.siteCode+'｜'+project.projectName},0,5,items,5000-rows.length);
    items.forEach(function(item){
      rows.push([makeId_('IDX'),new Date(),item.siteCode,item.projectName,item.type,item.name,item.url,
        item.mimeType,item.updated,item.size,item.parentUrl,item.path,'']);
    });
  });
  if (rows.length) sheet.getRange(2,1,rows.length,13).setValues(rows);
  operationLog_(user,'同步雲端索引','雲端索引','',{count:rows.length},'成功');
  return '雲端索引同步完成，共 '+rows.length+' 筆。';
}

function syncProjectDrawingsV182(token) {
  const user=requireManager_(token);
  const sheet=getSheet_('DRAWINGS');
  clearDataKeepHeader_(sheet);
  const rows=[];
  projectRowsV182_().forEach(function(project) {
    const root=resolveProjectRootV182_(project,false);
    if (!root||rows.length>=4000) return;
    [{type:'02_圖面資料',names:['02_圖面資料']},{type:'06_竣工圖',names:['06_竣工圖']}]
      .forEach(function(spec){
        const folder=findChildByNamesV182_(root,spec.names);
        if (!folder) return;
        const items=[];
        scanFolderItemsV182_(folder,{siteCode:project.siteCode,projectName:project.projectName,
          folderType:spec.type,path:project.siteCode+'｜'+project.projectName+'/'+spec.type},0,5,items,4000-rows.length);
        items.filter(function(item){return item.type==='檔案';}).forEach(function(item){
          rows.push([makeId_('DWG'),new Date(),item.siteCode,item.projectName,item.folderType,item.name,
            item.url,item.mimeType,item.updated,item.size,item.parentUrl,'']);
        });
      });
  });
  if (rows.length) sheet.getRange(2,1,rows.length,12).setValues(rows);
  operationLog_(user,'同步圖面資料','圖面管理','',{count:rows.length},'成功');
  return '圖面同步完成，共 '+rows.length+' 筆。';
}

function auditProjectSheetV182(token) {
  requireManager_(token);
  const sheet=getSheet_('PROJECTS');
  const values=sheet.getDataRange().getValues();
  const headers=values[0].map(clean_);
  const blankHeaderColumns=[];
  headers.forEach(function(header,index){
    if (header) return;
    let count=0;
    for(let r=1;r<values.length;r++) if(clean_(values[r][index])) count++;
    if (count) blankHeaderColumns.push({column:index+1,count:count});
  });
  const duplicateHeaders={};
  headers.forEach(function(header){
    if (!header) return;
    const key=normalizeHeader_(header);
    duplicateHeaders[key]=(duplicateHeaders[key]||0)+1;
  });
  const duplicates=Object.keys(duplicateHeaders).filter(function(key){return duplicateHeaders[key]>1;})
    .map(function(key){return{header:key,count:duplicateHeaders[key]};});
  const invalidRows=[];
  values.slice(1).forEach(function(row,index){
    const cloud=row[8],created=row[10];
    if ((typeof cloud==='number'||cloud instanceof Date)||/請款/.test(clean_(created))) invalidRows.push(index+2);
  });
  return {
    sheetName:sheet.getName(),rows:Math.max(0,values.length-1),columns:headers.length,
    blankHeaderColumns:blankHeaderColumns,duplicateHeaders:duplicates,
    shiftedHeaderRows:invalidRows.slice(0,50),
    recommendation:'V18.2 已直接相容雙區塊與錯位欄位；可執行安全整理，系統會先建立備份且不刪除舊欄資料。'
  };
}

function repairProjectSheetV182(token) {
  const user=requireManager_(token);
  const ss=getDb_(),sheet=getSheet_('PROJECTS');
  const backupName=('專案清單_修復前_'+Utilities.formatDate(new Date(),APP.TZ,'MMdd_HHmmss')).substring(0,99);
  sheet.copyTo(ss).setName(backupName);
  ensureProjectCanonicalHeadersV182_();
  const projects=projectRowsV182_();
  projects.forEach(function(project){
    PSS_V182_PROJECT_FIELDS.forEach(function(field){
      if (project[field.key]) writeProjectFieldV182_(sheet,project.rowNumber,field,project[field.key]);
    });
  });
  operationLog_(user,'安全整理專案欄位','專案清單','',{backup:backupName,count:projects.length},'成功');
  return '已建立備份「'+backupName+'」，並將 '+projects.length+' 筆資料寫入標準欄位；舊欄資料未刪除。';
}

/* R4.3 cleanup: removed shadowed legacy function projectMatchesV182_. */

/* R4.3 cleanup: removed shadowed legacy function getProjectTimelineV182. */

function createTimelineFollowUpV182(payload) {
  payload=payload||{};
  requireManager_(payload.token);
  const project=getProjectV182(payload.token,payload.siteCode);
  return createTasksMultiOwnerV17({
    token:payload.token,siteCode:project.siteCode,projectName:project.projectName,
    taskType:clean_(payload.taskType)||'歷程後續安排',content:clean_(payload.content),
    owners:payload.owners||[],priority:clean_(payload.priority)||'一般',
    dueDate:clean_(payload.dueDate),note:clean_(payload.note)
  });
}

function healthCheckV182() {
  const audit = auditProjectSheetV182Bypass_();
  return [
    'PSS AI-PMO V18.2 健康檢查',
    '資料庫：'+getDb_().getName(),
    '專案：'+projectRowsV182_().length+' 筆',
    '專案清單欄數：'+audit.columns,
    '有資料但無標題欄：'+audit.blankHeaderColumns.length,
    '重複標題：'+audit.duplicateHeaders.length,
    '雲端根目錄：'+DriveApp.getFolderById(APP.CLOUD_ROOT_ID).getName(),
    'APP 宣告：單一 Code.gs'
  ].join('\n');
}

function auditProjectSheetV182Bypass_() {
  const sheet=getSheet_('PROJECTS'),values=sheet.getDataRange().getValues(),headers=values[0].map(clean_);
  const blankHeaderColumns=[];
  headers.forEach(function(header,index){
    if(header)return;let count=0;
    for(let r=1;r<values.length;r++)if(clean_(values[r][index]))count++;
    if(count)blankHeaderColumns.push({column:index+1,count:count});
  });
  const counts={};headers.forEach(function(h){if(h){const k=normalizeHeader_(h);counts[k]=(counts[k]||0)+1;}});
  return {columns:headers.length,blankHeaderColumns:blankHeaderColumns,
    duplicateHeaders:Object.keys(counts).filter(function(k){return counts[k]>1;})};
}



/* =====================================================================
 * PSS AI-PMO V18.3 Stable Extension
 * 基於使用者確認可正常使用的 V18.2 延伸：
 * 1. 12 小時無操作才逾時（滑動 Session）
 * 2. 同專案事件快篩歷程／甘特
 * 3. 首頁月曆＋每日展開
 * 4. 每日回報一次輸入多專案、多時段、多事件
 * 5. 任務、回報、事件可由日曆直接編輯／刪除
 * ===================================================================== */

const PSS_V183 = Object.freeze({
  VERSION: 'V19.0 Fusion Stable',
  INACTIVITY_SECONDS: 43200,
  CACHE_SECONDS: 21600,
  MAX_BATCH_ITEMS: 0,
  DAILY_EXTRA_HEADERS: Object.freeze([
    '批次回報ID','明細序號','開始時間','結束時間','工時分鐘','地點',
    '事件類型','關聯任務ID','主管','整體備註'
  ]),
  EVENT_SHEET_NAMES: Object.freeze(['事件回報','事件會議主檔','會議事件紀錄']),
  CALENDAR_EVENT_HEADERS: Object.freeze([
    '回報ID','事件ID','回報日期','日期','時間','人員','主管','場地代號','專案名稱',
    '事件類型','事件標題','事件說明','事件狀態','地點','建立時間','更新時間'
  ])
});

/* 可在測試 Apps Script 的 Script Properties 設定 PSS_DB_ID_OVERRIDE，
 * 讓測試部署使用主資料庫副本；未設定時沿用 APP.DB_ID。 */
/* R4.3 cleanup: removed shadowed legacy function getDb_. */

/* R4.3 cleanup: removed shadowed legacy function getProgressDb_. */

/* 12 小時「無操作」逾時。Cache 最長使用 6 小時，但 Script Properties 保留 Session，
 * 每次 API 操作會更新 lastActive，因此 6～12 小時仍可正常續用。 */
/* R4.3 cleanup: removed shadowed legacy function putSession_. */

/* R4.3 cleanup: removed shadowed legacy function getSession_. */

/* R4.3 cleanup: removed shadowed legacy function ensureDailyHeadersV183_. */

function getCalendarEventSheetV183_(createIfMissing) {
  const ss = getDb_();
  let sheet = ss.getSheetByName('事件回報');
  if (!sheet && createIfMissing !== false) sheet = ss.insertSheet('事件回報');
  if (sheet) ensureHeaders_(sheet, PSS_V183.CALENDAR_EVENT_HEADERS);
  return sheet;
}

function setupPssAiPmoV183() {
  setupPssAiPmoV182();
  ensureDailyHeadersV183_();
  getCalendarEventSheetV183_(true);
  const ss = getDb_();
  ['事件會議主檔','會議事件紀錄'].forEach(function(name) {
    const sheet = ss.getSheetByName(name);
    if (sheet) sheet.setFrozenRows(1);
  });
  PropertiesService.getScriptProperties().setProperty('PSS_V183_INSTALLED', new Date().toISOString());
  return [
    'PSS AI-PMO V18.3 初始化完成。',
    'Session：12 小時無操作逾時',
    '每日工作日誌：已補齊多筆明細欄位',
    '首頁：日曆與每日展開 API 已啟用',
    '資料庫：' + getDb_().getName()
  ].join('\n');
}

/* R4.3 cleanup: removed shadowed legacy function onOpen. */

/* R4.3 cleanup: removed shadowed legacy function doGet. */

/* R4.3 cleanup: removed shadowed legacy function dailyDefinitions_. */

function normalizeTimeV183_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, APP.TZ, 'HH:mm');
  }
  const text = clean_(value);
  if (!text) return '';
  let match = text.match(/(?:T|\s)(\d{1,2}):(\d{2})/);
  if (!match) match = text.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return text;
  return ('0' + match[1]).slice(-2) + ':' + match[2];
}

function workMinutesV183_(startTime, endTime) {
  const start = normalizeTimeV183_(startTime);
  const end = normalizeTimeV183_(endTime);
  if (!start || !end) return 0;
  const a = start.split(':').map(Number);
  const b = end.split(':').map(Number);
  const minutes = b[0] * 60 + b[1] - (a[0] * 60 + a[1]);
  if (minutes < 0) throw new Error('結束時間不可早於開始時間：' + start + '～' + end);
  return minutes;
}

function hoursTextV183_(minutes) {
  if (!minutes) return '';
  return (Math.round((Number(minutes) / 60) * 100) / 100).toString();
}

function validateDailyBatchItemV183_(item, index) {
  const no = index + 1;
  const eventTitle = clean_(item.eventTitle);
  const content = clean_(item.reportContent);
  const projectName = clean_(item.projectName);
  if (!projectName) throw new Error('第 ' + no + ' 筆：專案名稱必填。');
  if (!eventTitle) throw new Error('第 ' + no + ' 筆：事件／工作標題必填。');
  if (!content) throw new Error('第 ' + no + ' 筆：完成／回報事項必填。');
  const minutes = workMinutesV183_(item.startTime, item.endTime);
  return Object.assign({}, item, {
    eventTitle:eventTitle,
    reportContent:content,
    projectName:projectName,
    startTime:normalizeTimeV183_(item.startTime),
    endTime:normalizeTimeV183_(item.endTime),
    workMinutes:minutes
  });
}

function markTaskReportedV183_(token, task, completeTask) {
  if (!task) return;
  const taskSheet = getSheet_('TASKS');
  const target = readCanonical_(taskSheet, taskDefinitions_()).find(function(item) {
    return clean_(item.taskId) === clean_(task.taskId);
  });
  if (target) writeObject_(taskSheet, target.__rowNumber, {'回報狀態':'已回報','更新時間':new Date()});
  if (completeTask === true) updateTaskV17({token:token,taskId:task.taskId,status:'已完成'});
  else if (task.status === '未開始') updateTaskV17({token:token,taskId:task.taskId,status:'進行中'});
}

/* R4.3 cleanup: removed shadowed legacy function saveDailyReportBatchV183. */

/* R4.3 cleanup: removed shadowed legacy function normalizeDailyReportV183_. */

/* R4.3 cleanup: removed shadowed legacy function listDailyReportsV17. */

/* R4.3 cleanup: removed shadowed legacy function getDailyReportV183. */

/* R4.3 cleanup: removed shadowed legacy function updateDailyReportV183. */

function deleteDailyReportV183(payload) {
  payload = payload || {};
  const user = requireUser_(payload.token);
  const sheet = ensureDailyHeadersV183_();
  const target = readCanonical_(sheet,dailyDefinitions_()).find(function(item) {
    return clean_(item.reportId) === clean_(payload.reportId);
  });
  if (!target) throw new Error('找不到每日回報。');
  if (!isManager_(user) && clean_(target.person) !== user.name) throw new Error('只能刪除自己的回報。');
  sheet.deleteRow(target.__rowNumber);
  operationLog_(user,'刪除工作回報','每日工作日誌',payload.reportId,{
    projectName:clean_(target.projectName),date:dateOnly_(target.date||target.reportDate)
  },'成功');
  return '每日回報已刪除。附件檔案仍保留在 Google Drive。';
}

function monthRangeV183_(monthText) {
  const match = clean_(monthText).match(/^(\d{4})-(\d{2})$/);
  const base = match ? new Date(Number(match[1]),Number(match[2])-1,1) : new Date();
  const first = new Date(base.getFullYear(),base.getMonth(),1);
  const last = new Date(base.getFullYear(),base.getMonth()+1,0);
  return {
    month:Utilities.formatDate(first,APP.TZ,'yyyy-MM'),
    start:Utilities.formatDate(first,APP.TZ,'yyyy-MM-dd'),
    end:Utilities.formatDate(last,APP.TZ,'yyyy-MM-dd')
  };
}

function textTimeV183_(value) {
  return normalizeTimeV183_(value);
}

function eventSheetDefinitionsV183_() {
  return {
    id:['紀錄ID','事件ID','回報ID','會議ID'],date:['紀錄日期','回報日期','日期','會議日期','建立時間'],
    time:['紀錄時間','時間','開始時間'],endTime:['結束時間'],person:['人員','建立者','負責人'],
    supervisor:['主管'],siteCode:['場地代號'],projectName:['專案名稱'],
    type:['紀錄類型','事件類型','類型'],status:['事件狀態','狀態'],
    title:['事件標題','標題','會議主旨','事件說明'],
    detail:['現場狀況／討論事項','事件說明','內容','完成事項','決議／處理方式'],
    location:['地點'],url:['附件連結','附件','雲端資料夾','檔案連結'],createdAt:['建立時間'],updatedAt:['更新時間']
  };
}

function calendarEventsFromSheetV183_(sheet, user, access, range) {
  if (!sheet || sheet.getLastRow() < 2) return [];
  return readCanonical_(sheet,eventSheetDefinitionsV183_()).map(function(record) {
    const date = dateOnly_(record.date || record.createdAt);
    return {
      type:'事件',sourceSheet:sheet.getName(),rowNumber:record.__rowNumber,
      id:clean_(record.id) || sheet.getName() + '_' + record.__rowNumber,
      date:date,startTime:textTimeV183_(record.time),endTime:textTimeV183_(record.endTime),
      title:clean_(record.title)||clean_(record.detail)||'事件紀錄',detail:clean_(record.detail),
      siteCode:clean_(record.siteCode),projectName:clean_(record.projectName),
      project:[clean_(record.siteCode),clean_(record.projectName)].filter(Boolean).join('｜'),
      owner:clean_(record.person),supervisor:clean_(record.supervisor),eventType:clean_(record.type)||'事件',
      status:clean_(record.status),location:clean_(record.location),url:urlFromText_(record.url),
      editable:isManager_(user)||clean_(record.person)===user.name,
      deletable:isManager_(user)||clean_(record.person)===user.name
    };
  }).filter(function(item) {
    if (!item.date || item.date < range.start || item.date > range.end) return false;
    if (!access.canViewAllReports && item.owner && item.owner !== user.name) return false;
    return true;
  });
}

/* R4.3 cleanup: removed shadowed legacy function getHomeCalendarV183. */

/* R4.3 cleanup: removed shadowed legacy function getCalendarDayV183. */

function saveQuickEventV183(payload) {
  payload = payload || {};
  const user = requireUser_(payload.token);
  const sheet = getCalendarEventSheetV183_(true);
  const id = makeId_('EV');
  const object = {
    '回報ID':id,'事件ID':id,'回報日期':clean_(payload.date)||dateOnly_(new Date()),
    '日期':clean_(payload.date)||dateOnly_(new Date()),'時間':normalizeTimeV183_(payload.time),
    '人員':clean_(payload.person)||user.name,'主管':clean_(payload.supervisor),
    '場地代號':clean_(payload.siteCode),'專案名稱':clean_(payload.projectName),
    '事件類型':clean_(payload.eventType)||'事件','事件標題':clean_(payload.title),
    '事件說明':clean_(payload.detail),'事件狀態':clean_(payload.status)||'進行中',
    '地點':clean_(payload.location),'建立時間':new Date(),'更新時間':new Date()
  };
  if (!object['事件標題']) throw new Error('事件標題必填。');
  appendObject_(sheet,object);
  operationLog_(user,'新增日曆事件',sheet.getName(),id,object,'成功');
  return {message:'事件已建立。',id:id};
}

function getEventRecordV183(payload) {
  payload = payload || {};
  const user = requireUser_(payload.token);
  const sheet = getDb_().getSheetByName(clean_(payload.sourceSheet));
  if (!sheet) throw new Error('找不到事件資料表。');
  const rowNumber = Number(payload.rowNumber || 0);
  const record = readCanonical_(sheet,eventSheetDefinitionsV183_()).find(function(item){return item.__rowNumber===rowNumber;});
  if (!record) throw new Error('找不到事件紀錄。');
  if (!isManager_(user) && clean_(record.person) && clean_(record.person)!==user.name) throw new Error('只能編輯自己的事件。');
  return {
    sourceSheet:sheet.getName(),rowNumber:rowNumber,id:clean_(record.id),date:dateOnly_(record.date||record.createdAt),
    time:normalizeTimeV183_(record.time),person:clean_(record.person),supervisor:clean_(record.supervisor),
    siteCode:clean_(record.siteCode),projectName:clean_(record.projectName),eventType:clean_(record.type),
    title:clean_(record.title),detail:clean_(record.detail),status:clean_(record.status),location:clean_(record.location)
  };
}

function setAliasFieldV183_(sheet,rowNumber,aliases,canonical,value) {
  const hs = headers_(sheet);
  const map = headerMap_(hs);
  let indexes = fieldIndexes_(map,aliases);
  if (!indexes.length) {
    sheet.getRange(1,sheet.getLastColumn()+1).setValue(canonical);
    indexes = [sheet.getLastColumn()-1];
  }
  indexes.forEach(function(index){sheet.getRange(rowNumber,index+1).setValue(value);});
}

function updateEventRecordV183(payload) {
  payload = payload || {};
  const user = requireUser_(payload.token);
  const sheet = getDb_().getSheetByName(clean_(payload.sourceSheet));
  if (!sheet) throw new Error('找不到事件資料表。');
  const rowNumber = Number(payload.rowNumber||0);
  const current = getEventRecordV183({token:payload.token,sourceSheet:sheet.getName(),rowNumber:rowNumber});
  if (!isManager_(user) && current.person && current.person!==user.name) throw new Error('只能編輯自己的事件。');
  setAliasFieldV183_(sheet,rowNumber,['紀錄日期','回報日期','日期','會議日期'],'日期',clean_(payload.date));
  setAliasFieldV183_(sheet,rowNumber,['紀錄時間','時間','開始時間'],'時間',normalizeTimeV183_(payload.time));
  setAliasFieldV183_(sheet,rowNumber,['場地代號'],'場地代號',clean_(payload.siteCode));
  setAliasFieldV183_(sheet,rowNumber,['專案名稱'],'專案名稱',clean_(payload.projectName));
  setAliasFieldV183_(sheet,rowNumber,['紀錄類型','事件類型','類型'],'事件類型',clean_(payload.eventType));
  setAliasFieldV183_(sheet,rowNumber,['事件標題','標題','會議主旨'],'事件標題',clean_(payload.title));
  setAliasFieldV183_(sheet,rowNumber,['現場狀況／討論事項','事件說明','內容'],'事件說明',clean_(payload.detail));
  setAliasFieldV183_(sheet,rowNumber,['事件狀態','狀態'],'事件狀態',clean_(payload.status));
  setAliasFieldV183_(sheet,rowNumber,['地點'],'地點',clean_(payload.location));
  setAliasFieldV183_(sheet,rowNumber,['更新時間'],'更新時間',new Date());
  operationLog_(user,'更新日曆事件',sheet.getName(),current.id||rowNumber,payload,'成功');
  return '事件已更新。';
}

function deleteEventRecordV183(payload) {
  payload = payload || {};
  const user = requireUser_(payload.token);
  const sheet = getDb_().getSheetByName(clean_(payload.sourceSheet));
  if (!sheet) throw new Error('找不到事件資料表。');
  const rowNumber = Number(payload.rowNumber||0);
  const current = getEventRecordV183({token:payload.token,sourceSheet:sheet.getName(),rowNumber:rowNumber});
  if (!isManager_(user) && current.person && current.person!==user.name) throw new Error('只能刪除自己的事件。');
  sheet.deleteRow(rowNumber);
  operationLog_(user,'刪除日曆事件',sheet.getName(),current.id||rowNumber,current,'成功');
  return '事件已刪除。';
}

function urlFromText_(value) {
  const match = String(value || '').match(/https?:\/\/[^\s,，;]+/i);
  return match ? match[0] : '';
}

function normalizeTimelineProjectNameV183_(value) {
  return clean_(value)
    .replace(/^(PSS_[A-Z]+\d+|SITE_\d+|P_?\d+)\s*[|｜_\-:：]?\s*/i,'')
    .replace(/沛坡/g,'沛波')
    .replace(/股份有限公司|有限公司|企業有限公司|大樓|停車場|新建工程|工程案|專案/g,'')
    .replace(/[\s\-＿_｜|,，.。()（）\/\\:：]/g,'')
    .toLowerCase();
}

function projectMatchesV182_(siteCode,projectName,target) {
  const sourceCode = clean_(siteCode).toLowerCase();
  const targetCode = clean_(target.siteCode).toLowerCase();
  if (sourceCode && targetCode && sourceCode === targetCode) return true;
  const sourceName = normalizeTimelineProjectNameV183_(projectName);
  const targetName = normalizeTimelineProjectNameV183_(target.projectName);
  if (!sourceName || !targetName) return false;
  if (sourceName === targetName) return true;
  return Math.min(sourceName.length,targetName.length) >= 4 &&
    (sourceName.indexOf(targetName)>=0 || targetName.indexOf(sourceName)>=0);
}

function readTimelineEventSheetV183_(sheet,project,add) {
  if (!sheet || sheet.getLastRow()<2) return;
  readCanonical_(sheet,eventSheetDefinitionsV183_()).forEach(function(event) {
    if (!projectMatchesV182_(event.siteCode,event.projectName,project)) return;
    const date = dateOnly_(event.date||event.createdAt);
    add({
      type:clean_(event.type)||'事件',group:'事件/回報',sourceSheet:sheet.getName(),
      rowNumber:event.__rowNumber,sourceId:clean_(event.id)||sheet.getName()+'_'+event.__rowNumber,
      title:clean_(event.title)||clean_(event.detail)||'事件紀錄',detail:clean_(event.detail),
      owner:clean_(event.person),status:clean_(event.status),startDate:date,endDate:date,
      url:urlFromText_(event.url),color:'event'
    });
  });
}

function getProjectTimelineV182(payload) {
  payload = payload || {};
  requireManager_(payload.token);
  const project = getProjectV182(payload.token,payload.siteCode);
  const items = [];
  const seen = {};
  const add = function(item) {
    if (!item.startDate) return;
    const family = item.group === '任務' ? 'TASK' : (item.group === '檔案' ? 'FILE' : 'EVENT');
    const sourceId = clean_(item.sourceId);
    const key = sourceId
      ? [family,sourceId,item.startDate].join('|')
      : [family,normalizeTimelineProjectNameV183_(item.title),item.startDate,clean_(item.owner)].join('|');
    if (seen[key]) return;
    seen[key] = true;
    if (!item.endDate || item.endDate < item.startDate) item.endDate = item.startDate;
    items.push(item);
  };

  readCanonical_(getSheet_('TASKS'),taskDefinitions_()).forEach(function(task) {
    if (!projectMatchesV182_(task.siteCode,task.projectName,project)) return;
    add({
      type:'任務',group:'任務',sourceSheet:getSheet_('TASKS').getName(),rowNumber:task.__rowNumber,
      sourceId:clean_(task.taskId),title:clean_(task.content)||'未填任務內容',detail:clean_(task.note),
      owner:clean_(task.owner),status:clean_(task.status),
      startDate:dateOnly_(task.startTime||task.dispatchDate||task.dueDate),
      endDate:dateOnly_(task.endTime||task.finishDate||task.dueDate||task.dispatchDate),
      url:clean_(task.calendarUrl),color:'task'
    });
  });

  readCanonical_(ensureDailyHeadersV183_(),dailyDefinitions_()).forEach(function(report) {
    if (!projectMatchesV182_(report.siteCode,report.projectName,project)) return;
    const date = dateOnly_(report.date||report.reportDate||report.createdAt);
    add({
      type:'回報',group:'事件/回報',sourceSheet:getSheet_('DAILY_LOGS').getName(),rowNumber:report.__rowNumber,
      sourceId:clean_(report.reportId),title:clean_(report.eventTitle)||clean_(report.reportContent)||'工作回報',
      detail:[clean_(report.reportContent),clean_(report.issue)?'問題：'+clean_(report.issue):'',clean_(report.tomorrowPlan)?'後續：'+clean_(report.tomorrowPlan):''].filter(Boolean).join('\n'),
      owner:clean_(report.person),status:clean_(report.status),startDate:date,endDate:date,
      url:urlFromText_(report.attachment),color:'report'
    });
  });

  const ss = getDb_();
  PSS_V183.EVENT_SHEET_NAMES.forEach(function(name){readTimelineEventSheetV183_(ss.getSheetByName(name),project,add);});

  const historySheet = ss.getSheetByName('專案歷程') || ss.getSheetByName('PROJECT_HISTORY');
  if (historySheet) readCanonical_(historySheet,{
    id:['歷程ID'],date:['時間','開始日'],endDate:['結束日'],siteCode:['場地代號'],projectName:['專案名稱'],
    type:['類型'],title:['標題'],detail:['內容'],owner:['負責人'],status:['狀態'],url:['連結']
  }).forEach(function(history) {
    if (!projectMatchesV182_(history.siteCode,history.projectName,project)) return;
    add({
      type:clean_(history.type)||'歷程',group:'事件/回報',sourceSheet:historySheet.getName(),rowNumber:history.__rowNumber,
      sourceId:clean_(history.id),title:clean_(history.title)||'專案歷程',detail:clean_(history.detail),
      owner:clean_(history.owner),status:clean_(history.status),startDate:dateOnly_(history.date),
      endDate:dateOnly_(history.endDate||history.date),url:urlFromText_(history.url),color:'event'
    });
  });

  const attachmentSheet = getEventAttachmentSheetV182_(false);
  if (attachmentSheet) readCanonical_(attachmentSheet,{
    id:['附件ID'],date:['上傳時間'],person:['人員'],siteCode:['場地代號'],projectName:['專案名稱'],
    name:['檔名'],url:['檔案連結'],mimeType:['檔案類型'],folder:['資料夾']
  }).forEach(function(file) {
    if (!projectMatchesV182_(file.siteCode,file.projectName,project)) return;
    const date = dateOnly_(file.date);
    add({
      type:'附件',group:'檔案',sourceSheet:attachmentSheet.getName(),rowNumber:file.__rowNumber,
      sourceId:clean_(file.id),title:clean_(file.name)||'附件',detail:[clean_(file.mimeType),clean_(file.folder)].filter(Boolean).join('｜'),
      owner:clean_(file.person),status:'已上傳',startDate:date,endDate:date,url:clean_(file.url),color:'file'
    });
  });

  let driveWarning = '';
  if (payload.includeDriveFiles !== false) {
    try {
      listProjectCloudItemsV182({
        token:payload.token,siteCode:project.siteCode,folderType:'專案根目錄',
        keyword:clean_(payload.keyword),maxDepth:5,limit:1200
      }).filter(function(item){return item.type==='檔案'&&item.updatedDate;}).forEach(function(file) {
        add({
          type:'雲端檔案',group:'檔案',sourceSheet:'Google Drive',sourceId:clean_(file.url),
          title:file.name,detail:file.path,owner:'',status:'已更新',startDate:file.updatedDate,
          endDate:file.updatedDate,url:file.url,color:'file'
        });
      });
    } catch (error) {
      driveWarning = 'Drive 檔案未納入：' + error.message;
    }
  }

  const startFilter = clean_(payload.startDate);
  const endFilter = clean_(payload.endDate);
  const keyword = clean_(payload.keyword).toLowerCase();
  const filtered = items.filter(function(item) {
    if (startFilter && item.endDate < startFilter) return false;
    if (endFilter && item.startDate > endFilter) return false;
    if (keyword && [item.type,item.title,item.detail,item.owner,item.status,item.sourceSheet].join(' ').toLowerCase().indexOf(keyword)<0) return false;
    return true;
  }).sort(function(a,b) {
    return a.startDate.localeCompare(b.startDate) || a.group.localeCompare(b.group) || a.title.localeCompare(b.title,'zh-Hant');
  });

  let minDate = startFilter;
  let maxDate = endFilter;
  if (!minDate && filtered.length) minDate = filtered[0].startDate;
  if (!maxDate && filtered.length) maxDate = filtered.reduce(function(max,item){return item.endDate>max?item.endDate:max;},filtered[0].endDate);
  if (!minDate) minDate = dateOnly_(new Date(Date.now()-90*86400000));
  if (!maxDate) maxDate = dateOnly_(new Date());

  return {
    project:project,startDate:minDate,endDate:maxDate,items:filtered,warning:driveWarning,
    stats:{
      total:filtered.length,
      tasks:filtered.filter(function(item){return item.group==='任務';}).length,
      reports:filtered.filter(function(item){return item.type==='回報';}).length,
      events:filtered.filter(function(item){return item.group==='事件/回報'&&item.type!=='回報';}).length,
      files:filtered.filter(function(item){return item.group==='檔案';}).length
    }
  };
}

/* R4.3 cleanup: removed shadowed legacy function getDashboardV17. */

function runV183SelfTest() {
  const lines = ['PSS AI-PMO V18.3 自我檢查'];
  try {
    const ss = getDb_();
    lines.push('✅ 主資料庫：' + ss.getName() + ' / ' + ss.getId());
  } catch (error) { lines.push('❌ 主資料庫：' + error.message); }
  try {
    const daily = ensureDailyHeadersV183_();
    const hs = headers_(daily);
    const missing = PSS_V183.DAILY_EXTRA_HEADERS.filter(function(header){return hs.indexOf(header)<0;});
    lines.push((missing.length?'❌':'✅') + ' 每日工作日誌新增欄位：' + (missing.length?missing.join('、'):'完整'));
  } catch (error) { lines.push('❌ 每日工作日誌：' + error.message); }
  try {
    PSS_V183.EVENT_SHEET_NAMES.forEach(function(name) {
      const sheet = getDb_().getSheetByName(name);
      lines.push((sheet?'✅ ':'⚠️ ') + name + (sheet?'：'+Math.max(0,sheet.getLastRow()-1)+' 筆':'：不存在，歷程會略過'));
    });
  } catch (error) { lines.push('❌ 事件資料表：' + error.message); }
  lines.push('✅ 登入逾時：12 小時無操作');
  lines.push('✅ APP 宣告：沿用原 V18.2 單一 APP');
  lines.push('✅ Web App 標題：V18.3 Stable');
  return lines.join('\n');
}

function healthCheckV183() { return runV183SelfTest(); }


/* V18.3 相容入口：舊按鈕仍會進入最新初始化與健康檢查。 */
/* R4.3 cleanup: removed shadowed legacy function setupPssAiPmoV17Enterprise. */
/* R4.3 cleanup: removed shadowed legacy function healthCheckV17. */


/* ========================================================================
 * PSS AI-PMO V19.0 Fusion Stable
 * 以 V18.3 Stable 為核心，融合設備、服務、設定、部署與維護生命週期。
 * 所有新功能採新增分頁方式，不刪除或改寫既有專案、任務、回報資料。
 * ======================================================================== */
const PSS_V190 = Object.freeze({
  VERSION: 'V19.0 Fusion Stable',
  HEADERS: Object.freeze({
    ASSETS: ['設備ID','場地代號','專案名稱','系統分類','設備類型','設備名稱','型號','序號','IP','Port','COM Port','安裝位置','啟用狀態','健康狀態','程式版本','設定版本','最後心跳','最後測試日期','負責人','備註','建立時間','更新時間'],
    SERVICES: ['服務ID','設備ID','場地代號','專案名稱','服務名稱','執行檔路徑','啟動模式','自動啟動','啟用狀態','服務狀態','最後心跳','最後錯誤','備註','建立時間','更新時間'],
    CONFIG_ITEMS: ['設定ID','場地代號','專案名稱','設備ID','服務ID','區段','設定鍵','設定值','資料型別','是否敏感','啟用狀態','版本','來源檔案','修改人','更新時間','備註'],
    CONFIG_HISTORY: ['異動ID','設定ID','場地代號','專案名稱','區段','設定鍵','舊值','新值','修改人','修改時間','修改原因'],
    DEPLOYMENTS: ['部署ID','場地代號','專案名稱','設備ID','服務ID','程式名稱','原版本','新版本','部署日期','部署人','結果','備份連結','回復方式','驗證結果','備註','建立時間','更新時間'],
    MAINTENANCE: ['維護ID','場地代號','專案名稱','設備ID','服務ID','異常類型','嚴重度','問題說明','處理狀態','負責人','通報時間','預計完成日','完成時間','處理方式','根因','附件連結','建立者','建立時間','更新時間']
  })
});

function makeIdV190_(prefix) {
  return makeId_(prefix) + '_' + Utilities.getUuid().slice(0, 8);
}

/* R4.3 cleanup: removed shadowed legacy function setupPssAiPmoV190. */

function v190Sheet_(key) {
  return getOrCreateSheet_(key, PSS_V190.HEADERS[key]);
}

function findRecordByIdV190_(sheet, idHeader, id) {
  const target = clean_(id);
  if (!target) return null;
  const records = readCanonical_(sheet, {id:[idHeader]});
  return records.find(function(record) { return clean_(record.id) === target; }) || null;
}

function matchV190_(values, keyword) {
  const q = clean_(keyword).toLowerCase();
  if (!q) return true;
  return values.join(' ').toLowerCase().indexOf(q) >= 0;
}

function normalizeStatusV190_(value, fallback) {
  return clean_(value) || fallback;
}

function assetRecordsV190_() {
  return readCanonical_(v190Sheet_('ASSETS'), {
    assetId:['設備ID'],siteCode:['場地代號'],projectName:['專案名稱'],systemType:['系統分類'],assetType:['設備類型'],assetName:['設備名稱'],model:['型號'],serial:['序號'],ip:['IP'],port:['Port'],comPort:['COM Port'],location:['安裝位置'],active:['啟用狀態'],health:['健康狀態'],programVersion:['程式版本'],configVersion:['設定版本'],lastHeartbeat:['最後心跳'],lastTestDate:['最後測試日期'],owner:['負責人'],note:['備註'],createdAt:['建立時間'],updatedAt:['更新時間']
  });
}

function serviceRecordsV190_() {
  return readCanonical_(v190Sheet_('SERVICES'), {
    serviceId:['服務ID'],assetId:['設備ID'],siteCode:['場地代號'],projectName:['專案名稱'],serviceName:['服務名稱'],executablePath:['執行檔路徑'],startupMode:['啟動模式'],autoStart:['自動啟動'],active:['啟用狀態'],serviceStatus:['服務狀態'],lastHeartbeat:['最後心跳'],lastError:['最後錯誤'],note:['備註'],createdAt:['建立時間'],updatedAt:['更新時間']
  });
}

function configRecordsV190_() {
  return readCanonical_(v190Sheet_('CONFIG_ITEMS'), {
    configId:['設定ID'],siteCode:['場地代號'],projectName:['專案名稱'],assetId:['設備ID'],serviceId:['服務ID'],section:['區段'],configKey:['設定鍵'],configValue:['設定值'],dataType:['資料型別'],sensitive:['是否敏感'],active:['啟用狀態'],version:['版本'],sourceFile:['來源檔案'],modifier:['修改人'],updatedAt:['更新時間'],note:['備註']
  });
}

function deploymentRecordsV190_() {
  return readCanonical_(v190Sheet_('DEPLOYMENTS'), {
    deploymentId:['部署ID'],siteCode:['場地代號'],projectName:['專案名稱'],assetId:['設備ID'],serviceId:['服務ID'],programName:['程式名稱'],oldVersion:['原版本'],newVersion:['新版本'],deploymentDate:['部署日期'],deployer:['部署人'],result:['結果'],backupUrl:['備份連結'],rollback:['回復方式'],verification:['驗證結果'],note:['備註'],createdAt:['建立時間'],updatedAt:['更新時間']
  });
}

function maintenanceRecordsV190_() {
  return readCanonical_(v190Sheet_('MAINTENANCE'), {
    maintenanceId:['維護ID'],siteCode:['場地代號'],projectName:['專案名稱'],assetId:['設備ID'],serviceId:['服務ID'],issueType:['異常類型'],severity:['嚴重度'],description:['問題說明'],status:['處理狀態'],owner:['負責人'],reportedAt:['通報時間'],dueDate:['預計完成日'],completedAt:['完成時間'],resolution:['處理方式'],rootCause:['根因'],attachment:['附件連結'],creator:['建立者'],createdAt:['建立時間'],updatedAt:['更新時間']
  });
}

function formatRecordDatesV190_(record, fields) {
  fields.forEach(function(field) { record[field] = dateTime_(record[field]); });
  return record;
}

function isSensitiveConfigKeyV190_(key) {
  return /(token|password|passwd|pwd|secret|api[_-]?key|authorization|credential|private[_-]?key|ftp.*user|ftp.*pass)/i.test(clean_(key));
}

function maskValueV190_(value) {
  const text = clean_(value);
  if (!text) return '';
  if (text === '[MASKED]') return text;
  if (text.length <= 6) return '******';
  return text.slice(0, 3) + '********' + text.slice(-3);
}

function listAssetCenterV190(payload) {
  payload = payload || {};
  const user = requireUser_(payload.token);
  const access = accessFor_(user);
  const keyword = clean_(payload.keyword);
  const siteCode = clean_(payload.siteCode);
  function projectFilter(record) {
    if (siteCode && clean_(record.siteCode) !== siteCode) return false;
    return matchV190_(Object.keys(record).filter(function(key){return key.indexOf('__') !== 0;}).map(function(key){return clean_(record[key]);}), keyword);
  }
  const assets = assetRecordsV190_().filter(projectFilter).map(function(record) {
    return formatRecordDatesV190_(record, ['lastHeartbeat','createdAt','updatedAt']);
  });
  const services = serviceRecordsV190_().filter(projectFilter).map(function(record) {
    return formatRecordDatesV190_(record, ['lastHeartbeat','createdAt','updatedAt']);
  });
  const configs = configRecordsV190_().filter(projectFilter).map(function(record) {
    record.updatedAt = dateTime_(record.updatedAt);
    record.displayValue = clean_(record.sensitive) === '是' && !access.manager ? maskValueV190_(record.configValue) : clean_(record.configValue);
    if (!access.manager && clean_(record.sensitive) === '是') record.configValue = '';
    return record;
  });
  const deployments = deploymentRecordsV190_().filter(projectFilter).map(function(record) {
    return formatRecordDatesV190_(record, ['deploymentDate','createdAt','updatedAt']);
  });
  const maintenance = maintenanceRecordsV190_().filter(projectFilter).map(function(record) {
    return formatRecordDatesV190_(record, ['reportedAt','completedAt','createdAt','updatedAt']);
  });
  let projects = [];
  try { projects = listProjectSelectionV182(payload.token, ''); } catch (ignore) {}
  const openMaintenance = maintenance.filter(function(item){return ['已完成','已結案','取消'].indexOf(clean_(item.status)) < 0;});
  return {
    version:PSS_V190.VERSION,user:user,access:access,projects:projects,
    assets:assets,services:services,configs:configs,deployments:deployments,maintenance:maintenance,
    stats:{
      assets:assets.filter(function(item){return clean_(item.active) !== '停用';}).length,
      abnormalAssets:assets.filter(function(item){return ['異常','離線','警告'].indexOf(clean_(item.health)) >= 0;}).length,
      abnormalServices:services.filter(function(item){return ['異常','停止','離線'].indexOf(clean_(item.serviceStatus)) >= 0;}).length,
      openMaintenance:openMaintenance.length,
      deployments:deployments.length
    }
  };
}

function saveAssetV190(payload) {
  payload = payload || {};
  const user = requireManager_(payload.token);
  if (!clean_(payload.siteCode) || !clean_(payload.projectName) || !clean_(payload.assetName)) throw new Error('場地代號、專案名稱及設備名稱為必填。');
  const sheet = v190Sheet_('ASSETS');
  const existing = findRecordByIdV190_(sheet, '設備ID', payload.assetId);
  const now = new Date();
  const assetId = existing ? clean_(existing.id) : makeIdV190_('AST');
  const object = {
    '設備ID':assetId,'場地代號':clean_(payload.siteCode),'專案名稱':clean_(payload.projectName),
    '系統分類':clean_(payload.systemType),'設備類型':clean_(payload.assetType),'設備名稱':clean_(payload.assetName),
    '型號':clean_(payload.model),'序號':clean_(payload.serial),'IP':clean_(payload.ip),'Port':clean_(payload.port),
    'COM Port':clean_(payload.comPort),'安裝位置':clean_(payload.location),'啟用狀態':normalizeStatusV190_(payload.active,'啟用'),
    '健康狀態':normalizeStatusV190_(payload.health,'未檢查'),'程式版本':clean_(payload.programVersion),'設定版本':clean_(payload.configVersion),
    '最後心跳':clean_(payload.lastHeartbeat),'最後測試日期':clean_(payload.lastTestDate),'負責人':clean_(payload.owner),
    '備註':clean_(payload.note),'更新時間':now
  };
  if (existing) writeObject_(sheet, existing.__rowNumber, object);
  else { object['建立時間'] = now; appendObject_(sheet, object); }
  operationLog_(user, existing?'更新設備':'新增設備', '設備中心', assetId, object, '成功');
  return {message:'設備資料已儲存。',assetId:assetId};
}

function saveServiceV190(payload) {
  payload = payload || {};
  const user = requireManager_(payload.token);
  if (!clean_(payload.siteCode) || !clean_(payload.projectName) || !clean_(payload.serviceName)) throw new Error('場地代號、專案名稱及服務名稱為必填。');
  const sheet = v190Sheet_('SERVICES');
  const existing = findRecordByIdV190_(sheet, '服務ID', payload.serviceId);
  const now = new Date();
  const serviceId = existing ? clean_(existing.id) : makeIdV190_('SVC');
  const object = {
    '服務ID':serviceId,'設備ID':clean_(payload.assetId),'場地代號':clean_(payload.siteCode),'專案名稱':clean_(payload.projectName),
    '服務名稱':clean_(payload.serviceName),'執行檔路徑':clean_(payload.executablePath),'啟動模式':clean_(payload.startupMode)||'自動',
    '自動啟動':clean_(payload.autoStart)||'是','啟用狀態':clean_(payload.active)||'啟用','服務狀態':clean_(payload.serviceStatus)||'未檢查',
    '最後心跳':clean_(payload.lastHeartbeat),'最後錯誤':clean_(payload.lastError),'備註':clean_(payload.note),'更新時間':now
  };
  if (existing) writeObject_(sheet, existing.__rowNumber, object);
  else { object['建立時間'] = now; appendObject_(sheet, object); }
  operationLog_(user, existing?'更新服務':'新增服務', '設備中心', serviceId, object, '成功');
  return {message:'服務資料已儲存。',serviceId:serviceId};
}

function inferConfigTypeV190_(value) {
  const text = clean_(value);
  if (/^(0|1|true|false|yes|no)$/i.test(text)) return '布林';
  if (/^-?\d+(\.\d+)?$/.test(text)) return '數值';
  if (/^(https?|wss?|ftp):\/\//i.test(text)) return 'URL';
  return '文字';
}

function appendConfigHistoryV190_(user, oldRecord, newValue, reason) {
  appendObject_(v190Sheet_('CONFIG_HISTORY'), {
    '異動ID':makeIdV190_('CFGLOG'),'設定ID':clean_(oldRecord.configId),'場地代號':clean_(oldRecord.siteCode),
    '專案名稱':clean_(oldRecord.projectName),'區段':clean_(oldRecord.section),'設定鍵':clean_(oldRecord.configKey),
    '舊值':clean_(oldRecord.configValue),'新值':clean_(newValue),'修改人':user.name,'修改時間':new Date(),'修改原因':clean_(reason)
  });
}

function saveConfigItemV190(payload) {
  payload = payload || {};
  const user = requireManager_(payload.token);
  if (!clean_(payload.siteCode) || !clean_(payload.projectName) || !clean_(payload.section) || !clean_(payload.configKey)) throw new Error('專案、區段及設定鍵為必填。');
  const sheet = v190Sheet_('CONFIG_ITEMS');
  const existingRaw = findRecordByIdV190_(sheet, '設定ID', payload.configId);
  let oldRecord = null;
  if (existingRaw) oldRecord = configRecordsV190_().find(function(item){return clean_(item.configId)===clean_(payload.configId);}) || null;
  const now = new Date();
  const configId = existingRaw ? clean_(existingRaw.id) : makeIdV190_('CFG');
  const sensitive = clean_(payload.sensitive) === '是' || isSensitiveConfigKeyV190_(payload.configKey) ? '是' : '否';
  const value = clean_(payload.configValue);
  const object = {
    '設定ID':configId,'場地代號':clean_(payload.siteCode),'專案名稱':clean_(payload.projectName),'設備ID':clean_(payload.assetId),
    '服務ID':clean_(payload.serviceId),'區段':clean_(payload.section),'設定鍵':clean_(payload.configKey),'設定值':value,
    '資料型別':clean_(payload.dataType)||inferConfigTypeV190_(value),'是否敏感':sensitive,'啟用狀態':clean_(payload.active)||'啟用',
    '版本':clean_(payload.version)||'V1','來源檔案':clean_(payload.sourceFile),'修改人':user.name,'更新時間':now,'備註':clean_(payload.note)
  };
  if (existingRaw) {
    if (oldRecord && clean_(oldRecord.configValue) !== value) appendConfigHistoryV190_(user, oldRecord, value, payload.reason||'Web App 編輯');
    writeObject_(sheet, existingRaw.__rowNumber, object);
  } else appendObject_(sheet, object);
  operationLog_(user, existingRaw?'更新設定':'新增設定', '設定中心', configId, {section:object['區段'],key:object['設定鍵'],sensitive:sensitive}, '成功');
  return {message:'設定資料已儲存。',configId:configId};
}

function saveDeploymentV190(payload) {
  payload = payload || {};
  const user = requireManager_(payload.token);
  if (!clean_(payload.siteCode) || !clean_(payload.projectName) || !clean_(payload.programName)) throw new Error('專案及程式名稱為必填。');
  const sheet = v190Sheet_('DEPLOYMENTS');
  const existing = findRecordByIdV190_(sheet, '部署ID', payload.deploymentId);
  const now = new Date();
  const deploymentId = existing ? clean_(existing.id) : makeIdV190_('DEP');
  const object = {
    '部署ID':deploymentId,'場地代號':clean_(payload.siteCode),'專案名稱':clean_(payload.projectName),'設備ID':clean_(payload.assetId),
    '服務ID':clean_(payload.serviceId),'程式名稱':clean_(payload.programName),'原版本':clean_(payload.oldVersion),'新版本':clean_(payload.newVersion),
    '部署日期':clean_(payload.deploymentDate)||new Date(),'部署人':clean_(payload.deployer)||user.name,'結果':clean_(payload.result)||'待部署',
    '備份連結':clean_(payload.backupUrl),'回復方式':clean_(payload.rollback),'驗證結果':clean_(payload.verification),'備註':clean_(payload.note),'更新時間':now
  };
  if (existing) writeObject_(sheet, existing.__rowNumber, object);
  else { object['建立時間'] = now; appendObject_(sheet, object); }
  operationLog_(user, existing?'更新部署':'新增部署', '部署管理', deploymentId, object, '成功');
  return {message:'部署紀錄已儲存。',deploymentId:deploymentId};
}

function saveMaintenanceV190(payload) {
  payload = payload || {};
  const user = requireUser_(payload.token);
  if (!clean_(payload.siteCode) || !clean_(payload.projectName) || !clean_(payload.description)) throw new Error('專案及問題說明為必填。');
  const sheet = v190Sheet_('MAINTENANCE');
  const existing = findRecordByIdV190_(sheet, '維護ID', payload.maintenanceId);
  if (existing && !isManager_(user)) throw new Error('既有維護紀錄僅主管可編輯。');
  const now = new Date();
  const maintenanceId = existing ? clean_(existing.id) : makeIdV190_('MNT');
  const status = clean_(payload.status)||'待處理';
  const object = {
    '維護ID':maintenanceId,'場地代號':clean_(payload.siteCode),'專案名稱':clean_(payload.projectName),'設備ID':clean_(payload.assetId),
    '服務ID':clean_(payload.serviceId),'異常類型':clean_(payload.issueType)||'設備異常','嚴重度':clean_(payload.severity)||'一般',
    '問題說明':clean_(payload.description),'處理狀態':status,'負責人':clean_(payload.owner),'通報時間':clean_(payload.reportedAt)||now,
    '預計完成日':clean_(payload.dueDate),'完成時間':clean_(payload.completedAt)||(status==='已完成'?now:''),'處理方式':clean_(payload.resolution),
    '根因':clean_(payload.rootCause),'附件連結':clean_(payload.attachment),'建立者':existing?'':user.name,'更新時間':now
  };
  if (existing) writeObject_(sheet, existing.__rowNumber, object);
  else { object['建立時間'] = now; appendObject_(sheet, object); }
  operationLog_(user, existing?'更新維護':'新增維護', '維護異常', maintenanceId, object, '成功');
  return {message:'維護異常紀錄已儲存。',maintenanceId:maintenanceId};
}

function parseIniV190_(text) {
  const entries = [];
  let section = 'General';
  clean_(text).split(/\r?\n/).forEach(function(rawLine) {
    const line = clean_(rawLine);
    if (!line || line.charAt(0)===';' || line.charAt(0)==='#') return;
    const sectionMatch = line.match(/^\[([^\]]+)\]$/);
    if (sectionMatch) { section = clean_(sectionMatch[1]) || 'General'; return; }
    const equal = line.indexOf('=');
    if (equal < 1) return;
    const key = clean_(line.slice(0, equal));
    const value = clean_(line.slice(equal + 1));
    if (key) entries.push({section:section,key:key,value:value});
  });
  return entries;
}

function parseServiceXmlV190_(text) {
  const services = [];
  const tagRegex = /<service\b[^>]*>/gi;
  let tag;
  while ((tag = tagRegex.exec(clean_(text))) !== null) {
    const attrs = {};
    const attrRegex = /([\w:-]+)\s*=\s*["']([^"']*)["']/g;
    let attr;
    while ((attr = attrRegex.exec(tag[0])) !== null) attrs[attr[1].toLowerCase()] = attr[2];
    if (attrs.name) services.push({name:attrs.name,executable:attrs.executable||''});
  }
  return services;
}

function equipmentTypeFromSectionV190_(section) {
  const s = clean_(section).toLowerCase();
  if (s.indexOf('thermalprinter')>=0) return '熱感印表機';
  if (s.indexOf('billacceptor')>=0) return '收鈔機';
  if (s.indexOf('coinhopper')>=0) return '找幣機';
  if (s.indexOf('slotmachine')>=0) return '收幣機';
  if (s.indexOf('qrcodereader')>=0) return 'QR掃描器';
  if (s.indexOf('creditcard')>=0) return '信用卡機';
  if (s.indexOf('rc600')>=0) return 'RC600讀卡機';
  if (s.indexOf('t800')>=0) return 'T800模組';
  if (s.indexOf('cashdispenser')>=0) return '找鈔機';
  if (s.indexOf('megcodereader')>=0) return '磁條刷卡機';
  return '周邊設備';
}

function importArchitectureConfigV190(payload) {
  payload = payload || {};
  const user = requireManager_(payload.token);
  const siteCode = clean_(payload.siteCode), projectName = clean_(payload.projectName), content = String(payload.content||'');
  if (!siteCode || !projectName) throw new Error('請先選擇專案。');
  if (!clean_(content)) throw new Error('請貼上或載入 INI／Service.xml 內容。');
  const sourceFile = clean_(payload.fileName)||'手動匯入';
  const isXml = /<services?[\s>]/i.test(content) || /\.xml$/i.test(sourceFile);
  let serviceCount = 0, configCount = 0, assetCount = 0, updatedCount = 0;
  const now = new Date();
  if (isXml) {
    const serviceSheet = v190Sheet_('SERVICES');
    const existing = serviceRecordsV190_();
    parseServiceXmlV190_(content).forEach(function(service) {
      const found = existing.find(function(item){return clean_(item.siteCode)===siteCode && clean_(item.serviceName).toLowerCase()===clean_(service.name).toLowerCase();});
      const object = {'服務ID':found?found.serviceId:makeIdV190_('SVC'),'場地代號':siteCode,'專案名稱':projectName,'服務名稱':service.name,'執行檔路徑':service.executable,'啟動模式':'自動','自動啟動':'是','啟用狀態':'啟用','服務狀態':'未檢查','備註':'由 '+sourceFile+' 匯入','更新時間':now};
      if (found) { writeObject_(serviceSheet, found.__rowNumber, object); updatedCount++; }
      else { object['建立時間']=now; appendObject_(serviceSheet,object); serviceCount++; }
    });
  } else {
    const configSheet = v190Sheet_('CONFIG_ITEMS');
    const historySheet = v190Sheet_('CONFIG_HISTORY');
    const assetSheet = v190Sheet_('ASSETS');
    const configs = configRecordsV190_();
    const assets = assetRecordsV190_();
    const entries = parseIniV190_(content);
    const bySection = {};
    entries.forEach(function(entry){if(!bySection[entry.section])bySection[entry.section]=[];bySection[entry.section].push(entry);});
    entries.forEach(function(entry) {
      const sensitive = isSensitiveConfigKeyV190_(entry.key);
      const value = sensitive && payload.maskSensitive !== false ? '[MASKED]' : entry.value;
      const found = configs.find(function(item){return clean_(item.siteCode)===siteCode && clean_(item.section).toLowerCase()===entry.section.toLowerCase() && clean_(item.configKey).toLowerCase()===entry.key.toLowerCase();});
      const id = found ? found.configId : makeIdV190_('CFG');
      const object = {'設定ID':id,'場地代號':siteCode,'專案名稱':projectName,'區段':entry.section,'設定鍵':entry.key,'設定值':value,'資料型別':inferConfigTypeV190_(entry.value),'是否敏感':sensitive?'是':'否','啟用狀態':'啟用','版本':'匯入','來源檔案':sourceFile,'修改人':user.name,'更新時間':now,'備註':sensitive&&payload.maskSensitive!==false?'敏感值匯入時已遮罩，不保存原值。':''};
      if (found) {
        if (clean_(found.configValue)!==value) appendObject_(historySheet,{'異動ID':makeIdV190_('CFGLOG'),'設定ID':id,'場地代號':siteCode,'專案名稱':projectName,'區段':entry.section,'設定鍵':entry.key,'舊值':found.configValue,'新值':value,'修改人':user.name,'修改時間':now,'修改原因':'由 '+sourceFile+' 重新匯入'});
        writeObject_(configSheet,found.__rowNumber,object);updatedCount++;
      } else { appendObject_(configSheet,object);configCount++; }
    });
    Object.keys(bySection).forEach(function(section) {
      const serial = bySection[section].find(function(entry){return entry.key.toLowerCase()==='serial_port';});
      if (!serial) return;
      const found = assets.find(function(item){return clean_(item.siteCode)===siteCode && clean_(item.assetName).toLowerCase()===section.toLowerCase();});
      const object = {'設備ID':found?found.assetId:makeIdV190_('AST'),'場地代號':siteCode,'專案名稱':projectName,'系統分類':'停車設備','設備類型':equipmentTypeFromSectionV190_(section),'設備名稱':section,'COM Port':serial.value,'啟用狀態':'啟用','健康狀態':'未檢查','備註':'由 '+sourceFile+' 自動建立','更新時間':now};
      if (found) { writeObject_(assetSheet,found.__rowNumber,object);updatedCount++; }
      else { object['建立時間']=now;appendObject_(assetSheet,object);assetCount++; }
    });
  }
  operationLog_(user,'匯入架構設定','設備中心',siteCode,{file:sourceFile,services:serviceCount,configs:configCount,assets:assetCount,updated:updatedCount},'成功');
  return {message:'匯入完成。',services:serviceCount,configs:configCount,assets:assetCount,updated:updatedCount};
}

function checklistForAssetV190_(asset) {
  let list = ['確認設備型號、序號及數量','確認安裝位置、固定方式及電源','確認通訊參數與線路標示','執行單機功能測試','執行系統連動測試','拍攝設備、配線及測試照片','更新設備主檔與交接資料'];
  const type = (clean_(asset.assetType)+' '+clean_(asset.assetName)).toLowerCase();
  if (/印表機|printer/.test(type)) list.splice(3,0,'確認 COM Port、驅動及列印格式','執行測試列印與裁刀測試');
  if (/hub|交換器|switch/.test(type)) list.splice(3,0,'設定管理 IP 與 Uplink','逐埠測試並建立 Port 對照表');
  if (/門禁|讀頭|控制器/.test(type)) list.splice(3,0,'確認門號、讀頭、鎖與按鈕點位','執行開門、警報與權限測試');
  if (/機器人|robot|cc1|mt1/.test(type)) list.splice(3,0,'完成地圖、網路及任務點設定','執行導航、避障及回充測試');
  return unique_(list);
}

function createAssetChecklistV190(payload) {
  payload = payload || {};
  const user = requireManager_(payload.token);
  const asset = assetRecordsV190_().find(function(item){return clean_(item.assetId)===clean_(payload.assetId);});
  if (!asset) throw new Error('找不到設備資料。');
  const owner = clean_(payload.owner)||clean_(asset.owner);
  if (!owner) throw new Error('請指定任務負責人。');
  const tasks = checklistForAssetV190_(asset);
  tasks.forEach(function(content) {
    createTasksMultiOwnerV17({token:payload.token,siteCode:asset.siteCode,projectName:asset.projectName,taskType:'設備建置／查驗',content:'【'+asset.assetName+'】'+content,owners:[owner],priority:clean_(payload.priority)||'一般',dueDate:clean_(payload.dueDate),note:'設備ID：'+asset.assetId+'｜'+clean_(asset.location),createCalendar:payload.createCalendar===true});
  });
  operationLog_(user,'產生設備查驗任務','設備中心',asset.assetId,{owner:owner,count:tasks.length},'成功');
  return {message:'已建立 '+tasks.length+' 筆設備建置／查驗任務。',count:tasks.length};
}

function runV190SelfTest() {
  const lines = ['PSS AI-PMO V19.0 Fusion Stable 自我檢查'];
  try { lines.push('✅ 主資料庫：'+getDb_().getName()+' / '+APP.DB_ID); } catch (error) { lines.push('❌ 主資料庫：'+error.message); }
  Object.keys(PSS_V190.HEADERS).forEach(function(key) {
    try {
      const sheet = v190Sheet_(key), hs = headers_(sheet), missing = PSS_V190.HEADERS[key].filter(function(header){return hs.indexOf(header)<0;});
      lines.push((missing.length?'❌':'✅')+' '+candidates_(key)[0]+'：'+(missing.length?'缺少 '+missing.join('、'):Math.max(0,sheet.getLastRow()-1)+' 筆'));
    } catch (error) { lines.push('❌ '+key+'：'+error.message); }
  });
  lines.push('✅ 相容核心：V18.3 Stable');
  lines.push('✅ Session：12 小時無操作逾時');
  lines.push('✅ 新增資料不覆寫既有專案／任務／每日回報分頁');
  return lines.join('\n');
}

/* R4.3 cleanup: removed shadowed legacy function healthCheckV190. */

/* 最新入口與舊版相容入口。Apps Script 以最後宣告為準。 */
/* R4.3 cleanup: removed shadowed legacy function setupPssAiPmoV17Enterprise. */
/* R4.3 cleanup: removed shadowed legacy function healthCheckV17. */
/* R4.3 cleanup: removed shadowed legacy function onOpen. */
/* R4.3 cleanup: removed shadowed legacy function doGet. */

/* ========================================================================
 * PSS AI-PMO V19.1 Quotation Fusion Stable
 * 取消 V19.0「設備／服務」前端入口，替換為 PSS 報價單產生器 V5。
 * 報價品項、歷史價格、系統設定、報價主檔與明細全部存於 APP.DB_ID。
 * 舊設備生命週期資料不刪除，只在「欄位使用稽核」標記為 ⚪ 前端停用。
 * ======================================================================== */
const PSS_V191 = Object.freeze({
  VERSION:'V19.1 Quotation Fusion Stable',
  HEADERS:Object.freeze({
    QUOTE_ITEMS:['品項ID','大分類','分類','品號','品名／規格','單位','成本單價','建議報價單價','供應商','來源報價','來源日期','備註','啟用狀態','建立時間','更新時間','建立來源','歷史最低價','歷史最高價','歷史平均價','歷史價格筆數'],
    QUOTE_CATEGORIES:['分類ID','大分類','分類名稱','品項數量','啟用狀態','排序','建立時間','更新時間'],
    QUOTE_HISTORY:['歷史ID','品項ID','品號','品名／規格','分類','單位','價格日期','來源報價','歷史單價','備註','建立時間'],
    QUOTE_SETTINGS:['設定鍵','設定值','說明','更新時間'],
    QUOTE_LOGS:['時間','帳號','姓名','動作','目標類型','目標ID','內容','結果','錯誤訊息','版本','來源'],
    QUOTE_MASTER:['報價ID','報價單號','版本','狀態','報價日期','有效天數','場地代號','專案名稱','客戶名稱','客戶聯絡人','工程地點','客戶電話','付款條件','公司名稱','統一編號','公司電話','公司傳真','公司地址','公司網站Email','報價標題','英文標題','折扣','稅率','成本小計','未稅小計','營業稅','含稅總額','預估毛利','預估毛利率','報價說明','業務姓名','業務職稱','業務部門','業務手機','業務電話','業務Email','業務地址','業務其他','建立者','建立時間','更新者','更新時間','封存狀態'],
    QUOTE_LINES:['明細ID','報價ID','報價單號','項次','品項ID','大分類','分類','品號','品名規格','單位','數量','成本單價','報價單價','未稅金額','備註','來源報價','建立時間','更新時間'],
    FIELD_AUDIT:['稽核日期','符號','使用狀態','模組','工作表','欄位範圍','說明','處理方式']
  })
});

const PSS_V191_SEED = JSON.parse("[{\"code\":\"MNT-001\",\"category\":\"保養服務\",\"name\":\"全責保養（第1-2年，每季1次）\",\"unit\":\"次\",\"cost\":18000,\"price\":18000,\"supplier\":\"阜爾運通\",\"source\":\"青埔資訊大樓停管設備養護\",\"sourceDate\":\"2022-10-18\",\"note\":\"※設備保固2年\\n※含電子發票上傳費用\\n※每月提供1次巡檢保養表\",\"history\":[{\"date\":\"2022-10-18\",\"source\":\"青埔資訊大樓停管設備養護\",\"cost\":18000.0,\"note\":\"※設備保固2年\\n※含電子發票上傳費用\\n※每月提供1次巡檢保養表\"}]},{\"code\":\"MNT-002\",\"category\":\"保養服務\",\"name\":\"全責保養（第3-6年，每月1次）\",\"unit\":\"次\",\"cost\":18000,\"price\":18000,\"supplier\":\"阜爾運通\",\"source\":\"青埔資訊大樓停管設備養護\",\"sourceDate\":\"2022-10-18\",\"note\":\"※含電子發票上傳費用\",\"history\":[{\"date\":\"2022-10-18\",\"source\":\"青埔資訊大樓停管設備養護\",\"cost\":18000.0,\"note\":\"※含電子發票上傳費用\"}]},{\"code\":\"PARK-001\",\"category\":\"停車管理設備\",\"name\":\"入口車辨導覽機\",\"unit\":\"台\",\"cost\":65000,\"price\":65000,\"supplier\":\"阜爾運通\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"sourceDate\":\"2022-10-21\",\"note\":\"\",\"history\":[{\"date\":\"2022-10-21\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"cost\":65000.0,\"note\":\"\"},{\"date\":\"2022-10-18\",\"source\":\"青埔資訊大樓停管設備建置（議價後）\",\"cost\":65000.0,\"note\":\"\"},{\"date\":\"2022-10-01\",\"source\":\"青埔資訊大樓停管設備建置（原報價）\",\"cost\":65000.0,\"note\":\"\"},{\"date\":\"2020-07-24\",\"source\":\"國泰人壽台北置地停管系統更新工程\",\"cost\":65000,\"note\":\"\"}]},{\"code\":\"PARK-002\",\"category\":\"停車管理設備\",\"name\":\"出口車辨導覽機\",\"unit\":\"台\",\"cost\":68000,\"price\":68000,\"supplier\":\"阜爾運通\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"sourceDate\":\"2022-10-21\",\"note\":\"\",\"history\":[{\"date\":\"2022-10-21\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"cost\":68000.0,\"note\":\"\"},{\"date\":\"2022-10-18\",\"source\":\"青埔資訊大樓停管設備建置（議價後）\",\"cost\":68000.0,\"note\":\"\"},{\"date\":\"2022-10-01\",\"source\":\"青埔資訊大樓停管設備建置（原報價）\",\"cost\":68000.0,\"note\":\"\"},{\"date\":\"2020-07-24\",\"source\":\"國泰人壽台北置地停管系統更新工程\",\"cost\":68000,\"note\":\"\"}]},{\"code\":\"PARK-003\",\"category\":\"停車管理設備\",\"name\":\"感應線圈\",\"unit\":\"組\",\"cost\":4500,\"price\":4500,\"supplier\":\"阜爾運通\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"sourceDate\":\"2022-10-21\",\"note\":\"數量調整\",\"history\":[{\"date\":\"2022-10-21\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"cost\":4500.0,\"note\":\"數量調整\"},{\"date\":\"2022-10-18\",\"source\":\"青埔資訊大樓停管設備建置（議價後）\",\"cost\":4500.0,\"note\":\"數量調整\"},{\"date\":\"2022-10-01\",\"source\":\"青埔資訊大樓停管設備建置（原報價）\",\"cost\":4500.0,\"note\":\"數量調整\"},{\"date\":\"2020-07-24\",\"source\":\"國泰人壽台北置地停管系統更新工程\",\"cost\":4500,\"note\":\"\"},{\"date\":\"2020-06-18\",\"source\":\"國泰置地廣場機車區\",\"cost\":1800.0,\"note\":\"\"}]},{\"code\":\"PARK-004\",\"category\":\"停車管理設備\",\"name\":\"控制器\",\"unit\":\"組\",\"cost\":35000,\"price\":35000,\"supplier\":\"阜爾運通\",\"source\":\"國泰人壽台北置地停管系統更新工程\",\"sourceDate\":\"2020-07-24\",\"note\":\"\",\"history\":[{\"date\":\"2020-07-24\",\"source\":\"國泰人壽台北置地停管系統更新工程\",\"cost\":35000,\"note\":\"\"}]},{\"code\":\"PARK-005\",\"category\":\"停車管理設備\",\"name\":\"收費管理系統\",\"unit\":\"台\",\"cost\":100000,\"price\":100000,\"supplier\":\"阜爾運通\",\"source\":\"青埔資訊大樓停管設備建置（原報價）\",\"sourceDate\":\"2022-10-01\",\"note\":\"\",\"history\":[{\"date\":\"2022-10-21\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"cost\":0.0,\"note\":\"贈送\"},{\"date\":\"2022-10-18\",\"source\":\"青埔資訊大樓停管設備建置（議價後）\",\"cost\":0.0,\"note\":\"贈送\"},{\"date\":\"2022-10-01\",\"source\":\"青埔資訊大樓停管設備建置（原報價）\",\"cost\":100000.0,\"note\":\"\"},{\"date\":\"2020-07-24\",\"source\":\"國泰人壽台北置地停管系統更新工程\",\"cost\":100000,\"note\":\"\"}]},{\"code\":\"PARK-006\",\"category\":\"停車管理設備\",\"name\":\"柵欄機\",\"unit\":\"台\",\"cost\":25000,\"price\":25000,\"supplier\":\"阜爾運通\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"sourceDate\":\"2022-10-21\",\"note\":\"\",\"history\":[{\"date\":\"2022-10-21\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"cost\":25000.0,\"note\":\"\"},{\"date\":\"2022-10-18\",\"source\":\"青埔資訊大樓停管設備建置（議價後）\",\"cost\":35000.0,\"note\":\"\"},{\"date\":\"2022-10-01\",\"source\":\"青埔資訊大樓停管設備建置（原報價）\",\"cost\":35000.0,\"note\":\"\"},{\"date\":\"2020-07-24\",\"source\":\"國泰人壽台北置地停管系統更新工程\",\"cost\":35000,\"note\":\"\"}]},{\"code\":\"PARK-007\",\"category\":\"停車管理設備\",\"name\":\"自動繳費機\",\"unit\":\"台\",\"cost\":255000,\"price\":255000,\"supplier\":\"阜爾運通\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"sourceDate\":\"2022-10-21\",\"note\":\"\",\"history\":[{\"date\":\"2022-10-21\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"cost\":255000.0,\"note\":\"\"},{\"date\":\"2022-10-18\",\"source\":\"青埔資訊大樓停管設備建置（議價後）\",\"cost\":255000.0,\"note\":\"\"},{\"date\":\"2022-10-01\",\"source\":\"青埔資訊大樓停管設備建置（原報價）\",\"cost\":255000.0,\"note\":\"\"},{\"date\":\"2020-07-24\",\"source\":\"國泰人壽台北置地停管系統更新工程\",\"cost\":255000,\"note\":\"\"}]},{\"code\":\"PARK-008\",\"category\":\"停車管理設備\",\"name\":\"計位控制器\",\"unit\":\"組\",\"cost\":50000,\"price\":50000,\"supplier\":\"阜爾運通\",\"source\":\"國泰人壽台北置地停管系統更新工程\",\"sourceDate\":\"2020-07-24\",\"note\":\"\",\"history\":[{\"date\":\"2020-07-24\",\"source\":\"國泰人壽台北置地停管系統更新工程\",\"cost\":50000,\"note\":\"\"}]},{\"code\":\"PARK-009\",\"category\":\"停車管理設備\",\"name\":\"計位控制盤（4組計數）\",\"unit\":\"組\",\"cost\":45000,\"price\":45000,\"supplier\":\"阜爾運通\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"sourceDate\":\"2022-10-21\",\"note\":\"品項調整\",\"history\":[{\"date\":\"2022-10-21\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"cost\":45000.0,\"note\":\"品項調整\"},{\"date\":\"2022-10-18\",\"source\":\"青埔資訊大樓停管設備建置（議價後）\",\"cost\":45000.0,\"note\":\"品項調整\"},{\"date\":\"2022-10-01\",\"source\":\"青埔資訊大樓停管設備建置（原報價）\",\"cost\":45000.0,\"note\":\"品項調整\"}]},{\"code\":\"PARK-010\",\"category\":\"停車管理設備\",\"name\":\"車位車辨偵測器（含燈號指示）\",\"unit\":\"組\",\"cost\":2000,\"price\":2000,\"supplier\":\"阜爾運通\",\"source\":\"國泰人壽台北置地停管系統更新工程\",\"sourceDate\":\"2020-07-24\",\"note\":\"\",\"history\":[{\"date\":\"2020-07-24\",\"source\":\"國泰人壽台北置地停管系統更新工程\",\"cost\":2000,\"note\":\"\"}]},{\"code\":\"PARK-011\",\"category\":\"停車管理設備\",\"name\":\"車牌辨識攝影機模組\",\"unit\":\"組\",\"cost\":39500,\"price\":39500,\"supplier\":\"阜爾運通\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"sourceDate\":\"2022-10-21\",\"note\":\"\",\"history\":[{\"date\":\"2022-10-21\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"cost\":39500.0,\"note\":\"\"},{\"date\":\"2022-10-18\",\"source\":\"青埔資訊大樓停管設備建置（議價後）\",\"cost\":39500.0,\"note\":\"\"},{\"date\":\"2022-10-01\",\"source\":\"青埔資訊大樓停管設備建置（原報價）\",\"cost\":39500.0,\"note\":\"\"},{\"date\":\"2020-07-24\",\"source\":\"國泰人壽台北置地停管系統更新工程\",\"cost\":39500,\"note\":\"\"}]},{\"code\":\"PARK-012\",\"category\":\"停車管理設備\",\"name\":\"車輛偵測器\",\"unit\":\"組\",\"cost\":4500,\"price\":4500,\"supplier\":\"阜爾運通\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"sourceDate\":\"2022-10-21\",\"note\":\"數量調整\",\"history\":[{\"date\":\"2022-10-21\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"cost\":4500.0,\"note\":\"數量調整\"},{\"date\":\"2022-10-18\",\"source\":\"青埔資訊大樓停管設備建置（議價後）\",\"cost\":4500.0,\"note\":\"數量調整\"},{\"date\":\"2022-10-01\",\"source\":\"青埔資訊大樓停管設備建置（原報價）\",\"cost\":4500.0,\"note\":\"數量調整\"},{\"date\":\"2020-07-24\",\"source\":\"國泰人壽台北置地停管系統更新工程\",\"cost\":4500,\"note\":\"\"}]},{\"code\":\"PARK-013\",\"category\":\"停車管理設備\",\"name\":\"車道車辨控制器\",\"unit\":\"台\",\"cost\":45000,\"price\":45000,\"supplier\":\"阜爾運通\",\"source\":\"國泰人壽台北置地停管系統更新工程\",\"sourceDate\":\"2020-07-24\",\"note\":\"\",\"history\":[{\"date\":\"2020-07-24\",\"source\":\"國泰人壽台北置地停管系統更新工程\",\"cost\":45000,\"note\":\"\"}]},{\"code\":\"HR001255\",\"category\":\"備品－電源\",\"name\":\"電源供應器 12V／2A\",\"unit\":\"PCS\",\"cost\":500,\"price\":500,\"supplier\":\"和椿科技\",\"source\":\"和椿機器人對阜爾的報價單（含T控）\",\"sourceDate\":\"2026-07-20\",\"note\":\"\",\"history\":[{\"date\":\"2026-07-20\",\"source\":\"和椿機器人對阜爾的報價單（含T控）\",\"cost\":500,\"note\":\"\"}]},{\"code\":\"OTH-001\",\"category\":\"其他\",\"name\":\"室外立招\",\"unit\":\"式\",\"cost\":0,\"price\":0,\"supplier\":\"阜爾運通\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"sourceDate\":\"2022-10-21\",\"note\":\"同第24項\",\"history\":[{\"date\":\"2022-10-21\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"cost\":0.0,\"note\":\"同第24項\"},{\"date\":\"2022-10-18\",\"source\":\"青埔資訊大樓停管設備建置（議價後）\",\"cost\":0.0,\"note\":\"同第24項\"},{\"date\":\"2022-10-01\",\"source\":\"青埔資訊大樓停管設備建置（原報價）\",\"cost\":0.0,\"note\":\"同第24項\"}]},{\"code\":\"SEC-001\",\"category\":\"對講／監視\",\"name\":\"IP對講主機\",\"unit\":\"台\",\"cost\":35000,\"price\":35000,\"supplier\":\"阜爾運通\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"sourceDate\":\"2022-10-21\",\"note\":\"訊號串連至中控室及大廳櫃台\",\"history\":[{\"date\":\"2022-10-21\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"cost\":35000.0,\"note\":\"訊號串連至中控室及大廳櫃台\"},{\"date\":\"2022-10-18\",\"source\":\"青埔資訊大樓停管設備建置（議價後）\",\"cost\":35000.0,\"note\":\"訊號串連至中控室及大廳櫃台\"},{\"date\":\"2022-10-01\",\"source\":\"青埔資訊大樓停管設備建置（原報價）\",\"cost\":35000.0,\"note\":\"訊號串連至中控室及大廳櫃台\"},{\"date\":\"2020-07-24\",\"source\":\"國泰人壽台北置地停管系統更新工程\",\"cost\":24000,\"note\":\"\"}]},{\"code\":\"SEC-002\",\"category\":\"對講／監視\",\"name\":\"IP對講子機\",\"unit\":\"台\",\"cost\":9000,\"price\":9000,\"supplier\":\"阜爾運通\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"sourceDate\":\"2022-10-21\",\"note\":\"\",\"history\":[{\"date\":\"2022-10-21\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"cost\":9000.0,\"note\":\"\"},{\"date\":\"2022-10-18\",\"source\":\"青埔資訊大樓停管設備建置（議價後）\",\"cost\":12000.0,\"note\":\"\"},{\"date\":\"2022-10-01\",\"source\":\"青埔資訊大樓停管設備建置（原報價）\",\"cost\":12000.0,\"note\":\"\"},{\"date\":\"2020-07-24\",\"source\":\"國泰人壽台北置地停管系統更新工程\",\"cost\":12000,\"note\":\"\"}]},{\"code\":\"SEC-003\",\"category\":\"對講／監視\",\"name\":\"IP監視攝影機\",\"unit\":\"台\",\"cost\":4500,\"price\":4500,\"supplier\":\"阜爾運通\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"sourceDate\":\"2022-10-21\",\"note\":\"\",\"history\":[{\"date\":\"2022-10-21\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"cost\":4500.0,\"note\":\"\"},{\"date\":\"2022-10-18\",\"source\":\"青埔資訊大樓停管設備建置（議價後）\",\"cost\":4500.0,\"note\":\"\"},{\"date\":\"2022-10-01\",\"source\":\"青埔資訊大樓停管設備建置（原報價）\",\"cost\":4500.0,\"note\":\"\"},{\"date\":\"2020-07-24\",\"source\":\"國泰人壽台北置地停管系統更新工程\",\"cost\":4500,\"note\":\"\"}]},{\"code\":\"SEC-004\",\"category\":\"對講／監視\",\"name\":\"監視攝影主機\",\"unit\":\"式\",\"cost\":75000,\"price\":75000,\"supplier\":\"阜爾運通\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"sourceDate\":\"2022-10-21\",\"note\":\"\",\"history\":[{\"date\":\"2022-10-21\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"cost\":75000.0,\"note\":\"\"},{\"date\":\"2022-10-18\",\"source\":\"青埔資訊大樓停管設備建置（議價後）\",\"cost\":85000.0,\"note\":\"\"},{\"date\":\"2022-10-01\",\"source\":\"青埔資訊大樓停管設備建置（原報價）\",\"cost\":85000.0,\"note\":\"\"},{\"date\":\"2020-07-24\",\"source\":\"國泰人壽台北置地停管系統更新工程\",\"cost\":65000,\"note\":\"\"}]},{\"code\":\"ENG-001\",\"category\":\"工程施工\",\"name\":\"安全島調整&現場管線增補\",\"unit\":\"式\",\"cost\":850000,\"price\":850000,\"supplier\":\"阜爾運通\",\"source\":\"國泰人壽台北置地停管系統更新工程\",\"sourceDate\":\"2020-07-24\",\"note\":\"\",\"history\":[{\"date\":\"2020-07-24\",\"source\":\"國泰人壽台北置地停管系統更新工程\",\"cost\":850000,\"note\":\"\"}]},{\"code\":\"ENG-002\",\"category\":\"工程施工\",\"name\":\"安裝及測試工資\",\"unit\":\"式\",\"cost\":100000,\"price\":100000,\"supplier\":\"阜爾運通\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"sourceDate\":\"2022-10-21\",\"note\":\"\",\"history\":[{\"date\":\"2022-10-21\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"cost\":100000.0,\"note\":\"\"},{\"date\":\"2022-10-18\",\"source\":\"青埔資訊大樓停管設備建置（議價後）\",\"cost\":100000.0,\"note\":\"\"},{\"date\":\"2022-10-01\",\"source\":\"青埔資訊大樓停管設備建置（原報價）\",\"cost\":100000.0,\"note\":\"\"},{\"date\":\"2020-07-24\",\"source\":\"國泰人壽台北置地停管系統更新工程\",\"cost\":200000,\"note\":\"\"}]},{\"code\":\"ENG-003\",\"category\":\"工程施工\",\"name\":\"安裝及系統測試\",\"unit\":\"式\",\"cost\":72500,\"price\":72500,\"supplier\":\"阜爾運通\",\"source\":\"國泰人壽台北置地停管系統更新工程\",\"sourceDate\":\"2020-07-24\",\"note\":\"\",\"history\":[{\"date\":\"2020-07-24\",\"source\":\"國泰人壽台北置地停管系統更新工程\",\"cost\":72500,\"note\":\"\"}]},{\"code\":\"ENG-004\",\"category\":\"工程施工\",\"name\":\"管線工程\",\"unit\":\"式\",\"cost\":320180,\"price\":320180,\"supplier\":\"阜爾運通\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"sourceDate\":\"2022-10-21\",\"note\":\"\",\"history\":[{\"date\":\"2022-10-21\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"cost\":320180.0,\"note\":\"\"},{\"date\":\"2022-10-18\",\"source\":\"青埔資訊大樓停管設備建置（議價後）\",\"cost\":650000.0,\"note\":\"\"},{\"date\":\"2022-10-01\",\"source\":\"青埔資訊大樓停管設備建置（原報價）\",\"cost\":650000.0,\"note\":\"\"}]},{\"code\":\"ENG-005\",\"category\":\"工程施工\",\"name\":\"管線施工\",\"unit\":\"式\",\"cost\":362500,\"price\":362500,\"supplier\":\"阜爾運通\",\"source\":\"國泰人壽台北置地停管系統更新工程\",\"sourceDate\":\"2020-07-24\",\"note\":\"\",\"history\":[{\"date\":\"2020-07-24\",\"source\":\"國泰人壽台北置地停管系統更新工程\",\"cost\":362500,\"note\":\"\"}]},{\"code\":\"ENG-006\",\"category\":\"工程施工\",\"name\":\"配管拉線安裝工資\",\"unit\":\"工\",\"cost\":1800,\"price\":1800,\"supplier\":\"阜爾運通\",\"source\":\"岳洋桃園青埔燈箱獨立迴路＋紅綠燈汰換\",\"sourceDate\":\"2023-02-04\",\"note\":\"B1.B2.紅綠燈\",\"history\":[{\"date\":\"2023-02-04\",\"source\":\"岳洋桃園青埔燈箱獨立迴路＋紅綠燈汰換\",\"cost\":1800.0,\"note\":\"B1.B2.紅綠燈\"}]},{\"code\":\"MAT-001\",\"category\":\"施工材料\",\"name\":\"1/2 吋（3.66米）E19 防水馬口鐵\",\"unit\":\"捆\",\"cost\":1000,\"price\":1000,\"supplier\":\"阜爾運通\",\"source\":\"岳洋桃園青埔燈箱獨立迴路＋紅綠燈汰換\",\"sourceDate\":\"2023-02-04\",\"note\":\"B1.B2.\",\"history\":[{\"date\":\"2023-02-04\",\"source\":\"岳洋桃園青埔燈箱獨立迴路＋紅綠燈汰換\",\"cost\":1000.0,\"note\":\"B1.B2.\"}]},{\"code\":\"MAT-002\",\"category\":\"施工材料\",\"name\":\"E.N.T 接頭 1/2 吋 E-19 CNS-6079\",\"unit\":\"各\",\"cost\":20,\"price\":20,\"supplier\":\"阜爾運通\",\"source\":\"岳洋桃園青埔燈箱獨立迴路＋紅綠燈汰換\",\"sourceDate\":\"2023-02-04\",\"note\":\"B1.B2.\",\"history\":[{\"date\":\"2023-02-04\",\"source\":\"岳洋桃園青埔燈箱獨立迴路＋紅綠燈汰換\",\"cost\":20.0,\"note\":\"B1.B2.\"}]},{\"code\":\"MAT-003\",\"category\":\"施工材料\",\"name\":\"E.N.T 月彎 3/4 吋 90度 E-25 CNS-6079\",\"unit\":\"支\",\"cost\":60,\"price\":60,\"supplier\":\"阜爾運通\",\"source\":\"國泰置地廣場機車區\",\"sourceDate\":\"2020-06-18\",\"note\":\"\",\"history\":[{\"date\":\"2020-06-18\",\"source\":\"國泰置地廣場機車區\",\"cost\":60.0,\"note\":\"\"}]},{\"code\":\"MAT-004\",\"category\":\"施工材料\",\"name\":\"五金另料\",\"unit\":\"式\",\"cost\":2000,\"price\":2000,\"supplier\":\"阜爾運通\",\"source\":\"岳洋桃園青埔燈箱獨立迴路＋紅綠燈汰換\",\"sourceDate\":\"2023-02-04\",\"note\":\"萬能管夾.ENT管接.盒接\",\"history\":[{\"date\":\"2023-02-04\",\"source\":\"岳洋桃園青埔燈箱獨立迴路＋紅綠燈汰換\",\"cost\":2000.0,\"note\":\"萬能管夾.ENT管接.盒接\"},{\"date\":\"2020-06-18\",\"source\":\"國泰置地廣場機車區\",\"cost\":6000.0,\"note\":\"含BOX.單連動力箱.固定材料.ENT夾具.軟管.牙條配件.黃18油漆補面\"}]},{\"code\":\"MAT-005\",\"category\":\"施工材料\",\"name\":\"單隔離 CAT.5E 網路線（305M）\",\"unit\":\"米\",\"cost\":3500,\"price\":3500,\"supplier\":\"阜爾運通\",\"source\":\"國泰置地廣場機車區\",\"sourceDate\":\"2020-06-18\",\"note\":\"140米為中控到電信室-電話線\",\"history\":[{\"date\":\"2020-06-18\",\"source\":\"國泰置地廣場機車區\",\"cost\":3500.0,\"note\":\"140米為中控到電信室-電話線\"}]},{\"code\":\"MAT-006\",\"category\":\"施工材料\",\"name\":\"宏泰 PVC 電線 2.0mm²（紅／白／綠，100M）\",\"unit\":\"米\",\"cost\":80,\"price\":80,\"supplier\":\"阜爾運通\",\"source\":\"國泰置地廣場機車區\",\"sourceDate\":\"2020-06-18\",\"note\":\"\",\"history\":[{\"date\":\"2020-06-18\",\"source\":\"國泰置地廣場機車區\",\"cost\":80.0,\"note\":\"\"}]},{\"code\":\"MAT-007\",\"category\":\"施工材料\",\"name\":\"控制電纜 1.25平方×4C（100M）\",\"unit\":\"支\",\"cost\":20,\"price\":20,\"supplier\":\"阜爾運通\",\"source\":\"國泰置地廣場機車區\",\"sourceDate\":\"2020-06-18\",\"note\":\"\",\"history\":[{\"date\":\"2020-06-18\",\"source\":\"國泰置地廣場機車區\",\"cost\":20.0,\"note\":\"\"}]},{\"code\":\"MAT-008\",\"category\":\"施工材料\",\"name\":\"控制電纜 1.25平方×4C（100M）\",\"unit\":\"米\",\"cost\":20,\"price\":20,\"supplier\":\"阜爾運通\",\"source\":\"岳洋桃園青埔燈箱獨立迴路＋紅綠燈汰換\",\"sourceDate\":\"2023-02-04\",\"note\":\"B1.B2.\",\"history\":[{\"date\":\"2023-02-04\",\"source\":\"岳洋桃園青埔燈箱獨立迴路＋紅綠燈汰換\",\"cost\":20.0,\"note\":\"B1.B2.\"}]},{\"code\":\"MAT-009\",\"category\":\"施工材料\",\"name\":\"美亞 ENT 管 1/2 吋（3.66米）E19\",\"unit\":\"支\",\"cost\":130,\"price\":130,\"supplier\":\"阜爾運通\",\"source\":\"岳洋桃園青埔燈箱獨立迴路＋紅綠燈汰換\",\"sourceDate\":\"2023-02-04\",\"note\":\"B1.B2.\",\"history\":[{\"date\":\"2023-02-04\",\"source\":\"岳洋桃園青埔燈箱獨立迴路＋紅綠燈汰換\",\"cost\":130.0,\"note\":\"B1.B2.\"}]},{\"code\":\"MAT-010\",\"category\":\"施工材料\",\"name\":\"美亞 ENT 管 3/4 吋（3.66米）E39\",\"unit\":\"工\",\"cost\":125,\"price\":125,\"supplier\":\"阜爾運通\",\"source\":\"國泰置地廣場機車區\",\"sourceDate\":\"2020-06-18\",\"note\":\"\",\"history\":[{\"date\":\"2020-06-18\",\"source\":\"國泰置地廣場機車區\",\"cost\":125.0,\"note\":\"\"}]},{\"code\":\"MAT-011\",\"category\":\"施工材料\",\"name\":\"鍍鋅鋼線槽（含蓋）\",\"unit\":\"支\",\"cost\":600,\"price\":600,\"supplier\":\"阜爾運通\",\"source\":\"國泰置地廣場機車區\",\"sourceDate\":\"2020-06-18\",\"note\":\"\",\"history\":[{\"date\":\"2020-06-18\",\"source\":\"國泰置地廣場機車區\",\"cost\":600.0,\"note\":\"\"}]},{\"code\":\"MAT-012\",\"category\":\"施工材料\",\"name\":\"隔離電纜 22AWG×2P（100M）鍍銅／灰（雙隔）\",\"unit\":\"米\",\"cost\":20,\"price\":20,\"supplier\":\"阜爾運通\",\"source\":\"岳洋桃園青埔燈箱獨立迴路＋紅綠燈汰換\",\"sourceDate\":\"2023-02-04\",\"note\":\"B1.B2.\",\"history\":[{\"date\":\"2023-02-04\",\"source\":\"岳洋桃園青埔燈箱獨立迴路＋紅綠燈汰換\",\"cost\":20.0,\"note\":\"B1.B2.\"},{\"date\":\"2020-06-18\",\"source\":\"國泰置地廣場機車區\",\"cost\":15.0,\"note\":\"含BOX.固定材料.ENT彎頭.軟管.牙條固定片.\"}]},{\"code\":\"SIG-001\",\"category\":\"標誌／安全設施\",\"name\":\"2吋白鐵 6公分直立柱\",\"unit\":\"支\",\"cost\":1500,\"price\":1500,\"supplier\":\"阜爾運通\",\"source\":\"國泰置地廣場機車區\",\"sourceDate\":\"2020-06-18\",\"note\":\"高100含封口+12*12固定底板\",\"history\":[{\"date\":\"2020-06-18\",\"source\":\"國泰置地廣場機車區\",\"cost\":1500.0,\"note\":\"高100含封口+12*12固定底板\"}]},{\"code\":\"SIG-002\",\"category\":\"標誌／安全設施\",\"name\":\"PSS直立式立柱\",\"unit\":\"支\",\"cost\":1600,\"price\":1600,\"supplier\":\"阜爾運通\",\"source\":\"國泰置地廣場機車區\",\"sourceDate\":\"2020-06-18\",\"note\":\"3米黃色-入口機車告示牌更換\",\"history\":[{\"date\":\"2020-06-18\",\"source\":\"國泰置地廣場機車區\",\"cost\":1600.0,\"note\":\"3米黃色-入口機車告示牌更換\"}]},{\"code\":\"SIG-003\",\"category\":\"標誌／安全設施\",\"name\":\"出口鐵模\",\"unit\":\"座\",\"cost\":6000,\"price\":6000,\"supplier\":\"阜爾運通\",\"source\":\"國泰置地廣場機車區\",\"sourceDate\":\"2020-06-18\",\"note\":\"40*150*15公分(壓花板烤黃色)\",\"history\":[{\"date\":\"2020-06-18\",\"source\":\"國泰置地廣場機車區\",\"cost\":6000.0,\"note\":\"40*150*15公分(壓花板烤黃色)\"}]},{\"code\":\"SIG-004\",\"category\":\"標誌／安全設施\",\"name\":\"回復式導桿\",\"unit\":\"支\",\"cost\":500,\"price\":500,\"supplier\":\"阜爾運通\",\"source\":\"國泰人壽台北置地停管系統更新工程\",\"sourceDate\":\"2020-07-24\",\"note\":\"\",\"history\":[{\"date\":\"2020-07-24\",\"source\":\"國泰人壽台北置地停管系統更新工程\",\"cost\":500,\"note\":\"\"}]},{\"code\":\"SIG-005\",\"category\":\"標誌／安全設施\",\"name\":\"塑膠黃色鍊條\",\"unit\":\"米\",\"cost\":50,\"price\":50,\"supplier\":\"阜爾運通\",\"source\":\"國泰置地廣場機車區\",\"sourceDate\":\"2020-06-18\",\"note\":\"\",\"history\":[{\"date\":\"2020-06-18\",\"source\":\"國泰置地廣場機車區\",\"cost\":50.0,\"note\":\"\"}]},{\"code\":\"SIG-006\",\"category\":\"標誌／安全設施\",\"name\":\"導桿\",\"unit\":\"座\",\"cost\":650,\"price\":650,\"supplier\":\"阜爾運通\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"sourceDate\":\"2022-10-21\",\"note\":\"塑膠導桿\",\"history\":[{\"date\":\"2022-10-21\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"cost\":650.0,\"note\":\"塑膠導桿\"},{\"date\":\"2022-10-18\",\"source\":\"青埔資訊大樓停管設備建置（議價後）\",\"cost\":650.0,\"note\":\"塑膠導桿\"},{\"date\":\"2022-10-01\",\"source\":\"青埔資訊大樓停管設備建置（原報價）\",\"cost\":650.0,\"note\":\"塑膠導桿\"}]},{\"code\":\"SIG-007\",\"category\":\"標誌／安全設施\",\"name\":\"柱面牆面指示牌\",\"unit\":\"式\",\"cost\":260000,\"price\":260000,\"supplier\":\"阜爾運通\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"sourceDate\":\"2022-10-21\",\"note\":\"\",\"history\":[{\"date\":\"2022-10-21\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"cost\":260000.0,\"note\":\"\"},{\"date\":\"2022-10-18\",\"source\":\"青埔資訊大樓停管設備建置（議價後）\",\"cost\":300000.0,\"note\":\"\"},{\"date\":\"2022-10-01\",\"source\":\"青埔資訊大樓停管設備建置（原報價）\",\"cost\":300000.0,\"note\":\"\"}]},{\"code\":\"SIG-008\",\"category\":\"標誌／安全設施\",\"name\":\"機車停車區指標美化\",\"unit\":\"式\",\"cost\":250000,\"price\":250000,\"supplier\":\"阜爾運通\",\"source\":\"國泰人壽台北置地停管系統更新工程\",\"sourceDate\":\"2020-07-24\",\"note\":\"\",\"history\":[{\"date\":\"2020-07-24\",\"source\":\"國泰人壽台北置地停管系統更新工程\",\"cost\":250000,\"note\":\"\"}]},{\"code\":\"SIG-009\",\"category\":\"標誌／安全設施\",\"name\":\"減速墊\",\"unit\":\"組\",\"cost\":6000,\"price\":6000,\"supplier\":\"阜爾運通\",\"source\":\"國泰人壽台北置地停管系統更新工程\",\"sourceDate\":\"2020-07-24\",\"note\":\"\",\"history\":[{\"date\":\"2020-07-24\",\"source\":\"國泰人壽台北置地停管系統更新工程\",\"cost\":6000,\"note\":\"\"}]},{\"code\":\"SIG-010\",\"category\":\"標誌／安全設施\",\"name\":\"減速墊\",\"unit\":\"座\",\"cost\":4500,\"price\":4500,\"supplier\":\"阜爾運通\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"sourceDate\":\"2022-10-21\",\"note\":\"\",\"history\":[{\"date\":\"2022-10-21\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"cost\":4500.0,\"note\":\"\"},{\"date\":\"2022-10-18\",\"source\":\"青埔資訊大樓停管設備建置（議價後）\",\"cost\":4500.0,\"note\":\"\"},{\"date\":\"2022-10-01\",\"source\":\"青埔資訊大樓停管設備建置（原報價）\",\"cost\":4500.0,\"note\":\"\"}]},{\"code\":\"SIG-011\",\"category\":\"標誌／安全設施\",\"name\":\"白鐵鍊條\",\"unit\":\"米\",\"cost\":100,\"price\":100,\"supplier\":\"阜爾運通\",\"source\":\"國泰置地廣場機車區\",\"sourceDate\":\"2020-06-18\",\"note\":\"\",\"history\":[{\"date\":\"2020-06-18\",\"source\":\"國泰置地廣場機車區\",\"cost\":100.0,\"note\":\"\"}]},{\"code\":\"SIG-012\",\"category\":\"標誌／安全設施\",\"name\":\"限高架\",\"unit\":\"座\",\"cost\":170000,\"price\":170000,\"supplier\":\"阜爾運通\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"sourceDate\":\"2022-10-21\",\"note\":\"\",\"history\":[{\"date\":\"2022-10-21\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"cost\":170000.0,\"note\":\"\"},{\"date\":\"2022-10-18\",\"source\":\"青埔資訊大樓停管設備建置（議價後）\",\"cost\":200000.0,\"note\":\"\"},{\"date\":\"2022-10-01\",\"source\":\"青埔資訊大樓停管設備建置（原報價）\",\"cost\":200000.0,\"note\":\"\"}]},{\"code\":\"HR000921\",\"category\":\"耗材－CC1\",\"name\":\"吸水扒刮皮 PU 版\",\"unit\":\"SET\",\"cost\":900,\"price\":900,\"supplier\":\"和椿科技\",\"source\":\"和椿機器人對阜爾的報價單（含T控）\",\"sourceDate\":\"2026-07-20\",\"note\":\"\",\"history\":[{\"date\":\"2026-07-20\",\"source\":\"和椿機器人對阜爾的報價單（含T控）\",\"cost\":900,\"note\":\"\"}]},{\"code\":\"HR000933\",\"category\":\"耗材－CC1\",\"name\":\"洗地滾刷－軟\",\"unit\":\"SET\",\"cost\":1500,\"price\":1500,\"supplier\":\"和椿科技\",\"source\":\"和椿機器人對阜爾的報價單（含T控）\",\"sourceDate\":\"2026-07-20\",\"note\":\"\",\"history\":[{\"date\":\"2026-07-20\",\"source\":\"和椿機器人對阜爾的報價單（含T控）\",\"cost\":1500,\"note\":\"\"}]},{\"code\":\"HR000779\",\"category\":\"耗材－CC1\",\"name\":\"濾水盒備件\",\"unit\":\"SET\",\"cost\":1000,\"price\":1000,\"supplier\":\"和椿科技\",\"source\":\"和椿機器人對阜爾的報價單（含T控）\",\"sourceDate\":\"2026-07-20\",\"note\":\"\",\"history\":[{\"date\":\"2026-07-20\",\"source\":\"和椿機器人對阜爾的報價單（含T控）\",\"cost\":1000,\"note\":\"\"}]},{\"code\":\"HR001237\",\"category\":\"耗材－MT1\",\"name\":\"MT1 垃圾盒膠皮\",\"unit\":\"PCS\",\"cost\":340,\"price\":340,\"supplier\":\"和椿科技\",\"source\":\"和椿機器人對阜爾的報價單（含T控）\",\"sourceDate\":\"2026-07-20\",\"note\":\"\",\"history\":[{\"date\":\"2026-07-20\",\"source\":\"和椿機器人對阜爾的報價單（含T控）\",\"cost\":340,\"note\":\"\"}]},{\"code\":\"HR001165\",\"category\":\"耗材－MT1\",\"name\":\"MT1 掃地滾刷／單入\",\"unit\":\"PCS\",\"cost\":2600,\"price\":2600,\"supplier\":\"和椿科技\",\"source\":\"和椿機器人對阜爾的報價單（含T控）\",\"sourceDate\":\"2026-07-20\",\"note\":\"\",\"history\":[{\"date\":\"2026-07-20\",\"source\":\"和椿機器人對阜爾的報價單（含T控）\",\"cost\":2600,\"note\":\"\"}]},{\"code\":\"HR001167\",\"category\":\"耗材－MT1\",\"name\":\"MT1 掃地邊刷／2入\",\"unit\":\"PCS\",\"cost\":1800,\"price\":1800,\"supplier\":\"和椿科技\",\"source\":\"和椿機器人對阜爾的報價單（含T控）\",\"sourceDate\":\"2026-07-20\",\"note\":\"\",\"history\":[{\"date\":\"2026-07-20\",\"source\":\"和椿機器人對阜爾的報價單（含T控）\",\"cost\":1800,\"note\":\"\"}]},{\"code\":\"HR001232\",\"category\":\"耗材－MT1\",\"name\":\"MT1 滾刷倉前膠皮\",\"unit\":\"PCS\",\"cost\":270,\"price\":270,\"supplier\":\"和椿科技\",\"source\":\"和椿機器人對阜爾的報價單（含T控）\",\"sourceDate\":\"2026-07-20\",\"note\":\"\",\"history\":[{\"date\":\"2026-07-20\",\"source\":\"和椿機器人對阜爾的報價單（含T控）\",\"cost\":270,\"note\":\"\"}]},{\"code\":\"HR001166\",\"category\":\"耗材－MT1\",\"name\":\"MT1 空氣過濾網\",\"unit\":\"PCS\",\"cost\":2300,\"price\":2300,\"supplier\":\"和椿科技\",\"source\":\"和椿機器人對阜爾的報價單（含T控）\",\"sourceDate\":\"2026-07-20\",\"note\":\"\",\"history\":[{\"date\":\"2026-07-20\",\"source\":\"和椿機器人對阜爾的報價單（含T控）\",\"cost\":2300,\"note\":\"\"}]},{\"code\":\"HR000705\",\"category\":\"設備－充電設備\",\"name\":\"CC1 出塵工作站／充電樁\",\"unit\":\"SET\",\"cost\":42000,\"price\":42000,\"supplier\":\"和椿科技\",\"source\":\"和椿機器人對阜爾的報價單（含T控）\",\"sourceDate\":\"2026-07-20\",\"note\":\"\",\"history\":[{\"date\":\"2026-07-20\",\"source\":\"和椿機器人對阜爾的報價單（含T控）\",\"cost\":42000,\"note\":\"\"}]},{\"code\":\"HR000850\",\"category\":\"設備－充電設備\",\"name\":\"MT1 怪獸充電樁\",\"unit\":\"SET\",\"cost\":22000,\"price\":22000,\"supplier\":\"和椿科技\",\"source\":\"和椿機器人對阜爾的報價單（含T控）\",\"sourceDate\":\"2026-07-20\",\"note\":\"\",\"history\":[{\"date\":\"2026-07-20\",\"source\":\"和椿機器人對阜爾的報價單（含T控）\",\"cost\":22000,\"note\":\"\"}]},{\"code\":\"HR002059\",\"category\":\"設備－清潔機器人\",\"name\":\"清潔機器人 CC1 Pro 原色\",\"unit\":\"SET\",\"cost\":360000,\"price\":360000,\"supplier\":\"和椿科技\",\"source\":\"和椿機器人對阜爾的報價單（含T控）\",\"sourceDate\":\"2026-07-20\",\"note\":\"\",\"history\":[{\"date\":\"2026-07-20\",\"source\":\"和椿機器人對阜爾的報價單（含T控）\",\"cost\":360000,\"note\":\"\"}]},{\"code\":\"HR000698\",\"category\":\"設備－清潔機器人\",\"name\":\"清潔機器人 CC1 原色\",\"unit\":\"SET\",\"cost\":330000,\"price\":330000,\"supplier\":\"和椿科技\",\"source\":\"和椿機器人對阜爾的報價單（含T控）\",\"sourceDate\":\"2026-07-20\",\"note\":\"\",\"history\":[{\"date\":\"2026-07-20\",\"source\":\"和椿機器人對阜爾的報價單（含T控）\",\"cost\":330000,\"note\":\"\"}]},{\"code\":\"HR000847\",\"category\":\"設備－清潔機器人\",\"name\":\"清潔機器人 MT1\",\"unit\":\"SET\",\"cost\":240000,\"price\":240000,\"supplier\":\"和椿科技\",\"source\":\"和椿機器人對阜爾的報價單（含T控）\",\"sourceDate\":\"2026-07-20\",\"note\":\"\",\"history\":[{\"date\":\"2026-07-20\",\"source\":\"和椿機器人對阜爾的報價單（含T控）\",\"cost\":240000,\"note\":\"\"}]},{\"code\":\"HR000849\",\"category\":\"設備－自主移動機器人\",\"name\":\"自主式移動機器人 FBBDR2（含配件）\",\"unit\":\"SET\",\"cost\":310000,\"price\":310000,\"supplier\":\"和椿科技\",\"source\":\"和椿機器人對阜爾的報價單（含T控）\",\"sourceDate\":\"2026-07-20\",\"note\":\"\",\"history\":[{\"date\":\"2026-07-20\",\"source\":\"和椿機器人對阜爾的報價單（含T控）\",\"cost\":310000,\"note\":\"\"}]},{\"code\":\"HR001161\",\"category\":\"配件－清潔機器人\",\"name\":\"CC1 移動水站（灰色版）\",\"unit\":\"PCS\",\"cost\":22000,\"price\":22000,\"supplier\":\"和椿科技\",\"source\":\"和椿機器人對阜爾的報價單（含T控）\",\"sourceDate\":\"2026-07-20\",\"note\":\"\",\"history\":[{\"date\":\"2026-07-20\",\"source\":\"和椿機器人對阜爾的報價單（含T控）\",\"cost\":22000,\"note\":\"\"}]},{\"code\":\"HR000835\",\"category\":\"配件－系統整合\",\"name\":\"閘機模組\",\"unit\":\"SET\",\"cost\":4100,\"price\":4100,\"supplier\":\"和椿科技\",\"source\":\"和椿機器人對阜爾的報價單（含T控）\",\"sourceDate\":\"2026-07-20\",\"note\":\"\",\"history\":[{\"date\":\"2026-07-20\",\"source\":\"和椿機器人對阜爾的報價單（含T控）\",\"cost\":4100,\"note\":\"\"}]},{\"code\":\"HR001934\",\"category\":\"配件－通訊\",\"name\":\"CC1 出塵 2.4G LoRa 適配改造包\",\"unit\":\"PCS\",\"cost\":3000,\"price\":3000,\"supplier\":\"和椿科技\",\"source\":\"和椿機器人對阜爾的報價單（含T控）\",\"sourceDate\":\"2026-07-20\",\"note\":\"\",\"history\":[{\"date\":\"2026-07-20\",\"source\":\"和椿機器人對阜爾的報價單（含T控）\",\"cost\":3000,\"note\":\"\"}]},{\"code\":\"HR001139\",\"category\":\"配件－通訊\",\"name\":\"呼叫器閘道 PGCG01\",\"unit\":\"SET\",\"cost\":3000,\"price\":3000,\"supplier\":\"和椿科技\",\"source\":\"和椿機器人對阜爾的報價單（含T控）\",\"sourceDate\":\"2026-07-20\",\"note\":\"\",\"history\":[{\"date\":\"2026-07-20\",\"source\":\"和椿機器人對阜爾的報價單（含T控）\",\"cost\":3000,\"note\":\"\"}]},{\"code\":\"HR001172\",\"category\":\"配件－電梯聯動\",\"name\":\"10層拓展包－2線短線\",\"unit\":\"PCS\",\"cost\":2900,\"price\":2900,\"supplier\":\"和椿科技\",\"source\":\"和椿機器人對阜爾的報價單（含T控）\",\"sourceDate\":\"2026-07-20\",\"note\":\"\",\"history\":[{\"date\":\"2026-07-20\",\"source\":\"和椿機器人對阜爾的報價單（含T控）\",\"cost\":2900,\"note\":\"\"}]},{\"code\":\"HR001980\",\"category\":\"配件－電梯聯動\",\"name\":\"電梯物聯系統 2025（通用 2.4G）\",\"unit\":\"PCS\",\"cost\":20800,\"price\":20800,\"supplier\":\"和椿科技\",\"source\":\"和椿機器人對阜爾的報價單（含T控）\",\"sourceDate\":\"2026-07-20\",\"note\":\"\",\"history\":[{\"date\":\"2026-07-20\",\"source\":\"和椿機器人對阜爾的報價單（含T控）\",\"cost\":20800,\"note\":\"\"}]},{\"code\":\"PWR-001\",\"category\":\"電源／UPS\",\"name\":\"不斷電系統 1KVA\",\"unit\":\"台\",\"cost\":12000,\"price\":12000,\"supplier\":\"阜爾運通\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"sourceDate\":\"2022-10-21\",\"note\":\"\",\"history\":[{\"date\":\"2022-10-21\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"cost\":12000.0,\"note\":\"\"},{\"date\":\"2022-10-18\",\"source\":\"青埔資訊大樓停管設備建置（議價後）\",\"cost\":12000.0,\"note\":\"\"},{\"date\":\"2022-10-01\",\"source\":\"青埔資訊大樓停管設備建置（原報價）\",\"cost\":12000.0,\"note\":\"\"},{\"date\":\"2020-07-24\",\"source\":\"國泰人壽台北置地停管系統更新工程\",\"cost\":12000,\"note\":\"\"}]},{\"code\":\"PWR-002\",\"category\":\"電源／UPS\",\"name\":\"不斷電系統 3KVA\",\"unit\":\"台\",\"cost\":25000,\"price\":25000,\"supplier\":\"阜爾運通\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"sourceDate\":\"2022-10-21\",\"note\":\"\",\"history\":[{\"date\":\"2022-10-21\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"cost\":25000.0,\"note\":\"\"},{\"date\":\"2022-10-18\",\"source\":\"青埔資訊大樓停管設備建置（議價後）\",\"cost\":25000.0,\"note\":\"\"},{\"date\":\"2022-10-01\",\"source\":\"青埔資訊大樓停管設備建置（原報價）\",\"cost\":25000.0,\"note\":\"擬刪除，請說明必要性 (防止主機跳電的問題 可以防止整場當掉)\"},{\"date\":\"2020-07-24\",\"source\":\"國泰人壽台北置地停管系統更新工程\",\"cost\":25000,\"note\":\"\"}]},{\"code\":\"PC-001\",\"category\":\"電腦／伺服器\",\"name\":\"中央管理電腦\",\"unit\":\"台\",\"cost\":65000,\"price\":65000,\"supplier\":\"阜爾運通\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"sourceDate\":\"2022-10-21\",\"note\":\"\",\"history\":[{\"date\":\"2022-10-21\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"cost\":65000.0,\"note\":\"\"},{\"date\":\"2022-10-18\",\"source\":\"青埔資訊大樓停管設備建置（議價後）\",\"cost\":85000.0,\"note\":\"\"},{\"date\":\"2022-10-01\",\"source\":\"青埔資訊大樓停管設備建置（原報價）\",\"cost\":85000.0,\"note\":\"\"},{\"date\":\"2020-07-24\",\"source\":\"國泰人壽台北置地停管系統更新工程\",\"cost\":85000,\"note\":\"\"}]},{\"code\":\"PC-002\",\"category\":\"電腦／伺服器\",\"name\":\"人工計價電腦組\",\"unit\":\"台\",\"cost\":65000,\"price\":65000,\"supplier\":\"阜爾運通\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"sourceDate\":\"2022-10-21\",\"note\":\"\",\"history\":[{\"date\":\"2022-10-21\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"cost\":65000.0,\"note\":\"\"},{\"date\":\"2022-10-18\",\"source\":\"青埔資訊大樓停管設備建置（議價後）\",\"cost\":65000.0,\"note\":\"\"},{\"date\":\"2022-10-01\",\"source\":\"青埔資訊大樓停管設備建置（原報價）\",\"cost\":65000.0,\"note\":\"\"},{\"date\":\"2020-07-24\",\"source\":\"國泰人壽台北置地停管系統更新工程\",\"cost\":65000,\"note\":\"\"}]},{\"code\":\"PC-003\",\"category\":\"電腦／伺服器\",\"name\":\"伺服器主機\",\"unit\":\"台\",\"cost\":150000,\"price\":150000,\"supplier\":\"阜爾運通\",\"source\":\"青埔資訊大樓停管設備建置（原報價）\",\"sourceDate\":\"2022-10-01\",\"note\":\"\",\"history\":[{\"date\":\"2022-10-21\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"cost\":0.0,\"note\":\"贈送\"},{\"date\":\"2022-10-18\",\"source\":\"青埔資訊大樓停管設備建置（議價後）\",\"cost\":0.0,\"note\":\"贈送\"},{\"date\":\"2022-10-01\",\"source\":\"青埔資訊大樓停管設備建置（原報價）\",\"cost\":150000.0,\"note\":\"\"},{\"date\":\"2020-07-24\",\"source\":\"國泰人壽台北置地停管系統更新工程\",\"cost\":150000,\"note\":\"\"}]},{\"code\":\"PC-004\",\"category\":\"電腦／伺服器\",\"name\":\"網頁折扣裝置（平板）\",\"unit\":\"台\",\"cost\":20000,\"price\":20000,\"supplier\":\"阜爾運通\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"sourceDate\":\"2022-10-21\",\"note\":\"\",\"history\":[{\"date\":\"2022-10-21\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"cost\":20000.0,\"note\":\"\"},{\"date\":\"2022-10-18\",\"source\":\"青埔資訊大樓停管設備建置（議價後）\",\"cost\":20000.0,\"note\":\"\"},{\"date\":\"2022-10-01\",\"source\":\"青埔資訊大樓停管設備建置（原報價）\",\"cost\":20000.0,\"note\":\"\"}]},{\"code\":\"PC-005\",\"category\":\"電腦／伺服器\",\"name\":\"電腦監控主機\",\"unit\":\"套\",\"cost\":85000,\"price\":85000,\"supplier\":\"阜爾運通\",\"source\":\"國泰人壽台北置地停管系統更新工程\",\"sourceDate\":\"2020-07-24\",\"note\":\"\",\"history\":[{\"date\":\"2020-07-24\",\"source\":\"國泰人壽台北置地停管系統更新工程\",\"cost\":85000,\"note\":\"\"}]},{\"code\":\"DSP-001\",\"category\":\"顯示／導引\",\"name\":\"入口車位LED顯示器\",\"unit\":\"組\",\"cost\":25000,\"price\":25000,\"supplier\":\"阜爾運通\",\"source\":\"國泰人壽台北置地停管系統更新工程\",\"sourceDate\":\"2020-07-24\",\"note\":\"\",\"history\":[{\"date\":\"2020-07-24\",\"source\":\"國泰人壽台北置地停管系統更新工程\",\"cost\":25000,\"note\":\"\"}]},{\"code\":\"DSP-002\",\"category\":\"顯示／導引\",\"name\":\"反射鏡\",\"unit\":\"組\",\"cost\":7500,\"price\":7500,\"supplier\":\"阜爾運通\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"sourceDate\":\"2022-10-21\",\"note\":\"\",\"history\":[{\"date\":\"2022-10-21\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"cost\":7500.0,\"note\":\"\"},{\"date\":\"2022-10-18\",\"source\":\"青埔資訊大樓停管設備建置（議價後）\",\"cost\":7500.0,\"note\":\"\"},{\"date\":\"2022-10-01\",\"source\":\"青埔資訊大樓停管設備建置（原報價）\",\"cost\":7500.0,\"note\":\"\"}]},{\"code\":\"DSP-003\",\"category\":\"顯示／導引\",\"name\":\"導光型指示燈箱\",\"unit\":\"組\",\"cost\":12000,\"price\":12000,\"supplier\":\"阜爾運通\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"sourceDate\":\"2022-10-21\",\"note\":\"數量調整\",\"history\":[{\"date\":\"2022-10-21\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"cost\":12000.0,\"note\":\"數量調整\"},{\"date\":\"2022-10-18\",\"source\":\"青埔資訊大樓停管設備建置（議價後）\",\"cost\":12000.0,\"note\":\"數量調整\"},{\"date\":\"2022-10-01\",\"source\":\"青埔資訊大樓停管設備建置（原報價）\",\"cost\":12000.0,\"note\":\"數量調整\"}]},{\"code\":\"DSP-004\",\"category\":\"顯示／導引\",\"name\":\"會車警示燈\",\"unit\":\"組\",\"cost\":8500,\"price\":8500,\"supplier\":\"阜爾運通\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"sourceDate\":\"2022-10-21\",\"note\":\"數量調整\",\"history\":[{\"date\":\"2022-10-21\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"cost\":8500.0,\"note\":\"數量調整\"},{\"date\":\"2022-10-18\",\"source\":\"青埔資訊大樓停管設備建置（議價後）\",\"cost\":8500.0,\"note\":\"數量調整\"},{\"date\":\"2022-10-01\",\"source\":\"青埔資訊大樓停管設備建置（原報價）\",\"cost\":8500.0,\"note\":\"數量調整\"}]},{\"code\":\"DSP-005\",\"category\":\"顯示／導引\",\"name\":\"樓層剩餘指示燈（單組顯示）\",\"unit\":\"組\",\"cost\":30000,\"price\":30000,\"supplier\":\"阜爾運通\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"sourceDate\":\"2022-10-21\",\"note\":\"數量調整\",\"history\":[{\"date\":\"2022-10-21\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"cost\":30000.0,\"note\":\"數量調整\"},{\"date\":\"2022-10-18\",\"source\":\"青埔資訊大樓停管設備建置（議價後）\",\"cost\":30000.0,\"note\":\"數量調整\"},{\"date\":\"2022-10-01\",\"source\":\"青埔資訊大樓停管設備建置（原報價）\",\"cost\":30000.0,\"note\":\"數量調整\"}]},{\"code\":\"DSP-006\",\"category\":\"顯示／導引\",\"name\":\"樓層剩餘指示燈（雙組顯示）\",\"unit\":\"組\",\"cost\":42000,\"price\":42000,\"supplier\":\"阜爾運通\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"sourceDate\":\"2022-10-21\",\"note\":\"\",\"history\":[{\"date\":\"2022-10-21\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"cost\":42000.0,\"note\":\"\"},{\"date\":\"2022-10-18\",\"source\":\"青埔資訊大樓停管設備建置（議價後）\",\"cost\":42000.0,\"note\":\"\"},{\"date\":\"2022-10-01\",\"source\":\"青埔資訊大樓停管設備建置（原報價）\",\"cost\":42000.0,\"note\":\"\"}]},{\"code\":\"DSP-007\",\"category\":\"顯示／導引\",\"name\":\"汽車出入口車辨導引LCD螢幕\",\"unit\":\"台\",\"cost\":45000,\"price\":45000,\"supplier\":\"阜爾運通\",\"source\":\"國泰人壽台北置地停管系統更新工程\",\"sourceDate\":\"2020-07-24\",\"note\":\"\",\"history\":[{\"date\":\"2020-07-24\",\"source\":\"國泰人壽台北置地停管系統更新工程\",\"cost\":45000,\"note\":\"\"}]},{\"code\":\"DSP-008\",\"category\":\"顯示／導引\",\"name\":\"滿車燈（含出車警示）\",\"unit\":\"座\",\"cost\":170000,\"price\":170000,\"supplier\":\"阜爾運通\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"sourceDate\":\"2022-10-21\",\"note\":\"室外立招\",\"history\":[{\"date\":\"2022-10-21\",\"source\":\"青埔資訊大樓停管設備建置（調整單價）\",\"cost\":170000.0,\"note\":\"室外立招\"},{\"date\":\"2022-10-18\",\"source\":\"青埔資訊大樓停管設備建置（議價後）\",\"cost\":180000.0,\"note\":\"室外立招\"},{\"date\":\"2022-10-01\",\"source\":\"青埔資訊大樓停管設備建置（原報價）\",\"cost\":180000.0,\"note\":\"室外立招\"}]}]");

function quoteSheetV191_(key) {
  return getOrCreateSheet_(key, PSS_V191.HEADERS[key]);
}

function bigCategoryV191_(category) {
  const c = clean_(category);
  const map = {
    '保養服務':'服務','停車管理設備':'停車管理系統','備品－電源':'備品','其他':'其他',
    '對講／監視':'弱電監控','工程施工':'工程施工','施工材料':'施工材料','標誌／安全設施':'標誌安全',
    '耗材－CC1':'機器人耗材','耗材－MT1':'機器人耗材','設備－充電設備':'機器人設備',
    '設備－清潔機器人':'機器人設備','設備－自主移動機器人':'機器人設備',
    '配件－清潔機器人':'機器人配件','配件－系統整合':'機器人配件','配件－通訊':'機器人配件',
    '配件－電梯聯動':'機器人配件','電源／UPS':'電源系統','電腦／伺服器':'資訊設備','顯示／導引':'顯示導引'
  };
  return map[c] || (c.indexOf('機器人') >= 0 ? '機器人' : '其他');
}

function quoteItemDefinitionsV191_() {
  return {itemId:['品項ID'],bigCategory:['大分類'],category:['分類'],code:['品號'],name:['品名／規格'],unit:['單位'],cost:['成本單價'],price:['建議報價單價'],supplier:['供應商'],source:['來源報價'],sourceDate:['來源日期'],note:['備註'],active:['啟用狀態'],createdAt:['建立時間'],updatedAt:['更新時間'],createdSource:['建立來源'],historyMin:['歷史最低價'],historyMax:['歷史最高價'],historyAvg:['歷史平均價'],historyCount:['歷史價格筆數']};
}
function quoteHistoryDefinitionsV191_() {
  return {historyId:['歷史ID'],itemId:['品項ID'],code:['品號'],name:['品名／規格'],category:['分類'],unit:['單位'],priceDate:['價格日期'],source:['來源報價'],historicalPrice:['歷史單價'],note:['備註'],createdAt:['建立時間']};
}
function quoteMasterDefinitionsV191_() {
  return {quoteId:['報價ID'],quoteNo:['報價單號'],version:['版本'],status:['狀態'],quoteDate:['報價日期'],validDays:['有效天數'],siteCode:['場地代號'],projectName:['專案名稱'],customer:['客戶名稱'],contact:['客戶聯絡人'],site:['工程地點'],customerPhone:['客戶電話'],paymentTerms:['付款條件'],companyName:['公司名稱'],companyTaxId:['統一編號'],companyPhone:['公司電話'],companyFax:['公司傳真'],companyAddress:['公司地址'],companyWeb:['公司網站Email'],quoteTitle:['報價標題'],quoteSubtitle:['英文標題'],discount:['折扣'],taxRate:['稅率'],costSubtotal:['成本小計'],subtotal:['未稅小計'],tax:['營業稅'],grand:['含稅總額'],grossProfit:['預估毛利'],grossMargin:['預估毛利率'],notes:['報價說明'],salesName:['業務姓名'],salesTitle:['業務職稱'],salesDept:['業務部門'],salesMobile:['業務手機'],salesPhone:['業務電話'],salesEmail:['業務Email'],salesAddress:['業務地址'],salesOther:['業務其他'],creator:['建立者'],createdAt:['建立時間'],updater:['更新者'],updatedAt:['更新時間'],archived:['封存狀態']};
}
function quoteLineDefinitionsV191_() {
  return {lineId:['明細ID'],quoteId:['報價ID'],quoteNo:['報價單號'],itemNo:['項次'],itemId:['品項ID'],bigCategory:['大分類'],category:['分類'],code:['品號'],name:['品名規格'],unit:['單位'],qty:['數量'],cost:['成本單價'],price:['報價單價'],amount:['未稅金額'],note:['備註'],source:['來源報價'],createdAt:['建立時間'],updatedAt:['更新時間']};
}

function quoteItemsV191_() { return readCanonical_(quoteSheetV191_('QUOTE_ITEMS'), quoteItemDefinitionsV191_()); }
function quoteHistoriesV191_() { return readCanonical_(quoteSheetV191_('QUOTE_HISTORY'), quoteHistoryDefinitionsV191_()); }
function quoteMastersV191_() { return readCanonical_(quoteSheetV191_('QUOTE_MASTER'), quoteMasterDefinitionsV191_()); }
function quoteLinesV191_() { return readCanonical_(quoteSheetV191_('QUOTE_LINES'), quoteLineDefinitionsV191_()); }

function quoteSettingsMapV191_() {
  const rows = readCanonical_(quoteSheetV191_('QUOTE_SETTINGS'), {key:['設定鍵'],value:['設定值']});
  const result = {};
  rows.forEach(function(row){ if (clean_(row.key)) result[clean_(row.key)] = row.value; });
  return result;
}

function ensureQuoteSettingV191_(key, value, description) {
  const sheet = quoteSheetV191_('QUOTE_SETTINGS');
  const rows = readCanonical_(sheet, {key:['設定鍵']});
  const found = rows.find(function(row){return clean_(row.key)===key;});
  const object = {'設定鍵':key,'設定值':value,'說明':description,'更新時間':new Date()};
  if (found) writeObject_(sheet, found.__rowNumber, object); else appendObject_(sheet, object);
}

function seedQuoteSettingsV191_() {
  const defaults = [
    ['SPREADSHEET_ID',APP.DB_ID,'報價資料庫所在試算表'],['ITEM_SHEET','報價品項主檔','品項主資料'],
    ['CATEGORY_SHEET','報價分類','分類來源'],['HISTORY_SHEET','報價歷史價格','歷史價格'],
    ['QUOTE_MASTER_SHEET','報價單主檔','報價抬頭、金額與狀態'],['QUOTE_LINES_SHEET','報價單明細','報價明細'],
    ['DEFAULT_TAX_RATE','5','預設營業稅率'],['COMPANY_NAME','阜爾運通股份有限公司','預設公司名稱'],
    ['COMPANY_PHONE','(02)2248-8958','預設公司電話'],['COMPANY_FAX','(02)2248-8318','預設公司傳真'],
    ['COMPANY_ADDRESS','新北市中和區中山路二段327巷10號4樓','預設公司地址'],
    ['QUOTE_TITLE','報　價　單','報價單中文標題'],['QUOTE_SUBTITLE','Quotation','報價單英文標題'],
    ['DEFAULT_VALID_DAYS','30','預設有效天數'],['DEFAULT_NOTES','1. 本報價有效期限為報價日起 30 天。\n2. 交貨、安裝、保固及付款條件依雙方確認內容辦理。\n3. 未列項目如需追加，另行報價。','預設報價說明']
  ];
  const current = quoteSettingsMapV191_();
  defaults.forEach(function(item){ if (current[item[0]] === undefined || current[item[0]] === '') ensureQuoteSettingV191_(item[0],item[1],item[2]); });
}

function quoteHistoryKeyV191_(code, history) {
  return clean_(code)+'|'+dateOnly_(history.date)+'|'+clean_(history.source)+'|'+Number(history.cost||0)+'|'+clean_(history.note);
}

function seedQuoteDatabaseV191_() {
  const itemSheet = quoteSheetV191_('QUOTE_ITEMS');
  const historySheet = quoteSheetV191_('QUOTE_HISTORY');
  const existingItems = quoteItemsV191_();
  const byCode = {};
  existingItems.forEach(function(item){ if(clean_(item.code)) byCode[clean_(item.code)] = item; });
  const existingHistory = {};
  quoteHistoriesV191_().forEach(function(h){ existingHistory[clean_(h.code)+'|'+dateOnly_(h.priceDate)+'|'+clean_(h.source)+'|'+Number(h.historicalPrice||0)+'|'+clean_(h.note)] = true; });
  let itemCount = 0, historyCount = 0;
  PSS_V191_SEED.forEach(function(product) {
    const code = clean_(product.code), itemId = 'QITEM-'+code;
    const history = Array.isArray(product.history) ? product.history : [];
    const prices = history.map(function(h){return Number(h.cost||0);});
    const stats = prices.length ? {min:Math.min.apply(null,prices),max:Math.max.apply(null,prices),avg:Math.round(prices.reduce(function(a,b){return a+b;},0)/prices.length),count:prices.length} : {min:Number(product.cost||0),max:Number(product.cost||0),avg:Number(product.cost||0),count:0};
    const object = {'品項ID':itemId,'大分類':bigCategoryV191_(product.category),'分類':clean_(product.category)||'其他','品號':code,'品名／規格':clean_(product.name),'單位':clean_(product.unit)||'式','成本單價':Number(product.cost||0),'建議報價單價':Number(product.price||0),'供應商':clean_(product.supplier),'來源報價':clean_(product.source),'來源日期':clean_(product.sourceDate),'備註':clean_(product.note),'啟用狀態':'啟用','更新時間':new Date(),'建立來源':'PSS 報價單產生器 V5','歷史最低價':stats.min,'歷史最高價':stats.max,'歷史平均價':stats.avg,'歷史價格筆數':stats.count};
    if (!byCode[code]) { object['建立時間']=new Date(); appendObject_(itemSheet,object); itemCount++; }
    history.forEach(function(h,index){
      const key = quoteHistoryKeyV191_(code,h);
      if(existingHistory[key]) return;
      appendObject_(historySheet,{'歷史ID':'QH-'+digestHex_(key).substring(0,20),'品項ID':itemId,'品號':code,'品名／規格':clean_(product.name),'分類':clean_(product.category),'單位':clean_(product.unit),'價格日期':clean_(h.date),'來源報價':clean_(h.source),'歷史單價':Number(h.cost||0),'備註':clean_(h.note),'建立時間':new Date()});
      existingHistory[key]=true;historyCount++;
    });
  });
  return {items:itemCount,histories:historyCount};
}

function rebuildQuoteCategoriesV191_() {
  const sheet = quoteSheetV191_('QUOTE_CATEGORIES');
  const items = quoteItemsV191_().filter(function(item){return clean_(item.active)!=='停用' && clean_(item.category);});
  const map = {};
  items.forEach(function(item){
    const key = clean_(item.bigCategory)+'|'+clean_(item.category);
    if(!map[key]) map[key]={bigCategory:clean_(item.bigCategory)||bigCategoryV191_(item.category),category:clean_(item.category),count:0};
    map[key].count++;
  });
  clearDataKeepHeader_(sheet);
  Object.keys(map).sort().forEach(function(key,index){const item=map[key];appendObject_(sheet,{'分類ID':'CAT-'+String(index+1).padStart(3,'0'),'大分類':item.bigCategory,'分類名稱':item.category,'品項數量':item.count,'啟用狀態':'啟用','排序':index+1,'建立時間':new Date(),'更新時間':new Date()});});
  return Object.keys(map).length;
}

function fixTrainingHeaderV191_() {
  const sheet = getSheet_('TRAINING', false);
  if(!sheet || sheet.getLastColumn()<1) return '';
  const first = clean_(sheet.getRange(1,1).getValue());
  if(first === 'v' || first === '' || first === 'ID') sheet.getRange(1,1).setValue('教材ID');
  return clean_(sheet.getRange(1,1).getValue());
}

function markSheetHeaderV191_(sheetName, symbol, note, background, fontColor) {
  const sheet = getDb_().getSheetByName(sheetName);
  if(!sheet || sheet.getLastColumn()<1) return;
  const lastCol = sheet.getLastColumn();
  const range = sheet.getRange(1,1,1,lastCol);
  range.setBackground(background).setFontColor(fontColor).setFontWeight('bold');
  for(let c=1;c<=lastCol;c++) {
    const cell=sheet.getRange(1,c), header=clean_(cell.getValue());
    if(header) cell.setNote(symbol+' '+note);
  }
}

function writeFieldUsageAuditV191_() {
  const sheet = quoteSheetV191_('FIELD_AUDIT');
  clearDataKeepHeader_(sheet);
  const now = new Date();
  const rows = [
    ['✅','使用中','教育訓練','教育訓練管理','A:O','V19.1 教育訓練程式使用全部既有欄位；A1 原「v」修正為「教材ID」。','保留並修正欄位名稱'],
    ['✅','使用中','V5報價','報價品項主檔','A:T','品項、成本、建議售價、供應商及歷史統計。','正式資料來源'],
    ['✅','使用中','V5報價','報價分類','A:H','報價分類與數量統計。','由程式重建'],
    ['✅','使用中','V5報價','報價歷史價格','A:K','每次來源價格與異動歷史。','保留歷史'],
    ['✅','使用中','V5報價','報價系統設定','A:D','公司抬頭、稅率、預設說明。','正式設定來源'],
    ['✅','使用中','V5報價','報價同步紀錄','A:K','品項及報價操作紀錄。','正式稽核來源'],
    ['✅','使用中','V5報價','報價單主檔','A:AQ','每張報價的抬頭、金額、狀態與業務資料。','正式報價主檔'],
    ['✅','使用中','V5報價','報價單明細','A:R','每張報價的品項明細。','正式報價明細'],
    ['⚪','前端停用','V19.0舊設備中心','設備主檔','A:V','V19.1 已由 V5 報價管理取代設備／服務頁面；資料不刪除。','保留歷史，不再由前端新增'],
    ['⚪','前端停用','V19.0舊設備中心','服務主檔','A:O','V19.1 前端不再使用。','保留歷史'],
    ['⚪','前端停用','V19.0舊設備中心','設定主檔','A:P','V19.1 前端不再使用。','保留歷史'],
    ['⚪','前端停用','V19.0舊設備中心','設定異動紀錄','A:K','V19.1 前端不再使用。','保留歷史'],
    ['⚪','前端停用','V19.0舊設備中心','部署紀錄','A:Q','V19.1 前端不再使用。','保留歷史'],
    ['⚪','前端停用','V19.0舊設備中心','維護異常','A:S','V19.1 前端不再使用。','保留歷史']
  ];
  rows.forEach(function(row){appendObject_(sheet,{'稽核日期':now,'符號':row[0],'使用狀態':row[1],'模組':row[2],'工作表':row[3],'欄位範圍':row[4],'說明':row[5],'處理方式':row[6]});});
  markSheetHeaderV191_('教育訓練管理','✅','V19.1 使用中','#d9ead3','#274e13');
  ['報價品項主檔','報價分類','報價歷史價格','報價系統設定','報價同步紀錄','報價單主檔','報價單明細'].forEach(function(name){markSheetHeaderV191_(name,'✅','V19.1 V5報價模組使用中','#d9ead3','#274e13');});
  ['設備主檔','服務主檔','設定主檔','設定異動紀錄','部署紀錄','維護異常'].forEach(function(name){markSheetHeaderV191_(name,'⚪','V19.1 前端停用；保留既有歷史資料','#d9d9d9','#666666');});
  sheet.setFrozenRows(1);
  return rows.length;
}

function setupPssAiPmoV191() {
  setupPssAiPmoV183();
  Object.keys(PSS_V191.HEADERS).forEach(function(key){quoteSheetV191_(key);});
  fixTrainingHeaderV191_();
  seedQuoteSettingsV191_();
  const seeded = seedQuoteDatabaseV191_();
  const categories = rebuildQuoteCategoriesV191_();
  const auditRows = writeFieldUsageAuditV191_();
  PropertiesService.getScriptProperties().setProperty('PSS_V191_INSTALLED', new Date().toISOString());
  rebuildDataDictionaryV17_();
  return ['PSS AI-PMO V19.1 Quotation Fusion Stable 初始化完成。','設備／服務前端已由 PSS 報價單產生器 V5 取代。','新增品項：'+seeded.items+'；新增歷史價格：'+seeded.histories+'；分類：'+categories+'；稽核標記：'+auditRows+'。','所有報價資料均存於：'+getDb_().getName()].join('\n');
}

function normalizeQuoteItemV191_(item, canSeeCost) {
  return {itemId:clean_(item.itemId),bigCategory:clean_(item.bigCategory),category:clean_(item.category),code:clean_(item.code),name:clean_(item.name),unit:clean_(item.unit),cost:canSeeCost?Number(item.cost||0):0,price:Number(item.price||0),supplier:clean_(item.supplier),source:clean_(item.source),sourceDate:dateOnly_(item.sourceDate),note:clean_(item.note),active:clean_(item.active),historyMin:canSeeCost?Number(item.historyMin||0):0,historyMax:canSeeCost?Number(item.historyMax||0):0,historyAvg:canSeeCost?Number(item.historyAvg||0):0,historyCount:Number(item.historyCount||0),updatedAt:dateTime_(item.updatedAt)};
}

function listQuoteProductsV191(payload) {
  payload=payload||{};
  const user=requireFeatureV192_(payload.token,'QUOTE','view'), canSeeCost=hasFeatureV192_(user,'QUOTE','edit'), q=clean_(payload.keyword).toLowerCase(), category=clean_(payload.category), includeInactive=payload.includeInactive===true&&canSeeCost;
  return quoteItemsV191_().filter(function(item){if(!includeInactive&&clean_(item.active)==='停用')return false;if(category&&clean_(item.category)!==category)return false;return !q||[item.code,item.name,item.category,item.bigCategory,item.source,item.supplier].join(' ').toLowerCase().indexOf(q)>=0;}).map(function(item){return normalizeQuoteItemV191_(item,canSeeCost);}).sort(function(a,b){return a.category.localeCompare(b.category,'zh-Hant')||a.code.localeCompare(b.code);});
}

function listQuoteHistoryV191(payload) {
  payload=payload||{};
  const user=requireFeatureV192_(payload.token,'QUOTE','view');if(!hasFeatureV192_(user,'QUOTE','edit'))return[];
  return quoteHistoriesV191_().filter(function(h){return !payload.code||clean_(h.code)===clean_(payload.code);}).map(function(h){return{historyId:clean_(h.historyId),itemId:clean_(h.itemId),code:clean_(h.code),name:clean_(h.name),category:clean_(h.category),unit:clean_(h.unit),date:dateOnly_(h.priceDate),source:clean_(h.source),price:Number(h.historicalPrice||0),note:clean_(h.note)};}).sort(function(a,b){return String(b.date).localeCompare(String(a.date));}).slice(0,500);
}

function listQuotesV191(payload) {
  payload=payload||{};
  const user=requireFeatureV192_(payload.token,'QUOTE','view'), manager=hasFeatureV192_(user,'QUOTE','edit'), q=clean_(payload.keyword).toLowerCase();
  return quoteMastersV191_().filter(function(item){if(clean_(item.archived)==='是'&&payload.includeArchived!==true)return false;if(!manager&&clean_(item.creator)!==user.name)return false;return !q||[item.quoteNo,item.projectName,item.customer,item.salesName,item.status].join(' ').toLowerCase().indexOf(q)>=0;}).map(function(item){return{quoteId:clean_(item.quoteId),quoteNo:clean_(item.quoteNo),version:clean_(item.version),status:clean_(item.status),quoteDate:dateOnly_(item.quoteDate),siteCode:clean_(item.siteCode),projectName:clean_(item.projectName),customer:clean_(item.customer),subtotal:Number(item.subtotal||0),grand:Number(item.grand||0),grossMargin:manager?Number(item.grossMargin||0):null,creator:clean_(item.creator),updatedAt:dateTime_(item.updatedAt),archived:clean_(item.archived)};}).sort(function(a,b){return String(b.updatedAt||b.quoteDate).localeCompare(String(a.updatedAt||a.quoteDate));}).slice(0,Math.min(Number(payload.limit||100),500));
}

/* R4.3 cleanup: removed shadowed legacy function getQuoteCenterV191. */

function logQuoteV191_(user,action,targetType,targetId,content,result,errorMessage) {
  try{appendObject_(quoteSheetV191_('QUOTE_LOGS'),{'時間':new Date(),'帳號':user?user.account:'','姓名':user?user.name:'','動作':action,'目標類型':targetType,'目標ID':targetId||'','內容':typeof content==='string'?content:JSON.stringify(content||{}),'結果':result||'成功','錯誤訊息':errorMessage||'','版本':PSS_V191.VERSION,'來源':'Web App'});}catch(ignore){}
}

function appendQuotePriceHistoryV191_(product, price, source, date, note) {
  const key=clean_(product.code)+'|'+dateOnly_(date||new Date())+'|'+clean_(source)+'|'+Number(price||0)+'|'+clean_(note);
  const exists=quoteHistoriesV191_().some(function(h){return quoteHistoryKeyV191_(h.code,{date:h.priceDate,source:h.source,cost:h.historicalPrice,note:h.note})===key;});
  if(exists)return;
  appendObject_(quoteSheetV191_('QUOTE_HISTORY'),{'歷史ID':'QH-'+digestHex_(key).substring(0,20),'品項ID':product.itemId,'品號':product.code,'品名／規格':product.name,'分類':product.category,'單位':product.unit,'價格日期':date||new Date(),'來源報價':source||'Web App 更新','歷史單價':Number(price||0),'備註':note||'','建立時間':new Date()});
}

function refreshQuoteItemHistoryStatsV191_(itemId) {
  const histories=quoteHistoriesV191_().filter(function(h){return clean_(h.itemId)===clean_(itemId);});if(!histories.length)return;
  const nums=histories.map(function(h){return Number(h.historicalPrice||0);});
  const sheet=quoteSheetV191_('QUOTE_ITEMS'),target=quoteItemsV191_().find(function(i){return clean_(i.itemId)===clean_(itemId);});if(!target)return;
  writeObject_(sheet,target.__rowNumber,{'歷史最低價':Math.min.apply(null,nums),'歷史最高價':Math.max.apply(null,nums),'歷史平均價':Math.round(nums.reduce(function(a,b){return a+b;},0)/nums.length),'歷史價格筆數':nums.length,'更新時間':new Date()});
}

function saveQuoteProductV191(payload) {
  payload=payload||{};const user=requireFeatureV192_(payload.token,'QUOTE','edit'),sheet=quoteSheetV191_('QUOTE_ITEMS'),items=quoteItemsV191_();
  const code=clean_(payload.code),name=clean_(payload.name);if(!code||!name)throw new Error('品號與品名／規格必填。');
  const target=items.find(function(i){return clean_(i.itemId)===clean_(payload.itemId)||clean_(i.code)===code;});
  if(items.some(function(i){return clean_(i.code)===code&&(!target||i.__rowNumber!==target.__rowNumber);}))throw new Error('品號已存在：'+code);
  const itemId=target?clean_(target.itemId):'QITEM-'+code,now=new Date();
  const object={'品項ID':itemId,'大分類':clean_(payload.bigCategory)||bigCategoryV191_(payload.category),'分類':clean_(payload.category)||'其他','品號':code,'品名／規格':name,'單位':clean_(payload.unit)||'式','成本單價':Number(payload.cost||0),'建議報價單價':Number(payload.price||0),'供應商':clean_(payload.supplier),'來源報價':clean_(payload.source)||'Web App 自訂','來源日期':clean_(payload.sourceDate)||dateOnly_(now),'備註':clean_(payload.note),'啟用狀態':clean_(payload.active)||'啟用','更新時間':now,'建立來源':target?target.createdSource:'Web App'};
  if(target)writeObject_(sheet,target.__rowNumber,object);else appendObject_(sheet,Object.assign({'建立時間':now},object));
  const oldCost=target?Number(target.cost||0):null,oldPrice=target?Number(target.price||0):null;
  if(!target||oldCost!==Number(object['成本單價'])||oldPrice!==Number(object['建議報價單價']))appendQuotePriceHistoryV191_({itemId:itemId,code:code,name:name,category:object['分類'],unit:object['單位']},object['成本單價'],object['來源報價'],object['來源日期'],object['備註']);
  refreshQuoteItemHistoryStatsV191_(itemId);rebuildQuoteCategoriesV191_();logQuoteV191_(user,target?'更新品項':'新增品項','品項',itemId,object,'成功','');operationLog_(user,target?'更新報價品項':'新增報價品項','報價管理',itemId,object,'成功');return{message:target?'品項已更新。':'品項已新增。',itemId:itemId};
}

function archiveQuoteProductV191(payload) {
  payload=payload||{};const user=requireFeatureV192_(payload.token,'QUOTE','edit'),sheet=quoteSheetV191_('QUOTE_ITEMS'),target=quoteItemsV191_().find(function(i){return clean_(i.itemId)===clean_(payload.itemId)||clean_(i.code)===clean_(payload.code);});if(!target)throw new Error('找不到品項。');writeObject_(sheet,target.__rowNumber,{'啟用狀態':'停用','更新時間':new Date()});rebuildQuoteCategoriesV191_();logQuoteV191_(user,'停用品項','品項',target.itemId,{code:target.code},'成功','');return'品項已停用並保留歷史資料。';
}

function importQuoteProductsV191(payload) {
  payload=payload||{};const user=requireFeatureV192_(payload.token,'QUOTE','edit'),items=Array.isArray(payload.items)?payload.items:[];if(!items.length)throw new Error('匯入資料為空。');if(items.length>1000)throw new Error('單次最多匯入 1000 筆。');let success=0,failed=[];
  items.forEach(function(item,index){try{saveQuoteProductV191({token:payload.token,itemId:item.itemId||'',bigCategory:item.bigCategory||'',category:item.category||'其他',code:item.code||('IMPORT-'+Date.now()+'-'+index),name:item.name||item['品名／規格']||'',unit:item.unit||'式',cost:item.cost||0,price:item.price||0,supplier:item.supplier||'',source:item.source||'JSON 匯入',sourceDate:item.sourceDate||dateOnly_(new Date()),note:item.note||'',active:item.active||'啟用'});success++;}catch(error){failed.push({index:index+1,code:item.code||'',message:error.message});}});
  logQuoteV191_(user,'匯入品項','品項','',{success:success,failed:failed},failed.length?'部分失敗':'成功','');return{message:'匯入完成：成功 '+success+' 筆，失敗 '+failed.length+' 筆。',success:success,failed:failed};
}

function generateQuoteNoV191_() {
  const prefix='Q-'+Utilities.formatDate(new Date(),APP.TZ,'yyyyMMdd')+'-';const existing={};quoteMastersV191_().forEach(function(q){existing[clean_(q.quoteNo)]=true;});for(let i=1;i<=9999;i++){const no=prefix+String(i).padStart(3,'0');if(!existing[no])return no;}throw new Error('今日報價單號已用完。');
}

function quoteTotalsV191_(items,discount,taxRate) {
  let cost=0,subtotal=0;items.forEach(function(item){const qty=Math.max(0,Number(item.qty||0)),c=Math.max(0,Number(item.cost||0)),p=Math.max(0,Number(item.price||0));cost+=qty*c;subtotal+=qty*p;});const d=Math.max(0,Number(discount||0)),taxable=Math.max(0,subtotal-d),tax=Math.round(taxable*Math.max(0,Number(taxRate||0))/100),grand=taxable+tax,gross=subtotal-cost,margin=subtotal?gross/subtotal*100:0;return{cost:cost,subtotal:subtotal,tax:tax,grand:grand,gross:gross,margin:margin};
}

function saveQuoteV191(payload) {
  payload=payload||{};const user=requireFeatureV192_(payload.token,'QUOTE','edit'),masterSheet=quoteSheetV191_('QUOTE_MASTER'),lineSheet=quoteSheetV191_('QUOTE_LINES');
  const items=(Array.isArray(payload.items)?payload.items:[]).filter(function(i){return clean_(i.name)||clean_(i.code);});if(!items.length)throw new Error('請至少加入一筆報價項目。');
  const masters=quoteMastersV191_(),target=masters.find(function(q){return clean_(q.quoteId)===clean_(payload.quoteId);});if(target&&!isManager_(user)&&clean_(target.creator)!==user.name)throw new Error('你沒有權限修改此報價。');
  const lock=LockService.getScriptLock();lock.waitLock(30000);let quoteNo;try{quoteNo=clean_(payload.quoteNo)||(target?clean_(target.quoteNo):generateQuoteNoV191_());}finally{lock.releaseLock();}
  const quoteId=target?clean_(target.quoteId):makeId_('QTE'),now=new Date(),totals=quoteTotalsV191_(items,payload.discount,payload.taxRate),status=clean_(payload.status)||'草稿';
  const object={'報價ID':quoteId,'報價單號':quoteNo,'版本':clean_(payload.version)||'V1','狀態':status,'報價日期':clean_(payload.quoteDate)||dateOnly_(now),'有效天數':Number(payload.validDays||30),'場地代號':clean_(payload.siteCode),'專案名稱':clean_(payload.projectName),'客戶名稱':clean_(payload.customer),'客戶聯絡人':clean_(payload.contact),'工程地點':clean_(payload.site),'客戶電話':clean_(payload.customerPhone),'付款條件':clean_(payload.paymentTerms),'公司名稱':clean_(payload.companyName),'統一編號':clean_(payload.companyTaxId),'公司電話':clean_(payload.companyPhone),'公司傳真':clean_(payload.companyFax),'公司地址':clean_(payload.companyAddress),'公司網站Email':clean_(payload.companyWeb),'報價標題':clean_(payload.quoteTitle)||'報　價　單','英文標題':clean_(payload.quoteSubtitle)||'Quotation','折扣':Math.max(0,Number(payload.discount||0)),'稅率':Math.max(0,Number(payload.taxRate||0)),'成本小計':totals.cost,'未稅小計':totals.subtotal,'營業稅':totals.tax,'含稅總額':totals.grand,'預估毛利':totals.gross,'預估毛利率':totals.margin,'報價說明':clean_(payload.notes),'業務姓名':clean_(payload.salesName)||user.name,'業務職稱':clean_(payload.salesTitle),'業務部門':clean_(payload.salesDept),'業務手機':clean_(payload.salesMobile),'業務電話':clean_(payload.salesPhone),'業務Email':clean_(payload.salesEmail)||user.email,'業務地址':clean_(payload.salesAddress),'業務其他':clean_(payload.salesOther),'建立者':target?target.creator:user.name,'建立時間':target?target.createdAt:now,'更新者':user.name,'更新時間':now,'封存狀態':'否'};
  if(target)writeObject_(masterSheet,target.__rowNumber,object);else appendObject_(masterSheet,object);
  const existingLines=quoteLinesV191_().filter(function(line){return clean_(line.quoteId)===quoteId;}).sort(function(a,b){return b.__rowNumber-a.__rowNumber;});existingLines.forEach(function(line){lineSheet.deleteRow(line.__rowNumber);});
  items.forEach(function(item,index){const qty=Math.max(0,Number(item.qty||0)),price=Math.max(0,Number(item.price||0));appendObject_(lineSheet,{'明細ID':makeId_('QLN'),'報價ID':quoteId,'報價單號':quoteNo,'項次':index+1,'品項ID':clean_(item.itemId),'大分類':clean_(item.bigCategory)||bigCategoryV191_(item.category),'分類':clean_(item.category),'品號':clean_(item.code),'品名規格':clean_(item.name),'單位':clean_(item.unit)||'式','數量':qty,'成本單價':Math.max(0,Number(item.cost||0)),'報價單價':price,'未稅金額':qty*price,'備註':clean_(item.note),'來源報價':clean_(item.source),'建立時間':now,'更新時間':now});});
  logQuoteV191_(user,target?'更新報價':'新增報價','報價單',quoteId,{quoteNo:quoteNo,status:status,itemCount:items.length,grand:totals.grand},'成功','');operationLog_(user,target?'更新報價單':'新增報價單','報價管理',quoteId,{quoteNo:quoteNo,status:status,grand:totals.grand},'成功');return{message:status==='草稿'?'報價草稿已儲存。':'報價單已儲存。',quoteId:quoteId,quoteNo:quoteNo,totals:totals};
}

function getQuoteV191(payload) {
  payload=payload||{};const user=requireFeatureV192_(payload.token,'QUOTE','view'),master=quoteMastersV191_().find(function(q){return clean_(q.quoteId)===clean_(payload.quoteId)||clean_(q.quoteNo)===clean_(payload.quoteNo);});if(!master)throw new Error('找不到報價單。');if(!isManager_(user)&&clean_(master.creator)!==user.name)throw new Error('你沒有權限查看此報價。');
  const manager=hasFeatureV192_(user,'QUOTE','edit'),fields={};Object.keys(quoteMasterDefinitionsV191_()).forEach(function(k){const value=master[k];fields[k]=value instanceof Date?dateTime_(value):value;});fields.quoteDate=dateOnly_(master.quoteDate);if(!manager){fields.costSubtotal=null;fields.grossProfit=null;fields.grossMargin=null;}
  const items=quoteLinesV191_().filter(function(line){return clean_(line.quoteId)===clean_(master.quoteId);}).sort(function(a,b){return Number(a.itemNo||0)-Number(b.itemNo||0);}).map(function(line){return{lineId:clean_(line.lineId),itemId:clean_(line.itemId),bigCategory:clean_(line.bigCategory),category:clean_(line.category),code:clean_(line.code),name:clean_(line.name),unit:clean_(line.unit),qty:Number(line.qty||0),cost:manager?Number(line.cost||0):0,price:Number(line.price||0),amount:Number(line.amount||0),note:clean_(line.note),source:clean_(line.source)};});
  return{fields:fields,items:items,canSeeCost:manager};
}

function archiveQuoteV191(payload) {
  payload=payload||{};const user=requireFeatureV192_(payload.token,'QUOTE','edit'),sheet=quoteSheetV191_('QUOTE_MASTER'),target=quoteMastersV191_().find(function(q){return clean_(q.quoteId)===clean_(payload.quoteId);});if(!target)throw new Error('找不到報價單。');if(!isManager_(user)&&clean_(target.creator)!==user.name)throw new Error('你沒有權限封存此報價。');writeObject_(sheet,target.__rowNumber,{'封存狀態':'是','狀態':'封存','更新者':user.name,'更新時間':new Date()});logQuoteV191_(user,'封存報價','報價單',target.quoteId,{quoteNo:target.quoteNo},'成功','');return'報價單已封存。';
}

function saveQuoteSettingsV191(payload) {
  payload=payload||{};const user=requireFeatureV192_(payload.token,'QUOTE','edit'),settings=payload.settings||{};Object.keys(settings).forEach(function(key){ensureQuoteSettingV191_(key,settings[key],'由報價管理頁更新');});logQuoteV191_(user,'更新報價設定','設定','',settings,'成功','');return'報價系統設定已更新。';
}

function runV191SelfTest() {
  const lines=['PSS AI-PMO V19.1 Quotation Fusion Stable 自我檢查'];
  try{lines.push('✅ 主資料庫：'+getDb_().getName()+' / '+APP.DB_ID);}catch(error){lines.push('❌ 主資料庫：'+error.message);}
  Object.keys(PSS_V191.HEADERS).forEach(function(key){try{const sheet=quoteSheetV191_(key),hs=headers_(sheet),missing=PSS_V191.HEADERS[key].filter(function(h){return hs.indexOf(h)<0;});lines.push((missing.length?'❌':'✅')+' '+candidates_(key)[0]+'：'+(missing.length?'缺少 '+missing.join('、'):Math.max(0,sheet.getLastRow()-1)+' 筆'));}catch(error){lines.push('❌ '+key+'：'+error.message);}});
  const training=getSheet_('TRAINING',false);lines.push(training&&clean_(training.getRange(1,1).getValue())==='教材ID'?'✅ 教育訓練管理 A1＝教材ID':'❌ 教育訓練管理 A1 欄位需修正');
  lines.push('✅ 設備／服務前端已由 V5 報價管理取代');lines.push('✅ 舊設備資料保留並以 ⚪ 標記前端停用');lines.push('✅ Session：12 小時無操作逾時');return lines.join('\n');
}

/* 最新入口與舊版相容入口。Apps Script 以最後宣告為準。 */
/* R4.3 cleanup: removed shadowed legacy function setupPssAiPmoV190. */
/* R4.3 cleanup: removed shadowed legacy function setupPssAiPmoV17Enterprise. */
/* R4.3 cleanup: removed shadowed legacy function healthCheckV190. */
/* R4.3 cleanup: removed shadowed legacy function healthCheckV17. */
/* R4.3 cleanup: removed shadowed legacy function onOpen. */
/* R4.3 cleanup: removed shadowed legacy function doGet. */



/* ========================================================================
 * PSS AI-PMO V19.2 Account Permission Matrix Stable
 * 主管可針對每一帳號，以「檢視／編輯」勾選各頁功能。
 * 個人權限優先於角色權限；未設定個人權限時維持 V19.1 舊版預設。
 * ======================================================================== */
const PSS_V192 = Object.freeze({
  VERSION: 'V19.2 Account Permission Matrix Stable',
  FEATURES: Object.freeze([
    {code:'DASHBOARD',name:'首頁',page:'dashboard',order:10},
    {code:'DISPATCH',name:'新增派工',page:'dispatch',order:20},
    {code:'TASK',name:'工作事項',page:'tasks',order:30},
    {code:'REPORT',name:'每日回報',page:'reports',order:40},
    {code:'PROJECT',name:'專案管理',page:'projects',order:50},
    {code:'CLOUD',name:'雲端／圖面',page:'cloud',order:60},
    {code:'MEETING',name:'會議管理',page:'meetings',order:65},
    {code:'GANTT',name:'專案歷程／甘特',page:'gantt',order:70},
    {code:'TRAINING',name:'教育訓練',page:'training',order:80},
    {code:'QUOTE',name:'報價管理',page:'quotes',order:90},
    {code:'ADMIN',name:'主管管理',page:'admin',order:100}
  ]),
  ROLE_SHEET: '角色權限',
  USER_SHEET: '個人權限',
  FEATURE_SHEET: '功能定義',
  PERMISSION_HEADERS: Object.freeze(['權限ID','對象類型','對象ID','對象名稱','功能代碼','可檢視','可新增','可編輯','可刪除','可匯出','可指派','可審核','資料範圍','狀態','更新者','更新時間'])
});

function permissionYesV192_(value) {
  const v = clean_(value).toLowerCase();
  return ['是','v','✓','✔','true','1','yes','y','啟用','允許'].indexOf(v) >= 0;
}

function permissionWordV192_(value) { return value ? '是' : '否'; }

function permissionSheetV192_(name) {
  return getOrCreateSheet_([name], PSS_V192.PERMISSION_HEADERS);
}

function featureDefinitionsV192_() { return PSS_V192.FEATURES.map(function(item){return Object.assign({},item);}); }

function legacyDefaultPermissionV192_(user, code) {
  const manager = isManager_(user);
  const defaults = {
    DASHBOARD:{view:true,edit:manager},
    DISPATCH:{view:manager,edit:manager},
    TASK:{view:true,edit:true},
    REPORT:{view:true,edit:true},
    PROJECT:{view:true,edit:manager},
    CLOUD:{view:true,edit:manager},
    MEETING:{view:false,edit:false},
    GANTT:{view:manager,edit:manager},
    TRAINING:{view:true,edit:manager},
    QUOTE:{view:true,edit:true},
    ADMIN:{view:manager,edit:manager}
  };
  return Object.assign({view:false,edit:false}, defaults[code] || {});
}

function permissionRowsV192_(sheet) {
  return readCanonical_(sheet,{
    id:['權限ID'],subjectType:['對象類型'],subjectId:['對象ID'],subjectName:['對象名稱'],role:['角色'],
    feature:['功能代碼'],view:['可檢視'],add:['可新增'],edit:['可編輯'],remove:['可刪除'],
    export:['可匯出'],assign:['可指派'],approve:['可審核'],scope:['資料範圍'],status:['狀態'],updatedBy:['更新者'],updatedAt:['更新時間']
  });
}

function rowPermissionV192_(row) {
  const edit = permissionYesV192_(row.edit) || permissionYesV192_(row.add) || permissionYesV192_(row.remove) || permissionYesV192_(row.export) || permissionYesV192_(row.assign) || permissionYesV192_(row.approve);
  return {view:permissionYesV192_(row.view) || edit, edit:edit};
}

function rolePermissionMapV192_(user) {
  const map = {};
  const sheet = getDb_().getSheetByName(PSS_V192.ROLE_SHEET);
  if (!sheet) return map;
  permissionRowsV192_(sheet).forEach(function(row){
    const role = clean_(row.role || row.subjectType || row.subjectName);
    if (role !== clean_(user.role) || clean_(row.status)==='停用') return;
    const code = clean_(row.feature).toUpperCase();
    if (code) map[code] = rowPermissionV192_(row);
  });
  return map;
}

function personalPermissionRowsV192_(user) {
  const sheet = getDb_().getSheetByName(PSS_V192.USER_SHEET);
  if (!sheet) return [];
  return permissionRowsV192_(sheet).filter(function(row){
    if (clean_(row.status)==='停用') return false;
    const id = clean_(row.subjectId), name = clean_(row.subjectName);
    return (id && [clean_(user.id),clean_(user.account)].indexOf(id)>=0) || (name && name===clean_(user.name));
  });
}

function effectivePermissionMapV192_(user) {
  const result = {}, roleMap = rolePermissionMapV192_(user), personalRows = personalPermissionRowsV192_(user), personalMap = {};
  personalRows.forEach(function(row){const code=clean_(row.feature).toUpperCase();if(code)personalMap[code]=rowPermissionV192_(row);});
  PSS_V192.FEATURES.forEach(function(feature){
    const code=feature.code;
    const base=legacyDefaultPermissionV192_(user,code);
    const role=roleMap[code];
    const personal=personalMap[code];
    const value=personal || role || base;
    result[code]={view:!!value.view,edit:!!value.edit,source:personal?'個人設定':(role?'角色設定':'系統預設')};
  });
  return result;
}

/* 最終 accessFor_：保留舊版欄位，同時加入 modules 權限矩陣。 */
function accessFor_(user) {
  const modules = effectivePermissionMapV192_(user), manager = isManager_(user);
  return {
    manager:manager, modules:modules,
    canDispatch:modules.DISPATCH.edit,
    canManageProjects:modules.PROJECT.edit,
    canManageUsers:modules.ADMIN.edit,
    canEditAnnouncements:modules.ADMIN.edit,
    canEditDocuments:modules.ADMIN.edit,
    canEditTraining:modules.TRAINING.edit,
    canViewAllTasks:manager && modules.TASK.view,
    canViewAllReports:manager && modules.REPORT.view,
    canViewOperationLogs:modules.ADMIN.view,
    canManageSettings:modules.ADMIN.edit,
    quoteView:modules.QUOTE.view,
    quoteEdit:modules.QUOTE.edit
  };
}

function requireFeatureV192_(token, featureCode, action) {
  const user=requireUser_(token), code=clean_(featureCode).toUpperCase(), mode=clean_(action).toLowerCase()==='edit'?'edit':'view';
  const permission=effectivePermissionMapV192_(user)[code];
  if(!permission || !permission[mode]) throw new Error('權限不足：你沒有「'+(PSS_V192.FEATURES.find(function(x){return x.code===code;})||{name:code}).name+'」'+(mode==='edit'?'編輯':'檢視')+'權限。');
  return user;
}

function hasFeatureV192_(user, featureCode, action) {
  const p=effectivePermissionMapV192_(user)[clean_(featureCode).toUpperCase()];
  return !!(p && p[clean_(action).toLowerCase()==='edit'?'edit':'view']);
}

function findUserV192_(userId) {
  const target=clean_(userId), users=readCanonical_(findAccountSheetV171_(),accountDefinitionsV171_());
  const row=users.find(function(u){return [clean_(u.id),clean_(u.account),clean_(u.name)].indexOf(target)>=0;});
  if(!row) throw new Error('找不到帳號：'+target);
  return {id:clean_(row.id),account:clean_(row.account),name:clean_(row.name),role:clean_(row.role)||'工程師',permission:clean_(row.permission)||'一般',status:clean_(row.status)};
}

function getUserPermissionMatrixV192(payload) {
  payload=payload||{};requireFeatureV192_(payload.token,'ADMIN','view');
  const target=findUserV192_(payload.userId), effective=effectivePermissionMapV192_(target), personal=personalPermissionRowsV192_(target), personalCodes={};
  personal.forEach(function(row){personalCodes[clean_(row.feature).toUpperCase()]=true;});
  return {user:target,features:PSS_V192.FEATURES.map(function(feature){const p=effective[feature.code];return{code:feature.code,name:feature.name,page:feature.page,order:feature.order,view:p.view,edit:p.edit,source:p.source,hasOverride:!!personalCodes[feature.code]};})};
}

function removePersonalPermissionsV192_(target) {
  const sheet=permissionSheetV192_(PSS_V192.USER_SHEET), rows=permissionRowsV192_(sheet).filter(function(row){
    const id=clean_(row.subjectId),name=clean_(row.subjectName);
    return (id && [target.id,target.account].indexOf(id)>=0)||(name&&name===target.name);
  }).sort(function(a,b){return b.__rowNumber-a.__rowNumber;});
  rows.forEach(function(row){sheet.deleteRow(row.__rowNumber);});
  return rows.length;
}

function saveUserPermissionMatrixV192(payload) {
  payload=payload||{};const actor=requireFeatureV192_(payload.token,'ADMIN','edit'),target=findUserV192_(payload.userId),items=Array.isArray(payload.permissions)?payload.permissions:[];
  if(!items.length) throw new Error('權限清單不可空白。');
  const normalized={};items.forEach(function(item){const code=clean_(item.code).toUpperCase();if(PSS_V192.FEATURES.some(function(f){return f.code===code;})){const edit=!!item.edit;normalized[code]={view:!!item.view||edit,edit:edit};}});
  if(target.id===actor.id && (!normalized.ADMIN || !normalized.ADMIN.view || !normalized.ADMIN.edit)) throw new Error('不能取消目前登入帳號自己的主管管理檢視／編輯權限。');
  const sheet=permissionSheetV192_(PSS_V192.USER_SHEET);removePersonalPermissionsV192_(target);const now=new Date();
  PSS_V192.FEATURES.forEach(function(feature){const p=normalized[feature.code]||{view:false,edit:false};appendObject_(sheet,{
    '權限ID':'UPM-'+target.id+'-'+feature.code,'對象類型':'個人','對象ID':target.id,'對象名稱':target.name,'功能代碼':feature.code,
    '可檢視':permissionWordV192_(p.view),'可新增':permissionWordV192_(p.edit),'可編輯':permissionWordV192_(p.edit),'可刪除':permissionWordV192_(p.edit),
    '可匯出':permissionWordV192_(p.edit),'可指派':permissionWordV192_(p.edit),'可審核':permissionWordV192_(p.edit),'資料範圍':p.edit?'全部':'本人／可檢視資料',
    '狀態':'啟用','更新者':actor.name,'更新時間':now
  });});
  operationLog_(actor,'更新帳號功能權限','個人權限',target.id,normalized,'成功');
  return {message:'已更新 '+target.name+' 的功能權限。',userId:target.id};
}

function resetUserPermissionMatrixV192(payload) {
  payload=payload||{};const actor=requireFeatureV192_(payload.token,'ADMIN','edit'),target=findUserV192_(payload.userId);
  if(target.id===actor.id) throw new Error('不能直接清除目前登入帳號自己的個人權限；請先確認角色權限可保留主管管理。');
  const removed=removePersonalPermissionsV192_(target);operationLog_(actor,'恢復角色預設權限','個人權限',target.id,{removed:removed},'成功');
  return '已清除 '+target.name+' 的個人權限，恢復角色／系統預設。';
}

function ensureFeatureDefinitionsV192_() {
  const headers=['功能代碼','功能名稱','頁面代碼','說明','排序','狀態'], sheet=getOrCreateSheet_([PSS_V192.FEATURE_SHEET],headers), rows=readCanonical_(sheet,{code:['功能代碼']});
  PSS_V192.FEATURES.forEach(function(feature){if(!rows.some(function(row){return clean_(row.code).toUpperCase()===feature.code;}))appendObject_(sheet,{'功能代碼':feature.code,'功能名稱':feature.name,'頁面代碼':feature.page,'說明':feature.name+'的檢視與編輯權限','排序':feature.order,'狀態':'啟用'});});
  return PSS_V192.FEATURES.length;
}

function seedUserMatrixIfMissingV192_(name, allowedCodes) {
  const users=readCanonical_(findAccountSheetV171_(),accountDefinitionsV171_()), row=users.find(function(u){return clean_(u.name)===name;});
  if(!row) return '找不到 '+name;
  const user={id:clean_(row.id),account:clean_(row.account),name:clean_(row.name),role:clean_(row.role)||'工程師',permission:clean_(row.permission)||'一般',status:clean_(row.status)};
  if(personalPermissionRowsV192_(user).length) return name+' 已有個人設定';
  const sheet=permissionSheetV192_(PSS_V192.USER_SHEET), now=new Date(), allowed={};allowedCodes.forEach(function(code){allowed[code]=true;});
  PSS_V192.FEATURES.forEach(function(feature){const edit=!!allowed[feature.code];appendObject_(sheet,{'權限ID':'UPM-'+user.id+'-'+feature.code,'對象類型':'個人','對象ID':user.id,'對象名稱':user.name,'功能代碼':feature.code,'可檢視':permissionWordV192_(edit),'可新增':permissionWordV192_(edit),'可編輯':permissionWordV192_(edit),'可刪除':permissionWordV192_(edit),'可匯出':permissionWordV192_(edit),'可指派':permissionWordV192_(edit),'可審核':permissionWordV192_(edit),'資料範圍':edit?'全部':'無','狀態':'啟用','更新者':'V19.2 初始化','更新時間':now});});
  return name+' 已建立個人設定';
}

function quoteProjectSelectionV192_() {
  return projectRowsV182_().filter(function(p){return clean_(p.active)!=='停用'&&clean_(p.siteCode);}).map(function(p){return{siteCode:clean_(p.siteCode),projectName:clean_(p.projectName),customer:clean_(p.customer),address:clean_(p.address),status:clean_(p.status),label:[clean_(p.siteCode),clean_(p.projectName)].filter(Boolean).join('｜')};}).sort(function(a,b){return a.projectName.localeCompare(b.projectName,'zh-Hant');});
}

/* 所有前端 API 由此統一經過功能權限檢查。 */
const PSS_V192_API_ACCESS = Object.freeze({
  archiveProjectV18:['PROJECT','edit'],archiveProjectV182:['PROJECT','edit'],archiveQuoteProductV191:['QUOTE','edit'],archiveQuoteV191:['QUOTE','edit'],
  auditProjectSheetV182:['PROJECT','edit'],bindDriveFolderV18:['CLOUD','edit'],createAssetChecklistV190:['ADMIN','edit'],createProjectFoldersV17:['PROJECT','edit'],
  createTasksMultiOwnerV17:['DISPATCH','edit'],createTimelineFollowUpV182:['GANTT','edit'],deleteAnnouncementV17:['ADMIN','edit'],deleteDailyReportV183:['REPORT','edit'],
  deleteDocumentV17:['ADMIN','edit'],deleteEventRecordV183:['DASHBOARD','edit'],deleteProjectV182:['PROJECT','edit'],deleteTaskV17:['TASK','edit'],
  deleteTrainingMaterialV17:['TRAINING','edit'],deleteUserV17:['ADMIN','edit'],ensureProjectFoldersV18:['CLOUD','edit'],ensureProjectFoldersV182:['CLOUD','edit'],
  exportCsvV17:['COMMON','view'],getCalendarDayV183:['DASHBOARD','view'],getDailyReportV183:['REPORT','view'],getDashboardV17:['DASHBOARD','view'],
  getEventRecordV183:['DASHBOARD','view'],getHomeCalendarV183:['DASHBOARD','view'],getPeopleV17:['COMMON','view'],getProjectFolderStatusV18:['CLOUD','view'],
  getProjectFolderStatusV182:['CLOUD','view'],getProjectSchemaV18:['PROJECT','view'],getProjectTimelineV182:['GANTT','view'],getQuickFilterDataV171:['COMMON','view'],
  getQuoteCenterV191:['QUOTE','view'],getQuoteV191:['QUOTE','view'],getSystemOverviewV17:['ADMIN','view'],getTaskV17:['TASK','view'],
  healthCheckV17:['ADMIN','view'],importArchitectureConfigV190:['ADMIN','edit'],importQuoteProductsV191:['QUOTE','edit'],listAssetCenterV190:['ADMIN','view'],
  listDailyReportsV17:['REPORT','view'],listDrawingsV17:['CLOUD','view'],listDriveConfigurationsV17:['CLOUD','view'],listDriveFolderV17:['CLOUD','view'],
  listOperationLogsV17:['ADMIN','view'],listProjectCloudItemsV182:['CLOUD','view'],listProjectRowsV18:['PROJECT','view'],listProjectRowsV182:['PROJECT','view'],
  listProjectSelectionV18:['PROJECT','view'],listProjectSelectionV182:['PROJECT','view'],listProjectsV17:['PROJECT','view'],listQuoteHistoryV191:['QUOTE','view'],
  listTaskCardsV17:['TASK','view'],listTrainingTreeV17:['TRAINING','view'],listUnboundDriveFoldersV18:['CLOUD','view'],listUsersV17:['ADMIN','view'],
  repairProjectSheetV182:['PROJECT','edit'],saveAnnouncementV17:['ADMIN','edit'],saveAssetV190:['ADMIN','edit'],saveConfigItemV190:['ADMIN','edit'],
  saveDailyReportBatchV183:['REPORT','edit'],saveDailyReportV17:['REPORT','edit'],saveDeploymentV190:['ADMIN','edit'],saveDocumentV17:['ADMIN','edit'],
  saveMaintenanceV190:['ADMIN','edit'],saveProjectRowV18:['PROJECT','edit'],saveProjectV17:['PROJECT','edit'],saveProjectV182:['PROJECT','edit'],
  saveQuickEventV183:['DASHBOARD','edit'],saveQuoteProductV191:['QUOTE','edit'],saveQuoteV191:['QUOTE','edit'],saveServiceV190:['ADMIN','edit'],
  saveTrainingCategoryV17:['TRAINING','edit'],saveTrainingMaterialV17:['TRAINING','edit'],saveUserV17:['ADMIN','edit'],searchDriveV17:['CLOUD','view'],
  syncCloudIndexV17:['CLOUD','edit'],syncCloudIndexV182:['CLOUD','edit'],syncPeopleToAccountsV171:['ADMIN','edit'],syncProjectDrawingsV182:['CLOUD','edit'],
  syncProjectFolderLinksV182:['CLOUD','edit'],trashProjectFolderV182:['CLOUD','edit'],updateDailyReportV183:['REPORT','edit'],updateEventRecordV183:['DASHBOARD','edit'],
  updateTaskV17:['TASK','edit'],uploadProjectFilesV182:['CLOUD','edit'],getUserPermissionMatrixV192:['ADMIN','view'],saveUserPermissionMatrixV192:['ADMIN','edit'],resetUserPermissionMatrixV192:['ADMIN','edit']
});

function callApiV192(payload) {
  payload=payload||{};const fn=clean_(payload.fn),args=Array.isArray(payload.args)?payload.args:[],rule=PSS_V192_API_ACCESS[fn];
  if(!rule) throw new Error('V19.2 未登錄 API：'+fn);
  if(rule[0]==='COMMON') requireUser_(payload.token); else requireFeatureV192_(payload.token,rule[0],rule[1]);
  switch(fn) {
    case 'archiveProjectV18': return archiveProjectV18.apply(null,args);case 'archiveProjectV182': return archiveProjectV182.apply(null,args);case 'archiveQuoteProductV191': return archiveQuoteProductV191.apply(null,args);case 'archiveQuoteV191': return archiveQuoteV191.apply(null,args);
    case 'auditProjectSheetV182': return auditProjectSheetV182.apply(null,args);case 'bindDriveFolderV18': return bindDriveFolderV18.apply(null,args);case 'createAssetChecklistV190': return createAssetChecklistV190.apply(null,args);case 'createProjectFoldersV17': return createProjectFoldersV17.apply(null,args);
    case 'createTasksMultiOwnerV17': return createTasksMultiOwnerV17.apply(null,args);case 'createTimelineFollowUpV182': return createTimelineFollowUpV182.apply(null,args);case 'deleteAnnouncementV17': return deleteAnnouncementV17.apply(null,args);case 'deleteDailyReportV183': return deleteDailyReportV183.apply(null,args);
    case 'deleteDocumentV17': return deleteDocumentV17.apply(null,args);case 'deleteEventRecordV183': return deleteEventRecordV183.apply(null,args);case 'deleteProjectV182': return deleteProjectV182.apply(null,args);case 'deleteTaskV17': return deleteTaskV17.apply(null,args);
    case 'deleteTrainingMaterialV17': return deleteTrainingMaterialV17.apply(null,args);case 'deleteUserV17': return deleteUserV17.apply(null,args);case 'ensureProjectFoldersV18': return ensureProjectFoldersV18.apply(null,args);case 'ensureProjectFoldersV182': return ensureProjectFoldersV182.apply(null,args);
    case 'exportCsvV17': return exportCsvV17.apply(null,args);case 'getCalendarDayV183': return getCalendarDayV183.apply(null,args);case 'getDailyReportV183': return getDailyReportV183.apply(null,args);case 'getDashboardV17': return getDashboardV17.apply(null,args);
    case 'getEventRecordV183': return getEventRecordV183.apply(null,args);case 'getHomeCalendarV183': return getHomeCalendarV183.apply(null,args);case 'getPeopleV17': return getPeopleV17.apply(null,args);case 'getProjectFolderStatusV18': return getProjectFolderStatusV18.apply(null,args);
    case 'getProjectFolderStatusV182': return getProjectFolderStatusV182.apply(null,args);case 'getProjectSchemaV18': return getProjectSchemaV18.apply(null,args);case 'getProjectTimelineV182': return getProjectTimelineV182.apply(null,args);case 'getQuickFilterDataV171': return getQuickFilterDataV171.apply(null,args);
    case 'getQuoteCenterV191': return getQuoteCenterV191.apply(null,args);case 'getQuoteV191': return getQuoteV191.apply(null,args);case 'getSystemOverviewV17': return getSystemOverviewV17.apply(null,args);case 'getTaskV17': return getTaskV17.apply(null,args);
    case 'healthCheckV17': return healthCheckV17.apply(null,args);case 'importArchitectureConfigV190': return importArchitectureConfigV190.apply(null,args);case 'importQuoteProductsV191': return importQuoteProductsV191.apply(null,args);case 'listAssetCenterV190': return listAssetCenterV190.apply(null,args);
    case 'listDailyReportsV17': return listDailyReportsV17.apply(null,args);case 'listDrawingsV17': return listDrawingsV17.apply(null,args);case 'listDriveConfigurationsV17': return listDriveConfigurationsV17.apply(null,args);case 'listDriveFolderV17': return listDriveFolderV17.apply(null,args);
    case 'listOperationLogsV17': return listOperationLogsV17.apply(null,args);case 'listProjectCloudItemsV182': return listProjectCloudItemsV182.apply(null,args);case 'listProjectRowsV18': return listProjectRowsV18.apply(null,args);case 'listProjectRowsV182': return listProjectRowsV182.apply(null,args);
    case 'listProjectSelectionV18': return listProjectSelectionV18.apply(null,args);case 'listProjectSelectionV182': return listProjectSelectionV182.apply(null,args);case 'listProjectsV17': return listProjectsV17.apply(null,args);case 'listQuoteHistoryV191': return listQuoteHistoryV191.apply(null,args);
    case 'listTaskCardsV17': return listTaskCardsV17.apply(null,args);case 'listTrainingTreeV17': return listTrainingTreeV17.apply(null,args);case 'listUnboundDriveFoldersV18': return listUnboundDriveFoldersV18.apply(null,args);case 'listUsersV17': return listUsersV17.apply(null,args);
    case 'repairProjectSheetV182': return repairProjectSheetV182.apply(null,args);case 'saveAnnouncementV17': return saveAnnouncementV17.apply(null,args);case 'saveAssetV190': return saveAssetV190.apply(null,args);case 'saveConfigItemV190': return saveConfigItemV190.apply(null,args);
    case 'saveDailyReportBatchV183': return saveDailyReportBatchV183.apply(null,args);case 'saveDailyReportV17': return saveDailyReportV17.apply(null,args);case 'saveDeploymentV190': return saveDeploymentV190.apply(null,args);case 'saveDocumentV17': return saveDocumentV17.apply(null,args);
    case 'saveMaintenanceV190': return saveMaintenanceV190.apply(null,args);case 'saveProjectRowV18': return saveProjectRowV18.apply(null,args);case 'saveProjectV17': return saveProjectV17.apply(null,args);case 'saveProjectV182': return saveProjectV182.apply(null,args);
    case 'saveQuickEventV183': return saveQuickEventV183.apply(null,args);case 'saveQuoteProductV191': return saveQuoteProductV191.apply(null,args);case 'saveQuoteV191': return saveQuoteV191.apply(null,args);case 'saveServiceV190': return saveServiceV190.apply(null,args);
    case 'saveTrainingCategoryV17': return saveTrainingCategoryV17.apply(null,args);case 'saveTrainingMaterialV17': return saveTrainingMaterialV17.apply(null,args);case 'saveUserV17': return saveUserV17.apply(null,args);case 'searchDriveV17': return searchDriveV17.apply(null,args);
    case 'syncCloudIndexV17': return syncCloudIndexV17.apply(null,args);case 'syncCloudIndexV182': return syncCloudIndexV182.apply(null,args);case 'syncPeopleToAccountsV171': return syncPeopleToAccountsV171.apply(null,args);case 'syncProjectDrawingsV182': return syncProjectDrawingsV182.apply(null,args);
    case 'syncProjectFolderLinksV182': return syncProjectFolderLinksV182.apply(null,args);case 'trashProjectFolderV182': return trashProjectFolderV182.apply(null,args);case 'updateDailyReportV183': return updateDailyReportV183.apply(null,args);case 'updateEventRecordV183': return updateEventRecordV183.apply(null,args);
    case 'updateTaskV17': return updateTaskV17.apply(null,args);case 'uploadProjectFilesV182': return uploadProjectFilesV182.apply(null,args);case 'getUserPermissionMatrixV192': return getUserPermissionMatrixV192.apply(null,args);case 'saveUserPermissionMatrixV192': return saveUserPermissionMatrixV192.apply(null,args);case 'resetUserPermissionMatrixV192': return resetUserPermissionMatrixV192.apply(null,args);
  }
  throw new Error('找不到 API：'+fn);
}

/* 權限相容版首頁：只統計使用者有權檢視的模組。 */
function getDashboardV17(token) {
  const user=requireFeatureV192_(token,'DASHBOARD','view'),access=accessFor_(user),today=dateOnly_(new Date());
  let tasks=[],reports=[],projects=[],announcements=[];
  if(hasFeatureV192_(user,'TASK','view')) try{tasks=listTaskCardsV17({token:token,keyword:'',hideDone:true,limit:500});}catch(ignore){}
  if(hasFeatureV192_(user,'REPORT','view')) try{reports=listDailyReportsV17({token:token,startDate:today,endDate:today,keyword:'',limit:500});}catch(ignore){}
  if(hasFeatureV192_(user,'PROJECT','view')) try{projects=listProjectsV17(token,'');}catch(ignore){}
  try{announcements=listAnnouncementsV17(token).slice(0,10);}catch(ignore){}
  return{user:user,access:access,stats:{projects:projects.length,openTasks:tasks.length,overdue:tasks.filter(function(t){return t.overdue;}).length,todayReports:reports.length},announcements:announcements,tasks:tasks.slice(0,12),reports:reports.slice(0,20)};
}

function getHomeCalendarV183(payload) {
  payload=payload||{};const user=requireFeatureV192_(payload.token,'DASHBOARD','view'),range=monthRangeV183_(payload.month||dateOnly_(new Date()).substring(0,7)),items=[];
  if(hasFeatureV192_(user,'TASK','view')) try{listTaskCardsV17({token:payload.token,keyword:'',hideDone:false,limit:3000}).forEach(function(t){const d=t.dueDate||t.dispatchDate;if(d&&d>=range.start&&d<=range.end)items.push({kind:'task',date:d,title:t.content||'任務',project:t.project,owner:t.owner,status:t.status,taskId:t.taskId});});}catch(ignore){}
  if(hasFeatureV192_(user,'REPORT','view')) try{listDailyReportsV17({token:payload.token,startDate:range.start,endDate:range.end,keyword:'',limit:3000}).forEach(function(r){items.push({kind:'report',date:r.date,time:[r.startTime,r.endTime].filter(Boolean).join('–'),title:r.eventTitle||r.reportContent||'工作回報',project:r.project,owner:r.person,status:r.status,reportId:r.reportId});});}catch(ignore){}
  try{const ss=getDb_();PSS_V183.EVENT_SHEET_NAMES.forEach(function(name){const sheet=ss.getSheetByName(name);if(!sheet)return;calendarEventsFromSheetV183_(sheet,range,user).forEach(function(e){items.push(e);});});}catch(ignore){}
  return{month:range.month,start:range.start,end:range.end,items:items.sort(function(a,b){return a.date.localeCompare(b.date)||(a.time||'').localeCompare(b.time||'');}),access:accessFor_(user)};
}
function getCalendarDayV183(payload){payload=payload||{};const date=clean_(payload.date)||dateOnly_(new Date()),data=getHomeCalendarV183({token:payload.token,month:date.substring(0,7)});return{date:date,items:data.items.filter(function(item){return item.date===date;})};}

/* 報價中心以 QUOTE 權限決定成本與編輯，不再綁死角色。 */
function getQuoteCenterV191(payload) {
  payload=payload||{};const user=requireFeatureV192_(payload.token,'QUOTE','view'),access=accessFor_(user),projects=[];
  try{Array.prototype.push.apply(projects,quoteProjectSelectionV192_());}catch(ignore){}
  return{version:PSS_V192.VERSION,user:user,access:access,settings:quoteSettingsMapV191_(),products:listQuoteProductsV191({token:payload.token,keyword:payload.keyword||'',category:payload.category||''}),categories:readCanonical_(quoteSheetV191_('QUOTE_CATEGORIES'),{bigCategory:['大分類'],category:['分類名稱'],count:['品項數量'],status:['啟用狀態'],order:['排序']}).filter(function(c){return clean_(c.status)!=='停用';}).map(function(c){return{bigCategory:clean_(c.bigCategory),category:clean_(c.category),count:Number(c.count||0),order:Number(c.order||999)};}).sort(function(a,b){return a.order-b.order;}),quotes:listQuotesV191({token:payload.token,limit:100}),projects:projects};
}

function setupAccountPermissionMatrixV192_() {
  setupPssAiPmoV191();permissionSheetV192_(PSS_V192.USER_SHEET);ensureFeatureDefinitionsV192_();
  const a=seedUserMatrixIfMissingV192_('安仔',['QUOTE']);
  const b=seedUserMatrixIfMissingV192_('陳洪宇',['DASHBOARD','DISPATCH','TASK','REPORT','PROJECT','CLOUD']);
  PropertiesService.getScriptProperties().setProperty('PSS_V192_INSTALLED',new Date().toISOString());rebuildDataDictionaryV17_();
  return['PSS AI-PMO V19.2 帳號功能權限矩陣初始化完成。',a,b,'主管可在「主管管理 → 帳號管理」逐頁勾選檢視／編輯。'].join('\n');
}

function runAccountPermissionMatrixSelfTestV192_(){const lines=['PSS AI-PMO V19.2 Account Permission Matrix Stable 自我檢查'];try{lines.push('✅ 主資料庫：'+getDb_().getName());}catch(e){lines.push('❌ 主資料庫：'+e.message);}try{lines.push('✅ 功能定義：'+ensureFeatureDefinitionsV192_()+' 項');}catch(e){lines.push('❌ 功能定義：'+e.message);}try{lines.push('✅ 個人權限：'+Math.max(0,permissionSheetV192_(PSS_V192.USER_SHEET).getLastRow()-1)+' 筆');}catch(e){lines.push('❌ 個人權限：'+e.message);}try{const a=findUserV192_('安仔'),m=effectivePermissionMapV192_(a);lines.push(m.QUOTE.view&&m.QUOTE.edit&&!m.DASHBOARD.view?'✅ 安仔：僅報價管理':'⚠️ 安仔權限需檢查');}catch(e){lines.push('⚠️ 安仔：'+e.message);}try{const c=findUserV192_('陳洪宇'),m=effectivePermissionMapV192_(c);lines.push(m.DASHBOARD.view&&m.CLOUD.edit&&!m.QUOTE.view?'✅ 陳洪宇：首頁至雲端／圖面':'⚠️ 陳洪宇權限需檢查');}catch(e){lines.push('⚠️ 陳洪宇：'+e.message);}return lines.join('\n');}

/* ========================================================================
 * PSS AI-PMO V19.2 Meeting Fusion Stable
 * - Google Calendar + Google Meet 會議建立
 * - 瀏覽器錄音、即時語音文字、附件、手寫簽名
 * - Meet 原生錄影／逐字稿／出席資料同步
 * - 會議決議一鍵建立派工
 * - 甘特未選專案時顯示縣市總覽；選定專案後顯示圖片與任務資訊
 * ======================================================================== */
const PSS_MEETING_V192 = Object.freeze({
  VERSION:'V19.2 Meeting Fusion Stable',
  MAX_FILE_BYTES:8*1024*1024,
  MAX_BATCH_BYTES:20*1024*1024,
  SHEETS:Object.freeze({
    MEETINGS:'事件會議主檔',
    ATTACHMENTS:'會議附件',
    AUDIO:'會議錄音分段',
    SIGNATURES:'參與者簽名',
    ATTENDANCE:'會議出席紀錄'
  }),
  HEADERS:Object.freeze({
    MEETINGS:['會議ID','場地代號','專案名稱','會議主旨','會議日期','開始時間','結束時間','主持人','主持人Email','參加者Email','參加者姓名','會議地點','會議議程','Google Calendar Event ID','Google Calendar連結','Google Meet網址','Meet會議代碼','Conference Record','錄音狀態','錄音檔連結','逐字稿狀態','逐字稿FileID','逐字稿連結','逐字稿內容','出席同步狀態','會議資料夾ID','會議資料夾連結','會議紀錄','決議事項','問題事項','狀態','建立者','建立時間','更新者','更新時間','備註'],
    ATTACHMENTS:['附件ID','會議ID','場地代號','專案名稱','附件類型','檔名','MIME類型','大小Bytes','Drive File ID','檔案連結','上傳者','上傳時間','備註','資料狀態'],
    AUDIO:['錄音ID','會議ID','分段序號','檔名','MIME類型','大小Bytes','錄音秒數','Drive File ID','錄音連結','轉錄文字','上傳者','上傳時間','狀態','資料狀態'],
    SIGNATURES:['簽名ID','會議ID','場地代號','專案名稱','姓名','單位','職稱','Email','同意錄音錄影','確認會議內容','簽名圖片ID','簽名圖片連結','簽名時間','裝置資訊','備註','資料狀態'],
    ATTENDANCE:['出席ID','會議ID','Conference Record','Participant Resource','顯示名稱','使用者類型','使用者ID','最早加入時間','最後離開時間','來源','同步時間','資料狀態']
  })
});

function meetingSheetV192_(key){
  const name=PSS_MEETING_V192.SHEETS[key]||key, headers=PSS_MEETING_V192.HEADERS[key];
  if(!headers) throw new Error('未知會議資料表：'+key);
  const sheet=getOrCreateSheet_([name],headers);ensureHeaders_(sheet,headers);sheet.setFrozenRows(1);return sheet;
}
/* R4.3 cleanup: removed shadowed legacy function setupMeetingSheetsV192_. */
function timeOnlyV192_(value){
  if(value instanceof Date&&!isNaN(value.getTime()))return Utilities.formatDate(value,String(APP.TZ||'Asia/Taipei'),'HH:mm');
  const text=clean_(value),m=text.match(/(?:上午|下午)?\s*(\d{1,2}):(\d{2})/);
  if(!m)return text&&/^\d{1,2}:\d{2}$/.test(text)?text:'';
  let h=Number(m[1]),minute=m[2];if(text.indexOf('下午')>=0&&h<12)h+=12;if(text.indexOf('上午')>=0&&h===12)h=0;return String(h).padStart(2,'0')+':'+minute;
}
function meetingDefinitionsV192_(){return{
  id:['會議ID','事件ID'],siteCode:['場地代號'],projectName:['專案名稱'],title:['會議主旨','事件標題','標題'],date:['會議日期','日期'],startTime:['開始時間'],endTime:['結束時間'],host:['主持人'],hostEmail:['主持人Email'],attendeeEmails:['參加者Email'],attendeeNames:['參加者姓名'],location:['會議地點','地點'],agenda:['會議議程','議程'],calendarId:['Google Calendar Event ID'],calendarUrl:['Google Calendar連結'],meetUrl:['Google Meet網址','Meet網址'],meetingCode:['Meet會議代碼'],conferenceRecord:['Conference Record'],recordingStatus:['錄音狀態'],recordingUrl:['錄音檔連結','錄音檔URL'],transcriptStatus:['逐字稿狀態'],transcriptFileId:['逐字稿FileID'],transcriptUrl:['逐字稿連結','逐字稿URL'],transcript:['逐字稿內容'],attendanceStatus:['出席同步狀態'],folderId:['會議資料夾ID'],folderUrl:['會議資料夾連結','專案追蹤資料夾URL','簽名檔資料夾URL'],minutes:['會議紀錄','摘要'],decisions:['決議事項'],issues:['問題事項'],status:['狀態'],creator:['建立者'],createdAt:['建立時間'],updatedBy:['更新者'],updatedAt:['更新時間','最後更新時間'],note:['備註']
};}
function meetingRowV192_(row){return{
  rowNumber:row.__rowNumber,id:clean_(row.id),siteCode:clean_(row.siteCode),projectName:clean_(row.projectName),title:clean_(row.title),date:dateOnly_(row.date||row.startTime),startTime:timeOnlyV192_(row.startTime),endTime:timeOnlyV192_(row.endTime),host:clean_(row.host),hostEmail:clean_(row.hostEmail),attendeeEmails:clean_(row.attendeeEmails),attendeeNames:clean_(row.attendeeNames),location:clean_(row.location),agenda:clean_(row.agenda),calendarId:clean_(row.calendarId),calendarUrl:clean_(row.calendarUrl),meetUrl:clean_(row.meetUrl),meetingCode:clean_(row.meetingCode),conferenceRecord:clean_(row.conferenceRecord),recordingStatus:clean_(row.recordingStatus),recordingUrl:clean_(row.recordingUrl),transcriptStatus:clean_(row.transcriptStatus),transcriptFileId:clean_(row.transcriptFileId),transcriptUrl:clean_(row.transcriptUrl),transcript:clean_(row.transcript),attendanceStatus:clean_(row.attendanceStatus),folderId:clean_(row.folderId),folderUrl:clean_(row.folderUrl),minutes:clean_(row.minutes),decisions:clean_(row.decisions),issues:clean_(row.issues),status:clean_(row.status),creator:clean_(row.creator),createdAt:dateTime_(row.createdAt),updatedBy:clean_(row.updatedBy),updatedAt:dateTime_(row.updatedAt),note:clean_(row.note)
};}
function meetingRowsV192_(){return readCanonical_(meetingSheetV192_('MEETINGS'),meetingDefinitionsV192_()).map(meetingRowV192_);}
function findMeetingV192_(meetingId){const id=clean_(meetingId),m=meetingRowsV192_().find(function(x){return x.id===id;});if(!m)throw new Error('找不到會議：'+id);return m;}
function canReadMeetingV192_(user,m){if(isManager_(user))return true;const hay=[m.host,m.hostEmail,m.attendeeEmails,m.attendeeNames,m.creator].join(' ').toLowerCase();return hay.indexOf(clean_(user.name).toLowerCase())>=0||hay.indexOf(clean_(user.email).toLowerCase())>=0;}
function splitEmailsV192_(value){return unique_(String(value||'').split(/[,，、;；\n\s]+/).map(clean_).filter(function(x){return x.indexOf('@')>0;}));}
function meetCodeV192_(url){const m=clean_(url).match(/meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3})/i);return m?m[1].toLowerCase():'';}
function driveIdV192_(url){const m=clean_(url).match(/[-\w]{20,}/);return m?m[0]:'';}
function taipeiRfc3339V192_(date,time){return clean_(date)+'T'+(clean_(time)||'09:00')+':00+08:00';}
function fetchGoogleJsonV192_(url,options){options=options||{};options.muteHttpExceptions=true;options.headers=Object.assign({},options.headers||{},{Authorization:'Bearer '+ScriptApp.getOAuthToken(),Accept:'application/json'});const response=UrlFetchApp.fetch(url,options),code=response.getResponseCode(),text=response.getContentText();if(code<200||code>=300)throw new Error('Google API '+code+'：'+text.substring(0,500));return text?JSON.parse(text):{};}
function calendarMeetEventV192_(data,existingEventId){
  const attendees=splitEmailsV192_(data.attendeeEmails).map(function(email){return{email:email};});
  const body={summary:'[PSS] '+data.projectName+'｜'+data.title,description:['PSS AI-PMO 會議ID：'+data.id,'專案：'+data.siteCode+'｜'+data.projectName,'主持人：'+data.host,'議程：\n'+data.agenda].join('\n'),location:data.location||'',start:{dateTime:taipeiRfc3339V192_(data.date,data.startTime),timeZone:'Asia/Taipei'},end:{dateTime:taipeiRfc3339V192_(data.date,data.endTime),timeZone:'Asia/Taipei'},attendees:attendees};
  try{
    let url='https://www.googleapis.com/calendar/v3/calendars/primary/events',method='post';
    if(existingEventId){url+='/'+encodeURIComponent(existingEventId);method='patch';}
    else body.conferenceData={createRequest:{requestId:'PSS-'+data.id+'-'+new Date().getTime(),conferenceSolutionKey:{type:'hangoutsMeet'}}};
    url+='?conferenceDataVersion=1&sendUpdates=all';
    const event=fetchGoogleJsonV192_(url,{method:method,contentType:'application/json',payload:JSON.stringify(body)}),entry=(event.conferenceData&&event.conferenceData.entryPoints||[]).find(function(x){return x.entryPointType==='video';});
    return{id:event.id||'',url:event.htmlLink||'',meetUrl:(entry&&entry.uri)||event.hangoutLink||'',warning:''};
  }catch(error){
    try{const ev=CalendarApp.getDefaultCalendar().createEvent(body.summary,new Date(taipeiRfc3339V192_(data.date,data.startTime)),new Date(taipeiRfc3339V192_(data.date,data.endTime)),{description:body.description,location:body.location,guests:splitEmailsV192_(data.attendeeEmails).join(','),sendInvites:true});return{id:ev.getId(),url:'https://calendar.google.com/calendar/u/0/r/search?q='+encodeURIComponent(data.id),meetUrl:clean_(data.meetUrl),warning:'Calendar 已建立，但 Google Meet 自動建立失敗：'+error.message};}catch(second){return{id:'',url:'',meetUrl:clean_(data.meetUrl),warning:'Calendar／Meet 建立失敗：'+second.message};}
  }
}
function childFolderV192_(parent,name){const it=parent.getFoldersByName(name);return it.hasNext()?it.next():parent.createFolder(name);}
function findProjectFolderForMeetingV192_(siteCode,projectName){
  const root=DriveApp.getFolderById(APP.CLOUD_ROOT_ID),code=clean_(siteCode).toLowerCase(),name=normalizeProjectNameV18_(projectName),folders=root.getFolders();let scanned=0;
  while(folders.hasNext()&&scanned++<2000){const f=folders.next(),parsed=parseProjectFolderNameV17_(f.getName()),fc=clean_(parsed.siteCode).toLowerCase(),fn=normalizeProjectNameV18_(parsed.projectName||f.getName());if((code&&fc===code)||(name&&fn===name))return f;}
  return childFolderV192_(root,'_PSS_AI_PMO_會議資料');
}
function meetingFolderV192_(meeting){
  if(meeting.folderId)try{return DriveApp.getFolderById(meeting.folderId);}catch(ignore){}
  const projectFolder=findProjectFolderForMeetingV192_(meeting.siteCode,meeting.projectName),track=childFolderV192_(projectFolder,'03_專案追蹤記錄'),meetings=childFolderV192_(track,'會議紀錄'),folder=childFolderV192_(meetings,safeFileName_((meeting.date||dateOnly_(new Date())).replace(/-/g,'')+'_'+meeting.title+'_'+meeting.id));return folder;
}
function listMeetingsV192(payload){payload=payload||{};const user=requireFeatureV192_(payload.token,'MEETING','view'),q=clean_(payload.keyword).toLowerCase(),start=clean_(payload.startDate),end=clean_(payload.endDate),includeArchived=payload.includeArchived===true;return meetingRowsV192_().filter(function(m){if(!includeArchived&&['封存','已刪除（可復原）'].indexOf(m.status)>=0)return false;if(!canReadMeetingV192_(user,m))return false;if(start&&m.date<start)return false;if(end&&m.date>end)return false;return !q||Object.keys(m).map(function(k){return typeof m[k]==='object'?'':m[k];}).join(' ').toLowerCase().indexOf(q)>=0;}).sort(function(a,b){return(b.date+' '+b.startTime).localeCompare(a.date+' '+a.startTime);}).slice(0,Math.min(Number(payload.limit||500),2000));}
function meetingProjectOptionsV192_(){return quoteProjectSelectionV192_();}
function getMeetingCenterV192(payload){payload=payload||{};const user=requireFeatureV192_(payload.token,'MEETING','view');return{version:PSS_MEETING_V192.VERSION,user:user,access:accessFor_(user),meetings:listMeetingsV192(payload),projects:meetingProjectOptionsV192_()};}
function readMeetingChildrenV192_(key,meetingId,defs){return readCanonical_(meetingSheetV192_(key),defs).filter(function(r){return clean_(r.meetingId)===clean_(meetingId);});}
function getMeetingV192(payload){payload=payload||{};const user=requireFeatureV192_(payload.token,'MEETING','view'),m=findMeetingV192_(payload.meetingId);if(!canReadMeetingV192_(user,m))throw new Error('沒有此會議的檢視權限。');
  const attachments=readMeetingChildrenV192_('ATTACHMENTS',m.id,{id:['附件ID'],meetingId:['會議ID'],type:['附件類型'],name:['檔名'],mime:['MIME類型'],size:['大小Bytes'],fileId:['Drive File ID'],url:['檔案連結'],uploader:['上傳者'],uploadedAt:['上傳時間'],note:['備註']}).map(function(x){return{id:clean_(x.id),type:clean_(x.type),name:clean_(x.name),mime:clean_(x.mime),size:Number(x.size||0),fileId:clean_(x.fileId),url:clean_(x.url),uploader:clean_(x.uploader),uploadedAt:dateTime_(x.uploadedAt),note:clean_(x.note)};});
  const audio=readMeetingChildrenV192_('AUDIO',m.id,{id:['錄音ID'],meetingId:['會議ID'],part:['分段序號'],name:['檔名'],mime:['MIME類型'],size:['大小Bytes'],duration:['錄音秒數'],fileId:['Drive File ID'],url:['錄音連結'],transcript:['轉錄文字'],uploader:['上傳者'],uploadedAt:['上傳時間'],status:['狀態']}).map(function(x){return{id:clean_(x.id),part:Number(x.part||0),name:clean_(x.name),mime:clean_(x.mime),size:Number(x.size||0),duration:Number(x.duration||0),fileId:clean_(x.fileId),url:clean_(x.url),transcript:clean_(x.transcript),uploader:clean_(x.uploader),uploadedAt:dateTime_(x.uploadedAt),status:clean_(x.status)};});
  const signatures=readMeetingChildrenV192_('SIGNATURES',m.id,{id:['簽名ID'],meetingId:['會議ID'],name:['姓名'],unit:['單位'],title:['職稱'],email:['Email'],consent:['同意錄音錄影'],confirmed:['確認會議內容'],imageId:['簽名圖片ID'],url:['簽名圖片連結'],signedAt:['簽名時間'],device:['裝置資訊'],note:['備註']}).map(function(x){return{id:clean_(x.id),name:clean_(x.name),unit:clean_(x.unit),title:clean_(x.title),email:clean_(x.email),consent:clean_(x.consent),confirmed:clean_(x.confirmed),imageId:clean_(x.imageId),url:clean_(x.url),signedAt:dateTime_(x.signedAt),device:clean_(x.device),note:clean_(x.note)};});
  const attendance=readMeetingChildrenV192_('ATTENDANCE',m.id,{id:['出席ID'],meetingId:['會議ID'],conference:['Conference Record'],resource:['Participant Resource'],displayName:['顯示名稱'],userType:['使用者類型'],userId:['使用者ID'],start:['最早加入時間'],end:['最後離開時間'],source:['來源'],syncedAt:['同步時間']}).map(function(x){return{id:clean_(x.id),displayName:clean_(x.displayName),userType:clean_(x.userType),userId:clean_(x.userId),start:dateTime_(x.start),end:dateTime_(x.end),source:clean_(x.source)};});
  const tasks=readCanonical_(getSheet_('TASKS'),Object.assign({},taskDefinitions_(),{sourceMeeting:['來源會議ID'],sourceType:['來源類型']})).filter(function(t){return clean_(t.sourceMeeting)===m.id||clean_(t.note).indexOf(m.id)>=0;}).map(function(t){return{taskId:clean_(t.taskId),content:clean_(t.content),owner:clean_(t.owner),priority:clean_(t.priority),dueDate:dateOnly_(t.dueDate),status:clean_(t.status),note:clean_(t.note)};});
  return{meeting:m,attachments:attachments,audio:audio,signatures:signatures,attendance:attendance,tasks:tasks,canEdit:hasFeatureV192_(user,'MEETING','edit')};
}
function saveMeetingV192(payload){payload=payload||{};const user=requireFeatureV192_(payload.token,'MEETING','edit'),sheet=meetingSheetV192_('MEETINGS'),rows=meetingRowsV192_(),id=clean_(payload.meetingId)||makeId_('MTG'),target=rows.find(function(x){return x.id===id;});
  const title=clean_(payload.title),date=clean_(payload.date),startTime=clean_(payload.startTime),endTime=clean_(payload.endTime);if(!title||!date||!startTime||!endTime)throw new Error('會議主旨、日期、開始及結束時間必填。');
  const base={id:id,siteCode:clean_(payload.siteCode),projectName:clean_(payload.projectName),title:title,date:date,startTime:startTime,endTime:endTime,host:clean_(payload.host)||user.name,hostEmail:clean_(payload.hostEmail)||user.email,attendeeEmails:clean_(payload.attendeeEmails),attendeeNames:clean_(payload.attendeeNames),location:clean_(payload.location),agenda:clean_(payload.agenda),meetUrl:clean_(payload.meetUrl),folderId:target?target.folderId:'',folderUrl:target?target.folderUrl:''};
  const folder=meetingFolderV192_(base);base.folderId=folder.getId();base.folderUrl=folder.getUrl();const calendar=payload.createCalendar===false?{id:target?target.calendarId:'',url:target?target.calendarUrl:'',meetUrl:base.meetUrl,warning:''}:calendarMeetEventV192_(base,target?target.calendarId:'');
  const object={'會議ID':id,'場地代號':base.siteCode,'專案名稱':base.projectName,'會議主旨':title,'會議日期':date,'開始時間':startTime,'結束時間':endTime,'主持人':base.host,'主持人Email':base.hostEmail,'參加者Email':base.attendeeEmails,'參加者姓名':base.attendeeNames,'會議地點':base.location,'會議議程':base.agenda,'Google Calendar Event ID':calendar.id,'Google Calendar連結':calendar.url,'Google Meet網址':calendar.meetUrl||base.meetUrl,'Meet會議代碼':meetCodeV192_(calendar.meetUrl||base.meetUrl),'錄音狀態':target?target.recordingStatus:'尚未錄音','逐字稿狀態':target?target.transcriptStatus:'尚未建立','出席同步狀態':target?target.attendanceStatus:'尚未同步','會議資料夾ID':base.folderId,'會議資料夾連結':base.folderUrl,'會議紀錄':clean_(payload.minutes)||(target?target.minutes:''),'決議事項':clean_(payload.decisions)||(target?target.decisions:''),'問題事項':clean_(payload.issues)||(target?target.issues:''),'狀態':clean_(payload.status)||'已排程','建立者':target?target.creator:user.name,'建立時間':target?target.createdAt:new Date(),'更新者':user.name,'更新時間':new Date(),'備註':clean_(payload.note)};
  if(target)writeObject_(sheet,target.rowNumber,object);else appendObject_(sheet,object);operationLog_(user,target?'更新會議':'建立會議','會議管理',id,object,'成功');return{message:(target?'會議已更新。':'會議已建立。')+(calendar.warning?'\n'+calendar.warning:''),meetingId:id,meetUrl:calendar.meetUrl||base.meetUrl,calendarUrl:calendar.url,folderUrl:base.folderUrl,warning:calendar.warning};
}
function markMeetingChildRowsV20_(key,meetingId,status){
  const sheet=meetingSheetV192_(key),values=sheet.getDataRange().getValues();
  if(values.length<2)return 0;
  const headers=values[0].map(clean_),meetingCol=headers.indexOf('會議ID'),statusCol=headers.indexOf('資料狀態');
  if(meetingCol<0||statusCol<0)return 0;
  let changed=0;
  for(let i=1;i<values.length;i++){
    if(clean_(values[i][meetingCol])!==clean_(meetingId))continue;
    sheet.getRange(i+1,statusCol+1).setValue(status);
    changed++;
  }
  return changed;
}
function markMeetingTasksV20_(meetingId,status){
  const sheet=getSheet_('TASKS');
  ensureHeaders_(sheet,['來源類型','來源會議ID','來源紀錄ID','來源會議狀態']);
  const values=sheet.getDataRange().getValues();
  if(values.length<2)return 0;
  const headers=values[0].map(clean_),meetingCol=headers.indexOf('來源會議ID'),statusCol=headers.indexOf('來源會議狀態');
  if(meetingCol<0||statusCol<0)return 0;
  let changed=0;
  for(let i=1;i<values.length;i++){
    if(clean_(values[i][meetingCol])!==clean_(meetingId))continue;
    sheet.getRange(i+1,statusCol+1).setValue(status);
    changed++;
  }
  return changed;
}
function deleteMeetingV192(payload){
  payload=payload||{};
  const user=requireFeatureV192_(payload.token,'MEETING','edit'),m=findMeetingV192_(payload.meetingId);
  writeObject_(meetingSheetV192_('MEETINGS'),m.rowNumber,{'狀態':'已刪除（可復原）','更新者':user.name,'更新時間':new Date(),'備註':[m.note,'刪除／封存：'+dateTime_(new Date())+'｜'+user.name].filter(Boolean).join('\n')});
  const marked={
    attachments:markMeetingChildRowsV20_('ATTACHMENTS',m.id,'所屬會議已刪除'),
    audio:markMeetingChildRowsV20_('AUDIO',m.id,'所屬會議已刪除'),
    signatures:markMeetingChildRowsV20_('SIGNATURES',m.id,'所屬會議已刪除'),
    attendance:markMeetingChildRowsV20_('ATTENDANCE',m.id,'所屬會議已刪除'),
    tasks:markMeetingTasksV20_(m.id,'來源會議已刪除')
  };
  operationLog_(user,'刪除／封存一般會議','會議管理',m.id,marked,'成功');
  return'一般會議已從清單移除；主檔與關聯資料已標記，可由主管在試算表復原。附件 '+marked.attachments+'、錄音 '+marked.audio+'、簽名 '+marked.signatures+'、出席 '+marked.attendance+'、派工來源 '+marked.tasks+' 筆。';
}
function decodeDataUrlV192_(data){const raw=String(data||''),comma=raw.indexOf(',');return Utilities.base64Decode(comma>=0?raw.substring(comma+1):raw);}
function saveMeetingFileV192_(meeting,fileName,mimeType,data){const bytes=decodeDataUrlV192_(data);if(bytes.length>PSS_MEETING_V192.MAX_FILE_BYTES)throw new Error('單一檔案不可超過 8MB。');const folder=meetingFolderV192_(meeting),blob=Utilities.newBlob(bytes,mimeType||'application/octet-stream',safeFileName_(fileName||('file_'+new Date().getTime()))),file=folder.createFile(blob);return{file:file,bytes:bytes.length};}
function appendMeetingAttachmentV192_(meeting,user,type,fileResult,note){const file=fileResult.file,id=makeId_('MA');appendObject_(meetingSheetV192_('ATTACHMENTS'),{'附件ID':id,'會議ID':meeting.id,'場地代號':meeting.siteCode,'專案名稱':meeting.projectName,'附件類型':type,'檔名':file.getName(),'MIME類型':file.getMimeType(),'大小Bytes':fileResult.bytes,'Drive File ID':file.getId(),'檔案連結':file.getUrl(),'上傳者':user.name,'上傳時間':new Date(),'備註':clean_(note)});return{id:id,name:file.getName(),url:file.getUrl(),fileId:file.getId()};}
function uploadMeetingAudioV192(payload){payload=payload||{};const user=requireFeatureV192_(payload.token,'MEETING','edit'),m=findMeetingV192_(payload.meetingId),saved=saveMeetingFileV192_(m,payload.fileName||('meeting_'+m.id+'.webm'),payload.mimeType||'audio/webm',payload.data),audioId=makeId_('AUD'),part=meetingSheetV192_('AUDIO').getLastRow();appendObject_(meetingSheetV192_('AUDIO'),{'錄音ID':audioId,'會議ID':m.id,'分段序號':part,'檔名':saved.file.getName(),'MIME類型':saved.file.getMimeType(),'大小Bytes':saved.bytes,'錄音秒數':Number(payload.durationSeconds||0),'Drive File ID':saved.file.getId(),'錄音連結':saved.file.getUrl(),'轉錄文字':clean_(payload.transcript),'上傳者':user.name,'上傳時間':new Date(),'狀態':'已上傳'});appendMeetingAttachmentV192_(m,user,'瀏覽器錄音',saved,'會議室錄音');writeObject_(meetingSheetV192_('MEETINGS'),m.rowNumber,{'錄音狀態':'已上傳','錄音檔連結':[m.recordingUrl,saved.file.getUrl()].filter(Boolean).join('\n'),'更新者':user.name,'更新時間':new Date()});return{message:'錄音已存入會議資料夾。',audioId:audioId,url:saved.file.getUrl(),size:saved.bytes};}
function saveMeetingAttachmentsV192(payload){payload=payload||{};const user=requireFeatureV192_(payload.token,'MEETING','edit'),m=findMeetingV192_(payload.meetingId),files=Array.isArray(payload.files)?payload.files:[];let total=0;files.forEach(function(f){total+=Math.floor(String(f.data||'').length*0.75);});if(total>PSS_MEETING_V192.MAX_BATCH_BYTES)throw new Error('單次附件總量不可超過 20MB。');const results=files.map(function(f){return appendMeetingAttachmentV192_(m,user,clean_(f.type)||'會議附件',saveMeetingFileV192_(m,f.name,f.mimeType,f.data),f.note);});operationLog_(user,'上傳會議附件','會議管理',m.id,{count:results.length},'成功');return{message:'已上傳 '+results.length+' 個附件。',files:results};}
function saveMeetingTranscriptV192(payload){payload=payload||{};const user=requireFeatureV192_(payload.token,'MEETING','edit'),m=findMeetingV192_(payload.meetingId),text=clean_(payload.transcript);if(!text)throw new Error('逐字稿不可空白。');const folder=meetingFolderV192_(m),fileName=safeFileName_((m.date||dateOnly_(new Date()))+'_'+m.title+'_逐字稿.txt');let file;if(m.transcriptFileId)try{file=DriveApp.getFileById(m.transcriptFileId);file.setContent(text);}catch(ignore){}if(!file)file=folder.createFile(fileName,text,MimeType.PLAIN_TEXT);writeObject_(meetingSheetV192_('MEETINGS'),m.rowNumber,{'逐字稿狀態':'已建立','逐字稿FileID':file.getId(),'逐字稿連結':file.getUrl(),'逐字稿內容':text,'會議紀錄':clean_(payload.minutes)||m.minutes,'決議事項':clean_(payload.decisions)||m.decisions,'問題事項':clean_(payload.issues)||m.issues,'更新者':user.name,'更新時間':new Date()});if(!readCanonical_(meetingSheetV192_('ATTACHMENTS'),{meetingId:['會議ID'],fileId:['Drive File ID']}).some(function(x){return clean_(x.meetingId)===m.id&&clean_(x.fileId)===file.getId();}))appendObject_(meetingSheetV192_('ATTACHMENTS'),{'附件ID':makeId_('MA'),'會議ID':m.id,'場地代號':m.siteCode,'專案名稱':m.projectName,'附件類型':'逐字稿','檔名':file.getName(),'MIME類型':'text/plain','大小Bytes':text.length,'Drive File ID':file.getId(),'檔案連結':file.getUrl(),'上傳者':user.name,'上傳時間':new Date(),'備註':'平台逐字稿'});return{message:'逐字稿與會議紀錄已儲存。',url:file.getUrl()};}
function saveMeetingSignatureV192(payload){payload=payload||{};const user=requireFeatureV192_(payload.token,'MEETING','view'),m=findMeetingV192_(payload.meetingId);if(!canReadMeetingV192_(user,m)&&!isManager_(user))throw new Error('沒有此會議的簽名權限。');if(payload.consent!==true||payload.confirmed!==true)throw new Error('簽名前必須勾選錄音錄影同意及會議內容確認。');const name=clean_(payload.name)||user.name;if(!name)throw new Error('簽名姓名必填。');const saved=saveMeetingFileV192_(m,'簽名_'+safeFileName_(name)+'_'+new Date().getTime()+'.png','image/png',payload.data),id=makeId_('SIG');appendObject_(meetingSheetV192_('SIGNATURES'),{'簽名ID':id,'會議ID':m.id,'場地代號':m.siteCode,'專案名稱':m.projectName,'姓名':name,'單位':clean_(payload.unit),'職稱':clean_(payload.title),'Email':clean_(payload.email)||user.email,'同意錄音錄影':'是','確認會議內容':'是','簽名圖片ID':saved.file.getId(),'簽名圖片連結':saved.file.getUrl(),'簽名時間':new Date(),'裝置資訊':clean_(payload.device),'備註':clean_(payload.note)});appendMeetingAttachmentV192_(m,user,'參加者簽名',saved,name);return{message:'簽名已存檔。',signatureId:id,url:saved.file.getUrl()};}
function createMeetingTasksV192(payload){payload=payload||{};const user=requireFeatureV192_(payload.token,'MEETING','edit');requireFeatureV192_(payload.token,'DISPATCH','edit');const m=findMeetingV192_(payload.meetingId),items=Array.isArray(payload.items)?payload.items:[];if(!items.length)throw new Error('至少需要一筆派工事項。');const created=[];items.forEach(function(item,index){const r=createTasksMultiOwnerV17({token:payload.token,siteCode:m.siteCode,projectName:m.projectName,taskType:'會議決議派工',content:clean_(item.content),owners:item.owners||[],priority:clean_(item.priority)||'一般',dueDate:clean_(item.dueDate),note:'來源會議：'+m.id+'｜'+m.title+'\n'+clean_(item.note),createCalendar:item.createCalendar===true});(r.tasks||[]).forEach(function(t){created.push(t);});});const sheet=getSheet_('TASKS'),rows=readCanonical_(sheet,taskDefinitions_());created.forEach(function(t){const row=rows.find(function(x){return clean_(x.taskId)===clean_(t.taskId);});if(row)writeObject_(sheet,row.__rowNumber,{'來源類型':'會議決議','來源會議ID':m.id,'來源紀錄ID':m.id,'更新時間':new Date()});});operationLog_(user,'會議決議建立派工','會議管理',m.id,{tasks:created},'成功');return{message:'已建立 '+created.length+' 筆派工。',tasks:created};}
function upsertNativeArtifactV192_(m,user,type,name,url,fileId,note){if(!url)return;const rows=readCanonical_(meetingSheetV192_('ATTACHMENTS'),{meetingId:['會議ID'],url:['檔案連結'],type:['附件類型']});if(rows.some(function(x){return clean_(x.meetingId)===m.id&&clean_(x.url)===url;}))return;appendObject_(meetingSheetV192_('ATTACHMENTS'),{'附件ID':makeId_('MA'),'會議ID':m.id,'場地代號':m.siteCode,'專案名稱':m.projectName,'附件類型':type,'檔名':name,'MIME類型':'','大小Bytes':'','Drive File ID':fileId||driveIdV192_(url),'檔案連結':url,'上傳者':user.name,'上傳時間':new Date(),'備註':note||'Google Meet 原生產物'});}
function syncMeetArtifactsV192(payload){payload=payload||{};const user=requireFeatureV192_(payload.token,'MEETING','edit'),m=findMeetingV192_(payload.meetingId),code=m.meetingCode||meetCodeV192_(m.meetUrl);if(!code)throw new Error('此會議沒有可辨識的 Google Meet 代碼。');const filter='space.meeting_code = "'+code+'"',list=fetchGoogleJsonV192_('https://meet.googleapis.com/v2/conferenceRecords?pageSize=10&filter='+encodeURIComponent(filter),{method:'get'}),records=list.conferenceRecords||[];if(!records.length)throw new Error('尚未找到 Meet 會議紀錄。會議結束後可能需要等待產物生成。');const record=records[0],parent=record.name,recordings=fetchGoogleJsonV192_('https://meet.googleapis.com/v2/'+parent+'/recordings?pageSize=100',{method:'get'}).recordings||[],transcripts=fetchGoogleJsonV192_('https://meet.googleapis.com/v2/'+parent+'/transcripts?pageSize=100',{method:'get'}).transcripts||[],participants=fetchGoogleJsonV192_('https://meet.googleapis.com/v2/'+parent+'/participants?pageSize=250',{method:'get'}).participants||[];
  const recordingUrls=recordings.map(function(r){return r.driveDestination&&r.driveDestination.exportUri;}).filter(Boolean),transcriptUrls=transcripts.map(function(t){return t.docsDestination&&t.docsDestination.exportUri;}).filter(Boolean);recordings.forEach(function(r,i){upsertNativeArtifactV192_(m,user,'Meet原生錄影','Meet錄影 '+(i+1),r.driveDestination&&r.driveDestination.exportUri,r.driveDestination&&r.driveDestination.file,r.name);});transcripts.forEach(function(t,i){upsertNativeArtifactV192_(m,user,'Meet原生逐字稿','Meet逐字稿 '+(i+1),t.docsDestination&&t.docsDestination.exportUri,'',t.name);});
  const attendanceSheet=meetingSheetV192_('ATTENDANCE'),old=readCanonical_(attendanceSheet,{meetingId:['會議ID']}).filter(function(x){return clean_(x.meetingId)===m.id;}).sort(function(a,b){return b.__rowNumber-a.__rowNumber;});old.forEach(function(x){attendanceSheet.deleteRow(x.__rowNumber);});participants.forEach(function(p){const identity=p.signedinUser?'已登入帳號':(p.anonymousUser?'匿名':'電話'),info=p.signedinUser||p.anonymousUser||p.phoneUser||{};appendObject_(attendanceSheet,{'出席ID':makeId_('ATT'),'會議ID':m.id,'Conference Record':parent,'Participant Resource':p.name,'顯示名稱':info.displayName||'未識別參加者','使用者類型':identity,'使用者ID':info.user||'','最早加入時間':p.earliestStartTime||'','最後離開時間':p.latestEndTime||'','來源':'Google Meet API','同步時間':new Date()});});
  writeObject_(meetingSheetV192_('MEETINGS'),m.rowNumber,{'Conference Record':parent,'錄音狀態':recordingUrls.length?'Meet錄影已同步':m.recordingStatus,'錄音檔連結':unique_([m.recordingUrl].concat(recordingUrls).filter(Boolean)).join('\n'),'逐字稿狀態':transcriptUrls.length?'Meet逐字稿已同步':m.transcriptStatus,'逐字稿連結':unique_([m.transcriptUrl].concat(transcriptUrls).filter(Boolean)).join('\n'),'出席同步狀態':'已同步 '+participants.length+' 人','更新者':user.name,'更新時間':new Date()});return{message:'Meet 產物同步完成。',conferenceRecord:parent,recordings:recordingUrls.length,transcripts:transcriptUrls.length,participants:participants.length};
}

function inferTaiwanCityV192_(text){const value=clean_(text).replace(/臺/g,'台'),cities=['台北市','新北市','桃園市','台中市','台南市','高雄市','基隆市','新竹市','嘉義市','新竹縣','苗栗縣','彰化縣','南投縣','雲林縣','嘉義縣','屏東縣','宜蘭縣','花蓮縣','台東縣','澎湖縣','金門縣','連江縣'];for(let i=0;i<cities.length;i++)if(value.indexOf(cities[i])>=0)return cities[i];return'未分類';}
function mediaDefinitionsV192_(){return{siteCode:['場地代號'],projectName:['專案名稱'],name:['檔名','照片名稱','名稱','文件名稱','圖面名稱'],url:['照片連結','檔案連結','連結','網址','路徑','Drive連結'],mime:['MIME類型','MimeType','檔案類型'],type:['附件類型','類型','分類'],date:['日期','拍攝日期','建立時間','更新時間'],note:['說明','備註','照片說明']};}
function readProjectMediaV192_(){const results=[],ss=getDb_(),names=['照片紀錄','事件附件','圖面管理','雲端索引','會議附件'];names.forEach(function(sheetName){const sh=ss.getSheetByName(sheetName);if(!sh)return;readCanonical_(sh,mediaDefinitionsV192_()).forEach(function(x){const url=clean_(x.url),name=clean_(x.name),mime=clean_(x.mime),type=clean_(x.type);if(!url)return;const image=/\.(png|jpe?g|gif|webp|bmp)(\?|$)/i.test(name+' '+url)||mime.indexOf('image/')===0||sheetName==='照片紀錄'||type.indexOf('照片')>=0;results.push({siteCode:clean_(x.siteCode),projectName:clean_(x.projectName),name:name||sheetName,url:url,thumbnailUrl:image?(driveIdV192_(url)?'https://drive.google.com/thumbnail?id='+driveIdV192_(url)+'&sz=w600':url):'',image:image,type:type||sheetName,date:dateOnly_(x.date),note:clean_(x.note),source:sheetName});});});return results;}
function projectTaskRowsV192_(){return readCanonical_(getSheet_('TASKS'),taskDefinitions_()).map(function(t){const status=clean_(t.status),due=dateOnly_(t.dueDate),done=['已完成','完成','結案'].indexOf(status)>=0;return{taskId:clean_(t.taskId),siteCode:clean_(t.siteCode),projectName:clean_(t.projectName),taskType:clean_(t.taskType),content:clean_(t.content),owner:clean_(t.owner),manager:clean_(t.manager),priority:clean_(t.priority),dispatchDate:dateOnly_(t.dispatchDate),dueDate:due,status:status||'未開始',done:done,overdue:!!(due&&!done&&due<dateOnly_(new Date())),attachment:clean_(t.attachment),note:clean_(t.note),updatedAt:dateTime_(t.updatedAt)};});}
function sameProjectV192_(aCode,aName,bCode,bName){if(clean_(aCode)&&clean_(bCode)&&clean_(aCode).toLowerCase()===clean_(bCode).toLowerCase())return true;const a=normalizeProjectNameV18_(aName),b=normalizeProjectNameV18_(bName);return!!(a&&b&&(a===b||a.indexOf(b)>=0||b.indexOf(a)>=0));}
/* R4.3 cleanup: removed shadowed legacy function getGanttContextV192. */

/* V19.2 Meeting Fusion 最終初始化、自我檢查與入口。 */
function setupPssAiPmoV192(){
  setupAccountPermissionMatrixV192_();setupMeetingSheetsV192_();
  PropertiesService.getScriptProperties().setProperty('PSS_V192_MEETING_INSTALLED',new Date().toISOString());rebuildDataDictionaryV17_();
  return'PSS AI-PMO V19.2 Meeting Fusion Stable 初始化完成。\n已建立會議、錄音、附件、簽名、出席資料表，並保留個別帳號權限矩陣。';
}
function runV192SelfTest(){const lines=['PSS AI-PMO V19.2 Meeting Fusion Stable 自我檢查'];try{lines.push('✅ 主資料庫：'+getDb_().getName());}catch(e){lines.push('❌ 主資料庫：'+e.message);}try{lines.push('✅ 功能定義：'+ensureFeatureDefinitionsV192_()+' 項（含 MEETING）');}catch(e){lines.push('❌ 功能定義：'+e.message);}try{lines.push('✅ 會議資料表：'+setupMeetingSheetsV192_()+' 張');}catch(e){lines.push('❌ 會議資料表：'+e.message);}try{lines.push('✅ 雲端根目錄：'+DriveApp.getFolderById(APP.CLOUD_ROOT_ID).getName());}catch(e){lines.push('❌ 雲端根目錄：'+e.message);}lines.push('✅ 個人權限：檢視／編輯勾選矩陣');lines.push('✅ 甘特：縣市總覽／專案圖片／任務明細');lines.push('ℹ️ Meet 原生錄影與逐字稿同步需 Workspace 授權、Meet API 與會議產物已生成。');return lines.join('\n');}
function setupPssAiPmoV190(){return setupPssAiPmoV192();}
function setupPssAiPmoV17Enterprise(){return setupPssAiPmoV192();}
function healthCheckV190(){return runV192SelfTest();}
function healthCheckV17(){return runV192SelfTest();}
/* R4.3 cleanup: removed shadowed legacy function onOpen. */
/* R4.3 cleanup: removed shadowed legacy function doGet. */


/* ========================================================================
 * PSS AI-PMO V19.2.1 Permission Login Hotfix
 * 修正：V19.2 前端搭配舊後端時 access.modules 缺失，誤判為無可檢視功能。
 * 修正：帳號資料同時存在「人員帳號／帳號管理」時，固定優先讀取人員帳號。
 * ======================================================================== */
const PSS_V1921_VERSION = 'V19.2.1 Permission Login Hotfix';

function findLoginAccountV1921_(account) {
  const key=clean_(account).toLowerCase(), ss=getDb_(), preferred=['人員帳號','帳號管理'];
  for (let s=0;s<preferred.length;s++) {
    const sheet=ss.getSheetByName(preferred[s]);
    if(!sheet||sheet.getLastRow()<2)continue;
    const values=sheet.getDataRange().getValues(), map=headerMap_(values[0].map(clean_));
    for(let i=1;i<values.length;i++){
      if(clean_(readField_(values[i],map,['帳號','使用者帳號'])).toLowerCase()===key)
        return {sheet:sheet,rowNumber:i+1,row:values[i],map:map};
    }
  }
  const sheet=findAccountSheetV171_(), values=sheet.getDataRange().getValues(), map=headerMap_(values[0].map(clean_));
  for(let i=1;i<values.length;i++)if(clean_(readField_(values[i],map,['帳號','使用者帳號'])).toLowerCase()===key)return{sheet:sheet,rowNumber:i+1,row:values[i],map:map};
  return null;
}

function userFromAccountV1921_(record) {
  const row=record.row,map=record.map;
  return {
    id:clean_(readField_(row,map,['使用者ID','帳號ID']))||clean_(readField_(row,map,['帳號']))||makeId_('U'),
    account:clean_(readField_(row,map,['帳號','使用者帳號'])),
    name:clean_(readField_(row,map,['姓名','人員']))||clean_(readField_(row,map,['帳號'])),
    email:clean_(readField_(row,map,['Email','電子郵件'])),
    role:clean_(readField_(row,map,['角色','職稱']))||'工程師',
    permission:clean_(readField_(row,map,['權限等級','權限']))||'一般',
    status:clean_(readField_(row,map,['狀態','啟用狀態']))
  };
}

function buildAccessV1921_(user) {
  let access=accessFor_(user)||{};
  if(!access.modules || !Object.keys(access.modules).length) access.modules=effectivePermissionMapV192_(user);
  const superAdmin=['系統管理員'].indexOf(clean_(user.role))>=0 || ['系統管理員','管理員'].indexOf(clean_(user.permission))>=0;
  if(superAdmin){
    PSS_V192.FEATURES.forEach(function(f){access.modules[f.code]={view:true,edit:true,source:'系統管理員'};});
    access.manager=true;
  }
  access.canDispatch=!!(access.modules.DISPATCH&&access.modules.DISPATCH.edit);
  access.canManageProjects=!!(access.modules.PROJECT&&access.modules.PROJECT.edit);
  access.canManageUsers=!!(access.modules.ADMIN&&access.modules.ADMIN.edit);
  access.canEditTraining=!!(access.modules.TRAINING&&access.modules.TRAINING.edit);
  access.canViewOperationLogs=!!(access.modules.ADMIN&&access.modules.ADMIN.view);
  access.canManageSettings=!!(access.modules.ADMIN&&access.modules.ADMIN.edit);
  access.quoteView=!!(access.modules.QUOTE&&access.modules.QUOTE.view);
  access.quoteEdit=!!(access.modules.QUOTE&&access.modules.QUOTE.edit);
  return access;
}

/* R4.3 cleanup: removed shadowed legacy function loginV17. */

/* R4.3 cleanup: removed shadowed legacy function getCurrentUserV17. */

function ensureSystemAdminRoleV1921_(){
  const sheet=permissionSheetV192_(PSS_V192.ROLE_SHEET), rows=permissionRowsV192_(sheet), now=new Date();
  PSS_V192.FEATURES.forEach(function(feature){
    const exists=rows.some(function(r){return clean_(r.role)==='系統管理員'&&clean_(r.feature).toUpperCase()===feature.code&&clean_(r.status)!=='停用';});
    if(!exists)appendObject_(sheet,{'權限ID':'RP-SYS-'+feature.code,'角色':'系統管理員','功能代碼':feature.code,'可檢視':'是','可新增':'是','可編輯':'是','可刪除':'是','可匯出':'是','可指派':'是','可審核':'是','資料範圍':'全部','狀態':'啟用','更新者':'V19.2.1','更新時間':now});
  });
}

function ensureFullAdminAccountV1921_(account){
  const target=findUserV192_(account), sheet=permissionSheetV192_(PSS_V192.USER_SHEET), now=new Date();
  removePersonalPermissionsV192_(target);
  PSS_V192.FEATURES.forEach(function(feature){appendObject_(sheet,{'權限ID':'UPM-'+target.id+'-'+feature.code,'對象類型':'個人','對象ID':target.id,'對象名稱':target.name,'功能代碼':feature.code,'可檢視':'是','可新增':'是','可編輯':'是','可刪除':'是','可匯出':'是','可指派':'是','可審核':'是','資料範圍':'全部','狀態':'啟用','更新者':'V19.2.1','更新時間':now});});
  return target;
}

/* R4.3 cleanup: removed shadowed legacy function setupPssAiPmoV1921. */

function runV1921SelfTest(){
  const lines=[PSS_V1921_VERSION+' 自我檢查'];
  try{const r=findLoginAccountV1921_('P10111201'),u=userFromAccountV1921_(r),a=buildAccessV1921_(u),visible=Object.keys(a.modules||{}).filter(function(k){return a.modules[k].view;});lines.push(r?'✅ 登入資料來源：'+r.sheet.getName():'❌ 找不到登入帳號');lines.push('✅ 使用者ID：'+u.id+'／角色：'+u.role+'／權限：'+u.permission);lines.push(visible.length===PSS_V192.FEATURES.length?'✅ 全部功能可檢視：'+visible.length+' 項':'❌ 可檢視功能只有 '+visible.length+' 項');}catch(e){lines.push('❌ '+e.message);}
  lines.push('ℹ️ 部署後回傳 version 應為 '+PSS_V1921_VERSION);
  return lines.join('\n');
}

function getRuntimeInfoV1921(token){const u=requireUser_(token),a=buildAccessV1921_(u);return{version:PSS_V1921_VERSION,user:u,visible:Object.keys(a.modules||{}).filter(function(k){return a.modules[k].view;})};}
/* R4.3 cleanup: removed shadowed legacy function doGet. */


/**
 * PSS AI-PMO V19.2.2 - Performance Engine
 *
 * Purpose:
 * - One Spreadsheet object per execution.
 * - One sheet lookup per execution.
 * - One header map per sheet per execution.
 * - One raw snapshot per sheet per execution.
 * - Batch row updates instead of per-cell writes.
 * - Explicit cache invalidation after writes.
 *
 * This file intentionally overrides several V19.2.1 helper functions while
 * preserving their signatures and return formats.
 */
const PSS_V1922 = Object.freeze({
  version: 'V20.4 R4.8 Performance Core',
  schemaVersion: '19.2.2',
  quickCacheSeconds: 300,
  maxQuickCacheBytes: 90000,
  performanceSheet: '效能紀錄',
});

var PSS_REQ_CACHE_V1922 = {
  db: null,
  progressDb: null,
  sheets: {},
  headers: {},
  maps: {},
  snapshots: {}
};

function pssSheetKeyV1922_(sheet) {
  return String(sheet.getParent().getId()) + ':' + String(sheet.getSheetId());
}

function invalidateSheetCacheV1922_(sheet) {
  if (!sheet) return;
  const key = pssSheetKeyV1922_(sheet);
  delete PSS_REQ_CACHE_V1922.headers[key];
  delete PSS_REQ_CACHE_V1922.maps[key];
  delete PSS_REQ_CACHE_V1922.snapshots[key];
  try {
    CacheService.getScriptCache().removeAll([
      'PSS_V1922_QUICK_ALL',
      'PSS_V1922_PROJECTS',
      'PSS_V1922_PEOPLE'
    ]);
  } catch (ignore) {}
}

function clearPssCacheV1922() {
  PSS_REQ_CACHE_V1922 = { db:null, progressDb:null, sheets:{}, headers:{}, maps:{}, snapshots:{} };
  try { CacheService.getScriptCache().removeAll(['PSS_V1922_QUICK_ALL','PSS_V1922_PROJECTS','PSS_V1922_PEOPLE']); } catch (ignore) {}
  return 'V19.2.2 快取已清除。';
}

function getDb_() {
  if (!PSS_REQ_CACHE_V1922.db) PSS_REQ_CACHE_V1922.db = SpreadsheetApp.openById(APP.DB_ID);
  return PSS_REQ_CACHE_V1922.db;
}

function getProgressDb_() {
  if (!PSS_REQ_CACHE_V1922.progressDb) PSS_REQ_CACHE_V1922.progressDb = SpreadsheetApp.openById(APP.PROGRESS_DB_ID);
  return PSS_REQ_CACHE_V1922.progressDb;
}

function getSheet_(keyOrNames, required) {
  const names = candidates_(keyOrNames);
  const cacheKey = names.join('|');
  if (Object.prototype.hasOwnProperty.call(PSS_REQ_CACHE_V1922.sheets, cacheKey)) {
    const cached = PSS_REQ_CACHE_V1922.sheets[cacheKey];
    if (!cached && required !== false) throw new Error('找不到工作表：' + names.join(' / '));
    return cached;
  }
  const ss = getDb_();
  let found = null;
  for (let i = 0; i < names.length; i += 1) {
    found = ss.getSheetByName(names[i]);
    if (found) break;
  }
  PSS_REQ_CACHE_V1922.sheets[cacheKey] = found;
  if (!found && required !== false) throw new Error('找不到工作表：' + names.join(' / '));
  return found;
}

function headers_(sheet) {
  if (!sheet || sheet.getLastColumn() < 1) return [];
  const key = pssSheetKeyV1922_(sheet);
  if (PSS_REQ_CACHE_V1922.headers[key]) return PSS_REQ_CACHE_V1922.headers[key].slice();
  const result = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(clean_);
  PSS_REQ_CACHE_V1922.headers[key] = result;
  return result.slice();
}

function headerMap_(sheetOrHeaders) {
  if (Array.isArray(sheetOrHeaders)) {
    const map = {};
    sheetOrHeaders.forEach(function(header,index){
      const key = normalizeHeader_(header);
      if (!map[key]) map[key] = [];
      map[key].push(index);
    });
    return map;
  }
  const sheet = sheetOrHeaders;
  const key = pssSheetKeyV1922_(sheet);
  if (PSS_REQ_CACHE_V1922.maps[key]) return PSS_REQ_CACHE_V1922.maps[key];
  const map = headerMap_(headers_(sheet));
  PSS_REQ_CACHE_V1922.maps[key] = map;
  return map;
}

function sheetSnapshotV1922_(sheet) {
  const key = pssSheetKeyV1922_(sheet);
  if (PSS_REQ_CACHE_V1922.snapshots[key]) return PSS_REQ_CACHE_V1922.snapshots[key];
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  const values = lastRow > 0 && lastColumn > 0
    ? sheet.getRange(1,1,lastRow,lastColumn).getValues()
    : [];
  PSS_REQ_CACHE_V1922.snapshots[key] = values;
  return values;
}

function readCanonical_(sheet, definitions) {
  const values = sheetSnapshotV1922_(sheet);
  if (values.length <= 1) return [];
  const map = headerMap_(values[0].map(clean_));
  const keys = Object.keys(definitions);
  const fieldIndexLists = {};
  keys.forEach(function(key){ fieldIndexLists[key] = fieldIndexes_(map, definitions[key]); });
  const output = [];
  for (let r = 1; r < values.length; r += 1) {
    const row = values[r];
    let hasValue = false;
    for (let c = 0; c < row.length; c += 1) {
      if (clean_(row[c]) !== '') { hasValue = true; break; }
    }
    if (!hasValue) continue;
    const object = { __rowNumber:r+1, __row:row };
    keys.forEach(function(key){
      const indexes = fieldIndexLists[key];
      let value = '';
      for (let i = indexes.length - 1; i >= 0; i -= 1) {
        if (clean_(row[indexes[i]]) !== '') { value = row[indexes[i]]; break; }
      }
      if (value === '' && indexes.length) value = row[indexes[indexes.length - 1]];
      object[key] = value;
    });
    output.push(object);
  }
  return output;
}

function appendObject_(sheet, object) {
  const hs = headers_(sheet);
  const row = hs.map(function(header){
    const value = objectValueForHeader_(object, header);
    return value === undefined ? '' : value;
  });
  const rowNumber = Math.max(2, sheet.getLastRow() + 1);
  sheet.getRange(rowNumber,1,1,row.length).setValues([row]);
  invalidateSheetCacheV1922_(sheet);
  return rowNumber;
}

function appendObjectsV1922_(sheet, objects) {
  objects = Array.isArray(objects) ? objects : [];
  if (!objects.length) return [];
  const hs = headers_(sheet);
  const values = objects.map(function(object){
    return hs.map(function(header){
      const value = objectValueForHeader_(object, header);
      return value === undefined ? '' : value;
    });
  });
  const startRow = Math.max(2, sheet.getLastRow() + 1);
  sheet.getRange(startRow,1,values.length,hs.length).setValues(values);
  invalidateSheetCacheV1922_(sheet);
  return values.map(function(_,i){return startRow+i;});
}

function writeObject_(sheet, rowNumber, object) {
  const hs = headers_(sheet);
  const range = sheet.getRange(rowNumber,1,1,hs.length);
  const oldRow = range.getValues()[0];
  const newRow = hs.map(function(header,index){
    const value = objectValueForHeader_(object,header);
    return value === undefined ? oldRow[index] : value;
  });
  range.setValues([newRow]);
  invalidateSheetCacheV1922_(sheet);
}

function writeField_(sheet, rowNumber, canonical, value) {
  let hs = headers_(sheet);
  let map = headerMap_(hs);
  let indexes = fieldIndexes_(map, canonical);
  if (!indexes.length) {
    const col = sheet.getLastColumn() + 1;
    sheet.getRange(1,col).setValue(canonical);
    invalidateSheetCacheV1922_(sheet);
    hs = headers_(sheet);
    map = headerMap_(hs);
    indexes = fieldIndexes_(map, canonical);
  }
  const range = sheet.getRange(rowNumber,1,1,hs.length);
  const row = range.getValues()[0];
  indexes.forEach(function(index){ row[index] = value; });
  range.setValues([row]);
  invalidateSheetCacheV1922_(sheet);
}

function pssJsonCacheGetV1922_(key) {
  try {
    const text = CacheService.getScriptCache().get(key);
    return text ? JSON.parse(text) : null;
  } catch (ignore) { return null; }
}

function pssJsonCachePutV1922_(key, value, seconds) {
  try {
    const text = JSON.stringify(value);
    if (text.length <= PSS_V1922.maxQuickCacheBytes) CacheService.getScriptCache().put(key,text,seconds||PSS_V1922.quickCacheSeconds);
  } catch (ignore) {}
}

function normalizedSearchTextV1922_(values) {
  return values.map(function(v){return clean_(v).toLowerCase();}).join('\u001f');
}

function distinctFastV1922_(rows, field, limit) {
  const seen = {};
  const out = [];
  for (let i=0;i<rows.length;i+=1) {
    const value = clean_(rows[i][field]);
    if (!value || seen[value]) continue;
    seen[value] = true;
    out.push(value);
    if (out.length >= (limit||500)) break;
  }
  return out.sort(function(a,b){return a.localeCompare(b,'zh-Hant');});
}


/** Optimized project snapshot used by all later project APIs. */
function projectRowsV182_() {
  const sheet = getSheet_('PROJECTS');
  const values = sheetSnapshotV1922_(sheet);
  if (values.length <= 1) return [];
  const headers = values[0].map(clean_);
  const byCode = {};
  for (let offset=0; offset<values.length-1; offset+=1) {
    const row = values[offset+1];
    const item = {rowNumber:offset+2};
    PSS_V182_PROJECT_FIELDS.forEach(function(field){
      item[field.key] = projectValueFromRowV182_(row,headers,field);
    });
    if (!item.siteCode && !item.projectName) continue;
    item.siteCode = clean_(item.siteCode);
    item.projectName = clean_(item.projectName);
    item.label = [item.siteCode,item.projectName].filter(Boolean).join('｜');
    item.searchText = PSS_V182_PROJECT_FIELDS.map(function(field){return item[field.key]||'';}).join(' ').toLowerCase();
    const key = (item.siteCode || ('NAME:' + normalizeProjectNameV18_(item.projectName))).toLowerCase();
    if (!byCode[key]) byCode[key] = item;
    else {
      PSS_V182_PROJECT_FIELDS.forEach(function(field){
        if (!byCode[key][field.key] && item[field.key]) byCode[key][field.key] = item[field.key];
      });
      byCode[key].rowNumber = Math.min(byCode[key].rowNumber,item.rowNumber);
    }
  }
  return Object.keys(byCode).map(function(key){return byCode[key];})
    .sort(function(a,b){return a.label.localeCompare(b.label,'zh-Hant');});
}

/** Quick-filter people source: canonical account table only, no full workbook scan. */
function quickPeopleV1922_(token) {
  requireUser_(token);
  const rows = readCanonical_(findAccountSheetV171_(),accountDefinitionsV171_());
  const byName = {};
  rows.forEach(function(p){
    const name = clean_(p.name), status = clean_(p.status);
    if (!name || status !== '啟用') return;
    byName[name] = {name:name,role:clean_(p.role),email:clean_(p.email)};
  });
  return Object.keys(byName).sort(function(a,b){return a.localeCompare(b,'zh-Hant');})
    .map(function(name){return byName[name];});
}

/* R4.3 cleanup: removed shadowed legacy function getQuickFilterBundleV1922. */

function ensurePerformanceSheetsV1922_() {
  getOrCreateSheet_(PSS_V1922.performanceSheet,['紀錄ID','測試時間','版本','測試項目','資料筆數','耗時毫秒','執行者','備註']);
  return 2;
}

function recordPerformanceV1922_(name,count,ms,user,note) {
  try {
    appendObject_(getSheet_(PSS_V1922.performanceSheet),{
      '紀錄ID':makeId_('PERF'),'測試時間':new Date(),'版本':PSS_V1922.version,
      '測試項目':name,'資料筆數':count,'耗時毫秒':ms,'執行者':user&&user.name||'系統','備註':note||''
    });
  } catch (ignore) {}
}

function runPerformanceBenchmarkV1922(token) {
  const user = token ? requireManager_(token) : {name:'Apps Script 管理員'};
  ensurePerformanceSheetsV1922_();
  clearPssCacheV1922();
  const tests = [];
  function test(name,fn){
    const start = Date.now();
    const result = fn();
    const ms = Date.now()-start;
    const count = Array.isArray(result) ? result.length : Number(result&&result.length||result&&result.count||0);
    tests.push({name:name,count:count,ms:ms});
    recordPerformanceV1922_(name,count,ms,user,'V19.2.2 自我檢測');
  }
  test('專案清單批次讀取',function(){return projectRowsV182_();});
  test('任務批次讀取',function(){return readCanonical_(getSheet_('TASKS'),taskDefinitions_());});
  test('每日回報批次讀取',function(){return readCanonical_(getSheet_('DAILY_LOGS'),dailyDefinitions_());});
  test('報價品項批次讀取',function(){return readCanonical_(getSheet_('QUOTE_ITEMS'),quoteProductDefinitionsV191_());});
  test('會議主檔批次讀取',function(){return readCanonical_(meetingSheetV192_('MEETINGS'),meetingDefinitionsV192_());});
  return {version:PSS_V1922.version,tests:tests,totalMs:tests.reduce(function(s,x){return s+x.ms;},0)};
}


/** PSS AI-PMO V19.2.2 setup, router and compatibility entrypoints. */
function setupPssAiPmoV1922() {
  const lines = [];
  lines.push(setupPssAiPmoV1921());
  ensurePerformanceSheetsV1922_();
  PropertiesService.getScriptProperties().setProperty('PSS_DB_SCHEMA_VERSION',PSS_V1922.schemaVersion);
  clearPssCacheV1922();
  lines.push('V19.2.2 效能資料表已建立。');
  lines.push('資料庫版本：'+PSS_V1922.schemaVersion);
  return lines.join('\n');
}

function runV1922SelfTest() {
  const lines = ['PSS AI-PMO '+PSS_V1922.version+' 自我檢查'];
  try { lines.push(runV1921SelfTest()); } catch (e) { lines.push('❌ V19.2.1 基礎檢查：'+e.message); }
  try { lines.push('✅ 效能資料表：'+ensurePerformanceSheetsV1922_()+' 張'); } catch (e) { lines.push('❌ 效能資料表：'+e.message); }
  try { lines.push('✅ 快篩資料：'+getQuickFilterBundleV1922(findTestTokenV1922_()).projects.length+' 個專案'); } catch (e) { lines.push('ℹ️ 快篩登入測試略過：'+e.message); }
  lines.push('✅ 批次讀取、標頭快取、工作表快取與單列批次更新已載入。');
  lines.push('ℹ️ 請另外執行 runPerformanceBenchmarkV1922(token) 取得實際耗時。');
  return lines.join('\n');
}

function findTestTokenV1922_() {
  throw new Error('自我檢查不建立假登入；請從平台執行效能測試。');
}

function getRuntimeInfoV1922(token) {
  const u=requireUser_(token),a=buildAccessV1921_(u);
  return {version:PSS_V1922.version,schemaVersion:PSS_V1922.schemaVersion,user:u,visible:Object.keys(a.modules||{}).filter(function(k){return a.modules[k].view;})};
}

/* R4.3 cleanup: removed shadowed legacy function onOpen. */

function setupPssAiPmoV1921(){
  setupPssAiPmoV192();
  ensureSystemAdminRoleV1921_();
  ensureFullAdminAccountV1921_('P10111201');
  ensurePerformanceSheetsV1922_();
  return PSS_V1922.version+' 基礎升級完成。';
}

/* R4.3 cleanup: removed shadowed legacy function doGet. */


/* ========================================================================
 * PSS AI-PMO V20 - Employee ID Access / Blacklist / Presence / SSO
 * 此區塊必須放在原 Code.gs 最後，覆蓋舊登入與帳號管理入口。
 * ======================================================================== */
const PSS_V20 = Object.freeze({
  VERSION:'V20.5 R5.0 Lark Workspace',
  SUPERVISOR_ID:'P10111201',
  SUPERVISOR_NAME:'陳彥均',
  ONLINE_SECONDS:180,
  TICKET_SECONDS:120,
  SESSION_SHEET:'SYS_登入狀態',
  TICKET_SHEET:'SYS_快速登入票證',
  DEFAULT_MEETING_APP_URL:'https://script.google.com/macros/s/AKfycbzsns5x5sT-nSmKuz1J-4tw4SNky1o0WEeWgvB_FGwWMznVHdmjn1AVlmq26aILdphq/exec',
  DEFAULT_QUOTE_APP_URL:'https://script.google.com/macros/s/AKfycbxjcp9rqqxZGSVJHzFBNltzlqkH_KikTSKBxqP2X7Cu_GdwrLhcvXPa2rF1HQ3XaYot/exec'
});

/* R4.3 cleanup: removed shadowed legacy function setupPssAiPmoV20. */

/* R4.3 cleanup: removed shadowed legacy function loginV17. */

function registerAccountV17(){
  throw new Error('本系統已停用申請帳號；請由主管以工號建檔。');
}

/* R4.3 cleanup: removed shadowed legacy function requireUser_. */

/* R4.3 cleanup: removed shadowed legacy function getCurrentUserV17. */

function logoutV17(token){
  const user=getSession_(token);
  removeSession_(token);
  closePresenceV20_(token,'已登出');
  operationLog_(user,'登出','身分驗證',user?user.id:'','','成功');
  return'已登出。';
}

/* R4.3 cleanup: removed shadowed legacy function heartbeatV20. */

function listOnlineUsersV20(token){
  requireManager_(token);
  const sheet=getDb_().getSheetByName(PSS_V20.SESSION_SHEET);
  if(!sheet||sheet.getLastRow()<2)return[];
  const now=Date.now(),cutoff=now-PSS_V20.ONLINE_SECONDS*1000;
  return readCanonical_(sheet,{
    session:['Session雜湊'],employeeId:['工號'],name:['姓名'],role:['角色'],app:['應用'],
    deviceId:['裝置ID'],loginAt:['登入時間'],lastSeen:['最後心跳'],expiresAt:['到期時間'],status:['狀態']
  }).filter(function(row){
    return clean_(row.status)==='在線'&&timeNumber_(row.lastSeen)>=cutoff&&timeNumber_(row.expiresAt)>now;
  }).map(function(row){
    return{employeeId:clean_(row.employeeId),name:clean_(row.name),role:clean_(row.role),app:clean_(row.app),
      deviceId:clean_(row.deviceId),loginAt:dateTime_(row.loginAt),lastSeen:dateTime_(row.lastSeen),expiresAt:dateTime_(row.expiresAt)};
  }).sort(function(a,b){return String(b.lastSeen).localeCompare(String(a.lastSeen));});
}

function listUsersV17(token){
  requireManager_(token);
  const online={};
  listOnlineUsersV20(token).forEach(function(row){online[row.employeeId]=row;});
  const sheet=findAccountSheetV171_();
  ensureHeaders_(sheet,['工號','黑名單','黑名單原因','最後活動','最後登入裝置']);
  return readCanonical_(sheet,{
    id:['使用者ID','帳號ID'],account:['工號','帳號'],name:['姓名','人員'],email:['Email'],
    role:['角色','職稱'],permission:['權限等級','權限'],status:['狀態','啟用狀態'],
    createdAt:['建立時間'],lastLogin:['最後登入時間','最後登入'],lastSeen:['最後活動'],
    blacklisted:['黑名單'],blacklistReason:['黑名單原因'],deviceId:['最後登入裝置'],note:['備註']
  }).filter(function(u){return clean_(u.account)||clean_(u.name);}).map(function(u){
    const employeeId=normalizeEmployeeIdV20_(u.account);
    return{id:clean_(u.id),account:employeeId,employeeId:employeeId,name:clean_(u.name),email:clean_(u.email),
      role:clean_(u.role),permission:clean_(u.permission),status:clean_(u.status),
      blacklisted:clean_(u.blacklisted)||'否',blacklistReason:clean_(u.blacklistReason),
      createdAt:dateTime_(u.createdAt),lastLogin:dateTime_(u.lastLogin),lastSeen:dateTime_(u.lastSeen),
      deviceId:clean_(u.deviceId),online:!!online[employeeId],onlineApp:online[employeeId]?online[employeeId].app:'',
      note:clean_(u.note)};
  });
}

function saveUserV17(payload){
  payload=payload||{};
  const actor=requireManager_(payload.token),employeeId=normalizeEmployeeIdV20_(payload.employeeId||payload.account);
  const name=clean_(payload.name);
  if(!employeeId||!name)throw new Error('工號與姓名必填。');
  const existing=findEmployeeV20_(employeeId),protectedAdmin=employeeId===PSS_V20.SUPERVISOR_ID;
  const sheet=existing?existing.sheet:findAccountSheetV171_();
  ensureHeaders_(sheet,['工號','黑名單','黑名單原因','最後活動','最後登入裝置','禁止登入時間','禁止登入設定者']);
  const obj={
    '使用者ID':existing?userFromAccountV1921_(existing).id:makeId_('U'),
    '帳號':employeeId,'工號':employeeId,'姓名':protectedAdmin?PSS_V20.SUPERVISOR_NAME:name,
    'Email':clean_(payload.email),'角色':protectedAdmin?'系統管理員':(clean_(payload.role)||'工程師'),
    '權限等級':protectedAdmin?'管理員':(clean_(payload.permission)||'一般'),
    '狀態':protectedAdmin?'啟用':(clean_(payload.status)||'啟用'),
    '黑名單':protectedAdmin?'否':(clean_(payload.blacklisted)==='是'?'是':'否'),
    '黑名單原因':protectedAdmin?'':clean_(payload.blacklistReason),
    '建立時間':existing?readField_(existing.row,existing.map,['建立時間']):new Date(),
    '備註':clean_(payload.note)
  };
  if(existing)writeObject_(sheet,existing.rowNumber,obj);else appendObject_(sheet,obj);
  if(obj['黑名單']==='是'||obj['狀態']!=='啟用')revokeEmployeeSessionsV20_(employeeId,actor);
  operationLog_(actor,existing?'更新工號權限':'新增工號','主管管理',employeeId,obj,'成功');
  return(existing?'工號資料已更新。':'工號已新增。');
}

function setBlacklistV20(payload){
  payload=payload||{};
  const actor=requireManager_(payload.token),employeeId=normalizeEmployeeIdV20_(payload.employeeId);
  if(employeeId===PSS_V20.SUPERVISOR_ID)throw new Error('最高管理者不可列入黑名單。');
  const target=findEmployeeV20_(employeeId);
  if(!target)throw new Error('找不到工號。');
  const blocked=payload.blacklisted===true||clean_(payload.blacklisted)==='是';
  writeField_(target.sheet,target.rowNumber,'黑名單',blocked?'是':'否');
  writeField_(target.sheet,target.rowNumber,'黑名單原因',blocked?clean_(payload.reason):'');
  writeField_(target.sheet,target.rowNumber,'禁止登入時間',blocked?new Date():'');
  writeField_(target.sheet,target.rowNumber,'禁止登入設定者',actor.account);
  if(blocked)revokeEmployeeSessionsV20_(employeeId,actor);
  operationLog_(actor,blocked?'加入黑名單':'解除黑名單','主管管理',employeeId,clean_(payload.reason),'成功');
  return employeeId+(blocked?' 已禁止登入。':' 已解除黑名單。');
}

function deleteUserV17(){
  throw new Error('V20 不刪除人員紀錄；請改用停用或黑名單，保留完整操作稽核。');
}

function createQuickLoginV20(payload){
  payload=payload||{};
  const user=requireUser_(payload.token),targetApp=clean_(payload.targetApp).toUpperCase();
  if(['MEETING','QUOTE'].indexOf(targetApp)<0)throw new Error('快速登入目標不正確。');
  const propertyName=targetApp+'_APP_URL_V20',fallback=targetApp==='MEETING'?PSS_V20.DEFAULT_MEETING_APP_URL:PSS_V20.DEFAULT_QUOTE_APP_URL,url=clean_(PropertiesService.getScriptProperties().getProperty(propertyName)||fallback);
  if(!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec/i.test(url))throw new Error('尚未設定 '+propertyName+'。');
  const ticket=randomToken_(72),now=new Date(),expires=new Date(Date.now()+PSS_V20.TICKET_SECONDS*1000);
  appendObject_(getDb_().getSheetByName(PSS_V20.TICKET_SHEET),{
    '票證雜湊':sha256TextV20_(ticket),'工號':user.employeeId||user.account,'姓名':user.name,
    '來源應用':'PMO','目標應用':targetApp,'建立時間':now,'到期時間':expires,'狀態':'未使用'
  });
  operationLog_(user,'建立快速登入','跨程式登入',targetApp,{expiresAt:dateTime_(expires)},'成功');
  return{url:url+(url.indexOf('?')<0?'?':'&')+'ticket='+encodeURIComponent(ticket),expiresAt:dateTime_(expires)};
}

function consumeQuickLoginV20(payload){
  payload=payload||{};
  const ticket=clean_(payload.ticket),targetApp=(clean_(payload.targetApp)||'QUOTE').toUpperCase();
  const deviceId=clean_(payload.deviceId);
  if(!ticket||!deviceId)throw new Error('快速登入資料不完整。');
  const lock=LockService.getScriptLock();lock.waitLock(20000);
  try{
    const sheet=ensurePmoV20Sheet_(PSS_V20.TICKET_SHEET,[
      '票證雜湊','工號','姓名','來源應用','目標應用','建立時間','到期時間','使用時間','狀態'
    ]),rows=readCanonical_(sheet,{
      hash:['票證雜湊'],employeeId:['工號'],targetApp:['目標應用'],expiresAt:['到期時間'],status:['狀態']
    }),hash=sha256TextV20_(ticket);
    const target=rows.find(function(row){
      return clean_(row.hash)===hash&&clean_(row.targetApp).toUpperCase()===targetApp&&clean_(row.status)==='未使用';
    });
    if(!target)throw new Error('快速登入連結無效或已使用。');
    if(timeNumber_(target.expiresAt)<=Date.now())throw new Error('快速登入連結已逾時。');
    writeObject_(sheet,target.__rowNumber,{'使用時間':new Date(),'狀態':'已使用'});
    const employeeId=normalizeEmployeeIdV20_(target.employeeId),record=findEmployeeV20_(employeeId);
    if(!record)throw new Error('此工號尚未建檔。');
    const user=userFromAccountV1921_(record);
    user.account=employeeId;user.employeeId=employeeId;
    if(user.status!=='啟用'||isBlacklistedV20_(record))throw new Error('此工號目前禁止使用。');
    const token=randomToken_(64),access=buildAccessV1921_(user);
    putSession_(token,user);
    touchPresenceV20_(token,user,targetApp,deviceId,'在線',clean_(payload.userAgent));
    operationLog_(user,'快速登入','跨程式登入',targetApp,{deviceId:deviceId},'成功');
    return{token:token,user:user,access:access,version:PSS_V20.VERSION};
  }finally{lock.releaseLock();}
}

function setPmoAppUrlsV20(meetingUrl,quoteUrl){
  const valid=function(url){return /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec/i.test(clean_(url));};
  if(!valid(meetingUrl)||!valid(quoteUrl))throw new Error('請輸入兩個正確的 Apps Script /exec 部署網址。');
  PropertiesService.getScriptProperties().setProperties({
    MEETING_APP_URL_V20:clean_(meetingUrl),QUOTE_APP_URL_V20:clean_(quoteUrl)
  },false);
  return'週四會議與獨立報價網址已設定。';
}

function getPmoAppLinksV20(token){
  requireUser_(token);
  const props=PropertiesService.getScriptProperties();
  return{
    meeting:clean_(props.getProperty('MEETING_APP_URL_V20')||PSS_V20.DEFAULT_MEETING_APP_URL),
    quote:clean_(props.getProperty('QUOTE_APP_URL_V20')||PSS_V20.DEFAULT_QUOTE_APP_URL)
  };
}

function findEmployeeV20_(employeeId){
  const key=normalizeEmployeeIdV20_(employeeId),ss=getDb_(),names=['人員帳號','帳號管理'];
  for(let s=0;s<names.length;s++){
    const sheet=ss.getSheetByName(names[s]);
    if(!sheet||sheet.getLastRow()<2)continue;
    ensureHeaders_(sheet,['工號','黑名單','黑名單原因','最後活動','最後登入裝置','禁止登入時間','禁止登入設定者']);
    const values=sheet.getDataRange().getValues(),map=headerMap_(values[0].map(clean_));
    for(let i=1;i<values.length;i++){
      const candidate=normalizeEmployeeIdV20_(readField_(values[i],map,['工號','帳號','使用者帳號']));
      if(candidate===key)return{sheet:sheet,rowNumber:i+1,row:values[i],map:map};
    }
  }
  return null;
}

function isBlacklistedV20_(record){
  return clean_(readField_(record.row,record.map,['黑名單','禁止登入']))==='是';
}
function blacklistReasonV20_(record){return clean_(readField_(record.row,record.map,['黑名單原因','禁止登入原因']));}
function normalizeEmployeeIdV20_(value){const id=clean_(value).toUpperCase();return/^[A-Z0-9_-]{4,24}$/.test(id)?id:'';}
function sha256TextV20_(value){return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(value||''),Utilities.Charset.UTF_8)).replace(/=+$/,'');}
function sessionHashV20_(token){return sha256TextV20_(token).slice(0,32);}

function ensurePmoV20Sheet_(name,headers){
  let sheet=getDb_().getSheetByName(name);
  if(!sheet)sheet=getDb_().insertSheet(name);
  ensureHeaders_(sheet,headers);
  sheet.setFrozenRows(1);
  return sheet;
}

function touchPresenceV20_(token,user,app,deviceId,status,userAgent){
  const sheet=ensurePmoV20Sheet_(PSS_V20.SESSION_SHEET,[
    'Session雜湊','工號','姓名','角色','應用','裝置ID','登入時間','最後心跳','到期時間','狀態','登出時間','UserAgent'
  ]),hash=sessionHashV20_(token),rows=readCanonical_(sheet,{hash:['Session雜湊']}),target=rows.find(function(row){return clean_(row.hash)===hash;}),now=new Date();
  const obj={'Session雜湊':hash,'工號':user.employeeId||user.account,'姓名':user.name,'角色':user.role,'應用':app,
    '裝置ID':deviceId,'登入時間':target?readField_(sheet.getRange(target.__rowNumber,1,1,sheet.getLastColumn()).getValues()[0],headerMap_(sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0].map(clean_)),['登入時間']):now,
    '最後心跳':now,'到期時間':new Date(Date.now()+APP.SESSION_SECONDS*1000),'狀態':status||'在線','UserAgent':userAgent||''};
  if(target)writeObject_(sheet,target.__rowNumber,obj);else appendObject_(sheet,obj);
}

function closePresenceV20_(token,status){
  const sheet=getDb_().getSheetByName(PSS_V20.SESSION_SHEET);
  if(!sheet||sheet.getLastRow()<2)return;
  const rows=readCanonical_(sheet,{hash:['Session雜湊']}),target=rows.find(function(row){return clean_(row.hash)===sessionHashV20_(token);});
  if(target)writeObject_(sheet,target.__rowNumber,{'狀態':status||'已登出','登出時間':new Date(),'最後心跳':new Date()});
}

function revokeEmployeeSessionsV20_(employeeId,actor){
  const sheet=getDb_().getSheetByName(PSS_V20.SESSION_SHEET);
  if(sheet&&sheet.getLastRow()>1){
    const rows=readCanonical_(sheet,{employeeId:['工號'],status:['狀態']});
    rows.forEach(function(row){if(normalizeEmployeeIdV20_(row.employeeId)===employeeId&&clean_(row.status)==='在線')writeObject_(sheet,row.__rowNumber,{'狀態':'已撤銷','登出時間':new Date()});});
  }
  const props=PropertiesService.getScriptProperties(),all=props.getProperties();
  Object.keys(all).filter(function(key){return key.indexOf(APP.SESSION_PREFIX)===0;}).forEach(function(key){
    try{const session=JSON.parse(all[key]);if(normalizeEmployeeIdV20_(session.user&&(session.user.employeeId||session.user.account))===employeeId){props.deleteProperty(key);CacheService.getScriptCache().remove(key);}}catch(ignore){}
  });
  operationLog_(actor,'撤銷登入','主管管理',employeeId,'目前登入已撤銷','成功');
}

/* R4.3 cleanup: removed shadowed legacy function runV20SelfTest. */

/* R4.3 cleanup: removed shadowed legacy function onOpen. */

/* R4.3 cleanup: removed shadowed legacy function doGet. */


/**
 * 將附件會議系統的工作表安全複製／合併到 PMO 主資料庫。
 *
 * 來源：週四專案會議資料庫
 * 目標：PSS AI-PMO 主資料庫
 *
 * 不會刪除來源資料，也不會覆蓋 PMO 既有同名表；
 * 所有會議表在 PMO 內加上 MTG_ 前綴。
 */

const PMO_MEETING_MIGRATION_V20 = Object.freeze({
  sourceSpreadsheetId: '1V84h9Xi6yG4OS1z8ezXKGQWCR87t-eF1iKkf8JOF4iA',
  targetSpreadsheetId: '11ndvBcV0geEF7oJv1kX28BuC4_kAKnl37wUhL-Rx27g',
  prefix: 'MTG_',
  sourceSheets: [
    '01_會議總覽',
    '02_人員週報',
    '03_決議追蹤',
    '04_會議紀錄與簽名',
    '05_標準WBS討論',
    '06_系統工程任務',
    '07_BA圖面檢討',
    'WEB_會議主檔',
    'WEB_簽名',
    'WEB_附件',
    'WEB_BA圖面修正',
    'WEB_BA附件',
    'WEB_下次會議追蹤',
    'WEB_輸出紀錄',
    'WEB_操作紀錄'
  ],
  appendSheets: [
    'WEB_會議主檔',
    'WEB_簽名',
    'WEB_附件',
    'WEB_BA圖面修正',
    'WEB_BA附件',
    'WEB_下次會議追蹤',
    'WEB_輸出紀錄',
    'WEB_操作紀錄'
  ],
  auditSheet: 'SYS_資料遷移LOG'
});

function previewMeetingMigrationV20() {
  const source = SpreadsheetApp.openById(
    PMO_MEETING_MIGRATION_V20.sourceSpreadsheetId
  );
  const target = SpreadsheetApp.openById(
    PMO_MEETING_MIGRATION_V20.targetSpreadsheetId
  );
  return PMO_MEETING_MIGRATION_V20.sourceSheets.map(function (sourceName) {
    const sourceSheet = source.getSheetByName(sourceName);
    const targetName = PMO_MEETING_MIGRATION_V20.prefix + sourceName;
    const targetSheet = target.getSheetByName(targetName);
    return {
      sourceSheet: sourceName,
      targetSheet: targetName,
      sourceExists: Boolean(sourceSheet),
      sourceRows: sourceSheet ? sourceSheet.getLastRow() : 0,
      sourceColumns: sourceSheet ? sourceSheet.getLastColumn() : 0,
      targetExists: Boolean(targetSheet),
      targetRows: targetSheet ? targetSheet.getLastRow() : 0,
      action: !sourceSheet ? '略過：來源不存在' :
        (!targetSheet ? '建立完整副本' :
          (PMO_MEETING_MIGRATION_V20.appendSheets.indexOf(sourceName) !== -1 ?
            '依整列內容去重後追加' : '保留 PMO 現有版本'))
    };
  });
}

function migrateMeetingDataToPmoV20(confirmText) {
  if (String(confirmText || '') !== '確認匯入會議資料') {
    throw new Error(
      '安全檢查未通過。請先執行 previewMeetingMigrationV20()，' +
      '確認後再傳入「確認匯入會議資料」。'
    );
  }
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const source = SpreadsheetApp.openById(
      PMO_MEETING_MIGRATION_V20.sourceSpreadsheetId
    );
    const target = SpreadsheetApp.openById(
      PMO_MEETING_MIGRATION_V20.targetSpreadsheetId
    );
    const audit = ensureMigrationAuditV20_(target);
    const results = [];

    PMO_MEETING_MIGRATION_V20.sourceSheets.forEach(function (sourceName) {
      const sourceSheet = source.getSheetByName(sourceName);
      const targetName = PMO_MEETING_MIGRATION_V20.prefix + sourceName;
      if (!sourceSheet) {
        results.push({
          sourceSheet: sourceName,
          targetSheet: targetName,
          action: '略過',
          rows: 0,
          message: '來源工作表不存在'
        });
        return;
      }

      let targetSheet = target.getSheetByName(targetName);
      if (!targetSheet) {
        targetSheet = sourceSheet.copyTo(target).setName(targetName);
        results.push({
          sourceSheet: sourceName,
          targetSheet: targetName,
          action: '建立完整副本',
          rows: Math.max(0, sourceSheet.getLastRow() - 1),
          message: '已保留格式、公式與資料'
        });
        return;
      }

      if (PMO_MEETING_MIGRATION_V20.appendSheets.indexOf(sourceName) === -1) {
        results.push({
          sourceSheet: sourceName,
          targetSheet: targetName,
          action: '保留',
          rows: 0,
          message: 'PMO 已有此報表版面，未覆蓋'
        });
        return;
      }

      const appended = appendUniqueMeetingRowsV20_(sourceSheet, targetSheet);
      results.push({
        sourceSheet: sourceName,
        targetSheet: targetName,
        action: '去重追加',
        rows: appended,
        message: appended ? '已追加新資料' : '沒有新資料'
      });
    });

    results.forEach(function (result) {
      audit.appendRow([
        new Date(),
        PMO_MEETING_MIGRATION_V20.sourceSpreadsheetId,
        PMO_MEETING_MIGRATION_V20.targetSpreadsheetId,
        result.sourceSheet,
        result.targetSheet,
        result.action,
        result.rows,
        result.message
      ]);
    });
    audit.getRange(2, 1, Math.max(1, audit.getLastRow() - 1), 1)
      .setNumberFormat('yyyy/mm/dd hh:mm:ss');

    PropertiesService.getScriptProperties().setProperties({
      PMO_SPREADSHEET_ID: PMO_MEETING_MIGRATION_V20.targetSpreadsheetId,
      MEETING_SOURCE_SPREADSHEET_ID:
        PMO_MEETING_MIGRATION_V20.sourceSpreadsheetId,
      MEETING_SHEET_PREFIX: PMO_MEETING_MIGRATION_V20.prefix
    }, false);
    return {
      ok: true,
      sourceSpreadsheetId: source.getId(),
      targetSpreadsheetId: target.getId(),
      results: results,
      message: '會議資料已安全匯入 PMO 主資料庫。'
    };
  } finally {
    lock.releaseLock();
  }
}

function appendUniqueMeetingRowsV20_(sourceSheet, targetSheet) {
  const sourceRows = sourceSheet.getDataRange().getDisplayValues();
  if (sourceRows.length < 2) return 0;
  const width = Math.max(
    sourceSheet.getLastColumn(),
    targetSheet.getLastColumn()
  );
  if (targetSheet.getMaxColumns() < width) {
    targetSheet.insertColumnsAfter(
      targetSheet.getMaxColumns(),
      width - targetSheet.getMaxColumns()
    );
  }
  const targetRows = targetSheet.getDataRange().getDisplayValues();
  const known = {};
  targetRows.slice(1).forEach(function (row) {
    known[migrationRowKeyV20_(row)] = true;
  });

  const appendRows = [];
  sourceRows.slice(1).forEach(function (row) {
    if (!row.some(function (cell) { return String(cell || '').trim(); })) return;
    const key = migrationRowKeyV20_(row);
    if (known[key]) return;
    known[key] = true;
    const padded = row.slice(0, width);
    while (padded.length < width) padded.push('');
    appendRows.push(padded);
  });
  if (appendRows.length) {
    targetSheet.getRange(
      targetSheet.getLastRow() + 1,
      1,
      appendRows.length,
      width
    ).setValues(appendRows);
  }
  return appendRows.length;
}

function migrationRowKeyV20_(row) {
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    JSON.stringify(row),
    Utilities.Charset.UTF_8
  );
  return Utilities.base64EncodeWebSafe(digest).replace(/=+$/g, '');
}

function ensureMigrationAuditV20_(ss) {
  let sheet = ss.getSheetByName(PMO_MEETING_MIGRATION_V20.auditSheet);
  if (!sheet) sheet = ss.insertSheet(PMO_MEETING_MIGRATION_V20.auditSheet);
  const headers = [
    '時間', '來源試算表ID', '目標試算表ID', '來源工作表',
    '目標工作表', '動作', '異動列數', '結果'
  ];
  sheet.getRange(1, 1, 1, headers.length)
    .setValues([headers])
    .setBackground('#123b5d')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
  sheet.setFrozenRows(1);
  return sheet;
}

/* =========================================================================
 * PSS AI-PMO V20.3｜首頁合併讀取、區域工作、快選索引與效能追蹤
 * ========================================================================= */
const PSS_V203 = Object.freeze({
  VERSION: 'V20.3 Wednesday Snapshot + Fast Select',
  DASHBOARD_CACHE_SECONDS: 60,
  QUICK_CACHE_SECONDS: 900,
  CLIENT_SLOW_MS: 1200,
  PERFORMANCE_SHEET: 'SYS_效能監控'
});

function pssUserCacheKeyV203_(user) {
  return clean_(user && (user.employeeId || user.account || user.name))
    .replace(/[^A-Za-z0-9_-]/g, '_')
    .slice(0, 40) || 'USER';
}

function taiwanAreaV203_(text) {
  const value = clean_(text).replace(/臺/g, '台');
  const groups = [
    {name:'北區', words:['台北','新北','基隆','桃園','新竹','宜蘭']},
    {name:'中區', words:['苗栗','台中','彰化','南投','雲林']},
    {name:'南區', words:['嘉義','台南','高雄','屏東']},
    {name:'東區', words:['花蓮','台東']},
    {name:'離島', words:['澎湖','金門','連江','馬祖']}
  ];
  for (let i = 0; i < groups.length; i += 1) {
    if (groups[i].words.some(function(word){ return value.indexOf(word) >= 0; })) {
      return groups[i].name;
    }
  }
  return '未分類';
}

function compactProjectIndexV203_(token) {
  requireUser_(token);
  const rows = projectRowsV182_().filter(function(p){
    return clean_(p.active) !== '停用';
  });
  return rows.map(function(p){
    const item = {
      siteCode:clean_(p.siteCode),
      projectName:clean_(p.projectName),
      customer:clean_(p.customer),
      systemType:clean_(p.systemType),
      responsible:clean_(p.responsible || p.manager),
      manager:clean_(p.manager || p.responsible),
      engineer:clean_(p.engineer || p.engineers),
      engineers:clean_(p.engineers || p.engineer),
      status:clean_(p.status),
      address:clean_(p.address),
      driveUrl:clean_(p.driveUrl),
      progress:clean_(p.progress),
      risk:clean_(p.risk),
      billingStatus:clean_(p.billingStatus)
    };
    item.label = [item.siteCode,item.projectName].filter(Boolean).join('｜');
    item.area = taiwanAreaV203_([
      item.address,item.projectName,item.customer,item.siteCode
    ].join(' '));
    item._search = normalizedSearchTextV1922_([
      item.siteCode,item.projectName,item.customer,item.systemType,
      item.responsible,item.engineer,item.status,item.address,item.area
    ]);
    return item;
  });
}

/**
 * 所有專案代號／名稱快選共用同一份精簡索引。
 * 不再為快選同步掃描任務與每日回報表。
 */
function getQuickFilterBundleV1922(token) {
  const user = requireUser_(token);
  const key = 'PSS_V1922_QUICK_ALL';
  const cached = pssJsonCacheGetV1922_(key);
  if (cached) return Object.assign({cache:'hit'}, cached);

  const started = Date.now();
  const projects = compactProjectIndexV203_(token);
  const people = quickPeopleV1922_(token);
  const distinct = function(values) {
    const seen = {};
    return values.filter(function(value){
      value = clean_(value);
      if (!value || seen[value]) return false;
      seen[value] = true;
      return true;
    }).sort(function(a,b){ return a.localeCompare(b,'zh-Hant'); });
  };
  const bundle = {
    generatedAt:new Date().toISOString(),
    version:PSS_V203.VERSION,
    projects:projects,
    people:people,
    taskFilters:{types:[],owners:people.map(function(p){return p.name;})},
    reportFilters:{people:people.map(function(p){return p.name;})},
    projectFilters:{
      customers:distinct(projects.map(function(p){return p.customer;})),
      systems:distinct(projects.map(function(p){return p.systemType;})),
      statuses:distinct(projects.map(function(p){return p.status;})),
      areas:distinct(projects.map(function(p){return p.area;}))
    }
  };
  pssJsonCachePutV1922_(key,bundle,PSS_V203.QUICK_CACHE_SECONDS);
  console.info('[PERF V20.3] 快選索引 ' + (Date.now()-started) + 'ms / ' +
    projects.length + ' projects / ' + people.length + ' people');
  return Object.assign({cache:'miss'},bundle);
}

function normalizeCalendarItemV203_(item) {
  item = item || {};
  const type = item.type || (
    item.kind === 'task' ? '任務' :
    item.kind === 'report' ? '回報' : '事件'
  );
  return Object.assign({}, item, {
    type:type,
    id:item.id || item.taskId || item.reportId || '',
    title:item.title || '未命名項目',
    project:item.project || [item.siteCode,item.projectName].filter(Boolean).join('｜')
  });
}

function buildRegionWorkV203_(projects, tasks) {
  const projectByCode = {};
  (projects || []).forEach(function(p){
    if (p.siteCode) projectByCode[clean_(p.siteCode).toLowerCase()] = p;
  });
  const groups = {};
  (tasks || []).forEach(function(task){
    const p = projectByCode[clean_(task.siteCode).toLowerCase()] || {};
    const area = p.area || taiwanAreaV203_([
      p.address,task.project,task.projectName,task.siteCode
    ].join(' '));
    if (!groups[area]) groups[area] = {
      area:area,total:0,overdue:0,doing:0,items:[]
    };
    const group = groups[area];
    group.total += 1;
    if (task.overdue) group.overdue += 1;
    if (clean_(task.status) === '進行中') group.doing += 1;
    group.items.push({
      taskId:clean_(task.taskId),
      content:clean_(task.content || task.taskType),
      project:clean_(task.project || [task.siteCode,task.projectName].filter(Boolean).join('｜')),
      owner:clean_(task.owner),
      dueDate:clean_(task.dueDate),
      status:clean_(task.displayStatus || task.status),
      overdue:!!task.overdue
    });
  });
  const order = {'北區':1,'中區':2,'南區':3,'東區':4,'離島':5,'未分類':9};
  return Object.keys(groups).map(function(key){
    groups[key].items.sort(function(a,b){
      return Number(b.overdue)-Number(a.overdue) ||
        (a.dueDate || '9999').localeCompare(b.dueDate || '9999');
    });
    groups[key].items = groups[key].items.slice(0,120);
    return groups[key];
  }).sort(function(a,b){return (order[a.area]||8)-(order[b.area]||8);});
}

/**
 * 首頁原本分三次讀取：Dashboard、整月日曆、指定日期。
 * V20.3 合成單一請求，同一 execution 只建立一次工作表快照。
 */
function getDashboardBundleV203(payload) {
  payload = payload || {};
  const user = requireFeatureV192_(payload.token,'DASHBOARD','view');
  const month = clean_(payload.month) || dateOnly_(new Date()).substring(0,7);
  const selectedDate = clean_(payload.selectedDate) || dateOnly_(new Date());

  const started = Date.now();
  const dashboard = getDashboardV17(payload.token);
  const calendar = getHomeCalendarV183({token:payload.token,month:month});
  calendar.items = (calendar.items || []).map(normalizeCalendarItemV203_);
  let allTasks = [];
  if (hasFeatureV192_(user,'TASK','view')) {
    allTasks = listTaskCardsV17({
      token:payload.token,keyword:'',hideDone:true,limit:3000
    });
  }
  const projects = compactProjectIndexV203_(payload.token);
  const result = {
    version:PSS_V203.VERSION,
    generatedAt:new Date().toISOString(),
    dashboard:dashboard,
    calendar:calendar,
    day:{
      date:selectedDate,
      items:calendar.items.filter(function(item){return item.date === selectedDate;})
    },
    regionWork:buildRegionWorkV203_(projects,allTasks),
    performance:{serverMs:Date.now()-started},
    cache:'miss'
  };
  console.info('[PERF V20.3] 首頁合併讀取 ' + result.performance.serverMs + 'ms');
  return result;
}

function ensurePerformanceSheetV203_() {
  return getOrCreateSheet_(PSS_V203.PERFORMANCE_SHEET,[
    '時間','應用','功能','總耗時ms','後端耗時ms','資料筆數',
    '工號','裝置','狀態','備註'
  ]);
}

function recordClientPerformanceV203(payload) {
  payload = payload || {};
  const user = requireUser_(payload.token);
  const totalMs = Math.max(0,Number(payload.totalMs || 0));
  if (totalMs < PSS_V203.CLIENT_SLOW_MS && clean_(payload.status) !== 'ERROR') {
    return {ok:true,recorded:false};
  }
  try {
    appendObject_(ensurePerformanceSheetV203_(),{
      '時間':new Date(),
      '應用':clean_(payload.app || 'PMO'),
      '功能':clean_(payload.action).slice(0,120),
      '總耗時ms':totalMs,
      '後端耗時ms':Math.max(0,Number(payload.serverMs || 0)),
      '資料筆數':Math.max(0,Number(payload.count || 0)),
      '工號':clean_(user.employeeId || user.account),
      '裝置':clean_(payload.device).slice(0,120),
      '狀態':clean_(payload.status || 'OK'),
      '備註':clean_(payload.note).slice(0,1000)
    });
    return {ok:true,recorded:true};
  } catch (error) {
    console.warn('[PERF V20.3] 效能紀錄略過：' + error.message);
    return {ok:false,recorded:false};
  }
}

/* ========================================================================
 * PSS AI-PMO V20.4 final entrypoints.
 * Implementations are in V204_Upgrade.gs. These declarations intentionally
 * override the legacy V18/V19/V20.3 entrypoints above.
 * ======================================================================== */
function ensureDailyHeadersV183_(){return ensureDailyHeadersV204_();}
function dailyDefinitions_(){return dailyDefinitionsV204_();}
function saveDailyReportBatchV183(payload){return saveDailyReportBatchV204_(payload);}
function normalizeDailyReportV183_(report){return normalizeDailyReportV204_(report);}
function listDailyReportsV17(params){return listDailyReportsV204_(params);}
function getDailyReportV183(token,reportId){return getDailyReportV204_(token,reportId);}
function updateDailyReportV183(payload){return updateDailyReportV204_(payload);}
function getGanttContextV192(payload){return getPortfolioDashboardV204(payload);}
function setupMeetingSheetsV192_(){return 0;}
function setupPssAiPmoV20(){return setupPssAiPmoV204();}
function runV20SelfTest(){return runV204SelfTest();}
function onOpen(){
  SpreadsheetApp.getUi().createMenu('PSS AI-PMO V20.4')
    .addItem('初始化／升級 V20.4','setupPssAiPmoV204')
    .addItem('V20.4 自我檢查','runV204SelfTest')
    .addItem('V20.4 遷移預覽','previewV204Migration')
    .addItem('建立遷移前完整備份','backupV204Database')
    .addSeparator()
    .addItem('清除效能快取','clearPssCacheV1922')
    .addToUi();
}
function doGet(e){
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('PSS AI-PMO V20.4')
    .addMetaTag('viewport','width=device-width, initial-scale=1, maximum-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}


/* ========================================================================
 * PSS AI-PMO V20.4 R4.2｜快速登入、專案即時搜尋、工作附件
 * 2026-08-04
 * ======================================================================== */
const PSS_R42 = Object.freeze({
  VERSION:'V20.4 R4.2 Fast UX',
  SESSION_CACHE_SECONDS:21600,
  SESSION_PERSIST_MS:10*60*1000,
  AUTH_RECHECK_SECONDS:300,
  ACCESS_CACHE_SECONDS:180,
  ACCOUNT_CACHE_SECONDS:600,
  HEARTBEAT_WRITE_SECONDS:300,
  PROJECT_CACHE_SECONDS:1800,
  MAX_FILE_COUNT:12,
  MAX_SINGLE_BYTES:8*1024*1024,
  MAX_TOTAL_BYTES:20*1024*1024
});

function r42CacheGet_(key){
  try{const text=CacheService.getScriptCache().get(key);return text?JSON.parse(text):null;}catch(ignore){return null;}
}
function r42CachePut_(key,value,seconds){
  try{CacheService.getScriptCache().put(key,JSON.stringify(value),Math.min(Number(seconds||300),21600));}catch(ignore){}
}
function r42AccountIndexKey_(){return'PSS_R42_EMPLOYEE_INDEX';}
function r42AccessKey_(employeeId){return'PSS_R42_ACCESS_'+normalizeEmployeeIdV20_(employeeId);}
function r42AuthKey_(employeeId){return'PSS_R42_AUTH_'+normalizeEmployeeIdV20_(employeeId);}
function r42HeartbeatKey_(token){return'PSS_R42_HB_'+sessionHashV20_(token);}
function r42ProjectKey_(){return'PSS_R42_PROJECT_INDEX';}
function invalidateFastCachesR42(){
  const cache=CacheService.getScriptCache();
  [r42AccountIndexKey_(),r42ProjectKey_(),'PSS_V1922_QUICK_ALL'].forEach(function(key){try{cache.remove(key);}catch(ignore){}});
  return'R4.2 快取已清除。';
}

/* Session 改為快取優先；每 10 分鐘才寫回 Script Properties。 */
function putSession_(token,user){
  const now=Date.now(),key=APP.SESSION_PREFIX+token;
  const session={user:user,lastActive:now,expiresAt:now+PSS_V183.INACTIVITY_SECONDS*1000,persistedAt:now};
  const text=JSON.stringify(session);
  CacheService.getScriptCache().put(key,text,PSS_R42.SESSION_CACHE_SECONDS);
  PropertiesService.getScriptProperties().setProperty(key,text);
}
function getSession_(token){
  if(!token)return null;
  const key=APP.SESSION_PREFIX+token,cache=CacheService.getScriptCache(),props=PropertiesService.getScriptProperties();
  let text=cache.get(key),fromProps=false;
  if(!text){text=props.getProperty(key);fromProps=!!text;}
  if(!text)return null;
  try{
    const session=JSON.parse(text),now=Date.now(),last=Number(session.lastActive||0),expires=Number(session.expiresAt||0);
    if((last&&now-last>PSS_V183.INACTIVITY_SECONDS*1000)||(expires&&expires<now)){removeSession_(token);return null;}
    session.lastActive=now;session.expiresAt=now+PSS_V183.INACTIVITY_SECONDS*1000;
    if(!session.persistedAt)session.persistedAt=now;
    let next=JSON.stringify(session);
    cache.put(key,next,PSS_R42.SESSION_CACHE_SECONDS);
    if(fromProps||now-Number(session.persistedAt||0)>=PSS_R42.SESSION_PERSIST_MS){
      session.persistedAt=now;next=JSON.stringify(session);props.setProperty(key,next);cache.put(key,next,PSS_R42.SESSION_CACHE_SECONDS);
    }
    return session.user||null;
  }catch(error){removeSession_(token);return null;}
}
function removeSession_(token){
  if(!token)return;
  const key=APP.SESSION_PREFIX+token;
  try{CacheService.getScriptCache().remove(key);}catch(ignore){}
  try{PropertiesService.getScriptProperties().deleteProperty(key);}catch(ignore){}
}

function employeeIndexR42_(force){
  if(!force){const cached=r42CacheGet_(r42AccountIndexKey_());if(cached)return cached;}
  const ss=getDb_(),index={},names=['人員帳號','帳號管理'];
  for(let s=0;s<names.length;s++){
    const sheet=ss.getSheetByName(names[s]);
    if(!sheet||sheet.getLastRow()<2)continue;
    ensureHeaders_(sheet,['工號','黑名單','黑名單原因','最後活動','最後登入裝置','禁止登入時間','禁止登入設定者']);
    const values=sheet.getDataRange().getValues(),map=headerMap_(values[0].map(clean_));
    for(let i=1;i<values.length;i++){
      const row=values[i],employeeId=normalizeEmployeeIdV20_(readField_(row,map,['工號','帳號','使用者帳號']));
      if(!employeeId||index[employeeId])continue;
      const record={sheetName:sheet.getName(),rowNumber:i+1,row:row,map:map};
      const user=userFromAccountV1921_(record);user.account=employeeId;user.employeeId=employeeId;
      index[employeeId]={sheetName:sheet.getName(),rowNumber:i+1,user:user,status:user.status,
        blacklisted:isBlacklistedV20_(record),reason:blacklistReasonV20_(record)};
    }
  }
  r42CachePut_(r42AccountIndexKey_(),index,PSS_R42.ACCOUNT_CACHE_SECONDS);
  return index;
}
function findEmployeeFastR42_(employeeId,force){return employeeIndexR42_(force)[normalizeEmployeeIdV20_(employeeId)]||null;}
function accessFastR42_(user,force){
  const key=r42AccessKey_(user.employeeId||user.account);
  if(!force){const cached=r42CacheGet_(key);if(cached)return cached;}
  const access=buildAccessV1921_(user);r42CachePut_(key,access,PSS_R42.ACCESS_CACHE_SECONDS);return access;
}

/* 每個 API 不再反覆掃描 171 欄帳號表；最多每 5 分鐘重新驗證一次。 */
function requireUser_(token){
  const user=getSession_(token);
  if(!user)throw new Error('登入已逾時，請重新以工號登入。');
  const employeeId=normalizeEmployeeIdV20_(user.employeeId||user.account);
  if(!employeeId){removeSession_(token);throw new Error('登入資料不完整，請重新登入。');}
  const cache=CacheService.getScriptCache();
  if(!cache.get(r42AuthKey_(employeeId))){
    const target=findEmployeeFastR42_(employeeId,false);
    if(!target||target.status!=='啟用'||target.blacklisted){
      removeSession_(token);closePresenceV20_(token,'已撤銷');throw new Error('此工號目前禁止使用。');
    }
    cache.put(r42AuthKey_(employeeId),'1',PSS_R42.AUTH_RECHECK_SECONDS);
  }
  return user;
}

/* 登入只做必要驗證及一次資料列更新；在線紀錄改為前端背景寫入。 */
function loginV17(payload){
  payload=payload||{};
  const employeeId=normalizeEmployeeIdV20_(payload.employeeId||payload.account||payload.username),deviceId=clean_(payload.deviceId),app=clean_(payload.app)||'PMO';
  if(!employeeId)throw new Error('請輸入正確工號。');
  if(!deviceId)throw new Error('無法識別此裝置，請重新整理後再登入。');
  let target=findEmployeeFastR42_(employeeId,false);
  if(!target)target=findEmployeeFastR42_(employeeId,true);
  if(!target)throw new Error('此工號尚未建檔，請洽陳彥均主管。');
  if(target.status!=='啟用')throw new Error('此工號目前未啟用。');
  if(target.blacklisted)throw new Error('此工號已禁止登入：'+(target.reason||'請洽主管'));
  const user=target.user;user.account=employeeId;user.employeeId=employeeId;
  const sheet=getDb_().getSheetByName(target.sheetName),now=new Date();
  writeObject_(sheet,target.rowNumber,{'帳號':employeeId,'工號':employeeId,'使用者ID':user.id,'最後登入時間':now,'最後活動':now,'最後登入裝置':deviceId});
  CacheService.getScriptCache().remove(r42AccountIndexKey_());
  CacheService.getScriptCache().put(r42AuthKey_(employeeId),'1',PSS_R42.AUTH_RECHECK_SECONDS);
  const token=randomToken_(64);putSession_(token,user);
  return{token:token,user:user,access:accessFastR42_(user,false),version:PSS_R42.VERSION,deferredAudit:true,app:app};
}
function getCurrentUserV17(token){const user=requireUser_(token);return{user:user,access:accessFastR42_(user,false),version:PSS_R42.VERSION};}
function recordLoginActivityR42(payload){
  payload=payload||{};const user=requireUser_(payload.token);
  try{touchPresenceV20_(payload.token,user,clean_(payload.app)||'PMO',clean_(payload.deviceId),'在線',clean_(payload.userAgent));}catch(error){console.warn('R4.2 presence: '+error.message);}
  try{operationLog_(user,'工號登入','身分驗證',user.id,{app:clean_(payload.app)||'PMO',deviceId:clean_(payload.deviceId),version:PSS_R42.VERSION},'成功');}catch(error){console.warn('R4.2 login log: '+error.message);}
  CacheService.getScriptCache().put(r42HeartbeatKey_(payload.token),'1',PSS_R42.HEARTBEAT_WRITE_SECONDS);
  return{ok:true};
}
function heartbeatV20(payload){
  payload=payload||{};const user=requireUser_(payload.token),cache=CacheService.getScriptCache(),key=r42HeartbeatKey_(payload.token);
  if(cache.get(key))return{ok:true,throttled:true,serverTime:dateTime_(new Date())};
  try{touchPresenceV20_(payload.token,user,clean_(payload.app)||'PMO',clean_(payload.deviceId),'在線',clean_(payload.userAgent));}catch(ignore){}
  cache.put(key,'1',PSS_R42.HEARTBEAT_WRITE_SECONDS);
  return{ok:true,throttled:false,serverTime:dateTime_(new Date())};
}

/* 精簡專案索引：前端只載入一次，其後全部在瀏覽器本機搜尋。 */
function getProjectIndexR42(token,force){
  requireUser_(token);
  const cache=CacheService.getScriptCache();
  if(!force){const cached=r42CacheGet_(r42ProjectKey_());if(cached)return cached;}
  const projects=compactProjectIndexV203_(token);
  const result={generatedAt:new Date().toISOString(),version:PSS_R42.VERSION,projects:projects,count:projects.length};
  r42CachePut_(r42ProjectKey_(),result,PSS_R42.PROJECT_CACHE_SECONDS);
  return result;
}
function invalidateProjectIndexR42(token){requireUser_(token);CacheService.getScriptCache().remove(r42ProjectKey_());CacheService.getScriptCache().remove('PSS_V1922_QUICK_ALL');return{ok:true};}

function blockedExtensionR42_(name){return/\.(exe|msi|bat|cmd|ps1|vbs|scr|com|jar)$/i.test(String(name||''));}
function approximateBytesR42_(base64){const text=String(base64||'').split(',').pop();return Math.floor(text.length*3/4);}
function validateFilesR42_(files){
  files=Array.isArray(files)?files:[];
  if(files.length>PSS_R42.MAX_FILE_COUNT)throw new Error('單次最多上傳 '+PSS_R42.MAX_FILE_COUNT+' 個檔案。');
  let total=0;
  files.forEach(function(file){
    const name=clean_(file.fileName||file.name)||'未命名檔案',bytes=approximateBytesR42_(file.base64);
    if(blockedExtensionR42_(name))throw new Error('基於安全性禁止上傳：'+name);
    if(bytes>PSS_R42.MAX_SINGLE_BYTES)throw new Error(name+' 超過單檔 8 MB。');
    total+=bytes;
  });
  if(total>PSS_R42.MAX_TOTAL_BYTES)throw new Error('附件總大小超過 20 MB。');
  return files;
}
function saveWorkFilesR42_(data){
  const files=validateFilesR42_(data.files||[]),result={links:[],folderUrl:'',files:[]};
  if(!files.length)return result;
  const projectFolder=findOrCreateProjectFolderV17_(data.siteCode,data.projectName),tracking=findOrCreateChildFolderV17_(projectFolder,'03_專案追蹤記錄');
  const folder=findOrCreateChildFolderV17_(tracking,safeFileName_((data.date||dateOnly_(new Date()))+'_'+(data.kind||'工作附件')+'_'+String(data.title||'未命名').slice(0,50)));
  files.forEach(function(fileData,index){
    const raw=String(fileData.base64||'').split(',').pop();if(!raw)return;
    const original=clean_(fileData.fileName||fileData.name)||('附件_'+(index+1)),name=safeFileName_(original);
    const blob=Utilities.newBlob(Utilities.base64Decode(raw),clean_(fileData.mimeType)||'application/octet-stream',name),file=folder.createFile(blob);
    result.links.push(file.getUrl());result.files.push({name:file.getName(),url:file.getUrl(),mimeType:file.getMimeType()});
  });
  result.folderUrl=folder.getUrl();return result;
}
function appendAttachmentRowsR42_(taskIds,saved,user,siteCode,projectName){
  if(!saved.files.length)return;
  const sheet=getEventAttachmentSheetV182_(true),objects=[];
  (taskIds||[]).forEach(function(taskId){saved.files.forEach(function(file){objects.push({'附件ID':makeId_('A'),'回報ID':taskId,'上傳時間':new Date(),'人員':user.name,'場地代號':siteCode,'專案名稱':projectName,'檔名':file.name,'檔案連結':file.url,'檔案類型':file.mimeType,'備註':'任務附件','資料夾':saved.folderUrl});});});
  appendObjectsV1922_(sheet,objects);
}
function createTasksWithFilesR42(payload){
  payload=payload||{};const user=requireManager_(payload.token);
  const saved=saveWorkFilesR42_({files:payload.files||[],siteCode:clean_(payload.siteCode),projectName:clean_(payload.projectName),title:clean_(payload.content),kind:'任務附件',date:dateOnly_(new Date())});
  const result=createTasksMultiOwnerV17(Object.assign({},payload,{attachment:saved.links.join('\n'),folderUrl:saved.folderUrl}));
  appendAttachmentRowsR42_((result.tasks||[]).map(function(t){return t.taskId;}),saved,user,clean_(payload.siteCode),clean_(payload.projectName));
  return Object.assign({},result,{files:saved.files,folderUrl:saved.folderUrl});
}
function updateTaskWithFilesR42(payload){
  payload=payload||{};const user=requireUser_(payload.token),sheet=getSheet_('TASKS'),target=readCanonical_(sheet,taskDefinitions_()).find(function(t){return clean_(t.taskId)===clean_(payload.taskId);});
  if(!target)throw new Error('找不到任務。');
  const manager=isManager_(user);if(!manager&&clean_(target.owner)!==user.name&&clean_(target.manager)!==user.name)throw new Error('你沒有權限更新此任務。');
  const saved=saveWorkFilesR42_({files:payload.files||[],siteCode:clean_(payload.siteCode)||clean_(target.siteCode),projectName:clean_(payload.projectName)||clean_(target.projectName),title:clean_(payload.content)||clean_(target.content),kind:'任務附件',date:dateOnly_(new Date())});
  const object={'更新時間':new Date()};
  if(payload.status!==undefined){object['狀態']=clean_(payload.status);if(object['狀態']==='已完成')object['完成日']=new Date();}
  if(manager){
    const mapping={'任務內容':'content','負責人':'owner','優先級':'priority','預計完成日':'dueDate','備註':'note','任務類型':'taskType','場地代號':'siteCode','專案名稱':'projectName','通知人員':'notifyPeople'};
    Object.keys(mapping).forEach(function(field){const key=mapping[field];if(payload[key]!==undefined)object[field]=clean_(payload[key]);});
  }
  if(saved.links.length){object['照片/附件上傳']=[clean_(target.attachment),saved.links.join('\n')].filter(Boolean).join('\n');object['照片/附件']=object['照片/附件上傳'];object['雲端資料夾']=saved.folderUrl;}
  writeObject_(sheet,target.__rowNumber,object);appendAttachmentRowsR42_([clean_(payload.taskId)],saved,user,clean_(target.siteCode),clean_(target.projectName));
  operationLog_(user,'更新任務與附件','任務派工',payload.taskId,object,'成功');return'任務已更新。';
}
function updateDailyReportWithFilesR42(payload){
  payload=payload||{};const user=requireUser_(payload.token);
  updateDailyReportV183(payload);
  const sheet=ensureDailyHeadersV204_(),target=readCanonical_(sheet,dailyDefinitionsV204_()).find(function(item){return clean_(item.reportId)===clean_(payload.reportId);});
  if(!target)return'每日回報已更新。';
  const saved=saveWorkFilesR42_({files:payload.files||[],siteCode:clean_(payload.siteCode)||clean_(target.siteCode),projectName:clean_(payload.projectName)||clean_(target.projectName),title:clean_(payload.eventTitle)||clean_(target.eventTitle),kind:'工作回報附件',date:clean_(payload.date)||dateOnly_(target.date)});
  if(saved.links.length){
    const merged=[clean_(target.attachment),saved.links.join('\n')].filter(Boolean).join('\n');
    writeObject_(sheet,target.__rowNumber,{'附件連結':merged,'施工照片連結':merged,'雲端資料夾':saved.folderUrl,'更新時間':new Date()});
    appendAttachmentRowsR42_([clean_(payload.reportId)],saved,user,clean_(payload.siteCode)||clean_(target.siteCode),clean_(payload.projectName)||clean_(target.projectName));
  }
  return saved.links.length?'每日回報與附件已更新。':'每日回報已更新。';
}
function setupPssFastUxR42(){invalidateFastCachesR42();PropertiesService.getScriptProperties().setProperty('PSS_R42_INSTALLED',new Date().toISOString());return PSS_R42.VERSION+' 已啟用：快速登入、專案本機索引、任務與回報附件。';}


/* =========================================================================
 * PSS AI-PMO V20.4 R4.7｜登入只記錄、全功能開放、減少登入等待
 * - 不再依角色、權限、狀態或黑名單阻擋。
 * - 登入只建立工作階段；登入紀錄在畫面進入後背景寫入。
 * - 不再每分鐘寫入在線心跳。
 * ========================================================================= */
const PSS_R47=Object.freeze({
  VERSION:'V20.4 R4.7 Record-only Access',
  DB_ID:'11ndvBcV0geEF7oJv1kX28BuC4_kAKnl37wUhL-Rx27g',
  LOGIN_LOG:'SYS_R47_登入紀錄',
  SESSION_SECONDS:43200,
  MAIN_URL:'https://script.google.com/macros/s/AKfycbzanBhLhKxyw7G0jrnXjmOVT6MDgDj_flY20xaz2oWwRPY3Te-UdD1j6Bmp0SB_ksgWng/exec',
  MEETING_URL:'https://script.google.com/macros/s/AKfycbzsns5x5sT-nSmKuz1J-4tw4SNky1o0WEeWgvB_FGwWMznVHdmjn1AVlmq26aILdphq/exec',
  QUOTE_URL:'https://script.google.com/macros/s/AKfycbxjcp9rqqxZGSVJHzFBNltzlqkH_KikTSKBxqP2X7Cu_GdwrLhcvXPa2rF1HQ3XaYot/exec'
});

function r47Text_(value,max){
  return String(value==null?'':value).replace(/[\u0000\r\n\t]+/g,' ').trim().slice(0,max||160);
}
function r47LoginId_(value){return r47Text_(value,80);}
function r47OpenModules_(){
  const out={};
  try{
    (PSS_V192.FEATURES||[]).forEach(function(f){out[String(f.code||'').toUpperCase()]={view:true,edit:true,source:'R4.7 開放操作'};});
  }catch(ignore){}
  ['DASHBOARD','DISPATCH','TASK','REPORT','PROJECT','DRIVE','GANTT','TRAINING','ADMIN','QUOTE','MEETING'].forEach(function(k){
    if(!out[k])out[k]={view:true,edit:true,source:'R4.7 開放操作'};
  });
  return out;
}
function r47Access_(){
  return {
    manager:true,modules:r47OpenModules_(),
    canDispatch:true,canManageProjects:true,canManageUsers:true,
    canEditAnnouncements:true,canEditDocuments:true,canEditTraining:true,
    canViewAllTasks:true,canViewAllReports:true,canViewOperationLogs:true,
    canManageSettings:true,quoteView:true,quoteEdit:true
  };
}
function isManager_(user){return !!user;}
function accessFor_(user){return r47Access_();}
function effectivePermissionMapV192_(user){return r47OpenModules_();}
function hasFeatureV192_(user,featureCode,action){return true;}
function requireFeatureV192_(token,featureCode,action){return requireUser_(token);}
function requireManager_(token){return requireUser_(token);}
function buildAccessV1921_(user){return r47Access_();}

function requireUser_(token){
  const user=getSession_(token);
  if(!user)throw new Error('登入已逾時，請重新輸入登入帳號。');
  return user;
}
function loginV17(payload){
  payload=payload||{};
  const login=r47LoginId_(payload.employeeId||payload.account||payload.username||payload.login);
  if(!login)throw new Error('請輸入登入帳號。');
  const user={
    id:'LOGIN_'+login,account:login,employeeId:login,
    name:r47Text_(payload.displayName||login,80),
    email:'',role:'使用者',permission:'開放操作',status:'登入紀錄'
  };
  const token=randomToken_(64);
  putSession_(token,user);
  return{token:token,user:user,access:r47Access_(),version:PSS_R47.VERSION,deferredAudit:true,app:r47Text_(payload.app||'PMO',30)};
}
function getCurrentUserV17(token){
  const user=requireUser_(token);
  return{user:user,access:r47Access_(),version:PSS_R47.VERSION};
}
function registerAccountV17(payload){
  return 'R4.7 不需申請帳號；輸入登入帳號即可使用，系統只保留登入紀錄。';
}
function r47EnsureLoginLog_(){
  const ss=SpreadsheetApp.openById(PSS_R47.DB_ID);
  let sh=ss.getSheetByName(PSS_R47.LOGIN_LOG);
  const headers=['紀錄ID','登入時間','登入帳號','顯示名稱','應用程式','動作','裝置ID','來源','UserAgent','狀態'];
  if(!sh){
    sh=ss.insertSheet(PSS_R47.LOGIN_LOG);
    sh.getRange(1,1,1,headers.length).setValues([headers]);
    sh.setFrozenRows(1);
  }
  return sh;
}
function r47WriteLoginLog_(user,app,device,userAgent,action){
  try{
    r47EnsureLoginLog_().appendRow([
      'LG-'+Utilities.getUuid().slice(0,12),new Date(),
      r47Text_(user&& (user.employeeId||user.account),80),
      r47Text_(user&&user.name,80),r47Text_(app||'PMO',30),
      r47Text_(action||'登入',30),r47Text_(device,120),
      'Web App',r47Text_(userAgent,300),'成功'
    ]);
  }catch(error){console.warn('R4.7 login log: '+error.message);}
}
function recordLoginActivityR42(payload){
  payload=payload||{};
  const user=requireUser_(payload.token);
  r47WriteLoginLog_(user,payload.app||'PMO',payload.deviceId,payload.userAgent,'登入');
  return{ok:true,version:PSS_R47.VERSION};
}
function heartbeatV20(payload){
  return{ok:true,throttled:true,recordOnly:true,serverTime:dateTime_(new Date())};
}
function listOnlineUsersV20(token){
  requireUser_(token);
  const sh=SpreadsheetApp.openById(PSS_R47.DB_ID).getSheetByName(PSS_R47.LOGIN_LOG);
  if(!sh||sh.getLastRow()<2)return[];
  const v=sh.getRange(Math.max(2,sh.getLastRow()-99),1,Math.min(100,sh.getLastRow()-1),10).getDisplayValues();
  return v.reverse().map(function(r){
    return{employeeId:r[2],name:r[3]||r[2],role:'登入紀錄',app:r[4],deviceId:r[6],loginAt:r[1],lastSeen:r[1],expiresAt:''};
  });
}
function createQuickLoginV20(payload){
  payload=payload||{};
  const user=requireUser_(payload.token),target=String(payload.targetApp||'').toUpperCase();
  const base=target==='MEETING'?PSS_R47.MEETING_URL:PSS_R47.QUOTE_URL;
  if(!base)throw new Error('尚未設定目標程式網址。');
  return{ok:true,targetApp:target,url:base+(base.indexOf('?')>=0?'&':'?')+'login='+encodeURIComponent(user.employeeId||user.account)+'&source=PMO&r47=1',expiresIn:0,version:PSS_R47.VERSION};
}
