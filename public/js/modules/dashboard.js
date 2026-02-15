// Dashboard Module
import { API } from '../api.js';

class Dashboard {
  static async render() {
    try {
      const [clientStats, projectStats, taskStats, invoiceStats] = await Promise.all([
        API.clients.stats(),
        API.projects.stats(),
        API.tasks.stats(),
        API.invoices.stats()
      ]);

      // Update stats
      document.getElementById('stat-clients').textContent = clientStats.total || 0;
      document.getElementById('stat-projects').textContent = projectStats.active || 0;
      document.getElementById('stat-tasks').textContent = (taskStats.todo || 0) + (taskStats.inProgress || 0);
      document.getElementById('stat-revenue').textContent = '$' + (invoiceStats.paidAmount || 0).toLocaleString();

      // Load recent activity
      this.loadRecentActivity();
    } catch (error) {
      console.error('Dashboard render error:', error);
    }
  }

  static async loadRecentActivity() {
    try {
      const [clientsData, projectsData, tasksData] = await Promise.all([
        API.clients.getAll(),
        API.projects.getAll(),
        API.tasks.getAll()
      ]);

      const recentClients = clientsData.data || [];
      const recentProjects = projectsData.data || [];
      const recentTasks = tasksData.data || [];

      const activities = [];

      // Add recent clients
      recentClients.slice(0, 3).forEach(client => {
        activities.push({
          type: 'client',
          text: `Added client "${client.name}"`,
          time: this.formatTime(client.created_at)
        });
      });

      // Add recent projects
      recentProjects.slice(0, 3).forEach(project => {
        activities.push({
          type: 'project',
          text: `Started project "${project.name}"`,
          time: this.formatTime(project.created_at)
        });
      });

      // Add recent tasks
      recentTasks.slice(0, 3).forEach(task => {
        activities.push({
          type: 'task',
          text: `Created task "${task.title}"`,
          time: this.formatTime(task.created_at)
        });
      });

      // Sort by time and take top 5
      activities.sort((a, b) => new Date(b.time) - new Date(a.time));
      const recentActivities = activities.slice(0, 5);

      const container = document.getElementById('recent-activity');
      if (recentActivities.length === 0) {
        container.innerHTML = '<p class="empty-state">No recent activity</p>';
      } else {
        container.innerHTML = recentActivities.map(activity => `
          <div class="activity-item">
            <div class="activity-icon" style="background: ${this.getActivityColor(activity.type)}; color: ${this.getActivityIconColor(activity.type)};">
              ${this.getActivityIcon(activity.type)}
            </div>
            <div class="activity-content">
              <div class="activity-text">${activity.text}</div>
              <div class="activity-time">${activity.time}</div>
            </div>
          </div>
        `).join('');
      }
    } catch (error) {
      console.error('Load activity error:', error);
    }
  }

  static formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
    if (diff < 604800000) return Math.floor(diff / 86400000) + 'd ago';
    return date.toLocaleDateString();
  }

  static getActivityColor(type) {
    const colors = {
      client: '#dbeafe',
      project: '#fef3c7',
      task: '#d1fae5',
      invoice: '#f3e8ff'
    };
    return colors[type] || '#f1f5f9';
  }

  static getActivityIconColor(type) {
    const colors = {
      client: '#2563eb',
      project: '#d97706',
      task: '#059669',
      invoice: '#9333ea'
    };
    return colors[type] || '#64748b';
  }

  static getActivityIcon(type) {
    const icons = {
      client: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>',
      project: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>',
      task: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>',
      invoice: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>'
    };
    return icons[type] || icons.task;
  }
}

export { Dashboard };
