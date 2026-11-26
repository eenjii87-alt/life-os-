import { store, addRow, deleteRow } from '../store.js';
import { el, card, sectionTitle, emptyState, toast } from '../ui.js';

const MONTHS = ['1-р сар', '2-р сар', '3-р сар', '4-р сар', '5-р сар', '6-р сар', '7-р сар', '8-р сар', '9-р сар', '10-р сар', '11-р сар', '12-р сар'];

function daysUntil(month, day) {
  const now = new Date();
  let target = new Date(now.getFullYear(), month - 1, day);
  if (target < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
    target = new Date(now.getFullYear() + 1, month - 1, day);
  }
  return Math.round((target - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000);
}

function addForm() {
  const name = el('input', { class: 'input', placeholder: 'Хэний төрсөн өдөр вэ?' });
  const month = el('select', { class: 'input' }, MONTHS.map((m, i) => el('option', { value: i + 1 }, m)));
  const day = el('input', { class: 'input', type: 'number', min: '1', max: '31', placeholder: 'Өдөр' });
  const note = el('input', { class: 'input', placeholder: 'Тэмдэглэл (заавал биш)' });
  const btn = el('button', { class: 'btn btn-primary', onclick: async () => {
    if (!name.value.trim() || !day.value) return;
    await addRow('BIRTHDAYS', {
      'Нэр': name.value.trim(),
      'Сар': month.value,
      'Өдөр': day.value,
      'Тэмдэглэл': note.value,
    });
    name.value = ''; day.value = ''; note.value = '';
    toast('Төрсөн өдөр нэмлээ 🎂');
    location.hash = '#birthdays';
  } }, '+ Нэмэх');
  return el('div', { class: 'add-form' }, [name, month, day, note, btn]);
}

function row(b) {
  const left = daysUntil(parseInt(b['Сар'], 10), parseInt(b['Өдөр'], 10));
  return el('div', { class: 'wish-row' }, [
    el('div', {}, [
      el('div', { class: 'wish-text' }, `🎂 ${b['Нэр']}`),
      el('div', { class: 'muted' }, `${MONTHS[parseInt(b['Сар'], 10) - 1]} ${b['Өдөр']} · ${left === 0 ? 'Өнөөдөр!' : `${left} өдрийн дараа`}`),
      b['Тэмдэглэл'] ? el('div', { class: 'muted' }, b['Тэмдэглэл']) : null,
    ]),
    el('button', { class: 'btn btn-sm btn-failed', onclick: async () => {
      if (!window.confirm('Устгах уу?')) return;
      await deleteRow('BIRTHDAYS', b['BirthdayID']);
      toast('Устгалаа');
    } }, '✕'),
  ]);
}

export function render(container) {
  const { data } = store;
  if (!data) return;

  container.appendChild(sectionTitle('Төрсөн өдөр'));
  container.appendChild(addForm());

  const list = [...(data.BIRTHDAYS || [])].sort((a, b) => daysUntil(parseInt(a['Сар'], 10), parseInt(a['Өдөр'], 10)) - daysUntil(parseInt(b['Сар'], 10), parseInt(b['Өдөр'], 10)));
  if (list.length === 0) {
    container.appendChild(card([emptyState('Төрсөн өдөр алга байна. Дээрээс нэмээрэй.')]));
  } else {
    container.appendChild(el('div', { class: 'wish-list' }, list.map(row)));
  }
}
