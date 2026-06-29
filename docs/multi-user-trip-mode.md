# Multi-user and Trip Mode

The bot can be used by one person or by a family/group during a trip.

## User configuration

Users are stored in the `BOT_USERS_JSON` Script Property.

Example:

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

The object key is the Telegram user ID. The value contains the display name and role.

## Roles

| Role | Meaning |
| --- | --- |
| `user` | Can add expenses and view normal summaries. |
| `admin` | Can use all commands, including dashboard rebuild and admin latest expenses. |

## Private mode

Recommended setting:

```text
ALLOW_UNKNOWN_USERS = false
```

This means only users in `BOT_USERS_JSON` can use the bot.

## Shared trip totals

Trip commands calculate totals across all expense rows:

```text
/triptotal
/tripcategory
```

This is useful when several people send expenses to the same Telegram bot during a trip.

## Google Sheet access

Adding someone to `BOT_USERS_JSON` lets them use the bot. It does not give them access to the Google Sheet.

To share the spreadsheet itself, use Google Sheets sharing settings.

## Adding a user

Run in Apps Script:

```javascript
addBotUser('987654321', 'Family Member', 'user');
```

## Removing a user

Run in Apps Script:

```javascript
removeBotUser('987654321');
```

## Listing configured users

Run in Apps Script:

```text
listBotUsersConfig
```
