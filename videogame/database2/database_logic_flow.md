# Database Logic and Game Flow - Shattered Timeline

## Overview

This document describes the complete database logic and how it integrates with the game flow in Shattered Timeline. The system is designed with a frontend-first approach, where most game logic is processed on the client side, while the database handles persistence, analytics, and critical state management.

## Database Architecture Summary

**Total Tables: 11**
- **Authentication**: 2 tables (users, sessions)
- **Player State**: 3 tables (save_states, permanent_player_upgrades, weapon_upgrades_temp)
- **Analytics**: 5 tables (player_stats, run_history, weapon_upgrade_purchases, enemy_kills, boss_kills)
- **Configuration**: 1 table (player_settings)

## Complete Game Flow with Database Integration

### 1. User Registration Flow

**Frontend Action**: User fills registration form with username, email, password
**Database Process**:

```sql
-- 1. Insert new user
INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?);

-- 2. Automatic triggers fire:
-- - Creates default player_settings record
-- - Creates default player_stats record
INSERT INTO player_settings (user_id) VALUES (NEW.user_id);
INSERT INTO player_stats (user_id) VALUES (NEW.user_id);
```

**Data Flow**:
1. Password gets hashed using bcrypt with 10 salt rounds
2. User record created with `is_active = TRUE`
3. Default settings applied (music: 70%, sfx: 80%, show_fps: false, auto_save: true)
4. Initial stats set to zero (runs: 0, kills: 0, deaths: 0, etc.)

### 2. Login and Session Management Flow

**Frontend Action**: User logs in with username and password
**Database Process**:

```sql
-- 1. Authenticate user
SELECT user_id, password_hash FROM users 
WHERE username = ? AND is_active = TRUE;

-- 2. Create new session
INSERT INTO sessions (user_id, session_token, expires_at) 
VALUES (?, ?, ?);

-- 3. Update last login
UPDATE users SET last_login = NOW() WHERE user_id = ?;
```

**Session Data Stored**:
- `session_token`: UUID for frontend authentication
- `expires_at`: 24 hours from creation
- `logout_at`: Timestamp when session ends (added for proper tracking)
- `is_active`: Session validity flag

**Frontend Storage**:
- `sessionToken`: For API authentication
- `currentUserId`: For user-specific operations
- `currentSessionId`: For session tracking

### 3. Game Run Lifecycle

#### 3.1 Run Creation

**Frontend Action**: User starts new game or logs in
**Database Process**:

```sql
-- Create new run
INSERT INTO run_history (user_id) VALUES (?);
-- Auto-sets: started_at = NOW(), cause_of_death = 'active'
```

**Run States**:
- `cause_of_death = 'active'`: Currently playing
- `ended_at = NULL`: Run in progress
- Default values: final_floor = 1, total_kills = 0, etc.

#### 3.2 During Gameplay

**Weapon Upgrades (Shop Purchases)**:
```sql
-- 1. Record purchase transaction
INSERT INTO weapon_upgrade_purchases 
(user_id, run_id, weapon_type, upgrade_level, cost) 
VALUES (?, ?, ?, ?, ?);

-- 2. Update current weapon levels
INSERT INTO weapon_upgrades_temp (user_id, run_id, melee_level, ranged_level) 
VALUES (?, ?, ?, ?) 
ON DUPLICATE KEY UPDATE melee_level = ?, ranged_level = ?;
```

**Enemy Kill Tracking**:
```sql
INSERT INTO enemy_kills (user_id, run_id, enemy_type, room_id, floor) 
VALUES (?, ?, ?, ?, ?);
```

**Boss Kill Tracking**:
```sql
INSERT INTO boss_kills 
(user_id, run_id, boss_type, floor, fight_duration_seconds, player_hp_remaining) 
VALUES (?, ?, ?, ?, ?, ?);
```

#### 3.3 Run Completion

**On Player Death or Victory**:
```sql
UPDATE run_history SET 
    ended_at = NOW(), 
    final_floor = ?, 
    final_gold = ?, 
    cause_of_death = ?, 
    total_kills = ?, 
    bosses_killed = ?, 
    duration_seconds = ?
WHERE run_id = ?;
```

**Automatic Stats Update (via Trigger)**:
```sql
-- Trigger automatically updates player_stats (highest_floor removed for game simplicity)
UPDATE player_stats SET 
    total_runs = total_runs + 1,
    total_kills = total_kills + NEW.total_kills,
    total_deaths = total_deaths + 1,
    total_gold_earned = total_gold_earned + NEW.final_gold,
    total_bosses_killed = total_bosses_killed + NEW.bosses_killed,
    total_playtime_seconds = total_playtime_seconds + NEW.duration_seconds
WHERE user_id = NEW.user_id;
```

### 4. Save State System

#### 4.1 Logout Save

**Frontend Action**: User closes game or logs out
**Database Process**:

```sql
-- 1. Deactivate previous saves
UPDATE save_states SET is_active = FALSE 
WHERE user_id = ? AND is_active = TRUE;

-- 2. Create new active save
INSERT INTO save_states 
(user_id, session_id, run_id, floor_id, room_id, current_hp, gold, logout_timestamp) 
VALUES (?, ?, ?, ?, ?, ?, ?, NOW());

-- 3. Update session logout timestamp
UPDATE sessions SET logout_at = NOW() WHERE session_token = ?;
```

**Saved Data**:
- Current floor position (floor_id for explicit tracking)
- Current room position (room_id for room-specific tracking)
- Player health (stamina regenerates automatically and is not saved)
- Current gold amount
- Active run reference
- Logout timestamp for session tracking

#### 4.2 Login Resume

**Frontend Action**: User logs in and has active save state
**Database Process**:

```sql
SELECT user_id, run_id, floor_id, room_id, current_hp, gold 
FROM save_states 
WHERE user_id = ? AND is_active = TRUE;
```

**Resume Logic**:
1. Frontend uses explicit floor_id for floor positioning
2. Room index within floor: `room_index = ((room_id - 1) % 6)`
3. Game state restored to exact position
4. Stamina regenerates to full automatically

#### 4.3 Death Cleanup

**Frontend Action**: Player dies in game
**Database Process**:

```sql
-- Clear active save state
UPDATE save_states SET is_active = FALSE 
WHERE user_id = ? AND is_active = TRUE;

-- Reset weapon upgrades for current run
UPDATE weapon_upgrades_temp SET melee_level = 1, ranged_level = 1 
WHERE user_id = ? AND run_id = ?;
```

### 5. Permanent Upgrade System

#### 5.1 Boss Kill Rewards

**Frontend Action**: Player defeats boss and chooses permanent upgrade
**Database Process**:

```sql
-- Apply permanent upgrade
INSERT INTO permanent_player_upgrades (user_id, upgrade_type, level) 
VALUES (?, ?, 1) 
ON DUPLICATE KEY UPDATE level = level + 1;
```

**Upgrade Types and Effects**:
- `health_max`: +15 HP per level
- `stamina_max`: +20 stamina per level  
- `movement_speed`: +10% speed per level

#### 5.2 Upgrade Application

**Frontend Queries on Game Start**:
```sql
SELECT upgrade_type, level FROM permanent_player_upgrades 
WHERE user_id = ?;
```

**Frontend Calculations**:
```javascript
// Example upgrade application
baseHealth = 100;
healthUpgradeLevel = getUserUpgradeLevel('health_max');
finalHealth = baseHealth + (healthUpgradeLevel * 15);
```

### 6. Weapon Upgrade System (Dual Architecture)

#### 6.1 Current State Table (weapon_upgrades_temp)

**Purpose**: Fast lookup for current weapon levels during gameplay
**Lifecycle**: 
- Created when first weapon purchased in run
- Updated on each subsequent purchase
- Reset to level 1 on player death
- Tied to specific run_id

```sql
-- Get current weapon levels
SELECT melee_level, ranged_level FROM weapon_upgrades_temp 
WHERE user_id = ? AND run_id = ?;
```

#### 6.2 Historical Tracking (weapon_upgrade_purchases)

**Purpose**: Complete audit trail of all weapon purchases
**Lifecycle**:
- Record created for every shop purchase
- Never modified or deleted
- Used for analytics and economy balancing

```sql
-- Track purchase
INSERT INTO weapon_upgrade_purchases 
(user_id, run_id, weapon_type, upgrade_level, cost) 
VALUES (?, ?, 'melee', 3, 150);
```

### 7. Analytics and Metrics

#### 7.1 Real-time Tracking

**Enemy Kills**:
- Every enemy death recorded with room, floor, enemy type
- Used for difficulty balancing and progression analysis

**Boss Fights**:
- Detailed boss encounter data
- Fight duration and remaining player health
- Success rate analysis per floor

**Economy**:
- All weapon purchases tracked
- Gold earning vs spending patterns
- Shop balance analysis

#### 7.2 Aggregated Statistics

**Player Stats Trigger Updates**:
- Automatically calculated from run completions
- Includes totals, achievements, playtime (highest_floor removed)
- Used for leaderboards and progression tracking
- Highest floor calculated dynamically from run_history when needed

### 8. Session and Security Management

#### 8.1 Session Lifecycle

```sql
-- Active session check
SELECT user_id FROM sessions 
WHERE session_token = ? AND expires_at > NOW() AND is_active = TRUE;

-- Session termination with logout tracking
UPDATE sessions SET is_active = FALSE, logout_at = NOW() WHERE session_token = ?;
```

#### 8.2 Security Features

**Session Expiry**: 24-hour automatic timeout
**Logout Tracking**: Proper session end timestamp recording
**Unique Constraints**: Prevent duplicate usernames/emails
**Active Flags**: Soft delete capability for users and sessions

### 9. Room and Enemy Mapping

#### 9.1 Room ID System

**Frontend Room Mapping**:
- Floor 1: room_id 1-6 (indices 0-5)
- Floor 2: room_id 7-12 (indices 0-5)  
- Floor 3: room_id 13-18 (indices 0-5)

**Room Types per Floor**:
- Indices 0-3: Combat rooms
- Index 4: Shop room
- Index 5: Boss room

#### 9.2 Enemy Type Mapping

**Frontend Enemy Classification**:
- `GoblinDagger` -> enemy_type 'basic'
- `GoblinArcher` -> enemy_type 'basic'
- `DragonBoss` -> tracked in boss_kills table

### 10. Configuration Management

#### 10.1 Player Settings

**Stored Settings**:
```sql
SELECT music_volume, sfx_volume, show_fps, auto_save_enabled 
FROM player_settings WHERE user_id = ?;
```

**Update Process**:
- Partial updates supported (only changed fields)
- Automatic timestamp update on modification
- Frontend applies settings immediately

### 11. Data Integrity and Constraints

#### 11.1 Foreign Key Relationships

**Cascading Deletes**:
- User deletion removes all related data
- Session deletion removes associated save states
- Run deletion cleans up associated tracking data

**Referential Integrity**:
- All user_id fields reference users.user_id
- All run_id fields reference run_history.run_id
- All session_id fields reference sessions.session_id

#### 11.2 Data Validation

**Enum Constraints**:
- `enemy_type`: 'basic', 'strong'
- `boss_type`: 'dragon'
- `weapon_type`: 'melee', 'ranged'
- `cause_of_death`: 'enemy_kill', 'boss_kill', 'timeout', 'disconnect', 'active'

**Check Constraints**:
- Volume levels: 0.0 to 1.0
- Boolean flags for settings
- Positive values for stats and progress

### 12. Performance Optimizations

#### 12.1 Indexes

**Critical Performance Indexes**:
- `users.username` (unique, frequent lookups)
- `sessions.session_token` (authentication queries)
- `sessions.logout_at` (session tracking queries)
- `run_history.user_id` (user progress queries)
- `save_states.user_id + is_active` (save state lookups)
- `save_states.floor_id + room_id` (location-based queries)

#### 12.2 Query Patterns

**Efficient Queries**:
- Single-user data fetching (by user_id)
- Active session validation (by token)
- Current state lookups (active flags)
- Aggregated statistics (via triggers)
- Dynamic highest floor calculation (from run_history)

## Frontend-Database Integration Points

### Critical API Endpoints

1. **Authentication**: `/api/auth/login` - Session creation (now username-based)
2. **Run Management**: `/api/runs` - Game lifecycle
3. **Save States**: `/api/users/:id/save-state` - Continuity (with floor_id support)
4. **Weapon Upgrades**: `/api/users/:id/weapon-upgrades/:runId` - Progression
5. **Analytics**: `/api/runs/:id/enemy-kill` - Tracking

### Error Handling

**Database Connection Failures**: Graceful degradation to test mode
**Constraint Violations**: User-friendly error messages
**Session Expiry**: Automatic redirect to login
**Data Conflicts**: Optimistic conflict resolution

## Data Flow Summary

1. **Registration** -> Users table + Default settings/stats
2. **Login** -> Session creation + Frontend token storage
3. **Game Start** -> Run creation + Weapon upgrade initialization
4. **Gameplay** -> Real-time tracking (kills, purchases) + Periodic saves (with floor_id)
5. **Death/Victory** -> Run completion + Stats aggregation + State cleanup
6. **Logout** -> Save state creation + Session logout timestamp

## Key Changes in Version 2.2

### Database Structure Optimizations

1. **Removed `highest_floor` from player_stats**:
   - Redundant with only 3 floors in game
   - Calculated dynamically from run_history when needed
   - Reduces storage overhead

2. **Added `floor_id` to save_states**:
   - Explicit floor tracking for better clarity
   - Eliminates room-to-floor calculation dependencies
   - Improves save state reliability

3. **Removed `current_stamina` from save_states**:
   - Stamina regenerates quickly (not critical to save)
   - Reduces save state complexity
   - Stamina always restored to full on game resume

4. **Added `logout_at` to sessions**:
   - Proper session end timestamp tracking
   - Better analytics for session duration
   - Improved security monitoring

5. **Removed `ip_address` and `user_agent` from sessions**:
   - Reduced storage overhead
   - Simplified session management
   - Focus on essential session data only

### API Integration Updates

1. **Authentication**: Updated to username-based login
2. **Save State**: Floor_id parameter added, stamina removed
3. **Session Management**: Logout timestamp tracking added

This architecture ensures data consistency, performance optimization, and comprehensive analytics while maintaining a smooth gaming experience with minimal database dependencies during active gameplay. 