// Invoices Module
import { API } from '../api.js';
import { Modal } from '../modal.js';
import { Toast } from '../toast.js';

class Invoices {
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
      draft: 'Draft',
      sent: 'Sent',
      paid: 'Paid',
      overdue: 'Overdue'
    };
    return statusMap[status] || status;
  }

  static formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
  }

  static async markAsPaid(invoiceId) {
    try {
      await API.invoices.updateStatus(invoiceId, 'paid');
      this.render();
      Toast.show('Invoice marked as paid');
    } catch (error) {
      Toast.show(error.error || 'Failed to update invoice', 'error');
    }
  }

  static renderInvoiceRow(invoice) {
    const escapeHtml = this.escapeHtml;
    const formatStatus = this.formatStatus;
    const formatDate = this.formatDate;
    
    // Create a clean object for the edit form - use JSON string with proper encoding
    const editData = {
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      client_id: invoice.client_id,
      project_id: invoice.project_id || '',
      items: typeof invoice.items === 'string' ? JSON.parse(invoice.items || '[]') : (invoice.items || []),
      subtotal: invoice.subtotal || 0,
      tax_rate: invoice.tax_rate || 0,
      tax_amount: invoice.tax_amount || 0,
      total: invoice.total || 0,
      status: invoice.status || 'draft',
      due_date: invoice.due_date || '',
      notes: invoice.notes || ''
    };
    const editDataStr = encodeURIComponent(JSON.stringify(editData));
    
    // Create preview data
    const previewData = { ...invoice };
    if (typeof previewData.items === 'string') {
      try { previewData.items = JSON.parse(previewData.items); } catch(e) {}
    }
    const previewDataStr = encodeURIComponent(JSON.stringify(previewData));
    
    return `
      <tr>
        <td><strong>${escapeHtml(invoice.invoice_number)}</strong></td>
        <td>${escapeHtml(invoice.client_name || 'Unknown')}</td>
        <td>$${(invoice.total || 0).toLocaleString()}</td>
        <td><span class="status-badge status-${invoice.status}">${formatStatus(invoice.status)}</span></td>
        <td>${invoice.due_date ? formatDate(invoice.due_date) : '-'}</td>
        <td class="actions">
          <button class="btn btn-icon" onclick="Modal.showInvoicePreview(JSON.parse(decodeURIComponent('${previewDataStr}')))" title="View">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          </button>
          <button class="btn btn-icon" onclick="Modal.showInvoiceForm(JSON.parse(decodeURIComponent('${editDataStr}')))" title="Edit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          ${invoice.status === 'draft' || invoice.status === 'sent' ? `
          <button class="btn btn-icon" onclick="Invoices.markAsPaid('${invoice.id}')" title="Mark as Paid">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </button>
          ` : ''}
          <button class="btn btn-icon" onclick="Modal.showDeleteConfirm('Delete Invoice', 'Are you sure you want to delete invoice ${escapeHtml(invoice.invoice_number)}?', async () => { await API.invoices.delete('${invoice.id}'); Invoices.render(); Toast.show('Invoice deleted'); })" title="Delete">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </td>
      </tr>
    `;
  }

  static async render() {
    const addBtn = document.getElementById('add-invoice-btn');
    addBtn.onclick = () => Modal.showInvoiceForm();

    try {
      const invoicesData = await API.invoices.getAll();
      const invoices = invoicesData.data || [];
      const tbody = document.getElementById('invoices-table-body');
      const emptyState = document.getElementById('invoices-empty');

      if (invoices.length === 0) {
        tbody.innerHTML = '';
        emptyState.classList.remove('hidden');
      } else {
        emptyState.classList.add('hidden');
        tbody.innerHTML = invoices.map(inv => this.renderInvoiceRow.call(this, inv)).join('');
      }
    } catch (error) {
      Toast.show(error.error || 'Failed to load invoices', 'error');
    }
  }
}

export { Invoices };
