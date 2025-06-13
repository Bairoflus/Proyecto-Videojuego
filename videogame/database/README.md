# Shattered Timeline Database Structure v3.1

Complete MySQL database structure for the Shattered Timeline videogame with support for user management, game progression, analytics, and admin dashboard functionality.

**NEW v3.1 FEATURES:**
- **Enhanced Run Tracking:** `total_runs` now increments on LOGIN, LOGOUT, and COMPLETION
- **Zero-Start Run Numbering:** `current_run_number` starts at 0 for proper first-run synchronization
- **Comprehensive Session Tracking:** Complete user interaction event monitoring

## File Structure

```
videogame/database/
├── README.md                    # This documentation file
├── dbshatteredtimeline.sql      # Main database schema and tables
├── objects.sql                  # Views, triggers, and procedures (v3.1)
├── admin_user_setup.sql         # Admin user creation script
└── ERDV4.pdf                   # Entity Relationship Diagram
```

## Database Setup Instructions

### Prerequisites
- MySQL Server 8.0 or higher
- MySQL client or MySQL Workbench
- Admin privileges to create databases and users

### Step-by-Step Setup

1. **Connect to MySQL as administrator:**
   ```bash
   mysql -u root -p
   ```

2. **Execute the main database schema:**
   ```sql
   SOURCE /path/to/videogame/database/dbshatteredtimeline.sql;
   ```

3. **Execute database objects (views, triggers, procedures):**
   ```sql
   SOURCE /path/to/videogame/database/objects.sql;
   ```

4. **Create admin users for dashboard access:**
   ```sql
   SOURCE /path/to/videogame/database/admin_user_setup.sql;
   ```

5. **Verify installation:**
   ```sql
   USE dbshatteredtimeline;
   SHOW TABLES;
   SELECT COUNT(*) as total_tables FROM information_schema.tables 
   WHERE table_schema = 'dbshatteredtimeline';
   ```

### Alternative Setup (Command Line)
```bash
# From the database directory
mysql -u root -p < dbshatteredtimeline.sql
mysql -u root -p < objects.sql  
mysql -u root -p < admin_user_setup.sql
```

## File Descriptions

### 1. `dbshatteredtimeline.sql` - Main Database Schema

**Purpose:** Creates the complete database structure with all tables, constraints, and indexes.

**Contains:**
- Database creation and configuration
- 12 core tables with relationships
- Foreign key constraints for data integrity
- Performance indexes for optimization
- Initial data validation

**Key Tables:**
- **Authentication:** `users`, `sessions`
- **User Progress:** `user_run_progress` (NEW - for run persistence)
- **Player State:** `save_states`, `permanent_player_upgrades`, `weapon_upgrades_temp`
- **Analytics:** `player_stats`, `run_history`, `enemy_kills`, `boss_kills`, `weapon_upgrade_purchases`
- **Configuration:** `player_settings`

**Database Features:**
- **Engine:** InnoDB for ACID compliance and referential integrity
- **Character Set:** utf8mb4 for full Unicode support (emojis, special characters)
- **Normalization:** 1NF, 2NF, 3NF compliant design
- **Referential Integrity:** Complete foreign key constraint enforcement

### 2. `objects.sql` - Database Objects (v3.1)

**Purpose:** Creates views, triggers, and procedures for enhanced functionality and data access optimization.

**v3.1 ENHANCEMENTS:**
- **Triple-Event Run Tracking:** `total_runs` increments on login, logout, and completion
- **Zero-Start Run System:** `current_run_number` begins at 0 for proper synchronization  
- **Enhanced Triggers:** Updated for comprehensive user interaction tracking

**Contains:**
- **25+ Optimized Views** for data access and API integration
- **Enhanced Triggers** for automatic data management with v3.1 run tracking
- **Procedures** for complex operations
- **Admin Dashboard Views** for analytics

**NEW v3.1 Trigger Behavior:**
- **tr_increment_run_number:** Sets run number and increments current_run_number on run creation
- **tr_update_player_stats_after_run:** Updates stats including total_runs increment on completion
- **API Login Integration:** Backend increments total_runs on successful login
- **API Logout Integration:** Backend increments total_runs on logout with gold sync

**Key View Categories:**

#### User & Authentication Views
- `vw_user_profile` - User authentication profile
- `vw_user_sessions` - Session management
- `vw_user_run_progress` - Run persistence tracking

#### Game State Views  
- `vw_player_save` - Saved game states
- `vw_permanent_upgrades` - Permanent character upgrades with calculated values
- `vw_active_weapon_upgrades` - Currently active temporary upgrades
- `vw_weapon_levels` - Complete weapon upgrade history

#### Analytics Views
- `vw_player_metrics` - Player general statistics
- `vw_game_history` - Complete game attempt history
- `vw_combat_log` - Enemy elimination records
- `vw_boss_victories` - Boss defeat tracking

#### Admin Dashboard Views
- `vw_leaderboard_playtime` - Top players by playtime
- `vw_player_progression` - Player progression analysis
- `vw_active_players` - Currently active players
- `vw_current_games` - Live game monitoring

#### API Integration Views
- `vw_player_initialization` - Complete player data for game startup
- `vw_complete_player_stats` - Full historical statistics for frontend

### 3. `admin_user_setup.sql` - Admin User Creation

**Purpose:** Creates administrative users for accessing the admin dashboard with pre-configured credentials.

**Contains:**
- Admin user creation with hashed passwords
- Development team user setup
- Access instructions and security information

**Admin Credentials:**
- **Username:** `admin` | **Password:** `admin123`
- **Username:** `devteam` | **Password:** `devteam2024`

**Security Features:**
- Passwords are pre-hashed with bcrypt (10 rounds)
- Role-based access control (`admin` role)
- Independent authentication system

### 4. `ERDV4.pdf` - Entity Relationship Diagram

**Purpose:** Visual representation of the complete database structure showing relationships, cardinalities, and constraints.

**Includes:**
- All 12 tables with their fields and data types
- Primary and foreign key relationships  
- Cardinality indicators (1:1, 1:M, M:M)
- Index and constraint documentation
- Data flow visualization

## Database Architecture

### Core Design Principles

1. **Enhanced Run Tracking (v3.1):** 
   - `user_run_progress` table with `current_run_number` starting at 0
   - `total_runs` increments on three events: LOGIN, LOGOUT, and COMPLETION
   - Complete user interaction event monitoring for comprehensive analytics
   - Synchronized run numbering across all database tables

2. **Run Persistence:** 
   - `user_run_progress` table ensures run numbers persist across sessions
   - All analytics tables store `run_number` for better tracking
   - Zero-start system ensures first run is properly numbered as run 1

3. **Upgrade Management:**
   - **Permanent Upgrades:** Stored in `permanent_player_upgrades` with calculated values
   - **Temporary Upgrades:** Stored in `weapon_upgrades_temp` with active status tracking

4. **Save State System:**
   - `save_states` table with session and run linking
   - Automatic cleanup on player death or logout

5. **Analytics & Tracking:**
   - Comprehensive event tracking (kills, purchases, sessions)
   - Aggregated statistics in `player_stats` with enhanced total_runs tracking
   - Detailed history in `run_history` with synchronized run numbering

6. **Admin Dashboard:**
   - Optimized views for real-time monitoring
   - Chart data endpoints for visualizations
   - Player progression analytics with v3.1 enhanced tracking

### Performance Optimizations

- **Strategic Indexing:** All frequently queried columns have indexes
- **View Optimization:** Complex queries pre-computed in views
- **Foreign Key Constraints:** Ensure data integrity without performance loss
- **Connection Pooling:** mysql2 library with promise support

### Data Relationships

```
users (1) ←→ (M) sessions
users (1) ←→ (1) user_run_progress  
users (1) ←→ (M) save_states
users (1) ←→ (M) permanent_player_upgrades
users (1) ←→ (M) weapon_upgrades_temp
users (1) ←→ (M) run_history
users (1) ←→ (1) player_stats
users (1) ←→ (1) player_settings

run_history (1) ←→ (M) enemy_kills
run_history (1) ←→ (M) boss_kills  
run_history (1) ←→ (M) weapon_upgrade_purchases
```

## Admin Dashboard Access

### Access Information
- **URL:** `http://localhost:8080/pages/html/admin.html`
- **Credentials:** See `admin_user_setup.sql` for login details

### Available Analytics
- **Player Progression:** Experience tiers based on run count
- **Playtime Leaderboard:** Top players by hours played
- **Permanent Upgrade Adoption:** Which upgrades players choose first
- **Active Players:** Real-time player monitoring
- **Live Games:** Currently ongoing game sessions

### Chart Visualizations
- **Activity Trends:** Daily registrations vs logins
- **Playtime Distribution:** Player engagement patterns
- **Run Experience:** Distribution by number of runs completed
- **Session Duration:** How long players typically play
- **Upgrade Adoption:** Feature adoption rates over time

## Database Statistics

- **Total Tables:** 12
- **Total Views:** 25+
- **Storage Engine:** InnoDB
- **Character Set:** utf8mb4_unicode_ci
- **Foreign Key Constraints:** 15+
- **Performance Indexes:** 30+

## Maintenance & Backup

### Backup Recommendations
```bash
# Full database backup
mysqldump -u root -p dbshatteredtimeline > backup_$(date +%Y%m%d).sql

# Structure only backup  
mysqldump -u root -p --no-data dbshatteredtimeline > structure_backup.sql

# Data only backup
mysqldump -u root -p --no-create-info dbshatteredtimeline > data_backup.sql
```

### Regular Maintenance
```sql
-- Optimize tables monthly
OPTIMIZE TABLE users, run_history, player_stats;

-- Check for orphaned records
SELECT * FROM save_states WHERE user_id NOT IN (SELECT user_id FROM users);

-- Clean up expired sessions
DELETE FROM sessions WHERE expires_at < NOW() AND is_active = FALSE;
```

## Troubleshooting

### Common Issues

1. **Foreign Key Constraint Errors:**
   - Ensure parent records exist before inserting child records
   - Check constraint names in error messages

2. **Character Set Issues:**
   - Database uses utf8mb4 for full Unicode support
   - Ensure client connections use the same character set

3. **Performance Issues:**
   - Check if indexes are being used: `EXPLAIN SELECT ...`
   - Consider adding indexes for frequently queried columns

4. **Connection Issues:**
   - Verify database credentials in API configuration
   - Check if MySQL server is running on correct port

### Verification Queries
```sql
-- Check all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'dbshatteredtimeline';

-- Verify foreign key constraints
SELECT * FROM information_schema.key_column_usage 
WHERE table_schema = 'dbshatteredtimeline' 
AND referenced_table_name IS NOT NULL;

-- Check view count
SELECT COUNT(*) FROM information_schema.views 
WHERE table_schema = 'dbshatteredtimeline';
```

## Integration Notes

- **API Integration:** Database designed to work seamlessly with the Express.js API
- **Frontend Compatibility:** Views provide data in formats expected by frontend
- **Admin Dashboard:** Complete analytics suite for game monitoring
- **Scalability:** Structure supports future feature additions without major changes

## Version Information

- **Database Version:** v3.1 Enhanced
- **Last Updated:** Current version with run persistence and enhanced analytics
- **Compatibility:** MySQL 8.0+, works with mysql2 Node.js driver 