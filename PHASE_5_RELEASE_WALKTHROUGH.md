# Phase 5: Release Walkthrough - Step-by-Step Example

**Scenario:** You've completed Phase 4 (testing), fixed some bugs, and want to release version 0.1.1.

---

## 📍 Starting State

Current version in repository: **0.1.0**  
Branch: **main** (all tests passing)

---

## 🚀 Complete Release Walkthrough

### **Step 1: Ensure Tests Pass**

```bash
# On your main branch
$ git branch
* main
  develop

# Run the full test suite
$ npm run test:all

PASS  tests/unit/api.test.js
PASS  tests/integration/workflow.test.js

Test Suites: 2 passed, 2 total
Tests:       75 passed, 75 total
Coverage:    65%

✓ All tests passed!
```

### **Step 2: Verify Working Directory is Clean**

```bash
$ git status
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
```

✅ Good! No uncommitted changes.

### **Step 3: Run Version Bump Script**

```bash
$ ./scripts/bump-version.sh patch
ℹ Current version: 0.1.0
ℹ New version: 0.1.1
⚠ Bump version from 0.1.0 to 0.1.1? (y/n) y
ℹ Updating backend/package.json...
✓ Updated backend package.json
ℹ Updating frontend/package.json...
✓ Updated frontend package.json
ℹ Creating git commit...
✓ Created commit

Next steps:
  1. Review the changes: git diff HEAD~1
  2. Create annotated tag:
     git tag -a v0.1.1 -m "Release version 0.1.1"
  3. Push tag:
     git push origin v0.1.1
```

### **Step 4: Review Changes**

```bash
$ git log --oneline -3
a1b2c3d (HEAD -> main) chore: bump version to 0.1.1
b2c3d4e Merge pull request #45 from feature/user-auth
c3d4e5f Fix: correct seat availability calculation

$ git show --name-status
commit a1b2c3d
Author: DevOps Team <devops@example.com>
Date:   Mon Dec 10 2024 10:30:00 UTC

    chore: bump version to 0.1.1

M       package.json
M       frontend/package.json

# Check the actual changes
$ git diff HEAD~1 -- package.json | head -20
diff --git a/package.json b/package.json
index 1234567..abcdefg 100644
--- a/package.json
+++ b/package.json
@@ -1,7 +1,7 @@
 {
   "name": "ticket-booking-backend",
-  "version": "0.1.0",
+  "version": "0.1.1",
   "private": true,
   "main": "index.js",
   "license": "MIT",
```

✅ Looks good! Version bumped from 0.1.0 → 0.1.1

### **Step 5: Create Annotated Tag**

```bash
$ git tag -a v0.1.1 -m "Release version 0.1.1: Bug fixes and minor improvements"

$ git tag -l -n1 | grep 0.1.1
v0.1.1          Release version 0.1.1: Bug fixes and minor improvements

$ git log --oneline -3 --decorate
a1b2c3d (HEAD -> main, tag: v0.1.1) chore: bump version to 0.1.1
b2c3d4e Merge pull request #45 from feature/user-auth
c3d4e5f Fix: correct seat availability calculation
```

✅ Annotated tag created successfully!

### **Step 6: Push Tag to GitHub**

```bash
$ git push origin v0.1.1
Enumerating objects: 1, done.
Counting objects: 100% (1/1), done.
Writing objects: 100% (1/1), done.
Total 1 (delta 0), reused 0 (delta 0), pack-reused 0
To github.com:niyokwizerwajo2000-svg/DevOps_Cat2.git
 * [new tag]         v0.1.1 -> v0.1.1

$ git push origin main
Total 0 (delta 0), reused 0 (delta 0)
To github.com:niyokwizerwajo2000-svg/DevOps_Cat2.git
   b2c3d4e..a1b2c3d  main -> main
```

✅ Tag pushed! GitHub Actions workflow automatically triggered.

---

## 📊 Monitoring the Release Workflow

### **Step 7: Check GitHub Actions**

```bash
# Option 1: Using GitHub CLI
$ gh run list --workflow=release.yml -L 1

STATUS  TITLE              WORKFLOW     BRANCH  EVENT  CONCLUSION  STARTED             UPDATED
✓       Release & Deploy   release.yml  main    push   -           2024-12-10 10:35:00 2024-12-10 10:35:23

# Option 2: Visit GitHub Actions page
# https://github.com/niyokwizerwajo2000-svg/DevOps_Cat2/actions/workflows/release.yml
```

### **Step 8: Monitor Release Progress**

The workflow runs automatically with these stages:

**Timeline:**
```
10:35:00 - Workflow started (tag detected)
10:35:45 - Parse version job completed (v0.1.1 extracted)
10:36:00 - Build backend image started
10:36:00 - Build frontend image started (parallel)
10:39:30 - Images built, pushing to Docker Hub
10:41:15 - Generate changelog job started
10:41:30 - Changelog generated
10:41:45 - Create GitHub release started
10:42:00 - GitHub release created with notes
10:42:15 - Slack notification sent
10:42:30 - Email notification sent
✅ 10:42:45 - Workflow completed (total: ~7 minutes)
```

### **Step 9: Verify Workflow Results**

#### **A. Check GitHub Actions Details**

```bash
$ gh run view --workflow=release.yml
Status: ✓ completed successfully
Duration: 7m 45s

Jobs:
  parse-version     ✓ completed
  build-and-push    ✓ completed
  generate-changelog ✓ completed
  create-release    ✓ completed
  notify-release    ✓ completed
```

#### **B. Verify Docker Images on Docker Hub**

```bash
# Login to Docker Hub to view pushed images
# https://hub.docker.com/repositories/YOUR_USERNAME

Images pushed:
  ✓ ticket-booking-backend:v0.1.1
  ✓ ticket-booking-backend:latest
  ✓ ticket-booking-frontend:v0.1.1
  ✓ ticket-booking-frontend:latest

# Pull and verify locally
$ docker pull YOUR_USERNAME/ticket-booking-backend:v0.1.1
v0.1.1: Pulling from YOUR_USERNAME/ticket-booking-backend
bd3d2e1cb3f3: Already exists
...
Status: Downloaded newer image for YOUR_USERNAME/ticket-booking-backend:v0.1.1

# Verify image details
$ docker inspect YOUR_USERNAME/ticket-booking-backend:v0.1.1 | grep -i version
```

#### **C. Check GitHub Release Page**

Visit: `https://github.com/niyokwizerwajo2000-svg/DevOps_Cat2/releases`

**Release Page Contents:**
```
Release v0.1.1
Tags: main, v0.1.1
Published Dec 10, 2024 by github-actions[bot]

## Release v0.1.1

### What's Changed
- Fix: correct seat availability calculation (#44)
- Fix: handle concurrent bookings properly (#43)
- Fix: validate ticket price input (#42)
- chore: bump version to 0.1.1

### Docker Images
Docker images available at:
- Backend: `docker.io/YOUR_USERNAME/ticket-booking-backend:v0.1.1`
- Frontend: `docker.io/YOUR_USERNAME/ticket-booking-frontend:v0.1.1`

### Build Docker Images Locally
```bash
# Backend
docker build -t ticket-booking-backend:v0.1.1 .

# Frontend
docker build -t ticket-booking-frontend:v0.1.1 ./frontend
```
```

#### **D. Check Slack Notification**

If `SLACK_WEBHOOK_URL` is configured, you'll receive:

```
🎉 Release v0.1.1 published!

Backend: `YOUR_USERNAME/ticket-booking-backend:v0.1.1`
Frontend: `YOUR_USERNAME/ticket-booking-frontend:v0.1.1`
```

---

## ✅ Post-Release Verification

### **Test Pull and Run Released Images**

```bash
# Create new docker-compose file for testing release
$ cat > docker-compose.release.yml << 'EOF'
version: '3.8'

services:
  backend:
    image: YOUR_USERNAME/ticket-booking-backend:v0.1.1
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: "sqlite:tickets.db"

  frontend:
    image: YOUR_USERNAME/ticket-booking-frontend:v0.1.1
    ports:
      - "5173:80"
    depends_on:
      - backend
EOF

# Start services with released images
$ docker-compose -f docker-compose.release.yml up -d
Creating network "devops_cat_default" with the default driver
Pulling backend image...
Pulling frontend image...
Creating devops_cat_backend_1  ... done
Creating devops_cat_frontend_1 ... done

# Test the application
$ curl http://localhost:3000/api/tickets
{"success":true,"data":[]}

# Test frontend
$ curl http://localhost:5173
<!DOCTYPE html>
<html>
  <head>
    <title>Ticket Booking System</title>
  </head>
  ...

# Clean up
$ docker-compose -f docker-compose.release.yml down
```

### **Verify Version in Running Container**

```bash
# Check version from running container
$ docker inspect YOUR_USERNAME/ticket-booking-backend:v0.1.1 | jq '.[0].Config.Labels'
{
  "org.opencontainers.image.version": "v0.1.1"
}

# Or check from logs
$ docker run --rm YOUR_USERNAME/ticket-booking-backend:v0.1.1 \
  grep version package.json
  "version": "0.1.1",
```

---

## 📋 Release Checklist - Verification

- [x] Tests passed before release
- [x] Version bumped using script
- [x] Git commit created automatically
- [x] Annotated tag created
- [x] Tag pushed to GitHub
- [x] GitHub Actions workflow triggered automatically
- [x] Workflow completed successfully
- [x] Docker images built (backend & frontend)
- [x] Docker images pushed to Docker Hub
- [x] GitHub Release created with changelog
- [x] Slack notification sent
- [x] Email notification sent (if configured)
- [x] Docker images pullable and runnable
- [x] Version number correct in containers

---

## 🎯 Outcome

**Release v0.1.1 is now:**
- ✅ Tagged in Git (`v0.1.1`)
- ✅ Available on Docker Hub with version tags
- ✅ Documented with GitHub Release page
- ✅ Announced to team via Slack/email
- ✅ Ready for deployment to production
- ✅ Rollback-able to v0.1.0 if needed

---

## 📊 Release Comparison

| Aspect | v0.1.0 | v0.1.1 |
|--------|--------|--------|
| Backend Image | `YOUR_USERNAME/ticket-booking-backend:v0.1.0` | `YOUR_USERNAME/ticket-booking-backend:v0.1.1` |
| Frontend Image | `YOUR_USERNAME/ticket-booking-frontend:v0.1.0` | `YOUR_USERNAME/ticket-booking-frontend:v0.1.1` |
| Release Date | Dec 1, 2024 | Dec 10, 2024 |
| Changes | Initial release | Bug fixes (#42-44) |
| Tests Passing | 70/75 | 75/75 ✅ |

---

## 🔄 Next Release (v0.2.0)

When you're ready to release again:

```bash
# 1. Make changes and commit them
git checkout -b feature/new-feature
# ... make changes ...
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature

# 2. Create pull request and merge to main
# ... review and merge ...
git checkout main
git pull origin main

# 3. Run tests
npm run test:all

# 4. Bump version for minor (new feature)
./scripts/bump-version.sh minor
# This will bump from 0.1.1 → 0.2.0

# 5. Create and push tag
git tag -a v0.2.0 -m "Release v0.2.0: New feature X, Y, Z"
git push origin v0.2.0

# 6. Workflow runs automatically!
# All steps repeat, creating v0.2.0 release
```

---

## 🎓 Key Learnings

From this walkthrough, you've learned:

1. ✅ How to use the automated version bump script
2. ✅ How to create semantic version tags
3. ✅ How GitHub Actions automatically detects and builds releases
4. ✅ How Docker images are generated and pushed
5. ✅ How changelogs are auto-generated from commits
6. ✅ How GitHub Releases are created automatically
7. ✅ How team notifications work
8. ✅ How to verify released artifacts
9. ✅ How to pull and run released Docker images
10. ✅ How to track release progress

---

## 📞 Common Questions

**Q: How long does a release take?**
A: ~7-15 minutes depending on Docker layer caching.

**Q: Can I release multiple times per day?**
A: Yes! Each release is independent. Create a new tag and workflow runs automatically.

**Q: What if I make a mistake in the release?**
A: Delete the tag (`git tag -d v0.1.1`), fix the issue, and retry.

**Q: How do I rollback to a previous version?**
A: Update docker-compose.yml to use previous version tag and restart services.

**Q: Who has permission to create releases?**
A: Anyone with write access to the repository (push/merge permissions).

---

**Last Updated:** December 2024
**Status:** ✅ Phase 5 Complete
**Next:** Phase 6 (Deployment) or Production Use
