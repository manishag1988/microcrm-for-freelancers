// Clients Module
import { API } from '../api.js';
import { Modal } from '../modal.js';
import { Toast } from '../toast.js';

class Clients {
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

  static renderClientRow(client) {
    const escapeHtml = this.escapeHtml;
    const escapeJs = this.escapeJs;
    const escapedName = escapeHtml(escapeJs(client.name));
    const escapedClientId = client.id;
    
    return `
      <tr>
        <td><strong>${escapeHtml(client.name)}</strong></td>
        <td>${escapeHtml(client.company || '-')}</td>
        <td>${escapeHtml(client.email || '-')}</td>
        <td>${escapeHtml(client.phone || '-')}</td>
        <td class="actions">
          <button class="btn btn-icon" onclick="Modal.showClientForm({id: '${client.id}', name: '${escapeJs(client.name)}', email: '${escapeJs(client.email || '')}', phone: '${escapeJs(client.phone || '')}', company: '${escapeJs(client.company || '')}', address: '${escapeJs(client.address || '')}', notes: '${escapeJs(client.notes || '')}'})" title="Edit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button class="btn btn-icon" onclick="Modal.showDeleteConfirm('Delete Client', 'Are you sure you want to delete ${escapedName}? This will not delete associated projects.', async () => { await API.clients.delete('${escapedClientId}'); Clients.render(); Toast.show('Client deleted'); })" title="Delete">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </td>
      </tr>
    `;
  }

  static async render() {
    const addBtn = document.getElementById('add-client-btn');
    addBtn.onclick = () => Modal.showClientForm();

    try {
      const clientsData = await API.clients.getAll();
      const clients = clientsData.data || [];
      const tbody = document.getElementById('clients-table-body');
      const emptyState = document.getElementById('clients-empty');

      if (clients.length === 0) {
        tbody.innerHTML = '';
        emptyState.classList.remove('hidden');
      } else {
        emptyState.classList.add('hidden');
        tbody.innerHTML = clients.map(c => this.renderClientRow.call(this, c)).join('');
      }
    } catch (error) {
      Toast.show(error.error || 'Failed to load clients', 'error');
    }
  }
}

export { Clients };
