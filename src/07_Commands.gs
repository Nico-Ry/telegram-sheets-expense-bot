/*******************************************************
 * 07_Commands.gs
 * Telegram command responses and user permissions.
 *******************************************************/


function getBotUserProfile_(msg) {
  const from = msg.from || {};
  const telegramUserId = String(from.id || msg.chat.id || '');
  const username = from.username ? '@' + from.username : '';
  const configured = getBotUsers_()[telegramUserId];

  const fallbackName = [
    from.first_name || '',
    from.last_name || ''
  ].join(' ').trim() || username || telegramUserId;

  if (configured) {
    return {
      telegramUserId: telegramUserId,
      name: configured.name || fallbackName,
      role: configured.role || 'user',
      isAdmin: configured.role === 'admin',
      authorized: true,
      username: username,
      firstName: from.first_name || '',
      lastName: from.last_name || ''
    };
  }

  if (isUnknownUsersAllowed_() === true) {
    return {
      telegramUserId: telegramUserId,
      name: fallbackName,
      role: 'user',
      isAdmin: false,
      authorized: true,
      username: username,
      firstName: from.first_name || '',
      lastName: from.last_name || ''
    };
  }

  return {
    telegramUserId: telegramUserId,
    name: fallbackName,
    role: 'blocked',
    isAdmin: false,
    authorized: false,
    username: username,
    firstName: from.first_name || '',
    lastName: from.last_name || ''
  };
}


function sendUnauthorizedMessage_(chatId, userProfile) {
  sendTelegramMessage_(
    chatId,
    [
      'This bot is private.',
      '',
      'Ask the bot admin to add you.',
      '',
      `Your Telegram ID is: ${userProfile.telegramUserId}`,
      `Your name appears as: ${userProfile.name}`,
      userProfile.username ? `Username: ${userProfile.username}` : ''
    ].filter(Boolean).join('\n')
  );
}


function sendHelpMessage_(chatId, userProfile) {
  const adminLines = userProfile && userProfile.isAdmin
    ? [
        '',
        'Admin commands:',
        '/dashboard - rebuild dashboard',
        '/adminlast - show last expenses from everyone'
      ]
    : [];

  sendTelegramMessage_(
    chatId,
    [
      'Expense bot ready.',
      '',
      `User: ${userProfile ? userProfile.name : 'unknown'}`,
      '',
      'Examples:',
      'food 30 pesos',
      '82 euros flixbus',
      'migros 12.50 chf',
      'coffee 4',
      '4chf cafe',
      'lunch €12',
      '',
      'Personal commands:',
      '/help - show this help',
      '/status - bot status',
      '/last - your last expenses',
      '/total - your totals by currency',
      '/month - your current month summary',
      '/category - your totals by category',
      '',
      'Trip commands:',
      '/triptotal - trip totals by person',
      '/tripcategory - trip totals by category'
    ].concat(adminLines).join('\n')
  );
}


function sendStatusMessage_(chatId, userProfile) {
  const props = PropertiesService.getScriptProperties();

  const lastUpdateId = props.getProperty('LAST_UPDATE_ID') || 'none';

  const triggers = ScriptApp.getProjectTriggers()
    .filter(function(trigger) {
      return trigger.getHandlerFunction() === POLL_FUNCTION_NAME;
    });

  sendTelegramMessage_(
    chatId,
    [
      'Bot status:',
      '',
      `User: ${userProfile.name}`,
      `Role: ${userProfile.role}`,
      `Telegram ID: ${userProfile.telegramUserId}`,
      `Running: ${triggers.length > 0 ? 'yes' : 'no'}`,
      `Polling triggers: ${triggers.length}`,
      `Last processed update: ${lastUpdateId}`,
      `Default currency: ${DEFAULT_CURRENCY}`
    ].join('\n')
  );
}


function sendLastExpenses_(chatId, userProfile) {
  const data = getExpenseRows_()
    .filter(function(row) {
      return row.telegramUserId === userProfile.telegramUserId;
    });

  if (data.length === 0) {
    sendTelegramMessage_(chatId, 'You have no expenses saved yet.');
    return;
  }

  const lastExpenses = data
    .slice(-DASHBOARD_MAX_LAST_EXPENSES)
    .reverse();

  const lines = lastExpenses.map(function(row) {
    return `${formatExpenseDateForTelegram_(row.date)} — ${row.description} (${row.category}): ${row.amount} ${row.currency}`;
  });

  sendTelegramMessage_(
    chatId,
    'Your last expenses:\n\n' + lines.join('\n')
  );
}


function sendAdminLastExpenses_(chatId) {
  const data = getExpenseRows_();

  if (data.length === 0) {
    sendTelegramMessage_(chatId, 'No expenses saved yet.');
    return;
  }

  const lastExpenses = data
    .slice(-DASHBOARD_MAX_LAST_EXPENSES)
    .reverse();

  const lines = lastExpenses.map(function(row) {
    return `${formatExpenseDateForTelegram_(row.date)} — ${row.person}: ${row.description} (${row.category}) ${row.amount} ${row.currency}`;
  });

  sendTelegramMessage_(
    chatId,
    'Last expenses from everyone:\n\n' + lines.join('\n')
  );
}


function sendTotalSummary_(chatId, userProfile) {
  const data = getExpenseRows_()
    .filter(function(row) {
      return row.telegramUserId === userProfile.telegramUserId;
    });

  if (data.length === 0) {
    sendTelegramMessage_(chatId, 'You have no expenses saved yet.');
    return;
  }

  const totals = {};

  data.forEach(function(row) {
    const amount = Number(row.amount);
    const currency = row.currency;

    if (!amount || !currency) return;

    totals[currency] = (totals[currency] || 0) + amount;
  });

  const lines = Object.keys(totals)
    .sort()
    .map(function(currency) {
      return `${currency}: ${roundMoney_(totals[currency])}`;
    });

  sendTelegramMessage_(
    chatId,
    'Your total expenses:\n\n' + lines.join('\n')
  );
}


function sendCurrentMonthSummary_(chatId, userProfile) {
  const data = getExpenseRows_()
    .filter(function(row) {
      return row.telegramUserId === userProfile.telegramUserId;
    });

  const currentMonth = formatMonth_(new Date());

  const totals = {};

  data.forEach(function(row) {
    if (row.month !== currentMonth) return;

    const amount = Number(row.amount);
    const currency = row.currency;

    if (!amount || !currency) return;

    totals[currency] = (totals[currency] || 0) + amount;
  });

  const currencies = Object.keys(totals).sort();

  if (currencies.length === 0) {
    sendTelegramMessage_(chatId, `You have no expenses for ${currentMonth}.`);
    return;
  }

  const lines = currencies.map(function(currency) {
    return `${currency}: ${roundMoney_(totals[currency])}`;
  });

  sendTelegramMessage_(
    chatId,
    `Your expenses for ${currentMonth}:\n\n` + lines.join('\n')
  );
}


function sendCategorySummary_(chatId, userProfile) {
  const data = getExpenseRows_()
    .filter(function(row) {
      return row.telegramUserId === userProfile.telegramUserId;
    });

  if (data.length === 0) {
    sendTelegramMessage_(chatId, 'You have no expenses saved yet.');
    return;
  }

  const totals = {};

  data.forEach(function(row) {
    const amount = Number(row.amount);
    const currency = row.currency;
    const category = row.category || 'Other';

    if (!amount || !currency) return;

    const key = `${category}|${currency}`;
    totals[key] = (totals[key] || 0) + amount;
  });

  const lines = Object.keys(totals)
    .sort()
    .map(function(key) {
      const parts = key.split('|');
      return `${parts[0]} (${parts[1]}): ${roundMoney_(totals[key])}`;
    });

  sendTelegramMessage_(
    chatId,
    'Your expenses by category:\n\n' + lines.join('\n')
  );
}


function sendTripTotalSummary_(chatId) {
  const data = getExpenseRows_();

  if (data.length === 0) {
    sendTelegramMessage_(chatId, 'No trip expenses saved yet.');
    return;
  }

  const totals = {};

  data.forEach(function(row) {
    const amount = Number(row.amount);
    const currency = row.currency;
    const person = row.person || 'Unknown';

    if (!amount || !currency) return;

    const key = `${person}|${currency}`;
    totals[key] = (totals[key] || 0) + amount;
  });

  const lines = Object.keys(totals)
    .sort()
    .map(function(key) {
      const parts = key.split('|');
      return `${parts[0]} (${parts[1]}): ${roundMoney_(totals[key])}`;
    });

  sendTelegramMessage_(
    chatId,
    'Trip totals by person:\n\n' + lines.join('\n')
  );
}


function sendTripCategorySummary_(chatId) {
  const data = getExpenseRows_();

  if (data.length === 0) {
    sendTelegramMessage_(chatId, 'No trip expenses saved yet.');
    return;
  }

  const totals = {};

  data.forEach(function(row) {
    const amount = Number(row.amount);
    const currency = row.currency;
    const category = row.category || 'Other';

    if (!amount || !currency) return;

    const key = `${category}|${currency}`;
    totals[key] = (totals[key] || 0) + amount;
  });

  const lines = Object.keys(totals)
    .sort()
    .map(function(key) {
      const parts = key.split('|');
      return `${parts[0]} (${parts[1]}): ${roundMoney_(totals[key])}`;
    });

  sendTelegramMessage_(
    chatId,
    'Trip totals by category:\n\n' + lines.join('\n')
  );
}


function formatExpenseDateForTelegram_(value) {
  if (value instanceof Date) {
    return formatDateOnly_(value);
  }

  return String(value || '');
}
