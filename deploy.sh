#!/bin/bash

set -e  # Exit on any error

echo "🚀 Starting GitHub Pages deployment..."

# Build the project
echo "📦 Building project..."
npm run build

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Get the remote name (usually 'origin' or check what's available)
remote_name=$(git remote | head -n1)
if [ -z "$remote_name" ]; then
    echo "❌ Error: No git remote found"
    exit 1
fi
echo "📡 Using remote: $remote_name"

# Ensure we're on master branch
current_branch=$(git branch --show-current)
if [ "$current_branch" != "master" ]; then
    echo "⚠️  Warning: Not on master branch (currently on $current_branch)"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if gh-pages branch exists
if git show-ref --verify --quiet refs/heads/gh-pages; then
    echo "📋 gh-pages branch exists, switching to it..."
    git checkout gh-pages
    git pull "$remote_name" gh-pages
else
    echo "🆕 Creating gh-pages branch..."
    git checkout --orphan gh-pages
    git rm -rf . 2>/dev/null || true
fi

# Copy dist contents to root
echo "📁 Copying dist contents..."
# Go back to master to get the dist folder
git checkout master
cp -r dist/* .
# Switch back to gh-pages
git checkout gh-pages

# Add .nojekyll file to prevent Jekyll processing
echo "" > .nojekyll

# Add and commit
echo "💾 Committing changes..."
git add .
git commit -m "Deploy to GitHub Pages - $(date '+%Y-%m-%d %H:%M:%S')" || echo "No changes to commit"

# Push to gh-pages branch
echo "⬆️  Pushing to GitHub Pages..."
git push "$remote_name" gh-pages

# Switch back to original branch
echo "🔄 Switching back to $current_branch branch..."
git checkout "$current_branch"

echo "✅ Deployment complete! Your site should be available at:"
echo "🌐 https://santonastaso.github.io/tracc/"
echo ""
echo "📝 Note: It may take a few minutes for the changes to be visible."