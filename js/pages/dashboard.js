import { store, updateRow, addRow, todayISO, areaName } from '../store.js';
import { el, statusChip, priorityDot, formatDate, toast, emptyState, card, sectionTitle } from '../ui.js';
import { STATUS } from '../config.js';
import { mascotMood, mascotEmoji } from './assistant.js';

function isOverdueOrToday(task) {
  if (task['Статус'] === STATUS.DONE) return false;
  const due = task['Due date'];
  if (!due) return false;
  return String(due).slice(0, 10) <= todayISO();
}

async function promptNote(title) {
  return window.prompt(title, '') || '';
}

async function setStatus(task, status) {
  const note = status === STATUS.DONE || status === STATUS.FAILED
    ? await promptNote('Богино тэмдэглэл (заавал биш): энэ даалгаврын талаар юу бодож байна?')
    : '';
  const patch = { 'Статус': status, 'Сүүлд хөдөлсөн огноо': todayISO() };
  if (status === STATUS.DONE) patch['Дууссан огноо'] = todayISO();
  await updateRow('TASKS', task['TaskID'], patch);
  await addRow('TASK_LOG', {
    TaskID: task['TaskID'],
    Огноо: todayISO(),
    'Статус': status,
    Note: note,
  });
  toast('Шинэчиллээ ✓');
}

async function reschedule(task) {
  const newDate = window.prompt('Шинэ due date (ЖЖЖЖ-СС-ӨӨ):', task['Due date'] || todayISO());
  if (!newDate) return;
  await updateRow('TASKS', task['TaskID'], { 'Статус': STATUS.TODO, 'Due date': newDate });
  toast('Хугацааг шилжүүллээ');
}

function isLocked(task) {
  const dep = task['DependsOnTaskID'];
  if (!dep) return false;
  const depTask = (store.data.TASKS || []).find((t) => String(t['TaskID']) === String(dep));
  return depTask && depTask['Статус'] !== STATUS.DONE;
}

function taskRow(task) {
  const locked = isLocked(task);
  const row = el('div', { class: `task-row ${locked ? 'locked' : ''}` }, [
    el('div', { class: 'task-main' }, [
      el('div', { class: 'task-name' }, [locked ? el('span', { class: 'lock' }, '🔒 ') : null, task['Нэр']]),
      el('div', { class: 'task-meta' }, [
        priorityDot(task['PriorityID']),
        el('span', { class: 'due' }, `Due: ${formatDate(task['Due date'])}`),
      ]),
    ]),
    el('div', { class: 'task-actions' }, locked ? [statusChip(task['Статус'])] : [
      el('button', { class: 'btn btn-done', onclick: () => setStatus(task, STATUS.DONE) }, '✓ Дууссан'),
      el('button', { class: 'btn btn-doing', onclick: () => setStatus(task, STATUS.DOING) }, 'Хийгдэж буй'),
      el('button', { class: 'btn btn-failed', onclick: () => setStatus(task, STATUS.FAILED) }, 'Амжилтгүй'),
      el('button', { class: 'btn btn-reschedule', onclick: () => reschedule(task) }, 'Хойшлуулах'),
    ]),
  ]);
  return row;
}

export function render(container) {
  const { data } = store;
  if (!data) return;

  const tasks = data.TASKS || [];
  const today = tasks.filter((t) => isOverdueOrToday(t));
  const doneToday = tasks.filter((t) => t['Дууссан огноо'] === todayISO());
  const failedAll = tasks.filter((t) => t['Статус'] === STATUS.FAILED);
  const doingAll = tasks.filter((t) => t['Статус'] === STATUS.DOING);

  const mood = mascotMood(data);

  container.appendChild(
    card([
      el('div', { class: 'mascot-row' }, [
        el('div', { class: 'mascot' }, mascotEmoji(mood)),
        el('div', {}, [
          el('div', { class: 'mascot-title' }, 'Өнөөдөр'),
          el('div', { class: 'mascot-sub' }, `Дууссан: ${doneToday.length} · Хийгдэж буй: ${doingAll.length} · Амжилтгүй: ${failedAll.length}`),
        ]),
      ]),
    ])
  );

  container.appendChild(sectionTitle('Өнөөдөр хийх зүйлс'));
  if (today.length === 0) {
    container.appendChild(emptyState('Өнөөдөр хийх даалгавар алга байна 🌿'));
  } else {
    const list = el('div', { class: 'task-list' }, today.map(taskRow));
    container.appendChild(list);
  }

  // Quick filters link-outs
  container.appendChild(sectionTitle('Шуурхай харах'));
  const quick = el('div', { class: 'quick-grid' }, [
    quickCard('Амжилтгүй', failedAll.length, '#tasks?filter=failed'),
    quickCard('Хийгдэж буй', doingAll.length, '#tasks?filter=doing'),
    quickCard('Өнөөдөр дууссан', doneToday.length, '#tasks?filter=done-today'),
  ]);
  container.appendChild(quick);
}

function quickCard(label, count, href) {
  return el('a', { class: 'quick-card', href }, [
    el('div', { class: 'quick-count' }, String(count)),
    el('div', { class: 'quick-label' }, label),
  ]);
}
