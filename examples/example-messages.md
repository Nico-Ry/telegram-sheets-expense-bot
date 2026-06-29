# Example Messages

These are safe demo messages for testing the parser.

```text
coffee 4
82 euros FlixBus
migros 12.50 chf
cafe 4chf
lunch €12
train 18 eur
hotel 120 chf
museum ticket 15 euro
pizza 14.50
coop groceries 32.10 chf
```

Expected behavior:

- The bot detects the amount.
- The bot detects the currency when present.
- The bot stores the remaining text as the description.
- The bot assigns a category using category rules.
