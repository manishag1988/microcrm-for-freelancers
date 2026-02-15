# Testing Guide

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (re-run on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Configuration

Tests are configured in `package.json`:

```json
{
  "jest": {
    "testEnvironment": "node",
    "coverageDirectory": "coverage",
    "collectCoverageFrom": [
      "server/**/*.js",
      "!server/models/database-pg.js"
    ],
    "testMatch": [
      "**/tests/**/*.test.js",
      "**/__tests__/**/*.js"
    ]
  }
}
```

### Test Structure

```
micro-crm/
├── tests/
│   ├── auth.test.js         # Auth middleware tests ✓
│   ├── database.test.js     # Database operations tests ✓
│   └── email.test.js        # Email utilities tests ✓
```

---

## Implemented Tests

### 1. Auth Middleware Tests (`tests/auth.test.js`)

| Test | Status |
|------|--------|
| Should return 401 if no token provided | ✓ |
| Should return 401 if token is invalid | ✓ |
| Should return 403 if token is expired | ✓ |
| Should call next() and set req.user for valid token | ✓ |
| Should accept token from Authorization header | ✓ |
| Should return 403 if user is not admin | ✓ |
| Should call next() if user is admin | ✓ |
| Should generate a valid JWT token | ✓ |
| Should set token expiration to 7 days | ✓ |

### 2. Database Operations Tests (`tests/database.test.js`)

| Test | Status |
|------|--------|
| User Operations | |
| Should create a new user | ✓ |
| Should find user by email | ✓ |
| Should return null for non-existent email | ✓ |
| Should update user role | ✓ |
| Should delete user | ✓ |
| Client Operations | |
| Should create a new client | ✓ |
| Should get all clients for a user | ✓ |
| Should get client by id and user | ✓ |
| Should return null for client owned by different user | ✓ |
| Should update client | ✓ |
| Should delete client | ✓ |
| Should get client stats | ✓ |
| Invoice Operations | |
| Should get next invoice number | ✓ |
| Should get invoice stats | ✓ |
| Should create invoice | ✓ |
| Should update invoice status | ✓ |
| Project Operations | |
| Should get project stats | ✓ |
| Should create project with default status | ✓ |

### 3. Email Utilities Tests (`tests/email.test.js`)

| Test | Status |
|------|--------|
| Should generate welcome email template | ✓ |
| Should generate invoice created template | ✓ |
| Should generate invoice paid template | ✓ |
| Should generate project status changed template | ✓ |
| Should generate password reset template | ✓ |
| Should send email when SMTP is configured | ✓ |
| Should return mock success when SMTP not configured | ✓ |
| Should handle email send failure | ✓ |
| Should setup notification routes on Express app | ✓ |

---

## Remaining Tests to Implement

### Priority 1: Route Integration Tests

These tests require setting up the Express app with mocked database. Recommended approach: use a test database or `mocks-server`.

#### Auth Routes (`tests/auth-routes.test.js`)

```javascript
// Tests to implement:
describe('POST /api/auth/register')
  - Should return 400 if email is missing
  - Should return 400 if password is missing
  - Should return 400 if name is missing
  - Should return 400 if email already exists
  - Should create user successfully

describe('POST /api/auth/login')
  - Should return 400 if email is missing
  - Should return 400 if password is missing
  - Should return 401 if user not found
  - Should return 401 if password is invalid
  - Should login successfully with valid credentials

describe('POST /api/auth/logout')
  - Should logout successfully

describe('GET /api/auth/me')
  - Should return user data when authenticated
  - Should return 404 if user not found

describe('PUT /api/auth/profile')
  - Should update user profile

describe('PUT /api/auth/password')
  - Should return 401 if current password is incorrect
  - Should change password successfully
```

#### Client Routes (`tests/client-routes.test.js`)

```javascript
// Tests to implement:
describe('GET /api/clients')
  - Should return all clients for user
  - Should return empty array if no clients

describe('GET /api/clients/stats')
  - Should return client stats

describe('GET /api/clients/:id')
  - Should return client by id
  - Should return 404 if client not found

describe('POST /api/clients')
  - Should return 400 if name is missing
  - Should create client successfully

describe('PUT /api/clients/:id')
  - Should return 404 if client not found
  - Should update client successfully

describe('DELETE /api/clients/:id')
  - Should return 404 if client not found
  - Should delete client successfully
```

#### Project Routes (`tests/project-routes.test.js`)

```javascript
// Tests to implement:
describe('GET /api/projects')
  - Should return all projects for user

describe('GET /api/projects/stats')
  - Should return project stats

describe('GET /api/projects/:id')
  - Should return project by id
  - Should return 404 for non-existent project

describe('POST /api/projects')
  - Should return 400 if name is missing
  - Should create project with default status
  - Should create project with custom status

describe('PUT /api/projects/:id')
  - Should return 404 if project not found
  - Should update project successfully
  - Should handle progress update

describe('DELETE /api/projects/:id')
  - Should return 404 if project not found
  - Should delete project successfully
```

#### Task Routes (`tests/task-routes.test.js`)

```javascript
// Tests to implement:
describe('GET /api/tasks')
  - Should return all tasks for user

describe('GET /api/tasks/stats')
  - Should return task stats

describe('GET /api/tasks/project/:projectId')
  - Should return tasks by project

describe('GET /api/tasks/:id')
  - Should return task by id
  - Should return 404 if task not found

describe('POST /api/tasks')
  - Should return 400 if title is missing
  - Should create task successfully

describe('PUT /api/tasks/:id')
  - Should return 404 if task not found
  - Should update task successfully

describe('PATCH /api/tasks/:id/status')
  - Should update task status

describe('DELETE /api/tasks/:id')
  - Should return 404 if task not found
  - Should delete task successfully
```

#### Invoice Routes (`tests/invoice-routes.test.js`)

```javascript
// Tests to implement:
describe('GET /api/invoices')
  - Should return all invoices for user

describe('GET /api/invoices/stats')
  - Should return invoice stats

describe('GET /api/invoices/next-number')
  - Should return next invoice number

describe('GET /api/invoices/:id')
  - Should return invoice by id
  - Should return 404 if invoice not found

describe('POST /api/invoices')
  - Should return 400 if client_id is missing
  - Should return 400 if items is empty
  - Should create invoice successfully

describe('PUT /api/invoices/:id')
  - Should return 404 if invoice not found
  - Should update invoice successfully

describe('PATCH /api/invoices/:id/status')
  - Should update invoice status

describe('DELETE /api/invoices/:id')
  - Should return 404 if invoice not found
  - Should delete invoice successfully
```

#### Time Log Routes (`tests/timelog-routes.test.js`)

```javascript
// Tests to implement:
describe('GET /api/timelogs')
  - Should return all time logs for user

describe('GET /api/timelogs/stats')
  - Should return time log stats

describe('GET /api/timelogs/active')
  - Should return active timer

describe('GET /api/timelogs/project/:projectId')
  - Should return time logs by project

describe('POST /api/timelogs/start')
  - Should start timer

describe('POST /api/timelogs/stop/:id')
  - Should stop timer
  - Should return 404 if timelog not found

describe('POST /api/timelogs')
  - Should return 400 if duration is missing
  - Should create manual time entry

describe('PUT /api/timelogs/:id')
  - Should update time log

describe('DELETE /api/timelogs/:id')
  - Should delete time log
```

#### Admin Routes (`tests/admin-routes.test.js`)

```javascript
// Tests to implement:
describe('GET /api/admin/users')
  - Should return 403 if not admin
  - Should return all users if admin

describe('PUT /api/admin/users/:id/role')
  - Should return 400 if role is invalid
  - Should update user role

describe('DELETE /api/admin/users/:id')
  - Should return 400 if deleting own account
  - Should delete user

describe('GET /api/admin/stats')
  - Should return 403 if not admin
  - Should return system stats if admin
```

---

### Priority 2: Frontend Tests

Use a frontend testing framework like Vitest or Jest with jsdom.

#### API Module Tests (`tests/api.test.js`)

```javascript
// Tests to implement:
describe('API.request')
  - Should include auth token in headers
  - Should handle 401 unauthorized
  - Should handle 403 forbidden
  - Should handle 404 not found
  - Should handle 429 rate limit
  - Should handle 500+ server errors
  - Should retry on server errors

describe('API.get')
  - Should make GET request

describe('API.post')
  - Should make POST request with body

describe('API.put')
  - Should make PUT request with body

describe('API.delete')
  - Should make DELETE request

describe('API.auth')
  - Should login
  - Should register
  - Should logout
  - Should get current user
```

#### Validator Tests (`tests/validator.test.js`)

```javascript
// Tests to implement:
describe('validateEmail')
  - Should return true for valid email
  - Should return false for invalid email

describe('validatePassword')
  - Should return true for valid password
  - Should return false for weak password

describe('validateRequired')
  - Should validate required fields
```

---

### Priority 3: End-to-End Tests

Use Playwright (already in `test.js`).

#### E2E Tests (`tests/e2e.test.js`)

```javascript
// Tests to implement:
describe('Authentication Flow')
  - Should show login form on load
  - Should register new user
  - Should login with valid credentials
  - Should show error for invalid credentials
  - Should logout

describe('Dashboard')
  - Should display dashboard after login
  - Should show client stats
  - Should show project stats

describe('Clients Module')
  - Should display client list
  - Should create new client
  - Should edit client
  - Should delete client

describe('Projects Module')
  - Should display project list
  - Should create new project
  - Should edit project
  - Should delete project

describe('Tasks Module')
  - Should display task list
  - Should create new task
  - Should update task status

describe('Invoices Module')
  - Should display invoice list
  - Should create new invoice
  - Should view invoice preview

describe('Time Tracker')
  - Should start timer
  - Should stop timer
  - Should display time logs
```

---

### Priority 4: Edge Case Tests

#### Error Handling Tests (`tests/errors.test.js`)

```javascript
// Tests to implement:
describe('Database Errors')
  - Should handle database connection failure
  - Should handle query errors

describe('Authentication Errors')
  - Should handle expired tokens
  - Should handle invalid tokens

describe('Validation Errors')
  - Should validate email format
  - Should validate required fields
  - Should validate data types
```

---

## Running Specific Tests

```bash
# Run a specific test file
npm test -- auth.test.js

# Run tests matching a pattern
npm test -- --testNamePattern="authenticateToken"

# Run tests in CI mode (no watch)
npm test -- --watchAll=false
```

---

## Adding New Tests

1. Create a new file in `tests/` directory
2. Name it `<module>.test.js`
3. Import required dependencies
4. Use `describe` and `it` blocks
5. Run tests to verify

Example:

```javascript
const request = require('supertest');
const express = require('express');

describe('New Module', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Setup routes
    const newRoutes = require('../server/routes/new');
    app.use('/api/new', newRoutes);
  });

  describe('GET /api/new', () => {
    it('should return data', async () => {
      const res = await request(app).get('/api/new');
      expect(res.status).toBe(200);
    });
  });
});
```
