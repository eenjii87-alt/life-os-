import { store, updateRow, addRow, todayISO } from './store.js';
import { openModal, toast } from './ui.js';
import { STATUS } from './config.js';

// Даалгаврын төлөв солих үед ЯМАР Ч төлөвт (Дууссан/Хийгдэж буй/Амжилтгүй)
// тэмдэглэл бичих боломж олгоно — reflect хийхэд амар байх үүднээс.
export async function setStatus(task, status) {
  const res = await openModal({
    title: `"${task['Нэр']}" — ${status}`,
    fields: [{ key: 'note', label: 'Тэмдэглэл (заавал биш)', type: 'textarea', placeholder: 'Энэ даалгаврын талаар юу бодож байна?' }],
    submitLabel: 'Хадгалах',
  });
  if (res === null) return; // цуцаллаа

  const patch = { 'Статус': status, 'Сүүлд хөдөлсөн огноо': todayISO() };
  if (status === STATUS.DONE) patch['Дууссан огноо'] = todayISO();
  await updateRow('TASKS', task['TaskID'], patch);
  await addRow('TASK_LOG', {
    TaskID: task['TaskID'],
    Огноо: todayISO(),
    'Статус': status,
    Note: res.note || '',
  });
  toast('Шинэчиллээ ✓');
}

export async function reschedule(task) {
  const res = await openModal({
    title: `"${task['Нэр']}" — дахин төлөвлөх`,
    fields: [{ key: 'date', label: 'Шинэ due date', type: 'date', value: task['Due date'] || todayISO() }],
    submitLabel: 'Шилжүүлэх',
  });
  if (res === null || !res.date) return;
  await updateRow('TASKS', task['TaskID'], { 'Статус': STATUS.TODO, 'Due date': res.date });
  toast('Хугацааг шилжүүллээ');
}

export function isLocked(task) {
  const dep = task['DependsOnTaskID'];
  if (!dep) return false;
  const depTask = (store.data.TASKS || []).find((t) => String(t['TaskID']) === String(dep));
  return depTask && depTask['Статус'] !== STATUS.DONE;
}
