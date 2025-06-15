import { Boss } from "../../entities/Boss.js";
import { Vec } from "../../../utils/Vec.js";
import { Projectile } from "../../entities/Projectile.js";
import { Turret } from "../floor2/Turret.js";
import { Generator } from "./Generator.js";

export class MechaBoss extends Boss {
  constructor(position) {
    const width = 64;
    const height = 64;
    const maxHp = 1200;
    const color = "#8a8a8a"; // metallic gray

    // Define attacks by phase
    const attacks = [
      {
        name: "Shield Activation",
        phase: 1,
        cooldown: 15000, // 15s between shield activations
        execute: (self) => {
          // Don't activate shield during initial delay period
          if (self.initialDelay) {
            return;
          }

          console.log("MechaBoss activates shield!");
          self.shieldActive = true;

          // Check if we already have active generators
          const activeGenerators = self.generators.filter(gen => gen.health > 0).length;
          if (activeGenerators < 2) {
            // Only spawn new generators if needed
            self.spawnGenerators();
          } else {
            console.log("Generators already active, not spawning new ones");
          }
        }
      },
      {
        name: "Turret Summon",
        phase: 2,
        cooldown: 10000, // 10s between turret summons
        execute: (self) => {
          // Don't summon turrets during initial delay period
          if (self.initialDelay) {
            return;
          }

          console.log("MechaBoss summons twin turrets!");

          // Only summon if we haven't reached the turret limit
          if (self.turrets.length < self.maxTurrets) {
            self.spawnTurrets();
          } else {
            console.log("MechaBoss already has maximum turrets");
          }
        }
      },
      {
        name: "Spiral Blast",
        phase: 3,
        cooldown: 12000, // 12s between spiral attacks
        execute: (self) => {
          // Don't fire during initial delay period
          if (self.initialDelay) {
            return;
          }

          console.log("MechaBoss charges spiral blast attack!");

          // Start spiral attack sequence
          self.isFiringSpiralBlast = true;
          self.spiralBlastTime = 0;
          self.spiralBlastDuration = 8000; // 8 seconds of spiral projectiles
          self.spiralProjectiles = [];
          self.spiralAngle = 0;
          self.spiralSpeed = 0.2; // Rotation speed
          self.projectileSpeed = 300; // Projectile speed
          self.lastSpiralFireTime = 0;
          self.spiralFireInterval = 100; // Fire every 100ms

          console.log("Spiral blast attack initialized");
        }
      }
    ];

    super(position, width, height, color, maxHp, attacks, "mecha boss");
    this.displayName = "Mecha Boss";

    // Shield properties
    this.shieldActive = false;
    this.generators = [];
    this.generatorDistance = 150; // Distance from boss

    // Turret properties
    this.turrets = [];
    this.maxTurrets = 2; // Maximum 2 active turrets at once

    // Spiral blast properties
    this.isFiringSpiralBlast = false;
    this.spiralBlastTime = 0;
    this.spiralBlastDuration = 8000; // 8 seconds
    this.spiralProjectiles = [];
    this.spiralAngle = 0;
    this.spiralSpeed = 0.2;
    this.projectileSpeed = 300;
    this.projectileDamage = 30;
    this.lastSpiralFireTime = 0;
    this.spiralFireInterval = 100; // Fire every 100ms
    this.projectileLifetime = 10000; // 10 seconds max lifetime for projectiles
  }

  update(deltaTime) {
    super.update(deltaTime);

    // Update shield status based on generators
    if (this.generators && this.generators.length > 0) {
      // Count active generators
      const activeGenerators = this.generators.filter(gen => gen.health > 0).length;

      // Disable shield if no generators are active
      if (activeGenerators === 0) {
        this.shieldActive = false;
      }
    }

    // Update turrets
    if (this.turrets.length > 0) {
      // Filter destroyed turrets
      this.turrets = this.turrets.filter(turret => turret.health > 0);
    }

    // Always update projectiles, even when not firing
    if (this.spiralProjectiles && this.spiralProjectiles.length > 0) {
      this.updateProjectiles(deltaTime);
    }

    // Update spiral blast attack
    if (this.isFiringSpiralBlast) {
      this.spiralBlastTime += deltaTime;

      // Fire projectiles in spiral pattern
      this.lastSpiralFireTime += deltaTime;
      if (this.lastSpiralFireTime >= this.spiralFireInterval) {
        // Fire a new projectile
        this.fireProjectileInSpiral();
        this.lastSpiralFireTime = 0;

        // Update spiral angle
        this.spiralAngle += this.spiralSpeed;
      }

      // End spiral attack after duration
      if (this.spiralBlastTime >= this.spiralBlastDuration) {
        this.isFiringSpiralBlast = false;
        console.log("Spiral blast attack ends");
      }
    }

    // Chase player when not firing spiral blast
    if (!this.isFiringSpiralBlast && window.game && window.game.player) {
      const player = window.game.player;
      const moveSpeed = 0.25; // Movement speed

      // Calculate direction toward player
      const dx = player.position.x - this.position.x;
      const dy = player.position.y - this.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Only move if player is at a certain distance
      if (distance > 120) {
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
  }

  // Update all projectiles
  updateProjectiles(deltaTime) {
    for (let i = this.spiralProjectiles.length - 1; i >= 0; i--) {
      const proj = this.spiralProjectiles[i];

      // Update position
      proj.x += proj.vx * deltaTime / 1000;
      proj.y += proj.vy * deltaTime / 1000;

      // Check if out of bounds
      if (proj.x < 0 || proj.x > 1000 || proj.y < 0 || proj.y > 1000) {
        this.spiralProjectiles.splice(i, 1);
        continue;
      }

      // Check if projectile has exceeded its lifetime
      if (Date.now() - proj.creationTime > proj.lifetime) {
        this.spiralProjectiles.splice(i, 1);
        continue;
      }

      // Check collision with player
      if (window.game && window.game.player) {
        const player = window.game.player;
        const playerHitbox = player.getHitboxBounds();

        const projHitbox = {
          x: proj.x - proj.radius,
          y: proj.y - proj.radius,
          width: proj.radius * 2,
          height: proj.radius * 2
        };

        if (this.checkCollision(playerHitbox, projHitbox)) {
          // Apply damage to player
          player.takeDamage(this.projectileDamage);
          console.log(`Spiral projectile hit player for ${this.projectileDamage} damage`);

          // Remove projectile
          this.spiralProjectiles.splice(i, 1);
        }
      }
    }
  }

  // Fire a projectile in the current spiral angle
  fireProjectileInSpiral() {
    // Calculate direction based on current spiral angle
    const dirX = Math.cos(this.spiralAngle);
    const dirY = Math.sin(this.spiralAngle);

    // Create projectile at boss center
    const centerX = this.position.x + this.width / 2;
    const centerY = this.position.y + this.height / 2;

    // Create projectile
    const projectile = {
      x: centerX,
      y: centerY,
      vx: dirX * this.projectileSpeed,
      vy: dirY * this.projectileSpeed,
      radius: 8,
      color: "#ff0000",
      creationTime: Date.now(),
      lifetime: this.projectileLifetime
    };

    // Add to projectiles array
    this.spiralProjectiles.push(projectile);
  }

  // Override takeDamage method to handle shield
  takeDamage(amount) {
    // If shield is active, block damage
    if (this.shieldActive) {
      console.log("MechaBoss shield absorbs damage!");
      return;
    }

    // Otherwise take normal damage
    super.takeDamage(amount);
  }

  // Spawn generator objects
  spawnGenerators() {
    // Clear existing generators array if needed
    if (this.generators.length > 0) {
      // Remove any dead generators from the array
      this.generators = this.generators.filter(gen => gen.health > 0);
    }

    // Only create new generators if we need them
    const neededGenerators = 2 - this.generators.length;

    if (neededGenerators <= 0) {
      console.log("No new generators needed");
      return;
    }

    console.log(`Spawning ${neededGenerators} new generators`);

    // Create generators on opposite sides
    for (let i = 0; i < neededGenerators; i++) {
      const angle = Math.PI * i; // 0 and PI radians (left and right)
      const spawnPos = new Vec(
        this.position.x + Math.cos(angle) * this.generatorDistance,
        this.position.y + Math.sin(angle) * this.generatorDistance
      );

      // Use the Generator class
      const generator = new Generator(spawnPos);
      generator.setCurrentRoom(this.currentRoom);
      generator.parent = this; // Set reference to parent boss

      // Force generator to be visible and active
      generator.active = true;
      generator.health = generator.maxHealth;

      // Add to room enemies and track in boss
      if (this.currentRoom) {
        this.currentRoom.objects.enemies.push(generator);
        console.log(`Generator added to room at position (${Math.round(spawnPos.x)}, ${Math.round(spawnPos.y)})`);
      } else {
        console.warn("No current room available for generator");
      }

      this.generators.push(generator);
    }

    console.log(`MechaBoss now has ${this.generators.length} shield generators`);
  }

  // Spawn turret objects
  spawnTurrets() {
    // Create two turrets on opposite sides
    for (let i = 0; i < 2; i++) {
      const angle = Math.PI / 2 + Math.PI * i; // PI/2 and 3*PI/2 radians (top and bottom)
      const distance = 120; // Distance from boss
      const spawnPos = new Vec(
        this.position.x + Math.cos(angle) * distance,
        this.position.y + Math.sin(angle) * distance
      );

      // Use the existing Turret class
      const turret = new Turret(spawnPos);
      turret.setCurrentRoom(this.currentRoom);

      // Add to room enemies and track in boss
      if (this.currentRoom) {
        this.currentRoom.objects.enemies.push(turret);
      }
      this.turrets.push(turret);
    }

    console.log("MechaBoss spawned twin turrets");
  }

  draw(ctx) {
    // Draw shield if active
    if (this.shieldActive) {
      ctx.beginPath();
      ctx.arc(
        this.position.x + this.width / 2,
        this.position.y + this.height / 2,
        this.width * 0.8,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = "rgba(0, 150, 255, 0.3)";
      ctx.fill();
      ctx.strokeStyle = "rgba(0, 200, 255, 0.8)";
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Draw the boss
    super.draw(ctx);

    // Draw connection beams to active generators
    if (this.generators && this.generators.length > 0) {
      this.generators.forEach(generator => {
        if (generator.health > 0) {
          // Draw connection beam to boss
          ctx.beginPath();
          ctx.moveTo(
            generator.position.x + generator.width / 2,
            generator.position.y + generator.height / 2
          );
          ctx.lineTo(
            this.position.x + this.width / 2,
            this.position.y + this.height / 2
          );
          ctx.strokeStyle = "rgba(0, 255, 255, 0.5)";
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      });
    }

    // Draw spiral projectiles
    if (this.spiralProjectiles && this.spiralProjectiles.length > 0) {
      this.spiralProjectiles.forEach(proj => {
        // Draw projectile
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
        ctx.fillStyle = proj.color;
        ctx.fill();

        // Draw glow effect
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, proj.radius * 1.5, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 255, 0, 0.5)";
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    }
  }

  // Helper function to check collisions
  checkCollision(rect1, rect2) {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }

  // Method to get the boss hitbox
  getHitboxBounds() {
    return {
      x: this.position.x,
      y: this.position.y,
      width: this.width,
      height: this.height
    };
  }
}