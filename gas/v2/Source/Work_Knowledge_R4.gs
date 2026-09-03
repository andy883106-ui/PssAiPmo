/**
 * PSS AI-PMO V20.4 R4 — 工作關聯抽屜與教育訓練知識中心
 * 本檔刻意獨立於大型 Code.gs，避免新增 doGet/onOpen/既有 API 重複宣告。
 */
const PSS_R4 = Object.freeze({
  VERSION: 'V20.4 R4.8 Drawer + Native Learning Center',
  SCHEMA_VERSION: '20.4.4.1',
  MAX_RESOURCES: 1500,
  MAX_RELATED: 40,
  SHEETS: Object.freeze({
    MATERIAL_META: '教材擴充資料',
    TAGS: '知識標籤',
    PATHS: '學習路徑',
    PATH_ITEMS: '學習路徑明細',
    PROGRESS: '學習紀錄',
    USAGE: '知識使用紀錄',
    CLOUD_INDEX: '知識雲端索引',
    AUDIT: '欄位對齊稽核'
  })
});

function setupPssAiPmoV204R4() {
  if (typeof setupPssAiPmoV204 === 'function') setupPssAiPmoV204();
  ensureKnowledgeSheetsR4_();
  seedKnowledgeTagsR4_();
  seedLearningPathsR4_();
  rebuildAlignmentAuditR4_();
  PropertiesService.getScriptProperties().setProperty('PSS_V204_R4_INSTALLED', new Date().toISOString());
  return [
    'PSS AI-PMO V20.4 R4 初始化完成。',
    '工作事項／專案：關聯抽屜 API 已啟用',
    '教育訓練：知識中心、熱門標籤、學習路徑、進度紀錄已啟用',
    '資料庫：' + getDb_().getName(),
    '版本：' + PSS_R4.VERSION
  ].join('\n');
}

function installPssAiPmoV204R4() {
  return setupPssAiPmoV204R4();
}

function ensureKnowledgeSheetsR4_() {
  getOrCreateSheet_(PSS_R4.SHEETS.MATERIAL_META, [
    '資源ID','難度','預估分鐘','熱門','標籤','封面連結','來源類型','來源ID',
    '適用角色','適用專案','設備型號','建立時間','更新時間','備註'
  ]);
  getOrCreateSheet_(PSS_R4.SHEETS.TAGS, [
    '標籤ID','標籤名稱','分類','同義詞','熱門分數','狀態','建立時間','更新時間'
  ]);
  getOrCreateSheet_(PSS_R4.SHEETS.PATHS, [
    '路徑ID','路徑名稱','說明','適用角色','難度','標籤查詢','排序','狀態','建立時間','更新時間'
  ]);
  getOrCreateSheet_(PSS_R4.SHEETS.PATH_ITEMS, [
    '明細ID','路徑ID','資源ID','順序','必修','備註','建立時間','更新時間'
  ]);
  getOrCreateSheet_(PSS_R4.SHEETS.PROGRESS, [
    '紀錄ID','使用者ID','帳號','姓名','資源ID','路徑ID','進度%','狀態','開始時間',
    '完成時間','最後瀏覽時間','評分','備註','更新時間'
  ]);
  getOrCreateSheet_(PSS_R4.SHEETS.USAGE, [
    '使用紀錄ID','時間','使用者ID','帳號','姓名','資源ID','動作','來源頁面','場地代號',
    '專案名稱','關鍵字','備註'
  ]);
  getOrCreateSheet_(PSS_R4.SHEETS.CLOUD_INDEX, [
    '索引ID','同步時間','資源ID','場地代號','專案名稱','分類','名稱','連結','MimeType',
    '更新時間','父層資料夾','路徑','標籤','狀態'
  ]);
  getOrCreateSheet_(PSS_R4.SHEETS.AUDIT, [
    '稽核時間','工作表','狀態','必要欄位','缺少欄位','重複欄位','空白標題有資料欄','功能影響','建議處理'
  ]);
}

function seedKnowledgeTagsR4_() {
  const sheet = getSheet_(PSS_R4.SHEETS.TAGS);
  const rows = readCanonical_(sheet, {
    id:['標籤ID'], name:['標籤名稱'], status:['狀態']
  });
  const existing = {};
  rows.forEach(function(row) { existing[clean_(row.name)] = true; });
  const seeds = [
    ['PM流程','專案管理','專案流程,PM,交接',95],
    ['每日回報','專案管理','工作日誌,工作回報',92],
    ['派工','專案管理','任務,工作事項',90],
    ['圖面','工程技能','CAD,竣工圖,架構圖',98],
    ['CAD','工程技能','AutoCAD,繪圖',96],
    ['停管','系統','停車場,停車系統',100],
    ['門禁','系統','Access Control,讀頭,鎖頭',98],
    ['訪客','系統','訪客機,通關機',94],
    ['梯控','系統','電梯,樓層控制',90],
    ['車牌辨識','設備','LPR,攝影機',88],
    ['柵欄機','設備','閘門,道閘',86],
    ['感應線圈','設備','地感,防砸',84],
    ['網路','工程技能','IP,Switch,Router,CAT6',93],
    ['電源','工程技能','110V,220V,UPS',91],
    ['施工','工程流程','配管,配線,安裝',97],
    ['驗收','工程流程','測試,點驗,移交',95],
    ['維修','工程流程','異常,排除,故障',92],
    ['機器人','系統','MT1,CC1,清掃機器人',82],
    ['批價機','系統','醫院,繳費機',80],
    ['範例','資源類型','案例,樣板',99],
    ['表格','資源類型','Excel,Sheet,範本',99],
    ['SOP','資源類型','標準作業,操作手冊',99],
    ['新人','角色','入門,新進人員',96]
  ];
  seeds.forEach(function(seed) {
    if (existing[seed[0]]) return;
    appendObject_(sheet, {
      '標籤ID':makeId_('TAG'), '標籤名稱':seed[0], '分類':seed[1], '同義詞':seed[2],
      '熱門分數':seed[3], '狀態':'啟用', '建立時間':new Date(), '更新時間':new Date()
    });
  });
}

function seedLearningPathsR4_() {
  const sheet = getSheet_(PSS_R4.SHEETS.PATHS);
  const rows = readCanonical_(sheet, {id:['路徑ID']});
  const existing = {};
  rows.forEach(function(row) { existing[clean_(row.id)] = true; });
  const seeds = [
    ['PATH_NEW_PM','新人 PM 基礎','從專案流程、派工、每日回報到檔案歸檔的工作起點。','新人／工程師','入門','新人,PM流程,派工,每日回報,表格',10],
    ['PATH_PARKING','停管系統入門','認識車道設備、網路、電源、感應線圈及現場測試。','工程師／PM','入門','停管,車牌辨識,柵欄機,感應線圈,網路,電源',20],
    ['PATH_ACCESS','門禁／訪客／梯控整合','讀頭、鎖頭、通關機、訪客機與電梯介面的整合知識。','工程師／PM','中階','門禁,訪客,梯控,通關機,網路',30],
    ['PATH_DRAWING','圖面與 CAD 實作','由設備點位、架構圖、昇位圖到竣工圖的實作路徑。','繪圖工程師／PM','中階','圖面,CAD,架構圖,竣工圖,範例',40],
    ['PATH_SITE','現場施工與驗收','配管配線、安裝、測試、驗收及異常排除。','工程師／PM','中階','施工,電源,網路,驗收,維修,SOP',50]
  ];
  seeds.forEach(function(seed) {
    if (existing[seed[0]]) return;
    appendObject_(sheet, {
      '路徑ID':seed[0], '路徑名稱':seed[1], '說明':seed[2], '適用角色':seed[3],
      '難度':seed[4], '標籤查詢':seed[5], '排序':seed[6], '狀態':'啟用',
      '建立時間':new Date(), '更新時間':new Date()
    });
  });
}

function sheetByExactNameR4_(name) {
  return getDb_().getSheetByName(name);
}

function readExactSheetR4_(name, definitions) {
  const sheet = sheetByExactNameR4_(name);
  return sheet ? readCanonical_(sheet, definitions) : [];
}

function splitTagsR4_(value) {
  return unique_(String(value || '').split(/[,，、;；|｜\/\n]+/).map(clean_).filter(Boolean));
}

function canonicalTagR4_(value) {
  return clean_(value).replace(/系統$/,'').replace(/設備$/,'').replace(/管理$/,'');
}

function normalizeKnowledgeSearchR41_(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[（）()【】\[\]{}<>《》「」『』]/g, ' ')
    .replace(/[，、；;｜|/\\:_－—-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function resourceSearchTextR4_(resource) {
  return normalizeKnowledgeSearchR41_([
    resource.id, resource.sourceId, resource.title, resource.description,
    resource.category, resource.subcategory, resource.type,
    (resource.tags || []).join(' '), resource.audience, resource.roles,
    resource.owner, resource.source, resource.version, resource.model,
    resource.projects, resource.fileUrl, resource.folderUrl
  ].join(' '));
}

function knowledgeQueryTokensR41_(value) {
  return unique_(normalizeKnowledgeSearchR41_(value).split(' ').map(clean_).filter(Boolean));
}

function resourceMatchesQueryR41_(resource, query) {
  const tokens = knowledgeQueryTokensR41_(query);
  if (!tokens.length) return true;
  const text = resource.searchText || resourceSearchTextR4_(resource);
  return tokens.every(function(token) { return text.indexOf(token) >= 0; });
}

function inferResourceTagsR4_(resource, tagRows) {
  const text = resourceSearchTextR4_(Object.assign({}, resource, {tags:resource.tags || []}));
  let tags = [].concat(resource.tags || []);
  tagRows.forEach(function(tag) {
    const variants = [tag.name].concat(splitTagsR4_(tag.synonyms));
    if (variants.some(function(word) { return word && text.indexOf(String(word).toLowerCase()) >= 0; })) tags.push(tag.name);
  });
  [resource.category,resource.subcategory].forEach(function(value) {
    const tag = canonicalTagR4_(value);
    if (tag && tag.length <= 18) tags.push(tag);
  });
  return unique_(tags.map(clean_).filter(Boolean)).slice(0,12);
}

function normalizeDurationR4_(minutes, hours) {
  let value = Number(minutes || 0);
  if (!value && hours !== undefined && hours !== '') value = Math.round(Number(hours || 0) * 60);
  return isNaN(value) ? 0 : value;
}

function collectResourceMetadataR4_() {
  const rows = readExactSheetR4_(PSS_R4.SHEETS.MATERIAL_META, {
    resourceId:['資源ID'], level:['難度'], minutes:['預估分鐘'], featured:['熱門'], tags:['標籤'],
    coverUrl:['封面連結'], sourceType:['來源類型'], sourceId:['來源ID'], roles:['適用角色'],
    projects:['適用專案'], model:['設備型號'], updatedAt:['更新時間'], note:['備註']
  });
  const map = {};
  rows.forEach(function(row) { if (clean_(row.resourceId)) map[clean_(row.resourceId)] = row; });
  return map;
}

function collectTagRowsR4_() {
  return readExactSheetR4_(PSS_R4.SHEETS.TAGS, {
    id:['標籤ID'], name:['標籤名稱'], category:['分類'], synonyms:['同義詞'], score:['熱門分數'], status:['狀態']
  }).filter(function(row) { return clean_(row.status) !== '停用' && clean_(row.name); });
}

function collectUsageCountsR4_() {
  const counts = {};
  readExactSheetR4_(PSS_R4.SHEETS.USAGE, {resourceId:['資源ID'], action:['動作']}).forEach(function(row) {
    const id = clean_(row.resourceId);
    if (id) counts[id] = (counts[id] || 0) + 1;
  });
  return counts;
}

function collectAttendanceR4_(user) {
  const employeeRows = readExactSheetR4_('employees', {
    id:['ID'], employeeNo:['員工編號'], name:['姓名'], status:['狀態']
  });
  const employee = employeeRows.find(function(row) {
    return clean_(row.name) === clean_(user.name) || clean_(row.employeeNo) === clean_(user.account);
  });
  const courseCounts = {};
  const completed = {};
  readExactSheetR4_('attendance', {
    personId:['人員ID'], courseId:['課程ID'], attendance:['出席'], result:['結果'], test:['測驗'], practice:['實作']
  }).forEach(function(row) {
    const courseId = clean_(row.courseId);
    if (!courseId) return;
    courseCounts[courseId] = (courseCounts[courseId] || 0) + 1;
    if (employee && clean_(row.personId) === clean_(employee.id) && /完成|通過|合格/.test(clean_(row.result))) {
      completed[courseId] = 100;
    }
  });
  return {employee:employee,courseCounts:courseCounts,completed:completed};
}

function collectProgressR4_(user) {
  const map = {};
  readExactSheetR4_(PSS_R4.SHEETS.PROGRESS, {
    id:['紀錄ID'], userId:['使用者ID'], account:['帳號'], name:['姓名'], resourceId:['資源ID'],
    pathId:['路徑ID'], progress:['進度%'], status:['狀態'], lastViewed:['最後瀏覽時間'], updatedAt:['更新時間']
  }).forEach(function(row) {
    const sameUser = clean_(row.userId) === clean_(user.id) || clean_(row.account) === clean_(user.account) || clean_(row.name) === clean_(user.name);
    if (sameUser && clean_(row.resourceId)) map[clean_(row.resourceId)] = row;
  });
  return map;
}

function buildLearningResourcesR4_(user) {
  ensureKnowledgeSheetsR4_();
  const tagRows = collectTagRowsR4_();
  const metadata = collectResourceMetadataR4_();
  const usage = collectUsageCountsR4_();
  const attendance = collectAttendanceR4_(user);
  const progressMap = collectProgressR4_(user);
  let resources = [];

  readExactSheetR4_('教育訓練管理', {
    id:['教材ID'], category:['系統分類'], subcategory:['設備分類'], type:['教材類型'],
    title:['教材名稱'], version:['版本'], fileUrl:['檔案連結'], folderUrl:['資料夾連結'],
    owner:['負責人'], audience:['適用對象'], status:['狀態'], createdAt:['建立時間'],
    updatedAt:['更新時間'], description:['備註'], order:['排序']
  }).forEach(function(row) {
    const id = clean_(row.id);
    if (!id || clean_(row.status) === '停用' || !clean_(row.title)) return;
    resources.push({
      id:id, source:'教育訓練管理', sourceId:id, category:clean_(row.category)||'未分類',
      subcategory:clean_(row.subcategory)||'一般', type:clean_(row.type)||'資料夾', title:clean_(row.title),
      description:clean_(row.description), version:clean_(row.version), fileUrl:clean_(row.fileUrl),
      folderUrl:clean_(row.folderUrl), owner:clean_(row.owner), audience:clean_(row.audience),
      createdAt:dateTime_(row.createdAt), updatedAt:dateTime_(row.updatedAt), order:Number(row.order||999),
      duration:0, tags:[]
    });
  });

  readExactSheetR4_('教育訓練', {
    id:['教育訓練ID','訓練ID'], category:['分類'], title:['標題'], description:['說明','內容說明'],
    link:['連結'], fileUrl:['附件連結'], order:['排序'], status:['狀態'], owner:['建立者'],
    createdAt:['建立時間'], updatedAt:['更新時間'], note:['備註'], icon:['圖示']
  }).forEach(function(row) {
    const id = clean_(row.id);
    if (!id || clean_(row.status) === '停用' || !clean_(row.title)) return;
    resources.push({
      id:id, source:'教育訓練', sourceId:id, category:clean_(row.category)||'未分類', subcategory:'教材',
      type:'教材', title:clean_(row.title), description:[clean_(row.description),clean_(row.note)].filter(Boolean).join('\n'),
      version:'', fileUrl:clean_(row.fileUrl)||clean_(row.link), folderUrl:clean_(row.link), owner:clean_(row.owner),
      audience:'部門人員', createdAt:dateTime_(row.createdAt), updatedAt:dateTime_(row.updatedAt),
      order:Number(row.order||999), duration:0, tags:[], icon:clean_(row.icon)
    });
  });

  readExactSheetR4_('courses', {
    id:['ID'], title:['課程名稱'], category:['分類'], owner:['講師'], date:['日期'], hours:['時數'],
    passScore:['及格分數'], description:['說明'], createdAt:['建立時間']
  }).forEach(function(row) {
    const id = clean_(row.id);
    if (!id || !clean_(row.title)) return;
    resources.push({
      id:'COURSE:'+id, source:'課程紀錄', sourceId:id, category:clean_(row.category)||'課程', subcategory:'課程',
      type:'課程', title:clean_(row.title), description:clean_(row.description), version:'', fileUrl:'', folderUrl:'',
      owner:clean_(row.owner), audience:'部門人員', createdAt:dateTime_(row.createdAt), updatedAt:dateTime_(row.date),
      order:999, duration:normalizeDurationR4_(0,row.hours), tags:[], passScore:clean_(row.passScore),
      attendanceCount:attendance.courseCounts[id]||0
    });
  });

  ['常用文件檔案','常用文件'].forEach(function(sheetName) {
    readExactSheetR4_(sheetName, {
      id:['文件ID'], category:['分類'], title:['文件名稱','名稱'], description:['說明'], url:['路徑','網址','連結'],
      status:['狀態'], owner:['建立者'], createdAt:['建立時間'], updatedAt:['更新時間'], note:['備註']
    }).forEach(function(row) {
      const id = clean_(row.id) || ('DOC:'+sheetName+':'+clean_(row.title));
      if (!clean_(row.title) || clean_(row.status) === '停用') return;
      resources.push({
        id:id, source:sheetName, sourceId:id, category:clean_(row.category)||'常用文件', subcategory:'文件',
        type:'文件', title:clean_(row.title), description:[clean_(row.description),clean_(row.note)].filter(Boolean).join('\n'),
        version:'', fileUrl:clean_(row.url), folderUrl:'', owner:clean_(row.owner), audience:'全部',
        createdAt:dateTime_(row.createdAt), updatedAt:dateTime_(row.updatedAt), order:999, duration:0, tags:['表格']
      });
    });
  });

  const dedupe = {};
  resources.forEach(function(resource) {
    if (!dedupe[resource.id]) dedupe[resource.id] = resource;
    else {
      const old = dedupe[resource.id];
      Object.keys(resource).forEach(function(key) { if (!old[key] && resource[key]) old[key] = resource[key]; });
    }
  });
  resources = Object.keys(dedupe).map(function(id) { return dedupe[id]; });

  resources.forEach(function(resource) {
    const meta = metadata[resource.id] || {};
    resource.level = clean_(meta.level) || (/新人|入門|基礎/.test(resourceSearchTextR4_(resource)) ? '入門' : '一般');
    resource.duration = normalizeDurationR4_(meta.minutes, resource.duration ? resource.duration/60 : 0);
    resource.featured = /是|熱門|精選|true|1/i.test(clean_(meta.featured));
    resource.coverUrl = clean_(meta.coverUrl);
    resource.roles = clean_(meta.roles) || resource.audience;
    resource.projects = clean_(meta.projects);
    resource.model = clean_(meta.model);
    resource.tags = inferResourceTagsR4_(Object.assign({},resource,{tags:splitTagsR4_(meta.tags).concat(resource.tags||[])}),tagRows);
    resource.usageCount = usage[resource.id] || 0;
    const explicitProgress = progressMap[resource.id];
    const courseProgress = resource.source === '課程紀錄' ? (attendance.completed[resource.sourceId] || 0) : 0;
    resource.progress = explicitProgress ? Number(explicitProgress.progress||0) : courseProgress;
    resource.progressStatus = explicitProgress ? clean_(explicitProgress.status) : (courseProgress>=100?'已完成':'未開始');
    resource.popularity = (resource.featured?1000:0) + resource.usageCount*8 + (resource.attendanceCount||0)*5 + Math.max(0,200-Number(resource.order||999));
    resource.searchText = resourceSearchTextR4_(resource);
  });
  return resources.slice(0,PSS_R4.MAX_RESOURCES);
}

function learningPathRowsR4_() {
  return readExactSheetR4_(PSS_R4.SHEETS.PATHS, {
    id:['路徑ID'], name:['路徑名稱'], description:['說明'], roles:['適用角色'], level:['難度'],
    tagQuery:['標籤查詢'], order:['排序'], status:['狀態']
  }).filter(function(row) { return clean_(row.status) !== '停用' && clean_(row.id); });
}

function buildLearningPathsR4_(resources) {
  return learningPathRowsR4_().map(function(row) {
    const tags = splitTagsR4_(row.tagQuery);
    const matches = resources.filter(function(resource) {
      const text = resource.searchText + ' ' + resource.tags.join(' ').toLowerCase();
      return tags.some(function(tag) { return text.indexOf(tag.toLowerCase()) >= 0; });
    }).sort(function(a,b) { return b.popularity-a.popularity; }).slice(0,12);
    const progress = matches.length ? Math.round(matches.reduce(function(sum,r){return sum+Number(r.progress||0);},0)/matches.length) : 0;
    return {
      id:clean_(row.id), name:clean_(row.name), description:clean_(row.description), roles:clean_(row.roles),
      level:clean_(row.level), tags:tags, order:Number(row.order||999), resourceCount:matches.length,
      progress:progress, resources:matches.slice(0,6)
    };
  }).sort(function(a,b) { return a.order-b.order; });
}

function durationBucketR4_(minutes) {
  const n = Number(minutes||0);
  if (!n) return '未標示';
  if (n <= 30) return '30分鐘內';
  if (n <= 60) return '30–60分鐘';
  if (n <= 180) return '1–3小時';
  return '3小時以上';
}

function getLearningHubR4(payload) {
  payload = payload || {};
  const user = requireUser_(payload.token);
  ensureKnowledgeSheetsR4_();
  const all = buildLearningResourcesR4_(user);
  const query = clean_(payload.keyword);
  const tags = Array.isArray(payload.tags) ? payload.tags.map(clean_).filter(Boolean) : splitTagsR4_(payload.tags);
  const category = clean_(payload.category);
  const type = clean_(payload.type);
  const level = clean_(payload.level);
  const duration = clean_(payload.duration);
  const source = clean_(payload.source);
  const mode = clean_(payload.mode) || 'all';
  const sort = clean_(payload.sort) || 'popular';
  const hasActiveFilters = !!(query || tags.length || category || type || level || duration || source);

  let resources = all.filter(function(resource) {
    if (!resourceMatchesQueryR41_(resource, query)) return false;
    if (tags.length && !tags.every(function(tag) {
      const normalizedTag = normalizeKnowledgeSearchR41_(tag);
      return (resource.tags || []).some(function(value) {
        return normalizeKnowledgeSearchR41_(value) === normalizedTag;
      }) || resource.searchText.indexOf(normalizedTag) >= 0;
    })) return false;
    if (category && resource.category !== category) return false;
    if (type && resource.type !== type) return false;
    if (level && resource.level !== level) return false;
    if (duration && durationBucketR4_(resource.duration) !== duration) return false;
    if (source && resource.source !== source) return false;
    if (mode === 'my' && !(resource.progress > 0)) return false;
    if (mode === 'templates' && !/範例|表格|sop|模板|手冊|樣板/.test(resource.searchText+' '+(resource.tags || []).join(' ').toLowerCase())) return false;
    return true;
  });

  resources.sort(function(a,b) {
    if (sort === 'newest') return String(b.updatedAt||b.createdAt).localeCompare(String(a.updatedAt||a.createdAt));
    if (sort === 'title') return a.title.localeCompare(b.title,'zh-Hant');
    if (sort === 'duration') return Number(a.duration||99999)-Number(b.duration||99999);
    return b.popularity-a.popularity || a.order-b.order || a.title.localeCompare(b.title,'zh-Hant');
  });

  const tagScore = {};
  all.forEach(function(resource) {
    (resource.tags || []).forEach(function(tag) { tagScore[tag]=(tagScore[tag]||0)+1+Math.min(10,resource.usageCount||0); });
  });
  collectTagRowsR4_().forEach(function(tag) { tagScore[tag.name]=(tagScore[tag.name]||0)+Number(tag.score||0)/10; });
  const popularTags = Object.keys(tagScore).map(function(name){return{name:name,count:Math.round(tagScore[name])};})
    .sort(function(a,b){return b.count-a.count||a.name.localeCompare(b.name,'zh-Hant');}).slice(0,18);
  const completed = all.filter(function(r){return Number(r.progress||0)>=100;}).length;
  const inProgress = all.filter(function(r){return Number(r.progress||0)>0&&Number(r.progress||0)<100;}).length;
  const filters = {
    categories:unique_(all.map(function(r){return r.category;}).filter(Boolean)).sort(),
    types:unique_(all.map(function(r){return r.type;}).filter(Boolean)).sort(),
    levels:unique_(all.map(function(r){return r.level;}).filter(Boolean)).sort(),
    durations:['30分鐘內','30–60分鐘','1–3小時','3小時以上','未標示'],
    sources:unique_(all.map(function(r){return r.source;}).filter(Boolean)).sort()
  };
  const sourceCounts = {};
  all.forEach(function(resource) { sourceCounts[resource.source] = (sourceCounts[resource.source] || 0) + 1; });

  /* R4.0 問題：前端在「熱門／推薦」模式固定顯示未套用搜尋條件的 featured，
   * 當熱門門檻沒有命中時，即使 resources 有搜尋結果仍會顯示「查無資料」。
   * R4.1 改為：有搜尋／篩選時，featured 直接採用已篩選結果；無篩選時若熱門清單為空，
   * 以人氣排序前 12 筆作為保底。 */
  let featured = hasActiveFilters
    ? resources.slice(0,12)
    : all.filter(function(r){return r.featured||r.popularity>=120;})
        .sort(function(a,b){return b.popularity-a.popularity;}).slice(0,12);
  if (!featured.length && all.length) {
    featured = all.slice().sort(function(a,b){return b.popularity-a.popularity||a.title.localeCompare(b.title,'zh-Hant');}).slice(0,12);
  }

  const warnings = learningDataWarningsR4_();
  if (!all.length) warnings.unshift('知識中心沒有讀到教材資料。請確認 Work_Knowledge_R4.gs 已加入 Apps Script、已執行 setupPssAiPmoV204R4，且部署版本已更新。');
  if (query && !resources.length && all.length) warnings.unshift('資料來源共有 '+all.length+' 筆，但目前關鍵字與篩選條件沒有交集；可清除篩選後再搜尋。');

  return {
    version:PSS_R4.VERSION, user:{name:user.name,account:user.account,role:user.role},
    stats:{total:all.length,matched:resources.length,completed:completed,inProgress:inProgress},
    popularTags:popularTags, filters:filters, learningPaths:buildLearningPathsR4_(all),
    featured:featured,
    resources:resources.slice(0,Math.min(Number(payload.limit||300),800)),
    diagnostics:{queryTokens:knowledgeQueryTokensR41_(query),hasActiveFilters:hasActiveFilters,sourceCounts:sourceCounts},
    warnings:warnings
  };
}

function diagnoseLearningHubR41(payload) {
  payload = payload || {};
  requireManager_(payload.token);
  const data = getLearningHubR4(Object.assign({}, payload, {mode:'all',limit:20}));
  return {
    version:data.version,
    total:data.stats.total,
    matched:data.stats.matched,
    sourceCounts:data.diagnostics.sourceCounts,
    queryTokens:data.diagnostics.queryTokens,
    warnings:data.warnings,
    samples:(data.resources || []).slice(0,10).map(function(resource) {
      return {id:resource.id,title:resource.title,source:resource.source,category:resource.category,tags:resource.tags};
    })
  };
}

function learningDataWarningsR4_() {
  const warnings = [];
  const management = sheetByExactNameR4_('教育訓練管理');
  if (management) {
    const values = management.getDataRange().getValues();
    if (values.length) {
      const headers = values[0].map(clean_);
      for (let c=0;c<headers.length;c++) {
        if (headers[c]) continue;
        let count=0;
        for (let r=1;r<values.length;r++) if (clean_(values[r][c])) count++;
        if (count) warnings.push('教育訓練管理第 '+(c+1)+' 欄標題空白但有 '+count+' 筆資料，R4 以擴充表隔離，未覆寫該欄。');
      }
    }
  }
  return warnings;
}

function projectEquivalentR4_(siteCode, projectName, target) {
  if (!target) return false;
  if (clean_(siteCode) && clean_(target.siteCode) && clean_(siteCode).toLowerCase()===clean_(target.siteCode).toLowerCase()) return true;
  const a = typeof normalizeProjectNameV18_ === 'function' ? normalizeProjectNameV18_(projectName) : clean_(projectName).replace(/\s/g,'');
  const b = typeof normalizeProjectNameV18_ === 'function' ? normalizeProjectNameV18_(target.projectName) : clean_(target.projectName).replace(/\s/g,'');
  return a && b && a===b;
}

function collectFollowUpsR4_(project, sourceId) {
  return readExactSheetR4_('後續安排', {
    id:['後續ID'], sourceType:['來源類型'], sourceId:['來源ID'], sourceDate:['來源日期'], siteCode:['場地代號'],
    projectName:['專案名稱'], content:['後續事項'], assigner:['指派人'], owner:['負責人'], collaborators:['協作人'],
    priority:['優先級'], startDate:['開始日'], dueDate:['預計完成日'], status:['狀態'], taskId:['任務ID'],
    attachment:['附件連結'], note:['備註'], updatedAt:['更新時間']
  }).filter(function(row) {
    return (sourceId && (clean_(row.sourceId)===clean_(sourceId)||clean_(row.taskId)===clean_(sourceId))) || projectEquivalentR4_(row.siteCode,row.projectName,project);
  }).map(function(row) {
    return {id:clean_(row.id),content:clean_(row.content),owner:clean_(row.owner),collaborators:clean_(row.collaborators),
      priority:clean_(row.priority),dueDate:dateOnly_(row.dueDate),status:clean_(row.status),attachment:clean_(row.attachment),
      note:clean_(row.note),updatedAt:dateTime_(row.updatedAt)};
  }).slice(0,PSS_R4.MAX_RELATED);
}

function collectEventAttachmentsR4_(project, sourceIds) {
  sourceIds = sourceIds || [];
  return readExactSheetR4_('事件附件', {
    id:['附件ID'], reportId:['回報ID'], uploadedAt:['上傳時間'], person:['人員'], siteCode:['場地代號'],
    projectName:['專案名稱'], name:['檔名'], url:['檔案連結'], mimeType:['檔案類型'], folderUrl:['備註'], folder:['資料夾']
  }).filter(function(row) {
    return sourceIds.indexOf(clean_(row.reportId))>=0 || projectEquivalentR4_(row.siteCode,row.projectName,project);
  }).map(function(row) {
    return {id:clean_(row.id),reportId:clean_(row.reportId),uploadedAt:dateTime_(row.uploadedAt),person:clean_(row.person),
      name:clean_(row.name),url:clean_(row.url),mimeType:clean_(row.mimeType),folderUrl:clean_(row.folderUrl),folder:clean_(row.folder)};
  }).sort(function(a,b){return String(b.uploadedAt).localeCompare(String(a.uploadedAt));}).slice(0,80);
}

function collectCloudIndexR4_(project) {
  let rows = [];
  ['知識雲端索引','雲端索引','圖面管理'].forEach(function(name) {
    rows = rows.concat(readExactSheetR4_(name, {
      id:['索引ID','圖面ID'], siteCode:['場地代號'], projectName:['專案名稱'], type:['類型','資料夾類型'],
      name:['名稱','檔名'], url:['連結','檔案連結'], mimeType:['MimeType','檔案類型'], updatedAt:['更新時間'],
      parent:['父層資料夾','來源資料夾'], path:['路徑'], tags:['標籤'], status:['狀態']
    }).filter(function(row){return projectEquivalentR4_(row.siteCode,row.projectName,project);}).map(function(row){
      return {id:clean_(row.id),type:clean_(row.type),name:clean_(row.name),url:clean_(row.url),mimeType:clean_(row.mimeType),
        updatedAt:dateTime_(row.updatedAt),parent:clean_(row.parent),path:clean_(row.path),tags:clean_(row.tags),status:clean_(row.status)};
    }));
  });
  const seen={};
  return rows.filter(function(row){const key=row.url||[row.name,row.path,row.updatedAt].join('|');if(!key||seen[key])return false;seen[key]=true;return true;})
    .sort(function(a,b){return String(b.updatedAt).localeCompare(String(a.updatedAt));}).slice(0,80);
}

function projectFolderSummaryR4_(token, project) {
  try {
    if (typeof getProjectFolderStatusV182 === 'function' && project.siteCode) return getProjectFolderStatusV182(token,project.siteCode);
  } catch (error) {
    return {project:project,root:project.driveUrl?{name:'專案根資料夾',url:project.driveUrl}:null,folders:[],warning:error.message};
  }
  return {project:project,root:project.driveUrl?{name:'專案根資料夾',url:project.driveUrl}:null,folders:[]};
}

function recommendedResourcesR4_(user, text, limit) {
  const words = splitTagsR4_(String(text||'').replace(/[\s]+/g,','));
  const resources = buildLearningResourcesR4_(user);
  return resources.map(function(resource) {
    let score = resource.popularity/50;
    words.forEach(function(word) {
      if (word.length>=2 && resource.searchText.indexOf(word.toLowerCase())>=0) score+=12;
      if (resource.tags.indexOf(word)>=0) score+=20;
    });
    return {resource:resource,score:score};
  }).filter(function(item){return item.score>0;}).sort(function(a,b){return b.score-a.score;})
    .slice(0,limit||8).map(function(item){return item.resource;});
}

function getTaskDrawerR4(payload) {
  payload = payload || {};
  const user = requireUser_(payload.token);
  const task = getTaskV17(payload.token,clean_(payload.taskId));
  let project = {siteCode:task.siteCode,projectName:task.projectName,driveUrl:task.folderUrl||'',systemType:''};
  try { if (task.siteCode && typeof getProjectV182 === 'function') project=getProjectV182(payload.token,task.siteCode); } catch(ignore) {}
  const allTasks = listTaskCardsV17({token:payload.token,keyword:'',hideDone:false,limit:3000});
  const relatedTasks = allTasks.filter(function(item){return item.taskId!==task.taskId&&projectEquivalentR4_(item.siteCode,item.projectName,project);}).slice(0,PSS_R4.MAX_RELATED);
  const allReports = listDailyReportsV17({token:payload.token,keyword:'',startDate:'',endDate:'',limit:3000});
  const reports = allReports.filter(function(row){return clean_(row.taskId)===task.taskId||clean_(row.relatedTaskId)===task.taskId||projectEquivalentR4_(row.siteCode,row.projectName,project);}).slice(0,PSS_R4.MAX_RELATED);
  const sourceIds = [task.taskId].concat(reports.map(function(r){return clean_(r.reportId);}).filter(Boolean));
  const text = [task.content,task.note,task.taskType,project.projectName,project.systemType].join(' ');
  return {
    kind:'task', version:PSS_R4.VERSION, task:task, project:project,
    stats:{relatedTasks:relatedTasks.length,reports:reports.length,followUps:collectFollowUpsR4_(project,task.taskId).length},
    relatedTasks:relatedTasks, reports:reports, followUps:collectFollowUpsR4_(project,task.taskId),
    attachments:collectEventAttachmentsR4_(project,sourceIds), cloudItems:collectCloudIndexR4_(project),
    folders:projectFolderSummaryR4_(payload.token,project),
    recommendations:recommendedResourcesR4_(user,text,10)
  };
}

function getProjectDrawerR4(payload) {
  payload = payload || {};
  const user = requireUser_(payload.token);
  const project = getProjectV182(payload.token,clean_(payload.siteCode));
  const tasks = listTaskCardsV17({token:payload.token,keyword:'',hideDone:false,limit:3000})
    .filter(function(row){return projectEquivalentR4_(row.siteCode,row.projectName,project);});
  const reports = listDailyReportsV17({token:payload.token,keyword:'',startDate:'',endDate:'',limit:3000})
    .filter(function(row){return projectEquivalentR4_(row.siteCode,row.projectName,project);}).slice(0,80);
  const openTasks = tasks.filter(function(t){return t.status!=='已完成'&&t.status!=='取消';});
  const overdue = openTasks.filter(function(t){return t.overdue;});
  const sourceIds = reports.map(function(r){return clean_(r.reportId);}).filter(Boolean);
  const followUps = collectFollowUpsR4_(project,'');
  const text = [project.projectName,project.systemType,project.note,project.customer].join(' ');
  return {
    kind:'project', version:PSS_R4.VERSION, project:project,
    stats:{tasks:tasks.length,openTasks:openTasks.length,overdue:overdue.length,reports:reports.length,followUps:followUps.length},
    openTasks:openTasks.slice(0,60), overdueTasks:overdue.slice(0,30), recentReports:reports,
    followUps:followUps, attachments:collectEventAttachmentsR4_(project,sourceIds), cloudItems:collectCloudIndexR4_(project),
    folders:projectFolderSummaryR4_(payload.token,project),
    recommendations:recommendedResourcesR4_(user,text,12)
  };
}

function recordKnowledgeUseR4(payload) {
  payload = payload || {};
  const user = requireUser_(payload.token);
  ensureKnowledgeSheetsR4_();
  appendObject_(getSheet_(PSS_R4.SHEETS.USAGE), {
    '使用紀錄ID':makeId_('KUSE'), '時間':new Date(), '使用者ID':user.id, '帳號':user.account,
    '姓名':user.name, '資源ID':clean_(payload.resourceId), '動作':clean_(payload.action)||'開啟',
    '來源頁面':clean_(payload.sourcePage), '場地代號':clean_(payload.siteCode),
    '專案名稱':clean_(payload.projectName), '關鍵字':clean_(payload.keyword), '備註':clean_(payload.note)
  });
  return '已記錄。';
}

function saveLearningProgressR4(payload) {
  payload = payload || {};
  const user = requireUser_(payload.token);
  ensureKnowledgeSheetsR4_();
  const sheet = getSheet_(PSS_R4.SHEETS.PROGRESS);
  const rows = readCanonical_(sheet, {
    id:['紀錄ID'], userId:['使用者ID'], account:['帳號'], resourceId:['資源ID'], startedAt:['開始時間']
  });
  const target = rows.find(function(row) {
    return clean_(row.resourceId)===clean_(payload.resourceId) &&
      (clean_(row.userId)===clean_(user.id)||clean_(row.account)===clean_(user.account));
  });
  const progress = Math.max(0,Math.min(100,Number(payload.progress||0)));
  const status = clean_(payload.status)||(progress>=100?'已完成':progress>0?'進行中':'未開始');
  const object = {
    '紀錄ID':target?target.id:makeId_('LPROG'), '使用者ID':user.id, '帳號':user.account, '姓名':user.name,
    '資源ID':clean_(payload.resourceId), '路徑ID':clean_(payload.pathId), '進度%':progress, '狀態':status,
    '開始時間':target?target.startedAt:(progress>0?new Date():''), '完成時間':progress>=100?new Date():'',
    '最後瀏覽時間':new Date(), '評分':clean_(payload.rating), '備註':clean_(payload.note), '更新時間':new Date()
  };
  if (target) writeObject_(sheet,target.__rowNumber,object); else appendObject_(sheet,object);
  operationLog_(user,'更新學習進度','教育訓練',clean_(payload.resourceId),{progress:progress,status:status},'成功');
  return {message:'學習進度已更新。',progress:progress,status:status};
}

function syncKnowledgeCloudIndexR4(payload) {
  payload = payload || {};
  const user = requireManager_(payload.token);
  ensureKnowledgeSheetsR4_();
  const target = getSheet_(PSS_R4.SHEETS.CLOUD_INDEX);
  clearDataKeepHeader_(target);
  const rows = [];
  const sources = ['教育訓練管理','教育訓練'];
  const resources = buildLearningResourcesR4_(user).filter(function(r){return sources.indexOf(r.source)>=0;});
  resources.forEach(function(resource) {
    [resource.fileUrl,resource.folderUrl].filter(Boolean).forEach(function(url,index) {
      rows.push([
        makeId_('KIDX'),new Date(),resource.id,'','',resource.category,resource.title,url,
        index===0?'resource/file':'resource/folder',resource.updatedAt,'',resource.source+'/'+resource.category,
        resource.tags.join(','),'啟用'
      ]);
    });
  });
  if (rows.length) target.getRange(2,1,rows.length,14).setValues(rows);
  operationLog_(user,'同步知識索引','教育訓練','',{count:rows.length},'成功');
  return '知識索引同步完成，共 '+rows.length+' 筆。';
}

function auditSheetR4_(name, requiredAliases) {
  const sheet = sheetByExactNameR4_(name);
  if (!sheet) return {sheet:name,status:'缺少工作表',required:Object.keys(requiredAliases),missing:Object.keys(requiredAliases),duplicates:[],blankData:[],impact:'功能不可用',recommendation:'建立工作表並補齊欄位'};
  const values = sheet.getDataRange().getValues();
  const headers = values.length ? values[0].map(clean_) : [];
  const counts = {};
  headers.forEach(function(header){if(header){const key=normalizeHeader_(header);counts[key]=(counts[key]||0)+1;}});
  const duplicates = Object.keys(counts).filter(function(key){return counts[key]>1;}).map(function(key){return key+'×'+counts[key];});
  const missing = Object.keys(requiredAliases).filter(function(canonical){
    return !requiredAliases[canonical].some(function(alias){return headers.some(function(header){return normalizeHeader_(header)===normalizeHeader_(alias);});});
  });
  const blankData=[];
  headers.forEach(function(header,index){
    if(header)return;let count=0;for(let r=1;r<values.length;r++)if(clean_(values[r][index]))count++;
    if(count)blankData.push('第'+(index+1)+'欄('+count+'筆)');
  });
  const risk = missing.length ? '高' : (duplicates.length||blankData.length ? '中' : '低');
  return {
    sheet:name,status:risk==='低'?'對齊':'部分對齊',required:Object.keys(requiredAliases),missing:missing,
    duplicates:duplicates,blankData:blankData,
    impact:risk==='高'?'讀寫函式可能無法取得必要欄位':risk==='中'?'別名讀取可運作，但寫入可能同步到多組舊欄位':'可直接使用',
    recommendation:risk==='低'?'維持資料字典與版本稽核':(duplicates.length?'保留備份後建立單一標準欄，停止新增重複欄位；R4 先以別名層相容。':'補齊必要欄位')
  };
}

function schemaAuditRowsR4_() {
  return [
    auditSheetR4_('專案清單',{
      '場地代號':['場地代號'],'專案名稱':['專案名稱'],'客戶':['客戶'],'系統類型':['系統類型'],
      '主管':['專案業務/主管','負責人員','PM','負責PM'],'狀態':['狀態','簽約狀態','合約狀況'],
      '根資料夾':['Drive資料夾連結','雲端資料夾']
    }),
    auditSheetR4_('任務派工',{
      '任務ID':['任務ID','事件ID'],'場地代號':['場地代號'],'專案名稱':['專案名稱'],
      '任務內容':['任務內容'],'負責人':['負責人'],'狀態':['狀態'],'期限':['預計完成日']
    }),
    auditSheetR4_('每日工作日誌',{
      '回報ID':['回報ID'],'日期':['日期','回報日期'],'人員':['人員'],'場地代號':['場地代號'],
      '專案名稱':['專案名稱'],'回報事項':['回報事項','今日完成事項'],'附件':['附件連結','施工照片連結']
    }),
    auditSheetR4_('教育訓練管理',{
      '教材ID':['教材ID'],'系統分類':['系統分類'],'設備分類':['設備分類'],'教材名稱':['教材名稱'],
      '連結':['檔案連結','資料夾連結'],'狀態':['狀態']
    }),
    auditSheetR4_('教育訓練',{
      '教育訓練ID':['教育訓練ID','訓練ID'],'分類':['分類'],'標題':['標題'],'連結':['連結','附件連結'],'狀態':['狀態']
    }),
    auditSheetR4_('courses',{'ID':['ID'],'課程名稱':['課程名稱'],'分類':['分類'],'講師':['講師']}),
    auditSheetR4_('attendance',{'ID':['ID'],'人員ID':['人員ID'],'課程ID':['課程ID'],'結果':['結果']})
  ];
}

function rebuildAlignmentAuditR4_() {
  ensureKnowledgeSheetsR4_();
  const sheet = getSheet_(PSS_R4.SHEETS.AUDIT);
  clearDataKeepHeader_(sheet);
  const now = new Date();
  const rows = schemaAuditRowsR4_().map(function(item){
    return [now,item.sheet,item.status,item.required.join('、'),item.missing.join('、'),item.duplicates.join('、'),
      item.blankData.join('、'),item.impact,item.recommendation];
  });
  if (rows.length) sheet.getRange(2,1,rows.length,9).setValues(rows);
  return rows.length;
}

function getSchemaAlignmentR4(payload) {
  payload = payload || {};
  requireManager_(payload.token);
  const rows = schemaAuditRowsR4_();
  if (payload.write !== false) rebuildAlignmentAuditR4_();
  const full = rows.filter(function(row){return row.status==='對齊';}).length;
  const partial = rows.filter(function(row){return row.status==='部分對齊';}).length;
  const missing = rows.filter(function(row){return row.status==='缺少工作表';}).length;
  return {version:PSS_R4.VERSION,summary:{total:rows.length,aligned:full,partial:partial,missing:missing},items:rows};
}
