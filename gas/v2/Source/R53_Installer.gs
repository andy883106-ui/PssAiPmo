/** PSS AI-PMO V20.5 R5.3｜完整更新初始化 */
function installPssAiPmoR53() {
  const result = setupPssAiPmoR53();
  PropertiesService.getScriptProperties().setProperties({
    'PSS_ACTIVE_VERSION':'V20.5 R5.3',
    'PSS_R53_INSTALLED_AT':new Date().toISOString(),
    'PSS_R53_VERSION':PSS_R53.VERSION
  }, false);
  return {message:'PSS AI-PMO V20.5 R5.3 初始化完成。請再執行 validatePssAiPmoR53()。',setup:result};
}
function validatePssAiPmoR53() {
  const required = [
    'getTaskDrawerR4','getProjectDrawerR4','getTaskEditorR53','updateTaskR53','deleteTaskR53','findTaskDuplicatesR53',
    'getProjectReportSettingR53','saveProjectReportSettingR53','getWeeklyMeetingWorkspaceR53',
    'saveWeeklyMeetingSelectionR53','saveMeetingWorkItemR53','deleteMeetingWorkItemR53','reportMeetingWorkItemR53',
    'generateWeeklyMeetingMinutesR53','getTrainingCenterR48','getTrainingCourseR48','getTrainingCenterR53','getTrainingCourseR53','saveTrainingCourseR53',
    'saveDailyReportV17','createTasksMultiOwnerV17','updateTaskWithFilesR42','getFeatureGuideR53','getRuntimeHealthR53'
  ];
  const missing = required.filter(function(name){ try { return eval('typeof '+name) !== 'function'; } catch(e) { return true; } });
  const sheets = [PSS_R53.SHEETS.PROJECT_REPORT,PSS_R53.SHEETS.TRAINING_CONFIG,PSS_R53.SHEETS.TASK_DELETE_LOG,PSS_R53.SHEETS.MEETING_ITEMS];
  const ss = getDb_();
  const missingSheets = sheets.filter(function(n){return !ss.getSheetByName(n);});
  return {version:PSS_R53.VERSION,missingFunctions:missing,missingSheets:missingSheets,ok:missing.length===0&&missingSheets.length===0};
}
