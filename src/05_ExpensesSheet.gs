/*******************************************************
 * 05_ExpensesSheet.gs
 * Google Sheets logic for expenses.
 *******************************************************/


/*******************************************************
 * Initialize required sheets.
 *******************************************************/
function initSheets_() {
  const ss = SpreadsheetApp.openById(getSpreadsheetId_());

  const expenses = getOrCreateSheet_(ss, EXPENSES_SHEET_NAME);
  ensureExpensesHeader_(expenses);

  const logs = getOrCreateSheet_(ss, LOG_SHEET_NAME);
  ensureLogsHeader_(logs);
}


/*******************************************************
 * Get or create a sheet by name.
 *******************************************************/
function getOrCreateSheet_(ss, name) {
  let sheet = ss.getSheetByName(name);

  if (!sheet) {
    sheet = ss.insertSheet(name);
  }

  return sheet;
}


/*******************************************************
 * Make sure the Expenses sheet has the correct header.
 *******************************************************/
function ensureExpensesHeader_(sheet) {
  const expectedHeaders = [
    'Timestamp',
    'Date',
    'Month',
    'Person',
    'Telegram Username',
    'Description',
    'Category',
    'Amount',
    'Currency',
    'Raw message',
    'Telegram message ID',
    'Telegram update ID',
    'Chat ID',
    'Telegram User ID'
  ];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(expectedHeaders);
    formatExpensesSheet_(sheet);
    return;
  }

  const lastCol = Math.max(sheet.getLastColumn(), expectedHeaders.length);
  const currentHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  const hasPerson = currentHeaders.indexOf('Person') !== -1;
  const hasCategory = currentHeaders.indexOf('Category') !== -1;
  const hasTelegramUserId = currentHeaders.indexOf('Telegram User ID') !== -1;

  if (!hasPerson || !hasCategory || !hasTelegramUserId) {
    const backupName = 'Expenses_Backup_' + Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      'yyyyMMdd_HHmmss'
    );

    sheet.copyTo(SpreadsheetApp.openById(getSpreadsheetId_())).setName(backupName);

    sheet.clear();
    sheet.appendRow(expectedHeaders);
    formatExpensesSheet_(sheet);

    log_('EXPENSES_HEADER_MIGRATED', 'Expenses header upgraded. Old sheet copied to backup.', {
      backupName: backupName
    });

    return;
  }

  formatExpensesSheet_(sheet);
}


/*******************************************************
 * Append one parsed expense to the sheet.
 *******************************************************/
function appendExpense_(msg, updateId, parsed, rawText, userProfile) {
  const ss = SpreadsheetApp.openById(getSpreadsheetId_());
  const sheet = getOrCreateSheet_(ss, EXPENSES_SHEET_NAME);

  ensureExpensesHeader_(sheet);

  const messageDate = new Date((msg.date || Math.floor(Date.now() / 1000)) * 1000);
  const displayDate = formatDateOnly_(messageDate);
  const month = formatMonth_(messageDate);
  const category = detectCategory_(parsed.description, rawText);

  const row = [
    messageDate,
    displayDate,
    month,
    userProfile.name,
    userProfile.username || '',
    parsed.description,
    category,
    parsed.amount,
    parsed.currency,
    rawText,
    msg.message_id || '',
    updateId,
    msg.chat.id,
    userProfile.telegramUserId
  ];

  sheet.appendRow(row);
  SpreadsheetApp.flush();

  const rowNumber = sheet.getLastRow();

  formatExpensesSheet_(sheet);
  rebuildDashboard_();

  log_('SHEET_APPEND_OK', 'Expense row appended.', {
    rowNumber: rowNumber,
    row: row
  });

  return rowNumber;
}


/*******************************************************
 * Read expenses as objects.
 *******************************************************/
function getExpenseRows_() {
  const ss = SpreadsheetApp.openById(getSpreadsheetId_());
  const sheet = getOrCreateSheet_(ss, EXPENSES_SHEET_NAME);

  ensureExpensesHeader_(sheet);

  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return [];
  }

  const values = sheet.getRange(2, 1, lastRow - 1, 14).getValues();

  return values.map(function(row) {
    return {
      timestamp: row[0],
      date: row[1],
      month: row[2],
      person: row[3],
      username: row[4],
      description: row[5],
      category: row[6],
      amount: row[7],
      currency: row[8],
      rawMessage: row[9],
      telegramMessageId: row[10],
      telegramUpdateId: row[11],
      chatId: row[12],
      telegramUserId: String(row[13])
    };
  });
}


/*******************************************************
 * Category detection.
 *******************************************************/
function detectCategory_(description, rawText) {
  const text = `${description || ''} ${rawText || ''}`.toLowerCase();

  const rules = [
    {
      category: 'Groceries',
      keywords: [
        'migros', 'coop', 'aldi', 'lidl', 'denner', 'manor food',
        'supermarket', 'grocery', 'groceries', 'food'
      ]
    },
    {
      category: 'Restaurant / Coffee',
      keywords: [
        'cafe', 'café', 'coffee', 'restaurant', 'mcdonald', 'burger',
        'pizza', 'kebab', 'sushi', 'takeaway', 'ubereats', 'eat'
      ]
    },
    {
      category: 'Transport',
      keywords: [
        'flixbus', 'sbb', 'cff', 'train', 'bus', 'tram', 'metro',
        'uber', 'taxi', 'ticket', 'transport'
      ]
    },
    {
      category: 'Rent / Housing',
      keywords: [
        'rent', 'loyer', 'apartment', 'studio', 'electricity',
        'internet', 'wifi', 'bill', 'home', 'insurance'
      ]
    },
    {
      category: 'Health',
      keywords: [
        'doctor', 'medecin', 'médecin', 'pharmacy', 'pharmacie',
        'medicine', 'dentist', 'therapy', 'health'
      ]
    },
    {
      category: 'Education / Tech',
      keywords: [
        'school', '42', 'book', 'course', 'udemy', 'github',
        'domain', 'hosting', 'server', 'computer', 'keyboard',
        'mouse', 'software'
      ]
    },
    {
      category: 'Shopping',
      keywords: [
        'amazon', 'zalando', 'ikea', 'clothes', 'shirt', 'shoes',
        'electronics', 'shopping'
      ]
    },
    {
      category: 'Entertainment',
      keywords: [
        'netflix', 'spotify', 'steam', 'game', 'cinema', 'movie',
        'concert', 'museum', 'theatre'
      ]
    }
  ];

  for (const rule of rules) {
    for (const keyword of rule.keywords) {
      if (text.includes(keyword)) {
        return rule.category;
      }
    }
  }

  return 'Other';
}


/*******************************************************
 * Date helpers.
 *******************************************************/
function formatDateOnly_(date) {
  return Utilities.formatDate(
    date,
    Session.getScriptTimeZone(),
    'yyyy-MM-dd'
  );
}


function formatMonth_(date) {
  return Utilities.formatDate(
    date,
    Session.getScriptTimeZone(),
    'yyyy-MM'
  );
}


/*******************************************************
 * Expenses sheet formatting.
 *******************************************************/
function formatExpensesSheet_(sheet) {
  const lastRow = Math.max(sheet.getLastRow(), 1);
  const lastCol = Math.max(sheet.getLastColumn(), 14);

  sheet.setFrozenRows(1);

  const header = sheet.getRange(1, 1, 1, lastCol);

  header
    .setBackground('#1f2937')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  sheet.getRange(1, 1, lastRow, lastCol)
    .setVerticalAlignment('middle');

  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 1).setNumberFormat('yyyy-mm-dd hh:mm');
    sheet.getRange(2, 2, lastRow - 1, 1).setNumberFormat('yyyy-mm-dd');
    sheet.getRange(2, 8, lastRow - 1, 1).setNumberFormat('#,##0.00');
  }

  sheet.setColumnWidth(1, 150);
  sheet.setColumnWidth(2, 110);
  sheet.setColumnWidth(3, 90);
  sheet.setColumnWidth(4, 180);
  sheet.setColumnWidth(5, 150);
  sheet.setColumnWidth(6, 90);
  sheet.setColumnWidth(7, 80);
  sheet.setColumnWidth(8, 220);
  sheet.setColumnWidth(9, 130);
  sheet.setColumnWidth(10, 130);
  sheet.setColumnWidth(11, 130);

  const rules = [];

  if (lastRow > 1) {
    const categoryRange = sheet.getRange(2, 5, lastRow - 1, 1);

    rules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextContains('Groceries')
        .setBackground('#dcfce7')
        .setRanges([categoryRange])
        .build()
    );

    rules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextContains('Transport')
        .setBackground('#dbeafe')
        .setRanges([categoryRange])
        .build()
    );

    rules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextContains('Restaurant')
        .setBackground('#fef3c7')
        .setRanges([categoryRange])
        .build()
    );

    rules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextContains('Entertainment')
        .setBackground('#ede9fe')
        .setRanges([categoryRange])
        .build()
    );

    rules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextContains('Health')
        .setBackground('#fee2e2')
        .setRanges([categoryRange])
        .build()
    );

    rules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextContains('Other')
        .setBackground('#f3f4f6')
        .setRanges([categoryRange])
        .build()
    );
  }

  sheet.setConditionalFormatRules(rules);
}


/*******************************************************
 * Manual test for sheet connection.
 *******************************************************/
function testSheetConnection() {
  initSheets_();

  const ss = SpreadsheetApp.openById(getSpreadsheetId_());
  const sheet = getOrCreateSheet_(ss, EXPENSES_SHEET_NAME);

  ensureExpensesHeader_(sheet);

  sheet.appendRow([
    new Date(),
    formatDateOnly_(new Date()),
    formatMonth_(new Date()),
    'test',
    'Other',
    1,
    DEFAULT_CURRENCY,
    'manual Apps Script test',
    'manual',
    'manual',
    'manual'
  ]);

  SpreadsheetApp.flush();

  formatExpensesSheet_(sheet);
  rebuildDashboard_();

  log_('TEST_SHEET_OK', 'Manual test row added.', {});

  Logger.log('Test row added to Expenses sheet.');
}
