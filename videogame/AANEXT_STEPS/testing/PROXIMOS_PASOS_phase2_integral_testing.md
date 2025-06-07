# Phase 2: Integral Testing - Shattered Timeline

## Overview

This document outlines the comprehensive testing strategy for Phase 2 of the Shattered Timeline project. The testing covers all critical systems including managers, game flows, database improvements, and API endpoints.

## Testing Environment Setup

### Prerequisites
- Backend API running on port 3000
- Frontend development server on port 8080
- MySQL database with `dbshatteredtimeline` v2.1 schema
- Test user credentials for authentication flows

### Test Data Requirements
- Valid test user account
- Active session tokens
- Sample run data
- Mock game state data

## Step 2.1: Manager System Testing

### SaveStateManager Testing

**Test Cases:**
1. **Initialize and Load State**
   - Test `loadSaveState(userId)` with existing data
   - Test `loadSaveState(userId)` with no existing data
   - Verify `getCurrentSaveState()` returns correct data

2. **Save State Operations**
   - Test `saveCurrentState(gameState, false)` for auto-save
   - Test `saveCurrentState(gameState, true)` for logout save
   - Verify database persistence

3. **Clear State Operations**
   - Test `clearSaveState(userId)` on player death
   - Verify database state removal
   - Confirm local state cleanup

4. **Auto-save Functionality**
   - Test `startAutoSave()` with callback
   - Verify 30-second interval execution
   - Test `stopAutoSave()` functionality

**Expected Results:**
- All save/load operations complete successfully
- Data persistence matches expectations
- Auto-save triggers at correct intervals
- Error handling works for network failures

### WeaponUpgradeManager Testing

**Test Cases:**
1. **Initialization**
   - Test `initialize(userId, runId)` with valid parameters
   - Test `loadCurrentUpgrades()` from database
   - Verify default values when no data exists

2. **Upgrade Operations**
   - Test `upgradeWeapon('melee')` functionality
   - Test `upgradeWeapon('ranged')` functionality
   - Test upgrade level progression (1-15)
   - Test maximum level restrictions

3. **Save and Sync**
   - Test `saveUpgrades()` database persistence
   - Verify synchronization with backend
   - Test error handling for save failures

4. **Reset Operations**
   - Test `resetOnDeath()` functionality
   - Test `preserveOnLogout()` behavior
   - Verify correct state transitions

**Expected Results:**
- Upgrade progression works correctly
- Database synchronization maintains consistency
- Reset behaviors follow game logic
- Level caps enforced properly

## Step 2.2: Game Flow Testing

### Complete User Journey Tests

**Test Flow 1: Login → Play → Save → Logout → Restore**
1. User login with valid credentials
2. Create new game run
3. Play through several rooms
4. Trigger auto-save
5. Manual logout
6. Login again
7. Verify game state restoration

**Test Flow 2: Shop → Upgrade → Visual Update**
1. Navigate to shop room
2. Purchase weapon upgrades
3. Verify visual weapon changes
4. Test upgrade persistence
5. Verify gold deduction
6. Check backend purchase logging

**Test Flow 3: Boss Defeat → Permanent Upgrade → Floor Transition**
1. Navigate to boss room
2. Defeat boss enemy
3. Trigger permanent upgrade popup
4. Select upgrade option
5. Verify stat application
6. Complete floor transition
7. Verify new floor initialization

**Test Flow 4: Death → Reset → New Game**
1. Take damage until player death
2. Verify death trigger
3. Check weapon upgrade reset
4. Verify save state clearing
5. Test new game initialization
6. Confirm fresh state

**Success Criteria:**
- All flows complete without errors
- State transitions work correctly
- Data persistence maintained
- UI updates reflect backend changes

## Step 2.3: Database Improvements Testing

### Foreign Key Constraints Testing

**Test Cases:**
1. **Referential Integrity Enforcement**
   - Test cascading deletes on user removal
   - Verify orphaned record prevention
   - Test SET NULL behavior for save_states.run_id

2. **Constraint Violation Handling**
   - Test invalid foreign key insertions
   - Verify proper error responses
   - Test application error handling

3. **Data Consistency Verification**
   - Query for orphaned records
   - Verify relationship consistency
   - Test constraint enforcement

### Performance Index Testing

**Test Cases:**
1. **Query Performance**
   - Execute common user queries
   - Measure query execution times
   - Verify index utilization

2. **Index Effectiveness**
   - Test JOIN operation performance
   - Verify foreign key index usage
   - Check analytics query optimization

**Database Verification SQL:**
```sql
-- Verify foreign key constraints
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'dbshatteredtimeline'
  AND REFERENCED_TABLE_NAME IS NOT NULL;

-- Check for orphaned records
SELECT 'sessions' as table_name, COUNT(*) as orphaned_count
FROM sessions s
LEFT JOIN users u ON s.user_id = u.user_id
WHERE u.user_id IS NULL

UNION ALL

SELECT 'save_states', COUNT(*)
FROM save_states ss
LEFT JOIN users u ON ss.user_id = u.user_id
WHERE u.user_id IS NULL;
```

## Step 2.4: API Endpoints Testing

### Authentication Endpoints
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`

### User Data Endpoints
- `GET /api/users/:userId/settings`
- `PUT /api/users/:userId/settings`
- `GET /api/users/:userId/stats`

### Game State Endpoints
- `POST /api/runs`
- `PUT /api/runs/:runId/complete`
- `GET /api/users/:userId/save-state`
- `POST /api/users/:userId/save-state`
- `DELETE /api/users/:userId/save-state`

### Upgrade System Endpoints
- `GET /api/users/:userId/permanent-upgrades`
- `POST /api/users/:userId/permanent-upgrade`
- `GET /api/users/:userId/weapon-upgrades/:runId`
- `PUT /api/users/:userId/weapon-upgrades/:runId`
- `DELETE /api/users/:userId/weapon-upgrades/:runId`

### Analytics Endpoints
- `POST /api/runs/:runId/enemy-kill`
- `POST /api/runs/:runId/boss-kill`
- `POST /api/runs/:runId/weapon-purchase`
- `GET /api/leaderboards/:type`

**Testing Method:**
Each endpoint will be tested with:
- Valid request parameters
- Invalid request parameters
- Missing required fields
- Authentication validation
- Response format verification
- Error handling validation

## Test Execution Plan

### Phase 2.1: Manager Testing (1 hour)
- Execute saveStateManager test suite
- Execute weaponUpgradeManager test suite
- Document results and issues

### Phase 2.2: Game Flow Testing (2 hours)
- Execute all four complete user journeys
- Test edge cases and error scenarios
- Verify UI responsiveness and updates

### Phase 2.3: Database Testing (1 hour)
- Verify foreign key constraints
- Test performance improvements
- Execute constraint violation scenarios

### Phase 2.4: API Testing (1 hour)
- Test all 22 optimized endpoints
- Verify response format consistency
- Test error handling scenarios

## Success Metrics

### Functional Requirements
- 100% of manager operations work correctly
- All game flows complete successfully
- Database constraints enforce integrity
- API endpoints return proper responses

### Performance Requirements
- Auto-save completes within 2 seconds
- Database queries execute under 100ms
- API responses under 500ms
- No memory leaks in managers

### Reliability Requirements
- Zero data loss during state transitions
- Graceful error recovery
- Consistent state synchronization
- Proper constraint enforcement

## Issue Tracking

Any issues discovered during testing will be documented with:
- Test case that failed
- Expected vs actual behavior
- Steps to reproduce
- Severity level (Critical/High/Medium/Low)
- Proposed resolution

## Post-Testing Actions

Upon completion of Phase 2 testing:
1. Update PROXIMOS_PASOS.md with results
2. Document any issues requiring resolution
3. Prepare for Phase 3: Optimization and Polish
4. Archive test results for future reference 