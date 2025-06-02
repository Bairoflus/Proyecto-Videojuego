# Data Insertion Scripts - Shattered Timeline Database

## General Description

This set of SQL scripts provides realistic dummy data to populate the "Shattered Timeline" video game database. The scripts include 30-50 rows per table, respecting all foreign key relationships and business logic.

## File Structure

### 1. `V3_DB_insert_data.sql` (Part 1)
**Included tables:**
- `users` (50 users with thematic names)
- `rooms` (50 rooms distributed across 5 floors)
- `bosses` (50 unique bosses with descriptions)
- `boss_moves` (30+ boss moves)
- `enemy_types` (50 enemy types balanced by floor)
- `sessions` (50 user sessions)
- `run_history` (50 game runs with varied results)

### 2. `V3_DB_insert_data_part2.sql` (Part 2)
**Included tables:**
- `player_stats` (Complete statistics for 50 players)
- `player_upgrades` (250 records - 5 types × 50 users)
- `permanent_upgrade_purchases` (50+ upgrade purchases)
- `equipped_weapons` (100+ equipped weapons)
- `weapon_upgrades_temp` (50+ temporary weapon upgrades)
- `player_settings` (50 audio settings per user)

### 3. `V3_DB_insert_data_part3.sql` (Part 3)
**Included tables:**
- `enemy_kills` (100+ enemy eliminations)
- `boss_encounters` (70+ boss encounters)
- `boss_kills` (35+ defeated bosses)
- `save_states` (50 save states)
- `shop_purchases` (50+ shop purchases)
- `chest_events` (45+ opened chests)
- `player_events` (50+ recorded game events)

## Primary and Foreign Key Design

### Implemented Primary Keys:
- **Auto-incremental**: `user_id`, `session_id`, `run_id`, `room_id`, `boss_id`, `enemy_id`, etc.
- **Composite**: 
  - `(user_id, upgrade_type)` in `player_upgrades`
  - `(run_id, user_id, weapon_slot)` in `equipped_weapons` and `weapon_upgrades_temp`

### Foreign Key Relationships:
- **users → sessions**: `sessions.user_id → users.user_id`
- **users → stats**: `player_stats.user_id → users.user_id`
- **runs → rooms**: `run_history.last_room_id → rooms.room_id`
- **bosses → moves**: `boss_moves.boss_id → bosses.boss_id`
- **bosses → enemy types**: `enemy_types.boss_id → bosses.boss_id`
- **And all other relationships according to the original schema**

## Execution Order

**IMPORTANT!** Files must be executed in sequential order:

```sql
-- 1. First execute the schema
SOURCE V3_DB.sql;

-- 2. Then the data in order
SOURCE V3_DB_insert_data.sql;
SOURCE V3_DB_insert_data_part2.sql;
SOURCE V3_DB_insert_data_part3.sql;
```

## Data Characteristics

### Users (50 records)
- Thematic game names (shadow_warrior, time_keeper, etc.)
- Unique emails and realistic hashed passwords
- Created between January 2024

### Rooms (50 records)
- 5 thematic floors (Entrance, Crystal, Sky, Lava, Void)
- Types: combat, boss, shop, chest, rest
- Logical sequence per floor

### Bosses (50 records)
- HP scaled by floor (500-2100 HP)
- Unique and thematic descriptions
- Specific moves per boss

### Enemies (50 records)
- Balanced by floor
- Progressive rarity and difficulty
- Thematic sprites

### Realistic Statistics
- Logical player progression
- Game time correlated with statistics
- Balanced gold earned/spent

### Game Events
- Logical room sequences
- Attacks with appropriate weapons
- Coherent purchases with progression

## Integrity Validation

The scripts include:
- `SET FOREIGN_KEY_CHECKS = 0/1` for safe handling
- Data respecting all constraints
- Valid references between tables
- Realistic values for gameplay

## Recommended Usage

```bash
# Connect to MySQL
mysql -u user -p

# Execute schema
mysql> source V3_DB.sql;

# Execute inserts in order
mysql> source V3_DB_insert_data.sql;
mysql> source V3_DB_insert_data_part2.sql;
mysql> source V3_DB_insert_data_part3.sql;

# Verify data
mysql> USE shatteredtimeline;
mysql> SELECT COUNT(*) FROM users;
mysql> SELECT COUNT(*) FROM run_history;
```

## Technical Notes

- **Encoding**: UTF-8 for special character support
- **Timestamps**: January 2024 data with logical progression
- **IDs**: Auto-incremental starting from 1
- **Consistency**: All data maintains game logic coherence

## Game Structure Represented

1. **Floor Progression**: 5 levels with increasing difficulty
2. **Upgrade System**: Permanent and temporary
3. **Economy**: Balanced gold earned/spent
4. **Combat**: Melee and ranged weapons
5. **Save System**: Persistent game states
6. **Events**: Complete activity logging

This dataset provides a solid foundation for testing, development, and demonstration of the video game's database system. 