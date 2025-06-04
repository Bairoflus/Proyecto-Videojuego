// Test script to verify SwordGoblin implementation
import { Room } from "./src/classes/rooms/Room.js";
import { SwordGoblin } from "./src/classes/enemies/floor1/SwordGoblin.js";
import { Vec } from "./src/utils/Vec.js";

// Test SwordGoblin creation
console.log("=== TESTING SWORDGOBLIN IMPLEMENTATION ===");

try {
  // Test 1: Direct SwordGoblin creation
  console.log("\n1. Testing direct SwordGoblin creation:");
  const testGoblin = new SwordGoblin(new Vec(100, 100));
  console.log("✓ SwordGoblin created successfully");
  console.log(
    `  - Position: (${testGoblin.position.x}, ${testGoblin.position.y})`
  );
  console.log(`  - Type: ${testGoblin.type}`);
  console.log(`  - Damage: ${testGoblin.damage}`);
  console.log(`  - Speed: ${testGoblin.speed}`);
  console.log(`  - Attack Range: ${testGoblin.attackRange}`);
  console.log(`  - Attack Cooldown: ${testGoblin.attackCooldown}ms`);
  console.log(`  - Sheet Columns: ${testGoblin.sheetCols}`);
  console.log(`  - State: ${testGoblin.state}`);

  // Test 2: Sprite switching logic
  console.log("\n2. Testing sprite switching:");
  const initialSprite = testGoblin.spritePath;
  console.log(`  - Initial sprite: ${initialSprite}`);

  // Simulate attack state
  testGoblin.state = "attacking";
  testGoblin.updateAnimation();
  console.log(`  - Attack sprite: ${testGoblin.spritePath}`);
  console.log(`  - Attack sheet columns: ${testGoblin.sheetCols}`);

  // Return to walk state
  testGoblin.state = "moving";
  testGoblin.updateAnimation();
  console.log(`  - Back to walk sprite: ${testGoblin.spritePath}`);
  console.log(`  - Walk sheet columns: ${testGoblin.sheetCols}`);

  // Test 3: Room generation with SwordGoblins
  console.log("\n3. Testing room generation:");
  const testRoom = new Room(1, "combat");
  testRoom.generateEnemies();

  const swordGoblins = testRoom.objects.enemies.filter(
    (enemy) => enemy.type === "sword_goblin"
  );
  const daggerGoblins = testRoom.objects.enemies.filter(
    (enemy) => enemy.type === "dagger_goblin"
  );
  const totalCommonEnemies = swordGoblins.length + daggerGoblins.length;

  console.log(`  - Total enemies: ${testRoom.objects.enemies.length}`);
  console.log(`  - SwordGoblins: ${swordGoblins.length}`);
  console.log(`  - DaggerGoblins: ${daggerGoblins.length}`);
  console.log(`  - Common enemies total: ${totalCommonEnemies}`);

  if (totalCommonEnemies > 0) {
    const swordGoblinPercentage = (
      (swordGoblins.length / totalCommonEnemies) *
      100
    ).toFixed(1);
    console.log(`  - SwordGoblin percentage: ${swordGoblinPercentage}%`);
    console.log(
      swordGoblinPercentage >= 25 && swordGoblinPercentage <= 35
        ? "  ✓ Distribution looks correct (should be ~30%)"
        : "  ⚠ Distribution may be off (expected ~30%)"
    );
  }

  console.log("\n🎯 SwordGoblin implementation test completed successfully!");
} catch (error) {
  console.error("❌ SwordGoblin test failed:", error);
  console.error("Stack trace:", error.stack);
}
