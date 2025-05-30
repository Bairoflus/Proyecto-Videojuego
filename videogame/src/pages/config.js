// API Configuration for Shattered Timeline Frontend
export const API_CONFIG = {
    BASE_URL: 'http://localhost:3002/api',
    ENDPOINTS: {
        REGISTER: '/auth/register',
        LOGIN: '/auth/login',
        LOGOUT: '/auth/logout',
        SESSIONS: '/sessions',
        RUNS: '/runs',
        WEAPONS: '/runs', // Base for /runs/:run_id/weapons
        HEALTH: '/health'
    },
    TIMEOUT: 10000 // 10 seconds
}; 