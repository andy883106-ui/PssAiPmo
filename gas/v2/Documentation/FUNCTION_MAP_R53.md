# V20.5 R5.3｜功能對應程式

| 功能 | 前端入口 | 後端/API | 資料表 |
|---|---|---|---|
| 工作詳情 | 詳情／關聯詳情 | getTaskDrawerR4 | 任務派工、每日工作日誌、雲端索引 |
| 工作編輯＋附件續編 | 編輯 | getTaskEditorR53 / updateTaskR53 | 任務派工 |
| 刪除工作 | 刪除 | deleteTaskR53 | 任務派工、SYS_R53_刪除任務紀錄 |
| 重複工作檢查 | 檢查重複工作 | findTaskDuplicatesR53 | 任務派工 |
| 工作回報 | 回報 | saveDailyReportV17 | 每日工作日誌、任務派工 |
| 專案回報設定 | 回報狀況 | get/saveProjectReportSettingR53 | 專案報告設定 |
| 每週工作工作台 | 每週工作／週四會議 | getWeeklyMeetingWorkspaceR53 | 任務派工、每日工作日誌、MTG_WEB_R43_會議事項 |
| 會議選取／人工新增 | 加入會議追蹤／新增會議事項 | saveWeeklyMeetingSelectionR53 / saveMeetingWorkItemR53 | MTG_WEB_R43_會議事項 |
| 會議回報／完成／下週 | 會議追蹤清單 | reportMeetingWorkItemR53 | 會議事項、每日工作日誌、任務派工 |
| 會議紀錄 | 產出會議紀錄 | generateWeeklyMeetingMinutesR53 | Google Docs |
| 教育訓練目錄 | 教育訓練 | getTrainingCenterR53 | 教育訓練相關表 |
| 課程／手冊設定 | 編輯課程／手冊資料 | saveTrainingCourseR53 | TRAIN_課程設定 |
| 功能說明 | ？ 功能說明／F1 | getFeatureGuideR53 | 無 |
| 系統檢查 | 功能說明→系統檢查 | getRuntimeHealthR53 | 核心資料表 |
