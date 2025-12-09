#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

echo "Reading version from backend package.json..."
VERSION=$(node -p "require('./package.json').version")

if [ -z "$VERSION" ]; then
  echo "Could not read version"
  exit 1
fi

TAG=v${VERSION}

echo "Creating annotated tag: $TAG"
git tag -a "$TAG" -m "Release $TAG"

echo "Pushing tag to origin: $TAG"
git push origin "$TAG"

echo "Tag pushed: $TAG"

echo "Note: pushing this tag will trigger the release workflow on GitHub if configured."
