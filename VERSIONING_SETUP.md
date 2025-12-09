# Versioning and Release Setup Guide

This guide explains how to use the versioning and release automation system for the Ticket Booking System.

## Overview

The project uses **semantic versioning** (MAJOR.MINOR.PATCH) with automated release workflows that:
- Bump version numbers in `package.json` files
- Create annotated Git tags (e.g., `v1.0.0`)
- Generate GitHub Releases with changelogs
- Optionally push Docker images to Docker Hub (requires credentials)
- Send Slack/email notifications

## Quick Start

### 1. Bump Version and Release (Automated)

Use npm scripts to bump version, create tag, and push to GitHub:

```bash
# Patch bump (0.2.0 → 0.2.1)
npm run release:patch

# Minor bump (0.2.0 → 0.3.0)
npm run release:minor

# Major bump (0.2.0 → 1.0.0)
npm run release:major
```

Each command will:
1. Update `package.json` (backend and frontend)
2. Create a Git commit with the version bump
3. Create an annotated Git tag
4. Push tag to `origin` (triggers Release workflow)

### 2. Manual Tagging (Advanced)

If you prefer manual control:

```bash
# Bump version without tagging
npm run bump:patch
npm run bump:minor
npm run bump:major

# Then manually create and push tag
git tag -a vX.Y.Z -m "Release version X.Y.Z"
git push origin vX.Y.Z
```

### 3. Check Version

```bash
# View current version
node -p "require('./package.json').version"

# View all tags
git tag -l

# View tag details
git show v0.2.0
```

## GitHub Release Workflow

When you push a tag matching `v*.*.*` pattern, the **Release & Deploy** workflow automatically:

1. **Parse version** from Git tag
2. **Check Docker credentials**
   - If `DOCKER_USERNAME` and `DOCKER_PASSWORD` secrets are configured → build and push Docker images
   - If not configured → log a warning and continue (Release still created)
3. **Generate changelog** from Git commits since last tag
4. **Create GitHub Release** with changelog and Docker image information
5. **Send notifications** (Slack/email if configured)

### Example Release Workflow Steps

```yaml
# Triggers on: git push origin vX.Y.Z
Workflow: Release & Deploy
├─ parse-version (extract version from tag)
├─ build-and-push (conditional: requires Docker credentials)
├─ check-docker-config (warns if credentials missing)
├─ generate-changelog (list commits since last tag)
├─ create-release (GitHub Release with changelog)
└─ notify-release (Slack/email notifications)
```

## Configuration

### Configure Docker Hub Push (Optional)

To automatically push Docker images to Docker Hub:

1. **Create Docker Hub Access Token:**
   - Log in to [Docker Hub](https://hub.docker.com)
   - Go to Account Settings → Security → Access Tokens
   - Create a new token (save the token value)

2. **Add GitHub Secrets:**
   - Go to GitHub repo → Settings → Secrets and Variables → Actions
   - Click "New repository secret"
   - Add these secrets:
     - `DOCKER_USERNAME`: Your Docker Hub username
     - `DOCKER_PASSWORD`: Your Docker Hub access token (or password)

3. **Verify:**
   - Push a tag: `git push origin vX.Y.Z`
   - Check GitHub Actions → Release & Deploy workflow
   - If successful, images will be available at:
     - `docker.io/YOUR_USERNAME/ticket-booking-backend:vX.Y.Z`
     - `docker.io/YOUR_USERNAME/ticket-booking-frontend:vX.Y.Z`

### Configure Slack Notifications (Optional)

1. **Create Slack Webhook:**
   - Go to your Slack workspace
   - Apps → Create New App → From manifest
   - Add incoming webhook capability
   - Copy webhook URL

2. **Add GitHub Secret:**
   - GitHub repo → Settings → Secrets and Variables → Actions
   - Add secret: `SLACK_WEBHOOK_URL` = webhook URL from step 1

3. **Verify:**
   - Push a tag
   - Check GitHub Actions for release workflow
   - Slack notification will be sent to configured channel

### Configure Email Notifications (Optional)

1. **Add GitHub Secrets:**
   - `EMAIL_SERVER`: SMTP server (e.g., `smtp.gmail.com`)
   - `EMAIL_USERNAME`: SMTP username
   - `EMAIL_PASSWORD`: SMTP password or app token
   - `EMAIL_RECIPIENTS`: Comma-separated email addresses

2. **Verify:**
   - Push a tag
   - Release workflow will send email on completion

## npm Scripts Reference

```bash
# Bump commands
npm run bump:patch        # Update version files only
npm run bump:minor
npm run bump:major

# Release commands (bump + tag + push)
npm run release:patch
npm run release:minor
npm run release:major

# Testing
npm run test              # Run all tests
npm run test:unit         # Unit tests only
npm run test:coverage     # Coverage report

# Development
npm run dev               # Start backend with nodemon
npm run test:watch        # Watch mode tests
```

## Scripts Explained

### `scripts/bump-version.sh`

Increments semantic version and updates all `package.json` files.

```bash
# Supported bump types
./scripts/bump-version.sh major       # Interactive (prompts for confirmation)
./scripts/bump-version.sh minor
./scripts/bump-version.sh patch
./scripts/bump-version.sh patch --yes # Non-interactive (auto-confirm)
```

**What it does:**
1. Validates Git working directory is clean
2. Increments version number
3. Updates `package.json` and `frontend/package.json`
4. Creates Git commit with message `chore: bump version to X.Y.Z`
5. Provides instructions for creating annotated tag

### `scripts/create-and-push-tag.sh`

Creates an annotated Git tag from current `package.json` version and pushes to `origin`.

```bash
# Must have version-bumped commit first
npm run bump:patch
./scripts/create-and-push-tag.sh
```

**What it does:**
1. Reads version from `package.json`
2. Creates annotated tag: `git tag -a vX.Y.Z -m "Release vX.Y.Z"`
3. Pushes tag to remote: `git push origin vX.Y.Z`
4. Triggers Release workflow on GitHub

## Workflow Diagrams

### Release Trigger Flow

```
User: npm run release:patch
    ↓
Script: bump-version.sh
    ├─ Increment patch version
    ├─ Update package.json files
    └─ Create commit
    ↓
Script: create-and-push-tag.sh
    ├─ Create annotated tag
    └─ Push to origin
    ↓
GitHub Actions: Release & Deploy (triggered by tag push)
    ├─ Parse version from tag
    ├─ Build & push Docker images (if credentials configured)
    ├─ Generate changelog
    ├─ Create GitHub Release
    └─ Send notifications (Slack/email)
```

### Conditional Release Job Execution

```
Tag pushed: v0.2.0
    ↓
Release workflow triggered
    ↓
    ├─→ parse-version (always runs)
    │
    ├─→ check-docker-config (always runs)
    │   └─ Logs if Docker credentials missing
    │
    ├─→ build-and-push (conditional)
    │   ├─ IF DOCKER_USERNAME & DOCKER_PASSWORD are set
    │   │  └─ Build & push images to Docker Hub
    │   └─ ELSE
    │      └─ SKIPPED (continue without Docker)
    │
    ├─→ generate-changelog (always runs)
    │
    ├─→ create-release (always runs)
    │   └─ Create GitHub Release with changelog
    │
    └─→ notify-release (always runs)
        └─ Send Slack/email notifications
```

## Troubleshooting

### Release workflow not triggering

**Cause:** Tag wasn't pushed or tag format incorrect

**Solution:**
```bash
# Verify tag exists locally
git tag -l

# Verify tag pushed to remote
git ls-remote --tags origin

# Check tag format (should match v*.*.*)
git show v0.2.0

# If tag missing, create and push
git tag -a vX.Y.Z -m "Release vX.Y.Z"
git push origin vX.Y.Z
```

### Docker push failing in workflow

**Cause:** `DOCKER_USERNAME` or `DOCKER_PASSWORD` secrets not configured

**Solution:**
1. Go to GitHub repo → Settings → Secrets and Variables → Actions
2. Add `DOCKER_USERNAME` and `DOCKER_PASSWORD`
3. Trigger workflow again: `git push origin vX.Y.Z`

**Note:** If credentials are missing, the workflow will:
- Log a warning message
- Skip Docker push
- Still create GitHub Release
- Continue without error

### Release created but Docker images not pushed

**Cause:** Expected behavior if Docker credentials not configured

**Verify:**
1. Check GitHub Actions workflow output
2. Look for "Check Docker Hub credentials" step
3. If Docker credentials are configured, workflow should have pushed images
4. Verify images on Docker Hub:
   ```bash
   docker pull YOUR_USERNAME/ticket-booking-backend:vX.Y.Z
   ```

### Notifications not being sent

**Docker image push failing despite credentials:**
1. Verify credentials are correct (try Docker login locally)
2. Check GitHub Actions logs for error messages
3. Ensure Docker image builds successfully

**Slack/email not sending:**
1. Verify webhook URL/email credentials are correct
2. Check GitHub Actions workflow output for errors
3. Ensure secrets are named correctly: `SLACK_WEBHOOK_URL`, `EMAIL_*`

## Version History

Check version history:

```bash
# List all tags
git tag -l

# View tag details with message
git tag -l -n5

# View release history on GitHub
# Navigate to: repo → Releases
```

## CI/CD Integration

The release workflow integrates with the test-and-build workflow:

```
Code push to main
    ↓
test-and-build.yml triggered
    ├─ Run tests (Node 18 & 20)
    └─ Build images → push to GHCR (GitHub Container Registry)
    
    ↓ (only if tests pass)
    
Tag push: v0.2.0
    ↓
release.yml triggered
    ├─ Parse version
    ├─ Build & push to Docker Hub (optional)
    ├─ Create GitHub Release
    └─ Send notifications
```

## Best Practices

1. **Always bump before releasing:**
   ```bash
   npm run release:patch  # (not manual tag)
   ```

2. **Test before releasing to main:**
   ```bash
   git checkout develop
   npm run test:all       # Verify tests pass
   git push origin develop
   # Wait for test-and-build workflow to succeed
   git checkout main
   git merge develop
   npm run release:patch
   ```

3. **Review changelog:**
   - GitHub Release will auto-generate from commits
   - Verify changelog is accurate before release
   - Adjust if needed (GitHub Release page is editable)

4. **Verify Docker images:**
   ```bash
   docker pull YOUR_USERNAME/ticket-booking-backend:vX.Y.Z
   docker run -p 3000:3000 YOUR_USERNAME/ticket-booking-backend:vX.Y.Z
   ```

5. **Monitor notifications:**
   - Check Slack channel for release notification
   - Verify email notification (if configured)
   - Monitor GitHub Release page

## Next Steps

1. **Configure Docker Hub** (optional but recommended):
   - Add `DOCKER_USERNAME` and `DOCKER_PASSWORD` secrets to GitHub
   - This enables automatic image pushes

2. **Configure Slack notifications** (optional):
   - Create Slack webhook
   - Add `SLACK_WEBHOOK_URL` secret to GitHub

3. **Test the release workflow:**
   ```bash
   npm run release:patch
   # Monitor GitHub Actions → Release & Deploy workflow
   ```

4. **Verify GitHub Release:**
   - Go to repo → Releases
   - Check that release was created with correct version and changelog

---

**Last Updated:** December 2024
**Maintained By:** DevOps Team
**Related Files:** `.github/workflows/release.yml`, `scripts/bump-version.sh`, `scripts/create-and-push-tag.sh`
