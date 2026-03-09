# Project Reports

This directory contains generated analysis and coverage reports.

## Available Reports

### Code Coverage Report
- **File:** [COVERAGE_BREAKDOWN.txt](COVERAGE_BREAKDOWN.txt)
- **Date:** 2026-03-07
- **Coverage:** 23% overall (target: 80%)
- **Status:** Reference document

### SonarQube Analysis Report
- **File:** [SONAR_ANALYSIS_REPORT.txt](SONAR_ANALYSIS_REPORT.txt)
- **Date:** 2026-03-07
- **Build Quality:** Production-ready
- **Status:** Reference document

## Regenerating Reports

To regenerate the SonarQube analysis report:

```bash
npm run sonar:analyze
```

To view test coverage:

```bash
npm run test:coverage
```

## Notes

These are reference documents showing the project's code quality at a specific point in time. They may not reflect the current state of the codebase. Run the commands above to generate fresh reports.
