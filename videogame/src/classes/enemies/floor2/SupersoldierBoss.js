import { Boss } from "../../entities/Boss.js";
import { Vec } from "../../../utils/Vec.js";
import { variables } from "../../../config.js";
import { Drone } from "./Drone.js";

export class Supersoldier extends Boss {
  constructor(position) {
    const width = 64;
    const height = 64;
    const maxHp = 1000;
    const color = "#2a75f3"; // metallic blue

    // Define attacks by phase: phase 1 = drones, phase 2 = shield, phase 3 = charged attack
    const attacks = [
      {
        name: "Drone Summon",
        phase: 1,
        cooldown: 12000, // 12s between summons
        execute: (self) => {
          // Don't summon drones during initial delay period
          if (self.initialDelay) {
            return;
          }

          // Only summon if we haven't reached the drone limit
          if (self.drones.length < self.maxDrones) {
            // Calculate position for the new drone (around the boss)
            const angle = Math.random() * Math.PI * 2; // Random angle
            const distance = 100; // Distance from boss
            const spawnPos = new Vec(
              self.position.x + Math.cos(angle) * distance,
              self.position.y + Math.sin(angle) * distance
            );

            // Clean and direct implementation
            const drone = new Drone(spawnPos);
            drone.setCurrentRoom(self.currentRoom); // so room.update() handles it properly
            drone.parent = self; // for damage to boss
            self.currentRoom.objects.enemies.push(drone);
            self.drones.push(drone);

            console.log("Supersoldier has summoned a drone at position:", {
              x: Math.round(spawnPos.x),
              y: Math.round(spawnPos.y),
            });

            console.log("Supersoldier has summoned a drone");
          } else {
            console.log("Supersoldier already has maximum drones");
          }
        },
      },
      {
        name: "Shield Regen",
        phase: 2,
        cooldown: 15000, // 15s between regenerations
        execute: (self) => {
          // Don't activate shield during initial delay period
          if (self.initialDelay) {
            return;
          }

          // Start gradual regeneration (100 total points)
          self.isRegenerating = true;
          self.totalRegenAmount = 100;
          self.currentRegenAmount = 0;

          // Determine barrier position based on player
          const player = window.game.player;

          // Calculate direction based on player's relative position
          const dx = player.position.x - self.position.x;
          const dy = player.position.y - self.position.y;

          // Determine main direction (largest difference)
          if (Math.abs(dx) > Math.abs(dy)) {
            self.shieldDir = dx > 0 ? "right" : "left";
          } else {
            self.shieldDir = dy > 0 ? "down" : "up";
          }

          // Adjust barrier distance for better centering
          self.barrierDistance = 40; // Reduced distance for better centering

          // Remove barrier after duration
          setTimeout(() => {
            self.shieldDir = null;
            // Make sure to clean up the barrier
            if (self.barrierWallRegistered && self.currentRoom) {
              if (self.currentRoom.objects.temporaryWalls) {
                self.currentRoom.objects.temporaryWalls = [];
              }

              if (self.currentRoom.originalCheckWallCollision) {
                self.currentRoom.checkWallCollision =
                  self.currentRoom.originalCheckWallCollision;
                self.currentRoom.originalCheckWallCollision = null;
              }

              self.barrierWallRegistered = false;
            }
          }, 3000);
        },
      },
      {
        name: "Charged Shot",
        phase: 3,
        cooldown: 8000, // 8s between charged shots
        execute: (self) => {
          // Don't charge shot during initial delay period
          if (self.initialDelay) {
            return;
          }

          // Start charged attack
          self.isChargingShot = true;
          self.chargeTime = 0;
          self.chargeDuration = 2000; // 2 seconds charge time
          self.warningStartTime = 1500; // Blinking in last 500ms

          // Aim at player
          const player = window.game.player;
          self.targetPosition = new Vec(
            player.position.x + player.width / 2,
            player.position.y + player.height / 2
          );

          // Calculate shot direction
          const sourcePosition = new Vec(
            self.position.x + self.width / 2,
            self.position.y + self.height / 2
          );
          const dx = self.targetPosition.x - sourcePosition.x;
          const dy = self.targetPosition.y - sourcePosition.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          self.shotDirection = {
            x: dx / distance,
            y: dy / distance,
          };

          console.log("Supersoldier is charging a powerful shot");
        },
      },
    ];

    super(position, width, height, color, maxHp, attacks, "supersoldier");
    this.displayName = "Supersoldier";
    this.shieldDir = null;
    this.isRegenerating = false;
    this.totalRegenAmount = 0;
    this.currentRegenAmount = 0;
    this.stunned = false;
    this.stunTimeLeft = 0;
    this.barrierWallRegistered = false;
    this.barrierDistance = 40; // Reduced distance for better centering

    // Properties for charged attack
    this.isChargingShot = false;
    this.chargeTime = 0;
    this.chargeDuration = 2000;
    this.warningStartTime = 1500;
    this.targetPosition = null;
    this.shotDirection = null;
    this.laserColor = "red";

    // Properties for drones
    this.drones = [];
    this.maxDrones = 2; // Maximum 2 active drones at once
  }

  drawUI(ctx) {
    // Draw bar and name
    super.drawUI(ctx);

    // If barrier is active, draw it
    if (this.shieldDir) {
      ctx.save();
      ctx.translate(
        this.position.x + this.width / 2,
        this.position.y + this.height / 2
      );
      ctx.fillStyle = "rgba(0, 200, 255, 0.5)";

      const barrierLength = this.width * 3; // Longer barrier (increased for better symmetry)
      const barrierThickness = 20; // Barrier thickness
      const barrierDistance = this.barrierDistance || 40; // Reduced distance for better centering

      // Draw barrier based on direction
      switch (this.shieldDir) {
        case "up":
          ctx.fillRect(
            -barrierLength / 2,
            -this.height / 2 - barrierDistance - barrierThickness,
            barrierLength,
            barrierThickness
          );
          break;
        case "down":
          ctx.fillRect(
            -barrierLength / 2,
            this.height / 2 + barrierDistance,
            barrierLength,
            barrierThickness
          );
          break;
        case "left":
          ctx.fillRect(
            -this.width / 2 - barrierDistance - barrierThickness,
            -barrierLength / 2,
            barrierThickness,
            barrierLength
          );
          break;
        case "right":
          ctx.fillRect(
            this.width / 2 + barrierDistance,
            -barrierLength / 2,
            barrierThickness,
            barrierLength
          );
          break;
      }
      ctx.restore();
    }

    // Draw targeting laser if charging shot
    if (this.isChargingShot && this.targetPosition) {
      const sourceX = this.position.x + this.width / 2;
      const sourceY = this.position.y + this.height / 2;

      // Determine laser color (blinking in last 500ms)
      if (this.chargeTime >= this.warningStartTime) {
        // Fast blinking between red and yellow
        const blinkRate = 100; // ms per blink
        this.laserColor =
          Math.floor((this.chargeTime - this.warningStartTime) / blinkRate) %
            2 ===
          0
            ? "red"
            : "yellow";
      } else {
        this.laserColor = "red";
      }

      // Draw laser line
      ctx.beginPath();
      ctx.moveTo(sourceX, sourceY);
      ctx.lineTo(this.targetPosition.x, this.targetPosition.y);
      ctx.strokeStyle = this.laserColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw targeting dot at target
      ctx.beginPath();
      ctx.arc(this.targetPosition.x, this.targetPosition.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = this.laserColor;
      ctx.fill();
    }

    // Show stunned state
    if (this.stunned) {
      ctx.save();
      ctx.translate(this.position.x, this.position.y - this.height / 2 - 20);
      ctx.fillStyle = "yellow";
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.fillText("STUNNED!", 0, 0);
      ctx.restore();
    }
  }

  update(deltaTime) {
    // If stunned, do nothing but update stun time
    if (this.stunned) {
      this.stunTimeLeft -= deltaTime;
      if (this.stunTimeLeft <= 0) {
        this.stunned = false;
        // Interrupt healing when coming out of stun
        this.isRegenerating = false;
      }
      return; // Don't execute the rest of update while stunned
    }

    super.update(deltaTime);

    // Update charged attack
    if (this.isChargingShot) {
      this.chargeTime += deltaTime;

      // Update target position during the entire charge
      if (window.game && window.game.player) {
        // Always follow player
        const player = window.game.player;
        this.targetPosition = new Vec(
          player.position.x + player.width / 2,
          player.position.y + player.height / 2
        );

        // Update shot direction
        const sourcePosition = new Vec(
          this.position.x + this.width / 2,
          this.position.y + this.height / 2
        );
        const dx = this.targetPosition.x - sourcePosition.x;
        const dy = this.targetPosition.y - sourcePosition.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        this.shotDirection = {
          x: dx / distance,
          y: dy / distance,
        };
      }

      // When charge completes, fire
      if (this.chargeTime >= this.chargeDuration) {
        this.fireChargedShot();
        this.isChargingShot = false;
      }
    }

    // Chase player when not stunned, no active barrier, and not charging a shot
    if (
      !this.stunned &&
      !this.shieldDir &&
      !this.isChargingShot &&
      window.game &&
      window.game.player
    ) {
      const player = window.game.player;
      const moveSpeed = 0.3; // Movement speed

      // Calculate direction toward player
      const dx = player.position.x - this.position.x;
      const dy = player.position.y - this.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Only move if player is at a certain distance
      if (distance > 100) {
        // Normalize and apply speed
        const moveX = (dx / distance) * moveSpeed;
        const moveY = (dy / distance) * moveSpeed;

        // Move boss toward player
        this.position.x += moveX;
        this.position.y += moveY;

        // Avoid wall collisions if there's a current room
        if (this.currentRoom && this.currentRoom.checkWallCollision(this)) {
          this.position.x -= moveX;
          this.position.y -= moveY;
        }
      }
    }

    // Gradual health regeneration (up to 100 total points)
    if (
      this.isRegenerating &&
      this.currentRegenAmount < this.totalRegenAmount
    ) {
      // 20 points per second = 20 * deltaTime / 1000 per frame
      const regenAmount = (20 * deltaTime) / 1000;
      this.health = Math.min(this.maxHealth, this.health + regenAmount);
      this.currentRegenAmount += regenAmount;

      // Stop regeneration when reaching the limit
      if (this.currentRegenAmount >= this.totalRegenAmount) {
        this.isRegenerating = false;
      }
    }

    // Update drone list (remove destroyed ones)
    if (this.drones.length > 0) {
      // Filter destroyed drones
      const destroyedDrones = this.drones.filter((drone) => drone.health <= 0);

      // For each destroyed drone, damage the boss
      destroyedDrones.forEach((drone) => {
        this.damageFromDrone();
      });

      // Update the list of active drones
      this.drones = this.drones.filter((drone) => drone.health > 0);

      // Update each active drone
      this.drones.forEach((drone) => {
        if (window.game && window.game.player) {
          drone.update(deltaTime, window.game.player, this.currentRoom);
        }
      });
    }

    // Update projectiles if they exist
    if (this.projectiles && this.projectiles.length > 0) {
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const projectile = this.projectiles[i];

        // Update position
        projectile.position.x += (projectile.velocity.x * deltaTime) / 1000;
        projectile.position.y += (projectile.velocity.y * deltaTime) / 1000;

        // Update lifetime
        projectile.timeAlive += deltaTime;
        if (projectile.timeAlive >= projectile.lifetime) {
          projectile.isActive = false;
          this.projectiles.splice(i, 1);
          continue;
        }

        // Check wall collisions
        if (this.currentRoom) {
          const tempObj = {
            position: projectile.position,
            width: projectile.radius * 2,
            height: projectile.radius * 2,
            getHitboxBounds: () => ({
              x: projectile.position.x - projectile.radius,
              y: projectile.position.y - projectile.radius,
              width: projectile.radius * 2,
              height: projectile.radius * 2,
            }),
          };

          if (this.currentRoom.checkWallCollision(tempObj)) {
            projectile.isActive = false;
            this.projectiles.splice(i, 1);
            continue;
          }
        }

        // Check collision with player
        const player = window.game.player;
        if (player && player.health > 0) {
          const playerHitbox = player.getHitboxBounds();
          const projectileHitbox = {
            x: projectile.position.x - projectile.radius,
            y: projectile.position.y - projectile.radius,
            width: projectile.radius * 2,
            height: projectile.radius * 2,
          };

          if (
            this.checkCollision(
              {
                position: playerHitbox,
                width: playerHitbox.width,
                height: playerHitbox.height,
              },
              projectileHitbox
            )
          ) {
            player.takeDamage(projectile.damage);
            projectile.isActive = false;
            this.projectiles.splice(i, 1);
            console.log(
              `Charged projectile hit player for ${projectile.damage} damage`
            );
          }
        }
      }
    }

    // Handle barrier collisions if active
    if (this.shieldDir) {
      const player = window.game.player;
      const barrierLength = this.width * 3; // Longer barrier (increased for better symmetry)
      const barrierThickness = 20; // Barrier thickness
      const barrierDistance = this.barrierDistance || 40; // Reduced distance for better centering

      // Create hitbox for barrier based on direction
      let barrierHitbox;

      switch (this.shieldDir) {
        case "up":
          barrierHitbox = {
            x: this.position.x - barrierLength / 2,
            y:
              this.position.y -
              this.height / 2 -
              barrierDistance -
              barrierThickness,
            width: barrierLength,
            height: barrierThickness,
          };
          break;
        case "down":
          barrierHitbox = {
            x: this.position.x - barrierLength / 2,
            y: this.position.y + this.height / 2 + barrierDistance,
            width: barrierLength,
            height: barrierThickness,
          };
          break;
        case "left":
          barrierHitbox = {
            x:
              this.position.x -
              this.width / 2 -
              barrierDistance -
              barrierThickness,
            y: this.position.y - barrierLength / 2,
            width: barrierThickness,
            height: barrierLength,
          };
          break;
        case "right":
          barrierHitbox = {
            x: this.position.x + this.width / 2 + barrierDistance,
            y: this.position.y - barrierLength / 2,
            width: barrierThickness,
            height: barrierLength,
          };
          break;
      }

      // Register barrier as a temporary wall in current room
      if (!this.barrierWallRegistered && this.currentRoom) {
        // Create a Rect object for the barrier (same as walls)
        const barrierWall = {
          x: barrierHitbox.x,
          y: barrierHitbox.y,
          width: barrierHitbox.width,
          height: barrierHitbox.height,
        };

        // Add barrier to room walls
        if (!this.currentRoom.objects.temporaryWalls) {
          this.currentRoom.objects.temporaryWalls = [];
        }
        this.currentRoom.objects.temporaryWalls.push(barrierWall);

        // Extend room's checkWallCollision method to include temporary walls
        if (!this.currentRoom.originalCheckWallCollision) {
          this.currentRoom.originalCheckWallCollision =
            this.currentRoom.checkWallCollision;
          this.currentRoom.checkWallCollision = function (obj) {
            // First check collision with normal walls
            if (this.originalCheckWallCollision(obj)) {
              return true;
            }

            // Then check collision with temporary walls
            if (this.objects.temporaryWalls) {
              const objHitbox = obj.getHitboxBounds();
              return this.objects.temporaryWalls.some(
                (wall) =>
                  objHitbox.x + objHitbox.width > wall.x &&
                  objHitbox.x < wall.x + wall.width &&
                  objHitbox.y + objHitbox.height > wall.y &&
                  objHitbox.y < wall.y + wall.height
              );
            }

            return false;
          };
        }

        this.barrierWallRegistered = true;
      }

      // Check collisions with player projectiles
      if (window.game.projectiles) {
        window.game.projectiles.forEach((projectile) => {
          if (
            projectile.fromPlayer &&
            this.checkCollision(projectile, barrierHitbox)
          ) {
            projectile.destroy();
          }
        });
      }
    } else if (this.barrierWallRegistered && this.currentRoom) {
      // Remove barrier when no longer active
      if (this.currentRoom.objects.temporaryWalls) {
        this.currentRoom.objects.temporaryWalls = [];
      }

      // Restore original collision check method
      if (this.currentRoom.originalCheckWallCollision) {
        this.currentRoom.checkWallCollision =
          this.currentRoom.originalCheckWallCollision;
        this.currentRoom.originalCheckWallCollision = null;
      }

      this.barrierWallRegistered = false;
    }
  }

  // Override takeDamage method to add stunning
  takeDamage(amount) {
    super.takeDamage(amount);

    // Stun the boss only when barrier is active
    if (!this.stunned && this.shieldDir) {
      this.stunned = true;
      this.stunTimeLeft = 2000; // 2 seconds of stun
      // Interrupt healing immediately when taking damage
      if (this.isRegenerating) {
        this.isRegenerating = false;
      }
    }
  }

  // Method to take damage when a drone is destroyed
  damageFromDrone() {
    const damageAmount = 50; // Fixed damage amount per drone
    this.health = Math.max(0, this.health - damageAmount);
    console.log(
      `Supersoldier took ${damageAmount} damage from a destroyed drone`
    );

    // Check if boss died from this damage
    if (this.health <= 0) {
      this.die();
    }
  }

  // Function to fire the charged shot
  fireChargedShot() {
    if (!this.shotDirection || !this.targetPosition) return;

    const sourcePosition = new Vec(
      this.position.x + this.width / 2,
      this.position.y + this.height / 2
    );

    // Create a large projectile
    const projectile = {
      position: new Vec(sourcePosition.x, sourcePosition.y),
      velocity: new Vec(this.shotDirection.x * 400, this.shotDirection.y * 400), // High velocity
      damage: 200, // High damage
      radius: 15, // Large radius
      isActive: true,
      fromPlayer: false,
      color: "yellow",
      lifetime: 3000, // 3 seconds lifetime
      timeAlive: 0,
    };

    // Add projectile to projectiles list
    if (!this.projectiles) this.projectiles = [];
    this.projectiles.push(projectile);

    console.log("Supersoldier fired a charged projectile");
  }

  // Method to draw the boss and its projectiles
  draw(ctx) {
    // Draw the boss
    super.draw(ctx);

    // Draw drones
    if (this.drones && this.drones.length > 0) {
      this.drones.forEach((drone) => {
        if (drone && typeof drone.draw === "function") {
          drone.draw(ctx);
        }
      });
    }

    // Draw projectiles
    if (this.projectiles && this.projectiles.length > 0) {
      this.projectiles.forEach((projectile) => {
        if (projectile.isActive) {
          ctx.beginPath();
          ctx.arc(
            projectile.position.x,
            projectile.position.y,
            projectile.radius,
            0,
            Math.PI * 2
          );
          ctx.fillStyle = projectile.color || "yellow";
          ctx.fill();

          // Add a glowing border
          ctx.strokeStyle = "white";
          ctx.lineWidth = 2;
          ctx.stroke();

          // Glow effect
          ctx.beginPath();
          ctx.arc(
            projectile.position.x,
            projectile.position.y,
            projectile.radius * 1.5,
            0,
            Math.PI * 2
          );
          ctx.strokeStyle = "rgba(255, 255, 0, 0.3)";
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      });
    }
  }

  // Method to get the boss hitbox
  getHitboxBounds() {
    return {
      x: this.position.x,
      y: this.position.y,
      width: this.width,
      height: this.height,
    };
  }

  // Helper function to check collisions
  checkCollision(entity, rect) {
    // Verify that both objects exist and have the necessary properties
    if (
      !entity ||
      !rect ||
      !entity.position ||
      !rect.x ||
      !rect.y ||
      rect.width === undefined ||
      rect.height === undefined ||
      entity.width === undefined ||
      entity.height === undefined
    ) {
      return false;
    }

    // Use getHitboxBounds if available
    const entityBounds = entity.getHitboxBounds
      ? entity.getHitboxBounds()
      : {
          x: entity.position.x,
          y: entity.position.y,
          width: entity.width,
          height: entity.height,
        };

    return (
      entityBounds.x < rect.x + rect.width &&
      entityBounds.x + entityBounds.width > rect.x &&
      entityBounds.y < rect.y + rect.height &&
      entityBounds.y + entityBounds.height > rect.y
    );
  }
}
