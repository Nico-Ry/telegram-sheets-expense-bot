# Architecture

## Data flow

```text
Telegram user
  ↓
Telegram Bot API getUpdates
  ↓
Google Apps Script polling trigger
  ↓
Parser
  ↓
User permission check
  ↓
Google Sheets Expenses tab
  ↓
Dashboard + charts
  ↓
Telegram command replies
```

## Main idea

The bot is a small serverless expense tracker. Google Apps Script runs every minute using a time-driven trigger. It asks Telegram for new messages with `getUpdates`, parses expense messages, checks whether the Telegram user is allowed, writes rows to Google Sheets, updates dashboards, and replies through the Telegram Bot API.

## Files

| File | Responsibility |
| --- | --- |
| `01_Config.gs` | Reads private config from Script Properties, manages users, validates setup. |
| `02_Telegram.gs` | Telegram Bot API wrapper, send messages, delete webhook, test token. |
| `03_Polling.gs` | Polling trigger setup, `getUpdates`, offset handling, update processing. |
| `04_Parser.gs` | Parses natural expense messages into amount, currency, and description. |
| `05_ExpensesSheet.gs` | Creates sheets, writes expense rows, reads expense rows, category detection. |
| `06_Dashboard.gs` | Rebuilds dashboard summaries and charts. |
| `07_Commands.gs` | Handles `/help`, `/status`, totals, categories, trip summaries, admin commands. |
| `08_Logging.gs` | Writes runtime logs to `BotLogs`. |
| `09_ManualTools.gs` | Manual maintenance functions for setup, reset, health checks, triggers, cleanup. |
| `appsscript.json` | Apps Script manifest, runtime, timezone, and OAuth scopes. |

## Polling trigger

`setupOnce()` creates a time-driven trigger for `pollTelegram()`.

Every run:

1. Reads the saved Telegram offset from Script Properties.
2. Calls Telegram `getUpdates`.
3. Processes each new update.
4. Saves the next offset.
5. Replies to Telegram if needed.

The offset is important because Telegram keeps messages until the bot confirms they were processed.

## Why polling?

Polling was chosen because it is easier to install and more reliable for a beginner-friendly public template.

Webhook deployment requires publishing a web app URL and managing Telegram webhook state. In Apps Script, webhook retries or old pending updates can create duplicate rows and loops if the setup is not perfect.

For expense tracking, near-real-time is not necessary. A 1-minute trigger is simple and good enough.

## Permissions model

Users are configured with `BOT_USERS_JSON`:

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

Supported roles:

- `user`: can add expenses and view personal/shared summaries.
- `admin`: can also rebuild dashboards and view admin summaries.

If `ALLOW_UNKNOWN_USERS` is `false`, only configured Telegram IDs can use the bot.

## Google Sheets as storage

The spreadsheet is used as a lightweight database and reporting layer:

- `Expenses`: source of truth for expense rows.
- `BotLogs`: debugging and runtime visibility.
- `Dashboard`: summaries and charts for manual review.

## Security design

The repository is public-safe because source code reads secrets from Script Properties instead of hardcoded constants.

Private values include:

- Telegram bot token.
- Google Spreadsheet ID.
- Telegram user IDs.
- User names/roles.
