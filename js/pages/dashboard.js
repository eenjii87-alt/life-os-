import { store, todayISO } from '../store.js';
import { el, statusChip, priorityDot, formatDate, emptyState, card, sectionTitle, statCard } from '../ui.js';
import { STATUS } from '../config.js';
import { mascotMood, mascotEmoji } from './assistant.js';
import { setStatus, reschedule, isLocked } from '../task-actions.js';
import { getContext, taskInContext, CONTEXT_LABEL } from '../context.js';

function dateRangeFor(period) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  if (period === 'week') {
    const day = (now.getDay() + 6) % 7; // Monday=0
    start.setDate(now.getDate() - day);
    end.setDate(start.getDate() + 6);
  } else if (period === 'month') {
    start.setDate(1);
    end.setMonth(now.getMonth() + 1, 0);
  } else if (period === 'year') {
    start.setMonth(0, 1);
    end.setMonth(11, 31);
  }
  const iso = (d) => d.toISOString().slice(0, 10);
  return { start: iso(start), end: iso(end) };
}

function inRange(task, period) {
  const due = task['Due date'];
  if (!due) return false;
  const d = String(due).slice(0, 10);
  if (period === 'today') return d <= todayISO();
  const { start, end } = dateRangeFor(period);
  return d >= start && d <= end;
}

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
        timeRange ? el('span', { class: 'due' }, timeRange) : null,
        el('span', { class: 'due' }, `Due: ${formatDate(task['Due date'])}`),
      ]),
    ]),
    el('div', { class: 'task-actions' }, locked ? [statusChip(task['Статус'])] : [
      el('button', { class: 'btn btn-done', onclick: () => setStatus(task, STATUS.DONE) }, '✓ Дууссан'),
      el('button', { class: 'btn btn-doing', onclick: () => setStatus(task, STATUS.DOING) }, 'Хийгдэж буй'),
      el('button', { class: 'btn btn-failed', onclick: () => setStatus(task, STATUS.FAILED) }, 'Амжилтгүй'),
      el('button', { class: 'btn btn-reschedule', onclick: () => reschedule(task) }, 'Дахин төлөвлөх'),
    ]),
  ]);
}

export function render(container, params) {
  const { data } = store;
  if (!data) return;

  const ctx = getContext();
  const period = params?.get?.('period') || 'today';

  const allTasks = (data.TASKS || []).filter((t) => taskInContext(t, ctx));
  const periodTasks = allTasks.filter((t) => t['Статус'] !== STATUS.DONE && inRange(t, period));
  const doneToday = allTasks.filter((t) => t['Дууссан огноо'] === todayISO());
  const failedAll = allTasks.filter((t) => t['Статус'] === STATUS.FAILED);
  const doingAll = allTasks.filter((t) => t['Статус'] === STATUS.DOING);
  const overdue = allTasks.filter((t) => t['Статус'] !== STATUS.DONE && t['Due date'] && String(t['Due date']).slice(0, 10) < todayISO());
  const goalsCount = (data.GOALS || []).length;

  const mood = mascotMood(data);

  container.appendChild(
    card([
      el('div', { class: 'mascot-row' }, [
        el('div', { class: 'mascot' }, mascotEmoji(mood)),
        el('div', {}, [
          el('div', { class: 'mascot-title' }, `Өдрийн мэнд! (${CONTEXT_LABEL[ctx]})`),
          el('div', { class: 'mascot-sub' }, `Дууссан: ${doneToday.length} · Хийгдэж буй: ${doingAll.length} · Амжилтгүй: ${failedAll.length}`),
        ]),
      ]),
    ], { class: 'card hero-card' })
  );

  container.appendChild(el('div', { class: 'stat-grid' }, [
    statCard('Өнөөдөр', periodTasks.filter((t) => inRange(t, 'today')).length, '#dashboard?period=today', 'stat-pink'),
    statCard('Хугацаа хэтэрсэн', overdue.length, '#tasks?filter=failed', 'stat-red'),
    statCard('Хийгдэж буй', doingAll.length, '#tasks?filter=doing', 'stat-amber'),
    statCard('Зорилго', goalsCount, '#goals', 'stat-blue'),
  ]));

  const tabs = [['today', 'Өнөөдөр'], ['week', '7 хоног'], ['month', 'Сар'], ['year', 'Жил']];
  container.appendChild(el('div', { class: 'tabs' }, tabs.map(([val, label]) =>
    el('a', { class: `tab ${period === val ? 'active' : ''}`, href: `#dashboard?period=${val}` }, label)
  )));

  if (periodTasks.length === 0) {
    container.appendChild(emptyState('Энэ хугацаанд хийх даалгавар алга байна 🌿'));
  } else {
    container.appendChild(el('div', { class: 'task-list' }, periodTasks
      .sort((a, b) => String(a['Due date']).localeCompare(String(b['Due date'])))
      .map(taskRow)));
  }

  container.appendChild(sectionTitle('Шуурхай харах'));
  container.appendChild(el('div', { class: 'quick-grid' }, [
    quickCard('Амжилтгүй', failedAll.length, '#tasks?filter=failed'),
    quickCard('Хийгдэж буй', doingAll.length, '#tasks?filter=doing'),
    quickCard('Өнөөдөр дууссан', doneToday.length, '#tasks?filter=done-today'),
  ]));
}

function quickCard(label, count, href) {
  return el('a', { class: 'quick-card', href }, [
    el('div', { class: 'quick-count' }, String(count)),
    el('div', { class: 'quick-label' }, label),
  ]);
}
