# Category Rules

The bot detects categories from keywords in the expense description.

Example rules:

| Category | Example keywords |
| --- | --- |
| Food | coffee, cafe, lunch, dinner, pizza, restaurant |
| Groceries | migros, coop, supermarket, groceries |
| Transport | train, bus, flixbus, taxi, uber, metro |
| Travel | hotel, hostel, airbnb, flight |
| Entertainment | cinema, museum, ticket, game |
| Other | fallback category when no rule matches |

The current rules are implemented in `detectCategory_()` inside `src/05_ExpensesSheet.gs`.

A future improvement could move rules into a dedicated Google Sheet tab so non-developers can edit them without touching source code.
