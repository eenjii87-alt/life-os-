import { store, addRow, updateRow, deleteRow, todayISO } from '../store.js';
import { el, card, sectionTitle, emptyState, toast, statusChip, priorityDot, formatDate } from '../ui.js';
import { STATUS } from '../config.js';
import { setStatus, isLocked } from '../task-actions.js';
import { getContext, projectInContext, CONTEXT_LABEL } from '../context.js';

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
  const feel = el('input', { class: 'input', placeholder: 'Яаж мэдрэгдэх вэ (зөвхөн урт хугацааны)' });
  const how = el('input', { class: 'input', placeholder: 'Хэрхэн хийх вэ (зөвхөн урт хугацааны)' });
  const togglePair = () => {
    const isLong = kind.value === 'Урт';
    feel.style.display = isLong ? '' : 'none';
    how.style.display = isLong ? '' : 'none';
    outcome.placeholder = isLong ? 'Урт хугацааны хүрэх үр дүн' : 'Ойрын хүрэх үр дүн';
  };
  kind.addEventListener('change', togglePair);
  togglePair();
  const btn = el('button', { class: 'btn btn-sm', onclick: async () => {
    if (!name.value.trim()) return;
    const goal = (store.data.GOALS || []).find((g) => String(g['GoalID']) === String(goalId));
    await addRow('PROJECTS', {
      'Нэр': name.value.trim(),
      GoalID: goalId,
      AreaID: goal ? goal['AreaID'] : '',
      'Хугацааны төрөл': kind.value,
      'Хүрэх үр дүн': outcome.value,
      'Яаж мэдрэгдэх вэ': kind.value === 'Урт' ? feel.value : '',
      'Хэрхэн хийх вэ': kind.value === 'Урт' ? how.value : '',
      'Хэнтэй хамт': '',
    });
    toast('Төсөл нэмлээ');
    location.hash = '#goals';
  } }, '+ Төсөл');
  return el('div', { class: 'add-form-sm' }, [name, kind, outcome, feel, how, btn]);
}

function addProjectTaskForm(project) {
  const name = el('input', { class: 'input', placeholder: 'Даалгаврын нэр' });
  const due = el('input', { class: 'input', type: 'date' });
  const start = el('input', { class: 'input', type: 'time', title: 'Эхлэх цаг' });
  const end = el('input', { class: 'input', type: 'time', title: 'Дуусах цаг' });
  const prioritySelect = el('select', { class: 'input' },
    (store.data.PRIORITY || []).map((p) => el('option', { value: p['PriorityID'] }, p['Нэр']))
  );
  const sameProjectTasks = (store.data.TASKS || []).filter((t) => String(t['ProjectID']) === String(project['ProjectID']) && t['Статус'] !== STATUS.DONE);
  const dependsSelect = el('select', { class: 'input' }, [
    el('option', { value: '' }, '— Урьдчилсан нөхцөлгүй —'),
    ...sameProjectTasks.map((t) => el('option', { value: t['TaskID'] }, `Эхлээд: ${t['Нэр']}`)),
  ]);
  const btn = el('button', { class: 'btn btn-sm', onclick: async () => {
    if (!name.value.trim()) return;
    await addRow('TASKS', {
      'Нэр': name.value.trim(),
      ProjectID: project['ProjectID'],
      PriorityID: prioritySelect.value,
      LabelID: '',
      DependsOnTaskID: dependsSelect.value,
      'Статус': STATUS.TODO,
      'Эхлэх огноо': todayISO(),
      'Due date': due.value || '',
      'Үүсгэсэн огноо': todayISO(),
      'Дууссан огноо': '',
      'Сүүлд хөдөлсөн огноо': todayISO(),
      WishID: '',
      'Эхлэх цаг': start.value || '',
      'Дуусах цаг': end.value || '',
    });
    toast('Даалгавар нэмлээ');
    location.hash = '#goals';
  } }, '+ Даалгавар');
  return el('div', { class: 'add-form-sm' }, [name, due, start, end, prioritySelect, dependsSelect, btn]);
}

function projectTaskRow(task) {
  const locked = isLocked(task);
  const timeRange = task['Эхлэх цаг'] || task['Дуусах цаг']
    ? `${task['Эхлэх цаг'] || '--:--'}–${task['Дуусах цаг'] || '--:--'}`
    : null;
  return el('div', { class: `task-row ${locked ? 'locked' : ''}` }, [
    el('div', { class: 'task-main' }, [
      el('div', { class: 'task-name' }, [locked ? el('span', { class: 'lock' }, '🔒 ') : null, task['Нэр']]),
      el('div', { class: 'task-meta' }, [
        priorityDot(task['PriorityID']),
        statusChip(task['Статус']),
        timeRange ? el('span', { class: 'due' }, timeRange) : null,
        el('span', { class: 'due' }, `Due: ${formatDate(task['Due date'])}`),
      ]),
    ]),
    el('div', { class: 'task-actions' }, locked ? [] : [
      el('button', { class: 'btn btn-done', onclick: () => setStatus(task, STATUS.DONE) }, '✓'),
      el('button', { class: 'btn btn-doing', onclick: () => setStatus(task, STATUS.DOING) }, '…'),
      el('button', { class: 'btn btn-failed', onclick: () => setStatus(task, STATUS.FAILED) }, '✕'),
    ]),
  ]);
}

function projectCard(project) {
  const tasks = (store.data.TASKS || [])
    .filter((t) => String(t['ProjectID']) === String(project['ProjectID']))
    .sort((a, b) => {
      const pa = parseFloat((store.data.PRIORITY || []).find((p) => String(p['PriorityID']) === String(a['PriorityID']))?.['Эрэмбэ']) || 99;
      const pb = parseFloat((store.data.PRIORITY || []).find((p) => String(p['PriorityID']) === String(b['PriorityID']))?.['Эрэмбэ']) || 99;
      return pa - pb;
    });
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
    project['Яаж мэдрэгдэх вэ'] ? el('div', { class: 'project-outcome' }, `🌿 Мэдрэгдэх нь: ${project['Яаж мэдрэгдэх вэ']}`) : null,
    project['Хэрхэн хийх вэ'] ? el('div', { class: 'project-outcome' }, `🛠 Хэрхэн: ${project['Хэрхэн хийх вэ']}`) : null,
    el('div', { class: 'project-tasks' }, tasks.length ? tasks.map(projectTaskRow) : [emptyState('Даалгавар алга')]),
    addProjectTaskForm(project),
  ]);
}

function goalCard(goal, ctx) {
  const projects = (store.data.PROJECTS || []).filter((p) => String(p['GoalID']) === String(goal['GoalID']) && projectInContext(p, ctx));
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

  const ctx = getContext();
  container.appendChild(sectionTitle(`Зорилго ба Төсөл (${CONTEXT_LABEL[ctx]})`));
  const goals = data.GOALS || [];
  if (goals.length === 0) {
    container.appendChild(emptyState('Зорилго алга байна — дээрх хүслээ зорилго болгоно уу'));
  } else {
    goals.forEach((g) => container.appendChild(goalCard(g, ctx)));
  }
}
