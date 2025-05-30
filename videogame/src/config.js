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
variables.backgroundImage.src = "../assets/backgrounds/backgroundfloor1.jpg";

// Base walking animations (shared between weapons)
// Common sprite sheet layout: Down, Left, Right, Up in rows
const walkingFrames = {
  down: [26, 34], // Row 0: Walking down
  left: [13, 21], // Row 1: Walking left
  right: [39, 47], // Row 2: Walking right
  up: [0, 8], // Row 3: Walking up
};

// Weapon-specific attack animations
const attackFrames = {
  dagger: {
    up: [0, 5], // slash.png, row 0, 6 frames
    left: [6, 11], // slash.png, row 1, 6 frames
    down: [12, 17], // slash.png, row 2, 6 frames
    right: [18, 23], // slash.png, row 3, 6 frames
  },
  katana: {
    up: [0, 5], // slash.png, row 0, 6 frames
    left: [6, 11], // slash.png, row 1, 6 frames
    down: [12, 17], // slash.png, row 2, 6 frames
    right: [18, 23], // slash.png, row 3, 6 frames
  },
  lightsaber: {
    up: [0, 5], // slash.png, row 0, 6 frames
    left: [6, 11], // slash.png, row 1, 6 frames
    down: [12, 17], // slash.png, row 2, 6 frames
    right: [18, 23], // slash.png, row 3, 6 frames
  },
  slingshot: {
    up: [0, 12], // shoot.png, row 0, 13 frames
    left: [13, 25], // shoot.png, row 1, 13 frames
    down: [26, 38], // shoot.png, row 2, 13 frames
    right: [39, 51], // shoot.png, row 3, 13 frames
  },
  bow: {
    up: [0, 12], // shoot.png, row 0, 13 frames
    left: [13, 25], // shoot.png, row 1, 13 frames
    down: [26, 38], // shoot.png, row 2, 13 frames
    right: [39, 51], // shoot.png, row 3, 13 frames
  },
  crossbow: {
    up: [0, 7], // shoot.png, row 0, 8 frames
    left: [8, 15], // shoot.png, row 1, 8 frames
    down: [16, 23], // shoot.png, row 2, 8 frames
    right: [24, 31], // shoot.png, row 3, 8 frames
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
    console.log(
      `Warning: No attack frames found for weapon ${weaponType} in direction ${attackDirection}, using fallback`
    );
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
  1: "dagger",
  2: "slingshot",
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
