/**
 * PSS AI-PMO V20.5 R5.1 | Education & Equipment Training Center
 * Compatibility: keeps the public R4.8 API names used by the existing PMO frontend.
 */
const TRAIN_R48 = Object.freeze({
  DB: '11ndvBcV0geEF7oJv1kX28BuC4_kAKnl37wUhL-Rx27g',
  TZ: 'Asia/Taipei',
  ROOT: '13_xc_b76zEFaabOcjOqedMYY_AGoxZkX',
  COMPLETE: 'TRAIN_課程完成紀錄',
  QUESTIONS: 'TRAIN_測驗題庫',
  EXAMS: 'TRAIN_測驗紀錄',
  SIGN: 'TRAIN_學員簽名',
  ATTACH: 'TRAIN_課程附件',
  CATEGORY: '教育訓練分類'
});

function tr48Db_() { return SpreadsheetApp.openById(TRAIN_R48.DB); }
function tr48Text_(v, n) { return String(v == null ? '' : v).replace(/[\u0000\r\n\t]+/g, ' ').trim().slice(0, n || 4000); }
function tr48Id_(p) { return p + '-' + Utilities.getUuid().slice(0, 12); }
function tr48Map_(h) { const m = {}; h.forEach((x, i) => { const k = String(x || '').trim(); if (k && m[k] == null) m[k] = i; }); return m; }
function tr48Get_(r, m, names) { for (const n of names) { const i = m[n]; if (i != null && r[i] !== '' && r[i] != null) return r[i]; } return ''; }
function tr48EnsureSheet_(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.setFrozenRows(1);
  } else {
    const cur = sh.getRange(1, 1, 1, Math.max(1, sh.getLastColumn())).getDisplayValues()[0];
    const miss = headers.filter(x => cur.indexOf(x) < 0);
    if (miss.length) sh.getRange(1, cur.length + 1, 1, miss.length).setValues([miss]);
  }
  return sh;
}

function setupTrainingCenterR48() {
  const ss = tr48Db_();
  tr48EnsureSheet_(ss, TRAIN_R48.COMPLETE, ['完成紀錄ID', '課程ID', '課程來源', '課程名稱', '學員帳號', '學員姓名', '進度%', '學習狀態', '完成確認', '完成確認時間', '學習心得', '最後瀏覽時間', '建立時間', '更新時間']);
  tr48EnsureSheet_(ss, TRAIN_R48.QUESTIONS, ['題目ID', '課程ID', '題型', '題目', '選項A', '選項B', '選項C', '選項D', '正確答案', '配分', '答案說明', '狀態', '排序', '建立時間', '更新時間']);
  tr48EnsureSheet_(ss, TRAIN_R48.EXAMS, ['測驗紀錄ID', '課程ID', '課程名稱', '學員帳號', '學員姓名', '分數', '及格分數', '結果', '答題內容', '開始時間', '交卷時間', '建立時間']);
  tr48EnsureSheet_(ss, TRAIN_R48.SIGN, ['簽名ID', '課程ID', '課程名稱', '學員帳號', '學員姓名', '確認內容', '簽名圖片ID', '簽名圖片連結', '簽名時間', '裝置資訊', '備註']);
  tr48EnsureSheet_(ss, TRAIN_R48.ATTACH, ['附件ID', '課程ID', '標題', '類型', '檔案ID', '連結/路徑', 'MimeType', '狀態', '建立者', '建立時間', '更新時間']);
  tr48EnsureSheet_(ss, TRAIN_R48.CATEGORY, ['分類ID', '分類名稱', '父分類ID', '層級', '排序', '狀態', '建立時間', '更新時間']);
  PropertiesService.getScriptProperties().setProperty('PSS_TRAINING_R48', '1');
  return 'R5.1 教育訓練基礎資料表已確認。';
}

function tr48Rows_(name) {
  const sh = tr48Db_().getSheetByName(name);
  if (!sh || sh.getLastRow() < 2) return [];
  const v = sh.getDataRange().getValues(), m = tr48Map_(v[0]);
  return v.slice(1).map((r, i) => ({ r: r, m: m, row: i + 2 }));
}
function tr48Ready_() { if (PropertiesService.getScriptProperties().getProperty('PSS_TRAINING_R48') !== '1') setupTrainingCenterR48(); }
function tr48User_(token) { tr48Ready_(); return requireUser_(token); }
function tr51IsManagerUser_(user) {
  const text = [user && user.role, user && user.permission, user && user.permissionLevel, user && user.name].filter(Boolean).join(' ');
  return /(系統管理員|管理員|主管|經理|副理|課長|PM)/i.test(text);
}
function tr51RequireManager_(user) { if (!tr51IsManagerUser_(user)) throw new Error('此功能僅限主管／管理權限使用。'); }

function tr48Meta_() {
  const out = {};
  tr48Rows_('教材擴充資料').forEach(x => {
    const id = tr48Text_(tr48Get_(x.r, x.m, ['資源ID']));
    if (id) out[id] = {
      difficulty: tr48Text_(tr48Get_(x.r, x.m, ['難度'])) || '基礎',
      minutes: Number(tr48Get_(x.r, x.m, ['預估分鐘']) || 0),
      hot: tr48Text_(tr48Get_(x.r, x.m, ['熱門'])) === '是',
      tags: tr48Text_(tr48Get_(x.r, x.m, ['標籤'])),
      cover: tr48Text_(tr48Get_(x.r, x.m, ['封面連結']))
    };
  });
  return out;
}

function tr51NormalizeSystem_(value) {
  const s = tr48Text_(value, 120).replace(/\s+/g, '');
  if (!s) return '未分類';
  const aliases = {
    '停車系統': '停管系統', '停車場系統': '停管系統', '停管': '停管系統',
    '門禁': '門禁系統', '訪客': '訪客系統', '梯控': '梯控系統',
    '網路': '網路系統', '硬體': '硬體維修', '系統操作': '專案管理',
    '多系統整合': '跨系統整合', '多系統': '跨系統整合'
  };
  return aliases[s] || s;
}
function tr51LooksLikeSystem_(value) {
  const s = tr51NormalizeSystem_(value);
  return /(系統|專案管理|硬體維修|智慧建築|機器人|跨系統整合|CAD)/.test(s);
}
function tr51SplitCategory_(value) {
  const raw = tr48Text_(value, 300);
  const hub = raw.match(/^HUB[／/]SALTO系統(?:[／/](.+))?$/i);
  if (hub) return { systemCategory: 'HUB／SALTO系統', deviceCategory: tr48Text_(hub[1], 120) || '系統總覽', category: 'HUB／SALTO系統／' + (tr48Text_(hub[1], 120) || '系統總覽') };
  const parts = raw.split(/[／/]+/).map(x => tr48Text_(x, 100)).filter(Boolean);
  if (!parts.length) return { systemCategory: '未分類', deviceCategory: '未分類', category: '未分類' };
  let system = tr51NormalizeSystem_(parts[0]);
  let device = parts.slice(1).join('／') || '系統總覽';
  if (parts.length > 1 && tr51LooksLikeSystem_(parts[0]) && tr51LooksLikeSystem_(parts[1]) && tr51NormalizeSystem_(parts[0]) !== tr51NormalizeSystem_(parts[1])) {
    system = '跨系統整合';
    device = parts.map(tr51NormalizeSystem_).join('／');
  }
  return { systemCategory: system, deviceCategory: device, category: system + '／' + device };
}
function tr51Kind_(source, materialType, id, title) {
  const t = [materialType, id, title].join(' ');
  if (/設備教育訓練|TRN\d+EQ/i.test(t)) return '設備教育訓練';
  if (source === 'courses') return '正式課程';
  if (source === '教育訓練') return '系統／流程課程';
  if (/PDF|簡報|手冊|文件|資料夾|教材|圖面|SOP/i.test(t)) return '教材資源';
  return '教材資源';
}
function tr51BuildCatalogTree_(courses) {
  const map = {};
  (courses || []).forEach(c => {
    const s = c.systemCategory || '未分類', d = c.deviceCategory || '未分類';
    if (!map[s]) map[s] = { name: s, count: 0, children: {} };
    map[s].count++;
    if (!map[s].children[d]) map[s].children[d] = { name: d, count: 0 };
    map[s].children[d].count++;
  });
  return Object.keys(map).sort((a, b) => a.localeCompare(b, 'zh-Hant')).map(s => ({
    name: s,
    count: map[s].count,
    children: Object.keys(map[s].children).sort((a, b) => a.localeCompare(b, 'zh-Hant')).map(d => map[s].children[d])
  }));
}

function tr48Courses_() {
  const meta = tr48Meta_(), out = [], seen = {};
  const add = c => {
    if (!c.id || !c.title || seen[c.id]) return;
    seen[c.id] = 1;
    const x = meta[c.id] || {};
    const split = c.systemCategory ? {
      systemCategory: tr51NormalizeSystem_(c.systemCategory),
      deviceCategory: tr48Text_(c.deviceCategory, 140) || '系統總覽'
    } : tr51SplitCategory_(c.category);
    c.systemCategory = split.systemCategory;
    c.deviceCategory = split.deviceCategory;
    c.category = c.systemCategory + '／' + c.deviceCategory;
    c.materialType = tr48Text_(c.materialType, 80) || (c.source === 'courses' ? '課程' : '教材');
    c.kind = tr51Kind_(c.source, c.materialType, c.id, c.title);
    c.version = tr48Text_(c.version, 80);
    c.audience = tr48Text_(c.audience, 300);
    c.order = Number(c.order || 9999);
    c.difficulty = x.difficulty || c.difficulty || '基礎';
    c.minutes = x.minutes || c.minutes || 0;
    c.hot = !!x.hot;
    c.tags = [c.tags, x.tags, c.systemCategory, c.deviceCategory, c.kind, c.materialType].filter(Boolean).join(',');
    c.cover = x.cover || c.cover || '';
    c.searchText = [c.id, c.title, c.category, c.systemCategory, c.deviceCategory, c.kind, c.materialType, c.description, c.instructor, c.tags, c.source, c.audience].join(' ').toLowerCase();
    out.push(c);
  };

  tr48Rows_('courses').forEach(x => {
    const rawCategory = tr48Text_(tr48Get_(x.r, x.m, ['分類'])) || '未分類';
    add({
      id: tr48Text_(tr48Get_(x.r, x.m, ['ID'])), source: 'courses',
      title: tr48Text_(tr48Get_(x.r, x.m, ['課程名稱'])), category: rawCategory,
      instructor: tr48Text_(tr48Get_(x.r, x.m, ['講師'])), date: tr48Text_(tr48Get_(x.r, x.m, ['日期'])),
      hours: Number(tr48Get_(x.r, x.m, ['時數']) || 0), minutes: Number(tr48Get_(x.r, x.m, ['時數']) || 0) * 60,
      passScore: Number(tr48Get_(x.r, x.m, ['及格分數']) || 70),
      description: tr48Text_(tr48Get_(x.r, x.m, ['說明']), 5000), url: '', folderUrl: '', icon: '🎓', status: '啟用',
      tags: rawCategory, materialType: '課程', version: '', audience: '', order: 9999
    });
  });

  tr48Rows_('教育訓練').forEach(x => {
    const status = tr48Text_(tr48Get_(x.r, x.m, ['狀態'])) || '啟用';
    if (status === '停用') return;
    const rawCategory = tr48Text_(tr48Get_(x.r, x.m, ['分類'])) || '未分類';
    add({
      id: tr48Text_(tr48Get_(x.r, x.m, ['教育訓練ID', '訓練ID'])), source: '教育訓練',
      title: tr48Text_(tr48Get_(x.r, x.m, ['標題'])), category: rawCategory,
      instructor: tr48Text_(tr48Get_(x.r, x.m, ['建立者'])), date: '', hours: 0, passScore: 70,
      description: tr48Text_(tr48Get_(x.r, x.m, ['說明', '內容說明']), 5000),
      url: tr48Text_(tr48Get_(x.r, x.m, ['連結', '附件連結']), 2000), folderUrl: '',
      icon: tr48Text_(tr48Get_(x.r, x.m, ['圖示'])) || '📘', status: status, tags: rawCategory,
      materialType: '知識課程', version: '', audience: '', order: Number(tr48Get_(x.r, x.m, ['排序']) || 9999)
    });
  });

  tr48Rows_('教育訓練管理').forEach(x => {
    const status = tr48Text_(tr48Get_(x.r, x.m, ['狀態'])) || '啟用';
    if (status === '停用') return;
    const system = tr48Text_(tr48Get_(x.r, x.m, ['系統分類'])) || '未分類';
    const device = tr48Text_(tr48Get_(x.r, x.m, ['設備分類'])) || '系統總覽';
    add({
      id: tr48Text_(tr48Get_(x.r, x.m, ['教材ID'])), source: '教育訓練管理',
      title: tr48Text_(tr48Get_(x.r, x.m, ['教材名稱'])), systemCategory: system, deviceCategory: device,
      instructor: tr48Text_(tr48Get_(x.r, x.m, ['負責人'])), date: '', hours: 0, passScore: 70,
      description: tr48Text_(tr48Get_(x.r, x.m, ['備註']), 5000),
      url: tr48Text_(tr48Get_(x.r, x.m, ['檔案連結']), 2000),
      folderUrl: tr48Text_(tr48Get_(x.r, x.m, ['資料夾連結']), 2000), icon: '📂', status: status,
      tags: [system, device, tr48Text_(tr48Get_(x.r, x.m, ['適用對象']))].filter(Boolean).join(','),
      materialType: tr48Text_(tr48Get_(x.r, x.m, ['教材類型'])) || '教材',
      version: tr48Text_(tr48Get_(x.r, x.m, ['版本'])), audience: tr48Text_(tr48Get_(x.r, x.m, ['適用對象'])),
      order: Number(tr48Get_(x.r, x.m, ['排序']) || 9999)
    });
  });

  return out.sort((a, b) => (a.order - b.order) || a.systemCategory.localeCompare(b.systemCategory, 'zh-Hant') || a.title.localeCompare(b.title, 'zh-Hant'));
}

function tr48Course_(id) { return tr48Courses_().find(x => x.id === String(id || '')) || null; }
function tr48Progress_(account) {
  const out = {};
  tr48Rows_(TRAIN_R48.COMPLETE).forEach(x => {
    if (tr48Text_(tr48Get_(x.r, x.m, ['學員帳號'])).toUpperCase() !== String(account || '').toUpperCase()) return;
    const id = tr48Text_(tr48Get_(x.r, x.m, ['課程ID']));
    out[id] = {
      recordId: tr48Text_(tr48Get_(x.r, x.m, ['完成紀錄ID'])), progress: Number(tr48Get_(x.r, x.m, ['進度%']) || 0),
      status: tr48Text_(tr48Get_(x.r, x.m, ['學習狀態'])) || '未開始', confirmed: tr48Text_(tr48Get_(x.r, x.m, ['完成確認'])) === '是',
      confirmedAt: dateTime_(tr48Get_(x.r, x.m, ['完成確認時間'])), lastViewed: dateTime_(tr48Get_(x.r, x.m, ['最後瀏覽時間'])),
      note: tr48Text_(tr48Get_(x.r, x.m, ['學習心得']))
    };
  });
  return out;
}
function tr48LatestExams_(account) {
  const out = {};
  tr48Rows_(TRAIN_R48.EXAMS).forEach(x => {
    if (tr48Text_(tr48Get_(x.r, x.m, ['學員帳號'])).toUpperCase() !== String(account || '').toUpperCase()) return;
    const id = tr48Text_(tr48Get_(x.r, x.m, ['課程ID'])), t = tr48Get_(x.r, x.m, ['交卷時間', '建立時間']), cur = out[id];
    if (!cur || new Date(t) > new Date(cur.submittedAt)) out[id] = { score: Number(tr48Get_(x.r, x.m, ['分數']) || 0), passScore: Number(tr48Get_(x.r, x.m, ['及格分數']) || 70), result: tr48Text_(tr48Get_(x.r, x.m, ['結果'])), submittedAt: dateTime_(t) };
  });
  return out;
}
function tr48Signs_(account) {
  const out = {};
  tr48Rows_(TRAIN_R48.SIGN).forEach(x => {
    if (tr48Text_(tr48Get_(x.r, x.m, ['學員帳號'])).toUpperCase() !== String(account || '').toUpperCase()) return;
    const id = tr48Text_(tr48Get_(x.r, x.m, ['課程ID']));
    out[id] = { signed: true, signedAt: dateTime_(tr48Get_(x.r, x.m, ['簽名時間'])), url: tr48Text_(tr48Get_(x.r, x.m, ['簽名圖片連結'])) };
  });
  return out;
}
function tr48QuestionCount_() {
  const out = {};
  tr48Rows_(TRAIN_R48.QUESTIONS).forEach(x => {
    if ((tr48Text_(tr48Get_(x.r, x.m, ['狀態'])) || '啟用') === '停用') return;
    const id = tr48Text_(tr48Get_(x.r, x.m, ['課程ID']));
    out[id] = (out[id] || 0) + 1;
  });
  return out;
}
function tr51Complete_(p, e, s, q) { return !!(p && p.confirmed && (Number(q || 0) === 0 || (e && e.result === '及格')) && s); }
function tr51NextAction_(p, e, s, q) {
  if (!p || !p.confirmed) return '完成學習確認';
  if (Number(q || 0) > 0 && !e) return '進行測驗';
  if (Number(q || 0) > 0 && e && e.result !== '及格') return '重新測驗';
  if (!s) return '完成簽名';
  return '查看完成紀錄';
}

function getTrainingCenterR48(payload) {
  payload = payload || {};
  const user = tr48User_(payload.token), account = user.employeeId || user.account;
  const progress = tr48Progress_(account), exams = tr48LatestExams_(account), signs = tr48Signs_(account), qc = tr48QuestionCount_();
  const courses = tr48Courses_().map(c => {
    const p = progress[c.id] || { progress: 0, status: '未開始', confirmed: false }, e = exams[c.id] || null, s = signs[c.id] || null, q = qc[c.id] || 0;
    const complete = tr51Complete_(p, e, s, q);
    return Object.assign({}, c, {
      progress: p.progress, learningStatus: complete ? '已完成' : (p.status || '未開始'), confirmed: p.confirmed,
      exam: e, signature: s, questionCount: q, examRequired: q > 0, complete: complete,
      nextAction: tr51NextAction_(p, e, s, q)
    });
  });
  const tags = {};
  courses.forEach(c => String(c.tags || '').split(/[,，、/／]+/).map(x => x.trim()).filter(Boolean).forEach(t => tags[t] = (tags[t] || 0) + 1));
  return {
    ok: true, version: 'V20.5 R5.1', user: user, isManager: tr51IsManagerUser_(user), courses: courses,
    catalogTree: tr51BuildCatalogTree_(courses),
    tags: Object.keys(tags).map(k => ({ name: k, count: tags[k] })).sort((a, b) => b.count - a.count).slice(0, 36),
    summary: {
      courses: courses.length,
      equipment: courses.filter(x => x.kind === '設備教育訓練').length,
      started: courses.filter(x => x.progress > 0 && !x.complete).length,
      completed: courses.filter(x => x.complete).length,
      noExamRequired: courses.filter(x => x.questionCount === 0).length
    }
  };
}

function tr48AttachmentRows_(courseId) {
  return tr48Rows_(TRAIN_R48.ATTACH)
    .filter(x => tr48Text_(tr48Get_(x.r, x.m, ['課程ID'])) === courseId && (tr48Text_(tr48Get_(x.r, x.m, ['狀態'])) || '啟用') !== '刪除')
    .map(x => ({ attachmentId: tr48Text_(tr48Get_(x.r, x.m, ['附件ID'])), title: tr48Text_(tr48Get_(x.r, x.m, ['標題'])), type: tr48Text_(tr48Get_(x.r, x.m, ['類型'])), url: tr48Text_(tr48Get_(x.r, x.m, ['連結/路徑'])), mimeType: tr48Text_(tr48Get_(x.r, x.m, ['MimeType'])) }));
}
function getTrainingCourseR48(payload) {
  payload = payload || {};
  const user = tr48User_(payload.token), course = tr48Course_(payload.courseId);
  if (!course) throw new Error('找不到課程。');
  recordTrainingViewR48({ token: payload.token, courseId: course.id });
  const account = user.employeeId || user.account;
  const p = tr48Progress_(account)[course.id] || { progress: 0, status: '未開始', confirmed: false }, e = tr48LatestExams_(account)[course.id] || null, s = tr48Signs_(account)[course.id] || null, q = tr48QuestionCount_()[course.id] || 0;
  const complete = tr51Complete_(p, e, s, q);
  return {
    ok: true, course: course, progress: p, exam: e, signature: s, questionCount: q,
    attachments: tr48AttachmentRows_(course.id), isManager: tr51IsManagerUser_(user),
    requirements: { confirmation: true, exam: q > 0, signature: true }, complete: complete,
    nextAction: tr51NextAction_(p, e, s, q)
  };
}

function tr48UpsertComplete_(user, course, patch) {
  const sh = tr48Db_().getSheetByName(TRAIN_R48.COMPLETE), v = sh.getDataRange().getValues(), m = tr48Map_(v[0]);
  const account = String(user.employeeId || user.account), row = (() => { for (let i = 1; i < v.length; i++) if (tr48Text_(tr48Get_(v[i], m, ['課程ID'])) === course.id && tr48Text_(tr48Get_(v[i], m, ['學員帳號'])).toUpperCase() === account.toUpperCase()) return i + 1; return 0; })();
  const old = row ? v[row - 1] : null, get = n => old && m[n] != null ? old[m[n]] : '';
  const obj = {
    recordId: get('完成紀錄ID') || tr48Id_('TC'), progress: patch.progress != null ? patch.progress : Number(get('進度%') || 0),
    status: patch.status || get('學習狀態') || '進行中', confirmed: patch.confirmed != null ? patch.confirmed : (get('完成確認') === '是'),
    confirmedAt: patch.confirmedAt || get('完成確認時間') || '', note: patch.note != null ? patch.note : get('學習心得'),
    lastViewed: patch.lastViewed || get('最後瀏覽時間') || new Date(), created: get('建立時間') || new Date()
  };
  const values = [obj.recordId, course.id, course.source, course.title, account, user.name || account, obj.progress, obj.status, obj.confirmed ? '是' : '否', obj.confirmedAt, obj.note, obj.lastViewed, obj.created, new Date()];
  if (row) sh.getRange(row, 1, 1, values.length).setValues([values]); else sh.appendRow(values);
  return obj;
}
function recordTrainingViewR48(payload) {
  payload = payload || {};
  const user = tr48User_(payload.token), c = tr48Course_(payload.courseId);
  if (!c) throw new Error('找不到課程。');
  const old = tr48Progress_(user.employeeId || user.account)[c.id] || {};
  return tr48UpsertComplete_(user, c, { progress: Math.max(1, old.progress || 0), status: old.status || '進行中', lastViewed: new Date() });
}
function tr48FinalStatus_(user, c) {
  const account = user.employeeId || user.account, p = tr48Progress_(account)[c.id] || {}, e = tr48LatestExams_(account)[c.id] || null, s = tr48Signs_(account)[c.id] || null, q = tr48QuestionCount_()[c.id] || 0;
  if (!p.confirmed) return '待完成確認';
  if (q > 0 && !e) return '待測驗';
  if (q > 0 && e.result !== '及格') return '測驗未通過';
  if (!s) return '待簽名';
  return '已完成';
}
function confirmTrainingCompletionR48(payload) {
  payload = payload || {};
  const user = tr48User_(payload.token), c = tr48Course_(payload.courseId);
  if (!c) throw new Error('找不到課程。');
  if (payload.confirmed !== true) throw new Error('請勾選已完成課程內容。');
  tr48UpsertComplete_(user, c, { progress: 100, confirmed: true, confirmedAt: new Date(), note: tr48Text_(payload.note, 2000), status: '進行中' });
  const status = tr48FinalStatus_(user, c);
  tr48UpsertComplete_(user, c, { progress: 100, status: status });
  return { ok: true, message: '學習完成確認已記錄。', status: status, examRequired: (tr48QuestionCount_()[c.id] || 0) > 0 };
}

function getTrainingExamR48(payload) {
  payload = payload || {};
  const user = tr48User_(payload.token), c = tr48Course_(payload.courseId);
  if (!c) throw new Error('找不到課程。');
  const p = tr48Progress_(user.employeeId || user.account)[c.id] || {};
  if (!p.confirmed) throw new Error('請先完成「學習確認」，再進行測驗。');
  const q = tr48Rows_(TRAIN_R48.QUESTIONS)
    .filter(x => tr48Text_(tr48Get_(x.r, x.m, ['課程ID'])) === c.id && (tr48Text_(tr48Get_(x.r, x.m, ['狀態'])) || '啟用') !== '停用')
    .map(x => ({
      questionId: tr48Text_(tr48Get_(x.r, x.m, ['題目ID'])), type: tr48Text_(tr48Get_(x.r, x.m, ['題型'])) || '單選',
      question: tr48Text_(tr48Get_(x.r, x.m, ['題目']), 3000), options: [tr48Text_(tr48Get_(x.r, x.m, ['選項A'])), tr48Text_(tr48Get_(x.r, x.m, ['選項B'])), tr48Text_(tr48Get_(x.r, x.m, ['選項C'])), tr48Text_(tr48Get_(x.r, x.m, ['選項D']))],
      points: Number(tr48Get_(x.r, x.m, ['配分']) || 10), sort: Number(tr48Get_(x.r, x.m, ['排序']) || 999)
    })).sort((a, b) => a.sort - b.sort);
  return { ok: true, course: c, questions: q, passScore: c.passScore || 70 };
}
function submitTrainingExamR48(payload) {
  payload = payload || {};
  const user = tr48User_(payload.token), c = tr48Course_(payload.courseId);
  if (!c) throw new Error('找不到課程。');
  const p = tr48Progress_(user.employeeId || user.account)[c.id] || {};
  if (!p.confirmed) throw new Error('請先完成學習確認。');
  const answers = payload.answers || {}, rows = tr48Rows_(TRAIN_R48.QUESTIONS).filter(x => tr48Text_(tr48Get_(x.r, x.m, ['課程ID'])) === c.id && (tr48Text_(tr48Get_(x.r, x.m, ['狀態'])) || '啟用') !== '停用');
  if (!rows.length) throw new Error('本課程沒有設定測驗，因此不需要交卷。');
  let got = 0, total = 0; const detail = [];
  rows.forEach(x => {
    const id = tr48Text_(tr48Get_(x.r, x.m, ['題目ID'])), pt = Number(tr48Get_(x.r, x.m, ['配分']) || 10), correct = tr48Text_(tr48Get_(x.r, x.m, ['正確答案'])).toUpperCase(), ans = tr48Text_(answers[id]).toUpperCase();
    total += pt; if (ans && ans === correct) got += pt; detail.push({ questionId: id, answer: ans, correct: ans === correct });
  });
  const score = total ? Math.round(got / total * 100) : 0, pass = score >= Number(c.passScore || 70), sh = tr48Db_().getSheetByName(TRAIN_R48.EXAMS);
  sh.appendRow([tr48Id_('EX'), c.id, c.title, user.employeeId || user.account, user.name || user.account, score, c.passScore || 70, pass ? '及格' : '不及格', JSON.stringify(detail), new Date(), new Date(), new Date()]);
  const status = tr48FinalStatus_(user, c); tr48UpsertComplete_(user, c, { progress: 100, status: status });
  return { ok: true, score: score, passScore: c.passScore || 70, result: pass ? '及格' : '不及格', status: status };
}

function tr48Folder_(courseId) {
  const root = DriveApp.getFolderById(TRAIN_R48.ROOT), child = (p, n) => { const it = p.getFoldersByName(n); return it.hasNext() ? it.next() : p.createFolder(n); };
  return child(child(child(root, '教育訓練學員紀錄'), '學員簽名'), String(courseId).replace(/[\\/:*?"<>|]+/g, '_'));
}
function saveTrainingSignatureR48(payload) {
  payload = payload || {};
  const user = tr48User_(payload.token), c = tr48Course_(payload.courseId);
  if (!c) throw new Error('找不到課程。');
  const account = user.employeeId || user.account, p = tr48Progress_(account)[c.id] || {}, e = tr48LatestExams_(account)[c.id] || null, q = tr48QuestionCount_()[c.id] || 0;
  if (!p.confirmed) throw new Error('請先完成學習確認。');
  if (q > 0 && (!e || e.result !== '及格')) throw new Error('此課程有測驗，請先測驗及格後再簽名。');
  const data = String(payload.dataUrl || ''), b64 = data.split(',').pop();
  if (!b64 || b64.length < 100) throw new Error('請先完成簽名。');
  const name = [c.id, account, Utilities.formatDate(new Date(), TRAIN_R48.TZ, 'yyyyMMdd_HHmmss')].join('_') + '.png';
  const file = tr48Folder_(c.id).createFile(Utilities.newBlob(Utilities.base64Decode(b64), 'image/png', name));
  tr48Db_().getSheetByName(TRAIN_R48.SIGN).appendRow([tr48Id_('SG'), c.id, c.title, account, user.name || user.account, tr48Text_(payload.statement, 1000) || '本人確認已完成本課程學習，並依課程要求完成必要測驗（如有）。', file.getId(), file.getUrl(), new Date(), tr48Text_(payload.deviceInfo, 500), '']);
  const status = tr48FinalStatus_(user, c); tr48UpsertComplete_(user, c, { progress: 100, status: status });
  return { ok: true, message: '學員簽名已儲存。', url: file.getUrl(), status: status };
}

function saveTrainingQuestionR48(payload) {
  payload = payload || {};
  const user = tr48User_(payload.token); tr51RequireManager_(user);
  const c = tr48Course_(payload.courseId); if (!c) throw new Error('找不到課程。');
  const sh = tr48Db_().getSheetByName(TRAIN_R48.QUESTIONS), v = sh.getDataRange().getValues(), m = tr48Map_(v[0]);
  let id = tr48Text_(payload.questionId, 80), row = 0;
  for (let i = 1; i < v.length; i++) if (id && tr48Text_(tr48Get_(v[i], m, ['題目ID'])) === id) { row = i + 1; break; }
  if (!id) id = tr48Id_('Q');
  const vals = [id, c.id, '單選', tr48Text_(payload.question, 3000), tr48Text_(payload.optionA, 1000), tr48Text_(payload.optionB, 1000), tr48Text_(payload.optionC, 1000), tr48Text_(payload.optionD, 1000), tr48Text_(payload.correctAnswer, 2).toUpperCase(), Number(payload.points || 10), tr48Text_(payload.explanation, 2000), '啟用', Number(payload.sort || 999), new Date(), new Date()];
  if (row) sh.getRange(row, 1, 1, vals.length).setValues([vals]); else sh.appendRow(vals);
  return { ok: true, message: '測驗題目已儲存。', questionId: id, editor: user.employeeId || user.account };
}
function deleteTrainingQuestionR48(payload) {
  payload = payload || {}; const user = tr48User_(payload.token); tr51RequireManager_(user);
  const sh = tr48Db_().getSheetByName(TRAIN_R48.QUESTIONS), v = sh.getDataRange().getValues(), m = tr48Map_(v[0]);
  for (let i = 1; i < v.length; i++) if (tr48Text_(tr48Get_(v[i], m, ['題目ID'])) === String(payload.questionId)) { sh.getRange(i + 1, m['狀態'] + 1).setValue('停用'); return { ok: true, message: '題目已停用。' }; }
  throw new Error('找不到題目。');
}
function getTrainingQuestionEditorR48(payload) {
  payload = payload || {}; const user = tr48User_(payload.token); tr51RequireManager_(user);
  return tr48Rows_(TRAIN_R48.QUESTIONS).filter(x => tr48Text_(tr48Get_(x.r, x.m, ['課程ID'])) === String(payload.courseId) && (tr48Text_(tr48Get_(x.r, x.m, ['狀態'])) || '啟用') !== '停用').map(x => ({
    questionId: tr48Text_(tr48Get_(x.r, x.m, ['題目ID'])), question: tr48Text_(tr48Get_(x.r, x.m, ['題目'])),
    optionA: tr48Text_(tr48Get_(x.r, x.m, ['選項A'])), optionB: tr48Text_(tr48Get_(x.r, x.m, ['選項B'])), optionC: tr48Text_(tr48Get_(x.r, x.m, ['選項C'])), optionD: tr48Text_(tr48Get_(x.r, x.m, ['選項D'])),
    correctAnswer: tr48Text_(tr48Get_(x.r, x.m, ['正確答案'])), points: Number(tr48Get_(x.r, x.m, ['配分']) || 10), explanation: tr48Text_(tr48Get_(x.r, x.m, ['答案說明'])), sort: Number(tr48Get_(x.r, x.m, ['排序']) || 999)
  }));
}
function addTrainingCoursePathR48(payload) {
  payload = payload || {}; const user = tr48User_(payload.token); tr51RequireManager_(user);
  const c = tr48Course_(payload.courseId); if (!c) throw new Error('找不到課程。');
  const path = tr48Text_(payload.path, 2000); if (!path) throw new Error('請輸入網址或路徑。');
  tr48Db_().getSheetByName(TRAIN_R48.ATTACH).appendRow([tr48Id_('TA'), c.id, tr48Text_(payload.title, 200) || '課程路徑', '路徑', '', path, '', '啟用', user.employeeId || user.account, new Date(), new Date()]);
  return { ok: true, message: '課程路徑已新增。' };
}
function uploadTrainingCourseFilesR48(payload) {
  payload = payload || {}; const user = tr48User_(payload.token); tr51RequireManager_(user);
  const c = tr48Course_(payload.courseId); if (!c) throw new Error('找不到課程。');
  const files = Array.isArray(payload.files) ? payload.files : []; if (!files.length) throw new Error('請選擇檔案。'); if (files.length > 12) throw new Error('單次最多12個檔案。');
  const folder = (() => { const root = DriveApp.getFolderById(TRAIN_R48.ROOT), child = (p, n) => { const it = p.getFoldersByName(n); return it.hasNext() ? it.next() : p.createFolder(n); }; return child(child(root, '教育訓練課程附件'), String(c.id).replace(/[\\/:*?"<>|]+/g, '_')); })();
  const sh = tr48Db_().getSheetByName(TRAIN_R48.ATTACH), saved = [];
  files.forEach(f => {
    const b64 = String(f.base64 || '').split(',').pop(), name = tr48Text_(f.fileName || f.name, 180); if (!b64 || !name) return;
    if (/\.(exe|bat|cmd|ps1|vbs|js|msi|scr)$/i.test(name)) throw new Error('禁止上傳執行檔。');
    const blob = Utilities.newBlob(Utilities.base64Decode(b64), tr48Text_(f.mimeType, 120) || 'application/octet-stream', name), file = folder.createFile(blob), id = tr48Id_('TA');
    sh.appendRow([id, c.id, name, '檔案', file.getId(), file.getUrl(), file.getMimeType(), '啟用', user.employeeId || user.account, new Date(), new Date()]);
    saved.push({ attachmentId: id, title: name, url: file.getUrl() });
  });
  return { ok: true, message: '已上傳 ' + saved.length + ' 個檔案。', files: saved };
}
function deleteTrainingCourseAttachmentR48(payload) {
  payload = payload || {}; const user = tr48User_(payload.token); tr51RequireManager_(user);
  const sh = tr48Db_().getSheetByName(TRAIN_R48.ATTACH), v = sh.getDataRange().getValues(), m = tr48Map_(v[0]);
  for (let i = 1; i < v.length; i++) if (tr48Text_(tr48Get_(v[i], m, ['附件ID'])) === String(payload.attachmentId)) {
    const fid = tr48Text_(tr48Get_(v[i], m, ['檔案ID'])); if (fid) try { DriveApp.getFileById(fid).setTrashed(true); } catch (ignore) {}
    sh.getRange(i + 1, m['狀態'] + 1).setValue('刪除'); sh.getRange(i + 1, m['更新時間'] + 1).setValue(new Date()); return { ok: true, message: '附件已刪除。' };
  }
  throw new Error('找不到附件。');
}

function getTrainingSupervisorReportR48(payload) {
  payload = payload || {}; const user = tr48User_(payload.token); tr51RequireManager_(user);
  const courses = {}; tr48Courses_().forEach(c => courses[c.id] = c);
  const exams = {}; tr48Rows_(TRAIN_R48.EXAMS).forEach(x => { const key = tr48Text_(tr48Get_(x.r, x.m, ['課程ID'])) + '|' + tr48Text_(tr48Get_(x.r, x.m, ['學員帳號'])).toUpperCase(), t = tr48Get_(x.r, x.m, ['交卷時間', '建立時間']); if (!exams[key] || new Date(t) > new Date(exams[key].submittedAt)) exams[key] = { score: Number(tr48Get_(x.r, x.m, ['分數']) || 0), result: tr48Text_(tr48Get_(x.r, x.m, ['結果'])), submittedAt: dateTime_(t) }; });
  const signs = {}; tr48Rows_(TRAIN_R48.SIGN).forEach(x => { const key = tr48Text_(tr48Get_(x.r, x.m, ['課程ID'])) + '|' + tr48Text_(tr48Get_(x.r, x.m, ['學員帳號'])).toUpperCase(); signs[key] = { signed: true, signedAt: dateTime_(tr48Get_(x.r, x.m, ['簽名時間'])), url: tr48Text_(tr48Get_(x.r, x.m, ['簽名圖片連結'])) }; });
  const qc = tr48QuestionCount_();
  let rows = tr48Rows_(TRAIN_R48.COMPLETE).map(x => {
    const courseId = tr48Text_(tr48Get_(x.r, x.m, ['課程ID'])), account = tr48Text_(tr48Get_(x.r, x.m, ['學員帳號'])), key = courseId + '|' + account.toUpperCase(), c = courses[courseId] || {}, q = qc[courseId] || 0;
    const confirmed = tr48Text_(tr48Get_(x.r, x.m, ['完成確認'])) === '是', exam = exams[key] || null, signature = signs[key] || null;
    const complete = tr51Complete_({ confirmed: confirmed }, exam, signature, q);
    return {
      courseId: courseId, courseName: tr48Text_(tr48Get_(x.r, x.m, ['課程名稱'])) || c.title || courseId, category: c.category || '', systemCategory: c.systemCategory || '', deviceCategory: c.deviceCategory || '', kind: c.kind || '',
      account: account, name: tr48Text_(tr48Get_(x.r, x.m, ['學員姓名'])) || account, progress: Number(tr48Get_(x.r, x.m, ['進度%']) || 0),
      status: complete ? '已完成' : tr48Text_(tr48Get_(x.r, x.m, ['學習狀態'])), confirmed: confirmed, confirmedAt: dateTime_(tr48Get_(x.r, x.m, ['完成確認時間'])),
      exam: exam, examRequired: q > 0, signature: signature, updatedAt: dateTime_(tr48Get_(x.r, x.m, ['更新時間']))
    };
  });
  const kw = tr48Text_(payload.keyword, 100).toLowerCase(), status = tr48Text_(payload.status, 30);
  if (kw) rows = rows.filter(r => [r.courseName, r.category, r.systemCategory, r.deviceCategory, r.account, r.name].join(' ').toLowerCase().includes(kw));
  if (status) rows = rows.filter(r => r.status === status);
  rows.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  return { ok: true, rows: rows, summary: { records: rows.length, completed: rows.filter(r => r.status === '已完成').length, passed: rows.filter(r => !r.examRequired || (r.exam && r.exam.result === '及格')).length, signed: rows.filter(r => r.signature).length } };
}

/** Add only missing hierarchy rows; existing training records/categories are not deleted or rewritten. */
function syncTrainingCategoriesR51(payload) {
  const user = payload && payload.token ? tr48User_(payload.token) : null;
  if (user) tr51RequireManager_(user);
  setupTrainingCenterR48();
  const sh = tr48Db_().getSheetByName(TRAIN_R48.CATEGORY), values = sh.getDataRange().getValues(), map = tr48Map_(values[0]);
  const parents = {}, children = {};
  for (let i = 1; i < values.length; i++) {
    const id = tr48Text_(tr48Get_(values[i], map, ['分類ID'])), name = tr48Text_(tr48Get_(values[i], map, ['分類名稱'])), parent = tr48Text_(tr48Get_(values[i], map, ['父分類ID'])), level = Number(tr48Get_(values[i], map, ['層級']) || 0), status = tr48Text_(tr48Get_(values[i], map, ['狀態'])) || '啟用';
    if (!id || !name || status === '停用') continue;
    if (level === 1 && !parents[name]) parents[name] = id;
    if (level === 2 && parent) children[parent + '|' + name] = id;
  }
  const tree = tr51BuildCatalogTree_(tr48Courses_()), added = [];
  tree.forEach((sys, si) => {
    let parentId = parents[sys.name];
    if (!parentId) {
      parentId = 'CAT_R51_' + Utilities.getUuid().replace(/-/g, '').slice(0, 12).toUpperCase();
      sh.appendRow([parentId, sys.name, '', 1, 300 + si * 10, '啟用', new Date(), new Date()]);
      parents[sys.name] = parentId; added.push(sys.name);
    }
    sys.children.forEach((dev, di) => {
      const key = parentId + '|' + dev.name;
      if (!children[key]) {
        const childId = 'CAT_R51_' + Utilities.getUuid().replace(/-/g, '').slice(0, 12).toUpperCase();
        sh.appendRow([childId, dev.name, parentId, 2, 1000 + di, '啟用', new Date(), new Date()]);
        children[key] = childId; added.push(sys.name + '／' + dev.name);
      }
    });
  });
  return { ok: true, message: '教育訓練分類同步完成。', addedCount: added.length, added: added, catalogSystems: tree.length };
}
function setupTrainingCenterR51() {
  const base = setupTrainingCenterR48();
  const sync = syncTrainingCategoriesR51();
  PropertiesService.getScriptProperties().setProperty('PSS_TRAINING_R51', '1');
  PropertiesService.getScriptProperties().setProperty('PSS_TRAINING_R51_INSTALLED_AT', new Date().toISOString());
  return 'PSS Education Center R5.1 初始化完成。\n' + base + '\n分類新增：' + sync.addedCount + ' 項。';
}
function diagnoseTrainingCenterR51(payload) {
  const user = payload && payload.token ? tr48User_(payload.token) : null;
  if (user) tr51RequireManager_(user);
  const courses = tr48Courses_(), bySource = {}, byKind = {}, bySystem = {};
  courses.forEach(c => { bySource[c.source] = (bySource[c.source] || 0) + 1; byKind[c.kind] = (byKind[c.kind] || 0) + 1; bySystem[c.systemCategory] = (bySystem[c.systemCategory] || 0) + 1; });
  return { ok: true, version: 'V20.5 R5.1', total: courses.length, bySource: bySource, byKind: byKind, bySystem: bySystem, tree: tr51BuildCatalogTree_(courses) };
}
