// filepath: /Users/fest/repos/Proyecto-Videojuego/videogame/src/classes/game/Game.js
import { Vec } from "../../utils/Vec.js";
import { Rect } from "../../utils/Rect.js";
import { Player } from "../entities/Player.js";
import { variables, keyDirections } from "../../config.js";
import { FloorGenerator } from "./FloorGenerator.js";
import { Shop } from "../entities/Shop.js";

export class Game {
  constructor() {
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
      "./assets/sprites/dagger-sprite-sheet.png",
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
  }

  drawUI(ctx) {
    const iconSize = 20;
    const startX = 100;
    const startY = 100;
    const barWidth = 200;
    const barHeight = 20;

    // Draw weapon icons
    const icons = [
      { type: "dagger", img: "Sword.png" },
      { type: "slingshot", img: "Bow.png" },
    ];

    icons.forEach((icon, i) => {
      const iconImg = new Image();
      iconImg.src = `./assets/sprites/${icon.img}`;
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
    goldIcon.src = "./assets/sprites/gold_coin.png";
    ctx.drawImage(goldIcon, 40, 100, 20, 20);
    ctx.fillStyle = "white";
    ctx.font = "16px monospace";
    ctx.fillText(`${this.player.gold}`, 65, 115);
  }

  resetGameAfterDeath() {
    console.log("=== COMPLETE GAME RESET AFTER DEATH ===");

    try {
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
      // Only allow transition if room requirements are met
      if (this.currentRoom.canTransition()) {
        // Save room state before transitioning
        this.floorGenerator.updateRoomState(
          this.floorGenerator.getCurrentRoomIndex(),
          this.currentRoom
        );

        // If it's the boss room, advance to next floor
        if (this.floorGenerator.isBossRoom()) {
          console.log("Transitioning to next floor");
          this.floorGenerator.nextFloor();

          // Create new room using the new method
          this.currentRoom = this.floorGenerator.getCurrentRoom();
          if (this.currentRoom) {
            // Update room reference in player
            this.player.setCurrentRoom(this.currentRoom);
            // Reposition player at left side of new room
            this.player.position = this.currentRoom.getPlayerStartPosition();
            // Ensure player can't move during transition
            this.player.velocity = new Vec(0, 0);
            this.player.keys = [];
            // Update global enemies array
            this.enemies = this.currentRoom.objects.enemies;
          }
        } else {
          // Normal room transition
          if (this.floorGenerator.nextRoom()) {
            // Create new room using the new method
            this.currentRoom = this.floorGenerator.getCurrentRoom();
            if (this.currentRoom) {
              // Update room reference in player
              this.player.setCurrentRoom(this.currentRoom);
              // Reposition player at left side of new room
              this.player.position = this.currentRoom.getPlayerStartPosition();
              // Ensure player can't move during transition
              this.player.velocity = new Vec(0, 0);
              this.player.keys = [];
              // Update global enemies array
              this.enemies = this.currentRoom.objects.enemies;
            }
          }
        }
      } else {
        console.log("Cannot advance: Enemies still alive in combat room");
      }
    } else if (this.currentRoom.isPlayerAtLeftEdge(this.player)) {
      // Check if we can go back to previous room
      if (!this.floorGenerator.isFirstRoom()) {
        // Only allow backward transition if current room can be left
        if (this.currentRoom.canTransition()) {
          // Save room state before transitioning
          this.floorGenerator.updateRoomState(
            this.floorGenerator.getCurrentRoomIndex(),
            this.currentRoom
          );

          if (this.floorGenerator.previousRoom()) {
            // Create previous room using the new method
            this.currentRoom = this.floorGenerator.getCurrentRoom();
            if (this.currentRoom) {
              // Update room reference in player
              this.player.setCurrentRoom(this.currentRoom);
              // Reposition player at right side of previous room
              this.player.position =
                this.currentRoom.getPlayerRightEdgePosition();
              // Ensure player can't move during transition
              this.player.velocity = new Vec(0, 0);
              this.player.keys = [];
              // Update global enemies array
              this.enemies = this.currentRoom.objects.enemies;
            }
          }
        } else {
          console.log("Cannot retreat: Enemies still alive in current room");
        }
      }
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
}
