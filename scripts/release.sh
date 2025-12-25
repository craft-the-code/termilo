#!/bin/bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get current version from package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")

echo -e "${YELLOW}📦 Termilo Release Helper${NC}"
echo ""
echo -e "Current version: ${GREEN}$CURRENT_VERSION${NC}"
echo ""
read -p "Enter new version (e.g., 1.0.1): " NEW_VERSION

if [ -z "$NEW_VERSION" ]; then
    echo -e "${RED}❌ No version provided${NC}"
    exit 1
fi

# Validate version format
if ! [[ $NEW_VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo -e "${RED}❌ Invalid version format. Use semantic versioning (e.g., 1.0.0)${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}📝 Updating version to $NEW_VERSION...${NC}"

# Update package.json
npm version "$NEW_VERSION" --no-git-tag-version

# Update Cargo.toml
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/^version = \".*\"/version = \"$NEW_VERSION\"/" src-tauri/Cargo.toml
else
    # Linux
    sed -i "s/^version = \".*\"/version = \"$NEW_VERSION\"/" src-tauri/Cargo.toml
fi

echo -e "${GREEN}✅ Version files updated${NC}"

# Show git diff
echo ""
echo -e "${YELLOW}📋 Changes:${NC}"
git diff package.json src-tauri/Cargo.toml

echo ""
read -p "Commit and create release tag? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Commit changes
    git add package.json package-lock.json src-tauri/Cargo.toml src-tauri/Cargo.lock
    git commit -m "chore: bump version to v$NEW_VERSION"
    
    # Create tag
    git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"
    
    # Push
    echo ""
    echo -e "${YELLOW}🚀 Pushing to remote...${NC}"
    git push origin main
    git push origin "v$NEW_VERSION"
    
    echo ""
    echo -e "${GREEN}✅ Release v$NEW_VERSION tagged and pushed!${NC}"
    echo -e "${YELLOW}🔨 GitHub Actions is building the release${NC}"
    echo -e "${YELLOW}📦 Check progress: https://github.com/craft-the-code/termilo/actions${NC}"
else
    echo -e "${RED}❌ Release cancelled${NC}"
    echo -e "${YELLOW}💡 To revert changes: git checkout package.json src-tauri/Cargo.toml${NC}"
    exit 0
fi