# Testing & CI/CD Pipeline Documentation

## Overview

This project includes comprehensive testing and automated CI/CD pipelines with notification mechanisms for real-time feedback.

## Testing Structure

### Unit Tests (`tests/unit/api.test.js`)
- Individual API endpoint testing
- Request/response validation
- Input validation and error handling
- Database interaction verification

**Run unit tests:**
```bash
npm run test:unit
```

### Integration Tests (`tests/integration/workflow.test.js`)
- Complete booking lifecycle workflows
- Multi-ticket operations
- Data persistence verification
- Error handling and edge cases
- Order and consistency validation

**Run integration tests:**
```bash
npm run test:integration
```

### Full Test Suite with Coverage
```bash
npm run test:all
```

Coverage thresholds (defined in `jest.config.js`):
- Lines: 50%
- Functions: 50%
- Branches: 50%
- Statements: 50%

## Running Tests Locally

### Install dependencies
```bash
npm install
```

### Run all tests
```bash
npm run test:all
```

### Run tests in watch mode (for development)
```bash
npm run test:watch
```

### Generate coverage report
```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory.

## CI/CD Pipelines

### 1. Test & Build Workflow (`.github/workflows/test-and-build.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

**Jobs:**
- **Test**: Runs unit and integration tests across Node.js 18 and 20
- **Build**: Builds and pushes Docker images to container registry (only on successful tests)
- **Notify**: Sends notifications via Slack and email

**Key Steps:**
1. Checkout code
2. Setup Node.js with dependency caching
3. Run unit tests
4. Run integration tests
5. Collect coverage reports
6. Upload to Codecov
7. Build Docker images for backend and frontend
8. Send notifications based on results

### 2. Deploy & Notify Workflow (`.github/workflows/deploy-and-notify.yml`)

**Triggers:**
- Successful completion of "Test & Build" workflow on `main` branch

**Jobs:**
- **Deploy**: Deploys the application to production (customize as needed)
- **Notify Failure**: Alerts team if upstream tests fail

## Notifications

### Slack Notifications

**Setup:**
1. Create a Slack workspace and enable Incoming Webhooks
2. Create a webhook URL for your channel
3. Add to GitHub repository secrets as `SLACK_WEBHOOK_URL`

**Notifications sent for:**
- Test failures (with link to workflow logs)
- Test successes (with coverage percentage)
- Deployment completions
- Pipeline failures requiring intervention

**Example Slack payload structure:**
```json
{
  "text": "✅ Tests Passed",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "✅ *All Tests Passed*\n*Branch:* main\n*Coverage:* 75%"
      }
    }
  ]
}
```

### Email Notifications

**Setup:**
1. Add email server credentials to GitHub secrets:
   - `EMAIL_SERVER`
   - `EMAIL_PORT`
   - `EMAIL_USERNAME`
   - `EMAIL_PASSWORD`
   - `EMAIL_RECIPIENTS` (comma-separated)

2. Enable email notifications by setting environment variable:
   ```yaml
   EMAIL_ALERT_ENABLED: 'true'
   ```

**Notifications sent for:**
- Pipeline failures requiring manual intervention
- Deployment completions

### Custom Webhook Notifications

The `utils/notifications.js` service supports custom webhooks:

```javascript
const NotificationService = require('./utils/notifications');

const testResults = {
  passed: 45,
  failed: 2,
  total: 47,
  coverage: 75,
  branch: 'main',
  commitHash: 'abc123def456'
};

// Send to custom webhook
await NotificationService.sendWebhookNotification(
  'https://your-webhook.example.com/tests',
  testResults
);

// Send to Slack
await NotificationService.sendSlackNotification(
  'https://hooks.slack.com/services/YOUR/WEBHOOK/URL',
  testResults
);

// Send email via webhook service
await NotificationService.sendEmailNotification(
  'https://email-service.example.com/send',
  testResults,
  'dev-team@example.com'
);
```

## GitHub Repository Secrets Configuration

Required secrets for full CI/CD functionality:

```
SLACK_WEBHOOK_URL          # Slack incoming webhook
EMAIL_SERVER              # SMTP server address
EMAIL_PORT               # SMTP port (usually 587 or 465)
EMAIL_USERNAME           # SMTP username
EMAIL_PASSWORD           # SMTP password
EMAIL_RECIPIENTS         # Comma-separated email addresses
GITHUB_TOKEN            # Auto-generated (for Docker registry)
```

## Test Coverage & Codecov Integration

Coverage reports are automatically uploaded to Codecov (optional).

**Setup Codecov:**
1. Visit https://codecov.io and sign up
2. Connect your GitHub repository
3. Codecov will automatically receive coverage reports from CI

**View coverage:**
- In pull request comments (automatic)
- At https://codecov.io/gh/your-org/your-repo

## Docker Build Caching

The GitHub Actions workflow uses Docker layer caching for faster builds:

```yaml
cache-from: type=registry,ref=${{ env.REGISTRY }}/repo:buildcache
cache-to: type=registry,ref=${{ env.REGISTRY }}/repo:buildcache,mode=max
```

This significantly reduces build times for subsequent pushes.

## Troubleshooting

### Tests fail locally but pass in CI
- Ensure Node.js version matches CI (18.x or 20.x)
- Check database initialization in test setup
- Verify environment variables are set

### Docker builds fail in GitHub Actions
- Ensure Docker Registry secrets are configured
- Check that Dockerfile paths are correct
- Verify BuildKit is enabled

### Slack notifications not sending
- Verify `SLACK_WEBHOOK_URL` is correctly set in secrets
- Test webhook URL manually: `curl -X POST -H 'Content-type: application/json' --data '{"text":"test"}' YOUR_WEBHOOK_URL`
- Check GitHub Actions logs for error messages

### Email notifications failing
- Verify SMTP credentials are correct
- Check firewall/network access to SMTP server
- Ensure EMAIL_RECIPIENTS is properly formatted

## Best Practices

1. **Run tests locally before pushing**
   ```bash
   npm run test:all
   ```

2. **Keep tests focused and independent**
   - Each test should test one behavior
   - Avoid test interdependencies

3. **Monitor coverage trends**
   - Check Codecov reports after each PR
   - Set minimum coverage thresholds

4. **Update tests with code changes**
   - Add tests for new features
   - Update tests when behavior changes

5. **Use watch mode during development**
   ```bash
   npm run test:watch
   ```

6. **Review notification settings**
   - Adjust notification channels based on team preferences
   - Ensure critical failures alert the right people

## Adding New Tests

**Unit Test Template:**
```javascript
describe('Feature Name', () => {
  it('should do something specific', async () => {
    const res = await request(app).get('/endpoint');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('expected_field');
  });
});
```

**Integration Test Template:**
```javascript
describe('Complete Workflow', () => {
  it('should complete full workflow', async () => {
    // Step 1: Setup
    // Step 2: Execute
    // Step 3: Verify
  });
});
```

## Pipeline Status Badge

Add this to your README to display pipeline status:

```markdown
[![Test & Build](https://github.com/YOUR_ORG/YOUR_REPO/actions/workflows/test-and-build.yml/badge.svg)](https://github.com/YOUR_ORG/YOUR_REPO/actions/workflows/test-and-build.yml)
```

## Next Steps

1. Configure GitHub repository secrets
2. Test workflow by pushing to develop branch
3. Monitor Slack/email for notifications
4. Adjust notification settings based on team feedback
5. Add more tests as features are added
