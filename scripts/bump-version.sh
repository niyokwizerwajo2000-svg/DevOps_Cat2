#!/bin/bash

# Version Management Script for Ticket Booking System
# Usage: ./scripts/bump-version.sh <major|minor|patch>

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Get current version
get_current_version() {
    grep '"version"' "$PROJECT_ROOT/package.json" | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/'
}

# Increment semantic version
increment_version() {
    local version=$1
    local bump_type=$2
    
    # Split version into parts
    local major=$(echo $version | cut -d'.' -f1)
    local minor=$(echo $version | cut -d'.' -f2)
    local patch=$(echo $version | cut -d'.' -f3)
    
    case $bump_type in
        major)
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        minor)
            minor=$((minor + 1))
            patch=0
            ;;
        patch)
            patch=$((patch + 1))
            ;;
        *)
            print_error "Invalid bump type: $bump_type"
            exit 1
            ;;
    esac
    
    echo "${major}.${minor}.${patch}"
}

# Main script
main() {
    if [ $# -lt 1 ]; then
        print_error "Usage: $0 <major|minor|patch> [--yes|-y]"
        exit 1
    fi

    local bump_type=$1
    local auto_confirm=false
    if [ "$2" = "--yes" ] || [ "$2" = "-y" ]; then
        auto_confirm=true
    fi
    
    # Validate input
    if [[ ! "$bump_type" =~ ^(major|minor|patch)$ ]]; then
        print_error "Invalid bump type. Must be: major, minor, or patch"
        exit 1
    fi
    
    # Check if working directory is clean
    if ! git diff-index --quiet HEAD --; then
        print_error "Working directory is not clean. Please commit all changes first."
        exit 1
    fi
    
    # Get current version
    local current_version=$(get_current_version)
    if [ -z "$current_version" ]; then
        print_error "Could not determine current version from package.json"
        exit 1
    fi
    
    print_info "Current version: $current_version"
    
    # Calculate new version
    local new_version=$(increment_version "$current_version" "$bump_type")
    print_info "New version: $new_version"
    
    # Confirm with user (unless auto-confirmed)
    if [ "$auto_confirm" = false ]; then
        echo ""
        read -p "$(echo -e ${YELLOW}Bump version from $current_version to $new_version? \(y/n\) ${NC})" -n 1 -r
        echo

        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_warning "Cancelled."
            exit 0
        fi
    else
        print_info "Auto-confirm enabled; proceeding with bump."
    fi
    
    # Update backend package.json
    print_info "Updating backend/package.json..."
    sed -i "s/\"version\": \"$current_version\"/\"version\": \"$new_version\"/g" "$PROJECT_ROOT/package.json"
    print_success "Updated backend package.json"
    
    # Update frontend package.json
    print_info "Updating frontend/package.json..."
    sed -i "s/\"version\": \"$current_version\"/\"version\": \"$new_version\"/g" "$PROJECT_ROOT/frontend/package.json"
    print_success "Updated frontend package.json"
    
    # Update .env if VERSION variable exists
    if grep -q "VERSION=" "$PROJECT_ROOT/.env" 2>/dev/null; then
        print_info "Updating .env..."
        sed -i "s/VERSION=.*/VERSION=$new_version/g" "$PROJECT_ROOT/.env"
        print_success "Updated .env"
    fi
    
    # Create git tag
    print_info "Creating git commit..."
    git add "$PROJECT_ROOT/package.json" "$PROJECT_ROOT/frontend/package.json"
    git commit -m "chore: bump version to $new_version" || true
    print_success "Created commit"
    
    # Create and show git tag preview
    echo ""
    print_info "Next steps:"
    echo "  1. Review the changes: git diff HEAD~1"
    echo "  2. Create annotated tag:"
    echo "     git tag -a v$new_version -m \"Release version $new_version\""
    echo "  3. Push tag:"
    echo "     git push origin v$new_version"
    echo ""
    print_warning "This will trigger the release workflow automatically."
    echo ""
}

main "$@"
