/*******************************************************
 * 04_Parser.gs
 * Converts Telegram text into an expense object.
 *
 * Supported examples:
 * - food 30 euro
 * - 82 euros flixbus
 * - migros 12.50 chf
 * - coffee 4
 * - cafe 4chf
 * - 4 chf cafe
 * - €12 lunch
 * - lunch €12
 *******************************************************/


function parseExpense(text) {
  text = String(text || '').trim();

  if (!text || text.startsWith('/')) {
    return null;
  }

  const currencyWords = {
    'chf': 'CHF',
    'fr': 'CHF',
    'franc': 'CHF',
    'francs': 'CHF',

    'eur': 'EUR',
    'euro': 'EUR',
    'euros': 'EUR',
    '€': 'EUR',

    'usd': 'USD',
    'dollar': 'USD',
    'dollars': 'USD',
    '$': 'USD',

    'peso': 'ARG',
    'pesos' : 'ARG'
  };

  const words = text.split(/\s+/);

  let amount = null;
  let currency = null;
  const descriptionWords = [];

  for (const originalWord of words) {
    const word = originalWord
      .toLowerCase()
      .replace(/^[^\w€$.,-]+|[^\w€$.,-]+$/g, '');

    /*******************************************************
     * Match compact amount + currency:
     * 4chf, 4CHF, 4eur, 4€, 12.50chf, 12,50eur
     *******************************************************/
    const amountCurrencyMatch = word.match(
      /^(-?\d+(?:[.,]\d{1,2})?)(chf|fr|eur|euro|euros|€|usd|\$)$/i
    );

    if (amountCurrencyMatch && amount === null) {
      amount = Number(amountCurrencyMatch[1].replace(',', '.'));
      currency = currencyWords[amountCurrencyMatch[2].toLowerCase()] || currency;
      continue;
    }

    /*******************************************************
     * Match currency + amount:
     * €4, $4, €12.50, $12,50
     *******************************************************/
    const currencyAmountMatch = word.match(
      /^(€|\$)(-?\d+(?:[.,]\d{1,2})?)$/i
    );

    if (currencyAmountMatch && amount === null) {
      currency = currencyWords[currencyAmountMatch[1].toLowerCase()] || currency;
      amount = Number(currencyAmountMatch[2].replace(',', '.'));
      continue;
    }

    /*******************************************************
     * Match normal amount:
     * 4, 12.50, 12,50
     *******************************************************/
    if (amount === null && /^-?\d+(?:[.,]\d{1,2})?$/.test(word)) {
      amount = Number(word.replace(',', '.'));
      continue;
    }

    /*******************************************************
     * Match normal currency:
     * chf, euros, usd
     *******************************************************/
    if (currency === null && currencyWords[word]) {
      currency = currencyWords[word];
      continue;
    }

    descriptionWords.push(originalWord);
  }

  if (amount === null || !Number.isFinite(amount)) {
    return null;
  }

  const description = descriptionWords.join(' ').trim();

  if (!description) {
    return null;
  }

  return {
    description: description,
    amount: amount,
    currency: currency || DEFAULT_CURRENCY
  };
}


/*******************************************************
 * Manual parser test.
 * You can run this from Apps Script to check parsing.
 *******************************************************/
function testParser() {
  const examples = [
    '82 euros FlixBus',
    'migros 12.50 chf',
    'coffee 4',
    'cafe 4chf',
    '4 chf cafe',
    '4 euros cafe',
    '€12 lunch',
    'lunch €12',
    'netflix 18 chf',
    'train ticket 24.90 eur'
  ];

  examples.forEach(function(example) {
    const parsed = parseExpense(example);

    Logger.log(example + ' => ' + JSON.stringify(parsed));

    log_('TEST_PARSER', example, parsed);
  });
}
