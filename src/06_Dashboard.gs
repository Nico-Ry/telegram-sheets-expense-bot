/*******************************************************
 * 06_Dashboard.gs
 * Dashboard, summaries, colors, and charts.
 *******************************************************/


/*******************************************************
 * Main dashboard rebuild.
 *******************************************************/
function rebuildDashboard_() {
  const ss = SpreadsheetApp.openById(getSpreadsheetId_());
  const expensesSheet = getOrCreateSheet_(ss, EXPENSES_SHEET_NAME);
  const dashboard = getOrCreateSheet_(ss, DASHBOARD_SHEET_NAME);

  ensureExpensesHeader_(expensesSheet);

  removeAllCharts_(dashboard);
  dashboard.getRange(1, 1, dashboard.getMaxRows(), dashboard.getMaxColumns()).breakApart();
  dashboard.clear();
  dashboard.setConditionalFormatRules([]);

  const data = getExpenseRows_();

  buildDashboardTitle_(dashboard);

  if (data.length === 0) {
    dashboard.getRange('A4').setValue('No expenses yet.');
    formatDashboard_(dashboard);
    return;
  }

  const totalsByCurrency = {};
  const totalsByPersonCurrency = {};
  const totalsByMonthCurrency = {};
  const totalsByCategoryCurrency = {};
  const totalsByPersonCategoryCurrency = {};

  const currentMonth = formatMonth_(new Date());
  const currentMonthByPersonCurrency = {};

  data.forEach(function(row) {
    const amount = Number(row.amount);
    const currency = row.currency;
    const month = row.month;
    const category = row.category || 'Other';
    const person = row.person || 'Unknown';

    if (!amount || !currency) {
      return;
    }

    totalsByCurrency[currency] = (totalsByCurrency[currency] || 0) + amount;

    const personKey = `${person}|${currency}`;
    totalsByPersonCurrency[personKey] = (totalsByPersonCurrency[personKey] || 0) + amount;

    const monthKey = `${month}|${currency}`;
    totalsByMonthCurrency[monthKey] = (totalsByMonthCurrency[monthKey] || 0) + amount;

    const categoryKey = `${category}|${currency}`;
    totalsByCategoryCurrency[categoryKey] = (totalsByCategoryCurrency[categoryKey] || 0) + amount;

    const personCategoryKey = `${person}|${category}|${currency}`;
    totalsByPersonCategoryCurrency[personCategoryKey] =
      (totalsByPersonCategoryCurrency[personCategoryKey] || 0) + amount;

    if (month === currentMonth) {
      currentMonthByPersonCurrency[personKey] =
        (currentMonthByPersonCurrency[personKey] || 0) + amount;
    }
  });

  let row = 4;

  row = writeDashboardSection_(
    dashboard,
    row,
    'Trip Total by Currency',
    ['Currency', 'Total'],
    objectToRows_(totalsByCurrency)
  );

  row += 2;

  row = writeDashboardSection_(
    dashboard,
    row,
    'Total by Person and Currency',
    ['Person', 'Currency', 'Total'],
    splitKeyRows_(totalsByPersonCurrency)
  );

  row += 2;

  row = writeDashboardSection_(
    dashboard,
    row,
    `Current Month by Person (${currentMonth})`,
    ['Person', 'Currency', 'Total'],
    splitKeyRows_(currentMonthByPersonCurrency)
  );

  row += 2;

  row = writeDashboardSection_(
    dashboard,
    row,
    'Total by Month and Currency',
    ['Month', 'Currency', 'Total'],
    splitKeyRows_(totalsByMonthCurrency)
  );

  row += 2;

  row = writeDashboardSection_(
    dashboard,
    row,
    'Total by Category and Currency',
    ['Category', 'Currency', 'Total'],
    splitKeyRows_(totalsByCategoryCurrency)
  );

  row += 2;

  row = writeDashboardSection_(
    dashboard,
    row,
    'Total by Person, Category and Currency',
    ['Person', 'Category', 'Currency', 'Total'],
    splitTripleKeyRows_(totalsByPersonCategoryCurrency)
  );

  row += 2;

  const lastExpenses = data
    .slice(-DASHBOARD_MAX_LAST_EXPENSES)
    .reverse()
    .map(function(r) {
      return [
        r.date,
        r.person,
        r.description,
        r.category,
        r.amount,
        r.currency
      ];
    });

  row = writeDashboardSection_(
    dashboard,
    row,
    `Last ${DASHBOARD_MAX_LAST_EXPENSES} Expenses`,
    ['Date', 'Person', 'Description', 'Category', 'Amount', 'Currency'],
    lastExpenses
  );

  buildChartData_(dashboard, totalsByCategoryCurrency, totalsByMonthCurrency);
  buildPersonChartData_(dashboard, totalsByPersonCurrency);

  formatDashboard_(dashboard);
  addDashboardCharts_(dashboard);

  log_('DASHBOARD_REBUILT', 'Dashboard rebuilt successfully.', {
    expensesCount: data.length
  });
}


/*******************************************************
 * Dashboard title.
 *******************************************************/
function buildDashboardTitle_(dashboard) {
  dashboard.getRange('A1').setValue('Expense Dashboard');
  dashboard.getRange('A1:F1').merge();

  dashboard.getRange('A1')
    .setFontSize(20)
    .setFontWeight('bold')
    .setFontColor('#ffffff')
    .setBackground('#111827')
    .setHorizontalAlignment('center');

  dashboard.getRange('A2').setValue('Last updated');
  dashboard.getRange('B2').setValue(new Date());
  dashboard.getRange('B2').setNumberFormat('yyyy-mm-dd hh:mm');

  dashboard.getRange('A2:B2')
    .setFontWeight('bold')
    .setBackground('#f3f4f6');
}


/*******************************************************
 * Write one dashboard table section.
 *******************************************************/
function writeDashboardSection_(sheet, startRow, title, headers, rows) {
  sheet.getRange(startRow, 1).setValue(title);
  sheet.getRange(startRow, 1, 1, headers.length)
    .merge()
    .setFontWeight('bold')
    .setFontColor('#ffffff')
    .setBackground('#374151');

  sheet.getRange(startRow + 1, 1, 1, headers.length)
    .setValues([headers])
    .setFontWeight('bold')
    .setFontColor('#111827')
    .setBackground('#e5e7eb');

  if (rows.length > 0) {
    sheet.getRange(startRow + 2, 1, rows.length, headers.length).setValues(rows);

    const totalCol = headers.indexOf('Total') + 1;
    const amountCol = headers.indexOf('Amount') + 1;
    const moneyCol = totalCol || amountCol;

    if (moneyCol > 0) {
      sheet.getRange(startRow + 2, moneyCol, rows.length, 1).setNumberFormat('#,##0.00');
    }
  } else {
    sheet.getRange(startRow + 2, 1).setValue('No data');
  }

  return startRow + 2 + Math.max(rows.length, 1);
}


/*******************************************************
 * Build clean chart data on the right side of Dashboard.
 *******************************************************/
function buildChartData_(dashboard, totalsByCategoryCurrency, totalsByMonthCurrency) {
  const categoryRows = splitKeyRows_(totalsByCategoryCurrency);
  const monthRows = splitKeyRows_(totalsByMonthCurrency);

  let startRow = 4;
  const startCol = 8; // H

  dashboard.getRange(startRow, startCol).setValue('Chart Data: Category');
  dashboard.getRange(startRow, startCol, 1, 3)
    .merge()
    .setFontWeight('bold')
    .setBackground('#dbeafe');

  dashboard.getRange(startRow + 1, startCol, 1, 3)
    .setValues([['Category', 'Currency', 'Total']])
    .setFontWeight('bold');

  if (categoryRows.length > 0) {
    dashboard.getRange(startRow + 2, startCol, categoryRows.length, 3).setValues(categoryRows);
    dashboard.getRange(startRow + 2, startCol + 2, categoryRows.length, 1).setNumberFormat('#,##0.00');
  }

  startRow += Math.max(categoryRows.length, 1) + 5;

  dashboard.getRange(startRow, startCol).setValue('Chart Data: Month');
  dashboard.getRange(startRow, startCol, 1, 3)
    .merge()
    .setFontWeight('bold')
    .setBackground('#dcfce7');

  dashboard.getRange(startRow + 1, startCol, 1, 3)
    .setValues([['Month', 'Currency', 'Total']])
    .setFontWeight('bold');

  if (monthRows.length > 0) {
    dashboard.getRange(startRow + 2, startCol, monthRows.length, 3).setValues(monthRows);
    dashboard.getRange(startRow + 2, startCol + 2, monthRows.length, 1).setNumberFormat('#,##0.00');
  }
}


/*******************************************************
 * Add dashboard charts.
 *******************************************************/
function addDashboardCharts_(dashboard) {
  const lastRow = dashboard.getLastRow();

  if (lastRow < 6) {
    return;
  }

  const categoryChartInfo = findSectionInfo_(dashboard, 'Chart Data: Category', 8);
  const monthChartInfo = findSectionInfo_(dashboard, 'Chart Data: Month', 8);

  if (categoryChartInfo && categoryChartInfo.dataRows > 0) {
    const range = dashboard.getRange(
      categoryChartInfo.headerRow,
      8,
      categoryChartInfo.dataRows + 1,
      3
    );

    const chart = dashboard.newChart()
      .setChartType(Charts.ChartType.BAR)
      .addRange(range)
      .setPosition(4, 12, 0, 0)
      .setOption('title', 'Spending by Category')
      .setOption('legend', { position: 'right' })
      .setOption('hAxis', { title: 'Amount' })
      .setOption('vAxis', { title: 'Category' })
      .build();

    dashboard.insertChart(chart);
  }

  if (monthChartInfo && monthChartInfo.dataRows > 0) {
    const range = dashboard.getRange(
      monthChartInfo.headerRow,
      8,
      monthChartInfo.dataRows + 1,
      3
    );

    const chart = dashboard.newChart()
      .setChartType(Charts.ChartType.COLUMN)
      .addRange(range)
      .setPosition(22, 12, 0, 0)
      .setOption('title', 'Spending by Month')
      .setOption('legend', { position: 'right' })
      .setOption('hAxis', { title: 'Month' })
      .setOption('vAxis', { title: 'Amount' })
      .build();

    dashboard.insertChart(chart);
  }

  const personChartInfo = findSectionInfo_(dashboard, 'Chart Data: Person', 12);

  if (personChartInfo && personChartInfo.dataRows > 0) {
    const range = dashboard.getRange(
      personChartInfo.headerRow,
      12,
      personChartInfo.dataRows + 1,
      3
    );

    const chart = dashboard.newChart()
      .setChartType(Charts.ChartType.COLUMN)
      .addRange(range)
      .setPosition(40, 12, 0, 0)
      .setOption('title', 'Spending by Person')
      .setOption('legend', { position: 'right' })
      .setOption('hAxis', { title: 'Person' })
      .setOption('vAxis', { title: 'Amount' })
      .build();

    dashboard.insertChart(chart);
  }
}


/*******************************************************
 * Find chart helper data section.
 *******************************************************/
function findSectionInfo_(sheet, title, column) {
  const lastRow = sheet.getLastRow();

  if (lastRow < 1) {
    return null;
  }

  const values = sheet.getRange(1, column, lastRow, 1).getValues().flat();
  const titleIndex = values.indexOf(title);

  if (titleIndex === -1) {
    return null;
  }

  const titleRow = titleIndex + 1;
  const headerRow = titleRow + 1;
  let row = headerRow + 1;
  let dataRows = 0;

  while (row <= lastRow) {
    const value = sheet.getRange(row, column).getValue();

    if (!value || String(value).startsWith('Chart Data:')) {
      break;
    }

    dataRows++;
    row++;
  }

  return {
    titleRow: titleRow,
    headerRow: headerRow,
    dataRows: dataRows
  };
}


/*******************************************************
 * Remove all charts from a sheet.
 * Google Sheets has no dashboard.clearCharts().
 *******************************************************/
function removeAllCharts_(sheet) {
  const charts = sheet.getCharts();

  charts.forEach(function(chart) {
    sheet.removeChart(chart);
  });
}


/*******************************************************
 * Dashboard formatting.
 *******************************************************/
function formatDashboard_(sheet) {
  sheet.setFrozenRows(1);

  for (let col = 1; col <= 14; col++) {
    sheet.setColumnWidth(col, 140);
  }

  sheet.setColumnWidth(1, 190);
  sheet.setColumnWidth(2, 150);
  sheet.setColumnWidth(3, 150);
  sheet.setColumnWidth(4, 150);
  sheet.setColumnWidth(5, 130);
  sheet.setColumnWidth(8, 190);
  sheet.setColumnWidth(9, 120);
  sheet.setColumnWidth(10, 120);

  const lastRow = Math.max(sheet.getLastRow(), 1);
  const lastCol = Math.max(sheet.getLastColumn(), 10);

  sheet.getRange(1, 1, lastRow, lastCol)
    .setVerticalAlignment('middle');

  sheet.getRange(1, 1, lastRow, lastCol)
    .setBorder(true, true, true, true, true, true, '#e5e7eb', SpreadsheetApp.BorderStyle.SOLID);

  if (lastRow > 1) {
    sheet.getRange(1, 1, lastRow, lastCol).setWrap(true);
  }
}


/*******************************************************
 * Convert object totals to rows.
 *******************************************************/
function objectToRows_(obj) {
  return Object.keys(obj)
    .sort()
    .map(function(key) {
      return [
        key,
        roundMoney_(obj[key])
      ];
    });
}


/*******************************************************
 * Convert "A|B" keyed totals to rows.
 *******************************************************/
function splitKeyRows_(obj) {
  return Object.keys(obj)
    .sort()
    .map(function(key) {
      const parts = key.split('|');

      return [
        parts[0],
        parts[1],
        roundMoney_(obj[key])
      ];
    });
}


/*******************************************************
 * Money rounding helper.
 *******************************************************/
function roundMoney_(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}


/*******************************************************
 * Manual function.
 * Run this if you want to rebuild Dashboard manually.
 *******************************************************/
function rebuildDashboardNow() {
  rebuildDashboard_();
  Logger.log('Dashboard rebuilt.');
}

/*******************************************************
 * Some Helpers.
 *******************************************************/
 function splitTripleKeyRows_(obj) {
  return Object.keys(obj)
    .sort()
    .map(function(key) {
      const parts = key.split('|');

      return [
        parts[0],
        parts[1],
        parts[2],
        roundMoney_(obj[key])
      ];
    });
}

function buildPersonChartData_(dashboard, totalsByPersonCurrency) {
  const personRows = splitKeyRows_(totalsByPersonCurrency);

  let startRow = 4;
  const startCol = 12; // L

  dashboard.getRange(startRow, startCol).setValue('Chart Data: Person');
  dashboard.getRange(startRow, startCol, 1, 3)
    .merge()
    .setFontWeight('bold')
    .setBackground('#fef3c7');

  dashboard.getRange(startRow + 1, startCol, 1, 3)
    .setValues([['Person', 'Currency', 'Total']])
    .setFontWeight('bold');

  if (personRows.length > 0) {
    dashboard.getRange(startRow + 2, startCol, personRows.length, 3).setValues(personRows);
    dashboard.getRange(startRow + 2, startCol + 2, personRows.length, 1).setNumberFormat('#,##0.00');
  }
}
