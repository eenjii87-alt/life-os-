import { store, addRow, deleteRow, todayISO } from '../store.js';
import { el, statusChip, priorityDot, formatDate, toast, emptyState, sectionTitle } from '../ui.js';
import { STATUS } from '../config.js';
import { setStatus, isLocked } from '../task-actions.js';
import { getContext, taskInContext } from '../context.js';

function taskRow(task) {
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
  const startTime = el('input', { type: 'time', class: 'input', title: 'Эхлэх цаг' });
  const endTime = el('input', { type: 'time', class: 'input', title: 'Дуусах цаг' });
  const projectSelect = el('select', { class: 'input' }, [
    el('option', { value: '' }, '— Төсөлгүй —'),
    ...(store.data.PROJECTS || []).map((p) => el('option', { value: p['ProjectID'] }, p['Нэр'])),
  ]);
  const prioritySelect = el('select', { class: 'input' },
    (store.data.PRIORITY || []).map((p) => el('option', { value: p['PriorityID'] }, p['Нэр']))
  );
  const dependsSelect = el('select', { class: 'input' }, [
    el('option', { value: '' }, '— Урьдчилсан нөхцөлгүй —'),
    ...(store.data.TASKS || []).filter((t) => t['Статус'] !== STATUS.DONE).map((t) => el('option', { value: t['TaskID'] }, `Эхлээд: ${t['Нэр']}`)),
  ]);
  const btn = el('button', { class: 'btn btn-primary', onclick: async () => {
    if (!nameInput.value.trim()) return;
    await addRow('TASKS', {
      'Нэр': nameInput.value.trim(),
      ProjectID: projectSelect.value,
      PriorityID: prioritySelect.value,
      LabelID: '',
      DependsOnTaskID: dependsSelect.value,
      'Статус': STATUS.TODO,
      'Эхлэх огноо': todayISO(),
      'Due date': dueInput.value || '',
      'Үүсгэсэн огноо': todayISO(),
      'Дууссан огноо': '',
      'Сүүлд хөдөлсөн огноо': todayISO(),
      WishID: '',
      'Эхлэх цаг': startTime.value || '',
      'Дуусах цаг': endTime.value || '',
    });
    nameInput.value = '';
    dueInput.value = '';
    startTime.value = '';
    endTime.value = '';
    toast('Шинэ даалгавар нэмлээ');
    onAdded();
  } }, '+ Нэмэх');
  return el('div', { class: 'add-form' }, [nameInput, dueInput, startTime, endTime, projectSelect, prioritySelect, dependsSelect, btn]);
}

export function render(container, params) {
  const { data } = store;
  if (!data) return;
  const ctx = getContext();
  const tasks = (data.TASKS || []).filter((t) => taskInContext(t, ctx));
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
  const activeStatus = { doing: STATUS.DOING, failed: STATUS.FAILED, done: STATUS.DONE, todo: STATUS.TODO }[filter] || '';
  const filterKeyFor = { [STATUS.DOING]: 'doing', [STATUS.FAILED]: 'failed', [STATUS.DONE]: 'done', [STATUS.TODO]: 'todo' };
  const tabsRow = el('div', { class: 'tabs' }, tabs.map(([label, val]) =>
    el('a', { class: `tab ${activeStatus === val ? 'active' : ''}`, href: val ? `#tasks?filter=${filterKeyFor[val]}` : '#tasks' }, label)
  ));
  container.appendChild(tabsRow);

  let filtered = tasks;
  if (filter === 'failed') filtered = tasks.filter((t) => t['Статус'] === STATUS.FAILED);
  else if (filter === 'doing') filtered = tasks.filter((t) => t['Статус'] === STATUS.DOING);
  else if (filter === 'done') filtered = tasks.filter((t) => t['Статус'] === STATUS.DONE);
  else if (filter === 'todo') filtered = tasks.filter((t) => t['Статус'] === STATUS.TODO);
  else if (filter === 'done-today') filtered = tasks.filter((t) => t['Дууссан огноо'] === todayISO());

  if (filtered.length === 0) {
    container.appendChild(emptyState('Даалгавар алга байна'));
  } else {
    container.appendChild(el('div', { class: 'task-list' }, filtered.map(taskRow)));
  }
}
