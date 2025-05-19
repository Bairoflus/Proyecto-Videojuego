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

export const keyDirections = {
  w: "up",
  s: "down",
  a: "left",
  d: "right",
};

export const playerMovement = {
  up: {
    axis: "y",
    direction: -1,
    frames: [104, 112],
    repeat: true,
    duration: variables.animationDelay,
  },
  down: {
    axis: "y",
    direction: 1,
    frames: [130, 138],
    repeat: true,
    duration: variables.animationDelay,
  },
  left: {
    axis: "x",
    direction: -1,
    frames: [117, 125],
    repeat: true,
    duration: variables.animationDelay,
  },
  right: {
    axis: "x",
    direction: 1,
    frames: [143, 151],
    repeat: true,
    duration: variables.animationDelay,
  },
  idle: {
    axis: "y",
    direction: 0,
    frames: [130, 130],
    repeat: true,
    duration: variables.animationDelay,
  },
};
