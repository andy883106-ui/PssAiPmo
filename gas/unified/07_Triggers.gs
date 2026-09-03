/** Optional form, daily cache and Wednesday meeting-scan triggers. Install only after migration. */
function installV21Triggers() {
  return v21Safe_('INSTALL_TRIGGERS', function() {
    if (!v21HasCanonicalData_(PMO_V21.SHEETS.PROJECTS)) throw new Error('請先完成 V21 資料遷移。');
    var handlers = ['onFormSubmitV21','refreshDailyProjectionV21','scheduledThursdayRefreshV21'];
    ScriptApp.getProjectTriggers().forEach(function(trigger) {
      if (handlers.indexOf(trigger.getHandlerFunction()) >= 0) ScriptApp.deleteTrigger(trigger);
    });
    ScriptApp.newTrigger('onFormSubmitV21').forSpreadsheet(PMO_V21.SOURCE_DATABASE_ID).onFormSubmit().create();
    ScriptApp.newTrigger('refreshDailyProjectionV21').timeBased().atHour(6).everyDays(1).inTimezone(PMO_V21.TIME_ZONE).create();
    ScriptApp.newTrigger('scheduledThursdayRefreshV21').timeBased().onWeekDay(ScriptApp.WeekDay.WEDNESDAY).atHour(18).everyWeeks(1).inTimezone(PMO_V21.TIME_ZONE).create();
    return { installed: handlers, sourceDatabaseId: PMO_V21.SOURCE_DATABASE_ID, targetDatabaseId: v21Db_().getId() };
  });
}

function onFormSubmitV21(event) {
  var named = event && event.namedValues ? event.namedValues : {};
  var projectValue = v21Named_(named, ['場地代號','專案','專案名稱']);
  var projectId = projectValue.split(/[｜|]/)[0].trim();
  if (!v21LoadProjects_().some(function(project){ return project.id === projectId; })) {
    var matched = v21LoadProjects_().filter(function(project){ return project.name === projectValue || project.name === projectValue.split(/[｜|]/).pop().trim(); })[0];
    projectId = matched ? matched.id : '';
  }
  var result = saveReportV21({
    id: event && event.range ? 'FORM-' + event.range.getSheet().getSheetId() + '-' + event.range.getRow() : '',
    date: v21Named_(named, ['回報日期','日期']), employee: v21Named_(named, ['人員','回報人員','姓名']),
    supervisor: v21Named_(named, ['主管']), projectId: projectId,
    title: v21Named_(named, ['事件標題','工作標題']), completed: v21Named_(named, ['完成／回報事項','完成/回報事項','今日完成事項']),
    followUp: v21Named_(named, ['後續事項','後續須安排事項','明日計畫']),
    attachment: v21Named_(named, ['附件','附件/照片','附件連結']), relatedWorkId: v21Named_(named, ['關聯工作ID','任務ID']),
    completeWork: /^(是|true|yes|完成)$/i.test(v21Named_(named, ['完成既有任務','完成任務'])), createFollowUp: true
  });
  if (!result.ok) throw new Error(result.message);
  return result;
}

function v21Named_(namedValues, keys) {
  for (var i=0;i<keys.length;i+=1) {
    var value = namedValues[keys[i]];
    if (Array.isArray(value) && value.length) return v21Text_(value.join('\n'));
    if (value) return v21Text_(value);
  }
  return '';
}

function refreshDailyProjectionV21() {
  v21ClearCache_();
  var result = getBootstrapV21({});
  if (!result.ok) throw new Error(result.message);
  v21UpsertObject_(PMO_V21.SHEETS.SETTINGS, PMO_V21.HEADERS.SETTINGS, '設定鍵', {
    '設定鍵':'LAST_DAILY_REFRESH','設定值':v21Now_(),'說明':JSON.stringify(result.data.summary),'更新時間':v21Now_()
  });
  return result.data.summary;
}
