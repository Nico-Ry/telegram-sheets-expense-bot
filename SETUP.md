# Setup Guide

This guide explains how to install your own copy of Telegram Sheets Expense Bot using GitHub, Google Apps Script, Google Sheets, Telegram, and clasp.

The public repository does not contain private values. Your Telegram bot token, Google Spreadsheet ID, and Telegram user IDs must be stored in Apps Script Script Properties.

## 1. Prerequisites

You need:

- A Google account.
- A Telegram account.
- Node.js and npm.
- Git.
- A terminal.
- Basic access to Google Apps Script.

Install dependencies:

```bash
npm install
```

This project uses `@google/clasp` for local Apps Script development.

## 2. Create a Telegram bot

1. Open Telegram.
2. Search for `@BotFather`.
3. Send `/newbot`.
4. Choose a bot name.
5. Choose a bot username ending in `bot`.
6. Copy the token shown by BotFather.

Do not paste the token into GitHub. You will store it later in Script Properties as `BOT_TOKEN`.

## 3. Create a Google Sheet

1. Go to Google Sheets.
2. Create a blank spreadsheet.
3. Rename it, for example: `Telegram Expense Bot`.
4. Copy the spreadsheet ID from the URL.

Example URL:

```text
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit
```

Do not commit the real spreadsheet ID if you want the sheet to stay private.

## 4. Clone the repository

```bash
git clone https://github.com/Nico-Ry/telegram-sheets-expense-bot.git
cd telegram-sheets-expense-bot
npm install
```

## 5. Enable the Apps Script API

Before using clasp, enable the Google Apps Script API for your Google account:

1. Open the Apps Script settings page: `https://script.google.com/home/usersettings`.
2. Enable the Google Apps Script API toggle.

## 6. Login with clasp

```bash
npm run clasp:login
```

A browser window opens. Login with the Google account that will own the Apps Script project.

## 7. Create or connect an Apps Script project

### Option A: create a new Apps Script project

```bash
npm run clasp:create
```

This creates a `.clasp.json` file locally. This file contains your real Apps Script project ID and must not be committed.

### Option B: connect to an existing Apps Script project

Create a local `.clasp.json` file:

```json
{
  "scriptId": "PASTE_YOUR_APPS_SCRIPT_ID_HERE",
  "rootDir": "src"
}
```

You can find the Script ID in Apps Script under **Project Settings**.

## 8. Push the code

```bash
npm run clasp:push
npm run clasp:open
```

You should now see the `.gs` files in the Apps Script editor.

## 9. Configure private Script Properties

In Apps Script, open **Project Settings** and add these Script Properties:

| Key | Value |
| --- | --- |
| `BOT_TOKEN` | Your BotFather token. |
| `SPREADSHEET_ID` | Your Google Sheet ID. |
| `BOT_USERS_JSON` | Your allowed Telegram users. |
| `ALLOW_UNKNOWN_USERS` | `false` recommended. |
| `ENABLE_LOGGING` | `true` recommended. |

Example `BOT_USERS_JSON`:

```json
{
  "123456789": {
    "name": "Nico",
    "role": "admin"
  },
  "987654321": {
    "name": "Family Member",
    "role": "user"
  }
}
```

Telegram IDs are numbers, but JSON keys must be strings.

## 10. Alternative: configure with helper function

You can also run this once in Apps Script, replacing placeholders locally:

```javascript
function configureMyBotOnce() {
  setRequiredConfig(
    'PASTE_TELEGRAM_BOT_TOKEN_HERE',
    'PASTE_SPREADSHEET_ID_HERE',
    'PASTE_ADMIN_TELEGRAM_ID_HERE',
    'Admin',
    false
  );
}
```

Do not commit this helper with real values. Delete it after running, or keep it only inside the Apps Script editor if it is not pushed to GitHub.

## 11. Authorize and validate

In Apps Script, run:

```text
validateConfig
```

The first run asks for Google authorization. Accept the permissions for your own script.

Then run:

```text
testTelegramConnection
```

Expected result: Telegram `getMe` returns `ok: true` in the logs.

## 12. Initial setup

Run:

```text
setupOnce
```

This will:

- Create required sheets.
- Delete any webhook from the Telegram bot.
- Drop old pending Telegram updates.
- Create a 1-minute polling trigger.
- Rebuild the dashboard.

## 13. Test the bot

Open Telegram and send your bot:

```text
coffee 4
```

Wait up to 1 minute, or run this manually in Apps Script:

```text
runOnceNow
```

Expected result:

- The bot replies in Telegram.
- The row appears in the `Expenses` sheet.
- Logs appear in `BotLogs`.

## 14. Useful development commands

```bash
npm run clasp:status
npm run clasp:push
npm run clasp:pull
npm run clasp:open
```

## 15. What not to commit

Never commit:

- `.clasp.json`
- `.clasprc.json`
- Telegram bot tokens
- Spreadsheet IDs if private
- OAuth credentials
- Real personal expense data
- Screenshots with private data

## 16. Google Sheet sharing

Other Telegram users do not automatically get access to the spreadsheet. Telegram access only controls who can send messages to the bot.

If you want someone to see or edit the Google Sheet, you must share the sheet using Google Drive/Sheets sharing settings.
