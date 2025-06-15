# Shattered Timeline

## Game Design Document

---

## Index

1. Game Design
   1. Summary
   2. Gameplay
   3. Mindset
2. Technical
   1. Screens
   2. Controls
   3. Mechanics
3. Level Design
   1. Themes
   2. Game Flow
4. Development
   1. Abstract Classes
   2. Derived Classes
5. Graphics
   1. Style Attributes
   2. Graphics Needed
6. Sounds/Music
   1. Style Attributes
   2. Sounds Needed
   3. Music Needed
7. Background and Style
8. List of Assets
9. Schedule
10. Technical Implementation (Current State)

---

## 1. Game Design

### 1.1 Summary

**Shattered Timeline** is a top-down action roguelite where players fight through three floors with escalating difficulty. Players traverse procedurally generated rooms, battle diverse enemies and bosses, and gain both temporary weapon upgrades and permanent character upgrades. The game features a comprehensive progression system with persistent run tracking, player statistics, and strategic upgrade choices.

### 1.2 Gameplay

Each run consists of 3 floors with 6 rooms per floor: 4 combat rooms, 1 shop, and 1 boss room. Combat rooms spawn a golden chest (50 gold) after all enemies are defeated. Shops provide temporary weapon upgrades that last for the current run. Boss rooms contain powerful enemies that must be defeated to advance to the next floor. After defeating a boss, players receive permanent upgrade options.

**Current Gameplay Loop:**

- Start in Room 1, Floor 1
- Clear 4 combat rooms (collect gold from chests)
- Visit shop room to purchase temporary upgrades
- Defeat floor boss
- Choose from permanent upgrade options
- Progress to next floor
- After completing all 3 floors or death: Run counter increments, temporary progress resets

**Implemented Features:**
- Persistent run counter across sessions
- Boss battles with Floor 1 (Dragon Boss) and Floor 2 (Supersoldier)
- Permanent upgrade system (Health, Stamina, Movement Speed)
- Player statistics tracking (total runs, kills, gold earned, etc.)
- Save state system for session persistence
- Database backend with user authentication

### 1.3 Mindset

Shattered Timeline is built to reward mastery, adaptability, and persistence. Its loop emphasizes tension, progression, and surprise. Players are encouraged to experiment with builds and tactics across dynamic, escalating challenges while building permanent improvements to overcome increasing difficulty.

---

## 2. Technical

### 2.1 Screens

1. **Web Authentication System**
   - Landing page with game introduction
   - Login and registration forms
   - Session management with automatic logout

2. **Main Game Interface**
   - Full-screen canvas gameplay
   - HUD displaying: Health, Gold, Weapon levels, Run counter
   - Transition zone indicators

3. **Shop Interface**
   - Modal overlay during shop interactions
   - Purchase options with cost and effect information
   - Input validation for insufficient funds

4. **Permanent Upgrade Selection**
   - Post-boss upgrade selection interface
   - Three upgrade categories with clear descriptions
   - Progressive enhancement system

5. **Statistics Tracking**
   - Comprehensive player metrics
   - Run history and progression data
   - Backend database storage

### 2.2 Controls

- **Movement**: WASD or Arrow Keys (8-direction)
- **Weapons**: Q (Primary/Melee), E (Secondary/Ranged)
- **Attack**: Spacebar
- **Dash**: Left Shift (enhanced movement speed)
- **Shop Navigation**: WASD to navigate, Enter to purchase, ESC to exit
- **Room Transition**: Move to right edge of room when transition zone is active

### 2.3 Mechanics

**Current Combat System:**

| Action            | Stamina Cost | Damage        | Range    | Notes |
|-------------------|--------------|---------------|----------|--------|
| Melee Attack      | 0            | 10 + upgrades | 75px     | Line of sight detection |
| Ranged Attack     | 0            | 15 + upgrades | Projectile | Wall collision |
| Dash              | 0            | -             | 3x speed | Movement enhancement |

**Shop Upgrades (Per Run):**

| Upgrade Type      | Cost  | Effect      | Max/Run |
|-------------------|-------|-------------|---------|
| Melee Damage      | 35g   | +3 damage   | 15      |
| Ranged Damage     | 40g   | +4 damage   | 15      |
| Health Restore    | 50g   | Full HP     | Unlimited |

**Permanent Upgrades (Per Boss):**

| Upgrade Type      | Cost  | Effect          | Notes |
|-------------------|-------|-----------------|--------|
| Max Health        | Boss  | +15 HP per level| Persistent across runs |
| Max Stamina       | Boss  | +20 per level   | For future stamina system |
| Movement Speed    | Boss  | +10% per level  | Enhanced mobility |

**Enemy Types by Floor:**

| Floor | Enemy Types |
|-------|-------------|
| 1     | Goblin Dagger, Sword Goblin, Goblin Archer, Mage Goblin, Great Bow Goblin |
| 2     | Same enemy pool with increased difficulty |
| 3     | Same enemy pool with maximum difficulty |

**Boss Types:**

| Floor | Boss Type     | Special Abilities |
|-------|---------------|-------------------|
| 1     | Dragon Boss   | Enhanced combat stats |
| 2     | Supersoldier  | Advanced AI patterns |
| 3     | Dragon Boss   | Maximum difficulty scaling |

---

## 3. Level Design

### 3.1 Themes

Currently implemented with consistent dark fantasy theme across all floors. Future expansion planned for:
- **Floor 1**: Dungeon/Cave theme
- **Floor 2**: Advanced dungeon theme  
- **Floor 3**: Elite dungeon theme

### 3.2 Game Flow

1. Authentication and session creation
2. Floor 1: 4 combat rooms + shop + boss → permanent upgrade selection
3. Floor 2: 4 combat rooms + shop + boss → permanent upgrade selection
4. Floor 3: 4 combat rooms + shop + boss → permanent upgrade selection
5. Run completion or death: Statistics updated, new run begins

---

## 4. Development

### 4.1 Abstract Classes

- **AnimatedObject**: Base class for all game entities
- **Enemy**: Base class for all enemy types
- **Room**: Base class for all room types

### 4.2 Derived Classes

- **Player**: Complete player controller with combat, movement, and upgrade tracking
- **Enemies**: 
  - GoblinDagger (melee)
  - SwordGoblin (enhanced melee) 
  - GoblinArcher (ranged)
  - MageGoblin (magic ranged)
  - GreatBowGoblin (heavy ranged)
- **Bosses**:
  - DragonBoss (Floor 1 & 3)
  - Supersoldier (Floor 2)
- **Systems**:
  - FloorGenerator (procedural room generation)
  - Shop (upgrade purchasing system)
  - PermanentUpgradePopup (post-boss upgrades)

---

## 5. Graphics

### 5.1 Style Attributes

- Top-down pixel art style
- Dark base tones with bright highlights for UI elements
- Clear visual feedback for combat interactions
- Transition zone indicators for room navigation

### 5.2 Graphics Needed

- Character sprites for player and enemies
- Boss sprites with larger scale
- UI elements and HUD components
- Room backgrounds and environmental tiles
- Visual effects for attacks and abilities

---

## 6. Sounds/Music

### 6.1 Style Attributes

Currently not implemented. Planned implementation:
- Atmospheric background music
- Combat sound effects
- UI interaction sounds

### 6.2 Sounds Needed

- Combat effects (attacks, hits, deaths)
- UI interaction sounds
- Environmental audio

### 6.3 Music Needed

- Background tracks for different game states
- Boss battle music
- Ambient sound design

---

## 7. Background and Style

Shattered Timeline presents a dark fantasy world where players must overcome increasingly difficult challenges. The visual design emphasizes clarity and readability while maintaining atmospheric depth. Progression is conveyed through numerical feedback and permanent character development.

---

## 8. List of Assets

### Graphical

- Player character sprite and animations
- 5 enemy types with combat animations
- 2 boss sprites with enhanced visuals
- UI elements for HUD, shop, and upgrade systems
- Room backgrounds and environmental assets
- Visual effects for abilities and transitions

### Audio

- Currently not implemented
- Planned: Full audio suite for immersive experience

---

## 9. Schedule

**Completed Phases:**
1. ✓ Core entity and player framework
2. ✓ Enemy AI and combat systems
3. ✓ Room generation and progression
4. ✓ Combat mechanics and weapons
5. ✓ Boss implementation
6. ✓ Database backend and user system
7. ✓ Permanent upgrade system

**Future Development:**
1. Audio system implementation
2. Enhanced visual effects
3. Expanded enemy varieties
4. Additional boss types
5. Stamina system activation

---

## 10. Technical Implementation (Current State)

### Core Systems Implemented

#### Combat System
- **Melee Combat (Primary Weapon)**:
  - Range: 75px with line-of-sight detection
  - Visual feedback with colored attack indicators
  - Base damage: 10 + shop upgrades (max +45)
  - Wall collision prevention
  
- **Ranged Combat (Secondary Weapon)**:
  - Projectile-based system with physics
  - Base damage: 15 + shop upgrades (max +60)
  - Projectile collision with walls and enemies
  - Smooth tracking and visual effects

#### Shop System
- **Purchase Options**:
  1. Primary Weapon Upgrade: 35 gold, +3 damage, max 15/run
  2. Secondary Weapon Upgrade: 40 gold, +4 damage, max 15/run  
  3. Full Health Restore: 50 gold, unlimited purchases
- **Features**:
  - Visual activation zones in shop rooms
  - Real-time purchase validation
  - Persistent upgrade tracking per run
  - Intuitive navigation interface

#### Boss System
- **Dragon Boss (Floor 1 & 3)**:
  - Enhanced health and damage
  - Advanced AI patterns
  - Triggers permanent upgrade selection on defeat
  
- **Supersoldier (Floor 2)**:
  - Unique combat mechanics
  - Progressive difficulty scaling
  - Integration with progression system

#### Permanent Upgrade System
- **Three Categories**:
  - Max Health: +15 HP per level
  - Max Stamina: +20 per level (future system)
  - Movement Speed: +10% per level
- **Features**:
  - Database persistence across sessions
  - Calculated values for immediate application
  - Visual selection interface post-boss

#### Database Backend
- **User Authentication**:
  - Secure registration and login
  - Session management with tokens
  - Password hashing and validation
  
- **Statistics Tracking**:
  - Comprehensive run history
  - Player performance metrics
  - Gold economy tracking
  - Upgrade purchase history

#### Save System
- **Session Persistence**:
  - Room state preservation
  - Player position and status
  - Weapon upgrade levels
  - Run progress tracking

#### Progression System
- **Structure**: 
  - 3 floors per run, 6 rooms per floor
  - Procedural combat room generation (6-10 enemies)
  - Guaranteed shop and boss placement
  - Progressive difficulty scaling
  
- **Run Counter**:
  - Persistent across all sessions
  - Database synchronization
  - Increment on login, logout, and completion

#### Performance Optimizations
- **Efficient Collision Detection**: Optimized hitbox calculations
- **Event-driven Updates**: Reduced unnecessary computations
- **Memory Management**: Proper cleanup of game objects
- **State Synchronization**: Database triggers for consistency

### Current Enemy AI
- **Melee Enemies**: Pathfinding with player tracking
- **Ranged Enemies**: Line-of-sight attacks with projectile management
- **Weighted Spawning**: Balanced distribution for engaging encounters

### Controls
- **Movement**: WASD/Arrow keys with smooth 8-direction movement
- **Combat**: Spacebar for attacks, Q/E for weapon switching
- **Mobility**: Left Shift for dash ability
- **Interaction**: Context-sensitive shop and transition interactions

### Technical Stack
- **Frontend**: Pure JavaScript ES6 modules, Canvas API
- **Backend**: Node.js with Express.js REST API
- **Database**: MySQL with optimized views and triggers
- **Architecture**: MVC pattern with modular component design

### Current Limitations
- Audio system not yet implemented
- Stamina costs currently disabled (set to 0)
- Limited visual themes (single environment style)
- Basic enemy AI patterns

### Next Development Priorities
1. Audio system integration with context-appropriate sound design
2. Enhanced visual effects and particle systems
3. Stamina system activation with food mechanics
4. Expanded enemy AI with advanced behaviors
5. Additional boss types and floor themes