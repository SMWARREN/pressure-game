# 🎮 Pressure Game

A React + TypeScript pipe-puzzle game where players rotate tiles to connect goal nodes before closing walls crush them.

**Status:** Production-ready | **Build:** ✅ Passing | **Quality:** 🔒 Secured

## 🚀 Quick Start

### Development
```bash
npm install
npm run dev        # Start dev server at localhost:3000
npm run build      # Production build
npm run preview    # Preview production build
```

### Commands
```bash
npm run lint       # Run ESLint
npm run format     # Format with Prettier
npm run solve      # Solve a level with BFS algorithm
npm run generate:pressure   # Generate procedural levels
```

## 📁 Project Structure

```
pressure-game/
├── src/                           # Shared game logic
│   ├── game/                     # Game engine, modes, types
│   ├── utils/                    # Constants, utilities
│   └── hooks/                    # React custom hooks
├── apps/
│   ├── web/                      # React web app (Vite)
│   │   ├── src/                 # Web-specific components
│   │   └── components/          # Game UI components
│   └── mobile/                   # React Native app (Expo)
│       ├── app/                 # Expo Router navigation
│       └── components/          # Mobile UI components
├── docs/                         # Organized documentation
│   ├── INDEX.md                 # Documentation index
│   ├── setup/                   # Setup & configuration
│   ├── development/             # Development guides
│   ├── deployment/              # Deployment & operations
│   ├── architecture/            # Architecture & design
│   ├── testing/                 # Testing guides
│   └── mobile/                  # Mobile development
├── server/                       # PHP/MySQL backend (optional)
├── tests/                        # E2E tests (Playwright)
├── CLAUDE.md                     # Project guidelines for Claude Code
├── README.md                     # Project overview
└── package.json                  # Root monorepo configuration
```

## 🛠️ Tech Stack

- **Frontend:** React 19 + TypeScript + Vite
- **State:** Zustand v5
- **Styling:** Inline styles (no CSS-in-JS)
- **Backend:** PHP/MySQL (optional, for persistence)
- **Testing:** Playwright
- **Code Quality:** ESLint, TypeScript, SonarQube

## 📚 Documentation

**Start here:** [📖 **Docs Index** - Complete documentation guide](docs/INDEX.md)

### Quick Links
- **[Setup](docs/setup/)** - MySQL, PHP server, mobile dev environment
- **[Development](docs/development/)** - Adding modes, color system, architecture
- **[Mobile](docs/mobile/)** - Expo, iOS simulator, React Native setup
- **[Deployment](docs/deployment/)** - Production deployment, database migration
- **[Testing](docs/testing/)** - API testing, quality assurance

## 🖥️ Server Setup

The optional backend is in `/server`:

```bash
# PHP/MySQL (recommended)
cp server/.env.example .env
# Edit .env with your MySQL credentials
php -S localhost:8000 -t server/

# Node.js alternative
node server/server.example.js
```

See [docs/SETUP_PHP_SERVER.md](docs/SETUP_PHP_SERVER.md) for detailed instructions.

## ⚙️ Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# API Server
VITE_API_URL=http://localhost/api.php

# SonarQube Analysis
SONAR_TOKEN=your_token_here

# Database (for backend)
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=password
```

See [docs/SECURITY.md](docs/SECURITY.md) for security best practices.

## 🎯 Game Features

- **Multiple Modes:** Classic, Blitz, Zen, + 4 arcade modes
- **Achievements:** 13 unlockable achievements with progression
- **Leaderboards:** Global rankings per game mode
- **Persistence:** Save progress locally or to database
- **Offline Support:** Works completely offline with auto-sync
- **Procedural Levels:** Generate infinite custom levels
- **Replay System:** Watch and learn from your wins

## 🔐 Security

- No sensitive data in git (tokens moved to .env)
- Environment variables for all credentials
- .env files excluded from version control
- See [docs/SECURITY.md](docs/SECURITY.md) for details

## 📊 Code Quality

- **Build:** 1.0s ✅
- **Lint:** 0 violations ✅
- **Types:** TypeScript strict mode ✅
- **SonarQube:** Quality gate passing ✅

## 🧪 Testing

```bash
npm run test:e2e                 # Full test suite
npm run test:e2e:pressure        # Pressure mode tests
npm run test:solver:classic      # Solver tests
npm run test:e2e:ui              # Interactive test UI
```

## 🎨 Architecture

### State Management
- Central Zustand store (`src/game/store.ts`)
- Game flow: `tutorial → menu → idle → playing → won | lost`
- Reentrancy guards prevent race conditions
- Atomic timer cleanup on level load

### Game Modes
- Pluggable `GameModeConfig` system
- Each mode implements: `onTileTap`, `checkWin`, `checkLoss`, `onTick`
- Custom visuals via `tileRenderer`
- See [docs/ADDING_A_MODE.md](docs/ADDING_A_MODE.md)

### Persistence
- Swappable backends: localStorage, database, MySQL, syncing
- Offline-first with online sync
- Configurable via environment

## 📖 Game Rules

### Classic Mode (Pressure)
- Rotate tiles to create paths connecting nodes
- Walls close every 30 seconds (configurable)
- Limited moves available
- Goal: Connect all nodes before crush

### Blitz Mode
- Same rules as Classic
- No undo allowed
- Any crushed goal = instant loss

### Zen Mode
- No walls, no time limit
- Unlimited moves
- Pure puzzle solving

## 🤝 Contributing

1. Read [CLAUDE.md](CLAUDE.md) for development guidelines
2. Follow TypeScript strict mode
3. Keep components under 200 lines (use helpers)
4. Add tests for new features
5. Update docs if changing architecture

## 📄 License

MIT - See LICENSE file

## 🎓 Learning Resources

- **Pipe Solver:** `/src/cli/level-solver.ts` - BFS pathfinding algorithm
- **Level Generator:** `/src/cli/pressure-level-generator.ts` - Procedural generation
- **Game Engine:** `/src/game/engine/index.ts` - State management & timers
- **Achievement System:** `/src/game/achievements/engine.ts` - Progress tracking

## 🙋 Support

For issues or questions:
1. Check existing documentation in `/docs`
2. Review [CLAUDE.md](CLAUDE.md) for architecture details
3. Open an issue with detailed reproduction steps

---

**Made with ❤️ using React, TypeScript, and Zustand**
