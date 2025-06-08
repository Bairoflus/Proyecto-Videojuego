/**
 * Test to debug SwordGoblin direction issues
 */

// Test direction calculations
const directions = [
  { x: 0, y: -50, expected: "up" }, // Moving up
  { x: 0, y: 50, expected: "down" }, // Moving down
  { x: -50, y: 0, expected: "left" }, // Moving left
  { x: 50, y: 0, expected: "right" }, // Moving right
  { x: 30, y: -40, expected: "up" }, // Diagonal up-right (up dominant)
  { x: -30, y: -40, expected: "up" }, // Diagonal up-left (up dominant)
];

console.log("=== Direction Calculation Test ===");
directions.forEach((test, i) => {
  const direction = test;

  // SwordGoblin direction calculation logic
  const newDirection =
    Math.abs(direction.y) > Math.abs(direction.x)
      ? direction.y > 0
        ? "down"
        : "up"
      : direction.x > 0
      ? "right"
      : "left";

  const passed = newDirection === test.expected;
  console.log(
    `Test ${i + 1}: (${direction.x}, ${
      direction.y
    }) -> ${newDirection} (expected: ${test.expected}) ${passed ? "✓" : "✗"}`
  );
});

// Test frame range calculations
console.log("\n=== Frame Range Test ===");
const layoutCols = 9; // Walk sprites have 9 columns
const directions_frames = ["up", "left", "down", "right"];

directions_frames.forEach((dir) => {
  const directionMap = {
    up: 0, // Row 0
    left: 1, // Row 1
    down: 2, // Row 2
    right: 3, // Row 3
  };

  const row = directionMap[dir] || 2;
  const startFrame = row * layoutCols;
  const endFrame = startFrame + layoutCols - 1;

  console.log(`${dir}: Row ${row}, Frames ${startFrame}-${endFrame}`);
});
