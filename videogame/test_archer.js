// Simple test to verify GoblinArcher implementation
import { GoblinArcher } from "./src/classes/enemies/floor1/GoblinArcher.js";
import { Vec } from "./src/utils/Vec.js";

// console.log("Testing GoblinArcher implementation...");

try {
  // Create a goblin archer
  const archer = new GoblinArcher(new Vec(100, 100));

  // console.log("✓ GoblinArcher constructor works");
  // console.log(`  - Position: (${archer.position.x}, ${archer.position.y})`);
  // console.log(`  - Current direction: ${archer.currentDirection}`);
  // console.log(`  - Sheet columns: ${archer.sheetCols}`);
  // console.log(`  - Attack range: ${archer.attackRange}`);
  // console.log(`  - Projectile speed: ${archer.projectileSpeed}`);

  // Test frame calculations
  const walkFrames = archer.getWalkFrames("down");
  const shootFrames = archer.getShootFrames("down");

  // console.log("✓ Frame calculation methods work");
  // console.log(`  - Walk frames (down): [${walkFrames[0]}, ${walkFrames[1]}]`);
  // console.log(
  //   `  - Shoot frames (down): [${shootFrames[0]}, ${shootFrames[1]}]`
  // );

  // Test direction updates
  archer.updateDirectionFromMovement();
  // console.log("✓ Direction update methods work");

  // Test state transitions
  archer.state = "attacking";
  archer.updateAnimation();
  // console.log(
  //   `✓ Animation state change works (sheetCols now: ${archer.sheetCols})`
  // );

  // console.log(
  //   "\n🎯 All GoblinArcher tests passed! Implementation is working correctly."
  // );
} catch (error) {
  console.error("❌ Test failed:", error.message);
  console.error(error.stack);
}
