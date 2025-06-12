# 🎯 PRÓXIMOS PASOS - INTEGRACIÓN SISTEMA ENEMIGOS V2

## 📋 PLAN DE IMPLEMENTACIÓN DETALLADO

Esta es la guía completa para integrar el sistema de enemigos V2 manteniendo nuestra estructura actual de base de datos y API. El enfoque es conservador: **solo cambios en frontend**.

---

## 🎯 OBJETIVOS FINALES

- **5 tipos de enemigos** en lugar de 2 actuales
- **Mapeo inteligente:** Melee → 'common', Ranged → 'rare'
- **Cero cambios** en base de datos y API
- **Sprites ya disponibles** según confirmación del usuario

---

## 📅 CRONOGRAMA ESTIMADO

- **Fase 1:** Clases Base - 1 semana (8-12 horas)
- **Fase 2:** Tipos de Enemigos - 1 semana (18-26 horas)  
- **Fase 3:** Testing y Balance - 0.5 semanas (8-12 horas)
- **Total:** 2.5 semanas (34-50 horas)

---

## 🔄 FASE 1: IMPLEMENTAR CLASES BASE

### 1.1 Crear MeleeEnemy.js

**📍 Ubicación:** `videogame/src/classes/entities/MeleeEnemy.js`

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

### 1.2 Crear RangedEnemy.js

**📍 Ubicación:** `videogame/src/classes/entities/RangedEnemy.js`

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

### 1.3 Crear Projectile.js Mejorado

**📍 Ubicación:** `videogame/src/classes/entities/Projectile.js`

```javascript
/**
 * Projectile class for ranged enemy attacks
 * Handles collision detection, movement, and lifecycle
 */
import { Vec } from "../../utils/Vec.js";
import { variables } from "../../config.js";

export class Projectile {
  constructor(startPosition, targetPosition, speed, damage, type = "arrow") {
    this.position = new Vec(startPosition.x, startPosition.y);
    this.initialPosition = new Vec(startPosition.x, startPosition.y);
    
    // Calculate direction
    const direction = targetPosition.minus(startPosition);
    this.velocity = direction.normalize().times(speed);
    
    this.damage = damage;
    this.type = type;
    this.radius = 3;
    this.isActive = true;
    this.maxTravelDistance = 400;
    this.currentRoom = null;
    
    // Visual properties
    this.color = this.getProjectileColor(type);
  }

  getProjectileColor(type) {
    const colors = {
      arrow: "#8B4513",     // Brown
      magic: "#9932CC",     // Purple
      fire: "#FF4500",      // Red-orange
      ice: "#00BFFF"        // Blue
    };
    return colors[type] || colors.arrow;
  }

  setCurrentRoom(room) {
    this.currentRoom = room;
  }

  update(deltaTime, targets = []) {
    if (!this.isActive) return;

    // Update position
    const movement = this.velocity.times(deltaTime / 1000);
    this.position = this.position.plus(movement);

    // Check travel distance
    const distanceTraveled = this.position.minus(this.initialPosition).magnitude();
    if (distanceTraveled >= this.maxTravelDistance) {
      this.isActive = false;
      return;
    }

    // Check canvas bounds
    if (this.position.x < 0 || this.position.x > variables.canvasWidth ||
        this.position.y < 0 || this.position.y > variables.canvasHeight) {
      this.isActive = false;
      return;
    }

    // Check wall collision
    if (this.currentRoom && this.checkWallCollision()) {
      this.isActive = false;
      return;
    }

    // Check target collision
    for (const target of targets) {
      if (this.checkTargetCollision(target)) {
        target.takeDamage(this.damage);
        this.isActive = false;
        return;
      }
    }
  }

  checkWallCollision() {
    const projectileHitbox = {
      position: this.position,
      width: this.radius * 2,
      height: this.radius * 2,
      getHitboxBounds: () => ({
        x: this.position.x - this.radius,
        y: this.position.y - this.radius,
        width: this.radius * 2,
        height: this.radius * 2
      })
    };

    return this.currentRoom.checkWallCollision(projectileHitbox);
  }

  checkTargetCollision(target) {
    const targetHitbox = target.getHitboxBounds();
    const projectileHitbox = {
      x: this.position.x - this.radius,
      y: this.position.y - this.radius,
      width: this.radius * 2,
      height: this.radius * 2
    };

    return (
      projectileHitbox.x < targetHitbox.x + targetHitbox.width &&
      projectileHitbox.x + projectileHitbox.width > targetHitbox.x &&
      projectileHitbox.y < targetHitbox.y + targetHitbox.height &&
      projectileHitbox.y + projectileHitbox.height > targetHitbox.y
    );
  }

  draw(ctx) {
    if (!this.isActive) return;

    ctx.save();
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
  }
}
```

### 1.4 Actualizar Enemy.js Base

**📍 Modificación:** `videogame/src/classes/entities/Enemy.js`

**🔍 Cambio específico en método `registerKill()`:**

```javascript
async registerKill() {
    try {
        const userId = localStorage.getItem('currentUserId');
        const runId = localStorage.getItem('currentRunId');
        const testMode = localStorage.getItem('testMode') === 'true';
        
        if (!userId || !runId) {
            if (!testMode) {
                console.log('Kill tracking: Requires active session');
            }
            return false;
        }

        const roomId = window.game?.floorGenerator?.getCurrentRoomId();
        const floor = window.game?.floorGenerator?.getCurrentFloor();
        
        // ✅ MAPEO INTELIGENTE V2 - CONSERVADOR
        let enemyType = 'common'; // Por defecto para melee
        
        // RANGED ENEMIES → 'rare'
        if (this.enemyTypeName === 'goblin_archer' || 
            this.enemyTypeName === 'GoblinArcher' ||
            this.enemyTypeName === 'mage_goblin' ||
            this.enemyTypeName === 'MageGoblin' ||
            this.enemyTypeName === 'great_bow_goblin' ||
            this.enemyTypeName === 'GreatBowGoblin' ||
            this.enemyTypeName.toLowerCase().includes('archer') ||
            this.enemyTypeName.toLowerCase().includes('mage') ||
            this.enemyTypeName.toLowerCase().includes('bow')) {
            enemyType = 'rare';
        }

        await registerEnemyKill(runId, {
            userId: parseInt(userId),
            enemyType,  // 'common' o 'rare'
            roomId,
            floor
        });

        return true;
    } catch (error) {
        console.error('Enemy kill registration failed:', error);
        return false;
    }
}
```

---

## 🎮 FASE 2: IMPLEMENTAR TIPOS DE ENEMIGOS

### 2.1 Actualizar GoblinDagger.js (Melee → Common)

**📍 Ubicación:** `videogame/src/classes/enemies/floor1/GoblinDagger.js`

```javascript
/**
 * Goblin Dagger enemy class - UPDATED TO V2
 * Melee enemy type that attacks at close range → MAPS TO 'common'
 */
import { MeleeEnemy } from "../../entities/MeleeEnemy.js";
import { Vec } from "../../../utils/Vec.js";
import { ENEMY_CONSTANTS_V2 } from "../../../constants/gameConstants.js";
import { variables } from "../../../config.js";
import { boxOverlap } from "../../../draw.js";

export class GoblinDagger extends MeleeEnemy {
  constructor(position) {
    const config = ENEMY_CONSTANTS_V2.GOBLIN_DAGGER;

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
      "goblin_dagger" // ← MAPEA A 'common'
    );

    this.attackDuration = config.attackCooldown;
    this.isAttacking = false;
    this.currentDirection = "down";

    // Sprite configuration
    this.spriteScaling = { walk: 1.0, attack: 1.0 };
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
      up: [0, 5], left: [6, 11], down: [12, 17], right: [18, 23]
    };
    return frameRanges[direction] || frameRanges.down;
  }

  getWalkFrames(direction) {
    const frameRanges = {
      up: [0, 8], left: [9, 17], down: [18, 26], right: [27, 35]
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

### 2.2 Crear SwordGoblin.js (Melee → Common)

**📍 Ubicación:** `videogame/src/classes/enemies/floor1/SwordGoblin.js`

```javascript
/**
 * Sword Goblin enemy class - NEW V2
 * Enhanced melee enemy with larger attack range → MAPS TO 'common'
 */
import { MeleeEnemy } from "../../entities/MeleeEnemy.js";
import { Vec } from "../../../utils/Vec.js";
import { ENEMY_CONSTANTS_V2 } from "../../../constants/gameConstants.js";
import { boxOverlap } from "../../../draw.js";

export class SwordGoblin extends MeleeEnemy {
  constructor(position) {
    const config = ENEMY_CONSTANTS_V2.SWORD_GOBLIN;

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
      "sword_goblin" // ← MAPEA A 'common'
    );

    this.attackDuration = config.attackCooldown;
    this.isAttacking = false;
    this.currentDirection = "down";

    this.spriteScaling = { walk: 1.0, attack: 1.0 };
    this.walkSpritePath = "/assets/sprites/enemies/floor1/sword_goblin/walk.png";
    this.attackSpritePath = "/assets/sprites/enemies/floor1/sword_goblin/slash.png";

    this.setSprite(this.walkSpritePath);
    const initialWalkFrames = this.getWalkFrames(this.currentDirection);
    this.setAnimation(initialWalkFrames[0], initialWalkFrames[1], true, 100);
  }

  // Similar implementation to GoblinDagger but with enhanced stats
  // Copy methods from GoblinDagger: moveTo, attack, updateAnimation, etc.
  // Only difference: larger attackRange and more health/damage
}
```

### 2.3 Actualizar GoblinArcher.js (Ranged → Rare)

**📍 Ubicación:** `videogame/src/classes/enemies/floor1/GoblinArcher.js`

```javascript
/**
 * Goblin Archer enemy class - UPDATED TO V2
 * Ranged enemy type that attacks from distance → MAPS TO 'rare'
 */
import { RangedEnemy } from "../../entities/RangedEnemy.js";
import { ENEMY_CONSTANTS_V2 } from "../../../constants/gameConstants.js";
import { Vec } from "../../../utils/Vec.js";
import { Projectile } from "../../entities/Projectile.js";

export class GoblinArcher extends RangedEnemy {
  constructor(position) {
    const config = ENEMY_CONSTANTS_V2.GOBLIN_ARCHER;

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
      config.projectileSpeed || 250,
      "goblin_archer" // ← MAPEA A 'rare'
    );

    this.attackRange = config.attackRange;
    this.attackDuration = config.attackCooldown;
    this.retreatDistance = config.retreatDistance;

    this.isAttacking = false;
    this.isShooting = false;
    this.hasCreatedProjectile = false;
    this.attackCooldown = 0;
    this.currentDirection = "down";

    this.spriteScaling = { walk: 1.0, shoot: 1.0 };
    this.walkSpritePath = "/assets/sprites/enemies/floor1/bow_goblin/walk.png";
    this.shootSpritePath = "/assets/sprites/enemies/floor1/bow_goblin/shoot.png";

    this.setSprite(this.walkSpritePath);
    const initialWalkFrames = this.getWalkFrames(this.currentDirection);
    this.setAnimation(initialWalkFrames[0], initialWalkFrames[1], true, 100);
  }

  // Implement shooting behavior, retreat logic, etc.
  // Full implementation from enemiesV2part2.md
}
```

### 2.4 Crear MageGoblin.js (Ranged → Rare)

**📍 Ubicación:** `videogame/src/classes/enemies/floor1/MageGoblin.js`

```javascript
/**
 * Mage Goblin enemy class - NEW V2
 * Magic-based ranged enemy with slow movement → MAPS TO 'rare'
 */
import { RangedEnemy } from "../../entities/RangedEnemy.js";
import { ENEMY_CONSTANTS_V2 } from "../../../constants/gameConstants.js";
import { Vec } from "../../../utils/Vec.js";

export class MageGoblin extends RangedEnemy {
  constructor(position) {
    const config = ENEMY_CONSTANTS_V2.MAGE_GOBLIN;

    super(
      position,
      config.size.width,
      config.size.height,
      "purple",
      9,
      "mage_goblin",
      config.speed,
      config.damage,
      config.health,
      "magic", // projectile type
      config.attackRange,
      config.projectileRange || 300,
      config.projectileSpeed,
      "mage_goblin" // ← MAPEA A 'rare'
    );

    this.attackDuration = config.attackCooldown;
    this.retreatDistance = config.retreatDistance;
    this.currentDirection = "down";

    this.spriteScaling = { walk: 1.0, spellcast: 1.0 };
    this.walkSpritePath = "/assets/sprites/enemies/floor1/mage_goblin/walk.png";
    this.spellcastSpritePath = "/assets/sprites/enemies/floor1/mage_goblin/spellcast.png";

    this.setSprite(this.walkSpritePath);
    const initialWalkFrames = this.getWalkFrames(this.currentDirection);
    this.setAnimation(initialWalkFrames[0], initialWalkFrames[1], true, 100);
  }

  // Implement spellcasting behavior similar to archer but with magic projectiles
}
```

### 2.5 Crear GreatBowGoblin.js (Ranged → Rare)

**📍 Ubicación:** `videogame/src/classes/enemies/floor1/GreatBowGoblin.js`

```javascript
/**
 * Great Bow Goblin enemy class - NEW V2
 * High-damage long-range archer → MAPS TO 'rare'
 */
import { RangedEnemy } from "../../entities/RangedEnemy.js";
import { ENEMY_CONSTANTS_V2 } from "../../../constants/gameConstants.js";

export class GreatBowGoblin extends RangedEnemy {
  constructor(position) {
    const config = ENEMY_CONSTANTS_V2.GREAT_BOW_GOBLIN;

    super(
      position,
      config.size.width,
      config.size.height,
      "darkred",
      9,
      "great_bow_goblin",
      config.speed,
      config.damage,
      config.health,
      "arrow", // projectile type pero más fuerte
      config.attackRange,
      config.projectileRange || 400,
      config.projectileSpeed,
      "great_bow_goblin" // ← MAPEA A 'rare'
    );

    this.attackDuration = config.attackCooldown;
    this.retreatDistance = config.retreatDistance;
    this.currentDirection = "down";

    this.spriteScaling = { walk: 1.0, shoot: 1.0 };
    this.walkSpritePath = "/assets/sprites/enemies/floor1/great_bow_goblin/walk.png";
    this.shootSpritePath = "/assets/sprites/enemies/floor1/great_bow_goblin/shoot.png";

    this.setSprite(this.walkSpritePath);
    const initialWalkFrames = this.getWalkFrames(this.currentDirection);
    this.setAnimation(initialWalkFrames[0], initialWalkFrames[1], true, 100);
  }

  // Similar to GoblinArcher but with longer range and higher damage
}
```

### 2.6 Actualizar gameConstants.js

**📍 Ubicación:** `videogame/src/constants/gameConstants.js`

**🔄 Agregar al final del archivo:**

```javascript
// ===================================================
// ENEMY CONSTANTS V2 - CONSERVADOR APPROACH
// ===================================================

export const ENEMY_CONSTANTS_V2 = {
    // MELEE ENEMIES (mapean a 'common')
    GOBLIN_DAGGER: {
        size: { width: 32, height: 32 },
        health: 20,
        damage: 10,
        speed: PLAYER_CONSTANTS.BASE_SPEED * 0.7,
        attackRange: 32,
        attackCooldown: 1000,
        backendType: 'common'
    },
    
    SWORD_GOBLIN: {
        size: { width: 32, height: 32 },
        health: 35,
        damage: 12,
        speed: PLAYER_CONSTANTS.BASE_SPEED * 0.6,
        attackRange: 45,
        attackCooldown: 1200,
        backendType: 'common'
    },
    
    // RANGED ENEMIES (mapean a 'rare')
    GOBLIN_ARCHER: {
        size: { width: 32, height: 32 },
        health: 30,
        damage: 15,
        speed: 0,
        attackRange: 200,
        attackCooldown: 2000,
        projectileSpeed: 250,
        retreatDistance: 80,
        backendType: 'rare'
    },
    
    MAGE_GOBLIN: {
        size: { width: 32, height: 32 },
        health: 25,
        damage: 18,
        speed: PLAYER_CONSTANTS.BASE_SPEED * 0.2,
        attackRange: 180,
        attackCooldown: 2500,
        projectileSpeed: 200,
        retreatDistance: 100,
        backendType: 'rare'
    },
    
    GREAT_BOW_GOBLIN: {
        size: { width: 32, height: 32 },
        health: 40,
        damage: 20,
        speed: 0,
        attackRange: 250,
        attackCooldown: 3000,
        projectileSpeed: 350,
        retreatDistance: 120,
        backendType: 'rare'
    }
};
```

### 2.7 Actualizar Room.js para Generación V2

**📍 Ubicación:** `videogame/src/classes/rooms/Room.js`

**🔄 Reemplazar método `generateEnemies()`:**

```javascript
import { GoblinDagger } from "../enemies/floor1/GoblinDagger.js";
import { SwordGoblin } from "../enemies/floor1/SwordGoblin.js";
import { GoblinArcher } from "../enemies/floor1/GoblinArcher.js";
import { MageGoblin } from "../enemies/floor1/MageGoblin.js";
import { GreatBowGoblin } from "../enemies/floor1/GreatBowGoblin.js";

// ... resto del archivo ...

generateEnemies() {
    const enemyCount = Math.floor(Math.random() * (ROOM_CONSTANTS.MAX_ENEMIES - ROOM_CONSTANTS.MIN_ENEMIES + 1)) + ROOM_CONSTANTS.MIN_ENEMIES;

    // ✅ DISTRIBUCIÓN V2 CON PESOS - MAPEO CONSERVADOR
    const enemyTypes = [
        { class: GoblinDagger, weight: 30, type: 'melee' },      // → 'common'
        { class: SwordGoblin, weight: 25, type: 'melee' },       // → 'common'
        { class: GoblinArcher, weight: 20, type: 'ranged' },     // → 'rare'
        { class: MageGoblin, weight: 15, type: 'ranged' },       // → 'rare'
        { class: GreatBowGoblin, weight: 10, type: 'ranged' }    // → 'rare'
    ];
    
    const safeZone = {
        x: 0,
        y: variables.canvasHeight / 2 - ROOM_CONSTANTS.SAFE_ZONE_SIZE.height / 2,
        width: ROOM_CONSTANTS.SAFE_ZONE_SIZE.width,
        height: ROOM_CONSTANTS.SAFE_ZONE_SIZE.height,
    };
    
    for (let i = 0; i < enemyCount; i++) {
        const selectedType = this.weightedRandomSelect(enemyTypes);
        const position = this.getValidEnemyPosition(selectedType.type === 'melee', safeZone);
        
        if (position) {
            const enemy = new selectedType.class(position);
            enemy.setCurrentRoom(this);
            this.objects.enemies.push(enemy);
        }
    }
}

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
```

---

## 🧪 FASE 3: TESTING Y BALANCE

### 3.1 Lista de Verificación

**✅ Testing Básico:**
1. **Cargar juego sin errores**
2. **Generar habitaciones con 5 tipos de enemigos**
3. **Validar comportamientos:**
   - Melee: GoblinDagger y SwordGoblin persiguen agresivamente
   - Ranged: GoblinArcher, MageGoblin, GreatBowGoblin mantienen distancia y disparan

**✅ Testing de Mapeo:**
1. **Verificar registros en base de datos:**
   - GoblinDagger kills → 'common' en enemy_kills
   - SwordGoblin kills → 'common' en enemy_kills
   - GoblinArcher kills → 'rare' en enemy_kills
   - MageGoblin kills → 'rare' en enemy_kills
   - GreatBowGoblin kills → 'rare' en enemy_kills

**✅ Testing de Balance:**
1. **Verificar dificultad progresiva**
2. **Ajustar weights en Room.js si es necesario**
3. **Validar que analytics del admin siguen funcionando**

### 3.2 Comandos de Testing

```bash
# Verificar registros en BD
mysql -u tc2005b -p'qwer1234' dbshatteredtimeline -e "
SELECT enemy_type, COUNT(*) as count 
FROM enemy_kills 
WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
GROUP BY enemy_type;
"

# Ver últimos kills por tipo
mysql -u tc2005b -p'qwer1234' dbshatteredtimeline -e "
SELECT enemy_type, room_id, floor, killed_at 
FROM enemy_kills 
ORDER BY killed_at DESC 
LIMIT 20;
"
```

### 3.3 Balance Sugerido

Si después del testing la dificultad no está balanceada:

**🔄 Ajustar weights en Room.js:**
```javascript
// Distribución más conservadora
const enemyTypes = [
    { class: GoblinDagger, weight: 40, type: 'melee' },      // Más básicos
    { class: SwordGoblin, weight: 20, type: 'melee' },       
    { class: GoblinArcher, weight: 25, type: 'ranged' },     
    { class: MageGoblin, weight: 10, type: 'ranged' },       // Menos magos
    { class: GreatBowGoblin, weight: 5, type: 'ranged' }     // Muy pocos elite
];
```

**🔄 Ajustar stats en gameConstants.js si es necesario**

---

## 📋 CHECKLIST FINAL

### ✅ Archivos a Crear:
- [ ] `src/classes/entities/MeleeEnemy.js`
- [ ] `src/classes/entities/RangedEnemy.js`
- [ ] `src/classes/entities/Projectile.js`
- [ ] `src/classes/enemies/floor1/SwordGoblin.js`
- [ ] `src/classes/enemies/floor1/MageGoblin.js`
- [ ] `src/classes/enemies/floor1/GreatBowGoblin.js`

### ✅ Archivos a Modificar:
- [ ] `src/classes/entities/Enemy.js` (método registerKill)
- [ ] `src/classes/enemies/floor1/GoblinDagger.js` (heredar de MeleeEnemy)
- [ ] `src/classes/enemies/floor1/GoblinArcher.js` (heredar de RangedEnemy)
- [ ] `src/classes/rooms/Room.js` (método generateEnemies)
- [ ] `src/constants/gameConstants.js` (agregar ENEMY_CONSTANTS_V2)

### ✅ Validaciones:
- [ ] Juego carga sin errores
- [ ] 5 tipos de enemigos aparecen en habitaciones
- [ ] Melee enemies mapean a 'common' en BD
- [ ] Ranged enemies mapean a 'rare' en BD
- [ ] Analytics del admin siguen funcionando
- [ ] Balance de juego aceptable

---

## 🎯 RESULTADO ESPERADO

Al completar estos pasos tendremos:

1. **5 tipos de enemigos** funcionando (GoblinDagger, SwordGoblin, GoblinArcher, MageGoblin, GreatBowGoblin)
2. **Mapeo inteligente** a nuestras categorías existentes ('common'/'rare')
3. **Cero cambios** en base de datos y API
4. **Experiencia de juego enriquecida** con comportamientos únicos
5. **Compatibilidad total** con sistema de analytics actual

**Tiempo estimado:** 2.5 semanas (41-60 horas)
**Riesgo:** Mínimo (solo cambios frontend)
**Rollback:** Trivial (restaurar archivos originales) 