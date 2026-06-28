/*******************************************************
 * 02_Telegram.gs
 * Telegram API helpers.
 *
 * This project uses polling, not webhooks.
 * So we use:
 * - getUpdates
 * - sendMessage
 * - deleteWebhook
 * - getWebhookInfo
 *******************************************************/


/**
 * Generic Telegram API caller.
 *
 * Example:
 * telegramApi_('sendMessage', {
 *   chat_id: 123,
 *   text: 'Hello'
 * });
 */
function telegramApi_(method, payload) {
  const url = `https://api.telegram.org/bot${getBotToken_()}/${method}`;

  let response;
  let httpCode;
  let rawBody;
  let data;

  try {
    response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload || {}),
      muteHttpExceptions: true
    });

    httpCode = response.getResponseCode();
    rawBody = response.getContentText();

    try {
      data = JSON.parse(rawBody);
    } catch (parseErr) {
      data = {
        ok: false,
        description: 'Could not parse Telegram response JSON',
        rawBody: rawBody
      };
    }

    return {
      httpCode: httpCode,
      rawBody: rawBody,
      ok: data && data.ok === true,
      result: data ? data.result : null,
      description: data ? data.description : null,
      data: data
    };

  } catch (err) {
    return {
      httpCode: null,
      rawBody: '',
      ok: false,
      result: null,
      description: stack_(err),
      data: null
    };
  }
}


/**
 * Sends a message to Telegram.
 */
function sendTelegramMessage_(chatId, text) {
  const response = telegramApi_('sendMessage', {
    chat_id: chatId,
    text: text
  });

  log_('TELEGRAM_SEND_MESSAGE', 'sendMessage result.', {
    chatId: chatId,
    text: text,
    httpCode: response.httpCode,
    ok: response.ok,
    description: response.description,
    rawBodyPreview: truncate_(response.rawBody, 1000)
  });

  return response;
}


/**
 * Deletes webhook.
 * Important because this bot uses polling.
 */
function deleteTelegramWebhook(dropPendingUpdates) {
  const response = telegramApi_('deleteWebhook', {
    drop_pending_updates: dropPendingUpdates === true
  });

  log_('DELETE_WEBHOOK', 'deleteWebhook result.', {
    httpCode: response.httpCode,
    ok: response.ok,
    description: response.description,
    rawBodyPreview: truncate_(response.rawBody, 1000)
  });

  Logger.log(response.rawBody);

  return response;
}


/**
 * Shows webhook info.
 * For polling, the webhook URL should normally be empty.
 */
function getTelegramWebhookInfo() {
  const response = telegramApi_('getWebhookInfo', {});

  log_('WEBHOOK_INFO', 'getWebhookInfo result.', {
    httpCode: response.httpCode,
    ok: response.ok,
    rawBodyPreview: truncate_(response.rawBody, 2000)
  });

  Logger.log(response.rawBody);

  return response;
}


/**
 * Optional manual test.
 * Run this if you want to verify the bot token works.
 */
function testTelegramConnection() {
  const response = telegramApi_('getMe', {});

  Logger.log(response.rawBody);

  log_('TEST_TELEGRAM_CONNECTION', 'getMe result.', {
    httpCode: response.httpCode,
    ok: response.ok,
    rawBodyPreview: truncate_(response.rawBody, 1000)
  });
}
