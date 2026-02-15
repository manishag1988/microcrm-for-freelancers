# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2026-02-14

### Fixed
- **Route conflict** - Fixed duplicate `/api/clients` route causing API conflicts
  - Moved client portal routes to `/api/portal` path
  - Updated server.js route registration

- **Invoice form accessibility** - Added column headers for invoice line items
  - Added "Description", "Qty", "Price" labels above item inputs
  - Added aria-label attributes to all item input fields

- **Timer workflow** - Improved timer start UX on dashboard
  - Dashboard "Start Timer" now navigates to timetracker page
  - Timer now requires project selection (no longer allows starting without project)

- **Creating projects, tasks, invoices** - Fixed unable to create new items
  - Resolved route registration conflict in server.js

### Changed
- Updated project/task/invoice creation UX for better error handling

---

## [1.0.1] - 2026-02-14

### Fixed
- **Login not working** - Critical bug where clicking login button did nothing
  - Removed broken import in `public/js/app.js` that was loading non-existent `auth.js` module
  - Eliminated circular dependencies between `app.js`, `router.js`, `modal.js`, and `toast.js`
  - Implemented dependency injection pattern for cleaner module initialization

- **User role detection** - Fixed admin role detection for non-admin users
- **Invoice numbers** - Fixed unique constraint issue causing errors for non-admin users
- **JavaScript escaping** - Improved inline onclick handler escaping to prevent XSS issues

### Changed
- Refactored multiple frontend modules (clients, projects, tasks, invoices, timetracker, dashboard, admin)
- Added better error handling in server routes

---

## [1.0.0] - 2026-01-XX

### Added
- Complete CRM functionality for freelancers
- Dashboard with stats, recent activity, and quick actions
- Client management with contact details and notes
- Project management with budgets, deadlines, and progress tracking
- Kanban-style task board with drag-and-drop
- Invoicing system with automatic calculations and PDF support
- Time tracker with start/stop timer and manual entries
- Admin panel for user management
- JWT authentication with secure cookies
- SQLite database (sql.js) for data persistence

### Tech Stack
- Backend: Node.js with Express.js
- Database: SQLite (sql.js - WebAssembly)
- Frontend: Vanilla JavaScript (ES6 Modules), CSS
- Authentication: JWT with bcryptjs

---

## Previous Versions

For earlier versions, please refer to the initial project documentation.

---

## Upgrading

### From 1.0.0 to 1.0.1
No database migration required. Simply update the code files:
- `public/js/app.js`
- `public/js/router.js`
- `public/js/modal.js`
- `public/js/toast.js`
- `public/js/modules/*.js`
- `server/routes/invoices.js`
- `server/routes/timelogs.js`
- `server/models/database.js`
