import { store, addRow, todayISO } from '../store.js';
import { el, card, sectionTitle, emptyState, toast } from '../ui.js';

function entryForm() {
  const g1 = el('input', { class: 'input', placeholder: 'Талархал 1' });
  const g2 = el('input', { class: 'input', placeholder: 'Талархал 2' });
  const g3 = el('input', { class: 'input', placeholder: 'Талархал 3' });
  const mood = el('select', { class: 'input' }, [1, 2, 3, 4, 5].map((n) => el('option', { value: n }, `${n}`)));
  const morning = el('input', { class: 'input', placeholder: 'Өглөө яаж эхэлсэн бэ?' });
  const highlight = el('input', { class: 'input', placeholder: 'Өдрийн онцлох зүйл' });
  const bad = el('input', { class: 'input', placeholder: 'Юу муухай санагдсан бэ? (заавал биш)' });
  const why = el('input', { class: 'input', placeholder: 'Яагаад?' });
  const empathy = el('input', { class: 'input', placeholder: 'Тэр хүний оронд байсан бол юу хийх байсан бэ?' });
  const photo = el('input', { class: 'input', placeholder: 'Зургийн линк (заавал биш)' });
  const special = el('label', { class: 'checkbox-label' }, [
    el('input', { type: 'checkbox' }),
    ' Онцгой өдөр үү?',
  ]);
  const specialInput = special.querySelector('input');

  const btn = el('button', { class: 'btn btn-primary', onclick: async () => {
    await addRow('JOURNAL', {
      'Огноо': todayISO(),
      'Талархал 1': g1.value,
      'Талархал 2': g2.value,
      'Талархал 3': g3.value,
      'Мэдрэмж (1-5)': mood.value,
      'Өглөө яаж эхэлсэн': morning.value,
      'Өдрийн онцлох зүйл': highlight.value,
      'Юу муухай санагдсан': bad.value,
      'Яагаад': why.value,
      'Өөр хүний оронд юу хийх байсан': empathy.value,
      'Зургийн линк': photo.value,
      'Онцгой өдөр үү': specialInput.checked,
    });
    toast('Тэмдэглэл хадгаллаа 📝');
    location.hash = '#journal';
  } }, 'Хадгалах');

  return card([
    el('h3', {}, 'Өнөөдрийн тэмдэглэл'),
    el('div', { class: 'journal-form' }, [g1, g2, g3, mood, morning, highlight, bad, why, empathy, photo, special, btn]),
  ]);
}

function entryCard(entry) {
  return card([
    el('div', { class: 'journal-date' }, entry['Огноо']),
    el('div', { class: 'journal-mood' }, `Мэдрэмж: ${entry['Мэдрэмж (1-5)']}/5`),
    el('ul', { class: 'gratitude-list' }, [1, 2, 3].map((n) => entry[`Талархал ${n}`] ? el('li', {}, entry[`Талархал ${n}`]) : null).filter(Boolean)),
    entry['Өдрийн онцлох зүйл'] ? el('div', {}, `✨ ${entry['Өдрийн онцлох зүйл']}`) : null,
  ], { class: 'card journal-entry' });
}

export function render(container) {
  const { data } = store;
  if (!data) return;

  container.appendChild(entryForm());

  container.appendChild(sectionTitle('Өмнөх тэмдэглэлүүд'));
  const entries = [...(data.JOURNAL || [])].sort((a, b) => (a['Огноо'] < b['Огноо'] ? 1 : -1));
  if (entries.length === 0) {
    container.appendChild(emptyState('Тэмдэглэл алга байна'));
  } else {
    entries.forEach((e) => container.appendChild(entryCard(e)));
  }
}
