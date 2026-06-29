# Troubleshooting

This file lists common problems and how to fix them.

## Bot does not answer

Check:

1. `BOT_TOKEN` exists in Script Properties.
2. `testTelegramConnection` returns `ok: true`.
3. `setupOnce` has been run.
4. A trigger exists for `pollTelegram`.
5. The Telegram user is allowed in `BOT_USERS_JSON`.
6. The bot received a new message after setup.

Useful functions:

```text
validateConfig
testTelegramConnection
showStatus
listTriggers
runOnceNow
```

## Bot loops messages

This usually means old Telegram updates are being processed repeatedly.

Fix:

```text
resetOffsetToLatestUpdate
restartPollingTrigger
```

Also check that no webhook is active:

```text
getTelegramWebhookInfo
```

## Webhook vs polling confusion

This project uses polling, not webhook deployment.

Run:

```text
deleteTelegramWebhook
```

or run:

```text
setupOnce
```

`setupOnce` deletes the webhook and creates a polling trigger.

## `clearCharts is not a function`

Some Apps Script environments do not support `clearCharts()` on a sheet object.

This project removes charts safely with a helper that loops over existing charts and removes them one by one.

If you still see this error, make sure your `06_Dashboard.gs` contains `removeAllCharts_(sheet)` and that dashboard code calls that helper.

## Spreadsheet is empty

Check:

1. `SPREADSHEET_ID` is correct.
2. Your Google account has access to the sheet.
3. `setupOnce` was run.
4. `testSheetConnection` works.
5. `runOnceNow` processes a new Telegram update.

## Parser works but bot does not save

Run:

```text
testParser
validateConfig
testSheetConnection
runOnceNow
```

If the parser succeeds but no row is added, check `BotLogs` for permission or spreadsheet errors.

## Duplicate messages

Duplicates can happen if Telegram updates are not acknowledged with a correct offset.

Fix:

```text
resetOffsetToLatestUpdate
```

Then send a brand-new Telegram message and test again.

## Wrong Telegram token

Run:

```text
testTelegramConnection
```

If it fails, update `BOT_TOKEN` in Script Properties. Do not edit source code.

## Wrong spreadsheet ID

Run:

```text
testSheetConnection
```

If it fails, copy the ID from the Google Sheet URL and update `SPREADSHEET_ID` in Script Properties.

## Google authorization warning

Apps Script may show a warning because this is your own unpublished script.

For a personal script, continue only if you trust the code you are running. Review the source and permissions before authorizing.

## Triggers not running

Check triggers:

```text
listTriggers
```

Recreate polling trigger:

```text
restartPollingTrigger
```

## `getUpdates` offset problems

Reset to the latest update:

```text
resetOffsetToLatestUpdate
```

Then send a new message to the bot.

## `BotLogs` is getting too big

Run:

```text
clearBotLogs
```

You can also set this Script Property:

```text
ENABLE_LOGGING = false
```

## Family member blocked by private mode

Add them to `BOT_USERS_JSON`:

```javascript
addBotUser('TELEGRAM_USER_ID_HERE', 'Name', 'user');
```

Then ask them to send `/status`.

## Dashboard not updating

Run:

```text
clearAndRebuildDashboard
```

or from Telegram, if you are admin:

```text
/dashboard
```

If charts fail, check `BotLogs` and the Apps Script execution logs.
