import { store, updateRow, addRow, deleteRow, todayISO } from '../store.js';
import { el, statusChip, priorityDot, formatDate, toast, emptyState, card, sectionTitle } from '../ui.js';
import { STATUS } from '../config.js';

function isLocked(task) {
  const dep = task['DependsOnTaskID'];
  if (!dep) return false;
  const depTask = (store.data.TASKS || []).find((t) => String(t['TaskID']) === String(dep));
  return depTask && depTask['Статус'] !== STATUS.DONE;
}

async function setStatus(task, status) {
  const patch = { 'Статус': status, 'Сүүлд хөдөлсөн огноо': todayISO() };
  if (status === STATUS.DONE) patch['Дууссан огноо'] = todayISO();
  await updateRow('TASKS', task['TaskID'], patch);
  await addRow('TASK_LOG', { TaskID: task['TaskID'], Огноо: todayISO(), 'Статус': status, Note: '' });
  toast('Шинэчиллээ ✓');
}

function taskRow(task) {
  const locked = isLocked(task);
  return el('div', { class: `task-row ${locked ? 'locked' : ''}` }, [
    el('div', { class: 'task-main' }, [
      el('div', { class: 'task-name' }, [locked ? el('span', { class: 'lock' }, '🔒 ') : null, task['Нэр']]),
      el('div', { class: 'task-meta' }, [
        priorityDot(task['PriorityID']),
        statusChip(task['Статус']),
        el('span', { class: 'due' }, `Due: ${formatDate(task['Due date'])}`),
      ]),
    ]),
    el('div', { class: 'task-actions' }, [
      ...(locked ? [] : [
        el('button', { class: 'btn btn-done', onclick: () => setStatus(task, STATUS.DONE) }, '✓'),
        el('button', { class: 'btn btn-doing', onclick: () => setStatus(task, STATUS.DOING) }, '…'),
        el('button', { class: 'btn btn-failed', onclick: () => setStatus(task, STATUS.FAILED) }, '✕'),
      ]),
      el('button', { class: 'btn btn-sm', title: 'Устгах', onclick: async () => {
        if (!window.confirm('Даалгаврыг устгах уу?')) return;
        await deleteRow('TASKS', task['TaskID']);
        toast('Устгалаа');
      } }, '🗑'),
    ]),
  ]);
}

function addTaskForm(onAdded) {
  const nameInput = el('input', { placeholder: 'Шинэ даалгаврын нэр', class: 'input' });
  const dueInput = el('input', { type: 'date', class: 'input' });
  const projectSelect = el('select', { class: 'input' }, [
    el('option', { value: '' }, '— Төсөлгүй —'),
    ...(store.data.PROJECTS || []).map((p) => el('option', { value: p['ProjectID'] }, p['Нэр'])),
  ]);
  const prioritySelect = el('select', { class: 'input' },
    (store.data.PRIORITY || []).map((p) => el('option', { value: p['PriorityID'] }, p['Нэр']))
  );
  const btn = el('button', { class: 'btn btn-primary', onclick: async () => {
    if (!nameInput.value.trim()) return;
    await addRow('TASKS', {
      'Нэр': nameInput.value.trim(),
      ProjectID: projectSelect.value,
      PriorityID: prioritySelect.value,
      LabelID: '',
      DependsOnTaskID: '',
      'Статус': STATUS.TODO,
      'Эхлэх огноо': todayISO(),
      'Due date': dueInput.value || '',
      'Үүсгэсэн огноо': todayISO(),
      'Дууссан огноо': '',
      'Сүүлд хөдөлсөн огноо': todayISO(),
      WishID: '',
    });
    nameInput.value = '';
    dueInput.value = '';
    toast('Шинэ даалгавар нэмлээ');
    onAdded();
  } }, '+ Нэмэх');
  return el('div', { class: 'add-form' }, [nameInput, dueInput, projectSelect, prioritySelect, btn]);
}

export function render(container, params) {
  const { data } = store;
  if (!data) return;
  const tasks = data.TASKS || [];
  const filter = params?.get?.('filter');

  container.appendChild(sectionTitle('Хийх зүйлс'));
  container.appendChild(addTaskForm(() => location.hash = '#tasks'));

  const tabs = [
    ['Бүгд', ''],
    ['Хийгдээгүй', STATUS.TODO],
    ['Хийгдэж буй', STATUS.DOING],
    ['Дууссан', STATUS.DONE],
    ['Амжилтгүй', STATUS.FAILED],
  ];
  const activeStatus = { doing: STATUS.DOING, failed: STATUS.FAILED }[filter] || '';
  const tabsRow = el('div', { class: 'tabs' }, tabs.map(([label, val]) =>
    el('a', { class: `tab ${activeStatus === val ? 'active' : ''}`, href: val ? `#tasks?filter=${val === STATUS.DOING ? 'doing' : 'failed'}` : '#tasks' }, label)
  ));
  container.appendChild(tabsRow);

  let filtered = tasks;
  if (filter === 'failed') filtered = tasks.filter((t) => t['Статус'] === STATUS.FAILED);
  else if (filter === 'doing') filtered = tasks.filter((t) => t['Статус'] === STATUS.DOING);
  else if (filter === 'done-today') filtered = tasks.filter((t) => t['Дууссан огноо'] === todayISO());

  if (filtered.length === 0) {
    container.appendChild(emptyState('Даалгавар алга байна'));
  } else {
    container.appendChild(el('div', { class: 'task-list' }, filtered.map(taskRow)));
  }
}
