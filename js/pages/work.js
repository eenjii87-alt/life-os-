import { store } from '../store.js';
import { el, statusChip, priorityDot, formatDate, emptyState, sectionTitle } from '../ui.js';

function workAreaId() {
  const area = (store.data.AREAS || []).find((a) => a['Нэр'] === 'Ажил');
  return area ? area['AreaID'] : null;
}

export function render(container) {
  const { data } = store;
  if (!data) return;
  const areaId = workAreaId();

  const projects = (data.PROJECTS || []).filter((p) => !areaId || String(p['AreaID']) === String(areaId));
  container.appendChild(sectionTitle('Ажлын төслүүд'));
  if (projects.length === 0) {
    container.appendChild(emptyState('Ажлын төсөл алга байна — "Зорилго ба төсөл" хуудаснаас нэмнэ үү'));
  } else {
    projects.forEach((p) => {
      const pct = Math.round((parseFloat(p['% Дуусгал']) || 0) * 100);
      container.appendChild(el('div', { class: 'project-card' }, [
        el('div', { class: 'project-head' }, [el('span', { class: 'project-name' }, p['Нэр'])]),
        el('div', { class: 'progress' }, [el('div', { class: 'progress-fill', style: `width:${pct}%` }), el('span', { class: 'progress-label' }, `${pct}%`)]),
      ]));
    });
  }

  const projectIds = new Set(projects.map((p) => p['ProjectID']));
  const tasks = (data.TASKS || []).filter((t) => projectIds.has(t['ProjectID']));
  container.appendChild(sectionTitle('Ажлын даалгавар'));
  if (tasks.length === 0) {
    container.appendChild(emptyState('Даалгавар алга байна'));
  } else {
    container.appendChild(el('div', { class: 'task-list' }, tasks.map((t) => el('div', { class: 'task-row' }, [
      el('div', { class: 'task-main' }, [
        el('div', { class: 'task-name' }, t['Нэр']),
        el('div', { class: 'task-meta' }, [priorityDot(t['PriorityID']), statusChip(t['Статус']), el('span', { class: 'due' }, `Due: ${formatDate(t['Due date'])}`)]),
      ]),
    ]))));
  }
}
