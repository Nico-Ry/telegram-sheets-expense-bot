# Security Policy

This project is designed to be published as a public GitHub template without exposing private data.

## Secrets must not be committed

Never commit:

- Telegram bot tokens.
- Real Google Spreadsheet IDs if the sheet should stay private.
- Real Telegram user IDs if you do not want them public.
- `.clasp.json`.
- `.clasprc.json`.
- OAuth credentials.
- Personal expense data.
- Screenshots showing private expenses or user IDs.

## Where secrets are stored

Private runtime configuration is stored in Apps Script Script Properties:

| Property | Purpose |
| --- | --- |
| `BOT_TOKEN` | Telegram bot token from BotFather. |
| `SPREADSHEET_ID` | Google Sheet used by the bot. |
| `BOT_USERS_JSON` | Allowed Telegram users and roles. |
| `ALLOW_UNKNOWN_USERS` | Whether unknown Telegram users can use the bot. |
| `ENABLE_LOGGING` | Whether logs are written to `BotLogs`. |

## What data the bot stores

The bot may store:

- Expense description.
- Amount.
- Currency.
- Detected category.
- Date and month.
- Telegram user display name configured in `BOT_USERS_JSON`.
- Telegram user ID.
- Telegram message ID and update ID.
- Runtime logs.

## Who can see the spreadsheet?

Only people with Google Sheet access can see the spreadsheet.

Adding someone to `BOT_USERS_JSON` lets them use the Telegram bot. It does not share the Google Sheet with them.

To give someone sheet access, use Google Sheets sharing settings.

## Telegram access vs Google Sheet access

These are separate:

- Telegram access: controlled by `BOT_USERS_JSON` and `ALLOW_UNKNOWN_USERS`.
- Google Sheet access: controlled by Google Drive sharing.

A family member can send expenses to the bot without having access to the spreadsheet.

## How to revoke a Telegram bot token

1. Open Telegram.
2. Message `@BotFather`.
3. Use `/revoke` or regenerate the token from the bot settings.
4. Update the `BOT_TOKEN` Script Property.
5. Run `testTelegramConnection`.

If a token was committed to GitHub, revoke it immediately. Deleting it from Git history is not enough.

## How to remove a user

Run this in Apps Script:

```javascript
removeBotUser('TELEGRAM_USER_ID_HERE');
```

Or edit `BOT_USERS_JSON` manually in Script Properties and remove that user.

## How to stop the bot

Run:

```text
stopBot
```

This deletes polling triggers. The bot will stop checking Telegram updates.

## How to delete triggers manually

1. Open Apps Script.
2. Go to **Triggers**.
3. Delete the time-driven trigger for `pollTelegram`.

You can also run:

```text
deleteAllProjectTriggers
```

## How to reset Script Properties

Run:

```text
clearBotConfigProperties
```

This removes bot configuration from Script Properties. You will need to configure the bot again.

## Safe screenshots

Before adding screenshots to GitHub:

- Use fake demo expenses.
- Hide Telegram usernames and IDs.
- Hide spreadsheet IDs from browser URLs.
- Hide bot tokens.
- Hide personal or family data.

## Reporting security issues

Do not open a public GitHub issue containing secrets. Revoke exposed tokens first, then open an issue with sanitized details.
