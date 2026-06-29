# Changelog

All notable changes to this project will be documented in this file.

The format is inspired by [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project uses semantic-style versioning while it is still evolving.

## [0.1.0] - 2026-06-28

### Added
- Initial public template structure.
- Google Apps Script source split into modular files.
- Telegram polling with `getUpdates`.
- Expense parsing for messages such as `coffee 4`, `82 euros FlixBus`, and `lunch €12`.
- Google Sheets storage with `Expenses`, `BotLogs`, and `Dashboard` sheets.
- Multi-user and trip/family mode support.
- Admin and user permission model.
- Dashboard rebuild helpers.
- clasp-based local development setup.

### Changed
- Replaced hardcoded private config with Apps Script `PropertiesService`.
- Added setup helpers for private Script Properties.

### Security
- Telegram bot token, spreadsheet ID, and Telegram user IDs are no longer stored in source code.

### Verified

- Tested clean `clasp` install flow with a new standalone Apps Script project.
- Verified Script Properties configuration.
- Verified Telegram connection with `testTelegramConnection`.
- Verified `setupOnce`, polling, message parsing, multiple currencies, and Google Sheets writes.
- Confirmed `.clasp.json`, `.clasprc.json`, tokens, and spreadsheet IDs are not committed.
