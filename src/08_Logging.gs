/*******************************************************
 * 08_Logging.gs
 * Logging and debug helpers.
 *******************************************************/


/*******************************************************
 * Make sure the BotLogs sheet has the correct header.
 *******************************************************/
function ensureLogsHeader_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Timestamp',
      'Stage',
      'Detail',
      'Extra JSON'
    ]);

    formatLogsSheet_(sheet);
    return;
  }

  formatLogsSheet_(sheet);
}


/*******************************************************
 * Main logger.
 *
 * Writes logs to the BotLogs sheet.
 * Used by almost every part of the bot.
 *******************************************************/
function log_(stage, detail, extra) {
  if (typeof ENABLE_LOGGING !== 'undefined' && ENABLE_LOGGING === false) {
    return;
  }

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = getOrCreateSheet_(ss, LOG_SHEET_NAME);

    ensureLogsHeader_(sheet);

    sheet.appendRow([
      new Date(),
      String(stage || ''),
      String(detail || ''),
      safeJson_(extra || {}, 4000)
    ]);

    SpreadsheetApp.flush();

  } catch (err) {
    console.error('log_ failed: ' + stack_(err));
  }
}


/*******************************************************
 * Format BotLogs sheet.
 *******************************************************/
function formatLogsSheet_(sheet) {
  const lastRow = Math.max(sheet.getLastRow(), 1);
  const lastCol = Math.max(sheet.getLastColumn(), 4);

  sheet.setFrozenRows(1);

  sheet.getRange(1, 1, 1, lastCol)
    .setBackground('#111827')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  sheet.getRange(1, 1, lastRow, lastCol)
    .setVerticalAlignment('top');

  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 1)
      .setNumberFormat('yyyy-mm-dd hh:mm:ss');
  }

  sheet.setColumnWidth(1, 160);
  sheet.setColumnWidth(2, 220);
  sheet.setColumnWidth(3, 320);
  sheet.setColumnWidth(4, 500);

  sheet.getRange(1, 1, lastRow, lastCol).setWrap(true);
}


/*******************************************************
 * Safely stringify JSON for logging.
 *******************************************************/
function safeJson_(value, maxLength) {
  let text;

  try {
    text = JSON.stringify(value);
  } catch (err) {
    text = String(value);
  }

  return truncate_(text, maxLength || 4000);
}


/*******************************************************
 * Truncate long text.
 *******************************************************/
function truncate_(text, maxLength) {
  text = String(text || '');

  if (text.length <= maxLength) {
    return text;
  }

  return text.slice(0, maxLength) + '... [truncated]';
}


/*******************************************************
 * Convert error to readable stack/message.
 *******************************************************/
function stack_(err) {
  if (!err) {
    return 'Unknown error';
  }

  return err.stack ? err.stack : String(err);
}
