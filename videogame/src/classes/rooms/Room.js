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
import { SwordGoblin } from "../enemies/floor1/SwordGoblin.js";
import { MageGoblin } from "../enemies/floor1/MageGoblin.js";
import { GreatBowGoblin } from "../enemies/floor1/GreatBowGoblin.js";
import { variables } from "../../config.js";
import { log } from "../../utils/Logger.js";
import { ROOM_CONSTANTS } from "../../constants/gameConstants.js";
import { backgroundManager } from "../../utils/BackgroundManager.js";

export class Room {
  constructor(layout, isCombatRoom = false, roomType = "combat", floor = 1, roomIndex = 0) {
    this.layout = layout;
    this.isCombatRoom = isCombatRoom;
    this.roomType = roomType; // 'combat', 'shop', or 'boss'
    this.floor = floor; // Current floor (1-3)
    this.roomIndex = roomIndex; // Room index within floor (0-5)
    this.tileSize = ROOM_CONSTANTS.TILE_SIZE;
    this.transitionZone = ROOM_CONSTANTS.TRANSITION_ZONE_SIZE;
    this.minSafeDistance = ROOM_CONSTANTS.MIN_SAFE_DISTANCE;
    
    // Dynamic background support
    this.backgroundImage = null;
    this.backgroundPath = null;
    this.backgroundLoaded = false;
    
    this.objects = {
      walls: [],
      enemies: [],
      coins: [],
      chest: null,
      shop: null,
      boss: null,
    };
    this.chestSpawned = false;
    this.chestCollected = false;
    this.shopActivationArea = null;
    this.playerInShopArea = false;
    this.shopCanBeOpened = true;

    this.parseLayout();

    // Initialize background for this room
    this.initializeBackground();

    // Create shop instance for shop rooms
    if (this.roomType === "shop" && !this.objects.shop) {
      this.objects.shop = new Shop();
      this.objects.shop.setOnCloseCallback(() => {
        this.shopCanBeOpened = false;
      });
      log.info("Shop instance created in constructor for shop room");
    }
  }

  /**
   * Initialize background for this specific room
   */
  async initializeBackground() {
    try {
      // Get background path based on room properties
      this.backgroundPath = backgroundManager.getBackgroundPath(
        this.floor, 
        this.roomType, 
        this.roomIndex
      );
      
      log.info(`Initializing background for ${this.roomType} room: ${this.backgroundPath}`);
      
      // Load background image
      this.backgroundImage = await backgroundManager.loadBackground(this.backgroundPath);
      this.backgroundLoaded = true;
      
      log.verbose(`Background loaded successfully for floor ${this.floor}, room ${this.roomIndex + 1}`);
      
    } catch (error) {
      log.error('Failed to load room background:', error);
      
      // Fallback to global background
      this.backgroundImage = variables.backgroundImage;
      this.backgroundPath = '/assets/backgrounds/backgroundfloor1.jpg';
      this.backgroundLoaded = variables.backgroundImage && variables.backgroundImage.complete;
      
      log.warn('Using fallback background due to loading error');
    }
  }

  addEntity(entity) {
    if (typeof entity.setCurrentRoom === 'function') {
      entity.setCurrentRoom(this);
    }
    this.objects.enemies.push(entity);
  }

  // NEW METHOD: Initialize enemies for NEW combat rooms only
  initializeEnemies() {
    console.log(`ROOM.initializeEnemies() called:`, {
      isCombatRoom: this.isCombatRoom,
      currentEnemyCount: this.objects.enemies.length,
      roomType: this.roomType
    });

    if (this.isCombatRoom && this.objects.enemies.length === 0) {
      console.log('Generating NEW enemies for fresh combat room...');
      this.generateEnemies();
      console.log(`Enemy generation complete: ${this.objects.enemies.length} enemies created`);
    } else if (this.isCombatRoom) {
      console.log(`Skipping enemy generation: ${this.objects.enemies.length} enemies already exist (SAVED STATE)`);
    } else {
      console.log(`Non-combat room (${this.roomType}): No enemy generation needed`);
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
              "/assets/sprites/hud/gold_coin.png",
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

  // NEW: Helper method to clean undefined/null enemies from array
  cleanEnemiesArray() {
    const originalLength = this.objects.enemies.length;
    this.objects.enemies = this.objects.enemies.filter(enemy => enemy !== undefined && enemy !== null);
    const cleanedLength = this.objects.enemies.length;
    
    if (originalLength !== cleanedLength) {
      console.warn(`ENEMIES ARRAY CLEANED: Removed ${originalLength - cleanedLength} undefined/null entries`);
    }
  }

  // Draws all room objects
  draw(ctx) {
    // CRITICAL: Clean enemies array before drawing
    this.cleanEnemiesArray();
    
    // Draw background first - Use room-specific background
    if (this.backgroundImage && this.backgroundLoaded) {
      ctx.drawImage(
        this.backgroundImage,
        0,
        0,
        variables.canvasWidth,
        variables.canvasHeight
      );
    } else if (variables.backgroundImage && variables.backgroundImage.complete) {
      // Fallback to global background if room background not loaded
      ctx.drawImage(
        variables.backgroundImage,
        0,
        0,
        variables.canvasWidth,
        variables.canvasHeight
      );
    }

    // Draw walls
    ctx.fillStyle = "#666666";
    this.objects.walls.forEach((wall) => {
      ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
    });

    // Draw coins
    this.objects.coins.forEach((coin) => coin.draw(ctx));

    // Draw chest if it exists
    if (this.objects.chest) {
      this.objects.chest.draw(ctx);
    }

    // Draw enemies (now with additional safety)
    this.objects.enemies.filter(enemy => enemy !== undefined && enemy !== null).forEach((enemy) => enemy.draw(ctx));

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
    // CRITICAL: Clean enemies array before updating
    this.cleanEnemiesArray();
    
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
    this.objects.enemies.filter(enemy => enemy !== undefined && enemy !== null).forEach((enemy) => {
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

          // V2 RANGED ENEMIES ATTACK LOGIC
          if (enemy.type === "goblin_archer" || 
              enemy.type === "mage_goblin" || 
              enemy.type === "great_bow_goblin") {
            enemy.attack(window.game.player);
          }

          // V2 MELEE ENEMIES ATTACK LOGIC
          if (enemy.type === "goblin_dagger" || 
              enemy.type === "sword_goblin") {
            enemy.attack(window.game.player);
          }
        }

        // Update enemy with player reference for projectile handling
        enemy.update(deltaTime, window.game.player, this);
      } else {
        // Even dead enemies need to update their projectiles
        enemy.update(deltaTime, window.game.player, this);
      }
    });

    // Remove dead enemies from the array (also filter out undefined/null)
    const previousEnemyCount = this.objects.enemies.filter(enemy => enemy !== undefined && enemy !== null).length;

    // ENHANCED: Better logging for enemy removal
    const deadEnemies = this.objects.enemies.filter((enemy) => enemy && enemy.state === "dead");
    const aliveEnemiesBefore = this.objects.enemies.filter((enemy) => enemy && enemy.state !== "dead");

    // CRITICAL: Filter out both dead enemies AND undefined/null entries
    this.objects.enemies = this.objects.enemies.filter(
      (enemy) => enemy !== undefined && enemy !== null && enemy.state !== "dead"
    );
    const currentEnemyCount = this.objects.enemies.length;

    // ENHANCED: Diagnostic logging for enemy state changes
    if (deadEnemies.length > 0) {
      console.log(`Removing ${deadEnemies.length} dead enemies from room`);
      console.log(`  Dead enemies:`, deadEnemies.map(e => ({
        type: e.type,
        position: `(${Math.round(e.position.x)}, ${Math.round(e.position.y)})`
      })));
      console.log(`  Enemy count: ${previousEnemyCount} → ${currentEnemyCount}`);
    }

    // Check if all enemies were just defeated in a combat room
    if (
      this.isCombatRoom &&
      !this.chestSpawned &&
      previousEnemyCount > 0 &&
      currentEnemyCount === 0
    ) {
      console.log("ALL ENEMIES DEFEATED - Spawning chest");
      this.spawnChest();

      // FORCE IMMEDIATE CLEANUP - Ensure no dead enemies remain
      this.objects.enemies = this.objects.enemies.filter(
        (enemy) => enemy !== undefined && enemy !== null && enemy.state !== "dead"
      );

      // IMMEDIATE DIAGNOSTIC: Check transition state right after enemy cleanup
      console.log("IMMEDIATE TRANSITION CHECK AFTER ENEMY CLEANUP:");
      console.log(`  - Room type: ${this.roomType}, Combat room: ${this.isCombatRoom}`);
      console.log(`  - Enemies remaining: ${this.objects.enemies.length}`);
      console.log(`  - Alive enemies: ${this.objects.enemies.filter(e => e.state !== 'dead').length}`);
      console.log(`  - Dead enemies removed: ${deadEnemies.length}`);
      console.log(`  - Can transition: ${this.canTransition()}`);

      // FORCE VERIFICATION: Double-check all enemies are actually dead
      const stillAlive = this.objects.enemies.filter(e => e.state !== 'dead');
      if (stillAlive.length > 0) {
        console.error("ERROR: Enemies marked as alive after cleanup!");
        stillAlive.forEach(enemy => {
          console.error(`  - ALIVE: ${enemy.type} at (${Math.round(enemy.position.x)}, ${Math.round(enemy.position.y)}) - Health: ${enemy.health}, State: ${enemy.state}`);
        });
      } else {
        console.log("VERIFICATION PASSED - All enemies confirmed dead/removed");

        // FORCE NOTIFICATION to Game.js that room is now clear
        if (window.game) {
          console.log("NOTIFYING GAME: Combat room is now clear for transition");
          window.game.roomJustCleared = true; // Set flag for immediate feedback

          // If player is already at right edge, trigger transition check immediately
          if (window.game.player && this.isPlayerAtRightEdge(window.game.player)) {
            console.log("PLAYER AT RIGHT EDGE - Transition should be possible now!");
          }
        }
      }
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
          // NEW: Prepare shop data for opening
          const shopData = {
            userId: parseInt(localStorage.getItem('currentUserId')),
            runId: parseInt(localStorage.getItem('currentRunId')),
            roomId: window.game?.floorGenerator?.getCurrentRoomId() || 1
          };

          // Open shop with proper data
          this.objects.shop.open(shopData, () => {
            this.shopCanBeOpened = false;
          });
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
    log.info("Starting procedural enemy generation for combat room V2...");

    // Generate enemies randomly within defined range
    const enemyCount = Math.floor(Math.random() * (ROOM_CONSTANTS.MAX_ENEMIES - ROOM_CONSTANTS.MIN_ENEMIES + 1)) + ROOM_CONSTANTS.MIN_ENEMIES;

    // V2 ENEMY DISTRIBUTION WITH WEIGHTED SELECTION
    const enemyTypes = [
      { class: GoblinDagger, weight: 30, type: 'melee', name: 'GoblinDagger' },      // common
      { class: SwordGoblin, weight: 25, type: 'melee', name: 'SwordGoblin' },       // common  
      { class: GoblinArcher, weight: 20, type: 'ranged', name: 'GoblinArcher' },    // rare
      { class: MageGoblin, weight: 15, type: 'ranged', name: 'MageGoblin' },        // rare
      { class: GreatBowGoblin, weight: 10, type: 'ranged', name: 'GreatBowGoblin' } // rare
    ];

    log.debug(
      `Enemy V2 distribution for ${enemyCount} enemies:`,
      enemyTypes.map(e => `${e.name}(${e.weight}%)`).join(', ')
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
    let enemyTypeCount = {};

    // Generate all enemies using weighted selection
    for (let i = 0; i < enemyCount; i++) {
      const selectedType = this.weightedRandomSelect(enemyTypes);
      const position = this.getValidEnemyPositionV2(selectedType.type === 'melee', safeZone);
      
      if (position) {
        const enemy = new selectedType.class(position);
        enemy.setCurrentRoom(this); // Set room reference for collision detection
        this.objects.enemies.push(enemy);
        successfulPlacements++;
        
        // Track enemy type counts
        enemyTypeCount[selectedType.name] = (enemyTypeCount[selectedType.name] || 0) + 1;
        
        log.verbose(
          `  ${selectedType.name} ${i + 1} placed at (${Math.round(
            position.x
          )}, ${Math.round(position.y)})`
        );
      } else {
        log.warn(`  Failed to place ${selectedType.name} ${i + 1}`);
      }
    }

    log.info(
      `Enemy generation V2 complete: ${successfulPlacements}/${enemyCount} enemies successfully placed`
    );

    // Log final distribution
    Object.entries(enemyTypeCount).forEach(([type, count]) => {
      log.debug(`  ${type}: ${count} spawned`);
    });

    // Validate that all enemies are correct instances
    const totalValidEnemies = this.objects.enemies.filter(e => e && e.type).length;
    log.debug(`Validation: ${totalValidEnemies} valid enemy instances created`);
  }

  // V2 WEIGHTED RANDOM SELECTION
  weightedRandomSelect(types) {
    const totalWeight = types.reduce((sum, type) => sum + type.weight, 0);
    const random = Math.random() * totalWeight;
    
    let currentWeight = 0;
    for (const type of types) {
      currentWeight += type.weight;
      if (random <= currentWeight) {
        return type;
      }
    }
    return types[0]; // Fallback
  }

  // V2 IMPROVED POSITION GENERATION
  getValidEnemyPositionV2(isMelee, safeZone) {
    let attempts = 0;

    while (attempts < ROOM_CONSTANTS.MAX_PLACEMENT_ATTEMPTS) {
      const position = this.generateRandomPositionV2(isMelee, safeZone);

      if (position && this.isValidEnemyPositionV2(position)) {
        return position;
      }

      attempts++;
    }

    log.warn("Could not find valid position for V2 enemy after", ROOM_CONSTANTS.MAX_PLACEMENT_ATTEMPTS, "attempts");
    return null;
  }

  // V2 POSITION GENERATION WITH BETTER LOGIC
  generateRandomPositionV2(isMelee, safeZone) {
    let x, y;

    if (isMelee) {
      // Melee enemies: prefer left side but can spawn anywhere except safe zone
      x = Math.random() * (variables.canvasWidth * 0.7 - ROOM_CONSTANTS.TILE_SIZE);
      y = Math.random() * (variables.canvasHeight - ROOM_CONSTANTS.TILE_SIZE);

      // Check if position overlaps with safe zone
      if (this.overlapsWithSafeZone(x, y, safeZone)) {
        return null; // Invalid position
      }
    } else {
      // Ranged enemies: prefer right side for better positioning
      x = Math.random() * (variables.canvasWidth * 0.6 - ROOM_CONSTANTS.TILE_SIZE) + variables.canvasWidth * 0.4;
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

  // V2 VALIDATION WITH BETTER ENEMY DETECTION
  isValidEnemyPositionV2(position) {
    // Create a temporary enemy to test collision (use base enemy for testing)
    const tempEnemy = {
      position: position,
      width: 32,
      height: 32,
      getHitboxBounds: () => ({
        x: position.x,
        y: position.y,
        width: 32,
        height: 32
      })
    };
    return !this.checkWallCollision(tempEnemy);
  }

  // FIXED: Checks if the room allows transition with proper boss room handling
  canTransition() {
    // Clean enemies array first
    this.cleanEnemiesArray();
    
    // Non-combat rooms always allow transition
    if (!this.isCombatRoom) {
      return true;
    }
    
    // CHECK 1: CHEST REQUIREMENT (applies to all combat rooms)
    if (this.chestSpawned && !this.chestCollected) {
      // FIXED: Throttle chest collection message to prevent spam
      if (!this.lastChestCollectionLog || Date.now() - this.lastChestCollectionLog > 3000) {
        console.log('TRANSITION BLOCKED: Chest not collected yet');
        this.lastChestCollectionLog = Date.now();
      }
      return false;
    }
    
    // CRITICAL FIX: Boss room special handling with enhanced validation
    if (this.roomType === 'boss') {
      // For boss rooms, we need additional verification
      const allEnemies = this.objects.enemies;
      const aliveEnemies = allEnemies.filter(
        e => e !== undefined && e !== null && e.state !== 'dead'
      );
      
      // ENHANCED: Multiple ways to detect bosses for maximum coverage
      const bosses = allEnemies.filter(e => 
        e !== undefined && e !== null && (
          e.constructor.name.includes('Boss') || 
          e.type === 'boss' || 
          e.isBoss === true ||
          e.constructor.name === 'DragonBoss' ||
          e.constructor.name === 'Supersoldier'
        )
      );
      
      const aliveBosses = aliveEnemies.filter(e => 
        e !== undefined && e !== null && (
          e.constructor.name.includes('Boss') || 
          e.type === 'boss' || 
          e.isBoss === true ||
          e.constructor.name === 'DragonBoss' ||
          e.constructor.name === 'Supersoldier'
        )
      );
      
      // ULTRA-STRICT: Also check bosses with health > 0 regardless of state
      const bossesWithHealth = allEnemies.filter(e => 
        e !== undefined && e !== null && e.health > 0 && (
          e.constructor.name.includes('Boss') || 
          e.type === 'boss' || 
          e.isBoss === true ||
          e.constructor.name === 'DragonBoss' ||
          e.constructor.name === 'Supersoldier'
        )
      );
      
      // SUPERSOLDIER-SPECIFIC CHECK
      const supersoldiers = allEnemies.filter(e => e.constructor.name === 'Supersoldier');
      const aliveSupersoldiers = supersoldiers.filter(e => e.state !== 'dead' && e.health > 0);
      
      // ENHANCED: Additional debugging for boss detection
      const bossDefeated = window.game && window.game.bossJustDefeated;
      
      // FIXED: Heavily throttled logging - only log detailed state every 10 seconds to prevent spam
      if (!this.lastDetailedBossLog || Date.now() - this.lastDetailedBossLog > 10000) {
        console.log('BOSS ROOM TRANSITION ATTEMPT:', {
          allEnemies: allEnemies.length,
          aliveEnemies: aliveEnemies.length,
          totalBosses: bosses.length,
          aliveBosses: aliveBosses.length,
          bossesWithHealth: bossesWithHealth.length,
          supersoldiers: supersoldiers.length,
          aliveSupersoldiers: aliveSupersoldiers.length,
          bossDefeated: bossDefeated,
          roomBossDefeated: this.bossDefeated,
          chestSpawned: this.chestSpawned,
          chestCollected: this.chestCollected
        });
        this.lastDetailedBossLog = Date.now();
      }
      
      // ULTRA-STRICT BOSS ROOM LOGIC: ALL must be true for transition
      const noAliveEnemies = aliveEnemies.length === 0;
      const noAliveBosses = aliveBosses.length === 0;
      const noBossesWithHealth = bossesWithHealth.length === 0;
      const noAliveSupersoldiers = aliveSupersoldiers.length === 0;
      const bossConfirmedDefeated = bossDefeated || this.bossDefeated;
      const chestRequirementMet = !this.chestSpawned || this.chestCollected; // NEW: Chest check
      
      // FIXED: Super-throttled validation logging - only log validation details every 10 seconds
      if (!this.lastValidationLog || Date.now() - this.lastValidationLog > 10000) {
        console.log('BOSS ROOM VALIDATION CHECKS:', {
          noAliveEnemies: noAliveEnemies,
          noAliveBosses: noAliveBosses, 
          noBossesWithHealth: noBossesWithHealth,
          noAliveSupersoldiers: noAliveSupersoldiers,
          bossConfirmedDefeated: bossConfirmedDefeated,
          chestRequirementMet: chestRequirementMet
        });
        this.lastValidationLog = Date.now();
      }
      
      // CRITICAL: All conditions must be met for boss room transition
      const canTransition = noAliveEnemies && noAliveBosses && noBossesWithHealth && noAliveSupersoldiers && bossConfirmedDefeated && chestRequirementMet;
      
      // FIXED: Super-throttled result logging - only log result changes or every 15 seconds
      if (canTransition !== this.lastCanTransition || !this.lastResultLog || Date.now() - this.lastResultLog > 15000) {
        this.lastCanTransition = canTransition;
        this.lastResultLog = Date.now();
        
        if (canTransition) {
          console.log(`BOSS ROOM TRANSITION ALLOWED - All checks passed`);
        } else {
          console.log(`BOSS ROOM TRANSITION BLOCKED:`);
          if (!noAliveEnemies) console.log(`  BLOCKING: ${aliveEnemies.length} enemies still alive`);
          if (!noAliveBosses) console.log(`  BLOCKING: ${aliveBosses.length} bosses still alive`);
          if (!noBossesWithHealth) console.log(`  BLOCKING: ${bossesWithHealth.length} bosses still have health > 0`);
          if (!noAliveSupersoldiers) console.log(`  BLOCKING: ${aliveSupersoldiers.length} Supersoldiers still alive`);
          if (!bossConfirmedDefeated) console.log(`  BLOCKING: Boss defeat not confirmed`);
          if (!chestRequirementMet) console.log(`  BLOCKING: Chest spawned but not collected yet`);
        }
      }
      
      return canTransition;
    }
    
    // Regular combat rooms: check if all enemies are dead AND chest collected (if spawned)
    const aliveEnemies = this.objects.enemies.filter(
      e => e !== undefined && e !== null && e.state !== 'dead'
    );
    
    const enemiesCleared = aliveEnemies.length === 0;
    const chestRequirementMet = !this.chestSpawned || this.chestCollected;
    const canTransition = enemiesCleared && chestRequirementMet;
    
    // FIXED: Only log when transition state changes to avoid spam - but throttle heavily
    if (canTransition !== this.lastCanTransition) {
      // Additional throttling even for state changes
      if (!this.lastStateChangeLog || Date.now() - this.lastStateChangeLog > 2000) {
        this.lastCanTransition = canTransition;
        this.lastStateChangeLog = Date.now();
        
        if (canTransition) {
          console.log(`Combat room cleared: All enemies defeated and chest collected! Can transition now.`);
        } else {
          console.log(`Combat room transition blocked:`);
          if (!enemiesCleared) console.log(`  ${aliveEnemies.length} enemies still alive`);
          if (!chestRequirementMet) console.log(`  Chest spawned but not collected yet`);
        }
      }
    }
    
    return canTransition;
  }

  // NEW: Reset boss room state when entering a new boss room
  resetBossState() {
    if (this.roomType === 'boss') {
      console.log(`Boss room state reset - ready for new encounter`);
    }
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