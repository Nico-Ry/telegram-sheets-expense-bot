# Command Reference

Commands are sent directly to the Telegram bot.

## General commands

| Command | Access | Description |
| --- | --- | --- |
| `/help` | User | Shows the available commands. |
| `/status` | User | Shows bot status and your Telegram user information. |

## Personal expense commands

| Command | Access | Description |
| --- | --- | --- |
| `/last` | User | Shows your latest expenses. |
| `/total` | User | Shows your personal total grouped by currency. |
| `/month` | User | Shows your current month total. |
| `/category` | User | Shows your personal total grouped by category. |

## Trip/shared commands

| Command | Access | Description |
| --- | --- | --- |
| `/triptotal` | User | Shows shared total expenses across configured users. |
| `/tripcategory` | User | Shows shared expenses grouped by category. |

## Admin commands

| Command | Access | Description |
| --- | --- | --- |
| `/dashboard` | Admin | Rebuilds the Google Sheets dashboard. |
| `/adminlast` | Admin | Shows latest expenses across all users. |

## Expense messages

The bot accepts natural messages:

```text
coffee 4
82 euros FlixBus
migros 12.50 chf
cafe 4chf
lunch €12
```

## Access rules

- Users must be configured in `BOT_USERS_JSON`, unless `ALLOW_UNKNOWN_USERS` is set to `true`.
- Admin-only commands require role `admin`.
- Normal users can see personal totals and shared trip totals, but not admin-only views.
