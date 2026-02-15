// Modal Module
import { API } from './api.js';
import { Clients } from './modules/clients.js';
import { Projects } from './modules/projects.js';
import { Tasks } from './modules/tasks.js';
import { Invoices } from './modules/invoices.js';
import { TimeTracker } from './modules/timetracker.js';
import { Admin } from './modules/admin.js';
import { Toast } from './toast.js';

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

class Modal {
  static elements = null;
  static state = null;

  static init(stateRef, elementsRef) {
    this.state = stateRef;
    this.elements = elementsRef;
  }

  static show(title, content, footer = '') {
    const modalTitle = this.elements?.modalTitle || document.getElementById('modal-title');
    const modalBody = this.elements?.modalBody || document.getElementById('modal-body');
    const modalOverlay = this.elements?.modalOverlay || document.getElementById('modal-overlay');
    if (modalTitle) modalTitle.textContent = title;
    if (modalBody) modalBody.innerHTML = content;
    if (modalOverlay) modalOverlay.classList.remove('hidden');
  }

  static hide() {
    const el = this.elements?.modalOverlay || document.getElementById('modal-overlay');
    if (el) el.classList.add('hidden');
  }

  static showClientForm(client = null) {
    const isEdit = !!client;
    const title = isEdit ? 'Edit Client' : 'Add Client';

    this.show(title, `
      <form id="client-form">
        <div class="form-group">
          <label for="client-name">Name *</label>
          <input type="text" id="client-name" class="form-input" value="${escapeHtml(client?.name || '')}" required>
        </div>
        <div class="form-group">
          <label for="client-email">Email</label>
          <input type="email" id="client-email" class="form-input" value="${escapeHtml(client?.email || '')}">
        </div>
        <div class="form-group">
          <label for="client-phone">Phone</label>
          <input type="tel" id="client-phone" class="form-input" value="${escapeHtml(client?.phone || '')}">
        </div>
        <div class="form-group">
          <label for="client-company">Company</label>
          <input type="text" id="client-company" class="form-input" value="${escapeHtml(client?.company || '')}">
        </div>
        <div class="form-group">
          <label for="client-address">Address</label>
          <textarea id="client-address" class="form-textarea">${escapeHtml(client?.address || '')}</textarea>
        </div>
        <div class="form-group">
          <label for="client-notes">Notes</label>
          <textarea id="client-notes" class="form-textarea">${escapeHtml(client?.notes || '')}</textarea>
        </div>
        <div class="modal-footer" style="padding: 0; border: none; margin-top: 1.5rem;">
          <button type="button" class="btn btn-secondary" onclick="Modal.hide()">Cancel</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Create'} Client</button>
        </div>
      </form>
    `);

    document.getElementById('client-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const data = {
        name: document.getElementById('client-name').value,
        email: document.getElementById('client-email').value,
        phone: document.getElementById('client-phone').value,
        company: document.getElementById('client-company').value,
        address: document.getElementById('client-address').value,
        notes: document.getElementById('client-notes').value
      };

      try {
        if (isEdit) {
          await API.clients.update(client.id, data);
        } else {
          await API.clients.create(data);
        }
        this.hide();
        Clients.render();
      } catch (error) {
        Toast.error(error.error || 'Failed to save client');
      }
    });
  }

  static showProjectForm(project = null, clientId = null) {
    const isEdit = !!project;
    const title = isEdit ? 'Edit Project' : 'New Project';

    API.clients.getAll().then(clientsData => {
      const clients = clientsData.data || [];
      const clientOptions = clients.map(c =>
        `<option value="${escapeHtml(c.id)}" ${project?.client_id === c.id || clientId === c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`
      ).join('');

      this.show(title, `
        <form id="project-form">
          <div class="form-group">
            <label for="project-name">Project Name *</label>
            <input type="text" id="project-name" class="form-input" value="${escapeHtml(project?.name || '')}" required>
          </div>
          <div class="form-group">
            <label for="project-client">Client</label>
            <select id="project-client" class="form-select">
              <option value="">No client</option>
              ${clientOptions}
            </select>
          </div>
          <div class="form-group">
            <label for="project-description">Description</label>
            <textarea id="project-description" class="form-textarea">${escapeHtml(project?.description || '')}</textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="project-budget">Budget ($)</label>
              <input type="number" id="project-budget" class="form-input" value="${project?.budget || 0}" min="0" step="0.01">
            </div>
            <div class="form-group">
              <label for="project-deadline">Deadline</label>
              <input type="date" id="project-deadline" class="form-input" value="${project?.deadline || ''}">
            </div>
          </div>
          <div class="form-group">
            <label for="project-status">Status</label>
            <select id="project-status" class="form-select">
              <option value="active" ${project?.status === 'active' ? 'selected' : ''}>Active</option>
              <option value="completed" ${project?.status === 'completed' ? 'selected' : ''}>Completed</option>
              <option value="on_hold" ${project?.status === 'on_hold' ? 'selected' : ''}>On Hold</option>
              <option value="cancelled" ${project?.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </div>
          ${isEdit ? `
          <div class="form-group">
            <label for="project-progress">Progress (%)</label>
            <input type="range" id="project-progress" class="form-input" value="${project?.progress || 0}" min="0" max="100">
            <span id="progress-value">${project?.progress || 0}%</span>
          </div>
          ` : ''}
          <div class="modal-footer" style="padding: 0; border: none; margin-top: 1.5rem;">
            <button type="button" class="btn btn-secondary" onclick="Modal.hide()">Cancel</button>
            <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Create'} Project</button>
          </div>
        </form>
      `);

      if (isEdit) {
        document.getElementById('project-progress').addEventListener('input', (e) => {
          document.getElementById('progress-value').textContent = e.target.value + '%';
        });
      }

      document.getElementById('project-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const data = {
          name: document.getElementById('project-name').value,
          client_id: document.getElementById('project-client').value || null,
          description: document.getElementById('project-description').value,
          budget: parseFloat(document.getElementById('project-budget').value) || 0,
          deadline: document.getElementById('project-deadline').value || null,
          status: document.getElementById('project-status').value
        };

        if (isEdit) {
          data.progress = parseInt(document.getElementById('project-progress')?.value) || 0;
        }

        try {
          if (isEdit) {
            await API.projects.update(project.id, data);
          } else {
            await API.projects.create(data);
          }
          this.hide();
          Projects.render();
        } catch (error) {
          Toast.error(error.error || 'Failed to save project');
        }
      });
    });
  }

  static showTaskForm(task = null) {
    const isEdit = !!task;
    const title = isEdit ? 'Edit Task' : 'Add Task';

    API.projects.getAll().then(projectsData => {
      const projects = projectsData.data || [];
      const projectOptions = projects.map(p =>
        `<option value="${escapeHtml(p.id)}" ${task?.project_id === p.id ? 'selected' : ''}>${escapeHtml(p.name)}</option>`
      ).join('');

      this.show(title, `
        <form id="task-form">
          <div class="form-group">
            <label for="task-title">Title *</label>
            <input type="text" id="task-title" class="form-input" value="${escapeHtml(task?.title || '')}" required>
          </div>
          <div class="form-group">
            <label for="task-project">Project</label>
            <select id="task-project" class="form-select">
              <option value="">No project</option>
              ${projectOptions}
            </select>
          </div>
          <div class="form-group">
            <label for="task-description">Description</label>
            <textarea id="task-description" class="form-textarea">${escapeHtml(task?.description || '')}</textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="task-status">Status</label>
              <select id="task-status" class="form-select">
                <option value="todo" ${task?.status === 'todo' ? 'selected' : ''}>To Do</option>
                <option value="in_progress" ${task?.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                <option value="done" ${task?.status === 'done' ? 'selected' : ''}>Done</option>
              </select>
            </div>
            <div class="form-group">
              <label for="task-priority">Priority</label>
              <select id="task-priority" class="form-select">
                <option value="low" ${task?.priority === 'low' ? 'selected' : ''}>Low</option>
                <option value="medium" ${task?.priority === 'medium' ? 'selected' : ''}>Medium</option>
                <option value="high" ${task?.priority === 'high' ? 'selected' : ''}>High</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label for="task-due-date">Due Date</label>
            <input type="date" id="task-due-date" class="form-input" value="${task?.due_date || ''}">
          </div>
          <div class="modal-footer" style="padding: 0; border: none; margin-top: 1.5rem;">
            <button type="button" class="btn btn-secondary" onclick="Modal.hide()">Cancel</button>
            <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Create'} Task</button>
          </div>
        </form>
      `);

      document.getElementById('task-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Validate
        if (!validateForm('task-form', 'task')) {
          return;
        }
        
        const data = {
          title: document.getElementById('task-title').value,
          project_id: document.getElementById('task-project').value || null,
          description: document.getElementById('task-description').value,
          status: document.getElementById('task-status').value,
          priority: document.getElementById('task-priority').value,
          due_date: document.getElementById('task-due-date').value || null
        };

        try {
          if (isEdit) {
            await API.tasks.update(task.id, data);
          } else {
            await API.tasks.create(data);
          }
          this.hide();
          Tasks.render();
        } catch (error) {
          Toast.error(error.error || 'Failed to save task');
        }
      });
    });
  }

  static showInvoiceForm(invoice = null) {
    const isEdit = !!invoice;
    const title = isEdit ? 'Edit Invoice' : 'Create Invoice';

    Promise.all([API.clients.getAll(), API.projects.getAll(), API.invoices.getNextNumber()]).then(([clientsData, projectsData, nextNum]) => {
      const clients = clientsData.data || [];
      const projects = projectsData.data || [];
      const clientOptions = clients.map(c =>
        `<option value="${escapeHtml(c.id)}" ${invoice?.client_id === c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`
      ).join('');

      const projectOptions = projects.map(p =>
        `<option value="${escapeHtml(p.id)}" ${invoice?.project_id === p.id ? 'selected' : ''}>${escapeHtml(p.name)}</option>`
      ).join('');

      const items = invoice?.items || [{ description: '', quantity: 1, price: 0 }];
      const itemsHtml = items.map((item, i) => `
        <div class="invoice-item" style="display: grid; grid-template-columns: 1fr 80px 100px 40px; gap: 0.5rem; margin-bottom: 0.5rem; align-items: center;">
          <input type="text" class="form-input item-description" placeholder="Description" value="${escapeHtml(item.description)}" aria-label="Item description">
          <input type="number" class="form-input item-quantity" placeholder="Qty" value="${item.quantity}" min="1" aria-label="Quantity">
          <input type="number" class="form-input item-price" placeholder="Price" value="${item.price}" min="0" step="0.01" aria-label="Unit price">
          <button type="button" class="btn btn-icon remove-item" ${i === 0 ? 'disabled' : ''} aria-label="Remove item">×</button>
        </div>
      `).join('');

      this.show(title, `
        <form id="invoice-form">
          <div class="form-row">
            <div class="form-group">
              <label for="invoice-client">Client *</label>
              <select id="invoice-client" class="form-select" required>
                <option value="">Select client</option>
                ${clientOptions}
              </select>
            </div>
            <div class="form-group">
              <label for="invoice-project">Project</label>
              <select id="invoice-project" class="form-select">
                <option value="">No project</option>
                ${projectOptions}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="invoice-number">Invoice #</label>
              <input type="text" id="invoice-number" class="form-input" value="${escapeHtml(invoice?.invoice_number || nextNum.invoice_number)}" readonly>
            </div>
            <div class="form-group">
              <label for="invoice-due-date">Due Date</label>
              <input type="date" id="invoice-due-date" class="form-input" value="${invoice?.due_date || ''}">
            </div>
          </div>

          <div class="form-group">
            <label>Items</label>
            <div style="display: grid; grid-template-columns: 1fr 80px 100px 40px; gap: 0.5rem; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.875rem; color: var(--text-secondary);">
              <span>Description</span>
              <span>Qty</span>
              <span>Price</span>
              <span></span>
            </div>
            <div id="invoice-items">
              ${itemsHtml}
            </div>
            <button type="button" class="btn btn-secondary btn-sm" id="add-item-btn" style="margin-top: 0.5rem;">+ Add Item</button>
          </div>

          <div class="form-row" style="margin-top: 1rem;">
            <div class="form-group">
              <label for="invoice-tax">Tax Rate (%)</label>
              <input type="number" id="invoice-tax" class="form-input" value="${invoice?.tax_rate || 0}" min="0" step="0.1">
            </div>
          </div>

          <div class="form-group">
            <label for="invoice-notes">Notes</label>
            <textarea id="invoice-notes" class="form-textarea">${escapeHtml(invoice?.notes || '')}</textarea>
          </div>

          ${isEdit ? `
          <div class="form-group">
            <label for="invoice-status">Status</label>
            <select id="invoice-status" class="form-select">
              <option value="draft" ${invoice?.status === 'draft' ? 'selected' : ''}>Draft</option>
              <option value="sent" ${invoice?.status === 'sent' ? 'selected' : ''}>Sent</option>
              <option value="paid" ${invoice?.status === 'paid' ? 'selected' : ''}>Paid</option>
              <option value="overdue" ${invoice?.status === 'overdue' ? 'selected' : ''}>Overdue</option>
            </select>
          </div>
          ` : ''}

          <div class="invoice-totals-preview" style="margin-top: 1rem; padding: 1rem; background: var(--bg-primary); border-radius: var(--border-radius);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <span>Subtotal:</span>
              <span id="invoice-subtotal">$0.00</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <span>Tax:</span>
              <span id="invoice-tax-amount">$0.00</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-weight: 600; font-size: 1.125rem; padding-top: 0.5rem; border-top: 1px solid var(--border-color);">
              <span>Total:</span>
              <span id="invoice-total">$0.00</span>
            </div>
          </div>

          <div class="modal-footer" style="padding: 0; border: none; margin-top: 1.5rem;">
            <button type="button" class="btn btn-secondary" onclick="Modal.hide()">Cancel</button>
            <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Create'} Invoice</button>
          </div>
        </form>
      `);

      // Calculate totals
      const calculateTotals = () => {
        const items = [];
        document.querySelectorAll('.invoice-item').forEach(el => {
          items.push({
            description: el.querySelector('.item-description').value,
            quantity: parseFloat(el.querySelector('.item-quantity').value) || 0,
            price: parseFloat(el.querySelector('.item-price').value) || 0
          });
        });

        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        const taxRate = parseFloat(document.getElementById('invoice-tax').value) || 0;
        const taxAmount = subtotal * taxRate / 100;
        const total = subtotal + taxAmount;

        document.getElementById('invoice-subtotal').textContent = '$' + subtotal.toFixed(2);
        document.getElementById('invoice-tax-amount').textContent = '$' + taxAmount.toFixed(2);
        document.getElementById('invoice-total').textContent = '$' + total.toFixed(2);

        return { items, subtotal, taxRate, taxAmount, total };
      };

      document.querySelectorAll('.invoice-item input').forEach(input => {
        input.addEventListener('input', calculateTotals);
      });

      document.getElementById('invoice-tax').addEventListener('input', calculateTotals);

      document.getElementById('add-item-btn').addEventListener('click', () => {
        const itemsContainer = document.getElementById('invoice-items');
        const newItem = document.createElement('div');
        newItem.className = 'invoice-item';
        newItem.style.cssText = 'display: grid; grid-template-columns: 1fr 80px 100px 40px; gap: 0.5rem; margin-bottom: 0.5rem; align-items: center;';
        newItem.innerHTML = `
          <input type="text" class="form-input item-description" placeholder="Description" aria-label="Item description">
          <input type="number" class="form-input item-quantity" placeholder="Qty" value="1" min="1" aria-label="Quantity">
          <input type="number" class="form-input item-price" placeholder="Price" value="0" min="0" step="0.01" aria-label="Unit price">
          <button type="button" class="btn btn-icon remove-item" aria-label="Remove item">×</button>
        `;
        itemsContainer.appendChild(newItem);
        newItem.querySelector('.remove-item').addEventListener('click', () => {
          newItem.remove();
          calculateTotals();
        });
        newItem.querySelectorAll('input').forEach(input => input.addEventListener('input', calculateTotals));
      });

      document.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', function() {
          if (document.querySelectorAll('.invoice-item').length > 1) {
            this.closest('.invoice-item').remove();
            calculateTotals();
          }
        });
      });

      calculateTotals();

      document.getElementById('invoice-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Validate
        if (!validateForm('invoice-form', 'invoice')) {
          return;
        }
        
        const totals = calculateTotals();
        const data = {
          client_id: document.getElementById('invoice-client').value,
          project_id: document.getElementById('invoice-project').value || null,
          items: totals.items,
          tax_rate: totals.taxRate,
          tax_amount: totals.taxAmount,
          total: totals.total,
          due_date: document.getElementById('invoice-due-date').value || null,
          notes: document.getElementById('invoice-notes').value
        };

        if (isEdit) {
          data.status = document.getElementById('invoice-status').value;
        }

        try {
          if (isEdit) {
            await API.invoices.update(invoice.id, data);
          } else {
            await API.invoices.create(data);
          }
          this.hide();
          Invoices.render();
        } catch (error) {
          Toast.error(error.error || 'Failed to save invoice');
        }
      });
    });
  }

  static showInvoicePreview(invoice) {
    invoice.items = typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items;

    this.show(`Invoice ${escapeHtml(invoice.invoice_number)}`, `
      <div class="invoice-preview">
        <div class="invoice-header">
          <div>
            <div class="invoice-title">INVOICE</div>
            <div class="invoice-number">${escapeHtml(invoice.invoice_number)}</div>
          </div>
          <div style="text-align: right;">
            <div class="status-badge status-${escapeHtml(invoice.status)}">${escapeHtml(invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1))}</div>
          </div>
        </div>

        <div class="invoice-details">
          <div class="invoice-from">
            <h4>From</h4>
            <div class="invoice-company-name">${escapeHtml(this.state.user.company_name || this.state.user.name)}</div>
          </div>
          <div class="invoice-to">
            <h4>Bill To</h4>
            <div class="invoice-company-name">${escapeHtml(invoice.client_name || 'Unknown Client')}</div>
            ${invoice.client_company ? `<div>${escapeHtml(invoice.client_company)}</div>` : ''}
            ${invoice.client_address ? `<div class="invoice-address">${escapeHtml(invoice.client_address)}</div>` : ''}
          </div>
        </div>

        <table class="invoice-table">
          <thead>
            <tr>
              <th>Description</th>
              <th style="width: 80px;">Qty</th>
              <th style="width: 100px;">Price</th>
              <th style="width: 100px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map(item => `
              <tr>
                <td>${escapeHtml(item.description)}</td>
                <td>${item.quantity}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td>$${(item.quantity * item.price).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="invoice-totals">
          <table class="invoice-totals-table">
            <tr>
              <td>Subtotal:</td>
              <td>$${invoice.subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Tax (${invoice.tax_rate}%):</td>
              <td>$${invoice.tax_amount.toFixed(2)}</td>
            </tr>
            <tr class="invoice-total-row">
              <td>Total:</td>
              <td>$${invoice.total.toFixed(2)}</td>
            </tr>
          </table>
        </div>

        ${invoice.notes ? `
        <div class="invoice-notes">
          <h4>Notes</h4>
          <p>${escapeHtml(invoice.notes)}</p>
        </div>
        ` : ''}

        <div style="margin-top: 2rem; display: flex; gap: 0.5rem; justify-content: flex-end;">
          <button class="btn btn-secondary" onclick="window.print()">Print</button>
          <button class="btn btn-primary" onclick="Modal.hide()">Close</button>
        </div>
      </div>
    `);
  }

  static showTimeLogForm() {
    API.projects.getAll().then(projectsData => {
      const projects = projectsData.data || [];
      const projectOptions = projects.map(p =>
        `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`
      ).join('');

      this.show('Manual Time Entry', `
        <form id="timelog-form">
          <div class="form-group">
            <label for="timelog-project">Project</label>
            <select id="timelog-project" class="form-select">
              <option value="">No project</option>
              ${projectOptions}
            </select>
          </div>
          <div class="form-group">
            <label for="timelog-description">Description</label>
            <input type="text" id="timelog-description" class="form-input" placeholder="What did you work on?">
          </div>
          <div class="form-group">
            <label for="timelog-duration">Duration (minutes)</label>
            <input type="number" id="timelog-duration" class="form-input" value="60" min="1" required>
          </div>
          <div class="form-group">
            <label for="timelog-date">Date</label>
            <input type="date" id="timelog-date" class="form-input" value="${new Date().toISOString().split('T')[0]}">
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" id="timelog-billable" checked>
              <span>Billable</span>
            </label>
          </div>
          <div class="modal-footer" style="padding: 0; border: none; margin-top: 1.5rem;">
            <button type="button" class="btn btn-secondary" onclick="Modal.hide()">Cancel</button>
            <button type="submit" class="btn btn-primary">Add Entry</button>
          </div>
        </form>
      `);

      document.getElementById('timelog-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const duration = parseInt(document.getElementById('timelog-duration').value);
        const date = document.getElementById('timelog-date').value;

        try {
          await API.timelogs.create({
            project_id: document.getElementById('timelog-project').value || null,
            description: document.getElementById('timelog-description').value,
            duration: duration * 60, // Convert to seconds
            start_time: new Date(date).toISOString(),
            billable: document.getElementById('timelog-billable').checked
          });
          this.hide();
          TimeTracker.render();
        } catch (error) {
          Toast.error(error.error || 'Failed to add time entry');
        }
      });
    });
  }

  static showDeleteConfirm(title, message, onConfirm) {
    this.show(escapeHtml(title), `
      <div class="delete-message">
        <p>${escapeHtml(message)}</p>
        <div class="delete-actions">
          <button class="btn btn-secondary" onclick="Modal.hide()">Cancel</button>
          <button class="btn btn-danger" id="confirm-delete-btn">Delete</button>
        </div>
      </div>
    `);

    document.getElementById('confirm-delete-btn').addEventListener('click', () => {
      onConfirm();
      this.hide();
    });
  }

  static showSettings() {
    this.show('Settings', `
      <form id="settings-form">
        <div class="form-group">
          <label for="settings-name">Name</label>
          <input type="text" id="settings-name" class="form-input" value="${escapeHtml(this.state.user.name)}">
        </div>
        <div class="form-group">
          <label for="settings-company">Company Name</label>
          <input type="text" id="settings-company" class="form-input" value="${escapeHtml(this.state.user.company_name || '')}">
        </div>
        <hr style="margin: 1.5rem 0; border: none; border-top: 1px solid var(--border-color);">
        <h4 style="margin-bottom: 1rem;">Change Password</h4>
        <div class="form-group">
          <label for="settings-current-password">Current Password</label>
          <input type="password" id="settings-current-password" class="form-input">
        </div>
        <div class="form-group">
          <label for="settings-new-password">New Password</label>
          <input type="password" id="settings-new-password" class="form-input" minlength="8">
        </div>
        <div class="modal-footer" style="padding: 0; border: none; margin-top: 1.5rem;">
          <button type="button" class="btn btn-secondary" onclick="Modal.hide()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </div>
      </form>
    `);

    document.getElementById('settings-form').addEventListener('submit', async (e) => {
      e.preventDefault();

      try {
        await API.auth.updateProfile({
          name: document.getElementById('settings-name').value,
          company_name: document.getElementById('settings-company').value
        });

        const newPassword = document.getElementById('settings-new-password').value;
        const currentPassword = document.getElementById('settings-current-password').value;

        if (newPassword && currentPassword) {
          await API.auth.changePassword({
            currentPassword,
            newPassword
          });
        }

        this.state.user.name = document.getElementById('settings-name').value;
        this.state.user.company_name = document.getElementById('settings-company').value;
        this.elements.userName.textContent = this.state.user.name;
        this.elements.userAvatar.textContent = this.state.user.name.charAt(0).toUpperCase();

        this.hide();
        Toast.success('Settings saved successfully!');
      } catch (error) {
        Toast.error(error.error || 'Failed to save settings');
      }
    });
  }

  static showProfile() {
    this.show('Profile', `
      <div style="text-align: center; padding: 1rem;">
        <div style="width: 80px; height: 80px; border-radius: 50%; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 600; margin: 0 auto 1rem;">
          ${escapeHtml(this.state.user.name.charAt(0).toUpperCase())}
        </div>
        <h3 style="margin-bottom: 0.25rem;">${escapeHtml(this.state.user.name)}</h3>
        <p style="color: var(--text-secondary); margin-bottom: 1rem;">${escapeHtml(this.state.user.email)}</p>
        <div style="display: inline-block; background: var(--bg-primary); padding: 0.5rem 1rem; border-radius: var(--border-radius); font-size: 0.875rem;">
          <strong>Role:</strong> ${escapeHtml(this.state.user.role.charAt(0).toUpperCase() + this.state.user.role.slice(1))}
        </div>
      </div>
    `);
  }
}

// Make Modal globally accessible for inline event handlers
window.Modal = Modal;

export { Modal };
