import { API_URL } from './config.js';

// GET: бүх 12 Sheet-ийн датаг нэг дор авна
export async function apiGetAll() {
  const res = await fetch(`${API_URL}?action=getAll`);
  if (!res.ok) throw new Error('Сервертэй холбогдож чадсангүй');
  return res.json();
}

// GET: нэг Sheet-ийн дата
export async function apiGetSheet(sheet) {
  const res = await fetch(`${API_URL}?sheet=${encodeURIComponent(sheet)}`);
  if (!res.ok) throw new Error('Сервертэй холбогдож чадсангүй');
  return res.json();
}

// POST нь CORS preflight-аас зайлсхийхийн тулд text/plain-ээр илгээнэ
// (Google Apps Script OPTIONS хүсэлтийг боловсруулдаггүй тул)
async function post(body) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json;
}

export function apiAdd(sheet, data) {
  return post({ sheet, action: 'add', data });
}

export function apiUpdate(sheet, id, data) {
  return post({ sheet, action: 'update', id, data });
}

export function apiDelete(sheet, id) {
  return post({ sheet, action: 'delete', id });
}
