import { apiGetAll, apiAdd, apiUpdate, apiDelete } from './api.js';

export const store = {
  data: null, // { AREAS:[], WISHES:[], GOALS:[], PROJECTS:[], TASKS:[], PRIORITY:[], LABELS:[], HABITS:[], HABIT_LOG:[], TASK_LOG:[], SCHEDULE:[], JOURNAL:[] }
  loading: false,
  error: null,
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

export async function addRow(sheet, data) {
  const idField = ID_FIELDS[sheet];
  const id = nextId(sheet, idField);
  const fullData = { [idField]: id, ...data };
  await apiAdd(sheet, fullData);
  await refresh();
  return id;
}

export async function updateRow(sheet, id, data) {
  await apiUpdate(sheet, id, data);
  await refresh();
}

export async function deleteRow(sheet, id) {
  await apiDelete(sheet, id);
  await refresh();
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
