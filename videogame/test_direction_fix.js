/**
 * Test SwordGoblin direction calculation logic
 */

// Simulate the direction calculation logic from SwordGoblin
function calculateDirection(targetPos, currentPos) {
  const direction = {
    x: targetPos.x - currentPos.x,
    y: targetPos.y - currentPos.y,
  };

  const newDirection =
    Math.abs(direction.y) > Math.abs(direction.x)
      ? direction.y > 0
        ? "down"
        : "up"
      : direction.x > 0
      ? "right"
      : "left";

  return { direction, newDirection };
}

// Test cases
console.log("=== Direction Calculation Tests ===");

// Test upward movement (player above goblin)
const goblinPos = { x: 100, y: 100 };
const playerAbove = { x: 100, y: 50 }; // Player is above (lower Y)
const result1 = calculateDirection(playerAbove, goblinPos);
console.log(
  `Player above: direction vector (${result1.direction.x}, ${result1.direction.y}) -> ${result1.newDirection}`
);

// Test downward movement (player below goblin)
const playerBelow = { x: 100, y: 150 }; // Player is below (higher Y)
const result2 = calculateDirection(playerBelow, goblinPos);
console.log(
  `Player below: direction vector (${result2.direction.x}, ${result2.direction.y}) -> ${result2.newDirection}`
);

// Test left movement
const playerLeft = { x: 50, y: 100 }; // Player is to the left
const result3 = calculateDirection(playerLeft, goblinPos);
console.log(
  `Player left: direction vector (${result3.direction.x}, ${result3.direction.y}) -> ${result3.newDirection}`
);

// Test right movement
const playerRight = { x: 150, y: 100 }; // Player is to the right
const result4 = calculateDirection(playerRight, goblinPos);
console.log(
  `Player right: direction vector (${result4.direction.x}, ${result4.direction.y}) -> ${result4.newDirection}`
);

console.log("\n=== Frame Range Tests ===");

// Test the getFrameRange logic
function getFrameRange(direction, layoutCols) {
  const directionMap = {
    up: 0, // Row 0 for up movement
    left: 1, // Row 1 for left movement
    down: 2, // Row 2 for down movement
    right: 3, // Row 3 for right movement
  };

  const row = directionMap[direction] || 2; // Default to down
  const startFrame = row * layoutCols;
  const endFrame = startFrame + layoutCols - 1;

  return [startFrame, endFrame];
}

// Test walk frames (9 columns)
console.log("Walk frames (9 cols):");
console.log(`up: ${getFrameRange("up", 9)}`);
console.log(`left: ${getFrameRange("left", 9)}`);
console.log(`down: ${getFrameRange("down", 9)}`);
console.log(`right: ${getFrameRange("right", 9)}`);

// Test attack frames (6 columns)
console.log("\nAttack frames (6 cols):");
console.log(`up: ${getFrameRange("up", 6)}`);
console.log(`left: ${getFrameRange("left", 6)}`);
console.log(`down: ${getFrameRange("down", 6)}`);
console.log(`right: ${getFrameRange("right", 6)}`);
