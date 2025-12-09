# Quick Release Guide

Fast reference for creating releases of the Ticket Booking System.

## TL;DR - Create a Release in 5 Steps

### 1. Ensure Code is Ready
```bash
npm run test:all        # Verify tests pass
git status              # Check for uncommitted changes
git log --oneline -5    # Review recent commits
```

### 2. Bump Version
```bash
# Make script executable (first time only)
chmod +x scripts/bump-version.sh

# Run version bump script
./scripts/bump-version.sh patch    # For bug fixes
./scripts/bump-version.sh minor    # For new features
./scripts/bump-version.sh major    # For breaking changes
```

### 3. Create Annotated Git Tag
```bash
# Replace X.Y.Z with actual version number
git tag -a vX.Y.Z -m "Release version X.Y.Z"

# View tag details
git tag -l -n9 vX.Y.Z
```

### 4. Push Tag to GitHub
```bash
# This triggers the release workflow automatically
git push origin vX.Y.Z
```

### 5. Monitor & Verify
```bash
# Watch workflow progress
# https://github.com/YOUR_ORG/ticket-booking-system/actions

# Or use GitHub CLI
gh run list --workflow=release.yml
gh run view <run-id> -v  # View specific run
```

---

## When to Use Each Version Bump

| Scenario | Command | Example |
|----------|---------|---------|
| **Bug fix, patch** | `patch` | v1.0.0 → v1.0.1 |
| **New feature** | `minor` | v1.0.0 → v1.1.0 |
| **Breaking change** | `major` | v1.0.0 → v2.0.0 |

---

## What Happens When You Push a Tag

When you execute `git push origin vX.Y.Z`:

1. **GitHub detects tag** → Triggers release workflow
2. **Parse version** → Extracts X.Y.Z from tag
3. **Build Docker images** → Creates backend & frontend images
4. **Generate changelog** → From commits since last tag
5. **Create GitHub Release** → With release notes & images
6. **Send notifications** → Slack & email alerts
7. **Done!** → Release is live (~5-10 minutes total)

---

## Verify Release

### Check GitHub Releases Page
```
https://github.com/YOUR_ORG/ticket-booking-system/releases
```

### Pull and Test Docker Image
```bash
# Backend
docker pull your-username/ticket-booking-backend:vX.Y.Z
docker run -it your-username/ticket-booking-backend:vX.Y.Z npm run test

# Frontend  
docker pull your-username/ticket-booking-frontend:vX.Y.Z
```

### Update Docker Compose (for deployment)
```bash
# Edit docker-compose.yml
sed -i 's/latest/vX.Y.Z/g' docker-compose.yml

# Or manually update:
# app:
#   image: your-username/ticket-booking-backend:vX.Y.Z
# frontend:
#   image: your-username/ticket-booking-frontend:vX.Y.Z

# Restart services
docker-compose down
docker-compose up -d
```

---

## Required Secrets Setup (One-Time)

Configure in GitHub Settings → Secrets and Variables → Actions:

```
DOCKER_USERNAME     = your-dockerhub-username
DOCKER_PASSWORD     = your-dockerhub-token
SLACK_WEBHOOK_URL   = https://hooks.slack.com/services/...
```

Get Docker token: https://hub.docker.com/settings/security

---

## Rollback Previous Release

If critical issues found:

```bash
# Pull previous version
docker pull your-username/ticket-booking-backend:vX.Y.Z-1

# Update docker-compose.yml to previous version
# Then restart
docker-compose up -d
```

---

## Common Issues

### "Tag already exists"
```bash
# Delete local tag
git tag -d vX.Y.Z

# Delete remote tag
git push origin :refs/tags/vX.Y.Z

# Try again with new version
```

### "Docker push failed"
```bash
# Verify Docker credentials
echo $DOCKER_PASSWORD | docker login -u $DOCKER_USERNAME --password-stdin

# Check secrets in GitHub
Settings → Secrets and Variables → Actions
```

### "Workflow not starting"
```bash
# Verify tag format (must be vX.Y.Z)
git tag | grep v

# Push tag again
git push origin vX.Y.Z
```

---

## Release Checklist

Before pushing tag, verify:

- [ ] All tests passing: `npm run test:all`
- [ ] Coverage meets 50%: `npm run test:coverage`
- [ ] Versions updated: `grep '"version"' package.json`
- [ ] Git history is clean: `git log --oneline -5`
- [ ] Docker Hub credentials set in GitHub secrets
- [ ] Slack webhook configured (optional but recommended)

---

## Full Release Process (Detailed)

If you need more details, see `RELEASE_PROCESS.md` for:
- Semantic versioning strategy
- Full workflow diagrams
- Release notes template
- Emergency rollback procedures
- Best practices

---

## Need Help?

- View release workflow: `.github/workflows/release.yml`
- Read full guide: `RELEASE_PROCESS.md`
- Check GitHub Actions: https://github.com/YOUR_ORG/ticket-booking-system/actions
- View releases: https://github.com/YOUR_ORG/ticket-booking-system/releases

**Time estimate:** 5 minutes to create release, 10 minutes for workflow to complete
