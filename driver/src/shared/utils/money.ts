export function formatMoney(amount: number, currency = 'UZS') {
  return `${Math.round(amount).toLocaleString('ru-RU')} ${currency}`;
}
