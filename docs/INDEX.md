# Pressure Game Documentation Index

## Quick Links

### 🚀 Getting Started
- **[CLAUDE.md](../CLAUDE.md)** - Claude Code integration guide
- **[README.md](../README.md)** - Project overview and features

### 📱 Mobile Development
- [EXPO_CONVERSION_PLAN.md](mobile/EXPO_CONVERSION_PLAN.md) - Phase-by-phase Expo migration plan
- [EXPO_QUICK_REFERENCE.md](mobile/EXPO_QUICK_REFERENCE.md) - Quick mobile development reference
- [iOS Setup](../docs/mobile/iOS_SETUP.md) - iOS simulator configuration
- [iOS Troubleshooting](../docs/mobile/iOS_TROUBLESHOOTING.md) - iOS debugging guide

### ⚙️ Setup & Configuration
- [MySQL Quickstart](setup/QUICKSTART_MYSQL.md) - Database setup guide
- [PHP Server Setup](setup/SETUP_PHP_SERVER.md) - Backend server configuration
- [Mobile Development Guide](../docs/MOBILE_DEVELOPMENT.md) - Mobile app development setup

### 🛠️ Development
- [Adding a Game Mode](development/ADDING_A_MODE.md) - How to implement custom game modes
- [Mode Color System](development/MODE_COLOR_SYSTEM.md) - Color configuration for game modes
- [Game Architecture](architecture/PERSISTENCE_BACKENDS.md) - Backend architecture and data persistence

### 🏗️ Architecture & Design
- [Persistence Backends](architecture/PERSISTENCE_BACKENDS.md) - Storage system architecture
- [Security](architecture/SECURITY.md) - Security guidelines and best practices
- [Roadmap](architecture/ROADMAP.md) - Project roadmap and future features

### 🚀 Deployment & Operations
- [Deployment Guide](deployment/DEPLOYMENT.md) - Production deployment instructions
- [Database Migration](deployment/MIGRATION.md) - Schema migration guide

### ✅ Testing
- [Stats API Test Guide](testing/STATS_API_TEST_GUIDE.md) - Testing the statistics API

## Directory Structure

```
docs/
├── INDEX.md (this file)
├── setup/                    # Setup guides
│   ├── QUICKSTART_MYSQL.md
│   └── SETUP_PHP_SERVER.md
├── development/              # Development guides
│   ├── ADDING_A_MODE.md
│   └── MODE_COLOR_SYSTEM.md
├── deployment/               # Deployment & operations
│   ├── DEPLOYMENT.md
│   └── MIGRATION.md
├── architecture/             # Architecture & design
│   ├── PERSISTENCE_BACKENDS.md
│   ├── ROADMAP.md
│   └── SECURITY.md
├── testing/                  # Testing guides
│   └── STATS_API_TEST_GUIDE.md
└── mobile/                   # Mobile-specific docs
    ├── EXPO_CONVERSION_PLAN.md
    ├── EXPO_QUICK_REFERENCE.md
    ├── iOS_SETUP.md
    └── iOS_TROUBLESHOOTING.md
```

## Common Tasks

### I want to...
- **Add a new game mode** → See [development/ADDING_A_MODE.md](development/ADDING_A_MODE.md)
- **Deploy to production** → See [deployment/DEPLOYMENT.md](deployment/DEPLOYMENT.md)
- **Set up MySQL backend** → See [setup/QUICKSTART_MYSQL.md](setup/QUICKSTART_MYSQL.md)
- **Develop on mobile** → See [mobile/EXPO_CONVERSION_PLAN.md](mobile/EXPO_CONVERSION_PLAN.md)
- **Customize mode colors** → See [development/MODE_COLOR_SYSTEM.md](development/MODE_COLOR_SYSTEM.md)
- **Migrate database schema** → See [deployment/MIGRATION.md](deployment/MIGRATION.md)
- **Run on iOS simulator** → See [mobile/iOS_SETUP.md](mobile/iOS_SETUP.md)

## Key Files

### Root Level
- **CLAUDE.md** - Integration with Claude Code (architecture overview, commands, state machine)
- **README.md** - Project overview and main features

### Configuration
- **package.json** - Dependencies and scripts (web, mobile, testing, deployment)
- **tsconfig.json** - TypeScript configuration
- **.env.example** - Environment variables template

### Source Code
- **src/** - Shared game logic (engine, modes, UI components)
- **apps/web/** - Web application (React + Vite)
- **apps/mobile/** - React Native mobile app (Expo)
- **server/** - PHP backend for leaderboards and stats
