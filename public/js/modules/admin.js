// Admin Module
import { API } from '../api.js';
import { state } from '../app.js';
import { Toast } from '../toast.js';

class Admin {
  static async render() {
    if (state.user.role !== 'admin') {
      document.getElementById('admin-page').innerHTML = '<p class="empty-state">Access denied. Admin privileges required.</p>';
      return;
    }

    try {
      const [stats, users] = await Promise.all([
        API.admin.getStats(),
        API.admin.getUsers()
      ]);

      // Update stats
      document.getElementById('admin-total-users').textContent = stats.totalUsers;
      document.getElementById('admin-total-admins').textContent = stats.adminUsers;
      document.getElementById('admin-db-size').textContent = stats.databaseSizeFormatted;

      // Render users table
      const tbody = document.getElementById('admin-users-table-body');
      tbody.innerHTML = users.map(user => `
        <tr>
          <td><strong>${this.escapeHtml(user.name)}</strong></td>
          <td>${this.escapeHtml(user.email)}</td>
          <td>
            <select class="form-select" style="padding: 0.375rem 0.5rem; font-size: 0.8125rem;" onchange="Admin.updateRole('${user.id}', this.value)" ${user.id === state.user.id ? 'disabled' : ''}>
              <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
              <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
            </select>
          </td>
          <td>${this.formatDate(user.created_at)}</td>
          <td class="actions">
            ${user.id !== state.user.id ? `
            <button class="btn btn-icon" onclick="Admin.deleteUser('${user.id}', '${this.escapeHtml(user.name)}')" title="Delete">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
            ` : ''}
          </td>
        </tr>
      `).join('');
    } catch (error) {
      Toast.show(error.error || 'Failed to load admin data', 'error');
    }
  }

  static async updateRole(userId, role) {
    try {
      await API.admin.updateUserRole(userId, role);
      Toast.show('User role updated');
    } catch (error) {
      Toast.show(error.error || 'Failed to update role', 'error');
      Admin.render();
    }
  }

  static async deleteUser(userId, userName) {
    if (userId === state.user.id) {
      Toast.show('You cannot delete your own account', 'warning');
      return;
    }

    window.Modal.showDeleteConfirm('Delete User', `Are you sure you want to delete ${userName}? This action cannot be undone.`, async () => {
      try {
        await API.admin.deleteUser(userId);
        Admin.render();
        Toast.show('User deleted');
      } catch (error) {
        Toast.show(error.error || 'Failed to delete user', 'error');
      }
    });
  }

  static formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
  }

  static escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Make Admin globally accessible for inline event handlers
window.Admin = Admin;

export { Admin };
