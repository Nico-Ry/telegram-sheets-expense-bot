/*******************************************************
 * 01_Config.gs
 * Public-safe configuration.
 *
 * IMPORTANT:
 * Do not store private values in this file.
 * Telegram tokens, Spreadsheet IDs, and Telegram user IDs
 * are loaded from Apps Script Script Properties.
 *******************************************************/

/*******************************************************
 * Script Property keys
 *******************************************************/
const CONFIG_KEYS_ = {
  BOT_TOKEN: 'BOT_TOKEN',
  SPREADSHEET_ID: 'SPREADSHEET_ID',
  BOT_USERS_JSON: 'BOT_USERS_JSON',
  ALLOW_UNKNOWN_USERS: 'ALLOW_UNKNOWN_USERS',
  ENABLE_LOGGING: 'ENABLE_LOGGING',
  LAST_UPDATE_ID: 'LAST_UPDATE_ID'
};

/*******************************************************
 * Public, non-secret app settings
 *******************************************************/
const EXPENSES_SHEET_NAME = 'Expenses';
const LOG_SHEET_NAME = 'BotLogs';
const DASHBOARD_SHEET_NAME = 'Dashboard';

const DEFAULT_CURRENCY = 'CHF';

// Telegram polling settings.
const POLL_LIMIT = 20;
const POLL_FUNCTION_NAME = 'pollTelegram';

// Dashboard settings.
const DASHBOARD_MAX_LAST_EXPENSES = 10;

// Safe defaults used when optional Script Properties are missing.
const DEFAULT_ALLOW_UNKNOWN_USERS = false;
const DEFAULT_ENABLE_LOGGING = true;


/*******************************************************
 * Script Properties helpers
 *******************************************************/
function getScriptProperties_() {
  return PropertiesService.getScriptProperties();
}


function getRequiredScriptProperty_(key) {
  const value = getScriptProperties_().getProperty(key);

  if (!value || String(value).trim() === '') {
    throw new Error(
      'Missing required script property: ' + key +
      '. Add it in Apps Script > Project Settings > Script Properties.'
    );
  }

  return String(value).trim();
}


function getOptionalScriptProperty_(key, fallbackValue) {
  const value = getScriptProperties_().getProperty(key);

  if (value === null || typeof value === 'undefined' || String(value).trim() === '') {
    return fallbackValue;
  }

  return String(value).trim();
}


function getBotToken_() {
  return getRequiredScriptProperty_(CONFIG_KEYS_.BOT_TOKEN);
}


function getSpreadsheetId_() {
  return getRequiredScriptProperty_(CONFIG_KEYS_.SPREADSHEET_ID);
}


function getBotUsers_() {
  const raw = getOptionalScriptProperty_(CONFIG_KEYS_.BOT_USERS_JSON, '{}');

  try {
    const users = JSON.parse(raw);

    if (!users || typeof users !== 'object' || Array.isArray(users)) {
      throw new Error('BOT_USERS_JSON must be a JSON object.');
    }

    return users;
  } catch (err) {
    throw new Error(
      'Invalid BOT_USERS_JSON script property. Expected JSON like: ' +
      '{"123456789":{"name":"Admin","role":"admin"}}. ' +
      stack_(err)
    );
  }
}


function isUnknownUsersAllowed_() {
  return parseBooleanScriptProperty_(
    CONFIG_KEYS_.ALLOW_UNKNOWN_USERS,
    DEFAULT_ALLOW_UNKNOWN_USERS
  );
}


function isLoggingEnabled_() {
  return parseBooleanScriptProperty_(
    CONFIG_KEYS_.ENABLE_LOGGING,
    DEFAULT_ENABLE_LOGGING
  );
}


function parseBooleanScriptProperty_(key, fallbackValue) {
  const value = getScriptProperties_().getProperty(key);

  if (value === null || typeof value === 'undefined' || String(value).trim() === '') {
    return fallbackValue;
  }

  const normalized = String(value).trim().toLowerCase();

  return ['true', '1', 'yes', 'y'].indexOf(normalized) !== -1;
}


/*******************************************************
 * Setup helpers
 *
 * These functions are safe for a public repository because
 * they contain no real private values.
 *******************************************************/
function setRequiredConfig(botToken, spreadsheetId, adminTelegramId, adminName, allowUnknownUsers) {
  if (!botToken || !spreadsheetId || !adminTelegramId) {
    throw new Error(
      'Usage: setRequiredConfig(botToken, spreadsheetId, adminTelegramId, adminName, allowUnknownUsers)'
    );
  }

  const users = {};
  users[String(adminTelegramId).trim()] = {
    name: String(adminName || 'Admin').trim(),
    role: 'admin'
  };

  getScriptProperties_().setProperties({
    BOT_TOKEN: String(botToken).trim(),
    SPREADSHEET_ID: String(spreadsheetId).trim(),
    BOT_USERS_JSON: JSON.stringify(users),
    ALLOW_UNKNOWN_USERS: String(allowUnknownUsers === true),
    ENABLE_LOGGING: 'true'
  });

  Logger.log('Required configuration saved in Script Properties.');
  Logger.log('Run validateConfig() next, then setupOnce().');
}


function setBotUsersFromJson(botUsersJson) {
  if (!botUsersJson) {
    throw new Error('Missing botUsersJson.');
  }

  const users = JSON.parse(botUsersJson);

  if (!users || typeof users !== 'object' || Array.isArray(users)) {
    throw new Error('BOT_USERS_JSON must be a JSON object.');
  }

  getScriptProperties_().setProperty(
    CONFIG_KEYS_.BOT_USERS_JSON,
    JSON.stringify(users)
  );

  Logger.log('BOT_USERS_JSON saved.');
}


function addBotUser(telegramUserId, name, role) {
  if (!telegramUserId) {
    throw new Error('Missing telegramUserId.');
  }

  const users = getBotUsers_();
  const normalizedRole = role === 'admin' ? 'admin' : 'user';

  users[String(telegramUserId).trim()] = {
    name: String(name || telegramUserId).trim(),
    role: normalizedRole
  };

  getScriptProperties_().setProperty(
    CONFIG_KEYS_.BOT_USERS_JSON,
    JSON.stringify(users)
  );

  Logger.log('User added/updated: ' + telegramUserId + ' (' + normalizedRole + ')');
}


function removeBotUser(telegramUserId) {
  if (!telegramUserId) {
    throw new Error('Missing telegramUserId.');
  }

  const users = getBotUsers_();
  delete users[String(telegramUserId).trim()];

  getScriptProperties_().setProperty(
    CONFIG_KEYS_.BOT_USERS_JSON,
    JSON.stringify(users)
  );

  Logger.log('User removed: ' + telegramUserId);
}


function listBotUsersConfig() {
  const users = getBotUsers_();
  Logger.log(JSON.stringify(users, null, 2));
  return users;
}


function validateConfig() {
  const props = getScriptProperties_();
  const botToken = props.getProperty(CONFIG_KEYS_.BOT_TOKEN) || '';
  const spreadsheetId = props.getProperty(CONFIG_KEYS_.SPREADSHEET_ID) || '';
  const users = getBotUsers_();

  const status = {
    hasBotToken: botToken.trim() !== '',
    botTokenPreview: maskSecret_(botToken),
    hasSpreadsheetId: spreadsheetId.trim() !== '',
    spreadsheetIdPreview: maskSecret_(spreadsheetId),
    configuredUsers: Object.keys(users).length,
    allowUnknownUsers: isUnknownUsersAllowed_(),
    loggingEnabled: isLoggingEnabled_(),
    lastUpdateId: props.getProperty(CONFIG_KEYS_.LAST_UPDATE_ID) || 'none'
  };

  Logger.log(JSON.stringify(status, null, 2));

  if (!status.hasBotToken) {
    throw new Error('BOT_TOKEN is missing.');
  }

  if (!status.hasSpreadsheetId) {
    throw new Error('SPREADSHEET_ID is missing.');
  }

  if (status.configuredUsers === 0 && !status.allowUnknownUsers) {
    throw new Error('No users configured. Add an admin user or set ALLOW_UNKNOWN_USERS=true.');
  }

  return status;
}


function clearBotConfigProperties() {
  const props = getScriptProperties_();

  Object.keys(CONFIG_KEYS_).forEach(function(name) {
    props.deleteProperty(CONFIG_KEYS_[name]);
  });

  Logger.log('Bot configuration Script Properties cleared.');
}


function maskSecret_(value) {
  const text = String(value || '');

  if (text.length <= 8) {
    return text ? '***' : '';
  }

  return text.slice(0, 4) + '...' + text.slice(-4);
}
