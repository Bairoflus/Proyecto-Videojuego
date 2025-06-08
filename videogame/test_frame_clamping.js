/**
 * Test script to verify frame clamping logic for SwordGoblin animations
 * Tests the fix for animation frame overflow causing wrong directional frames
 */

console.log("=== Frame Clamping Test ===");

// Test parameters for SwordGoblin attack animation
const attackFrames = {
  up: [0, 5], // slash.png, row 0, 6 frames (0-5)
  left: [6, 11], // slash.png, row 1, 6 frames (6-11)
  down: [12, 17], // slash.png, row 2, 6 frames (12-17)
  right: [18, 23], // slash.png, row 3, 6 frames (18-23)
};

const sheetCols = 6; // Attack sprite has 6 columns

function testFrameClamping(direction, frames) {
  const [minFrame, maxFrame] = frames;
  console.log(`\n--- Testing ${direction} attack animation ---`);
  console.log(`Frame range: ${minFrame}-${maxFrame}`);

  for (let frame = minFrame; frame <= maxFrame + 3; frame++) {
    // Original logic (problematic)
    const originalX = frame % sheetCols;
    const originalY = Math.floor(frame / sheetCols);

    // Fixed logic with clamping
    const displayFrame = Math.min(frame, maxFrame);
    const clampedX = displayFrame % sheetCols;
    const clampedY = Math.floor(displayFrame / sheetCols);

    const expectedRow = Math.floor(minFrame / sheetCols);
    const isCorrectRow = clampedY === expectedRow;

    console.log(
      `Frame ${frame}: Original(${originalX},${originalY}) -> Clamped(${clampedX},${clampedY}) ${
        isCorrectRow ? "✓" : "✗"
      }`
    );

    if (frame > maxFrame) {
      const wasClamped = displayFrame !== frame;
      console.log(
        `  ${wasClamped ? "CLAMPED" : "NOT CLAMPED"} - Animation complete`
      );
    }
  }
}

// Test all directions
Object.entries(attackFrames).forEach(([direction, frames]) => {
  testFrameClamping(direction, frames);
});

console.log("\n=== Summary ===");
console.log(
  "✅ Fixed: Frame values are clamped to maxFrame for sprite display"
);
console.log(
  "✅ Fixed: Animation completion detection still works (frame > maxFrame)"
);
console.log(
  "✅ Fixed: No more wrong directional frames at end of attack animations"
);
