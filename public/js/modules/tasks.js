// Tasks Module
import { API } from '../api.js';
import { Modal } from '../modal.js';
import { Toast } from '../toast.js';

class Tasks {
  static escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  static escapeJs(text) {
    if (!text) return '';
    return String(text)
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r');
  }

  static renderTaskCard(task) {
    const escapeHtml = this.escapeHtml;
    const escapeJs = this.escapeJs;
    const escapedTitle = escapeHtml(escapeJs(task.title));
    const escapedTaskId = task.id;
    
    return `
      <div class="task-card" draggable="true" data-id="${task.id}">
        <div class="task-title">${escapeHtml(task.title)}</div>
        <div class="task-meta">
          <span class="task-project">
            ${task.project_name ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg> ${escapeHtml(task.project_name)}` : 'No project'}
          </span>
          <span class="priority-badge priority-${task.priority}">${task.priority}</span>
        </div>
        <div class="actions" style="margin-top: 0.75rem; display: flex; gap: 0.5rem;">
          <button class="btn btn-icon btn-sm" onclick="Modal.showTaskForm({id: '${task.id}', title: '${escapeJs(task.title)}', project_id: '${task.project_id || ''}', description: '${escapeJs(task.description || '')}', status: '${task.status}', priority: '${task.priority}', due_date: '${task.due_date || ''}'})" title="Edit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button class="btn btn-icon btn-sm" onclick="Modal.showDeleteConfirm('Delete Task', 'Are you sure you want to delete ${escapedTitle}?', async () => { await API.tasks.delete('${escapedTaskId}'); Tasks.render(); Toast.show('Task deleted'); })" title="Delete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </div>
    `;
  }

  static renderTaskList(containerId, tasks) {
    const container = document.getElementById(containerId);
    container.innerHTML = tasks.map(t => this.renderTaskCard.call(this, t)).join('');
  }

  static setupDragAndDrop() {
    const taskCards = document.querySelectorAll('.task-card');
    const taskLists = document.querySelectorAll('.task-list');

    taskCards.forEach(card => {
      card.addEventListener('dragstart', (e) => {
        card.classList.add('dragging');
        e.dataTransfer.setData('text/plain', card.dataset.id);
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
      });
    });

    taskLists.forEach(list => {
      list.addEventListener('dragover', (e) => {
        e.preventDefault();
        const dragging = document.querySelector('.dragging');
        if (dragging) {
          const afterElement = this.getDragAfterElement(list, e.clientY);
          if (afterElement) {
            list.insertBefore(dragging, afterElement);
          } else {
            list.appendChild(dragging);
          }
        }
      });

      list.addEventListener('drop', async (e) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('text/plain');
        const newStatus = list.dataset.status;

        try {
          await API.tasks.updateStatus(taskId, newStatus);
          Tasks.render();
          Toast.show('Task status updated');
        } catch (error) {
          Toast.show(error.error || 'Failed to update task', 'error');
        }
      });
    });
  }

  static getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.task-card:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;

      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  static async render() {
    const addBtn = document.getElementById('add-task-btn');
    addBtn.onclick = () => Modal.showTaskForm();

    try {
      const tasksData = await API.tasks.getAll();
      const tasks = tasksData.data || [];

      const todoTasks = tasks.filter(t => t.status === 'todo');
      const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
      const doneTasks = tasks.filter(t => t.status === 'done');

      document.getElementById('todo-count').textContent = todoTasks.length;
      document.getElementById('inprogress-count').textContent = inProgressTasks.length;
      document.getElementById('done-count').textContent = doneTasks.length;

      this.renderTaskList('tasks-todo', todoTasks);
      this.renderTaskList('tasks-in-progress', inProgressTasks);
      this.renderTaskList('tasks-done', doneTasks);

      this.setupDragAndDrop();
    } catch (error) {
      Toast.show(error.error || 'Failed to load tasks', 'error');
    }
  }
}

export { Tasks };
