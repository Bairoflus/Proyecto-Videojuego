// Game.js: Main game logic
import { Vec } from "./Vec.js";
import { Rect } from "./Rect.js";
import { Player } from "./Player.js";
import { Coin } from "./Coin.js";
import { GoblinArcher } from "./enemies/floor1/GoblinArcher.js";
import { GoblinDagger } from "./enemies/floor1/GoblinDagger.js";
import { variables, keyDirections, playerMovement } from "../config.js";
import { boxOverlap } from "../utils.js";
import { FloorGenerator } from "./FloorGenerator.js";
import { Room } from "./Room.js";

export class Game {
  constructor() {
    this.createEventListeners();
    this.floorGenerator = new FloorGenerator();
    this.enemies = []; // Initialize empty enemies array
    this.initObjects();
    // Make game instance accessible to other classes
    window.game = this;
  }
  // Creates initial player and room
  initObjects() {
    // Create initial room
    this.currentRoom = new Room(this.floorGenerator.getCurrentRoomLayout());

    // Create player at initial room position
    const startPos = this.currentRoom.getPlayerStartPosition();
    this.player = new Player(startPos, 64, 64, "red", 13);
    this.player.setSprite(
      "./assets/sprites/dagger-sprite-sheet.png",
      new Rect(0, 0, 64, 64)
    );
    this.player.setAnimation(130, 130, false, variables.animationDelay);
    this.player.setCurrentRoom(this.currentRoom);
  }
  // Draws current room and player
  draw(ctx) {
    // Draw current room
    this.currentRoom.draw(ctx);

    // Draw player
    this.player.draw(ctx);

    // Draw status text
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    const run = this.floorGenerator.getCurrentRun();
    const floor = this.floorGenerator.getCurrentFloor();
    const room = this.floorGenerator.getCurrentRoomIndex() + 1;
    const text = `Run ${run} | Floor ${floor} | Room ${room}`;
    const textWidth = ctx.measureText(text).width;
    const padding = 10;

    // Draw semi-transparent background
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(
      variables.canvasWidth - textWidth - padding * 2,
      variables.canvasHeight - 30,
      textWidth + padding * 2,
      30
    );

    // Draw text
    ctx.fillStyle = "white";
    ctx.fillText(
      text,
      variables.canvasWidth - textWidth - padding,
      variables.canvasHeight - 10
    );
  }
  // Updates game logic
  update(deltaTime) {
    // Update current room
    this.currentRoom.update(deltaTime);

    // Check room transition
    if (this.currentRoom.isPlayerAtRightEdge(this.player)) {
      // If it's the boss room, advance to next floor
      if (this.floorGenerator.isBossRoom()) {
        console.log("Transitioning to next floor");
        this.floorGenerator.nextFloor();

        const nextLayout = this.floorGenerator.getCurrentRoomLayout();
        if (nextLayout) {
          // Create new room
          this.currentRoom = new Room(nextLayout);
          // Update room reference in player
          this.player.setCurrentRoom(this.currentRoom);
          // Reposition player at left side of new room
          this.player.position = this.currentRoom.getPlayerStartPosition();
          // Ensure player can't move during transition
          this.player.velocity = new Vec(0, 0);
          this.player.keys = [];
        }
      } else {
        // Normal room transition
        if (this.floorGenerator.nextRoom()) {
          const nextLayout = this.floorGenerator.getCurrentRoomLayout();
          if (nextLayout) {
            // Create new room
            this.currentRoom = new Room(nextLayout);
            // Update room reference in player
            this.player.setCurrentRoom(this.currentRoom);
            // Reposition player at left side of new room
            this.player.position = this.currentRoom.getPlayerStartPosition();
            // Ensure player can't move during transition
            this.player.velocity = new Vec(0, 0);
            this.player.keys = [];
          }
        }
      }
    } else if (this.currentRoom.isPlayerAtLeftEdge(this.player)) {
      // Check if we can go back to previous room
      if (!this.floorGenerator.isFirstRoom()) {
        if (this.floorGenerator.previousRoom()) {
          const previousLayout = this.floorGenerator.getCurrentRoomLayout();
          if (previousLayout) {
            // Create previous room
            this.currentRoom = new Room(previousLayout);
            // Update room reference in player
            this.player.setCurrentRoom(this.currentRoom);
            // Reposition player at right side of previous room
            this.player.position =
              this.currentRoom.getPlayerRightEdgePosition();
            // Ensure player can't move during transition
            this.player.velocity = new Vec(0, 0);
            this.player.keys = [];
          }
        }
      }
    }

    // Update player
    this.player.update(deltaTime);

    // Check wall collisions
    if (this.currentRoom.checkWallCollision(this.player)) {
      // Revert player position if colliding with wall
      this.player.position = this.player.previousPosition;
    }

    // Save current position for next update
    this.player.previousPosition = new Vec(
      this.player.position.x,
      this.player.position.y
    );
  }
  // Keyboard events for movement and actions
  createEventListeners() {
    window.addEventListener("keydown", (e) => {
      const action = keyDirections[e.key];
      if (!action) return;

      // Handle weapon switching
      if (action === "dagger" || action === "slingshot") {
        this.player.setWeapon(action);
        return;
      }

      // Handle attack
      if (action === "attack") {
        this.player.attack();
        return;
      }

      // Handle movement
      this.add_key(action);
    });
    window.addEventListener("keyup", (e) => {
      const action = keyDirections[e.key];
      if (action && action !== "attack" && action !== "dagger" && action !== "slingshot") {
        this.del_key(action);
      }
    });
  }
  // Add movement direction
  add_key(direction) {
    if (!this.player.keys.includes(direction)) {
      this.player.keys.push(direction);
    }
  }
  // Remove movement direction
  del_key(direction) {
    this.player.keys = this.player.keys.filter((key) => key !== direction);
  }
}
