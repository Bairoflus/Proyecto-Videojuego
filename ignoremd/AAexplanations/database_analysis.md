# Database Analysis - Shattered Timeline

## Analysis of Database Structure and Optimization Opportunities

### 1. **highest_floor** in player_stats Table

**Current Implementation:**
- Stores the highest floor reached by each player
- Values: 1, 2, or 3 (since there are only 3 floors per run)

**Analysis:**
The user's concern is **VALID**. With only 3 floors in the game, this column has limited analytical value:

- **Limited range**: Only 3 possible values (1, 2, 3)
- **Low granularity**: Doesn't provide detailed progression metrics
- **Alternative tracking**: Could be derived from `final_floor` in `run_history` table

**Recommendation:** 
- **KEEP** if future expansion is planned (more floors/levels)
- **REMOVE** if the game will remain at 3 floors permanently

**If removed, impact analysis:**
- Files to modify: None significant (only used for statistics display)
- Alternative: Use `MAX(final_floor)` query from `run_history` table

---

### 2. **save_states** Table - Missing floor_id

**Current Implementation:**
```sql
save_states (
    user_id, session_id, run_id, room_id, 
    current_hp, current_stamina, gold, ...
)
```

**Analysis:**
The user's suggestion is **PARTIALLY VALID**:

**Current System:**
- `room_id` implicitly contains floor information
- Room mapping: Floor 1 (rooms 1-6), Floor 2 (rooms 7-12), Floor 3 (rooms 13-18)
- Floor can be calculated: `floor = CEIL(room_id / 6)`

**Adding floor_id would:**
- ✅ **Improve clarity** - explicit floor information
- ✅ **Optimize queries** - no need to calculate floor from room_id
- ✅ **Better data integrity** - explicit relationship
- ❌ **Slight redundancy** - floor derivable from room_id

**Recommendation:** **ADD floor_id** for better clarity and query performance.

---

### 3. **current_stamina** in save_states

**Current Implementation:**
- Stores current stamina value for game state continuity

**Analysis:**
The user's concern is **VALID**:

**Arguments for removal:**
- ✅ Stamina regenerates quickly (not critical to save)
- ✅ Player can wait a few seconds after login to regenerate
- ✅ Reduces storage overhead
- ✅ Simplifies save/load logic

**Arguments for keeping:**
- ❌ Better user experience (immediate continuation)
- ❌ Consistency with health saving

**Recommendation:** **REMOVE current_stamina** - the user is correct that it's not essential.

---

### 4. **sessions** Table - Missing logout_at and utility of ip_address/user_agent

**Current Implementation:**
```sql
sessions (
    session_id, user_id, session_token, created_at, 
    expires_at, is_active, ip_address, user_agent
)
```

**Analysis:**

**Missing logout_at:**
- **VALID CONCERN** - no explicit logout timestamp
- Currently tracked in `save_states.logout_timestamp` instead
- Should be in `sessions` table for better session management

**ip_address and user_agent utility:**
- **PARTIALLY VALID** concern about usefulness

**ip_address uses:**
- ✅ Security: Detect suspicious login patterns
- ✅ Analytics: Geographic user distribution
- ✅ Fraud detection: Multiple accounts from same IP
- ❌ Takes storage space for a simple game

**user_agent uses:**
- ✅ Compatibility: Track browser/device issues
- ✅ Analytics: Most common platforms
- ✅ Support: Debug platform-specific problems
- ❌ TEXT field takes significant space

**Recommendation:** 
- **ADD logout_at** to sessions table
- **KEEP ip_address** (compact, useful for security)
- **CONSIDER REMOVING user_agent** (large TEXT field, limited use for a game)

---

### 5. **weapon_upgrade_purchases** and **weapon_upgrades_temp** Logic

**Current Implementation:**

**weapon_upgrades_temp:**
```sql
- Stores current weapon upgrade levels per run
- melee_level, ranged_level (current state)
- Linked to specific run_id
- Gets reset on death (new run)
```

**weapon_upgrade_purchases:**
```sql
- Records each individual purchase transaction
- weapon_type, upgrade_level, cost, purchased_at
- Historical log of all purchases
```

**How they work together:**

1. **During gameplay:**
   - Player buys weapon upgrade in shop
   - `weapon_upgrade_purchases` records the transaction (audit trail)
   - `weapon_upgrades_temp` updates current weapon levels

2. **On death/new run:**
   - `weapon_upgrades_temp` gets reset (new run_id created)
   - `weapon_upgrade_purchases` history is preserved

3. **Game logic flow:**
   ```
   Player buys melee upgrade level 2 → 
   INSERT INTO weapon_upgrade_purchases → 
   UPDATE weapon_upgrades_temp SET melee_level = 2
   ```

**Purpose of dual system:**
- **weapon_upgrades_temp**: Fast current state lookup for gameplay
- **weapon_upgrade_purchases**: Complete audit trail for analytics

**Analysis:** **WELL DESIGNED** - provides both performance and analytics capabilities.

---

## Summary of Recommendations

### ✅ VALID CONCERNS (Should be changed):

1. **ADD floor_id to save_states** table
2. **REMOVE current_stamina** from save_states
3. **ADD logout_at** to sessions table
4. **CONSIDER REMOVING user_agent** from sessions (optional)

### ❌ INVALID CONCERNS (Should be kept):

1. **weapon_upgrade_purchases/weapon_upgrades_temp** - well designed dual system
2. **ip_address** - useful for security

### 🤔 CONDITIONAL:

1. **highest_floor** - remove only if no future expansion planned

---

## Detailed Impact Analysis for Valid Changes

### 1. ADD floor_id to save_states

**Database Changes:**
```sql
ALTER TABLE save_states ADD COLUMN floor_id INT DEFAULT 1 AFTER run_id;
```

**Files to Modify:**
- `videogame/api/app.js` - Update save state endpoints
- `videogame/src/utils/saveStateManager.js` - Include floor_id in save/load logic
- `videogame/src/classes/game/FloorGenerator.js` - Save floor_id when updating save state

**Impact:** LOW - Additive change, improves data clarity

### 2. REMOVE current_stamina from save_states

**Database Changes:**
```sql
ALTER TABLE save_states DROP COLUMN current_stamina;
```

**Files to Modify:**
- `videogame/api/app.js` - Remove stamina from save state endpoints
- `videogame/src/utils/saveStateManager.js` - Remove stamina saving logic
- `videogame/src/classes/entities/Player.js` - Remove stamina restoration on load
- `videogame/src/classes/game/Game.js` - Remove stamina from save state calls

**Impact:** MEDIUM - Requires removing logic from multiple files

### 3. ADD logout_at to sessions

**Database Changes:**
```sql
ALTER TABLE sessions ADD COLUMN logout_at DATETIME NULL AFTER expires_at;
```

**Files to Modify:**
- `videogame/api/app.js` - Update logout endpoint to set logout_at
- `videogame/src/utils/auth.js` - Add logout timestamp tracking
- `videogame/src/pages/js/login.js` - Optional: show last logout time

**Impact:** LOW - Additive change, improves session tracking

### 4. CONSIDER REMOVING user_agent from sessions

**Database Changes:**
```sql
ALTER TABLE sessions DROP COLUMN user_agent;
```

**Files to Modify:**
- `videogame/api/app.js` - Remove user_agent from session creation

**Impact:** MINIMAL - Only affects session creation, no functional impact

---

## Login System Changes Implemented

### ✅ COMPLETED: Username-based Authentication

**Changes Made:**

1. **Backend API** (`videogame/api/app.js`):
   - Changed login endpoint to accept `username` instead of `email`
   - Updated database query: `WHERE username = ?` instead of `WHERE email = ?`

2. **Frontend HTML** (`videogame/src/pages/html/login.html`):
   - Changed input type from `email` to `text`
   - Updated placeholder from "Email" to "Username"

3. **Frontend JavaScript** (`videogame/src/pages/js/login.js`):
   - Updated validation to check username length (min 3 characters)
   - Removed email regex validation
   - Updated error messages to reference username instead of email

4. **API Utility** (`videogame/src/utils/api.js`):
   - Changed `loginUser(email, password)` to `loginUser(username, password)`
   - Updated API request body to send username instead of email

**Benefits:**
- ✅ More logical UX flow (register with username → login with username)
- ✅ Consistent with user registration process
- ✅ Username is more memorable than email for gaming context
- ✅ Email remains secure (not exposed in login forms)

**Database Structure:**
- Both `username` and `email` remain in users table
- `username` has UNIQUE constraint and index for fast lookups
- Email still available for password recovery features if needed

**Testing Required:**
- Verify login works with existing user accounts
- Test validation error messages
- Confirm session management still functions correctly 