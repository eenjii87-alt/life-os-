import { priorityInfo } from './store.js';

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (v !== undefined && v !== null) node.setAttribute(k, v);
  }
  (Array.isArray(children) ? children : [children]).forEach((c) => {
    if (c === null || c === undefined) return;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return node;
}

export function statusChip(status) {
  const map = {
    'Хийгдээгүй': 'chip chip-todo',
    'Хийгдэж буй': 'chip chip-doing',
    'Дууссан': 'chip chip-done',
    'Амжилтгүй': 'chip chip-failed',
  };
  return el('span', { class: map[status] || 'chip' }, status || '—');
}

export function priorityDot(priorityId) {
  const p = priorityInfo(priorityId);
  const dot = el('span', { class: 'dot', style: `background:${p ? p['Өнгө'] : '#ccc'}` });
  return el('span', { class: 'priority-tag', title: p ? p['Нэр'] : '' }, [dot, p ? p['Нэр'] : '—']);
}

export function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso).slice(0, 10);
  return d.toLocaleDateString('mn-MN', { month: 'short', day: 'numeric' });
}

export function toast(msg, type = 'ok') {
  const t = el('div', { class: `toast toast-${type}` }, msg);
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 300);
  }, 2600);
}

export function emptyState(text) {
  return el('div', { class: 'empty-state' }, text);
}

export function card(children, attrs = {}) {
  return el('div', { class: 'card', ...attrs }, children);
}

export function sectionTitle(text, extra) {
  return el('div', { class: 'section-title' }, [el('h2', {}, text), extra || null]);
}
