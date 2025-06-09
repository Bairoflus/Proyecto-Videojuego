// Canvas Variables

// Hitbox scaling constants
// These control how much smaller the hitbox is compared to the sprite
export const HITBOX_SCALE = {
  player: 0.5, // Player hitbox is 50% of sprite size
  enemy: 0.6, // Enemy hitbox is 60% of sprite size
};

export const variables = {
  // Dimensiones del canvas
  canvasWidth: 800, // 25 * 32
  canvasHeight: 608, // 19 * 32
  // Retardo de animación en milisegundos
  animationDelay: 100,
  playerSpeed: 0.3,
  ctx: null,
  game: null,
  oldTime: null,
  backgroundImage: new Image(),
  showHitboxes: true, // Enable hitbox visualization for debugging
};
variables.backgroundImage.src = "/assets/backgrounds/backgroundfloor1.jpg";

// Base walking animations (shared between weapons)
// All walk.png sprites have 9 columns, 4 rows
const walkingFrames = {
  up: [0, 8], // Row 0: frames 0-8 (walk up)
  left: [9, 17], // Row 1: frames 9-17 (walk left)
  down: [18, 26], // Row 2: frames 18-26 (walk down)
  right: [27, 35], // Row 3: frames 27-35 (walk right)
};

// Weapon-specific attack animations
const attackFrames = {
  dagger: {
    up: [0, 5], // videogame/assets/sprites/player/dagger/slash.png, row 0, 6 frames
    left: [6, 11], // videogame/assets/sprites/player/dagger/slash.png, row 1, 6 frames
    down: [12, 17], // videogame/assets/sprites/player/dagger/slash.png, row 2, 6 frames
    right: [18, 23], // videogame/assets/sprites/player/dagger/slash.png, row 3, 6 frames
  },
  katana: {
    up: [0, 5], // videogame/assets/sprites/player/katana/slash.png, row 0, 6 frames
    left: [6, 11], // videogame/assets/sprites/player/katana/slash.png, row 1, 6 frames
    down: [12, 17], // videogame/assets/sprites/player/katana/slash.png, row 2, 6 frames
    right: [18, 23], // videogame/assets/sprites/player/katana/slash.png, row 3, 6 frames
  },
  lightsaber: {
    up: [0, 5], // videogame/assets/sprites/player/lightsaber/slash.png, row 0, 6 frames
    left: [6, 11], // videogame/assets/sprites/player/lightsaber/slash.png, row 1, 6 frames
    down: [12, 17], // videogame/assets/sprites/player/lightsaber/slash.png, row 2, 6 frames
    right: [18, 23], // videogame/assets/sprites/player/lightsaber/slash.png, row 3, 6 frames
  },
  slingshot: {
    up: [0, 12], // shoot.png, row 0, 13 frames (0-12)
    left: [13, 25], // shoot.png, row 1, 13 frames (13-25)
    down: [26, 38], // shoot.png, row 2, 13 frames (26-38)
    right: [39, 51], // shoot.png, row 3, 13 frames (39-51)
  },
  bow: {
    up: [0, 12], // shoot.png, row 0, 13 frames (0-12)
    left: [13, 25], // shoot.png, row 1, 13 frames (13-25)
    down: [26, 38], // shoot.png, row 2, 13 frames (26-38)
    right: [39, 51], // shoot.png, row 3, 13 frames (39-51)
  },
  crossbow: {
    up: [0, 7], // videogame/assets/sprites/player/crossbow/shoot.png, row 0, 8 frames
    left: [8, 15], // videogame/assets/sprites/player/crossbow/shoot.png, row 1, 8 frames
    down: [16, 23], // videogame/assets/sprites/player/crossbow/shoot.png, row 2, 8 frames
    right: [24, 31], // videogame/assets/sprites/player/crossbow/shoot.png, row 3, 8 frames
  },
};

// Animation state management
let activeFrames = { ...walkingFrames };

export function getActiveFrames() {
  return activeFrames;
}

export function getAttackFrames(weaponType, direction) {
  // If direction is idle, use down attack frames
  const attackDirection = direction === "idle" ? "down" : direction;
  const frames = attackFrames[weaponType]?.[attackDirection];

  if (!frames) {
    // Attack frame fallback debugging removed to reduce console spam
    return attackFrames.dagger.down;
  }

  return frames;
}

export const keyDirections = {
  w: "up",
  s: "down",
  a: "left",
  d: "right",
  " ": "attack",
  1: "melee",
  2: "ranged",
  shift: "dash",
};

export const playerMovement = {
  up: {
    axis: "y",
    direction: -1,
    get frames() {
      return getActiveFrames().up;
    },
    repeat: true,
    duration: variables.animationDelay,
  },
  down: {
    axis: "y",
    direction: 1,
    get frames() {
      return getActiveFrames().down;
    },
    repeat: true,
    duration: variables.animationDelay,
  },
  left: {
    axis: "x",
    direction: -1,
    get frames() {
      return getActiveFrames().left;
    },
    repeat: true,
    duration: variables.animationDelay,
  },
  right: {
    axis: "x",
    direction: 1,
    get frames() {
      return getActiveFrames().right;
    },
    repeat: true,
    duration: variables.animationDelay,
  },
  idle: {
    axis: "y",
    direction: 0,
    get frames() {
      return [getActiveFrames().down[0], getActiveFrames().down[0]];
    },
    repeat: false,
    duration: variables.animationDelay,
  },
};

export const playerAttack = {
  duration: variables.animationDelay,
  cooldown: 500, // 500ms cooldown between attacks
  repeat: false,
};
