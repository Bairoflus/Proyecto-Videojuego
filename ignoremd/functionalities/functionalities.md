# Shattered Timeline - Game Functionalities

## Authentication System

### 1. User Registration
**How it works:**
- Frontend sends POST request to `/api/auth/register` with username, email, password
- Backend hashes password using bcrypt with 10 salt rounds
- Creates user in `users` table
- Database triggers automatically create `player_settings` and `player_stats` records
- Returns success with new `userId`

**Technical details:**
- Password encryption ensures security
- Duplicate detection prevents multiple accounts with same username/email
- Auto-initialization of player data via database triggers

### 2. User Login
**How it works:**
- Frontend sends POST request to `/api/auth/login` with credentials
- Backend verifies password using bcrypt comparison
- Creates new session with UUID token in `sessions` table
- Session expires after 24 hours
- Returns `sessionToken`, `userId`, `sessionId` for frontend storage

**Technical details:**
- Session-based authentication using secure tokens
- Automatic session cleanup on expiration
- Last login tracking for analytics

### 3. User Logout
**How it works:**
- Frontend sends POST request to `/api/auth/logout` with sessionToken
- Backend marks session as inactive and sets logout timestamp
- Frontend clears localStorage session data
- Enhanced logout clears all session-related keys

**Technical details:**
- Graceful session termination in database
- Complete localStorage cleanup prevents data contamination
- Emergency logout functionality for error scenarios

## Game Initialization

### 1. Game Setup
**How it works:**
- `main.js` creates canvas and initializes Game instance
- Game waits for `initializeGameAsync()` to complete before starting
- Loads player initialization data from backend via `/api/users/:id/initialization-data`
- Sets up FloorGenerator, Player, and Room systems
- Initializes managers (saveStateManager, weaponUpgradeManager)

**Technical details:**
- Asynchronous initialization prevents blocking
- Single API call loads all player data (run number, permanent upgrades, weapon levels)
- Manager initialization ensures backend integration

### 2. Save State Management
**How it works:**
- Auto-save every 30 seconds via `saveCurrentGameState()`
- Manual save on room transitions and critical events
- Backend stores in `save_states` table with room/floor position
- Load on game start via `/api/users/:id/save-state`
- Clear on player death via DELETE request

**Technical details:**
- State includes: health, gold, position, floor, room
- Deactivates old save states when creating new ones
- Emergency backup system for connection failures

## Core Gameplay

### 1. Player Movement
**How it works:**
- Input handled via keydown/keyup event listeners in Game.js
- WASD keys mapped to directional movement in `config.js`
- Player.js processes movement with collision detection
- Velocity-based movement with frame-rate independent delta time
- Canvas boundary constraints prevent off-screen movement

**Technical details:**
- Hitbox-based collision detection (60% of sprite size)
- Smooth interpolated movement using Vec utility class
- Direction-based sprite animation (9 directional sprites)
- Speed multiplier support for permanent upgrades

### 2. Combat System
**How it works:**
- Two weapon categories: melee (dagger/sword) and ranged (bow/slingshot)
- Space bar triggers attack, Q/E switches weapons
- Melee: raycast-based damage detection in front of player
- Ranged: projectile-based with collision detection
- Weapon levels (1-15) increase damage through weaponUpgradeManager

**Technical details:**
- Attack animations with proper frame timing
- Hitbox calculation for melee attacks using attack area
- Projectile physics with velocity and collision
- Weapon upgrade persistence across sessions

### 3. Enemy System
**How it works:**
- Room.js generates enemies procedurally on room entry
- Five enemy types with different behaviors:
  - GoblinDagger/SwordGoblin: melee attackers
  - GoblinArcher/MageGoblin/GreatBowGoblin: ranged attackers
- Enemy AI targets player position and attacks within range
- Death triggers gold drops and statistics tracking

**Technical details:**
- Weighted random enemy selection (common vs rare)
- Enemy-specific AI behaviors and attack patterns
- Health/damage systems with collision detection
- Automatic cleanup of dead enemies from room arrays

### 4. Room System
**How it works:**
- FloorGenerator creates 6 rooms per floor (4 combat, 1 shop, 1 boss)
- ASCII layout parsing creates walls, objects, and interactive zones
- Room transitions via edge detection (right edge trigger)
- State persistence maintains enemy/chest status per room

**Technical details:**
- Procedural generation with safe zones for player spawning
- Collision detection using rectangle intersection
- Room objects: walls, enemies, coins, chests, shops
- Transition validation prevents movement until room cleared

### 5. Progression System
**How it works:**
- 3 floors per run, 6 rooms per floor (18 total rooms)
- Boss rooms at end of each floor unlock next floor
- Run tracking via backend database with persistent run numbers
- Permanent upgrades available after boss defeats

**Technical details:**
- FloorGenerator manages current position and progression
- Backend tracks run history and statistics
- Permanent upgrade system affects base stats
- Floor advancement triggers save state updates

## Economy System

### 1. Currency System
**How it works:**
- Gold drops from defeated enemies (random amounts)
- Chests spawn after clearing combat rooms
- Gold persistence across room transitions
- Reset to 0 on player death

**Technical details:**
- Player.js manages gold collection and storage
- Room.js handles chest spawning logic
- Backend tracks gold earned/spent statistics
- Visual coin sprites with collection animations

### 2. Shop System
**How it works:**
- Shop rooms contain interactive zones for purchase UI
- Three upgrade types: melee weapon, ranged weapon, health
- Weapon upgrades increase damage and change sprite
- Health upgrades increase maximum health
- Shop interaction via collision detection with shop zones

**Technical details:**
- Shop.js manages UI and purchase logic
- Backend tracks purchases via `/api/runs/:id/weapon-purchase`
- weaponUpgradeManager persists upgrade levels
- Real-time price calculation based on current levels

### 3. Chest System
**How it works:**
- Chests spawn automatically when all enemies in combat room defeated
- Player collision with chest triggers collection
- Contains random gold amounts
- One chest per combat room, spawns near exit

**Technical details:**
- Chest.js handles spawning and collection logic
- Position calculation avoids wall collisions
- Collection state prevents multiple interactions
- Gold amount varies by room/floor difficulty

## UI/UX Features

### 1. HUD Elements
**How it works:**
- Health bar shows current/maximum health with red fill
- Stamina bar shows current/maximum stamina with yellow fill
- Gold counter displays with coin icon
- Weapon indicators show current weapon with highlighting
- Run/Floor/Room info displayed in bottom-right corner

**Technical details:**
- Canvas-based UI rendering in Game.js drawUI()
- Real-time updates based on player state
- Visual feedback with color coding and animations
- Responsive layout adapts to game state

### 2. Pause System
**How it works:**
- P key toggles pause state and shows overlay
- Three tabs: Controls, Stats, Settings
- Pause blocks all game updates except essential systems
- Settings allow volume/preference adjustments

**Technical details:**
- DOM-based overlay system separate from canvas
- Tab switching with JavaScript event handlers
- Game state preservation during pause
- Settings persistence via localStorage

### 3. Visual Feedback
**How it works:**
- Damage numbers appear on enemy hits
- Screen effects for critical events
- Transition messages for room clearing
- Boss defeat announcements with transition instructions

**Technical details:**
- Canvas-based effects with fade animations
- Timer-based message display systems
- Alpha blending for visual effects
- State-driven UI element visibility

## Technical Features

### 1. Performance Optimization
**How it works:**
- Frame rate management via requestAnimationFrame
- Efficient collision detection with early exit conditions
- Enemy array cleanup removes undefined/null entries
- Resource caching for sprites and animations

**Technical details:**
- Delta time-based updates for frame rate independence
- Optimized rectangle collision algorithms
- Memory management for projectiles and effects
- Sprite loading optimization

### 2. Debug System
**How it works:**
- Debug commands available in browser console
- Session data inspection via `gameSessionDebug`
- State validation and error reporting
- Performance monitoring capabilities

**Technical details:**
- Global debug objects accessible via window
- Comprehensive state inspection methods
- Error tracking with stack traces
- Development vs production feature flags

### 3. Error Handling
**How it works:**
- Graceful degradation when backend unavailable
- Test mode fallback for offline play
- Emergency save system on critical errors
- Connection retry logic for API calls

**Technical details:**
- Try-catch blocks around critical operations
- Fallback values for missing data
- Local storage backup mechanisms
- Error logging for debugging

## Statistics and Tracking

### 1. Run Statistics
**How it works:**
- Backend tracks via multiple tables: `run_history`, `enemy_kills`, `boss_kills`
- Real-time tracking during gameplay
- API calls register events: enemy kills, weapon purchases, boss defeats
- Statistics aggregated for leaderboards and analytics

**Technical details:**
- Event-driven tracking system
- Database triggers for automatic calculations
- API endpoints for each trackable event
- Statistical views for efficient querying

### 2. Player Statistics
**How it works:**
- Comprehensive player metrics via `vw_complete_player_stats` view
- Historical data across all runs
- Performance analytics: completion rates, best runs, playtime
- Permanent upgrade adoption tracking

**Technical details:**
- Database views provide pre-calculated statistics
- Efficient querying for large datasets
- Real-time and historical data separation
- Admin analytics for game balancing

## Save System

### 1. State Management
**How it works:**
- `saveStateManager.js` handles all save/load operations
- Automatic saving on room transitions and critical events
- State includes: position, health, gold, floor, room
- Version tracking prevents save corruption

**Technical details:**
- JSON serialization for complex state objects
- Database storage with metadata
- Conflict resolution for concurrent saves
- Migration support for save format changes

### 2. Data Persistence
**How it works:**
- Local storage for session data
- Database persistence for long-term saves
- Sync between local and remote state
- Backup mechanisms for data recovery

**Technical details:**
- Multi-layer persistence strategy
- Data validation before save/load
- Encryption for sensitive data
- Automatic cleanup of old saves

## Backend API Architecture

### Database Structure
**How it works:**
- Optimized MySQL database with views and triggers
- Efficient queries using indexed columns
- Automatic data calculations via database triggers
- Role-based access control for admin features

**Technical details:**
- 15+ database views for different data perspectives
- Triggers handle complex calculations automatically
- Foreign key constraints ensure data integrity
- Optimized indexes for performance

### API Endpoints
**How it works:**
- RESTful API design with clear endpoint structure
- Consistent response format across all endpoints
- Error handling with appropriate HTTP status codes
- Rate limiting and security measures

**Technical details:**
- Express.js framework with middleware
- MySQL connection pooling for performance
- CORS configuration for cross-origin requests
- Input validation and sanitization

### Admin Features
**How it works:**
- Separate admin authentication system
- Role-based access control
- Comprehensive analytics dashboard
- Real-time player monitoring

**Technical details:**
- Admin-only endpoints with authentication middleware
- Advanced analytics views and calculations
- Chart-ready data formatting
- System monitoring capabilities 