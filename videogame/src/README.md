# Shattered Timeline Frontend

Complete frontend implementation for the Shattered Timeline 2D action videogame built with vanilla JavaScript, HTML5 Canvas, and ES6 modules.

## Quick Start

### Prerequisites
- Node.js (v14 or higher) for development server
- Modern web browser with ES6 module support
- Backend API running on port 3000 (see `../api/README.md`)

### Installation & Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd videogame/src
   ```

2. **Start the development server:**
   ```bash
   node server.js
   ```

3. **Access the game:**
   - **Landing Page:** `http://localhost:8080/`
   - **Registration:** `http://localhost:8080/pages/html/register.html`
   - **Login:** `http://localhost:8080/pages/html/login.html`
   - **Game:** `http://localhost:8080/pages/html/game.html`
   - **Admin Dashboard:** `http://localhost:8080/pages/html/admin.html`

4. **Verify setup:**
   - The frontend server runs on port 8080
   - API calls are made to the backend on port 3000
   - Static assets are served from the `assets/` directory

### Development Notes
- The frontend uses ES6 modules with native browser support
- No build tools or bundlers required for development
- Hot reload is not included - refresh browser for changes
- CORS is configured for development environment

## Project Structure

```
videogame/src/
├── README.md                    # Frontend documentation
├── main.js                      # Game entry point
├── server.js                    # Development server
├── config.js                    # Game configuration
├── draw.js                      # Drawing utilities
├── assets/                      # Game assets
│   ├── backgrounds/             # Background images
│   ├── sprites/                 # Character sprites
│   ├── sound_assets/            # Audio files
│   └── logos/                   # Game logos
├── pages/                       # Web pages
│   ├── css/                     # Stylesheets
│   │   ├── main.css             # Main styles
│   │   ├── style.css            # General styles
│   │   ├── admin.css            # Admin dashboard styles
│   │   └── credits.css          # Credits page styles
│   ├── html/                    # HTML templates
│   │   ├── landing.html         # Welcome page
│   │   ├── register.html        # Registration page
│   │   ├── login.html           # Login page
│   │   ├── game.html            # Main game page
│   │   ├── admin.html           # Admin dashboard
│   │   ├── stats.html           # Player statistics
│   │   └── credits.html         # Credits page
│   └── js/                      # Page scripts
│       ├── login.js             # Login logic
│       ├── register.js          # Registration logic
│       ├── admin.js             # Admin dashboard logic
│       └── landing.js           # Landing page logic
├── classes/                     # Game classes
│   ├── game/                    # Game engine
│   │   ├── Game.js              # Main game engine
│   │   ├── FloorGenerator.js    # Level generation
│   │   └── Game.legacy.js       # Legacy game version
│   ├── entities/                # Game entities
│   │   ├── Player.js            # Player character
│   │   ├── Enemy.js             # Base enemy class
│   │   ├── Boss.js              # Boss enemy
│   │   ├── Shop.js              # Shop system
│   │   ├── Projectile.js        # Projectile system
│   │   ├── RangedEnemy.js       # Ranged enemies
│   │   ├── MeleeEnemy.js        # Melee enemies
│   │   ├── Chest.js             # Treasure chests
│   │   ├── GameObject.js        # Base game object
│   │   ├── AnimatedObject.js    # Animation system
│   │   └── Coin.js              # Currency items
│   ├── rooms/                   # Room system
│   │   └── Room.js              # Room management
│   ├── ui/                      # UI components
│   │   └── PermanentUpgradePopup.js # User interface
│   ├── config/                  # Configuration
│   └── enemies/                 # Enemy types
├── utils/                       # Utilities
│   ├── api.js                   # API client
│   ├── saveStateManager.js      # Save system
│   ├── weaponUpgradeManager.js  # Weapon upgrades
│   ├── SimpleAudioManager.js    # Audio system
│   ├── BackgroundManager.js     # Background system
│   ├── EnhancedErrorHandler.js  # Error handling
│   ├── roomMapping.js           # Room configuration
│   ├── Logger.js                # Logging system
│   ├── auth.js                  # Authentication
│   ├── Vec.js                   # Vector math
│   ├── Rect.js                  # Rectangle math
│   ├── TextLabel.js             # Text rendering
│   └── utils.js                 # General utilities
├── constants/                   # Game constants
│   ├── gameEnums.js             # Game enumerations
│   └── gameConstants.js         # Game constants
```

## Core Files

### Entry Point & Configuration

#### `main.js` - Game Entry Point
**Purpose:** Initializes the game engine and starts the main game loop.

**Key Features:**
- Canvas setup and WebGL context initialization
- Game instance creation with proper initialization flow
- Main game loop with delta time management
- Error handling for game updates
- Logger system configuration

**Usage:** Called from `game.html` to start the game.

#### `config.js` - Game Configuration
**Purpose:** Central configuration file with all game constants and settings.

**Contains:**
- Canvas dimensions and rendering settings
- Player movement and animation configurations
- Hitbox scaling constants for collision detection
- Key bindings for player controls
- Animation frame definitions for different weapons
- Player movement and attack parameters

#### `server.js` - Development Server
**Purpose:** Simple HTTP server for serving frontend files during development.

**Features:**
- Static file serving with proper MIME types
- CORS configuration for ES6 module loading
- Automatic redirection from root to landing page
- Frontend-only routing (API calls routed to port 3000)
- 404 handling for missing resources

## Pages Directory

### HTML Templates (`pages/html/`)

#### `landing.html` - Welcome Page
- Game introduction and navigation
- Links to registration, login, and credits
- Main entry point for new users

#### `register.html` - User Registration
- New user account creation form
- Input validation and error handling
- Automatic redirect to login after successful registration

#### `login.html` - User Authentication
- User login form with session management
- "Remember me" functionality
- Automatic game launch after authentication

#### `game.html` - Main Game Interface
- HTML5 Canvas element for game rendering
- Game UI overlays and menus
- Pause menu and settings interface
- Integration point for the main game engine

#### `admin.html` - Administrative Dashboard
- Real-time player monitoring and analytics
- Game statistics and leaderboards
- Player progression tracking
- System administration tools

#### `stats.html` - Player Statistics
- Personal player statistics and achievements
- Historical game data visualization
- Performance metrics and progress tracking

#### `credits.html` - Game Credits
- Development team information
- Asset attribution and licensing
- Third-party library acknowledgments

### Stylesheets (`pages/css/`)

#### `main.css` - Primary Stylesheet
**Purpose:** Main styling for game interface and common elements.
- Game canvas styling and layout
- UI component styles (buttons, menus, overlays)
- Responsive design elements
- Animation definitions

#### `style.css` - General Page Styling
**Purpose:** Common styles for non-game pages.
- Form styling for login/registration
- Navigation and layout components
- Typography and color schemes

#### `admin.css` - Admin Dashboard Styling
**Purpose:** Specialized styling for the administrative interface.
- Dashboard layout and grid systems
- Chart and graph styling
- Data table presentations
- Admin-specific UI components

#### `credits.css` - Credits Page Styling
**Purpose:** Custom styling for the credits and about page.
- Team member card layouts
- Attribution styling
- Special effects and animations

### Page Scripts (`pages/js/`)

#### `login.js` - Authentication Logic
**Purpose:** Handles user login flow and session management.

**Key Features:**
- Form validation and submission
- API integration for user authentication
- Session token management
- Automatic game initialization after login
- Error handling and user feedback
- Run creation and restoration logic

#### `register.js` - Registration Logic
**Purpose:** Manages new user account creation process.

**Features:**
- Input validation (username, email, password)
- API integration for user registration
- Form submission handling
- Success/error message display
- Automatic redirect to login page

#### `admin.js` - Admin Dashboard Logic
**Purpose:** Powers the administrative dashboard with real-time data.

**Features:**
- Admin authentication and session management
- Real-time data fetching and display
- Chart generation and data visualization
- Player monitoring and analytics
- Administrative tools and controls
- Responsive data tables and filtering

#### `landing.js` - Landing Page Logic
**Purpose:** Simple navigation and session cleanup for the welcome page.

**Features:**
- Session state checking
- Navigation button handlers
- Local storage cleanup
- Page routing logic

## Classes Directory

### Core Game Engine (`classes/game/`)

#### `Game.js` - Main Game Engine (106KB, 2,870 lines)
**Purpose:** Central game engine coordinating all game systems.

**Key Responsibilities:**
- Player initialization with permanent upgrades
- Save state management and persistence
- Room transition logic and floor progression
- Audio system integration
- Settings management (volume, controls)
- Statistics tracking and backend synchronization
- Pause system and UI management
- Debug commands and development tools

**Major Systems:**
- Manager initialization (save state, weapon upgrades)
- Object lifecycle management (player, enemies, rooms)
- Event handling (keyboard input, room transitions)
- Statistics tracking (kills, damage, gold)
- Auto-save functionality
- Admin debug interface

#### `FloorGenerator.js` - Level Generation System (26KB, 644 lines)
**Purpose:** Manages floor progression, room generation, and run lifecycle.

**Key Features:**
- Procedural floor and room generation
- Run persistence and progression tracking
- Boss room placement and logic
- Room type determination (combat, shop, boss)
- Save state coordination with room data
- Run completion and new run creation

#### `Game.legacy.js` - Legacy Game Version (78KB, 2,125 lines)
**Purpose:** Previous version of the game engine (kept for reference).
- Contains older implementations
- Used for comparison and rollback if needed
- Not actively used in current game version

### Game Entities (`classes/entities/`)

#### `Player.js` - Player Character (55KB, 1,743 lines)
**Purpose:** Complete player character implementation with all mechanics.

**Features:**
- Movement and collision detection
- Combat system (melee and ranged weapons)
- Health, stamina, and resource management
- Weapon switching and upgrade system
- Animation state management
- Death handling and run completion
- Permanent upgrade application
- Shop interaction logic

#### `Enemy.js` - Base Enemy Class (17KB, 544 lines)
**Purpose:** Base class for all enemy types with shared behavior.

**Core Systems:**
- AI movement and pathfinding
- Combat mechanics and damage handling
- Health and state management
- Kill tracking and backend registration
- Collision detection with player and projectiles
- Loot dropping (gold coins)
- Animation and rendering

#### `Boss.js` - Boss Enemy Extension (4KB, 117 lines)
**Purpose:** Specialized boss enemy with enhanced mechanics.

**Features:**
- Extended health and damage values
- Special boss defeat handling
- Permanent upgrade reward triggering
- Fight duration tracking
- Enhanced visual effects

#### `Shop.js` - In-Game Shop System (17KB, 583 lines)
**Purpose:** Complete shop implementation for weapon upgrades.

**Features:**
- Weapon upgrade purchasing system
- Dynamic pricing based on current levels
- Backend purchase tracking
- Inventory management and display
- Player gold validation
- UI interaction handling

#### `Player.js` - Additional Player Systems
**Additional Features:**
- Dash mechanic with cooldown
- Weapon level synchronization
- Save state integration
- Stats tracking (damage dealt, kills)
- Room interaction (chests, transitions)

#### `Projectile.js` - Ranged Combat System (4.6KB, 160 lines)
**Purpose:** Handles projectiles for ranged weapons.

**Features:**
- Projectile physics and movement
- Collision detection with enemies
- Damage application and effects
- Visual rendering and animations

#### `RangedEnemy.js` - Ranged Enemy Type (6.1KB, 225 lines)
**Purpose:** Enemies that attack from a distance.

**Features:**
- Projectile-based combat
- Targeting and aiming logic
- Range detection and positioning
- Projectile spawning and management

#### `MeleeEnemy.js` - Melee Enemy Type (2.2KB, 85 lines)
**Purpose:** Close-combat enemy implementation.

**Features:**
- Close-range attack patterns
- Charge and retreat behaviors
- Direct damage application

#### `Chest.js` - Loot Container (4.1KB, 154 lines)
**Purpose:** Treasure chests that spawn after clearing rooms.

**Features:**
- Animated chest opening
- Gold reward distribution
- Collection state tracking
- Visual feedback effects

#### `GameObject.js` - Base Game Object (3.5KB, 113 lines)
**Purpose:** Base class for all interactive game objects.

**Core Features:**
- Position and movement handling
- Basic collision detection
- Rendering and update loops
- State management

#### `AnimatedObject.js` - Animation System (1.5KB, 49 lines)
**Purpose:** Handles sprite animation for game objects.

**Features:**
- Frame-based animation
- Animation timing and sequencing
- Sprite sheet management

#### `Coin.js` - Currency Item (437B, 18 lines)
**Purpose:** Collectible gold coins dropped by enemies.

**Features:**
- Simple pickup mechanics
- Gold value assignment
- Visual representation

## Utilities Directory (`utils/`)

### Core Managers

#### `api.js` - Backend Integration (29KB, 868 lines)
**Purpose:** Complete API client for all backend communication.

**Endpoints Covered:**
- Authentication (login, register, logout)
- User management (settings, statistics)
- Game state (save/load, weapon upgrades)
- Analytics (leaderboards, player progression)
- Admin functionality (dashboard data)

#### `saveStateManager.js` - Game Save System (18KB, 614 lines)
**Purpose:** Handles game state persistence between sessions.

**Features:**
- Auto-save functionality with configurable intervals
- Save state validation and error recovery
- Backend synchronization
- Session restoration logic
- Save data compression and optimization

#### `weaponUpgradeManager.js` - Weapon Progression (18KB, 649 lines)
**Purpose:** Manages temporary weapon upgrades during runs.

**Features:**
- Weapon level tracking per run
- Upgrade cost calculations
- Backend synchronization
- Reset on player death
- Weapon stats application

#### `SimpleAudioManager.js` - Audio System (6.4KB, 249 lines)
**Purpose:** Game audio management and playback.

**Features:**
- Background music for different floors
- Sound effect playback
- Volume control and settings
- Audio file loading and caching
- Cross-browser compatibility

#### `BackgroundManager.js` - Environment Rendering (6.4KB, 171 lines)
**Purpose:** Background image management and rendering.

**Features:**
- Floor-specific background loading
- Image preloading and caching
- Rendering optimization
- Dynamic background switching

### Specialized Utilities

#### `EnhancedErrorHandler.js` - Error Management (21KB, 696 lines)
**Purpose:** Comprehensive error handling and logging system.

**Features:**
- Error categorization and prioritization
- User-friendly error messages
- Automatic error reporting
- Recovery mechanisms
- Debug information collection

#### `enemyMapping.js` - Enemy Configuration (7.5KB, 231 lines)
**Purpose:** Maps enemy types to their respective classes and properties.

**Features:**
- Enemy type definitions
- Spawn probability configurations
- Floor-specific enemy distributions
- Difficulty scaling parameters

#### `roomMapping.js` - Room Generation Data (6.9KB, 203 lines)
**Purpose:** Room layout and type configuration data.

**Features:**
- Room type definitions
- Layout templates
- Spawn point configurations
- Room progression logic

#### `Logger.js` - Development Logging (2.5KB, 100 lines)
**Purpose:** Structured logging system for development and debugging.

**Features:**
- Log level management (DEBUG, INFO, WARN, ERROR)
- Formatted console output
- Performance monitoring
- Development vs production modes

#### `auth.js` - Authentication Helpers (1.9KB, 74 lines)
**Purpose:** Client-side authentication utilities.

**Features:**
- Session validation
- Token management
- Authentication state checking
- Logout handling

### Math and Utility Classes

#### `Vec.js` - Vector Mathematics (683B, 34 lines)
**Purpose:** 2D vector class for position and movement calculations.

**Features:**
- Vector arithmetic (add, subtract, multiply)
- Distance and magnitude calculations
- Direction normalization

#### `Rect.js` - Rectangle Operations (260B, 13 lines)
**Purpose:** Rectangle class for collision detection and UI bounds.

**Features:**
- Rectangle intersection testing
- Bounds checking
- Area calculations

#### `TextLabel.js` - Text Rendering (267B, 15 lines)
**Purpose:** Simple text label rendering utility.

**Features:**
- Text positioning and styling
- Canvas text rendering helpers

#### `utils.js` - General Utilities (606B, 20 lines)
**Purpose:** Miscellaneous utility functions.

**Features:**
- Common mathematical operations
- Helper functions for game logic
- Utility constants

## Constants Directory (`constants/`)

### `gameEnums.js` - Game Enumerations
**Purpose:** Defines all game constants, enums, and configuration values.

**Contains:**
- Room types and configurations
- Enemy types and properties
- Weapon configurations
- Game state enumerations
- Permanent upgrade definitions

### `gameConstants.js` - Game Constants
**Purpose:** Numerical constants and configuration values.

**Contains:**
- Damage values and health amounts
- Movement speeds and timing values
- Game balance parameters
- Floor and room constants

## UI Components (`ui/components/`)

#### `EnhancedLoadingSystem.js` - Loading Interface (23KB, 760 lines)
**Purpose:** Advanced loading system with progress tracking.

**Features:**
- Asset loading progress visualization
- Error state handling
- User feedback during loading
- Retry mechanisms for failed loads
- Loading screen animations

## Room and Enemy Systems

### Room Classes (`classes/rooms/`)
- Room generation and layout management
- Enemy spawning and placement
- Treasure and item generation
- Environmental interaction handling

### Enemy Types (`classes/enemies/`)
- Floor-specific enemy implementations
- AI behavior patterns
- Combat mechanics per enemy type
- Scaling difficulty across floors

### UI Classes (`classes/ui/`)
- Permanent upgrade selection interface
- In-game menus and overlays
- HUD elements and status displays
- Interactive UI components

## Game Features

### Core Gameplay
- **Movement:** WASD keyboard controls with smooth animation
- **Combat:** Melee and ranged weapon systems with upgrades
- **Progression:** 3 floors with 6 rooms each, boss battles
- **Persistence:** Save state system for session continuity
- **Economics:** Gold collection and weapon upgrade shop

### Technical Features
- **Canvas Rendering:** Optimized 2D rendering with sprite animations
- **Audio System:** Background music and sound effects
- **Save System:** Automatic and manual save state management
- **Analytics:** Player statistics and progression tracking
- **Admin Tools:** Real-time monitoring and analytics dashboard

### User Interface
- **Responsive Design:** Works on various screen sizes
- **Accessibility:** Keyboard navigation and clear visual feedback
- **Performance:** Optimized rendering and asset loading
- **Error Handling:** Graceful degradation and error recovery

## Development Guidelines

### Code Organization
- ES6 modules with clear dependency management
- Class-based architecture for game entities
- Separation of concerns between rendering and logic
- Consistent naming conventions and documentation

### Performance Considerations
- Asset preloading and caching
- Efficient collision detection
- Optimized rendering loops
- Memory management for long play sessions

### Browser Compatibility
- Modern browsers with ES6 module support
- HTML5 Canvas and Web Audio API requirements
- Graceful fallbacks for missing features

## Related Documentation

- **API Documentation:** `../api/README.md`
- **Database Documentation:** `../database/README.md`
- **General Project:** `../README.md`
- **Game Design:** See individual class files for detailed mechanics 