/**
 * PSS AI-PMO V20.5 R5.3｜功能說明與系統健康檢查
 */
const PSS_R53_GUIDE = Object.freeze({
  VERSION: 'V20.5 R5.3',
  NAME: 'PSS AI-PMO｜工作回報、週會與教育訓練整合版'
});

function getFeatureGuideR53(payload) {
  payload = payload || {};
  requireUser_(payload.token);
  return {
    version: PSS_R53_GUIDE.VERSION,
    name: PSS_R53_GUIDE.NAME,
    modules: [
      {id:'task',title:'工作事項',summary:'任務詳情、編輯、回報、完成、刪除與重複檢查。',steps:['編輯時先顯示既有附件','新附件只追加，不覆蓋舊檔','疑似重複依專案＋內容＋負責人分組','刪除前保留完整刪除稽核紀錄']},
      {id:'project',title:'專案與關聯詳情',summary:'專案摘要、關聯工作、回報、檔案路徑與推薦教材。',steps:['專案報告可設定顯示／隱藏','可編輯回報狀況、摘要與下次追蹤日','可由專案直接新增工作回報']},
      {id:'meeting',title:'每週工作／週四會議',summary:'每天可重新檢視本週工作、人員回報、下週安排與未完成事項。',steps:['主管自行選入真正需要開會的工作','可人工新增並關聯專案','會中可回報、完成或建立下週追蹤','會後可再編輯後產出正式會議紀錄','電子簽名／歷史仍連至既有會議程式']},
      {id:'training',title:'教育訓練中心',summary:'先選系統，再選課程，再進入教材、確認、測驗與簽名。',steps:['主管可編輯課程／手冊設定','教材與附件可持續追加','課程完成紀錄、測驗與簽名分開保存','主管可查詢學員學習結果']},
      {id:'files',title:'附件與檔案規則',summary:'工作、回報與課程都優先顯示既有資料，再追加新資料。',steps:['避免相同檔案重複上傳','Drive連結與檔案可並存','歷史資料不因本次新增附件被覆蓋']}
    ]
  };
}

function getRuntimeHealthR53(payload) {
  payload = payload || {};
  requireUser_(payload.token);
  const ss = getDb_();
  const requiredFunctions = [
    'getTaskDrawerR4','getProjectDrawerR4','getTaskEditorR53','updateTaskR53','deleteTaskR53',
    'findTaskDuplicatesR53','getProjectReportSettingR53','saveProjectReportSettingR53',
    'getWeeklyMeetingWorkspaceR53','saveWeeklyMeetingSelectionR53','saveMeetingWorkItemR53',
    'reportMeetingWorkItemR53','generateWeeklyMeetingMinutesR53','getTrainingCenterR53','getTrainingCourseR53','saveTrainingCourseR53'
  ];
  const missingFunctions = requiredFunctions.filter(function(name){
    try { return eval('typeof '+name) !== 'function'; } catch(e) { return true; }
  });
  const requiredSheets = ['任務派工','每日工作日誌','專案清單','MTG_WEB_R43_會議事項','專案報告設定','TRAIN_課程設定'];
  const sheetState = requiredSheets.map(function(name){return {name:name,exists:!!ss.getSheetByName(name)};});
  return {
    ok: missingFunctions.length===0 && sheetState.every(function(x){return x.exists;}),
    version:PSS_R53_GUIDE.VERSION,
    database:ss.getName(),
    missingFunctions:missingFunctions,
    sheets:sheetState,
    time:Utilities.formatDate(new Date(),'Asia/Taipei','yyyy/MM/dd HH:mm:ss')
  };
}
