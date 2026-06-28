/*******************************************************
 * 01_Config.gs
 * Global configuration.
 *******************************************************/

// Telegram bot token.
// Keep your real token here. Do not paste it publicly.
const BOT_TOKEN = 'don't-commit-this';

// Google Sheets spreadsheet ID.
const SPREADSHEET_ID = 'don't-commit-this';

// Sheet names.
const EXPENSES_SHEET_NAME = 'Expenses';
const LOG_SHEET_NAME = 'BotLogs';
const DASHBOARD_SHEET_NAME = 'Dashboard';

// Defaults.
const DEFAULT_CURRENCY = 'CHF';

// Telegram polling settings.
const POLL_LIMIT = 20;
const POLL_FUNCTION_NAME = 'pollTelegram';

// Dashboard settings.
const DASHBOARD_MAX_LAST_EXPENSES = 10;

// Logging settings.
// Set to false later if BotLogs becomes too big.
const ENABLE_LOGGING = true;

/*******************************************************
 * Multi-user / family trip settings.
 *******************************************************/

// Safer default: only listed Telegram users can use the bot.
// To add family members, they send /start, the bot gives their Telegram ID,
// then you add them below.
const ALLOW_UNKNOWN_USERS = false;

//  Telegram ID from the logs.
const BOT_USERS = {
  'don't-commit-this': {
    name: 'don't-commit-this',
    role: 'admin'
  }

  // Example:
  // '123456789': {
  //   name: 'Mom',
  //   role: 'user'
  // },
  // '987654321': {
  //   name: 'Dad',
  //   role: 'user'
  // }
};
