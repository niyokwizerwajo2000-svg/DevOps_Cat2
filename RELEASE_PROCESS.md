# Release Process & Version Management

This guide covers how to create releases, manage versions, and deploy artifacts for the Ticket Booking System.

## Table of Contents
1. [Versioning Strategy](#versioning-strategy)
2. [Release Workflow](#release-workflow)
3. [Creating a Release](#creating-a-release)
4. [Docker Image Management](#docker-image-management)
5. [Rollback Procedures](#rollback-procedures)
6. [Release Checklist](#release-checklist)

## Versioning Strategy

This project uses **Semantic Versioning** (`major.minor.patch`):

- **Major** (X.0.0): Breaking changes, incompatible API changes
- **Minor** (0.X.0): New features, backward-compatible additions
- **Patch** (0.0.X): Bug fixes, documentation updates

### Examples
- `v1.0.0` - First major release
- `v1.1.0` - New feature added
- `v1.1.1` - Bug fix
- `v2.0.0` - Breaking changes

### Version Format
- Use `v` prefix in Git tags: `v1.0.0`, `v1.0.1`, etc.
- Update `package.json` version before tagging
- Version appears in Docker image tags

## Release Workflow

```
┌─────────────────────────────────────────────────────────┐
│ 1. Update package.json version                          │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ 2. Create Git tag: git tag v1.0.0                       │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ 3. Push tag: git push origin v1.0.0                     │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ GitHub Actions Triggered: .github/workflows/release.yml │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
    ┌───▼────┐           ┌───────▼──────┐
    │ Build  │           │  Generate    │
    │ Docker │           │  Changelog   │
    │ Images │           │              │
    └───┬────┘           └───────┬──────┘
        │                        │
        └────────────┬───────────┘
                     │
        ┌────────────▼──────────────┐
        │ Create GitHub Release     │
        │ - Release notes          │
        │ - Docker image tags      │
        │ - Changelog              │
        └────────────┬──────────────┘
                     │
        ┌────────────▼──────────────┐
        │ Send Notifications       │
        │ - Slack message          │
        │ - Email alert            │
        └──────────────────────────┘
```

## Creating a Release

### Step 1: Prepare Code
```bash
# Ensure all changes are committed and pushed
git status
git log --oneline -5

# Create a feature branch for release preparation
git checkout -b release/v1.1.0
```

### Step 2: Update Version Numbers

**Update `package.json`:**
```json
{
  "name": "ticket-booking-backend",
  "version": "1.1.0",
  ...
}
```

**Update `frontend/package.json`:**
```json
{
  "name": "ticket-booking-frontend",
  "version": "1.1.0",
  ...
}
```

### Step 3: Commit Version Changes
```bash
git add package.json frontend/package.json
git commit -m "chore: bump version to 1.1.0"
git push origin release/v1.1.0
```

### Step 4: Create Pull Request
```bash
# Create PR for version bump
# Title: "Release: v1.1.0"
# Description: List of changes, fixes, features
```

### Step 5: Merge and Tag
```bash
# After PR is approved and merged back to main
git checkout main
git pull origin main

# Create annotated tag with release notes
git tag -a v1.1.0 -m "Release version 1.1.0

Features:
- Feature 1 description
- Feature 2 description

Bug Fixes:
- Fix 1 description
- Fix 2 description

Breaking Changes:
- None"

# Push tag (this triggers the release workflow)
git push origin v1.1.0
```

### Step 6: Monitor Release Workflow
```bash
# View workflow in GitHub Actions
# https://github.com/YOUR_ORG/ticket-booking-system/actions

# Or monitor via CLI if you have GitHub CLI installed
gh run list --workflow=release.yml
```

### Step 7: Verify Release
- Check GitHub Releases page
- Verify Docker images pushed to registry
- Review release notes
- Check Slack/email notifications

## Docker Image Management

### Image Naming Convention
```
docker.io/YOUR_USERNAME/ticket-booking-backend:v1.1.0
docker.io/YOUR_USERNAME/ticket-booking-backend:latest
docker.io/YOUR_USERNAME/ticket-booking-frontend:v1.1.0
docker.io/YOUR_USERNAME/ticket-booking-frontend:latest
```

### Pull Released Images
```bash
# Pull specific version
docker pull your-username/ticket-booking-backend:v1.1.0
docker pull your-username/ticket-booking-frontend:v1.1.0

# Pull latest
docker pull your-username/ticket-booking-backend:latest
docker pull your-username/ticket-booking-frontend:latest
```

### Run Released Version
```bash
# Update docker-compose.yml
version: '3.8'
services:
  app:
    image: your-username/ticket-booking-backend:v1.1.0
    # ... rest of config
    
  frontend:
    image: your-username/ticket-booking-frontend:v1.1.0
    # ... rest of config

# Start the released version
docker-compose up -d
```

### Image Layer Caching
- Release workflow uses Docker buildx with registry cache
- Caching avoids rebuilding unchanged layers
- First build takes ~2-3 minutes, subsequent builds ~30 seconds
- Cache is automatically managed by Docker

## Rollback Procedures

### Rollback to Previous Release
```bash
# Check previous tags
git tag | sort -V | tail -5

# Checkout and run previous version
git checkout v1.0.0

# Or pull and run previous Docker image
docker pull your-username/ticket-booking-backend:v1.0.0
docker pull your-username/ticket-booking-frontend:v1.0.0

# Update docker-compose.yml and restart
docker-compose down
docker-compose up -d
```

### Emergency Rollback
If critical issues are found in a release:

```bash
# 1. Stop current version
docker-compose down

# 2. Pull previous stable version
docker pull your-username/ticket-booking-backend:v1.0.0
docker pull your-username/ticket-booking-frontend:v1.0.0

# 3. Update docker-compose.yml with previous version
# 4. Restart with previous version
docker-compose up -d

# 5. Notify team
# Send Slack message: "Rolled back to v1.0.0 due to [issue]"

# 6. Create issue for investigation
# Document what went wrong and prevention strategies
```

## Release Checklist

Before creating a release, verify:

### Code Quality
- [ ] All tests passing locally: `npm run test:all`
- [ ] Code coverage meets 50% minimum: `npm run test:coverage`
- [ ] No linting errors
- [ ] All dependencies up to date

### Documentation
- [ ] `CHANGELOG.md` updated with version and changes
- [ ] README.md reflects new features (if applicable)
- [ ] API documentation updated (if new endpoints)
- [ ] Known issues documented

### Git & Versioning
- [ ] All commits on `main` branch
- [ ] Version numbers updated in `package.json` files
- [ ] Meaningful commit messages
- [ ] No uncommitted changes: `git status` clean

### Testing
- [ ] Unit tests pass: `npm run test:unit`
- [ ] Integration tests pass: `npm run test:integration`
- [ ] Manual smoke testing completed
- [ ] Docker images build without errors

### Release Artifacts
- [ ] Docker images tagged correctly
- [ ] Release notes prepared
- [ ] Changelog generated
- [ ] GitHub release created

### Notifications
- [ ] Slack webhook configured
- [ ] Email recipients configured (if applicable)
- [ ] Notification message templates reviewed

### Post-Release
- [ ] Monitor application for 30 minutes
- [ ] Check error logs
- [ ] Confirm database migrations applied
- [ ] Verify all services are running

## GitHub Secrets Required

Configure these in GitHub Settings → Secrets and Variables → Actions:

### Required
```
DOCKER_USERNAME      # Docker Hub username
DOCKER_PASSWORD      # Docker Hub personal access token
```

### Optional
```
SLACK_WEBHOOK_URL    # Slack notification webhook
EMAIL_RECIPIENTS     # Email addresses for notifications
GMAIL_PASSWORD       # Gmail password for email notifications (if using Gmail)
```

## Release Notes Template

When creating a release, use this template:

```markdown
## Release v1.1.0

### 🎉 New Features
- Feature 1: Description
- Feature 2: Description

### 🐛 Bug Fixes
- Fixed issue #123: Description
- Fixed issue #124: Description

### 📚 Documentation
- Updated API documentation
- Added setup guide

### ⚠️ Breaking Changes
- None

### 🔄 Dependencies Updated
- dependency-name v1.0.0 → v1.1.0

### 📦 Docker Images
- `your-username/ticket-booking-backend:v1.1.0`
- `your-username/ticket-booking-frontend:v1.1.0`

### 📋 Contributors
Thanks to all contributors in this release!

### Installation
\`\`\`bash
docker pull your-username/ticket-booking-backend:v1.1.0
docker pull your-username/ticket-booking-frontend:v1.1.0
\`\`\`
```

## Semantic Versioning Examples

| Scenario | Action | New Version |
|----------|--------|------------|
| First release | Create initial release | v1.0.0 |
| Add new feature | Increment minor | v1.1.0 |
| Bug fix | Increment patch | v1.0.1 |
| Breaking API change | Increment major | v2.0.0 |
| Remove deprecated API | Increment major | v2.0.0 |
| Update docs only | No release needed | - |
| Internal refactor | No release needed | - |

## Automated Workflow Summary

When you push a git tag `v1.1.0`:

1. **Parse Version**: Extract version numbers from tag
2. **Build & Push**: Build Docker images, push to registry
3. **Generate Changelog**: Create changelog from commits since last tag
4. **Create Release**: Generate GitHub release with notes
5. **Notify Team**: Send Slack and email notifications

All steps run in parallel when possible for speed (~5-10 minutes total).

## Troubleshooting

### Docker Push Failed
```bash
# Verify Docker Hub credentials
echo $DOCKER_PASSWORD | docker login -u $DOCKER_USERNAME --password-stdin

# Check if registry is reachable
docker pull alpine  # Test pull

# Verify GitHub secrets are set correctly
# Settings → Secrets and Variables → Actions
```

### Release Workflow Not Triggering
```bash
# Verify tag format (must be vX.X.X)
git tag -l | grep v

# Verify tag is pushed
git ls-remote --tags origin | grep v1.1.0

# Check GitHub Actions logs for errors
# Actions tab → Release & Deploy workflow
```

### Changelog Generation Issues
- Ensure previous tag exists: `git tag | head -5`
- Check commit messages: `git log --oneline`
- Review generated changelog in GitHub Actions logs

## Best Practices

1. **Create releases for user-facing changes only**
   - New features → release
   - Bug fixes → release
   - Docs updates → no release needed
   - Internal refactors → no release needed

2. **Use clear commit messages**
   - `feat: add new booking filter`
   - `fix: resolve memory leak in API`
   - `docs: update installation guide`

3. **Test before tagging**
   - Run full test suite locally
   - Verify Docker build succeeds
   - Manual smoke test critical features

4. **Document breaking changes**
   - Clearly note any API changes
   - Provide migration guides
   - Update client examples

5. **Keep releases focused**
   - Release frequently (weekly/biweekly)
   - Small, focused changes per release
   - Easier to debug if issues occur

6. **Monitor after release**
   - Check error logs for 30 minutes
   - Monitor performance metrics
   - Be ready to rollback if needed

---

**Last Updated:** December 2024
**Maintainer:** DevOps Team
**Status:** Phase 5 - Release Management
