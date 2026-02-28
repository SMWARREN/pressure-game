# SonarQube Local Analysis Guide

This project is configured to run code quality analysis using SonarQube Community Edition via Docker.

## Prerequisites

- **Docker Desktop** installed and running
  - [Download Docker Desktop for Mac](https://www.docker.com/products/docker-desktop)
  - Or install via Homebrew: `brew install --cask docker`

## Quick Start

### 1. Start SonarQube Server

```bash
npm run sonar:start
```

This will:
- Pull and run the SonarQube Docker container
- Start the server on `http://localhost:9000`
- Print login credentials (admin/admin)

Wait ~30 seconds for the server to fully initialize before running analysis.

### 2. Run Code Analysis

```bash
npm run sonar:analyze
```

This will scan your `src/` directory and upload results to the local SonarQube server.

### 3. View Results

Open your browser to [http://localhost:9000](http://localhost:9000)

**Login:**
- Username: `admin`
- Password: `admin`

Click on **Projects** → **Pressure Game** to see:
- Code coverage
- Code smells
- Bugs and vulnerabilities
- Duplications
- Code complexity

## Commands Reference

```bash
# Start SonarQube server (one-time per session)
npm run sonar:start

# Run analysis against local files
npm run sonar:analyze

# Stop and remove SonarQube container
npm run sonar:stop
```

## What Gets Analyzed

The analysis includes:
- **TypeScript files** in `src/`
- **Code quality issues**: smells, bugs, security vulnerabilities
- **Duplicated code** detection
- **Code complexity** metrics
- **Test coverage** (if coverage reports available)

### Excluded from Analysis
- `/node_modules/` — dependencies
- `/dist/` — build output
- `**/*.d.ts` — type definitions
- Test files (but analyzed for quality)

## Tips

### First Run Takes Longer
The initial analysis may take 1-2 minutes depending on your machine. Subsequent runs are faster.

### Quality Thresholds
SonarQube sets default quality gates. You can adjust them in the web UI:
1. Go to **Administration** → **Quality Gates**
2. Click **Sonar way** to view/edit conditions
3. Common metrics: Coverage %, Duplication %, Code Smells, etc.

### Real-Time Feedback
Run analysis after major code changes to:
- Identify code quality regressions
- Find potential bugs before they reach production
- Track code complexity trends
- Monitor technical debt

### Troubleshooting

**"Connection refused" error:**
```bash
# Check if SonarQube is running
docker ps | grep sonarqube

# If not running, start it
npm run sonar:start
```

**Need to reset credentials:**
```bash
npm run sonar:stop
npm run sonar:start
```

**Low system memory:**
```bash
# Increase Docker memory limit in Docker Desktop settings
# Settings → Resources → Memory (recommend 4GB+)
```

## Integration with CI/CD

To use SonarQube in CI/CD pipelines, store your authentication token:

```bash
# Get a token from SonarQube web UI
# Administration → Security → Users → Click user → Generate Token

# Use in CI scripts
npm run sonar:analyze -- -Dsonar.login=YOUR_TOKEN_HERE
```

## References

- [SonarQube Documentation](https://docs.sonarqube.org/)
- [SonarQube Scanner CLI](https://docs.sonarqube.org/latest/analysis/scan/sonarscanner/)
- [TypeScript Plugin](https://docs.sonarqube.org/latest/analysis/languages/typescript/)
