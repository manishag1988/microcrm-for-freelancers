// Time Tracker Module
import { API } from '../api.js';
import { Toast } from '../toast.js';

class TimeTracker {
  static timerState = {
    interval: null,
    startTime: null,
    logId: null
  };

  static async render() {
    const addBtn = document.getElementById('add-timelog-btn');
    addBtn.onclick = () => {
      window.Modal.showTimeLogForm();
    };

    try {
      // Load projects for timer
      const projectsData = await API.projects.getAll();
      const projects = projectsData.data || [];
      const select = document.getElementById('timer-project-select');
      select.innerHTML = '<option value="">Select Project</option>' +
        projects.map(p => `<option value="${p.id}">${this.escapeHtml(p.name)}</option>`).join('');

      // Load time logs
      const timeLogsData = await API.timelogs.getAll();
      const timeLogs = timeLogsData.data || [];
      const tbody = document.getElementById('timelogs-table-body');
      const emptyState = document.getElementById('timelogs-empty');

      if (timeLogs.length === 0) {
        tbody.innerHTML = '';
        emptyState.classList.remove('hidden');
      } else {
        emptyState.classList.add('hidden');
        tbody.innerHTML = timeLogs.map(log => `
          <tr>
            <td>${this.formatDateTime(log.start_time)}</td>
            <td>${this.escapeHtml(log.project_name || '-')}</td>
            <td>${this.escapeHtml(log.description || '-')}</td>
            <td class="duration">${this.formatDuration(log.duration)}</td>
            <td>
              <span class="status-badge ${log.billable ? 'status-active' : 'status-draft'}">
                ${log.billable ? 'Yes' : 'No'}
              </span>
            </td>
            <td class="actions">
              <button class="btn btn-icon" onclick="Modal.showDeleteConfirm('Delete Entry', 'Are you sure you want to delete this time entry?', async () => { await API.timelogs.delete('${log.id}'); TimeTracker.render(); Toast.show('Time entry deleted'); })" title="Delete">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </td>
          </tr>
        `).join('');
      }

      // Check for active timer
      const activeLog = await API.timelogs.getActive();
      if (activeLog) {
        this.timerState.logId = activeLog.id;
        this.timerState.startTime = new Date(activeLog.start_time);
        this.startTimerDisplay();
        document.getElementById('start-timer-btn').classList.add('hidden');
        document.getElementById('stop-timer-btn').classList.remove('hidden');
      }
    } catch (error) {
      Toast.show(error.error || 'Failed to load time logs', 'error');
    }
  }

  static startTimerDisplay() {
    if (this.timerState.interval) {
      clearInterval(this.timerState.interval);
    }
    this.timerState.interval = setInterval(() => {
      this.updateTimerDisplay();
    }, 1000);
  }

  static updateTimerDisplay() {
    const display = document.getElementById('main-timer-display');
    const widgetDisplay = document.getElementById('timer-display');

    if (this.timerState.startTime) {
      const elapsed = Date.now() - this.timerState.startTime.getTime();
      const formatted = this.formatDuration(Math.floor(elapsed / 1000));
      display.textContent = formatted;
      widgetDisplay.textContent = formatted;
    }
  }

  static async startTimer() {
    const projectSelect = document.getElementById('timer-project-select');
    const descriptionInput = document.getElementById('timer-description');
    const billableCheckbox = document.getElementById('timer-billable');
    
    const projectId = projectSelect?.value || null;
    const description = descriptionInput?.value || '';
    const billable = billableCheckbox?.checked ?? true;

    // Require project selection
    if (!projectId) {
      Toast.show('Please select a project', 'warning');
      return;
    }

    try {
      const result = await API.timelogs.startTimer({
        project_id: projectId,
        description,
        billable
      });

      this.timerState.logId = result.id;
      this.timerState.startTime = new Date(result.start_time);
      this.startTimerDisplay();

      const startBtn = document.getElementById('start-timer-btn');
      const stopBtn = document.getElementById('stop-timer-btn');
      if (startBtn) startBtn.classList.add('hidden');
      if (stopBtn) stopBtn.classList.remove('hidden');

      Toast.show('Timer started');
      TimeTracker.render();
    } catch (error) {
      Toast.show(error.error || 'Failed to start timer', 'error');
    }
  }

  static async stopTimer() {
    if (!this.timerState.logId) return;

    try {
      await API.timelogs.stopTimer(this.timerState.logId);

      clearInterval(this.timerState.interval);
      this.timerState = { interval: null, startTime: null, logId: null };

      const startBtn = document.getElementById('start-timer-btn');
      const stopBtn = document.getElementById('stop-timer-btn');
      const mainTimerDisplay = document.getElementById('main-timer-display');
      const timerDisplay = document.getElementById('timer-display');
      
      if (startBtn) startBtn.classList.remove('hidden');
      if (stopBtn) stopBtn.classList.add('hidden');
      if (mainTimerDisplay) mainTimerDisplay.textContent = '00:00:00';
      if (timerDisplay) timerDisplay.textContent = '00:00:00';

      Toast.show('Timer stopped');
      TimeTracker.render();
    } catch (error) {
      Toast.show(error.error || 'Failed to stop timer', 'error');
    }
  }

  static formatDuration(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  static formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  static escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Setup timer button listeners
document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('start-timer-btn');
  const stopBtn = document.getElementById('stop-timer-btn');

  if (startBtn) {
    startBtn.addEventListener('click', () => TimeTracker.startTimer());
  }
  if (stopBtn) {
    stopBtn.addEventListener('click', () => TimeTracker.stopTimer());
  }
});

export { TimeTracker };
