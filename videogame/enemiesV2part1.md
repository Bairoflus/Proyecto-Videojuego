## File Structure and Organization

### Directory Structure

The enemy system is organized across several directories:

```
videogame/src/
├── classes/
│   ├── entities/                      # Base entity classes
│   │   ├── Enemy.js                   # Base enemy class
│   │   ├── MeleeEnemy.js              # Melee enemy base class
│   │   ├── RangedEnemy.js             # Ranged enemy base class
│   │   ├── Boss.js                    # Boss base class
│   │   ├── Projectile.js              # Projectile system
│   │   └── AnimatedObject.js          # Animation system base
│   └── enemies/                       # Specific enemy implementations
│       └── floor1/                    # Floor 1 enemy types
│           ├── GoblinDagger.js        # Melee goblin (common)
│           ├── SwordGoblin.js         # Enhanced melee goblin
│           ├── GoblinArcher.js        # Ranged goblin (archer)
│           ├── MageGoblin.js          # Ranged goblin (magic)
│           ├── GreatBowGoblin.js      # Enhanced ranged goblin
│           └── DragonBoss.js          # Floor 1 boss
├── assets/
│   └── sprites/
│       └── enemies/                   # Enemy sprite assets
│           ├── floor1/                # Floor 1 sprites
│           │   ├── dagger_goblin/     # GoblinDagger sprites
│           │   │   ├── walk.png       # Walking animation
│           │   │   └── slash.png      # Attack animation
│           │   ├── sword_goblin/      # SwordGoblin sprites
│           │   │   ├── walk.png       # Walking animation
│           │   │   └── slash.png      # Attack animation
│           │   ├── bow_goblin/        # GoblinArcher sprites
│           │   │   ├── walk.png       # Walking animation
│           │   │   └── shoot.png      # Shooting animation
│           │   ├── mage_goblin/       # MageGoblin sprites
│           │   │   ├── walk.png       # Walking animation
│           │   │   └── spellcast.png  # Casting animation
│           │   └── great_bow_goblin/  # GreatBowGoblin sprites
│           │       ├── walk.png       # Walking animation
│           │       └── shoot.png      # Shooting animation
│           ├── floor2/                # Floor 2 sprites
│           │   ├── bandit/            # Bandit enemy sprites
│           │   ├── cop1/              # Police enemy type 1
│           │   ├── cop2/              # Police enemy type 2
│           │   └── slingshot_sniper/  # Sniper enemy sprites
│           └── floor3/                # Floor 3 sprites (future expansion)
├── constants/
│   └── gameConstants.js               # Enemy configuration constants
└── utils/
    └── enemyMapping.js                # Frontend-backend ID mapping
```

### Sprite Animation Structure

Each enemy sprite follows a standardized layout:

#### Walking Animations (9 columns)
- **Row 0**: Up direction (frames 0-8)
- **Row 1**: Left direction (frames 9-17)  
- **Row 2**: Down direction (frames 18-26)
- **Row 3**: Right direction (frames 27-35)

#### Attack Animations
**Melee Enemies (6 columns):**
- **Row 0**: Up attack (frames 0-5)
- **Row 1**: Left attack (frames 6-11)
- **Row 2**: Down attack (frames 12-17) 
- **Row 3**: Right attack (frames 18-23)

**Ranged Enemies - Shooting (13 columns):**
- **Row 0**: Up shoot (frames 0-12)
- **Row 1**: Left shoot (frames 13-25)
- **Row 2**: Down shoot (frames 26-38)
- **Row 3**: Right shoot (frames 39-51)

**Mage Enemies - Spellcasting (7 columns):**
- **Row 0**: Up cast (frames 0-6)
- **Row 1**: Left cast (frames 7-13)
- **Row 2**: Down cast (frames 14-20)
- **Row 3**: Right cast (frames 21-27)

### Sprite Path Configuration

Enemy sprite paths are configured in their respective class constructors:

```javascript
// Example from GoblinDagger.js
this.walkSpritePath = "/assets/sprites/enemies/floor1/dagger_goblin/walk.png";
this.attackSpritePath = "/assets/sprites/enemies/floor1/dagger_goblin/slash.png";

// Example from GoblinArcher.js  
this.walkSpritePath = "/assets/sprites/enemies/floor1/bow_goblin/walk.png";
this.shootSpritePath = "/assets/sprites/enemies/floor1/bow_goblin/shoot.png";

// Example from MageGoblin.js
this.walkSpritePath = "/assets/sprites/enemies/floor1/mage_goblin/walk.png";
this.spellcastSpritePath = "/assets/sprites/enemies/floor1/mage_goblin/spellcast.png";
``` 

## Complete Enemy Class Implementations

### Base Classes

#### Enemy.js - Foundation Class
```javascript
/**
 * Base enemy class
 * Provides common functionality for all enemy types including movement,
 * health management, collision detection, and basic AI behavior
 */
import { AnimatedObject } from "./AnimatedObject.js";
import { Vec } from "../../utils/Vec.js";
import { variables } from "../../config.js";
import { log } from "../../utils/Logger.js";
import { registerEnemyKill } from "../../utils/api.js";
import { enemyMappingService } from "../../utils/enemyMapping.js";

export class Enemy extends AnimatedObject {
  constructor(
    position,
    width,
    height,
    color,
    sheetCols,
    type,
    movementSpeed,
    baseDamage,
    maxHealth,
    range = 50,
    projectileRange = 200,
    enemyTypeName = null
  ) {
    super(position, width, height, color, "enemy", sheetCols);

    // Core stats
    this.maxHealth = maxHealth;
    this.health = this.maxHealth;
    this.movementSpeed = movementSpeed;
    this.baseDamage = baseDamage;
    this.attackRange = range;
    this.attackCooldown = 0;
    this.attackDuration = 500;

    // Ranged combat properties
    this.range = range;
    this.projectileRange = projectileRange;

    // State management
    this.state = "idle"; // idle, chasing, attacking, dead
    this.target = null;
    this.velocity = new Vec(0, 0);
    this.type = type;
    this.enemyTypeName = enemyTypeName || type;
    this.currentDirection = "down";
    this.isAttacking = false;
    this.currentRoom = null;
  }

  setCurrentRoom(room) {
    this.currentRoom = room;
  }

  takeDamage(amount) {
    if (this.state === "dead") return;

    this.health = Math.max(0, this.health - amount);
    
    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    this.state = "dead";
    
    // Global kill tracking
    if (window.game && typeof window.game.trackKill === 'function') {
      window.game.trackKill();
    }

    // Register kill with backend (non-blocking)
    this.registerKill().catch(error => {
      console.error('Failed to register enemy kill:', error);
    });

    // Update room state
    if (this.currentRoom) {
      if (window.game && window.game.floorGenerator) {
        window.game.floorGenerator.updateRoomState(undefined, this.currentRoom);
      }
    }
  }

  async registerKill() {
    if (!window.game || !window.game.currentRunId || !this.currentRoom) {
      console.warn('Cannot register enemy kill: missing game context');
      return;
    }

    // Get enemy ID from mapping service
    const enemyId = enemyMappingService.getEnemyId(this.enemyTypeName);

    const killData = {
      userId: window.game.userId,
      enemyId: enemyId,
      roomId: this.currentRoom.roomId || 1
    };

    try {
      const result = await registerEnemyKill(window.game.currentRunId, killData);
      console.log('Enemy kill registered successfully:', result);
    } catch (error) {
      console.error('Failed to register enemy kill:', error);
    }
  }

  moveTo(targetPosition) {
    if (this.state === "dead") return;

    const enemyHitbox = this.getHitboxBounds();
    const enemyCenter = new Vec(
      enemyHitbox.x + enemyHitbox.width / 2,
      enemyHitbox.y + enemyHitbox.height / 2
    );

    const direction = targetPosition.minus(enemyCenter);
    const distance = direction.magnitude();

    if (distance > this.attackRange) {
      this.state = "chasing";
      this.velocity = direction.normalize().times(this.movementSpeed);
      const newPosition = this.position.plus(this.velocity);
      this.moveToPosition(newPosition);
    } else {
      this.state = "attacking";
      this.velocity = new Vec(0, 0);
    }
  }

  attack(target) {
    if (this.state === "dead" || this.attackCooldown > 0) return;

    const targetHitbox = target.getHitboxBounds();
    const targetCenter = new Vec(
      targetHitbox.x + targetHitbox.width / 2,
      targetHitbox.y + targetHitbox.height / 2
    );

    const distance = targetCenter.minus(this.position).magnitude();
    if (distance <= this.attackRange) {
      this.isAttacking = true;
      this.attackCooldown = this.attackDuration;
      target.takeDamage(this.baseDamage);
    }
  }

  update(deltaTime) {
    if (this.state === "dead") {
      this.updateProjectiles(deltaTime, null);
      return;
    }

    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime;
    }

    this.updateProjectiles(deltaTime, window.game?.player);
    this.updateAnimation();
    this.constrainToCanvas();
  }

  updateAnimation() {
    // To be implemented by specific enemy types
  }

  // Projectile system methods
  initializeProjectiles() {
    if (!this.projectiles) {
      this.projectiles = [];
      this.projectileSpeed = this.projectileSpeed || 300;
    }
  }

  fireProjectile(target) {
    if (this.state === "dead" || !target) return;

    this.initializeProjectiles();

    const targetHitbox = target.getHitboxBounds();
    const targetCenter = new Vec(
      targetHitbox.x + targetHitbox.width / 2,
      targetHitbox.y + targetHitbox.height / 2
    );

    const startPosition = new Vec(
      this.position.x + this.width / 2,
      this.position.y + this.height / 2
    );

    const direction = targetCenter.minus(startPosition).normalize();

    const projectile = {
      position: new Vec(startPosition.x, startPosition.y),
      velocity: direction.times(this.projectileSpeed),
      damage: this.baseDamage,
      radius: 5,
      isActive: true,
      lifetime: 5000,
      timeAlive: 0
    };

    this.projectiles.push(projectile);
  }

  updateProjectiles(deltaTime, player) {
    if (!this.projectiles) return;

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      
      if (!projectile.isActive) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Update position
      projectile.position = projectile.position.plus(
        projectile.velocity.times(deltaTime / 1000)
      );

      // Update lifetime
      projectile.timeAlive += deltaTime;
      if (projectile.timeAlive >= projectile.lifetime) {
        projectile.isActive = false;
        continue;
      }

      // Check bounds
      if (
        projectile.position.x < 0 ||
        projectile.position.x > variables.canvasWidth ||
        projectile.position.y < 0 ||
        projectile.position.y > variables.canvasHeight
      ) {
        projectile.isActive = false;
        continue;
      }

      // Check wall collision
      if (this.currentRoom) {
        const tempProjectile = {
          position: projectile.position,
          width: projectile.radius * 2,
          height: projectile.radius * 2,
          getHitboxBounds: () => ({
            x: projectile.position.x - projectile.radius,
            y: projectile.position.y - projectile.radius,
            width: projectile.radius * 2,
            height: projectile.radius * 2
          })
        };

        if (this.currentRoom.checkWallCollision(tempProjectile)) {
          projectile.isActive = false;
          continue;
        }
      }

      // Check player collision
      if (player && player.health > 0) {
        const playerHitbox = player.getHitboxBounds();
        const projectileHitbox = {
          x: projectile.position.x - projectile.radius,
          y: projectile.position.y - projectile.radius,
          width: projectile.radius * 2,
          height: projectile.radius * 2
        };

        if (this.checkProjectilePlayerCollision(projectileHitbox, playerHitbox)) {
          player.takeDamage(projectile.damage);
          projectile.isActive = false;
        }
      }
    }

    this.projectiles = this.projectiles.filter(p => p.isActive);
  }

  checkProjectilePlayerCollision(projectileHitbox, playerHitbox) {
    return (
      projectileHitbox.x < playerHitbox.x + playerHitbox.width &&
      projectileHitbox.x + projectileHitbox.width > playerHitbox.x &&
      projectileHitbox.y < playerHitbox.y + playerHitbox.height &&
      projectileHitbox.y + projectileHitbox.height > playerHitbox.y
    );
  }
}
```

#### MeleeEnemy.js - Melee Combat Base
```javascript
/**
 * Base class for melee enemy types
 * Extends Enemy with close-range combat behavior
 */
import { Enemy } from "./Enemy.js";
import { Vec } from "../../utils/Vec.js";
import { boxOverlap } from "../../draw.js";

export class MeleeEnemy extends Enemy {
  constructor(
    position,
    width,
    height,
    color,
    sheetCols,
    type,
    movementSpeed,
    baseDamage,
    maxHealth,
    range = 50,
    enemyTypeName = null
  ) {
    super(
      position,
      width,
      height,
      color,
      sheetCols,
      type,
      movementSpeed,
      baseDamage,
      maxHealth,
      range,
      0, // No projectile range for melee
      enemyTypeName
    );

    this.attackRange = range;
  }

  moveTo(player) {
    if (this.state === "dead") return;

    if (boxOverlap(this, player)) {
      this.state = "attacking";
      this.velocity = new Vec(0, 0);
      return;
    }

    const enemyHitbox = this.getHitboxBounds();
    const enemyCenter = new Vec(
      enemyHitbox.x + enemyHitbox.width / 2,
      enemyHitbox.y + enemyHitbox.height / 2
    );

    const playerHitbox = player.getHitboxBounds();
    const playerCenter = new Vec(
      playerHitbox.x + playerHitbox.width / 2,
      playerHitbox.y + playerHitbox.height / 2
    );

    const direction = playerCenter.minus(enemyCenter);
    
    this.state = "chasing";
    this.velocity = direction.normalize().times(this.movementSpeed);

    const newPosition = this.position.plus(this.velocity);
    this.moveToPosition(newPosition);
  }
}
```

#### RangedEnemy.js - Ranged Combat Base
```javascript
/**
 * Base class for ranged enemy types
 * Extends Enemy with projectile attack capabilities and retreat behavior
 */
import { Enemy } from "./Enemy.js";
import { Vec } from "../../utils/Vec.js";
import { Projectile } from "./Projectile.js";

export class RangedEnemy extends Enemy {
  constructor(
    position,
    width,
    height,
    color,
    sheetCols,
    type,
    movementSpeed,
    baseDamage,
    maxHealth,
    projectileType = "arrow",
    range = 150,
    projectileRange = 300,
    projectileSpeed = 200,
    enemyTypeName = null
  ) {
    super(
      position,
      width,
      height,
      color,
      sheetCols,
      type,
      movementSpeed,
      baseDamage,
      maxHealth,
      range,
      projectileRange,
      enemyTypeName
    );

    this.attackRange = range;
    this.retreatDistance = Math.max(range * 0.5, 80);
    this.projectileSpeed = projectileSpeed;
    this.projectileType = projectileType;
    this.projectiles = [];
  }

  moveTo(targetPosition) {
    if (this.state === "dead") return;

    const direction = targetPosition.minus(this.position);
    const distance = direction.magnitude();

    if (distance < this.retreatDistance) {
      this.state = "retreating";
      const retreatDirection = this.position.minus(targetPosition);
      this.velocity = retreatDirection.normalize().times(this.movementSpeed);
      const newPosition = this.position.plus(this.velocity);
      this.moveToPosition(newPosition);
    } else if (distance > this.attackRange) {
      this.state = "chasing";
      this.velocity = direction.normalize().times(this.movementSpeed);
      const newPosition = this.position.plus(this.velocity);
      this.moveToPosition(newPosition);
    } else {
      this.state = "attacking";
      this.velocity = new Vec(0, 0);
    }
  }

  update(deltaTime, player) {
    this.updateProjectiles(deltaTime, player);
    if (this.state === "dead") return;
    super.update(deltaTime);
  }

  updateProjectiles(deltaTime, player) {
    this.projectiles = this.projectiles.filter((projectile) => {
      if (!projectile.currentRoom && this.currentRoom) {
        projectile.setCurrentRoom(this.currentRoom);
      }
      projectile.update(deltaTime, player ? [player] : []);
      return projectile.isActive;
    });
  }

  draw(ctx) {
    this.projectiles.forEach((projectile) => projectile.draw(ctx));
    if (this.state === "dead") return;
    super.draw(ctx);
  }

  fireProjectile(target) {
    if (this.state === "dead") return;

    const targetHitbox = target.getHitboxBounds();
    const targetCenter = new Vec(
      targetHitbox.x + targetHitbox.width / 2,
      targetHitbox.y + targetHitbox.height / 2
    );

    const projectile = new Projectile(
      this.position,
      targetCenter,
      this.projectileSpeed,
      this.baseDamage,
      this.projectileType
    );

    projectile.maxTravelDistance = this.projectileRange;
    projectile.initialPosition = new Vec(this.position.x, this.position.y);
    projectile.setCurrentRoom(this.currentRoom);

    this.projectiles.push(projectile);
  }
} 
```

### Specific Enemy Implementations

#### GoblinDagger.js - Basic Melee Enemy
```javascript
/**
 * Goblin Dagger enemy class
 * Melee enemy type that attacks at close range
 * Found commonly on floor 1
 */
import { MeleeEnemy } from "../../entities/MeleeEnemy.js";
import { Vec } from "../../../utils/Vec.js";
import { ENEMY_CONSTANTS } from "../../../constants/gameConstants.js";
import { variables } from "../../../config.js";
import { boxOverlap } from "../../../draw.js";

export class GoblinDagger extends MeleeEnemy {
  constructor(position) {
    const config = ENEMY_CONSTANTS.GOBLIN_DAGGER;

    super(
      position,
      config.size.width,
      config.size.height,
      "red",
      9, // sheetCols for walk sprites
      "goblin_dagger",
      config.speed,
      config.damage,
      config.health,
      config.attackRange,
      "goblin" // enemyTypeName for backend mapping
    );

    this.attackDuration = config.attackCooldown;
    this.isAttacking = false;
    this.currentDirection = "down";

    // Sprite configuration
    this.spriteScaling = {
      walk: 1.0,
      attack: 1.0,
    };

    this.walkSpritePath = "/assets/sprites/enemies/floor1/dagger_goblin/walk.png";
    this.attackSpritePath = "/assets/sprites/enemies/floor1/dagger_goblin/slash.png";

    this.setSprite(this.walkSpritePath);
    const initialWalkFrames = this.getWalkFrames(this.currentDirection);
    this.setAnimation(initialWalkFrames[0], initialWalkFrames[1], true, 100);
  }

  moveTo(player) {
    if (this.state === "dead") return;

    if (!boxOverlap(this, player)) {
      const previousState = this.state;
      const previousDirection = this.currentDirection;

      this.state = "chasing";

      const enemyHitbox = this.getHitboxBounds();
      const playerHitbox = player.getHitboxBounds();
      const enemyCenter = new Vec(
        enemyHitbox.x + enemyHitbox.width / 2,
        enemyHitbox.y + enemyHitbox.height / 2
      );
      const playerCenter = new Vec(
        playerHitbox.x + playerHitbox.width / 2,
        playerHitbox.y + playerHitbox.height / 2
      );

      const direction = playerCenter.minus(enemyCenter);
      this.velocity = direction.normalize().times(this.movementSpeed);

      this.updateDirectionFromMovement();

      const newPosition = this.position.plus(this.velocity);
      this.moveToPosition(newPosition);

      if (previousState !== this.state || previousDirection !== this.currentDirection) {
        this.updateAnimation();
      }
    } else {
      this.velocity = new Vec(0, 0);
      if (this.state !== "attacking") {
        this.state = "attacking";
      }
    }
  }

  updateDirectionFromMovement() {
    const v = this.velocity;
    if (v.x !== 0 || v.y !== 0) {
      const newDirection = Math.abs(v.y) > Math.abs(v.x)
        ? v.y > 0 ? "down" : "up"
        : v.x > 0 ? "right" : "left";

      if (newDirection !== this.currentDirection) {
        this.currentDirection = newDirection;
        this.updateAnimation();
      }
    }
  }

  attack(target) {
    if (this.state === "dead" || this.isAttacking) return;

    this.state = "attacking";
    this.isAttacking = true;
    this.velocity = new Vec(0, 0);

    target.takeDamage(this.baseDamage);
    this.updateAnimation();
  }

  getAttackFrames(direction) {
    const frameRanges = {
      up: [0, 5],
      left: [6, 11],
      down: [12, 17],
      right: [18, 23],
    };
    return frameRanges[direction] || frameRanges.down;
  }

  getWalkFrames(direction) {
    const frameRanges = {
      up: [0, 8],
      left: [9, 17],
      down: [18, 26],
      right: [27, 35],
    };
    return frameRanges[direction] || frameRanges.down;
  }

  updateAnimation() {
    switch (this.state) {
      case "chasing":
      case "idle":
        this.sheetCols = 9;
        this.setSprite(this.walkSpritePath);
        const walkFrames = this.getWalkFrames(this.currentDirection);
        this.setAnimation(walkFrames[0], walkFrames[1], true, 100);
        break;

      case "attacking":
        this.sheetCols = 6;
        this.setSprite(this.attackSpritePath);
        const attackFrames = this.getAttackFrames(this.currentDirection);
        this.setAnimation(attackFrames[0], attackFrames[1], false, 100);
        break;

      default:
        this.sheetCols = 9;
        this.setSprite(this.walkSpritePath);
        const defaultFrames = this.getWalkFrames(this.currentDirection);
        this.setAnimation(defaultFrames[0], defaultFrames[1], true, 100);
    }
  }

  update(deltaTime) {
    super.update(deltaTime);

    if (this.isAttacking && this.frame >= this.maxFrame && this.totalTime >= this.frameDuration) {
      this.isAttacking = false;
      this.state = "chasing";
      this.updateAnimation();
    }
  }
}
```

#### SwordGoblin.js - Enhanced Melee Enemy
```javascript
/**
 * Sword Goblin enemy class
 * Melee enemy type with larger attack range than dagger goblins
 */
import { MeleeEnemy } from "../../entities/MeleeEnemy.js";
import { Vec } from "../../../utils/Vec.js";
import { ENEMY_CONSTANTS } from "../../../constants/gameConstants.js";
import { variables } from "../../../config.js";
import { boxOverlap } from "../../../draw.js";

export class SwordGoblin extends MeleeEnemy {
  constructor(position) {
    const config = ENEMY_CONSTANTS.SWORD_GOBLIN;

    super(
      position,
      config.size.width,
      config.size.height,
      "red",
      9,
      "sword_goblin",
      config.speed,
      config.damage,
      config.health,
      config.attackRange,
      "goblin"
    );

    this.attackDuration = config.attackCooldown;
    this.isAttacking = false;
    this.currentDirection = "down";

    this.spriteScaling = {
      walk: 1.0,
      attack: 1.0,
    };

    this.walkSpritePath = "/assets/sprites/enemies/floor1/sword_goblin/walk.png";
    this.attackSpritePath = "/assets/sprites/enemies/floor1/sword_goblin/slash.png";

    this.setSprite(this.walkSpritePath);
    const initialWalkFrames = this.getWalkFrames(this.currentDirection);
    this.setAnimation(initialWalkFrames[0], initialWalkFrames[1], true, 100);
  }

  // Similar implementation to GoblinDagger but with larger attack range
  // Full implementation follows same pattern as GoblinDagger
}
```

#### GoblinArcher.js - Ranged Enemy
```javascript
/**
 * Goblin Archer enemy class
 * Ranged enemy type that attacks from distance with projectiles
 */
import { RangedEnemy } from "../../entities/RangedEnemy.js";
import { ENEMY_CONSTANTS } from "../../../constants/gameConstants.js";
import { Vec } from "../../../utils/Vec.js";
import { Projectile } from "../../entities/Projectile.js";

export class GoblinArcher extends RangedEnemy {
  constructor(position) {
    const config = ENEMY_CONSTANTS.GOBLIN_ARCHER;

    super(
      position,
      config.size.width,
      config.size.height,
      "red",
      9,
      "goblin_archer",
      config.speed,
      config.damage,
      config.health,
      "arrow", // projectile type
      config.attackRange || 200,
      config.projectileRange || 300,
      250, // projectileSpeed
      "goblin_archer"
    );

    this.attackRange = config.attackRange;
    this.attackDuration = config.attackCooldown;
    this.retreatDistance = config.retreatDistance;

    this.isAttacking = false;
    this.isShooting = false;
    this.hasCreatedProjectile = false;
    this.attackCooldown = 0;
    this.currentDirection = "down";

    this.spriteScaling = {
      walk: 1.0,
      shoot: 1.0,
    };

    this.walkSpritePath = "/assets/sprites/enemies/floor1/bow_goblin/walk.png";
    this.shootSpritePath = "/assets/sprites/enemies/floor1/bow_goblin/shoot.png";

    this.setSprite(this.walkSpritePath);
    const initialWalkFrames = this.getWalkFrames(this.currentDirection);
    this.setAnimation(initialWalkFrames[0], initialWalkFrames[1], true, 100);
  }

  moveTo(targetPosition) {
    if (this.state === "dead" || this.isShooting) return;

    const enemyHitbox = this.getHitboxBounds();
    const enemyCenter = new Vec(
      enemyHitbox.x + enemyHitbox.width / 2,
      enemyHitbox.y + enemyHitbox.height / 2
    );

    const direction = targetPosition.minus(enemyCenter);
    const distance = direction.magnitude();

    const previousState = this.state;
    const previousDirection = this.currentDirection;

    if (distance < this.retreatDistance) {
      this.state = "retreating";
      const retreatDirection = enemyCenter.minus(targetPosition);
      this.velocity = retreatDirection.normalize().times(this.movementSpeed);
      this.updateDirectionFromMovement();
      const newPosition = this.position.plus(this.velocity);
      this.moveToPosition(newPosition);
    } else if (distance > this.attackRange) {
      this.state = "chasing";
      this.velocity = direction.normalize().times(this.movementSpeed);
      this.updateDirectionFromMovement();
      const newPosition = this.position.plus(this.velocity);
      this.moveToPosition(newPosition);
    } else {
      this.velocity = new Vec(0, 0);
      if (this.state !== "attacking") {
        this.state = "idle";
      }
    }

    if (previousState !== this.state || previousDirection !== this.currentDirection) {
      this.updateAnimation();
    }
  }

  attack(target) {
    if (this.state === "dead" || this.isShooting || this.attackCooldown > 0) return;

    const targetHitbox = target.getHitboxBounds();
    const targetCenter = new Vec(
      targetHitbox.x + targetHitbox.width / 2,
      targetHitbox.y + targetHitbox.height / 2
    );

    const archerHitbox = this.getHitboxBounds();
    const archerCenter = new Vec(
      archerHitbox.x + archerHitbox.width / 2,
      archerHitbox.y + archerHitbox.height / 2
    );

    const aimDirection = targetCenter.minus(archerCenter);
    const distance = aimDirection.magnitude();

    if (distance <= this.attackRange) {
      this.state = "attacking";
      this.isShooting = true;
      this.hasCreatedProjectile = false;
      this.isAttacking = true;
      this.attackCooldown = this.attackDuration;
      this.velocity = new Vec(0, 0);

      this.updateDirectionFromAiming(aimDirection);
      this.updateAnimation();
      this.currentTarget = target;
    }
  }

  fireProjectile(target) {
    if (this.state === "dead") return;

    const targetHitbox = target.getHitboxBounds();
    const targetCenter = new Vec(
      targetHitbox.x + targetHitbox.width / 2,
      targetHitbox.y + targetHitbox.height / 2
    );

    const archerHitbox = this.getHitboxBounds();
    const archerCenter = new Vec(
      archerHitbox.x + archerHitbox.width / 2,
      archerHitbox.y + archerHitbox.height / 2
    );

    const projectile = new Projectile(
      archerCenter,
      targetCenter,
      this.projectileSpeed,
      this.baseDamage,
      this.projectileType
    );

    projectile.maxTravelDistance = this.projectileRange;
    projectile.initialPosition = new Vec(archerCenter.x, archerCenter.y);
    projectile.setCurrentRoom(this.currentRoom);

    this.projectiles.push(projectile);
  }

  getShootFrames(direction) {
    const frameRanges = {
      up: [0, 12],
      left: [13, 25],
      down: [26, 38],
      right: [39, 51],
    };
    return frameRanges[direction] || frameRanges.down;
  }

  getWalkFrames(direction) {
    const frameRanges = {
      up: [0, 8],
      left: [9, 17],
      down: [18, 26],
      right: [27, 35],
    };
    return frameRanges[direction] || frameRanges.down;
  }

  updateAnimation() {
    switch (this.state) {
      case "chasing":
      case "retreating":
      case "idle":
        this.sheetCols = 9;
        this.setSprite(this.walkSpritePath);
        const walkFrames = this.getWalkFrames(this.currentDirection);
        this.setAnimation(walkFrames[0], walkFrames[1], true, 100);
        break;

      case "attacking":
        this.sheetCols = 13;
        this.setSprite(this.shootSpritePath);
        const shootFrames = this.getShootFrames(this.currentDirection);
        this.setAnimation(shootFrames[0], shootFrames[1], false, 100);
        break;
    }
  }

  update(deltaTime, player) {
    super.update(deltaTime, player);

    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime;
    }

    if (this.isShooting && this.currentTarget) {
      const shootFrames = this.getShootFrames(this.currentDirection);
      const minFrame = shootFrames[0];
      const maxFrame = shootFrames[1];
      const middleFrame = Math.floor((minFrame + maxFrame) / 2);

      if (this.frame === middleFrame && !this.hasCreatedProjectile) {
        this.fireProjectile(this.currentTarget);
        this.hasCreatedProjectile = true;
      }

      if (this.frame >= maxFrame) {
        this.isShooting = false;
        this.isAttacking = false;
        this.hasCreatedProjectile = false;
        this.currentTarget = null;
        this.state = "idle";
        this.updateAnimation();
      }
    }
  }
}
```

### Enemy Configuration Constants

#### ENEMY_CONSTANTS from gameConstants.js
```javascript
export const ENEMY_CONSTANTS = {
  // Goblin Dagger - Basic melee
  GOBLIN_DAGGER: {
    size: { width: 48, height: 48 },
    health: 20,
    damage: 10,
    speed: PLAYER_CONSTANTS.BASE_SPEED * 2,
    attackRange: 32,
    attackCooldown: 1000,
  },

  // Sword Goblin - Enhanced melee
  SWORD_GOBLIN: {
    size: { width: 48, height: 48 },
    health: 25,
    damage: 12,
    speed: PLAYER_CONSTANTS.BASE_SPEED * 2,
    attackRange: 60, // Larger than dagger goblin
    attackCooldown: 1000,
  },

  // Goblin Archer - Basic ranged
  GOBLIN_ARCHER: {
    size: { width: 48, height: 48 },
    health: 30,
    damage: 15,
    speed: PLAYER_CONSTANTS.BASE_SPEED * 1.5,
    attackRange: 200,
    attackCooldown: 2000,
    projectileSpeed: 300,
    retreatDistance: 80,
  },

  // Mage Goblin - Magic caster
  MAGE_GOBLIN: {
    size: { width: 48, height: 48 },
    health: 25,
    damage: 25,
    speed: PLAYER_CONSTANTS.BASE_SPEED * 1.2,
    attackRange: 180,
    attackCooldown: 3000,
    projectileSpeed: 250,
    retreatDistance: 100,
  },

  // Great Bow Goblin - Enhanced ranged
  GREAT_BOW_GOBLIN: {
    size: { width: 48, height: 48 },
    health: 30,
    damage: 30, // Double archer damage
    speed: PLAYER_CONSTANTS.BASE_SPEED * 3.0, // Double archer speed
    attackRange: 200,
    attackCooldown: 2000,
    projectileSpeed: 300,
    retreatDistance: 80,
    projectileRange: 300,
  },
};
```

### Projectile Type Configuration

```javascript
export const PROJECTILE_TYPES = {
  arrow: {
    sprite: "/assets/sprites/projectiles/arrow.png",
    width: 64,
    height: 64,
    damageBoxColor: "yellow",
    damageBoxWidth: 48,
    damageBoxHeight: 8,
    scale: 1.0,
    radius: 6,
  },
  magic_bolt: {
    sprite: "/assets/sprites/projectiles/magic_bolt.png",
    width: 16,
    height: 16,
    damageBoxColor: "yellow",
    damageBoxWidth: 14,
    damageBoxHeight: 14,
    scale: 1.0,
    radius: 3,
  },
  fireball: {
    sprite: "/assets/sprites/projectiles/fireball.png",
    width: 24,
    height: 24,
    damageBoxColor: "orange",
    damageBoxWidth: 20,
    damageBoxHeight: 20,
    scale: 1.2,
    radius: 6,
  },
};
```

## Enemy Integration Workflow

### 1. Creating New Enemies

To add a new enemy type:

1. **Define constants** in `gameConstants.js`
2. **Create enemy class** extending MeleeEnemy or RangedEnemy
3. **Add sprite assets** following the directory structure
4. **Update enemy mapping** in `enemyMapping.js`
5. **Add database entry** in enemy data SQL

### 2. Room Integration

Enemies are automatically integrated into rooms through the room generation system:

```javascript
// In Room.js generateEnemies() method
const enemy = new GoblinDagger(position);
enemy.setCurrentRoom(this);
this.objects.enemies.push(enemy);
```

### 3. Combat Integration

The combat system handles:
- **State transitions** (idle → chasing → attacking → dead)
- **Animation synchronization** with combat actions
- **Projectile management** for ranged enemies
- **Collision detection** with players and environment
- **Kill tracking** and backend registration

This comprehensive enemy system provides a scalable foundation for adding new enemy types while maintaining consistent behavior patterns and integration with the game's core systems.