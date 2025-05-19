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
variables.backgroundImage.src = "./assets/background/background.jpg";

// Base walking animations (shared between weapons)
const walkingFrames = {
  up: [104, 112], // Row 9: Walking up (9 frames)
  down: [130, 138], // Row 11: Walking down (9 frames)
  left: [117, 125], // Row 10: Walking left (9 frames)
  right: [143, 151], // Row 12: Walking right (9 frames)
};

// Animation state management
let activeFrames = { ...walkingFrames };

export function getActiveFrames() {
  return activeFrames;
}

export const keyDirections = {
  w: "up",
  s: "down",
  a: "left",
  d: "right",
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
    repeat: true,
    duration: variables.animationDelay,
  },
};
