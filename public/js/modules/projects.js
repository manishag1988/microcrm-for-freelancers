// Projects Module
import { API } from '../api.js';
import { Modal } from '../modal.js';
import { Toast } from '../toast.js';

class Projects {
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

  static formatStatus(status) {
    const statusMap = {
      active: 'Active',
      completed: 'Completed',
      on_hold: 'On Hold',
      cancelled: 'Cancelled'
    };
    return statusMap[status] || status;
  }

  static formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
  }

  static renderProjectCard(project) {
    const escapeHtml = this.escapeHtml;
    const escapeJs = this.escapeJs;
    const formatStatus = this.formatStatus;
    const formatDate = this.formatDate;
    const escapedProjectId = project.id;
    const escapedName = escapeJs(project.name);
    const escapedDescription = escapeJs(project.description || '');
    
    return `
      <div class="project-card">
        <div class="project-header">
          <div>
            <div class="project-title">${escapeHtml(project.name)}</div>
            <div class="project-client">${project.client_name || 'No client'}</div>
          </div>
          <span class="status-badge status-${project.status}">${formatStatus(project.status)}</span>
        </div>
        <div class="project-description">${escapeHtml(project.description || 'No description')}</div>
        <div class="project-meta">
          <span class="project-budget">${project.budget > 0 ? '$' + project.budget.toLocaleString() : 'No budget'}</span>
          <span class="project-deadline">${project.deadline ? formatDate(project.deadline) : 'No deadline'}</span>
        </div>
        ${project.status !== 'completed' ? `
        <div class="project-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${project.progress || 0}%"></div>
          </div>
          <div class="progress-text">${project.progress || 0}% complete</div>
        </div>
        ` : ''}
        <div class="actions" style="display: flex; gap: 0.5rem;">
          <button class="btn btn-secondary btn-sm" onclick="Modal.showProjectForm({id: '${escapedProjectId}', name: '${escapedName}', client_id: '${project.client_id || ''}', description: '${escapedDescription}', budget: ${project.budget}, deadline: '${project.deadline || ''}', status: '${project.status}', progress: ${project.progress || 0}})">Edit</button>
          <button class="btn btn-icon btn-sm" onclick="Modal.showDeleteConfirm('Delete Project', 'Are you sure you want to delete ${escapedName}? All tasks associated with this project will also be deleted.', async () => { await API.projects.delete('${escapedProjectId}'); Projects.render(); Toast.show('Project deleted'); })" title="Delete">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </div>
    `;
  }

  static async render() {
    const addBtn = document.getElementById('add-project-btn');
    addBtn.onclick = () => Modal.showProjectForm();

    try {
      const projectsData = await API.projects.getAll();
      const projects = projectsData.data || [];
      const grid = document.getElementById('projects-grid');
      const emptyState = document.getElementById('projects-empty');

      if (projects.length === 0) {
        grid.innerHTML = '';
        emptyState.classList.remove('hidden');
      } else {
        emptyState.classList.add('hidden');
        grid.innerHTML = projects.map(p => this.renderProjectCard.call(this, p)).join('');
      }
    } catch (error) {
      Toast.show(error.error || 'Failed to load projects', 'error');
    }
  }
}

export { Projects };
