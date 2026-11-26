import { store } from './store.js';

// Апп 2 том хэсэгтэй: "Сургууль" (AreaID=1) ба "Хувийн" (Ажил + Хувийн
// Area-уудыг нэгтгэсэн). Сонгосон контекст localStorage-д хадгалагдана.
const KEY = 'lifeos_context';

export function getContext() {
  return localStorage.getItem(KEY) || 'all';
}

export function setContext(ctx) {
  localStorage.setItem(KEY, ctx);
}

function schoolAreaIds() {
  return (store.data?.AREAS || []).filter((a) => a['Нэр'] === 'Сургууль').map((a) => String(a['AreaID']));
}

export function contextAreaIds(ctx) {
  const all = (store.data?.AREAS || []).map((a) => String(a['AreaID']));
  const school = schoolAreaIds();
  if (ctx === 'school') return school;
  if (ctx === 'personal') return all.filter((id) => !school.includes(id));
  return all;
}

export function projectInContext(project, ctx) {
  if (ctx === 'all') return true;
  return contextAreaIds(ctx).includes(String(project?.['AreaID']));
}

export function taskInContext(task, ctx) {
  if (ctx === 'all') return true;
  const project = (store.data?.PROJECTS || []).find((p) => String(p['ProjectID']) === String(task['ProjectID']));
  if (!project) return ctx === 'personal'; // төсөлгүй даалгаврыг хувийн гэж үзье
  return projectInContext(project, ctx);
}

export const CONTEXT_LABEL = { all: 'Бүгд', school: 'Сургууль', personal: 'Хувийн' };
