# Copilot Instructions for Ticket Booking System

This file guides AI coding agents working on the Ticket Booking System project. It documents essential architectural decisions, workflows, and patterns specific to this codebase.

## Project Overview

**Ticket Booking System**: Full-stack application for bus ticket booking and management.

- **Backend**: Node.js/Express API with SQLite/MySQL database
- **Frontend**: React (Vite) SPA consuming the backend API
- **Deployment**: Docker/Docker Compose multi-container setup
- **Testing**: Jest unit and integration tests with GitHub Actions CI/CD

## Architecture

### Service Boundaries

```
┌─────────────────────────────────────────────────┐
│  Frontend (React + Vite)                        │
│  - Served via Nginx in Docker                   │
│  - Communicates via /api proxy or direct HTTP   │
└──────────────────┬──────────────────────────────┘
                   │ HTTP (port 3000)
┌──────────────────┴──────────────────────────────┐
│  Backend (Express.js)                           │
│  - REST API on port 3000                        │
│  - Handles business logic                       │
│  - Manages ticket CRUD operations               │
└──────────────────┬──────────────────────────────┘
                   │ (SQLite or MySQL)
┌──────────────────┴──────────────────────────────┐
│  Database                                        │
│  - SQLite (development): tickets.db             │
│  - MySQL (production): ticket_db                │
│  - Schemas: tickets, users tables               │
└─────────────────────────────────────────────────┘
```

### Key Files & Their Roles

**Backend:**
- `index.js` - Main Express application, API routes
- `init.sql` - Database schema and seed data (MySQL)
- `jest.config.js` - Jest test configuration
- `utils/notifications.js` - Slack/email notification service

**Frontend:**
- `frontend/src/App.jsx` - Main React component
- `frontend/src/api.js` - Axios HTTP client configuration
- `frontend/src/styles.css` - Component styling

**Infrastructure:**
- `Dockerfile` - Backend container image
- `frontend/Dockerfile` - Frontend container with Nginx
- `docker-compose.yml` - Multi-container orchestration
- `.github/workflows/` - CI/CD pipelines

**Testing:**
- `tests/unit/api.test.js` - Unit tests for API endpoints
- `tests/integration/workflow.test.js` - End-to-end booking workflows

## Critical Architectural Decisions

### 1. Database Duality: SQLite (Dev) vs MySQL (Prod)

- **Development**: Uses SQLite (`tickets.db`) for quick iteration
- **Production**: Uses MySQL via Docker for scalability
- **Migration**: Backend detects environment and initializes accordingly
- **Schema**: Both share identical table structures (see `init.sql`)

**When adding database features:**
- Ensure SQL is compatible with both SQLite and MySQL
- Use parameterized queries (e.g., `?` placeholders)
- Test with both databases locally

### 2. API Response Format

All endpoints follow a consistent response pattern:

```javascript
// Success (200)
{ success: true, data: { id, bus, seat, price, created_at } }

// Error (4xx/5xx)
{ success: false, message: "Human-readable error" }
```

**This pattern is enforced throughout `index.js`.** Maintain this when adding endpoints.

### 3. Frontend API Discovery

Frontend determines API URL via environment variable precedence:

```javascript
// frontend/src/api.js
const baseURL = import.meta.env.VITE_API_URL || '/api'
```

- `VITE_API_URL` (if set): Direct URL (e.g., `http://localhost:3000`)
- Fallback `/api`: Relative path (Nginx proxy)

**When working on frontend API integration:**
- Test with both modes (direct and proxy)
- Ensure CORS is enabled on backend (already configured via `cors()` middleware)

### 4. Container Networking

Docker Compose defines service-to-service communication:

- Backend (`app`) runs on port 3000 internally
- Frontend calls backend at `http://app:3000` (DNS resolution via Docker)
- MySQL (`mysql`) accessible at `mysql:3306` (host networking)

**Environment variable key:** `DATABASE_URL=mysql://user:pass@mysql:3306/ticket_db`

## Testing Philosophy

### Jest Configuration (`jest.config.js`)
- **Test environment:** Node.js (for API testing)
- **Test pattern:** Files matching `**/*.test.js` or `**/*.spec.js`
- **Setup file:** Configures test database and environment
- **Reporters:** Default + coverage reporter
- **Timeout:** 30 seconds (increased for integration tests)
- **No coverage:** Tests run without --coverage flag by default for speed
- **CI mode:** Automatic on GitHub Actions (verbose output, --detectOpenHandles)

### Unit Tests
**File:** `tests/unit/api.test.js`

Tests individual endpoints in isolation using supertest + in-memory SQLite database.

**Test Coverage (55+ test cases):**
- Home route and API status
- GET /tickets (empty state, populated)
- POST /tickets (valid data, missing fields, type conversion)
- GET /tickets/:id (existing & non-existent)
- DELETE /tickets/:id (successful delete & not found)
- Error responses and HTTP status codes

**Pattern:**
```javascript
describe('POST /tickets', () => {
  it('should create ticket with valid data', async () => {
    const res = await request(app).post('/tickets').send({...});
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
```

**Key Details:**
- Uses in-memory SQLite (`:memory:`) for test isolation
- Creates fresh schema on each test run
- No database file artifacts
- Tests run in ~10-15 seconds

### Integration Tests
**File:** `tests/integration/workflow.test.js`

Tests complete user workflows (create → read → delete) and multi-step scenarios.

**Test Coverage (20+ scenarios):**
- Complete booking lifecycle (create → retrieve → delete)
- Multiple concurrent ticket bookings
- Data persistence across operations
- Order of operations (FIFO for listings)
- Error recovery and state consistency
- Concurrent delete operations
- Edge cases (empty database, duplicate operations)

**Pattern:** Tests simulate real usage (e.g., full lifecycle bookings, concurrent operations, data persistence).

**Example:**
```javascript
it('should handle complete booking lifecycle', async () => {
  // Create ticket
  const bookRes = await request(app).post('/tickets').send({...});
  const id = bookRes.body.data.id;
  
  // Retrieve it
  const getRes = await request(app).get(`/tickets/${id}`);
  expect(getRes.body.data.id).toBe(id);
  
  // Delete it
  const delRes = await request(app).delete(`/tickets/${id}`);
  expect(delRes.body.success).toBe(true);
  
  // Verify deletion
  const notFoundRes = await request(app).get(`/tickets/${id}`);
  expect(notFoundRes.status).toBe(404);
});
```

### Coverage Thresholds
Defined in `jest.config.js`:
- Lines: 50% (minimum)
- Functions: 50%
- Branches: 50%
- Statements: 50%

When adding features, include tests to meet these thresholds.

**How to check coverage:**
```bash
npm run test:coverage
```
This generates an HTML report in `coverage/` directory showing line-by-line coverage.

## CI/CD Pipelines

### Workflow: Test & Build (`.github/workflows/test-and-build.yml`)

**Triggers:** Push/PR to `main` or `develop` branches

**Pipeline:**
1. Test job (Node 18 & 20 matrix)
   - Install dependencies
   - Run unit tests: `npm run test:unit`
   - Run integration tests: `npm run test:integration`
   - Generate coverage report: `npm run test:coverage`
   - Upload coverage to Codecov
   - Fails if coverage below thresholds
   
2. Build job (only on test success)
   - Build backend Docker image: `docker build .`
   - Build frontend Docker image: `docker build ./frontend/`
   - Push to registry with caching
   - Caching optimizes layer reuse (10-30 second savings)
   
3. Notify job
   - Send Slack success notification with metrics
   - Send email alert for critical failures
   - Includes test counts, coverage %, branch name

**Key insight:** Build step only runs if tests pass. This enforces testing discipline and prevents broken code from being containerized.

**Critical Files:**
- `.github/workflows/test-and-build.yml` - Main pipeline definition
- `jest.config.js` - Test framework configuration
- `tests/unit/api.test.js` - 55+ unit test cases
- `tests/integration/workflow.test.js` - 20+ integration scenarios

### Workflow: Deploy & Notify (`.github/workflows/deploy-and-notify.yml`)

**Triggers:** Successful "Test & Build" on `main` branch only

**Steps:**
1. Waits for all test & build jobs to complete
2. Deploys to production environment (if configured)
3. Sends final status notifications
4. Includes deployment confirmation or failure alert

**Note:** Only runs for `main` branch pushes. Use `develop` for pre-release testing.

### Notification Service

**File:** `utils/notifications.js`

Provides unified notification interface with three transport methods:

```javascript
// Send Slack notification
sendWebhookNotification({
  webhookUrl: process.env.SLACK_WEBHOOK_URL,
  channel: '#deployments',
  message: '✅ Tests passed',
  status: 'success'
});

// Send email
sendWebhookNotification({
  type: 'email',
  to: process.env.EMAIL_RECIPIENTS,
  subject: 'Test Results',
  body: 'All tests passed!'
});

// Custom webhook
sendWebhookNotification({
  webhookUrl: 'https://custom-api.example.com/notify',
  payload: { event: 'test_complete', status: 'passed' }
});
```

**Configuration via environment variables or GitHub Secrets:**
- `SLACK_WEBHOOK_URL` - Slack incoming webhook
- `EMAIL_SERVER` - SMTP server address
- `EMAIL_PORT` - SMTP port (usually 587 or 465)
- `EMAIL_USERNAME` - SMTP username
- `EMAIL_PASSWORD` - SMTP password
- `EMAIL_RECIPIENTS` - Comma-separated email addresses

### Notification Channels

**Slack:**
- Uses incoming webhooks (configured via `SLACK_WEBHOOK_URL` secret)
- Posts rich formatted messages with build status, coverage %, branch
- Includes clickable links to workflow logs
- Message format includes: status (✅/❌), test counts, coverage %, commit hash, branch
- Example: `✅ Test & Build Passed | Coverage: 65% | workflow logs`

**Email:**
- Via SMTP (requires `EMAIL_SERVER`, `EMAIL_USERNAME`, `EMAIL_PASSWORD` secrets)
- Fallback notification for critical failures
- Alternative to Slack (not required)
- Includes test summary and failure details

**Custom webhook:** `utils/notifications.js` provides `sendWebhookNotification()` for extensibility.

**How to configure Slack notifications:**
1. Go to GitHub Repo → Settings → Secrets and Variables → Actions
2. Create new secret `SLACK_WEBHOOK_URL`
3. Get webhook URL from your Slack workspace → Apps → Incoming Webhooks
4. Paste URL as secret value
5. Workflow will automatically use it on next push

## Development Workflows

### Local Development

1. **Backend:**
   ```bash
   npm install
   npm run dev  # Runs with nodemon auto-reload
   ```
   Listens on port 3000, uses SQLite (`tickets.db`)

2. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev  # Vite dev server on port 5173
   ```
   API calls routed to `http://localhost:3000` (set `VITE_API_URL`)

3. **Full Stack (Docker):**
   ```bash
   docker-compose up
   ```
   - Backend: `http://localhost:3000`
   - Frontend: `http://localhost:5173`
   - MySQL: `localhost:3306`

### Testing Workflow

```bash
# Run all tests with coverage
npm run test:all

# Watch mode (during development)
npm run test:watch

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Generate coverage HTML report
npm run test:coverage
# Open coverage/lcov-report/index.html to view detailed report
```

**When adding new features:**
1. Write tests first (TDD approach)
2. Implement feature in `index.js` or `frontend/src/`
3. Run `npm run test:coverage` locally
4. Ensure coverage meets 50% minimum thresholds
5. Push to `develop` branch (triggers CI pipeline)
6. Monitor GitHub Actions for test results
7. Check Slack/email for notifications

### Adding a New Feature

1. **Understand the pattern:** Review existing code in `index.js` and tests
2. **Write tests first** (TDD): Add test cases to `tests/unit/` or `tests/integration/`
3. **Implement feature:** Add code to maintain consistency with existing patterns
4. **Verify coverage:** Run `npm run test:coverage`, ensure thresholds met
5. **Run full pipeline:** Push to develop to trigger GitHub Actions

### Maintaining Test Suite

**When tests become flaky:**
1. Check if tests depend on timing (add delays or mock timers)
2. Verify database state isolation (fresh schema per test)
3. Look for race conditions in async operations
4. Check GitHub Actions logs for environmental issues

**When adding new API endpoints:**
1. Add corresponding unit tests in `tests/unit/api.test.js`
2. Add corresponding integration tests in `tests/integration/workflow.test.js`
3. Follow existing patterns for error cases (400, 404, 500)
4. Ensure response format matches `{ success, data/message }`
5. Run `npm run test:coverage` to verify coverage meets 50% threshold

**When modifying database schema:**
1. Update `initializeDatabase()` in `index.js` (SQLite)
2. Update `init.sql` (MySQL)
3. Ensure both versions create identical table structures
4. Add tests that exercise new fields/tables
5. Test migrations work with both databases locally

## Key Conventions & Patterns

### Backend (Express)

**Route handlers follow this pattern:**
```javascript
app.post('/tickets', (req, res) => {
  const { field1, field2 } = req.body;
  
  // 1. Input validation
  if (!field1 || !field2) {
    return res.status(400).json({ success: false, message: 'Missing fields' });
  }
  
  // 2. Database operation
  db.run('INSERT INTO ...', [field1, field2], function(err) {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    
    // 3. Retrieve created record
    db.get('SELECT * FROM tickets WHERE id = ?', [this.lastID], (err, row) => {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }
      
      // 4. Return consistent response
      res.json({ success: true, data: row });
    });
  });
});
```

**Error handling:** Always return `{ success: false, message: '...' }` with appropriate HTTP status codes.

### Frontend (React)

**Component pattern:**
```javascript
export default function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await api.get('/endpoint');
      setData(res.data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ... component JSX
}
```

**API calls use:** `frontend/src/api.js` (configured Axios instance, handles base URL)

### Database

**Use parameterized queries always:**
```javascript
// ✅ Safe from SQL injection
db.run('INSERT INTO tickets (bus, seat) VALUES (?, ?)', [bus, seat], ...);

// ❌ Avoid string concatenation
db.run(`INSERT INTO tickets (bus) VALUES ('${bus}')`, ...);
```

## Common Tasks

### Adding a New API Endpoint

1. Add route to `index.js`:
   ```javascript
   app.get('/new-route', (req, res) => {
     // Follow the pattern above
   });
   ```

2. Add tests to `tests/unit/api.test.js`:
   ```javascript
   describe('GET /new-route', () => {
     it('should return expected data', async () => {
       const res = await request(app).get('/new-route');
       expect(res.status).toBe(200);
       expect(res.body.success).toBe(true);
     });
   });
   ```

3. Run tests: `npm run test:unit`
4. Push to trigger CI/CD

### Modifying Database Schema

1. Update schema in both `index.js` (SQLite) and `init.sql` (MySQL)
2. Ensure migrations are backward compatible
3. Add tests for new fields
4. Test with both SQLite and MySQL locally

### Debugging Failed CI/CD

1. Check GitHub Actions tab for detailed logs
2. Look for error messages in specific job
3. Common issues:
   - Missing environment variables → Check GitHub secrets
   - Test failures → Run locally with `npm run test:all`
   - Docker build issues → Check Docker registry credentials
   - Notification failures → Verify Slack webhook URL or SMTP settings
   - Coverage below threshold → Ensure tests cover new code paths
   - SQLite vs MySQL compatibility → Test schema changes with both databases

### Common Test Patterns & Gotchas

**Creating test data:**
```javascript
// ✅ Use in-memory database for isolation
const db = new sqlite3.Database(':memory:');

// ✅ Always create fresh schema
db.run('CREATE TABLE IF NOT EXISTS tickets (...)');

// ❌ Don't rely on persistent state between tests
// ❌ Don't assume previous test data exists
```

**Async handling in tests:**
```javascript
// ✅ Use async/await
it('should fetch tickets', async () => {
  const res = await request(app).get('/tickets');
});

// ✅ Use done callback if not using async
it('should fetch tickets', (done) => {
  request(app).get('/tickets').end((err, res) => {
    expect(res.status).toBe(200);
    done();
  });
});
```

**Parameterized queries (always):**
```javascript
// ✅ Prevents SQL injection + works with both SQLite & MySQL
db.run('SELECT * FROM tickets WHERE id = ?', [id], ...);

// ❌ Never interpolate user input
db.run(`SELECT * FROM tickets WHERE id = ${id}`, ...);
```

### Updating Dependencies

1. Update `package.json` version
2. Run `npm install` locally and verify tests pass
3. Commit `package-lock.json`
4. CI/CD will auto-test on push

## Performance Considerations

1. **Database queries:** Backend currently uses callbacks (not promises). Consider migration to async/await with promises for cleaner code.

2. **Frontend API calls:** Currently polling tickets every 5 seconds. Consider WebSocket for real-time updates if scalability needed.

3. **Docker layer caching:** GitHub Actions uses Docker cache registry to avoid rebuilding unchanged layers. This is pre-configured.

## Security Notes

1. **Environment variables:** Database credentials in `.env` (ignored by Git). Use GitHub secrets for CI/CD.
2. **CORS:** Enabled globally. In production, consider restricting to specific origins.
3. **Input validation:** Always validate in route handlers (enforced in existing patterns).
4. **SQL injection:** Use parameterized queries (enforced throughout codebase).

## Useful Commands Reference

```bash
# Local development
npm run dev                 # Start backend with nodemon
npm run test:watch         # Watch tests during development

# Testing (from package.json)
npm run test              # Run tests (basic)
npm run test:unit         # Unit tests only (verbose)
npm run test:integration  # Integration tests only (verbose)
npm run test:all          # Full suite with coverage report
npm run test:watch        # Watch mode (auto-rerun on changes)
npm run test:coverage     # Generate detailed coverage HTML report

# Docker
docker-compose up          # Start entire stack
docker-compose down        # Stop containers
docker-compose logs -f     # View logs

# Git
git push origin develop    # Trigger CI pipeline (test & build)
git push origin main       # Trigger CI + deployment pipeline
```

## Quick Test Execution Guide

**For developers adding features:**
```bash
npm run test:watch        # Start watch mode
# Edit code, tests auto-run
npm run test:coverage     # Verify coverage before push
```

**For code review/CI:**
```bash
npm run test:all          # Full pipeline simulation
```

**For deployment:**
```bash
npm run test:unit && npm run test:integration  # What CI does
```

## Extending the Project

### Adding Frontend Pages

1. Create component in `frontend/src/`
2. Update `frontend/src/App.jsx` routing (if using Router)
3. Ensure API calls use configured Axios client from `frontend/src/api.js`
4. Test locally with `npm run dev` in frontend dir

### Adding Features to Backend

1. Add route to `index.js`
2. Add tests to `tests/`
3. Update `TESTING.md` if adding new test categories
4. Push to develop to run CI pipeline

### Deploying to Production

1. Ensure `main` branch has passing tests
2. Push to `main` to trigger "Test & Build" workflow
3. Once tests pass, "Deploy & Notify" workflow runs
4. Check Slack/email for deployment confirmation

## When In Doubt

1. **API response format?** → Check existing endpoints in `index.js`
2. **How to test?** → Review `tests/unit/api.test.js` examples
3. **Database operations?** → See the `initializeDatabase()` function
4. **Frontend integration?** → Look at `frontend/src/App.jsx` patterns
5. **CI/CD configuration?** → Check `.github/workflows/` and `TESTING.md`
6. **Test failures in CI?** → Reproduce locally with `npm run test:all`
7. **Notification not working?** → Verify GitHub secrets and `utils/notifications.js` configuration

## Documentation Files

- **TESTING.md** - Comprehensive testing guide with troubleshooting
- **QUICK_START_TESTING.md** - Fast setup for developers & DevOps teams
- **PHASE_4_IMPLEMENTATION.md** - Detailed Phase 4 implementation summary
- **IMPLEMENTATION_CHECKLIST.md** - Complete verification checklist

---

**Last Updated:** December 2024
**Maintainer:** DevOps Team
**Phase:** Phase 4 (Testing & CI/CD) - Complete
