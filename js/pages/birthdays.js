import { sectionTitle, emptyState, card, el } from '../ui.js';

export function render(container) {
  container.appendChild(sectionTitle('Төрсөн өдөр'));
  container.appendChild(card([
    emptyState('Энэ хэсэг одоохондоо Google Sheet-д ороогүй байна.'),
    el('p', { class: 'muted' }, 'Хэрэв хүсвэл дараа нь BIRTHDAYS хүснэгтийг нэмж, энд холбож өгч болно.'),
  ]));
}
