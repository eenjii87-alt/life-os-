import { store, addRow, deleteRow } from '../store.js';
import { el, sectionTitle, card, toast } from '../ui.js';
import { API_URL } from '../config.js';

function deletableRow(label, onDelete) {
  return el('div', { class: 'legend-row manage-row' }, [
    el('span', {}, label),
    el('button', { class: 'btn btn-sm btn-failed', onclick: async () => {
      if (!window.confirm('Устгах уу?')) return;
      await onDelete();
      toast('Устгалаа');
    } }, '✕'),
  ]);
}

function areaManager() {
  const name = el('input', { class: 'input', placeholder: 'Шинэ Area нэр' });
  const color = el('input', { class: 'input', type: 'color', value: '#C2185B' });
  const add = el('button', { class: 'btn btn-primary', onclick: async () => {
    if (!name.value.trim()) return;
    await addRow('AREAS', { 'Нэр': name.value.trim(), 'Өнгө': color.value });
    name.value = '';
    toast('Area нэмлээ');
  } }, '+ Нэмэх');

  const rows = (store.data.AREAS || []).map((a) => el('div', { class: 'legend-row manage-row' }, [
    el('span', { class: 'dot', style: `background:${a['Өнгө']}` }),
    el('span', {}, a['Нэр']),
    el('button', { class: 'btn btn-sm btn-failed', onclick: async () => {
      if (!window.confirm('Устгах уу?')) return;
      await deleteRow('AREAS', a['AreaID']);
      toast('Устгалаа');
    } }, '✕'),
  ]));

  return card([el('div', { class: 'add-form' }, [name, color, add]), ...rows]);
}

function priorityManager() {
  const name = el('input', { class: 'input', placeholder: 'Шинэ Priority нэр' });
  const color = el('input', { class: 'input', type: 'color', value: '#EF4444' });
  const order = el('input', { class: 'input', type: 'number', placeholder: 'Эрэмбэ', style: 'width:80px' });
  const add = el('button', { class: 'btn btn-primary', onclick: async () => {
    if (!name.value.trim()) return;
    await addRow('PRIORITY', { 'Нэр': name.value.trim(), 'Өнгө': color.value, 'Эрэмбэ': order.value || '0' });
    name.value = ''; order.value = '';
    toast('Priority нэмлээ');
  } }, '+ Нэмэх');

  const rows = (store.data.PRIORITY || []).map((p) => el('div', { class: 'legend-row manage-row' }, [
    el('span', { class: 'dot', style: `background:${p['Өнгө']}` }),
    el('span', {}, p['Нэр']),
    el('button', { class: 'btn btn-sm btn-failed', onclick: async () => {
      if (!window.confirm('Устгах уу?')) return;
      await deleteRow('PRIORITY', p['PriorityID']);
      toast('Устгалаа');
    } }, '✕'),
  ]));

  return card([el('div', { class: 'add-form' }, [name, color, order, add]), ...rows]);
}

function labelManager() {
  const name = el('input', { class: 'input', placeholder: 'Шинэ Label нэр' });
  const add = el('button', { class: 'btn btn-primary', onclick: async () => {
    if (!name.value.trim()) return;
    await addRow('LABELS', { 'Нэр': name.value.trim() });
    name.value = '';
    toast('Label нэмлээ');
  } }, '+ Нэмэх');

  const rows = (store.data.LABELS || []).map((l) => el('div', { class: 'legend-row manage-row' }, [
    el('span', {}, l['Нэр']),
    el('button', { class: 'btn btn-sm btn-failed', onclick: async () => {
      if (!window.confirm('Устгах уу?')) return;
      await deleteRow('LABELS', l['LabelID']);
      toast('Устгалаа');
    } }, '✕'),
  ]));

  return card([el('div', { class: 'add-form' }, [name, add]), ...rows]);
}

export function render(container) {
  const { data } = store;
  if (!data) return;

  container.appendChild(sectionTitle('Хэсгүүд (Areas)'));
  container.appendChild(areaManager());

  container.appendChild(sectionTitle('Эрэмбэ (Priority)'));
  container.appendChild(priorityManager());

  container.appendChild(sectionTitle('Шошго (Labels)'));
  container.appendChild(labelManager());

  container.appendChild(sectionTitle('Өгөгдлийн сан'));
  container.appendChild(card([
    el('p', {}, 'Энэ апп чиний Google Sheet-тэй шууд холбогдсон байна. Бүх дата тэнд хадгалагддаг.'),
    el('a', { href: API_URL + '?action=getAll', target: '_blank', class: 'btn btn-sm' }, 'API-г шууд үзэх'),
  ]));
}
