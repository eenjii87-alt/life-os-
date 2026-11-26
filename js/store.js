import { apiGetAll, apiAdd, apiUpdate, apiDelete } from './api.js';

export const store = {
  data: null,
  loading: false,
  error: null,
  syncing: false, // background sync indicator (doesn't block UI)
  listeners: [],
};

export function subscribe(fn) {
  store.listeners.push(fn);
  return () => {
    store.listeners = store.listeners.filter((f) => f !== fn);
  };
}

function notify() {
  store.listeners.forEach((fn) => fn(store));
}

export async function refresh() {
  store.loading = true;
  store.error = null;
  notify();
  try {
    store.data = await apiGetAll();
  } catch (e) {
    store.error = e.message || 'Алдаа гарлаа';
  } finally {
    store.loading = false;
    notify();
  }
}

// Фоновдоо (хэрэглэгчийг хүлээлгэхгүйгээр) дахин ачааллаж, формулаар
// тооцогддог талбаруудыг (% Дуусгал гэх мэт) шинэчилнэ.
let syncTimer = null;
function scheduleBackgroundSync() {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => {
    store.syncing = true;
    notify();
    try {
      const fresh = await apiGetAll();
      store.data = fresh;
      store.error = null;
    } catch (e) {
      // чимээгүй — хэрэглэгч аль хэдийн local өөрчлөлтөө хараад байгаа
    } finally {
      store.syncing = false;
      notify();
    }
  }, 700);
}

function nextId(sheet, idField) {
  const rows = store.data[sheet] || [];
  const max = rows.reduce((m, r) => {
    const n = parseInt(r[idField], 10);
    return isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return String(max + 1);
}

export const ID_FIELDS = {
  AREAS: 'AreaID',
  WISHES: 'WishID',
  GOALS: 'GoalID',
  PROJECTS: 'ProjectID',
  TASKS: 'TaskID',
  PRIORITY: 'PriorityID',
  LABELS: 'LabelID',
  HABITS: 'HabitID',
  HABIT_LOG: 'LogID',
  TASK_LOG: 'LogID',
  SCHEDULE: 'ScheduleID',
  JOURNAL: 'JournalID',
};

// Optimistic: шууд дэлгэцэнд харуулаад, дараа нь сервер рүү илгээнэ.
// Алдаа гарвал буцааж арилгана.
export async function addRow(sheet, data) {
  const idField = ID_FIELDS[sheet];
  const id = nextId(sheet, idField);
  const fullData = { [idField]: id, ...data };

  store.data[sheet] = [...(store.data[sheet] || []), fullData];
  notify();

  try {
    await apiAdd(sheet, fullData);
    scheduleBackgroundSync();
    return id;
  } catch (e) {
    store.data[sheet] = store.data[sheet].filter((r) => r[idField] !== id);
    notify();
    throw e;
  }
}

export async function updateRow(sheet, id, data) {
  const idField = ID_FIELDS[sheet];
  const rows = store.data[sheet] || [];
  const idx = rows.findIndex((r) => String(r[idField]) === String(id));
  const prev = idx !== -1 ? { ...rows[idx] } : null;

  if (idx !== -1) {
    rows[idx] = { ...rows[idx], ...data };
    store.data[sheet] = [...rows];
    notify();
  }

  try {
    await apiUpdate(sheet, id, data);
    scheduleBackgroundSync();
  } catch (e) {
    if (prev && idx !== -1) {
      const rows2 = [...store.data[sheet]];
      rows2[idx] = prev;
      store.data[sheet] = rows2;
      notify();
    }
    throw e;
  }
}

export async function deleteRow(sheet, id) {
  const idField = ID_FIELDS[sheet];
  const rows = store.data[sheet] || [];
  const removed = rows.find((r) => String(r[idField]) === String(id));
  store.data[sheet] = rows.filter((r) => String(r[idField]) !== String(id));
  notify();

  try {
    await apiDelete(sheet, id);
    scheduleBackgroundSync();
  } catch (e) {
    if (removed) {
      store.data[sheet] = [...store.data[sheet], removed];
      notify();
    }
    throw e;
  }
}

export function byId(sheet, idField, id) {
  return (store.data?.[sheet] || []).find((r) => String(r[idField]) === String(id));
}

export function areaName(areaId) {
  const a = byId('AREAS', 'AreaID', areaId);
  return a ? a['Нэр'] : '';
}

export function areaColor(areaId) {
  const a = byId('AREAS', 'AreaID', areaId);
  return a ? a['Өнгө'] : '#C2185B';
}

export function priorityInfo(priorityId) {
  return byId('PRIORITY', 'PriorityID', priorityId);
}

export function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}
