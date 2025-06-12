-- ===================================================
-- ADMIN USER SETUP FOR SHATTERED TIMELINE
-- ===================================================
-- Purpose: Create admin user for accessing the optimized admin dashboard
-- Execute: After dbshatteredtimeline3forperm.sql and objects3.sql
-- ===================================================

USE dbshatteredtimeline;

-- Create admin user with REAL pre-hashed password
-- Password: "admin123" (hashed with bcrypt, rounds=10) - REAL HASH
INSERT IGNORE INTO users (username, email, password_hash, role, is_active, created_at) VALUES 
('admin', 'admin@shatteredtimeline.com', '$2b$10$inT66ccyC1oDn2D66/auXuBKdp2JaBvB4RXvFe0aL8uwIA7YMmKca', 'admin', TRUE, NOW());

-- Create development admin user with REAL pre-hashed password
-- Password: "devteam2024" (hashed with bcrypt, rounds=10) - REAL HASH
INSERT IGNORE INTO users (username, email, password_hash, role, is_active, created_at) VALUES 
('devteam', 'dev@shatteredtimeline.com', '$2b$10$fwFvOr17AZPxoRxVJYzkE.7EGvosFjqYBgvIb360o9IOLI3dLihK2', 'admin', TRUE, NOW());

-- Verify admin users were created
SELECT 
    user_id,
    username, 
    email, 
    role, 
    is_active,
    created_at,
    'Password: admin123' as admin_password,
    'Password: devteam2024' as devteam_password
FROM users 
WHERE role = 'admin' 
ORDER BY created_at DESC;

-- ===================================================
-- ADMIN ACCESS INSTRUCTIONS
-- ===================================================

/*
ADMIN PANEL ACCESS:

1. URL: http://localhost:8080/pages/html/admin.html
   
2. Credentials:
   Username: admin
   Password: admin123
   
   OR
   
   Username: devteam  
   Password: devteam2024

3. Security Features:
   - Independent authentication system
   - Role-based access control  
   - Session token verification
   - Admin-only endpoints protection
   - No public links to admin panel

4. Implemented Analytics:
   - First Run Masters (players who beat all 3 bosses on first try)
   - Permanent Upgrade Adoption (which upgrades players buy first)
   - Player Progression (experience tiers only)
   - Playtime Leaderboard
   - Active Players Status
   - Live Games Monitoring

5. Chart Visualizations:
   - Activity Trends (registrations vs logins)
   - Playtime Distribution (hours played)
   - Run Experience Distribution (by run count)
   - Upgrade Adoption Rates
   - Session Duration Distribution

6. Removed Unnecessary Features:
   - Floor leaderboards (only 3 floors)
   - Boss leaderboards (no developer value)
   - Economy analytics (not needed)
   - Combat analytics (not needed)

ENJOY YOUR SIMPLIFIED ADMIN DASHBOARD v2.1!
*/ 