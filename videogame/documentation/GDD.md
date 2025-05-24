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

**Shattered Timeline** is a top-down action roguelite where players fight through three temporal zones—past, present, and future—to restore order. Players traverse procedurally designed rooms, battle evolving enemies and bosses, and gain both temporary and permanent upgrades. Core systems include food-based stamina management, dual-weapon combat, and strategic base development.

### 1.2 Gameplay

Each run consists of 3 floors with 6 rooms per floor: 4 combat rooms, 1 shop, and 1 boss room. Combat rooms spawn a golden chest (50 gold) after all enemies are defeated. Shops provide temporary weapon upgrades that last for the current run. The game features a persistent run counter that tracks total attempts across all sessions.

**Current Gameplay Loop:**

- Start in Room 1, Floor 1
- Clear 4 combat rooms (collect gold from chests)
- Visit shop room to purchase upgrades
- Defeat floor boss (not yet implemented)
- Progress to next floor
- After death: Run counter increments, all progress resets

**Planned Features:**
- Post-boss permanent upgrades
- Food system affecting stamina regeneration
- Base hub with persistent upgrades
- Difficulty scaling per run

### 1.3 Mindset

Shattered Timeline is built to reward mastery, adaptability, and persistence. Its loop emphasizes tension, progression, and surprise. Players are encouraged to experiment with builds and tactics across dynamic, escalating challenges.

---

## 2. Technical

### 2.1 Screens

1. **Web Login Screens**
   - Logo + color-themed background
   - Buttons: Login, Create Account
   - Form validation: usernames, emails, password checks

2. **Main UI after login**
   - Canvas with: "Welcome, *username*", Logout button
   - Options: Start Game, Options, Player Statistics, Credits

3. **Game Screens**
   - Inventory
   - HUD: Health, Stamina, Weapons, Gold, Permanent Upgrades

4. **Pause Menu**
   - Resume, Options, Player Stats, Return to Main Menu

5. **Options Menu**
   - Controls, Audio Sliders

6. **Statistics Pop-up**
   - Deaths, Enemies Killed, Runs Played/Completed, Time Played, Max Kills/Damage/Run, Gold Spent/Earned

### 2.2 Controls

- 8-direction movement (WASD)
- Dash (Spacebar) – 1u movement
- Actions: Attack, Interact
- All controls are remappable

### 2.3 Mechanics

**Current Combat System:**

| Action            | Stamina Cost | Damage        | Range    |
|-------------------|--------------|---------------|----------|
| Melee Attack      | 0 (temp)     | 10 + upgrades | 75px     |
| Ranged Attack     | 0 (temp)     | 15 + upgrades | Projectile |
| Dash              | 0 (temp)     | -             | 3x speed |

**Shop Upgrades (Per Run):**

| Upgrade Type      | Cost  | Effect      | Max/Run |
|-------------------|-------|-------------|---------|
| Melee Damage      | 35g   | +3 damage   | 15      |
| Ranged Damage     | 40g   | +4 damage   | 15      |
| Health Restore    | 50g   | Full HP     | ∞       |

**Planned Stamina System:**

| Action            | Cost  |
|-------------------|--------|
| Melee Attack       | 8 pts |
| Projectile Attack  | 12 pts |
| Dash               | 10 pts |

**Stamina Regen by Food Level:**

| Food Level       | Regen Multiplier | Regen Rate | Penalty    |
|------------------|------------------|------------|------------|
| Satiated         | 1.5x             | 30 pts/s   | -          |
| Well Fed         | 1x               | 20 pts/s   | -          |
| Hungry           | 0.6x             | 12 pts/s   | -          |
| Weak             | 0.3x             | 6 pts/s    | -          |
| Malnourished     | 0.1x             | 2 pts/s    | -5 HP/s    |

**Food Types:**

| Food                     | Effect  |
|--------------------------|---------|
| Watermelon, Meat         | +50%    |
| Apple, Salad             | +25%    |
| Grapes, Spicy Snacks     | +10%    |

**Upgrades:**

- Health: +15 HP (100 gold)
- Stamina: +20 (100 gold)
- Melee/Ranged Damage: +4 (100 gold)
- Speed: +0.02u (100 gold)

---

## 3. Level Design

### 3.1 Themes

- **Past**: Swamp, Forest, Caves, Plains
- **Present**: Destroyed City, Abandoned Factory, Schools, Park
- **Future**: Metal Deck, Spaceship, Mars, Alien Landscape

### 3.2 Game Flow

1. Base Hub
2. Floor 1: 4 rooms + shop + boss → permanent upgrade
3. Floor 2: 4 rooms + shop + boss → permanent upgrade
4. Floor 3: 4 rooms + shop + boss → permanent upgrade
5. Loop reset: Floors reshuffle, enemies buffed

---

## 4. Development

### 4.1 Abstract Classes

- BaseEntity, BasePlayer, BaseEnemy, BaseWeapon, BaseItem, BaseRoom, BaseBoss

### 4.2 Derived Classes

- **Player**: Inventory, Movement, Dash, Combat, Stats
- **Enemies** (per floor):
  - Past: Goblin variants (dagger, archer, mage, sword)
  - Present: Bandits, Snipers, Police, Mutants
  - Future: Robots, Drones, Alien Slaves, Warriors
- **Bosses** (per floor):
  - Past: Dragon, Ogre
  - Present: Supersoldier, Criminal
  - Future: Alien, Mecha
- **Items**: Bandages, Antidotes, Potions, Scrolls
- **Weapons**: Dagger, Katana, Lightsaber, Bows, Recurve Bow

---

## 5. Graphics

### 5.1 Style Attributes

- Pixel-art with dark base tones and vivid highlights
- Visual clarity for feedback (hits, statuses)

### 5.2 Graphics Needed

- Characters (player, enemies, bosses)
- Items, Weapons, UI, Tilesets (environment-specific)
- Shop & Base Elements

---

## 6. Sounds/Music

### 6.1 Style Attributes

- Floor 1: Nature sounds
- Floor 2: Industrial ambiance
- Floor 3: Sci-fi tones
- Boss: Thematic variations

### 6.2 Sounds Needed

- Footsteps (terrain based), Combat SFX, UI, Environmental sounds

### 6.3 Music Needed

- Themes for base + each floor + bosses + ending

---

## 7. Background and Style

The game world is fractured by time. The player, a lone warrior, must traverse divergent eras to stabilize the timeline. Progression is felt through environment, enemy types, and evolving music. Storytelling is embedded in the setting and design, not explicit narrative.

---

## 8. List of Assets

### Graphical

- Characters: 10+ enemy types, 6 bosses, player
- Weapons: 6+ tiers (melee/ranged)
- Items: Healing, Buffs, Status Cures
- UI: HUD, Menus
- Environments: Swamp, City, Mars, etc.
- Structures: Base Hub, Shops

### Audio

- 5+ music tracks (base, floors, bosses, end)
- Full SFX suite (combat, UI, ambient)

---

## 9. Schedule

1. Week 1–2: Entity and Player Framework
2. Week 3–4: Enemy AI + Movement
3. Week 5: Room System + Procedural Logic
4. Week 6–7: Combat, Weapons, Stats
5. Week 8–9: Level Themes + Boss Design
6. Week 10: UI/UX + Data Systems
7. Week 11–12: Final Polish, Debug, Balance

---

## 10. Technical Implementation (Current State)

### Core Systems Implemented

#### Combat System
- **Melee Combat (Dagger)**:
  - Extended range: 75px (2.5x original design)
  - Line-of-sight detection prevents attacks through walls
  - Visual feedback: Red area (normal), Orange area (wall-limited)
  - Base damage: 10 + shop upgrades
  
- **Ranged Combat (Slingshot)**:
  - Projectile-based with 15 base damage + shop upgrades
  - Projectiles collide with walls and are destroyed
  - Smooth projectile tracking towards enemies

#### Shop System
- **Purchase Options**:
  1. Primary Weapon Upgrade: 35 gold, +3 damage, max 15/run
  2. Secondary Weapon Upgrade: 40 gold, +4 damage, max 15/run  
  3. Full Health Restore: 50 gold, unlimited purchases
- **Features**:
  - Global upgrade tracking per run
  - Visual activation zone in shop rooms
  - WASD navigation, Enter to purchase, ESC to exit
  - Prevents purchases without sufficient gold or at max upgrades

#### Progression System
- **Structure**: 
  - 3 floors per run
  - 6 rooms per floor (4 combat + 1 shop + 1 boss)
  - Procedural combat room generation with 6-10 enemies
- **Gold Economy**:
  - Chest spawns after clearing combat rooms: 50 gold
  - No gold drops from enemies
  - Gold resets on death

#### Death & Reset System
- **Persistent Run Counter**: Stored in localStorage, never resets
- **On Death**:
  - 1-second delay before reset
  - Returns to Run X+1, Floor 1, Room 1
  - Resets: gold, weapon upgrades, player position
  - Preserves: total run count

#### Room Persistence
- **State Management**:
  - Room states preserved when transitioning
  - Enemies remain dead when returning to cleared rooms
  - Chest collection state maintained
  - Event-driven updates (not per-frame)

#### Performance Optimizations
- **Raycast System**: 4px step increments for wall detection
- **Event-driven Updates**: Room states only update on significant events
- **Projectile Management**: Automatic cleanup of inactive projectiles
- **Collision Detection**: Efficient hitbox-based system

### Current Enemy Types
- **Goblin Dagger**: Melee enemy with tracking AI
- **Goblin Archer**: Ranged enemy that fires projectiles

### Controls
- Movement: WASD/Arrow keys
- Attack: Spacebar  
- Weapon Switch: Q (dagger), E (slingshot)
- Dash: Left Shift
- Shop: WASD navigate, Enter purchase, ESC exit

### Technical Stack
- Pure JavaScript with ES6 modules
- Canvas API for rendering
- No external dependencies
- Python HTTP server for development

### Known Limitations
- Boss rooms not yet implemented
- Food/stamina system not implemented
- Permanent upgrades system not implemented
- Save system limited to run counter only
- No audio implementation yet

### Next Development Priorities
1. Boss enemy implementation
2. Food and stamina systems
3. Permanent upgrade system between runs
4. Full save/load functionality
5. Audio system integration