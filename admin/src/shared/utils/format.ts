export function formatMoney(amount = 0, currency = 'UZS') {
  return `${Math.round(amount).toLocaleString('ru-RU')} ${currency}`;
}

export function formatDate(value?: string) {
  if (!value) {
    return '-';
  }
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
