// filepath: /Users/fest/repos/Proyecto-Videojuego/videogame/src/classes/game/Game.js
import { Vec } from "../../utils/Vec.js";
import { Rect } from "../../utils/Rect.js";
import { Player } from "../entities/Player.js";
import { variables, keyDirections } from "../../config.js";
import { FloorGenerator } from "./FloorGenerator.js";
import { Shop } from "../entities/Shop.js";
import { Boss } from "../entities/Boss.js";

export class Game {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.player = null;
    this.floorGenerator = null;
    this.currentRoom = null;
    this.gameState = "loading"; // loading, playing, paused, gameover
    this.debug = false;
    this.lastTime = 0;
    
    // Run statistics tracking
    this.runStats = {
      goldSpent: 0,
      totalKills: 0
    };

    this.globalShop = new Shop();
    this.createEventListeners();
    this.floorGenerator = new FloorGenerator();
    this.enemies = [];
    this.initObjects();

    window.game = this;

    if (variables.debug) {
      this.initializeDebugCommands();
    }
  }

  initObjects() {
    this.currentRoom = this.floorGenerator.getCurrentRoom();
    const startPos = this.currentRoom.getPlayerStartPosition();

    this.player = new Player(startPos, 64, 64, "red", 13);
    this.player.setSprite(
      "/assets/sprites/dagger-sprite-sheet.png",
      new Rect(0, 0, 64, 64)
    );
    this.player.setAnimation(130, 130, false, variables.animationDelay);
    this.player.setCurrentRoom(this.currentRoom);

    this.enemies = this.currentRoom.objects.enemies;

    if (this.currentRoom.roomType === "shop" && this.currentRoom.objects.shop) {
      this.currentRoom.objects.shop = this.globalShop;
      this.currentRoom.objects.shop.setOnCloseCallback(() => {
        this.currentRoom.shopCanBeOpened = false;
      });
    }
  }

  draw(ctx) {
    this.currentRoom.draw(ctx);
    this.player.draw(ctx);
    this.drawUI(ctx);

    if (this.currentRoom?.objects.shop?.isOpen) {
      this.currentRoom.objects.shop.draw(
        ctx,
        variables.canvasWidth,
        variables.canvasHeight,
        this.player
      );
    }
    if (this.floorGenerator.isBossRoom()) {
      const room = this.floorGenerator.getCurrentRoom();
      const boss = room.objects.enemies.find(e => e instanceof Boss);
      drawBossHealthBar(ctx, boss);
    }
  }

  drawUI(ctx) {
    const iconSize = 20;
    const startX = 100;
    const startY = 100;
    const barWidth = 200;
    const barHeight = 20;

    // Draw Run/Floor/Room info in bottom-right corner
    const currentRun = this.floorGenerator.getCurrentRun();
    const currentFloor = this.floorGenerator.getCurrentFloor();
    const currentRoom = this.floorGenerator.getCurrentRoomIndex() + 1; // Convert to 1-based
    const totalRooms = this.floorGenerator.getTotalRooms();

    // Set text properties
    ctx.font = "18px Arial";
    ctx.textAlign = "right";
    const runFloorRoomText = `Run ${currentRun} | Floor ${currentFloor} | Room ${currentRoom}/${totalRooms}`;

    // Draw text with outline for better visibility in bottom-right
    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;
    ctx.strokeText(runFloorRoomText, variables.canvasWidth - 10, variables.canvasHeight - 10);

    ctx.fillStyle = "white";
    ctx.fillText(runFloorRoomText, variables.canvasWidth - 10, variables.canvasHeight - 10);

    // Reset text alignment for other UI elements
    ctx.textAlign = "left";

    // Draw weapon icons
    const icons = [
      { type: "dagger", img: "Sword.png" },
      { type: "slingshot", img: "Bow.png" },
    ];

    icons.forEach((icon, i) => {
      const iconImg = new Image();
      iconImg.src = `/assets/sprites/${icon.img}`;
      const x = startX + i * (iconSize + 10);
      const y = startY;

      ctx.drawImage(iconImg, x, y, iconSize, iconSize);
      ctx.strokeStyle = this.player.weaponType === icon.type ? "white" : "gray";
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 1, y - 1, iconSize + 2, iconSize + 2);
    });

    // Draw health bar
    const hpRatio = this.player.health / this.player.maxHealth;
    ctx.fillStyle = "grey";
    ctx.fillRect(40, 40, barWidth, barHeight);
    ctx.fillStyle = "red";
    ctx.fillRect(40, 40, barWidth * hpRatio, barHeight);
    ctx.strokeStyle = "white";
    ctx.strokeRect(40, 40, barWidth, barHeight);

    // Draw stamina bar
    const staminaRatio = this.player.stamina / this.player.maxStamina;
    ctx.fillStyle = "grey";
    ctx.fillRect(40, 70, barWidth, barHeight);
    ctx.fillStyle = "yellow";
    ctx.fillRect(40, 70, barWidth * staminaRatio, barHeight);
    ctx.strokeStyle = "white";
    ctx.strokeRect(40, 70, barWidth, barHeight);

    // Draw gold counter
    const goldIcon = new Image();
    goldIcon.src = "/assets/sprites/gold_coin.png";
    ctx.drawImage(goldIcon, 40, 100, 20, 20);
    ctx.fillStyle = "white";
    ctx.font = "16px monospace";
    ctx.fillText(`${this.player.gold}`, 65, 115);
  }

  resetGameAfterDeath() {
    console.log("=== COMPLETE GAME RESET AFTER DEATH ===");

    try {
      // Reset run statistics for new run
      this.resetRunStats();
      
      this.floorGenerator.resetToInitialState();
      this.globalShop.resetForNewRun();

      this.currentRoom = this.floorGenerator.getCurrentRoom();
      const startPos = this.currentRoom.getPlayerStartPosition();

      this.player.resetToInitialState(startPos);
      this.player.setCurrentRoom(this.currentRoom);
      this.player.previousPosition = new Vec(startPos.x, startPos.y);

      this.enemies = this.currentRoom.objects.enemies;

      console.log("Game reset complete!");
      return true;
    } catch (error) {
      console.error("Error during game reset:", error);
      return false;
    }
  }

  // Extracted helper method to handle room transitions
  async handleRoomTransition(direction) {
    const isBossRoom = this.floorGenerator.isBossRoom();
    const transitionMethod =
      direction === "right" ? "nextRoom" : "previousRoom";
    const edgePositionMethod =
      direction === "right"
        ? "getPlayerStartPosition"
        : "getPlayerRightEdgePosition";

    if (direction === "left" && this.floorGenerator.isFirstRoom()) {
      console.log("Cannot retreat: Already in the first room");
      return;
    }

    if (this.currentRoom.canTransition()) {
      this.floorGenerator.updateRoomState(
        this.floorGenerator.getCurrentRoomIndex(),
        this.currentRoom
      );

      if (isBossRoom && direction === "right") {
        console.log("Transitioning to next floor");
        await this.floorGenerator.nextFloor();
      } else if (!this.floorGenerator[transitionMethod]()) {
        console.log("Room transition failed");
        return;
      }

      this.currentRoom = this.floorGenerator.getCurrentRoom();
      if (this.currentRoom) {
        this.player.setCurrentRoom(this.currentRoom);
        this.player.position = this.currentRoom[edgePositionMethod]();
        this.player.velocity = new Vec(0, 0);
        this.player.keys = [];
        this.enemies = this.currentRoom.objects.enemies;
      }
    } else {
      console.log(
        direction === "right"
          ? "Cannot advance: Enemies still alive in combat room"
          : "Cannot retreat: Enemies still alive in current room"
      );
    }
  }

  update(deltaTime) {
    // Check if shop is open - if so, don't update game state
    if (this.currentRoom?.objects.shop?.isOpen) {
      return;
    }

    // Update current room
    this.currentRoom.update(deltaTime);

    // Update global enemies array
    this.enemies = this.currentRoom.objects.enemies;

    // Check room transition
    if (this.currentRoom.isPlayerAtRightEdge(this.player)) {
      // Don't block the game loop with async operations
      this.handleRoomTransition("right").catch(error => {
        console.error("Error in room transition:", error);
      });
    } else if (this.currentRoom.isPlayerAtLeftEdge(this.player)) {
      // Don't block the game loop with async operations
      this.handleRoomTransition("left").catch(error => {
        console.error("Error in room transition:", error);
      });
    }

    // Update player
    this.player.update(deltaTime);

    // Check wall collisions
    if (this.currentRoom.checkWallCollision(this.player)) {
      this.player.position = this.player.previousPosition;
    }

    // Save current position for next update
    this.player.previousPosition = new Vec(
      this.player.position.x,
      this.player.position.y
    );

    // Check if all enemies are dead and spawn chest
    const aliveEnemies = this.enemies.filter((enemy) => enemy.state !== "dead");
    if (
      this.currentRoom &&
      this.currentRoom.isCombatRoom &&
      aliveEnemies.length === 0 &&
      !this.currentRoom.chestSpawned
    ) {
      this.currentRoom.spawnChest();
    }

    // Update shop reference if we're in a shop room
    if (this.currentRoom && this.currentRoom.roomType === "shop") {
      this.currentRoom.objects.shop = this.globalShop;
      this.currentRoom.objects.shop.setOnCloseCallback(() => {
        this.currentRoom.shopCanBeOpened = false;
      });
    }
  }

  // Event listeners
  createEventListeners() {
    addEventListener("keydown", (e) => {
      const key = e.key.toLowerCase();

      if (this.currentRoom?.objects.shop?.isOpen) {
        this.currentRoom.objects.shop.handleInput(e.key, this.player);
        e.preventDefault();
        return;
      }

      const action = keyDirections[key];

      if (action === "dagger" || action === "slingshot") {
        this.player.setWeapon(action);
      } else if (action === "attack") {
        this.player.attack();
      } else if (action === "dash") {
        this.player.startDash();
      } else if (action && ["up", "down", "left", "right"].includes(action)) {
        if (!this.player.keys.includes(action)) {
          this.player.keys.push(action);
        }
      }
    });

    addEventListener("keyup", (e) => {
      const key = e.key.toLowerCase();
      const action = keyDirections[key];

      if (action && ["up", "down", "left", "right"].includes(action)) {
        this.player.keys = this.player.keys.filter((k) => k !== action);
      }
    });
  }

  // Run statistics tracking methods
  trackGoldSpent(amount) {
    this.runStats.goldSpent += amount;
    console.log(`Gold spent: +${amount}, Total spent this run: ${this.runStats.goldSpent}`);
  }

  trackKill() {
    this.runStats.totalKills++;
    console.log(`Enemy killed! Total kills this run: ${this.runStats.totalKills}`);
  }

  resetRunStats() {
    console.log("Resetting run statistics...");
    this.runStats = {
      goldSpent: 0,
      totalKills: 0
    };
  }

  getRunStats() {
    return {
      goldSpent: this.runStats.goldSpent,
      totalKills: this.runStats.totalKills,
      goldCollected: this.player ? this.player.getGold() : 0
    };
  }

  // Game state management methods
  setupNewGame() {
  }
}
export function drawBossHealthBar(ctx, boss) {
  if (!boss || boss.health <= 0) return;

  const barWidth = 300;
  const barHeight = 12;
  const x = (variables.canvasWidth - barWidth) / 2;
  const y = (variables.canvasHeight - barHeight) - 20;

  const pct = boss.health / boss.maxHealth;

  // fondo rojo
  ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
  ctx.fillRect(x, y, barWidth, barHeight);

  // vida actual verde
  ctx.fillStyle = "rgba(0, 255, 0, 0.8)";
  ctx.fillRect(x, y, barWidth * pct, barHeight);

  // borde blanco
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, barWidth, barHeight);

  // nombre del boss
  ctx.fillStyle = "white";
  ctx.font = "16px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("DRAGON BOSS", x + barWidth / 2, y - 6);
}