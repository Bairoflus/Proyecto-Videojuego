# Shattered Timeline - Complete Game Project

A full-stack 2D action videogame built with vanilla JavaScript, HTML5 Canvas, Express.js, and MySQL. Features include real-time combat, progressive difficulty, persistent player progress, and comprehensive analytics dashboard.

## Project Overview

**Shattered Timeline** is a dungeon-crawler action game where players battle through procedurally generated floors, defeat bosses, upgrade weapons, and gain permanent character improvements. The game features a complete backend with user authentication, save state management, analytics tracking, and an administrative dashboard for monitoring player activity.

### Game Features
- **3 Floors** with 6 rooms each (18 total rooms per run)
- **Combat System** with melee and ranged weapons
- **Progressive Difficulty** with floor-specific enemies and bosses
- **Weapon Upgrades** (temporary per run) and **Permanent Character Upgrades**
- **Save State System** for session continuity
- **Real-time Analytics** and player statistics
- **Admin Dashboard** for game monitoring and analytics

## Quick Start Guide

### Prerequisites
- **Node.js** v14 or higher
- **MySQL** Server 8.0 or higher
- Modern web browser with ES6 module support

### Complete Setup (5 Steps)

1. **Setup Database**
   ```bash
   # Connect to MySQL
   mysql -u root -p
   
   # Execute database scripts in order
   SOURCE /path/to/videogame/database/dbshatteredtimeline.sql;
   SOURCE /path/to/videogame/database/objects.sql;
   SOURCE /path/to/videogame/database/admin_user_setup.sql;
   ```

2. **Configure API**
   ```bash
   cd videogame/api
   npm install
   
   # Edit app.js lines 18-23 to match your MySQL settings
   # Default: host: localhost, user: tc2005b, password: qwer1234
   ```

3. **Start Backend API**
   ```bash
   cd videogame/api
   npm start
   # API will run on http://localhost:3000
   ```

4. **Start Frontend Server**
   ```bash
   cd videogame/src
   node server.js
   # Frontend will run on http://localhost:8080
   ```

5. **Access the Game**
   - **Play Game:** `http://localhost:8080/`
   - **Admin Dashboard:** `http://localhost:8080/pages/html/admin.html`
   - **Admin Credentials:** Username: `admin`, Password: `admin123`

## Project Structure

```
videogame/
├── README.md                    # This overview document
├── api/                         # Backend API (Express.js + MySQL)
│   ├── README.md               # API documentation and endpoints
│   ├── app.js                  # Main API server (47 endpoints)
│   ├── package.json            # Node.js dependencies
│   └── package-lock.json       # Lock file for dependencies
├── database/                    # Database structure and setup
│   ├── README.md               # Database documentation
│   ├── dbshatteredtimeline.sql # Main database schema (12 tables)
│   ├── objects.sql             # Views, triggers, procedures (25+ views)
│   ├── admin_user_setup.sql    # Admin user creation
│   └── ERDV4.pdf              # Entity Relationship Diagram
├── src/                        # Frontend source code
│   ├── README.md               # Frontend documentation
│   ├── server.js               # Development HTTP server
│   ├── main.js                 # Game entry point
│   ├── config.js               # Game configuration
│   ├── assets/                 # Game assets (sprites, audio, backgrounds)
│   ├── pages/                  # HTML pages, CSS, and page scripts
│   ├── classes/                # Core game logic and entities
│   ├── utils/                  # Utility functions and managers
│   ├── constants/              # Game constants and enumerations
│   └── ui/                     # Reusable UI components
└── [other project files]       # Additional documentation and assets
```

## Core Components

### Frontend (`src/`)
**Technology:** Vanilla JavaScript, HTML5 Canvas, ES6 Modules  
**Size:** 50+ files, ~500KB of source code

**Key Features:**
- **Game Engine:** Complete 2D game engine with sprite animation
- **Player System:** Movement, combat, health, stamina, weapon switching
- **Enemy AI:** Multiple enemy types with different behaviors
- **Shop System:** Weapon upgrade purchasing with gold currency
- **Save System:** Automatic and manual game state persistence
- **Audio System:** Background music and sound effects
- **UI Framework:** Menus, HUD, pause system, settings interface

**Major Files:**
- `Game.js` (106KB) - Main game engine coordinating all systems
- `Player.js` (55KB) - Complete player character implementation
- `FloorGenerator.js` (26KB) - Level generation and progression
- `api.js` (29KB) - Complete backend integration client

### Backend API (`api/`)
**Technology:** Express.js, MySQL, bcrypt  
**Size:** 47 REST endpoints, 1,897 lines of code

**Key Features:**
- **Authentication:** User registration, login, session management
- **Game State:** Save/load player progress, weapon upgrades
- **Analytics:** Player statistics, leaderboards, progression tracking
- **Admin API:** Real-time monitoring, dashboard data
- **Security:** Password hashing, session tokens, role-based access

**Endpoint Categories:**
- Authentication (3 endpoints)
- User Management (5 endpoints)
- Game Run Management (3 endpoints)
- Combat & Events (3 endpoints)
- Permanent & Weapon Upgrades (5 endpoints)
- Save State Management (3 endpoints)
- Analytics & Leaderboards (6 endpoints)
- Admin Panel & Charts (19 endpoints)

### Database (`database/`)
**Technology:** MySQL 8.0, InnoDB engine  
**Size:** 12 tables, 25+ views, comprehensive indexes

**Key Features:**
- **User Management:** Authentication, sessions, settings
- **Game Progress:** Run tracking, persistent counters, save states
- **Upgrade Systems:** Permanent upgrades, temporary weapon upgrades
- **Analytics:** Detailed tracking of kills, purchases, playtime
- **Admin Views:** Optimized queries for dashboard analytics

**Database Structure:**
- **Authentication:** `users`, `sessions`
- **Game State:** `save_states`, `user_run_progress`, `permanent_player_upgrades`
- **Analytics:** `player_stats`, `run_history`, `enemy_kills`, `boss_kills`
- **Configuration:** `player_settings`

## Game Mechanics

### Core Gameplay Loop
1. **Character Creation:** Register account and start first run
2. **Room Progression:** Battle through 6 rooms per floor
3. **Combat:** Use melee and ranged weapons against various enemies
4. **Shopping:** Spend gold on temporary weapon upgrades
5. **Boss Battles:** Defeat floor bosses for permanent upgrades
6. **Floor Progression:** Advance through 3 increasingly difficult floors
7. **Run Completion:** Complete run or restart on death with permanent upgrades

### Progression Systems

#### Temporary Upgrades (Per Run)
- **Weapon Levels:** Increase damage for current run only
- **Gold Currency:** Earned by defeating enemies, spent in shops
- **Room Progression:** Linear advancement through floor rooms

#### Permanent Upgrades (Persistent)
- **Health Boost:** +15 Maximum Health per upgrade
- **Stamina Boost:** +20 Maximum Stamina per upgrade
- **Movement Speed:** Percentage increase in movement speed
- **Progression:** Earned by defeating bosses, persist across runs

### Technical Systems

#### Save State Management
- **Automatic Saving:** Every 30 seconds during gameplay
- **Manual Saving:** On room transitions and significant events
- **Session Restoration:** Continue where you left off after logout
- **Data Validation:** Integrity checks for save state data

#### Analytics Tracking
- **Player Statistics:** Kills, damage dealt, playtime, gold earned
- **Run History:** Complete records of all game attempts
- **Performance Metrics:** Max damage hits, completion rates
- **Admin Monitoring:** Real-time player activity tracking

## Development Architecture

### Frontend Architecture
- **Module System:** ES6 modules with clear dependency management
- **Class Hierarchy:** Object-oriented design for game entities
- **Event System:** Keyboard input, collision detection, state changes
- **Rendering Pipeline:** Optimized Canvas 2D with sprite animations
- **State Management:** Game state, UI state, player progress

### Backend Architecture
- **REST API:** RESTful endpoints with standardized JSON responses
- **Database ORM:** Direct MySQL queries with connection pooling
- **Authentication:** Session-based auth with bcrypt password hashing
- **Error Handling:** Comprehensive error catching and user feedback
- **Logging:** Development and production logging systems

### Database Design
- **Normalization:** 3NF compliant schema design
- **Referential Integrity:** Foreign key constraints throughout
- **Performance:** Strategic indexing for frequently queried data
- **Views:** Pre-computed complex queries for dashboard performance
- **Triggers:** Automatic data management and validation

## Administrative Features

### Admin Dashboard
**Access:** `http://localhost:8080/pages/html/admin.html`  
**Credentials:** admin/admin123 or devteam/devteam2024

**Features:**
- **Player Monitoring:** Real-time active players and current games
- **Analytics:** Player progression, upgrade adoption, playtime stats
- **Leaderboards:** Top players by various metrics
- **Charts:** Activity trends, session duration, player distribution
- **System Status:** Database health, API performance monitoring

### Debug Tools
- **Console Commands:** Developer debugging interface in-game
- **State Inspection:** Real-time game state debugging
- **Room Debugging:** Force transitions, enemy manipulation
- **Session Management:** User session debugging and recovery

## Browser Compatibility

### Supported Browsers
- **Chrome** 88+ (recommended)
- **Firefox** 84+
- **Safari** 14+
- **Edge** 88+

### Required Features
- ES6 Modules support
- HTML5 Canvas and 2D Context
- Web Audio API
- Fetch API for HTTP requests
- Local Storage API

## Performance Specifications

### Frontend Performance
- **Target FPS:** 60 FPS gameplay
- **Memory Usage:** <100MB typical, <200MB maximum
- **Load Time:** <5 seconds on modern connections
- **Asset Size:** ~50MB total assets (sprites, audio, backgrounds)

### Backend Performance
- **API Response Time:** <100ms average
- **Database Queries:** <50ms average for complex queries
- **Concurrent Users:** Tested up to 50 simultaneous players
- **Session Management:** 24-hour session expiration

## Security Features

### Frontend Security
- **Input Validation:** Client-side validation with server verification
- **XSS Prevention:** Proper data sanitization and encoding
- **CORS Configuration:** Restricted cross-origin requests
- **Session Validation:** Token-based authentication

### Backend Security
- **Password Security:** bcrypt hashing with 10 salt rounds
- **SQL Injection Prevention:** Parameterized queries throughout
- **Session Management:** UUID tokens with expiration
- **Role-Based Access:** Player and admin role differentiation
- **Rate Limiting:** Protection against API abuse

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify MySQL server is running
   - Check credentials in `api/app.js`
   - Ensure database `dbshatteredtimeline` exists

2. **Frontend Not Loading**
   - Confirm both servers are running (ports 3000 and 8080)
   - Check browser console for ES6 module errors
   - Verify CORS settings and file permissions

3. **Game Performance Issues**
   - Check browser developer tools for memory leaks
   - Ensure hardware acceleration is enabled
   - Close other browser tabs for better performance

4. **Save State Problems**
   - Check API connectivity and authentication
   - Verify localStorage is not disabled
   - Clear browser cache and try again

### Support Resources
- **API Documentation:** `api/README.md`
- **Frontend Documentation:** `src/README.md`
- **Database Documentation:** `database/README.md`
- **Console Debugging:** Use browser developer tools and in-game debug commands

## Development Status

### Current Version
- **Frontend:** v3.0 - Complete game engine with full feature set
- **Backend:** v2.0 - Optimized API with comprehensive analytics
- **Database:** v3.0 - Enhanced schema with run persistence

### Recent Features
- Complete save state system with session restoration
- Permanent upgrade system with boss rewards
- Admin dashboard with real-time analytics
- Enhanced error handling and recovery systems
- Performance optimizations for long play sessions

### Technical Debt
- Legacy game engine kept for reference (`Game.legacy.js`)
- Some duplicate code between game systems
- CSS could be better organized and modularized
- Asset optimization for better loading performance

## License & Credits

### Development Team
- **Game Engine:** Custom 2D engine built with HTML5 Canvas
- **Backend:** Express.js with MySQL database
- **Art Assets:** Sprite collections and background images
- **Audio:** Background music and sound effect libraries

### Third-Party Libraries
- **Express.js** - Backend web framework
- **MySQL2** - Database connectivity
- **bcrypt** - Password hashing
- **Native Browser APIs** - Canvas, Web Audio, Fetch, LocalStorage

---

**Project Type:** Educational/Academic Game Development  
**Target Audience:** Developers learning full-stack game development  
**Complexity Level:** Intermediate to Advanced  
**Development Time:** Approximately 6 months for complete implementation 