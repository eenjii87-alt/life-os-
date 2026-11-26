import { API_URL } from './config.js';

// Бүгд GET-ээр явна (Apps Script-ийн POST→redirect→GET болж хувирдаг
// алдартай асуудлаас зайлсхийхийн тулд). write үйлдлийн дата нь
// query параметр дотор encodeURIComponent(JSON.stringify(...)) хэлбэрээр явна.

async function get(params) {
  const url = `${API_URL}?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Сервертэй холбогдож чадсангүй');
  const json = await res.json();
  if (json && json.error) throw new Error(json.error);
  return json;
}

export function apiGetAll() {
  return get('action=getAll');
}

export function apiGetSheet(sheet) {
  return get(`sheet=${encodeURIComponent(sheet)}`);
}

export function apiAdd(sheet, data) {
  return get(`action=add&sheet=${encodeURIComponent(sheet)}&data=${encodeURIComponent(JSON.stringify(data))}`);
}

export function apiUpdate(sheet, id, data) {
  return get(`action=update&sheet=${encodeURIComponent(sheet)}&id=${encodeURIComponent(id)}&data=${encodeURIComponent(JSON.stringify(data))}`);
}

export function apiDelete(sheet, id) {
  return get(`action=delete&sheet=${encodeURIComponent(sheet)}&id=${encodeURIComponent(id)}`);
}
