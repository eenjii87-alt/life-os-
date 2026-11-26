import { store, addRow, updateRow, deleteRow, todayISO } from '../store.js';
import { el, statusChip, priorityDot, formatDate, toast, emptyState, sectionTitle, card } from '../ui.js';
import { STATUS } from '../config.js';

const DAY_ORDER = ['Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба', 'Ням'];

function schoolAreaId() {
  const area = (store.data.AREAS || []).find((a) => a['Нэр'] === 'Сургууль');
  return area ? area['AreaID'] : null;
}

function studyWishLabelId() {
  const label = (store.data.LABELS || []).find((l) => l['Нэр'] === 'Судлах хүсэл');
  return label ? label['LabelID'] : null;
}

async function ensureStudyWishLabel() {
  let id = studyWishLabelId();
  if (!id) id = await addRow('LABELS', { 'Нэр': 'Судлах хүсэл' });
  return id;
}

function addScheduleForm() {
  const name = el('input', { class: 'input', placeholder: 'Хичээлийн нэр' });
  const day = el('select', { class: 'input' }, DAY_ORDER.map((d) => el('option', { value: d }, d)));
  const start = el('input', { class: 'input', type: 'time' });
  const end = el('input', { class: 'input', type: 'time' });
  const loc = el('input', { class: 'input', placeholder: 'Байршил (заавал биш)' });
  const btn = el('button', { class: 'btn btn-primary', onclick: async () => {
    if (!name.value.trim()) return;
    await addRow('SCHEDULE', {
      'Хичээлийн нэр': name.value.trim(),
      AreaID: schoolAreaId() || '',
      'Гараг': day.value,
      'Эхлэх цаг': start.value,
      'Дуусах цаг': end.value,
      'Байршил': loc.value,
    });
    name.value = ''; loc.value = '';
    toast('Хуваарьт нэмлээ');
    location.hash = '#school';
  } }, '+ Нэмэх');
  return el('div', { class: 'add-form' }, [name, day, start, end, loc, btn]);
}

function scheduleSection() {
  const areaId = schoolAreaId();
  const rows = (store.data.SCHEDULE || []).filter((s) => !areaId || String(s['AreaID']) === String(areaId));
  const byDay = {};
  rows.forEach((r) => {
    (byDay[r['Гараг']] = byDay[r['Гараг']] || []).push(r);
  });
  const days = DAY_ORDER.filter((d) => byDay[d]);
  if (days.length === 0) return emptyState('Хуваарь алга байна');
  return el('div', { class: 'schedule-grid' }, days.map((day) =>
    el('div', { class: 'schedule-day' }, [
      el('div', { class: 'schedule-day-name' }, day),
      ...byDay[day].map((s) => el('div', { class: 'schedule-item' }, [
        el('div', { class: 'schedule-time' }, `${(s['Эхлэх цаг'] || '').slice(0, 5)}–${(s['Дуусах цаг'] || '').slice(0, 5)}`),
        el('div', { class: 'schedule-name' }, s['Хичээлийн нэр']),
        s['Байршил'] ? el('div', { class: 'schedule-loc' }, s['Байршил']) : null,
        el('button', { class: 'btn btn-sm btn-failed', onclick: async () => {
          if (!window.confirm('Устгах уу?')) return;
          await deleteRow('SCHEDULE', s['ScheduleID']);
          toast('Устгалаа');
        } }, '✕'),
      ])),
    ])
  ));
}

function addStudyWishForm() {
  const input = el('input', { class: 'input', placeholder: 'Судлах хүсэлтэй зүйл (ж: "React сурах")' });
  const btn = el('button', { class: 'btn btn-primary', onclick: async () => {
    if (!input.value.trim()) return;
    const labelId = await ensureStudyWishLabel();
    await addRow('TASKS', {
      'Нэр': input.value.trim(),
      ProjectID: '',
      PriorityID: '',
      LabelID: labelId,
      DependsOnTaskID: '',
      'Статус': STATUS.TODO,
      'Эхлэх огноо': '',
      'Due date': '',
      'Үүсгэсэн огноо': todayISO(),
      'Дууссан огноо': '',
      'Сүүлд хөдөлсөн огноо': todayISO(),
      WishID: '',
    });
    input.value = '';
    toast('Судлах хүсэлдээ нэмлээ');
    location.hash = '#school';
  } }, '+ Нэмэх');
  return el('div', { class: 'add-form' }, [input, btn]);
}

async function scheduleStudyWish(task) {
  const date = window.prompt('Хэзээ судлах вэ? (ЖЖЖЖ-СС-ӨӨ)', todayISO());
  if (!date) return;
  await updateRow('TASKS', task['TaskID'], { 'Эхлэх огноо': date, 'Due date': date });
  toast('Товлолоо — "Хийх зүйлс" дотор харагдана');
}

function studyWishList() {
  const labelId = studyWishLabelId();
  const items = (store.data.TASKS || []).filter((t) => labelId && String(t['LabelID']) === String(labelId) && !t['Due date']);
  if (items.length === 0) return emptyState('Судлах хүсэл алга байна');
  return el('div', { class: 'wish-list' }, items.map((t) =>
    el('div', { class: 'wish-row' }, [
      el('div', { class: 'wish-text' }, t['Нэр']),
      el('div', {}, [
        el('button', { class: 'btn btn-sm', onclick: () => scheduleStudyWish(t) }, 'Товлох'),
        el('button', { class: 'btn btn-sm btn-failed', onclick: async () => {
          if (!window.confirm('Устгах уу?')) return;
          await deleteRow('TASKS', t['TaskID']);
          toast('Устгалаа');
        } }, '✕'),
      ]),
    ])
  ));
}

function assignmentsSection() {
  const areaId = schoolAreaId();
  const projectIds = new Set((store.data.PROJECTS || []).filter((p) => !areaId || String(p['AreaID']) === String(areaId)).map((p) => p['ProjectID']));
  const tasks = (store.data.TASKS || []).filter((t) => projectIds.has(t['ProjectID']));
  if (tasks.length === 0) return emptyState('Даалгавар алга байна');
  return el('div', { class: 'task-list' }, tasks.map((t) => el('div', { class: 'task-row' }, [
    el('div', { class: 'task-main' }, [
      el('div', { class: 'task-name' }, t['Нэр']),
      el('div', { class: 'task-meta' }, [priorityDot(t['PriorityID']), statusChip(t['Статус']), el('span', { class: 'due' }, `Due: ${formatDate(t['Due date'])}`)]),
    ]),
  ])));
}

export function render(container) {
  const { data } = store;
  if (!data) return;

  container.appendChild(sectionTitle('Хичээлийн хуваарь'));
  container.appendChild(addScheduleForm());
  container.appendChild(scheduleSection());

  container.appendChild(sectionTitle('Судлах хүсэл'));
  container.appendChild(addStudyWishForm());
  container.appendChild(studyWishList());

  container.appendChild(sectionTitle('Даалгавар / Төсөл'));
  container.appendChild(assignmentsSection());
}
