/*******************************************************
 * 09_ManualTools.gs
 * Manual tools you can run from Apps Script.
 *
 * These are not called directly by Telegram unless another function calls them.
 *******************************************************/


/*******************************************************
 * Run polling manually once.
 *
 * Use this when you send a Telegram message and do not want
 * to wait up to 1 minute for the automatic trigger.
 *******************************************************/
function runOnceNow() {
  pollTelegram();
}


/*******************************************************
 * Stop the bot.
 *
 * This removes the automatic 1-minute polling trigger.
 * Telegram messages will stop being processed automatically.
 *******************************************************/
function stopBot() {
  clearExistingTriggers_();

  log_('BOT_STOPPED', 'Polling trigger removed.', {});

  Logger.log('Bot stopped. No more automatic polling.');
}


/*******************************************************
 * Restart the bot trigger only.
 *
 * This removes old polling triggers and creates one clean trigger.
 * It does NOT reset Telegram offset.
 *******************************************************/
function restartPollingTrigger() {
  clearExistingTriggers_();

  ScriptApp.newTrigger(POLL_FUNCTION_NAME)
    .timeBased()
    .everyMinutes(1)
    .create();

  log_('POLLING_TRIGGER_RESTARTED', 'Polling trigger restarted.', {});

  Logger.log('Polling trigger restarted. Bot will check Telegram every minute.');
}


/*******************************************************
 * Full clean setup.
 *
 * Use this if the bot gets weird again:
 * - initializes sheets
 * - deletes webhook
 * - removes old triggers
 * - skips old pending Telegram messages
 * - creates one clean polling trigger
 *******************************************************/
function resetAndSetupBotClean() {
  initSheets_();

  log_('RESET_SETUP_START', 'Starting clean reset/setup.', {});

  deleteTelegramWebhook(true);
  clearExistingTriggers_();
  forgetPendingTelegramUpdates_();

  ScriptApp.newTrigger(POLL_FUNCTION_NAME)
    .timeBased()
    .everyMinutes(1)
    .create();

  rebuildDashboard_();

  log_('RESET_SETUP_DONE', 'Clean reset/setup completed.', {});

  Logger.log('Clean setup complete. Send a NEW Telegram message and wait up to 1 minute, or run runOnceNow manually.');
}


/*******************************************************
 * Reset Telegram offset to zero.
 *
 * WARNING:
 * This can make the bot process old Telegram messages again.
 * Use resetOffsetToLatestUpdate() instead if you want a clean start.
 *******************************************************/
function resetBotOffsetOnly() {
  PropertiesService.getScriptProperties().setProperty('LAST_UPDATE_ID', '0');

  log_('OFFSET_RESET', 'LAST_UPDATE_ID reset to 0.', {});

  Logger.log('Offset reset to 0. Warning: old messages may be processed again.');
}


/*******************************************************
 * Set offset to the newest Telegram update.
 *
 * This is safer than resetBotOffsetOnly().
 * It tells the bot to ignore everything old and only process new messages.
 *******************************************************/
function resetOffsetToLatestUpdate() {
  forgetPendingTelegramUpdates_();

  log_('OFFSET_SET_TO_LATEST', 'Offset moved to latest Telegram update.', {});

  Logger.log('Offset moved to latest Telegram update. Send a NEW Telegram message now.');
}


/*******************************************************
 * Show current project status.
 *******************************************************/
function showStatus() {
  const props = PropertiesService.getScriptProperties();

  const pollingTriggers = ScriptApp.getProjectTriggers()
    .filter(function(trigger) {
      return trigger.getHandlerFunction() === POLL_FUNCTION_NAME;
    });

  const ss = SpreadsheetApp.openById(getSpreadsheetId_());
  const expensesSheet = getOrCreateSheet_(ss, EXPENSES_SHEET_NAME);
  const logsSheet = getOrCreateSheet_(ss, LOG_SHEET_NAME);
  const dashboardSheet = getOrCreateSheet_(ss, DASHBOARD_SHEET_NAME);

  const status = {
    lastUpdateId: props.getProperty('LAST_UPDATE_ID') || 'none',
    pollingTriggers: pollingTriggers.length,
    spreadsheetId: getSpreadsheetId_(),
    expensesSheetName: EXPENSES_SHEET_NAME,
    expensesRows: expensesSheet.getLastRow(),
    logsSheetName: LOG_SHEET_NAME,
    logsRows: logsSheet.getLastRow(),
    dashboardSheetName: DASHBOARD_SHEET_NAME,
    dashboardRows: dashboardSheet.getLastRow(),
    defaultCurrency: DEFAULT_CURRENCY,
    loggingEnabled: isLoggingEnabled_()
  };

  Logger.log(JSON.stringify(status, null, 2));

  log_('STATUS', 'Manual status check.', status);

  getTelegramWebhookInfo();
}


/*******************************************************
 * Rebuild dashboard manually.
 *
 * This function already exists in 06_Dashboard.gs as rebuildDashboardNow().
 * This one gives you another clearer name.
 *******************************************************/
function rebuildEverythingNow() {
  initSheets_();
  rebuildDashboard_();

  log_('REBUILD_EVERYTHING_NOW', 'Sheets and dashboard rebuilt manually.', {});

  Logger.log('Expenses sheet checked and dashboard rebuilt.');
}


/*******************************************************
 * Clear BotLogs but keep the header.
 *******************************************************/
function clearBotLogs() {
  const ss = SpreadsheetApp.openById(getSpreadsheetId_());
  const sheet = getOrCreateSheet_(ss, LOG_SHEET_NAME);

  sheet.clear();
  ensureLogsHeader_(sheet);

  Logger.log('BotLogs cleared.');
}


/*******************************************************
 * Clear Dashboard completely and rebuild it.
 *******************************************************/
function clearAndRebuildDashboard() {
  const ss = SpreadsheetApp.openById(getSpreadsheetId_());
  const dashboard = getOrCreateSheet_(ss, DASHBOARD_SHEET_NAME);

  removeAllCharts_(dashboard);
  dashboard.getRange(1, 1, dashboard.getMaxRows(), dashboard.getMaxColumns()).breakApart();
  dashboard.clear();

  rebuildDashboard_();

  log_('DASHBOARD_CLEARED_REBUILT', 'Dashboard cleared and rebuilt.', {});

  Logger.log('Dashboard cleared and rebuilt.');
}


/*******************************************************
 * Clear Expenses sheet but keep the header.
 *
 * WARNING:
 * This deletes all saved expenses from the sheet.
 * Use only while testing.
 *******************************************************/
function clearExpensesKeepHeader() {
  const ss = SpreadsheetApp.openById(getSpreadsheetId_());
  const sheet = getOrCreateSheet_(ss, EXPENSES_SHEET_NAME);

  sheet.clear();
  ensureExpensesHeader_(sheet);

  rebuildDashboard_();

  log_('EXPENSES_CLEARED', 'Expenses sheet cleared manually.', {});

  Logger.log('Expenses cleared. Header kept. Dashboard rebuilt.');
}


/*******************************************************
 * Full test sequence.
 *
 * This does not read Telegram.
 * It tests:
 * - sheets
 * - parser
 * - dashboard
 * - Telegram token via getMe
 *******************************************************/
function runManualHealthCheck() {
  Logger.log('Starting manual health check...');

  initSheets_();

  const examples = [
    '82 euros FlixBus',
    'migros 12.50 chf',
    'coffee 4',
    'cafe 4chf',
    '4 chf cafe',
    '€12 lunch',
    'lunch €12'
  ];

  examples.forEach(function(example) {
    const parsed = parseExpense(example);
    Logger.log(example + ' => ' + JSON.stringify(parsed));
  });

  const telegramResponse = telegramApi_('getMe', {});
  Logger.log('Telegram getMe: ' + telegramResponse.rawBody);

  rebuildDashboard_();

  log_('MANUAL_HEALTH_CHECK', 'Manual health check completed.', {
    telegramOk: telegramResponse.ok,
    telegramHttpCode: telegramResponse.httpCode
  });

  Logger.log('Manual health check finished.');
}


/*******************************************************
 * List current project triggers.
 *******************************************************/
function listTriggers() {
  const triggers = ScriptApp.getProjectTriggers();

  const triggerInfo = triggers.map(function(trigger) {
    return {
      handlerFunction: trigger.getHandlerFunction(),
      eventType: String(trigger.getEventType()),
      triggerSource: String(trigger.getTriggerSource())
    };
  });

  Logger.log(JSON.stringify(triggerInfo, null, 2));

  log_('LIST_TRIGGERS', 'Current triggers listed.', {
    triggers: triggerInfo
  });
}


/*******************************************************
 * Remove every trigger in this Apps Script project.
 *
 * WARNING:
 * This removes all triggers, not only pollTelegram.
 * Useful only if the project gets duplicated/weird.
 *******************************************************/
function deleteAllProjectTriggers() {
  const triggers = ScriptApp.getProjectTriggers();

  triggers.forEach(function(trigger) {
    ScriptApp.deleteTrigger(trigger);
  });

  log_('ALL_TRIGGERS_DELETED', 'All project triggers deleted.', {
    count: triggers.length
  });

  Logger.log('Deleted all project triggers: ' + triggers.length);
}
