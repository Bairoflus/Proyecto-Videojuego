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

// Background system for different floors and rooms
export const BACKGROUND_CONFIG = {
  // Floor 1 backgrounds (6 different backgrounds for 6 rooms)
  floor1: [
    "/assets/backgrounds/floor1/grass.png", // Room 1 (Combat)
    "/assets/backgrounds/floor1/woods.png", // Room 2 (Combat)
    "/assets/backgrounds/floor1/swamp.png", // Room 3 (Combat)
    "/assets/backgrounds/floor1/cave.png", // Room 4 (Combat)
    "/assets/backgrounds/floor1/store.png", // Room 5 (Shop)
    "/assets/backgrounds/floor1/volcano.png", // Room 6 (Boss)
  ],
  // Floor 2 backgrounds (futuristic/industrial theme)
  floor2: [
    "/assets/backgrounds/floor2/factory.png", // Room 1 (Combat)
    "/assets/backgrounds/floor2/factory2.png", // Room 2 (Combat)
    "/assets/backgrounds/floor2/school.png", // Room 3 (Combat)
    "/assets/backgrounds/floor2/street.png", // Room 4 (Combat)
    "/assets/backgrounds/floor2/store.png", // Room 5 (Shop)
    "/assets/backgrounds/floor2/boss.png", // Room 6 (Boss)
  ],
  // Floor 3 backgrounds (neon/cyberpunk theme)
  floor3: [
    "/assets/backgrounds/floor3/neon_room.png", // Room 1 (Combat)
    "/assets/backgrounds/floor3/street2.png", // Room 2 (Combat)
    "/assets/backgrounds/floor3/spaceship.png", // Room 3 (Combat)
    "/assets/backgrounds/floor3/street.png", // Room 4 (Combat)
    "/assets/backgrounds/floor3/store.png", // Room 5 (Shop)
    "/assets/backgrounds/floor3/boss.png", // Room 6 (Boss)
  ],
};

// Initialize with default background (will be updated dynamically)
variables.backgroundImage.src = BACKGROUND_CONFIG.floor1[0];

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
    up: [0, 11], // videogame/assets/sprites/player/slingshot/shoot.png, row 0, 12 frames (exclude frame 12)
    left: [13, 24], // videogame/assets/sprites/player/slingshot/shoot.png, row 1, 12 frames (exclude frame 25)
    down: [26, 37], // videogame/assets/sprites/player/slingshot/shoot.png, row 2, 12 frames (exclude frame 38)
    right: [39, 50], // videogame/assets/sprites/player/slingshot/shoot.png, row 3, 12 frames (exclude frame 51)
  },
  bow: {
    up: [0, 11], // videogame/assets/sprites/player/bow/shoot.png, row 0, 12 frames (exclude frame 12)
    left: [13, 24], // videogame/assets/sprites/player/bow/shoot.png, row 1, 12 frames (exclude frame 25)
    down: [26, 37], // videogame/assets/sprites/player/bow/shoot.png, row 2, 12 frames (exclude frame 38)
    right: [39, 50], // videogame/assets/sprites/player/bow/shoot.png, row 3, 12 frames (exclude frame 51)
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

// Background management functions
export function updateBackgroundForRoom(floor, roomIndex) {
  try {
    const floorKey = `floor${floor}`;
    const backgroundsForFloor = BACKGROUND_CONFIG[floorKey];

    if (!backgroundsForFloor) {
      console.warn(
        `No backgrounds configured for floor ${floor}, using floor 1 backgrounds`
      );
      const fallbackBackground =
        BACKGROUND_CONFIG.floor1[roomIndex] || BACKGROUND_CONFIG.floor1[0];
      variables.backgroundImage.src = fallbackBackground;
      return;
    }

    // Ensure roomIndex is within bounds
    const backgroundIndex = Math.min(roomIndex, backgroundsForFloor.length - 1);
    const newBackgroundSrc = backgroundsForFloor[backgroundIndex];

    // Only update if it's a different background
    if (variables.backgroundImage.src !== newBackgroundSrc) {
      console.log(
        `Changing background for Floor ${floor}, Room ${
          roomIndex + 1
        }: ${newBackgroundSrc}`
      );
      variables.backgroundImage.src = newBackgroundSrc;

      // Ensure the new background loads properly
      variables.backgroundImage.onload = () => {
        console.log(`Background loaded successfully: ${newBackgroundSrc}`);
      };

      variables.backgroundImage.onerror = () => {
        console.error(
          `Failed to load background: ${newBackgroundSrc}, using fallback`
        );
        variables.backgroundImage.src = BACKGROUND_CONFIG.floor1[0]; // Fallback to first background
      };
    }
  } catch (error) {
    console.error(
      `Error updating background for Floor ${floor}, Room ${roomIndex}:`,
      error
    );
    // Fallback to default background
    variables.backgroundImage.src = BACKGROUND_CONFIG.floor1[0];
  }
}

export function preloadBackgrounds() {
  console.log("Preloading all background images...");
  const allBackgrounds = new Set();

  // Collect all unique background paths
  Object.values(BACKGROUND_CONFIG).forEach((floorBackgrounds) => {
    floorBackgrounds.forEach((bgPath) => allBackgrounds.add(bgPath));
  });

  // Preload each unique background
  const preloadPromises = Array.from(allBackgrounds).map((bgPath) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        console.log(`Preloaded background: ${bgPath}`);
        resolve(bgPath);
      };
      img.onerror = () => {
        console.warn(`Failed to preload background: ${bgPath}`);
        reject(bgPath);
      };
      img.src = bgPath;
    });
  });

  return Promise.allSettled(preloadPromises);
}
