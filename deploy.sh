#!/bin/bash

# Build the project
echo "Building project..."
npm run build

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "Error: Not in a git repository"
    exit 1
fi

# Check if gh-pages branch exists
if git show-ref --verify --quiet refs/heads/gh-pages; then
    echo "gh-pages branch exists, switching to it..."
    git checkout gh-pages
    git pull origin gh-pages
else
    echo "Creating gh-pages branch..."
    git checkout --orphan gh-pages
    git rm -rf .
fi

# Copy dist contents to root
echo "Copying dist contents..."
cp -r dist/* .

# Add and commit
echo "Committing changes..."
git add .
git commit -m "Deploy to GitHub Pages - $(date)"

# Push to gh-pages branch
echo "Pushing to GitHub Pages..."
git push origin gh-pages

# Switch back to master
echo "Switching back to master branch..."
git checkout master

echo "Deployment complete! Your site should be available at:"
echo "https://santonastaso.github.io/tracc/"
