import { store, addRow, updateRow, deleteRow, todayISO } from '../store.js';
import { el, card, sectionTitle, emptyState, toast } from '../ui.js';

function pct(row) {
  const v = parseFloat(row?.['% Дуусгал']);
  return isNaN(v) ? 0 : Math.round(v * 100);
}

function progressBar(percent) {
  return el('div', { class: 'progress' }, [
    el('div', { class: 'progress-fill', style: `width:${percent}%` }),
    el('span', { class: 'progress-label' }, `${percent}%`),
  ]);
}

async function convertWishToGoal(wish) {
  const name = window.prompt('Энэ хүслийг ямар нэртэй зорилго болгох вэ?', wish['Текст']) || wish['Текст'];
  const goalId = await addRow('GOALS', {
    'Нэр': name,
    AreaID: '',
    WishID: wish['WishID'],
    'Тайлбар': '',
  });
  await updateRow('WISHES', wish['WishID'], { 'Статус': 'Зорилго болсон', GoalID: goalId });
  toast('Зорилго болголоо 🌟');
  location.hash = '#goals';
}

function wishRow(wish) {
  const isActive = wish['Статус'] !== 'Зорилго болсон';
  return el('div', { class: 'wish-row' }, [
    el('div', { class: 'wish-text' }, wish['Текст']),
    el('div', {}, [
      isActive
        ? el('button', { class: 'btn btn-primary', onclick: () => convertWishToGoal(wish) }, 'Зорилго болгох')
        : el('span', { class: 'chip chip-done' }, 'Зорилго болсон'),
      el('button', { class: 'btn btn-sm', title: 'Устгах', onclick: async () => {
        if (!window.confirm('Хүслийг устгах уу?')) return;
        await deleteRow('WISHES', wish['WishID']);
        toast('Устгалаа');
      } }, '🗑'),
    ]),
  ]);
}

function addWishForm() {
  const input = el('input', { class: 'input', placeholder: 'Шинэ хүсэл бич...' });
  const btn = el('button', { class: 'btn btn-primary', onclick: async () => {
    if (!input.value.trim()) return;
    await addRow('WISHES', {
      'Текст': input.value.trim(),
      'Үүсгэсэн огноо': todayISO(),
      'Статус': 'Идэвхтэй',
      GoalID: '',
    });
    input.value = '';
    toast('Хүсэл нэмлээ');
    location.hash = '#goals';
  } }, '+ Хүсэл нэмэх');
  return el('div', { class: 'add-form' }, [input, btn]);
}

function addProjectForm(goalId) {
  const name = el('input', { class: 'input', placeholder: 'Шинэ төслийн нэр' });
  const kind = el('select', { class: 'input' }, [
    el('option', { value: 'Урт' }, 'Урт хугацааны'),
    el('option', { value: 'Богино' }, 'Богино хугацааны'),
  ]);
  const outcome = el('input', { class: 'input', placeholder: 'Хүрэх үр дүн' });
  const btn = el('button', { class: 'btn btn-sm', onclick: async () => {
    if (!name.value.trim()) return;
    const goal = (store.data.GOALS || []).find((g) => String(g['GoalID']) === String(goalId));
    await addRow('PROJECTS', {
      'Нэр': name.value.trim(),
      GoalID: goalId,
      AreaID: goal ? goal['AreaID'] : '',
      'Хугацааны төрөл': kind.value,
      'Хүрэх үр дүн': outcome.value,
      'Яаж мэдрэгдэх вэ': '',
      'Хэнтэй хамт': '',
    });
    toast('Төсөл нэмлээ');
    location.hash = '#goals';
  } }, '+ Төсөл');
  return el('div', { class: 'add-form-sm' }, [name, kind, outcome, btn]);
}

function projectCard(project) {
  return el('div', { class: 'project-card' }, [
    el('div', { class: 'project-head' }, [
      el('span', { class: 'project-name' }, project['Нэр']),
      el('span', { class: 'project-kind' }, project['Хугацааны төрөл']),
      el('button', { class: 'btn btn-sm', title: 'Устгах', onclick: async () => {
        if (!window.confirm('Төслийг устгах уу?')) return;
        await deleteRow('PROJECTS', project['ProjectID']);
        toast('Устгалаа');
      } }, '🗑'),
    ]),
    progressBar(pct(project)),
    project['Хүрэх үр дүн'] ? el('div', { class: 'project-outcome' }, `🎯 ${project['Хүрэх үр дүн']}`) : null,
  ]);
}

function goalCard(goal) {
  const projects = (store.data.PROJECTS || []).filter((p) => String(p['GoalID']) === String(goal['GoalID']));
  return card([
    el('div', { class: 'goal-head' }, [
      el('h3', {}, goal['Нэр']),
      el('button', { class: 'btn btn-sm', title: 'Устгах', onclick: async () => {
        if (!window.confirm('Зорилгыг устгах уу?')) return;
        await deleteRow('GOALS', goal['GoalID']);
        toast('Устгалаа');
      } }, '🗑'),
    ]),
    progressBar(pct(goal)),
    goal['Тайлбар'] ? el('div', { class: 'goal-desc' }, goal['Тайлбар']) : null,
    el('div', { class: 'project-list' }, projects.length ? projects.map(projectCard) : [emptyState('Төсөл алга')]),
    addProjectForm(goal['GoalID']),
  ], { class: 'card goal-card' });
}

export function render(container) {
  const { data } = store;
  if (!data) return;

  container.appendChild(sectionTitle('Хүсэл (Wishes)'));
  container.appendChild(addWishForm());
  const wishes = data.WISHES || [];
  container.appendChild(
    wishes.length ? el('div', { class: 'wish-list' }, wishes.map(wishRow)) : emptyState('Хүсэл алга байна')
  );

  container.appendChild(sectionTitle('Зорилго ба Төсөл'));
  const goals = data.GOALS || [];
  if (goals.length === 0) {
    container.appendChild(emptyState('Зорилго алга байна — дээрх хүслээ зорилго болгоно уу'));
  } else {
    goals.forEach((g) => container.appendChild(goalCard(g)));
  }
}
