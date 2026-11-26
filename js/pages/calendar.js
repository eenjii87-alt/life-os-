import { store } from '../store.js';
import { el, sectionTitle, emptyState } from '../ui.js';

function pad(n) { return String(n).padStart(2, '0'); }

export function render(container, params) {
  const { data } = store;
  if (!data) return;

  const now = new Date();
  const year = parseInt(params?.get?.('y'), 10) || now.getFullYear();
  const month = params?.get?.('m') !== null && params?.get?.('m') !== undefined && params.get('m') !== '' ? parseInt(params.get('m'), 10) : now.getMonth();
  const first = new Date(year, month, 1);
  const startDay = (first.getDay() + 6) % 7; // Monday=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const tasksByDate = {};
  (data.TASKS || []).forEach((t) => {
    const d = t['Due date'];
    if (!d) return;
    const key = String(d).slice(0, 10);
    (tasksByDate[key] = tasksByDate[key] || []).push(t);
  });
  const journalByDate = {};
  (data.JOURNAL || []).forEach((j) => {
    journalByDate[String(j['Огноо']).slice(0, 10)] = j;
  });
  const birthdaysByMonthDay = {};
  (data.BIRTHDAYS || []).forEach((b) => {
    const key = `${pad(parseInt(b['Сар'], 10))}-${pad(parseInt(b['Өдөр'], 10))}`;
    (birthdaysByMonthDay[key] = birthdaysByMonthDay[key] || []).push(b);
  });

  const prevM = month === 0 ? 11 : month - 1;
  const prevY = month === 0 ? year - 1 : year;
  const nextM = month === 11 ? 0 : month + 1;
  const nextY = month === 11 ? year + 1 : year;

  container.appendChild(sectionTitle(`${year}-${pad(month + 1)}`, el('div', { class: 'cal-nav' }, [
    el('a', { class: 'btn btn-sm', href: `#calendar?y=${prevY}&m=${prevM}` }, '‹ Өмнөх'),
    el('a', { class: 'btn btn-sm', href: `#calendar?y=${now.getFullYear()}&m=${now.getMonth()}` }, 'Өнөөдөр'),
    el('a', { class: 'btn btn-sm', href: `#calendar?y=${nextY}&m=${nextM}` }, 'Дараах ›'),
  ])));

  const grid = el('div', { class: 'calendar-grid' });
  ['Да', 'Мя', 'Лх', 'Пү', 'Ба', 'Бя', 'Ня'].forEach((d) => grid.appendChild(el('div', { class: 'cal-head' }, d)));
  for (let i = 0; i < startDay; i++) grid.appendChild(el('div', { class: 'cal-cell empty' }));
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${pad(month + 1)}-${pad(d)}`;
    const dayTasks = tasksByDate[key] || [];
    const hasJournal = !!journalByDate[key];
    const birthdays = birthdaysByMonthDay[`${pad(month + 1)}-${pad(d)}`] || [];
    const isToday = key === new Date().toISOString().slice(0, 10);
    grid.appendChild(el('div', { class: `cal-cell ${isToday ? 'today' : ''}`, title: birthdays.map((b) => b['Нэр']).join(', ') }, [
      el('div', { class: 'cal-day-num' }, String(d)),
      dayTasks.length ? el('div', { class: 'cal-dot task-dot' }, String(dayTasks.length)) : null,
      hasJournal ? el('div', { class: 'cal-dot journal-dot' }, '📝') : null,
      birthdays.length ? el('div', { class: 'cal-dot birthday-dot' }, '🎂') : null,
    ]));
  }
  container.appendChild(grid);

  const todayKey = new Date().toISOString().slice(0, 10);
  const upcoming = Object.keys(tasksByDate).filter((k) => k >= todayKey).sort();
  container.appendChild(sectionTitle('Ойрын хугацаа'));
  if (upcoming.length === 0) {
    container.appendChild(emptyState('Ойрын даалгавар алга'));
  } else {
    upcoming.slice(0, 10).forEach((key) => {
      container.appendChild(el('div', { class: 'upcoming-row' }, [
        el('div', { class: 'upcoming-date' }, key),
        el('div', {}, tasksByDate[key].map((t) => t['Нэр']).join(', ')),
      ]));
    });
  }
}
