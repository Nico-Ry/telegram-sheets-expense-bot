/*******************************************************
 * 03_Polling.gs
 * Main Telegram polling logic.
 *
 * This bot does NOT use webhooks.
 * It checks Telegram with getUpdates every minute.
 *******************************************************/


/*******************************************************
 * RUN THIS ONCE MANUALLY
 *******************************************************/
function setupOnce() {
  initSheets_();

  log_('SETUP_START', 'Starting setupOnce()', {});

  deleteTelegramWebhook(true);
  clearExistingTriggers_();

  // Forget old queued Telegram messages so the bot starts clean.
  forgetPendingTelegramUpdates_();

  ScriptApp.newTrigger(POLL_FUNCTION_NAME)
    .timeBased()
    .everyMinutes(1)
    .create();

  log_('SETUP_DONE', 'Polling trigger created. Bot will check Telegram every minute.', {});

  Logger.log('Setup complete. Send a NEW Telegram message and wait up to 1 minute, or run runOnceNow manually.');
}


/*******************************************************
 * MAIN POLLING FUNCTION
 * This runs automatically every minute.
 *******************************************************/
function pollTelegram() {
  const startedAt = new Date();
  const props = PropertiesService.getScriptProperties();
  const lock = LockService.getScriptLock();

  let lockAcquired = false;

  try {
    lockAcquired = lock.tryLock(25000);

    if (!lockAcquired) {
      log_('POLL_SKIPPED', 'Another pollTelegram execution is already running.', {});
      return;
    }

    const lastUpdateId = Number(props.getProperty('LAST_UPDATE_ID') || '0');

    const payload = {
      limit: POLL_LIMIT,
      timeout: 0,
      allowed_updates: ['message', 'edited_message']
    };

    if (lastUpdateId > 0) {
      payload.offset = lastUpdateId + 1;
    }

    log_('POLL_START', 'Requesting Telegram updates.', {
      lastUpdateId: lastUpdateId,
      offset: payload.offset || null
    });

    const response = telegramApi_('getUpdates', payload);

    log_('POLL_TELEGRAM_RESPONSE', 'Telegram getUpdates response received.', {
      httpCode: response.httpCode,
      ok: response.ok,
      resultCount: Array.isArray(response.result) ? response.result.length : null,
      rawBodyPreview: truncate_(response.rawBody, 1000)
    });

    if (!response.ok || !Array.isArray(response.result)) {
      log_('POLL_STOPPED', 'Telegram response was not OK.', response);
      return;
    }

    if (response.result.length === 0) {
      log_('POLL_EMPTY', 'No new messages.', {});
      return;
    }

    response.result.forEach(function(update) {
      try {
        processTelegramUpdate_(update);
      } catch (err) {
        log_('UPDATE_ERROR', 'Error while processing update.', {
          updateId: update.update_id,
          error: stack_(err),
          update: safeJson_(update, 2000)
        });

        const msg = update.message || update.edited_message;

        if (msg && msg.chat && msg.chat.id) {
          sendTelegramMessage_(
            msg.chat.id,
            'Error while saving this expense. Check the BotLogs tab in Google Sheets.'
          );
        }
      } finally {
        if (typeof update.update_id !== 'undefined') {
          props.setProperty('LAST_UPDATE_ID', String(update.update_id));

          log_('OFFSET_ADVANCED', 'Saved LAST_UPDATE_ID.', {
            updateId: update.update_id
          });
        }
      }
    });

  } catch (err) {
    log_('POLL_FATAL_ERROR', 'Fatal error in pollTelegram().', {
      error: stack_(err)
    });
  } finally {
    if (lockAcquired) {
      lock.releaseLock();
    }

    log_('POLL_END', 'pollTelegram finished.', {
      durationMs: new Date() - startedAt
    });
  }
}


/*******************************************************
 * PROCESS ONE TELEGRAM UPDATE
 *******************************************************/
function processTelegramUpdate_(update) {
  log_('UPDATE_RECEIVED', 'Processing update.', {
    updateId: update.update_id,
    rawUpdate: safeJson_(update, 1500)
  });

  const msg = update.message || update.edited_message;

  if (!msg) {
    log_('UPDATE_IGNORED', 'No message or edited_message object.', {
      updateId: update.update_id
    });
    return;
  }

  if (msg.from && msg.from.is_bot) {
    log_('UPDATE_IGNORED', 'Message came from a bot.', {
      updateId: update.update_id
    });
    return;
  }

  if (!msg.text) {
    log_('UPDATE_IGNORED', 'Message has no text.', {
      updateId: update.update_id,
      messageId: msg.message_id
    });
    return;
  }

  const chatId = msg.chat.id;
  const text = String(msg.text).trim();
  const userProfile = getBotUserProfile_(msg);

  log_('MESSAGE_TEXT', 'Received text message.', {
    updateId: update.update_id,
    messageId: msg.message_id,
    chatId: chatId,
    telegramUserId: userProfile.telegramUserId,
    person: userProfile.name,
    role: userProfile.role,
    authorized: userProfile.authorized,
    text: text
  });

  if (!userProfile.authorized) {
    sendUnauthorizedMessage_(chatId, userProfile);

    log_('UNAUTHORIZED_USER', 'Blocked unauthorized Telegram user.', {
      updateId: update.update_id,
      telegramUserId: userProfile.telegramUserId,
      username: userProfile.username,
      firstName: userProfile.firstName,
      lastName: userProfile.lastName
    });

    return;
  }

  if (text === '/start' || text === '/help') {
    sendHelpMessage_(chatId, userProfile);
    log_('COMMAND_HANDLED', 'Handled /start or /help.', { updateId: update.update_id });
    return;
  }

  if (text === '/status') {
    sendStatusMessage_(chatId, userProfile);
    log_('COMMAND_HANDLED', 'Handled /status.', { updateId: update.update_id });
    return;
  }

  if (text === '/last' || text === '/mylast') {
    sendLastExpenses_(chatId, userProfile);
    log_('COMMAND_HANDLED', 'Handled /last or /mylast.', { updateId: update.update_id });
    return;
  }

  if (text === '/total' || text === '/mytotal') {
    sendTotalSummary_(chatId, userProfile);
    log_('COMMAND_HANDLED', 'Handled /total or /mytotal.', { updateId: update.update_id });
    return;
  }

  if (text === '/month' || text === '/mymonth') {
    sendCurrentMonthSummary_(chatId, userProfile);
    log_('COMMAND_HANDLED', 'Handled /month or /mymonth.', { updateId: update.update_id });
    return;
  }

  if (text === '/category' || text === '/mycategory') {
    sendCategorySummary_(chatId, userProfile);
    log_('COMMAND_HANDLED', 'Handled /category or /mycategory.', { updateId: update.update_id });
    return;
  }

  if (text === '/triptotal') {
    sendTripTotalSummary_(chatId);
    log_('COMMAND_HANDLED', 'Handled /triptotal.', { updateId: update.update_id });
    return;
  }

  if (text === '/tripcategory') {
    sendTripCategorySummary_(chatId);
    log_('COMMAND_HANDLED', 'Handled /tripcategory.', { updateId: update.update_id });
    return;
  }

  if (text === '/adminlast') {
    if (!userProfile.isAdmin) {
      sendTelegramMessage_(chatId, 'Admin command only.');
      return;
    }

    sendAdminLastExpenses_(chatId);
    log_('COMMAND_HANDLED', 'Handled /adminlast.', { updateId: update.update_id });
    return;
  }

  if (text === '/dashboard') {
    if (!userProfile.isAdmin) {
      sendTelegramMessage_(chatId, 'Admin command only.');
      return;
    }

    rebuildDashboard_();
    sendTelegramMessage_(chatId, 'Dashboard updated in Google Sheets.');
    log_('COMMAND_HANDLED', 'Handled /dashboard.', { updateId: update.update_id });
    return;
  }

  if (text.startsWith('/')) {
    sendTelegramMessage_(
      chatId,
      'Unknown command. Send an expense like: cafe 4 or flixbus 82 euro'
    );

    log_('UNKNOWN_COMMAND', 'Unknown command received.', {
      updateId: update.update_id,
      text: text
    });

    return;
  }

  const parsed = parseExpense(text);

  log_('PARSE_RESULT', 'Parsed expense result.', {
    updateId: update.update_id,
    text: text,
    parsed: parsed
  });

  if (!parsed) {
    sendTelegramMessage_(
      chatId,
      [
        'I could not understand that.',
        '',
        'Try:',
        'food 30 euro',
        '82 euros flixbus',
        'migros 12.50 chf',
        'coffee 4',
        '4chf cafe'
      ].join('\n')
    );

    log_('PARSE_FAILED', 'Could not parse expense.', {
      updateId: update.update_id,
      text: text
    });

    return;
  }

  const rowNumber = appendExpense_(msg, update.update_id, parsed, text, userProfile);

  sendTelegramMessage_(
    chatId,
    `Added for ${userProfile.name}: ${parsed.description} — ${parsed.amount} ${parsed.currency}`
  );

  log_('EXPENSE_DONE', 'Expense saved and confirmation sent.', {
    updateId: update.update_id,
    rowNumber: rowNumber,
    person: userProfile.name,
    parsed: parsed
  });
}


/*******************************************************
 * POLLING SETUP HELPERS
 *******************************************************/
function clearExistingTriggers_() {
  const triggers = ScriptApp.getProjectTriggers();
  let deleted = 0;

  triggers.forEach(function(trigger) {
    if (trigger.getHandlerFunction() === POLL_FUNCTION_NAME) {
      ScriptApp.deleteTrigger(trigger);
      deleted++;
    }
  });

  log_('TRIGGERS_CLEARED', 'Old pollTelegram triggers deleted.', {
    deleted: deleted
  });
}


function forgetPendingTelegramUpdates_() {
  const props = PropertiesService.getScriptProperties();

  // Try to fetch only the latest update from the queue and mark it as already seen.
  // This avoids processing old test messages.
  const response = telegramApi_('getUpdates', {
    offset: -1,
    limit: 1,
    timeout: 0,
    allowed_updates: ['message', 'edited_message']
  });

  if (response.ok && Array.isArray(response.result) && response.result.length > 0) {
    const lastUpdateId = response.result[0].update_id;

    props.setProperty('LAST_UPDATE_ID', String(lastUpdateId));

    log_('PENDING_FORGOTTEN', 'Old pending Telegram updates forgotten.', {
      lastUpdateId: lastUpdateId,
      rawBodyPreview: truncate_(response.rawBody, 1000)
    });

    return;
  }

  props.setProperty('LAST_UPDATE_ID', '0');

  log_('PENDING_EMPTY', 'No pending Telegram updates found.', {
    rawBodyPreview: truncate_(response.rawBody, 1000)
  });
}
