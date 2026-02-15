// Data Export Module

class DataExport {
  static downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static toCSV(data, headers) {
    if (!data || data.length === 0) return '';
    
    const headerRow = headers.map(h => `"${h.label}"`).join(',');
    const rows = data.map(item => {
      return headers.map(h => {
        let value = item[h.key];
        
        // Handle nested objects
        if (h.key.includes('.')) {
          const keys = h.key.split('.');
          value = keys.reduce((obj, key) => obj?.[key], item);
        }
        
        // Handle arrays and objects
        if (typeof value === 'object' && value !== null) {
          value = JSON.stringify(value);
        }
        
        // Escape quotes and wrap in quotes
        if (value === null || value === undefined) {
          value = '';
        } else {
          value = String(value).replace(/"/g, '""');
        }
        
        return `"${value}"`;
      }).join(',');
    });
    
    return [headerRow, ...rows].join('\n');
  }

  static toJSON(data) {
    return JSON.stringify(data, null, 2);
  }

  static async exportClients(format = 'csv') {
    const clientsData = await API.clients.getAll();
    const clients = clientsData.data || [];
    
    const headers = [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'company', label: 'Company' },
      { key: 'address', label: 'Address' },
      { key: 'notes', label: 'Notes' },
      { key: 'created_at', label: 'Created At' }
    ];

    const content = format === 'json' 
      ? this.toJSON(clients) 
      : this.toCSV(clients, headers);

    const filename = `clients_${new Date().toISOString().split('T')[0]}.${format}`;
    this.downloadFile(content, filename, format === 'json' ? 'application/json' : 'text/csv');
  }

  static async exportProjects(format = 'csv') {
    const projectsData = await API.projects.getAll();
    const projects = projectsData.data || [];
    
    const headers = [
      { key: 'name', label: 'Name' },
      { key: 'client_name', label: 'Client' },
      { key: 'description', label: 'Description' },
      { key: 'status', label: 'Status' },
      { key: 'budget', label: 'Budget' },
      { key: 'deadline', label: 'Deadline' },
      { key: 'progress', label: 'Progress (%)' },
      { key: 'created_at', label: 'Created At' }
    ];

    const content = format === 'json' 
      ? this.toJSON(projects) 
      : this.toCSV(projects, headers);

    const filename = `projects_${new Date().toISOString().split('T')[0]}.${format}`;
    this.downloadFile(content, filename, format === 'json' ? 'application/json' : 'text/csv');
  }

  static async exportTasks(format = 'csv') {
    const tasksData = await API.tasks.getAll();
    const tasks = tasksData.data || [];
    
    const headers = [
      { key: 'title', label: 'Title' },
      { key: 'project_name', label: 'Project' },
      { key: 'description', label: 'Description' },
      { key: 'status', label: 'Status' },
      { key: 'priority', label: 'Priority' },
      { key: 'due_date', label: 'Due Date' },
      { key: 'created_at', label: 'Created At' }
    ];

    const content = format === 'json' 
      ? this.toJSON(tasks) 
      : this.toCSV(tasks, headers);

    const filename = `tasks_${new Date().toISOString().split('T')[0]}.${format}`;
    this.downloadFile(content, filename, format === 'json' ? 'application/json' : 'text/csv');
  }

  static async exportInvoices(format = 'csv') {
    const invoicesData = await API.invoices.getAll();
    const invoices = invoicesData.data || [];
    
    const headers = [
      { key: 'invoice_number', label: 'Invoice #' },
      { key: 'client_name', label: 'Client' },
      { key: 'subtotal', label: 'Subtotal' },
      { key: 'tax_rate', label: 'Tax Rate (%)' },
      { key: 'tax_amount', label: 'Tax Amount' },
      { key: 'total', label: 'Total' },
      { key: 'status', label: 'Status' },
      { key: 'issue_date', label: 'Issue Date' },
      { key: 'due_date', label: 'Due Date' }
    ];

    const content = format === 'json' 
      ? this.toJSON(invoices) 
      : this.toCSV(invoices, headers);

    const filename = `invoices_${new Date().toISOString().split('T')[0]}.${format}`;
    this.downloadFile(content, filename, format === 'json' ? 'application/json' : 'text/csv');
  }

  static async exportTimeLogs(format = 'csv') {
    const timelogsData = await API.timelogs.getAll();
    const timelogs = timelogsData.data || [];
    
    const headers = [
      { key: 'project_name', label: 'Project' },
      { key: 'description', label: 'Description' },
      { key: 'start_time', label: 'Start Time' },
      { key: 'end_time', label: 'End Time' },
      { key: 'duration', label: 'Duration (seconds)' },
      { key: 'billable', label: 'Billable' }
    ];

    // Format duration
    const formattedLogs = timelogs.map(log => ({
      ...log,
      duration: log.duration || '',
      billable: log.billable ? 'Yes' : 'No'
    }));

    const content = format === 'json' 
      ? this.toJSON(formattedLogs) 
      : this.toCSV(formattedLogs, headers);

    const filename = `timelogs_${new Date().toISOString().split('T')[0]}.${format}`;
    this.downloadFile(content, filename, format === 'json' ? 'application/json' : 'text/csv');
  }

  static async exportAll(format = 'json') {
    const [clients, projects, tasks, invoices, timelogs] = await Promise.all([
      API.clients.getAll(),
      API.projects.getAll(),
      API.tasks.getAll(),
      API.invoices.getAll(),
      API.timelogs.getAll()
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      data: {
        clients,
        projects,
        tasks,
        invoices,
        timelogs
      }
    };

    const content = this.toJSON(exportData);
    const filename = `micro-crm-backup_${new Date().toISOString().split('T')[0]}.${format}`;
    this.downloadFile(content, filename, 'application/json');
  }

  static showExportModal() {
    Modal.show('Export & Backup Data', `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <p><strong>Export Data</strong></p>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
          <button class="btn btn-secondary" onclick="DataExport.exportClients('csv')">Export Clients (CSV)</button>
          <button class="btn btn-secondary" onclick="DataExport.exportClients('json')">Export Clients (JSON)</button>
          
          <button class="btn btn-secondary" onclick="DataExport.exportProjects('csv')">Export Projects (CSV)</button>
          <button class="btn btn-secondary" onclick="DataExport.exportProjects('json')">Export Projects (JSON)</button>
          
          <button class="btn btn-secondary" onclick="DataExport.exportTasks('csv')">Export Tasks (CSV)</button>
          <button class="btn btn-secondary" onclick="DataExport.exportTasks('json')">Export Tasks (JSON)</button>
          
          <button class="btn btn-secondary" onclick="DataExport.exportInvoices('csv')">Export Invoices (CSV)</button>
          <button class="btn btn-secondary" onclick="DataExport.exportInvoices('json')">Export Invoices (JSON)</button>
          
          <button class="btn btn-secondary" onclick="DataExport.exportTimeLogs('csv')">Export Time Logs (CSV)</button>
          <button class="btn btn-secondary" onclick="DataExport.exportTimeLogs('json')">Export Time Logs (JSON)</button>
        </div>
        
        <hr style="margin: 1rem 0;">
        
        <p><strong>Full Backup</strong></p>
        <button class="btn btn-primary" onclick="DataExport.exportAll('json')">Download Full Backup (JSON)</button>
        
        <hr style="margin: 1rem 0;">
        
        <p><strong>Restore Data</strong></p>
        <p style="font-size: 0.875rem; color: var(--text-secondary);">Upload a backup file to restore your data. Existing records will not be overwritten.</p>
        <input type="file" id="restore-file" accept=".json" style="margin-bottom: 0.5rem;">
        <button class="btn btn-warning" onclick="DataExport.restoreFromFile()">Restore from Backup</button>
      </div>
    `);
  }

  static async restoreFromFile() {
    const fileInput = document.getElementById('restore-file');
    const file = fileInput.files[0];
    
    if (!file) {
      Toast.show('Please select a backup file', 'error');
      return;
    }

    try {
      const text = await file.text();
      const backupData = JSON.parse(text);
      
      const confirmRestore = confirm('This will restore data from the backup. Existing records will not be overwritten. Continue?');
      if (!confirmRestore) return;

      Toast.show('Restoring data...', 'info');
      
      const result = await API.backup.restore(backupData.data);
      
      Modal.hide();
      Toast.show(`Restore complete! Restored: ${result.results.clients} clients, ${result.results.projects} projects, ${result.results.tasks} tasks, ${result.results.invoices} invoices, ${result.results.timelogs} time logs.`, 'success');
      
      // Refresh current page
      if (typeof Clients !== 'undefined') Clients.render();
      if (typeof Projects !== 'undefined') Projects.render();
      if (typeof Tasks !== 'undefined') Tasks.render();
      if (typeof Invoices !== 'undefined') Invoices.render();
      if (typeof TimeTracker !== 'undefined') TimeTracker.render();
    } catch (error) {
      Toast.show(error.error || 'Failed to restore data', 'error');
    }
  }
}

export { DataExport };

// Expose globally
window.DataExport = DataExport;

// Add export button to dashboard
function addExportButton() {
  // Check if we're on admin page or dashboard
  const settingsArea = document.querySelector('.sidebar .nav-items');
  if (settingsArea && !document.getElementById('export-data-btn')) {
    const exportBtn = document.createElement('a');
    exportBtn.href = '#';
    exportBtn.id = 'export-data-btn';
    exportBtn.className = 'nav-item';
    exportBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Export Data';
    exportBtn.onclick = (e) => {
      e.preventDefault();
      DataExport.showExportModal();
    };
    settingsArea.appendChild(exportBtn);
  }
}

// Add export button when page loads
document.addEventListener('DOMContentLoaded', addExportButton);
