# Quick Start: Testing & CI/CD Setup

## For Developers

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Tests Locally
```bash
# All tests
npm run test:all

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Watch mode (during development)
npm run test:watch

# Coverage report
npm run test:coverage
```

### 3. Before Pushing Code
```bash
# Ensure all tests pass
npm run test:all

# Review coverage report
# Coverage should meet minimum thresholds (50% for lines, functions, branches, statements)
```

---

## For DevOps/CI Administrators

### 1. Configure GitHub Repository Secrets

Navigate to Settings → Secrets and Variables → Actions, add:

#### For Slack Notifications:
```
SLACK_WEBHOOK_URL = https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

#### For Email Notifications:
```
EMAIL_SERVER = smtp.gmail.com        # or your SMTP server
EMAIL_PORT = 587                     # or 465 for SSL
EMAIL_USERNAME = your-email@gmail.com
EMAIL_PASSWORD = your-app-password   # Use app-specific password
EMAIL_RECIPIENTS = team@company.com,admin@company.com
```

### 2. Test Slack Integration

1. Create a Slack App:
   - Go to https://api.slack.com/apps
   - Click "Create New App" → "From scratch"
   - Name it (e.g., "GitHub CI Notifications")
   - Choose your workspace

2. Enable Incoming Webhooks:
   - In your app settings, go to "Incoming Webhooks"
   - Click "Add New Webhook to Workspace"
   - Select channel where notifications should go
   - Copy the webhook URL to GitHub secrets

3. Test the webhook:
   ```bash
   curl -X POST -H 'Content-type: application/json' \
     --data '{"text":"Test message from CI"}' \
     YOUR_WEBHOOK_URL
   ```

### 3. Test Email Integration (Gmail Example)

1. Enable 2FA on your Gmail account
2. Generate an App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer" (or your OS)
   - Copy the generated 16-character password
3. Use this password in GitHub secrets (not your regular Gmail password)

### 4. Verify Workflows

1. Push to develop branch to trigger workflows:
   ```bash
   git push origin develop
   ```

2. Check GitHub Actions:
   - Go to repo → Actions tab
   - Watch "Test & Build" workflow run
   - Verify notifications appear in Slack/Email

### 5. Monitor and Adjust

- **Check logs:** Actions tab → workflow run → specific job
- **Review coverage:** After tests pass, check Codecov (if enabled)
- **Adjust thresholds:** Edit `jest.config.js` if coverage goals change
- **Modify notifications:** Edit `.github/workflows/test-and-build.yml`

---

## Workflow Diagram

```
Push to main/develop
        ↓
    Test & Build
        ├─ Test (Node 18 & 20)
        │   ├─ Unit Tests
        │   ├─ Integration Tests
        │   └─ Coverage Report
        ├─ Build (on success)
        │   ├─ Backend Docker Image
        │   └─ Frontend Docker Image
        └─ Notify
            ├─ Slack (Success/Failure)
            └─ Email (Optional)
        ↓
Deploy & Notify (main branch only)
    ├─ Deploy to Production
    └─ Notify Team
```

---

## Common Commands

```bash
# Local development
npm run dev                # Start backend in dev mode
npm run test:watch       # Run tests in watch mode

# CI/CD 
npm run test:all         # Full test suite with coverage
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only

# Docker
docker-compose up        # Start full stack locally
docker-compose down      # Stop containers
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Tests fail locally | Run `npm install` and check Node.js version (should be 18+) |
| Slack notifications not arriving | Verify webhook URL in GitHub secrets, test manually with curl |
| Email not sending | Check SMTP credentials, enable "Less secure apps" if Gmail |
| Docker build fails | Check Dockerfile syntax, ensure registry credentials are set |
| Coverage too low | Add more tests to `tests/` directory, check `jest.config.js` thresholds |

---

## Next Steps

1. ✅ Install test dependencies: `npm install`
2. ✅ Run tests locally: `npm run test:all`
3. ✅ Configure GitHub secrets (Slack/Email)
4. ✅ Push to develop to trigger CI pipeline
5. ✅ Verify notifications arrive
6. ✅ Set up monitoring/alerting based on results

For detailed docs, see `TESTING.md`
