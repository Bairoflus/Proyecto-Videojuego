# Shattered Timeline - User Stories

## Template - User Story

**Title:** [Brief description of functionality]

**Description:**  
As a **[type of user]**, I want **[action or functionality]**, so that **[objective or benefit]**.

**Acceptance Criteria:**

* [Condition 1 that must be met]  
* [Condition 2 that must be met]  
* [Condition 3 that must be met]

**Priority Level:**  
 **High** (Essential for core game mechanics or flow)  
 **Medium** (Improves experience but doesn't block progress)  
 **Low** (Improves aesthetic details or secondary features)

**Implementation Status:**  
 **Implemented** / **Partially Implemented** / **Not Implemented**

**Additional Notes:**

* [Technical details, constraints, or dependencies]  
* [Optional: mockups, references, or extra comments]

---

## User Story #1 - User Authentication

**Title:** User registration and login system  
**Description:**  
As a **player**, I want to **create an account and log in securely**, so that **my progress and statistics are saved and tracked across sessions**.

**Acceptance Criteria:**

* Players can register with username, email, and password
* Login validation with secure session management
* Password hashing and validation for security
* Session persistence with automatic logout on expiry

**Priority Level:** High  
**Implementation Status:** Implemented

**Additional Notes:**

* Backend database with MySQL for user management
* Session tokens for authenticated requests
* Admin role support for dashboard access

---

## User Story #2 - Character Movement

**Title:** Smooth character movement  
**Description:**  
As a **player**, I want to **move my character smoothly in all eight directions**, so that **I can navigate rooms and position myself strategically in combat**.

**Acceptance Criteria:**

* Character moves smoothly using WASD or arrow keys
* Eight-directional movement without axis restrictions
* Collision detection prevents movement through walls
* Responsive input with no noticeable delay

**Priority Level:** High  
**Implementation Status:** Implemented

**Additional Notes:**

* Hitbox-based collision system
* Optimized for smooth performance

---

## User Story #3 - Combat System

**Title:** Dual weapon combat mechanics  
**Description:**  
As a **player**, I want to **attack enemies using both melee and ranged weapons**, so that **I can adapt my combat strategy to different situations**.

**Acceptance Criteria:**

* Primary weapon (Q key) provides melee attacks with 75px range
* Secondary weapon (E key) fires projectiles that travel across the screen
* Attacks trigger with spacebar and have visual feedback
* Weapons have upgradeable damage through shop purchases

**Priority Level:** High  
**Implementation Status:** Implemented

**Additional Notes:**

* Line-of-sight detection for melee attacks
* Projectile physics with wall collision
* Visual indicators for attack ranges

---

## User Story #4 - Enhanced Mobility

**Title:** Dash ability for evasion  
**Description:**  
As a **player**, I want to **dash quickly using Left Shift**, so that **I can evade enemy attacks and move through rooms faster**.

**Acceptance Criteria:**

* Dash ability activated with Left Shift key
* Increased movement speed during dash duration
* Smooth transition between normal and dash movement
* Visual feedback during dash activation

**Priority Level:** High  
**Implementation Status:** Implemented

**Additional Notes:**

* Currently no cooldown or stamina cost (set to 0)
* Integrates with collision detection system

---

## User Story #5 - Procedural Room Generation

**Title:** Randomized room layouts  
**Description:**  
As a **player**, I want to **explore procedurally generated rooms**, so that **each run feels unique and replayable**.

**Acceptance Criteria:**

* Each floor contains 6 rooms: 4 combat, 1 shop, 1 boss
* Combat rooms generate 6-10 enemies with weighted distribution
* Room transitions occur at the right edge when conditions are met
* Room states persist when returning to previously visited rooms

**Priority Level:** High  
**Implementation Status:** Implemented

**Additional Notes:**

* Three floors per run with progressive difficulty
* Enemy cleanup and state management for performance

---

## User Story #6 - Enemy Combat

**Title:** Diverse enemy encounters  
**Description:**  
As a **player**, I want to **fight against different types of enemies with varied behaviors**, so that **combat remains challenging and engaging**.

**Acceptance Criteria:**

* Multiple enemy types: Goblin Dagger, Sword Goblin, Goblin Archer, Mage Goblin, Great Bow Goblin
* Melee enemies track and approach the player
* Ranged enemies maintain distance and fire projectiles
* All enemies must be defeated to clear a room

**Priority Level:** High  
**Implementation Status:** Implemented

**Additional Notes:**

* Weighted enemy spawning for balanced encounters
* AI systems for tracking and combat behaviors

---

## User Story #7 - Boss Battles

**Title:** Floor boss encounters  
**Description:**  
As a **player**, I want to **face challenging boss enemies at the end of each floor**, so that **I can test my skills and progress to the next level**.

**Acceptance Criteria:**

* Floor 1 features Dragon Boss with enhanced combat abilities
* Floor 2 features Supersoldier with advanced AI patterns
* Floor 3 returns to Dragon Boss with maximum difficulty
* Boss defeat triggers permanent upgrade selection
* Transition zone appears only after boss is defeated and chest is collected

**Priority Level:** High  
**Implementation Status:** Implemented

**Additional Notes:**

* Boss health and abilities scale with floor difficulty
* Integration with permanent upgrade system

---

## User Story #8 - Shop System

**Title:** Temporary upgrade purchases  
**Description:**  
As a **player**, I want to **purchase temporary weapon upgrades in shop rooms**, so that **I can improve my capabilities for the current run**.

**Acceptance Criteria:**

* Shop room provides three upgrade options: Primary weapon (+3 damage, 35 gold), Secondary weapon (+4 damage, 40 gold), Health restore (50 gold)
* Visual activation zone shows shop availability
* WASD navigation, Enter to purchase, ESC to exit
* Purchase validation prevents buying without sufficient gold or at maximum upgrades

**Priority Level:** High  
**Implementation Status:** Implemented

**Additional Notes:**

* Maximum 15 upgrades per weapon type per run
* Unlimited health restore purchases
* Real-time gold and upgrade tracking

---

## User Story #9 - Permanent Progression

**Title:** Permanent character upgrades  
**Description:**  
As a **player**, I want to **gain permanent upgrades after defeating bosses**, so that **I can build long-term character progression across multiple runs**.

**Acceptance Criteria:**

* Three permanent upgrade categories: Max Health (+15 HP), Max Stamina (+20), Movement Speed (+10%)
* Upgrade selection interface appears after boss defeat
* Upgrades persist across all future runs
* Database storage ensures upgrades are never lost

**Priority Level:** High  
**Implementation Status:** Implemented

**Additional Notes:**

* Calculated values applied automatically
* Visual selection interface with clear descriptions

---

## User Story #10 - Gold Economy

**Title:** Gold collection and spending  
**Description:**  
As a **player**, I want to **collect gold from chests and spend it in shops**, so that **I can make strategic decisions about resource allocation**.

**Acceptance Criteria:**

* Golden chest spawns after clearing all enemies in combat rooms
* Each chest provides 50 gold when collected
* Gold counter displays in HUD and updates in real-time
* Gold resets to 0 at the start of each new run

**Priority Level:** High  
**Implementation Status:** Implemented

**Additional Notes:**

* No gold drops from individual enemies
* Chest collection required for room progression

---

## User Story #11 - HUD Information

**Title:** Game status display  
**Description:**  
As a **player**, I want to **see my current health, gold, weapon levels, and run number**, so that **I can make informed decisions during gameplay**.

**Acceptance Criteria:**

* Health bar shows current and maximum HP with visual representation
* Gold counter displays current amount with coin icon
* Weapon upgrade levels shown for both primary and secondary weapons
* Run counter shows current attempt number

**Priority Level:** High  
**Implementation Status:** Implemented

**Additional Notes:**

* HUD elements scale appropriately for different screen sizes
* Real-time updates for all displayed values

---

## User Story #12 - Run Persistence

**Title:** Session and run tracking  
**Description:**  
As a **player**, I want **my run progress to persist across browser sessions**, so that **I can continue where I left off without losing progress**.

**Acceptance Criteria:**

* Run counter increments on login, logout, and run completion
* Run number persists across all browser sessions
* Database synchronization ensures data consistency
* Current run state can be restored after session interruption

**Priority Level:** High  
**Implementation Status:** Implemented

**Additional Notes:**

* Triple-event tracking for comprehensive statistics
* Zero-start system ensures proper run numbering

---

## User Story #13 - Save System

**Title:** Game state preservation  
**Description:**  
As a **player**, I want **my current game state to be saved automatically**, so that **I can resume exactly where I left off**.

**Acceptance Criteria:**

* Player position, health, and gold are saved automatically
* Room completion status persists between sessions
* Weapon upgrade levels are maintained throughout the run
* Save state activates automatically during gameplay

**Priority Level:** Medium  
**Implementation Status:** Implemented

**Additional Notes:**

* Automatic save triggers during key game events
* State restoration ensures seamless continuation

---

## User Story #14 - Death and Reset

**Title:** Run failure handling  
**Description:**  
As a **player**, I want **to restart with incremented run number when I die**, so that **I can attempt the challenge again with knowledge gained**.

**Acceptance Criteria:**

* Death triggers immediate run restart after short delay
* Run number increments to track total attempts
* All temporary progress resets (gold, weapon upgrades, position)
* Permanent upgrades are preserved across deaths

**Priority Level:** High  
**Implementation Status:** Implemented

**Additional Notes:**

* One-second delay before reset provides closure
* Statistics tracking for player performance analysis

---

## User Story #15 - Room Transitions

**Title:** Seamless area progression  
**Description:**  
As a **player**, I want to **move between rooms smoothly when objectives are complete**, so that **I can progress through floors without interruption**.

**Acceptance Criteria:**

* Transition zones appear on right edge when room is cleared
* Visual indicators show when transition is available
* Player movement to transition zone triggers automatic progression
* Boss rooms require both boss defeat and chest collection

**Priority Level:** High  
**Implementation Status:** Implemented

**Additional Notes:**

* Color-coded visual feedback for transition availability
* Enhanced validation for boss room transitions

---

## User Story #16 - Statistics Tracking

**Title:** Comprehensive player metrics  
**Description:**  
As a **player**, I want **my performance statistics to be tracked and stored**, so that **I can monitor my progress and improvement over time**.

**Acceptance Criteria:**

* Database tracks total runs, kills, deaths, gold earned/spent
* Playtime accumulation across all sessions
* Maximum damage and highest floor achievements recorded
* Boss kills and weapon purchase history maintained

**Priority Level:** Medium  
**Implementation Status:** Implemented

**Additional Notes:**

* Backend database with optimized queries
* Real-time statistics updates during gameplay

---

## User Story #17 - Admin Dashboard

**Title:** Game analytics and monitoring  
**Description:**  
As a **game administrator**, I want **access to player analytics and system monitoring**, so that **I can track game performance and player engagement**.

**Acceptance Criteria:**

* Secure admin authentication with role-based access
* Player progression analytics and leaderboards
* Real-time monitoring of active games and players
* Chart data for visualizing trends and patterns

**Priority Level:** Low  
**Implementation Status:** Implemented

**Additional Notes:**

* Separate admin login system
* Comprehensive analytics views for game optimization

---

## User Story #18 - Visual Feedback

**Title:** Combat and interaction feedback  
**Description:**  
As a **player**, I want **clear visual feedback for combat actions and interactions**, so that **I understand the results of my actions immediately**.

**Acceptance Criteria:**

* Attack animations show clearly when strikes connect
* Transition zones have colored indicators for availability
* Shop activation areas display visual cues
* Health changes have immediate visual representation

**Priority Level:** Medium  
**Implementation Status:** Implemented

**Additional Notes:**

* Color-coded feedback for different game states
* Visual effects enhance game readability

---

## User Story #19 - Floor Progression

**Title:** Multi-floor game structure  
**Description:**  
As a **player**, I want to **progress through three increasingly difficult floors**, so that **I experience escalating challenge and achievement**.

**Acceptance Criteria:**

* Each floor contains exactly 6 rooms in sequence
* Difficulty increases progressively across floors
* Floor completion requires defeating the boss and collecting rewards
* New run begins after completing all floors or dying

**Priority Level:** High  
**Implementation Status:** Implemented

**Additional Notes:**

* Three-floor structure provides complete game loop
* Boss variety across floors maintains engagement

---

## User Story #20 - Performance Optimization

**Title:** Smooth gameplay performance  
**Description:**  
As a **player**, I want **the game to run smoothly without lag or stuttering**, so that **I can focus on gameplay without technical distractions**.

**Acceptance Criteria:**

* Collision detection operates efficiently without frame drops
* Enemy AI updates smoothly for multiple enemies
* Projectile management prevents memory leaks
* Database operations don't interrupt gameplay flow

**Priority Level:** High  
**Implementation Status:** Implemented

**Additional Notes:**

* Event-driven updates reduce unnecessary computations
* Optimized cleanup prevents performance degradation

---

## Future Enhancement Stories

### User Story #21 - Audio System

**Title:** Sound effects and music  
**Description:**  
As a **player**, I want **atmospheric music and sound effects**, so that **the game feels more immersive and engaging**.

**Priority Level:** Medium  
**Implementation Status:** Not Implemented

### User Story #22 - Stamina System

**Title:** Action stamina costs  
**Description:**  
As a **player**, I want **actions to consume stamina that regenerates over time**, so that **I must manage my energy strategically during combat**.

**Priority Level:** Medium  
**Implementation Status:** Partially Implemented (costs set to 0)

### User Story #23 - Enhanced Visuals

**Title:** Particle effects and animations  
**Description:**  
As a **player**, I want **enhanced visual effects for combat and abilities**, so that **actions feel more impactful and satisfying**.

**Priority Level:** Low  
**Implementation Status:** Not Implemented

