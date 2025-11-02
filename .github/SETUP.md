# GitHub Actions Setup

This repository uses GitHub Actions for automated releases with semantic-release.

## What's Automated

- ✅ **CI/CD**: Tests and builds on every push
- ✅ **Semantic Versioning**: Automatic version bumps based on commit messages
- ✅ **CHANGELOG**: Auto-generated from commits
- ✅ **GitHub Releases**: Created automatically with release notes

## Setup Steps

### 1. GitHub Token (Already Configured)

The `GITHUB_TOKEN` is automatically provided by GitHub Actions. No setup needed! ✅

### 2. NPM Token (Optional - Only if Publishing to npm)

Since we're not publishing to npm (`npmPublish: false`), you don't need this. But if you want to publish later:

1. Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Create a new **Automation** token
3. Add it to GitHub Secrets:
   - Go to: https://github.com/raydot/ten-day-weather-tracker/settings/secrets/actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Your npm token

### 3. Enable GitHub Actions

1. Go to: https://github.com/raydot/ten-day-weather-tracker/settings/actions
2. Ensure "Allow all actions and reusable workflows" is selected
3. Under "Workflow permissions", select:
   - ✅ "Read and write permissions"
   - ✅ "Allow GitHub Actions to create and approve pull requests"

## How It Works

### Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Patch release (1.0.0 → 1.0.1)
git commit -m "fix: correct database connection timeout"

# Minor release (1.0.0 → 1.1.0)
git commit -m "feat: add new weather API endpoint"

# Major release (1.0.0 → 2.0.0)
git commit -m "feat!: change API response format

BREAKING CHANGE: API now returns data in different structure"

# No release
git commit -m "docs: update README"
git commit -m "chore: update dependencies"
```

### Release Process

1. **Make changes** and commit with conventional commit messages
2. **Push to `main` or `cloud-migration`** branch
3. **GitHub Actions runs automatically**:
   - Analyzes commits
   - Determines version bump
   - Updates `package.json` and `CHANGELOG.md`
   - Creates git tag
   - Creates GitHub Release
   - Commits changes back to repo

### Manual Release (Local)

If you want to test locally:

```bash
cd backend
npm run release -- --no-ci
```

## Workflows

### CI Workflow (`.github/workflows/ci.yml`)
- Runs on: Every push and PR
- Does: Tests, security audit, Docker build

### Release Workflow (`.github/workflows/release.yml`)
- Runs on: Push to `main` or `cloud-migration`
- Does: Semantic release (version bump, changelog, GitHub release)

## Troubleshooting

### Release didn't trigger
- Check commit messages use conventional format
- Verify GitHub Actions is enabled
- Check workflow permissions

### Permission denied errors
- Ensure "Read and write permissions" is enabled in repo settings
- Check that `GITHUB_TOKEN` has proper permissions

### NPM publish errors
- We have `npmPublish: false`, so this shouldn't happen
- If you enable npm publishing, ensure `NPM_TOKEN` is set

## Next Steps

After pushing your changes:

1. Go to: https://github.com/raydot/ten-day-weather-tracker/actions
2. Watch the workflows run
3. Check the "Releases" page for your new release
4. View the auto-generated CHANGELOG.md
