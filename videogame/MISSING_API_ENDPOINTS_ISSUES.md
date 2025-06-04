# MISSING API ENDPOINTS - IMPLEMENTATION ISSUES
## Project Shattered Timeline

This document contains implementation issues for missing API endpoints identified in the database coverage analysis.

---

## Boss Kill Tracking Endpoint - ✅ COMPLETED

**about:** Implement dedicated endpoint for tracking successful boss defeats separately from boss encounters

title: 'Implement Boss Kill Registration Endpoint'

---

## Description  
Currently, the system tracks boss encounters through `/api/runs/:runId/boss-encounter` but lacks a dedicated endpoint for registering successful boss kills. The database has a separate `boss_kills` table that should be populated when a boss is actually defeated, not just encountered.

This creates a distinction between:
- **Boss Encounters**: Combat statistics, damage dealt/taken, result codes
- **Boss Kills**: Successful defeats for achievement tracking and statistics

---

## Expected Behavior
- Add `POST /api/runs/:runId/boss-kill` endpoint
- Accept boss kill data including userId, enemyId, roomId
- Validate that the boss exists in `boss_details` table
- Insert record into `boss_kills` table with timestamp
- Return confirmation with killId
- Integrate with frontend boss defeat logic
- Update player statistics automatically

---

## Current Behavior
**IMPLEMENTED** - Boss kill endpoint has been successfully implemented and integrated.

**Implementation Details:**
- Backend endpoint `POST /api/runs/:runId/boss-kill` created in `videogame/api/app.js`
- Frontend API function `registerBossKill()` added to `videogame/src/utils/api.js`
- Boss class updated to call both enemy kill and boss kill endpoints on death
- Complete validation and error handling implemented
- API documentation added to README.md

---

## Time Estimate  
~~1 sprint~~ - **COMPLETED**

---

## Checklist 
- [x] Design endpoint specification
- [x] Implement backend route handler
- [x] Add input validation and error handling
- [x] Create database integration
- [x] Add frontend integration in boss combat logic
- [x] Write unit and integration tests
- [x] Update API documentation
- [x] Test with actual boss encounters

---

## Additional Notes  
**COMPLETED**: Implementation follows the pattern of calling when boss health reaches 0, after the boss encounter endpoint. Boss kill tracking is now functional and integrated with the existing boss combat system.

**Files Modified:**
- `videogame/api/app.js` - Added boss-kill endpoint
- `videogame/src/utils/api.js` - Added registerBossKill function
- `videogame/src/classes/entities/Boss.js` - Integrated boss kill tracking in die() method
- `videogame/api/README.md` - Added comprehensive API documentation

---

## Player Settings Management Endpoints

**about:** Implement CRUD endpoints for player audio and game settings persistence

title: 'Implement Player Settings Management API'

---

## Description  
The system lacks endpoints for managing player settings (audio volume, game preferences). The `player_settings` table exists but has no API coverage, causing settings to be lost between sessions.

Players need to:
- Retrieve their current settings on login
- Update individual settings during gameplay
- Persist settings across sessions and devices

---

## Expected Behavior
- Add `GET /api/users/:userId/settings` endpoint for retrieving current settings
- Add `PUT /api/users/:userId/settings` endpoint for updating settings
- Support partial updates (only changed fields)
- Validate setting values (volume levels 0-100)
- Create default settings for new users automatically
- Return appropriate error messages for invalid data

---

## Current Behavior
NONE YET

---

## Time Estimate  
1 sprint

---

## Checklist 
- [ ] Design settings schema and validation rules
- [ ] Implement GET settings endpoint
- [ ] Implement PUT settings update endpoint
- [ ] Add default settings creation on user registration
- [ ] Create input validation middleware
- [ ] Add frontend settings integration
- [ ] Write comprehensive tests
- [ ] Update API documentation

---

## Additional Notes  
Consider adding settings versioning for future compatibility. Settings should be cached in localStorage for offline access.

---

## Player Events Logging System

**about:** Implement comprehensive player action logging endpoint for analytics and debugging

title: 'Implement Player Events Logging Endpoint'

---

## Description  
The system needs a general purpose logging endpoint for tracking player actions, game events, and analytics data. The `player_events` table is designed for this but has no API integration.

This would enable:
- Detailed gameplay analytics
- Debugging player issues
- Performance monitoring
- Feature usage tracking
- A/B testing support

---

## Expected Behavior
- Add `POST /api/runs/:runId/events` endpoint for logging player actions
- Accept flexible event data (event_type, value, weapon_type, context)
- Validate event_type against `event_types` lookup table
- Support batch event logging for performance
- Implement rate limiting to prevent abuse
- Provide async processing for high-volume events

---

## Current Behavior
NONE YET

---

## Time Estimate  
1 sprint

---

## Checklist 
- [ ] Design event schema and validation
- [ ] Implement event logging endpoint
- [ ] Add batch logging support
- [ ] Implement rate limiting middleware
- [ ] Create event type management
- [ ] Add frontend event tracking integration
- [ ] Implement async event processing
- [ ] Write performance tests
- [ ] Create analytics dashboard queries

---

## Additional Notes  
Consider implementing event buffering on the frontend to reduce API calls. Events should be non-blocking and not affect gameplay performance.

---

## Player Statistics Update Endpoint

**about:** Add manual statistics update capability for data correction and administrative functions

title: 'Implement Player Statistics Update Endpoint'

---

## Description  
Currently, player statistics are only readable via `GET /api/users/:userId/stats`. There's no way to manually update statistics for data correction, administrative adjustments, or debugging purposes.

This creates issues when:
- Statistics become inconsistent due to bugs
- Administrative corrections are needed
- Testing requires specific stat states
- Data migration requires stat adjustments

---

## Expected Behavior
- Add `PUT /api/users/:userId/stats` endpoint for updating player statistics
- Support partial updates (only specified fields)
- Validate statistical data ranges and relationships
- Log all manual stat changes for audit purposes
- Require admin privileges for certain operations
- Update `updated_at` timestamp automatically

---

## Current Behavior
Statistics are read-only except through indirect game actions

---

## Time Estimate  
1 sprint

---

## Checklist 
- [ ] Design statistics update schema
- [ ] Implement PUT statistics endpoint
- [ ] Add administrative privilege checking
- [ ] Create audit logging for stat changes
- [ ] Add validation for statistical consistency
- [ ] Implement partial update support
- [ ] Write comprehensive validation tests
- [ ] Create administrative interface integration

---

## Additional Notes  
Consider adding statistics recalculation endpoint that rebuilds stats from historical data. Implement backup/restore functionality for critical stat changes.

---

## Player Upgrades Direct Access

**about:** Implement direct CRUD operations for player permanent upgrades management

title: 'Implement Player Upgrades Direct Management API'

---

## Description  
Player upgrades are currently only accessible indirectly through purchase endpoints. There's no way to directly query or manage upgrade states, making debugging and administrative tasks difficult.

Direct access would enable:
- Querying current upgrade levels
- Administrative upgrade adjustments
- Testing with specific upgrade states
- Debugging upgrade inconsistencies

---

## Expected Behavior
- Add `GET /api/users/:userId/upgrades` endpoint for retrieving all upgrades
- Add `GET /api/users/:userId/upgrades/:upgradeType` for specific upgrades
- Add `PUT /api/users/:userId/upgrades/:upgradeType` for direct upgrade updates
- Validate upgrade types against lookup table
- Enforce upgrade level constraints and relationships
- Log direct upgrade changes for audit purposes

---

## Current Behavior
Upgrades only accessible through purchase endpoints, no direct management

---

## Time Estimate  
1 sprint

---

## Checklist 
- [ ] Design upgrade management endpoints
- [ ] Implement GET all upgrades endpoint
- [ ] Implement GET specific upgrade endpoint
- [ ] Implement PUT upgrade update endpoint
- [ ] Add upgrade constraint validation
- [ ] Create audit logging for direct changes
- [ ] Add administrative interface integration
- [ ] Write comprehensive CRUD tests

---

## Additional Notes  
Consider adding upgrade dependency validation (prerequisite upgrades). Implement upgrade reset functionality for testing purposes.

---

## Enhanced Session Management

**about:** Expand session management capabilities beyond basic login/logout

title: 'Implement Enhanced Session Management Endpoints'

---

## Description  
Current session management only supports login (create) and logout (close) operations. Advanced session management features are needed for user experience and administrative purposes.

Missing capabilities:
- Viewing active sessions
- Managing multiple sessions per user
- Force-closing sessions administratively
- Session expiration handling
- Device/location tracking

---

## Expected Behavior
- Add `GET /api/users/:userId/sessions` endpoint for viewing user's active sessions
- Add `GET /api/sessions/:sessionId` endpoint for session details
- Add `DELETE /api/sessions/:sessionId` endpoint for force-closing sessions
- Add session metadata (device, IP, location, last_active)
- Implement automatic session cleanup for expired sessions
- Add session validation middleware

---

## Current Behavior
Only basic login/logout supported, no session management capabilities

---

## Time Estimate  
1 sprint

---

## Checklist 
- [ ] Design enhanced session schema
- [ ] Implement GET user sessions endpoint
- [ ] Implement GET session details endpoint
- [ ] Implement DELETE session endpoint
- [ ] Add session metadata tracking
- [ ] Implement automatic cleanup service
- [ ] Create session validation middleware
- [ ] Add administrative session management interface
- [ ] Write session security tests

---

## Additional Notes  
Consider implementing session concurrency limits. Add session analytics for security monitoring. Implement session transfer capabilities for device changes.

---

## General CRUD Enhancement

**about:** Add comprehensive CRUD operations for administrative and debugging capabilities

title: 'Implement Administrative CRUD Operations for Core Entities'

---

## Description  
Most entities currently only support CREATE and READ operations. Administrative and debugging scenarios require full CRUD capabilities including UPDATE and DELETE operations.

Entities needing enhancement:
- Run history management
- Enemy kill record management
- Shop purchase corrections
- Chest event management
- Equipment adjustments

---

## Expected Behavior
- Add UPDATE endpoints for major entities with administrative privileges
- Add DELETE endpoints for data correction and cleanup
- Implement soft delete where appropriate to preserve historical data
- Add comprehensive audit logging for all administrative actions
- Require appropriate authorization levels for destructive operations
- Provide data validation and constraint checking

---

## Current Behavior
Most entities are CREATE/READ only, limited administrative capabilities

---

## Time Estimate  
1 sprint

---

## Checklist 
- [ ] Analyze entities requiring CRUD enhancement
- [ ] Design authorization scheme for administrative operations
- [ ] Implement UPDATE endpoints with validation
- [ ] Implement DELETE endpoints with soft delete support
- [ ] Add comprehensive audit logging system
- [ ] Create administrative privilege management
- [ ] Implement data consistency checking
- [ ] Write administrative operation tests
- [ ] Create administrative interface integration

---

## Additional Notes  
Prioritize based on administrative needs. Consider implementing bulk operations for efficiency. Add data export/import capabilities for backup and migration scenarios. 