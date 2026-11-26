import { store, todayISO, addRow, deleteRow } from '../store.js';
import { el, card, sectionTitle, emptyState, toast } from '../ui.js';
import { STATUS } from '../config.js';

export function mascotMood(data) {
  const tasks = data.TASKS || [];
  const today = todayISO();
  const overdue = tasks.filter((t) => t['Статус'] !== STATUS.DONE && t['Due date'] && String(t['Due date']).slice(0, 10) < today);
  const doneToday = tasks.filter((t) => t['Дууссан огноо'] === today);
  const failedToday = tasks.filter((t) => t['Статус'] === STATUS.FAILED && t['Сүүлд хөдөлсөн огноо'] === today);

  if (overdue.length > 3) return 'overwhelmed';
  if (doneToday.length >= 3) return 'happy';
  if (failedToday.length > 0) return 'caring';
  return 'calm';
}

export function mascotEmoji(mood) {
  return { happy: '✨', calm: '🌸', caring: '🫂', overwhelmed: '😮‍💨' }[mood] || '🌸';
}

function mascotMessage(mood) {
  return {
    happy: 'Өнөөдөр сайн ажиллаж байна! Үргэлжлүүлээрэй 🎉',
    calm: 'Бүх юм тайван байна. Нэг дор хоёрыг л хийцгээе 🌿',
    caring: 'Зарим зүйл амжилтгүй болсон юм байна — зүгээр шүү, маргааш дахин оролдоно биз 💗',
    overwhelmed: 'Хуримтлагдсан даалгавар их байна. Хамгийн чухлаасаа эхлэцгээе, яараад байх хэрэггүй 🤍',
  }[mood] || '';
}

function habitStreak(habitId, logs) {
  const habitLogs = logs.filter((l) => String(l['HabitID']) === String(habitId) && String(l['Хийсэн эсэх']).toLowerCase() === 'true');
  const dates = new Set(habitLogs.map((l) => String(l['Огноо']).slice(0, 10)));
  let streak = 0;
  let d = new Date();
  while (dates.has(d.toISOString().slice(0, 10))) {
    streak += 1;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function doneToday(habitId, logs) {
  return logs.some((l) => String(l['HabitID']) === String(habitId) && l['Огноо'] === todayISO() && String(l['Хийсэн эсэх']).toLowerCase() === 'true');
}

async function checkInHabit(habit) {
  await addRow('HABIT_LOG', { HabitID: habit['HabitID'], 'Огноо': todayISO(), 'Хийсэн эсэх': true });
  toast('Бэлгэдлээ ✓');
}

const MOODS = [
  { key: '1', emoji: '😞', label: 'Муу' },
  { key: '2', emoji: '😕', label: 'Муухан' },
  { key: '3', emoji: '😐', label: 'Дунд' },
  { key: '4', emoji: '🙂', label: 'Сайн' },
  { key: '5', emoji: '😄', label: 'Маш сайн' },
];

function todayEmotionLogs() {
  return (store.data.EMOTION_LOG || []).filter((l) => l['Огноо'] === todayISO());
}

async function logEmotion(moodKey) {
  await addRow('EMOTION_LOG', { 'Огноо': todayISO(), 'Мэдрэмж': moodKey, 'Тэмдэглэл': '' });
  toast('Мэдрэмжээ тэмдэглэлээ');
}

function emotionTracker() {
  const todays = todayEmotionLogs();
  const last7 = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const logs = (store.data.EMOTION_LOG || []).filter((l) => l['Огноо'] === key);
    const last = logs[logs.length - 1];
    return { key, mood: last ? MOODS.find((m) => m.key === String(last['Мэдрэмж']))?.emoji : '·' };
  }).reverse();

  return card([
    el('h3', {}, 'Өнөөдөр ямар санагдаж байна?'),
    el('div', { class: 'emotion-row' }, MOODS.map((m) => el('button', {
      class: 'emotion-btn',
      title: m.label,
      onclick: () => logEmotion(m.key),
    }, m.emoji))),
    todays.length ? el('div', { class: 'muted' }, `Өнөөдөр ${todays.length} удаа тэмдэглэсэн`) : null,
    el('div', { class: 'emotion-trend' }, last7.map((d) => el('span', { class: 'emotion-trend-day', title: d.key }, d.mood))),
  ]);
}

function addHabitForm() {
  const name = el('input', { class: 'input', placeholder: 'Шинэ хэвшлийн нэр' });
  const freq = el('select', { class: 'input' }, ['Өдөр бүр', 'Долоо хоногт', 'Сард'].map((f) => el('option', { value: f }, f)));
  const areaSelect = el('select', { class: 'input' }, [
    el('option', { value: '' }, '— Хэсэггүй —'),
    ...(store.data.AREAS || []).map((a) => el('option', { value: a['AreaID'] }, a['Нэр'])),
  ]);
  const btn = el('button', { class: 'btn btn-primary', onclick: async () => {
    if (!name.value.trim()) return;
    await addRow('HABITS', { 'Нэр': name.value.trim(), AreaID: areaSelect.value, 'Давтамж': freq.value });
    name.value = '';
    toast('Хэвшил нэмлээ');
  } }, '+ Нэмэх');
  return el('div', { class: 'add-form' }, [name, freq, areaSelect, btn]);
}

export function render(container) {
  const { data } = store;
  if (!data) return;
  const mood = mascotMood(data);

  container.appendChild(
    card([
      el('div', { class: 'mascot-big' }, mascotEmoji(mood)),
      el('div', { class: 'mascot-msg' }, mascotMessage(mood)),
    ])
  );

  container.appendChild(emotionTracker());

  container.appendChild(sectionTitle('Хэвшлүүд (Habits)'));
  container.appendChild(addHabitForm());
  const habits = data.HABITS || [];
  if (habits.length === 0) {
    container.appendChild(emptyState('Хэвшил алга байна'));
  } else {
    const list = el('div', { class: 'habit-list' }, habits.map((h) => {
      const streak = habitStreak(h['HabitID'], data.HABIT_LOG || []);
      const checked = doneToday(h['HabitID'], data.HABIT_LOG || []);
      return el('div', { class: 'habit-row' }, [
        el('div', {}, h['Нэр']),
        el('div', { class: 'streak' }, `🔥 ${streak} өдөр`),
        el('button', { class: `btn btn-sm ${checked ? 'btn-done' : ''}`, disabled: checked, onclick: () => checkInHabit(h) }, checked ? '✓ Хийсэн' : 'Өнөөдөр хийлээ'),
        el('button', { class: 'btn btn-sm btn-failed', onclick: async () => {
          if (!window.confirm('Устгах уу?')) return;
          await deleteRow('HABITS', h['HabitID']);
          toast('Устгалаа');
        } }, '✕'),
      ]);
    }));
    container.appendChild(list);
  }
}
