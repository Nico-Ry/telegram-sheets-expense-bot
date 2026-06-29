# Telegram Sheets Expense Bot

![Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-V8-blue)
![Google Sheets](https://img.shields.io/badge/Google%20Sheets-dashboard-green)
![Telegram Bot](https://img.shields.io/badge/Telegram-Bot%20API-blue)
![clasp](https://img.shields.io/badge/clasp-local%20development-orange)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

A Telegram expense tracker bot built with Google Apps Script and Google Sheets. Send messages like `coffee 4` or `flixbus 82 euro` to automatically track expenses, categories, currencies, users, dashboards, and trip totals.

This repository is a reusable public template. Each user installs their own copy with their own Telegram bot, their own Google Sheet, and private Script Properties.

## Features

- Track expenses directly from Telegram.
- Parse natural messages such as `coffee 4`, `migros 12.50 chf`, `lunch €12`, and `82 euros FlixBus`.
- Save data to Google Sheets.
- Create and maintain `Expenses`, `BotLogs`, and `Dashboard` sheets.
- Support multiple currencies.
- Auto-detect categories using configurable rules.
- Support personal mode and multi-user trip/family mode.
- Separate normal users from admins.
- Use Telegram polling with `getUpdates` instead of webhooks.
- Develop locally with `clasp` and push to Google Apps Script.
- Keep secrets out of GitHub with Apps Script `PropertiesService`.

## Demo messages

```text
coffee 4
82 euros FlixBus
migros 12.50 chf
cafe 4chf
lunch €12
```

The bot stores the amount, currency, description, detected category, Telegram user, date, month, update ID, and message ID.

## Screenshots

Screenshots are intentionally not included yet to avoid leaking private data.

Recommended screenshots to add later:

- Telegram conversation with fake demo messages.
- `Expenses` sheet with sample data.
- `Dashboard` sheet with charts.
- Apps Script trigger configuration.

See [docs/screenshots.md](docs/screenshots.md).

## Tech stack

- Google Apps Script, JavaScript V8 runtime.
- Google Sheets as database and dashboard.
- Telegram Bot API.
- `clasp` for local development.
- Apps Script time-driven triggers for polling.

## Why polling instead of webhook?

This project uses Telegram polling with `getUpdates` because it is simpler and more reliable for beginner-friendly Apps Script deployments.

Webhook deployments can work, but they require extra deployment steps and can cause confusion with retries, duplicate rows, or old pending updates. For expense tracking, a 1-minute polling trigger is usually enough.

Read more in [docs/polling-vs-webhook.md](docs/polling-vs-webhook.md).

## Quick start

```bash
git clone https://github.com/Nico-Ry/telegram-sheets-expense-bot.git
cd telegram-sheets-expense-bot
npm install
npm run clasp:login
```

Then create or connect an Apps Script project, push the source, configure private Script Properties, and run `setupOnce()`.

Full guide: [SETUP.md](SETUP.md).

## Required private configuration

The public repository does not contain secrets. Configure these values in Apps Script Script Properties:

| Key | Example | Required |
| --- | --- | --- |
| `BOT_TOKEN` | `123456:ABC...` | Yes |
| `SPREADSHEET_ID` | `1abcDEF...` | Yes |
| `BOT_USERS_JSON` | `{"123456789":{"name":"Nico","role":"admin"}}` | Yes |
| `ALLOW_UNKNOWN_USERS` | `false` | No |
| `ENABLE_LOGGING` | `true` | No |

Never commit real tokens, spreadsheet IDs, or Telegram user IDs.

## Commands

| Command | Access | Description |
| --- | --- | --- |
| `/help` | User | Show available commands. |
| `/status` | User | Show bot status and current user info. |
| `/last` | User | Show recent personal expenses. |
| `/total` | User | Show personal totals. |
| `/month` | User | Show personal current month totals. |
| `/category` | User | Show personal totals by category. |
| `/triptotal` | User | Show shared trip/family totals. |
| `/tripcategory` | User | Show shared totals by category. |
| `/dashboard` | Admin | Rebuild the Google Sheets dashboard. |
| `/adminlast` | Admin | Show latest expenses across all users. |

See [docs/command-reference.md](docs/command-reference.md).

## Sheet structure

The bot creates these sheets:

| Sheet | Purpose |
| --- | --- |
| `Expenses` | Main expense table. |
| `BotLogs` | Runtime logs, parser errors, permission errors, API issues. |
| `Dashboard` | Totals, summaries, charts, and trip overview. |

## Multi-user and trip mode

Each Telegram user is configured in `BOT_USERS_JSON` with a display name and role. Normal users can track their own expenses and view their own totals. Admins can rebuild dashboards and see shared/global summaries.

See [docs/multi-user-trip-mode.md](docs/multi-user-trip-mode.md).

## Security

- Secrets are read from Apps Script Script Properties.
- `.clasp.json` and `.clasprc.json` must not be committed.
- Google Sheet data remains private unless the owner shares the sheet.
- Telegram access and Google Sheet access are separate.

Read [SECURITY.md](SECURITY.md) before publishing screenshots or demo data.

## Troubleshooting

Common issues are documented in [TROUBLESHOOTING.md](TROUBLESHOOTING.md), including:

- Bot does not answer.
- Wrong token or spreadsheet ID.
- Duplicate messages.
- Webhook vs polling confusion.
- Dashboard not updating.
- `clearCharts is not a function`.

## Roadmap

- `/adduser`, `/removeuser`, and `/users` admin commands.
- Optional category customization from a Google Sheet tab.
- Optional monthly budget alerts.
- Optional CSV export command.
- Optional web app setup screen.
- More tests for parser edge cases.

## License

MIT. See [LICENSE](LICENSE).
