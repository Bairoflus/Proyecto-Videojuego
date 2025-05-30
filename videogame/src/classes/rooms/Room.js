/**
 * Room class that represents a single game room
 * Handles room layout parsing, enemy generation, collision detection,
 * and manages all objects within the room (walls, enemies, coins, etc.)
 */
import { Vec } from "../../utils/Vec.js";
import { Rect } from "../../utils/Rect.js";
import { Player } from "../entities/Player.js";
import { Coin } from "../entities/Coin.js";
import { Chest } from "../entities/Chest.js";
import { Shop } from "../entities/Shop.js";
import { GoblinDagger } from "../enemies/floor1/GoblinDagger.js";
import { GoblinArcher } from "../enemies/floor1/GoblinArcher.js";
import { variables } from "../../config.js";
import { log } from "../../utils/Logger.js";
import { ROOM_CONSTANTS, PHYSICS_CONSTANTS } from "../../constants/gameConstants.js";

export class Room {
  constructor(layout, isCombatRoom = false, roomType = "combat") {
    this.layout = layout;
    this.isCombatRoom = isCombatRoom;
    this.roomType = roomType; // 'combat', 'shop', or 'boss'
    this.tileSize = ROOM_CONSTANTS.TILE_SIZE;
    this.transitionZone = ROOM_CONSTANTS.TRANSITION_ZONE_SIZE;
    this.minSafeDistance = ROOM_CONSTANTS.MIN_SAFE_DISTANCE;
    this.objects = {
      walls: [],
      enemies: [],
      coins: [],
      chest: null, // Gold chest that spawns after clearing enemies
      shop: null,
      boss: null,
    };
    this.chestSpawned = false; // Track if chest has been spawned
    this.chestCollected = false; // Track if chest has been collected
    this.shopActivationArea = null; // Shop activation area
    this.playerInShopArea = false; // Track if player is in shop activation area
    this.shopCanBeOpened = true; // Prevent reopening until player leaves area
    this.parseLayout();

    // Create shop instance for shop rooms
    if (this.roomType === "shop" && !this.objects.shop) {
      this.objects.shop = new Shop();

      // Set callback to handle ESC closing
      this.objects.shop.setOnCloseCallback(() => {
        this.shopCanBeOpened = false;
      });

      log.info("Shop instance created in constructor for shop room");
    }

    // Generate enemies procedurally if this is a combat room
    if (this.isCombatRoom) {
      this.generateEnemies();
    }
  }

  // Parses the ASCII layout and creates corresponding objects
  parseLayout() {
    const rows = this.layout.trim().split("\n");
    const height = rows.length;
    const width = rows[0].length;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const char = rows[y].charAt(x);
        const position = new Vec(x * this.tileSize, y * this.tileSize);

        switch (char) {
          case "W": // Wall
            this.objects.walls.push(
              new Rect(position.x, position.y, this.tileSize, this.tileSize)
            );
            break;
          case "C": // Coin
            const coin = new Coin(
              position,
              this.tileSize,
              this.tileSize,
              "yellow",
              8
            );
            coin.setSprite(
              "./assets/sprites/coin_gold.png",
              new Rect(0, 0, 32, 32)
            );
            coin.setAnimation(0, 7, true, variables.animationDelay);
            this.objects.coins.push(coin);
            break;
          case "S": // Shop
            // Shop rooms have a shop instance
            log.info(
              `Found 'S' marker at position (${x}, ${y}), roomType: ${this.roomType}`
            );
            if (this.roomType === "shop") {
              // Create shop activation area at the 'S' position
              this.shopActivationArea = new Rect(
                position.x - this.tileSize / 2,
                position.y - this.tileSize / 2,
                this.tileSize * 2,
                this.tileSize * 2
              );
              log.info("Shop activation area created");
            }
            break;
          case "B": // Boss
            // TODO: Implement boss creation
            break;
        }
      }
    }
  }

  // Draws all room objects
  draw(ctx) {
    // Draw background first
    if (variables.backgroundImage && variables.backgroundImage.complete) {
      ctx.drawImage(
        variables.backgroundImage,
        0,
        0,
        variables.canvasWidth,
        variables.canvasHeight
      );
    }

    // Draw walls
    ctx.fillStyle = "gray";
    this.objects.walls.forEach((wall) => {
      ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
    });

    // Draw coins
    this.objects.coins.forEach((coin) => coin.draw(ctx));

    // Draw chest if it exists
    if (this.objects.chest) {
      this.objects.chest.draw(ctx);
    }

    // Draw enemies
    this.objects.enemies.forEach((enemy) => enemy.draw(ctx));

    // Draw shop activation area if this is a shop room
    if (this.roomType === "shop" && this.shopActivationArea) {
      // Draw a glowing shop icon/area
      const centerX =
        this.shopActivationArea.x + this.shopActivationArea.width / 2;
      const centerY =
        this.shopActivationArea.y + this.shopActivationArea.height / 2;

      // Pulsing effect
      const pulse = Math.sin(Date.now() * 0.003) * 0.2 + 0.8;

      // Draw glow effect
      ctx.fillStyle = `rgba(100, 200, 255, ${0.3 * pulse})`;
      ctx.fillRect(
        this.shopActivationArea.x,
        this.shopActivationArea.y,
        this.shopActivationArea.width,
        this.shopActivationArea.height
      );

      // Draw border
      ctx.strokeStyle = `rgba(100, 200, 255, ${0.8 * pulse})`;
      ctx.lineWidth = 3;
      ctx.strokeRect(
        this.shopActivationArea.x,
        this.shopActivationArea.y,
        this.shopActivationArea.width,
        this.shopActivationArea.height
      );

      // Draw "SHOP" text
      ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
      ctx.font = "bold 20px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("SHOP", centerX, centerY);
    }

    // Shop UI is now drawn in Game.draw() after the player for proper layering

    // TODO: Draw boss
  }

  // Updates all room objects
  update(deltaTime) {
    this.objects.coins.forEach((coin) => coin.update(deltaTime));

    // Update chest if it exists
    if (this.objects.chest) {
      this.objects.chest.update(deltaTime);

      // Check for player collision with chest
      if (
        !this.objects.chest.isCollected &&
        window.game &&
        window.game.player
      ) {
        const player = window.game.player;
        if (this.checkChestCollision(player)) {
          this.objects.chest.collect(player);
          this.chestCollected = true;
        }
      }
    }

    // Update enemies
    this.objects.enemies.forEach((enemy) => {
      // Ensure enemy has room reference for collision detection
      if (!enemy.currentRoom) {
        enemy.setCurrentRoom(this);
      }

      if (enemy.state !== "dead") {
        // Set player as target for enemy AI
        if (window.game && window.game.player) {
          enemy.target = window.game.player;
          // Get player hitbox center position
          const playerHitbox = window.game.player.getHitboxBounds();
          const playerCenter = new Vec(
            playerHitbox.x + playerHitbox.width / 2,
            playerHitbox.y + playerHitbox.height / 2
          );
          enemy.moveTo(playerCenter);

          // For ranged enemies, also call their attack method
          if (enemy.type === "goblin_archer") {
            enemy.attack(window.game.player);
          }
        }

        // Update enemy with player reference for projectile handling
        enemy.update(deltaTime, window.game.player);
      } else {
        // Even dead enemies need to update their projectiles
        enemy.update(deltaTime, window.game.player);
      }
    });

    // Remove dead enemies from the array
    const previousEnemyCount = this.objects.enemies.length;
    this.objects.enemies = this.objects.enemies.filter(
      (enemy) => enemy.state !== "dead"
    );
    const currentEnemyCount = this.objects.enemies.length;

    // Check if all enemies were just defeated in a combat room
    if (
      this.isCombatRoom &&
      !this.chestSpawned &&
      previousEnemyCount > 0 &&
      currentEnemyCount === 0
    ) {
      this.spawnChest();
    }

    // Update shop interaction
    if (
      this.roomType === "shop" &&
      this.objects.shop &&
      this.shopActivationArea &&
      window.game &&
      window.game.player
    ) {
      const player = window.game.player;
      const playerHitbox = player.getHitboxBounds();

      // Check if player is in shop activation area
      const isInArea = this.checkShopActivation(playerHitbox);

      // Handle shop state changes
      if (!this.playerInShopArea && isInArea) {
        // Player just entered the area
        this.playerInShopArea = true;
        if (this.shopCanBeOpened && !this.objects.shop.isOpen) {
          this.objects.shop.open();
        }
      } else if (this.playerInShopArea && !isInArea) {
        // Player just left the area
        this.playerInShopArea = false;
        this.shopCanBeOpened = true; // Reset flag when leaving area

        // Close shop if it's open and player left the area
        if (this.objects.shop.isOpen) {
          this.objects.shop.close();
        }
      }

      // If shop is closed while player is in area, prevent reopening until they leave
      if (this.playerInShopArea && !this.objects.shop.isOpen) {
        this.shopCanBeOpened = false;
      }
    }

    // TODO: Update boss
  }

  // Checks for wall collisions using hitboxes
  checkWallCollision(obj) {
    const objHitbox = obj.getHitboxBounds();
    return this.objects.walls.some((wall) => this.checkRectangleCollision(objHitbox, wall));
  }

  // Helper method for rectangle collision detection
  checkRectangleCollision(rect1, rect2) {
    return (
      rect1.x + rect1.width > rect2.x &&
      rect1.x < rect2.x + rect2.width &&
      rect1.y + rect1.height > rect2.y &&
      rect1.y < rect2.y + rect2.height
    );
  }

  // Checks if player is near the central right edge
  isPlayerAtRightEdge(player) {
    const playerHitbox = player.getHitboxBounds();
    const rightEdge = variables.canvasWidth - playerHitbox.width;

    // First check if player is in transition zone
    if (playerHitbox.x < rightEdge - this.transitionZone) {
      return false;
    }

    // Only if in transition zone, do full check
    const middleY = variables.canvasHeight / 2;
    const isAtRightEdge = playerHitbox.x >= rightEdge - this.transitionZone;
    const isAtMiddleY =
      Math.abs(playerHitbox.y + playerHitbox.height / 2 - middleY) <
      playerHitbox.height;

    return isAtRightEdge && isAtMiddleY;
  }

  // Checks if player is near the central left edge
  isPlayerAtLeftEdge(player) {
    const playerHitbox = player.getHitboxBounds();

    // First check if player is in transition zone
    if (playerHitbox.x > this.transitionZone) {
      return false;
    }

    // Only if in transition zone, do full check
    const middleY = variables.canvasHeight / 2;
    const isAtLeftEdge = playerHitbox.x <= this.transitionZone;
    const isAtMiddleY =
      Math.abs(playerHitbox.y + playerHitbox.height / 2 - middleY) <
      playerHitbox.height;

    return isAtLeftEdge && isAtMiddleY;
  }

  // Gets player's initial position (left edge)
  getPlayerStartPosition() {
    // Since hitbox is 60% of sprite size, we adjust the position to center it
    const playerWidth = 64; // Full sprite width
    const hitboxWidth = Math.floor(playerWidth * 0.6);
    const hitboxOffset = Math.floor((playerWidth - hitboxWidth) / 2);

    return new Vec(
      this.transitionZone + this.minSafeDistance - hitboxOffset,
      variables.canvasHeight / 2 - 32
    );
  }

  // Gets player's position for right edge
  getPlayerRightEdgePosition() {
    // Since hitbox is 60% of sprite size, we adjust the position to center it
    const playerWidth = 64; // Full sprite width
    const hitboxWidth = Math.floor(playerWidth * 0.6);
    const hitboxOffset = Math.floor((playerWidth - hitboxWidth) / 2);

    return new Vec(
      variables.canvasWidth -
        this.transitionZone -
        this.minSafeDistance -
        playerWidth +
        hitboxOffset,
      variables.canvasHeight / 2 - 32
    );
  }

  // Generates procedural enemies for combat rooms
  generateEnemies() {
    log.info("Starting procedural enemy generation for combat room...");

    // Generate enemies randomly within defined range
    const enemyCount = Math.floor(Math.random() * (ROOM_CONSTANTS.MAX_ENEMIES - ROOM_CONSTANTS.MIN_ENEMIES + 1)) + ROOM_CONSTANTS.MIN_ENEMIES;

    // Random proportion using constants
    const commonPercentage = Math.random() * (ROOM_CONSTANTS.COMMON_ENEMY_RATIO.max - ROOM_CONSTANTS.COMMON_ENEMY_RATIO.min) + ROOM_CONSTANTS.COMMON_ENEMY_RATIO.min;
    const commonCount = Math.floor(enemyCount * commonPercentage);
    const rareCount = enemyCount - commonCount;

    log.debug(
      `Enemy distribution: ${enemyCount} total | ${commonCount} GoblinDagger (${Math.round(
        commonPercentage * 100
      )}%) | ${rareCount} GoblinArcher (${Math.round(
        (1 - commonPercentage) * 100
      )}%)`
    );

    // Safe zone definition using constants
    const safeZone = {
      x: 0,
      y: variables.canvasHeight / 2 - ROOM_CONSTANTS.SAFE_ZONE_SIZE.height / 2,
      width: ROOM_CONSTANTS.SAFE_ZONE_SIZE.width,
      height: ROOM_CONSTANTS.SAFE_ZONE_SIZE.height,
    };

    log.verbose(
      `Safe zone: x=${safeZone.x}, y=${safeZone.y}, w=${safeZone.width}, h=${safeZone.height}`
    );

    let successfulPlacements = 0;

    // Generate common enemies (left half, excluding safe zone)
    log.debug("Generating GoblinDagger enemies (left half)...");
    for (let i = 0; i < commonCount; i++) {
      const position = this.getValidEnemyPosition(true, safeZone);
      if (position) {
        const enemy = new GoblinDagger(position);
        enemy.setCurrentRoom(this); // Set room reference for collision detection
        this.objects.enemies.push(enemy);
        successfulPlacements++;
        log.verbose(
          `  GoblinDagger ${i + 1} placed at (${Math.round(
            position.x
          )}, ${Math.round(position.y)})`
        );
      } else {
        log.warn(`  Failed to place GoblinDagger ${i + 1}`);
      }
    }

    // Generate rare enemies (right half)
    log.debug("Generating GoblinArcher enemies (right half)...");
    for (let i = 0; i < rareCount; i++) {
      const position = this.getValidEnemyPosition(false, safeZone);
      if (position) {
        const enemy = new GoblinArcher(position);
        enemy.setCurrentRoom(this); // Set room reference for collision detection
        this.objects.enemies.push(enemy);
        successfulPlacements++;
        log.verbose(
          `  GoblinArcher ${i + 1} placed at (${Math.round(
            position.x
          )}, ${Math.round(position.y)})`
        );
      } else {
        log.warn(`  Failed to place GoblinArcher ${i + 1}`);
      }
    }

    log.info(
      `Enemy generation complete: ${successfulPlacements}/${enemyCount} enemies successfully placed`
    );

    // Validate that all enemies are correct instances
    const goblinDaggerCount = this.objects.enemies.filter(
      (e) => e.type === "goblin_dagger"
    ).length;
    const goblinArcherCount = this.objects.enemies.filter(
      (e) => e.type === "goblin_archer"
    ).length;

    log.debug(
      `Validation: ${goblinDaggerCount} GoblinDagger, ${goblinArcherCount} GoblinArcher instances created`
    );
  }

  // Improved method to get valid enemy position with better organization
  getValidEnemyPosition(isCommon, safeZone) {
    let attempts = 0;

    while (attempts < ROOM_CONSTANTS.MAX_PLACEMENT_ATTEMPTS) {
      const position = this.generateRandomPosition(isCommon, safeZone);
      
      if (position && this.isValidEnemyPosition(position)) {
        return position;
      }
      
      attempts++;
    }

    log.warn("Could not find valid position for enemy after", ROOM_CONSTANTS.MAX_PLACEMENT_ATTEMPTS, "attempts");
    return null;
  }

  // Helper method to generate random position based on enemy type
  generateRandomPosition(isCommon, safeZone) {
    let x, y;

    if (isCommon) {
      // Common enemies: left half (excluding safe zone)
      x = Math.random() * (variables.canvasWidth / 2 - ROOM_CONSTANTS.TILE_SIZE);
      y = Math.random() * (variables.canvasHeight - ROOM_CONSTANTS.TILE_SIZE);

      // Check if position overlaps with safe zone
      if (this.overlapsWithSafeZone(x, y, safeZone)) {
        return null; // Invalid position
      }
    } else {
      // Rare enemies: right half
      x = Math.random() * (variables.canvasWidth / 2 - ROOM_CONSTANTS.TILE_SIZE) + variables.canvasWidth / 2;
      y = Math.random() * (variables.canvasHeight - ROOM_CONSTANTS.TILE_SIZE);
    }

    return new Vec(x, y);
  }

  // Helper method to check safe zone overlap
  overlapsWithSafeZone(x, y, safeZone) {
    return (
      x < safeZone.x + safeZone.width &&
      x + ROOM_CONSTANTS.TILE_SIZE > safeZone.x &&
      y < safeZone.y + safeZone.height &&
      y + ROOM_CONSTANTS.TILE_SIZE > safeZone.y
    );
  }

  // Helper method to validate enemy position
  isValidEnemyPosition(position) {
    // Create a temporary enemy to test collision
    const tempEnemy = new GoblinDagger(position);
    return !this.checkWallCollision(tempEnemy);
  }

  // Checks if the room can transition (no enemies alive)
  canTransition() {
    if (!this.isCombatRoom) {
      log.debug("Transition allowed: Non-combat room");
      return true; // Non-combat rooms can always transition
    }

    // Combat rooms require all enemies to be defeated
    const totalEnemies = this.objects.enemies.length;
    const aliveEnemies = this.objects.enemies.filter(
      (enemy) => enemy.state !== "dead"
    );
    const deadEnemies = totalEnemies - aliveEnemies.length;

    const canTransition = aliveEnemies.length === 0;

    if (canTransition) {
      log.info(
        `Transition allowed: All enemies defeated! (${deadEnemies}/${totalEnemies} dead)`
      );
    } else {
      const aliveGoblins = aliveEnemies.map((e) => e.type).join(", ");
      log.debug(
        `Transition blocked: ${aliveEnemies.length}/${totalEnemies} enemies still alive (${aliveGoblins})`
      );
    }

    return canTransition;
  }

  /**
   * Spawns a gold chest in the room after all enemies are defeated
   */
  spawnChest() {
    if (this.chestSpawned || !this.isCombatRoom) return;

    // Calculate safe spawn position near transition zone using constants
    const x = variables.canvasWidth - this.transitionZone - ROOM_CONSTANTS.CHEST_SIZE - ROOM_CONSTANTS.CHEST_SAFE_MARGIN;
    const y = variables.canvasHeight / 2 - ROOM_CONSTANTS.CHEST_SIZE / 2;

    // Create chest at calculated position
    const chestPosition = new Vec(x, y);

    // Try primary position first
    if (this.trySpawnChestAtPosition(chestPosition)) {
      return;
    }

    // Try alternate position if wall collision
    chestPosition.y = variables.canvasHeight / 2 - ROOM_CONSTANTS.CHEST_SIZE - ROOM_CONSTANTS.CHEST_SIZE;
    this.trySpawnChestAtPosition(chestPosition);
  }

  // Helper method to attempt chest spawn at a position
  trySpawnChestAtPosition(position) {
    const testChest = new Chest(position);
    if (!this.checkWallCollision(testChest)) {
      this.objects.chest = testChest;
      this.chestSpawned = true;
      log.info("Gold chest spawned in combat room");
      return true;
    }
    return false;
  }

  /**
   * Checks if player is colliding with the chest
   * @param {Player} player - The player to check collision with
   * @returns {boolean} True if player is touching the chest
   */
  checkChestCollision(player) {
    if (!this.objects.chest || this.objects.chest.isCollected) return false;

    const playerHitbox = player.getHitboxBounds();
    const chestHitbox = this.objects.chest.getHitboxBounds();

    return this.checkRectangleCollision(playerHitbox, chestHitbox);
  }

  /**
   * Gets the room state for persistence
   * @returns {Object} Room state data
   */
  getRoomState() {
    return {
      chestSpawned: this.chestSpawned,
      chestCollected: this.chestCollected,
      enemies: this.objects.enemies.map((enemy) => ({
        type: enemy.type,
        position: { x: enemy.position.x, y: enemy.position.y },
        health: enemy.health,
        state: enemy.state,
      })),
    };
  }

  /**
   * Restores room state from saved data
   * @param {Object} state - Saved room state
   */
  restoreRoomState(state) {
    if (!state) return;

    this.chestSpawned = state.chestSpawned || false;
    this.chestCollected = state.chestCollected || false;

    // Spawn chest if it was spawned but not collected
    if (this.chestSpawned && !this.chestCollected && this.isCombatRoom) {
      this.spawnChest();
      if (this.objects.chest && state.chestCollected) {
        this.objects.chest.isCollected = true;
        this.objects.chest.isOpen = true;
      }
    }
  }

  /**
   * Checks if player is in shop activation area
   * @param {Object} playerHitbox - Player's hitbox bounds
   * @returns {boolean} True if player is in activation area
   */
  checkShopActivation(playerHitbox) {
    if (!this.shopActivationArea) return false;

    return this.checkRectangleCollision(playerHitbox, this.shopActivationArea);
  }
}
