export const variables = {
  canvasWidth: 800,
  canvasHeight: 600,
  animationDelay: 100,
  playerSpeed: 0.3,
  ctx: null,
  game: null,
  oldTime: null,
  backgroundImage: new Image(),
};
// Ruta de la imagen de fondo
variables.backgroundImage.src = "../assets/background/background.jpg";

// Base walking animations (shared between weapons)
const walkingFrames = {
  up: [104, 112], // Row 9: Walking up (9 frames)
  down: [130, 138], // Row 11: Walking down (9 frames)
  left: [117, 125], // Row 10: Walking left (9 frames)
  right: [143, 151], // Row 12: Walking right (9 frames)
};

// Weapon-specific attack animations
const attackFrames = {
  dagger: {
    up: [156, 161], // Row 13: Dagger attack up (9 frames)
    down: [182, 187], // Row 15: Dagger attack down (9 frames)
    left: [169, 174], // Row 14: Dagger attack left (9 frames)
    right: [195, 200], // Row 16: Dagger attack right (9 frames)
  },
  slingshot: {
    up: [208, 220], // Row 17: Slingshot attack up (9 frames)
    down: [234, 246], // Row 19: Slingshot attack down (9 frames)
    left: [221, 233], // Row 18: Slingshot attack left (9 frames)
    right: [247, 259], // Row 20: Slingshot attack right (9 frames)
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
  return (
    attackFrames[weaponType]?.[attackDirection] || attackFrames.dagger.down
  );
}

export const keyDirections = {
  w: "up",
  s: "down",
  a: "left",
  d: "right",
  " ": "attack",
  1: "dagger",
  2: "slingshot",
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
