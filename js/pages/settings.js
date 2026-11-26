import { store } from '../store.js';
import { el, sectionTitle, card } from '../ui.js';
import { API_URL } from '../config.js';

export function render(container) {
  const { data } = store;
  if (!data) return;

  container.appendChild(sectionTitle('Эрэмбэ (Priority)'));
  container.appendChild(card((data.PRIORITY || []).map((p) => el('div', { class: 'legend-row' }, [
    el('span', { class: 'dot', style: `background:${p['Өнгө']}` }),
    el('span', {}, p['Нэр']),
  ]))));

  container.appendChild(sectionTitle('Хэсгүүд (Areas)'));
  container.appendChild(card((data.AREAS || []).map((a) => el('div', { class: 'legend-row' }, [
    el('span', { class: 'dot', style: `background:${a['Өнгө']}` }),
    el('span', {}, a['Нэр']),
  ]))));

  container.appendChild(sectionTitle('Өгөгдлийн сан'));
  container.appendChild(card([
    el('p', {}, 'Энэ апп чиний Google Sheet-тэй шууд холбогдсон байна. Бүх дата тэнд хадгалагддаг.'),
    el('a', { href: API_URL + '?action=getAll', target: '_blank', class: 'btn btn-sm' }, 'API-г шууд үзэх'),
  ]));
}
