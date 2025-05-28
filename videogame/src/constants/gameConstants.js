/**
 * Game constants and configuration
 * Central location for all magic numbers and game balance values
 */

// Player constants
export const PLAYER_CONSTANTS = {
  // Base stats
  MAX_HEALTH: 20000,
  BASE_SPEED: 0.3,
  BASE_SIZE: { width: 64, height: 64 },

  // Dash mechanics
  DASH_MULTIPLIER: 3,
  DASH_DURATION: 100,
  DASH_COOLDOWN: 0,

  // Stamina system
  MAX_STAMINA: 100,
  STAMINA_REGEN_RATE: 15, // per second
  STAMINA_REGEN_DELAY: 1000, // ms before regen starts

  // Invulnerability
  INVULNERABILITY_DURATION: 1000, // ms

  // Attack constants
  DAGGER_ATTACK_RANGE: 100,
  DAGGER_ATTACK_WIDTH: 100,
  DAGGER_ATTACK_DAMAGE: 100,
  DAGGER_STAMINA_COST: 8,

  SLINGSHOT_DAMAGE: 15,
  SLINGSHOT_STAMINA_COST: 12,
  SLINGSHOT_PROJECTILE_SPEED: 300,

  ATTACK_COOLDOWN: 500, // ms
  RAYCAST_STEP_SIZE: 5,
};

// Enemy constants
export const ENEMY_CONSTANTS = {
  // Goblin Dagger
  GOBLIN_DAGGER: {
    size: { width: 32, height: 32 },
    health: 20,
    damage: 10,
    speed: PLAYER_CONSTANTS.BASE_SPEED * 0.7,
    attackRange: 32,
    attackCooldown: 1000,
  },

  // Goblin Archer
  GOBLIN_ARCHER: {
    size: { width: 32, height: 32 },
    health: 30,
    damage: 15,
    speed: 0, // Static enemy
    attackRange: 200,
    attackCooldown: 2000,
    projectileSpeed: 300,
    retreatDistance: 80,
  },
};

// Room constants
export const ROOM_CONSTANTS = {
  TILE_SIZE: 32,
  TRANSITION_ZONE_SIZE: 64,
  MIN_SAFE_DISTANCE: 16,

  // Enemy generation
  MIN_ENEMIES: 6,
  MAX_ENEMIES: 10,
  COMMON_ENEMY_RATIO: { min: 0.6, max: 0.8 },
  MAX_PLACEMENT_ATTEMPTS: 50,

  // Safe zone for player spawn
  SAFE_ZONE_SIZE: { width: 128, height: 128 },

  // Chest spawn
  CHEST_SIZE: 64,
  CHEST_SAFE_MARGIN: 32,
  CHEST_GOLD_REWARD: 50,
};

// UI constants
export const UI_CONSTANTS = {
  // Health/stamina bars
  BAR_WIDTH: 200,
  BAR_HEIGHT: 20,
  BAR_X: 40,
  HEALTH_BAR_Y: 40,
  STAMINA_BAR_Y: 70,

  // Weapon icons
  ICON_SIZE: 20,
  ICON_START_X: 100,
  ICON_START_Y: 100,
  ICON_SPACING: 10,

  // Gold counter
  GOLD_ICON_X: 40,
  GOLD_ICON_Y: 100,
  GOLD_TEXT_X: 65,
  GOLD_TEXT_Y: 115,
};

// Physics constants
export const PHYSICS_CONSTANTS = {
  // Hitbox scaling
  PLAYER_HITBOX_SCALE: 0.6,
  PLAYER_HITBOX_OFFSET_X: 0.2,
  PLAYER_HITBOX_OFFSET_Y: 0.3,
  ENEMY_HITBOX_SCALE: 0.6,
  DEFAULT_HITBOX_SCALE: 0.6,

  // Collision detection
  COLLISION_MARGIN: 2,

  // Projectile constants
  PROJECTILE_RADIUS: 5,
  PROJECTILE_LIFETIME: 5000, // ms
};

// Animation constants
export const ANIMATION_CONSTANTS = {
  DEFAULT_DELAY: 100, // ms between frames
  ATTACK_DURATION: 100,

  // Glow effects
  GLOW_PULSE_SPEED: 0.003,
  GLOW_INTENSITY_BASE: 0.7,
  GLOW_INTENSITY_VARIATION: 0.3,
};

// Floor generation constants
export const FLOOR_CONSTANTS = {
  ROOMS_PER_FLOOR: {
    COMBAT: 4,
    SHOP: 1,
    BOSS: 1,
    TOTAL: 6,
  },
  MAX_FLOORS_PER_RUN: 3,
  INITIAL_RUN_COUNT: 1,
};

// Shop constants
export const SHOP_CONSTANTS = {
  UI: {
    BACKGROUND_COLOR: "rgba(20, 20, 30, 0.95)",
    BORDER_COLOR: "#444",
    TEXT_COLOR: "#fff",
    SELECTED_COLOR: "#4CAF50",
    DISABLED_COLOR: "#666",
    GOLD_COLOR: "#FFD700",
    ERROR_COLOR: "#FF6B6B",
    WIDTH: 600,
    HEIGHT: 400,
    OPTION_HEIGHT: 100,
    PADDING: 20,
    BORDER_WIDTH: 3,
  },
  FONTS: {
    TITLE: "bold 32px Arial",
    GOLD: "20px Arial",
    OPTION_NAME: "bold 20px Arial",
    DESCRIPTION: "16px Arial",
    INSTRUCTIONS: "16px Arial",
    PURCHASE_COUNT: "14px Arial",
  },
  UPGRADES: {
    MELEE: {
      NAME: "Primary Weapon Upgrade",
      DESCRIPTION: "Increases melee damage by +3",
      COST: 35,
      MAX_PURCHASES: 15,
      DAMAGE_INCREASE: 3,
    },
    RANGED: {
      NAME: "Secondary Weapon Upgrade",
      DESCRIPTION: "Increases ranged damage by +4",
      COST: 40,
      MAX_PURCHASES: 15,
      DAMAGE_INCREASE: 4,
    },
    HEALTH: {
      NAME: "Full Health Restoration",
      DESCRIPTION: "Restores HP to maximum",
      COST: 50,
      MAX_PURCHASES: Infinity,
    },
  },
};

// Debug constants
export const DEBUG_CONSTANTS = {
  SHOW_HITBOXES: false,
  SHOW_FPS: false,
  ENABLE_DEBUG_COMMANDS: true,
  LOG_LEVEL: 2, // INFO level
};
