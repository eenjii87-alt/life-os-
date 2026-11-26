import { store, subscribe, refresh } from './store.js';
import { el } from './ui.js';
import * as dashboard from './pages/dashboard.js';
import * as calendar from './pages/calendar.js';
import * as tasks from './pages/tasks.js';
import * as goals from './pages/goals.js';
import * as school from './pages/school.js';
import * as work from './pages/work.js';
import * as assistant from './pages/assistant.js';
import * as journal from './pages/journal.js';
import * as birthdays from './pages/birthdays.js';
import * as settings from './pages/settings.js';

const ROUTES = {
  dashboard: { label: 'Хянах самбар', icon: '🏠', mod: dashboard },
  calendar: { label: 'Календарь', icon: '📅', mod: calendar },
  tasks: { label: 'Хийх зүйлс', icon: '✅', mod: tasks },
  goals: { label: 'Зорилго ба төсөл', icon: '🌟', mod: goals },
  school: { label: 'Сургууль', icon: '🎓', mod: school },
  work: { label: 'Ажил', icon: '💼', mod: work },
  assistant: { label: 'Туслах', icon: '🌸', mod: assistant },
  journal: { label: 'Тэмдэглэл', icon: '📔', mod: journal },
  birthdays: { label: 'Төрсөн өдөр', icon: '🎂', mod: birthdays },
  settings: { label: 'Тохиргоо', icon: '⚙️', mod: settings },
};

function parseHash() {
  const raw = location.hash.replace(/^#/, '') || 'dashboard';
  const [route, query] = raw.split('?');
  return { route: ROUTES[route] ? route : 'dashboard', params: new URLSearchParams(query || '') };
}

function buildNav() {
  const nav = document.getElementById('sidebar-nav');
  nav.innerHTML = '';
  Object.entries(ROUTES).forEach(([key, r]) => {
    const a = el('a', { href: `#${key}`, class: 'nav-item', 'data-route': key }, [
      el('span', { class: 'nav-icon' }, r.icon),
      el('span', { class: 'nav-label' }, r.label),
    ]);
    nav.appendChild(a);
  });
}

function highlightNav(route) {
  document.querySelectorAll('.nav-item').forEach((a) => {
    a.classList.toggle('active', a.dataset.route === route);
  });
}

function renderPage() {
  const { route, params } = parseHash();
  highlightNav(route);
  const container = document.getElementById('app-content');
  container.innerHTML = '';

  if (store.loading && !store.data) {
    container.appendChild(el('div', { class: 'loading' }, 'Ачааллаж байна...'));
    return;
  }
  if (store.error) {
    container.appendChild(el('div', { class: 'error-box' }, [
      el('p', {}, 'Холбогдоход алдаа гарлаа: ' + store.error),
      el('button', { class: 'btn btn-primary', onclick: refresh }, 'Дахин оролдох'),
    ]));
    return;
  }
  if (!store.data) return;

  ROUTES[route].mod.render(container, params);
}

window.addEventListener('hashchange', renderPage);

async function init() {
  buildNav();
  subscribe(renderPage);
  renderPage();
  await refresh();
}

init();
