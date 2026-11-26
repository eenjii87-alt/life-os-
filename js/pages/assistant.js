import { store, todayISO } from '../store.js';
import { el, card, sectionTitle, emptyState } from '../ui.js';
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
  // энгийн streak тоолуур: тасралтгүй өдрүүдийн тоо (хамгийн сүүлийн өдрөөс ухарч)
  const dates = new Set(habitLogs.map((l) => String(l['Огноо']).slice(0, 10)));
  let streak = 0;
  let d = new Date();
  while (dates.has(d.toISOString().slice(0, 10))) {
    streak += 1;
    d.setDate(d.getDate() - 1);
  }
  return streak;
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

  container.appendChild(sectionTitle('Хэвшлүүд (Habits)'));
  const habits = data.HABITS || [];
  if (habits.length === 0) {
    container.appendChild(emptyState('Хэвшил алга байна'));
  } else {
    const list = el('div', { class: 'habit-list' }, habits.map((h) => {
      const streak = habitStreak(h['HabitID'], data.HABIT_LOG || []);
      return el('div', { class: 'habit-row' }, [
        el('div', {}, h['Нэр']),
        el('div', { class: 'streak' }, `🔥 ${streak} өдөр`),
      ]);
    }));
    container.appendChild(list);
  }
}
