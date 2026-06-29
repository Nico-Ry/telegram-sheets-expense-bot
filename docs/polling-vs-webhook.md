# Polling vs Webhook

Telegram bots can receive messages in two main ways:

- Polling with `getUpdates`.
- Webhook callbacks to a public URL.

This project uses polling.

## Polling

With polling, Apps Script periodically asks Telegram for new updates.

```text
Apps Script trigger → Telegram getUpdates → process messages → save offset
```

Advantages:

- Easier to install.
- No public web app deployment required.
- No webhook URL to maintain.
- Easier to reset if something goes wrong.
- Good enough for expense tracking.

Disadvantages:

- Not instant; this project usually checks every minute.

## Webhook

With webhooks, Telegram sends updates to a public URL.

Advantages:

- Faster response time.
- Better for high-volume bots.

Disadvantages:

- Requires deploying Apps Script as a web app.
- Requires setting the webhook URL in Telegram.
- Apps Script retries can be confusing.
- Incorrect setup can cause duplicate rows or loops.

## Why this template uses polling

The goal is a beginner-friendly public template that people can install safely. For an expense bot, a 1-minute delay is acceptable.

`setupOnce()` deletes any existing webhook before enabling polling. This avoids Telegram sending updates through two different mechanisms.

## Useful functions

```text
getTelegramWebhookInfo
deleteTelegramWebhook
setupOnce
resetOffsetToLatestUpdate
restartPollingTrigger
```
